// R6 · Etapa 48 (Semana flexible): ítems F-01 a F-04 de docs/ronda-6-lista.md.
// Datos inventados; hoy fijo = martes 24/11/2026 (esta semana empieza el lunes 23/11). Mira lo que se ve y lo que queda guardado.
(async () => {
  const H = R6H(), { ok, espera } = H;
  const tocar = async (el, ms) => { if (!el) throw new Error("no hay elemento para tocar · tras " + H.T.length + " pruebas"); return H.tocar(el, ms) };
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const qa = s => [...doc().querySelectorAll(s)];
  const norm = H.norm, J = H.J;
  const AJ = "miPlatoFacil_semanaAjustes_v1", PLANK = "miPlatoFacil_plan", PORC = "miPlatoFacil_planPortions_v1";
  const REC = [
    { id: "recipe_semana6a", titulo: "Guiso de lentejas", filas: [{ name: "Lentejas", quantity: 200, unit: "g" }, { name: "Arroz", quantity: 100, unit: "g" }], rinde: 2 },
    { id: "recipe_semana6b", titulo: "Pollo al horno", filas: [{ name: "Pollo", quantity: 500, unit: "g" }] },
    { id: "recipe_semana6c", titulo: "Tarta de zapallito", filas: [{ name: "Zapallito", quantity: 4, unit: "unidad" }, { name: "Huevo", quantity: 3, unit: "unidad" }] },
  ];
  const A = "rp_recipe_semana6a", B = "rp_recipe_semana6b", C = "rp_recipe_semana6c";
  const PLAN = [["lunes", "cena", A], ["martes", "almuerzo", B], ["miercoles", "cena", C]];
  const base = (extra = {}, plan = PLAN) => ({ ...H.MARCA, ...H.recetas(REC), [PLANK]: JSON.stringify(H.planDe(plan)), ...extra });
  const abrir = async (extra, plan, op) => { await H.abrirEn("2026-11-24", base(extra, plan), op); ev('openTab("semana")'); await espera(300) };
  const plan = () => J(PLANK);
  const hueco = k => doc().querySelector(`[data-hueco="${k}"]`);
  const carta = async k => { ev(`Semana.elegirDiaPlan(${JSON.stringify(k.split("|")[0])}); renderPlan()`); await espera(150); return hueco(k) ? norm(hueco(k).innerText) : "(no hay carta)" };
  const botonHoja = re => H.boton(re, H.hoja());
  const abrirHueco = async k => { ev(`Semana.elegirDiaPlan(${JSON.stringify(k.split("|")[0])}); renderPlan()`); await espera(200); await tocar(hueco(k), 300) };
  const aviso = () => { const a = norm((doc().getElementById("planAviso") || { innerText: "" }).innerText).replace(/\s*Deshacer$/, ""); return a || norm((doc().getElementById("planStatus") || { innerText: "" }).innerText) };
  const elegirEn = async (dia, slot) => { $("hojaPasarDia").value = dia; $("hojaPasarSlot").value = slot };
  const semanaLunes = "2026-11-23";

  // ---- F-01: Pasar a otro día ----
  await abrir();
  await abrirHueco("lunes|cena");
  ok("R6-F-01 la hoja de una comida (Semana) tiene 'Pasar a otro día'", !!botonHoja(/^Pasar a otro día$/), H.botonesHoja().join(" | "));
  await tocar(botonHoja(/^Pasar a otro día$/), 300);
  ok("R6-F-01 'Pasar a otro día' pide día y comida", H.textoHoja().includes("Pasar a otro día") && !!$("hojaPasarDia") && !!$("hojaPasarSlot") && $("hojaPasarDia").value === "martes" && $("hojaPasarSlot").value === "cena");  // arranca en el día siguiente
  await elegirEn("jueves", "cena");
  await tocar(botonHoja(/^Pasar$/), 400);
  const p1 = plan();
  ok("R6-F-01 al pasar a un hueco vacío, la comida se mueve y un aviso de una línea dice qué pasó", p1.lunes.cena === null && p1.jueves.cena === A && /^Pasaste Guiso de lentejas a la cena del jueves\.$/.test(aviso()) && !H.hoja().offsetParent, aviso());
  await abrirHueco("martes|almuerzo");
  await tocar(botonHoja(/^Pasar a otro día$/), 300);
  await elegirEn("miercoles", "cena");
  await tocar(botonHoja(/^Pasar$/), 400);
  const p2 = plan();
  ok("R6-F-01 si el destino tenía algo, se intercambian y el aviso lo dice", p2.martes.almuerzo === C && p2.miercoles.cena === B && /^Cambiaste Pollo al horno con Tarta de zapallito: Pollo al horno ahora está en la cena del miércoles\.$/.test(aviso()), aviso());
  // mismo hueco: error en la hoja, no cambia nada
  await abrirHueco("miercoles|cena");
  await tocar(botonHoja(/^Pasar a otro día$/), 300);
  await elegirEn("miercoles", "cena");
  await tocar(botonHoja(/^Pasar$/), 300);
  ok("R6-F-01 pasar al mismo hueco no cambia nada y la hoja explica por qué", /Elegí otro día u otra comida/.test(H.textoHoja()) && JSON.stringify(plan()) === JSON.stringify(p2));
  await H.cerrarHoja();
  // las porciones van con la comida
  await abrir({ [PORC]: JSON.stringify({ "lunes|cena": 3 }) });
  await abrirHueco("lunes|cena");
  await tocar(botonHoja(/^Pasar a otro día$/), 300);
  await elegirEn("viernes", "almuerzo");
  await tocar(botonHoja(/^Pasar$/), 400);
  ok("R6-F-01 las porciones de la comida viajan con ella", JSON.stringify(J(PORC)) === JSON.stringify({ "viernes|almuerzo": 3 }), JSON.stringify(J(PORC)));
  // Deshacer
  const antesDeshacer = JSON.stringify(plan());
  await tocar(doc().querySelector("#planAviso [data-plan-deshacer]"), 400);
  ok("R6-F-01 el cambio se puede deshacer como los otros cambios de la semana (y vuelve la comida y sus porciones)", JSON.stringify(plan()) !== antesDeshacer && plan().lunes.cena === A && JSON.stringify(J(PORC)) === JSON.stringify({ "lunes|cena": 3 }), localStorage.getItem(PORC));
  // Semanas anteriores y mes: la misma hoja, sobre la copia
  await abrir();
  await tocar(doc().querySelector("#plan [data-plan-menu]")); await tocar(H.boton(/^Semanas anteriores y mes$/, H.hoja())); await espera(200);
  await tocar(H.boton(/^Guardar una copia del plan en esta semana$/, $("planHerramientas")), 400);
  const copia = () => J("miPlatoFacil_datedWeeks_v1")[semanaLunes].plan;
  const planAntes = localStorage.getItem(PLANK);
  await tocar($("datedWeekView").querySelector('[data-hueco="lunes|cena"]'), 300);
  ok("R6-F-01 en Semanas anteriores y mes la hoja también tiene 'Pasar a otro día'", !!botonHoja(/^Pasar a otro día$/), H.botonesHoja().join(" | "));
  await tocar(botonHoja(/^Pasar a otro día$/), 300);
  await elegirEn("sabado", "cena");
  await tocar(botonHoja(/^Pasar$/), 400);
  ok("R6-F-01 en Semanas anteriores y mes se mueve en esa copia (con su aviso) y el plan de esta semana no cambia", copia().sabado.cena === A && copia().lunes.cena === null && localStorage.getItem(PLANK) === planAntes && /Pasaste Guiso de lentejas a la cena del sábado/.test(norm($("datedWeekStatus").innerText)), norm($("datedWeekStatus").innerText));

  // ---- F-02: Comemos afuera ----
  await abrir();
  await abrirHueco("jueves|cena");
  ok("R6-F-02 la hoja de un hueco vacío ofrece 'Comemos afuera'", !!botonHoja(/^Comemos afuera$/), H.botonesHoja().join(" | "));
  await tocar(botonHoja(/^Comemos afuera$/), 300);
  ok("R6-F-02 'Comemos afuera' pide, opcional, cuánto se gastó", /Cuánto se gastó \(opcional\)/.test(H.textoHoja()) && !!$("hojaAfueraGasto"));
  await tocar(botonHoja(/^Guardar$/), 400);
  const cartaAfuera = (await carta("jueves|cena"));
  ok("R6-F-02 sin gasto, el hueco queda marcado 'Afuera' y se guarda solo en la clave nueva (el plan no cambia de formato)", /Afuera/.test(cartaAfuera) && !/Sin elegir/.test(cartaAfuera) && JSON.stringify(J(AJ)) === JSON.stringify({ [semanaLunes]: { afuera: { "jueves|cena": {} } } }) && plan().jueves.cena === null && Object.keys(plan()).length === 7, cartaAfuera + " " + localStorage.getItem(AJ));
  // con gasto
  await abrirHueco("jueves|cena");
  ok("R6-F-02 tocar un hueco afuera abre su hoja, con 'Ya no comemos afuera'", !!botonHoja(/^Ya no comemos afuera$/) && !!botonHoja(/^Elegir una comida$/), H.botonesHoja().join(" | "));
  $("hojaAfueraGasto").value = "12.500";
  await tocar(botonHoja(/^Guardar$/), 400);
  ok("R6-F-02 el gasto anotado se ve en el hueco", /Afuera · \$12\.500/.test((await carta("jueves|cena"))) && J(AJ)[semanaLunes].afuera["jueves|cena"].gasto === 12500, (await carta("jueves|cena")));
  // un hueco afuera no suma a la lista ni al presupuesto y Armame no lo llena
  await abrir({ ...H.PRES(60000), miPlatoFacil_mostrarPrecios_v1: '{"mostrar":true}' }, [["jueves", "cena", A], ["viernes", "cena", B]]);
  const costoAntes = ev("costoSemanaPlan() && costoSemanaPlan().total"), itemsAntes = ev("shoppingDisplayItems().map(x => x.name).sort().join(',')");
  await abrirHueco("jueves|cena");
  await tocar(botonHoja(/^Comemos afuera$/), 300);
  ok("R6-F-02 al marcar afuera un hueco con comida, avisa que la saca; al guardar sale de ahí", /sale de este hueco/.test(H.textoHoja()));
  await tocar(botonHoja(/^Guardar$/), 400);
  const itemsDespues = ev("shoppingDisplayItems().map(x => x.name).sort().join(',')"), costoDespues = ev("costoSemanaPlan() && costoSemanaPlan().total");
  ok("R6-F-02 un hueco afuera no suma a la lista ni al presupuesto (los ingredientes de esa comida salen de la lista y el costo baja)", plan().jueves.cena === null && /Lentejas/.test(itemsAntes) && !/Lentejas/.test(itemsDespues) && /Pollo/.test(itemsDespues) && costoDespues < costoAntes, JSON.stringify({ itemsAntes, itemsDespues, costoAntes, costoDespues }));
  {
    const todos = []; for (const d of H.DIAS) for (const sl of H.SLOTS) if (!(d === "lunes" && sl === "desayuno")) todos.push([d, sl, A]);
    await abrir({ [AJ]: JSON.stringify({ [semanaLunes]: { afuera: { "lunes|desayuno": {} } } }) }, todos);
    const hint = $("planHint");
    ok("R6-F-02 un hueco afuera cuenta como resuelto en la cabecera de Semana: con 27 comidas y 1 afuera no dice 'faltan' ni '27 de 28', y 'Armame la semana' no pasa a ser el botón principal", hint.hidden && !/27 de 28/.test(norm(hint.innerText)) && !!$("planList"), norm(hint.innerText) + " hidden=" + hint.hidden);
  }
  await abrir({}, [["lunes", "cena", A]]);
  await abrirHueco("martes|cena"); await tocar(botonHoja(/^Comemos afuera$/), 300); await tocar(botonHoja(/^Guardar$/), 400);
  ev('openTab("semana")'); await espera(200);
  await ev('(async () => { await ArmameSemana.correr("vacios") })()'); await espera(600);
  const trasArmar = plan(), afueraSigue = J(AJ)[semanaLunes].afuera["martes|cena"];
  ok("R6-F-02 Armame la semana no llena un hueco afuera (ni con 'Rehacer semana')", trasArmar.martes.cena === null && !!afueraSigue && trasArmar.lunes.almuerzo !== null && DIAS_OTROS(trasArmar), JSON.stringify(trasArmar.martes));
  function DIAS_OTROS(p) { return ["miercoles", "jueves", "viernes"].every(d => p[d].cena) }
  await ev('(async () => { await ArmameSemana.correr("todo") })()'); await espera(600);
  ok("R6-F-02 'Rehacer semana' (todo) tampoco lo llena", plan().martes.cena === null && !!(J(AJ) || {})[semanaLunes] && !!J(AJ)[semanaLunes].afuera["martes|cena"], JSON.stringify(plan().martes) + " " + localStorage.getItem(AJ));
  // gasto en el Registro, separado de las compras
  await abrir({ ...H.PRES(60000), [AJ]: JSON.stringify({ [semanaLunes]: { afuera: { "jueves|cena": { gasto: 12500 }, "viernes|cena": { gasto: 8000 }, "sabado|almuerzo": {} } } }) });
  ev('openTab("mas"); abrirRegistro()'); await espera(400);
  const registro = norm($("registro").innerText);
  ok("R6-F-02 el Registro muestra el gasto de comidas afuera de la semana, separado de las compras", /Comidas afuera esa semana: 3 · \$20\.500 \(en 1 no lo anotaste\)\. Va aparte de las compras\./.test(registro), registro.slice(registro.indexOf("Comidas afuera") - 20, registro.indexOf("Comidas afuera") + 140));
  // una marca vieja (el hueco ya tiene comida) no cuenta en el Registro
  await abrir({ [AJ]: JSON.stringify({ [semanaLunes]: { afuera: { "jueves|cena": { gasto: 999 }, "viernes|cena": {} } } }) }, [["jueves", "cena", A]]);
  ev('openTab("mas"); abrirRegistro()'); await espera(400);
  ok("R6-F-02 una marca 'Afuera' vieja (el hueco ya tiene una comida) no cuenta en el Registro", /Comidas afuera esa semana: 1 · sin gasto anotado/.test(norm($("registro").innerText)), norm($("registro").innerText).slice(-200));
  // Ya no comemos afuera
  await abrir({ [AJ]: JSON.stringify({ [semanaLunes]: { afuera: { "jueves|cena": { gasto: 12500 } } } }) });
  await abrirHueco("jueves|cena");
  await tocar(botonHoja(/^Ya no comemos afuera$/), 400);
  ok("R6-F-02 'Ya no comemos afuera' lo saca: el hueco vuelve a 'Sin elegir' y la clave se borra si queda vacía", /Sin elegir/.test((await carta("jueves|cena"))) && localStorage.getItem(AJ) === null, localStorage.getItem(AJ));
  // elegir una comida en un hueco afuera lo saca de afuera
  await abrir({ [AJ]: JSON.stringify({ [semanaLunes]: { afuera: { "jueves|cena": {} } } }) });
  ev('setSlot("jueves", "cena", ' + JSON.stringify(A) + ')'); await espera(200);
  ok("R6-F-02 si se elige una comida para un hueco afuera, deja de ser afuera", !localStorage.getItem(AJ) && !/Afuera/.test((await carta("jueves|cena"))), localStorage.getItem(AJ));
  // semana que viene: la marca es de esa semana
  await abrir();
  ev("Semana.verSemana(1)"); await espera(300);
  await abrirHueco("lunes|cena"); await tocar(botonHoja(/^Comemos afuera$/), 300); await tocar(botonHoja(/^Guardar$/), 400);
  ok("R6-F-02 en la semana que viene la marca va en el lunes de esa semana y no toca esta", Object.keys(J(AJ)).join() === "2026-11-30", localStorage.getItem(AJ));
  // Hoy lo muestra
  await abrir({ [AJ]: JSON.stringify({ [semanaLunes]: { afuera: { "martes|cena": { gasto: 5000 } } } }) });
  ev('openTab("hoy")'); await espera(400);
  ok("R6-F-02 Hoy también marca el hueco afuera", /Afuera · \$5\.000/.test(norm($("todayRows").innerText)), norm($("todayRows").innerText).slice(0, 200));

  // ---- F-03: Que sobre para mañana ----
  await abrir();
  await abrirHueco("lunes|cena");
  ok("R6-F-03 la hoja de una cena tiene 'Que sobre para mañana'", !!botonHoja(/^Que sobre para mañana$/), H.botonesHoja().join(" | "));
  await tocar(botonHoja(/^Que sobre para mañana$/), 300);
  ok("R6-F-03 si el almuerzo de mañana tenía algo (Pollo al horno), pregunta antes de reemplazarlo y no cambia nada hasta confirmar", /Pollo al horno/.test(H.textoHoja()) && /¿Querés reemplazarlo\?/.test(H.textoHoja()) && plan().martes.almuerzo === B);
  await tocar(botonHoja(/^No, dejarlo$/), 300);
  ok("R6-F-03 'No, dejarlo' no cambia nada", plan().martes.almuerzo === B && localStorage.getItem(AJ) === null);
  await abrirHueco("lunes|cena"); await tocar(botonHoja(/^Que sobre para mañana$/), 300); await tocar(botonHoja(/^Reemplazar$/), 400);
  const cartaSobra = (await carta("martes|almuerzo"));
  ok("R6-F-03 al confirmar, la misma comida queda en el almuerzo de mañana con la marca 'Sobra de la cena del lunes'", plan().martes.almuerzo === A && plan().lunes.cena === A && /Sobra de la cena del lunes/.test(cartaSobra) && J(AJ)[semanaLunes].sobra["martes|almuerzo"] === "lunes|cena", cartaSobra + " " + localStorage.getItem(AJ));
  ok("R6-F-03 el aviso dice qué pasó", /Sobra para mañana: Guiso de lentejas también es el almuerzo del martes\./.test(aviso()), aviso());
  const items = ev("shoppingDisplayItems('esta').find(x => x.name === 'Lentejas')");
  ok("R6-F-03 la lista cuenta las porciones de los dos huecos, como 'cociná doble' de Armame (200 g + 200 g de lentejas)", ev("shoppingDisplayItems().find(x => x.name === 'Lentejas').units.get('g')") === 400, JSON.stringify(ev("[...shoppingDisplayItems().find(x => x.name === 'Lentejas').units]")));
  // sin pregunta si mañana está vacío; en un almuerzo; y el domingo no
  await abrir({}, [["miercoles", "almuerzo", C]]);
  await abrirHueco("miercoles|almuerzo"); await tocar(botonHoja(/^Que sobre para mañana$/), 400);
  const cartaJueves = await carta("jueves|almuerzo");
  ok("R6-F-03 si mañana está vacío no pregunta, y también sirve para el almuerzo ('Sobra del almuerzo del miércoles')", plan().jueves.almuerzo === C && /Sobra del almuerzo del miércoles/.test(cartaJueves) && !H.hoja().offsetParent, JSON.stringify({ j: plan().jueves.almuerzo, cartaJueves, hoja: !!H.hoja().offsetParent, aviso: aviso() }));
  await abrir({}, [["domingo", "cena", C]]);
  await abrirHueco("domingo|cena");
  ok("R6-F-03 el domingo no ofrece 'Que sobre para mañana' (no hay mañana en esa semana) y el desayuno tampoco", !botonHoja(/^Que sobre para mañana$/));
  await H.cerrarHoja();
  await abrir({}, [["lunes", "desayuno", C]]);
  await abrirHueco("lunes|desayuno");
  ok("R6-F-03 el desayuno no ofrece 'Que sobre para mañana'", !botonHoja(/^Que sobre para mañana$/));
  await H.cerrarHoja();
  // si se cambia la comida de uno de los dos huecos por otro camino, la marca deja de verse
  await abrir({ [AJ]: JSON.stringify({ [semanaLunes]: { sobra: { "martes|almuerzo": "lunes|cena" } } }) }, [["lunes", "cena", A], ["martes", "almuerzo", A]]);
  const veia = /Sobra de la cena del lunes/.test((await carta("martes|almuerzo")));
  ev('setSlot("lunes", "cena", ' + JSON.stringify(B) + ')'); await espera(200);
  ok("R6-F-03 si uno de los dos huecos cambia de comida, la marca 'Sobra de…' deja de verse", veia && !/Sobra de/.test((await carta("martes|almuerzo"))));

  // ---- F-04: el plan guardado no cambia de formato; respaldo ----
  await abrir();
  await abrirHueco("jueves|cena"); await tocar(botonHoja(/^Comemos afuera$/), 300); await tocar(botonHoja(/^Guardar$/), 400);
  await abrirHueco("lunes|cena"); await tocar(botonHoja(/^Que sobre para mañana$/), 300); try { await tocar(botonHoja(/^Reemplazar$/), 400) } catch (e) { }
  const guardado = plan(), formato = Object.keys(guardado).sort().join() === "domingo,jueves,lunes,martes,miercoles,sabado,viernes" && Object.values(guardado).every(d => Object.keys(d).sort().join() === "almuerzo,cena,desayuno,merienda" && Object.values(d).every(v => v === null || typeof v === "string"));
  ok("R6-F-04 el plan guardado sigue con su formato de siempre (día → comida → id o nulo); 'Afuera' y 'Sobra de' viven solo en la clave nueva", formato && !/afuera|sobra/i.test(localStorage.getItem(PLANK)) && /afuera/.test(localStorage.getItem(AJ)) && /sobra/.test(localStorage.getItem(AJ)), localStorage.getItem(AJ));
  const R0 = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json(), w = H.w();
  const conClave = JSON.parse(JSON.stringify(R0)); conClave.data[AJ] = JSON.stringify({ [semanaLunes]: { afuera: { "jueves|cena": { gasto: 100 } }, sobra: { "martes|almuerzo": "lunes|cena" } } });
  const malo = JSON.parse(JSON.stringify(R0)); malo.data[AJ] = '{"2026-11-23":{"afuera":{"jueves|cena":{"gasto":-5}}}}';
  const malo2 = JSON.parse(JSON.stringify(R0)); malo2.data[AJ] = '{"2026-11-23":{"plan":{}}}';
  let restauroCon = false, restauroViejo = false, rechazoMalo = false, rechazoMalo2 = false;
  try { w.Respaldo.restoreCompleteBackup(conClave, w.localStorage); restauroCon = w.localStorage.getItem(AJ) === conClave.data[AJ] } catch (e) { }
  const exportado = JSON.parse(JSON.stringify(w.eval("completeBackupSnapshot(localStorage)")));
  w.localStorage.removeItem(AJ);
  try { w.Respaldo.restoreCompleteBackup(JSON.parse(JSON.stringify(R0)), w.localStorage); restauroViejo = true } catch (e) { }
  try { w.Respaldo.restoreCompleteBackup(malo, w.localStorage) } catch (e) { rechazoMalo = true }
  try { w.Respaldo.restoreCompleteBackup(malo2, w.localStorage) } catch (e) { rechazoMalo2 = true }
  ok("R6-F-04 la clave nueva entra al respaldo como opcional: se exporta, se restaura, un respaldo viejo sin ella se restaura igual y uno con formato malo se rechaza",
    restauroCon && exportado.data[AJ] === conClave.data[AJ] && restauroViejo && rechazoMalo && rechazoMalo2 && w.eval("COMPLETE_BACKUP_KEYS.includes('" + AJ + "') && COMPLETE_BACKUP_OPTIONAL_KEYS.includes('" + AJ + "')"), JSON.stringify({ restauroCon, restauroViejo, rechazoMalo, rechazoMalo2 }));
  return H.terminar();
})()
