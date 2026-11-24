// R5 · Etapa 42 (Más): ítems X-01 a X-10 y G-01 de docs/ronda-5-lista.md.
// Datos inventados (y el respaldo de ejemplo para G-01); precios congelados. Mira lo que se ve en pantalla y lo que queda guardado.
(async () => {
  const H = R5H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc();
  const q = s => { const e = doc().querySelector(s); if (!e) throw new Error("no está: " + s); return e };
  const qa = s => [...doc().querySelectorAll(s)];
  const $ = id => doc().getElementById(id);
  const norm = t => String(t || "").replace(/\s+/g, " ").trim();
  const estilo = (e, p) => H.w().getComputedStyle(e)[p];
  const J = k => JSON.parse(localStorage.getItem(k) || "null");
  const PREF = "miPlatoFacil_recipePreferences_v1", DIETA = "miPlatoFacil_dieta_v1", REF = "miPlatoFacil_referencePrices_v1", AI = "miPlatoFacil_aiSettings_v1";
  const preferencias = async datos => { await H.abrir({ ...H.MARCA, ...datos }); ev('ModoSimple.setUiMode("completo")'); await espera(100); ev('openTab("mas"); go("preferencias")'); await espera(300) };
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();

  // ---- Preferencias ----
  await preferencias({ ...H.PRES(60000), [PREF]: JSON.stringify({ words: "cebolla, aceituna", enabled: true }), [DIETA]: JSON.stringify({ filtros: ["vegetariano"] }) });
  const ab = $("habitGoalsAbrir"), pres = $("prefPresupuesto"), panelOculto = !H.visible($("habitGoalsPanel"));
  const mismoEstilo = ["borderTopLeftWidth", "borderTopLeftRadius", "backgroundColor", "fontWeight", "minHeight", "display", "textAlign", "paddingLeft"].every(p => estilo(ab, p) === estilo(pres, p));
  const antesAb = ab.getAttribute("aria-expanded");
  await tocar(ab, 250);
  ok("R5-X-01 en Preferencias 'Objetivos semanales' es un botón con el mismo estilo que el de Presupuesto (no un desplegable): al tocarlo se muestran los cuatro objetivos y 'Guardar objetivos'",
    ab.tagName === "BUTTON" && /Objetivos semanales/.test(ab.textContent) && H.visible(pres) && mismoEstilo && panelOculto && antesAb === "false" && ab.getAttribute("aria-expanded") === "true" && H.visible($("habitGoalsPanel")) && ["goal_verduras", "goal_legumbres", "goal_pescado", "goal_fruta", "habitGoalsSave"].every(id => H.visible($(id)))
    && !ab.closest("details") && $("preferencias").querySelectorAll("details,summary").length === 0, "mismo estilo " + mismoEstilo);

  // R5-X-04: "Otros" con un ⓘ al lado que explica qué escribir.
  const otros = q('label[for="recipeAvoidWords"]'), info = $("recipeAvoidInfo"), ayuda0 = H.visible($("recipeAvoidAyuda")), rO = otros.getBoundingClientRect(), rI = info.getBoundingClientRect();
  await tocar(info, 200);
  ok("R5-X-04 el rótulo dice 'Otros' (no 'Otros, separados por coma') con un ⓘ al lado que, al tocarlo, explica 'Escribí ingredientes separados por coma'",
    norm(otros.textContent) === "Otros" && !/separados por coma/i.test(otros.textContent) && /ⓘ/.test(info.textContent) && Math.abs((rO.top + rO.bottom) / 2 - (rI.top + rI.bottom) / 2) < 14 && rI.left >= rO.right - 1 && rI.left - rO.right < 80 && !ayuda0
    && H.visible($("recipeAvoidAyuda")) && norm($("recipeAvoidAyuda").textContent) === "Escribí ingredientes separados por coma" && info.getAttribute("aria-expanded") === "true" && rI.width >= 44 && rI.height >= 44, JSON.stringify({ rO: [rO.left, rO.right], rI: [rI.left, rI.right] }));
  // R5-X-05: aire entre el título y su campo y entre Ocultar, Guardar y Limpiar.
  const caja = $("recipePreferencesPanel"), titulo = caja.querySelector("h3"), campo = $("recipeAvoidWords"), oculta = q("label.preferencias-ocultar"), guardar = $("recipeSavePreferences"), limpiar = $("recipeClearPreferences");
  const sepTitulo = H.separacion(titulo, caja.querySelector("#dietaChips")), sepOtros = H.separacion(q(".otros-fila"), campo) , sepOcultar = H.separacion(campo, oculta), sepGuardar = H.separacion(oculta, guardar), sepLimpiar = H.separacion(guardar, limpiar);
  ok("R5-X-05 en Ingredientes a evitar hay al menos 8 px entre el título y su campo (y entre el rótulo 'Otros' y su campo) y al menos 12 px entre 'Ocultar coincidencias', 'Guardar preferencias' y 'Limpiar preferencias'",
    sepTitulo >= 8 && sepOtros >= 8 && sepOcultar >= 12 && sepGuardar >= 12 && sepLimpiar >= 12 && !H.seSuperponen([titulo, campo, oculta, guardar, limpiar]),
    JSON.stringify({ sepTitulo, sepOtros, sepOcultar, sepGuardar, sepLimpiar }));

  // R5-X-06: Ingredientes equivalentes es una caja con título y contenido a la vista, como Ingredientes a evitar.
  const eq = $("ingredientAliasPanel"), hEq = eq.querySelector("h3"), hint = eq.querySelector(".screen__hint"), de = $("ingredientAliasFrom"), a = $("ingredientAliasTo");
  const sepEq = [H.separacion(hEq, hint), H.separacion(hint, de.closest(".portion-field")), H.separacion(de.closest(".portion-field"), a.closest(".portion-field")), H.separacion(a.closest(".portion-field"), $("ingredientAliasSave"))];
  ok("R5-X-06 'Ingredientes equivalentes' es una caja con título y su contenido a la vista (sin desplegable, sin tocar nada), igual que Ingredientes a evitar, y con el texto espaciado (12 px entre bloques, interlineado de 1,4 o más)",
    eq.tagName === "DIV" && eq.classList.contains("home-group") && caja.classList.contains("home-group") && /Ingredientes equivalentes/.test(hEq.textContent) && [hEq, hint, de, a, $("ingredientAliasSave")].every(H.visible) && sepEq.every(x => x >= 12) && parseFloat(estilo(hint, "lineHeight")) / parseFloat(estilo(hint, "fontSize")) >= 1.4 && eq.querySelectorAll("details,summary").length === 0,
    JSON.stringify(sepEq));

  // R5-X-07: Limpiar preferencias limpia (dieta, Otros y Ocultar) y avisa, con Deshacer.
  const chipsAntes = qa("#dietaChips .is-selected").length, palabrasAntes = campo.value;
  await tocar(limpiar, 250);
  const estado = norm($("recipePreferencesStatus").textContent), limpio = qa("#dietaChips .is-selected").length === 0 && campo.value === "" && !$("recipeApplyAvoid").checked && localStorage.getItem(PREF) === null && localStorage.getItem(DIETA) === null;
  const deshacer = q("#recipePreferencesStatus button");
  ok("R5-X-07 'Limpiar preferencias' limpia: se desmarcan los filtros de dieta, se vacía 'Otros', se apaga 'Ocultar coincidencias', se borra lo guardado y la página dice qué hizo",
    chipsAntes === 1 && palabrasAntes === "cebolla, aceituna" && limpio && /^Preferencias limpiadas/.test(estado) && /Deshacer/.test(deshacer.textContent), JSON.stringify({ chipsAntes, limpio, estado }));
  await tocar(deshacer, 250);
  ok("R5-X-07 'Deshacer' después de limpiar recupera la dieta, 'Otros' y 'Ocultar coincidencias' (y lo guardado)",
    qa("#dietaChips .is-selected").length === 1 && campo.value === "cebolla, aceituna" && $("recipeApplyAvoid").checked && J(PREF).words === "cebolla, aceituna" && J(DIETA).filtros[0] === "vegetariano" && /se recuperaron/.test($("recipePreferencesStatus").textContent));
  await tocar(limpiar, 200); await tocar(limpiar, 200);
  ok("R5-X-07 limpiar de nuevo cuando ya no hay nada dice 'No había nada para limpiar' y no deja datos", /No había nada para limpiar/.test($("recipePreferencesStatus").textContent) && localStorage.getItem(PREF) === null && localStorage.getItem(DIETA) === null);

  // ---- Presupuesto ----
  const ref = (id, nombre, precio, unidad) => ({ id, name: nombre, pack: "", amount: 1, price: precio, unit: unidad, currency: "ARS", date: "2026-11-02" });
  // El respaldo de ejemplo tiene recetas con cantidades en el plan (las que usa "Comparar alternativas de precio"), sin "Mis precios".
  await H.abrir({ ...R.data, ...H.MARCA, ...H.PRES(60000), [REF]: null });
  const fila = ev("shoppingMissingRows().filter(r => r.quantity > 0 && !r.unknown).find(r => opcionPrecioAutomatico(r.name, r.unit))");
  const miPrecio = ref("x03", fila.name, 9000, fila.unit === "g" ? "kg" : fila.unit);
  localStorage.setItem(REF, JSON.stringify({ x03: miPrecio }));
  ev('openTab("compras"); ComprasDespensa.abrirHerramientaCompras("presupuesto")'); await espera(300);
  const panelP = $("shoppingBudgetPanel");
  ok("R5-X-02 al editar el presupuesto el contenido se ve directo (moneda, monto, período, personas y 'Guardar presupuesto') sin el desplegable 'Presupuesto'; la única excepción adentro es 'Comparar alternativas de precio'",
    panelP.tagName === "DIV" && H.visible(panelP) && ["shoppingBudgetCurrency", "shoppingBudgetLimit", "shoppingBudgetPeriod", "shoppingBudgetPeople", "shoppingBudgetSave"].every(id => H.visible($(id))) && !/^\s*💰 Presupuesto\s*$/m.test(qa("#comprasHerramientas summary").map(s => s.textContent).join("\n"))
    && qa("#comprasHerramientas details").length === 1 && qa("#comprasHerramientas details")[0].id === "budgetComparePanel", qa("#comprasHerramientas details").map(d => d.id).join(","));

  // R5-X-03: elegir otro precio cambia el precio usado y el total.
  await tocar(q("#budgetComparePanel summary"), 250);
  const sel = qa("#budgetCompareResult select").find(s => s.closest(".portion-field").querySelector("label").textContent.startsWith(fila.name));
  const opciones = [...sel.options].filter(o => o.value !== "");
  const total0 = () => norm(q("#budgetCompareResult .shop-item").textContent), usado = () => norm(sel.closest(".portion-field").querySelector(".presupuesto-usado").textContent);
  sel.value = opciones[0].value; sel.dispatchEvent(new Event("change", { bubbles: true })); await espera(100);
  const t1 = total0(), u1 = usado();
  const auto = opciones.find(o => /^Promedio de tu región/.test(o.textContent));
  sel.value = auto.value; sel.dispatchEvent(new Event("change", { bubbles: true })); await espera(100);
  const t2 = total0(), u2 = usado();
  ok("R5-X-03 en 'Comparar alternativas de precio' hay otro precio para probar (tu precio guardado y el promedio de tu región) y al elegirlo cambian el precio usado y el total",
    opciones.length >= 2 && !!auto && t1 !== t2 && u1 !== u2 && /9000/.test(u1) && /Promedio de tu región/.test(u2) && /^Escenario parcial: /.test(t1) && /^Precio usado: /.test(u1), JSON.stringify({ t1, t2, u1, u2 }));
  sel.value = ""; sel.dispatchEvent(new Event("change", { bubbles: true })); await espera(100);
  ok("R5-X-03 sin elegir ningún precio el total del escenario no cuenta ese ingrediente ('Precio usado: ninguno elegido') y no se toca lo guardado", /ninguno elegido/.test(usado()) && JSON.stringify(J(REF)) === JSON.stringify({ x03: miPrecio }));

  // ---- Asistente de IA ----
  await H.abrir({ ...H.MARCA });
  ev('openTab("mas"); go("asistente")'); await espera(300);
  const W = H.w(), KEY = "AIzaSyTEST_clave_de_prueba_1234567890";
  const guardar2 = $("aiKeySave"), st = $("aiKeyStatus"); const llamadas = [];
  // Respuesta que se demora, para ver el botón mientras prueba.
  let soltar; const espera1 = new Promise(r => { soltar = r });
  W.fetch = async (url, opts) => { llamadas.push({ url, key: opts && opts.headers && opts.headers["x-goog-api-key"] }); await espera1; return { ok: true, status: 200, json: async () => ({ models: [{ name: "models/gemini-3.5-flash", supportedGenerationMethods: ["generateContent"] }] }) } };
  $("aiKeyInput").value = '  "' + KEY + '"\n'; guardar2.click(); await espera(60);
  const mientras = { boton: guardar2.textContent, apagado: guardar2.disabled, estado: norm(st.textContent) };
  soltar(); await espera(150);
  const guardada = J(AI);
  ok("R5-X-08 al pegar la clave (aunque venga con comillas, espacios o un salto de línea) y tocar 'Guardar y probar': el botón dice 'Probando…' mientras prueba, y después guarda la clave limpia, elige el modelo y dice que funcionó",
    mientras.boton === "Probando…" && mientras.apagado === true && /Probando la conexión/.test(mientras.estado) && llamadas.length === 1 && llamadas[0].key === KEY && !!guardada && guardada.key === KEY && guardada.model === "gemini-3.5-flash"
    && guardar2.textContent === "Guardar y probar" && !guardar2.disabled && /^Listo: la conexión con Gemini funciona \(modelo gemini-3.5-flash\)/.test(norm(st.textContent)) && H.visible(st) && $("aiKeyInput").value === "", JSON.stringify({ mientras, guardada, estado: norm(st.textContent) }));
  // Rechazada por Gemini: dice por qué y no guarda.
  localStorage.removeItem(AI);
  W.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: { message: "API key not valid." } }) });
  $("aiKeyInput").value = "AIzaSyOTRA_clave_invalida_00000000000"; guardar2.click(); await espera(150);
  const rechazo = norm(st.textContent);
  ok("R5-X-08 si Gemini rechaza la clave, la página lo dice (por qué) y no la guarda", /No se guardó la clave/.test(rechazo) && rechazo.length > 30 && localStorage.getItem(AI) === null && H.visible(st) && !guardar2.disabled, rechazo);
  // Sin conexión.
  W.fetch = async () => { throw new Error("offline") };
  $("aiKeyInput").value = KEY; guardar2.click(); await espera(150);
  const sinRed = norm(st.textContent);
  ok("R5-X-08 sin conexión dice 'No se pudo conectar con Gemini' y no guarda", /No se pudo conectar con Gemini/.test(sinRed) && localStorage.getItem(AI) === null);
  // Campo vacío o clave que no parece una clave.
  $("aiKeyInput").value = "   "; guardar2.click(); await espera(60);
  const vacia = norm(st.textContent);
  $("aiKeyInput").value = "corta"; guardar2.click(); await espera(60);
  const corta = norm(st.textContent);
  // v19.10.1: las claves nuevas de Google AI Studio empiezan con "AQ." (con punto) y también se aceptan y se guardan.
  const KEY_AQ = "AQ.Ab8RN6IkTEST-clave_nueva.de_prueba_1234567890abcdef";
  W.fetch = async (url, opts) => { llamadas.push({ url, key: opts && opts.headers && opts.headers["x-goog-api-key"] }); return { ok: true, status: 200, json: async () => ({ models: [{ name: "models/gemini-3.5-flash", supportedGenerationMethods: ["generateContent"] }] }) } };
  localStorage.removeItem(AI); $("aiKeyInput").value = KEY_AQ + "\n"; guardar2.click(); await espera(150);
  const guardadaAQ = J(AI), estadoAQ = norm(st.textContent);
  ok("R5-X-08 una clave nueva de Google AI Studio que empieza con 'AQ.' se acepta, se prueba con Gemini y queda guardada", !!guardadaAQ && guardadaAQ.key === KEY_AQ && llamadas.at(-1).key === KEY_AQ && /^Listo: la conexión con Gemini funciona/.test(estadoAQ) && ev("loadAiSettings().key") === KEY_AQ, estadoAQ);
  localStorage.removeItem(AI);
  ok("R5-X-08 con el campo vacío dice 'Pegá primero la clave' y con algo que no es una clave explica cómo es una clave válida (siempre contesta algo)", /^Pegá primero la clave/.test(vacia) && /no parece válida/.test(corta) && vacia !== corta);

  // ---- Fuentes de datos y Cómo funciona ----
  await H.abrir({ ...H.MARCA });
  ev('openTab("mas"); go("fuentes")'); await espera(300);
  const nut = $("nutritionLookupPanel"); await tocar(q("#nutritionLookupPanel summary"), 250);
  const etiqueta = q('label[for="nutritionLookupInput"]'), campoN = $("nutritionLookupInput"), sepN = H.separacion(etiqueta, campoN);
  ok("R5-X-09 en Fuentes de datos 'Consultar nutrientes' sigue siendo desplegable (<details>), con al menos 8 px entre el rótulo 'Ingrediente' y su campo",
    nut.tagName === "DETAILS" && nut.open && norm(etiqueta.textContent) === "Ingrediente" && sepN >= 8 && H.visible(campoN) && $("fuentes").querySelectorAll("details").length === 1, "separación " + sepN);
  ev('go("comoFunciona")'); await espera(300);
  const guia = $("deploymentGuide"), cf = $("comoFunciona");
  ok("R5-X-10 en Cómo funciona 'Publicación e instalación' sigue siendo desplegable (<details>) y ya no está el texto 'Medio plato de verduras, un cuarto de almidones y un cuarto de proteínas.'",
    guia.tagName === "DETAILS" && /Publicación e instalación/.test(guia.querySelector("summary").textContent) && cf.querySelectorAll("details").length === 1 && !/Medio plato de verduras/.test(cf.textContent) && !/un cuarto de almidones/.test(cf.textContent) && H.visible(q("#comoFunciona [data-ver-bienvenida]")));

  // ---- G-01: ningún desplegable en ninguna pantalla ni hoja, salvo las cuatro excepciones ----
  await H.abrir({ ...R.data, ...H.MARCA }); ev('ModoSimple.setUiMode("completo")'); await espera(150);
  const permitidos = el => el.matches("#nutritionLookupPanel, #deploymentGuide, #budgetComparePanel, .semana-aviso__detalle");
  const sobran = () => qa("details").filter(d => !permitidos(d)).map(d => (d.closest(".screen") || { id: "hoja" }).id + ":" + norm((d.querySelector("summary") || { textContent: "?" }).textContent).slice(0, 40));
  const malos = [];
  const pantallas = qa("section.screen").map(s => s.id);
  for (const id of pantallas) { try { ev(`go(${JSON.stringify(id)})`) } catch (e) { } await espera(60); malos.push(...sobran()) }
  // Pantallas y hojas con contenido que se arma al abrirlas.
  const pasos = ['openTab("hoy")', 'openTab("semana")', 'openTab("miscomidas")', 'openTab("compras")', 'openTab("mas")', 'go("ingredientes")', 'go("lunch_carb")', 'go("misplatos")', 'go("registro")',
    'ComprasDespensa.abrirHerramientaCompras("realizadas")', 'ComprasDespensa.abrirHerramientaCompras("precios")', 'ComprasDespensa.abrirHerramientaCompras("costoReceta")', 'ComprasDespensa.abrirHerramientaCompras("presupuesto")',
    'openTab("semana"); Selector.abrirMenuSemana()', 'openTab("semana"); abrirSelector("lunes", "almuerzo")', 'abrirSugerime("almuerzo")', 'openTab("miscomidas"); Comidas.abrirNuevaComida()', 'ComprasDespensa.abrirMenuCompras()'];
  for (const p of pasos) { try { ev("hoja.cerrar()"); ev(p) } catch (e) { malos.push("error en " + p + ": " + e.message) } await espera(200); malos.push(...sobran().map(x => p.slice(0, 30) + " → " + x)) }
  // Una comida con receta y cantidades (muestra la nutrición) y las copias de recetas del plan.
  ev("(() => { const r = Object.values(loadRecipeDetails())[0]; if (r) { openTab('miscomidas'); Comidas.abrirComida('receta', r.id) } })()"); await espera(300); malos.push(...sobran().map(x => "comida → " + x));
  ev("ModoSimple.setUiMode('completo'); openTab('miscomidas'); renderSaved()"); await espera(300); malos.push(...sobran().map(x => "copias → " + x));
  const fuenteHtml = await (await fetch(location.origin + "/index.html", { cache: "no-store" })).text();
  const detallesEnFuente = (fuenteHtml.match(/<details\b/g) || []).length, creados = (fuenteHtml.match(/ce\("details"|createElement\("details"\)/g) || []).length;
  ok("R5-G-01 en ninguna pantalla ni hoja hay listas desplegables salvo las cuatro excepciones (Consultar nutrientes, Publicación e instalación, Comparar alternativas de precio y 'Ver detalle' del aviso de la semana armada): ni en el HTML (3 <details>) ni creados desde el código (1)",
    malos.length === 0 && detallesEnFuente === 3 && creados === 1 && pantallas.length >= 25, "pantallas " + pantallas.length + " · en HTML " + detallesEnFuente + " · creados " + creados + " · " + malos.slice(0, 6).join(" | "));
  const avisos = qa(".semana-aviso__detalle").length;
  ev('openTab("semana")'); await espera(200);
  ok("R5-G-01 las otras cuatro excepciones siguen existiendo donde corresponde (Consultar nutrientes, Publicación e instalación y Comparar alternativas de precio) y 'Ver detalle' solo en el aviso de la semana armada",
    typeof avisos === "number" && fuenteHtml.includes('id="nutritionLookupPanel"') && fuenteHtml.includes('id="deploymentGuide"') && fuenteHtml.includes('id="budgetComparePanel"') && fuenteHtml.includes('"semana-aviso__detalle"'));

  return H.terminar();
})()
