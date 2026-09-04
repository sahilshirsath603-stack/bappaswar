// 3D Sacred Murti Portal displaying high-resolution Ganpati images with golden ornate frame and dynamic lighting
import * as THREE from 'three';

export const MURTI_IMAGES = [
  {
    id: 'lalbaug',
    name: 'श्री गणेश (Lalbaugcha Raja)',
    src: './images/3cd484ac18430ab6a4931511eaf84c7e.jpg',
    aspect: 0.67
  },
  {
    id: 'parashu',
    name: 'विघ्नहर्ता (Divya Parashu)',
    src: './images/875446525bbd8a5ea161d5b97cfecbd6.jpg',
    aspect: 0.8
  },
  {
    id: 'sinhasan',
    name: 'सिंहासन गणेश (Lion Throne)',
    src: './images/2ee3da2e2898e0f5942a8735e47c3b1c.jpg',
    aspect: 0.56
  },
  {
    id: 'utsav',
    name: 'गुलाल उत्सव (Grand Utsav)',
    src: './images/ajeet-mestry-BtURpnC-J3U-unsplash.jpg',
    aspect: 0.8
  },
  {
    id: 'pushpa',
    name: 'पुष्प वर्षा (Flower Blessing)',
    src: './images/sonika-agarwal-iGWXUXGY1YQ-unsplash.jpg',
    aspect: 0.67
  }
];

export class GaneshaImageModel {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = "GaneshaCenterpiece";

    this.currentIndex = 0;
    this.textures = [];
    this.loader = new THREE.TextureLoader();

    this.initMaterials();
    this.loadInitialTexture();
    this.buildPortal();

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => this.preloadRemaining());
    } else {
      setTimeout(() => this.preloadRemaining(), 2500);
    }
  }

  initMaterials() {
    // Ornate gold border frame material
    this.goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd166,
      metalness: 0.88,
      roughness: 0.22,
      emissive: 0x3a2200,
      emissiveIntensity: 0.15
    });

    // Dark sanctum backplate
    this.backMaterial = new THREE.MeshStandardMaterial({
      color: 0x050e18,
      roughness: 0.5,
      metalness: 0.2
    });

    // Main murti image material (Crisp, vivid, and illuminated)
    this.imageMaterial = new THREE.MeshStandardMaterial({
      roughness: 0.25,
      metalness: 0.05,
      transparent: true,
      opacity: 1.0,
      emissive: 0x333333,
      emissiveIntensity: 0.38,
      side: THREE.FrontSide
    });

    // Lotus petal material for base
    this.lotusMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f2b48,
      emissive: 0x0a1c30,
      emissiveIntensity: 0.2,
      roughness: 0.45,
      metalness: 0.15,
      side: THREE.DoubleSide
    });
  }

  loadTexture(index, onComplete) {
    if (this.textures[index]) {
      if (onComplete) onComplete(this.textures[index]);
      return;
    }
    const item = MURTI_IMAGES[index];
    if (!item) return;

    this.loader.load(
      item.src,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        this.textures[index] = tex;

        if (index === this.currentIndex) {
          this.imageMaterial.map = tex;
          this.imageMaterial.needsUpdate = true;
        }
        if (onComplete) onComplete(tex);
      },
      undefined,
      (err) => {
        console.warn('Could not load murti texture:', item.src, err);
      }
    );
  }

  loadInitialTexture() {
    this.loadTexture(this.currentIndex);
  }

  preloadRemaining() {
    MURTI_IMAGES.forEach((_, idx) => {
      if (idx !== this.currentIndex && !this.textures[idx]) {
        setTimeout(() => this.loadTexture(idx), (idx + 1) * 800);
      }
    });
  }

  buildPortal() {
    this.portalGroup = new THREE.Group();
    this.portalGroup.position.set(0, 2.7, 0);

    // Frame Dimensions: Height ~ 4.2, Width ~ 3.1
    const frameW = 3.1;
    const frameH = 4.2;
    const frameD = 0.15;

    // 1. Murti Display Plane
    const imageGeo = new THREE.PlaneGeometry(frameW - 0.2, frameH - 0.2);
    this.imageMesh = new THREE.Mesh(imageGeo, this.imageMaterial);
    this.imageMesh.position.set(0, 0, frameD * 0.5 + 0.01);
    this.imageMesh.castShadow = true;
    this.imageMesh.receiveShadow = true;
    this.portalGroup.add(this.imageMesh);

    // 2. Ornate Golden Frame Outer Border
    const createFrameBorder = () => {
      const shape = new THREE.Shape();
      const w = frameW * 0.5;
      const h = frameH * 0.5;
      const r = 0.25;

      // Rounded rectangle outer
      shape.moveTo(-w + r, -h);
      shape.lineTo(w - r, -h);
      shape.quadraticCurveTo(w, -h, w, -h + r);
      shape.lineTo(w, h - r);
      shape.quadraticCurveTo(w, h, w - r, h);
      shape.lineTo(-w + r, h);
      shape.quadraticCurveTo(-w, h, -w, h - r);
      shape.lineTo(-w, -h + r);
      shape.quadraticCurveTo(-w, -h, -w + r, -h);

      // Hole for image opening
      const hole = new THREE.Path();
      const iw = (frameW - 0.2) * 0.5;
      const ih = (frameH - 0.2) * 0.5;
      hole.moveTo(-iw, -ih);
      hole.lineTo(iw, -ih);
      hole.lineTo(iw, ih);
      hole.lineTo(-iw, ih);
      hole.closePath();
      shape.holes.push(hole);

      const extrudeSettings = {
        depth: frameD,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.03,
        bevelSegments: 3
      };
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    };

    const frameGeo = createFrameBorder();
    frameGeo.center();
    const frameMesh = new THREE.Mesh(frameGeo, this.goldMaterial);
    frameMesh.position.set(0, 0, 0);
    frameMesh.castShadow = true;
    this.portalGroup.add(frameMesh);

    // 3. Ornate Crown Crest on Top of Frame (Kalash Crest)
    const crestGeo = new THREE.OctahedronGeometry(0.25, 0);
    const crest = new THREE.Mesh(crestGeo, this.goldMaterial);
    crest.position.set(0, frameH * 0.5 + 0.18, 0.05);
    crest.rotation.y = Math.PI * 0.25;
    this.portalGroup.add(crest);

    // Gemstone in center of crest
    const rubyGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const rubyMat = new THREE.MeshStandardMaterial({
      color: 0xd90429,
      emissive: 0xef233c,
      emissiveIntensity: 0.6
    });
    const ruby = new THREE.Mesh(rubyGeo, rubyMat);
    ruby.position.set(0, frameH * 0.5 + 0.18, 0.22);
    this.portalGroup.add(ruby);

    // 4. Backplate
    const backGeo = new THREE.PlaneGeometry(frameW + 0.1, frameH + 0.1);
    const backMesh = new THREE.Mesh(backGeo, this.backMaterial);
    backMesh.position.set(0, 0, -frameD * 0.5 - 0.01);
    backMesh.rotation.y = Math.PI;
    this.portalGroup.add(backMesh);

    this.group.add(this.portalGroup);

    // 5. Lotus Pedestal Base
    this.buildLotusPedestal();
  }

  buildLotusPedestal() {
    this.pedestalGroup = new THREE.Group();

    // Central Gold Disc
    const centerDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.8, 0.25, 36),
      this.goldMaterial
    );
    centerDisc.position.set(0, 0.12, 0);
    centerDisc.receiveShadow = true;
    this.pedestalGroup.add(centerDisc);

    // Base Tier Disc
    const baseDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(2.0, 2.2, 0.18, 36),
      new THREE.MeshStandardMaterial({ color: 0x071526, roughness: 0.4, metalness: 0.4 })
    );
    baseDisc.position.set(0, -0.08, 0);
    this.pedestalGroup.add(baseDisc);

    // Blooming Lotus Petals
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

    const petalGeo = createPetalGeometry(0.42, 0.8, 0.28);
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const petal = new THREE.Mesh(petalGeo, this.lotusMaterial);
      petal.position.set(Math.cos(angle) * 1.5, 0.15, Math.sin(angle) * 1.5);
      petal.rotation.set(0.65, -angle + Math.PI * 0.5, 0);
      petal.castShadow = true;
      this.pedestalGroup.add(petal);
    }

    this.group.add(this.pedestalGroup);
  }

  setMurtiIndex(index) {
    if (index < 0 || index >= MURTI_IMAGES.length) return;
    this.currentIndex = index;

    if (this.textures[index]) {
      this.imageMaterial.map = this.textures[index];
      this.imageMaterial.needsUpdate = true;
    } else {
      this.loadTexture(index);
    }
  }

  nextMurti() {
    const nextIdx = (this.currentIndex + 1) % MURTI_IMAGES.length;
    this.setMurtiIndex(nextIdx);
    return MURTI_IMAGES[nextIdx];
  }

  prevMurti() {
    const prevIdx = (this.currentIndex - 1 + MURTI_IMAGES.length) % MURTI_IMAGES.length;
    this.setMurtiIndex(prevIdx);
    return MURTI_IMAGES[prevIdx];
  }

  update(time, delta) {
    // Gentle serene breathing float
    const floatOffset = Math.sin(time * 1.2) * 0.04;
    if (this.portalGroup) {
      this.portalGroup.position.y = 2.7 + floatOffset;
    }
  }

  setTheme(themeName) {
    if (themeName === 'cyan') {
      this.lotusMaterial.color.set(0x0f2b48);
      this.lotusMaterial.emissive.set(0x0a1c30);
      this.goldMaterial.color.set(0xffd166);
    } else if (themeName === 'gold') {
      this.lotusMaterial.color.set(0x9f1239);
      this.lotusMaterial.emissive.set(0x4c0519);
      this.goldMaterial.color.set(0xffb703);
    } else if (themeName === 'cosmic') {
      this.lotusMaterial.color.set(0x312e81);
      this.lotusMaterial.emissive.set(0x1e1b4b);
      this.goldMaterial.color.set(0xe0aaff);
    }
  }
}
