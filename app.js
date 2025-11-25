/* ===== APP: Tabs + Quiz 10 câu + Theory ===== */

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

  // nếu vào quiz mà chưa load -> load
  if(name==="quiz" && allQuestions.length===0){
    loadQuestions().then(()=> newQuiz10());
  }
}

/* bind tab clicks */
document.addEventListener("click",(e)=>{
  const btn = e.target.closest(".tab-btn");
  if(btn){
    switchTab(btn.dataset.tab);
  }
});

/* home shortcuts */
document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("go-quiz").onclick = ()=>{
    switchTab("quiz");
    if(allQuestions.length>0) newQuiz10();
  };
  document.getElementById("go-theory").onclick = ()=> switchTab("theory");

  document.getElementById("quiz-new").onclick = ()=> newQuiz10();
  document.getElementById("quiz-submit").onclick = ()=> gradeQuiz();

  // theory click
  document.querySelectorAll(".theory-btn").forEach(btn=>{
    btn.onclick = ()=> showTheory(btn.dataset.chapter);
  });

  loadQuestions();
});

/* ===== Load questions.json ===== */
async function loadQuestions(){
  try{
    const res = await fetch(`questions.json?ts=${Date.now()}`);
    allQuestions = await res.json();
    if(!Array.isArray(allQuestions)) allQuestions=[];
  }catch(e){
    allQuestions=[];
    document.getElementById("quiz-area").innerHTML =
      `<div class="card" style="color:#b91c1c">
        Lỗi: không tải được questions.json
      </div>`;
  }
}

/* ===== Pick 10 random ===== */
function newQuiz10(){
  quizSubmitted = false;
  const pool = [...allQuestions];
  shuffle(pool);
  quizQuestions = pool.slice(0,10);

  renderQuiz();
  updateProgress();
  document.getElementById("quiz-result").style.display="none";
  document.getElementById("quiz-result").innerHTML="";
  window.scrollTo({top:0, behavior:"smooth"});
}

/* ===== Render Quiz ===== */
function renderQuiz(){
  const area = document.getElementById("quiz-area");
  area.innerHTML = "";

  quizQuestions.forEach((q, i)=>{
    const card = document.createElement("div");
    card.className="question-card";
    card.dataset.index=i;

    // gán part theo từ khóa để thống kê
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

  document.getElementById("total-count").textContent = quizQuestions.length;

  if(window.MathJax?.typesetPromise){
    MathJax.typesetPromise([area]);
  }
}

/* ===== Progress ===== */
function updateProgress(){
  const total = quizQuestions.length;
  const done = document.querySelectorAll(`#quiz-area input[type=radio]:checked`).length;
  document.getElementById("done-count").textContent=done;
  document.getElementById("total-count").textContent=total;
  document.getElementById("progress-fill").style.width =
    (total===0?0:Math.round(done*100/total))+"%";
}

/* ===== Grade ===== */
function gradeQuiz(){
  if(quizSubmitted) return;
  quizSubmitted=true;

  let right=0;
  let stats = { "Đại số":{r:0,t:0}, "Hình học":{r:0,t:0} };
  let weakTopics = new Map(); // topic -> count wrong

  quizQuestions.forEach((q,i)=>{
    const card = document.querySelector(`.question-card[data-index="${i}"]`);
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

  // gợi ý phần yếu
  const weakList = [...weakTopics.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0,3)
    .map(x=>`• ${x[0]} (sai ${x[1]} câu)`)
    .join("<br>");

  const resBox = document.getElementById("quiz-result");
  resBox.style.display="block";
  resBox.innerHTML=`
    <div class="result-score">
      Bạn đúng <b>${right}</b> / <b>${quizQuestions.length}</b> câu
    </div>
    <div class="result-note">
      ✅ Điểm mạnh: phần tỉ lệ đúng cao.<br>
      ⚠️ Cần ôn thêm: phần tỉ lệ thấp.
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
      👉 Bạn có thể bấm sang tab <b>Lý thuyết</b> để xem lại,
      hoặc hỏi ngay <b>Chatbot</b> trên Trang chủ.
    </div>
  `;

  resBox.scrollIntoView({behavior:"smooth"});
}

/* ===== Theory content placeholder ===== */
function showTheory(ch){
  const box = document.getElementById("theory-content");

  // bản khung sườn: sau này bạn thay nội dung theo SGK
  const data = {
    "1": `
      <h3>Chương I. Đa thức</h3>
      <ul>
        <li>Đơn thức, đa thức, bậc của đa thức.</li>
        <li>Cộng – trừ đa thức.</li>
        <li>Nhân đơn thức với đa thức, nhân hai đa thức.</li>
        <li>Chia đa thức cho đơn thức.</li>
      </ul>
      <p><b>Hỏi nhanh chatbot:</b> gõ “đơn thức là gì”, “cộng trừ đa thức”...</p>
    `,
    "2": `
      <h3>Chương II. Hằng đẳng thức đáng nhớ</h3>
      <ul>
        <li>Bình phương của một tổng, một hiệu.</li>
        <li>Hiệu hai bình phương.</li>
        <li>Lập phương của một tổng, một hiệu.</li>
        <li>Tổng/hiệu hai lập phương.</li>
        <li>Phân tích đa thức thành nhân tử.</li>
      </ul>
      <p><b>Hỏi nhanh chatbot:</b> “bình phương một tổng”, “hiệu hai bình phương”...</p>
    `,
    "3": `
      <h3>Chương III. Tứ giác</h3>
      <ul>
        <li>Hình thang – hình thang cân.</li>
        <li>Hình bình hành.</li>
        <li>Hình chữ nhật.</li>
        <li>Hình thoi.</li>
        <li>Hình vuông.</li>
        <li>Dấu hiệu nhận biết và tính chất.</li>
      </ul>
      <p><b>Hỏi nhanh chatbot:</b> “tính chất hình bình hành”, “dấu hiệu hình thoi”...</p>
    `,
    "4": `
      <h3>Chương IV. Định lí Thales (đang học)</h3>
      <ul>
        <li>Tỉ số đoạn thẳng.</li>
        <li>Đường thẳng song song trong tam giác.</li>
        <li>Định lí Thales và hệ quả.</li>
      </ul>
      <p>Hiện tại bạn chỉ cần tóm tắt cơ bản, không mở rộng quá sâu.</p>
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
