async function loadQuiz() {
  const res = await fetch('questions.json');
  const questions = await res.json();

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

    // Nếu có hình minh họa
    if (q.image) {
      const img = document.createElement('img');
      img.src = q.image;
      img.alt = 'Hình minh hoạ';
      img.style.maxWidth = '100%';
      img.style.margin = '6px 0 10px';

      // Cho phép cắt ảo (crop bằng CSS)
      if (q.clip) {
        img.style.objectFit = 'none';
        img.style.width = q.clipWidth || '400px';
        img.style.height = q.clipHeight || '250px';
        img.style.objectPosition = q.clip; // ví dụ "0px -300px"
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

  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise();
  }
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
      if (correct) gained += q.points;
    } else {
      const chosen = document.querySelector(`input[name="q${i}"]:checked`);
      if (chosen && parseInt(chosen.value) === q.answer) gained += q.points;
    }
  });

  const score10 = Math.round((gained + Number.EPSILON) * 100) / 100;
  const result = document.getElementById('result');
  result.innerHTML = `Bạn đạt <b>${score10} / 10</b>. (Điểm thành phần: được ${gained} trên tổng ${totalPoints})`;

  if (window.MathJax && window.MathJax.typesetPromise) {
    MathJax.typesetPromise();
  }
}

loadQuiz();
