// Mi Plato Fácil · Eventos generales de la interfaz y arranque de la app.
// Parte 15: los archivos se unen en orden según su número, que define el orden de arranque.
document.addEventListener("pointerdown",e=>{
  const b=e.target.closest("button");if(b)tapStart(b,e)
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
  const t=e.target;if(t&&t.dataset&&t.dataset.shopKey!==undefined)toggleShop(t.dataset.shopKey,t.checked);if(t&&t.id==="varSelect")loadVariationByName(t.value)
});
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;if(pMoved&&b.classList.contains("choice")){
    e.preventDefault();e.stopPropagation();pMoved=false;return
  }haptic();if(b.dataset.openTraining!==undefined)return go("trainingCalendar");if(b.dataset.trainingExceptionSave!==undefined)return saveTrainingException();if(b.dataset.trainingExceptionRemove)return removeTrainingException(b.dataset.trainingExceptionRemove);if(b.dataset.trainingSave!==undefined)return saveTrainingWeek();if(b.dataset.trainingDisable!==undefined)return disableTrainingWeek();if(b.dataset.adviceFav!==undefined)return toggleAdviceFav(b.dataset.adviceFav);if(b.dataset.adviceFavOnly){
    const kind=b.dataset.adviceFavOnly;adviceFavOnly[kind]=!adviceFavOnly[kind];if(kind==="menu")renderMenuIdeas();else renderSnackIdeas();return
  }if(b.dataset.themeToggle!==undefined)return cycleTheme();if(b.dataset.searchMenu!==undefined)return renderMenuSearch();if(b.dataset.menuFilter)return setMenuFilter(b.dataset.menuFilter,b);if(b.dataset.snackFilter)return setSnackFilter(b.dataset.snackFilter,b);if(b.dataset.pantryToggle)return togglePantry(b.dataset.pantryToggle,b);if(b.dataset.pantryClear!==undefined)return clearPantry();if(b.dataset.sort)return setSavedSort(b.dataset.sort,b);if(b.dataset.suggest)return showSuggestion(b.dataset.suggest);if(b.dataset.adviceTab)return showAdviceTab(b.dataset.adviceTab);if(b.dataset.start)return start(b.dataset.start);if(b.dataset.openAzar!==undefined)return go("azar");if(b.dataset.openPantry!==undefined){
    renderPantry();return go("ingredientes")
  }if(b.dataset.openPlan!==undefined){
    renderPlan();return go("plan")
  }if(b.dataset.openCompras!==undefined){
    renderCompras();return go("compras")
  }if(b.dataset.backPlan!==undefined)return go("plan");if(b.dataset.planSet){
    const parts=b.dataset.planSet.split("|");const sel=document.querySelector('[data-plan-select="'+b.dataset.planSet+'"]');if(sel&&sel.value)setSlot(parts[0],parts[1],sel.value);else planStatus("Elegí un plato del menú.");return
  }if(b.dataset.planClear){
    const parts=b.dataset.planClear.split("|");return clearSlot(parts[0],parts[1])
  }if(b.dataset.saveVar!==undefined)return saveVariation();if(b.dataset.delVar!==undefined)return deleteVariation();if(b.dataset.clearPlan!==undefined)return clearPlan();if(b.dataset.shareCompras!==undefined)return shareCompras();if(b.dataset.copyCompras!==undefined)return copyCompras();if(b.dataset.randomType)return randomMeal(b.dataset.randomType);if(b.dataset.platoDia!==undefined)return platoDelDia();if(b.dataset.regenRandom!==undefined){
    if(lastRandomType)return randomMeal(lastRandomType);return
  }if(b.dataset.go)return continueFromMulti(b.dataset.go);if(b.dataset.nextBottom!==undefined)return continueFromMulti(b.dataset.go);if(b.dataset.day)return setDay(b.dataset.day);if(b.dataset.pick)return pickAnim(b,b.dataset.pick,b.dataset.name,b.dataset.quantity||"",b.dataset.next);if(b.dataset.multi)return toggleMulti(b,b.dataset.multi,b.dataset.name);if(b.dataset.replace)return setReplace(b.dataset.replace,b.dataset.value==="true");if(b.dataset.edit)return edit(b.dataset.edit);if(b.dataset.toggleActions)return toggleSavedActions(b.dataset.toggleActions);if(b.dataset.toggleDay!==undefined)return toggleDay();if(b.dataset.togglePortions!==undefined){
    portionEditReturn=false;syncPortionEditor();return el.portionEditor.classList.toggle("is-visible")
  }if(b.dataset.savePortions!==undefined)return savePortions();if(b.dataset.editPortionsSummary!==undefined){
    portionEditReturn=true;updatePlate();go("plate_static");el.portionEditor.classList.add("is-visible");return
  }if(b.dataset.toggleIdeas!==undefined)return el.preIdeas.classList.toggle("is-hidden");if(b.dataset.openAdvice!==undefined){
    renderContextAdvice();el.adviceModal.classList.add("is-visible");const cb=el.adviceModal.querySelector("[data-close-advice]");if(cb)cb.focus();return
  }if(b.dataset.closeAdvice!==undefined){
    resetAdviceTemporaryState();el.adviceModal.classList.remove("is-visible");el.adviceFab.focus();return
  }if(b.dataset.savePlate!==undefined)return savePlate();if(b.dataset.shareImage!==undefined)return shareImage();if(b.dataset.openSaved!==undefined){
    renderSaved();return go("misplatos")
  }if(b.dataset.exportPlates!==undefined)return exportPlates();if(b.dataset.importPlates!==undefined){
    const fi=document.getElementById("importFile");if(fi)fi.click();return
  }if(b.dataset.clearSearch!==undefined){
    const si=document.getElementById("savedSearch");if(si)si.value="";savedQuery="";renderSaved();return
  }if(b.dataset.clearSaved!==undefined)return clearAllSaved();if(b.dataset.cookSaved)return cookedPlate(b.dataset.cookSaved);if(b.dataset.favSaved)return toggleFav(b.dataset.favSaved);if(b.dataset.renameSaved)return renameSaved(b.dataset.renameSaved);if(b.dataset.copySaved){
    const it=loadSaved().find(x=>x.id===b.dataset.copySaved);if(it)doCopy(it.text).then(ok=>savedStatus(ok?"¡Copiado!":"No se pudo copiar."));return
  }if(b.dataset.delSaved)return deleteSaved(b.dataset.delSaved);if(b.dataset.copyPlate!==undefined)return copyPlate();if(b.dataset.sharePlate!==undefined)return sharePlate();if(b.dataset.restart!==undefined)return restart();if(b.dataset.back!==undefined)return back()
});
el.adviceModal.addEventListener("click",e=>{
  if(e.target===el.adviceModal){
    resetAdviceTemporaryState();el.adviceModal.classList.remove("is-visible");el.adviceFab.focus()
  }
});
el.adviceModal.addEventListener("keydown",e=>{
  if(e.target&&e.target.id==="menuSearchInput"&&e.key==="Enter"){
    e.preventDefault();renderMenuSearch()
  }
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&el.adviceModal.classList.contains("is-visible")){
    resetAdviceTemporaryState();el.adviceModal.classList.remove("is-visible");el.adviceFab.focus()
  }
});
el.adviceModal.addEventListener("keydown",e=>{
  if(e.key!=="Tab"||!el.adviceModal.classList.contains("is-visible"))return;const f=el.adviceModal.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');const vis=Array.prototype.filter.call(f,x=>x.offsetParent!==null&&!x.disabled);if(!vis.length)return;const first=vis[0],last=vis[vis.length-1];if(e.shiftKey&&document.activeElement===first){
    e.preventDefault();last.focus()
  }else if(!e.shiftKey&&document.activeElement===last){
    e.preventDefault();first.focus()
  }else if(!el.adviceModal.contains(document.activeElement)){
    e.preventDefault();first.focus()
  }
});
el.homeTop.addEventListener("click",restart);
const importFileEl=document.getElementById("importFile");
if(importFileEl)importFileEl.addEventListener("change",e=>{
  const fl=e.target.files&&e.target.files[0];if(fl)importPlatesFile(fl);e.target.value=""
});
const savedSearchEl=document.getElementById("savedSearch");
if(savedSearchEl)savedSearchEl.addEventListener("input",e=>{
  savedQuery=e.target.value||"";renderSaved()
});
try{
  if(window.matchMedia){
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){
      if(getThemeMode()==="auto")applyTheme()
    })
  }
}catch(e){
}
setInterval(function(){
  if(getThemeMode()==="auto")applyTheme()
},60000);
applyTheme();
startupGuard("Pantalla de inicio",init);
nav();
