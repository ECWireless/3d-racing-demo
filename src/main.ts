import * as THREE from "three";
import "./style.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

app.innerHTML = `
  <canvas class="game-canvas" aria-label="3D racing demo viewport"></canvas>
  <main class="home-screen" data-home-screen>
    <section class="home-panel">
      <h1>3D Racing Demo</h1>
      <div class="home-actions">
        <button class="play-button" type="button" data-play-button>Solo Race</button>
        <button type="button" data-create-room-button>Create Room</button>
      </div>
      <form class="join-room-form" data-join-room-form>
        <input data-join-room-code maxlength="6" placeholder="Room code" aria-label="Room code" />
        <button type="submit">Join</button>
      </form>
      <p class="home-error" data-home-error hidden></p>
    </section>
    <button class="leaderboard-teaser" type="button" data-leaderboard-teaser>
      <span class="eyebrow">Leaderboard</span>
      <ol data-home-leaderboard-list></ol>
    </button>
  </main>
  <main class="leaderboard-page" data-leaderboard-page hidden>
    <section class="leaderboard-panel">
      <p class="eyebrow">Leaderboard</p>
      <h1>Best 3-lap times</h1>
      <ol data-full-leaderboard-list></ol>
      <div class="page-actions">
        <button type="button" data-leaderboard-back>Back</button>
        <button type="button" data-leaderboard-play>Solo Race</button>
      </div>
    </section>
  </main>
  <main class="lobby-page" data-lobby-page hidden>
    <section class="lobby-panel">
      <h1>Race lobby</h1>
      <div class="room-code-card" aria-label="Room code">
        <span class="eyebrow">Share this code</span>
        <div class="room-code-row">
          <strong data-room-code>------</strong>
          <button class="copy-room-code" type="button" data-copy-room-code aria-label="Copy room code">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <path d="M5 15V7a2 2 0 0 1 2-2h8"></path>
            </svg>
            <span data-copy-room-code-label>Copy</span>
          </button>
        </div>
      </div>
      <ul data-room-players></ul>
      <p class="lobby-status" data-lobby-status>Waiting for another racer...</p>
      <div class="page-actions">
        <button type="button" data-lobby-back>Back</button>
        <button type="button" data-ready-button>Ready</button>
        <button type="button" data-start-room-button>Start Race</button>
      </div>
    </section>
  </main>
  <aside class="hud" data-game-ui hidden>
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
    <p class="race-status" data-race-status>Get ready</p>
  </aside>
  <aside class="leaderboard" data-game-ui hidden>
    <p class="eyebrow">Leaderboard</p>
    <ol data-leaderboard-list></ol>
  </aside>
  <aside class="multiplayer-race-panel" data-game-ui data-multiplayer-race-panel hidden>
    <div class="multiplayer-race-heading">
      <p class="eyebrow">Room Race</p>
      <strong data-race-room-code>------</strong>
    </div>
    <div class="multiplayer-race-row">
      <span>You</span>
      <strong data-local-race-state>Lap 1 / 3</strong>
    </div>
    <div class="multiplayer-race-row">
      <span data-opponent-race-name>Opponent</span>
      <strong data-opponent-race-state>Waiting</strong>
    </div>
    <p class="multiplayer-race-status" data-multiplayer-race-status>Start synced</p>
  </aside>
  <button class="pause-toggle" type="button" data-game-ui data-pause-toggle hidden aria-label="Pause">
    Pause
  </button>
  <div class="mobile-controls" data-game-ui hidden>
    <div class="touch-stick" data-touch-stick>
      <div class="touch-stick-knob" data-touch-stick-knob></div>
    </div>
    <div class="touch-pedals">
      <button class="touch-pedal touch-pedal-accelerate" type="button" data-touch-accelerate>
        Accel
      </button>
      <button class="touch-pedal touch-pedal-brake" type="button" data-touch-brake>
        Brake
      </button>
    </div>
  </div>
  <div class="finish-banner" data-finish-banner hidden>
    <p class="eyebrow">Race complete</p>
    <strong>Finished!</strong>
    <span data-finish-time>0:00.00</span>
    <span class="finish-result" data-finish-result>Checking leaderboard...</span>
    <div class="finish-actions">
      <button type="button" data-retry-button>Retry</button>
      <button type="button" data-finish-leaderboard-button>Leaderboard</button>
    </div>
  </div>
  <form class="username-modal" data-username-form hidden>
    <p class="eyebrow">First finish</p>
    <label for="username">Pick a racer name</label>
    <div class="username-row">
      <input id="username" data-username-input maxlength="16" autocomplete="nickname" required />
      <button type="submit">Save</button>
    </div>
  </form>
  <div class="race-announcement" data-race-announcement hidden>
    <strong data-announcement-title>3</strong>
    <span data-announcement-subtitle>Get ready</span>
  </div>
  <div class="pause-menu" data-pause-menu hidden>
    <section class="pause-panel">
      <p class="eyebrow">Paused</p>
      <strong>Race menu</strong>
      <div class="pause-actions">
        <button type="button" data-resume-button>Resume</button>
        <button type="button" data-pause-retry-button>Retry</button>
        <button type="button" data-main-menu-button>Main Screen</button>
      </div>
    </section>
  </div>
`;

const canvas = document.querySelector<HTMLCanvasElement>(".game-canvas");
const speedDisplay = document.querySelector<HTMLSpanElement>("[data-speed]");
const driveStateDisplay = document.querySelector<HTMLElement>("[data-drive-state]");
const lapDisplay = document.querySelector<HTMLSpanElement>("[data-lap]");
const raceTimeDisplay = document.querySelector<HTMLElement>("[data-race-time]");
const raceStatusDisplay = document.querySelector<HTMLElement>("[data-race-status]");
const leaderboardList = document.querySelector<HTMLOListElement>("[data-leaderboard-list]");
const homeScreen = document.querySelector<HTMLElement>("[data-home-screen]");
const leaderboardPage = document.querySelector<HTMLElement>("[data-leaderboard-page]");
const lobbyPage = document.querySelector<HTMLElement>("[data-lobby-page]");
const homeLeaderboardList =
  document.querySelector<HTMLOListElement>("[data-home-leaderboard-list]");
const fullLeaderboardList =
  document.querySelector<HTMLOListElement>("[data-full-leaderboard-list]");
const playButton = document.querySelector<HTMLButtonElement>("[data-play-button]");
const leaderboardTeaser = document.querySelector<HTMLButtonElement>("[data-leaderboard-teaser]");
const createRoomButton = document.querySelector<HTMLButtonElement>("[data-create-room-button]");
const joinRoomForm = document.querySelector<HTMLFormElement>("[data-join-room-form]");
const joinRoomCodeInput = document.querySelector<HTMLInputElement>("[data-join-room-code]");
const homeError = document.querySelector<HTMLElement>("[data-home-error]");
const leaderboardBackButton =
  document.querySelector<HTMLButtonElement>("[data-leaderboard-back]");
const leaderboardPlayButton =
  document.querySelector<HTMLButtonElement>("[data-leaderboard-play]");
const gameUiElements = document.querySelectorAll<HTMLElement>("[data-game-ui]");
const multiplayerRacePanel = document.querySelector<HTMLElement>("[data-multiplayer-race-panel]");
const raceRoomCodeDisplay = document.querySelector<HTMLElement>("[data-race-room-code]");
const localRaceStateDisplay = document.querySelector<HTMLElement>("[data-local-race-state]");
const opponentRaceNameDisplay = document.querySelector<HTMLElement>("[data-opponent-race-name]");
const opponentRaceStateDisplay = document.querySelector<HTMLElement>("[data-opponent-race-state]");
const multiplayerRaceStatusDisplay =
  document.querySelector<HTMLElement>("[data-multiplayer-race-status]");
const pauseToggle = document.querySelector<HTMLButtonElement>("[data-pause-toggle]");
const pauseMenu = document.querySelector<HTMLElement>("[data-pause-menu]");
const resumeButton = document.querySelector<HTMLButtonElement>("[data-resume-button]");
const pauseRetryButton = document.querySelector<HTMLButtonElement>("[data-pause-retry-button]");
const mainMenuButton = document.querySelector<HTMLButtonElement>("[data-main-menu-button]");
const roomCodeDisplay = document.querySelector<HTMLElement>("[data-room-code]");
const copyRoomCodeButton = document.querySelector<HTMLButtonElement>("[data-copy-room-code]");
const copyRoomCodeLabel = document.querySelector<HTMLElement>("[data-copy-room-code-label]");
const roomPlayersList = document.querySelector<HTMLElement>("[data-room-players]");
const lobbyStatus = document.querySelector<HTMLElement>("[data-lobby-status]");
const lobbyBackButton = document.querySelector<HTMLButtonElement>("[data-lobby-back]");
const readyButton = document.querySelector<HTMLButtonElement>("[data-ready-button]");
const startRoomButton = document.querySelector<HTMLButtonElement>("[data-start-room-button]");
const touchStick = document.querySelector<HTMLElement>("[data-touch-stick]");
const touchStickKnob = document.querySelector<HTMLElement>("[data-touch-stick-knob]");
const touchAccelerate = document.querySelector<HTMLButtonElement>("[data-touch-accelerate]");
const touchBrake = document.querySelector<HTMLButtonElement>("[data-touch-brake]");
const finishBanner = document.querySelector<HTMLElement>("[data-finish-banner]");
const finishTimeDisplay = document.querySelector<HTMLElement>("[data-finish-time]");
const finishResultDisplay = document.querySelector<HTMLElement>("[data-finish-result]");
const retryButton = document.querySelector<HTMLButtonElement>("[data-retry-button]");
const finishLeaderboardButton =
  document.querySelector<HTMLButtonElement>("[data-finish-leaderboard-button]");
const usernameForm = document.querySelector<HTMLFormElement>("[data-username-form]");
const usernameInput = document.querySelector<HTMLInputElement>("[data-username-input]");
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
sunLight.shadow.camera.left = -75;
sunLight.shadow.camera.right = 75;
sunLight.shadow.camera.top = 75;
sunLight.shadow.camera.bottom = -75;
scene.add(sunLight);

const trackGroup = new THREE.Group();
scene.add(trackGroup);

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x2d6a4f,
  roughness: 0.9,
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 220), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
trackGroup.add(ground);

const roadMaterial = new THREE.MeshStandardMaterial({
  color: 0x24292f,
  roughness: 0.74,
});
const trackStraightHalfLength = 69;
const roadInnerRadius = 24;
const roadOuterRadius = 39;
const roadWidth = roadOuterRadius - roadInnerRadius;
const roadCenterRadius = (roadInnerRadius + roadOuterRadius) / 2;
const grassRunoff = 10;
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

const rampLength = 10;
const rampWidth = roadWidth * 0.72;
const rampSurfaceClearance = 0.06;
const rampCenter = new THREE.Vector3(0, rampSurfaceClearance, roadCenterRadius);
const rampGroup = new THREE.Group();
rampGroup.position.copy(rampCenter);
trackGroup.add(rampGroup);
const rampSurfaceThickness = 0.28;

const rampMaterial = new THREE.MeshStandardMaterial({
  color: 0x4b5563,
  roughness: 0.62,
});
const rampMesh = new THREE.Mesh(new THREE.BoxGeometry(rampLength, rampSurfaceThickness, rampWidth), rampMaterial);
rampMesh.position.x = rampLength / 2;
rampMesh.position.y = -rampSurfaceThickness / 2;
rampMesh.castShadow = true;
rampMesh.receiveShadow = true;
rampGroup.add(rampMesh);

const boosterMaterial = new THREE.MeshStandardMaterial({
  color: 0x00d4ff,
  emissive: 0x006b80,
  emissiveIntensity: 0.9,
  roughness: 0.25,
});
const boosterMesh = new THREE.Mesh(
  new THREE.BoxGeometry(rampLength * 0.62, 0.04, rampWidth * 0.62),
  boosterMaterial,
);
boosterMesh.position.set(rampLength * 0.56, 0.04, 0);
boosterMesh.castShadow = true;
rampGroup.add(boosterMesh);

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

function createRemoteKart() {
  const group = new THREE.Group();
  group.visible = false;

  const ghostBodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x4cc9f0,
    emissive: 0x12384a,
    emissiveIntensity: 0.28,
    metalness: 0.08,
    opacity: 0.58,
    roughness: 0.42,
    transparent: true,
  });
  const ghostCabinMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0x223344,
    emissiveIntensity: 0.16,
    opacity: 0.52,
    roughness: 0.2,
    transparent: true,
  });
  const ghostWheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    opacity: 0.46,
    roughness: 0.72,
    transparent: true,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 3), ghostBodyMaterial);
  group.add(body);

  const ghostCabin = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 1.05), ghostCabinMaterial);
  ghostCabin.position.set(0, 0.48, -0.25);
  group.add(ghostCabin);

  for (const [x, y, z] of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeometry, ghostWheelMaterial);
    wheel.position.set(x, y, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
  }

  scene.add(group);
  return group;
}

const remoteKartGroup = createRemoteKart();
const remoteKartTarget = {
  position: new THREE.Vector3(),
  heading: Math.PI / 2,
  pitch: 0,
  updatedAt: 0,
};
type RemoteKartSnapshot = {
  position: THREE.Vector3;
  heading: number;
  pitch: number;
  speed: number;
  updatedAt: number;
};
const remoteKartSnapshots: RemoteKartSnapshot[] = [];
const remoteYawQuaternion = new THREE.Quaternion();
const remotePitchQuaternion = new THREE.Quaternion();

const clock = new THREE.Clock();
const keys = new Set<string>();
const touchInput = {
  throttle: false,
  stickThrottle: 0,
  brake: false,
  steering: 0,
  stickPointerId: null as number | null,
};
const carState = {
  speed: 0,
  heading: Math.PI / 2,
  throttleRamp: 0,
  verticalPosition: 0,
  verticalVelocity: 0,
  pitch: 0,
  isAirborne: false,
};
const raceState = {
  currentLap: 1,
  elapsedTime: 0,
  isRunning: false,
  isFinished: false,
  isResultSaved: false,
  resultMessage: "Checking leaderboard...",
  isRampLaunchArmed: true,
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
const yawQuaternion = new THREE.Quaternion();
const pitchQuaternion = new THREE.Quaternion();
const worldUp = new THREE.Vector3(0, 1, 0);
const localRight = new THREE.Vector3(1, 0, 0);

const acceleration = 18;
const brakePower = 28;
const drag = 2.4;
const baseForwardSpeed = 26;
const maxForwardSpeed = 42;
const maxReverseSpeed = -9;
const steeringPower = 1.55;
const totalLaps = 3;
const barrierInset = 0.65;
const grassDrag = 8.5;
const grassMaxSpeed = 19;
const handbrakePower = 18;
const handbrakeSteeringBoost = 2.35;
const handbrakePivotAssist = 0.32;
const barrierGlanceRetention = 0.985;
const barrierDirectHitRetention = 0.87;
const finishCoastDrag = 18;
const countdownDuration = 3;
const throttleRampBuildRate = 0.1;
const throttleRampDecayRate = 0.5;
const overdriveAcceleration = 5;
const rampCycleDuration = 8;
const rampRaisedDuration = 3.2;
const rampTransitionDuration = 0.9;
const rampRaisedAngle = Math.PI / 4;
const rampBoostAcceleration = 34;
const rampBoostMaxSpeed = 50;
const rampLaunchVelocity = 14;
const gravity = 28;
const carBaseHeight = 0.48;
const wheelGroundOffset = 0.5;
const wheelContactZ = 0.95;
const rampLandingPitchRate = 7;
const rampForward = new THREE.Vector3(1, 0, 0);
const playerIdKey = "racingDemo.playerId";
const playerNameKey = "racingDemo.playerName";
const leaderboardKey = "racingDemo.leaderboard";

type LeaderboardEntry = {
  id: string;
  playerId: string;
  username: string;
  time: number;
  completedAt: string;
};

type ApiLeaderboardRow = {
  player_id: string;
  username: string;
  total_time_ms: number;
  created_at: string;
};

type RoomPlayer = {
  player_id: string;
  username: string;
  slot: number;
  is_ready: boolean;
  position_x: number | null;
  position_y: number | null;
  position_z: number | null;
  heading: number | null;
  pitch: number | null;
  speed: number | null;
  current_lap: number;
  state_updated_at: string | null;
};

type RoomResult = {
  player_id: string;
  username: string;
  slot: number;
  total_time_ms: number;
  finished_at: string;
};

type RaceRoom = {
  id: string;
  code: string;
  status: "waiting" | "racing" | "finished";
  host_player_id: string;
  started_at: string | null;
  finished_at: string | null;
  players: RoomPlayer[];
  results: RoomResult[];
};

const playerState = {
  id: getOrCreatePlayerId(),
  username: readStorage(playerNameKey),
  pendingTime: null as number | null,
};
let leaderboardEntries: LeaderboardEntry[] = [];
let leaderboardError: string | null = null;
let currentView: "home" | "game" | "leaderboard" | "lobby" = "home";
let activeRoom: RaceRoom | null = null;
let lobbyPollTimer: number | null = null;
let isPauseMenuOpen = false;
const multiplayerSyncState = {
  lastPullAt: 0,
  lastPushAt: 0,
  isPulling: false,
  isPushing: false,
};
const multiplayerPushInterval = 0.1;
const multiplayerPullInterval = 0.18;
const remoteInterpolationDelayMs = 150;
const remoteSnapshotMaxAgeMs = 3500;
const remoteMaxExtrapolationMs = 220;
let isRampRaised = false;

function isPressed(...codes: string[]) {
  return codes.some((code) => keys.has(code));
}

function getThrottleInput() {
  return touchInput.throttle || touchInput.stickThrottle > 0.2 || isPressed("KeyW", "ArrowUp");
}

function getBrakeInput() {
  return touchInput.brake || isPressed("KeyS", "ArrowDown");
}

function getSteeringInput() {
  const keyboardSteering = Number(isPressed("KeyA", "ArrowLeft")) - Number(isPressed("KeyD", "ArrowRight"));
  return THREE.MathUtils.clamp(keyboardSteering + touchInput.steering, -1, 1);
}

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Local-only demo identity is best effort.
  }
}

function getOrCreatePlayerId() {
  const existingId = readStorage(playerIdKey);

  if (existingId) {
    return existingId;
  }

  const id = crypto.randomUUID();
  writeStorage(playerIdKey, id);
  return id;
}

function getLeaderboard() {
  const rawLeaderboard = readStorage(leaderboardKey);

  if (!rawLeaderboard) {
    return [] as LeaderboardEntry[];
  }

  try {
    const parsed = JSON.parse(rawLeaderboard);
    return Array.isArray(parsed) ? (parsed as LeaderboardEntry[]) : [];
  } catch {
    return [];
  }
}

function setLeaderboard(entries: LeaderboardEntry[]) {
  writeStorage(leaderboardKey, JSON.stringify(entries.slice(0, 10)));
}

function qualifiesForLeaderboard(time: number, entries = leaderboardEntries) {
  if (leaderboardError) {
    return true;
  }

  if (entries.length < 10) {
    return true;
  }

  return time < Math.max(...entries.slice(0, 10).map((entry) => entry.time));
}

async function loadRemoteLeaderboard() {
  try {
    const response = await fetch("/api/leaderboard");

    if (!response.ok) {
      throw new Error(`Leaderboard API returned ${response.status}`);
    }

    const body = (await response.json()) as { entries?: ApiLeaderboardRow[] };
    leaderboardError = null;
    leaderboardEntries = (body.entries ?? []).map((entry) => ({
      id: `${entry.player_id}-${entry.created_at}`,
      playerId: entry.player_id,
      username: entry.username,
      time: entry.total_time_ms / 1000,
      completedAt: entry.created_at,
    }));
    renderLeaderboard();
  } catch (error) {
    leaderboardError = error instanceof Error ? error.message : "Leaderboard API unavailable";
    leaderboardEntries = [];
    renderLeaderboard();
  }
}

async function saveRaceResult(time: number) {
  if (!qualifiesForLeaderboard(time)) {
    raceState.resultMessage = "No leaderboard time. Try again?";
    return;
  }

  const username = playerState.username?.trim();

  if (!username) {
    playerState.pendingTime = time;
    raceState.resultMessage = "Enter a racer name to submit your time.";
    showUsernamePrompt();
    return;
  }

  try {
    const response = await fetch("/api/results", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerId: playerState.id,
        username,
        totalLaps,
        totalTimeMs: Math.round(time * 1000),
      }),
    });

    if (!response.ok) {
      throw new Error(`Results API returned ${response.status}`);
    }

    const body = (await response.json()) as { saved?: boolean; placement?: number };

    if (body.saved === false) {
      raceState.resultMessage = "No leaderboard time. Try again?";
      await loadRemoteLeaderboard();
      return;
    }

    raceState.resultMessage =
      body.placement && body.placement > 0
        ? `Leaderboard place #${body.placement}. Retry?`
        : "Leaderboard time saved. Retry?";
    await loadRemoteLeaderboard();
  } catch (error) {
    leaderboardError = error instanceof Error ? error.message : "Could not save leaderboard time";
    raceState.resultMessage = "Could not save leaderboard time. Retry?";
    renderLeaderboard();
  }
}

function updateMultiplayerResultMessage() {
  if (!activeRoom || !raceState.isFinished) {
    return;
  }

  const sortedResults = [...activeRoom.results].sort(
    (a, b) => a.total_time_ms - b.total_time_ms,
  );
  const ownResultIndex = sortedResults.findIndex((result) => result.player_id === playerState.id);

  if (ownResultIndex === -1) {
    raceState.resultMessage = "Finished. Saving room result...";
    return;
  }

  if (activeRoom.status !== "finished" && sortedResults.length < activeRoom.players.length) {
    raceState.resultMessage = "Finished. Waiting for the other racer...";
    return;
  }

  raceState.resultMessage =
    ownResultIndex === 0
      ? "You won the room race. Retry?"
      : `Room place #${ownResultIndex + 1}. Retry?`;
}

async function saveMultiplayerRaceResult(time: number) {
  if (!activeRoom) {
    await saveRaceResult(time);
    return;
  }

  raceState.resultMessage = "Saving room result...";

  try {
    const room = await roomRequest({
      action: "finish",
      code: activeRoom.code,
      playerId: playerState.id,
      totalTimeMs: Math.round(time * 1000),
    });
    activeRoom = room;
    updateMultiplayerResultMessage();
  } catch {
    raceState.resultMessage = "Could not save room result. Retry?";
  }
}

function saveFinishedRace(time: number) {
  if (activeRoom?.status === "racing") {
    void saveMultiplayerRaceResult(time);
    return;
  }

  void saveRaceResult(time);
}

function renderLeaderboard() {
  const entries = leaderboardEntries.slice(0, 5);
  const compactHtml =
    leaderboardError
      ? `<li class="empty">${escapeHtml(leaderboardError)}</li>`
      : entries.length > 0
      ? entries
          .map((entry, index) => renderLeaderboardRow(entry, index))
          .join("")
      : `<li class="empty">Finish a race to set the first time.</li>`;

  if (leaderboardList) {
    leaderboardList.innerHTML = compactHtml;
  }

  if (homeLeaderboardList) {
    homeLeaderboardList.innerHTML = compactHtml;
  }

  if (fullLeaderboardList) {
    const fullEntries = leaderboardEntries.slice(0, 10);
    fullLeaderboardList.innerHTML =
      leaderboardError
        ? `<li class="empty">${escapeHtml(leaderboardError)}</li>`
        : fullEntries.length > 0
        ? fullEntries
            .map((entry, index) => renderLeaderboardRow(entry, index))
            .join("")
        : `<li class="empty">Finish a race to set the first time.</li>`;
  }
}

function renderLeaderboardRow(entry: LeaderboardEntry, index: number) {
  const rank = index + 1;
  const rankClass = rank <= 3 ? ` rank-${rank}` : "";
  const medal = rank === 1 ? "1st" : rank === 2 ? "2nd" : rank === 3 ? "3rd" : `${rank}.`;

  return `<li class="leaderboard-row${rankClass}">
    <span class="rank-medal">${medal}</span>
    <span>${escapeHtml(entry.username)}</span>
    <strong>${formatRaceTime(entry.time)}</strong>
  </li>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function showUsernamePrompt() {
  if (!usernameForm || !usernameInput) {
    return;
  }

  usernameForm.hidden = false;
  usernameInput.value = playerState.username ?? "";
  keys.clear();
  usernameInput.focus();
}

function getPlayerName() {
  const username = playerState.username?.trim();

  if (username) {
    return username;
  }

  const generatedName = `Racer-${playerState.id.slice(0, 4)}`;
  playerState.username = generatedName;
  writeStorage(playerNameKey, generatedName);
  return generatedName;
}

function showHomeError(message: string) {
  if (!homeError) {
    return;
  }

  homeError.hidden = false;
  homeError.textContent = message;
}

function clearHomeError() {
  if (!homeError) {
    return;
  }

  homeError.hidden = true;
  homeError.textContent = "";
}

function closePauseMenu() {
  isPauseMenuOpen = false;

  if (pauseMenu) {
    pauseMenu.hidden = true;
  }
}

function openPauseMenu() {
  if (currentView !== "game") {
    return;
  }

  isPauseMenuOpen = true;
  keys.clear();
  touchInput.throttle = false;
  touchInput.stickThrottle = 0;
  touchInput.brake = false;
  resetTouchStick();

  if (pauseMenu) {
    pauseMenu.hidden = false;
  }
}

function togglePauseMenu() {
  if (isPauseMenuOpen) {
    closePauseMenu();
  } else {
    openPauseMenu();
  }
}

function returnToMainScreen() {
  activeRoom = null;
  remoteKartGroup.visible = false;
  remoteKartSnapshots.length = 0;
  closePauseMenu();
  setView("home");
}

function setView(view: typeof currentView) {
  currentView = view;

  if (homeScreen) {
    homeScreen.hidden = view !== "home";
  }

  if (leaderboardPage) {
    leaderboardPage.hidden = view !== "leaderboard";
  }

  if (lobbyPage) {
    lobbyPage.hidden = view !== "lobby";
  }

  for (const element of gameUiElements) {
    element.hidden = view !== "game";
  }

  if (view !== "game") {
    closePauseMenu();
    keys.clear();
    touchInput.throttle = false;
    touchInput.stickThrottle = 0;
    touchInput.brake = false;
    resetTouchStick();

    if (finishBanner) {
      finishBanner.hidden = true;
    }

    if (usernameForm) {
      usernameForm.hidden = true;
    }

    if (raceAnnouncement) {
      raceAnnouncement.hidden = true;
      raceAnnouncement.classList.remove("is-animating");
    }
  }
}

function startGame() {
  stopLobbyPolling();
  closePauseMenu();
  remoteKartGroup.visible = false;
  remoteKartSnapshots.length = 0;
  multiplayerSyncState.lastPullAt = 0;
  multiplayerSyncState.lastPushAt = 0;
  resetCar();
  setView("game");
  startCountdown(getRaceStartDelay());
}

function startSoloGame() {
  activeRoom = null;
  startGame();
}

async function roomRequest(body: Record<string, unknown>) {
  const response = await fetch("/api/rooms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as { room?: RaceRoom; error?: string };

  if (!response.ok || !payload.room) {
    throw new Error(payload.error ?? `Room API returned ${response.status}`);
  }

  activeRoom = payload.room;
  renderLobby();
  updateMultiplayerResultMessage();
  return payload.room;
}

async function fetchActiveRoom() {
  if (!activeRoom) {
    return null;
  }

  const response = await fetch(`/api/rooms?code=${encodeURIComponent(activeRoom.code)}`);
  const payload = (await response.json()) as { room?: RaceRoom; error?: string };

  if (!response.ok || !payload.room) {
    throw new Error(payload.error ?? `Room API returned ${response.status}`);
  }

  activeRoom = payload.room;
  renderLobby();
  updateMultiplayerResultMessage();

  if (activeRoom.status === "racing" && currentView !== "game") {
    startGame();
  }

  return activeRoom;
}

function hasActiveMultiplayerRace() {
  return currentView === "game" && activeRoom?.status === "racing";
}

function getRaceStartDelay() {
  if (activeRoom?.status === "racing" && activeRoom.started_at) {
    const startTime = Date.parse(activeRoom.started_at);

    if (Number.isFinite(startTime)) {
      return Math.max((startTime - Date.now()) / 1000, 0.05);
    }
  }

  return countdownDuration;
}

function getStartLaneOffset() {
  if (!activeRoom) {
    return 0;
  }

  const localPlayer = activeRoom.players.find((player) => player.player_id === playerState.id);

  if (!localPlayer) {
    return 0;
  }

  const laneSpacing = Math.min(roadWidth * 0.28, 4.2);
  return localPlayer.slot === 1 ? -laneSpacing / 2 : laneSpacing / 2;
}

async function pushMultiplayerState() {
  if (!activeRoom || multiplayerSyncState.isPushing) {
    return;
  }

  multiplayerSyncState.isPushing = true;

  try {
    const room = await roomRequest({
      action: "state",
      code: activeRoom.code,
      playerId: playerState.id,
      positionX: carGroup.position.x,
      positionY: carGroup.position.y,
      positionZ: carGroup.position.z,
      heading: carState.heading,
      pitch: carState.pitch,
      speed: carState.speed,
      currentLap: raceState.currentLap,
    });

    activeRoom = room;
  } finally {
    multiplayerSyncState.isPushing = false;
  }
}

async function pullMultiplayerState() {
  if (!activeRoom || multiplayerSyncState.isPulling) {
    return;
  }

  multiplayerSyncState.isPulling = true;

  try {
    await fetchActiveRoom();
  } finally {
    multiplayerSyncState.isPulling = false;
  }
}

function syncMultiplayerRoom(elapsedTime: number) {
  if (!hasActiveMultiplayerRace()) {
    remoteKartGroup.visible = false;
    return;
  }

  if (elapsedTime - multiplayerSyncState.lastPushAt > multiplayerPushInterval) {
    multiplayerSyncState.lastPushAt = elapsedTime;
    void pushMultiplayerState().catch(() => {
      multiplayerSyncState.isPushing = false;
    });
  }

  if (elapsedTime - multiplayerSyncState.lastPullAt > multiplayerPullInterval) {
    multiplayerSyncState.lastPullAt = elapsedTime;
    void pullMultiplayerState().catch(() => {
      multiplayerSyncState.isPulling = false;
    });
  }
}

function startLobbyPolling() {
  stopLobbyPolling();
  lobbyPollTimer = window.setInterval(() => {
    void fetchActiveRoom().catch((error) => {
      if (lobbyStatus) {
        lobbyStatus.textContent = error instanceof Error ? error.message : "Could not refresh room";
      }
    });
  }, 1200);
}

function stopLobbyPolling() {
  if (lobbyPollTimer !== null) {
    window.clearInterval(lobbyPollTimer);
    lobbyPollTimer = null;
  }
}

function renderLobby() {
  if (!activeRoom) {
    return;
  }

  const isHost = activeRoom.host_player_id === playerState.id;
  const currentPlayer = activeRoom.players.find((player) => player.player_id === playerState.id);

  if (roomCodeDisplay) {
    roomCodeDisplay.textContent = activeRoom.code;
  }

  if (copyRoomCodeLabel && copyRoomCodeLabel.textContent !== "Copied") {
    copyRoomCodeLabel.textContent = "Copy";
  }

  if (roomPlayersList) {
    roomPlayersList.innerHTML = activeRoom.players
      .map(
        (player) =>
          `<li>
            <span>Slot ${player.slot}: ${escapeHtml(player.username)}</span>
            <strong>${player.is_ready ? "Ready" : "Waiting"}</strong>
          </li>`,
      )
      .join("");
  }

  if (lobbyStatus) {
    lobbyStatus.textContent =
      activeRoom.players.length < 2
        ? "Share the room code with a friend."
        : isHost
          ? "Start when both players are ready."
          : "Waiting for the host to start.";
  }

  if (readyButton) {
    readyButton.textContent = currentPlayer?.is_ready ? "Unready" : "Ready";
  }

  if (startRoomButton) {
    startRoomButton.hidden = !isHost;
    startRoomButton.disabled =
      activeRoom.players.length < 2 || activeRoom.players.some((player) => !player.is_ready);
  }
}

async function copyActiveRoomCode() {
  if (!activeRoom) {
    return;
  }

  const roomCode = activeRoom.code;
  const copyWithHiddenField = () => {
    const field = document.createElement("textarea");
    field.value = roomCode;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.append(field);
    field.select();
    document.execCommand("copy");
    field.remove();
  };

  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch {
      copyWithHiddenField();
    }
  } else {
    copyWithHiddenField();
  }

  if (copyRoomCodeLabel) {
    const label = copyRoomCodeLabel;
    label.textContent = "Copied";
    window.setTimeout(() => {
      if (label.textContent === "Copied") {
        label.textContent = "Copy";
      }
    }, 1400);
  }
}

async function enterLobby(room: RaceRoom) {
  activeRoom = room;
  renderLobby();
  setView("lobby");
  startLobbyPolling();
}

function resetTouchStick() {
  touchInput.steering = 0;
  touchInput.stickThrottle = 0;
  touchInput.stickPointerId = null;

  if (touchStickKnob) {
    touchStickKnob.style.transform = "translate(-50%, -50%)";
  }
}

function updateTouchStick(pointerX: number, pointerY: number) {
  if (!touchStick || !touchStickKnob) {
    return;
  }

  const bounds = touchStick.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const centerY = bounds.top + bounds.height / 2;
  const maxOffset = bounds.width * 0.34;
  const offsetX = THREE.MathUtils.clamp(pointerX - centerX, -maxOffset, maxOffset);
  const offsetY = THREE.MathUtils.clamp(pointerY - centerY, -maxOffset, maxOffset);

  touchInput.steering = THREE.MathUtils.clamp(-offsetX / maxOffset, -1, 1);
  touchInput.stickThrottle = THREE.MathUtils.clamp(-offsetY / maxOffset, 0, 1);
  touchStickKnob.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
}

function bindTouchButton(button: HTMLButtonElement | null, key: "throttle" | "brake") {
  if (!button) {
    return;
  }

  const setPressed = (pressed: boolean) => {
    touchInput[key] = pressed;
    button.classList.toggle("is-pressed", pressed);
  };

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setPressed(true);
  });

  button.addEventListener("pointerup", () => setPressed(false));
  button.addEventListener("pointercancel", () => setPressed(false));
  button.addEventListener("lostpointercapture", () => setPressed(false));
}

function isTypingIntoForm(event: KeyboardEvent) {
  const target = event.target;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
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

function startCountdown(duration = countdownDuration) {
  raceState.isCountdownActive = true;
  raceState.countdownRemaining = duration;
  raceState.countdownLabel = Math.max(Math.ceil(duration), 1).toString();
  showAnnouncement(raceState.countdownLabel, "Get ready", 1);
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

  const pushingOutward = distance > clampedDistance;
  const wallNormalX = pushingOutward ? normalX : -normalX;
  const wallNormalZ = pushingOutward ? normalZ : -normalZ;
  const forwardIntoWall = Math.max(0, forward.x * wallNormalX + forward.z * wallNormalZ);
  const retention = THREE.MathUtils.lerp(
    barrierGlanceRetention,
    barrierDirectHitRetention,
    forwardIntoWall,
  );

  carState.speed *= retention;
}

function updateRamp(elapsedTime: number) {
  const cycleTime = elapsedTime % rampCycleDuration;
  const raisingEnd = rampTransitionDuration;
  const raisedEnd = raisingEnd + rampRaisedDuration;
  const loweringEnd = raisedEnd + rampTransitionDuration;

  let raisedAmount = 0;

  if (cycleTime < raisingEnd) {
    raisedAmount = cycleTime / rampTransitionDuration;
  } else if (cycleTime < raisedEnd) {
    raisedAmount = 1;
  } else if (cycleTime < loweringEnd) {
    raisedAmount = 1 - (cycleTime - raisedEnd) / rampTransitionDuration;
  }

  raisedAmount = THREE.MathUtils.smoothstep(raisedAmount, 0, 1);
  isRampRaised = raisedAmount > 0.92;
  rampGroup.rotation.z = rampRaisedAngle * raisedAmount;
  boosterMaterial.emissiveIntensity = isRampRaised ? 1.3 : 0.05;
  boosterMaterial.opacity = isRampRaised ? 1 : 0.45;
  boosterMaterial.transparent = true;
}

function getRampSurfaceAt(position: THREE.Vector3) {
  const rampAngle = rampGroup.rotation.z;
  const localX = (position.x - rampCenter.x) / Math.max(Math.cos(rampAngle), 0.001);
  const localZ = position.z - rampCenter.z;
  const isOverRamp =
    localX >= 0 &&
    localX <= rampLength &&
    Math.abs(localZ) <= rampWidth / 2;

  if (!isOverRamp) {
    return {
      height: 0,
      pitch: 0,
      localX,
      isOnRamp: false,
    };
  }

  return {
    height: rampCenter.y + localX * Math.sin(rampAngle),
    pitch: rampAngle,
    localX,
    isOnRamp: true,
  };
}

function getWheelWorldPoint(localZ: number) {
  const sideOffset = Math.sin(carState.heading) * localZ;
  const forwardOffset = Math.cos(carState.heading) * localZ;
  return new THREE.Vector3(carGroup.position.x + sideOffset, 0, carGroup.position.z + forwardOffset);
}

function getSupportedCarHeight(surfacePitch: number) {
  const frontWheelPoint = getWheelWorldPoint(-wheelContactZ);
  const rearWheelPoint = getWheelWorldPoint(wheelContactZ);
  const frontSurface = getRampSurfaceAt(frontWheelPoint);
  const rearSurface = getRampSurfaceAt(rearWheelPoint);
  const frontWheelLocalY = -wheelGroundOffset * Math.cos(surfacePitch) + wheelContactZ * Math.sin(surfacePitch);
  const rearWheelLocalY = -wheelGroundOffset * Math.cos(surfacePitch) - wheelContactZ * Math.sin(surfacePitch);

  return Math.max(
    frontSurface.height - frontWheelLocalY,
    rearSurface.height - rearWheelLocalY,
    carBaseHeight,
  );
}

function applyRampBoost(deltaTime: number) {
  if (!isRampRaised || raceState.isFinished || raceState.isCountdownActive || !raceState.isRunning) {
    return;
  }

  const localPosition = rampGroup.worldToLocal(carGroup.position.clone());
  const isInsideBoostZone =
    localPosition.x >= -1 &&
    localPosition.x <= rampLength + 1 &&
    Math.abs(localPosition.z) <= rampWidth * 0.48;

  if (!isInsideBoostZone || carState.speed <= 0) {
    if (Math.abs(localPosition.x) > rampLength + 5) {
      raceState.isRampLaunchArmed = true;
    }
    return;
  }

  carState.throttleRamp = Math.max(carState.throttleRamp, 0.85);
  carState.speed = Math.min(carState.speed + rampBoostAcceleration * deltaTime, rampBoostMaxSpeed);
}

function updateSurfaceContact(deltaTime: number) {
  const surface = getRampSurfaceAt(carGroup.position);
  const isMovingWithRamp = forward.dot(rampForward) > 0.35;

  if (
    surface.isOnRamp &&
    isRampRaised &&
    isMovingWithRamp &&
    raceState.isRampLaunchArmed &&
    surface.localX > rampLength * 0.78 &&
    carState.speed > 8
  ) {
    carState.isAirborne = true;
    carState.verticalPosition = Math.max(carState.verticalPosition, 0.08);
    carState.verticalVelocity =
      rampLaunchVelocity + Math.max(0, carState.speed - baseForwardSpeed) * 0.16;
    raceState.isRampLaunchArmed = false;
  }

  if (carState.isAirborne) {
    carState.verticalVelocity -= gravity * deltaTime;
    carState.verticalPosition += carState.verticalVelocity * deltaTime;

    if (carState.verticalPosition <= 0) {
      carState.verticalPosition = 0;
      carState.verticalVelocity = 0;
      carState.isAirborne = false;
    }
  } else {
    carState.verticalPosition = 0;
  }

  if (!surface.isOnRamp && Math.abs(surface.localX) > rampLength + 5) {
    raceState.isRampLaunchArmed = true;
  }

  const rampAlignment = THREE.MathUtils.clamp(forward.dot(rampForward), -1, 1);
  const targetPitch = !carState.isAirborne && surface.isOnRamp ? surface.pitch * rampAlignment : 0;
  carState.pitch = THREE.MathUtils.lerp(
    carState.pitch,
    targetPitch,
    1 - Math.exp(-deltaTime * rampLandingPitchRate),
  );
  const supportedHeight = getSupportedCarHeight(carState.pitch);
  carGroup.position.y = supportedHeight + carState.verticalPosition;
}

function resetCar() {
  carState.speed = 0;
  carState.heading = Math.PI / 2;
  carState.throttleRamp = 0;
  carState.verticalPosition = 0;
  carState.verticalVelocity = 0;
  carState.pitch = 0;
  carState.isAirborne = false;
  carGroup.position.set(0, 0.48, startLineZ + getStartLaneOffset());
  updateCarOrientation();

  raceState.currentLap = 1;
  raceState.elapsedTime = 0;
  raceState.isRunning = false;
  raceState.isFinished = false;
  raceState.isResultSaved = false;
  raceState.resultMessage = "Checking leaderboard...";
  raceState.isRampLaunchArmed = true;
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

  if (usernameForm) {
    usernameForm.hidden = true;
  }

  playerState.pendingTime = null;
}

function updateCarOrientation() {
  yawQuaternion.setFromAxisAngle(worldUp, carState.heading);
  pitchQuaternion.setFromAxisAngle(localRight, carState.pitch);
  carGroup.quaternion.copy(yawQuaternion).multiply(pitchQuaternion);
}

function getShortestAngleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function interpolateAngle(from: number, to: number, amount: number) {
  return from + getShortestAngleDelta(from, to) * amount;
}

function pushRemoteKartSnapshot(remotePlayer: RoomPlayer) {
  if (
    remotePlayer.position_x === null ||
    remotePlayer.position_y === null ||
    remotePlayer.position_z === null ||
    remotePlayer.heading === null ||
    remotePlayer.pitch === null ||
    remotePlayer.speed === null ||
    !remotePlayer.state_updated_at
  ) {
    return;
  }

  const updatedAt = Date.parse(remotePlayer.state_updated_at);

  if (!Number.isFinite(updatedAt)) {
    return;
  }

  const lastSnapshot = remoteKartSnapshots[remoteKartSnapshots.length - 1];

  if (lastSnapshot && lastSnapshot.updatedAt >= updatedAt) {
    return;
  }

  remoteKartSnapshots.push({
    position: new THREE.Vector3(
      Number(remotePlayer.position_x),
      Number(remotePlayer.position_y),
      Number(remotePlayer.position_z),
    ),
    heading: Number(remotePlayer.heading),
    pitch: Number(remotePlayer.pitch),
    speed: Number(remotePlayer.speed),
    updatedAt,
  });

  while (remoteKartSnapshots.length > 8) {
    remoteKartSnapshots.shift();
  }
}

function sampleRemoteKartSnapshot() {
  const now = Date.now();
  const newestSnapshot = remoteKartSnapshots[remoteKartSnapshots.length - 1];

  if (!newestSnapshot || now - newestSnapshot.updatedAt > remoteSnapshotMaxAgeMs) {
    return null;
  }

  const renderTime = now - remoteInterpolationDelayMs;

  while (remoteKartSnapshots.length > 2 && remoteKartSnapshots[1].updatedAt <= renderTime) {
    remoteKartSnapshots.shift();
  }

  const previous = remoteKartSnapshots[0];
  const next = remoteKartSnapshots[1];

  if (!previous) {
    return null;
  }

  if (!next) {
    const extrapolationTime = Math.min(now - previous.updatedAt, remoteMaxExtrapolationMs) / 1000;
    remoteKartTarget.position.copy(previous.position);
    remoteKartTarget.position.x += -Math.sin(previous.heading) * previous.speed * extrapolationTime;
    remoteKartTarget.position.z += -Math.cos(previous.heading) * previous.speed * extrapolationTime;
    remoteKartTarget.heading = previous.heading;
    remoteKartTarget.pitch = previous.pitch;
    remoteKartTarget.updatedAt = previous.updatedAt;
    return remoteKartTarget;
  }

  const span = Math.max(next.updatedAt - previous.updatedAt, 1);
  const amount = THREE.MathUtils.clamp((renderTime - previous.updatedAt) / span, 0, 1);

  remoteKartTarget.position.copy(previous.position).lerp(next.position, amount);
  remoteKartTarget.heading = interpolateAngle(previous.heading, next.heading, amount);
  remoteKartTarget.pitch = THREE.MathUtils.lerp(previous.pitch, next.pitch, amount);
  remoteKartTarget.updatedAt = next.updatedAt;
  return remoteKartTarget;
}

function updateRemoteKart(deltaTime: number) {
  const remotePlayer = activeRoom?.players.find((player) => player.player_id !== playerState.id);

  if (!hasActiveMultiplayerRace() || !remotePlayer) {
    remoteKartGroup.visible = false;
    remoteKartSnapshots.length = 0;
    return;
  }

  pushRemoteKartSnapshot(remotePlayer);
  const snapshot = sampleRemoteKartSnapshot();

  if (!snapshot) {
    remoteKartGroup.visible = false;
    return;
  }

  remoteKartGroup.visible = true;
  const follow = 1 - Math.exp(-deltaTime * 14);
  remoteKartGroup.position.lerp(snapshot.position, follow);

  remoteYawQuaternion.setFromAxisAngle(worldUp, snapshot.heading);
  remotePitchQuaternion.setFromAxisAngle(localRight, snapshot.pitch);
  remoteKartGroup.quaternion.slerp(
    remoteYawQuaternion.multiply(remotePitchQuaternion),
    follow,
  );
}

function updateCar(deltaTime: number) {
  const throttle = getThrottleInput();
  const brake = getBrakeInput();
  const handbrake = isPressed("ShiftLeft", "ShiftRight");
  const steerInput = getSteeringInput();
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

    const baseSpeedFactor = Math.min(Math.abs(carState.speed) / maxForwardSpeed, 1);
    const speedFactor =
      handbrake && Math.abs(carState.speed) > 2
        ? Math.max(baseSpeedFactor, handbrakePivotAssist)
        : baseSpeedFactor;
    const reverseSteering = carState.speed < 0 ? -1 : 1;
    const steeringMultiplier = handbrake ? handbrakeSteeringBoost : 1;
    carState.heading +=
      steerInput * steeringPower * steeringMultiplier * speedFactor * reverseSteering * deltaTime;
  } else {
    carState.speed = 0;
  }

  applyRampBoost(deltaTime);
  forward.set(-Math.sin(carState.heading), 0, -Math.cos(carState.heading));
  carGroup.position.addScaledVector(forward, carState.speed * deltaTime);
  clampCarToRoad();
  updateSurfaceContact(deltaTime);
  updateCarOrientation();

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
      raceState.isResultSaved = true;
      raceState.resultMessage = activeRoom ? "Saving room result..." : "Checking leaderboard...";
      saveFinishedRace(raceState.elapsedTime);
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
  desiredCameraPosition.copy(cameraTarget).addScaledVector(forward, -12);
  desiredCameraPosition.y += 7.4;

  const followLerp = 1 - Math.exp(-deltaTime * 5);
  camera.position.lerp(desiredCameraPosition, followLerp);

  cameraLookAt.copy(cameraTarget).addScaledVector(forward, 3.2);
  cameraLookAt.y += 1.4;
  camera.lookAt(cameraLookAt);
}

function getRoomResultFor(playerId: string) {
  return activeRoom?.results.find((result) => result.player_id === playerId) ?? null;
}

function getRaceStateLabel(player: RoomPlayer | null, isLocalPlayer: boolean) {
  if (!activeRoom || !player) {
    return "Waiting";
  }

  const result = getRoomResultFor(player.player_id);

  if (result) {
    return `Finished ${formatRaceTime(result.total_time_ms / 1000)}`;
  }

  if (isLocalPlayer) {
    if (raceState.isCountdownActive) {
      return `Starts in ${Math.ceil(raceState.countdownRemaining)}`;
    }

    if (raceState.isFinished) {
      return "Finished";
    }

    return `Lap ${raceState.currentLap} / ${totalLaps}`;
  }

  if (!player.state_updated_at) {
    return activeRoom.status === "racing" ? "Syncing" : "Waiting";
  }

  const updatedAt = Date.parse(player.state_updated_at);

  if (!Number.isFinite(updatedAt) || Date.now() - updatedAt > 3000) {
    return "Reconnecting";
  }

  return `Lap ${player.current_lap} / ${totalLaps}`;
}

function updateMultiplayerRacePanel() {
  if (!multiplayerRacePanel) {
    return;
  }

  const hasRoomRace = hasActiveMultiplayerRace();
  multiplayerRacePanel.hidden = !hasRoomRace;

  if (!activeRoom || !hasRoomRace) {
    return;
  }

  const localPlayer = activeRoom.players.find((player) => player.player_id === playerState.id) ?? null;
  const opponent = activeRoom.players.find((player) => player.player_id !== playerState.id) ?? null;

  if (raceRoomCodeDisplay) {
    raceRoomCodeDisplay.textContent = activeRoom.code;
  }

  if (localRaceStateDisplay) {
    localRaceStateDisplay.textContent = getRaceStateLabel(localPlayer, true);
  }

  if (opponentRaceNameDisplay) {
    opponentRaceNameDisplay.textContent = opponent?.username ?? "Opponent";
  }

  if (opponentRaceStateDisplay) {
    opponentRaceStateDisplay.textContent = getRaceStateLabel(opponent, false);
  }

  if (multiplayerRaceStatusDisplay) {
    if (activeRoom.status === "finished") {
      multiplayerRaceStatusDisplay.textContent = "Room race complete";
    } else if (raceState.isCountdownActive) {
      multiplayerRaceStatusDisplay.textContent = "Shared countdown";
    } else if (raceState.isFinished) {
      multiplayerRaceStatusDisplay.textContent = "Waiting for results";
    } else {
      multiplayerRaceStatusDisplay.textContent = "Live room race";
    }
  }
}

function updateHud() {
  if (speedDisplay) {
    speedDisplay.textContent = Math.round(Math.abs(carState.speed) * 5.2).toString();
  }

  if (driveStateDisplay) {
    if (isPressed("ShiftLeft", "ShiftRight") && Math.abs(carState.speed) > 0.5) {
      driveStateDisplay.textContent = "Handbrake";
    } else if (carState.speed > 0.5) {
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
      raceStatusDisplay.textContent = raceState.resultMessage;
    } else if (raceState.isCountdownActive) {
      raceStatusDisplay.textContent = "Countdown started";
    } else if (raceState.isRunning) {
      raceStatusDisplay.textContent = `Lap ${raceState.currentLap} of ${totalLaps}`;
    } else {
      raceStatusDisplay.textContent = "Get ready";
    }
  }

  if (finishBanner) {
    finishBanner.hidden = currentView !== "game" || !raceState.isFinished;
  }

  if (finishTimeDisplay) {
    finishTimeDisplay.textContent = formatRaceTime(raceState.elapsedTime);
  }

  if (finishResultDisplay) {
    finishResultDisplay.textContent = raceState.resultMessage;
  }

  updateMultiplayerRacePanel();
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
  const elapsedTime = clock.getElapsedTime();

  updateRamp(elapsedTime);
  if (currentView === "game" && !isPauseMenuOpen) {
    updateCar(deltaTime);
    updateRace(deltaTime);
    syncMultiplayerRoom(elapsedTime);
  }

  updateRemoteKart(deltaTime);
  updateCamera(deltaTime);
  updateHud();
  if (!isPauseMenuOpen) {
    updateAnnouncement(deltaTime);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeRenderer);
window.addEventListener("keydown", (event) => {
  if (currentView !== "game") {
    return;
  }

  if (event.code === "Escape") {
    event.preventDefault();
    togglePauseMenu();
    return;
  }

  if (isTypingIntoForm(event)) {
    return;
  }

  if (isPauseMenuOpen) {
    event.preventDefault();
    return;
  }

  keys.add(event.code);

  if (event.code === "KeyR") {
    resetCar();
  }
});
window.addEventListener("keyup", (event) => {
  if (currentView !== "game") {
    return;
  }

  if (isPauseMenuOpen) {
    keys.delete(event.code);
    return;
  }

  if (isTypingIntoForm(event)) {
    return;
  }

  keys.delete(event.code);
});
usernameForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const username = usernameInput?.value.trim().slice(0, 16);

  if (!username) {
    return;
  }

  playerState.username = username;
  writeStorage(playerNameKey, username);
  usernameForm.hidden = true;

  if (playerState.pendingTime !== null) {
    const pendingTime = playerState.pendingTime;
    playerState.pendingTime = null;
    saveRaceResult(pendingTime);
  }
});
playButton?.addEventListener("click", startSoloGame);
createRoomButton?.addEventListener("click", () => {
  clearHomeError();
  void roomRequest({
    action: "create",
    playerId: playerState.id,
    username: getPlayerName(),
  })
    .then(enterLobby)
    .catch((error) => showHomeError(error instanceof Error ? error.message : "Could not create room"));
});
joinRoomForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  clearHomeError();
  const code = joinRoomCodeInput?.value.trim().toUpperCase();

  if (!code) {
    showHomeError("Enter a room code.");
    return;
  }

  void roomRequest({
    action: "join",
    code,
    playerId: playerState.id,
    username: getPlayerName(),
  })
    .then(enterLobby)
    .catch((error) => showHomeError(error instanceof Error ? error.message : "Could not join room"));
});
leaderboardPlayButton?.addEventListener("click", startSoloGame);
retryButton?.addEventListener("click", startSoloGame);
pauseToggle?.addEventListener("click", togglePauseMenu);
resumeButton?.addEventListener("click", closePauseMenu);
pauseRetryButton?.addEventListener("click", startSoloGame);
mainMenuButton?.addEventListener("click", returnToMainScreen);
finishLeaderboardButton?.addEventListener("click", () => {
  renderLeaderboard();
  setView("leaderboard");
});
leaderboardTeaser?.addEventListener("click", () => {
  renderLeaderboard();
  setView("leaderboard");
});
leaderboardBackButton?.addEventListener("click", () => {
  setView("home");
});
lobbyBackButton?.addEventListener("click", () => {
  stopLobbyPolling();
  activeRoom = null;
  setView("home");
});
copyRoomCodeButton?.addEventListener("click", () => {
  void copyActiveRoomCode().catch(() => {
    if (lobbyStatus) {
      lobbyStatus.textContent = "Could not copy room code.";
    }
  });
});
readyButton?.addEventListener("click", () => {
  if (!activeRoom) {
    return;
  }

  const currentPlayer = activeRoom.players.find((player) => player.player_id === playerState.id);
  void roomRequest({
    action: "ready",
    code: activeRoom.code,
    playerId: playerState.id,
    isReady: !currentPlayer?.is_ready,
  }).catch((error) => {
    if (lobbyStatus) {
      lobbyStatus.textContent = error instanceof Error ? error.message : "Could not update ready state";
    }
  });
});
startRoomButton?.addEventListener("click", () => {
  if (!activeRoom) {
    return;
  }

  void roomRequest({
    action: "start",
    code: activeRoom.code,
    playerId: playerState.id,
  })
    .then((room) => {
      if (room.status === "racing") {
        startGame();
      }
    })
    .catch((error) => {
      if (lobbyStatus) {
        lobbyStatus.textContent = error instanceof Error ? error.message : "Could not start room";
      }
    });
});
touchStick?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  touchInput.stickPointerId = event.pointerId;
  touchStick.setPointerCapture(event.pointerId);
  updateTouchStick(event.clientX, event.clientY);
});
touchStick?.addEventListener("pointermove", (event) => {
  if (event.pointerId === touchInput.stickPointerId) {
    event.preventDefault();
    updateTouchStick(event.clientX, event.clientY);
  }
});
touchStick?.addEventListener("pointerup", (event) => {
  if (event.pointerId === touchInput.stickPointerId) {
    resetTouchStick();
  }
});
touchStick?.addEventListener("pointercancel", resetTouchStick);
touchStick?.addEventListener("lostpointercapture", resetTouchStick);
bindTouchButton(touchAccelerate, "throttle");
bindTouchButton(touchBrake, "brake");
void loadRemoteLeaderboard();
setView("home");
animate();
