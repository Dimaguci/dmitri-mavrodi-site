
(function () {
  const openBtn = document.querySelector("[data-menu-open]");
  const overlay = document.querySelector("[data-overlay]");
  const closeBtn = document.querySelector("[data-menu-close]");
  const backdrop = document.querySelector("[data-backdrop]");

  if (!openBtn || !overlay) return;

  function open() {
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function close() {
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  openBtn.addEventListener("click", open);
  closeBtn?.addEventListener("click", close);
  backdrop?.addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
})();

(function () {
  const searchInput = document.getElementById("siteSearch");
  const resultsBox = document.getElementById("siteSearchResults");
  const pageMain = document.querySelector("main");

  if (!searchInput || !resultsBox || !pageMain) return;

  const searchableSections = Array.from(pageMain.querySelectorAll("section"));
    const entries = searchableSections
    .map((section, index) => {
      if (!section.id) {
        section.id = "search-section-" + (index + 1);
      }

      const heading = section.querySelector("h1, h2, h3");
      const title = heading ? heading.textContent.trim() : "Раздел " + (index + 1);
      const text = Array.from(section.querySelectorAll("p, li, a, b, span"))
        .map((node) => node.textContent.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ");

      return {
        section,
        id: section.id,
        title,
        text,
        haystack: (title + " " + text).toLowerCase()
      };
    })
    .filter((entry) => entry.haystack.trim().length > 0);

  let activeIndex = -1;

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
    resultsBox.hidden = true;
    resultsBox.innerHTML = "";
    searchInput.setAttribute("aria-expanded", "false");
    activeIndex = -1;
  }

  function openResults() {
    resultsBox.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  function focusResult(nextIndex) {
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
    const normalizedQuery = query.trim().toLowerCase();

    if (normalizedQuery.length < 2) {
      closeResults();
      return;
    }

    const matches = entries
      .filter((entry) => entry.haystack.includes(normalizedQuery))
      .slice(0, 6);

    if (!matches.length) {
      resultsBox.innerHTML = '<div class="search-result"><strong>Ничего не найдено</strong><span>Попробуйте другое слово или фразу.</span></div>';
      openResults();
      return;
    }

    resultsBox.innerHTML = matches
      .map((entry) => {
        return (
          '<button class="search-result" type="button" data-target="' + entry.id + '">' +
            "<strong>" + highlightMatch(entry.title, normalizedQuery) + "</strong>" +
            "<span>" + buildSnippet(entry, normalizedQuery) + "</span>" +
          "</button>"
        );
      })
      .join("");

    openResults();
    focusResult(-1);
  }

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
    if (event.target === searchInput || searchInput.contains(event.target) || resultsBox.contains(event.target)) {
      return;
    }

    closeResults();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeResults();
    }
  });
})();
