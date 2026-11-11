// Mi Plato Fácil · Eventos generales de la interfaz y arranque de la app.
// Parte 15: los archivos se unen en orden según su número, que define el orden de arranque.
document.addEventListener("pointerdown",e=>{
  const b=e.target.closest("button");if(b)Armado.tapStart(b,e)
},{
  passive:true
});
document.addEventListener("pointermove",tapMove,{
  passive:true
});
document.addEventListener("pointercancel",()=>{
  pMoved=true;pStart=null
},{
  passive:true
});
document.addEventListener("change",e=>{
  const t=e.target;if(t&&t.dataset&&t.dataset.shopKey!==undefined)Compras.toggleShop(t.dataset.shopKey,t.checked);if(t&&t.id==="varSelect")Semana.loadVariationByName(t.value)
});
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;if(pMoved&&b.classList.contains("choice")){
    e.preventDefault();e.stopPropagation();pMoved=false;return
  }Armado.haptic();if(b.dataset.openTraining!==undefined)return go("trainingCalendar");if(b.dataset.trainingExceptionSave!==undefined)return Rutina.saveTrainingException();if(b.dataset.trainingExceptionRemove)return Rutina.removeTrainingException(b.dataset.trainingExceptionRemove);if(b.dataset.trainingSave!==undefined)return Rutina.saveTrainingWeek();if(b.dataset.trainingDisable!==undefined)return Rutina.disableTrainingWeek();if(b.dataset.adviceFav!==undefined)return Ideas.toggleAdviceFav(b.dataset.adviceFav);if(b.dataset.adviceFavOnly){
    const kind=b.dataset.adviceFavOnly;adviceFavOnly[kind]=!adviceFavOnly[kind];if(kind==="menu")Ideas.renderMenuIdeas();else Ideas.renderSnackIdeas();return
  }if(b.dataset.themeToggle!==undefined)return Interfaz.cycleTheme();if(b.dataset.searchMenu!==undefined)return renderMenuSearch();if(b.dataset.menuFilter)return Armado.setMenuFilter(b.dataset.menuFilter,b);if(b.dataset.snackFilter)return Armado.setSnackFilter(b.dataset.snackFilter,b);if(b.dataset.pantryToggle)return MarcasDespensa.togglePantry(b.dataset.pantryToggle,b);if(b.dataset.pantryClear!==undefined)return MarcasDespensa.clearPantry();if(b.dataset.sort)return Armado.setSavedSort(b.dataset.sort,b);if(b.dataset.suggest)return Armado.showSuggestion(b.dataset.suggest);if(b.dataset.adviceTab)return Armado.showAdviceTab(b.dataset.adviceTab);if(b.dataset.start)return start(b.dataset.start,b.dataset.startDay,b.dataset.startSlot);if(b.dataset.frutaForma)return Armado.setFrutaForma(b.dataset.frutaForma);if(b.dataset.dayChip!==undefined)return Armado.cambiarDiaDelArmado();if(b.dataset.openIdeas!==undefined)return abrirIdeas(false);if(b.dataset.openAzar!==undefined)return go("azar");if(b.dataset.openPantry!==undefined){
    renderPantry();return go("ingredientes")
  }if(b.dataset.openPlan!==undefined){
    renderPlan();return go("plan")
  }if(b.dataset.openCompras!==undefined){
    renderCompras();return go("compras")
  }if(b.dataset.backPlan!==undefined)return openTab("semana");if(b.dataset.planSet){
    const parts=b.dataset.planSet.split("|");const sel=document.querySelector('[data-plan-select="'+b.dataset.planSet+'"]');if(sel&&sel.value)setSlot(parts[0],parts[1],sel.value);else planStatus("Elegí un plato del menú.");return
  }if(b.dataset.planClear){
    const parts=b.dataset.planClear.split("|");return Semana.clearSlot(parts[0],parts[1])
  }if(b.dataset.saveVar!==undefined)return Semana.saveVariation();if(b.dataset.delVar!==undefined)return Semana.deleteVariation();if(b.dataset.clearPlan!==undefined)return clearPlan();if(b.dataset.shareCompras!==undefined)return Compras.shareCompras();if(b.dataset.copyCompras!==undefined)return Compras.copyCompras();if(b.dataset.randomType)return AlAzar.randomMeal(b.dataset.randomType);if(b.dataset.platoDia!==undefined)return AlAzar.platoDelDia();if(b.dataset.regenRandom!==undefined){
    if(lastRandomType)return AlAzar.randomMeal(lastRandomType);return
  }if(b.dataset.go)return Armado.continueFromMulti(b.dataset.go);if(b.dataset.nextBottom!==undefined)return Armado.continueFromMulti(b.dataset.go);if(b.dataset.day)return Armado.setDay(b.dataset.day);if(b.dataset.frutaSel)return Armado.toggleFruta(b);if(b.dataset.basicoFalta!==undefined)return alternarBasicoFaltante(b.dataset.basicoFalta);if(b.dataset.frutaPrep!==undefined)return Armado.abrirPreparacionesDeFruta();if(b.dataset.pick)return Armado.pickAnim(b,b.dataset.pick,b.dataset.name,b.dataset.quantity||"",b.dataset.next);if(b.dataset.multi)return Armado.toggleMulti(b,b.dataset.multi,b.dataset.name);if(b.dataset.replace)return Armado.setReplace(b.dataset.replace,b.dataset.value==="true");if(b.dataset.edit)return edit(b.dataset.edit);if(b.dataset.toggleActions)return MisPlatos.toggleSavedActions(b.dataset.toggleActions);if(b.dataset.toggleDay!==undefined)return Armado.toggleDay();if(b.dataset.togglePortions!==undefined){
    portionEditReturn=false;Armado.syncPortionEditor();return el.portionEditor.classList.toggle("is-visible")
  }if(b.dataset.savePortions!==undefined)return Armado.savePortions();if(b.dataset.editPortionsSummary!==undefined){
    portionEditReturn=true;Armado.updatePlate();go("plate_static");el.portionEditor.classList.add("is-visible");return
  }if(b.dataset.toggleIdeas!==undefined)return el.preIdeas.classList.toggle("is-hidden");if(b.dataset.savePlate!==undefined)return abrirGuardarConNombre();if(b.dataset.shareImage!==undefined)return Compartir.shareImage();if(b.dataset.openSaved!==undefined){
    renderSaved();return go("misplatos")
  }if(b.dataset.exportPlates!==undefined)return MisPlatos.exportPlates();if(b.dataset.importPlates!==undefined){
    const fi=document.getElementById("importFile");if(fi)fi.click();return
  }if(b.dataset.clearSearch!==undefined){
    const si=document.getElementById("savedSearch");if(si)si.value="";savedQuery="";renderSaved();return
  }if(b.dataset.clearSaved!==undefined)return MisPlatos.clearAllSaved();if(b.dataset.cookSaved)return MisPlatos.cookedPlate(b.dataset.cookSaved);if(b.dataset.favSaved)return MisPlatos.toggleFav(b.dataset.favSaved);if(b.dataset.renameSaved)return renameSaved(b.dataset.renameSaved);if(b.dataset.copySaved){
    const it=MisPlatos.loadSaved().find(x=>x.id===b.dataset.copySaved);if(it)doCopy(it.text).then(ok=>savedStatus(ok?"¡Copiado!":"No se pudo copiar."));return
  }if(b.dataset.delSaved)return MisPlatos.deleteSaved(b.dataset.delSaved);if(b.dataset.copyPlate!==undefined)return Compartir.copyPlate();if(b.dataset.sharePlate!==undefined)return Compartir.sharePlate();if(b.dataset.restart!==undefined)return restart();if(b.dataset.back!==undefined)return back()
});
// Ideas (desde la v15 es una pantalla, ya no un botón flotante): Enter en el buscador busca.
document.getElementById("ideas").addEventListener("keydown",e=>{
  if(e.target&&e.target.id==="menuSearchInput"&&e.key==="Enter"){
    e.preventDefault();renderMenuSearch()
  }
});
el.homeTop.addEventListener("click",restart);
const importFileEl=document.getElementById("importFile");
if(importFileEl)importFileEl.addEventListener("change",e=>{
  const fl=e.target.files&&e.target.files[0];if(fl)MisPlatos.importPlatesFile(fl);e.target.value=""
});
const savedSearchEl=document.getElementById("savedSearch");
if(savedSearchEl)savedSearchEl.addEventListener("input",e=>{
  savedQuery=e.target.value||"";renderSaved()
});
try{
  if(window.matchMedia){
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){
      if(Interfaz.getThemeMode()==="auto")Interfaz.applyTheme()
    })
  }
}catch(e){
}
setInterval(function(){
  if(Interfaz.getThemeMode()==="auto")Interfaz.applyTheme()
},60000);
Interfaz.applyTheme();
Existencias.startupGuard("Pantalla de inicio",init);
nav();
// Etapa 32: el enlace del recordatorio ("?ir=semana-proxima") abre Semana en "Semana que viene".
try{
  if(new URLSearchParams(location.search).get("ir")==="semana-proxima"){
    openTab("semana");
    Semana.verSemana(1)
  }
}catch(e){
}
