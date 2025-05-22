// main.js
// Use global THREE from CDN
let scene,
  camera,
  renderer,
  mushroom,
  velocity = 0;
window.direction = window.direction || new THREE.Vector3();
const gravity = -0.02;
const bounceStrength = 1.2; // Increased jump height
const moveSpeed = 0.07;
const colliders = [];
const MIN_TREE_SPACING = 25; // Minimum distance squared between trees

// Global ground height for player
window.playerGroundHeight = window.playerGroundHeight || 0.5;

// Initialize the world mushrooms array
window.worldMushrooms = window.worldMushrooms || [];

// Display version in UI
const VERSION = "1.0.5";
window.addEventListener("DOMContentLoaded", () => {
  const v = document.getElementById("version");
  if (v) v.textContent = `Version: ${VERSION}`;
});

function addFog() {
  // Add fog for atmosphere and depth perception
  scene.fog = new THREE.FogExp2(0x222233, 0.1); // Less dense fog to see trees better
}

function showLoadingBar(progress) {
  let bar = document.getElementById("loading-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "loading-bar";
    bar.style.position = "absolute";
    bar.style.top = "50%";
    bar.style.left = "50%";
    bar.style.transform = "translate(-50%, -50%)";
    bar.style.width = "300px";
    bar.style.height = "24px";
    bar.style.background = "#222";
    bar.style.border = "2px solid #fff";
    bar.style.zIndex = 1000;
    bar.innerHTML =
      '<div id="loading-bar-inner" style="height:100%;width:0;background:#4caf50;"></div>';
    document.body.appendChild(bar);
  }
  const inner = document.getElementById("loading-bar-inner");
  if (inner) inner.style.width = Math.floor(progress * 100) + "%";
}
function hideLoadingBar() {
  const bar = document.getElementById("loading-bar");
  if (bar) bar.remove();
}

// Initialize the scene
async function init() {
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

  // Generate terrain chunks asynchronously with loading bar
  const [pcx, pcz] = getChunkCoords(0, 0);
  const totalChunks = 9;
  let loaded = 0;
  // Build chunks BEFORE raycasting and player creation
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      await new Promise((resolve) => {
        setTimeout(() => {
          spawnChunk(pcx + dx, pcz + dz, scene, colliders, worldMushrooms);
          loaded++;
          showLoadingBar(loaded / totalChunks);
          resolve();
        }, 0);
      });
    }
  }
  hideLoadingBar();

  // Now create the player after terrain is ready
  const startX = 0;
  const startZ = 0;
  const raycaster = new THREE.Raycaster();
  raycaster.set(
    new THREE.Vector3(startX, 100, startZ),
    new THREE.Vector3(0, -1, 0)
  );
  const intersects = raycaster.intersectObjects(colliders, false);
  let startY = 10;
  if (intersects.length > 0) {
    // Find the intersection with the highest y value
    let highest = intersects.reduce((a, b) => (a.point.y > b.point.y ? a : b));
    startY = highest.point.y + 1; // Place player 1 unit above terrain
  }
  mushroom = createMushroom();
  mushroom.position.set(startX, startY, startZ);
  scene.add(mushroom);

  // Camera pivot for third person
  window.cameraPivot = window.cameraPivot || undefined;
  window.cameraTarget = window.cameraTarget || undefined;
  cameraPivot = new THREE.Object3D();
  cameraTarget = new THREE.Object3D();
  scene.add(cameraPivot);
  cameraPivot.add(camera);
  camera.position.set(0, 1.5, 4);
  camera.lookAt(cameraPivot.position);

  // Event listeners
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  window.addEventListener("keydown", (e) => {
    onKeyDown(e, keys);
    if (e.code === "Space") {
      ResetPlayerPosition();
    }
  });
  window.addEventListener("keyup", (e) => onKeyUp(e, keys));
  window.addEventListener("mousedown", (e) => onMouseDown(e));
  window.addEventListener("mousemove", (e) => onMouseMove(e));
  window.addEventListener("mouseup", () => onMouseUp());
  window.addEventListener("dblclick", () => goFullScreen());
}

// Add input fields and button for manual player position
window.addEventListener("DOMContentLoaded", () => {
  // Add manual position controls
  let controls = document.getElementById("player-position-controls");
  if (!controls) {
    controls = document.createElement("div");
    controls.id = "player-position-controls";
    controls.style.position = "absolute";
    controls.style.top = "10px";
    controls.style.left = "10px";
    controls.style.background = "rgba(34,34,51,0.9)";
    controls.style.padding = "10px";
    controls.style.borderRadius = "8px";
    controls.style.zIndex = 1001;
    controls.style.color = "#fff";
    controls.innerHTML = `
      <label>X: <input id="player-x" type="number" value="0" style="width:60px;"></label>
      <label>Y: <input id="player-y" type="number" value="10" style="width:60px;"></label>
      <label>Z: <input id="player-z" type="number" value="0" style="width:60px;"></label>
      <button id="set-player-position">Set Player Position</button>
    `;
    document.body.appendChild(controls);
    document.getElementById("set-player-position").onclick = function () {
      const x = parseFloat(document.getElementById("player-x").value);
      const y = parseFloat(document.getElementById("player-y").value);
      const z = parseFloat(document.getElementById("player-z").value);
      console.log("Set Player Position clicked", {
        x,
        y,
        z,
        mushroom: window.mushroom,
      });
      if (window.mushroom) {
        window.mushroom.position.set(x, y, z);
        window.mushroom.userData.velocity = 0;
      }
    };
  }
});

// Make sure these are available globally for player.js
window.gravity = gravity;
window.bounceStrength = bounceStrength;
window.triggerJiggle = triggerJiggle;
window.checkCollisions =
  window.checkCollisions ||
  function () {
    return false;
  };
window.MUSHROOM_TYPES = window.MUSHROOM_TYPES || [];

window.playerStats = window.playerStats || {
  jumpBoost: 0,
  speedBoost: 0,
  bounceBoost: 0,
};

function animate() {
  requestAnimationFrame(animate);
  if (!mushroom) {
    console.warn("Mushroom not created yet");
    return; // Prevent errors if mushroom is not yet created
  }
  updateChunks(mushroom, scene, colliders, worldMushrooms);

  // Flipping animation is now handled in updateMushroomMovement (player.js)
  updateMushroomMovement(
    mushroom,
    keys,
    velocity,
    playerGroundHeight,
    moveSpeed,
    colliders,
    worldMushrooms,
    playerStats
  );

  updateCamera(camera, mushroom, yaw, pitch);
  jiggleMushroom(mushroom, 1 / 60);
  animateParticles(scene);
  renderer.render(scene, camera);
}

// Find a valid position on the terrain using raycasting
function ResetPlayerPosition() {
  const startX = 0;
  const startZ = 0;
  // Use a very high Y to ensure you always hit the topmost terrain
  const rayOrigin = new THREE.Vector3(startX, 1000, startZ);
  const rayDirection = new THREE.Vector3(0, -1, 0);
  const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);
  const intersects = raycaster.intersectObjects(colliders, false);
  let startY = 10;
  if (intersects.length > 0) {
    // Find the intersection with the highest y value
    let highest = intersects.reduce((a, b) => (a.point.y > b.point.y ? a : b));
    startY = highest.point.y + 10; // Place player 10 units above terrain
  }
  mushroom.position.set(startX, startY, startZ);
  mushroom.userData.velocity = 0;
}
window.ResetPlayerPosition = ResetPlayerPosition;

init();
animate();
