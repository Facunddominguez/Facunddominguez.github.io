// Mi Plato Fácil · Quién come en cada comida (Ronda 6, Etapa 51): adultos y chicos, y cuántos comen en casa en cada comida de la semana.
// miPlatoFacil_comensales_v1 = {"adultos": 2, "chicos": 1, "porcionChico": 0.5, "huecos": {"lunes|almuerzo": 1, "sabado|cena": 0}}:
// las porciones de cada comida son adultos + chicos × porcionChico (2,5 con 2 adultos y 1 chico); un hueco con un número usa ese número
// (0 = nadie come en casa: no suma). "huecos" es opcional. Es opcional en el respaldo. Sin esta clave, todo sigue como antes:
// miPlatoFacil_hogar_v1 ({"personas": n}) es el total para todas las comidas.
// Parte 52: los archivos se unen en orden según su número, que define el orden de arranque.
var COMENSALES_KEY="miPlatoFacil_comensales_v1";
var Comensales={
PORCIONES_CHICO:[0.25,0.5,0.75,1],
redondear(n){
  return Math.round(n*100)/100
},
validComensales(o){
  if(!o||typeof o!=="object"||Array.isArray(o)||Object.keys(o).some(k=>!["adultos","chicos","porcionChico","huecos"].includes(k)))return false;
  if(!Number.isInteger(o.adultos)||o.adultos<1||o.adultos>12||!Number.isInteger(o.chicos)||o.chicos<0||o.chicos>12)return false;
  if(o.porcionChico!==undefined&&!(typeof o.porcionChico==="number"&&o.porcionChico>=0.25&&o.porcionChico<=1))return false;
  if(o.huecos!==undefined){
    if(!o.huecos||typeof o.huecos!=="object"||Array.isArray(o.huecos)||Object.keys(o.huecos).length>28)return false;
    if(!Object.entries(o.huecos).every(([k,v])=>SemanaAjustes.validHueco(k)&&Number.isInteger(v)&&v>=0&&v<=12))return false
  }
  return true
},
// Lo guardado (con sus valores por omisión) o null si no hay nada o no se entiende.
leer(){
  try{
    const raw=localStorage.getItem(COMENSALES_KEY);
    if(raw===null)return null;
    const o=JSON.parse(raw);
    if(!Comensales.validComensales(o))return null;
    return {
      adultos:o.adultos,chicos:o.chicos,porcionChico:o.porcionChico===undefined?0.5:o.porcionChico,huecos:{
        ...(o.huecos||{})
      }
    }
  }catch(e){
    return null
  }
},
configurado(){
  return Comensales.leer()!==null
},
// Las porciones de una comida común: adultos + chicos × lo que cuenta cada chico. Sin la clave nueva, las personas del hogar de siempre.
base(){
  const c=Comensales.leer();
  return c?Comensales.redondear(c.adultos+c.chicos*c.porcionChico):null
},
// Las porciones de esa comida de esa semana (la del hueco si se cargó, si no la común).
porcionesEn(dia,slot){
  const c=Comensales.leer();
  if(!c)return personasHogar();
  const h=c.huecos[dia+"|"+slot];
  return h!==undefined?h:Comensales.redondear(c.adultos+c.chicos*c.porcionChico)
},
// Lo que se usaba antes de esta etapa donde no se multiplicaba por las personas (presupuesto de la lista): 1 si no hay nada cargado.
factorEn(dia,slot){
  return Comensales.configurado()?Comensales.porcionesEn(dia,slot):1
},
nadieEn(dia,slot){
  const c=Comensales.leer();
  return !!c&&c.huecos[dia+"|"+slot]===0
},
guardar(c){
  const o={
    adultos:c.adultos,chicos:c.chicos,porcionChico:c.porcionChico
  };
  const h=Object.fromEntries(Object.entries(c.huecos||{}).filter(([,v])=>v!==undefined&&v!==null));
  if(Object.keys(h).length)o.huecos=h;
  if(!Comensales.validComensales(o))throw Error("No se pudo guardar.");
  localStorage.setItem(COMENSALES_KEY,JSON.stringify(o))
},
// Cambia una parte y guarda. Si todavía no había nada cargado, parte de las personas del hogar de siempre.
cambiar(cambio){
  const c=Comensales.leer()||{
    adultos:personasHogar(),chicos:0,porcionChico:0.5,huecos:{
    }
  };
  Comensales.guardar({
    ...c,...cambio
  });
  Comensales.refrescar()
},
cambiarHueco(dia,slot,valor){
  const c=Comensales.leer()||{
    adultos:personasHogar(),chicos:0,porcionChico:0.5,huecos:{
    }
  },k=dia+"|"+slot;
  if(valor===null)delete c.huecos[k];
  else c.huecos[k]=valor;
  Comensales.guardar(c);
  Comensales.refrescar()
},
// "Almuerzos de lunes a viernes: N" (null = todos).
atajoAlmuerzos(valor){
  const c=Comensales.leer()||{
    adultos:personasHogar(),chicos:0,porcionChico:0.5,huecos:{
    }
  };
  for(const d of ["lunes","martes","miercoles","jueves","viernes"]){
    if(valor===null)delete c.huecos[d+"|almuerzo"];
    else c.huecos[d+"|almuerzo"]=valor
  }
  Comensales.guardar(c);
  Comensales.refrescar()
},
// Preferencias → "Quién come en casa": una hoja con adultos, chicos, lo que cuenta un chico, el atajo de los almuerzos y la grilla.
abrir(){
  const campo=(id,texto)=>{
    const c=ce("div","portion-field"),l=ce("label",null,texto),sel=ce("select");
    sel.id=id;
    l.htmlFor=id;
    c.append(l,sel);
    return c
  };
  const grilla=ce("div","comensales-grilla");
  grilla.id="comensalesGrilla";
  grilla.setAttribute("role","group");
  grilla.setAttribute("aria-label","Cuántos comen en casa en cada comida");
  const total=ce("p","screen__hint"),estado=ce("p","screen__hint");
  total.id="comensalesTotal";
  estado.id="comensalesEstado";
  estado.setAttribute("aria-live","polite");
  hoja.abrir({
    titulo:"Quién come en casa",contenido:[campo("hogarPersonas","Adultos"),campo("comensalesChicos","Chicos"),campo("comensalesPorcionChico","Un chico cuenta"),total,campo("comensalesAtajo","Almuerzos de lunes a viernes"),grilla,estado],botones:[],foco:false
  });
  Comensales.pintar()
},
// La línea de Preferencias: "2 adultos y 1 chico · 2,5 porciones" (o "3 personas" si solo está lo de siempre).
resumen(){
  const el=document.getElementById("comensalesResumen");
  if(!el)return;
  const c=Comensales.leer(),n=(x,uno,varios)=>x+" "+(x===1?uno:varios),f=x=>String(x).replace(".",",");
  if(!c){
    const p=personasHogar();
    el.textContent=n(p,"persona","personas");
    return
  }
  const b=Comensales.base();
  el.textContent=n(c.adultos,"adulto","adultos")+(c.chicos?" y "+n(c.chicos,"chico","chicos"):"")+" · "+f(b)+(b===1?" porción":" porciones")+(Object.keys(c.huecos).length?" · con comidas ajustadas":"")
},
refrescar(){
  Comensales.pintar();
  Comensales.resumen();
  for(const f of [()=>renderCompras(),()=>renderToday(),()=>renderPlan(),()=>refrescarPrecios()])try{f()}catch(e){}
},
pintar(){
  const adultos=document.getElementById("hogarPersonas"),chicos=document.getElementById("comensalesChicos"),porcion=document.getElementById("comensalesPorcionChico"),grilla=document.getElementById("comensalesGrilla");
  if(!grilla)return;
  const c=Comensales.leer();
  Comensales.resumen();
  if(adultos){
    if(!adultos.options.length)for(let i=1;i<=12;i++){
      const o=ce("option",null,String(i));
      o.value=String(i);
      adultos.append(o)
    }
    adultos.value=String(c?c.adultos:personasHogar())
  }
  if(chicos){
    if(!chicos.options.length)for(let i=0;i<=12;i++){
      const o=ce("option",null,String(i));
      o.value=String(i);
      chicos.append(o)
    }
    chicos.value=String(c?c.chicos:0)
  }
  if(porcion){
    if(!porcion.options.length)for(const v of Comensales.PORCIONES_CHICO){
      const o=ce("option",null,String(v).replace(".",",")+(v===1?" porción":" de porción"));
      o.value=String(v);
      porcion.append(o)
    }
    porcion.value=String(c?c.porcionChico:0.5)
  }
  const total=document.getElementById("comensalesTotal");
  if(total){
    const b=c?Comensales.base():personasHogar();
    total.textContent="Cada comida cuenta "+String(b).replace(".",",")+(b===1?" porción.":" porciones.")+" En la grilla, – es que comen todos."
  }
  const opciones=(corto)=>{
    const out=[],todos=ce("option",null,corto?"–":"Todos");
    todos.value="";
    out.push(todos);
    for(let i=0;i<=12;i++){
      const o=ce("option",null,String(i));
      o.value=String(i);
      out.push(o)
    }
    return out
  };
  const atajo=document.getElementById("comensalesAtajo");
  if(atajo){
    if(!atajo.options.length)atajo.append(...opciones());
    const v=new Set(["lunes","martes","miercoles","jueves","viernes"].map(d=>c&&c.huecos[d+"|almuerzo"]!==undefined?String(c.huecos[d+"|almuerzo"]):""));
    atajo.value=v.size===1?[...v][0]:""
  }
  const nadie=[];
  const encabezado=ce("div","comensales-fila comensales-fila--cab");
  encabezado.append(ce("span"),...["desayuno","almuerzo","merienda","cena"].map(s=>ce("span","comensales-fila__slot",Semana.planSlotName(s))));
  grilla.replaceChildren(encabezado,...DAYS.map(([d,nombre])=>{
    const fila=ce("div","comensales-fila");
    const dia=ce("span","comensales-fila__dia",nombre.slice(0,3));
    dia.setAttribute("aria-label",nombre);
    fila.append(dia);
    for(const s of ["desayuno","almuerzo","merienda","cena"]){
      const sel=ce("select","comensales-fila__sel");
      sel.append(...opciones(true));
      sel.dataset.comensalesHueco=d+"|"+s;
      sel.value=c&&c.huecos[d+"|"+s]!==undefined?String(c.huecos[d+"|"+s]):"";
      sel.setAttribute("aria-label",Semana.planSlotName(s)+" del "+nombre.toLowerCase()+": cuántos comen en casa");
      if(sel.value==="0")nadie.push(Semana.planSlotName(s).toLowerCase()+" del "+nombre.toLowerCase());
      fila.append(sel)
    }
    return fila
  }));
  const est=document.getElementById("comensalesEstado");
  if(est)est.textContent=nadie.length?"Nadie come en casa: "+nadie.join(", ")+".":""
}
};
document.addEventListener("change",e=>{
  const t=e.target;
  if(!t||!t.id&&!t.dataset)return;
  const st=document.getElementById("comensalesEstado"),falla=err=>{
    if(st)st.textContent=err.message||"No se pudo guardar."
  };
  try{
    if(t.id==="hogarPersonas")return CantidadesPlatos.cambiarPersonasHogar(t.value);
    if(t.id==="comensalesChicos")return Comensales.cambiar({chicos:Number(t.value)});
    if(t.id==="comensalesPorcionChico")return Comensales.cambiar({porcionChico:Number(t.value)});
    if(t.id==="comensalesAtajo")return Comensales.atajoAlmuerzos(t.value===""?null:Number(t.value));
    if(t.dataset&&t.dataset.comensalesHueco){
      const [d,s]=t.dataset.comensalesHueco.split("|");
      return Comensales.cambiarHueco(d,s,t.value===""?null:Number(t.value))
    }
  }catch(err){
    falla(err)
  }
});
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(b&&b.dataset&&b.dataset.comensalesAbrir!==undefined)Comensales.abrir()
});
try{Comensales.resumen()}catch(e){}
