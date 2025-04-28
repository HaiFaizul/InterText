const canvas = document.getElementById('textCanvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('textInput'); // Get the input element

// --- Configuration ---
// const textToDisplay = "Faizul Hai"; // REMOVED - Now comes from input
const fontSize = 100; // Adjust for desired text size
const fontFamily = 'Arial';
const particleColor = '#000000'; // Black particles
const lineColor = 'rgba(150, 150, 150, 0.3)'; // Light grey lines
const particleSize = 1.5; // Size of each dot
const lineThickness = 0.5; // Thickness of connecting lines
const density = 4; // Lower number = more particles (scan every 'density' pixel)

// Interaction parameters
const mouseRadius = 100; // Area of effect around the mouse
const repulsionStrength = 5; // How strongly particles are pushed away
const returnSpeed = 0.06; // How quickly particles return to origin (0 to 1)
const friction = 0.95; // Slows down particle movement (0 to 1)
// --- End Configuration ---

let particles = [];
let mouse = {
    x: null,
    y: null,
    radius: mouseRadius
};
// Removed textMetrics, textX, textY global variables as they are calculated fresh in initParticles

// Particle Class (No changes needed here)
class Particle {
    constructor(x, y) {
        this.baseX = x; // Original X position
        this.baseY = y; // Original Y position
        this.x = this.baseX + (Math.random() - 0.5) * canvas.width * 0.1; // Start near base but spread out a bit
        this.y = this.baseY + (Math.random() - 0.5) * canvas.height * 0.1;
        // this.x = Math.random() * canvas.width; // Option: Start fully random
        // this.y = Math.random() * canvas.height;
        this.size = particleSize;
        this.vx = 0; // Velocity X
        this.vy = 0; // Velocity Y
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
        let dxMouse = this.x - mouse.x;
        let dyMouse = this.y - mouse.y;
        let distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        let forceDirectionX = 0;
        let forceDirectionY = 0;
        let force = 0;

        if (mouse.x !== null && distanceMouse < mouse.radius) {
            force = (mouse.radius - distanceMouse) / mouse.radius * repulsionStrength;
            forceDirectionX = dxMouse / distanceMouse;
            forceDirectionY = dyMouse / distanceMouse;
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

// Get text pixel data and create particles (MODIFIED)
function initParticles() {
    particles = []; // Clear existing particles
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas before drawing text

    const currentText = textInput.value.trim(); // Get text from input field

    // If input is empty, don't draw anything
    if (!currentText) {
        console.log("Input is empty, clearing particles.");
        // Animation loop will continue but draw nothing
        return;
    }

    // Set font style for measurement and drawing
    ctx.fillStyle = 'rgba(0,0,0,1)'; // Use opaque black for accurate getImageData
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Measure text to center it
    const textMetrics = ctx.measureText(currentText);
    const actualHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
    const actualWidth = textMetrics.width;

    // Calculate position to center the text
    // Recalculate textX/textY each time based on current text
    const textX = Math.floor((canvas.width / 2) - (actualWidth / 2) - textMetrics.actualBoundingBoxLeft);
    const textY = Math.floor((canvas.height / 2) - (actualHeight / 2) + textMetrics.actualBoundingBoxAscent);

    // Draw the text centered (this is temporary, just to get pixel data)
    ctx.fillText(currentText, canvas.width / 2, canvas.height / 2);

    // Get pixel data for the drawn text area
    const textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the temporary text

    // Scan the image data
    for (let y = 0; y < textImageData.height; y += density) {
        for (let x = 0; x < textImageData.width; x += density) {
            const alphaIndex = (y * textImageData.width + x) * 4 + 3;
            if (textImageData.data[alphaIndex] > 128) {
                particles.push(new Particle(x, y));
            }
        }
    }
    console.log(`Initialized ${particles.length} particles for "${currentText}".`);
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

// Update mouse coordinates on move (No changes needed)
window.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});

// Reset mouse coordinates when it leaves the canvas (No changes needed)
canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});
canvas.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// Handle window resize (calls initParticles which now reads input)
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initParticles(); // Re-initialize particles based on new size and CURRENT input text
});

// *** NEW: Listen for changes in the text input field ***
textInput.addEventListener('input', () => {
    // Optional: debounce this for performance on very fast typing if needed
    initParticles();
});

// --- Initialization ---

// Set initial canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Create particles based on the INITIAL text in the input field
initParticles();

// Start the animation loop
animate();