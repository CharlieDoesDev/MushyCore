// collisions.js
// Handles collision detection and response

function checkCollisions(mesh, colliders) {
  const pos = mesh.position;
  let collided = false;
  for (const c of colliders) {
    if (c === mesh) continue;
    const b1 = new THREE.Box3().setFromObject(mesh);
    const b2 = new THREE.Box3().setFromObject(c);
    if (b1.intersectsBox(b2)) {
      collided = true;
      const dir = pos.clone().sub(c.position).setY(0).normalize();
      pos.add(dir.multiplyScalar(0.12));
    }
  }
  return collided;
}

function checkMushroomCrush(player, worldMushrooms, playerStats) {
  for (const mush of worldMushrooms) {
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
      const typeIndex = mush.userData.typeIndex;
      if (typeIndex !== undefined) {
        MUSHROOM_TYPES[typeIndex].effect(playerStats);
      }
    }
  }
}

window.checkCollisions = checkCollisions;
window.checkMushroomCrush = checkMushroomCrush;
