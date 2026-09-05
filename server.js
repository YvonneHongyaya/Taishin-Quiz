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
  // ---- 正賽 10 題 ----
  { q: "台新金控大樓的前身是哪間酒店？", options: ["國賓大飯店", "財神酒店", "環亞飯店", "中泰賓館"], correct: 1, fact: "財神酒店 1978 年開幕，曾是仁愛圓環旁盛極一時的五星級飯店，1982 年歇業後荒廢近 20 年。" },
  { q: "台新金控大樓是由哪個知名建築團隊操刀設計？", options: ["貝聿銘聯合建築事務所", "姚仁喜大元建築工場", "李祖原建築師事務所", "日建設計"], correct: 0, fact: "貝聿銘聯合建築事務所操刀，以「水滴、書脊、燈籠」為設計理念。" },
  { q: "台新銀行是哪一年正式開業的？", options: ["1990年", "1992年", "1995年", "2000年"], correct: 1, fact: "台新銀行 1992 年 3 月 23 日正式營業。" },
  { q: "2002年台新金控成立時，是與哪家銀行以股份互換方式共同成立？", options: ["大安銀行", "中興銀行", "萬通銀行", "泛亞銀行"], correct: 0, fact: "台新金控成立後隨即以台新銀行為存續銀行，整併兩家銀行。" },
  { q: "台新銀行文化藝術基金會是哪一年成立的？", options: ["1999年", "2001年", "2003年", "2005年"], correct: 1, fact: "由吳東亮出資成立，隔年隨即開辦「台新藝術獎」。" },
  { q: "台新銀行（台新金控）的官方 Instagram 帳號別名叫什麼？", options: ["圓環旁的說書人", "敦南街角的旅人", "台北灣旁的觀察者", "大安森林的守護者"], correct: 0, fact: "台新金控大樓正好座落在仁愛圓環旁，這個別名呼應了這個地標。" },
  { q: "台新銀行是哪一年開辦「網路銀行」服務？", options: ["1998年", "2000年", "2003年", "2006年"], correct: 1, fact: "此後台新銀行也持續投入數位金融服務的發展。" },
  { q: "台新銀行首家「數位示範分行」是在台北市哪個行政區開幕的？", options: ["內湖區", "信義區", "大安區", "松山區"], correct: 0, fact: "分行內首度亮相智能音箱「Rose」，可直接與客戶對話互動。" },
  { q: "目前台新銀行在海外共設有幾間分行、代表處或辦事處？", options: ["5間", "10間", "15間", "20間"], correct: 1, fact: "台新銀行國內共有 101 間分行，海外則有 10 間分行、代表處或辦事處。" },
  { q: "台新 Richart 數位銀行的名稱來源，其背後寓意結合了什麼概念？", options: ["Rich 與 Art（豐富與藝術）", "Rich 與 Heart（富裕與用心）", "Right 與 Smart（精準與聰明）", "Real 與 Chart（真實與走勢）"], correct: 0, fact: "Richart 強調把生活美學與數位金融結合在一起。" },
  // ---- 延長賽備用 10 題 ----
  { q: "財神酒店拆除改建為台新金控大樓時，建築立面大量採用了什麼材質展現氣度？", options: ["巴西金黃花崗石搭配大片帷幕玻璃", "義大利純白大理石", "德國深灰清水混凝土", "仿古紅磚與鈦合金條"], correct: 0, fact: "大片帷幕玻璃搭配金黃花崗石，讓大樓在仁愛圓環旁格外醒目。" },
  { q: "台新 Richart 數位帳戶的吉祥物狗狗，脖子上戴著什麼代表性的配件？", options: ["紅色領結", "金色鈴鐺", "藍色小狗項圈", "綠色小領帶"], correct: 0, fact: "這隻狗狗吉祥物是 Richart 品牌識別的重要角色。" },
  { q: "台新銀行近年推出的「台新 Richart Life」App，在生態圈中的核心定位是什麼？", options: ["專屬海外留學專區", "生活金融與點數兌換整合平台", "股票期貨操盤專用工具", "企業大額跨國電匯系統"], correct: 1, fact: "App 把日常消費點數與金融服務整合在同一個生活圈裡。" },
  { q: "台新金控大樓頂樓設有停機坪，當初在大樓興建設計時，其外觀頂部呈現什麼獨特造型？", options: ["微微弧形向後退縮的斜頂冠冕", "完美的東方八角金字塔", "巨大懸浮式圓形飛碟造型", "雙塔哥德式尖錐尖頂"], correct: 0, fact: "這個「斜頂冠冕」造型也是整棟建築設計語彙的收尾。" },
  { q: "台新發行的熱門網購神卡「@GoGo 卡」，卡面上印有發光 LED 效果的經典吉祥物別稱是什麼？", options: ["酷貓卡", "閃電犬", "黑狗卡", "灰狼卡"], correct: 2, fact: "「黑狗卡」的發光卡面設計曾是話題十足的行銷亮點。" },
  { q: "台新長期深耕女子高爾夫球運動，曾簽約贊助多年、榮登世界球后的台灣知名名將是誰？", options: ["戴資穎", "盧曉晴", "錢珮芸", "曾雅妮"], correct: 3, fact: "曾雅妮曾登上世界球后寶座，是台灣體壇的代表性人物。" },
  { q: "台新銀行在台灣金融史上，曾於哪一年合併「大安商業銀行」，大幅擴增分行與資產規模？", options: ["1998 年", "2010 年", "2002 年", "2015 年"], correct: 2, fact: "2002 年台新金控成立後，隨即整併大安銀行。" },
  { q: "走進台新銀行的實體分行時，全台分行空間與貴賓理財中心所散發的專屬「品牌香氛」以何種基調為主？", options: ["濃郁重焙研磨咖啡香", "專屬特調綠茶柑橘木質調", "甜美草莓香草果香", "傳統檀香線香基調"], correct: 1, fact: "品牌香氛也是台新銀行經營顧客體驗細節的一環。" },
  { q: "台新銀行為響應綠色永續金融，首創並推廣過哪種以「回收廢棄材料／植物原料」製作的環保信用卡？", options: ["廢棄輪胎再生橡膠卡", "牡蠣殼研磨再生複合卡", "廢棄咖啡渣高壓成型卡", "聚乳酸 (PLA) 綠色環保卡"], correct: 3, fact: "PLA 是一種可從植物澱粉提煉的環保材質。" },
  { q: "台新銀行財富管理連續多年獲得國內外評鑑大獎，其財富管理主打的核心服務精神口號為？", options: ["認真，讓美好永續", "誠信為本，智慧理財", "專注您的財富每一步", "富足人生，始於台新"], correct: 0, fact: "這句口號延續了台新銀行一貫「認真」的品牌調性。" },
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
