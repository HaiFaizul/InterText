const canvas = document.getElementById('textCanvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput');

// --- Configuration ---
const desktopFontSize = 100; // Font size for larger screens
const mobileFontSize = 55;   // Font size for smaller screens (adjust as needed)
const mobileBreakpoint = 768; // Width threshold for using mobile size (adjust as needed)

const fontFamily = 'Arial';
const particleColor = '#000000';
const lineColor = 'rgba(150, 150, 150, 0.3)';
const particleSize = 1.5;
const lineThickness = 0.5;
const density = 4;

const interactionRadius = 100; // Renamed from mouseRadius
const repulsionStrength = 5;
const returnSpeed = 0.06;
const friction = 0.95;
// --- End Configuration ---

let particles = [];
let interactionPoint = { // Renamed from mouse for clarity
    x: null,
    y: null,
    radius: interactionRadius
};

// Particle Class (No changes needed from the working PC version)
class Particle {
    constructor(x, y) {
        this.baseX = x;
        this.baseY = y;
        // Start near base for faster initial formation
        this.x = this.baseX + (Math.random() - 0.5) * 50;
        this.y = this.baseY + (Math.random() - 0.5) * 50;
        this.size = particleSize;
        this.vx = 0;
        this.vy = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.baseX, this.baseY);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineThickness;
        ctx.stroke();

        ctx.fillStyle = particleColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    }

    update() {
        let dxInteract = this.x - interactionPoint.x;
        let dyInteract = this.y - interactionPoint.y;
        let distanceInteract = Math.sqrt(dxInteract * dxInteract + dyInteract * dyInteract);
        let forceDirectionX = 0;
        let forceDirectionY = 0;
        let force = 0;

        // Check if interaction point is valid and close enough
        if (interactionPoint.x !== null && distanceInteract < interactionPoint.radius) {
            force = (interactionPoint.radius - distanceInteract) / interactionPoint.radius * repulsionStrength;
            forceDirectionX = dxInteract / distanceInteract;
            forceDirectionY = dyInteract / distanceInteract;
        }

        let dxBase = this.baseX - this.x;
        let dyBase = this.baseY - this.y;

        this.vx += forceDirectionX * force;
        this.vy += forceDirectionY * force;
        this.vx += dxBase * returnSpeed;
        this.vy += dyBase * returnSpeed;
        this.vx *= friction;
        this.vy *= friction;
        this.x += this.vx;
        this.y += this.vy;
    }
}

// Get text pixel data and create particles (MODIFIED for font size)
function initParticles() {
    particles = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const currentText = textInput.value.trim();
    if (!currentText) {
        return; // Exit if no text
    }

    // *** Determine font size based on screen width ***
    const currentFontSize = window.innerWidth < mobileBreakpoint ? mobileFontSize : desktopFontSize;

    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.font = `bold ${currentFontSize}px ${fontFamily}`; // Use determined size
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textMetrics = ctx.measureText(currentText);
    // Using approximation for height if specific metrics aren't available
    const actualHeight = (textMetrics.actualBoundingBoxAscent || currentFontSize * 0.75) +
                         (textMetrics.actualBoundingBoxDescent || currentFontSize * 0.25);
    const actualWidth = textMetrics.width;

    // Center text (adjust Y slightly if needed, baseline 'middle' helps a lot)
    const textDrawX = canvas.width / 2;
    const textDrawY = canvas.height / 2;

    // Draw temporarily to get data
    ctx.fillText(currentText, textDrawX, textDrawY);

    try {
        // Get image data for the whole canvas (simpler than calculating exact box)
        const textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the temporary text

        // Scan the image data
        for (let y = 0; y < textImageData.height; y += density) {
            for (let x = 0; x < textImageData.width; x += density) {
                const alphaIndex = (y * textImageData.width + x) * 4 + 3;
                if (textImageData.data[alphaIndex] > 128) { // Check alpha channel
                    particles.push(new Particle(x, y));
                }
            }
        }
    } catch (error) {
        console.error("Error getting ImageData:", error);
        particles = []; // Clear particles on error
    }
}

// Animation loop (No changes needed)
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    requestAnimationFrame(animate);
}

// --- Event Listeners ---

// Helper to get coordinates relative to canvas
function getRelativeCoords(event) {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

// Mouse Listeners (Keep the original simple ones)
canvas.addEventListener('mousemove', (event) => {
    const coords = getRelativeCoords(event);
    interactionPoint.x = coords.x;
    interactionPoint.y = coords.y;
});

canvas.addEventListener('mouseleave', () => {
    interactionPoint.x = null;
    interactionPoint.y = null;
});
// Optional: mouseout might be redundant if mouseleave is handled
// canvas.addEventListener('mouseout', () => {
//     interactionPoint.x = null;
//     interactionPoint.y = null;
// });


// *** Touch Listeners (NEW) ***
canvas.addEventListener('touchstart', (event) => {
    // Prevent scroll only if touch is on canvas, not input field
    if (event.target === canvas) {
         // event.preventDefault(); // Careful: might prevent text selection/input focus
    }
    const coords = getRelativeCoords(event);
    interactionPoint.x = coords.x;
    interactionPoint.y = coords.y;
}, { passive: true }); // Use passive: true if not preventing default

canvas.addEventListener('touchmove', (event) => {
    // Prevent default scroll ONLY when dragging on the canvas itself
    if (event.target === canvas) {
        event.preventDefault();
    }
    const coords = getRelativeCoords(event);
    interactionPoint.x = coords.x;
    interactionPoint.y = coords.y;
}, { passive: false }); // MUST be passive: false to allow preventDefault

canvas.addEventListener('touchend', () => {
    interactionPoint.x = null;
    interactionPoint.y = null;
});

canvas.addEventListener('touchcancel', () => { // Handle interruptions
    interactionPoint.x = null;
    interactionPoint.y = null;
});


// Resize Listener
window.addEventListener('resize', () => {
    // No debouncing for simplicity, might flicker slightly during resize
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles(); // Re-initialize with new size and font size
});

// Input Listener
textInput.addEventListener('input', () => {
    // No debouncing for simplicity
    initParticles();
});

// --- Initialization ---
function initialize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles();
    animate();
}

initialize(); // Run the setup