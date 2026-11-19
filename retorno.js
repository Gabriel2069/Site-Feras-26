/* Reabrir o memorial começa pela entrada. Uma troca breve de aba preserva a leitura. */
(() => {
  "use strict";
  const timeout = 60 * 1000;
  const key = "feras26:away:" + location.pathname;
  const navigationType = performance.getEntriesByType("navigation")[0]?.type;
  let firstShow = true;
  let awaySince = null;
  try {
    history.scrollRestoration = "manual";
    awaySince = Number(sessionStorage.getItem(key)) || null;
  } catch {}

  function depart() {
    awaySince ??= Date.now();
    try { sessionStorage.setItem(key, String(awaySince)); } catch {}
  }

  function arrive() {
    if (document.hidden) return;
    const directEntry = firstShow && navigationType === "navigate" && Boolean(location.hash);
    const expired = !directEntry && awaySince !== null && Date.now() - awaySince >= timeout;
    const freshEntry = firstShow && (navigationType !== "navigate" || !location.hash);
    firstShow = false;
    awaySince = null;
    try { sessionStorage.removeItem(key); } catch {}
    if (!freshEntry && !expired) return;
    dispatchEvent(new Event("feras:restart"));
    if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
    // Depois de pageshow, a restauração nativa já não pode prevalecer sobre a entrada.
    requestAnimationFrame(() => {
      scrollTo({top:0, left:0, behavior:"instant"});
      requestAnimationFrame(() => scrollTo({top:0, left:0, behavior:"instant"}));
    });
  }

  addEventListener("pagehide", depart);
  addEventListener("pageshow", arrive);
  document.addEventListener("visibilitychange", () => document.hidden ? depart() : arrive());
})();
