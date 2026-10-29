// Mi Plato Fácil · Registrar en un toque: "Lo cociné" (recetas) y "Lo compré" (Compras). "Lo comí" está en Hoy.
// Parte 35: los archivos se unen en orden según su número, que define el orden de arranque.
// Cada acción usa los registros de siempre (historial de preparaciones, despensa y movimientos) y se puede
// deshacer enseguida, volviendo exactamente a como estaba. Desde la v15, lo comprado pasa a "Ya en tu despensa".
const ONE_TAP_KEYS=[PANKEY,STOCK_QUANT_KEY,"miPlatoFacil_pantryMoves_v1",COOKING_HISTORY_KEY];
// "Lo compré" tiene su propia lista: también guarda los tachados y comprados de la semana (así tachar algo después
// de "Lo cociné" no bloquea su Deshacer).
const BOUGHT_UNDO_KEYS=[...ONE_TAP_KEYS,SHOPPING_CHECKS_KEY];
const oneTapUndo={
};
// Hasta la v14 lo pasado a la despensa se recordaba solo en memoria; desde la v15 se guarda por semana. Se conserva
// la variable porque otras partes (y las pruebas) la reinician.
let comprasTransferred=new Set();
function oneTapSnapshot(keys){
  return Object.fromEntries((keys||ONE_TAP_KEYS).map(k=>[k,localStorage.getItem(k)]))
}
function oneTapRestore(u){
  if(JSON.stringify(oneTapSnapshot(u.keysList))!==JSON.stringify(u.after))throw Error("No se puede deshacer: los datos cambiaron después.");
  for(const [k,v] of Object.entries(u.before)){
    if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)
  }
  pantrySel=loadPantry()
}
function oneTapStatus(el,text,undoKey){
  el.replaceChildren(document.createTextNode(text));
  if(undoKey){
    const b=ce("button","filter-chip","Deshacer");
    b.type="button";
    b.dataset.oneTapUndo=undoKey;
    el.append(" ",b)
  }
}
function afterOneTap(){
  renderPantry();
  try{
    renderStockQuantities()
  }catch(e){
  }
  if(document.getElementById("cookingHistoryPanel").open)renderCookingHistory();
  if(stack.at(-1)==="compras")renderCompras()
}
function oneTapQty(m){
  return m.name+" "+Number(Math.abs(m.delta).toFixed(6)).toLocaleString("es-AR",{
    maximumFractionDigits:6
  })+" "+m.unit
}
// Lo cociné: anota la preparación de hoy y, si la receta tiene cantidades, las descuenta de la despensa
// (solo lo que tengas registrado; nunca deja cantidades negativas).
function cookRecipeNow(id){
  const r=loadRecipeDetails()[id];
  if(!r)throw Error("La receta ya no está disponible.");
  const amounts=loadRecipeAmounts(),a=r.amountsTitle&&Object.prototype.hasOwnProperty.call(amounts,r.amountsTitle)?amounts[r.amountsTitle]:null,names=a?a.rows.map(x=>String(x.name||"").trim()).filter(Boolean):[],hasQty=!!a&&a.rows.some(x=>x.quantity!==null&&String(x.name||"").trim());
  const before=oneTapSnapshot(),history=loadCookingHistory();
  history.push({
    id:Date.now().toString(36)+"_"+Math.random().toString(36).slice(2),date:localTrainingDate(new Date()),meal:"Otra",title:r.title,lines:names.length?["Ingredientes: "+names.join(", ")]:[],sourceId:id,status:"prepared"
  });
  try{
    localStorage.setItem(COOKING_HISTORY_KEY,JSON.stringify(history))
  }catch(e){
    throw Error("No se pudo guardar (falta de espacio u otro error). No se modificó nada.")
  }
  let res={
    moves:[],short:[]
  };
  if(hasQty){
    try{
      res=deductRecipeFromPantry(id)
    }catch(err){
      for(const [k,v] of Object.entries(before)){
        if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)
      }
      throw err
    }
  }
  let text="Anotado: cocinaste "+r.title+" hoy.";
  if(res.moves.length)text+=" Se descontó de tu despensa: "+res.moves.map(oneTapQty).join(", ")+".";
  else text+=hasQty?" No había nada registrado en tu despensa para descontar.":" La receta no tiene cantidades: la despensa no cambió.";
  if(res.short.length)text+=" No alcanzó: "+res.short.join("; ")+".";
  return {
    text,before,after:oneTapSnapshot()
  }
}
// Lo compré: lo tachado en Compras pasa a la despensa y a "Ya en tu despensa". Si se sabe cuánto falta, suma
// solo eso (lo que antes hacía "Anotar"); si no, la cantidad del plan; sin cantidad, queda marcado que lo tenés.
function boughtNow(){
  syncShoppingWeek();
  const all=shoppingPlanItems(),boughtBefore=shoppingBoughtSet(),items=all.filter(e=>comprasDone[e.key]&&!boughtBefore.has(e.key));
  if(!items.length)return {
    text:all.some(e=>comprasDone[e.key])?"Lo tachado ya está en tu despensa.":"Primero tachá lo que compraste en la lista."
  };
  const stock=loadStockQuantities(),marked=pantryMarkedMatcher(),before=oneTapSnapshot(BOUGHT_UNDO_KEYS),changes=[],marks=[],alcanzaba=[];
  for(const e of items){
    const sugg=shoppingSuggestion(e,stock,marked);
    // Si la despensa ya alcanzaba ("Ya tenés"), no se suma nada: así no se inflan las existencias.
    if(sugg&&sugg.kind==="covered"){
      alcanzaba.push(e.name);continue
    }
    const qty=sugg&&sugg.kind==="partial"?sugg.missing:mergeUnits(e.units);
    if(qty&&qty.size)for(const [unit,q] of qty){
      if(q>0)changes.push({
        name:e.name,unit,delta:q
      })
    }else marks.push(e.name)
  }
  const deshacer=()=>{
    for(const [k,v] of Object.entries(before)){
      if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)
    }
    pantrySel=loadPantry()
  };
  let newMarks=0;
  for(const name of marks){
    const chip=pantryChipFor(name),k=ingredientKey(name);
    if(chip){
      if(!pantrySel.includes(chip)){
        pantrySel.push(chip);newMarks++
      }
    }else if(!pantrySel.some(x=>!pantryById(x)&&ingredientKey(x)===k)&&!Object.values(stock).some(s=>ingredientKey(s.name)===k)){
      pantrySel.push(name);newMarks++
    }
  }
  if(newMarks&&!persistPantry()){
    pantrySel=loadPantry();throw Error("No se pudo guardar en la despensa. No se modificó nada.")
  }
  let res={
    moves:[]
  };
  try{
    if(changes.length)res=applyStockChanges(changes,("Lo compré · "+typedAppDateLabel(localTrainingDate(new Date()))).slice(0,80));
    const bought=shoppingBoughtSet();
    items.forEach(e=>bought.add(e.key));
    saveShoppingChecks(bought)
  }catch(err){
    deshacer();
    throw err
  }
  const parts=res.moves.map(oneTapQty).concat(marks.map(n=>n+" (sin cantidad)"),alcanzaba.map(n=>n+" (ya alcanzaba)"));
  return {
    text:"Pasó a tu despensa: "+parts.join(", ")+". Lo ves en Ya en tu despensa.",before,after:oneTapSnapshot(BOUGHT_UNDO_KEYS),keys:items.map(e=>e.key),keysList:BOUGHT_UNDO_KEYS
  }
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button");
  if(!b)return;
  try{
    if(b.id==="recipeReadCookNow"){
      const st=document.getElementById("recipeReadStatus");
      if(!recipeReadId)throw Error("Abrí una receta guardada primero.");
      const r=cookRecipeNow(recipeReadId);
      oneTapUndo.cook={
        before:r.before,after:r.after,status:st
      };
      afterOneTap();
      oneTapStatus(st,r.text,"cook")
    }else if(b.dataset.savedRecipeCook){
      const st=document.getElementById("savedActionStatus"),r=cookRecipeNow(b.dataset.savedRecipeCook);
      oneTapUndo.cook={
        before:r.before,after:r.after,status:st
      };
      afterOneTap();
      oneTapStatus(st,r.text,"cook")
    }else if(b.id==="comprasBought"){
      const st=document.getElementById("comprasBoughtStatus"),r=boughtNow();
      if(r.before){
        oneTapUndo.bought={
          before:r.before,after:r.after,status:st,keys:r.keys,keysList:r.keysList
        };
        afterOneTap();
        renderCompras()
      }
      oneTapStatus(st,r.text,r.before?"bought":null)
    }else if(b.dataset.oneTapUndo){
      const key=b.dataset.oneTapUndo,u=oneTapUndo[key];
      if(!u)return;
      delete oneTapUndo[key];
      try{
        oneTapRestore(u)
      }catch(err){
        oneTapStatus(u.status,err.message);return
      }
      if(u.keys)u.keys.forEach(k=>comprasTransferred.delete(k));
      afterOneTap();
      if(key==="bought")renderCompras();
      oneTapStatus(u.status,"Listo, se deshizo.")
    }
  }catch(err){
    const st=b.id==="comprasBought"?document.getElementById("comprasBoughtStatus"):b.id==="recipeReadCookNow"?document.getElementById("recipeReadStatus"):document.getElementById("savedActionStatus");
    oneTapStatus(st,err.message)
  }
});
