// Actualiza datos/nutricion.json desde USDA FoodData Central (dominio público, CC0 1.0).
// - Foundation Foods: se descarga la versión más reciente (USDA la actualiza unas dos veces por año).
// - SR Legacy: copia fija dentro de datos/nutricion-mapa.json (versión final de 2018, no cambia).
// Uso: node herramientas/actualizar-nutricion.mjs [--foundation archivo.json] [--hoy AAAA-MM-DD]
// Sin dependencias: requiere Node 18 o superior.
import { readFile, writeFile } from 'node:fs/promises';
import { inflateRawSync } from 'node:zlib';
import { basename } from 'node:path';

const RAIZ = new URL('../', import.meta.url);
const PAGINA = 'https://fdc.nal.usda.gov/download-datasets/';
const DESCARGAS = 'https://fdc.nal.usda.gov/fdc-datasets/';
const args = process.argv.slice(2), arg = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
// Nutrientes (id de FDC en orden de preferencia): energía, proteínas, grasas, carbohidratos, fibra, azúcares, sodio.
const NUTRIENTES = { kcal: [1008, 2048, 2047], prot: [1003], fat: [1004, 1085], carb: [1005, 1050], fib: [1079], sug: [2000, 1063], na: [1093] };
const ORDEN = ['kcal', 'prot', 'fat', 'carb', 'fib', 'sug', 'na'];
const MACROS = ['kcal', 'prot', 'fat', 'carb'];
const red = (v, d = 2) => v == null ? null : Math.round(Math.max(0, v) * 10 ** d) / 10 ** d;

async function descargar(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'mi-plato-facil (GitHub Actions)' }, redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status} al descargar ${url}`);
  return Buffer.from(await r.arrayBuffer());
}
function descomprimir(zip) { // devuelve el primer .json del ZIP
  const fin = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (fin < 0) throw new Error('El archivo descargado no es un ZIP');
  let p = zip.readUInt32LE(fin + 16);
  for (let i = 0, n = zip.readUInt16LE(fin + 10); i < n; i++) {
    const metodo = zip.readUInt16LE(p + 10), tam = zip.readUInt32LE(p + 20), largoNombre = zip.readUInt16LE(p + 28);
    const nombre = zip.slice(p + 46, p + 46 + largoNombre).toString('utf8'), local = zip.readUInt32LE(p + 42);
    p += 46 + largoNombre + zip.readUInt16LE(p + 30) + zip.readUInt16LE(p + 32);
    if (!nombre.endsWith('.json')) continue;
    const ini = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28), datos = zip.slice(ini, ini + tam);
    return { nombre, texto: (metodo === 8 ? inflateRawSync(datos) : datos).toString('utf8') };
  }
  throw new Error('El ZIP no contiene un JSON');
}
async function foundationMasReciente() {
  const html = (await descargar(PAGINA)).toString('utf8');
  const versiones = [...html.matchAll(/FoodData_Central_foundation_food_json_(\d{4}-\d{2}-\d{2})\.zip/g)].map(m => m[1]).sort();
  if (!versiones.length) throw new Error('No se encontró Foundation Foods en la página de descargas de USDA');
  const version = versiones.at(-1), { texto } = descomprimir(await descargar(`${DESCARGAS}FoodData_Central_foundation_food_json_${version}.zip`));
  return { version, datos: JSON.parse(texto) };
}
function valores(foodNutrients) {
  const porId = new Map(foodNutrients.filter(x => x && x.nutrient && typeof x.amount === 'number').map(x => [x.nutrient.id, x.amount]));
  const n = {}; for (const [k, ids] of Object.entries(NUTRIENTES)) for (const id of ids) if (porId.has(id)) { n[k] = porId.get(id); break }
  return n;
}
// Porción casera de USDA para cada unidad de la app (gramos por 1 unidad).
function porciones(lista, opciones = {}) {
  const items = (lista || []).map(([a, u, g]) => ({ u: String(u), g: g / (a || 1) })).filter(p => p.g > 0);
  const buscar = (re, excluir) => items.find(p => re.test(p.u) && !(excluir && excluir.test(p.u)));
  const NO_UNIDAD = /\b(cup|tbsp|tablespoon|tsp|teaspoon|oz|lb|serving|racc|container|package|can|quart|pint|fl)\b/i;
  const elegida = t => { const q = t.toLowerCase(); return items.find(p => p.u.toLowerCase() === q) || items.find(p => p.u.toLowerCase().startsWith(q)) || items.find(p => p.u.toLowerCase().includes(q)) };
  const unidad = opciones.unidad === null ? null : opciones.unidad ? elegida(opciones.unidad)
    : buscar(/\bmedium\b/i, NO_UNIDAD) || buscar(/\blarge\b/i, NO_UNIDAD) || buscar(/\b(whole|fruit|egg|clove|slice|piece|leaf|stalk|spear|ear|bulb|head|sprig|pepper|onion|potato|tomato|carrot|banana|apple|pear|peach|plum|orange|lemon|kiwi|avocado|breast|thigh|fillet|bar|tortilla|pita|roll)\b/i, NO_UNIDAD)
      || items.find(p => !NO_UNIDAD.test(p.u) && !/\b(bunch|package|nlea)\b/i.test(p.u));
  const taza = opciones.taza === null ? null : items.find(p => /^cup$/i.test(p.u.trim())) || buscar(/\bcup\b/i);
  const cda = buscar(/\b(tbsp|tablespoon)\b/i), cdta = buscar(/\b(tsp|teaspoon)\b/i);
  const out = {};
  for (const [k, p] of Object.entries({ unidad, taza, cucharada: cda, cucharadita: cdta })) if (p) out[k] = [red(p.g, 1), p.u];
  return out;
}

const mapa = JSON.parse(await readFile(new URL('datos/nutricion-mapa.json', RAIZ), 'utf8'));
let foundation, versionFoundation;
if (arg('--foundation')) { foundation = JSON.parse(await readFile(arg('--foundation'), 'utf8')); versionFoundation = (basename(arg('--foundation')).match(/(\d{4}-\d{2}-\d{2})/) || [, 'local'])[1] }
else ({ version: versionFoundation, datos: foundation } = await foundationMasReciente());
const porNdb = new Map((foundation.FoundationFoods || []).filter(Boolean).map(f => [f.ndbNumber, f]));

const items = [], avisos = [];
for (const m of mapa.items) {
  const f = m.foundationNdb != null ? porNdb.get(m.foundationNdb) : null;
  if (m.foundationNdb != null && !f) avisos.push(`${m.nombre}: ya no está en Foundation (ndb ${m.foundationNdb}); se usa SR Legacy`);
  const fv = f ? valores(f.foodNutrients) : null, sv = m.sr ? m.sr.n : null;
  const usaF = fv && MACROS.every(k => fv[k] != null);
  if (!usaF && !sv) { avisos.push(`${m.nombre}: sin datos`); continue }
  const base = usaF ? fv : sv, completados = [];
  const v = ORDEN.map(k => { if (base[k] != null) return red(base[k], k === 'na' ? 0 : 2); if (usaF && sv && sv[k] != null) { completados.push(k); return red(sv[k], k === 'na' ? 0 : 2) } return null });
  const item = { n: m.nombre, s: m.sinonimos, b: usaF ? 'F' : 'S', id: usaF ? f.fdcId : m.sr.fdcId, d: usaF ? f.description : m.sr.descripcion, v };
  if (completados.length) item.c = { id: m.sr.fdcId, d: m.sr.descripcion, k: completados };
  const u = porciones(m.sr ? m.sr.porciones : (f.foodPortions || []).filter(p => p.measureUnit && p.measureUnit.name !== 'RACC').map(p => [p.amount || p.value || 1, [p.measureUnit.name, p.modifier, p.portionDescription].filter(x => x && x !== 'undetermined').join(' '), p.gramWeight]), m.opciones);
  if (Object.keys(u).length) item.u = u;
  if (m.nota) item.nota = m.nota;
  items.push(item);
}
const hoy = arg('--hoy') || new Date().toISOString().slice(0, 10);
const salida = {
  version: 1, revisado: hoy,
  fuente: { nombre: 'USDA FoodData Central', url: 'https://fdc.nal.usda.gov/', licencia: 'CC0 1.0 (dominio público)', foundation: versionFoundation, srLegacy: mapa.srLegacyVersion },
  campos: ['kcal', 'proteinas_g', 'grasas_g', 'carbohidratos_g', 'fibra_g', 'azucares_g', 'sodio_mg'],
  items
};
await writeFile(new URL('datos/nutricion.json', RAIZ), JSON.stringify(salida) + '\n');
console.log(`nutricion.json: ${items.length} ingredientes · Foundation ${versionFoundation} · ${items.filter(i => i.b === 'F').length} con Foundation, ${items.filter(i => i.b === 'S').length} con SR Legacy`);
avisos.forEach(a => console.log('AVISO ' + a));
