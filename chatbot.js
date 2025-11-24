let knowledgeBase = [];

// 1) tải dữ liệu
async function loadChatbotData() {
  try {
    const res = await fetch(`chatbot_data.json?ts=${Date.now()}`);
    knowledgeBase = await res.json();
  } catch (e) {
    console.error("Không tải được chatbot_data.json", e);
  }
}
loadChatbotData();

// 2) chuẩn hóa câu hỏi (bỏ dấu, chữ thường, bỏ ký tự lạ)
function normalizeText(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// 3) chấm điểm khớp theo keywords
function scoreMatch(userQ, item) {
  let score = 0;
  (item.keywords || []).forEach(kw => {
    if (userQ.includes(kw)) score += 2;
  });
  if (userQ.includes(item.question)) score += 5;
  return score;
}

// 4) tìm câu trả lời tốt nhất
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
      answer: "Mình chưa chắc câu này 😅 Bạn thử hỏi rõ hơn hoặc theo chủ đề: phân thức / phương trình / tứ giác / tam giác...",
      link: null
    };
  }

  return best;
}

// 5) hiển thị tin nhắn
function addMessage(text, who = "bot") {
  const log = document.getElementById("chat-log");
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.innerHTML = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;

  // Nếu có LaTeX thì typeset lại
  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([div]);
  }
}

// 6) gửi tin nhắn
function sendMessage() {
  const input = document.getElementById("user-input");
  const userText = input.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  input.value = "";

  const result = findBestAnswer(userText);

  let botText = result.answer;
  if (result.link) {
    botText += `<br><small>👉 Ôn thêm: <a href="${result.link}">mở phần ôn tập</a></small>`;
  }

  addMessage(botText, "bot");
}

// 7) gán sự kiện nút gửi + Enter
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("send-btn").onclick = sendMessage;
  document.getElementById("user-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // lời chào
  addMessage("Chào bạn! Mình là chatbot hỗ trợ ôn Toán 8. Bạn muốn hỏi phần nào?");
});
