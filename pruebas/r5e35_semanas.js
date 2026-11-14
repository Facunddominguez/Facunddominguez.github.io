// R5 · Etapa 35 (Semanas anteriores y mes): ítems S-01, S-02, S-03, S-04, S-05, S-06 y S-14 de docs/ronda-5-lista.md.
// Mira lo que se ve en la pantalla y lo que queda guardado. Datos inventados y precios congelados.
(async () => {
  const H = R5H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc();
  const pantalla = () => doc().getElementById("planHerramientas");
  const leer = k => JSON.parse(localStorage.getItem(k) || "null");
  const entrar = async () => { ev('openTab("semana")'); await espera(200); await tocar(doc().querySelector("#plan [data-plan-menu]")); await tocar(H.boton(/^Semanas anteriores y mes$/, H.hoja())); await espera(150) };

  await H.abrir({ ...H.MARCA }, { prompt: "Semana prueba" }); await H.armar();
  const lunes = ev("Semana.semanaActual()");
  const menu = await (async () => { ev('openTab("semana")'); await espera(200); await tocar(doc().querySelector("#plan [data-plan-menu]")); const b = H.botonesHoja(); await H.cerrarHoja(); return b })();
  await entrar();

  // R5-S-01 y R5-S-02: sin desplegables y con el contenido a la vista apenas se entra.
  const grid = doc().getElementById("monthlyPlanGrid");
  const textoPantalla = pantalla().innerText;
  ok("R5-S-01 la pantalla no tiene listas desplegables (ni <details> ni <summary>)", pantalla().querySelectorAll("details,summary").length === 0 && H.desplegables(pantalla()).length === 0, "");
  ok("R5-S-02 al entrar se ve el calendario del mes sin tocar nada: no está el botón 'Ver mis semanas en el mes' ni ese título",
    H.visible(grid) && grid.querySelectorAll("button").length >= 28 && !/Ver mis semanas en el mes/.test(pantalla().textContent) && !H.boton(/Ver mis semanas en el mes/, pantalla()), textoPantalla.slice(0, 120));

  // R5-S-03: sin contenido repetido.
  const botonesPantalla = H.botones(/./, pantalla()).map(b => b.textContent.trim().replace(/\s+/g, " "));
  const bAnt = H.boton(/^Semana anterior$/, pantalla()), bSig = H.boton(/^Semana siguiente$/, pantalla()), bGuardar = H.boton(/^Guardar una copia del plan en esta semana$/, pantalla()), indicador = doc().getElementById("datedWeekStartText");
  const ordenOk = grid.getBoundingClientRect().bottom <= bAnt.getBoundingClientRect().top + 1 && H.seSuperponen([bAnt, bSig, bGuardar]) === false && bAnt.getBoundingClientRect().top <= bSig.getBoundingClientRect().top && bSig.getBoundingClientRect().top <= bGuardar.getBoundingClientRect().top && bGuardar.getBoundingClientRect().bottom <= indicador.getBoundingClientRect().top + 1;
  ok("R5-S-03 queda el calendario; debajo 'Semana anterior', 'Semana siguiente' y 'Guardar una copia del plan en esta semana', y el lunes de la semana; sin 'Semanas guardadas', 'Guardar y ver semanas' ni 'Ver o editar esta semana'",
    !!bAnt && !!bSig && !!bGuardar && H.visible(indicador) && indicador.value === lunes.slice(8, 10) + "/" + lunes.slice(5, 7) + "/" + lunes.slice(0, 4) && ordenOk
    && !/Semanas guardadas|Guardar y ver semanas|Ver o editar esta semana|Vista de las copias/.test(pantalla().textContent) && !doc().getElementById("datedWeekList") && !doc().getElementById("monthlyPlanDay"), JSON.stringify({ ordenOk, ind: indicador.value, lunes, vis: H.visible(indicador), txt: pantalla().textContent.match(/Semanas guardadas|Guardar y ver semanas|Ver o editar esta semana|Vista de las copias/) }));

  // R5-S-04: la semana elegida se lista como en Semana (tarjetas por día) una vez guardada la copia.
  await tocar(bGuardar, 300);
  const vista = doc().getElementById("datedWeekView");
  const copia = () => leer("miPlatoFacil_datedWeeks_v1")[lunes];
  const tituloLunes = () => vista.querySelector('[data-fechada-dia="lunes"]').innerText;
  ok("R5-S-04 la copia se ve como en Semana: 7 días con sus 4 tarjetas (28), sin selectores ni botones que abren desplegables",
    !!copia() && vista.querySelectorAll("[data-fechada-dia]").length === 7 && vista.querySelectorAll(".hueco").length === 28 && vista.querySelectorAll("select,details,summary").length === 0 && /Lunes/.test(tituloLunes()) && vista.querySelectorAll(".hueco__plato").length >= 28, tituloLunes().slice(0, 80));

  // R5-S-05: la misma hoja que en Semana; los cambios se guardan en esa copia, no en el plan de esta semana.
  const planActual = localStorage.getItem("miPlatoFacil_plan");
  const hueco = d => vista.querySelector(`[data-hueco="${d}"]`);
  await tocar(hueco("lunes|almuerzo"));
  const hoja1 = H.botonesHoja();
  const idAntes = copia().plan.lunes.almuerzo;
  await tocar(H.boton(/^Quitar$/, H.hoja()), 300);
  const quitado = copia().plan.lunes.almuerzo === null && /Sin elegir/.test(hueco("lunes|almuerzo").textContent);
  await tocar(hueco("lunes|almuerzo"), 300);
  const titulo2 = H.textoHoja().split("\n")[0];
  const elegir = H.hoja().querySelector('[data-selector-seccion="mias"] [data-selector-id]') || H.hoja().querySelector("[data-selector-id]");
  const idElegido = elegir && elegir.dataset.selectorId;
  await tocar(elegir, 300);
  const cambiado = !!idElegido && copia().plan.lunes.almuerzo === idElegido && copia().saved.some(p => p.id === idElegido);
  ok("R5-S-05 tocar una comida abre la misma hoja que en Semana (Ver ingredientes o Ver receta, Cambiar, Cambiar por otra parecida, Cambiar por una más barata, Quitar, Cerrar) y Quitar y Cambiar se guardan en la copia de esa semana sin tocar el plan de esta",
    /^(Ver receta|Ver ingredientes)/.test(hoja1[0]) && JSON.stringify(hoja1.slice(1)) === JSON.stringify(["Cambiar", "Cambiar por otra parecida", "Cambiar por una más barata", "Quitar", "Cerrar"])
    && quitado && /^Elegir /i.test(titulo2) && cambiado && localStorage.getItem("miPlatoFacil_plan") === planActual && Object.keys(leer("miPlatoFacil_datedWeeks_v1")).join() === lunes, JSON.stringify({ hoja1, idAntes, idElegido, titulo2 }));

  // R5-S-06: sin "Cambiar comidas de una semana guardada".
  ok("R5-S-06 no hay 'Cambiar comidas de una semana guardada' ni su panel", !/Cambiar comidas de una semana guardada/.test([...doc().querySelectorAll(".screen")].map(x => x.textContent).join(" ")) && !doc().getElementById("datedEditPanel") && !doc().getElementById("datedEditFields"), "");

  // R5-S-14: "Planes guardados" se usa desde esta pantalla (guardar el plan de la semana vista y aplicar uno guardado) y sale del menú ⋯.
  const sinUsar = H.boton(/^Usar un plan guardado$/, pantalla());
  await tocar(H.boton(/^Guardar este plan con un nombre$/, pantalla()), 300);
  const guardado = (ev("Semana.loadVars()")["Semana prueba"]) || null;
  const igualCopia = !!guardado && JSON.stringify(guardado) === JSON.stringify(ev("loadPlan()"));
  await tocar(hueco("martes|cena")); await tocar(H.boton(/^Quitar$/, H.hoja()), 300);
  const roto = copia().plan.martes.cena === null;
  const usar = H.boton(/^Usar un plan guardado$/, pantalla());
  await tocar(usar); const nombres = H.botonesHoja();
  await tocar(H.boton(/^Semana prueba$/, H.hoja()), 300);
  const restaurado = JSON.stringify(copia().plan.martes) === JSON.stringify(guardado.martes) && localStorage.getItem("miPlatoFacil_plan") === planActual;
  ok("R5-S-14 'Planes guardados' ya no está en el menú ⋯; desde esta pantalla se guarda el plan de la semana vista con un nombre y se aplica uno guardado a esa copia",
    !menu.includes("Planes guardados") && !sinUsar && igualCopia && roto && !!usar && nombres.includes("Semana prueba") && restaurado, JSON.stringify({ menu, sinUsar: !!sinUsar, igualCopia, roto, nombres, restaurado }));

  return H.terminar();
})()
