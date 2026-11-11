// Mi Plato Fácil · Hoy: las comidas de hoy según el plan de la semana (desde la v15.2, con el Selector de comida).
// Parte 32: los archivos se unen en orden según su número, que define el orden de arranque.
// "Lo comí" usa el mismo registro que el plan (se ve en Más → Registro): no cambia el plan ni las compras.
// renderToday corre durante el arranque (la pestaña recordada la pinta antes de que carguen 36 a 38): por eso todo
// lo que lee son funciones o var; la hoja, el Selector y las sugerencias se usan recién al tocar.
// El tipo de día lo dice el chip de entrenamiento: la línea de ayuda queda vacía.
// Último "Lo comí" registrado desde Hoy, para poder deshacerlo.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Hoy.nombre().
var Hoy={
todayHint(){
  return ""
},
cambiarEntrenamientoDeHoy(valor){
  const key=Rutina.localTrainingDate(new Date()),antes=localStorage.getItem(TRAINING_EXCEPTIONS_KEY);
  let o={};
  if(antes!==null){
    try{
      o=JSON.parse(antes)
    }catch(e){
      o=null
    }
    if(!o||typeof o!=="object"||Array.isArray(o))throw Error("No se pudieron leer tus días de entrenamiento. Revisalos en Más → Días de entrenamiento.")
  }
  const semana=Rutina.loadTrainingWeek(),rutina=semana?semana.days.includes(new Date().getDay()):null;
  if(rutina===valor)delete o[key];else o[key]=valor;
  const texto=JSON.stringify(o);
  try{
    if(antes===null&&!Object.keys(o).length)localStorage.removeItem(TRAINING_EXCEPTIONS_KEY);else localStorage.setItem(TRAINING_EXCEPTIONS_KEY,texto)
  }catch(e){
    try{
      if(antes===null)localStorage.removeItem(TRAINING_EXCEPTIONS_KEY);else localStorage.setItem(TRAINING_EXCEPTIONS_KEY,antes)
    }catch(e2){
    }
    throw Error("No se pudo guardar. Hoy sigue igual.")
  }
  return {
    key,antes,despues:localStorage.getItem(TRAINING_EXCEPTIONS_KEY)
  }
},
deshacerEntrenamientoDeHoy(u){
  if(localStorage.getItem(TRAINING_EXCEPTIONS_KEY)!==u.despues)throw Error("No se puede deshacer: tus días de entrenamiento cambiaron después.");
  try{
    if(u.antes===null)localStorage.removeItem(TRAINING_EXCEPTIONS_KEY);else localStorage.setItem(TRAINING_EXCEPTIONS_KEY,u.antes)
  }catch(e){
    throw Error("No se pudo deshacer.")
  }
},
avisoHoy(texto,undoAttr){
  const st=document.getElementById("todayStatus");
  if(!st)return;
  st.replaceChildren(document.createTextNode(texto));
  if(undoAttr){
    const u=ce("button","filter-chip","Deshacer");
    u.type="button";
    u.dataset[undoAttr]="";
    st.append(" ",u)
  }
},
aplicarEntrenoHoy(valor){
  try{
    hoyEntrenoUndo=Hoy.cambiarEntrenamientoDeHoy(valor);
    renderToday();
    Hoy.avisoHoy(valor?"Hoy entrenás.":"Hoy descansás.","hoyEntrenoDeshacer");
    try{
      Rutina.renderTrainingExceptions()
    }catch(e){
    }
  }catch(err){
    Hoy.avisoHoy(err.message)
  }
},
abrirEntrenoHoy(){
  const caja=ce("div","hueco-hoja__acciones"),si=ce("button","button button--primary","Sí, entreno"),no=ce("button","button button--soft","No, descanso"),rutina=ce("button","button button--soft","Configurar mi rutina");
  for(const b of [si,no,rutina])b.type="button";
  si.dataset.hoyEntrenoValor="si";
  no.dataset.hoyEntrenoValor="no";
  rutina.dataset.openTraining="";
  caja.append(si,no,rutina);
  hoja.abrir({
    titulo:"¿Entrenás hoy?",contenido:[ce("p","screen__hint","Así las ideas y el armado de hoy saben qué tipo de día es."),caja],botones:[],foco:false
  })
}
};
var todayUndoId=null;
// Último cambio del tipo de día hecho con el chip, para poder deshacerlo.
var hoyEntrenoUndo=null;
// El último Deshacer del plan que se mostró en Hoy.
var hoyAvisoPlan=null;
var HOY_COMIDAS=["desayuno","almuerzo","merienda","cena"];
function diaSiguienteDelPlan(dia){
  const i=DAYS.findIndex(d=>d[0]===dia);
  return DAYS[(i+1)%7][0]
}
// Primera vez: sin comidas guardadas y sin nada para hoy, una línea con el método del plato y el primer paso.
function esPrimeraVez(plan,day){
  return !MisPlatos.loadSaved().length&&!HOY_COMIDAS.some(s=>plan[day]&&plan[day][s])
}
function filaHoy(day,slot,plan,byId,esHoy,primera){
  const label=SLOTS.find(s=>s[0]===slot)[1],name=Semana.planSlotName(slot),id=plan[day]&&plan[day][slot],it=id?byId.get(id):null,row=ce("div","today-row"+(it?"":" today-row--vacia"));
  row.dataset.todaySlot=slot;
  const plato=ce("span","today-row__plate"+(it?"":" is-empty"),it?nombreCortoDeComida(it):"Sin elegir");
  // El botón de acción va primero (es el principal de la fila); el nombre, al lado, abre las opciones del hueco.
  let action=null;
  if(!it){
    action=ce("button","button "+(primera&&slot==="almuerzo"?"button--primary":"button--soft"),"Elegir");
    action.type="button";
    if(esHoy)action.dataset.todayChoose=slot;else action.dataset.huecoHoy=day+"|"+slot;
    action.setAttribute("aria-label","Elegir "+Semana.nombreDelHueco(day,slot).toLowerCase())
  }else if(esHoy&&eatenToday(it,slot))action=ce("span","today-row__done","✓ Lo comí");
  else if(esHoy){
    action=ce("button","button button--soft","Lo comí");
    action.type="button";
    action.dataset.planEaten=day+"|"+slot;
    // Marca de Hoy: el manejador del plan repinta Hoy antes que el de acá, y el botón ya no está en #todayPanel.
    action.dataset.todayEaten="";
    action.setAttribute("aria-label","Lo comí: "+mealName(it)+" ("+name+")")
  }
  if(action)row.append(action);
  if(it){
    const b=ce("button","today-row__nombre");
    b.type="button";
    b.dataset.huecoHoy=day+"|"+slot;
    b.setAttribute("aria-label",Semana.nombreDelHueco(day,slot)+": "+mealName(it)+". Cambiar, quitar y más");
    b.append(ce("span","today-row__slot",label),plato);
    row.append(b)
  }else row.append(ce("span","today-row__slot",label),plato);
  return row
}
function renderEntrenoHoy(){
  const box=document.getElementById("todayEntreno");
  if(!box)return;
  let t=null;
  try{
    t=Rutina.trainingDayForDate(new Date())
  }catch(e){
  }
  const b=ce("button","filter-chip today__chip");
  b.type="button";
  b.dataset.hoyEntreno=t===null?"elegir":"cambiar";
  b.append(ce("span",null,t===true?"🏋️ Hoy entrenás":t===false?"😌 Hoy descansás":"🏋️ ¿Entrenás hoy?"),ce("span","today__chip-accion"," · "+(t===null?"elegir":"cambiar")));
  b.setAttribute("aria-label",t===null?"¿Entrenás hoy? Elegir":(t?"Hoy entrenás":"Hoy descansás")+". Cambiar solo por hoy");
  box.replaceChildren(b)
}
// Etapa 31: "Hoy ≈ $9.020 · Plato completo: verduras, almidón, proteína y fruta" o "Hoy ≈ $6.300 · Te falta: fruta". Sin comidas planificadas para
// hoy, no hay línea; con los precios apagados, no se muestra el costo.
var HOY_GRUPOS=[["verduras","verduras"],["almidones","almidón"],["proteinas","proteína"],["fruta","fruta"]];
function textoCostoHoy(day,plan,byId){
  const items=["desayuno","merienda","almuerzo","cena"].map(s=>plan[day]&&plan[day][s]?byId.get(plan[day][s]):null).filter(Boolean);
  if(!items.length)return "";
  const partes=[];
  try{
    if(preciosActivos()&&preciosDataset()){
      const c=costoDelDiaPlan(day);
      if(c>0)partes.push("Hoy "+formatoPesos(c))
    }
  }catch(e){
  }
  try{
    const tiene=new Set();
    for(const it of items)for(const g of plateGroups(it))tiene.add(g);
    const faltan=HOY_GRUPOS.filter(([k])=>!tiene.has(k)).map(x=>x[1]);
    partes.push(faltan.length?"Te falta: "+(faltan.length>1?faltan.slice(0,-1).join(", ")+" y "+faltan.at(-1):faltan[0]):"Plato completo: verduras, almidón, proteína y fruta")
  }catch(e){
  }
  return partes.join(" · ")
}
function renderToday(){
  const box=document.getElementById("todayRows");
  if(!box)return;
  const day=todayPlanDay(),plan=loadPlan(),byId=new Map(MisPlatos.loadSaved().map(p=>[p.id,p])),primera=esPrimeraVez(plan,day);
  renderEntrenoHoy();
  const tc=document.getElementById("todayCosto");
  if(tc){
    const txt=textoCostoHoy(day,plan,byId);
    tc.textContent=txt;
    tc.hidden=!txt
  }
  const pv=document.getElementById("todayPrimera");
  if(pv){
    pv.hidden=!primera;
    pv.textContent=primera?"Medio plato de verduras, un cuarto de almidones y un cuarto de proteínas. Empezá eligiendo tu almuerzo.":""
  }
  // En el orden del día (el plan las guarda como desayuno, merienda, almuerzo, cena).
  box.replaceChildren(...HOY_COMIDAS.map(slot=>filaHoy(day,slot,plan,byId,true,primera)));
  const manana=diaSiguienteDelPlan(day),mt=document.getElementById("todayMananaTitulo"),mr=document.getElementById("todayMananaRows");
  if(mt)mt.textContent="Mañana · "+Semana.planDayName(manana).toLowerCase();
  if(mr)mr.replaceChildren(...HOY_COMIDAS.map(slot=>filaHoy(manana,slot,plan,byId,false,false)));
  // Deshacer de un cambio del plan hecho desde Hoy (asignar, cambiar o quitar): se muestra una vez por cambio y se va
  // cuando el Deshacer deja de valer (otra escritura del plan).
  const st=document.getElementById("todayStatus");
  if(!st)return;
  const vale=deshacerPlan&&deshacerPlan.tab==="hoy"?deshacerPlan:null;
  if(vale&&vale!==hoyAvisoPlan){
    hoyAvisoPlan=vale;
    const u=ce("button","filter-chip","Deshacer");
    u.type="button";
    u.dataset.planDeshacer="";
    st.replaceChildren(document.createTextNode(vale.texto+". "),u)
  }else if(!vale&&st.querySelector("[data-plan-deshacer]"))st.replaceChildren()
}
// El chip cambia el tipo de día solo por hoy: escribe la excepción de hoy en miPlatoFacil_trainingExceptions (el
// mismo formato que Días de entrenamiento) partiendo del texto guardado, así no se pierde ninguna otra entrada. Si el
// valor nuevo es el de la rutina, quita la excepción de hoy en vez de guardar una de más.
// Deshacer: solo si nada cambió después; lo único distinto entre antes y después es la entrada de hoy.
// Sin rutina ni excepción: Sí o No guardan la excepción de hoy, y se puede ir a configurar la rutina.
document.addEventListener("click",e=>{
  const b=e.target.closest("button");
  if(!b)return;
  if(b.dataset.planEaten&&b.dataset.todayEaten!==undefined){
    // El registro lo hace el manejador del plan (24-consumo-y-habitos.js), que corre antes que este.
    const slot=b.dataset.planEaten.split("|")[1],status=document.getElementById("todayStatus"),plan=loadPlan(),id=plan[todayPlanDay()]&&plan[todayPlanDay()][slot],it=id?MisPlatos.loadSaved().find(p=>p.id===id):null,today=Rutina.localTrainingDate(new Date());
    renderToday();
    const rec=it?loadConsumption().filter(x=>x.date===today&&x.meal===slot&&x.sourceId===it.id).at(-1):null;
    if(!rec){
      status.textContent="No se pudo registrar. Probá desde Más → Registro.";
      return
    }
    todayUndoId=rec.id;
    const undo=ce("button","filter-chip","Deshacer");
    undo.type="button";
    undo.dataset.todayUndo="";
    status.replaceChildren(document.createTextNode("Anotado en tu registro ("+Semana.planSlotName(slot)+"). El plan no cambió. "),undo);
    return
  }
  if(b.dataset.todayUndo!==undefined&&todayUndoId){
    const status=document.getElementById("todayStatus");
    try{
      // Si ese registro ya no está (por ejemplo, se quitó en el Registro), no se reescribe nada.
      const a=loadConsumption();
      if(!a.some(x=>x.id===todayUndoId)){
        todayUndoId=null;
        status.textContent="No se puede deshacer: ese registro ya no está.";
        return
      }
      saveConsumption(a.filter(x=>x.id!==todayUndoId));
      todayUndoId=null;
      renderToday();
      renderPlan();
      if(document.getElementById("consumptionPanel").open)renderConsumption();
      if(stack.at(-1)==="registro")renderRegistro();
      status.textContent="Listo, se deshizo."
    }catch(err){
      status.textContent=err.message
    }
    return
  }
  if(b.dataset.planDeshacer!==undefined&&b.closest("#todayStatus")){
    // Deshacer un cambio del plan hecho desde Hoy: el mismo de la Semana, con el aviso acá.
    e.stopImmediatePropagation();
    const st=document.getElementById("todayStatus");
    st.replaceChildren();
    Semana.deshacerCambioDelPlan();
    st.textContent=deshacerPlan===null&&!errorDelPlan?"Listo, se deshizo.":errorDelPlan||"No se pudo deshacer.";
    return
  }
  if(b.dataset.todayChoose){
    // Abre el Selector de esa comida sobre Hoy: elegir asigna ahí mismo.
    abrirSelector(todayPlanDay(),b.dataset.todayChoose);
    return
  }
  if(b.dataset.huecoHoy){
    const [dia,slot]=b.dataset.huecoHoy.split("|");
    abrirHueco(dia,slot);
    return
  }
  if(b.dataset.hoyEntreno){
    if(b.dataset.hoyEntreno==="elegir")return Hoy.abrirEntrenoHoy();
    let t=null;
    try{
      t=Rutina.trainingDayForDate(new Date())
    }catch(err){
    }
    if(t!==null)Hoy.aplicarEntrenoHoy(!t);
    return
  }
  if(b.dataset.hoyEntrenoValor){
    hoja.cerrar();
    Hoy.aplicarEntrenoHoy(b.dataset.hoyEntrenoValor==="si");
    return
  }
  if(b.dataset.hoyEntrenoDeshacer!==undefined&&hoyEntrenoUndo){
    const u=hoyEntrenoUndo;
    hoyEntrenoUndo=null;
    try{
      Hoy.deshacerEntrenamientoDeHoy(u);
      renderToday();
      Hoy.avisoHoy("Listo, se deshizo.");
      try{
        Rutina.renderTrainingExceptions()
      }catch(err){
      }
    }catch(err){
      renderToday();
      Hoy.avisoHoy(err.message)
    }
    return
  }
  if(b.dataset.sugerime!==undefined)return abrirSugerime()
});
