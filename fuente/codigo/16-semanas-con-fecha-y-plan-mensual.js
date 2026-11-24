// Mi Plato Fácil · Exportar el plan, semanas con fecha, fechas escritas y plan mensual.
// Parte 17: los archivos se unen en orden según su número, que define el orden de arranque.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como SemanasFechadas.nombre().
var SemanasFechadas={
escapePlanExport(value){
  return String(value==null?"":value).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]))
},
buildWeeklyPlanExport(plan,saved,start){
  const date=planExportDate(start),byId=new Map(saved.map(x=>[x.id,x]));
  let assigned=0;
  const sections=DAYS.map(([key,label],i)=>{
    let heading=label;if(date){
      const d=new Date(date.getFullYear(),date.getMonth(),date.getDate()+i,12);heading+=" · "+d.toLocaleDateString("es-AR")
    }const rows=SLOTS.map(([slot,title])=>{
      const id=plan[key]&&plan[key][slot],item=id?byId.get(id):null;let content="Sin asignar";if(item){
        assigned++;content="<strong>"+SemanasFechadas.escapePlanExport(item.note||item.title||"Plato")+"</strong>"+(item.note&&item.title?"<p>"+SemanasFechadas.escapePlanExport(item.title)+"</p>":"")+"<ul>"+savedItemLines(item).map(x=>"<li>"+SemanasFechadas.escapePlanExport(x)+"</li>").join("")+"</ul>"
      }else if(id)content="Plato no disponible en los guardados actuales";return "<tr><th scope='row'>"+SemanasFechadas.escapePlanExport(title)+"</th><td>"+content+"</td></tr>"
    }).join("");return "<section><h2>"+SemanasFechadas.escapePlanExport(heading)+"</h2><table>"+rows+"</table></section>"
  }).join("");
  return {
    assigned,html:"<!doctype html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Mi plato fácil · Plan semanal</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:auto;padding:24px;color:#10201b;background:#f4f8f6}h1,h2{color:#0b6b57}section{background:white;border:1px solid #dfe9e5;border-radius:16px;padding:16px;margin:16px 0;break-inside:avoid}table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #dfe9e5}th{width:25%}p{margin:6px 0}ul{padding-left:20px}@media print{body{background:white;padding:0}section{border-radius:0}}</style></head><body><h1>Mi plato fácil</h1><p>Plan semanal · "+(date?"Fechas elegidas para esta copia":"Sin fechas asignadas")+"</p><p>"+assigned+" comidas asignadas. Copia de consulta, no es un respaldo importable.</p>"+sections+"</body></html>"
  }
},
// v19.1: "Compartir la semana → Descargar HTML" baja la semana que se está viendo (esta o la que viene), con su lunes en el nombre.
downloadWeeklyPlan(){
  let url;
  try{
    const start=Semana.viendoProxima()?Semana.lunesSiguiente():Semana.semanaActual(),result=SemanasFechadas.buildWeeklyPlanExport(loadPlan(),MisPlatos.loadSaved(),start);
    if(!result.assigned){
      planStatus("Asigná al menos un plato antes de descargar el plan.");
      return
    }
    url=URL.createObjectURL(new Blob([result.html],{
      type:"text/html;charset=utf-8"
    }));
    const a=document.createElement("a");
    a.href=url;
    a.download="mi-plan-semanal-"+start+".html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    planStatus("Descargamos la semana del "+typedAppDateLabel(start).slice(0,5)+" en HTML.")
  }catch(e){
    if(url)URL.revokeObjectURL(url);
    planStatus(e.message||"No se pudo descargar el plan.")
  }
},
datedWeekMessage(text){
  document.getElementById("datedWeekStatus").textContent=text
},
saveDatedWeek(){
  try{
    // La copia sale del plan de esta semana (no de otra copia que se esté viendo).
    const key=datedWeekKey(),viendo=semanaFechada;
    semanaFechada=null;
    let plan;
    try{plan=loadPlan()}finally{semanaFechada=viendo}
    const saved=MisPlatos.loadSaved(),result=SemanasFechadas.buildWeeklyPlanExport(plan,saved,key);
    if(!result.assigned)throw new Error("Asigná al menos un plato en el plan actual antes de copiarlo.");
    const weeks=loadDatedWeeks();
    if(weeks[key]&&!window.confirm("Ya hay una copia para esta semana. ¿Reemplazar solo esa copia?"))return;
    weeks[key]=datedWeekSnapshot(plan,saved);
    localStorage.setItem(DATED_WEEKS_KEY,JSON.stringify(weeks));
    renderDatedWeek();
    SemanasFechadas.datedWeekMessage("Copia guardada. El plan actual y las demás semanas no cambiaron.")
  }catch(e){
    SemanasFechadas.datedWeekMessage(e.message||"No se pudo guardar la semana.")
  }
},
deleteDatedWeek(){
  try{
    const key=datedWeekKey(),weeks=loadDatedWeeks();
    if(!weeks[key])throw new Error("No hay una copia para esta semana.");
    if(!window.confirm("¿Eliminar únicamente la copia fechada de esta semana?"))return;
    delete weeks[key];
    localStorage.setItem(DATED_WEEKS_KEY,JSON.stringify(weeks));
    renderDatedWeek();
    SemanasFechadas.datedWeekMessage("Copia eliminada. El plan actual no cambió.")
  }catch(e){
    SemanasFechadas.datedWeekMessage(e.message||"No se pudo eliminar la copia.")
  }
},
downloadDatedWeek(){
  let url;
  try{
    const key=datedWeekKey(),week=loadDatedWeeks()[key];
    if(!week)throw new Error("Guardá primero una copia para esta semana.");
    const result=SemanasFechadas.buildWeeklyPlanExport(week.plan,week.saved,key);
    url=URL.createObjectURL(new Blob([result.html],{
      type:"text/html;charset=utf-8"
    }));
    const a=ce("a");
    a.href=url;
    a.download="mi-semana-"+key+".html";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    SemanasFechadas.datedWeekMessage("Descarga solicitada para la semana guardada.")
  }catch(e){
    if(url)URL.revokeObjectURL(url);
    SemanasFechadas.datedWeekMessage(e.message||"No se pudo descargar.")
  }
},
buildDatedWeekEdit(week,changes,currentSaved){
  const copy=JSON.parse(JSON.stringify(week));
  const current=new Map(currentSaved.map(p=>[p.id,p]));
  for(const change of changes){
    if(!DAYS.some(([d])=>d===change.day)||!SLOTS.some(([s])=>s===change.slot))throw new Error("Comida o día inválido.");
    if(change.value==="keep")continue;
    if(!copy.plan[change.day])copy.plan[change.day]={
    };
    if(change.value==="clear"){
      copy.plan[change.day][change.slot]=null;
      continue
    }
    if(!change.value.startsWith("id:"))throw new Error("Selección inválida.");
    const id=change.value.slice(3),item=current.get(id);
    if(!item||item.type!==slotPool(change.slot))throw new Error("El plato seleccionado ya no está disponible o no corresponde a esta comida.");
    const snapshot=JSON.parse(JSON.stringify(item));
    let storedId=id;
    const existing=copy.saved.find(p=>p.id===id);
    if(existing&&JSON.stringify(existing)!==JSON.stringify(snapshot)){
      let n=1;
      while(copy.saved.some(p=>p.id===id+"_dated_"+n))n++;
      storedId=id+"_dated_"+n;
      snapshot.id=storedId
    }
    if(!copy.saved.some(p=>p.id===storedId))copy.saved.push(snapshot);
    copy.plan[change.day][change.slot]=storedId
  }
  return copy
},
parseTypedAppDate(value){
  const t=String(value||"").trim();
  if(!t)return "";
  let m=t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/),iso;
  if(m)iso=m[3]+"-"+m[2]+"-"+m[1];
  else if(/^\d{4}-\d{2}-\d{2}$/.test(t))iso=t;
  else throw new Error("Escribí DD/MM/AAAA, por ejemplo 27/07/2026.");
  if(!Rutina.validTrainingDate(iso))throw new Error("La fecha no existe. Revisá día, mes y año.");
  return iso
},
commitTypedAppDate(id,required){
  const hidden=document.getElementById(id),text=document.getElementById(id+"Text"),error=document.getElementById(id+"Error");
  try{
    const iso=SemanasFechadas.parseTypedAppDate(text.value);
    if(required&&!iso)throw new Error("Ingresá una fecha.");
    if(id!=="trainingExceptionDate"&&iso&&new Date(iso+"T12:00:00").getDay()!==1)throw new Error("Para una semana, ingresá la fecha de un lunes.");
    const changed=hidden.value!==iso;
    hidden.value=iso;
    error.textContent="";
    text.setAttribute("aria-invalid","false");
    if(changed)hidden.dispatchEvent(new Event("change",{
      bubbles:true
    }));
    return true
  }catch(e){
    error.textContent=e.message;
    text.setAttribute("aria-invalid","true");
    hidden.value="";
    return false
  }
}
};
function planExportDate(value){
  if(!value)return null;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error("Elegí una fecha válida.");
  const d=new Date(value+"T12:00:00");
  if(isNaN(d.getTime())||Rutina.localTrainingDate(d)!==value)throw new Error("Elegí una fecha válida.");
  if(d.getDay()!==1)throw new Error("La fecha debe ser un lunes, para respetar el orden del plan.");
  return d
}
const DATED_WEEKS_KEY="miPlatoFacil_datedWeeks_v1";
function loadDatedWeeks(){
  try{
    const o=JSON.parse(localStorage.getItem(DATED_WEEKS_KEY)||"{}");
    if(!o||typeof o!=="object"||Array.isArray(o))return {
    };
    return Object.fromEntries(Object.entries(o).filter(([key,v])=>{
      try{
        return !!planExportDate(key)&&v&&v.version===1&&v.plan&&typeof v.plan==="object"&&Array.isArray(v.saved)
      }catch(e){
        return false
      }
    }))
  }catch(e){
    return {
    }
  }
}
function datedWeekSnapshot(plan,saved){
  return {
    version:1,plan:JSON.parse(JSON.stringify(plan)),saved:JSON.parse(JSON.stringify(saved.filter(p=>DAYS.some(([day])=>SLOTS.some(([slot])=>plan[day]&&plan[day][slot]===p.id)))))
  }
}
function datedWeekKey(){
  const key=document.getElementById("datedWeekStart").value;
  if(!key||!planExportDate(key))throw new Error("Elegí el lunes de la semana.");
  return key
}
// v19.2: la semana elegida se ve como en Semana (tarjetas por día) y se cambia con la misma hoja; sin copia, solo el aviso.
function renderDatedWeek(){
  const box=document.getElementById("datedWeekView"),acciones=document.getElementById("datedWeekAcciones"),weeks=loadDatedWeeks();
  if(!box)return;
  let key;
  try{
    key=datedWeekKey()
  }catch(e){
    semanaFechada=null;
    box.replaceChildren(ce("p","screen__hint",e.message));
    if(acciones)acciones.hidden=true;
    return
  }
  const week=weeks[key];
  const usar=document.querySelector("#planHerramientas [data-planes-guardados]");
  if(!week){
    semanaFechada=null;
    box.replaceChildren(ce("p","screen__hint","Esta semana no tiene copia guardada. Guardá una con el botón de arriba."));
    if(acciones)acciones.hidden=true;
    if(usar)usar.hidden=true;
    pintarCalendarioDeSemanas();
    return
  }
  // Solo cuenta como "copia abierta" (y cambia lo que lee loadPlan) mientras esta pantalla está a la vista.
  semanaFechada=document.getElementById("planHerramientas").classList.contains("is-active")?key:null;
  if(acciones){
    acciones.hidden=false;
    const r=acciones.querySelector("[data-dated-reuse]");
    if(r)r.dataset.datedReuse=key
  }
  if(usar)usar.hidden=!Object.keys(Semana.loadVars()).length;
  const byId=new Map(week.saved.map(p=>[p.id,p])),plan=Semana.migratePlan(week.plan);
  box.replaceChildren(...DAYS.map(([day,label],i)=>{
    const date=planExportDate(key);
    date.setDate(date.getDate()+i);
    const dia=ce("div","semana-dia"),cont=ce("div","semana-huecos");
    dia.dataset.fechadaDia=day;
    dia.append(ce("h3","semana-dia__titulo",label+" "+date.getDate()+"/"+(date.getMonth()+1)),cont);
    cont.append(...SLOTS.map(([slot])=>{
      const id=plan[day]&&plan[day][slot];
      return crearHueco(day,slot,id?byId.get(id)||null:null,{})
    }));
    return dia
  }));
  pintarCalendarioDeSemanas()
}
// El lunes de una fecha (clave AAAA-MM-DD).
function lunesDe(iso){
  const d=new Date(iso+"T12:00:00");
  d.setDate(d.getDate()-((d.getDay()+6)%7));
  return Rutina.localTrainingDate(d)
}
// Elige la semana (por su lunes): escribe el lunes, sigue al calendario y pinta la semana.
function elegirSemanaFechada(lunes){
  document.getElementById("datedWeekStart").value=lunes;
  document.getElementById("datedWeekStartText").value=typedAppDateLabel(lunes);
  document.getElementById("datedWeekStartError").textContent="";
  document.getElementById("datedWeekStartText").setAttribute("aria-invalid","false");
  SemanasFechadas.datedWeekMessage("");
  const d=new Date(lunes+"T12:00:00");
  if(d.getMonth()!==monthlyPlanCursor.getMonth()||d.getFullYear()!==monthlyPlanCursor.getFullYear())monthlyPlanCursor=new Date(d.getFullYear(),d.getMonth(),1);
  monthlyPlanSelected=lunes;
  renderDatedWeek()
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.datedSave!==undefined)return SemanasFechadas.saveDatedWeek();
  if(b.dataset.datedDelete!==undefined)return SemanasFechadas.deleteDatedWeek();
  if(b.dataset.datedDownload!==undefined)return SemanasFechadas.downloadDatedWeek();
  if(b.dataset.datedShift){
    try{
      const d=planExportDate(datedWeekKey());d.setDate(d.getDate()+Number(b.dataset.datedShift));elegirSemanaFechada(Rutina.localTrainingDate(d))
    }catch(err){
      SemanasFechadas.datedWeekMessage(err.message)
    }
    return
  }
  if(b.dataset.planGuardar!==undefined){
    let plan=null;
    try{plan=loadPlan()}catch(err){}
    return Semana.saveVariation(semanaFechada?plan:null)
  }
});
document.getElementById("datedWeekStart").addEventListener("change",()=>{
  const k=document.getElementById("datedWeekStart").value;
  SemanasFechadas.datedWeekMessage("");
  if(k)elegirSemanaFechada(k);else renderDatedWeek()
});
{
  const d=new Date();
  d.setDate(d.getDate()-((d.getDay()+6)%7));
  document.getElementById("datedWeekStart").value=Rutina.localTrainingDate(d)
}
Existencias.startupGuard("Semanas fechadas",renderDatedWeek);
function typedAppDateLabel(iso){
  return iso?iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+iso.slice(0,4):""
}
function syncTypedAppDate(id){
  const hidden=document.getElementById(id),text=document.getElementById(id+"Text");
  if(document.activeElement!==text)text.value=typedAppDateLabel(hidden.value)
}
const typedDateIds=["trainingExceptionDate","datedWeekStart"];
typedDateIds.forEach(id=>{
  const text=document.getElementById(id+"Text");syncTypedAppDate(id);text.addEventListener("input",()=>{
    const digits=text.value.replace(/\D/g,"").slice(0,8);if(!text.value.includes("-"))text.value=digits.slice(0,2)+(digits.length>2?"/"+digits.slice(2,4):"")+(digits.length>4?"/"+digits.slice(4):"")
  });text.addEventListener("change",()=>SemanasFechadas.commitTypedAppDate(id,false));text.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      e.preventDefault();SemanasFechadas.commitTypedAppDate(id,true);text.blur()
    }
  });document.getElementById(id).addEventListener("change",()=>syncTypedAppDate(id))
});
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;let id=null;if(b.dataset.trainingExceptionSave!==undefined)id="trainingExceptionDate";if(b.dataset.datedSave!==undefined||b.dataset.datedDownload!==undefined||b.dataset.datedDelete!==undefined)id="datedWeekStart";if(id&&!SemanasFechadas.commitTypedAppDate(id,true)){
    e.preventDefault();e.stopImmediatePropagation();document.getElementById(id+"Text").focus()
  }
},true);
document.addEventListener("click",e=>{
  if(e.target.closest("[data-train-date],[data-train-quick],[data-dated-open],[data-dated-shift]"))typedDateIds.forEach(syncTypedAppDate)
});
var monthlyPlanCursor=null,monthlyPlanSelected=null;
monthlyPlanCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);monthlyPlanSelected=Rutina.localTrainingDate(new Date());
function monthlyPlanDayData(date,weeks){
  const monday=new Date(date.getFullYear(),date.getMonth(),date.getDate()-((date.getDay()+6)%7),12),weekKey=Rutina.localTrainingDate(monday),week=weeks[weekKey],dayKey=DAYS[(date.getDay()+6)%7][0];
  return {
    weekKey,week,rows:SLOTS.map(([slot,label])=>{
      const id=week&&week.plan[dayKey]&&week.plan[dayKey][slot],item=week&&week.saved.find(p=>p.id===id);return {
        slot,label,id,item
      }
    })
  }
}
// v19.2: el calendario es lo primero de "Semanas anteriores y mes": marca los días con comidas de una copia y la semana elegida;
// tocar un día elige su semana (la lista de comidas está debajo, igual que en Semana).
function pintarCalendarioDeSemanas(){
  renderMonthlyPlan()
}
function renderMonthlyPlan(){
  const grid=document.getElementById("monthlyPlanGrid"),title=document.getElementById("monthlyPlanTitle");
  if(!grid||!monthlyPlanCursor)return;
  const weeks=loadDatedWeeks(),y=monthlyPlanCursor.getFullYear(),m=monthlyPlanCursor.getMonth(),today=Rutina.localTrainingDate(new Date());
  let elegida="";
  try{elegida=document.getElementById("datedWeekStart").value}catch(e){}
  title.textContent=monthlyPlanCursor.toLocaleDateString("es-AR",{
    month:"long",year:"numeric"
  });
  const nodes=["L","M","M","J","V","S","D"].map(x=>ce("span",null,x));
  for(let i=0;i<(new Date(y,m,1).getDay()+6)%7;i++)nodes.push(ce("span"));
  for(let n=1;n<=new Date(y,m+1,0).getDate();n++){
    const date=new Date(y,m,n,12),key=Rutina.localTrainingDate(date),data=monthlyPlanDayData(date,weeks),count=data.rows.filter(r=>r.item).length,enSemana=!!elegida&&data.weekKey===elegida,
      b=ce("button","train-date"+(key===today?" is-today":"")+(enSemana?" is-selected":""),String(n));
    b.type="button";
    b.dataset.monthlyPlanDate=key;
    if(count)b.dataset.mark="●";
    b.setAttribute("aria-pressed",String(enSemana));
    b.setAttribute("aria-label",date.toLocaleDateString("es-AR",{
      day:"numeric",month:"long",year:"numeric"
    })+", "+count+" comidas asignadas");
    if(key===today)b.setAttribute("aria-current","date");
    nodes.push(b)
  }
  grid.replaceChildren(...nodes)
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;
  if(b.dataset.planMonth){
    monthlyPlanCursor=new Date(monthlyPlanCursor.getFullYear(),monthlyPlanCursor.getMonth()+Number(b.dataset.planMonth),1);
    renderMonthlyPlan();
    return
  }
  if(b.dataset.monthlyPlanDate){
    monthlyPlanSelected=b.dataset.monthlyPlanDate;
    elegirSemanaFechada(lunesDe(b.dataset.monthlyPlanDate))
  }
});
