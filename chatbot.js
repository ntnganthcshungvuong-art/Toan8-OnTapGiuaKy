/* ====== CHATBOT TOÁN 8 - BẢN CUỐI (RULE PRIORITY + FUZZY MATCH) ====== */

let knowledgeBase = [];
let dataLoadedOk = false;

/* 1) TẢI DỮ LIỆU CHATBOT */
async function loadChatbotData() {
  try {
    const res = await fetch(`chatbot_data.json?ts=${Date.now()}`);
    if (!res.ok) throw new Error("HTTP " + res.status);

    const json = await res.json();
    if (!Array.isArray(json)) throw new Error("JSON không phải mảng []");

    knowledgeBase = json;
    dataLoadedOk = true;
    console.log("Chatbot data loaded:", knowledgeBase.length, "items");
  } catch (e) {
    console.error("Không tải được chatbot_data.json", e);
    knowledgeBase = [];
    dataLoadedOk = false;
  }
}
loadChatbotData();

/* 2) CHUẨN HÓA CÂU HỎI */
function normalizeText(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text){
  return normalizeText(text).split(" ").filter(Boolean);
}

/* ===== STOPWORDS: từ chung không tính điểm ===== */
const STOP_WORDS = [
  "la","gi","the","nao","nhu","mot","hai","ba","bon","nam",
  "co","va","cua","cho","ve","trong","bang","tai","khi","em","ban",
  "khai","niem","dinh","nghia","cong","thuc","tinh","chat","dau","hieu"
];

function filterImportantTokens(tokens){
  return tokens.filter(t => !STOP_WORDS.includes(t));
}

/* 3) LUẬT ƯU TIÊN (HẰNG ĐẲNG THỨC, KIẾN THỨC TRỌNG TÂM) */
function quickRules(q){
  const has = (w) => q.includes(w);

  // --- Chương II: Hằng đẳng thức đáng nhớ ---
  if (has("binh phuong") && has("tong")) {
    return {
      answer: "Công thức: \\((a+b)^2 = a^2 + 2ab + b^2\\).",
      steps: [
        "Nhớ dạng: bình phương tổng = bình phương số thứ nhất + 2 tích + bình phương số thứ hai.",
        "Áp dụng: \\((a+b)^2=a^2+2ab+b^2\\)."
      ],
      note: "Lỗi hay gặp: quên hạng tử \\(2ab\\).",
      related_topics: ["Bình phương của một hiệu", "Hiệu hai bình phương"],
      link: "#quiz",
      topic: "Chuong II - Hang dang thuc"
    };
  }

  if (has("binh phuong") && has("hieu")) {
    return {
      answer: "Công thức: \\((a-b)^2 = a^2 - 2ab + b^2\\).",
      steps: [
        "Nhớ dạng: bình phương hiệu = bình phương số thứ nhất - 2 tích + bình phương số thứ hai.",
        "Chú ý dấu của \\(-2ab\\)."
      ],
      note: "Sai hay gặp: viết nhầm thành \\(+2ab\\).",
      related_topics: ["Bình phương của một tổng", "Hiệu hai bình phương"],
      link: "#quiz",
      topic: "Chuong II - Hang dang thuc"
    };
  }

  if (has("hieu") && has("hai") && has("binh phuong")) {
    return {
      answer: "Công thức: \\(a^2 - b^2 = (a-b)(a+b)\\).",
      steps: [
        "Nhận dạng biểu thức có dạng \\(a^2-b^2\\).",
        "Tách thành tích \\((a-b)(a+b)\\)."
      ],
      note: "Chỉ dùng khi cả hai vế đều là bình phương.",
      related_topics: ["Bình phương của một tổng", "Phân tích nhân tử"],
      link: "#quiz",
      topic: "Chuong II - Hang dang thuc"
    };
  }

  if (has("tong") && has("hai") && has("lap phuong")) {
    return {
      answer: "Công thức: \\(a^3+b^3=(a+b)(a^2-ab+b^2)\\).",
      steps: [
        "Nhận dạng \\(a^3+b^3\\).",
        "Viết thành \\((a+b)(a^2-ab+b^2)\\)."
      ],
      note: "Trong ngoặc thứ hai là ‘trừ rồi cộng’.",
      related_topics: ["Hiệu hai lập phương", "Phân tích nhân tử"],
      link: "#quiz",
      topic: "Chuong II - Hang dang thuc"
    };
  }

  if (has("hieu") && has("hai") && has("lap phuong")) {
    return {
      answer: "Công thức: \\(a^3-b^3=(a-b)(a^2+ab+b^2)\\).",
      steps: [
        "Nhận dạng \\(a^3-b^3\\).",
        "Viết thành \\((a-b)(a^2+ab+b^2)\\)."
      ],
      note: "Ngoặc thứ hai là ‘cộng rồi cộng’.",
      related_topics: ["Tổng hai lập phương", "Phân tích nhân tử"],
      link: "#quiz",
      topic: "Chuong II - Hang dang thuc"
    };
  }

  return null;
}

/* 4) TẠO TẬP TỪ CỦA 1 MỤC */
function buildItemTokens(item){
  let text = (item.question || "") + " ";
  text += (item.keywords || []).join(" ") + " ";
  text += (item.synonyms || []).join(" ");
  return filterImportantTokens(tokenize(text));
}

/* 5) CHẤM ĐIỂM FUZZY MATCH */
function scoreMatch(userQ, item){
  const userTokens = filterImportantTokens(tokenize(userQ));
  const itemTokens = buildItemTokens(item);

  let score = 0;

  let overlap = 0;
  userTokens.forEach(t => {
    if (itemTokens.includes(t)) overlap += 1;
  });
  score += overlap * 3;

  (item.keywords || []).forEach(kw => {
    const kwn = normalizeText(kw);
    if (kwn && kwn.includes(" ") && userQ.includes(kwn)) score += 4;
  });

  (item.synonyms || []).forEach(syn => {
    const synn = normalizeText(syn);
    if (synn && synn.includes(" ") && userQ.includes(synn)) score += 3;
  });

  if (item.question && userQ.includes(item.question)) score += 6;

  return score;
}

/* 6) TÌM TRẢ LỜI (ƯU TIÊN RULE → SAU ĐÓ FUZZY) */
function findBestAnswer(userInput){
  const q = normalizeText(userInput);

  // 6.1 ưu tiên luật cho kiến thức trọng tâm
  const ruleHit = quickRules(q);
  if (ruleHit) return ruleHit;

  // 6.2 nếu data chưa tải được
  if (!dataLoadedOk || knowledgeBase.length === 0) {
    return {
      answer: "⚠️ Mình chưa tải được dữ liệu kiến thức (chatbot_data.json). Bạn kiểm tra lại file JSON giúp mình nhé.",
      steps: [],
      note: null,
      related_topics: [],
      link: null,
      topic: "unknown"
    };
  }

  // 6.3 fuzzy match
  let best = null;
  let bestScore = 0;

  for(const item of knowledgeBase){
    const s = scoreMatch(q, item);
    if (s > bestScore){
      bestScore = s;
      best = item;
    }
  }

  if(!best || bestScore < 3){
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

/* 7) HIỂN THỊ TIN NHẮN */
function addMessage(text, who="bot"){
  const log = document.getElementById("chat-log");
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.innerHTML = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;

  if(window.MathJax?.typesetPromise){
    MathJax.typesetPromise([div]);
  }
}

/* 8) LƯU LỊCH SỬ HỎI */
function saveHistory(userQ, topic){
  const key="chat_history";
  const old=JSON.parse(localStorage.getItem(key)||"[]");
  old.push({ q:userQ, topic:topic||"unknown", t:Date.now() });
  localStorage.setItem(key, JSON.stringify(old.slice(-50)));
}

function getTopTopics(){
  const key="chat_history";
  const old=JSON.parse(localStorage.getItem(key)||"[]");
  const freq={};
  old.forEach(it=>freq[it.topic]=(freq[it.topic]||0)+1);
  return Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,2).map(x=>x[0]);
}

/* 9) BẤM NÚT CHỦ ĐỀ HỎI NHANH */
function quickAsk(text){
  document.getElementById("user-input").value=text;
  sendMessage();
}

/* 10) GỬI TIN NHẮN */
function sendMessage(){
  const input=document.getElementById("user-input");
  const userText=input.value.trim();
  if(!userText) return;

  addMessage(userText,"user");
  input.value="";

  const result=findBestAnswer(userText);

  let botText=result.answer||"";

  if(result.steps && result.steps.length>0){
    botText += "<br><b>Cách hiểu / cách làm:</b><ol>";
    result.steps.forEach(st=>botText+=`<li>${st}</li>`);
    botText += "</ol>";
  }

  if(result.note){
    botText += `<br><b>Lưu ý:</b> ${result.note}`;
  }

  if(result.related_topics && result.related_topics.length>0){
    botText += "<br><b>Gợi ý ôn thêm:</b> ";
    botText += result.related_topics
      .map(t=>`<button class="topic-btn" onclick="quickAsk('${t}')">${t}</button>`)
      .join(" ");
  }

  if(result.link){
    botText += `<br><small>👉 Ôn thêm: <a href="${result.link}">mở phần ôn tập</a></small>`;
  }

  addMessage(botText,"bot");
  saveHistory(userText,result.topic);
}

/* 11) GÁN SỰ KIỆN + LỜI CHÀO */
document.addEventListener("DOMContentLoaded",()=>{
  const btn=document.getElementById("send-btn");
  const input=document.getElementById("user-input");

  if(btn) btn.onclick=sendMessage;
  if(input){
    input.addEventListener("keydown",(e)=>{
      if(e.key==="Enter") sendMessage();
    });
  }

  const tops=getTopTopics();
  if(tops.length>0 && tops[0]!=="unknown"){
    addMessage(`Chào bạn! Mình thấy bạn hay hỏi về: <b>${tops.join(", ")}</b>. Bạn muốn ôn phần nào tiếp?`);
  }else{
    addMessage("Chào bạn! Mình là chatbot hỗ trợ ôn Toán 8 (Chương I–III). Bạn muốn hỏi phần nào?");
  }
});
