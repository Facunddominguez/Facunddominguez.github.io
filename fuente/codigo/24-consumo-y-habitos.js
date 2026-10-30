// Mi Plato Fácil · Registro de consumo y metas de hábitos.
// Parte 25: los archivos se unen en orden según su número, que define el orden de arranque.
const CONSUMPTION_KEY="miPlatoFacil_consumption_v1",HABIT_GOALS_KEY="miPlatoFacil_habitGoals_v1",CONSUMPTION_MEALS=["desayuno","almuerzo","merienda","cena","otra"],FOOD_GROUPS=["verduras","legumbres","pescado","fruta","almidones","proteinas"],HABIT_GROUPS=["verduras","legumbres","pescado","fruta"],FISH_WORDS=["pescado","merluza","atun","salmon","sardina","caballa","lenguado","trucha"];
let consumptionWeek=null;
function validConsumption(a){
  return Array.isArray(a)&&a.length<=2000&&a.every(x=>!!x&&typeof x==="object"&&typeof x.id==="string"&&x.id.length>0&&x.id.length<=80&&validTrainingDate(x.date)&&CONSUMPTION_MEALS.includes(x.meal)&&typeof x.title==="string"&&x.title.trim().length>0&&x.title.length<=120&&Array.isArray(x.groups)&&x.groups.every(g=>FOOD_GROUPS.includes(g))&&(x.sourceId===null||typeof x.sourceId==="string"&&x.sourceId.length<=200)&&typeof x.planned==="boolean")
}
function loadConsumption(){
  try{
    const a=JSON.parse(localStorage.getItem(CONSUMPTION_KEY)||"[]");
    return validConsumption(a)?a:[]
  }catch(e){
    return []
  }
}
function saveConsumption(a){
  if(!validConsumption(a))throw Error("Registro de consumo inválido (máximo 2000).");
  try{
    if(a.length)localStorage.setItem(CONSUMPTION_KEY,JSON.stringify(a));
    else localStorage.removeItem(CONSUMPTION_KEY)
  }catch(e){
    throw Error("No se pudo guardar el registro (falta de espacio u otro error).")
  }
}
function validHabitGoals(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.entries(o).every(([k,v])=>HABIT_GROUPS.includes(k)&&Number.isInteger(v)&&v>=1&&v<=21)
}
function loadHabitGoals(){
  try{
    const o=JSON.parse(localStorage.getItem(HABIT_GOALS_KEY)||"{}");
    return validHabitGoals(o)?o:{
    }
  }catch(e){
    return {
    }
  }
}
function plateGroups(item){
  const g=new Set();
  if(!item)return [];
  const st=item.state;
  if(st&&typeof st==="object"){
    if(Array.isArray(st.verduras)&&st.verduras.length)g.add("verduras");
    if(Array.isArray(st.legCarb)&&st.legCarb.length||Array.isArray(st.legProt)&&st.legProt.length)g.add("legumbres");
    if(Array.isArray(st.almidones)&&st.almidones.length)g.add("almidones");
    if(Array.isArray(st.proteinas)&&st.proteinas.length)g.add("proteinas");
    if(st.fruta&&st.fruta.name)g.add("fruta")
  }
  let names=[];
  try{
    names=extractIngredients(item)
  }catch(e){
  }
  const keys=new Set(names.map(ingredientKey)),has=list=>list.some(x=>keys.has(ingredientKey(x)));
  if(has(data.verduras))g.add("verduras");
  if(has(data.legumbres))g.add("legumbres");
  if(names.some(n=>{
    const t=normalizeSearchText(n);return FISH_WORDS.some(w=>t.includes(w))
  }))g.add("pescado");
  return FOOD_GROUPS.filter(x=>g.has(x))
}
function todayPlanDay(){
  return DAYS[(new Date().getDay()+6)%7][0]
}
function mondayOf(dateKey){
  const d=new Date(dateKey+"T12:00:00");
  d.setDate(d.getDate()-((d.getDay()+6)%7));
  return localTrainingDate(d)
}
function eatenToday(item,slot){
  const today=localTrainingDate(new Date());
  return loadConsumption().some(x=>x.date===today&&x.meal===slot&&x.sourceId===item.id)
}
function recordConsumption({
  date,meal,item,title,planned
}){
  if(!validTrainingDate(date)||date>localTrainingDate(new Date()))throw Error("Elegí una fecha válida, no futura.");
  if(!CONSUMPTION_MEALS.includes(meal))throw Error("Elegí una comida.");
  const name=item?savedItemTitle(item):String(title||"").trim();
  if(!name)throw Error("Elegí un plato guardado o escribí qué comiste.");
  const a=loadConsumption();
  a.push({
    id:Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8),date,meal,title:name.slice(0,120),groups:item?plateGroups(item):[],sourceId:item?item.id:null,planned:!!planned
  });
  saveConsumption(a.slice(-2000))
}
function renderConsumption(){
  const box=document.getElementById("consumptionView");
  if(!box)return;
  if(!consumptionWeek)consumptionWeek=mondayOf(localTrainingDate(new Date()));
  const start=new Date(consumptionWeek+"T12:00:00"),days=[...Array(7)].map((_,i)=>{
    const d=new Date(start);d.setDate(d.getDate()+i);return localTrainingDate(d)
  }),records=loadConsumption().filter(x=>days.includes(x.date)).sort((a,b)=>a.date.localeCompare(b.date)||CONSUMPTION_MEALS.indexOf(a.meal)-CONSUMPTION_MEALS.indexOf(b.meal)),goals=loadHabitGoals(),labels={
    verduras:"Con verduras",legumbres:"Con legumbres",pescado:"Con pescado",fruta:"Con fruta"
  };
  document.getElementById("consumptionWeekLabel").textContent="Semana del "+typedAppDateLabel(days[0])+" al "+typedAppDateLabel(days[6]);
  const planned=records.filter(x=>x.planned).length,nodes=[ce("p","shop-item",records.length+" comida"+(records.length===1?"":"s")+" registrada"+(records.length===1?"":"s")+" · "+planned+" del plan · "+(records.length-planned)+" fuera del plan")];
  for(const g of HABIT_GROUPS){
    const n=records.filter(x=>x.groups.includes(g)).length,goal=goals[g]||0;
    nodes.push(ce("p","screen__hint",labels[g]+": "+n+(goal?" de "+goal+" (objetivo)"+(n>=goal?" ✓":""):"")))
  }
  const unknown=records.filter(x=>!x.groups.length).length;
  if(unknown)nodes.push(ce("p","screen__hint",unknown+" registro"+(unknown===1?"":"s")+" sin grupos identificados (texto libre o sin ingredientes registrados)."));
  if(!records.length)nodes.push(ce("p","screen__hint","Sin registros esta semana."));
  for(const x of records){
    const row=ce("div","shop-item");
    row.append(ce("span",null,typedAppDateLabel(x.date)+" · "+x.meal+" · "+x.title+(x.planned?" (del plan)":"")));
    const b=ce("button","filter-chip filter-chip--danger","Quitar");
    b.type="button";
    b.dataset.consumptionRemove=x.id;
    b.setAttribute("aria-label","Quitar registro de "+x.title);
    row.append(b);
    nodes.push(row)
  }
  box.replaceChildren(...nodes);
  const sel=document.getElementById("consumptionPlate"),prev=sel.value,first=ce("option",null,"— Escribir otro —");
  first.value="";
  sel.replaceChildren(first);
  const saved=loadSaved(),plateLabels=mealLabels(saved);
  saved.forEach(p=>{
    const o=ce("option",null,(p.recipeSourceId?"📖 ":"")+plateLabels.get(p.id));o.value=p.id;sel.append(o)
  });
  if([...sel.options].some(o=>o.value===prev))sel.value=prev;
  for(const g of HABIT_GROUPS){
    const i=document.getElementById("goal_"+g);
    if(document.activeElement!==i)i.value=goals[g]?String(goals[g]):""
  }
}
document.getElementById("consumptionPanel").addEventListener("toggle",e=>{
  if(e.target.open){
    const d=document.getElementById("consumptionDate");if(!d.value)d.value=typedAppDateLabel(localTrainingDate(new Date()));renderConsumption()
  }
});
document.getElementById("consumptionDate").addEventListener("input",e=>{
  const d=e.target.value.replace(/\D/g,"").slice(0,8);e.target.value=d.slice(0,2)+(d.length>2?"/"+d.slice(2,4):"")+(d.length>4?"/"+d.slice(4):"")
});
document.getElementById("consumptionSave").addEventListener("click",()=>{
  const st=document.getElementById("consumptionStatus");try{
    const date=parseTypedAppDate(document.getElementById("consumptionDate").value);if(!date)throw Error("Ingresá una fecha.");const meal=document.getElementById("consumptionMeal").value,id=document.getElementById("consumptionPlate").value,item=id?loadSaved().find(p=>p.id===id):null,wd=DAYS[(new Date(date+"T12:00:00").getDay()+6)%7][0],plan=loadPlan(),planned=!!item&&!!plan[wd]&&plan[wd][meal]===item.id&&mondayOf(date)===mondayOf(localTrainingDate(new Date()));recordConsumption({
      date,meal,item,title:document.getElementById("consumptionText").value,planned
    });document.getElementById("consumptionText").value="";consumptionWeek=mondayOf(date);st.textContent="Registrado. No cambia el plan ni el contador Cociné.";renderConsumption();renderPlan()
  }catch(err){
    st.textContent=err.message
  }
});
document.getElementById("habitGoalsSave").addEventListener("click",()=>{
  const st=document.getElementById("consumptionStatus");try{
    const o={
    };for(const g of HABIT_GROUPS){
      const v=document.getElementById("goal_"+g).value.trim();if(!v)continue;if(!/^\d{1,2}$/.test(v)||Number(v)>21)throw Error("Usá números enteros entre 0 y 21.");if(Number(v)>0)o[g]=Number(v)
    }try{
      if(Object.keys(o).length)localStorage.setItem(HABIT_GOALS_KEY,JSON.stringify(o));else localStorage.removeItem(HABIT_GOALS_KEY)
    }catch(e){
      throw Error("No se pudieron guardar los objetivos.")
    }st.textContent="Objetivos guardados.";renderConsumption()
  }catch(err){
    st.textContent=err.message
  }
});
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;if(b.dataset.consumptionWeek){
    const d=new Date((consumptionWeek||mondayOf(localTrainingDate(new Date())))+"T12:00:00");d.setDate(d.getDate()+Number(b.dataset.consumptionWeek));consumptionWeek=localTrainingDate(d);renderConsumption()
  }if(b.dataset.consumptionRemove){
    if(!window.confirm("¿Quitar este registro de consumo?"))return;try{
      saveConsumption(loadConsumption().filter(x=>x.id!==b.dataset.consumptionRemove));renderConsumption();renderPlan();document.getElementById("consumptionStatus").textContent="Registro quitado."
    }catch(err){
      document.getElementById("consumptionStatus").textContent=err.message
    }
  }if(b.dataset.planEaten){
    const [day,slot]=b.dataset.planEaten.split("|"),plan=loadPlan(),id=plan[day]&&plan[day][slot],item=id?loadSaved().find(p=>p.id===id):null;if(!item)return;try{
      recordConsumption({
        date:localTrainingDate(new Date()),meal:slot,item,planned:true
      });renderPlan();planStatus("Registrado como comido hoy. El plan no cambió.");if(document.getElementById("consumptionPanel").open)renderConsumption()
    }catch(err){
      planStatus(err.message)
    }
  }
});
