// main.js
// Use global THREE from CDN
let scene,
  camera,
  renderer,
  mushroom,
  velocity = 0;
let direction = new THREE.Vector3();
let keys = {};
let cameraPivot, cameraTarget;
const gravity = -0.02;
const bounceStrength = 1.2; // Increased jump height
const moveSpeed = 0.07;
const colliders = [];
const MIN_TREE_SPACING = 25; // Minimum distance squared between trees

// Global ground height for player
let playerGroundHeight = 0.5;

// Initialize the world mushrooms array
let worldMushrooms = [];

// Display version in UI
const VERSION = "1.0.0";
window.addEventListener("DOMContentLoaded", () => {
  const v = document.getElementById("version");
  if (v) v.textContent = `Version: ${VERSION}`;
});

function addFog() {
  // Add fog for atmosphere and depth perception
  scene.fog = new THREE.FogExp2(0x222233, 0.1); // Less dense fog to see trees better
}

// Initialize the scene
function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222233);

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2, 5);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add fog
  addFog();

  // Add lighting
  addBetterLighting(scene);

  // Add particles
  addParticles(scene);

  // Create the player
  mushroom = createMushroom();
  mushroom.position.y = playerGroundHeight;
  scene.add(mushroom);

  // Camera pivot for third person
  cameraPivot = new THREE.Object3D();
  cameraTarget = new THREE.Object3D();
  scene.add(cameraPivot);
  cameraPivot.add(camera);
  camera.position.set(0, 1.5, 4);
  camera.lookAt(cameraPivot.position);

  // Initialize a few chunks around the player
  const [pcx, pcz] = getChunkCoords(0, 0);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      spawnChunk(pcx + dx, pcz + dz, scene, colliders, worldMushrooms);
    }
  }

  // Event listeners
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener("keydown", (e) => onKeyDown(e, keys));
  window.addEventListener("keyup", (e) => onKeyUp(e, keys));
  window.addEventListener("mousedown", (e) => onMouseDown(e));
  window.addEventListener("mousemove", (e) => onMouseMove(e));
  window.addEventListener("mouseup", () => onMouseUp());
  window.addEventListener("dblclick", () => goFullScreen());
}

function animate() {
  requestAnimationFrame(animate);
  updateChunks(mushroom, scene, colliders, worldMushrooms);

  // Jump charge logic
  if (keys["Space"] && Math.abs(mushroom.position.y - 0.5) < 0.01) {
    jumpCharge = Math.min(jumpCharge + 1 / 60, maxJumpCharge);
  }

  // Flipping animation
  if (isFlipping) {
    flipTime += 1 / 60;
    mushroom.rotation.x = Math.PI * 2 * (flipTime / 0.5); // 1 full flip in 0.5s
    if (flipTime >= 0.5) {
      isFlipping = false;
      mushroom.rotation.x = 0;
    }
  }

  // Bouncing logic
  let onGround = false;
  if (
    keys["Space"] &&
    Math.abs(mushroom.position.y - playerGroundHeight) < 0.01
  ) {
    velocity =
      (bounceStrength + playerStats.jumpBoost + playerStats.bounceBoost) *
      mushroom.position.y *
      0.6;
    onGround = false;
  }
  velocity += gravity;
  mushroom.position.y += velocity;

  // Collision with ground
  if (mushroom.position.y < playerGroundHeight) {
    mushroom.position.y = playerGroundHeight;
    velocity = 0;
    onGround = true;
    if (!isOnGround) {
      triggerJiggle(mushroom); // Trigger jiggle only on landing
      isOnGround = true; // Set the flag to indicate the mushroom is on the ground
    }
  } else {
    isOnGround = false; // Reset the flag when the mushroom is in the air
  }

  // Collision with objects
  if (checkCollisions(mushroom, colliders)) {
    velocity = Math.min(velocity, 0);
    onGround = true;
  }

  // Check for crushing world mushrooms
  mushroom.velocity = velocity;
  checkMushroomCrush(mushroom, worldMushrooms, playerStats);
  updateMushroomMovement(
    mushroom,
    keys,
    velocity,
    playerGroundHeight,
    moveSpeed
  );
  updateCamera(camera, mushroom, yaw, pitch);
  jiggleMushroom(mushroom, 1 / 60);
  animateParticles(scene);
  renderer.render(scene, camera);
}

init();
animate();
