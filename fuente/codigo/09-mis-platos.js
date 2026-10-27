// Mi Plato Fácil · Mis platos guardados, importar y exportar.
// Parte 10: los archivos se unen en orden según su número, que define el orden de arranque.
const SKEY="miPlatoFacil_saved";
function loadSaved(){
  try{
    const raw=localStorage.getItem(SKEY);
    const a=raw?JSON.parse(raw):[];
    return Array.isArray(a)?a:[]
  }catch(e){
    return []
  }
}
function persistSaved(a){
  try{
    localStorage.setItem(SKEY,JSON.stringify(a));
    return true
  }catch(e){
    return false
  }
}
function plateSignature(){
  return state.type+"|"+plateLines().join("|")
}
function currentSnapshot(){
  const L=plateLines();
  return {
    id:Date.now()+"_"+Math.random().toString(36).slice(2,7),savedAt:new Date().toISOString(),type:state.type,title:L[0],lines:L.slice(1),sig:plateSignature(),text:plateText(),cooked:0,state:JSON.parse(JSON.stringify(state))
  }
}
let savedStatusTimer=null;
function savedStatus(msg){
  const s=document.getElementById("savedStatus");
  if(!s)return;
  s.textContent=msg;
  clearTimeout(savedStatusTimer);
  savedStatusTimer=setTimeout(()=>{
    s.textContent=""
  },3600)
}
function savePlate(){
  if(!state.type){
    shareStatus("Primero armá un plato.");
    return
  }
  const a=loadSaved();
  const snap=currentSnapshot();
  if(a.some(x=>(x.sig||x.text)===snap.sig)){
    shareStatus("Este plato ya está guardado.");
    return
  }
  a.unshift(snap);
  const ok=persistSaved(a);
  shareStatus(ok?"¡Plato guardado en este dispositivo!":"No se pudo guardar (almacenamiento no disponible).")
}
function deleteSaved(id){
  const a=loadSaved().filter(x=>x.id!==id);
  persistSaved(a);
  renderSaved();
  savedStatus("Plato eliminado.")
}
function toggleFav(id){
  const a=loadSaved();
  const it=a.find(x=>x.id===id);
  if(!it)return;
  it.fav=!it.fav;
  persistSaved(a);
  renderSaved();
  savedStatus(it.fav?"Marcado como favorito.":"Quitado de favoritos.")
}
function renameSaved(id){
  const a=loadSaved();
  const it=a.find(x=>x.id===id);
  if(!it)return;
  const cur=it.note||"";
  const val=window.prompt("Nombre o nota para este plato:",cur);
  if(val===null)return;
  it.note=val.trim();
  persistSaved(a);
  renderSaved();
  savedStatus(it.note?"Nota guardada.":"Nota eliminada.")
}
function cookedPlate(id){
  const a=loadSaved();
  const it=a.find(x=>x.id===id);
  if(!it)return;
  it.cooked=(it.cooked||0)+1;
  persistSaved(a);
  renderSaved();
  savedStatus("¡Registrado! Cocinaste este plato "+it.cooked+" ve"+(it.cooked===1?"z":"ces")+".")
}
function clearAllSaved(){
  const a=loadSaved();
  if(!a.length){
    savedStatus("No hay platos para borrar.");
    return
  }
  if(window.confirm("¿Seguro que querés borrar TODOS los platos guardados? Esta acción no se puede deshacer.")){
    persistSaved([]);
    renderSaved();
    savedStatus("Se borraron todos los platos.")
  }
}
function matchSaved(it,q){
  if(!q)return true;
  const hay=normalizeSearchText(savedItemTitle(it)+" "+(it.title||"")+" "+savedItemLines(it).join(" ")+" "+(it.note||""));
  return hay.includes(q)
}
function fmtWhen(iso){
  const d=new Date(iso);
  if(isNaN(d.getTime()))return "";
  return d.toLocaleDateString("es-AR")+" "+d.toLocaleTimeString("es-AR",{
    hour:"2-digit",minute:"2-digit"
  })
}
function savedCard(item){
  const card=ce("div","summary__line");
  const head=ce("div",null);
  head.append(ce("strong",null,(item.fav?"⭐ ":"")+(item.recipeSourceId?"📖":typeEmoji(item.type))+" "+savedItemTitle(item)));
  if(item.note){
    const nt=ce("div",null,"🏷️ "+item.note);
    nt.style.color="var(--green)";
    nt.style.fontSize="13px";
    nt.style.fontWeight="800";
    nt.style.marginTop="4px";
    head.append(nt)
  }
  const lines=Array.isArray(item.lines)?savedItemLines(item):(item.text?item.text.split(NL).slice(1).map(x=>x.replace(/^•\s*/,"")):[]);
  const ul=ce("ul");
  ul.style.margin="6px 0 0";
  ul.style.paddingLeft="18px";
  ul.style.color="var(--muted)";
  ul.style.fontSize="13px";
  lines.forEach(t=>ul.append(ce("li",null,t)));
  const c=item.cooked||0;
  const meta=ce("div",null,fmtWhen(item.savedAt)+(c>0?" · 👨‍🍳 Cocinado "+c+" ve"+(c===1?"z":"ces"):""));
  meta.style.color="var(--muted)";
  meta.style.fontSize="12px";
  meta.style.marginTop="6px";
  const open=expandedSaved.has(item.id);
  const tog=ce("button","button button--soft saved-toggle",(open?"Opciones ▴":"Opciones ▾"));
  tog.type="button";
  tog.dataset.toggleActions=item.id;
  tog.setAttribute("aria-expanded",String(open));
  const acts=ce("div","summary-actions"+(open?"":" is-hidden"));
  const bCook=ce("button","button button--soft","✓ Cociné");
  bCook.type="button";
  bCook.dataset.cookSaved=item.id;
  const bFav=ce("button","button button--soft",item.fav?"⭐ Favorito":"☆ Favorito");
  bFav.type="button";
  bFav.dataset.favSaved=item.id;
  bFav.setAttribute("aria-pressed",String(!!item.fav));
  const bNote=ce("button","button button--soft","Renombrar");
  bNote.type="button";
  bNote.dataset.renameSaved=item.id;
  const bCopy=ce("button","button button--soft","Copiar");
  bCopy.type="button";
  bCopy.dataset.copySaved=item.id;
  const bDel=ce("button","button button--danger","Eliminar");
  bDel.type="button";
  bDel.dataset.delSaved=item.id;
  acts.append(bCook,bFav,bNote,bCopy,bDel);
  card.append(head,ul,meta,tog,acts);
  return card
}
function toggleSavedActions(id){
  if(expandedSaved.has(id))expandedSaved.delete(id);
  else expandedSaved.add(id);
  renderSaved()
}
function sortSaved(arr){
  const s=arr.slice();
  if(savedSort==="az"){
    s.sort((x,y)=>normalizeSearchText((x.note||x.title||"")).localeCompare(normalizeSearchText((y.note||y.title||""))))
  }else if(savedSort==="tipo"){
    const ord={
      desayuno:0,plato:1,snack:2,pre:3
    };
    s.sort((x,y)=>(ord[x.type]??9)-(ord[y.type]??9))
  }else if(savedSort==="cocinado"){
    s.sort((x,y)=>(y.cooked||0)-(x.cooked||0))
  }
  return s
}
// Mis comidas (v14.9.92): una sola biblioteca con los platos guardados y las recetas propias.
// Solo muestra: no cambia ni mezcla datos. Las copias que se crean al asignar una receta al plan
// (guardan nombre e ingredientes por si la receta se borra) se ven en el modo completo.
let savedKind="todo";
function savedRecipeIngredients(r,amounts){
  const a=r.amountsTitle&&Object.prototype.hasOwnProperty.call(amounts,r.amountsTitle)?amounts[r.amountsTitle]:null;
  return a?a.rows.map(x=>String(x.name||"").trim()).filter(Boolean):[]
}
function matchSavedRecipe(r,amounts,q){
  if(!q)return true;
  return normalizeSearchText([r.title,r.sourceTitle||"",r.notes||"",...(r.steps||[]),...(r.tags||[]),...savedRecipeIngredients(r,amounts)].join(" ")).includes(q)
}
function savedRecipeCard(r,amounts,inPlan){
  const card=ce("div","summary__line recipe-lib-card"),names=savedRecipeIngredients(r,amounts),a=r.amountsTitle&&Object.prototype.hasOwnProperty.call(amounts,r.amountsTitle)?amounts[r.amountsTitle]:null;
  card.dataset.recipeId=r.id;
  card.append(ce("strong",null,"📖 "+r.title));
  const ul=ce("ul","recipe-lib-card__lines");
  ul.append(ce("li",null,names.length?"Ingredientes: "+names.join(", "):"Sin ingredientes cargados"));
  card.append(ul);
  const meta=[r.minutes?"⏱ "+r.minutes+" min":"",a&&a.yield?"Rinde "+String(a.yield).replace(".",",")+" porci"+(a.yield===1?"ón":"ones"):"",r.steps.length?r.steps.length+" paso"+(r.steps.length===1?"":"s"):"",inPlan?"📅 En el plan":""].filter(Boolean).join(" · ");
  if(meta)card.append(ce("div","recipe-lib-card__meta",meta));
  const acts=ce("div","recipe-lib-card__actions");
  for(const [text,key] of [["Ver receta","savedRecipeView"],["🍳 Lo cociné","savedRecipeCook"],["Planificar","savedRecipePlan"],["Editar","savedRecipeEdit"]]){
    const b=ce("button","button button--soft",text);
    b.type="button";
    b.dataset[key]=r.id;
    b.setAttribute("aria-label",text+": "+r.title);
    acts.append(b)
  }
  card.append(acts);
  return card
}
function renderSaved(){
  const list=document.getElementById("savedList"),hint=document.getElementById("savedHint");
  if(!list)return;
  const a=loadSaved(),q=normalizeSearchText(savedQuery);
  let store={},storeError="",amounts={};
  try{
    store=loadRecipeDetails()
  }catch(err){
    storeError=err.message
  }
  try{
    amounts=loadRecipeAmounts()
  }catch(err){
  }
  // Si las recetas no se pueden leer, las copias del plan no se tratan como "receta borrada".
  const plates=a.filter(x=>!x.recipeSourceId),copies=a.filter(x=>x.recipeSourceId),orphans=storeError?[]:copies.filter(x=>!Object.prototype.hasOwnProperty.call(store,x.recipeSourceId)),recipes=Object.values(store).sort((x,y)=>x.title.localeCompare(y.title,"es"));
  const plan=loadPlan(),planned=new Set();
  DAYS.forEach(([d])=>SLOTS.forEach(([s])=>{
    const id=plan[d]&&plan[d][s];if(id)planned.add(id)
  }));
  const recipesInPlan=new Set(copies.filter(x=>planned.has(x.id)).map(x=>x.recipeSourceId));
  const platesF=sortSaved(plates.filter(it=>matchSaved(it,q))).sort((x,y)=>(y.fav?1:0)-(x.fav?1:0)),recipesF=recipes.filter(r=>matchSavedRecipe(r,amounts,q)),orphansF=orphans.filter(it=>matchSaved(it,q)),copiesF=copies.filter(it=>!orphans.includes(it)&&matchSaved(it,q));
  document.querySelectorAll("[data-saved-kind]").forEach(b=>{
    const on=b.dataset.savedKind===savedKind;b.classList.toggle("is-selected",on);b.setAttribute("aria-pressed",String(on))
  });
  const nP=plates.length,nR=storeError?copies.length:recipes.length+orphans.length,plural=(n,one,many)=>n+" "+(n===1?one:many);
  if(hint){
    if(!nP&&!nR)hint.textContent="";
    else if(q)hint.textContent="Encontré "+plural(platesF.length,"plato","platos")+" y "+plural(recipesF.length+orphansF.length,"receta","recetas")+".";
    else hint.textContent="Tenés "+plural(nP,"plato","platos")+" y "+plural(nR,"receta","recetas")+" guardados en este dispositivo."
  }
  if(!nP&&!nR&&!copies.length&&!storeError){
    list.replaceChildren(emptyState("🍽️","Todavía no guardaste comidas","Armá un plato y tocá Guardar, o creá una receta en Más → Con lo que tengo.",{
      label:"Armar mi primer plato",key:"start",value:"plato"
    }));
    return
  }
  const nodes=[];
  if(savedKind!=="recetas"){
    nodes.push(ce("h3","saved-section__title","🍽️ Platos ("+(q?platesF.length+" de "+nP:nP)+")"));
    if(platesF.length)nodes.push(...platesF.map(savedCard));
    else nodes.push(ce("p","screen__hint",q?"Ningún plato coincide con tu búsqueda.":"Todavía no guardaste platos. Armá una comida y tocá Guardar."))
  }
  if(savedKind!=="platos"){
    if(storeError){
      const shownCopies=copies.filter(it=>matchSaved(it,q));
      nodes.push(ce("h3","saved-section__title","📖 Recetas"),ce("p","screen__hint",storeError),...shownCopies.map(savedCard));
      list.replaceChildren(...nodes);
      return
    }
    nodes.push(ce("h3","saved-section__title","📖 Recetas ("+(q?recipesF.length+orphansF.length+" de "+nR:nR)+")"));
    nodes.push(...recipesF.map(r=>savedRecipeCard(r,amounts,recipesInPlan.has(r.id))));
    for(const it of orphansF){
      const card=savedCard(it);
      card.insertBefore(ce("p","screen__hint","Copia guardada en el plan: la receta original se borró."),card.children[1]||null);
      nodes.push(card)
    }
    if(!recipesF.length&&!orphansF.length&&!storeError)nodes.push(ce("p","screen__hint",q?"Ninguna receta coincide con tu búsqueda.":"Todavía no tenés recetas. Creá una en Más → Con lo que tengo → Crear receta."));
    if(copiesF.length){
      const box=ce("details","home-group saved-recipes");
      box.setAttribute("data-avanzado","misplatos");
      box.open=savedRecipesOpen;
      box.addEventListener("toggle",()=>{
        savedRecipesOpen=box.open
      });
      box.append(ce("summary",null,"🗂️ Copias de recetas usadas en el plan ("+copiesF.length+")"),ce("p","screen__hint","Se crean al asignar una receta al plan y guardan su nombre e ingredientes por si la receta se borra. La receta se edita en Más → Con lo que tengo."),...copiesF.map(savedCard));
      nodes.push(box)
    }
  }
  list.replaceChildren(...nodes)
}
// Acciones de la biblioteca: filtro y botones de las recetas.
document.addEventListener("click",e=>{
  const b=e.target.closest("button");
  if(!b)return;
  if(b.dataset.savedKind){
    savedKind=b.dataset.savedKind;
    renderSaved();
    return
  }
  const view=b.dataset.savedRecipeView,edit=b.dataset.savedRecipeEdit,plan=b.dataset.savedRecipePlan;
  try{
    if(view){
      go("ingredientes");
      showRecipeView("browse");
      recipeReadReturnTo="misplatos";
      showRecipeRead(view)
    }else if(edit){
      go("ingredientes");
      recipeDetailsEditing=edit;
      renderRecipeDetails();
      showRecipeView("editor")
    }else if(plan)planSavedRecipe(plan)
  }catch(err){
    savedStatus(err.message)
  }
});
// "Planificar": abre la Semana con la receta elegida en "Consultar mis recetas mientras planifico".
function planSavedRecipe(id){
  openTab("semana");
  document.getElementById("currentPlanPanel").open=true;
  document.getElementById("planRecipeSearch").value="";
  const ref=document.getElementById("planRecipeReference");
  ref.open=true;
  setTimeout(()=>{
    const select=document.getElementById("planRecipeSelect");
    renderPlanRecipeReference();
    if(![...select.options].some(o=>o.value===id)){
      document.getElementById("planRecipeApplyAvoid").checked=false;
      renderPlanRecipeReference()
    }
    select.value=id;
    renderPlanRecipePreview();
    document.getElementById("planRecipeDay").value=todayPlanDay();
    document.getElementById("planRecipeSlot").value="almuerzo";
    document.getElementById("planRecipeAssignStatus").textContent="Elegí el día y la comida, y tocá Asignar receta al plan actual.";
    ref.scrollIntoView({
      block:"start",behavior:"smooth"
    })
  },80)
}
function exportPlates(){
  const a=loadSaved();
  if(!a.length){
    savedStatus("No hay platos para exportar.");
    return
  }
  try{
    const blob=new Blob([JSON.stringify(a,null,2)],{
      type:"application/json"
    });
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;
    link.download="mis-platos.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    savedStatus("Exportado: mis-platos.json")
  }catch(e){
    savedStatus("No se pudo exportar en este navegador.")
  }
}
const IMPORT_PLATE_TYPES=["desayuno","plato","snack","pre"];
function importHasForbiddenKeys(v){
  if(!v||typeof v!=="object")return false;
  return Object.keys(v).some(k=>["__proto__","constructor","prototype"].includes(k)||importHasForbiddenKeys(v[k]))
}
function importedPlateType(it){
  if(IMPORT_PLATE_TYPES.includes(it.type))return it.type;
  if(it.type!==undefined)return null;
  const head=String(typeof it.title==="string"?it.title:(it.text.split(NL)[1]||"")).trim();
  if(head==="Desayuno / Merienda")return "desayuno";
  if(head.indexOf("Almuerzo / Cena")===0)return "plato";
  if(head==="Snack")return "snack";
  if(head==="Pre-entreno")return "pre";
  return null
}
function validImportedState(st){
  if(st===null)return true;
  if(typeof st!=="object"||Array.isArray(st))return false;
  const named=o=>!!o&&typeof o==="object"&&!Array.isArray(o)&&typeof o.name==="string"&&o.name.length<=300;
  return ["verduras","almidones","proteinas","legCarb","legProt"].every(k=>st[k]===undefined||Array.isArray(st[k])&&st[k].length<=200&&st[k].every(named))&&["fruta","bfprot","bfcarb","grasa","snack","pre"].every(k=>st[k]===undefined||st[k]===null||named(st[k]))
}
function normalizeImportedPlate(it,usedIds){
  if(!it||typeof it!=="object"||Array.isArray(it)||importHasForbiddenKeys(it))return null;
  if(typeof it.text!=="string"||!it.text.trim()||it.text.length>20000)return null;
  const type=importedPlateType(it);
  if(!type)return null;
  const lines=it.lines===undefined?it.text.split(NL).slice(2).map(x=>x.replace(/^•\s*/,"")).filter(Boolean):it.lines;
  if(!Array.isArray(lines)||lines.length>200||lines.some(x=>typeof x!=="string"||x.length>2000))return null;
  const optional=(v,max)=>v===undefined||v===null||typeof v==="string"&&v.length<=max;
  if(!optional(it.title,500)||!optional(it.note,1000)||!optional(it.sig,20000)||!optional(it.savedAt,100)||!optional(it.recipeSourceId,200))return null;
  if(it.fav!==undefined&&typeof it.fav!=="boolean")return null;
  if(it.cooked!==undefined&&!(Number.isInteger(it.cooked)&&it.cooked>=0&&it.cooked<=100000))return null;
  if(it.recipeIngredients!==undefined&&!(Array.isArray(it.recipeIngredients)&&it.recipeIngredients.length<=200&&it.recipeIngredients.every(x=>typeof x==="string"&&x.length<=100)))return null;
  if(it.state!==undefined&&!validImportedState(it.state))return null;
  let id=typeof it.id==="string"&&/^[A-Za-z0-9_.:-]{1,120}$/.test(it.id)?it.id:null;
  if(!id||usedIds.has(id)){
    do{
      id=Date.now()+"_"+Math.random().toString(36).slice(2,9)
    }while(usedIds.has(id))
  }
  usedIds.add(id);
  const out=JSON.parse(JSON.stringify(it));
  out.id=id;
  out.type=type;
  out.lines=lines.slice();
  return out
}
function importPlatesFile(file){
  if(file.size>10000000){
    savedStatus("El archivo supera el límite de 10 MB. No se importó nada.");
    return
  }
  const r=new FileReader();
  r.onload=()=>{
    let arr;
    try{
      arr=JSON.parse(r.result)
    }catch(e){
      savedStatus("Archivo inválido. Debe ser un JSON exportado por la app.");
      return
    }
    if(!Array.isArray(arr)||arr.length>5000){
      savedStatus("Archivo inválido. Debe ser un JSON exportado por la app.");
      return
    }
    const cur=loadSaved();
    const seen=new Set(cur.map(x=>x.sig||x.text));
    const usedIds=new Set(cur.map(x=>x&&x.id).filter(x=>typeof x==="string"));
    let added=0,existing=0,invalid=0;
    for(const raw of arr){
      const it=normalizeImportedPlate(raw,usedIds);
      if(!it){
        invalid++;
        continue
      }
      const key=it.sig||it.text;
      if(seen.has(key)){
        existing++;
        continue
      }
      seen.add(key);
      cur.push(it);
      added++
    }
    if(added&&!persistSaved(cur)){
      savedStatus("No se pudo guardar la importación (espacio insuficiente). Tus platos no se modificaron.");
      return
    }
    renderSaved();
    const parts=["Importados "+added+" plato"+(added===1?"":"s")+" nuevo"+(added===1?"":"s")+"."];
    if(existing)parts.push(existing+" ya estaba"+(existing===1?"":"n")+" guardado"+(existing===1?"":"s")+".");
    if(invalid)parts.push(invalid+" omitido"+(invalid===1?"":"s")+" por formato inválido.");
    savedStatus(parts.join(" "))
  };
  r.onerror=()=>savedStatus("No se pudo leer el archivo.");
  r.readAsText(file)
}
