// Mi Plato Fácil · Respaldo completo: descargar, validar y restaurar.
// Parte 19: los archivos se unen en orden según su número, que define el orden de arranque.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Respaldo.nombre().
var Respaldo={
validStockQuantitiesStore(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=1000&&Object.entries(o).every(([key,v])=>!["__proto__","constructor","prototype"].includes(key)&&!!v&&typeof v==="object"&&typeof v.name==="string"&&v.name.trim().length>0&&v.name.length<=100&&typeof v.unit==="string"&&RECIPE_AMOUNT_UNITS.includes(v.unit)&&typeof v.quantity==="number"&&Number.isFinite(v.quantity)&&v.quantity>=0&&v.quantity<=100000000&&key===Existencias.stockKey(v.name,v.unit))
},
validShoppingBudget(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&["ARS","USD"].includes(o.currency)&&typeof o.limit==="number"&&Number.isFinite(o.limit)&&o.limit>=0&&o.limit<=100000000000&&(o.period===undefined||o.period==="semana"||o.period==="mes")&&(o.people===undefined||Number.isInteger(o.people)&&o.people>=1&&o.people<=50)
},
validRecipePreferences(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&typeof o.words==="string"&&o.words.length<=1000&&typeof o.enabled==="boolean"
},
validBienvenida(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===1&&o.vista===true
},
validateCompleteBackup(o){
  if(!o||o.app!=="MiPlatoFacil"||o.format!=="complete-local-v1"||!o.data||typeof o.data!=="object"||Array.isArray(o.data))throw new Error("No es un respaldo completo compatible.");
  const entries=Object.entries(o.data);
  if(!COMPLETE_BACKUP_KEYS.filter(k=>!COMPLETE_BACKUP_OPTIONAL_KEYS.includes(k)).every(k=>Object.prototype.hasOwnProperty.call(o.data,k))||entries.some(([k])=>!COMPLETE_BACKUP_KEYS.includes(k)))throw new Error("El respaldo tiene módulos faltantes o desconocidos.");
  const arrays=["miPlatoFacil_pantryMoves_v1","miPlatoFacil_purchases_v1","miPlatoFacil_consumption_v1","miPlatoFacil_planHistory_v1","miPlatoFacil_saved","miPlatoFacil_adviceFavorites","miPlatoFacil_pantry","miPlatoFacil_manualShopping_v1","miPlatoFacil_cookingHistory_v1"];
  function inspect(v){
    if(v&&typeof v==="object"){
      for(const [k,x] of Object.entries(v)){
        if(["__proto__","constructor","prototype"].includes(k))throw new Error("El respaldo contiene campos no admitidos.");
        inspect(x)
      }
    }
  }
  for(const [k,raw] of entries){
    if(raw===null)continue;
    if(typeof raw!=="string"||raw.length>5000000)throw new Error("Datos inválidos o demasiado grandes.");
    if(k==="miPlatoFacil_theme"){
      if(!["auto","light","dark"].includes(raw))throw new Error("Tema inválido.");
      continue
    }
    let v;
    try{
      v=JSON.parse(raw)
    }catch(e){
      throw new Error("JSON inválido en "+k)
    }
    if(k==="miPlatoFacil_referencePrices_v1"&&!validReferencePrices(v))throw new Error("Precios de referencia inválidos.");
    if(k==="miPlatoFacil_recipeDetails_v1"&&!validRecipeDetails(v))throw new Error("Detalles de recetas inválidos.");
    if(k==="miPlatoFacil_pantryQuantities_v1"&&!Respaldo.validStockQuantitiesStore(v))throw new Error("Existencias de despensa inválidas.");
    if(k==="miPlatoFacil_shoppingBudget_v1"&&!Respaldo.validShoppingBudget(v))throw new Error("Presupuesto de compras inválido.");
    if(k==="miPlatoFacil_recipePreferences_v1"&&!Respaldo.validRecipePreferences(v))throw new Error("Preferencias de recetas inválidas.");
    if(k==="miPlatoFacil_ingredientAliases_v1"&&!Ingredientes.validIngredientAliases(v))throw new Error("Equivalencias de ingredientes inválidas.");
    if(k==="miPlatoFacil_planPortions_v1"&&!Semana.validPlanPortions(v))throw new Error("Porciones del plan inválidas.");
    if(k==="miPlatoFacil_planHistory_v1"&&!Semana.validPlanHistory(v))throw new Error("Historial del plan inválido.");
    if(k==="miPlatoFacil_consumption_v1"&&!validConsumption(v))throw new Error("Registro de consumo inválido.");
    if(k==="miPlatoFacil_habitGoals_v1"&&!validHabitGoals(v))throw new Error("Objetivos semanales inválidos.");
    if(k==="miPlatoFacil_purchases_v1"&&!validPurchases(v))throw new Error("Compras registradas inválidas.");
    if(k==="miPlatoFacil_bienvenida_v1"&&!Respaldo.validBienvenida(v))throw new Error("Marca de bienvenida inválida.");
    if(k==="miPlatoFacil_region_v1"&&!validRegionPrecios(v))throw new Error("Región de precios inválida.");
    if(k==="miPlatoFacil_mostrarPrecios_v1"&&!validMostrarPrecios(v))throw new Error("Ajuste de precios inválido.");
    if(k==="miPlatoFacil_hogar_v1"&&!validHogar(v))throw new Error("Personas del hogar inválidas.");
    if(k==="miPlatoFacil_basicosFaltantes_v1"&&!validBasicosFaltantes(v))throw new Error("Básicos de alacena inválidos.");
    if(k==="miPlatoFacil_dieta_v1"&&!validDieta(v))throw new Error("Filtros de dieta inválidos.");
    if(k==="miPlatoFacil_planProxima_v1"&&!Semana.validProxima(v))throw new Error("Plan de la semana que viene inválido.");
    if(k==="miPlatoFacil_dondeCompro_v1"&&!validDondeCompro(v))throw new Error("Dónde comprás la verdura: valor inválido.");
    if(k==="miPlatoFacil_preciosRevisados_v1"&&!validPreciosRevisados(v))throw new Error("Precios revisados inválidos.");
    if(k==="miPlatoFacil_respaldoAviso_v1"&&!validRespaldoAviso(v))throw new Error("Aviso de respaldo inválido.");
    if(k==="miPlatoFacil_comprasOpciones_v1"&&!Compras.validComprasOpciones(v))throw new Error("Opciones de compras inválidas.");
    if(k==="miPlatoFacil_shoppingChecks_v1"&&!Compras.validShoppingChecks(v))throw new Error("Tachados de la lista inválidos.");
    if(k==="miPlatoFacil_pantryMoves_v1"&&!validPantryMoves(v))throw new Error("Movimientos de despensa inválidos.");
    if(k==="miPlatoFacil_recipeAmounts_v1"&&!validRecipeAmountsStore(v))throw new Error("Cantidades por receta inválidas.");
    if(k==="miPlatoFacil_cookingHistory_v1"&&(!Array.isArray(v)||v.some(x=>!validCookingHistoryRecord(x))))throw new Error("Historial inválido.");
    if(arrays.includes(k)){
      if(!Array.isArray(v))throw new Error("Se esperaba una lista en "+k);
      if(k==="miPlatoFacil_saved"&&v.some(x=>!x||typeof x.id!=="string"||typeof x.type!=="string"||!Array.isArray(x.lines)))throw new Error("Platos guardados inválidos.");
      if(["miPlatoFacil_pantry","miPlatoFacil_adviceFavorites"].includes(k)&&v.some(x=>typeof x!=="string"))throw new Error("Lista inválida.");
      if(k==="miPlatoFacil_manualShopping_v1"&&v.some(x=>!x||typeof x.id!=="string"||typeof x.name!=="string"))throw new Error("Productos extra inválidos.")
    }else if(!v||typeof v!=="object"||Array.isArray(v))throw new Error("Se esperaba un objeto en "+k);
    inspect(v)
  }
  return o
},
restoreCompleteBackup(o,storage){
  Respaldo.validateCompleteBackup(o);
  const before=completeBackupSnapshot(storage);
  try{
    for(const k of COMPLETE_BACKUP_KEYS){
      if(!Object.prototype.hasOwnProperty.call(o.data,k))continue;
      const raw=o.data[k];
      if(raw===null)storage.removeItem(k);
      else storage.setItem(k,raw)
    }
  }catch(e){
    let failed=false;
    for(const k of COMPLETE_BACKUP_KEYS){
      try{
        const raw=before.data[k];
        if(raw===null||raw===undefined)storage.removeItem(k);
        else storage.setItem(k,raw)
      }catch(ignore){
        failed=true
      }
    }
    throw new Error(failed?"Falló la restauración y no se pudo revertir por completo. Conservá tu respaldo externo.":"No se pudo restaurar. Se recuperaron los datos anteriores.")
  }
  return true
},
completeBackupStatus(t){
  document.getElementById("backupStatus").textContent=t
},
updateCompleteBackupButton(){
  document.getElementById("backupRestore").disabled=!completeBackupPending
}
};
const COMPLETE_BACKUP_KEYS=["miPlatoFacil_adviceFavorites", "miPlatoFacil_datedWeeks_v1", "miPlatoFacil_manualShopping_v1", "miPlatoFacil_pantry", "miPlatoFacil_plan", "miPlatoFacil_planVars", "miPlatoFacil_saved", "miPlatoFacil_theme", "miPlatoFacil_trainingExceptions", "miPlatoFacil_trainingWeek", "miPlatoFacil_cookingHistory_v1", "miPlatoFacil_recipeAmounts_v1", "miPlatoFacil_referencePrices_v1", "miPlatoFacil_recipeDetails_v1", "miPlatoFacil_pantryQuantities_v1", "miPlatoFacil_shoppingBudget_v1", "miPlatoFacil_recipePreferences_v1", "miPlatoFacil_ingredientAliases_v1", "miPlatoFacil_planPortions_v1", "miPlatoFacil_planHistory_v1", "miPlatoFacil_consumption_v1", "miPlatoFacil_habitGoals_v1", "miPlatoFacil_purchases_v1", "miPlatoFacil_pantryMoves_v1", "miPlatoFacil_shoppingChecks_v1","miPlatoFacil_bienvenida_v1","miPlatoFacil_comprasOpciones_v1","miPlatoFacil_region_v1","miPlatoFacil_mostrarPrecios_v1","miPlatoFacil_hogar_v1","miPlatoFacil_basicosFaltantes_v1","miPlatoFacil_dieta_v1","miPlatoFacil_planProxima_v1","miPlatoFacil_dondeCompro_v1","miPlatoFacil_preciosRevisados_v1","miPlatoFacil_respaldoAviso_v1"];
const COMPLETE_BACKUP_OPTIONAL_KEYS=["miPlatoFacil_cookingHistory_v1","miPlatoFacil_recipeAmounts_v1","miPlatoFacil_referencePrices_v1","miPlatoFacil_recipeDetails_v1","miPlatoFacil_pantryQuantities_v1","miPlatoFacil_shoppingBudget_v1","miPlatoFacil_recipePreferences_v1","miPlatoFacil_ingredientAliases_v1","miPlatoFacil_planPortions_v1","miPlatoFacil_planHistory_v1","miPlatoFacil_consumption_v1","miPlatoFacil_habitGoals_v1","miPlatoFacil_purchases_v1","miPlatoFacil_pantryMoves_v1","miPlatoFacil_shoppingChecks_v1","miPlatoFacil_bienvenida_v1","miPlatoFacil_comprasOpciones_v1","miPlatoFacil_region_v1","miPlatoFacil_mostrarPrecios_v1","miPlatoFacil_hogar_v1","miPlatoFacil_basicosFaltantes_v1","miPlatoFacil_dieta_v1","miPlatoFacil_planProxima_v1","miPlatoFacil_dondeCompro_v1","miPlatoFacil_preciosRevisados_v1","miPlatoFacil_respaldoAviso_v1"];
// v15.7: "Mostrar precios y presupuesto" (miPlatoFacil_mostrarPrecios_v1, {"mostrar":true}) es opcional y se valida; sin él se deriva de uiMode_v1.
// v15.6: la región de los precios (miPlatoFacil_region_v1) es opcional; si falta en un respaldo viejo se usa GBA.
// v15.3: la marca "ya vio la bienvenida" (miPlatoFacil_bienvenida_v1). Solo vale {"vista":true}.
let completeBackupPending=null;
function completeBackupSnapshot(storage){
  return {
    app:"MiPlatoFacil",format:"complete-local-v1",createdAt:new Date().toISOString(),data:Object.fromEntries(COMPLETE_BACKUP_KEYS.map(k=>[k,storage.getItem(k)]).filter(([k,v])=>!([INGREDIENT_ALIASES_KEY,"miPlatoFacil_planPortions_v1","miPlatoFacil_planHistory_v1","miPlatoFacil_consumption_v1","miPlatoFacil_habitGoals_v1","miPlatoFacil_purchases_v1","miPlatoFacil_pantryMoves_v1","miPlatoFacil_shoppingChecks_v1","miPlatoFacil_bienvenida_v1","miPlatoFacil_comprasOpciones_v1","miPlatoFacil_region_v1","miPlatoFacil_mostrarPrecios_v1","miPlatoFacil_hogar_v1","miPlatoFacil_basicosFaltantes_v1","miPlatoFacil_dieta_v1","miPlatoFacil_planProxima_v1","miPlatoFacil_dondeCompro_v1","miPlatoFacil_preciosRevisados_v1","miPlatoFacil_respaldoAviso_v1"].includes(k)&&v===null)))
  }
}
document.getElementById("backupExport").addEventListener("click",()=>RespaldoAviso.guardarCopia());
document.getElementById("backupFile").addEventListener("change",async e=>{
  completeBackupPending=null;document.getElementById("backupPreview").textContent="";Respaldo.updateCompleteBackupButton();const f=e.target.files&&e.target.files[0];if(!f)return;try{
    if(f.size>10000000)throw new Error("El archivo supera el límite de 10 MB.");const o=Respaldo.validateCompleteBackup(JSON.parse(await f.text()));completeBackupPending=o;document.getElementById("backupPreview").textContent="Respaldo compatible: "+COMPLETE_BACKUP_KEYS.filter(k=>o.data[k]!=null).length+" módulos con datos. Se reemplazarán también los módulos vacíos.";Respaldo.completeBackupStatus("Archivo validado. No se modificaron datos.")
  }catch(err){
    Respaldo.completeBackupStatus(err.message||"No se pudo leer el archivo.")
  }Respaldo.updateCompleteBackupButton()
});
document.getElementById("backupRestore").addEventListener("click",()=>{
  if(!completeBackupPending)return;const button=document.getElementById("backupRestore");button.classList.add("backup-selected");const accepted=window.confirm("Confirmar restauración\n\nConfirmo que descargué mi copia actual y acepto reemplazar los datos guardados por el respaldo seleccionado. No se combinarán.\n\nLa app se recargará automáticamente al terminar y se perderán las selecciones en curso.\n\n¿Continuar?");if(!accepted){
    button.classList.remove("backup-selected");return
  }button.disabled=true;button.setAttribute("aria-busy","true");button.textContent="Restaurando…";try{
    Respaldo.restoreCompleteBackup(completeBackupPending,localStorage);completeBackupPending=null;button.textContent="✓ Restauración completada";Respaldo.completeBackupStatus("Datos restaurados. Recargando la aplicación…");const shield=ce("div","backup-reload-shield");shield.setAttribute("role","status");shield.setAttribute("aria-live","polite");shield.append(ce("p",null,"✓ Datos restaurados. Recargando…"));document.body.append(shield);setTimeout(()=>window.location.reload(),450)
  }catch(e){
    button.classList.remove("backup-selected");button.removeAttribute("aria-busy");button.textContent="Restaurar copia seleccionada";Respaldo.updateCompleteBackupButton();Respaldo.completeBackupStatus(e.message)
  }
});
// Tarjeta "Mis datos" en Más (desde la v15.3 está en el HTML): abre el respaldo.
document.getElementById("backupOpen").addEventListener("click",()=>go("backupScreen"));
const COOKING_HISTORY_KEY="miPlatoFacil_cookingHistory_v1";
// ---- Etapa 32: aviso de respaldo, "Guardar copia" (menú de compartir o descarga) y almacenamiento persistente ----
// Clave miPlatoFacil_respaldoAviso_v1: {"version":1,"primerUso":"AAAA-MM-DD","ultimo":"AAAA-MM-DD","pospuesto":"AAAA-MM-DD"} (ultimo y pospuesto pueden faltar).
var RESPALDO_AVISO_KEY="miPlatoFacil_respaldoAviso_v1";
function validRespaldoAviso(v){
  const fecha=d=>typeof d==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d+"T12:00:00"))&&new Date(d+"T12:00:00").toISOString().slice(0,10)===d;
  return!!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).every(k=>["version","primerUso","ultimo","pospuesto"].includes(k))&&v.version===1&&fecha(v.primerUso)&&(v.ultimo===undefined||fecha(v.ultimo))&&(v.pospuesto===undefined||fecha(v.pospuesto))
}
var RespaldoAviso={
hoy(){
  return Rutina.localTrainingDate(new Date())
},
dias(desde){
  const a=Date.parse(desde+"T12:00:00"),b=Date.parse(RespaldoAviso.hoy()+"T12:00:00");
  return Number.isFinite(a)&&Number.isFinite(b)?Math.round((b-a)/864e5):0
},
leer(){
  try{
    const v=JSON.parse(localStorage.getItem(RESPALDO_AVISO_KEY)||"null");
    return validRespaldoAviso(v)?v:null
  }catch(e){
    return null
  }
},
escribir(o){
  if(!validRespaldoAviso(o))return false;
  try{
    localStorage.setItem(RESPALDO_AVISO_KEY,JSON.stringify(o));
    return true
  }catch(e){
    return false
  }
},
// ¿Hay algo que perder? Al menos una comida guardada o un plan.
hayDatos(){
  try{
    if(MisPlatos.loadSaved().length)return true;
    const plan=loadPlan();
    return DAYS.some(([d])=>SLOTS.some(([s])=>plan[d]&&plan[d][s]))
  }catch(e){
    return false
  }
},
// Días sin una copia (desde la última o, si nunca se hizo una, desde el primer uso con esta versión) o null si no corresponde avisar.
estado(){
  if(!RespaldoAviso.hayDatos())return null;
  let o=RespaldoAviso.leer();
  if(!o){
    o={version:1,primerUso:RespaldoAviso.hoy()};
    RespaldoAviso.escribir(o)
  }
  const dias=RespaldoAviso.dias(o.ultimo||o.primerUso);
  if(dias<30)return null;
  // "Más tarde" lo esconde 7 días: vuelve al octavo.
  if(o.pospuesto&&RespaldoAviso.dias(o.pospuesto)<=7)return null;
  return {dias}
},
pintar(){
  const e=RespaldoAviso.estado();
  for(const id of ["todayRespaldo","backupAviso"]){
    const box=document.getElementById(id);
    if(!box)continue;
    if(!e){
      box.hidden=true;
      box.replaceChildren();
      continue
    }
    box.hidden=false;
    const g=ce("button","button button--soft","Guardar copia"),m=ce("button","filter-chip","Más tarde");
    g.type=m.type="button";
    g.dataset.respaldoGuardar="";
    m.dataset.respaldoMasTarde="";
    box.replaceChildren(ce("span","respaldo-aviso__texto","Hace "+e.dias+" días que no guardás una copia de tus datos."),g,m)
  }
},
masTarde(){
  const o=RespaldoAviso.leer()||{version:1,primerUso:RespaldoAviso.hoy()};
  RespaldoAviso.escribir({...o,pospuesto:RespaldoAviso.hoy()});
  RespaldoAviso.pintar()
},
// Guardar copia: con el menú de compartir del teléfono (archivo .json: Drive, mail, WhatsApp) si se puede; si no, se descarga.
// Al terminar se guarda la fecha. Es lo que hace el botón "Guardar copia" de Mis datos.
guardarCopia(){
  let copy,texto,nombre;
  try{
    copy=completeBackupSnapshot(localStorage);
    texto=JSON.stringify(copy,null,2);
    nombre="mi-plato-respaldo-"+RespaldoAviso.hoy()+".json"
  }catch(e){
    Respaldo.completeBackupStatus("No se pudo exportar el respaldo.");
    return
  }
  let check;
  try{
    Respaldo.validateCompleteBackup(copy);
    check="Comprobado: este respaldo se puede restaurar."
  }catch(err){
    check="Atención: este respaldo no se podría restaurar. Motivo: "+err.message+" Conservalo y no borres datos hasta resolverlo."
  }
  const hecho=como=>{
    const o=RespaldoAviso.leer()||{version:1,primerUso:RespaldoAviso.hoy()};
    RespaldoAviso.escribir({version:1,primerUso:o.primerUso,ultimo:RespaldoAviso.hoy()});
    RespaldoAviso.pintar();
    Respaldo.completeBackupStatus(como+" "+check+" Verificá que el archivo esté guardado antes de restaurar.")
  };
  const descargar=()=>{
    let url;
    try{
      url=URL.createObjectURL(new Blob([texto],{type:"application/json"}));
      const a=ce("a");
      a.href=url;
      a.download=nombre;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      hecho("Descarga solicitada.")
    }catch(e){
      if(url)URL.revokeObjectURL(url);
      Respaldo.completeBackupStatus("No se pudo exportar el respaldo.")
    }
  };
  try{
    const file=new File([texto],nombre,{type:"application/json"});
    if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
      navigator.share({files:[file],title:"Copia de Mi Plato Fácil"}).then(()=>hecho("Copia compartida.")).catch(e=>{
        if(e&&e.name==="AbortError")return;
        descargar()
      });
      return
    }
  }catch(e){
  }
  descargar()
},
// Pide que el navegador no borre los datos cuando le falta espacio. Una vez por sesión, sin texto en pantalla y sin fallar si no existe.
pedirPersistencia(){
  if(RespaldoAviso._pedido)return;
  RespaldoAviso._pedido=true;
  try{
    if(navigator.storage&&typeof navigator.storage.persist==="function")Promise.resolve(navigator.storage.persist()).catch(()=>{})
  }catch(e){
  }
}
};
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("[data-respaldo-guardar],[data-respaldo-mas-tarde]");
  if(!b)return;
  if(b.dataset.respaldoGuardar!==undefined)RespaldoAviso.guardarCopia();
  else RespaldoAviso.masTarde()
});
