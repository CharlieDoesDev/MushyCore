// events.js
// Handles input and event listeners

let keys = {};
let isJumping = false;
let isMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;
let yaw = 0;
let pitch = 0;

export function setupEventListeners(
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

// Move event handling functions here
export function onKeyDown(e) {
  // ...existing code from main.js...
}

export function onKeyUp(e) {
  // ...existing code from main.js...
}

export function onMouseDown(e) {
  // ...existing code from main.js...
}

export function onMouseMove(e) {
  // ...existing code from main.js...
}

export function onMouseUp() {
  // ...existing code from main.js...
}

export function goFullScreen() {
  // ...existing code from main.js...
}

// Expose functions globally
window.onKeyDown = onKeyDown;
window.onKeyUp = onKeyUp;
window.onMouseDown = onMouseDown;
window.onMouseMove = onMouseMove;
window.onMouseUp = onMouseUp;
window.goFullScreen = goFullScreen;
window.setupEventListeners = setupEventListeners;
