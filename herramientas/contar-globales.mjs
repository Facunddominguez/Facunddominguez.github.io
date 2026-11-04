// Cuenta las funciones globales de fuente/codigo/: las "function nombre(" de primer nivel (las que quedan como propiedades de window).
// Uso: node herramientas/contar-globales.mjs [--maximo N]   (con --maximo falla si hay más de N)
// Las funciones que viven dentro de un objeto de módulo (Compras.renderCompras()) no cuentan: se agruparon en la Etapa 18.
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = resolve(fileURLToPath(new URL('../', import.meta.url)));
const dir = join(RAIZ, 'fuente', 'codigo');
let globales = 0, enModulos = 0;
for (const f of readdirSync(dir).filter(x => x.endsWith('.js'))) {
  const t = readFileSync(join(dir, f), 'utf8');
  globales += (t.match(/^(?:async )?function\s+[A-Za-z_$][\w$]*\s*\(/gm) || []).length;
  // Métodos de un módulo: líneas "nombre(...){" o "async nombre(...){" en la columna 0 dentro de un "const Modulo={".
  const m = /^var [A-Z][A-Za-z0-9]*=\{\n([\s\S]*?)\n\};$/m.exec(t);
  if (m) enModulos += (m[1].match(/^(?:async )?[A-Za-z_$][\w$]*\([^)]*\)\{/gm) || []).length;
}
const i = process.argv.indexOf('--maximo'), maximo = i >= 0 ? Number(process.argv[i + 1]) : null;
console.log(`Funciones globales: ${globales} · agrupadas en módulos: ${enModulos}${maximo !== null ? ` · máximo ${maximo}` : ''}`);
if (maximo !== null && globales > maximo) { console.error(`Hay más funciones globales que el máximo (${globales} > ${maximo}).`); process.exit(1) }
