// Runs every battery in order on the current page. Set window.__expectVersion and window.__suites before evaluating.
(async () => {
  const load = async f => (0, eval)(await (await fetch("/tests/" + f, { cache: "no-store" })).text());
  await load("r2_fixtures.js");
  const suites = window.__suites || ["f02_units.js", "f01_key.js", "f01_int.js", "f01_alias.js", "r4_ux.js", "r3_rec.js", "r3_dup.js", "r3_saved.js", "r2_dom.js", "r2_uni.js", "r2_pan.js", "r2_shop.js", "bkp01.js", "bkp02.js", "imp01.js", "regression.js"];
  const out = {}; let total = 0, pass = 0;
  for (const f of suites) {
    localStorage.clear();
    let r; try { r = await load(f) } catch (e) { r = ["FALLA " + f + " interrumpida: " + e.message] }
    total += r.length; pass += r.filter(x => x.startsWith("PASA")).length;
    // Detalle de cada prueba (lo usa herramientas/probar.mjs --json); lo demás queda igual.
    (out.__detalle ||= {})[f] = r.map(x => ({ ok: x.startsWith("PASA"), texto: x.replace(/^(PASA|FALLA) /, "") }));
    out[f] = r.filter(x => x.startsWith("PASA")).length + "/" + r.length;
    const fails = r.filter(x => !x.startsWith("PASA")); if (fails.length) out[f + "_fallas"] = fails;
  }
  out.TOTAL = pass + "/" + total; localStorage.clear();
  return out;
})()
