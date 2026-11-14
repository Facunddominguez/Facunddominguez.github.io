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
  { id: 'semana-menu', items: ['S-13', 'S-16', 'S-18'], ir: 'openTab("semana"); Selector.abrirMenuSemana()', medir: '.hoja' },
  { id: 'semana-compartir', items: ['S-11', 'S-12'], ir: 'openTab("semana"); Selector.abrirMenuSemana(); ' + esperar + 'document.querySelector("[data-compartir-semana-menu]").click()', medir: '.hoja' },
  { id: 'semana-planes', items: ['S-15'], ir: 'openTab("semana"); if (Selector.abrirPlanesGuardados) Selector.abrirPlanesGuardados(); else Selector.abrirMenuSemana()', medir: '.hoja' },
  { id: 'semana-selector', items: ['S-19'], ir: 'openTab("semana"); abrirSelector("lunes", "almuerzo")', medir: '.hoja' },
];
