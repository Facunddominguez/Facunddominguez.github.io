// Mi Plato Fácil · Arranque, navegación entre pantallas y armado del plato.
// Parte 7: los archivos se unen en orden según su número, que define el orden de arranque.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Armado.nombre().
var Armado={
conBuscador(box,etiqueta){
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
  input.addEventListener("input",()=>Armado.filtrarOpciones(box,input.value));
  box.before(input)
},
filtrarOpciones(box,q){
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
},
limpiarBuscadores(){
  document.querySelectorAll("[data-filtra]").forEach(i=>{
    i.value="";const box=document.getElementById(i.dataset.filtra);if(box)Armado.filtrarOpciones(box,"")
  })
},
formaDeFrutaValida(f){
  return data.frutaFormas.includes(f)||data.frutaPreparaciones.includes(f)
},
frutasElegidas(){
  const f=state.fruta;
  if(!f||typeof f.name!=="string"||!f.name||esFormaDeFruta(f.name))return [];
  const n=f.name.split(" + "),q=String(f.quantity||"").split(" + ");
  return n.map((name,i)=>({name,quantity:q.length===n.length?q[i]:(data.frutas.find(x=>x[0]===name)||["",""])[1]}))
},
renderFrutas(){
  const box=document.getElementById("fruit");
  if(!box)return;
  box.replaceChildren(...data.frutas.map(([label,quantity])=>{
    const b=choice({label,quantity,key:"fruta",multi:true});
    delete b.dataset.multi;b.dataset.frutaSel=label;return b
  }));
  if(box.querySelectorAll(".choice").length>12)Armado.conBuscador(box,"Buscar fruta")
},
marcarFrutas(){
  const sel=Armado.frutasElegidas().map(x=>x.name),box=document.getElementById("fruit"),lleno=sel.length>=data.frutaMaxima;
  box.querySelectorAll(".choice").forEach(c=>{
    const on=sel.includes(c.dataset.frutaSel);
    c.classList.toggle("is-selected",on);c.setAttribute("aria-pressed",String(on));
    c.disabled=lleno&&!on
  });
  const cuenta=document.getElementById("fruitCount");
  if(cuenta)cuenta.textContent=sel.length?`Elegiste ${sel.length} de ${data.frutaMaxima}. Tocá otra vez para sacar una.`:`Elegí hasta ${data.frutaMaxima}.`
},
toggleFruta(b){
  const nombre=b.dataset.frutaSel,lista=Armado.frutasElegidas(),i=lista.findIndex(x=>x.name===nombre);
  if(i>=0)lista.splice(i,1);
  else if(lista.length<data.frutaMaxima)lista.push({name:nombre,quantity:b.dataset.quantity||""});
  else return;
  state.nombreSugerido="";
  state.fruta=lista.length?{name:lista.map(x=>x.name).join(" + "),quantity:lista.map(x=>x.quantity).join(" + "),forma:frutaForma}:null;
  Armado.marcarFrutas()
},
renderFrutaFormas(){
  const box=document.getElementById("fruitForms"),preps=document.getElementById("fruitPreps");
  if(!box)return;
  const enPrep=data.frutaPreparaciones.includes(frutaForma);
  const chip=(f,texto,on,attr)=>{const b=ce("button","filter-chip"+(on?" is-selected":""),texto);b.type="button";b.dataset[attr]=f;b.setAttribute("aria-pressed",String(on));return b};
  box.replaceChildren(...data.frutaFormas.map(f=>chip(f,f,f===frutaForma,"frutaForma")),chip("En una preparación","En una preparación",enPrep,"frutaPrep"));
  preps.hidden=!enPrep;
  preps.replaceChildren(...(enPrep?data.frutaPreparaciones.map(f=>chip(f,f,f===frutaForma,"frutaForma")):[]))
},
setFrutaForma(f){
  if(!Armado.formaDeFrutaValida(f))return;
  frutaForma=f;
  if(state.fruta)state.fruta.forma=f;
  Armado.renderFrutaFormas()
},
abrirPreparacionesDeFruta(){
  Armado.setFrutaForma(data.frutaPreparaciones.includes(frutaForma)?frutaForma:data.frutaPreparaciones[0])
},
renderAlmidones(){
  const box=document.getElementById("boxa"),mas=data.almidonesMas,det=ce("details","home-group almidones-mas");
  det.append(ce("summary",null,"Más opciones: harinas, féculas y pan rallado"),...mas.map(label=>choice({
    label,key:"almidones",multi:true
  })));
  box.replaceChildren(...data.almidones.filter(x=>!mas.includes(x)).map(label=>choice({
    label,key:"almidones",multi:true
  })),det)
},
nextFor(id){
  return {
    bf_fruit:"bf_prot",lunch_veg:"lunch_carb",lunch_carb:"lunch_prot",lunch_prot:"resumen"
  }
  [id]||""
},
activeTabRoot(){
  return TABS[activeTab].root
},
esRaizDePestana(cur){
  return cur===Armado.activeTabRoot()||(activeTab==="miscomidas"&&cur==="ideas")||(activeTab==="compras"&&cur==="ingredientes")
},
haptic(){
  if(!canVibrate)return;
  try{
    if(navigator.vibrate(20)===false)canVibrate=false
  }catch(e){
    canVibrate=false
  }
},
tapStart(b,e){
  pStart={
    x:e.clientX,y:e.clientY
  };
  pMoved=false
},
pickAnim(b,k,n,q,next){
  document.querySelectorAll(".choice").forEach(c=>c.classList.remove("is-selected"));
  b.classList.add("is-selected");
  setTimeout(()=>pick(k,n,q,next),60)
},
toggleMulti(b,k,n){
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
},
basePortions(){
  return state.day==="Día de entrenamiento"?{
    vegetables:"1/3",carbs:"1/3",protein:"1/3"
  }:{
    vegetables:"1/2",carbs:"1/4",protein:"1/4"
  }
},
setDay(d){
  state.day=d;
  state.customPortions=null;
  Armado.closePortionEditor();
  Armado.updatePlate();
  go("plate_static")
},
toggleDay(){
  state.day=state.day==="Día de entrenamiento"?"Día libre":"Día de entrenamiento";
  state.customPortions=null;
  Armado.closePortionEditor();
  Armado.updatePlate();
  go("plate_static")
},
cambiarDiaDelArmado(){
  state.day=state.day==="Día de entrenamiento"?"Día libre":"Día de entrenamiento";
  state.customPortions=null;
  Armado.closePortionEditor();
  Armado.updatePlate()
},
syncPortionEditor(){
  const p=portions();
  el.portionVeg.value=p.vegetables;
  el.portionCarb.value=p.carbs;
  el.portionProt.value=p.protein;
  el.portionError.classList.remove("is-visible")
},
closePortionEditor(){
  el.portionEditor.classList.remove("is-visible");
  el.portionError.classList.remove("is-visible")
},
updatePlate(){
  const p=portions();
  el.plateTitle.textContent=state.day;
  el.vegHint.textContent=`${p.vegetables} del plato. Podés elegir varias.`;
  el.carbHint.textContent=`${p.carbs} del plato. Podés elegir varios, también legumbres.`;
  el.protHint.textContent=`${p.protein} del plato. Podés elegir varias, también legumbres.`;
  document.querySelectorAll("[data-day-chip]").forEach(c=>{
    c.hidden=!state.day;c.textContent=(state.day||"")+" · cambiar";c.setAttribute("aria-label",(state.day||"")+". Tocá para cambiar el tipo de día")
  });
  Armado.syncPortionEditor();
  Armado.renderPlate()
},
savePortions(){
  const v=el.portionVeg.value,c=el.portionCarb.value,p=el.portionProt.value,total=frac(v)+frac(c)+frac(p);
  if(Math.abs(total-1)>0.0001){
    el.portionError.classList.add("is-visible");
    return
  }
  state.customPortions={
    vegetables:v,carbs:c,protein:p
  };
  Armado.closePortionEditor();
  Armado.updatePlate();
  if(portionEditReturn){
    portionEditReturn=false;
    go("resumen")
  }
},
dibujoDelPlato(p){
  const grupos=[["vegetables","verduras","Verduras"],["carbs","almidones","Almidones"],["protein","proteinas","Proteínas"]].map(g=>({clase:g[1],nombre:g[2],f:frac(p[g[0]])})),suma=grupos.reduce((a,g)=>a+g.f,0)||1,NS="http://www.w3.org/2000/svg";
  const svg=document.createElementNS(NS,"svg"),t=document.createElementNS(NS,"title"),mk=(n,a)=>{const e=document.createElementNS(NS,n);for(const k in a)e.setAttribute(k,a[k]);return e};
  svg.setAttribute("viewBox","0 0 200 200");svg.setAttribute("role","img");svg.setAttribute("class","plato-dibujo");
  t.textContent="Tu plato: "+grupos.filter(g=>g.f>0).map(g=>g.nombre.toLowerCase()+" "+(Math.round(g.f/suma*100))+" %").join(", ");
  svg.append(t,mk("circle",{cx:100,cy:100,r:96,class:"plato-dibujo__borde"}));
  let desde=0;
  for(const g of grupos){
    const parte=g.f/suma;
    if(parte<=0)continue;
    if(parte>=0.9999){svg.append(mk("circle",{cx:100,cy:100,r:92,class:"plato-dibujo__"+g.clase}));break}
    const a0=desde*2*Math.PI,a1=(desde+parte)*2*Math.PI,pt=a=>(100+92*Math.sin(a)).toFixed(2)+" "+(100-92*Math.cos(a)).toFixed(2);
    svg.append(mk("path",{d:"M100 100 L"+pt(a0)+" A92 92 0 "+(parte>0.5?1:0)+" 1 "+pt(a1)+" Z",class:"plato-dibujo__"+g.clase}));
    desde+=parte
  }
  return svg
},
renderPlate(){
  const p=portions(),free=state.day==="Día libre"&&!state.customPortions,w=ce("div","plate");
  w.append(slice("vegetables","Verduras",p.vegetables,free),slice("carbs","Almidones",p.carbs),slice("protein","Proteínas",p.protein));
  el.plateViz.replaceChildren(Armado.dibujoDelPlato(p),w)
},
setReplace(which,value){
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
},
fmtList(a){
  return a&&a.length?`<span class="selection-list">${a.map(x=>`<span class="selection-chip">${x.name}</span>`).join("")}</span>`:"No elegido"
},
editLine(label,value,target,icon){
  return `<div class="summary__line"><div class="summary__edit-row"><div>${icon} <strong>${label}:</strong><br>${value}</div><button class="edit-button" type="button" data-edit="${target}">Cambiar</button></div></div>`
},
groupLabel(base,leg,baseArr,legArr){
  return baseArr.length&&legArr.length?`${base} + legumbres`:legArr.length&&!baseArr.length?leg:base
},
resetAdviceTemporaryState(){
  const input=document.getElementById("menuSearchInput"),results=document.getElementById("menuSearchResults"),list=document.getElementById("menuSearchList");
  if(input)input.value="";
  if(results)results.classList.remove("is-visible");
  if(list)list.replaceChildren();
  ["suggestMenu","suggestSnack","suggestPre"].forEach(id=>{
    const box=document.getElementById(id);if(box)box.classList.remove("is-visible")
  })
},
limpiarArmado(){
  Object.assign(state,{
    type:"",day:"",fruta:null,bfprot:null,bfcarb:null,grasa:null,pre:null,snack:null,verduras:[],almidones:[],proteinas:[],legCarb:[],legProt:[],replaceCarb:false,replaceProt:false,customPortions:null,nombreSugerido:""
  });
  frutaForma="Entera";
  armadoFecha=null;
  Armado.renderFrutaFormas();
  editReturn=false;
  portionEditReturn=false;
  lastRandomType=null;
  document.querySelectorAll(".choice.is-selected,.toggle-button.is-selected").forEach(e=>e.classList.remove("is-selected"));
  document.querySelectorAll('.choice[aria-pressed="true"]').forEach(e=>e.setAttribute("aria-pressed","false"));
  Armado.setReplace("carb",false);
  Armado.setReplace("prot",false);
  Armado.closePortionEditor();
  el.preIdeas.classList.add("is-hidden");
  Armado.limpiarBuscadores()
},
continueFromMulti(next){
  if(editReturn){
    editReturn=false;
    go("resumen");
    return
  }
  go(next)
},
showAdviceTab(name){
  document.querySelectorAll(".advice-tab").forEach(b=>{
    const on=b.dataset.adviceTab===name;b.classList.toggle("is-selected",on);b.setAttribute("aria-selected",String(on))
  });
  document.querySelectorAll(".advice-section").forEach(s=>s.classList.remove("is-active"));
  const panel=document.getElementById(`advice_${name}`);
  if(panel)panel.classList.add("is-active")
},
setMenuFilter(f,b){
  currentMenuFilter=f;
  document.querySelectorAll('[data-menu-filter]').forEach(x=>x.classList.toggle('is-selected',x===b));
  Ideas.renderMenuIdeas();
  document.getElementById('suggestMenu').classList.remove('is-visible')
},
setSnackFilter(f,b){
  currentSnackFilter=f;
  document.querySelectorAll('[data-snack-filter]').forEach(x=>x.classList.toggle('is-selected',x===b));
  Ideas.renderSnackIdeas();
  document.getElementById('suggestSnack').classList.remove('is-visible')
},
setSavedSort(f,b){
  savedSort=f;
  document.querySelectorAll('[data-sort]').forEach(x=>{
    const on=x===b;x.classList.toggle('is-selected',on);x.setAttribute('aria-pressed',String(on))
  });
  renderSaved()
},
pickIndex(kind,len){
  if(len<2)return 0;
  let i=Math.floor(Math.random()*len);
  if(i===lastSuggestion[kind])i=(i+1)%len;
  lastSuggestion[kind]=i;
  return i
},
showSuggestion(kind){
  if(kind==="menu"){
    const arr=Ideas.filteredMenuRecords();
    if(!arr.length)return;
    const i=Armado.pickIndex("menu",arr.length);
    document.getElementById("suggestMenuText").textContent=arr[i].text;
    document.getElementById("suggestMenu").classList.add("is-visible")
  }
  if(kind==="snack"){
    const arr=Ideas.filteredSnacks();
    if(!arr.length)return;
    const i=Armado.pickIndex("snack",arr.length),s=arr[i];
    document.getElementById("suggestSnackText").textContent=Interfaz.snackLabel(s);
    document.getElementById("suggestSnack").classList.add("is-visible")
  }
  if(kind==="pre"){
    const i=Armado.pickIndex("pre",data.preCombos.length);
    document.getElementById("suggestPreText").textContent=data.preCombos[i];
    document.getElementById("suggestPre").classList.add("is-visible")
  }
},
renderContextAdvice(){
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
};
function init(){
  Rutina.renderTrainingWeek();
  Rutina.renderTrainingExceptions();
  Armado.renderFrutas();
  Armado.renderFrutaFormas();
  Interfaz.renderChoice("bfprot",data.bfprot,"bfprot","bf_carb");
  Interfaz.renderChoice("bfcarb",data.bfcarb,"bfcarb","bf_fat");
  Interfaz.renderChoice("bffat",data.bffat,"grasa","resumen");
  Interfaz.renderChoice("snacks",data.snacks,"snack","resumen");
  Interfaz.renderMulti("boxv",data.verduras,"verduras");
  Armado.renderAlmidones();
  Interfaz.renderProteins();
  Interfaz.renderMulti("boxLegCarb",data.legumbres,"legCarb");
  Interfaz.renderMulti("boxLegProt",data.legumbres,"legProt");
  Interfaz.liList(el.preIdeaList,data.preIdeas);
  Interfaz.liList(el.preComboList,data.preCombos);
  Ideas.renderMenuIdeas();
  Interfaz.methodCards(el.cookingMethods,data.cookingMethods);
  Ideas.renderSnackIdeas();
  Interfaz.liList(el.advicePreIdeas,data.preIdeas);
  Interfaz.liList(el.advicePreCombos,data.preCombos);
  pantrySel=loadPantry();
  renderPantry();
  // Listas largas del armado (más de 12 opciones): grilla de chips con buscador.
  for(const [id,etiqueta] of [["fruit","Buscar fruta"],["boxv","Buscar verdura"],["boxa","Buscar almidón"],["boxp","Buscar proteína"],["boxLegCarb","Buscar legumbre"],["boxLegProt","Buscar legumbre"],["bfprot","Buscar proteína"],["bfcarb","Buscar cereal"],["bffat","Buscar grasa"],["snacks","Buscar snack"]]){
    const box=document.getElementById(id);
    if(box&&box.querySelectorAll(".choice").length>12)Armado.conBuscador(box,etiqueta)
  }
}
// Lo elegido sigue a la vista aunque no coincida con lo que se busca.
// Pasos del armado: solo en ellos se ve la barra "Volver al paso anterior".
const ARMADO_PASOS=["bf_fruit","bf_prot","bf_carb","bf_fat","day","plate_static","lunch_veg","lunch_carb","lunch_prot","snack","pre"];
// Paso Frutas (v16): "¿Qué fruta?" (hasta 3, sin avanzar solo) y "¿Cómo?" (entera, en trozos, licuado o en una preparación).
// state.fruta sigue siendo un solo objeto {name,quantity,forma}: con varias frutas, name y quantity van unidos con " + ".
// Almidones: harinas, féculas y pan rallado quedan en "Más opciones" (plegado).
// Almuerzo o cena: si la rutina sabe si ese día se entrena, no se pregunta y se arranca en Verduras.
// dayKey: el día del plan cuando el armado empieza desde un hueco de la Semana (usa la rutina de ese día).
// slot: la comida del hueco desde el que se arma (Selector de comida); al guardar, se asigna ahí y se vuelve a la Semana.
var armadoDestino=null;
function start(type,dayKey,slot){
  lastRandomType=null;
  armadoDestino=slot&&dayKey&&SLOTS.some(s=>s[0]===slot)&&DAYS.some(d=>d[0]===dayKey)?{
    dia:dayKey,slot,tab:activeTab
  }:null;
  Armado.limpiarBuscadores();
  state.type=type;
  armadoFecha=dayKey&&DAYS.some(d=>d[0]===dayKey)?fechaDelDiaDelPlan(dayKey):null;
  if(type==="plato"){
    const dia=diaDeRutina(armadoFecha||new Date());
    if(dia){
      state.day=dia;
      state.customPortions=null;
      Armado.closePortionEditor();
      Armado.updatePlate();
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
  if(id==="ideas")Armado.renderContextAdvice();
  if(id==="registro"&&typeof renderRegistro==="function")renderRegistro();
  if(id==="backupScreen"&&typeof RespaldoAviso!=="undefined")RespaldoAviso.pintar();
  if(id==="preferencias"&&typeof renderObjetivosPreferencias==="function")renderObjetivosPreferencias();
  if(id==="bf_fruit"){
    frutaForma=state.fruta&&state.fruta.forma&&Armado.formaDeFrutaValida(state.fruta.forma)?state.fruta.forma:"Entera";
    Armado.renderFrutaFormas();Armado.marcarFrutas()
  }
  window.scrollTo({
    top:0,behavior:"smooth"
  })
}
// Pestañas de la barra inferior y la pantalla de inicio de cada una. La barra está en 32-pestanas.js.
const TABS={
  hoy:{root:"home",label:"Hoy"},semana:{root:"plan",label:"Semana"},compras:{root:"compras",label:"Compras"},miscomidas:{root:"misplatos",label:"Comidas"},mas:{root:"home",label:"Más"}
};
let activeTab="hoy";
// En Comidas, Ideas es la otra mitad del segmento "Mis comidas | Ideas": no muestra "← Comidas". Igual la Despensa en
// Compras ("Lista | Despensa", desde la v15.4).
function nav(){
  const cur=stack.at(-1),home=cur==="home",sum=cur==="resumen",next=Armado.nextFor(cur);
  // La barra de abajo: "Volver al paso anterior" solo si hay un paso anterior (no en el paso 1) y "Continuar" si hay siguiente;
  // sin ninguno de los dos no se muestra. Mientras está, reemplaza a las pestañas (ver estilos.css): nunca se apilan.
  const prev=stack.at(-2),hayAtras=stack.length>1&&(ARMADO_PASOS.includes(prev)||prev==="resumen");
  const bottomVisible=ARMADO_PASOS.includes(cur)&&(hayAtras||!!next);
  el.bottom.classList.toggle("is-visible",bottomVisible);
  const atras=el.bottomInner.querySelector("[data-back]");
  if(atras)atras.classList.toggle("is-hidden",!hayAtras);
  // Arriba: vuelve al inicio de la pestaña actual; no se muestra si ya estás ahí.
  el.homeTop.classList.toggle("is-visible",!Armado.esRaizDePestana(cur));
  el.homeTop.textContent="← "+TABS[activeTab].label;
  el.homeTop.setAttribute("aria-label","Volver al inicio de "+TABS[activeTab].label);
  document.getElementById("themeToggle").classList.toggle("is-hidden",!home);
  el.nextBottom.classList.toggle("is-hidden",!next);
  el.bottomInner.classList.toggle("has-next",!!next&&hayAtras);
  if(next)el.nextBottom.dataset.go=next;
  else delete el.nextBottom.dataset.go;
}
let canVibrate=typeof navigator!=="undefined"&&typeof navigator.vibrate==="function";
function tapMove(e){
  if(!pStart)return;
  if(Math.hypot(e.clientX-pStart.x,e.clientY-pStart.y)>10)pMoved=true
}
function pick(k,n,q,next){
  state[k]={
    name:n,quantity:q
  };
  state.nombreSugerido="";
  if(editReturn){
    editReturn=false;
    go("resumen");
    return
  }
  go(next)
}
function portions(){
  return state.customPortions||Armado.basePortions()
}
// Chip "Día de entrenamiento · cambiar" de los pasos del almuerzo o cena: cambia el día sin salir del paso.
function frac(v){
  return v==="1/2"?1/2:v==="1/3"?1/3:v==="1/4"?1/4:0
}
function slice(type,name,amount,half=false){
  const s=ce("article",`plate__slice plate__slice--${type}${half?" plate__slice--half":""}`);
  s.append(ce("span","plate__name",name),ce("span","plate__amount",amount),ce("span","plate__caption","del plato"));
  return s
}
// Dibujo del plato: un círculo con un sector por grupo, en el orden Verduras, Almidones y Proteínas desde las 12 y en sentido horario.
// Un sector de 0 no se dibuja y uno de 1 entero es un círculo (un arco de 360° no existe en SVG). Sin texto: los nombres están en las tarjetas.
function toggle(b,s){
  b.classList.toggle("is-selected",s);
  b.setAttribute("aria-pressed",String(s))
}
function fmt(o){
  return o?`${opcionVisible(o.name)}${o.quantity?` <span class="quantity">${cantidadVisible(o.quantity)}</span>`:""}`:"No elegido"
}
function edit(t){
  editReturn=true;
  go(t)
}
function merged(a,b){
  return [...a,...b]
}
function summary(){
  let h="";
  if(state.type==="desayuno")h=`<div class="summary__line"><strong>${nombreDesdeEstado(state,"desayuno")||"Desayuno / Merienda"}</strong></div>${Armado.editLine("Fruta",state.fruta?fmt({name:frutaTexto(state.fruta),quantity:state.fruta.quantity}):fmt(null),"bf_fruit","🍓")}${Armado.editLine("Proteína",fmt(state.bfprot),"bf_prot","🥛")}${Armado.editLine("Cereal",fmt(state.bfcarb),"bf_carb","🌾")}${Armado.editLine("Grasa opcional",fmt(state.grasa),"bf_fat","🥑")}`;
  else if(state.type==="plato"){
    const p=portions(),other=state.day==="Día de entrenamiento"?"Día libre":"Día de entrenamiento",carbArr=merged(state.almidones,state.legCarb),protArr=merged(state.proteinas,state.legProt),carb=Armado.groupLabel("Almidones","Legumbres como almidón",state.almidones,state.legCarb),prot=Armado.groupLabel("Proteínas","Legumbres como proteína",state.proteinas,state.legProt);
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
    h=`<div class="summary__line"><strong>${nombreDesdeEstado(state,"plato")||"Almuerzo / Cena"} · ${state.day}</strong></div>${Armado.editLine(`Verduras · ${p.vegetables} del plato`,Armado.fmtList(state.verduras),"lunch_veg","🥗")}${Armado.editLine(`${carb} · ${p.carbs} del plato`,Armado.fmtList(carbArr),"lunch_carb","🍚")}${Armado.editLine(`${prot} · ${p.protein} del plato`,Armado.fmtList(protArr),"lunch_prot","🔵")}${platoWarn}<div class="divider"></div><div class="summary-actions"><button class="button button--soft" type="button" data-toggle-day>Cambiar a ${other}</button><button class="button button--soft" type="button" data-edit-portions-summary>Editar proporciones</button></div>`
  }else if(state.type==="snack")h=`<div class="summary__line"><strong>Snack</strong></div>${Armado.editLine("Opción",fmt(state.snack),"snack","🥜")}`;
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
// Deja el armado vacío (sin tocar pestañas ni pantallas).
function restart(){
  Armado.limpiarArmado();
  // El Deshacer de la Semana no se pierde por volver al inicio: vale hasta el próximo cambio del plan.
  armadoDestino=null;
  planDiaElegido=null;
  try{
    if(hoja.abierta())hoja.cerrar()
  }catch(e){
  }
  stack=["home"];
  Armado.resetAdviceTemporaryState();
  Armado.renderContextAdvice();
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
function renderMenuSearch(){
  const input=document.getElementById("menuSearchInput"),box=document.getElementById("menuSearchResults"),list=document.getElementById("menuSearchList");
  if(!input||!box||!list)return;
  const q=input.value;
  const results=data.menuCatalog.filter(item=>Ideas.menuRecordMatches(item,q));
  if(!normalizeSearchText(q)){
    box.classList.remove("is-visible");
    list.replaceChildren();
    return
  }
  box.classList.add("is-visible");
  if(!results.length){
    const vacio=ce("li","search-empty",`No encontré ideas con “${q}”. Probá con pescado, pollo o tomate.`),limpiar=ce("button","button button--soft","Limpiar búsqueda");limpiar.type="button";limpiar.addEventListener("click",()=>{input.value="";renderMenuSearch();input.focus()});vacio.append(limpiar);list.replaceChildren(vacio);
    return
  }
  Interfaz.renderMenuList(list,results,true)
}
