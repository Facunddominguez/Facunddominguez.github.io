// Mi Plato Fácil · Nombres de ingredientes, sinónimos, equivalencias y unidades.
// Parte 4: los archivos se unen en orden según su número, que define el orden de arranque.
function normalizeSearchText(value){
  return String(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim()
}
const INGREDIENT_ALIASES_KEY="miPlatoFacil_ingredientAliases_v1";
const INGREDIENT_SYNONYMS=[["Papa","patata"],["Batata","boniato","camote"],["Palta","aguacate"],["Arvejas","guisante","chicharo"],["Chauchas","chauchas (judias verdes)","judia verde","ejote","vainita"],["Porotos negros","frijol negro"],["Porotos colorados","frijol rojo"],["Porotos alubia (blanco)","poroto alubia","alubia","poroto blanco"],["Soja (poroto de soja)","soja","poroto de soja"],["Fécula de maíz (maicena)","maicena","fecula de maiz"],["Morrón rojo","pimiento rojo"],["Morrón verde","pimiento verde"],["Morrón amarillo","pimiento amarillo"],["Zucchini","calabacin","zuchini","zukini"],["Remolacha","betarraga","betabel"],["Choclo","elote","mazorca"],["Huevo","huevo entero de gallina","huevo de gallina","huevo entero"],["Pollo","pollo (pechuga, muslo, pata-muslo)"],["Yogur","yogur (natural, bebible, griego)","yogurt","yoghurt"],["Fideos","fideos y pastas (de trigo, maiz o arroz)","pasta"],["Leche","leche (preferentemente descremada, parcialmente descremada)"],["Cebolla de verdeo","verdeo","cebollita de verdeo"],["Tomate","tomate fresco"],["Ajo","diente de ajo"],["Repollo colorado","repollo morado","col lombarda"],["Mandioca","yuca"],["Quinoa","quinua"],["Cuscús","cous cous","couscous","cus cus"],["Maní","cacahuate","cacahuete"],["Manteca","mantequilla"]];
let ingredientCatalogCache=null,ingredientAliasCache={
  raw:undefined,map:{
  }
};
function singularWord(w){
  if(w.length<4||!w.endsWith("s"))return w;
  if(w.endsWith("ces"))return w.slice(0,-3)+"z";
  if(w.endsWith("ies"))return w.slice(0,-2);
  if(/[aeiou][lnrj]es$/.test(w))return w.slice(0,-2);
  return w.slice(0,-1)
}
function ingredientNormal(name){
  return normalizeSearchText(name).replace(/\s+/g," ").replace(/[.,;:]+$/,"").trim().split(" ").map(singularWord).join(" ")
}
function ingredientCatalog(){
  if(ingredientCatalogCache)return ingredientCatalogCache;
  const map=new Map(),names=new Map();
  for(const [display,...synonyms] of INGREDIENT_SYNONYMS){
    const canon=ingredientNormal(display);
    names.set(canon,display);
    for(const s of [display,...synonyms])map.set(ingredientNormal(s),canon)
  }
  ingredientCatalogCache={
    map,names
  };
  return ingredientCatalogCache
}
function validIngredientAliases(o){
  return !!o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length<=500&&Object.entries(o).every(([k,v])=>!["__proto__","constructor","prototype"].includes(k)&&k.trim().length>0&&k.length<=120&&!!v&&typeof v==="object"&&!Array.isArray(v)&&typeof v.to==="string"&&v.to.trim().length>0&&v.to.length<=120&&v.to!==k&&typeof v.from==="string"&&v.from.trim().length>0&&v.from.length<=100&&typeof v.toName==="string"&&v.toName.trim().length>0&&v.toName.length<=100)
}
function loadIngredientAliases(){
  let raw=null;
  try{
    raw=localStorage.getItem(INGREDIENT_ALIASES_KEY)
  }catch(e){
  }
  if(raw===ingredientAliasCache.raw)return ingredientAliasCache.map;
  let map={
  };
  try{
    const o=raw?JSON.parse(raw):{
    };
    if(validIngredientAliases(o))map=o
  }catch(e){
  }
  ingredientAliasCache={
    raw,map
  };
  return map
}
function ingredientKey(name){
  const user=loadIngredientAliases(),cat=ingredientCatalog().map;
  let k=ingredientNormal(name);
  for(let i=0;i<8&&k;i++){
    const u=Object.prototype.hasOwnProperty.call(user,k)?user[k]:null;
    if(u&&u.to!==k){
      k=u.to;
      continue
    }
    const c=cat.get(k);
    if(c&&c!==k){
      k=c;
      continue
    }
    break
  }
  return k
}
function sameIngredient(a,b){
  return ingredientKey(a)===ingredientKey(b)
}
function ingredientDisplayName(key,fallback){
  const names=ingredientCatalog().names;
  if(names.has(key))return names.get(key);
  const a=Object.values(loadIngredientAliases()).find(x=>x.to===key);
  return a?a.toName:fallback
}
function stockQuantityFor(stock,name,unit){
  const key=ingredientKey(name);
  let total=null;
  for(const s of Object.values(stock))if(s&&sameDimension(s.unit,unit)&&ingredientKey(s.name)===key)total=(total||0)+convertQuantity(s.quantity,s.unit,unit);
  return total
}
const UNIT_FACTORS={
  g:["masa",1],kg:["masa",1000],ml:["volumen",1],l:["volumen",1000],cucharadita:["cuchara",1],cucharada:["cuchara",3],unidad:["unidad",1],taza:["taza",1]
};
function unitInfo(u){
  const f=Object.prototype.hasOwnProperty.call(UNIT_FACTORS,u)?UNIT_FACTORS[u]:null;
  return f?{
    dim:f[0],factor:f[1]
  }:{
    dim:"otra:"+u,factor:1
  }
}
function sameDimension(a,b){
  return unitInfo(a).dim===unitInfo(b).dim
}
function convertQuantity(q,from,to){
  const a=unitInfo(from),b=unitInfo(to);
  if(a.dim!==b.dim)return null;
  return q*a.factor/b.factor
}
function displayBase(dim,base){
  const r=n=>Math.round(n*1e6)/1e6;
  if(dim==="masa")return base>=1000?[["kg",r(base/1000)]]:[["g",r(base)]];
  if(dim==="volumen")return base>=1000?[["l",r(base/1000)]]:[["ml",r(base)]];
  if(dim==="cuchara"){
    const cda=Math.floor(base/3+1e-9),rest=r(base-cda*3),out=[];
    if(cda)out.push(["cucharada",cda]);
    if(rest>0||!cda)out.push(["cucharadita",rest]);
    return out
  }
  if(dim==="unidad")return [["unidad",r(base)]];
  if(dim==="taza")return [["taza",r(base)]];
  return [[dim.slice(5),r(base)]]
}
function mergeUnits(units){
  const groups=new Map();
  for(const [unit,q] of units){
    const d=unitInfo(unit).dim;
    if(!groups.has(d))groups.set(d,[]);
    groups.get(d).push([unit,q])
  }
  const out=new Map();
  for(const [dim,list] of groups){
    if(list.length===1){
      out.set(list[0][0],list[0][1]);
      continue
    }
    const base=list.reduce((t,[u,q])=>t+q*unitInfo(u).factor,0);
    for(const [u,q] of displayBase(dim,base))out.set(u,(out.get(u)||0)+q)
  }
  return out
}
function displayMissing(dim,base,planUnits){
  const us=[...new Set(planUnits.filter(u=>unitInfo(u).dim===dim))];
  if(us.length===1)return [[us[0],Math.round(base/unitInfo(us[0]).factor*1e6)/1e6]];
  return displayBase(dim,base)
}
function pricesFor(list,name,unit){
  return list.filter(p=>p&&sameIngredient(p.name,name)&&sameDimension(p.unit,unit)).map(p=>p.unit===unit?p:{
    ...p,amount:convertQuantity(p.amount,p.unit,unit),unit,sourceAmount:p.amount,sourceUnit:p.unit
  })
}
