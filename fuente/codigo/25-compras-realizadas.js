// Mi Plato Fácil · Compras realizadas, presupuesto real e historial de precios.
// Parte 26 de 30: los archivos se unen en este orden (el número define el orden de arranque).
const PURCHASES_KEY="miPlatoFacil_purchases_v1";
function parseMoneyText(text,optional,label){
  const t=String(text==null?"":text).trim();
  if(!t&&optional)return null;
  let s=t.replace(/\s/g,"");
  if(/,/.test(s))s=s.replace(/\./g,"").replace(",",".");
  else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,"");
  if(!/^\d+(\.\d+)?$/.test(s))throw Error(label+": ingresá un número positivo.");
  const n=Number(s);
  if(!Number.isFinite(n)||n<=0||n>10000000000)throw Error(label+": el número está fuera de rango.");
  return n
}
function validPurchases(a){
  return Array.isArray(a)&&a.length<=1000&&a.every(p=>!!p&&typeof p==="object"&&typeof p.id==="string"&&p.id.length>0&&p.id.length<=80&&validTrainingDate(p.date)&&typeof p.store==="string"&&p.store.length<=60&&typeof p.currency==="string"&&/^[A-Z]{3}$/.test(p.currency)&&typeof p.total==="number"&&Number.isFinite(p.total)&&p.total>0&&p.total<=10000000000&&Array.isArray(p.items)&&p.items.length<=100&&p.items.every(x=>!!x&&typeof x==="object"&&typeof x.name==="string"&&x.name.trim().length>0&&x.name.length<=100&&(x.quantity===null||typeof x.quantity==="number"&&Number.isFinite(x.quantity)&&x.quantity>0&&x.quantity<=1000000)&&(x.unit===null||RECIPE_AMOUNT_UNITS.includes(x.unit))&&(x.price===null||typeof x.price==="number"&&Number.isFinite(x.price)&&x.price>0&&x.price<=10000000000)))
}
function loadPurchases(){
  try{
    const a=JSON.parse(localStorage.getItem(PURCHASES_KEY)||"[]");
    return validPurchases(a)?a:[]
  }catch(e){
    return []
  }
}
function budgetPeriodRange(period){
  const today=localTrainingDate(new Date());
  return period==="mes"?[today.slice(0,8)+"01",today]:[mondayOf(today),today]
}
function planFullCost(currency){
  let recipes,amounts;
  try{
    recipes=loadRecipeDetails();
    amounts=loadRecipeAmounts()
  }catch(e){
    return {
      total:0,missing:0,count:0
    }
  }
  const prices=Object.values(loadReferencePrices());
  let total=0,missing=0,count=0;
  for(const {
    item,portions
  } of planEntriesFlat()){
    if(!item||!item.recipeSourceId)continue;
    const r=recipes[item.recipeSourceId],a=r&&r.amountsTitle&&amounts[r.amountsTitle];
    if(!a)continue;
    count++;
    const f=portionFactor(portions,a);
    for(const row of a.rows){
      if(row.quantity===null){
        missing++;
        continue
      }
      const m=pricesFor(prices,row.name,row.unit).filter(p=>p.currency===currency);
      if(m.length!==1){
        missing++;
        continue
      }
      total+=row.quantity*f*m[0].price/m[0].amount
    }
  }
  return {
    total,missing,count
  }
}
function budgetRealLines(box,budget,estimated){
  const fmt=n=>n.toLocaleString("es-AR",{
    minimumFractionDigits:2,maximumFractionDigits:2
  }),period=budget.period==="mes"?"mes":"semana",[from,to]=budgetPeriodRange(period),list=loadPurchases().filter(p=>p.date>=from&&p.date<=to),same=list.filter(p=>p.currency===budget.currency),other=list.length-same.length,real=same.reduce((t,p)=>t+p.total,0);
  box.append(ce("p","shop-item","Gasto real "+(period==="mes"?"del mes":"de esta semana")+" (compras registradas): "+fmt(real)+" "+budget.currency),ce("p","screen__hint","Disponible según gasto real: "+fmt(budget.limit-real)+" "+budget.currency+(other?" · "+other+" compra"+(other===1?"":"s")+" en otra moneda sin sumar":"")));
  if(period==="semana")box.append(ce("p","screen__hint","Estimado de faltantes "+fmt(estimated)+" vs. gastado "+fmt(real)+": diferencia "+fmt(real-estimated)+" "+budget.currency+" (positivo = se gastó más que lo estimado)."));
  if(budget.people)box.append(ce("p","screen__hint","Por persona: "+fmt(budget.limit/budget.people)+" "+budget.currency+" por "+period+"."));
  const full=planFullCost(budget.currency);
  if(full.count)box.append(ce("p","screen__hint","Costo de todas las recetas del plan (sin descontar despensa): "+fmt(full.total)+" "+budget.currency+(full.missing?" · "+full.missing+" ingrediente"+(full.missing===1?"":"s")+" sin precio o sin cantidad":"")))
}
function recipeFullCost(r){
  const amounts=loadRecipeAmounts(),a=r&&r.amountsTitle&&amounts[r.amountsTitle];
  if(!a)return null;
  const prices=Object.values(loadReferencePrices()),totals={
  };
  let missing=0;
  for(const row of a.rows){
    if(row.quantity===null){
      missing++;
      continue
    }
    const m=pricesFor(prices,row.name,row.unit);
    if(m.length!==1){
      missing++;
      continue
    }
    totals[m[0].currency]=(totals[m[0].currency]||0)+row.quantity*m[0].price/m[0].amount
  }
  return {
    totals,missing,yield:a.yield
  }
}
function recipeCostText(c){
  if(!c)return "";
  const fmt=n=>n.toLocaleString("es-AR",{
    minimumFractionDigits:2,maximumFractionDigits:2
  }),parts=Object.entries(c.totals).map(([cur,t])=>fmt(t)+" "+cur+" ("+fmt(t/c.yield)+" por porción)");
  if(!parts.length)return "Costo: todavía no hay precios registrados para estos ingredientes.";
  return "Costo estimado con tus precios: "+parts.join(" · ")+(c.missing?" · "+c.missing+" ingrediente"+(c.missing===1?"":"s")+" sin precio o sin cantidad":"")
}
function renderPriceHistory(){
  const box=document.getElementById("priceHistory");
  if(!box)return;
  const groups=new Map();
  for(const p of Object.values(loadReferencePrices())){
    const k=ingredientKey(p.name)+"|"+p.currency+"|"+unitInfo(p.unit).dim;
    if(!groups.has(k))groups.set(k,[]);
    groups.get(k).push(p)
  }
  const lines=[];
  for(const list of groups.values()){
    if(list.length<2)continue;
    list.sort((a,b)=>a.date.localeCompare(b.date));
    const first=list[0],last=list[list.length-1],dim=unitInfo(last.unit).dim,ref=dim==="masa"?"kg":dim==="volumen"?"l":dim==="cuchara"?"cucharada":last.unit,per=p=>p.price/convertQuantity(p.amount,p.unit,ref),a=per(first),b=per(last);
    if(!Number.isFinite(a)||!Number.isFinite(b)||a<=0)continue;
    const pct=Math.round((b-a)/a*1000)/10,fmt=n=>n.toLocaleString("es-AR",{
      maximumFractionDigits:2
    });
    lines.push(last.name+": "+fmt(a)+" → "+fmt(b)+" "+last.currency+" por "+ref+" ("+(pct>0?"+":"")+String(pct).replace(".",",")+" %) entre "+typedAppDateLabel(first.date)+" y "+typedAppDateLabel(last.date)+" · "+list.length+" registros")
  }
  box.replaceChildren(...(lines.length?[ce("p","home-section-label","📈 Evolución de precios"),...lines.map(t=>ce("p","screen__hint",t))]:[]))
}
function appendPurchaseItem(item){
  const box=document.getElementById("purchaseItems"),row=ce("div","purchase-row"),name=ce("input"),qty=ce("input"),unit=ce("select"),price=ce("input"),rm=ce("button","button button--soft","×");
  name.type="text";
  name.maxLength=100;
  name.placeholder="Producto";
  name.value=item.name||"";
  name.dataset.purchaseName="";
  name.setAttribute("aria-label","Producto");
  qty.type="text";
  qty.inputMode="decimal";
  qty.placeholder="Cantidad";
  qty.value=item.quantity==null?"":String(item.quantity).replace(".",",");
  qty.dataset.purchaseQty="";
  qty.setAttribute("aria-label","Cantidad, opcional");
  const none=ce("option",null,"—");
  none.value="";
  unit.append(none);
  RECIPE_AMOUNT_UNITS.forEach(u=>{
    const o=ce("option",null,u);o.value=u;unit.append(o)
  });
  unit.value=item.unit||"";
  unit.dataset.purchaseUnit="";
  unit.setAttribute("aria-label","Unidad");
  price.type="text";
  price.inputMode="decimal";
  price.placeholder="Precio";
  price.value=item.price==null?"":String(item.price).replace(".",",");
  price.dataset.purchasePrice="";
  price.setAttribute("aria-label","Precio pagado, opcional");
  rm.type="button";
  rm.setAttribute("aria-label","Quitar producto");
  rm.addEventListener("click",()=>row.remove());
  row.append(name,qty,unit,price,rm);
  box.append(row)
}
function readPurchaseForm(){
  const date=parseTypedAppDate(document.getElementById("purchaseDate").value);
  if(!date)throw Error("Ingresá la fecha de la compra.");
  if(date>localTrainingDate(new Date()))throw Error("La fecha no puede ser futura.");
  const currency=document.getElementById("purchaseCurrency").value.trim().toUpperCase();
  if(!/^[A-Z]{3}$/.test(currency))throw Error("Usá una moneda de 3 letras, por ejemplo ARS.");
  const total=parseMoneyText(document.getElementById("purchaseTotal").value,false,"Total");
  const items=[];
  for(const row of document.querySelectorAll("#purchaseItems .purchase-row")){
    const name=row.querySelector("[data-purchase-name]").value.trim(),qText=row.querySelector("[data-purchase-qty]").value.trim(),unit=row.querySelector("[data-purchase-unit]").value||null,pText=row.querySelector("[data-purchase-price]").value.trim();
    if(!name&&!qText&&!pText)continue;
    if(!name)throw Error("Cada producto necesita un nombre.");
    const quantity=qText?recipeAmountNumber(qText,true):null;
    if(quantity!==null&&!unit)throw Error("Elegí la unidad de "+name+".");
    items.push({
      name:name.slice(0,100),quantity,unit:quantity===null?null:unit,price:parseMoneyText(pText,true,"Precio de "+name)
    })
  }
  return {
    date,store:document.getElementById("purchaseStore").value.trim().slice(0,60),currency,total,items
  }
}
function savePurchase(){
  const p=readPurchaseForm(),a=loadPurchases();
  if(a.length>=1000)throw Error("Máximo 1000 compras registradas. Quitá algunas antiguas.");
  a.push({
    id:Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8),...p
  });
  if(!validPurchases(a))throw Error("Revisá los datos de la compra.");
  let newPrices=null,count=0;
  if(document.getElementById("purchaseUpdatePrices").checked){
    newPrices=loadReferencePrices();
    for(const it of p.items){
      if(it.quantity===null||!it.unit||it.price===null)continue;
      const id=Date.now().toString(36)+"_"+Math.random().toString(36).slice(2);
      newPrices[id]={
        id,name:it.name,pack:(p.store?"Compra en "+p.store:"Compra registrada").slice(0,100),amount:it.quantity,price:it.price,unit:it.unit,currency:p.currency,date:p.date
      };
      count++
    }
    if(count&&!validReferencePrices(newPrices))throw Error("Algún producto no se puede guardar como precio de referencia (cantidad o precio fuera de rango). No se registró nada.")
  }
  try{
    localStorage.setItem(PURCHASES_KEY,JSON.stringify(a))
  }catch(e){
    throw Error("No se pudo registrar la compra (falta de espacio u otro error).")
  }
  let priceError=false;
  if(count){
    try{
      localStorage.setItem(REFERENCE_PRICES_KEY,JSON.stringify(newPrices))
    }catch(e){
      priceError=true;
      count=0
    }
  }
  let stockAdded=0,stockError=null;
  if(document.getElementById("purchaseAddStock").checked){
    const changes=p.items.filter(it=>it.quantity!==null&&it.unit).map(it=>({
      name:it.name,unit:it.unit,delta:it.quantity
    }));
    if(changes.length){
      try{
        stockAdded=applyStockChanges(changes,"Compra del "+typedAppDateLabel(p.date)).moves.length
      }catch(e){
        stockError=e.message
      }
    }
  }
  return {
    count,priceError,stockAdded,stockError
  }
}
function renderPurchases(){
  const box=document.getElementById("purchaseList");
  if(!box)return;
  const all=loadPurchases().slice().sort((a,b)=>b.date.localeCompare(a.date)),[from,to]=budgetPeriodRange("mes"),month=all.filter(p=>p.date>=from&&p.date<=to),byCur={
  };
  month.forEach(p=>{
    byCur[p.currency]=(byCur[p.currency]||0)+p.total
  });
  const fmt=n=>n.toLocaleString("es-AR",{
    minimumFractionDigits:2,maximumFractionDigits:2
  }),nodes=[ce("p","shop-item","Este mes: "+month.length+" compra"+(month.length===1?"":"s")+(Object.keys(byCur).length?" · "+Object.entries(byCur).map(([c,t])=>fmt(t)+" "+c).join(" · "):""))];
  for(const p of all.slice(0,30)){
    const row=ce("div","shop-item");
    row.append(ce("span",null,typedAppDateLabel(p.date)+(p.store?" · "+p.store:"")+" · "+fmt(p.total)+" "+p.currency+(p.items.length?" · "+p.items.length+" producto"+(p.items.length===1?"":"s"):"")));
    const b=ce("button","filter-chip filter-chip--danger","Quitar");
    b.type="button";
    b.dataset.purchaseRemove=p.id;
    b.setAttribute("aria-label","Quitar compra del "+typedAppDateLabel(p.date));
    row.append(b);
    nodes.push(row)
  }
  if(!all.length)nodes.push(ce("p","screen__hint","Todavía no registraste compras."));
  box.replaceChildren(...nodes)
}
document.getElementById("purchasesPanel").addEventListener("toggle",e=>{
  if(e.target.open){
    const d=document.getElementById("purchaseDate");if(!d.value)d.value=typedAppDateLabel(localTrainingDate(new Date()));renderPurchases()
  }
});
document.getElementById("purchaseDate").addEventListener("input",e=>{
  const d=e.target.value.replace(/\D/g,"").slice(0,8);e.target.value=d.slice(0,2)+(d.length>2?"/"+d.slice(2,4):"")+(d.length>4?"/"+d.slice(4):"")
});
document.getElementById("purchaseAddItem").addEventListener("click",()=>{
  if(document.querySelectorAll("#purchaseItems .purchase-row").length>=100)return;appendPurchaseItem({
  });document.querySelector("#purchaseItems .purchase-row:last-child [data-purchase-name]").focus()
});
document.getElementById("purchaseFromList").addEventListener("click",()=>{
  const st=document.getElementById("purchaseStatus");try{
    const box=document.getElementById("purchaseItems");if(box.children.length&&!window.confirm("¿Reemplazar los productos cargados por los pendientes de la lista?"))return;box.replaceChildren();let n=0;for(const e of shoppingPlanItems()){
      if(comprasDone[e.key])continue;const m=mergeUnits(e.units),one=m.size===1?[...m.entries()][0]:null;appendPurchaseItem({
        name:e.name,quantity:one&&!e.unknown?one[1]:null,unit:one&&!e.unknown?one[0]:null,price:null
      });n++
    }for(const x of loadManualShopping().filter(x=>!x.done)){
      appendPurchaseItem({
        name:x.name
      });n++
    }st.textContent=n?n+" productos cargados. Completá precios si querés guardarlos.":"No hay productos pendientes en la lista."
  }catch(err){
    st.textContent=err.message
  }
});
document.getElementById("purchaseSave").addEventListener("click",()=>{
  const st=document.getElementById("purchaseStatus");try{
    const r=savePurchase();document.getElementById("purchaseItems").replaceChildren();document.getElementById("purchaseTotal").value="";document.getElementById("purchaseStore").value="";st.textContent="Compra registrada."+(r.count?" Se guardaron "+r.count+" precios de referencia.":"")+(r.priceError?" No se pudieron guardar los precios.":"")+(r.stockAdded?" Se sumaron "+r.stockAdded+" productos a la despensa.":"")+(r.stockError?" "+r.stockError:"");renderStockQuantities();renderPurchases();if(document.getElementById("shoppingBudgetPanel").open)shoppingBudgetRender();if(document.getElementById("pricePanel").open)renderReferencePrices()
  }catch(err){
    st.textContent=err.message
  }
});
document.getElementById("purchaseList").addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b||!b.dataset.purchaseRemove)return;if(!window.confirm("¿Quitar esta compra registrada? Los precios de referencia que guardaste no se borran."))return;try{
    const a=loadPurchases().filter(p=>p.id!==b.dataset.purchaseRemove);if(a.length)localStorage.setItem(PURCHASES_KEY,JSON.stringify(a));else localStorage.removeItem(PURCHASES_KEY);renderPurchases();document.getElementById("purchaseStatus").textContent="Compra quitada."
  }catch(err){
    document.getElementById("purchaseStatus").textContent="No se pudo quitar la compra."
  }
});
