// ==================== 1. 全域資料與狀態初始化 ====================
const defaultData = {
  name: "勇者", coins: 1200, stage: 1, score: 0, energy: 0, combo: 0, squat: 0,
  roleLevel: 1, roleAttack: 10, dailyDay: 1, lastClaim: "",
  pets: [
    { id: 1, name: "光靈幼獸", icon: "🐾", rarity: "稀有", level: 1, attack: 12, owned: true, active: true },
    { id: 2, name: "焰火狐", icon: "🔥", rarity: "史詩", level: 1, attack: 25, owned: false, active: false },
    { id: 3, name: "星辰貓", icon: "🌙", rarity: "傳說", level: 1, attack: 40, owned: false, active: false }
  ]
};

let data = JSON.parse(localStorage.getItem("squatRPG")) || defaultData;
let bossHp = 100, maxHp = 100;
let poseStarted = false, squatState = "up", lastAttackTime = 0;

const screens = ["homeScreen", "loginScreen", "lobbyScreen", "mapScreen", "petScreen", "roleScreen", "gachaScreen", "dailyScreen", "rankScreen", "gameScreen"];

// ==================== 2. 網頁內建音效合成器 ====================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playAudioEffect(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  if (type === 'hit') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
    osc.start(); osc.stop(audioCtx.currentTime + 0.12);
  } else if (type === 'crit') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
  } else if (type === 'down') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    osc.start(); osc.stop(audioCtx.currentTime + 0.08);
  }
}

// ==================== 3. 基礎切換控制 ====================
function save() { 
  localStorage.setItem("squatRPG", JSON.stringify(data)); 
  refreshTop(); 
}

function show(id) { 
  screens.forEach(s => document.getElementById(s).classList.remove("active")); 
  document.getElementById(id).classList.add("active"); 
  refreshTop(); 
}

function login() { 
  data.name = document.getElementById("nameInput").value.trim() || "勇者"; 
  save(); 
  show("lobbyScreen"); 
}

function refreshTop() {
  document.getElementById("lobbyName").textContent = data.name;
  document.getElementById("playerName").textContent = data.name;
  document.getElementById("coinText").textContent = "🪙 " + data.coins;
  document.getElementById("playerLevelText").textContent = "LV." + data.roleLevel + " 見習騎士";
}

document.getElementById("nameInput").addEventListener("keydown", function(e) {
  if (e.key === "Enter") login();
});

// ==================== 4. 系統模組 ====================
function openMap() { renderMap(); show("mapScreen"); }

function renderMap() {
  const box = document.getElementById("mapNodes"); box.innerHTML = "";
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
  const box = document.getElementById("petList"); box.innerHTML = "";
  data.pets.forEach(p => {
    const div = document.createElement("div");
    div.className = "feature-card";
    div.innerHTML = `
      <div class="big">${p.icon}</div>
      <h2>${p.name} <span class="badge ${p.rarity === '傳說' ? 'legend' : p.rarity === '史詩' ? 'epic' : 'rare'}">${p.rarity}</span></h2>
      <p>Lv.${p.level}<br>輔助攻擊：+${p.attack}<br>${p.owned ? '已擁有' : '尚未獲得'}</p>
      <div class="card-row">
        <button class="small-btn" onclick="setPet(${p.id})">${p.active ? '出戰中' : '設為出戰'}</button>
        <button class="small-btn" onclick="upgradePet(${p.id})">升級</button>
      </div>`;
    box.appendChild(div);
  });
  show("petScreen");
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
  show("roleScreen");
}

function upgradeRole() {
  const cost = data.roleLevel * 300;
  if (data.coins < cost) { alert("健身幣不足，需要 " + cost); return; }
  data.coins -= cost; data.roleLevel++; data.roleAttack += 5; save(); openRole();
}

function openGacha() { document.getElementById("gachaResult").textContent = ""; show("gachaScreen"); }

function drawGacha() {
  if (data.coins < 300) { alert("健身幣不足"); return; }
  data.coins -= 300;
  const r = Math.random() * 100;
  let pet;
  if (r < 5) pet = data.pets[2];
  else if (r < 25) pet = data.pets[1];
  else pet = data.pets[0];
  pet.owned = true;
  document.getElementById("gachaResult").innerHTML = "獲得：" + pet.icon + " " + pet.name + "（" + pet.rarity + "）";
  save();
}

function openDaily() {
  const rewards = [100, 150, 200, 300, 500, 800, 1500];
  const box = document.getElementById("dailyList"); box.innerHTML = "";
  rewards.forEach((r, i) => {
    box.innerHTML += `<div class="feature-card"><h2>第 ${i + 1} 天</h2><p>${i === 6 ? "稀有寵物蛋" : "健身幣 " + r}</p></div>`;
  });
  show("dailyScreen");
}

function today() { return new Date().toISOString().slice(0, 10); }

function claimDaily() {
  if (data.lastClaim === today()) { alert("今天已經領過了"); return; }
  const rewards = [100, 150, 200, 300, 500, 800, 1500];
  const day = Math.min(data.dailyDay, 7);
  if (day === 7) { data.pets[1].owned = true; alert("獲得稀有寵物：焰火狐！"); }
  else { data.coins += rewards[day - 1]; alert("獲得 " + rewards[day - 1] + " 健身幣！"); }
  data.dailyDay = day === 7 ? 1 : day + 1;
  data.lastClaim = today();
  save(); openDaily();
}

function openRank() {
  document.getElementById("rankSquat").textContent = data.squat;
  document.getElementById("rankStage").textContent = data.stage;
  document.getElementById("rankScore").textContent = data.score;
  show("rankScreen");
}

// ==================== 5. 戰鬥核心邏輯 ====================
function activePet() { 
  return data.pets.find(p => p.active && p.owned) || data.pets[0]; 
}

function startBattle() {
  const elite = data.stage % 10 === 0;
  maxHp = elite ? 240 : 100 + data.stage * 10;
  bossHp = maxHp;
  
  document.getElementById("stageText").textContent = "STAGE " + data.stage;
  document.getElementById("monster").textContent = elite ? "👹" : "👾";
  document.getElementById("enemyName").textContent = elite ? "ELITE HP" : "ENEMY HP";
  document.getElementById("knight").textContent = activePet().icon;

  updateBattleUI();
  show("gameScreen");
  
  if (!poseStarted) { poseStarted = true; startPose(); }
}

function attack() {
  const pet = activePet();
  const isCrit = (data.combo % 5 === 4);
  const damage = data.roleAttack + pet.attack + (isCrit ? 30 : 0);
  
  bossHp -= damage;
  data.score += 10; data.energy++; data.combo++; data.squat++; data.coins += 5;
  
  document.getElementById("floatText").textContent = isCrit ? "CRITICAL!" : `-${damage} HP`;
  playAudioEffect(isCrit ? 'crit' : 'hit');
  playEffectAnimation();
  
  if (bossHp <= 0) {
    data.coins += data.stage * 20;
    data.stage++;
    data.combo = 0;
    save();
    alert("關卡通過！獲得通關獎勵！");
    renderMap();
    show("mapScreen");
    return;
  }
  save(); updateBattleUI();
}

function updateBattleUI() {
  document.getElementById("score").textContent = data.score;
  document.getElementById("energy").textContent = data.energy;
  document.getElementById("squatCount").textContent = data.squat;
  document.getElementById("combo").textContent = "COMBO x" + data.combo;
  document.getElementById("hpText").textContent = Math.max(0, bossHp) + " / " + maxHp;
  document.getElementById("hpFill").style.width = Math.max(0, (bossHp / maxHp) * 100) + "%";
}

function playEffectAnimation() {
  const e = document.getElementById("effect");
  const f = document.getElementById("floatText");
  const m = document.getElementById("monster");
  const k = document.getElementById("knight");

  e.classList.remove("show"); f.classList.remove("show");
  m.classList.remove("hit"); k.classList.remove("petAttack");
  
  void e.offsetWidth;

  e.classList.add("show"); f.classList.add("show");
  m.classList.add("hit"); k.classList.add("petAttack");
}

document.addEventListener("keydown", e => {
  if (e.code === "Space" && document.getElementById("gameScreen").classList.contains("active")) attack();
});

// ==================== 6. MediaPipe 骨架同步運算 ====================
async function startPose() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  
  const pose = new Pose({
    locateFile: file => "https://cdn.jsdelivr.net/npm/@mediapipe/pose/" + file
  });
  
  pose.setOptions({
    modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: .45, minTrackingConfidence: .45
  });
  
  pose.onResults(results => {
    canvas.width = video.clientWidth || 480;
    canvas.height = video.clientHeight || 640;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: "#00d9ff", lineWidth: 4 });
      drawLandmarks(ctx, results.poseLandmarks, { color: "#ffd400", lineWidth: 2 });
      checkSquat(results.poseLandmarks);
    }
  });
  
  const camera = new Camera(video, {
    onFrame: async () => await pose.send({ image: video }),
    width: 480,
    height: 640
  });
  camera.start();
}

function checkSquat(lm) {
  const lh = lm[23], lk = lm[25], la = lm[27];
  const rh = lm[24], rk = lm[26], ra = lm[28];
  
  if (lk.visibility < .4 || la.visibility < .4 || rk.visibility < .4 || ra.visibility < .4) return;
  
  const angle = Math.min(getAngle(lh, lk, la), getAngle(rh, rk, ra));
  document.getElementById("debug").textContent = "膝蓋角度：" + Math.round(angle) + " / 狀態：" + squatState;
  
  if (squatState === "up" && angle < 135) {
    squatState = "down";
    playAudioEffect('down');
  }
  if (squatState === "down" && angle > 155) {
    const now = Date.now();
    if (now - lastAttackTime > 750) {
      attack();
      lastAttackTime = now;
    }
    squatState = "up";
  }
}

function getAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y }, cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const len = Math.sqrt(ab.x ** 2 + ab.y ** 2) * Math.sqrt(cb.x ** 2 + cb.y ** 2);
  return Math.acos(Math.min(1, Math.max(-1, dot / len))) * 180 / Math.PI;
}

refreshTop();
