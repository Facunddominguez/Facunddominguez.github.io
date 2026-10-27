// Mi Plato Fácil · Semana de entrenamiento y excepciones.
// Parte 6: los archivos se unen en orden según su número, que define el orden de arranque.
const TRAINING_KEY="miPlatoFacil_trainingWeek";
function loadTrainingWeek(){
  try{
    const o=JSON.parse(localStorage.getItem(TRAINING_KEY)||"null");
    if(!o||o.version!==1||!Array.isArray(o.days)||!o.days.every(n=>Number.isInteger(n)&&n>=0&&n<=6))return null;
    return {
      version:1,days:Array.from(new Set(o.days))
    }
  }catch(e){
    return null
  }
}
function trainingDayForDate(date){
  const exceptions=loadTrainingExceptions(),key=localTrainingDate(date);
  if(Object.prototype.hasOwnProperty.call(exceptions,key))return exceptions[key];
  const c=loadTrainingWeek();
  return c?c.days.includes(date.getDay()):null
}
function renderTrainingWeek(){
  const box=document.getElementById("trainingDays"),status=document.getElementById("trainingStatus");
  if(!box)return;
  const c=loadTrainingWeek();
  const days=[[1,"Lunes"],[2,"Martes"],[3,"Miércoles"],[4,"Jueves"],[5,"Viernes"],[6,"Sábado"],[0,"Domingo"]];
  box.replaceChildren(...days.map(([n,name])=>{
    const label=ce("label","filter-chip");const input=ce("input");input.type="checkbox";input.dataset.trainingDay=String(n);input.checked=!!c&&c.days.includes(n);label.append(input,document.createTextNode(" "+name));return label
  }));
  if(status)status.textContent=c?"Calendario activo. Los días sin marcar son de descanso.":"Sin calendario semanal: se aplican las excepciones guardadas; en las demás fechas se conserva la selección anterior del Plato del día. Podés cambiarla en el resumen."
}
function saveTrainingWeek(){
  const days=Array.from(document.querySelectorAll("[data-training-day]")).filter(x=>x.checked).map(x=>Number(x.dataset.trainingDay));
  try{
    localStorage.setItem(TRAINING_KEY,JSON.stringify({
      version:1,days
    }));
    renderTrainingWeek()
  }catch(e){
    document.getElementById("trainingStatus").textContent="No se pudo guardar el calendario. No se modificaron los planes."
  }
}
function disableTrainingWeek(){
  try{
    localStorage.removeItem(TRAINING_KEY);
    renderTrainingWeek()
  }catch(e){
    document.getElementById("trainingStatus").textContent="No se pudo desactivar el calendario."
  }
}
const TRAINING_EXCEPTIONS_KEY="miPlatoFacil_trainingExceptions";
function localTrainingDate(date){
  return String(date.getFullYear()).padStart(4,"0")+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0")
}
function validTrainingDate(key){
  if(typeof key!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(key))return false;
  const d=new Date(key+"T12:00:00");
  return !isNaN(d.getTime())&&localTrainingDate(d)===key
}
function loadTrainingExceptions(){
  try{
    const o=JSON.parse(localStorage.getItem(TRAINING_EXCEPTIONS_KEY)||"{}");
    if(!o||typeof o!=="object"||Array.isArray(o))return {
    };
    return Object.fromEntries(Object.entries(o).filter(([k,v])=>validTrainingDate(k)&&typeof v==="boolean"))
  }catch(e){
    return {
    }
  }
}
function renderTrainingExceptions(){
  const box=document.getElementById("trainingExceptionsList");
  if(!box)return;
  const entries=Object.entries(loadTrainingExceptions()).sort((a,b)=>a[0].localeCompare(b[0]));
  box.replaceChildren(...entries.map(([date,train])=>{
    const row=ce("div","summary__line");row.append(ce("p",null,date+" · "+(train?"Entrenamiento":"Descanso")));const b=ce("button","button button--danger","Quitar excepción");b.type="button";b.dataset.trainingExceptionRemove=date;row.append(b);return row
  }));
  if(!entries.length)box.append(ce("p","screen__hint","No hay excepciones guardadas."))
}
function saveTrainingException(){
  const key=document.getElementById("trainingExceptionDate").value,value=document.getElementById("trainingExceptionValue").value,status=document.getElementById("trainingExceptionStatus");
  if(!validTrainingDate(key)||!["train","rest"].includes(value)){
    status.textContent="Elegí una fecha válida y un tipo de día.";
    return
  }
  const o=loadTrainingExceptions();
  o[key]=value==="train";
  try{
    localStorage.setItem(TRAINING_EXCEPTIONS_KEY,JSON.stringify(o));
    renderTrainingExceptions();
    status.textContent="Excepción guardada. No se modificaron platos ni planes existentes."
  }catch(e){
    status.textContent="No se pudo guardar la excepción."
  }
}
function removeTrainingException(key){
  const o=loadTrainingExceptions();
  delete o[key];
  try{
    localStorage.setItem(TRAINING_EXCEPTIONS_KEY,JSON.stringify(o));
    renderTrainingExceptions();
    document.getElementById("trainingExceptionStatus").textContent="Excepción eliminada."
  }catch(e){
    document.getElementById("trainingExceptionStatus").textContent="No se pudo eliminar la excepción."
  }
}
