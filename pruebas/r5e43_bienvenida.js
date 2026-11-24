// R5 · Etapa 43 (Bienvenida): ítems O-01 y O-02 de docs/ronda-5-lista.md. Datos inventados; primer uso (sin la marca de bienvenida vista).
(async () => {
  const H = R5H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc();
  const q = s => { const e = doc().querySelector(s); if (!e) throw new Error("no está: " + s); return e };
  const qa = s => [...doc().querySelectorAll(s)];
  const $ = id => doc().getElementById(id);
  const norm = t => String(t || "").replace(/\s+/g, " ").trim();
  const MARCA = "miPlatoFacil_bienvenida_v1", DIETA = "miPlatoFacil_dieta_v1", PREF = "miPlatoFacil_recipePreferences_v1";
  const J = k => JSON.parse(localStorage.getItem(k) || "null");
  const paso = () => norm($("bienvenidaPaso").textContent);
  const tarjetaVisible = () => qa("#bienvenida [data-bienvenida-tarjeta]").filter(H.visible).map(t => t.dataset.bienvenidaTarjeta);

  // ---- O-01: presentación de tres tarjetas antes de los 4 pasos ----
  await H.abrir({});
  const t1 = q('[data-bienvenida-tarjeta="1"]');
  ok("R5-O-01 al abrir la app por primera vez aparece una presentación breve (kicker 'Bienvenida', no un paso numerado) con una tarjeta a la vez, su ilustración hecha en la app (SVG con título), un título, una frase, los puntos '1 de 3', 'Siguiente' y 'Saltar presentación'",
    ev("stack.at(-1)") === "bienvenida" && paso() === "Bienvenida" && JSON.stringify(tarjetaVisible()) === '["1"]' && !!t1.querySelector("svg title") && t1.querySelector("svg").getAttribute("role") === "img" && /Tu semana en un toque/.test(t1.querySelector("h3").textContent) && /^1 de 3$/.test(norm($("bienvenidaTarjetaPos").textContent))
    && H.visible(q("[data-bienvenida-tarjeta-sig]")) && H.visible(q("[data-bienvenida-intro-saltar]")) && !qa('#bienvenida [data-bienvenida-paso="1"]').some(H.visible) && !qa("#bienvenida img").length && qa("#bienvenida .bienvenida__puntos span").length === 3,
    paso() + " · " + tarjetaVisible());
  await tocar(q("[data-bienvenida-tarjeta-sig]"), 200);
  const t2 = q('[data-bienvenida-tarjeta="2"]'), pos2 = norm($("bienvenidaTarjetaPos").textContent), ok2 = JSON.stringify(tarjetaVisible()) === '["2"]' && /La lista con precios reales/.test(t2.querySelector("h3").textContent) && !!t2.querySelector("svg title");
  await tocar(q("[data-bienvenida-tarjeta-sig]"), 200);
  const t3 = q('[data-bienvenida-tarjeta="3"]'), ultimo = norm(q("[data-bienvenida-tarjeta-sig]").textContent);
  ok("R5-O-01 las tarjetas se pasan con 'Siguiente' y muestran lo mejor de la app: armar la semana en un toque, la lista con precios reales, y recetas con pasos y Lo comí (cada una con su ilustración); en la última el botón dice 'Empezar'",
    ok2 && pos2 === "2 de 3" && JSON.stringify(tarjetaVisible()) === '["3"]' && /Recetas con pasos y Lo comí/.test(t3.querySelector("h3").textContent) && !!t3.querySelector("svg title") && ultimo === "Empezar" && /^3 de 3$/.test(norm($("bienvenidaTarjetaPos").textContent))
    && qa("#bienvenida .bienvenida__puntos span.is-activo").length === 1 && /pasos/.test(t3.textContent) && /Lo comí/.test(t3.textContent) && /precio/.test(t2.textContent) && /semana/.test(t1.textContent), ultimo);
  await tocar(q("[data-bienvenida-tarjeta-sig]"), 250);
  ok("R5-O-01 'Empezar' lleva al Paso 1 de 4 de siempre (el plato) y los 4 pasos se mantienen (¿Qué días entrenás?, ¿Para cuántos y cuánto gastás? y Elegí de 3 a 5 ideas)",
    paso() === "Paso 1 de 4" && /Comé equilibrado/.test(q('[data-bienvenida-paso="1"] h2').textContent) && localStorage.getItem(MARCA) === null && qa("#bienvenida [data-bienvenida-paso]").map(p => p.dataset.bienvenidaPaso).join() === "0,1,2,3,4"
    && /¿Qué días entrenás\?/.test(q('[data-bienvenida-paso="2"] h2').textContent) && /¿Para cuántos y cuánto gastás\?/.test(q('[data-bienvenida-paso="3"] h2').textContent) && /Elegí de 3 a 5 ideas/.test(q('[data-bienvenida-paso="4"] h2').textContent));
  // Se puede saltear: desde cualquier tarjeta, sin escribir la marca (la bienvenida sigue sin darse por vista).
  await H.abrir({});
  await tocar(q("[data-bienvenida-tarjeta-sig]"), 150);
  await tocar(q("[data-bienvenida-intro-saltar]"), 250);
  const datos0 = JSON.stringify(Object.keys(localStorage).sort());
  ok("R5-O-01 'Saltar presentación' (desde cualquier tarjeta) pasa directo al Paso 1 de 4 sin guardar nada (la marca de bienvenida vista no se escribe)", paso() === "Paso 1 de 4" && H.visible(q('[data-bienvenida-paso="1"]')) && !tarjetaVisible().length && localStorage.getItem(MARCA) === null && datos0 === "[]", datos0);
  // Con el dedo: deslizar a la izquierda pasa a la siguiente y a la derecha vuelve.
  await H.abrir({});
  const W = H.w(), deslizar = async (x0, x1) => { const caja = $("bienvenidaTarjetas"); for (const [tipo, x] of [["touchstart", x0], ["touchend", x1]]) { const e = new W.Event(tipo, { bubbles: true }); e.changedTouches = [{ clientX: x }]; caja.dispatchEvent(e) } await espera(100) };
  await deslizar(300, 100); const tras1 = tarjetaVisible().join();
  await deslizar(300, 100); const tras2 = tarjetaVisible().join();
  await deslizar(300, 100); const tope = tarjetaVisible().join();
  await deslizar(100, 300); const vuelve = tarjetaVisible().join();
  await deslizar(100, 110); const corto = tarjetaVisible().join();
  ok("R5-O-01 las tarjetas también se pasan deslizando el dedo (izquierda: siguiente; derecha: anterior; un toque corto no cambia nada; no se pasa del final)", tras1 === "2" && tras2 === "3" && tope === "3" && vuelve === "2" && corto === "2", [tras1, tras2, tope, vuelve, corto].join("/"));
  // A 320 y 390 px entra sin desbordes y los botones miden 44 px o más.
  const medidas = [];
  for (const ancho of [320, 390]) {
    await H.abrir({}, { ancho }); const raiz = $("bienvenida"), caja = raiz.getBoundingClientRect();
    const botones = qa("#bienvenida button").filter(H.visible);
    medidas.push({ ancho, desborda: raiz.scrollWidth > raiz.clientWidth + 1, fuera: botones.some(b => { const r = b.getBoundingClientRect(); return r.left < caja.left - 1 || r.right > caja.right + 1 }), bajos: botones.filter(b => b.getBoundingClientRect().height < 44 - 0.5).length, svg: raiz.querySelector('[data-bienvenida-tarjeta="1"] svg').getBoundingClientRect().width });
  }
  ok("R5-O-01 la presentación entra a 320 y 390 px sin desbordes, con botones de 44 px o más y la ilustración visible", medidas.every(m => !m.desborda && !m.fuera && m.bajos === 0 && m.svg > 150), JSON.stringify(medidas));
  // En tema oscuro los textos de la ilustración se leen (fondo oscuro, texto claro).
  await H.abrir({}); ev('document.documentElement.setAttribute("data-theme","dark")'); await espera(150);
  const lum = c => { const n = (c.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number); return (0.299 * n[0] + 0.587 * n[1] + 0.114 * n[2]) / 255 };
  const fondoIlu = lum(W.getComputedStyle(q(".ilu__fondo")).fill), precio = lum(W.getComputedStyle(q(".ilu__boton")).fill);
  ok("R5-O-01 en tema oscuro la ilustración usa el fondo oscuro de la app y el botón verde sigue a la vista", fondoIlu < 0.35 && precio > 0.15 && W.getComputedStyle(q(".bienvenida__tarjeta h3")).color !== W.getComputedStyle(q(".bienvenida__tarjeta")).backgroundColor, fondoIlu + " / " + precio);

  // ---- O-02: Ingredientes a evitar (con la dieta) dentro del paso 3 ----
  await H.abrir({});
  await tocar(q("[data-bienvenida-intro-saltar]"), 200); await tocar(q('[data-bienvenida-paso="1"] [data-bienvenida-siguiente]'), 200); await tocar(q('[data-bienvenida-paso="2"] [data-bienvenida-siguiente]'), 200);
  const caja3 = $("bienvenidaEvitar"), chips = qa("#bienvenidaDieta .filter-chip").map(c => norm(c.textContent));
  ok("R5-O-02 el paso 3 suma 'Ingredientes a evitar (opcional)' con los seis filtros de la dieta (Sin carne roja, Sin cerdo, Sin pescado, Vegetariano, Sin lácteos, Sin huevo), 'Otros' con su ⓘ que explica 'Escribí ingredientes separados por coma' y la aclaración de que es orientativo; los 4 pasos siguen siendo 4",
    paso() === "Paso 3 de 4" && H.visible(caja3) && /Ingredientes a evitar \(opcional\)/.test(caja3.querySelector("h3").textContent) && JSON.stringify(chips) === JSON.stringify(["Sin carne roja", "Sin cerdo", "Sin pescado", "Vegetariano", "Sin lácteos", "Sin huevo"]) && /Orientativo/.test(caja3.textContent)
    && norm(q('label[for="bienvenidaOtros"]').textContent) === "Otros" && H.visible($("bienvenidaOtrosInfo")) && !H.visible($("bienvenidaOtrosAyuda")) && H.visible($("bienvenidaOtros")), chips.join(","));
  await tocar($("bienvenidaOtrosInfo"), 150);
  const ayudaVista = H.visible($("bienvenidaOtrosAyuda")) && norm($("bienvenidaOtrosAyuda").textContent) === "Escribí ingredientes separados por coma";
  await tocar(q('#bienvenidaDieta [data-bienvenida-dieta="vegetariano"]'), 150);
  const marcado = q('#bienvenidaDieta [data-bienvenida-dieta="vegetariano"]').getAttribute("aria-pressed") === "true";
  const antesDeGuardar = localStorage.getItem(DIETA) === null && localStorage.getItem(PREF) === null;
  $("bienvenidaOtros").value = "cebolla, aceituna";
  await tocar(q("#bienvenida [data-bienvenida-hogar]"), 300);
  ok("R5-O-02 el ⓘ explica 'Escribí ingredientes separados por coma'; elegir 'Vegetariano' y escribir 'cebolla, aceituna' no guarda nada hasta 'Guardar y seguir', y entonces queda en la dieta (miPlatoFacil_dieta_v1) y en 'Otros' de Preferencias, con su formato de siempre",
    ayudaVista && marcado && antesDeGuardar && paso() === "Paso 4 de 4" && JSON.stringify(J(DIETA)) === '{"filtros":["vegetariano"]}' && J(PREF).words === "cebolla, aceituna" && J(PREF).enabled === true && ev("validDieta(JSON.parse(localStorage.getItem('miPlatoFacil_dieta_v1')))")
    && $("recipeAvoidWords").value === "cebolla, aceituna" && ev("dietaFiltros().join()") === "vegetariano", JSON.stringify({ dieta: J(DIETA), pref: J(PREF) }));
  const ideas = qa("#bienvenidaIdeas .filter-chip").map(c => c.dataset.bienvenidaIdea);
  ok("R5-O-02 las ideas que se ofrecen en el paso 4 cumplen lo elegido (nada con carne, pollo o pescado, ni con cebolla o aceituna)", ideas.length >= 3 && ideas.every(t => !/\b(carne|pollo|pescado|merluza|at[uú]n|salm[oó]n|cebolla|aceituna)/i.test(t)) && ev(`${JSON.stringify(ideas)}.every(t => dietaPermite(textoDeIdea(IdeasHoja.ideaPorTexto(t))))`), ideas.slice(0, 4).join(" | "));
  // "Ahora no" no guarda lo que se tocó; sin cargar nada queda todo como estaba.
  await H.abrir({});
  await tocar(q("[data-bienvenida-intro-saltar]"), 200); await tocar(q('[data-bienvenida-paso="1"] [data-bienvenida-siguiente]'), 200); await tocar(q('[data-bienvenida-paso="2"] [data-bienvenida-siguiente]'), 200);
  await tocar(q('#bienvenidaDieta [data-bienvenida-dieta="sin_cerdo"]'), 150); $("bienvenidaOtros").value = "pimiento";
  await tocar(q('[data-bienvenida-paso="3"] [data-bienvenida-siguiente]'), 250);
  const sinGuardar = localStorage.getItem(DIETA) === null && localStorage.getItem(PREF) === null && paso() === "Paso 4 de 4";
  await H.abrir({});
  await tocar(q("[data-bienvenida-intro-saltar]"), 200); await tocar(q('[data-bienvenida-paso="1"] [data-bienvenida-siguiente]'), 200); await tocar(q('[data-bienvenida-paso="2"] [data-bienvenida-siguiente]'), 200);
  await tocar(q("#bienvenida [data-bienvenida-hogar]"), 250);
  ok("R5-O-02 'Ahora no' no guarda lo que se tocó en el paso 3, y 'Guardar y seguir' sin cargar nada deja todo como estaba (no se escribe ninguna clave)", sinGuardar && localStorage.getItem(DIETA) === null && localStorage.getItem(PREF) === null && paso() === "Paso 4 de 4");
  return H.terminar();
})()
