// Mi Plato Fácil · Platos al azar y plato del día.
// Parte 14: los archivos se unen en orden según su número, que define el orden de arranque.
// Almuerzo o cena al azar (desde la v15): una idea del catálogo o una comida tuya (36-sugerencias.js).
// Funciones de este archivo, agrupadas (Etapa 18). El resto de la app las llama como AlAzar.nombre().
const AlAzar={
randPick(a){
  return a[Math.floor(Math.random()*a.length)]
},
sampleN(a,n){
  const c=a.slice(),out=[];
  while(out.length<n&&c.length){
    out.push(c.splice(Math.floor(Math.random()*c.length),1)[0])
  }
  return out
},
syncMultiSelection(){
  [["verduras",state.verduras],["almidones",state.almidones],["proteinas",state.proteinas],["legCarb",state.legCarb],["legProt",state.legProt]].forEach(function(pair){
    const key=pair[0],arr=pair[1],names=new Set(arr.map(x=>x.name));document.querySelectorAll('[data-multi="'+key+'"]').forEach(b=>{
      const on=names.has(b.dataset.name);b.classList.toggle("is-selected",on);b.setAttribute("aria-pressed",String(on))
    })
  });
  document.querySelectorAll(".almidones-mas").forEach(d=>{
    if(d.querySelector(".is-selected"))d.open=true
  })
},
resetForRandom(t){
  armadoDestino=null;
  Object.assign(state,{
    type:t,day:"",fruta:null,bfprot:null,bfcarb:null,grasa:null,pre:null,snack:null,verduras:[],almidones:[],proteinas:[],legCarb:[],legProt:[],replaceCarb:false,replaceProt:false,customPortions:null,nombreSugerido:""
  });
  stack=["home"];
  document.querySelectorAll(".choice.is-selected").forEach(e=>e.classList.remove("is-selected"));
  Armado.setReplace("carb",false);
  Armado.setReplace("prot",false)
},
randomPlato(){
  const dia=diaDeRutina(new Date()),s=elegirSugerencia("plato",Math.random,dia);
  if(!s)return false;
  cargarSugerencia(s,dia);
  return true
},
randomDesayuno(){
  AlAzar.resetForRandom("desayuno");
  const fr=AlAzar.randPick(data.frutas);
  state.fruta={
    name:fr[0],quantity:fr[1],forma:AlAzar.randPick(data.frutaFormas)
  };
  const pr=AlAzar.randPick(data.bfprot);
  state.bfprot={
    name:pr[0],quantity:pr[1]
  };
  const cb=AlAzar.randPick(data.bfcarb);
  state.bfcarb={
    name:cb[0],quantity:cb[1]
  };
  if(Math.random()<0.5){
    const ft=AlAzar.randPick(data.bffat);
    state.grasa={
      name:ft[0],quantity:ft[1]
    }
  }else{
    state.grasa={
      name:"No sumo grasa"
    }
  }
},
randomMeal(t){
  if(t==="desayuno")AlAzar.randomDesayuno();
  else if(!AlAzar.randomPlato()){
    const st=document.getElementById("azarStatus");
    if(st)st.textContent=avisoSinSugerencias();
    if(stack.at(-1)!=="azar")go("azar");
    return
  }
  lastRandomType=t;
  go("resumen");
  shareStatus("¡Sugerencia lista! Podés editarla, guardarla o compartirla.")
},
hashStr(s){
  let h=2166136261;
  for(let i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=Math.imul(h,16777619)
  }
  return h>>>0
},
mulberry32(a){
  return function(){
    a|=0;
    a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15,1|a);
    t=t+Math.imul(t^t>>>7,61|t)^t;
    return((t^t>>>14)>>>0)/4294967296
  }
},
todayKey(){
  const d=new Date();
  return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate()
},
sampleNR(rnd,a,n){
  const c=a.slice(),out=[];
  while(out.length<n&&c.length){
    out.push(c.splice(Math.floor(rnd()*c.length),1)[0])
  }
  return out
},
semillaDelDia(comida){
  return AlAzar.mulberry32(AlAzar.hashStr("plato_"+Rutina.localTrainingDate(new Date())+(comida==="cena"?"_cena":"")))
},
sugerenciaDelDia(comida){
  return elegirSugerencia(comida==="cena"?"cena":"plato",AlAzar.semillaDelDia(comida),diaDeRutina(new Date()))
},
platoDelDia(){
  lastRandomType=null;
  const dia=diaDeRutina(new Date()),s=AlAzar.sugerenciaDelDia("almuerzo");
  if(!s){
    const st=document.getElementById("todayStatus");
    if(st)st.textContent=avisoSinSugerencias();
    return
  }
  cargarSugerencia(s,dia);
  go("resumen");
  shareStatus("🍽️ Plato del día · "+AlAzar.todayKey())
}
};
function pickR(rnd,a){
  return a[Math.floor(rnd()*a.length)]
}
// Plato del día: la misma sugerencia todo el día (azar con la fecha como semilla), con el día de la rutina. Desde la
// v15.2 es la primera propuesta de "Sugerime algo" en el almuerzo; la cena suma la comida a la semilla.
