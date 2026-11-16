import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Hero3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 550;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Group to hold all rotatable objects
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Cryptographic Monolith (Ballot Prism)
    const monolithGeo = new THREE.BoxGeometry(1.6, 2.6, 0.45);
    const monolithMat = new THREE.MeshStandardMaterial({
      color: 0x0c0d12,
      roughness: 0.12,
      metalness: 0.9,
    });
    const monolith = new THREE.Mesh(monolithGeo, monolithMat);
    mainGroup.add(monolith);

    // Beveled Edge Accent for Monolith
    const edgesGeo = new THREE.EdgesGeometry(monolithGeo);
    const edgesMat = new THREE.LineBasicMaterial({ color: 0xFFD426, transparent: true, opacity: 0.35 });
    const wireframe = new THREE.LineSegments(edgesGeo, edgesMat);
    monolith.add(wireframe);

    // 2. Sculptural Electric Gold Orbiting Ribbon Knot (homage to Reference Image 1 & 2)
    const ribbonGeo = new THREE.TorusKnotGeometry(2.0, 0.08, 160, 32, 2, 3);
    const ribbonMat = new THREE.MeshStandardMaterial({
      color: 0xFFD426,
      roughness: 0.18,
      metalness: 0.95,
      emissive: 0x3d3000,
    });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    mainGroup.add(ribbon);

    // 3. Floating Golden Orbital Spheres
    const sphereGeo = new THREE.SphereGeometry(0.18, 32, 32);
    const goldSphereMat = new THREE.MeshStandardMaterial({
      color: 0xFFD426,
      roughness: 0.1,
      metalness: 0.98,
      emissive: 0x4a3b00,
    });

    const sphere1 = new THREE.Mesh(sphereGeo, goldSphereMat);
    const sphere2 = new THREE.Mesh(sphereGeo, goldSphereMat);
    sphere2.scale.set(0.65, 0.65, 0.65);
    mainGroup.add(sphere1);
    mainGroup.add(sphere2);

    // 4. Floating Cryptographic Particles
    const particlesCount = 120;
    const particlePositions = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 8;
      particlePositions[i + 1] = (Math.random() - 0.5) * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 6;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xFFD426,
      size: 0.045,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xFFD426, 3.2);
    goldKeyLight.position.set(4, 5, 4);
    scene.add(goldKeyLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
    rimLight.position.set(-4, -3, -3);
    scene.add(rimLight);

    const centerPointLight = new THREE.PointLight(0xFFD426, 2.5, 8);
    centerPointLight.position.set(0, 0, 2);
    scene.add(centerPointLight);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      targetX = (x / rect.width) * 0.8;
      targetY = (y / rect.height) * 0.8;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Continuous rhythmic rotations
      monolith.rotation.y = Math.sin(elapsedTime * 0.4) * 0.25;
      monolith.rotation.x = Math.cos(elapsedTime * 0.3) * 0.15;

      ribbon.rotation.x = elapsedTime * 0.25;
      ribbon.rotation.y = elapsedTime * 0.35;
      ribbon.rotation.z = Math.sin(elapsedTime * 0.2) * 0.2;

      // Orbiting spheres
      sphere1.position.x = Math.cos(elapsedTime * 0.8) * 2.4;
      sphere1.position.y = Math.sin(elapsedTime * 0.8) * 1.6;
      sphere1.position.z = Math.sin(elapsedTime * 0.8) * 2.0;

      sphere2.position.x = Math.cos(elapsedTime * -1.1 + Math.PI) * 2.1;
      sphere2.position.y = Math.sin(elapsedTime * -0.9) * 1.8;
      sphere2.position.z = Math.sin(elapsedTime * -1.1 + Math.PI) * 1.5;

      // Subtle particle float
      particles.rotation.y = elapsedTime * 0.03;

      // Smooth mouse lerp
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;
      mainGroup.rotation.y = mouseX * 0.5;
      mainGroup.rotation.x = mouseY * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      monolithGeo.dispose();
      monolithMat.dispose();
      ribbonGeo.dispose();
      ribbonMat.dispose();
      sphereGeo.dispose();
      goldSphereMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] lg:h-[600px] flex items-center justify-center">
      {/* Background Golden Halo / Sun (Inspiration Image 2) */}
      <div className="absolute w-[300px] sm:w-[400px] lg:w-[460px] h-[300px] sm:h-[400px] lg:h-[460px] rounded-full bg-[#FFD426]/12 blur-3xl pointer-events-none" />
      <div className="absolute w-[180px] sm:w-[260px] h-[180px] sm:h-[260px] rounded-full bg-[#FFD426]/20 blur-xl pointer-events-none" />

      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full relative z-10 cursor-grab active:cursor-grabbing" />

      {/* Floating Micro-Badge on 3D Canvas */}
      <div className="absolute bottom-4 right-4 z-20 hidden sm:flex items-center space-x-2 bg-[#0F1115]/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#232730] text-[10px] font-mono text-[#8B909D]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD426] animate-pulse" />
        <span>INTERACTIVE CRYPTOGRAPHIC MONOLITH</span>
      </div>
    </div>
  );
}
export default Hero3D;
