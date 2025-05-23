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

// --- PHYSICS ENGINE SETUP ---
let physicsWorld;
let playerBody;
let terrainBodies = [];

function setupPhysicsWorld() {
  physicsWorld = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
  physicsWorld.broadphase = new CANNON.NaiveBroadphase();
  physicsWorld.solver.iterations = 10;
}

function createPlayerBody(x, y, z) {
  // Use a sphere for the mushroom player
  const radius = 0.5;
  const shape = new CANNON.Sphere(radius);
  playerBody = new CANNON.Body({ mass: 1, shape });
  playerBody.position.set(x, y, z);
  physicsWorld.addBody(playerBody);
}

function createTerrainBody(x, y, z) {
  // Use a box for each terrain block
  const halfExtents = new CANNON.Vec3(0.5, 0.5, 0.5);
  const shape = new CANNON.Box(halfExtents);
  const body = new CANNON.Body({ mass: 0, shape });
  body.position.set(x, y, z);
  physicsWorld.addBody(body);
  terrainBodies.push(body);
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
  if (typeof window.spawnPlayerAt === "function") {
    window.spawnPlayerAt(startX, startZ);
    // Also create the physics body for the player
    const y = window.getTerrainHeight(startX, startZ) + 1;
    createPlayerBody(startX, y, startZ);
  } else {
    // fallback for legacy
    const y = (typeof window.getTerrainHeight === "function")
      ? window.getTerrainHeight(startX, startZ) + 1
      : 10;
    window.mushroom = createMushroom();
    window.mushroom.position.set(startX, y, startZ);
    scene.add(window.mushroom);
  }

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

  // After terrain is generated, create terrain bodies
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      // For each block in the chunk, create a physics body
      for (let x = 0; x < 16; x++) {
        for (let z = 0; z < 16; z++) {
          const wx = (pcx + dx) * 16 + x;
          const wz = (pcz + dz) * 16 + z;
          const h = window.getTerrainHeight(wx, wz);
          createTerrainBody(wx, h, wz);
        }
      }
    }
  }
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
      const z = parseFloat(document.getElementById("player-z").value);
      if (typeof window.spawnPlayerAt === "function") {
        window.spawnPlayerAt(x, z);
        document.getElementById("player-y").value = window.mushroom.position.y;
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
  if (!window.mushroom || !playerBody) {
    return;
  }
  // Step the physics world
  physicsWorld.step(1 / 60);
  // Sync Three.js mesh with Cannon.js body
  window.mushroom.position.copy(playerBody.position);
  window.mushroom.quaternion.copy(playerBody.quaternion);
  updateChunks(window.mushroom, scene, colliders, worldMushrooms);
  updateMushroomMovement(
    window.mushroom,
    keys,
    velocity,
    playerGroundHeight,
    moveSpeed,
    colliders,
    worldMushrooms,
    playerStats
  );
  jiggleMushroom(window.mushroom, 1 / 60);
  animateParticles(scene);
  renderer.render(scene, camera);
}

// Find a valid position on the terrain using raycasting
function ResetPlayerPosition() {
  const startX = window.mushroom ? window.mushroom.position.x : 0;
  const startZ = window.mushroom ? window.mushroom.position.z : 0;
  // Use a very high Y to ensure you always hit the topmost terrain
  const rayOrigin = new THREE.Vector3(startX, 1000, startZ);
  const rayDirection = new THREE.Vector3(0, -1, 0);
  const raycaster = new THREE.Raycaster(rayOrigin, rayDirection);
  const intersects = raycaster.intersectObjects(colliders, false);
  let startY;
  if (intersects.length > 0) {
    // Find the intersection with the highest y value
    let highest = intersects.reduce((a, b) => (a.point.y > b.point.y ? a : b));
    startY = highest.point.y + 1; // Place player 1 unit above terrain
  } else {
    // If no terrain found, keep current Y or set a safe default
    startY = window.mushroom ? window.mushroom.position.y : 10;
  }
  window.mushroom.position.set(startX, startY, startZ);
  window.mushroom.userData.velocity = 0;
}
window.ResetPlayerPosition = ResetPlayerPosition;

// Snap player to terrain utility
window.setPlayerOnTerrain = function (x, z) {
  if (!window.mushroom || typeof window.getTerrainHeight !== "function") return;
  const y = window.getTerrainHeight(x, z) + 1;
  window.mushroom.position.set(x, y, z);
  window.mushroom.userData.velocity = 0;
};

// Attach to window for global access
window.scene = scene;
window.camera = camera;
window.renderer = renderer;
window.colliders = colliders;
window.gravity = gravity;
window.bounceStrength = bounceStrength;
window.moveSpeed = moveSpeed;
window.MIN_TREE_SPACING = MIN_TREE_SPACING;

init();
animate();

// Add this to allow the manual position UI to snap to terrain
document.addEventListener("DOMContentLoaded", function () {
  const btn = document.getElementById("set-player-position");
  if (btn) {
    btn.insertAdjacentHTML('afterend', '<button id="snap-player-terrain">Snap to Terrain</button>');
    document.getElementById("snap-player-terrain").onclick = function () {
      const x = parseFloat(document.getElementById("player-x").value);
      const z = parseFloat(document.getElementById("player-z").value);
      window.setPlayerOnTerrain(x, z);
      document.getElementById("player-y").value = window.mushroom.position.y;
    };
  }
});
