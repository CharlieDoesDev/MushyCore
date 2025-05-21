// chunks.js
// Handles chunk management for the infinite procedural world

const CHUNK_SIZE = 16;
const RENDER_DISTANCE = 2;
let loadedChunks = new Map();

function spawnChunk(cx, cz, scene, colliders, worldMushrooms) {
  const objects = [];
  const mushrooms = [];
  const terrain = [];

  const baseHeight = getTerrainHeight(cx * CHUNK_SIZE, cz * CHUNK_SIZE);

  const terrainGeo = new THREE.BoxGeometry(CHUNK_SIZE, 1, CHUNK_SIZE);
  const terrainMat = new THREE.MeshStandardMaterial({ color: 0x4caf50 });
  const block = new THREE.Mesh(terrainGeo, terrainMat);
  block.position.set(
    cx * CHUNK_SIZE + CHUNK_SIZE / 2 - 0.5,
    baseHeight - 0.5,
    cz * CHUNK_SIZE + CHUNK_SIZE / 2 - 0.5
  );
  block.receiveShadow = true;
  scene.add(block);
  terrain.push(block);
  colliders.push(block);

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

  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
      const cx = pcx + dx,
        cz = pcz + dz;
      if (!loadedChunks.has(chunkKey(cx, cz))) {
        spawnChunk(cx, cz, scene, colliders, worldMushrooms);
      }
    }
  }

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

// Move chunk management functions here
function chunkKey(cx, cz) {
  return `${cx}_${cz}`;
}

function getChunkCoords(x, z) {
  return [Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE)];
}

function getTerrainHeight(x, z) {
  // Placeholder function for getting terrain height
  return Math.sin(x * 0.1) * Math.cos(z * 0.1) * 10 + 10;
}

// Expose functions globally
window.spawnChunk = spawnChunk;
window.unloadChunk = unloadChunk;
window.updateChunks = updateChunks;
window.chunkKey = chunkKey;
window.getChunkCoords = getChunkCoords;
window.getTerrainHeight = getTerrainHeight;
