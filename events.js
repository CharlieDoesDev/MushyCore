// events.js
// Handles input and event listeners

window.keys = window.keys || {};
let isJumping = false;
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let yaw = 0;
let pitch = 0;

function setupEventListeners(
  mushroom,
  camera,
  renderer,
  playerGroundHeight,
  jumpCharge,
  maxJumpCharge,
  minJump,
  bounceStrength,
  playerStats,
  velocity
) {
  document.addEventListener("keydown", (e) => {
    keys[e.code] = true;
    if (
      e.code === "Space" &&
      Math.abs(mushroom.position.y - playerGroundHeight) < 0.01
    ) {
      isJumping = true;
    }
  });

  document.addEventListener("keyup", (e) => {
    keys[e.code] = false;
    if (e.code === "Space") {
      isJumping = false;
      if (Math.abs(mushroom.position.y - playerGroundHeight) < 0.01) {
        let charge = Math.min(jumpCharge, maxJumpCharge);
        let jumpPower = Math.max(
          minJump,
          minJump +
            (charge / maxJumpCharge) *
              (bounceStrength + playerStats.jumpBoost + playerStats.bounceBoost)
        );
        velocity = jumpPower;
      }
      jumpCharge = 0;
    }
  });

  document.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    isMouseDown = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  document.addEventListener("mouseup", () => {
    isMouseDown = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isMouseDown) return;
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    yaw -= dx * 0.01;
    pitch += dy * 0.01;
    pitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, pitch));
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function onKeyDown(e) {
  keys[e.code] = true;
}

function onKeyUp(e) {
  keys[e.code] = false;
}

function onMouseDown(e) {
  // Implement mouse down logic if needed
}

function onMouseMove(e) {
  // Implement mouse move logic if needed
}

function onMouseUp() {
  // Implement mouse up logic if needed
}

function goFullScreen() {
  if (document.body.requestFullscreen) document.body.requestFullscreen();
}

// Expose functions globally
window.setupEventListeners = setupEventListeners;
window.onKeyDown = onKeyDown;
window.onKeyUp = onKeyUp;
window.onMouseDown = onMouseDown;
window.onMouseMove = onMouseMove;
window.onMouseUp = onMouseUp;
window.goFullScreen = goFullScreen;
