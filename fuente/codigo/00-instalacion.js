// Mi Plato Fácil · Aviso para instalar la app.
// Parte 1 de 30: los archivos se unen en este orden (el número define el orden de arranque).
let deferredInstallPrompt=null;
window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();deferredInstallPrompt=event;const button=document.getElementById("installAppButton");if(button)button.hidden=false
});
window.addEventListener("appinstalled",()=>{
  deferredInstallPrompt=null;const button=document.getElementById("installAppButton");if(button)button.hidden=true;const status=document.getElementById("installAppStatus");if(status)status.textContent="Instalación confirmada por el navegador."
});
document.addEventListener("DOMContentLoaded",()=>{
  const button=document.getElementById("installAppButton");if(!button)return;button.addEventListener("click",async()=>{
    if(!deferredInstallPrompt)return;const prompt=deferredInstallPrompt;deferredInstallPrompt=null;button.hidden=true;try{
      await prompt.prompt();const choice=await prompt.userChoice;document.getElementById("installAppStatus").textContent=choice&&choice.outcome==="accepted"?"Solicitud aceptada. Comprobá la instalación en tu dispositivo.":"Instalación cancelada."
    }catch(e){
      document.getElementById("installAppStatus").textContent="No se pudo solicitar la instalación."
    }
  })
});
