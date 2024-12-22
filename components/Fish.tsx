import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { AnimationClip, Group, Material, Mesh } from "three";
import type { GLTF } from "three-stdlib";

type ActionName = "PlaneAction" | "fishAction";

interface GLTFAction extends AnimationClip {
	name: ActionName;
}

type GLTFResult = GLTF & {
	nodes: {
		Plane: Mesh;
		fish: Mesh;
	};
	materials: Record<string, Material>;
	animations: GLTFAction[];
};

export function Model(props: JSX.IntrinsicElements["group"]) {
	const group = useRef<Group>(null);
	const { nodes, animations } = useGLTF(
		"/koifish.glb",
	) as unknown as GLTFResult;
	const { actions } = useAnimations(animations, group);

	useFrame((state, delta) => {
		// Ensure the actions are being played in the useFrame hook

		if (actions.PlaneAction) {
			actions.PlaneAction.play();
		}

		if (actions.fishAction) {
			actions.fishAction.play();
		}
	});

	return (
		<group ref={group} {...props} dispose={null}>
			<group name="Scene">
				<mesh
					name="Plane"
					geometry={nodes.Plane.geometry}
					material={nodes.Plane.material}
					position={[1.686, 12.954, -12.366]}
					rotation={[0, 0.047, -Math.PI / 2]}
					scale={[6.085, 3.356, 17.66]}
				>
					<mesh
						name="fish"
						geometry={nodes.fish.geometry}
						material={nodes.fish.material}
						position={[0.116, 0.282, 0.156]}
						rotation={[0.124, 0.116, 1.578]}
						scale={[0.147, 0.077, 0.02]}
					/>
				</mesh>
			</group>
		</group>
	);
}

useGLTF.preload("/koifish.glb");
