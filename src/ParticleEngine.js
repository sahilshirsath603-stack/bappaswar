// Calm, Relaxing & Aesthetic Particle Engine for Gentle Devotional Ambience
import * as THREE from 'three';
import { audio } from './AudioSynth.js';

export class ParticleEngine {
  constructor(scene) {
    this.scene = scene;
    this.petalCount = 90; // Reduced for calm, uncluttered elegance
    this.orbCount = 180;   // Soft glowing floating celestial bokeh orbs

    this.petals = [];
    this.dummy = new THREE.Object3D();

    this.initPetals();
    this.initBokehOrbs();
  }

  initPetals() {
    // 3D Soft Curved Petal Geometry
    const petalShape = new THREE.Shape();
    petalShape.moveTo(0, 0);
    petalShape.bezierCurveTo(0.08, 0.12, 0.12, 0.28, 0.06, 0.38);
    petalShape.bezierCurveTo(0.02, 0.44, -0.02, 0.44, -0.06, 0.38);
    petalShape.bezierCurveTo(-0.12, 0.28, -0.08, 0.12, 0, 0);
    petalShape.closePath();

    const petalGeo = new THREE.ExtrudeGeometry(petalShape, {
      depth: 0.008,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.003
    });
    petalGeo.center();

    this.petalMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.6,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.instancedPetals = new THREE.InstancedMesh(petalGeo, this.petalMaterial, this.petalCount);
    this.instancedPetals.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Soft serene palette: Marigold saffron, lotus petal rose, soft gold
    const palette = [
      new THREE.Color(0xff9e00), // Soft saffron
      new THREE.Color(0xffd166), // Pale golden marigold
      new THREE.Color(0xe63946), // Sacred crimson rose
      new THREE.Color(0xf4a261)  // Warm peach
    ];

    for (let i = 0; i < this.petalCount; i++) {
      const color = palette[i % palette.length];
      this.instancedPetals.setColorAt(i, color);

      const p = {
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 10.0,
          Math.random() * 10.0 + 0.5,
          (Math.random() - 0.5) * 10.0
        ),
        rot: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6
        ),
        fallSpeed: 0.35 + Math.random() * 0.45, // Slow, peaceful floating
        swaySpeed: 0.8 + Math.random() * 0.8,
        swayRadius: 0.25 + Math.random() * 0.35,
        scale: 0.45 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      };
      this.petals.push(p);
    }

    if (this.instancedPetals.instanceColor) {
      this.instancedPetals.instanceColor.needsUpdate = true;
    }
    this.scene.add(this.instancedPetals);
  }

  initBokehOrbs() {
    // Soft, serene floating bokeh orbs (gentle, relaxing ambient glow)
    const orbGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.orbCount * 3);
    const colors = new Float32Array(this.orbCount * 3);
    this.orbVelocities = [];

    const col1 = new THREE.Color(0x00f5d4); // Cyan divine light
    const col2 = new THREE.Color(0xffd166); // Golden glow
    const col3 = new THREE.Color(0xffffff); // Diamond aura

    for (let i = 0; i < this.orbCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14.0;
      positions[i * 3 + 1] = Math.random() * 9.0 + 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14.0;

      const pick = Math.random();
      const c = pick < 0.45 ? col1 : pick < 0.85 ? col2 : col3;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      this.orbVelocities.push({
        vx: (Math.random() - 0.5) * 0.08,
        vy: 0.12 + Math.random() * 0.18, // Very slow serene upward drift
        vz: (Math.random() - 0.5) * 0.08,
        phase: Math.random() * Math.PI * 2,
        pulseSpeed: 1.0 + Math.random() * 1.5
      });
    }

    orbGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    orbGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Soft Gaussian blur radial texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(200,245,255,0.7)');
    grad.addColorStop(0.5, 'rgba(0,200,240,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    const orbTexture = new THREE.CanvasTexture(canvas);

    const orbMat = new THREE.PointsMaterial({
      size: 0.28,
      map: orbTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.75
    });

    this.orbPoints = new THREE.Points(orbGeo, orbMat);
    this.scene.add(this.orbPoints);
  }

  triggerFlowerShower() {
    audio.playFlowerChime();

    for (let i = 0; i < this.petalCount; i++) {
      const p = this.petals[i];
      p.pos.set(
        (Math.random() - 0.5) * 4.5,
        8.0 + Math.random() * 3.5,
        (Math.random() - 0.5) * 4.5
      );
      p.fallSpeed = 0.6 + Math.random() * 0.6; // Soft gentle drift
    }
  }

  update(time, delta) {
    // 1. Update Gentle Petals
    for (let i = 0; i < this.petalCount; i++) {
      const p = this.petals[i];

      p.pos.y -= p.fallSpeed * delta;

      // Soft serene swaying
      p.pos.x += Math.sin(time * p.swaySpeed + p.phase) * p.swayRadius * delta;
      p.pos.z += Math.cos(time * p.swaySpeed + p.phase) * p.swayRadius * delta;

      p.rot.x += p.rotSpeed.x * delta;
      p.rot.y += p.rotSpeed.y * delta;
      p.rot.z += p.rotSpeed.z * delta;

      if (p.pos.y < 0.1) {
        p.pos.y = 9.5 + Math.random() * 2.0;
        p.pos.x = (Math.random() - 0.5) * 9.0;
        p.pos.z = (Math.random() - 0.5) * 9.0;
      }

      this.dummy.position.copy(p.pos);
      this.dummy.rotation.copy(p.rot);
      this.dummy.scale.setScalar(p.scale);
      this.dummy.updateMatrix();

      this.instancedPetals.setMatrixAt(i, this.dummy.matrix);
    }
    this.instancedPetals.instanceMatrix.needsUpdate = true;

    // 2. Update Calm Floating Bokeh Orbs
    const posAttr = this.orbPoints.geometry.attributes.position;
    for (let i = 0; i < this.orbCount; i++) {
      const v = this.orbVelocities[i];
      let y = posAttr.getY(i) + v.vy * delta;
      let x = posAttr.getX(i) + Math.sin(time * 0.8 + v.phase) * 0.12 * delta;
      let z = posAttr.getZ(i) + Math.cos(time * 0.8 + v.phase) * 0.12 * delta;

      if (y > 9.5) {
        y = 0.2;
        x = (Math.random() - 0.5) * 12.0;
        z = (Math.random() - 0.5) * 12.0;
      }

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  }
}
