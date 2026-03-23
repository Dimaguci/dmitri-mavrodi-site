(function () {
  const root = document.querySelector("[data-slider]");
  if (!root) return;

  const slides = Array.from(root.querySelectorAll(".slide"));
  const dots = Array.from(root.querySelectorAll("[data-dot]"));
  const prevBtn = root.querySelector("[data-prev]");
  const nextBtn = root.querySelector("[data-next]");

  if (slides.length === 0) return;

  let index = 0;
  let timer = null;
  const AUTO_MS = 5500;

  function setActive(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((s, n) => s.classList.toggle("active", n === index));
    dots.forEach((d, n) => d.classList.toggle("active", n === index));
  }

  function next() { setActive(index + 1); }
  function prev() { setActive(index - 1); }

  function startAuto() {
    stopAuto();
    timer = setInterval(next, AUTO_MS);
  }
  function stopAuto() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  nextBtn?.addEventListener("click", () => { next(); startAuto(); });
  prevBtn?.addEventListener("click", () => { prev(); startAuto(); });

  dots.forEach(d => {
    d.addEventListener("click", () => {
      const i = Number(d.getAttribute("data-dot"));
      if (!Number.isNaN(i)) setActive(i);
      startAuto();
    });
  });

  root.addEventListener("mouseenter", stopAuto);
  root.addEventListener("mouseleave", startAuto);

  let startX = 0;
  let startY = 0;
  let moved = false;

  root.addEventListener("touchstart", (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    startX = t.clientX;
    startY = t.clientY;
    moved = false;
    stopAuto();
  }, { passive: true });

  root.addEventListener("touchmove", (e) => {
    const t = e.touches?.[0];
    if (!t) return;
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (Math.abs(dy) > Math.abs(dx)) return;
    if (Math.abs(dx) > 12) moved = true;
  }, { passive: true });

  root.addEventListener("touchend", (e) => {
    if (!moved) { startAuto(); return; }

    const t = e.changedTouches?.[0];
    if (!t) { startAuto(); return; }

    const dx = t.clientX - startX;
    if (dx < -35) next();
    else if (dx > 35) prev();

    startAuto();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { next(); startAuto(); }
    if (e.key === "ArrowLeft") { prev(); startAuto(); }
  });

  setActive(0);
  startAuto();
})();
