// Drifting autumn leaves behind every page. Shared by all games.
(function () {
  const c = document.createElement('div');
  c.className = 'leaves'; c.setAttribute('aria-hidden', 'true');
  const L = ['🍂', '🍁', '🍂', '🍁', '🍃'];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement('span');
    s.textContent = L[i % L.length];
    s.style.cssText = `left:${Math.random() * 100}%;font-size:${18 + Math.random() * 22}px;animation-duration:${16 + Math.random() * 18}s;animation-delay:${-Math.random() * 34}s`;
    c.appendChild(s);
  }
  document.body.prepend(c);
})();
