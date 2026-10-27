// Mi Plato Fácil · Calendario mensual de entrenamiento.
// Parte 16: los archivos se unen en orden según su número, que define el orden de arranque.
let trainViewMonth=null;
function initTrainingUI(){
  const input=document.getElementById("trainingExceptionDate");
  if(!input)return;
  if(!validTrainingDate(input.value))input.value=localTrainingDate(new Date());
  const d=new Date(input.value+"T12:00:00");
  trainViewMonth=new Date(d.getFullYear(),d.getMonth(),1);
  syncTrainingType();
  renderTrainingMonth()
}
function syncTrainingType(){
  const value=document.getElementById("trainingExceptionValue").value;
  document.querySelectorAll("[data-train-type]").forEach(b=>{
    const on=b.dataset.trainType===value;b.classList.toggle("is-selected",on);b.setAttribute("aria-pressed",String(on))
  })
}
function selectTrainingDate(key){
  if(!validTrainingDate(key))return;
  document.getElementById("trainingExceptionDate").value=key;
  const d=new Date(key+"T12:00:00");
  trainViewMonth=new Date(d.getFullYear(),d.getMonth(),1);
  const effective=trainingDayForDate(d);
  if(effective!==null)document.getElementById("trainingExceptionValue").value=effective?"train":"rest";
  document.getElementById("trainingExceptionStatus").textContent="";
  syncTrainingType();
  renderTrainingMonth()
}
function renderTrainingMonth(){
  const box=document.getElementById("trainMonthGrid");
  if(!box||!trainViewMonth)return;
  const y=trainViewMonth.getFullYear(),m=trainViewMonth.getMonth(),selected=document.getElementById("trainingExceptionDate").value,today=localTrainingDate(new Date());
  document.getElementById("trainMonthTitle").textContent=trainViewMonth.toLocaleDateString("es-AR",{
    month:"long",year:"numeric"
  });
  const nodes=["L","M","M","J","V","S","D"].map(t=>ce("span",null,t));
  const offset=(new Date(y,m,1).getDay()+6)%7;
  for(let i=0;i<offset;i++)nodes.push(ce("span"));
  const count=new Date(y,m+1,0).getDate();
  for(let day=1;day<=count;day++){
    const date=new Date(y,m,day,12),key=localTrainingDate(date),b=ce("button","train-date"+(key===today?" is-today":"")+(key===selected?" is-selected":""),String(day));
    b.type="button";
    b.dataset.trainDate=key;
    const effective=trainingDayForDate(date);
    if(effective!==null)b.dataset.mark=effective?"●":"○";
    b.setAttribute("aria-pressed",String(key===selected));
    if(key===today)b.setAttribute("aria-current","date");
    b.setAttribute("aria-label",date.toLocaleDateString("es-AR",{
      weekday:"long",day:"numeric",month:"long",year:"numeric"
    })+(effective===null?"":effective?", entrenamiento":", descanso"));
    nodes.push(b)
  }
  box.replaceChildren(...nodes);
  const d=new Date(selected+"T12:00:00");
  document.getElementById("trainSelectedLabel").textContent=validTrainingDate(selected)?"Fecha elegida: "+d.toLocaleDateString("es-AR",{
    weekday:"long",day:"numeric",month:"long",year:"numeric"
  }):"Elegí una fecha"
}
document.addEventListener("click",e=>{
  const b=e.target.closest("button");if(!b)return;if(b.dataset.trainDate)selectTrainingDate(b.dataset.trainDate);if(b.dataset.trainQuick!==undefined){
    const d=new Date();d.setDate(d.getDate()+Number(b.dataset.trainQuick));selectTrainingDate(localTrainingDate(d))
  }if(b.dataset.trainMonth){
    trainViewMonth=new Date(trainViewMonth.getFullYear(),trainViewMonth.getMonth()+Number(b.dataset.trainMonth),1);renderTrainingMonth()
  }if(b.dataset.trainType){
    document.getElementById("trainingExceptionValue").value=b.dataset.trainType;syncTrainingType()
  }if(b.dataset.trainingSave!==undefined||b.dataset.trainingDisable!==undefined||b.dataset.trainingExceptionSave!==undefined||b.dataset.trainingExceptionRemove)renderTrainingMonth()
});
document.getElementById("trainingExceptionDate").addEventListener("change",e=>selectTrainingDate(e.target.value));
startupGuard("Calendario de entrenamiento",initTrainingUI);
