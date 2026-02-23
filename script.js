// --- Scene, Camera, and Renderer Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 15); // Position camera to see the scene

const renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('game-canvas'),
    antialias: true // Makes the edges of objects smoother
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; // Enable shadows

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 0);
directionalLight.castShadow = true;
scene.add(directionalLight);

// --- Objects ---
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Rotate the plane to be flat
ground.receiveShadow = true;
scene.add(ground);

const dinoGeometry = new THREE.BoxGeometry(1, 1, 1);
const dinoMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
const dino = new THREE.Mesh(dinoGeometry, dinoMaterial);
dino.position.y = 0.5; // Place dino on top of the ground
dino.castShadow = true;
scene.add(dino);

// --- Game State & Logic ---
let score = 0;
let isJumping = false;
let yVelocity = 0;
const gravity = -0.05;
let gameSpeed = 0.2;
let gameOver = false;
const obstacles = [];

// --- UI Elements ---
const scoreElement = document.getElementById('score');
const gameOverElement = document.getElementById('game-over');

// --- Event Listeners ---
document.addEventListener('keydown', onKeyDown);
window.addEventListener('resize', onWindowResize);

function onKeyDown(event) {
    if (event.code === 'Space' && !isJumping && !gameOver) {
        isJumping = true;
        yVelocity = 1.2;
    }
    if (event.code === 'KeyR' && gameOver) {
        restartGame();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- Game Functions ---
function createObstacle() {
    const obstacleHeight = Math.random() * 2 + 1;
    const obstacleGeometry = new THREE.BoxGeometry(1, obstacleHeight, 1);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x006400 });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    
    obstacle.position.set(-50, obstacleHeight / 2, 0);
    obstacle.castShadow = true;
    
    scene.add(obstacle);
    obstacles.push(obstacle);
}

function restartGame() {
    score = 0;
    gameSpeed = 0.2;
    gameOver = false;
    
    gameOverElement.classList.add('hidden');
    
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles.length = 0; // Clear the array
    
    dino.position.y = 0.5;
    
    animate(); // Restart the animation loop
}

// --- Main Animation Loop ---
function animate() {
    if (gameOver) {
        return; // Stop the loop if the game has ended
    }

    requestAnimationFrame(animate);

    // Jump physics
    if (isJumping) {
        dino.position.y += yVelocity;
        yVelocity += gravity;
        if (dino.position.y <= 0.5) {
            dino.position.y = 0.5;
            isJumping = false;
            yVelocity = 0;
        }
    }

    // Spawn new obstacles
    if (Math.random() < 0.01 && obstacles.length < 5) {
        createObstacle();
    }

    const dinoBox = new THREE.Box3().setFromObject(dino);

    // Update obstacles and check for collisions
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.position.x += gameSpeed;

        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (dinoBox.intersectsBox(obstacleBox)) {
            gameOver = true;
            gameOverElement.classList.remove('hidden');
        }

        // Remove off-screen obstacles for performance
        if (obstacle.position.x > 20) {
            scene.remove(obstacle);
            obstacles.splice(i, 1);
            score++;
            scoreElement.innerText = `Score: ${score}`;
            gameSpeed += 0.005; // Increase speed slightly
        }
    }

    renderer.render(scene, camera);
}

// --- Start Game ---
animate();

