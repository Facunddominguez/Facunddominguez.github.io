// Mi Plato Fácil · Lista de compras derivada del plan y sugerencias.
// Parte 13 de 30: los archivos se unen en este orden (el número define el orden de arranque).
function shoppingQuantityAndCost(){
  const box=document.getElementById("shoppingQuantCostResult");
  if(!box)return;
  box.replaceChildren();
  const multiplier=Number(document.getElementById("shoppingPortionMultiplier").value);
  if(!Number.isFinite(multiplier)||multiplier<0.25||multiplier>20){
    box.textContent="Ingresá un multiplicador entre 0,25 y 20.";
    return
  }
  const pantryNames=pantryMarkedMatcher();
  const markPantry=document.getElementById("shoppingMarkPantry").checked,stock=loadStockQuantities();
  let recipes;
  try{
    recipes=loadRecipeDetails()
  }catch(err){
    box.textContent=err.message;
    return
  }
  const planned=planEntriesFlat().filter(x=>x.item&&x.item.recipeSourceId),amounts=loadRecipeAmounts(),prices=Object.values(loadReferencePrices()),totals=new Map(),issues=[];
  for(const {
    item,portions
  } of planned){
    const recipe=recipes[item.recipeSourceId],amount=recipe&&recipe.amountsTitle&&amounts[recipe.amountsTitle];
    if(!amount){
      issues.push((item.title||"Receta")+": cantidades no disponibles");
      continue
    }
    for(const row of amount.rows){
      if(!row.name||!row.name.trim())continue;
      const key=JSON.stringify([ingredientKey(row.name),unitInfo(row.unit).dim]);
      if(!totals.has(key))totals.set(key,{
        name:row.name,unit:row.unit,quantity:0,unknown:false,uses:0
      });
      const entry=totals.get(key);
      entry.uses++;
      if(row.quantity===null)entry.unknown=true;
      else entry.quantity+=convertQuantity(row.quantity,row.unit,entry.unit)*multiplier*portionFactor(portions,amount)
    }
  }
  const summary=ce("p","screen__hint",planned.length+" asignaciones de recetas con cantidades. Los platos sin receta vinculada permanecen en la lista tradicional.");
  box.append(summary);
  if(!planned.length){
    box.append(ce("p","screen__hint","Asigná recetas con cantidades al plan para ver el detalle."));
    return
  }
  const ul=ce("ul"),currencyTotals={
  },missing=[];
  for(const item of [...totals.values()].sort((a,b)=>a.name.localeCompare(b.name,"es"))){
    const li=ce("li"),quantity=Number(item.quantity.toFixed(6)),available=stockQuantityFor(stock,item.name,item.unit),known=Number.isFinite(available),needed=known?Math.max(0,item.quantity-available):item.quantity;
    let label=item.name+(markPantry&&pantryNames.has(normalizeSearchText(item.name))?" (marcado en despensa; cantidad disponible desconocida)":"")+": "+quantity.toLocaleString("es-AR",{
      maximumFractionDigits:6
    })+" "+item.unit+(item.unknown?" (más cantidades desconocidas)":"")+(known?" · Disponible: "+available.toLocaleString("es-AR")+" "+item.unit+" · Falta comprar: "+Number(needed.toFixed(6)).toLocaleString("es-AR")+" "+item.unit:" · Existencia sin cantidad registrada: compra estimada sin descuento");
    const matches=pricesFor(prices,item.name,item.unit).filter(p=>true);
    if(item.unknown||!item.quantity){
      missing.push(item.name+": cantidad incompleta")
    }else if(matches.length!==1){
      missing.push(item.name+": "+(matches.length?"varios precios posibles":"sin precio compatible"))
    }else{
      const price=matches[0],cost=needed*price.price/price.amount;
      if(Number.isFinite(cost)){
        currencyTotals[price.currency]=(currencyTotals[price.currency]||0)+cost;
        label+=" · "+cost.toLocaleString("es-AR",{
          minimumFractionDigits:2,maximumFractionDigits:2
        })+" "+price.currency+" (referencia: "+typedAppDateLabel(price.date)+")"
      }else missing.push(item.name+": costo fuera de rango")
    }
    li.textContent=label;
    ul.append(li)
  }
  box.append(ul);
  for(const [currency,total] of Object.entries(currencyTotals))box.append(ce("p","shop-item","Subtotal estimado con referencias inequívocas: "+total.toLocaleString("es-AR",{
    minimumFractionDigits:2,maximumFractionDigits:2
  })+" "+currency));
  if(missing.length||issues.length){
    box.append(ce("strong",null,"Pendiente de estimar:"));
    const list=ce("ul");
    for(const issue of [...issues,...missing])list.append(ce("li",null,issue));
    box.append(list)
  }
  box.append(ce("p","screen__hint","Simulación con multiplicador "+multiplier+". Descuenta solo existencias registradas con cantidad y unidad compatible. Los costos corresponden al faltante calculable. No estima envases enteros ni incluye platos sin cantidades vinculadas."))
}
document.getElementById("shoppingPortionMultiplier").addEventListener("change",()=>{
  shoppingQuantityAndCost();renderCompras()
});
document.getElementById("shoppingMarkPantry").addEventListener("change",shoppingQuantityAndCost);
document.getElementById("shoppingQuantCostRefresh").addEventListener("click",()=>{
  shoppingQuantityAndCost();renderCompras()
});
document.getElementById("shoppingQuantCostPanel").addEventListener("toggle",e=>{
  if(e.currentTarget.open)shoppingQuantityAndCost()
});
function shoppingMissingRows(){
  const totals=new Map(),unknown=new Set(),recipes=loadRecipeDetails(),amounts=loadRecipeAmounts(),stock=loadStockQuantities(),multiplier=Number(document.getElementById("shoppingPortionMultiplier").value);
  if(!Number.isFinite(multiplier)||multiplier<0.25||multiplier>20)return [];
  for(const {
    item,portions
  } of planEntriesFlat()){
    if(!item||!item.recipeSourceId)continue;
    const recipe=recipes[item.recipeSourceId],amount=recipe&&recipe.amountsTitle&&amounts[recipe.amountsTitle];
    if(!amount)continue;
    for(const row of amount.rows){
      if(!row.name||!row.name.trim())continue;
      const key=JSON.stringify([ingredientKey(row.name),unitInfo(row.unit).dim]);
      if(!totals.has(key))totals.set(key,{
        name:row.name,unit:row.unit,quantity:0,unknown:false
      });
      const t=totals.get(key);
      if(row.quantity===null)t.unknown=true;
      else t.quantity+=convertQuantity(row.quantity,row.unit,t.unit)*multiplier*portionFactor(portions,amount)
    }
  }
  return [...totals.values()].map(t=>{
    const available=stockQuantityFor(stock,t.name,t.unit);return {
      ...t,available,missing:Math.max(0,t.quantity-(available===null?0:available))
    }
  }).sort((a,b)=>a.name.localeCompare(b.name,"es"))
}
let comprasShowAll=false;
let comprasApplied={
};
function shoppingQtyText(units){
  return [...units.entries()].map(([unit,q])=>Number(q.toFixed(6)).toLocaleString("es-AR",{
    maximumFractionDigits:6
  })+" "+unit).join(" + ")
}
function shoppingPlanItems(){
  let recipes=null,amounts=null;
  const map=new Map(),entry=name=>{
    const key=ingredientKey(name),raw=String(name).trim();
    if(!map.has(key))map.set(key,{
      key,name:raw,units:new Map(),unknown:0,forms:new Set()
    });
    const e=map.get(key);
    e.forms.add(normalizeSearchText(raw));
    return e
  };
  for(const {
    item,portions
  } of planEntriesFlat()){
    let amount=null;
    if(item&&item.recipeSourceId){
      if(!recipes){
        recipes=loadRecipeDetails();
        amounts=loadRecipeAmounts()
      }
      const recipe=recipes[item.recipeSourceId];
      amount=recipe&&recipe.amountsTitle&&amounts[recipe.amountsTitle]||null
    }
    if(amount){
      for(const row of amount.rows){
        if(!row.name||!row.name.trim())continue;
        const e=entry(row.name);
        if(row.quantity===null)e.unknown++;
        else e.units.set(row.unit,(e.units.get(row.unit)||0)+row.quantity*portionFactor(portions,amount))
      }
    }else extractIngredients(item).forEach(name=>{
      if(String(name).trim())entry(name).unknown++
    })
  }
  const order=u=>{
    const i=RECIPE_AMOUNT_UNITS.indexOf(u);
    return i<0?99:i
  };
  return [...map.values()].map(e=>{
    e.units=new Map([...e.units.entries()].sort((a,b)=>order(a[0])-order(b[0])));if(e.forms.size>1)e.name=ingredientDisplayName(e.key,e.name);return e
  })
}
function shoppingItemLabel(e){
  const qty=shoppingQtyText(mergeUnits(e.units));
  if(!qty)return e.name+(e.unknown>1?" (×"+e.unknown+")":"");
  return e.name+": "+qty+(e.unknown?" + sin cantidad en "+e.unknown+" plato"+(e.unknown===1?"":"s"):"")
}
function shoppingSuggestion(e,stock,marked){
  const own=Object.values(stock).filter(s=>ingredientKey(s.name)===e.key);
  if(!own.length)return marked.has(e.name)?{
    kind:"info",text:"Lo marcaste en “Con lo que tengo” (sin cantidad registrada)."
  }:null;
  const fmt=n=>Number(n.toFixed(6)).toLocaleString("es-AR",{
    maximumFractionDigits:6
  });
  const planUnits=[...e.units.keys()],need=new Map();
  for(const [unit,q] of e.units){
    const i=unitInfo(unit);
    need.set(i.dim,(need.get(i.dim)||0)+q*i.factor)
  }
  const have=own.map(s=>fmt(s.quantity)+" "+s.unit+(need.size&&!need.has(unitInfo(s.unit).dim)?" (en otra unidad, sin convertir)":"")).join(" + ");
  if(!e.units.size)return {
    kind:"info",text:"Despensa: tenés "+have+". El plan no indica cantidad: revisá si alcanza."
  };
  let reduced=false;
  const missing=new Map();
  for(const [dim,base] of need){
    const mine=own.filter(s=>unitInfo(s.unit).dim===dim);
    let left=base;
    if(mine.length){
      reduced=true;
      left=Math.max(0,base-mine.reduce((t,s)=>t+s.quantity*unitInfo(s.unit).factor,0))
    }
    if(left>1e-9)for(const [u,q] of displayMissing(dim,left,planUnits))missing.set(u,(missing.get(u)||0)+q)
  }
  if(!reduced)return {
    kind:"info",text:"Despensa: tenés "+have+". No se descuenta porque la unidad no coincide."
  };
  if(!missing.size)return e.unknown?{
    kind:"info",text:"Despensa: tenés "+have+". Cubre lo que tiene cantidad; revisá si alcanza para lo que no la tiene."
  }:{
    kind:"covered",text:"Despensa: tenés "+have+", alcanza para el plan."
  };
  const buy=shoppingQtyText(missing);
  return {
    kind:"partial",text:"Despensa: tenés "+have+". Podrías comprar "+buy+(e.unknown?", más lo que no tiene cantidad.":"."),buy
  }
}
function shoppingDisplayItems(){
  const stock=loadStockQuantities(),marked=pantryMarkedMatcher();
  return shoppingPlanItems().map(e=>{
    const label=shoppingItemLabel(e),suggestion=shoppingSuggestion(e,stock,marked),a=comprasApplied[e.key],applied=!!(a&&suggestion&&suggestion.kind==="partial"&&a.label===label&&a.buy===suggestion.buy);if(a&&!applied)delete comprasApplied[e.key];return {
      key:e.key,name:e.name,label,suggestion,applied,text:applied?label+" → comprar "+suggestion.buy+" (sugerencia aplicada)":label
    }
  }).sort((a,b)=>a.label.localeCompare(b.label,"es"))
}
function renderCompras(){
  const cont=document.getElementById("comprasList"),hint=document.getElementById("comprasHint"),summary=document.getElementById("comprasSummary");
  if(!cont)return;
  let items;
  try{
    items=shoppingDisplayItems()
  }catch(e){
    cont.replaceChildren(ce("p","screen__hint","No se pudo calcular la lista: "+e.message));
    return
  }
  const pending=items.filter(x=>!comprasDone[x.key]);
  summary.textContent=pending.length+" pendientes · "+(items.length-pending.length)+" tachados";
  hint.textContent="Lista del plan. La despensa y las porciones no la cambian. Si registrás existencias en 🧰 Más herramientas, verás sugerencias debajo de cada ingrediente, que aplicás vos.";
  document.getElementById("comprasShowPending").setAttribute("aria-pressed",String(!comprasShowAll));
  document.getElementById("comprasShowAll").setAttribute("aria-pressed",String(comprasShowAll));
  const visible=comprasShowAll?items:pending;
  if(!visible.length){
    cont.replaceChildren(ce("p","screen__hint",items.length?"No quedan productos pendientes. Podés ver los tachados en Todos.":"No hay compras pendientes. Agregá platos al plan semanal."));
    return
  }
  const nodes=[];
  for(const x of visible){
    const done=!!comprasDone[x.key],row=ce("div","shop-item"+(done?" is-done":"")),cb=ce("input"),lab=ce("label",null,x.text);
    cb.type="checkbox";
    cb.checked=done;
    cb.dataset.shopKey=x.key;
    cb.id="shopItem_"+nodes.length;
    lab.htmlFor=cb.id;
    row.append(cb,lab);
    nodes.push(row);
    if(done||!x.suggestion)continue;
    const box=ce("div","shop-suggestion"),button=(text,key,aria)=>{
      const b=ce("button","filter-chip",text);
      b.type="button";
      b.dataset[key]=x.key;
      b.setAttribute("aria-label",aria);
      box.append(b)
    };
    if(x.applied){
      box.append(ce("span",null,"💡 Aplicada: comprar "+x.suggestion.buy+" según tu despensa."));
      button("Deshacer","shopSuggestUndo","Deshacer la sugerencia aplicada a "+x.name)
    }else{
      box.append(ce("span",null,"💡 "+x.suggestion.text));
      if(x.suggestion.kind==="partial")button("Anotar "+x.suggestion.buy,"shopSuggestApply","Anotar comprar "+x.suggestion.buy+" de "+x.name);
      else if(x.suggestion.kind==="covered")button("Tachar","shopSuggestTick","Tachar "+x.name+" de la lista")
    }
    nodes.push(box)
  }
  cont.replaceChildren(...nodes)
}
document.getElementById("comprasList").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;if(b.dataset.shopSuggestApply!==undefined){
    const x=shoppingDisplayItems().find(i=>i.key===b.dataset.shopSuggestApply);if(x&&x.suggestion&&x.suggestion.kind==="partial")comprasApplied[x.key]={
      label:x.label,buy:x.suggestion.buy
    };renderCompras();return
  }if(b.dataset.shopSuggestUndo!==undefined){
    delete comprasApplied[b.dataset.shopSuggestUndo];renderCompras();return
  }if(b.dataset.shopSuggestTick!==undefined){
    comprasDone[b.dataset.shopSuggestTick]=true;renderCompras()
  }
});
document.getElementById("comprasShowPending").addEventListener("click",()=>{
  comprasShowAll=false;renderCompras()
});
document.getElementById("comprasShowAll").addEventListener("click",()=>{
  comprasShowAll=true;renderCompras()
});
function toggleShop(key,checked){
  comprasDone[key]=checked;
  renderCompras()
}
function comprasText(){
  const lines=shoppingDisplayItems().filter(x=>!comprasDone[x.key]).map(x=>"• "+x.text),extras=manualShoppingText();
  if(!lines.length&&!extras)return "";
  return "🛒 Lista de compras — Mi plato fácil"+NL+lines.join(NL)+(extras?(lines.length?NL+NL:"")+"Productos extra"+NL+extras:"")
}
function comprasStatus(msg){
  const s=document.getElementById("comprasStatus");
  if(s)s.textContent=msg
}
function copyCompras(){
  let t;
  try{
    t=comprasText()
  }catch(err){
    comprasStatus(err.message);
    return
  }
  if(!t){
    comprasStatus("No hay ingredientes para copiar (¿tachaste todos?).");
    return
  }
  doCopy(t).then(function(ok){
    comprasStatus(ok?"¡Lista copiada!":"No se pudo copiar.")
  })
}
function shareCompras(){
  let t;
  try{
    t=comprasText()
  }catch(err){
    comprasStatus(err.message);
    return
  }
  if(!t){
    comprasStatus("No hay ingredientes para compartir (¿tachaste todos?).");
    return
  }
  if(navigator.share){
    navigator.share({
      title:"Lista de compras",text:t
    }).then(function(){
      comprasStatus("¡Compartido!")
    }).catch(function(e){
      if(e&&e.name==="AbortError")return;doCopy(t).then(function(ok){
        comprasStatus(ok?"Compartir no está disponible; copiamos la lista.":"No se pudo compartir ni copiar.")
      })
    })
  }else{
    doCopy(t).then(function(ok){
      comprasStatus(ok?"Compartir no está disponible; copiamos la lista.":"No se pudo compartir ni copiar.")
    })
  }
}
