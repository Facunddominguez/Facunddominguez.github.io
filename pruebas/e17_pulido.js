// E17: Etapa 17 del rediseño (Pulido de pantalla). C17-1 a C17-3 son los controles E17-barra-de-pasos, E17-un-solo-interruptor y E17-atajos-de-hoy de
// docs/validacion/criterios.json. Los anchos 360 y 320 los mide la compuerta con capturas.mjs (control E17-anchos). La app se abre en un marco aparte.
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
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const visible = e => !!e && e.getClientRects().length > 0 && w.getComputedStyle(e).visibility !== "hidden";
  const barra = () => doc().getElementById("bottom"), atras = () => barra().querySelector("[data-back]"), pestanas = () => doc().getElementById("sectionNav");

  // C17-1 La barra de pasos: sin "Volver al paso anterior" en el paso 1, nunca apilada sobre las pestañas, sin tapar el último botón.
  cargar(MARCA); await abrir();
  ev('start("desayuno")'); await espera(250);
  const paso1 = { pantalla: ev("stack.at(-1)"), atrasVisible: visible(barra()) && visible(atras()), continuar: visible(doc().getElementById("nextBottom")), pestanas: visible(pestanas()) };
  ev('go("bf_prot")'); await espera(250);
  const paso2 = { atrasVisible: visible(barra()) && visible(atras()), pestanas: visible(pestanas()), barraAbajo: Math.round(barra().getBoundingClientRect().bottom) };
  const ultimo = [...doc().querySelectorAll("#bf_prot .choice")].filter(visible).pop(); ultimo.scrollIntoView({ block: "end" }); w.scrollTo(0, doc().documentElement.scrollHeight); await espera(150);
  const tapado = ultimo.getBoundingClientRect().bottom > barra().getBoundingClientRect().top + 1;
  // Sin rutina el armado de almuerzo empieza en "day" (elegir tipo de día): ahí no hace falta barra.
  ev("restart()"); await espera(100); ev('start("plato")'); await espera(250);
  const dia = { pantalla: ev("stack.at(-1)"), barra: visible(barra()), pestanas: visible(pestanas()) };
  // Con rutina conocida empieza en Verduras: sin "Volver", con "Continuar".
  cargar({ ...MARCA, miPlatoFacil_trainingWeek: JSON.stringify({ version: 1, days: [0, 1, 2, 3, 4, 5, 6] }) }); await abrir();
  ev('start("plato")'); await espera(250);
  const veg = { pantalla: ev("stack.at(-1)"), atrasVisible: visible(barra()) && visible(atras()), continuar: visible(doc().getElementById("nextBottom")), pestanas: visible(pestanas()) };
  // Volver desde la hoja de edición del resumen sigue funcionando: del paso 2 vuelve al paso 1.
  cargar(MARCA); await abrir();
  ev('start("desayuno")'); await espera(150); ev('go("bf_prot")'); await espera(150);
  atras().click(); await espera(200);
  const vuelve = ev("stack.at(-1)");
  ok("C17-1 sin \"Volver al paso anterior\" en el paso 1; la barra de pasos reemplaza a las pestañas (no se apilan) y no tapa el último botón",
    paso1.pantalla === "bf_fruit" && !paso1.atrasVisible && paso1.continuar && !paso1.pestanas && paso2.atrasVisible && !paso2.pestanas && paso2.barraAbajo === 844 && !tapado &&
    dia.pantalla === "day" && !dia.barra && veg.pantalla === "lunch_veg" && !veg.atrasVisible && veg.continuar && !veg.pestanas && vuelve === "bf_fruit",
    JSON.stringify({ paso1, paso2, tapado, dia, veg, vuelve }));

  // C17-2 Un solo interruptor "Herramientas avanzadas", en Preferencias, sin carteles repetidos en las demás pantallas.
  cargar(MARCA); await abrir();
  const notas = doc().querySelectorAll("[data-mode-note]").length;
  const conTexto = [...doc().querySelectorAll("body *:not(script):not(style)")].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && /herramientas avanzadas/i.test(n.textContent)));
  const ids = conTexto.map(e => (e.closest("[id]") || {}).id + ">" + e.className);
  ev('openTab("mas"); go("preferencias")'); await espera(200);
  const toggle = doc().getElementById("uiModeToggle"), enPref = !!toggle && !!toggle.closest("#preferencias") && visible(toggle);
  const lblModo = toggle ? toggle.querySelector(".tool-button__label").textContent : "";
  ok("C17-2 el interruptor de herramientas avanzadas aparece en un solo lugar (Preferencias) y no hay carteles repetidos en las demás pantallas",
    notas === 0 && conTexto.length === 1 && enPref && /herramientas avanzadas/i.test(lblModo), JSON.stringify({ notas, ids, enPref, lblModo }));

  // C17-3 Atajos de Hoy: los botones "Desayuno o merienda" y "Almuerzo o cena" entran en un renglón y no sobresalen de su tarjeta.
  cargar(MARCA); await abrir();
  ev('openTab("hoy")'); await espera(250);
  const bs = [...doc().querySelectorAll('#home [data-start="desayuno"], #home [data-start="plato"]')], tarjeta = doc().querySelector("#home .armar-comida").getBoundingClientRect();
  const medidas = bs.map(b => { const r = b.getBoundingClientRect(); return { h: Math.round(r.height), dentro: r.left >= tarjeta.left - 1 && r.right <= tarjeta.right + 1 } });
  ok("C17-3 los atajos de Hoy tienen botones de un renglón, de 44 px o más y dentro de su tarjeta", bs.length === 2 && medidas.every(m => m.h <= 56 && m.h >= 44 && m.dentro), JSON.stringify(medidas));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
