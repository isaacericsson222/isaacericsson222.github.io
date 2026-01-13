window.addEventListener("DOMContentLoaded", () => {
  console.log("[parallax] loaded");

  const root = document.querySelector("[data-parallax]");
  if (!root) {
    console.warn("[parallax] No [data-parallax] container found.");
    return;
  }

  const layers = [...root.querySelectorAll("[data-depth]")].map((el) => ({
    el,
    depth: parseFloat(el.dataset.depth || "0.2"),
  }));

  console.log("[parallax] layers found:", layers.length);
  if (layers.length === 0) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let targetX = 0,
    targetY = 0;
  let currentX = 0,
    currentY = 0;

  function onMove(e) {
    const rect = root.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    targetX = (x - 0.5) * 2;
    targetY = (y - 0.5) * 2;
  }

  window.addEventListener("pointermove", onMove, { passive: true });

  function animate() {
    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;

    const max = 45;

    for (const { el, depth } of layers) {
      const moveX = Math.round(-currentX * max * depth);
      const moveY = Math.round(-currentY * max * depth);

      const extraRaw =
        getComputedStyle(el).getPropertyValue("--extra-transform").trim() || "";

      const extra = !extraRaw || extraRaw === "none" ? "" : ` ${extraRaw}`;

      el.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)${extra}`;
    }

    requestAnimationFrame(animate);
  }

  animate();
});
