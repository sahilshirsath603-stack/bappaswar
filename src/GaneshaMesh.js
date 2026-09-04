// Simple, Calm & Aesthetic 3D Sculpture of Lord Ganesha
import * as THREE from 'three';
import { SparkleTurquoiseShader, SilkFabricShader, GlowingTilakShader } from './Shaders.js';

export class GaneshaModel {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = "GaneshaCenterpiece";

    this.materials = {};
    this.animatedMeshes = [];
    this.initMaterials();
    this.buildModel();
  }

  initMaterials() {
    // 1. Serene Turquoise Silk Skin Shader
    this.materials.sparkleSkin = new THREE.ShaderMaterial({
      vertexShader: SparkleTurquoiseShader.vertexShader,
      fragmentShader: SparkleTurquoiseShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(SparkleTurquoiseShader.uniforms),
      side: THREE.FrontSide
    });

    // 2. Draped Silk Robe Shader
    this.materials.silkRobe = new THREE.ShaderMaterial({
      vertexShader: SilkFabricShader.vertexShader,
      fragmentShader: SilkFabricShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(SilkFabricShader.uniforms),
      side: THREE.DoubleSide
    });

    // 3. Glowing Tilak Shader
    this.materials.glowingTilak = new THREE.ShaderMaterial({
      vertexShader: GlowingTilakShader.vertexShader,
      fragmentShader: GlowingTilakShader.fragmentShader,
      uniforms: THREE.UniformsUtils.clone(GlowingTilakShader.uniforms),
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    // 4. Warm Satin Gold
    this.materials.gold = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x3d2700,
      emissiveIntensity: 0.15
    });

    // 5. Polished Axe Staff
    this.materials.woodStaff = new THREE.MeshStandardMaterial({
      color: 0x3d2314,
      roughness: 0.5,
      metalness: 0.1
    });

    // 6. Radiant Axe Blade
    this.materials.axeBlade = new THREE.MeshStandardMaterial({
      color: 0xe0a93b,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x301800,
      emissiveIntensity: 0.2
    });

    // 7. Ivory Tusk
    this.materials.ivory = new THREE.MeshStandardMaterial({
      color: 0xfffcf2,
      roughness: 0.25,
      metalness: 0.05
    });

    // 8. Gemstone Ruby
    this.materials.ruby = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      metalness: 0.3,
      roughness: 0.15,
      emissive: 0x9b111e,
      emissiveIntensity: 0.35
    });

    // 9. Lotus Petal
    this.materials.lotusPetal = new THREE.MeshStandardMaterial({
      color: 0x0f2b48,
      emissive: 0x0a1c30,
      emissiveIntensity: 0.2,
      roughness: 0.45,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
  }

  buildModel() {
    this.buildHead();
    this.buildTrunk();
    this.buildEars();
    this.buildEyesAndTilak();
    this.buildTusks();
    this.buildMukutCrown();

    this.buildTorso();
    this.buildShawl();
    this.buildJewelry();
    this.buildParashuAxe();

    this.buildLotusPedestal();

    // Position centered and grounded
    this.group.position.set(0, 0.2, 0);
  }

  buildHead() {
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 3.0, 0);

    // Clean, smooth head sphere with gentle elephant slope
    const headGeo = new THREE.SphereGeometry(0.92, 36, 36);
    headGeo.scale(1.0, 1.08, 0.95);
    const headMesh = new THREE.Mesh(headGeo, this.materials.sparkleSkin);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    this.headGroup.add(headMesh);

    // Smooth subtle cranial forehead curve
    const browGeo = new THREE.SphereGeometry(0.65, 24, 24);
    browGeo.scale(1.1, 0.65, 0.9);
    const brow = new THREE.Mesh(browGeo, this.materials.sparkleSkin);
    brow.position.set(0, 0.3, 0.25);
    this.headGroup.add(brow);

    this.group.add(this.headGroup);
  }

  buildTrunk() {
    // Elegant, smooth single-curve elephant trunk (Vakratunda)
    const trunkPoints = [
      new THREE.Vector3(0, 0.15, 0.72),
      new THREE.Vector3(0.02, -0.35, 0.88),
      new THREE.Vector3(0.04, -0.85, 0.92),
      new THREE.Vector3(0.08, -1.35, 0.85),
      new THREE.Vector3(0.24, -1.7, 0.75),
      new THREE.Vector3(0.48, -1.82, 0.7),
      new THREE.Vector3(0.62, -1.65, 0.68)
    ];

    const trunkCurve = new THREE.CatmullRomCurve3(trunkPoints);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 40, 0.28, 20, false);
    const trunkMesh = new THREE.Mesh(trunkGeo, this.materials.sparkleSkin);
    trunkMesh.castShadow = true;
    this.headGroup.add(trunkMesh);

    // Golden Modak sweet at the tip of the trunk
    const modakGeo = new THREE.ConeGeometry(0.09, 0.16, 16);
    modakGeo.rotateX(Math.PI);
    const modakMesh = new THREE.Mesh(modakGeo, this.materials.gold);
    modakMesh.position.set(0.62, -1.65, 0.68);
    this.headGroup.add(modakMesh);
  }

  buildEars() {
    // Calm, smooth fan-shaped elephant ears
    const earShape = new THREE.Shape();
    earShape.moveTo(0, 0);
    earShape.bezierCurveTo(0.3, 0.55, 0.95, 0.75, 1.3, 0.3);
    earShape.bezierCurveTo(1.45, -0.1, 1.35, -0.55, 0.9, -0.95);
    earShape.bezierCurveTo(0.5, -1.15, 0.1, -0.85, 0, -0.3);
    earShape.closePath();

    const earGeo = new THREE.ExtrudeGeometry(earShape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.02,
      bevelSegments: 3
    });

    // Left Ear
    const leftEar = new THREE.Mesh(earGeo, this.materials.sparkleSkin);
    leftEar.position.set(0.5, 0.2, -0.1);
    leftEar.rotation.set(0.05, 0.28, -0.1);
    leftEar.castShadow = true;
    this.headGroup.add(leftEar);

    // Right Ear
    const rightEar = new THREE.Mesh(earGeo, this.materials.sparkleSkin);
    rightEar.position.set(-0.5, 0.2, -0.1);
    rightEar.rotation.set(0.05, -0.28, 0.1);
    rightEar.scale.set(-1.0, 1.0, 1.0);
    rightEar.castShadow = true;
    this.headGroup.add(rightEar);

    // Delicate Golden Ear Rings (Kundal)
    const kundalGeo = new THREE.TorusGeometry(0.14, 0.025, 12, 24);
    const leftKundal = new THREE.Mesh(kundalGeo, this.materials.gold);
    leftKundal.position.set(1.3, -0.5, -0.05);
    leftKundal.rotation.y = Math.PI * 0.4;
    this.headGroup.add(leftKundal);

    const rightKundal = new THREE.Mesh(kundalGeo, this.materials.gold);
    rightKundal.position.set(-1.3, -0.5, -0.05);
    rightKundal.rotation.y = -Math.PI * 0.4;
    this.headGroup.add(rightKundal);

    this.animatedMeshes.push({ mesh: leftEar, type: 'earWiggle', dir: 1 });
    this.animatedMeshes.push({ mesh: rightEar, type: 'earWiggle', dir: -1 });
  }

  buildEyesAndTilak() {
    // 1. Serene Meditative Eyes (Calm downwards gaze)
    const createEye = (isRight) => {
      const eyeGroup = new THREE.Group();
      const eyeGeo = new THREE.SphereGeometry(0.085, 16, 16);
      eyeGeo.scale(1.4, 0.5, 0.4);

      const eyeDark = new THREE.Mesh(eyeGeo, new THREE.MeshStandardMaterial({
        color: 0x071526,
        roughness: 0.1
      }));
      eyeGroup.add(eyeDark);

      // Eyelid line with soft gold edge
      const lidGeo = new THREE.TorusGeometry(0.095, 0.014, 8, 16, Math.PI * 0.95);
      const lid = new THREE.Mesh(lidGeo, this.materials.gold);
      lid.position.set(0, 0.02, 0.03);
      lid.rotation.z = Math.PI;
      eyeGroup.add(lid);

      const side = isRight ? 1 : -1;
      eyeGroup.position.set(side * 0.32, 0.15, 0.76);
      eyeGroup.rotation.set(-0.12, side * 0.35, side * -0.08);
      return eyeGroup;
    };

    this.headGroup.add(createEye(true));
    this.headGroup.add(createEye(false));

    // 2. Glowing Forehead Tilak (Clean, luminous white/silver Trishul crescent)
    const tilakGroup = new THREE.Group();
    tilakGroup.position.set(0, 0.45, 0.85);
    tilakGroup.rotation.x = -0.16;

    // Curved crescent base
    const crescentCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.16, 0.12, 0),
      new THREE.Vector3(0, -0.06, 0),
      new THREE.Vector3(0.16, 0.12, 0)
    );
    const crescentMesh = new THREE.Mesh(
      new THREE.TubeGeometry(crescentCurve, 20, 0.02, 10, false),
      this.materials.glowingTilak
    );
    tilakGroup.add(crescentMesh);

    // Center vertical flame
    const flameGeo = new THREE.ConeGeometry(0.025, 0.22, 12);
    flameGeo.rotateZ(Math.PI);
    const flameMesh = new THREE.Mesh(flameGeo, this.materials.glowingTilak);
    flameMesh.position.set(0, 0.09, 0.015);
    tilakGroup.add(flameMesh);

    // Central red bindu
    const bindu = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), this.materials.ruby);
    bindu.position.set(0, -0.01, 0.02);
    tilakGroup.add(bindu);

    this.headGroup.add(tilakGroup);
  }

  buildTusks() {
    // 1. Right intact tusk
    const tuskCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.1, -0.18, 0.15),
      new THREE.Vector3(0.2, -0.3, 0.28)
    ]);
    const tuskR = new THREE.Mesh(new THREE.TubeGeometry(tuskCurveR, 16, 0.055, 12, false), this.materials.ivory);
    tuskR.position.set(0.24, -0.18, 0.7);
    tuskR.castShadow = true;
    this.headGroup.add(tuskR);

    // 2. Left broken tusk (Ekadanta)
    const tuskCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.06, -0.12, 0.1)
    ]);
    const tuskL = new THREE.Mesh(new THREE.TubeGeometry(tuskCurveL, 10, 0.055, 12, false), this.materials.ivory);
    tuskL.position.set(-0.24, -0.18, 0.7);
    tuskL.castShadow = true;
    this.headGroup.add(tuskL);
  }

  buildMukutCrown() {
    this.crownGroup = new THREE.Group();
    this.crownGroup.position.set(0, 0.88, 0.02);

    // Clean Diadem Base
    const baseBand = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.72, 0.18, 28), this.materials.gold);
    this.crownGroup.add(baseBand);

    // Middle Tier
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.65, 0.38, 28), this.materials.gold);
    tier1.position.set(0, 0.26, 0);
    this.crownGroup.add(tier1);

    // Dome & Kalash spire
    const spire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 20), this.materials.gold);
    spire.position.set(0, 0.7, 0);
    this.crownGroup.add(spire);

    // Ruby Gemstone Peak
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), this.materials.ruby);
    crest.position.set(0, 0.1, 0.72);
    this.crownGroup.add(crest);

    this.headGroup.add(this.crownGroup);
  }

  buildTorso() {
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.position.set(0, 1.35, 0);

    // Smooth Chest
    const torsoGeo = new THREE.SphereGeometry(0.95, 32, 32);
    torsoGeo.scale(1.05, 1.0, 0.88);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.materials.sparkleSkin);
    torsoMesh.castShadow = true;
    this.bodyGroup.add(torsoMesh);

    // Calm Lambodara belly
    const bellyGeo = new THREE.SphereGeometry(1.05, 32, 32);
    bellyGeo.scale(1.1, 0.88, 0.95);
    const bellyMesh = new THREE.Mesh(bellyGeo, this.materials.sparkleSkin);
    bellyMesh.position.set(0, -0.38, 0.1);
    bellyMesh.castShadow = true;
    this.bodyGroup.add(bellyMesh);

    // Seated Padmasana Legs
    const legL = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.32, 14, 24, Math.PI * 0.85), this.materials.sparkleSkin);
    legL.position.set(0.5, -0.78, 0.12);
    legL.rotation.set(Math.PI * 0.45, 0.2, -0.3);
    this.bodyGroup.add(legL);

    const legR = new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.32, 14, 24, Math.PI * 0.85), this.materials.sparkleSkin);
    legR.position.set(-0.5, -0.78, 0.12);
    legR.rotation.set(Math.PI * 0.45, -0.2, 0.3);
    this.bodyGroup.add(legR);

    this.buildArms();
    this.group.add(this.bodyGroup);
  }

  buildArms() {
    // Upper Arm Left holding staff
    const armCurveL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.85, 0.3, 0),
      new THREE.Vector3(0.98, -0.12, 0.25),
      new THREE.Vector3(0.55, -0.28, 0.55),
      new THREE.Vector3(0.3, -0.25, 0.65)
    ]);
    const armL = new THREE.Mesh(new THREE.TubeGeometry(armCurveL, 20, 0.18, 14, false), this.materials.sparkleSkin);
    armL.castShadow = true;
    this.bodyGroup.add(armL);

    // Upper Arm Right holding staff lower
    const armCurveR = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.85, 0.3, 0),
      new THREE.Vector3(-0.9, -0.2, 0.12),
      new THREE.Vector3(-0.3, -0.55, 0.48),
      new THREE.Vector3(-0.1, -0.65, 0.55)
    ]);
    const armR = new THREE.Mesh(new THREE.TubeGeometry(armCurveR, 20, 0.18, 14, false), this.materials.sparkleSkin);
    armR.castShadow = true;
    this.bodyGroup.add(armR);

    // Smooth hands
    const handGeo = new THREE.SphereGeometry(0.13, 14, 14);
    const handTop = new THREE.Mesh(handGeo, this.materials.sparkleSkin);
    handTop.position.set(0.3, -0.25, 0.65);
    this.bodyGroup.add(handTop);

    const handBottom = new THREE.Mesh(handGeo, this.materials.sparkleSkin);
    handBottom.position.set(-0.1, -0.65, 0.55);
    this.bodyGroup.add(handBottom);
  }

  buildShawl() {
    // Smooth flowing silk shawl over shoulders
    const shawlCurve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.05, 0.6, -0.2),
      new THREE.Vector3(-1.3, 0.12, 0.12),
      new THREE.Vector3(-1.45, -0.45, 0.42),
      new THREE.Vector3(-1.7, -0.9, 0.62)
    ]);
    const shawl1 = new THREE.Mesh(new THREE.TubeGeometry(shawlCurve1, 24, 0.22, 14, false), this.materials.silkRobe);
    shawl1.castShadow = true;
    this.bodyGroup.add(shawl1);

    const shawlCurve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.05, 0.6, -0.2),
      new THREE.Vector3(1.3, 0.12, 0.12),
      new THREE.Vector3(1.4, -0.5, 0.38),
      new THREE.Vector3(1.55, -0.95, 0.52)
    ]);
    const shawl2 = new THREE.Mesh(new THREE.TubeGeometry(shawlCurve2, 24, 0.22, 14, false), this.materials.silkRobe);
    shawl2.castShadow = true;
    this.bodyGroup.add(shawl2);

    this.animatedMeshes.push({ mesh: shawl1, type: 'clothWave', speed: 0.8 });
    this.animatedMeshes.push({ mesh: shawl2, type: 'clothWave', speed: 0.9 });
  }

  buildJewelry() {
    // Janeu across chest
    const janeuCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.65, 0.45, 0.3),
      new THREE.Vector3(-0.12, 0.0, 0.72),
      new THREE.Vector3(0.42, -0.42, 0.65),
      new THREE.Vector3(0.68, -0.72, 0.15)
    ]);
    const janeu = new THREE.Mesh(new THREE.TubeGeometry(janeuCurve, 28, 0.022, 8, false), this.materials.gold);
    this.bodyGroup.add(janeu);

    // Simple royal necklace
    const necklaceCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.65, 0.38, 0.35),
      new THREE.Vector3(0, -0.12, 0.78),
      new THREE.Vector3(0.65, 0.38, 0.35)
    ]);
    const necklace = new THREE.Mesh(new THREE.TubeGeometry(necklaceCurve, 20, 0.038, 10, false), this.materials.gold);
    this.bodyGroup.add(necklace);

    const pendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), this.materials.ruby);
    pendant.position.set(0, -0.16, 0.8);
    this.bodyGroup.add(pendant);
  }

  buildParashuAxe() {
    // Sacred Battle Axe (Parashu) held peacefully
    this.axeGroup = new THREE.Group();

    // Staff
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.2, 16), this.materials.woodStaff);
    this.axeGroup.add(staff);

    // Gold Caps
    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.15, 16), this.materials.gold);
    topCap.position.set(0, 2.0, 0);
    this.axeGroup.add(topCap);

    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.4, 16), this.materials.gold);
    tip.position.set(0, 2.25, 0);
    this.axeGroup.add(tip);

    // Crescent Blade
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.lineTo(0.2, 0.24);
    bladeShape.bezierCurveTo(0.55, 0.55, 1.05, 0.35, 1.2, -0.2);
    bladeShape.bezierCurveTo(1.05, -0.7, 0.55, -0.9, 0.2, -0.28);
    bladeShape.lineTo(0, -0.06);
    bladeShape.closePath();

    const blade = new THREE.Mesh(
      new THREE.ExtrudeGeometry(bladeShape, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.015 }),
      this.materials.axeBlade
    );
    blade.position.set(0.04, 1.7, -0.018);
    blade.castShadow = true;
    this.axeGroup.add(blade);

    this.axeGroup.position.set(0.1, 2.0, 0.62);
    this.axeGroup.rotation.set(-0.2, 0.22, -0.42);

    this.group.add(this.axeGroup);
  }

  buildLotusPedestal() {
    this.pedestalGroup = new THREE.Group();

    // Central Gold Disc
    const centerDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.6, 0.25, 36),
      this.materials.gold
    );
    centerDisc.position.set(0, 0.12, 0);
    centerDisc.receiveShadow = true;
    this.pedestalGroup.add(centerDisc);

    // Base Tier Disc
    const baseDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 2.0, 0.18, 36),
      new THREE.MeshStandardMaterial({ color: 0x071526, roughness: 0.4, metalness: 0.4 })
    );
    baseDisc.position.set(0, -0.08, 0);
    this.pedestalGroup.add(baseDisc);

    // Elegant Lotus Petals
    const createPetalGeometry = (width, length, curveHeight) => {
      const geom = new THREE.BufferGeometry();
      const segmentsU = 10;
      const segmentsV = 10;
      const positions = [];
      const normals = [];
      const uvs = [];
      const indices = [];

      for (let j = 0; j <= segmentsV; j++) {
        const v = j / segmentsV;
        const radiusAtV = Math.sin(v * Math.PI) * width;
        const y = v * length;
        const z = -Math.sin(v * Math.PI * 0.8) * curveHeight;

        for (let i = 0; i <= segmentsU; i++) {
          const u = i / segmentsU;
          const x = (u - 0.5) * 2 * radiusAtV;
          positions.push(x, y, z);
          normals.push(0, 0, 1);
          uvs.push(u, v);
        }
      }

      for (let j = 0; j < segmentsV; j++) {
        for (let i = 0; i < segmentsU; i++) {
          const a = j * (segmentsU + 1) + i;
          const b = (j + 1) * (segmentsU + 1) + i;
          const c = (j + 1) * (segmentsU + 1) + (i + 1);
          const d = j * (segmentsU + 1) + (i + 1);
          indices.push(a, b, d);
          indices.push(b, c, d);
        }
      }

      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      return geom;
    };

    const petalGeo = createPetalGeometry(0.38, 0.75, 0.25);
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, this.materials.lotusPetal);
      petal.position.set(Math.cos(angle) * 1.35, 0.15, Math.sin(angle) * 1.35);
      petal.rotation.set(0.65, -angle + Math.PI * 0.5, 0);
      petal.castShadow = true;
      this.pedestalGroup.add(petal);
    }

    this.group.add(this.pedestalGroup);
  }

  update(time, delta) {
    // Gentle, calm breathing
    const breath = Math.sin(time * 1.0) * 0.008;
    if (this.bodyGroup) {
      this.bodyGroup.scale.set(1.0 + breath * 0.5, 1.0 + breath, 1.0 + breath * 0.5);
    }

    if (this.materials.sparkleSkin && this.materials.sparkleSkin.uniforms) {
      this.materials.sparkleSkin.uniforms.uTime.value = time;
    }
    if (this.materials.silkRobe && this.materials.silkRobe.uniforms) {
      this.materials.silkRobe.uniforms.uTime.value = time;
    }
    if (this.materials.glowingTilak && this.materials.glowingTilak.uniforms) {
      this.materials.glowingTilak.uniforms.uTime.value = time;
    }

    this.animatedMeshes.forEach(item => {
      if (item.type === 'earWiggle') {
        item.mesh.rotation.y = (item.dir * 0.28) + Math.sin(time * 1.2) * 0.01 * item.dir;
      } else if (item.type === 'clothWave') {
        item.mesh.rotation.x = Math.sin(time * item.speed) * 0.015;
      }
    });
  }

  setTheme(themeName) {
    if (themeName === 'cyan') {
      this.materials.sparkleSkin.uniforms.uBaseColor1.value.set(0x0a2640);
      this.materials.sparkleSkin.uniforms.uBaseColor2.value.set(0x148a94);
      this.materials.sparkleSkin.uniforms.uBaseColor3.value.set(0x48cae4);
      this.materials.silkRobe.uniforms.uColorDeep.value.set(0x081f38);
      this.materials.silkRobe.uniforms.uColorMid.value.set(0x134e73);
      this.materials.silkRobe.uniforms.uColorSheen.value.set(0x7ed6ea);
      this.materials.lotusPetal.color.set(0x0f2b48);
      this.materials.lotusPetal.emissive.set(0x0a1c30);
    } else if (themeName === 'gold') {
      this.materials.sparkleSkin.uniforms.uBaseColor1.value.set(0x7c2d12);
      this.materials.sparkleSkin.uniforms.uBaseColor2.value.set(0xc2410c);
      this.materials.sparkleSkin.uniforms.uBaseColor3.value.set(0xfbbf24);
      this.materials.silkRobe.uniforms.uColorDeep.value.set(0x4a044e);
      this.materials.silkRobe.uniforms.uColorMid.value.set(0x86198f);
      this.materials.silkRobe.uniforms.uColorSheen.value.set(0xf5d0fe);
      this.materials.lotusPetal.color.set(0x9f1239);
      this.materials.lotusPetal.emissive.set(0x4c0519);
    } else if (themeName === 'cosmic') {
      this.materials.sparkleSkin.uniforms.uBaseColor1.value.set(0x1e1b4b);
      this.materials.sparkleSkin.uniforms.uBaseColor2.value.set(0x3730a3);
      this.materials.sparkleSkin.uniforms.uBaseColor3.value.set(0x818cf8);
      this.materials.silkRobe.uniforms.uColorDeep.value.set(0x2e1065);
      this.materials.silkRobe.uniforms.uColorMid.value.set(0x581c87);
      this.materials.silkRobe.uniforms.uColorSheen.value.set(0xc084fc);
      this.materials.lotusPetal.color.set(0x312e81);
      this.materials.lotusPetal.emissive.set(0x1e1b4b);
    }
  }
}
