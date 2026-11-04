// E23: Etapa 23 de la Ronda 3 ("Catálogo y lista prolijos"). Controles E23-titulo, E23-envases, E23-equivalencias y E23-compartir
// de docs/validacion/criterios.json. Usan el datos/precios.json REAL y datos inventados.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null;
  const abrir = async () => {
    if (marco) marco.remove();
    marco = document.createElement("iframe"); marco.id = "marcoPrueba";
    marco.style.cssText = "position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1";
    document.body.append(marco);
    await new Promise((res, rej) => { marco.onload = res; marco.onerror = rej; marco.src = "/index.html?marco=" + Date.now() });
    await espera(500);
    w = marco.contentWindow; w.confirm = () => true; w.prompt = () => "";
  };
  const ev = x => w.eval(x), doc = () => w.document;
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });

  // E23-titulo: todo lo que nombra el título de cada idea está vinculado en sus ingredientes.
  cargar({ ...MARCA }); await abrir();
  // Palabras del título que no son ingredientes (preparaciones, platos, formas de cocción y genéricos).
  const NO_INGREDIENTE = ["tarta", "wrap", "tacos", "taco", "risotto", "guiso", "ensalada", "sopa", "milanesa", "milanesas", "hamburguesa", "bowl", "pastel", "cazuela", "omelette", "sandwich", "sándwich", "pizza", "fideos", "ñoquis", "noquis", "filet", "bife", "pesto", "salsa", "aderezo", "puré", "pure", "revuelto", "tortilla", "crema", "verduras", "vegetales", "hojas", "verdes", "mixta", "completa", "tibia", "casera", "integral", "integrales", "magra", "caliente", "especiados", "crudas", "salteadas", "grillado", "grillada", "horno", "plancha", "vapor", "curry", "pescado", "rellena", "cherry", "oliva", "gallina", "basmati", "morado", "hummus", "albóndigas", "albondigas"];
  const r = JSON.parse(ev(`(() => { const NO = ${JSON.stringify(NO_INGREDIENTE)}.map(normalizeSearchText), faltan = [];
    const STOP = new Set(["con","de","del","la","el","los","las","y","e","o","al","en","un","una","por","a"]);
    for (const idea of data.menuCatalog) {
      const lista = ideaIngredientes(idea), clavesVinc = new Set(lista.map(ingredientKey)), items = new Set(lista.map(n => (nutritionFor(n) || {}).n).filter(Boolean));
      const palabras = normalizeSearchText(idea.text).replace(/cebolla de verdeo/g, "verdeo").replace(/[^a-zñ ]+/g, " ").split(/\\s+/).filter(p => p.length >= 3 && !STOP.has(p) && !NO.includes(p));
      for (const p of palabras) {
        const nut = nutritionFor(p), k = ingredientKey(p);
        if (!nut && !clavesVinc.has(k)) continue;
        const EQUIV = { calabaza: "zapallo" };
        const ok = clavesVinc.has(k) || (nut && items.has(nut.n)) || lista.some(n => ingredientKey(n) === k || normalizeSearchText(n).startsWith(p) || normalizeSearchText(n).startsWith(EQUIV[p] || "\u0000"));
        if (!ok) faltan.push(idea.text.slice(0, 50) + " → " + p);
      }
    }
    return JSON.stringify({ n: data.menuCatalog.length, faltan }) })()`));
  ok("E23-titulo cada idea tiene vinculado todo lo que nombra su título (las 41 ideas)", r.n === 41 && !r.faltan.length, JSON.stringify(r));

  // E23-envases: ningún producto de la lista queda en cucharadas, cucharaditas ni tazas; las verduras tienen porciones comunes.
  cargar({ ...MARCA, ...PRES(80000) }); await abrir();
  ev('ArmameSemana.aplicar(ArmameSemana.armar({ modo: "todo" }))'); await espera(250);
  const unidades = JSON.parse(ev(`JSON.stringify(shoppingDisplayItems().map(x => ({ n: x.name, u: [...x.units.keys()], t: x.text })))`));
  const enCuchara = unidades.filter(x => x.u.some(u => ["cucharada", "cucharadita", "taza"].includes(u)));
  const textoCuchara = unidades.filter(x => /cucharad|taza/i.test(x.t));
  const verd = JSON.parse(ev(`JSON.stringify((() => { const l = cantidadesDePlatoArmado({ state: { type: "plato", day: "Día libre", verduras: [{ name: "Lechuga" }, { name: "Tomate" }, { name: "Zanahoria" }], almidones: [], proteinas: [], legCarb: [], legProt: [] } }); return l.map(x => x.name + " " + x.q + " " + x.unit) })())`));
  const conv = JSON.parse(ev(`JSON.stringify([unidadParaCompra("Avena", 16, "cucharada"), unidadParaCompra("Frutillas", 3, "taza"), unidadParaCompra("Semillas de chía", 5, "cucharadita"), unidadParaCompra("Leche", 1, "taza")])`));
  ok("E23-envases ningún producto de la lista queda en cucharadas o tazas (pasan a gramos y al envase típico) y las verduras tienen porciones comunes (lechuga 80 g, tomate 100 g)",
    unidades.length >= 15 && !enCuchara.length && !textoCuchara.length && verd.includes("Lechuga 80 g") && verd.includes("Tomate 100 g") && conv[0].unit === "g" && conv[1].unit === "g" && conv[2].unit === "g" && conv[3].unit === "ml",
    JSON.stringify({ n: unidades.length, enCuchara: enCuchara.map(x => x.n), verd, conv }));

  // E23-equivalencias: solo variantes de nombre del mismo ingrediente.
  const sug = JSON.parse(ev(`JSON.stringify(ingredientAliasSuggestions(["Queso Port Salut descremado", "Queso cremoso", "Queso rallado", "Arroz", "Arroz (integral, yamaní)", "Yogur natural descremado", "Yogur griego", "Papa", "Papas"]))`));
  const pares = sug.map(p => p.join(" = "));
  ok("E23-equivalencias no se sugiere unir quesos distintos (ni yogures distintos), solo variantes de nombre del mismo ingrediente",
    !pares.some(p => /queso/i.test(p)) && !pares.some(p => /griego/i.test(p)) && pares.some(p => /Arroz \(integral, yamaní\) = Arroz/.test(p)), JSON.stringify(pares));

  // E23-compartir: texto para WhatsApp con secciones, cantidades, ≈ precio por producto y el total.
  const texto = ev("Compras.comprasText()");
  const filas = texto.split("\n").filter(l => l.startsWith("• ")), conPrecio = filas.filter(l => /≈ \$[\d.]+$/.test(l) || /estimado ≈ \$[\d.]+$/.test(l));
  const totalTxt = /\*Total ≈ \$([\d.]+)\*/.exec(texto), total = totalTxt ? Number(totalTxt[1].replace(/\./g, "")) : null;
  ev('openTab("compras")'); await espera(250);
  const boton = doc().querySelector("[data-compras-compartir]");
  let compartido = null;
  w.navigator.share = t => { compartido = t; return Promise.resolve() };
  if (boton) boton.click(); await espera(150);
  ok("E23-compartir Compartir lista arma un texto por sección del súper, con cantidades, ≈ precio por producto y el total de la semana, con un botón en Compras",
    /^🛒 Lista de compras/.test(texto) && /\*VERDULERÍA\*/.test(texto) && filas.length >= 15 && conPrecio.length >= filas.length - 3 && total > 0 && total === Math.round(ev("costoSemanaPlan().total")) && !!boton && !!compartido && compartido.text.includes("*Total ≈ $"),
    JSON.stringify({ filas: filas.length, conPrecio: conPrecio.length, total, boton: !!boton, ejemplo: filas.slice(0, 3), final: texto.split("\n").slice(-2) }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
