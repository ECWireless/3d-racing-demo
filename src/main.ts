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
      <div>
        <dt>Lap</dt>
        <dd><span data-lap>1</span> / 3</dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd data-race-time>0:00.00</dd>
      </div>
    </dl>
    <p class="race-status" data-race-status>Accelerate to start the timer</p>
  </aside>
  <div class="finish-banner" data-finish-banner hidden>
    <p class="eyebrow">Race complete</p>
    <strong>Finished!</strong>
    <span data-finish-time>0:00.00</span>
  </div>
  <div class="race-announcement" data-race-announcement hidden>
    <strong data-announcement-title>3</strong>
    <span data-announcement-subtitle>Get ready</span>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>(".game-canvas");
const speedDisplay = document.querySelector<HTMLSpanElement>("[data-speed]");
const driveStateDisplay = document.querySelector<HTMLElement>("[data-drive-state]");
const lapDisplay = document.querySelector<HTMLSpanElement>("[data-lap]");
const raceTimeDisplay = document.querySelector<HTMLElement>("[data-race-time]");
const raceStatusDisplay = document.querySelector<HTMLElement>("[data-race-status]");
const finishBanner = document.querySelector<HTMLElement>("[data-finish-banner]");
const finishTimeDisplay = document.querySelector<HTMLElement>("[data-finish-time]");
const raceAnnouncement = document.querySelector<HTMLElement>("[data-race-announcement]");
const announcementTitle = document.querySelector<HTMLElement>("[data-announcement-title]");
const announcementSubtitle = document.querySelector<HTMLElement>("[data-announcement-subtitle]");

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
const grassRunoff = 7;
const innerBarrierRadius = roadInnerRadius - grassRunoff;
const outerBarrierRadius = roadOuterRadius + grassRunoff;

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

const barrierMaterial = new THREE.MeshStandardMaterial({
  color: 0xe9c46a,
  roughness: 0.58,
});

function createStadiumBarrier(radius: number) {
  const barrier = new THREE.Group();
  const railHeight = 0.7;
  const railThickness = 0.55;
  const straightLength = trackStraightHalfLength * 2;
  const straightGeometry = new THREE.BoxGeometry(straightLength, railHeight, railThickness);
  const capGeometry = new THREE.TorusGeometry(radius, railThickness / 2, 8, 72, Math.PI);

  const lowerRail = new THREE.Mesh(straightGeometry, barrierMaterial);
  lowerRail.position.set(0, railHeight / 2, -radius);
  lowerRail.castShadow = true;
  barrier.add(lowerRail);

  const upperRail = new THREE.Mesh(straightGeometry, barrierMaterial);
  upperRail.position.set(0, railHeight / 2, radius);
  upperRail.castShadow = true;
  barrier.add(upperRail);

  const leftCap = new THREE.Mesh(capGeometry, barrierMaterial);
  leftCap.position.set(-trackStraightHalfLength, railHeight / 2, 0);
  leftCap.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  leftCap.castShadow = true;
  barrier.add(leftCap);

  const rightCap = new THREE.Mesh(capGeometry, barrierMaterial);
  rightCap.position.set(trackStraightHalfLength, railHeight / 2, 0);
  rightCap.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  rightCap.castShadow = true;
  barrier.add(rightCap);

  return barrier;
}

trackGroup.add(createStadiumBarrier(innerBarrierRadius));
trackGroup.add(createStadiumBarrier(outerBarrierRadius));

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
const startLineHalfDepth = (tileRows * tileDepth) / 2;
const startLineHalfWidth = (tileColumns * tileWidth) / 2;
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
  throttleRamp: 0,
};
const raceState = {
  currentLap: 1,
  elapsedTime: 0,
  isRunning: false,
  isFinished: false,
  isCountdownActive: false,
  countdownRemaining: 0,
  countdownLabel: "",
  isLapArmed: false,
  previousX: carGroup.position.x,
};

const forward = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const cameraLookAt = new THREE.Vector3();
const desiredCameraPosition = new THREE.Vector3();

const acceleration = 18;
const brakePower = 28;
const drag = 2.4;
const baseForwardSpeed = 26;
const maxForwardSpeed = 34;
const maxReverseSpeed = -9;
const steeringPower = 2.2;
const totalLaps = 3;
const barrierInset = 0.65;
const grassDrag = 11;
const grassMaxSpeed = 16;
const handbrakePower = 24;
const finishCoastDrag = 5.5;
const countdownDuration = 3;
const throttleRampBuildRate = 0.2;
const throttleRampDecayRate = 0.5;
const overdriveAcceleration = 5;

function isPressed(...codes: string[]) {
  return codes.some((code) => keys.has(code));
}

const announcementState = {
  timeRemaining: 0,
};

function showAnnouncement(title: string, subtitle: string, duration = 1.1) {
  if (!raceAnnouncement || !announcementTitle || !announcementSubtitle) {
    return;
  }

  announcementTitle.textContent = title;
  announcementSubtitle.textContent = subtitle;
  raceAnnouncement.hidden = false;
  raceAnnouncement.classList.remove("is-animating");
  void raceAnnouncement.offsetWidth;
  raceAnnouncement.classList.add("is-animating");
  announcementState.timeRemaining = duration;
}

function updateAnnouncement(deltaTime: number) {
  if (!raceAnnouncement || raceAnnouncement.hidden) {
    return;
  }

  announcementState.timeRemaining -= deltaTime;

  if (announcementState.timeRemaining <= 0) {
    raceAnnouncement.hidden = true;
    raceAnnouncement.classList.remove("is-animating");
  }
}

function startCountdown() {
  raceState.isCountdownActive = true;
  raceState.countdownRemaining = countdownDuration;
  raceState.countdownLabel = "3";
  showAnnouncement("3", "Get ready", 1);
}

function getTrackCenterX(positionX: number) {
  return Math.abs(positionX) <= trackStraightHalfLength
    ? positionX
    : Math.sign(positionX) * trackStraightHalfLength;
}

function getTrackDistance(position: THREE.Vector3) {
  const centerX = getTrackCenterX(position.x);
  return Math.hypot(position.x - centerX, position.z);
}

function isCarOnRoad() {
  const distance = getTrackDistance(carGroup.position);
  return distance >= roadInnerRadius && distance <= roadOuterRadius;
}

function clampCarToRoad() {
  const centerX = getTrackCenterX(carGroup.position.x);
  const centerZ = 0;
  const offsetX = carGroup.position.x - centerX;
  const offsetZ = carGroup.position.z - centerZ;
  const distance = Math.hypot(offsetX, offsetZ);
  const minDistance = innerBarrierRadius + barrierInset;
  const maxDistance = outerBarrierRadius - barrierInset;
  const clampedDistance = THREE.MathUtils.clamp(distance, minDistance, maxDistance);

  if (Math.abs(distance - clampedDistance) < 0.001) {
    return;
  }

  const normalX = distance > 0.001 ? offsetX / distance : 0;
  const normalZ = distance > 0.001 ? offsetZ / distance : 1;
  carGroup.position.x = centerX + normalX * clampedDistance;
  carGroup.position.z = centerZ + normalZ * clampedDistance;
  carState.speed *= -0.18;
}

function resetCar() {
  carState.speed = 0;
  carState.heading = Math.PI / 2;
  carState.throttleRamp = 0;
  carGroup.position.set(0, 0.48, startLineZ);
  carGroup.rotation.set(0, carState.heading, 0);

  raceState.currentLap = 1;
  raceState.elapsedTime = 0;
  raceState.isRunning = false;
  raceState.isFinished = false;
  raceState.isCountdownActive = false;
  raceState.countdownRemaining = 0;
  raceState.countdownLabel = "";
  raceState.isLapArmed = false;
  raceState.previousX = carGroup.position.x;
  announcementState.timeRemaining = 0;

  if (finishBanner) {
    finishBanner.hidden = true;
  }

  if (raceAnnouncement) {
    raceAnnouncement.hidden = true;
    raceAnnouncement.classList.remove("is-animating");
  }
}

function updateCar(deltaTime: number) {
  const throttle = isPressed("KeyW", "ArrowUp");
  const brake = isPressed("KeyS", "ArrowDown");
  const handbrake = isPressed("ShiftLeft", "ShiftRight");
  const steerLeft = isPressed("KeyA", "ArrowLeft");
  const steerRight = isPressed("KeyD", "ArrowRight");
  const steerInput = Number(steerLeft) - Number(steerRight);
  const isOnRoad = isCarOnRoad();

  if (
    !raceState.isRunning &&
    !raceState.isFinished &&
    !raceState.isCountdownActive &&
    (throttle || brake)
  ) {
    startCountdown();
  }

  if (raceState.isFinished) {
    const coastAmount = finishCoastDrag * deltaTime;
    carState.speed =
      Math.abs(carState.speed) <= coastAmount
        ? 0
        : carState.speed - Math.sign(carState.speed) * coastAmount;
  } else if (!raceState.isCountdownActive && raceState.isRunning) {
    if (throttle) {
      if (carState.speed >= baseForwardSpeed) {
        carState.throttleRamp = Math.min(
          carState.throttleRamp + throttleRampBuildRate * deltaTime,
          1,
        );
      }

      carState.speed +=
        (carState.speed >= baseForwardSpeed ? overdriveAcceleration : acceleration) * deltaTime;
    } else {
      carState.throttleRamp = Math.max(carState.throttleRamp - throttleRampDecayRate * deltaTime, 0);
    }

    if (brake) {
      carState.speed -= brakePower * deltaTime;
      carState.throttleRamp = Math.max(carState.throttleRamp - throttleRampDecayRate * deltaTime, 0);
    }

    if (handbrake) {
      const handbrakeAmount = handbrakePower * deltaTime;
      carState.speed =
        Math.abs(carState.speed) <= handbrakeAmount
          ? 0
          : carState.speed - Math.sign(carState.speed) * handbrakeAmount;
      carState.throttleRamp = Math.max(carState.throttleRamp - throttleRampDecayRate * deltaTime, 0);
    }

    if (!throttle && !brake) {
      const dragAmount = drag * deltaTime;
      carState.speed =
        Math.abs(carState.speed) <= dragAmount
          ? 0
          : carState.speed - Math.sign(carState.speed) * dragAmount;
    }

    if (!isOnRoad) {
      const grassDragAmount = grassDrag * deltaTime;
      carState.speed =
        Math.abs(carState.speed) <= grassDragAmount
          ? 0
          : carState.speed - Math.sign(carState.speed) * grassDragAmount;
      carState.speed = THREE.MathUtils.clamp(carState.speed, -grassMaxSpeed * 0.5, grassMaxSpeed);
    }

    const currentForwardCap = THREE.MathUtils.lerp(
      baseForwardSpeed,
      maxForwardSpeed,
      carState.throttleRamp,
    );
    carState.speed = THREE.MathUtils.clamp(carState.speed, maxReverseSpeed, currentForwardCap);

    const speedFactor = Math.min(Math.abs(carState.speed) / maxForwardSpeed, 1);
    const reverseSteering = carState.speed < 0 ? -1 : 1;
    carState.heading += steerInput * steeringPower * speedFactor * reverseSteering * deltaTime;
  } else {
    carState.speed = 0;
  }

  forward.set(-Math.sin(carState.heading), 0, -Math.cos(carState.heading));
  carGroup.position.addScaledVector(forward, carState.speed * deltaTime);
  carGroup.position.y = 0.48;
  clampCarToRoad();
  carGroup.rotation.y = carState.heading;

  for (const wheel of wheels) {
    wheel.rotation.x += carState.speed * deltaTime * 2.4;
  }
}

function updateRace(deltaTime: number) {
  if (raceState.isCountdownActive) {
    raceState.countdownRemaining -= deltaTime;

    const nextLabel = Math.max(Math.ceil(raceState.countdownRemaining), 1).toString();
    if (nextLabel !== raceState.countdownLabel && raceState.countdownRemaining > 0) {
      raceState.countdownLabel = nextLabel;
      showAnnouncement(nextLabel, "Get ready", 1);
    }

    if (raceState.countdownRemaining <= 0) {
      raceState.isCountdownActive = false;
      raceState.isRunning = true;
      raceState.countdownLabel = "";
      showAnnouncement("Go!", "Lap 1 of 3", 0.85);
    }
  }

  if (raceState.isRunning && !raceState.isFinished) {
    raceState.elapsedTime += deltaTime;
  }

  const isNearLine = Math.abs(carGroup.position.z - startLineZ) <= startLineHalfWidth;

  if (!raceState.isLapArmed && Math.abs(carGroup.position.x) > 8) {
    raceState.isLapArmed = true;
  }

  const crossedLineInRaceDirection =
    raceState.previousX > startLineHalfDepth &&
    carGroup.position.x <= startLineHalfDepth &&
    isNearLine;

  if (raceState.isRunning && raceState.isLapArmed && crossedLineInRaceDirection) {
    if (raceState.currentLap >= totalLaps) {
      raceState.isFinished = true;
      raceState.isRunning = false;
      raceState.elapsedTime = Math.max(raceState.elapsedTime, 0);
    } else {
      raceState.currentLap += 1;
      raceState.isLapArmed = false;
      showAnnouncement(
        raceState.currentLap === totalLaps ? "Final lap!" : `Lap ${raceState.currentLap}`,
        `Lap ${raceState.currentLap} of ${totalLaps}`,
        1.2,
      );
    }
  }

  raceState.previousX = carGroup.position.x;
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

  if (lapDisplay) {
    lapDisplay.textContent = raceState.currentLap.toString();
  }

  if (raceTimeDisplay) {
    raceTimeDisplay.textContent = formatRaceTime(raceState.elapsedTime);
  }

  if (raceStatusDisplay) {
    if (raceState.isFinished) {
      raceStatusDisplay.textContent = "Finished! Press R to race again.";
    } else if (raceState.isCountdownActive) {
      raceStatusDisplay.textContent = "Countdown started";
    } else if (raceState.isRunning) {
      raceStatusDisplay.textContent = `Lap ${raceState.currentLap} of ${totalLaps}`;
    } else {
      raceStatusDisplay.textContent = "Accelerate to start the timer";
    }
  }

  if (finishBanner) {
    finishBanner.hidden = !raceState.isFinished;
  }

  if (finishTimeDisplay) {
    finishTimeDisplay.textContent = formatRaceTime(raceState.elapsedTime);
  }
}

function formatRaceTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const hundredths = Math.floor((totalSeconds % 1) * 100);
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${hundredths
    .toString()
    .padStart(2, "0")}`;
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
  updateRace(deltaTime);
  updateCamera(deltaTime);
  updateHud();
  updateAnnouncement(deltaTime);
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
