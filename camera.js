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
  const radius = 4;
  const camX = mushroom.position.x + radius * Math.sin(yaw) * Math.cos(pitch);
  const camY = mushroom.position.y + 1.5 + radius * Math.sin(pitch);
  const camZ = mushroom.position.z + radius * Math.cos(yaw) * Math.cos(pitch);
  camera.position.set(camX, camY, camZ);
  camera.lookAt(
    mushroom.position.x,
    mushroom.position.y + 0.7,
    mushroom.position.z
  );
}

// Move camera-related functions here
function updateCamera() {
  // ...existing code from main.js...
}

// Expose functions globally
window.updateCamera = updateCamera;
