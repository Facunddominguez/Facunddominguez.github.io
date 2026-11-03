// Actualiza datos/precios.json desde el archivo de precios promedio de INDEC (IPC, "precios promedio de una selección de
// alimentos según regiones"): un .xls binario (BIFF8 dentro de un contenedor OLE) con las hojas "Nacional" y "GBA".
// Uso: node herramientas/actualizar-precios.mjs [--archivo ruta.xls] [--salida ruta.json] [--hoy AAAA-MM-DD]
//      node herramientas/actualizar-precios.mjs --verificar [--archivo-json ruta.json]   (sin red)
// - Sin --archivo baja el .xls a una carpeta temporal nueva (fuera del repositorio) y lo trata como dato no confiable: se
//   lee como bytes, nunca se ejecuta nada de lo que trae.
// - Procesa, arma el JSON, lo valida y recién entonces lo escribe (de forma atómica). Si algo falla sale con código 1 y
//   deja datos/precios.json como estaba: se conserva el último archivo.
// - Sin dependencias: requiere Node 18 o superior. El lector del .xls es mínimo y solo sirve para este archivo.
import { readFile, writeFile, rename, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { existsSync, createReadStream, createWriteStream, openSync, closeSync, readSync, fstatSync } from 'node:fs';
import { createInflateRaw } from 'node:zlib';
import { createInterface } from 'node:readline';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL, fileURLToPath } from "node:url";

const RAIZ = new URL('../', import.meta.url);
const DESCARGA = 'https://www.indec.gob.ar/ftp/cuadros/economia/sh_ipc_precios_promedio.xls';
const INFORME = 'https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31';
const REGIONES = ['GBA', 'Pampeana', 'Noreste', 'Noroeste', 'Cuyo', 'Patagonia'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MAX_BYTES = 5 * 1024 * 1024;
const args = process.argv.slice(2), arg = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
const ruta = rel => new URL(rel, RAIZ);
const norm = s => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
const redondeo = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

// ---------- Lector mínimo de OLE + BIFF8 ----------
function leerOle(buf) {
  if (buf.length < 512 || buf.readUInt32BE(0) !== 0xD0CF11E0) throw new Error('El archivo no es un .xls (cabecera OLE ausente)');
  const u32 = o => buf.readUInt32LE(o), u16 = o => buf.readUInt16LE(o);
  const ss = 1 << u16(30), mss = 1 << u16(32), FIN = 0xFFFFFFFA;
  if (ss !== 512 && ss !== 4096) throw new Error('Tamaño de sector OLE inesperado');
  const nFat = u32(44), dirIni = u32(48), corte = u32(56), miniIni = u32(60), difIni = u32(68), nDif = u32(72);
  const sec = i => { const o = (i + 1) * ss; if (o + ss > buf.length) throw new Error('Sector OLE fuera del archivo'); return buf.subarray(o, o + ss) };
  const difat = [];
  for (let i = 0; i < 109; i++) { const v = u32(76 + i * 4); if (v < FIN) difat.push(v) }
  for (let d = difIni, k = 0; k < nDif && d < FIN; k++) { const s = sec(d); for (let i = 0; i < ss / 4 - 1; i++) { const v = s.readUInt32LE(i * 4); if (v < FIN) difat.push(v) } d = s.readUInt32LE(ss - 4) }
  const fat = [];
  for (const f of difat.slice(0, nFat)) { const s = sec(f); for (let i = 0; i < ss / 4; i++) fat.push(s.readUInt32LE(i * 4)) }
  const cadena = (ini, tabla, get) => { const out = []; let c = ini, n = 0; while (c < FIN) { out.push(get(c)); c = tabla[c]; if (c === undefined || ++n > 1e6) throw new Error('Cadena de sectores OLE inválida') } return Buffer.concat(out) };
  const dir = cadena(dirIni, fat, sec), ents = [];
  for (let o = 0; o + 128 <= dir.length; o += 128) { const nl = dir.readUInt16LE(o + 64); ents.push({ name: dir.toString('utf16le', o, o + Math.max(0, nl - 2)), type: dir[o + 66], start: dir.readUInt32LE(o + 116), size: dir.readUInt32LE(o + 120) }) }
  const raiz = ents[0];
  const mini = [], miniBuf = miniIni < FIN ? cadena(miniIni, fat, sec) : Buffer.alloc(0);
  for (let i = 0; i < miniBuf.length; i += 4) mini.push(miniBuf.readUInt32LE(i));
  const miniStream = raiz.size ? cadena(raiz.start, fat, sec) : Buffer.alloc(0);
  const leer = e => e.size < corte
    ? cadena(e.start, mini, c => miniStream.subarray(c * mss, (c + 1) * mss)).subarray(0, e.size)
    : cadena(e.start, fat, sec).subarray(0, e.size);
  const libro = ents.find(e => e.type === 2 && (e.name === 'Workbook' || e.name === 'Book'));
  if (!libro) throw new Error('El .xls no tiene el flujo "Workbook"');
  return leer(libro);
}
// Devuelve [{ nombre, celdas: Map("fila,columna" -> número | texto) }]
function leerLibro(wb) {
  const recs = []; // registros BIFF con su posición
  for (let o = 0; o + 4 <= wb.length;) { const id = wb.readUInt16LE(o), len = wb.readUInt16LE(o + 2); if (o + 4 + len > wb.length) break; recs.push({ id, d: wb.subarray(o + 4, o + 4 + len), o }); o += 4 + len }
  const sst = [], hojas = [];
  const rk = v => { let n; if (v & 2) n = v >> 2; else { const b = Buffer.alloc(8); b.writeUInt32LE((v & 0xFFFFFFFC) >>> 0, 4); n = b.readDoubleLE(0) } return v & 1 ? n / 100 : n };
  for (let i = 0; i < recs.length; i++) {
    const r = recs[i];
    if (r.id === 0x00FC) { // SST con sus CONTINUE
      const trozos = [r.d]; for (let j = i + 1; j < recs.length && recs[j].id === 0x003C; j++) trozos.push(recs[j].d);
      const total = r.d.readUInt32LE(4); let ci = 0, pos = 8;
      const actual = () => trozos[ci];
      const pasar = () => { if (pos >= actual().length && ci < trozos.length - 1) { ci++; pos = 0; return true } return false };
      for (let k = 0; k < total; k++) {
        pasar(); if (pos + 3 > actual().length) break;
        const cch = actual().readUInt16LE(pos); pos += 2; const fl = actual()[pos++]; let rt = 0, ex = 0;
        if (fl & 8) { rt = actual().readUInt16LE(pos); pos += 2 } if (fl & 4) { ex = actual().readUInt32LE(pos); pos += 4 }
        let ancho = fl & 1, resto = cch, s = '';
        while (resto > 0) {
          if (pos >= actual().length) { if (ci >= trozos.length - 1) break; ci++; pos = 0; ancho = actual()[pos++] & 1 }
          const bytes = ancho ? 2 : 1, n = Math.min(resto, Math.floor((actual().length - pos) / bytes));
          s += ancho ? actual().toString('utf16le', pos, pos + n * 2) : actual().toString('latin1', pos, pos + n);
          pos += n * bytes; resto -= n;
        }
        pos += rt * 4 + ex; sst.push(s);
      }
    }
    if (r.id === 0x0085) { const cch = r.d[6], fl = r.d[7]; hojas.push({ off: r.d.readUInt32LE(0), nombre: fl & 1 ? r.d.toString('utf16le', 8, 8 + cch * 2) : r.d.toString('latin1', 8, 8 + cch) }) }
  }
  return hojas.map(h => {
    const celdas = new Map(), pon = (f, c, v) => celdas.set(f + ',' + c, v);
    let i = recs.findIndex(r => r.o === h.off);
    if (i < 0) throw new Error(`Hoja "${h.nombre}" fuera del archivo`);
    for (i++; i < recs.length && recs[i].id !== 0x000A; i++) {
      const { id, d } = recs[i];
      if (id === 0x00FD) pon(d.readUInt16LE(0), d.readUInt16LE(2), sst[d.readUInt32LE(6)]);
      else if (id === 0x0203) pon(d.readUInt16LE(0), d.readUInt16LE(2), d.readDoubleLE(6));
      else if (id === 0x027E) pon(d.readUInt16LE(0), d.readUInt16LE(2), rk(d.readUInt32LE(6)));
      else if (id === 0x00BD) { const f = d.readUInt16LE(0), c1 = d.readUInt16LE(2), c2 = d.readUInt16LE(d.length - 2); for (let c = c1, p = 4; c <= c2; c++, p += 6) pon(f, c, rk(d.readUInt32LE(p + 2))) }
      else if (id === 0x0006 && !(d[12] === 0xFF && d[13] === 0xFF)) pon(d.readUInt16LE(0), d.readUInt16LE(2), d.readDoubleLE(6));
      else if (id === 0x0204) { const cch = d.readUInt16LE(6); pon(d.readUInt16LE(0), d.readUInt16LE(2), d[8] & 1 ? d.toString('utf16le', 9, 9 + cch * 2) : d.toString('latin1', 9, 9 + cch)) }
    }
    return { nombre: h.nombre, celdas };
  });
}

// ---------- Interpretación de las hojas ----------
// Columnas de meses: el año se arrastra desde la última celda con "Año NNNN" o un número de 4 cifras.
function columnasMes(celdas, filaAnio, primera) {
  const cols = []; let anio = null;
  for (let c = primera; c < 400; c++) {
    const a = celdas.get(filaAnio + ',' + c), m = norm(celdas.get((filaAnio + 1) + ',' + c));
    if (a !== undefined) { const t = /(\d{4})/.exec(String(a)); if (t) anio = Number(t[1]) }
    const mes = MESES.indexOf(m);
    if (mes >= 0 && anio) cols.push({ c, anio, mes: mes + 1, clave: anio * 100 + mes + 1 });
  }
  if (cols.length < 12) throw new Error('No se reconocieron las columnas de meses del encabezado');
  return cols;
}
function leerHoja(hoja, { primeraCol, regionCol }) {
  const { celdas } = hoja, texto = (f, c) => { const v = celdas.get(f + ',' + c); return typeof v === 'string' ? v : '' };
  let enc = -1; for (let f = 0; f < 15; f++) if (['región', 'region', 'variedad'].includes(norm(texto(f, 0)))) { enc = f; break }
  if (enc < 0) throw new Error(`Hoja "${hoja.nombre}": no se encontró el encabezado "Región" o "Variedad"`);
  const cols = columnasMes(celdas, enc, primeraCol), filas = new Map();
  for (let f = enc + 3; f < enc + 200; f++) {
    const region = regionCol ? texto(f, 0).trim() : 'GBA', producto = norm(texto(f, regionCol ? 1 : 0)), unidad = norm(texto(f, regionCol ? 2 : 1));
    if (!producto) { if (!texto(f, 0).trim() && f > enc + 5 && !celdas.has(f + ',' + primeraCol)) continue; else continue }
    if (regionCol && !REGIONES.includes(region)) continue;
    const valores = new Map(); for (const k of cols) { const v = celdas.get(f + ',' + k.c); if (typeof v === 'number' && Number.isFinite(v)) valores.set(k.clave, v) }
    filas.set(region + '|' + producto, { unidad, valores });
  }
  return { cols, filas };
}

// ---------- Armado ----------
export function armar(libro, mapa, hoy) {
  const porNombre = n => libro.find(h => norm(h.nombre) === norm(n));
  const hn = porNombre('Nacional'), hg = porNombre('GBA');
  if (!hn) throw new Error('El .xls no tiene la hoja "Nacional"'); if (!hg) throw new Error('El .xls no tiene la hoja "GBA"');
  const nac = leerHoja(hn, { primeraCol: 3, regionCol: true }), gba = leerHoja(hg, { primeraCol: 2, regionCol: false });
  const clavesNac = new Set(nac.cols.map(k => k.clave)), ultima = Math.max(...gba.cols.map(k => k.clave).filter(k => clavesNac.has(k)));
  const meses = [...clavesNac].filter(k => k < ultima).sort((a, b) => a - b), previa = meses.at(-1);
  const items = [];
  const buscar = (hoja, region, [producto, unidad], ingrediente, nombreHoja) => {
    const f = hoja.filas.get(region + '|' + norm(producto));
    if (!f) throw new Error(`Falta el producto "${producto}" en la hoja ${nombreHoja} de INDEC (se usa para "${ingrediente}")`);
    if (f.unidad !== norm(unidad)) throw new Error(`INDEC cambió la unidad de "${producto}" (${nombreHoja}): ahora "${f.unidad}" y se esperaba "${norm(unidad)}"`);
    const v = f.valores.get(ultima), p = f.valores.get(previa);
    if (!(v > 0)) throw new Error(`"${producto}" (${nombreHoja}, ${region}) no tiene precio en el último mes (${ultima})`);
    if (p > 0 && (v / p > 3 || v / p < 1 / 3)) throw new Error(`"${producto}" (${nombreHoja}, ${region}) cambió más de 3 veces contra el mes anterior (${p} → ${v}): se revisa a mano`);
    return v;
  };
  for (const m of mapa.items.filter(x => x.gba)) {
    const o = { n: m.n, b: m.b, i: m.gba[0], p: {} };
    o.p.GBA = redondeo(buscar(gba, 'GBA', m.gba, m.n, 'GBA') / m.envase);
    if (m.nac) for (const r of REGIONES) {
      const v = buscar(nac, r, m.nac, m.n, 'Nacional');
      if (r === 'GBA' && Math.abs(v - buscar(gba, 'GBA', m.gba, m.n, 'GBA')) > 0.01) throw new Error(`"${m.nac[0]}" no coincide entre las hojas GBA y Nacional`);
      o.p[r] = redondeo(v / m.envase);
    }
    if (m.aprox) o.a = true;
    if (m.densidad) o.d = m.densidad;
    items.push(o);
  }
  const mes = String(Math.floor(ultima / 100)) + '-' + String(ultima % 100).padStart(2, '0');
  return {
    version: 1, revisado: hoy, mes,
    fuente: {
      nombre: 'INDEC · Precios promedio de una selección de alimentos, bebidas y otros artículos de la canasta del IPC, según regiones',
      informe: INFORME, url: DESCARGA,
      atribucion: 'Fuente: INDEC, Dirección Nacional de Estadísticas de Precios, Dirección de Índices de Precios de Consumo.',
      nota: 'Son precios promedio para un conjunto de bienes de la canasta. Comparar regiones puede no ser válido porque los productos no tienen especificaciones armonizadas. Son aproximados: no son los precios de tu comercio.',
    },
    regiones: REGIONES, items,
  };
}

// ---------- Validación (sin red) ----------
export async function catalogoNutricion() {
  return new Set(JSON.parse(await readFile(ruta('datos/nutricion.json'), 'utf8')).items.map(i => i.n));
}
export function validar(d, { catalogo, mapa = null, hoy = new Date().toISOString().slice(0, 10) }) {
  const e = [], url = u => typeof u === 'string' && /^https:\/\/[^\s]+$/.test(u) && u.length < 300, txt = (s, max) => typeof s === 'string' && s.trim() && s.length <= max;
  if (!d || typeof d !== 'object') return ['No es un objeto'];
  if (d.version !== 1) e.push('version debe ser 1');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(d.mes || '')) e.push('mes con formato AAAA-MM'); else if (d.mes > hoy.slice(0, 7)) e.push('mes en el futuro: ' + d.mes);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.revisado || '')) e.push('revisado con formato AAAA-MM-DD');
  const f = d.fuente || {};
  if (!txt(f.nombre, 300) || !txt(f.atribucion, 400) || !txt(f.nota, 600)) e.push('fuente sin nombre, atribución o nota');
  if (!url(f.informe) || !url(f.url)) e.push('fuente sin enlaces https al informe y al archivo');
  if (!Array.isArray(d.regiones) || !d.regiones.includes('GBA') || d.regiones.some(r => !REGIONES.includes(r))) e.push('regiones inválidas (GBA es obligatoria)');
  if (!Array.isArray(d.items) || !d.items.length || d.items.length > 500) return [...e, 'items vacío o demasiado grande'];
  const vistos = new Set();
  for (const it of d.items) {
    const n = it && it.n; if (typeof n !== 'string') { e.push('ítem sin nombre'); continue }
    if (vistos.has(n)) e.push('repetido: ' + n); vistos.add(n);
    if (!catalogo.has(n)) e.push(`"${n}" no está en el catálogo de nutrición`);
    if (!['kg', 'l', 'unidad'].includes(it.b)) e.push(`"${n}": unidad base inválida`);
    const pg = it.p && typeof it.p === 'object' && it.p.GBA > 0, sg = it.s && typeof it.s === 'object' && it.s.GBA > 0;
    if (!pg && !sg) e.push(`"${n}": falta el precio de GBA (INDEC o SEPA)`);
    if (it.p !== undefined && (!it.p || typeof it.p !== 'object')) e.push(`"${n}": p inválido`);
    for (const [r, v] of Object.entries(it.p || {})) if (!REGIONES.includes(r) || !d.regiones.includes(r) || !Number.isFinite(v) || !(v > 0) || v >= 1e7) e.push(`"${n}": precio inválido en ${r}`);
    for (const [r, v] of Object.entries(it.s || {})) {
      const rr = it.r && it.r[r], cc = it.c && it.c[r];
      if (!REGIONES.includes(r) || !d.regiones.includes(r) || !Number.isFinite(v) || !(v > 0) || v >= 1e7) { e.push(`"${n}": precio SEPA inválido en ${r}`); continue }
      if (!Array.isArray(rr) || rr.length !== 2 || !rr.every(x => Number.isFinite(x) && x > 0 && x < 1e7) || rr[0] > v + 0.5 || rr[1] < v - 0.5) e.push(`"${n}": percentiles inválidos en ${r}`);
      if (!Array.isArray(cc) || cc.length !== 2 || !(cc[0] >= SEPA_MIN_OBS) || !(cc[1] >= SEPA_MIN_COMERCIOS)) e.push(`"${n}": SEPA en ${r} con menos de ${SEPA_MIN_OBS} observaciones o ${SEPA_MIN_COMERCIOS} comercios`);
      if (it.p && it.p[r] > 0 && (v / it.p[r] > 2 || v / it.p[r] < 0.5)) e.push(`"${n}": SEPA en ${r} fuera de 0,5 a 2 veces INDEC`);
    }
  }
  if (d.items.some(i => i.s)) {
    const s = d.sepa || {};
    if (!txt(s.nombre, 300) || !txt(s.atribucion, 400) || !txt(s.nota, 600) || s.licencia !== 'CC BY 4.0') e.push('sepa sin nombre, atribución, nota o licencia CC BY 4.0');
    if (!url(s.dataset) || !url(s.licenciaUrl)) e.push('sepa sin enlaces https al dataset y a la licencia');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.fecha || '') || s.fecha > hoy) e.push('sepa.fecha inválida o en el futuro');
  }
  if (mapa) {
    for (const m of mapa.items) {
      const it = d.items.find(x => x.n === m.n);
      if (m.gba && !it) e.push(`Falta "${m.n}" (está en precios-mapa.json)`);
      else if (m.gba && m.nac && it && REGIONES.some(r => !(it.p && it.p[r] > 0))) e.push(`"${m.n}": faltan regiones`);
    }
    const cb = coberturaAmbito(d, mapa);
    if (cb.total.total && cb.total.con / cb.total.total < 0.6) e.push(`cobertura demasiado baja: ${cb.total.con} de ${cb.total.total} ingredientes del catálogo (piso 60 %)`);
  }
  return e;
}
export function validarMapa(mapa, catalogo) {
  const e = [], vistos = new Set();
  if (!mapa || !Array.isArray(mapa.items) || !mapa.items.length) return ['precios-mapa.json sin ítems'];
  for (const m of mapa.items) {
    if (!catalogo.has(m.n)) e.push(`mapa: "${m.n}" no está en el catálogo de nutrición`);
    if (vistos.has(m.n)) e.push(`mapa: repetido ${m.n}`); vistos.add(m.n);
    if (!['kg', 'l', 'unidad'].includes(m.b)) e.push(`mapa: "${m.n}" unidad base inválida`);
    if (!m.gba && !m.sepa) e.push(`mapa: "${m.n}" sin INDEC ni SEPA`);
    if (m.gba && (!(m.envase > 0) || !Array.isArray(m.gba) || m.gba.length !== 2 || (m.nac && m.nac.length !== 2))) e.push(`mapa: "${m.n}" mal armado (INDEC)`);
    if (m.sepa) {
      const s = m.sepa, pal = a => Array.isArray(a) && a.every(w => typeof w === 'string' && /^[a-z0-9 ]{2,40}\*?$/.test(w) && w === w.trim());
      if (!pal(s.q) || (!s.q.length && !(s.ean && s.ean.length))) e.push(`mapa: "${m.n}" sepa.q inválido`);
      if (s.x !== undefined && !pal(s.x)) e.push(`mapa: "${m.n}" sepa.x inválido`);
      if (s.marca !== undefined && !pal(s.marca)) e.push(`mapa: "${m.n}" sepa.marca inválida`);
      if (s.ean !== undefined && !(Array.isArray(s.ean) && s.ean.every(w => /^\d{3,20}$/.test(w)))) e.push(`mapa: "${m.n}" sepa.ean inválido`);
      if (s.t !== undefined && !(Array.isArray(s.t) && s.t.length === 2 && s.t[0] > 0 && s.t[1] > s.t[0])) e.push(`mapa: "${m.n}" sepa.t inválido`);
      const xs = new Set((s.x || []).map(w => w.replace('*', '')));
      if ((s.q || []).some(f => f.split(' ').some(w => xs.has(w.replace('*', ''))))) e.push(`mapa: "${m.n}" tiene una palabra a la vez en q y en x`);
    }
  }
  return e;
}

// ---------- SEPA (Precios Claros – Base SEPA) ----------
// El archivo no es de confianza: no se extrae nada a disco (el nombre de una entrada nunca se usa como ruta), solo se leen bytes.
const SEPA_PAQUETE = 'https://datos.produccion.gob.ar/api/3/action/package_show?id=sepa-precios';
const SEPA_DATASET = 'https://datos.produccion.gob.ar/dataset/sepa-precios';
const SEPA_LICENCIA = 'https://creativecommons.org/licenses/by/4.0/deed.es';
const SEPA_MAX_ZIP = 600 * 1024 * 1024;
const SEPA_MAX_CSV = 3 * 1024 * 1024 * 1024;
const SEPA_MAX_OBS = 200000;
export const SEPA_MIN_OBS = 10, SEPA_MIN_COMERCIOS = 3, MAX_BYTES_JSON = 60000;
const MASA = { kg: 1, kgm: 1, kgr: 1, 'kg.': 1, kgs: 1, g: 0.001, gr: 0.001, grm: 0.001, 'gr.': 0.001, grs: 0.001, gs: 0.001 };
const VOLUMEN = { l: 1, lt: 1, ltr: 1, 'lt.': 1, lts: 1, 'l.': 1, ml: 0.001, 'ml.': 0.001, cm3: 0.001, cc: 0.001, 'cc.': 0.001 };
const CUENTA = new Set(['uni', 'ud', 'un', 'un.', 'uni.', 'unidad', 'ea', 'u', 'unid', 'unid.', 'ud.', 'cu']);
const PROVINCIA_REGION = {
  'AR-E': 'Pampeana', 'AR-L': 'Pampeana', 'AR-S': 'Pampeana', 'AR-X': 'Pampeana',
  'AR-H': 'Noreste', 'AR-N': 'Noreste', 'AR-P': 'Noreste', 'AR-W': 'Noreste',
  'AR-A': 'Noroeste', 'AR-F': 'Noroeste', 'AR-G': 'Noroeste', 'AR-K': 'Noroeste', 'AR-T': 'Noroeste', 'AR-Y': 'Noroeste',
  'AR-D': 'Cuyo', 'AR-J': 'Cuyo', 'AR-M': 'Cuyo',
  'AR-Q': 'Patagonia', 'AR-R': 'Patagonia', 'AR-U': 'Patagonia', 'AR-V': 'Patagonia', 'AR-Z': 'Patagonia',
};
const sinTildes = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const palabras = s => sinTildes(s).split(/[^a-z0-9]+/).filter(Boolean);
const numero = s => { const v = parseFloat(String(s ?? '').replace(',', '.')); return Number.isFinite(v) ? v : null };
const cerca = (a, b, t = 0.03) => a > 0 && b > 0 && Math.abs(a - b) / Math.max(a, b) <= t;
// GBA = CABA + Buenos Aires con código postal 1600 a 1899 (aproxima los partidos de INDEC); el resto de Buenos Aires es Pampeana.
export function regionDe(provincia, codigoPostal) {
  let p = String(provincia || '').trim();
  if (p === 'Buenos Aires') p = 'AR-B';
  if (p === 'AR-C') return 'GBA';
  if (p === 'AR-B') { const m = /(\d{4})/.exec(String(codigoPostal || '')); const n = m ? Number(m[1]) : 0; return n >= 1600 && n <= 1899 ? 'GBA' : 'Pampeana' }
  return PROVINCIA_REGION[p] || null;
}
export function compilarReglas(mapa) {
  const global = (mapa.sepaExcluir || []).map(sinTildes);
  const reglas = [], indice = new Map();
  for (const m of mapa.items) {
    if (!m.sepa) continue;
    const s = m.sepa, q = (s.q || []).map(f => palabras(f.replace(/\*/g, 'ZZSTAR')).map(w => w.replace(/zzstar/g, '*')));
    const propias = new Set(q.flat().map(w => w.replace('*', '')));
    const x = [...(s.x || []).map(sinTildes), ...global.filter(w => { const b = w.replace('*', ''); return ![...propias].some(o => o.startsWith(b) || b.startsWith(o)) })];
    const r = { n: m.n, b: m.b, q, ini: !!s.ini, t: s.t || null, u: s.u || null, marca: (s.marca || []).map(sinTildes), ean: new Set((s.ean || []).map(String)), a: !!s.a,
      xPref: x.filter(w => w.endsWith('*')).map(w => w.slice(0, -1)), xExac: new Set(x.filter(w => !w.endsWith('*'))) };
    reglas.push(r);
    const claves = new Set(q.map(f => f.reduce((a, b) => (b.length > a.length ? b : a), '').replace('*', '')).filter(Boolean));
    for (const k of claves) { if (!indice.has(k)) indice.set(k, []); indice.get(k).push(r) }
  }
  return { reglas, indice };
}
function coincide(r, t) {
  if (t.some(w => r.xExac.has(w) || r.xPref.some(p => w.startsWith(p)))) return false;
  const igual = (w, x) => (w.endsWith('*') ? x.startsWith(w.slice(0, -1)) : x === w);
  return r.q.some(f => (r.ini ? f.length <= t.length && f.every((w, i) => igual(w, t[i])) : f.every(w => t.some(x => igual(w, x)))));
}
// Tamaño del envase en la unidad base (kg, l o unidad) o null.
function tamano(b, c) {
  const up = c[7].trim().toLowerCase(), ur = c[12].trim().toLowerCase(), cp = numero(c[6]), cr = numero(c[11]);
  if (b === 'unidad') return CUENTA.has(up) && cp > 0 ? cp : null;
  const T = b === 'kg' ? MASA : VOLUMEN;
  if (T[up] && cp > 0) return cp * T[up];
  if (T[ur] && cr > 0) return cr * T[ur];
  return null;
}
// Precio por unidad base o null. Solo se acepta si precio de lista ÷ tamaño coincide con el precio de referencia (±3 %).
export function precioBase(b, c) {
  const pl = numero(c[9]), pr = numero(c[10]);
  if (!(pl > 0)) return null;
  const up = c[7].trim().toLowerCase(), ur = c[12].trim().toLowerCase(), cp = numero(c[6]), cr = numero(c[11]);
  if (b === 'unidad') {
    if (!(CUENTA.has(up) && cp > 0)) return null;
    const v = pl / cp;
    if (CUENTA.has(ur) && cr === 1 && pr > 0 && !cerca(pr, v, 0.05)) return null;
    return v;
  }
  const T = b === 'kg' ? MASA : VOLUMEN;
  const s1 = T[up] && cp > 0 ? cp * T[up] : null, s2 = T[ur] && cr > 0 ? cr * T[ur] : null;
  const A = s1 ? pl / s1 : null, B = s2 ? pl / s2 : null;
  if (pr > 0 && ((A && cerca(pr, A)) || (B && cerca(pr, B)))) return pr;
  if (A && B && cerca(A, B)) return A;
  if (A && !T[ur]) return A;
  return null;
}
// ----- ZIP (solo lectura de bytes; sin dependencias) -----
function directorioZip(leer, tam) {
  const n = Math.min(tam, 70000);
  if (n < 22) throw new Error('ZIP demasiado chico');
  const t = leer(tam - n, n), e = t.lastIndexOf(Buffer.from([0x50, 0x4b, 5, 6]));
  if (e < 0) throw new Error('ZIP sin directorio central');
  const cant = t.readUInt16LE(e + 10), cdTam = t.readUInt32LE(e + 12), cdOff = t.readUInt32LE(e + 16);
  if (cant === 0xffff || cdOff === 0xffffffff || cdTam === 0xffffffff) throw new Error('ZIP64 no soportado');
  if (cant > 1000 || cdOff + cdTam > tam) throw new Error('Directorio ZIP inválido');
  const cd = leer(cdOff, cdTam), out = [];
  let p = 0;
  for (let i = 0; i < cant; i++) {
    if (p + 46 > cd.length || cd.readUInt32LE(p) !== 0x02014b50) throw new Error('Directorio ZIP dañado');
    const metodo = cd.readUInt16LE(p + 10), csize = cd.readUInt32LE(p + 20), usize = cd.readUInt32LE(p + 24), nl = cd.readUInt16LE(p + 28), el = cd.readUInt16LE(p + 30), cl = cd.readUInt16LE(p + 32), off = cd.readUInt32LE(p + 42);
    const nombre = cd.toString('utf8', p + 46, p + 46 + nl);
    p += 46 + nl + el + cl;
    if (csize === 0xffffffff || usize === 0xffffffff || off === 0xffffffff) throw new Error('ZIP64 no soportado');
    if (!csize) continue;
    if (metodo !== 0 && metodo !== 8) throw new Error('Método de compresión no soportado: ' + metodo);
    if (off + 30 > tam) throw new Error('Entrada ZIP fuera del archivo');
    const h = leer(off, 30);
    if (h.readUInt32LE(0) !== 0x04034b50) throw new Error('Entrada ZIP dañada');
    const datos = off + 30 + h.readUInt16LE(26) + h.readUInt16LE(28);
    if (datos + csize > tam) throw new Error('Entrada ZIP fuera del archivo');
    out.push({ nombre, metodo, csize, usize, datos });
  }
  return out;
}
function flujoEntrada(archivo, base, e, maxBytes = SEPA_MAX_CSV) {
  const crudo = createReadStream(archivo, { start: base + e.datos, end: base + e.datos + e.csize - 1 });
  const salida = e.metodo === 8 ? crudo.pipe(createInflateRaw()) : crudo;
  let total = 0;
  salida.on('data', d => { total += d.length; if (total > maxBytes) salida.destroy(new Error('Un CSV pasa del tope de tamaño')) });
  crudo.on('error', er => salida.destroy(er));
  return salida;
}
const BOM = /^﻿/;
async function* lineasCsv(flujo) {
  const rl = createInterface({ input: flujo, crlfDelay: Infinity });
  let primera = true;
  for await (const l of rl) { if (primera) { primera = false; continue } yield l.replace(BOM, '') }
}
function estadistica(v) {
  v.sort((a, b) => a - b);
  const q = f => { const i = (v.length - 1) * f, lo = Math.floor(i), hi = Math.ceil(i); return v[lo] + (v[hi] - v[lo]) * (i - lo) };
  return { med: q(0.5), p25: q(0.25), p75: q(0.75) };
}
// Lee el ZIP de SEPA (zip de zips) y devuelve { fecha, items: Map(nombre → Map(región → {med, p25, p75, n, com})), cuentas }.
export async function leerSepa(archivo, mapa) {
  const fd = openSync(archivo, 'r'), tam = fstatSync(fd).size;
  const leer = (o, l) => { const b = Buffer.alloc(l); readSync(fd, b, 0, l, o); return b };
  let externo, fecha = null;
  try {
    if (tam > SEPA_MAX_ZIP || tam < 100) throw new Error('El ZIP de SEPA tiene un tamaño inesperado: ' + tam);
    if (leer(0, 2).toString('latin1') !== 'PK') throw new Error('El archivo de SEPA no es un ZIP');
    const dirs = [];
    {
      const n = Math.min(tam, 70000), t = leer(tam - n, n), e = t.lastIndexOf(Buffer.from([0x50, 0x4b, 5, 6]));
      const cdOff = t.readUInt32LE(e + 16), cdTam = t.readUInt32LE(e + 12), cd = leer(cdOff, cdTam);
      for (let p = 0; p + 46 <= cd.length && cd.readUInt32LE(p) === 0x02014b50;) {
        const nl = cd.readUInt16LE(p + 28), el = cd.readUInt16LE(p + 30), cl = cd.readUInt16LE(p + 32), nom = cd.toString('utf8', p + 46, p + 46 + nl);
        const m = /^(\d{4}-\d{2}-\d{2})\//.exec(nom); if (m) dirs.push(m[1]);
        p += 46 + nl + el + cl;
      }
    }
    fecha = dirs[0] || null;
    externo = directorioZip(leer, tam).filter(e => /\.zip$/i.test(e.nombre));
    if (!externo.length) throw new Error('El ZIP de SEPA no trae ZIP por comercio');
    if (externo.length > 200) throw new Error('El ZIP de SEPA trae demasiados comercios');
    const { reglas, indice } = compilarReglas(mapa);
    const acum = new Map(reglas.map(r => [r.n, new Map()]));
    const cuentas = { filas: 0, validas: 0, sinCampos: 0, sinPrecio: 0, tamano: 0, sinRegion: 0, comercios: 0, sucursales: 0, zips: 0, pocos: [] };
    for (const ez of externo) {
      const dir = directorioZip((o, l) => leer(ez.datos + o, l), ez.csize);
      const csv = nom => dir.find(d => d.nombre === nom);
      const suc = csv('sucursales.csv'), prod = csv('productos.csv');
      if (!suc || !prod) continue;
      cuentas.zips++; cuentas.comercios++;
      const regionDeSuc = new Map();
      for await (const l of lineasCsv(flujoEntrada(archivo, ez.datos, suc))) {
        const c = l.split('|');
        if (c.length < 14 || !/^\d/.test(c[0])) continue;
        regionDeSuc.set(c[0].trim() + '|' + c[1].trim() + '|' + c[2].trim(), regionDe(c[13], c[11]));
      }
      cuentas.sucursales += regionDeSuc.size;
      for await (const l of lineasCsv(flujoEntrada(archivo, ez.datos, prod))) {
        cuentas.filas++;
        const c = l.split('|');
        if (c.length !== 17) { cuentas.sinCampos++; continue }
        const t = palabras(c[5]);
        let hit = null;
        for (const w of t) { const a = indice.get(w); if (a) { hit = hit || new Set(); for (const r of a) hit.add(r) } }
        if (!hit) continue;
        for (const r of hit) {
          if (!coincide(r, t)) continue;
          if (r.marca.length && !r.marca.includes(sinTildes(c[8]).trim())) continue;
          if (r.ean.size && !r.ean.has(c[3].trim())) continue;
          if (r.t) { const s = tamano(r.u || r.b, c); if (s === null || s < r.t[0] || s > r.t[1]) { cuentas.tamano++; continue } }
          const p = precioBase(r.u || r.b, c);
          if (p === null || !(p > 0)) { cuentas.sinPrecio++; continue }
          const reg = regionDeSuc.get(c[0].trim() + '|' + c[1].trim() + '|' + c[2].trim());
          if (!reg) { cuentas.sinRegion++; continue }
          const m = acum.get(r.n);
          let a = m.get(reg); if (!a) m.set(reg, a = { v: [], vistos: 0, sem: 12345, com: new Set() });
          a.com.add(c[0].trim() + '|' + c[1].trim()); a.vistos++; cuentas.validas++;
          if (a.v.length < SEPA_MAX_OBS) a.v.push(p);
          else { a.sem = (a.sem * 1103515245 + 12345) & 0x7fffffff; const j = a.sem % a.vistos; if (j < SEPA_MAX_OBS) a.v[j] = p }
        }
      }
    }
    if (!cuentas.filas) throw new Error('El ZIP de SEPA no trae filas de producto');
    const items = new Map();
    for (const [n, porRegion] of acum) {
      const out = new Map();
      for (const [reg, a] of porRegion) {
        const bruto = estadistica(a.v);
        const v = a.v.filter(x => x >= bruto.med / 3 && x <= bruto.med * 3);
        if (v.length < SEPA_MIN_OBS || a.com.size < SEPA_MIN_COMERCIOS) { if (reg === 'GBA') cuentas.pocos.push(`${n}: ${v.length} obs, ${a.com.size} comercios`); continue }
        const e = estadistica(v);
        out.set(reg, { med: e.med, p25: e.p25, p75: e.p75, n: a.vistos, com: a.com.size });
      }
      if (out.size) items.set(n, out);
    }
    return { fecha, items, cuentas };
  } finally { closeSync(fd) }
}
export async function descargarSepa() {
  const ctl = AbortSignal.timeout(15 * 60 * 1000);
  const rp = await fetch(SEPA_PAQUETE, { headers: { 'User-Agent': 'mi-plato-facil (GitHub Actions)' }, signal: AbortSignal.timeout(30000) });
  if (!rp.ok) throw new Error(`HTTP ${rp.status} al pedir el paquete de SEPA`);
  const texto = await rp.text();
  if (texto.length > 1e6) throw new Error('La respuesta de CKAN es más grande de lo esperado');
  const pkg = JSON.parse(texto).result;
  const zips = (pkg.resources || []).filter(r => String(r.format).toUpperCase() === 'ZIP' && /\/sepa_[a-z]+\.zip$/.test(String(r.url)) && String(r.url).startsWith('https://datos.produccion.gob.ar/'))
    .sort((a, b) => String(b.last_modified).localeCompare(String(a.last_modified)));
  if (!zips.length) throw new Error('El paquete de SEPA no trae ZIP diarios reconocibles');
  const r = await fetch(zips[0].url, { headers: { 'User-Agent': 'mi-plato-facil (GitHub Actions)' }, redirect: 'follow', signal: ctl });
  if (!r.ok || !r.body) throw new Error(`HTTP ${r.status} al descargar SEPA`);
  const carpeta = await mkdtemp(join(tmpdir(), 'sepa-')), archivo = join(carpeta, 'sepa.zip');
  let total = 0;
  const limite = new Transform({ transform(d, _e, cb) { total += d.length; cb(total > SEPA_MAX_ZIP ? new Error('El ZIP de SEPA supera el tope de 600 MB') : null, d) } });
  await pipeline(Readable.fromWeb(r.body), limite, createWriteStream(archivo));
  return { archivo, carpeta, recurso: zips[0].name };
}

// ---------- Composición ----------
const redondeoPrecio = (v, b) => redondeo(v, b === 'unidad' && v < 100 ? 2 : 0);
// Junta INDEC (p) y SEPA (s, r, c) en un solo JSON. indec: salida de armar() o null (se usa lo guardado); sepa: salida de leerSepa() o null.
export function componer({ previo, indec, sepa, mapa, hoy }) {
  const base = indec || previo;
  if (!base || !base.fuente || !base.mes) throw new Error('Falta la base de INDEC (ni se pudo leer ni hay un datos/precios.json anterior)');
  const avisos = [];
  const deIndec = new Map((base.items || []).map(i => [i.n, i]));
  const previoPorN = new Map(((previo && previo.items) || []).map(i => [i.n, i]));
  const items = [];
  let conSepaAntes = 0, saltos = 0;
  for (const m of mapa.items) {
    const o = { n: m.n, b: m.b };
    const ind = deIndec.get(m.n);
    if (ind && ind.p) { o.i = ind.i; o.p = ind.p; if (ind.a) o.a = true }
    if (m.densidad) o.d = m.densidad;
    const ant = previoPorN.get(m.n);
    const s = {}, r = {}, c = {};
    const nuevo = sepa && sepa.items.get(m.n);
    if (sepa) {
      if (nuevo) for (const [reg, e] of nuevo) { s[reg] = redondeoPrecio(e.med, m.b); r[reg] = [redondeoPrecio(e.p25, m.b), redondeoPrecio(e.p75, m.b)]; c[reg] = [e.n, e.com] }
    } else if (ant && ant.s) Object.assign(s, ant.s), Object.assign(r, ant.r || {}), Object.assign(c, ant.c || {});
    for (const reg of Object.keys(s)) {
      // Contra INDEC: si SEPA queda fuera de 0,5 a 2 veces, se prefiere INDEC y SEPA no se publica para esa región.
      const pi = o.p && o.p[reg];
      if (pi > 0 && (s[reg] / pi > 2 || s[reg] / pi < 0.5)) { avisos.push(`${m.n} (${reg}): SEPA ${s[reg]} contra INDEC ${pi}, se prefiere INDEC`); delete s[reg]; delete r[reg]; delete c[reg]; continue }
      // Salto semanal contra lo guardado.
      const pa = ant && ant.s && ant.s[reg];
      if (sepa && pa > 0) { conSepaAntes++; const k = s[reg] / pa; if (k > 2.5 || k < 0.4) { saltos++; avisos.push(`${m.n} (${reg}): salto de ${pa} a ${s[reg]}, se conserva el anterior`); s[reg] = pa; r[reg] = (ant.r || {})[reg] || r[reg]; c[reg] = (ant.c || {})[reg] || c[reg] } }
    }
    if (Object.keys(s).length) { o.s = s; o.r = r; o.c = c; if (m.sepa && m.sepa.a) o.sa = true }
    if ((o.p && o.p.GBA > 0) || (o.s && o.s.GBA > 0)) items.push(o);
  }
  if (conSepaAntes >= 8 && saltos / conSepaAntes > 0.25) throw new Error(`Más de un cuarto de los precios de SEPA saltó contra la semana anterior (${saltos} de ${conSepaAntes}): probablemente cambió el formato`);
  const datos = { version: 1, revisado: hoy, mes: base.mes, fuente: base.fuente, regiones: REGIONES };
  const sp = sepa ? { fecha: sepa.fecha, recurso: sepa.recurso, productos: sepa.cuentas.filas, sucursales: sepa.cuentas.sucursales, comercios: sepa.cuentas.comercios } : (previo && previo.sepa);
  if (sp) datos.sepa = {
    nombre: 'Precios Claros – Base SEPA (Secretaría de Comercio, Ministerio de Economía de la Nación)',
    dataset: SEPA_DATASET, licencia: 'CC BY 4.0', licenciaUrl: SEPA_LICENCIA,
    atribucion: 'Fuente: Secretaría de Comercio, Ministerio de Economía de la Nación, Precios Claros – Base SEPA, licencia CC BY 4.0.',
    nota: 'Mediana (y rango del 25 % al 75 %) de lo que publican los comercios adheridos, calculada por Mi Plato Fácil. Las regiones se arman con la provincia de cada sucursal; GBA es CABA más el conurbano por código postal. No son los precios de tu comercio.',
    fecha: sp.fecha, recurso: sp.recurso, productos: sp.productos, sucursales: sp.sucursales, comercios: sp.comercios,
  };
  datos.items = items;
  return { datos, avisos };
}
export function coberturaAmbito(d, mapa) {
  const amb = mapa.ambito || { nucleo: [], armado: [] };
  const tiene = n => { const it = d.items.find(x => x.n === n); return !!it && ((it.s && it.s.GBA > 0) || (it.p && it.p.GBA > 0)) };
  const aprox = n => { const it = d.items.find(x => x.n === n); return !!it && (it.s && it.s.GBA > 0 ? !!it.sa : !!it.a) };
  const cuenta = lista => ({ total: lista.length, con: lista.filter(tiene).length, aprox: lista.filter(n => tiene(n) && aprox(n)).length });
  return { nucleo: cuenta(amb.nucleo), armado: cuenta(amb.armado), total: cuenta([...amb.nucleo, ...amb.armado]) };
}

// ---------- Programa ----------
async function descargar() {
  const r = await fetch(DESCARGA, { headers: { 'User-Agent': 'mi-plato-facil (GitHub Actions)' }, redirect: 'follow', signal: AbortSignal.timeout(90000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} al descargar el archivo de INDEC`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error('El archivo de INDEC es más grande de lo esperado');
  const carpeta = await mkdtemp(join(tmpdir(), 'indec-')), archivo = join(carpeta, 'sh_ipc_precios_promedio.xls');
  await writeFile(archivo, buf);
  return { buf, archivo };
}
async function principal() {
  const leerJson = async rel => JSON.parse(await readFile(/^([a-z]:|[\/])/i.test(rel) ? rel : ruta(rel), 'utf8'));
  const catalogo = await catalogoNutricion(), mapa = await leerJson('datos/precios-mapa.json');
  if (args.includes('--verificar')) {
    const fallas = [...validarMapa(mapa, catalogo)];
    const real = arg('--archivo-json') || 'datos/precios.json';
    const txtReal = await readFile(/^([a-z]:|[\/])/i.test(real) ? real : ruta(real), 'utf8');
    const dReal = JSON.parse(txtReal);
    fallas.push(...validar(dReal, { catalogo, mapa }).map(x => `${real}: ${x}`));
    if (Buffer.byteLength(JSON.stringify(dReal)) > MAX_BYTES_JSON) fallas.push(`${real}: pesa más de ${MAX_BYTES_JSON} bytes`);
    if (!arg('--archivo-json')) {
      fallas.push(...validar(await leerJson('datos/precios-ejemplo.json'), { catalogo }).map(x => `datos/precios-ejemplo.json: ${x}`));
      fallas.push(...validar(await leerJson('datos/precios-ejemplo-sepa.json'), { catalogo }).map(x => `datos/precios-ejemplo-sepa.json: ${x}`));
    }
    if (fallas.length) { console.error('Precios inválidos:\n- ' + fallas.join('\n- ')); process.exit(1) }
    const cb = coberturaAmbito(dReal, mapa);
    console.log(`Precios válidos. Núcleo ${cb.nucleo.con}/${cb.nucleo.total}, armado ${cb.armado.con}/${cb.armado.total}, total ${cb.total.con}/${cb.total.total} (${cb.total.aprox} aproximados); ${Buffer.byteLength(JSON.stringify(dReal))} bytes.`);
    return;
  }
  const hoy = arg('--hoy') || new Date().toISOString().slice(0, 10);
  const soloIndec = args.includes('--solo-indec'), soloSepa = args.includes('--solo-sepa');
  const salida = arg('--salida') ? resolve(arg('--salida')) : fileURLToPath(ruta('datos/precios.json'));
  let previo = null; try { previo = JSON.parse(await readFile(fileURLToPath(ruta('datos/precios.json')), 'utf8')) } catch { /* no existe */ }
  if (!previo) try { previo = JSON.parse(await readFile(salida, 'utf8')) } catch { /* no existe */ }
  let indec = null, sepa = null, hashIndec = null;
  const errores = [];
  if (!soloSepa) {
    try {
      let buf, origen = arg('--archivo');
      if (origen) buf = await readFile(origen); else ({ buf, archivo: origen } = await descargar());
      indec = armar(leerLibro(leerOle(buf)), mapa, hoy);
      hashIndec = createHash('sha256').update(buf).digest('hex').slice(0, 16);
    } catch (e) { if (soloIndec) throw e; errores.push('INDEC: ' + e.message) }
  }
  const limpiar = [];
  if (!soloIndec) {
    try {
      let archivo = arg('--archivo-sepa'), recurso = 'archivo local';
      if (!archivo) { const d = await descargarSepa(); archivo = d.archivo; recurso = d.recurso; limpiar.push(d.carpeta) }
      const t0 = Date.now();
      sepa = await leerSepa(archivo, mapa);
      sepa.recurso = recurso;
      if (!sepa.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(sepa.fecha)) throw new Error('El ZIP de SEPA no trae la fecha del día');
      const dias = (Date.parse(hoy) - Date.parse(sepa.fecha)) / 864e5;
      if (!(dias >= -1 && dias <= 14)) throw new Error(`La fecha del archivo de SEPA (${sepa.fecha}) no es de las últimas dos semanas`);
      const c = sepa.cuentas;
      if (process.env.SEPA_DEBUG) console.log('Con pocos datos en GBA: ' + c.pocos.join(' | '));
      if (c.sinCampos / c.filas > 0.4) throw new Error('Más del 40 % de las líneas de SEPA no tiene 17 columnas: cambió el formato');
      console.log(`SEPA ${sepa.fecha}: ${c.filas} filas, ${c.validas} con precio coherente, ${c.sinPrecio} descartadas por precio, ${c.tamano} por tamaño, ${c.sinRegion} sin región, ${sepa.items.size} ingredientes, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    } catch (e) { if (soloSepa) throw e; errores.push('SEPA: ' + e.message); sepa = null }
    finally { for (const c of limpiar) await rm(c, { recursive: true, force: true }).catch(() => {}) }
  }
  if (!indec && !sepa) throw new Error(errores.join(' · ') || 'No se pudo actualizar nada');
  for (const e of errores) console.warn('Aviso, se conserva lo anterior: ' + e);
  const { datos, avisos } = componer({ previo, indec, sepa, mapa, hoy });
  for (const a of avisos) console.warn('Aviso: ' + a);
  const fallas = validar(datos, { catalogo, mapa, hoy });
  const bytes = Buffer.byteLength(JSON.stringify(datos));
  if (bytes > MAX_BYTES_JSON) fallas.push(`pesa ${bytes} bytes y el tope es ${MAX_BYTES_JSON}`);
  if (fallas.length) throw new Error('El resultado no pasa la validación:\n- ' + fallas.join('\n- '));
  const cb = coberturaAmbito(datos, mapa);
  const igual = previo && JSON.stringify({ ...previo, revisado: 0 }) === JSON.stringify({ ...datos, revisado: 0 });
  console.log(`Cobertura: núcleo ${cb.nucleo.con}/${cb.nucleo.total}, armado ${cb.armado.con}/${cb.armado.total}, total ${cb.total.con}/${cb.total.total} (${cb.total.aprox} aproximados) · ${datos.items.length} ingredientes · ${bytes} bytes${hashIndec ? ' · INDEC sha256 ' + hashIndec : ''} · ${igual ? 'sin cambios' : 'actualizado'}`);
  if (igual) return;
  const tmp = salida + '.tmp'; await writeFile(tmp, JSON.stringify(datos) + '\n'); await rename(tmp, salida);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().catch(e => { console.error('No se actualizaron los precios (se conserva el último archivo): ' + e.message); process.exit(1) });
}
