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
// La única alta en el historial (Lo comí de un plato y de una receta, que antes decían Lo cociné).
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
// v19.6 (R5-R04): se quitó "Todas las preparaciones" (formulario y lista). Lo guardado en miPlatoFacil_cookingHistory_v1 sigue igual: se muestra
// en el Registro del día como "Lo comí" y cuenta en "Veces que comiste cada comida".
