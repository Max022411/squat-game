let score = 0;
let energy = 0;
let combo = 0;
let bossHp = 100;
let maxBossHp = 100;

const loginScreen = document.getElementById("loginScreen");
const gameScreen = document.getElementById("gameScreen");
const startBtn = document.getElementById("startBtn");
const nameInput = document.getElementById("nameInput");

const webcam = document.getElementById("webcam");
const cameraStatus = document.getElementById("cameraStatus");

const playerName = document.getElementById("playerName");
const scoreText = document.getElementById("score");
const energyText = document.getElementById("energy");
const comboText = document.getElementById("combo");
const boss = document.getElementById("boss");
const pet = document.getElementById("pet");
const hitEffect = document.getElementById("hitEffect");
const floatingText = document.getElementById("floatingText");
const bossHpBar = document.getElementById("bossHpBar");
const bossHpText = document.getElementById("bossHpText");
const hitSound = document.getElementById("hitSound");
const rankPercent = document.getElementById("rankPercent");

startBtn.addEventListener("click", startGame);

nameInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    startGame();
  }
});

async function startGame() {
  const name = nameInput.value.trim();

  if (name === "") {
    alert("請先輸入勇者名稱");
    return;
  }

  playerName.innerText = name;

  loginScreen.classList.remove("active");
  gameScreen.classList.add("active");

  const randomRank = Math.floor(Math.random() * 20) + 75;
  rankPercent.innerText = randomRank + "%";

  await startWebcam();
}

// 開啟攝影機
async function startWebcam() {
  cameraStatus.innerText = "正在開啟鏡頭...";

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: 720,
        height: 640,
        facingMode: "user"
      },
      audio: false
    });

    webcam.srcObject = stream;

    webcam.onloadedmetadata = function() {
      webcam.play();
      cameraStatus.innerText = "鏡頭已啟動";
      
      setTimeout(function() {
        cameraStatus.style.display = "none";
      }, 1500);
    };

  } catch (error) {
    console.error(error);
    cameraStatus.innerText = "鏡頭開啟失敗，請確認權限";

    alert(
      "鏡頭開不起來。\n\n請確認：\n1. 你是用 Live Server 開啟\n2. 瀏覽器有允許攝影機\n3. 網址是 http://127.0.0.1 或 localhost"
    );
  }
}

// 深蹲成功時呼叫這個
function onSquatSuccess() {
  score += 10;
  energy += 1;
  combo += 1;

  let damage = 8;

  if (combo % 5 === 0) {
    damage = 18;
    floatingText.innerText = "CRITICAL!";
  } else {
    floatingText.innerText = "HIT!";
  }

  bossHp -= damage;

  if (bossHp < 0) {
    bossHp = 0;
  }

  updateUI();
  bossHitAnimation();
  petAttackAnimation();
  showHitEffect();
  showFloatingText();
  playHitSound();

  if (bossHp <= 0) {
    nextStage();
  }
}

function updateUI() {
  scoreText.innerText = score;
  energyText.innerText = energy;
  comboText.innerText = "COMBO x" + combo;

  comboText.classList.remove("show");
  void comboText.offsetWidth;
  comboText.classList.add("show");

  const hpPercent = (bossHp / maxBossHp) * 100;
  bossHpBar.style.width = hpPercent + "%";
  bossHpText.innerText = bossHp + " / " + maxBossHp;
}

function bossHitAnimation() {
  boss.classList.remove("hit");
  void boss.offsetWidth;
  boss.classList.add("hit");
}

function petAttackAnimation() {
  pet.classList.remove("petAttack");
  void pet.offsetWidth;
  pet.classList.add("petAttack");
}

function showHitEffect() {
  hitEffect.classList.remove("show");
  void hitEffect.offsetWidth;
  hitEffect.classList.add("show");
}

function showFloatingText() {
  floatingText.classList.remove("show");
  void floatingText.offsetWidth;
  floatingText.classList.add("show");
}

function playHitSound() {
  if (!hitSound) return;

  hitSound.currentTime = 0;

  hitSound.play().catch(function() {
    console.log("音效尚未被瀏覽器允許播放");
  });
}

function nextStage() {
  setTimeout(function() {
    alert("Boss 擊敗！進入下一個探險地圖！");

    bossHp = maxBossHp;
    combo = 0;

    updateUI();
  }, 500);
}

// 測試用：進入遊戲後按空白鍵 = 成功深蹲一次
document.addEventListener("keydown", function(event) {
  if (event.code === "Space" && gameScreen.classList.contains("active")) {
    onSquatSuccess();
  }
});
