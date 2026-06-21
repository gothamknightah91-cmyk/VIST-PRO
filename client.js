let ws;
let myName = "";
let currentRoom = "";
let currentTurn = "";
let myHand = [];

/* =====================
   ON LOAD
===================== */
window.onload = () => {
  window.chat = document.getElementById("messages");

  const createBtn = document.getElementById("createRoomBtn");
  const joinBtn = document.getElementById("joinBtn");

  if (createBtn) createBtn.onclick = createRoom;
  if (joinBtn) joinBtn.onclick = joinRoom;

  document.getElementById("sendBtn").onclick = sendChat;
  document.getElementById("msg").addEventListener("keydown", e => {
    if (e.key === "Enter") sendChat();
  });
};

/* =====================
   CONNECT
===================== */
function connect(onReady) {
  ws = new WebSocket("wss://card-game-server-71ec.onrender.com");

  ws.onopen = () => {
    if (onReady) onReady();
  };

  ws.onerror = () => {
    alert("Не може да се свърже със сървъра");
  };

  ws.onmessage = handleMessage;
}

/* =====================
   CARD → FILE
===================== */
function cardToFile(card) {
  const suitMap = { "♠":"S", "♥":"H", "♦":"D", "♣":"C" };
  return `cards/${card.slice(1)}${suitMap[card[0]]}.png`;
}

/* =====================
   MESSAGES
===================== */
function handleMessage(e) {
  const data = JSON.parse(e.data);

  if (data.type === "PLAYER_JOINED") {
    document.getElementById("lobbyStatus").innerText =
      `Играчите в стаята: ${data.count}/4`;
  }

  if (data.type === "game") {
    document.getElementById("status").innerText = data.text;
  }

 if (data.type === "chat") {
  const box = document.getElementById("messages");
  if (!box) return;

  box.innerHTML += `<div><b>${data.name}:</b> ${data.text}</div>`;
  box.scrollTop = box.scrollHeight;
}


  /* ✅ ТОВА Е ПРАВИЛНИЯТ START TRIGGER */
  if (data.type === "hand") {
    document.getElementById("login").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("table").innerHTML = "";

    myHand = data.cards;
    showHand(myHand);

    drawBacks("opponent-top", 13);
    drawBacks("opponent-left", 13);
    drawBacks("opponent-right", 13);
  }

  if (data.type === "turn") {
    currentTurn = data.player;
    document.getElementById("turn").innerText =
      "На ход е: " + data.player;
  }

  if (data.type === "played") {
    addToTable(data.card);

    if (data.player === myName) {
      myHand = myHand.filter(c => c !== data.card);
      showHand(myHand);
    } else {
      removeOpponentCard();
    }
  }

  if (data.type === "clearTable") {
    document.getElementById("table").innerHTML = "";
  }

  if (data.type === "scores") {
    let html = "<h3>Резултат</h3>";
    for (let p in data.scores) {
      html += `<div>${p}: ${data.scores[p]} т.</div>`;
    }
    document.getElementById("scores").innerHTML = html;
  }

  /* ===== TRUMP PHASE ===== */
  if (data.type === "TRUMP_SELECT") {
    if (data.player === myName) {
      document.getElementById("trumps").classList.remove("hidden");
    } else {
      document.getElementById("trumps").classList.add("hidden");
    }
  }

  if (data.type === "TRUMP_SET") {
    document.getElementById("status").innerText =
      "Коз: " + data.suit;
    document.getElementById("trumps").classList.add("hidden");
  }
}

/* =====================
   CREATE ROOM
===================== */
function createRoom() {
  myName = document.getElementById("name").value.trim();
  if (!myName) return alert("Въведи име");

  currentRoom = Math.random().toString(36).substring(2,8).toUpperCase();
  document.getElementById("room").value = currentRoom;

  connect(() => {
    ws.send(JSON.stringify({
      type: "CREATE_ROOM",
      name: myName,
      room: currentRoom
    }));
  });
}

/* =====================
   JOIN ROOM
===================== */
function joinRoom() {
  myName = document.getElementById("name").value.trim();
  currentRoom = document.getElementById("room").value.trim().toUpperCase();

  if (!myName || !currentRoom) {
    alert("Въведи име и код");
    return;
  }

  connect(() => {
    ws.send(JSON.stringify({
      type: "JOIN_ROOM",
      name: myName,
      room: currentRoom
    }));
  });
}

/* =====================
   HAND
===================== */
function showHand(cards) {
  const suitOrder = { "♠":0, "♥":1, "♣":2, "♦":3 };
  const rankOrder = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

  cards.sort((a,b) => {
    if (suitOrder[a[0]] !== suitOrder[b[0]])
      return suitOrder[a[0]] - suitOrder[b[0]];
    return rankOrder.indexOf(a.slice(1)) - rankOrder.indexOf(b.slice(1));
  });

  const hand = document.getElementById("hand");
  hand.innerHTML = "";

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<img src="${cardToFile(card)}">`;

    div.onclick = () => {
      if (currentTurn !== myName) return;
      play(card);
    };

    hand.appendChild(div);
  });
}

/* =====================
   TABLE
===================== */
function addToTable(card) {
  const table = document.getElementById("table");
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `<img src="${cardToFile(card)}">`;
  table.appendChild(div);
}

/* =====================
   OPPONENTS
===================== */
function drawBacks(id, count) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = "";
  for (let i = 0; i < count; i++) {
    el.innerHTML += `<div class="back-card"><img src="cards/back.png"></div>`;
  }
}

function removeOpponentCard() {
  const ids = ["opponent-top","opponent-left","opponent-right"];
  for (let id of ids) {
    const el = document.getElementById(id);
    if (el && el.children.length) {
      el.removeChild(el.lastChild);
      break;
    }
  }
}

/* =====================
   CHAT
===================== */
function sendChat() {
  const input = document.getElementById("msg");
  const text = input.value.trim();
  if (!text) return;

  ws.send(JSON.stringify({
    type: "chat",
    room: currentRoom,   // 🔑 ЛИПСВАШЕ ТОВА
    name: myName,        // 🔑 ЛИПСВАШЕ ТОВА
    text
  }));

  input.value = "";
}


/* =====================
   PLAY
===================== */
function play(card) {
  if (currentTurn !== myName) return;
  ws.send(JSON.stringify({ type:"play", card, room: currentRoom }));
}

/* =====================
   TRUMP SELECT
===================== */
function chooseTrump(suit) {
  ws.send(JSON.stringify({ type:"SET_TRUMP", suit }));
  document.getElementById("trumps").classList.add("hidden");
}