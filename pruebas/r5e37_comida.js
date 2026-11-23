// R5 · Etapa 37 (Elegir o cambiar una comida): ítems C-01, C-02, C-03 y C-04 de docs/ronda-5-lista.md.
(async () => {
  const H = R5H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc(), q = s => { const e = doc().querySelector(s); if (!e) throw new Error("no está: " + s); return e };
  const pantalla = () => (doc().querySelector(".screen.is-active") || {}).id;
  const plan = () => JSON.parse(localStorage.getItem("miPlatoFacil_plan") || "{}");

  // R5-C-01: cambiar una comida (hueco lleno) y armar una nueva deja la armada en el hueco, desde Semana (almuerzo, merienda y semana que viene) y desde Hoy.
  // No se pudo reproducir el error con estos caminos (ver el Registro de la Etapa 37): la prueba exige el resultado pedido en todos.
  const planProx = () => (JSON.parse(localStorage.getItem("miPlatoFacil_planProxima_v1") || "{}").plan) || {};
  // `otro`: arma un plato distinto del de Tomate, Papa y Merluza (guardar el mismo plato reusa la misma comida: si hoy es lunes,
  // el almuerzo de Hoy ya tiene ese plato por el primer flujo y el cambio no se notaría).
  const armarPlato = async (otro) => {
    if (pantalla() === "day") await tocar(q('#day [data-day="Día libre"]'));
    if (pantalla() === "plate_static") await tocar(q('#plate_static [data-go="lunch_veg"]'));
    const elegir = (caja, nombre) => otro ? doc().querySelector(`${caja} [data-name]:not([data-name="${nombre}"])`) : q(`${caja} [data-name="${nombre}"]`);
    await tocar(elegir("#boxv", "Tomate")); await tocar(doc().getElementById("nextBottom"));
    await tocar(elegir("#boxa", "Papa")); await tocar(doc().getElementById("nextBottom"));
    await tocar(elegir("#boxp", "Merluza")); await tocar(doc().getElementById("nextBottom"));
  };
  const armarDesayuno = async () => {
    for (let i = 0; i < 8 && pantalla() !== "resumen"; i++) {
      const ch = doc().querySelector("#" + pantalla() + " .choice"); if (ch) { ch.click(); await espera(200) }
      const nb = doc().getElementById("nextBottom"); if (nb && nb.getClientRects().length) { nb.click(); await espera(250) }
    }
  };
  const flujo = async (nombre, tab, dia, slot, tipo, leer, otro) => {
    const antes = leer(dia, slot);
    await tocar(q(tab === "hoy" ? `#home [data-hueco-hoy="${dia}|${slot}"]` : `#planList [data-hueco="${dia}|${slot}"]`));
    await tocar(q(".hoja [data-hueco-cambiar]"));
    await tocar(q(`.hoja [data-start="${tipo}"][data-start-day="${dia}"][data-start-slot="${slot}"]`));
    if (tipo === "plato") await armarPlato(otro); else await armarDesayuno();
    await tocar(q("#resumen [data-save-plate]")); await tocar(q(".hoja .button--primary"), 400);
    const despues = leer(dia, slot);
    return { nombre, antes, despues, ok: !!despues && despues !== antes && !!ev(`MisPlatos.loadSaved().find(x => x.id === ${JSON.stringify(despues)})`) && pantalla() === (tab === "hoy" ? "home" : "plan") };
  };
  await H.abrir({ ...H.MARCA }); await H.armar();
  ev('openTab("semana")'); await espera(200); ev('Semana.elegirDiaPlan("lunes")'); await espera(150);
  const f1 = await flujo("semana almuerzo", "semana", "lunes", "almuerzo", "plato", (d, s) => plan()[d][s]);
  const f2 = await flujo("semana merienda", "semana", "lunes", "merienda", "desayuno", (d, s) => plan()[d][s]);
  const nuevaSemana = ev("(() => { const it = MisPlatos.loadSaved().find(x => x.id === loadPlan().lunes.almuerzo); return it && it.lines.join(' ') })()");
  const idBase = ev("MisPlatos.loadSaved().find(x => x.type === 'plato' && x.id !== loadPlan().lunes.almuerzo).id");
  ev("Semana.verSemana(1)"); await espera(250); ev('Semana.elegirDiaPlan("lunes")'); await espera(150);
  ev(`setSlot("lunes", "almuerzo", ${JSON.stringify(idBase)})`); await espera(200);
  const f3 = await flujo("semana que viene", "semana", "lunes", "almuerzo", "plato", (d, s) => (planProx()[d] || {})[s]);
  ev("Semana.verSemana(0)"); await espera(200);
  ev('openTab("hoy")'); await espera(300);
  const hoyDia = ev("todayPlanDay()");
  const f4 = await flujo("hoy almuerzo", "hoy", hoyDia, "almuerzo", "plato", (d, s) => plan()[d][s], true);
  ok("R5-C-01 al cambiar una comida y armar una nueva con '+ Armar nueva', la comida armada queda en el hueco y se vuelve a la pantalla de donde se empezó (Semana: almuerzo, merienda y semana que viene; Hoy)",
    f1.ok && f2.ok && f3.ok && f4.ok && /Tomate/.test(nuevaSemana || ""), JSON.stringify({ f1, f2, f3, f4 }));

  // R5-C-02: "Sugerime" en desayuno y merienda sugiere una idea (como en almuerzo y cena), sin pedir armar una comida.
  const sugerir = async (dia, slot) => {
    ev('openTab("semana")'); await espera(200); ev(`abrirSelector(${JSON.stringify(dia)}, ${JSON.stringify(slot)})`); await espera(250);
    await tocar(H.boton(/Sugerime/, H.hoja()), 300);
    const hoja = H.hoja(), propuesta = (hoja.querySelector(".selector__propuesta") || { textContent: "" }).textContent, botones = H.botonesHoja();
    return { propuesta, botones, pantalla: pantalla() };
  };
  const resC02 = {};
  for (const slot of ["desayuno", "almuerzo", "merienda", "cena"]) resC02[slot] = await sugerir("martes", slot);
  await H.cerrarHoja();
  const igualQue = (a, b) => /^¿Qué tal .+\?$/.test(a.propuesta) && a.botones.includes("Usar esta") && a.botones.includes("Otra") && b.botones.includes("Usar esta") && b.botones.includes("Otra") && a.pantalla === "plan";
  // "Usar esta" en la merienda la asigna al hueco.
  ev('abrirSelector("martes", "merienda")'); await espera(250); await tocar(H.boton(/Sugerime/, H.hoja()), 300);
  const nombreProp = H.hoja().querySelector(".selector__propuesta").textContent.replace(/^¿Qué tal |\?$/g, "");
  await tocar(H.boton(/^Usar esta$/, H.hoja()), 400);
  const asignada = ev("MisPlatos.loadSaved().find(x => x.id === loadPlan().martes.merienda)");
  ok("R5-C-02 'Sugerime' funciona igual en desayuno y merienda que en almuerzo y cena: propone una idea con 'Usar esta' y 'Otra' (sin pedir armar una comida) y 'Usar esta' la deja en el hueco",
    ["desayuno", "merienda"].every(k => igualQue(resC02[k], resC02.almuerzo)) && igualQue(resC02.cena, resC02.almuerzo) && !!asignada && asignada.type === "desayuno" && /./.test(nombreProp), JSON.stringify({ resC02, nombreProp, asignada: asignada && asignada.type }));

  // R5-C-03: Editar receta si la comida tiene receta; Añadir receta si no.
  await H.abrir({ ...H.MARCA }); await H.armar();
  const comidas = JSON.parse(ev(`JSON.stringify(MisPlatos.loadSaved().filter(x => x.type === "plato").map(x => ({ id: x.id, tiene: comidaTieneReceta(x) })))`));
  const conReceta = comidas.find(c => c.tiene), sinReceta = ev(`(() => { const it = { id: "plato_sin_receta", savedAt: new Date().toISOString(), type: "plato", title: "Almuerzo / Cena · Día libre", lines: ["Verduras: Tomate", "Almidones: Arroz", "Proteínas: Huevo"], sig: "r5-sin-receta", text: "r5-sin-receta", cooked: 0, state: null }; MisPlatos.persistSaved([it, ...MisPlatos.loadSaved()]); return it.id })()`);
  const textoBoton = async id => { ev(`Comidas.mostrarDetallePlato(${JSON.stringify(id)})`); await espera(250); return H.botones(/^(Editar|Añadir) receta$/, doc().getElementById("comida")).map(b => b.textContent.trim()) };
  const a = await textoBoton(conReceta.id), b = await textoBoton(sinReceta);
  // Editar receta abre el editor con los pasos y las cantidades; Añadir receta, con los ingredientes y sin pasos.
  await tocar(H.boton(/^Añadir receta$/, doc().getElementById("comida")), 300);
  const editorB = { pantalla: pantalla(), titulo: doc().getElementById("recipeDetailsTitle").value, filas: doc().querySelectorAll("#recipeIngredientRows .amount-row").length, pasos: doc().getElementById("recipeDetailsSteps").value };
  ev(`Comidas.mostrarDetallePlato(${JSON.stringify(conReceta.id)})`); await espera(250);
  await tocar(H.boton(/^Editar receta$/, doc().getElementById("comida")), 300);
  const editorA = { pantalla: pantalla(), filas: doc().querySelectorAll("#recipeIngredientRows .amount-row").length, pasos: doc().getElementById("recipeDetailsSteps").value.split("\n").length };
  ok("R5-C-03 al ver una comida con receta hay un botón 'Editar receta' (abre el editor con sus pasos y cantidades) y, si no tiene, 'Añadir receta' (abre el editor con sus ingredientes)",
    JSON.stringify(a) === '["Editar receta"]' && JSON.stringify(b) === '["Añadir receta"]' && editorB.pantalla === "recetaEditar" && editorB.filas >= 3 && editorB.pasos === "" && editorA.pantalla === "recetaEditar" && editorA.filas >= 2 && editorA.pasos >= 2, JSON.stringify({ a, b, editorA, editorB }));

  // R5-C-04: con una dieta (vegetariano), cambiar una comida no muestra ideas que no la cumplen y las comidas guardadas que no la cumplen se ven apagadas con el motivo.
  const carne = { id: "plato_carne", savedAt: new Date().toISOString(), type: "plato", title: "Almuerzo / Cena · Día libre", lines: ["Verduras: Tomate", "Almidones: Arroz", "Proteínas: Carne picada"], sig: "r5-carne", text: "r5-carne", cooked: 0, state: null, note: "Arroz con carne picada" };
  const veg = { id: "plato_veg", savedAt: new Date().toISOString(), type: "plato", title: "Almuerzo / Cena · Día libre", lines: ["Verduras: Zapallo", "Almidones: Arroz", "Proteínas: Lentejas"], sig: "r5-veg", text: "r5-veg", cooked: 0, state: null, note: "Arroz con lentejas" };
  await H.abrir({ ...H.MARCA, miPlatoFacil_saved: JSON.stringify([carne, veg]), miPlatoFacil_dieta_v1: JSON.stringify({ filtros: ["vegetariano"] }) });
  ev('openTab("semana")'); await espera(200); ev('abrirSelector("lunes", "almuerzo")'); await espera(250);
  const ideasVis = [...doc().querySelectorAll('.hoja [data-selector-seccion="ideas"] .selector-item__nombre')].map(e => e.textContent.replace(/^💡 /, ""));
  const permitidas = ideasVis.every(t => ev(`dietaPermite(${JSON.stringify(t)}) && data.menuCatalog.filter(i => i.text === ${JSON.stringify(t)}).every(i => textoPermitido(textoDeIdea(i)))`));
  const filaCarne = doc().querySelector('.hoja [data-selector-id="plato_carne"]'), filaVeg = doc().querySelector('.hoja [data-selector-id="plato_veg"]');
  ok("R5-C-04 con la dieta Vegetariano, al cambiar una comida no hay ideas que no la cumplen y la comida guardada con carne se ve apagada con el motivo (la vegetariana, normal)",
    ideasVis.length > 0 && permitidas && !!filaCarne && filaCarne.classList.contains("is-apagado") && /No cumple «Vegetariano»/.test(filaCarne.textContent) && getComputedStyle(filaCarne).opacity < 1 && !!filaVeg && !filaVeg.classList.contains("is-apagado") && !/No cumple/.test(filaVeg.textContent), JSON.stringify({ ideasVis, motivo: filaCarne && filaCarne.textContent }));

  return H.terminar();
})()
