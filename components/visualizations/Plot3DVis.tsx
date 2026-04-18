
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import * as math from 'mathjs';
import { Plot3DData } from '../../types';
import { Maximize, RotateCcw, RefreshCw } from 'lucide-react';

interface Plot3DVisProps {
  data: Plot3DData;
  isStatic?: boolean;
}

const Plot3DVis: React.FC<Plot3DVisProps> = ({ data, isStatic = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const labelRendererRef = useRef<CSS2DRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [autoRotate, setAutoRotate] = useState(isStatic);
  const autoRotateRef = useRef(autoRotate);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    const isDark = document.documentElement.classList.contains('dark');
    scene.background = new THREE.Color(isDark ? 0x0f172a : 0xf8fafc);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(8, 8, 8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width, height);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    containerRef.current.appendChild(labelRenderer.domElement);
    labelRendererRef.current = labelRenderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    if (isStatic) {
      controls.enabled = false;
    }
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Grid Helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x94a3b8, 0xcbd5e1);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Axes Helper
    const axesHelper = new THREE.AxesHelper(12);
    scene.add(axesHelper);

    // Add HTML Labels for Axes
    const createLabel = (text: string, x: number, y: number, z: number) => {
      const div = document.createElement('div');
      div.className = 'text-[10px] font-bold text-slate-500 bg-white/80 dark:bg-slate-800/80 px-1 rounded border border-slate-200 dark:border-slate-700';
      
      // Render KaTeX if available
      if (window.katex) {
        try {
          window.katex.render(text, div, { throwOnError: false });
        } catch (e) {
          div.textContent = text;
        }
      } else {
        div.textContent = text;
      }

      const label = new CSS2DObject(div);
      label.position.set(x, y, z);
      return label;
    };

    scene.add(createLabel('x', 13, 0, 0));
    scene.add(createLabel('y', 0, 13, 0));
    scene.add(createLabel('z', 0, 0, 13));

    let geometry: THREE.PlaneGeometry | null = null;
    let material: THREE.MeshPhongMaterial | null = null;

    // Surface Generation
    try {
      const { formula, xRange, yRange } = data;
      const node = math.parse(formula);
      const code = node.compile();

      const segments = 40;
      const xMin = xRange[0];
      const xMax = xRange[1];
      const yMin = yRange[0];
      const yMax = yRange[1];
      const surfaceWidth = xMax - xMin;
      const surfaceHeight = yMax - yMin;
      const safeWidth = surfaceWidth || 1;
      const safeHeight = surfaceHeight || 1;

      geometry = new THREE.PlaneGeometry(surfaceWidth, surfaceHeight, segments, segments);
      const vertices = geometry.attributes.position.array as Float32Array;

      for (let i = 0; i < vertices.length; i += 3) {
        const localX = vertices[i];
        const localY = vertices[i + 1];

        const x = xMin + ((localX + safeWidth / 2) / safeWidth) * (xMax - xMin);
        const y = yMin + ((localY + safeHeight / 2) / safeHeight) * (yMax - yMin);

        const scope = { x, y, Math };
        try {
          const z = code.evaluate(scope);
          vertices[i + 2] = Number.isFinite(z) ? z : 0;
        } catch (e) {
          vertices[i + 2] = 0;
        }
      }

      geometry.computeVertexNormals();

      material = new THREE.MeshPhongMaterial({
        color: 0x1cb0f6,
        side: THREE.DoubleSide,
        wireframe: false,
        flatShading: false,
        shininess: 60,
        transparent: true,
        opacity: 0.85
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      scene.add(mesh);

      const wireframe = new THREE.WireframeGeometry(geometry);
      const line = new THREE.LineSegments(wireframe);
      line.material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2 });
      line.rotation.x = -Math.PI / 2;
      scene.add(line);

    } catch (error) {
      console.error("3D Plot Error:", error);
    }

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotateRef.current;
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      if (labelRendererRef.current && sceneRef.current && cameraRef.current) {
        labelRendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current || !labelRendererRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      rendererRef.current.setSize(w, h);
      labelRendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (rendererRef.current && rendererRef.current.domElement) {
        containerRef.current?.removeChild(rendererRef.current.domElement);
      }
      if (labelRendererRef.current && labelRendererRef.current.domElement) {
        containerRef.current?.removeChild(labelRendererRef.current.domElement);
      }
      geometry?.dispose();
      material?.dispose();
    };
  }, [data]); // Removed autoRotate from dependencies

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(8, 8, 8);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden transition-colors relative group">
      <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
        <div className="bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-500 z-10 uppercase tracking-widest border border-slate-200 dark:border-slate-700 shadow-sm">3D Surface: {data.label}</div>
        {!isStatic && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1.5 rounded-lg border transition-all shadow-sm ${autoRotate ? 'bg-brand-blue text-white border-brand-blue' : 'bg-white/90 dark:bg-slate-800/90 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-brand-blue'}`}
              title={autoRotate ? "Stop Auto-Rotate" : "Start Auto-Rotate"}
            >
              <RefreshCw size={14} className={autoRotate ? 'animate-spin-slow' : ''} />
            </button>
            <button onClick={resetCamera} className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-brand-blue transition-colors shadow-sm" title="Reset Camera">
               <RotateCcw size={14} />
            </button>
          </div>
        )}
      </div>
      
      <div ref={containerRef} className={`w-full h-full ${isStatic ? '' : 'cursor-move'}`} />
    </div>
  );
};

export default Plot3DVis;
