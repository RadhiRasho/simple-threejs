import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame, useGraph } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
	type AnimationClip,
	type Bone,
	type Color,
	type Group,
	Mesh,
	MeshBasicMaterial,
	type SkinnedMesh,
} from "three";
import { type GLTF, SkeletonUtils } from "three-stdlib";

type ActionName = "ArmatureAction";

interface GLTFAction extends AnimationClip {
	name: ActionName;
}

type GLTFResult = GLTF & {
	nodes: {
		fish: SkinnedMesh;
		Bone: Bone;
	};
	materials: Record<string, MeshBasicMaterial>;
	animations: GLTFAction[];
};

export function Model(props: JSX.IntrinsicElements["group"]) {
	const group = useRef<Group>(null);
	const { scene, animations } = useGLTF("/koifish.glb");
	const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
	const { nodes } = useGraph(clone) as unknown as GLTFResult;
	const { actions } = useAnimations(animations, group);

	const wireframeMaterial = new MeshBasicMaterial({
		wireframe: true,
		color: 0xff6600,
	});

	if (nodes.fish.material) {
		nodes.fish.material = wireframeMaterial;
	}

	useFrame((state, delta) => {
		if (actions.ArmatureAction) {
			actions.ArmatureAction.clampWhenFinished = true;
			actions.ArmatureAction.play();
		}
	});

	return (
		<group ref={group} {...props} dispose={null}>
			<group name="Scene">
				<group name="Armature" position={[-11.357, -0.847, 38.177]}>
					<primitive object={nodes.Bone} />
					<skinnedMesh
						name="fish"
						geometry={nodes.fish.geometry}
						material={nodes.fish.material}
						skeleton={nodes.fish.skeleton}
					/>
				</group>
			</group>
		</group>
	);
}

useGLTF.preload("/koifish.glb");
