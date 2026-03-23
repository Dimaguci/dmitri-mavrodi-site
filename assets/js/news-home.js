(async function () {
  const box = document.querySelector("[data-home-news]");
  if (!box) return;

  function esc(s) {
    return (s ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString("ru-RU", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return "";
    }
  }

  try {
    const res = await fetch("data/news.json", { cache: "no-store" });
    const data = await res.json();

    const items = Array.isArray(data.items) ? data.items : [];
    const latest = items
      .slice()
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 4);

    if (latest.length === 0) {
      box.innerHTML = `
        <div class="card padded">
          <b>Пока нет новостей.</b>
          <div style="margin-top:8px;color:var(--muted)">
            Добавь новости через <code>admin.html</code>.
          </div>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div style="
        display:grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap:16px;
      " data-news-grid>
        ${latest.map(item => {
          const title = esc(item.title || "Новость");
          const text = esc(item.text || "");
          const date = formatDate(item.created_at);
          const shortText = text.length > 220 ? text.slice(0, 217) + "…" : text;

          const img = item.image ? `
            <div style="
              margin-top:12px;
              border-radius:16px;
              overflow:hidden;
              border:1px solid var(--border);
              aspect-ratio:16/9;
              background:#fff;
            ">
              <img src="${esc(item.image)}"
                style="width:100%;height:100%;object-fit:cover;display:block"
                alt="">
            </div>
          ` : "";

          const btn = item.link
            ? `<a class="btn primary" target="_blank" rel="noopener" href="${esc(item.link)}">Читать далее</a>`
            : `<a class="btn primary" href="news.html">Все новости</a>`;

          return `
            <article class="card padded">
              <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
                <b>${title}</b>
                <span style="font-size:12px;color:var(--muted)">${esc(date)}</span>
              </div>
              <div style="margin-top:10px;color:var(--muted);white-space:pre-wrap">${shortText}</div>
              ${img}
              <div style="margin-top:12px">${btn}</div>
            </article>
          `;
        }).join("")}
      </div>
    `;

    const mq = window.matchMedia("(max-width: 900px)");
    const grid = box.querySelector("[data-news-grid]");
    function applyGrid() {
      grid.style.gridTemplateColumns = mq.matches ? "1fr" : "repeat(2, minmax(0,1fr))";
    }
    mq.addEventListener("change", applyGrid);
    applyGrid();

  } catch {
    box.innerHTML = `
      <div class="card padded">
        <b>Ошибка загрузки новостей.</b>
        <div style="margin-top:8px;color:var(--muted)">
          Проверь файл <code>data/news.json</code>.
        </div>
      </div>
    `;
  }
})();
