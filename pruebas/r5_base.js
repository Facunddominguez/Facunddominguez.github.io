// Ayudas de las pruebas de la Ronda 5 (Etapas 33 a 44). run_all.js lo carga antes de las baterías: define window.R5H.
// Uso en una batería: const H = R5H(); ...; await H.abrir({ ...H.MARCA }); H.ok("R5-S-11 …", condición, detalle); return H.terminar();
// Las pruebas de la Ronda 5 miran lo que se ve en la pantalla (texto visible, botones que existen o no, cantidad de <details>,
// datos que se guardan), no el código. Cada nombre de prueba empieza con el código del ítem (R5-S-11) y un espacio.
window.R5H = (ancho0 = 390) => {
  const T = [];
  const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null, ancho = ancho0;
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });
  const HOGAR = n => ({ miPlatoFacil_hogar_v1: JSON.stringify({ personas: n }) });
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos || {})) if (v !== null) localStorage.setItem(k, v) };
  // Abre la app en un marco con esos datos (el almacenamiento es el de la página de pruebas: se borra antes).
  const abrir = async (datos, opciones = {}) => {
    if (opciones.ancho) ancho = opciones.ancho;
    cargar(datos);
    if (marco) marco.remove();
    marco = document.createElement("iframe"); marco.id = "marcoPrueba";
    marco.style.cssText = `position:fixed;left:0;top:0;width:${ancho}px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1`;
    document.body.append(marco);
    await new Promise((res, rej) => { marco.onload = res; marco.onerror = rej; marco.src = "/index.html?marco=" + Date.now() });
    await espera(500);
    w = marco.contentWindow; w.confirm = () => true; w.prompt = () => opciones.prompt !== undefined ? opciones.prompt : "";
    return w;
  };
  const ev = x => w.eval(x), doc = () => w.document;
  const visible = e => { if (!e || !e.getClientRects().length) return false; if (e.checkVisibility && !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false; return true };
  const tocar = async (el, ms = 250) => { if (!el) throw new Error("no hay elemento para tocar"); el.click(); await espera(ms) };
  const texto = id => (doc().getElementById(id) || { innerText: "" }).innerText;
  // Botones visibles (en toda la página o dentro de `raiz`) cuyo texto coincide.
  const botones = (re, raiz) => [...(raiz || doc()).querySelectorAll("button,a[href],summary,[role=button]")].filter(b => visible(b) && re.test(b.textContent.trim().replace(/\s+/g, " ")));
  const boton = (re, raiz) => botones(re, raiz)[0] || null;
  const hoja = () => doc().querySelector(".hoja");
  const textoHoja = () => { const h = hoja(); return h && visible(h) ? h.innerText : "" };
  const botonesHoja = () => [...(hoja() ? hoja().querySelectorAll("button") : [])].filter(visible).map(b => b.textContent.trim().replace(/\s+/g, " "));
  const cerrarHoja = async () => { try { ev("hoja.cerrar()") } catch (e) { } await espera(150) };
  // Desplegables visibles: <details> y [aria-expanded] que no sean un menú. `excepciones` son selectores permitidos.
  const desplegables = (raiz, excepciones = []) => [...(raiz || doc()).querySelectorAll("details")].filter(d => visible(d) && !excepciones.some(s => d.matches(s)));
  const ir = async (js, ms = 300) => { ev(js); await espera(ms) };
  const armar = async modo => { ev('openTab("semana")'); await espera(200); ev(`ArmameSemana.correr(${JSON.stringify(modo || "todo")})`); await espera(500) };
  // Distancia vertical (px) entre dos elementos (el borde de abajo de a y el de arriba de b), o null.
  const separacion = (a, b) => (a && b) ? Math.round((b.getBoundingClientRect().top - a.getBoundingClientRect().bottom) * 10) / 10 : null;
  // Separación horizontal mínima entre elementos consecutivos de una fila.
  const huecoHorizontal = els => { const r = els.map(e => e.getBoundingClientRect()).sort((p, q) => p.left - q.left); let m = Infinity; for (let i = 1; i < r.length; i++) m = Math.min(m, r[i].left - r[i - 1].right); return Math.round(m * 10) / 10 };
  const seSuperponen = els => { const r = els.map(e => e.getBoundingClientRect()); for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { const a = r[i], b = r[j]; if (a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5) return true } return false };
  const terminar = () => { if (marco) marco.remove(); marco = null; localStorage.clear(); return T };
  return { T, ok, espera, MARCA, PRES, HOGAR, cargar, abrir, ev, doc, w: () => w, visible, tocar, texto, botones, boton, hoja, textoHoja, botonesHoja, cerrarHoja, desplegables, ir, armar, separacion, huecoHorizontal, seSuperponen, terminar };
};
