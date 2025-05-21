// player.js
// Handles mushroom player mechanics

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

function updateMushroomMovement(
  mushroom,
  keys,
  velocity,
  playerGroundHeight,
  moveSpeed,
  colliders,
  worldMushrooms,
  playerStats
) {
  // Movement relative to camera/player orientation
  let moveX = 0,
    moveZ = 0;
  if (keys["KeyW"] || keys["ArrowUp"]) moveZ -= 1;
  if (keys["KeyS"] || keys["ArrowDown"]) moveZ += 1;
  if (keys["KeyA"] || keys["ArrowLeft"]) moveX -= 1;
  if (keys["KeyD"] || keys["ArrowRight"]) moveX += 1;
  if (moveX !== 0 || moveZ !== 0) {
    // Get yaw from global (set by mouse movement)
    const yaw = window.yaw || 0;
    // Rotate movement vector by yaw
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    moveX /= len;
    moveZ /= len;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const relX = moveX * cos - moveZ * sin;
    const relZ = moveX * sin + moveZ * cos;
    mushroom.position.x += relX * (moveSpeed + (playerStats?.speedBoost || 0));
    mushroom.position.z += relZ * (moveSpeed + (playerStats?.speedBoost || 0));
  }

  // Ensure velocity is tracked on the mushroom object
  if (typeof mushroom.userData.velocity !== "number")
    mushroom.userData.velocity = 0;
  if (typeof mushroom.userData.isOnGround !== "boolean")
    mushroom.userData.isOnGround = false;
  if (typeof mushroom.userData.jumpCharge !== "number")
    mushroom.userData.jumpCharge = 0;
  if (typeof mushroom.userData.isFlipping !== "boolean")
    mushroom.userData.isFlipping = false;
  if (typeof mushroom.userData.flipTime !== "number")
    mushroom.userData.flipTime = 0;

  // Jump charge logic
  if (
    keys["Space"] &&
    Math.abs(mushroom.position.y - playerGroundHeight) < 0.01
  ) {
    mushroom.userData.jumpCharge = Math.min(
      mushroom.userData.jumpCharge + 1 / 60,
      0.5
    );
  }

  // Flipping animation
  if (mushroom.userData.isFlipping) {
    mushroom.userData.flipTime += 1 / 60;
    mushroom.rotation.x = Math.PI * 2 * (mushroom.userData.flipTime / 0.5);
    if (mushroom.userData.flipTime >= 0.5) {
      mushroom.userData.isFlipping = false;
      mushroom.rotation.x = 0;
    }
  }

  // Bouncing logic
  let onGround = false;
  if (
    keys["Space"] &&
    Math.abs(mushroom.position.y - playerGroundHeight) < 0.01
  ) {
    mushroom.userData.velocity =
      (window.bounceStrength +
        (playerStats?.jumpBoost || 0) +
        (playerStats?.bounceBoost || 0)) *
      mushroom.position.y *
      0.6;
    onGround = false;
  }
  mushroom.userData.velocity += window.gravity;
  mushroom.position.y += mushroom.userData.velocity;

  // Collision with ground
  if (mushroom.position.y < playerGroundHeight) {
    mushroom.position.y = playerGroundHeight;
    mushroom.userData.velocity = 0;
    onGround = true;
    if (!mushroom.userData.isOnGround) {
      if (typeof window.triggerJiggle === "function")
        window.triggerJiggle(mushroom);
      mushroom.userData.isOnGround = true;
    }
  } else {
    mushroom.userData.isOnGround = false;
  }

  // Collision with objects
  if (
    typeof window.checkCollisions === "function" &&
    window.checkCollisions(mushroom, colliders)
  ) {
    mushroom.userData.velocity = Math.min(mushroom.userData.velocity, 0);
    onGround = true;
  }

  // Check for crushing world mushrooms
  mushroom.velocity = mushroom.userData.velocity;
  if (typeof window.checkMushroomCrush === "function")
    window.checkMushroomCrush(mushroom, worldMushrooms, playerStats);
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
      if (
        typeof window.MUSHROOM_TYPES !== "undefined" &&
        typeIndex !== undefined
      ) {
        window.MUSHROOM_TYPES[typeIndex].effect(playerStats);
      }
    }
  }
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

// Expose functions globally
window.createMushroom = createMushroom;
window.updateMushroomMovement = updateMushroomMovement;
window.checkMushroomCrush = checkMushroomCrush;
window.jiggleMushroom = jiggleMushroom;
window.triggerJiggle = triggerJiggle;
