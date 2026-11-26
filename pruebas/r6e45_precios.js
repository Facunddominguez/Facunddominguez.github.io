// R6 · Etapa 45 (Precios confiables), parte de la app: ítems P-04 y P-05 de docs/ronda-6-lista.md.
// (P-01 a P-03 son de la tarea de precios y se prueban en Node: pruebas/r6e45_precios.mjs.)
// Datos inventados; precios congelados (pruebas/fixtures/precios-congelados.json: SEPA del 2026-11-04). El "hoy" del teléfono se fija.
(async () => {
  const H = R6H(), { ok, espera, tocar } = H;
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const PRECIOS = { miPlatoFacil_mostrarPrecios_v1: '{"mostrar":true}' };
  const COMPRAS = { ...H.MARCA, ...PRECIOS, ...H.PRES(60000) };
  const irCompras = async () => { ev('openTab("compras")'); await espera(300) };
  const abrir = async (hoy, extra = {}) => { await H.abrirEn(hoy, { ...COMPRAS, ...extra }); await H.armar("todo"); H.fijarFecha(hoy); await irCompras() };

  // ---- 22 días después de la fecha de SEPA (4 nov.) ----
  await abrir("2026-11-26");
  const fuente = H.norm($("comprasPrecioFuente").innerText), aviso = $("comprasPreciosViejos");
  ok("R6-P-04 en la lista, junto a la fuente de precios, dice 'Precios de hace 22 días' (contado contra la fecha del teléfono)", H.visible($("comprasPrecioFuente")) && /SEPA/.test(fuente) && /Precios de hace 22 días$/.test(fuente), fuente);
  // Presupuesto: se abre desde el renglón de arriba de la lista.
  await tocar($("comprasPresupuesto"), 400);
  const presu = H.norm($("shoppingBudgetResult").innerText);
  ok("R6-P-04 en el presupuesto, junto a la fuente de precios, dice 'Precios de hace 22 días'", /SEPA/.test(presu) && /Precios de hace 22 días/.test(presu) && H.visible($("shoppingBudgetResult")), presu.slice(-140));
  // Ficha de precio de un ingrediente con precio automático.
  const ficha = ev('(() => { const c = fichaPrecio("Arroz"); document.body.append(c); c.id = "fichaPrueba"; return c.innerText })()');
  ok("R6-P-04 en la ficha de precio, bajo el precio, dice 'Precios de hace 22 días'", /Precios de hace 22 días/.test(ficha) && /≈ \$/.test(ficha), H.norm(ficha).slice(0, 160));
  ev('document.getElementById("fichaPrueba").remove()');
  // Otros días: hoy, ayer, y un teléfono con fecha anterior al archivo no inventa nada.
  const antig = async hoy => { H.fijarFecha(hoy); return ev("antiguedadPrecios()") };
  ok("R6-P-04 la antigüedad se escribe en palabras: hoy, ayer, hace 2 días, hace 120 días; y con la fecha del teléfono anterior a la del archivo no se muestra",
    (await antig("2026-11-04")) === "Precios de hoy" && (await antig("2026-11-05")) === "Precios de ayer" && (await antig("2026-11-06")) === "Precios de hace 2 días" && (await antig("2027-03-04")) === "Precios de hace 120 días" && (await antig("2026-10-01")) === "");

  // ---- P-05: aviso desde los 14 días ----
  const textoAviso = async hoy => { await abrir(hoy); const a = $("comprasPreciosViejos"); return { visible: H.visible(a), texto: H.norm(a.innerText) } };
  const dia14 = await textoAviso("2026-11-18"), dia13 = await textoAviso("2026-11-17"), dia22 = await textoAviso("2026-11-26");
  ok("R6-P-05 desde los 14 días la lista muestra 'Los precios pueden estar desactualizados. Tus precios (Mi precio) se usan primero.'",
    dia14.visible && dia22.visible && dia14.texto === "Los precios pueden estar desactualizados. Tus precios (Mi precio) se usan primero." && dia22.texto === dia14.texto, JSON.stringify([dia14, dia22]));
  ok("R6-P-05 con menos de 14 días (13) el aviso no aparece", !dia13.visible && dia13.texto === "", JSON.stringify(dia13));
  // Sin precios activados no hay aviso (la lista no muestra precios).
  await H.abrirEn("2026-11-26", { ...H.MARCA, miPlatoFacil_mostrarPrecios_v1: '{"mostrar":false}' });
  await H.armar("todo"); await irCompras();
  ok("R6-P-05 con los precios apagados no se muestra ni la antigüedad ni el aviso", !H.visible($("comprasPreciosViejos")) && !H.visible($("comprasPrecioFuente")));

  return H.terminar();
})()
