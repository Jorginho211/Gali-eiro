var manual = false;
var camara = false;
var porta = false;
var incandescente = false;

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
			document.getElementById("btnAccionPortal").style.borderColor = "grey";
			if(jsonObj.porta == 1){
				document.getElementById("btnAccionPortal").innerHTML = "Cerrar Porta";
				porta = true;
			}
			else {
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
		document.getElementById("imaxeCamara").src = window.location.origin.replace(':5000', '') + "/snapshot.jpg?random=" + Math.random();
		if(camara){
			obterImaxe();
		}
	}, function(){
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
				document.getElementById("incandescente").style.backgroundColor = "gray";
				incandescente = false;
    	});

    	camara = false;
	});
}

function encenderApagarCamara(){
	if(camara){
		document.getElementById("encenderApagarCamara").style.borderColor = "black";
		document.getElementById("encenderApagarCamara").innerHTML = "Enceder Camara";
		document.getElementById("imaxeCamara").style.display = "none";

		httpGet("/galinheiro/apagar_incandescente/", function(jsonObj){
			document.getElementById("incandescente").style.backgroundColor = "gray";
			incandescente = false;
		});

		camara = false;
	}
	else{
		httpGet("/galinheiro/encender_incandescente/", function(jsonObj){
			document.getElementById("encenderApagarCamara").style.borderColor = "blue";
			document.getElementById("encenderApagarCamara").innerHTML = "Apagar Camara"
			document.getElementById("imaxeCamara").style.display = "block";
			document.getElementById("incandescente").style.backgroundColor = "yellow";

			obterImaxe();

			incandescente = true;
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

function actualizarGalineiro(){
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

			if(jsonObj.incandescente == 1){
				document.getElementById("incandescente").style.backgroundColor = "yellow";
				incandescente = true;
			}
			else {
				document.getElementById("incandescente").style.backgroundColor = "gray";
				incandescente = false;
			}
		});
}
