// terrain.js
// Manages terrain generation, chunk loading/unloading, and object spawning

const CHUNK_SIZE = 16;
const RENDER_DISTANCE = 2; // in chunks
const MIN_TREE_SPACING = 25; // Minimum distance squared between trees

let loadedChunks = new Map(); // key: 'x_z', value: {objects:[], mushrooms:[], terrain:[]}

function getTerrainHeight(x, z) {
  return Math.floor(perlin.noise(x, z) * 2) * 0.5; // Quantize to 0.5 unit steps
}

function chunkKey(cx, cz) {
  return `${cx}_${cz}`;
}

function getChunkCoords(x, z) {
  return [Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE)];
}

// --- PHYSICS ENGINE INTEGRATION ---
if (typeof CANNON !== 'undefined') {
  if (!window.physicsWorld) {
    window.physicsWorld = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
    window.physicsWorld.broadphase = new CANNON.NaiveBroadphase();
    window.physicsWorld.solver.iterations = 10;
  }
}

function createTerrainPhysicsBlock(x, y, z, size = 1) {
  if (!window.physicsWorld || typeof CANNON === 'undefined') return;
  const halfExtents = new CANNON.Vec3(size / 2, 0.5, size / 2);
  const shape = new CANNON.Box(halfExtents);
  const body = new CANNON.Body({ mass: 0, shape });
  body.position.set(x, y, z);
  window.physicsWorld.addBody(body);
}

function spawnChunk(cx, cz, scene, colliders, worldMushrooms) {
  const objects = [];
  const mushrooms = [];
  const terrain = [];

  // Calculate base height for this chunk
  const baseHeight = getTerrainHeight(cx * CHUNK_SIZE, cz * CHUNK_SIZE);

  // Create terrain block (single block per chunk, flat top)
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

  // Add physics for this terrain block
  createTerrainPhysicsBlock(
    block.position.x,
    block.position.y + 0.5, // Center of block
    block.position.z,
    CHUNK_SIZE
  );

  // Trees - spawn at the correct height
  const treePositions = [];
  for (let i = 0; i < 4; i++) {
    let attempts = 0;
    let validPosition = false;
    let x, z;

    while (!validPosition && attempts < 30) {
      x = cx * CHUNK_SIZE + (Math.random() - 0.5) * CHUNK_SIZE;
      z = cz * CHUNK_SIZE + (Math.random() - 0.5) * CHUNK_SIZE;

      // Check distance to other trees
      validPosition = true;
      for (const pos of treePositions) {
        const dx = pos.x - x;
        const dz = pos.z - z;
        const distSq = dx * dx + dz * dz;
        if (distSq < MIN_TREE_SPACING) {
          validPosition = false;
          break;
        }
      }
      attempts++;
    }

    if (!validPosition) continue;

    treePositions.push({ x, z });

    const treeHeight = getTerrainHeight(x, z); // Get height for tree position

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 10, 12),
      new THREE.MeshStandardMaterial({ color: 0x8d5524 })
    );
    trunk.position.set(x, treeHeight + 5, z);
    scene.add(trunk);
    objects.push(trunk);

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(2, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x388e3c })
    );
    leaves.position.set(x, treeHeight + 10, z);
    scene.add(leaves);
    objects.push(leaves);
  }

  // Special mushrooms - spawn at the correct height
  for (let i = 0; i < 3; i++) {
    const typeIndex = Math.floor(Math.random() * MUSHROOM_TYPES.length);
    const x = cx * CHUNK_SIZE + (Math.random() - 0.5) * CHUNK_SIZE;
    const z = cz * CHUNK_SIZE + (Math.random() - 0.5) * CHUNK_SIZE;
    const mushroomHeight = getTerrainHeight(x, z);

    const pos = new THREE.Vector3(x, mushroomHeight + 0.5, z);
    spawnMushroom(typeIndex, pos, scene, worldMushrooms);
  }

  loadedChunks.set(chunkKey(cx, cz), { objects, mushrooms, terrain });
}

function unloadChunk(cx, cz, scene, colliders, worldMushrooms) {
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

function updateChunks(mushroom, scene, colliders, worldMushrooms) {
  const [pcx, pcz] = getChunkCoords(mushroom.position.x, mushroom.position.z);

  // Load nearby chunks
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
      const cx = pcx + dx,
        cz = pcz + dz;
      if (!loadedChunks.has(chunkKey(cx, cz))) {
        spawnChunk(cx, cz, scene, colliders, worldMushrooms);
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
      unloadChunk(cx, cz, scene, colliders, worldMushrooms);
    }
  }
}

// Expose functions globally
window.getTerrainHeight = getTerrainHeight;
window.chunkKey = chunkKey;
window.getChunkCoords = getChunkCoords;
window.spawnChunk = spawnChunk;
window.unloadChunk = unloadChunk;
window.updateChunks = updateChunks;
