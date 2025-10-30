import confetti from 'canvas-confetti';

export function launchConfetti() {
  // 👉 Crear un canvas que flote encima de todo
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '9999'; // 🔝 más alto que cualquier diálogo
  canvas.style.pointerEvents = 'none'; // no bloquea clics
  document.body.appendChild(canvas);

  const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });

  // 🎉 Lanzar confeti durante unos segundos
  const duration = 5 * 1000;
  const end = Date.now() + duration;

  (function frame() {
    myConfetti({
      particleCount: 5,
      spread: 70,
      startVelocity: 40,
      origin: { y: 0.6 },
      colors: ['#bb0000', '#ffffff', '#00bb00', '#ffcc00'],
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    } else {
      // 🧹 Limpieza: eliminar el canvas al terminar
      document.body.removeChild(canvas);
    }
  })();
}
