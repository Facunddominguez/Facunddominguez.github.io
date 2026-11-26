// Ronda 6, Etapa 45 (precios confiables): pruebas en Node, sin red y sin dependencias, de herramientas/actualizar-precios.mjs.
// Imprime una línea "PASA R6-P-0N …" o "FALLA R6-P-0N …" por prueba. Uso:
//   node pruebas/r6e45_precios.mjs            corre todas
//   node pruebas/r6e45_precios.mjs R6-P-01    corre solo las de ese ítem (la compuerta lo usa así: falla si no hay ninguna o si alguna falla)
import { deflateRawSync } from 'node:zlib';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { leerSepa, entradasZip, descargarSepa, pedirConReintentos, ESPERAS_SEPA, CABECERAS_NAVEGADOR, controlarFrescura, diasEntre, MAX_DIAS_SIN_SEPA } from '../herramientas/actualizar-precios.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const filtro = process.argv[2] || '';
let fallas = 0, corridas = 0;
const ok = (nombre, cond, det = '') => {
  if (filtro && !nombre.startsWith(filtro + ' ')) return;
  corridas++; console.log((cond ? 'PASA ' : 'FALLA ') + nombre + (det ? ' · ' + det : '')); if (!cond) fallas++;
};

// ----- Escritor mínimo de ZIP, con o sin ZIP64 -----
// z64: cada entrada lleva sus tamaños y su posición en el campo extra 0x0001 (valores 0xFFFFFFFF en los de 32 bits) y el final
// usa el registro ZIP64 con su localizador, como los ZIP de más de 4 GB o de más de 65.535 entradas.
function zip(entradas, { z64 = false } = {}) {
  const partes = [], cd = []; let off = 0;
  const b64 = n => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b };
  for (const e of entradas) {
    const nom = Buffer.from(e.nombre), dat = e.comprimir ? deflateRawSync(e.datos) : e.datos, metodo = e.comprimir ? 8 : 0;
    const exLocal = z64 ? Buffer.concat([Buffer.from([1, 0, 16, 0]), b64(e.datos.length), b64(dat.length)]) : Buffer.alloc(0);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(z64 ? 45 : 20, 4); h.writeUInt16LE(metodo, 8);
    h.writeUInt32LE(z64 ? 0xffffffff : dat.length, 18); h.writeUInt32LE(z64 ? 0xffffffff : e.datos.length, 22); h.writeUInt16LE(nom.length, 26); h.writeUInt16LE(exLocal.length, 28);
    partes.push(h, nom, exLocal, dat);
    const exCd = z64 ? Buffer.concat([Buffer.from([1, 0, 24, 0]), b64(e.datos.length), b64(dat.length), b64(off)]) : Buffer.alloc(0);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(z64 ? 45 : 20, 4); c.writeUInt16LE(z64 ? 45 : 20, 6); c.writeUInt16LE(metodo, 10);
    c.writeUInt32LE(z64 ? 0xffffffff : dat.length, 20); c.writeUInt32LE(z64 ? 0xffffffff : e.datos.length, 24); c.writeUInt16LE(nom.length, 28); c.writeUInt16LE(exCd.length, 30);
    c.writeUInt32LE(z64 ? 0xffffffff : off, 42);
    cd.push(c, nom, exCd); off += 30 + nom.length + exLocal.length + dat.length;
  }
  const cdb = Buffer.concat(cd), fin = Buffer.alloc(22); fin.writeUInt32LE(0x06054b50, 0);
  if (!z64) {
    fin.writeUInt16LE(entradas.length, 8); fin.writeUInt16LE(entradas.length, 10); fin.writeUInt32LE(cdb.length, 12); fin.writeUInt32LE(off, 16);
    return Buffer.concat([...partes, cdb, fin]);
  }
  const r64 = Buffer.alloc(56); r64.writeUInt32LE(0x06064b50, 0); r64.writeBigUInt64LE(44n, 4); r64.writeUInt16LE(45, 12); r64.writeUInt16LE(45, 14);
  r64.writeBigUInt64LE(BigInt(entradas.length), 24); r64.writeBigUInt64LE(BigInt(entradas.length), 32); r64.writeBigUInt64LE(BigInt(cdb.length), 40); r64.writeBigUInt64LE(BigInt(off), 48);
  const loc = Buffer.alloc(20); loc.writeUInt32LE(0x07064b50, 0); loc.writeBigUInt64LE(BigInt(off + cdb.length), 8); loc.writeUInt32LE(1, 16);
  fin.writeUInt16LE(0xffff, 8); fin.writeUInt16LE(0xffff, 10); fin.writeUInt32LE(0xffffffff, 12); fin.writeUInt32LE(0xffffffff, 16);
  return Buffer.concat([...partes, cdb, r64, loc, fin]);
}
const SUC = 'id_comercio|id_bandera|id_sucursal|sucursales_nombre|sucursales_tipo|sucursales_calle|sucursales_numero|sucursales_latitud|sucursales_longitud|sucursales_observaciones|sucursales_barrio|sucursales_codigo_postal|sucursales_localidad|sucursales_provincia|a|b|c|d|e|f|g';
const PROD = 'id_comercio|id_bandera|id_sucursal|id_producto|productos_ean|productos_descripcion|productos_cantidad_presentacion|productos_unidad_medida_presentacion|productos_marca|productos_precio_lista|productos_precio_referencia|productos_cantidad_referencia|productos_unidad_medida_referencia|a|b|c|d';
const suc = (com, id, cp, prov) => `${com}|1|${id}|S${id}|Supermercado|Calle|1|0|0||Barrio|${cp}|Loc|${prov}|||||||`;
const prod = (com, sucId, desc, p) => `${com}|1|${sucId}|779${com}${sucId}|1|${desc}|1.00|kg||${p}|${p}|1.00|kg||||`;
function comercio(com, precios, z64) {
  const filas = precios.map((p, i) => prod(com, 1 + (i % 2), 'ZANAHORIA ELEGIDA', p));
  return zip([
    { nombre: 'sucursales.csv', datos: Buffer.from([SUC, suc(com, 1, 'C1073AAQ', 'AR-C'), suc(com, 2, '1700', 'AR-B')].join('\r\n') + '\r\n'), comprimir: true },
    { nombre: 'productos.csv', datos: Buffer.from([PROD, ...filas].join('\n') + '\n'), comprimir: true },
  ], { z64 });
}
const MAPA = { items: [{ n: 'Zanahoria', b: 'kg', sepa: { q: ['zanahoria'], ini: true, t: [0.9, 6] } }] };
const sepaZip = (z64Externo, z64Interno) => zip([
  { nombre: '2026-11-02/', datos: Buffer.alloc(0) },
  ...[1, 2, 3].map(c => ({ nombre: `2026-11-02/sepa_1_comercio-sepa-${c}_2026-11-02_09-05-10.zip`, datos: comercio(c, [2000, 2800, 3000, 3000, 4000], z64Interno) })),
], { z64: z64Externo });

const dir = mkdtempSync(join(tmpdir(), 'r6e45-'));
try {
  // ---------- P-01: ZIP64 ----------
  const archivoComun = join(dir, 'comun.zip'), archivo64 = join(dir, 'zip64.zip'), archivoMixto = join(dir, 'mixto.zip'), archivoInterno = join(dir, 'interno64.zip');
  writeFileSync(archivoComun, sepaZip(false, false)); writeFileSync(archivo64, sepaZip(true, true)); writeFileSync(archivoMixto, sepaZip(true, false)); writeFileSync(archivoInterno, sepaZip(false, true));
  const resumen = r => { const g = r.items.get('Zanahoria') && r.items.get('Zanahoria').get('GBA'); return g ? { fecha: r.fecha, med: g.med, p25: g.p25, p75: g.p75, n: g.n, com: g.com, comercios: r.cuentas.comercios } : { fecha: r.fecha, sin: true } };
  const comun = resumen(await leerSepa(archivoComun, MAPA));
  let z64 = null, mixto = null, interno = null, errorZ64 = '';
  try { z64 = resumen(await leerSepa(archivo64, MAPA)); mixto = resumen(await leerSepa(archivoMixto, MAPA)); interno = resumen(await leerSepa(archivoInterno, MAPA)) } catch (e) { errorZ64 = e.message }
  ok('R6-P-01 un ZIP64 de prueba (solo el externo, solo los de cada comercio, o los dos) se lee igual que uno común: fecha, mediana, percentiles y comercios', !errorZ64 && comun.med === 3000 && JSON.stringify(z64) === JSON.stringify(comun) && JSON.stringify(mixto) === JSON.stringify(comun) && JSON.stringify(interno) === JSON.stringify(comun), errorZ64 || JSON.stringify(z64));

  // Tamaños y posiciones de más de 4 GB: sin crear el archivo, con un lector virtual que solo tiene el final y el directorio central.
  {
    const GRANDE = 7_000_000_000, nom = Buffer.from('2026-11-02/sepa_1_comercio.zip'), off = 4_500_000_000, cs = 2_900_000_000;
    const b64 = n => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b };
    const ex = Buffer.concat([Buffer.from([1, 0, 24, 0]), b64(cs + 1000), b64(cs), b64(off)]);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(0, 10); c.writeUInt32LE(0xffffffff, 20); c.writeUInt32LE(0xffffffff, 24); c.writeUInt16LE(nom.length, 28); c.writeUInt16LE(ex.length, 30); c.writeUInt32LE(0xffffffff, 42);
    const cdb = Buffer.concat([c, nom, ex]), cdOff = GRANDE - 200;
    const r64 = Buffer.alloc(56); r64.writeUInt32LE(0x06064b50, 0); r64.writeBigUInt64LE(1n, 32); r64.writeBigUInt64LE(1n, 24); r64.writeBigUInt64LE(BigInt(cdb.length), 40); r64.writeBigUInt64LE(BigInt(cdOff), 48);
    const loc = Buffer.alloc(20); loc.writeUInt32LE(0x07064b50, 0); loc.writeBigUInt64LE(BigInt(cdOff + cdb.length), 8);
    const fin = Buffer.alloc(22); fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(0xffff, 10); fin.writeUInt32LE(0xffffffff, 12); fin.writeUInt32LE(0xffffffff, 16);
    const trozos = [[cdOff, cdb], [cdOff + cdb.length, Buffer.concat([r64, loc, fin])]], total = cdOff + cdb.length + 56 + 20 + 22;
    const leer = (o, l) => { const b = Buffer.alloc(l); for (const [po, pb] of trozos) { const d = Math.max(o, po), h = Math.min(o + l, po + pb.length); if (d < h) pb.copy(b, d - o, d - po, h - po) } return b };
    let e = null, err = '';
    try { e = entradasZip(leer, total) } catch (x) { err = x.message }
    ok('R6-P-01 el ZIP64 con tamaños y posiciones de más de 4 GB se lee entero (64 bits, sin perder dígitos)', !err && e.length === 1 && e[0].off === off && e[0].csize === cs && e[0].usize === cs + 1000 && e[0].nombre.endsWith('.zip'), err || JSON.stringify(e));
  }
  ok('R6-P-01 un ZIP64 con el localizador o el campo extra dañado falla con un mensaje claro y no con "ZIP64 no soportado"', await (async () => {
    const buf = Buffer.from(sepaZip(true, true)), i = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 6, 7])); buf.writeUInt32LE(0, i);
    const mal = join(dir, 'zip64-malo.zip'); writeFileSync(mal, buf);
    try { await leerSepa(mal, MAPA); return false } catch (e) { return /ZIP64/.test(e.message) && !/no soportado/.test(e.message) }
  })());
  const cli = spawnSync(process.execPath, [join(RAIZ, 'herramientas/actualizar-precios.mjs'), '--solo-sepa', '--archivo-sepa', archivo64, '--hoy', '2026-11-03', '--salida', join(dir, 'salida64.json')], { encoding: 'utf8' });
  ok('R6-P-01 la herramienta, corrida con un ZIP64, no dice "ZIP64 no soportado" (puede fallar por otra cosa, como pocos comercios en la prueba)', !/ZIP64 no soportado/.test((cli.stdout || '') + (cli.stderr || '')), ((cli.stdout || '') + (cli.stderr || '')).trim().slice(0, 160));

  // ---------- P-02: HTTP 403, reintentos con espera y cabeceras de navegador ----------
  const respuesta = (status, cuerpo = '', cab = {}) => new Response(cuerpo, { status, headers: cab });
  const guion = (...rs) => { const visto = { llamadas: 0, cabeceras: [], esperas: [] }; const f = async (url, o) => { visto.cabeceras.push(o.headers); const r = rs[Math.min(visto.llamadas++, rs.length - 1)]; if (r instanceof Error) throw r; return r.clone ? r.clone() : r }; return { f, visto, espera: async ms => { visto.esperas.push(ms) } } };
  {
    const g = guion(respuesta(403, 'Forbidden', { server: 'cloudflare', 'cf-ray': 'abc123' }), respuesta(403, 'Forbidden'), respuesta(200, '{"ok":true}'));
    const r = await pedirConReintentos('https://datos.produccion.gob.ar/x', { que: 'al pedir el paquete de SEPA', fetchFn: g.f, espera: g.espera, log: () => {} });
    ok('R6-P-02 ' + 'tras dos 403 el tercer intento anda, esperando entre intentos (5 s y 20 s)', r.ok && g.visto.llamadas === 3 && JSON.stringify(g.visto.esperas) === JSON.stringify([5000, 20000]) && JSON.stringify(ESPERAS_SEPA) === '[5000,20000,60000]', JSON.stringify(g.visto.esperas));
    ok('R6-P-02 cada pedido lleva cabeceras de navegador (User-Agent de Chrome, Accept-Language en español y Referer del portal)', g.visto.cabeceras.every(h => /Mozilla\/5\.0.*Chrome/.test(h['User-Agent']) && /es-AR/.test(h['Accept-Language']) && /datos\.produccion\.gob\.ar/.test(h.Referer)) && CABECERAS_NAVEGADOR['User-Agent'] === g.visto.cabeceras[0]['User-Agent']);
  }
  {
    const g = guion(respuesta(403, 'Request blocked by WAF', { server: 'cloudflare', 'cf-ray': 'abc123' }));
    let msg = '';
    try { await pedirConReintentos('https://datos.produccion.gob.ar/x', { que: 'al pedir el paquete de SEPA', fetchFn: g.f, espera: g.espera, log: () => {} }) } catch (e) { msg = e.message }
    ok('R6-P-02 si el 403 sigue tras 4 intentos, el error conserva "HTTP 403 al pedir el paquete de SEPA" y dice qué respondió el servidor (servidor, cf-ray y cuerpo)',
      g.visto.llamadas === 4 && g.visto.esperas.length === 3 && msg.startsWith('HTTP 403 al pedir el paquete de SEPA') && /4 intentos/.test(msg) && /server: cloudflare/.test(msg) && /cf-ray: abc123/.test(msg) && /WAF/.test(msg), msg);
  }
  {
    const g = guion(respuesta(404, 'no existe'));
    let msg = ''; try { await pedirConReintentos('https://x/', { que: 'al pedir', fetchFn: g.f, espera: g.espera, log: () => {} }) } catch (e) { msg = e.message }
    const h = guion(new Error('fetch failed'), respuesta(200, 'listo'));
    const r = await pedirConReintentos('https://x/', { que: 'al pedir', fetchFn: h.f, espera: h.espera, log: () => {} });
    ok('R6-P-02 un 404 no se reintenta; un corte de red sí, y el segundo intento anda', g.visto.llamadas === 1 && /^HTTP 404/.test(msg) && h.visto.llamadas === 2 && r.ok);
  }
  {
    // descargarSepa completo con un servidor simulado: 403 en el paquete, después el paquete y el ZIP.
    const bytes = sepaZip(true, true), url = 'https://datos.produccion.gob.ar/dataset/sepa-precios/resource/x/download/sepa_martes.zip';
    let n = 0; const visto = [];
    const f = async u => { visto.push(u); if (u.includes('package_show')) return ++n === 1 ? respuesta(403, 'Forbidden') : respuesta(200, JSON.stringify({ result: { resources: [{ format: 'ZIP', url, name: 'sepa_martes.zip', last_modified: '2026-11-02' }] } })); return new Response(bytes, { status: 200 }) };
    const d = await descargarSepa({ fetchFn: f, espera: async () => {}, log: () => {} });
    const r = await leerSepa(d.archivo, MAPA);
    rmSync(d.carpeta, { recursive: true, force: true });
    ok('R6-P-02 descargarSepa se recupera de un 403 en el paquete, baja el ZIP64 y lo lee', n === 2 && visto.length === 3 && r.fecha === '2026-11-02' && r.items.get('Zanahoria').get('GBA').med === 3000, JSON.stringify(visto));
  }

  {
    const g = guion(respuesta(403, 'Forbidden'), new Error('fetch failed'));
    let msg = ''; try { await pedirConReintentos('https://x/', { que: 'al pedir el paquete de SEPA', fetchFn: g.f, espera: g.espera, esperas: [1], log: () => {} }) } catch (e) { msg = e.message }
    ok('R6-P-02 si el último intento es un corte de red después de un 403, el error no pierde el 403', /fetch failed/.test(msg) && /antes respondió HTTP 403/.test(msg), msg);
  }

  // ---------- P-03: precios viejos y sin SEPA nuevo → la tarea falla ----------
  const real = JSON.parse(readFileSync(join(RAIZ, 'datos/precios.json'), 'utf8')), fechaSepa = real.sepa.fecha;
  const mas = (f, d) => new Date(Date.parse(f) + d * 864e5).toISOString().slice(0, 10);
  ok('R6-P-03 controlarFrescura: sin SEPA nuevo falla con más de 10 días, con 10 o menos no, y con SEPA nuevo nunca', MAX_DIAS_SIN_SEPA === 10 && diasEntre(fechaSepa, mas(fechaSepa, 11)) === 11
    && /hace 11 días/.test(controlarFrescura({ previo: real, sepa: null, hoy: mas(fechaSepa, 11), errores: ['SEPA: HTTP 403 al pedir el paquete de SEPA'] }) || '')
    && controlarFrescura({ previo: real, sepa: null, hoy: mas(fechaSepa, 10) }) === null && controlarFrescura({ previo: real, sepa: { fecha: mas(fechaSepa, 20) }, hoy: mas(fechaSepa, 30) }) === null);
  const previoViejo = join(dir, 'previo.json'); writeFileSync(previoViejo, JSON.stringify(real) + '\n');
  const roto = join(dir, 'no-es-zip.zip'); writeFileSync(roto, 'esto no es un zip, solo texto '.repeat(10));
  const salida = join(dir, 'salida-vieja.json');
  const correr = (hoy, extra = []) => spawnSync(process.execPath, [join(RAIZ, 'herramientas/actualizar-precios.mjs'), '--previo', previoViejo, '--indec-json', previoViejo, '--archivo-sepa', roto, '--salida', salida, '--hoy', hoy, ...extra], { encoding: 'utf8' });
  const antes = readFileSync(previoViejo, 'utf8'), repoAntes = readFileSync(join(RAIZ, 'datos/precios.json'), 'utf8');
  const vieja = correr(mas(fechaSepa, 11)), salidaVieja = (vieja.stdout || '') + (vieja.stderr || '');
  ok('R6-P-03 con SEPA caído y precios de hace 11 días la herramienta termina en falla (código 1), lo dice, y no escribe nada ni toca datos/precios.json', vieja.status === 1 && /hace 11 días/.test(salidaVieja) && /datos\/precios\.json queda como estaba/.test(salidaVieja)
    && !existsSync(salida) && readFileSync(previoViejo, 'utf8') === antes && readFileSync(join(RAIZ, 'datos/precios.json'), 'utf8') === repoAntes, salidaVieja.trim().slice(0, 220));
  const fresca = correr(mas(fechaSepa, 3));
  ok('R6-P-03 con SEPA caído pero precios de hace 3 días la tarea sigue como antes: avisa y conserva lo anterior (código 0)', fresca.status === 0 && /Aviso, se conserva lo anterior: SEPA/.test(fresca.stderr || ''), ((fresca.stdout || '') + (fresca.stderr || '')).trim().slice(0, 220));
  const sinSalida = spawnSync(process.execPath, [join(RAIZ, 'herramientas/actualizar-precios.mjs'), '--previo', previoViejo, '--indec-json', previoViejo, '--archivo-sepa', roto, '--hoy', mas(fechaSepa, 3)], { encoding: 'utf8' });
  const previoInexistente = spawnSync(process.execPath, [join(RAIZ, 'herramientas/actualizar-precios.mjs'), '--previo', join(dir, 'no-existe.json'), '--indec-json', previoViejo, '--archivo-sepa', roto, '--salida', salida, '--hoy', mas(fechaSepa, 3)], { encoding: 'utf8' });
  ok('R6-P-03 --previo y --indec-json (de prueba) exigen --salida y un --previo ilegible falla: nunca caen sobre datos/precios.json', sinSalida.status === 1 && /con --salida/.test(sinSalida.stderr) && previoInexistente.status === 1 && !existsSync(salida) && readFileSync(join(RAIZ, 'datos/precios.json'), 'utf8') === repoAntes);
  const soloIndec = correr(mas(fechaSepa, 40), ['--solo-indec']);
  ok('R6-P-03 con --solo-indec (no se pidió SEPA) la antigüedad de SEPA no hace fallar la tarea', soloIndec.status === 0, ((soloIndec.stdout || '') + (soloIndec.stderr || '')).trim().slice(0, 220));
} finally { rmSync(dir, { recursive: true, force: true }) }

if (!corridas) { console.log(`FALLA no hay ninguna prueba que empiece con "${filtro} "`); process.exit(1) }
console.log(fallas ? `\n${fallas} falla(s) de ${corridas}` : `\n${corridas} pruebas en verde`);
process.exit(fallas ? 1 : 0);
