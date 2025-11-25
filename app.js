/* ===== APP v6: dùng q.topic + chẩn đoán câu sai + hỏi trợ lý ===== */

console.log("✅ app.js v6 loaded");

let allQuestions = [];
let quizQuestions = [];
let quizSubmitted = false;

/* ===== Tabs ===== */
function switchTab(name){
  document.querySelectorAll(".tab-btn").forEach(b=>{
    b.classList.toggle("active", b.dataset.tab===name);
  });
  document.querySelectorAll(".tab-panel").forEach(p=>{
    p.classList.toggle("active", p.id===("tab-"+name));
  });

  if(name==="quiz" && allQuestions.length===0){
    loadQuestions().then(()=> newQuiz10());
  }
}

/* ===== Click handler ===== */
document.addEventListener("click",(e)=>{
  const tabBtn = e.target.closest(".tab-btn");
  if(tabBtn){ switchTab(tabBtn.dataset.tab); return; }

  if(e.target.id==="go-quiz"){ switchTab("quiz"); if(allQuestions.length>0) newQuiz10(); return; }
  if(e.target.id==="go-theory"){ switchTab("theory"); return; }

  if(e.target.id==="quiz-new"){ newQuiz10(); return; }
  if(e.target.id==="quiz-submit"){ gradeQuiz(); return; }

  const theoryBtn = e.target.closest(".theory-btn");
  if(theoryBtn){ showTheory(theoryBtn.dataset.chapter); return; }

  if(e.target.id==="chat-close"){ hideChatFloat(); return; }
  if(e.target.id==="chat-open-btn" || e.target.id==="open-chat"){ showChatFloat(); return; }
});

/* ===== Chat float toggle ===== */
function hideChatFloat(){
  const floatBox = document.getElementById("chat-float");
  const openBtn  = document.getElementById("chat-open-btn");
  if(floatBox) floatBox.classList.add("hidden");
  if(openBtn) openBtn.style.display="block";
}
function showChatFloat(){
  const floatBox = document.getElementById("chat-float");
  const openBtn  = document.getElementById("chat-open-btn");
  if(floatBox) floatBox.classList.remove("hidden");
  if(openBtn) openBtn.style.display="none";
}

/* ===== Load questions.json ===== */
async function loadQuestions(){
  try{
    const res = await fetch(`questions.json?ts=${Date.now()}`);
    allQuestions = await res.json();
    if(!Array.isArray(allQuestions)) allQuestions=[];
    console.log("Loaded questions:", allQuestions.length);
  }catch(e){
    console.error("Không tải được questions.json", e);
    allQuestions=[];
    const area = document.getElementById("quiz-area");
    if(area){
      area.innerHTML = `
        <div class="card" style="color:#b91c1c">
          Lỗi: không tải được questions.json
        </div>`;
    }
  }
}

/* ===== Pick 10 random ===== */
function newQuiz10(){
  quizSubmitted = false;
  if(allQuestions.length===0) return;

  const pool = [...allQuestions];
  shuffle(pool);
  quizQuestions = pool.slice(0,10);

  renderQuiz();
  updateProgress();

  const resBox = document.getElementById("quiz-result");
  if(resBox){
    resBox.style.display="none";
    resBox.innerHTML="";
  }
  window.scrollTo({top:0, behavior:"smooth"});
}

/* ===== Render Quiz ===== */
function renderQuiz(){
  const area = document.getElementById("quiz-area");
  if(!area) return;

  area.innerHTML = "";

  quizQuestions.forEach((q, i)=>{
    const card = document.createElement("div");
    card.className="question-card";
    card.dataset.index=i;

    const label = q.topic || detectTheory(q.question).label;
    card.dataset.theoryLabel = label;
    card.dataset.part = label.includes("Chương III") ? "Hình học" : "Đại số";

    const title = document.createElement("div");
    title.className="question-title";
    title.innerHTML = `<b>Câu ${i+1}.</b> ${q.question||""}`;
    card.appendChild(title);

    (q.options||[]).forEach((opt,j)=>{
      const line = document.createElement("label");
      line.className="option-line";

      const input = document.createElement("input");
      input.type="radio";
      input.name=`q${i}`;
      input.value=j;
      input.onchange=updateProgress;

      const span=document.createElement("span");
      span.innerHTML=opt;

      line.appendChild(input);
      line.appendChild(span);
      card.appendChild(line);
    });

    area.appendChild(card);
  });

  const totalEl = document.getElementById("total-count");
  if(totalEl) totalEl.textContent = quizQuestions.length;

  if(window.MathJax?.typesetPromise){
    MathJax.typesetPromise([area]);
  }
}

/* ===== Progress ===== */
function updateProgress(){
  const total = quizQuestions.length;
  const done = document.querySelectorAll(`#quiz-area input[type=radio]:checked`).length;

  const doneEl = document.getElementById("done-count");
  const totalEl = document.getElementById("total-count");
  const fillEl = document.getElementById("progress-fill");

  if(doneEl) doneEl.textContent=done;
  if(totalEl) totalEl.textContent=total;
  if(fillEl) fillEl.style.width =
    (total===0?0:Math.round(done*100/total))+"%";
}

/* ===== Grade ===== */
function gradeQuiz(){
  if(quizSubmitted) return;
  quizSubmitted=true;

  let right=0;
  let stats = { "Đại số":{r:0,t:0}, "Hình học":{r:0,t:0} };
  let weakTheory = new Map();
  let wrongDetails = [];

  quizQuestions.forEach((q,i)=>{
    const card = document.querySelector(`.question-card[data-index="${i}"]`);
    if(!card) return;

    const part = card.dataset.part;
    const label = card.dataset.theoryLabel;

    stats[part].t++;

    const tick = document.querySelector(`input[name="q${i}"]:checked`);
    const userPickIndex = tick ? Number(tick.value) : null;
    const correctIndex = Number(q.answer);

    const ok = (userPickIndex !== null) && (userPickIndex === correctIndex);

    if(ok){
      right++;
      stats[part].r++;
      card.classList.add("correct");
    }else{
      card.classList.add("wrong");
      weakTheory.set(label, (weakTheory.get(label)||0)+1);

      wrongDetails.push({
        index: i+1,
        question: q.question || "",
        userPick: userPickIndex,
        correctPick: correctIndex,
        options: q.options || [],
        theory: label
      });
    }
  });

  const weakList = [...weakTheory.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0,4)
    .map(([label,count])=>`• <b>${label}</b> (sai ${count} câu)`)
    .join("<br>");

  const wrongHTML = wrongDetails.length === 0
    ? `<p>🎉 Bạn làm đúng hết nên không có câu sai.</p>`
    : wrongDetails.map(w=>{
        const userAns = (w.userPick===null)
          ? "<i>Chưa chọn</i>"
          : w.options[w.userPick] ?? "(không rõ)";
        const correctAns = w.options[w.correctPick] ?? "(không rõ)";

        const prompt = encodeURIComponent(
          `Mình sai câu: ${w.question}. Đáp án đúng là gì và giải thích giúp mình theo ${w.theory}?`
        );

        return `
          <div class="question-card wrong" style="margin-top:8px;">
            <div class="question-title">
              <b>Câu ${w.index} (Sai)</b>: ${w.question}
            </div>
            <div style="font-size:14px; margin-top:4px;">
              👉 Bạn chọn: <b>${userAns}</b><br>
              ✅ Đáp án đúng: <b>${correctAns}</b><br>
              📌 Lý thuyết liên quan: <b>${w.theory}</b>
            </div>
            <div style="margin-top:6px;">
              <button class="big" onclick="sendToChatbot('${prompt}')">
                🤖 Hỏi trợ lý câu này
              </button>
            </div>
          </div>
        `;
      }).join("");

  const resBox = document.getElementById("quiz-result");
  if(!resBox) return;

  resBox.style.display="block";
  resBox.innerHTML=`
    <div class="result-score">
      Bạn đúng <b>${right}</b> / <b>${quizQuestions.length}</b> câu
    </div>

    <h3>Thống kê theo mảng</h3>
    <table class="stat-table">
      <tr><th>Mảng</th><th>Đúng/Tổng</th><th>Tỉ lệ</th></tr>
      ${Object.entries(stats).map(([k,v])=>{
        const rate = v.t===0?0:Math.round(v.r*100/v.t);
        return `<tr><td>${k}</td><td>${v.r}/${v.t}</td><td>${rate}%</td></tr>`;
      }).join("")}
    </table>

    <h3>Gợi ý ôn lý thuyết cụ thể</h3>
    <div>${weakList || "Bạn làm rất tốt, chưa thấy phần yếu rõ ràng!"}</div>

    <h3 style="margin-top:12px;">Các câu bạn làm sai</h3>
    ${wrongHTML}
  `;

  resBox.scrollIntoView({behavior:"smooth"});
}

/* ===== Theory panel ===== */
function showTheory(ch){
  const box = document.getElementById("theory-content");
  if(!box) return;

  const data = {
    "1": `
      <h3>Chương I. Đa thức</h3>
      <ul>
        <li>Bài 1–2: Đơn thức, đa thức, bậc.</li>
        <li>Bài 3: Cộng – trừ đa thức.</li>
        <li>Bài 4: Nhân đơn thức với đa thức.</li>
        <li>Bài 5: Nhân hai đa thức.</li>
        <li>Bài 6: Chia đa thức cho đơn thức.</li>
      </ul>`,
    "2": `
      <h3>Chương II. Hằng đẳng thức đáng nhớ</h3>
      <ul>
        <li>Bài 7: Bình phương một tổng, một hiệu.</li>
        <li>Bài 8: Hiệu hai bình phương.</li>
        <li>Bài 9: Lập phương một tổng, một hiệu.</li>
        <li>Bài 10: Tổng / hiệu hai lập phương.</li>
        <li>Bài 11: Phân tích đa thức thành nhân tử.</li>
      </ul>`,
    "3": `
      <h3>Chương III. Tứ giác</h3>
      <ul>
        <li>Bài 12: Hình thang – hình thang cân.</li>
        <li>Bài 13: Hình bình hành.</li>
        <li>Bài 14: Hình chữ nhật.</li>
        <li>Bài 15: Hình thoi.</li>
        <li>Bài 16: Hình vuông.</li>
      </ul>`,
    "4": `
      <h3>Chương IV. Định lí Thales (đang học)</h3>
      <ul>
        <li>Tỉ số đoạn thẳng.</li>
        <li>Đường thẳng song song trong tam giác.</li>
        <li>Định lí Thales và hệ quả.</li>
      </ul>`
  };

  box.innerHTML = data[ch] || "<p>Chưa có nội dung.</p>";
  if(window.MathJax?.typesetPromise){
    MathJax.typesetPromise([box]);
  }
}

/* fallback đoán topic nếu thiếu */
function detectTheory(text){
  const t=(text||"").toLowerCase();
  if(t.includes("hình")) return {label:"Chương III – Tứ giác (tổng quát)"};
  return {label:"Chương I–II (tổng quát)"};
}

/* Utils */
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}

/* Gửi câu hỏi sang trợ lý */
function sendToChatbot(encodedPrompt){
  const input = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  if(!input || !sendBtn) return;

  input.value = decodeURIComponent(encodedPrompt);
  showChatFloat();
  sendBtn.click();
}

/* auto load */
loadQuestions();
showChatFloat();
