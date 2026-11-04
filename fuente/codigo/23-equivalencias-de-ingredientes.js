// Mi Plato Fácil · Equivalencias de ingredientes del usuario.
// Parte 24: los archivos se unen en orden según su número, que define el orden de arranque.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Equivalencias.nombre().
var Equivalencias={
knownIngredientNames(){
  const names=new Map(),add=n=>{
    const t=String(n||"").trim();
    if(t&&t.length<=100&&!names.has(normalizeSearchText(t)))names.set(normalizeSearchText(t),t)
  };
  try{
    for(const r of Object.values(loadRecipeAmounts()))r.rows.forEach(x=>add(x.name))
  }catch(e){
  }
  Object.values(loadStockQuantities()).forEach(s=>add(s.name));
  Object.values(loadReferencePrices()).forEach(p=>add(p.name));
  try{
    Semana.planItemsFlat().forEach(it=>Semana.extractIngredients(it).forEach(add))
  }catch(e){
  }
  return [...names.values()].sort((a,b)=>a.localeCompare(b,"es"))
},
saveIngredientAlias(from,to){
  from=String(from||"").trim();
  to=String(to||"").trim();
  if(!from||!to)throw Error("Escribí los dos nombres.");
  if(from.length>100||to.length>100)throw Error("Usá nombres de hasta 100 caracteres.");
  const key=Ingredientes.ingredientNormal(from),target=ingredientKey(to);
  if(!key||!target)throw Error("Escribí los dos nombres.");
  if(ingredientKey(from)===target)throw Error("Esos nombres ya se consideran el mismo ingrediente.");
  if(target===key)throw Error("No se puede unir un nombre consigo mismo.");
  const all={
    ...Ingredientes.loadIngredientAliases()
  };
  all[key]={
    from,to:target,toName:Ingredientes.ingredientDisplayName(target,to)
  };
  if(!Ingredientes.validIngredientAliases(all))throw Error("No se pudo guardar la equivalencia (máximo 500).");
  try{
    localStorage.setItem(INGREDIENT_ALIASES_KEY,JSON.stringify(all))
  }catch(e){
    throw Error("No se pudo guardar la equivalencia (falta de espacio u otro error).")
  }
},
renderIngredientAliases(){
  const list=document.getElementById("ingredientAliasList"),sug=document.getElementById("ingredientAliasSuggestions"),dl=document.getElementById("ingredientAliasNames"),names=Equivalencias.knownIngredientNames();
  dl.replaceChildren(...names.map(n=>{
    const o=ce("option");o.value=n;return o
  }));
  const entries=Object.entries(Ingredientes.loadIngredientAliases()).sort((a,b)=>a[1].from.localeCompare(b[1].from,"es"));
  list.replaceChildren(...entries.map(([key,a])=>{
    const row=ce("div","shop-item");row.append(ce("span",null,a.from+" = "+a.toName));const b=ce("button","filter-chip filter-chip--danger","Quitar");b.type="button";b.dataset.ingredientAliasRemove=key;b.setAttribute("aria-label","Quitar equivalencia de "+a.from);row.append(b);return row
  }));
  if(!entries.length)list.append(ce("p","screen__hint","Todavía no definiste equivalencias."));
  sug.replaceChildren();
  const pairs=ingredientAliasSuggestions(names);
  if(pairs.length){
    sug.append(ce("p","home-section-label","Posibles equivalencias en tus datos"));
    for(const [a,b] of pairs){
      const row=ce("div","shop-item");
      row.append(ce("span",null,"¿“"+a+"” es lo mismo que “"+b+"”?"));
      const btn=ce("button","filter-chip","Unir");
      btn.type="button";
      btn.dataset.ingredientAliasFrom=a;
      btn.dataset.ingredientAliasTo=b;
      btn.setAttribute("aria-label","Unir "+a+" con "+b);
      row.append(btn);
      sug.append(row)
    }
  }
}
};
function ingredientAliasSuggestions(names){
  const stop=["de","del","con","los","las","para","sin"],groups=new Map();
  for(const n of names){
    const key=ingredientKey(n),head=(Ingredientes.ingredientNormal(n).split(" ").map(w=>w.replace(/[^a-z0-9]/g,"")).find(w=>w.length>2&&!stop.includes(w))||"");
    if(!head)continue;
    if(!groups.has(head))groups.set(head,new Map());
    const g=groups.get(head);
    if(!g.has(key))g.set(key,n)
  }
  const out=[];
  for(const g of groups.values()){
    if(g.size<2)continue;
    const list=[...g.values()].sort((a,b)=>a.length-b.length||a.localeCompare(b,"es"));
    // Etapa 23: solo variantes de nombre del mismo ingrediente (la nutrición los reconoce como el mismo, o el nombre más largo es
    // el corto con una variante). "Queso Port Salut descremado" y "Queso cremoso" son quesos distintos: no se sugiere unirlos.
    const mismo=(a,b)=>{
      if(Ingredientes.variantesNombre(a).some(v=>ingredientKey(v)===ingredientKey(b))||Ingredientes.variantesNombre(b).some(v=>ingredientKey(v)===ingredientKey(a)))return true;
      const x=nutritionFor(a),y=nutritionFor(b);
      return !!x&&!!y&&x.n===y.n
    };
    for(const other of list.slice(1))if(mismo(other,list[0]))out.push([other,list[0]])
  }
  return out.slice(0,8)
}
document.getElementById("ingredientAliasPanel").addEventListener("toggle",e=>{
  if(e.target.open){
    document.getElementById("ingredientAliasStatus").textContent="";Equivalencias.renderIngredientAliases()
  }
});
document.getElementById("ingredientAliasSave").addEventListener("click",()=>{
  const status=document.getElementById("ingredientAliasStatus");try{
    Equivalencias.saveIngredientAlias(document.getElementById("ingredientAliasFrom").value,document.getElementById("ingredientAliasTo").value);document.getElementById("ingredientAliasFrom").value="";document.getElementById("ingredientAliasTo").value="";status.textContent="Equivalencia guardada. Compras, despensa y precios ya la usan.";Equivalencias.renderIngredientAliases()
  }catch(err){
    status.textContent=err.message
  }
});
document.getElementById("ingredientAliasPanel").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;const status=document.getElementById("ingredientAliasStatus");try{
    if(b.dataset.ingredientAliasRemove!==undefined){
      const all={
        ...Ingredientes.loadIngredientAliases()
      };delete all[b.dataset.ingredientAliasRemove];try{
        localStorage.setItem(INGREDIENT_ALIASES_KEY,JSON.stringify(all))
      }catch(err){
        throw Error("No se pudo quitar la equivalencia.")
      }status.textContent="Equivalencia quitada.";Equivalencias.renderIngredientAliases()
    }else if(b.dataset.ingredientAliasFrom!==undefined){
      Equivalencias.saveIngredientAlias(b.dataset.ingredientAliasFrom,b.dataset.ingredientAliasTo);status.textContent="Unidos: “"+b.dataset.ingredientAliasFrom+"” = “"+b.dataset.ingredientAliasTo+"”.";Equivalencias.renderIngredientAliases()
    }
  }catch(err){
    status.textContent=err.message
  }
});
document.getElementById("recipeIngredientAdd").addEventListener("click",()=>{
  const box=document.getElementById("recipeIngredientRows");if(box.children.length>=200){
    recipeDetailsStatus("Máximo 200 ingredientes por receta.");return
  }appendRecipeAmountRow({
  },box);box.lastElementChild.querySelector("[data-amount-name]").focus()
});
document.getElementById("recipeDetailsAmounts").addEventListener("change",e=>{
  const key=e.target.value;if(!key)return;const box=document.getElementById("recipeIngredientRows");if(box.querySelector(".amount-row")&&!window.confirm("¿Cargar los ingredientes de las cantidades elegidas? Los cambios sin guardar en ingredientes se perderán.")){
    e.target.value=(recipeDetailsEditing&&(CantidadesCostos.safeRecipeDetails()[recipeDetailsEditing]||{
    }).amountsTitle)||"";return
  }renderRecipeIngredientRows(key)
});
document.getElementById("recipeCatalogTime").addEventListener("change",()=>{
  recipeCatalogPage=0;renderRecipeCatalog()
});
document.addEventListener("change",e=>{
  const t=e.target;if(!t||!t.dataset||t.dataset.planPortions===undefined)return;const key=t.dataset.planPortions,raw=t.value.trim();try{
    const p=Semana.loadPlanPortions();if(!raw)delete p[key];else{
      const n=Number(raw.replace(",","."));if(!Number.isFinite(n)||n<0.25||n>100)throw Error("Indicá porciones entre 0,25 y 100.");p[key]=Math.round(n*100)/100
    }if(!Semana.copiaAutomaticaDeSemana())throw Error(errorDelPlan);Semana.savePlanPortions(p);const [d,s]=key.split("|");Semana.logPlanChange(Semana.planDayName(d)+" · "+Semana.planSlotName(s)+": porciones "+(raw?String(p[key]).replace(".",","):"según la receta"));renderPlan();planStatus("Porciones guardadas. Compras las usa.")
  }catch(err){
    planStatus(err.message||"No se pudieron guardar las porciones.");renderPlan()
  }
});
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b||!b.dataset.datedReuse)return;try{
    const n=Semana.reuseDatedWeek(b.dataset.datedReuse);if(n!==false)SemanasFechadas.datedWeekMessage("Plan actual reemplazado por esta semana."+(n?" Se recuperaron "+n+" platos que ya no estaban guardados.":""))
  }catch(err){
    SemanasFechadas.datedWeekMessage(err.message)
  }
});
document.getElementById("planHistoryPanel").addEventListener("toggle",e=>{
  if(e.target.open)Semana.renderPlanHistory()
});
