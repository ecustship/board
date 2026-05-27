import React, { useEffect, Suspense, useState, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function EngineModelInner({ faultAlarm }) {
  const { scene } = useGLTF('/internal_combustion_engine/scene.gltf', true);
  const [ready, setReady] = useState(false);
  const groupRef = useRef();

  useEffect(() => {
    if (!scene) return;

    scene.rotation.set(0, 0, 0);
    scene.position.set(0, 0, 0);

    // Ensure transforms are up-to-date before measuring
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 8.62;
    const scale = targetSize / maxDim;

    // Apply scale then re-measure to compute the scaled center precisely
    scene.scale.setScalar(scale);
    scene.updateMatrixWorld(true);

    const scaledBox = new THREE.Box3().setFromObject(scene);
    const scaledCenter = new THREE.Vector3();
    scaledBox.getCenter(scaledCenter);

    // Center the model at world origin, so OrbitControls target can be [0,0,0]
    scene.position.sub(scaledCenter);
    scene.updateMatrixWorld(true);

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: child.material.color ? child.material.color.clone() : new THREE.Color(0x888888),
            metalness: 0.6,
            roughness: 0.4,
          });
        }
      }
    });

    setReady(true);
  }, [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (faultAlarm) {
      const t = clock.getElapsedTime();
      const intensity = Math.sin(t * 4) * 0.5 + 0.5;
      groupRef.current.children.forEach((child) => {
        if (child.isMesh && child.material) {
          if (!child._originalEmissive) {
            child._originalEmissive = child.material.emissive
              ? child.material.emissive.clone()
              : new THREE.Color(0, 0, 0);
          }
          child.material.emissive = new THREE.Color(
            child._originalEmissive.r + 0.3 * intensity,
            child._originalEmissive.g * (1 - intensity * 0.8),
            child._originalEmissive.b * (1 - intensity * 0.8)
          );
          child.material.emissiveIntensity = intensity * 2;
        }
      });
    } else {
      groupRef.current.children.forEach((child) => {
        if (child.isMesh && child.material && child._originalEmissive) {
          child.material.emissive = child._originalEmissive.clone();
          child.material.emissiveIntensity = 0;
        }
      });
    }
  });

  if (!ready) return null;
  return <group ref={groupRef}><primitive object={scene} /></group>;
}

function CenterLockedControls({ autoRotate = false, autoRotateSpeed = 0.6 }) {
  const controlsRef = useRef();
  const { camera } = useThree();

  // Lock target to model center (world origin) deterministically.
  useFrame(() => {
    if (!controlsRef.current) return;
    const t = controlsRef.current.target;
    if (t.x !== 0 || t.y !== 0 || t.z !== 0) {
      t.set(0, 0, 0);
    }
    controlsRef.current.update();
  });

  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
      minDistance={2.0}
      maxDistance={14}
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
    />
  );
}

function EngineModelScene({ faultAlarm, autoRotate = false, autoRotateSpeed = 0.6 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return (
    <Suspense fallback={<EngineFallback />}>
      <EngineModelInner faultAlarm={faultAlarm} />
      {/* Avoid HDR fetch errors in CRA builds by using lights only. */}
      <ContactShadows position={[0, -0.05, 0]} opacity={0.4} scale={8} blur={2} far={3} />
      <CenterLockedControls autoRotate={autoRotate} autoRotateSpeed={autoRotateSpeed} />
    </Suspense>
  );
}

// 游艇模型组件
function YachtModelScene() {
  const { scene } = useGLTF('/costa_voyager/scene.gltf', true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scene) return;

    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const targetSize = 9;
    const scale = targetSize / Math.max(size.x, size.z);
    scene.scale.setScalar(scale);
    scene.position.x = -center.x * scale;
    scene.position.z = -center.z * scale;
    scene.position.y = -box.min.y * scale;

    setReady(true);
  }, [scene]);

  if (!ready) return null;
  return <primitive object={scene} />;
}

function YachtFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.3, 1]} />
      <meshStandardMaterial color="#4CD7D0" wireframe />
    </mesh>
  );
}

function EngineFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#cccccc" />
    </mesh>
  );
}

// 游艇展示组件 - 用于导航视图
export function YachtModel({ rotationY = 0, autoRotate = true, faultAlarm = false }) {
  return (
    <div className="w-full h-full cursor-grab active:cursor-grabbing">
      <Canvas shadows camera={{ position: [0, 3, 8], fov: 50 }} style={{ width: "100%", height: "100%" }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3, 4, -3]} intensity={0.5} />
        <Suspense fallback={<YachtFallback />}>
          <group rotation={[0, rotationY, 0]}>
            <YachtModelScene />
          </group>
        </Suspense>
        <OrbitControls
          enablePan={false}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 2}
          minDistance={3}
          maxDistance={20}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
        />
      </Canvas>
    </div>
  );
}

// 引擎展示组件 - 用于主引擎视图
export function EngineModel({ autoRotate = true, faultAlarm = false }) {
  return (
    <div className="w-full h-full" style={{ minHeight: '300px' }}>
      <Canvas camera={{ position: [0, 0.9, 3.1], fov: 38 }} gl={{ antialias: true }} style={{ width: '100%', height: '100%' }} shadows>
        <color attach="background" args={['#f0f0f0']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-3, 3, -3]} intensity={0.8} />
        <directionalLight position={[0, -2, 2]} intensity={0.4} />
        <spotLight position={[0, 5, 0]} intensity={0.5} angle={0.5} penumbra={0.5} />
        <EngineModelScene faultAlarm={faultAlarm} autoRotate={autoRotate} autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}

// 引擎系统组件 - 用于 EngineSystems 页面 (无故障高亮)
export function EngineSystemsModel() {
  return (
    <div className="w-full h-full" style={{ minHeight: '300px' }}>
      <Canvas camera={{ position: [0, 0.9, 2.7], fov: 38 }} gl={{ antialias: true }} style={{ width: '100%', height: '100%' }} shadows>
        <color attach="background" args={['#f0f0f0']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-3, 3, -3]} intensity={0.8} />
        <directionalLight position={[0, -2, 2]} intensity={0.4} />
        <spotLight position={[0, 5, 0]} intensity={0.5} angle={0.5} penumbra={0.5} />
        <EngineModelScene faultAlarm={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
    </div>
  );
}

// 趋势页面引擎组件
export function TrendEngineModel() {
  return (
    <div className="w-full h-full" style={{ minHeight: '200px' }}>
      <Canvas camera={{ position: [0, 0.9, 2.4], fov: 38 }} gl={{ antialias: true }} style={{ width: '100%', height: '100%' }} shadows>
        <color attach="background" args={['#f0f0f0']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow shadow-mapSize={[2048, 2048]} />
        <directionalLight position={[-3, 3, -3]} intensity={0.8} />
        <directionalLight position={[0, -2, 2]} intensity={0.4} />
        <spotLight position={[0, 5, 0]} intensity={0.5} angle={0.5} penumbra={0.5} />
        <EngineModelScene faultAlarm={false} autoRotate autoRotateSpeed={0.6} />
      </Canvas>
    </div>
  );
}

// 预加载模型
useGLTF.preload('/internal_combustion_engine/scene.gltf', true);
useGLTF.preload('/costa_voyager/scene.gltf', true);
