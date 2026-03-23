(async function () {
  const classSelect = document.getElementById("classSelect");
  const daySelect = document.getElementById("daySelect");
  const tableEl = document.getElementById("ttTable");
  const metaEl = document.getElementById("ttMeta");
  const noteEl = document.getElementById("ttNote");

  if (!classSelect || !daySelect || !tableEl) return;

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

  function getDefaultDay() {
   
    const d = new Date();
    const w = d.getDay(); // 0=Sun..6=Sat
    if (w === 1) return "monday";
    if (w === 2) return "tuesday";
    if (w === 3) return "wednesday";
    if (w === 4) return "thursday";
    if (w === 5) return "friday";
    return "monday";
  }

  function renderTable(cls, dayKey) {
    const lessons = (cls?.days?.[dayKey] || []);
    const dayTitle = DAY_TITLES[dayKey] || "";

    if (!Array.isArray(lessons) || lessons.length === 0) {
      tableEl.innerHTML = `
        <div class="card padded">
          <b>${esc(cls?.title || "Класс")} — ${esc(dayTitle)}</b>
          <div style="margin-top:8px;color:var(--muted)">
            На выбранный день уроки не указаны.
          </div>
        </div>
      `;
      return;
    }

    tableEl.innerHTML = `
      <div class="card padded">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:flex-end;">
          <b style="font-size:16px;">${esc(cls.title)} — ${esc(dayTitle)}</b>
          <span style="font-size:12px;color:var(--muted)">Уроков: ${lessons.length}</span>
        </div>

        <div class="tt-wrap">
          <div class="tt-head">
            <div>Время</div>
            <div>Предмет</div>
            <div>Кабинет</div>
          </div>

          ${lessons.map((l, i) => `
            <div class="tt-row">
              <div class="tt-time">${esc(l.time || "")}</div>
              <div class="tt-subject">${esc(l.subject || "")}</div>
              <div class="tt-room">${esc(l.room || "")}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  try {
    const res = await fetch("data/timetable.json", { cache: "no-store" });
    const data = await res.json();

    const classes = Array.isArray(data.classes) ? data.classes : [];
    const updated = data.updated_at ? new Date(data.updated_at).toLocaleString("ru-RU") : "—";

    if (noteEl) noteEl.textContent = data.notes || "Расписание занятий.";
    if (metaEl) metaEl.textContent = `Классов: ${classes.length} • Обновлено: ${updated}`;

    if (classes.length === 0) {
      tableEl.innerHTML = `
        <div class="card padded">
          <b>Расписание ещё не заполнено.</b>
          <div style="margin-top:8px;color:var(--muted)">
            Добавь классы и уроки в <code>data/timetable.json</code> (или через админку, которую сделаем дальше).
          </div>
        </div>
      `;
      return;
    }

    classSelect.innerHTML = classes.map((c, idx) =>
      `<option value="${esc(c.id || String(idx))}">${esc(c.title || c.id || "Класс")}</option>`
    ).join("");

    const savedClass = localStorage.getItem("tt_class") || (classes[0].id || String(0));
    const savedDay = localStorage.getItem("tt_day") || getDefaultDay();

    classSelect.value = savedClass;
    daySelect.value = savedDay;

    function getCurrentClass() {
      const id = classSelect.value;
      return classes.find(c => (c.id || "") === id) || classes[0];
    }

    function update() {
      const cls = getCurrentClass();
      const dayKey = daySelect.value;

      localStorage.setItem("tt_class", cls.id || "");
      localStorage.setItem("tt_day", dayKey);

      renderTable(cls, dayKey);
    }

    classSelect.addEventListener("change", update);
    daySelect.addEventListener("change", update);

    update();

  } catch (e) {
    if (metaEl) metaEl.textContent = "Ошибка загрузки timetable.json";
    tableEl.innerHTML = `
      <div class="card padded">
        <b>Не удалось загрузить расписание.</b>
        <div style="margin-top:8px;color:var(--muted)">
          Проверь файл <code>data/timetable.json</code> и запуск через Live Server.
        </div>
      </div>
    `;
  }
})();
