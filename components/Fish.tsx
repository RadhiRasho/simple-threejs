import { useGLTF } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader, ThreeMFLoader } from "three-stdlib";

export default function Model(props: JSX.IntrinsicElements["group"]) {
	const fish = useLoader(ThreeMFLoader, "koifish.3mf");
	return (
		<group {...props} dispose={null}>
			<primitive scale={0.05} object={fish}>
				<wireframeGeometry />
			</primitive>

			<meshBasicMaterial wireframe={true} />
		</group>
	);
}

useGLTF.preload("/fish-transformed.glb");
