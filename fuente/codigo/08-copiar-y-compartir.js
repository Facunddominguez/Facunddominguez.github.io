// Mi Plato Fácil · Copiar, compartir y crear la imagen del plato.
// Parte 9: los archivos se unen en orden según su número, que define el orden de arranque.
function txtOne(o){
  return o?o.name+(o.quantity?" ("+o.quantity+")":""):"No elegido"
}
function txtNames(arr){
  return arr&&arr.length?arr.map(x=>x.name).join(", "):"No elegido"
}
const NL=String.fromCharCode(10);
function plateLines(){
  const L=[];
  if(state.type==="desayuno"){
    L.push("Desayuno / Merienda");
    L.push("Fruta: "+txtOne(state.fruta));
    L.push("Proteína: "+txtOne(state.bfprot));
    L.push("Cereal: "+txtOne(state.bfcarb));
    L.push("Grasa opcional: "+txtOne(state.grasa))
  }else if(state.type==="plato"){
    const p=portions(),carbArr=merged(state.almidones,state.legCarb),protArr=merged(state.proteinas,state.legProt),carb=groupLabel("Almidones","Legumbres como almidón",state.almidones,state.legCarb),prot=groupLabel("Proteínas","Legumbres como proteína",state.proteinas,state.legProt);
    L.push("Almuerzo / Cena · "+state.day);
    L.push("Verduras ("+p.vegetables+"): "+txtNames(state.verduras));
    L.push(carb+" ("+p.carbs+"): "+txtNames(carbArr));
    L.push(prot+" ("+p.protein+"): "+txtNames(protArr))
  }else if(state.type==="snack"){
    L.push("Snack");
    L.push(txtOne(state.snack))
  }else{
    L.push("Pre-entreno");
    L.push(txtOne(state.pre))
  }
  return L
}
function typeEmoji(t){
  return t==="desayuno"?"🍳":t==="plato"?"🥗":t==="snack"?"🥜":"🏃"
}
function plateText(){
  const L=plateLines();
  return "🍽️ Mi plato fácil"+NL+L[0]+NL+L.slice(1).map(x=>"• "+x).join(NL)
}
function doCopy(text){
  return new Promise(res=>{
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=>res(true)).catch(()=>res(fallbackCopy(text)))
    }else{
      res(fallbackCopy(text))
    }
  })
}
function fallbackCopy(text){
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
function copyPlate(){
  doCopy(plateText()).then(ok=>shareStatus(ok?"¡Copiado! Ya podés pegarlo donde quieras.":"No se pudo copiar; seleccioná el texto manualmente."))
}
function sharePlate(){
  const t=plateText();
  if(navigator.share){
    navigator.share({
      title:"Mi plato fácil",text:t
    }).then(()=>shareStatus("¡Compartido!")).catch(e=>{
      if(e&&e.name==="AbortError")return;doCopy(t).then(ok=>shareStatus(ok?"Compartir no está disponible; copiamos el plato al portapapeles.":"No se pudo compartir ni copiar."))
    })
  }else{
    doCopy(t).then(ok=>shareStatus(ok?"Compartir no está disponible; copiamos el plato al portapapeles.":"No se pudo compartir ni copiar."))
  }
}
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath()
}
function wrapText(ctx,text,maxW){
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
}
function buildPlateCanvas(){
  const L=plateLines(),title=L[0],items=L.slice(1);
  const W=1080,M=40,pad=64,dark=document.documentElement.getAttribute("data-theme")==="dark";
  const meas=document.createElement("canvas").getContext("2d");
  const maxW=W-M*2-pad*2;
  meas.font="800 44px system-ui,-apple-system,Segoe UI,Arial";
  const titleLines=wrapText(meas,title,maxW);
  meas.font="600 34px system-ui,-apple-system,Segoe UI,Arial";
  const itemBlocks=items.map(it=>wrapText(meas,it,maxW-40));
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
  roundRect(ctx,M,M,W-M*2,H-M*2,44);
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
}
function downloadCanvas(canvas){
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
}
function shareImage(){
  if(!state.type){
    shareStatus("Primero armá un plato.");
    return
  }
  let canvas;
  try{
    canvas=buildPlateCanvas()
  }catch(e){
    shareStatus("No se pudo generar la imagen.");
    return
  }
  if(!canvas.toBlob){
    downloadCanvas(canvas);
    return
  }
  canvas.toBlob(function(blob){
    if(!blob){
      downloadCanvas(canvas);return
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
          if(e&&e.name==="AbortError")return;downloadCanvas(canvas)
        })
      }else{
        downloadCanvas(canvas)
      }
    }catch(e){
      downloadCanvas(canvas)
    }
  },"image/png")
}
