// Soothing, Aesthetic & Calm Shaders for Peaceful Devotional Experience
import * as THREE from 'three';

export const SparkleTurquoiseShader = {
  uniforms: {
    uTime: { value: 0 },
    uBaseColor1: { value: new THREE.Color(0x0a2640) }, // Deep serene midnight blue
    uBaseColor2: { value: new THREE.Color(0x148a94) }, // Calm turquoise teal
    uBaseColor3: { value: new THREE.Color(0x48cae4) }, // Soft glowing cyan rim
    uGlintColor: { value: new THREE.Color(0xf0fdff) }, // Gentle pearlescent shine
    uGoldColor: { value: new THREE.Color(0xffd166) },  // Warm subtle gold
    uLightPos: { value: new THREE.Vector3(3.5, 6.5, 5.0) },
    uAuraIntensity: { value: 0.85 }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uBaseColor1;
    uniform vec3 uBaseColor2;
    uniform vec3 uBaseColor3;
    uniform vec3 uGlintColor;
    uniform vec3 uGoldColor;
    uniform vec3 uLightPos;
    uniform float uAuraIntensity;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 lightDir = normalize(uLightPos - vWorldPosition);
      vec3 halfDir = normalize(lightDir + viewDir);

      // Smooth diffuse wrap lighting (Subsurface scattering feel)
      float NdotL = dot(normal, lightDir);
      float wrapDiff = max((NdotL + 0.35) / 1.35, 0.0);

      // Soft serene Fresnel rim
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.2);

      // Smooth vertical gradient
      float heightGradient = clamp((vPosition.y + 1.0) * 0.35, 0.0, 1.0);
      vec3 skinColor = mix(uBaseColor1, uBaseColor2, heightGradient);
      skinColor = mix(skinColor, uBaseColor3, pow(heightGradient, 2.0) * 0.45);

      // Gentle, calm specular glint
      float NdotH = max(dot(normal, halfDir), 0.0);
      float spec = pow(NdotH, 32.0);

      vec3 finalColor = skinColor * wrapDiff;
      finalColor += uGlintColor * spec * 0.25;
      finalColor += uBaseColor3 * fresnel * 0.7 * uAuraIntensity;
      finalColor += uGoldColor * (fresnel * 0.18);

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export const SilkFabricShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorDeep: { value: new THREE.Color(0x081f38) },
    uColorMid: { value: new THREE.Color(0x134e73) },
    uColorSheen: { value: new THREE.Color(0x7ed6ea) },
    uGoldTrim: { value: new THREE.Color(0xffd166) },
    uLightPos: { value: new THREE.Vector3(3.5, 6.5, 5.0) }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorDeep;
    uniform vec3 uColorMid;
    uniform vec3 uColorSheen;
    uniform vec3 uGoldTrim;
    uniform vec3 uLightPos;

    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      vec3 lightDir = normalize(uLightPos - vWorldPosition);

      float NdotL = max(dot(normal, lightDir), 0.0);
      float VdotN = max(dot(viewDir, normal), 0.0);
      float sheen = pow(1.0 - VdotN, 2.5);

      vec3 cloth = mix(uColorDeep, uColorMid, NdotL * 0.7 + 0.3);
      cloth = mix(cloth, uColorSheen, sheen * 0.65);

      float edgeBorder = smoothstep(0.04, 0.0, vUv.y) + smoothstep(0.96, 1.0, vUv.y);
      cloth = mix(cloth, uGoldTrim, clamp(edgeBorder, 0.0, 1.0) * 0.75);

      gl_FragColor = vec4(cloth, 1.0);
    }
  `
};

export const DiyaFlameShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorCore: { value: new THREE.Color(0xffffff) },
    uColorInner: { value: new THREE.Color(0xffd166) },
    uColorOuter: { value: new THREE.Color(0xff6b35) }
  },
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 pos = position;
      // Gentle calm flame sway
      float flicker = sin(uTime * 6.0 + position.y * 5.0) * 0.02 * (position.y + 0.5);
      pos.x += flicker;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorCore;
    uniform vec3 uColorInner;
    uniform vec3 uColorOuter;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5, 0.2);
      float dist = length(vUv - center);
      float verticalFade = 1.0 - smoothstep(0.1, 0.95, vUv.y);
      
      float coreMask = smoothstep(0.2, 0.02, dist);
      float outerMask = smoothstep(0.44, 0.05, dist) * verticalFade;

      vec3 color = mix(uColorOuter, uColorInner, coreMask * 1.4);
      color = mix(color, uColorCore, pow(coreMask, 2.2));

      float alpha = outerMask;
      if (alpha < 0.02) discard;

      gl_FragColor = vec4(color * 1.2, alpha * 0.9);
    }
  `
};

export const GlowingTilakShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorGlow: { value: new THREE.Color(0xffffff) },
    uIntensity: { value: 1.4 }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColorGlow;
    uniform float uIntensity;

    void main() {
      float pulse = 0.92 + 0.08 * sin(uTime * 2.0);
      vec3 col = uColorGlow * uIntensity * pulse;
      gl_FragColor = vec4(col, 1.0);
    }
  `
};
