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
  // Example third-person camera logic
  if (!camera || !mushroom) return;
  const offset = new THREE.Vector3(0, 1.5, 4);
  const euler = new THREE.Euler(pitch || 0, yaw || 0, 0, "YXZ");
  offset.applyEuler(euler);
  camera.position.copy(mushroom.position).add(offset);
  camera.lookAt(mushroom.position);
}

// Move camera-related functions here
function updateCamera() {
  // ...existing code from main.js...
}

// Expose functions globally
window.updateCamera = updateCamera;
