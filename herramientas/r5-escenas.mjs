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
];
