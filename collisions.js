// collisions.js
// Handles collision detection and response

function checkCollisions(mesh, colliders) {
  if (!colliders) return false;
  const meshBox = new THREE.Box3().setFromObject(mesh);
  for (const collider of colliders) {
    if (collider === mesh) continue;
    const colliderBox = new THREE.Box3().setFromObject(collider);
    if (meshBox.intersectsBox(colliderBox)) {
      return true;
    }
  }
  return false;
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
