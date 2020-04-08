sap.ui.define(["sap/m/MessageBox"], function(MessageBox) {
   "use strict";

   return {
		/**
		 * Realiza la conversiÃ³n y descarga de un documento pasado en string base64.
		 * @param base64 :		Documento convertido a un string en formato base64 (obligatorio)
		 * @param name :		Nombre del documento con o sin extension (obligatorio)
		 * @param extension :	Extension del documento (solo obligatorio si 'name' viene sin extension)
		 */
		downloadBase64 : function(base64, name, extension) {
			if(!extension) {
				extension = name.substr(name.lastIndexOf(".") + 1);
				name = name.substr(0, name.lastIndexOf("."));
			}
			var byteArray = this.base64ToArrayBuffer(base64);
			var blob = new Blob([byteArray], {
				type: "application/" + extension
			});
			// IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
			if (window.navigator.msSaveBlob) {
			    window.navigator.msSaveOrOpenBlob(blob, name + "." + extension);
			} else {
				var blobUrl = URL.createObjectURL(blob);
				var pom = document.createElement("a");
				pom.setAttribute("href", blobUrl);
				pom.setAttribute("download", name + "." + extension);
				pom.click();
			}
		},
		
		/**
		 * Convierte un string en base64 a un array de bytes.
		 */
		base64ToArrayBuffer : function(base64) {
		    var binaryString =  window.atob(base64);
		    var len = binaryString.length;
		    var bytes = new Uint8Array( len );
		    for (var i = 0; i < len; i++) {
		        bytes[i] = binaryString.charCodeAt(i);
		    }
		    return bytes.buffer;
		},
		// this fucntion remove a js or css from the DOM
		removejscssfile: function(filename, filetype, appname){
		    var targetelement=(filetype==="js")? "script" : (filetype==="css")? "link" : "none"; //determine element type to create nodelist from
		    var targetattr=(filetype==="js")? "src" : (filetype==="css")? "href" : "none"; //determine corresponding attribute to test for
		    var allsuspects=document.getElementsByTagName(targetelement);
		    for (var i=allsuspects.length; i>=0; i--){ //search backwards within nodelist for matching elements to remove
			    if (allsuspects[i] && allsuspects[i].getAttribute(targetattr)!==null && 
			    	allsuspects[i].getAttribute(targetattr).indexOf(filename)!==-1  && 
			    	allsuspects[i].getAttribute(targetattr).indexOf(appname)!==-1) {
			        allsuspects[i].parentNode.removeChild(allsuspects[i]); //remove element by calling parentNode.removeChild()
			    }
			}
		},
		// This functiion calls for logout when the user is iddle for 30 minutes in the app.
		manageInactivityTime: function(){		
			// Reset count initially
			this.resetCount();
			var that = this;
			// Resets count on click event
			document.onclick = function() {
				that.resetCount();
			};
			// Resets count on key press event
			document.onkeypress = function() {
				that.resetCount();
			};
		},
		// This function resets the idle count
		resetCount: function() {
			//Clear count
			jQuery.sap.clearDelayedCall(this.delayedCallId);
			// Start Count
			//2.700.000ms = 45 m
			this.delayedCallId = jQuery.sap.delayedCall(2700000, window, function() {
				MessageBox.alert("Connection expired due to inactivity. Redirecting to Fiori Login Page.", {
					icon: MessageBox.Icon.WARNING,
					title: "Warning",
					onClose: function(sResult) {
						if (sResult === MessageBox.Action.OK) {
							// After OK of user, call logout of Fiori.
							sap.ushell.Container.logout();
						}
					}
				});
			});
		},
		parseExact: function(oElement, that) {

			var sDay, sMonth, sYear, aDate, oDate, maxDays, bBisiesto;
			var oRegExp = /^(\d{2})([\/]\d{2})([\/]\d{4})?$/m;
			var oDaysOfMonth = that.getMaestrosModel().getData().DaysOfMonth;
			var sType = oElement.getMetadata().getName();
			var datevalue = oElement.getValue();

			// Format validation
			switch (sType) {
				case "sap.m.DatePicker":

					sYear = datevalue.substring(0, 4);
					sMonth = datevalue.substring(4, 6);
					sDay = datevalue.substring(6, 8);
					maxDays = oDaysOfMonth[sMonth];

					if ((maxDays !== "undefined") && (sDay <= maxDays) && (sDay > 0) && (sYear !== "undefined")) {
						bBisiesto = ((sYear % 4) === 0) ? true : false;
						if (bBisiesto && (sMonth === "02")) {
							maxDays = parseInt(maxDays, 10) + 1;
							if ((sDay > maxDays) || (sDay <= 0)) {
								// wrong day.
								oElement.setValueState("Error");
								oElement.setValueStateText("Wrong day.");
								oElement.setShowValueStateMessage(true);
								return false;
							}
						}
					} else {
						// wrong date.
						oElement.setValueState("Error");
						oElement.setValueStateText("Wrong date.");
						oElement.setShowValueStateMessage(true);
						return false;
					}
					return true;
					break;

				case "sap.m.DateRangeSelection":
					var sDateFrom, sDateTo;

					var aRange = datevalue.split("-");
					sDateFrom = aRange[0].trim();

					//Se comprueba que se ha introducido un rango completo
					if (aRange[1]) {
						sDateTo = aRange[1].trim();

						// Se comprueba que se ha introducido el formato dd/mm/yyyy correcto
						if (!(oRegExp.test(sDateFrom)) && !(oRegExp.test(sDateTo))) {
							// wrong date.
							oElement.setValueState("Error");
							oElement.setValueStateText("Wrong range.");
							oElement.setShowValueStateMessage(true);
							return false;
						}
					} else {
						// wrong date format.
						oElement.setValueState("Error");
						oElement.setValueStateText("Wrong date format.");
						oElement.setShowValueStateMessage(true);
						return false;
					}
					
						// Llegando a esta lÃ­nea el rango es correcto asi como los formatos de fecha.
						aDate = sDateFrom.split("/");

					for(var fecha in aRange){
						
						aDate = aRange[fecha].split("/");
						sDay = aDate[0];
						sMonth = aDate[1];
						sYear = aDate[2];
						maxDays = oDaysOfMonth[sMonth];
						bBisiesto = ((sYear % 4) === 0) ? true : false;

						if (maxDays) {
							// Calculamos la validez de la fecha
							if (bBisiesto && (sMonth === "02")) {
								maxDays = parseInt(maxDays, 10) + 1;
								if ((sDay > maxDays) || (sDay <= 0)) {
									// wrong day.
									oElement.setValueState("Error");
									oElement.setValueStateText("Wrong day.");
									oElement.setShowValueStateMessage(true);
									return false;
								}
							} else {
								if ((sDay > maxDays) || (sDay <= 0)) {
									// wrong day.
									oElement.setValueState("Error");
									oElement.setValueStateText("Wrong day.");
									oElement.setShowValueStateMessage(true);
									return false;
								}
							}
						} else {
							// wrong month.
							oElement.setValueState("Error");
							oElement.setValueStateText("Wrong month.");
							oElement.setShowValueStateMessage(true);
							return false;
						}
					}
						return true;
						break;
				default:
					return true;
				break;
					}
			}
		
   };
});