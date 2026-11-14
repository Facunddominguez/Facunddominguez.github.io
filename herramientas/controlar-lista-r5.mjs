// Control de docs/ronda-5-lista.md para la compuerta (Ronda 5, Etapas 33 a 44).
// Uso: node herramientas/controlar-lista-r5.mjs <N de 33 a 44>
// Exige: los 79 ítems en la tabla, cada uno con su control R5-<ID> en criterios.json; los ítems de la etapa N y de las
// anteriores en ✅ (con sus capturas antes y después en docs/capturas-ronda-5/) o en ⚠️ con motivo y 2 opciones en la sección
// "Ítems en ⚠️"; en la Etapa 44, ninguno en ⬜ y el resumen completo. La prueba en verde de cada ✅ la mira el control R5-<ID>.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = resolve(fileURLToPath(new URL('../', import.meta.url)));
const N = Number(process.argv[2]);
if (!(N >= 33 && N <= 44)) { console.error('Uso: node herramientas/controlar-lista-r5.mjs <N de 33 a 44>'); process.exit(2) }
const texto = readFileSync(join(RAIZ, 'docs', 'ronda-5-lista.md'), 'utf8');
const filas = texto.split('\n').filter(l => /^\| [A-Z]-\d+ \|/.test(l)).map(l => { const c = l.split('|').map(s => s.trim()); return { id: c[1], etapa: Number(c[3]), prueba: c[4], antes: c[5], despues: c[6], estado: c[7] } });
const fallas = [];
if (filas.length !== 79 || new Set(filas.map(f => f.id)).size !== 79) fallas.push(`la tabla tiene ${filas.length} ítems (tienen que ser 79 distintos)`);
const criterios = JSON.parse(readFileSync(join(RAIZ, 'docs', 'validacion', 'criterios.json'), 'utf8')).controles;
for (const f of filas) if (!criterios.some(c => c.id === 'R5-' + f.id && c.tipo === 'prueba' && c.prueba === 'R5-' + f.id && c.etapa === f.etapa)) fallas.push(`${f.id}: falta su control R5-${f.id} (etapa ${f.etapa}) en criterios.json`);
const seccionAdvertencias = (texto.split(/\n## Ítems en ⚠️[^\n]*\n/)[1] || '').split(/\n## /)[0];
const archivos = celda => celda.split(/[ ,]+/).filter(x => /\.png$/.test(x));
for (const f of filas.filter(f => f.etapa <= N)) {
  if (f.estado === '✅') {
    for (const [nombre, celda] of [['antes', f.antes], ['después', f.despues]]) {
      const lista = archivos(celda);
      if (!lista.length) fallas.push(`${f.id}: sin captura del ${nombre}`);
      for (const a of lista) if (!existsSync(join(RAIZ, 'docs', 'capturas-ronda-5', a))) fallas.push(`${f.id}: no existe docs/capturas-ronda-5/${a}`);
    }
  } else if (f.estado === '⚠️') {
    const m = new RegExp('### ' + f.id + '\\b([\\s\\S]*?)(?=\\n### |$)').exec(seccionAdvertencias);
    if (!m || !/Motivo/i.test(m[1]) || !/Opción 1/i.test(m[1]) || !/Opción 2/i.test(m[1])) fallas.push(`${f.id}: ⚠️ sin motivo y 2 opciones en la sección "Ítems en ⚠️"`);
  } else fallas.push(`${f.id}: sigue en ${f.estado || 'sin estado'} (la etapa ${f.etapa} ya cerró)`);
}
if (N === 44) {
  const faltan = filas.filter(f => f.estado !== '✅' && f.estado !== '⚠️');
  if (faltan.length) fallas.push('sin cerrar: ' + faltan.map(f => f.id).join(', '));
  if (!/\n## Resumen \(Etapa 44\)\n[\s\S]*✅[\s\S]*⚠️/.test(texto) || /Se completa al cerrar la ronda/.test(texto)) fallas.push('falta el resumen final (cuántos ✅ y cuántos ⚠️)');
}
const hechos = filas.filter(f => f.estado === '✅').length, avisos = filas.filter(f => f.estado === '⚠️').length;
if (fallas.length) { console.error(`Lista de la Ronda 5 (Etapa ${N}): ${fallas.length} falla(s)\n  - ` + fallas.slice(0, 40).join('\n  - ')); process.exit(1) }
console.log(`Lista de la Ronda 5 (Etapa ${N}): bien (${hechos} ✅, ${avisos} ⚠️, ${filas.length - hechos - avisos} ⬜)`);
