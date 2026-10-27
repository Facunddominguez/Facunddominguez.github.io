// Mi Plato Fácil · Movimientos de despensa y descontar al cocinar.
// Parte 27 de 30: los archivos se unen en este orden (el número define el orden de arranque).
function validPantryMoves(a){
  return Array.isArray(a)&&a.length<=300&&a.every(x=>!!x&&typeof x==="object"&&typeof x.at==="string"&&x.at.length<=40&&typeof x.name==="string"&&x.name.trim().length>0&&x.name.length<=100&&typeof x.unit==="string"&&x.unit.length<=20&&typeof x.delta==="number"&&Number.isFinite(x.delta)&&Math.abs(x.delta)<=100000000&&typeof x.reason==="string"&&x.reason.length<=80)
}
function loadPantryMoves(){
  try{
    const a=JSON.parse(localStorage.getItem("miPlatoFacil_pantryMoves_v1")||"[]");
    return validPantryMoves(a)?a:[]
  }catch(e){
    return []
  }
}
function logPantryMoves(moves){
  const list=moves.filter(m=>m&&Number.isFinite(m.delta)&&m.delta!==0);
  if(!list.length)return;
  try{
    const a=loadPantryMoves().concat(list.map(m=>({
      at:new Date().toISOString(),name:String(m.name).slice(0,100),unit:String(m.unit).slice(0,20),delta:Math.round(m.delta*1e6)/1e6,reason:String(m.reason).slice(0,80)
    })));
    localStorage.setItem("miPlatoFacil_pantryMoves_v1",JSON.stringify(a.slice(-300)))
  }catch(e){
  }
}
function renderPantryMoves(){
  const box=document.getElementById("stockMoves");
  if(!box)return;
  const a=loadPantryMoves().slice(-30).reverse(),fmt=n=>(n>0?"+":"−")+Math.abs(n).toLocaleString("es-AR",{
    maximumFractionDigits:6
  });
  box.replaceChildren(...a.map(m=>ce("p","screen__hint",fmtWhen(m.at)+" · "+m.name+" "+fmt(m.delta)+" "+m.unit+" · "+m.reason)));
  if(!a.length)box.append(ce("p","screen__hint","Todavía no hay movimientos."))
}
function applyStockChanges(changes,reason){
  const stock=loadStockQuantities(),moves=[],short=[];
  for(const c of changes){
    if(!c||!c.name||!Number.isFinite(c.delta)||c.delta===0)continue;
    if(c.delta>0){
      const key=stockKey(c.name,c.unit);
      if(!stock[key]){
        if(Object.keys(stock).length>=500){
          short.push(c.name+": se alcanzó el máximo de 500 existencias");
          continue
        }
        stock[key]={
          name:c.name.trim().slice(0,100),quantity:0,unit:c.unit
        }
      }
      const before=stock[key].quantity;
      stock[key].quantity=Math.min(100000000,Math.round((before+c.delta)*1e6)/1e6);
      moves.push({
        name:stock[key].name,unit:c.unit,delta:stock[key].quantity-before,reason
      })
    }else{
      let need=-c.delta;
      const key=ingredientKey(c.name);
      for(const s of Object.values(stock)){
        if(need<=1e-9)break;
        if(ingredientKey(s.name)!==key||!sameDimension(s.unit,c.unit)||s.quantity<=0)continue;
        const take=Math.min(convertQuantity(s.quantity,s.unit,c.unit),need),takeInS=convertQuantity(take,c.unit,s.unit),before=s.quantity;
        s.quantity=Math.max(0,Math.round((s.quantity-takeInS)*1e6)/1e6);
        need-=take;
        moves.push({
          name:s.name,unit:s.unit,delta:s.quantity-before,reason
        })
      }
      if(need>1e-9)short.push(c.name+": faltaron "+Number(need.toFixed(6)).toLocaleString("es-AR")+" "+c.unit)
    }
  }
  try{
    localStorage.setItem(STOCK_QUANT_KEY,JSON.stringify(stock))
  }catch(e){
    throw Error("No se pudo actualizar la despensa (falta de espacio u otro error). No se modificó nada.")
  }
  logPantryMoves(moves);
  return {
    moves,short
  }
}
function deductRecipeFromPantry(recipeId){
  const r=loadRecipeDetails()[recipeId],amounts=loadRecipeAmounts(),a=r&&r.amountsTitle&&amounts[r.amountsTitle];
  if(!a)throw Error("Esta receta no tiene ingredientes con cantidades.");
  const changes=a.rows.filter(x=>x.quantity!==null&&x.name.trim()).map(x=>({
    name:x.name,unit:x.unit,delta:-x.quantity
  }));
  if(!changes.length)throw Error("La receta no tiene cantidades para descontar.");
  return applyStockChanges(changes,("Cocinaste "+r.title).slice(0,80))
}
document.getElementById("recipeReadCooked").addEventListener("click",()=>{
  const st=document.getElementById("recipeCatalogCount");try{
    const id=recipeReadId;if(!id)throw Error("Abrí una receta guardada primero.");const r=loadRecipeDetails()[id],a=r&&r.amountsTitle&&loadRecipeAmounts()[r.amountsTitle];if(!a)throw Error("Esta receta no tiene ingredientes con cantidades.");if(!window.confirm("¿Descontar de la despensa los ingredientes de la receta completa (rinde "+String(a.yield).replace(".",",")+" porciones)? No se descuenta nada que no tengas registrado."))return;const res=deductRecipeFromPantry(id);st.textContent=(res.moves.length?"Despensa actualizada: "+res.moves.length+" movimiento"+(res.moves.length===1?"":"s")+".":"No había existencias registradas para descontar.")+(res.short.length?" No alcanzó: "+res.short.join("; ")+".":"");renderStockQuantities();renderCompras()
  }catch(err){
    st.textContent=err.message
  }
});
