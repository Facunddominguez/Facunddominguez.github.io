// Mi Plato Fácil · Selector de comida, opciones de un hueco de la Semana y su menú ⋯ (desde la v15.1).
// Parte 39: los archivos se unen en orden según su número, que define el orden de arranque.
// El Selector es una hoja inferior (la de 37-ideas-y-hoja.js) con buscador, Recientes, Mis comidas del tipo, Ideas,
// Armar nueva y Sugerime: tocar una comida la asigna en el momento (setSlot: historial, porciones y Deshacer).
// renderPlan (10) llama a refrescarHojaHueco aunque corra antes de que cargue este archivo: por eso el estado es var.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Selector.nombre().
var Selector={
elegirEnSelector(asignar){
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
},
sugerirEnSelector(){
  const h=huecoAbierto;
  if(!h||h.modo!=="selector")return;
  // v19.4 (R5-C-02): en el selector de comida, desayuno y merienda sugieren una idea, igual que almuerzo y cena (para armar una comida está "＋ Armar nueva").
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
},
asignarHueco(dia,slot,id){
  if(setSlot(dia,slot,id)===false)throw Error(errorDelPlan||"No se pudo guardar el cambio.")
},
asignarIdeaAlHueco(h,idea){
  const {
    item
  }=IdeasHoja.guardarIdea(idea,diaDelHueco(h)||"Día libre");
  Selector.asignarHueco(h.dia,h.slot,item.id)
},
verSugerencia(){
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
},
abrirMenuSemana(){
  // v19.1: "Compartir la semana" (texto, imagen y HTML) va anteúltimo y "Empezar de nuevo", último; sin Historial, Descargar ni Buscar en mis recetas.
  const lista=ce("div","menu-semana");
  lista.append(botonHoja(Semana.viendoProxima()?"Repetir esta semana":"Repetir semana anterior","button--soft",{
    planRepetirAnterior:""
  }),botonHoja("Copiar un día","button--soft",{
    planCopiarDia:""
  }));
  for(const [nombre,texto] of [["semanas","Semanas anteriores y mes"],["consumo","Registro y objetivos"]])lista.append(botonHoja(texto,"button--soft",{
    planHerr:nombre
  }));
  lista.append(botonHoja("Recordarme armar la semana","button--soft",{
    recordatorioMenu:""
  }),botonHoja("Compartir la semana","button--soft",{
    compartirSemanaMenu:""
  }),botonHoja("Empezar de nuevo","button--danger",{
    clearPlan:""
  }));
  huecoAbierto=null;
  hoja.abrir({
    titulo:"Más opciones de la semana",contenido:[lista],botones:[],foco:false
  })
},
// v19.1: elegir un plan guardado desde la Semana y aplicarlo a la semana que se ve (con Deshacer en el aviso de Semana).
abrirPlanesGuardados(){
  const nombres=Object.keys(Semana.loadVars()).sort((x,y)=>x.localeCompare(y,"es")),lista=ce("div","menu-semana");
  if(!nombres.length)lista.append(ce("p","screen__hint","Todavía no guardaste planes. Guardalos desde Semanas anteriores y mes."));
  for(const n of nombres){
    const fila=ce("div","plan-guardado-fila");
    fila.append(botonHoja(n,"button--soft",{
      planUsar:n
    }),botonHoja("Borrar","button--danger",{
      planBorrar:n
    }));
    lista.append(fila)
  }
  huecoAbierto=null;
  const destino=semanaFechada?"la copia de la semana del "+typedAppDateLabel(semanaFechada).slice(0,5):Semana.viendoProxima()?"la semana que viene":"esta semana";
  hoja.abrir({
    titulo:"Usar un plan guardado",contenido:[ce("p","screen__hint","Se aplica a "+destino+(semanaFechada?".":". Si no te gusta, lo deshacés.")),lista],botones:[],foco:false
  })
},
lunesAnterior(){
  const d=new Date(Semana.semanaActual()+"T12:00:00");
  d.setDate(d.getDate()-7);
  return Rutina.localTrainingDate(d)
},
repetirSemanaAnterior(){
  // En la semana que viene, "Repetir esta semana": copia el plan de esta semana (con Deshacer).
  if(Semana.viendoProxima()){
    hoja.cerrar();
    let actual={};
    try{actual=Semana.migratePlan(JSON.parse(localStorage.getItem(PKEY)||"{}")||{})}catch(e){actual=Semana.migratePlan({})}
    const antes={plan:loadPlan(),porciones:{}};
    if(!Semana.planTieneComidas(actual)){planStatus("Esta semana todavía no tiene comidas para repetir.");return}
    if(Semana.persistPlan(actual)===false){planStatus(errorDelPlan||"No se pudo copiar.");return}
    deshacerPlan={texto:"Repetiste esta semana en la que viene",...antes};
    renderPlan();
    planStatus("Listo: la semana que viene tiene las mismas comidas que esta.");
    return
  }
  const key=Selector.lunesAnterior();
  if(!loadDatedWeeks()[key]){
    hoja.estado.textContent="No hay copia de la semana del "+typedAppDateLabel(key).slice(0,5)+". Las copias están en Semanas anteriores y mes.";
    return
  }
  hoja.cerrar();
  const antes={
    plan:loadPlan(),porciones:Semana.loadPlanPortions()
  };
  try{
    if(Semana.reuseDatedWeek(key)===false)return;
    deshacerPlan={
      texto:"Repetiste la semana del "+typedAppDateLabel(key).slice(0,5),...antes
    };
    renderPlan();
    planStatus("Listo: usás las comidas de la semana anterior.")
  }catch(err){
    planStatus(err.message)
  }
},
abrirCopiarDia(){
  const desde=Semana.diaPlanElegido(),caja=ce("div","copiar-dia"),chips=ce("div","filter-row");
  for(const [k,l] of DAYS.filter(d=>d[0]!==desde)){
    const b=ce("button","filter-chip",l);b.type="button";b.dataset.copiarA=k;b.setAttribute("aria-pressed","false");chips.append(b)
  }
  caja.append(ce("p",null,"Copiar las comidas del "+Semana.planDayName(desde).toLowerCase()+" a:"),chips,botonHoja("Copiar","button--primary",{
    copiarConfirmar:desde
  }));
  huecoAbierto=null;
  hoja.abrir({
    titulo:"Copiar un día",contenido:[caja],botones:[],foco:false
  })
}
};
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
  const id=(loadPlan()[dia]||{})[slot]||null,it=id?Semana.guardadosActivos().find(p=>p.id===id):null;
  // Etapa 48: un hueco "Afuera" abre su propia hoja (gasto, "Ya no comemos afuera" o elegir una comida).
  if(!it&&SemanaAjustes.afuera(dia,slot))return SemanaAjustes.abrirAfuera(dia,slot);
  if(!it)return abrirSelector(dia,slot);
  const pk=dia+"|"+slot,caja=ce("div","hueco-hoja"),h={
    dia,slot,id,modo:"lleno",caja,item:it
  };
  caja.append(ce("p","hueco-hoja__plato",Semana.planPlateLabel(it)));
  const lineas=savedItemLines(it).join(" · ");
  if(lineas)caja.append(ce("p","screen__hint",lineas));
  // Las porciones se cargan para esta semana (Compras las usa); en la semana que viene no se muestran.
  if(it.recipeSourceId&&!Semana.viendoProxima()&&!semanaFechada){
    const campo=ce("div","portion-field"),label=ce("label",null,"Porciones"),inp=ce("input"),map=Semana.loadPlanPortions(),rinde=rendimientoDeReceta(it.recipeSourceId);
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
  if(dia===todayPlanDay()&&!Semana.viendoProxima()&&!semanaFechada){
    h.loComi=botonHoja("Lo comí hoy","button--primary",{
      planEaten:pk
    });
    acciones.append(h.loComi)
  }
  // v18.8: la receta (cantidades y pasos) a un toque desde Semana y desde Hoy.
  {
    let idea=null;
    try{idea=IdeasHoja.ideaDeComida(it)}catch(e){}
    const hayPasos=!!(idea&&Array.isArray(idea.pasos)&&idea.pasos.length);
    if(MisPlatos.loadSaved().some(p=>p.id===it.id))acciones.append(botonHoja(hayPasos?"Ver receta"+(idea.minutos?" · "+idea.minutos+" min":""):"Ver ingredientes","button--soft",{
      huecoReceta:it.id
    }))
  }
  acciones.append(botonHoja("Cambiar","button--soft",{
    huecoCambiar:pk
  }),botonHoja("Cambiar por otra parecida","button--soft",{
    huecoParecida:pk
  }),botonHoja("Cambiar por una más barata","button--soft",{
    huecoBarata:pk
  }),botonHoja("Pasar a otro día","button--soft",{
    huecoPasar:pk
  }));
  // Etapa 48: lo que sobra de un almuerzo o una cena pasa al almuerzo de mañana; "Comemos afuera" saca la comida del hueco.
  if(SemanaAjustes.puedeQueSobre(dia,slot))acciones.append(botonHoja("Que sobre para mañana","button--soft",{
    huecoSobra:pk
  }));
  acciones.append(botonHoja("Comemos afuera","button--soft",{
    huecoAfuera:pk
  }),botonHoja("Quitar","button--danger",{
    planClear:pk
  }));
  caja.append(acciones);
  huecoAbierto=h;
  hoja.abrir({
    titulo:mayuscula(Semana.nombreDelHueco(dia,slot)),contenido:[caja],botones:[],foco:false
  });
  actualizarHuecoLleno(h)
}
function actualizarHuecoLleno(h){
  const pk=h.dia+"|"+h.slot;
  if(h.porciones){
    const map=Semana.loadPlanPortions(),rinde=rendimientoDeReceta(h.item.recipeSourceId);
    h.porciones.textContent=rinde?"La receta rinde "+String(rinde).replace(".",",")+" porciones."+(map[pk]!==undefined?" Compras calcula para "+String(map[pk]).replace(".",",")+".":" Compras usa la receta completa."):"Compras usa la receta completa."
  }
  if(h.loComi){
    const it=MisPlatos.loadSaved().find(p=>p.id===h.id),hecho=!!it&&eatenToday(it,h.slot);
    h.loComi.disabled=hecho;
    h.loComi.textContent=hecho?"✓ Lo comí hoy":"Lo comí hoy"
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
  const pool=slotPool(h.slot),items=MisPlatos.loadSaved().filter(p=>p&&p.type===pool),labels=mealLabels(items),n=normalizeSearchText(String(q||"").trim());
  const nombre=it=>labels.get(it.id)||nombreCortoDeComida(it),coincide=t=>!n||normalizeSearchText(t).includes(n);
  // v19.4 (R5-C-04): una comida guardada que no cumple la dieta (o lo que evitás) se ve apagada y dice por qué; sigue a un toque por si querés usarla igual.
  const motivoDe=it=>{
    try{return dietaMotivo(mealName(it)+" "+Semana.extractIngredients(it).join(" "))}catch(e){return ""}
  };
  const fila=it=>{
    const motivo=motivoDe(it),b=ce("button","selector-item"+(it.id===h.id?" is-actual":"")+(motivo?" is-apagado":""));b.type="button";b.dataset.selectorId=it.id;b.append(ce("span","selector-item__nombre",Semana.planPlateLabel(it,nombre(it))));
    if(motivo){b.append(ce("span","selector-item__motivo",motivo));b.setAttribute("aria-label",nombre(it)+". "+motivo)}const d=savedItemLines(it).join(" · ");if(d)b.append(ce("span","selector-item__detalle",d));if(it.id===h.id)b.setAttribute("aria-current","true");return b
  };
  const seccion=(titulo,clave,filas,vacio)=>{
    const s=ce("section","selector-seccion");s.dataset.selectorSeccion=clave;s.append(ce("h3","selector-seccion__titulo",titulo));if(filas.length)s.append(...filas);else s.append(ce("p","screen__hint",vacio));return s
  };
  const out=[];
  if(!n&&items.length>4)out.push(seccion("Recientes","recientes",recientesDelTipo(items).map(fila),""));
  // v19.1 (S-19): "Mis recetas" es una sección más (junto a Recientes, Mis comidas e Ideas): las recetas que ya tienen copia para este tipo de comida y las que todavía no.
  const orden=(a,b)=>(b.fav?1:0)-(a.fav?1:0),coincideItem=it=>coincide(nombre(it)+" "+savedItemLines(it).join(" ")),
    mias=items.filter(it=>!it.recipeSourceId&&coincideItem(it)).sort(orden),
    conCopia=items.filter(it=>it.recipeSourceId&&coincideItem(it)).sort(orden),
    recetasNuevas=recetasSinCopia(items).filter(r=>coincide(r.title)).map(r=>{
      let motivo="";
      try{motivo=dietaMotivo(r.title+" "+loadRecipeAmounts()[r.amountsTitle].rows.map(x=>x.name).join(" "))}catch(e){}
      const b=ce("button","selector-item"+(motivo?" is-apagado":""));b.type="button";b.dataset.selectorReceta=r.id;b.append(ce("span","selector-item__nombre","📖 "+r.title));
      if(motivo)b.append(ce("span","selector-item__motivo",motivo));
      return b
    });
  out.push(seccion("Mis comidas","mias",mias.map(fila),n?"Ninguna de tus comidas coincide.":"Todavía no guardaste comidas de este tipo: armá una nueva."));
  if(conCopia.length||recetasNuevas.length)out.push(seccion("Mis recetas","recetas",[...conCopia.map(fila),...recetasNuevas],""));
  // Etapa 29: al elegir desayuno o merienda, también las ideas de desayuno (con sus cantidades y pasos).
  if(pool==="desayuno"){
    const yaEstan=new Set(items.map(it=>normalizeSearchText(mealName(it))));
    let ideasD=(data.desayunoCatalog||[]).filter(i=>textoPermitido(textoDeIdea(i))&&coincide(i.text+" "+(i.tags||[]).join(" "))&&!yaEstan.has(normalizeSearchText(i.text)));
    out.push(seccion("Ideas","ideas",ideasD.slice(0,n?20:6).map(i=>{
      const b=ce("button","selector-item");b.type="button";b.dataset.selectorIdea=i.text;b.append(ce("span","selector-item__nombre","💡 "+i.text));return b
    }),n?"Ninguna idea coincide.":"No hay ideas de desayuno que no tengan lo que evitás."))
  }
  if(h.slot==="almuerzo"||h.slot==="cena"){
    let ideas=[];
    try{
      ideas=sugerenciasPara(h.slot,diaDeRutina(fechaDelDiaDelPlan(h.dia))).filter(x=>x.tipo==="idea"&&coincide(x.idea.text+" "+(x.idea.tags||[]).join(" ")))
    }catch(e){
    }
    // Una idea que ya está en Mis comidas (guardada con su nombre) aparece una sola vez, ahí.
    const yaEstan=new Set(items.map(it=>normalizeSearchText(mealName(it)))),vistas=new Set();
    ideas=ideas.filter(x=>{const k=normalizeSearchText(x.idea.text);if(yaEstan.has(k)||vistas.has(k))return false;vistas.add(k);return true});
    ideas.sort((a,b)=>b.peso-a.peso);
    out.push(seccion("Ideas","ideas",ideas.slice(0,n?20:6).map(x=>{
      const b=ce("button","selector-item");b.type="button";b.dataset.selectorIdea=x.idea.text;b.append(ce("span","selector-item__nombre","💡 "+x.idea.text));return b
    }),n?"Ninguna idea coincide.":avisoSinSugerencias()));
    const pocas=dietaAvisoPocas();
    if(pocas)out.at(-1).append(ce("p","screen__hint",pocas))
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
  // Con una copia fechada abierta, "Armar nueva" y el Sugerime de desayuno terminarían escribiendo en el plan de esta semana: no se ofrecen.
  if(!semanaFechada)acciones.append(botonHoja("＋ Armar nueva","button--soft",{
    start:pool,startDay:dia,startSlot:slot
  }));
  acciones.append(botonHoja("🎲 Sugerime","button--soft",{
    selectorSugerir:""
  }));
  // Etapa 48: el hueco queda marcado "Afuera" (no suma a la lista ni al presupuesto y Armame no lo llena).
  acciones.append(botonHoja("Comemos afuera","button--soft",{
    huecoAfuera:dia+"|"+slot
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
    titulo:"Elegir "+Semana.nombreDelHueco(dia,slot).toLowerCase(),contenido:[caja],botones:[],foco:false
  })
}
// Asigna lo elegido en el Selector y cierra la hoja. Si algo falla, queda abierta con el motivo.
function diaDelHueco(h){
  return diaDeRutina(fechaDelDiaDelPlan(h.dia))
}
// Asigna y, si no se pudo guardar, tira el motivo (el Selector queda abierto y lo muestra).
// Armado empezado desde un hueco: lo guardado se asigna ahí y se vuelve a la Semana en ese día.
function asignarArmadoAlHueco(item){
  const d=armadoDestino;
  armadoDestino=null;
  if(!d||!item)return;
  planDiaElegido=d.dia;
  const asignado=setSlot(d.dia,d.slot,item.id)!==false,texto=asignado?"Asignado al "+Semana.nombreDelHueco(d.dia,d.slot).toLowerCase()+".":"Se guardó en Mis comidas, pero no se pudo asignar: "+errorDelPlan;
  Armado.limpiarArmado();
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
  const p=loadPlan()[todayPlanDay()]||{},ids=new Set(MisPlatos.loadSaved().map(x=>x.id)),vacio=HOY_COMIDAS.find(s=>!p[s]||!ids.has(p[s]));
  if(vacio)return vacio;
  const h=new Date().getHours();
  return h<11?"desayuno":h<15?"almuerzo":h<19?"merienda":"cena"
}
function abrirSugerime(slot){
  const dia=todayPlanDay();
  slot=SLOTS.some(s=>s[0]===slot)?slot:huecoParaSugerir();
  const caja=ce("div","selector sugerime"),chips=ce("div","filter-row sugerime__comidas"),sug=ce("div","selector__sugerencia"),otras=ce("div","selector__acciones");
  for(const c of HOY_COMIDAS){
    const b=ce("button","filter-chip",Semana.planSlotName(c));b.type="button";b.dataset.sugerimeComida=c;b.setAttribute("aria-pressed",String(c===slot));chips.append(b)
  }
  sug.setAttribute("aria-live","polite");
  // v19.5 (R5-H-03): sin el botón interno "Al azar" (hacía lo mismo que "Otra").
  caja.append(chips,sug);
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
  // v19.5 (R5-H-04): desayuno y merienda sugieren directo un plato, con las mismas 3 opciones que almuerzo y cena.
  const s=primera?AlAzar.sugerenciaDelDia(h.slot):elegirSugerencia(h.slot,Math.random,diaDelHueco(h));
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
  h.sug.append(ce("p","selector__propuesta","¿Qué tal "+(s.tipo==="idea"?s.idea.text:mealName(s.item))+(h.id?" en vez de tu ":" para tu ")+Semana.planSlotName(h.slot).toLowerCase()+"?"),fila)
}
// Ver y cambiar: carga la propuesta en el armado y abre el resumen; al guardarla, se asigna al hueco.
// Menú ⋯ de la Semana: lo ocasional, en los dos modos.
// Herramientas de la Semana: una pantalla que muestra solo la elegida (los paneles de siempre, con sus datos).
function abrirHerramientaPlan(nombre){
  const titulos={
    semanas:"Semanas anteriores y mes",consumo:"Registro y objetivos"
  };
  if(!titulos[nombre])return;
  // v15.5: "Lo que comí" vive en el Registro (un solo lugar para lo registrado).
  if(nombre==="consumo")return abrirRegistro({
    abrir:"comi"
  });
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
  if(nombre==="semanas"){
    // v19.2: todo a la vista; arranca en la última semana con copia (hasta esta) o, si no hay, en esta.
    const hoyLunes=lunesDe(Rutina.localTrainingDate(new Date())),conCopia=Object.keys(loadDatedWeeks()).filter(k=>k<=hoyLunes).sort();
    elegirSemanaFechada(conCopia.length?conCopia.at(-1):hoyLunes)
  }
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
  if(d.planDia)return Semana.elegirDiaPlan(d.planDia);
  if(d.hueco){
    const [dia,slot]=d.hueco.split("|");return abrirHueco(dia,slot)
  }
  if(d.huecoCambiar){
    const [dia,slot]=d.huecoCambiar.split("|");return abrirSelector(dia,slot)
  }
  if(d.huecoReceta){
    huecoAbierto=null;hoja.cerrar();return Comidas.abrirComida("plato",d.huecoReceta)
  }
  if(d.selectorId)return Selector.elegirEnSelector(h=>Selector.asignarHueco(h.dia,h.slot,d.selectorId));
  if(d.selectorReceta)return Selector.elegirEnSelector(h=>asignarRecetaAlPlan(d.selectorReceta,h.dia,h.slot,false));
  if(d.selectorIdea)return Selector.elegirEnSelector(h=>{
    const idea=IdeasHoja.ideaPorTexto(d.selectorIdea);if(!idea)throw Error("La idea ya no está disponible.");Selector.asignarIdeaAlHueco(h,idea)
  });
  if(d.selectorSugerir!==undefined)return Selector.sugerirEnSelector();
  if(d.sugerimeComida)return abrirSugerime(d.sugerimeComida);
  if(d.sugerimeOtra!==undefined){
    if(huecoAbierto&&huecoAbierto.sugerime)proponerEnSugerime(huecoAbierto,false);return
  }
  if(d.sugerimeVer!==undefined)return Selector.verSugerencia();
  if(d.selectorUsar!==undefined)return Selector.elegirEnSelector(h=>{
    const s=h.sugerencia;if(!s)throw Error("Pedí una sugerencia.");if(s.tipo==="idea")Selector.asignarIdeaAlHueco(h,s.idea);else Selector.asignarHueco(h.dia,h.slot,s.item.id)
  });
  if(d.planMenu!==undefined)return Selector.abrirMenuSemana();
  if(d.compartirSemanaMenu!==undefined){
    const l=ce("div","menu-semana");
    l.append(botonHoja("Como texto","button--soft",{compartirSemana:"texto"}),botonHoja("Como imagen","button--soft",{compartirSemana:"imagen"}),botonHoja("Descargar HTML","button--soft",{compartirSemana:"html"}));
    hoja.abrir({titulo:"Compartir la semana",contenido:[l],botones:[],foco:false});
    return
  }
  if(d.compartirSemana){hoja.cerrar();if(d.compartirSemana==="html")SemanasFechadas.downloadWeeklyPlan();else Compartir.compartirSemana(d.compartirSemana);return}
  if(d.planesGuardados!==undefined)return Selector.abrirPlanesGuardados();
  if(d.planUsar){hoja.cerrar();return Semana.usarPlanGuardado(d.planUsar)}
  if(d.planBorrar){if(Semana.deleteVariation(d.planBorrar)){Selector.abrirPlanesGuardados();if(typeof renderDatedWeek==="function")renderDatedWeek();const pl=document.querySelector("#plan [data-planes-guardados]");if(pl)pl.hidden=!Object.keys(Semana.loadVars()).length}return}
  if(d.recordatorioMenu!==undefined){
    const c=ce("div","recordatorio"),dia=ce("select"),hora=ce("input"),ok=botonHoja("Agregar al calendario","button--primary",{recordatorioAgregar:""});
    dia.id="recordatorioDia";
    for(const [v,t] of [["SU","Domingo"],["MO","Lunes"],["TU","Martes"],["WE","Miércoles"],["TH","Jueves"],["FR","Viernes"],["SA","Sábado"]])dia.append(new Option(t,v));
    dia.value="SU";
    hora.type="time";
    hora.id="recordatorioHora";
    hora.value="18:00";
    const campo=(texto,el)=>{const f=ce("div","portion-field"),l=ce("label",null,texto);l.htmlFor=el.id;f.append(l,el);return f};
    c.append(ce("p","screen__hint","Un aviso semanal en tu calendario para armar la semana que viene."),campo("Día",dia),campo("Hora",hora),ok);
    hoja.abrir({titulo:"Recordarme armar la semana",contenido:[c],botones:[],foco:false});
    return
  }
  if(d.recordatorioAgregar!==undefined){
    const dia=document.getElementById("recordatorioDia"),hora=document.getElementById("recordatorioHora");
    hoja.cerrar();
    Compartir.compartirRecordatorio(dia?dia.value:"SU",hora?hora.value:"18:00");
    return
  }
  if(d.planHerr)return abrirHerramientaPlan(d.planHerr);
  if(d.planRepetirAnterior!==undefined)return Selector.repetirSemanaAnterior();
  if(d.planCopiarDia!==undefined)return Selector.abrirCopiarDia();
  if(d.copiarA){
    b.setAttribute("aria-pressed",String(b.getAttribute("aria-pressed")!=="true"));return
  }
  if(d.copiarConfirmar){
    try{
      Semana.copiarDiaDelPlan(d.copiarConfirmar,[...hoja.elemento.querySelectorAll('[data-copiar-a][aria-pressed="true"]')].map(x=>x.dataset.copiarA));hoja.cerrar()
    }catch(err){
      hoja.estado.textContent=err.message
    }
    return
  }
  if(d.planDeshacer!==undefined)return Semana.deshacerCambioDelPlan();
  if(d.planRepetir!==undefined)return Semana.repetirPlanEstaSemana();
  if(d.planDeCero!==undefined)return Semana.empezarSemanaDeCero()
});
