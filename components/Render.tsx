"use client";
import { Html, OrbitControls, useGLTF, useProgress } from "@react-three/drei";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type * as THREE from "three";
import { ThreeMFLoader } from "three/examples/jsm/Addons.js";

type Props = {
	position: [number, number, number];
};

function Fish(props: Props) {
	const meshRef = useRef<THREE.Mesh>(null);
	const fish = useLoader(ThreeMFLoader, "koifish.3mf");

	return (
		<mesh {...props} ref={meshRef}>
			<primitive wireframe={true} object={fish} scale={0.1} />
			<meshBasicMaterial wireframe={true} />
			<meshStandardMaterial wireframe={true} />
		</mesh>
	);
}

useGLTF.preload("fish.gltf");

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
				<directionalLight position={[40, 10, 5]} intensity={0.2} />
				<directionalLight
					castShadow
					position={[10, 420, 100]}
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
				<Fish position={[1.2, 0, 0]} />
				<OrbitControls
					enablePan={true}
					enableZoom={true}
					minPolarAngle={Math.PI / 2}
					maxPolarAngle={Math.PI / 2}
				/>
			</Suspense>
		</Canvas>
	);
}
