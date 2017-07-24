var modo = 0;

function msgError(){
	document.getElementById("msg").innerHTML = "Erro de comunicación!";
    document.getElementById("informacion").style.display = "block";
    setTimeout(function() {
    	document.getElementById("informacion").style.display = "none";
    }, 2000);
}

function httpGet(url, accion, info) {
	if(info === undefined){
		info = function(){
			msgError();
		};
	}

	$.ajax(url, {
		success: function(json){
			accion(json);
		},
		error: function(xhr, status){
			info();
		},
		timeout: 30000
	});
}

function reiniciar(){
	httpGet("/galinheiro/reiniciar");
}

function cambiarModo(){
    switch(modo){
        case 0:
            document.getElementById("galineiro").style.display = "none";
            document.getElementById("incandescente").style.display = "none";
            document.getElementById("videovixilancia").style.display = "block";
            document.getElementById("nomeApp").innerHTML = "Videovixilancia";
            modo = 1;
            break;
        case 1:
            document.getElementById("galineiro").style.display = "block";
            document.getElementById("incandescente").style.display = "block";
            document.getElementById("videovixilancia").style.display = "none";
            document.getElementById("nomeApp").innerHTML = "Galiñeiro";
            modo = 0;
            break;
    }
}

function actualizar(){
    actualizarGalineiro();
    actualizarVideoVixilancia();
}
