// camera.js
// Handles camera management and updates

function setupCamera() {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 2, 5);
  return camera;
}

function updateCamera(camera, mushroom, yaw, pitch) {
  if (!camera || !mushroom) return;
  // Camera offset behind the player, relative to yaw/pitch
  const offset = new THREE.Vector3(0, 1.5, 4);
  const euler = new THREE.Euler(pitch || 0, yaw || 0, 0, "YXZ");
  offset.applyEuler(euler);
  camera.position.copy(mushroom.position).add(offset);
  camera.lookAt(
    mushroom.position.x,
    mushroom.position.y + 1,
    mushroom.position.z
  );
}

// Move camera-related functions here
function updateCamera() {
  // ...existing code from main.js...
}

// Expose functions globally
window.updateCamera = updateCamera;
