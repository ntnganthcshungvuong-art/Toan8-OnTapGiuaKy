async function loadQuiz() {
  // Luôn lấy bản mới của JSON
  const res = await fetch(`questions.json?ts=${Date.now()}`);
  if (!res.ok) {
    document.getElementById('quiz').innerHTML =
      `<div class="question"><b>Lỗi:</b> Không tải được questions.json.</div>`;
    return;
  }
  const items = await res.json();

  const wrap = document.getElementById('quiz');
  wrap.innerHTML = '';
  let totalPoints = 0;

  let lastSection = null;
  items.forEach((q, i) => {
    totalPoints += Number(q.points || 0);

    // Header phần nếu có
    if (q.section && q.section !== lastSection) {
      lastSection = q.section;
      const h = document.createElement('div');
      h.className = 'section-title';
      h.textContent = q.section;
      wrap.appendChild(h);
    }

    const card = document.createElement('div');
    card.className = 'question';

    // Tiêu đề
    let title = `<p><b>Câu ${i + 1}.</b> ${q.question}`;
    if (q.multi) title += ` <span class="muted">(Chọn tất cả ý đúng)</span>`;
    title += `</p>`;
    card.innerHTML = title;

    // Ảnh (nếu có)
    if (q.image) {
      const img = document.createElement('img');
      img.src = q.image;
      img.alt = 'Hình minh họa';
      card.appendChild(img);
    }

    // Phương án
    (q.options || []).forEach((opt, j) => {
      const line = document.createElement('div');
      line.className = 'option-line';

      const id = `q${i}_${j}`;
      const input = document.createElement('input');
      input.type = q.multi ? 'checkbox' : 'radio';
      input.name = `q${i}`;
      input.id = id;
      input.value = j;

      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.innerHTML = opt; // Opt có thể chứa LaTeX

      line.appendChild(input);
      line.appendChild(label);
      card.appendChild(line);
    });

    wrap.appendChild(card);
  });

  // Nộp bài
  document.getElementById('submit').onclick = () => grade(items, totalPoints);

  // Gọi MathJax sau khi render
  if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
}

function grade(items, totalPoints) {
  let gained = 0;

  items.forEach((q, i) => {
    if (q.multi) {
      const chosen = Array.from(document.querySelectorAll(`input[name="q${i}"]:checked`))
                          .map(x => +x.value)
                          .sort((a,b)=>a-b);
      const ans = Array.isArray(q.answer) ? [...q.answer].sort((a,b)=>a-b) : [];
      const ok = chosen.length === ans.length && chosen.every((v, k) => v === ans[k]);
      if (ok) gained += Number(q.points || 0);
    } else {
      const tick = document.querySelector(`input[name="q${i}"]:checked`);
      if (tick && +tick.value === Number(q.answer)) {
        gained += Number(q.points || 0);
      }
    }
  });

  const out = document.getElementById('result');
  out.style.display = 'block';
  out.innerHTML = `Bạn đạt <b>${round2(gained)}</b> / <b>${round2(totalPoints)}</b> điểm.`;
}

function round2(x){ return Math.round((+x + Number.EPSILON)*100)/100 }

loadQuiz();
