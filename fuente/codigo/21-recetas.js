// Mi Plato Fácil · Recetas: datos, explorador, lectura y edición.
// Parte 22: los archivos se unen en orden según su número, que define el orden de arranque.
/* I04-A: detalles independientes; no migrar cantidades ni alterar cálculos existentes. */
const RECIPE_DETAILS_KEY="miPlatoFacil_recipeDetails_v1";
function validRecipeDetails(store){
  if(!store||typeof store!=="object"||Array.isArray(store))return false;
  const ids=Object.keys(store);
  if(ids.length>1000)return false;
  const sources=new Set(data.menuCatalog.map(x=>x.text));
  const used=new Set();
  return ids.every(id=>{
    const r=store[id];if(["__proto__","constructor","prototype"].includes(id)||!/^recipe_[a-zA-Z0-9_-]{6,90}$/.test(id)||!r||typeof r!=="object"||Array.isArray(r)||r.id!==id||typeof r.title!=="string"||!r.title.trim()||r.title.length>100||!Array.isArray(r.steps)||r.steps.length>100||r.steps.some(x=>typeof x!=="string"||!x.trim()||x.length>1000)||typeof r.notes!=="string"||r.notes.length>2000||!(r.sourceTitle===null||typeof r.sourceTitle==="string"&&sources.has(r.sourceTitle))||!(r.amountsTitle===null||typeof r.amountsTitle==="string"&&r.amountsTitle.length<=200))return false;if(r.tags!==undefined&&!(Array.isArray(r.tags)&&r.tags.length<=12&&r.tags.every(t=>typeof t==="string"&&t.trim()&&t.length<=30)))return false;if(r.minutes!==undefined&&r.minutes!==null&&!(Number.isInteger(r.minutes)&&r.minutes>=1&&r.minutes<=1440))return false;if(r.variantOf!==undefined&&r.variantOf!==null&&!(typeof r.variantOf==="string"&&/^recipe_[a-zA-Z0-9_-]{6,90}$/.test(r.variantOf)&&r.variantOf!==id))return false;if(r.substitutions!==undefined&&!(Array.isArray(r.substitutions)&&r.substitutions.length<=30&&r.substitutions.every(s=>s&&typeof s==="object"&&typeof s.from==="string"&&s.from.trim()&&s.from.length<=100&&typeof s.to==="string"&&s.to.trim()&&s.to.length<=100)))return false;if(r.amountsTitle){
      if(used.has(r.amountsTitle))return false;used.add(r.amountsTitle)
    }return true
  })
}
function loadRecipeDetails(){
  try{
    const raw=localStorage.getItem(RECIPE_DETAILS_KEY);
    if(raw===null)return {
    };
    const o=JSON.parse(raw);
    if(!validRecipeDetails(o))throw Error("Datos inválidos");
    return o
  }catch(e){
    throw new Error("No se pudieron leer los detalles guardados. No se sobrescribirán; revisá el respaldo.")
  }
}
function saveRecipeDetailsStore(all){
  if(!validRecipeDetails(all))throw new Error("Datos de recetas inválidos.");
  localStorage.setItem(RECIPE_DETAILS_KEY,JSON.stringify(all))
}
let recipeDetailsEditing=null;
function recipeDetailsStatus(t){
  document.getElementById("recipeDetailsStatus").textContent=t
}
function recipeDetailsOptions(){
  const select=document.getElementById("recipeDetailsSelect"),previous=recipeDetailsEditing,all=loadRecipeDetails();
  select.replaceChildren();
  const empty=ce("option",null,"Nueva receta");
  empty.value="";
  select.append(empty);
  Object.values(all).sort((a,b)=>a.title.localeCompare(b.title)).forEach(r=>{
    const o=ce("option",null,r.title);o.value=r.id;select.append(o)
  });
  select.value=previous&&all[previous]?previous:"";
  const source=document.getElementById("recipeDetailsSource");
  source.replaceChildren();
  const no=ce("option",null,"Sin idea asociada");
  no.value="";
  source.append(no);
  data.menuCatalog.forEach(x=>{
    const o=ce("option",null,x.text);o.value=x.text;source.append(o)
  });
  const amounts=document.getElementById("recipeDetailsAmounts");
  amounts.replaceChildren();
  const none=ce("option",null,"Sin cantidades vinculadas");
  none.value="";
  amounts.append(none);
  const current=all[previous]&&all[previous].amountsTitle;
  Object.keys(loadRecipeAmounts()).filter(key=>key.indexOf("receta:")!==0||key===ownAmountsKey(previous)||key===current).forEach(key=>{
    const o=ce("option",null,amountsLabel(key,all));o.value=key;amounts.append(o)
  })
}
function resetRecipeDetailsForm(){
  recipeDetailsEditing=null;
  recipeDetailsOptions();
  for(const id of ["recipeDetailsTitle","recipeDetailsSteps","recipeDetailsNotes","recipeTags","recipeMinutes","recipeSubstitutions"])document.getElementById(id).value="";
  document.getElementById("recipeDetailsSource").value="";
  document.getElementById("recipeDetailsAmounts").value="";
  renderRecipeIngredientRows(null);
  recipeDetailsStatus("Nueva receta. Las cantidades existentes no se modificarán.")
}
function renderRecipeDetails(){
  const all=loadRecipeDetails(),r=all[recipeDetailsEditing];
  recipeDetailsOptions();
  if(!r){
    resetRecipeDetailsForm();
    return
  }
  document.getElementById("recipeDetailsSelect").value=r.id;
  document.getElementById("recipeDetailsTitle").value=r.title;
  document.getElementById("recipeDetailsSource").value=r.sourceTitle||"";
  document.getElementById("recipeDetailsAmounts").value=r.amountsTitle||"";
  document.getElementById("recipeDetailsSteps").value=r.steps.join("\n");
  document.getElementById("recipeDetailsNotes").value=r.notes;
  document.getElementById("recipeTags").value=(r.tags||[]).join(", ");
  document.getElementById("recipeMinutes").value=r.minutes?String(r.minutes):"";
  document.getElementById("recipeSubstitutions").value=(r.substitutions||[]).map(s=>s.from+" = "+s.to).join("\n");
  renderRecipeIngredientRows(r.amountsTitle);
  recipeDetailsStatus("Editando receta. El nombre puede cambiar sin modificar su identidad.")
}
function recipeDetailsId(all){
  let id;
  do{
    id="recipe_"+(typeof crypto!=="undefined"&&crypto.randomUUID?crypto.randomUUID().replace(/-/g,""):Date.now().toString(36)+Math.random().toString(36).slice(2,12))
  }while(Object.prototype.hasOwnProperty.call(all,id));
  return id
}
function persistRecipeDetailsForm(){
  const all=loadRecipeDetails(),id=recipeDetailsEditing||recipeDetailsId(all),prev=all[id]||{
  },title=document.getElementById("recipeDetailsTitle").value.trim(),sourceTitle=document.getElementById("recipeDetailsSource").value||null,selected=document.getElementById("recipeDetailsAmounts").value||null,steps=document.getElementById("recipeDetailsSteps").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean),notes=document.getElementById("recipeDetailsNotes").value.trim();
  if(!title||title.length>100)throw Error("Ingresá un nombre de hasta 100 caracteres.");
  const tags=[...new Set(document.getElementById("recipeTags").value.split(",").map(x=>x.trim()).filter(Boolean))];
  if(tags.length>12||tags.some(t=>t.length>30))throw Error("Usá hasta 12 etiquetas de hasta 30 caracteres cada una.");
  const minutesText=document.getElementById("recipeMinutes").value.trim();
  let minutes=null;
  if(minutesText){
    if(!/^\d{1,4}$/.test(minutesText)||Number(minutesText)<1||Number(minutesText)>1440)throw Error("El tiempo debe ser un número de minutos entre 1 y 1440.");
    minutes=Number(minutesText)
  }
  const substitutions=document.getElementById("recipeSubstitutions").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>{
    const parts=line.split("=");if(parts.length!==2||!parts[0].trim()||!parts[1].trim())throw Error("Escribí cada reemplazo como: Ingrediente = Reemplazo.");return {
      from:parts[0].trim().slice(0,100),to:parts[1].trim().slice(0,100)
    }
  });
  if(substitutions.length>30)throw Error("Usá hasta 30 reemplazos.");
  const box=document.getElementById("recipeIngredientRows"),hasRows=!!box.querySelector(".amount-row"),amountsRecipe=hasRows?readAmountRows(box,"recipeYield"):null,amountsKey=hasRows?(selected||ownAmountsKey(id)):selected,amountsAll=loadRecipeAmounts();
  if(amountsKey&&!hasRows&&!Object.prototype.hasOwnProperty.call(amountsAll,amountsKey))throw Error("Las cantidades seleccionadas ya no existen.");
  if(amountsKey&&Object.values(all).some(r=>r.id!==id&&r.amountsTitle===amountsKey))throw Error("Esas cantidades ya están vinculadas a otra receta.");
  const entry={
    id,title,sourceTitle,amountsTitle:amountsKey,steps,notes,tags,minutes,substitutions,variantOf:typeof prev.variantOf==="string"&&prev.variantOf!==id?prev.variantOf:null
  };
  const previous=hasRows&&Object.prototype.hasOwnProperty.call(amountsAll,amountsKey)?amountsAll[amountsKey]:undefined;
  if(hasRows){
    amountsAll[amountsKey]=amountsRecipe;
    try{
      localStorage.setItem(RECIPE_AMOUNTS_KEY,JSON.stringify(amountsAll))
    }catch(e){
      throw Error("No se pudieron guardar los ingredientes (falta de espacio u otro error). No se modificó nada.")
    }
  }
  all[id]=entry;
  try{
    saveRecipeDetailsStore(all)
  }catch(err){
    if(hasRows){
      if(previous===undefined)delete amountsAll[amountsKey];
      else amountsAll[amountsKey]=previous;
      try{
        localStorage.setItem(RECIPE_AMOUNTS_KEY,JSON.stringify(amountsAll))
      }catch(ignore){
      }
    }
    throw Error("No se pudo guardar la receta (falta de espacio u otro error). No se modificó nada.")
  }
  recipeDetailsEditing=id;
  renderRecipeDetails();
  recipeDetailsStatus(hasRows?"Receta guardada con sus ingredientes. Si está en el plan, Compras usa estas cantidades.":"Receta guardada.");
  renderRecipeCatalog()
}
/* I04-B: explorador de ideas existentes y recetas propias. */
let recipeCatalogMineOnly=false;
let recipeCatalogPage=0;
function recipeCatalogEntries(menu,own,query,mineOnly){
  const q=normalizeSearchText(query.trim());
  const matches=text=>!q||normalizeSearchText(text).includes(q);
  const items=[];
  if(!mineOnly)for(const item of menu){
    const tags=Array.isArray(item.tags)?item.tags:[];
    if(matches(item.text)||tags.some(matches))items.push({
      kind:"idea",key:item.text,title:item.text,tags:tags.slice(0,4)
    })
  }
  for(const r of Object.values(own)){
    if(matches(r.title)||(r.sourceTitle&&matches(r.sourceTitle))||matches(r.notes)||r.steps.some(matches)||(r.tags||[]).some(matches)||(r.amountsTitle&&matches(r.amountsTitle)))items.push({
      kind:"propia",key:r.id,title:r.title,tags:(r.tags||[]).slice(0,4)
    })
  }
  return items.sort((a,b)=>a.kind===b.kind?a.title.localeCompare(b.title,"es"):(a.kind==="propia"?-1:1))
}
const RECIPE_PREF_KEY="miPlatoFacil_recipePreferences_v1";
function recipeAvoidTerms(){
  return [...new Set(document.getElementById("recipeAvoidWords").value.split(",").map(x=>normalizeSearchText(x)).filter(x=>x.length>=2))].slice(0,30)
}
function recipeAvoidMatch(entry,own,amounts,terms){
  let text=entry.title;
  if(entry.kind==="idea")text+=" "+entry.tags.join(" ");
  else{
    const r=own[entry.key];
    if(r){
      text+=" "+(r.sourceTitle||"");
      const a=r.amountsTitle&&amounts[r.amountsTitle];
      if(a)text+=" "+a.rows.map(x=>x.name).join(" ")
    }
  }
  text=normalizeSearchText(text);
  return terms.some(t=>text.includes(t))
}
function initRecipePreferences(){
  let pref={
  };
  try{
    pref=JSON.parse(localStorage.getItem(RECIPE_PREF_KEY)||"{}")||{
    }
  }catch(e){
  }
  document.getElementById("recipeAvoidWords").value=typeof pref.words==="string"?pref.words.slice(0,400):"";
  document.getElementById("recipeApplyAvoid").checked=pref.enabled===true;
  document.getElementById("recipeSavePreferences").addEventListener("click",()=>{
    try{
      localStorage.setItem(RECIPE_PREF_KEY,JSON.stringify({
        words:document.getElementById("recipeAvoidWords").value,enabled:document.getElementById("recipeApplyAvoid").checked
      }));document.getElementById("recipePreferencesStatus").textContent="Preferencias guardadas.";recipeCatalogPage=0;renderRecipeCatalog()
    }catch(e){
      document.getElementById("recipePreferencesStatus").textContent="No se pudieron guardar."
    }
  });
  document.getElementById("recipeClearPreferences").addEventListener("click",()=>{
    document.getElementById("recipeAvoidWords").value="";document.getElementById("recipeApplyAvoid").checked=false;try{
      localStorage.removeItem(RECIPE_PREF_KEY)
    }catch(e){
    }recipeCatalogPage=0;renderRecipeCatalog()
  });
  document.getElementById("recipeApplyAvoid").addEventListener("change",()=>{
    recipeCatalogPage=0;renderRecipeCatalog()
  })
}
startupGuard("Preferencias de recetas",initRecipePreferences);
function recipePantryScore(entry,own,amounts,pantry,stock){
  if(entry.kind!=="propia")return {
    known:false,have:0,total:0,complete:false,missing:[],unknown:[]
  };
  const r=own[entry.key],amount=r&&r.amountsTitle&&amounts[r.amountsTitle];
  if(!amount||!amount.rows.length)return {
    known:false,have:0,total:0,complete:false,missing:[],unknown:[]
  };
  const grouped=new Map();
  for(const row of amount.rows){
    const name=normalizeSearchText(row.name||"");
    if(!name)continue;
    const key=JSON.stringify([ingredientKey(row.name),unitInfo(row.unit).dim]);
    if(!grouped.has(key))grouped.set(key,{
      name:row.name,unit:row.unit,required:0,unknown:false
    });
    const g=grouped.get(key);
    if(row.quantity===null)g.unknown=true;
    else g.required+=convertQuantity(row.quantity,row.unit,g.unit)
  }
  if(!grouped.size)return {
    known:false,have:0,total:0,complete:false,missing:[],unknown:[]
  };
  let have=0,missing=[],unknown=[];
  for(const [key,g] of grouped){
    const recordQty=stockQuantityFor(stock,g.name,g.unit),record=recordQty===null?null:{
      quantity:recordQty
    },measured=record&&Number.isFinite(record.quantity),marked=pantry.has(normalizeSearchText(g.name));
    if(measured&&record.quantity>=g.required&&!g.unknown)have++;
    if(g.unknown)unknown.push(g.name+" (cantidad requerida desconocida)");
    else if(!measured)unknown.push(g.name+(marked?" (marcado, sin cantidad medida)":" (sin existencia medida)"));
    else if(record.quantity<g.required)missing.push(g.name+": faltan "+Number((g.required-record.quantity).toFixed(6))+" "+g.unit)
  }
  const subs=[];
  for(const s of (r&&r.substitutions)||[]){
    const g=[...grouped.values()].find(x=>sameIngredient(x.name,s.from));
    if(!g)continue;
    const own=stockQuantityFor(stock,g.name,g.unit),alt=stockQuantityFor(stock,s.to,g.unit);
    if(alt===null||(own!==null&&!g.unknown&&own>=g.required))continue;
    subs.push(g.name+" → "+s.to+" (tenés "+Number(alt.toFixed(6)).toLocaleString("es-AR")+" "+g.unit+(g.unknown||alt>=g.required?"":", no alcanza")+")")
  }
  return {
    known:true,have,total:grouped.size,complete:have===grouped.size,missing,unknown,subs
  }
}
function recipeMissingCost(entry,own,amounts,stock,prices){
  if(entry.kind!=="propia")return null;
  const r=own[entry.key],amount=r&&r.amountsTitle&&amounts[r.amountsTitle];
  if(!amount||!amount.rows.length)return null;
  const grouped=new Map();
  for(const row of amount.rows){
    if(!row.name||!row.name.trim())continue;
    const key=JSON.stringify([ingredientKey(row.name),unitInfo(row.unit).dim]);
    if(!grouped.has(key))grouped.set(key,{
      name:row.name,unit:row.unit,quantity:0,unknown:false
    });
    const g=grouped.get(key);
    if(row.quantity===null)g.unknown=true;
    else g.quantity+=convertQuantity(row.quantity,row.unit,g.unit)
  }
  const totals={
  },pending=[];
  for(const [key,g] of grouped){
    if(g.unknown){
      pending.push(g.name+": cantidad requerida desconocida");
      continue
    }
    const available=stockQuantityFor(stock,g.name,g.unit)||0,missing=Math.max(0,g.quantity-available);
    if(!missing)continue;
    const compatible=pricesFor(prices,g.name,g.unit).filter(p=>true&&Number.isFinite(p.amount)&&p.amount>0&&Number.isFinite(p.price)&&p.price>=0);
    if(compatible.length!==1){
      pending.push(g.name+": "+(compatible.length?"múltiples precios":"sin precio"));
      continue
    }
    const p=compatible[0],cost=missing*p.price/p.amount;
    if(!Number.isFinite(cost)){
      pending.push(g.name+": costo no calculable");
      continue
    }
    totals[p.currency]=(totals[p.currency]||0)+cost
  }
  return {
    totals,pending
  }
}
function renderRecipeCatalog(){
  const box=document.getElementById("recipeCatalogResults"),count=document.getElementById("recipeCatalogCount"),query=document.getElementById("recipeCatalogSearch").value;
  let own;
  try{
    own=loadRecipeDetails()
  }catch(err){
    box.replaceChildren();
    count.textContent=err.message;
    return
  }
  let entries=recipeCatalogEntries(data.menuCatalog,own,query,recipeCatalogMineOnly);
  const maxMinutes=Number(document.getElementById("recipeCatalogTime").value)||0;
  if(maxMinutes)entries=entries.filter(e=>e.kind==="propia"&&own[e.key].minutes&&own[e.key].minutes<=maxMinutes);
  let excluded=0;
  const terms=recipeAvoidTerms();
  if(document.getElementById("recipeApplyAvoid").checked&&terms.length){
    const amounts=loadRecipeAmounts(),before=entries.length;
    entries=entries.filter(e=>!recipeAvoidMatch(e,own,amounts,terms));
    excluded=before-entries.length
  }
  const mode=document.getElementById("recipeRecommendMode").value,recommend=document.getElementById("recipeRecommendPantry").checked||mode==="available"||mode==="combined",costsOn=document.getElementById("recipeRecommendCosts").checked||mode==="budget"||mode==="combined";
  let scores=new Map(),costs=new Map();
  if(costsOn){
    const amounts=loadRecipeAmounts(),stock=loadStockQuantities(),prices=Object.values(loadReferencePrices());
    costs=new Map(entries.map(e=>[e.kind+":"+e.key,recipeMissingCost(e,own,amounts,stock,prices)]))
  }
  if(recommend){
    const pantry=pantryMarkedMatcher(),amounts=loadRecipeAmounts(),stock=loadStockQuantities();
    scores=new Map(entries.map(e=>[e.kind+":"+e.key,recipePantryScore(e,own,amounts,pantry,stock)]));
    entries.sort((a,b)=>{
      const x=scores.get(a.kind+":"+a.key),y=scores.get(b.kind+":"+b.key);if(x.known!==y.known)return x.known?-1:1;if(x.known&&y.known){
        if(x.complete!==y.complete)return x.complete?-1:1;const difference=y.have/y.total-x.have/x.total;if(difference)return difference;const count=y.have-x.have;if(count)return count
      }return a.title.localeCompare(b.title,"es")
    })
  }
  if(mode==="budget"||mode==="combined"){
    const value=c=>{
      if(!c||c.pending.length||Object.keys(c.totals).length!==1)return Infinity;
      const currency=Object.keys(c.totals)[0],budget=shoppingBudgetRead();
      return budget&&budget.currency===currency?c.totals[currency]:Infinity
    };
    entries.sort((a,b)=>{
      const x=scores.get(a.kind+":"+a.key),y=scores.get(b.kind+":"+b.key);if(mode==="combined"){
        const xa=x&&x.known?x.have/x.total:-1,ya=y&&y.known?y.have/y.total:-1;if(xa!==ya)return ya-xa
      }const ca=value(costs.get(a.kind+":"+a.key)),cb=value(costs.get(b.kind+":"+b.key));if(ca!==cb)return ca-cb;return a.title.localeCompare(b.title,"es")
    })
  }
  document.getElementById("recipeRecommendStatus").textContent=recommend?"Prioridad según cantidades medidas de la despensa. Las marcas sin cantidad no prueban disponibilidad suficiente.":"Recomendaciones desactivadas.";
  const sort=document.getElementById("recipeCatalogSort").value;
  if(!recommend&&mode==="normal")entries.sort((a,b)=>sort==="type"?(a.kind===b.kind?a.title.localeCompare(b.title,"es"):(a.kind==="propia"?-1:1)):sort==="reverse"?b.title.localeCompare(a.title,"es"):a.title.localeCompare(b.title,"es"));
  const pageSize=Number(document.getElementById("recipeCatalogPageSize").value);
  const pageCount=Math.max(1,Math.ceil(entries.length/pageSize));
  recipeCatalogPage=Math.min(recipeCatalogPage,pageCount-1);
  const pager=document.getElementById("recipeCatalogPager");
  pager.hidden=entries.length<=pageSize;
  document.getElementById("recipeCatalogPageLabel").textContent="Página "+(recipeCatalogPage+1)+" de "+pageCount;
  document.getElementById("recipeCatalogPrev").disabled=recipeCatalogPage===0;
  document.getElementById("recipeCatalogNext").disabled=recipeCatalogPage>=pageCount-1;
  count.textContent=entries.length+" resultados. "+Object.keys(own).length+" recetas propias guardadas."+(excluded?" "+excluded+" coincidencias ocultas.":"");
  box.replaceChildren();
  if(recipeReadId&&(!Object.prototype.hasOwnProperty.call(own,recipeReadId)))closeRecipeRead();
  for(const entry of entries.slice(recipeCatalogPage*pageSize,(recipeCatalogPage+1)*pageSize)){
    const card=ce("div","recipe-catalog-card");
    card.append(ce("strong",null,entry.title));
    if(mode!=="normal"){
      const compact=ce("div","recipe-recommend-badges"),score=scores.get(entry.kind+":"+entry.key),cost=costs.get(entry.kind+":"+entry.key);
      if(score&&score.known)compact.append(ce("span","tag-chip",score.complete?"✓ Disponible":score.have+"/"+score.total+" disponibles"));
      else compact.append(ce("span","tag-chip","Disponibilidad sin verificar"));
      if(cost){
        const totals=Object.entries(cost.totals);
        if(totals.length)compact.append(ce("span","tag-chip","Costo parcial: "+totals.map(([c,v])=>v.toLocaleString("es-AR",{
          maximumFractionDigits:2
        })+" "+c).join(" · ")));
        if(cost.pending.length)compact.append(ce("span","tag-chip","Precio incompleto"))
      }
      if(document.getElementById("recipeApplyAvoid").checked&&terms.length)compact.append(ce("span","tag-chip","Preferencias filtradas"));
      card.append(compact)
    }
    if(recommend&&mode==="normal"){
      const score=scores.get(entry.kind+":"+entry.key);
      if(score&&score.known){
        card.append(ce("p","screen__hint",score.complete?"✅ Cantidades suficientes registradas":"Cantidades suficientes: "+score.have+" de "+score.total));
        if(score.missing.length)card.append(ce("p","screen__hint","Faltantes: "+score.missing.join("; ")));
        if(score.subs&&score.subs.length)card.append(ce("p","screen__hint","Reemplazos disponibles: "+score.subs.join("; ")));
        if(score.unknown.length)card.append(ce("p","screen__hint","Sin datos suficientes: "+score.unknown.join("; ")))
      }else card.append(ce("p","screen__hint","Sin ingredientes registrados para evaluar"))
    }
    if(costsOn&&mode==="normal"){
      const cost=costs.get(entry.kind+":"+entry.key);
      if(cost){
        const currencies=Object.entries(cost.totals);
        card.append(ce("p","screen__hint",currencies.length?"Costo parcial de faltantes: "+currencies.map(([currency,total])=>total.toLocaleString("es-AR",{
          minimumFractionDigits:2,maximumFractionDigits:2
        })+" "+currency).join(" · "):"Sin costos calculables para faltantes"));
        if(cost.pending.length)card.append(ce("p","screen__hint","Pendiente: "+cost.pending.join("; ")));
        if(entry.kind==="propia"){
          const full=recipeCostText(recipeFullCost(own[entry.key]));
          if(full)card.append(ce("p","screen__hint",full))
        }
      }else card.append(ce("p","screen__hint","Sin cantidades vinculadas para estimar costos"))
    }
    if(mode!=="normal"){
      const reason=ce("details","recipe-recommend-details"),parts=[],score=scores.get(entry.kind+":"+entry.key),cost=costs.get(entry.kind+":"+entry.key),prefOn=document.getElementById("recipeApplyAvoid").checked&&terms.length>0;
      if(entry.kind==="idea")parts.push("Idea del catálogo: faltan cantidades para verificar disponibilidad y costo.");
      else{
        if(score&&score.known){
          parts.push(score.complete?"Disponibilidad: todos los ingredientes tienen cantidad suficiente registrada.":"Disponibilidad: "+score.have+" de "+score.total+" ingredientes con cantidad suficiente.");
          if(score.missing.length)parts.push("Faltantes medidos: "+score.missing.join("; "));
          if(score.subs&&score.subs.length)parts.push("Reemplazos disponibles: "+score.subs.join("; "));
          if(score.unknown.length)parts.push("Datos sin verificar: "+score.unknown.join("; "))
        }else parts.push("Disponibilidad: no evaluable por falta de cantidades vinculadas.");
        if(cost){
          const values=Object.entries(cost.totals);
          parts.push(values.length?"Costo parcial de faltantes: "+values.map(([currency,value])=>value.toLocaleString("es-AR",{
            minimumFractionDigits:2,maximumFractionDigits:2
          })+" "+currency).join("; "):"Costo: sin importe verificable.");
          if(cost.pending.length)parts.push("Precios pendientes: "+cost.pending.join("; "))
        }
      }
      parts.push(prefOn?"Preferencias: no se encontraron coincidencias en los campos analizados; no garantiza aptitud alimentaria.":"Preferencias: filtro no aplicado.");
      const title=ce("summary",null,"Ver por qué se recomienda");
      reason.append(title);
      const ul=ce("ul");
      parts.forEach(p=>ul.append(ce("li",null,p)));
      reason.append(ul);
      card.append(reason)
    }
    if(entry.kind==="idea")entry.tags.forEach(t=>card.append(ce("span","tag-chip",t)));
    else{
      const r=own[entry.key];
      card.append(ce("p","screen__hint",(r.minutes?"⏱ "+r.minutes+" min · ":"")+r.steps.length+" pasos registrados"+(r.amountsTitle?" · cantidades vinculadas":" · sin cantidades vinculadas")+(r.variantOf&&own[r.variantOf]?" · variante de "+own[r.variantOf].title:"")));
      (r.tags||[]).slice(0,4).forEach(t=>card.append(ce("span","tag-chip",t)))
    }
    const b=ce("button","button button--soft",entry.kind==="idea"?"Usar idea como base":"Ver receta");
    b.type="button";
    b.dataset.recipeCatalogKind=entry.kind;
    b.dataset.recipeCatalogKey=entry.key;
    card.append(b);
    box.append(card)
  }
}
function startRecipeFromIdea(title){
  if(!data.menuCatalog.some(x=>x.text===title))throw Error("La idea ya no está disponible.");
  resetRecipeDetailsForm();
  document.getElementById("recipeDetailsTitle").value=title;
  document.getElementById("recipeDetailsSource").value=title;
  (PANTRY_REVIEW_COMPONENTS[title]||[]).forEach(x=>appendRecipeAmountRow({
    name:x.label,quantity:null,unit:"g"
  },document.getElementById("recipeIngredientRows")));
  recipeDetailsStatus("Idea seleccionada. Revisá los ingredientes propuestos y cargá cantidades solo si las conocés.");
  showRecipeView("editor");
  document.getElementById("recipeDetailsTitle").focus()
}
let recipeReadId=null;
let recipeReadReturnFocus=null;
// "misplatos" cuando la receta se abrió desde Mis comidas: Volver regresa ahí.
let recipeReadReturnTo=null;
function showRecipeRead(id){
  const all=loadRecipeDetails(),r=all[id];
  if(!r)throw Error("La receta ya no está disponible.");
  recipeReadId=id;
  recipeReadReturnFocus=document.activeElement;
  document.getElementById("recipeBrowseView").classList.add("is-reading");
  const panel=document.getElementById("recipeReadView");
  document.getElementById("recipeCatalogResults").hidden=true;
  panel.hidden=false;
  document.getElementById("recipeReadBack").textContent=recipeReadReturnTo==="misplatos"?"← Volver a Mis comidas":"← Volver a recetas";
  document.getElementById("recipeReadStatus").textContent="";
  document.getElementById("recipeReadTitle").textContent=r.title;
  document.getElementById("recipeReadOrigin").textContent=r.sourceTitle?"Idea de origen: "+r.sourceTitle:"Receta propia";
  renderRecipeReadExtras(r,all);
  const ingredients=document.getElementById("recipeReadIngredients");
  ingredients.replaceChildren();
  const recipes=loadRecipeAmounts(),amount=r.amountsTitle&&Object.prototype.hasOwnProperty.call(recipes,r.amountsTitle)?recipes[r.amountsTitle]:null;
  if(amount){
    ingredients.append(ce("p","screen__hint","Rinde "+amount.yield+" porciones. Cantidades registradas por vos."));
    const ul=ce("ul");
    for(const row of amount.rows){
      const li=ce("li",null,row.name+": "+(row.quantity===null?"cantidad desconocida":row.quantity+" "+row.unit));
      ul.append(li)
    }
    ingredients.append(ul);
    const costLine=recipeCostText(recipeFullCost(r));
    if(costLine)ingredients.append(ce("p","screen__hint",costLine));
    ingredients.append(recipeNutritionBox(amount))
  }else ingredients.append(ce("p","screen__hint",r.amountsTitle?"Las cantidades vinculadas ya no están disponibles.":"No hay ingredientes registrados para esta receta. Tocá Editar receta para cargarlos."));
  const steps=document.getElementById("recipeReadSteps");
  steps.replaceChildren();
  if(r.steps.length){
    const ol=ce("ol");
    r.steps.forEach(t=>ol.append(ce("li",null,t)));
    steps.append(ol)
  }else steps.append(ce("p","screen__hint","No hay pasos registrados."));
  document.getElementById("recipeReadNotes").textContent=r.notes||"Sin notas.";
  panel.scrollIntoView({
    block:"start",behavior:"smooth"
  });
  document.getElementById("recipeReadBack").focus({
    preventScroll:true
  })
}
function closeRecipeRead(restoreFocus=true){
  recipeReadId=null;
  recipeReadReturnTo=null;
  document.getElementById("recipeBrowseView").classList.remove("is-reading");
  document.getElementById("recipeReadView").hidden=true;
  document.getElementById("recipeCatalogResults").hidden=false;
  if(restoreFocus&&recipeReadReturnFocus&&recipeReadReturnFocus.isConnected)recipeReadReturnFocus.focus({
    preventScroll:true
  });
  recipeReadReturnFocus=null
}
function duplicateRecipeDetails(id){
  const all=loadRecipeDetails(),original=all[id];
  if(!original)throw Error("Elegí una receta guardada para duplicar.");
  if(Object.keys(all).length>=1000)throw Error("Alcanzaste el límite de recetas guardadas.");
  const newId=recipeDetailsId(all);
  const amounts=loadRecipeAmounts(),source=original.amountsTitle&&Object.prototype.hasOwnProperty.call(amounts,original.amountsTitle)?amounts[original.amountsTitle]:null,newKey=ownAmountsKey(newId);
  const copy={
    id:newId,title:("Copia de "+original.title).slice(0,100),sourceTitle:original.sourceTitle,amountsTitle:source?newKey:null,steps:original.steps.slice(),notes:original.notes,tags:(original.tags||[]).slice(),minutes:original.minutes||null,substitutions:(original.substitutions||[]).map(s=>({
      from:s.from,to:s.to
    })),variantOf:original.variantOf&&all[original.variantOf]?original.variantOf:original.id
  };
  try{
    if(source){
      amounts[newKey]=JSON.parse(JSON.stringify(source));
      localStorage.setItem(RECIPE_AMOUNTS_KEY,JSON.stringify(amounts))
    }
    all[newId]=copy;
    saveRecipeDetailsStore(all)
  }catch(err){
    if(source&&Object.prototype.hasOwnProperty.call(amounts,newKey)){
      delete amounts[newKey];
      try{
        localStorage.setItem(RECIPE_AMOUNTS_KEY,JSON.stringify(amounts))
      }catch(ignore){
      }
    }
    throw Error("No se pudo crear la copia (falta de espacio u otro error). No se modificó ninguna receta.")
  }
  recipeDetailsEditing=newId;
  closeRecipeRead(false);
  renderRecipeDetails();
  showRecipeView("editor");
  recipeDetailsStatus(source?"Copia creada con sus propias cantidades: podés cambiarlas sin afectar la receta original.":"Copia creada. Conserva los pasos y notas; la receta original no tenía cantidades vinculadas.");
  document.getElementById("recipeDetailsTitle").focus({
    preventScroll:true
  });
  renderRecipeCatalog()
}
function duplicateRecipeFromButton(id){
  try{
    duplicateRecipeDetails(id)
  }catch(err){
    recipeDetailsStatus(err.message)
  }
}
function addRecipeMissingToShopping(){
  const status=document.getElementById("recipeCatalogCount");
  try{
    const id=recipeReadId;
    if(!id)throw Error("Abrí una receta guardada primero.");
    const own=loadRecipeDetails(),amounts=loadRecipeAmounts(),pantry=pantryMarkedMatcher(),score=recipePantryScore({
      kind:"propia",key:id,title:own[id]&&own[id].title
    },own,amounts,pantry,loadStockQuantities());
    if(!score.known)throw Error("Esta receta no tiene cantidades vinculadas.");
    if(!score.missing.length){
      status.textContent=score.unknown.length?"No se agregaron productos: faltan cantidades registradas para evaluar la receta.":"La despensa tiene cantidades suficientes para esta receta.";
      return
    }
    const existing=loadManualShopping();
    let added=0;
    for(const missing of score.missing){
      const match=missing.match(/^(.*): faltan ([0-9.]+) (.*)$/);
      if(!match)continue;
      const name=match[1].trim(),amount=match[2]+" "+match[3],same=existing.some(x=>!x.done&&normalizeSearchText(x.name)===normalizeSearchText(name)&&x.amount===amount);
      if(same)continue;
      existing.push({
        id:"recipe_missing_"+Date.now()+"_"+Math.random().toString(36).slice(2,8),name,amount,done:false
      });
      added++
    }
    if(!added){
      status.textContent="Estos faltantes ya figuran en los productos extra de Compras.";
      return
    }
    if(!persistManualShopping(existing))throw Error("No se pudieron guardar los faltantes.");
    renderManualShopping();
    renderCompras();
    status.textContent=added+" faltantes agregados a productos extra de Compras. La planificación no cambió."+(score.unknown.length?" Revisá también los ingredientes sin cantidades suficientes para evaluar.":"")
  }catch(err){
    status.textContent=err.message
  }
}
document.getElementById("recipeReadToShopping").addEventListener("click",addRecipeMissingToShopping);
document.getElementById("recipeReadDuplicate").addEventListener("click",()=>duplicateRecipeFromButton(recipeReadId));
document.getElementById("recipeDetailsDuplicate").addEventListener("click",()=>duplicateRecipeFromButton(recipeDetailsEditing));
document.getElementById("recipeReadBack").addEventListener("click",()=>{
  if(recipeReadReturnTo==="misplatos"){
    closeRecipeRead(false);
    back();
    return
  }
  closeRecipeRead()
});
document.getElementById("recipeReadEdit").addEventListener("click",()=>{
  try{
    const id=recipeReadId;if(!id)return;recipeDetailsEditing=id;renderRecipeDetails();closeRecipeRead(false);showRecipeView("editor");document.getElementById("recipeDetailsTitle").focus({
      preventScroll:true
    })
  }catch(err){
    document.getElementById("recipeCatalogCount").textContent=err.message
  }
});
function showRecipeView(view){
  const browse=view==="browse",panel=document.getElementById("recipeDetailsPanel");
  // Desde la v15 las recetas están plegadas en "📖 Recetas": abrir una vista abre el panel.
  if(panel&&"open" in panel)panel.open=true;
  document.getElementById("recipeBrowseView").hidden=!browse;
  document.getElementById("recipeEditorView").hidden=browse;
  document.getElementById("recipeViewBrowse").setAttribute("aria-pressed",String(browse));
  document.getElementById("recipeViewCreate").setAttribute("aria-pressed",String(!browse));
  if(browse){
    closeRecipeRead(false);
    renderRecipeCatalog()
  }else closeRecipeRead(false)
}
document.getElementById("recipeViewBrowse").addEventListener("click",()=>showRecipeView("browse"));
document.getElementById("recipeViewCreate").addEventListener("click",()=>{
  try{
    resetRecipeDetailsForm();showRecipeView("editor")
  }catch(err){
    recipeDetailsStatus(err.message)
  }
});
setTimeout(()=>{
  try{
    renderRecipeCatalog()
  }catch(err){
    document.getElementById("recipeCatalogCount").textContent=err.message
  }
},0);
document.getElementById("recipeRecommendMode").addEventListener("change",()=>{
  recipeCatalogPage=0;renderRecipeCatalog()
});
document.getElementById("recipeRecommendCosts").addEventListener("change",()=>{
  recipeCatalogPage=0;renderRecipeCatalog()
});
document.getElementById("recipeRecommendPantry").addEventListener("change",()=>{
  recipeCatalogPage=0;renderRecipeCatalog()
});
document.getElementById("recipeCatalogSearch").addEventListener("input",()=>{
  recipeCatalogPage=0;renderRecipeCatalog()
});
document.getElementById("recipeCatalogOnlyMine").addEventListener("click",e=>{
  recipeCatalogMineOnly=!recipeCatalogMineOnly;recipeCatalogPage=0;e.currentTarget.setAttribute("aria-pressed",String(recipeCatalogMineOnly));e.currentTarget.textContent=recipeCatalogMineOnly?"Mostrar también ideas":"Ver solo mis recetas";renderRecipeCatalog()
});
document.getElementById("recipeCatalogClear").addEventListener("click",()=>{
  document.getElementById("recipeCatalogSearch").value="";recipeCatalogPage=0;renderRecipeCatalog();document.getElementById("recipeCatalogSearch").focus()
});
for(const id of ["recipeCatalogSort","recipeCatalogPageSize"])document.getElementById(id).addEventListener("change",()=>{
  recipeCatalogPage=0;renderRecipeCatalog()
});
document.getElementById("recipeCatalogPrev").addEventListener("click",()=>{
  if(recipeCatalogPage>0){
    recipeCatalogPage--;renderRecipeCatalog()
  }
});
document.getElementById("recipeCatalogNext").addEventListener("click",()=>{
  recipeCatalogPage++;renderRecipeCatalog()
});
document.getElementById("recipeCatalogResults").addEventListener("click",e=>{
  const b=e.target.closest("button[data-recipe-catalog-kind]");if(!b)return;try{
    if(b.dataset.recipeCatalogKind==="idea")startRecipeFromIdea(b.dataset.recipeCatalogKey);else{
      showRecipeRead(b.dataset.recipeCatalogKey)
    }
  }catch(err){
    recipeDetailsStatus(err.message)
  }
});
document.getElementById("recipeDetailsSelect").addEventListener("change",e=>{
  recipeDetailsEditing=e.target.value||null;try{
    renderRecipeDetails()
  }catch(err){
    recipeDetailsStatus(err.message)
  }
});
document.getElementById("recipeDetailsNew").addEventListener("click",()=>{
  try{
    resetRecipeDetailsForm()
  }catch(err){
    recipeDetailsStatus(err.message)
  }
});
document.getElementById("recipeDetailsCancel").addEventListener("click",()=>{
  try{
    renderRecipeDetails()
  }catch(err){
    recipeDetailsStatus(err.message)
  }
});
document.getElementById("recipeDetailsSave").addEventListener("click",()=>{
  try{
    persistRecipeDetailsForm()
  }catch(err){
    recipeDetailsStatus(err.message)
  }
});
document.getElementById("recipeDetailsDelete").addEventListener("click",()=>{
  try{
    if(!recipeDetailsEditing)throw Error("Elegí una receta guardada.");const all=loadRecipeDetails(),target=all[recipeDetailsEditing],ownKey=ownAmountsKey(recipeDetailsEditing),ownAmounts=!!target&&target.amountsTitle===ownKey;if(!window.confirm(ownAmounts?"¿Eliminar la receta guardada? Se borrarán su nombre, pasos, notas y sus cantidades propias.":"¿Eliminar la receta guardada? Se borrarán su nombre, pasos y notas. Las cantidades vinculadas seguirán guardadas por separado."))return;delete all[recipeDetailsEditing];saveRecipeDetailsStore(all);let note="Detalles eliminados. Las cantidades siguen guardadas.";if(ownAmounts){
      const amounts=loadRecipeAmounts();delete amounts[ownKey];try{
        localStorage.setItem(RECIPE_AMOUNTS_KEY,JSON.stringify(amounts));note="Receta y cantidades propias eliminadas."
      }catch(e){
        note="Receta eliminada. Sus cantidades quedaron guardadas por separado."
      }
    }resetRecipeDetailsForm();recipeDetailsStatus(note);renderRecipeCatalog()
  }catch(err){
    recipeDetailsStatus(err.message)
  }
});
