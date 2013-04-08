    document.addEventListener("deviceready", onDeviceReady, false);

    // Cordova is loaded and it is now safe to make calls Cordova methods
    //
    function onDeviceReady() {
    	$.support.cors = true;
		$.mobile.allowCrossDomainPages = true;
	}

    // Wait for Cordova to load
    // 
	
    //var networkState = '';
	
	//var states = {};
	
//---------------------------------------------------------------------------------------------------------------------------------------------------  
//--------------------------- VARIABLES Y FUNCIONES DE LA PAGINA ***** POSICION ACTUAL ***** --------------------------------------------------------  
//---------------------------------------------------------------------------------------------------------------------------------------------------        

	var movilSeleccionado = 0;
	var latActual;
	var lngActual;
	var mobileDemo = { 'center': '-32.890615,-68.8484', 'zoom': 10 };
	var watchID = null;

	$(document).on('pageinit', '#geoPos',  function(){
		$("#idmovil span").text(movilSeleccionado);
		//boton enviar posicion actual
		$("#btnEnviarPosActual").click(function (){
			$("#map_canvas_2").fadeOut("slow", function(){
				$("#map_canvas_2").fadeIn("slow", function() {				
				});
			});
			navigator.geolocation.getCurrentPosition(function(position) {
				Enviar(position.coords.latitude, position.coords.longitude);
			},function(error){
	    		alert(error.message);
	    	});

		});
		$('#map_canvas_2').gmap({
			'center': mobileDemo.center, 
			'zoom': mobileDemo.zoom, 
			'disableDefaultUI':true, 
			'callback': function(map) {
				var self = this;
				var options = {enableHighAccuracy:true, maximumAge:30000, timeout: 30000 };
        		watchID = navigator.geolocation.getCurrentPosition(function(position) {
        			var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		        	if (!self.get('markers').client) {
						self.addMarker({ 'id': 'client', 'position': latlng, 'bounds': true });
					} else {
						self.get('markers').client.setPosition(latlng);
						map.panTo(latlng);
					}
        		}, function(error){
        			alert("x" + error.code);
        		}, options);
			}
		});
	});

	$(document).on('pageshow', '#geoPos',  function(){
		 $('#map_canvas_2').gmap('refresh');
		 $.mobile.hidePageLoadingMsg();
	});
	
	$(document).on('pagehide', '#geoPos',  function(){
		$('#map_canvas_2').gmap('clearWatch'); 
		if (watchID != null) {
            navigator.geolocation.clearWatch(watchID);
            watchID = null;
        }
	});



	function Enviar(lat, lng) {
		//web service para insertar recorrido
		$.mobile.showPageLoadingMsg("a", "Enviando...");
		$.ajax({
            type: "POST",
            url: "http://" + $("#ip").val() + "/wstracking/WebService1.asmx/insertData",
            data: "{movilid:" + movilSeleccionado + ",lat:'" + lat + "',lng:'" + lng + "',vel:0,rum:0,evento:0,panico:0,fueradeservicio:0,input3:0,input4:0,ocupado:0,input6:0,sms:0,contacto:0,conf:'conf'}",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
			success: function(data) {
				//$('#result').html(data.d);
			},
            error: function (msg) {
                $('#result').html(msg.statusText);
            }
        });
        $.mobile.hidePageLoadingMsg();
	}

//---------------------------------------------------------------------------------------------------------------------------------------------------  
//---------------------------------------------------------------------------------------------------------------------------------------------------  
//---------------------------------------------------------------------------------------------------------------------------------------------------        

	
	
//---------------------------------------------------------------------------------------------------------------------------------------------------  
//--------------------------- VARIABLES Y FUNCIONES DE LA PAGINA ***** INICIAL  ***** --------------------------------------------------------  
//---------------------------------------------------------------------------------------------------------------------------------------------------        
	var optionlist=""; //usada para cargar los moviles en el combo
	$(document).on('pageinit', '#page',  function(){
		$("#btnconectar").click(function() {
			Conectar();
		});
	});

	function Conectar(){
		//leer moviles de la demo
		$.mobile.showPageLoadingMsg("a", "Conectando a "  + $("#ip").val() + "...");
		var result='Error'
		$.ajax({
			type: "POST",
			url: "http://" + $("#ip").val() + "/wstracking/WebService1.asmx/GetMoviles",
			crossDomain: true,
			data: "{ idpropietario: 33}",
			contentType: "application/json; charset=utf-8",
			datatype: "jsonp",
			success: function (data) {
				var movil = data.d;
	            $.each(movil, function (index, m) {
					optionlist += '<option value=' + m.IdEquipo + '>' + m.Patente + '</option>'; 
	            });
				$.mobile.changePage("#main",{transition: "slideup"})
			},
			error: function (err) {
		    	$("#msj").html("Error: no se pudo conectar al servidor.");
    		},
			async: false,
        	cache: false
		});
		$.mobile.hidePageLoadingMsg();
	}

//---------------------------------------------------------------------------------------------------------------------------------------------------  
//--------------------------- VARIABLES Y FUNCIONES DE LA PAGINA ***** MAIN (MENU)  ***** --------------------------------------------------------  
//---------------------------------------------------------------------------------------------------------------------------------------------------        
	$(document).on('pageinit', '#main',  function(){
		$("#iplabel span").text($("#ip").val());
		$("#idequipoSelect").change(function() {
        	movilSeleccionado=$("#idequipoSelect").val();
    	});

		$("#idequipoSelect").html(optionlist).selectmenu('refresh', true);

		movilSeleccionado=$("#idequipoSelect").val();

		$("#btnpos").click(function() {
			$.mobile.showPageLoadingMsg("a", "Cargando...");
			$.mobile.changePage("posicionactual.html", {transition: "slideup"});
		});
		$("#btnreadXML").click(function() {
			$.mobile.changePage("recorrido.html", {transition: "slideup"});
		});
	});

//---------------------------------------------------------------------------------------------------------------------------------------------------  
//--------------------------- VARIABLES Y FUNCIONES DE LA PAGINA ***** RECORRIDO  ***** --------------------------------------------------------  
//---------------------------------------------------------------------------------------------------------------------------------------------------        
	var recorridoArray = [];
	var cantRecorrido = 0;
	var recorridoIndex = 0;
	var MyTimer;
	var sec = 30;
	var timer;
	var progressbar1 = TolitoProgressBar('progressbar')
        .setOuterTheme('b')
        .setInnerTheme('e')
        .isMini(true)
        .setMax(100)
        .setStartFrom(0)
        .setInterval(10)
        .showCounter(true)
        .logOptions()
        .build();

	function Recorrido(movilid, lat,lng,vel,rum,evento,panico,fueradeservicio,input3,input4,ocupado,input6,sms,contacto,conf){
		return {
			movilid:movilid,
			lat:lat,
			lng:lng,
			vel:vel,
			rum:rum,
			evento:evento,
			panico:panico,
			fueradeservicio:fueradeservicio,
			input3:input3,
			input4:input4,
			ocupado:ocupado,
			input6:input6,
			sms:sms,
			contacto:contacto,
			conf:conf
		}
	}


	function EnviarRecorrido() {
		if (recorridoIndex<=cantRecorrido) {
			$('#result').html("Enviando, espere por favor...");
			$('#result').fadeIn("fast");
			//timer para segundero
			$('#countDown').fadeIn();
			timer = setInterval(function() { 
					$('#countDown span').text(sec--);
					if (sec == 0) {
  						//$('#countDown').fadeOut('fast');
  						clearInterval(timer);
  						sec=30;
					} 
					if (sec==27) $('#result').fadeOut("slow");
			}, 1000);
			//actualizar barra de progreso
			progressbar1.setValue((recorridoIndex+1)/cantRecorrido*100);

			Enviar(recorridoArray[recorridoIndex].lat,recorridoArray[recorridoIndex].lng);

			recorridoIndex = recorridoIndex +1;
			
		}else{
			$('#result').html("Envio completado!");
			$("progressbar").fadeOut();
			clearInterval(MyTimer);
			MyTimer =null;
		}
	}


	$(document).on('pageinit', '#resultXML',  function(){
		$("#idmovil span").text(movilSeleccionado);
		//leer xml con recorrido
		cantRecorrido=0;
		$.ajax({
			type: "GET",
			url: "reportes.xml",
			dataType: "xml",
			success: parseXml,
			error: function(err){
				alert("ERR: " + err);
			}
		});
		
		//set timer para enviar recorrido cada 30 segundos
		$("#btnSend").click(function (){
			recorridoIndex=0;
			$('#groupfield').fadeOut('fast');
			$('#btnCancelar').fadeIn('fast');
			EnviarRecorrido();
			MyTimer = setInterval(function () { 
				EnviarRecorrido();				
			}, 30000);
		})

		$("#btnCancelar").click(function (){
			$('#result').html("Envio cancelado!");
			$('#countDown span').text(30);
			$("progressbar").fadeOut();
			$('#idequipoSelect').fadeIn('fast');
			$('#groupfield').fadeIn('fast');
			$('#countDown').fadeOut('fast');
			$('#btnCancelar').fadeOut('fast');
			$('#progressbar').fadeOut('fast');
			clearInterval(MyTimer);
			clearInterval(timer);
			timer=null;
			sec=30;
			MyTimer =null;
		});
	});

	function parseXml(xml) {
		$(xml).find('reporte').each(function() {
			var r = Recorrido(6033, 
							  $(this).find("lat").text(), 
							  $(this).find("lng").text(), 
							  0, 
							  0,
							  $(this).find("estado").text(),
							  0, 0, 0, 0, 0, 0, 0, 0,"");
			
			recorridoArray.push(r);
			cantRecorrido = cantRecorrido + 1;
		});
	}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
