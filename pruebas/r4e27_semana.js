// R4-27: Etapa 27 de la Ronda 4 ("Semana más corta y con tus objetivos"). Controles R4-27-aviso, R4-27-un-mensaje, R4-27-arriba,
// R4-27-iconos, R4-27-chips y R4-27-objetivos de docs/validacion/criterios.json. Datos inventados y precios congelados.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null;
  const abrir = async ancho => {
    if (marco) marco.remove();
    marco = document.createElement("iframe"); marco.id = "marcoPrueba";
    marco.style.cssText = `position:fixed;left:0;top:0;width:${ancho || 390}px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1`;
    document.body.append(marco);
    await new Promise((res, rej) => { marco.onload = res; marco.onerror = rej; marco.src = "/index.html?marco=" + Date.now() });
    await espera(500);
    w = marco.contentWindow; w.confirm = () => true; w.prompt = () => "";
  };
  const ev = x => w.eval(x), doc = () => w.document;
  const texto = id => (doc().getElementById(id) || { textContent: "" }).textContent;
  const cargar = datos => { localStorage.clear(); for (const [k, v] of Object.entries(datos)) if (v !== null) localStorage.setItem(k, v) };
  const MARCA = { miPlatoFacil_bienvenida_v1: '{"vista":true}' };
  const PRES = l => ({ miPlatoFacil_shoppingBudget_v1: JSON.stringify({ currency: "ARS", limit: l, period: "semana" }) });
  const HOGAR = n => ({ miPlatoFacil_hogar_v1: JSON.stringify({ personas: n }) });
  const METAS = o => ({ miPlatoFacil_habitGoals_v1: JSON.stringify(o) });
  const pesos = t => Number(String(t).replace(/\./g, ""));
  const armar = async modo => { ev('openTab("semana")'); await espera(200); ev(`ArmameSemana.correr(${JSON.stringify(modo || "todo")})`); await espera(500) };

  // R4-27-aviso
  cargar({ ...MARCA, ...PRES(90000), ...HOGAR(2) }); await abrir(390); await armar();
  const av = texto("planAviso"), total = Math.round(ev("costoSemanaPlan().total"));
  const m = /Te pasás \$([\d.]+) de tu presupuesto de \$90\.000\. Lo que más pesa: ([^.]+)\./.exec(av);
  const pesan = m ? m[2].split(/, | y /) : [];
  const detalleCerrado = !!doc().querySelector("#planAviso details.semana-aviso__detalle") && !doc().querySelector("#planAviso details").open;
  cargar({ ...MARCA, ...PRES(200000) }); await abrir(390); await armar();
  const av1 = texto("planAviso");
  ok("R4-27-aviso con 2 personas y $90.000 dice 'Te pasás $…' (total menos presupuesto) y nombra 3 productos; con 1 persona y $200.000, 'Entra en tu presupuesto'; Deshacer y Ver detalle van en el aviso",
    !!m && Math.abs(pesos(m[1]) - (total - 90000)) <= 1 && pesan.length === 3 && /^Listo: 28 comidas armadas · ≈ \$[\d.]+ la semana\./.test(av) && /Deshacer/.test(av) && detalleCerrado
    && /Entra en tu presupuesto de \$200\.000/.test(av1) && !!doc().querySelector("#planAviso [data-plan-deshacer]"), JSON.stringify({ av: av.slice(0, 260), total, pesan, detalleCerrado, av1: av1.slice(0, 130) }));

  // R4-27-un-mensaje
  cargar({ ...MARCA }); await abrir(390);
  ev('openTab("semana")'); await espera(200);
  ev('planStatus("Registrado como comido hoy. El plan no cambió.")');
  const habia = texto("planStatus");
  ev('openTab("hoy")'); await espera(200); ev('openTab("semana")'); await espera(250);
  const trasVolver = texto("planStatus");
  cargar({ ...MARCA, ...PRES(90000) }); await abrir(390); await armar();
  ev('planStatus("Otro mensaje")');
  ok("R4-27-un-mensaje al abrir Semana desde otra pestaña #planStatus está vacío; después de armar solo #planAviso tiene texto",
    habia !== "" && trasVolver === "" && texto("planStatus") === "" && texto("planAviso") !== "", JSON.stringify({ habia, trasVolver, status: texto("planStatus"), aviso: texto("planAviso").slice(0, 60) }));

  // R4-27-arriba y R4-27-chips
  const metas = METAS({ verduras: 10, legumbres: 3, pescado: 2, fruta: 7 });
  // Caso común: 1 persona y un presupuesto que alcanza (aviso de una línea corta). Caso más largo: 2 personas y $90.000 (aviso con "Te pasás…").
  const arriba = {}, largo = {};
  for (const ancho of [390, 320]) for (const [dest, extra] of [[arriba, { ...PRES(100000) }], [largo, { ...PRES(90000), ...HOGAR(2) }]]) {
    cargar({ ...MARCA, ...extra, ...metas }); await abrir(ancho); await armar();
    ev("window.scrollTo(0, 0)"); await espera(100);
    const h = doc().querySelector("#planList .hueco");
    dest[ancho] = { top: Math.round(h.getBoundingClientRect().top), chips: [...doc().querySelectorAll("#planDias .semana-dia-chip")].map(c => Math.round(c.getBoundingClientRect().width * 10) / 10), aviso: texto("planAviso").length };
  }
  ok("R4-27-arriba con la semana armada y sin desplazar, el primer hueco queda a 500 px o menos del borde de arriba a 390 px y a 600 px o menos a 320 px (caso común: 1 persona y presupuesto que alcanza; con 2 personas y $90.000 y el aviso más largo, 540 y 600 px)",
    arriba[390].top <= 500 && arriba[320].top <= 600 && largo[390].top <= 540 && largo[320].top <= 600, JSON.stringify({ comun: { 390: arriba[390].top, 320: arriba[320].top }, largo: { 390: largo[390].top, 320: largo[320].top } }));
  ok("R4-27-chips a 390 px los 7 chips de los días miden 44 px o más de ancho", arriba[390].chips.length === 7 && arriba[390].chips.every(x => x >= 43.9), JSON.stringify(arriba[390].chips));

  // R4-27-iconos
  cargar({ ...MARCA, ...PRES(90000) }); await abrir(390); await armar();
  const etiquetas = [...doc().querySelectorAll("#planList .hueco__comida")].map(e => e.textContent), nombres = [...doc().querySelectorAll("#planList .hueco__plato")].map(e => e.textContent);
  const conEmoji = nombres.filter(n => /^[\p{Extended_Pictographic}⭐]/u.test(n));
  ok("R4-27-iconos ningún nombre de comida empieza con emoji y la merienda lleva ☕ en su etiqueta",
    etiquetas.length === 4 && conEmoji.length === 0 && etiquetas.some(e => /^☕ Merienda/.test(e)) && etiquetas.some(e => /^🍳 Desayuno/.test(e)) && nombres.length === 4, JSON.stringify({ etiquetas, nombres }));

  // R4-27-objetivos: con "pescado: 2" y $200.000, en 10 semanas distintas siempre hay 2 o más comidas con pescado; con $20.000, el detalle nombra el objetivo que falló.
  cargar({ ...MARCA, ...PRES(200000), ...METAS({ pescado: 2 }) }); await abrir(390);
  const semanas = [];
  for (let i = 0; i < 10; i++) {
    semanas.push(ev(`(() => { Semana.semanaActual = () => "2026-0${i < 9 ? 1 : 2}-${String(5 + i).padStart(2, "0")}"; const r = ArmameSemana.armar({ modo: "todo" }); return JSON.stringify({ llenos: r.llenos, sinObjetivo: r.sinObjetivo }) })()`));
  }
  const sem = semanas.map(s => JSON.parse(s));
  cargar({ ...MARCA, ...PRES(200000), ...METAS({ pescado: 2 }) }); await abrir(390); await armar();
  const pescadoReal = Number((/Pescado (\d+)\/2/.exec(texto("planObjetivos")) || [])[1]);
  cargar({ ...MARCA, ...PRES(20000), ...METAS({ pescado: 2 }) }); await abrir(390); await armar();
  const detalle = (doc().querySelector("#planAviso details p") || { textContent: "" }).textContent;
  ok("R4-27-objetivos con 'pescado: 2' y $200.000, en 10 semanas distintas siempre hay 2 o más comidas con pescado (también armada de verdad); con $20.000 'Ver detalle' nombra el objetivo que no se cumplió",
    sem.every(x => x.llenos === 28 && x.sinObjetivo.length === 0) && pescadoReal >= 2 && /No llegué a tu objetivo de pescado \(\d de 2\) para no pasarme del presupuesto/.test(detalle), JSON.stringify({ sem, pescadoReal, detalle: detalle.slice(0, 200) }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
