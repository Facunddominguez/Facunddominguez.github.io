// Ayudas de las pruebas de la Ronda 6 (Etapas 45 a 55). run_all.js lo carga después de r5_base.js: define window.R6H.
// R6H() devuelve todo lo de R5H() y suma la fecha fija: las pruebas que dependen del día (lista por período, Para mañana, Armame,
// antigüedad de los precios) fijan el "hoy" de la app con H.fijarFecha("2026-11-26"), como armarFijo de pruebas/e20_un_costo.js.
// Cada nombre de prueba empieza con el código del ítem (R6-P-04) y un espacio.
// Etapa 46: "Esta semana" de la lista cuenta de hoy al domingo (R6-L-02). Las pruebas viejas de Compras arman el plan con comidas del lunes
// y miraban la lista entera: para no depender del día en que se corren, la app de la prueba se abre un lunes (el de la semana de hoy, así
// las claves por semana siguen siendo las mismas). R6_LUNES(w) lo fija en esa ventana y R6_REAL(w) lo devuelve.
window.R6_LUNES = w => {
  const R = w.__DateReal || w.Date, hoy = new Date(), dow = (hoy.getDay() + 6) % 7, t = new R(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - dow, 12, 0, 0).getTime();
  w.__DateReal = R;
  w.Date = class extends R { constructor(...a) { if (a.length) super(...a); else super(t) } static now() { return t } };
};
window.R6_REAL = w => { if (w.__DateReal) w.Date = w.__DateReal };
window.R6H = (ancho0 = 390) => {
  const H = window.R5H(ancho0);
  // Reemplaza Date en la ventana de la app: new Date() y Date.now() dan ese día (a las 12:00, hora local) y todo lo demás sigue igual.
  const fijarFecha = (iso, hora = "12:00:00") => H.w().eval(`(()=>{const Real=window.__DateReal||Date,t=new Real(${JSON.stringify(iso + "T" + hora)}).getTime();window.__DateReal=Real;class F extends Real{constructor(...a){if(a.length)super(...a);else super(t)}static now(){return t}}window.Date=F})()`);
  const liberarFecha = () => H.w().eval("if(window.__DateReal){window.Date=window.__DateReal}");
  // Abre la app con esos datos y con el día fijo ya puesto antes de que la app pinte nada que dependa de él.
  const abrirEn = async (iso, datos, opciones) => { const w = await H.abrir(datos, opciones); fijarFecha(iso); return w };
  const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"], SLOTS = ["desayuno", "merienda", "almuerzo", "cena"];
  // Un plan (texto JSON) con solo esos huecos llenos: planDe([["lunes", "almuerzo", "rp_x"], ...]).
  const planDe = slots => { const p = {}; for (const d of DIAS) p[d] = { desayuno: null, merienda: null, almuerzo: null, cena: null }; for (const [d, c, id] of slots) p[d][c] = id; return p };
  // Recetas con cantidades, guardadas como comidas: recetas([{ id, titulo, filas: [{ name, quantity, unit }], rinde?, pasos? }]) →
  // claves del almacenamiento (el id de la comida guardada es "rp_" + id). Se mezclan con otras claves con { ...recetas(...), ... }.
  const recetas = lista => ({
    miPlatoFacil_recipeDetails_v1: JSON.stringify(Object.fromEntries(lista.map(r => [r.id, { id: r.id, title: r.titulo, sourceTitle: null, amountsTitle: "receta:" + r.id, steps: r.pasos || ["Cocinar"], notes: "" }]))),
    miPlatoFacil_recipeAmounts_v1: JSON.stringify(Object.fromEntries(lista.map(r => ["receta:" + r.id, { yield: r.rinde || 1, rows: r.filas }]))),
    miPlatoFacil_saved: JSON.stringify(lista.map(r => ({ id: "rp_" + r.id, savedAt: "2026-10-26T10:00:00.000Z", type: r.tipo || "plato", title: r.titulo, lines: [], sig: "recipe-ref:" + r.id + ":" + (r.tipo || "plato"), text: r.titulo, cooked: 0, state: null, fav: !!r.fav, recipeSourceId: r.id, recipeIngredients: r.filas.map(x => x.name) }))),
  });
  // La semana que viene: miPlatoFacil_planProxima_v1 = { lunes, plan }.
  const proxima = (lunes, slots) => ({ miPlatoFacil_planProxima_v1: JSON.stringify({ lunes, plan: planDe(slots) }) });
  const J = k => JSON.parse(localStorage.getItem(k) || "null");
  const norm = t => String(t || "").replace(/\s+/g, " ").trim();
  return { ...H, fijarFecha, liberarFecha, abrirEn, J, norm, DIAS, SLOTS, planDe, recetas, proxima };
};
