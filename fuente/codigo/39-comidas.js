// Mi Plato Fácil · Comidas (v15.3): tarjeta única para platos y recetas, detalle de cada comida, "+ Nueva",
// el segmento "Mis comidas | Ideas", "Con lo que tengo" y los nutrientes de cada ingrediente.
// Parte 40: los archivos se unen en orden según su número, que define el orden de arranque.
// init() corre antes de este archivo: todo lo que se llama al pintar es una declaración function y el estado va en var.
// El adaptador solo lee: los platos (miPlatoFacil_saved) y las recetas (miPlatoFacil_recipeDetails_v1) siguen separados.
var comidaActual=null;
var ideasConLoQueTengo=false;
var ideasMenuTodas=false;
var IDEAS_MENU_VISIBLES=8;
function comidaTipoDeComida(type){
  return {
    desayuno:"Desayuno o merienda",plato:"Almuerzo o cena",snack:"Snack",pre:"Pre-entreno"
  }
  [type]||"Comida"
}
function comidaDesdePlato(item){
  const c=item.cooked||0,componentes=[...new Set(extractIngredients(item).map(x=>String(x).trim()).filter(Boolean))];
  return {
    tipo:"plato",origen:"plato",id:item.id,nombre:mealName(item),componentes,etiquetas:[comidaTipoDeComida(item.type),c>0?"Cocinado "+c+" ve"+(c===1?"z":"ces"):""].filter(Boolean),fav:!!item.fav,cocinado:c,enPlan:false,fecha:item.savedAt||"",aviso:""
  }
}
// Una copia del plan (plato con recipeSourceId) cuya receta ya no está: se muestra como receta, con aviso.
function comidaDesdeCopia(item,aviso){
  const c=comidaDesdePlato(item);
  c.tipo="receta";
  c.etiquetas=["Receta"].concat(c.etiquetas);
  c.aviso=aviso||"";
  return c
}
function comidaDesdeReceta(r,amounts,enPlan){
  const a=r.amountsTitle&&Object.prototype.hasOwnProperty.call(amounts,r.amountsTitle)?amounts[r.amountsTitle]:null;
  return {
    tipo:"receta",origen:"receta",id:r.id,nombre:r.title,componentes:savedRecipeIngredients(r,amounts),etiquetas:["Receta",r.minutes?"⏱ "+r.minutes+" min":"",a&&a.yield?"Rinde "+String(a.yield).replace(".",","):"",enPlan?"📅 En el plan":""].filter(Boolean),fav:false,cocinado:0,enPlan:!!enPlan,fecha:r.updatedAt||r.createdAt||"",aviso:""
  }
}
function ordenarComidas(lista){
  const orden={
    desayuno:0,plato:1,snack:2,pre:3
  },nombre=c=>normalizeSearchText(c.nombre);
  const s=lista.map((c,i)=>({
    c,i
  }));
  s.sort((x,y)=>{
    if(x.c.fav!==y.c.fav)return x.c.fav?-1:1;
    if(savedSort==="az")return nombre(x.c).localeCompare(nombre(y.c),"es");
    if(savedSort==="cocinado"&&x.c.cocinado!==y.c.cocinado)return y.c.cocinado-x.c.cocinado;
    if(savedSort==="tipo"&&x.c.tipo!==y.c.tipo)return x.c.tipo==="plato"?-1:1;
    return x.i-y.i
  });
  return s.map(x=>x.c)
}
// La tarjeta: nombre, componentes en una línea y etiquetas. El "≈ costo por porción" llega en la Etapa 7.
function tarjetaComida(c){
  const b=ce("button","comida-card");
  b.type="button";
  b.dataset.comidaTipo=c.tipo;
  b.dataset.comidaId=c.id;
  b.dataset.comidaOrigen=c.origen;
  if(c.origen==="receta")b.dataset.recipeId=c.id;
  b.append(ce("strong","comida-card__nombre",(c.fav?"⭐ ":"")+c.nombre));
  b.append(ce("span","comida-card__componentes",c.componentes.length?c.componentes.join(", "):"Sin ingredientes cargados"));
  if(c.etiquetas.length)b.append(ce("span","comida-card__etiquetas",c.etiquetas.join(" · ")));
  if(c.aviso)b.append(ce("span","comida-card__aviso",c.aviso));
  b.setAttribute("aria-label",c.nombre+(c.tipo==="receta"?" (receta)":"")+". Ver detalle");
  return b
}
function abrirComida(origen,id){
  if(origen==="receta"){
    recipeReadReturnTo="misplatos";
    showRecipeRead(id);
    return
  }
  mostrarDetallePlato(id)
}
// Detalle (pantalla "comida"): las acciones comunes arriba y, abajo, el plato o la receta.
function pintarCabeceraComida(nombre,etiquetas){
  document.getElementById("comidaTitulo").textContent=nombre;
  document.getElementById("comidaEtiquetas").textContent=etiquetas.join(" · ");
  document.getElementById("comidaEstado").textContent=""
}
function mostrarDetalleReceta(r){
  let amounts={
  };
  try{
    amounts=loadRecipeAmounts()
  }catch(e){
  }
  comidaActual={
    origen:"receta",id:r.id
  };
  pintarCabeceraComida(r.title,comidaDesdeReceta(r,amounts,false).etiquetas);
  document.getElementById("comidaPlato").hidden=true
}
function mostrarDetallePlato(id){
  const it=loadSaved().find(x=>x.id===id);
  if(!it)throw Error("Esa comida ya no está guardada.");
  if(recipeReadId)closeRecipeRead(false);
  document.getElementById("recipeReadView").hidden=true;
  comidaActual={
    origen:"plato",id
  };
  if(stack.at(-1)!=="comida")go("comida");
  pintarDetallePlato(it)
}
function pintarDetallePlato(it){
  const c=comidaDesdePlato(it);
  pintarCabeceraComida((it.fav?"⭐ ":"")+c.nombre,c.etiquetas.concat(it.recipeSourceId?["Copia de una receta"]:[]));
  const box=document.getElementById("comidaPlato"),ul=document.getElementById("comidaComponentes"),acts=document.getElementById("comidaPlatoAcciones");
  box.hidden=false;
  ul.replaceChildren(...(c.componentes.length?c.componentes.map(n=>{
    const li=ce("li"),b=ce("button","comida-ingrediente",n);b.type="button";b.dataset.nutrienteIngrediente=n;li.append(b);return li
  }):[ce("li",null,"Sin ingredientes cargados")]));
  const boton=(texto,clave,valor,clase)=>{
    const b=ce("button","button "+(clase||"button--soft"),texto);b.type="button";b.dataset[clave]=valor;return b
  };
  acts.replaceChildren(boton("🍳 Lo cociné","cookSaved",it.id),boton("Editar nombre","renameSaved",it.id))
}
function refrescarDetalleComida(){
  if(stack.at(-1)!=="comida"||!comidaActual)return;
  if(comidaActual.origen==="plato"){
    const it=loadSaved().find(x=>x.id===comidaActual.id);
    if(it)pintarDetallePlato(it);else{
      comidaActual=null;back()
    }
  }
}
function textoDeComida(){
  if(!comidaActual)return "";
  if(comidaActual.origen==="plato"){
    const it=loadSaved().find(x=>x.id===comidaActual.id);
    return it?mealName(it)+"\n"+extractIngredients(it).map(x=>"• "+x).join("\n"):""
  }
  const r=loadRecipeDetails()[comidaActual.id];
  if(!r)return "";
  const c=comidaDesdeReceta(r,loadRecipeAmounts(),false);
  return r.title+(c.componentes.length?"\nIngredientes: "+c.componentes.join(", "):"")+(r.steps.length?"\n"+r.steps.map((t,i)=>i+1+". "+t).join("\n"):"")
}
function compartirComida(){
  const t=textoDeComida(),st=document.getElementById("comidaEstado");
  if(!t)return;
  if(navigator.share){
    navigator.share({
      title:"Mi Plato Fácil",text:t
    }).catch(()=>{
    });
    return
  }
  doCopy(t).then(ok=>{
    st.textContent=ok?"Copiada para compartir.":"No se pudo copiar."
  })
}
// "Agregar a la semana": día y comida. Un plato va con setSlot; una receta, como en "Asignar receta al plan
// actual" (asignarRecetaAlPlan, con su copia en los platos del plan). Si reemplaza algo, se puede deshacer.
function agregarComidaALaSemana(dayKey,slot){
  if(!comidaActual)throw Error("Abrí una comida primero.");
  const antes=(loadPlan()[dayKey]||{})[slot]||null;
  if(comidaActual.origen==="plato"){
    if(!DAYS.some(d=>d[0]===dayKey)||!SLOTS.some(s=>s[0]===slot))throw Error("Elegí un día y una comida.");
    if(setSlot(dayKey,slot,comidaActual.id)===false)throw Error(errorDelPlan)
  }else asignarRecetaAlPlan(comidaActual.id,dayKey,slot,false);
  const ahora=(loadPlan()[dayKey]||{})[slot]||null;
  hoja.estado.replaceChildren(document.createTextNode("Agregada al "+planSlotName(slot).toLowerCase()+" del "+planDayName(dayKey).toLowerCase()+"."));
  if(antes&&antes!==ahora){
    const b=ce("button","filter-chip","Deshacer");
    b.type="button";
    b.dataset.comidaDeshacer="";
    b.addEventListener("click",()=>{
      setSlot(dayKey,slot,antes);hoja.estado.textContent="Listo, se deshizo."
    });
    hoja.estado.append(" ",b)
  }
  if(typeof renderToday==="function")renderToday()
}
function campoDeHoja(id,texto,opciones,valor){
  const c=ce("div","portion-field"),l=ce("label",null,texto),s=ce("select");
  s.id=id;
  l.htmlFor=id;
  for(const [v,t] of opciones){
    const o=ce("option",null,t);o.value=v;s.append(o)
  }
  s.value=valor;
  c.append(l,s);
  return c
}
function abrirAgregarComida(){
  if(!comidaActual)return;
  let slots=SLOTS;
  if(comidaActual.origen==="plato"){
    const it=loadSaved().find(x=>x.id===comidaActual.id),pool=it&&it.type;
    if(pool==="desayuno"||pool==="plato")slots=SLOTS.filter(s=>slotPool(s[0])===pool)
  }
  const fila=ce("div","pantry-item-qty");
  fila.append(campoDeHoja("hojaComidaDia","Día",DAYS,todayPlanDay()),campoDeHoja("hojaComidaSlot","Comida",slots.map(([v,t])=>[v,t.replace(/^\S+\s/,"")]),slots[0][0]));
  hoja.abrir({
    titulo:document.getElementById("comidaTitulo").textContent,contenido:[fila],botones:[["Agregar a la semana","button--primary",()=>agregarComidaALaSemana(document.getElementById("hojaComidaDia").value,document.getElementById("hojaComidaSlot").value)]]
  })
}
// Menú ⋯ del detalle: lo ocasional, con los mismos botones (data-*) de siempre.
function abrirMenuComida(){
  if(!comidaActual)return;
  const boton=(texto,clave,valor,clase,cerrar=true)=>{
    const b=ce("button","button "+(clase||"button--soft"),texto);b.type="button";b.dataset[clave]=valor;if(cerrar)b.addEventListener("click",()=>setTimeout(()=>hoja.cerrar(),0));return b
  };
  let items;
  if(comidaActual.origen==="plato"){
    const it=loadSaved().find(x=>x.id===comidaActual.id);
    if(!it)return;
    items=[boton(it.fav?"⭐ Quitar de favoritas":"☆ Favorita","favSaved",it.id),boton("Copiar","copySaved",it.id),boton("Eliminar","delSaved",it.id,"button--danger")]
  }else{
    const r=(id,texto,clase)=>{
      const b=ce("button","button "+(clase||"button--soft"),texto);b.type="button";b.addEventListener("click",()=>{
        hoja.cerrar();document.getElementById(id).click()
      });return b
    };
    items=[r("recipeReadDuplicate","Duplicar receta"),r("recipeReadToShopping","Agregar lo que falta a Compras"),boton("Eliminar receta","comidaEliminarReceta",comidaActual.id,"button--danger")]
  }
  const caja=ce("div","menu-semana");
  caja.append(...items);
  hoja.abrir({
    titulo:document.getElementById("comidaTitulo").textContent,contenido:[caja],botones:[],foco:false
  })
}
// Eliminar una receta desde el detalle: el mismo botón del formulario (con su confirmación de siempre).
function eliminarRecetaDesdeDetalle(id){
  recipeDetailsEditing=id;
  renderRecipeDetails();
  const antes=Object.keys(loadRecipeDetails()).length;
  document.getElementById("recipeDetailsDelete").click();
  if(Object.keys(loadRecipeDetails()).length<antes){
    comidaActual=null;
    closeRecipeRead(false);
    openTab("miscomidas")
  }
}
// Nutrientes de un ingrediente (cada 100 g), en una hoja. Usa los mismos datos que "Consultar nutrientes".
function abrirNutrientesDeIngrediente(nombre){
  const limpio=String(nombre||"").split(":")[0].trim();
  hoja.abrir({
    titulo:limpio,contenido:[nutrientesDeIngrediente(limpio)],botones:[],foco:false
  })
}
// "+ Nueva": armar con el método del plato, escribir una receta o pegarla con IA.
function abrirNuevaComida(){
  const opcion=(emoji,texto,desc,accion,attrs)=>{
    const b=ce("button","tool-button");b.type="button";b.append(ce("span","tool-button__emoji",emoji),ce("span","tool-button__label",texto),ce("span","tool-button__desc",desc));Object.assign(b.dataset,attrs||{
    });b.addEventListener("click",()=>{
      hoja.cerrar();accion()
    });return b
  };
  const grilla=ce("div","tools-grid nueva-comida");
  grilla.append(opcion("🍳","Desayuno o merienda","Armala con el método del plato",()=>{
  },{
    start:"desayuno"
  }),opcion("🥗","Almuerzo o cena","Armala con el método del plato",()=>{
  },{
    start:"plato"
  }),opcion("📝","Escribir receta","Ingredientes y preparación",()=>document.getElementById("recipeViewCreate").click(),{
    nuevaReceta:""
  }),opcion("✨","Pegar receta con IA","La IA la ordena y vos la revisás",()=>{
    document.getElementById("recipeViewCreate").click();const p=document.getElementById("aiRecipePanel");p.open=true;p.scrollIntoView({
      block:"start"
    })
  },{
    pegarReceta:""
  }));
  hoja.abrir({
    titulo:"Nueva comida",contenido:[grilla],botones:[],foco:false
  })
}
// Ideas: el filtro "Con lo que tengo" muestra las ideas que usan tu despensa (las de siempre, de 07-despensa.js).
function pintarFiltroConLoQueTengo(){
  const chip=document.getElementById("ideasConLoQueTengoChip"),box=document.getElementById("ideasConLoQueTengo");
  if(!chip||!box)return;
  chip.classList.toggle("is-selected",ideasConLoQueTengo);
  chip.setAttribute("aria-pressed",String(ideasConLoQueTengo));
  box.hidden=!ideasConLoQueTengo;
  if(ideasConLoQueTengo)renderPantryResults()
}
function abrirIdeas(conLoQueTengo){
  if(activeTab!=="miscomidas")openTab("miscomidas");
  if(stack.at(-1)!=="ideas")go("ideas");
  ideasConLoQueTengo=!!conLoQueTengo;
  pintarFiltroConLoQueTengo()
}
// Más: Preferencias, Fuentes de datos y Cómo funciona son pantallas propias.
function abrirFuentes(){
  go("fuentes");
  const info=document.getElementById("nutritionSourceInfo");
  if(info)info.textContent=nutritionSourceText()
}
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b)return;
  try{
    const d=b.dataset;
    if(d.comidaId&&b.classList.contains("comida-card"))return abrirComida(d.comidaOrigen,d.comidaId);
    if(d.comidasVista==="ideas")return abrirIdeas(false);
    if(d.comidasVista==="mias")return openTab("miscomidas");
    if(d.comidaNueva!==undefined)return abrirNuevaComida();
    if(d.conLoQueTengo!==undefined)return abrirIdeas(true);
    if(d.ideasConLoQueTengo!==undefined){
      ideasConLoQueTengo=!ideasConLoQueTengo;return pintarFiltroConLoQueTengo()
    }
    if(d.ideasVerTodas!==undefined){
      ideasMenuTodas=!ideasMenuTodas;return renderMenuIdeas()
    }
    if(d.comidaAgregar!==undefined)return abrirAgregarComida();
    if(d.comidaCompartir!==undefined)return compartirComida();
    if(d.comidaMenu!==undefined)return abrirMenuComida();
    if(d.comidaEliminarReceta)return eliminarRecetaDesdeDetalle(d.comidaEliminarReceta);
    if(d.nutrienteIngrediente)return abrirNutrientesDeIngrediente(d.nutrienteIngrediente);
    if(d.openPreferencias!==undefined)return go("preferencias");
    if(d.openFuentes!==undefined)return abrirFuentes();
    if(d.openComoFunciona!==undefined)return go("comoFunciona");
    // Después de Favorita, Editar nombre, Lo cociné o Eliminar (los maneja 14), el detalle se actualiza.
    if(d.favSaved||d.renameSaved||d.cookSaved||d.delSaved)setTimeout(refrescarDetalleComida,0)
  }catch(err){
    const st=stack.at(-1)==="comida"?document.getElementById("comidaEstado"):document.getElementById("savedActionStatus");
    if(st)st.textContent=err.message
  }
});
// Los avisos de las acciones de la receta (Compras, despensa) se escriben donde estaban; en el detalle se repiten
// en su línea de estado, para que se vean sin cambiar esas funciones.
(function(){
  const origen=document.getElementById("recipeCatalogCount"),destino=document.getElementById("recipeReadStatus");
  if(!origen||!destino||typeof MutationObserver==="undefined")return;
  new MutationObserver(()=>{
    if(stack.at(-1)==="comida"&&origen.textContent&&destino.textContent!==origen.textContent)destino.textContent=origen.textContent
  }).observe(origen,{
    childList:true,characterData:true,subtree:true
  })
})();
