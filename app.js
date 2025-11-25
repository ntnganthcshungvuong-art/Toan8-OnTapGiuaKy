/* ===== APP v3: Tabs + Quiz 10 câu + Theory + Chat Float ===== */

console.log("✅ app.js v3 loaded");

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

/* ===== Click handler tổng ===== */
document.addEventListener("click",(e)=>{
  const tabBtn = e.target.closest(".tab-btn");
  if(tabBtn){
    switchTab(tabBtn.dataset.tab);
    return;
  }

  if(e.target.id==="go-quiz"){
    switchTab("quiz");
    if(allQuestions.length>0) newQuiz10();
    return;
  }
  if(e.target.id==="go-theory"){
    switchTab("theory");
    return;
  }

  if(e.target.id==="quiz-new"){ newQuiz10(); return; }
  if(e.target.id==="quiz-submit"){ gradeQuiz(); return; }

  const theoryBtn = e.target.closest(".theory-btn");
  if(theoryBtn){ showTheory(theoryBtn.dataset.chapter); return; }

  // mở/đóng chatbot nổi
  if(e.target.id==="chat-close"){
    hideChatFloat();
    return;
  }
  if(e.target.id==="chat-open-btn" || e.target.id==="open-chat"){
    showChatFloat();
    return;
  }
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
    card.dataset.part = isGeometry(q.question) ? "Hình học" : "Đại số";

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
  let weakTopics = new Map();

  quizQuestions.forEach((q,i)=>{
    const card = document.querySelector(`.question-card[data-index="${i}"]`);
    if(!card) return;
    const part = card.dataset.part;

    stats[part].t++;

    const tick = document.querySelector(`input[name="q${i}"]:checked`);
    const ok = tick && (+tick.value===Number(q.answer));

    if(ok){
      right++;
      stats[part].r++;
      card.classList.add("correct");
    }else{
      card.classList.add("wrong");
      const top = q.topic || part;
      weakTopics.set(top, (weakTopics.get(top)||0)+1);
    }
  });

  const weakList = [...weakTopics.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)
    .map(x=>`• ${x[0]} (sai ${x[1]} câu)`)
    .join("<br>");

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

    <h3>Gợi ý ôn phần yếu</h3>
    <div>${weakList || "Bạn làm rất tốt, chưa thấy phần yếu rõ ràng!"}</div>

    <div style="margin-top:8px">
      👉 Hỏi ngay chatbot (góc phải dưới) để được giải thích chi tiết.
    </div>
  `;

  resBox.scrollIntoView({behavior:"smooth"});
}

/* ===== Theory placeholder ===== */
function showTheory(ch){
  const box = document.getElementById("theory-content");
  if(!box) return;

  const data = {
    "1": `
      <h3>Chương I. Đa thức</h3>
      <ul>
        <li>Đơn thức, đa thức, bậc của đa thức.</li>
        <li>Cộng – trừ đa thức.</li>
        <li>Nhân đơn thức với đa thức, nhân hai đa thức.</li>
        <li>Chia đa thức cho đơn thức.</li>
      </ul>
      <p><b>Hỏi chatbot:</b> gõ “đơn thức là gì”, “cộng trừ đa thức”…</p>
    `,
    "2": `
      <h3>Chương II. Hằng đẳng thức</h3>
      <ul>
        <li>Bình phương một tổng, một hiệu.</li>
        <li>Hiệu hai bình phương.</li>
        <li>Lập phương một tổng, một hiệu.</li>
        <li>Tổng/hiệu hai lập phương.</li>
      </ul>
      <p><b>Hỏi chatbot:</b> “bình phương một tổng”, “hiệu hai bình phương”…</p>
    `,
    "3": `
      <h3>Chương III. Tứ giác</h3>
      <ul>
        <li>Hình thang – hình thang cân.</li>
        <li>Hình bình hành, chữ nhật, thoi, vuông.</li>
        <li>Dấu hiệu nhận biết và tính chất.</li>
      </ul>
      <p><b>Hỏi chatbot:</b> “tính chất hình bình hành”, “dấu hiệu hình thoi”…</p>
    `,
    "4": `
      <h3>Chương IV. Định lí Thales (đang học)</h3>
      <ul>
        <li>Tỉ số đoạn thẳng.</li>
        <li>Đường thẳng song song trong tam giác.</li>
        <li>Định lí Thales và hệ quả.</li>
      </ul>
    `
  };

  box.innerHTML = data[ch] || "<p>Chưa có nội dung.</p>";

  if(window.MathJax?.typesetPromise){
    MathJax.typesetPromise([box]);
  }
}

/* ===== Utils ===== */
function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
}
function isGeometry(text){
  const t=(text||"").toLowerCase();
  return (
    t.includes("tam giác")||t.includes("tứ giác")||t.includes("hình thang")||
    t.includes("hình bình hành")||t.includes("hình chữ nhật")||
    t.includes("hình thoi")||t.includes("hình vuông")||
    t.includes("góc")||t.includes("đường chéo")||t.includes("song song")
  );
}

/* auto load */
loadQuestions();

/* mặc định chatbot mở */
showChatFloat();
