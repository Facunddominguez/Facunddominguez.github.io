// Mi Plato Fácil · Historial de comidas preparadas.
// Parte 20: los archivos se unen en orden según su número, que define el orden de arranque.
function validCookingHistoryRecord(x){
  return !!x&&typeof x.id==="string"&&typeof x.date==="string"&&validTrainingDate(x.date)&&typeof x.meal==="string"&&typeof x.title==="string"&&Array.isArray(x.lines)&&x.lines.every(t=>typeof t==="string")
}
function loadCookingHistory(){
  try{
    const a=JSON.parse(localStorage.getItem(COOKING_HISTORY_KEY)||"[]");
    return Array.isArray(a)?a.filter(validCookingHistoryRecord):[]
  }catch(e){
    return []
  }
}
function cookingHistoryRecord(plate,date,meal){
  if(!plate||!validTrainingDate(date)||date>localTrainingDate(new Date()))throw new Error("Elegí un plato y una fecha válida, no futura.");
  return {
    id:Date.now().toString(36)+"_"+Math.random().toString(36).slice(2),date,meal,title:String(plate.note||plate.title||"Plato"),lines:Array.isArray(plate.lines)?plate.lines.map(String):[],sourceId:plate.id,status:"prepared"
  }
}
function renderCookingHistory(){
  const select=document.getElementById("cookingHistoryPlate"),previous=select.value;
  select.replaceChildren();
  const placeholder=ce("option",null,"Elegí un plato guardado");
  placeholder.value="";
  select.append(placeholder);
  loadSaved().forEach(p=>{
    const option=ce("option",null,p.note||p.title||"Plato");option.value=p.id;select.append(option)
  });
  if(Array.from(select.options).some(o=>o.value===previous))select.value=previous;
  const list=document.getElementById("cookingHistoryList"),items=loadCookingHistory().sort((a,b)=>b.date.localeCompare(a.date));
  list.replaceChildren(...items.map(item=>{
    const row=ce("div","summary__line");row.append(ce("strong",null,typedAppDateLabel(item.date)+" · "+item.meal),ce("p",null,item.title),ce("p","screen__hint",item.lines.join(" · ")));const remove=ce("button","button button--danger","Eliminar registro");remove.type="button";remove.dataset.cookingHistoryDelete=item.id;row.append(remove);return row
  }));
  if(!items.length)list.append(ce("p","screen__hint","Todavía no registraste preparaciones."))
}
document.getElementById("cookingHistoryDate").value=typedAppDateLabel(localTrainingDate(new Date()));
document.getElementById("cookingHistoryDate").addEventListener("input",e=>{
  const d=e.target.value.replace(/\D/g,"").slice(0,8);e.target.value=d.slice(0,2)+(d.length>2?"/"+d.slice(2,4):"")+(d.length>4?"/"+d.slice(4):"")
});
document.getElementById("cookingHistoryPanel").addEventListener("toggle",e=>{
  if(e.target.open)renderCookingHistory()
});
document.getElementById("cookingHistoryForm").addEventListener("submit",e=>{
  e.preventDefault();const status=document.getElementById("cookingHistoryStatus");try{
    const date=parseTypedAppDate(document.getElementById("cookingHistoryDate").value),plate=loadSaved().find(p=>p.id===document.getElementById("cookingHistoryPlate").value),meal=document.getElementById("cookingHistoryMeal").value,record=cookingHistoryRecord(plate,date,meal),items=loadCookingHistory();if(items.some(x=>x.date===date&&x.meal===meal&&x.sourceId===record.sourceId)&&!window.confirm("Ya hay un registro de este plato en esa fecha y comida. ¿Agregar otra preparación?"))return;items.push(record);localStorage.setItem(COOKING_HISTORY_KEY,JSON.stringify(items));renderCookingHistory();status.textContent="Preparación registrada. El contador Cociné no cambió."
  }catch(err){
    status.textContent=err.message||"No se pudo guardar."
  }
});
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-cooking-history-delete]");if(!b||!window.confirm("¿Eliminar solo este registro del historial?"))return;try{
    localStorage.setItem(COOKING_HISTORY_KEY,JSON.stringify(loadCookingHistory().filter(x=>x.id!==b.dataset.cookingHistoryDelete)));renderCookingHistory();document.getElementById("cookingHistoryStatus").textContent="Registro eliminado."
  }catch(err){
    document.getElementById("cookingHistoryStatus").textContent="No se pudo eliminar el registro."
  }
});
