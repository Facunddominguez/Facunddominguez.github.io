// E15: Etapa 15 del rediseño ("Armame la semana"). C15-1 a C15-5 son los controles E15-presupuestos, E15-un-hueco, E15-reglas, E15-misma-semilla y
// E15-interfaz de docs/validacion/criterios.json. Usan el datos/precios.json REAL incrustado y datos inventados. La app se abre en un marco aparte.
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
  const doc = () => w.document;
  const q = s => { const e = doc().querySelector(s); if (!e) throw Error("no está en la pantalla: " + s + " (pantalla: " + ev("stack.at(-1)") + ")"); return e };
  const tocar = async el => { el.click(); await espera(150) };
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });
  const planPlano = () => JSON.parse(localStorage.getItem("miPlatoFacil_plan") || "{}");
  const llenos = () => { const p = planPlano(); let n = 0; for (const d of Object.keys(p)) for (const s of Object.keys(p[d])) if (p[d][s]) n++; return n };
  const nombres = () => { const p = planPlano(), s = JSON.parse(localStorage.getItem("miPlatoFacil_saved") || "[]"), out = []; for (const d of Object.keys(p)) for (const sl of Object.keys(p[d])) { const it = s.find(x => x.id === p[d][sl]); if (it) out.push(d + "|" + sl + "|" + ev("mealName(" + JSON.stringify(it) + ")")) } return out };
  const armar = async (extra, modo) => { cargar({ ...MARCA, ...extra }); await abrir(); const res = ev(`(() => { const r = ArmameSemana.aplicar(ArmameSemana.armar({ modo: ${JSON.stringify(modo || "todo")} })); return JSON.parse(JSON.stringify({ huecos: r.huecos, llenos: r.llenos, costo: r.costo, presupuesto: r.presupuesto, pasado: r.pasado, reutilizados: r.reutilizados, dobles: r.dobles, txt: ArmameSemana.resumen(r) })) })()`); await espera(100); return res };

  // C15-1 Con presupuestos bajo, medio y alto completa los 28 huecos sin pasarse cuando es posible, y avisa cuando no.
  const bajo = await armar(PRES(26000)), medio = await armar(PRES(40000)), alto = await armar(PRES(90000)), imposible = await armar(PRES(1000));
  const sin = await armar({});
  ok("C15-1 con presupuesto bajo, medio y alto completa los 28 huecos sin pasarse cuando es posible y avisa cuando no",
    [bajo, medio, alto, imposible, sin].every(r => r.huecos === 28 && r.llenos === 28) && llenos() === 28 &&
    [bajo, medio, alto].every(r => !r.pasado && r.costo <= r.presupuesto && /Entra en tu presupuesto/.test(r.txt)) &&
    imposible.pasado && /No llego al presupuesto/.test(imposible.txt) && sin.presupuesto === null && sin.reutilizados >= 3,
    JSON.stringify({ bajo, medio, alto, imposible: { costo: imposible.costo, pasado: imposible.pasado, txt: imposible.txt }, sin: sin.costo }));

  // C15-2 El costo de la semana armada reutiliza al menos 3 ingredientes entre comidas.
  ok("C15-2 la semana armada reutiliza al menos 3 ingredientes entre comidas", medio.reutilizados >= 3 && alto.reutilizados >= 3 && sin.reutilizados >= 3, JSON.stringify([bajo.reutilizados, medio.reutilizados, alto.reutilizados, sin.reutilizados]));

  // C15-3 Mismo resultado para los mismos datos (semilla fija por semana).
  const a1 = await armar(PRES(40000)); const n1 = nombres().join("\n");
  const a2 = await armar(PRES(40000)); const n2 = nombres().join("\n");
  ok("C15-3 con los mismos datos arma la misma semana", n1 === n2 && n1.split("\n").length === 28 && a1.costo === a2.costo, JSON.stringify({ iguales: n1 === n2, c1: a1.costo, c2: a2.costo }));

  // C15-4 Reglas: tipo de comida, filtros, rutina, máximo 2 repeticiones, completar sin pisar lo que había; "cociná doble" cuenta como repetición.
  await armar({ ...PRES(60000), miPlatoFacil_recipePreferences_v1: JSON.stringify({ enabled: true, words: "pollo, cerdo" }), miPlatoFacil_trainingWeek: JSON.stringify({ version: 1, days: [1, 3] }) });
  const saved = JSON.parse(localStorage.getItem("miPlatoFacil_saved")), plan = planPlano();
  const porId = new Map(saved.map(x => [x.id, x]));
  const tipoOk = Object.keys(plan).every(d => ["desayuno", "merienda"].every(s => !plan[d][s] || porId.get(plan[d][s]).type === "desayuno") && ["almuerzo", "cena"].every(s => !plan[d][s] || porId.get(plan[d][s]).type === "plato"));
  const cuentas = {}; for (const l of nombres()) { const n = l.split("|")[2]; cuentas[n] = (cuentas[n] || 0) + 1 }
  const maxRep = Math.max(...Object.values(cuentas));
  const conPollo = saved.filter(x => Object.values(plan).some(d => Object.values(d).includes(x.id)) && /pollo|cerdo/i.test(ev("mealName(" + JSON.stringify(x) + ")") + " " + ev("Semana.extractIngredients(" + JSON.stringify(x) + ")").join(" ")));
  const diaDe = d => (porId.get(plan[d].almuerzo).state || {}).day, rutinaOk = diaDe("lunes") === "Día de entrenamiento" && diaDe("miercoles") === "Día de entrenamiento" && diaDe("martes") === "Día libre";
  // Completar solo los vacíos: lo que había queda igual.
  cargar({ ...MARCA }); await abrir();
  const idea = ev('data.menuCatalog[3].text');
  ev('(() => { const it = IdeasHoja.guardarIdea(data.menuCatalog[3], "Día libre").item; setSlot("martes", "almuerzo", it.id); setSlot("jueves", "cena", it.id) })()'); await espera(80);
  const antesPlan = planPlano();
  ev('ArmameSemana.aplicar(ArmameSemana.armar({ modo: "vacios" }))'); await espera(100);
  const despues = planPlano(), igual = antesPlan.martes.almuerzo === despues.martes.almuerzo && antesPlan.jueves.cena === despues.jueves.cena;
  const cuentaIdea = nombres().filter(l => l.split("|")[2] === idea).length;
  ok("C15-4 respeta tipo de comida, lo que evitás, los días de entrenamiento, no repite más de 2 veces y al completar no pisa lo que había",
    tipoOk && maxRep <= 2 && !conPollo.length && rutinaOk && igual && llenos() === 28 && cuentaIdea <= 2, JSON.stringify({ tipoOk, maxRep, conPollo: conPollo.length, rutinaOk, igual, llenos: llenos(), cuentaIdea }));

  // C15-5 Cambiar un hueco (parecida o más barata) no toca los demás y se puede deshacer.
  await armar(PRES(60000)); await espera(100);
  const antes = planPlano(), costoDe = id => ev(`(() => { const a = cantidadesDeComida("plato", ${JSON.stringify(id)}); return a ? costoDeFilas(a.rows, Semana.portionFactor(null, a) * personasHogar()).costo : null })()`);
  const rb = ev('ArmameSemana.cambiarHueco("miercoles", "cena", "barata")'); await espera(200);
  const trasBarata = planPlano();
  const distintos = []; for (const d of Object.keys(antes)) for (const s of Object.keys(antes[d])) if (antes[d][s] !== trasBarata[d][s]) distintos.push(d + "|" + s);
  const cb = costoDe(antes.miercoles.cena), cn = costoDe(trasBarata.miercoles.cena);
  const hayAviso = /Deshacer/.test(doc().getElementById("planAviso").textContent);
  ev("Semana.deshacerCambioDelPlan()"); await espera(100);
  const trasDeshacer = JSON.stringify(planPlano()) === JSON.stringify(antes);
  const rp = ev('ArmameSemana.cambiarHueco("viernes", "desayuno", "parecida")'); await espera(200);
  const trasParecida = planPlano(), dist2 = []; for (const d of Object.keys(antes)) for (const s of Object.keys(antes[d])) if (antes[d][s] !== trasParecida[d][s]) dist2.push(d + "|" + s);
  ok("C15-5 cambiar un hueco por otra parecida o más barata no toca los demás y se puede deshacer",
    rb.ok && distintos.join() === "miercoles|cena" && (cb === null || cn === null || cn < cb) && hayAviso && trasDeshacer && rp.ok && dist2.join() === "viernes|desayuno", JSON.stringify({ rb, distintos, cb, cn, hayAviso, trasDeshacer, rp, dist2 }));

  // C15-6 Interfaz: botón principal en Semana con a elección completar vacíos o rehacer todo, "Empezar de nuevo" en el menú ⋯, Deshacer.
  cargar({ ...MARCA, ...PRES(60000) }); await abrir();
  ev('openTab("semana")'); await espera(200);
  const boton = q("#plan [data-armame]"), visibleBoton = boton.getClientRects().length > 0 && /Armame la semana/.test(boton.textContent);
  await tocar(boton);
  const opcionesVacia = [...doc().querySelectorAll(".hoja [data-armame-modo]")].map(b => b.dataset.armameModo + ":" + b.textContent);
  await tocar(q('.hoja [data-armame-modo="vacios"]'));
  const lleno = llenos() === 28, avisoDeshacer = /Deshacer/.test(doc().getElementById("planAviso").textContent), estado = doc().getElementById("planStatus").textContent;
  await tocar(boton);
  const opcionesLlena = [...doc().querySelectorAll(".hoja [data-armame-modo]")].map(b => b.dataset.armameModo);
  doc().querySelector(".hoja-fondo [data-hoja-cerrar], .hoja [data-hoja-cerrar]") && doc().querySelector(".hoja-fondo [data-hoja-cerrar], .hoja [data-hoja-cerrar]").click();
  ev("hoja.cerrar()"); await espera(100);
  await tocar(q("#plan [data-plan-menu]"));
  const menu = [...doc().querySelectorAll(".hoja button")].map(b => b.textContent);
  const empezar = [...doc().querySelectorAll(".hoja button")].find(b => b.textContent === "Empezar de nuevo");
  if (empezar) await tocar(empezar);
  const vacio = llenos() === 0, deshacer = /Deshacer/.test(doc().getElementById("planAviso").textContent);
  ok("C15-6 Semana tiene el botón Armame la semana (completar vacíos o rehacer todo), el menú ⋯ tiene Empezar de nuevo y todo tiene Deshacer",
    visibleBoton && opcionesVacia.length === 1 && /^vacios:Completar los 28 huecos vacíos$/.test(opcionesVacia[0]) && lleno && avisoDeshacer && /Listo: 28 comidas/.test(estado) && opcionesLlena.join() === "todo" && !!empezar && vacio && deshacer && !menu.includes("Vaciar la semana"),
    JSON.stringify({ visibleBoton, opcionesVacia, lleno, avisoDeshacer, estado, opcionesLlena, menu, vacio, deshacer }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
