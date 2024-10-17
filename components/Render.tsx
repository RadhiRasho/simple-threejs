"use client";
import { Html, OrbitControls, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useControls } from "leva";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import {
	Box3,
	type BufferAttribute,
	BufferGeometry,
	CatmullRomCurve3,
	Clock,
	DataTexture,
	FloatType,
	Line,
	LineBasicMaterial,
	MathUtils,
	Mesh,
	MeshBasicMaterial,
	NearestFilter,
	RGBFormat,
	type Scene,
	Vector2,
	Vector3,
	type WebGLProgramParametersWithUniforms,
} from "three";

import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/Addons.js";

type Props = {
	position: [number, number, number];
};

type Uniform = {
	uSpatialTexture: { value: DataTexture };
	uTextureSize: { value: Vector2 };
	uTime: { value: number };
	uLengthRatio: { value: number };
	uObjSize: { value: Vector3 };
};

function Fish(props: Props) {
	const backgrounMeshRef = useRef<Mesh>(null);
	const forgroundMeshRef = useRef<Mesh>(null);
	const [oUs, setOUs] = useState<Uniform[]>([]);
	const [curve, setCurve] = useState<CatmullRomCurve3>();
	const clock = useRef(new Clock());
	const fish = useLoader(STLLoader, "fish.stl");

	const vertexShader = useCallback(
		(shader: WebGLProgramParametersWithUniforms) => {
			const vertexShader = `
		uniform sampler2D uSpatialTexture;
		uniform vec2 uTextureSize;
		uniform float uTime;
		uniform float uLengthRatio;
		uniform vec3 uObjSize;

		struct splineData {
			vec3 point;
			vec3 binormal;
			vec3 normal;
		};

		splineData getSplineData(float t){
			float step = 1. / uTextureSize.y;
			float halfStep = step * 0.5;
			splineData sd;
			sd.point    = texture2D(uSpatialTexture, vec2(t, step * 0. + halfStep)).rgb;
			sd.binormal = texture2D(uSpatialTexture, vec2(t, step * 1. + halfStep)).rgb;
			sd.normal   = texture2D(uSpatialTexture, vec2(t, step * 2. + halfStep)).rgb;
			return sd;
		}
  		${shader.vertexShader}
		`;

			return vertexShader;
		},
		[],
	);

	useEffect(() => {
		// path
		const baseVector = new Vector3(40, 0, 0);
		const axis = new Vector3(0, 1, 0);
		const cPts = [];
		const cSegments = 6;
		const cStep = (Math.PI * 2) / cSegments;
		for (let i = 0; i < cSegments; i++) {
			cPts.push(
				new Vector3()
					.copy(baseVector)
					// .setLength(35 + (Math.random() - 0.5) * 5)
					.applyAxisAngle(axis, cStep * i)
					.setY(MathUtils.randFloat(-10, 10)),
			);
		}
		const curve = new CatmullRomCurve3(cPts);
		curve.closed = true;
		setCurve(curve);

		console.log(curve);

		const numPoints = 511;
		const cPoints = curve.getSpacedPoints(numPoints);
		const cObjects = curve.computeFrenetFrames(numPoints, true);
		const pGeom = new BufferGeometry().setFromPoints(cPoints);
		const pMat = new LineBasicMaterial({ color: "yellow" });
		const pathLine = new Line(pGeom, pMat);
		if (!backgrounMeshRef.current?.children.includes(pathLine))
			backgrounMeshRef.current?.add(pathLine);

		// data texture
		const data = [];
		for (const v of cPoints) {
			data.push(v.x, v.y, v.z);
		}
		for (const v of cObjects.binormals) {
			data.push(v.x, v.y, v.z);
		}
		for (const v of cObjects.normals) {
			data.push(v.x, v.y, v.z);
		}
		for (const v of cObjects.tangents) {
			data.push(v.x, v.y, v.z);
		}

		const dataArray = new Float32Array(data);

		const tex = new DataTexture(
			dataArray,
			numPoints + 1,
			4,
			RGBFormat,
			FloatType,
		);
		tex.magFilter = NearestFilter;

		fish.center();
		fish.rotateX(-0.6);
		const objBox = new Box3().setFromBufferAttribute(
			fish.getAttribute("position") as BufferAttribute,
		);
		const objSize = new Vector3();
		objBox.getSize(objSize);

		const objUniforms = {
			uSpatialTexture: { value: tex },
			uTextureSize: { value: new Vector2(numPoints + 1, 4) },
			uTime: { value: 0 },
			uLengthRatio: { value: objSize.z / curve.getLength() },
			uObjSize: { value: objSize },
		};

		setOUs((curr) => [...curr, objUniforms]);

		const objMat = new MeshBasicMaterial({
			color: 0xff6600,
			wireframe: true,
		});

		objMat.onBeforeCompile = (shader) => {
			shader.uniforms.uSpatialTexture = objUniforms.uSpatialTexture;
			shader.uniforms.uTextureSize = objUniforms.uTextureSize;
			shader.uniforms.uTime = objUniforms.uTime;
			shader.uniforms.uLengthRatio = objUniforms.uLengthRatio;
			shader.uniforms.uObjSize = objUniforms.uObjSize;

			shader.vertexShader = vertexShader(shader);
			shader.vertexShader = shader.vertexShader.replace(
				"#include <begin_vertex>;",
				`#include <begin_vertex>;
					vec3 pos = position;

					float wStep = 1. / uTextureSize.x;
					float hWStep = wStep * 0.5;

					float d = pos.z / uObjSize.z;
					float t = fract((uTime * 0.1) + (d * uLengthRatio));
					float numPrev = floor(t / wStep);
					float numNext = numPrev + 1.;
					//numNext = numNext > (uTextureSize.x - 1.) ? 0. : numNext;
					float tPrev = numPrev * wStep + hWStep;
					float tNext = numNext * wStep + hWStep;
					//float tDiff = tNext - tPrev;
					splineData splinePrev = getSplineData(tPrev);
					splineData splineNext = getSplineData(tNext);

					float f = (t - tPrev) / wStep;
					vec3 P = mix(splinePrev.point, splineNext.point, f);
					vec3 B = mix(splinePrev.binormal, splineNext.binormal, f);
					vec3 N = mix(splinePrev.normal, splineNext.normal, f);

					transformed = P + (N * pos.x) + (B * pos.y);`,
			);
		};

		const obj = new Mesh(fish, objMat);
		forgroundMeshRef.current?.add(obj);
	}, [vertexShader, fish]);

	useFrame((state, delta) => {
		if (curve && forgroundMeshRef.current) {
			// Update the clock using delta
			const elapsedTime = (clock.current?.getElapsedTime() || 0) + delta;
			const t = (elapsedTime % 10) / 10; // Normalize time to [0, 1]

			// Update uniforms
			for (const ou of oUs) {
				ou.uTime.value = t;
			}

			// Get position and tangent at the current time
			const position = curve.getPointAt(t);
			const tangent = curve.getTangentAt(t);

			// Update position
			forgroundMeshRef.current.position.copy(position);
			forgroundMeshRef.current.lookAt(position.clone().add(tangent));
		}
	});

	return (
		<mesh ref={backgrounMeshRef} {...props}>
			<mesh scale={0.5} ref={forgroundMeshRef} {...props} />
		</mesh>
	);
}

function Loader() {
	const { progress } = useProgress();
	return <Html center>{progress} % loaded</Html>;
}

export default function Render() {
	return (
		<Canvas
			dpr={[1, 1.5]}
			camera={{ position: [0, 0, 15], fov: 25 }}
			className="h-full w-full"
		>
			<Suspense fallback={<Loader />}>
				<color attach={"background"} args={["black"]} />
				<ambientLight intensity={0.1} />
				<directionalLight position={[10, 10, 10]} intensity={0.5} />
				<directionalLight
					castShadow
					position={[10, 10, 10]}
					intensity={1.3}
					shadow-mapSize-width={1024}
					shadow-mapSize-height={1024}
					shadow-camera-far={10}
					shadow-camera-left={-30}
					shadow-camera-right={10}
					shadow-camera-top={40}
					shadow-camera-bottom={-10}
				/>
				<spotLight intensity={0.5} position={[90, 100, 50]} castShadow />
				<Fish position={[-3, 0, 0]} />
				<OrbitControls
					enablePan={true}
					enableZoom={true}
					minPolarAngle={0}
					maxPolarAngle={Math.PI / 2}
				/>
			</Suspense>
		</Canvas>
	);
}
