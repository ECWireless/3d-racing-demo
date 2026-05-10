import * as THREE from "three";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

app.innerHTML = `
  <canvas class="game-canvas" aria-label="3D racing demo viewport"></canvas>
  <aside class="hud">
    <p class="eyebrow">Prototype 01</p>
    <h1>Arcade drive</h1>
    <dl class="telemetry">
      <div>
        <dt>Speed</dt>
        <dd><span data-speed>0</span> km/h</dd>
      </div>
      <div>
        <dt>State</dt>
        <dd data-drive-state>Idle</dd>
      </div>
    </dl>
  </aside>
`;

const canvas = document.querySelector<HTMLCanvasElement>(".game-canvas");
const speedDisplay = document.querySelector<HTMLSpanElement>("[data-speed]");
const driveStateDisplay = document.querySelector<HTMLElement>("[data-drive-state]");

if (!canvas) {
  throw new Error("Missing game canvas");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8ecae6);
scene.fog = new THREE.Fog(0x8ecae6, 60, 150);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 8, 18);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const ambientLight = new THREE.HemisphereLight(0xd7f3ff, 0x263018, 1.25);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
sunLight.position.set(8, 14, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(2048, 2048);
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 45;
sunLight.shadow.camera.left = -45;
sunLight.shadow.camera.right = 45;
sunLight.shadow.camera.top = 45;
sunLight.shadow.camera.bottom = -45;
scene.add(sunLight);

const trackGroup = new THREE.Group();
scene.add(trackGroup);

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x2d6a4f,
  roughness: 0.9,
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 160), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
trackGroup.add(ground);

const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x24292f,
  roughness: 0.74,
});
const trackStraightHalfLength = 46;
const roadInnerRadius = 16;
const roadOuterRadius = 26;
const roadWidth = roadOuterRadius - roadInnerRadius;
const roadCenterRadius = (roadInnerRadius + roadOuterRadius) / 2;

function createStadiumShape(radius: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-trackStraightHalfLength, -radius);
  shape.lineTo(trackStraightHalfLength, -radius);
  shape.absarc(trackStraightHalfLength, 0, radius, -Math.PI / 2, Math.PI / 2, false);
  shape.lineTo(-trackStraightHalfLength, radius);
  shape.absarc(-trackStraightHalfLength, 0, radius, Math.PI / 2, -Math.PI / 2, false);
  shape.closePath();
  return shape;
}

const roadShape = createStadiumShape(roadOuterRadius);
const roadHole = createStadiumShape(roadInnerRadius);
roadShape.holes.push(roadHole);

const road = new THREE.Mesh(new THREE.ShapeGeometry(roadShape, 48), roadMaterial);
road.rotation.x = -Math.PI / 2;
road.position.y = 0.02;
road.receiveShadow = true;
trackGroup.add(road);

const lineMaterial = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9,
  roughness: 0.6,
});
const darkLineMaterial = new THREE.MeshStandardMaterial({
  color: 0x111111,
  roughness: 0.65,
});
const startLineGroup = new THREE.Group();
const startLineZ = -roadCenterRadius;
startLineGroup.position.set(0, 0.06, startLineZ);
trackGroup.add(startLineGroup);

const tileColumns = 8;
const tileRows = 3;
const tileWidth = (roadWidth - 0.4) / tileColumns;
const tileDepth = 2.4 / tileRows;
const tileGeometry = new THREE.BoxGeometry(tileDepth, 0.04, tileWidth);

for (let column = 0; column < tileColumns; column += 1) {
  for (let row = 0; row < tileRows; row += 1) {
    const tile = new THREE.Mesh(
      tileGeometry,
      (column + row) % 2 === 0 ? lineMaterial : darkLineMaterial,
    );
    tile.position.set(
      (row - (tileRows - 1) / 2) * tileDepth,
      0,
      (column - (tileColumns - 1) / 2) * tileWidth,
    );
    tile.receiveShadow = true;
    startLineGroup.add(tile);
  }
}

const carGroup = new THREE.Group();
carGroup.position.set(0, 0.48, startLineZ);
carGroup.rotation.y = Math.PI / 2;
scene.add(carGroup);

const bodyMaterial = new THREE.MeshStandardMaterial({
  color: 0xe63946,
  metalness: 0.1,
  roughness: 0.45,
});
const carBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 3), bodyMaterial);
carBody.castShadow = true;
carBody.receiveShadow = true;
carGroup.add(carBody);

const cabinMaterial = new THREE.MeshStandardMaterial({
  color: 0x8ecae6,
  metalness: 0.05,
  roughness: 0.18,
});
const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 1.05), cabinMaterial);
cabin.position.set(0, 0.48, -0.25);
cabin.castShadow = true;
carGroup.add(cabin);

const wheelMaterial = new THREE.MeshStandardMaterial({
  color: 0x101418,
  roughness: 0.7,
});
const wheelGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.28, 24);
const wheelPositions = [
  [-0.92, -0.18, -0.95],
  [0.92, -0.18, -0.95],
  [-0.92, -0.18, 0.95],
  [0.92, -0.18, 0.95],
] as const;
const wheels: THREE.Mesh[] = [];

for (const [x, y, z] of wheelPositions) {
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.position.set(x, y, z);
  wheel.rotation.z = Math.PI / 2;
  wheel.castShadow = true;
  carGroup.add(wheel);
  wheels.push(wheel);
}

const clock = new THREE.Clock();
const keys = new Set<string>();
const carState = {
  speed: 0,
  heading: Math.PI / 2,
};

const forward = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const cameraLookAt = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();

const acceleration = 18;
const brakePower = 28;
const drag = 2.4;
const maxForwardSpeed = 26;
const maxReverseSpeed = -9;
const steeringPower = 2.2;

function isPressed(...codes: string[]) {
  return codes.some((code) => keys.has(code));
}

function resetCar() {
  carState.speed = 0;
  carState.heading = Math.PI / 2;
  carGroup.position.set(0, 0.48, startLineZ);
  carGroup.rotation.set(0, carState.heading, 0);
}

function updateCar(deltaTime: number) {
  const throttle = isPressed("KeyW", "ArrowUp");
  const brake = isPressed("KeyS", "ArrowDown");
  const steerLeft = isPressed("KeyA", "ArrowLeft");
  const steerRight = isPressed("KeyD", "ArrowRight");
  const steerInput = Number(steerLeft) - Number(steerRight);

  if (throttle) {
    carState.speed += acceleration * deltaTime;
  }

  if (brake) {
    carState.speed -= brakePower * deltaTime;
  }

  if (!throttle && !brake) {
    const dragAmount = drag * deltaTime;
    carState.speed =
      Math.abs(carState.speed) <= dragAmount
        ? 0
        : carState.speed - Math.sign(carState.speed) * dragAmount;
  }

  carState.speed = THREE.MathUtils.clamp(carState.speed, maxReverseSpeed, maxForwardSpeed);

  const speedFactor = Math.min(Math.abs(carState.speed) / maxForwardSpeed, 1);
  const reverseSteering = carState.speed < 0 ? -1 : 1;
  carState.heading += steerInput * steeringPower * speedFactor * reverseSteering * deltaTime;

  forward.set(-Math.sin(carState.heading), 0, -Math.cos(carState.heading));
  carGroup.position.addScaledVector(forward, carState.speed * deltaTime);
  carGroup.position.y = 0.48;
  carGroup.rotation.y = carState.heading;

  for (const wheel of wheels) {
    wheel.rotation.x += carState.speed * deltaTime * 2.4;
  }
}

function updateCamera(deltaTime: number) {
  cameraTarget.copy(carGroup.position);
  desiredCameraPosition.copy(cameraTarget).addScaledVector(forward, -13);
  desiredCameraPosition.y += 7.2;

  const followLerp = 1 - Math.exp(-deltaTime * 5);
  camera.position.lerp(desiredCameraPosition, followLerp);

  cameraLookAt.copy(cameraTarget).addScaledVector(forward, 3);
  cameraLookAt.y += 1.4;
  camera.lookAt(cameraLookAt);
}

function updateHud() {
  if (speedDisplay) {
    speedDisplay.textContent = Math.round(Math.abs(carState.speed) * 5.2).toString();
  }

  if (driveStateDisplay) {
    if (carState.speed > 0.5) {
      driveStateDisplay.textContent = "Forward";
    } else if (carState.speed < -0.5) {
      driveStateDisplay.textContent = "Reverse";
    } else {
      driveStateDisplay.textContent = "Idle";
    }
  }
}

function resizeRenderer() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  const deltaTime = Math.min(clock.getDelta(), 0.05);

  updateCar(deltaTime);
  updateCamera(deltaTime);
  updateHud();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeRenderer);
window.addEventListener("keydown", (event) => {
  keys.add(event.code);

  if (event.code === "KeyR") {
    resetCar();
  }
});
window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});
animate();
