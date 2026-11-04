// Mi Plato Fácil · Historial de comidas preparadas.
// Parte 20: los archivos se unen en orden según su número, que define el orden de arranque.
function validCookingHistoryRecord(x){
  return !!x&&typeof x.id==="string"&&typeof x.date==="string"&&Rutina.validTrainingDate(x.date)&&typeof x.meal==="string"&&typeof x.title==="string"&&Array.isArray(x.lines)&&x.lines.every(t=>typeof t==="string")
}
function loadCookingHistory(){
  try{
    const a=JSON.parse(localStorage.getItem(COOKING_HISTORY_KEY)||"[]");
    return Array.isArray(a)?a.filter(validCookingHistoryRecord):[]
  }catch(e){
    return []
  }
}
// La única alta en el historial (formulario, "+ Lo cociné" del Registro, Lo cociné de un plato y de una receta).
// Agrega sobre el arreglo crudo, sin filtrar: los registros que no validan quedan como estaban. Si lo guardado no se
// puede leer, no escribe nada y avisa. El registro nuevo siempre valida (así el respaldo lo acepta).
function agregarPreparacion(record){
  if(!validCookingHistoryRecord(record))throw new Error("La preparación no es válida.");
  let a=null;
  try{
    a=JSON.parse(localStorage.getItem(COOKING_HISTORY_KEY)||"[]")
  }catch(e){
  }
  if(!Array.isArray(a))throw new Error("No se pudo leer tu historial de preparaciones: no se anotó nada.");
  a.push(record);
  try{
    localStorage.setItem(COOKING_HISTORY_KEY,JSON.stringify(a))
  }catch(e){
    throw new Error("No se pudo guardar (falta de espacio u otro error). No se modificó nada.")
  }
}
function cookingHistoryRecord(plate,date,meal){
  if(!plate||!Rutina.validTrainingDate(date)||date>Rutina.localTrainingDate(new Date()))throw new Error("Elegí un plato y una fecha válida, no futura.");
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
  const saved=MisPlatos.loadSaved(),labels=mealLabels(saved);
  saved.forEach(p=>{
    const option=ce("option",null,labels.get(p.id));option.value=p.id;select.append(option)
  });
  if(Array.from(select.options).some(o=>o.value===previous))select.value=previous;
  const list=document.getElementById("cookingHistoryList"),items=loadCookingHistory().sort((a,b)=>b.date.localeCompare(a.date));
  list.replaceChildren(...items.map(item=>{
    const row=ce("div","summary__line");row.append(ce("strong",null,typedAppDateLabel(item.date)+" · "+item.meal),ce("p",null,item.title),ce("p","screen__hint",item.lines.join(" · ")));const remove=ce("button","button button--danger","Quitar");remove.type="button";remove.setAttribute("aria-label","Quitar registro: "+item.title);remove.dataset.cookingHistoryDelete=item.id;row.append(remove);return row
  }));
  if(!items.length)list.append(ce("p","screen__hint","Todavía no registraste preparaciones."))
}
document.getElementById("cookingHistoryDate").value=typedAppDateLabel(Rutina.localTrainingDate(new Date()));
document.getElementById("cookingHistoryDate").addEventListener("input",e=>{
  const d=e.target.value.replace(/\D/g,"").slice(0,8);e.target.value=d.slice(0,2)+(d.length>2?"/"+d.slice(2,4):"")+(d.length>4?"/"+d.slice(4):"")
});
document.getElementById("cookingHistoryPanel").addEventListener("toggle",e=>{
  if(e.target.open)renderCookingHistory()
});
document.getElementById("cookingHistoryForm").addEventListener("submit",e=>{
  e.preventDefault();const status=document.getElementById("cookingHistoryStatus");try{
    const date=SemanasFechadas.parseTypedAppDate(document.getElementById("cookingHistoryDate").value),plate=MisPlatos.loadSaved().find(p=>p.id===document.getElementById("cookingHistoryPlate").value),meal=document.getElementById("cookingHistoryMeal").value,record=cookingHistoryRecord(plate,date,meal),repetida=loadCookingHistory().some(x=>x.date===date&&x.meal===meal&&x.sourceId===record.sourceId),antes=registroFoto();agregarPreparacion(record);registroRepintar();renderCookingHistory();registroAviso(status,"Preparación registrada."+(repetida?" Ya había una igual ese día.":""),antes)
  }catch(err){
    status.textContent=err.message||"No se pudo guardar."
  }
});
document.addEventListener("click",e=>{
  // Sin confirmación: Quitar ofrece Deshacer (v15.5). Saca solo ese id del arreglo crudo.
  const b=e.target.closest("[data-cooking-history-delete]");if(!b)return;const st=document.getElementById("cookingHistoryStatus");try{
    const antes=quitarRegistro("cocine",b.dataset.cookingHistoryDelete);registroRepintar();renderCookingHistory();registroAviso(st,"Registro eliminado.",antes)
  }catch(err){
    st.textContent=err.message||"No se pudo eliminar el registro."
  }
});
