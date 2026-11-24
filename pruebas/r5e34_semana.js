// R5 · Etapa 34 (Semana): ítems S-11, S-12, S-13, S-15, S-16, S-17, S-18 y S-19 de docs/ronda-5-lista.md.
// Cada prueba mira lo que se ve en la pantalla (botones, textos, datos guardados). Datos inventados y precios congelados.
(async () => {
  const H = R5H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc();
  const RECETA = { miPlatoFacil_recipeAmounts_v1: JSON.stringify({ "Ensalada completa: lechuga, tomate, huevo, atún y papa": { yield: 1, rows: [{ name: "Papa", quantity: 200, unit: "g" }] } }), miPlatoFacil_recipeDetails_v1: JSON.stringify({ recipe_r5test: { id: "recipe_r5test", title: "Papas al horno", sourceTitle: null, amountsTitle: "Ensalada completa: lechuga, tomate, huevo, atún y papa", steps: ["Cocinar"], notes: "" } }) };
  const abrirMenu = async () => { ev('openTab("semana")'); await espera(200); await tocar(doc().querySelector("#plan [data-plan-menu]")); return H.botonesHoja().filter(t => t !== "Cerrar") };
  const bajar = async accion => {
    const w = H.w(), blobs = [], nombres = [], crear = w.URL.createObjectURL, clic = w.HTMLAnchorElement.prototype.click;
    w.URL.createObjectURL = b => { blobs.push(b); return "blob:r5" };
    w.HTMLAnchorElement.prototype.click = function () { nombres.push(this.download) };
    try { await accion() } finally { w.URL.createObjectURL = crear; w.HTMLAnchorElement.prototype.click = clic }
    return { nombres, htmls: await Promise.all(blobs.map(b => b.text())) };
  };

  // Semana armada (28 comidas) con un plan guardado.
  await H.abrir({ ...H.MARCA, ...RECETA }); await H.armar();
  const planArmado = ev("JSON.stringify(loadPlan())");

  // R5-S-11: un solo "Compartir la semana" con 3 opciones; ya no hay un "Descargar" aparte.
  const menu = await abrirMenu();
  await tocar(H.boton(/^Compartir la semana$/, H.hoja()));
  const opciones = H.botonesHoja().filter(t => t !== "Cerrar");
  ok("R5-S-11 el menú ⋯ ya no tiene 'Descargar' y 'Compartir la semana' abre 3 opciones: Como texto, Como imagen y Descargar HTML",
    !menu.includes("Descargar") && menu.filter(t => t === "Compartir la semana").length === 1 && JSON.stringify(opciones) === JSON.stringify(["Como texto", "Como imagen", "Descargar HTML"]), JSON.stringify({ menu, opciones }));

  // R5-S-12: Descargar HTML baja la semana que se está viendo.
  const lunesEsta = ev("Semana.semanaActual()"), lunesProx = ev("Semana.lunesSiguiente()");
  const esta = await bajar(async () => { await tocar(H.boton(/^Descargar HTML$/, H.hoja())) });
  const idLunes = ev("loadPlan().lunes.almuerzo"), tituloLunes = ev(`(it => it.note || it.title)(MisPlatos.loadSaved().find(x => x.id === ${JSON.stringify(idLunes)}))`);
  ev("Semana.verSemana(1)"); await espera(250);
  const idProx = ev("MisPlatos.loadSaved().find(x => x.type === 'plato').id"), tituloProx = ev(`(it => it.note || it.title)(MisPlatos.loadSaved().find(x => x.id === ${JSON.stringify(idProx)}))`);
  ev(`setSlot("miercoles", "cena", ${JSON.stringify(idProx)})`); await espera(150);
  await tocar(doc().querySelector("#plan [data-plan-menu]")); await tocar(H.boton(/^Compartir la semana$/, H.hoja()));
  const prox = await bajar(async () => { await tocar(H.boton(/^Descargar HTML$/, H.hoja())) });
  const vacios = h => (h.match(/Sin asignar/g) || []).length;
  ok("R5-S-12 Descargar HTML baja la semana que se ve: esta semana (con sus comidas y su lunes en el nombre) y la que viene (con su lunes y solo la comida que tiene)",
    esta.nombres.length === 1 && esta.nombres[0] === `mi-plan-semanal-${lunesEsta}.html` && esta.htmls[0].includes(tituloLunes) && vacios(esta.htmls[0]) < 5
    && prox.nombres.length === 1 && prox.nombres[0] === `mi-plan-semanal-${lunesProx}.html` && prox.htmls[0].includes(tituloProx) && vacios(prox.htmls[0]) === 27, JSON.stringify({ esta: esta.nombres, prox: prox.nombres, vaciosProx: prox.htmls[0] && vacios(prox.htmls[0]) }));
  ev("Semana.verSemana(0)"); await espera(200);

  // R5-S-13: orden del menú ⋯.
  const m2 = await abrirMenu();
  ok("R5-S-13 en el menú ⋯, 'Compartir la semana' va anteúltimo y 'Empezar de nuevo', último", m2.at(-2) === "Compartir la semana" && m2.at(-1) === "Empezar de nuevo", JSON.stringify(m2));

  // R5-S-16: sin Historial de cambios; lo guardado sigue.
  ok("R5-S-16 no hay botón ni sección 'Historial de cambios' y el historial guardado sigue en el dispositivo",
    !m2.includes("Historial de cambios") && !doc().getElementById("planHistoryList") && !/Historial de cambios/.test(doc().body.innerText) && JSON.parse(localStorage.getItem("miPlatoFacil_planHistory_v1") || "[]").length > 0, JSON.stringify(m2));

  // R5-S-18: sin Buscar en mis recetas ni Consultar mis recetas mientras planifico.
  ok("R5-S-18 no hay 'Buscar en mis recetas' ni 'Consultar mis recetas mientras planifico' en ninguna parte",
    !m2.includes("Buscar en mis recetas") && !doc().getElementById("planRecipeReference") && !/Consultar mis recetas mientras planifico|Buscar en mis recetas/.test([...doc().querySelectorAll('.screen')].map(x => x.textContent).join(' ')), "");
  await H.cerrarHoja();

  // R5-S-15: elegir un plan guardado desde la Semana, aplicarlo y deshacer.
  const sinPlanes = H.boton(/^Mis planes$/, doc().querySelector("#plan"));
  ev('Semana.persistVars({ "Semana liviana": loadPlan() })');
  ev('setSlot("lunes", "almuerzo", null); setSlot("martes", "cena", null)'); await espera(200);
  const vacio = JSON.stringify(ev("loadPlan()")) !== planArmado;
  ev("renderPlan()");
  const boton = H.boton(/^Mis planes$/, doc().querySelector("#plan"));
  await tocar(boton);
  const nombres = H.botonesHoja().filter(t => t !== "Cerrar");
  await tocar(H.boton(/^Semana liviana$/, H.hoja()));
  const aplicado = JSON.stringify(ev("loadPlan()")) === planArmado, aviso = doc().getElementById("planAviso").textContent;
  await tocar(doc().querySelector("#planAviso [data-plan-deshacer]"));
  const deshecho = JSON.stringify(ev("loadPlan()")) === JSON.stringify(ev("(() => { const p = JSON.parse(" + JSON.stringify(planArmado) + "); p.lunes.almuerzo = null; p.martes.cena = null; return p })()"));
  ok("R5-S-15 con un plan guardado, Semana muestra 'Mis planes' (sin planes no); elegirlo lo aplica a la semana que se ve, el aviso lo dice y Deshacer devuelve lo anterior",
    !sinPlanes && vacio && !!boton && nombres.includes("Semana liviana") && aplicado && /Semana liviana/.test(aviso) && deshecho, JSON.stringify({ sinPlanes: !!sinPlanes, vacio, nombres, aplicado, aviso, deshecho }));

  // R5-S-19: "Mis recetas" es una sección del selector, junto a Recientes, Mis comidas e Ideas.
  ev('openTab("semana")'); await espera(150); ev('abrirSelector("lunes", "almuerzo")'); await espera(250);
  const titulos = [...doc().querySelectorAll(".hoja .selector-seccion__titulo")].map(t => t.textContent);
  const recetas = doc().querySelector('.hoja [data-selector-seccion="recetas"]');
  ok("R5-S-19 elegir una comida muestra las secciones Recientes, Mis comidas, Mis recetas e Ideas, y la receta guardada está en Mis recetas",
    JSON.stringify(titulos) === JSON.stringify(["Recientes", "Mis comidas", "Mis recetas", "Ideas"]) && !!recetas && /Papas al horno/.test(recetas.textContent) && !/Papas al horno/.test(doc().querySelector('.hoja [data-selector-seccion="mias"]').textContent), JSON.stringify(titulos));
  await H.cerrarHoja();

  // R5-S-17: chips de los días con aire (8 px o más) y sin encimarse, a 390 y a 320 px; sin la barra ni el "4/4".
  const medir = async ancho => {
    await H.abrir({ ...H.MARCA }, { ancho }); await H.armar();
    ev('openTab("semana")'); await espera(250);
    const chips = [...doc().querySelectorAll("#planDias .semana-dia-chip")];
    return { n: chips.length, hueco: H.huecoHorizontal(chips), encimados: H.seSuperponen(chips), cuenta: doc().querySelectorAll("#planDias .semana-dia-chip__cuenta,#planDias .semana-dia-chip__barra").length, alto: Math.min(...chips.map(c => c.getBoundingClientRect().height)), scroll: doc().documentElement.scrollWidth > ancho + 1, texto: doc().getElementById("planDias").innerText.replace(/\s+/g, " ") };
  };
  const c390 = await medir(390), c320 = await medir(320);
  ok("R5-S-17 los 7 chips de los días tienen 8 px o más entre sí y nada encimado, a 390 y a 320 px, sin barra ni '4/4' y con 44 px de alto",
    [c390, c320].every(c => c.n === 7 && c.hueco >= 8 && !c.encimados && c.cuenta === 0 && !/\d\/4/.test(c.texto) && c.alto >= 44 && !c.scroll), JSON.stringify({ c390, c320 }));

  return H.terminar();
})()
