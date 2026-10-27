// PAN-01 battery, including equivalence of "Con lo que tengo" results against the v14.9.74 algorithm.
(async () => {
  const { wait, results, reset, criticalCase } = window.R2; const T = results();
  reset();
  // Reference: v14.9.74 pantryMatches algorithm, copied verbatim (aliases inline).
  const refAliases = { pollo: ["pollo"], carne: ["carne"], pescado: ["pescado", "atun", "merluza", "salmon", "sardina", "caballa"], huevo: ["huevo", "huevos"], queso: ["queso", "quesos"], yogur: ["yogur"], lentejas: ["lenteja", "lentejas"], garbanzos: ["garbanzo", "garbanzos"], porotos: ["poroto", "porotos"], arvejas: ["arveja", "arvejas"], arroz: ["arroz"], fideos: ["fideo", "fideos", "pasta", "pastas"], papa: ["papa", "papas"], batata: ["batata", "batatas"], pan: ["pan"], maiz: ["maiz"], quinoa: ["quinoa"], tomate: ["tomate", "tomates"], hojas: ["lechuga", "rucula", "espinaca", "hojas verdes"], zanahoria: ["zanahoria", "zanahorias"], calabaza: ["calabaza", "zapallo"], brocoli: ["brocoli"], palta: ["palta"], zapallito: ["zapallito", "zapallitos"] };
  const ref = selIds => { const sel = Array.from(new Set(selIds)).map(pantryById).filter(Boolean); if (!sel.length) return []; const words = v => " " + normalizeSearchText(v).replace(/[^a-z0-9]+/g, " ").trim() + " "; return data.menuCatalog.map(rec => { const text = words(rec.text); const matched = sel.filter(p => (refAliases[p[0]] || []).some(k => text.includes(words(k)))); return { rec, n: matched.length, matched: matched.map(p => p[1]) } }).filter(x => x.n > 0).sort((a, b) => b.n - a.n || a.rec.text.localeCompare(b.rec.text)) };
  const ser = r => JSON.stringify(r.map(x => [x.rec.text, x.n, x.matched]));
  const ids = PANTRY.map(p => p[0]); let diffs = 0, cases = 0;
  const subsets = ids.map(id => [id]); for (let i = 0; i < 300; i++) subsets.push(ids.filter(() => Math.random() < 0.3));
  for (const s of subsets) { pantrySel = s.slice(); cases++; if (ser(pantryMatches()) !== ser(ref(s))) diffs++ }
  T.ok("P1 'Con lo que tengo' da los mismos resultados que v14.9.74", diffs === 0 && JSON.stringify(PANTRY_ALIASES) === JSON.stringify(refAliases), cases + " combinaciones, " + diffs + " diferencias");
  pantrySel = []; localStorage.setItem("miPlatoFacil_pantry", JSON.stringify(["papa", "hojas", "pan"]));
  const m = pantryMarkedMatcher();
  T.ok("P2 reconoce Papa, Lechuga y Hojas verdes", m.has("Papa") && m.has("lechuga") && m.has("Hojas verdes"));
  T.ok("P3 no confunde Batata ni Pan rallado (coincidencia exacta)", !m.has("Batata") && !m.has("Pan rallado"));
  criticalCase(); localStorage.setItem("miPlatoFacil_pantry", JSON.stringify(["papa"]));
  go("compras"); await wait(60);
  document.getElementById("shoppingQuantCostPanel").open = true; document.getElementById("shoppingMarkPantry").checked = true; shoppingQuantityAndCost(); await wait(30);
  T.ok("P4 'Ajustar porciones' marca Papa como marcada en despensa", /Papa \(marcado en despensa; cantidad disponible desconocida\)/.test(document.getElementById("shoppingQuantCostResult").textContent));
  go("ingredientes"); document.getElementById("recipeRecommendPantry").checked = true; recipeCatalogPage = 0; renderRecipeCatalog(); await wait(30);
  T.ok("P5 recomendaciones indican 'marcado, sin cantidad medida'", /Papa \(marcado, sin cantidad medida\)/.test(document.getElementById("recipeCatalogResults").textContent));
  document.getElementById("recipeRecommendPantry").checked = false; document.getElementById("shoppingMarkPantry").checked = false;
  reset(); pantrySel = []; renderPantry();
  return T;
})()
