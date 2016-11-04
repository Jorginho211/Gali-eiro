var manual = false;
var camara = false;
var porta = false;
var refrescoImaxe;

//Funcions
function msgError(){
	document.getElementById("msg").innerHTML = "Erro de comunicación!";
    document.getElementById("informacion").style.display = "block";
    setTimeout(function() {
    	document.getElementById("informacion").style.display = "none";
    }, 2000);
}

function httpGet(url, accion, info) {
	var xhttp;
	if (window.XMLHttpRequest) {
		xhttp = new XMLHttpRequest();
	}
	else {
		xhttp = new ActiveXObject("Microsoft.XMLHTTP");
	}
	
	xhttp.timeout = 30000;

	if(info === undefined){
		info = function(){
			msgError();
		};
	}

  	xhttp.onreadystatechange = function() {
    	if (xhttp.readyState == 4 && xhttp.status == 200) {
    		accion(JSON.parse(xhttp.responseText));
    	}
    	else if (xhttp.readyState == 4) {
    		info();
    	}
  	};

  	xhttp.ontimeout = function(){
  		info();
  	};

  	xhttp.open("GET", url, true);
  	xhttp.send();
}

function automaticoManual(){
	if(manual){
		httpGet("/galinheiro/automatico_manual/0", function(jsonObj){
			if(jsonObj.manAuto == 0){
				document.getElementById("btnAccionManual").style.borderColor = "black";
				document.getElementById("btnAccionManual").innerHTML = "Activar Manual";
				document.getElementById("btnAccionPortal").style.borderColor = "grey";
				document.getElementById("btnAccionPortal").disabled = true;
				manual = false;
			}
		});
	}
	else{
		httpGet("/galinheiro/parametros", function(jsonObj){
			if(jsonObj.porta == 1){
				document.getElementById("btnAccionPortal").style.borderColor = "blue";
				document.getElementById("btnAccionPortal").innerHTML = "Cerrar Porta";
				porta = true;
			}
			else {
				document.getElementById("btnAccionPortal").style.borderColor = "grey";
				document.getElementById("btnAccionPortal").innerHTML = "Abrir Porta";
				porta = false;
			}

			httpGet("/galinheiro/automatico_manual/1", function(jsonObj){
				if(jsonObj.manAuto == 1){
					document.getElementById("btnAccionManual").style.borderColor = "blue";
					document.getElementById("btnAccionManual").innerHTML = "Desactivar Manual";
					if(porta) {
						document.getElementById("btnAccionPortal").style.borderColor = "blue";
					}
					else{
						document.getElementById("btnAccionPortal").style.borderColor = "black";
					}
					document.getElementById("btnAccionPortal").disabled = false;
					manual = true;
				}
				else{
					document.getElementById("msg").innerHTML = "Operario Traballando!";
    				document.getElementById("informacion").style.display = "block";
    				setTimeout(function() {
    					document.getElementById("informacion").style.display = "none";
    				}, 2000);
				}
			});
		});
	}
}

function abrirCerrarPortal(){
	document.getElementById("btnAccionPortal").style.background = "yellow";
	if(porta){
		httpGet("/galinheiro/cerrar_porta/", function(jsonObj){
			document.getElementById("btnAccionPortal").style.background = "white";
			if(jsonObj.codigo){
				document.getElementById("msg").innerHTML = "Porta pechada";
				document.getElementById("informacion").style.display = "block";
				document.getElementById("btnAccionPortal").style.borderColor = "black";
				document.getElementById("btnAccionPortal").innerHTML = "Abrir Porta";
				setTimeout(function() {
					document.getElementById("informacion").style.display = "none";
				}, 2000);

				porta = false;
			}
			else{
				document.getElementById("msg").innerHTML = "Operario Traballando!";
				document.getElementById("informacion").style.display = "block";
				setTimeout(function() {
					document.getElementById("informacion").style.display = "none";
				}, 2000);
			}
		}, function(){
			document.getElementById("btnAccionPortal").style.background = "white";
			msgError();
		});
	}
	else{
		httpGet("/galinheiro/abrir_porta/", function(jsonObj){
			document.getElementById("btnAccionPortal").style.background = "white";
			if(jsonObj.codigo){
				document.getElementById("informacion").style.display = "block";
				document.getElementById("msg").innerHTML = "Porta aberta";
				
				document.getElementById("btnAccionPortal").style.borderColor = "blue";
				document.getElementById("btnAccionPortal").innerHTML = "Cerrar Porta";
				setTimeout(function() {
					document.getElementById("informacion").style.display = "none";
				}, 2000);

				porta = true;
			}
			else{
				document.getElementById("btnAccionPortal").style.background = "";
				document.getElementById("msg").innerHTML = "Operario Traballando!";
				document.getElementById("informacion").style.display = "block";
				setTimeout(function() {
					document.getElementById("informacion").style.display = "none";
				}, 2000);
			}
		}, function(){
			document.getElementById("btnAccionPortal").style.background = "white";
			msgError();
		});
	}
}

function obterImaxe(){
	httpGet("/galinheiro/snapshot", function(jsonObj){
		document.getElementById("imaxeCamara").src = "http://cyberspeed.servegame.com/snapshot.jpg?random=" + Math.random();
	}, function(){
		clearInterval(refrescoImaxe);
		document.getElementById("imaxeCamara").style.display = "none";
		document.getElementById("encenderApagarCamara").style.borderColor = "black";
		document.getElementById("encenderApagarCamara").innerHTML = "Enceder Camara";
		document.getElementById("imaxeCamara").style.display = "none";
		document.getElementById("msg").innerHTML = "Erro de comunicación!";
    	document.getElementById("informacion").style.display = "block";
    	setTimeout(function() {
    		document.getElementById("informacion").style.display = "none";
    	}, 2000);

    	httpGet("/galinheiro/galinheiro/apagar_incandescente/", function(jsonObj){

    	});

    	camara = false;
	});
}

function encenderApagarCamara(){
	if(camara){
		document.getElementById("encenderApagarCamara").style.borderColor = "black";
		document.getElementById("encenderApagarCamara").innerHTML = "Enceder Camara";
		document.getElementById("imaxeCamara").style.display = "none";

		clearInterval(refrescoImaxe);

		httpGet("/galinheiro/apagar_incandescente/", function(jsonObj){

		});

		camara = false;
	}
	else{
		httpGet("/galinheiro/encender_incandescente/", function(jsonObj){
			document.getElementById("encenderApagarCamara").style.borderColor = "blue";
			document.getElementById("encenderApagarCamara").innerHTML = "Apagar Camara"
			document.getElementById("imaxeCamara").style.display = "block";
			refrescoImaxe = setInterval(function(){
				obterImaxe();
			}, 3000);

			camara = true;
    	}, function(){
    		document.getElementById("msg").innerHTML = "Erro de comunicación!";
    		document.getElementById("informacion").style.display = "block";
    		setTimeout(function() {
    			document.getElementById("informacion").style.display = "none";
    		}, 	10000);
    	});
	}
}

function actualizar(){
	httpGet("/galinheiro/parametros", function(jsonObj){
			if(jsonObj.manAuto == 1){
				document.getElementById("btnAccionManual").style.borderColor = "blue";
				document.getElementById("btnAccionManual").innerHTML = "Desactivar Manual";
				document.getElementById("btnAccionPortal").disabled = false;

				if(jsonObj.porta == 1){
					document.getElementById("btnAccionPortal").style.borderColor = "blue";
					document.getElementById("btnAccionPortal").innerHTML = "Cerrar Porta";
					porta = true;
				}
				else {
					document.getElementById("btnAccionPortal").style.borderColor = "black";
					document.getElementById("btnAccionPortal").innerHTML = "Abrir Porta";
					porta = false;
				}

				manual = true;
			}
			else{
				document.getElementById("btnAccionManual").innerHTML = "Activar Manual";
				document.getElementById("btnAccionManual").style.borderColor = "black";
				document.getElementById("btnAccionPortal").disabled = true;
				document.getElementById("btnAccionPortal").style.borderColor = "grey";

				if(jsonObj.porta == 1){
					document.getElementById("btnAccionPortal").innerHTML = "Cerrar Porta";
					porta = true;
				}
				else {
					document.getElementById("btnAccionPortal").innerHTML = "Abrir Porta";
					porta = false;
				}

				manual = false;
			}
		});
}
