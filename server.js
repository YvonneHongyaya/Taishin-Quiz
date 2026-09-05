const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

/* ---------------------------------------------------------
   台新知識王 — 題庫（正確答案只存在伺服器記憶體，不會傳給
   還沒公布答案的玩家，避免用瀏覽器開發工具偷看答案）
--------------------------------------------------------- */
const ALL_QUESTIONS = [
  { q: "台新金控大樓的前身是哪間酒店？", options: ["國賓大飯店", "財神酒店", "環亞飯店", "中泰賓館"], correct: 1, fact: "財神酒店 1978 年開幕，曾是東南亞十大旅館之一，閒置荒廢近 20 年後才由台新集團買下改建。" },
  { q: "財神酒店舊址是哪一年正式拆除、改建成台新金控大樓的？", options: ["1998年", "2000年", "2004年", "2008年"], correct: 2, fact: "拆除後歷經整地興建，2006 年 3 月 23 日台新金控大樓正式啟用。" },
  { q: "台新金控大樓是由哪個知名建築團隊操刀設計？", options: ["貝聿銘聯合建築事務所", "姚仁喜大元建築工場", "李祖原建築師事務所", "日建設計"], correct: 0, fact: "整棟大樓以「水滴、書脊、燈籠」為設計概念，呼應仁愛圓環的景觀意象。" },
  { q: "台新銀行是哪一年正式開業的？", options: ["1990年", "1992年", "1995年", "2000年"], correct: 1, fact: "台新銀行由吳東亮邀集企業界好友共同發起創設，1992 年 3 月 23 日正式開業。" },
  { q: "台新銀行創立初期（1992年開業）的資本額為新台幣多少元？", options: ["50億元", "100億元", "150億元", "200億元"], correct: 1, fact: "當時主要股東包括新光紡織、味全、味王、東元電機等知名企業。" },
  { q: "2002年台新金控成立時，是與哪家銀行以股份互換方式共同成立？", options: ["大安銀行", "中興銀行", "萬通銀行", "泛亞銀行"], correct: 0, fact: "台新金控成立後隨即將兩家銀行整併，以台新銀行為存續銀行。" },
  { q: "台新銀行是哪一年開辦「網路銀行」服務？", options: ["1998年", "2000年", "2003年", "2006年"], correct: 1, fact: "此後台新銀行也持續投入數位金融服務的發展。" },
  { q: "玫瑰卡最經典、深植人心的廣告詞是？", options: ["認真的女人最美麗", "愛她就給她最好的", "簡單生活", "用心生活"], correct: 0, fact: "這句廣告詞 1997 年還拿下「廣告流行金句獎」銀獎。" },
  { q: "玫瑰卡是哪一年開始發行的？", options: ["1993年", "1995年", "1998年", "2000年"], correct: 1, fact: "玫瑰卡上市不到一年多，發卡量就衝破 11 萬張。" },
  { q: "台新銀行文化藝術基金會是哪一年成立的？", options: ["1999年", "2001年", "2003年", "2005年"], correct: 1, fact: "由吳東亮出資成立，隔年隨即開辦「台新藝術獎」。" },
  { q: "「台新藝術獎」第一屆是哪一年開辦的？", options: ["2000年", "2002年", "2005年", "2008年"], correct: 1, fact: "首屆得獎作品包括黃明川《解放前衛》等重要創作。" },
  { q: "台新藝術獎不分類的「年度大獎」獎金是新台幣多少元？", options: ["50萬元", "100萬元", "150萬元", "200萬元"], correct: 2, fact: "這是國內支持當代藝術獎項中金額最高的獎金。" },
  { q: "2006年入股台新金控私募案的外資中，「不包含」下列哪一個？", options: ["新橋投資集團", "野村證券集團", "索羅斯基金管理公司", "高盛集團"], correct: 3, fact: "新橋投資、野村證券、索羅斯基金旗下的 QE International 皆曾先後入股台新金控。" },
  { q: "台新金控大樓座落在台北市哪兩條路交會的圓環旁？", options: ["仁愛路、敦化南路", "忠孝東路、復興南路", "信義路、基隆路", "南京東路、松江路"], correct: 0, fact: "這個圓環號稱是「世界第二大圓環」。" },
  { q: "2025年台新金控與哪家金控合併，並更名為「台新新光金控」？", options: ["國泰金控", "新光金控", "元大金控", "兆豐金控"], correct: 1, fact: "合併後新光金控走入歷史，原新光銀行預計 2027 年併入台新銀行。" },
  { q: "台新銀行1998年併購了哪家信用合作社，藉此擴張版圖？", options: ["台南市第一信用合作社", "高雄五信", "台中十信", "基隆一信"], correct: 0, fact: "當時併購金額約新台幣 6.37 億元。" },
  { q: "2009年，台新金控子公司台証證券將經紀業務與通路資產，以新台幣多少元賣給凱基證券？", options: ["194億元", "294億元", "394億元", "494億元"], correct: 1, fact: "同年12月台証證券正式併入凱基證券，凱基也躍居經紀市占率第二大券商。" },
  { q: "台新銀行首家「數位示範分行」是在台北市哪個行政區開幕的？", options: ["內湖區", "信義區", "大安區", "松山區"], correct: 0, fact: "分行內首度亮相智能音箱「Rose」，可直接與客戶對話互動。" },
  { q: "目前台新銀行在海外共設有幾間分行、代表處或辦事處？", options: ["5間", "10間", "15間", "20間"], correct: 1, fact: "台新銀行國內共有 101 間分行，海外則有 10 間分行、代表處或辦事處。" },
  { q: "台新金控大樓完工後，樓高約為多少公尺？", options: ["88公尺", "101公尺", "124公尺", "150公尺"], correct: 2, fact: "大樓地下6層、地上24層，高度約124公尺。" },
];

const MAIN_COUNT = 10;
const MAIN_QUESTIONS = ALL_QUESTIONS.slice(0, MAIN_COUNT);
const EXTRA_QUESTIONS = ALL_QUESTIONS.slice(MAIN_COUNT);
const DURATION = 15000; // 每題作答時間（毫秒）

function poolFor(phase) {
  return phase === "extra" ? EXTRA_QUESTIONS : MAIN_QUESTIONS;
}
function shuffledOrder(n) {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 排除容易看錯的 0/O/1/I
  let code;
  do {
    code = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}
function pointsFor(ms) {
  const frac = Math.max(0, Math.min(1, ms / DURATION));
  return Math.round(1000 - 800 * frac);
}
function publicQuestion(phase, qIndex) {
  const q = poolFor(phase)[qIndex];
  return { q: q.q, options: q.options };
}

/* rooms: code -> room state */
const rooms = new Map();

function newRoom(hostSocketId) {
  return {
    hostSocketId,
    status: "lobby", // lobby | question | reveal | mainEnded | extraEnded | finished
    phase: "main", // main | extra
    mainOrder: shuffledOrder(MAIN_QUESTIONS.length),
    extraOrder: shuffledOrder(EXTRA_QUESTIONS.length),
    qi: 0,
    qStart: null,
    players: new Map(), // socketId -> { name, score }
    answers: new Map(), // `${phase}:${qi}` -> Map(socketId -> {choice, ms})
    timer: null,
  };
}

function orderFor(room, phase) {
  return phase === "extra" ? room.extraOrder : room.mainOrder;
}

function leaderboard(room) {
  return Array.from(room.players.entries())
    .map(([id, p]) => ({ id, name: p.name, pts: p.score }))
    .sort((a, b) => b.pts - a.pts);
}

function broadcastLobby(room, code) {
  io.to(code).emit("lobby:update", {
    count: room.players.size,
  });
}

function startQuestion(room, code) {
  room.status = "question";
  room.qStart = Date.now();
  const order = orderFor(room, room.phase);
  const qIndex = order[room.qi];
  room.answers.set(`${room.phase}:${room.qi}`, new Map());
  io.to(code).emit("game:question", {
    phase: room.phase,
    qi: room.qi,
    total: order.length,
    duration: DURATION,
    qStart: room.qStart,
    question: publicQuestion(room.phase, qIndex),
  });
  clearTimeout(room.timer);
  room.timer = setTimeout(() => endQuestion(room, code), DURATION + 300);
}

function endQuestion(room, code) {
  if (room.status !== "question") return;
  clearTimeout(room.timer);
  const order = orderFor(room, room.phase);
  const qIndex = order[room.qi];
  const question = poolFor(room.phase)[qIndex];
  const answerMap = room.answers.get(`${room.phase}:${room.qi}`) || new Map();
  const counts = [0, 0, 0, 0];

  for (const [socketId, ans] of answerMap.entries()) {
    if (ans.choice >= 0 && ans.choice < 4) counts[ans.choice]++;
    const player = room.players.get(socketId);
    if (!player) continue;
    const pts = ans.choice === question.correct ? pointsFor(ans.ms) : 0;
    player.score += pts;
    const sock = io.sockets.sockets.get(socketId);
    if (sock) sock.emit("game:yourResult", { correct: ans.choice === question.correct, choice: ans.choice, pts, total: player.score });
  }
  // players who never answered
  for (const [socketId, player] of room.players.entries()) {
    if (!answerMap.has(socketId)) {
      const sock = io.sockets.sockets.get(socketId);
      if (sock) sock.emit("game:yourResult", { correct: false, choice: null, pts: 0, total: player.score });
    }
  }

  room.status = "reveal";
  io.to(code).emit("game:reveal", {
    phase: room.phase,
    qi: room.qi,
    correct: question.correct,
    fact: question.fact,
    counts,
    isLast: room.qi + 1 >= order.length,
    top3: leaderboard(room).slice(0, 3),
  });
}

io.on("connection", (socket) => {
  socket.data.role = null;
  socket.data.roomCode = null;

  socket.on("host:create", (_payload, ack) => {
    const code = makeRoomCode();
    const room = newRoom(socket.id);
    rooms.set(code, room);
    socket.join(code);
    socket.data.role = "host";
    socket.data.roomCode = code;
    ack && ack({ ok: true, code });
  });

  socket.on("player:join", ({ code, name }, ack) => {
    code = (code || "").toUpperCase().trim();
    const room = rooms.get(code);
    if (!room) return ack && ack({ ok: false, error: "找不到這個遊戲代碼，請確認連結是否正確。" });
    if (room.status !== "lobby") return ack && ack({ ok: false, error: "遊戲已經開始了，請等待下一場。" });
    const cleanName = (name || "玩家").toString().slice(0, 12).trim() || "玩家";
    room.players.set(socket.id, { name: cleanName, score: 0 });
    socket.join(code);
    socket.data.role = "player";
    socket.data.roomCode = code;
    ack && ack({ ok: true });
    broadcastLobby(room, code);
  });

  socket.on("host:start", (_payload, ack) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostSocketId) return ack && ack({ ok: false });
    if (room.players.size === 0) return ack && ack({ ok: false, error: "還沒有人加入遊戲。" });
    room.phase = "main";
    room.qi = 0;
    startQuestion(room, code);
    ack && ack({ ok: true });
  });

  socket.on("player:answer", ({ choice }) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || room.status !== "question") return;
    const key = `${room.phase}:${room.qi}`;
    const answerMap = room.answers.get(key);
    if (!answerMap || answerMap.has(socket.id)) return; // 已經回答過，忽略
    const ms = Date.now() - room.qStart;
    answerMap.set(socket.id, { choice, ms });
    const room2 = room; // clarity
    io.to(room2.hostSocketId).emit("game:answeredCount", { count: answerMap.size });
  });

  socket.on("host:endNow", (_payload, ack) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostSocketId) return ack && ack({ ok: false });
    endQuestion(room, code);
    ack && ack({ ok: true });
  });

  socket.on("host:advance", (_payload, ack) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostSocketId) return ack && ack({ ok: false });
    const order = orderFor(room, room.phase);
    if (room.qi + 1 < order.length) {
      room.qi += 1;
      startQuestion(room, code);
    } else {
      room.status = room.phase === "main" ? "mainEnded" : "extraEnded";
      io.to(code).emit("game:phaseEnded", {
        status: room.status,
        leaderboard: leaderboard(room),
        canContinueExtra: room.status === "extraEnded" && room.qi + 1 < room.extraOrder.length,
      });
    }
    ack && ack({ ok: true });
  });

  socket.on("host:startExtra", (_payload, ack) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostSocketId) return ack && ack({ ok: false });
    room.phase = "extra";
    room.qi = 0;
    startQuestion(room, code);
    ack && ack({ ok: true });
  });

  socket.on("host:finish", (_payload, ack) => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room || socket.id !== room.hostSocketId) return ack && ack({ ok: false });
    room.status = "finished";
    io.to(code).emit("game:finished", { leaderboard: leaderboard(room) });
    ack && ack({ ok: true });
  });

  socket.on("disconnect", () => {
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    if (!room) return;
    if (socket.data.role === "player") {
      room.players.delete(socket.id);
      if (room.status === "lobby") broadcastLobby(room, code);
    } else if (socket.data.role === "host" && socket.id === room.hostSocketId) {
      // 主持人斷線：保留房間一段時間，讓他重新整理後可能還能救回來的情境太複雜，
      // 這裡先簡化為：通知所有玩家遊戲已結束。
      io.to(code).emit("game:hostLeft");
      clearTimeout(room.timer);
      rooms.delete(code);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`台新知識王 server running on port ${PORT}`);
});
