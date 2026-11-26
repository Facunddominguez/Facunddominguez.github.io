// Marca en docs/ronda-6-lista.md los ítems de una etapa con sus capturas (según herramientas/r6-escenas.mjs).
// Uso: node herramientas/marcar-items-r6.mjs <N> [--ids P-04,P-05] [--estado ⚠️]
// Escribe en las columnas Captura antes / Captura después los archivos que existen en docs/capturas-ronda-6/ y deja el Estado en
// ✅ solo si los dos tipos de captura existen para todas las escenas del ítem (o en el que pida --estado, para los ⚠️).
// La prueba en verde la exige la compuerta (R6-<ID>).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = resolve(fileURLToPath(new URL('../', import.meta.url)));
const args = process.argv.slice(2), N = Number(args[0]), ids = args.includes('--ids') ? args[args.indexOf('--ids') + 1].split(',') : null;
const estadoPedido = args.includes('--estado') ? args[args.indexOf('--estado') + 1] : null;
const { ESCENAS, SALIDAS } = await import('./r6-escenas.mjs');
const archivo = join(RAIZ, 'docs', 'ronda-6-lista.md');
const lineas = readFileSync(archivo, 'utf8').split('\n');
const hay = n => existsSync(join(RAIZ, 'docs', 'capturas-ronda-6', n));
let marcados = 0; const sin = [];
const nuevas = lineas.map(l => {
  if (!/^\| [A-Z]-\d+ \|/.test(l)) return l;
  const c = l.split('|'); const id = c[1].trim();
  if (Number(c[3]) !== N || (ids && !ids.includes(id))) return l;
  const escenas = ESCENAS.filter(e => e.items.includes(id)), salidas = SALIDAS[id] || [];
  const antes = [], despues = [];
  for (const e of escenas) for (const [lista, m] of [[antes, 'antes'], [despues, 'despues']]) for (const suf of ['', ...(e.oscuro ? ['-oscuro'] : [])]) { const n = `${e.id}-${m}${suf}.png`; if (hay(n)) lista.push(n) }
  for (const s of salidas) for (const [lista, m] of [[antes, 'antes'], [despues, 'despues']]) { const n = `${s}-${m}.txt`; if (hay(n)) lista.push(n) }
  const completo = (escenas.length || salidas.length) && escenas.every(e => hay(`${e.id}-antes.png`) && hay(`${e.id}-despues.png`) && (!e.oscuro || (hay(`${e.id}-antes-oscuro.png`) && hay(`${e.id}-despues-oscuro.png`)))) && salidas.every(s => hay(`${s}-antes.txt`) && hay(`${s}-despues.txt`));
  c[5] = ' ' + (antes.join(', ') || '—') + ' '; c[6] = ' ' + (despues.join(', ') || '—') + ' ';
  if (completo) { c[7] = ' ' + (estadoPedido || '✅') + ' '; marcados++ } else sin.push(id);
  return c.join('|');
});
writeFileSync(archivo, nuevas.join('\n'));
console.log(`Etapa ${N}: ${marcados} ítems marcados` + (sin.length ? `; sin escena o sin capturas: ${sin.join(', ')}` : ''));
