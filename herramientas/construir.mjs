// Construye la app publicable (index.html y sw.js) a partir de las partes de fuente/.
// Uso:
//   node herramientas/construir.mjs                 → escribe index.html y sw.js
//   node herramientas/construir.mjs --verificar     → solo comprueba que index.html y sw.js estén al día
//   node herramientas/construir.mjs --salida <dir> [--version X]  → escribe en otra carpeta (pruebas)
// Sin dependencias: requiere Node 18 o superior.
import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
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

let html = await leer('fuente/plantilla.html');
html = unaVez(html, '{{ESTILOS}}', (await leer('fuente/estilos.css')).replace(/\n+$/, ''));
html = unaVez(html, '{{CUERPO}}', cuerpo);
html = unaVez(html, '{{CODIGO}}', unaVez(codigo, '__DATOS_NUTRICION__', datos));
html = unaVez(html, '{{VERSION}}', version);
const sw = unaVez(await leer('fuente/sw.js'), '{{VERSION}}', version);

// Controles: el código tiene que compilar y no pueden quedar marcas sin reemplazar.
const script = html.slice(html.indexOf('<script>') + 8, html.lastIndexOf('</script>'));
new vm.Script(script, { filename: 'index.html' });
new vm.Script(sw, { filename: 'sw.js' });
if (/\{\{[A-Z]+\}\}|__DATOS_NUTRICION__/.test(html)) throw new Error('Quedaron marcas sin reemplazar en index.html');

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
