(async function () {
  const classSelect = document.getElementById("classSelect");
  const daySelect = document.getElementById("daySelect");

  const addClassBtn = document.getElementById("addClassBtn");

  const timeEl = document.getElementById("time");
  const subjectEl = document.getElementById("subject");
  const roomEl = document.getElementById("room");

  const addLessonBtn = document.getElementById("addLessonBtn");
  const clearLessonBtn = document.getElementById("clearLessonBtn");

  const downloadBtn = document.getElementById("downloadBtn");
  const resetBtn = document.getElementById("resetBtn");

  const metaEl = document.getElementById("meta");
  const previewEl = document.getElementById("preview");

  const DAY_TITLES = {
    monday: "Понедельник",
    tuesday: "Вторник",
    wednesday: "Среда",
    thursday: "Четверг",
    friday: "Пятница"
  };

  function esc(s) {
    return (s ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function ensureDays(obj) {
    obj.days ||= {};
    obj.days.monday ||= [];
    obj.days.tuesday ||= [];
    obj.days.wednesday ||= [];
    obj.days.thursday ||= [];
    obj.days.friday ||= [];
  }

  function countLessons() {
    return store.classes.reduce((sum, c) => {
      ensureDays(c);
      return sum +
        c.days.monday.length +
        c.days.tuesday.length +
        c.days.wednesday.length +
        c.days.thursday.length +
        c.days.friday.length;
    }, 0);
  }

  let store = { updated_at: null, notes: "Расписание может меняться.", classes: [] };

  // загрузка
  try {
    const res = await fetch("data/timetable.json", { cache: "no-store" });
    const data = await res.json();
    if (data && typeof data === "object") store = data;
    if (!Array.isArray(store.classes)) store.classes = [];
  } catch {
    // если файла нет — оставим пусто
    store = { updated_at: null, notes: "Расписание может меняться.", classes: [] };
  }

  function refreshClassSelect() {
    if (store.classes.length === 0) {
      classSelect.innerHTML = `<option value="">(нет классов)</option>`;
      return;
    }
    classSelect.innerHTML = store.classes.map(c =>
      `<option value="${esc(c.id)}">${esc(c.title || c.id)}</option>`
    ).join("");
  }

  function currentClass() {
    const id = classSelect.value;
    return store.classes.find(c => c.id === id) || store.classes[0] || null;
  }

  function renderPreview() {
    const updated = store.updated_at ? new Date(store.updated_at).toLocaleString("ru-RU") : "—";
    metaEl.textContent = `Классов: ${store.classes.length} • Уроков: ${countLessons()} • updated_at: ${updated}`;

    const cls = currentClass();
    const dayKey = daySelect.value;

    if (!cls) {
      previewEl.innerHTML = `
        <div class="card padded" style="box-shadow:none;">
          <b>Нет классов</b>
          <div style="margin-top:8px;color:var(--muted)">Нажми “+ Класс”, чтобы добавить первый.</div>
        </div>
      `;
      return;
    }

    ensureDays(cls);
    const lessons = cls.days[dayKey] || [];

    previewEl.innerHTML = `
      <div class="card padded" style="box-shadow:none;">
        <b>${esc(cls.title || cls.id)} — ${esc(DAY_TITLES[dayKey] || "")}</b>
        <div style="margin-top:10px" class="tt-wrap">
          <div class="tt-head">
            <div>Время</div>
            <div>Предмет</div>
            <div>Кабинет</div>
          </div>

          ${lessons.length === 0 ? `
            <div style="padding:14px;color:var(--muted)">На этот день уроков пока нет.</div>
          ` : lessons.map((l, idx) => `
            <div class="tt-row">
              <div class="tt-time">${esc(l.time || "")}</div>
              <div class="tt-subject">${esc(l.subject || "")}</div>
              <div class="tt-room">${esc(l.room || "")}</div>
            </div>
            <div style="padding:10px 14px; border-bottom:1px solid var(--border); display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn" type="button" data-up="${idx}">↑</button>
              <button class="btn" type="button" data-down="${idx}">↓</button>
              <button class="btn" type="button" data-del="${idx}">Удалить</button>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    // обработчики кнопок (вверх/вниз/удалить)
    previewEl.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-del"));
        if (Number.isNaN(i)) return;
        cls.days[dayKey].splice(i, 1);
        store.updated_at = new Date().toISOString();
        renderPreview();
      });
    });

    previewEl.querySelectorAll("[data-up]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-up"));
        if (Number.isNaN(i) || i <= 0) return;
        const arr = cls.days[dayKey];
        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        store.updated_at = new Date().toISOString();
        renderPreview();
      });
    });

    previewEl.querySelectorAll("[data-down]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-down"));
        const arr = cls.days[dayKey];
        if (Number.isNaN(i) || i >= arr.length - 1) return;
        [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
        store.updated_at = new Date().toISOString();
        renderPreview();
      });
    });
  }

  function clearLessonForm() {
    timeEl.value = "";
    subjectEl.value = "";
    roomEl.value = "";
    timeEl.focus();
  }

  // init
  refreshClassSelect();
  if (store.classes[0]) classSelect.value = store.classes[0].id;
  renderPreview();

  classSelect.addEventListener("change", renderPreview);
  daySelect.addEventListener("change", renderPreview);

  addClassBtn.addEventListener("click", () => {
    const id = prompt("Введите ID класса (например 5A, 9B):");
    if (!id) return;
    const clean = id.trim();

    if (store.classes.some(c => c.id === clean)) {
      alert("Класс с таким ID уже существует.");
      return;
    }

    const title = prompt("Введите название класса (например 5-А класс):") || clean;

    const cls = { id: clean, title: title.trim() || clean, days: {} };
    ensureDays(cls);
    store.classes.push(cls);

    store.updated_at = new Date().toISOString();
    refreshClassSelect();
    classSelect.value = cls.id;
    renderPreview();
  });

  addLessonBtn.addEventListener("click", () => {
    const cls = currentClass();
    if (!cls) { alert("Сначала добавь класс."); return; }

    const dayKey = daySelect.value;
    ensureDays(cls);

    const time = (timeEl.value || "").trim();
    const subject = (subjectEl.value || "").trim();
    const room = (roomEl.value || "").trim();

    if (!time || !subject) {
      alert("Укажи время и предмет.");
      return;
    }

    cls.days[dayKey].push({ time, subject, room });
    store.updated_at = new Date().toISOString();

    renderPreview();
    clearLessonForm();
  });

  clearLessonBtn.addEventListener("click", clearLessonForm);

  resetBtn.addEventListener("click", () => {
    if (!confirm("Сбросить всё расписание? (Это локально, пока ты не скачал JSON)")) return;
    store = { updated_at: new Date().toISOString(), notes: "Расписание может меняться.", classes: [] };
    refreshClassSelect();
    renderPreview();
  });

  downloadBtn.addEventListener("click", () => {
    store.updated_at = new Date().toISOString();
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "timetable.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    alert("Скачано: timetable.json. Замени им data/timetable.json в проекте/репозитории.");
  });
})();
