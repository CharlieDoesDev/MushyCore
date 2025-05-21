// entities.js
// Entity system for Mushy Bounce

window.Entity = function (mesh) {
  this.mesh = mesh;
  this.velocity = new THREE.Vector3();
  this.onGround = false;
};
Entity.prototype.update = function (delta) {};

window.MushroomEntity = function (mesh) {
  window.Entity.call(this, mesh);
  this.jiggleTime = 0;
  this.jiggleAmount = 0;
};
window.MushroomEntity.prototype = Object.create(window.Entity.prototype);
window.MushroomEntity.prototype.constructor = window.MushroomEntity;
window.MushroomEntity.prototype.update = function (delta) {
  // Jiggle physics: squash and stretch
  this.jiggleTime += delta;
  let scaleY = 1 + Math.sin(this.jiggleTime * 16) * this.jiggleAmount;
  let scaleXZ = 1 - (scaleY - 1) * 0.5;
  this.mesh.scale.set(scaleXZ, scaleY, scaleXZ);
  // Dampen jiggle
  this.jiggleAmount *= 0.92;
};
window.MushroomEntity.prototype.triggerJiggle = function (amount) {
  this.jiggleAmount = Math.max(this.jiggleAmount, amount || 0.18);
};
