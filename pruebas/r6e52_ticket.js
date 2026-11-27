// R6 · Etapa 52 (Foto del ticket, solo con clave de Gemini): ítems T-01 a T-06 de docs/ronda-6-lista.md.
// Sin internet: las respuestas de Gemini están simuladas (se reemplaza AsistenteIA.geminiPedir y geminiFetch) y la foto se arma en un canvas.
(async () => {
  const H = R6H(), { ok, espera } = H;
  const tocar = async (el, ms) => { if (!el) throw new Error("no hay elemento para tocar · tras " + H.T.length + " pruebas"); return H.tocar(el, ms) };
  const ev = x => H.ev(x), doc = () => H.doc();
  const $ = id => doc().getElementById(id);
  const qa = s => [...doc().querySelectorAll(s)];
  const norm = H.norm, J = H.J, visible = H.visible;
  const AI = "miPlatoFacil_aiSettings_v1", COMPRAS = "miPlatoFacil_purchases_v1", PRECIOS = "miPlatoFacil_referencePrices_v1", DESPENSA = "miPlatoFacil_pantryQuantities_v1";
  const CLAVE = { [AI]: JSON.stringify({ key: "AIzaSyTEST_clave_de_prueba_1234567890", model: "gemini-flash-latest" }) };
  const NORMAL = { comercio: "Super Don Pepe", fecha: "2026-11-20", moneda: "ARS", total: 9450.5, productos: [{ nombre: "TOMATE REDONDO", cantidad: 1.2, unidad: "kg", precio: 3600 }, { nombre: "LECHE ENTERA LS 1L", cantidad: 2, unidad: "unidad", precio: 2800 }, { nombre: "Arroz largo fino", cantidad: 1, unidad: "kg", precio: 3050.5 }] };
  const RARO = { comercio: "Almacén de barrio", fecha: "2026-11-21", moneda: "ARS", total: "$ 5.300,00", productos: [{ nombre: "GALLETITAS CRIOLLITAS", cantidad: 3, unidad: "unidad", precio: "2.100,00" }, { nombre: "DETERGENTE ALA 750", cantidad: null, unidad: null, precio: 3200 }] };
  const abrir = async (extra) => { await H.abrirEn("2026-11-27", { ...H.MARCA, ...(extra || {}) }) };
  const herr = async () => { ev('openTab("compras"); ComprasDespensa.abrirHerramientaCompras("realizadas")'); await espera(350) };
  // Simula a Gemini: respuesta(prompt, imagen, modelo) devuelve texto o lanza { status, message }.
  const simular = (fn) => { H.w().__llamadas = []; H.w().__sim = fn; ev(`(() => { const A = AsistenteIA; A.esperaReintento = 0; A.geminiPedir = async (key, model, prompt, json, imagen) => { __llamadas.push({ model, json, prompt, imagen: imagen ? { mimeType: imagen.mimeType, largo: imagen.data.length, inicio: imagen.data.slice(0, 4) } : null }); const r = await __sim(model, __llamadas.length); if (r instanceof Error) throw r; return r }; A.geminiFetch = async () => ({ models: [{ name: "models/gemini-2.5-flash-lite", supportedGenerationMethods: ["generateContent"] }, { name: "models/gemini-flash-latest", supportedGenerationMethods: ["generateContent"] }] }) })()`) };
  const error = (status, mensaje) => { const w = H.w(); const e = new w.Error(mensaje); e.status = status; return e };
  // Una foto de verdad: un canvas JPEG de ancho x alto.
  const foto = (ancho, alto, tipo = "image/jpeg") => H.w().eval(`(async () => { const c = document.createElement("canvas"); c.width = ${ancho}; c.height = ${alto}; const g = c.getContext("2d"); g.fillStyle = "#ddd"; g.fillRect(0, 0, ${ancho}, ${alto}); g.fillStyle = "#000"; g.font = "40px sans-serif"; g.fillText("TICKET 123", 50, 100); const b = await new Promise(r => c.toBlob(r, ${JSON.stringify(tipo)}, 0.92)); window.__foto = new File([b], "ticket.jpg", { type: ${JSON.stringify(tipo)} }); return true })()`);
  const procesar = async () => { await H.w().eval("Ticket.procesar(window.__foto)"); await espera(300) };
  const filas = () => qa("#ticketFilas .ticket-fila");
  const estado = () => norm($("ticketEstado").textContent);

  // ---- T-01: solo con clave ----
  await abrir({});
  await herr();
  ok("R6-T-01 sin clave de Gemini no aparece 'Cargar ticket (foto)' (ni su selector de fotos)", !visible($("ticketCargar")) && $("ticketCargar").hidden && !visible($("ticketArchivo")));
  await abrir(CLAVE);
  await herr();
  const b = $("ticketCargar");
  ok("R6-T-01 con clave guardada, en Compras realizadas aparece 'Cargar ticket (foto)' (44 px o más) y el selector acepta imágenes", visible(b) && /Cargar ticket \(foto\)/.test(norm(b.innerText)) && b.getBoundingClientRect().height >= 43.5 && $("ticketArchivo").accept === "image/*" && $("ticketArchivo").type === "file");
  ev('localStorage.removeItem("miPlatoFacil_aiSettings_v1"); AsistenteIA.renderAllAiRunners()'); await espera(150);
  ok("R6-T-01 al borrar la clave vuelve a esconderse", !visible($("ticketCargar")));

  // ---- T-02: se achica y va a Gemini con el manejo de errores de siempre ----
  await abrir(CLAVE);
  await herr();
  await foto(3200, 2400);
  const img = JSON.parse(await H.w().eval("(async () => JSON.stringify(await Ticket.achicar(window.__foto)))()"));
  ok("R6-T-02 una foto de 3200 × 2400 se achica a 1600 × 1200 (lado mayor 1600) en JPEG", img.ancho === 1600 && img.alto === 1200 && img.mimeType === "image/jpeg" && img.data.startsWith("/9j/"), JSON.stringify({ a: img.ancho, h: img.alto, t: img.mimeType }));
  await foto(900, 1400);
  const img2 = JSON.parse(await H.w().eval("(async () => JSON.stringify(await Ticket.achicar(window.__foto)))()"));
  ok("R6-T-02 una vertical de 900 × 1400 queda en 900 × 1400 (no se agranda) y una de 800 × 3000 baja a 427 × 1600", img2.ancho === 900 && img2.alto === 1400 && JSON.parse(await (async () => { await foto(800, 3000); return H.w().eval("(async () => { const r = await Ticket.achicar(window.__foto); return JSON.stringify([r.ancho, r.alto]) })()") })()).join() === "427,1600");
  await foto(3000, 2000);
  simular(() => JSON.stringify(NORMAL));
  await procesar();
  const l1 = H.w().__llamadas;
  ok("R6-T-02 a Gemini va el pedido con la foto en JPEG (base64 de una foto achicada) y se pide JSON", l1.length === 1 && l1[0].imagen && l1[0].imagen.mimeType === "image/jpeg" && l1[0].imagen.inicio === "/9j/" && l1[0].json === true && /JSON/.test(l1[0].prompt) && l1[0].imagen.largo < 700000, JSON.stringify(l1.map(x => ({ ...x, prompt: x.prompt.length }))));
  await H.cerrarHoja();
  // Sobrecarga: reintento, otro modelo y la foto en todos los pedidos
  await foto(1200, 900);
  simular((modelo, n) => modelo === "gemini-flash-latest" ? error(503, "Gemini no está respondiendo ahora (error 503). Probá más tarde.") : JSON.stringify(NORMAL));
  await procesar();
  const l2 = H.w().__llamadas;
  ok("R6-T-02 con el modelo sobrecargado (503) hace lo de siempre: reintenta, prueba otro modelo Flash de la cuenta (con la misma foto) y lo deja guardado", l2.length >= 3 && l2.every(x => x.imagen && x.imagen.inicio === "/9j/") && l2.at(-1).model === "gemini-2.5-flash-lite" && J(AI).model === "gemini-2.5-flash-lite" && filas().length === 3, JSON.stringify(l2.map(x => x.model)));
  await H.cerrarHoja();

  // ---- T-03: se muestra para revisar ----
  await abrir(CLAVE); await herr();
  await foto(1000, 1000);
  simular(() => JSON.stringify(NORMAL));
  await procesar();
  const f = filas();
  const campos = f.map(x => ({ nombre: x.querySelector("[data-ticket-nombre]").value, cant: x.querySelector("[data-ticket-cantidad]").value, uni: x.querySelector("[data-ticket-unidad]").value, precio: x.querySelector("[data-ticket-precio]").value, rel: x.querySelector("[data-ticket-relacion]").value }));
  ok("R6-T-03 la hoja 'Revisá el ticket' muestra producto, cantidad, unidad, precio y con qué ingrediente de la app se relaciona", /Revisá el ticket/.test(norm($("hojaTitulo").textContent)) && f.length === 3 && campos[0].nombre === "TOMATE REDONDO" && campos[0].cant === "1,2" && campos[0].uni === "kg" && campos[0].precio === "3600" && campos[2].cant === "1" && campos[2].precio === "3050,5", JSON.stringify(campos));
  ok("R6-T-03 relaciona sola lo que reconoce (tomate redondo → Tomate, arroz largo fino → Arroz) y deja 'No relacionar' lo demás (leche entera)", campos[0].rel === "Tomate" && campos[2].rel === "Arroz" && campos[1].rel === "", JSON.stringify(campos.map(x => x.rel)));
  const opciones = [...f[1].querySelector("[data-ticket-relacion]").options].map(o => o.text);
  ok("R6-T-03 cada relación se puede cambiar (lista de ingredientes de la app) o dejar en 'No relacionar'", opciones[0] === "No relacionar" && opciones.length > 30 && opciones.includes("Tomate"), String(opciones.length));
  ok("R6-T-03 muestra el total del ticket y la suma de las filas, y dice si coinciden", /Total del ticket: 9\.450,50 ARS · Suma de las filas: 9\.450,50 ARS \(3 con precio\) · coincide\./.test(norm($("ticketSuma").textContent)), norm($("ticketSuma").textContent));
  f[0].querySelector("[data-ticket-precio]").value = "3000"; f[0].querySelector("[data-ticket-precio]").dispatchEvent(new Event("input", { bubbles: true }));
  ok("R6-T-03 al corregir un precio la suma se actualiza y dice cuánto falta", /Suma de las filas: 8\.850,50 ARS.*faltan 600,00 ARS\./.test(norm($("ticketSuma").textContent)), norm($("ticketSuma").textContent));
  f[0].querySelector("[data-ticket-precio]").value = "3600"; f[0].querySelector("[data-ticket-precio]").dispatchEvent(new Event("input", { bubbles: true }));
  ok("R6-T-03 la hoja no tiene nada guardado todavía", localStorage.getItem(COMPRAS) === null && localStorage.getItem(PRECIOS) === null && localStorage.getItem(DESPENSA) === null);

  // ---- T-04: Guardar, con un tilde por parte ----
  await tocar(qa(".hoja__acciones button").find(x => /^Guardar$/.test(norm(x.innerText))), 500);
  const compras = J(COMPRAS), precios = Object.values(J(PRECIOS) || {}), stock = Object.values(J(DESPENSA) || {});
  ok("R6-T-04 'Guardar' crea una Compra realizada con esos productos y el total (fecha 20/11, comercio, 3 productos, 9450,5 ARS)", compras && compras.length === 1 && compras[0].date === "2026-11-20" && compras[0].store === "Super Don Pepe" && compras[0].total === 9450.5 && compras[0].currency === "ARS" && compras[0].items.length === 3 && compras[0].items[0].name === "TOMATE REDONDO" && compras[0].items[0].quantity === 1.2 && compras[0].items[0].unit === "kg" && compras[0].items[0].price === 3600, JSON.stringify(compras));
  ok("R6-T-04 actualiza Mi precio de los relacionados (Tomate y Arroz, con la presentación y la fecha) y no el de lo que no se relacionó", precios.length === 2 && precios.some(p => p.name === "Tomate" && p.price === 3600 && p.amount === 1.2 && p.unit === "kg" && p.date === "2026-11-20" && /Super Don Pepe/.test(p.pack)) && precios.some(p => p.name === "Arroz" && p.price === 3050.5) && !precios.some(p => /leche/i.test(p.name)), JSON.stringify(precios));
  ok("R6-T-04 suma a la Despensa lo relacionado (1,2 kg de Tomate y 1 kg de Arroz) y nada de lo demás", stock.length === 2 && stock.some(s => s.name === "Tomate" && s.quantity === 1.2 && s.unit === "kg") && stock.some(s => s.name === "Arroz" && s.quantity === 1 && s.unit === "kg"), JSON.stringify(stock));
  ok("R6-T-04 la hoja se cierra y el estado dice qué se hizo", !visible($("hojaTitulo")) || !doc().querySelector(".hoja-fondo:not([hidden])"), norm($("purchaseStatus").textContent));
  ok("R6-T-04 el estado dice 'Compra registrada · 2 precios actualizados · 2 productos sumados a la Despensa.'", /Compra registrada · 2 precios actualizados · 2 productos sumados a la Despensa\./.test(norm($("purchaseStatus").textContent)), norm($("purchaseStatus").textContent));
  // Tildes
  const conTildes = async (compra, precios, despensa) => {
    await abrir(CLAVE); await herr(); await foto(1000, 1000); simular(() => JSON.stringify(NORMAL)); await procesar();
    $("ticketGuardarCompra").checked = compra; $("ticketActualizarPrecios").checked = precios; $("ticketSumarDespensa").checked = despensa;
    await tocar(qa(".hoja__acciones button").find(x => /^Guardar$/.test(norm(x.innerText))), 500);
    return { c: J(COMPRAS), p: J(PRECIOS), s: J(DESPENSA), est: norm($("purchaseStatus").textContent), hoja: !!doc().querySelector(".hoja-fondo:not([hidden])") };
  };
  const soloCompra = await conTildes(true, false, false);
  ok("R6-T-04 con solo el tilde de la compra, solo se crea la compra (ni Mis precios ni la Despensa)", soloCompra.c && soloCompra.c.length === 1 && soloCompra.p === null && soloCompra.s === null, JSON.stringify(soloCompra).slice(0, 200));
  const sinCompra = await conTildes(false, true, true);
  ok("R6-T-04 sin el tilde de la compra, igual se actualizan Mis precios y la Despensa y no queda compra registrada", sinCompra.c === null && Object.keys(sinCompra.p || {}).length === 2 && Object.keys(sinCompra.s || {}).length === 2 && !/Compra registrada/.test(sinCompra.est), JSON.stringify(sinCompra).slice(0, 200));
  const soloDespensa = await conTildes(false, false, true);
  ok("R6-T-04 con solo el tilde de la Despensa, solo se suma a la Despensa", soloDespensa.c === null && soloDespensa.p === null && Object.keys(soloDespensa.s || {}).length === 2);
  const ninguno = await conTildes(false, false, false);
  ok("R6-T-04 sin ningún tilde no guarda nada y la hoja avisa que tildes una parte (queda abierta)", ninguno.c === null && ninguno.p === null && ninguno.s === null && ninguno.hoja && /Tildá al menos una parte/.test(norm(doc().querySelector(".hoja__estado, .hoja .screen__hint:last-child") ? doc().querySelector(".hoja").innerText : "")));
  await H.cerrarHoja();
  // Sin la tilde de la compra, el total del ticket no hace falta
  await abrir(CLAVE); await herr(); await foto(1000, 1000); simular(() => JSON.stringify({ ...NORMAL, total: null })); await procesar();
  $("ticketGuardarCompra").checked = false;
  await tocar(qa(".hoja__acciones button").find(x => /^Guardar$/.test(norm(x.innerText))), 500);
  ok("R6-T-04 si el ticket no trae total y no se tilda la compra, igual se guardan los precios y la Despensa (el total solo se pide para la compra)", localStorage.getItem(COMPRAS) === null && Object.keys(J(PRECIOS) || {}).length === 2 && Object.keys(J(DESPENSA) || {}).length === 2, norm($("purchaseStatus").textContent));
  await abrir(CLAVE); await herr(); await foto(1000, 1000); simular(() => JSON.stringify({ ...NORMAL, total: null })); await procesar();
  await tocar(qa(".hoja__acciones button").find(x => /^Guardar$/.test(norm(x.innerText))), 400);
  ok("R6-T-05 con la compra tildada y sin total, la hoja lo pide y no guarda nada", /Total del ticket/.test(norm(doc().querySelector(".hoja").innerText)) && localStorage.getItem(COMPRAS) === null && localStorage.getItem(PRECIOS) === null);
  await H.cerrarHoja();
  await abrir(CLAVE); await herr(); await foto(1000, 1000); simular(() => JSON.stringify({ ...NORMAL, productos: [{ nombre: "DESCUENTO", cantidad: null, unidad: null, precio: "-500,00" }, { nombre: "Pan", cantidad: 1, unidad: "unidad", precio: 900 }] })); await procesar();
  const precios2 = filas().map(x => x.querySelector("[data-ticket-precio]").value);
  ok("R6-T-06 un descuento con signo menos en texto ('-500,00') no se lee como un precio positivo", precios2[0] === "" && precios2[1] === "900", JSON.stringify(precios2));
  $("ticketGuardarCompra").checked = false; $("ticketActualizarPrecios").checked = false; $("ticketSumarDespensa").checked = true;
  filas()[1].querySelector("[data-ticket-relacion]").value = "";
  await tocar(qa(".hoja__acciones button").find(x => /^Guardar$/.test(norm(x.innerText))), 500);
  ok("R6-T-05 si no hay nada relacionado para guardar, lo dice (no un 'Listo' vacío)", /No había nada relacionado/.test(norm($("purchaseStatus").textContent)) && localStorage.getItem(DESPENSA) === null, norm($("purchaseStatus").textContent));
  // Usa los formatos que existen: el respaldo completo la acepta
  await abrir(CLAVE); await herr(); await foto(1000, 1000); simular(() => JSON.stringify(NORMAL)); await procesar();
  await tocar(qa(".hoja__acciones button").find(x => /^Guardar$/.test(norm(x.innerText))), 500);
  const w = H.w(), snap = w.eval("completeBackupSnapshot(localStorage)");
  let valido = false; try { w.Respaldo.restoreCompleteBackup(JSON.parse(JSON.stringify(snap)), w.localStorage); valido = true } catch (e) { }
  ok("R6-T-04 todo queda en los formatos de siempre: el respaldo completo (con la compra, los precios y la Despensa del ticket) se restaura sin errores", valido && !!snap.data[COMPRAS] && !!snap.data[PRECIOS] && !!snap.data[DESPENSA]);

  // ---- T-06: ticket con productos que la app no conoce ----
  await abrir(CLAVE); await herr(); await foto(1000, 1000); simular(() => JSON.stringify(RARO)); await procesar();
  const raros = filas().map(x => ({ n: x.querySelector("[data-ticket-nombre]").value, rel: x.querySelector("[data-ticket-relacion]").value, q: x.querySelector("[data-ticket-cantidad]").value, p: x.querySelector("[data-ticket-precio]").value }));
  ok("R6-T-06 un ticket con productos que la app no conoce los muestra todos en 'No relacionar', con el total y los precios en texto ('$ 5.300,00' y '2.100,00') leídos bien", raros.length === 2 && raros.every(x => x.rel === "") && raros[0].p === "2100" && /Total del ticket: 5\.300,00 ARS · Suma de las filas: 5\.300,00 ARS/.test(norm($("ticketSuma").textContent)), JSON.stringify(raros));
  await tocar(qa(".hoja__acciones button").find(x => /^Guardar$/.test(norm(x.innerText))), 500);
  ok("R6-T-06 al guardarlo se crea la compra (2 productos, sin cantidad para el detergente) y no se toca Mis precios ni la Despensa (nada relacionado)", J(COMPRAS).length === 1 && J(COMPRAS)[0].items.length === 2 && J(COMPRAS)[0].items[1].quantity === null && J(PRECIOS) === null && J(DESPENSA) === null, JSON.stringify(J(COMPRAS)));

  // ---- T-05 y T-06: errores claros; nada se guarda sin confirmar ----
  const intento = async (respuesta, archivo) => {
    await abrir(CLAVE); await herr();
    if (archivo === "texto") await H.w().eval('window.__foto = new File(["hola"], "nota.txt", { type: "text/plain" })'); else await foto(1000, 1000);
    simular(respuesta); await procesar();
    return { est: estado(), hoja: !!doc().querySelector(".hoja-fondo:not([hidden])"), c: localStorage.getItem(COMPRAS), p: localStorage.getItem(PRECIOS), s: localStorage.getItem(DESPENSA), llamadas: H.w().__llamadas.length };
  };
  const malo = await intento(() => "Lo siento, no puedo ayudarte con eso {");
  ok("R6-T-06 una respuesta mal formada dice 'No pude leer el ticket…' y no abre nada ni guarda nada", /No pude leer el ticket: Gemini no devolvió los datos en el formato pedido/.test(malo.est) && !malo.hoja && malo.c === null && malo.p === null && malo.s === null, JSON.stringify(malo));
  const sinProductos = await intento(() => JSON.stringify({ comercio: "x", productos: [] }));
  ok("R6-T-05 si no vinieron productos dice 'No encontré productos en la foto…' y no guarda nada", /No encontré productos en la foto/.test(sinProductos.est) && !sinProductos.hoja && sinProductos.c === null, JSON.stringify(sinProductos));
  const sinRed = await intento(() => error(0, "No se pudo conectar con Gemini. Revisá tu conexión."));
  ok("R6-T-05 sin conexión dice 'No se pudo conectar con Gemini. Revisá tu conexión.' (el mismo mensaje del asistente) y no guarda nada", /No se pudo conectar con Gemini\. Revisá tu conexión\./.test(sinRed.est) && !sinRed.hoja && sinRed.c === null && sinRed.p === null && sinRed.s === null, JSON.stringify(sinRed));
  const clave = await intento(() => error(403, "La clave no tiene permiso para usar Gemini (revisala en Google AI Studio)."));
  ok("R6-T-05 con la clave sin permiso (403) dice el mensaje de siempre del asistente y no prueba otros modelos", /La clave no tiene permiso/.test(clave.est) && clave.llamadas === 1, JSON.stringify(clave));
  const noFoto = await intento(() => JSON.stringify(NORMAL), "texto");
  ok("R6-T-05 un archivo que no es una foto dice 'Eso no parece una foto…' y no llama a Gemini", /Eso no parece una foto/.test(noFoto.est) && noFoto.llamadas === 0 && !noFoto.hoja, JSON.stringify(noFoto));
  // Revisión con errores: faltan datos → mensaje en la hoja, nada se guarda
  await abrir(CLAVE); await herr(); await foto(1000, 1000); simular(() => JSON.stringify(NORMAL)); await procesar();
  $("ticketFecha").value = "31/12/2030";
  await tocar(qa(".hoja__acciones button").find(x => /^Guardar$/.test(norm(x.innerText))), 400);
  ok("R6-T-05 si algo de la revisión no sirve (fecha futura) lo dice en la hoja y no guarda nada", /La fecha no puede ser futura/.test(norm(doc().querySelector(".hoja").innerText)) && localStorage.getItem(COMPRAS) === null && localStorage.getItem(PRECIOS) === null);
  await H.cerrarHoja();
  ok("R6-T-05 cerrar la hoja sin tocar Guardar no guarda nada", localStorage.getItem(COMPRAS) === null && localStorage.getItem(PRECIOS) === null && localStorage.getItem(DESPENSA) === null);
  // Sin clave: procesar no hace nada
  await abrir({}); await herr(); await foto(1000, 1000); simular(() => JSON.stringify(NORMAL)); await procesar();
  ok("R6-T-01 sin clave, aunque llegue una foto, no se llama a Gemini y dice dónde cargar la clave", H.w().__llamadas.length === 0 && /Configurá tu clave de Gemini/.test(estado()));
  return H.terminar();
})()
