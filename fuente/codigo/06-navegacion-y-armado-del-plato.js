// Mi Plato Fácil · Arranque, navegación entre pantallas y armado del plato.
// Parte 7: los archivos se unen en orden según su número, que define el orden de arranque.
function init(){
  renderTrainingWeek();
  renderTrainingExceptions();
  renderChoice("fruit",data.frutas,"fruta","bf_prot");
  renderFrutaFormas();
  renderChoice("bfprot",data.bfprot,"bfprot","bf_carb");
  renderChoice("bfcarb",data.bfcarb,"bfcarb","bf_fat");
  renderChoice("bffat",data.bffat,"grasa","resumen");
  renderChoice("snacks",data.snacks,"snack","resumen");
  renderMulti("boxv",data.verduras,"verduras");
  renderAlmidones();
  renderProteins();
  renderMulti("boxLegCarb",data.legumbres,"legCarb");
  renderMulti("boxLegProt",data.legumbres,"legProt");
  liList(el.preIdeaList,data.preIdeas);
  liList(el.preComboList,data.preCombos);
  renderMenuIdeas();
  methodCards(el.cookingMethods,data.cookingMethods);
  renderSnackIdeas();
  liList(el.advicePreIdeas,data.preIdeas);
  liList(el.advicePreCombos,data.preCombos);
  pantrySel=loadPantry();
  renderPantry();
  // Listas largas del armado (más de 12 opciones): grilla de chips con buscador.
  for(const [id,etiqueta] of [["fruit","Buscar fruta"],["boxv","Buscar verdura"],["boxa","Buscar almidón"],["boxp","Buscar proteína"],["boxLegCarb","Buscar legumbre"],["boxLegProt","Buscar legumbre"],["bfprot","Buscar proteína"],["bfcarb","Buscar cereal"],["bffat","Buscar grasa"],["snacks","Buscar snack"]]){
    const box=document.getElementById(id);
    if(box&&box.querySelectorAll(".choice").length>12)conBuscador(box,etiqueta)
  }
}
function conBuscador(box,etiqueta){
  if(box.dataset.buscador)return;
  box.dataset.buscador="1";
  box.classList.add("grid--chips");
  const input=ce("input");
  input.type="search";
  input.id=box.id+"Buscar";
  input.className="opciones-buscador";
  input.placeholder=etiqueta;
  input.autocomplete="off";
  input.setAttribute("aria-label",etiqueta);
  input.dataset.filtra=box.id;
  input.addEventListener("input",()=>filtrarOpciones(box,input.value));
  box.before(input)
}
// Lo elegido sigue a la vista aunque no coincida con lo que se busca.
function filtrarOpciones(box,q){
  const n=normalizeSearchText(String(q||"").trim());
  box.querySelectorAll(".choice").forEach(c=>{
    c.hidden=!!n&&!c.classList.contains("is-selected")&&!normalizeSearchText(c.textContent+" "+(c.dataset.name||"")).includes(n)
  });
  box.querySelectorAll(".home-section-label").forEach(l=>{
    l.hidden=!!n
  });
  box.querySelectorAll("details").forEach(d=>{
    if(n&&d.querySelector(".choice:not([hidden])"))d.open=true
  })
}
function limpiarBuscadores(){
  document.querySelectorAll("[data-filtra]").forEach(i=>{
    i.value="";const box=document.getElementById(i.dataset.filtra);if(box)filtrarOpciones(box,"")
  })
}
// Pasos del armado: solo en ellos se ve la barra "Volver al paso anterior".
const ARMADO_PASOS=["bf_fruit","bf_prot","bf_carb","bf_fat","day","plate_static","lunch_veg","lunch_carb","lunch_prot","snack","pre"];
// Paso Frutas (desde la v15): qué fruta y, arriba, la forma de comerla (Entera por defecto).
function renderFrutaFormas(){
  const box=document.getElementById("fruitForms");
  if(!box)return;
  box.replaceChildren(...data.frutaFormas.map(f=>{
    const b=ce("button","filter-chip"+(f===frutaForma?" is-selected":""),f);b.type="button";b.dataset.frutaForma=f;b.setAttribute("aria-pressed",String(f===frutaForma));return b
  }))
}
function setFrutaForma(f){
  if(!data.frutaFormas.includes(f))return;
  frutaForma=f;
  renderFrutaFormas()
}
// Almidones: harinas, féculas y pan rallado quedan en "Más opciones" (plegado).
function renderAlmidones(){
  const box=document.getElementById("boxa"),mas=data.almidonesMas,det=ce("details","home-group almidones-mas");
  det.append(ce("summary",null,"Más opciones: harinas, féculas y pan rallado"),...mas.map(label=>choice({
    label,key:"almidones",multi:true
  })));
  box.replaceChildren(...data.almidones.filter(x=>!mas.includes(x)).map(label=>choice({
    label,key:"almidones",multi:true
  })),det)
}
// Almuerzo o cena: si la rutina sabe si ese día se entrena, no se pregunta y se arranca en Verduras.
// dayKey: el día del plan cuando el armado empieza desde un hueco de la Semana (usa la rutina de ese día).
// slot: la comida del hueco desde el que se arma (Selector de comida); al guardar, se asigna ahí y se vuelve a la Semana.
var armadoDestino=null;
function start(type,dayKey,slot){
  lastRandomType=null;
  armadoDestino=slot&&dayKey&&SLOTS.some(s=>s[0]===slot)&&DAYS.some(d=>d[0]===dayKey)?{
    dia:dayKey,slot,tab:activeTab
  }:null;
  limpiarBuscadores();
  state.type=type;
  armadoFecha=dayKey&&DAYS.some(d=>d[0]===dayKey)?fechaDelDiaDelPlan(dayKey):null;
  if(type==="plato"){
    const dia=diaDeRutina(armadoFecha||new Date());
    if(dia){
      state.day=dia;
      state.customPortions=null;
      closePortionEditor();
      updatePlate();
      go("lunch_veg");
      return
    }
  }
  go({
    desayuno:"bf_fruit",plato:"day",snack:"snack",pre:"pre"
  }[type])
}
function go(id){
  document.querySelectorAll(".screen").forEach(s=>{
    s.classList.remove("is-active");s.setAttribute("aria-hidden","true")
  });
  const n=document.getElementById(id);
  n.classList.add("is-active");
  n.removeAttribute("aria-hidden");
  if(stack.at(-1)!==id)stack.push(id);
  nav();
  if(id==="resumen")summary();
  if(id==="misplatos")renderSaved();
  if(id==="plan")renderPlan();
  if(id==="compras")renderCompras();
  if(id==="ingredientes")renderPantry();
  if(id==="ideas")renderContextAdvice();
  if(id==="bf_fruit"){
    if(state.fruta&&state.fruta.forma&&data.frutaFormas.includes(state.fruta.forma))frutaForma=state.fruta.forma;
    renderFrutaFormas()
  }
  window.scrollTo({
    top:0,behavior:"smooth"
  })
}
function nextFor(id){
  return {
    lunch_veg:"lunch_carb",lunch_carb:"lunch_prot",lunch_prot:"resumen"
  }
  [id]||""
}
// Pestañas de la barra inferior y la pantalla de inicio de cada una. La barra está en 32-pestanas.js.
const TABS={
  hoy:{root:"home",label:"Hoy"},semana:{root:"plan",label:"Semana"},compras:{root:"compras",label:"Compras"},miscomidas:{root:"misplatos",label:"Comidas"},mas:{root:"home",label:"Más"}
};
let activeTab="hoy";
function activeTabRoot(){
  return TABS[activeTab].root
}
// En Comidas, Ideas es la otra mitad del segmento "Mis comidas | Ideas": no muestra "← Comidas".
function esRaizDePestana(cur){
  return cur===activeTabRoot()||(activeTab==="miscomidas"&&cur==="ideas")
}
function nav(){
  const cur=stack.at(-1),home=cur==="home",sum=cur==="resumen",next=nextFor(cur);
  const bottomVisible=ARMADO_PASOS.includes(cur);
  el.bottom.classList.toggle("is-visible",bottomVisible);
  // Arriba: vuelve al inicio de la pestaña actual; no se muestra si ya estás ahí.
  el.homeTop.classList.toggle("is-visible",!esRaizDePestana(cur));
  el.homeTop.textContent="← "+TABS[activeTab].label;
  el.homeTop.setAttribute("aria-label","Volver al inicio de "+TABS[activeTab].label);
  document.getElementById("themeToggle").classList.toggle("is-hidden",!home);
  el.nextBottom.classList.toggle("is-hidden",!next);
  el.bottomInner.classList.toggle("has-next",!!next);
  if(next)el.nextBottom.dataset.go=next;
  else delete el.nextBottom.dataset.go;
}
let canVibrate=typeof navigator!=="undefined"&&typeof navigator.vibrate==="function";
function haptic(){
  if(!canVibrate)return;
  try{
    if(navigator.vibrate(20)===false)canVibrate=false
  }catch(e){
    canVibrate=false
  }
}
function tapStart(b,e){
  pStart={
    x:e.clientX,y:e.clientY
  };
  pMoved=false
}
function tapMove(e){
  if(!pStart)return;
  if(Math.hypot(e.clientX-pStart.x,e.clientY-pStart.y)>10)pMoved=true
}
function pickAnim(b,k,n,q,next){
  document.querySelectorAll(".choice").forEach(c=>c.classList.remove("is-selected"));
  b.classList.add("is-selected");
  setTimeout(()=>pick(k,n,q,next),60)
}
function pick(k,n,q,next){
  state[k]={
    name:n,quantity:q
  };
  if(k==="fruta")state.fruta.forma=frutaForma;
  state.nombreSugerido="";
  if(editReturn){
    editReturn=false;
    go("resumen");
    return
  }
  go(next)
}
function toggleMulti(b,k,n){
  state.nombreSugerido="";
  const arr=state[k];
  const i=arr.findIndex(x=>x.name===n);
  if(i>=0){
    arr.splice(i,1);
    b.classList.remove("is-selected");
    b.setAttribute("aria-pressed","false")
  }else{
    arr.push({
      name:n
    });
    b.classList.add("is-selected");
    b.setAttribute("aria-pressed","true")
  }
}
function basePortions(){
  return state.day==="Día de entrenamiento"?{
    vegetables:"1/3",carbs:"1/3",protein:"1/3"
  }:{
    vegetables:"1/2",carbs:"1/4",protein:"1/4"
  }
}
function portions(){
  return state.customPortions||basePortions()
}
function setDay(d){
  state.day=d;
  state.customPortions=null;
  closePortionEditor();
  updatePlate();
  go("plate_static")
}
function toggleDay(){
  state.day=state.day==="Día de entrenamiento"?"Día libre":"Día de entrenamiento";
  state.customPortions=null;
  closePortionEditor();
  updatePlate();
  go("plate_static")
}
// Chip "Día de entrenamiento · cambiar" de los pasos del almuerzo o cena: cambia el día sin salir del paso.
function cambiarDiaDelArmado(){
  state.day=state.day==="Día de entrenamiento"?"Día libre":"Día de entrenamiento";
  state.customPortions=null;
  closePortionEditor();
  updatePlate()
}
function syncPortionEditor(){
  const p=portions();
  el.portionVeg.value=p.vegetables;
  el.portionCarb.value=p.carbs;
  el.portionProt.value=p.protein;
  el.portionError.classList.remove("is-visible")
}
function closePortionEditor(){
  el.portionEditor.classList.remove("is-visible");
  el.portionError.classList.remove("is-visible")
}
function updatePlate(){
  const p=portions();
  el.plateTitle.textContent=state.day;
  el.vegHint.textContent=`${p.vegetables} del plato. Podés elegir varias.`;
  el.carbHint.textContent=`${p.carbs} del plato. Podés elegir varios, también legumbres.`;
  el.protHint.textContent=`${p.protein} del plato. Podés elegir varias, también legumbres.`;
  document.querySelectorAll("[data-day-chip]").forEach(c=>{
    c.hidden=!state.day;c.textContent=(state.day||"")+" · cambiar";c.setAttribute("aria-label",(state.day||"")+". Tocá para cambiar el tipo de día")
  });
  syncPortionEditor();
  renderPlate()
}
function frac(v){
  return v==="1/2"?1/2:v==="1/3"?1/3:v==="1/4"?1/4:0
}
function savePortions(){
  const v=el.portionVeg.value,c=el.portionCarb.value,p=el.portionProt.value,total=frac(v)+frac(c)+frac(p);
  if(Math.abs(total-1)>0.0001){
    el.portionError.classList.add("is-visible");
    return
  }
  state.customPortions={
    vegetables:v,carbs:c,protein:p
  };
  closePortionEditor();
  updatePlate();
  if(portionEditReturn){
    portionEditReturn=false;
    go("resumen")
  }
}
function slice(type,name,amount,half=false){
  const s=ce("article",`plate__slice plate__slice--${type}${half?" plate__slice--half":""}`);
  s.append(ce("span","plate__name",name),ce("span","plate__amount",amount),ce("span","plate__caption","del plato"));
  return s
}
function renderPlate(){
  const p=portions(),free=state.day==="Día libre"&&!state.customPortions,w=ce("div","plate");
  w.append(slice("vegetables","Verduras",p.vegetables,free),slice("carbs","Almidones",p.carbs),slice("protein","Proteínas",p.protein));
  el.plateViz.replaceChildren(w)
}
function setReplace(which,value){
  if(which==="carb"){
    state.replaceCarb=value;
    toggle(el.carbNormal,!value);
    toggle(el.carbLeg,value);
    el.boxa.classList.toggle("is-hidden",value);
    el.boxLegCarb.classList.toggle("is-hidden",!value)
  }else{
    state.replaceProt=value;
    toggle(el.protNormal,!value);
    toggle(el.protLeg,value);
    el.boxp.classList.toggle("is-hidden",value);
    el.boxLegProt.classList.toggle("is-hidden",!value)
  }
}
function toggle(b,s){
  b.classList.toggle("is-selected",s);
  b.setAttribute("aria-pressed",String(s))
}
function fmt(o){
  return o?`${opcionVisible(o.name)}${o.quantity?` <span class="quantity">${cantidadVisible(o.quantity)}</span>`:""}`:"No elegido"
}
function fmtList(a){
  return a&&a.length?`<span class="selection-list">${a.map(x=>`<span class="selection-chip">${x.name}</span>`).join("")}</span>`:"No elegido"
}
function edit(t){
  editReturn=true;
  go(t)
}
function editLine(label,value,target,icon){
  return `<div class="summary__line"><div class="summary__edit-row"><div>${icon} <strong>${label}:</strong><br>${value}</div><button class="edit-button" type="button" data-edit="${target}">Cambiar</button></div></div>`
}
function merged(a,b){
  return [...a,...b]
}
function groupLabel(base,leg,baseArr,legArr){
  return baseArr.length&&legArr.length?`${base} + legumbres`:legArr.length&&!baseArr.length?leg:base
}
function summary(){
  let h="";
  if(state.type==="desayuno")h=`<div class="summary__line"><strong>${nombreDesdeEstado(state,"desayuno")||"Desayuno / Merienda"}</strong></div>${editLine("Fruta",state.fruta?fmt({name:frutaTexto(state.fruta),quantity:state.fruta.quantity}):fmt(null),"bf_fruit","🍓")}${editLine("Proteína",fmt(state.bfprot),"bf_prot","🥛")}${editLine("Cereal",fmt(state.bfcarb),"bf_carb","🌾")}${editLine("Grasa opcional",fmt(state.grasa),"bf_fat","🥑")}`;
  else if(state.type==="plato"){
    const p=portions(),other=state.day==="Día de entrenamiento"?"Día libre":"Día de entrenamiento",carbArr=merged(state.almidones,state.legCarb),protArr=merged(state.proteinas,state.legProt),carb=groupLabel("Almidones","Legumbres como almidón",state.almidones,state.legCarb),prot=groupLabel("Proteínas","Legumbres como proteína",state.proteinas,state.legProt);
    const platoMissing=[],platoPresent=[];
    if(state.verduras.length)platoPresent.push("verduras");
    else platoMissing.push("verduras");
    if(carbArr.length)platoPresent.push("almidones/legumbres");
    else platoMissing.push("almidones/legumbres");
    if(protArr.length)platoPresent.push("proteínas/legumbres");
    else platoMissing.push("proteínas/legumbres");
    const joinY=a=>a.length===1?a[0]:a.slice(0,-1).join(", ")+" y "+a[a.length-1];
    const platoRedis=platoPresent.length?` Si querés mantener el plato completo, podés editar las proporciones para redistribuir ese espacio ${platoPresent.length===1?"en "+platoPresent[0]:"entre "+joinY(platoPresent)}.`:" Si querés, podés editar las proporciones antes de finalizar.";
    const platoWarn=platoMissing.length?`<article class="notice">No seleccionaste ${joinY(platoMissing)}.${platoRedis}<div class="divider"></div><button class="button button--soft" type="button" data-edit-portions-summary>Editar proporciones</button></article>`:"";
    h=`<div class="summary__line"><strong>${nombreDesdeEstado(state,"plato")||"Almuerzo / Cena"} · ${state.day}</strong></div>${editLine(`Verduras · ${p.vegetables} del plato`,fmtList(state.verduras),"lunch_veg","🥗")}${editLine(`${carb} · ${p.carbs} del plato`,fmtList(carbArr),"lunch_carb","🍚")}${editLine(`${prot} · ${p.protein} del plato`,fmtList(protArr),"lunch_prot","🔵")}${platoWarn}<div class="divider"></div><div class="summary-actions"><button class="button button--soft" type="button" data-toggle-day>Cambiar a ${other}</button><button class="button button--soft" type="button" data-edit-portions-summary>Editar proporciones</button></div>`
  }else if(state.type==="snack")h=`<div class="summary__line"><strong>Snack</strong></div>${editLine("Opción",fmt(state.snack),"snack","🥜")}`;
  else h=`<div class="summary__line"><strong>Pre-entreno</strong></div><div class="summary__line">${fmt(state.pre)}</div>`;
  if(lastRandomType){
    h+=`<div class="divider"></div><button class="button button--soft" type="button" data-regen-random>🎲 Generar otra sugerencia</button>`
  }
  el.summary.innerHTML=h;
  nav()
}
function back(){
  if(stack.length<=1)return;
  stack.pop();
  const prev=stack.pop();
  editReturn=false;
  portionEditReturn=false;
  go(prev)
}
function resetAdviceTemporaryState(){
  const input=document.getElementById("menuSearchInput"),results=document.getElementById("menuSearchResults"),list=document.getElementById("menuSearchList");
  if(input)input.value="";
  if(results)results.classList.remove("is-visible");
  if(list)list.replaceChildren();
  ["suggestMenu","suggestSnack","suggestPre"].forEach(id=>{
    const box=document.getElementById(id);if(box)box.classList.remove("is-visible")
  })
}
// Deja el armado vacío (sin tocar pestañas ni pantallas).
function limpiarArmado(){
  Object.assign(state,{
    type:"",day:"",fruta:null,bfprot:null,bfcarb:null,grasa:null,pre:null,snack:null,verduras:[],almidones:[],proteinas:[],legCarb:[],legProt:[],replaceCarb:false,replaceProt:false,customPortions:null,nombreSugerido:""
  });
  frutaForma="Entera";
  armadoFecha=null;
  renderFrutaFormas();
  editReturn=false;
  portionEditReturn=false;
  lastRandomType=null;
  document.querySelectorAll(".choice.is-selected,.toggle-button.is-selected").forEach(e=>e.classList.remove("is-selected"));
  document.querySelectorAll('.choice[aria-pressed="true"]').forEach(e=>e.setAttribute("aria-pressed","false"));
  setReplace("carb",false);
  setReplace("prot",false);
  closePortionEditor();
  el.preIdeas.classList.add("is-hidden");
  limpiarBuscadores()
}
function restart(){
  limpiarArmado();
  // El Deshacer de la Semana no se pierde por volver al inicio: vale hasta el próximo cambio del plan.
  armadoDestino=null;
  planDiaElegido=null;
  try{
    if(hoja.abierta())hoja.cerrar()
  }catch(e){
  }
  stack=["home"];
  resetAdviceTemporaryState();
  renderContextAdvice();
  document.querySelectorAll(".screen").forEach(s=>{
    s.classList.remove("is-active");s.setAttribute("aria-hidden","true")
  });
  const home=document.getElementById("home");
  home.classList.add("is-active");
  home.removeAttribute("aria-hidden");
  // Empezar de nuevo también vuelve todas las pestañas a su inicio (Hoy activa).
  if(typeof resetTabs==="function")resetTabs();
  nav();
  window.scrollTo({
    top:0,behavior:"smooth"
  })
}
function continueFromMulti(next){
  if(editReturn){
    editReturn=false;
    go("resumen");
    return
  }
  go(next)
}
function showAdviceTab(name){
  document.querySelectorAll(".advice-tab").forEach(b=>{
    const on=b.dataset.adviceTab===name;b.classList.toggle("is-selected",on);b.setAttribute("aria-selected",String(on))
  });
  document.querySelectorAll(".advice-section").forEach(s=>s.classList.remove("is-active"));
  const panel=document.getElementById(`advice_${name}`);
  if(panel)panel.classList.add("is-active")
}
function setMenuFilter(f,b){
  currentMenuFilter=f;
  document.querySelectorAll('[data-menu-filter]').forEach(x=>x.classList.toggle('is-selected',x===b));
  renderMenuIdeas();
  document.getElementById('suggestMenu').classList.remove('is-visible')
}
function setSnackFilter(f,b){
  currentSnackFilter=f;
  document.querySelectorAll('[data-snack-filter]').forEach(x=>x.classList.toggle('is-selected',x===b));
  renderSnackIdeas();
  document.getElementById('suggestSnack').classList.remove('is-visible')
}
function setSavedSort(f,b){
  savedSort=f;
  document.querySelectorAll('[data-sort]').forEach(x=>{
    const on=x===b;x.classList.toggle('is-selected',on);x.setAttribute('aria-pressed',String(on))
  });
  renderSaved()
}
function pickIndex(kind,len){
  if(len<2)return 0;
  let i=Math.floor(Math.random()*len);
  if(i===lastSuggestion[kind])i=(i+1)%len;
  lastSuggestion[kind]=i;
  return i
}
function showSuggestion(kind){
  if(kind==="menu"){
    const arr=filteredMenuRecords();
    if(!arr.length)return;
    const i=pickIndex("menu",arr.length);
    document.getElementById("suggestMenuText").textContent=arr[i].text;
    document.getElementById("suggestMenu").classList.add("is-visible")
  }
  if(kind==="snack"){
    const arr=filteredSnacks();
    if(!arr.length)return;
    const i=pickIndex("snack",arr.length),s=arr[i];
    document.getElementById("suggestSnackText").textContent=snackLabel(s);
    document.getElementById("suggestSnack").classList.add("is-visible")
  }
  if(kind==="pre"){
    const i=pickIndex("pre",data.preCombos.length);
    document.getElementById("suggestPreText").textContent=data.preCombos[i];
    document.getElementById("suggestPre").classList.add("is-visible")
  }
}
function renderContextAdvice(){
  const box=document.getElementById("contextAdvice"),titleEl=document.getElementById("contextTitle"),linesEl=document.getElementById("contextLines"),tipEl=document.getElementById("contextTip");
  if(!box||!titleEl||!linesEl||!tipEl)return;
  const lines=[];
  let title="",tip="";
  if(state.type==="desayuno"&&(state.fruta||state.bfprot||state.bfcarb||state.grasa)){
    title="Tu desayuno / merienda";
    if(state.fruta)lines.push(`Fruta: ${frutaTexto(state.fruta)}`);
    if(state.bfprot)lines.push(`Proteína: ${state.bfprot.name}`);
    if(state.bfcarb)lines.push(`Cereal: ${state.bfcarb.name}`);
    if(state.grasa)lines.push(`Grasa opcional: ${state.grasa.name}`);
    tip="Tip: si querés variar, podés cambiar el formato de fruta o cereal sin cambiar la estructura principal."
  }else if(state.type==="plato"&&(state.day||state.verduras.length||state.almidones.length||state.legCarb.length||state.proteinas.length||state.legProt.length)){
    const p=portions();
    title="Tu plato";
    if(state.day)lines.push(state.day);
    lines.push(`Proporciones: verduras ${p.vegetables}, almidones ${p.carbs}, proteínas ${p.protein}.`);
    if(state.customPortions)lines.push("Usás proporciones personalizadas validadas por la app.");
    if(state.legCarb.length||state.legProt.length)lines.push("Incluiste legumbres; podés revisar el filtro Legumbres en Menú.");
    if(state.almidones.length&&state.legCarb.length)lines.push("Combinaste almidones y legumbres dentro del grupo de almidones.");
    if(state.proteinas.length&&state.legProt.length)lines.push("Combinaste proteínas y legumbres dentro del grupo de proteínas.");
    tip="Tip: podés usar los filtros o el buscador por etiquetas para encontrar ideas según una palabra, por ejemplo pescado, pollo o garbanzos."
  }
  if(!title){
    box.classList.remove("is-visible");
    return
  }
  titleEl.textContent=title;
  linesEl.replaceChildren(...lines.map(x=>ce("li",null,x)));
  tipEl.textContent=tip;
  box.classList.add("is-visible")
}
function renderMenuSearch(){
  const input=document.getElementById("menuSearchInput"),box=document.getElementById("menuSearchResults"),list=document.getElementById("menuSearchList");
  if(!input||!box||!list)return;
  const q=input.value;
  const results=data.menuCatalog.filter(item=>menuRecordMatches(item,q));
  if(!normalizeSearchText(q)){
    box.classList.remove("is-visible");
    list.replaceChildren();
    return
  }
  box.classList.add("is-visible");
  if(!results.length){
    list.replaceChildren(ce("li","search-empty",`No encontré ideas con “${q}”. Probá otra palabra, por ejemplo pescado, pollo, garbanzos o tomate.`));
    return
  }
  renderMenuList(list,results,true)
}
