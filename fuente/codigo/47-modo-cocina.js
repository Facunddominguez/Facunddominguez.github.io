// Mi Plato Fácil · Modo cocina (Ronda 6, Etapa 47): pantalla completa para cocinar con una mano.
// Primero los ingredientes con las cantidades de la ficha y un tilde cada uno; después un paso por pantalla, en letra grande, con Anterior,
// Siguiente y "3 de 7". Si un paso dice un tiempo ("10 minutos", "1 hora", "media hora", "5 a 7 min") trae un temporizador. Mientras está
// abierto, la pantalla no se apaga (Screen Wake Lock del navegador; donde no existe, no pasa nada). El último paso termina con "Lo comí"
// (lo mismo que Lo comí desde la ficha) y "Salir". No guarda nada: los tildes y los temporizadores viven solo mientras está abierto.
// Parte 48: los archivos se unen en orden según su número, que define el orden de arranque.
var ModoCocina={
// Reloj de los temporizadores (milisegundos). No usa la fecha: sigue andando aunque la fecha cambie; las pruebas lo reemplazan.
reloj(){
  return typeof performance!=="undefined"&&performance.now?performance.now():Date.now()
},
// Tiempo que dice un paso, en segundos (en un rango, el menor; si dice varios, el primero), o null.
tiempoDePaso(texto){
  const t=" "+String(texto||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")+" ";
  const NUM={
    un:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,quince:15,veinte:20,treinta:30,cuarenta:40,sesenta:60
  };
  const valor=s=>NUM[s]!==undefined?NUM[s]:parseFloat(String(s).replace(",","."));
  const unidad=u=>/^h/.test(u)?3600:/^m/.test(u)?60:1;
  const n="(\\d+(?:[.,]\\d+)?|"+Object.keys(NUM).join("|")+")",u="(horas?|hs|hrs?|h|minutos?|mins?|min|segundos?|segs?|seg)(?![a-z])";
  const hallados=[];
  const reglas=[
    [new RegExp("(\\d+)\\s*horas?\\s*y\\s*media(?![a-z])"),m=>valor(m[1])*3600+1800],
    [/(?:^|[^a-z])hora y media(?![a-z])/,()=>5400],
    [/(?:^|[^a-z])media hora(?![a-z])/,()=>1800],
    [/(?:^|[^a-z])cuarto de hora(?![a-z])/,()=>900],
    [new RegExp("(?:^|[^a-z0-9])"+n+"\\s*(?:a|-|–|—|o)\\s*"+n+"\\s*"+u),m=>Math.min(valor(m[1]),valor(m[2]))*unidad(m[3])],
    [new RegExp("(?:^|[^a-z0-9,.])"+n+"\\s*"+u),m=>valor(m[1])*unidad(m[2])]
  ];
  reglas.forEach(([re,f],orden)=>{
    const m=re.exec(t);
    // La posición cuenta desde donde empieza el texto del tiempo (sin el espacio de antes); a igual posición gana la regla más específica.
    if(m)hallados.push({
      i:m.index+(m[0].length-m[0].replace(/^[^a-z0-9]+/,"").length),orden,s:f(m)
    })
  });
  if(!hallados.length)return null;
  hallados.sort((a,b)=>a.i-b.i||a.orden-b.orden);
  const s=Math.round(hallados[0].s);
  return s>0&&s<=86400?s:null
},
// 90 → "1:30"; 3725 → "1:02:05".
formatoTiempo(seg){
  const h=Math.floor(seg/3600),m=Math.floor(seg%3600/60),s=seg%60,dos=x=>String(x).padStart(2,"0");
  return h?h+":"+dos(m)+":"+dos(s):m+":"+dos(s)
},
datos:null,
indice:0,
tildes:null,
temporizadores:null,
intervalo:null,
bloqueo:null,
abrirDesde:null,
abierto(){
  return !!document.getElementById("modoCocina")
},
abrir(){
  const d=Comidas.datosDeCocina();
  if(!d||!d.pasos.length)return;
  ModoCocina.cerrar(false);
  ModoCocina.datos=d;
  ModoCocina.indice=0;
  ModoCocina.tildes=new Set();
  ModoCocina.temporizadores={
  };
  ModoCocina.abrirDesde=document.activeElement;
  const raiz=ce("div","cocina"),cabeza=ce("header","cocina__cabeza"),titulo=ce("h2","cocina__titulo",d.titulo),progreso=ce("p","cocina__progreso"),salir=ce("button","cocina__salir","Salir"),cuerpo=ce("div","cocina__cuerpo"),barra=ce("footer","cocina__barra");
  raiz.id="modoCocina";
  raiz.setAttribute("role","dialog");
  raiz.setAttribute("aria-modal","true");
  raiz.setAttribute("aria-labelledby","cocinaTitulo");
  titulo.id="cocinaTitulo";
  progreso.id="cocinaProgreso";
  progreso.setAttribute("aria-live","polite");
  salir.type="button";
  salir.dataset.cocinaSalir="";
  salir.setAttribute("aria-label","Salir del modo cocina");
  cuerpo.id="cocinaCuerpo";
  barra.id="cocinaBarra";
  const titulos=ce("div","cocina__titulos");
  titulos.append(titulo,progreso);
  cabeza.append(titulos,salir);
  raiz.append(cabeza,cuerpo,barra);
  document.body.append(raiz);
  document.body.classList.add("cocina-abierta");
  ModoCocina.intervalo=setInterval(()=>ModoCocina.tick(),250);
  ModoCocina.pedirPantalla();
  ModoCocina.pintar();
  titulo.tabIndex=-1;
  titulo.focus({
    preventScroll:true
  })
},
cerrar(devolverFoco=true){
  const raiz=document.getElementById("modoCocina");
  if(ModoCocina.intervalo)clearInterval(ModoCocina.intervalo);
  ModoCocina.intervalo=null;
  ModoCocina.liberarPantalla();
  if(raiz)raiz.remove();
  document.body.classList.remove("cocina-abierta");
  const foco=ModoCocina.abrirDesde;
  ModoCocina.abrirDesde=null;
  ModoCocina.datos=null;
  if(devolverFoco&&foco&&foco.isConnected)try{foco.focus({
    preventScroll:true
  })}catch(e){}
},
// Screen Wake Lock: si el navegador no lo tiene o lo rechaza, no se muestra ningún error.
async pedirPantalla(){
  try{
    if(typeof navigator!=="undefined"&&navigator.wakeLock&&typeof navigator.wakeLock.request==="function"&&!ModoCocina.bloqueo){
      const b=await navigator.wakeLock.request("screen");
      if(ModoCocina.abierto())ModoCocina.bloqueo=b;
      else if(b&&b.release)b.release()
    }
  }catch(e){
  }
},
liberarPantalla(){
  const b=ModoCocina.bloqueo;
  ModoCocina.bloqueo=null;
  try{
    if(b&&typeof b.release==="function")Promise.resolve(b.release()).catch(()=>{})
  }catch(e){
  }
},
total(){
  return ModoCocina.datos?ModoCocina.datos.pasos.length:0
},
ir(i){
  if(!ModoCocina.datos)return;
  ModoCocina.indice=Math.max(0,Math.min(ModoCocina.total(),i));
  ModoCocina.pintar();
  const c=document.getElementById("cocinaCuerpo");
  if(c)c.scrollTop=0
},
pintar(){
  const d=ModoCocina.datos,cuerpo=document.getElementById("cocinaCuerpo"),barra=document.getElementById("cocinaBarra"),progreso=document.getElementById("cocinaProgreso");
  if(!d||!cuerpo)return;
  const i=ModoCocina.indice,n=ModoCocina.total(),ultimo=i===n,boton=(texto,clave,clase)=>{
    const b=ce("button","button "+(clase||"button--soft"),texto);
    b.type="button";
    b.dataset[clave]="";
    return b
  };
  cuerpo.replaceChildren();
  if(i===0){
    progreso.textContent="Ingredientes";
    cuerpo.append(ce("h3","cocina__subtitulo","Ingredientes"));
    if(!d.ingredientes.length)cuerpo.append(ce("p","cocina__paso","Esta comida no tiene ingredientes cargados."));
    d.ingredientes.forEach((texto,k)=>{
      const fila=ce("label","cocina__ingrediente"),cb=ce("input");
      cb.type="checkbox";
      cb.checked=ModoCocina.tildes.has(k);
      cb.dataset.cocinaIngrediente=String(k);
      cb.addEventListener("change",()=>{
        if(cb.checked)ModoCocina.tildes.add(k);else ModoCocina.tildes.delete(k);
        fila.classList.toggle("is-hecho",cb.checked)
      });
      fila.classList.toggle("is-hecho",cb.checked);
      fila.append(cb,ce("span",null,Ingredientes.textoLegible(texto)));
      cuerpo.append(fila)
    })
  }else{
    progreso.textContent=i+" de "+n;
    const texto=d.pasos[i-1];
    cuerpo.append(ce("p","cocina__paso",texto));
    const seg=ModoCocina.tiempoDePaso(texto);
    if(seg!==null)cuerpo.append(ModoCocina.cajaDeTiempo(i,seg));
    if(ultimo){
      const est=ce("p","cocina__estado");
      est.id="cocinaEstado";
      est.setAttribute("aria-live","polite");
      cuerpo.append(est)
    }
  }
  barra.replaceChildren();
  barra.classList.toggle("is-final",ultimo);
  if(ultimo){
    const comi=boton("🍽️ Lo comí","cocinaLoComi","button--primary");
    comi.id="cocinaLoComi";
    barra.append(comi,boton("Anterior","cocinaAnterior"),boton("Salir","cocinaSalir"))
  }else{
    const ant=boton("Anterior","cocinaAnterior"),sig=boton(i===0?"Empezar":"Siguiente","cocinaSiguiente","button--primary");
    ant.disabled=i===0;
    barra.append(ant,sig)
  }
},
// Temporizador de un paso: Iniciar, Pausar y Reiniciar. Al llegar a cero se ve "¡Listo!" y vibra donde el teléfono lo permite.
cajaDeTiempo(i,seg){
  const t=ModoCocina.temporizadores[i]||(ModoCocina.temporizadores[i]={
    total:seg,restante:seg,corriendo:false,fin:0,listo:false
  });
  const caja=ce("div","cocina__tiempo-caja"),visor=ce("p","cocina__tiempo",ModoCocina.textoDeTiempo(t)),filas=ce("div","cocina__tiempo-botones"),boton=(texto,clave)=>{
    const b=ce("button","button button--soft",texto);
    b.type="button";
    b.dataset[clave]=String(i);
    return b
  };
  visor.id="cocinaTiempo";
  visor.setAttribute("role","timer");
  visor.classList.toggle("is-listo",t.listo);
  const ini=boton("Iniciar","cocinaIniciar"),pau=boton("Pausar","cocinaPausar"),rei=boton("Reiniciar","cocinaReiniciar");
  ini.classList.replace("button--soft","button--primary");
  ini.disabled=t.corriendo||t.listo;
  pau.disabled=!t.corriendo;
  filas.append(ini,pau,rei);
  caja.append(ce("p","cocina__tiempo-rotulo","Temporizador"),visor,filas);
  return caja
},
textoDeTiempo(t){
  return t.listo?"¡Listo!":ModoCocina.formatoTiempo(t.restante)
},
iniciar(i){
  const t=ModoCocina.temporizadores&&ModoCocina.temporizadores[i];
  if(!t||t.corriendo||t.listo)return;
  t.corriendo=true;
  t.fin=ModoCocina.reloj()+t.restante*1000;
  ModoCocina.pintar()
},
pausar(i){
  const t=ModoCocina.temporizadores&&ModoCocina.temporizadores[i];
  if(!t||!t.corriendo)return;
  ModoCocina.tick();
  t.corriendo=false;
  ModoCocina.pintar()
},
reiniciar(i){
  const t=ModoCocina.temporizadores&&ModoCocina.temporizadores[i];
  if(!t)return;
  t.corriendo=false;
  t.listo=false;
  t.restante=t.total;
  ModoCocina.pintar()
},
// Cada 250 ms: actualiza los temporizadores que andan; al llegar a cero, "¡Listo!" y vibración.
tick(){
  const ts=ModoCocina.temporizadores;
  if(!ts)return;
  for(const [k,t] of Object.entries(ts)){
    if(!t.corriendo)continue;
    t.restante=Math.max(0,Math.ceil((t.fin-ModoCocina.reloj())/1000));
    if(t.restante<=0){
      t.corriendo=false;
      t.listo=true;
      try{if(typeof navigator.vibrate==="function")navigator.vibrate([400,200,400,200,400])}catch(e){}
      if(Number(k)===ModoCocina.indice)ModoCocina.pintar();
      else{
        const p=document.getElementById("cocinaProgreso");
        if(p)p.textContent=ModoCocina.indice+" de "+ModoCocina.total()+" · ¡Listo el paso "+k+"!"
      }
    }else if(Number(k)===ModoCocina.indice){
      const v=document.getElementById("cocinaTiempo");
      if(v)v.textContent=ModoCocina.textoDeTiempo(t)
    }
  }
},
// "Lo comí" del último paso: lo mismo que Lo comí desde la ficha (registro y, en las recetas, descuento de la Despensa).
loComi(){
  const d=ModoCocina.datos,estado=document.getElementById("cocinaEstado"),boton=document.getElementById("cocinaLoComi");
  if(!d)return;
  let texto="";
  try{
    if(d.origen==="plato"){
      const b=ce("button");
      b.type="button";
      b.hidden=true;
      b.dataset.cookSaved=d.id;
      document.body.append(b);
      b.click();
      b.remove();
      texto=document.getElementById("comidaEstado").textContent
    }else{
      document.getElementById("recipeReadCookNow").click();
      texto=document.getElementById("recipeReadStatus").textContent
    }
  }catch(e){
    texto=e.message
  }
  texto=texto.replace(/\s*Deshacer\s*$/,"").trim();
  if(estado)estado.textContent=texto||"Anotado.";
  if(boton&&texto&&!/No se pudo|Abrí|ya no/i.test(texto)){
    boton.disabled=true;
    boton.textContent="✓ Lo comí"
  }
}
};
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b||!b.dataset)return;
  const d=b.dataset;
  if(d.cocinaSalir!==undefined)return ModoCocina.cerrar();
  if(d.cocinaSiguiente!==undefined)return ModoCocina.ir(ModoCocina.indice+1);
  if(d.cocinaAnterior!==undefined)return ModoCocina.ir(ModoCocina.indice-1);
  if(d.cocinaIniciar!==undefined)return ModoCocina.iniciar(Number(d.cocinaIniciar));
  if(d.cocinaPausar!==undefined)return ModoCocina.pausar(Number(d.cocinaPausar));
  if(d.cocinaReiniciar!==undefined)return ModoCocina.reiniciar(Number(d.cocinaReiniciar));
  if(d.cocinaLoComi!==undefined)return ModoCocina.loComi()
});
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&ModoCocina.abierto())ModoCocina.cerrar()
});
// Si la pantalla vuelve a verse (el navegador suelta el bloqueo al ocultarla), se pide de nuevo.
document.addEventListener("visibilitychange",()=>{
  if(document.visibilityState==="visible"&&ModoCocina.abierto())ModoCocina.pedirPantalla()
});
// Las acciones de una receta (Editar, Duplicar, Lo comí…) se ven solo cuando se ve la receta.
(()=>{
  const vista=document.getElementById("recipeReadView"),acciones=document.getElementById("recipeReadAcciones");
  if(!vista||!acciones)return;
  const sincronizar=()=>{
    acciones.hidden=vista.hidden
  };
  new MutationObserver(sincronizar).observe(vista,{
    attributes:true,attributeFilter:["hidden"]
  });
  sincronizar()
})();
