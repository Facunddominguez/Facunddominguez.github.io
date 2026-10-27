// Mi Plato Fácil · Plan semanal, variaciones, recetas en el plan, porciones e historial.
// Parte 11 de 30: los archivos se unen en este orden (el número define el orden de arranque).
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
function persistPlan(o){
  try{
    localStorage.setItem(PKEY,JSON.stringify(o));
    return true
  }catch(e){
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
  const plan=loadPlan();
  if(!plan[dayKey])plan[dayKey]={
    desayuno:null,merienda:null,almuerzo:null,cena:null
  };
  const before=plan[dayKey][slot]||null;
  plan[dayKey][slot]=id||null;
  persistPlan(plan);
  if(before!==(id||null)){
    try{
      const p=loadPlanPortions();
      if(p[dayKey+"|"+slot]!==undefined){
        delete p[dayKey+"|"+slot];
        savePlanPortions(p)
      }
    }catch(e){
    }
    const it=id?loadSaved().find(x=>x.id===id):null;
    logPlanChange(planDayName(dayKey)+" · "+planSlotName(slot)+": "+(it?"asignado "+savedItemTitle(it):"quitado"))
  }
  renderPlan();
  planStatus(id?"Asignado.":"Quitado.")
}
function clearSlot(dayKey,slot){
  setSlot(dayKey,slot,null)
}
function clearPlan(){
  if(window.confirm("¿Vaciar todo el plan semanal?")){
    const old=loadPlan();
    persistPlan(migratePlan({
    }));
    prunePlanPortions(old,migratePlan({
    }));
    logPlanChange("Plan vaciado");
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
  persistPlan(migratePlan(vars[nm]));
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
function planPlateLabel(it){
  return (it.fav?"⭐ ":"")+(it.recipeSourceId?"📖":typeEmoji(it.type))+" "+(it.note?it.note+" · ":"")+savedItemTitle(it)
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
function assignSavedRecipeToPlan(){
  const status=document.getElementById("planRecipeAssignStatus");
  try{
    const id=document.getElementById("planRecipeSelect").value,day=document.getElementById("planRecipeDay").value,slot=document.getElementById("planRecipeSlot").value;
    if(!DAYS.some(d=>d[0]===day)||!SLOTS.some(d=>d[0]===slot))throw Error("Seleccioná un día y una comida válidos.");
    const recipe=loadRecipeDetails()[id];
    if(!recipe)throw Error("Seleccioná una receta guardada.");
    const amounts=loadRecipeAmounts(),amount=recipe.amountsTitle&&amounts[recipe.amountsTitle];
    if(!amount||!amount.rows.length)throw Error("Esta receta necesita ingredientes y cantidades vinculados para incorporarse al plan y a Compras. Cargalos en ⚖️ Mis cantidades por receta (Descubrí → Con lo que tengo).");
    if(amount.rows.some(row=>!row.name||!row.name.trim()))throw Error("Revisá los ingredientes de esta receta.");
    const plan=loadPlan(),existing=plan[day]&&plan[day][slot];
    if(existing&&!window.confirm("Ya hay una comida asignada. ¿Reemplazarla por esta receta?"))return;
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
    setSlot(day,slot,snapshot.id);
    renderCompras();
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
function renderPlan(){
  const cont=document.getElementById("planList");
  if(!cont)return;
  refreshVarSelect();
  const plan=loadPlan();
  const saved=loadSaved();
  const byId={
  };
  saved.forEach(p=>{
    byId[p.id]=p
  });
  const portionsMap=loadPlanPortions(),yields={
  };
  try{
    const rd=loadRecipeDetails(),am=loadRecipeAmounts();
    for(const r of Object.values(rd))if(r.amountsTitle&&am[r.amountsTitle])yields[r.id]=am[r.amountsTitle].yield
  }catch(e){
  }
  const pools={
    desayuno:saved.filter(p=>p.type==="desayuno"),plato:saved.filter(p=>p.type==="plato")
  };
  let total=0;
  const nodes=DAYS.map(function(dpair){
    const dayKey=dpair[0],dayLabel=dpair[1];const day=ce("div","plan-day");day.append(ce("h3","plan-day__title",dayLabel));SLOTS.forEach(function(spair){
      const slot=spair[0],slotLabel=spair[1];const wrap=ce("div","plan-slot");wrap.append(ce("div","plan-slot__label",slotLabel));const id=plan[dayKey]?plan[dayKey][slot]:null;const it=id?byId[id]:null;if(it){
        total++;const nm=ce("div","plan-slot__plate",planPlateLabel(it));const det=ce("div","plan-slot__lines",savedItemLines(it).join(" · "));const row=ce("div","plan-slot__row");const del=ce("button","button button--danger","Quitar");del.type="button";del.style.minWidth="86px";del.dataset.planClear=dayKey+"|"+slot;row.append(del);const pk=dayKey+"|"+slot;if(dayKey===todayPlanDay()){
          const done=eatenToday(it,slot),eat=ce("button","button button--soft",done?"✓ Comido hoy":"Lo comí hoy");eat.type="button";eat.dataset.planEaten=pk;eat.disabled=done;eat.setAttribute("aria-label",(done?"Ya registrado hoy: ":"Registrar que comí hoy ")+savedItemTitle(it));row.append(eat)
        }if(it.recipeSourceId){
          const inp=ce("input"),lab=ce("label","plan-portions");inp.type="text";inp.inputMode="decimal";inp.maxLength=6;inp.value=portionsMap[pk]!==undefined?String(portionsMap[pk]).replace(".",","):"";inp.placeholder=yields[it.recipeSourceId]?String(yields[it.recipeSourceId]):"";inp.dataset.planPortions=pk;inp.setAttribute("aria-label","Porciones para "+planDayName(dayKey)+" "+planSlotName(slot));lab.append(ce("span",null,"Porciones"),inp);row.append(lab)
        }wrap.append(nm,det,row);if(it.recipeSourceId&&yields[it.recipeSourceId])wrap.append(ce("div","plan-slot__lines","La receta rinde "+String(yields[it.recipeSourceId]).replace(".",",")+" porciones."+(portionsMap[pk]!==undefined?" Compras calcula para "+String(portionsMap[pk]).replace(".",",")+".":" Compras usa la receta completa.")))
      }else{
        const pool=pools[slotPool(slot)];if(pool.length){
          const row=ce("div","plan-slot__row");const sel=ce("select");sel.dataset.planSelect=dayKey+"|"+slot;const op0=ce("option",null,"Elegir…");op0.value="";sel.append(op0);pool.forEach(function(p){
            const o=ce("option",null,planPlateLabel(p).slice(0,54));o.value=p.id;sel.append(o)
          });const addBtn=ce("button","button button--soft","Asignar");addBtn.type="button";addBtn.style.minWidth="88px";addBtn.dataset.planSet=dayKey+"|"+slot;row.append(sel,addBtn);wrap.append(row)
        }else{
          wrap.append(ce("div","plan-empty","Guardá platos de este tipo para asignarlos."))
        }
      }appendPlanAssignmentControls(wrap,dayKey,slot,pools[slotPool(slot)],it);day.append(wrap)
    });return day
  });
  cont.replaceChildren(...nodes);
  const hint=document.getElementById("planHint");
  if(hint)hint.textContent=total?("Tenés "+total+" comida"+(total===1?"":"s")+" asignada"+(total===1?"":"s")+" esta semana."):"Asigná un plato por comida en cada día. Después generá la lista de compras."
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
function extractIngredients(item){
  const out=[];
  if(item&&Array.isArray(item.recipeIngredients))return item.recipeIngredients.filter(x=>typeof x==="string"&&x.trim());
  const st=item.state;
  if(st&&typeof st==="object"){
    ["verduras","almidones","proteinas","legCarb","legProt"].forEach(function(k){
      (Array.isArray(st[k])?st[k]:[]).forEach(function(o){
        if(o&&o.name)out.push(o.name.indexOf("Opción ocasional: ")===0?o.name.slice(18):o.name)
      })
    });
    ["fruta","bfprot","bfcarb","grasa","snack","pre"].forEach(function(k){
      const o=st[k];if(o&&o.name&&o.name!=="No sumo grasa"&&o.name!=="No elegido")out.push(o.name)
    });
    return out
  }
  const lines=Array.isArray(item.lines)?item.lines:[];
  lines.forEach(function(ln){
    const idx=ln.indexOf(": ");if(idx<0)return;ln.slice(idx+2).split(", ").forEach(function(part){
      const name=part.trim();if(name&&name!=="No elegido"&&name!=="No sumo grasa")out.push(name)
    })
  });
  return out
}
