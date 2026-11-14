// Marca en docs/ronda-5-lista.md los ítems de una etapa con sus capturas (según herramientas/r5-escenas.mjs).
// Uso: node herramientas/marcar-items-r5.mjs <N> [--ids S-11,S-12] [--estado ✅]
// Escribe en las columnas Captura antes / Captura después los archivos que existen en docs/capturas-ronda-5/ y deja el Estado en
// ✅ solo si los dos tipos de captura existen para todas las escenas del ítem. La prueba en verde la exige la compuerta (R5-<ID>).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = resolve(fileURLToPath(new URL('../', import.meta.url)));
const args = process.argv.slice(2), N = Number(args[0]), ids = args.includes('--ids') ? args[args.indexOf('--ids') + 1].split(',') : null;
const { ESCENAS } = await import('./r5-escenas.mjs');
const archivo = join(RAIZ, 'docs', 'ronda-5-lista.md');
const lineas = readFileSync(archivo, 'utf8').split('\n');
const hay = n => existsSync(join(RAIZ, 'docs', 'capturas-ronda-5', n));
let marcados = 0; const sin = [];
const nuevas = lineas.map(l => {
  if (!/^\| [A-Z]-\d+ \|/.test(l)) return l;
  const c = l.split('|'); const id = c[1].trim();
  if (Number(c[3]) !== N || (ids && !ids.includes(id))) return l;
  const escenas = ESCENAS.filter(e => e.items.includes(id));
  const antes = [], despues = [];
  for (const e of escenas) for (const [lista, m] of [[antes, 'antes'], [despues, 'despues']]) for (const suf of ['', ...(e.oscuro ? ['-oscuro'] : [])]) { const n = `${e.id}-${m}${suf}.png`; if (hay(n)) lista.push(n) }
  const completo = escenas.length && escenas.every(e => hay(`${e.id}-antes.png`) && hay(`${e.id}-despues.png`) && (!e.oscuro || (hay(`${e.id}-antes-oscuro.png`) && hay(`${e.id}-despues-oscuro.png`))));
  c[5] = ' ' + (antes.join(', ') || '—') + ' '; c[6] = ' ' + (despues.join(', ') || '—') + ' ';
  if (completo) { c[7] = ' ✅ '; marcados++ } else sin.push(id);
  return c.join('|');
});
writeFileSync(archivo, nuevas.join('\n'));
console.log(`Etapa ${N}: ${marcados} ítems en ✅` + (sin.length ? `; sin escena o sin capturas: ${sin.join(', ')}` : ''));
