/* ===== CHATBOT TOÁN 8 - FULL ===== */

let knowledgeBase = [];

/* Load data */
async function loadChatbotData() {
  try {
    const res = await fetch(`chatbot_data.json?ts=${Date.now()}`);
    knowledgeBase = await res.json();
    console.log("Chatbot loaded:", knowledgeBase.length);
  } catch (e) {
    console.error("Không tải được chatbot_data.json", e);
    knowledgeBase = [];
  }
}
loadChatbotData();

/* Normalize */
function normalizeText(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* Stop words */
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

/* Build item tokens */
function buildItemTokens(item){
  let text = (item.question || "") + " ";
  text += (item.keywords || []).join(" ") + " ";
  text += (item.synonyms || []).join(" ");
  return filterImportantTokens(tokenize(text));
}

/* Score match */
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

/* Find best answer */
function findBestAnswer(userInput){
  const q = normalizeText(userInput);

  if (!knowledgeBase || knowledgeBase.length === 0) {
    return {
      answer: "⚠️ Mình chưa tải được dữ liệu kiến thức. Bạn kiểm tra chatbot_data.json nhé.",
      steps: [],
      note: null,
      related_topics: [],
      link: null,
      topic: "unknown"
    };
  }

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

/* UI add msg */
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

/* Quick ask button */
function quickAsk(text){
  document.getElementById("user-input").value=text;
  sendMessage();
}
window.quickAsk = quickAsk;

/* Send */
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
}

/* Bind events */
document.addEventListener("DOMContentLoaded",()=>{
  const btn=document.getElementById("send-btn");
  const input=document.getElementById("user-input");

  if(btn) btn.onclick=sendMessage;
  if(input){
    input.addEventListener("keydown",(e)=>{
      if(e.key==="Enter") sendMessage();
    });
  }

  addMessage("Chào bạn! Mình là chatbot hỗ trợ ôn Toán 8 . Bạn muốn hỏi phần nào?");
});
