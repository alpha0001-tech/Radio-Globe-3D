import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import TWEEN from '@tweenjs/tween.js';
import { RadioStation, GlobeClickEvent } from '../types';

interface GlobeSceneProps {
  stations: RadioStation[];
  onGlobeClick: (event: GlobeClickEvent) => void;
  onReady: () => void;
}

// Config constants
const GLOBE_RADIUS = 100;
const TEXTURE_MAP = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
const TEXTURE_BUMP = 'https://unpkg.com/three-globe/example/img/earth-topology.png';

// Shaders
const ATMOSPHERE_VERTEX = `
    varying vec3 vNormal;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const ATMOSPHERE_FRAGMENT = `
    varying vec3 vNormal;
    void main() {
        float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
        gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
    }
`;

const GlobeScene: React.FC<GlobeSceneProps> = ({ stations, onGlobeClick, onReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stationsRef = useRef<RadioStation[]>(stations);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const globeRef = useRef<THREE.Group | null>(null);
  const pointsMeshRef = useRef<THREE.Points | null>(null);
  const requestRef = useRef<number>(0);

  // Update ref when props change to access in event listeners without re-binding
  useEffect(() => {
    stationsRef.current = stations;
    if (sceneRef.current && globeRef.current) {
      updatePoints();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]);

  const latLonToVector3 = (lat: number, lon: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));
    
    return new THREE.Vector3(x, y, z);
  };

  const createDotTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'white');
      grad.addColorStop(0.4, '#00ff88');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  };

  const updatePoints = () => {
    if (!globeRef.current) return;
    
    // Remove old points if they exist
    if (pointsMeshRef.current) {
        globeRef.current.remove(pointsMeshRef.current);
        pointsMeshRef.current.geometry.dispose();
        (pointsMeshRef.current.material as THREE.Material).dispose();
    }

    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const colors: number[] = [];
    const colorObj = new THREE.Color();

    stationsRef.current.forEach(station => {
      const coords = latLonToVector3(station.geo_lat, station.geo_long, GLOBE_RADIUS + 0.5);
      positions.push(coords.x, coords.y, coords.z);
      colorObj.setHex(0x00ff88);
      colors.push(colorObj.r, colorObj.g, colorObj.b);
    });

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      map: createDotTexture(),
      transparent: true,
      alphaTest: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const pointsMesh = new THREE.Points(geometry, material);
    globeRef.current.add(pointsMesh);
    pointsMeshRef.current = pointsMesh;
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020202);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 250;
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 120;
    controls.maxDistance = 400;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // 5. Lights
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(50, 30, 50);
    scene.add(sunLight);

    // 6. Starfield
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount*3; i++) {
        starPos[i] = (Math.random() - 0.5) * 800;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({size: 1.5, color: 0xffffff, transparent: true, opacity: 0.8});
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 7. Globe Group
    const globeGroup = new THREE.Group();
    globeRef.current = globeGroup;
    scene.add(globeGroup);

    // 8. Earth Mesh
    const textureLoader = new THREE.TextureLoader();
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
        map: textureLoader.load(TEXTURE_MAP),
        bumpMap: textureLoader.load(TEXTURE_BUMP),
        bumpScale: 1.5,
        specular: new THREE.Color('grey'),
        shininess: 5
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    globeGroup.add(earthMesh);

    // 9. Atmosphere
    const atmoGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 2, 64, 64);
    const atmoMat = new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERTEX,
        fragmentShader: ATMOSPHERE_FRAGMENT,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    scene.add(atmoMesh);

    // 10. Initial Points
    updatePoints();

    // 11. Interaction Logic
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let mouseDownTime = 0;

    const onMouseDown = () => {
        mouseDownTime = Date.now();
        controls.autoRotate = false;
    };

    const onMouseUp = (event: MouseEvent) => {
        if (Date.now() - mouseDownTime > 200) return; // It was a drag

        // Calculate mouse position correctly relative to canvas
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(earthMesh);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            
            // Camera Animation
            const direction = point.clone().normalize();
            const endPos = direction.multiplyScalar(200);

            new TWEEN.Tween(camera.position)
                .to({ x: endPos.x, y: endPos.y, z: endPos.z }, 1000)
                .easing(TWEEN.Easing.Cubic.Out)
                .onUpdate(() => controls.update())
                .start();
            
            // Find nearby stations
            const nearby: RadioStation[] = [];
            stationsRef.current.forEach(st => {
                const pos = latLonToVector3(st.geo_lat, st.geo_long, GLOBE_RADIUS);
                const dist = pos.distanceTo(point);
                if (dist < 5) { // Approx 300km threshold
                    nearby.push({ ...st, dist });
                }
            });
            nearby.sort((a, b) => (a.dist || 0) - (b.dist || 0));

            onGlobeClick({
                point: { x: point.x, y: point.y, z: point.z },
                nearbyStations: nearby
            });
        }
    };

    renderer.domElement.addEventListener('pointerdown', onMouseDown);
    renderer.domElement.addEventListener('pointerup', onMouseUp);

    // 12. Animation Loop
    const animate = (time: number) => {
        requestRef.current = requestAnimationFrame(animate);
        TWEEN.update(time);
        if (controlsRef.current) controlsRef.current.update();
        if (rendererRef.current && sceneRef.current && cameraRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
    };
    animate(performance.now());

    // 13. Window Resize
    const onResize = () => {
        if (!cameraRef.current || !rendererRef.current) return;
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Notify ready
    onReady();

    // Cleanup
    return () => {
        window.removeEventListener('resize', onResize);
        cancelAnimationFrame(requestRef.current);
        if (renderer.domElement && containerRef.current) {
             containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full z-0" />;
};

export default GlobeScene;