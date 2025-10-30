async function loadQuiz() {
  const res = await fetch('questions.json');
  const questions = await res.json();
  const quizDiv = document.getElementById('quiz');
  
  questions.forEach((q, i) => {
    const div = document.createElement('div');
    div.classList.add('question');
    div.innerHTML = `<p><b>Câu ${i+1}.</b> ${q.question}</p>`;
    
    q.options.forEach((opt, j) => {
      div.innerHTML += `
        <label>
          <input type="radio" name="q${i}" value="${j}">
          ${opt}
        </label><br>`;
    });
    quizDiv.appendChild(div);
  });

  document.getElementById('submit').onclick = () => grade(questions);
}

function grade(questions) {
  let score = 0;
  questions.forEach((q, i) => {
    const chosen = document.querySelector(`input[name="q${i}"]:checked`);
    if (chosen && parseInt(chosen.value) === q.answer) score++;
  });
  document.getElementById('result').innerHTML =
    `Bạn được ${score}/${questions.length} điểm`;
}

loadQuiz();

