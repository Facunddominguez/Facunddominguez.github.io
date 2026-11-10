// R4-26: Etapa 26 de la Ronda 4 ("Lista para el súper"). Controles R4-26-fila, R4-26-ficha, R4-26-casilla, R4-26-cantidades,
// R4-26-equivalencia y R4-26-compartir de docs/validacion/criterios.json (R4-26-alto lo mide capturas.mjs). Datos inventados.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null;
  const abrir = async ancho => {
    if (marco) marco.remove();
    marco = document.createElement("iframe"); marco.id = "marcoPrueba";
    marco.style.cssText = `position:fixed;left:0;top:0;width:${ancho || 390}px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1`;
    document.body.append(marco);
    await new Promise((res, rej) => { marco.onload = res; marco.onerror = rej; marco.src = "/index.html?marco=" + Date.now() });
    await espera(500);
    w = marco.contentWindow; w.confirm = () => true; w.prompt = () => "";
  };
  const ev = x => w.eval(x), doc = () => w.document;
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });
  const tocar = async el => { el.click(); await espera(220) };
  const filas = () => [...doc().querySelectorAll("#comprasList .compras-seccion .shop-item")];
  const fila = k => doc().querySelector(`#comprasList [data-shop-key="${k}"]`);
  const armarYIr = async () => { ev(`ArmameSemana.aplicar(ArmameSemana.armar({ modo: "todo" }))`); await espera(300); ev('openTab("compras")'); await espera(300) };

  // R4-26-fila y R4-26-ficha
  cargar({ ...MARCA, ...PRES(90000) }); await abrir(390); await armarYIr();
  const primera = filas()[0], clave = primera.querySelector("input").dataset.shopKey, nombre = primera.querySelector(".shop-item__ficha").dataset.fichaIngrediente;
  const pasos = [];
  const estado = () => !!fila(clave).checked;
  pasos.push(estado());
  await tocar(fila(clave).closest(".shop-item").querySelector("label")); pasos.push(estado());   // el nombre y el precio están dentro del texto
  await tocar(fila(clave).closest(".shop-item")); pasos.push(estado());                          // el espacio libre de la fila
  await tocar(fila(clave).closest(".shop-item").querySelector("label")); pasos.push(estado());
  await tocar(fila(clave).closest(".shop-item")); pasos.push(estado());
  const sinHoja = !ev("hoja.abierta()"), sinBotones = !doc().querySelector("#comprasList .shop-item__nombre, #comprasList .precio-tap");
  ok("R4-26-fila un toque en el nombre, en el precio o en el espacio libre de la fila la tacha, otro la destacha, y ninguno abre una hoja",
    JSON.stringify(pasos) === "[false,true,false,true,false]" && sinHoja && sinBotones, JSON.stringify({ pasos, sinHoja, sinBotones }));
  const antes = estado();
  await tocar(fila(clave).closest(".shop-item").querySelector(".shop-item__ficha"));
  const hojaAbierta = ev("hoja.abierta()"), titulo = (doc().querySelector(".hoja__titulo") || { textContent: "" }).textContent, aria = fila(clave).closest(".shop-item").querySelector(".shop-item__ficha").getAttribute("aria-label");
  const despues = estado(); ev("hoja.cerrar()"); await espera(100);
  ok("R4-26-ficha un toque en ⓘ abre la ficha del producto (nutrientes y precio) y no tacha",
    hojaAbierta && titulo.startsWith(nombre.split(" ")[0]) && antes === despues && aria === "Ficha de " + nombre + ": nutrientes y precio", JSON.stringify({ hojaAbierta, titulo, nombre, antes, despues, aria }));

  // R4-26-casilla: a 390 y a 320 px, casillas de 24×24 px y filas de 48 px o más.
  const medidas = {};
  for (const ancho of [390, 320]) {
    cargar({ ...MARCA, ...PRES(90000) }); await abrir(ancho); await armarYIr();
    doc().querySelectorAll("#comprasList details").forEach(d => d.open = true); await espera(150);
    const f = [...doc().querySelectorAll("#comprasList .shop-item")].filter(r => r.getClientRects().length);
    const chicas = f.filter(r => { const c = r.querySelector("input").getBoundingClientRect(); return Math.abs(c.width - 24) > 0.5 || Math.abs(c.height - 24) > 0.5 });
    const bajas = f.filter(r => r.getBoundingClientRect().height < 47.5);
    const botones = f.filter(r => { const b = r.querySelector(".shop-item__ficha"); if (!b) return false; const x = b.getBoundingClientRect(); return x.width < 43.5 || x.height < 43.5 });
    medidas[ancho] = { filas: f.length, chicas: chicas.length, bajas: bajas.length, botones: botones.length };
  }
  ok("R4-26-casilla a 390 y a 320 px todas las casillas miden 24×24 px, todas las filas 48 px o más y los botones ⓘ 44×44",
    Object.values(medidas).every(m => m.filas >= 15 && !m.chicas && !m.bajas && !m.botones), JSON.stringify(medidas));

  // R4-26-cantidades: los quesos en gramos (nada en "unidades") y las tortillas por paquete.
  cargar({ ...MARCA, ...PRES(90000) }); await abrir(390); await armarYIr();
  const textoQueso = filas().map(r => r.querySelector("label").textContent).filter(t => /queso/i.test(t));
  // Tres comidas con tortillas (2 por persona y por comida: 6 en total, un paquete de 8).
  ev(`(() => {
    const saved = MisPlatos.loadSaved(), base = saved.find(x => x.state && x.state.type === "plato"), plan = loadPlan(), copias = [];
    for (let i = 0; i < 3; i++) { const c = JSON.parse(JSON.stringify(base)); c.id = "tortilla" + i; c.state.almidones = [{ name: "Tortillas de trigo" }]; c.sig = "tortilla|" + i; c.lines = ["Almidones (1/4): Tortillas de trigo"]; copias.push(c) }
    MisPlatos.persistSaved(copias.concat(saved));
    ["lunes", "martes", "miercoles"].forEach((d, i) => { if (plan[d]) plan[d].almuerzo = "tortilla" + i });
    Semana.persistPlan(plan)
  })()`);
  ev('openTab("semana")'); await espera(200); ev('openTab("compras")'); await espera(300);
  const filaTortilla = filas().map(r => r.querySelector("label").textContent).find(t => /^Tortilla/.test(t)) || "";
  ok("R4-26-cantidades ninguna fila de queso está en 'unidades' (con la semana armada hay " + textoQueso.length + ") y las tortillas dicen 'paquete'",
    textoQueso.length >= 1 && !textoQueso.some(t => /unidad/i.test(t) && !/paquete|sachet|pote/i.test(t)) && /paquete de 8 unidades/.test(filaTortilla), JSON.stringify({ textoQueso, filaTortilla }));

  // R4-26-equivalencia: no se sugiere unir cebolla de verdeo con cebolla; siguen tomate perita / tomate y arroz.
  const pares = JSON.parse(ev(`JSON.stringify(ingredientAliasSuggestions(["Cebolla de verdeo", "Cebolla", "Tomate perita", "Tomate", "Arroz (integral, yamaní)", "Arroz"]))`));
  const plano = pares.map(p => p.join(" = "));
  ok("R4-26-equivalencia no aparece la sugerencia de cebolla de verdeo; siguen las de tomate perita y arroz",
    !plano.some(p => /verdeo/i.test(p)) && plano.some(p => /Tomate perita/.test(p)) && plano.some(p => /Arroz/.test(p)), JSON.stringify(plano));

  // R4-26-compartir: el texto compartido usa los mismos nombres que la pantalla.
  cargar({ ...MARCA, ...PRES(90000) }); await abrir(390); await armarYIr();
  let compartido = null;
  Object.defineProperty(w.navigator, "share", { value: t => { compartido = t; return Promise.resolve() }, configurable: true });
  const enPantalla = filas().filter(r => !r.classList.contains("is-done")).map(r => r.querySelector("label").textContent.split(/:| · /)[0].trim());
  await tocar(doc().querySelector("[data-compras-compartir]"));
  const lineasCompartidas = ((compartido && compartido.text) || "").split("\n").filter(l => l.startsWith("• ")).map(l => l.slice(2).split(/:| · /)[0].trim());
  const faltan = enPantalla.filter(n => !lineasCompartidas.includes(n)), sobran = lineasCompartidas.filter(n => !enPantalla.includes(n));
  ok("R4-26-compartir cada producto del texto compartido tiene el mismo nombre que su fila en pantalla",
    enPantalla.length >= 15 && !faltan.length && !sobran.length, JSON.stringify({ enPantalla: enPantalla.length, compartidos: lineasCompartidas.length, faltan, sobran }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
