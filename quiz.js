async function loadQuiz() {
  const res = await fetch('questions.json');
  const questions = await res.json();

  const quizDiv = document.getElementById('quiz');
  let totalPoints = 0;

  questions.forEach((q, i) => {
    totalPoints += q.points || 0;

    const card = document.createElement('div');
    card.className = 'question';

    // tiêu đề câu
    let html = `<p><b>Câu ${i + 1}.</b> ${q.question}`;
    if (q.multi) html += ` <em style="color:#b35;">(Chọn tất cả ý đúng)</em>`;
    html += `</p>`;
    card.innerHTML = html;

    // ảnh minh hoạ (nếu có)
    if (q.image) {
      const wrap = document.createElement('div');
      wrap.className = 'imgwrap';
      const img = document.createElement('img');
      img.src = q.image;
      img.alt = 'Hình minh hoạ';
      wrap.appendChild(img);
      card.appendChild(wrap);
    }

    // các lựa chọn
    q.options.forEach((opt, j) => {
      const id = `q${i}_${j}`;
      const line = document.createElement('div');
      line.className = 'option';

      const input = document.createElement('input');
      input.type = q.multi ? 'checkbox' : 'radio';
      input.name = `q${i}`;
      input.value = j;
      input.id = id;

      const label = document.createElement('label');
      label.setAttribute('for', id);
      label.innerHTML = opt;   // chứa LaTeX

      line.appendChild(input);
      line.appendChild(label);
      card.appendChild(line);
    });

    quizDiv.appendChild(card);
  });

  // nút nộp
  document.getElementById('submit').onclick = () => grade(questions, totalPoints);

  // render LaTeX
  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise();
  }
}

function grade(questions, totalPoints) {
  let gained = 0;

  questions.forEach((q, i) => {
    if (q.multi) {
      const chosen = Array.from(
        document.querySelectorAll(`input[name="q${i}"]:checked`)
      ).map(x => parseInt(x.value)).sort((a,b)=>a-b);

      const ans = [...q.answer].sort((a,b)=>a-b);
      const ok = chosen.length === ans.length && chosen.every((v,k)=>v===ans[k]);
      if (ok) gained += q.points;
    } else {
      const ch = document.querySelector(`input[name="q${i}"]:checked`);
      if (ch && parseInt(ch.value) === q.answer) gained += q.points;
    }
  });

  const score10 = Math.round((gained + Number.EPSILON) * 100) / 100;
  const result = document.getElementById('result');
  result.innerHTML = `Bạn đạt <b>${score10} / 10</b> (đúng ${gained}/${totalPoints} điểm phần câu).`;

  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise();
  }
}

loadQuiz();
