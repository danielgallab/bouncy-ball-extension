(() => {
  // Prevent multiple instances of the script
  if (window.bouncyBallInitialized) return;
  window.bouncyBallInitialized = true;

  // Create initial ball
  new Ball(30, window.innerHeight - 30);

  // Start physics loop
  Ball.updateAll();

  // Handle window resize
  window.addEventListener('resize', () => {
    Ball.constrainAllToBounds();
  });
})();
