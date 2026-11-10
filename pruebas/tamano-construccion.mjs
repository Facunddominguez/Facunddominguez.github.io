// Etapa 25 (Ronda 4), R4-25-tamano: la construcción falla si index.html pasa 1.100.000 bytes o 300.000 con gzip, y si precios.json pasa 80.000.
// Sin red. Uso: node pruebas/tamano-construccion.mjs (lo corre la compuerta como control R4-25-tamano).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
const RAIZ = fileURLToPath(new URL('../', import.meta.url)), dir = mkdtempSync(join(tmpdir(), 'mpf-tamano-'));
let fallas = 0;
const ok = (n, c, d) => { console.log((c ? 'PASA ' : 'FALLA ') + n + (d ? ' · ' + d : '')); if (!c) fallas++ };
const construir = extra => spawnSync(process.execPath, [join(RAIZ, 'herramientas/construir.mjs'), '--salida', join(dir, 'app'), ...extra], { encoding: 'utf8' });
try {
  const normal = construir([]);
  const html = readFileSync(join(dir, 'app', 'index.html'));
  ok('R4-25-tamano la construcción normal pasa y está lejos de los topes (1.100.000 bytes, 300.000 con gzip)', normal.status === 0 && html.length < 1100000 && gzipSync(html).length < 300000, `${html.length} bytes, ${gzipSync(html).length} con gzip`);
  const alto = construir(['--tope-html', String(html.length - 1)]);
  ok('R4-25-tamano falla si index.html pesa más que el tope en bytes', alto.status !== 0 && /index\.html pesa más de/.test(alto.stderr) && !/gzip/.test(alto.stderr.split('\n')[0] || ''), (alto.stderr || '').split('\n').find(l => /Error/.test(l)) || '');
  const gz = construir(['--tope-gzip', String(gzipSync(html).length - 1)]);
  ok('R4-25-tamano falla si index.html pesa más que el tope con gzip', gz.status !== 0 && /con gzip/.test(gz.stderr), (gz.stderr || '').split('\n').find(l => /Error/.test(l)) || '');
  const subir = construir(['--tope-html', '99999999', '--tope-gzip', '99999999']);
  const fuente = readFileSync(join(RAIZ, 'herramientas/construir.mjs'), 'utf8');
  ok('R4-25-tamano los topes de las pruebas solo pueden bajar, no subir, y los de la herramienta son los del plan', subir.status === 0 && /Math\.min\(1100000/.test(fuente) && /Math\.min\(300000/.test(fuente) && /> 80000/.test(fuente));
  const grande = join(dir, 'precios-grande.json'), real = JSON.parse(readFileSync(join(RAIZ, 'datos/precios.json'), 'utf8'));
  real.relleno = 'x'.repeat(81000); writeFileSync(grande, JSON.stringify(real));
  const g = construir(['--precios', grande]);
  ok('R4-25-tamano falla si precios.json pasa 80.000 bytes', g.status !== 0 && /precios\.json pesa más de 80\.000/.test(g.stderr), (g.stderr || '').split('\n').find(l => /Error/.test(l)) || '');
  ok('R4-25-tamano datos/precios.json de hoy está por debajo de 80.000 bytes', statSync(join(RAIZ, 'datos/precios.json')).size < 80000);
} finally { rmSync(dir, { recursive: true, force: true }) }
process.exit(fallas ? 1 : 0);
