// Mi Plato Fácil · Existencias con cantidad y presupuesto de compras.
// Parte 12: los archivos se unen en orden según su número, que define el orden de arranque.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Existencias.nombre().
var Existencias={
stockKey(name,unit){
  return JSON.stringify([normalizeSearchText(name),unit])
},
startupGuard(label,fn){
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
},
estimadoDeLaLista(rows,currency){
  const prices=Object.values(loadReferencePrices());
  let estimated=0,covered=0,unpriced=0,otherCurrency=0;
  for(const row of rows){
    if(row.missing<=0&&!row.unknown)continue;
    if(row.unknown){
      unpriced++;
      continue
    }
    const matches=Ingredientes.pricesFor(prices,row.name,row.unit).filter(p=>true);
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
  return {
    estimated,covered,unpriced,otherCurrency
  }
},
budgetCompareData(rows,prices,currency){
  const entries=[],pending=[];
  for(const row of rows){
    if(row.missing<=0&&!row.unknown)continue;
    if(row.unknown){
      pending.push(row.name+": cantidad incompleta");
      continue
    }
    const compatible=Ingredientes.pricesFor(prices,row.name,row.unit).filter(p=>true&&p.currency===currency&&Number.isFinite(p.price)&&p.price>=0&&Number.isFinite(p.amount)&&p.amount>0&&Number.isFinite(row.missing*p.price/p.amount));
    if(!compatible.length){
      pending.push(row.name+": sin referencia compatible en "+currency);
      continue
    }
    const all=Ingredientes.pricesFor(prices,row.name,row.unit).filter(p=>true);
    entries.push({
      row,options:compatible,base:all.length===1?compatible[0]:null
    })
  }
  return {
    entries:entries.sort((a,b)=>b.row.missing*Math.max(...b.options.map(p=>p.price/p.amount))-a.row.missing*Math.max(...a.options.map(p=>p.price/p.amount))),pending
  }
}
};
const STOCK_QUANT_KEY="miPlatoFacil_pantryQuantities_v1";
function loadStockQuantities(){
  try{
    const o=JSON.parse(localStorage.getItem(STOCK_QUANT_KEY)||"{}");
    if(!o||Array.isArray(o)||typeof o!=="object")return {
    };
    const valid={
    };
    for(const [key,v] of Object.entries(o)){
      if(v&&typeof v.name==="string"&&typeof v.unit==="string"&&typeof v.quantity==="number"&&Number.isFinite(v.quantity)&&v.quantity>=0&&v.quantity<=100000000&&key===Existencias.stockKey(v.name,v.unit))valid[key]=v
    }
    return valid
  }catch(e){
    return {
    }
  }
}
// v19.8 (R5-K-12): el formulario "Existencias" de Compras se fue; cargar existencias con cantidad se hace en Despensa (33-despensa-unica.js).
const SHOP_BUDGET_KEY="miPlatoFacil_shoppingBudget_v1";
function shoppingBudgetRead(){
  try{
    const o=JSON.parse(localStorage.getItem(SHOP_BUDGET_KEY)||"{}");
    return o&&["ARS","USD"].includes(o.currency)&&Number.isFinite(o.limit)&&o.limit>=0&&o.limit<=100000000000?o:null
  }catch(e){
    return null
  }
}
// El costo estimado de lo que falta comprar (desde la v15.4 también lo usa la barra de presupuesto de la lista).
// Barra de presupuesto arriba de la lista (v15.4). Solo lee; tocarla abre el panel de presupuesto.
function renderPresupuestoCompras(){
  const bar=document.getElementById("comprasPresupuesto"),pref=document.getElementById("prefPresupuesto");
  if(!bar)return;
  const on=preciosActivos();
  bar.hidden=!on;
  if(pref)pref.hidden=!on;
  const budget=shoppingBudgetRead(),fmt=n=>(budget&&budget.currency==="USD"?"US$":"$")+Math.round(n).toLocaleString("es-AR");
  // Fila de Preferencias: el presupuesto guardado, sin cálculos (abre el mismo panel).
  if(pref)pref.textContent=budget?"💰 Presupuesto: "+fmt(budget.limit)+" por "+(budget.period==="mes"?"mes":"semana")+" · Cambiar":"💰 Poner un presupuesto";
  if(!on)return;
  if(!budget){
    bar.textContent="💰 Poner un presupuesto";
    return
  }
  let e;
  try{
    const auto=budget.currency==="ARS"?totalAutomaticoLista():null;
    e=auto?{
      estimated:auto.total,unpriced:auto.faltan,otherCurrency:0,alMenos:auto.sinEstimar!==undefined?auto.sinEstimar>0:auto.faltan*2>auto.pendientes
    }:Existencias.estimadoDeLaLista(shoppingMissingRows(),budget.currency)
  }catch(err){
    bar.textContent="💰 Presupuesto "+fmt(budget.limit);
    return
  }
  const faltan=e.unpriced+e.otherCurrency;
  bar.textContent="💰 Presupuesto "+fmt(budget.limit)+" · "+(e.alMenos||(e.covered!==undefined&&faltan>e.covered)?"al menos ":"")+"≈ "+fmt(e.estimated)+" estimado"+(faltan?" (faltan "+faltan+" precio"+(faltan===1?"":"s")+")":"");
  bar.classList.toggle("is-excedido",e.estimated>budget.limit)
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
  const currency=budget.currency,{estimated,covered,unpriced,otherCurrency}=Existencias.estimadoDeLaLista(rows,currency);
  const fmt=n=>n.toLocaleString("es-AR",{
    minimumFractionDigits:2,maximumFractionDigits:2
  });
  box.append(ce("p","shop-item","Presupuesto: "+fmt(budget.limit)+" "+currency),ce("p","shop-item","Costo parcial estimado: "+fmt(estimated)+" "+currency));
  const difference=budget.limit-estimated;
  box.append(ce("p","shop-item",difference>=0?"Margen: "+fmt(difference)+" "+currency:"Te pasás por "+fmt(-difference)+" "+currency));
  box.append(ce("p","screen__hint",covered+" ingredientes valorizados; "+unpriced+" sin costo completo; "+otherCurrency+" con precio en otra moneda."));
  if(unpriced||otherCurrency)box.append(ce("p","screen__hint","Comparación parcial: faltan precios."));
  else box.append(ce("p","screen__hint","Con tus precios guardados."));
  budgetRealLines(box,budget,estimated)
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
  const model=Existencias.budgetCompareData(missingRows,Object.values(loadReferencePrices()),budget.currency),fmt=n=>n.toLocaleString("es-AR",{
    minimumFractionDigits:2,maximumFractionDigits:2
  }),controls=[];
  // v19.9 (R5-X-03): además de tus precios guardados, el promedio de tu región es otra opción (en pesos).
  if(budget.currency==="ARS"&&typeof opcionPrecioAutomatico==="function")for(const entry of model.entries){
    const auto=opcionPrecioAutomatico(entry.row.name,entry.row.unit);
    if(auto)entry.options.push(auto)
  }
  for(const entry of model.entries){
    const wrap=ce("div","portion-field"),label=ce("label",null,entry.row.name+" · "+entry.row.missing.toLocaleString("es-AR")+" "+entry.row.unit),select=ce("select"),blank=ce("option",null,"Elegí una referencia");
    blank.value="";
    select.append(blank);
    entry.options.forEach((p,i)=>{
      const total=fmt(entry.row.missing*p.price/p.amount),option=ce("option",null,p.auto?"Promedio de tu región: "+fmt(p.price)+"/"+p.unit+" · "+total:p.price+"/"+p.amount+" "+p.unit+" · "+total);option.title=total+" "+budget.currency+" · "+(p.auto?fmt(p.price)+" por "+p.unit+" · promedio de tu región":p.price+" por "+p.amount+" "+p.unit+" · precio de "+(p.date||"fecha desconocida"));option.value=String(i);select.append(option)
    });
    select.value=entry.base?String(entry.options.indexOf(entry.base)):"";
    label.htmlFor=select.id="budgetAlternative_"+controls.length;
    const usado=ce("p","screen__hint presupuesto-usado");
    wrap.append(label,select,usado);
    const rango=typeof textoRangoPrecios==="function"?textoRangoPrecios(entry.row.name,entry.row.unit):"";
    if(rango)wrap.append(ce("p","screen__hint",rango));
    box.append(wrap);
    controls.push({
      entry,select,usado,baseline:entry.base
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
      // R5-X-03: se ve qué precio se está usando para ese ingrediente.
      control.usado.textContent=select.value===""?"Precio usado: ninguno elegido.":"Precio usado: "+select.selectedOptions[0].textContent+".";
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
    result.replaceChildren(ce("p","shop-item","Escenario parcial: "+fmt(total)+" "+budget.currency),ce("p","screen__hint","Margen: "+fmt(budget.limit-total)+" "+budget.currency));
    if(compared)result.append(ce("p","screen__hint","Ahorro en "+compared+" ingredientes: "+fmt(baseTotal-comparableTotal)+" "+budget.currency+"."));
    result.append(ce("p","screen__hint",model.pending.length+" sin precio; "+unselected+" sin elegir."));
    budgetScenarioText=["Mi Plato Fácil · Escenario de presupuesto","Presupuesto: "+fmt(budget.limit)+" "+budget.currency,"Costo parcial seleccionado: "+fmt(total)+" "+budget.currency,"Diferencia parcial: "+fmt(budget.limit-total)+" "+budget.currency,...controls.filter(x=>x.select.value!=="").map(x=>{
      const p=x.entry.options[Number(x.select.value)];return x.entry.row.name+": "+x.entry.row.missing+" "+x.entry.row.unit+" · "+fmt(x.entry.row.missing*p.price/p.amount)+" "+budget.currency
    }),"Sin referencia: "+model.pending.length+"; sin selección: "+unselected,"Estimación incompleta. No modifica planificación ni precios."].join("\n");
    if(model.pending.length)result.append(ce("p","screen__hint","Sin precio: "+model.pending.map(x=>x.slice(0,x.lastIndexOf(": "))).join(", ")))
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
      localStorage.setItem(SHOP_BUDGET_KEY,JSON.stringify(budget));shoppingBudgetRender();budgetCompareRender();renderPresupuestoCompras()
    }catch(e){
      document.getElementById("shoppingBudgetResult").textContent="No se pudo guardar el presupuesto."
    }
  });
  setTimeout(shoppingBudgetRender,0)
}
Existencias.startupGuard("Presupuesto de compras",shoppingBudgetInit);
