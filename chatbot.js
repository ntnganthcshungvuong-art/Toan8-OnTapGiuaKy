let knowledgeBase = [];

async function loadChatbotData() {
  const res = await fetch("chatbot_data.json");
  knowledgeBase = await res.json();
}
loadChatbotData();

// bỏ dấu + chuẩn hóa chữ
function normalizeText(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")  // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9\s]/g, " ")                     // bỏ ký tự lạ
    .replace(/\s+/g, " ").trim();                    // bỏ khoảng trắng thừa
}

function scoreMatch(userQ, item) {
  let score = 0;
  item.keywords.forEach(kw => {
    if (userQ.includes(kw)) score += 2;
  });

  // cộng thêm điểm nếu giống gần full câu hỏi mẫu
  if (userQ.includes(item.question)) score += 5;
  return score;
}

function findBestAnswer(userInput) {
  const q = normalizeText(userInput);

  let best = null;
  let bestScore = 0;

  for (const item of knowledgeBase) {
    const s = scoreMatch(q, item);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }

  if (!best || bestScore < 2) {
    return {
      answer: "Mình chưa chắc câu này 😅 Bạn thử hỏi lại rõ hơn hoặc chọn chủ đề nhé: phân thức / phương trình / hình học.",
      link: null
    };
  }

  return best;
}

function addMessage(text, who="bot") {
  const log = document.getElementById("chat-log");
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.innerHTML = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function sendMessage() {
  const input = document.getElementById("user-input");
  const userText = input.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  input.value = "";

  const result = findBestAnswer(userText);

  let botText = result.answer;
  if (result.link) {
    botText += `<br><small>👉 Ôn thêm ở đây: <a href="${result.link}">bài liên quan</a></small>`;
  }

  addMessage(botText, "bot");
}
