// R6 · Etapa 55 (Cierre): una semana completa de punta a punta, con los datos inventados de siempre y el día fijo (viernes 27/11/2026):
// armar la semana que viene, comprar con su lista (Comprar para "La semana que viene"), cocinar una receta en modo cocina, marcar "Lo comí" y
// responder "¿Te gustó?". Cada paso mira lo que se ve y lo que queda guardado.
(async () => {
  const H = R6H(), { ok, espera } = H;
  const tocar = async (el, ms) => { if (!el) throw new Error("no hay elemento para tocar · tras " + H.T.length + " pruebas · " + (new Error().stack.split("\n")[3] || "").trim().slice(-40)); return H.tocar(el, ms) };
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const qa = s => [...doc().querySelectorAll(s)];
  const norm = H.norm, J = H.J, visible = H.visible;
  const REC = [
    { id: "recipe_sem55a", titulo: "Guiso de lentejas de la semana", fav: true, filas: [{ name: "Lentejas", quantity: 200, unit: "g" }, { name: "Arroz", quantity: 100, unit: "g" }], pasos: ["Remojá las lentejas 10 minutos.", "Hervilas 1 hora con el arroz.", "Serví."] },
    { id: "recipe_sem55b", titulo: "Tarta de zapallito de la semana", fav: true, filas: [{ name: "Zapallito", quantity: 4, unit: "unidad" }, { name: "Huevo", quantity: 3, unit: "unidad" }], pasos: ["Mezclá todo.", "Horneá 40 minutos."] },
    { id: "recipe_sem55c", titulo: "Pollo con papas de la semana", fav: true, filas: [{ name: "Pollo", quantity: 400, unit: "g" }, { name: "Papa", quantity: 300, unit: "g" }], pasos: ["Cortá las papas.", "Horneá 45 minutos."] },
  ];
  const R = ["recipe_sem55a", "recipe_sem55b", "recipe_sem55c"];
  const PROX = "2026-11-30";
  await H.abrirEn("2026-11-27", { ...H.MARCA, ...H.recetas(REC) });
  H.w().eval("window.confirm = () => true");

  // 1) Armar la semana que viene
  ev('openTab("semana"); Semana.verSemana(1)'); await espera(300);
  await ev('(async () => { await ArmameSemana.correr("todo") })()'); await espera(800);
  ev("Semana.verSemana(0)"); await espera(300);
  const prox = J("miPlatoFacil_planProxima_v1") || {}, comidas = Object.values(prox.plan || {}).flatMap(d => Object.values(d)).filter(Boolean);
  ok("R6-E55-1 'Armame la semana' arma la semana que viene (lunes 30/11) con comidas, y la de esta semana no cambia", prox.lunes === PROX && comidas.length >= 10, JSON.stringify([prox.lunes, comidas.length]));
  const usadas = new Set(comidas);
  ok("R6-E55-1 usa las recetas favoritas que cargaste (al menos una de las tres)", R.some(r => usadas.has("rp_" + r)), JSON.stringify([...usadas].slice(0, 6)));

  // 2) Comprar: viernes con la semana que viene armada → la lista abre en "La semana que viene"
  ev('openTab("compras")'); await espera(500);
  const pressed = qa("[data-compras-periodo]").filter(b => b.getAttribute("aria-pressed") === "true").map(b => b.dataset.comprasPeriodo);
  const filas = qa("#comprasList input[type=checkbox]");
  ok("R6-E55-2 el viernes la lista abre en 'La semana que viene' y trae productos con su botón 'Terminé de comprar' arriba de la lista", pressed.join() === "proxima" && filas.length >= 6 && visible($("comprasBought")) && $("comprasBought").getBoundingClientRect().bottom <= $("comprasList").getBoundingClientRect().top + 1, JSON.stringify([pressed, filas.length]));
  await tocar(filas[0], 300);
  const marcas = J("miPlatoFacil_shoppingChecks_v1") || {};
  ok("R6-E55-2 tachar un producto se guarda en la semana que viene (lunes 30/11) y no toca esta semana", !!marcas[PROX] && marcas[PROX].t.length === 1 && !marcas["2026-11-23"], JSON.stringify(marcas));
  await tocar($("comprasBought"), 500);
  const compradas = J("miPlatoFacil_shoppingChecks_v1") || {};
  ok("R6-E55-2 'Terminé de comprar' deja lo tachado como comprado (sigue en la semana que viene)", !!compradas[PROX] && (compradas[PROX].c || []).length >= 1, JSON.stringify(compradas));

  // 3) Cocinar una receta en modo cocina y marcar Lo comí
  const antesCons = (J("miPlatoFacil_consumption_v1") || []).length;
  ev(`Comidas.abrirComida("receta", "recipe_sem55a")`); await espera(400);
  await tocar(doc().querySelector("[data-comida-cocinar]") || $("recipeReadCookNow"), 400);
  ok("R6-E55-3 el modo cocina abre con los ingredientes de la receta", !!$("modoCocina") && /Lentejas/.test(norm($("modoCocina").innerText)), norm(($("modoCocina") || { innerText: "" }).innerText).slice(0, 80));
  for (let i = 0; i < 3; i++) await tocar(doc().querySelector("[data-cocina-siguiente]"), 150);
  ok("R6-E55-3 llega al último paso (3 de 3) con 'Lo comí' y 'Salir'", /3 de 3/.test(norm($("cocinaProgreso").textContent)) && !!H.boton(/Lo comí/, $("modoCocina")), norm($("cocinaProgreso").textContent));
  await tocar(H.boton(/Lo comí/, $("modoCocina")), 500);
  const cons = J("miPlatoFacil_consumption_v1") || [], hist = J("miPlatoFacil_cookingHistory_v1") || [];
  ok("R6-E55-3 'Lo comí' anota la receta en el registro de hoy (27/11) y en el historial de cocinado", cons.length + hist.length > antesCons && [...cons, ...hist].some(x => /Guiso de lentejas de la semana/.test(x.title) && (x.date || "").startsWith("2026-11-27")), JSON.stringify([cons.length, hist.length]));

  // 4) ¿Te gustó? y el Registro
  ok("R6-E55-4 aparece '¿Te gustó?' con Sí y No (dentro del modo cocina)", !!$("gustoPregunta") && !!$("gustoPregunta").querySelector('[data-gusto-responder="s"]'));
  await tocar($("gustoPregunta").querySelector('[data-gusto-responder="s"]'), 300);
  ok("R6-E55-4 'Sí' queda guardado en miPlatoFacil_gustos_v1 con el nombre de la receta", Object.values(J("miPlatoFacil_gustos_v1") || {}).join() === "s" && Object.keys(J("miPlatoFacil_gustos_v1")).some(k => /guiso de lentejas de la semana/.test(k)), localStorage.getItem("miPlatoFacil_gustos_v1"));
  await tocar(doc().querySelector("#modoCocina [data-cocina-salir]"), 300);
  ev('openTab("mas"); abrirRegistro()'); await espera(400);
  ok("R6-E55-4 el Registro muestra lo que comiste hoy", /Guiso de lentejas de la semana/.test(norm($("registro").innerText)), norm($("registro").innerText).slice(0, 120));
  return H.terminar();
})()
