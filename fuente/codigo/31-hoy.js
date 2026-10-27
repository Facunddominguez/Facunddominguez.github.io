// Mi Plato Fácil · Hoy: las comidas de hoy según el plan de la semana.
// Parte 32: los archivos se unen en orden según su número, que define el orden de arranque.
// "Lo comí" usa el mismo registro que el plan (Lo que comí): no cambia el plan ni las compras.
function todayHint(){
  let t=null;
  try{
    t=trainingDayForDate(new Date())
  }catch(e){
  }
  return t===true?"Hoy es día de entrenamiento.":t===false?"Hoy es día de descanso.":"Tus comidas de hoy según el plan de la semana."
}
function renderToday(){
  const box=document.getElementById("todayRows");
  if(!box)return;
  const day=todayPlanDay(),plan=loadPlan(),byId=new Map(loadSaved().map(p=>[p.id,p]));
  // En el orden del día (el plan las guarda como desayuno, merienda, almuerzo, cena).
  box.replaceChildren(...["desayuno","almuerzo","merienda","cena"].map(slot=>{
    const label=SLOTS.find(s=>s[0]===slot)[1],name=planSlotName(slot),id=plan[day]&&plan[day][slot],it=id?byId.get(id):null,row=ce("div","today-row");
    row.dataset.todaySlot=slot;
    row.append(ce("span","today-row__slot",label),ce("span","today-row__plate"+(it?"":" is-empty"),it?(it.note?it.note+" · ":"")+savedItemTitle(it):"Sin plan para hoy"));
    let action;
    if(it&&eatenToday(it,slot))action=ce("span","today-row__done","✓ Comido");
    else{
      action=ce("button","button button--soft",it?"Lo comí":"Elegir");
      action.type="button";
      if(it){
        action.dataset.planEaten=day+"|"+slot;
        action.setAttribute("aria-label","Lo comí: "+savedItemTitle(it)+" ("+name+")")
      }else{
        action.dataset.todayChoose=slot;
        action.setAttribute("aria-label","Elegir qué comer en "+name+" (abre la semana)")
      }
    }
    row.append(action);
    return row
  }))
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button");
  if(!b)return;
  if(b.dataset.planEaten&&b.closest("#todayPanel")){
    // El registro lo hace el manejador del plan (24-consumo-y-habitos.js), que corre antes que este.
    const slot=b.dataset.planEaten.split("|")[1],status=document.getElementById("todayStatus"),plan=loadPlan(),id=plan[todayPlanDay()]&&plan[todayPlanDay()][slot],it=id?loadSaved().find(p=>p.id===id):null;
    renderToday();
    status.textContent=it&&eatenToday(it,slot)?"Registrado en Lo que comí ("+planSlotName(slot)+"). El plan no cambió.":"No se pudo registrar. Probá desde la Semana → Lo que comí.";
    return
  }
  if(b.dataset.todayChoose){
    openTab("semana");
    const panel=document.getElementById("currentPlanPanel");
    if(panel)panel.open=true;
    const dayBox=document.querySelectorAll("#planList .plan-day")[DAYS.findIndex(d=>d[0]===todayPlanDay())];
    if(dayBox)setTimeout(()=>dayBox.scrollIntoView({
      block:"start",behavior:"smooth"
    }),60)
  }
});
