// chunks.js
// Handles chunk management for the infinite procedural world

const CHUNK_SIZE = 16;
const RENDER_DISTANCE = 2;
let loadedChunks = new Map();

function spawnChunk(cx, cz, scene, colliders, worldMushrooms) {
  const objects = [];
  const mushrooms = [];
  const terrain = [];

  // Generate terrain blocks for this chunk
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const wx = cx * CHUNK_SIZE + x;
      const wz = cz * CHUNK_SIZE + z;
      const h = getTerrainHeight(wx, wz);
      const block = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({ color: 0x4caf50 })
      );
      block.position.set(wx, h - 0.5, wz);
      block.receiveShadow = true;
      scene.add(block);
      terrain.push(block);
      colliders.push(block);
    }
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
  // Use Perlin/simplex noise for smooth, natural height variation
  // For now, use a simple pseudo-random height function for demo
  // Replace with a real noise function for better results
  const scale = 0.12;
  const base = 2;
  const height = Math.floor(
    Math.sin(x * scale) * Math.cos(z * scale) * 4 +
      Math.sin(z * scale * 0.7) * 2 +
      Math.cos(x * scale * 0.5) * 1.5 +
      base
  );
  return height;
}

// Expose functions globally
window.spawnChunk = spawnChunk;
window.unloadChunk = unloadChunk;
window.updateChunks = updateChunks;
window.chunkKey = chunkKey;
window.getChunkCoords = getChunkCoords;
window.getTerrainHeight = getTerrainHeight;
