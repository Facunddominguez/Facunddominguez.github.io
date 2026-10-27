// Mi Plato Fácil · Platos al azar y plato del día.
// Parte 14: los archivos se unen en orden según su número, que define el orden de arranque.
function randPick(a){
  return a[Math.floor(Math.random()*a.length)]
}
function sampleN(a,n){
  const c=a.slice(),out=[];
  while(out.length<n&&c.length){
    out.push(c.splice(Math.floor(Math.random()*c.length),1)[0])
  }
  return out
}
function syncMultiSelection(){
  [["verduras",state.verduras],["almidones",state.almidones],["proteinas",state.proteinas],["legCarb",state.legCarb],["legProt",state.legProt]].forEach(function(pair){
    const key=pair[0],arr=pair[1],names=new Set(arr.map(x=>x.name));document.querySelectorAll('[data-multi="'+key+'"]').forEach(b=>{
      const on=names.has(b.dataset.name);b.classList.toggle("is-selected",on);b.setAttribute("aria-pressed",String(on))
    })
  })
}
function resetForRandom(t){
  Object.assign(state,{
    type:t,day:"",fruta:null,bfprot:null,bfcarb:null,grasa:null,pre:null,snack:null,verduras:[],almidones:[],proteinas:[],legCarb:[],legProt:[],replaceCarb:false,replaceProt:false,customPortions:null
  });
  stack=["home"];
  document.querySelectorAll(".choice.is-selected").forEach(e=>e.classList.remove("is-selected"));
  setReplace("carb",false);
  setReplace("prot",false)
}
function randomPlato(){
  resetForRandom("plato");
  state.day=Math.random()<0.5?"Día de entrenamiento":"Día libre";
  state.verduras=sampleN(data.verduras,1+Math.floor(Math.random()*2)).map(n=>({
    name:n
  }));
  if(Math.random()<0.35){
    state.legCarb=[{
      name:randPick(data.legumbres)
    }];
    setReplace("carb",true)
  }else{
    state.almidones=[{
      name:randPick(data.almidones)
    }]
  }
  if(Math.random()<0.35){
    state.legProt=[{
      name:randPick(data.legumbres)
    }];
    setReplace("prot",true)
  }else{
    const mains=data.proteinas.filter(x=>x.indexOf("Opción ocasional:")!==0);
    state.proteinas=[{
      name:randPick(mains)
    }]
  }
  syncMultiSelection();
  updatePlate()
}
function randomDesayuno(){
  resetForRandom("desayuno");
  const fr=randPick(data.fruit);
  state.fruta={
    name:fr[0],quantity:fr[1]
  };
  const pr=randPick(data.bfprot);
  state.bfprot={
    name:pr[0],quantity:pr[1]
  };
  const cb=randPick(data.bfcarb);
  state.bfcarb={
    name:cb[0],quantity:cb[1]
  };
  if(Math.random()<0.5){
    const ft=randPick(data.bffat);
    state.grasa={
      name:ft[0],quantity:ft[1]
    }
  }else{
    state.grasa={
      name:"No sumo grasa"
    }
  }
}
function randomMeal(t){
  lastRandomType=t;
  if(t==="desayuno")randomDesayuno();
  else randomPlato();
  go("resumen");
  shareStatus("¡Sugerencia lista! Podés editarla, guardarla o compartirla.")
}
function hashStr(s){
  let h=2166136261;
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619)
  }
  return h>>>0
}
function mulberry32(a){
  return function(){
    a|=0;
    a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return((t^t>>>14)>>>0)/4294967296
  }
}
function todayKey(){
  const d=new Date();
  return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()
}
function pickR(rnd,a){
  return a[Math.floor(rnd()*a.length)]
}
function sampleNR(rnd,a,n){
  const c=a.slice(),out=[];
  while(out.length<n&&c.length){
    out.push(c.splice(Math.floor(rnd()*c.length),1)[0])
  }
  return out
}
function platoDelDia(){
  lastRandomType=null;
  resetForRandom("plato");
  const rnd=mulberry32(hashStr("plato_"+todayKey()));
  state.day=rnd()<0.5?"Día de entrenamiento":"Día libre";
  const training=trainingDayForDate(new Date());
  if(training!==null)state.day=training?"Día de entrenamiento":"Día libre";
  state.verduras=sampleNR(rnd,data.verduras,1+Math.floor(rnd()*2)).map(n=>({
    name:n
  }));
  if(rnd()<0.35){
    state.legCarb=[{
      name:pickR(rnd,data.legumbres)
    }];
    setReplace("carb",true)
  }else{
    state.almidones=[{
      name:pickR(rnd,data.almidones)
    }]
  }
  if(rnd()<0.35){
    state.legProt=[{
      name:pickR(rnd,data.legumbres)
    }];
    setReplace("prot",true)
  }else{
    const mains=data.proteinas.filter(x=>x.indexOf("Opción ocasional:")!==0);
    state.proteinas=[{
      name:pickR(rnd,mains)
    }]
  }
  syncMultiSelection();
  updatePlate();
  go("resumen");
  shareStatus("🍽️ Plato del día · "+todayKey())
}
