// main.js
// Use global THREE from CDN
let scene, camera, renderer, mushroom, velocity = 0, isBouncing = false;
const gravity = -0.02;
const bounceStrength = 0.6;

function createMushroom() {
  const group = new THREE.Group();
  // Cap
  const capGeometry = new THREE.SphereGeometry(0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.2);
  const capMaterial = new THREE.MeshStandardMaterial({ color: 0xd72660 });
  const cap = new THREE.Mesh(capGeometry, capMaterial);
  cap.position.y = 0.5;
  group.add(cap);
  // Stem
  const stemGeometry = new THREE.CylinderGeometry(0.18, 0.25, 0.6, 24);
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0xf7e8a4 });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = 0.2;
  group.add(stem);
  return group;
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222233);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.5, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);
  const dir = new THREE.DirectionalLight(0xffffff, 0.7);
  dir.position.set(2, 5, 3);
  scene.add(dir);

  // Ground
  const groundGeo = new THREE.PlaneGeometry(10, 10);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // Mushroom
  mushroom = createMushroom();
  mushroom.position.y = 0.5;
  scene.add(mushroom);

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
  if (e.code === 'Space') isBouncing = true;
}
function onKeyUp(e) {
  if (e.code === 'Space') isBouncing = false;
}

function animate() {
  requestAnimationFrame(animate);
  // Bouncing logic
  if (isBouncing && Math.abs(mushroom.position.y - 0.5) < 0.01) {
    velocity = bounceStrength;
  }
  velocity += gravity;
  mushroom.position.y += velocity;
  if (mushroom.position.y < 0.5) {
    mushroom.position.y = 0.5;
    velocity = 0;
  }
  renderer.render(scene, camera);
}

init();
animate();
