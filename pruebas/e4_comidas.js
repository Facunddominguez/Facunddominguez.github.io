// E4: Etapa 4 del rediseño (Comidas y nueva estructura). Pestañas Hoy · Semana · Comidas · Compras · Más, tarjeta única
// para platos y recetas, detalle, formulario de receta en pantalla propia, nutrientes, primera vez y Más.
// C4-1 es el control E4-semana-nueva-toques de docs/validacion/criterios.json. Se verifica lo guardado, no los textos.
// La app se abre en un marco aparte (mismo origen y mismo localStorage) para poder recargarla. Solo datos inventados.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null, toques = 0;
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
  const $ = id => { const e = doc().getElementById(id); if (!e) throw Error("no está en la pantalla: #" + id); return e };
  const q = s => { const e = doc().querySelector(s); if (!e) throw Error("no está en la pantalla: " + s + " (pantalla: " + ev("stack.at(-1)") + ")"); return e };
  const tocar = async el => { el.click(); toques++; await espera(120) };
  const irA = async pestana => { await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')); if (ev("stack.at(-1) !== activeTabRoot()")) await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')) };
  const pantalla = () => ev("stack.at(-1)");
  const visible = e => !!e && e.getClientRects().length > 0;
  const hojaAbierta = () => ev("hoja.abierta()");
  const botonDeHoja = texto => [...ev("hoja.elemento").querySelectorAll("button")].find(b => b.textContent === texto);
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const plan = () => JSON.parse(localStorage.getItem("miPlatoFacil_plan") || "{}");
  const guardados = () => JSON.parse(localStorage.getItem("miPlatoFacil_saved") || "[]");
  const recetas = () => JSON.parse(localStorage.getItem("miPlatoFacil_recipeDetails_v1") || "{}");
  const todo = () => JSON.stringify(Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_")).sort().map(k => [k, localStorage.getItem(k)]));
  const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const hoy = () => DIAS[(new Date().getDay() + 6) % 7], siguiente = () => DIAS[(DIAS.indexOf(hoy()) + 1) % 7];
  const MARCA = "miPlatoFacil_bienvenida_v1";
  const tarjetas = tipo => [...doc().querySelectorAll("#savedList > .comida-card")].filter(c => !tipo || c.dataset.comidaTipo === tipo);
  const receta = { recipe_e4test1: { id: "recipe_e4test1", title: "Guiso de lentejas", sourceTitle: null, amountsTitle: "receta:recipe_e4test1", steps: ["Rehogar", "Cocinar"], notes: "", tags: ["olla"], minutes: 45 } };
  const cantidades = { "receta:recipe_e4test1": { yield: 2, rows: [{ name: "Lentejas", quantity: 300, unit: "g" }, { name: "Zanahoria", quantity: 2, unit: "unidad" }] } };
  const conReceta = extra => ({ miPlatoFacil_recipeDetails_v1: JSON.stringify(receta), miPlatoFacil_recipeAmounts_v1: JSON.stringify(cantidades), ...(extra || {}) });

  // C4-1 Un usuario nuevo arma una semana con 3 comidas: bienvenida (método, rutina opcional, 3 ideas) y 3 huecos de la Semana
  cargar({}); await abrir();
  const arrancaEnBienvenida = pantalla() === "bienvenida" && visible($("bienvenida")) && todo() === "[]";
  toques = 0;
  await tocar(q('#bienvenida [data-bienvenida-paso="1"] [data-bienvenida-siguiente]'));
  await tocar(q('#bienvenida [data-bienvenida-paso="2"] [data-bienvenida-siguiente]'));
  for (let i = 1; i <= 3; i++) await tocar(q("#bienvenidaIdeas [data-bienvenida-idea]:nth-child(" + i + ")"));
  await tocar(q("#bienvenida [data-bienvenida-armar]"));
  const ids = guardados().map(x => x.id), enSemana = pantalla() === "plan";
  const huecos = [[hoy(), "almuerzo"], [hoy(), "cena"], [siguiente(), "almuerzo"]];
  for (let i = 0; i < 3; i++) {
    const [dia, comida] = huecos[i];
    if (i === 2) await tocar(q('#planDias [data-plan-dia="' + dia + '"]'));
    await tocar(q('[data-hueco="' + dia + "|" + comida + '"]'));
    await tocar(q('.hoja [data-selector-seccion="mias"] [data-selector-id="' + ids[i] + '"]'));
  }
  const p1 = plan(), asignadas = huecos.map(([d, c]) => p1[d] && p1[d][c]);
  ok("C4-1 un usuario nuevo arma una semana con 3 comidas en 15 toques o menos", arrancaEnBienvenida && enSemana && toques <= 15 && ids.length === 3 && asignadas.join() === ids.join() && localStorage.getItem(MARCA) === '{"vista":true}' && localStorage.getItem("miPlatoFacil_trainingWeek") === null && pantalla() === "plan" && !hojaAbierta(), toques + " toques · " + asignadas.join());

  // C4-2 Pestañas en orden; Comidas con el segmento "Mis comidas | Ideas" (sin "← Comidas"); cada pestaña recuerda su recorrido
  cargar(R.data); await abrir();
  const antes2 = todo();
  const nombres = [...doc().querySelectorAll("#sectionNav [data-section-tab]")].map(b => b.querySelector("span:last-child").textContent).join(",");
  await irA("miscomidas");
  const enMis = pantalla() === "misplatos" && visible(q('#misplatos [data-comidas-vista="mias"][aria-pressed="true"]'));
  await tocar(q('#misplatos [data-comidas-vista="ideas"]'));
  const enIdeas = pantalla() === "ideas" && !$("homeTop").classList.contains("is-visible") && q('#sectionNav [data-section-tab="miscomidas"]').getAttribute("aria-current") === "page";
  await tocar(q('#sectionNav [data-section-tab="hoy"]')); await tocar(q('#sectionNav [data-section-tab="miscomidas"]'));
  const recuerda = pantalla() === "ideas";
  await tocar(q('#ideas [data-comidas-vista="mias"]'));
  ok("C4-2 pestañas Hoy, Semana, Comidas, Compras y Más; segmento Mis comidas | Ideas; moverse no escribe", nombres === "Hoy,Semana,Comidas,Compras,Más" && enMis && enIdeas && recuerda && pantalla() === "misplatos" && todo() === antes2, nombres);

  // C4-3 Adaptador: la misma tarjeta para platos y recetas, sin juntar ni escribir los datos
  const cp = ev("comidaDesdePlato(loadSaved().find(x => !x.recipeSourceId))"), cr = ev("comidaDesdeReceta(Object.values(loadRecipeDetails())[0], loadRecipeAmounts(), false)");
  const mismasClaves = JSON.stringify(Object.keys(cp).sort()) === JSON.stringify(Object.keys(cr).sort()) && cp.tipo === "plato" && cr.tipo === "receta";
  const estructura = tarjetas().every(c => c.querySelector(".comida-card__nombre") && c.querySelector(".comida-card__componentes") && c.querySelector(".comida-card__etiquetas"));
  const platosGuardados = guardados().filter(x => !x.recipeSourceId).length, recetasGuardadas = Object.keys(recetas()).length;
  const huerfanas = guardados().filter(x => x.recipeSourceId && !recetas()[x.recipeSourceId]).length;
  for (const k of ["recetas", "platos", "todo"]) await tocar(q('[data-saved-kind="' + k + '"]'));
  ok("C4-3 platos y recetas se ven con la misma tarjeta; los conteos salen de cada dato y pintar no escribe", mismasClaves && estructura && tarjetas("plato").length === platosGuardados && tarjetas("receta").length === recetasGuardadas + huerfanas && todo() === antes2, tarjetas("plato").length + " platos, " + tarjetas("receta").length + " recetas");
  localStorage.setItem("miPlatoFacil_recipeDetails_v1", '{"recipe_x":{"id":"otro"}}'); ev("renderSaved()");
  ok("C4-3b con recetas dañadas, las tarjetas de platos se siguen viendo", tarjetas("plato").length === platosGuardados && /No se pudieron leer/.test($("savedList").textContent));

  // C4-4 Detalle: Agregar a la semana (plato con setSlot; receta como copia), Deshacer, Lo cociné, Compartir y Eliminar
  cargar(R.data); await abrir(); await irA("miscomidas");
  const plato = tarjetas("plato")[0], idPlato = plato.dataset.comidaId;
  await tocar(plato);
  const detallePlato = pantalla() === "comida" && visible($("comidaPlato")) && !visible($("recipeReadView")) && doc().querySelectorAll("#comidaComponentes [data-nutriente-ingrediente]").length > 0;
  const planAntes = localStorage.getItem("miPlatoFacil_plan");
  await tocar(q("#comida [data-comida-agregar]"));
  $("hojaComidaDia").value = "martes"; $("hojaComidaSlot").value = $("hojaComidaSlot").options[$("hojaComidaSlot").options.length - 1].value;
  const slot4 = $("hojaComidaSlot").value;
  await tocar(botonDeHoja("Agregar a la semana"));
  const asignado4 = plan().martes[slot4] === idPlato, deshacer4 = ev("hoja.estado").querySelector("[data-comida-deshacer]");
  if (deshacer4) await tocar(deshacer4);
  ok("C4-4 Agregar a la semana asigna el plato al hueco elegido y Deshacer deja el plan como estaba", detallePlato && asignado4 && !!deshacer4 && localStorage.getItem("miPlatoFacil_plan") === planAntes);
  ev("hoja.cerrar()");
  const cocinadoAntes = guardados().find(x => x.id === idPlato).cooked || 0;
  await tocar(q('#comidaPlatoAcciones [data-cook-saved="' + idPlato + '"]'));
  const cocinado = (guardados().find(x => x.id === idPlato).cooked || 0) === cocinadoAntes + 1 && /Cocinaste/.test($("comidaEstado").textContent);
  const antesCompartir = todo(); let compartido = "";
  w.navigator.share = d => { compartido = d.text; return Promise.resolve() };
  await tocar(q("#comida [data-comida-compartir]"));
  ok("C4-4b Lo cociné cuenta como antes y Compartir manda el texto sin escribir nada", cocinado && compartido.startsWith(ev("mealName(loadSaved().find(x => x.id === " + JSON.stringify(idPlato) + "))")) && todo() === antesCompartir, compartido.slice(0, 40));
  await tocar(q("#comida [data-comida-menu]")); await tocar(q('.hoja [data-del-saved="' + idPlato + '"]')); await espera(60);
  ok("C4-4c Eliminar (menú ⋯) borra solo ese plato y vuelve a Mis comidas", !guardados().some(x => x.id === idPlato) && pantalla() === "misplatos" && !hojaAbierta());
  cargar(conReceta()); await abrir(); await irA("miscomidas");
  await tocar(q('.comida-card[data-recipe-id="recipe_e4test1"]'));
  await tocar(q("#comida [data-comida-agregar]"));
  $("hojaComidaDia").value = "jueves"; $("hojaComidaSlot").value = "cena";
  await tocar(botonDeHoja("Agregar a la semana"));
  const copia = guardados().find(x => x.id === plan().jueves.cena);
  ok("C4-4d una receta se agrega como 'Asignar receta al plan actual' (copia con sus ingredientes)", pantalla() === "comida" && !!copia && copia.recipeSourceId === "recipe_e4test1" && copia.recipeIngredients.join() === "Lentejas,Zanahoria" && copia.type === "plato");
  ev("hoja.cerrar()");

  // C4-5 Formulario de receta en pantalla propia, con Ingredientes, Preparación y Más detalles plegables
  cargar({ [MARCA]: '{"vista":true}' }); await abrir(); await irA("miscomidas");
  await tocar(q("#misplatos [data-comida-nueva]")); await tocar(q(".hoja [data-nueva-receta]"));
  const secciones = ["recetaSeccionIngredientes", "recetaSeccionPreparacion", "recetaSeccionMas"].map(id => doc().getElementById(id));
  const formOk = pantalla() === "recetaEditar" && $("recetaEditarTitulo").textContent === "Nueva receta" && secciones.every(s => s && s.tagName === "DETAILS") && secciones[0].open && !secciones[1].open && !secciones[2].open && $("recetaEditar").contains($("recipeDetailsSave"));
  $("recipeDetailsTitle").value = "Tarta de acelga"; secciones[1].open = true; $("recipeDetailsSteps").value = "Rehogar\nHornear";
  await tocar($("recipeDetailsSave"));
  const nueva = Object.values(recetas()).find(r => r.title === "Tarta de acelga");
  ok("C4-5 Escribir receta abre el formulario propio y guarda con el formato de siempre", formOk && !!nueva && nueva.steps.join("|") === "Rehogar|Hornear" && /^recipe_/.test(nueva.id), JSON.stringify(nueva || {}).slice(0, 80));
  ev("recipeDetailsEditing = " + JSON.stringify(nueva.id) + "; renderRecipeDetails()");
  await tocar($("recipeDetailsDuplicate"));
  const dos = Object.keys(recetas()).length === 2;
  ev("recipeDetailsEditing = " + JSON.stringify(nueva.id) + "; renderRecipeDetails()"); await tocar($("recipeDetailsDelete"));
  ok("C4-5b duplicar y eliminar funcionan igual desde Otras acciones", dos && Object.keys(recetas()).length === 1 && !recetas()[nueva.id]);
  await irA("miscomidas"); await tocar(q("#misplatos [data-comida-nueva]")); await tocar(q(".hoja [data-pegar-receta]"));
  ok("C4-5c Pegar receta con IA abre el formulario con el panel de IA abierto", pantalla() === "recetaEditar" && $("aiRecipePanel").open && visible($("aiRecipeText")));

  // C4-6 Nutrientes: el detalle de la receta (por porción) y de cada ingrediente al tocarlo; Consultar nutrientes sigue
  cargar(conReceta({ [MARCA]: '{"vista":true}' })); await abrir(); await irA("miscomidas");
  await tocar(q('.comida-card[data-recipe-id="recipe_e4test1"]'));
  const kcal = ev("nutritionNumber(recipeNutrition(loadRecipeAmounts()['receta:recipe_e4test1']).perPortion[0], 'kcal')");
  const cajaOk = !!doc().querySelector("#recipeReadIngredients .nutrition-box") && $("recipeReadIngredients").textContent.includes("≈ " + kcal);
  await tocar(q('#recipeReadIngredients [data-nutriente-ingrediente="Lentejas"]'));
  const lent = ev("nutritionFor('Lentejas')"), hojaTexto = ev("hoja.elemento").textContent;
  ok("C4-6 el detalle muestra los nutrientes por porción y cada ingrediente abre los suyos", cajaOk && hojaAbierta() && $("hojaTitulo").textContent === "Lentejas" && hojaTexto.includes(lent.n + " · cada 100 g") && hojaTexto.includes(ev("nutritionNumber(" + lent.v[0] + ", 'kcal')")), kcal);
  ev("hoja.cerrar()");
  await irA("mas"); await tocar(q("#sectionSettings [data-open-fuentes]"));
  $("nutritionLookupPanel").open = true; $("nutritionLookupInput").value = "Lentejas"; $("nutritionLookupInput").dispatchEvent(new w.Event("input", { bubbles: true })); await espera(60);
  ok("C4-6b Consultar nutrientes sigue en Más → Fuentes de datos, con la misma lógica", pantalla() === "fuentes" && visible($("nutritionLookupPanel")) && $("nutritionLookupResult").textContent.includes(lent.n + " · cada 100 g") && /USDA/.test($("nutritionSourceInfo").textContent));
  cargar(R.data); await abrir(); await irA("miscomidas"); await tocar(tarjetas("plato")[0]);
  ok("C4-6c el detalle de un plato invita a tocar un ingrediente para ver sus nutrientes", /Tocá un ingrediente/.test($("comidaPlato").textContent));

  // C4-7 Primera vez: solo para un usuario nuevo; la marca se escribe solo al actuar y va en el respaldo
  cargar(R.data); await abrir();
  const conDatos = pantalla() !== "bienvenida" && localStorage.getItem(MARCA) === null;
  cargar({ [MARCA]: '{"vista":true}' }); await abrir();
  const conMarca = pantalla() !== "bienvenida";
  cargar({}); await abrir();
  const sinEscribir = pantalla() === "bienvenida" && todo() === "[]";
  await tocar(q('#bienvenida [data-bienvenida-paso="1"] [data-bienvenida-saltar]'));
  ok("C4-7 la bienvenida no se abre con datos ni con la marca; abrirla no escribe y Saltar escribe solo la marca", conDatos && conMarca && sinEscribir && todo() === JSON.stringify([[MARCA, '{"vista":true}']]) && pantalla() === "home");
  await irA("mas"); await tocar(q("#sectionSettings [data-open-como-funciona]")); await tocar(q("#comoFunciona [data-ver-bienvenida]"));
  const reabierta = pantalla() === "bienvenida";
  let escrituras = 0; const set = w.localStorage.setItem.bind(w.localStorage); w.Storage.prototype.setItem = function (k, v) { if (k === MARCA) escrituras++; return set(k, v) };
  await tocar(q('#bienvenida [data-bienvenida-paso="1"] [data-bienvenida-siguiente]'));
  await tocar(q('#bienvenidaDias [data-bienvenida-dia="1"]')); await tocar(q('#bienvenidaDias [data-bienvenida-dia="4"]'));
  await tocar(q("#bienvenida [data-bienvenida-rutina]"));
  await tocar(q('#bienvenida [data-bienvenida-paso="3"] [data-bienvenida-saltar]'));
  ok("C4-7b Más → Cómo funciona la vuelve a abrir; la rutina se guarda con su formato y la marca no se reescribe", reabierta && JSON.parse(localStorage.getItem("miPlatoFacil_trainingWeek")).version === 1 && JSON.parse(localStorage.getItem("miPlatoFacil_trainingWeek")).days.sort().join() === "1,4" && escrituras === 0 && localStorage.getItem(MARCA) === '{"vista":true}', "escrituras de la marca: " + escrituras);
  const snap = ev("completeBackupSnapshot(localStorage)");
  let rechaza = false; try { ev("validateCompleteBackup(" + JSON.stringify({ ...snap, data: { ...snap.data, [MARCA]: '{"vista":false}' } }) + ")") } catch (e) { rechaza = true }
  let viejoOk = true; try { ev("restoreCompleteBackup(" + JSON.stringify(R) + ", localStorage)") } catch (e) { viejoOk = false }
  ok("C4-7c la marca va en el respaldo (validada) y un respaldo viejo sin ella se restaura", snap.data[MARCA] === '{"vista":true}' && rechaza && viejoOk && localStorage.getItem(MARCA) === '{"vista":true}' && localStorage.getItem("miPlatoFacil_plan") === R.data.miPlatoFacil_plan);
  delete w.Storage.prototype.setItem;

  // C4-8 Nada se pierde: cada herramienta movida se alcanza desde su lugar nuevo (modo completo)
  cargar({ ...conReceta(), miPlatoFacil_uiMode_v1: "completo", [MARCA]: '{"vista":true}' }); await abrir();
  const faltan = [];
  const ver = (nombre, cond) => { if (!cond) faltan.push(nombre) };
  await irA("miscomidas"); await tocar(q('#misplatos [data-comidas-vista="ideas"]'));
  ver("Ideas", pantalla() === "ideas" && visible($("menuIdeas")));
  $("recipeDetailsPanel").open = true; await espera(30);
  ver("Buscar con filtros", visible($("recipeCatalogSearch")));
  ver("Ver solo mis recetas", visible($("recipeCatalogOnlyMine")));
  ver("Tamaño de página del catálogo", visible($("recipeCatalogPageSize")));
  ver("Pedir ideas a la IA", visible($("aiIdeasPanel")));
  await irA("hoy"); await tocar(q("#home [data-con-lo-que-tengo]"));
  ver("Con lo que tengo", pantalla() === "ideas" && visible($("pantryResults")));
  await irA("compras"); await tocar(q("#compras [data-open-pantry]"));
  ver("Despensa", pantalla() === "ingredientes" && visible($("pantryChips")));
  ver("Revisar qué tengo y qué falta", visible($("pantryReviewPanel")));
  await irA("mas"); await tocar(q("#backupOpen"));
  ver("Respaldo", pantalla() === "backupScreen" && visible($("backupExport")));
  ver("Exportar e importar comidas", visible(q("[data-export-plates]")) && visible(q("[data-import-plates]")));
  await irA("mas"); await tocar(q("#sectionSettings [data-open-como-funciona]"));
  ver("Publicación e instalación", visible($("deploymentGuide")));
  await irA("mas"); await tocar(q("#sectionSettings [data-open-preferencias]"));
  ver("Ingredientes a evitar", visible($("recipeAvoidWords")));
  ver("Ingredientes equivalentes", visible($("ingredientAliasPanel")));
  ver("Modo simple", visible($("uiModeToggle")));
  await irA("mas"); await tocar(q("#sectionSettings [data-open-fuentes]"));
  ver("Consultar nutrientes", visible($("nutritionLookupPanel")));
  await irA("miscomidas"); await tocar(q('.comida-card[data-recipe-id="recipe_e4test1"]'));
  ver("Calcular nutrientes", !!doc().querySelector("#comida .nutrition-box") && visible(doc().querySelector("#comida .nutrition-box")));
  await tocar($("recipeReadEdit"));
  ver("Mis cantidades por receta", visible($("recipeAmountsPanel")));
  await irA("semana"); await tocar(q("#plan [data-plan-menu]")); await tocar(q('.hoja [data-plan-herr="recetas"]'));
  ver("Asignar receta al plan actual", visible($("planRecipeAssign")));
  ev("planSavedRecipe('recipe_e4test1')"); await espera(300);
  ver("planSavedRecipe", pantalla() === "planHerramientas" && $("planRecipeSelect").value === "recipe_e4test1");
  ok("C4-8 cada herramienta movida se abre desde su lugar nuevo", faltan.length === 0, faltan.join(", "));

  // C4-9 Con lo que tengo: Ideas filtrada por la despensa (cambia al marcar un ingrediente) y las ideas se tocan
  cargar({ [MARCA]: '{"vista":true}' }); await abrir();
  await irA("hoy"); await tocar(q("#home [data-con-lo-que-tengo]"));
  const vacio = pantalla() === "ideas" && q("#ideasConLoQueTengoChip").getAttribute("aria-pressed") === "true" && !$("pantryResults").querySelector("[data-idea-open]");
  await irA("compras"); await tocar(q("#compras [data-open-pantry]"));
  await tocar(q('#pantryChips [data-pantry-toggle="pollo"]'));
  const enlace = /\(\d+\)/.test($("pantryIdeasLink").textContent);
  await tocar($("pantryIdeasLink"));
  const conIdeas = pantalla() === "ideas" && $("pantryResults").querySelectorAll("[data-idea-open]").length > 0;
  await tocar(q("#pantryResults [data-idea-open]"));
  ok("C4-9 Con lo que tengo muestra las ideas de tu despensa, el enlace de la despensa lleva ahí y las ideas se tocan", vacio && enlace && conIdeas && hojaAbierta());
  ev("hoja.cerrar()");

  // C4-10 Un tema por pantalla (apoyo de E4-un-tema): cada pantalla tiene solo lo de su tema
  const contiene = (pant, ids) => ids.filter(id => doc().getElementById(id) && $(pant).contains($(id)));
  const mezclas = [
    ...contiene("ingredientes", ["recipeBrowseView", "recipeReadView", "recipeEditorView", "aiIdeasPanel", "aiRecipePanel", "nutritionLookupPanel", "recipeAvoidWords", "ingredientAliasPanel", "recipeAmountsPanel", "pantryResults"]).map(x => "despensa:" + x),
    ...contiene("ideas", ["pantryChips", "pantryItemForm", "recipeEditorView", "recipeReadView", "nutritionLookupPanel"]).map(x => "ideas:" + x),
    ...contiene("comida", ["recipeEditorView", "recipeBrowseView", "pantryChips"]).map(x => "detalle:" + x),
    ...contiene("recetaEditar", ["recipeReadView", "recipeBrowseView", "pantryChips"]).map(x => "receta:" + x),
    ...contiene("preferencias", ["nutritionLookupPanel", "backupExport", "pantryChips"]).map(x => "preferencias:" + x),
    ...contiene("backupScreen", ["aiSettingsPanel", "deploymentGuide"]).map(x => "mis datos:" + x),
    ...contiene("misplatos", ["savedTools", "menuIdeas"]).map(x => "mis comidas:" + x)
  ];
  ok("C4-10 ninguna pantalla mezcla herramientas de otro tema", mezclas.length === 0, mezclas.join(", "));

  marco.remove(); localStorage.clear();
  return T;
})()
