// Mi Plato Fácil · Semana flexible (Ronda 6, Etapa 48): pasar una comida a otro día, "Comemos afuera" y "Que sobre para mañana".
// El plan guardado no cambia de formato (día → comida → id). Lo que no cabe en él ("Afuera" con su gasto opcional y "Sobra de…") vive en
// miPlatoFacil_semanaAjustes_v1, una entrada por semana (el lunes): {"2026-11-23": {"afuera": {"martes|cena": {"gasto": 12000}},
// "sobra": {"miercoles|almuerzo": "martes|cena"}}}. Es opcional en el respaldo. Una marca "afuera" solo vale mientras el hueco está vacío y una
// marca "sobra" solo mientras los dos huecos tienen la misma comida: si se cambia el plan por otro camino, la marca deja de verse sola.
// Parte 49: los archivos se unen en orden según su número, que define el orden de arranque.
var SEMANA_AJUSTES_KEY="miPlatoFacil_semanaAjustes_v1";
var SemanaAjustes={
validHueco(k){
  return typeof k==="string"&&/^(lunes|martes|miercoles|jueves|viernes|sabado|domingo)\|(desayuno|merienda|almuerzo|cena)$/.test(k)
},
validSemana(w){
  if(!w||typeof w!=="object"||Array.isArray(w)||!Object.keys(w).every(k=>k==="afuera"||k==="sobra"))return false;
  const dic=o=>!!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=28;
  const afuera=w.afuera===undefined||(dic(w.afuera)&&Object.entries(w.afuera).every(([k,v])=>SemanaAjustes.validHueco(k)&&!!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).every(x=>x==="gasto")&&(v.gasto===undefined||(typeof v.gasto==="number"&&Number.isFinite(v.gasto)&&v.gasto>=0&&v.gasto<=1e9))));
  const sobra=w.sobra===undefined||(dic(w.sobra)&&Object.entries(w.sobra).every(([k,v])=>SemanaAjustes.validHueco(k)&&SemanaAjustes.validHueco(v)&&k!==v));
  return afuera&&sobra
},
validAjustes(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=60&&Object.entries(o).every(([k,v])=>Rutina.validTrainingDate(k)&&SemanaAjustes.validSemana(v))
},
cargar(){
  try{
    const o=JSON.parse(localStorage.getItem(SEMANA_AJUSTES_KEY)||"{}");
    if(!SemanaAjustes.validAjustes(o))return {};
    return Object.fromEntries(Object.entries(o).filter(([k])=>!["__proto__","constructor","prototype"].includes(k)))
  }catch(e){
    return {}
  }
},
guardar(todo,editada){
  for(const k of Object.keys(todo)){
    const w=todo[k];
    if(w.afuera&&!Object.keys(w.afuera).length)delete w.afuera;
    if(w.sobra&&!Object.keys(w.sobra).length)delete w.sobra;
    if(!Object.keys(w).length)delete todo[k]
  }
  const mantener=Object.keys(todo).sort().reverse().slice(0,12);
  if(editada&&todo[editada]&&!mantener.includes(editada))mantener.push(editada);
  const out=Object.fromEntries(mantener.sort().map(k=>[k,todo[k]]));
  if(!SemanaAjustes.validAjustes(out))throw Error("No se pudo guardar el cambio de la semana.");
  if(Object.keys(out).length)localStorage.setItem(SEMANA_AJUSTES_KEY,JSON.stringify(out));
  else localStorage.removeItem(SEMANA_AJUSTES_KEY)
},
// La semana (lunes) de lo que se está viendo: una copia fechada, la semana que viene o esta.
lunesDelContexto(){
  return semanaFechada||(Semana.viendoProxima()?Semana.lunesSiguiente():Semana.semanaActual())
},
semana(lunes){
  const w=SemanaAjustes.cargar()[lunes||SemanaAjustes.lunesDelContexto()]||{};
  return {
    afuera:w.afuera||{},sobra:w.sobra||{}
  }
},
// Cambia la semana en una sola escritura: f recibe {afuera, sobra} y los modifica.
cambiar(f,lunes){
  const todo=SemanaAjustes.cargar(),k=lunes||SemanaAjustes.lunesDelContexto(),w=todo[k]||{};
  const act={
    afuera:{...(w.afuera||{})},sobra:{...(w.sobra||{})}
  };
  f(act);
  todo[k]={
    afuera:act.afuera,sobra:act.sobra
  };
  SemanaAjustes.guardar(todo,k)
},
// El plan de una semana (para saber qué huecos siguen vacíos): esta, la que viene o una copia fechada; null si no se conoce.
planDe(lunes){
  try{
    if(lunes===Semana.semanaActual())return Semana.planDeLaSemana("esta");
    if(lunes===Semana.lunesSiguiente())return Semana.planDeLaSemana("proxima");
    const w=loadDatedWeeks()[lunes];
    return w&&w.plan?Semana.migratePlan(w.plan):null
  }catch(e){
    return null
  }
},
// ---- Afuera ----
afuera(dia,slot,lunes){
  const a=SemanaAjustes.semana(lunes).afuera[dia+"|"+slot];
  return a?{
    gasto:typeof a.gasto==="number"?a.gasto:null
  }:null
},
textoAfuera(dia,slot){
  const a=SemanaAjustes.afuera(dia,slot);
  return a?"Afuera"+(a.gasto!==null?" · "+pesosCortos(a.gasto):""):""
},
// Los huecos marcados "Afuera" de una semana (solo los que siguen vacíos en el plan que se pasa; sin plan, todos).
huecosAfuera(lunes,plan){
  const s=SemanaAjustes.semana(lunes),out=[];
  for(const [k,v] of Object.entries(s.afuera)){
    const [d,sl]=k.split("|");
    if(plan&&plan[d]&&plan[d][sl])continue;
    out.push({
      dia:d,slot:sl,gasto:typeof v.gasto==="number"?v.gasto:null
    })
  }
  return out
},
marcarAfuera(dia,slot,gasto){
  const plan=loadPlan();
  if(plan[dia]&&plan[dia][slot]&&setSlot(dia,slot,null)===false)return false;
  SemanaAjustes.cambiar(a=>{
    a.afuera[dia+"|"+slot]=gasto===null||gasto===undefined?{
    }:{
      gasto
    }
  });
  renderPlan();
  return true
},
quitarAfuera(dia,slot){
  SemanaAjustes.cambiar(a=>{
    delete a.afuera[dia+"|"+slot]
  });
  renderPlan()
},
// Cuando se elige una comida para un hueco, deja de ser "Afuera".
limpiarAfuera(dia,slot){
  try{
    if(SemanaAjustes.afuera(dia,slot))SemanaAjustes.cambiar(a=>{
      delete a.afuera[dia+"|"+slot]
    })
  }catch(e){
  }
},
// El gasto de comidas afuera de una semana, aparte de las compras: {cantidad, total, sinGasto}.
resumenAfuera(lunes){
  const h=SemanaAjustes.huecosAfuera(lunes||SemanaAjustes.lunesDelContexto(),SemanaAjustes.planDe(lunes||SemanaAjustes.lunesDelContexto()));
  return {
    cantidad:h.length,total:h.reduce((t,x)=>t+(x.gasto||0),0),sinGasto:h.filter(x=>x.gasto===null).length
  }
},
// ---- Sobra ----
nombreConArticulo(slot){
  const n=Semana.planSlotName(slot).toLowerCase();
  return slot==="cena"||slot==="merienda"?"la "+n:"el "+n
},
textoSobra(dia,slot,plan){
  const de=SemanaAjustes.semana().sobra[dia+"|"+slot];
  if(!de)return "";
  const [d2,s2]=de.split("|"),mio=plan&&plan[dia]&&plan[dia][slot];
  if(!mio||!plan[d2]||plan[d2][s2]!==mio)return "";
  return "Sobra "+(s2==="cena"||s2==="merienda"?"de la ":"del ")+Semana.planSlotName(s2).toLowerCase()+" del "+Semana.planDayName(d2).toLowerCase()
},
// "a la cena del martes", "al almuerzo del martes".
haciaHueco(dia,slot){
  const n=Semana.planSlotName(slot).toLowerCase();
  return (slot==="cena"||slot==="merienda"?"a la ":"al ")+n+" del "+Semana.planDayName(dia).toLowerCase()
},
// El día siguiente de la semana (o null el domingo).
diaSiguiente(dia){
  const i=DAYS.findIndex(d=>d[0]===dia);
  return i>=0&&i<DAYS.length-1?DAYS[i+1][0]:null
},
puedeQueSobre(dia,slot){
  return (slot==="almuerzo"||slot==="cena")&&!!SemanaAjustes.diaSiguiente(dia)
},
// Escribe el plan completo una sola vez (con su Deshacer) y deja el texto de lo que pasó en el aviso de la semana.
escribirPlan(plan,texto,porciones){
  const antes={
    plan:JSON.parse(JSON.stringify(loadPlan())),porciones:Semana.loadPlanPortions()
  };
  if(!Semana.persistPlan(Semana.migratePlan(plan)))throw Error(errorDelPlan||"No se pudo guardar el plan.");
  if(porciones)try{Semana.savePlanPortions(porciones)}catch(e){}
  Semana.logPlanChange(texto.replace(/\.$/,""));
  deshacerPlan={
    texto:texto.replace(/\.$/,""),plan:antes.plan,porciones:antes.porciones,tab:activeTab
  }
},
// El aviso de una línea. En Semana, lo que se puede deshacer ya lo muestra el aviso de la semana (con su Deshacer): no se repite.
aviso(texto,conDeshacer){
  if(semanaFechada&&document.getElementById("datedWeekStatus")){
    document.getElementById("datedWeekStatus").textContent=texto;
    return
  }
  if(!conDeshacer)planStatus(texto)
},
// F-01: pasa la comida de un hueco a otro día y comida; si el destino tenía algo, se intercambian.
pasarAOtroDia(dia,slot,dia2,slot2){
  const plan=loadPlan(),byId=new Map(MisPlatos.loadSaved().map(p=>[p.id,p])),a=(plan[dia]||{})[slot]||null;
  if(!a)throw Error("Ese hueco está vacío.");
  if(dia===dia2&&slot===slot2)throw Error("Elegí otro día u otra comida.");
  if(!DAYS.some(d=>d[0]===dia2)||!SLOTS.some(s=>s[0]===slot2))throw Error("Elegí un día y una comida.");
  const b=(plan[dia2]||{})[slot2]||null,nombre=id=>{
    const it=byId.get(id);return it?nombreCortoDeComida(it):"la comida"
  };
  if(!plan[dia2])plan[dia2]={
    desayuno:null,merienda:null,almuerzo:null,cena:null
  };
  plan[dia][slot]=b;
  plan[dia2][slot2]=a;
  // Las porciones van con la comida (solo en esta semana: en las otras no se guardan).
  let porciones=null;
  if(!Semana.viendoProxima()&&!semanaFechada){
    porciones={
      ...Semana.loadPlanPortions()
    };
    const k1=dia+"|"+slot,k2=dia2+"|"+slot2,p1=porciones[k1],p2=porciones[k2];
    delete porciones[k1];delete porciones[k2];
    if(b&&p2!==undefined)porciones[k1]=p2;
    if(p1!==undefined)porciones[k2]=p1
  }
  const dest=SemanaAjustes.haciaHueco(dia2,slot2);
  const texto=b?"Cambiaste "+nombre(a)+" con "+nombre(b)+": "+nombre(a)+" ahora está "+dest.replace(/^a /,"en ").replace(/^al /,"en el ")+".":"Pasaste "+nombre(a)+" "+dest+".";
  SemanaAjustes.escribirPlan(plan,texto,porciones);
  // Si el destino estaba marcado "Afuera", deja de estarlo (ahora tiene una comida).
  SemanaAjustes.limpiarAfuera(dia2,slot2);
  renderPlan();
  SemanaAjustes.aviso(texto,true);
  return texto
},
// F-03: la misma comida en el almuerzo de mañana, con la marca "Sobra de…".
queSobre(dia,slot,reemplazar){
  const plan=loadPlan(),a=(plan[dia]||{})[slot]||null,sig=SemanaAjustes.diaSiguiente(dia);
  if(!a)throw Error("Ese hueco está vacío.");
  if(!SemanaAjustes.puedeQueSobre(dia,slot))throw Error("Solo el almuerzo y la cena pueden sobrar para mañana (y el domingo no tiene mañana en esta semana).");
  const b=(plan[sig]||{}).almuerzo||null,it=MisPlatos.loadSaved().find(p=>p.id===a),nombre=it?nombreCortoDeComida(it):"la comida";
  if(b&&b!==a&&!reemplazar)return {
    pregunta:true,dia:sig,actual:(MisPlatos.loadSaved().find(p=>p.id===b)||{}).title||"otra comida"
  };
  if(!plan[sig])plan[sig]={
    desayuno:null,merienda:null,almuerzo:null,cena:null
  };
  plan[sig].almuerzo=a;
  const porciones=Semana.viendoProxima()||semanaFechada?null:{
    ...Semana.loadPlanPortions()
  };
  if(porciones)delete porciones[sig+"|almuerzo"];
  const texto="Sobra para mañana: "+nombre+" también es el almuerzo del "+Semana.planDayName(sig).toLowerCase()+".";
  SemanaAjustes.escribirPlan(plan,texto,porciones);
  SemanaAjustes.cambiar(x=>{
    x.sobra[sig+"|almuerzo"]=dia+"|"+slot;
    delete x.afuera[sig+"|almuerzo"]
  });
  renderPlan();
  SemanaAjustes.aviso(texto,true);
  return {
    texto
  }
},
// ---- Hojas ----
abrirPasar(dia,slot){
  const plan=loadPlan();
  if(!(plan[dia]||{})[slot])return;
  const fila=ce("div","pantry-item-qty");
  // Arranca en el día siguiente (el domingo, en el lunes): así el primer "Pasar" que se toca ya hace algo.
  fila.append(Comidas.campoDeHoja("hojaPasarDia","Día",DAYS,SemanaAjustes.diaSiguiente(dia)||"lunes"),Comidas.campoDeHoja("hojaPasarSlot","Comida",SLOTS.map(([v,t])=>[v,t.replace(/^\S+\s/,"")]),slot));
  // Si algo no se puede (por ejemplo, el mismo hueco), la hoja muestra el motivo y queda abierta.
  hoja.abrir({
    titulo:"Pasar a otro día",contenido:[fila],botones:[["Pasar","button--primary",()=>{
      SemanaAjustes.pasarAOtroDia(dia,slot,document.getElementById("hojaPasarDia").value,document.getElementById("hojaPasarSlot").value);
      hoja.cerrar()
    }],["Cancelar","button--soft",()=>hoja.cerrar()]],foco:false
  })
},
abrirQueSobre(dia,slot){
  let r;
  try{
    r=SemanaAjustes.queSobre(dia,slot,false)
  }catch(e){
    SemanaAjustes.aviso(e.message);
    return
  }
  if(r&&r.pregunta){
    const p=ce("p",null,"El almuerzo del "+Semana.planDayName(r.dia).toLowerCase()+" ya tiene "+r.actual+". ¿Querés reemplazarlo?");
    p.id="hojaSobraPregunta";
    hoja.abrir({
      titulo:"Que sobre para mañana",contenido:[p],botones:[["Reemplazar","button--primary",()=>{
        SemanaAjustes.queSobre(dia,slot,true);
        hoja.cerrar()
      }],["No, dejarlo","button--soft",()=>hoja.cerrar()]],foco:false
    });
    return
  }
  hoja.cerrar()
},
abrirAfuera(dia,slot){
  const a=SemanaAjustes.afuera(dia,slot),caja=ce("div","hueco-hoja"),campo=ce("div","portion-field"),label=ce("label",null,"Cuánto se gastó (opcional)"),inp=ce("input"),actual=(loadPlan()[dia]||{})[slot]||null,it=actual?MisPlatos.loadSaved().find(p=>p.id===actual):null;
  inp.id="hojaAfueraGasto";
  inp.type="text";
  inp.inputMode="decimal";
  inp.maxLength=12;
  inp.placeholder="Ej.: 12000";
  inp.value=a&&a.gasto!==null?String(a.gasto).replace(".",","):"";
  label.htmlFor="hojaAfueraGasto";
  campo.append(label,inp);
  caja.append(ce("p","hueco-hoja__plato","Comemos afuera"),campo);
  if(it)caja.append(ce("p","screen__hint","Al guardar, "+nombreCortoDeComida(it)+" sale de este hueco."));
  const guardar=()=>{
    const t=inp.value.trim(),n=t===""?null:Number(t.replace(/\./g,"").replace(",","."));
    if(n!==null&&!(Number.isFinite(n)&&n>=0&&n<=1e9))throw Error("Escribí el gasto con números (por ejemplo, 12000) o dejalo vacío.");
    SemanaAjustes.marcarAfuera(dia,slot,n);
    SemanaAjustes.aviso("Anotado: "+Semana.nombreDelHueco(dia,slot).toLowerCase()+" es afuera"+(n!==null?" · "+pesosCortos(n):"")+".");
    hoja.cerrar()
  };
  hoja.abrir({
    titulo:mayuscula(Semana.nombreDelHueco(dia,slot)),contenido:[caja],botones:[["Guardar","button--primary",guardar],["Ya no comemos afuera","button--soft",()=>{
      SemanaAjustes.quitarAfuera(dia,slot);
      SemanaAjustes.aviso("Listo: "+Semana.nombreDelHueco(dia,slot).toLowerCase()+" quedó sin elegir.");
      hoja.cerrar()
    }],["Elegir una comida","button--soft",()=>{
      hoja.cerrar();
      setTimeout(()=>abrirSelector(dia,slot),0)
    }]],foco:false
  })
}
};
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b||!b.dataset)return;
  const d=b.dataset;
  try{
    if(d.huecoPasar){
      const [dia,slot]=d.huecoPasar.split("|");
      return SemanaAjustes.abrirPasar(dia,slot)
    }
    if(d.huecoSobra){
      const [dia,slot]=d.huecoSobra.split("|");
      return SemanaAjustes.abrirQueSobre(dia,slot)
    }
    if(d.huecoAfuera){
      const [dia,slot]=d.huecoAfuera.split("|");
      hoja.cerrar();
      return setTimeout(()=>SemanaAjustes.abrirAfuera(dia,slot),0)
    }
  }catch(err){
    SemanaAjustes.aviso(err.message)
  }
});
