// Mi Plato Fácil · Lista de compras derivada del plan y sugerencias.
// Parte 13: los archivos se unen en orden según su número, que define el orden de arranque.
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
let comprasShowAll=false,comprasTenesOpen=false,comprasCompradosOpen=false;
// Tachados y comprados por semana (desde la v15), en miPlatoFacil_shoppingChecks_v1:
// {"2026-10-26": {"t": [tachados], "c": [comprados con "Lo compré"]}}. La semana empieza el lunes (mondayOf).
// Se escribe solo cuando el usuario actúa (nunca al mostrar) y al escribir se conservan las últimas 12 semanas.
const SHOPPING_CHECKS_KEY="miPlatoFacil_shoppingChecks_v1";
function validShoppingChecksWeek(v){
  const lista=a=>Array.isArray(a)&&a.length<=1000&&a.every(x=>typeof x==="string"&&x.length>0&&x.length<=200);
  return !!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).every(k=>k==="t"||k==="c")&&lista(v.t)&&lista(v.c)
}
function validShoppingChecks(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=520&&Object.entries(o).every(([k,v])=>validTrainingDate(k)&&validShoppingChecksWeek(v))
}
// Lectura tolerante: lo que no tiene el formato esperado se ignora (semana por semana).
function loadShoppingChecks(){
  try{
    const o=JSON.parse(localStorage.getItem(SHOPPING_CHECKS_KEY)||"{}");
    if(!o||typeof o!=="object"||Array.isArray(o))return {};
    return Object.fromEntries(Object.entries(o).filter(([k,v])=>!["__proto__","constructor","prototype"].includes(k)&&validTrainingDate(k)&&validShoppingChecksWeek(v)))
  }catch(e){
    return {}
  }
}
function shoppingChecksWeek(){
  return mondayOf(localTrainingDate(new Date()))
}
let comprasWeek=null;
// Trae los tachados de la semana actual (al abrir la app o si empezó otra semana: cada lunes arranca sin tachados).
function syncShoppingWeek(){
  const wk=shoppingChecksWeek();
  if(wk===comprasWeek)return;
  comprasWeek=wk;
  const w=loadShoppingChecks()[wk];
  comprasDone=Object.fromEntries((w?w.t:[]).map(k=>[k,true]))
}
// Lo que pasó a la despensa con "Lo compré" esta semana.
function shoppingBoughtSet(){
  const w=loadShoppingChecks()[shoppingChecksWeek()];
  return new Set(w?w.c:[])
}
function saveShoppingChecks(bought){
  syncShoppingWeek();
  const all=loadShoppingChecks(),cur=all[comprasWeek],t=Object.keys(comprasDone).filter(k=>comprasDone[k]).sort(),c=[...(bought||new Set(cur?cur.c:[]))].sort();
  if(t.length||c.length)all[comprasWeek]={
    t,c
  };
  else delete all[comprasWeek];
  const keep=Object.keys(all).sort().reverse().slice(0,12),out=Object.fromEntries(keep.sort().map(k=>[k,all[k]]));
  if(!validShoppingChecks(out))throw Error("No se pudieron guardar los tachados.");
  if(Object.keys(out).length)localStorage.setItem(SHOPPING_CHECKS_KEY,JSON.stringify(out));
  else localStorage.removeItem(SHOPPING_CHECKS_KEY)
}
syncShoppingWeek();
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
    kind:"info",text:"Lo marcaste en tu Despensa (sin cantidad registrada)."
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
    kind:"partial",text:"Despensa: tenés "+have+". Podrías comprar "+buy+(e.unknown?", más lo que no tiene cantidad.":"."),buy,missing
  }
}
// Interruptor "Descontar lo que tengo" (desde la v15.4), en miPlatoFacil_comprasOpciones_v1: {"descontar": true|false}.
// Encendido por defecto (el comportamiento de antes). Se escribe solo al tocarlo. Es var por el orden de arranque.
var COMPRAS_OPCIONES_KEY="miPlatoFacil_comprasOpciones_v1";
function validComprasOpciones(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===1&&typeof o.descontar==="boolean"
}
function comprasDescontar(){
  try{
    const o=JSON.parse(localStorage.getItem(COMPRAS_OPCIONES_KEY)||"null");
    return validComprasOpciones(o)?o.descontar:true
  }catch(e){
    return true
  }
}
function guardarComprasDescontar(valor){
  localStorage.setItem(COMPRAS_OPCIONES_KEY,JSON.stringify({
    descontar:!!valor
  }))
}
// Secciones del súper (desde la v15.4). Primero las listas del armado; después, palabras sueltas.
var SECCIONES_SUPER=["Verdulería","Carnicería y pescadería","Lácteos y huevos","Panadería","Almacén","Congelados","Limpieza","Otros"];
var PALABRAS_SUPER=null;
function seccionDelSuper(nombre){
  const n=" "+normalizeSearchText(nombre).replace(/[^a-z0-9ñ ]+/g," ")+" ",k=ingredientKey(nombre);
  if(!PALABRAS_SUPER){
    PALABRAS_SUPER=[
      ["Almacén","pan rallado|harina|fecula|maicena|frutos secos|semillas|atun|caballa en lata|arroz|fideo|fideos|pasta|pastas|avena|polenta|quinoa|cuscus|aceite|sal|azucar|cafe|te|yerba|vinagre|granola|mani|lenteja|lentejas|garbanzo|garbanzos|poroto|porotos|arveja|arvejas|soja|comino|oregano|pimienta|pimenton|especias|caldo|tomate triturado|pure de tomate|galletitas|cacao|miel|mermelada|amaranto|mijo|sorgo|cebada|centeno|tapioca|trigo|lupino|habas".split("|")],
      ["Congelados",["congelado","congelada","congelados","congeladas","helado"]],
      ["Limpieza",["detergente","lavandina","jabon","servilleta","servilletas","papel","esponja","limpiador","desinfectante","bolsas","rollo"]],
      ["Lácteos y huevos",["leche","yogur","queso","quesos","manteca","crema","huevo","huevos","ricota","clara"]],
      ["Carnicería y pescadería",["carne","pollo","cerdo","vacuna","asado","vacio","bondiola","pechito","merluza","pescado","salmon","milanesa","milanesas","hamburguesa","pavo","cordero","nalga","cuadril","lomo","picada","jamon","caballa","trucha","mariscos"]],
      ["Panadería",["pan","pancitos","tortillas","facturas","tostadas"]]
    ];
  }
  if(n.includes(" pan rallado "))return "Almacén";
  const enLista=arr=>arr.some(x=>ingredientKey(Array.isArray(x)?x[0]:x)===k);
  if(enLista(data.verduras)||enLista(data.frutas)||/ (fruta|frutas|papa|papas|batata|mandioca|choclo|palta|limon|perejil|albahaca|verdura|verduras) /.test(n))return "Verdulería";
  for(const [sec,palabras] of PALABRAS_SUPER){
    if(palabras.some(p=>n.includes(" "+p+" ")))return sec
  }
  return "Otros"
}
// Cada ítem del plan va a un grupo: "pendiente", "tenes" (ya está en la despensa y alcanza, o no hay cantidad para
// comparar) o "comprado" (pasó con "Lo compré" esta semana). Si hay cantidad y no alcanza, sigue pendiente con
// "faltan X". Los tres grupos juntos son siempre la misma lista, con las cantidades del plan.
// Desde la v15.4: si la despensa tiene otra unidad ("la unidad no coincide"), queda pendiente con "revisá"; con el
// interruptor "Descontar lo que tengo" apagado, nada va a "Ya tenés" y no se muestra "faltan".
function shoppingDisplayItems(){
  const stock=loadStockQuantities(),marked=pantryMarkedMatcher(),bought=shoppingBoughtSet(),descontar=comprasDescontar();
  return shoppingPlanItems().map(e=>{
    const label=shoppingItemLabel(e),suggestion=shoppingSuggestion(e,stock,marked),partial=!!suggestion&&suggestion.kind==="partial",revisar=!!suggestion&&suggestion.kind==="info"&&/la unidad no coincide/.test(suggestion.text),group=bought.has(e.key)?"comprado":descontar&&suggestion&&!partial&&!revisar?"tenes":"pendiente";return {
      key:e.key,name:e.name,label,suggestion,group,seccion:seccionDelSuper(e.name),text:descontar&&group==="pendiente"&&partial?label+" · faltan "+suggestion.buy:descontar&&group==="pendiente"&&revisar?label+" · revisá":label
    }
  }).sort((a,b)=>a.label.localeCompare(b.label,"es"))
}
function shoppingRow(x,i,checked,detail){
  const row=ce("div","shop-item"+(checked?" is-done":"")),cb=ce("input"),lab=ce("label",null,textoLegible(x.text));
  cb.type="checkbox";
  cb.checked=checked;
  cb.dataset.shopKey=x.key;
  cb.id="shopItem_"+i;
  lab.htmlFor=cb.id;
  row.append(cb,lab);
  if(detail)row.append(ce("span","shop-item__detail",textoLegible(detail)));
  return row
}
function shoppingGroup(title,list,open,onToggle){
  const box=ce("details","home-group shop-group");
  box.open=open;
  box.dataset.grupo=title;
  box.addEventListener("toggle",()=>onToggle(box.open));
  box.append(ce("summary",null,title+" ("+list.length+")"));
  return box
}
function renderCompras(){
  const cont=document.getElementById("comprasList"),hint=document.getElementById("comprasHint"),summary=document.getElementById("comprasSummary");
  if(!cont)return;
  syncShoppingWeek();
  const sw=document.getElementById("comprasDescontar");
  if(sw)sw.checked=comprasDescontar();
  try{
    renderPresupuestoCompras()
  }catch(e){
  }
  let items;
  try{
    items=shoppingDisplayItems()
  }catch(e){
    cont.replaceChildren(ce("p","screen__hint","No se pudo calcular la lista: "+e.message));
    return
  }
  const pend=items.filter(x=>x.group==="pendiente"),tenes=items.filter(x=>x.group==="tenes"),comprados=items.filter(x=>x.group==="comprado"),pending=pend.filter(x=>!comprasDone[x.key]),tachados=pend.length-pending.length+tenes.filter(x=>comprasDone[x.key]).length;
  summary.textContent=pending.length+" pendientes · "+tachados+" tachados";
  hint.textContent="Tachá lo que comprás. Lo que tenés en la Despensa pasa a Ya tenés.";
  const nodes=[];
  let i=0;
  for(const sec of SECCIONES_SUPER){
    const lista=pend.filter(x=>x.seccion===sec);
    if(!lista.length)continue;
    const box=ce("div","compras-seccion");
    box.dataset.seccion=sec;
    box.append(ce("h3","compras-seccion__titulo",sec));
    // Lo tachado queda a la vista, al final de su sección.
    for(const x of [...lista.filter(x=>!comprasDone[x.key]),...lista.filter(x=>comprasDone[x.key])])box.append(shoppingRow(x,i++,!!comprasDone[x.key],x.text.endsWith(" · revisá")&&x.suggestion?"💡 "+x.suggestion.text:""));
    nodes.push(box)
  }
  if(!pending.length)nodes.push(ce("p","screen__hint",items.length?"No queda nada por comprar.":"No hay compras pendientes. Agregá comidas a la semana."));
  if(tenes.length){
    const g=shoppingGroup("Ya tenés",tenes,comprasTenesOpen,v=>{
      comprasTenesOpen=v
    });
    for(const x of tenes)g.append(shoppingRow(x,i++,!!comprasDone[x.key],x.suggestion?"💡 "+x.suggestion.text:""));
    nodes.push(g)
  }
  if(comprados.length){
    const g=shoppingGroup("Ya en tu despensa",comprados,comprasCompradosOpen,v=>{
      comprasCompradosOpen=v
    });
    for(const x of comprados)g.append(shoppingRow(x,i++,true));
    nodes.push(g)
  }
  cont.replaceChildren(...nodes)
}
// Tachar o destachar. Destachar algo de "Ya en tu despensa" lo devuelve a Pendientes sin tocar la despensa
// (para revertir la despensa está el Deshacer de "Lo compré").
function toggleShop(key,checked){
  syncShoppingWeek();
  comprasDone[key]=checked;
  let bought;
  if(!checked){
    bought=shoppingBoughtSet();
    bought.delete(key)
  }
  try{
    saveShoppingChecks(bought)
  }catch(e){
    comprasStatus(e.message)
  }
  renderCompras()
}
function comprasText(){
  const pend=shoppingDisplayItems().filter(x=>x.group==="pendiente"&&!comprasDone[x.key]),lines=[],extras=manualShoppingText();
  // Por secciones del súper y con cantidades legibles (desde la v15.4).
  for(const sec of SECCIONES_SUPER){
    const l=pend.filter(x=>x.seccion===sec);
    if(l.length)lines.push(...(lines.length?[""]:[]),sec,...l.map(x=>"• "+textoLegible(x.text)))
  }
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
