(async function () {
  const catEl = document.getElementById("category");
  const titleEl = document.getElementById("title");
  const dateEl = document.getElementById("date");
  const fileEl = document.getElementById("file");
  const noteEl = document.getElementById("note");

  const addBtn = document.getElementById("addBtn");
  const clearBtn = document.getElementById("clearBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const resetBtn = document.getElementById("resetBtn");

  const listEl = document.getElementById("list");
  const metaEl = document.getElementById("meta");

  const CAT_TITLES = {
    orders: "Приказы",
    regulations: "Положения",
    protocols: "Протоколы",
    councils: "Советы (админ/пед/учен.)",
    other: "Другое"
  };

  function esc(s) {
    return (s ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function isIsoDate(d) {
    if (!d) return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(d.trim());
  }

  function clearForm() {
    titleEl.value = "";
    dateEl.value = "";
    fileEl.value = "";
    noteEl.value = "";
    titleEl.focus();
  }

  let store = { updated_at: null, categories: [] };
  try {
    const res = await fetch("data/documents.json", { cache: "no-store" });
    const data = await res.json();
    if (data && typeof data === "object") store = data;
    if (!Array.isArray(store.categories)) store.categories = [];
  } catch {
    store = { updated_at: null, categories: [] };
  }

  function ensureCategory(id) {
    let cat = store.categories.find(c => c.id === id);
    if (!cat) {
      cat = { id, title: CAT_TITLES[id] || "Категория", items: [] };
      store.categories.push(cat);
    }
    if (!Array.isArray(cat.items)) cat.items = [];
    return cat;
  }

  function countAll() {
    return store.categories.reduce((sum, c) => sum + ((c.items || []).length), 0);
  }

  function render() {
    const updated = store.updated_at ? new Date(store.updated_at).toLocaleString("ru-RU") : "—";
    metaEl.textContent = `Категорий: ${store.categories.length} • Документов: ${countAll()} • updated_at: ${updated}`;

    if (countAll() === 0) {
      listEl.innerHTML = `<div style="color:var(--muted);font-size:14px;">Пока документов нет. Добавь первый слева.</div>`;
      return;
    }

    const cats = store.categories
      .slice()
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

    listEl.innerHTML = cats.map(cat => {
      const items = (cat.items || []).slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const rows = items.map(it => `
        <div class="doc-item">
          <div class="doc-main">
            <div class="doc-title">${esc(it.title || "Документ")}</div>
            <div class="doc-sub">
              ${it.date ? `<span class="doc-badge">${esc(it.date)}</span>` : ""}
              ${it.note ? `<span class="doc-note">${esc(it.note)}</span>` : ""}
              ${it.file ? `<span class="doc-file">${esc(it.file.split("/").pop() || it.file)}</span>` : ""}
            </div>
          </div>
          <div class="doc-actions">
            ${it.file ? `<a class="btn" target="_blank" rel="noopener" href="${esc(it.file)}">Открыть</a>` : ""}
            ${it.file ? `<a class="btn primary" href="${esc(it.file)}" download>Скачать</a>` : ""}
          </div>
        </div>
      `).join("");

      return `
        <div class="card padded" style="box-shadow:none;margin-bottom:12px;">
          <b style="font-size:15px;">${esc(cat.title || "Категория")}</b>
          <div style="margin-top:10px" class="doc-list">${rows}</div>
        </div>
      `;
    }).join("");
  }

  addBtn.addEventListener("click", () => {
    const catId = (catEl.value || "").trim();
    const title = (titleEl.value || "").trim();
    const date = (dateEl.value || "").trim();
    const file = (fileEl.value || "").trim();
    const note = (noteEl.value || "").trim();

    if (!catId) {
      alert("Выбери категорию.");
      return;
    }
    if (!title) {
      alert("Укажи название документа.");
      return;
    }
    if (date && !isIsoDate(date)) {
      alert("Дата должна быть в формате YYYY-MM-DD (например 2026-01-19) или оставь пусто.");
      return;
    }
    if (!file) {
      alert("Укажи путь к файлу, например: assets/docs/имя-файла.pdf");
      return;
    }

    const cat = ensureCategory(catId);

    cat.items.push({
      title,
      date: date || "",
      file,
      note: note || ""
    });

    store.updated_at = new Date().toISOString();
    render();
    clearForm();
  });

  clearBtn.addEventListener("click", clearForm);

  resetBtn.addEventListener("click", () => {
    if (!confirm("Сбросить все документы? (Это локально, пока ты не скачал JSON)")) return;
    store = { updated_at: new Date().toISOString(), categories: [] };
    render();
  });

  downloadBtn.addEventListener("click", () => {
    store.updated_at = new Date().toISOString();
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "documents.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    alert("Скачано: documents.json. Замени им файл data/documents.json в проекте/репозитории.");
  });

  render();
})();
