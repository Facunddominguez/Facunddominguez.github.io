// Escenas de captura de la Ronda 6: una por pantalla u hoja que muestra algún ítem de docs/ronda-6-lista.md.
// Las usa `node herramientas/capturas.mjs --r6 antes|despues [--ids P-04,L-01] [--ancho 360] [--raiz <copia con el código de antes>]`.
// Mismos campos que r5-escenas.mjs:
//   id     nombre de la captura (docs/capturas-ronda-6/<id>-antes.png, y -oscuro si la escena pide tema oscuro);
//   items  los ítems de la lista que la escena muestra;
//   ir     código que lleva la app a esa pantalla (corre en la página, con las funciones globales de la app y `await`);
//   medir  selector del contenedor si es una hoja (".hoja");
//   estado "normal" (el respaldo de ejemplo, por omisión) o "vacio" (primer uso);
//   oscuro true si el ítem también se muestra en tema oscuro.
// El reloj de las capturas es el 26/10/2026; las escenas que dependen del día usan HOY('AAAA-MM-DD') para fijar otro (como las pruebas).
// Cuando una pantalla cambia, se actualiza el camino de la escena, no su significado: el "antes" y el "después" usan la misma.
const esperar = 'await new Promise(r => setTimeout(r, 250)); ';
export const HOY = (iso, hora = '12:00:00') => `(() => { const R = window.__DateReal || Date, t = new R(${JSON.stringify(iso + 'T' + hora)}).getTime(); window.__DateReal = R; class F extends R { constructor(...a) { if (a.length) super(...a); else super(t) } static now() { return t } } window.Date = F })(); `;
const armarSemana = 'openTab("semana"); await ArmameSemana.correr("todo"); ' + esperar;
const armarProxima = 'openTab("semana"); Semana.verSemana(1); await ArmameSemana.correr("todo"); ' + esperar + 'Semana.verSemana(0); ';
const fichaEnSemana = 'openTab("miscomidas"); { const e = Semana.planEntriesFlat().find(x => x.item); const g = e ? e.item : (MisPlatos.loadSaved()[0] || IdeasHoja.guardarIdea(data.menuCatalog[0]).item); Comidas.abrirComida("plato", g.id); } ' + esperar;
// Para el modo cocina: una comida de la semana con algún paso que diga un tiempo (si no hay ninguna, la primera).
const fichaConTiempo = 'openTab("miscomidas"); { const es = Semana.planEntriesFlat().filter(x => x.item); let g = null; if (typeof ModoCocina !== "undefined") for (const e of es) { try { const idea = IdeasHoja.ideaDeComida(e.item); if (idea && Array.isArray(idea.pasos) && idea.pasos.some(p => ModoCocina.tiempoDePaso(p) !== null)) { g = e.item; break } } catch (x) { } } if (!g) g = es.length ? es[0].item : (MisPlatos.loadSaved()[0] || IdeasHoja.guardarIdea(data.menuCatalog[0]).item); Comidas.abrirComida("plato", g.id); } ' + esperar;
// Para la Etapa 48: la hoja de una cena de entre semana que ya tiene comida (la del miércoles).
const hojaDeUnaCena = 'openTab("semana"); Semana.elegirDiaPlan("miercoles"); renderPlan(); ' + esperar + '{ const c = document.querySelector(\'[data-hueco="miercoles|cena"]\'); if (c) c.click(); } ' + esperar;
const abrirCocina = 'if (typeof ModoCocina !== "undefined") { const c = document.querySelector("[data-comida-cocinar]"); if (c && !c.hidden) c.click(); } ' + esperar;
export const ESCENAS = [
  // Etapa 45 · Precios confiables (los precios incluidos son del 4/11; el teléfono de la captura marca el 26/11: 22 días)
  { id: 'lista-precios', items: ['P-04', 'P-05'], oscuro: true, ir: HOY('2026-11-26') + armarSemana + 'openTab("compras"); ' + esperar },
  { id: 'presupuesto-precios', items: ['P-04'], ir: HOY('2026-11-26') + 'localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 60000, period: "semana" })); ' + armarSemana + 'openTab("compras"); ComprasDespensa.abrirHerramientaCompras("presupuesto"); ' + esperar },
  { id: 'ficha-precio', items: ['P-04'], ir: HOY('2026-11-26') + 'openTab("semana"); hoja.abrir({ titulo: "Precio de Arroz", contenido: [fichaPrecio("Arroz")], botones: [] }); ' + esperar, medir: '.hoja' },
  // Etapa 46 · Lista para cuando comprás (jueves 26/11; con la semana de hoy y la que viene armadas)
  { id: 'compras-periodo', items: ['L-01', 'L-02', 'L-03', 'L-06'], oscuro: true, ir: HOY('2026-11-26') + armarSemana + armarProxima + 'openTab("compras"); ' + esperar },
  { id: 'compras-viernes', items: ['L-03'], ir: HOY('2026-11-27') + armarSemana + armarProxima + 'openTab("compras"); ' + esperar },
  { id: 'compras-proxima', items: ['L-01', 'L-04'], ir: HOY('2026-11-26') + armarSemana + armarProxima + 'openTab("compras"); ' + esperar + 'const b = document.querySelector("[data-compras-periodo=proxima]"); if (b) b.click(); ' + esperar },
  { id: 'compras-dos-tachado', items: ['L-04'], ir: HOY('2026-11-26') + armarSemana + armarProxima + 'openTab("compras"); ' + esperar + 'const d = document.querySelector("[data-compras-periodo=dos]"); if (d) d.click(); ' + esperar + 'const c = document.querySelector("#comprasList input[type=checkbox]"); if (c) c.click(); ' + esperar },
  { id: 'compras-compartir', items: ['L-05'], ir: HOY('2026-11-26') + armarSemana + armarProxima + 'openTab("compras"); ' + esperar + 'const b = document.querySelector("[data-compras-periodo=proxima]"); if (b) b.click(); ' + esperar + 'const pre = document.createElement("pre"); pre.style.whiteSpace = "pre-wrap"; pre.textContent = Compras.comprasText().split("\\n").slice(0, 14).join("\\n"); hoja.abrir({ titulo: "Texto que se comparte", contenido: [pre], botones: [] }); ' + esperar, medir: '.hoja' },
  // Etapa 47 · Modo cocina y ficha de receta (el "antes" muestra la ficha vieja y, donde no existía el modo cocina, la misma ficha)
  { id: 'ficha-comida', items: ['C-01', 'C-02', 'C-03'], oscuro: true, ir: HOY('2026-11-26') + armarSemana + fichaEnSemana },
  { id: 'ficha-receta', items: ['C-01', 'C-02'], ir: HOY('2026-11-26') + armarSemana + 'openTab("miscomidas"); const ids = Object.keys(loadRecipeDetails()); if (ids.length) Comidas.abrirComida("receta", ids[0]); ' + esperar },
  { id: 'cocina-ingredientes', fija: true, items: ['C-03', 'C-05'], oscuro: true, ir: HOY('2026-11-26') + armarSemana + fichaConTiempo + abrirCocina },
  { id: 'cocina-paso', fija: true, items: ['C-03', 'C-04', 'C-07'], oscuro: true, ir: HOY('2026-11-26') + armarSemana + fichaConTiempo + abrirCocina + 'if (typeof ModoCocina !== "undefined" && ModoCocina.datos) { const k = ModoCocina.datos.pasos.findIndex(p => ModoCocina.tiempoDePaso(p) !== null); ModoCocina.ir((k < 0 ? 0 : k) + 1); const ini = document.querySelector("[data-cocina-iniciar]"); if (ini) { ini.click(); ModoCocina.tick() } } ' + esperar },
  { id: 'cocina-final', fija: true, items: ['C-06', 'C-07'], ir: HOY('2026-11-26') + armarSemana + fichaConTiempo + abrirCocina + 'if (typeof ModoCocina !== "undefined" && ModoCocina.datos) ModoCocina.ir(ModoCocina.total()); ' + esperar },
  // Etapa 48 · Semana flexible (martes 24/11; esta semana armada por Armame; los ajustes se aplican solo si la app ya los tiene)
  { id: 'semana-hoja-lleno', items: ['F-01', 'F-02', 'F-03'], ir: HOY('2026-11-24') + armarSemana + hojaDeUnaCena, medir: '.hoja' },
  { id: 'semana-pasar', items: ['F-01'], ir: HOY('2026-11-24') + armarSemana + hojaDeUnaCena + 'const p = [...document.querySelectorAll(".hoja button")].find(b => /^Pasar a otro día$/.test(b.textContent.trim())); if (p) p.click(); ' + esperar, medir: '.hoja' },
  { id: 'semana-afuera', items: ['F-02', 'F-04'], oscuro: true, ir: HOY('2026-11-24') + 'if (typeof SemanaAjustes !== "undefined") SemanaAjustes.cambiar(a => { a.afuera["viernes|cena"] = { gasto: 12500 } }, Semana.semanaActual()); ' + armarSemana + 'Semana.elegirDiaPlan("viernes"); renderPlan(); ' + esperar },
  { id: 'semana-sobra', items: ['F-03'], oscuro: true, ir: HOY('2026-11-24') + armarSemana + 'if (typeof SemanaAjustes !== "undefined") { const e = Semana.planEntriesFlat().find(x => x.slot === "cena" && x.day === "miercoles"); if (e) SemanaAjustes.queSobre("miercoles", "cena", true) } Semana.elegirDiaPlan("jueves"); renderPlan(); ' + esperar },
  { id: 'registro-afuera', items: ['F-02'], ir: HOY('2026-11-24') + 'if (typeof SemanaAjustes !== "undefined") SemanaAjustes.cambiar(a => { a.afuera["jueves|cena"] = { gasto: 12500 }; a.afuera["sabado|almuerzo"] = { gasto: 8000 } }, Semana.semanaActual()); localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 60000, period: "semana" })); openTab("mas"); abrirRegistro(); ' + esperar },
  { id: 'respaldo-semana', items: ['F-04'], ir: 'openTab("mas"); go("backupScreen"); ' + esperar },
];
// Ítems que se comprueban en la salida de una herramienta y no en una pantalla: su "captura" es un texto
// (docs/capturas-ronda-6/<nombre>-antes.txt y -despues.txt).
// Ítems que se miran también a otro ancho (--ancho 320): sus capturas llevan el sufijo -320.
export const ANCHOS = { 'C-07': 320 };
export const SALIDAS = { 'P-01': ['p-01'], 'P-02': ['p-02'], 'P-03': ['p-03'] };
