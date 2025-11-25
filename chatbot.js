/* ====== CHATBOT TOÁN 8 - NÂNG CẤP CHIỀU SÂU ====== */
/* Tác giả: bản nâng cấp cho THCS, dùng kho tri thức giới hạn Chương I–III */

let knowledgeBase = [];

/* 1) TẢI DỮ LIỆU CHATBOT */
async function loadChatbotData() {
  try {
    const res = await fetch(`chatbot_data.json?ts=${Date.now()}`);
    knowledgeBase = await res.json();
    console.log("Chatbot data loaded:", knowledgeBase.length, "items");
  } catch (e) {
    console.error("Không tải được chatbot_data.json", e);
    knowledgeBase = [];
  }
}
loadChatbotData();

/* 2) CHUẨN HÓA CÂU HỎI (BỎ DẤU, CHỮ THƯỜNG, BỎ KÝ TỰ LẠ) */
function normalizeText(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* 3) CHẤM ĐIỂM KHỚP: KEYWORDS + SYNONYMS + CÂU MẪU */
function scoreMatch(userQ, item) {
  let score = 0;

  // keywords (cụm từ chính)
  (item.keywords || []).forEach(kw => {
    if (userQ.includes(kw)) score += 3;
  });

  // synonyms (nhiều cách học sinh hỏi)
  (item.synonyms || []).forEach(syn => {
    const s = normalizeText(syn);
    if (userQ.includes(s)) score += 2;
  });

  // trùng mạnh với câu mẫu
  if (userQ.includes(item.question)) score += 6;

  return score;
}

/* 4) TÌM CÂU TRẢ LỜI PHÙ HỢP NHẤT */
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
      answer: "Mình chưa chắc câu này 😅 Bạn thử hỏi rõ hơn hoặc theo chủ đề: đơn thức/đa thức, hằng đẳng thức, tứ giác...",
      steps: [],
      note: null,
      related_topics: [],
      link: null,
      topic: "unknown"
    };
  }

  return best;
}

/* 5) HIỂN THỊ TIN NHẮN */
function addMessage(text, who = "bot") {
  const log = document.getElementById("chat-log");
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.innerHTML = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;

  // render LaTeX nếu có MathJax
  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([div]);
  }
}

/* 6) LƯU LỊCH SỬ HỎI ĐỂ CÁ NHÂN HÓA (LOCALSTORAGE) */
function saveHistory(userQ, topic) {
  const key = "chat_history";
  const old = JSON.parse(localStorage.getItem(key) || "[]");
  old.push({
    q: userQ,
    topic: topic || "unknown",
    t: Date.now()
  });
  localStorage.setItem(key, JSON.stringify(old.slice(-50))); // giữ 50 câu gần nhất
}

function getTopTopics() {
  const key = "chat_history";
  const old = JSON.parse(localStorage.getItem(key) || "[]");
  const freq = {};
  old.forEach(it => {
    freq[it.topic] = (freq[it.topic] || 0) + 1;
  });
  return Object.entries(freq)
    .sort((a,b) => b[1]-a[1])
    .slice(0,2)
    .map(x => x[0]);
}

/* 7) GỬI TIN NHẮN + TRẢ LỜI THEO CHIỀU SÂU */
function sendMessage() {
  const input = document.getElementById("user-input");
  const userText = input.value.trim();
  if (!userText) return;

  addMessage(userText, "user");
  input.value = "";

  const result = findBestAnswer(userText);

  let botText = result.answer || "";

  // steps theo từng bước
  if (result.steps && result.steps.length > 0) {
    botText += "<br><b>Cách hiểu / cách làm:</b><ol>";
    result.steps.forEach(st => {
      botText += `<li>${st}</li>`;
    });
    botText += "</ol>";
  }

  // note lỗi hay gặp
  if (result.note) {
    botText += `<br><b>Lưu ý:</b> ${result.note}`;
  }

  // gợi ý ôn theo related_topics
  if (result.related_topics && result.related_topics.length > 0) {
    botText += "<br><b>Gợi ý ôn thêm:</b> ";
    botText += result.related_topics.map(t => `#${t}`).join(", ");
  }

  // link về quiz
  if (result.link) {
    botText += `<br><small>👉 Ôn thêm: <a href="${result.link}">mở phần ôn tập</a></small>`;
  }

  addMessage(botText, "bot");
  saveHistory(userText, result.topic);
}

/* 8) GÁN SỰ KIỆN & LỜI CHÀO */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("send-btn");
  const input = document.getElementById("user-input");

  if (btn) btn.onclick = sendMessage;
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
  }

  const tops = getTopTopics();
  if (tops.length > 0 && tops[0] !== "unknown") {
    addMessage(`Chào bạn! Mình thấy bạn hay hỏi về: <b>${tops.join(", ")}</b>. Bạn muốn ôn phần nào tiếp?`);
  } else {
    addMessage("Chào bạn! Mình là chatbot hỗ trợ ôn Toán 8 (Chương I–III). Bạn muốn hỏi phần nào?");
  }
});
