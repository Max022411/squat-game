import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest";

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const resultScreen = document.getElementById("result-screen");

const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

const resultTitle = document.getElementById("result-title");
const resultDesc = document.getElementById("result-desc");

const nameInput = document.getElementById("player-name");
const playerDisplayName = document.getElementById("player-display-name");

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const statusText = document.getElementById("status");
const hintText = document.getElementById("hint");
const countText = document.getElementById("count");
const hpFill = document.getElementById("hp-fill");
const hpText = document.getElementById("hp-text");
const damageText = document.getElementById("damage-text");
const kneeAngleText = document.getElementById("knee-angle");
const depthStatusText = document.getElementById("depth-status");

const player = document.getElementById("player");
const monster = document.getElementById("monster");

let poseLandmarker;
let drawingUtils;
let lastVideoTime = -1;
let animationId = null;

let playerName = "玩家";
let squatCount = 0;
let monsterHp = 100;

let gameRunning = false;
let cameraReady = false;
let modelReady = false;
let state = "stand";

// 較容易觸發版
const VISIBILITY_THRESHOLD = 0.45;
const STAND_KNEE_MIN = 145;     // 站直門檻放寬
const SQUAT_KNEE_MAX = 130;     // 蹲下門檻放寬
const HIP_BELOW_KNEE_MARGIN = -0.02; // 不強制髖一定低於膝
const ATTACK_DAMAGE = 10;

function showScreen(screen) {
  [startScreen, gameScreen, resultScreen].forEach((s) => {
    s.classList.remove("active");
  });
  screen.classList.add("active");
}

function resetGameData() {
  squatCount = 0;
  monsterHp = 100;
  gameRunning = false;
  state = "stand";

  countText.textContent = "深蹲次數：0";
  hpFill.style.width = "100%";
  hpText.textContent = "怪物血量：100 / 100";
  statusText.textContent = "準備開始";
  hintText.textContent = "提示：請先站穩並讓全身入鏡";
  damageText.textContent = "";
  kneeAngleText.textContent = "膝蓋角度：--";
  depthStatusText.textContent = "深度判定：--";
  player.classList.remove("attack");
  monster.classList.remove("hit");
}

async function setupCamera() {
  if (cameraReady) return;

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "user" },
    audio: false
  });

  video.srcObject = stream;

  await new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      resolve();
    };
  });

  cameraReady = true;
}

async function createPoseLandmarker() {
  if (modelReady) return;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
    },
    runningMode: "VIDEO",
    numPoses: 1
  });

  drawingUtils = new DrawingUtils(ctx);
  modelReady = true;
}

function pointVisible(pt) {
  return pt && (pt.visibility === undefined || pt.visibility >= VISIBILITY_THRESHOLD);
}

function getMidPoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function calculateAngle(a, b, c) {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);

  if (magAB === 0 || magCB === 0) return 180;

  let cos = dot / (magAB * magCB);
  cos = Math.min(1, Math.max(-1, cos));

  return Math.acos(cos) * (180 / Math.PI);
}

function getPoseData(landmarks) {
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];

  const requiredPoints = [
    leftHip, rightHip,
    leftKnee, rightKnee,
    leftAnkle, rightAnkle
  ];

  if (!requiredPoints.every(pointVisible)) {
    return null;
  }

  const hipMid = getMidPoint(leftHip, rightHip);
  const kneeMid = getMidPoint(leftKnee, rightKnee);

  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  return {
    hipMid,
    kneeMid,
    leftKneeAngle,
    rightKneeAngle,
    avgKneeAngle
  };
}

function isDeepEnough(poseData) {
  return (
    poseData.avgKneeAngle <= SQUAT_KNEE_MAX &&
    poseData.hipMid.y >= poseData.kneeMid.y + HIP_BELOW_KNEE_MARGIN
  );
}

function isStanding(poseData) {
  return poseData.avgKneeAngle >= STAND_KNEE_MIN;
}

function playAttackAnimation(damage = ATTACK_DAMAGE) {
  player.classList.add("attack");

  setTimeout(() => {
    monster.classList.add("hit");
    damageText.textContent = `-${damage}`;
  }, 120);

  setTimeout(() => {
    player.classList.remove("attack");
    monster.classList.remove("hit");
    damageText.textContent = "";
  }, 350);
}

function updateMonster(damage = ATTACK_DAMAGE) {
  monsterHp = Math.max(0, monsterHp - damage);
  hpFill.style.width = `${monsterHp}%`;
  hpText.textContent = `怪物血量：${monsterHp} / 100`;

  playAttackAnimation(damage);

  if (monsterHp <= 0) {
    endGame();
  }
}

function updateMetrics(poseData) {
  kneeAngleText.textContent = `膝蓋角度：${poseData.avgKneeAngle.toFixed(1)}°`;

  if (isDeepEnough(poseData)) {
    depthStatusText.textContent = "深度判定：已達攻擊條件";
  } else {
    depthStatusText.textContent = "深度判定：尚未達攻擊條件";
  }
}

function processSquatEasy(poseData) {
  const deepEnough = isDeepEnough(poseData);
  const standingRecovered = isStanding(poseData);

  if (state === "stand") {
    if (deepEnough) {
      state = "down";
      statusText.textContent = "已蹲下";
      hintText.textContent = "請站起來完成一次深蹲";
    } else {
      statusText.textContent = "請稍微再蹲一下";
      hintText.textContent = "再往下蹲一點就會觸發";
    }
  } else if (state === "down") {
    if (standingRecovered) {
      state = "stand";
      squatCount += 1;
      countText.textContent = `深蹲次數：${squatCount}`;
      statusText.textContent = "深蹲成功，角色攻擊！";
      hintText.textContent = "很好，再做一次";

      updateMonster(ATTACK_DAMAGE);
    } else {
      statusText.textContent = "請站起來";
      hintText.textContent = "回到比較直的姿勢就算完成";
    }
  }
}

function drawPose(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.landmarks && results.landmarks.length > 0) {
    const landmarks = results.landmarks[0];

    drawingUtils.drawLandmarks(landmarks, { radius: 4 });
    drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);

    const poseData = getPoseData(landmarks);

    if (!poseData) {
      statusText.textContent = "請讓全身完整入鏡";
      hintText.textContent = "至少要拍到髖部、膝蓋、腳踝";
      kneeAngleText.textContent = "膝蓋角度：--";
      depthStatusText.textContent = "深度判定：--";
      return;
    }

    updateMetrics(poseData);

    if (gameRunning && monsterHp > 0) {
      processSquatEasy(poseData);
    }
  } else {
    statusText.textContent = "請站到鏡頭前";
    hintText.textContent = "讓身體完整入鏡";
    kneeAngleText.textContent = "膝蓋角度：--";
    depthStatusText.textContent = "深度判定：--";
  }
}

function predictWebcam() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const results = poseLandmarker.detectForVideo(video, performance.now());
    drawPose(results);
  }

  animationId = requestAnimationFrame(predictWebcam);
}

function endGame() {
  gameRunning = false;
  showScreen(resultScreen);
  resultTitle.textContent = "挑戰成功！";
  resultDesc.textContent = `${playerName} 成功打倒怪物，共完成 ${squatCount} 次深蹲`;
}

async function startGame() {
  resetGameData();

  playerName = nameInput.value.trim() || "玩家";
  playerDisplayName.textContent = `玩家：${playerName}`;

  await setupCamera();
  await createPoseLandmarker();

  showScreen(gameScreen);

  if (!animationId) {
    predictWebcam();
  }

  gameRunning = true;
  statusText.textContent = "開始遊戲";
  hintText.textContent = "請蹲下再站起，角色就會攻擊";
}

startBtn.addEventListener("click", async () => {
  try {
    await startGame();
  } catch (err) {
    console.error(err);
    alert("啟動失敗：" + err.message);
  }
});

restartBtn.addEventListener("click", async () => {
  try {
    await startGame();
  } catch (err) {
    console.error(err);
    alert("重新開始失敗：" + err.message);
  }
});

showScreen(startScreen);