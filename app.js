import * as THREE from 'three';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';

const $ = (s) => document.querySelector(s);
const viewport = $('#viewport');
const canvas = $('#scene');
const state = {
  jaw: 0.5, cheek: 0.45, ears: 0.4, fangs: 0.2,
  material: 'porcelain', preset: 'human', texture: null
};
let renderer, scene, camera, character, face, jaw, mouth, upperLip, lowerLip;
let ears = [], cheekBones = [], eyes = [], irises = [], brows = [], fangs = [];
let pointer = null, pinch = null, speechActive = false, animationFrame = 0;
const materials = {
  porcelain: new THREE.MeshStandardMaterial({ color: 0xc99f88, roughness: 0.72 }),
  graphite: new THREE.MeshStandardMaterial({ color: 0x424b5a, metalness: 0.48, roughness: 0.42 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xb98b43, metalness: 0.62, roughness: 0.34 }),
  synthetic: new THREE.MeshStandardMaterial({ color: 0x91b8c8, metalness: 0.28, roughness: 0.38 })
};
const eyeWhite = new THREE.MeshStandardMaterial({ color: 0xf0e9df, roughness: 0.3 });
const irisMaterial = new THREE.MeshStandardMaterial({ color: 0x477c83, roughness: 0.28 });
const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x10151c, roughness: 0.18 });
const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x39232a, roughness: 0.65 });
const lipMaterial = new THREE.MeshStandardMaterial({ color: 0x87504e, roughness: 0.58 });
const toothMaterial = new THREE.MeshStandardMaterial({ color: 0xf1e9d9, roughness: 0.3 });
const goldAccent = new THREE.MeshStandardMaterial({ color: 0xb98b43, metalness: 0.72, roughness: 0.28 });

function activeFaceMaterial() {
  if (state.texture) return new THREE.MeshStandardMaterial({ map: state.texture, roughness: 0.62 });
  return materials[state.material];
}
function mesh(geometry, material, position, scale, parent = character) {
  const item = new THREE.Mesh(geometry, material);
  item.position.set(...position);
  item.scale.set(...scale);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}
function ellipsoid(position, scale, material, parent = character, segments = 40) {
  return mesh(new THREE.SphereGeometry(1, segments, Math.max(24, segments * 2 / 3)), material, position, scale, parent);
}
function makeHeadGeometry() {
  // A tapered, softly sculpted head profile. The lower rings narrow into the chin.
  const profile = [
    [0.00, -0.91], [0.34, -0.89], [0.54, -0.78], [0.68, -0.55],
    [0.76, -0.20], [0.79, 0.18], [0.75, 0.52], [0.63, 0.82],
    [0.42, 1.02], [0.00, 1.10]
  ];
  const points = profile.map(([radius, y]) => new THREE.Vector2(radius, y));
  const geometry = new THREE.LatheGeometry(points, 96);
  geometry.computeVertexNormals();
  return geometry;
}
function addEye(side) {
  const socket = ellipsoid([side * 0.285, 0.12, 0.70], [0.205, 0.135, 0.105], darkMaterial);
  const eyeball = ellipsoid([side * 0.285, 0.12, 0.765], [0.158, 0.082, 0.065], eyeWhite);
  const iris = ellipsoid([side * 0.285, 0.115, 0.825], [0.055, 0.058, 0.023], irisMaterial, character, 32);
  const pupil = ellipsoid([side * 0.285, 0.115, 0.845], [0.025, 0.036, 0.012], pupilMaterial, character, 24);
  const brow = ellipsoid([side * 0.29, 0.285, 0.69], [0.22, 0.052, 0.09], activeFaceMaterial());
  eyes.push({ socket, eyeball }); irises.push(iris, pupil); brows.push(brow);
}
function buildCharacter() {
  character = new THREE.Group();
  scene.add(character);
  const skin = activeFaceMaterial();

  // Neck and shoulders sit behind the head and remain visually subordinate.
  const neck = mesh(new THREE.CylinderGeometry(0.25, 0.34, 0.78, 48), skin, [0, -1.12, -0.12], [1, 1, 1]);
  neck.position.y = -1.17;
  ellipsoid([0, -1.53, -0.16], [0.68, 0.18, 0.34], skin);

  face = mesh(makeHeadGeometry(), skin, [0, 0.12, 0], [1, 1, 1]);
  // A subtle cheek plane gives the face structure without bolted-on spheres.
  for (const side of [-1, 1]) {
    const cheek = ellipsoid([side * 0.43, -0.20, 0.49], [0.23, 0.15, 0.12], skin);
    cheekBones.push(cheek);
    const ear = ellipsoid([side * 0.77, -0.02, -0.005], [0.13, 0.25, 0.105], skin);
    ears.push(ear);
    ellipsoid([side * 0.78, -0.03, 0.085], [0.055, 0.15, 0.025], lipMaterial);
    addEye(side);
  }

  // Nose bridge, rounded tip and nostrils, all joined visually to the face.
  ellipsoid([0, 0.00, 0.70], [0.085, 0.23, 0.12], skin);
  ellipsoid([0, -0.15, 0.77], [0.12, 0.085, 0.12], skin);
  for (const side of [-1, 1]) ellipsoid([side * 0.075, -0.205, 0.755], [0.032, 0.018, 0.018], darkMaterial);

  // Mouth, chin and a separate lower jaw make the jaw-width control meaningful.
  jaw = ellipsoid([0, -0.49, 0.43], [0.48, 0.31, 0.22], skin);
  mouth = ellipsoid([0, -0.365, 0.69], [0.16, 0.035, 0.025], darkMaterial);
  upperLip = ellipsoid([0, -0.335, 0.70], [0.16, 0.035, 0.025], lipMaterial);
  lowerLip = ellipsoid([0, -0.405, 0.705], [0.145, 0.032, 0.025], lipMaterial);
  for (const side of [-1, 1]) {
    const fang = mesh(new THREE.ConeGeometry(0.035, 0.16, 20), toothMaterial, [side * 0.105, -0.43, 0.71], [1, 1, 1]);
    fangs.push(fang);
  }
  applyShape();
}
function applyShape() {
  if (!character || !jaw) return;
  jaw.scale.x = 0.39 + state.jaw * 0.23;
  jaw.scale.y = 0.25 + state.jaw * 0.10;
  cheekBones.forEach((part) => part.scale.set(0.18 + state.cheek * 0.12, 0.12 + state.cheek * 0.08, 0.105 + state.cheek * 0.035));
  ears.forEach((part) => part.scale.set(0.105 + state.ears * 0.07, 0.18 + state.ears * 0.18, 0.09));
  fangs.forEach((part) => {
    part.scale.y = 0.25 + state.fangs * 1.35;
    part.visible = state.fangs > 0.035;
  });
  if (state.preset === 'demon') brows.forEach((part, i) => { part.rotation.z = i ? -0.18 : 0.18; });
  else brows.forEach((part) => { part.rotation.z = 0; });
}
function refreshMaterials() {
  if (!character) return;
  const skin = activeFaceMaterial();
  [face, jaw, ...ears, ...cheekBones, ...brows].forEach((part) => { if (part) part.material = skin; });
}
function setSlider(name, value) {
  state[name] = value;
  const input = $('#' + name);
  const output = $('#' + name + 'Out');
  if (input) input.value = value;
  if (output) output.value = value.toFixed(2);
  applyShape();
}
function setPreset(name, button) {
  state.preset = name;
  const values = {
    human: [0.50, 0.45, 0.40, 0.08],
    vampire: [0.48, 0.52, 0.46, 0.82],
    cyborg: [0.64, 0.35, 0.30, 0.12],
    demon: [0.76, 0.72, 0.82, 0.95]
  }[name];
  ['jaw', 'cheek', 'ears', 'fangs'].forEach((key, i) => setSlider(key, values[i]));
  document.querySelectorAll('[data-preset]').forEach((item) => item.classList.toggle('active', item === button));
}
function resize() {
  if (!renderer || !viewport.clientWidth || !viewport.clientHeight) return;
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d17);
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0.02, 5.15);
  camera.lookAt(0, -0.1, 0);

  scene.add(new THREE.HemisphereLight(0xffe9dc, 0x283044, 1.55));
  const key = new THREE.DirectionalLight(0xffe5d0, 2.0);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8abbd7, 0.8);
  fill.position.set(3, 1, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x7869b8, 0.75);
  rim.position.set(-2, 1, -3);
  scene.add(rim);

  buildCharacter();
  resize();
  $('#engineStatus').textContent = '3D preview ready';
  $('#fps').textContent = 'WEBGL ACTIVE';
  const observer = new ResizeObserver(resize);
  observer.observe(viewport);
  return observer;
}
function render() {
  animationFrame = requestAnimationFrame(render);
  if (!renderer || !scene || !camera) return;
  const now = performance.now();
  if (speechActive && mouth) {
    const amount = 0.5 + 0.5 * Math.sin(now * 0.025);
    mouth.scale.y = 0.025 + amount * 0.045;
    jaw.position.y = -0.49 - amount * 0.018;
  } else if (mouth) {
    mouth.scale.y = 0.035;
    jaw.position.y = -0.49;
  }
  renderer.render(scene, camera);
}
function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
function exportPng() {
  renderer.render(scene, camera);
  canvas.toBlob((blob) => { if (blob) download(blob, 'aetherface-preview.png'); }, 'image/png');
}
function exportObj() {
  const text = new OBJExporter().parse(character);
  download(new Blob([text], { type: 'text/plain' }), 'aetherface-character.obj');
}
function resetView() {
  character.rotation.set(0, 0, 0);
  camera.position.set(0, 0.02, 5.15);
  camera.lookAt(0, -0.1, 0);
}
function attachControls() {
  ['jaw', 'cheek', 'ears', 'fangs'].forEach((key) => {
    $('#' + key).addEventListener('input', (event) => setSlider(key, Number(event.target.value)));
  });
  document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => setPreset(button.dataset.preset, button)));
  document.querySelectorAll('[data-material]').forEach((button) => button.addEventListener('click', () => {
    state.material = button.dataset.material;
    state.texture = null;
    refreshMaterials();
    document.querySelectorAll('[data-material]').forEach((item) => item.classList.toggle('active', item === button));
  }));
  $('#textureFile').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    new THREE.TextureLoader().load(url, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      state.texture = texture;
      refreshMaterials();
      URL.revokeObjectURL(url);
    }, undefined, () => {
      URL.revokeObjectURL(url);
      $('#engineStatus').textContent = 'Texture load failed';
    });
  });
  $('#clearTexture').addEventListener('click', () => { state.texture = null; refreshMaterials(); });
  $('#screenshot').addEventListener('click', exportPng);
  $('#exportObj').addEventListener('click', exportObj);
  $('#resetView').addEventListener('click', resetView);

  viewport.addEventListener('pointerdown', (event) => {
    viewport.setPointerCapture(event.pointerId);
    if (event.pointerType === 'touch' && event.isPrimary === false) {
      pointer = null;
      return;
    }
    pointer = { x: event.clientX, y: event.clientY };
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!pointer) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    character.rotation.y += dx * 0.007;
    character.rotation.x = THREE.MathUtils.clamp(character.rotation.x + dy * 0.005, -0.65, 0.65);
    pointer = { x: event.clientX, y: event.clientY };
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((type) => viewport.addEventListener(type, () => { pointer = null; }));
  viewport.addEventListener('wheel', (event) => {
    event.preventDefault();
    camera.position.z = THREE.MathUtils.clamp(camera.position.z + event.deltaY * 0.004, 3.5, 8);
  }, { passive: false });
  viewport.addEventListener('touchstart', (event) => {
    if (event.touches.length === 2) pinch = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY);
  }, { passive: true });
  viewport.addEventListener('touchmove', (event) => {
    if (event.touches.length !== 2 || pinch === null) return;
    const next = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z + (pinch - next) * 0.012, 3.5, 8);
    pinch = next;
  }, { passive: true });
  ['touchend', 'touchcancel'].forEach((type) => viewport.addEventListener(type, () => { pinch = null; }));

  $('#voiceRate').addEventListener('input', (event) => { $('#voiceRateOut').value = Number(event.target.value).toFixed(1); });
  $('#speak').addEventListener('click', () => {
    if (!('speechSynthesis' in window)) { $('#voiceStatus').textContent = 'Speech synthesis is unavailable in this browser.'; return; }
    const text = $('#speechText').value.trim();
    if (!text) { $('#voiceStatus').textContent = 'Enter text before speaking.'; return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Number($('#voiceRate').value);
    utterance.onstart = () => { speechActive = true; $('#voiceStatus').textContent = 'Speaking…'; };
    utterance.onend = utterance.onerror = () => { speechActive = false; $('#voiceStatus').textContent = 'Speech finished.'; };
    window.speechSynthesis.speak(utterance);
  });
  $('#stopSpeak').addEventListener('click', () => {
    window.speechSynthesis?.cancel();
    speechActive = false;
    $('#voiceStatus').textContent = 'Stopped.';
  });
  document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.tab, .tab-content').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    $('#tab-' + button.dataset.tab).classList.add('active');
  }));
  let installPrompt;
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    $('#installBtn').hidden = false;
  });
  $('#installBtn').addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $('#installBtn').hidden = true;
  });
}
try {
  attachControls();
  init();
  render();
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
} catch (error) {
  console.error('AetherFace startup failed:', error);
  $('#engineStatus').textContent = '3D preview failed to start';
  $('#engineStatus').title = error.message;
  $('#fps').textContent = 'WEBGL ERROR';
}