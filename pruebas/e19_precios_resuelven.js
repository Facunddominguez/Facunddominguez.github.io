// E19: Etapa 19 de la Ronda 3 ("Que cada ingrediente encuentre su precio"). Controles E19-cobertura, E19-doce y E19-plausibilidad
// de docs/validacion/criterios.json. Usan el datos/precios.json REAL incrustado y datos inventados.
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
  const ev = x => w.eval(x);
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });

  // Semana armada de la prueba: presupuesto de $60.000, como en el recorrido que originó la ronda.
  cargar({ ...MARCA, ...PRES(60000) }); await abrir();
  ev(`ArmameSemana.aplicar(ArmameSemana.armar({ modo: "todo" }))`); await espera(300);
  const lista = JSON.parse(ev(`JSON.stringify(shoppingDisplayItems().filter(x => x.group === "pendiente").map(x => ({ n: x.name, p: !!(preciosDeLaLista([x]) && preciosDeLaLista([x]).porClave.size) })))`));
  const sin = lista.filter(x => !x.p).map(x => x.n), pct = lista.length ? (lista.length - sin.length) / lista.length : 0;
  // E19-cobertura: 90 % o más de los productos con precio real. Los anotados "sin dato" (datos/precios-sin-dato.json) no se cuentan como falla.
  const notas = await (await fetch("/datos/precios-notas.json")).json(), sinDato = notas.sinDato.map(x => x.n);
  const reales = lista.length - sin.length;
  const nom = n => ev(`(() => { const x = nutritionFor(${JSON.stringify(n)}); return x ? x.n : ${JSON.stringify(n)} })()`);
  const esSinDato = n => sinDato.includes(nom(n));
  const faltanReales = sin.filter(n => !esSinDato(n));
  ok("E19-cobertura con la semana armada, el 90 % o más de los productos de la lista tiene precio real (SEPA o INDEC) o está anotado sin dato",
    lista.length >= 15 && (lista.length - faltanReales.length) / lista.length >= 0.9, JSON.stringify({ productos: lista.length, conPrecioReal: reales, pctReal: Math.round(pct * 100), sin, anotadosSinDato: sin.length - faltanReales.length, faltanReales }));

  // E19-doce: los 12 productos de la v16.7.0 encuentran precio o están anotados como sin dato.
  const DOCE = ["Arroz (integral, yamaní)", "Yogur natural descremado", "Leche fluida o en polvo descremada", "Pan de molde integral o blanco", "Avena arrollada o instantánea",
    "Carne vacuna (nalga, cuadril, …)", "Queso Port Salut descremado", "Granola", "Tortillas", "Frutillas", "Kiwi", "Arándanos"];
  const estado = DOCE.map(n => ev(`(() => { const p = precioAuto(${JSON.stringify(n)}); return p ? p.it.n : null })()`));
  const faltan12 = DOCE.filter((n, i) => !estado[i] && !esSinDato(n));
  ok("E19-doce los 12 productos que no encontraban precio ahora lo tienen o están anotados sin dato", faltan12.length === 0 && estado.filter(Boolean).length >= 7, JSON.stringify({ estado: DOCE.map((n, i) => n + " → " + estado[i]), faltan12 }));

  // El resolvedor es el mismo para nutrición y precios.
  const nut = ["Yogur natural descremado", "Arroz (integral, yamaní)", "Avena arrollada o instantánea"].map(n => ev(`(() => { const x = nutritionFor(${JSON.stringify(n)}); return x ? x.n : null })()`));
  ok("E19-resolvedor la nutrición y el precio resuelven las variantes del nombre (paréntesis, 'o …', integral/descremado)", nut.every(Boolean) && ev(`Ingredientes.variantesNombre("Arroz (integral, yamaní)")`)[0] === "Arroz integral", JSON.stringify(nut));

  // El resolvedor no confunde ingredientes distintos con una variante del nombre.
  const dest = n => ev(`(() => { const p = precioAuto(${JSON.stringify(n)}); return p ? p.it.n : null })()`);
  const neg = { "Pan rallado": dest("Pan rallado"), "Queso rallado": dest("Queso rallado"), "Queso fresco": dest("Queso fresco"), "Leche de almendras": dest("Leche de almendras"), "Queso blanco": dest("Queso blanco") };
  ok("E19-no-confunde 'Pan rallado' y 'Queso rallado' tienen precio propio y 'Leche de almendras' o 'Queso blanco' no se reducen a otro ingrediente",
    neg["Pan rallado"] === "Pan rallado" && neg["Queso rallado"] === "Queso rallado" && neg["Queso fresco"] === "Queso fresco" && neg["Leche de almendras"] !== "Leche" && neg["Queso blanco"] === null, JSON.stringify(neg));
  ok("E19-cobertura-real la cobertura con precio real no baja de 70 % (hoy 76 %; sube cuando 'Actualizar precios' sume los ítems anotados sin dato)", pct >= 0.7, "real " + Math.round(pct * 100) + " % · sin: " + sin.join(", "));

  // E19-plausibilidad: por categoría, ningún precio por kg o litro se aparta más de 4 veces de la mediana de su categoría salvo excepciones anotadas.
  const r = ev(`(() => { const d = preciosDataset(); const reg = "GBA"; const por = {}; const cats = new Set();
    for (const it of d.meta.items) { const v = (it.s && it.s[reg] > 0) ? it.s[reg] : (it.p && it.p[reg]); if (!(v > 0) || it.b === "unidad") continue; (por[(it.k || "?") + "/" + it.b] = por[(it.k || "?") + "/" + it.b] || []).push([it.n, v]) }
    const med = a => { const s = a.map(x => x[1]).sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 };
    const fuera = [], sinCat = d.meta.items.filter(i => !i.k).map(i => i.n);
    for (const [c, a] of Object.entries(por)) { const m = med(a); for (const [n, v] of a) if (v > 4 * m || v < m / 4) fuera.push(c + "/" + n + " " + Math.round(v) + " vs mediana " + Math.round(m)) }
    return JSON.stringify({ fuera, sinCat, cats: Object.keys(por) }) })()`);
  const pl = JSON.parse(r), EXCEPCIONES = notas.excepcionesPlausibilidad.map(x => x.n);
  const fueraSinExc = pl.fuera.filter(f => !EXCEPCIONES.some(e => f.split("/")[2].replace(/ \d+ vs mediana.*/, "") === e));
  ok("E19-plausibilidad en cada categoría ningún precio por kg o litro se aparta más de 4 veces de la mediana (salvo excepciones anotadas) y todo ítem tiene categoría",
    !fueraSinExc.length && !pl.sinCat.length, JSON.stringify({ fueraSinExc, sinCat: pl.sinCat, excepciones: EXCEPCIONES }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
