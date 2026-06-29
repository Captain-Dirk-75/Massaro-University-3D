export function createRenderLoop({ renderer, scene, camera, render, onUpdate }) {
  const clock = { last: performance.now() };

  function frame(now) {
    requestAnimationFrame(frame);

    const delta = Math.min((now - clock.last) / 1000, 0.1);
    clock.last = now;

    onUpdate?.(delta);

    if (render) {
      render();
    } else {
      renderer.render(scene, camera);
    }
  }

  requestAnimationFrame(frame);
}