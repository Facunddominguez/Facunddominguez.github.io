// Mi Plato Fácil · Copiar, compartir y crear la imagen del plato.
// Parte 9: los archivos se unen en orden según su número, que define el orden de arranque.
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como Compartir.nombre().
var Compartir={
txtOne(o){
  return o?o.name+(o.quantity?" ("+o.quantity+")":""):"No elegido"
},
txtNames(arr){
  return arr&&arr.length?arr.map(x=>x.name).join(", "):"No elegido"
},
plateLines(){
  const L=[];
  if(state.type==="desayuno"){
    L.push("Desayuno / Merienda");
    L.push("Fruta: "+(state.fruta?Compartir.txtOne({name:frutaTexto(state.fruta),quantity:state.fruta.quantity}):Compartir.txtOne(null)));
    L.push("Proteína: "+Compartir.txtOne(state.bfprot));
    L.push("Cereal: "+Compartir.txtOne(state.bfcarb));
    L.push("Grasa opcional: "+Compartir.txtOne(state.grasa))
  }else if(state.type==="plato"){
    const p=portions(),carbArr=merged(state.almidones,state.legCarb),protArr=merged(state.proteinas,state.legProt),carb=Armado.groupLabel("Almidones","Legumbres como almidón",state.almidones,state.legCarb),prot=Armado.groupLabel("Proteínas","Legumbres como proteína",state.proteinas,state.legProt);
    L.push("Almuerzo / Cena · "+state.day);
    L.push("Verduras ("+p.vegetables+"): "+Compartir.txtNames(state.verduras));
    L.push(carb+" ("+p.carbs+"): "+Compartir.txtNames(carbArr));
    L.push(prot+" ("+p.protein+"): "+Compartir.txtNames(protArr))
  }else if(state.type==="snack"){
    L.push("Snack");
    L.push(Compartir.txtOne(state.snack))
  }else{
    L.push("Pre-entreno");
    L.push(Compartir.txtOne(state.pre))
  }
  return L
},
typeEmoji(t){
  return t==="desayuno"?"🍳":t==="plato"?"🥗":t==="snack"?"🥜":"🏃"
},
plateText(){
  const L=Compartir.plateLines();
  return "🍽️ Mi plato fácil"+NL+L[0]+NL+L.slice(1).map(x=>"• "+x).join(NL)
},
fallbackCopy(text){
  try{
    const ta=document.createElement("textarea");
    ta.value=text;
    ta.setAttribute("readonly","");
    ta.style.position="absolute";
    ta.style.left="-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok=document.execCommand("copy");
    document.body.removeChild(ta);
    return ok
  }catch(e){
    return false
  }
},
copyPlate(){
  doCopy(Compartir.plateText()).then(ok=>shareStatus(ok?"¡Copiado! Ya podés pegarlo donde quieras.":"No se pudo copiar; seleccioná el texto manualmente."))
},
sharePlate(){
  const t=Compartir.plateText();
  if(navigator.share){
    navigator.share({
      title:"Mi plato fácil",text:t
    }).then(()=>shareStatus("¡Compartido!")).catch(e=>{
      if(e&&e.name==="AbortError")return;doCopy(t).then(ok=>shareStatus(ok?"Compartir no está disponible; copiamos el plato al portapapeles.":"No se pudo compartir ni copiar."))
    })
  }else{
    doCopy(t).then(ok=>shareStatus(ok?"Compartir no está disponible; copiamos el plato al portapapeles.":"No se pudo compartir ni copiar."))
  }
},
roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath()
},
wrapText(ctx,text,maxW){
  const words=String(text).split(" ");
  const out=[];
  let cur="";
  for(const w of words){
    const t=cur?cur+" "+w:w;
    if(ctx.measureText(t).width>maxW&&cur){
      out.push(cur);
      cur=w
    }else cur=t
  }
  if(cur)out.push(cur);
  return out
},
buildPlateCanvas(){
  const L=Compartir.plateLines(),title=L[0],items=L.slice(1);
  const W=1080,M=40,pad=64,dark=document.documentElement.getAttribute("data-theme")==="dark";
  const meas=document.createElement("canvas").getContext("2d");
  const maxW=W-M*2-pad*2;
  meas.font="800 44px system-ui,-apple-system,Segoe UI,Arial";
  const titleLines=Compartir.wrapText(meas,title,maxW);
  meas.font="600 34px system-ui,-apple-system,Segoe UI,Arial";
  const itemBlocks=items.map(it=>Compartir.wrapText(meas,it,maxW-40));
  const brandTop=M+96;
  const titleTop=brandTop+64;
  const titleH=titleLines.length*54;
  const contentTop=titleTop+titleH+22;
  let contentH=0;
  itemBlocks.forEach(b=>{
    contentH+=b.length*46+22
  });
  const H=contentTop+contentH+96;
  const c=document.createElement("canvas");
  c.width=W;
  c.height=H;
  const ctx=c.getContext("2d");
  ctx.fillStyle=dark?"#0b1110":"#0b6b57";
  ctx.fillRect(0,0,W,H);
  Compartir.roundRect(ctx,M,M,W-M*2,H-M*2,44);
  ctx.fillStyle=dark?"#141d1a":"#ffffff";
  ctx.fill();
  ctx.textBaseline="alphabetic";
  ctx.fillStyle=dark?"#57c8a4":"#0b6b57";
  ctx.font="800 44px system-ui,-apple-system,Segoe UI,Arial";
  ctx.fillText("🍽️ Mi plato fácil",M+pad,brandTop);
  ctx.fillStyle=dark?"#eef4f1":"#10201b";
  ctx.font="800 42px system-ui,-apple-system,Segoe UI,Arial";
  let ty=titleTop+38;
  titleLines.forEach(t=>{
    ctx.fillText(t,M+pad,ty);ty+=54
  });
  let y=contentTop+34;
  ctx.font="600 34px system-ui,-apple-system,Segoe UI,Arial";
  itemBlocks.forEach(b=>{
    b.forEach((t,i)=>{
      if(i===0){
        ctx.fillStyle=dark?"#57c8a4":"#0b6b57";ctx.fillText("•",M+pad,y)
      }ctx.fillStyle=dark?"#eef4f1":"#10201b";ctx.fillText(t,M+pad+34,y);y+=46
    });y+=22
  });
  ctx.fillStyle=dark?"#97a8a2":"#66756f";
  ctx.font="500 26px system-ui,-apple-system,Segoe UI,Arial";
  ctx.fillText("Armado con Mi plato fácil",M+pad,H-M-38);
  return c
},
// ---- Etapa 31: compartir la semana (esta o la que viene), como texto o como imagen ----
// "9 al 15 de nov" (o "26 de oct al 1 de nov" si cruza de mes).
rangoCorto(lunes){
  const a=new Date(lunes+"T12:00:00"),b=new Date(a);
  b.setDate(b.getDate()+6);
  const m=d=>["ene","feb","mar","abr","may","jun","jul","ago","sept","oct","nov","dic"][d.getMonth()];
  return a.getMonth()===b.getMonth()?a.getDate()+" al "+b.getDate()+" de "+m(b):a.getDate()+" de "+m(a)+" al "+b.getDate()+" de "+m(b)
},
// {titulo, dias:[{nombre, comidas:{desayuno, almuerzo, merienda, cena}}], total} de la semana que se está mirando (null si el total no se puede calcular).
semanaParaCompartir(){
  const prox=Semana.viendoProxima(),lunes=prox?Semana.lunesSiguiente():Semana.semanaActual(),plan=loadPlan(),byId=new Map(MisPlatos.loadSaved().map(p=>[p.id,p]));
  const dias=DAYS.map(([key,label],i)=>{
    const f=new Date(lunes+"T12:00:00");
    f.setDate(f.getDate()+i);
    const comidas={};
    for(const [slot] of SLOTS){
      const id=plan[key]&&plan[key][slot],it=id?byId.get(id):null;
      comidas[slot]=it?nombreCortoDeComida(it):""
    }
    return {nombre:label+" "+f.getDate(),comidas}
  });
  let total=null;
  try{
    if(typeof preciosActivos==="function"&&preciosActivos()&&preciosDataset()){
      // Esta semana: el mismo total que Semana y Compras. La que viene: con las comidas de su plan.
      const c=prox?(()=>{
        const grupos=[],personas=personasHogar();
        for(const [key] of DAYS)for(const [slot] of SLOTS){
          const id=plan[key]&&plan[key][slot],a=id?cantidadesDeComida("plato",id):null;
          if(a)grupos.push({rows:a.rows,factor:Semana.portionFactor(null,a)*personas})
        }
        return costoSemanaDeFilas(grupos)
      })():costoSemanaPlan();
      if(c&&c.total>0)total=c.total
    }
  }catch(e){
    total=null
  }
  return {titulo:"Mi semana · "+Compartir.rangoCorto(lunes),dias,total}
},
semanaTexto(){
  const s=Compartir.semanaParaCompartir(),lineas=["🍽️ "+s.titulo];
  for(const d of s.dias){
    lineas.push("","*"+d.nombre+"*");
    for(const [slot,label] of SLOTS)lineas.push(label+": "+(d.comidas[slot]||"—"))
  }
  if(s.total!==null)lineas.push("","*Total "+formatoPesos(s.total)+"*");
  return lineas.join(NL)
},
// PNG de 1080×1350 con el título, 7 filas (día, almuerzo y cena en nombre corto) y el total al pie. Sin fuentes ni imágenes externas.
buildSemanaCanvas(){
  const s=Compartir.semanaParaCompartir(),W=1080,H=1350,M=40,pad=56,dark=document.documentElement.getAttribute("data-theme")==="dark";
  const c=document.createElement("canvas");
  c.width=W;
  c.height=H;
  const ctx=c.getContext("2d"),fam="system-ui,-apple-system,Segoe UI,Arial";
  ctx.fillStyle=dark?"#0b1110":"#0b6b57";
  ctx.fillRect(0,0,W,H);
  Compartir.roundRect(ctx,M,M,W-M*2,H-M*2,44);
  ctx.fillStyle=dark?"#141d1a":"#ffffff";
  ctx.fill();
  ctx.textBaseline="alphabetic";
  ctx.fillStyle=dark?"#eef4f1":"#10201b";
  ctx.font="800 54px "+fam;
  ctx.fillText(s.titulo,M+pad,M+112);
  const recortar=(texto,fuente,maxW)=>{
    ctx.font=fuente;
    let t=texto||"—";
    if(ctx.measureText(t).width<=maxW)return t;
    while(t.length>1&&ctx.measureText(t+"…").width>maxW)t=t.slice(0,-1);
    return t.trimEnd()+"…"
  },top=M+160,fila=(H-M-110-top)/7,maxW=W-M*2-pad*2-34;
  s.dias.forEach((d,i)=>{
    const y=top+i*fila;
    if(i>0){
      ctx.fillStyle=dark?"#26332e":"#dfe9e5";
      ctx.fillRect(M+pad,y-14,W-M*2-pad*2,2)
    }
    ctx.fillStyle=dark?"#57c8a4":"#0b6b57";
    ctx.font="800 34px "+fam;
    ctx.fillText(d.nombre,M+pad,y+30);
    ctx.fillStyle=dark?"#eef4f1":"#10201b";
    ctx.fillText(recortar("🥗 "+d.comidas.almuerzo,"600 30px "+fam,maxW),M+pad+34,y+72);
    ctx.fillText(recortar("🌙 "+d.comidas.cena,"600 30px "+fam,maxW),M+pad+34,y+110)
  });
  ctx.fillStyle=dark?"#97a8a2":"#56655f";
  ctx.font="700 34px "+fam;
  ctx.fillText((s.total!==null?formatoPesos(s.total)+" · ":"")+"Mi Plato Fácil",M+pad,H-M-44);
  return c
},
compartirSemana(como){
  const estado=msg=>{try{planStatus(msg)}catch(e){}};
  if(como==="texto"){
    let t="";
    try{t=Compartir.semanaTexto()}catch(e){estado("No se pudo armar el texto de la semana.");return}
    if(navigator.share)navigator.share({title:"Mi semana",text:t}).then(()=>estado("¡Compartido!")).catch(e=>{
      if(e&&e.name==="AbortError")return;doCopy(t).then(ok=>estado(ok?"Compartir no está disponible; copiamos la semana.":"No se pudo compartir ni copiar."))
    });
    else doCopy(t).then(ok=>estado(ok?"Compartir no está disponible; copiamos la semana.":"No se pudo compartir ni copiar."));
    return
  }
  let canvas;
  try{canvas=Compartir.buildSemanaCanvas()}catch(e){estado("No se pudo generar la imagen.");return}
  const bajar=()=>{
    try{
      const a=document.createElement("a");
      a.href=canvas.toDataURL("image/png");
      a.download="mi-semana.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      estado("Imagen descargada 📷")
    }catch(e){
      estado("No se pudo descargar la imagen.")
    }
  };
  if(!canvas.toBlob){bajar();return}
  canvas.toBlob(blob=>{
    if(!blob){bajar();return}
    try{
      const file=new File([blob],"mi-semana.png",{type:"image/png"});
      if(navigator.canShare&&navigator.canShare({files:[file]})&&navigator.share)navigator.share({files:[file],title:"Mi semana"}).then(()=>estado("¡Imagen compartida!")).catch(e=>{
        if(e&&e.name==="AbortError")return;bajar()
      });
      else bajar()
    }catch(e){
      bajar()
    }
  },"image/png")
},
downloadCanvas(canvas){
  try{
    const url=canvas.toDataURL("image/png");
    const a=document.createElement("a");
    a.href=url;
    a.download="mi-plato.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    shareStatus("Imagen descargada 📷")
  }catch(e){
    shareStatus("No se pudo descargar la imagen.")
  }
},
shareImage(){
  if(!state.type){
    shareStatus("Primero armá un plato.");
    return
  }
  let canvas;
  try{
    canvas=Compartir.buildPlateCanvas()
  }catch(e){
    shareStatus("No se pudo generar la imagen.");
    return
  }
  if(!canvas.toBlob){
    Compartir.downloadCanvas(canvas);
    return
  }
  canvas.toBlob(function(blob){
    if(!blob){
      Compartir.downloadCanvas(canvas);return
    }try{
      const file=new File([blob],"mi-plato.png",{
        type:"image/png"
      });if(navigator.canShare&&navigator.canShare({
        files:[file]
      })&&navigator.share){
        navigator.share({
          files:[file],title:"Mi plato fácil"
        }).then(function(){
          shareStatus("¡Imagen compartida!")
        }).catch(function(e){
          if(e&&e.name==="AbortError")return;Compartir.downloadCanvas(canvas)
        })
      }else{
        Compartir.downloadCanvas(canvas)
      }
    }catch(e){
      Compartir.downloadCanvas(canvas)
    }
  },"image/png")
}
};
const NL=String.fromCharCode(10);
function doCopy(text){
  return new Promise(res=>{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=>res(true)).catch(()=>res(Compartir.fallbackCopy(text)))
    }else{
      res(Compartir.fallbackCopy(text))
    }
  })
}
let shareStatusTimer=null;
function shareStatus(msg){
  const s=document.getElementById("shareStatus");
  if(!s)return;
  s.textContent=msg;
  clearTimeout(shareStatusTimer);
  shareStatusTimer=setTimeout(()=>{
    s.textContent=""
  },3200)
}
