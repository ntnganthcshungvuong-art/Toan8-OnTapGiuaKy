/* ====== CHATBOT TOÁN 8 - BẢN CHỐNG NHẦM TẬN GỐC ====== */

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

/* 2) CHUẨN HÓA CÂU HỎI */
function normalizeText(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* 3) STOPWORDS: từ rất chung -> KHÔNG tính điểm */
const STOP_WORDS = [
  "la","gi","the","nao","nhu","mot","hai","ba","bon","nam",
  "co","va","cua","cho","ve","trong","bang","tai","khi","em","ban",
  "khai","niem","dinh","nghia","cong","thuc","tinh","chat","dau","hieu"
];

function tokenize(text){
  return normalizeText(text).split(" ").filter(Boolean);
}

function filterImportantTokens(tokens){
  return tokens.filter(t => !STOP_WORDS.includes(t));
}

/* 4) TẠO TẬP TỪ KHÓA CỦA 1 MỤC KIẾN THỨC */
function buildItemTokens(item){
  let text = (item.question || "") + " ";
  text += (item.keywords || []).join(" ") + " ";
  text += (item.synonyms || []).join(" ");
  return filterImportantTokens(tokenize(text));
}

/* 5) CHẤM ĐIỂM KHỚP (ƯU TIÊN GIAO NHAU TỪ QUAN TRỌNG) */
function scoreMatch(userQ, item){
  const userTokens = filterImportantTokens(tokenize(userQ));
  const itemTokens = buildItemTokens(item);

  let score = 0;

  // 5.1) điểm theo số từ quan trọng trùng nhau
  let overlap = 0;
  userTokens.forEach(t => {
    if (itemTokens.includes(t)) overlap += 1;
  });
  score += overlap * 3;  // mỗi từ trùng = +3 điểm

  // 5.2) cộng thêm nếu khớp đúng cả CỤM keyword/synonym
  (item.keywords || []).forEach(kw => {
    const kwn = normalizeText(kw);
    if (kwn && kwn.includes(" ") && userQ.includes(kwn)) score += 4;
  });

  (item.synonyms || []).forEach(syn => {
    const synn = normalizeText(syn);
    if (synn && synn.includes(" ") && userQ.includes(synn)) score += 3;
  });

  // 5.3) khớp mạnh với câu mẫu
  if (item.question && userQ.includes(item.question)) score += 6;

  return score;
}

/* 6) TÌM CÂU TRẢ LỜI TỐT NHẤT */
function findBestAnswer(userInput){
  const q = normalizeText(userInput);

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
