"use client";
import { Html, OrbitControls, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import {
	BufferGeometry,
	CatmullRomCurve3,
	Clock,
	LineBasicMaterial,
	type Mesh,
	Vector3,
} from "three";
import { ThreeMFLoader } from "three/examples/jsm/Addons.js";

type Props = {
	position: [number, number, number];
};
function Fish(props: Props) {
	const meshRef = useRef<Mesh>(null);
	const fish = useLoader(ThreeMFLoader, "koifish.3mf");

	// Animation state
	const clock = new Clock();

	useFrame(() => {
		if (meshRef.current) {
			const elapsedTime = clock.getElapsedTime();
			const radius = 5;
			const speed = 0.5;

			// Calculate the new position
			const x = radius * Math.cos(speed * elapsedTime);
			const z = radius * Math.sin(speed * elapsedTime);

			// Calculate the direction vector
			const nextX = radius * Math.cos(speed * (elapsedTime + 0.01));
			const nextZ = radius * Math.sin(speed * (elapsedTime + 0.01));
			const direction = new Vector3(nextX - x, 0, nextZ - z).normalize();

			// Update the position
			meshRef.current.position.set(x, 0, z);

			// Update the rotation to face the direction of movement
			meshRef.current.lookAt(x + direction.x, 0, z + direction.z);
		}
	});

	return (
		<mesh ref={meshRef} {...props} dispose={null}>
			<primitive object={fish} scale={0.1} />
			<meshBasicMaterial wireframe={true} />
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
				<color attach={"background"} args={["white"]} />
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
