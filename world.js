// world.js
// Handles world logic, mushroom types, and stat upgrades

// Mushroom types
const MUSHROOM_TYPES = [
  {
    name: "Red",
    color: 0xd72660,
    effect: (player) => {
      player.jumpBoost += 0.2;
    },
    description: "+Jump Height",
  },
  {
    name: "Blue",
    color: 0x3a86ff,
    effect: (player) => {
      player.speedBoost += 0.03;
    },
    description: "+Speed",
  },
  {
    name: "Green",
    color: 0x43aa8b,
    effect: (player) => {
      player.bounceBoost += 0.1;
    },
    description: "+Bounce Power",
  },
];

// Spawns a mushroom of a given type at a position
function spawnMushroom(typeIndex, position, scene, worldMushrooms) {
  const type = MUSHROOM_TYPES[typeIndex];
  const group = new THREE.Group();
  // Cap
  const capGeometry = new THREE.SphereGeometry(
    0.4,
    24,
    24,
    0,
    Math.PI * 2,
    0,
    Math.PI / 1.2
  );
  const capMaterial = new THREE.MeshStandardMaterial({ color: type.color });
  const cap = new THREE.Mesh(capGeometry, capMaterial);
  cap.position.y = 0.5;
  group.add(cap);
  // Stem
  const stemGeometry = new THREE.CylinderGeometry(0.13, 0.18, 0.35, 16);
  const stemMaterial = new THREE.MeshStandardMaterial({ color: 0xf7e8a4 });
  const stem = new THREE.Mesh(stemGeometry, stemMaterial);
  stem.position.y = 0.18;
  group.add(stem);
  group.position.copy(position);
  group.userData.typeIndex = typeIndex;
  group.userData.crushed = false;
  scene.add(group);
  worldMushrooms.push(group);
}

// Check if player lands on a mushroom
function checkMushroomCrush(player, mushrooms, onCrush) {
  for (const mush of mushrooms) {
    if (mush.userData.crushed) continue;
    const b1 = new THREE.Box3().setFromObject(player);
    const b2 = new THREE.Box3().setFromObject(mush);
    if (
      b1.intersectsBox(b2) &&
      player.position.y > mush.position.y + 0.3 &&
      player.velocity < 0
    ) {
      mush.userData.crushed = true;
      mush.visible = false;
      if (onCrush) onCrush(mush.userData.typeIndex);
    }
  }
}

window.MUSHROOM_TYPES = MUSHROOM_TYPES;
window.spawnMushroom = spawnMushroom;
window.checkMushroomCrush = checkMushroomCrush;
