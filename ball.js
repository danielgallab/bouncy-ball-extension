class Ball {
  static GRAVITY = 0.5;
  static FRICTION = 0.99;
  static BOUNCE = 0.7;
  static RADIUS = 25;
  static REST_THRESHOLD = 0.5;

  static colors = [
    { main: '#ff6b6b', mid: '#ee5a5a', dark: '#c44d4d' },
    { main: '#4ecdc4', mid: '#3dbdb5', dark: '#2a9d8f' },
    { main: '#ffe66d', mid: '#ffd93d', dark: '#f9c74f' },
    { main: '#a388ee', mid: '#9171e0', dark: '#7c5ce0' },
    { main: '#ff8fab', mid: '#ff7096', dark: '#e05780' },
    { main: '#72efdd', mid: '#56cfe1', dark: '#48bfe3' },
  ];

  static counter = 0;
  static all = [];

  constructor(x, y, vx = 0, vy = 0) {
    this.id = `bouncy-ball-${Ball.counter++}`;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.isDragging = false;
    this.isResting = vx === 0 && vy === 0;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.ignoreCollisionWith = null;

    this.createElement();
    this.setupEvents();
    this.updatePosition();

    Ball.all.push(this);
  }

  createElement() {
    const color = Ball.colors[Ball.all.length % Ball.colors.length];

    this.element = document.createElement('div');
    this.element.id = this.id;
    this.element.className = 'bouncy-ball-extension';
    this.element.style.background = `radial-gradient(circle at 30% 30%, ${color.main}, ${color.mid} 40%, ${color.dark} 100%)`;
    document.documentElement.appendChild(this.element);
  }

  updatePosition() {
    this.element.style.left = `${this.x - Ball.RADIUS}px`;
    this.element.style.top = `${this.y - Ball.RADIUS}px`;
  }

  setupEvents() {
    const onPointerDown = (e) => {
      e.preventDefault();
      this.isDragging = true;
      this.isResting = false;
      this.element.classList.add('dragging');

      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;

      this.dragOffsetX = clientX - this.x;
      this.dragOffsetY = clientY - this.y;

      this.vx = 0;
      this.vy = 0;
    };

    const onPointerMove = (e) => {
      if (!this.isDragging) return;

      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      if (clientX === undefined) return;

      const newX = clientX - this.dragOffsetX;
      const newY = clientY - this.dragOffsetY;

      this.vx = (newX - this.x) * 0.5;
      this.vy = (newY - this.y) * 0.5;

      this.x = newX;
      this.y = newY;

      this.updatePosition();
    };

    const onPointerUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.element.classList.remove('dragging');
    };

    // Click to bounce when resting
    this.element.addEventListener('click', () => {
      if (this.isResting && !this.isDragging) {
        this.isResting = false;
        this.vy = -10;
        this.vx = (Math.random() - 0.5) * 10;
      }
    });

    // Double click to duplicate
    this.element.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const newBall = new Ball(
        this.x,
        this.y,
        (Math.random() - 0.5) * 15,
        Math.random() * -10 - 10
      );
      // Ignore collision with parent until separated
      newBall.ignoreCollisionWith = this;
    });

    this.element.addEventListener('mousedown', onPointerDown);
    this.element.addEventListener('touchstart', onPointerDown, { passive: false });

    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('touchmove', onPointerMove, { passive: false });

    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);
  }

  update() {
    if (this.isDragging || this.isResting) return;

    // Apply gravity
    this.vy += Ball.GRAVITY;

    // Apply friction
    this.vx *= Ball.FRICTION;
    this.vy *= Ball.FRICTION;

    // Update position
    this.x += this.vx;
    this.y += this.vy;

    // Boundary collisions
    const maxX = window.innerWidth - Ball.RADIUS;
    const maxY = window.innerHeight - Ball.RADIUS;

    if (this.x > maxX) {
      this.x = maxX;
      this.vx = -this.vx * Ball.BOUNCE;
    }

    if (this.x < Ball.RADIUS) {
      this.x = Ball.RADIUS;
      this.vx = -this.vx * Ball.BOUNCE;
    }

    if (this.y > maxY) {
      this.y = maxY;
      this.vy = -this.vy * Ball.BOUNCE;

      if (Math.abs(this.vy) < Ball.REST_THRESHOLD && Math.abs(this.vx) < Ball.REST_THRESHOLD) {
        this.vy = 0;
        this.vx = 0;
        this.isResting = true;
      }
    }

    if (this.y < Ball.RADIUS) {
      this.y = Ball.RADIUS;
      this.vy = -this.vy * Ball.BOUNCE;
    }

  }

  constrainToBounds() {
    const maxX = window.innerWidth - Ball.RADIUS;
    const maxY = window.innerHeight - Ball.RADIUS;

    if (this.x > maxX) this.x = maxX;
    if (this.y > maxY) this.y = maxY;

    this.updatePosition();
  }

  static checkCollision(ball1, ball2) {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = Ball.RADIUS * 2;

    // Check if balls should ignore each other (newly duplicated)
    if (ball1.ignoreCollisionWith === ball2 || ball2.ignoreCollisionWith === ball1) {
      // Clear the ignore flag once they're fully separated
      if (distance >= minDist) {
        if (ball1.ignoreCollisionWith === ball2) ball1.ignoreCollisionWith = null;
        if (ball2.ignoreCollisionWith === ball1) ball2.ignoreCollisionWith = null;
      }
      return;
    }

    if (distance < minDist && distance > 0) {
      // Normalize collision vector
      const nx = dx / distance;
      const ny = dy / distance;

      // Relative velocity
      const dvx = ball1.vx - ball2.vx;
      const dvy = ball1.vy - ball2.vy;

      // Relative velocity along collision normal
      const dvn = dvx * nx + dvy * ny;

      // Only resolve if balls are moving toward each other
      if (dvn > 0) {
        // Impulse (assuming equal mass)
        const impulse = dvn * Ball.BOUNCE;

        // Update velocities
        ball1.vx -= impulse * nx;
        ball1.vy -= impulse * ny;
        ball2.vx += impulse * nx;
        ball2.vy += impulse * ny;

        // Wake up resting balls
        ball1.isResting = false;
        ball2.isResting = false;
      }

      // Separate overlapping balls
      const overlap = minDist - distance;
      const separationX = (overlap / 2) * nx;
      const separationY = (overlap / 2) * ny;

      ball1.x -= separationX;
      ball1.y -= separationY;
      ball2.x += separationX;
      ball2.y += separationY;
    }
  }

  static handleCollisions() {
    for (let i = 0; i < Ball.all.length; i++) {
      for (let j = i + 1; j < Ball.all.length; j++) {
        Ball.checkCollision(Ball.all[i], Ball.all[j]);
      }
    }
  }

  static updateAll() {
    for (const ball of Ball.all) {
      ball.update();
    }
    Ball.handleCollisions();
    for (const ball of Ball.all) {
      ball.updatePosition();
    }
    requestAnimationFrame(Ball.updateAll);
  }

  static constrainAllToBounds() {
    for (const ball of Ball.all) {
      ball.constrainToBounds();
    }
  }
}
