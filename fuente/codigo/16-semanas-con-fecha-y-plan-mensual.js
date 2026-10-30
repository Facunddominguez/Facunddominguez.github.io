// Mi Plato Fácil · Exportar el plan, semanas con fecha, fechas escritas y plan mensual.
// Parte 17: los archivos se unen en orden según su número, que define el orden de arranque.
function escapePlanExport(value){
  return String(value==null?"":value).replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]))
}
function planExportDate(value){
  if(!value)return null;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error("Elegí una fecha válida.");
  const d=new Date(value+"T12:00:00");
  if(isNaN(d.getTime())||localTrainingDate(d)!==value)throw new Error("Elegí una fecha válida.");
  if(d.getDay()!==1)throw new Error("La fecha debe ser un lunes, para respetar el orden del plan.");
  return d
}
function buildWeeklyPlanExport(plan,saved,start){
  const date=planExportDate(start),byId=new Map(saved.map(x=>[x.id,x]));
  let assigned=0;
  const sections=DAYS.map(([key,label],i)=>{
    let heading=label;if(date){
      const d=new Date(date.getFullYear(),date.getMonth(),date.getDate()+i,12);heading+=" · "+d.toLocaleDateString("es-AR")
    }const rows=SLOTS.map(([slot,title])=>{
      const id=plan[key]&&plan[key][slot],item=id?byId.get(id):null;let content="Sin asignar";if(item){
        assigned++;content="<strong>"+escapePlanExport(item.note||item.title||"Plato")+"</strong>"+(item.note&&item.title?"<p>"+escapePlanExport(item.title)+"</p>":"")+"<ul>"+savedItemLines(item).map(x=>"<li>"+escapePlanExport(x)+"</li>").join("")+"</ul>"
      }else if(id)content="Plato no disponible en los guardados actuales";return "<tr><th scope='row'>"+escapePlanExport(title)+"</th><td>"+content+"</td></tr>"
    }).join("");return "<section><h2>"+escapePlanExport(heading)+"</h2><table>"+rows+"</table></section>"
  }).join("");
  return {
    assigned,html:"<!doctype html><html lang='es'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Mi plato fácil · Plan semanal</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:auto;padding:24px;color:#10201b;background:#f4f8f6}h1,h2{color:#0b6b57}section{background:white;border:1px solid #dfe9e5;border-radius:16px;padding:16px;margin:16px 0;break-inside:avoid}table{width:100%;border-collapse:collapse}th,td{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #dfe9e5}th{width:25%}p{margin:6px 0}ul{padding-left:20px}@media print{body{background:white;padding:0}section{border-radius:0}}</style></head><body><h1>Mi plato fácil</h1><p>Plan semanal · "+(date?"Fechas elegidas para esta copia":"Sin fechas asignadas")+"</p><p>"+assigned+" comidas asignadas. Copia de consulta, no es un respaldo importable.</p>"+sections+"</body></html>"
  }
}
function downloadWeeklyPlan(){
  const status=document.getElementById("planExportStatus");
  let url;
  try{
    const start=document.getElementById("planExportStart").value,result=buildWeeklyPlanExport(loadPlan(),loadSaved(),start);
    if(!result.assigned){
      status.textContent="Asigná al menos un plato antes de descargar el plan.";
      return
    }
    url=URL.createObjectURL(new Blob([result.html],{
      type:"text/html;charset=utf-8"
    }));
    const a=document.createElement("a");
    a.href=url;
    a.download="mi-plan-semanal"+(start?"-"+start:"")+".html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent="Descarga solicitada. La copia refleja el plan actual y no cambia tus datos."
  }catch(e){
    if(url)URL.revokeObjectURL(url);
    status.textContent=e.message||"No se pudo descargar el plan."
  }
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-download-week]");if(b)downloadWeeklyPlan()
});
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
function datedWeekMessage(text){
  document.getElementById("datedWeekStatus").textContent=text
}
function renderDatedWeek(){
  const box=document.getElementById("datedWeekView"),list=document.getElementById("datedWeekList"),weeks=loadDatedWeeks();
  list.replaceChildren(...Object.keys(weeks).sort().map(key=>{
    const b=ce("button","filter-chip",key);b.type="button";b.dataset.datedOpen=key;return b
  }));
  let key;
  try{
    key=datedWeekKey()
  }catch(e){
    box.replaceChildren(ce("p","screen__hint",e.message));
    return
  }
  const week=weeks[key];
  if(!week){
    box.replaceChildren(ce("p","screen__hint","Esta semana no tiene una copia guardada."));
    return
  }
  const byId=new Map(week.saved.map(p=>[p.id,p]));
  box.replaceChildren(...DAYS.map(([day,label],i)=>{
    const date=planExportDate(key);date.setDate(date.getDate()+i);const card=ce("div","plan-day");card.append(ce("h3","plan-day__title",label+" · "+date.toLocaleDateString("es-AR")));SLOTS.forEach(([slot,title])=>{
      const id=week.plan[day]&&week.plan[day][slot],item=byId.get(id),row=ce("div","plan-slot");row.append(ce("div","plan-slot__label",title));row.append(ce("div","plan-slot__plate",item?(item.note||item.title||"Plato"):id?"Plato no disponible":"Sin asignar"));if(item&&savedItemLines(item).length)row.append(ce("p","plan-slot__lines",savedItemLines(item).join(" · ")));card.append(row)
    });return card
  }));
  const reuse=ce("button","button button--soft","Usar esta semana como plan actual");
  reuse.type="button";
  reuse.dataset.datedReuse=key;
  box.append(reuse)
}
function saveDatedWeek(){
  try{
    const key=datedWeekKey(),plan=loadPlan(),saved=loadSaved(),result=buildWeeklyPlanExport(plan,saved,key);
    if(!result.assigned)throw new Error("Asigná al menos un plato en el plan actual antes de copiarlo.");
    const weeks=loadDatedWeeks();
    if(weeks[key]&&!window.confirm("Ya hay una copia para esta semana. ¿Reemplazar solo esa copia?"))return;
    weeks[key]=datedWeekSnapshot(plan,saved);
    localStorage.setItem(DATED_WEEKS_KEY,JSON.stringify(weeks));
    renderDatedWeek();
    datedWeekMessage("Copia guardada. El plan actual y las demás semanas no cambiaron.")
  }catch(e){
    datedWeekMessage(e.message||"No se pudo guardar la semana.")
  }
}
function deleteDatedWeek(){
  try{
    const key=datedWeekKey(),weeks=loadDatedWeeks();
    if(!weeks[key])throw new Error("No hay una copia para esta semana.");
    if(!window.confirm("¿Eliminar únicamente la copia fechada de esta semana?"))return;
    delete weeks[key];
    localStorage.setItem(DATED_WEEKS_KEY,JSON.stringify(weeks));
    renderDatedWeek();
    datedWeekMessage("Copia eliminada. El plan actual no cambió.")
  }catch(e){
    datedWeekMessage(e.message||"No se pudo eliminar la copia.")
  }
}
function downloadDatedWeek(){
  let url;
  try{
    const key=datedWeekKey(),week=loadDatedWeeks()[key];
    if(!week)throw new Error("Guardá primero una copia para esta semana.");
    const result=buildWeeklyPlanExport(week.plan,week.saved,key);
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
    datedWeekMessage("Descarga solicitada para la semana guardada.")
  }catch(e){
    if(url)URL.revokeObjectURL(url);
    datedWeekMessage(e.message||"No se pudo descargar.")
  }
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;if(b.dataset.datedSave!==undefined)return saveDatedWeek();if(b.dataset.datedDelete!==undefined)return deleteDatedWeek();if(b.dataset.datedDownload!==undefined)return downloadDatedWeek();if(b.dataset.datedOpen){
    document.getElementById("datedWeekStart").value=b.dataset.datedOpen;datedWeekMessage("");renderDatedWeek()
  }if(b.dataset.datedShift){
    try{
      const d=planExportDate(datedWeekKey());d.setDate(d.getDate()+Number(b.dataset.datedShift));document.getElementById("datedWeekStart").value=localTrainingDate(d);datedWeekMessage("");renderDatedWeek()
    }catch(e){
      datedWeekMessage(e.message)
    }
  }
});
document.getElementById("datedWeekStart").addEventListener("change",()=>{
  datedWeekMessage("");renderDatedWeek()
});
document.getElementById("datedWeeksPanel").addEventListener("toggle",e=>{
  if(e.target.open)renderDatedWeek()
});
{
  const d=new Date();
  d.setDate(d.getDate()-((d.getDay()+6)%7));
  document.getElementById("datedWeekStart").value=localTrainingDate(d)
}
startupGuard("Semanas fechadas",renderDatedWeek);
function buildDatedWeekEdit(week,changes,currentSaved){
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
}
function renderDatedWeekEditor(){
  const box=document.getElementById("datedEditFields"),status=document.getElementById("datedEditStatus");
  box.replaceChildren();
  status.textContent="";
  try{
    const key=datedWeekKey(),week=loadDatedWeeks()[key];
    if(!week)throw new Error("Guardá o seleccioná primero una semana fechada.");
    box.dataset.weekKey=key;
    const saved=loadSaved(),byId=new Map(week.saved.map(p=>[p.id,p]));
    DAYS.forEach(([day,label])=>{
      const card=ce("div","plan-day");card.append(ce("h3","plan-day__title",label));SLOTS.forEach(([slot,title])=>{
        const row=ce("div","portion-field"),id="datedEdit_"+day+"_"+slot,lab=ce("label",null,title);lab.htmlFor=id;const select=ce("select");select.id=id;select.dataset.datedEditDay=day;select.dataset.datedEditSlot=slot;const currentId=week.plan[day]&&week.plan[day][slot],item=byId.get(currentId);const keep=ce("option",null,"Sin cambios: "+(item?(item.note||item.title||"Plato"):currentId?"Plato no disponible":"Sin asignar"));keep.value="keep";select.append(keep);const clear=ce("option",null,"Dejar sin asignar");clear.value="clear";select.append(clear);saved.filter(p=>p.type===slotPool(slot)).forEach(p=>{
          const o=ce("option",null,p.note||p.title||"Plato");o.value="id:"+p.id;select.append(o)
        });row.append(lab,select);card.append(row)
      });box.append(card)
    })
  }catch(e){
    delete box.dataset.weekKey;
    status.textContent=e.message
  }
}
function saveDatedWeekEdits(){
  const status=document.getElementById("datedEditStatus");
  try{
    const key=datedWeekKey(),box=document.getElementById("datedEditFields");
    if(box.dataset.weekKey!==key)throw new Error("La semana cambió. Cerrá y abrí el editor para actualizarlo.");
    const weeks=loadDatedWeeks();
    if(!weeks[key])throw new Error("La copia ya no está disponible.");
    const changes=Array.from(box.querySelectorAll("[data-dated-edit-day]")).map(s=>({
      day:s.dataset.datedEditDay,slot:s.dataset.datedEditSlot,value:s.value
    }));
    weeks[key]=buildDatedWeekEdit(weeks[key],changes,loadSaved());
    localStorage.setItem(DATED_WEEKS_KEY,JSON.stringify(weeks));
    renderDatedWeek();
    renderDatedWeekEditor();
    status.textContent="Cambios guardados solo en esta semana fechada."
  }catch(e){
    status.textContent=e.message||"No se pudieron guardar los cambios."
  }
}
document.getElementById("datedEditPanel").addEventListener("toggle",e=>{
  if(e.target.open)renderDatedWeekEditor()
});
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;if(b.dataset.datedEditSave!==undefined)return saveDatedWeekEdits();if(b.dataset.datedOpen||b.dataset.datedShift||b.dataset.datedSave!==undefined||b.dataset.datedDelete!==undefined){
    if(document.getElementById("datedEditPanel").open)renderDatedWeekEditor()
  }
});
document.getElementById("datedWeekStart").addEventListener("change",()=>{
  if(document.getElementById("datedEditPanel").open)renderDatedWeekEditor()
});
function parseTypedAppDate(value){
  const t=String(value||"").trim();
  if(!t)return "";
  let m=t.match(/^(\d{2})\/(\d{2})\/(\d{4})$/),iso;
  if(m)iso=m[3]+"-"+m[2]+"-"+m[1];
  else if(/^\d{4}-\d{2}-\d{2}$/.test(t))iso=t;
  else throw new Error("Escribí DD/MM/AAAA, por ejemplo 27/07/2026.");
  if(!validTrainingDate(iso))throw new Error("La fecha no existe. Revisá día, mes y año.");
  return iso
}
function typedAppDateLabel(iso){
  return iso?iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+iso.slice(0,4):""
}
function syncTypedAppDate(id){
  const hidden=document.getElementById(id),text=document.getElementById(id+"Text");
  if(document.activeElement!==text)text.value=typedAppDateLabel(hidden.value)
}
function commitTypedAppDate(id,required){
  const hidden=document.getElementById(id),text=document.getElementById(id+"Text"),error=document.getElementById(id+"Error");
  try{
    const iso=parseTypedAppDate(text.value);
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
const typedDateIds=["trainingExceptionDate","datedWeekStart","planExportStart"];
typedDateIds.forEach(id=>{
  const text=document.getElementById(id+"Text");syncTypedAppDate(id);text.addEventListener("input",()=>{
    const digits=text.value.replace(/\D/g,"").slice(0,8);if(!text.value.includes("-"))text.value=digits.slice(0,2)+(digits.length>2?"/"+digits.slice(2,4):"")+(digits.length>4?"/"+digits.slice(4):"")
  });text.addEventListener("change",()=>commitTypedAppDate(id,false));text.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      e.preventDefault();commitTypedAppDate(id,id!=="planExportStart");text.blur()
    }
  });document.getElementById(id).addEventListener("change",()=>syncTypedAppDate(id))
});
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;let id=null;if(b.dataset.trainingExceptionSave!==undefined)id="trainingExceptionDate";if(b.dataset.datedSave!==undefined||b.dataset.datedDownload!==undefined||b.dataset.datedDelete!==undefined||b.dataset.datedEditSave!==undefined)id="datedWeekStart";if(b.dataset.downloadWeek!==undefined)id="planExportStart";if(id&&!commitTypedAppDate(id,id!=="planExportStart")){
    e.preventDefault();e.stopImmediatePropagation();document.getElementById(id+"Text").focus()
  }
},true);
document.addEventListener("click",e=>{
  if(e.target.closest("[data-train-date],[data-train-quick],[data-dated-open],[data-dated-shift]"))typedDateIds.forEach(syncTypedAppDate)
});
let monthlyPlanCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1),monthlyPlanSelected=localTrainingDate(new Date());
function monthlyPlanDayData(date,weeks){
  const monday=new Date(date.getFullYear(),date.getMonth(),date.getDate()-((date.getDay()+6)%7),12),weekKey=localTrainingDate(monday),week=weeks[weekKey],dayKey=DAYS[(date.getDay()+6)%7][0];
  return {
    weekKey,week,rows:SLOTS.map(([slot,label])=>{
      const id=week&&week.plan[dayKey]&&week.plan[dayKey][slot],item=week&&week.saved.find(p=>p.id===id);return {
        slot,label,id,item
      }
    })
  }
}
function renderMonthlyPlan(){
  const grid=document.getElementById("monthlyPlanGrid"),title=document.getElementById("monthlyPlanTitle"),detail=document.getElementById("monthlyPlanDay");
  if(!grid)return;
  const weeks=loadDatedWeeks(),y=monthlyPlanCursor.getFullYear(),m=monthlyPlanCursor.getMonth(),today=localTrainingDate(new Date());
  title.textContent=monthlyPlanCursor.toLocaleDateString("es-AR",{
    month:"long",year:"numeric"
  });
  const nodes=["L","M","M","J","V","S","D"].map(x=>ce("span",null,x));
  for(let i=0;i<(new Date(y,m,1).getDay()+6)%7;i++)nodes.push(ce("span"));
  for(let n=1;n<=new Date(y,m+1,0).getDate();n++){
    const date=new Date(y,m,n,12),key=localTrainingDate(date),data=monthlyPlanDayData(date,weeks),count=data.rows.filter(r=>r.item).length,b=ce("button","train-date"+(key===today?" is-today":"")+(key===monthlyPlanSelected?" is-selected":""),String(n));
    b.type="button";
    b.dataset.monthlyPlanDate=key;
    if(count)b.dataset.mark="●";
    b.setAttribute("aria-pressed",String(key===monthlyPlanSelected));
    b.setAttribute("aria-label",date.toLocaleDateString("es-AR",{
      day:"numeric",month:"long",year:"numeric"
    })+", "+count+" comidas asignadas");
    if(key===today)b.setAttribute("aria-current","date");
    nodes.push(b)
  }
  grid.replaceChildren(...nodes);
  const date=new Date(monthlyPlanSelected+"T12:00:00"),data=monthlyPlanDayData(date,weeks);
  detail.replaceChildren(ce("h3","plan-day__title",date.toLocaleDateString("es-AR",{
    weekday:"long",day:"numeric",month:"long",year:"numeric"
  })));
  if(!data.week){
    detail.append(ce("p","screen__hint","No hay una semana guardada para esta fecha. Usá Guardar y ver semanas para crear una copia."));
    return
  }
  data.rows.forEach(r=>{
    const row=ce("div","plan-slot");row.append(ce("div","plan-slot__label",r.label),ce("div","plan-slot__plate",r.item?(r.item.note||r.item.title||"Plato"):r.id?"Plato no disponible":"Sin asignar"));if(r.item&&savedItemLines(r.item).length)row.append(ce("p","plan-slot__lines",savedItemLines(r.item).join(" · ")));detail.append(row)
  });
  const open=ce("button","button button--soft","Ver o editar esta semana");
  open.type="button";
  open.dataset.monthlyPlanOpen=data.weekKey;
  detail.append(open)
}
document.getElementById("monthlyPlanPanel").addEventListener("toggle",e=>{
  if(e.target.open)renderMonthlyPlan()
});
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;if(b.dataset.planMonth){
    monthlyPlanCursor=new Date(monthlyPlanCursor.getFullYear(),monthlyPlanCursor.getMonth()+Number(b.dataset.planMonth),1);monthlyPlanSelected=localTrainingDate(monthlyPlanCursor);renderMonthlyPlan()
  }if(b.dataset.monthlyPlanDate){
    monthlyPlanSelected=b.dataset.monthlyPlanDate;renderMonthlyPlan()
  }if(b.dataset.monthlyPlanOpen){
    const key=b.dataset.monthlyPlanOpen;document.getElementById("datedWeekStart").value=key;document.getElementById("datedWeekStartText").value=typedAppDateLabel(key);document.getElementById("datedWeekStartError").textContent="";document.getElementById("datedWeekStartText").setAttribute("aria-invalid","false");document.getElementById("datedWeeksPanel").open=true;renderDatedWeek();if(document.getElementById("datedEditPanel").open)renderDatedWeekEditor();document.getElementById("datedWeeksPanel").scrollIntoView({
      behavior:"smooth",block:"start"
    })
  }if(b.dataset.datedSave!==undefined||b.dataset.datedDelete!==undefined||b.dataset.datedEditSave!==undefined){
    if(document.getElementById("monthlyPlanPanel").open)renderMonthlyPlan()
  }
});
function syncPlanEditingFocus(source){
  const current=document.getElementById("currentPlanPanel"),editor=document.getElementById("datedEditPanel"),monthly=document.getElementById("monthlyPlanPanel");
  if(source==="dated"&&editor.open){
    current.open=false;
    monthly.open=false
  }else if(source==="current"&&current.open){
    editor.open=false
  }
}
document.getElementById("datedEditPanel").addEventListener("toggle",()=>syncPlanEditingFocus("dated"));
document.getElementById("currentPlanPanel").addEventListener("toggle",()=>syncPlanEditingFocus("current"));
