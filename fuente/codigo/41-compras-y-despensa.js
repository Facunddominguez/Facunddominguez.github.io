// Mi Plato Fácil · Compras y Despensa (desde la v15.4): segmento "Lista | Despensa", interruptor "Descontar lo que
// tengo", menú ⋯ con las herramientas de compras (una pantalla que muestra solo la elegida) y "Anotar gasto".
// Parte 42: los archivos se unen en orden según su número, que define el orden de arranque.
// init() corre durante la carga de 14, antes que este archivo: acá solo hay funciones, var y manejadores, que se
// usan recién al tocar. renderCompras (12) no depende de nada de este archivo.
var COMPRAS_HERRAMIENTAS={
  realizadas:"Compras realizadas",presupuesto:"Presupuesto",precios:"Mis precios",costoReceta:"Costo de una receta",otrasRecetas:"Calcular para otras recetas",existencias:"Porciones, existencias y costos",compartir:"Compartir o copiar la lista"
};
// Abre una herramienta (o "todas", que usan las capturas para medir) en la pantalla comprasHerramientas.
function abrirHerramientaCompras(nombre){
  if(nombre!=="todas"&&!COMPRAS_HERRAMIENTAS[nombre])return;
  try{
    if(hoja.abierta())hoja.cerrar()
  }catch(e){
  }
  document.querySelectorAll("#comprasHerramientas [data-herr]").forEach(g=>{
    g.hidden=nombre!=="todas"&&g.dataset.herr!==nombre
  });
  document.getElementById("shoppingToolsPanel").open=true;
  document.getElementById("comprasHerrTitulo").textContent=nombre==="todas"?"Herramientas de compras":COMPRAS_HERRAMIENTAS[nombre];
  if(activeTab!=="compras")openTab("compras");
  const paneles={
    realizadas:["purchasesPanel"],presupuesto:["shoppingBudgetPanel"],precios:["pricePanel"],costoReceta:["recipeCostPanel"],otrasRecetas:["quantShoppingPanel","stockDeductionPanel"],existencias:["shoppingQuantCostPanel"]
  };
  const ids=nombre==="todas"?Object.values(paneles).flat():paneles[nombre]||[];
  for(const id of ids){
    const p=document.getElementById(id);
    if(p&&!p.open)p.open=true
  }
  go("comprasHerramientas")
}
function abrirMenuCompras(){
  const lista=ce("div","menu-semana");
  for(const [nombre,texto] of Object.entries(COMPRAS_HERRAMIENTAS))lista.append(botonHoja(texto,"button--soft",{
    comprasHerr:nombre
  }));
  hoja.abrir({
    titulo:"Más opciones de compras",contenido:[lista],botones:[],foco:false
  })
}
// "Anotar gasto" después de "Terminé de comprar": abre el formulario de siempre de Compras realizadas, ya cargado con
// lo que acaba de pasar a la despensa. Los precios se guardan en Mis precios; la despensa no se vuelve a sumar.
var ultimaCompraClaves=[];
function anotarGasto(){
  const claves=new Set(ultimaCompraClaves),items=shoppingPlanItems().filter(e=>claves.has(e.key)),box=document.getElementById("purchaseItems");
  box.replaceChildren();
  for(const e of items){
    const m=mergeUnits(e.units),one=m.size===1?[...m.entries()][0]:null;
    appendPurchaseItem({
      name:e.name,quantity:one&&!e.unknown?one[1]:null,unit:one&&!e.unknown?one[0]:null,price:null
    })
  }
  const budget=shoppingBudgetRead();
  document.getElementById("purchaseDate").value=typedAppDateLabel(localTrainingDate(new Date()));
  document.getElementById("purchaseCurrency").value=budget?budget.currency:"ARS";
  document.getElementById("purchaseUpdatePrices").checked=true;
  document.getElementById("purchaseAddStock").checked=false;
  abrirHerramientaCompras("realizadas");
  document.getElementById("purchaseStatus").textContent=items.length?"Cargá el total y, si querés, los precios: actualizan Mis precios.":"Cargá el total de la compra.";
  document.getElementById("purchaseTotal").focus({
    preventScroll:true
  })
}
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b)return;
  const d=b.dataset;
  if(d.comprasMenu!==undefined)return abrirMenuCompras();
  if(d.comprasHerr)return abrirHerramientaCompras(d.comprasHerr);
  if(d.comprasVista==="lista")return openTab("compras");
  if(d.comprasVista==="despensa"&&stack.at(-1)!=="ingredientes"){
    renderPantry();
    return go("ingredientes")
  }
  if(d.anotarGasto!==undefined)return anotarGasto()
});
document.getElementById("comprasDescontar").addEventListener("change",e=>{
  try{
    guardarComprasDescontar(e.target.checked)
  }catch(err){
    e.target.checked=!e.target.checked;
    comprasStatus("No se pudo guardar el cambio.")
  }
  renderCompras()
});
