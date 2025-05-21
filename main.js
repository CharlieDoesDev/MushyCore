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

// Particle system for ambiance
let particles;
function addParticles() {
  const count = 120;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 18;
    const y = 1.5 + Math.random() * 4;
    const z = (Math.random() - 0.5) * 18;
    positions.push(x, y, z);
    const c = new THREE.Color().setHSL(
      0.55 + Math.random() * 0.3,
      0.7,
      0.7 + Math.random() * 0.2
    );
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
  });
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function animateParticles() {
  if (!particles) return;
  const positions = particles.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    let y = positions.getY(i);
    y += Math.sin(Date.now() * 0.001 + i) * 0.003;
    if (y > 6) y = 1.5;
    positions.setY(i, y);
  }
  positions.needsUpdate = true;
}

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
  cap.position.y = 0.62;
  group.add(cap);
  // Stem
  const stemGeometry = new THREE.CylinderGeometry(0.22, 0.28, 0.5, 32, 1, true);
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0xf7e8a4 });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = 0.25;
  group.add(stem);
  // Add a bottom ring for the stem
  const ringGeometry = new THREE.TorusGeometry(0.22, 0.06, 16, 32);
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xe0c97f });
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.y = 0.01;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  // For jiggle
  group.userData.jiggleTime = 0;
  group.userData.jiggleAmount = 0;
  return group;
}

let playerStats = { jumpBoost: 0, speedBoost: 0, bounceBoost: 0 };
let worldMushrooms = [];

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
    colliders.push(box);
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
  // Add special mushrooms
  for (let i = 0; i < 6; i++) {
    const typeIndex = Math.floor(Math.random() * MUSHROOM_TYPES.length);
    const pos = new THREE.Vector3(
      (Math.random() - 0.5) * 14,
      0.5,
      (Math.random() - 0.5) * 14
    );
    spawnMushroom(typeIndex, pos, scene, worldMushrooms);
  }
}

function checkCollisions(mesh) {
  const pos = mesh.position;
  let collided = false;
  for (const c of colliders) {
    if (c === mesh) continue;
    const b1 = new THREE.Box3().setFromObject(mesh);
    const b2 = new THREE.Box3().setFromObject(c);
    if (b1.intersectsBox(b2)) {
      collided = true;
      // Push out of collision (simple)
      const dir = pos.clone().sub(c.position).setY(0).normalize();
      pos.add(dir.multiplyScalar(0.12));
    }
  }
  return collided;
}

function jiggleMushroom(mushroom, delta) {
  mushroom.userData.jiggleTime += delta;
  let scaleY =
    1 +
    Math.sin(mushroom.userData.jiggleTime * 16) *
      mushroom.userData.jiggleAmount;
  let scaleXZ = 1 - (scaleY - 1) * 0.5;
  mushroom.scale.set(scaleXZ, scaleY, scaleXZ);
  mushroom.userData.jiggleAmount *= 0.92;
}

function triggerJiggle(mushroom, amount = 0.18) {
  mushroom.userData.jiggleAmount = Math.max(
    mushroom.userData.jiggleAmount,
    amount
  );
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222233);

  // Add fog for atmosphere and depth perception
  scene.fog = new THREE.FogExp2(0x222233, 0.01); // Less dense fog to see trees better

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

  // Initialize a few chunks around the player
  const [pcx, pcz] = getChunkCoords(0, 0);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      spawnChunk(pcx + dx, pcz + dz);
    }
  }

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

let jumpCharge = 0;
const maxJumpCharge = 1.5; // seconds
const minJump = 0.6;
const flipThreshold = 1.0; // seconds
let isFlipping = false;
let flipTime = 0;

function onKeyDown(e) {
  keys[e.code] = true;
  if (e.code === "Space") isBouncing = true;
}
function onKeyUp(e) {
  keys[e.code] = false;
  if (e.code === "Space") {
    isBouncing = false;
    // Update jump logic to ensure consistent jump height
    if (Math.abs(mushroom.position.y - playerGroundHeight) < 0.01) {
      // Calculate jump power
      let charge = Math.min(jumpCharge, maxJumpCharge);
      let jumpPower =
        minJump +
        (charge / maxJumpCharge) *
          (bounceStrength + playerStats.jumpBoost + playerStats.bounceBoost);
      velocity = jumpPower; // Remove dependency on mushroom's position
      triggerJiggle(mushroom);
      if (charge >= flipThreshold) {
        isFlipping = true;
        flipTime = 0;
      }
    }
    jumpCharge = 0;
  }
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
  if (keys["KeyW"] || keys["ArrowUp"]) direction.z += 1; // Flip sign
  if (keys["KeyS"] || keys["ArrowDown"]) direction.z -= 1; // Flip sign
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

function addBetterLighting() {
  // Sunlight
  const sun = new THREE.DirectionalLight(0xfff7e0, 1.1);
  sun.position.set(5, 10, 5);
  sun.castShadow = true;
  scene.add(sun);
  // Soft fill
  const fill = new THREE.HemisphereLight(0x88ccee, 0x334422, 0.7);
  scene.add(fill);
  // Subtle point lights for color
  for (let i = 0; i < 3; i++) {
    const color = [0xffb347, 0x7ec850, 0x7ec8e3][i];
    const pt = new THREE.PointLight(color, 0.3, 10);
    pt.position.set(Math.cos(i * 2) * 6, 2 + i, Math.sin(i * 2) * 6);
    scene.add(pt);
  }
}

// Infinite procedural world with chunk loading
const CHUNK_SIZE = 16;
const RENDER_DISTANCE = 2; // in chunks
let loadedChunks = new Map(); // key: 'x_z', value: {objects:[], mushrooms:[], terrain:[]}
let perlin = {
  // Simple perlin noise implementation
  noise: function (x, z) {
    return (
      Math.sin(x * 0.25) * Math.cos(z * 0.3) * 0.5 +
      Math.sin(x * 0.05 + z * 0.1) * 0.5
    );
  },
};

function getTerrainHeight(x, z) {
  return Math.floor(perlin.noise(x, z) * 2) * 0.5; // Quantize to 0.5 unit steps
}

function chunkKey(cx, cz) {
  return `${cx}_${cz}`;
}

function getChunkCoords(x, z) {
  return [Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE)];
}

function spawnChunk(cx, cz) {
  const objects = [];
  const mushrooms = [];
  const terrain = [];

  // Calculate base height for this chunk
  const baseHeight = getTerrainHeight(cx * CHUNK_SIZE, cz * CHUNK_SIZE);

  // Create terrain blocks
  const terrainGeo = new THREE.BoxGeometry(CHUNK_SIZE, 1, CHUNK_SIZE);
  const terrainMat = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
  const block = new THREE.Mesh(terrainGeo, terrainMat);
  block.position.set(
    cx * CHUNK_SIZE + CHUNK_SIZE / 2 - 0.5,
    baseHeight - 0.5, // -0.5 to make top at baseHeight
    cz * CHUNK_SIZE + CHUNK_SIZE / 2 - 0.5
  );
  block.receiveShadow = true;
  scene.add(block);
  terrain.push(block);
  colliders.push(block);

  // Trees - much larger with random sizes and position checking
  const treePositions = [];
  for (let i = 0; i < 4; i++) {
    // Try to find a valid position
    let attempts = 0;
    let validPosition = false;
    let x, z;

    while (!validPosition && attempts < 10) {
      x = cx * CHUNK_SIZE + (Math.random() - 0.5) * CHUNK_SIZE;
      z = cz * CHUNK_SIZE + (Math.random() - 0.5) * CHUNK_SIZE;

      // Check distance to other trees
      validPosition = true;
      for (const pos of treePositions) {
        const dx = pos.x - x;
        const dz = pos.z - z;
        const distSq = dx * dx + dz * dz;
        if (distSq < 16) {
          // Minimum 4 units apart
          validPosition = false;
          break;
        }
      }
      attempts++;
    }

    // If we couldn't find a valid position, skip this tree
    if (!validPosition) continue;

    // Add position to our tracking array
    treePositions.push({ x, z });

    // Randomize tree size (5-10x larger)
    const sizeScale = 5 + Math.random() * 5;
    const heightScale = 0.8 + Math.random() * 0.4; // Varies the height ratio

    // Tree trunk - 10x taller and wider
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.3 * sizeScale,
        0.4 * sizeScale,
        10 * sizeScale * heightScale,
        12
      ),
      new THREE.MeshStandardMaterial({ color: 0x8d5524 })
    );
    trunk.position.set(x, baseHeight + 5 * sizeScale * heightScale, z);
    scene.add(trunk);
    objects.push(trunk);

    // Tree leaves - much bigger
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(2 * sizeScale, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x388e3c })
    );
    leaves.position.copy(trunk.position);
    leaves.position.y += 5 * sizeScale * heightScale;
    scene.add(leaves);
    objects.push(leaves);
  }

  // Special mushrooms
  for (let i = 0; i < 3; i++) {
    const typeIndex = Math.floor(Math.random() * MUSHROOM_TYPES.length);
    const pos = new THREE.Vector3(
      cx * CHUNK_SIZE + (Math.random() - 0.5) * CHUNK_SIZE,
      baseHeight + 0.5,
      cz * CHUNK_SIZE + (Math.random() - 0.5) * CHUNK_SIZE
    );
    spawnMushroom(typeIndex, pos, scene, worldMushrooms);
  }
  loadedChunks.set(chunkKey(cx, cz), { objects, mushrooms, terrain });
}

function unloadChunk(cx, cz) {
  const key = chunkKey(cx, cz);
  const chunk = loadedChunks.get(key);
  if (!chunk) return;
  for (const obj of chunk.objects) {
    scene.remove(obj);
    const idx = colliders.indexOf(obj);
    if (idx !== -1) colliders.splice(idx, 1);
  }
  for (const mush of chunk.mushrooms) {
    scene.remove(mush);
    const idx = worldMushrooms.indexOf(mush);
    if (idx !== -1) worldMushrooms.splice(idx, 1);
  }
  for (const terrain of chunk.terrain) {
    scene.remove(terrain);
    const idx = colliders.indexOf(terrain);
    if (idx !== -1) colliders.splice(idx, 1);
  }
  loadedChunks.delete(key);
}

function updateChunks() {
  const [pcx, pcz] = getChunkCoords(mushroom.position.x, mushroom.position.z);

  // Get current chunk baseHeight for player position update
  const currChunkKey = chunkKey(pcx, pcz);
  if (loadedChunks.has(currChunkKey)) {
    const baseHeight = getTerrainHeight(pcx * CHUNK_SIZE, pcz * CHUNK_SIZE);
    playerGroundHeight = baseHeight + 0.5; // Keep player on ground
  }

  // Load nearby chunks
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
      const cx = pcx + dx,
        cz = pcz + dz;
      if (!loadedChunks.has(chunkKey(cx, cz))) {
        spawnChunk(cx, cz);
      }
    }
  }
  // Unload far chunks
  for (const key of Array.from(loadedChunks.keys())) {
    const [cx, cz] = key.split("_").map(Number);
    if (
      Math.abs(cx - pcx) > RENDER_DISTANCE ||
      Math.abs(cz - pcz) > RENDER_DISTANCE
    ) {
      unloadChunk(cx, cz);
    }
  }
}

// Global ground height for player
let playerGroundHeight = 0.5;

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222233);

  // Add fog for atmosphere and depth perception
  scene.fog = new THREE.FogExp2(0x222233, 0.01); // Less dense fog to see trees better

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

  // Lighting and particles
  addBetterLighting();
  addParticles();

  // Mushroom player
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
      spawnChunk(pcx + dx, pcz + dz);
    }
  }

  window.addEventListener("resize", onWindowResize);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  document.addEventListener("mousedown", onMouseDown);
  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
  document.addEventListener("dblclick", goFullScreen);
}

// Fix mushroom collision detection
function checkMushroomCrush(player) {
  for (const mush of worldMushrooms) {
    if (mush.userData.crushed) continue;
    const b1 = new THREE.Box3().setFromObject(player);
    const b2 = new THREE.Box3().setFromObject(mush);
    if (
      b1.intersectsBox(b2) &&
      player.position.y > mush.position.y + 0.3 &&
      velocity < 0
    ) {
      mush.userData.crushed = true;
      mush.visible = false;
      const typeIndex = mush.userData.typeIndex;
      if (typeIndex !== undefined) {
        MUSHROOM_TYPES[typeIndex].effect(playerStats);
      }
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  updateChunks();
  // Jump charge logic
  if (isBouncing && Math.abs(mushroom.position.y - 0.5) < 0.01) {
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
  if (isBouncing && Math.abs(mushroom.position.y - playerGroundHeight) < 0.01) {
    velocity =
      (bounceStrength + playerStats.jumpBoost + playerStats.bounceBoost) *
      mushroom.position.y *
      0.6;
    triggerJiggle(mushroom);
    onGround = false;
  }
  velocity += gravity;
  mushroom.position.y += velocity;
  // Collision with ground
  if (mushroom.position.y < playerGroundHeight) {
    mushroom.position.y = playerGroundHeight;
    velocity = 0;
    onGround = true;
  }
  // Collision with objects
  if (checkCollisions(mushroom)) {
    velocity = Math.min(velocity, 0);
    onGround = true;
  }
  // Check for crushing world mushrooms
  mushroom.velocity = velocity;
  checkMushroomCrush(mushroom);
  updateMushroomMovement();
  updateCamera();
  jiggleMushroom(mushroom, 1 / 60);
  animateParticles();
  renderer.render(scene, camera);
}

init();
animate();
