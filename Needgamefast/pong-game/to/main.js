// vertexShaderSource holds the content of shaders/vertex.glsl
const vertexShaderSource = `attribute vec2 a_position;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

// fragmentShaderSource holds the content of shaders/fragment.glsl
const fragmentShaderSource = `precision mediump float;

uniform vec4 u_color;

void main() {
    gl_FragColor = u_color;
}`;

// Initialize WebGL context
function initWebGL(canvas) {
    const gl = canvas.getContext('webgl');
    if (!gl) {
        alert('WebGL not supported');
        return null;
    }
    return gl;
}

// Compile shader
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!success) {
        console.log(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// Create shader program
function createProgram(gl, vertexSrc, fragmentSrc) {
    const vertexShader = compileShader(gl, vertexSrc, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentSrc, gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }
    return program;
}

// Game objects
const paddles = {
    left: { x: -0.9, y: 0.0, width: 0.02, height: 0.2, dy: 0 },
    right: { x: 0.9, y: 0.0, width: 0.02, height: 0.2, dy: 0 }
};

const ball = {
    x: 0.0,
    y: 0.0,
    dx: 0.01,
    dy: 0.01,
    size: 0.02
};

// Handle input
const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Update game state
function update() {
    // Left paddle controls
    if (keys['w']) paddles.left.dy = 0.02;
    else if (keys['s']) paddles.left.dy = -0.02;
    else paddles.left.dy = 0;

    // Right paddle controls
    if (keys['ArrowUp']) paddles.right.dy = 0.02;
    else if (keys['ArrowDown']) paddles.right.dy = -0.02;
    else paddles.right.dy = 0;

    // Update paddle positions
    paddles.left.y += paddles.left.dy;
    paddles.right.y += paddles.right.dy;

    // Prevent paddles from going out of bounds
    paddles.left.y = Math.max(-1 + paddles.left.height / 2, Math.min(1 - paddles.left.height / 2, paddles.left.y));
    paddles.right.y = Math.max(-1 + paddles.right.height / 2, Math.min(1 - paddles.right.height / 2, paddles.right.y));

    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Collision with top and bottom
    if (ball.y > 1 - ball.size || ball.y < -1 + ball.size) {
        ball.dy *= -1;
    }

    // Collision with paddles
    if (ball.x < paddles.left.x + paddles.left.width &&
        ball.x > paddles.left.x - paddles.left.width &&
        ball.y < paddles.left.y + paddles.left.height / 2 &&
        ball.y > paddles.left.y - paddles.left.height / 2) {
        ball.dx *= -1;
    }

    if (ball.x > paddles.right.x - paddles.right.width &&
        ball.x < paddles.right.x + paddles.right.width &&
        ball.y < paddles.right.y + paddles.right.height / 2 &&
        ball.y > paddles.right.y - paddles.right.height / 2) {
        ball.dx *= -1;
    }

    // Reset ball if it goes past paddles
    if (ball.x > 1 || ball.x < -1) {
        ball.x = 0;
        ball.y = 0;
        ball.dx = -ball.dx;
    }
}

// Render game objects
function render(gl, program, positionLocation, colorLocation) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // Left paddle
    drawRect(gl, program, positionLocation, colorLocation, paddles.left.x, paddles.left.y, paddles.left.width, paddles.left.height, [1, 1, 1, 1]);

    // Right paddle
    drawRect(gl, program, positionLocation, colorLocation, paddles.right.x, paddles.right.y, paddles.right.width, paddles.right.height, [1, 1, 1, 1]);

    // Ball
    drawRect(gl, program, positionLocation, colorLocation, ball.x, ball.y, ball.size, ball.size, [1, 1, 1, 1]);
}

// Draw a rectangle
function drawRect(gl, program, positionLocation, colorLocation, x, y, width, height, color) {
    const vertices = new Float32Array([
        x - width, y - height,
        x + width, y - height,
        x - width, y + height,
        x - width, y + height,
        x + width, y - height,
        x + width, y + height
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.uniform4fv(colorLocation, color);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Main function
function main() {
    const canvas = document.getElementById('gameCanvas');
    const gl = initWebGL(canvas);
    if (!gl) return;

    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    if (!program) return;

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const colorLocation = gl.getUniformLocation(program, 'u_color');

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 1);

    function gameLoop() {
        update();
        render(gl, program, positionLocation, colorLocation);
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
}

window.onload = main; 