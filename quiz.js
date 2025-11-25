/* ===== QUIZ TOÁN 8 - BẢN SƯ PHẠM + KHKT ===== */

async function loadQuiz() {
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

  // đếm tổng câu
  document.getElementById("total-count").textContent = items.length;

  // ===== Tách phần theo chủ đề (heuristic) =====
  const isGeometry = (text) => {
    const t = text.toLowerCase();
    return (
      t.includes("tam giác") || t.includes("tứ giác") || t.includes("hình thang") ||
      t.includes("hình bình hành") || t.includes("hình chữ nhật") ||
      t.includes("hình thoi") || t.includes("hình vuông") ||
      t.includes("góc") || t.includes("đường chéo") || t.includes("song song")
    );
  };

  let lastPart = null;

  items.forEach((q, i) => {
    totalPoints += Number(q.points || 0);

    const part = q.topic
      ? q.topic
      : (isGeometry(q.question) ? "PHẦN B. HÌNH HỌC (Chương III)" : "PHẦN A. ĐẠI SỐ (Chương I–II)");

    // tạo tiêu đề phần nếu đổi part
    if (part !== lastPart) {
      const h = document.createElement("div");
      h.className = "section-title";
      h.textContent = part;
      wrap.appendChild(h);
      lastPart = part;
    }

    const card = document.createElement('div');
    card.className = 'question-card';
    card.dataset.index = i;
    card.dataset.part = part;

    // Câu hỏi
    const title = document.createElement('div');
    title.className = 'question-title';
    title.innerHTML = `<b>Câu ${i + 1}.</b> ${q.question}`;
    card.appendChild(title);

    // Options
    q.options.forEach((opt, j) => {
      const line = document.createElement('label');
      line.className = 'option-line';

      const input = document.createElement('input');
      input.type = 'radio';
      input.name = `q${i}`;
      input.value = j;

      input.addEventListener("change", updateProgress);

      const span = document.createElement('span');
      span.className = "opt-text";
      span.innerHTML = opt;

      line.appendChild(input);
      line.appendChild(span);
      card.appendChild(line);
    });

    wrap.appendChild(card);
  });

  // Nút nộp bài
  document.getElementById('submit').onclick = () => grade(items, totalPoints);

  // Nút reset
  document.getElementById("reset").onclick = resetQuiz;

  // render MathJax
  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([wrap]);
  }
}

/* ====== PROGRESS ====== */
function updateProgress() {
  const total = document.querySelectorAll(".question-card").length;
  const done = document.querySelectorAll(".question-card input[type=radio]:checked").length;

  document.getElementById("done-count").textContent = done;
  document.getElementById("total-count").textContent = total;

  const percent = total === 0 ? 0 : Math.round(done * 100 / total);
  document.getElementById("progress-fill").style.width = percent + "%";
}

/* ====== RESET ====== */
function resetQuiz() {
  document.querySelectorAll("input[type=radio]").forEach(inp => inp.checked = false);
  document.querySelectorAll(".question-card").forEach(card => {
    card.classList.remove("correct", "wrong");
  });
  const out = document.getElementById("result");
  out.style.display = "none";
  out.innerHTML = "";
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ====== CHẤM ĐIỂM + PHÂN TÍCH SƯ PHẠM ====== */
function grade(items, totalPoints) {
  let gained = 0;

  // thống kê theo phần
  const stats = {
    "PHẦN A. ĐẠI SỐ (Chương I–II)": { right: 0, total: 0 },
    "PHẦN B. HÌNH HỌC (Chương III)": { right: 0, total: 0 }
  };

  items.forEach((q, i) => {
    const card = do
