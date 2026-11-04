// Mi Plato Fácil · "Armame la semana" (Etapa 15): completa los huecos de la Semana con reglas fijas, sin IA.
// Parte 46: los archivos se unen en orden según su número, que define el orden de arranque.
// Solo se arma el módulo y se registran los clics: nada corre durante el arranque.
// Reglas: tipo de comida (desayuno y merienda / almuerzo y cena), día de rutina, lo que evitás, lo que hay en la Despensa,
// reutilizar ingredientes ya elegidos en la semana, "cociná doble" (la cena de un día es el almuerzo del siguiente) y
// nunca más de 2 veces la misma comida. Con presupuesto, primero se elige con el costo en cuenta y después se reemplaza lo
// más caro por algo parecido y más barato hasta entrar. El resultado es el mismo para los mismos datos (semilla = la
// semana). No escribe nada hasta aplicar: una sola escritura de Mis comidas y una del plan, con Deshacer.
var ArmameSemana=(function(){
  const ORDEN=["almuerzo","cena","desayuno","merienda"],MAX_REPETIDA=2,PESO_SLOT={desayuno:0.12,merienda:0.1,almuerzo:0.4,cena:0.38};
  function hash(s){
    let h=2166136261;
    for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
    return h>>>0
  }
  function azar(semilla){
    let a=semilla>>>0;
    return function(){
      a=(a+0x6D2B79F5)|0;
      let t=Math.imul(a^(a>>>15),1|a);
      t=(t+Math.imul(t^(t>>>7),61|t))^t;
      return((t^(t>>>14))>>>0)/4294967296
    }
  }
  const clave=texto=>normalizeSearchText(String(texto||"")).replace(/[^a-z0-9ñ]+/g," ").trim();
  const semilla=extra=>hash(Semana.semanaActual()+"|"+extra);
  // Presupuesto de la semana en pesos, o null (sin presupuesto o en otra moneda).
  function presupuestoSemanal(){
    const b=shoppingBudgetRead();
    if(!b||b.currency!=="ARS"||!(b.limit>0))return null;
    return b.period==="mes"?b.limit*7/30:b.limit
  }
  function estadoBase(tipo){
    const st=JSON.parse(JSON.stringify(state));
    Object.assign(st,{type:tipo,day:"",fruta:null,bfprot:null,bfcarb:null,grasa:null,pre:null,snack:null,verduras:[],almidones:[],proteinas:[],legCarb:[],legProt:[],replaceCarb:false,replaceProt:false,customPortions:null,nombreSugerido:""});
    return st
  }
  function snapDeEstado(st,nota){
    const antes=JSON.parse(JSON.stringify(state));
    let snap;
    try{
      Object.assign(state,st);
      snap=MisPlatos.currentSnapshot()
    }finally{
      Object.assign(state,antes)
    }
    if(nota)snap.note=String(nota).slice(0,80);
    return snap
  }
  // ¿El día del plan es de entrenamiento? "Día de entrenamiento", "Día libre" o "" si no hay rutina.
  const diaDeRutinaDe=dia=>diaDeRutina(fechaDelDiaDelPlan(dia));
  // Candidatas de cada tipo de comida. cand: {k, nombre, tipo:"idea"|"mia"|"combo", ings:[claves], item?, idea?, estado?}
  function candidatosPlato(){
    const por=new Map(),ver=(txt,ings)=>textoPermitido(txt+" "+ings.join(" "));
    for(const it of MisPlatos.loadSaved()){
      if(!it||it.type!=="plato")continue;
      let ings=[];
      try{ings=Semana.extractIngredients(it)}catch(e){}
      const nombre=mealName(it);
      if(!ings.length||!ver(nombre,ings))continue;
      const k=clave(nombre);
      if(!por.has(k))por.set(k,{k,nombre,tipo:"mia",item:it,ings:ings.map(ingredientKey)})
    }
    for(const idea of data.menuCatalog){
      const ings=ideaIngredientes(idea),k=clave(idea.text);
      if(!ings.length||por.has(k)||!ver(idea.text+" "+(idea.tags||[]).join(" "),ings))continue;
      por.set(k,{k,nombre:idea.text,tipo:"idea",idea,ings:ings.map(ingredientKey)})
    }
    return [...por.values()]
  }
  function candidatosDesayuno(sem){
    const out=[],vistas=new Set(),r=azar(semilla("combos|"+sem));
    for(const it of MisPlatos.loadSaved()){
      if(!it||it.type!=="desayuno")continue;
      let ings=[];
      try{ings=Semana.extractIngredients(it)}catch(e){}
      const nombre=mealName(it);
      if(!ings.length||!textoPermitido(nombre+" "+ings.join(" "))||vistas.has(clave(nombre)))continue;
      vistas.add(clave(nombre));
      out.push({k:clave(nombre),nombre,tipo:"mia",item:it,ings:ings.map(ingredientKey)})
    }
    // Combinaciones de fruta + proteína + cereal del armado, elegidas con la semilla (las que no son lo que evitás).
    const frutas=data.frutas.filter(f=>textoPermitido(f[0])),prot=data.bfprot.filter(p=>textoPermitido(p[0])),cer=data.bfcarb.filter(c=>textoPermitido(c[0]));
    let intentos=0;
    while(out.length<18&&frutas.length&&prot.length&&cer.length&&intentos++<200){
      const f=frutas[Math.floor(r()*frutas.length)],p=prot[Math.floor(r()*prot.length)],c=cer[Math.floor(r()*cer.length)],forma=r()<0.5?"Entera":"En trozos";
      const st=estadoBase("desayuno");
      st.fruta={name:f[0],quantity:f[1],forma};st.bfprot={name:p[0],quantity:p[1]};st.bfcarb={name:c[0],quantity:c[1]};
      const nombre=nombreDesdeEstado(st,"desayuno"),k=clave(nombre);
      if(vistas.has(k))continue;
      vistas.add(k);
      out.push({k,nombre,tipo:"combo",estado:st,ings:[...comprables(f[0]),...comprables(p[0]),...comprables(c[0])].map(ingredientKey)})
    }
    return out
  }
  // Cantidades de una candidata ({yield, rows}) o null.
  function filasDe(c,dia){
    let a=null;
    if(c.item)a=cantidadesDeComida("plato",c.item.id);
    else{
      const st=c.estado||IdeasHoja.ideaComoComida(c.idea,diaDeRutinaDe(dia)||"Día libre"),cant=cantidadesDePlatoArmado({state:st});
      if(cant.length)a={yield:1,rows:cant.map(x=>({name:x.name,quantity:x.q,unit:x.unit}))}
    }
    return a
  }
  // ≈ costo para el hogar de una candidata (null si no hay precios), con una caché por corrida. Incluye estimados (Etapa 20).
  function costoDe(c,dia,memo){
    const id=c.k+"|"+(c.tipo==="idea"?diaDeRutinaDe(dia):"");
    if(memo.has(id))return memo.get(id);
    let v=null;
    try{
      const a=filasDe(c,dia);
      if(a){
        const r=costoDeFilas(a.rows,Semana.portionFactor(null,a)*personasHogar());
        v=r.costo>0?r.costo:null
      }
    }catch(e){
      v=null
    }
    memo.set(id,v);
    return v
  }
  function mediana(xs){
    const a=xs.filter(x=>x!==null).sort((p,q)=>p-q);
    return a.length?a[a.length>>1]:null
  }
  function despensaMatcher(){
    const tengo=MarcasDespensa.pantryMarkedMatcher(),stock=Object.values(loadStockQuantities()).filter(s=>s.quantity>0).map(s=>ingredientKey(s.name));
    return n=>tengo.has(n)||stock.includes(n)
  }
  // Estado de la semana: qué comidas hay en cada hueco, cuántas veces se usa cada una y qué ingredientes se repiten.
  function leerSemana(plan,salvo){
    const items=new Map(MisPlatos.loadSaved().map(x=>[x.id,x])),sem={comidas:new Map(),cuenta:new Map(),ings:new Map()};
    for(const [dia] of DAYS)for(const [slot] of SLOTS){
      if(salvo&&salvo.has(dia+"|"+slot))continue;
      const it=items.get((plan[dia]||{})[slot]);
      if(!it)continue;
      let ings=[];
      try{ings=Semana.extractIngredients(it)}catch(e){}
      const k=clave(mealName(it));
      sem.comidas.set(dia+"|"+slot,{k,ings:ings.map(ingredientKey),item:it});
      sem.cuenta.set(k,(sem.cuenta.get(k)||0)+1);
      for(const g of new Set(ings.map(ingredientKey)))sem.ings.set(g,(sem.ings.get(g)||0)+1)
    }
    return sem
  }
  function sumar(sem,pos,c,delta){
    if(delta>0)sem.comidas.set(pos,{k:c.k,ings:c.ings,cand:c});else sem.comidas.delete(pos);
    sem.cuenta.set(c.k,(sem.cuenta.get(c.k)||0)+delta);
    for(const g of new Set(c.ings))sem.ings.set(g,Math.max(0,(sem.ings.get(g)||0)+delta))
  }
  // Arma la semana (sin escribir). opciones.modo: "vacios" (por defecto) o "todo". Devuelve el plan propuesto y sus números.
  function armar(opciones){
    const modo=opciones&&opciones.modo==="todo"?"todo":"vacios",plan=JSON.parse(JSON.stringify(loadPlan())),items=new Map(MisPlatos.loadSaved().map(x=>[x.id,x]));
    const aFillar=[];
    for(const [dia] of DAYS)for(const slot of ORDEN){
      const id=(plan[dia]||{})[slot];
      if(modo==="todo"||!id||!items.has(id))aFillar.push([dia,slot])
    }
    const salvo=new Set(aFillar.map(([d,s])=>d+"|"+s)),sem=leerSemana(plan,salvo),memo=new Map(),sd=semilla(modo),r=azar(sd);
    const cp=candidatosPlato(),cd=candidatosDesayuno(modo),enDespensa=despensaMatcher();
    const presupuesto=presupuestoSemanal(),imputados={plato:null,desayuno:null};
    const pool=slot=>slotPool(slot)==="plato"?cp:cd;
    const medianaDe=slot=>{
      const p=slotPool(slot);
      if(imputados[p]===null)imputados[p]=mediana(pool(slot).map(c=>costoDe(c,"lunes",memo)));
      return imputados[p]
    };
    const costo=(c,dia,slot)=>{const v=costoDe(c,dia,memo);return v===null?medianaDe(slot):v};
    const hayPrecios=cp.concat(cd).some(c=>costoDe(c,"lunes",memo)!==null);
    const asignadas=new Map(),dobles=[],vecina=(dia,slot,delta)=>{const i=DAYS.findIndex(d=>d[0]===dia)+delta;return i>=0&&i<DAYS.length?(sem.comidas.get(DAYS[i][0]+"|"+slot)||{}).k:undefined};
    const valido=(c,dia,slot,pos)=>{
      if((sem.cuenta.get(c.k)||0)>=MAX_REPETIDA)return false;
      if(c.tipo==="mia"&&c.item&&c.item.state&&typeof c.item.state.day==="string"&&c.item.state.day){
        const d=diaDeRutinaDe(dia);
        if(d&&c.item.state.day!==d&&slotPool(slot)==="plato")return false
      }
      if(vecina(dia,slot,-1)===c.k||vecina(dia,slot,1)===c.k)return false;
      const otro=slot==="almuerzo"?"cena":slot==="cena"?"almuerzo":slot==="desayuno"?"merienda":"desayuno";
      return (sem.comidas.get(dia+"|"+otro)||{}).k!==c.k
    };
    let gastado=0;
    const objetivo=slot=>presupuesto&&hayPrecios?Math.max(1,(presupuesto-gastado)*PESO_SLOT[slot]/Math.max(0.2,aFillar.filter(([d,s])=>!asignadas.has(d+"|"+s)).reduce((t,[,s])=>t+PESO_SLOT[s],0))):null;
    for(const [dia,slot] of aFillar){
      const pos=dia+"|"+slot;
      if(asignadas.has(pos))continue;
      const meta=objetivo(slot);
      let mejor=null,mejorPuntos=-1e9;
      for(const c of pool(slot)){
        if(!valido(c,dia,slot,pos))continue;
        const reuso=Math.min(3,c.ings.filter(g=>(sem.ings.get(g)||0)>0).length),desp=Math.min(3,c.ings.filter(enDespensa).length);
        // En el desayuno y la merienda reutilizar pesa poco: si no, toda la semana sería banana con huevo y avena.
        let puntos=1+(slotPool(slot)==="plato"?0.6:0.1)*reuso+0.4*desp+r()*0.8;
        if(meta){const v=costo(c,dia,slot);if(v>meta)puntos-=1.5*(v/meta-1)}
        if(puntos>mejorPuntos){mejor=c;mejorPuntos=puntos}
      }
      if(!mejor)continue;
      sumar(sem,pos,mejor,1);
      asignadas.set(pos,mejor);
      gastado+=costo(mejor,dia,slot);
      // Cociná doble: la cena de hoy es el almuerzo de mañana.
      if(slot==="cena"&&r()<0.3){
        const i=DAYS.findIndex(d=>d[0]===dia),sig=DAYS[i+1]&&DAYS[i+1][0],p2=sig&&sig+"|almuerzo";
        if(p2&&salvo.has(p2)&&!asignadas.has(p2)&&(sem.cuenta.get(mejor.k)||0)<MAX_REPETIDA){
          const d2=diaDeRutinaDe(sig),ok=!(mejor.tipo==="mia"&&mejor.item&&mejor.item.state&&mejor.item.state.day&&d2&&mejor.item.state.day!==d2);
          if(ok){
            sumar(sem,p2,mejor,1);asignadas.set(p2,mejor);gastado+=costo(mejor,sig,"almuerzo");
            dobles.push({de:dia,a:sig,comida:mejor.nombre})
          }
        }
      }
    }
    // Total de la semana (lo que ya había + lo nuevo) y, si pasa el presupuesto, reemplazar lo más caro por algo más barato.
    // Mismo cálculo que Semana y Compras (costoSemanaDeFilas): lo que usa toda la semana, con envases.
    const costoSemana=()=>{
      const grupos=[];
      let extra=0;
      for(const [pos,x] of sem.comidas){
        const [dia,slot]=pos.split("|");
        let a=null;
        try{a=x.cand?filasDe(x.cand,dia):x.item?cantidadesDeComida("plato",x.item.id):null}catch(e){a=null}
        if(a)grupos.push({rows:a.rows,factor:Semana.portionFactor(null,a)*personasHogar()});
        else extra+=medianaDe(slot)||0
      }
      const c=costoSemanaDeFilas(grupos);
      return (c?c.total:0)+extra
    };
    let total=costoSemana(),cambios=0;
    if(presupuesto&&hayPrecios){
      let guardia=0;
      while(total>presupuesto&&guardia++<80){
        let mejor=null;
        for(const [pos,c] of asignadas){
          const [dia,slot]=pos.split("|"),actual=costo(c,dia,slot);
          sumar(sem,pos,c,-1);
          for(const o of pool(slot)){
            if(o.k===c.k||!valido(o,dia,slot,pos))continue;
            const ahorro=actual-costo(o,dia,slot);
            const parecido=o.ings.filter(g=>c.ings.includes(g)).length;
            if(ahorro>1&&(!mejor||ahorro+parecido*5>mejor.ahorro+mejor.parecido*5))mejor={pos,dia,slot,o,ahorro,parecido,c}
          }
          sumar(sem,pos,c,1)
        }
        if(!mejor)break;
        sumar(sem,mejor.pos,mejor.c,-1);
        sumar(sem,mejor.pos,mejor.o,1);
        asignadas.set(mejor.pos,mejor.o);
        cambios++;
        total=costoSemana()
      }
    }
    const reutilizados=[...sem.ings.values()].filter(n=>n>=2).length;
    const resultado={modo,plan,asignadas:[...asignadas].map(([pos,c])=>({dia:pos.split("|")[0],slot:pos.split("|")[1],cand:c})),huecos:aFillar.length,
      llenos:asignadas.size,costo:Math.round(total),presupuesto:presupuesto===null?null:Math.round(presupuesto),pasado:!!(presupuesto&&hayPrecios&&total>presupuesto),
      sinPrecios:!!(presupuesto&&!hayPrecios),dobles,reutilizados,cambios};
    return resultado
  }
  // Escribe lo armado: Mis comidas una vez, el plan una vez, con historial y Deshacer.
  function aplicar(res){
    const antes={plan:loadPlan(),porciones:Semana.loadPlanPortions()},saved=MisPlatos.loadSaved(),nuevos=[],porSig=new Map(saved.map(x=>[x.sig||x.text,x])),plan=JSON.parse(JSON.stringify(antes.plan));
    for(const [dia] of DAYS)if(!plan[dia])plan[dia]={desayuno:null,merienda:null,almuerzo:null,cena:null};
    if(res.modo==="todo")for(const [dia] of DAYS)for(const [slot] of SLOTS)plan[dia][slot]=null;
    const idDe=(c,dia)=>{
      if(c.item)return c.item.id;
      const snap=c.estado?snapDeEstado(c.estado,null):IdeasHoja.ideaComoGuardada(c.idea,diaDeRutinaDe(dia)||"Día libre"),igual=porSig.get(snap.sig||snap.text);
      if(igual)return igual.id;
      porSig.set(snap.sig||snap.text,snap);nuevos.push(snap);
      return snap.id
    };
    for(const a of res.asignadas)plan[a.dia][a.slot]=idDe(a.cand,a.dia);
    if(nuevos.length&&!MisPlatos.persistSaved(nuevos.reverse().concat(saved)))throw Error("No se pudo guardar (falta de espacio u otro error).");
    if(!Semana.persistPlan(plan))throw Error(errorDelPlan||"No se pudo guardar el plan.");
    Semana.prunePlanPortions(antes.plan,plan);
    const texto=res.modo==="todo"?"Armaste la semana entera":"Completaste "+res.llenos+" huecos";
    Semana.logPlanChange("Armame la semana: "+res.llenos+" comidas"+(res.costo?" (≈ $"+res.costo.toLocaleString("es-AR")+")":""));
    deshacerPlan={texto,plan:antes.plan,porciones:antes.porciones};
    renderPlan();
    // El total del aviso es el de Semana y Compras: se calcula con lo ya guardado (costoSemanaPlan).
    try{
      const c=costoSemanaPlan();
      if(c){
        res.costo=Math.round(c.total);
        res.faltan=c.faltan;
        res.sinEstimar=c.sinEstimar;
        if(res.presupuesto)res.pasado=c.total>res.presupuesto
      }
    }catch(e){
    }
    return res
  }
  function resumen(res){
    const pesos=n=>"$"+Math.round(n).toLocaleString("es-AR");
    let t="Listo: "+res.llenos+(res.llenos===1?" comida armada":" comidas armadas")+(res.costo?" · "+(res.sinEstimar?"al menos ":"")+"≈ "+pesos(res.costo)+" la semana":"")+".";
    if(res.costo&&res.faltan)t+=" Incluye "+res.faltan+(res.faltan===1?" precio estimado":" precios estimados")+".";
    if(res.presupuesto&&res.costo)t+=res.pasado?" No llego al presupuesto de "+pesos(res.presupuesto)+": es lo más barato que pude armar con lo que tenés para elegir.":" Entra en tu presupuesto de "+pesos(res.presupuesto)+".";
    if(res.sinPrecios)t+=" No tengo precios para controlar el presupuesto.";
    if(res.dobles.length)t+=" Cociná doble: "+res.dobles.map(d=>"la cena del "+Semana.planDayName(d.de).toLowerCase()+" es el almuerzo del "+Semana.planDayName(d.a).toLowerCase()).join("; ")+".";
    const pocas=dietaAvisoPocas();
    if(pocas)t+=" "+pocas;
    if(res.llenos<res.huecos)t+=" Quedaron "+(res.huecos-res.llenos)+" huecos sin llenar: faltan comidas que cumplan lo que evitás.";
    return t
  }
  function huecosVacios(){
    const plan=loadPlan(),ids=new Set(MisPlatos.loadSaved().map(x=>x.id));
    let n=0;
    for(const [dia] of DAYS)for(const [slot] of SLOTS)if(!ids.has((plan[dia]||{})[slot]))n++;
    return n
  }
  function abrir(){
    const vacios=huecosVacios(),caja=ce("div","armame-hoja");
    caja.append(ce("p","screen__hint",presupuestoSemanal()?"Armo la semana sin pasarme de tu presupuesto.":"Armo la semana con tus comidas e ideas."));
    const acc=ce("div","hueco-hoja__acciones");
    if(vacios>0)acc.append(botonHoja("Completar los "+vacios+" huecos vacíos","button--primary",{armameModo:"vacios"}));
    if(vacios<28)acc.append(botonHoja("Rehacer la semana entera",vacios>0?"button--soft":"button--primary",{armameModo:"todo"}));
    caja.append(acc);
    huecoAbierto=null;
    hoja.abrir({titulo:"Armame la semana",contenido:[caja],botones:[],foco:false})
  }
  function correr(modo){
    try{
      const res=aplicar(armar({modo}));
      hoja.cerrar();
      planStatus(resumen(res))
    }catch(e){
      hoja.estado.textContent=e.message
    }
  }
  // Cambiar un solo hueco: "parecida" (más ingredientes en común) o "barata" (cuesta menos). No toca los demás.
  function cambiarHueco(dia,slot,como){
    const plan=loadPlan(),items=new Map(MisPlatos.loadSaved().map(x=>[x.id,x])),actual=items.get((plan[dia]||{})[slot]);
    if(!actual)return {ok:false,texto:"Ese hueco está vacío."};
    const memo=new Map(),sem=leerSemana(plan,new Set([dia+"|"+slot])),kActual=clave(mealName(actual));
    let ingsActual=[];
    try{ingsActual=Semana.extractIngredients(actual).map(ingredientKey)}catch(e){}
    const lista=slotPool(slot)==="plato"?candidatosPlato():candidatosDesayuno("cambio"),r=azar(semilla("hueco|"+dia+"|"+slot+"|"+actual.id+"|"+como));
    const candActual={k:kActual,nombre:mealName(actual),tipo:"mia",item:actual,ings:ingsActual},costoActual=costoDe(candActual,dia,memo);
    const med=mediana(lista.map(c=>costoDe(c,dia,memo)));
    const vecina=delta=>{const i=DAYS.findIndex(d=>d[0]===dia)+delta;return i>=0&&i<DAYS.length?(sem.comidas.get(DAYS[i][0]+"|"+slot)||{}).k:undefined};
    let mejor=null,mejorPuntos=-1e9;
    for(const c of lista){
      if(c.k===kActual||(sem.cuenta.get(c.k)||0)>=MAX_REPETIDA||vecina(-1)===c.k||vecina(1)===c.k)continue;
      if(c.tipo==="mia"&&c.item&&c.item.state&&c.item.state.day&&slotPool(slot)==="plato"){const d=diaDeRutinaDe(dia);if(d&&c.item.state.day!==d)continue}
      const v=costoDe(c,dia,memo),vc=v===null?med:v,base=costoActual===null?med:costoActual;
      if(como==="barata"&&!(vc!==null&&base!==null&&vc<base-1))continue;
      const parecido=ingsActual.length?c.ings.filter(g=>ingsActual.includes(g)).length/ingsActual.length:0,ahorro=como==="barata"&&base?(base-vc)/base:0;
      const puntos=parecido+(como==="barata"?ahorro:0)+r()*0.05;
      if(puntos>mejorPuntos){mejor=c;mejorPuntos=puntos;mejor._costo=vc}
    }
    if(!mejor)return {ok:false,texto:como==="barata"?"No encontré una opción más barata para este hueco.":"No encontré otra opción parecida para este hueco."};
    let id;
    if(mejor.item)id=mejor.item.id;
    else{
      const snap=mejor.estado?snapDeEstado(mejor.estado,null):IdeasHoja.ideaComoGuardada(mejor.idea,diaDeRutinaDe(dia)||"Día libre"),a=MisPlatos.loadSaved(),igual=a.find(x=>(x.sig||x.text)===snap.sig);
      if(igual)id=igual.id;
      else{
        a.unshift(snap);
        if(!MisPlatos.persistSaved(a))return {ok:false,texto:"No se pudo guardar (falta de espacio u otro error)."};
        id=snap.id
      }
    }
    if(setSlot(dia,slot,id)===false)return {ok:false,texto:errorDelPlan||"No se pudo cambiar."};
    const pesos=n=>"$"+Math.round(n).toLocaleString("es-AR");
    const texto="Cambié por "+mejor.nombre+(mejor._costo?" (≈ "+pesos(mejor._costo)+(costoActual?", antes ≈ "+pesos(costoActual):"")+")":"")+".";
    planStatus(texto);
    return {ok:true,texto,id}
  }
  document.addEventListener("click",e=>{
    const b=e.target.closest&&e.target.closest("button");
    if(!b)return;
    const d=b.dataset;
    if(d.armame!==undefined)return abrir();
    if(d.armameModo)return correr(d.armameModo);
    if(d.huecoParecida||d.huecoBarata){
      const [dia,slot]=(d.huecoParecida||d.huecoBarata).split("|"),r=cambiarHueco(dia,slot,d.huecoParecida?"parecida":"barata");
      if(r.ok){huecoAbierto=null;hoja.cerrar()}
      else if(hoja.estado)hoja.estado.textContent=r.texto
    }
  });
  return {armar,aplicar,resumen,abrir,correr,cambiarHueco,presupuestoSemanal,huecosVacios}
})();
