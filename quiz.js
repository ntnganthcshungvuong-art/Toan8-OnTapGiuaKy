/* ===== QUIZ TOÁN 8 - BẢN AN TOÀN (TỰ HIỆN LỖI + KHÔNG XUNG ĐỘT CSS) ===== */

async function loadQuiz() {
  const wrap = document.getElementById('quiz');
  wrap.innerHTML = `<div class="loading-box">Đang tải câu hỏi...</div>`;

  let items = [];
  try {
    const res = await fetch(`questions.json?ts=${Date.now()}`);
    if (!res.ok) throw new Error("Không tìm thấy questions.json (HTTP " + res.status + ")");
    items = await res.json();
    if (!Array.isArray(items)) throw new Error("questions.json không phải dạng mảng []");
  } catch (err) {
    wrap.innerHTML = `
      <div class="error-box">
        <b>Lỗi tải dữ liệu!</b><br>
        ${err.message}<br><br>
        👉 Kiểm tra lại file <code>questions.json</code> có nằm cùng thư mục với index.html không.
      </div>
    `;
    document.getElementById("done-count").textContent = 0;
    document.getElementById("total-count").textContent = 0;
    document.getElementById("progress-fill").style.width = "0%";
    return;
  }

  // OK -> render
  wrap.innerHTML = '';
  document.getElementById("total-count").textContent = items.length;

  let totalPoints = 0;

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

    const title = document.createElement('div');
    title.className = 'question-title';
    title.innerHTML = `<b>Câu ${i + 1}.</b> ${q.question}`;
    card.appendChild(title);

    (q.options || []).forEach((opt, j) => {
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

  document.getElementById('submit').onclick = () => grade(items, totalPoints);
  document.getElementById("reset").onclick = resetQuiz;

  updateProgress();

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([wrap]);
  }
}

/* ===== PROGRESS ===== */
function updateProgress() {
  const total = document.querySelectorAll(".question-card").length;
  const done = document.querySelectorAll(".question-card input[type=radio]:checked").length;

  document.getElementById("done-count").textContent = done;
  document.getElementById("total-count").textContent = total;

  const percent = total === 0 ? 0 : Math.round(done * 100 / total);
  document.getElementById("progress-fill").style.width = percent + "%";
}

/* ===== RESET ===== */
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

/* ===== CHẤM ĐIỂM + THỐNG KÊ ===== */
function grade(items, totalPoints) {
  let gained = 0;

  const stats = {
    "PHẦN A. ĐẠI SỐ (Chương I–II)": { right: 0, total: 0 },
    "PHẦN B. HÌNH HỌC (Chương III)": { right: 0, total: 0 }
  };

  items.forEach((q, i) => {
    const card = document.querySelector(`.question-card[data-index="${i}"]`);
    const part = card.dataset.part;

    stats[part].total += 1;

    const tick = document.querySelector(`input[name="q${i}"]:checked`);
    const ok = tick && (+tick.value === Number(q.answer));

    if (ok) {
      gained += Number(q.points || 0);
      stats[part].right += 1;
      card.classList.add("correct");
      card.classList.remove("wrong");
    } else {
      card.classList.add("wrong");
      card.classList.remove("correct");
    }
  });

  const out = document.getElementById('result');
  out.style.display = 'block';

  const statTable = `
    <table class="stat-table">
      <tr><th>Chủ đề</th><th>Đúng / Tổng</th><th>Tỉ lệ</th></tr>
      ${Object.entries(stats).map(([k,v]) => {
        const rate = v.total === 0 ? 0 : Math.round(v.right*100/v.total);
        return `<tr>
          <td>${k}</td>
          <td>${v.right}/${v.total}</td>
          <td>${rate}%</td>
        </tr>`;
      }).join("")}
    </table>
  `;

  out.innerHTML = `
    <div class="result-score">
      Bạn đạt <b>${round2(gained)}</b> / <b>${round2(totalPoints)}</b> điểm
    </div>
    <div class="result-note">
      ✅ Điểm mạnh: phần có tỉ lệ cao. <br/>
      ⚠️ Cần ôn thêm: phần có tỉ lệ thấp.
    </div>
    <h3>Thống kê theo chủ đề</h3>
    ${statTable}
    <div class="result-guide">
      Gợi ý: hãy xem lại các câu tô <span class="badge-wrong">đỏ</span> để củng cố kiến thức.
    </div>
  `;

  out.scrollIntoView({ behavior: "smooth" });

  if (window.MathJax?.typesetPromise) {
    MathJax.typesetPromise([out]);
  }
}

function round2(x){ return Math.round((+x + Number.EPSILON)*100)/100 }

loadQuiz();
