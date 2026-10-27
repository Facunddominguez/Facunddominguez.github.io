// Mi Plato Fácil · Cantidades por receta, compras por cantidad, existencias y costos.
// Parte 23: los archivos se unen en orden según su número, que define el orden de arranque.
const RECIPE_AMOUNTS_KEY="miPlatoFacil_recipeAmounts_v1";
const RECIPE_AMOUNT_UNITS=["g","kg","ml","l","unidad","cucharada","cucharadita","taza"];
function ownAmountsKey(id){
  return "receta:"+id
}
function amountsLabel(key,own){
  if(typeof key==="string"&&key.indexOf("receta:")===0){
    const r=own&&own[key.slice(7)];
    return r?"Mi receta: "+r.title:"Receta eliminada (cantidades guardadas)"
  }
  return key
}
function safeRecipeDetails(){
  try{
    return loadRecipeDetails()
  }catch(e){
    return {
    }
  }
}
function refreshAmountRecipeOptions(){
  const select=document.getElementById("amountRecipe"),previous=select.value,own=safeRecipeDetails(),mine=ce("optgroup"),ideas=ce("optgroup");
  mine.label="Mis recetas";
  ideas.label="Ideas del menú";
  Object.values(own).sort((a,b)=>a.title.localeCompare(b.title,"es")).forEach(r=>{
    const op=ce("option",null,r.title);op.value=r.amountsTitle||ownAmountsKey(r.id);op.dataset.recipeId=r.id;mine.append(op)
  });
  data.menuCatalog.forEach(x=>{
    const op=ce("option",null,x.text);op.value=x.text;ideas.append(op)
  });
  select.replaceChildren(...(mine.children.length?[mine]:[]),ideas);
  if(previous&&[...select.options].some(o=>o.value===previous))select.value=previous
}
function saveRecipeAmountForm(){
  const select=document.getElementById("amountRecipe"),option=select.selectedOptions[0],recipeId=option&&option.dataset.recipeId||null,key=select.value,recipe=readRecipeAmountForm(),all=loadRecipeAmounts(),previous=Object.prototype.hasOwnProperty.call(all,key)?all[key]:undefined;
  let details=null;
  if(recipeId){
    details=loadRecipeDetails();
    const r=details[recipeId];
    if(!r)throw Error("La receta ya no existe. Elegí otra.");
    if(r.amountsTitle!==key&&Object.values(details).some(x=>x.id!==recipeId&&x.amountsTitle===key))throw Error("Esas cantidades ya están vinculadas a otra receta.")
  }
  all[key]=recipe;
  try{
    localStorage.setItem(RECIPE_AMOUNTS_KEY,JSON.stringify(all))
  }catch(err){
    throw Error("No se pudieron guardar las cantidades (falta de espacio u otro error). No se modificó nada.")
  }
  let linked=false;
  if(details&&details[recipeId].amountsTitle!==key){
    details[recipeId]={
      ...details[recipeId],amountsTitle:key
    };
    try{
      saveRecipeDetailsStore(details);
      linked=true
    }catch(err){
      if(previous===undefined)delete all[key];
      else all[key]=previous;
      try{
        localStorage.setItem(RECIPE_AMOUNTS_KEY,JSON.stringify(all))
      }catch(ignore){
      }
      throw Error("No se pudo vincular la receta. No se guardaron cambios.")
    }
  }
  select.dataset.loadedTitle=key;
  document.getElementById("amountStatus").textContent=linked?"Cantidades guardadas y vinculadas a la receta. Si la receta está en el plan, Compras usa estas cantidades.":recipeId?"Cantidades de la receta guardadas. Si está en el plan, Compras usa estas cantidades.":"Cantidades guardadas.";
  if(linked){
    try{
      if(recipeDetailsEditing===recipeId)renderRecipeDetails();
      renderRecipeCatalog()
    }catch(e){
    }
  }
}
function recipeAmountNumber(text,optional){
  const t=String(text).trim();
  if(!t&&optional)return null;
  if(!/^\d+(?:[.,]\d+)?$/.test(t))throw new Error("Ingresá números positivos; usá coma o punto para decimales.");
  const n=Number(t.replace(",","."));
  if(!Number.isFinite(n)||n<=0||n>1000000)throw new Error("La cantidad debe ser mayor a cero y no superar 1.000.000.");
  return n
}
function validRecipeAmountsStore(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.entries(o).every(([k,v])=>!["__proto__","constructor","prototype"].includes(k)&&v&&Number.isFinite(v.yield)&&v.yield>0&&v.yield<=1000000&&Array.isArray(v.rows)&&v.rows.length<=200&&v.rows.every(x=>x&&typeof x.name==="string"&&x.name.trim().length>0&&x.name.length<=100&&(x.quantity===null||Number.isFinite(x.quantity)&&x.quantity>0&&x.quantity<=1000000)&&RECIPE_AMOUNT_UNITS.includes(x.unit)))
}
function loadRecipeAmounts(){
  try{
    const o=JSON.parse(localStorage.getItem(RECIPE_AMOUNTS_KEY)||"{}");
    return validRecipeAmountsStore(o)?o:{
    }
  }catch(e){
    return {
    }
  }
}
function scaleRecipeAmounts(recipe,target){
  if(!validRecipeAmountsStore({
    recipe
  })||!Number.isFinite(target)||target<=0||target>1000000)throw new Error("Revisá las porciones y cantidades.");
  return recipe.rows.map(x=>({
    ...x,quantity:x.quantity===null?null:x.quantity*target/recipe.yield
  }))
}
function updateAmountRowCount(){
  const el=document.getElementById("amountRowCount"),box=document.getElementById("amountRows");
  if(el&&box)el.textContent=box.children.length+" ingredientes en esta receta (máximo 200)."
}
function appendRecipeAmountRow(item,container){
  const host=container&&container.nodeType===1?container:document.getElementById("amountRows");
  const row=ce("div","amount-row"),name=ce("input"),qty=ce("input"),unit=ce("select"),remove=ce("button","button button--soft","×");
  name.type="text";
  name.maxLength=100;
  name.placeholder="Ingrediente";
  name.value=item.name||"";
  name.dataset.amountName="";
  name.setAttribute("aria-label","Ingrediente");
  qty.type="text";
  qty.inputMode="decimal";
  qty.placeholder="Sin cantidad";
  qty.value=item.quantity==null?"":String(item.quantity);
  qty.dataset.amountQuantity="";
  qty.setAttribute("aria-label","Cantidad, opcional");
  unit.dataset.amountUnit="";
  unit.setAttribute("aria-label","Unidad");
  RECIPE_AMOUNT_UNITS.forEach(u=>{
    const op=ce("option",null,u);op.value=u;unit.append(op)
  });
  unit.value=item.unit||"g";
  remove.type="button";
  remove.setAttribute("aria-label","Quitar ingrediente de esta receta");
  remove.addEventListener("click",()=>{
    row.remove();updateAmountRowCount()
  });
  const copy=ce("button","button button--soft","Duplicar"),up=ce("button","button button--soft","↑"),down=ce("button","button button--soft","↓");
  for(const b of [copy,up,down])b.type="button";
  copy.setAttribute("aria-label","Duplicar ingrediente");
  up.setAttribute("aria-label","Subir ingrediente");
  down.setAttribute("aria-label","Bajar ingrediente");
  copy.addEventListener("click",()=>{
    const box=row.parentNode;if(box.children.length>=200){
      document.getElementById(box.id==="amountRows"?"amountStatus":"recipeDetailsStatus").textContent="Máximo 200 ingredientes por receta.";return
    }let q=null;try{
      q=qty.value.trim()?recipeAmountNumber(qty.value,true):null
    }catch(e){
      q=null
    }appendRecipeAmountRow({
      name:name.value,quantity:q,unit:unit.value
    },box);box.insertBefore(box.lastElementChild,row.nextSibling);updateAmountRowCount()
  });
  up.addEventListener("click",()=>{
    if(row.previousElementSibling)row.parentNode.insertBefore(row,row.previousElementSibling)
  });
  down.addEventListener("click",()=>{
    if(row.nextElementSibling)row.parentNode.insertBefore(row.nextElementSibling,row)
  });
  row.append(name,qty,unit,up,down,copy,remove);
  host.append(row);
  updateAmountRowCount()
}
function readAmountRows(container,yieldId){
  const rows=Array.from(container.querySelectorAll(".amount-row")).map(row=>({
    name:row.querySelector("[data-amount-name]").value.trim(),quantity:recipeAmountNumber(row.querySelector("[data-amount-quantity]").value,true),unit:row.querySelector("[data-amount-unit]").value
  }));
  const recipe={
    yield:recipeAmountNumber(document.getElementById(yieldId).value,false),rows
  };
  if(!rows.length||!validRecipeAmountsStore({
    recipe
  }))throw new Error("Agregá al menos un ingrediente y completá sus nombres.");
  return recipe
}
function renderRecipeIngredientRows(key){
  const box=document.getElementById("recipeIngredientRows"),amounts=loadRecipeAmounts(),a=key&&Object.prototype.hasOwnProperty.call(amounts,key)?amounts[key]:null;
  box.replaceChildren();
  document.getElementById("recipeYield").value=a?String(a.yield):"1";
  (a?a.rows:[]).forEach(row=>appendRecipeAmountRow(row,box))
}
function renderRecipeReadExtras(r,all){
  const parts=[];
  if(r.minutes)parts.push("⏱ "+r.minutes+" min");
  if(r.tags&&r.tags.length)parts.push("Etiquetas: "+r.tags.join(", "));
  const parent=r.variantOf&&all[r.variantOf]?all[r.variantOf]:null,root=parent?parent.id:r.id;
  if(parent)parts.push("Variante de: "+parent.title);
  const others=Object.values(all).filter(x=>x.id!==r.id&&x.id!==(parent&&parent.id)&&(x.id===root||x.variantOf===root)).map(x=>x.title);
  if(others.length)parts.push("Otras versiones: "+others.join(", "));
  document.getElementById("recipeReadMeta").textContent=parts.join(" · ");
  const box=document.getElementById("recipeReadSubstitutions");
  box.replaceChildren();
  if(r.substitutions&&r.substitutions.length){
    box.append(ce("h4",null,"Reemplazos posibles"));
    const stock=Object.values(loadStockQuantities()),ul=ce("ul");
    for(const s of r.substitutions){
      const have=stock.filter(x=>sameIngredient(x.name,s.to));
      ul.append(ce("li",null,s.from+" → "+s.to+(have.length?" (en tu despensa: "+have.map(x=>Number(x.quantity.toFixed(6)).toLocaleString("es-AR")+" "+x.unit).join(" + ")+")":"")))
    }
    box.append(ul)
  }
}
function readRecipeAmountForm(){
  return readAmountRows(document.getElementById("amountRows"),"amountYield")
}
function renderRecipeAmountForm(){
  const title=document.getElementById("amountRecipe").value,saved=loadRecipeAmounts()[title];
  document.getElementById("amountRows").replaceChildren();
  document.getElementById("amountYield").value=saved?String(saved.yield):"1";
  const rows=saved?saved.rows:(PANTRY_REVIEW_COMPONENTS[title]||[]).map(x=>({
    name:x.label,quantity:null,unit:"g"
  }));
  rows.forEach(appendRecipeAmountRow);
  if(!rows.length)appendRecipeAmountRow({
  });
  document.getElementById("amountStatus").textContent=saved?"Cantidades guardadas cargadas.":"Sin cantidades guardadas. Revisá nombres y unidades antes de guardar.";
  document.getElementById("amountResult").replaceChildren()
}
refreshAmountRecipeOptions();
document.getElementById("amountRecipe").addEventListener("change",()=>{
  if(document.getElementById("amountRows").children.length&&!window.confirm("¿Cambiar de receta? Los cambios sin guardar se perderán.")){
    document.getElementById("amountRecipe").value=document.getElementById("amountRecipe").dataset.loadedTitle;return
  }renderRecipeAmountForm();document.getElementById("amountRecipe").dataset.loadedTitle=document.getElementById("amountRecipe").value
});
document.getElementById("recipeAmountsPanel").addEventListener("toggle",e=>{
  if(e.target.open){
    const sel=document.getElementById("amountRecipe");refreshAmountRecipeOptions();if(sel.dataset.loadedTitle!==undefined&&sel.value!==sel.dataset.loadedTitle){
      renderRecipeAmountForm();sel.dataset.loadedTitle=sel.value
    }
  }if(e.target.open&&!document.getElementById("amountRows").children.length){
    renderRecipeAmountForm();document.getElementById("amountRecipe").dataset.loadedTitle=document.getElementById("amountRecipe").value
  }
});
document.getElementById("amountAdd").addEventListener("click",()=>appendRecipeAmountRow({
}));
document.getElementById("amountSave").addEventListener("click",()=>{
  try{
    saveRecipeAmountForm()
  }catch(e){
    document.getElementById("amountStatus").textContent=e.message
  }
});
document.getElementById("amountCalculate").addEventListener("click",()=>{
  try{
    const recipe=readRecipeAmountForm(),target=recipeAmountNumber(document.getElementById("amountTarget").value,false),rows=scaleRecipeAmounts(recipe,target);document.getElementById("amountResult").replaceChildren(...rows.map(x=>ce("p","screen__hint",x.name+": "+(x.quantity===null?"Cantidad desconocida":x.quantity.toLocaleString("es-AR",{
      maximumFractionDigits:3
    })+" "+x.unit))));document.getElementById("amountStatus").textContent="Cálculo proporcional para "+target+" porciones; no convierte unidades. Puede requerir redondeo práctico. Calcula lo escrito, aunque aún no esté guardado."
  }catch(e){
    document.getElementById("amountResult").replaceChildren();document.getElementById("amountStatus").textContent=e.message
  }
});
function aggregateQuantifiedRecipes(selections,recipes){
  const map=new Map();
  for(const selection of selections){
    if(!Object.prototype.hasOwnProperty.call(recipes,selection.title))throw new Error("Una receta ya no está disponible. Cerrá y abrí este bloque.");
    const rows=scaleRecipeAmounts(recipes[selection.title],selection.portions);
    for(const row of rows){
      const key=JSON.stringify([ingredientKey(row.name),unitInfo(row.unit).dim]);
      if(!map.has(key))map.set(key,{
        name:row.name.trim(),unit:row.unit,quantity:0,unknown:0
      });
      const total=map.get(key);
      if(row.quantity===null)total.unknown++;
      else{
        total.quantity+=convertQuantity(row.quantity,row.unit,total.unit);
        if(!Number.isFinite(total.quantity))throw new Error("El total supera el rango permitido.")
      }
    }
  }
  return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name)||a.unit.localeCompare(b.unit))
}
function renderQuantifiedChoices(){
  const box=document.getElementById("quantShoppingChoices"),recipes=loadRecipeAmounts(),ownRecipes=safeRecipeDetails();
  box.replaceChildren(...Object.keys(recipes).map((title,i)=>{
    const row=ce("div","summary__line"),label=ce("label","shop-item"),check=ce("input");check.type="checkbox";check.dataset.quantRecipe=title;label.append(check,ce("span",null,amountsLabel(title,ownRecipes)));const qtyLabel=ce("label",null,"Porciones a preparar"),qty=ce("input");qty.type="text";qty.inputMode="decimal";qty.value=String(recipes[title].yield);qty.id="quantPortions_"+i;qty.dataset.quantPortions="";qtyLabel.htmlFor=qty.id;row.append(label,qtyLabel,qty);return row
  }));
  if(!Object.keys(recipes).length)box.append(ce("p","screen__hint","Primero cargá los ingredientes con cantidades de tus recetas (Más → Con lo que tengo → Editar receta)."));
  document.getElementById("quantShoppingResult").replaceChildren();
  document.getElementById("quantShoppingStatus").textContent=""
}
document.getElementById("quantShoppingPanel").addEventListener("toggle",e=>{
  if(e.target.open)renderQuantifiedChoices()
});
document.getElementById("quantShoppingCalculate").addEventListener("click",()=>{
  const result=document.getElementById("quantShoppingResult"),status=document.getElementById("quantShoppingStatus");result.replaceChildren();try{
    const selections=Array.from(document.querySelectorAll("[data-quant-recipe]")).filter(x=>x.checked).map(x=>({
      title:x.dataset.quantRecipe,portions:recipeAmountNumber(x.closest(".summary__line").querySelector("[data-quant-portions]").value,false)
    }));if(!selections.length)throw new Error("Seleccioná al menos una receta.");const totals=aggregateQuantifiedRecipes(selections,loadRecipeAmounts());result.replaceChildren(...totals.map(x=>ce("p","shop-item",x.name+": "+(x.quantity>0?x.quantity.toLocaleString("es-AR",{
      maximumSignificantDigits:12
    })+" "+x.unit:"")+(x.unknown?(x.quantity>0?" + ":"")+"cantidad desconocida en "+x.unknown+" componente(s)":""))));status.textContent="Calculado con las cantidades guardadas. Los totales con cantidades desconocidas son parciales. Revisá posibles redondeos; no incluye productos extra ni la lista del plan."
  }catch(e){
    status.textContent=e.message||"No se pudo calcular."
  }
});
document.getElementById("quantShoppingChoices").addEventListener("input",()=>{
  document.getElementById("quantShoppingResult").replaceChildren();document.getElementById("quantShoppingStatus").textContent="Selección modificada. Volvé a calcular."
});
document.getElementById("quantShoppingChoices").addEventListener("change",()=>{
  document.getElementById("quantShoppingResult").replaceChildren();document.getElementById("quantShoppingStatus").textContent="Selección modificada. Volvé a calcular."
});
let stockDeductionSnapshot=null;
function stockSelections(){
  return Array.from(document.querySelectorAll("[data-quant-recipe]")).filter(x=>x.checked).map(x=>({
    title:x.dataset.quantRecipe,portions:recipeAmountNumber(x.closest(".summary__line").querySelector("[data-quant-portions]").value,false)
  }))
}
function stockDeductionSignature(selections,recipes){
  return JSON.stringify(selections.map(x=>({
    title:x.title,portions:x.portions,recipe:recipes[x.title]
  })))
}
function parseAvailableStock(value){
  const t=String(value).trim();
  if(!t)return null;
  if(!/^\d+(?:[.,]\d+)?$/.test(t))throw new Error("Ingresá existencias de cero o más, con coma o punto decimal.");
  const n=Number(t.replace(",","."));
  if(!Number.isFinite(n)||n<0||n>1000000)throw new Error("Existencia fuera de rango: usá entre 0 y 1.000.000.");
  return n
}
function deductStockRows(totals,available){
  if(totals.length!==available.length)throw new Error("Reiniciá la revisión.");
  return totals.map((row,i)=>{
    const stock=available[i];if(stock!==null&&(!Number.isFinite(stock)||stock<0))throw new Error("Existencia inválida.");return {
      ...row,stock,remaining:stock===null?null:Math.max(0,row.quantity-stock)
    }
  })
}
function invalidateStockDeduction(){
  stockDeductionSnapshot=null;
  document.getElementById("stockRows").replaceChildren();
  document.getElementById("stockResult").replaceChildren();
  document.getElementById("stockCalculate").disabled=true;
  document.getElementById("stockDeductionStatus").textContent="La selección cambió. Prepará nuevamente la revisión de existencias."
}
document.getElementById("stockPrepare").addEventListener("click",()=>{
  try{
    const selections=stockSelections(),recipes=loadRecipeAmounts();if(!selections.length)throw new Error("Marcá al menos una receta y sus porciones en Calcular compras por recetas.");const totals=aggregateQuantifiedRecipes(selections,recipes);stockDeductionSnapshot={
      totals,signature:stockDeductionSignature(selections,recipes)
    };document.getElementById("stockRows").replaceChildren(...totals.map((row,i)=>{
      const block=ce("div","summary__line"),label=ce("label",null,row.name+" · "+row.unit),input=ce("input");input.id="stockAvailable_"+i;label.htmlFor=input.id;input.type="text";input.inputMode="decimal";input.placeholder="Sin confirmar";input.dataset.stockAvailable=String(i);block.append(ce("p","screen__hint","Necesario conocido: "+row.quantity.toLocaleString("es-AR",{
        maximumSignificantDigits:12
      })+" "+row.unit+(row.unknown?" + cantidades desconocidas":"")),label,input);return block
    }));document.getElementById("stockResult").replaceChildren();document.getElementById("stockCalculate").disabled=false;document.getElementById("stockDeductionStatus").textContent="Escribí 0 si no tenés existencias. Vacío significa sin confirmar."
  }catch(e){
    invalidateStockDeduction();document.getElementById("stockDeductionStatus").textContent=e.message
  }
});
document.getElementById("stockCalculate").addEventListener("click",()=>{
  const result=document.getElementById("stockResult");result.replaceChildren();try{
    if(!stockDeductionSnapshot)throw new Error("Prepará primero la revisión.");if(stockDeductionSnapshot.signature!==stockDeductionSignature(stockSelections(),loadRecipeAmounts())){
      invalidateStockDeduction();throw new Error("Las recetas o porciones cambiaron. Prepará nuevamente la revisión.")
    }const available=Array.from(document.querySelectorAll("[data-stock-available]")).map(x=>parseAvailableStock(x.value)),rows=deductStockRows(stockDeductionSnapshot.totals,available);result.replaceChildren(...rows.map(row=>{
      let text=row.name+": ";if(row.remaining===null)text+="existencias sin confirmar";else if(row.unknown)text+="faltante mínimo conocido: "+row.remaining.toLocaleString("es-AR",{
        maximumSignificantDigits:12
      })+" "+row.unit+"; total pendiente de cantidades desconocidas";else text+=row.remaining===0?"cubierto para la cantidad calculada":"falta "+row.remaining.toLocaleString("es-AR",{
        maximumSignificantDigits:12
      })+" "+row.unit;if(row.remaining===null&&row.unknown)text+="; también hay cantidades necesarias desconocidas";return ce("p","shop-item",text)
    }));document.getElementById("stockDeductionStatus").textContent="Simulación calculada. No se descontaron existencias guardadas ni se modificaron otras listas."
  }catch(e){
    document.getElementById("stockDeductionStatus").textContent=e.message
  }
});
document.getElementById("stockRows").addEventListener("input",()=>{
  document.getElementById("stockResult").replaceChildren();document.getElementById("stockDeductionStatus").textContent="Existencias modificadas. Volvé a calcular."
});
for(const type of ["input","change"])document.getElementById("quantShoppingChoices").addEventListener(type,invalidateStockDeduction);
document.getElementById("quantShoppingPanel").addEventListener("toggle",e=>{
  if(e.target.open)invalidateStockDeduction()
});
const REFERENCE_PRICES_KEY="miPlatoFacil_referencePrices_v1";
let referencePriceEditing=null;
function validReferencePrices(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.entries(o).every(([id,x])=>!["__proto__","constructor","prototype"].includes(id)&&x&&x.id===id&&typeof x.name==="string"&&x.name.trim().length>0&&x.name.length<=100&&typeof x.pack==="string"&&x.pack.length<=100&&Number.isFinite(x.amount)&&x.amount>0&&x.amount<=1000000&&Number.isFinite(x.price)&&x.price>0&&x.price<=1000000&&RECIPE_AMOUNT_UNITS.includes(x.unit)&&typeof x.currency==="string"&&/^[A-Z]{3}$/.test(x.currency)&&validTrainingDate(x.date))
}
function loadReferencePrices(){
  try{
    const o=JSON.parse(localStorage.getItem(REFERENCE_PRICES_KEY)||"{}");
    return validReferencePrices(o)?o:{
    }
  }catch(e){
    return {
    }
  }
}
function resetReferencePriceForm(){
  referencePriceEditing=null;
  document.getElementById("priceForm").reset();
  document.getElementById("priceDate").value=typedAppDateLabel(localTrainingDate(new Date()));
  document.getElementById("priceCurrency").value="ARS"
}
function renderReferencePrices(){
  document.getElementById("priceList").replaceChildren(...Object.values(loadReferencePrices()).sort((a,b)=>b.date.localeCompare(a.date)).map(item=>{
    const row=ce("div","summary__line");row.append(ce("strong",null,item.name+(item.pack?" · "+item.pack:"")),ce("p","screen__hint",item.price.toLocaleString("es-AR",{
      maximumSignificantDigits:12
    })+" "+item.currency+" / "+item.amount.toLocaleString("es-AR",{
      maximumSignificantDigits:12
    })+" "+item.unit+" · "+typedAppDateLabel(item.date)));const actions=ce("div","summary-actions");for(const [key,title] of [["referencePriceEdit","Editar"],["referencePriceDelete","Eliminar"]]){
      const b=ce("button","button "+(key==="referencePriceDelete"?"button--danger":"button--soft"),title);b.type="button";b.dataset[key]=item.id;actions.append(b)
    }row.append(actions);return row
  }));
  if(!Object.keys(loadReferencePrices()).length)document.getElementById("priceList").append(ce("p","screen__hint","Todavía no guardaste precios de referencia."));
  renderPriceHistory()
}
document.getElementById("priceUnit").replaceChildren(...RECIPE_AMOUNT_UNITS.map(u=>{
  const op=ce("option",null,u);op.value=u;return op
}));
resetReferencePriceForm();
document.getElementById("pricePanel").addEventListener("toggle",e=>{
  if(e.target.open)renderReferencePrices()
});
document.getElementById("priceCancel").addEventListener("click",resetReferencePriceForm);
document.getElementById("priceForm").addEventListener("submit",e=>{
  e.preventDefault();try{
    const id=referencePriceEditing||Date.now().toString(36)+"_"+Math.random().toString(36).slice(2),item={
      id,name:document.getElementById("priceName").value.trim(),pack:document.getElementById("pricePack").value.trim(),amount:recipeAmountNumber(document.getElementById("priceAmount").value,false),price:recipeAmountNumber(document.getElementById("priceValue").value,false),currency:document.getElementById("priceCurrency").value.trim().toUpperCase(),unit:document.getElementById("priceUnit").value,date:parseTypedAppDate(document.getElementById("priceDate").value)
    };if(!validReferencePrices({
      [id]:item
    })||item.date>localTrainingDate(new Date()))throw new Error("Revisá nombre, moneda de 3 letras y fecha no futura.");const all=loadReferencePrices();if(referencePriceEditing&&!all[id])throw new Error("La referencia ya no existe. Limpiá el formulario.");all[id]=item;localStorage.setItem(REFERENCE_PRICES_KEY,JSON.stringify(all));resetReferencePriceForm();renderReferencePrices();document.getElementById("priceStatus").textContent="Referencia guardada. No se modificaron recetas, compras ni planes."
  }catch(err){
    document.getElementById("priceStatus").textContent=err.message||"No se pudo guardar."
  }
});
document.getElementById("priceList").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;const all=loadReferencePrices();if(b.dataset.referencePriceEdit){
    const x=all[b.dataset.referencePriceEdit];if(!x)return;referencePriceEditing=x.id;for(const [id,value] of [["priceName",x.name],["pricePack",x.pack],["priceAmount",x.amount],["priceValue",x.price],["priceCurrency",x.currency],["priceDate",typedAppDateLabel(x.date)],["priceUnit",x.unit]])document.getElementById(id).value=value;document.getElementById("priceName").focus();document.getElementById("priceStatus").textContent="Editando referencia. Guardá los cambios o limpiá el formulario."
  }if(b.dataset.referencePriceDelete&&window.confirm("¿Eliminar solo esta referencia de precio?")){
    try{
      delete all[b.dataset.referencePriceDelete];localStorage.setItem(REFERENCE_PRICES_KEY,JSON.stringify(all));if(referencePriceEditing===b.dataset.referencePriceDelete)resetReferencePriceForm();renderReferencePrices()
    }catch(err){
      document.getElementById("priceStatus").textContent="No se pudo eliminar."
    }
  }
});
let recipeCostSnapshot=null;
function recipeCostSignature(title,portions,recipes,prices){
  return JSON.stringify([title,portions,recipes[title],prices])
}
function estimateRecipeCosts(rows,priceIds,prices,portions){
  if(rows.length!==priceIds.length||!Number.isFinite(portions)||portions<=0)throw new Error("Revisá las porciones y referencias.");
  const totals={
  },missing=[],details=[];
  rows.forEach((row,i)=>{
    const id=priceIds[i],p=Object.prototype.hasOwnProperty.call(prices,id)?prices[id]:null;if(row.quantity===null){
      missing.push(row.name+": cantidad desconocida");return
    }if(!p){
      missing.push(row.name+": sin precio elegido");return
    }if(!sameIngredient(p.name,row.name)||!sameDimension(p.unit,row.unit))throw new Error("Una referencia no coincide con el ingrediente y unidad.");const cost=row.quantity*p.price/convertQuantity(p.amount,p.unit,row.unit);if(!Number.isFinite(cost))throw new Error("El costo supera el rango permitido.");totals[p.currency]=(totals[p.currency]||0)+cost;if(!Number.isFinite(totals[p.currency]))throw new Error("El total supera el rango permitido.");details.push({
      name:row.name,cost,currency:p.currency,date:p.date,pack:p.pack
    })
  });
  return {
    totals,perPortion:Object.fromEntries(Object.entries(totals).map(([c,v])=>[c,v/portions])),missing,details,partial:missing.length>0
  }
}
function invalidateRecipeCost(){
  recipeCostSnapshot=null;
  document.getElementById("recipeCostPrices").replaceChildren();
  document.getElementById("recipeCostResult").replaceChildren();
  document.getElementById("recipeCostCalculate").disabled=true;
  document.getElementById("recipeCostStatus").textContent="Elegí nuevamente los precios si cambiaste receta o porciones."
}
function refreshRecipeCostChoices(){
  const select=document.getElementById("recipeCostTitle");
  const ownRecipes=safeRecipeDetails();
  select.replaceChildren(...Object.keys(loadRecipeAmounts()).map(title=>{
    const op=ce("option",null,amountsLabel(title,ownRecipes));op.value=title;return op
  }));
  invalidateRecipeCost();
  if(!select.options.length)document.getElementById("recipeCostStatus").textContent="Primero cargá los ingredientes con cantidades de tus recetas (Más → Con lo que tengo → Editar receta)."
}
document.getElementById("recipeCostPanel").addEventListener("toggle",e=>{
  if(e.target.open)refreshRecipeCostChoices()
});
document.getElementById("recipeCostTitle").addEventListener("change",invalidateRecipeCost);
document.getElementById("recipeCostPortions").addEventListener("input",invalidateRecipeCost);
document.getElementById("recipeCostPrepare").addEventListener("click",()=>{
  try{
    const title=document.getElementById("recipeCostTitle").value,recipes=loadRecipeAmounts(),prices=loadReferencePrices(),portions=recipeAmountNumber(document.getElementById("recipeCostPortions").value,false);if(!Object.prototype.hasOwnProperty.call(recipes,title))throw new Error("Elegí una receta con cantidades guardadas.");const rows=scaleRecipeAmounts(recipes[title],portions);recipeCostSnapshot={
      rows,portions,signature:recipeCostSignature(title,portions,recipes,prices)
    };document.getElementById("recipeCostPrices").replaceChildren(...rows.map((row,i)=>{
      const box=ce("div","summary__line"),label=ce("label",null,row.name+" · "+(row.quantity===null?"cantidad desconocida":row.quantity.toLocaleString("es-AR",{
        maximumSignificantDigits:12
      })+" "+row.unit)),select=ce("select");select.id="recipePrice_"+i;label.htmlFor=select.id;select.dataset.recipeCostPrice="";const empty=ce("option",null,"Sin precio elegido");empty.value="";select.append(empty);pricesFor(Object.values(prices),row.name,row.unit).filter(p=>true).forEach(p=>{
        const op=ce("option",null,p.price+" "+p.currency+" / "+p.amount+" "+p.unit+" · "+typedAppDateLabel(p.date)+(p.pack?" · "+p.pack:""));op.value=p.id;select.append(op)
      });select.disabled=row.quantity===null;box.append(label,select);return box
    }));document.getElementById("recipeCostCalculate").disabled=false;document.getElementById("recipeCostResult").replaceChildren();document.getElementById("recipeCostStatus").textContent="Seleccioná las referencias. Las fechas permiten revisar si los precios siguen vigentes."
  }catch(e){
    invalidateRecipeCost();document.getElementById("recipeCostStatus").textContent=e.message
  }
});
document.getElementById("recipeCostPrices").addEventListener("change",()=>{
  document.getElementById("recipeCostResult").replaceChildren();document.getElementById("recipeCostStatus").textContent="Referencias modificadas. Volvé a calcular."
});
document.getElementById("recipeCostCalculate").addEventListener("click",()=>{
  const box=document.getElementById("recipeCostResult");box.replaceChildren();try{
    if(!recipeCostSnapshot)throw new Error("Elegí primero los precios.");const title=document.getElementById("recipeCostTitle").value,portions=recipeAmountNumber(document.getElementById("recipeCostPortions").value,false),prices=loadReferencePrices();if(recipeCostSnapshot.signature!==recipeCostSignature(title,portions,loadRecipeAmounts(),prices)){
      invalidateRecipeCost();throw new Error("Las cantidades o precios cambiaron. Elegí nuevamente las referencias.")
    }const ids=Array.from(document.querySelectorAll("[data-recipe-cost-price]")).map(x=>x.value),result=estimateRecipeCosts(recipeCostSnapshot.rows,ids,prices,portions);result.details.forEach(x=>box.append(ce("p","screen__hint",x.name+": "+x.cost.toLocaleString("es-AR",{
      minimumFractionDigits:2,maximumFractionDigits:2
    })+" "+x.currency+" · precio del "+typedAppDateLabel(x.date))));for(const [currency,total] of Object.entries(result.totals))box.append(ce("p","shop-item",(result.partial?"Subtotal parcial":"Total estimado")+": "+total.toLocaleString("es-AR",{
      minimumFractionDigits:2,maximumFractionDigits:2
    })+" "+currency+" · por porción: "+result.perPortion[currency].toLocaleString("es-AR",{
      minimumFractionDigits:2,maximumFractionDigits:2
    })+" "+currency));if(result.missing.length)box.append(ce("p","screen__hint","No incluido: "+result.missing.join("; ")));document.getElementById("recipeCostStatus").textContent="Estimación de ingredientes cargados, no costo completo del plato. Monedas separadas; no se convierten unidades ni se modifican datos."
  }catch(e){
    document.getElementById("recipeCostStatus").textContent=e.message
  }
});
