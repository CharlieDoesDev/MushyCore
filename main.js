// main.js
// Use global THREE from CDN
let scene,
  camera,
  renderer,
  mushroom,
  velocity = 0,
  isBouncing = false;
let direction = new THREE.Vector3();
let keys = {};
let cameraPivot, cameraTarget;
const gravity = -0.02;
const bounceStrength = 0.6;
const moveSpeed = 0.07;
const turnSpeed = 0.03;

function createMushroom() {
  const group = new THREE.Group();
  // Cap
  const capGeometry = new THREE.SphereGeometry(
    0.5,
    32,
    32,
    0,
    Math.PI * 2,
    0,
    Math.PI / 1.2
  );
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

function createWorld() {
  // Add some obstacles and scenery
  for (let i = 0; i < 10; i++) {
    const geo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8ecae6 });
    const box = new THREE.Mesh(geo, mat);
    box.position.set(
      (Math.random() - 0.5) * 12,
      0.35,
      (Math.random() - 0.5) * 12
    );
    scene.add(box);
  }
  // Add some trees
  for (let i = 0; i < 6; i++) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 1, 12),
      new THREE.MeshStandardMaterial({ color: 0x8d5524 })
    );
    trunk.position.set(
      (Math.random() - 0.5) * 14,
      0.5,
      (Math.random() - 0.5) * 14
    );
    scene.add(trunk);
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x388e3c })
    );
    leaves.position.copy(trunk.position);
    leaves.position.y += 0.7;
    scene.add(leaves);
  }
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222233);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 2, 5);

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
  const groundGeo = new THREE.PlaneGeometry(30, 30);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Mushroom
  mushroom = createMushroom();
  mushroom.position.y = 0.5;
  scene.add(mushroom);

  // Camera pivot for third person
  cameraPivot = new THREE.Object3D();
  cameraTarget = new THREE.Object3D();
  scene.add(cameraPivot);
  cameraPivot.add(camera);
  camera.position.set(0, 1.5, 4);
  camera.lookAt(cameraPivot.position);

  createWorld();

  window.addEventListener("resize", onWindowResize);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("dblclick", goFullScreen);
}

// Display version in UI
const VERSION = "1.0.0";
window.addEventListener("DOMContentLoaded", () => {
  const v = document.getElementById("version");
  if (v) v.textContent = `Version: ${VERSION}`;
});

function goFullScreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    renderer.domElement.requestFullscreen();
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
  keys[e.code] = true;
  if (e.code === "Space") isBouncing = true;
}
function onKeyUp(e) {
  keys[e.code] = false;
  if (e.code === "Space") isBouncing = false;
}

let isMouseDown = false,
  lastMouseX = 0,
  lastMouseY = 0,
  yaw = 0,
  pitch = 0;
function onMouseDown(e) {
  if (e.button !== 0) return;
  isMouseDown = true;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}
function onMouseUp() {
  isMouseDown = false;
}
function onMouseMove(e) {
  if (!isMouseDown) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  yaw -= dx * 0.01; // Sensitivity
  pitch += dy * 0.01; // Fix: vertical not inverted
  pitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, pitch));
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
}

function updateMushroomMovement() {
  direction.set(0, 0, 0);
  if (keys["KeyW"] || keys["ArrowUp"]) direction.z -= 1;
  if (keys["KeyS"] || keys["ArrowDown"]) direction.z += 1;
  if (keys["KeyA"] || keys["ArrowLeft"]) direction.x -= 1;
  if (keys["KeyD"] || keys["ArrowRight"]) direction.x += 1;
  if (direction.lengthSq() > 0) {
    direction.normalize();
    // Use camera's world matrix to get forward/right vectors
    const camMatrix = new THREE.Matrix4();
    camMatrix.extractRotation(camera.matrixWorld);
    const forward = new THREE.Vector3(0, 0, -1).applyMatrix4(camMatrix);
    const right = new THREE.Vector3(1, 0, 0).applyMatrix4(camMatrix);
    // Project onto XZ plane
    forward.y = 0;
    right.y = 0;
    forward.normalize();
    right.normalize();
    // Combine directions
    const move = new THREE.Vector3();
    move.addScaledVector(forward, direction.z);
    move.addScaledVector(right, direction.x);
    if (move.lengthSq() > 0) {
      move.normalize();
      mushroom.position.addScaledVector(move, moveSpeed);
      // Face movement direction
      mushroom.rotation.y = Math.atan2(move.x, move.z);
    }
  }
}

function updateCamera() {
  // Third person camera rotation around mushroom
  const radius = 4;
  const camX = mushroom.position.x + radius * Math.sin(yaw) * Math.cos(pitch);
  const camY = mushroom.position.y + 1.5 + radius * Math.sin(pitch);
  const camZ = mushroom.position.z + radius * Math.cos(yaw) * Math.cos(pitch);
  camera.position.set(camX, camY, camZ);
  camera.lookAt(
    mushroom.position.x,
    mushroom.position.y + 0.7,
    mushroom.position.z
  );
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
  updateMushroomMovement();
  updateCamera();
  renderer.render(scene, camera);
}

init();
animate();
