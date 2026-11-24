// R5 · Etapa 40 (Comidas e IA): ítems M-01 a M-10 y A-01 de docs/ronda-5-lista.md.
// Datos inventados; precios congelados. Mira lo que se ve en pantalla (botones, textos, cantidad de <details>, medidas) y lo que queda guardado.
(async () => {
  const H = R5H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc(), q = s => { const e = doc().querySelector(s); if (!e) throw new Error("no está: " + s); return e };
  const $ = id => doc().getElementById(id);
  const PRECIOS = { miPlatoFacil_mostrarPrecios_v1: '{"mostrar":true}' };
  const CLAVE = { miPlatoFacil_aiSettings_v1: JSON.stringify({ key: "AIzaSyTEST_clave_de_prueba_1234567890", model: "gemini-3.5-flash" }) };
  const norm = t => String(t || "").replace(/\s+/g, " ").trim();
  const ideas = () => { ev('openTab("miscomidas"); abrirIdeas(false)'); return espera(300) };
  // Elegir un filtro; con "" se saca el que esté elegido (volver a tocar un filtro elegido lo saca).
  const filtro = async (grupo, valor) => {
    const b = valor === "" ? doc().querySelector(`#recipeDetailsPanel [data-buscar="${grupo}"].is-selected`) : q(`#recipeDetailsPanel [data-buscar="${grupo}"][data-valor="${valor}"]`);
    if (b) await tocar(b, 60)
  };
  const tarjetas = () => [...doc().querySelectorAll("#recipeCatalogResults .recipe-catalog-card")];
  const total = () => Number((($("recipeCatalogCount").textContent.match(/^(\d+) resultado/) || [])[1]) || 0);
  const minutosDe = c => Number((c.textContent.match(/⏱ (\d+) min/) || [])[1] || 0);
  const precioDe = c => { const m = c.textContent.match(/≈ \$([\d.]+)/); return m ? Number(m[1].replace(/\./g, "")) : null };
  const nombresDe = () => tarjetas().map(c => norm(c.querySelector("strong").textContent));
  const abrirBusqueda = async () => { await ideas(); if ($("recipeDetailsPanel").hidden) await tocar($("recipeBuscarAbrir"), 400) };
  // Todas las páginas de resultados (con "Siguiente →").
  const recorrer = async () => {
    const vistos = []; let vueltas = 0;
    ev("recipeCatalogPage = 0; renderRecipeCatalog()"); await espera(40);
    for (;;) {
      vistos.push(...nombresDe());
      const sig = $("recipeCatalogNext");
      if ($("recipeCatalogPager").hidden || sig.disabled || ++vueltas > 30) break;
      await tocar(sig, 40)
    }
    return vistos
  };

  // ---- Ideas sin clave de Gemini ----
  await H.abrir({ ...H.MARCA, ...PRECIOS });
  await ideas();
  const pantIdeas = $("ideas");

  // R5-M-02: "Con lo que tengo" es el botón principal de ancho completo (más grande que un chip y que los otros botones).
  const con = $("ideasConLoQueTengoChip"), rCon = con.getBoundingClientRect(), rPant = pantIdeas.getBoundingClientRect();
  const chip = doc().querySelector("#menuFilters .filter-chip");
  ok("R5-M-02 'Con lo que tengo' en Ideas es un botón principal de ancho completo, más grande que un chip de filtro",
    con.tagName === "BUTTON" && con.classList.contains("button--primary") && !con.classList.contains("filter-chip") && /Con lo que tengo/.test(con.textContent)
    && rCon.width >= rPant.width * 0.85 && rCon.height >= 44 && rCon.height >= chip.getBoundingClientRect().height && rCon.width > chip.getBoundingClientRect().width * 3,
    `${Math.round(rCon.width)}x${Math.round(rCon.height)} de ${Math.round(rPant.width)}`);
  await tocar(con, 300);
  const conTocado = con.getAttribute("aria-pressed") === "true" && H.visible($("ideasConLoQueTengo"));
  await tocar(con, 200);
  ok("R5-M-02 tocarlo muestra y esconde las ideas con lo que tenés", conTocado && !H.visible($("ideasConLoQueTengo")));

  // R5-M-03: "Buscar con filtros" ya no es un desplegable: es un botón que abre la búsqueda.
  const abrir = $("recipeBuscarAbrir");
  const antes = { panelOculto: !H.visible($("recipeDetailsPanel")), expandido: abrir.getAttribute("aria-expanded") };
  await tocar(abrir, 400);
  ok("R5-M-03 'Buscar por tiempo y método' es un botón (no un desplegable): al tocarlo se abre la búsqueda; sin <details> en Ideas",
    abrir.tagName === "BUTTON" && /^🔎 Buscar por tiempo y método$/.test(norm(abrir.textContent)) && antes.panelOculto && antes.expandido === "false"
    && H.visible($("recipeDetailsPanel")) && abrir.getAttribute("aria-expanded") === "true" && $("recipeDetailsPanel").tagName !== "DETAILS" && pantIdeas.querySelectorAll("details,summary").length === 0 && !/Buscar con filtros/.test(pantIdeas.textContent));

  // R5-M-04: se eliminan los botones y textos de la búsqueda vieja.
  const panel = $("recipeDetailsPanel"), botonesPanel = [...pantIdeas.querySelectorAll("button")].map(b => norm(b.textContent));
  const prohibidos = [/Crear receta/, /Explorá ideas y recetas guardadas/, /Explorar ideas para convertir/, /Ver solo mis recetas/, /Mostrar también ideas/, /Limpiar búsqueda/, /Ordenar resultados/, /Resultados por página/];
  ok("R5-M-04 la búsqueda no tiene los botones 'Recetas' y 'Crear receta', el texto 'Explorá ideas y recetas guardadas…' con su campo, 'Ver solo mis recetas', 'Limpiar búsqueda', 'Ordenar resultados' ni 'Resultados por página'",
    prohibidos.every(re => !re.test(pantIdeas.textContent)) && !botonesPanel.some(t => /^(📖 )?Recetas$/.test(t)) && !$("recipeViewBrowse") && !$("recipeViewCreate") && !$("recipeCatalogSearch") && !$("recipeCatalogOnlyMine") && !$("recipeCatalogClear") && !$("recipeCatalogSort") && !$("recipeCatalogPageSize"),
    prohibidos.filter(re => re.test(pantIdeas.textContent)).join(" "));

  // R5-M-05: el filtro de tiempo filtra de verdad (antes daba 0 resultados).
  const esperadas = m => ev(`[...data.menuCatalog, ...(data.desayunoCatalog || [])].filter(i => i.minutos && i.minutos <= ${m}).length`);
  const porTiempo = {};
  for (const m of [15, 20, 30, 60]) { await filtro("tiempo", m); porTiempo[m] = { n: total(), esperadas: esperadas(m), vistas: (await recorrer()).length, max: Math.max(...tarjetas().map(minutosDe)) } }
  await filtro("tiempo", 20);
  const veinte = tarjetas();
  await filtro("tiempo", "");
  const todas = total();
  ok("R5-M-05 el filtro de tiempo da resultados: 'Hasta 20 min' muestra todas las ideas de 20 minutos o menos (ninguna más larga) y cada tope trae más que el anterior",
    porTiempo[15].n > 0 && porTiempo[20].n === porTiempo[20].esperadas && porTiempo[15].n === porTiempo[15].esperadas && porTiempo[30].n === porTiempo[30].esperadas && porTiempo[60].n === porTiempo[60].esperadas
    && porTiempo[15].n < porTiempo[20].n && porTiempo[20].n < porTiempo[30].n && porTiempo[30].n < porTiempo[60].n && porTiempo[60].n <= todas
    && veinte.length > 0 && veinte.every(c => minutosDe(c) > 0 && minutosDe(c) <= 20) && Object.values(porTiempo).every(x => x.vistas === x.n), JSON.stringify(porTiempo));

  // R5-M-06: a 390×844 se ven al menos 6 ideas en pantalla y se puede recorrer la lista completa.
  await ideas(); await tocar($("recipeBuscarAbrir"), 600);
  if ($("recipeDetailsPanel").hidden) await tocar($("recipeBuscarAbrir"), 600);
  await espera(600);
  const w = H.w(), alto = w.innerHeight, nav = $("sectionNav") ? $("sectionNav").getBoundingClientRect().top : alto, cab = doc().querySelector(".app-header").getBoundingClientRect().bottom;
  const enPantalla = tarjetas().filter(c => { const r = c.getBoundingClientRect(); return r.top >= cab && r.bottom <= Math.min(alto, nav) }).length;
  const alturas = tarjetas().slice(0, 6).map(c => Math.round(c.getBoundingClientRect().height));
  const vistos = await recorrer();
  ok("R5-M-06 a 390×844 la lista de resultados muestra al menos 6 ideas en pantalla (tarjetas compactas) y se recorre completa con las páginas",
    w.innerWidth === 390 && alto === 844 && enPantalla >= 6 && vistos.length === todas && new Set(vistos).size === vistos.length && todas >= 100, `en pantalla ${enPantalla}, alto de tarjeta ${alturas.join("/")}, recorridas ${vistos.length} de ${todas}`);

  // R5-M-07: filtros nuevos de método y de precio por porción.
  const chipsMetodo = [...doc().querySelectorAll('#recipeCatalogMetodo [data-buscar="metodo"]')].map(b => norm(b.textContent));
  const chipsTiempo = [...doc().querySelectorAll('#recipeCatalogTime [data-buscar="tiempo"]')].map(b => norm(b.textContent));
  const chipsPrecio = [...doc().querySelectorAll('#recipeCatalogPrecio [data-buscar="precio"]')].map(b => norm(b.textContent));
  const metodos = {};
  // Lo que dicen los pasos de cada idea que sale (independiente de cómo la app lo detecta).
  const textoIdea = n => ev(`(() => { const i = [...data.menuCatalog, ...(data.desayunoCatalog || [])].find(x => (x.corto || x.text) === ${JSON.stringify(n)}); return i ? (i.text + " " + (i.pasos || []).join(" ")).toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "") : "" })()`);
  for (const m of ["horno", "sarten", "olla", "sin-coccion"]) {
    await filtro("metodo", m); const nombres = await recorrer(), n = total();
    const textos = nombres.map(textoIdea);
    const ok1 = m === "horno" ? textos.every(t => /horn(o|e)|gratin/.test(t)) : m === "sin-coccion" ? textos.every(t => !/horn(o|e)|gratin|sarten|plancha|saltea|freir|herv|olla|guis|sopa|calent/.test(t)) : true;
    metodos[m] = { n, nombres, ok: n > 0 && ok1 }
  }
  await filtro("metodo", "");
  const cocina = (m, re) => metodos[m].nombres.some(n => re.test(n));
  const rango = {};
  for (const [v, tope] of [["1500", 1500], ["2500", 2500], ["mas", 0]]) {
    await filtro("precio", v); const cs = tarjetas();
    rango[v] = { n: total(), precios: cs.map(precioDe), ok: cs.length > 0 && cs.every(c => { const p = precioDe(c); return p !== null && (tope ? p <= tope : p > 2500) }) }
  }
  await filtro("precio", ""); await filtro("tiempo", 30); await filtro("metodo", "horno"); await filtro("precio", "2500");
  const combinado = tarjetas();
  const combinadoOk = combinado.every(c => minutosDe(c) <= 30 && precioDe(c) !== null && precioDe(c) <= 2500);
  await filtro("tiempo", ""); await filtro("metodo", ""); await filtro("precio", "");
  ok("R5-M-07 hay filtros de método (Horno, Sartén, Olla, Sin cocción) y de precio por porción (hasta $1.500, hasta $2.500, más) que filtran y se pueden combinar",
    ["Horno", "Sartén", "Olla", "Sin cocción"].join() === chipsMetodo.join() && ["15 min", "20 min", "30 min", "60 min"].join() === chipsTiempo.join() && /Hasta \$1\.500/.test(chipsPrecio.join()) && /Hasta \$2\.500/.test(chipsPrecio.join()) && /Más/.test(chipsPrecio.join())
    && Object.values(metodos).every(x => x.n > 0 && x.n < todas) && metodos.horno.ok && metodos["sin-coccion"].ok
    && rango["1500"].ok && rango["2500"].ok && rango.mas.ok && rango["1500"].n <= rango["2500"].n && combinadoOk, JSON.stringify({ metodos: Object.fromEntries(Object.entries(metodos).map(([k, v]) => [k, v.n])), rango: Object.fromEntries(Object.entries(rango).map(([k, v]) => [k, v.n])), combinado: combinado.length }));

  // R5-M-08: la búsqueda incluye el interruptor "Priorizar lo que tengo en la despensa" y no los textos largos ni los selectores.
  const sw = $("recipeRecommendPantry"), etiqueta = norm(sw.closest("label").textContent);
  const largos = [/Ordena recetas guardadas/, /El modo combinado/, /Las preferencias existentes/, /Recomendaciones desactivadas/, /Prioridad de recomendaciones/, /Recomendaciones según mi despensa/, /Mostrar costos estimados/];
  const primeroSin = nombresDe()[0];
  ev('localStorage.setItem("miPlatoFacil_pantry", JSON.stringify(["pollo"]))'); // marca "Pollo" en la despensa
  await ideas(); await tocar($("recipeBuscarAbrir"), 300);
  const pollo = n => ev(`(() => { const i = [...data.menuCatalog, ...(data.desayunoCatalog || [])].find(x => (x.corto || x.text) === ${JSON.stringify(n)}); return !!i && (i.cantidades || []).some(c => /^pollo/i.test(c[0])) })()`);
  const sinPrio = nombresDe()[0];
  await tocar(sw, 300);
  const conPrio = tarjetas(), primero = norm(conPrio[0].querySelector("strong").textContent);
  const metaPrimero = norm(conPrio[0].querySelector(".recipe-catalog-card__meta").textContent);
  await tocar(sw, 300);
  const vuelta = nombresDe()[0];
  ok("R5-M-08 la búsqueda tiene el interruptor 'Priorizar lo que tengo en la despensa' (sin los textos largos ni los selectores de prioridad) y con él primero salen las ideas que usan lo que tenés",
    sw.type === "checkbox" && /^Priorizar lo que tengo en la despensa$/.test(etiqueta) && largos.every(re => !re.test(pantIdeas.textContent)) && !$("recipeRecommendMode") && !$("recipeRecommendCosts") && !$("recipeRecommendStatus")
    && pollo(primero) && /de \d+ ingredientes|Tenés todo/.test(metaPrimero) && primero !== sinPrio && vuelta === sinPrio && sinPrio === primeroSin, `${primeroSin} → ${primero} (${metaPrimero})`);
  ev('localStorage.removeItem("miPlatoFacil_pantry")');

  // R5-M-10: espaciado de Ideas (a 390 y a 320 px): al menos 12 px entre bloques y nada encimado.
  const bloques = () => ["#ideasFiltros", "#ideasConLoQueTengo", "#recipeDetailsPanel", "#aiIdeasPanel", "#contextAdvice", ".advice-tabs", "#advice_menu"].map(s => doc().querySelector("#ideas " + s)).filter(e => e && H.visible(e));
  const huecos = () => { const bs = bloques(), h = []; for (let i = 1; i < bs.length; i++) h.push(H.separacion(bs[i - 1], bs[i])); return h };
  const medir = async ancho => {
    if (ancho !== 390) await H.abrir({ ...H.MARCA, ...PRECIOS, ...CLAVE }, { ancho });
    else await H.abrir({ ...H.MARCA, ...PRECIOS, ...CLAVE });
    await ideas();
    await tocar($("recipeBuscarAbrir"), 300); await tocar($("aiIdeasBoton"), 300); await tocar($("ideasConLoQueTengoChip"), 300);
    const botonesIdeas = [...doc().querySelectorAll("#ideas .ideas-bloque > button, #ideas .filter-chip, #ideas .ideas-interruptor, #ideas .recipe-catalog-card")].filter(H.visible);
    const dentro = botonesIdeas.every(b => b.getBoundingClientRect().right <= H.w().innerWidth + 0.5 && b.getBoundingClientRect().left >= -0.5);
    // Hueco entre chips de una misma línea (los de "menuFilters" se acomodan en varias líneas: se miran por línea).
    const porLinea = f => { const cs = [...f.querySelectorAll(".filter-chip")].filter(H.visible), lineas = new Map(); cs.forEach(c => { const t = Math.round(c.getBoundingClientRect().top / 4); if (!lineas.has(t)) lineas.set(t, []); lineas.get(t).push(c) }); return [...lineas.values()].map(l => H.huecoHorizontal(l)) };
    const filas = [...doc().querySelectorAll("#recipeDetailsPanel .filter-row, #menuFilters")].filter(H.visible).flatMap(porLinea);
    const verticales = huecos();
    return { ancho, verticales, minimo: Math.min(...verticales), dentro, chipsEncimados: [...doc().querySelectorAll("#recipeDetailsPanel .filter-row")].some(f => H.seSuperponen([...f.querySelectorAll(".filter-chip")].filter(H.visible))), filas: filas.filter(Number.isFinite) }
  };
  const m390 = await medir(390), m320 = await medir(320);
  ok("R5-M-10 en Ideas hay al menos 12 px entre bloques y nada queda encimado ni se sale de la pantalla, a 390 y a 320 px",
    m390.verticales.length >= 4 && m390.minimo >= 12 && m320.minimo >= 12 && m390.dentro && m320.dentro && !m390.chipsEncimados && !m320.chipsEncimados && m320.filas.every(x => x >= 6), JSON.stringify({ m390, m320 }));

  // R5-M-09 y A-01 con clave: aparecen "Pedir ideas a la IA" (botón, no desplegable) y la IA del editor, sin "Con tu app de IA".
  await H.abrir({ ...H.MARCA, ...PRECIOS, ...CLAVE }); await ideas();
  const botonIA = $("aiIdeasBoton"), visibleAntes = H.visible($("aiIdeasPanel"));
  await tocar(botonIA, 300);
  ok("R5-M-09 con clave de Gemini 'Pedir ideas a la IA' es un botón (no un desplegable) que abre el pedido con 'Pedir a Gemini'",
    botonIA.tagName === "BUTTON" && H.visible(botonIA) && /Pedir ideas a la IA/.test(botonIA.textContent) && !visibleAntes && H.visible($("aiIdeasPanel")) && $("aiIdeasPanel").tagName !== "DETAILS" && !!$("aiIdeasPanel").querySelector("[data-ai-gemini]") && !doc().querySelector("#ideas details"));
  ev("nuevaRecetaEnBlanco()"); await espera(300);
  const conClave = { boton: H.visible($("aiRecipeBoton")), panelCerrado: !H.visible($("aiRecipePanel")) };
  await tocar($("aiRecipeBoton"), 300);
  const abierto = H.visible($("aiRecipePanel")) && H.visible($("aiRecipeText")) && !!$("aiRecipePanel").querySelector("[data-ai-gemini]");
  const sinAppIA = !/app de IA|Copiar pedido|Compartir pedido|Respuesta de tu app/.test(doc().body.textContent) && !doc().querySelector("[data-ai-copy], [data-ai-share], [data-ai-use], [data-ai-prompt]");

  // R5-A-01: sin clave no hay ningún botón ni sección de IA en ninguna pantalla, salvo Más → Asistente de IA.
  await H.abrir({ ...H.MARCA, ...PRECIOS });
  const hayIA = () => {
    const d = doc(), res = [];
    for (const s of d.querySelectorAll(".screen")) {
      if (s.id === "asistente") continue;
      const visibles = [...s.querySelectorAll("button,summary,a,label,h2,h3,h4")].filter(e => !e.closest("[hidden]") && /\bIA\b|Gemini|inteligencia artificial/i.test(e.textContent) && !(e.matches("label") && !/IA|Gemini/.test(e.textContent)));
      for (const e of visibles) res.push(s.id + ": " + norm(e.textContent).slice(0, 50))
    }
    return res
  };
  const recorrido = [];
  for (const pant of ["hoy", "semana", "compras", "miscomidas", "mas"]) { ev(`openTab(${JSON.stringify(pant)})`); await espera(250); recorrido.push(...hayIA()) }
  await ideas(); recorrido.push(...hayIA());
  ev("nuevaRecetaEnBlanco()"); await espera(250); recorrido.push(...hayIA());
  const editorSinIA = !H.visible($("aiRecipeBoton")) && !H.visible($("aiRecipePanel")) && !H.visible($("aiIdeasBoton"));
  ev('openTab("miscomidas")'); await espera(200); await tocar(q("#misplatos [data-comida-nueva]"), 300);
  const hojaNueva = H.botonesHoja();
  await H.cerrarHoja();
  ev('openTab("mas")'); await espera(250);
  const tarjetaAsistente = doc().getElementById("aiSettingsOpen");
  await tocar(tarjetaAsistente, 300);
  ok("R5-A-01 sin clave de Gemini no aparece ningún botón ni sección de IA en ninguna pantalla (ni al crear una receta, ni en Ideas, ni en 'Nueva comida'); solo Más → Asistente de IA, que no ofrece 'Con tu app de IA'",
    recorrido.filter(t => !/^home: ✨Asistente de IA/.test(t)).length === 0 && editorSinIA && !hojaNueva.some(t => /IA/.test(t)) && ev("document.getElementById('asistente').classList.contains('is-active')") && H.visible($("aiKeyInput")) && !/Con tu app de IA|Copiar pedido/.test($("asistente").textContent),
    recorrido.join(" | ") + " :: " + hojaNueva.join(","));
  ok("R5-A-01 con clave guardada vuelven los botones de IA (Pedir ideas a la IA y Armar la receta con IA) y siguen sin existir 'Con tu app de IA', copiar ni pegar la respuesta",
    conClave.boton && conClave.panelCerrado && abierto && sinAppIA);

  // R5-M-01: crear una receta nueva, en pasos ordenados, con lo obligatorio y lo opcional marcados y sin desplegables.
  await H.abrir({ ...H.MARCA, ...PRECIOS });
  ev('openTab("miscomidas")'); await espera(250); await tocar(q("#misplatos [data-comida-nueva]"), 300); await tocar(q(".hoja [data-nueva-receta]"), 400);
  const ed = $("recetaEditar"), pasos = [...ed.querySelectorAll(".receta-paso")].filter(H.visible);
  const titulos = pasos.map(p => norm(p.querySelector(".receta-paso__titulo").textContent));
  const enOrden = pasos.every((p, i) => i === 0 || (pasos[i - 1].compareDocumentPosition(p) & 4) && p.getBoundingClientRect().top > pasos[i - 1].getBoundingClientRect().top);
  const campos = ["recipeDetailsTitle", "recipeIngredientAdd", "recipeDetailsSteps", "recipeTags", "recipeMinutes", "recipeDetailsNotes", "recipeDetailsSave"].map(id => H.visible($(id)));
  ok("R5-M-01 crear una receta nueva: pasos numerados en orden (1 Nombre, 2 Ingredientes, 3 Preparación, 4 Más detalles), el nombre marcado como Obligatorio y los demás como Opcional, todo a la vista y sin desplegables",
    ["1 Nombre Obligatorio", "2 Ingredientes Opcional", "3 Preparación Opcional", "4 Más detalles Opcional"].every((t, i) => titulos[i] === t) && enOrden && campos.every(Boolean) && ed.querySelectorAll("details,summary").length === 0 && !!$("recipeDetailsTitle").required, titulos.join(" | ") + " " + campos.join());
  // Sin nombre no guarda; con solo el nombre (lo único obligatorio) guarda.
  const antesN = Object.keys(JSON.parse(localStorage.getItem("miPlatoFacil_recipeDetails_v1") || "{}")).length;
  await tocar($("recipeDetailsSave"), 250);
  const sinNombre = Object.keys(JSON.parse(localStorage.getItem("miPlatoFacil_recipeDetails_v1") || "{}")).length === antesN;
  $("recipeDetailsTitle").value = "Tarta de acelga"; await tocar($("recipeDetailsSave"), 300);
  const guardada = Object.values(JSON.parse(localStorage.getItem("miPlatoFacil_recipeDetails_v1") || "{}")).some(r => r.title === "Tarta de acelga");
  ok("R5-M-01 con solo el nombre (lo único obligatorio) la receta se guarda; sin nombre no se guarda", sinNombre && guardada, $("recipeDetailsStatus").textContent);

  return H.terminar();
})()
