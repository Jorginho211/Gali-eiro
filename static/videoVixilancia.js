var grabacion = false;
var camaraVixilancia = false;

function activarServicioVideoVixilancia(){
    if(grabacion){
        httpGet("/videovixilancia/desactivar_grabacion", function(jsonObj){
            document.getElementById("btnActivarServicioVixilancia").style.borderColor = "black";
            document.getElementById("btnActivarServicioVixilancia").innerHTML = "Activar Grabación";
            grabacion = false;
        }, function(){
            document.getElementById("btnActivarServicioVixilancia").style.borderColor = "blue";
            document.getElementById("btnActivarServicioVixilancia").innerHTML = "Desactivar Grabación";
            msgError();
        });
    }
    else {
        httpGet("/videovixilancia/activar_grabacion", function(jsonObj){           
            document.getElementById("btnActivarServicioVixilancia").style.borderColor = "blue";
            document.getElementById("btnActivarServicioVixilancia").innerHTML = "Desactivar Grabación";
            grabacion = true;
        }, function(){
            document.getElementById("btnActivarServicioVixilancia").style.borderColor = "black";
            document.getElementById("btnActivarServicioVixilancia").innerHTML = "Activar Grabación";
            msgError();
        });
    }
}

function encenderApagarCamaraVideoVixilancia(){
    if(camaraVixilancia){
        httpGet("/videovixilancia/desactivar_mostrar", function(jsonObj){           
            document.getElementById("btnVerCamaraVixilancia").style.borderColor = "black";
            document.getElementById("btnVerCamaraVixilancia").innerHTML = "Ver Camara";
            document.getElementById("imaxeCamaraVixilancia").style.display = "none";
            camaraVixilancia = false;
        }, function(){
            document.getElementById("btnVerCamaraVixilancia").style.borderColor = "blue";
            document.getElementById("btnVerCamaraVixilancia").innerHTML = "Apagar Camara";
            document.getElementById("imaxeCamaraVixilancia").style.display = "block";
            msgError();
        });
    }
    else {
        httpGet("/videovixilancia/activar_mostrar", function(jsonObj){           
            document.getElementById("btnVerCamaraVixilancia").style.borderColor = "blue";
            document.getElementById("btnVerCamaraVixilancia").innerHTML = "Apagar Camara";
            document.getElementById("imaxeCamaraVixilancia").style.display = "block";
            setTimeout(function() {
                document.getElementById("imaxeCamaraVixilancia").src = window.location.origin.replace(':5000', ':8091') + "?random=" + Math.random();
            }, 5000);
            camaraVixilancia = true;
        }, function(){
            document.getElementById("btnVerCamaraVixilancia").style.borderColor = "black";
            document.getElementById("btnVerCamaraVixilancia").innerHTML = "Ver Camara";
            document.getElementById("imaxeCamaraVixilancia").style.display = "none";
            msgError();
        });
    }
}

function actualizarVideoVixilancia(){
    httpGet("/videovixilancia/parametros", function(jsonObj){
        if(jsonObj.motionGrabar){
            grabacion = true;
            
            document.getElementById("btnActivarServicioVixilancia").style.borderColor = "blue";
            document.getElementById("btnActivarServicioVixilancia").innerHTML = "Desactivar Grabación";
        }
        else {
            grabacion = false;
            
            document.getElementById("btnActivarServicioVixilancia").style.borderColor = "black";
            document.getElementById("btnActivarServicioVixilancia").innerHTML = "Activar Grabación";
            
        }
        
        if(jsonObj.motionSoloMostrar){
            camaraVixilancia = true;
            document.getElementById("btnVerCamaraVixilancia").style.borderColor = "blue";
            document.getElementById("btnVerCamaraVixilancia").innerHTML = "Apagar Camara";
            document.getElementById("imaxeCamaraVixilancia").src = window.location.origin.replace(':5000', ':8091') + "?random=" + Math.random();
            document.getElementById("imaxeCamaraVixilancia").style.display = "block";
        }
        else {
            camaraVixilancia = false;
            document.getElementById("btnVerCamaraVixilancia").style.borderColor = "black";
            document.getElementById("btnVerCamaraVixilancia").innerHTML = "Ver Camara";
            document.getElementById("imaxeCamaraVixilancia").style.display = "none";
        }
    });
}
