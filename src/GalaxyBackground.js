// 3D Cosmic Galaxy Background with Orbiting Planets, Starfields & Nebula Clouds
import * as THREE from 'three';

export class GalaxyBackground {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = "GalaxyCosmosBackground";
    this.group.position.set(0, 3.0, -14.0); // Placed deep in the background

    this.planets = [];

    this.initNebulaDome();
    this.initStarfield();
    this.initPlanets();

    this.scene.add(this.group);
  }

  initNebulaDome() {
    // Large Cosmic Sky Dome with custom procedural Nebula & Galaxy shader
    const domeGeo = new THREE.SphereGeometry(45, 32, 32);
    
    const nebulaShader = {
      uniforms: {
        uTime: { value: 0 },
        uColorDeep: { value: new THREE.Color(0x030611) },  // Space void
        uColorNebula1: { value: new THREE.Color(0x240046) }, // Purple cosmic cloud
        uColorNebula2: { value: new THREE.Color(0x0b525b) }, // Cyan cosmic teal
        uColorNebula3: { value: new THREE.Color(0x7209b7) }  // Magenta interstellar gas
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vNormal = normal;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorDeep;
        uniform vec3 uColorNebula1;
        uniform vec3 uColorNebula2;
        uniform vec3 uColorNebula3;
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv * 6.0;
          float t = uTime * 0.02;
          
          float n1 = fbm(uv + vec2(t * 0.5, t * 0.3));
          float n2 = fbm(uv * 1.5 - vec2(t * 0.4, -t * 0.2));
          float cloud = smoothstep(0.3, 0.8, n1 * n2 * 1.8);

          vec3 color = uColorDeep;
          color = mix(color, uColorNebula1, n1 * 0.7);
          color = mix(color, uColorNebula2, n2 * 0.5);
          color = mix(color, uColorNebula3, cloud * 0.85);

          // Subtle galaxy core glow
          float centerDist = length(vUv - vec2(0.5, 0.6));
          float coreGlow = smoothstep(0.5, 0.0, centerDist) * 0.25;
          color += vec3(0.0, 0.6, 0.8) * coreGlow;

          gl_FragColor = vec4(color, 1.0);
        }
      `
    };

    this.nebulaMat = new THREE.ShaderMaterial({
      vertexShader: nebulaShader.vertexShader,
      fragmentShader: nebulaShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(nebulaShader.uniforms),
      side: THREE.BackSide,
      depthWrite: false
    });

    const nebulaMesh = new THREE.Mesh(domeGeo, this.nebulaMat);
    this.group.add(nebulaMesh);
  }

  initStarfield() {
    // 1500 Twinkling Galaxy Stars
    const starCount = 1500;
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const c1 = new THREE.Color(0xffffff);
    const c2 = new THREE.Color(0x80ffdb);
    const c3 = new THREE.Color(0xffd166);
    const c4 = new THREE.Color(0xc77dff);

    for (let i = 0; i < starCount; i++) {
      // Distribute stars on a wide hemisphere in deep background
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 35.0 + Math.random() * 8.0;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) - 4.0;
      positions[i * 3 + 2] = -Math.abs(r * Math.cos(phi)) - 2.0;

      const pick = Math.random();
      const c = pick < 0.5 ? c1 : pick < 0.75 ? c2 : pick < 0.9 ? c3 : c4;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 1.0 + Math.random() * 2.5;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Circular star particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(200,240,255,0.8)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const starTex = new THREE.CanvasTexture(canvas);

    const starMat = new THREE.PointsMaterial({
      size: 0.35,
      map: starTex,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.starPoints = new THREE.Points(starGeo, starMat);
    this.group.add(this.starPoints);
  }

  initPlanets() {
    // 1. Grand Ringed Planet (Saturn / Shani Style)
    this.planetSaturn = this.createRingedPlanet({
      radius: 2.2,
      color: 0xe0a96d,
      ringInner: 2.7,
      ringOuter: 4.8,
      ringColor: 0xd4af37,
      orbitRadius: 18.0,
      orbitSpeed: 0.08,
      orbitAngle: 0.3,
      tilt: 0.45,
      rotSpeed: 0.3,
      heightOffset: 6.5
    });
    this.group.add(this.planetSaturn.group);
    this.planets.push(this.planetSaturn);

    // 2. Cyan Gas Giant (Neptune / Varuna Style) with Atmospheric Rim Glow
    this.planetNeptune = this.createSpherePlanet({
      radius: 1.6,
      color: 0x00b4d8,
      emissive: 0x0077b6,
      emissiveIntensity: 0.3,
      orbitRadius: 22.0,
      orbitSpeed: -0.06,
      orbitAngle: 2.8,
      rotSpeed: 0.25,
      heightOffset: 2.0
    });
    this.group.add(this.planetNeptune.group);
    this.planets.push(this.planetNeptune);

    // 3. Purple Mystic Exoplanet (Amethyst World) with Thin Rings
    this.planetAmethyst = this.createRingedPlanet({
      radius: 1.2,
      color: 0x7209b7,
      ringInner: 1.5,
      ringOuter: 2.5,
      ringColor: 0xc77dff,
      orbitRadius: 15.0,
      orbitSpeed: 0.1,
      orbitAngle: 4.5,
      tilt: -0.35,
      rotSpeed: 0.4,
      heightOffset: -3.5
    });
    this.group.add(this.planetAmethyst.group);
    this.planets.push(this.planetAmethyst);

    // 4. Luminous Sacred Moon (Chandra) casting soft silver glow
    this.planetChandra = this.createSpherePlanet({
      radius: 0.85,
      color: 0xf8f9fa,
      emissive: 0xe0e1dd,
      emissiveIntensity: 0.6,
      orbitRadius: 11.0,
      orbitSpeed: -0.12,
      orbitAngle: 1.2,
      rotSpeed: 0.15,
      heightOffset: 4.8
    });
    this.group.add(this.planetChandra.group);
    this.planets.push(this.planetChandra);

    // 5. Golden Glowing Dwarf Star / Sun in distant cosmos
    const sunGeo = new THREE.SphereGeometry(1.6, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.95
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(-16.0, 11.0, -8.0);

    // Soft spherical corona aura (smooth without square borders)
    const coronaGeo = new THREE.SphereGeometry(2.6, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xff9e00,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    this.sunMesh.add(corona);
    this.group.add(this.sunMesh);
  }

  createSpherePlanet(cfg) {
    const group = new THREE.Group();

    const planetGeo = new THREE.SphereGeometry(cfg.radius, 32, 32);
    
    // Procedural banded texture for gas giant
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    const col = new THREE.Color(cfg.color);
    grad.addColorStop(0, `#${col.getHexString()}`);
    grad.addColorStop(0.3, `#${new THREE.Color(cfg.color).offsetHSL(0, 0, -0.15).getHexString()}`);
    grad.addColorStop(0.5, `#${new THREE.Color(cfg.color).offsetHSL(0.05, 0, 0.1).getHexString()}`);
    grad.addColorStop(0.7, `#${new THREE.Color(cfg.color).offsetHSL(0, 0, -0.2).getHexString()}`);
    grad.addColorStop(1, `#${col.getHexString()}`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Add delicate planetary clouds/stripes
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let y = 30; y < 230; y += 25) {
      ctx.fillRect(0, y, 256, 6 + Math.random() * 8);
    }

    const tex = new THREE.CanvasTexture(canvas);

    const planetMat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.4,
      metalness: 0.1,
      emissive: cfg.emissive || 0x000000,
      emissiveIntensity: cfg.emissiveIntensity || 0.0
    });

    const mesh = new THREE.Mesh(planetGeo, planetMat);
    group.add(mesh);

    // Atmospheric Fresnel rim glow
    const atmosGeo = new THREE.SphereGeometry(cfg.radius * 1.08, 32, 32);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide
    });
    const atmos = new THREE.Mesh(atmosGeo, atmosMat);
    group.add(atmos);

    return {
      group,
      mesh,
      orbitRadius: cfg.orbitRadius,
      orbitSpeed: cfg.orbitSpeed,
      orbitAngle: cfg.orbitAngle,
      rotSpeed: cfg.rotSpeed,
      heightOffset: cfg.heightOffset
    };
  }

  createRingedPlanet(cfg) {
    const planetData = this.createSpherePlanet(cfg);

    // Planetary Rings
    const ringGeo = new THREE.RingGeometry(cfg.ringInner, cfg.ringOuter, 64);
    
    // Ring texture with multiple concentric gaps
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    const ringCol = new THREE.Color(cfg.ringColor);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.15, `#${ringCol.getHexString()}`);
    grad.addColorStop(0.45, 'rgba(0,0,0,0.2)'); // Cassini division
    grad.addColorStop(0.55, `#${ringCol.getHexString()}`);
    grad.addColorStop(0.85, `#${new THREE.Color(cfg.ringColor).offsetHSL(0.05, 0, 0.1).getHexString()}`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 16);

    const ringTex = new THREE.CanvasTexture(canvas);

    const ringMat = new THREE.MeshStandardMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
      roughness: 0.4,
      metalness: 0.2
    });

    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI * 0.5 + (cfg.tilt || 0.35);
    planetData.group.add(ringMesh);

    return planetData;
  }

  update(time, delta) {
    // 1. Slowly rotate Nebula background
    if (this.nebulaMat && this.nebulaMat.uniforms) {
      this.nebulaMat.uniforms.uTime.value = time;
    }

    // 2. Slow starfield rotation
    if (this.starPoints) {
      this.starPoints.rotation.y = time * 0.005;
      this.starPoints.rotation.x = Math.sin(time * 0.003) * 0.02;
    }

    // 3. Move Orbiting Planets along celestial trajectories
    this.planets.forEach(p => {
      p.orbitAngle += p.orbitSpeed * delta;

      // Elliptical orbit calculation in 3D space
      const x = Math.cos(p.orbitAngle) * p.orbitRadius;
      const z = Math.sin(p.orbitAngle) * (p.orbitRadius * 0.5) - 10.0;
      const y = p.heightOffset + Math.sin(p.orbitAngle * 1.5) * 1.5;

      p.group.position.set(x, y, z);

      // Axial self-rotation
      p.mesh.rotation.y += p.rotSpeed * delta;
    });

    // 4. Pulsing Sun/Dwarf Star
    if (this.sunMesh) {
      const pulse = 1.0 + Math.sin(time * 1.2) * 0.04;
      this.sunMesh.scale.setScalar(pulse);
    }
  }

  setTheme(themeName) {
    if (!this.nebulaMat || !this.nebulaMat.uniforms) return;

    if (themeName === 'cyan') {
      this.nebulaMat.uniforms.uColorDeep.value.set(0x030611);
      this.nebulaMat.uniforms.uColorNebula1.value.set(0x1a0033);
      this.nebulaMat.uniforms.uColorNebula2.value.set(0x0b525b);
      this.nebulaMat.uniforms.uColorNebula3.value.set(0x0077b6);
    } else if (themeName === 'gold') {
      this.nebulaMat.uniforms.uColorDeep.value.set(0x0f0501);
      this.nebulaMat.uniforms.uColorNebula1.value.set(0x4a0404);
      this.nebulaMat.uniforms.uColorNebula2.value.set(0x9a031e);
      this.nebulaMat.uniforms.uColorNebula3.value.set(0xfb8500);
    } else if (themeName === 'cosmic') {
      this.nebulaMat.uniforms.uColorDeep.value.set(0x05010e);
      this.nebulaMat.uniforms.uColorNebula1.value.set(0x240046);
      this.nebulaMat.uniforms.uColorNebula2.value.set(0x5a189a);
      this.nebulaMat.uniforms.uColorNebula3.value.set(0x9d4edd);
    }
  }
}
