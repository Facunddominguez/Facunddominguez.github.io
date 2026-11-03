// E9: Etapa 9 del rediseño (precios de SEPA). C9-2 a C9-8 usan SIEMPRE el archivo de ejemplo datos/precios-ejemplo-sepa.json
// (valores redondos, no son precios reales). C9-1 es la excepción a propósito: lee el datos/precios.json REAL incrustado en la
// app (generado por herramientas/actualizar-precios.mjs) para medir cuánto del catálogo tiene precio. La app se abre en un marco aparte.
// C9-1 es el control E9-cobertura-precios de criterios.json. El lector de ZIP de la herramienta se prueba con
// pruebas/sepa-lector.mjs (Node, sin red; lo corre la compuerta como el control E9-lector-sepa).
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
  const EJ = await (await fetch("/datos/precios-ejemplo-sepa.json", { cache: "no-store" })).json();
  const REALTXT = await (await fetch("/datos/precios.json", { cache: "no-store" })).text();
  const MAPA = await (await fetch("/datos/precios-mapa.json", { cache: "no-store" })).json();
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const REGION = "miPlatoFacil_region_v1", PRECIOS = "miPlatoFacil_referencePrices_v1", UI = "miPlatoFacil_uiMode_v1";
  const conEjemplo = async (extra = {}) => { cargar(extra); await abrir(); w.preciosDataset.data = EJ; w.preciosDataset.cache = null; w.refrescarPrecios(); await espera(50) };
  const foto = () => JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]));

  // C9-1 Cobertura del catálogo con el JSON real. Ámbito: ingredientes de las 41 ideas y de las comidas y recetas del respaldo de
  // ejemplo (núcleo) más las opciones del armado (todo llevado al nombre de la nutrición, que es lo que usa precioDe).
  cargar({}); await abrir();
  const D = ev("data");
  const nombres = { nucleo: new Set(), armado: new Set() }, sinNombre = new Set();
  const sumar = (g, n) => { const nu = w.nutritionFor(n); if (nu) nombres[g].add(nu.n); else sinNombre.add(n) };
  for (const idea of D.menuCatalog) for (const n of w.extractIngredients(w.ideaComoGuardada(idea, "Día libre"))) sumar("nucleo", n);
  for (const it of JSON.parse(R.data.miPlatoFacil_saved)) for (const n of w.extractIngredients(it)) sumar("nucleo", n);
  for (const r of Object.values(JSON.parse(R.data.miPlatoFacil_recipeAmounts_v1))) for (const row of r.rows) sumar("nucleo", row.name);
  for (const g of ["verduras", "almidones", "legumbres", "proteinas"]) for (const n of D[g]) sumar("armado", n);
  for (const g of ["bfprot", "bfcarb", "bffat", "fruit"]) for (const p of D[g]) for (const n of String(p[0]).split(" | ")) sumar("armado", n);
  const nucleo = [...nombres.nucleo], armado = [...nombres.armado].filter(n => !nombres.nucleo.has(n));
  const real = JSON.parse(REALTXT), porN = new Map(real.items.map(i => [i.n, i]));
  const mismoAmbito = JSON.stringify([...nucleo].sort()) === JSON.stringify([...MAPA.ambito.nucleo].sort()) && JSON.stringify([...armado].sort()) === JSON.stringify([...MAPA.ambito.armado].sort());
  const finito = v => Number.isFinite(v) && v > 0;
  // Un ingrediente cuenta si hoy la app le da un precio automático en GBA y el dato es sólido: SEPA con 10 observaciones y 3 comercios, o INDEC finito.
  const estado = n => {
    const a = ev("precioAuto(" + JSON.stringify(n) + ")"), it = porN.get(n);
    if (!a || !it) return { tiene: false, aprox: false };
    const c = it.c && it.c.GBA;
    const solido = a.fuente === "sepa" ? finito(it.s && it.s.GBA) && Array.isArray(c) && c[0] >= 10 && c[1] >= 3 && a.precio === it.s.GBA : finito(it.p && it.p.GBA) && a.precio === it.p.GBA;
    return { tiene: solido, aprox: !!a.aprox };
  };
  const medir = lista => {
    const e = lista.map(n => [n, estado(n)]), con = e.filter(x => x[1].tiene), aprox = con.filter(x => x[1].aprox).map(x => x[0]);
    const tope = Math.floor(0.15 * Math.ceil(0.8 * lista.length)), contados = con.length - aprox.length + Math.min(aprox.length, tope);
    return { total: lista.length, con: con.length, aprox, contados, minimo: Math.ceil(0.8 * lista.length), faltan: e.filter(x => !x[1].tiene).map(x => x[0]), pct: Math.round(100 * contados / lista.length) };
  };
  const mN = medir(nucleo), mA = medir(armado), mT = medir([...nucleo, ...armado]);
  // El total llega al 80 % con datos honestos (SEPA con mínimos y a lo sumo 15 % aproximados): por eso la prueba exige el total.
  const exigeTotal = mT.contados >= mT.minimo;
  ok("C9-1 el 80 % o más de los ingredientes del catálogo y de las comidas de ejemplo tienen precio (JSON real: núcleo " + mN.pct + " %, armado " + mA.pct + " %, total " + mT.pct + " %)",
    mismoAmbito && exigeTotal && mT.con >= mT.minimo && mN.contados >= mN.minimo && nucleo.length >= 40 && armado.length >= 30,
    "núcleo " + mN.con + "/" + mN.total + ", armado " + mA.con + "/" + mA.total + ", total " + mT.con + "/" + mT.total + ", aproximados " + mT.aprox.length + " (" + mT.aprox.join(", ") + "), sin precio: " + mT.faltan.join(", ") + (mismoAmbito ? "" : " · el ámbito del mapa no coincide con el de la app"));

  // C9-2 Orden Mi precio > SEPA > INDEC, y precioDe no escribe nada
  const MIO = JSON.stringify({ p1: { id: "p1", name: "Arroz", pack: "", amount: 1, unit: "kg", price: 2800, currency: "ARS", date: "2026-10-20" } });
  await conEjemplo({});
  const antes = foto();
  const arrozSepa = ev('precioDe("Arroz",1,"kg")'), polloIndec = ev('precioDe("Pollo",1,"kg")'), zanahoria = ev('precioDe("Zanahoria",2,"kg")'), huevo = ev('precioDe("Huevo",6,"unidad")');
  const despues = foto();
  await conEjemplo({ [PRECIOS]: MIO });
  const arrozMio = ev('precioDe("Arroz",1,"kg")');
  localStorage.setItem(PRECIOS, "{}");
  const arrozSin = ev('precioDe("Arroz",1,"kg")');
  ok("C9-2 Mi precio gana a SEPA y SEPA a INDEC (INDEC queda de respaldo), y precioDe no escribe en localStorage",
    arrozSepa.costo === 2200 && arrozSepa.origen === "sepa" && polloIndec.costo === 5000 && polloIndec.origen === "indec" && zanahoria.costo === 6000 && huevo.costo === 6 * 400 && antes === despues
    && arrozMio.propio === true && arrozMio.costo === 2800 && arrozSin.costo === 2200 && arrozSin.origen === "sepa",
    [arrozSepa.costo, polloIndec.costo, zanahoria.costo, huevo.costo, arrozMio.costo].join(" · "));

  // C9-3 Región: SEPA de la región; si no tiene, INDEC de la región; después GBA
  const enRegion = async (reg, nombre, q, u) => { await conEjemplo({ [REGION]: JSON.stringify({ region: reg }) }); return ev("precioDe(" + JSON.stringify(nombre) + "," + q + "," + JSON.stringify(u) + ")") };
  const arrP = await enRegion("Pampeana", "Arroz", 1, "kg"), arrPat = await enRegion("Patagonia", "Arroz", 1, "kg"), zanPat = await enRegion("Patagonia", "Zanahoria", 1, "kg"), lenPat = await enRegion("Patagonia", "Lentejas", 1, "kg");
  ok("C9-3 cambiar la región cambia el valor de SEPA; sin SEPA en la región cae a INDEC de la región y después a GBA, con la fuente correcta",
    arrP.costo === 2300 && arrP.fuente.startsWith("SEPA · mediana · Pampeana · 2 nov. 2026") && arrPat.costo === 2500 && arrPat.origen === "indec" && arrPat.fuente.startsWith("Promedio INDEC · Patagonia")
    && zanPat.costo === 3000 && zanPat.region === "GBA" && zanPat.fuente.startsWith("SEPA · mediana · GBA") && lenPat.costo === 6000 && lenPat.region === "Patagonia",
    [arrP.costo, arrPat.costo, zanPat.costo, lenPat.costo].join(" · "));

  // C9-4 Rango en Comparar con los percentiles reales (par por región o par suelto de la Etapa 8)
  await conEjemplo({ [UI]: "completo" });
  const rg = ev('rangoDePrecios("Arroz","kg")'), txtRg = ev('textoRangoPrecios("Arroz","kg")'), rgPollo = ev('rangoDePrecios("Pollo","kg")');
  ev("preciosDataset.data=Object.assign({},preciosDataset.data,{items:preciosDataset.data.items.map(i=>i.n==='Arroz'?Object.assign({},i,{r:[1500,2900]}):i)});preciosDataset.cache=null");
  const rgPar = ev('rangoDePrecios("Arroz","kg")');
  ok("C9-4 Comparar muestra el rango con los percentiles 25 y 75 reales de SEPA; sin ellos se ve como antes",
    rg.autoBajo === 2000 && rg.autoAlto === 2600 && rg.auto === 2200 && txtRg.includes("promedio $2.000 a $2.600") && rgPollo.autoBajo === null && rgPollo.auto === 5000 && rgPar.autoBajo === 1500 && rgPar.autoAlto === 2900,
    txtRg);

  // C9-5 Fuente y fecha visibles, "aprox." también para SEPA, atribución con CC BY 4.0 y con los precios apagados no se ve nada
  await conEjemplo({ [UI]: "completo" });
  const linea = ev("fuentePrecios()"), rucula = ev('precioDe("Rúcula",0.1,"kg")');
  ev("atribucionPrecios()");
  const info = w.document.getElementById("preciosFuenteInfo"), enlaces = [...info.querySelectorAll("a")].map(a => a.href);
  const resumenAprox = ev('(()=>{const p=preciosDeLaLista([{group:"pendiente",key:"r",name:"Rúcula",units:new Map([["kg",0.1]])}]);return p&&p.aprox})()');
  await conEjemplo({});
  const apagado = ev("preciosActivos()") === false && ev("totalAutomaticoLista()") === null;
  ok("C9-5 la fuente dice SEPA · mediana · región · fecha, los aproximados se marcan, la atribución trae CC BY 4.0 con enlaces y apagados no se ve nada",
    linea.startsWith("SEPA · mediana · GBA · 2 nov. 2026") && linea.includes("INDEC si falta") && rucula.aprox === true && resumenAprox === 1 && info.textContent.includes("CC BY 4.0") && info.textContent.includes("Precios Claros")
    && enlaces.some(h => h.startsWith("https://datos.produccion.gob.ar/")) && enlaces.some(h => h.startsWith("https://creativecommons.org/")) && apagado,
    linea + " · " + enlaces.length + " enlaces");

  // C9-6 Los datos: el ejemplo y el real pasan las mismas comprobaciones, el real pesa ≤ 60.000 bytes y es el mismo que incrusta la app
  cargar({}); await abrir();
  const bytes = new TextEncoder().encode(JSON.stringify(real)).length;
  const sepaOk = d => d.items.every(i => !i.s || Object.keys(i.s).every(r => { const rr = i.r && i.r[r], cc = i.c && i.c[r]; return finito(i.s[r]) && Array.isArray(rr) && rr[0] <= i.s[r] && i.s[r] <= rr[1] && Array.isArray(cc) && cc[0] >= 10 && cc[1] >= 3 }));
  const incrustado = ev("JSON.stringify(PRECIOS_SNAPSHOT)") === JSON.stringify(real);
  ok("C9-6 el ejemplo y el JSON real pasan las mismas comprobaciones (percentiles ordenados, 10 observaciones y 3 comercios), el real pesa 60.000 bytes o menos y es el que incrusta la app",
    w.validPreciosData(real) && w.validPreciosData(EJ) && sepaOk(real) && sepaOk(EJ) && bytes <= 60000 && incrustado && real.sepa && real.sepa.licencia === "CC BY 4.0" && /^https:\/\/datos\.produccion\.gob\.ar\//.test(real.sepa.dataset),
    bytes + " bytes");

  // C9-7 Sin clave nueva ni cambio de formato: el respaldo no sabe de SEPA y el de ejemplo se sigue restaurando
  cargar({}); await abrir();
  const claves = ev("COMPLETE_BACKUP_KEYS.filter(k=>/sepa/i.test(k))");
  const fuentesTxt = ev("precioDe.toString()+preciosDataset.toString()+atribucionPrecios.toString()");
  ok("C9-7 no hay clave nueva en el respaldo ni llamadas a internet en el código de precios, y el respaldo de ejemplo sigue válido",
    claves.length === 0 && !/https?:\/\//i.test(fuentesTxt) && !/fetch\(|XMLHttpRequest/.test(fuentesTxt) && typeof w.completeBackupSnapshot === "function" && Object.keys(R.data).length > 10,
    "claves de SEPA en el respaldo: " + claves.length);

  // C9-8 Si faltan más de la mitad de los precios, el total dice "al menos"
  const mapa3 = new Map([["a", "x"]]);
  const pocos = w.resumenPrecios({ porClave: mapa3, total: 1000, faltan: 3, pendientes: 4 });
  const algunos = w.resumenPrecios({ porClave: mapa3, total: 1000, faltan: 1, pendientes: 4 });
  ok("C9-8 con más de la mitad de precios faltantes el total dice 'al menos ≈ $X (faltan N precios)'; con pocos faltantes sigue como antes",
    pocos.includes("al menos ≈ $1.000 (faltan 3 precios)") && algunos.includes("≈ $1.000 (faltan 1 precio)") && !algunos.includes("al menos"),
    pocos + " | " + algunos);

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
