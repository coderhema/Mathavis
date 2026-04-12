import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Geometry3DData } from '../../types';
import { RotateCcw, ZoomIn, ZoomOut, Scissors, Box, Circle, Pyramid, Disc, RefreshCw } from 'lucide-react';

interface Geometry3DVisProps {
  data: Geometry3DData;
}

const Geometry3DVis: React.FC<Geometry3DVisProps> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const clippingPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0.5));
  
  const [isSlicing, setIsSlicing] = useState(false);
  const [sliceOffset, setSliceOffset] = useState(0.5);
  const [autoRotate, setAutoRotate] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // dark slate 900
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.localClippingEnabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 1);
    pointLight.position.set(-5, -5, -5);
    scene.add(pointLight);

    // Grid
    const grid = new THREE.GridHelper(10, 10, 0x334155, 0x1e293b);
    scene.add(grid);

    // Geometry
    updateGeometry(data);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (meshRef.current && autoRotate) {
        meshRef.current.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !cameraRef.current) return;

      const deltaMove = {
        x: e.clientX - previousMousePosition.x,
        y: e.clientY - previousMousePosition.y
      };

      const rotationSpeed = 0.005;
      
      // Rotate around Y axis
      const quaternionY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaMove.x * rotationSpeed);
      cameraRef.current.position.applyQuaternion(quaternionY);
      
      // Rotate around X axis (local)
      const right = new THREE.Vector3().setFromMatrixColumn(cameraRef.current.matrix, 0);
      const quaternionX = new THREE.Quaternion().setFromAxisAngle(right, deltaMove.y * rotationSpeed);
      cameraRef.current.position.applyQuaternion(quaternionX);
      
      cameraRef.current.lookAt(0, 0, 0);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!cameraRef.current) return;
      const zoomSpeed = 0.001;
      const distance = cameraRef.current.position.length();
      const newDistance = Math.max(1, Math.min(10, distance + e.deltaY * zoomSpeed));
      cameraRef.current.position.setLength(newDistance);
    };

    // Touch Handlers
    let initialTouchDistance = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        initialTouchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging && cameraRef.current) {
        const deltaMove = {
          x: e.touches[0].clientX - previousMousePosition.x,
          y: e.touches[0].clientY - previousMousePosition.y
        };

        const rotationSpeed = 0.005;
        const quaternionY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), deltaMove.x * rotationSpeed);
        cameraRef.current.position.applyQuaternion(quaternionY);
        const right = new THREE.Vector3().setFromMatrixColumn(cameraRef.current.matrix, 0);
        const quaternionX = new THREE.Quaternion().setFromAxisAngle(right, deltaMove.y * rotationSpeed);
        cameraRef.current.position.applyQuaternion(quaternionX);
        cameraRef.current.lookAt(0, 0, 0);
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2 && cameraRef.current) {
        const currentDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const zoomFactor = initialTouchDistance / currentDistance;
        const distance = cameraRef.current.position.length();
        const newDistance = Math.max(1, Math.min(10, distance * zoomFactor));
        cameraRef.current.position.setLength(newDistance);
        initialTouchDistance = currentDistance;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    const container = containerRef.current;
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel);
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate]);

  useEffect(() => {
    updateGeometry(data);
  }, [data]);

  useEffect(() => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshPhongMaterial;
      material.clippingPlanes = isSlicing ? [clippingPlaneRef.current] : [];
      clippingPlaneRef.current.constant = sliceOffset;
    }
  }, [isSlicing, sliceOffset]);

  const updateGeometry = (geometryData: Geometry3DData) => {
    if (!sceneRef.current) return;

    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
    }

    let geometry: THREE.BufferGeometry;
    const p = geometryData.params || {};

    switch (geometryData.shape) {
      case 'sphere':
        geometry = new THREE.SphereGeometry(p.radius || 1, 32, 32);
        break;
      case 'cone':
        geometry = new THREE.ConeGeometry(p.radius || 1, p.height || 2, 32);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(p.radius || 1, p.radius || 1, p.height || 2, 32);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(p.width || 1.5, p.height || 1.5, p.depth || 1.5);
        break;
      case 'torus':
        geometry = new THREE.TorusGeometry(p.radius || 1, (p.radius || 1) * 0.4, 16, 100);
        break;
      case 'paraboloid':
        // Custom paraboloid using ParametricGeometry or Lathe
        const points = [];
        for (let i = 0; i < 10; i++) {
          points.push(new THREE.Vector2(Math.sqrt(i * 0.1), i * 0.1));
        }
        geometry = new THREE.LatheGeometry(points, 32);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = new THREE.MeshPhongMaterial({
      color: 0x3b82f6,
      specular: 0x111111,
      shininess: 30,
      side: THREE.DoubleSide,
      clippingPlanes: isSlicing ? [clippingPlaneRef.current] : [],
      clipShadows: true,
    });

    const mesh = new THREE.Mesh(geometry, material);
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

    // Add wireframe overlay
    const wireframe = new THREE.LineSegments(
      new THREE.WireframeGeometry(geometry),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.1 })
    );
    mesh.add(wireframe);
  };

  const resetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(2, 2, 2);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-full group">
      <div ref={containerRef} className="w-full h-full cursor-move" />
      
      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex flex-col md:flex-row justify-between items-start gap-3 pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-2 rounded-xl flex flex-row md:flex-col gap-2 pointer-events-auto">
           <button 
            onClick={resetCamera}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors flex items-center gap-2"
            title="Reset View"
          >
            <RotateCcw size={18} />
            <span className="md:hidden text-[10px] font-bold uppercase">Reset</span>
          </button>
          <button 
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${autoRotate ? 'bg-brand-blue text-white' : 'hover:bg-slate-800 text-slate-300'}`}
            title={autoRotate ? "Stop Auto-Rotate" : "Start Auto-Rotate"}
          >
            <RefreshCw size={18} className={autoRotate ? 'animate-spin-slow' : ''} />
            <span className="md:hidden text-[10px] font-bold uppercase">Rotate</span>
          </button>
          <button 
            onClick={() => setIsSlicing(!isSlicing)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isSlicing ? 'bg-brand-blue text-white' : 'hover:bg-slate-800 text-slate-300'}`}
            title="Slice Object"
          >
            <Scissors size={18} />
            <span className="md:hidden text-[10px] font-bold uppercase">Slice</span>
          </button>
        </div>

        {isSlicing && (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-3 rounded-xl flex flex-col gap-2 animate-in slide-in-from-top md:slide-in-from-left-2 pointer-events-auto w-full md:w-auto">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Slice Offset</span>
            <input 
              type="range" 
              min="-1" 
              max="1" 
              step="0.01" 
              value={sliceOffset} 
              onChange={(e) => setSliceOffset(parseFloat(e.target.value))}
              className="w-full md:w-32 accent-brand-blue"
            />
          </div>
        )}
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-xl">
        <div className="flex items-center gap-2">
          {data.shape === 'sphere' && <Circle size={14} className="text-brand-blue" />}
          {data.shape === 'box' && <Box size={14} className="text-brand-blue" />}
          {data.shape === 'cone' && <Pyramid size={14} className="text-brand-blue" />}
          {data.shape === 'torus' && <Disc size={14} className="text-brand-blue" />}
          <span className="text-xs font-bold text-slate-200 capitalize">{data.label}</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Drag to Rotate • Scroll to Zoom
        </div>
      </div>
    </div>
  );
};

export default Geometry3DVis;
