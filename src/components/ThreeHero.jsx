import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeHero() {
  const mountRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0C0C0E, 12, 45);

    const camera = new THREE.PerspectiveCamera(55, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 3.5, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x8B5CF6, 0.35));
    const pointA = new THREE.PointLight(0x8B5CF6, 2.5, 40);
    pointA.position.set(5, 6, 5);
    scene.add(pointA);
    const pointB = new THREE.PointLight(0x38BDF8, 1.8, 35);
    pointB.position.set(-6, 3, -3);
    scene.add(pointB);

    // ==== Data wave surface — signal turning into forecast ====
    const W_SEG = 80, H_SEG = 60;
    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 10, W_SEG, H_SEG),
      new THREE.MeshPhongMaterial({
        color: 0x8B5CF6,
        emissive: 0x3A2260,
        emissiveIntensity: 0.4,
        shininess: 60,
        wireframe: true,
        transparent: true,
        opacity: 0.65,
      })
    );
    surface.rotation.x = -Math.PI / 3.5;
    surface.position.y = -1.5;
    scene.add(surface);

    const pos0 = surface.geometry.attributes.position.array.slice();

    // ==== Orbiting rings of particles ====
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    const makeRing = (radius, count, color, y = 0, speed = 1) => {
      const geom = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const data = [];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        pos[i * 3] = Math.cos(a) * radius;
        pos[i * 3 + 1] = y + Math.sin(i * 1.2) * 0.2;
        pos[i * 3 + 2] = Math.sin(a) * radius;
        data.push({ a, r: radius });
      }
      geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({ color, size: 0.12, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
      const pts = new THREE.Points(geom, mat);
      pts.userData = { data, speed };
      particleGroup.add(pts);
      return pts;
    };

    const ring1 = makeRing(6, 80, 0x8B5CF6, 0.5, 0.6);
    const ring2 = makeRing(4.2, 60, 0x38BDF8, -0.4, -0.8);
    const ring3 = makeRing(7.8, 100, 0xA78BFA, 1.2, 0.4);

    // ==== Floating "prediction spheres" — larger nodes ====
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);
    const colors = [0x8B5CF6, 0x22C55E, 0x38BDF8, 0xEAB308];
    const nodes = [];
    for (let i = 0; i < 8; i++) {
      const color = colors[i % colors.length];
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.22 + Math.random() * 0.25, 0),
        new THREE.MeshPhongMaterial({ color, emissive: color, emissiveIntensity: 0.5, shininess: 100, transparent: true, opacity: 0.95 })
      );
      const a = (i / 8) * Math.PI * 2;
      m.position.set(Math.cos(a) * (5 + Math.random() * 3), (Math.random() - 0.5) * 5, Math.sin(a) * (5 + Math.random() * 3));
      m.userData = { baseY: m.position.y, phase: Math.random() * Math.PI * 2, orbit: a, speed: 0.3 + Math.random() * 0.4 };
      nodes.push(m);
      nodeGroup.add(m);
    }

    // ==== Connecting lines between nodes (neural-net vibe) ====
    const linePositions = new Float32Array(nodes.length * nodes.length * 6);
    const lineColors = new Float32Array(nodes.length * nodes.length * 6);
    const lineGeom = new THREE.BufferGeometry();
    lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
    const lineMesh = new THREE.LineSegments(lineGeom, lineMat);
    scene.add(lineMesh);

    // Mouse parallax
    let mx = 0, my = 0;
    const onMove = (e) => {
      const rect = mount.getBoundingClientRect();
      mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    mount.addEventListener('mousemove', onMove);

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();

      // Wave the surface
      const pos = surface.geometry.attributes.position.array;
      for (let i = 0; i < pos.length; i += 3) {
        const x = pos0[i], y = pos0[i + 1];
        pos[i + 2] = Math.sin(x * 0.8 + t * 0.9) * 0.4
                   + Math.cos(y * 0.6 + t * 0.7) * 0.3
                   + Math.sin((x + y) * 0.3 + t * 0.5) * 0.2;
      }
      surface.geometry.attributes.position.needsUpdate = true;
      surface.geometry.computeVertexNormals();

      // Rotate particle rings
      [ring1, ring2, ring3].forEach((ring) => {
        const arr = ring.geometry.attributes.position.array;
        ring.userData.data.forEach((d, i) => {
          const a = d.a + t * ring.userData.speed * 0.2;
          arr[i * 3] = Math.cos(a) * d.r;
          arr[i * 3 + 2] = Math.sin(a) * d.r;
        });
        ring.geometry.attributes.position.needsUpdate = true;
      });

      // Float nodes
      nodes.forEach((n, i) => {
        n.position.y = n.userData.baseY + Math.sin(t * n.userData.speed + n.userData.phase) * 0.5;
        n.rotation.x += 0.008;
        n.rotation.y += 0.01;
        const a = n.userData.orbit + t * 0.08;
        const r = 5 + Math.sin(t * 0.3 + i) * 1.5 + Math.random() * 0.001;
        n.position.x = Math.cos(a) * r;
        n.position.z = Math.sin(a) * r;
      });

      // Update connecting lines
      const lp = lineMesh.geometry.attributes.position.array;
      const lc = lineMesh.geometry.attributes.color.array;
      let idx = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].position.x - nodes[j].position.x;
          const dy = nodes[i].position.y - nodes[j].position.y;
          const dz = nodes[i].position.z - nodes[j].position.z;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < 6) {
            lp[idx * 6 + 0] = nodes[i].position.x;
            lp[idx * 6 + 1] = nodes[i].position.y;
            lp[idx * 6 + 2] = nodes[i].position.z;
            lp[idx * 6 + 3] = nodes[j].position.x;
            lp[idx * 6 + 4] = nodes[j].position.y;
            lp[idx * 6 + 5] = nodes[j].position.z;
            const opacity = 1 - d / 6;
            lc[idx * 6 + 0] = 0.545 * opacity;
            lc[idx * 6 + 1] = 0.361 * opacity;
            lc[idx * 6 + 2] = 0.965 * opacity;
            lc[idx * 6 + 3] = 0.545 * opacity;
            lc[idx * 6 + 4] = 0.361 * opacity;
            lc[idx * 6 + 5] = 0.965 * opacity;
            idx++;
          }
        }
      }
      for (let i = idx * 6; i < lp.length; i++) lp[i] = 0;
      lineMesh.geometry.attributes.position.needsUpdate = true;
      lineMesh.geometry.attributes.color.needsUpdate = true;
      lineMesh.geometry.setDrawRange(0, idx * 2);

      // Camera parallax
      camera.position.x += (mx * 1.5 - camera.position.x) * 0.05;
      camera.position.y += (3.5 - my * 1.2 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      mount.removeEventListener('mousemove', onMove);
      mount.removeChild(renderer.domElement);
      renderer.dispose();
      surface.geometry.dispose(); surface.material.dispose();
      [ring1, ring2, ring3].forEach(r => { r.geometry.dispose(); r.material.dispose(); });
      nodes.forEach(n => { n.geometry.dispose(); n.material.dispose(); });
      lineGeom.dispose(); lineMat.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }} />;
}
