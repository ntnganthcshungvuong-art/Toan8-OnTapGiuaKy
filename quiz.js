function safeTrim(s){return (s??"").toString().trim();}
function letterToIndex(v){
  v=safeTrim(v).toUpperCase();
  if(v==="A")return 0; if(v==="B")return 1; if(v==="C")return 2; if(v==="D")return 3;
  const n=Number(v); return Number.isFinite(n)?n:null;
}
function parseCSV(text){
  // parser đủ dùng vì ta quy ước options ngăn bằng "||"
  const lines=text.split(/\r?\n/).filter(l=>l.trim()!=="");
  const head=lines[0].split(",").map(s=>s.trim());
  const idx = (name)=> head.findIndex(h=>h.toLowerCase()===name.toLowerCase());
  const qi=idx("QuestionTitle"), oi=idx("Options"), ai=idx("Correct"),
        pi=idx("Points"), ii=idx("ImageFile"),
        cx=idx("ClipX"), cy=idx("ClipY"), cw=idx("ClipW"), ch=idx("ClipH");

  const items=[];
  for(let r=1;r<lines.length;r++){
    // tách đơn giản: không dùng dấu phẩy trong cell, vì options dùng "||"
    const cols=lines[r].split(","); 
    const q=safeTrim(cols[qi]); if(!q) continue;

    const opts = safeTrim(cols[oi]).split("||").map(s=>s.trim()).filter(Boolean);
    let ansRaw=safeTrim(cols[ai]);
    let multi=false, answer=null;
    if(ansRaw.includes(",")){
      multi=true;
      answer=ansRaw.split(",").map(x=>letterToIndex(x)).filter(x=>x!==null);
    }else{
      const t=letterToIndex(ansRaw);
      if(t!==null){answer=t;} else {answer=0;}
    }
    const points=Number(safeTrim(cols[pi]))||0;
    const image=safeTrim(cols[ii]);
    const clipX=safeTrim(cols[cx])||"", clipY=safeTrim(cols[cy])||"",
          clipW=safeTrim(cols[cw])||"", clipH=safeTrim(cols[ch])||"";
    const clip = (clipX!==""||clipY!=="") ? `${clipX||0}px ${clipY||0}px` : null;

    items.push({
      question:q, options:opts, answer, points,
      ...(multi?{multi:true}:{ }),
      ...(image?{image}:{ }),
      ...(clip?{clip, clipWidth: clipW?`${clipW}px`:undefined, clipHeight: clipH?`${clipH}px`:undefined}:{}),
    });
  }
  return items;
}

async function loadFromCSV(){
  const res=await fetch('assets/questions.csv');
  if(!res.ok) throw new Error('CSV not found');
  const txt=await res.text();
  return parseCSV(txt);
}

async function loadFromJSON(){
  const res=await fetch('questions.json');
  if(!res.ok) throw new Error('JSON not found');
  return res.json();
}

async function loadQuestions(){
  // Ưu tiên CSV của thầy (đúng đề 100%)
  try { return await loadFromCSV(); }
  catch(e){ /* fallback */ return await loadFromJSON(); }
}

async function loadQuiz() {
  const questions = await loadQuestions();
  const quizDiv = document.getElementById('quiz');
  let totalPoints = 0;

  questions.forEach((q, i) => {
    totalPoints += q.points || 0;

    const div = document.createElement('div');
    div.classList.add('question');

    let title = `<p><b>Câu ${i + 1}.</b> ${q.question}`;
    if (q.multi) title += ` <em style="color:#b35;">(Chọn tất cả ý đúng)</em>`;
    title += `</p>`;
    div.innerHTML = title;

    if (q.image) {
      const img = document.createElement('img');
      img.src = q.image;
      img.alt = 'Hình minh hoạ';
      img.style.maxWidth = '100%';
      img.style.margin = '6px 0 10px';
      if (q.clip) {
        img.style.objectFit = 'none';
        img.style.width = q.clipWidth || '420px';
        img.style.height = q.clipHeight || '220px';
        img.style.objectPosition = q.clip; // "0px -420px"
      }
      div.appendChild(img);
    }

    q.options.forEach((opt, j) => {
      const id = `q${i}_${j}`;
      const input = document.createElement('input');
      input.type = q.multi ? 'checkbox' : 'radio';
      input.name = `q${i}`;
      input.value = j;
      input.id = id;

      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.innerHTML = opt;

      const line = document.createElement('div');
      line.appendChild(input);
      line.appendChild(document.createTextNode(' '));
      line.appendChild(label);
      div.appendChild(line);
    });

    quizDiv.appendChild(div);
  });

  document.getElementById('submit').onclick = () => grade(questions, totalPoints);
  if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
}

function grade(questions, totalPoints) {
  let gained = 0;
  questions.forEach((q, i) => {
    if (q.multi) {
      const chosen = Array.from(document.querySelectorAll(`input[name="q${i}"]:checked`))
                          .map(x => parseInt(x.value))
                          .sort((a,b)=>a-b);
      const ans = [...q.answer].sort((a,b)=>a-b);
      const correct = chosen.length === ans.length && chosen.every((v, k) => v === ans[k]);
      if (correct) gained += q.points || 0;
    } else {
      const chosen = document.querySelector(`input[name="q${i}"]:checked`);
      if (chosen && parseInt(chosen.value) === q.answer) gained += q.points || 0;
    }
  });
  const result = document.getElementById('result');
  result.innerHTML = `Bạn đạt <b>${Math.round(gained*100)/100} / 10</b>. (Điểm thành phần: ${gained} / ${totalPoints})`;
  if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
}

loadQuiz();
