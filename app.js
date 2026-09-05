const socket = io();

const $ = (id) => document.getElementById(id);
const screens = [
  "screen-role", "screen-join", "screen-player-lobby", "screen-late",
  "screen-host-create", "screen-host-lobby", "screen-question", "screen-reveal",
  "screen-phase-ended", "screen-player-phase-ended", "screen-finished",
];
function show(id) {
  screens.forEach((s) => $(s).classList.add("hidden"));
  $(id).classList.remove("hidden");
}

const OPT_SHAPES = ["▲", "◆", "●", "■"];

let role = null; // 'host' | 'player'
let roomCode = null;
let myName = "";
let mySubmitted = false;
let timerInterval = null;
let latestQuestionMeta = null; // {phase, qi, total, duration, qStart}

const urlParams = new URLSearchParams(window.location.search);
const prefillCode = (urlParams.get("room") || "").toUpperCase();

/* ---------------- role select ---------------- */
$("btn-be-host").onclick = () => {
  role = "host";
  show("screen-host-create");
};
$("btn-be-player").onclick = () => {
  role = "player";
  $("input-code").value = prefillCode;
  show("screen-join");
};

if (prefillCode) {
  // 有人是直接點主持人分享出來的連結進來的，直接跳去加入表單
  role = "player";
  $("input-code").value = prefillCode;
  $("join-subtitle").textContent = "輸入你的暱稱加入遊戲";
  show("screen-join");
}

/* ---------------- player: join ---------------- */
$("btn-join").onclick = () => {
  const code = $("input-code").value.trim().toUpperCase();
  const name = $("input-name").value.trim();
  $("join-error").classList.add("hidden");
  if (!code || !name) return;
  socket.emit("player:join", { code, name }, (res) => {
    if (!res.ok) {
      $("join-error").textContent = res.error || "加入失敗，請再試一次。";
      $("join-error").classList.remove("hidden");
      return;
    }
    roomCode = code;
    myName = name;
    $("player-hello").textContent = `嗨，${myName}！`;
    show("screen-player-lobby");
  });
};

/* ---------------- host: create + lobby ---------------- */
$("btn-create").onclick = () => {
  socket.emit("host:create", {}, (res) => {
    if (!res.ok) return;
    roomCode = res.code;
    const link = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    $("btn-copy").onclick = async () => {
      try {
        await navigator.clipboard.writeText(link);
        alert("連結已複製，貼給大家吧！");
      } catch {
        prompt("請手動複製這個連結分享給大家：", link);
      }
    };
    show("screen-host-lobby");
  });
};

socket.on("lobby:update", ({ count }) => {
  $("lobby-count").textContent = count;
  $("btn-start").disabled = count === 0;
});

$("btn-start").onclick = () => {
  socket.emit("host:start", {}, () => {});
};

/* ---------------- shared: question rendering ---------------- */
function renderPhaseTag(phase, qi, total) {
  const tag = document.createElement("span");
  const label = phase === "extra" ? `🔥 延長賽 第 ${qi + 1} 題` : `正賽 第 ${qi + 1} / ${total} 題`;
  return { text: label, extra: phase === "extra" };
}

function startTimerBar(qStart, duration) {
  clearInterval(timerInterval);
  const fill = $("timer-fill");
  const tick = () => {
    const elapsed = Date.now() - qStart;
    const pct = Math.max(0, 100 - (elapsed / duration) * 100);
    fill.style.width = pct + "%";
    fill.classList.toggle("low", pct <= 30);
  };
  tick();
  timerInterval = setInterval(tick, 100);
}

socket.on("game:question", (payload) => {
  latestQuestionMeta = payload;
  mySubmitted = false;
  const { phase, qi, total, duration, qStart, question } = payload;

  const tagInfo = renderPhaseTag(phase, qi, total);
  const tagEl = $("phase-tag");
  tagEl.textContent = tagInfo.text;
  tagEl.classList.toggle("extra", tagInfo.extra);

  $("answered-count").textContent = role === "host" ? "0 人已作答" : "";
  startTimerBar(qStart, duration);

  $("options-grid").innerHTML = "";
  $("submitted-box").classList.add("hidden");
  $("btn-end-now").classList.toggle("hidden", role !== "host");
  $("question-block-wait").classList.toggle("hidden", role !== "host");
  if (role === "host") {
    $("question-text-wait").textContent = question.q;
  }

  question.options.forEach((opt, i) => {
    const btn = document.createElement(role === "host" ? "div" : "button");
    btn.className = `option-btn opt-${i}`;
    btn.innerHTML = `<span class="opt-shape">${OPT_SHAPES[i]}</span><span>${opt}</span>`;
    if (role === "player") {
      btn.onclick = () => submitAnswer(i);
    }
    $("options-grid").appendChild(btn);
  });

  show("screen-question");
});

function submitAnswer(choice) {
  if (mySubmitted) return;
  mySubmitted = true;
  socket.emit("player:answer", { choice });
  $("options-grid").querySelectorAll("button").forEach((b) => (b.disabled = true));
  $("submitted-box").classList.remove("hidden");
}

$("btn-end-now").onclick = () => {
  socket.emit("host:endNow", {}, () => {});
};

socket.on("game:answeredCount", ({ count }) => {
  if (role === "host") $("answered-count").textContent = `${count} 人已作答`;
});

/* ---------------- reveal ---------------- */
let myLastResult = null; // {correct, choice, pts, total}

socket.on("game:yourResult", (payload) => {
  myLastResult = payload;
});

socket.on("game:reveal", (payload) => {
  clearInterval(timerInterval);
  const { phase, qi, correct, fact, counts, isLast, top3 } = payload;
  const question = latestQuestionMeta.question;

  // result banner (only meaningful for players)
  const banner = $("result-banner");
  if (role === "player" && myLastResult) {
    banner.classList.remove("hidden", "result-banner-ok", "result-banner-bad", "result-banner-none");
    if (myLastResult.choice === null) {
      banner.classList.add("result-banner-none");
      $("result-emoji").textContent = "⌛";
      $("result-title").textContent = "沒來得及作答";
    } else if (myLastResult.correct) {
      banner.classList.add("result-banner-ok");
      $("result-emoji").textContent = "✅";
      $("result-title").textContent = "答對了！";
    } else {
      banner.classList.add("result-banner-bad");
      $("result-emoji").textContent = "❌";
      $("result-title").textContent = "答錯了";
    }
    $("result-sub").textContent = `正確答案：${question.options[correct]}`;
    $("my-score-box").classList.remove("hidden");
    $("my-score").textContent = myLastResult.total;
  } else {
    banner.classList.add("hidden");
    $("my-score-box").classList.add("hidden");
  }

  $("reveal-question").textContent = question.q;
  const optionsWrap = $("reveal-options");
  optionsWrap.innerHTML = "";
  const maxCount = Math.max(1, ...counts);
  question.options.forEach((opt, i) => {
    const row = document.createElement("div");
    row.className = "reveal-row";
    const isCorrect = i === correct;
    row.innerHTML = `
      <div class="reveal-pill opt-${i}" style="opacity:${isCorrect ? 1 : 0.5}">
        <span class="opt-shape">${OPT_SHAPES[i]}</span><span>${opt}</span>${isCorrect ? " ✓" : ""}
      </div>
      <div class="reveal-bar-track"><div class="reveal-bar-fill" style="width:${role === "host" ? (counts[i] / maxCount) * 100 : 0}%"></div></div>
      <div class="reveal-count">${role === "host" ? counts[i] : ""}</div>
    `;
    optionsWrap.appendChild(row);
  });
  $("reveal-fact").textContent = "💡 " + fact;

  const advanceBtn = $("btn-advance");
  const waitingHost = $("waiting-host");
  if (role === "host") {
    advanceBtn.classList.remove("hidden");
    advanceBtn.textContent = (isLast ? "查看排行榜" : "下一題") + " →";
    advanceBtn.onclick = () => socket.emit("host:advance", {}, () => {});
    waitingHost.classList.add("hidden");
  } else {
    advanceBtn.classList.add("hidden");
    waitingHost.classList.remove("hidden");
  }

  const miniBoard = $("mini-leaderboard");
  miniBoard.innerHTML = "";
  if (role === "host" && top3.length > 0) {
    const label = document.createElement("p");
    label.className = "muted small";
    label.style.marginTop = "16px";
    label.textContent = "目前排行榜前三名";
    miniBoard.appendChild(label);
    top3.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "leader-row";
      row.innerHTML = `<span>${i + 1}. ${p.name}</span><span class="pts">${p.pts} 分</span>`;
      miniBoard.appendChild(row);
    });
  }

  show("screen-reveal");
});

/* ---------------- phase ended (main/extra wrap-up) ---------------- */
socket.on("game:phaseEnded", ({ status, leaderboard, canContinueExtra }) => {
  if (role === "host") {
    $("phase-ended-title").textContent = status === "mainEnded" ? "正賽 10 題結束！" : "延長賽這題結束！";
    const board = $("phase-leaderboard");
    board.innerHTML = "";
    leaderboard.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "leader-row";
      row.innerHTML = `<span>${i + 1}. ${p.name}</span><span class="pts">${p.pts} 分</span>`;
      board.appendChild(row);
    });
    $("btn-start-extra").classList.toggle("hidden", status !== "mainEnded");
    $("btn-continue-extra").classList.toggle("hidden", !canContinueExtra);
    show("screen-phase-ended");
  } else {
    $("player-phase-ended-title").textContent = status === "mainEnded" ? "正賽結束！" : "延長賽這題結束！";
    $("player-phase-score").textContent = myLastResult ? myLastResult.total : 0;
    show("screen-player-phase-ended");
  }
});

$("btn-start-extra").onclick = () => socket.emit("host:startExtra", {}, () => {});
$("btn-continue-extra").onclick = () => socket.emit("host:advance", {}, () => {});
$("btn-finish").onclick = () => socket.emit("host:finish", {}, () => {});

/* ---------------- finished ---------------- */
socket.on("game:finished", ({ leaderboard }) => {
  const podium = $("podium");
  podium.innerHTML = "";
  const top3 = leaderboard.slice(0, 3);
  const order = [top3[1], top3[0], top3[2]];
  const heights = [90, 120, 70];
  const colors = ["#3D5A80", "#E8354C", "#1BA098"];
  const ranks = [2, 1, 3];
  order.forEach((p, i) => {
    if (!p) { podium.appendChild(document.createElement("div")); return; }
    const col = document.createElement("div");
    col.className = "podium-col";
    col.innerHTML = `
      <div class="podium-block" style="height:${heights[i]}px;background:${colors[i]}"><span>${ranks[i]}</span></div>
      <div class="podium-name">${p.name}</div>
      <div class="podium-pts">${p.pts} 分</div>
    `;
    podium.appendChild(col);
  });

  const board = $("final-leaderboard");
  board.innerHTML = "";
  if (leaderboard.length === 0) {
    board.innerHTML = `<p class="muted center">沒有玩家資料</p>`;
  } else {
    leaderboard.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "leader-row";
      row.innerHTML = `<span>${i + 1}. ${p.name}</span><span class="pts">${p.pts} 分</span>`;
      board.appendChild(row);
    });
  }

  $("final-note").textContent = role === "player" ? `辛苦了，${myName}！你的最終分數是 ${myLastResult ? myLastResult.total : 0} 分。` : "";
  show("screen-finished");
});

socket.on("game:hostLeft", () => {
  alert("主持人已離開，遊戲結束。");
  window.location.href = window.location.pathname;
});
