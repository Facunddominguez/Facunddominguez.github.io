// R5 · Etapa 38 (Hoy): ítems H-01, H-02, H-03, H-04 y H-05 de docs/ronda-5-lista.md.
(async () => {
  const H = R5H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc(), q = s => { const e = doc().querySelector(s); if (!e) throw new Error("no está: " + s); return e };
  const pantalla = () => (doc().querySelector(".screen.is-active") || {}).id;
  const plan = () => JSON.parse(localStorage.getItem("miPlatoFacil_plan") || "{}");
  const hoyEn = async () => { ev('openTab("hoy")'); await espera(300) };

  await H.abrir({ ...H.MARCA }); await H.armar(); await hoyEn();
  const dia = ev("todayPlanDay()");

  // R5-H-01: sin botón Deshacer debajo de las comidas (al anotar "Lo comí" ni al cambiar una comida).
  const deshacerEn = () => H.botones(/Deshacer/, doc().getElementById("home")).length;
  await tocar(q('#todayRows [data-today-eaten]'), 300);
  const tras1 = { estado: doc().getElementById("todayStatus").textContent, deshacer: deshacerEn() };
  await tocar(q(`#todayRows [data-hueco-hoy="${dia}|cena"]`)); await tocar(q(".hoja [data-hueco-cambiar]"));
  const otro = ev(`MisPlatos.loadSaved().find(x => x.type === "plato" && x.id !== loadPlan()["${dia}"].cena).id`);
  await tocar(q(`.hoja [data-selector-id="${otro}"]`), 400);
  const tras2 = { estado: doc().getElementById("todayStatus").textContent, deshacer: deshacerEn(), cambio: plan()[dia].cena === otro };
  ok("R5-H-01 debajo de las 4 comidas no hay botón Deshacer: ni después de anotar 'Lo comí' ni después de cambiar una comida (el aviso queda como texto)",
    tras1.deshacer === 0 && /Anotado en tu registro/.test(tras1.estado) && tras2.deshacer === 0 && tras2.cambio && /asignado/.test(tras2.estado), JSON.stringify({ tras1, tras2 }));

  // R5-H-02 y H-05: "Ver tu registro de hoy" sin flecha y con el mismo formato; orden y grupos de los seis botones.
  const orden = ["#todayRegistro", "#todayMananaBoton", '[data-start="desayuno"]', '[data-start="plato"]', "[data-sugerime]", "[data-con-lo-que-tengo]"].map(s => q("#home " + s));
  const rects = orden.map(b => b.getBoundingClientRect()), textos = orden.map(b => b.textContent.trim().replace(/\s+/g, " "));
  const registro = orden[0], desayuno = orden[2];
  ok("R5-H-02 'Ver tu registro de hoy' no lleva flecha y tiene el mismo formato que 'Desayuno o merienda' y 'Almuerzo o cena' (mismas clases y mismo alto)",
    /^📒 Ver tu registro de hoy$/.test(textos[0]) && !/→/.test(registro.textContent) && registro.className === desayuno.className && registro.className === orden[3].className && Math.abs(rects[0].height - rects[2].height) < 1 && Math.abs(rects[0].height - rects[3].height) < 1 && rects[0].height >= 44, JSON.stringify({ textos, clases: [registro.className, desayuno.className] }));
  const enOrden = rects.every((r, i) => i === 0 || r.top > rects[i - 1].top - 1 || (Math.abs(r.top - rects[i - 1].top) < 2 && r.left > rects[i - 1].left));
  const grupos = [...doc().querySelectorAll("#home .hoy-grupo")].map(g => ({ titulo: g.querySelector(".settings-label").textContent, botones: [...g.querySelectorAll("button")].map(b => b.textContent.trim().replace(/\s+/g, " ")) }));
  ok("R5-H-05 debajo del plan del día, los 6 botones son del mismo formato (soft, 44 px o más), van en un orden claro (registro y mañana; armar; ideas) y agrupados por para qué sirven; Mañana abre una hoja con las comidas de mañana y no hay desplegables",
    textos.length === 6 && orden.every(b => b.classList.contains("button--soft") && b.getBoundingClientRect().height >= 44) && enOrden && grupos.length === 3 && grupos[0].botones.length === 2 && grupos[1].botones.length === 2 && grupos[2].botones.length === 2
    && doc().querySelectorAll("#home details").length === 0 && H.desplegables(doc().getElementById("home")).length === 0, JSON.stringify({ grupos, enOrden }));
  await tocar(q("#todayMananaBoton"), 300);
  const manana = { titulo: (doc().querySelector(".hoja__titulo") || {}).textContent, filas: doc().querySelectorAll(".hoja .today-row").length };
  ok("R5-H-05 'Mañana' abre una hoja con las 4 comidas de mañana", /^Mañana · /.test(manana.titulo) && manana.filas === 4, JSON.stringify(manana));
  await H.cerrarHoja();

  // R5-H-03 y H-04: "Sugerime algo" sin "Al azar" y con 3 opciones directas, igual en las 4 comidas.
  const abrirSug = async slot => { await tocar(q("#home [data-sugerime]"), 300); if (slot) await tocar(q(`.hoja [data-sugerime-comida="${slot}"]`), 300) };
  await abrirSug();
  const sinAzar = !H.boton(/Al azar/, H.hoja()) && !doc().querySelector(".hoja [data-open-azar]");
  ok("R5-H-03 en 'Sugerime algo' no hay botón 'Al azar'", sinAzar, JSON.stringify(H.botonesHoja()));
  const res = {};
  for (const slot of ["desayuno", "almuerzo", "merienda", "cena"]) {
    await abrirSug(slot);
    res[slot] = { propuesta: (H.hoja().querySelector(".selector__propuesta") || { textContent: "" }).textContent, botones: H.botonesHoja().filter(t => !/^(Desayuno|Almuerzo|Merienda|Cena|Cerrar)$/.test(t)) };
    await H.cerrarHoja();
  }
  const tres = JSON.stringify(["Usar esta", "Otra", "Ver y cambiar"]);
  // "Ver y cambiar" en desayuno abre el resumen con un desayuno armado; "Usar esta" en merienda la asigna.
  await abrirSug("desayuno"); await tocar(H.boton(/^Ver y cambiar$/, H.hoja()), 400);
  const verDesayuno = { pantalla: pantalla(), tipo: ev("state.type"), fruta: ev("!!(state.fruta && state.fruta.name)") };
  await hoyEn();
  await abrirSug("merienda"); await tocar(H.boton(/^Usar esta$/, H.hoja()), 400);
  const merienda = ev(`MisPlatos.loadSaved().find(x => x.id === loadPlan()["${dia}"].merienda)`);
  ok("R5-H-04 'Sugerime algo' propone directo un plato con 3 opciones (Usar esta, Otra, Ver y cambiar), igual en desayuno, merienda, almuerzo y cena; 'Ver y cambiar' de un desayuno abre el resumen y 'Usar esta' de la merienda la asigna",
    ["desayuno", "almuerzo", "merienda", "cena"].every(k => /^¿Qué tal .+\?$/.test(res[k].propuesta) && JSON.stringify(res[k].botones) === tres) && verDesayuno.pantalla === "resumen" && verDesayuno.tipo === "desayuno" && verDesayuno.fruta && !!merienda && merienda.type === "desayuno", JSON.stringify({ res, verDesayuno, merienda: merienda && merienda.type }));

  return H.terminar();
})()
