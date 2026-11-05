// E10: Etapa 10 del rediseño (pulido). C10-1 a C10-6 son los controles E10-vacios, E10-plato, E10-nombres, E10-selects, E10-colores y
// E10-al-menos de docs/validacion/criterios.json. No tocan datos: solo miran la interfaz. La app se abre en un marco aparte. Datos inventados.
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
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const visible = e => !!e && e.getClientRects().length > 0 && w.getComputedStyle(e).visibility !== "hidden";
  const hojaAbierta = () => !!doc().querySelector(".hoja-fondo:not([hidden])");
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };

  // C10-1 Estados vacíos con un próximo paso: una línea y un botón que hace algo.
  cargar(MARCA); await abrir();
  ev('openTab("compras")'); await espera(100);
  const vacioCompras = doc().querySelector("#compras .empty-state");
  const botonCompras = vacioCompras && vacioCompras.querySelector("button");
  const terminar = doc().getElementById("comprasBought");
  const sinLlenoCompras = !!terminar && !terminar.classList.contains("button--primary");
  if (botonCompras) { botonCompras.click(); await espera(150) }
  const fueASemana = ev("stack.at(-1)") === "plan";
  ev('openTab("semana")'); await espera(100);
  // Etapa 24: la Semana vacía ya no ofrece "Elegir el almuerzo de hoy"; su próximo paso es "Armame la semana" (botón principal).
  const elegir = doc().getElementById("planVacioElegir"), armame = doc().querySelector("#plan [data-armame]");
  const visibleElegir = !elegir && !doc().body.textContent.includes("Elegir el almuerzo de hoy") && visible(armame) && armame.classList.contains("button--primary");
  if (armame) { armame.click(); await espera(150) }
  const abrioSelector = hojaAbierta() || Object.values(ev("loadPlan()")).reduce((n, d) => n + Object.keys(d || {}).length, 0) === 28; // v17.6: con la semana vacía arma directo
  ev("hoja.cerrar()");
  ev('openTab("miscomidas"); go("ideas")'); await espera(100);
  const entrada = doc().getElementById("menuSearchInput"); entrada.value = "zzzzqq"; ev("renderMenuSearch()"); await espera(100);
  const limpiar = doc().querySelector("#menuSearchList .search-empty button");
  if (limpiar) { limpiar.click(); await espera(100) }
  ok("C10-1 Compras sin lista, Semana vacía e Ideas sin resultados ofrecen un botón que lleva al próximo paso; Terminé de comprar no es el botón lleno sin lista",
    !!botonCompras && botonCompras.textContent === "Armar mi semana" && fueASemana && sinLlenoCompras && visibleElegir && abrioSelector && !!limpiar && limpiar.textContent === "Limpiar búsqueda" && entrada.value === "",
    [!!botonCompras, fueASemana, sinLlenoCompras, visibleElegir, abrioSelector, !!limpiar].join(","));

  // C10-2 El armado dibuja el plato: sectores según las proporciones, sin sectores degenerados y sin colores fijos.
  cargar(MARCA); await abrir();
  ev('openTab("hoy"); start("plato"); Armado.setDay("Día libre")'); await espera(150);
  const libre = doc().querySelector("#plateViz svg.plato-dibujo");
  const sectoresLibre = libre ? libre.querySelectorAll("path").length : 0;
  const tituloLibre = libre ? libre.querySelector("title").textContent : "";
  ev('Armado.setDay("Día de entrenamiento")'); await espera(100);
  const entreno = doc().querySelector("#plateViz svg.plato-dibujo");
  const tituloEntreno = entreno ? entreno.querySelector("title").textContent : "";
  const forma = prop => ev("(() => { const s = Armado.dibujoDelPlato(" + prop + "); return [s.querySelectorAll('path').length, s.querySelectorAll('circle').length, s.innerHTML].join('|') })()").split("|");
  const medio = forma('{ vegetables: "1/2", carbs: "1/2", protein: "x" }');
  const entero = forma('{ vegetables: "1/2", carbs: "0", protein: "0" }');
  const html = (libre ? libre.outerHTML : "") + medio[2] + entero[2];
  ok("C10-2 el armado dibuja el plato con 3 sectores (mitad y cuartos, o tercios), con título; con un grupo en 0 no hay sector degenerado; sin colores fijos ni NaN",
    sectoresLibre === 3 && /verduras 50 %/.test(tituloLibre) && /almidones 25 %/.test(tituloLibre) && /verduras 33 %/.test(tituloEntreno) && medio[0] === "2" && entero[0] === "0" && entero[1] === "2" && !/NaN/.test(html) && !/#[0-9a-f]{3,6}\b/i.test(html) && !/ fill=| stroke=| style=/.test(html),
    [sectoresLibre, tituloLibre, tituloEntreno, medio[0], entero[0] + "/" + entero[1]].join(" · "));

  // C10-3 Nombres accesibles: campos y botones solo-ícono de las pantallas y hojas nuevas.
  cargar({ ...R.data, ...MARCA }); await abrir();
  const sinNombre = () => [...doc().querySelectorAll("button,a[href],summary,input,select,textarea,[role=button]")].filter(e => visible(e) && e.type !== "hidden" && !(e.getAttribute("aria-label") || e.title || e.getAttribute("aria-labelledby") || (e.labels && e.labels.length) || /[\p{L}\p{N}]/u.test(e.textContent || "") || (e.placeholder && e.tagName !== "SELECT"))).map(e => e.tagName.toLowerCase() + (e.id ? "#" + e.id : "." + e.className));
  const recorrido = ["Bienvenida.abrirBienvenida()", 'openTab("semana"); abrirSelector(todayPlanDay(), "almuerzo")', 'abrirSugerime("almuerzo")', 'openTab("semana"); Selector.abrirMenuSemana()', 'openTab("miscomidas"); Comidas.abrirNuevaComida()', 'openTab("semana"); abrirHueco(todayPlanDay(), "almuerzo")', 'openTab("miscomidas"); Comidas.abrirComida("plato", MisPlatos.loadSaved()[0].id)', 'showRecipeView("edit")', 'openTab("mas"); Comidas.abrirFuentes()'];
  const malos = [];
  for (const paso of recorrido) { ev("hoja.cerrar()"); ev(paso); await espera(250); for (const m of sinNombre()) malos.push(paso.slice(0, 24) + " → " + m) }
  ev("hoja.cerrar()");
  ok("C10-3 ningún campo ni botón visible queda sin nombre en la bienvenida, el Selector, Sugerime, el menú ⋯, + Nueva, el hueco lleno, el detalle, la receta y Fuentes", malos.length === 0, malos.slice(0, 5).join(" | "));

  // C10-4 Los selects largos tienen opciones que entran: etiqueta corta y el nombre completo debajo.
  ev('openTab("compras"); go("ingredientes")'); await espera(100);
  const panel = doc().getElementById("pantryReviewPanel"); if (panel) { panel.open = true; await espera(150) }
  const sel = doc().getElementById("pantryReviewRecipe"), opts = [...sel.options];
  const largo = Math.max(...opts.map(o => o.text.length));
  const completo = doc().getElementById("pantryReviewFull");
  ok("C10-4 las opciones de la revisión de despensa son cortas (sin + ni …), conservan el nombre completo como valor y el nombre completo se ve debajo",
    opts.length > 10 && opts.every(o => !/ \+ |…/.test(o.text) && o.value.length >= o.text.length && o.title === o.value) && opts.some(o => o.value.length > o.text.length) && !!completo && completo.textContent === sel.value && largo <= 40,
    "más larga: " + largo + " · " + (completo && completo.textContent));

  // C10-5 Contraste de los colores del sistema de diseño en claro y oscuro (calculado desde los tokens, mínimo 4,5:1).
  const rgb = c => { c = c.trim(); if (c.length === 4) c = "#" + [...c.slice(1)].map(x => x + x).join(""); return [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)) };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }; const [r, g, b] = rgb(c); return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) };
  const razon = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) };
  const raiz = doc().documentElement, anterior = raiz.getAttribute("data-theme"), fallas = [], minimos = [];
  for (const tema of ["light", "dark"]) {
    raiz.setAttribute("data-theme", tema);
    const v = n => w.getComputedStyle(raiz).getPropertyValue(n).trim();
    const pares = [["--on-green", "--green"], ["--muted", "--surface"], ["--muted", "--bg"], ["--green", "--surface"], ["--danger", "--surface"], ["--danger", "--danger-bg"], ["--text", "--surface"]];
    const platos = ["--plato-verduras", "--plato-almidones", "--plato-proteinas"].map(x => ["--plato-tinta", x]);
    for (const [a, b] of pares.concat(platos)) { const r = razon(v(a), v(b)); minimos.push(tema[0] + ":" + a.slice(2) + "/" + b.slice(2) + "=" + r.toFixed(1)); if (!Number.isFinite(r) || r < 4.5) fallas.push(tema + " " + a + " sobre " + b + " " + r.toFixed(2)) }
  }
  if (anterior) raiz.setAttribute("data-theme", anterior); else raiz.removeAttribute("data-theme");
  ok("C10-5 el texto sobre el verde (--on-green), el gris (--muted), el verde y el rojo de borrar pasan 4,5:1 en claro y oscuro", fallas.length === 0, fallas.join(" | ") || minimos.slice(0, 3).join(" "));

  // C10-6 al menos en la barra de presupuesto y en el total semanal cuando faltan más de la mitad de los precios.
  cargar(MARCA); await abrir();
  ev('preciosActivos = () => true; shoppingBudgetRead = () => ({ limit: 1000, currency: "ARS", period: "semana" })');
  const barra = (faltan, pendientes) => { ev("totalAutomaticoLista = () => ({ total: 500, faltan: " + faltan + ", pendientes: " + pendientes + ", porClave: new Map([['a','$1']]) }); renderPresupuestoCompras()"); return doc().getElementById("comprasPresupuesto").textContent };
  const muchos = barra(3, 4), pocos = barra(1, 4);
  const semana = (faltan, comidas) => { ev("preciosDataset = () => ({}); costosDelPlan = () => ({ dia: 0, semana: 1000, faltan: " + faltan + ", pendientes: " + comidas + ", conPrecio: " + (comidas - faltan) + ", sinEstimar: " + (faltan * 2 > comidas ? faltan : 0) + " }); pintarCostoDia()"); return doc().getElementById("planDiaCosto").textContent + " | " + doc().getElementById("planPreciosEstado").textContent };
  const sMuchos = semana(3, 4), sPocos = semana(1, 4);
  ok("C10-6 el cartel de presupuesto y el total semanal dicen al menos ≈ $X si faltan más de la mitad de los precios y siguen igual si faltan pocos",
    /· al menos ≈ \$500 estimado \(faltan 3 precios\)/.test(muchos) && /· ≈ \$500 estimado \(faltan 1 precio\)/.test(pocos) && sMuchos.includes("Semana al menos ≈ $1.000") && sMuchos.includes("Con precio: 1 de 4 productos · Completar 3 precios") && sPocos.includes("Semana ≈ $1.000") && sPocos.includes("Con precio: 3 de 4 productos · Completar 1 precio") && !sPocos.includes("al menos"),
    [muchos, pocos, sMuchos, sPocos].join(" | "));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
