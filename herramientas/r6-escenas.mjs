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
export const ESCENAS = [
  // Etapa 45 · Precios confiables (los precios incluidos son del 4/11; el teléfono de la captura marca el 26/11: 22 días)
  { id: 'lista-precios', items: ['P-04', 'P-05'], oscuro: true, ir: HOY('2026-11-26') + armarSemana + 'openTab("compras"); ' + esperar },
  { id: 'presupuesto-precios', items: ['P-04'], ir: HOY('2026-11-26') + 'localStorage.setItem("miPlatoFacil_shoppingBudget_v1", JSON.stringify({ currency: "ARS", limit: 60000, period: "semana" })); ' + armarSemana + 'openTab("compras"); ComprasDespensa.abrirHerramientaCompras("presupuesto"); ' + esperar },
  { id: 'ficha-precio', items: ['P-04'], ir: HOY('2026-11-26') + 'openTab("semana"); hoja.abrir({ titulo: "Precio de Arroz", contenido: [fichaPrecio("Arroz")], botones: [] }); ' + esperar, medir: '.hoja' },
];
// Ítems que se comprueban en la salida de una herramienta y no en una pantalla: su "captura" es un texto
// (docs/capturas-ronda-6/<nombre>-antes.txt y -despues.txt).
export const SALIDAS = { 'P-01': ['p-01'], 'P-02': ['p-02'], 'P-03': ['p-03'] };
