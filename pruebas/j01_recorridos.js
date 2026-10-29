// J01: recorridos que hoy funcionan y no se pueden romper (desde la Etapa 0 del rediseño).
// Cada recorrido se maneja con la interfaz (objeto "manejo", que las etapas siguientes adaptan cuando cambia la
// pantalla) y se verifica con lo guardado, nunca con textos ni ids. No se da por bueno nada que el plan va a cambiar
// (por ejemplo, que lo comprado siga pendiente o que se pregunte "¿Entrenás hoy?"), solo lo de "Conservar".
// La app se abre en un marco aparte (mismo origen y mismo localStorage) porque restaurar recarga la página.
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
  const recarga = () => new Promise(res => { marco.onload = async () => { await espera(500); w = marco.contentWindow; w.confirm = () => true; w.prompt = () => ""; res() } });
  const doc = () => w.document;
  const $ = id => { const e = doc().getElementById(id); if (!e) throw Error("no está en la pantalla: #" + id); return e };
  const q = s => { const e = doc().querySelector(s); if (!e) throw Error("no está en la pantalla: " + s + " (pantalla: " + w.eval("stack.at(-1)") + ")"); return e };
  const tocar = async el => { if (!el) throw Error("no se encontró el control"); el.click(); await espera(120) };
  const irA = async pestana => { await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')); if (w.eval("stack.at(-1) !== activeTabRoot()")) await tocar(q('#sectionNav [data-section-tab="' + pestana + '"]')) };
  const plan = () => JSON.parse(localStorage.getItem("miPlatoFacil_plan") || "{}");
  const guardados = () => JSON.parse(localStorage.getItem("miPlatoFacil_saved") || "[]");
  const hoy = () => w.eval("DAYS[(new Date().getDay()+6)%7][0]");
  // Manejo de la interfaz de esta etapa. Si una etapa cambia la pantalla, se cambia acá, no lo que se verifica abajo.
  const manejo = {
    async armarAlmuerzo(verdura, almidon, proteina) {
      await irA("hoy");
      await tocar(q('#home [data-start="plato"]'));
      if (w.eval("stack.at(-1)") === "day") await tocar(q('#day [data-day="Día libre"]'));
      if (w.eval("stack.at(-1)") === "plate_static") await tocar(q('#plate_static [data-go="lunch_veg"]'));
      await tocar(q('#boxv [data-name="' + verdura + '"]')); await tocar($("nextBottom"));
      await tocar(q('#boxa [data-name="' + almidon + '"]')); await tocar($("nextBottom"));
      await tocar(q('#boxp [data-name="' + proteina + '"]')); await tocar($("nextBottom"));
    },
    async guardar() { await tocar(q("#resumen [data-save-plate]")) },
    async asignar(id, dia, comida) {
      await irA("semana");
      const sel = q('[data-plan-select="' + dia + '|' + comida + '"]'); sel.value = id; sel.dispatchEvent(new w.Event("change", { bubbles: true }));
      await tocar(q('[data-plan-set="' + dia + '|' + comida + '"]'));
    },
    async verLista() {
      await irA("compras");
      return [...doc().querySelectorAll("#comprasList [data-shop-key]")].map(cb => cb.dataset.shopKey);
    },
    async tacharYLoCompre(clave) { await tocar(q('#comprasList [data-shop-key="' + clave + '"]')); await tocar($("comprasBought")) },
    async loComi(comida) { await irA("hoy"); await tocar(q('#todayRows [data-today-slot="' + comida + '"] button')) },
    async deshacerLoComi() { const b = $("todayStatus").querySelector("[data-today-undo]"); if (!b) throw Error("no apareció Deshacer: «" + $("todayStatus").textContent + "»"); await tocar(b) },
    async respaldar() {
      const blobs = [], crear = w.URL.createObjectURL, clic = w.HTMLAnchorElement.prototype.click;
      w.URL.createObjectURL = b => { blobs.push(b); return crear.call(w.URL, b) };
      w.HTMLAnchorElement.prototype.click = function () { };
      try { await irA("mas"); w.go("backupScreen"); await tocar($("backupExport")) } finally { w.URL.createObjectURL = crear; w.HTMLAnchorElement.prototype.click = clic }
      return blobs.length ? JSON.parse(await blobs.at(-1).text()) : null;
    },
    async restaurar(respaldo) {
      await irA("mas"); w.go("backupScreen");
      const dt = new w.DataTransfer(); dt.items.add(new w.File([JSON.stringify(respaldo)], "respaldo.json", { type: "application/json" }));
      const input = $("backupFile"); input.files = dt.files; input.dispatchEvent(new w.Event("change", { bubbles: true }));
      for (let i = 0; i < 40 && $("backupRestore").disabled; i++) await espera(50);
      const recargada = recarga();
      await tocar($("backupRestore"));
      await recargada;
    }
  };
  localStorage.clear();
  await abrir();
  // J1 Armar y guardar un plato
  await manejo.armarAlmuerzo("Tomate", "Papa", "Merluza");
  await manejo.guardar();
  const plato = guardados().find(p => p.type === "plato");
  const contiene = n => !!plato && JSON.stringify(plato).includes(n);
  ok("J1 armar y guardar un plato lo deja guardado con lo elegido", guardados().length === 1 && contiene("Tomate") && contiene("Papa") && contiene("Merluza"));
  // J2 Asignarlo a un día
  await manejo.asignar(plato.id, "martes", "almuerzo");
  ok("J2 asignar el plato a un día queda en el plan", plan().martes && plan().martes.almuerzo === plato.id);
  // J3 Ver la lista: aparecen sus ingredientes
  const lista = await manejo.verLista(), clave = n => w.ingredientKey(n);
  ok("J3 la lista de compras trae los ingredientes del plan", ["Tomate", "Papa", "Merluza"].every(n => lista.includes(clave(n))), lista.join(", "));
  // J4 Tachar y Lo compré: lo comprado pasa a la despensa
  await manejo.tacharYLoCompre(clave("Tomate"));
  const despensa = JSON.parse(localStorage.getItem("miPlatoFacil_pantry") || "[]"), existencias = Object.values(JSON.parse(localStorage.getItem("miPlatoFacil_pantryQuantities_v1") || "{}"));
  const enDespensa = n => despensa.some(x => clave(x) === clave(n)) || existencias.some(s => clave(s.name) === clave(n));
  ok("J4 tachar y Lo compré pasa a la despensa solo lo tachado", enDespensa("Tomate") && !enDespensa("Papa") && !enDespensa("Merluza"), JSON.stringify(despensa));
  // J5 Lo comí con Deshacer (sin cambiar el plan)
  await manejo.asignar(plato.id, hoy(), "almuerzo");
  const planAntes = localStorage.getItem("miPlatoFacil_plan");
  await manejo.loComi("almuerzo");
  const registros = JSON.parse(localStorage.getItem("miPlatoFacil_consumption_v1") || "[]");
  const registrado = registros.length === 1 && registros[0].sourceId === plato.id && registros[0].meal === "almuerzo" && registros[0].planned === true;
  await manejo.deshacerLoComi();
  ok("J5 Lo comí registra la comida y Deshacer la quita, sin cambiar el plan", registrado && (localStorage.getItem("miPlatoFacil_consumption_v1") || "[]") === "[]" && localStorage.getItem("miPlatoFacil_plan") === planAntes);
  // J6 Respaldar y restaurar deja todo como estaba, y el respaldo lleva todo lo guardado (incluso claves armadas en el
  // momento, que la compuerta no ve en el código). Solo quedan afuera los ajustes de este dispositivo.
  const respaldo = await manejo.respaldar();
  const soloDelDispositivo = ["miPlatoFacil_aiSettings_v1", "miPlatoFacil_uiMode_v1"];
  const sinRespaldo = Object.keys(localStorage).filter(k => k.startsWith("miPlatoFacil_") && !soloDelDispositivo.includes(k) && !(respaldo && Object.prototype.hasOwnProperty.call(respaldo.data, k)));
  const antes = respaldo && JSON.stringify(Object.keys(respaldo.data).map(k => [k, respaldo.data[k]]));
  localStorage.setItem("miPlatoFacil_saved", "[]"); localStorage.setItem("miPlatoFacil_plan", "{}"); localStorage.removeItem("miPlatoFacil_pantry");
  if (respaldo) await manejo.restaurar(respaldo);
  const despues = respaldo && JSON.stringify(Object.keys(respaldo.data).map(k => [k, localStorage.getItem(k)]));
  ok("J6 respaldar y restaurar deja todo como estaba, y el respaldo lleva todo lo guardado", !!respaldo && !sinRespaldo.length && antes === despues && guardados().length === 1 && plan().martes.almuerzo === plato.id, sinRespaldo.length ? "fuera del respaldo: " + sinRespaldo.join(", ") : "");
  marco.remove();
  localStorage.clear();
  return T;
})()
