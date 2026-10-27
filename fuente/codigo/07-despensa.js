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
function clearPantry(){
  if(!pantrySel.length)return;
  pantrySel=[];
  persistPantry();
  document.querySelectorAll('[data-pantry-toggle]').forEach(b=>{
    b.classList.remove("is-selected");b.setAttribute("aria-pressed","false")
  });
  renderPantryResults()
}
const PANTRY_ALIASES={
  pollo:["pollo"],carne:["carne"],pescado:["pescado","atun","merluza","salmon","sardina","caballa"],huevo:["huevo","huevos"],queso:["queso","quesos"],yogur:["yogur"],lentejas:["lenteja","lentejas"],garbanzos:["garbanzo","garbanzos"],porotos:["poroto","porotos"],arvejas:["arveja","arvejas"],arroz:["arroz"],fideos:["fideo","fideos","pasta","pastas"],papa:["papa","papas"],batata:["batata","batatas"],pan:["pan"],maiz:["maiz"],quinoa:["quinoa"],tomate:["tomate","tomates"],hojas:["lechuga","rucula","espinaca","hojas verdes"],zanahoria:["zanahoria","zanahorias"],calabaza:["calabaza","zapallo"],brocoli:["brocoli"],palta:["palta"],zapallito:["zapallito","zapallitos"]
};
function pantryMarkedMatcher(){
  const names=new Set();
  for(const id of new Set(loadPantry()))for(const alias of PANTRY_ALIASES[id]||[])names.add(ingredientKey(alias));
  return {
    has:name=>names.has(ingredientKey(name)),size:names.size
  }
}
function pantryMatches(){
  const aliases=PANTRY_ALIASES;
  const sel=Array.from(new Set(pantrySel)).map(pantryById).filter(Boolean);
  if(!sel.length)return [];
  const words=value=>" "+normalizeSearchText(value).replace(/[^a-z0-9]+/g," ").trim()+" ";
  return data.menuCatalog.map(rec=>{
    const text=words(rec.text);const matched=sel.filter(p=>(aliases[p[0]]||[]).some(k=>text.includes(words(k))));return {
      rec,n:matched.length,matched:matched.map(p=>p[1])
    }
  }).filter(x=>x.n>0).sort((a,b)=>b.n-a.n||a.rec.text.localeCompare(b.rec.text))
}
function renderPantry(){
  const box=document.getElementById("pantryChips");
  if(box){
    box.replaceChildren(...PANTRY.map(p=>{
      const on=pantrySel.indexOf(p[0])>=0;const b=ce("button","filter-chip pantry-chip"+(on?" is-selected":""));b.type="button";b.dataset.pantryToggle=p[0];b.setAttribute("aria-pressed",String(on));b.textContent=p[1];return b
    }))
  }
  renderPantryResults()
}
function renderPantryResults(){
  const cont=document.getElementById("pantryResults"),hint=document.getElementById("pantryHint");
  if(!cont)return;
  if(!pantrySel.length){
    if(hint)hint.textContent="Marcá lo que tenés en casa para encontrar ideas con ingredientes en común.";
    cont.replaceChildren(emptyState("🧊","Elegí tus ingredientes","Las sugerencias muestran coincidencias, no disponibilidad completa de una receta."));
    return
  }
  const res=pantryMatches();
  if(hint)hint.textContent="Seleccionaste "+pantrySel.length+" ingrediente"+(pantrySel.length===1?"":"s")+". Revisá el resto de los ingredientes antes de cocinar: no se verifican cantidades ni disponibilidad completa.";
  if(!res.length){
    cont.replaceChildren(emptyState("🤔","Sin coincidencias","No encontré ingredientes seleccionados mencionados en los títulos del menú. Probá con otra selección."));
    return
  }
  const ul=ce("ul","menu-list");
  res.forEach(r=>{
    const li=ce("li",null,r.rec.text);const wrap=ce("div","menu-item-tags");wrap.append(ce("span","tag-chip pantry-badge",r.n+" ingrediente"+(r.n===1?"":"s")+" en común"));wrap.append(ce("span","tag-chip","Coinciden: "+r.matched.join(", ")));li.append(wrap);ul.append(li)
  });
  cont.replaceChildren(ul)
}
