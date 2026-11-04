// E12: Etapa 12 del rediseño (Cantidades reales). C12-1 a C12-4 son los controles E12-cantidad-en-todo, E12-personas, E12-envases y
// E12-basicos de docs/validacion/criterios.json. La app se abre en un marco aparte. Datos inventados (el respaldo de ejemplo).
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
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const unidadesDe = () => JSON.parse(ev("JSON.stringify(Compras.shoppingPlanItems().map(e => [e.key, [...e.units], e.unknown]))"));

  // C12-1 El 100 % de los ítems que vienen de platos armados tiene cantidad: los de cada plato guardado del respaldo de ejemplo
  // y cada opción del armado (fruta, proteína, cereal, grasa, snack y pre).
  cargar({ ...R.data }); await abrir();
  const sinCantidad = JSON.parse(ev(`JSON.stringify((() => {
    const malos = [];
    for (const it of MisPlatos.loadSaved().filter(x => x.state && !x.recipeSourceId)) {
      const con = new Set(cantidadesDePlatoArmado(it).filter(c => c.q > 0 && c.unit).map(c => ingredientKey(c.name)));
      for (const n of Semana.extractIngredients(it)) if (!con.has(ingredientKey(n))) malos.push(it.id + ": " + n)
    }
    const estado = (k, nombre, cantidad) => ({ type: k === "snack" ? "snack" : k === "pre" ? "pre" : "desayuno", [k]: { name: nombre, quantity: cantidad } });
    const listas = [["fruta", data.frutas], ["bfprot", data.bfprot], ["bfcarb", data.bfcarb], ["grasa", data.bffat], ["snack", data.snacks]];
    for (const [k, lista] of listas) for (const [nombre, cant] of lista) {
      const it = { state: estado(k, nombre, cant) };
      const con = new Set(cantidadesDePlatoArmado(it).filter(c => c.q > 0).map(c => ingredientKey(c.name)));
      for (const n of Semana.extractIngredients(it)) if (!con.has(ingredientKey(n))) malos.push(k + ": " + nombre + " → " + n)
    }
    for (const g of [["verduras", data.verduras], ["almidones", data.almidones], ["proteinas", data.proteinas], ["legProt", data.legumbres]]) for (const n of g[1].slice(0, 60)) {
      const it = { state: { type: "plato", day: "Día libre", [g[0]]: [{ name: n }] } };
      const con = new Set(cantidadesDePlatoArmado(it).filter(c => c.q > 0).map(c => ingredientKey(c.name)));
      for (const x of Semana.extractIngredients(it)) if (!con.has(ingredientKey(x))) malos.push(g[0] + ": " + n + " → " + x)
    }
    return malos
  })())`));
  const items = unidadesDe();
  const lista = JSON.parse(ev("JSON.stringify(shoppingDisplayItems().map(x => Ingredientes.textoLegible(x.text)))"));
  const feos = lista.filter(t => /sin cantidad en/.test(t) || /\d,\d{3,}/.test(t) || /\b1 unidades\b/.test(t));
  ok("C12-1 el 100 % de los ítems de platos armados tiene cantidad y la lista no muestra \"sin cantidad en\" ni decimales largos", items.length > 15 && !sinCantidad.length && !feos.length, JSON.stringify({ sinCantidad: sinCantidad.slice(0, 6), feos }));
  // Lo guardado no se reescribe.
  const antes = localStorage.getItem("miPlatoFacil_saved");
  await abrir();
  ev("shoppingDisplayItems()");
  ok("C12-1b mostrar la lista no reescribe lo guardado", localStorage.getItem("miPlatoFacil_saved") === antes && R.data.miPlatoFacil_saved === antes);

  // C12-2 Pasar de 1 a 3 personas triplica las cantidades (y 1 persona no escribe nada).
  cargar({ ...R.data }); await abrir();
  const sinClave = localStorage.getItem("miPlatoFacil_hogar_v1") === null && ev("personasHogar()") === 1;
  const uno = unidadesDe();
  ev("CantidadesPlatos.cambiarPersonasHogar(3)"); await espera(100);
  const tres = unidadesDe();
  const mapa = new Map(tres.map(x => [x[0], x]));
  const malosTriple = uno.filter(([k, us]) => us.length && !(mapa.get(k) && mapa.get(k)[1].length === us.length && us.every(([u, q], i) => mapa.get(k)[1][i][0] === u && Math.abs(mapa.get(k)[1][i][1] - 3 * q) < 1e-6)));
  ok("C12-2 pasar de 1 a 3 personas triplica las cantidades y se guarda en hogar_v1", sinClave && uno.filter(x => x[1].length).length > 15 && !malosTriple.length && localStorage.getItem("miPlatoFacil_hogar_v1") === '{"personas":3}' && ev('document.getElementById("hogarPersonas").value') === "3", JSON.stringify(malosTriple.slice(0, 3)));
  // Respaldo: hogar_v1 se restaura, queda como opcional y uno inválido se rechaza.
  const snap = JSON.parse(ev("JSON.stringify(completeBackupSnapshot(localStorage))"));
  const tieneHogar = snap.data.miPlatoFacil_hogar_v1 === '{"personas":3}';
  const malo = JSON.parse(JSON.stringify(snap)); malo.data.miPlatoFacil_hogar_v1 = '{"personas":99}';
  let rechazado = false; try { ev("Respaldo.validateCompleteBackup(" + JSON.stringify(malo) + ")") } catch (e) { rechazado = true }
  const viejo = JSON.parse(JSON.stringify(R)); let viejoOk = true; try { ev("Respaldo.validateCompleteBackup(" + JSON.stringify(viejo) + ")") } catch (e) { viejoOk = false }
  ok("C12-2b hogar_v1 y básicos faltantes entran al respaldo como opcionales; uno inválido se rechaza y el respaldo viejo se restaura", tieneHogar && rechazado && viejoOk && ev('COMPLETE_BACKUP_OPTIONAL_KEYS.includes("miPlatoFacil_hogar_v1") && COMPLETE_BACKUP_OPTIONAL_KEYS.includes("miPlatoFacil_basicosFaltantes_v1")'));

  // C12-3 Fideos por 180 g se muestran como 1 paquete de 500 g.
  const f180 = ev('envasar("Fideos", new Map([["g", 180]])).texto'), f600 = ev('envasar("Fideos y pastas (de trigo, maíz o arroz)", new Map([["g", 600]])).texto'), k1 = ev('envasar("Arroz", new Map([["kg", 1.2]])).texto'), leche = ev('envasar("Leche", new Map([["ml", 400]])).texto'), huevos = ev('envasar("Huevo", new Map([["unidad", 13]])).texto');
  cargar({ ...R.data }); await abrir();
  const eti = ev('shoppingDisplayItems().find(x => x.name.startsWith("Fideos")).text');
  ok("C12-3 fideos por 180 g se muestran como 1 paquete de 500 g (y el resto de los envases redondea para arriba)", f180 === "1 paquete de 500 g" && eti === "Fideos y pastas (de trigo, maíz o arroz): 1 paquete de 500 g" && f600 === "2 paquetes de 500 g" && k1 === "2 paquetes de 1.000 g" && leche === "1 sachet de 1.000 ml" && huevos === "2 docenas", JSON.stringify({ f180, eti, f600, k1, leche, huevos,  }));

  // C12-4 Ningún básico de alacena aparece en la lista por defecto; marcado como faltante en la Despensa, aparece.
  cargar({ ...R.data }); await abrir();
  const hay = () => JSON.parse(ev("JSON.stringify(shoppingDisplayItems().map(x => x.name))"));
  const basicosRecetas = ev('Object.values(loadRecipeAmounts()).flatMap(a => a.rows.map(r => r.name)).filter(n => esBasicoDeAlacena(n))');
  const sinBasicos = hay().filter(n => ev("esBasicoDeAlacena(" + JSON.stringify(n) + ")"));
  ev('alternarBasicoFaltante("Aceite")'); await espera(100);
  const conAceite = hay().some(n => /^aceite/i.test(n));
  const clave = localStorage.getItem("miPlatoFacil_basicosFaltantes_v1");
  const chip = ev('!!document.querySelector("#basicosChips [data-basico-falta=\\"Aceite\\"][aria-pressed=\\"true\\"]")');
  ev('alternarBasicoFaltante("Aceite")'); await espera(100);
  ok("C12-4 ningún básico aparece en la lista por defecto y marcado como faltante en la Despensa sí", basicosRecetas.length >= 2 && !sinBasicos.length && conAceite && clave === '{"faltan":["Aceite"]}' && chip && !hay().some(n => /^aceite/i.test(n)) && localStorage.getItem("miPlatoFacil_basicosFaltantes_v1") === null, JSON.stringify({ basicosRecetas, sinBasicos, conAceite, clave, chip }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
