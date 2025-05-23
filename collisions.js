// collisions.js
// Handles collision detection and response
// NOTE: Player/terrain collisions are now handled by cannon-es physics engine.

// You may still want to use this for mushroom-to-mushroom or other non-physics collisions
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

window.checkMushroomCrush = checkMushroomCrush;
