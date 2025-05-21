// lighting.js
// Sets up and manages lighting in the scene

export function addBetterLighting(scene) {
  // Sunlight
  const sun = new THREE.DirectionalLight(0xfff7e0, 1.1);
  sun.position.set(5, 10, 5);
  sun.castShadow = true;
  scene.add(sun);
  // Soft fill
  const fill = new THREE.HemisphereLight(0x88ccee, 0x334422, 0.7);
  scene.add(fill);
  // Subtle point lights for color
  for (let i = 0; i < 3; i++) {
    const color = [0xffb347, 0x7ec850, 0x7ec8e3][i];
    const pt = new THREE.PointLight(color, 0.3, 10);
    pt.position.set(Math.cos(i * 2) * 6, 2 + i, Math.sin(i * 2) * 6);
    scene.add(pt);
  }
}
