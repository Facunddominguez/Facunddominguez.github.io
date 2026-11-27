// Runs every battery in order on the current page. Set window.__expectVersion and window.__suites before evaluating.
(async () => {
  const load = async f => (0, eval)(await (await fetch("/tests/" + f, { cache: "no-store" })).text());
  await load("r2_fixtures.js");
  await load("r5_base.js");
  await load("r6_base.js");
  // Etapa 46: "Esta semana" de la lista cuenta de hoy al domingo (R6-L-02). Estas baterías (de las Rondas 1 a 5) arman el plan con comidas del
  // lunes y miraban la lista entera: para que no dependan del día de la semana en que se corren, corren un lunes: el de la semana de hoy (así las
  // claves por semana no cambian), tanto en la página como en cada marco de la app que abre la batería. Las demás siguen con la fecha real y
  // las de la Ronda 6 fijan su propio día.
  const LUNES = new Set(["u01_toque.js", "f02_units.js", "f01_int.js", "f01_alias.js", "f01_rec.js", "f03_plan.js", "r3_rec.js", "r3_saved.js", "regression.js", "j01_recorridos.js", "e1_confianza.js", "e5_compras.js", "e7_precios.js", "e8_herramientas.js", "e20_un_costo.js", "e21_ficha_precio.js", "e23_catalogo_lista.js", "e24_semana_clara.js", "r2_shop.js", "r4_ux.js", "r4e26_lista.js"]);
  const enMarco = e => { if (e.target && e.target.tagName === "IFRAME") { try { R6_LUNES(e.target.contentWindow) } catch (err) { } } };
  const suites = window.__suites || ["f02_units.js", "f01_key.js", "f01_int.js", "f01_alias.js", "r4_ux.js", "r3_rec.js", "r3_dup.js", "r3_saved.js", "r2_dom.js", "r2_uni.js", "r2_pan.js", "r2_shop.js", "bkp01.js", "bkp02.js", "imp01.js", "regression.js"];
  const out = {}; let total = 0, pass = 0;
  for (const f of suites) {
    localStorage.clear();
    const lunes = LUNES.has(f);
    if (lunes) { R6_LUNES(window); document.addEventListener("load", enMarco, true) }
    let r; try { r = await load(f) } catch (e) { r = ["FALLA " + f + " interrumpida: " + e.message] }
    if (lunes) { document.removeEventListener("load", enMarco, true); R6_REAL(window) }
    total += r.length; pass += r.filter(x => x.startsWith("PASA")).length;
    // Detalle de cada prueba (lo usa herramientas/probar.mjs --json); lo demás queda igual.
    (out.__detalle ||= {})[f] = r.map(x => ({ ok: x.startsWith("PASA"), texto: x.replace(/^(PASA|FALLA) /, "") }));
    out[f] = r.filter(x => x.startsWith("PASA")).length + "/" + r.length;
    const fails = r.filter(x => !x.startsWith("PASA")); if (fails.length) out[f + "_fallas"] = fails;
  }
  out.TOTAL = pass + "/" + total; localStorage.clear();
  return out;
})()
