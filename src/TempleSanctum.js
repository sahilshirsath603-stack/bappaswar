// Aesthetic & Relaxing Temple Sanctum with Deepa Stambhas, Floor Focus Spotlights, and Diya Rows
import * as THREE from 'three';
import { DiyaFlameShader } from './Shaders.js';
import { audio } from './AudioSynth.js';

export class TempleSanctum {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = "TempleSanctum";

    this.interactiveBells = [];
    this.diyaLights = [];
    this.flameMaterials = [];
    this.spotLights = [];
    this.isAartiActive = false;
    this.aartiAngle = 0;

    this.initMaterials();
    this.buildSanctum();
  }

  initMaterials() {
    this.stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x050e1a,
      roughness: 0.35,
      metalness: 0.35
    });

    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      metalness: 0.85,
      roughness: 0.22,
      emissive: 0x2e1800,
      emissiveIntensity: 0.15
    });

    this.pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x08182b,
      roughness: 0.5,
      metalness: 0.2
    });

    this.brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xdfa032,
      metalness: 0.82,
      roughness: 0.25
    });

    this.prabhavaliMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xff9f1c,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.25
    });

    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x0b2545,
      roughness: 0.1,
      metalness: 0.85
    });
  }

  buildSanctum() {
    this.buildFloor();
    this.buildPrabhavaliHalo();
    this.buildPillars();
    this.buildHangingBells();
    this.buildDiyaRing();
    this.buildDeepaStambhas();
    this.buildFloorFocusLights();
    this.buildUrliBowls();
    this.buildFrontDiyaArc();
    this.buildOfferings();
    this.buildAartiThali();
  }

  buildFloor() {
    // 1. Lower Expansive Foundation Dais
    const baseGeo = new THREE.CylinderGeometry(15, 15.5, 0.4, 48);
    const baseMesh = new THREE.Mesh(baseGeo, this.stoneMaterial);
    baseMesh.position.set(0, -0.3, 0);
    baseMesh.receiveShadow = true;
    this.group.add(baseMesh);

    // Gold Trim Ring around dais
    const rimGeo = new THREE.TorusGeometry(15.0, 0.1, 16, 64);
    const rimMesh = new THREE.Mesh(rimGeo, this.goldMaterial);
    rimMesh.rotation.x = Math.PI * 0.5;
    rimMesh.position.set(0, -0.1, 0);
    this.group.add(rimMesh);

    // 2. Elevated Upper Sanctum Platform
    const upperGeo = new THREE.CylinderGeometry(8.5, 9.0, 0.18, 48);
    const upperMesh = new THREE.Mesh(upperGeo, new THREE.MeshStandardMaterial({
      color: 0x071526,
      roughness: 0.28,
      metalness: 0.4
    }));
    upperMesh.position.set(0, -0.05, 0);
    upperMesh.receiveShadow = true;
    this.group.add(upperMesh);

    // 3. Ornate Glowing Gold & Cyan Mandala Floor Disc
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#040b16';
    ctx.fillRect(0, 0, 1024, 1024);

    const cx = 512, cy = 512;
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 10;

    // Concentric sacred geometry rings
    for (let r = 80; r <= 460; r += 75) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 16 Lotus Flower Petals
    const petals = 16;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 220, cy + Math.sin(a) * 220, 85, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Inner 8-point star
    ctx.strokeStyle = '#00f5d4';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f5d4';
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const r = i % 2 === 0 ? 150 : 80;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    const mandalaTex = new THREE.CanvasTexture(canvas);
    const mandalaMat = new THREE.MeshStandardMaterial({
      map: mandalaTex,
      roughness: 0.35,
      metalness: 0.4,
      emissive: 0x1f1400,
      emissiveIntensity: 0.15
    });

    const mandalaMesh = new THREE.Mesh(new THREE.PlaneGeometry(17, 17), mandalaMat);
    mandalaMesh.rotation.x = -Math.PI * 0.5;
    mandalaMesh.position.set(0, 0.045, 0);
    mandalaMesh.receiveShadow = true;
    this.group.add(mandalaMesh);
  }

  buildPrabhavaliHalo() {
    this.prabhavaliGroup = new THREE.Group();
    this.prabhavaliGroup.position.set(0, 3.1, -1.0);

    // Clean, aesthetic arch ring
    const archGeo = new THREE.TorusGeometry(3.3, 0.1, 16, 48, Math.PI * 1.35);
    const archMesh = new THREE.Mesh(archGeo, this.prabhavaliMaterial);
    archMesh.rotation.z = Math.PI * 0.325;
    this.prabhavaliGroup.add(archMesh);

    // Soft glowing backdrop disc
    const haloDiscGeo = new THREE.CircleGeometry(3.1, 32);
    const haloDiscMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    this.haloDiscMesh = new THREE.Mesh(haloDiscGeo, haloDiscMat);
    this.haloDiscMesh.position.set(0, 0, -0.08);
    this.prabhavaliGroup.add(this.haloDiscMesh);

    this.group.add(this.prabhavaliGroup);
  }

  buildPillars() {
    // 2 Clean background temple pillars flanking the sanctum
    const pillarConfigs = [
      { x: -5.6, z: -2.5 },
      { x: 5.6, z: -2.5 }
    ];

    pillarConfigs.forEach(cfg => {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(cfg.x, 0, cfg.z);

      // Base plinth
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 1.2), this.pillarMaterial);
      base.position.y = 0.3;
      base.castShadow = true;
      base.receiveShadow = true;
      pillarGroup.add(base);

      // Fluted column shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 6.5, 24), this.pillarMaterial);
      shaft.position.y = 3.8;
      shaft.castShadow = true;
      pillarGroup.add(shaft);

      // Gold capital ring
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.48, 0.25, 24), this.goldMaterial);
      ring.position.y = 6.9;
      pillarGroup.add(ring);

      // Hanging bracket for bell
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 12), this.goldMaterial);
      arm.rotation.z = Math.PI * 0.5;
      arm.position.set(cfg.x < 0 ? 0.75 : -0.75, 5.8, 0);
      pillarGroup.add(arm);

      this.group.add(pillarGroup);
    });
  }

  buildHangingBells() {
    const bellPositions = [
      { x: -4.85, y: 5.8, z: -2.5, pitch: 1.15, size: 0.9 },
      { x: 4.85, y: 5.8, z: -2.5, pitch: 0.95, size: 0.95 }
    ];

    bellPositions.forEach((cfg, idx) => {
      const bellAnchor = new THREE.Group();
      bellAnchor.position.set(cfg.x, cfg.y, cfg.z);

      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 8), this.brassMaterial);
      chain.position.y = -0.7;
      bellAnchor.add(chain);

      const pendulum = new THREE.Group();
      pendulum.position.y = -1.4;

      const bodyGeo = new THREE.CylinderGeometry(0.12 * cfg.size, 0.32 * cfg.size, 0.5 * cfg.size, 20);
      const body = new THREE.Mesh(bodyGeo, this.goldMaterial);
      body.position.y = -0.25 * cfg.size;
      body.castShadow = true;
      pendulum.add(body);

      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.14 * cfg.size, 16, 12), this.goldMaterial);
      dome.position.y = 0;
      pendulum.add(dome);

      const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.07 * cfg.size, 12, 12), this.brassMaterial);
      clapper.position.y = -0.52 * cfg.size;
      pendulum.add(clapper);

      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32 * cfg.size, 0.04 * cfg.size, 10, 24), this.goldMaterial);
      rim.rotation.x = Math.PI * 0.5;
      pendulum.add(rim);

      bellAnchor.add(pendulum);
      this.group.add(bellAnchor);

      pendulum.userData = {
        isBell: true,
        index: idx,
        pitch: cfg.pitch,
        swingAngle: 0,
        swingVel: 0
      };
      this.interactiveBells.push(pendulum);
    });
  }

  createSingleDiya(x, y, z, scale = 1.0, withLight = false) {
    const diyaGroup = new THREE.Group();
    diyaGroup.position.set(x, y, z);
    diyaGroup.scale.setScalar(scale);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.1, 16), this.brassMaterial);
    bowl.castShadow = true;
    diyaGroup.add(bowl);

    const flameMat = new THREE.ShaderMaterial({
      vertexShader: DiyaFlameShader.vertexShader,
      fragmentShader: DiyaFlameShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(DiyaFlameShader.uniforms),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.flameMaterials.push(flameMat);

    const flame = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.42), flameMat);
    flame.position.set(0.08, 0.22, 0);
    diyaGroup.add(flame);

    if (withLight) {
      const flameLight = new THREE.PointLight(0xffa200, 0.85, 4.5, 2.0);
      flameLight.position.set(0.08, 0.3, 0);
      diyaGroup.add(flameLight);
      this.diyaLights.push({ light: flameLight, baseIntensity: 0.85, offset: Math.random() * 10 });
    }

    return diyaGroup;
  }

  buildDiyaRing() {
    // 6 Warm brass diyas around the lotus pedestal
    const diyaCount = 6;
    const radius = 2.4;
    for (let i = 0; i < diyaCount; i++) {
      const angle = (i / diyaCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const diya = this.createSingleDiya(x, 0.12, z, 1.0, false);
      this.group.add(diya);
    }

    // Consolidated soft ambient altar glow
    const ringLight = new THREE.PointLight(0xffa200, 1.2, 5.5, 2.0);
    ringLight.position.set(0, 0.5, 0.5);
    this.group.add(ringLight);
    this.diyaLights.push({ light: ringLight, baseIntensity: 1.2, offset: 0 });
  }

  buildDeepaStambhas() {
    // Two Grand Multi-Tier Brass Diya Towers on Left and Right Floor Sides
    const stambhaPositions = [
      { x: -4.8, z: 0.5 },
      { x: 4.8, z: 0.5 }
    ];

    stambhaPositions.forEach((pos) => {
      const stambha = new THREE.Group();
      stambha.position.set(pos.x, 0, pos.z);

      // Heavy stepped brass base
      const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.2, 24), this.brassMaterial);
      b1.position.y = 0.1;
      stambha.add(b1);

      const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 0.25, 24), this.brassMaterial);
      b2.position.y = 0.3;
      stambha.add(b2);

      // Fluted central shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.6, 20), this.brassMaterial);
      shaft.position.y = 1.6;
      stambha.add(shaft);

      // 3 Tiers of Diya Plates holding burning wicks
      const tiers = [
        { y: 0.9, radius: 0.5, count: 5 },
        { y: 1.7, radius: 0.42, count: 4 },
        { y: 2.4, radius: 0.32, count: 3 }
      ];

      tiers.forEach((t) => {
        // Brass Plate
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(t.radius, t.radius * 0.8, 0.05, 24), this.brassMaterial);
        plate.position.y = t.y;
        stambha.add(plate);

        // Diyas on plate perimeter
        for (let i = 0; i < t.count; i++) {
          const a = (i / t.count) * Math.PI * 2;
          const dx = Math.cos(a) * (t.radius - 0.08);
          const dz = Math.sin(a) * (t.radius - 0.08);
          const diya = this.createSingleDiya(dx, t.y + 0.04, dz, 0.65, false);
          stambha.add(diya);
        }
      });

      // Top Kalash Finial Diya
      const finial = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.35, 16), this.goldMaterial);
      finial.position.y = 2.85;
      stambha.add(finial);

      const topDiya = this.createSingleDiya(0, 3.0, 0, 0.8, false);
      stambha.add(topDiya);

      // Single warm cluster light per Deepa Stambha tower
      const towerLight = new THREE.PointLight(0xff9a00, 1.3, 6.0, 1.8);
      towerLight.position.set(pos.x, 1.8, pos.z);
      this.group.add(towerLight);
      this.diyaLights.push({ light: towerLight, baseIntensity: 1.3, offset: pos.x });

      this.group.add(stambha);
    });
  }

  buildFloorFocusLights() {
    // Floor Stage Spotlight Fixtures angled directly at Lord Ganesha picture
    const spotConfigs = [
      { x: -3.2, y: 0.05, z: 3.0, target: { x: 0, y: 2.7, z: 0 } },
      { x: 3.2, y: 0.05, z: 3.0, target: { x: 0, y: 2.7, z: 0 } }
    ];

    spotConfigs.forEach(cfg => {
      const fixtureGroup = new THREE.Group();
      fixtureGroup.position.set(cfg.x, cfg.y, cfg.z);

      // Heavy Brass Spotlight Canister
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.1, 16), this.brassMaterial);
      fixtureGroup.add(base);

      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.45, 16), this.brassMaterial);
      barrel.position.set(0, 0.25, 0);
      barrel.lookAt(cfg.target.x - cfg.x, cfg.target.y - cfg.y, cfg.target.z - cfg.z);
      fixtureGroup.add(barrel);

      // Glowing lens
      const lensGeo = new THREE.CircleGeometry(0.18, 16);
      const lensMat = new THREE.MeshBasicMaterial({
        color: 0xffeedb,
        transparent: true,
        opacity: 0.95
      });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(0, 0.26, 0.22);
      barrel.add(lens);

      // Golden Volumetric Focus Light Beam Shaft (Soft & Ethereal)
      const beamGeo = new THREE.ConeGeometry(0.75, 4.2, 24, 1, true);
      beamGeo.rotateX(Math.PI * 0.5);
      beamGeo.translate(0, 0, 2.1);

      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xffd166,
        transparent: true,
        opacity: 0.045,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });

      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      barrel.add(beamMesh);

      // Focused Stage Wash Light illuminating Ganesha (no heavy shadow maps to preserve mobile performance)
      const spotLight = new THREE.SpotLight(0xffecd1, 3.2, 16.0, Math.PI * 0.28, 0.45, 1.2);
      spotLight.position.set(cfg.x, cfg.y + 0.35, cfg.z);
      spotLight.target.position.set(cfg.target.x, cfg.target.y, cfg.target.z);
      spotLight.castShadow = false;

      this.group.add(spotLight);
      this.group.add(spotLight.target);
      this.spotLights.push(spotLight);

      this.group.add(fixtureGroup);
    });
  }

  buildUrliBowls() {
    // 2 Traditional Brass Urli Vessels with Floating Flowers & Lotus Diyas
    const urliPositions = [
      { x: -2.8, z: 2.2 },
      { x: 2.8, z: 2.2 }
    ];

    urliPositions.forEach(pos => {
      const urli = new THREE.Group();
      urli.position.set(pos.x, 0.05, pos.z);

      // Brass Bowl
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.35, 0.25, 24), this.brassMaterial);
      bowl.position.y = 0.12;
      bowl.castShadow = true;
      urli.add(bowl);

      // Water Surface
      const water = new THREE.Mesh(new THREE.CircleGeometry(0.56, 24), this.waterMaterial);
      water.rotation.x = -Math.PI * 0.5;
      water.position.y = 0.23;
      urli.add(water);

      // Floating Marigold Petals in Urli
      const petalCol1 = new THREE.Color(0xff9e00);
      const petalCol2 = new THREE.Color(0xd90429);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const pGeo = new THREE.CircleGeometry(0.08, 8);
        const pMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? petalCol1 : petalCol2 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.rotation.x = -Math.PI * 0.5;
        pMesh.position.set(Math.cos(a) * 0.32, 0.235, Math.sin(a) * 0.32);
        urli.add(pMesh);
      }

      // Central Floating Diya
      const floatDiya = this.createSingleDiya(0, 0.24, 0, 0.7, false);
      urli.add(floatDiya);

      // Soft bowl illumination
      const urliLight = new THREE.PointLight(0xffaa00, 0.7, 3.5, 2.0);
      urliLight.position.set(pos.x, 0.4, pos.z);
      this.group.add(urliLight);
      this.diyaLights.push({ light: urliLight, baseIntensity: 0.7, offset: pos.x });

      this.group.add(urli);
    });
  }

  buildFrontDiyaArc() {
    // Arc of 8 Brass Diyas along the front perimeter of the stage floor
    const count = 8;
    const r = 5.2;
    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) - 0.5; // -0.5 to 0.5
      const angle = Math.PI * 0.5 + t * (Math.PI * 0.65);
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r * 0.7 + 0.8;
      const diya = this.createSingleDiya(x, 0.05, z, 0.75, false);
      this.group.add(diya);
    }

    const arcLightL = new THREE.PointLight(0xff9e00, 0.85, 4.5, 2.0);
    arcLightL.position.set(-2.6, 0.35, 3.8);
    this.group.add(arcLightL);
    this.diyaLights.push({ light: arcLightL, baseIntensity: 0.85, offset: 1.5 });

    const arcLightR = new THREE.PointLight(0xff9e00, 0.85, 4.5, 2.0);
    arcLightR.position.set(2.6, 0.35, 3.8);
    this.group.add(arcLightR);
    this.diyaLights.push({ light: arcLightR, baseIntensity: 0.85, offset: 3.5 });
  }

  buildOfferings() {
    this.offeringsGroup = new THREE.Group();
    this.offeringsGroup.position.set(0, 0.08, 1.8);

    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.52, 0.05, 24), this.brassMaterial);
    plate.castShadow = true;
    this.offeringsGroup.add(plate);

    // Modak pyramid
    const modakGeo = new THREE.ConeGeometry(0.08, 0.15, 14);
    modakGeo.rotateX(Math.PI);
    const modakMat = new THREE.MeshStandardMaterial({ color: 0xfffae0, roughness: 0.4 });

    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const m = new THREE.Mesh(modakGeo, modakMat);
      m.position.set(Math.cos(a) * 0.22, 0.09, Math.sin(a) * 0.22);
      this.offeringsGroup.add(m);
    }
    const centerModak = new THREE.Mesh(modakGeo, modakMat);
    centerModak.position.set(0, 0.16, 0);
    this.offeringsGroup.add(centerModak);

    this.group.add(this.offeringsGroup);
  }

  buildAartiThali() {
    this.aartiGroup = new THREE.Group();
    this.aartiGroup.position.set(0, 1.6, 2.8);
    this.aartiGroup.visible = false;

    const aartiPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.35, 0.05, 24), this.goldMaterial);
    this.aartiGroup.add(aartiPlate);

    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const diyaCup = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.04, 0.06, 12), this.goldMaterial);
      diyaCup.position.set(Math.cos(ang) * 0.28, 0.05, Math.sin(ang) * 0.28);
      this.aartiGroup.add(diyaCup);

      const flameMat = new THREE.ShaderMaterial({
        vertexShader: DiyaFlameShader.vertexShader,
        fragmentShader: DiyaFlameShader.fragmentShader,
        uniforms: THREE.UniformsUtils.clone(DiyaFlameShader.uniforms),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.flameMaterials.push(flameMat);
      const flame = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.35), flameMat);
      flame.position.set(Math.cos(ang) * 0.28, 0.22, Math.sin(ang) * 0.28);
      this.aartiGroup.add(flame);
    }

    this.aartiLight = new THREE.PointLight(0xffa500, 2.0, 5.5, 1.8);
    this.aartiLight.position.set(0, 0.4, 0);
    this.aartiGroup.add(this.aartiLight);

    this.group.add(this.aartiGroup);
  }

  ringBell(bellIndex) {
    const bell = this.interactiveBells[bellIndex];
    if (!bell) return;
    bell.userData.swingVel = 0.32;
    audio.playTempleBell(bell.userData.pitch);
  }

  ringRandomBell() {
    const idx = Math.floor(Math.random() * this.interactiveBells.length);
    this.ringBell(idx);
  }

  toggleAarti() {
    this.isAartiActive = !this.isAartiActive;
    this.aartiGroup.visible = this.isAartiActive;
    if (this.isAartiActive) {
      audio.playShankh();
      setTimeout(() => audio.playTempleBell(1.0), 1200);
    }
    return this.isAartiActive;
  }

  update(time, delta) {
    this.flameMaterials.forEach(mat => {
      mat.uniforms.uTime.value = time;
    });

    this.diyaLights.forEach(d => {
      const flicker = Math.sin(time * 8.0 + d.offset) * 0.12;
      d.light.intensity = Math.max(0.4, d.baseIntensity + flicker);
    });

    this.interactiveBells.forEach(bell => {
      const gravity = 9.8;
      const damping = 0.965;
      bell.userData.swingVel += -gravity * Math.sin(bell.userData.swingAngle) * delta * 2.5;
      bell.userData.swingVel *= damping;
      bell.userData.swingAngle += bell.userData.swingVel * delta * 12.0;

      bell.rotation.z = bell.userData.swingAngle;
    });

    if (this.haloDiscMesh) {
      this.haloDiscMesh.scale.setScalar(1.0 + Math.sin(time * 1.5) * 0.02);
    }

    if (this.isAartiActive) {
      this.aartiAngle += delta * 1.2;
      const r = 2.2;
      const h = 2.0 + Math.sin(this.aartiAngle * 2.0) * 0.25;
      this.aartiGroup.position.set(
        Math.cos(this.aartiAngle) * r,
        h,
        Math.sin(this.aartiAngle) * r
      );
      this.aartiGroup.rotation.y = -this.aartiAngle + Math.PI * 0.5;
    }
  }

  setTheme(themeName) {
    if (themeName === 'cyan') {
      this.stoneMaterial.color.set(0x050e1a);
      this.pillarMaterial.color.set(0x08182b);
      this.haloDiscMesh.material.color.set(0x00f5d4);
      this.prabhavaliMaterial.emissive.set(0x00b4d8);
      this.spotLights.forEach(s => s.color.set(0xffecd1));
    } else if (themeName === 'gold') {
      this.stoneMaterial.color.set(0x140a03);
      this.pillarMaterial.color.set(0x241105);
      this.haloDiscMesh.material.color.set(0xffb703);
      this.prabhavaliMaterial.emissive.set(0xfb8500);
      this.spotLights.forEach(s => s.color.set(0xffeedb));
    } else if (themeName === 'cosmic') {
      this.stoneMaterial.color.set(0x080614);
      this.pillarMaterial.color.set(0x150d24);
      this.haloDiscMesh.material.color.set(0x9d4edd);
      this.prabhavaliMaterial.emissive.set(0x7209b7);
      this.spotLights.forEach(s => s.color.set(0xe0aaff));
    }
  }
}
