// Mi Plato Fácil · Existencias con cantidad y presupuesto de compras.
// Parte 12: los archivos se unen en orden según su número, que define el orden de arranque.
const STOCK_QUANT_KEY="miPlatoFacil_pantryQuantities_v1";
function stockKey(name,unit){
  return JSON.stringify([normalizeSearchText(name),unit])
}
function loadStockQuantities(){
  try{
    const o=JSON.parse(localStorage.getItem(STOCK_QUANT_KEY)||"{}");
    if(!o||Array.isArray(o)||typeof o!=="object")return {
    };
    const valid={
    };
    for(const [key,v] of Object.entries(o)){
      if(v&&typeof v.name==="string"&&typeof v.unit==="string"&&typeof v.quantity==="number"&&Number.isFinite(v.quantity)&&v.quantity>=0&&v.quantity<=100000000&&key===stockKey(v.name,v.unit))valid[key]=v
    }
    return valid
  }catch(e){
    return {
    }
  }
}
function renderStockQuantities(){
  const box=document.getElementById("stockList");
  box.replaceChildren();
  const values=Object.entries(loadStockQuantities()).sort((a,b)=>a[1].name.localeCompare(b[1].name,"es"));
  if(!values.length){
    box.append(ce("p","screen__hint","Todavía no registraste cantidades disponibles."));
    renderPantryMoves();
    return
  }
  for(const [key,item] of values){
    const row=ce("div","shop-item"),label=ce("span",null,item.name+": "+item.quantity.toLocaleString("es-AR",{
      maximumFractionDigits:6
    })+" "+item.unit),edit=ce("button","button button--soft","Editar"),remove=ce("button","button button--danger","Quitar");
    edit.type=remove.type="button";
    edit.addEventListener("click",()=>{
      document.getElementById("stockIngredient").value=item.name;document.getElementById("stockQuantity").value=item.quantity;document.getElementById("stockUnit").value=item.unit;document.getElementById("stockIngredient").focus()
    });
    remove.addEventListener("click",()=>{
      const stock=loadStockQuantities(),old=stock[key];delete stock[key];try{
        localStorage.setItem(STOCK_QUANT_KEY,JSON.stringify(stock));if(old&&old.quantity)logPantryMoves([{
          name:old.name,unit:old.unit,delta:-old.quantity,reason:"Quitada de la despensa"
        }]);renderStockQuantities();shoppingQuantityAndCost();renderCompras()
      }catch(e){
        document.getElementById("stockStatus").textContent="No se pudo actualizar la despensa."
      }
    });
    row.append(label,edit,remove);
    box.append(row)
  }
  renderPantryMoves()
}
function saveStockQuantity(){
  const status=document.getElementById("stockStatus"),name=document.getElementById("stockIngredient").value.trim(),raw=document.getElementById("stockQuantity").value,quantity=Number(raw),unit=document.getElementById("stockUnit").value;
  if(!name||!raw.trim()||!Number.isFinite(quantity)||quantity<0||quantity>100000000||!unit){
    status.textContent="Completá ingrediente, cantidad no negativa y unidad.";
    return
  }
  const stock=loadStockQuantities(),key=stockKey(name,unit);
  if(!stock[key]&&Object.keys(stock).length>=500){
    status.textContent="Máximo 500 existencias registradas.";
    return
  }
  const oldQty=stock[key]?stock[key].quantity:0;
  stock[key]={
    name,quantity,unit
  };
  try{
    localStorage.setItem(STOCK_QUANT_KEY,JSON.stringify(stock));
    if(quantity!==oldQty)logPantryMoves([{
      name,unit,delta:quantity-oldQty,reason:"Ajuste manual"
    }]);
    status.textContent="Existencia guardada. Las cantidades de recetas no se modificaron.";
    renderStockQuantities();
    shoppingQuantityAndCost();
    renderCompras()
  }catch(e){
    status.textContent="No se pudo guardar. Revisá el espacio disponible."
  }
}
function initStockQuantities(){
  const select=document.getElementById("stockUnit");
  const fill=units=>{
    const current=select.value;
    select.replaceChildren(...units.map(unit=>{
      const opt=ce("option",null,unit);opt.value=unit;return opt
    }));
    if(units.includes(current))select.value=current
  };
  fill(["g","kg","ml","l","unidad"]);
  setTimeout(()=>fill(RECIPE_AMOUNT_UNITS),0);
  document.getElementById("stockSave").addEventListener("click",saveStockQuantity);
  renderStockQuantities()
}
function startupGuard(label,fn){
  try{
    fn()
  }catch(err){
    if(typeof console!=="undefined"&&console.error)console.error("Mi Plato Fácil · "+label,err);
    let box=document.getElementById("startupIssues");
    if(!box){
      box=ce("p","notice");
      box.id="startupIssues";
      box.setAttribute("role","alert");
      box.style.margin="0 0 12px";
      const main=document.getElementById("appMain");
      main.insertBefore(box,main.firstChild)
    }
    const names=box.dataset.modules?box.dataset.modules.split("|"):[];
    if(!names.includes(label))names.push(label);
    box.dataset.modules=names.join("|");
    box.textContent="No se pudieron cargar algunos datos guardados ("+names.join(", ")+"). El resto de la app funciona y no se modificó ningún dato. Antes de seguir, descargá un respaldo desde Más → Respaldo y restauración."
  }
}
startupGuard("Existencias de despensa",initStockQuantities);
const SHOP_BUDGET_KEY="miPlatoFacil_shoppingBudget_v1";
function shoppingBudgetRead(){
  try{
    const o=JSON.parse(localStorage.getItem(SHOP_BUDGET_KEY)||"{}");
    return o&&["ARS","USD"].includes(o.currency)&&Number.isFinite(o.limit)&&o.limit>=0&&o.limit<=100000000000?o:null
  }catch(e){
    return null
  }
}
function shoppingBudgetRender(){
  const box=document.getElementById("shoppingBudgetResult");
  box.replaceChildren();
  const budget=shoppingBudgetRead();
  if(!budget){
    box.append(ce("p","screen__hint","Guardá un presupuesto para ver la comparación."));
    return
  }
  let rows;
  try{
    rows=shoppingMissingRows()
  }catch(err){
    box.append(ce("p","screen__hint",err.message));
    return
  }
  const prices=Object.values(loadReferencePrices()),currency=budget.currency;
  let estimated=0,covered=0,unpriced=0,otherCurrency=0;
  for(const row of rows){
    if(row.missing<=0&&!row.unknown)continue;
    if(row.unknown){
      unpriced++;
      continue
    }
    const matches=pricesFor(prices,row.name,row.unit).filter(p=>true);
    if(matches.length!==1){
      unpriced++;
      continue
    }
    const p=matches[0];
    if(p.currency!==currency){
      otherCurrency++;
      continue
    }
    const cost=row.missing*p.price/p.amount;
    if(!Number.isFinite(cost)||cost<0){
      unpriced++;
      continue
    }
    estimated+=cost;
    covered++
  }
  const fmt=n=>n.toLocaleString("es-AR",{
    minimumFractionDigits:2,maximumFractionDigits:2
  });
  box.append(ce("p","shop-item","Presupuesto: "+fmt(budget.limit)+" "+currency),ce("p","shop-item","Costo parcial estimado: "+fmt(estimated)+" "+currency));
  const difference=budget.limit-estimated;
  box.append(ce("p","shop-item",difference>=0?"Margen sobre costos calculados: "+fmt(difference)+" "+currency:"Los costos calculados superan el presupuesto en "+fmt(-difference)+" "+currency));
  box.append(ce("p","screen__hint",covered+" ingredientes valorizados; "+unpriced+" sin costo completo; "+otherCurrency+" con precio en otra moneda."));
  if(unpriced||otherCurrency)box.append(ce("p","screen__hint","Comparación parcial: no se puede confirmar que el presupuesto alcance para toda la compra."));
  else box.append(ce("p","screen__hint","Estimación basada en precios registrados, no en comprobantes ni precios actuales de tienda."));
  budgetRealLines(box,budget,estimated)
}
function budgetCompareData(rows,prices,currency){
  const entries=[],pending=[];
  for(const row of rows){
    if(row.missing<=0&&!row.unknown)continue;
    if(row.unknown){
      pending.push(row.name+": cantidad incompleta");
      continue
    }
    const compatible=pricesFor(prices,row.name,row.unit).filter(p=>true&&p.currency===currency&&Number.isFinite(p.price)&&p.price>=0&&Number.isFinite(p.amount)&&p.amount>0&&Number.isFinite(row.missing*p.price/p.amount));
    if(!compatible.length){
      pending.push(row.name+": sin referencia compatible en "+currency);
      continue
    }
    const all=pricesFor(prices,row.name,row.unit).filter(p=>true);
    entries.push({
      row,options:compatible,base:all.length===1?compatible[0]:null
    })
  }
  return {
    entries:entries.sort((a,b)=>b.row.missing*Math.max(...b.options.map(p=>p.price/p.amount))-a.row.missing*Math.max(...a.options.map(p=>p.price/p.amount))),pending
  }
}
let budgetScenarioText="";
function budgetCompareRender(){
  budgetScenarioText="";
  const box=document.getElementById("budgetCompareResult");
  box.replaceChildren();
  const budget=shoppingBudgetRead();
  if(!budget){
    box.append(ce("p","screen__hint","Guardá primero un presupuesto."));
    return
  }
  let missingRows;
  try{
    missingRows=shoppingMissingRows()
  }catch(err){
    box.append(ce("p","screen__hint",err.message));
    return
  }
  const model=budgetCompareData(missingRows,Object.values(loadReferencePrices()),budget.currency),fmt=n=>n.toLocaleString("es-AR",{
    minimumFractionDigits:2,maximumFractionDigits:2
  }),controls=[];
  for(const entry of model.entries){
    const wrap=ce("div","portion-field"),label=ce("label",null,entry.row.name+" · "+entry.row.missing.toLocaleString("es-AR")+" "+entry.row.unit),select=ce("select"),blank=ce("option",null,"Elegí una referencia para simular");
    blank.value="";
    select.append(blank);
    entry.options.forEach((p,i)=>{
      const option=ce("option",null,fmt(entry.row.missing*p.price/p.amount)+" "+budget.currency+" · "+p.price+" / "+p.amount+" "+p.unit+" · "+(p.date||"sin fecha"));option.value=String(i);select.append(option)
    });
    select.value=entry.base?String(entry.options.indexOf(entry.base)):"";
    label.htmlFor=select.id="budgetAlternative_"+controls.length;
    wrap.append(label,select);
    box.append(wrap);
    controls.push({
      entry,select,baseline:entry.base
    })
  }
  const result=ce("div");
  box.append(result);
  function recalc(){
    let total=0,unselected=0,baseTotal=0,comparableTotal=0,compared=0;
    for(const control of controls){
      const {
        entry,select
      }=control;
      if(select.value===""){
        unselected++;
        continue
      }
      const p=entry.options[Number(select.value)],cost=entry.row.missing*p.price/p.amount;
      total+=cost;
      if(!control.baseline)control.baseline=p;
      if(control.baseline){
        baseTotal+=entry.row.missing*control.baseline.price/control.baseline.amount;
        comparableTotal+=cost;
        compared++
      }
    }
    result.replaceChildren(ce("p","shop-item","Escenario parcial: "+fmt(total)+" "+budget.currency),ce("p","screen__hint","Diferencia presupuesto menos escenario: "+fmt(budget.limit-total)+" "+budget.currency));
    if(compared)result.append(ce("p","screen__hint","Ahorro sobre "+compared+" ingredientes frente a su primera referencia seleccionada: "+fmt(baseTotal-comparableTotal)+" "+budget.currency+" (negativo = mayor costo)."));
    result.append(ce("p","screen__hint",model.pending.length+" ingredientes sin referencia compatible; "+unselected+" sin selección. No incluye platos sin cantidades vinculadas ni productos extra. No confirma que alcance el presupuesto total."));
    budgetScenarioText=["Mi Plato Fácil · Escenario de presupuesto","Presupuesto: "+fmt(budget.limit)+" "+budget.currency,"Costo parcial seleccionado: "+fmt(total)+" "+budget.currency,"Diferencia parcial: "+fmt(budget.limit-total)+" "+budget.currency,...controls.filter(x=>x.select.value!=="").map(x=>{
      const p=x.entry.options[Number(x.select.value)];return x.entry.row.name+": "+x.entry.row.missing+" "+x.entry.row.unit+" · "+fmt(x.entry.row.missing*p.price/p.amount)+" "+budget.currency
    }),"Sin referencia: "+model.pending.length+"; sin selección: "+unselected,"Estimación incompleta. No modifica planificación ni precios."].join("\n");
    if(model.pending.length)result.append(ce("p","screen__hint",model.pending.join("; ")))
  }
  controls.forEach(x=>x.select.addEventListener("change",recalc));
  recalc()
}
document.getElementById("budgetCompareRefresh").addEventListener("click",budgetCompareRender);
document.getElementById("budgetCopyScenario").addEventListener("click",async()=>{
  const status=document.getElementById("budgetCopyStatus");if(!budgetScenarioText){
    status.textContent="Guardá un presupuesto y elegí referencias primero.";return
  }try{
    await navigator.clipboard.writeText(budgetScenarioText);status.textContent="Resumen copiado."
  }catch(e){
    status.textContent="No se pudo copiar automáticamente. Revisá los permisos del navegador."
  }
});
function shoppingBudgetInit(){
  const saved=shoppingBudgetRead();
  if(saved){
    document.getElementById("shoppingBudgetCurrency").value=saved.currency;
    document.getElementById("shoppingBudgetLimit").value=saved.limit;
    document.getElementById("shoppingBudgetPeriod").value=saved.period==="mes"?"mes":"semana";
    document.getElementById("shoppingBudgetPeople").value=saved.people?String(saved.people):""
  }
  document.getElementById("shoppingBudgetSave").addEventListener("click",()=>{
    const raw=document.getElementById("shoppingBudgetLimit").value,limit=Number(raw),currency=document.getElementById("shoppingBudgetCurrency").value,period=document.getElementById("shoppingBudgetPeriod").value==="mes"?"mes":"semana",peopleRaw=document.getElementById("shoppingBudgetPeople").value.trim();if(!raw.trim()||!Number.isFinite(limit)||limit<0||limit>100000000000||!["ARS","USD"].includes(currency)){
      document.getElementById("shoppingBudgetResult").textContent="Ingresá un presupuesto válido y una moneda.";return
    }if(peopleRaw&&(!/^\d{1,2}$/.test(peopleRaw)||Number(peopleRaw)<1||Number(peopleRaw)>50)){
      document.getElementById("shoppingBudgetResult").textContent="Personas: usá un número entre 1 y 50.";return
    }const budget={
      currency,limit,period
    };if(peopleRaw)budget.people=Number(peopleRaw);try{
      localStorage.setItem(SHOP_BUDGET_KEY,JSON.stringify(budget));shoppingBudgetRender();budgetCompareRender()
    }catch(e){
      document.getElementById("shoppingBudgetResult").textContent="No se pudo guardar el presupuesto."
    }
  });
  document.getElementById("shoppingBudgetPanel").addEventListener("toggle",e=>{
    if(e.currentTarget.open){
      shoppingBudgetRender();budgetCompareRender()
    }
  });
  setTimeout(shoppingBudgetRender,0)
}
startupGuard("Presupuesto de compras",shoppingBudgetInit);
