(async function () {
  const listEl = document.getElementById("docList");
  const metaEl = document.getElementById("docMeta");
  const searchEl = document.getElementById("docSearch");

  if (!listEl) return;

  function esc(s) {
    return (s ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length !== 3) return iso;
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
  }

  function fileNameFromPath(p) {
    try {
      const s = (p || "").toString();
      const part = s.split("/").pop() || s;
      return part;
    } catch { return ""; }
  }

  let store = null;

  function normalizeItems(categories) {
    // плоский список для поиска
    const flat = [];
    for (const cat of categories) {
      const catId = cat.id || "";
      const catTitle = cat.title || "Категория";
      const items = Array.isArray(cat.items) ? cat.items : [];
      for (const it of items) {
        flat.push({
          catId,
          catTitle,
          title: it.title || "Документ",
          date: it.date || "",
          file: it.file || "",
          note: it.note || ""
        });
      }
    }
    return flat;
  }

  function render(categories, query) {
    const q = (query || "").trim().toLowerCase();

    const filteredCats = categories.map(cat => {
      const items = Array.isArray(cat.items) ? cat.items : [];
      const filteredItems = !q ? items : items.filter(it => {
        const hay = [
          cat.title, cat.id,
          it.title, it.date, it.note, it.file
        ].join(" ").toLowerCase();
        return hay.includes(q);
      });

      return { ...cat, items: filteredItems };
    }).filter(cat => (cat.items || []).length > 0);

    if (filteredCats.length === 0) {
      listEl.innerHTML = `
        <div class="card padded">
          <b>Ничего не найдено.</b>
          <div style="margin-top:8px;color:var(--muted)">
            Попробуй изменить запрос поиска.
          </div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filteredCats.map(cat => {
      const itemsHtml = (cat.items || []).map(it => {
        const title = esc(it.title || "Документ");
        const date = fmtDate(it.date || "");
        const note = esc(it.note || "");
        const file = esc(it.file || "");
        const fname = esc(fileNameFromPath(it.file || ""));

        const openBtn = file
          ? `<a class="btn" href="${file}" target="_blank" rel="noopener">Открыть</a>`
          : "";

        const dlBtn = file
          ? `<a class="btn primary" href="${file}" download>Скачать</a>`
          : "";

        return `
          <div class="doc-item">
            <div class="doc-main">
              <div class="doc-title">${title}</div>
              <div class="doc-sub">
                ${date ? `<span class="doc-badge">${esc(date)}</span>` : ""}
                ${note ? `<span class="doc-note">${note}</span>` : ""}
                ${fname ? `<span class="doc-file">${fname}</span>` : ""}
              </div>
            </div>
            <div class="doc-actions">
              ${openBtn}
              ${dlBtn}
            </div>
          </div>
        `;
      }).join("");

      return `
        <section class="card padded" style="margin-bottom:16px;">
          <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <div>
              <b style="font-size:16px;">${esc(cat.title || "Категория")}</b>
              <div style="font-size:12px;color:var(--muted); margin-top:6px;">
                Документов: ${(cat.items || []).length}
              </div>
            </div>
          </div>

          <div class="doc-list">
            ${itemsHtml}
          </div>
        </section>
      `;
    }).join("");
  }

  try {
    const res = await fetch("data/documents.json", { cache: "no-store" });
    store = await res.json();

    const categories = Array.isArray(store.categories) ? store.categories : [];
    const updated = store.updated_at ? new Date(store.updated_at).toLocaleString("ru-RU") : "—";

    const flat = normalizeItems(categories);
    if (metaEl) metaEl.textContent = `Категорий: ${categories.length} • Документов: ${flat.length} • Обновлено: ${updated}`;

    render(categories, "");

    if (searchEl) {
      searchEl.addEventListener("input", () => {
        render(categories, searchEl.value);
      });
    }

  } catch (e) {
    if (metaEl) metaEl.textContent = "Ошибка загрузки documents.json";
    listEl.innerHTML = `
      <div class="card padded">
        <b>Не удалось загрузить документы.</b>
        <div style="margin-top:8px;color:var(--muted)">
          Проверь файл <code>data/documents.json</code> и запуск через Live Server.
        </div>
      </div>
    `;
  }
})();
