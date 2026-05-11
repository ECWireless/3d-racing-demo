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
      <button class="play-button" type="button" data-play-button>Play</button>
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
        <button type="button" data-leaderboard-play>Play</button>
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
const homeLeaderboardList =
  document.querySelector<HTMLOListElement>("[data-home-leaderboard-list]");
const fullLeaderboardList =
  document.querySelector<HTMLOListElement>("[data-full-leaderboard-list]");
const playButton = document.querySelector<HTMLButtonElement>("[data-play-button]");
const leaderboardTeaser = document.querySelector<HTMLButtonElement>("[data-leaderboard-teaser]");
const leaderboardBackButton =
  document.querySelector<HTMLButtonElement>("[data-leaderboard-back]");
const leaderboardPlayButton =
  document.querySelector<HTMLButtonElement>("[data-leaderboard-play]");
const gameUiElements = document.querySelectorAll<HTMLElement>("[data-game-ui]");
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
const touchInput = {
  throttle: false,
  brake: false,
  steering: 0,
  stickPointerId: null as number | null,
};
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
  isResultSaved: false,
  resultMessage: "Checking leaderboard...",
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
const maxForwardSpeed = 42;
const maxReverseSpeed = -9;
const steeringPower = 2.2;
const totalLaps = 3;
const barrierInset = 0.65;
const grassDrag = 8.5;
const grassMaxSpeed = 19;
const handbrakePower = 18;
const handbrakeSteeringBoost = 1.9;
const handbrakePivotAssist = 0.32;
const finishCoastDrag = 5.5;
const countdownDuration = 3;
const throttleRampBuildRate = 0.1;
const throttleRampDecayRate = 0.5;
const overdriveAcceleration = 5;
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

const playerState = {
  id: getOrCreatePlayerId(),
  username: readStorage(playerNameKey),
  pendingTime: null as number | null,
};
let leaderboardEntries: LeaderboardEntry[] = [];
let leaderboardError: string | null = null;
let currentView: "home" | "game" | "leaderboard" = "home";

function isPressed(...codes: string[]) {
  return codes.some((code) => keys.has(code));
}

function getThrottleInput() {
  return touchInput.throttle || isPressed("KeyW", "ArrowUp");
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

function setView(view: typeof currentView) {
  currentView = view;

  if (homeScreen) {
    homeScreen.hidden = view !== "home";
  }

  if (leaderboardPage) {
    leaderboardPage.hidden = view !== "leaderboard";
  }

  for (const element of gameUiElements) {
    element.hidden = view !== "game";
  }

  if (view !== "game") {
    keys.clear();
    touchInput.throttle = false;
    touchInput.brake = false;
    resetTouchStick();
  }
}

function startGame() {
  resetCar();
  setView("game");
  startCountdown();
}

function resetTouchStick() {
  touchInput.steering = 0;
  touchInput.stickPointerId = null;

  if (touchStickKnob) {
    touchStickKnob.style.transform = "translate(-50%, -50%)";
  }
}

function updateTouchStick(pointerX: number) {
  if (!touchStick || !touchStickKnob) {
    return;
  }

  const bounds = touchStick.getBoundingClientRect();
  const centerX = bounds.left + bounds.width / 2;
  const maxOffset = bounds.width * 0.34;
  const offsetX = THREE.MathUtils.clamp(pointerX - centerX, -maxOffset, maxOffset);

  touchInput.steering = THREE.MathUtils.clamp(-offsetX / maxOffset, -1, 1);
  touchStickKnob.style.transform = `translate(calc(-50% + ${offsetX}px), -50%)`;
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
  raceState.isResultSaved = false;
  raceState.resultMessage = "Checking leaderboard...";
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
      raceState.isResultSaved = true;
      raceState.resultMessage = "Checking leaderboard...";
      void saveRaceResult(raceState.elapsedTime);
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
    finishBanner.hidden = !raceState.isFinished;
  }

  if (finishTimeDisplay) {
    finishTimeDisplay.textContent = formatRaceTime(raceState.elapsedTime);
  }

  if (finishResultDisplay) {
    finishResultDisplay.textContent = raceState.resultMessage;
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

  if (currentView === "game") {
    updateCar(deltaTime);
    updateRace(deltaTime);
  }

  updateCamera(deltaTime);
  updateHud();
  updateAnnouncement(deltaTime);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

window.addEventListener("resize", resizeRenderer);
window.addEventListener("keydown", (event) => {
  if (currentView !== "game") {
    return;
  }

  if (isTypingIntoForm(event)) {
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
playButton?.addEventListener("click", startGame);
leaderboardPlayButton?.addEventListener("click", startGame);
retryButton?.addEventListener("click", startGame);
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
touchStick?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  touchInput.stickPointerId = event.pointerId;
  touchStick.setPointerCapture(event.pointerId);
  updateTouchStick(event.clientX);
});
touchStick?.addEventListener("pointermove", (event) => {
  if (event.pointerId === touchInput.stickPointerId) {
    event.preventDefault();
    updateTouchStick(event.clientX);
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
