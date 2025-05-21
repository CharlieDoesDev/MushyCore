// player.js
// Handles mushroom player mechanics

export function createMushroom() {
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

export function jiggleMushroom(mushroom, delta) {
  mushroom.userData.jiggleTime += delta;
  let scaleY =
    1 +
    Math.sin(mushroom.userData.jiggleTime * 16) *
      mushroom.userData.jiggleAmount;
  let scaleXZ = 1 - (scaleY - 1) * 0.5;
  mushroom.scale.set(scaleXZ, scaleY, scaleXZ);
  mushroom.userData.jiggleAmount *= 0.92;
}

export function triggerJiggle(mushroom, amount = 0.18) {
  mushroom.userData.jiggleAmount = Math.max(
    mushroom.userData.jiggleAmount,
    amount
  );
}
