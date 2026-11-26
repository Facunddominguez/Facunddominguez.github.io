// Mi Plato Fácil · Registro (v15.5): un solo lugar para ver y corregir lo registrado, día por día.
// Parte 43: los archivos se unen en orden según su número, que define el orden de arranque.
// Junta "Lo comí" (miPlatoFacil_consumption_v1) y lo que antes se llamaba "Lo cociné" (miPlatoFacil_cookingHistory_v1; desde la v19.6 también se muestra como "Lo comí") sin cambiar su formato,
// y muestra aparte el contador "cooked" de cada plato, que no tiene fecha. Nada se combina ni se borra solo.
// init() corre antes de este archivo: todo lo que se llama al pintar es una declaración function y el estado va en var.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Registro.nombre().
var Registro={
deshacerRegistro(n,el){
  const u=registroUndos[n];
  delete registroUndos[n];
  const aviso=(el&&el.isConnected?el:u&&u.el)||document.getElementById("registroEstado");
  if(!u||JSON.stringify(registroFoto())!==JSON.stringify(u.despues)){
    if(aviso)aviso.textContent="No se puede deshacer: los datos cambiaron después.";
    return
  }
  try{
    for(const [k,v] of Object.entries(u.antes)){
      if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)
    }
  }catch(e){
    u.el.textContent="No se pudo deshacer.";
    return
  }
  registroRepintar();
  u.el.textContent="Listo, se deshizo."
},
// v19.6 (R5-R07 a R10): gráficos de barras sin librerías y gasto semanal corregible.
guardarGastoSemanal(lunes,monto){
  const todos=loadGastoSemanal();
  todos[lunes]=monto;
  localStorage.setItem(GASTO_SEMANAL_KEY,JSON.stringify(todos))
},
quitarGastoSemanal(lunes){
  const todos=loadGastoSemanal();
  delete todos[lunes];
  if(Object.keys(todos).length)localStorage.setItem(GASTO_SEMANAL_KEY,JSON.stringify(todos));else localStorage.removeItem(GASTO_SEMANAL_KEY)
},
// Presupuesto contra gasto real de las 4 semanas que terminan en la que se ve. El gasto sale de Compras realizadas (compras de esa semana
// en la moneda del presupuesto) y se puede corregir por semana (miPlatoFacil_gastoSemanal_v1).
graficoGastoSemanal(lunes){
  const budget=typeof shoppingBudgetRead==="function"?shoppingBudgetRead():null,moneda=budget?budget.currency:"ARS",corr=loadGastoSemanal(),
    fmt=n=>(moneda==="USD"?"US$":"$")+Math.round(n).toLocaleString("es-AR"),
    semanal=budget?(budget.period==="mes"?budget.limit*7/30:budget.limit):null,
    semanas=[3,2,1,0].map(i=>{const d=new Date(lunes+"T12:00:00");d.setDate(d.getDate()-7*i);return Rutina.localTrainingDate(d)}),filas=[];
  let hayGasto=false;
  for(const w of semanas){
    const g=gastoDeLaSemana(w,moneda),corregido=Object.prototype.hasOwnProperty.call(corr,w),monto=corregido?corr[w]:g,etiqueta=typedAppDateLabel(w).slice(0,5);
    if(monto>0)hayGasto=true;
    if(semanal!==null)filas.push({rotulo:etiqueta+" · Presupuesto",valor:semanal,clase:"presupuesto"});
    filas.push({rotulo:etiqueta+" · Gasto"+(corregido?" ✎":""),valor:monto,clase:semanal!==null&&monto>semanal?"fuera":"total"})
  }
  const caja=ce("div","grafico-gasto"),grafico=graficoBarras("Presupuesto y gasto · últimas 4 semanas",filas,{id:"graficoGasto",formato:fmt});
  caja.append(grafico);
  if(semanal===null)caja.append(ce("p","screen__hint","Sin presupuesto cargado: poné uno en Preferencias para compararlo con el gasto."));
  else if(!hayGasto)caja.append(ce("p","screen__hint","Todavía no hay compras registradas en estas semanas. Cargalas en Compras realizadas o escribí el gasto acá abajo."));
  // Etapa 48 (R6-F-02): lo gastado en comidas afuera esa semana, aparte de las compras (no se suma al gasto de arriba).
  {
    const af=SemanaAjustes.resumenAfuera(lunes);
    if(af.cantidad)caja.append(ce("p","screen__hint registro-afuera","Comidas afuera esa semana: "+af.cantidad+(af.total>0?" · "+pesosCortos(af.total):" · sin gasto anotado")+(af.total>0&&af.sinGasto?" (en "+af.sinGasto+" no lo anotaste)":"")+". Va aparte de las compras."))
  }
    const actual=corr[lunes]!==undefined?corr[lunes]:gastoDeLaSemana(lunes,moneda),campo=ce("div","portion-field"),etiqueta=ce("label",null,"Gasto de la semana del "+typedAppDateLabel(lunes).slice(0,5)+" ("+(moneda==="USD"?"US$":"$")+")"),inp=ce("input"),
    guardar=ce("button","button button--soft","Guardar gasto"),estado=ce("p","screen__hint");
  inp.id="gastoSemanaMonto";inp.type="text";inp.inputMode="decimal";inp.value=actual?String(Math.round(actual*100)/100).replace(".",","):"";
  etiqueta.htmlFor="gastoSemanaMonto";
  guardar.type="button";guardar.dataset.gastoGuardar=lunes;
  estado.id="gastoSemanaEstado";estado.setAttribute("aria-live","polite");
  campo.append(etiqueta,inp);
  caja.append(campo,guardar);
  if(corr[lunes]!==undefined){
    const quitar=ce("button","button button--soft","Usar lo de Compras");
    quitar.type="button";quitar.dataset.gastoQuitar=lunes;
    caja.append(quitar)
  }
  caja.append(estado);
  return caja
},
restarContador(id){
  const a=MisPlatos.loadSaved(),it=a.find(x=>x.id===id),st=document.getElementById("registroEstado");
  if(!it||!((it.cooked||0)>0))return;
  it.cooked=it.cooked-1;
  if(!MisPlatos.persistSaved(a)){
    st.textContent="No se pudo guardar el cambio.";
    return
  }
  registroRepintar();
  st.textContent="Restaste una vez a "+mealName(it)+"."
}
};
var registroFecha=null;
// Cada chip Deshacer tiene su propia foto (por número): un chip viejo nunca deshace una acción más nueva.
var registroUndos={
};
var registroUndoN=0;
var REGISTRO_COMIDAS=["desayuno","almuerzo","merienda","cena","otra"];
function registroHoy(){
  return Rutina.localTrainingDate(new Date())
}
function registroClaves(){
  return [CONSUMPTION_KEY,COOKING_HISTORY_KEY,SKEY]
}
function registroFoto(){
  return Object.fromEntries(registroClaves().map(k=>[k,localStorage.getItem(k)]))
}
// Aviso con Deshacer: vuelve las tres claves a como estaban (o las borra si no existían), si nada cambió después.
function registroAviso(el,texto,antes){
  if(!el)return;
  const n=String(++registroUndoN);
  registroUndos[n]={
    antes,despues:registroFoto(),el
  };
  const b=ce("button","filter-chip","Deshacer");
  b.type="button";
  b.dataset.registroDeshacer=n;
  el.replaceChildren(document.createTextNode(texto+" "),b)
}
// Solo deshace si los datos siguen exactamente como los dejó esa acción; si no, no toca nada y avisa.
// Después de cambiar un registro, se actualiza todo lo que lo muestra.
function registroRepintar(){
  for(const f of [()=>renderToday(),()=>renderPlan(),()=>renderSaved(),()=>renderConsumption(),()=>refrescarDetalleComida(),()=>{
    if(stack.at(-1)==="registro")renderRegistro()
  }]){
    try{
      f()
    }catch(e){
    }
  }
}
// Quita un solo registro por su id. No toca la despensa ni el contador.
// Lo comí: si lo guardado no se puede leer, no se encuentra el id y no se escribe nada.
// Lo cociné: se filtra el arreglo crudo, así los registros que no se muestran quedan como estaban.
function quitarRegistro(tipo,id){
  const antes=registroFoto();
  if(tipo==="comi"){
    const a=loadConsumption();
    if(!a.some(x=>x.id===id))throw Error("Ese registro ya no está.");
    saveConsumption(a.filter(x=>x.id!==id))
  }else{
    let a=null;
    try{
      a=JSON.parse(localStorage.getItem(COOKING_HISTORY_KEY)||"[]")
    }catch(e){
    }
    if(!Array.isArray(a)||!a.some(x=>x&&x.id===id))throw Error("Ese registro ya no está.");
    try{
      localStorage.setItem(COOKING_HISTORY_KEY,JSON.stringify(a.filter(x=>!(x&&x.id===id))))
    }catch(e){
      throw Error("No se pudo guardar el cambio.")
    }
  }
  return antes
}
function registroNombreComida(m){
  const t=String(m||"").trim();
  return t?t.charAt(0).toUpperCase()+t.slice(1):"Otra"
}
function registroOrden(m){
  const i=REGISTRO_COMIDAS.indexOf(normalizeSearchText(String(m||"")).trim());
  return i<0?REGISTRO_COMIDAS.length:i
}
// Los registros de un día, en orden de comida. Solo lee.
function registrosDelDia(fecha){
  // Lo comí guarda el título viejo del plato (savedItemTitle): al mostrarlo se usa el nombre de hoy, si el plato sigue.
  const filas=[],porId=new Map(MisPlatos.loadSaved().map(p=>[p.id,p]));
  for(const x of loadConsumption())if(x.date===fecha)filas.push({
    tipo:"comi",id:x.id,meal:x.meal,title:x.sourceId&&porId.has(x.sourceId)?mealName(porId.get(x.sourceId)):x.title,planned:x.planned,sourceId:x.sourceId
  });
  for(const x of loadCookingHistory())if(x.date===fecha)filas.push({
    tipo:"cocine",id:x.id,meal:x.meal,title:x.title,lines:x.lines,sourceId:x.sourceId||null
  });
  return filas.map((f,i)=>({
    f,i
  })).sort((a,b)=>registroOrden(a.f.meal)-registroOrden(b.f.meal)||a.i-b.i).map(x=>x.f)
}
// Los últimos 14 días que tienen algo, del más nuevo al más viejo, con su cantidad.
function registroDiasConDatos(){
  const n=new Map();
  for(const x of loadConsumption())n.set(x.date,(n.get(x.date)||0)+1);
  for(const x of loadCookingHistory())n.set(x.date,(n.get(x.date)||0)+1);
  return [...n.entries()].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,14)
}
function registroEtiquetaDia(f){
  const d=new Date(f+"T12:00:00"),ayer=new Date();
  ayer.setDate(ayer.getDate()-1);
  const t=d.toLocaleDateString("es-AR",{
    weekday:"long",day:"numeric",month:"long"
  });
  if(f===registroHoy())return "Hoy · "+t;
  if(f===Rutina.localTrainingDate(ayer))return "Ayer · "+t;
  return t.charAt(0).toUpperCase()+t.slice(1)
}
function registroFila(r){
  const fila=ce("div","registro-fila");
  fila.dataset.registroTipo=r.tipo;
  fila.dataset.registroId=r.id;
  const texto="🍽️ Lo comí · "+registroNombreComida(r.meal)+" · "+r.title+(r.tipo==="comi"&&r.planned?" (del plan)":"");
  fila.append(ce("span","registro-fila__texto",texto));
  const b=ce("button","button button--danger registro-fila__quitar","Quitar");
  b.type="button";
  b.dataset.registroQuitar=r.tipo+"|"+r.id;
  b.setAttribute("aria-label","Quitar: "+texto);
  fila.append(b);
  return fila
}
// "Veces que comiste cada comida": el contador de siempre (lo anotado antes de que hubiera fecha y lo que antes se llamaba "Lo cociné") más
// los "Lo comí" con fecha de cada comida.
function renderRegistroContadores(){
  const box=document.getElementById("registroContadoresLista");
  if(!box)return;
  const consumo=loadConsumption(),filas=[];
  for(const p of MisPlatos.loadSaved()){
    const hechas=consumo.filter(x=>x.sourceId===p.id).length,veces=(p.cooked||0)+hechas;
    if(!veces)continue;
    const fila=ce("div","registro-fila");
    fila.dataset.registroContador=p.id;
    fila.dataset.veces=String(veces);
    fila.append(ce("span","registro-fila__texto",mealName(p)+" · "+veces+" ve"+(veces===1?"z":"ces")));
    if((p.cooked||0)>0){
      const b=ce("button","button button--soft registro-fila__quitar","−1");
      b.type="button";
      b.dataset.registroRestar=p.id;
      b.setAttribute("aria-label","Restar una vez a "+mealName(p));
      fila.append(b)
    }
    filas.push(fila)
  }
  box.replaceChildren(...filas);
  if(!filas.length)box.append(ce("p","screen__hint","Todavía no anotaste ninguna comida."))
}
function renderRegistro(){
  const hoy=registroHoy();
  if(!registroFecha||registroFecha>hoy)registroFecha=hoy;
  const sec=document.getElementById("registro");
  if(!sec)return;
  try{
    sec.querySelector(".screen__kicker").textContent=TABS[activeTab].label
  }catch(e){
  }
  document.getElementById("registroFecha").textContent=registroEtiquetaDia(registroFecha);
  const sig=sec.querySelector('[data-registro-dia="1"]');
  sig.disabled=registroFecha>=hoy;
  const filas=registrosDelDia(registroFecha),lista=document.getElementById("registroLista");
  lista.replaceChildren(...filas.map(registroFila));
  if(!filas.length)lista.append(ce("p","screen__hint registro-vacio","Nada registrado este día."));
  const dias=document.getElementById("registroDias");
  dias.replaceChildren(...registroDiasConDatos().map(([f,n])=>{
    const b=ce("button","filter-chip",typedAppDateLabel(f).slice(0,5)+" · "+n);
    b.type="button";
    b.dataset.registroIr=f;
    b.setAttribute("aria-pressed",String(f===registroFecha));
    b.setAttribute("aria-label",registroEtiquetaDia(f)+": "+n+" registro"+(n===1?"":"s"));
    return b
  }));
  renderRegistroContadores();
  try{renderConsumption()}catch(e){}
}
// La única entrada: Más, Hoy, Semana ⋯ y el detalle de una comida.
function abrirRegistro(op){
  op=op||{
  };
  const hoy=registroHoy();
  registroFecha=op.fecha&&Rutina.validTrainingDate(op.fecha)&&op.fecha<=hoy?op.fecha:hoy;
  try{
    if(hoja.abierta())hoja.cerrar()
  }catch(e){
  }
  go("registro");
  if(op.abrir==="comi"){
    renderConsumption();
    const p=document.getElementById("consumptionPanel");
    if(p&&p.scrollIntoView)p.scrollIntoView({block:"start"})
  }
}
// El último día con un registro de esa comida (y, en las recetas, de sus copias del plan).
function registroUltimaFecha(ids){
  const set=new Set(ids);
  let f="";
  for(const x of loadConsumption())if(x.sourceId&&set.has(x.sourceId)&&x.date>f)f=x.date;
  for(const x of loadCookingHistory())if(x.sourceId&&set.has(x.sourceId)&&x.date>f)f=x.date;
  return f
}
function pintarEnlaceRegistro(){
  const box=document.getElementById("comidaRegistro");
  if(!box)return;
  box.replaceChildren();
  if(typeof comidaActual==="undefined"||!comidaActual)return;
  const saved=MisPlatos.loadSaved(),ids=[comidaActual.id];
  if(comidaActual.origen==="receta")saved.forEach(p=>{
    if(p.recipeSourceId===comidaActual.id)ids.push(p.id)
  });
  else{
    const it=saved.find(p=>p.id===comidaActual.id);
    if(it&&it.recipeSourceId)ids.push(it.recipeSourceId)
  }
  const f=registroUltimaFecha(ids),b=ce("button","button button--soft","📒 Ver en el registro"+(f?" (último: "+typedAppDateLabel(f).slice(0,5)+")":""));
  b.type="button";
  b.dataset.openRegistro="";
  if(f)b.dataset.registroFecha=f;
  box.append(b)
}
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b)return;
  const d=b.dataset;
  if(d.openRegistro!==undefined)return abrirRegistro({
    fecha:d.registroFecha
  });
  if(d.registroDeshacer!==undefined)return Registro.deshacerRegistro(d.registroDeshacer,b.parentElement);
  if(stack.at(-1)!=="registro")return;
  const st=document.getElementById("registroEstado");
  if(d.registroDia){
    const f=new Date((registroFecha||registroHoy())+"T12:00:00");
    f.setDate(f.getDate()+Number(d.registroDia));
    const nueva=Rutina.localTrainingDate(f);
    if(nueva<=registroHoy())registroFecha=nueva;
    renderRegistro();
    return
  }
  if(d.registroIr){
    registroFecha=d.registroIr;
    renderRegistro();
    return
  }
  if(d.gastoGuardar){
    const est=document.getElementById("gastoSemanaEstado"),t=document.getElementById("gastoSemanaMonto").value.trim(),n=Number(t.replace(/\./g,"").replace(",","."));
    if(!t||!Number.isFinite(n)||n<0||n>100000000000){est.textContent="Escribí el gasto con números (por ejemplo, 45000).";return}
    try{
      Registro.guardarGastoSemanal(d.gastoGuardar,n);
      consumptionWeek=d.gastoGuardar;renderConsumption();
      document.getElementById("gastoSemanaEstado").textContent="Guardé el gasto de esa semana."
    }catch(err){
      est.textContent="No se pudo guardar (falta de espacio u otro error)."
    }
    return
  }
  if(d.gastoQuitar){
    try{
      Registro.quitarGastoSemanal(d.gastoQuitar);
      consumptionWeek=d.gastoQuitar;renderConsumption();
      document.getElementById("gastoSemanaEstado").textContent="Volvió al total de Compras realizadas."
    }catch(err){
      document.getElementById("gastoSemanaEstado").textContent="No se pudo guardar el cambio."
    }
    return
  }
  if(d.registroRestar)return Registro.restarContador(d.registroRestar);
  if(d.registroQuitar){
    const [tipo,id]=d.registroQuitar.split("|"),fila=b.closest(".registro-fila"),texto=fila?fila.querySelector(".registro-fila__texto").textContent:"";
    try{
      quitarRegistro(tipo,id);
      registroRepintar();
      // Desde la v19.6 (R5-R05) el Registro no ofrece Deshacer.
      st.textContent="Quitaste: "+texto+"."+(tipo==="cocine"?" La despensa no cambia.":"")
    }catch(err){
      st.textContent=err.message
    }
  }
});

// Gráfico de barras horizontales sin librerías: cada barra lleva su rótulo y su número. filas: [{rotulo,valor,clase,meta}];
// opciones: id, vacio (texto en lugar de barras), formato (número → texto).
function graficoBarras(titulo,filas,op){
  op=op||{};
  const caja=ce("div","grafico");
  if(op.id)caja.id=op.id;
  caja.append(ce("h4","grafico__titulo",titulo));
  if(op.vacio){
    caja.append(ce("p","screen__hint grafico__vacio",op.vacio));
    return caja
  }
  const fmt=op.formato||(n=>String(n)),max=Math.max(1,...filas.map(f=>Math.max(f.valor||0,f.meta||0)));
  caja.setAttribute("role","img");
  caja.setAttribute("aria-label",titulo+": "+filas.map(f=>f.rotulo+" "+fmt(f.valor||0)+(f.meta?" de "+f.meta:"")).join(", "));
  for(const f of filas){
    const fila=ce("div","grafico__fila"),barra=ce("span","grafico__barra"),relleno=ce("span","grafico__relleno"+(f.clase?" grafico__relleno--"+f.clase:""));
    relleno.style.width=Math.round((f.valor||0)/max*1000)/10+"%";
    barra.append(relleno);
    if(f.meta){
      const marca=ce("span","grafico__meta");
      marca.style.left=Math.round(f.meta/max*1000)/10+"%";
      barra.append(marca)
    }
    fila.dataset.valor=String(f.valor||0);
    fila.append(ce("span","grafico__rotulo",f.rotulo),barra,ce("strong","grafico__valor",fmt(f.valor||0)+(f.meta?" de "+f.meta+((f.valor||0)>=f.meta?" ✓":""):"")));
    caja.append(fila)
  }
  return caja
}
// Gasto semanal corregido a mano (miPlatoFacil_gastoSemanal_v1): {"2026-10-19": 45000}. Opcional en el respaldo.
var GASTO_SEMANAL_KEY="miPlatoFacil_gastoSemanal_v1";
function validGastoSemanal(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=260&&Object.entries(o).every(([k,v])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&Rutina.validTrainingDate(k)&&Number.isFinite(v)&&v>=0&&v<=100000000000)
}
function loadGastoSemanal(){
  try{
    const o=JSON.parse(localStorage.getItem(GASTO_SEMANAL_KEY)||"{}");
    return validGastoSemanal(o)?o:{}
  }catch(e){
    return {}
  }
}
// Lo que suman las compras registradas en la semana que empieza ese lunes, en esa moneda.
function gastoDeLaSemana(lunes,moneda){
  const fin=new Date(lunes+"T12:00:00");
  fin.setDate(fin.getDate()+6);
  const hasta=Rutina.localTrainingDate(fin);
  return loadPurchases().filter(p=>p.date>=lunes&&p.date<=hasta&&p.currency===moneda).reduce((t,p)=>t+(Number(p.total)||0),0)
}
