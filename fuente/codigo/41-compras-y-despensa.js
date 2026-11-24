// Mi Plato Fácil · Compras y Despensa (desde la v15.4): segmento "Lista | Despensa", interruptor "Descontar lo que
// tengo", menú ⋯ con las herramientas de compras (una pantalla que muestra solo la elegida) y "Anotar gasto".
// Parte 42: los archivos se unen en orden según su número, que define el orden de arranque.
// init() corre durante la carga de 14, antes que este archivo: acá solo hay funciones, var y manejadores, que se
// usan recién al tocar. renderCompras (12) no depende de nada de este archivo.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como ComprasDespensa.nombre().
var ComprasDespensa={
abrirHerramientaCompras(nombre){
  if(!COMPRAS_HERRAMIENTAS[nombre])return;
  try{
    if(hoja.abierta())hoja.cerrar()
  }catch(e){
  }
  document.querySelectorAll("#comprasHerramientas [data-herr]").forEach(g=>{
    g.hidden=g.dataset.herr!==nombre
  });
  document.getElementById("comprasHerrTitulo").textContent=COMPRAS_HERRAMIENTAS[nombre];
  if(activeTab!=="compras")openTab("compras");
  // v19.8 (R5-K-05, K-14): las herramientas se ven directo (sin desplegables); al abrirlas se dibuja su contenido.
  if(nombre==="realizadas"){
    const d=document.getElementById("purchaseDate");
    if(!d.value)d.value=typedAppDateLabel(Rutina.localTrainingDate(new Date()));
    ComprasHechas.renderPurchases();
    ComprasHechas.renderPurchaseSum()
  }
  if(nombre==="presupuesto"){
    // v19.9 (R5-X-02): el presupuesto se ve directo; solo "Comparar alternativas de precio" sigue plegado.
    shoppingBudgetRender();
    budgetCompareRender()
  }
  if(nombre==="precios")CantidadesCostos.abrirPrecios();
  if(nombre==="costoReceta")CantidadesCostos.refreshRecipeCostChoices();
  go("comprasHerramientas")
},
abrirMenuCompras(){
  const lista=ce("div","menu-semana");
  for(const nombre of COMPRAS_MENU)lista.append(botonHoja(COMPRAS_HERRAMIENTAS[nombre],"button--soft",{
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
// v19.8: el menú ⋯ de Compras tiene tres herramientas (K-10, K-11, K-12, K-13). "Presupuesto" no está en el menú: se abre
// desde el renglón de arriba de la lista (comprasPresupuesto), que es donde ya se ve.
var COMPRAS_HERRAMIENTAS={
  realizadas:"Compras realizadas",presupuesto:"Presupuesto",precios:"Mis precios",costoReceta:"Costo de una receta"
};
var COMPRAS_MENU=["realizadas","precios","costoReceta"];
// Abre una herramienta en la pantalla comprasHerramientas.
// "Anotar gasto" después de "Terminé de comprar": abre el formulario de siempre de Compras realizadas, ya cargado con
// lo que acaba de pasar a la despensa. Los precios se guardan en Mis precios; la despensa no se vuelve a sumar.
var ultimaCompraClaves=[],ultimaCompraCambios=[],ultimaCompraSinCantidad=[];
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b)return;
  const d=b.dataset;
  if(d.comprasMenu!==undefined)return ComprasDespensa.abrirMenuCompras();
  if(d.comprasCompartir!==undefined)return Compras.shareCompras();
  if(d.volverALista){
    try{
      Compras.devolverALaLista(d.volverALista)
    }catch(err){
      comprasStatus(err.message)
    }
    return renderCompras()
  }
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
