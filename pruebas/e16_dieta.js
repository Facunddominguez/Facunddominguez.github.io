// E16: Etapa 16 del rediseño (Filtros de dieta reales). C16-1 a C16-4 son los controles E16-catalogo-sin-excluidos, E16-todas-las-vias, E16-avisa-y-respaldo
// y E16-sin-etiquetas-de-salud de docs/validacion/criterios.json. La app se abre en un marco aparte. Datos inventados.
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
  const tocar = async el => { el.click(); await espera(120) };
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' }, DIETA = "miPlatoFacil_dieta_v1";
  const norm = s => " " + String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ]+/g, " ").trim() + " ";
  // Oráculo propio de la prueba: ingredientes excluidos por filtro (nombres tal como están en el catálogo y en el armado).
  const EXCLUIDOS = {
    sin_carne_roja: ["carne vacuna", "carne magra", "bife", "asado", "vacio", "nalga", "cuadril", "lomo", "cordero", "carne de cerdo"],
    sin_cerdo: ["cerdo", "bondiola", "pechito", "jamon", "panceta", "chorizo"],
    sin_pescado: ["pescado", "merluza", "atun", "caballa", "salmon", "sardina", "filet"],
    vegetariano: ["carne", "bife", "pollo", "pavo", "cerdo", "jamon", "pescado", "merluza", "atun", "salmon", "caballa", "bondiola"],
    sin_lacteos: ["leche", "queso", "yogur", "manteca", "crema de leche", "ricota"],
    sin_huevo: ["huevo", "clara", "omelette"]
  };
  const viola = (filtros, texto) => { const t = norm(texto); return filtros.flatMap(f => EXCLUIDOS[f].filter(p => t.includes(" " + p + " ") || t.includes(" " + p + "s "))).slice(0, 3) };
  const catalogoTexto = i => i.text + " " + (i.tags || []).join(" ") + " " + ev("ideaIngredientes(" + JSON.stringify(i) + ")").join(" ");

  // C16-1 Ninguna sugerencia contiene un ingrediente excluido (todo el catálogo, con cada filtro y con varios juntos).
  cargar(MARCA); await abrir();
  const combos = [["sin_carne_roja"], ["sin_cerdo"], ["sin_pescado"], ["vegetariano"], ["sin_lacteos"], ["sin_huevo"], ["vegetariano", "sin_lacteos", "sin_huevo"], ["sin_carne_roja", "sin_cerdo", "sin_pescado"]];
  const malos = [], restan = {};
  for (const f of combos) {
    localStorage.setItem(DIETA, JSON.stringify({ filtros: f }));
    const idea = JSON.parse(ev("JSON.stringify(data.menuCatalog.filter(i => textoPermitido(i.text + ' ' + (i.tags || []).join(' ') + ' ' + ideaIngredientes(i).join(' '))))"));
    restan[f.join("+")] = idea.length;
    for (const i of idea) { const v = viola(f, catalogoTexto(i)); if (v.length) malos.push(f.join("+") + ": " + i.text + " → " + v.join(",")) }
    // Sugerime y el Selector (sugerenciasPara) y la pantalla de Ideas.
    for (const comida of ["almuerzo", "cena"]) for (const s of JSON.parse(ev(`JSON.stringify(sugerenciasPara("${comida}", "").map(x => x.tipo === "idea" ? x.idea.text + " " + (x.idea.tags || []).join(" ") + " " + ideaIngredientes(x.idea).join(" ") : mealName(x.item) + " " + extractIngredients(x.item).join(" ")))`))) { const v = viola(f, s); if (v.length) malos.push(f.join("+") + " sugerencia: " + s.slice(0, 50) + " → " + v.join(",")) }
    for (const i of JSON.parse(ev("JSON.stringify(filteredMenuRecords())"))) { const v = viola(f, catalogoTexto(i)); if (v.length) malos.push(f.join("+") + " Ideas: " + i.text + " → " + v.join(",")) }
  }
  // Y se ve que filtra: vegetariano deja menos ideas que sin filtros.
  ok("C16-1 ninguna sugerencia del catálogo contiene un ingrediente excluido, con cada filtro y con varios juntos", !malos.length && restan.vegetariano < 41 && restan.vegetariano > 5 && restan["vegetariano+sin_lacteos+sin_huevo"] > 0, JSON.stringify({ malos: malos.slice(0, 5), restan }));

  // C16-2 Armame la semana y el armado de desayunos también cumplen los filtros (nombre e ingredientes de cada comida asignada).
  const maloArmame = [], armados = {}; let avisoVegano = false;
  for (const f of [["vegetariano", "sin_lacteos", "sin_huevo"], ["sin_pescado", "sin_cerdo"], ["sin_huevo"]]) {
    cargar({ ...MARCA, [DIETA]: JSON.stringify({ filtros: f }) }); await abrir();
    ev('ArmameSemana.aplicar(ArmameSemana.armar({ modo: "todo" }))'); await espera(100);
    const p = JSON.parse(localStorage.getItem("miPlatoFacil_plan")), s = JSON.parse(localStorage.getItem("miPlatoFacil_saved"));
    let n = 0;
    for (const d of Object.keys(p)) for (const sl of Object.keys(p[d])) {
      const it = s.find(x => x.id === p[d][sl]); if (!it) continue; n++;
      const txt = ev("mealName(" + JSON.stringify(it) + ")") + " " + ev("extractIngredients(" + JSON.stringify(it) + ")").join(" ");
      const v = viola(f, txt); if (v.length) maloArmame.push(f.join("+") + " " + d + "|" + sl + ": " + txt.slice(0, 60) + " → " + v.join(","))
    }
    armados[f.join("+")] = n;
    if (f.length === 3) avisoVegano = /huecos sin llenar/.test(ev('ArmameSemana.resumen(ArmameSemana.armar({ modo: "todo" }))'))
  }
  ok("C16-2 Armame la semana no arma ninguna comida con un ingrediente excluido", !maloArmame.length && armados["sin_pescado+sin_cerdo"] === 28 && armados["sin_huevo"] === 28 && armados["vegetariano+sin_lacteos+sin_huevo"] >= 10 && avisoVegano, JSON.stringify({ maloArmame: maloArmame.slice(0, 5), armados }));

  // C16-3 Las opciones se eligen en Preferencias, "Otros" sigue, avisan si dejan pocas, se guardan en el respaldo (opcional) y uno inválido se rechaza.
  cargar(MARCA); await abrir();
  ev('go("preferencias")'); await espera(150);
  const chips = [...doc().querySelectorAll("#dietaChips [data-dieta-filtro]")].map(b => b.textContent);
  await tocar(q('#dietaChips [data-dieta-filtro="vegetariano"]')); await tocar(q('#dietaChips [data-dieta-filtro="sin_lacteos"]')); await tocar(q('#dietaChips [data-dieta-filtro="sin_huevo"]'));
  const guardado = localStorage.getItem(DIETA), aviso = doc().getElementById("dietaAviso").textContent;
  const otros = !!doc().getElementById("recipeAvoidWords") && /Otros/.test(doc().querySelector('label[for="recipeAvoidWords"]').textContent);
  const snap = JSON.parse(ev("JSON.stringify(completeBackupSnapshot(localStorage))"));
  const enRespaldo = snap.data[DIETA] === guardado && ev('COMPLETE_BACKUP_OPTIONAL_KEYS.includes("miPlatoFacil_dieta_v1")');
  const malo = JSON.parse(JSON.stringify(snap)); malo.data[DIETA] = '{"filtros":["sin_gluten"]}';
  let rechazado = false; try { ev("validateCompleteBackup(" + JSON.stringify(malo) + ")") } catch (e) { rechazado = true }
  const R = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json(); let viejoOk = true; try { ev("validateCompleteBackup(" + JSON.stringify(R) + ")") } catch (e) { viejoOk = false }
  await tocar(q('#dietaChips [data-dieta-filtro="vegetariano"]'));
  const sacado = localStorage.getItem(DIETA);
  ok("C16-3 los filtros se eligen en Preferencias, \"Otros\" sigue, se avisa si quedan pocas ideas y van al respaldo como opcionales",
    chips.join() === "Sin carne roja,Sin cerdo,Sin pescado,Vegetariano,Sin lácteos,Sin huevo" && guardado === '{"filtros":["vegetariano","sin_lacteos","sin_huevo"]}' && otros && /pocas ideas|ninguna idea/.test(aviso) && enRespaldo && rechazado && viejoOk && sacado === '{"filtros":["sin_lacteos","sin_huevo"]}',
    JSON.stringify({ chips, guardado, aviso, otros, enRespaldo, rechazado, viejoOk, sacado }));

  // C16-4 Sin etiquetas de salud que no se puedan verificar.
  const texto = (await (await fetch("/index.html", { cache: "no-store" })).text()).toLowerCase();
  const etiquetas = ["apto celíaco", "apto celiaco", "sin tacc", "apto diabéticos", "apto diabeticos", "libre de gluten", "hipoalergénico", "hipoalergenico", "apto veganos"].filter(e => texto.includes(e));
  ok("C16-4 la app no muestra etiquetas de salud que no se puedan verificar (apto celíaco, sin TACC…)", !etiquetas.length, etiquetas.join(", "));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
