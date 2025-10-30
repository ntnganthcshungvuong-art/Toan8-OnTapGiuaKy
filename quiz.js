async function loadQuiz() {
  const res = await fetch('questions.json?v=1');
  const questions = await res.json();

  const quizDiv = document.getElementById('quiz');
  let totalPoints = 0;

  questions.forEach((q, i) => {
    totalPoints += q.points || 0;

    const box = document.createElement('div');
    box.className = 'question';

    const title = document.createElement('p');
    title.innerHTML = `<b>Câu ${i + 1}.</b> ${q.question}`;
    box.appendChild(title);

    q.options.forEach((opt, j) => {
      const line = document.createElement('div');
      line.className = 'option-line';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${i}`;
      input.value = j;
      input.id = `q${i}_${j}`;

      const label = document.createElement('label');
      label.setAttribute('for', input.id);
      label.innerHTML = opt;

      line.appendChild(input);
      line.appendChild(label);
      box.appendChild(line);
    });

    quizDiv.appendChild(box);
  });

  document.getElementById('submit').onclick = () => grade(questions, totalPoints);
  if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
}

function grade(questions, totalPoints) {
  let gained = 0;

  questions.forEach((q, i) => {
    const chosen = document.querySelector(`input[name="q${i}"]:checked`);
    if (chosen && parseInt(chosen.value, 10) === q.answer) {
      gained += q.points || 0;
    }
  });

  // làm tròn 2 chữ số
  const score10 = Math.round((gained + Number.EPSILON) * 100) / 100;
  const result = document.getElementById('result');
  result.innerHTML = `Bạn đạt <b>${score10} / 10</b> (đúng ${gained} điểm trên tổng ${totalPoints}).`;

  if (window.MathJax?.typesetPromise) MathJax.typesetPromise();
}

loadQuiz();
