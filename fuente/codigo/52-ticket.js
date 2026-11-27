// Mi Plato Fácil · Foto del ticket (Ronda 6, Etapa 52). Solo con clave de Gemini guardada: en Compras realizadas aparece "Cargar ticket (foto)".
// La foto se achica en el teléfono (lado mayor de 1600 px, JPEG) antes de enviarse a Gemini (con el mismo manejo de errores y de modelos alternativos que
// el resto del asistente). La respuesta se muestra para revisar y NADA se guarda hasta tocar "Guardar". Guardar usa los formatos que ya existen: una
// Compra realizada (miPlatoFacil_purchases_v1), Mis precios (referencePrices_v1) y la Despensa (pantryQuantities_v1). No agrega claves ni va al respaldo.
// Parte 53: los archivos se unen en orden según su número, que define el orden de arranque.
var Ticket={
MAX_LADO:1600,
CALIDAD:0.85,
prompt(){
  return "Leé la foto de este ticket de compra de un comercio de Argentina y respondé SOLO un JSON con esta forma: {\"comercio\": texto o null, \"fecha\": \"AAAA-MM-DD\" o null, \"moneda\": \"ARS\", \"total\": número o null, \"productos\": [{\"nombre\": texto, \"cantidad\": número o null, \"unidad\": \"g\", \"kg\", \"ml\", \"l\" o \"unidad\" (o null si no se sabe), \"precio\": número}]}. \"precio\" es lo que se pagó por esa línea (no el precio por kilo). Usá punto como separador decimal y sin signos de moneda. Si una línea no se lee, salteala. Si la imagen no es un ticket, devolvé {\"productos\": []}."
},
// Abre el selector de fotos del teléfono (cámara o galería).
elegir(){
  const i=document.getElementById("ticketArchivo");
  if(!i)return;
  i.value="";
  i.click()
},
// → {mimeType:"image/jpeg", data (base64), ancho, alto} con el lado mayor de hasta 1600 px.
async achicar(archivo){
  if(!archivo||!/^image\//.test(archivo.type||""))throw Error("Eso no parece una foto. Elegí una imagen (JPG o PNG).");
  const url=URL.createObjectURL(archivo);
  try{
    const img=await new Promise((ok,no)=>{
      const im=new Image();
      im.onload=()=>ok(im);
      im.onerror=()=>no(Error("No pude abrir esa foto. Probá con otra."));
      im.src=url
    });
    const w0=img.naturalWidth,h0=img.naturalHeight;
    if(!w0||!h0)throw Error("No pude abrir esa foto. Probá con otra.");
    const k=Math.min(1,Ticket.MAX_LADO/Math.max(w0,h0)),w=Math.max(1,Math.round(w0*k)),h=Math.max(1,Math.round(h0*k)),c=document.createElement("canvas");
    c.width=w;
    c.height=h;
    const g=c.getContext("2d");
    g.fillStyle="#fff";
    g.fillRect(0,0,w,h);
    g.drawImage(img,0,0,w,h);
    const data=c.toDataURL("image/jpeg",Ticket.CALIDAD).split(",")[1];
    if(!data)throw Error("No pude preparar la foto. Probá con otra.");
    return {
      mimeType:"image/jpeg",data,ancho:w,alto:h
    }
  }finally{
    URL.revokeObjectURL(url)
  }
},
dinero(v){
  if(typeof v==="number")return Number.isFinite(v)&&v>0&&v<=10000000000?Math.round(v*100)/100:null;
  if(typeof v!=="string"||!v.trim())return null;
  try{
    return ComprasHechas.parseMoneyText(v.replace(/[^\d.,]/g,""),true,"x")
  }catch(e){
    return null
  }
},
// La respuesta de Gemini → {comercio, fecha, moneda, total, productos:[{nombre, cantidad, unidad, precio}]}; falla con un mensaje claro si no sirve.
leerRespuesta(texto){
  let o;
  try{
    o=AsistenteIA.aiParseJson(texto)
  }catch(e){
    throw Error("No pude leer el ticket: Gemini no devolvió los datos en el formato pedido. Probá con otra foto, más derecha y con buena luz.")
  }
  let lista=aiCampo(o,["productos","items","products","articulos","lineas"]);
  if(!Array.isArray(lista))lista=Array.isArray(o)?o:[];
  const productos=[];
  for(const x of lista.slice(0,100)){
    if(!x||typeof x!=="object")continue;
    const nombre=aiCleanText(aiCampo(x,["nombre","name","producto","descripcion","detalle"]),100);
    if(!nombre)continue;
    let cantidad=aiCampo(x,["cantidad","quantity","qty","cant"]),unidad=aiUnidad(aiCampo(x,["unidad","unit","medida"]));
    cantidad=cantidad===undefined?null:aiNumero(cantidad);
    if(!(cantidad>0&&cantidad<=1000000))cantidad=null;
    if(cantidad!==null&&!unidad)unidad="unidad";
    if(cantidad===null)unidad=null;
    productos.push({
      nombre,cantidad,unidad,precio:Ticket.dinero(aiCampo(x,["precio","price","importe","monto","total"]))
    })
  }
  if(!productos.length)throw Error("No encontré productos en la foto. Probá con una foto más cerca, derecha y con buena luz.");
  const hoy=Rutina.localTrainingDate(new Date());
  let fecha=aiCampo(o,["fecha","date"]);
  fecha=typeof fecha==="string"&&Rutina.validTrainingDate(fecha.trim())&&fecha.trim()<=hoy?fecha.trim():hoy;
  const moneda=String(aiCampo(o,["moneda","currency"])||"ARS").trim().toUpperCase();
  return {
    comercio:aiCleanText(aiCampo(o,["comercio","tienda","store","negocio"]),60),fecha,moneda:/^[A-Z]{3}$/.test(moneda)?moneda:"ARS",total:Ticket.dinero(aiCampo(o,["total","importe_total","totalpagado"])),productos
  }
},
// Ingredientes de la app con los que se puede relacionar un producto: los del catálogo de ideas, los de Mis precios, los de la Despensa y los de las recetas.
candidatos(){
  const out=new Map(),agregar=n=>{
    const t=aiCleanText(n,100),k=t?ingredientKey(t):"";
    if(k&&!out.has(k))out.set(k,t)
  };
  try{
    for(const i of data.menuCatalog.concat(data.desayunoCatalog||[]))for(const c of i.cantidades||[])agregar(c[0])
  }catch(e){}
  try{for(const p of Object.values(loadReferencePrices()))agregar(p.name)}catch(e){}
  try{for(const s of Object.values(loadStockQuantities()))agregar(s.name)}catch(e){}
  try{
    const am=loadRecipeAmounts();
    for(const a of Object.values(am))for(const r of a.rows||[])agregar(r.name)
  }catch(e){}
  return [...out.values()].sort((a,b)=>a.localeCompare(b,"es"))
},
// El ingrediente que mejor se parece al producto (todas sus palabras están en el nombre del producto), o null.
sugerir(nombre,lista){
  const pal=new Set(Ingredientes.ingredientNormal(nombre).split(" ")),ik=ingredientKey(nombre);
  let mejor=null,mejorN=0;
  for(const c of lista){
    const toks=Ingredientes.ingredientNormal(c).split(" ").filter(Boolean);
    if(!toks.length)continue;
    const igual=ingredientKey(c)===ik;
    if(!igual&&!toks.every(t=>pal.has(t)))continue;
    const n=igual?99:toks.length;
    if(n>mejorN||(n===mejorN&&mejor&&c.length<mejor.length)){
      mejor=c;
      mejorN=n
    }
  }
  return mejor
},
datos:null,
// Todo el camino: achicar, preguntarle a Gemini, leer la respuesta y mostrarla para revisar. No guarda nada.
async procesar(archivo){
  const st=document.getElementById("ticketEstado"),boton=document.getElementById("ticketCargar");
  const decir=t=>{
    if(st)st.textContent=t
  };
  if(!loadAiSettings().key){
    decir("Configurá tu clave de Gemini en Más → Asistente de IA.");
    return
  }
  if(boton)boton.disabled=true;
  try{
    decir("Preparando la foto…");
    const img=await Ticket.achicar(archivo);
    decir("Leyendo el ticket con Gemini…");
    const respuesta=await AsistenteIA.geminiGenerate(Ticket.prompt(),img);
    Ticket.revisar(Ticket.leerRespuesta(respuesta));
    decir("")
  }catch(e){
    decir(e.message||"No se pudo leer el ticket.")
  }finally{
    if(boton)boton.disabled=false
  }
},
// La hoja para revisar: datos del ticket, un renglón por producto (con su ingrediente relacionado) y los tres tildes. Nada se guarda todavía.
revisar(datos){
  Ticket.datos=datos;
  const lista=Ticket.candidatos(),campo=(texto,el)=>{
    const l=ce("label","purchase-campo");
    l.append(document.createTextNode(texto),el);
    return l
  },input=(id,valor,tipo)=>{
    const i=ce("input");
    i.type="text";
    i.id=id;
    i.value=valor;
    if(tipo)i.inputMode=tipo;
    return i
  };
  const encabezado=ce("div","home-group"),f=ce("div","portion-field"),fl=ce("label",null,"Fecha (DD/MM/AAAA)");
  fl.htmlFor="ticketFecha";
  f.append(fl,input("ticketFecha",typedAppDateLabel(datos.fecha),"numeric"));
  const c=ce("div","portion-field"),cl=ce("label",null,"Comercio");
  cl.htmlFor="ticketComercio";
  c.append(cl,input("ticketComercio",datos.comercio));
  const m=ce("div","portion-field"),ml=ce("label",null,"Moneda");
  ml.htmlFor="ticketMoneda";
  m.append(ml,input("ticketMoneda",datos.moneda));
  const t=ce("div","portion-field"),tl=ce("label",null,"Total del ticket");
  tl.htmlFor="ticketTotal";
  t.append(tl,input("ticketTotal",datos.total===null?"":String(datos.total).replace(".",","),"decimal"));
  encabezado.append(f,c,m,t);
  const filas=ce("div",null);
  filas.id="ticketFilas";
  datos.productos.forEach((p,i)=>{
    const fila=ce("div","purchase-row ticket-fila"),nombre=ce("input"),rm=ce("button","button button--danger","×"),cant=ce("input"),uni=ce("select"),pre=ce("input"),rel=ce("select");
    nombre.type="text";
    nombre.maxLength=100;
    nombre.value=p.nombre;
    nombre.dataset.ticketNombre="";
    nombre.setAttribute("aria-label","Producto");
    rm.type="button";
    rm.dataset.ticketQuitar="";
    rm.setAttribute("aria-label","Quitar "+p.nombre);
    cant.type="text";
    cant.inputMode="decimal";
    cant.value=p.cantidad===null?"":String(p.cantidad).replace(".",",");
    cant.dataset.ticketCantidad="";
    cant.setAttribute("aria-label","Cantidad");
    const nada=ce("option",null,"—");
    nada.value="";
    uni.append(nada);
    for(const u of RECIPE_AMOUNT_UNITS){
      const o=ce("option",null,u);
      o.value=u;
      uni.append(o)
    }
    uni.value=p.unidad||"";
    uni.dataset.ticketUnidad="";
    uni.setAttribute("aria-label","Unidad");
    pre.type="text";
    pre.inputMode="decimal";
    pre.value=p.precio===null?"":String(p.precio).replace(".",",");
    pre.dataset.ticketPrecio="";
    pre.setAttribute("aria-label","Precio pagado");
    const no=ce("option",null,"No relacionar");
    no.value="";
    rel.append(no);
    const sug=Ticket.sugerir(p.nombre,lista);
    for(const n of lista){
      const o=ce("option",null,n);
      o.value=n;
      rel.append(o)
    }
    rel.value=sug||"";
    rel.dataset.ticketRelacion="";
    rel.setAttribute("aria-label","Ingrediente de la app con el que se relaciona");
    fila.append(nombre,rm,campo("Cantidad",cant),campo("Unidad",uni),campo("Precio",pre),campo("Se relaciona con",rel));
    filas.append(fila)
  });
  const suma=ce("p","purchase-suma");
  suma.id="ticketSuma";
  suma.setAttribute("aria-live","polite");
  const tilde=(id,texto)=>{
    const l=ce("label","interruptor purchase-opcion"),i=ce("input");
    i.type="checkbox";
    i.id=id;
    i.checked=true;
    i.setAttribute("role","switch");
    l.htmlFor=id;
    l.append(i,ce("span",null,texto));
    return l
  };
  hoja.abrir({
    titulo:"Revisá el ticket",contenido:[ce("p","screen__hint","Corregí lo que haga falta. No se guarda nada hasta que toques Guardar."),encabezado,filas,suma,tilde("ticketGuardarCompra","Guardar como compra realizada"),tilde("ticketActualizarPrecios","Actualizar Mis precios (los relacionados)"),tilde("ticketSumarDespensa","Sumar a la Despensa (los relacionados)")],botones:[["Guardar","button--primary",()=>Ticket.guardar()]],foco:false
  });
  Ticket.pintarSuma()
},
// Lo que dice el renglón y la hoja, leído de la pantalla.
leerHoja(){
  const date=SemanasFechadas.parseTypedAppDate(document.getElementById("ticketFecha").value);
  if(!date)throw Error("Ingresá la fecha del ticket.");
  if(date>Rutina.localTrainingDate(new Date()))throw Error("La fecha no puede ser futura.");
  const moneda=document.getElementById("ticketMoneda").value.trim().toUpperCase();
  if(!/^[A-Z]{3}$/.test(moneda))throw Error("Usá una moneda de 3 letras, por ejemplo ARS.");
  const total=ComprasHechas.parseMoneyText(document.getElementById("ticketTotal").value,false,"Total del ticket"),items=[],relacionados=[];
  for(const fila of document.querySelectorAll("#ticketFilas .ticket-fila")){
    const nombre=fila.querySelector("[data-ticket-nombre]").value.trim(),q=fila.querySelector("[data-ticket-cantidad]").value.trim(),unidad=fila.querySelector("[data-ticket-unidad]").value||null,pre=fila.querySelector("[data-ticket-precio]").value.trim();
    if(!nombre&&!q&&!pre)continue;
    if(!nombre)throw Error("Cada producto necesita un nombre.");
    const cantidad=q?recipeAmountNumber(q,true):null;
    if(cantidad!==null&&!unidad)throw Error("Elegí la unidad de "+nombre+".");
    items.push({
      name:nombre.slice(0,100),quantity:cantidad,unit:cantidad===null?null:unidad,price:ComprasHechas.parseMoneyText(pre,true,"Precio de "+nombre)
    });
    relacionados.push(fila.querySelector("[data-ticket-relacion]").value||null)
  }
  if(!items.length)throw Error("No quedó ningún producto para guardar.");
  return {
    compra:{
      date,store:document.getElementById("ticketComercio").value.trim().slice(0,60),currency:moneda,total,items
    },relacionados
  }
},
pintarSuma(){
  const el=document.getElementById("ticketSuma");
  if(!el)return;
  const fmt=n=>n.toLocaleString("es-AR",{
    minimumFractionDigits:2,maximumFractionDigits:2
  }),moneda=(document.getElementById("ticketMoneda").value.trim().toUpperCase()||"ARS");
  let suma=0,con=0;
  for(const f of document.querySelectorAll("#ticketFilas .ticket-fila")){
    const t=f.querySelector("[data-ticket-precio]").value.trim();
    if(!t)continue;
    try{
      suma+=ComprasHechas.parseMoneyText(t,true,"Precio")||0;
      con++
    }catch(e){
    }
  }
  let texto="Suma de las filas: "+fmt(suma)+" "+moneda+" ("+con+" con precio)";
  try{
    const total=ComprasHechas.parseMoneyText(document.getElementById("ticketTotal").value,true,"Total");
    if(total!==null){
      const dif=Math.round((total-suma)*100)/100;
      texto="Total del ticket: "+fmt(total)+" "+moneda+" · "+texto+(dif===0?" · coincide.":" · "+(dif>0?"faltan ":"sobran ")+fmt(Math.abs(dif))+" "+moneda+".")
    }
  }catch(e){
  }
  el.textContent=texto
},
// "Guardar": cada parte con su tilde (compra realizada, Mis precios y Despensa de lo relacionado).
guardar(){
  const {
    compra,relacionados
  }=Ticket.leerHoja(),compraOn=document.getElementById("ticketGuardarCompra").checked,preciosOn=document.getElementById("ticketActualizarPrecios").checked,despensaOn=document.getElementById("ticketSumarDespensa").checked;
  if(!compraOn&&!preciosOn&&!despensaOn)throw Error("Tildá al menos una parte para guardar.");
  const r=ComprasHechas.guardarCompra(compra,{
    precios:preciosOn,despensa:despensaOn,relacionados,sinCompra:!compraOn
  });
  const partes=[];
  if(compraOn)partes.push("Compra registrada");
  if(r.count)partes.push(r.count+" precios actualizados");
  if(r.priceError)partes.push("no se pudieron guardar los precios");
  if(r.stockAdded)partes.push(r.stockAdded+" productos sumados a la Despensa");
  if(r.stockError)partes.push(r.stockError);
  hoja.cerrar();
  Ticket.datos=null;
  const st=document.getElementById("purchaseStatus");
  if(st)st.textContent=(partes.join(" · ")||"Listo")+".";
  try{ComprasHechas.renderPurchases()}catch(e){}
  try{renderCompras()}catch(e){}
  try{refrescarPrecios()}catch(e){}
  return r
}
};
document.addEventListener("click",e=>{
  const b=e.target.closest&&e.target.closest("button");
  if(!b||!b.dataset)return;
  if(b.dataset.ticketCargar!==undefined)return Ticket.elegir();
  if(b.dataset.ticketQuitar!==undefined){
    const f=b.closest(".ticket-fila");
    if(f)f.remove();
    Ticket.pintarSuma()
  }
});
document.addEventListener("input",e=>{
  const t=e.target;
  if(t&&(t.id==="ticketTotal"||t.id==="ticketMoneda"||(t.dataset&&t.dataset.ticketPrecio!==undefined)))Ticket.pintarSuma()
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t&&t.id==="ticketArchivo"&&t.files&&t.files[0])Ticket.procesar(t.files[0])
});
