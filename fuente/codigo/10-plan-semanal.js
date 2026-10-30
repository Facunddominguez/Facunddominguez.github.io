// Mi Plato Fácil · Plan semanal, variaciones, recetas en el plan, porciones e historial.
// Parte 11: los archivos se unen en orden según su número, que define el orden de arranque.
const PKEY="miPlatoFacil_plan",VKEY="miPlatoFacil_planVars";
function migratePlan(o){
  const out={
  };
  DAYS.forEach(function(d){
    const key=d[0];const v=o?o[key]:null;if(v&&!Array.isArray(v)&&typeof v==="object"){
      out[key]={
        desayuno:v.desayuno||null,merienda:v.merienda||null,almuerzo:v.almuerzo||null,cena:v.cena||null
      }
    }else if(Array.isArray(v)){
      const slot={
        desayuno:null,merienda:null,almuerzo:null,cena:null
      };const saved=loadSaved();const byId={
      };saved.forEach(p=>{
        byId[p.id]=p
      });v.forEach(function(id){
        const it=byId[id];const t=it?it.type:"plato";if(t==="desayuno"){
          if(!slot.desayuno)slot.desayuno=id;else if(!slot.merienda)slot.merienda=id
        }else{
          if(!slot.almuerzo)slot.almuerzo=id;else if(!slot.cena)slot.cena=id
        }
      });out[key]=slot
    }else{
      out[key]={
        desayuno:null,merienda:null,almuerzo:null,cena:null
      }
    }
  });
  return out
}
function loadPlan(){
  try{
    const raw=localStorage.getItem(PKEY);
    const o=raw?JSON.parse(raw):{
    };
    return migratePlan(o&&typeof o==="object"?o:{
    })
  }catch(e){
    return migratePlan({
    })
  }
}
// Toda escritura del plan pasa por acá: antes guarda la copia de la semana anterior si hace falta (si no se puede,
// no se escribe nada y queda el motivo en errorDelPlan), y después el Deshacer anterior deja de valer (cada acción
// que se puede deshacer lo vuelve a armar).
var errorDelPlan="";
function persistPlan(o){
  errorDelPlan="";
  if(!copiaAutomaticaDeSemana())return false;
  try{
    localStorage.setItem(PKEY,JSON.stringify(o));
    deshacerPlan=null;
    return true
  }catch(e){
    errorDelPlan="No se pudo guardar el cambio (falta de espacio u otro error). Tu plan no cambió.";
    return false
  }
}
function loadVars(){
  try{
    const raw=localStorage.getItem(VKEY);
    const o=raw?JSON.parse(raw):{
    };
    return (o&&typeof o==="object")?o:{
    }
  }catch(e){
    return {
    }
  }
}
function persistVars(o){
  try{
    localStorage.setItem(VKEY,JSON.stringify(o));
    return true
  }catch(e){
    return false
  }
}
let planStatusTimer=null;
function planStatus(msg){
  const s=document.getElementById("planStatus");
  if(!s)return;
  s.textContent=msg;
  clearTimeout(planStatusTimer);
  planStatusTimer=setTimeout(()=>{
    s.textContent=""
  },3600)
}
function setSlot(dayKey,slot,id){
  const plan=loadPlan(),antes={
    plan:JSON.parse(JSON.stringify(plan)),porciones:loadPlanPortions()
  };
  if(!plan[dayKey])plan[dayKey]={
    desayuno:null,merienda:null,almuerzo:null,cena:null
  };
  const before=plan[dayKey][slot]||null;
  plan[dayKey][slot]=id||null;
  if(!persistPlan(plan)){
    planStatus(errorDelPlan);
    return false
  }
  if(before!==(id||null)){
    try{
      const p=loadPlanPortions();
      if(p[dayKey+"|"+slot]!==undefined){
        delete p[dayKey+"|"+slot];
        savePlanPortions(p)
      }
    }catch(e){
    }
    const it=id?loadSaved().find(x=>x.id===id):null,texto=planDayName(dayKey)+" · "+planSlotName(slot)+": "+(it?"asignado "+mealName(it):"quitado");
    logPlanChange(texto);
    // tab: desde qué pestaña se hizo (Hoy muestra su propio aviso con Deshacer).
    deshacerPlan={
      texto,plan:antes.plan,porciones:antes.porciones,tab:activeTab
    }
  }
  renderPlan();
  planStatus(id?"Asignado.":"Quitado.");
  return true
}
function clearSlot(dayKey,slot){
  setSlot(dayKey,slot,null)
}
function clearPlan(){
  if(window.confirm("¿Vaciar todo el plan semanal?")){
    const old=loadPlan(),porciones=loadPlanPortions();
    if(!persistPlan(migratePlan({
    }))){
      renderPlan();
      planStatus(errorDelPlan);
      return
    }
    prunePlanPortions(old,migratePlan({
    }));
    logPlanChange("Plan vaciado");
    deshacerPlan={
      texto:"Plan vaciado",plan:old,porciones
    };
    renderPlan();
    planStatus("Plan vaciado.")
  }
}
function refreshVarSelect(){
  const sel=document.getElementById("varSelect");
  if(!sel)return;
  const vars=loadVars();
  const names=Object.keys(vars).sort();
  const cur=sel.value;
  sel.replaceChildren();
  const op0=ce("option",null,"— Plan actual —");
  op0.value="";
  sel.append(op0);
  names.forEach(function(n){
    const o=ce("option",null,n);o.value=n;sel.append(o)
  });
  if(names.indexOf(cur)>=0)sel.value=cur;
  else sel.value=""
}
function saveVariation(){
  const name=window.prompt("Nombre para esta variación (ej: Semana finde):","");
  if(name===null)return;
  const nm=name.trim();
  if(!nm){
    planStatus("Poné un nombre para guardar la variación.");
    return
  }
  const vars=loadVars();
  vars[nm]=loadPlan();
  persistVars(vars);
  refreshVarSelect();
  const sel=document.getElementById("varSelect");
  if(sel)sel.value=nm;
  planStatus('Variación "'+nm+'" guardada.')
}
function loadVariationByName(nm){
  if(!nm)return;
  const vars=loadVars();
  if(!vars[nm])return;
  const old=loadPlan();
  if(!persistPlan(migratePlan(vars[nm]))){
    planStatus(errorDelPlan);
    return
  }
  prunePlanPortions(old,loadPlan());
  logPlanChange('Variación "'+nm+'" cargada');
  renderPlan();
  planStatus('Variación "'+nm+'" cargada.')
}
function deleteVariation(){
  const sel=document.getElementById("varSelect");
  const nm=sel?sel.value:"";
  if(!nm){
    planStatus("Elegí una variación guardada para borrarla.");
    return
  }
  if(window.confirm('¿Borrar la variación "'+nm+'"?')){
    const vars=loadVars();
    delete vars[nm];
    persistVars(vars);
    refreshVarSelect();
    planStatus('Variación "'+nm+'" borrada.')
  }
}
let savedRecipeTitleCache={
  raw:undefined,map:{
  }
},savedRecipesOpen=false;
function savedRecipeTitle(it){
  if(!it||!it.recipeSourceId)return null;
  let raw=null;
  try{
    raw=localStorage.getItem("miPlatoFacil_recipeDetails_v1")
  }catch(e){
  }
  if(raw!==savedRecipeTitleCache.raw){
    let map={
    };
    try{
      map=Object.fromEntries(Object.values(loadRecipeDetails()).map(r=>[r.id,r.title]))
    }catch(e){
    }
    savedRecipeTitleCache={
      raw,map
    }
  }
  return savedRecipeTitleCache.map[it.recipeSourceId]||null
}
function savedItemTitle(it){
  return savedRecipeTitle(it)||it.title||"Plato"
}
function savedItemLines(it){
  const lines=Array.isArray(it.lines)?it.lines:[];
  if(lines.length||!it.recipeSourceId||!Array.isArray(it.recipeIngredients)||!it.recipeIngredients.length)return lines;
  return ["Ingredientes: "+it.recipeIngredients.join(", ")]
}
// Nombre de una comida en el plan y en los selectores (desde la v15, con mealName y sin repetir con mealLabels).
function planPlateLabel(it,label){
  return (it.fav?"⭐ ":"")+(it.recipeSourceId?"📖":typeEmoji(it.type))+" "+(label||mealName(it))
}
function renderPlanRecipeReference(){
  const select=document.getElementById("planRecipeSelect"),box=document.getElementById("planRecipePreview"),search=document.getElementById("planRecipeSearch");
  if(!select||!box)return;
  let own;
  try{
    own=loadRecipeDetails()
  }catch(err){
    box.textContent=err.message;
    return
  }
  const previous=select.value,q=normalizeSearchText(search.value.trim());
  let matches=Object.values(own).filter(r=>!q||normalizeSearchText([r.title,r.notes,...r.steps].join(" ")).includes(q));
  let excluded=0;
  if(document.getElementById("planRecipeApplyAvoid").checked){
    const terms=recipeAvoidTerms();
    if(terms.length){
      const amounts=loadRecipeAmounts(),before=matches.length;
      matches=matches.filter(r=>!recipeAvoidMatch({
        kind:"propia",key:r.id,title:r.title
      },own,amounts,terms));
      excluded=before-matches.length
    }
  }
  document.getElementById("planRecipePreferenceStatus").textContent=excluded?excluded+" recetas ocultas por preferencias. El filtro no verifica alérgenos.":"Las preferencias solo filtran esta búsqueda; no modifican el plan guardado.";
  matches.sort((a,b)=>a.title.localeCompare(b.title,"es"));
  select.replaceChildren();
  if(!matches.length){
    const option=ce("option",null,"No hay recetas coincidentes");
    option.value="";
    select.append(option);
    box.replaceChildren();
    return
  }
  for(const r of matches){
    const option=ce("option",null,r.title);
    option.value=r.id;
    select.append(option)
  }
  select.value=matches.some(r=>r.id===previous)?previous:matches[0].id;
  renderPlanRecipePreview()
}
function renderPlanRecipePreview(){
  const box=document.getElementById("planRecipePreview"),id=document.getElementById("planRecipeSelect").value;
  box.replaceChildren();
  if(!id)return;
  let r;
  try{
    r=loadRecipeDetails()[id]
  }catch(err){
    box.textContent=err.message;
    return
  }
  if(!r)return;
  box.append(ce("h4",null,r.title));
  const amounts=loadRecipeAmounts(),amount=r.amountsTitle&&amounts[r.amountsTitle];
  if(amount){
    box.append(ce("p","screen__hint","Rinde "+amount.yield+" porciones"));
    const ul=ce("ul");
    for(const x of amount.rows)ul.append(ce("li",null,x.name+": "+(x.quantity===null?"cantidad no registrada":x.quantity+" "+x.unit)));
    box.append(ul)
  }else box.append(ce("p","screen__hint","Sin cantidades vinculadas."));
  if(r.steps.length){
    box.append(ce("h4",null,"Preparación"));
    const ol=ce("ol");
    for(const step of r.steps)ol.append(ce("li",null,step));
    box.append(ol)
  }
  if(r.notes)box.append(ce("p","screen__hint","Notas: "+r.notes))
}
function initializePlanRecipeAssignment(){
  for(const [id,items] of [["planRecipeDay",DAYS],["planRecipeSlot",SLOTS]]){
    const sel=document.getElementById(id);
    sel.replaceChildren();
    for(const [value,label] of items){
      const option=ce("option",null,label);
      option.value=value;
      sel.append(option)
    }
  }
}
// Asigna una receta propia a un hueco: usa (o crea) su copia en los platos del plan, como siempre.
// La usan "Buscar en mis recetas" (con confirmación si reemplaza) y el Selector de comida (con Deshacer).
function asignarRecetaAlPlan(id,day,slot,confirmar){
  if(!DAYS.some(d=>d[0]===day)||!SLOTS.some(d=>d[0]===slot))throw Error("Seleccioná un día y una comida válidos.");
  const recipe=loadRecipeDetails()[id];
  if(!recipe)throw Error("Seleccioná una receta guardada.");
  const amounts=loadRecipeAmounts(),amount=recipe.amountsTitle&&amounts[recipe.amountsTitle];
  if(!amount||!amount.rows.length)throw Error("Esta receta necesita sus ingredientes para incorporarse al plan y a Compras. Abrila en Comidas, tocá Editar receta y cargalos.");
  if(amount.rows.some(row=>!row.name||!row.name.trim()))throw Error("Revisá los ingredientes de esta receta.");
  const plan=loadPlan(),existing=plan[day]&&plan[day][slot];
  if(confirmar&&existing&&!window.confirm("Ya hay una comida asignada. ¿Reemplazarla por esta receta?"))return false;
  const saved=loadSaved(),signature="recipe-ref:"+id+":"+slotPool(slot);
  let snapshot=saved.find(x=>x.recipeSourceId===id&&x.type===slotPool(slot));
  if(!snapshot){
    snapshot={
      id:"recipe_plan_"+Date.now()+"_"+Math.random().toString(36).slice(2,8),savedAt:new Date().toISOString(),type:slotPool(slot),title:recipe.title,lines:[],sig:signature,text:recipe.title,cooked:0,state:null,recipeSourceId:id,recipeIngredients:amount.rows.map(row=>row.name.trim())
    };
    saved.unshift(snapshot)
  }else{
    snapshot={
      ...snapshot,title:recipe.title,recipeIngredients:amount.rows.map(row=>row.name.trim())
    };
    saved[saved.findIndex(x=>x.id===snapshot.id)]=snapshot
  }
  if(!persistSaved(saved))throw Error("No se pudo guardar la receta en los platos del plan.");
  if(setSlot(day,slot,snapshot.id)===false)throw Error(errorDelPlan);
  renderCompras();
  return true
}
function assignSavedRecipeToPlan(){
  const status=document.getElementById("planRecipeAssignStatus");
  try{
    if(!asignarRecetaAlPlan(document.getElementById("planRecipeSelect").value,document.getElementById("planRecipeDay").value,document.getElementById("planRecipeSlot").value,true))return;
    status.textContent="Receta asignada. Compras suma sus ingredientes con las cantidades registradas en la receta."
  }catch(err){
    status.textContent=err.message
  }
}
initializePlanRecipeAssignment();
document.getElementById("planRecipeAssign").addEventListener("click",assignSavedRecipeToPlan);
document.getElementById("planRecipeApplyAvoid").addEventListener("change",renderPlanRecipeReference);
document.getElementById("planRecipeSearch").addEventListener("input",renderPlanRecipeReference);
document.getElementById("planRecipeSelect").addEventListener("change",renderPlanRecipePreview);
document.getElementById("planRecipeReference").addEventListener("toggle",e=>{
  if(e.currentTarget.open){
    let pref={
    };try{
      pref=JSON.parse(localStorage.getItem(RECIPE_PREF_KEY)||"{}")||{
      }
    }catch(err){
    }if(!e.currentTarget.dataset.preferencesInitialized){
      document.getElementById("planRecipeApplyAvoid").checked=pref.enabled===true;e.currentTarget.dataset.preferencesInitialized="true"
    }renderPlanRecipeReference()
  }
});
// Semana (desde la v15.1): un día a la vez. Chips de lunes a domingo con cuántas comidas tiene cada uno y, debajo,
// las 4 comidas del día elegido. Tocar una comida abre el Selector (si está vacía) o sus opciones (si está llena).
// El plan sigue guardado por día de la semana: las fechas son solo de presentación. Son var (y funciones) porque
// renderPlan puede correr antes de que carguen los archivos siguientes.
var planDiaElegido=null,deshacerPlan=null;
function fechaCorta(d){
  return d.getDate()+" "+["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][d.getMonth()]
}
function semanaActual(){
  return mondayOf(localTrainingDate(new Date()))
}
function rangoDeSemana(lunes){
  const a=new Date(lunes+"T12:00:00"),b=new Date(a);
  b.setDate(b.getDate()+6);
  return fechaCorta(a)+" – "+fechaCorta(b)
}
function diaPlanElegido(){
  return DAYS.some(d=>d[0]===planDiaElegido)?planDiaElegido:todayPlanDay()
}
function elegirDiaPlan(dia){
  if(DAYS.some(d=>d[0]===dia))planDiaElegido=dia;
  renderPlan()
}
function planTieneComidas(plan){
  return DAYS.some(([d])=>SLOTS.some(([s])=>plan&&plan[d]&&plan[d][s]))
}
// La semana del plan es la de su último cambio (el historial guarda la hora en UTC; se pasa a la fecha local).
function semanaDelPlan(){
  const h=loadPlanHistory();
  if(!h.length)return null;
  const d=new Date(h[0].at);
  return isNaN(d.getTime())?null:mondayOf(localTrainingDate(d))
}
function semanaNuevaPendiente(plan){
  const s=semanaDelPlan();
  return !!s&&s<semanaActual()&&planTieneComidas(plan||loadPlan())
}
function nombreDelHueco(dia,slot){
  return planSlotName(slot)+" del "+planDayName(dia).toLowerCase()
}
function renderPlan(){
  const cont=document.getElementById("planList");
  if(!cont)return;
  refreshVarSelect();
  const plan=loadPlan(),byId=new Map(loadSaved().map(p=>[p.id,p])),dia=diaPlanElegido(),lunes=semanaActual(),hoy=todayPlanDay(),porciones=loadPlanPortions();
  document.getElementById("planSemanaTitulo").textContent="Esta semana · "+rangoDeSemana(lunes);
  let total=0;
  const chips=DAYS.map(([key,label],i)=>{
    const n=SLOTS.filter(([s])=>plan[key]&&plan[key][s]&&byId.has(plan[key][s])).length,f=new Date(lunes+"T12:00:00"),b=ce("button","semana-dia-chip"+(key===hoy?" es-hoy":"")),barra=ce("span","semana-dia-chip__barra");
    total+=n;
    f.setDate(f.getDate()+i);
    b.type="button";
    b.dataset.planDia=key;
    b.setAttribute("aria-pressed",String(key===dia));
    b.setAttribute("aria-label",label+" "+f.getDate()+(key===hoy?" (hoy)":"")+": "+n+" de 4 comidas");
    barra.style.setProperty("--completo",String(n/4));
    b.append(ce("span","semana-dia-chip__letra",label.charAt(0)),ce("span","semana-dia-chip__num",String(f.getDate())),ce("span","semana-dia-chip__cuenta",n+"/4"),barra);
    return b
  });
  document.getElementById("planDias").replaceChildren(...chips);
  const i=DAYS.findIndex(d=>d[0]===dia),f=new Date(lunes+"T12:00:00");
  f.setDate(f.getDate()+i);
  document.getElementById("planDiaTitulo").textContent=planDayName(dia)+" "+f.getDate()+(dia===hoy?" · hoy":"");
  cont.replaceChildren(...["desayuno","almuerzo","merienda","cena"].map(slot=>{
    const id=plan[dia]&&plan[dia][slot],it=id?byId.get(id):null,b=ce("button","hueco"+(it?"":" hueco--vacio")),texto=ce("span","hueco__texto");
    b.type="button";
    b.dataset.hueco=dia+"|"+slot;
    texto.append(ce("span","hueco__comida",SLOTS.find(s=>s[0]===slot)[1]));
    if(it){
      texto.append(ce("span","hueco__plato",planPlateLabel(it)));
      const pk=dia+"|"+slot,detalle=savedItemLines(it).join(" · ")+(porciones[pk]!==undefined?" · "+String(porciones[pk]).replace(".",",")+" porciones":"");
      if(detalle)texto.append(ce("span","hueco__detalle",detalle));
      b.setAttribute("aria-label",nombreDelHueco(dia,slot)+": "+mealName(it)+". Cambiar, quitar y más")
    }else{
      texto.append(ce("span","hueco__plato is-empty","Sin elegir"));
      b.setAttribute("aria-label","Elegir "+nombreDelHueco(dia,slot).toLowerCase())
    }
    b.append(texto,ce("span","hueco__accion",it?"›":"Elegir"));
    return b
  }));
  const hint=document.getElementById("planHint");
  if(hint)hint.textContent=total?total+" de 28 comidas en la semana.":"Tocá una comida para elegir qué vas a comer.";
  const nueva=document.getElementById("planSemanaNueva");
  if(nueva){
    const pendiente=semanaNuevaPendiente(plan);
    nueva.hidden=!pendiente;
    if(pendiente)document.getElementById("planSemanaNuevaTexto").textContent="Tu plan es de la semana del "+typedAppDateLabel(semanaDelPlan()).slice(0,5)+"."
  }
  const aviso=document.getElementById("planAviso");
  if(aviso){
    aviso.replaceChildren();
    if(deshacerPlan){
      const b=ce("button","filter-chip","Deshacer");
      b.type="button";
      b.dataset.planDeshacer="";
      aviso.append(document.createTextNode(deshacerPlan.texto+". "),b)
    }
  }
  if(typeof refrescarHojaHueco==="function")refrescarHojaHueco();
  // Hoy muestra el mismo plan: se repinta con cada cambio.
  if(typeof renderToday==="function")renderToday()
}
// Deshacer: vuelve el plan y las porciones de antes del último cambio hecho desde la Semana.
function deshacerCambioDelPlan(){
  const d=deshacerPlan;
  if(!d)return;
  if(!persistPlan(d.plan)){
    planStatus(errorDelPlan||"No se pudo deshacer.");
    return
  }
  try{
    savePlanPortions(d.porciones)
  }catch(e){
  }
  logPlanChange("Deshecho: "+d.texto);
  renderPlan();
  planStatus("Listo, se deshizo.")
}
// Copia fechada de una semana. Si esa fecha ya tiene otra copia, no se pisa: el plan va también a una variación
// "Semana del 19/10" (o se reutiliza la que ya tiene el mismo contenido). Si algo no se puede guardar, tira un error.
function mismoPlan(a,b){
  const x=migratePlan(a&&typeof a==="object"?a:{}),y=migratePlan(b&&typeof b==="object"?b:{});
  return DAYS.every(([d])=>SLOTS.every(([s])=>(x[d][s]||null)===(y[d][s]||null)))
}
function guardarCopiaDeSemana(lunes,plan,saved,conVariacion){
  const weeks=loadDatedWeeks();
  if(!weeks[lunes]){
    weeks[lunes]=datedWeekSnapshot(plan,saved);
    localStorage.setItem(DATED_WEEKS_KEY,JSON.stringify(weeks));
    return {
      copia:true,variacion:null
    }
  }
  if(!conVariacion||mismoPlan(weeks[lunes].plan,plan))return {
    copia:false,variacion:null
  };
  const vars=loadVars(),base="Semana del "+typedAppDateLabel(lunes).slice(0,5);
  let nombre=base,n=2;
  while(vars[nombre]&&!mismoPlan(vars[nombre],plan))nombre=base+" ("+(n++)+")";
  if(!vars[nombre]){
    vars[nombre]=JSON.parse(JSON.stringify(plan));
    if(!persistVars(vars))throw Error("No se pudo guardar la variación.")
  }
  return {
    copia:false,variacion:nombre
  }
}
// Primera escritura de una semana nueva (plan o porciones): si la semana anterior tenía comidas y no tiene copia,
// se guarda antes. Devuelve false si no se pudo: entonces no se escribe el cambio (se puede volver a intentar).
function copiaAutomaticaDeSemana(){
  try{
    const s=semanaDelPlan();
    if(!s||s>=semanaActual())return true;
    const plan=loadPlan();
    if(!planTieneComidas(plan))return true;
    guardarCopiaDeSemana(s,plan,loadSaved(),false);
    return true
  }catch(e){
    errorDelPlan="No se pudo guardar la copia de la semana anterior, así que el cambio no se hizo. Liberá espacio y probá de nuevo.";
    return false
  }
}
// Semana nueva: seguir con el mismo plan (queda registrado y el aviso no vuelve).
function repetirPlanEstaSemana(){
  const s=semanaDelPlan();
  let extra="";
  if(s)try{
    guardarCopiaDeSemana(s,loadPlan(),loadSaved(),false)
  }catch(e){
    extra=" No se pudo guardar la copia de la semana anterior."
  }
  logPlanChange("Plan repetido para la semana del "+typedAppDateLabel(semanaActual()).slice(0,5));
  renderPlan();
  planStatus("Listo: seguís con el mismo plan esta semana."+extra)
}
// Semana nueva: empezar de cero. Antes guarda la copia (o la variación); si no se puede, el plan no cambia.
// Deshacer devuelve el plan y las porciones; la copia y la variación quedan guardadas.
function empezarSemanaDeCero(){
  const s=semanaDelPlan()||mondayOf(localTrainingDate(new Date(Date.now()-7*864e5))),plan=loadPlan(),porciones=loadPlanPortions();
  let r;
  try{
    r=guardarCopiaDeSemana(s,plan,loadSaved(),true)
  }catch(e){
    renderPlan();
    planStatus("No se pudo guardar una copia; tu plan no cambió.");
    return false
  }
  const vacio=migratePlan({});
  if(!persistPlan(vacio)){
    planStatus(errorDelPlan||"No se pudo vaciar el plan.");
    return false
  }
  prunePlanPortions(plan,vacio);
  const donde=r.variacion?"en Planes guardados (\""+r.variacion+"\")":"en Semanas anteriores ("+typedAppDateLabel(s).slice(0,5)+")";
  logPlanChange("Semana nueva: plan vaciado; el anterior quedó "+donde);
  deshacerPlan={
    texto:"Empezaste de cero. Tu plan anterior quedó "+donde,plan,porciones
  };
  renderPlan();
  return true
}
// Copiar un día a otros días (una sola escritura, con historial y Deshacer).
function copiarDiaDelPlan(desde,hacia){
  const destinos=(hacia||[]).filter(d=>d!==desde&&DAYS.some(x=>x[0]===d));
  if(!DAYS.some(x=>x[0]===desde)||!destinos.length)throw Error("Elegí al menos un día.");
  const plan=loadPlan(),porciones=loadPlanPortions(),nuevo=JSON.parse(JSON.stringify(plan));
  for(const d of destinos)nuevo[d]={
    ...plan[desde]
  };
  if(!persistPlan(nuevo))throw Error(errorDelPlan||"No se pudo copiar.");
  prunePlanPortions(plan,nuevo);
  const texto=planDayName(desde)+" copiado a "+juntarY(destinos.map(d=>planDayName(d).toLowerCase()));
  logPlanChange(texto);
  deshacerPlan={
    texto,plan,porciones
  };
  renderPlan();
  planStatus(texto+".")
}
const PLAN_PORTIONS_KEY="miPlatoFacil_planPortions_v1",PLAN_HISTORY_KEY="miPlatoFacil_planHistory_v1";
function validPlanPortions(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=28&&Object.entries(o).every(([k,v])=>/^(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\|(desayuno|merienda|almuerzo|cena)$/.test(k)&&typeof v==="number"&&Number.isFinite(v)&&v>=0.25&&v<=100)
}
function loadPlanPortions(){
  try{
    const o=JSON.parse(localStorage.getItem(PLAN_PORTIONS_KEY)||"{}");
    return validPlanPortions(o)?o:{
    }
  }catch(e){
    return {
    }
  }
}
function savePlanPortions(o){
  if(!validPlanPortions(o))throw Error("Porciones inválidas.");
  if(Object.keys(o).length)localStorage.setItem(PLAN_PORTIONS_KEY,JSON.stringify(o));
  else localStorage.removeItem(PLAN_PORTIONS_KEY)
}
function validPlanHistory(a){
  return Array.isArray(a)&&a.length<=100&&a.every(x=>!!x&&typeof x==="object"&&typeof x.at==="string"&&x.at.length<=40&&typeof x.text==="string"&&x.text.trim().length>0&&x.text.length<=200)
}
function loadPlanHistory(){
  try{
    const a=JSON.parse(localStorage.getItem(PLAN_HISTORY_KEY)||"[]");
    return validPlanHistory(a)?a:[]
  }catch(e){
    return []
  }
}
function logPlanChange(text){
  try{
    const a=loadPlanHistory();
    a.unshift({
      at:new Date().toISOString(),text:String(text).slice(0,200)
    });
    localStorage.setItem(PLAN_HISTORY_KEY,JSON.stringify(a.slice(0,100)))
  }catch(e){
  }
}
function planEntriesFlat(){
  const plan=loadPlan(),saved=loadSaved(),byId={
  };
  saved.forEach(p=>{
    byId[p.id]=p
  });
  const portions=loadPlanPortions(),out=[];
  DAYS.forEach(([day])=>SLOTS.forEach(([slot])=>{
    const id=plan[day]?plan[day][slot]:null;if(id&&byId[id])out.push({
      day,slot,item:byId[id],portions:portions[day+"|"+slot]||null
    })
  }));
  return out
}
function portionFactor(portions,amount){
  return portions&&amount&&amount.yield>0?portions/amount.yield:1
}
function planDayName(key){
  const d=DAYS.find(x=>x[0]===key);
  return d?d[1]:key
}
function planSlotName(key){
  const s=SLOTS.find(x=>x[0]===key);
  return s?s[1].replace(/^\S+\s/,""):key
}
function prunePlanPortions(oldPlan,newPlan){
  try{
    const p=loadPlanPortions();
    let changed=false;
    for(const k of Object.keys(p)){
      const [d,s]=k.split("|");
      if(!newPlan[d]||!oldPlan[d]||!newPlan[d][s]||newPlan[d][s]!==oldPlan[d][s]){
        delete p[k];
        changed=true
      }
    }
    if(changed)savePlanPortions(p)
  }catch(e){
  }
}
function renderPlanHistory(){
  const box=document.getElementById("planHistoryList"),a=loadPlanHistory();
  box.replaceChildren(...a.map(x=>ce("p","screen__hint",fmtWhen(x.at)+" · "+x.text)));
  if(!a.length)box.append(ce("p","screen__hint","Todavía no hay cambios registrados."))
}
function reuseDatedWeek(key){
  const week=loadDatedWeeks()[key];
  if(!week)throw Error("La copia ya no está disponible.");
  if(!window.confirm("¿Reemplazar el plan actual por las comidas de esta semana? Si querés conservar el plan actual, guardalo antes como variación."))return false;
  const saved=loadSaved(),ids=new Set(saved.map(p=>p.id)),plan=migratePlan({
  });
  let added=0;
  for(const [day] of DAYS)for(const [slot] of SLOTS){
    const id=week.plan[day]&&week.plan[day][slot];
    if(!id)continue;
    if(!ids.has(id)){
      const snap=week.saved.find(p=>p&&p.id===id);
      if(!snap)continue;
      saved.push(JSON.parse(JSON.stringify(snap)));
      ids.add(id);
      added++
    }
    plan[day][slot]=id
  }
  if(added&&!persistSaved(saved))throw Error("No se pudieron recuperar los platos de esa semana. El plan no cambió.");
  const old=loadPlan();
  if(!persistPlan(plan))throw Error("No se pudo actualizar el plan.");
  prunePlanPortions(old,plan);
  logPlanChange("Semana del "+typedAppDateLabel(key)+" usada como plan actual"+(added?" ("+added+" platos recuperados)":""));
  renderPlan();
  return added
}
function planItemsFlat(){
  const plan=loadPlan();
  const saved=loadSaved();
  const byId={
  };
  saved.forEach(p=>{
    byId[p.id]=p
  });
  const out=[];
  DAYS.forEach(function(d){
    SLOTS.forEach(function(s){
      const id=plan[d[0]]?plan[d[0]][s[0]]:null;if(id&&byId[id])out.push(byId[id])
    })
  });
  return out
}
// Desde la v15 devuelve alimentos que se compran (comprables, en 35-comida-real.js): nunca formas ni opciones dobles.
function extractIngredients(item){
  const out=[];
  if(item&&Array.isArray(item.recipeIngredients))return item.recipeIngredients.filter(x=>typeof x==="string"&&x.trim());
  const st=item.state;
  if(st&&typeof st==="object"){
    ["verduras","almidones","proteinas","legCarb","legProt"].forEach(function(k){
      (Array.isArray(st[k])?st[k]:[]).forEach(function(o){
        if(o&&o.name)out.push(...comprables(o.name))
      })
    });
    ["fruta","bfprot","bfcarb","grasa","snack","pre"].forEach(function(k){
      const o=st[k];if(o&&o.name&&o.name!=="No sumo grasa"&&o.name!=="No elegido")out.push(...comprables(o.name))
    });
    return out
  }
  const lines=Array.isArray(item.lines)?item.lines:[];
  lines.forEach(function(ln){
    const idx=ln.indexOf(": ");if(idx<0)return;ln.slice(idx+2).split(", ").forEach(function(part){
      const name=part.trim();if(name&&name!=="No elegido"&&name!=="No sumo grasa")out.push(...comprables(name))
    })
  });
  return out
}
