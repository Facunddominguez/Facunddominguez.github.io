// R6 · Etapa 50 (Hoy anticipa): ítems H-01 a H-04 de docs/ronda-6-lista.md.
// Fecha fija: martes 24/11/2026 (mañana es el miércoles). Las comidas reales salen del catálogo (data.menuCatalog), como las agrega la app.
(async () => {
  const H = R6H(), { ok, espera } = H;
  const tocar = async (el, ms) => { if (!el) throw new Error("no hay elemento para tocar · tras " + H.T.length + " pruebas"); return H.tocar(el, ms) };
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const qa = s => [...doc().querySelectorAll(s)];
  const norm = H.norm, J = H.J, visible = H.visible;
  const AVISOS = "miPlatoFacil_hoyAvisos_v1";
  const abrir = async (hoy, extra, op) => { await H.abrirEn(hoy, { ...H.MARCA, ...extra }, op) };
  // Agrega comidas reales del catálogo (por su nombre corto) a un hueco de esta semana.
  const idea = (corto, dia, slot) => ev(`(() => { const i = data.menuCatalog.find(x => x.corto === ${JSON.stringify(corto)}); if (!i) throw Error("no está en el catálogo: " + ${JSON.stringify(corto)}); IdeasHoja.agregarIdeaALaSemana(i, ${JSON.stringify(dia)}, ${JSON.stringify(slot)}); hoja.cerrar && hoja.cerrar() })()`);
  const hoy = async () => { ev('openTab("compras"); openTab("hoy")'); await espera(350) };
  const caja = () => $("hoyAvisos"), manana = () => qa("#hoyAvisos [data-hoy-aviso-manana] .hoy-aviso__fila"), texto = () => norm(($("hoyAvisos") || { innerText: "" }).innerText);
  const POROTOS = "Cazuela de porotos negros", POLLO = "Pollo al horno con papas y batatas", NADA = "Tarta de acelga y huevo", HUMMUS = "Sándwich de hummus y queso";

  // ---- H-04: las palabras están en un archivo de datos ----
  await abrir("2026-11-24", {});
  const D = JSON.parse(ev("JSON.stringify(HOY_AVISOS_DATOS)"));
  ok("R6-H-04 las palabras de cada aviso (legumbres, carne/pollo/pescado, pasos) vienen de datos/avisos-hoy.json, incrustado en la app", D.version === 1 && Object.keys(D.legumbres.palabras).includes("porotos") && D.congelados.palabras.includes("pollo") && D.congelados.palabras.includes("merluza") && D.pasos.palabras.includes("marinar") && D.legumbres.excluir.includes("lata"), JSON.stringify(Object.keys(D)));
  const catalogo = JSON.parse(ev(`JSON.stringify([${JSON.stringify(POROTOS)}, ${JSON.stringify(POLLO)}, ${JSON.stringify(NADA)}].map(c => { const i = data.menuCatalog.find(x => x.corto === c); return i ? { corto: i.corto, ing: i.cantidades.map(x => x[0]), pasos: i.pasos.length } : null }))`));
  ok("R6-H-04 la prueba usa 3 recetas reales del catálogo: una con legumbres secas (porotos negros), una con pollo y una sin nada", catalogo.every(Boolean) && catalogo[0].ing.includes("Porotos negros") && catalogo[1].ing.includes("Pollo") && !catalogo[2].ing.some(n => /poroto|garbanzo|lenteja|pollo|carne|merluza|pescado|salm/i.test(n)), JSON.stringify(catalogo));

  // ---- H-02: sin nada para preparar, la tarjeta no aparece ----
  await hoy();
  ok("R6-H-02 con mañana vacío no hay tarjeta 'Para mañana' (y no ocupa lugar)", !manana().length && (!caja() || caja().hidden || !visible(caja())) && !/Para mañana/.test(texto()));
  idea(NADA, "miercoles", "almuerzo"); await hoy();
  ok("R6-H-02 con una receta real sin nada para anticipar (tarta de acelga y huevo) tampoco aparece", !manana().length && !/Para mañana/.test(texto()));
  idea(HUMMUS, "miercoles", "cena"); await hoy();
  ok("R6-H-02 una receta con garbanzos cuyos pasos no piden remojo (usa los de lata) no avisa", !manana().length && !/Para mañana/.test(texto()), texto());

  // ---- H-01: legumbres, carne/pollo/pescado, marinar ----
  idea(POROTOS, "miercoles", "cena"); await hoy();
  ok("R6-H-01 mañana hay porotos secos: 'Poné en remojo los porotos esta noche.' con un botón Listo", manana().length === 1 && /Para mañana/.test(texto()) && /Poné en remojo los porotos esta noche\./.test(norm(manana()[0].innerText)) && /^Listo$/.test(norm(manana()[0].querySelector("button").innerText)) && visible(manana()[0]), texto());
  const bListo = manana()[0].querySelector("button").getBoundingClientRect();
  ok("R6-H-01 el botón Listo mide al menos 44 px de alto", bListo.height >= 43.5 && bListo.width >= 43.5, JSON.stringify([bListo.width, bListo.height]));
  idea(POLLO, "miercoles", "almuerzo"); await hoy();
  ok("R6-H-01 con pollo (receta real del catálogo): 'Si están en el freezer, pasalos a la heladera: pollo.' junto al aviso de los porotos", manana().length === 2 && /Poné en remojo los porotos/.test(texto()) && /Si están en el freezer, pasalos a la heladera: pollo\./.test(texto()), texto());
  await tocar(manana().find(f => /remojo/.test(f.innerText)).querySelector("button"), 300);
  ok("R6-H-01 'Listo' oculta ese aviso y deja el otro", manana().length === 1 && !/remojo/.test(texto()) && /freezer/.test(texto()));
  ok("R6-H-01 'Listo' se guarda en miPlatoFacil_hoyAvisos_v1 con la fecha de hoy", JSON.stringify(J(AVISOS)) === JSON.stringify({ fecha: "2026-11-24", hechos: ["legumbres"] }), JSON.stringify(J(AVISOS)));
  ev('openTab("semana"); openTab("hoy")'); await espera(350);
  ok("R6-H-01 el aviso sigue oculto al volver a Hoy el mismo día", manana().length === 1 && !/remojo/.test(texto()));
  await tocar(manana()[0].querySelector("button"), 300);
  ok("R6-H-01 con los dos en 'Listo' la tarjeta desaparece", !manana().length && !/Para mañana/.test(texto()) && (!caja() || caja().hidden));
  ev("localStorage.setItem(" + JSON.stringify(AVISOS) + ", JSON.stringify({ fecha: '2026-11-23', hechos: ['legumbres', 'congelados'] }))"); await hoy();
  ok("R6-H-01 un 'Listo' de otro día no cuenta: los avisos vuelven a aparecer", manana().length === 2, texto());
  ev("localStorage.setItem(" + JSON.stringify(AVISOS) + ", '{\"cualquier\": 1}')"); await hoy();
  ok("R6-H-01 un valor guardado con mal formato se ignora (los avisos se ven) y no rompe Hoy", manana().length === 2);

  // Receta propia: pasos que dicen marinar o "de un día para otro"; legumbres de lata o cocidas no avisan; con pasos de remojo sí.
  const PROPIAS = [
    { id: "recipe_hoy50a", titulo: "Pechuga marinada de mi casa", filas: [{ name: "Cuadril", quantity: 400, unit: "g" }, { name: "Limón", quantity: 1, unit: "unidad" }], pasos: ["Marinar la carne con limón y ajo.", "Cocinar a la plancha."] },
    { id: "recipe_hoy50b", titulo: "Pan casero con masa madre", filas: [{ name: "Harina de trigo", quantity: 500, unit: "g" }], pasos: ["Dejá la masa en la heladera de un día para otro.", "Horneá."] },
    { id: "recipe_hoy50c", titulo: "Ensalada de porotos de lata", filas: [{ name: "Porotos cocidos", quantity: 200, unit: "g" }, { name: "Tomate", quantity: 2, unit: "unidad" }], pasos: ["Mezclar."] },
    { id: "recipe_hoy50d", titulo: "Porotos de la abuela", filas: [{ name: "Porotos blancos", quantity: 250, unit: "g" }, { name: "Cebolla", quantity: 1, unit: "unidad" }], pasos: ["Remojar los porotos desde la noche anterior.", "Hervir."] },
    { id: "recipe_hoy50e", titulo: "Guiso de lentejas", filas: [{ name: "Lentejas", quantity: 200, unit: "g" }, { name: "Cebolla", quantity: 1, unit: "unidad" }], pasos: ["Hervir las lentejas 30 minutos."] },
  ];
  const [a, b, c, d, e] = PROPIAS.map(x => "rp_" + x.id);
  const base = (slots, extra) => ({ ...H.recetas(PROPIAS), miPlatoFacil_plan: JSON.stringify(H.planDe(slots)), ...extra });
  await abrir("2026-11-24", base([["miercoles", "almuerzo", a], ["miercoles", "cena", b]])); await hoy();
  ok("R6-H-01 una receta que dice 'marinar' avisa con su nombre, y una que dice 'de un día para otro' también (y la carne cruda pide pasarla del freezer)", manana().length === 3 && /Pechuga marinada de mi casa/.test(texto()) && /Pan casero con masa madre/.test(texto()) && /freezer, pasalos a la heladera: cuadril\./.test(texto()), texto());
  await abrir("2026-11-24", base([["miercoles", "almuerzo", c], ["miercoles", "cena", e]])); await hoy();
  ok("R6-H-01 porotos cocidos (de lata) y lentejas no piden remojo: no hay tarjeta", !manana().length && !/Para mañana/.test(texto()), texto());
  await abrir("2026-11-24", base([["miercoles", "almuerzo", d]])); await hoy();
  ok("R6-H-01 una receta propia con porotos y 'remojar' en sus pasos avisa una sola vez (no también como marinado)", manana().length === 1 && /Poné en remojo los porotos esta noche\./.test(texto()), texto());
  // Las palabras vienen del archivo: sumar "lentejas" a los datos hace que ese guiso avise (con la regla de remojo, solo si habla de remojar).
  await abrir("2026-11-24", base([["miercoles", "almuerzo", e]]));
  ev('HOY_AVISOS_DATOS.legumbres.palabras.lentejas = "las"; HOY_AVISOS_DATOS.legumbres.remojo.push("hervir")'); await hoy();
  ok("R6-H-04 las palabras se leen del dato: agregar 'lentejas' y 'hervir' al dato cambia los avisos sin tocar el código", manana().length === 1 && /Poné en remojo las lentejas esta noche\./.test(texto()), texto());

  // Domingo: mañana es el lunes de la semana que viene.
  await abrir("2026-11-29", { ...H.recetas(PROPIAS), ...H.proxima("2026-11-30", [["lunes", "almuerzo", d]]), miPlatoFacil_plan: JSON.stringify(H.planDe([["lunes", "almuerzo", e]])) }); await hoy();
  ok("R6-H-01 el domingo, 'Para mañana' mira el lunes de la semana que viene (no el lunes que ya pasó)", manana().length === 1 && /porotos/.test(texto()) && !/lentejas/.test(texto()), texto());

  // ---- H-03: Para comprar hoy ----
  const COMPRAR = [
    { id: "recipe_hoy50f", titulo: "Tarta de zapallito y tomate", filas: [{ name: "Zapallito", quantity: 4, unit: "unidad" }, { name: "Tomate", quantity: 2, unit: "unidad" }, { name: "Queso cremoso", quantity: 150, unit: "g" }] },
  ];
  const f = "rp_recipe_hoy50f";
  const comprar = () => qa("#hoyAvisos [data-hoy-comprar-hoy]"), claves = () => JSON.parse(ev(`JSON.stringify(["Zapallito", "Tomate", "Queso cremoso"].map(n => ingredientKey(n)))`));
  const baseC = extra => ({ ...H.recetas(COMPRAR), miPlatoFacil_plan: JSON.stringify(H.planDe([["martes", "almuerzo", f]])), ...extra });
  await abrir("2026-11-24", baseC({})); await hoy();
  ok("R6-H-03 'Para comprar hoy: …' con lo que piden las comidas de hoy y no tenés ni tachaste", comprar().length === 1 && /Para comprar hoy: zapallito, tomate y queso cremoso/.test(norm(comprar()[0].querySelector("p").innerText)) && visible(comprar()[0]), texto());
  ok("R6-H-03 no se confunde con el 'Te falta: fruta' del plato completo (es otra línea, en otro lugar)", /Te falta/.test(norm($("todayCosto").innerText)) && !/Te falta/.test(texto()) && !/Para comprar/.test(norm($("todayCosto").innerText)));
  const verLista = comprar()[0].querySelector("button");
  ok("R6-H-03 tiene el botón 'Ver en la lista' de al menos 44 px", /^Ver en la lista$/.test(norm(verLista.innerText)) && verLista.getBoundingClientRect().height >= 43.5);
  // Tachar uno y tener otro en la Despensa
  const [kz, kt, kq] = claves();
  await abrir("2026-11-24", baseC({ miPlatoFacil_shoppingChecks_v1: JSON.stringify({ "2026-11-23": { t: [kz], c: [] } }), miPlatoFacil_pantry: JSON.stringify(["Tomate"]) })); await hoy();
  ok("R6-H-03 lo tachado en la lista y lo marcado en la Despensa no aparece: queda solo el queso", comprar().length === 1 && /Para comprar hoy: queso cremoso$/.test(norm(comprar()[0].querySelector("p").innerText)), texto());
  await abrir("2026-11-24", baseC({ miPlatoFacil_shoppingChecks_v1: JSON.stringify({ "2026-11-23": { t: [], c: [kz, kt] } }), miPlatoFacil_pantryQuantities_v1: JSON.stringify({ [ev(`Existencias.stockKey("Queso cremoso", "g")`)]: { name: "Queso cremoso", unit: "g", quantity: 500 } }) })); await hoy();
  ok("R6-H-03 lo comprado y lo que tenés con cantidad en la Despensa tampoco: sin faltantes, no aparece", !comprar().length && !/Para comprar/.test(texto()), texto());
  await abrir("2026-11-24", baseC({})); await hoy();
  await tocar(comprar()[0].querySelector("button"), 500);
  ok("R6-H-03 'Ver en la lista' abre Compras", $("compras").classList.contains("is-active") && /Zapallito/i.test(norm($("comprasList").innerText)), norm($("comprasList").innerText).slice(0, 80));
  // Sin plan de hoy: nada
  await abrir("2026-11-24", baseC({ miPlatoFacil_plan: JSON.stringify(H.planDe([["miercoles", "almuerzo", f]])) })); await hoy();
  ok("R6-H-03 si hoy no hay comidas planificadas, no aparece 'Para comprar hoy'", !comprar().length);
  // Máximo de nombres
  const MUCHAS = [{ id: "recipe_hoy50g", titulo: "Mucho de todo", filas: ["Zapallito", "Tomate", "Berenjena", "Brócoli", "Choclo", "Remolacha"].map(n => ({ name: n, quantity: 1, unit: "unidad" })) }];
  await abrir("2026-11-24", { ...H.recetas(MUCHAS), miPlatoFacil_plan: JSON.stringify(H.planDe([["martes", "cena", "rp_recipe_hoy50g"]])) }); await hoy();
  ok("R6-H-03 con muchos faltantes muestra 3 y cuenta el resto ('… y otros 3')", comprar().length === 1 && /Para comprar hoy: .+ y otros 3$/.test(norm(comprar()[0].querySelector("p").innerText)), texto());

  // ---- Datos: respaldo ----
  await abrir("2026-11-24", {});
  const R0 = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json(), w = H.w();
  const conClave = JSON.parse(JSON.stringify(R0)); conClave.data[AVISOS] = JSON.stringify({ fecha: "2026-11-24", hechos: ["legumbres"] });
  const malo = JSON.parse(JSON.stringify(R0)); malo.data[AVISOS] = '{"fecha":"ayer","hechos":[]}';
  let r1 = false, r2 = false, r3 = false;
  try { w.Respaldo.restoreCompleteBackup(conClave, w.localStorage); r1 = w.localStorage.getItem(AVISOS) === conClave.data[AVISOS] } catch (e) { }
  const exp = w.eval("completeBackupSnapshot(localStorage)").data;
  try { w.Respaldo.restoreCompleteBackup(JSON.parse(JSON.stringify(R0)), w.localStorage); r2 = true } catch (e) { }
  try { w.Respaldo.restoreCompleteBackup(malo, w.localStorage) } catch (e) { r3 = true }
  ok("R6-H-01 la clave miPlatoFacil_hoyAvisos_v1 entra al respaldo como opcional: se exporta, se restaura, un respaldo viejo sin ella se restaura igual y uno con formato malo se rechaza", r1 && exp[AVISOS] === conClave.data[AVISOS] && r2 && r3 && w.eval(`COMPLETE_BACKUP_KEYS.includes("${AVISOS}") && COMPLETE_BACKUP_OPTIONAL_KEYS.includes("${AVISOS}")`), JSON.stringify({ r1, r2, r3 }));
  await abrir("2026-11-24", {}); await hoy();
  ok("R6-H-01 sin avisos tocados con 'Listo' no se escribe nada en la clave", H.w().localStorage.getItem(AVISOS) === null);
  return H.terminar();
})()
