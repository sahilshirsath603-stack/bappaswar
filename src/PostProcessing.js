// Serene, Soft Post-Processing Pipeline
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const CinematicVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uOffset: { value: 1.05 },
    uDarkness: { value: 1.15 },
    uTime: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uOffset;
    uniform float uDarkness;
    varying vec2 vUv;

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(uOffset);
      float dist = length(uv);
      float vignette = smoothstep(0.85, 0.35, dist * (uDarkness * 0.7));
      gl_FragColor = vec4(tex.rgb * vignette, tex.a);
    }
  `
};

export class PostProcessingManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    const size = new THREE.Vector2();
    renderer.getSize(size);

    this.composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Soft, dreamy bloom (calming and gentle)
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.x, size.y),
      0.55, // strength
      0.35, // radius
      0.82  // threshold
    );
    this.composer.addPass(this.bloomPass);

    this.vignettePass = new ShaderPass(CinematicVignetteShader);
    this.vignettePass.renderToScreen = true;
    this.composer.addPass(this.vignettePass);
  }

  resize(width, height) {
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }

  render(time) {
    this.composer.render();
  }

  setBloomStrength(strength) {
    this.bloomPass.strength = strength;
  }
}
