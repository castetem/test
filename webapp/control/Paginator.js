sap.ui.define([
		"sap/ui/core/Control",
		"sap/m/Button",
		"sap/m/Text",
		"sap/m/MessageBox"
	],
	function(Control, Button, Text, MessageBox) {

	"use strict";

	return Control.extend("Timelabor.control.Paginator", {

		metadata : {
			properties : {
				table : { type : "sap.m.ListBase" },				// tabla o lista que se va a paginar (obligatorio)
				model : { type : "sap.ui.model" },	                // model del que obtenemos los datos (obligatorio)
				data : { type : "string" },							// funcion que se aplica sobre el odatamodel (obligatorio para oData)
				filter : { type : "sap.ui.model.Filter" },			// filtros aplicados a la funcion (opcional)
				sorter : { type : "sap.ui.model.Sorter" },			// ordenacion aplicada a la funcion (opcional)
				size : { type : "int", defaultValue : 5 },			// numero de resultados por pagina (opcional)
				fncLoad : { type : "object" },						// funcion a la que se le pasa los resultados obtenidos para montar la tabla (opcional)
				fncFilter : { type : "object" },					// funcion a la que se le pasa los resultados obtenidos para realizar un filtrado (opcional)
				fncEdit : { type : "object" },					    // funcion a la que se le pasa los resultados obtenidos para editar la infomaciÃ³n obtenida (opcional) 
				controller : { type : "object" }					// contexto del controlador (opcional). Es obligatorio si 'fncLoad','fncFilter' o 'fncEdit'  es informado (opcional)
			},
			aggregations : {
				_buttonFirst : { type : "sap.m.Button", multiple : false, visibility: "public"},
				_button1 : { type : "sap.m.Button", multiple : false, visibility: "public"},
				_button2 : { type : "sap.m.Button", multiple : false, visibility: "public"},
				_button3 : { type : "sap.m.Button", multiple : false, visibility: "public"},
				_buttonLast : { type : "sap.m.Button", multiple : false, visibility: "public"}
			}
		},

		init : function() {
			var that = this;
			this.setAggregation("_buttonFirst", new Button({
				icon : "sap-icon://close-command-field",
				press : that.onFirst.bind(that),
				visible : false
			}).addStyleClass("firstButton"));
			
			this.setAggregation("_button1", new Button({ 
				text : "1",
				press : that.onPageNumber.bind(that),
				visible : false
			}).addStyleClass("numberButton"));
			this.setAggregation("_button2", new Button({ 
				text : "2",
				press : that.onPageNumber.bind(that),
				visible : false
			}).addStyleClass("numberButton"));
			this.setAggregation("_button3", new Button({ 
				text : "3",
				press : that.onPageNumber.bind(that),
				visible : false
			}).addStyleClass("numberButton"));
			
			this.setAggregation("_buttonLast", new Button({
				iconFirst : false,
				icon : "sap-icon://open-command-field",
				press : that.onLast.bind(that),
				visible : false
			}).addStyleClass("lastButton"));
			
		},

		renderer : function(oRm, oControl) {
			var that = oControl;

			that._dataTable = oControl.getTable();
			that._oModel = oControl.getModel();
			that._oModelType =  oControl.getModel().getMetadata().getName();
			that._sData = oControl.getData();
			that._oFilter = oControl.getFilter();
			that._oSorter = oControl.getSorter();
			that._oJsonData = oControl.getModel().getData();
			that._fncLoad = oControl.getFncLoad();
			that._fncFilter = oControl.getFncFilter();
			that._fncEdit = oControl.getFncEdit();
			that._oController = oControl.getController();
			that._oMetadata   = oControl.getMetadata().getName();
			
			that._btnFirst = oControl.getAggregation("_buttonFirst");
			that._btn1 = oControl.getAggregation("_button1");	// previous
			that._btn2 = oControl.getAggregation("_button2");	// page number
			that._btn3 = oControl.getAggregation("_button3");	// next
			that._btnLast = oControl.getAggregation("_buttonLast");
			
			that._top = oControl.getSize();
			that._skip = 0;
			
			that._funcional = true;
			
			switch (that._oModelType) {
				// Para Modelos Json..... 
				case "sap.ui.model.json.JSONModel":
					// Comprobamos los datos obligatorios para Json
					if(that._dataTable === undefined || that._oModel === undefined ) {
						that._funcional = false;
					}
					if(that._funcional) {
						// EjecuciÃ³n de la funciÃ³n de filtrado de datos
						if(that._fncFilter && that._oController) {
							// Entra por aqui cuando se quiere filtrar el json (mediante la funcion fncFilter)
							that._oModel = new sap.ui.model.json.JSONModel(that._fncFilter(that._oModel.getData(), that._oController));
						}
						//EjecuciÃ³n directa de funciÃ³n _drawNumericButtons
						that._drawNumericButtons(that._skip, that._top, that._oModel.getData().length);
					}
					break;
				// Para Modelos Odata..... 
				case "sap.ui.model.odata.v2.ODataModel":
					// Comprobamos los datos obligatorios para oData
					if(that._dataTable === undefined || that._oModel === undefined || that._sData === undefined) {
						that._funcional = false;
					}
					if(that._funcional) {
						//RecuperaciÃ³n de nÃºmero de datos y ejecuciÃ³n de funciÃ³n _drawNumericButtons
						that._oModel.read(that._sData + "/$count", {
							async : false,
							filters : that._oFilter,
							sorters : that._oSorter,
							success: function (iCount) {
								that._drawNumericButtons(that._skip, that._top, iCount);
							},
							error: that._paginationError
						});
					}
					break;
			}
			
			
			oRm.write("<div");
			oRm.writeControlData(oControl);
			oRm.writeClasses();
			oRm.write(">");
			
			oRm.renderControl(oControl.getAggregation("_buttonFirst"));
			oRm.renderControl(oControl.getAggregation("_button1"));
			oRm.renderControl(oControl.getAggregation("_button2"));
			oRm.renderControl(oControl.getAggregation("_button3"));
			oRm.renderControl(oControl.getAggregation("_buttonLast"));

			oRm.write("</div>");
		},
		
		onFirst : function() {
			this._skip = 0;
			this._paginate(this._skip, this._top);
		},
		
		onLast : function() {
			this._skip = (this._pagTotal - 1) * this._top;
			this._paginate(this._skip, this._top);
		},
		
		onPageNumber : function(oEvent) {
			var numPag = parseInt(oEvent.getSource().getText(), 10) - 1;
			this._paginate(numPag * this._top, this._top);
		},
		
		_drawNumericButtons : function(skip, top, total) {
			this._total = parseInt(total, 10);
			this._pagTotal = (this._total % top) === 0 ? Math.floor(this._total / top) : Math.floor(this._total / top) + 1;
			//console.log("_total: "+this._total+", _pagTotal: " + this._pagTotal);
			
			// establezco a cero la espera para mostrar el busy
			this._dataTable.setBusyIndicatorDelay(0);
			
			// solo mostrarÃ¡ el paginador si hay mÃ¡s de una pÃ¡gina
			if(this._pagTotal > 1) {
				this._btnFirst.setVisible(true);
				this._btn1.setVisible(true);
				this._btn2.setVisible(true);
				this._btnLast.setVisible(true);
				
				if(this._pagTotal > 2) {
					this._btn3.setVisible(true);
				}
			}
			this._paginate(skip, top);
		},
	
    	_paginate : function (skip, top) {
			var that = this;
			this._dataTable.setBusy(true);
			var numPag = skip >= top ? (Math.floor(skip / top) + 1) : 1;
			this._btn1.setType(sap.m.ButtonType.Default);
			this._btn2.setType(sap.m.ButtonType.Default);
			this._btn3.setType(sap.m.ButtonType.Default);
			this._btnFirst.setEnabled(true);
			this._btnLast.setEnabled(true);
			//console.log("skip "+skip+" + top "+top+", numPag: " + numPag +", pagTotal: "+ this._pagTotal);
			
			if(this._pagTotal === 1) {
					this._btn1.setType(sap.m.ButtonType.Emphasized);
					this._btn1.setText(numPag);
					this._btnFirst.setEnabled(false);
					this._btnLast.setEnabled(false);
				
			} else if(this._pagTotal === 2) {
				if(numPag === 1) {
					this._btn1.setType(sap.m.ButtonType.Emphasized);
					this._btn1.setText(numPag);
					this._btn2.setText(numPag + 1);
					this._btnFirst.setEnabled(false);
				
				} else if(numPag === 2) {
					this._btn1.setText(numPag - 1);
					this._btn2.setText(numPag);
					this._btn2.setType(sap.m.ButtonType.Emphasized);
					this._btnLast.setEnabled(false);
				} 
			} else {
				// entrara aqui siempre que tenga 3 paginas o mas
				if(numPag === 1) {
					this._btn1.setType(sap.m.ButtonType.Emphasized);
					this._btn1.setText(numPag);
					this._btn2.setText(numPag + 1);
					this._btn3.setText(numPag + 2);
					this._btnFirst.setEnabled(false);
				
				} else if(numPag > 1 && numPag < this._pagTotal) {
					this._btn1.setText(numPag - 1);
					this._btn2.setText(numPag);
					this._btn2.setType(sap.m.ButtonType.Emphasized);
					this._btn3.setText(numPag + 1);
					
				} else if(numPag === this._pagTotal) {
					this._btn1.setText(numPag - 2);
					this._btn2.setText(numPag - 1);
					this._btn3.setText(numPag);
					this._btn3.setType(sap.m.ButtonType.Emphasized);
					this._btnLast.setEnabled(false);
				}
			}
			
			
			switch (this._oModelType) {
				// Para Modelos Json..... 
				case "sap.ui.model.json.JSONModel":
					var oData = this._oModel.getData();
					// Calculos para la paginaciÃ³n
					var pagFrom = (oData.length > 0) ? skip + 1 : 0;
					var pagTo = (skip + top) > this._total ? this._total : (skip + top);
					var pagTotal = this._total;
					
					// PaginaciÃ³n del Json
					var pagedData = [];
					for(var i = 0; i <= oData.length; i++) {
						if( i+1 >= pagFrom && i+1 <= pagTo ) {
							pagedData.push(oData[i]);
						}
					}

					// Creamos el objeto results
					var oResults = { 
						"pagFrom" : pagFrom,
						"pagTo" : pagTo,
						"pagTotal" : pagTotal,
						"results" : pagedData 
					};
					
					var oJsonModel = new sap.ui.model.json.JSONModel(oResults);
					this._dataTable.setModel(oJsonModel);
					this._dataTable.setBusy(false);
					
					break;
				// Para Modelos Odata..... 
				case "sap.ui.model.odata.v2.ODataModel":
					var oUrlParams = "$skip=" + skip + "&$top=" + top;
					this._oModel.read(this._sData, {
						urlParameters : oUrlParams,
						filters : this._oFilter,
						sorters : this._oSorter,
						success: function (oData) {
							// Calculos para la paginaciÃ³n
							oData.pagFrom = (oData.results.length > 0) ? skip + 1 : 0;
							oData.pagTo = (skip + top) > that._total ? that._total : (skip + top);
							oData.pagTotal = that._total;
							
							if(that._fncLoad && that._oController){
								// entra por aqui cuando se monta la tabla por javascript desde el controlador (mediante la funcion fncLoad)
								that._fncLoad(oData, that._oController);
							} else {
								if(that._fncEdit && that._oController){
									// entra por aqui cuando se quiere editar algun elemento del json desde el controlador   (mediante la funcion _fncEdit)
									oData = that._fncEdit(oData, that._oController);
								}
								// entra por aqui cuando se monta la tabla por model
								var oDataModel = new sap.ui.model.json.JSONModel(oData);
								that._dataTable.setModel(oDataModel);
								that._dataTable.setBusy(false);
							}
						},
						error: this._paginationError
					});
					break;
			}
       },
		
		_paginationError : function(oError) {
			var message, data;
			
			try {
				// lo formateamos a JSON
				data = $.parseJSON(oError.responseText);
				message = "";
				
				// obtengo el nombre del servicio
				// if(data.error.innererror.application) {
				// 	service = data.error.innererror.application.service_id;
				// }
				// obtengo el mensaje de error
				if(data.error.innererror.errordetails && data.error.innererror.errordetails.length > 0) {
					for(var i=0; i < data.error.innererror.errordetails.length; i++) {
						if(data.error.innererror.errordetails[i].code !== "/IWBEP/CX_SD_GEN_DPC_BUSINS") {
							//message += data.error.innererror.errordetails[i].code + " - " + data.error.innererror.errordetails[i].message + "\n";
							message += data.error.innererror.errordetails[i].message + "\n";
						}
					}
				} else {
					message += data.error.message.value;
				}
			}
			catch(err) {
				// si el formateo a JSON falla, lo intentamos formatear a XML
				data = $.parseXML(oError.responseText);
				var $xml = $(data);
				var $message = $xml.find("innererror").find("message");
				if(!$message.text()){
				      $message = $xml.find("message");
				}
				//var $service = $xml.find( "service_id" );
				message = $message.text();
				//service = $service.text();
			}
			
			// Mostramos el mensaje de error por pantalla
			MessageBox.alert(message, {
			    icon: MessageBox.Icon.ERROR,
			    title: "Error"
        	});
		}
	});
	
});