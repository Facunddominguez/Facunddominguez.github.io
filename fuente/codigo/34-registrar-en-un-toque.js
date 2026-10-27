// Mi Plato Fácil · Registrar en un toque: "Lo cociné" (recetas) y "Lo compré" (Compras). "Lo comí" está en Hoy.
// Parte 35: los archivos se unen en orden según su número, que define el orden de arranque.
// Cada acción usa los registros de siempre (historial de preparaciones, despensa y movimientos) y se puede
// deshacer enseguida, volviendo exactamente a como estaba. La lista de compras no cambia: solo la despensa.
const ONE_TAP_KEYS=[PANKEY,STOCK_QUANT_KEY,"miPlatoFacil_pantryMoves_v1",COOKING_HISTORY_KEY];
const oneTapUndo={
};
let comprasTransferred=new Set();
function oneTapSnapshot(){
  return Object.fromEntries(ONE_TAP_KEYS.map(k=>[k,localStorage.getItem(k)]))
}
function oneTapRestore(u){
  if(JSON.stringify(oneTapSnapshot())!==JSON.stringify(u.after))throw Error("No se puede deshacer: los datos cambiaron después.");
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
// Lo compré: lo tachado en Compras pasa a la despensa. Con cantidad conocida suma a las existencias
// (o la cantidad de la sugerencia que aplicaste); sin cantidad, queda marcado como que lo tenés.
function boughtNow(){
  const all=shoppingPlanItems(),ticked=all.filter(e=>comprasDone[e.key]);
  if(!ticked.length)return {
    text:"Primero tachá lo que compraste en la lista."
  };
  const items=ticked.filter(e=>!comprasTransferred.has(e.key));
  if(!items.length)return {
    text:"Lo tachado ya está en tu despensa."
  };
  const stock=loadStockQuantities(),marked=pantryMarkedMatcher(),before=oneTapSnapshot(),changes=[],marks=[];
  for(const e of items){
    const label=shoppingItemLabel(e),sugg=shoppingSuggestion(e,stock,marked),a=comprasApplied[e.key],applied=!!(a&&sugg&&sugg.kind==="partial"&&a.label===label&&a.buy===sugg.buy),qty=applied?sugg.missing:mergeUnits(e.units);
    if(qty&&qty.size)for(const [unit,q] of qty){
      if(q>0)changes.push({
        name:e.name,unit,delta:q
      })
    }else marks.push(e.name)
  }
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
  if(changes.length){
    try{
      res=applyStockChanges(changes,("Lo compré · "+typedAppDateLabel(localTrainingDate(new Date()))).slice(0,80))
    }catch(err){
      for(const [k,v] of Object.entries(before)){
        if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)
      }
      pantrySel=loadPantry();
      throw err
    }
  }
  items.forEach(e=>comprasTransferred.add(e.key));
  const parts=res.moves.map(oneTapQty).concat(marks.map(n=>n+" (sin cantidad)"));
  return {
    text:"Pasó a tu despensa: "+parts.join(", ")+"."+(ticked.length>items.length?" Lo que ya habías pasado no se repite.":"")+" La lista no cambió.",before,after:oneTapSnapshot(),keys:items.map(e=>e.key)
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
          before:r.before,after:r.after,status:st,keys:r.keys
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
