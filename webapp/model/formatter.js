sap.ui.define([
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/CalendarType",
	"sap/ui/core/format/NumberFormat"
	], function(DateFormat,CalendarType,NumberFormat){
	"use strict";
	
	return {
		
		// convierte un string en formato 0.000.000,00 a float
		stringToFloat : function(sValue) {
			return parseFloat(sValue.split(".").join("").replace(",", "."));
		},
		
		// convierte un float en un string con formato 0.000.000,00
		floatToString : function(fValue) {
			var oNumberFormat = NumberFormat.getFloatInstance({
                minIntegerDigits: 1, 
                maxFractionDigits: 2,
                minFractionDigits: 2,
                groupingEnabled: true, 
                groupingSeparator: ".", 
                decimalSeparator: "," 
             });
             var stringNumber = oNumberFormat.format(fValue);
             return stringNumber;
		},
		
		/** Convierte una fecha en formato string del tipo yyyyMMddHHmmss a un objeto Date.
		 *  @params sDate:		Fecha en texto a formatear
		 *  @params sFormat:	Formato de la fecha introducida
		 */
		stringToDate : function(sDate, sFormat) {
			var oDate;
			// si sFormat no viene informado se establece el formato por defecto
			var formato = sFormat ? sFormat : "yyyyMMddHHmmss";
	    	if(sDate) {
				oDate = DateFormat.getInstance({pattern: formato, calendarType: CalendarType.Gregorian}).parse(sDate);
	    	}
			return oDate;
		},
		
		// FunciÃ³n para formatear fechas de tipo Date a String
	    // @params oDate: Fecha a formatear
	    // @params sPattern: Mascara de formateo
	    dateToString : function(oDate, sPattern) {
	    	var sDate;
	    	if(oDate) {
	    		sDate = DateFormat.getInstance({pattern: sPattern, calendarType: CalendarType.Gregorian}).format(oDate);
	    	} else {
	    		sDate = "-";
	    	}
	    	return sDate;
	    },
		// FunciÃ³n para formatear fechas de tipo String al formato que se elija
		//( esta funcion para formater en xml combina las funciones stringToDate y dateToString)
	    // @params sDate: Fecha en texto a formatear
	    // @params sPattern: Mascara de formateo
	    stringToFormattedDate: function(sDate,sPattern) {
	    	var oDate,formattedDate;
	    	if(sDate) {
	    		// Recuperamos el objeto Date()
	    		oDate         = this.formatter.stringToDate(sDate);
	    		// Formateamos el objeto date recuperado con la mascara pedida
		    	formattedDate = this.formatter.dateToString(oDate,sPattern);
	    	}
	    	return formattedDate;
	    },
	    formatDateRange: function(sStartDate,sEndDate,sPattern) {
			var oStartDate,oEndDate,formattedStartDate,formattedEndDate,formattedDateRange;
			// Formateamos la fecha de inicio
			// Recuperamos el objeto Date() a partir de sStartDate
    		oStartDate    = this.formatter.stringToDate(sStartDate);
    		// Formateamos el objeto date recuperado con la mascara dd/MM/yyyy
	    	formattedStartDate = this.formatter.dateToString(oStartDate,sPattern);
	    	// Comprobamos que exista una fecha de fin
			if(sEndDate) {
				// Recuperamos el objeto Date() a partir de sEndDate
	    		oEndDate    = this.formatter.stringToDate(sEndDate);
	    		// Formateamos el objeto date recuperado con la mascara dd/MM/yyyy
		    	formattedEndDate = this.formatter.dateToString(oEndDate,sPattern);
				// Generamos el rango de fechas
				formattedDateRange = formattedStartDate + " - " + formattedEndDate;
				return formattedDateRange;
			} else {
				return formattedStartDate;
			}
	    },
	    formatDateKPI: function(sDate) {
	    	var formattedDate;
	    	if(sDate) {
		    	var aMonths = this.getOwnerComponent().getModel("Maestros").getProperty("/Months"),
		    		day     = sDate.substring(6, 8),
		    		month   = aMonths[parseInt(sDate.substring(4, 6),10)];
		    		formattedDate = month + ", " + day;
	    	}
	    	return formattedDate;
	    },
	    
		formatIdTimecards:function(sDate){
			if(sDate==="" || sDate==="-" || sDate===null || sDate===undefined){
				return;
			}
			var aMonths = this.getOwnerComponent().getModel("Maestros").getProperty("/Months"),
				month   = aMonths[parseInt(sDate.substring(4, 6),10)],
				year =sDate.substr(0,4),
				formattedDate = month + " " + year;
			return formattedDate;	
		},
		
		formatDateTimecards:function(sDate){
			if(sDate==="" || sDate==="-" || sDate===null || sDate===undefined ){
				return "-";
			}
			var year = sDate.substring(0, 4),
				month = sDate.substring(4, 6),
				day = sDate.substring(6, 8),
				formattedDate = day + "/" + month + "/" +year;
			return formattedDate;	
		},
	    
	    // Devuelve el tipo de una variable (number, string, Function, etc)
		typeOf : function(value) {
		    var type = typeof value;
		
		    switch(type) {
		        case 'object':
			        return value === null ? 'null' : Object.prototype.toString.call(value).match(/^\[object (.*)\]$/)[1];
		        case 'function':
		        	return 'Function';
		        default:
		        	return type;
		    }
		},
		
		acortarNombre : function(sName) {
			if(sName.length < 24) {
				return sName;
			}
			
			var strSplit = sName.split(",");
			var nombres = strSplit[1].trim();
			var apellidos = strSplit[0].trim();
			
			strSplit = nombres.split(" ");
			var nombre;
			if(strSplit.length > 1) {
				nombre = strSplit[0] + " " + strSplit[1].substr(0, 1) + ".";
			} else {
				nombre = strSplit[0];
			}
			
			strSplit = apellidos.split(" ");
			var apellido;
			if(apellidos.length > 1) {
				apellido = strSplit[0] + " " + strSplit[1].substr(0, 1) + ". ";
			} else {
				apellido = strSplit[0] + " ";
			}
			
			return apellido + ", " + nombre;
		},
		
		// Muestra '-' en las cajas de texto cuyo dato este vacÃ­o
		// @params sValue: Valor a tratar
		voidData: function(sValue) {
			if( !sValue ) {
				return "-";
			} else {
				return sValue;
			}
		}

		
/*		floatToString2 : function (num) {
			var separador = "."; // separador para los miles
			var sepDecimal = ","; // separador para los decimales
			num += "";
			var splitStr = num.split(".");
			var splitLeft = splitStr[0];
			var splitRight = splitStr.length > 1 ? sepDecimal + splitStr[1] : "";
			var regx = /(\d+)(\d{3})/;
			while (regx.test(splitLeft)) {
				splitLeft = splitLeft.replace(regx, "$1" + separador + "$2");
			}
			return splitLeft + splitRight;
		}*/
	};
});