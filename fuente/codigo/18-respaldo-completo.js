// Mi Plato Fácil · Respaldo completo: descargar, validar y restaurar.
// Parte 19: los archivos se unen en orden según su número, que define el orden de arranque.
const COMPLETE_BACKUP_KEYS=["miPlatoFacil_adviceFavorites", "miPlatoFacil_datedWeeks_v1", "miPlatoFacil_manualShopping_v1", "miPlatoFacil_pantry", "miPlatoFacil_plan", "miPlatoFacil_planVars", "miPlatoFacil_saved", "miPlatoFacil_theme", "miPlatoFacil_trainingExceptions", "miPlatoFacil_trainingWeek", "miPlatoFacil_cookingHistory_v1", "miPlatoFacil_recipeAmounts_v1", "miPlatoFacil_referencePrices_v1", "miPlatoFacil_recipeDetails_v1", "miPlatoFacil_pantryQuantities_v1", "miPlatoFacil_shoppingBudget_v1", "miPlatoFacil_recipePreferences_v1", "miPlatoFacil_ingredientAliases_v1", "miPlatoFacil_planPortions_v1", "miPlatoFacil_planHistory_v1", "miPlatoFacil_consumption_v1", "miPlatoFacil_habitGoals_v1", "miPlatoFacil_purchases_v1", "miPlatoFacil_pantryMoves_v1", "miPlatoFacil_shoppingChecks_v1","miPlatoFacil_bienvenida_v1","miPlatoFacil_comprasOpciones_v1"];
const COMPLETE_BACKUP_OPTIONAL_KEYS=["miPlatoFacil_cookingHistory_v1","miPlatoFacil_recipeAmounts_v1","miPlatoFacil_referencePrices_v1","miPlatoFacil_recipeDetails_v1","miPlatoFacil_pantryQuantities_v1","miPlatoFacil_shoppingBudget_v1","miPlatoFacil_recipePreferences_v1","miPlatoFacil_ingredientAliases_v1","miPlatoFacil_planPortions_v1","miPlatoFacil_planHistory_v1","miPlatoFacil_consumption_v1","miPlatoFacil_habitGoals_v1","miPlatoFacil_purchases_v1","miPlatoFacil_pantryMoves_v1","miPlatoFacil_shoppingChecks_v1","miPlatoFacil_bienvenida_v1","miPlatoFacil_comprasOpciones_v1"];
function validStockQuantitiesStore(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=1000&&Object.entries(o).every(([key,v])=>!["__proto__","constructor","prototype"].includes(key)&&!!v&&typeof v==="object"&&typeof v.name==="string"&&v.name.trim().length>0&&v.name.length<=100&&typeof v.unit==="string"&&RECIPE_AMOUNT_UNITS.includes(v.unit)&&typeof v.quantity==="number"&&Number.isFinite(v.quantity)&&v.quantity>=0&&v.quantity<=100000000&&key===stockKey(v.name,v.unit))
}
function validShoppingBudget(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&["ARS","USD"].includes(o.currency)&&typeof o.limit==="number"&&Number.isFinite(o.limit)&&o.limit>=0&&o.limit<=100000000000&&(o.period===undefined||o.period==="semana"||o.period==="mes")&&(o.people===undefined||Number.isInteger(o.people)&&o.people>=1&&o.people<=50)
}
function validRecipePreferences(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&typeof o.words==="string"&&o.words.length<=1000&&typeof o.enabled==="boolean"
}
// v15.3: la marca "ya vio la bienvenida" (miPlatoFacil_bienvenida_v1). Solo vale {"vista":true}.
function validBienvenida(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===1&&o.vista===true
}
let completeBackupPending=null;
function completeBackupSnapshot(storage){
  return {
    app:"MiPlatoFacil",format:"complete-local-v1",createdAt:new Date().toISOString(),data:Object.fromEntries(COMPLETE_BACKUP_KEYS.map(k=>[k,storage.getItem(k)]).filter(([k,v])=>!([INGREDIENT_ALIASES_KEY,"miPlatoFacil_planPortions_v1","miPlatoFacil_planHistory_v1","miPlatoFacil_consumption_v1","miPlatoFacil_habitGoals_v1","miPlatoFacil_purchases_v1","miPlatoFacil_pantryMoves_v1","miPlatoFacil_shoppingChecks_v1","miPlatoFacil_bienvenida_v1","miPlatoFacil_comprasOpciones_v1"].includes(k)&&v===null)))
  }
}
function validateCompleteBackup(o){
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
    if(k==="miPlatoFacil_pantryQuantities_v1"&&!validStockQuantitiesStore(v))throw new Error("Existencias de despensa inválidas.");
    if(k==="miPlatoFacil_shoppingBudget_v1"&&!validShoppingBudget(v))throw new Error("Presupuesto de compras inválido.");
    if(k==="miPlatoFacil_recipePreferences_v1"&&!validRecipePreferences(v))throw new Error("Preferencias de recetas inválidas.");
    if(k==="miPlatoFacil_ingredientAliases_v1"&&!validIngredientAliases(v))throw new Error("Equivalencias de ingredientes inválidas.");
    if(k==="miPlatoFacil_planPortions_v1"&&!validPlanPortions(v))throw new Error("Porciones del plan inválidas.");
    if(k==="miPlatoFacil_planHistory_v1"&&!validPlanHistory(v))throw new Error("Historial del plan inválido.");
    if(k==="miPlatoFacil_consumption_v1"&&!validConsumption(v))throw new Error("Registro de consumo inválido.");
    if(k==="miPlatoFacil_habitGoals_v1"&&!validHabitGoals(v))throw new Error("Objetivos semanales inválidos.");
    if(k==="miPlatoFacil_purchases_v1"&&!validPurchases(v))throw new Error("Compras registradas inválidas.");
    if(k==="miPlatoFacil_bienvenida_v1"&&!validBienvenida(v))throw new Error("Marca de bienvenida inválida.");
    if(k==="miPlatoFacil_comprasOpciones_v1"&&!validComprasOpciones(v))throw new Error("Opciones de compras inválidas.");
    if(k==="miPlatoFacil_shoppingChecks_v1"&&!validShoppingChecks(v))throw new Error("Tachados de la lista inválidos.");
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
}
function restoreCompleteBackup(o,storage){
  validateCompleteBackup(o);
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
}
function completeBackupStatus(t){
  document.getElementById("backupStatus").textContent=t
}
function updateCompleteBackupButton(){
  document.getElementById("backupRestore").disabled=!completeBackupPending
}
document.getElementById("backupExport").addEventListener("click",()=>{
  let url;try{
    const copy=completeBackupSnapshot(localStorage);url=URL.createObjectURL(new Blob([JSON.stringify(copy,null,2)],{
      type:"application/json"
    }));const a=ce("a");a.href=url;a.download="mi-plato-respaldo-"+localTrainingDate(new Date())+".json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);let check;try{
      validateCompleteBackup(copy);check="Comprobado: este respaldo se puede restaurar."
    }catch(err){
      check="Atención: este respaldo no se podría restaurar. Motivo: "+err.message+" Conservalo y no borres datos hasta resolverlo."
    }completeBackupStatus("Descarga solicitada. "+check+" Verificá que el archivo esté guardado antes de restaurar.")
  }catch(e){
    if(url)URL.revokeObjectURL(url);completeBackupStatus("No se pudo exportar el respaldo.")
  }
});
document.getElementById("backupFile").addEventListener("change",async e=>{
  completeBackupPending=null;document.getElementById("backupPreview").textContent="";updateCompleteBackupButton();const f=e.target.files&&e.target.files[0];if(!f)return;try{
    if(f.size>10000000)throw new Error("El archivo supera el límite de 10 MB.");const o=validateCompleteBackup(JSON.parse(await f.text()));completeBackupPending=o;document.getElementById("backupPreview").textContent="Respaldo compatible: "+COMPLETE_BACKUP_KEYS.filter(k=>o.data[k]!=null).length+" módulos con datos. Se reemplazarán también los módulos vacíos.";completeBackupStatus("Archivo validado. No se modificaron datos.")
  }catch(err){
    completeBackupStatus(err.message||"No se pudo leer el archivo.")
  }updateCompleteBackupButton()
});
document.getElementById("backupRestore").addEventListener("click",()=>{
  if(!completeBackupPending)return;const button=document.getElementById("backupRestore");button.classList.add("backup-selected");const accepted=window.confirm("Confirmar restauración\n\nConfirmo que descargué mi copia actual y acepto reemplazar los datos guardados por el respaldo seleccionado. No se combinarán.\n\nLa app se recargará automáticamente al terminar y se perderán las selecciones en curso.\n\n¿Continuar?");if(!accepted){
    button.classList.remove("backup-selected");return
  }button.disabled=true;button.setAttribute("aria-busy","true");button.textContent="Restaurando…";try{
    restoreCompleteBackup(completeBackupPending,localStorage);completeBackupPending=null;button.textContent="✓ Restauración completada";completeBackupStatus("Datos restaurados. Recargando la aplicación…");const shield=ce("div","backup-reload-shield");shield.setAttribute("role","status");shield.setAttribute("aria-live","polite");shield.append(ce("p",null,"✓ Datos restaurados. Recargando…"));document.body.append(shield);setTimeout(()=>window.location.reload(),450)
  }catch(e){
    button.classList.remove("backup-selected");button.removeAttribute("aria-busy");button.textContent="Restaurar copia seleccionada";updateCompleteBackupButton();completeBackupStatus(e.message)
  }
});
// Tarjeta "Mis datos" en Más (desde la v15.3 está en el HTML): abre el respaldo.
document.getElementById("backupOpen").addEventListener("click",()=>go("backupScreen"));
const COOKING_HISTORY_KEY="miPlatoFacil_cookingHistory_v1";
