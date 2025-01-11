import GUI from "lil-gui";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import firefliesVertexShader from "./Shaders/fireflies/vertex.glsl";
import firefliesFragmentShader from "./Shaders/fireflies/fragment.glsl";
import portalVertexShader from "./shaders/portal/vertex.glsl";
import portalFragmentShader from "./shaders/portal/fragment.glsl";
import { DirectionalLight } from "three";

/**
 * Base
 */
// Debug
const debugObject = {};
const gui = new GUI({
  width: 400,
});

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Loaders
 */
// Texture loader
const textureLoader = new THREE.TextureLoader();

// Draco loader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/");

// GLTF loader
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);
/**
 * Textures
 */
const bakedTexture = textureLoader.load("baked-final.jpg");
bakedTexture.flipY = false;
bakedTexture.colorSpace = THREE.SRGBColorSpace;

const foxTexture = textureLoader.load("/fox/Texture.png")
foxTexture.colorSpace=THREE.SRGBColorSpace;

//Lights (temporary)

const light= new THREE.DirectionalLight(0x99967c,18)
light.position.set(-4,6,-6)
scene.add(light)

/**
 * Material
 */
// Baked Material
const bakedMaterial = new THREE.MeshBasicMaterial({
  map: bakedTexture,
  side: THREE.DoubleSide,
});

const foxMaterial = new THREE.MeshBasicMaterial({
    map:foxTexture,
    side: THREE.DoubleSide
})

//Pole Light material
const poleLightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffe5 });

//Portal Light Material
debugObject.portalColorStart = "#000000";
debugObject.portalColorEnd = "#ffffff";

gui.addColor(debugObject, "portalColorStart").onChange(() => {
  portalLightMaterial.uniforms.uColorStart.value.set(
    debugObject.portalColorStart
  );
});

gui.addColor(debugObject, "portalColorEnd").onChange(() => {
  portalLightMaterial.uniforms.uColorEnd.value.set(debugObject.portalColorEnd);
});

const portalLightMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uColorStart: { value: new THREE.Color(debugObject.portalColorStart) },
    uColorEnd: { value: new THREE.Color(debugObject.portalColorEnd) },
  },
  vertexShader: portalVertexShader,
  fragmentShader: portalFragmentShader,
});

/**
 * Model
 */

gltfLoader.load("Winter-portal-FINAL.glb", (gltf) => {
  const bakedMesh = gltf.scene.children.find((child) => child.name === "baked");
  const poleLightAMesh = gltf.scene.children.find((child) => {
    return child.name === "poleLightA";
  });
  const poleLightBMesh = gltf.scene.children.find((child) => {
    return child.name === "poleLightB";
  });
  const portalLightMesh = gltf.scene.children.find((child) => {
    return child.name === "portalLight";
  });
  const portableLightAMesh = gltf.scene.children.find((child) => {
    return child.name === "portableLightA";
  });
  const portableLightBMesh = gltf.scene.children.find((child) => {
    return child.name === "portableLightB";
  });

  bakedMesh.material = bakedMaterial;
  poleLightAMesh.material = poleLightMaterial;
  poleLightBMesh.material = poleLightMaterial;
  portableLightAMesh.material = poleLightMaterial;
  portableLightBMesh.material = poleLightMaterial;
  portalLightMesh.material = portalLightMaterial;
  scene.add(gltf.scene);
});

let mixer = null
gltfLoader.load("fox/Fox.glb", (gltfFox) => {
        //Animation
    mixer= new THREE.AnimationMixer(gltfFox.scene)
    const action = mixer.clipAction(gltfFox.animations[0])
    action.play()

    const fox = gltfFox.scene
    fox.rotation.y=Math.PI+0.4
    fox.material=foxMaterial
    gltfFox.scene.scale.set(0.003,0.003,0.003)
    gltfFox.scene.position.set(2.6, 0,0.5)
    scene.add(gltfFox.scene)

    console.log(fox)

  });


/**
 * Fireflies
 */
// Geometry
const firefliesGeometry = new THREE.BufferGeometry();
const firefliesCount = 50;
const positionArray = new Float32Array(firefliesCount * 3);
const scaleArray = new Float32Array(firefliesCount);

for (let i = 0; i < firefliesCount; i++) {
  positionArray[i * 3 + 0] = (Math.random() - 0.4) * 5.0;
  positionArray[i * 3 + 1] = Math.random() * 1.5;
  positionArray[i * 3 + 2] = (Math.random() - 0.5) * 4;

  scaleArray[i] = Math.random();
}

firefliesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3)
);
firefliesGeometry.setAttribute(
  "aScale",
  new THREE.BufferAttribute(scaleArray, 1)
);

//Material
const firefliesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 200 },
  },
  vertexShader: firefliesVertexShader,
  fragmentShader: firefliesFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

gui
  .add(firefliesMaterial.uniforms.uSize, "value")
  .min(0)
  .max(500)
  .step(1)
  .name("firefliesSize");

//Points
const fireflies = new THREE.Points(firefliesGeometry, firefliesMaterial);
scene.add(fireflies);

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  //Update fireflies
  firefliesMaterial.uniforms.uPixelRatio.value = Math.min(
    window.devicePixelRatio,
    2
  );
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  45,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(4,3,6)
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

debugObject.clearColor = "#110e0e";
renderer.setClearColor(debugObject.clearColor);
gui.addColor(debugObject, "clearColor").onChange(() => {
  renderer.setClearColor(debugObject.clearColor);
});

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime=0

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime=elapsedTime-previousTime
  previousTime=elapsedTime

  //Update mixer
  if (mixer !== null){
    mixer.update(deltaTime)
  }

  //Update Materials
  portalLightMaterial.uniforms.uTime.value = elapsedTime;
  firefliesMaterial.uniforms.uTime.value = elapsedTime;

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();
