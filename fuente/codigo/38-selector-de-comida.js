// Mi Plato Fácil · Selector de comida, opciones de un hueco de la Semana y su menú ⋯ (desde la v15.1).
// Parte 39: los archivos se unen en orden según su número, que define el orden de arranque.
// El Selector es una hoja inferior (la de 37-ideas-y-hoja.js) con buscador, Recientes, Mis comidas del tipo, Ideas,
// Armar nueva y Sugerime: tocar una comida la asigna en el momento (setSlot: historial, porciones y Deshacer).
// renderPlan (10) llama a refrescarHojaHueco aunque corra antes de que cargue este archivo: por eso el estado es var.
var huecoAbierto=null;
function botonHoja(texto,clase,datos){
  const b=ce("button","button "+clase,texto);
  b.type="button";
  for(const [k,v] of Object.entries(datos||{}))b.dataset[k]=v;
  return b
}
function rendimientoDeReceta(rid){
  try{
    const r=loadRecipeDetails()[rid],am=loadRecipeAmounts();
    return r&&r.amountsTitle&&am[r.amountsTitle]?am[r.amountsTitle].yield:null
  }catch(e){
    return null
  }
}
// Hueco lleno: Cambiar, Quitar, Porciones (recetas) y Lo comí (solo hoy).
function abrirHueco(dia,slot){
  const id=(loadPlan()[dia]||{})[slot]||null,it=id?loadSaved().find(p=>p.id===id):null;
  if(!it)return abrirSelector(dia,slot);
  const pk=dia+"|"+slot,caja=ce("div","hueco-hoja"),h={
    dia,slot,id,modo:"lleno",caja,item:it
  };
  caja.append(ce("p","hueco-hoja__plato",planPlateLabel(it)));
  const lineas=savedItemLines(it).join(" · ");
  if(lineas)caja.append(ce("p","screen__hint",lineas));
  if(it.recipeSourceId){
    const campo=ce("div","portion-field"),label=ce("label",null,"Porciones"),inp=ce("input"),map=loadPlanPortions(),rinde=rendimientoDeReceta(it.recipeSourceId);
    inp.type="text";
    inp.inputMode="decimal";
    inp.maxLength=6;
    inp.id="hojaPorciones";
    label.htmlFor="hojaPorciones";
    inp.value=map[pk]!==undefined?String(map[pk]).replace(".",","):"";
    inp.placeholder=rinde?String(rinde):"";
    inp.dataset.planPortions=pk;
    h.porciones=ce("p","screen__hint");
    campo.append(label,inp);
    caja.append(campo,h.porciones)
  }
  const acciones=ce("div","hueco-hoja__acciones");
  if(dia===todayPlanDay()){
    h.loComi=botonHoja("Lo comí hoy","button--primary",{
      planEaten:pk
    });
    acciones.append(h.loComi)
  }
  acciones.append(botonHoja("Cambiar","button--soft",{
    huecoCambiar:pk
  }),botonHoja("Quitar","button--danger",{
    planClear:pk
  }));
  caja.append(acciones);
  huecoAbierto=h;
  hoja.abrir({
    titulo:mayuscula(nombreDelHueco(dia,slot)),contenido:[caja],botones:[],foco:false
  });
  actualizarHuecoLleno(h)
}
function actualizarHuecoLleno(h){
  const pk=h.dia+"|"+h.slot;
  if(h.porciones){
    const map=loadPlanPortions(),rinde=rendimientoDeReceta(h.item.recipeSourceId);
    h.porciones.textContent=rinde?"La receta rinde "+String(rinde).replace(".",",")+" porciones."+(map[pk]!==undefined?" Compras calcula para "+String(map[pk]).replace(".",",")+".":" Compras usa la receta completa."):"Compras usa la receta completa."
  }
  if(h.loComi){
    const it=loadSaved().find(p=>p.id===h.id),hecho=!!it&&eatenToday(it,h.slot);
    h.loComi.disabled=hecho;
    h.loComi.textContent=hecho?"✓ Comido hoy":"Lo comí hoy"
  }
}
// Después de cada cambio del plan: si el hueco abierto cambió de comida, la hoja se cierra; si no, se actualiza.
function refrescarHojaHueco(){
  const h=huecoAbierto;
  if(!h||h.modo!=="lleno")return;
  if(!h.caja.isConnected||!hoja.abierta()){
    huecoAbierto=null;
    return
  }
  if(((loadPlan()[h.dia]||{})[h.slot]||null)!==h.id){
    huecoAbierto=null;
    hoja.cerrar();
    return
  }
  actualizarHuecoLleno(h)
}
// Recientes: lo último que comiste de ese tipo y, después, lo último que guardaste.
function recientesDelTipo(items){
  const byId=new Map(items.map(x=>[x.id,x])),orden=[];
  let cons=[];
  try{
    cons=loadConsumption()
  }catch(e){
  }
  cons.filter(r=>r&&byId.has(r.sourceId)).sort((a,b)=>String(b.date).localeCompare(String(a.date))).forEach(r=>{
    if(!orden.includes(r.sourceId))orden.push(r.sourceId)
  });
  [...items].sort((a,b)=>String(b.savedAt||"").localeCompare(String(a.savedAt||""))).forEach(x=>{
    if(!orden.includes(x.id))orden.push(x.id)
  });
  return orden.slice(0,4).map(id=>byId.get(id))
}
// Tus recetas con ingredientes que todavía no tienen copia para este tipo de comida (se crea al elegirlas).
function recetasSinCopia(items){
  try{
    const am=loadRecipeAmounts(),usadas=new Set(items.map(x=>x.recipeSourceId).filter(Boolean));
    return Object.values(loadRecipeDetails()).filter(r=>!usadas.has(r.id)&&r.amountsTitle&&am[r.amountsTitle]&&am[r.amountsTitle].rows.length).sort((a,b)=>a.title.localeCompare(b.title,"es"))
  }catch(e){
    return []
  }
}
function seccionesSelector(h,q){
  const pool=slotPool(h.slot),items=loadSaved().filter(p=>p&&p.type===pool),labels=mealLabels(items),n=normalizeSearchText(String(q||"").trim());
  const nombre=it=>labels.get(it.id)||mealName(it),coincide=t=>!n||normalizeSearchText(t).includes(n);
  const fila=it=>{
    const b=ce("button","selector-item"+(it.id===h.id?" is-actual":""));b.type="button";b.dataset.selectorId=it.id;b.append(ce("span","selector-item__nombre",planPlateLabel(it,nombre(it))));const d=savedItemLines(it).join(" · ");if(d)b.append(ce("span","selector-item__detalle",d));if(it.id===h.id)b.setAttribute("aria-current","true");return b
  };
  const seccion=(titulo,clave,filas,vacio)=>{
    const s=ce("section","selector-seccion");s.dataset.selectorSeccion=clave;s.append(ce("h3","selector-seccion__titulo",titulo));if(filas.length)s.append(...filas);else s.append(ce("p","screen__hint",vacio));return s
  };
  const out=[];
  if(!n&&items.length>4)out.push(seccion("Recientes","recientes",recientesDelTipo(items).map(fila),""));
  const mias=items.filter(it=>coincide(nombre(it)+" "+savedItemLines(it).join(" "))).sort((a,b)=>(b.fav?1:0)-(a.fav?1:0)),recetas=recetasSinCopia(items).filter(r=>coincide(r.title)).map(r=>{
    const b=ce("button","selector-item");b.type="button";b.dataset.selectorReceta=r.id;b.append(ce("span","selector-item__nombre","📖 "+r.title));return b
  });
  out.push(seccion("Mis comidas","mias",[...mias.map(fila),...recetas],n?"Ninguna de tus comidas coincide.":"Todavía no guardaste comidas de este tipo: armá una nueva."));
  if(h.slot==="almuerzo"||h.slot==="cena"){
    let ideas=[];
    try{
      ideas=sugerenciasPara(h.slot,diaDeRutina(fechaDelDiaDelPlan(h.dia))).filter(x=>x.tipo==="idea"&&coincide(x.idea.text+" "+(x.idea.tags||[]).join(" ")))
    }catch(e){
    }
    ideas.sort((a,b)=>b.peso-a.peso);
    out.push(seccion("Ideas","ideas",ideas.slice(0,n?20:6).map(x=>{
      const b=ce("button","selector-item");b.type="button";b.dataset.selectorIdea=x.idea.text;b.append(ce("span","selector-item__nombre","💡 "+x.idea.text));return b
    }),n?"Ninguna idea coincide.":avisoSinSugerencias()))
  }
  return out
}
function abrirSelector(dia,slot){
  if(!DAYS.some(d=>d[0]===dia)||!SLOTS.some(s=>s[0]===slot))return;
  const pool=slotPool(slot),caja=ce("div","selector"),buscar=ce("input"),lista=ce("div","selector__lista"),acciones=ce("div","selector__acciones"),sug=ce("div","selector__sugerencia");
  buscar.type="search";
  buscar.id="selectorBuscar";
  buscar.placeholder="Buscar en tus comidas e ideas";
  buscar.autocomplete="off";
  buscar.setAttribute("aria-label","Buscar comida");
  acciones.append(botonHoja("＋ Armar nueva","button--soft",{
    start:pool,startDay:dia,startSlot:slot
  }),botonHoja("🎲 Sugerime","button--soft",{
    selectorSugerir:""
  }));
  sug.hidden=true;
  sug.setAttribute("aria-live","polite");
  caja.append(buscar,acciones,sug,lista);
  const h={
    dia,slot,modo:"selector",caja,sug,id:(loadPlan()[dia]||{})[slot]||null
  };
  const pintar=()=>lista.replaceChildren(...seccionesSelector(h,buscar.value));
  buscar.addEventListener("input",pintar);
  pintar();
  huecoAbierto=h;
  hoja.abrir({
    titulo:"Elegir "+nombreDelHueco(dia,slot).toLowerCase(),contenido:[caja],botones:[],foco:false
  })
}
// Asigna lo elegido en el Selector y cierra la hoja. Si algo falla, queda abierta con el motivo.
function elegirEnSelector(asignar){
  const h=huecoAbierto;
  if(!h||h.modo!=="selector")return;
  try{
    asignar(h);
    huecoAbierto=null;
    hoja.cerrar();
    planDiaElegido=h.dia;
    renderPlan();
    if(typeof renderToday==="function")renderToday()
  }catch(err){
    hoja.estado.textContent=err.message
  }
}
function diaDelHueco(h){
  return diaDeRutina(fechaDelDiaDelPlan(h.dia))
}
function sugerirEnSelector(){
  const h=huecoAbierto;
  if(!h||h.modo!=="selector")return;
  if(slotPool(h.slot)==="desayuno"){
    // Desayuno o merienda: arma una combinación al azar; al guardarla se asigna a este hueco.
    huecoAbierto=null;
    hoja.cerrar();
    randomMeal("desayuno");
    armadoDestino={
      dia:h.dia,slot:h.slot,tab:activeTab
    };
    return
  }
  const s=elegirSugerencia(h.slot,Math.random,diaDelHueco(h));
  h.sug.hidden=false;
  h.sug.replaceChildren();
  h.sugerencia=s;
  if(!s){
    h.sug.append(ce("p","screen__hint",avisoSinSugerencias()));
    return
  }
  const fila=ce("div","selector__acciones");
  fila.append(botonHoja("Usar esta","button--primary",{
    selectorUsar:""
  }),botonHoja("Otra","button--soft",{
    selectorSugerir:""
  }));
  h.sug.append(ce("p","selector__propuesta","¿Qué tal "+(s.tipo==="idea"?s.idea.text:mealName(s.item))+"?"),fila)
}
// Asigna y, si no se pudo guardar, tira el motivo (el Selector queda abierto y lo muestra).
function asignarHueco(dia,slot,id){
  if(setSlot(dia,slot,id)===false)throw Error(errorDelPlan||"No se pudo guardar el cambio.")
}
function asignarIdeaAlHueco(h,idea){
  const {
    item
  }=guardarIdea(idea,diaDelHueco(h)||"Día libre");
  asignarHueco(h.dia,h.slot,item.id)
}
// Armado empezado desde un hueco: lo guardado se asigna ahí y se vuelve a la Semana en ese día.
function asignarArmadoAlHueco(item){
  const d=armadoDestino;
  armadoDestino=null;
  if(!d||!item)return;
  planDiaElegido=d.dia;
  const asignado=setSlot(d.dia,d.slot,item.id)!==false,texto=asignado?"Asignado al "+nombreDelHueco(d.dia,d.slot).toLowerCase()+".":"Se guardó en Mis comidas, pero no se pudo asignar: "+errorDelPlan;
  limpiarArmado();
  // Vuelve a donde empezó: Hoy (con el aviso y su Deshacer) o la Semana en ese día.
  if(d.tab==="hoy"){
    stack=["home"];
    go("home");
    renderToday();
    if(!asignado){
      const st=document.getElementById("todayStatus");
      if(st)st.textContent=texto
    }
    return
  }
  stack=["plan"];
  go("plan");
  planStatus(texto)
}
// "Sugerime algo" (Hoy, desde la v15.2): reemplaza a Plato del día y a Sugerir al azar como entradas separadas.
// Propone para un hueco de hoy (el primero vacío o, si están todos llenos, la próxima comida según la hora). En
// almuerzo y cena, la primera propuesta es la del Plato del día (semilla con la fecha) y "Otra" es al azar; "Ver y
// cambiar" la lleva al resumen (como hacían las dos tarjetas) y, si se guarda, se asigna al hueco. Desayuno y merienda
// arman una combinación al azar, como el Sugerime del Selector. "Al azar" abre la pantalla de siempre.
function huecoParaSugerir(){
  const p=loadPlan()[todayPlanDay()]||{},ids=new Set(loadSaved().map(x=>x.id)),vacio=HOY_COMIDAS.find(s=>!p[s]||!ids.has(p[s]));
  if(vacio)return vacio;
  const h=new Date().getHours();
  return h<11?"desayuno":h<15?"almuerzo":h<19?"merienda":"cena"
}
function abrirSugerime(slot){
  const dia=todayPlanDay();
  slot=SLOTS.some(s=>s[0]===slot)?slot:huecoParaSugerir();
  const caja=ce("div","selector sugerime"),chips=ce("div","filter-row sugerime__comidas"),sug=ce("div","selector__sugerencia"),otras=ce("div","selector__acciones");
  for(const c of HOY_COMIDAS){
    const b=ce("button","filter-chip",planSlotName(c));b.type="button";b.dataset.sugerimeComida=c;b.setAttribute("aria-pressed",String(c===slot));chips.append(b)
  }
  sug.setAttribute("aria-live","polite");
  otras.append(botonHoja("🎲 Al azar","button--soft",{
    openAzar:""
  }));
  caja.append(chips,sug,otras);
  const h={
    dia,slot,modo:"selector",caja,sug,id:(loadPlan()[dia]||{})[slot]||null,sugerime:true
  };
  huecoAbierto=h;
  hoja.abrir({
    titulo:"Sugerime algo",contenido:[caja],botones:[],foco:false
  });
  proponerEnSugerime(h,true)
}
function proponerEnSugerime(h,primera){
  h.sug.replaceChildren();
  const fila=ce("div","selector__acciones");
  if(slotPool(h.slot)==="desayuno"){
    h.sugerencia=null;
    h.sug.append(ce("p","selector__propuesta","Te armo "+(h.slot==="merienda"?"una merienda":"un desayuno")+" con fruta, proteína y cereal."));
    fila.append(botonHoja("Armalo","button--primary",{
      selectorSugerir:""
    }));
    h.sug.append(fila);
    return
  }
  const s=primera?sugerenciaDelDia(h.slot):elegirSugerencia(h.slot,Math.random,diaDelHueco(h));
  h.sugerencia=s;
  if(!s){
    h.sug.append(ce("p","screen__hint",avisoSinSugerencias()));
    return
  }
  fila.append(botonHoja("Usar esta","button--primary",{
    selectorUsar:""
  }),botonHoja("Otra","button--soft",{
    sugerimeOtra:""
  }),botonHoja("Ver y cambiar","button--soft",{
    sugerimeVer:""
  }));
  h.sug.append(ce("p","selector__propuesta","¿Qué tal "+(s.tipo==="idea"?s.idea.text:mealName(s.item))+(h.id?" en vez de tu ":" para tu ")+planSlotName(h.slot).toLowerCase()+"?"),fila)
}
// Ver y cambiar: carga la propuesta en el armado y abre el resumen; al guardarla, se asigna al hueco.
function verSugerencia(){
  const h=huecoAbierto;
  if(!h||!h.sugerime||!h.sugerencia)return;
  huecoAbierto=null;
  hoja.cerrar();
  cargarSugerencia(h.sugerencia,diaDelHueco(h)||"");
  lastRandomType=null;
  // Después de cargarSugerencia (que empieza de cero y borra el destino).
  armadoDestino={
    dia:h.dia,slot:h.slot,tab:activeTab
  };
  go("resumen");
  shareStatus("¿Qué tal esta? Podés cambiarla o guardarla.")
}
// Menú ⋯ de la Semana: lo ocasional, en los dos modos.
function abrirMenuSemana(){
  const lista=ce("div","menu-semana");
  lista.append(botonHoja("Repetir semana anterior","button--soft",{
    planRepetirAnterior:""
  }),botonHoja("Copiar un día","button--soft",{
    planCopiarDia:""
  }),botonHoja("Vaciar la semana","button--danger",{
    clearPlan:""
  }));
  for(const [nombre,texto] of [["variaciones","Planes guardados"],["semanas","Semanas anteriores y mes"],["historial","Historial de cambios"],["descargar","Descargar"],["recetas","Buscar en mis recetas"],["consumo","Lo que comí y objetivos"]])lista.append(botonHoja(texto,"button--soft",{
    planHerr:nombre
  }));
  huecoAbierto=null;
  hoja.abrir({
    titulo:"Más opciones de la semana",contenido:[lista],botones:[],foco:false
  })
}
function lunesAnterior(){
  const d=new Date(semanaActual()+"T12:00:00");
  d.setDate(d.getDate()-7);
  return localTrainingDate(d)
}
function repetirSemanaAnterior(){
  const key=lunesAnterior();
  if(!loadDatedWeeks()[key]){
    hoja.estado.textContent="No hay copia de la semana del "+typedAppDateLabel(key).slice(0,5)+". Las copias están en Semanas anteriores y mes.";
    return
  }
  hoja.cerrar();
  const antes={
    plan:loadPlan(),porciones:loadPlanPortions()
  };
  try{
    if(reuseDatedWeek(key)===false)return;
    deshacerPlan={
      texto:"Repetiste la semana del "+typedAppDateLabel(key).slice(0,5),...antes
    };
    renderPlan();
    planStatus("Listo: usás las comidas de la semana anterior.")
  }catch(err){
    planStatus(err.message)
  }
}
function abrirCopiarDia(){
  const desde=diaPlanElegido(),caja=ce("div","copiar-dia"),chips=ce("div","filter-row");
  for(const [k,l] of DAYS.filter(d=>d[0]!==desde)){
    const b=ce("button","filter-chip",l);b.type="button";b.dataset.copiarA=k;b.setAttribute("aria-pressed","false");chips.append(b)
  }
  caja.append(ce("p",null,"Copiar las comidas del "+planDayName(desde).toLowerCase()+" a:"),chips,botonHoja("Copiar","button--primary",{
    copiarConfirmar:desde
  }));
  huecoAbierto=null;
  hoja.abrir({
    titulo:"Copiar un día",contenido:[caja],botones:[],foco:false
  })
}
// Herramientas de la Semana: una pantalla que muestra solo la elegida (los paneles de siempre, con sus datos).
function abrirHerramientaPlan(nombre){
  const titulos={
    variaciones:"Planes guardados",semanas:"Semanas anteriores y mes",historial:"Historial de cambios",descargar:"Descargar",recetas:"Buscar en mis recetas",consumo:"Lo que comí y objetivos"
  };
  if(!titulos[nombre])return;
  try{
    if(hoja.abierta())hoja.cerrar()
  }catch(e){
  }
  huecoAbierto=null;
  document.querySelectorAll("#planHerramientas [data-herr]").forEach(g=>{
    g.hidden=g.dataset.herr!==nombre
  });
  document.getElementById("planHerrTitulo").textContent=titulos[nombre];
  if(activeTab!=="semana")openTab("semana");
  const abrirPanel=id=>{
    const p=document.getElementById(id);if(p&&!p.open){
      p.open=true;return true
    }return false
  };
  if(nombre==="variaciones")refreshVarSelect();
  if(nombre==="semanas"){
    abrirPanel("monthlyPlanPanel");abrirPanel("datedWeeksPanel");renderMonthlyPlan();renderDatedWeek()
  }
  if(nombre==="historial"){
    abrirPanel("planHistoryPanel");renderPlanHistory()
  }
  if(nombre==="descargar")document.querySelector('#planHerramientas [data-herr="descargar"] details').open=true;
  if(nombre==="recetas"){
    abrirPanel("planRecipeReference");renderPlanRecipeReference()
  }
  if(nombre==="consumo"&&!abrirPanel("consumptionPanel"))renderConsumption();
  go("planHerramientas")
}
// Las acciones de las hojas que llevan a otra pantalla (armar) o piden confirmación (vaciar) cierran la hoja antes.
document.addEventListener("click",e=>{
  if(e.target.closest&&e.target.closest(".hoja [data-start],.hoja [data-clear-plan],.hoja [data-open-azar],.hoja [data-open-training]")){
    huecoAbierto=null;
    hoja.cerrar()
  }
},true);
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b)return;
  const d=b.dataset;
  if(d.planDia)return elegirDiaPlan(d.planDia);
  if(d.hueco){
    const [dia,slot]=d.hueco.split("|");return abrirHueco(dia,slot)
  }
  if(d.huecoCambiar){
    const [dia,slot]=d.huecoCambiar.split("|");return abrirSelector(dia,slot)
  }
  if(d.selectorId)return elegirEnSelector(h=>asignarHueco(h.dia,h.slot,d.selectorId));
  if(d.selectorReceta)return elegirEnSelector(h=>asignarRecetaAlPlan(d.selectorReceta,h.dia,h.slot,false));
  if(d.selectorIdea)return elegirEnSelector(h=>{
    const idea=ideaPorTexto(d.selectorIdea);if(!idea)throw Error("La idea ya no está disponible.");asignarIdeaAlHueco(h,idea)
  });
  if(d.selectorSugerir!==undefined)return sugerirEnSelector();
  if(d.sugerimeComida)return abrirSugerime(d.sugerimeComida);
  if(d.sugerimeOtra!==undefined){
    if(huecoAbierto&&huecoAbierto.sugerime)proponerEnSugerime(huecoAbierto,false);return
  }
  if(d.sugerimeVer!==undefined)return verSugerencia();
  if(d.selectorUsar!==undefined)return elegirEnSelector(h=>{
    const s=h.sugerencia;if(!s)throw Error("Pedí una sugerencia.");if(s.tipo==="idea")asignarIdeaAlHueco(h,s.idea);else asignarHueco(h.dia,h.slot,s.item.id)
  });
  if(d.planMenu!==undefined)return abrirMenuSemana();
  if(d.planHerr)return abrirHerramientaPlan(d.planHerr);
  if(d.planRepetirAnterior!==undefined)return repetirSemanaAnterior();
  if(d.planCopiarDia!==undefined)return abrirCopiarDia();
  if(d.copiarA){
    b.setAttribute("aria-pressed",String(b.getAttribute("aria-pressed")!=="true"));return
  }
  if(d.copiarConfirmar){
    try{
      copiarDiaDelPlan(d.copiarConfirmar,[...hoja.elemento.querySelectorAll('[data-copiar-a][aria-pressed="true"]')].map(x=>x.dataset.copiarA));hoja.cerrar()
    }catch(err){
      hoja.estado.textContent=err.message
    }
    return
  }
  if(d.planDeshacer!==undefined)return deshacerCambioDelPlan();
  if(d.planRepetir!==undefined)return repetirPlanEstaSemana();
  if(d.planDeCero!==undefined)return empezarSemanaDeCero()
});
