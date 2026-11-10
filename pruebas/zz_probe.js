(async () => {
  const T = []; const espera = ms => new Promise(r => setTimeout(r, ms));
  localStorage.clear(); localStorage.setItem("miPlatoFacil_bienvenida_v1", '{"vista":true}');
  const marco = document.createElement("iframe"); marco.style.cssText = "position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0"; document.body.append(marco);
  await new Promise(r => { marco.onload = r; marco.src = "/index.html?m=" + Date.now() }); await espera(500);
  const w = marco.contentWindow, ev = x => w.eval(x);
  const r = JSON.parse(ev(`(() => { const nombres = new Set(); for (const i of data.menuCatalog.concat(data.desayunoCatalog)) for (const c of (i.cantidades || [])) nombres.add(c[0]);
    const kg = [...nombres].map(n => { const c = precioDe(n, 1000, "g"); const u = precioDe(n, 1, "unidad"); return [n, c ? Math.round(c.costo) : (estimadoDePrecio(n, 1000, "g") ? "est" + Math.round(estimadoDePrecio(n, 1000, "g").costo) : null), u ? Math.round(u.costo) : null] });
    const nuevos = data.menuCatalog.slice(41).concat(data.desayunoCatalog).map(i => [i.text.slice(0, 34), Math.round(Bienvenida.costoPorPorcionDeIdea(i))]);
    return JSON.stringify({ kg, nuevos }) })()`));
  T.push("PASA " + JSON.stringify(r.kg));
  T.push("PASA " + JSON.stringify(r.nuevos));
  marco.remove(); localStorage.clear(); return T;
})()
