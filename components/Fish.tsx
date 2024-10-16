import { Wireframe, useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";

export function Model(opts: any) {
	const group = useRef();
	const { nodes, materials, animations } = useGLTF("/car.glb");
	const { actions } = useAnimations(animations, group);

	useEffect(() => {
		if (actions) {
			actions["Idle.1"]?.reset().play();
		}
	}, [actions]);

	return (
		<group ref={group} position-y={-1.25}>
			<primitive rotation={[-Math.PI / 2, 0, 0]} object={nodes._rootJoint} />
			<skinnedMesh
				geometry={nodes.Fish.geometry}
				material={materials.Mat_Robot}
				skeleton={nodes.Fish.skeleton}
			>
				<Wireframe {...opts} />
			</skinnedMesh>
		</group>
	);
}
useGLTF.preload("/car.glb");