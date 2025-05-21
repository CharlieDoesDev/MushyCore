// entities.js
// Entity system for Mushy Bounce

class Entity {
  constructor(mesh) {
    this.mesh = mesh;
    this.velocity = new THREE.Vector3();
    this.onGround = false;
  }
  update(delta) {}
}

class MushroomEntity extends Entity {
  constructor(mesh) {
    super(mesh);
    this.jiggleTime = 0;
    this.jiggleAmount = 0;
  }
  update(delta) {
    // Jiggle physics: squash and stretch
    this.jiggleTime += delta;
    let scaleY = 1 + Math.sin(this.jiggleTime * 16) * this.jiggleAmount;
    let scaleXZ = 1 - (scaleY - 1) * 0.5;
    this.mesh.scale.set(scaleXZ, scaleY, scaleXZ);
    // Dampen jiggle
    this.jiggleAmount *= 0.92;
  }
  triggerJiggle(amount = 0.18) {
    this.jiggleAmount = Math.max(this.jiggleAmount, amount);
  }
}

export { Entity, MushroomEntity };
