import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- BASIC SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 1.8; // Standard eye-level height

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('game-canvas'),
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 10, 0);
pointLight.castShadow = true;
scene.add(pointLight);

// --- LEVEL GEOMETRY ---
const floorGeometry = new THREE.PlaneGeometry(50, 50);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, side: THREE.DoubleSide });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

function createWall(width, height, depth, x, y, z) {
    const wallGeometry = new THREE.BoxGeometry(width, height, depth);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.set(x, y, z);
    wall.receiveShadow = true;
    wall.castShadow = true;
    scene.add(wall);
}

createWall(50, 10, 1, 0, 5, -25); // Back wall
createWall(50, 10, 1, 0, 5, 25);  // Front wall
createWall(1, 10, 50, -25, 5, 0); // Left wall
createWall(1, 10, 50, 25, 5, 0);  // Right wall

// --- TARGETS ---
const targets = [];
let score = 0;
const scoreElement = document.getElementById('score');

function spawnTarget() {
    const targetGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const targetMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const target = new THREE.Mesh(targetGeometry, targetMaterial);
    target.castShadow = true;

    target.position.set(
        (Math.random() - 0.5) * 48,
        Math.random() * 8 + 1,
        (Math.random() - 0.5) * 48
    );

    scene.add(target);
    targets.push(target);
}

// Spawn initial targets
for (let i = 0; i < 10; i++) {
    spawnTarget();
}

// --- CONTROLS ---
const controls = new PointerLockControls(camera, renderer.domElement);
const blocker = document.getElementById('blocker');

blocker.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    blocker.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    blocker.style.display = 'flex';
});

scene.add(controls.getObject());

// --- MOVEMENT ---
const keys = {};
document.addEventListener('keydown', (event) => { keys[event.code] = true; });
document.addEventListener('keyup', (event) => { keys[event.code] = false; });

const moveSpeed = 5.0;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// --- SHOOTING ---
const raycaster = new THREE.Raycaster();

window.addEventListener('click', () => {
    if (!controls.isLocked) return;

    raycaster.setFromCamera({ x: 0, y: 0 }, camera); // Ray from center of screen
    const intersects = raycaster.intersectObjects(targets);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        scene.remove(hitObject);
        
        // Remove from targets array
        const index = targets.indexOf(hitObject);
        if (index > -1) {
            targets.splice(index, 1);
        }

        // Update score and spawn a new target
        score++;
        scoreElement.textContent = `Score: ${score}`;
        spawnTarget();
    }
});

// --- RESIZE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Only update controls if the pointer is locked
    if (controls.isLocked) {
        // Reset velocity and direction
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(keys['KeyW']) - Number(keys['KeyS']);
        direction.x = Number(keys['KeyA']) - Number(keys['KeyD']);
        direction.normalize(); // Ensure consistent speed in all directions

        if (keys['KeyW'] || keys['KeyS']) velocity.z -= direction.z * moveSpeed * delta;
        if (keys['KeyA'] || keys['KeyD']) velocity.x -= direction.x * moveSpeed * delta;

        // Apply movement
        controls.moveRight(-velocity.x);
        controls.moveForward(-velocity.z);

        // Simple collision detection to keep player within the walls
        const playerPosition = controls.getObject().position;
        if (playerPosition.x > 24) playerPosition.x = 24;
        if (playerPosition.x < -24) playerPosition.x = -24;
        if (playerPosition.z > 24) playerPosition.z = 24;
        if (playerPosition.z < -24) playerPosition.z = -24;
    }

    // Make targets bob up and down
    const time = Date.now() * 0.001;
    targets.forEach(target => {
        target.position.y += Math.sin(time * 2 + target.id) * 0.005;
    });

    renderer.render(scene, camera);
}

animate();

