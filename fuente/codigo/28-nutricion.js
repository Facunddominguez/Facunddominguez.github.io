// Mi Plato Fácil · Nutrición con USDA FoodData Central.
// Parte 29: los archivos se unen en orden según su número, que define el orden de arranque.
var NUTRITION_SNAPSHOT=__DATOS_NUTRICION__;
function validNutritionData(d){
  return!!d&&typeof d==="object"&&d.version===1&&typeof d.revisado==="string"&&d.revisado.length<=20&&!!d.fuente&&typeof d.fuente==="object"&&Array.isArray(d.items)&&d.items.length>0&&d.items.length<=5000&&d.items.every(i=>!!i&&typeof i.n==="string"&&i.n.trim().length>0&&i.n.length<=100&&Array.isArray(i.s)&&i.s.length<=50&&i.s.every(x=>typeof x==="string"&&x.length<=100)&&Number.isInteger(i.id)&&i.id>0&&(i.b==="F"||i.b==="S")&&typeof i.d==="string"&&i.d.length<=300&&Array.isArray(i.v)&&i.v.length===7&&i.v.every(x=>x===null||(typeof x==="number"&&Number.isFinite(x)&&x>=0&&x<=100000))&&(i.u===undefined||(!!i.u&&typeof i.u==="object"&&Object.entries(i.u).every(([k,p])=>["unidad","taza","cucharada","cucharadita"].includes(k)&&Array.isArray(p)&&typeof p[0]==="number"&&p[0]>0&&p[0]<100000&&typeof p[1]==="string"&&p[1].length<=200))))
}
function nutritionDataset(){
  let sig="";
  try{
    sig=localStorage.getItem("miPlatoFacil_ingredientAliases_v1")||""
  }catch(e){
  }
  const src=nutritionDataset.data||NUTRITION_SNAPSHOT,c=nutritionDataset.cache;
  if(c&&c.sig===sig&&c.meta===src)return c;
  const byKey=new Map();
  for(const it of src.items)for(const nm of [it.n].concat(it.s||[])){
    const k=ingredientKey(nm);
    if(k&&!byKey.has(k))byKey.set(k,it)
  }
  nutritionDataset.cache={
    sig,meta:src,byKey,names:src.items.map(i=>i.n).sort((a,b)=>a.localeCompare(b,"es"))
  };
  return nutritionDataset.cache
}
function nutritionFor(name){
  const k=ingredientKey(String(name||""));
  return k&&nutritionDataset().byKey.get(k)||null
}
function nutritionGrams(item,q,unit){
  if(!item||typeof q!=="number"||!(q>0))return null;
  if(unit==="g")return q;
  if(unit==="kg")return q*1000;
  const u=item.u||{
  };
  if(["unidad","taza","cucharada","cucharadita"].includes(unit))return u[unit]?q*u[unit][0]:null;
  if(unit==="ml"||unit==="l"){
    const ml=unit==="l"?q*1000:q;
    if(u.taza)return ml*u.taza[0]/236.588;
    if(u.cucharada)return ml*u.cucharada[0]/14.787;
    if(u.cucharadita)return ml*u.cucharadita[0]/4.929
  }
  return null
}
function recipeNutrition(amount){
  const total=[0,0,0,0,0,0,0],partial=[[],[],[],[],[],[],[]],used=[],missing=[];
  let count=0;
  for(const row of amount.rows){
    const name=String(row.name||"").trim();
    if(!name)continue;
    count++;
    const item=nutritionFor(name);
    if(!item){
      missing.push(name+" (sin dato nutricional)");
      continue
    }
    if(row.quantity===null||row.quantity===undefined){
      missing.push(name+" (sin cantidad)");
      continue
    }
    const g=nutritionGrams(item,row.quantity,row.unit);
    if(g===null){
      missing.push(name+" (no se puede pasar "+row.unit+" a gramos)");
      continue
    }
    item.v.forEach((v,i)=>{
      if(v===null)partial[i].push(name);else total[i]+=v*g/100
    });
    used.push({
      name,g,item
    })
  }
  const y=Number(amount.yield)>0?Number(amount.yield):1;
  return {
    perPortion:total.map(t=>t/y),total,used,missing,partial,yieldCount:y,count
  }
}
function nutritionNumber(n,unit){
  return Number(n).toLocaleString("es-AR",{
    maximumFractionDigits:n<10?1:0
  })+(unit?" "+unit:"")
}
function nutrientLabel(k){
  return {
    kcal:"energía",prot:"proteínas",fat:"grasas",carb:"carbohidratos",fib:"fibra",sug:"azúcares",na:"sodio"
  }
  [k]||k
}
function nutritionSourceText(){
  const m=nutritionDataset().meta,f=m.fuente||{
  },d=String(m.revisado||"").split("-").reverse().join("/");
  return "Fuente: "+(f.nombre||"USDA FoodData Central")+" (Foundation Foods "+(f.foundation||"")+" y SR Legacy "+(f.srLegacy||"")+"), de dominio público. Datos revisados el "+d+"."
}
function nutritionLink(item){
  const a=ce("a",null,"ficha USDA");
  a.href="https://fdc.nal.usda.gov/food-details/"+item.id+"/nutrients";
  a.target="_blank";
  a.rel="noopener noreferrer";
  return a
}
function recipeNutritionBox(amount){
  const box=ce("div","nutrition-box"),r=recipeNutrition(amount),p=r.perPortion;
  box.append(ce("p","nutrition-box__title","🥗 Nutrición estimada por porción"));
  if(!r.used.length){
    box.append(ce("p","screen__hint","Todavía no se puede calcular. "+(r.missing.length?"Revisá: "+r.missing.slice(0,6).join("; ")+".":"Cargá ingredientes con cantidades.")),ce("p","screen__hint",nutritionSourceText()));
    return box
  }
  box.append(ce("p","nutrition-box__main","≈ "+nutritionNumber(p[0],"kcal")),ce("p","screen__hint","Proteínas "+nutritionNumber(p[1],"g")+" · Carbohidratos "+nutritionNumber(p[3],"g")+" · Grasas "+nutritionNumber(p[2],"g")+" · Fibra "+nutritionNumber(p[4],"g")),ce("p","screen__hint","Calculada con "+r.used.length+" de "+r.count+" ingrediente"+(r.count===1?"":"s")+(r.missing.length?". Sin calcular: "+r.missing.join("; ")+".":".")+(r.partial[4].length?" Sin dato de fibra: "+r.partial[4].join(", ")+".":"")));
  const det=ce("details"),ul=ce("ul");
  for(const u of r.used){
    const li=ce("li",null,u.name+": "+nutritionNumber(u.g,"g")+" ≈ "+nutritionNumber(u.item.v[0]*u.g/100,"kcal")+" · ");
    li.append(nutritionLink(u.item));
    ul.append(li)
  }
  det.append(ce("summary",null,"Detalle por ingrediente y fuentes"),ul,ce("p","screen__hint",nutritionSourceText()+" Valores aproximados: no reemplazan el consejo de un profesional."));
  box.append(det);
  return box
}
function renderNutritionLookup(){
  const input=document.getElementById("nutritionLookupInput"),out=document.getElementById("nutritionLookupResult"),info=document.getElementById("nutritionSourceInfo");
  if(!input||!out)return;
  if(info)info.textContent=nutritionSourceText();
  const q=input.value.trim();
  out.replaceChildren();
  if(!q)return;
  const it=nutritionFor(q);
  if(!it){
    const nq=normalizeSearchText(q),sug=nutritionDataset().names.filter(n=>normalizeSearchText(n).includes(nq)).slice(0,6);
    out.append(ce("p","screen__hint","No hay datos para “"+q+"”."+(sug.length?" Probá con: "+sug.join(", ")+".":"")));
    return
  }
  const v=it.v,dl=ce("dl","nutrition-facts");
  for(const [k,val,u] of [["Energía",v[0],"kcal"],["Proteínas",v[1],"g"],["Carbohidratos",v[3],"g"],["Grasas",v[2],"g"],["Fibra",v[4],"g"],["Azúcares",v[5],"g"],["Sodio",v[6],"mg"]])dl.append(ce("dt",null,k),ce("dd",null,val===null?"sin dato":nutritionNumber(val,u)));
  out.append(ce("p",null,it.n+" · cada 100 g"),dl);
  const units=Object.entries(it.u||{
  }).map(([k,p])=>"1 "+k+" ≈ "+nutritionNumber(p[0],"g"));
  if(units.length)out.append(ce("p","screen__hint","Equivalencias de USDA: "+units.join(" · ")+"."));
  if(it.nota)out.append(ce("p","screen__hint",it.nota));
  const srcP=ce("p","screen__hint","Dato de USDA: "+it.d+" ("+(it.b==="F"?"Foundation Foods":"SR Legacy")+")"+(it.c?"; "+it.c.k.map(nutrientLabel).join(", ")+" de SR Legacy":"")+" · ");
  srcP.append(nutritionLink(it));
  out.append(srcP)
}
function refreshNutritionData(){
  if(refreshNutritionData.started||!/^https?:$/.test(location.protocol))return;
  refreshNutritionData.started=true;
  fetch("datos/nutricion.json",{
    cache:"no-cache"
  }).then(r=>r.ok?r.json():null).then(d=>{
    if(!validNutritionData(d)||String(d.revisado)<String(nutritionDataset().meta.revisado))return;nutritionDataset.data=d;nutritionDataset.cache=null;renderNutritionLookup()
  }).catch(()=>{
  })
}
document.getElementById("nutritionLookupPanel").addEventListener("toggle",e=>{
  if(!e.target.open)return;const dl=document.getElementById("nutritionNames");if(!dl.options.length)dl.replaceChildren(...nutritionDataset().names.map(n=>{
    const o=document.createElement("option");o.value=n;return o
  }));document.getElementById("nutritionSourceInfo").textContent=nutritionSourceText()
});
document.getElementById("nutritionLookupInput").addEventListener("input",renderNutritionLookup);
setTimeout(refreshNutritionData,1500);
