// Mi Plato Fácil · Compras y Despensa (desde la v15.4): segmento "Lista | Despensa", interruptor "Descontar lo que
// tengo", menú ⋯ con las herramientas de compras (una pantalla que muestra solo la elegida) y "Anotar gasto".
// Parte 42: los archivos se unen en orden según su número, que define el orden de arranque.
// init() corre durante la carga de 14, antes que este archivo: acá solo hay funciones, var y manejadores, que se
// usan recién al tocar. renderCompras (12) no depende de nada de este archivo.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como ComprasDespensa.nombre().
var ComprasDespensa={
abrirHerramientaCompras(nombre){
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
},
abrirMenuCompras(){
  const lista=ce("div","menu-semana");
  for(const [nombre,texto] of Object.entries(COMPRAS_HERRAMIENTAS))lista.append(botonHoja(texto,"button--soft",{
    comprasHerr:nombre
  }));
  hoja.abrir({
    titulo:"Más opciones de compras",contenido:[lista],botones:[],foco:false
  })
},
anotarGasto(){
  const box=document.getElementById("purchaseItems");
  box.replaceChildren();
  // Una fila por lo que realmente se sumó a la despensa (en la unidad en que se sumó: 200 g, no los 500 g del plan), y
  // una fila sin cantidad por cada ítem que quedó marcado sin cantidad. Lo que ya alcanzaba no entra en el ticket.
  for(const c of ultimaCompraCambios)ComprasHechas.appendPurchaseItem({
    name:c.name,quantity:c.delta,unit:c.unit,price:null
  });
  for(const n of ultimaCompraSinCantidad)ComprasHechas.appendPurchaseItem({
    name:n,quantity:null,unit:null,price:null
  });
  const items=ultimaCompraCambios.concat(ultimaCompraSinCantidad);
  const budget=shoppingBudgetRead();
  document.getElementById("purchaseDate").value=typedAppDateLabel(Rutina.localTrainingDate(new Date()));
  document.getElementById("purchaseCurrency").value=budget?budget.currency:"ARS";
  document.getElementById("purchaseUpdatePrices").checked=true;
  document.getElementById("purchaseAddStock").checked=false;
  ComprasDespensa.abrirHerramientaCompras("realizadas");
  document.getElementById("purchaseStatus").textContent=items.length?"Cargá el total y, si querés, los precios: actualizan Mis precios.":"Cargá el total de la compra.";
  document.getElementById("purchaseTotal").focus({
    preventScroll:true
  })
}
};
var COMPRAS_HERRAMIENTAS={
  realizadas:"Compras realizadas",presupuesto:"Presupuesto",precios:"Mis precios",costoReceta:"Costo de una receta",otrasRecetas:"Calcular para otras recetas",existencias:"Porciones, existencias y costos",compartir:"Compartir o copiar la lista"
};
// Abre una herramienta (o "todas", que usan las capturas para medir) en la pantalla comprasHerramientas.
// "Anotar gasto" después de "Terminé de comprar": abre el formulario de siempre de Compras realizadas, ya cargado con
// lo que acaba de pasar a la despensa. Los precios se guardan en Mis precios; la despensa no se vuelve a sumar.
var ultimaCompraClaves=[],ultimaCompraCambios=[],ultimaCompraSinCantidad=[];
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b)return;
  const d=b.dataset;
  if(d.comprasMenu!==undefined)return ComprasDespensa.abrirMenuCompras();
  if(d.comprasHerr)return ComprasDespensa.abrirHerramientaCompras(d.comprasHerr);
  if(d.comprasVista==="lista")return openTab("compras");
  if(d.comprasVista==="despensa"&&stack.at(-1)!=="ingredientes"){
    renderPantry();
    return go("ingredientes")
  }
  if(d.equivNo){
    equivalenciasOcultas.add(d.equivNo);
    return renderCompras()
  }
  if(d.equivUnir){
    const [a,c]=d.equivUnir.split("|");
    try{
      Equivalencias.saveIngredientAlias(a,c)
    }catch(err){
      comprasStatus(err.message)
    }
    return renderCompras()
  }
  if(d.anotarGasto!==undefined)return ComprasDespensa.anotarGasto()
});
document.getElementById("comprasDescontar").addEventListener("change",e=>{
  try{
    Compras.guardarComprasDescontar(e.target.checked)
  }catch(err){
    e.target.checked=!e.target.checked;
    comprasStatus("No se pudo guardar el cambio.")
  }
  renderCompras()
});
