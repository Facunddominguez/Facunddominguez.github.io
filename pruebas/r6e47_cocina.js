// R6 · Etapa 47 (Modo cocina y ficha de receta): ítems C-01 a C-07 de docs/ronda-6-lista.md.
// Datos inventados; hoy fijo = jueves 26/11/2026. Mira lo que se ve en pantalla (botones, textos, medidas) y lo que queda guardado.
(async () => {
  const H = R6H(), { ok, espera } = H;
  const tocar = async (el, ms) => { if (!el) throw new Error("no hay elemento para tocar · tras " + H.T.length + " pruebas · " + (new Error().stack.split("\n")[3] || "").trim().slice(-40)); return H.tocar(el, ms) };
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const qa = s => [...doc().querySelectorAll(s)];
  const norm = H.norm;
  const REC = [
    { id: "recipe_cocina6a", titulo: "Guiso de lentejas", filas: [{ name: "Lentejas", quantity: 200, unit: "g" }, { name: "Arroz", quantity: 100, unit: "g" }],
      pasos: ["Remojá las lentejas 10 minutos.", "Hervilas 1 hora con el arroz.", "Dejá reposar media hora.", "Cocinalas de 5 a 7 min más y serví."] },
    { id: "recipe_cocina6b", titulo: "Ensalada sin pasos", filas: [{ name: "Lechuga", quantity: 1, unit: "unidad" }], pasos: [] },
    { id: "recipe_cocina6c", titulo: "Tarta de zapallito", filas: [{ name: "Zapallito", quantity: 4, unit: "unidad" }, { name: "Huevo", quantity: 3, unit: "unidad" }], pasos: ["Mezclá todo.", "Horneá 40 minutos."] },
  ];
  const BASE = { ...H.MARCA, ...H.recetas(REC), miPlatoFacil_plan: JSON.stringify(H.planDe([["jueves", "cena", "rp_recipe_cocina6a"]])) };
  const abrir = async (extra = {}, op = {}) => { await H.abrirEn("2026-11-26", { ...BASE, ...extra }, op); };
  const ficha = async (origen, id) => { ev(`Comidas.abrirComida(${JSON.stringify(origen)}, ${JSON.stringify(id)})`); await espera(300) };
  const visible = H.visible;
  const arriba = e => e.getBoundingClientRect().top;
  const boton = (re, raiz) => H.boton(re, raiz);
  const txt = e => norm(e ? e.innerText : "");
  const cocina = () => $("modoCocina");
  const siguiente = async () => { await tocar(doc().querySelector("[data-cocina-siguiente]"), 150) };
  const cerrarCocina = async () => { const s = doc().querySelector("#modoCocina [data-cocina-salir]"); if (s) await tocar(s, 150) };

  // ---- C-01: ingredientes y pasos primero; Ver en el registro, Compartir y ⋯ después de los pasos ----
  await abrir();
  await ficha("plato", "rp_recipe_cocina6a");
  const regP = doc().querySelector("#comidaRegistro button"), compP = doc().querySelector("[data-comida-compartir]"), menuP = doc().querySelector("[data-comida-menu]");
  ok("R6-C-01 en la ficha de una comida, los ingredientes y los pasos van primero; Ver en el registro, Compartir y ⋯ van después de los pasos",
    visible($("comidaComponentes")) && visible($("comidaPasosLista")) && /Ver en el registro/.test(txt(regP)) && arriba($("comidaComponentes")) < arriba($("comidaPasosLista")) && arriba($("comidaPasosLista")) < arriba(regP) && arriba($("comidaPasosLista")) < arriba(compP) && arriba($("comidaPasosLista")) < arriba(menuP) && /Remojá las lentejas/.test(txt($("comidaPasosLista"))),
    JSON.stringify([arriba($("comidaComponentes")), arriba($("comidaPasosLista")), arriba(regP), arriba(compP), arriba(menuP)]));
  await ficha("receta", "recipe_cocina6a");
  const regR = doc().querySelector("#comidaRegistro button"), compR = doc().querySelector("[data-comida-compartir]"), menuR = doc().querySelector("[data-comida-menu]");
  ok("R6-C-01 en la ficha de una receta pasa lo mismo: ingredientes y preparación primero; Ver en el registro, Compartir y ⋯ después de los pasos",
    visible($("recipeReadIngredients")) && visible($("recipeReadSteps")) && arriba($("recipeReadIngredients")) < arriba($("recipeReadSteps")) && arriba($("recipeReadSteps")) < arriba(regR) && arriba($("recipeReadSteps")) < arriba(compR) && arriba($("recipeReadSteps")) < arriba(menuR) && visible(regR) && visible(compR) && visible(menuR),
    JSON.stringify([arriba($("recipeReadIngredients")), arriba($("recipeReadSteps")), arriba(regR), arriba(compR), arriba(menuR)]));
  ok("R6-C-01 los botones de la receta (Editar, Duplicar, Lo comí…) siguen ahí, después de los pasos, y solo se ven con la receta abierta", ["recipeReadEdit", "recipeReadDuplicate", "recipeReadToShopping", "recipeReadCookNow"].every(id => visible($(id)) && arriba($(id)) > arriba($("recipeReadSteps"))), ["recipeReadEdit", "recipeReadDuplicate", "recipeReadToShopping", "recipeReadCookNow"].map(id => id + ":" + visible($(id)) + ":" + Math.round(arriba($(id)))).join(" ") + " pasos " + Math.round(arriba($("recipeReadSteps"))));
  await ficha("plato", "rp_recipe_cocina6a");
  ok("R6-C-01 al ver una comida (no una receta) esos botones de la receta no se ven", !visible($("recipeReadEdit")) && !visible($("recipeReadCookNow")) && visible(doc().querySelector("#comidaPlatoAcciones button")));

  // ---- C-02: si ya está en la semana que se ve, se lee "En la semana: jueves, cena" ----
  await ficha("plato", "rp_recipe_cocina6a");
  const enSem = doc().querySelector("[data-comida-en-semana]"), otra = doc().querySelector("[data-comida-agregar]");
  ok("R6-C-02 una comida que ya está en la semana dice 'En la semana: jueves, cena' en lugar de 'Agregar a la semana', y agregarla otra vez queda como botón secundario",
    visible(enSem) && /En la semana: jueves, cena/.test(txt(enSem)) && visible(otra) && txt(otra) === "Agregar otra vez" && otra.classList.contains("button--soft") && !otra.classList.contains("button--primary") && !qa("#comidaPrincipal button").some(b => visible(b) && /^📅 Agregar a la semana$/.test(txt(b))), txt(enSem) + " | " + txt(otra));
  await ficha("receta", "recipe_cocina6a");
  ok("R6-C-02 lo mismo en la ficha de la receta (cuenta sus copias en la semana)", /En la semana: jueves, cena/.test(txt(doc().querySelector("[data-comida-en-semana]"))) && visible(doc().querySelector("[data-comida-en-semana]")));
  await ficha("plato", "rp_recipe_cocina6c");
  const agregarC = doc().querySelector("[data-comida-agregar]");
  ok("R6-C-02 una comida que no está en la semana sigue con '📅 Agregar a la semana' (y no dice 'En la semana')", visible(agregarC) && /Agregar a la semana/.test(txt(agregarC)) && !visible(doc().querySelector("[data-comida-en-semana]")));
  await ficha("plato", "rp_recipe_cocina6a");
  await tocar(doc().querySelector("[data-comida-agregar]"), 300);
  ok("R6-C-02 'Agregar otra vez' abre la hoja de siempre para elegir día y comida", /Agregar a la semana/.test(H.textoHoja()) && !!doc().getElementById("hojaComidaDia"), H.textoHoja().slice(0, 80));
  await H.cerrarHoja();
  await tocar(doc().querySelector("[data-comida-en-semana]"), 400);
  ok("R6-C-02 tocar 'En la semana: …' lleva a Semana", ev("activeTab") === "semana" && ev("stack.at(-1)") === "plan", ev("activeTab") + " " + ev("stack.at(-1)"));

  // ---- C-03: Cocinar (solo con pasos) y la pantalla completa ----
  await abrir();
  await ficha("plato", "rp_recipe_cocina6c");
  const cocinarP = { visible: visible(doc().querySelector("[data-comida-cocinar]")), primario: doc().querySelector("[data-comida-cocinar]").classList.contains("button--primary"), texto: txt(doc().querySelector("[data-comida-cocinar]")) };
  await ficha("receta", "recipe_cocina6a");
  const cocinarR = { visible: visible(doc().querySelector("[data-comida-cocinar]")), primario: doc().querySelector("[data-comida-cocinar]").classList.contains("button--primary") };
  await ficha("plato", "rp_recipe_cocina6b");
  const sinPasos = visible(doc().querySelector("[data-comida-cocinar]")), agregarSin = doc().querySelector("[data-comida-agregar]");
  ok("R6-C-03 toda comida y receta con pasos tiene el botón principal 'Cocinar'; sin pasos no aparece (y entonces 'Agregar a la semana' pasa a ser el principal)", cocinarP.visible && cocinarR.visible && cocinarP.primario && cocinarR.primario && /Cocinar/.test(cocinarP.texto) && !sinPasos && /Agregar a la semana/.test(txt(agregarSin)) && agregarSin.classList.contains("button--primary"), JSON.stringify({ cocinarP, cocinarR, sinPasos, agregar: txt(agregarSin) }));
  await ficha("plato", "rp_recipe_cocina6a");
  const antesLS = JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)]));
  await tocar(doc().querySelector("[data-comida-cocinar]"), 300);
  const r = cocina() && cocina().getBoundingClientRect(), w = H.w();
  ok("R6-C-03 'Cocinar' abre una pantalla completa que tapa todo lo demás", !!cocina() && Math.round(r.width) === w.innerWidth && Math.round(r.height) === w.innerHeight && w.getComputedStyle(cocina()).position === "fixed" && w.document.elementFromPoint(10, 10).closest("#modoCocina") && w.document.elementFromPoint(w.innerWidth - 10, w.innerHeight - 10).closest("#modoCocina"), r && JSON.stringify([r.width, r.height]));
  const filasIng = qa("#modoCocina .cocina__ingrediente");
  ok("R6-C-03 primero los ingredientes con las cantidades de la ficha y un tilde cada uno", filasIng.length === 2 && /Lentejas: 200 g/.test(txt(filasIng[0])) && /Arroz: 100 g/.test(txt(filasIng[1])) && filasIng.every(f => f.querySelector("input[type=checkbox]")) && txt($("cocinaProgreso")) === "Ingredientes", filasIng.map(txt).join(" | "));
  const cb = filasIng[0].querySelector("input"); await tocar(cb, 100);
  ok("R6-C-03 cada ingrediente se tilda y se destilda", cb.checked && filasIng[0].classList.contains("is-hecho") && (await (async () => { await tocar(cb, 100); return !cb.checked })()));
  await siguiente();
  const paso1 = doc().querySelector("#modoCocina .cocina__paso"), tam = parseFloat(w.getComputedStyle(paso1).fontSize);
  ok("R6-C-03 después, un paso por pantalla, con letra de al menos 20 px y el contador '1 de 4'", /Remojá las lentejas/.test(txt(paso1)) && tam >= 20 && txt($("cocinaProgreso")) === "1 de 4" && qa("#modoCocina .cocina__paso").length === 1, tam + " " + txt($("cocinaProgreso")));
  await siguiente(); await siguiente();
  const prog3 = txt($("cocinaProgreso"));
  await tocar(doc().querySelector("[data-cocina-anterior]"), 100);
  ok("R6-C-03 Siguiente y Anterior recorren los pasos ('3 de 4', y Anterior vuelve al '2 de 4'), y en los ingredientes Anterior no se puede usar", prog3 === "3 de 4" && txt($("cocinaProgreso")) === "2 de 4" && /Hervilas/.test(txt(doc().querySelector("#modoCocina .cocina__paso"))));
  await cerrarCocina();
  ok("R6-C-03 Salir cierra el modo cocina sin guardar nada", !cocina() && JSON.stringify(Object.keys(localStorage).sort().map(k => [k, localStorage.getItem(k)])) === antesLS && qa("details").filter(visible).length === 0);

  // ---- C-04: temporizador ----
  const tp = ev('(f => ["Remojá 10 minutos.", "Hervilas 1 hora.", "Dejá reposar media hora.", "Cocinalas de 5 a 7 min más.", "Horneá 1 hora y media.", "Esperá 45 segundos.", "Cociná 2 huevos a fuego medio.", "Horno a 180 grados.", "Mezclá bien.", "Dejá 20 min y después 1 hora", "Freí de 10 a 15 minutos", "Un cuarto de hora de reposo"].map(t => ModoCocina.tiempoDePaso(t)))()');
  ok("R6-C-04 el tiempo de un paso se entiende: 10 minutos, 1 hora, media hora, 5 a 7 min (el menor), 1 hora y media, segundos; y no confunde huevos ni grados", JSON.stringify(tp) === JSON.stringify([600, 3600, 1800, 300, 5400, 45, null, null, null, 1200, 600, 900]), JSON.stringify(tp));
  await ficha("plato", "rp_recipe_cocina6a");
  await tocar(doc().querySelector("[data-comida-cocinar]"), 300);
  let reloj = 1000; w.ModoCocina.reloj = () => reloj;
  const vib = []; Object.defineProperty(w.navigator, "vibrate", { configurable: true, value: p => { vib.push(p); return true } });
  await siguiente();
  const visor = () => $("cocinaTiempo"), botonesT = () => ["Iniciar", "Pausar", "Reiniciar"].map(n => qa("#modoCocina .cocina__tiempo-botones button").find(b => txt(b) === n));
  const t1 = txt(visor());
  ok("R6-C-04 un paso que dice un tiempo trae un temporizador con ese tiempo y los botones Iniciar, Pausar y Reiniciar", t1 === "10:00" && botonesT().every(b => b && visible(b) && b.getBoundingClientRect().height >= 44) && botonesT()[1].disabled && !botonesT()[0].disabled, t1);
  await tocar(botonesT()[0], 100);
  reloj += 3000; w.ModoCocina.tick();
  const t2 = txt(visor());
  await tocar(botonesT()[1], 100);
  reloj += 20000; w.ModoCocina.tick();
  const t3 = txt(visor());
  await tocar(botonesT()[0], 100);
  reloj += 5000; w.ModoCocina.tick();
  const t4 = txt(visor());
  ok("R6-C-04 Iniciar cuenta hacia atrás, Pausar lo detiene y Iniciar sigue desde donde quedó", t2 === "9:57" && t3 === "9:57" && t4 === "9:52", [t2, t3, t4].join(" "));
  reloj += 700000; w.ModoCocina.tick();
  const tf = txt(visor());
  reloj += 5000; w.ModoCocina.tick();
  ok("R6-C-04 al llegar a cero se ve '¡Listo!' y vibra una sola vez", tf === "¡Listo!" && vib.length === 1 && txt(visor()) === "¡Listo!" && visor().classList.contains("is-listo"), tf + " " + vib.length);
  await tocar(botonesT()[2], 100);
  ok("R6-C-04 Reiniciar vuelve al tiempo del paso", txt(visor()) === "10:00" && !botonesT()[0].disabled);
  await siguiente();
  const tHora = txt(visor()); await siguiente(); const tMedia = txt(visor()); await siguiente(); const tRango = txt(visor());
  ok("R6-C-04 '1 hora' (1:00:00), 'media hora' (30:00) y '5 a 7 min' (5:00: en un rango, el menor)", tHora === "1:00:00" && tMedia === "30:00" && tRango === "5:00", [tHora, tMedia, tRango].join(" "));
  await tocar(doc().querySelector("[data-cocina-anterior]"), 100); await tocar(doc().querySelector("[data-cocina-anterior]"), 100); await tocar(doc().querySelector("[data-cocina-anterior]"), 100);
  ok("R6-C-04 un temporizador sigue andando aunque se cambie de paso y al volver mantiene su estado", txt(visor()) === "10:00" || txt(visor()) === "¡Listo!");
  await cerrarCocina();

  // ---- C-05: la pantalla no se apaga mientras está abierto ----
  await abrir();
  let pedidos = 0, soltados = 0;
  const w5 = H.w(); const erroresPag = []; w5.addEventListener("error", e => erroresPag.push(e.message)); w5.addEventListener("unhandledrejection", e => erroresPag.push(String(e.reason)));
  Object.defineProperty(w5.navigator, "wakeLock", { configurable: true, value: { request: async tipo => { pedidos++; return { release: async () => { soltados++ } } } } });
  await ficha("receta", "recipe_cocina6c");
  await tocar(doc().querySelector("[data-comida-cocinar]"), 400);
  const durante = { pedidos, soltados };
  await cerrarCocina(); await espera(100);
  ok("R6-C-05 mientras el modo cocina está abierto se pide que la pantalla no se apague, y al salir se libera", durante.pedidos === 1 && durante.soltados === 0 && soltados === 1, JSON.stringify({ durante, soltados }));
  Object.defineProperty(w5.navigator, "wakeLock", { configurable: true, value: undefined });
  await tocar(doc().querySelector("[data-comida-cocinar]"), 300); await cerrarCocina();
  Object.defineProperty(w5.navigator, "wakeLock", { configurable: true, value: { request: async () => { const e = new Error("no"); e.name = "NotAllowedError"; throw e } } });
  await tocar(doc().querySelector("[data-comida-cocinar]"), 300);
  const textoPantalla = norm(cocina().innerText);
  await cerrarCocina(); await espera(100);
  ok("R6-C-05 donde el navegador no tiene Wake Lock o lo rechaza no aparece ningún error (ni en pantalla ni en la consola de la página)", erroresPag.length === 0 && !/error|no se pudo/i.test(textoPantalla), JSON.stringify(erroresPag));

  // ---- C-06: el último paso termina con Lo comí y Salir ----
  const estado = () => ({ cooking: JSON.parse(localStorage.getItem("miPlatoFacil_cookingHistory_v1") || "[]").length, saved: JSON.parse(localStorage.getItem("miPlatoFacil_saved") || "[]").map(p => [p.id, p.cooked || 0]), stock: localStorage.getItem("miPlatoFacil_pantryQuantities_v1") });
  const STOCK = { miPlatoFacil_pantryQuantities_v1: JSON.stringify({ '["lentejas","g"]': { name: "Lentejas", quantity: 500, unit: "g" }, '["arroz","g"]': { name: "Arroz", quantity: 500, unit: "g" } }) };
  // desde la ficha de la comida
  await abrir(STOCK); await ficha("plato", "rp_recipe_cocina6a");
  await tocar(doc().querySelector("#comidaPlatoAcciones [data-cook-saved]"), 400);
  const viaFichaPlato = estado();
  await abrir(STOCK); await ficha("plato", "rp_recipe_cocina6a");
  await tocar(doc().querySelector("[data-comida-cocinar]"), 300);
  for (let i = 0; i < 4; i++) await siguiente();
  const final = { progreso: txt($("cocinaProgreso")), comi: boton(/Lo comí/, cocina()), salir: boton(/^Salir$/, doc().querySelector("#cocinaBarra")) };
  await tocar(final.comi, 400);
  const viaCocinaPlato = estado(), msgCocina = txt($("cocinaEstado"));
  ok("R6-C-06 el último paso termina con 'Lo comí' y 'Salir'", final.progreso === "4 de 4" && !!final.comi && !!final.salir && visible(final.comi) && visible(final.salir) && !doc().querySelector("[data-cocina-siguiente]"), final.progreso);
  ok("R6-C-06 'Lo comí' del modo cocina hace lo mismo que Lo comí desde la ficha de la comida (registro de hoy y contador)", viaFichaPlato.cooking === 1 && JSON.stringify(viaCocinaPlato) === JSON.stringify(viaFichaPlato) && /Registrado|Comiste/.test(msgCocina) && /Lo comí/.test(txt($("cocinaLoComi"))) && $("cocinaLoComi").disabled, JSON.stringify({ viaFichaPlato, viaCocinaPlato, msgCocina }));
  await cerrarCocina();
  ok("R6-C-06 Salir cierra el modo cocina y vuelve a la ficha", !cocina() && ev("stack.at(-1)") === "comida" && visible($("comidaTitulo")));
  // receta: registro y descuento de la Despensa
  await abrir(STOCK); await ficha("receta", "recipe_cocina6a");
  await tocar($("recipeReadCookNow"), 400);
  const viaFichaReceta = estado();
  await abrir(STOCK); await ficha("receta", "recipe_cocina6a");
  await tocar(doc().querySelector("[data-comida-cocinar]"), 300);
  for (let i = 0; i < 4; i++) await siguiente();
  await tocar(boton(/Lo comí/, cocina()), 400);
  const viaCocinaReceta = estado();
  ok("R6-C-06 en una receta, 'Lo comí' del modo cocina anota el registro y descuenta la Despensa igual que el de la ficha", viaFichaReceta.cooking === 1 && JSON.stringify(viaCocinaReceta) === JSON.stringify(viaFichaReceta) && viaFichaReceta.stock !== STOCK.miPlatoFacil_pantryQuantities_v1, JSON.stringify({ viaFichaReceta, viaCocinaReceta }));
  await cerrarCocina();

  // ---- C-07: una mano, a 320 px, en claro y en oscuro ----
  const luminancia = c => { const [r, g, b] = (c.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }); return 0.2126 * r + 0.7152 * g + 0.0722 * b };
  const contraste = (a, b) => { const x = luminancia(a), y = luminancia(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) };
  const medidas = async tema => {
    await abrir({}, { ancho: 320 });
    const w3 = H.w(); w3.document.documentElement.setAttribute("data-theme", tema);
    await ficha("plato", "rp_recipe_cocina6a");
    await tocar(doc().querySelector("[data-comida-cocinar]"), 300);
    const res = [];
    for (let i = 0; i <= 4; i++) {
      const barra = $("cocinaBarra"), bs = [...barra.querySelectorAll("button")].filter(visible), rb = barra.getBoundingClientRect();
      const texto = doc().querySelector("#modoCocina .cocina__paso, #modoCocina .cocina__ingrediente span"), est = w3.getComputedStyle(texto), fondo = w3.getComputedStyle(cocina()).backgroundColor;
      res.push({ i, botones: bs.length, altoMin: Math.min(...bs.map(b => b.getBoundingClientRect().height)), abajo: Math.abs(rb.bottom - w3.innerHeight) <= 1, encimados: H.seSuperponen(bs), desborde: cocina().scrollWidth > cocina().clientWidth + 1, contraste: contraste(est.color, fondo), cortados: bs.some(b => b.scrollWidth > b.clientWidth + 1) });
      if (i < 4) await siguiente();
    }
    await cerrarCocina();
    return res;
  };
  for (const tema of ["light", "dark"]) {
    const m = await medidas(tema);
    ok(`R6-C-07 a 320 px (tema ${tema === "dark" ? "oscuro" : "claro"}) los botones de abajo miden 44 px o más, están pegados al borde de abajo, no se encima nada ni hay desborde, y el texto se lee (contraste 4,5 o más) en los 5 pasos`,
      m.every(x => x.altoMin >= 44 && x.abajo && !x.encimados && !x.desborde && !x.cortados && x.contraste >= 4.5) && m[4].botones === 3 && m[0].botones === 2, JSON.stringify(m.map(x => [x.i, x.botones, Math.round(x.altoMin), x.abajo, x.encimados, x.desborde, Math.round(x.contraste * 10) / 10])));
  }
  return H.terminar();
})()
