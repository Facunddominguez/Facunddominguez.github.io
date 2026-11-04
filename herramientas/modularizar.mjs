// Etapa 18 (Ronda 2): agrupa las funciones globales de fuente/codigo/ en objetos de módulo (Precios, Compras, Semana…).
// Uso: node herramientas/modularizar.mjs [--simular]
// Reglas (para no cambiar el comportamiento):
//  - Solo se mueve una función si TODAS sus apariciones en el código, las pruebas y las herramientas son llamadas (`nombre(`)
//    o `w.nombre(` / `window.nombre(` desde las pruebas. Si aparece de otra forma (typeof, callback, asignación, clave de objeto,
//    texto) queda global.
//  - Las funciones que usan los archivos que corren antes (por número) siguen globales: el arranque (init) corre antes que los
//    archivos de número mayor y depende de que las funciones estén declaradas desde el principio.
//  - Nombres de menos de 6 letras quedan globales (son palabras comunes: go, start, nav…).
//  - El objeto del módulo se declara al principio de su archivo, así que cualquier código del archivo lo encuentra.
// Es una herramienta de una sola vez: no la corre la compuerta. Después de correrla se construye y pasan todas las pruebas.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const RAIZ = resolve(fileURLToPath(new URL('../', import.meta.url)));
const simular = process.argv.includes('--simular');
const MODULOS = { '02': 'Interfaz', '03': 'Ingredientes', '04': 'Ideas', '05': 'Rutina', '06': 'Armado', '07': 'MarcasDespensa', '08': 'Compartir', '09': 'MisPlatos', '10': 'Semana', '11': 'Existencias', '12': 'Compras', '13': 'AlAzar',
  '15': 'CalendarioEntreno', '16': 'SemanasFechadas', '17': 'ProductosExtra', '18': 'Respaldo', '19': 'HistorialCocina', '20': 'RevisionDespensa', '21': 'Recetas', '22': 'CantidadesCostos', '23': 'Equivalencias', '24': 'Consumo', '25': 'ComprasHechas',
  '26': 'MovimientosDespensa', '28': 'Nutricion', '29': 'AsistenteIA', '30': 'ModoSimple', '31': 'Hoy', '33': 'DespensaUnica', '34': 'RegistroRapido', '35': 'ComidaReal', '36': 'Sugerencias', '37': 'IdeasHoja', '38': 'Selector', '39': 'Comidas',
  '40': 'Bienvenida', '41': 'ComprasDespensa', '42': 'Registro', '43': 'Precios', '44': 'CantidadesPlatos', '46': 'Dieta' };
const dirCodigo = join(RAIZ, 'fuente', 'codigo');
const archivos = readdirSync(dirCodigo).filter(f => f.endsWith('.js')).sort();
const texto = Object.fromEntries(archivos.map(f => [f, readFileSync(join(dirCodigo, f), 'utf8')]));
// Otros textos donde se llaman las funciones: pruebas, herramientas y el HTML.
const otros = {};
const recorrer = (dir, ok) => { for (const f of readdirSync(join(RAIZ, dir), { recursive: true })) { const p = join(dir, f); if (statSync(join(RAIZ, p)).isFile() && ok(p)) otros[p] = readFileSync(join(RAIZ, p), 'utf8') } };
recorrer('pruebas', p => /\.(js|mjs)$/.test(p) && !p.includes('fixtures'));
recorrer('herramientas', p => /\.mjs$/.test(p) && !p.endsWith('modularizar.mjs'));
recorrer('fuente/cuerpo', p => /\.html$/.test(p));
otros['fuente/plantilla.html'] = readFileSync(join(RAIZ, 'fuente/plantilla.html'), 'utf8');
for (const [n, m] of Object.entries(MODULOS)) if (!archivos.some(f => f.startsWith(n + '-'))) throw new Error('no hay archivo ' + n);
const todoElTexto = () => [...Object.values(texto), ...Object.values(otros)].join('\n');
for (const m of Object.values(MODULOS)) if (new RegExp('(?:const|let|var|function|class)\\s+' + m + '\\b').test(todoElTexto())) throw new Error('el nombre de módulo ya existe: ' + m);

// 1. Funciones de primer nivel de cada archivo: de "function nombre(" en la columna 0 hasta el siguiente "}" en la columna 0.
const defs = [];
for (const f of archivos) {
  const lineas = texto[f].split('\n');
  for (let i = 0; i < lineas.length; i++) {
    const m = /^(async )?function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(lineas[i]);
    if (!m) continue;
    let j = i; while (j < lineas.length && lineas[j] !== '}') { if (j > i && /^(async )?function\s/.test(lineas[j])) { j = -1; break } j++ }
    // Funciones de una sola línea ("function a(){...}" completa en la misma línea).
    if (j === -1 || j >= lineas.length) { if (/\}\s*$/.test(lineas[i]) && !/\{\s*$/.test(lineas[i])) { defs.push({ f, nombre: m[2], ini: i, fin: i, asinc: !!m[1] }); continue } throw new Error('no se encontró el final de ' + m[2] + ' en ' + f) }
    defs.push({ f, nombre: m[2], ini: i, fin: j, asinc: !!m[1] });
  }
}
// 2. Qué se puede mover.
const idx = f => archivos.indexOf(f);
const esc = n => n.replace(/\$/g, '\\$');
const mover = [];
const motivos = { corto: 0, temprana: 0, formaRara: 0 };
for (const d of defs) {
  const mod = MODULOS[d.f.slice(0, 2)];
  if (!mod) continue;
  if (d.nombre.length < 6) { motivos.corto++; continue }
  const re = new RegExp('(?<![\\w$.])' + esc(d.nombre) + '(?![\\w$])', 'g');
  const reW = new RegExp('(?<=\\b(?:w|window|contentWindow)\\.)' + esc(d.nombre) + '(?![\\w$])', 'g');
  let temprana = false, rara = false;
  const mirar = (t, f, esCodigo) => {
    for (const mm of t.matchAll(re)) {
      const antes = t.slice(Math.max(0, mm.index - 12), mm.index), despues = t.slice(mm.index + d.nombre.length).match(/^\s*(.)/);
      if (/function\s+$/.test(antes) && esCodigo && f === d.f) continue; // la definición
      if (esCodigo && idx(f) < idx(d.f)) temprana = true;
      if (!despues || despues[1] !== '(') rara = true;
      // Método de un objeto o de una clase ("  nombre(a){" al principio de la línea): no es una llamada.
      const ini = t.lastIndexOf('\n', mm.index) + 1, fin = t.indexOf('\n', mm.index), linea = t.slice(ini, fin < 0 ? undefined : fin);
      if (/^\s*(async\s+)?$/.test(t.slice(ini, mm.index)) && /^[^;]*\)\s*\{\s*$/.test(linea.slice(mm.index - ini))) rara = true;
    }
    for (const mm of t.matchAll(reW)) { const despues = t.slice(mm.index + d.nombre.length).match(/^\s*(.)/); if (!despues || despues[1] !== '(') rara = true }
  };
  for (const f of archivos) mirar(texto[f], f, true);
  for (const [p, t] of Object.entries(otros)) mirar(t, p, false);
  if (temprana) { motivos.temprana++; continue }
  if (rara) { motivos.formaRara++; continue }
  mover.push({ ...d, mod });
}
// Cierre: lo que llaman (directa o indirectamente) las funciones que quedan globales y está en un archivo que corre después del
// arranque (número mayor que 14) también queda global: el arranque puede usarlas antes de que ese archivo declare su módulo.
const cuerpo = d => texto[d.f].split('\n').slice(d.ini, d.fin + 1).join('\n');
const globales = new Set(defs.filter(d => !mover.some(m => m.nombre === d.nombre && m.f === d.f)).map(d => d.nombre));
const porNombreDef = new Map(defs.map(d => [d.nombre, d]));
let cambio = true, transitivas = 0;
while (cambio) {
  cambio = false;
  for (const g of defs.filter(d => globales.has(d.nombre))) {
    const c = cuerpo(g);
    for (const m of mover) {
      if (!globales.has(m.nombre) && idx(m.f) > idx('14-eventos-y-arranque.js') && new RegExp('(?<![\\w$.])' + esc(m.nombre) + '(?![\\w$])').test(c)) { globales.add(m.nombre); cambio = true; transitivas++ }
    }
  }
}
for (let i = mover.length - 1; i >= 0; i--) if (globales.has(mover[i].nombre)) mover.splice(i, 1);
console.log(`Funciones de primer nivel: ${defs.length}. Se mueven: ${mover.length} (${Math.round(100 * mover.length / defs.length)} %). Quedan globales: ${defs.length - mover.length} (cortas ${motivos.corto}, las usa un archivo anterior ${motivos.temprana}, aparecen de otra forma ${motivos.formaRara}, las llaman las que quedan globales ${transitivas}).`);
if (simular) process.exit(0);

// 3. Reescribir las llamadas en todos los textos.
const porNombre = new Map(mover.map(d => [d.nombre, d.mod]));
const nombres = [...porNombre.keys()].sort((a, b) => b.length - a.length);
const reTodas = new RegExp('(?<![\\w$.])(' + nombres.map(esc).join('|') + ')(?=\\s*\\()(?<!function\\s+\\1)', 'g');
const reW = new RegExp('\\b(w|window|contentWindow)\\.(' + nombres.map(esc).join('|') + ')(?=\\s*\\()', 'g');
const reescribir = t => t.replace(reW, (_, w, n) => `${w}.${porNombre.get(n)}.${n}`).replace(reTodas, (m, n, off, s) => /function\s+$/.test(s.slice(Math.max(0, off - 12), off)) ? m : `${porNombre.get(n)}.${n}`);
for (const f of archivos) texto[f] = reescribir(texto[f]);
for (const p of Object.keys(otros)) otros[p] = reescribir(otros[p]);

// 4. Mover las definiciones: cada archivo declara su objeto al principio, con las funciones como métodos.
for (const f of archivos) {
  const delArchivo = mover.filter(d => d.f === f);
  if (!delArchivo.length) continue;
  const mod = delArchivo[0].mod;
  // Las posiciones de las definiciones cambiaron al reescribir llamadas dentro de las líneas: se vuelve a buscar por nombre.
  const lineas = texto[f].split('\n'), bloques = [];
  for (const d of delArchivo) {
    const ini = lineas.findIndex(l => new RegExp('^(async )?function\\s+' + esc(d.nombre) + '\\s*\\(').test(l));
    if (ini < 0) throw new Error('definición perdida: ' + d.nombre);
    let fin = ini;
    if (!(/\}\s*$/.test(lineas[ini]) && !/\{\s*$/.test(lineas[ini]) && !/^\S.*\{\s*$/.test(lineas[ini]))) { fin = ini; while (lineas[fin] !== '}') fin++ }
    bloques.push({ d, ini, fin });
  }
  const sacar = new Set(); bloques.forEach(b => { for (let i = b.ini; i <= b.fin; i++) sacar.add(i) });
  const metodos = bloques.map(b => lineas.slice(b.ini, b.fin + 1).map((l, i) => i === 0 ? l.replace(/^(async )?function\s+/, (m, a) => a ? 'async ' : '') : l).join('\n'));
  const resto = lineas.filter((_, i) => !sacar.has(i));
  // Después del encabezado de comentarios del archivo.
  let k = 0; while (k < resto.length && /^\/\//.test(resto[k])) k++;
  const objeto = `// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como ${mod}.nombre().\nconst ${mod}={\n${metodos.join(',\n')}\n};`;
  texto[f] = [...resto.slice(0, k), objeto, ...resto.slice(k)].join('\n');
}
for (const f of archivos) writeFileSync(join(dirCodigo, f), texto[f]);
for (const [p, t] of Object.entries(otros)) writeFileSync(join(RAIZ, p), t);
console.log('Listo: ' + mover.length + ' funciones pasaron a ' + new Set(mover.map(d => d.mod)).size + ' módulos.');
