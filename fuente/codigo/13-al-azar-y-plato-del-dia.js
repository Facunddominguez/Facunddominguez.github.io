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
  });
  document.querySelectorAll(".almidones-mas").forEach(d=>{
    if(d.querySelector(".is-selected"))d.open=true
  })
}
function resetForRandom(t){
  Object.assign(state,{
    type:t,day:"",fruta:null,bfprot:null,bfcarb:null,grasa:null,pre:null,snack:null,verduras:[],almidones:[],proteinas:[],legCarb:[],legProt:[],replaceCarb:false,replaceProt:false,customPortions:null,nombreSugerido:""
  });
  stack=["home"];
  document.querySelectorAll(".choice.is-selected").forEach(e=>e.classList.remove("is-selected"));
  setReplace("carb",false);
  setReplace("prot",false)
}
// Almuerzo o cena al azar (desde la v15): una idea del catálogo o una comida tuya (36-sugerencias.js).
function randomPlato(){
  const dia=diaDeRutina(new Date()),s=elegirSugerencia("plato",Math.random,dia);
  if(!s)return false;
  cargarSugerencia(s,dia);
  return true
}
function randomDesayuno(){
  resetForRandom("desayuno");
  const fr=randPick(data.frutas);
  state.fruta={
    name:fr[0],quantity:fr[1],forma:randPick(data.frutaFormas)
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
  if(t==="desayuno")randomDesayuno();
  else if(!randomPlato()){
    const st=document.getElementById("azarStatus");
    if(st)st.textContent=avisoSinSugerencias();
    if(stack.at(-1)!=="azar")go("azar");
    return
  }
  lastRandomType=t;
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
// Plato del día: la misma sugerencia todo el día (azar con la fecha como semilla), con el día de la rutina.
function platoDelDia(){
  lastRandomType=null;
  const rnd=mulberry32(hashStr("plato_"+todayKey())),dia=diaDeRutina(new Date()),s=elegirSugerencia("plato",rnd,dia);
  if(!s){
    const st=document.getElementById("todayStatus");
    if(st)st.textContent=avisoSinSugerencias();
    return
  }
  cargarSugerencia(s,dia);
  go("resumen");
  shareStatus("🍽️ Plato del día · "+todayKey())
}
