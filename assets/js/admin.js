(async function () {
  const titleEl = document.getElementById("title");
  const textEl = document.getElementById("text");
  const imageEl = document.getElementById("image");
  const linkEl  = document.getElementById("link");

  const addBtn = document.getElementById("addBtn");
  const clearBtn = document.getElementById("clearBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const resetBtn = document.getElementById("resetBtn");

  const listEl = document.getElementById("list");
  const metaEl = document.getElementById("meta");

  function esc(s) {
    return (s ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function validUrlMaybe(u) {
    const s = (u || "").trim();
    if (!s) return true;
    try { new URL(s); return true; } catch { return false; }
  }

  let store = { updated_at: null, items: [] };

  try {
    const res = await fetch("data/news.json", { cache: "no-store" });
    const data = await res.json();
    if (data && typeof data === "object") store = data;
    if (!Array.isArray(store.items)) store.items = [];
  } catch {
    store = { updated_at: null, items: [] };
  }

  function render() {
    const updated = store.updated_at ? new Date(store.updated_at).toLocaleString("ru-RU") : "—";
    metaEl.textContent = `Новостей: ${store.items.length} • updated_at: ${updated}`;

    if (store.items.length === 0) {
      listEl.innerHTML = `<div style="color:var(--muted);font-size:14px;">Пока пусто. Добавь новость слева.</div>`;
      return;
    }

    const items = store.items
      .slice()
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    listEl.innerHTML = items.map(item => {
      const img = item.image
        ? `<img src="${esc(item.image)}" alt="" style="width:100%;height:220px;object-fit:cover;border-radius:16px;border:1px solid var(--border);margin-top:10px">`
        : "";

      const fb = item.link
        ? `<div style="margin-top:10px;">
             <a class="btn primary" target="_blank" rel="noopener" href="${esc(item.link)}">Читать далее (Facebook)</a>
           </div>`
        : "";

      return `
        <article class="card padded" style="box-shadow:none;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <b>${esc(item.title || "Новость")}</b>
            <span style="font-size:12px;color:var(--muted)">${esc(new Date(item.created_at).toLocaleString("ru-RU"))}</span>
          </div>
          <div style="margin-top:8px;white-space:pre-wrap">${esc(item.text || "")}</div>
          ${img}
          ${fb}
        </article>
      `;
    }).join("");
  }

  function clearForm() {
    titleEl.value = "";
    textEl.value = "";
    imageEl.value = "";
    linkEl.value = "";
    titleEl.focus();
  }

  addBtn.addEventListener("click", () => {
    const title = (titleEl.value || "").trim();
    const text  = (textEl.value || "").trim();
    const image = (imageEl.value || "").trim();
    const link  = (linkEl.value  || "").trim();

    if (!title && !text) {
      alert("Добавь хотя бы заголовок или текст.");
      return;
    }
    if (!validUrlMaybe(image)) {
      alert("Ссылка на фото неверная. Вставь корректный URL или оставь поле пустым.");
      return;
    }
    if (!validUrlMaybe(link)) {
      alert("Ссылка на Facebook неверная. Вставь корректный URL или оставь поле пустым.");
      return;
    }

    store.items.push({
      id: "n_" + Date.now(),
      title: title || "Новость",
      text: text || "",
      image: image || null,
      link: link || null,
      created_at: new Date().toISOString()
    });

    store.updated_at = new Date().toISOString();
    render();
    clearForm();
  });

  clearBtn.addEventListener("click", clearForm);

  resetBtn.addEventListener("click", () => {
    if (!confirm("Сбросить список новостей? (Это только локально, пока ты не скачал JSON)")) return;
    store = { updated_at: new Date().toISOString(), items: [] };
    render();
  });

  downloadBtn.addEventListener("click", () => {
    store.updated_at = new Date().toISOString();
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "news.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    alert("Скачано: news.json. Замени им файл data/news.json в проекте/репозитории.");
  });

  render();
})();
