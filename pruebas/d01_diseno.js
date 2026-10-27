// Design-system battery: consistent buttons, destructive actions, selection colours, chips, checkboxes, home cards.
(async () => {
  const R = window.R2, { wait, results, reset, setSaved, setPlan, setStock, tradPlate } = R; const T = results();
  const $ = id => document.getElementById(id);
  const css = (el, p) => getComputedStyle(el).getPropertyValue(p).trim();
  const green = () => css(document.documentElement, '--green');
  const rgb = hex => { const h = hex.replace('#', ''); return `rgb(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)})` };
  reset();
  // D1 Inicio: todas las entradas son tarjetas iguales (emoji, título y descripción)
  go('home');
  const homeButtons = [...document.querySelectorAll('#home .home-group button, #sectionSettings button')];
  const notCards = homeButtons.filter(b => !b.classList.contains('tool-button') || !b.querySelector('.tool-button__emoji') || !b.querySelector('.tool-button__label') || !b.querySelector('.tool-button__desc')).map(b => b.textContent.trim().slice(0, 30));
  // v14.9.91: Plan, Compras y Mis platos pasaron a la barra de pestañas; quedan 9 tarjetas (3 para armar, 3 de ideas y 3 ajustes).
  T.ok('D1 todas las entradas del inicio son tarjetas iguales', homeButtons.length >= 9 && notCards.length === 0, notCards.join(' | '));
  // D2 Tema: la tarjeta muestra el tema elegido
  const before = localStorage.getItem('miPlatoFacil_theme');
  localStorage.setItem('miPlatoFacil_theme', 'dark'); applyTheme();
  const darkLabel = $('themeToggle').querySelector('.tool-button__label').textContent;
  localStorage.setItem('miPlatoFacil_theme', 'light'); applyTheme();
  const lightLabel = $('themeToggle').querySelector('.tool-button__label').textContent;
  if (before === null) localStorage.removeItem('miPlatoFacil_theme'); else localStorage.setItem('miPlatoFacil_theme', before); applyTheme();
  T.ok('D2 la tarjeta de tema muestra el tema elegido', darkLabel === 'Tema: Oscuro' && lightLabel === 'Tema: Claro', darkLabel + ' / ' + lightLabel);
  // D3 Todo lo que borra datos guardados se ve como destructivo (rojo)
  setSaved([tradPlate('t1', ['Papa'], ['Tomate'], ['Merluza'])]);
  setPlan([['lunes', 'almuerzo', 't1']]);
  setStock([['Papa', 2, 'kg']]);
  const wrong = [];
  for (const s of document.querySelectorAll('section.screen[id]')) {
    go(s.id); if (s.id === 'ingredientes') showRecipeView('browse');
    s.querySelectorAll('details').forEach(d => { d.open = true });
    await wait(40);
    for (const b of s.querySelectorAll('button')) {
      const t = b.textContent.trim();
      if (/^(Eliminar|Borrar|Vaciar|Quitar|Limpiar preferencias)/.test(t) && !b.classList.contains('button--danger') && !b.classList.contains('filter-chip--danger')) wrong.push(s.id + ': ' + t);
    }
  }
  go('home');
  T.ok('D3 todos los botones que borran se ven en rojo', wrong.length === 0, wrong.join(' | '));
  // D4 Un solo tono para los botones secundarios
  const soft = document.querySelector('.button--soft'), second = document.querySelector('.button--secondary');
  T.ok('D4 los botones secundarios tienen un solo color', !!soft && !!second && css(soft, 'background-color') === css(second, 'background-color') && css(soft, 'color') === css(second, 'color'), css(soft, 'background-color') + ' / ' + (second && css(second, 'background-color')));
  // D5 Botones que alternan: el activo se distingue y usa el verde de la app
  go('compras'); await wait(20);
  const pend = $('comprasShowPending'), all = $('comprasShowAll');
  const pressed = [pend, all].find(b => b.getAttribute('aria-pressed') === 'true'), other = [pend, all].find(b => b !== pressed);
  T.ok('D5 en Compras se nota cuál filtro está activo', !!pressed && css(pressed, 'border-top-color') === rgb(green()) && css(pressed, 'background-color') !== css(other, 'background-color'));
  // D6 Opción elegida (Usar almidones/proteínas) en verde, no en naranja
  go('lunch_carb'); await wait(20);
  const sel = document.querySelector('#lunch_carb .toggle-button.is-selected');
  const ref = document.createElement('button'); ref.className = 'choice is-selected'; document.body.append(ref);
  const refBorder = css(ref, 'border-top-color'), refBg = css(ref, 'background-color'); ref.remove();
  const orange = rgb(css(document.documentElement, '--orange'));
  T.ok('D6 la opción elegida se marca igual que el resto (verde, no naranja)', !!sel && css(sel, 'border-top-color') === refBorder && css(sel, 'background-color') === refBg && css(sel, 'border-top-color') !== orange, sel && css(sel, 'border-top-color') + ' vs ' + refBorder);
  // D7 Chips con la misma altura en toda la app
  const heights = new Set();
  for (const id of ['misplatos', 'ingredientes', 'trainingCalendar']) { go(id); if (id === 'ingredientes') showRecipeView('browse'); await wait(30); document.querySelectorAll('#' + id + ' .filter-chip').forEach(c => { if (c.getClientRects().length) heights.add(Math.round(c.getBoundingClientRect().height)) }) }
  go('home');
  T.ok('D7 los chips tienen todos la misma altura mínima (44 px)', [...heights].length > 0 && [...heights].every(h => h >= 44), [...heights].join(','));
  // D8 Casillas de tamaño normal y en línea con su texto
  go('ingredientes'); showRecipeView('browse'); document.querySelectorAll('#ingredientes details').forEach(d => { d.open = true }); await wait(30);
  const boxes = ['recipeApplyAvoid', 'recipeRecommendPantry', 'recipeRecommendCosts'].map($).filter(Boolean).filter(b => b.getClientRects().length);
  T.ok('D8 las casillas tienen tamaño normal', boxes.length >= 1 && boxes.every(b => b.getBoundingClientRect().width <= 24 && b.getBoundingClientRect().height <= 24), boxes.map(b => Math.round(b.getBoundingClientRect().width) + 'x' + Math.round(b.getBoundingClientRect().height)).join(' '));
  go('home');
  return T;
})()
