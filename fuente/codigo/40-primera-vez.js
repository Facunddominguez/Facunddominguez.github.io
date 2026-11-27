// Mi Plato Fácil · Primera vez (v15.3): cuatro pantallas (el método del plato, la rutina opcional, personas y presupuesto opcionales y elegir de 3 a 5
// ideas para arrancar). Es una pantalla más del recorrido ("bienvenida"), no una capa.
// Parte 41: los archivos se unen en orden según su número, que define el orden de arranque.
// Se abre sola al cargar solo si no hay comidas, recetas ni plan y no existe la marca miPlatoFacil_bienvenida_v1.
// La marca ({"vista":true}) se escribe solo al tocar Saltar o "Armar mi semana"; mirar la bienvenida no escribe nada.
// Va en el respaldo como módulo opcional (18-respaldo-completo.js): al restaurar en otro teléfono no vuelve a aparecer.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Bienvenida.nombre().
var Bienvenida={
bienvenidaVista(){
  try{
    return Respaldo.validBienvenida(JSON.parse(localStorage.getItem(BIENVENIDA_KEY)||"null"))
  }catch(e){
    return false
  }
},
marcarBienvenidaVista(){
  if(Bienvenida.bienvenidaVista())return true;
  try{
    localStorage.setItem(BIENVENIDA_KEY,JSON.stringify({
      vista:true
    }));
    return true
  }catch(e){
    return false
  }
},
esUsuarioNuevo(){
  if(Bienvenida.bienvenidaVista())return false;
  try{
    if(MisPlatos.loadSaved().length)return false;
    if(Object.keys(loadRecipeDetails()).length)return false
  }catch(e){
    return false
  }
  const plan=loadPlan();
  return !DAYS.some(([d])=>SLOTS.some(([s])=>plan[d]&&plan[d][s]))
},
ideasParaArrancar(){
  // Etapa 29: las 8 ideas de almuerzo o cena más baratas por porción que pasan los filtros de dieta, con al menos 4 proteínas base
  // distintas (carne, pollo, huevo, legumbres, pescado o queso). Sin precios, las primeras del catálogo que pasan los filtros.
  const evitar=typeof recipeAvoidTerms==="function"?recipeAvoidTerms():[];
  const pasan=data.menuCatalog.filter(x=>(!evitar.length||!evitar.some(t=>normalizeSearchText(x.text).includes(t)))&&(typeof textoPermitido!=="function"||textoPermitido(textoDeIdea(x))));
  let costos=null;
  try{costos=new Map(pasan.map(x=>[x,Bienvenida.costoPorPorcionDeIdea(x)]))}catch(e){}
  if(!costos||pasan.every(x=>costos.get(x)===null))return pasan.slice(0,8);
  const base=x=>Bienvenida.proteinaBaseDeIdea(x),orden=pasan.filter(x=>costos.get(x)!==null).sort((a,b)=>costos.get(a)-costos.get(b));
  const elegidas=[],bases=new Set();
  // Primero la más barata de cada proteína base (hasta 4 distintas); después, las más baratas que falten.
  for(const x of orden){
    const b=base(x);
    if(b&&!bases.has(b)&&bases.size<4){bases.add(b);elegidas.push(x)}
  }
  for(const x of orden)if(elegidas.length<8&&!elegidas.includes(x))elegidas.push(x);
  return elegidas.sort((a,b)=>costos.get(a)-costos.get(b)).slice(0,8)
},
// ≈ costo de una porción de una idea (una persona), o null si no hay precios o cantidades.
costoPorPorcionDeIdea(idea){
  if(!Array.isArray(idea.cantidades)||typeof preciosActivos!=="function"||!preciosActivos()||!preciosDataset())return null;
  const c=costoDeFilas(idea.cantidades.map(([name,quantity,unit])=>({name,quantity,unit})),1);
  // Con un ingrediente sin precio ni estimado el costo quedaría subestimado: mejor no dar costo.
  return c.costo>0&&!c.sinPrecio?c.costo:null
},
// Proteína base de una idea: carne, pollo, pescado, legumbres, huevo o queso (la primera que aparece en sus cantidades).
proteinaBaseDeIdea(idea){
  const nombres=(idea.cantidades||[]).map(c=>normalizeSearchText(c[0]));
  for(const [b,re] of [["carne",/^carne/],["pollo",/^pollo/],["pescado",/^(merluza|atun|salmon)/],["legumbres",/^(lenteja|garbanzo|poroto)/],["huevo",/^huevo/],["queso",/^queso/]])if(nombres.some(n=>re.test(n)))return b;
  return null
},
pintarBienvenida(){
  // v19.10 (R5-O-01): antes de los 4 pasos hay una presentación de tres tarjetas (paso 0), que se puede saltear.
  document.querySelectorAll("#bienvenida [data-bienvenida-paso]").forEach(p=>{
    p.hidden=bienvenidaIntro?Number(p.dataset.bienvenidaPaso)!==0:Number(p.dataset.bienvenidaPaso)!==bienvenidaPaso
  });
  document.getElementById("bienvenidaPaso").textContent=bienvenidaIntro?"Bienvenida":"Paso "+bienvenidaPaso+" de 4";
  document.querySelectorAll("#bienvenida [data-bienvenida-tarjeta]").forEach(t=>{
    t.hidden=Number(t.dataset.bienvenidaTarjeta)!==bienvenidaTarjeta+1
  });
  document.querySelectorAll("#bienvenida .bienvenida__puntos span").forEach((p,i)=>p.classList.toggle("is-activo",i===bienvenidaTarjeta));
  document.getElementById("bienvenidaTarjetaPos").textContent=(bienvenidaTarjeta+1)+" de 3";
  document.getElementById("bienvenidaTarjetaSig").textContent=bienvenidaTarjeta===2?"Empezar":"Siguiente";
  Bienvenida.pintarEvitar();
  document.querySelectorAll("#bienvenidaDias [data-bienvenida-dia]").forEach(b=>{
    const on=bienvenidaDias.has(Number(b.dataset.bienvenidaDia));b.classList.toggle("is-selected",on);b.setAttribute("aria-pressed",String(on))
  });
  const box=document.getElementById("bienvenidaIdeas");
  box.replaceChildren(...Bienvenida.ideasParaArrancar().map(idea=>{
    const b=ce("button","filter-chip",idea.corto||idea.text),on=bienvenidaIdeas.includes(idea.text);
    b.type="button";
    b.dataset.bienvenidaIdea=idea.text;
    b.classList.toggle("is-selected",on);
    b.setAttribute("aria-pressed",String(on));
    return b
  }));
  const n=bienvenidaIdeas.length;
  document.querySelector("#bienvenida [data-bienvenida-armar]").disabled=n<3;
  document.getElementById("bienvenidaIdeasEstado").textContent=n?"Elegiste "+n+" de 5."+(n<3?" Elegí al menos 3.":""):"Con estas ideas te armo la semana enseguida."
},
// v19.10 (R5-O-02): "Ingredientes a evitar" (la dieta y "Otros") dentro del paso 3. Solo se guarda al tocar "Guardar y seguir".
pintarEvitar(){
  const box=document.getElementById("bienvenidaDieta");
  if(!box||typeof dietaTabla!=="function")return;
  box.replaceChildren(...dietaTabla().map(f=>{
    const on=bienvenidaDieta.has(f.id),b=ce("button","filter-chip"+(on?" is-selected":""),f.nombre);
    b.type="button";b.dataset.bienvenidaDieta=f.id;b.setAttribute("aria-pressed",String(on));
    return b
  }))
},
guardarEvitarDeBienvenida(){
  const palabras=document.getElementById("bienvenidaOtros").value.trim();
  if(bienvenidaDieta.size){
    const activos=typeof dietaFiltros==="function"?dietaFiltros():[];
    Dieta.guardarDietaFiltros([...new Set([...activos,...bienvenidaDieta])])
  }
  if(palabras){
    localStorage.setItem(RECIPE_PREF_KEY,JSON.stringify({words:palabras.slice(0,400),enabled:true}));
    const campo=document.getElementById("recipeAvoidWords"),ocultar=document.getElementById("recipeApplyAvoid");
    if(campo)campo.value=palabras.slice(0,400);
    if(ocultar)ocultar.checked=true
  }
  if(typeof Dieta!=="undefined")Dieta.renderDieta()
},
abrirBienvenida(){
  bienvenidaIntro=true;
  bienvenidaTarjeta=0;
  bienvenidaDieta=new Set();
  bienvenidaPaso=1;
  bienvenidaIdeas=[];
  const rutina=Rutina.loadTrainingWeek();
  bienvenidaDias=new Set(rutina?rutina.days:[]);
  if(stack.at(-1)!=="bienvenida")go("bienvenida");
  Bienvenida.pintarBienvenida()
},
terminarBienvenida(destino){
  Bienvenida.marcarBienvenidaVista();
  try{RespaldoAviso.pedirPersistencia()}catch(e){}
  // La pila de Hoy vuelve a su raíz (home) antes de cambiar de pestaña: si no, Hoy recordaba el paso 4 de la bienvenida (Etapa 25).
  restart();
  if(destino==="semana")openTab("semana")
},
armarSemanaDesdeBienvenida(){
  if(bienvenidaIdeas.length<3)return;
  for(const texto of bienvenidaIdeas){
    const idea=IdeasHoja.ideaPorTexto(texto);
    if(idea)IdeasHoja.guardarIdea(idea)
  }
  Bienvenida.terminarBienvenida("semana");
  // El botón dice "Armar mi semana": la arma de verdad (con las ideas elegidas primero) y deja el aviso con Deshacer.
  try{
    if(typeof ArmameSemana!=="undefined"&&ArmameSemana.huecosVacios()>0){
      const elegidas=new Set(bienvenidaIdeas.map(t=>normalizeSearchText(t)));
      const ids=MisPlatos.loadSaved().filter(x=>!x.deLaSemana&&elegidas.has(normalizeSearchText(mealName(x)))).map(x=>x.id);
      ArmameSemana.correr("vacios",ids)
    }
  }catch(e){
  }
},
guardarHogarDeBienvenida(){
  const st=document.getElementById("bienvenidaHogarEstado"),personas=Number(document.getElementById("bienvenidaPersonas").value),
    raw=document.getElementById("bienvenidaPresupuesto").value.trim(),region=document.getElementById("bienvenidaRegion").value;
  let limite=null;
  if(raw){
    limite=Number(raw.replace(/\./g,"").replace(",","."));
    if(!Number.isFinite(limite)||limite<=0||limite>100000000000){
      st.textContent="El presupuesto tiene que ser un número mayor que 0. Si no querés cargarlo, dejalo vacío.";
      return
    }
  }
  try{
    // Etapa 51: con chicos, se guarda quién come en casa (un chico cuenta media porción); sin chicos, lo de siempre.
    const chicos=Number(document.getElementById("bienvenidaChicos").value)||0;
    if(typeof Comensales!=="undefined"&&Comensales.configurado())Comensales.cambiar({adultos:personas,chicos});
    else if(chicos>0&&typeof Comensales!=="undefined")Comensales.guardar({adultos:personas,chicos,porcionChico:0.5,huecos:{}});
    else if(personas>1)guardarPersonasHogar(personas);
    Bienvenida.guardarEvitarDeBienvenida();
    if(limite!==null)localStorage.setItem(SHOP_BUDGET_KEY,JSON.stringify({currency:"ARS",limit:limite,period:"semana"}));
    if(region!=="GBA"||localStorage.getItem(REGION_PRECIOS_KEY)!==null)guardarRegionPrecios(region);
    if(typeof renderHogar==="function")renderHogar();
    if(typeof renderRegionPrecios==="function")renderRegionPrecios();
    bienvenidaPaso=4;
    Bienvenida.pintarBienvenida()
  }catch(e){
    st.textContent="No se pudo guardar. Podés cargarlo después en Preferencias."
  }
},
guardarRutinaDeBienvenida(){
  const st=document.getElementById("bienvenidaRutinaEstado");
  try{
    localStorage.setItem(TRAINING_KEY,JSON.stringify({
      version:1,days:[...bienvenidaDias]
    }));
    Rutina.renderTrainingWeek();
    bienvenidaPaso=3;
    Bienvenida.pintarBienvenida()
  }catch(e){
    st.textContent="No se pudo guardar la rutina. Podés cargarla después en Más → Mi rutina."
  }
}
};
var BIENVENIDA_KEY="miPlatoFacil_bienvenida_v1";
var bienvenidaPaso=1;
var bienvenidaIntro=true;
var bienvenidaTarjeta=0;
var bienvenidaDieta=new Set();
var bienvenidaDias=new Set();
var bienvenidaIdeas=[];
// Usuario nuevo: sin comidas ni recetas guardadas, con el plan vacío y sin la marca.
// Las ideas para arrancar: almuerzos y cenas del catálogo, las 8 primeras que respetan lo que evitás.
// "Armar mi semana": guarda las ideas elegidas como comidas (sin duplicar), abre la Semana y la arma con Armame la semana.
// Paso opcional (Etapa 14): personas, presupuesto semanal y región de precios. Solo se guarda lo que se cargó; no cargar nada deja todo como estaba.
document.getElementById("bienvenida").addEventListener("click",e=>{
  const b=e.target.closest("button");
  if(!b)return;
  const d=b.dataset;
  try{
    if(d.bienvenidaTarjetaSig!==undefined){
      if(bienvenidaTarjeta<2)bienvenidaTarjeta++;else{bienvenidaIntro=false;bienvenidaPaso=1}
      Bienvenida.pintarBienvenida()
    }else if(d.bienvenidaIntroSaltar!==undefined){
      bienvenidaIntro=false;bienvenidaPaso=1;Bienvenida.pintarBienvenida()
    }else if(d.bienvenidaDieta!==undefined){
      if(bienvenidaDieta.has(d.bienvenidaDieta))bienvenidaDieta.delete(d.bienvenidaDieta);else bienvenidaDieta.add(d.bienvenidaDieta);Bienvenida.pintarEvitar()
    }else if(d.bienvenidaSiguiente!==undefined){
      if(bienvenidaIntro){bienvenidaIntro=false;bienvenidaPaso=1}
      bienvenidaPaso=Math.min(4,bienvenidaPaso+1);Bienvenida.pintarBienvenida()
    }else if(d.bienvenidaSaltar!==undefined)Bienvenida.terminarBienvenida("hoy");
    else if(d.bienvenidaDia!==undefined){
      const n=Number(d.bienvenidaDia);if(bienvenidaDias.has(n))bienvenidaDias.delete(n);else bienvenidaDias.add(n);Bienvenida.pintarBienvenida()
    }else if(d.bienvenidaRutina!==undefined)Bienvenida.guardarRutinaDeBienvenida();
    else if(d.bienvenidaHogar!==undefined)Bienvenida.guardarHogarDeBienvenida();
    else if(d.bienvenidaIdea!==undefined){
      const i=bienvenidaIdeas.indexOf(d.bienvenidaIdea);if(i>=0)bienvenidaIdeas.splice(i,1);else if(bienvenidaIdeas.length<5)bienvenidaIdeas.push(d.bienvenidaIdea);Bienvenida.pintarBienvenida()
    }else if(b.id==="bienvenidaOtrosInfo"){
      const ayuda=document.getElementById("bienvenidaOtrosAyuda"),on=ayuda.hidden;
      ayuda.hidden=!on;b.setAttribute("aria-expanded",String(on))
    }else if(d.bienvenidaArmar!==undefined)Bienvenida.armarSemanaDesdeBienvenida()
  }catch(err){
    document.getElementById("bienvenidaIdeasEstado").textContent=err.message
  }
});
// Las tarjetas también se pasan con el dedo: un deslizamiento a la izquierda pasa a la siguiente y a la derecha vuelve a la anterior.
{
  let x0=null;
  const caja=document.getElementById("bienvenidaTarjetas");
  caja.addEventListener("touchstart",e=>{x0=e.changedTouches[0].clientX},{passive:true});
  caja.addEventListener("touchend",e=>{
    if(x0===null)return;
    const dx=e.changedTouches[0].clientX-x0;
    x0=null;
    if(Math.abs(dx)<40)return;
    if(dx<0&&bienvenidaTarjeta<2)bienvenidaTarjeta++;
    else if(dx>0&&bienvenidaTarjeta>0)bienvenidaTarjeta--;
    else return;
    Bienvenida.pintarBienvenida()
  },{passive:true})
}
document.addEventListener("click",e=>{
  if(e.target.closest&&e.target.closest("[data-ver-bienvenida]"))Bienvenida.abrirBienvenida()
});
// Al cargar: solo para un usuario nuevo (corre después de init(), así Hoy ya está pintado debajo).
try{
  if(Bienvenida.esUsuarioNuevo())Bienvenida.abrirBienvenida()
}catch(e){
}
