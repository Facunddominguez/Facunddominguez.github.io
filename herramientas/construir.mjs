// Construye la app publicable (index.html y sw.js) a partir de las partes de fuente/.
// Uso:
//   node herramientas/construir.mjs                 → escribe index.html y sw.js
//   node herramientas/construir.mjs --verificar     → solo comprueba que index.html y sw.js estén al día
//   node herramientas/construir.mjs --salida <dir> [--version X] [--precios <archivo>]  → escribe en otra carpeta (pruebas);
//     --precios usa otro archivo de precios en vez de datos/precios.json (pruebas y capturas, con precios congelados)
//   Topes de tamaño: index.html 1.100.000 bytes y 300.000 con gzip; datos/precios.json 80.000. --tope-html y --tope-gzip
//     solo pueden bajarlos (las pruebas los usan para comprobar que la construcción falla).
// Sin dependencias: requiere Node 18 o superior.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2), arg = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null };
const leer = rel => readFile(join(RAIZ, rel), 'utf8');
const listar = async dir => (await readdir(join(RAIZ, dir))).filter(f => !f.startsWith('.')).sort();
const unaVez = (texto, marca, valor) => {
  const partes = texto.split(marca);
  if (partes.length !== 2) throw new Error(`La marca ${marca} debe aparecer exactamente una vez (aparece ${partes.length - 1}).`);
  return partes[0] + valor + partes[1];
};

const version = arg('--version') || JSON.parse(await leer('fuente/version.json')).version;
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Versión inválida: ' + version);

// Cuerpo: encabezado, una parte por pantalla (en orden) y cierre.
const partesCuerpo = ['fuente/cuerpo/inicio.html', ...(await listar('fuente/cuerpo/pantallas')).map(f => 'fuente/cuerpo/pantallas/' + f), 'fuente/cuerpo/final.html'];
const cuerpo = (await Promise.all(partesCuerpo.map(leer))).map(t => t.replace(/\n+$/, '')).join('\n');

// Código: los archivos se concatenan en orden alfabético (el prefijo numérico define el orden de arranque).
const codigo = (await Promise.all((await listar('fuente/codigo')).map(f => leer('fuente/codigo/' + f)))).map(t => t.replace(/\n+$/, '')).join('\n');

// Datos de nutrición incluidos en la app (así funciona sin conexión y como archivo local).
const datos = JSON.stringify(JSON.parse(await leer('datos/nutricion.json')))
  .replace(/<\//g, '<\\/').split('\u2028').join('\\u2028').split('\u2029').join('\\u2029');

// Precios de INDEC incluidos en la app (misma idea que la nutrición).
const archivoPrecios = arg('--precios') ? await readFile(resolve(arg('--precios')), 'utf8') : await leer('datos/precios.json');
const datosPrecios = JSON.stringify(JSON.parse(archivoPrecios))
  .replace(/<\//g, '<\\/').split('\u2028').join('\\u2028').split('\u2029').join('\\u2029');

// Envases típicos, básicos de alacena y gramajes por defecto (Ronda 2, Etapa 12).
const datosEnvases = JSON.stringify(JSON.parse(await leer('datos/envases.json')))
  .replace(/<\//g, '<\\/').split('\u2028').join('\\u2028').split('\u2029').join('\\u2029');

if (Buffer.byteLength(datosPrecios) > 80000) throw new Error('datos/precios.json pesa más de 80.000 bytes: ' + Buffer.byteLength(datosPrecios));

let html = await leer('fuente/plantilla.html');
html = unaVez(html, '{{ESTILOS}}', (await leer('fuente/estilos.css')).replace(/\n+$/, ''));
html = unaVez(html, '{{CUERPO}}', cuerpo);
html = unaVez(html, '{{CODIGO}}', unaVez(unaVez(unaVez(codigo, '__DATOS_NUTRICION__', datos), '__DATOS_PRECIOS__', datosPrecios), '__DATOS_ENVASES__', datosEnvases));
html = unaVez(html, '{{VERSION}}', version);
const sw = unaVez(await leer('fuente/sw.js'), '{{VERSION}}', version);

// Controles: el código tiene que compilar y no pueden quedar marcas sin reemplazar.
const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
new vm.Script(script, { filename: 'index.html' });
new vm.Script(sw, { filename: 'sw.js' });
if (/\{\{[A-Z]+\}\}|__DATOS_NUTRICION__|__DATOS_PRECIOS__|__DATOS_ENVASES__/.test(html)) throw new Error('Quedaron marcas sin reemplazar en index.html');

const topeHtml = Math.min(1100000, Number(arg('--tope-html')) || 1100000), topeGzip = Math.min(300000, Number(arg('--tope-gzip')) || 300000);
if (Buffer.byteLength(html) > topeHtml) throw new Error(`index.html pesa más de ${topeHtml.toLocaleString('es-AR')} bytes: ${Buffer.byteLength(html)}`);
const pesoGzip = gzipSync(html).length;
if (pesoGzip > topeGzip) throw new Error(`index.html pesa más de ${topeGzip.toLocaleString('es-AR')} bytes con gzip: ${pesoGzip}`);

const salidas = { 'index.html': html, 'sw.js': sw };
if (args.includes('--verificar')) {
  let ok = true;
  for (const [archivo, contenido] of Object.entries(salidas)) {
    const actual = await readFile(join(RAIZ, archivo), 'utf8').catch(() => null);
    if (actual !== contenido) { console.error(`✗ ${archivo} no está al día con fuente/. Corré: node herramientas/construir.mjs`); ok = false }
  }
  if (ok) console.log(`✓ index.html y sw.js al día (versión ${version})`);
  process.exit(ok ? 0 : 1);
}
const destino = arg('--salida') || RAIZ;
await mkdir(destino, { recursive: true });
for (const [archivo, contenido] of Object.entries(salidas)) await writeFile(join(destino, archivo), contenido);
console.log(`✓ versión ${version}: index.html (${Buffer.byteLength(html)} bytes) y sw.js en ${destino}`);
