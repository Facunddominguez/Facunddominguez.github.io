// R4-30: Etapa 30 de la Ronda 4 ("Precios al día y de tu barrio"). Controles R4-30-verduleria, R4-30-defecto, R4-30-ficha, R4-30-revisar,
// R4-30-sigue-igual y R4-30-respaldo de docs/validacion/criterios.json. Datos inventados y precios congelados.
(async () => {
  const T = []; const ok = (n, c, d) => T.push((c ? "PASA " : "FALLA ") + n + (d !== undefined && d !== "" ? " · " + d : ""));
  const espera = ms => new Promise(r => setTimeout(r, ms));
  let marco = null, w = null;
  const abrir = async extra => {
    localStorage.clear(); localStorage.setItem("miPlatoFacil_bienvenida_v1", '{"vista":true}');
    for (const [k, v] of Object.entries(extra || {})) localStorage.setItem(k, v);
    if (marco) marco.remove();
    marco = document.createElement("iframe"); marco.id = "marcoPrueba";
    marco.style.cssText = "position:fixed;left:0;top:0;width:390px;height:844px;border:0;opacity:0;pointer-events:none;z-index:-1";
    document.body.append(marco);
    await new Promise((res, rej) => { marco.onload = res; marco.onerror = rej; marco.src = "/index.html?marco=" + Date.now() });
    await espera(500);
    w = marco.contentWindow; w.confirm = () => true; w.prompt = () => "";
  };
  const ev = x => w.eval(x), doc = () => w.document;
  const DONDE = v => ({ miPlatoFacil_dondeCompro_v1: JSON.stringify({ version: 1, verduras: v }) });
  const tocar = async el => { el.click(); await espera(250) };
  const dia = n => ev(`(() => { const d = new Date(); d.setDate(d.getDate() - ${n}); return Rutina.localTrainingDate(d) })()`);
  const mio = (id, nombre, precio, fecha) => ({ [id]: { id, name: nombre, pack: "", amount: 1, unit: "kg", price: precio, currency: "ARS", date: fecha } });
  const pesos = n => Math.round(n);

  // R4-30-verduleria y R4-30-defecto
  const lee = async extra => { await abrir(extra); return JSON.parse(ev(`JSON.stringify(Object.fromEntries(["Papa", "Tomate", "Naranja", "Arroz", "Leche", "Pollo"].map(n => [n, (() => { const p = precioAuto(n); return p && { precio: Math.round(p.precio), fuente: p.fuente } })()])))`)) };
  const vd = await lee(DONDE("verduleria")), sp = await lee(DONDE("super")), sin = await lee({});
  await abrir({ ...DONDE("verduleria") });
  const hoy = ev("Rutina.localTrainingDate(new Date())");
  await abrir({ ...DONDE("verduleria"), miPlatoFacil_referencePrices_v1: JSON.stringify(mio("ficha_papa", "Papa", 1500, hoy)) });
  const propio = ev(`(() => { const r = precioDe("Papa", 1000, "g"); return r && { costo: Math.round(r.costo), propio: !!r.propio } })()`);
  ok("R4-30-verduleria con 'Verdulería' la papa cuesta $2.201/kg en GBA (INDEC); con 'Supermercado', $3.999/kg (SEPA); con un Mi precio, ese",
    vd.Papa.precio === 2201 && vd.Papa.fuente === "indec" && sp.Papa.precio === 3999 && sp.Papa.fuente === "sepa" && propio && propio.costo === 1500 && propio.propio, JSON.stringify({ vd: vd.Papa, sp: sp.Papa, propio }));
  ok("R4-30-defecto sin la clave se usa 'Verdulería'; arroz, leche y pollo cuestan lo mismo con las dos opciones",
    sin.Papa.precio === vd.Papa.precio && ["Arroz", "Leche", "Pollo"].every(n => vd[n] && sp[n] && vd[n].precio === sp[n].precio && vd[n].fuente === sp[n].fuente) && vd.Tomate.precio !== sp.Tomate.precio, JSON.stringify({ arroz: [vd.Arroz, sp.Arroz], tomate: [vd.Tomate, sp.Tomate] }));

  // R4-30-ficha: la ficha de la papa muestra los dos precios con su fuente y su mes; la elección se hace en Preferencias.
  await abrir({});
  ev("Comidas.abrirNutrientesDeIngrediente('Papa', true)"); await espera(350);
  const lineas = [...doc().querySelectorAll(".hoja .ficha-precio__linea")].map(e => e.textContent);
  ev("hoja.cerrar()"); await espera(100);
  ev('openTab("mas"); go("preferencias")'); await espera(250);
  const sel = doc().getElementById("dondeCompro"), antes = sel && sel.value;
  if (sel) { sel.value = "super"; sel.dispatchEvent(new w.Event("change", { bubbles: true })) } await espera(150);
  const guardado = localStorage.getItem("miPlatoFacil_dondeCompro_v1");
  ok("R4-30-ficha la ficha de la papa muestra 'En verdulería ≈ $2.201/kg · INDEC GBA · mes' y 'En súper ≈ $3.999/kg · SEPA GBA · fecha'; Preferencias tiene 'Compro frutas y verduras en' con verdulería por defecto",
    lineas.length === 2 && /^En verdulería ≈ \$2\.201\/kg · INDEC GBA · \S+\.? 20\d\d$/.test(lineas[0]) && /^En súper ≈ \$3\.999\/kg · SEPA GBA · 4 nov\. 2026$/.test(lineas[1]) && antes === "verduleria" && guardado === JSON.stringify({ version: 1, verduras: "super" }),
    JSON.stringify({ lineas, antes, guardado }));

  // R4-30-revisar: un Mi precio de hace 61 días; uno de 59 con el automático 10 % arriba (no); uno de 31 con el automático 25 % arriba (sí).
  await abrir({ ...DONDE("verduleria") });
  const auto = ev("precioAuto('Tomate').precio"), p61 = dia(61), p59 = dia(59), p31 = dia(31);
  const casos = async (nom, precio, fecha, id = "ficha_tomate") => { await abrir({ ...DONDE("verduleria"), miPlatoFacil_referencePrices_v1: JSON.stringify(mio(id, "Tomate", precio, fecha)) }); return ev("preciosParaRevisar().length") };
  const c61 = await casos("viejo", auto, p61), c59 = await casos("59 días, auto 10 %", auto / 1.1, p59), c31 = await casos("31 días, auto 25 %", auto / 1.25, p31), c31b = await casos("31 días, auto 10 %", auto / 1.1, p31), c10 = await casos("10 días, auto 25 %", auto / 1.25, dia(10));
  // En Semana, con la semana armada, el enlace dice "Revisar 1 precio tuyo".
  await abrir({ ...DONDE("verduleria"), miPlatoFacil_referencePrices_v1: JSON.stringify(mio("ficha_tomate", "Tomate", pesos(auto), p61)) });
  ev('openTab("semana")'); await espera(200); ev('ArmameSemana.correr("todo")'); await espera(500);
  const enlace = doc().querySelector("#planPreciosEstado [data-revisar-precios]");
  ok("R4-30-revisar con un Mi precio de hace 61 días aparece 'Revisar 1 precio tuyo'; con uno de 59 días y el automático 10 % arriba, no; con uno de 31 días y el automático 25 % arriba, sí",
    c61 === 1 && c59 === 0 && c31 === 1 && c31b === 0 && c10 === 0 && !!enlace && enlace.textContent === "Revisar 1 precio tuyo", JSON.stringify({ c61, c59, c31, c31b, c10, enlace: enlace && enlace.textContent }));

  // R4-30-sigue-igual
  const rpAntes = localStorage.getItem("miPlatoFacil_referencePrices_v1");
  await tocar(enlace);
  const filas = [...doc().querySelectorAll(".hoja .revisar-precio__texto")].map(e => e.textContent), igual = doc().querySelector(".hoja [data-precio-igual]");
  await tocar(igual);
  const rev = localStorage.getItem("miPlatoFacil_preciosRevisados_v1"), despues = ev("preciosParaRevisar().length");
  ok("R4-30-sigue-igual la hoja muestra 'Tomate · tu precio … · en la zona ≈ …'; 'Sigue igual' lo saca de la lista, no cambia referencePrices_v1 byte a byte y escribe en preciosRevisados_v1",
    filas.length === 1 && /^Tomate · tu precio \$[\d.]+\/kg \(\d+ \S+\) · en la zona ≈ \$[\d.]+\/kg$/.test(filas[0]) && despues === 0 && localStorage.getItem("miPlatoFacil_referencePrices_v1") === rpAntes && rev === JSON.stringify({ version: 1, revisados: { ficha_tomate: hoy } }),
    JSON.stringify({ filas, despues, rev }));

  // R4-30-respaldo: las dos claves van y vuelven en el respaldo (como opcionales) y el respaldo de ejemplo, que no las trae, se restaura igual.
  await abrir({ ...DONDE("super"), miPlatoFacil_preciosRevisados_v1: JSON.stringify({ version: 1, revisados: { ficha_tomate: hoy } }) });
  const res = JSON.parse(ev(`JSON.stringify((() => { const snap = completeBackupSnapshot(localStorage), copia = JSON.parse(JSON.stringify(snap)); Respaldo.validateCompleteBackup(copia);
    const malo = JSON.parse(JSON.stringify(snap)); malo.data.miPlatoFacil_dondeCompro_v1 = JSON.stringify({ version: 1, verduras: "otra" }); let msg = null; try { Respaldo.validateCompleteBackup(malo) } catch (e) { msg = e.message }
    localStorage.clear(); Respaldo.restoreCompleteBackup(copia, localStorage);
    return { enSnap: [snap.data.miPlatoFacil_dondeCompro_v1, snap.data.miPlatoFacil_preciosRevisados_v1], vuelta: [localStorage.getItem("miPlatoFacil_dondeCompro_v1"), localStorage.getItem("miPlatoFacil_preciosRevisados_v1")], malo: msg, opcionales: ["miPlatoFacil_dondeCompro_v1", "miPlatoFacil_preciosRevisados_v1"].every(k => COMPLETE_BACKUP_OPTIONAL_KEYS.includes(k) && COMPLETE_BACKUP_KEYS.includes(k)) } })())`));
  const viejo = await (await fetch("/tests/fixtures/respaldo-v14.9.94.json", { cache: "no-store" })).json();
  await abrir({});
  const restaurado = ev(`(() => { try { Respaldo.restoreCompleteBackup(${JSON.stringify(viejo)}, localStorage); return true } catch (e) { return e.message } })()`);
  ok("R4-30-respaldo las dos claves van y vuelven en el respaldo como opcionales, un valor inválido se rechaza y el respaldo de ejemplo, que no las trae, se restaura igual",
    res.enSnap[0] === JSON.stringify({ version: 1, verduras: "super" }) && res.vuelta[0] === res.enSnap[0] && res.vuelta[1] === res.enSnap[1] && !!res.malo && res.opcionales && restaurado === true, JSON.stringify({ res, restaurado }));

  if (marco) marco.remove();
  localStorage.clear();
  return T;
})()
