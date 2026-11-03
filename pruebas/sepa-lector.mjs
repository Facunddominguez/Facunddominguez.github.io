// Prueba (Node, sin red y sin dependencias) del lector de SEPA de herramientas/actualizar-precios.mjs: arma dentro de la prueba
// un ZIP externo con ZIP internos (como el de Precios Claros) y comprueba provincias → regiones, precios por unidad base,
// mediana y percentiles, que lo malo se descarta y que un archivo roto falla sin tocar datos/precios.json.
// Imprime una línea "C9-9 …" por prueba (la compuerta la corre como el control E9-lector-sepa) y sale con 1 si alguna falla.
import { deflateRawSync } from 'node:zlib';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { leerSepa, regionDe, precioBase, componer, validar } from '../herramientas/actualizar-precios.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
let fallas = 0;
const ok = (nombre, cond, det = '') => { console.log((cond ? 'PASA ' : 'FALLA ') + nombre + (det ? ' · ' + det : '')); if (!cond) fallas++ };

// ----- Escritor mínimo de ZIP -----
function zip(entradas) { // [{ nombre, datos: Buffer, comprimir: bool, metodo? }]
  const partes = [], cd = []; let off = 0;
  for (const e of entradas) {
    const nom = Buffer.from(e.nombre), metodo = e.metodo ?? (e.comprimir ? 8 : 0), dat = e.comprimir ? deflateRawSync(e.datos) : e.datos;
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(metodo, 8); h.writeUInt32LE(dat.length, 18); h.writeUInt32LE(e.datos.length, 22); h.writeUInt16LE(nom.length, 26);
    partes.push(h, nom, dat);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(metodo, 10); c.writeUInt32LE(dat.length, 20); c.writeUInt32LE(e.datos.length, 24); c.writeUInt16LE(nom.length, 28); c.writeUInt32LE(off, 42);
    cd.push(c, nom); off += 30 + nom.length + dat.length;
  }
  const cdb = Buffer.concat(cd), fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(entradas.length, 8); fin.writeUInt16LE(entradas.length, 10); fin.writeUInt32LE(cdb.length, 12); fin.writeUInt32LE(off, 16);
  return Buffer.concat([...partes, cdb, fin]);
}
const SUC = 'id_comercio|id_bandera|id_sucursal|sucursales_nombre|sucursales_tipo|sucursales_calle|sucursales_numero|sucursales_latitud|sucursales_longitud|sucursales_observaciones|sucursales_barrio|sucursales_codigo_postal|sucursales_localidad|sucursales_provincia|h1|h2|h3|h4|h5|h6|h7';
const PROD = 'id_comercio|id_bandera|id_sucursal|id_producto|productos_ean|productos_descripcion|productos_cantidad_presentacion|productos_unidad_medida_presentacion|productos_marca|productos_precio_lista|productos_precio_referencia|productos_cantidad_referencia|productos_unidad_medida_referencia|a|b|c|d';
const suc = (com, id, cp, prov) => `${com}|1|${id}|S${id}|Supermercado|Calle|1|0|0||Barrio|${cp}|Loc|${prov}|||||||`;
const prod = (com, sucId, desc, cant, um, pl, pr, cr, ur) => `${com}|1|${sucId}|779${com}${sucId}|1|${desc}|${cant}|${um}||${pl}|${pr}|${cr}|${ur}||||`;
// Un comercio: sucursales (GBA por CABA, GBA por código postal 1700, Pampeana por código postal 7000) y productos.
function comercio(com, precios) {
  const sucs = [suc(com, 1, 'C1073AAQ', 'AR-C'), suc(com, 2, '1700', 'AR-B'), suc(com, 3, '7000', 'AR-B')];
  const filas = [];
  precios.forEach((p, i) => filas.push(prod(com, 1 + (i % 2), 'ZANAHORIA ELEGIDA', '1.00', i % 2 ? 'kg' : 'kgm', p, p, '1.00', 'kg')));
  filas.push(prod(com, 1, 'ZANAHORIA BOLSITA', '400', 'gr', 2400, 6000, '400', 'grm')); // bolsita: tamaño fuera de rango
  filas.push(prod(com, 1, 'BRONCEADOR C ZANAHORIA SPRAY', '1', 'uni', 9000, 9000, '1', 'uni')); // no empieza con la frase
  filas.push(prod(com, 1, 'ZANAHORIA ELEGIDA', '1.00', 'kg', 3000, 3000000, '1.00', 'kg')); // referencia 1.000 veces mayor
  filas.push('1|1|1|x|1|ZANAHORIA|1.00|kg'); // otra cantidad de campos
  filas.push(prod(com, 3, 'ZANAHORIA ELEGIDA', '1.00', 'kg', 5000, 5000, '1.00', 'kg')); // Pampeana (un solo comercio)
  for (let i = 0; i < 4; i++) filas.push(prod(com, 1 + (i % 2), 'HUEVOS BLANCOS', '12', 'uni', 4800, 400, '1', 'uni'));
  return zip([
    { nombre: 'comercio.csv', datos: Buffer.from('id_comercio|id_bandera\n' + com + '|1\n'), comprimir: true },
    { nombre: 'sucursales.csv', datos: Buffer.from('﻿' + [SUC, ...sucs].join('\r\n') + '\r\n'), comprimir: true },
    { nombre: 'productos.csv', datos: Buffer.from([PROD, ...filas].join('\n') + '\n'), comprimir: true },
  ]);
}
const MAPA = { sepaExcluir: ['bronceador'], items: [
  { n: 'Zanahoria', b: 'kg', sepa: { q: ['zanahoria'], ini: true, x: ['lata'], t: [0.9, 6] } },
  { n: 'Huevo', b: 'unidad', sepa: { q: ['huevos', 'huevo'], ini: true } },
] };
const dir = mkdtempSync(join(tmpdir(), 'prueba-sepa-'));
try {
  // GBA: tres comercios con 5 precios cada uno (CABA y código postal 1700); Pampeana: solo un comercio.
  const precios = [2000, 2800, 3000, 3000, 4000];
  const conCarpeta = zip([{ nombre: '2026-11-02/', datos: Buffer.alloc(0) }, ...[1, 2, 3].map(c => ({ nombre: `2026-11-02/sepa_1_comercio-sepa-${c}_2026-11-02_09-05-10.zip`, datos: comercio(c, precios) }))]);
  const archivo = join(dir, 'sepa.zip'); writeFileSync(archivo, conCarpeta);

  ok('C9-9 provincias a regiones (GBA = CABA + Buenos Aires con código postal 1600 a 1899, resto de Buenos Aires = Pampeana)',
    regionDe('AR-C', 'C1073AAQ') === 'GBA' && regionDe('AR-B', '1641') === 'GBA' && regionDe('AR-B', 'B1636') === 'GBA' && regionDe('AR-B', '7000') === 'Pampeana' && regionDe('Buenos Aires', '1700') === 'GBA'
    && regionDe('AR-X', '') === 'Pampeana' && regionDe('AR-M', '') === 'Cuyo' && regionDe('AR-Y', '') === 'Noroeste' && regionDe('AR-W', '') === 'Noreste' && regionDe('AR-U', '') === 'Patagonia' && regionDe('', '') === null);

  const fila = (cant, um, pl, pr, cr, ur) => ['1', '1', '1', 'x', '1', 'D', cant, um, '', pl, pr, cr, ur];
  ok('C9-9 el precio por unidad base se calcula con tamaño y referencia y se descarta si no coinciden',
    Math.abs(precioBase('kg', fila('500', 'gr', '2200', '4400', '1', 'kg')) - 4400) < 0.01 && Math.abs(precioBase('kg', fila('1', 'uni', '2450', '4900', '500', 'grm')) - 4900) < 0.01
    && precioBase('kg', fila('1.00', 'gr', '2135', '2135000', '1.00', 'kg')) === 2135000 /* coherente pero absurdo: lo saca el filtro de la mediana */ && precioBase('kg', fila('1', 'kg', '3000', '3000000', '1', 'kg')) === 3000
    && Math.abs(precioBase('unidad', fila('12', 'uni', '4800', '400', '1', 'uni')) - 400) < 0.01 && precioBase('kg', fila('1', 'kg', '0', '0', '1', 'kg')) === null && precioBase('unidad', fila('1', 'kg', '3000', '3000', '1', 'kg')) === null);

  const r = await leerSepa(archivo, MAPA);
  const z = r.items.get('Zanahoria'), gba = z && z.get('GBA'), pamp = z && z.get('Pampeana'), huevo = r.items.get('Huevo');
  ok('C9-9 el lector lee el ZIP de ZIP: fecha, mediana y percentiles por región, y solo publica con 10 observaciones y 3 comercios',
    r.fecha === '2026-11-02' && gba && gba.med === 3000 && gba.p25 === 2800 && gba.p75 === 3000 && gba.n === 18 && gba.com === 3 && !pamp
    && huevo && huevo.get('GBA') && Math.abs(huevo.get('GBA').med - 400) < 0.01,
    gba ? JSON.stringify(gba) : 'sin GBA');
  ok('C9-9 el lector descarta la bolsita fuera de tamaño y la línea con otra cantidad de campos, no confunde el bronceador y acepta el precio coherente aunque la referencia venga 1.000 veces mayor',
    r.cuentas.sinCampos === 3 && r.cuentas.tamano === 3 && r.cuentas.comercios === 3 && r.cuentas.filas > 0, JSON.stringify({ ...r.cuentas, pocos: undefined }));

  // El resultado se arma y se valida como en la tarea: SEPA solo, sin tocar INDEC.
  const previo = JSON.parse(readFileSync(join(RAIZ, 'datos/precios-ejemplo.json'), 'utf8'));
  const { datos } = componer({ previo, indec: null, sepa: { ...r, recurso: 'prueba', cuentas: r.cuentas }, mapa: { items: [{ n: 'Arroz', b: 'kg' }, { n: 'Pollo', b: 'kg' }, ...MAPA.items] }, hoy: '2026-11-03' });
  const zan = datos.items.find(i => i.n === 'Zanahoria');
  ok('C9-9 componer junta SEPA con lo de INDEC guardado y el resultado pasa las comprobaciones',
    zan && zan.s.GBA === 3000 && zan.r.GBA[0] === 2800 && zan.c.GBA[1] === 3 && validar(datos, { catalogo: new Set(['Arroz', 'Pollo', 'Zanahoria', 'Huevo']), hoy: '2026-11-03' }).length === 0, JSON.stringify(zan));

  // Archivos rotos: fallan y no tocan datos/precios.json.
  const huella = () => createHash('sha256').update(readFileSync(join(RAIZ, 'datos/precios.json'))).digest('hex');
  const antes = huella();
  const roto = join(dir, 'roto.zip'); writeFileSync(roto, conCarpeta.subarray(0, conCarpeta.length - 40));
  const noZip = join(dir, 'texto.zip'); writeFileSync(noZip, 'esto no es un zip, solo texto '.repeat(10));
  const raro = join(dir, 'metodo.zip'); writeFileSync(raro, zip([{ nombre: 'x.zip', datos: Buffer.from('abc'), metodo: 99 }]));
  const falla = async f => { try { await leerSepa(f, MAPA); return false } catch { return true } };
  ok('C9-9 un ZIP cortado, un archivo que no es ZIP y un método de compresión raro fallan', await falla(roto) && await falla(noZip) && await falla(raro));
  const cli = spawnSync(process.execPath, [join(RAIZ, 'herramientas/actualizar-precios.mjs'), '--solo-sepa', '--archivo-sepa', roto, '--salida', join(dir, 'salida.json')], { encoding: 'utf8' });
  const cli2 = spawnSync(process.execPath, [join(RAIZ, 'herramientas/actualizar-precios.mjs'), '--solo-sepa', '--archivo-sepa', archivo, '--hoy', '2026-11-03', '--salida', join(dir, 'salida2.json')], { encoding: 'utf8' });
  ok('C9-9 la herramienta con un archivo roto o con muy poca cobertura sale con error y deja datos/precios.json igual',
    cli.status === 1 && cli2.status === 1 && huella() === antes && /cobertura|No se actualizaron/.test(cli.stderr + cli2.stderr), (cli2.stderr || '').split('\n')[0]);
} finally { rmSync(dir, { recursive: true, force: true }) }
process.exit(fallas ? 1 : 0);
