// Mi Plato Fácil · Hoy anticipa (Ronda 6, Etapa 50): "Para mañana" (lo que hay que dejar listo la noche anterior) y "Para comprar hoy".
// Las palabras que disparan cada aviso están en datos/avisos-hoy.json (se incrustan al construir): legumbres secas, carne/pollo/pescado y pasos que
// dicen marinar o "de un día para otro". miPlatoFacil_hoyAvisos_v1 = {"fecha": "AAAA-MM-DD", "hechos": ["legumbres", …]}: los avisos que marcaste
// "Listo" hoy (al día siguiente se ignora y vuelven a aparecer los que corresponden). Es opcional en el respaldo.
// Parte 51: los archivos se unen en orden según su número, que define el orden de arranque.
var HOY_AVISOS_KEY="miPlatoFacil_hoyAvisos_v1";
var HOY_AVISOS_DATOS=__DATOS_AVISOS_HOY__;
var HoyAnticipa={
validAvisos(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===2&&Rutina.validTrainingDate(o.fecha)&&Array.isArray(o.hechos)&&o.hechos.length<=40&&o.hechos.every(x=>typeof x==="string"&&x.length>0&&x.length<=120)
},
hoyClave(){
  return Rutina.localTrainingDate(new Date())
},
// Los avisos "Listo" de hoy (los de otro día no cuentan).
hechos(){
  try{
    const o=JSON.parse(localStorage.getItem(HOY_AVISOS_KEY)||"null");
    return HoyAnticipa.validAvisos(o)&&o.fecha===HoyAnticipa.hoyClave()?new Set(o.hechos):new Set()
  }catch(e){
    return new Set()
  }
},
marcarListo(id){
  const set=HoyAnticipa.hechos();
  set.add(String(id).slice(0,120));
  const o={
    fecha:HoyAnticipa.hoyClave(),hechos:[...set].slice(-40)
  };
  if(!HoyAnticipa.validAvisos(o))throw Error("No se pudo guardar.");
  localStorage.setItem(HOY_AVISOS_KEY,JSON.stringify(o))
},
// Las comidas (guardadas) de un día: de hoy, o de mañana. Mañana de un domingo es el lunes de la semana que viene.
comidasDe(cual){
  const dia=todayPlanDay(),byId=new Map(MisPlatos.loadSaved().map(p=>[p.id,p]));
  let plan,d=dia;
  if(cual==="manana"){
    d=diaSiguienteDelPlan(dia);
    plan=dia==="domingo"?Semana.planDeLaSemana("proxima"):loadPlan()
  }else plan=loadPlan();
  return HOY_COMIDAS.map(s=>plan[d]&&plan[d][s]?byId.get(plan[d][s]):null).filter(Boolean)
},
palabras(texto){
  return normalizeSearchText(String(texto||"")).split(/[^a-z0-9ñ]+/).filter(Boolean)
},
// ¿El nombre dice alguna de las palabras (completa, o en singular)? Sin las palabras de "excluir" (latas, cocidos, fiambres…).
coincide(nombre,palabras,excluir){
  const t=normalizeSearchText(String(nombre||""));
  if((excluir||[]).some(x=>t.includes(x)))return null;
  const ws=HoyAnticipa.palabras(nombre);
  return palabras.find(p=>ws.includes(p)||ws.includes(p.replace(/s$/,"")))||null
},
// [{id, texto}] con lo que mañana pide hacer hoy a la noche. Sin nada para anticipar, la lista queda vacía.
paraManana(){
  const D=HOY_AVISOS_DATOS,hechos=HoyAnticipa.hechos(),items=HoyAnticipa.comidasDe("manana"),out=[],leg=[],carnes=[],marinar=[],pal=Object.keys(D.legumbres.palabras);
  let recetas=null;
  const enPasos=(pasos,palabras,sin)=>pasos.some(p=>{
    const t=normalizeSearchText(String(p));
    return palabras.some(w=>t.includes(w))&&!(sin&&sin.some(w=>t.includes(w)))
  });
  for(const it of items){
    // Los pasos: los de la receta o los de la idea del catálogo (una comida armada no tiene).
    let pasos=[];
    if(it.recipeSourceId){
      try{
        if(!recetas)recetas=loadRecipeDetails();
        const r=recetas[it.recipeSourceId];
        if(r&&Array.isArray(r.steps))pasos=r.steps
      }catch(e){
      }
    }else{
      try{
        const idea=IdeasHoja.ideaDeComida(it);
        if(idea&&Array.isArray(idea.pasos))pasos=idea.pasos
      }catch(e){
      }
    }
    // Con pasos, una legumbre avisa solo si la preparación habla de remojar (las de lata o ya cocidas no); sin pasos, avisa siempre.
    const remoja=!pasos.length||enPasos(pasos,D.legumbres.remojo);
    for(const n of Semana.extractIngredients(it)){
      const l=remoja?HoyAnticipa.coincide(n,pal,D.legumbres.excluir):null;
      if(l&&!leg.includes(l))leg.push(l);
      const c=HoyAnticipa.coincide(n,D.congelados.palabras,D.congelados.excluir);
      if(c&&!carnes.includes(c))carnes.push(c)
    }
    // "Dejá los porotos en remojo toda la noche" ya lo cubre el aviso de las legumbres.
    if(enPasos(pasos,D.pasos.palabras,D.legumbres.remojo))marinar.push(it)
  }
  const unir=a=>a.length>1?a.slice(0,-1).join(", ")+" y "+a.at(-1):a[0];
  if(leg.length&&!hechos.has("legumbres"))out.push({
    id:"legumbres",texto:"Poné en remojo "+unir(leg.map(l=>D.legumbres.palabras[l]+" "+l))+" esta noche."
  });
  if(carnes.length&&!hechos.has("congelados"))out.push({
    id:"congelados",texto:"Si están en el freezer, pasalos a la heladera: "+unir(carnes)+"."
  });
  for(const it of marinar){
    const id="marinar:"+HoyAnticipa.palabras(mealName(it)).join("-").slice(0,100);
    if(!hechos.has(id))out.push({
      id,texto:"Dejá preparado para mañana: "+mealName(it)+" lleva marinado o descanso de un día para otro."
    })
  }
  return out
},
// Ingredientes de las comidas de hoy que no están en la Despensa ni tachados (o comprados) en la lista de esta semana.
paraComprarHoy(){
  const tengo=MarcasDespensa.pantryMarkedMatcher(),stock=new Set(Object.values(loadStockQuantities()).filter(s=>s.quantity>0).map(s=>ingredientKey(s.name))),marcas=Compras.marcasDeSemana(Compras.loadShoppingChecks(),Compras.shoppingChecksWeek()),vistos=new Set(),out=[];
  for(const it of HoyAnticipa.comidasDe("hoy")){
    for(const n of Semana.extractIngredients(it)){
      const nombre=String(n).trim();
      if(!nombre||fueraDeLaLista(nombre))continue;
      const k=ingredientKey(nombre);
      if(!k||vistos.has(k))continue;
      vistos.add(k);
      if(tengo.has(nombre)||stock.has(k)||marcas.t.has(k)||marcas.c.has(k))continue;
      const corto=Compras.nombreCorto(nombre);
      out.push(corto.charAt(0).toLowerCase()+corto.slice(1))
    }
  }
  return out
},
texto(nombres){
  const a=nombres.length>3?nombres.slice(0,3).concat("otros "+(nombres.length-3)):nombres;
  return a.length>1?a.slice(0,-1).join(", ")+" y "+a.at(-1):a[0]
},
pintar(){
  const caja=document.getElementById("hoyAvisos");
  if(!caja)return;
  let manana=[],comprar=[];
  try{manana=HoyAnticipa.paraManana()}catch(e){}
  try{comprar=HoyAnticipa.paraComprarHoy()}catch(e){}
  const hijos=[];
  if(manana.length){
    const sec=ce("section","hoy-aviso"),t=ce("p","settings-label","Para mañana"),ul=ce("ul","hoy-aviso__lista");
    t.id="hoyAvisoManana";
    sec.setAttribute("aria-labelledby","hoyAvisoManana");
    sec.dataset.hoyAvisoManana="";
    for(const a of manana){
      const li=ce("li","hoy-aviso__fila"),b=ce("button","button button--soft","Listo");
      b.type="button";
      b.dataset.hoyAvisoListo=a.id;
      b.setAttribute("aria-label","Listo: "+a.texto);
      li.append(ce("span","hoy-aviso__texto",a.texto),b);
      ul.append(li)
    }
    sec.append(t,ul);
    hijos.push(sec)
  }
  if(comprar.length){
    const sec=ce("section","hoy-aviso hoy-aviso--comprar"),b=ce("button","button button--soft","Ver en la lista");
    sec.dataset.hoyComprarHoy="";
    b.type="button";
    b.dataset.hoyVerLista="";
    sec.append(ce("p","hoy-aviso__texto","Para comprar hoy: "+HoyAnticipa.texto(comprar)),b);
    hijos.push(sec)
  }
  caja.replaceChildren(...hijos);
  caja.hidden=!hijos.length
}
};
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b||!b.dataset)return;
  if(b.dataset.hoyAvisoListo){
    try{
      HoyAnticipa.marcarListo(b.dataset.hoyAvisoListo)
    }catch(err){
      const st=document.getElementById("todayStatus");
      if(st)st.textContent=err.message
    }
    HoyAnticipa.pintar();
    return
  }
  if(b.dataset.hoyVerLista!==undefined){
    // Las comidas de hoy son de esta semana: si la lista estaba en "La semana que viene", se pasa a "Esta semana" para verlas.
    try{
      if(Compras.periodoActual()==="proxima")Compras.elegirPeriodo("esta")
    }catch(err){
    }
    renderCompras();
    go("compras")
  }
});
