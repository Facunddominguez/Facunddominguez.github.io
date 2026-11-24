// Escenas de captura de la Ronda 5: una por pantalla u hoja que muestra algún ítem de docs/ronda-5-lista.md.
// Las usa `node herramientas/capturas.mjs --r5 antes|despues [--ids S-11,S-12] [--ancho 360]`.
//   id     nombre de la captura (docs/capturas-ronda-5/<id>-antes.png, y -oscuro si la escena pide tema oscuro);
//   items  los ítems de la lista que la escena muestra;
//   ir     código que lleva la app a esa pantalla (corre en la página, con las funciones globales de la app y `await`);
//   medir  selector del contenedor si es una hoja (".hoja");
//   estado "normal" (el respaldo de ejemplo, por omisión) o "vacio" (primer uso);
//   oscuro true si el ítem también se muestra en tema oscuro.
// Cuando una pantalla cambia, se actualiza el camino de la escena, no su significado: el "antes" y el "después" usan la misma.
const esperar = 'await new Promise(r => setTimeout(r, 200)); ';
export const ESCENAS = [
  // Etapa 34 · Semana
  { id: 'semana', items: ['S-15', 'S-17'], ir: 'openTab("semana")', oscuro: true },
  { id: 'semana-menu', items: ['S-13', 'S-14', 'S-16', 'S-18'], ir: 'openTab("semana"); Selector.abrirMenuSemana()', medir: '.hoja' },
  { id: 'semana-compartir', items: ['S-11', 'S-12'], ir: 'openTab("semana"); Selector.abrirMenuSemana(); ' + esperar + 'document.querySelector("[data-compartir-semana-menu]").click()', medir: '.hoja' },
  { id: 'semana-planes', items: ['S-15'], ir: 'openTab("semana"); if (Selector.abrirPlanesGuardados) Selector.abrirPlanesGuardados(); else Selector.abrirMenuSemana()', medir: '.hoja' },
  { id: 'semana-selector', items: ['S-19'], ir: 'openTab("semana"); abrirSelector("lunes", "almuerzo")', medir: '.hoja' },
  // Etapa 35 · Semanas anteriores y mes
  { id: 'semanas', items: ['S-01', 'S-02', 'S-03', 'S-04', 'S-06', 'S-14'], ir: 'openTab("semana"); abrirHerramientaPlan("semanas")' },
  { id: 'semanas-hoja', items: ['S-05'], ir: 'openTab("semana"); abrirHerramientaPlan("semanas"); ' + esperar + 'const h = document.querySelector("#datedWeekView [data-hueco]"); if (h) h.click()', medir: '.hoja' },
  // Etapa 36 · Completar precios
  { id: 'completar-precios', items: ['S-07', 'S-08', 'S-10'], ir: 'localStorage.removeItem("miPlatoFacil_referencePrices_v1"); refrescarPrecios(); openTab("semana"); renderPlan(); ' + esperar + 'document.querySelector("[data-completar-precios]").click()', medir: '.hoja' },
  { id: 'completar-precios-guardado', items: ['S-09'], ir: 'localStorage.removeItem("miPlatoFacil_referencePrices_v1"); refrescarPrecios(); openTab("semana"); renderPlan(); ' + esperar + 'document.querySelector("[data-completar-precios]").click(); ' + esperar + 'const m = document.getElementById("completarMonto"); if (m) { const n = document.querySelector(".completar-precios__nombre").textContent; m.value = String(Math.max(1, Math.round((costoDeIngrediente(n, 1, unidadSugeridaFicha(n)) || { costo: 2000 }).costo))); [...document.querySelectorAll(".hoja button")].find(b => /^Guardar precios$/.test(b.textContent)).click() }', medir: '.hoja' },
  // Etapa 37 · Elegir o cambiar una comida
  { id: 'cambiar-armar-nueva', items: ['C-01'], ir: 'openTab("semana"); Semana.elegirDiaPlan("lunes"); renderPlan(); const w = ms => new Promise(r => setTimeout(r, ms)); const t = sel => { const e = document.querySelector(sel); if (e) e.click(); return w(300) }; await w(200); await t(\'#planList [data-hueco="lunes|almuerzo"]\'); await t(".hoja [data-hueco-cambiar]"); await t(\'.hoja [data-start="plato"]\'); await t(\'#day [data-day="Día libre"]\'); await t(\'#plate_static [data-go="lunch_veg"]\'); await t(\'#boxv [data-name="Tomate"]\'); await t("#nextBottom"); await t(\'#boxa [data-name="Papa"]\'); await t("#nextBottom"); await t(\'#boxp [data-name="Merluza"]\'); await t("#nextBottom"); await t("#resumen [data-save-plate]"); await t(".hoja .button--primary"); await w(300)' },
  { id: 'sugerime-desayuno', items: ['C-02'], ir: 'openTab("semana"); abrirSelector("lunes", "desayuno"); ' + esperar + '[...document.querySelectorAll(".hoja button")].find(b => /Sugerime/.test(b.textContent)).click()', medir: '.hoja' },
  { id: 'comida-receta', items: ['C-03'], ir: 'openTab("miscomidas"); const g = MisPlatos.loadSaved()[0] || IdeasHoja.guardarIdea(data.menuCatalog[0]).item; Comidas.abrirComida("plato", g.id)' },
  { id: 'selector-dieta', items: ['C-04'], ir: 'localStorage.setItem("miPlatoFacil_dieta_v1", JSON.stringify({ filtros: ["vegetariano"] })); openTab("semana"); abrirSelector("lunes", "almuerzo")', medir: '.hoja' },
  // Etapa 38 · Hoy
  { id: 'hoy', items: ['H-02', 'H-05'], ir: 'openTab("hoy")', oscuro: true },
  { id: 'hoy-lo-comi', items: ['H-01'], ir: 'openTab("hoy"); ' + esperar + 'const b = document.querySelector("#todayRows [data-today-eaten]"); if (b) b.click(); ' + esperar },
  { id: 'hoy-sugerime', items: ['H-03', 'H-04'], ir: 'openTab("hoy"); abrirSugerime("desayuno")', medir: '.hoja' },
  // Etapa 39 · Registro y "Lo comí"
  { id: 'registro', items: ['R-02', 'R-03', 'R-04', 'R-05', 'R-06'], ir: 'openTab("mas"); abrirRegistro()', oscuro: true },
  { id: 'comida-lo-comi', items: ['R-01'], ir: 'openTab("miscomidas"); const g = MisPlatos.loadSaved()[0] || IdeasHoja.guardarIdea(data.menuCatalog[0]).item; Comidas.abrirComida("plato", g.id)' },
  { id: 'registro-graficos', items: ['R-07', 'R-08', 'R-09', 'R-10'], oscuro: true, ir: 'const L = mondayOf(Rutina.localTrainingDate(new Date())), d1 = Rutina.localTrainingDate(new Date()); const c = JSON.parse(localStorage.getItem("miPlatoFacil_consumption_v1") || "[]").filter(x => !String(x.id).startsWith("r5")); c.push({ id: "r5a", date: d1, meal: "almuerzo", title: "Milanesa con ensalada", groups: ["verduras", "legumbres"], sourceId: null, planned: true }, { id: "r5b", date: d1, meal: "cena", title: "Pescado con puré", groups: ["pescado", "verduras"], sourceId: null, planned: false }, { id: "r5c", date: d1, meal: "merienda", title: "Fruta", groups: ["fruta"], sourceId: null, planned: false }); localStorage.setItem("miPlatoFacil_consumption_v1", JSON.stringify(c)); const dia = n => { const x = new Date(L + "T12:00:00"); x.setDate(x.getDate() + n); return Rutina.localTrainingDate(x) }; localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 50000, period: "semana" })); localStorage.setItem("miPlatoFacil_purchases_v1", JSON.stringify([{ id: "r5p1", date: dia(-20), store: "Súper", currency: "ARS", total: 30000, items: [] }, { id: "r5p2", date: dia(-6), store: "Súper", currency: "ARS", total: 65000, items: [] }, { id: "r5p3", date: dia(0), store: "Súper", currency: "ARS", total: 45000, items: [] }])); openTab("mas"); abrirRegistro(); ' + esperar },
  // Etapa 40 · Comidas e IA (la misma ruta sirve para el antes: usa lo que haya en pantalla)
  { id: 'ideas', items: ['M-02', 'M-03', 'M-10'], ir: 'openTab("miscomidas"); abrirIdeas(false)', oscuro: true },
  { id: 'ideas-busqueda', items: ['M-04', 'M-05', 'M-06', 'M-07', 'M-08'], oscuro: true, ir: 'openTab("miscomidas"); abrirIdeas(false); showRecipeView("browse"); ' + esperar + 'const c = document.querySelector(\'[data-buscar="tiempo"][data-valor="20"]\'); if (c) c.click(); else { const t = document.getElementById("recipeCatalogTime"); t.value = "15"; t.dispatchEvent(new Event("change")) } ' + esperar + 'document.getElementById("recipeDetailsPanel").scrollIntoView({ block: "start" }); ' + esperar },
  { id: 'ideas-ia', items: ['M-09', 'A-01'], ir: 'localStorage.setItem("miPlatoFacil_aiSettings_v1", JSON.stringify({ key: "AIzaSyTEST_clave_de_prueba_1234567890", model: "gemini-3.5-flash" })); AsistenteIA.renderAllAiRunners(); openTab("miscomidas"); abrirIdeas(false); ' + esperar + 'const b = document.getElementById("aiIdeasBoton"); if (b) { b.click() } else { document.getElementById("aiIdeasPanel").open = true } ' + esperar + 'document.getElementById("aiIdeasPanel").scrollIntoView({ block: "start" }); ' + esperar },
  { id: 'receta-nueva', items: ['M-01', 'A-01'], ir: 'localStorage.removeItem("miPlatoFacil_aiSettings_v1"); AsistenteIA.renderAllAiRunners(); openTab("miscomidas"); resetRecipeDetailsForm(); showRecipeView("editor")' },
  // Etapa 41 · Compras y Despensa (la misma ruta sirve para el antes y el después: usa lo que haya en pantalla)
  { id: 'compras', items: ['K-02', 'K-03', 'K-04'], ir: 'openTab("compras"); ' + esperar },
  { id: 'compras-menu', items: ['K-10', 'K-11', 'K-12', 'K-13'], ir: 'openTab("compras"); ComprasDespensa.abrirMenuCompras()', medir: '.hoja' },
  { id: 'compras-comprado', items: ['K-01'], ir: 'openTab("compras"); ' + esperar + 'const c = document.querySelector("#comprasList input[type=checkbox]"); if (c) c.click(); ' + esperar + 'document.getElementById("comprasBought").click(); ' + esperar },
  { id: 'compras-realizadas', items: ['K-05', 'K-06', 'K-07', 'K-08', 'K-09'], oscuro: true, ir: 'openTab("compras"); ComprasDespensa.abrirHerramientaCompras("realizadas"); ' + esperar + 'document.getElementById("purchaseItems").replaceChildren(); for (const [n, q, u, p] of [["Arroz", 1, "kg", 1800], ["Leche entera", 2, "l", 3200], ["Tomate", 0.5, "kg", 1500]]) ComprasHechas.appendPurchaseItem({ name: n, quantity: q, unit: u, price: p }); const t = document.getElementById("purchaseTotal"); t.value = "6.500"; t.dispatchEvent(new Event("input", { bubbles: true })); ' + esperar },
  { id: 'compras-precios', items: ['K-14', 'K-15'], ir: 'openTab("compras"); ComprasDespensa.abrirHerramientaCompras("precios"); ' + esperar },
  { id: 'compras-costo-receta', items: ['K-14'], ir: 'openTab("compras"); ComprasDespensa.abrirHerramientaCompras("costoReceta"); ' + esperar },
  { id: 'despensa', items: ['K-02', 'K-12', 'K-16', 'K-17'], ir: 'ModoSimple.setUiMode("completo"); openTab("compras"); renderPantry(); go("ingredientes"); ' + esperar },
  // Etapa 42 · Más (la misma ruta sirve para el antes y el después)
  { id: 'preferencias', items: ['X-01', 'X-04', 'X-05', 'X-06', 'X-07'], oscuro: true, ir: 'ModoSimple.setUiMode("completo"); openTab("mas"); go("preferencias"); ' + esperar },
  { id: 'presupuesto', items: ['X-02', 'X-03'], ir: 'localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 60000, period: "semana" })); openTab("compras"); ComprasDespensa.abrirHerramientaCompras("presupuesto"); ' + esperar + 'const c = document.querySelector("#budgetComparePanel"); if (c) { c.open = true; if (document.getElementById("budgetCompareRefresh")) document.getElementById("budgetCompareRefresh").click() } ' + esperar },
  { id: 'asistente-ia', items: ['X-08'], ir: 'openTab("mas"); go("asistente"); ' + esperar },
  { id: 'fuentes', items: ['X-09'], ir: 'openTab("mas"); go("fuentes"); ' + esperar + 'const n = document.getElementById("nutritionLookupPanel"); if (n) n.open = true; ' + esperar },
  { id: 'como-funciona', items: ['X-10'], ir: 'openTab("mas"); go("comoFunciona"); ' + esperar + 'const p = document.querySelector("#comoFunciona details"); if (p) p.open = true; ' + esperar },
  { id: 'respaldo', items: ['G-01'], ir: 'openTab("mas"); go("backupScreen"); ' + esperar },
  { id: 'calendario', items: ['G-01'], ir: 'openTab("mas"); go("trainingCalendar"); ' + esperar },
  // Etapa 43 · Bienvenida (estado vacío: primer uso)
  { id: 'bienvenida', items: ['O-01'], estado: 'vacio', oscuro: true, ir: 'Bienvenida.abrirBienvenida(); ' + esperar },
  { id: 'bienvenida-evitar', items: ['O-02'], estado: 'vacio', oscuro: true, ir: 'Bienvenida.abrirBienvenida(); if (typeof bienvenidaIntro !== "undefined") bienvenidaIntro = false; bienvenidaPaso = 3; Bienvenida.pintarBienvenida(); ' + esperar },
];
