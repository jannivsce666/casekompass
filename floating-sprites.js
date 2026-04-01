// Floating Medical Sprites Animation
// Creates floating hands and medical symbols in the background

class FloatingSprites {
    constructor() {
        this.sprites = [];
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.spriteTypes = ['hand', 'cross'];
        this.init();
    }

    init() {
        this.createCanvas();
        this.generateSprites();
        this.animate();
        window.addEventListener('resize', () => this.handleResize());
    }

    createCanvas() {
        // Remove existing canvas if any
        const existingCanvas = document.getElementById('floating-sprites-canvas');
        if (existingCanvas) {
            existingCanvas.remove();
        }

        this.canvas = document.createElement('canvas');
        this.canvas.id = 'floating-sprites-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -5;
            opacity: 0.2;
        `;
        
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.updateCanvasSize();
        
        console.log('Canvas created with NEW GREEN sprites:', this.canvas.width, 'x', this.canvas.height);
    }

    updateCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    drawHand(ctx, size) {
        ctx.save();
        const scale = size / 40;
        ctx.scale(scale, scale);
        
        ctx.fillStyle = '#4CA1A3';
        ctx.strokeStyle = '#4CA1A3';
        ctx.lineWidth = 2;
        
        // Simple hand shape
        ctx.beginPath();
        // Palm
        ctx.rect(-8, -5, 16, 20);
        ctx.fill();
        
        // Fingers
        ctx.rect(-6, -15, 3, 12);
        ctx.fill();
        ctx.rect(-2, -17, 3, 14);
        ctx.fill();
        ctx.rect(2, -16, 3, 13);
        ctx.fill();
        ctx.rect(6, -14, 3, 11);
        ctx.fill();
        
        // Thumb
        ctx.rect(-12, -2, 6, 8);
        ctx.fill();
        
        ctx.restore();
    }

    drawCross(ctx, size) {
        ctx.save();
        const scale = size / 40;
        ctx.scale(scale, scale);
        
        ctx.fillStyle = '#4CA1A3';
        
        // Vertical bar
        ctx.fillRect(-3, -15, 6, 30);
        
        // Horizontal bar
        ctx.fillRect(-15, -3, 30, 6);
        
        ctx.restore();
    }

    generateSprites() {
        this.sprites = [];
        const spriteCount = 40; // Weniger Sprites
        
        for (let i = 0; i < spriteCount; i++) {
            this.sprites.push({
                type: this.spriteTypes[Math.floor(Math.random() * this.spriteTypes.length)],
                x: Math.random() * this.canvas.width,
                y: 200 + Math.random() * (this.canvas.height - 200), // Start below hero
                size: 15 + Math.random() * 12, // Kleinere Sprites (15-27px statt 25-45px)
                speedX: (Math.random() - 0.5) * 0.05, // Noch langsamer (0.05 statt 0.1)
                speedY: (Math.random() - 0.5) * 0.05, // Noch langsamer
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 0.1, // Langsamere Rotation (0.1 statt 0.2)
                opacity: 0.15 + Math.random() * 0.15 // Noch transparenter (0.15-0.3 statt 0.2-0.4)
            });
        }
        
        console.log('Generated', this.sprites.length, 'subtle sprites');
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.sprites.forEach((sprite, index) => {
            // Update position
            sprite.x += sprite.speedX;
            sprite.y += sprite.speedY;
            sprite.rotation += sprite.rotationSpeed;
            
            // Wrap around screen edges
            if (sprite.x > this.canvas.width + 50) sprite.x = -50;
            if (sprite.x < -50) sprite.x = this.canvas.width + 50;
            if (sprite.y > this.canvas.height + 50) sprite.y = 200; // Reset to below hero
            if (sprite.y < 200) sprite.y = this.canvas.height + 50;
            
            // Draw sprite
            this.ctx.save();
            this.ctx.translate(sprite.x, sprite.y);
            this.ctx.rotate(sprite.rotation * Math.PI / 180);
            this.ctx.globalAlpha = sprite.opacity;
            
            // Draw based on type
            if (sprite.type === 'hand') {
                this.drawHand(this.ctx, sprite.size);
            } else if (sprite.type === 'cross') {
                this.drawCross(this.ctx, sprite.size);
            }
            
            this.ctx.restore();
        });
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    handleResize() {
        this.updateCanvasSize();
        this.generateSprites();
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas) {
            this.canvas.remove();
        }
        window.removeEventListener('resize', this.handleResize);
    }
}

// Initialize floating sprites when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating sprites...');
    new FloatingSprites();
});

// Re-initialize on window resize if needed
window.addEventListener('resize', () => {
    const existingCanvas = document.getElementById('floating-sprites-canvas');
    if (!existingCanvas) {
        new FloatingSprites();
    }
});