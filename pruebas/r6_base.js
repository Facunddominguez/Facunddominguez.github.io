// Ayudas de las pruebas de la Ronda 6 (Etapas 45 a 55). run_all.js lo carga después de r5_base.js: define window.R6H.
// R6H() devuelve todo lo de R5H() y suma la fecha fija: las pruebas que dependen del día (lista por período, Para mañana, Armame,
// antigüedad de los precios) fijan el "hoy" de la app con H.fijarFecha("2026-11-26"), como armarFijo de pruebas/e20_un_costo.js.
// Cada nombre de prueba empieza con el código del ítem (R6-P-04) y un espacio.
window.R6H = (ancho0 = 390) => {
  const H = window.R5H(ancho0);
  // Reemplaza Date en la ventana de la app: new Date() y Date.now() dan ese día (a las 12:00, hora local) y todo lo demás sigue igual.
  const fijarFecha = (iso, hora = "12:00:00") => H.w().eval(`(()=>{const Real=window.__DateReal||Date,t=new Real(${JSON.stringify(iso + "T" + hora)}).getTime();window.__DateReal=Real;class F extends Real{constructor(...a){if(a.length)super(...a);else super(t)}static now(){return t}}window.Date=F})()`);
  const liberarFecha = () => H.w().eval("if(window.__DateReal){window.Date=window.__DateReal}");
  // Abre la app con esos datos y con el día fijo ya puesto antes de que la app pinte nada que dependa de él.
  const abrirEn = async (iso, datos, opciones) => { const w = await H.abrir(datos, opciones); fijarFecha(iso); return w };
  const J = k => JSON.parse(localStorage.getItem(k) || "null");
  const norm = t => String(t || "").replace(/\s+/g, " ").trim();
  return { ...H, fijarFecha, liberarFecha, abrirEn, J, norm };
};
