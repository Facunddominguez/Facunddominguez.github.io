// Mi Plato Fácil · Productos extra de la lista de compras.
// Parte 18: los archivos se unen en orden según su número, que define el orden de arranque.
const MANUAL_SHOP_KEY="miPlatoFacil_manualShopping_v1";
let manualShopEditing=null;
function loadManualShopping(){
  try{
    const a=JSON.parse(localStorage.getItem(MANUAL_SHOP_KEY)||"[]");
    return Array.isArray(a)?a.filter(x=>x&&typeof x.id==="string"&&typeof x.name==="string"&&x.name.trim()).map(x=>({
      id:x.id,name:x.name.slice(0,100),amount:typeof x.amount==="string"?x.amount.slice(0,80):"",done:x.done===true
    })):[]
  }catch(e){
    return []
  }
}
function persistManualShopping(a){
  try{
    localStorage.setItem(MANUAL_SHOP_KEY,JSON.stringify(a));
    return true
  }catch(e){
    document.getElementById("manualShopStatus").textContent="No se pudo guardar. Revisá el almacenamiento del dispositivo.";
    return false
  }
}
function resetManualShoppingForm(){
  manualShopEditing=null;
  document.getElementById("manualShoppingForm").reset();
  document.getElementById("manualShopSubmit").textContent="Agregar producto";
  document.querySelector("[data-manual-cancel]").classList.add("is-hidden")
}
function renderManualShopping(){
  const box=document.getElementById("manualShopList"),a=loadManualShopping();
  box.replaceChildren(...a.map(item=>{
    const row=ce("div","manual-shop-row"),remove=ce("button","manual-shop-remove","×");remove.type="button";remove.dataset.manualDelete=item.id;remove.setAttribute("aria-label","Eliminar "+item.name);remove.title="Eliminar producto";const label=ce("label","shop-item"+(item.done?" is-done":"")),check=ce("input");check.type="checkbox";check.checked=item.done;check.dataset.manualCheck=item.id;const text=ce("span",null,item.name+(item.amount?" · "+item.amount:""));if(item.done)text.style.textDecoration="line-through";label.append(check,text);row.append(remove,label);return row
  }));
  if(!a.length)box.append(ce("p","screen__hint","Todavía no agregaste productos extra."))
}
function manualShoppingText(){
  return loadManualShopping().filter(x=>!x.done).map(x=>"• "+x.name+(x.amount?" ("+x.amount+")":"")).join(NL)
}
document.getElementById("manualShoppingForm").addEventListener("submit",e=>{
  e.preventDefault();const name=document.getElementById("manualShopName").value.trim(),amount=document.getElementById("manualShopAmount").value.trim(),status=document.getElementById("manualShopStatus");if(!name){
    status.textContent="Escribí un producto.";return
  }const a=loadManualShopping();if(manualShopEditing){
    const item=a.find(x=>x.id===manualShopEditing);if(!item){
      status.textContent="El producto ya no está disponible. Cancelá la edición.";return
    }item.name=name;item.amount=amount
  }else a.push({
    id:Date.now().toString(36)+"_"+Math.random().toString(36).slice(2),name,amount,done:false
  });if(persistManualShopping(a)){
    resetManualShoppingForm();renderManualShopping();status.textContent="Producto guardado."
  }
});
document.addEventListener("change",e=>{
  if(!e.target.dataset.manualCheck)return;const a=loadManualShopping(),item=a.find(x=>x.id===e.target.dataset.manualCheck);if(item){
    item.done=e.target.checked;if(persistManualShopping(a))renderManualShopping();else e.target.checked=!e.target.checked
  }
});
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;if(b.dataset.manualCancel!==undefined)return resetManualShoppingForm();if(b.dataset.manualEdit){
    const item=loadManualShopping().find(x=>x.id===b.dataset.manualEdit);if(item){
      manualShopEditing=item.id;document.getElementById("manualShopName").value=item.name;document.getElementById("manualShopAmount").value=item.amount;document.getElementById("manualShopSubmit").textContent="Guardar cambios";document.querySelector("[data-manual-cancel]").classList.remove("is-hidden");document.getElementById("manualShopName").focus()
    }
  }if(b.dataset.manualDelete){
    if(!window.confirm("¿Eliminar este producto extra?"))return;const a=loadManualShopping().filter(x=>x.id!==b.dataset.manualDelete);if(persistManualShopping(a)){
      if(manualShopEditing===b.dataset.manualDelete)resetManualShoppingForm();renderManualShopping()
    }
  }
});
startupGuard("Productos extra",renderManualShopping);
