(async function () {
  const gridMount = document.querySelector("[data-news-grid]");
  const meta = document.getElementById("newsMeta");
  const searchInput = document.getElementById("siteSearch");
  const resultsBox = document.getElementById("siteSearchResults");

  if (!gridMount) return;

  let searchEntries = [];
  let activeIndex = -1;

  function esc(s) {
    return (s ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeHtml(value) {
    return (value ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return "";
    }
  }

  function wrapGrid(html) {
    return `
      <div style="
        display:grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap:16px;
      " data-grid>
        ${html}
      </div>
    `;
  }

  function cardHTML(item, delayMs, index) {
    const title = esc(item.title || "Новость");
    const text = esc(item.text || "");
    const date = formatDate(item.created_at);
    const articleId = item.id ? `news-item-${esc(item.id)}` : `news-item-${index + 1}`;
    const shortText = text.length > 500 ? (text.slice(0, 497) + "...") : text;

    const img = item.image ? `
      <div style="
        margin-top:12px;
        border-radius:16px;
        overflow:hidden;
        border:1px solid var(--border);
        aspect-ratio:16/9;
        background:#fff;
      ">
        <img src="${esc(item.image)}" alt=""
          style="width:100%;height:100%;object-fit:cover;display:block">
      </div>
    ` : "";

    const btn = item.link
      ? `<a class="btn primary" target="_blank" rel="noopener" href="${esc(item.link)}">Читать далее</a>`
      : "";

    return `
      <article id="${articleId}" class="card padded" style="
        opacity:0;
        transform: translateY(10px);
        animation: newsIn .55s ease forwards;
        animation-delay: ${delayMs}ms;
      ">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <b>${title}</b>
          <span style="font-size:12px;color:var(--muted)">${esc(date)}</span>
        </div>
        <div style="margin-top:10px;color:var(--muted);white-space:pre-wrap">${shortText}</div>
        ${img}
        ${btn ? `<div style="margin-top:12px">${btn}</div>` : ""}
      </article>
    `;
  }

  function highlightMatch(text, query) {
    const safeText = escapeHtml(text);
    if (!query) return safeText;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return safeText.replace(new RegExp("(" + escapedQuery + ")", "ig"), "<mark>$1</mark>");
  }

  function buildSnippet(entry, query) {
    const lowerText = entry.text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIndex = lowerText.indexOf(lowerQuery);

    if (matchIndex === -1) {
      return escapeHtml(entry.text.slice(0, 120)) + (entry.text.length > 120 ? "..." : "");
    }

    const start = Math.max(0, matchIndex - 45);
    const end = Math.min(entry.text.length, matchIndex + query.length + 75);
    const snippet = (start > 0 ? "..." : "") + entry.text.slice(start, end) + (end < entry.text.length ? "..." : "");
    return highlightMatch(snippet, query);
  }

  function closeResults() {
    if (!resultsBox || !searchInput) return;

    resultsBox.hidden = true;
    resultsBox.innerHTML = "";
    searchInput.setAttribute("aria-expanded", "false");
    activeIndex = -1;
  }

  function openResults() {
    if (!resultsBox || !searchInput) return;

    resultsBox.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  function focusResult(nextIndex) {
    if (!resultsBox) return;

    const items = Array.from(resultsBox.querySelectorAll(".search-result"));
    items.forEach((item, index) => {
      item.classList.toggle("active", index === nextIndex);
    });
    activeIndex = nextIndex;
  }

  function goToResult(id) {
    const target = document.getElementById(id);
    if (!target) return;

    target.classList.remove("search-highlight");
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => {
      target.classList.add("search-highlight");
      window.setTimeout(() => target.classList.remove("search-highlight"), 1800);
    }, 120);

    closeResults();
  }

  function renderResults(query) {
    if (!resultsBox || !searchInput) return;

    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery.length < 2) {
      closeResults();
      return;
    }

    const matches = searchEntries
      .filter((entry) => entry.haystack.includes(normalizedQuery))
      .slice(0, 6);

    if (!matches.length) {
      resultsBox.innerHTML = '<div class="search-result"><strong>Ничего не найдено</strong><span>Попробуйте другое слово или фразу.</span></div>';
      openResults();
      return;
    }

    resultsBox.innerHTML = matches
      .map((entry) => (
        '<button class="search-result" type="button" data-target="' + entry.id + '">' +
          "<strong>" + highlightMatch(entry.title, normalizedQuery) + "</strong>" +
          "<span>" + buildSnippet(entry, normalizedQuery) + "</span>" +
        "</button>"
      ))
      .join("");

    openResults();
    focusResult(-1);
  }

  function setupSearch() {
    if (!searchInput || !resultsBox) return;

    searchInput.addEventListener("input", (event) => {
      renderResults(event.target.value);
    });

    searchInput.addEventListener("keydown", (event) => {
      const items = Array.from(resultsBox.querySelectorAll("button.search-result"));
      if (!items.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        focusResult(activeIndex >= items.length - 1 ? 0 : activeIndex + 1);
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        focusResult(activeIndex <= 0 ? items.length - 1 : activeIndex - 1);
      }

      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        items[activeIndex].click();
      }
    });

    resultsBox.addEventListener("click", (event) => {
      const button = event.target.closest("[data-target]");
      if (!button) return;

      goToResult(button.getAttribute("data-target"));
    });

    document.addEventListener("click", (event) => {
      if (event.target === searchInput || resultsBox.contains(event.target)) {
        return;
      }

      closeResults();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeResults();
      }
    });
  }

  function buildSearchEntries(items) {
    searchEntries = items.map((item, index) => {
      const id = item.id ? `news-item-${item.id}` : `news-item-${index + 1}`;
      const title = (item.title || "Новость").toString();
      const text = (item.text || "").toString().replace(/\s+/g, " ").trim();

      return {
        id,
        title,
        text,
        haystack: (title + " " + text).toLowerCase()
      };
    });
  }

  if (!document.getElementById("newsAnimStyle")) {
    const st = document.createElement("style");
    st.id = "newsAnimStyle";
    st.textContent = `
      @keyframes newsIn {
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(st);
  }

  setupSearch();

  try {
    const res = await fetch("data/news.json", { cache: "no-store" });
    const data = await res.json();

    const items = Array.isArray(data.items) ? data.items : [];
    const updated = data.updated_at ? new Date(data.updated_at).toLocaleString("ru-RU") : "-";
    if (meta) meta.textContent = `Обновлено: ${updated} • Новостей: ${items.length}`;

    if (items.length === 0) {
      gridMount.innerHTML = `
        <div class="card padded">
          <b>Новостей пока нет.</b>
          <div style="margin-top:8px;color:var(--muted)">
            Добавь новости через <code>admin.html</code> и обнови <code>data/news.json</code>.
          </div>
        </div>
      `;
      return;
    }

    const sorted = items
      .slice()
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    buildSearchEntries(sorted);

    const cards = sorted.map((item, index) => cardHTML(item, Math.min(index * 60, 420), index)).join("");
    gridMount.innerHTML = wrapGrid(cards);

    const mq = window.matchMedia("(max-width: 900px)");
    const grid = gridMount.querySelector("[data-grid]");

    function applyGrid() {
      grid.style.gridTemplateColumns = mq.matches ? "1fr" : "repeat(2, minmax(0,1fr))";
    }

    mq.addEventListener("change", applyGrid);
    applyGrid();
  } catch (e) {
    if (meta) meta.textContent = "Ошибка загрузки данных";
    gridMount.innerHTML = `
      <div class="card padded">
        <b>Не удалось загрузить новости.</b>
        <div style="margin-top:8px;color:var(--muted)">
          Проверь файл <code>data/news.json</code> и запуск через Live Server.
        </div>
      </div>
    `;
  }
})();
