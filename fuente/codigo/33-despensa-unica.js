// Mi Plato Fácil · Despensa única: "Lo básico" (marcas) y otros ingredientes con cantidad opcional.
// Parte 34: los archivos se unen en orden según su número, que define el orden de arranque.
// Sin cantidad, un ingrediente se guarda como marca (la misma lista de "Lo básico"); con cantidad, como
// existencia (la misma que usan Compras, las recetas y los movimientos). No se migra ni se reescribe nada guardado.
var pantryItemsReady=false;
let pantryEditKey=null,pantryUndo=null;
// Si el nombre corresponde a una marca de "Lo básico", devuelve su código (por ejemplo "arroz").
function pantryChipFor(name){
  const k=ingredientKey(name);
  if(!k)return null;
  const hit=PANTRY.find(([id,label])=>(PANTRY_ALIASES[id]||[]).some(a=>ingredientKey(a)===k)||ingredientKey(label.replace(/^[^\p{L}]+/u,""))===k);
  return hit?hit[0]:null
}
function pantryQtyText(q){
  return Number(q.toFixed(6)).toLocaleString("es-AR",{
    maximumFractionDigits:6
  })
}
function renderPantryItems(){
  const box=document.getElementById("pantryItemList");
  if(!box)return;
  const rows=Object.entries(loadStockQuantities()).map(([key,s])=>({
    key,name:s.name,quantity:s.quantity,unit:s.unit
  })).concat(pantrySel.filter(x=>typeof x==="string"&&!pantryById(x)).map(name=>({
    name
  }))).sort((a,b)=>a.name.localeCompare(b.name,"es"));
  if(!rows.length){
    box.replaceChildren(ce("p","screen__hint","Todavía no agregaste otros ingredientes."));
    return
  }
  box.replaceChildren(...rows.map(r=>{
    const row=ce("div","pantry-item"),text=ce("span","pantry-item__text"),edit=ce("button","filter-chip",r.key?"Editar":"Agregar cantidad"),del=ce("button","filter-chip filter-chip--danger","Quitar");
    row.dataset.pantryItem=r.key||r.name;
    text.append(ce("strong",null,r.name),document.createTextNode(" · "+(r.key?pantryQtyText(r.quantity)+" "+r.unit+(r.quantity===0?" (se terminó)":""):"sin cantidad")));
    edit.type=del.type="button";
    if(r.key){
      edit.dataset.pantryItemEdit=r.key;
      del.dataset.pantryItemRemoveStock=r.key
    }else{
      edit.dataset.pantryItemQty=r.name;
      del.dataset.pantryItemRemoveFree=r.name
    }
    edit.setAttribute("aria-label",(r.key?"Editar ":"Agregar cantidad a ")+r.name);
    del.setAttribute("aria-label","Quitar "+r.name+" de la despensa");
    row.append(text,edit,del);
    return row
  }))
}
// Después de cualquier cambio: marcas, lista, ideas y lo que depende de la despensa.
function afterPantryChange(){
  renderPantry();
  try{
    renderStockQuantities()
  }catch(e){
  }
  try{
    shoppingQuantityAndCost()
  }catch(e){
  }
  if(stack.at(-1)==="compras")renderCompras()
}
function pantryStatus(text,undo){
  const st=document.getElementById("pantryItemStatus");
  st.replaceChildren(document.createTextNode(text));
  if(undo){
    const b=ce("button","filter-chip","Deshacer");
    b.type="button";
    b.dataset.pantryUndo="";
    st.append(" ",b)
  }
}
function resetPantryForm(){
  pantryEditKey=null;
  document.getElementById("pantryItemName").value="";
  document.getElementById("pantryItemQty").value="";
  document.getElementById("pantryItemSubmit").textContent="Agregar a la despensa";
  document.getElementById("pantryItemCancel").classList.add("is-hidden")
}
function savePantryItem(){
  const name=document.getElementById("pantryItemName").value.trim().replace(/\s+/g," "),unit=document.getElementById("pantryItemUnit").value,qty=recipeAmountNumber(document.getElementById("pantryItemQty").value,true),k=ingredientKey(name);
  if(!name||!k)throw Error("Escribí el ingrediente.");
  if(name.length>100)throw Error("El nombre es demasiado largo (máximo 100 caracteres).");
  const stock=loadStockQuantities();
  if(qty===null){
    if(pantryEditKey)throw Error("Para guardar el cambio, indicá la cantidad. Si ya no tenés este ingrediente, tocá Quitar.");
    const chip=pantryChipFor(name);
    if(chip){
      if(pantrySel.includes(chip))return "Ya estaba marcado en Lo básico.";
      pantrySel.push(chip);
      if(!persistPantry()){
        pantrySel.pop();throw Error("No se pudo guardar.")
      }
      return "Marcado en Lo básico: "+pantryById(chip)[1].replace(/^[^\p{L}]+/u,"")+"."
    }
    if(pantrySel.some(x=>!pantryById(x)&&ingredientKey(x)===k))return "Ya estaba en tu despensa.";
    if(Object.values(stock).some(s=>ingredientKey(s.name)===k))return "Ya lo tenés con cantidad: tocá Editar para cambiarla.";
    if(pantrySel.filter(x=>!pantryById(x)).length>=200)throw Error("Máximo 200 ingredientes sin cantidad.");
    pantrySel.push(name);
    if(!persistPantry()){
      pantrySel.pop();throw Error("No se pudo guardar.")
    }
    return "Agregado a tu despensa: "+name+" (sin cantidad)."
  }
  if(!RECIPE_AMOUNT_UNITS.includes(unit))throw Error("Elegí una unidad.");
  const key=stockKey(name,unit),moves=[];
  if(pantryEditKey&&pantryEditKey!==key&&stock[pantryEditKey]){
    const old=stock[pantryEditKey];
    delete stock[pantryEditKey];
    if(old.quantity)moves.push({
      name:old.name,unit:old.unit,delta:-old.quantity,reason:"Ajuste manual"
    })
  }
  if(!stock[key]&&Object.keys(stock).length>=500)throw Error("Máximo 500 existencias registradas.");
  const before=stock[key]?stock[key].quantity:0;
  stock[key]={
    name,quantity:qty,unit
  };
  if(qty!==before)moves.push({
    name,unit,delta:qty-before,reason:"Ajuste manual"
  });
  try{
    localStorage.setItem(STOCK_QUANT_KEY,JSON.stringify(stock))
  }catch(e){
    throw Error("No se pudo guardar. Revisá el espacio disponible.")
  }
  logPantryMoves(moves);
  // Si estaba como ingrediente sin cantidad, ahora lo representa la existencia.
  const i=pantrySel.findIndex(x=>!pantryById(x)&&ingredientKey(x)===k);
  if(i>=0){
    pantrySel.splice(i,1);persistPantry()
  }
  return "Guardado: "+name+" · "+pantryQtyText(qty)+" "+unit+"."
}
document.getElementById("pantryItemForm").addEventListener("submit",e=>{
  e.preventDefault();
  try{
    const msg=savePantryItem();
    resetPantryForm();
    pantryUndo=null;
    afterPantryChange();
    pantryStatus(msg)
  }catch(err){
    pantryStatus(err.message)
  }
});
document.getElementById("pantryItemCancel").addEventListener("click",()=>{
  resetPantryForm();
  pantryStatus("")
});
document.getElementById("pantryItemName").addEventListener("focus",()=>{
  const list=document.getElementById("pantryItemNames");
  if(list.options.length)return;
  const names=new Set(PANTRY.map(p=>p[1].replace(/^[^\p{L}]+/u,"").trim()));
  try{
    nutritionDataset().names.forEach(n=>names.add(n))
  }catch(e){
  }
  list.replaceChildren(...[...names].sort((a,b)=>a.localeCompare(b,"es")).map(n=>{
    const o=document.createElement("option");o.value=n;return o
  }))
});
document.addEventListener("click",e=>{
  const b=e.target.closest("button");
  if(!b)return;
  if(b.dataset.pantryResultsToggle!==undefined){
    pantryResultsAll=!pantryResultsAll;
    renderPantryResults();
    return
  }
  try{
    if(b.dataset.pantryItemRemoveStock){
      const stock=loadStockQuantities(),key=b.dataset.pantryItemRemoveStock,old=stock[key];
      if(!old)return;
      delete stock[key];
      try{
        localStorage.setItem(STOCK_QUANT_KEY,JSON.stringify(stock))
      }catch(err){
        throw Error("No se pudo actualizar la despensa.")
      }
      if(old.quantity)logPantryMoves([{
        name:old.name,unit:old.unit,delta:-old.quantity,reason:"Quitada de la despensa"
      }]);
      if(pantryEditKey===key)resetPantryForm();
      pantryUndo={
        kind:"stock",key,item:old
      };
      afterPantryChange();
      pantryStatus("Quitado: "+old.name+".",true)
    }else if(b.dataset.pantryItemRemoveFree){
      const name=b.dataset.pantryItemRemoveFree,i=pantrySel.indexOf(name);
      if(i<0)return;
      pantrySel.splice(i,1);
      persistPantry();
      pantryUndo={
        kind:"free",name
      };
      afterPantryChange();
      pantryStatus("Quitado: "+name+".",true)
    }else if(b.dataset.pantryItemEdit){
      const s=loadStockQuantities()[b.dataset.pantryItemEdit];
      if(!s)return;
      pantryEditKey=b.dataset.pantryItemEdit;
      document.getElementById("pantryItemName").value=s.name;
      document.getElementById("pantryItemQty").value=String(s.quantity).replace(".",",");
      document.getElementById("pantryItemUnit").value=s.unit;
      document.getElementById("pantryItemSubmit").textContent="Guardar cambios";
      document.getElementById("pantryItemCancel").classList.remove("is-hidden");
      pantryStatus("Editando "+s.name+".");
      document.getElementById("pantryItemQty").focus()
    }else if(b.dataset.pantryItemQty){
      resetPantryForm();
      document.getElementById("pantryItemName").value=b.dataset.pantryItemQty;
      pantryStatus("Escribí la cantidad y tocá Agregar a la despensa.");
      document.getElementById("pantryItemQty").focus()
    }else if(b.dataset.pantryUndo!==undefined&&pantryUndo){
      const u=pantryUndo;
      pantryUndo=null;
      if(u.kind==="stock"){
        const stock=loadStockQuantities();
        if(stock[u.key])throw Error("No se pudo deshacer: ya hay otra cantidad guardada para ese ingrediente.");
        stock[u.key]=u.item;
        localStorage.setItem(STOCK_QUANT_KEY,JSON.stringify(stock));
        if(u.item.quantity)logPantryMoves([{
          name:u.item.name,unit:u.item.unit,delta:u.item.quantity,reason:"Deshacer: vuelve a la despensa"
        }])
      }else if(!pantrySel.includes(u.name)){
        pantrySel.push(u.name);
        persistPantry()
      }
      afterPantryChange();
      pantryStatus("Listo, se recuperó.")
    }
  }catch(err){
    pantryStatus(err.message)
  }
});
{
  const select=document.getElementById("pantryItemUnit");
  select.replaceChildren(...RECIPE_AMOUNT_UNITS.map(u=>{
    const o=ce("option",null,u);o.value=u;return o
  }));
  select.value="g"
}
pantryItemsReady=true;
renderPantryItems();
