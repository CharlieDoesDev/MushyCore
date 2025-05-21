// particles.js
// Handles the particle system for ambiance

function addParticles(scene) {
  const count = 120;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 18;
    const y = 1.5 + Math.random() * 4;
    const z = (Math.random() - 0.5) * 18;
    positions.push(x, y, z);
    const c = new THREE.Color().setHSL(
      0.55 + Math.random() * 0.3,
      0.7,
      0.7 + Math.random() * 0.2
    );
    colors.push(c.r, c.g, c.b);
  }
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.18,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
  });
  const particles = new THREE.Points(geometry, material);
  scene.add(particles);
}

function animateParticles(particles) {
  if (!particles) return;
  const positions = particles.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    let y = positions.getY(i);
    y += Math.sin(Date.now() * 0.001 + i) * 0.003;
    if (y > 6) y = 1.5;
    positions.setY(i, y);
  }
  positions.needsUpdate = true;
}

// Expose functions globally
window.addParticles = addParticles;
window.animateParticles = animateParticles;
