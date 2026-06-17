// ==================== 1. 全域資料與遊戲狀態機制 ====================
const defaultData = {
  name: "勇者", coins: 1200, stage: 1, score: 0, energy: 0, combo: 0, squat: 0,
  roleLevel: 1, roleAttack: 10, dailyDay: 1, lastClaim: "",
  walkDistance: 0.0, // 新增：儲存總走路公里數
  pets: [
    { id: 1, name: "光靈幼獸", icon: "🐾", rarity: "稀有", level: 1, attack: 12, owned: true, active: true },
    { id: 2, name: "焰火狐", icon: "🔥", rarity: "史詩", level: 1, attack: 25, owned: false, active: false },
    { id: 3, name: "星辰貓", icon: "🌙", rarity: "傳說", level: 1, attack: 40, owned: false, active: false }
  ]
};

let data = JSON.parse(localStorage.getItem("squatRPG")) || defaultData;
let bossHp = 100;
let maxBossHp = 100;
let poseStarted = false;
let squatState = "up";
let lastAttackTime = 0;

// 新增：走路 GPS 機制變數
let lastPosition = null; 
const SPEED_LIMIT_KMH = 15.0; // 防作弊：時速大於 15 公里判定為太快不合理（騎車、乘車）

const screens = ["homeScreen", "loginScreen", "lobbyScreen", "mapScreen", "petScreen", "roleScreen", "gachaScreen", "dailyScreen", "rankScreen", "gameScreen"];

const startBtn = document.getElementById("startBtn");
const nameInput = document.getElementById("nameInput");
const gameScreen = document.getElementById("gameScreen");

if (startBtn) startBtn.addEventListener("click", startGame);
if (nameInput) {
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startGame();
  });
}

function save() {
  localStorage.setItem("squatRPG", JSON.stringify(data));
  refreshTop();
}

function showScreen(id) {
  screens.forEach(s => {
    const el = document.getElementById(s);
    if(el) el.classList.remove("active");
  });
  const target = document.getElementById(id);
  if(target) target.classList.add("active");
  refreshTop();
}

function startGame() {
  const name = nameInput.value.trim();
  if (name === "") {
    alert("請先輸入勇者名稱");
    return;
  }
  data.name = name;
  save();
  showScreen("lobbyScreen");
  initMobileGps(); // 進入大廳後立刻開啟 GPS 走路追蹤功能
}

function refreshTop() {
  if (document.getElementById("lobbyName")) document.getElementById("lobbyName").textContent = data.name;
  if (document.getElementById("playerName")) document.getElementById("playerName").textContent = data.name;
  if (document.getElementById("coinText")) document.getElementById("coinText").textContent = "🪙 " + data.coins;
  if (document.getElementById("playerLevelText")) document.getElementById("playerLevelText").textContent = "LV." + data.roleLevel + " 見習騎士";
  
  // 更新走路面板數值
  if (document.getElementById("lobbyWalkDist")) document.getElementById("lobbyWalkDist").textContent = Number(data.walkDistance).toFixed(2);
}

// ==================== 2. 新增：手機 GPS 走路賺錢偵測核心 ====================
function initMobileGps() {
  if (!navigator.geolocation) {
    const msgEl = document.getElementById("lobbyWalkMsg");
    if(msgEl) msgEl.textContent = "❌ 您的裝置不支援 GPS 定位";
    return;
  }

  // watchPosition 會在手機隨位置移動時，自動在背景觸發
  navigator.geolocation.watchPosition(
    (position) => {
      const coords = position.coords;
      const speedMps = coords.speed; // 瀏覽器回傳的每秒公尺數 (m/s)
      let currentSpeedKmh = 0;

      if (speedMps !== null && speedMps >= 0) {
        currentSpeedKmh = speedMps * 3.6; // 換算成時速公里 (km/h)
      }

      if (document.getElementById("lobbyWalkSpeed")) {
        document.getElementById("lobbyWalkSpeed").textContent = currentSpeedKmh.toFixed(1);
      }

      const msgEl = document.getElementById("lobbyWalkMsg");

      // 作弊與合理性過濾判定：時速大於上限
      if (currentSpeedKmh > SPEED_LIMIT_KMH) {
        if(msgEl) {
          msgEl.textContent = "⚠️ 速度過快！(捷運/開車中) 走路獎勵暫停";
          msgEl.className = "walk-msg warn";
        }
        lastPosition = coords; // 更新定位，但不給代幣
        return;
      }

      // 如果有上一次的定位點，計算兩點間的實際移動距離
      if (lastPosition) {
        const distMeters = calcDistanceMeters(
          lastPosition.latitude, lastPosition.longitude,
          coords.latitude, coords.longitude
        );

        // 如果移動距離在合理範圍內（防 GPS 訊號原地漂移，大於 2 公尺才算真正移動）
        if (distMeters > 2 && distMeters < 100) {
          data.walkDistance += (distMeters / 1000); // 累積換算成公里

          // 走路回饋：每走 10 公尺，就給 5 個健身幣
          const coinEarned = Math.floor(distMeters / 10) * 5;
          if (coinEarned > 0) {
            data.coins += coinEarned;
          }
          save();
        }
      }

      if(msgEl) {
        msgEl.textContent = "🟢 正常走路中，每 10 公尺賺 5 健身幣！";
        msgEl.className = "walk-msg ok";
      }
      lastPosition = coords;
    },
    (error) => {
      console.error(error);
      const msgEl = document.getElementById("lobbyWalkMsg");
      if(msgEl) {
        msgEl.textContent = "❌ GPS 授權失敗或訊號微弱，請開啟定位權限";
        msgEl.className = "walk-msg warn";
      }
    },
    {
      enableHighAccuracy: true, // 開啟高精準度 GPS 追蹤
      timeout: 10000,
      maximumAge: 0
    }
  );
}

// 運用國際半正矢公式 (Haversine Formula) 即時計算手機經緯度移動的公尺數
function calcDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 地球平均半徑 (公尺)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; 
}

// ==================== 3. 大廳其餘子系統功能模組 ====================
function openMap() { renderMap(); showScreen("mapScreen"); }
function renderMap() {
  const box = document.getElementById("mapNodes"); if(!box) return;
  box.innerHTML = "";
  for (let i = 1; i <= 20; i++) {
    const node = document.createElement("div");
    node.className = "stage-node";
    if (i % 10 === 0) node.classList.add("elite");
    if (i === data.stage) node.classList.add("current");
    node.textContent = i % 10 === 0 ? "👑" : i;
    node.style.top = (35 + (i - 1) * 28) + "px";
    node.style.left = (i % 2 === 0 ? 235 : 105) + "px";
    box.appendChild(node);
  }
}

function openPets() {
  const box = document.getElementById("petList"); if(!box) return;
  box.innerHTML = "";
  data.pets.forEach(p => {
    const div = document.createElement("div");
    div.className = "feature-card";
    div.innerHTML = `
      <div class="big">${p.icon}</div>
      <h2>${p.name} <span class="badge ${p.rarity==='傳說'?'legend':p.rarity==='史詩'?'epic':'rare'}">${p.rarity}</span></h2>
      <p>Lv.${p.level}<br>輔助攻擊：+${p.attack}<br>${p.owned ? '已擁有' : '尚未獲得'}</p>
      <div class="card-row">
        <button class="small-btn" onclick="setPet(${p.id})">${p.active ? '出戰中' : '設為出戰'}</button>
        <button class="small-btn" onclick="upgradePet(${p.id})">升級</button>
      </div>`;
    box.appendChild(div);
  });
  showScreen("petScreen");
}

function setPet(id) {
  const pet = data.pets.find(p => p.id === id);
  if (!pet.owned) { alert("你尚未擁有這隻寵物"); return; }
  data.pets.forEach(p => p.active = false);
  pet.active = true; save(); openPets();
}

function upgradePet(id) {
  const pet = data.pets.find(p => p.id === id);
  if (!pet.owned) { alert("尚未擁有，無法升級"); return; }
  const cost = pet.level * 200;
  if (data.coins < cost) { alert("健身幣不足，需要 " + cost); return; }
  data.coins -= cost; pet.level++; pet.attack += 5; save(); openPets();
}

function openRole() {
  document.getElementById("roleTitle").textContent = "見習騎士 Lv." + data.roleLevel;
  document.getElementById("roleDesc").innerHTML = "攻擊力：" + data.roleAttack + "<br>升級費用：" + (data.roleLevel * 300) + " 健身幣";
  showScreen("roleScreen");
}

function upgradeRole() {
  const cost = data.roleLevel * 300;
  if (data.coins < cost) { alert("健身幣不足，需要 " + cost); return; }
  data.coins -= cost; data.roleLevel++; data.roleAttack += 5; save(); openRole();
}

function openGacha() { document.getElementById("gachaResult").textContent = ""; showScreen("gachaScreen"); }
function drawGacha() {
  if (data.coins < 300) { alert("健身幣不足"); return; }
  data.coins -= 300;
  const r = Math.random() * 100;
  let pet = (r < 5) ? data.pets[2] : (r < 25 ? data.pets[1] : data.pets[0]);
  pet.owned = true;
  document.getElementById("gachaResult").innerHTML = "獲得：" + pet.icon + " " + pet.name + "（" + pet.rarity + "）";
  save();
}

function openDaily() {
  const box = document.getElementById("dailyList"); if(!box) return;
  box.innerHTML = "";
  for(let i=0; i<7; i++) {
    box.innerHTML += `<div class="feature-card"><h2>第 ${i + 1} 天</h2><p>${i === 6 ? "稀有寵物蛋" : "健身幣 " + (100+i*100)}</p></div>`;
  }
  showScreen("dailyScreen");
}
function claimDaily() {
  const dStr = new Date().toISOString().slice(0, 10);
  if (data.lastClaim === dStr) { alert("今天已經領過了"); return; }
  if (data.dailyDay === 7) { data.pets[1].owned = true; alert("獲得稀有寵物：焰火狐！"); }
  else { data.coins += (data.dailyDay * 100); alert("獲得獎勵！"); }
  data.dailyDay = data.dailyDay === 7 ? 1 : data.dailyDay + 1;
  data.lastClaim = dStr; save(); openDaily();
}

function openRank() {
  document.getElementById("rankSquat").textContent = data.squat;
  document.getElementById("rankStage").textContent = data.stage;
  document.getElementById("rankScore").textContent = data.score;
  showScreen("rankScreen");
}

function activePet() { return data.pets.find(p => p.active && p.owned) || data.pets[0]; }

// ==================== 4. 核心體感深蹲戰鬥運作邏輯 ====================
function startBattle() {
  const isElite = data.stage % 10 === 0;
  maxBossHp = isElite ? 240 : 100 + data.stage * 10;
  bossHp = maxBossHp;

  document.getElementById("stageText").textContent = "STAGE " + data.stage;
  document.getElementById("boss").textContent = isElite ? "👹" : "👾";
  document.getElementById("pet").textContent = activePet().icon;

  updateBattleUI();
  showScreen("gameScreen");

  if (!poseStarted) {
    poseStarted = true;
    startCameraAndPose();
  }
}

function onSquatSuccess() {
  const pet = activePet();
  const isCrit = (data.combo > 0 && data.combo % 5 === 4);
  const dmg = data.roleAttack + pet.attack + (isCrit ? 25 : 0);

  bossHp -= dmg;
  if (bossHp < 0) bossHp = 0;

  data.score += 10;
  data.energy += 1;
  data.combo += 1;
  data.squat += 1;
  data.coins += 5;

  const flt = document.getElementById("floatingText");
  if(flt) flt.textContent = isCrit ? "CRITICAL!" : `-${dmg} HP`;

  triggerVfx();
  updateBattleUI();
  save();

  if (bossHp <= 0) {
    setTimeout(() => {
      alert("成功擊敗魔王！獲得通關獎勵！");
      data.coins += data.stage * 20;
      data.stage++;
      data.combo = 0;
      save();
      openMap();
    }, 500);
  }
}

function updateBattleUI() {
  if(document.getElementById("score")) document.getElementById("score").textContent = data.score;
  if(document.getElementById("energy")) document.getElementById("energy").textContent = data.energy;
  if(document.getElementById("squatCount")) document.getElementById("squatCount").textContent = data.squat;
  if(document.getElementById("combo")) document.getElementById("combo").textContent = "COMBO x" + data.combo;
  if(document.getElementById("hpText")) document.getElementById("hpText").textContent = bossHp + " / " + maxBossHp;
  if(document.getElementById("hpFill")) document.getElementById("hpFill").style.width = ((bossHp / maxBossHp) * 100) + "%";
}

function triggerVfx() {
  const b = document.getElementById("boss");
  const p = document.getElementById("pet");
  const e = document.getElementById("hitEffect");
  const f = document.getElementById("floatingText");

  if(!b || !p || !e || !f) return;
  b.classList.remove("hit"); p.classList.remove("petAttack"); e.classList.remove("show"); f.classList.remove("show");
  void b.offsetWidth;
  b.classList.add("hit"); p.classList.add("petAttack"); e.classList.add("show"); f.classList.add("show");
}

// ==================== 5. MediaPipe 手機相機骨架探測 ====================
async function startCameraAndPose() {
  const video = document.getElementById("webcam");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const statusText = document.getElementById("cameraStatus");

  if(statusText) statusText.textContent = "啟動 AI 偵測模組...";

  const pose = new Pose({
    locateFile: (file) => "https://cdn.jsdelivr.net/npm/@mediapipe/pose/" + file
  });

  pose.setOptions({
    modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.45, minTrackingConfidence: 0.45
  });

  pose.onResults((results) => {
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 640;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#00d9ff", lineWidth: 4 });
      drawLandmarks(ctx, results.poseLandmarks, { color: "#ffd400", lineWidth: 2 });
      checkLiveSquat(results.poseLandmarks);
    }
  });

  try {
    const camera = new Camera(video, {
      onFrame: async () => {
        await pose.send({ image: video });
      },
      width: 480, height: 640
    });
    await camera.start();
    if(statusText) statusText.textContent = "ENEMY HP";
  } catch (err) {
    console.error(err);
    if(statusText) statusText.textContent = "鏡頭開啟失敗";
    alert("手機相機啟動失敗！請確認：\n1. 網址是 https\n2. 點選了『允許』攝影機權限！");
  }
}

function checkLiveSquat(lm) {
  const lh = lm[23], lk = lm[25], la = lm[27];
  const rh = lm[24], rk = lm[26], ra = lm[28];

  if (lk.visibility < 0.4 || la.visibility < 0.4 || rk.visibility < 0.4 || ra.visibility < 0.4) return;

  const leftAngle = calcAngle(lh, lk, la);
  const rightAngle = calcAngle(rh, rk, ra);
  const minAngle = Math.min(leftAngle, rightAngle);

  if(document.getElementById("debug")) {
    document.getElementById("debug").textContent = "膝蓋角度：" + Math.round(minAngle) + "° / 狀態：" + squatState;
  }

  // 狀態機：下蹲
  if (squatState === "up" && minAngle < 135) {
    squatState = "down";
  }
  // 狀態機：起立 (判定深蹲完整成功)
  if (squatState === "down" && minAngle > 155) {
    const now = Date.now();
    if (now - lastAttackTime > 750) { 
      onSquatSuccess();
      lastAttackTime = now;
    }
    squatState = "up";
  }
}

function calcAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const len = Math.sqrt(ab.x**2 + ab.y**2) * Math.sqrt(cb.x**2 + cb.y**2);
  return Math.acos(Math.min(1, Math.max(-1, dot / len))) * 180 / Math.PI;
}

// 初始化更新大廳資訊
refreshTop();
