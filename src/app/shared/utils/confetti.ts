import confetti from 'canvas-confetti';

export function launchConfetti() {
  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#bb0000', '#ffffff', '#00bb00', '#ffcc00'],
  });
}
