// Mi Plato Fácil · Despensa: ingredientes marcados como disponibles.
// Parte 8: los archivos se unen en orden según su número, que define el orden de arranque.
function loadPantry(){
  try{
    const raw=localStorage.getItem(PANKEY);
    const a=raw?JSON.parse(raw):[];
    return Array.isArray(a)?a.filter(x=>typeof x==="string"):[]
  }catch(e){
    return []
  }
}
function persistPantry(){
  try{
    localStorage.setItem(PANKEY,JSON.stringify(pantrySel));
    return true
  }catch(e){
    return false
  }
}
function pantryById(id){
  return PANTRY.find(p=>p[0]===id)
}
function togglePantry(id,btn){
  const i=pantrySel.indexOf(id);
  if(i>=0){
    pantrySel.splice(i,1);
    btn.classList.remove("is-selected");
    btn.setAttribute("aria-pressed","false")
  }else{
    pantrySel.push(id);
    btn.classList.add("is-selected");
    btn.setAttribute("aria-pressed","true")
  }
  persistPantry();
  renderPantryResults()
}
// Limpia las marcas de "Lo básico". Los ingredientes agregados a mano se quitan desde su propia lista.
function clearPantry(){
  if(!pantrySel.some(x=>pantryById(x)))return;
  pantrySel=pantrySel.filter(x=>!pantryById(x));
  persistPantry();
  document.querySelectorAll('[data-pantry-toggle]').forEach(b=>{
    b.classList.remove("is-selected");b.setAttribute("aria-pressed","false")
  });
  renderPantryResults()
}
const PANTRY_ALIASES={
  pollo:["pollo"],carne:["carne"],pescado:["pescado","atun","merluza","salmon","sardina","caballa"],huevo:["huevo","huevos"],queso:["queso","quesos"],yogur:["yogur"],lentejas:["lenteja","lentejas"],garbanzos:["garbanzo","garbanzos"],porotos:["poroto","porotos"],arvejas:["arveja","arvejas"],arroz:["arroz"],fideos:["fideo","fideos","pasta","pastas"],papa:["papa","papas"],batata:["batata","batatas"],pan:["pan"],maiz:["maiz"],quinoa:["quinoa"],tomate:["tomate","tomates"],hojas:["lechuga","rucula","espinaca","hojas verdes"],zanahoria:["zanahoria","zanahorias"],calabaza:["calabaza","zapallo"],brocoli:["brocoli"],palta:["palta"],zapallito:["zapallito","zapallitos"]
};
// Marcas sin cantidad: las de "Lo básico" (por sus nombres equivalentes) y las agregadas a mano (por su nombre).
function pantryMarkedMatcher(){
  const names=new Set();
  for(const id of new Set(loadPantry())){
    if(pantryById(id)){
      for(const alias of PANTRY_ALIASES[id]||[])names.add(ingredientKey(alias))
    }else{
      const k=ingredientKey(id);
      if(k)names.add(k)
    }
  }
  return {
    has:name=>names.has(ingredientKey(name)),size:names.size
  }
}
// Ideas del menú que usan lo que tenés. Con solo marcas de "Lo básico" el resultado es el mismo que desde v14.9.74;
// los ingredientes agregados a mano y las existencias con cantidad se suman con su propio nombre.
function pantryMatches(){
  const aliases=PANTRY_ALIASES;
  const sel=Array.from(new Set(pantrySel)).map(pantryById).filter(Boolean);
  const seen=new Set(sel.flatMap(p=>(aliases[p[0]]||[]).map(ingredientKey))),extra=[];
  const addExtra=name=>{
    const k=ingredientKey(name);if(k&&!seen.has(k)){
      seen.add(k);extra.push([null,String(name).trim(),[String(name)]])
    }
  };
  pantrySel.filter(x=>typeof x==="string"&&!pantryById(x)).forEach(addExtra);
  Object.values(loadStockQuantities()).forEach(s=>{
    if(s.quantity>0)addExtra(s.name)
  });
  const all=sel.concat(extra);
  if(!all.length)return [];
  const words=value=>" "+normalizeSearchText(value).replace(/[^a-z0-9]+/g," ").trim()+" ";
  return data.menuCatalog.map(rec=>{
    const text=words(rec.text);const matched=all.filter(p=>(p[0]?aliases[p[0]]||[]:p[2]).some(k=>text.includes(words(k))));return {
      rec,n:matched.length,matched:matched.map(p=>p[1])
    }
  }).filter(x=>x.n>0).sort((a,b)=>b.n-a.n||a.rec.text.localeCompare(b.rec.text))
}
// Cuántas cosas hay en la despensa: marcas y existencias con cantidad (sin repetir el mismo ingrediente).
function pantryHaveCount(){
  const chipKeys=new Set(),keys=new Set();
  for(const x of new Set(pantrySel)){
    if(pantryById(x)){
      keys.add("chip:"+x);
      for(const a of PANTRY_ALIASES[x]||[])chipKeys.add(ingredientKey(a))
    }else{
      const k=ingredientKey(x);if(k)keys.add(k)
    }
  }
  for(const s of Object.values(loadStockQuantities())){
    const k=ingredientKey(s.name);if(s.quantity>0&&k&&!chipKeys.has(k))keys.add(k)
  }
  return keys.size
}
let pantryResultsAll=false;
function renderPantry(){
  const box=document.getElementById("pantryChips");
  if(box){
    box.replaceChildren(...PANTRY.map(p=>{
      const on=pantrySel.indexOf(p[0])>=0;const b=ce("button","filter-chip pantry-chip"+(on?" is-selected":""));b.type="button";b.dataset.pantryToggle=p[0];b.setAttribute("aria-pressed",String(on));b.textContent=p[1];return b
    }))
  }
  // La lista de "Otros ingredientes y cantidades" (33-despensa-unica.js) está lista recién al final del arranque.
  if(pantryItemsReady)renderPantryItems();
  renderPantryResults()
}
function renderPantryResults(){
  const cont=document.getElementById("pantryResults"),hint=document.getElementById("pantryHint");
  if(!cont)return;
  const have=pantryHaveCount();
  if(!have){
    if(hint)hint.textContent="Marcá lo que tenés y te muestro qué cocinar.";
    cont.replaceChildren(emptyState("🧊","Elegí tus ingredientes","Te muestro ideas que los usan."));
    return
  }
  const res=pantryMatches();
  if(hint)hint.textContent="Tenés "+have+" ingrediente"+(have===1?"":"s")+" en la despensa. Tocá una idea para verla.";
  if(!res.length){
    cont.replaceChildren(emptyState("🤔","Sin coincidencias","No encontré ingredientes seleccionados mencionados en los títulos del menú. Probá con otra selección."));
    return
  }
  const ul=ce("ul","menu-list");
  (pantryResultsAll?res:res.slice(0,8)).forEach(r=>{
    const li=ce("li");li.append(ideaBoton(r.rec));const wrap=ce("div","menu-item-tags");wrap.append(ce("span","tag-chip pantry-badge","Usa: "+r.matched.join(", ")));li.append(wrap);ul.append(li)
  });
  const nodes=[ul];
  if(res.length>8){
    const more=ce("button","button button--soft",pantryResultsAll?"Ver menos ideas":"Ver todas las ideas ("+res.length+")");
    more.type="button";
    more.dataset.pantryResultsToggle="";
    nodes.push(more)
  }
  cont.replaceChildren(...nodes)
}
