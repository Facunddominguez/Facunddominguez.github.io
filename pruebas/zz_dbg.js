(async () => {
  const H = R6H(); const T = [];
  const REC = [{ id: "recipe_cocina6a", titulo: "Guiso de lentejas", filas: [{ name: "Lentejas", quantity: 200, unit: "g" }], pasos: ["Remojá 10 minutos.", "Hervilas 1 hora."] }];
  await H.abrirEn("2026-11-26", { ...H.MARCA, ...H.recetas(REC), miPlatoFacil_plan: JSON.stringify(H.planDe([["jueves", "cena", "rp_recipe_cocina6a"]])) });
  H.ev('Comidas.abrirComida("plato","rp_recipe_cocina6a")'); await H.espera(400);
  const d = H.doc();
  T.push("PASA estado · " + H.norm(d.getElementById("comida").innerText).slice(0, 700) + " || principal: " + d.getElementById("comidaPrincipal").innerHTML.slice(0, 600));
  const errs = []; H.w().addEventListener("error", e => errs.push(e.message));
  try { d.querySelector("[data-comida-cocinar]").click() } catch (e) { errs.push("click: " + e.message) }
  await H.espera(400);
  T.push("PASA cocina · " + !!d.getElementById("modoCocina") + " " + (d.getElementById("modoCocina") ? H.norm(d.getElementById("modoCocina").innerText).slice(0, 400) : "") + " errs " + JSON.stringify(errs) + " ModoCocina " + typeof H.w().ModoCocina);
  return H.terminar().concat(T);
})()
