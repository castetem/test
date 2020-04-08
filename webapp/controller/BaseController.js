sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Icon",
	"com/everis/Absentismos/control/Paginator",
	"com/everis/Absentismos/model/formatter",
	"com/everis/Absentismos/model/Utils"
], function (Controller, History, MessageBox, MessageToast,Filter,FilterOperator,Icon, Paginator, formatter, Utils) {
	"use strict";
	return Controller.extend("com.everis.Absentismos.controller.BaseController", {
		getJSONModel : function() {
			return this.getOwnerComponent().getModel("absentismos");
		},
		getModelGlobalVars : function() {
			return this.getOwnerComponent().getModel("GlobalVars");
		},
		getDeviceModel : function() {
			return sap.ui.getCore().getModel("device");
		},
		getProjectsOdataModel : function() {
			this.getOwnerComponent().getModel("PROJECTS1").refreshSecurityToken();
			return this.getOwnerComponent().getModel("PROJECTS1");
		},
		getUtilsOdataModel : function() {
			this.getOwnerComponent().getModel("UTILS").refreshSecurityToken();
			return this.getOwnerComponent().getModel("UTILS");
		},
		getTimelaborOdataModel : function() {
			this.getOwnerComponent().getModel("TIMESHEET1").refreshSecurityToken();
			return this.getOwnerComponent().getModel("TIMESHEET1");
		},
		getMaestrosModel : function() {
			return this.getOwnerComponent().getModel("Maestros");
		},	
		// Evento para simplificar las llamadas al routing del manifest.json.
		getRouter : function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		// Eventos de Breadcrumbs
		goToFiori : function() {
			// Regresamos al launchpad de Fiori
			var URL = "/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#Shell-home";
			window.location.replace(URL);
		},
		goToHome: function () {
			this.getRouter().navTo("Home", {});
		},
		goToTimeEntry  : function(sMonth){
			var jsonData = {};
	    	
	    	if(localStorage.getItem("TL_Internos")) {
				jsonData = JSON.parse(localStorage.getItem("TL_Internos"));
	    	}
			// Guardamos los parametros en localStorage para recduperarlos cuando se recargue la pantalla
	    	jsonData.Month = sMonth;
	    	localStorage.setItem("TL_Internos", JSON.stringify(jsonData));
			this.getRouter().navTo("TimeEntry", {});	
		},
		goToAccess: function(){
			this.getRouter().navTo("AccessAuthorizations",{});
		},
		goToSearch: function(){
			this.getRouter().navTo("Search",{});
		},

		// goToMenu: function(oEvent){
		// 	var that=this;
		// 	var host="/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#";
		// 	var display="-display";
		// 	var app;
		// 	switch(oEvent.mParameters.item.mProperties.text){
		// 		case "Menu":
		// 			var sideNavigation = that.getView().byId('sideNavigation');
		// 			var expanded = !sideNavigation.getExpanded();
		// 			sideNavigation.setExpanded(expanded);
		// 			break;
		// 		case "Time Labor":
		// 			app="ZDemoTimeLabor";
		// 			window.location.replace(host+app+display);
		// 			break;
		// 		case "Subcontracted Services Rendered":
		// 			app="ZDemoTLSubcontracted";
		// 			window.location.replace(host+app+display);
		// 			break;
		// 		case "Reimbursement for Expenses Incurred":
		// 			app="ZDemoExpensesSubcontracted";
		// 			window.location.replace(host+app+display);
		// 			break;
		// 		case "Expenses Sheets":
		// 			app="ZDemoExpenses";
		// 			window.location.replace(host+app+display);
		// 			break;
		// 		case "Project Management":
		// 			app="ZDemoProject";
		// 			window.location.replace(host+app+display);
		// 			break;
		// 		case "Opportunity Management":
		// 			app="ZDemoMAB";
		// 			window.location.replace(host+app+display);
		// 			break;
		// 		case "Reporting":
		// 			app="ZDemoUI5";
		// 			window.location.replace(host+app+display);
		// 			break;
		// 		case "Workflow":
		// 			app="WorkflowTask-displayInbox?allItems=true";
		// 			window.location.replace(host+app);
		// 			break;
		// 		default:
		// 			break;
		// 	}
		// },
		
		// initSidePanel: function(oEvent){
		// 	// Esto solo funciona en Fiori por lo que si existe el ushell ( que es de fiori) se ejecutarÃ¡ el menu.
		// 	// Esto se hace para evitar los errores por no poder conectar.
		// 	if(sap.ushell) {
		// 		var url = "";
		// 	    var mData = new sap.ui.model.odata.ODataModel(url);  
		// 		var that=this;
		// 		mData.read("/sap/opu/odata/UI2/PAGE_BUILDER_PERS/Pages('%2FUI2%2FFiori2LaunchpadHome')/PageChipInstances",{
		// 			success: function(oData){
		// 				for(var i=0; i<oData.results.length; i++){
		// 					mData.read("/sap/opu/odata/UI2/PAGE_BUILDER_PERS/ChipProperties(chipId='"+oData.results[i].chipId+"',bagId='tileProperties',name='display_title_text')",{
		// 						success: function(oData){
		// 							var NavigationListItem = new sap.tnt.NavigationListItem();
		// 							var NavigationList = that.byId("navigationList");
		// 							switch(oData.value){
		// 								case "Time Labor":
		// 									NavigationListItem.setIcon("sap-icon://calendar");
		// 									NavigationListItem.setText("Time Labor");
		// 									NavigationList.addItem(NavigationListItem);
		// 									break;
		// 								case "Expenses Sheets":
		// 									NavigationListItem.setIcon("sap-icon://lead");
		// 									NavigationListItem.setText("Expenses Sheets");
		// 									NavigationList.addItem(NavigationListItem);
		// 									break;
		// 								case "Project Management":
		// 									NavigationListItem.setIcon("sap-icon://action-settings");
		// 									NavigationListItem.setText("Project Management");
		// 									NavigationList.addItem(NavigationListItem);
		// 									break;
		// 								case "Opportunity Management":
		// 									NavigationListItem.setIcon("sap-icon://notes");
		// 									NavigationListItem.setText("Opportunity Management");
		// 									NavigationList.addItem(NavigationListItem);
		// 									break;
		// 								case "Subcontracted Services Rendered":
		// 									NavigationListItem.setIcon("sap-icon://per-diem");
		// 									NavigationListItem.setText("Subcontracted Services Rendered");
		// 									NavigationList.addItem(NavigationListItem);
		// 									break;
		// 								case "Reimbursement for Expenses Incurred":
		// 									NavigationListItem.setIcon("sap-icon://monitor-payments");
		// 									NavigationListItem.setText("Reimbursement for Expenses Incurred");
		// 									NavigationList.addItem(NavigationListItem);
		// 									break;
		// 								case "Reporting":
		// 									NavigationListItem.setIcon("sap-icon://activity-items");
		// 									NavigationListItem.setText("Reporting");
		// 									NavigationList.addItem(NavigationListItem);
		// 									break;
		// 								default:
		// 									break;
		// 							}
		// 						},
		// 						error:that._oDataError.bind(that)
		// 					});
		// 				}
		// 			},
		// 			error:that._oDataError.bind(that)
		// 		});	
		// 	}
		// },
		
		/*****************************************************************/
		/** Funciones de validaciÃ³n                                     **/
		/*****************************************************************/	
		// FunciÃ³n de validaciÃ³n en los eventos change de los elementos
		// @params		oEvent: Evento que se ejecuta ( incluye acceso al elemento que lo ejecuta)		
		onChangeValidate: function(oEvent){
			// Llamamos a la funciÃ³n generica de validaciÃ³n
			// El segundo parametro indica si los campos son obligatorios ( Create ) o no ( Update )
			this._validate( oEvent.getSource(),false );
		}, 
		//Evento change de los input con porcentaje
		// @params		oEvent: Evento ejecutado
		onChangePercentage: function(oEvent) {
			this._percentageValidation( oEvent.getSource(),false );
		},
		// FunciÃ³n de validaciÃ³n al pulsar a botones de guardado
		// @params		aIdElements: Array de Ids a validar
		//              swValidateVoid: Indica si hay que validar campos vacios (Create ) o no (Update)
		// @return		validateFlag: true: Pasa todas las validaciones 
		//                            false: No ha pasado al menos una de las validaciones
		onSaveValidate: function(aIdElements,swValidateVoid){
			// Habilitamos switch para validar.
			var i,oElement;
			var validate = true;
			//Recorremos el array de ids
			for(i = 0; i < aIdElements.length; i++) {
				if(sap.ui.getCore().byId(aIdElements[i])){
					// Esto solo funciona para elementos en fragments
					oElement = sap.ui.getCore().byId(aIdElements[i]);
				} else {
					// Esto solo funciona para elementos en vistas
					oElement = this.byId(aIdElements[i]);
				}
				
				var clase = oElement.getMetadata().getName();
				var value;
				// Recuperamos el valor segÃºn el tipo de elemento que tengamos
				switch(clase) {
					case "sap.m.Input" : 
					default:
						value = oElement.getValue().trim();
						break;
					case "sap.m.DatePicker" :
					case "sap.m.DateRangeSelection":
						value = oElement.getDateValue();
						break;
					case "sap.m.ComboBox" :
						value = oElement.getSelectedKey(); 
						break;
					case "sap.ui.unified.FileUploader" :
						value = oElement.getValue();
						break;
					case "sap.m.SearchField":
						value = oElement.getValue();
						break;
				}
				
				// Para el searchfield hacemos un tratameinto diferente
				if(clase === "sap.m.SearchField") {
					// Validamos que el elemento no este vacÃ­o
					if(swValidateVoid && !value) {
			            oElement.addStyleClass("searchFieldError");
			            validate = false;
			        } else {
			        	if(oElement.hasStyleClass("searchFieldError")) {
							 validate = false;
						}
			        }
				} else {
					// Validamos que el elemento no este vacÃ­o
					if(swValidateVoid && !value) {
			            try {
			            	oElement.setValueState("Error");
			            	oElement.setValueStateText("Field required");
			            } catch(err){
			            	oElement.setValueState("Error");
			            }
	
			            validate = false;
			        } else {
			        	if(oElement.getValueState() === "Error") {
							 validate = false;
						}
			        }
				}
		        
        	}
        	return validate;
		},
		// FunciÃ³n genÃ©rica de validaciÃ³n de formato de campos
		// @params		oElement: Elemento a validar
		//              swValidateVoid: Indica si hay que validar campos vacios (Create ) o no (Update)
		// @return		true: Pasa todas las validaciones 
		//              false: No ha pasado al menos una de las validaciones
		_validate: function(oElement,swValidateVoid){

			// Recuperamos el tipo de elemento que se tiene
			var clase = oElement.getMetadata().getName();
			var valor;
			// Recuperamos el valor segÃºn el tipo de elemento que tengamos
			// y validamos que el formato sea correcto
			switch(clase) {
				case "sap.m.Input" : 
				default       :
					valor = this._inputValidation(oElement,swValidateVoid);
				break;
				case "sap.m.DatePicker" :
					valor = this._datepickerValidation(oElement,swValidateVoid);
				break;
				case "sap.m.DateRangeSelection":
					valor = this._dateRangeValidation(oElement,swValidateVoid);
				break;				
				case "sap.m.ComboBox" :
					valor = this._comboValidation(oElement,swValidateVoid);
				break;
				case "sap.ui.unified.FileUploader" :
					valor = this._uploaderValidation(oElement,swValidateVoid);
				break;
			}
			return valor;
		}, 
		// FunciÃ³n validaciÃ³n de formato de inputs
		// @params		oElement: Elemento a validar
		//              swValidateVoid: Indica si hay que validar campos vacios (Create ) o no (Update)
		_inputValidation:function(oElement,swValidateVoid){
			var input=oElement;
			var inputValue=input.getValue();
			// Validamos campos vacios solo para el create (swValidateVoid = true)
			if(swValidateVoid && inputValue === "") {
	            input.setValueState("Error");
	            input.setValueStateText("Field required");
	            return false;
			}
			//ValidaciÃ³n longitud de campo
			var inputLength = inputValue.length;
			var inputMaxLength = input.getMaxLength();
			if( inputLength > inputMaxLength ){
				input.setValueState("Warning");
				input.setValueStateText("Maximum length reached");
				input.setValue(inputValue.substr(0,inputMaxLength));
				input.setShowValueStateMessage(true);
				return false;
			}
			
			// Validacion caracteres especiales
			//var oRegExp = new RegExp(this.getI18nModel().getResourceBundle().getText("regExp"));
			var oRegExp = new RegExp(this.getMaestrosModel().getProperty("/regExp"));
			if ( !oRegExp.test(inputValue.toString() ) ) {
				if(inputValue !== "") {
					input.setValueStateText("Character not allowed");
					input.setValueState("Error");
					input.setShowValueStateMessage(true);
					return false;
				}
			} 
			
			input.setValueState("None");
			input.setShowValueStateMessage(false);
			return true;
			
		},
		// FunciÃ³n validaciÃ³n de formato de combos
		// @params		oElement: Elemento a validar
		//              swValidateVoid: Indica si hay que validar campos vacios (Create ) o no (Update)
		_comboValidation:function(oElement,swValidateVoid){
			var combo = oElement; 
			var comboItems = combo.getItems();
			var comboValue = combo.getValue();
			var comboKey = combo.getSelectedKey();
			// Validamos campos vacios solo para el create (swValidateVoid = true)
			if(swValidateVoid && comboValue === "") {
	            combo.setValueState("Error");
	            combo.setValueStateText("Field required");
	            return false;
			}
			// Buscamos el valor en el combo
			var found = false;
			for(var i = 0; i < comboItems.length; i++)
			{
				if(comboValue === comboItems[i].getText()){
					found = true;
					break;
				}
				if(comboKey === comboItems[i].getKey()){
					found = true;
					break;
				}
				
			}
			// Validamos que se haya encontrado el valor escrito en el combo
			if(!found && comboValue !== ""){
				combo.setValueState("Error");
				combo.setValueStateText("Element not found in select");
				combo.setShowValueStateMessage(true);
				return false;
			}
			// Si pasamos todas las validaciones quitamos el error en el elemento
			combo.setValueState("None");
			combo.setShowValueStateMessage(false);
			return true;
		},
		// FunciÃ³n validaciÃ³n de formato de datepicker
		// @params		oElement: Elemento a validar
		//              swValidateVoid: Indica si hay que validar campos vacios (Create ) o no (Update)
		_datepickerValidation:function(oElement,swValidateVoid){
			var datepicker = oElement;
			var datepickerValue = datepicker.getValue();
			var datepickerLength = datepickerValue.length;
			var datepickerMaxLength = 10;
			// Validamos campos vacios solo para el create (swValidateVoid = true)
			if(swValidateVoid && datepickerValue === "") {
	            datepicker.setValueState("Error");
	            datepicker.setValueStateText("Field required");
	            return false;
			}
			//ValidaciÃ³n longitud de campo
			if( datepickerLength > datepickerMaxLength ){
				datepicker.setValueStateText("Maximum length reached");
				datepicker.setValue(datepickerValue.substr(0,datepickerMaxLength));
				datepicker.setValueState("Warning");
				datepicker.setShowValueStateMessage(true);
				return false;
			}
			
			//ComprobaciÃ³n de la validez de la fecha
			var sDate = datepickerValue.replace("/", "");

			var oDateParsed = Utils.parseExact(oElement, this);
			
			/*var iDay = parseInt(sDate.substring(6, 8));
			var iMonth = parseInt(sDate.substring(4, 6));
			var iYear = parseInt(sDate.substring(0, 4));
			var oDate = new Date(iYear, iMonth - 1, iDay);*/

			if ( !oDateParsed ) {
				/*datepicker.setValueStateText("Wrong date");
				datepicker.setValueState("Error");
				datepicker.setShowValueStateMessage(true);*/

				return false;
			}

			// Si pasamos todas las validaciones quitamos el error en el elemento
			datepicker.setValueState("None");
			datepicker.setShowValueStateMessage(false);
			return true;
		},
		// FunciÃ³n validaciÃ³n de formato de dateRange
		// @params		oElement: Elemento a validar
		//              swValidateVoid: Indica si hay que validar campos vacios (Create ) o no (Update)
		_dateRangeValidation:function(oElement,swValidateVoid){
			var dateRange = oElement;
			var dateRangeValue = dateRange.getValue();
			// Validamos campos vacios solo para el create (swValidateVoid = true)
			if(swValidateVoid && dateRangeValue === "") {
	            dateRange.setValueState("Error");
	            dateRange.setValueStateText("Field required");
	            return false;
			}
			
			/*// Validamos que las fechas introducidas son vÃ¡lidas
			var oRegExp = /^(\d{2})([\/]\d{2})([\/]\d{4})?$/m;
			var sDate = dateRange.getValue();

			var sDateFrom = sDate.split("-")[0];
			var sDateTo = sDate.split("-")[1];

			sDateFrom = sDateFrom.trim();

			// si falta una fecha lanza el error
			if ( sDateTo === undefined ) {
				dateRange.setValueState("Error");
				dateRange.setValueStateText("Expect Date To");
				dateRange.setShowValueStateMessage(true);
				return false;
			} else {
				sDateTo = sDateTo.trim();
			}

			// si no cumple con el patron alguna de las dos que lance error
			if (!oRegExp.test(sDateFrom) || !oRegExp.test(sDateTo)) {
				dateRange.setValueState("Error");
				dateRange.setValueStateText("Wrong Format");
				dateRange.setShowValueStateMessage(true);
				return false;
			} else {
				//cumple con el patrÃ³n, se evalua la fecha

				// - Fecha inicial
				var oDateFrom = Date.parseExact(sDateFrom, "d/M/yyyy");

				// - Fecha final
				var oDateTo = Date.parseExact(sDateTo, "d/M/yyyy");

				if (oDateFrom === null || oDateTo === null) {
					dateRange.setValueState("Error");
					dateRange.setValueStateText("Wrong Date");
					dateRange.setShowValueStateMessage(true);
					return false;
				}

			}*/
			var oDate = Utils.parseExact(oElement, this);
			if(!oDate){
				return false;
			}
			// Si pasamos todas las validaciones quitamos el error en el elemento
			dateRange.setValueState("None");
			dateRange.setShowValueStateMessage(false);
			return true;
		},
		// FunciÃ³n validaciÃ³n de formato de uploader
		// @params		oElement: Elemento a validar
		//              swValidateVoid: Indica si hay que validar campos vacios (Create ) o no (Update)
		_uploaderValidation:function(oElement,swValidateVoid){
			var uploader = oElement;
			var uploaderValue = uploader.getValue();
			// Validamos campos vacios solo para el create (swValidateVoid = true)
			if(swValidateVoid && uploaderValue === "") {
	            uploader.setValueState("Error");
	            return false;
			}
			// Si pasamos todas las validaciones quitamos el error en el elemento
			uploader.setValueState("None");
			return true;
		},
		// FunciÃ³n validaciÃ³n de formato de input de porcentajes
		// @params		oElement: Elemento a validar
		//              swValidateVoid: Indica si hay que validar campos vacios (Create ) o no (Update)
		_percentageValidation: function(oElement,swValidateVoid) {
			var percentage = oElement;
			var percentageValue = percentage.getValue();
			var percentageLength = percentageValue.length;
			var percentageMaxLength = percentage.getMaxLength() ;
			// Validamos campos vacios solo para el create (swValidateVoid = true)
			if(swValidateVoid && percentageValue === "") {
	            percentage.setValueState("Error");
	            percentage.setValueStateText("Field required");
	            return false;
			}
			//ValidaciÃ³n longitud de campo
			if( percentageLength > percentageMaxLength ){
				percentage.setValueStateText("Maximum length reached");
				percentage.setValue(percentageValue.substr(0,percentageMaxLength));
				percentage.setValueState("Warning");
				percentage.setShowValueStateMessage(true);
				return false;
			}
			//ValidaciÃ³n porcentaje entre 0 y 100
			if( ( parseFloat(percentageValue).toFixed(2) < 0 ) || ( parseFloat(percentageValue).toFixed(2) > 100 ) ) {
				percentage.setValueStateText("Percentage must be between 0 and 100");
				percentage.setValueState("Error");
				percentage.setShowValueStateMessage(true);
				return false;
			}
			// Si pasamos todas las validaciones quitamos el error en el elemento
			percentage.setValueState("None");	
			percentage.setShowValueStateMessage(false);
			return true;
		},
		
		/** General para todas las busquedas  **/
		
		/*
		 * Se ejecuta al cambiar el campo seleccionado por el usuario para filtrar.
		 */
		onChangeField : function(oEvent) {
			// Eliminamos el elemento para filtrar
			sap.ui.getCore().byId("boxFilterContainer").removeAllItems();
			var that = this;
			
			this._objectCurrent = oEvent.getParameter("selectedItem").getBindingContext("FilterModel").getObject();
			
			switch(this._objectCurrent.type) {
				case "Number" : 
					this._input = new sap.m.Input({
						liveChange : function(){
							sap.ui.getCore().byId("btnAddFilter").setEnabled(that._input.getValue().length > 0);
						},
						type : sap.m.InputType.Number,
						placeholder : "Filter detail",
						layoutData : new sap.m.FlexItemData({ growFactor : 1 })
					});
					this._input.onsapenter = function() {
						if(that._input.getValue().length > 0) {
							that.onAddFilter();
						}
					};
					break;
				case "Date" : 
					this._input = new sap.m.DatePicker({
						placeholder : "Select date",
						valueFormat : "yyyyMMdd",
						displayFormat : "dd/MM/yyyy",
						layoutData : new sap.m.FlexItemData({ growFactor : 1 }),
						change : function(){
							sap.ui.getCore().byId("btnAddFilter").setEnabled(that._input.getValue().length > 0);
						}
					});
					break;
				case "Combo" :
					this._input = new sap.m.ComboBox({
						selectionChange : function(){
							sap.ui.getCore().byId("btnAddFilter").setEnabled(that._input.getSelectedItem().getText().length > 0);
						},
						type : sap.m.InputType.Text,
						placeholder : "Filter detail",
						textAlign : sap.ui.core.TextAlign.Initial,
						width: "100%",
						layoutData : new sap.m.FlexItemData({ growFactor : 1 })
					});
					if(this._objectCurrent.filter) {
						this._input.bindItems({
							path : this._objectCurrent.service,
				    		template : new sap.ui.core.ListItem({ key:this._objectCurrent.comboKey, text:this._objectCurrent.comboName }),
				    		//Este es un filtro que se aÃ±ade para Company Code, pero se hace genÃ©rico por si se necesita un filtro a futuro para otro combo
				    		filters: [ new Filter(this._objectCurrent.filterName, FilterOperator.EQ, this._objectCurrent.filterValue) ]
						});
					} else {
						this._input.bindItems({
							path : this._objectCurrent.service,
				    		template : new sap.ui.core.ListItem({ key:this._objectCurrent.comboKey, text:this._objectCurrent.comboName })
						});
					}
					break;
				case "Searchfield" :
					this._input = new sap.m.SearchField({
						enableSuggestions:true,
						showSearchButton:false,
						width: "100%",
						suggest: function(oEvent1) {
							that.onSuggestData(oEvent1,that._objectCurrent.field);
						},
						search: function(oEvent1) {
							that.onSelectData(oEvent1,that._objectCurrent.field);
						}
					}).addStyleClass("textAlignLeft");
	                this._input.bindAggregation("suggestionItems", {
                        path : this._objectCurrent.service,
						template : new sap.m.SuggestionItem({ key: this._objectCurrent.key, text: this._objectCurrent.Name })
                	});
					break;
				default: // case "String" y cualquier otro
					this._input = new sap.m.Input({
						liveChange : function(){
							sap.ui.getCore().byId("btnAddFilter").setEnabled(that._input.getValue().trim().length > 0);
						},
						type : sap.m.InputType.Text,
						placeholder : "Filter detail",
						textAlign : sap.ui.core.TextAlign.Initial,
						layoutData : new sap.m.FlexItemData({ growFactor : 1 })
					});
					this._input.onsapenter = function() {
						if(that._input.getValue().trim().length > 0) {
							that.onAddFilter();
						}
					};
					break;
			}
			sap.ui.getCore().byId("boxFilterContainer").addItem(this._input);
		},
		
		/*
		 * Anyade un filtro de la busqueda.
		 */
		onAddFilter   : function(){
			var that = this;
			var clase = this._input.getMetadata().getName();
			var value, valueTag;
			
			// obtengo el valor del input (diferente forma de obtenerlo segun tipo input)
			switch(clase) {
				case "sap.m.Input" : 
					value = valueTag = this._input.getValue().trim();
					this._input.setValue("");
					break;
				case "sap.m.SearchField" : 
					value = this._input.data("key");
					valueTag = this._input.getValue();
					this._input.setValue("");
					break;	
				case "sap.m.DatePicker" :
					value = this._input.getValue(); 
					valueTag = formatter.dateToString(this._input.getDateValue(),"dd/MM/yyyy");
					this._input.setValue("");
					break;
				case "sap.m.ComboBox" :
					value = this._input.getSelectedItem().getKey();
					valueTag = this._input.getSelectedItem().getText(); 
					this._input.clearSelection();
					this._input.setValue("");
					break;
			}
			this._input.setEnabled(false);

			// creo el tag
			var object = this._objectCurrent;
			var tag = new sap.m.HBox({
				alignItems : sap.m.FlexAlignItems.Center,
				items : [
					 new sap.m.Text({ text : valueTag }).addStyleClass("sapUiTinyMargin"),
					 new Icon({
					 	src : "sap-icon://decline",
					 	size : "0.8em",
					 	press : function() {
					 		// elimino el tag
					 		tag.destroy();
					 		// borro el filtro real
					 		delete that._aFilters[object.field];
					 		// desbloqueo el campo en el combo
					 		object.enabled = true;
					 		that.mFilterModel.refresh(true);
					 		// si no quedan tags deshabilito el boton de busqueda
					 		if(sap.ui.getCore().byId("tagsContainer").getItems().length === 0) {
					 			sap.ui.getCore().byId("btnSearch").setEnabled(false);
					 		}
					 	}}).addStyleClass("sapUiTinyMargin")
				]
			});
			sap.ui.getCore().byId("tagsContainer").addItem(tag);
			
			// creo el filtro real para aplicar a la tabla
			this._aFilters[object.field] = new Filter(object.field, FilterOperator.EQ, value);
			// limpio el valor del combo
			sap.ui.getCore().byId("comboFilter").setSelectedKey("");
			// bloqueo el campo seleccionado en el combo
			object.enabled = false;
			this.mFilterModel.refresh(true);
			
			// deshabilito boton Add Filter y habilito el de busqueda
			sap.ui.getCore().byId("btnAddFilter").setEnabled(false);
			sap.ui.getCore().byId("btnSearch").setEnabled(true);
			// pongo el foco en el boton Search
			jQuery.sap.delayedCall(100, this, function() {
			    sap.ui.getCore().byId("btnSearch").focus();
			 });
		},
		// FunciÃ³n de selecciÃ³n de sugerencias
		onSelectData : function(oEvent,sField) {
			switch (sField) {
				case "Manager":
					this.onAdvSelectManager(oEvent);
					break;
				default:
			}
		},
		// FunciÃ³n de recuperaciÃ³n de sugerencias
		onSuggestData: function(oEvent,sField) {
			switch (sField) {
				case "Manager":
					this.onAdvSuggestManager(oEvent);
					break;
				default:
			}
		},
		// Evento que se ejecuta al modificar un autocomplete
		// Muestra una lista de opciones segun lo que se haya introducido
		onAdvSuggestManager: function(oEvent) {
			// Inicializamos los filtros
			var oFilters = [];
			var sValue =  oEvent.getSource().getValue();
			oFilters.push( new Filter("FreeText", FilterOperator.EQ, sValue) );
			// Llamamso a la funciÃ³n de suggest
			this.onSearchSuggest(oEvent,oFilters);
		},
		// Se selecciona uno de los Managers mostrados como sugerencia
		onAdvSelectManager : function(oEvent) {
			if(oEvent.getParameter("suggestionItem")){
				// guardamos en variable global el usuario seleccionado
				var object = oEvent.getParameter("suggestionItem").getBindingContext("UTILS").getObject();
				// Habilitamos el boton de busqueda
				this._byId("btnAddFilter").setEnabled(true);
				// se pone en el input solo el nombre
				this._input.setValue(object.Name);
				this._input.data("key",object.IdEmployee);
			}
		},

		/*** INI Busqueda avanzada de proyectos ***/
	
		// Evento que abre la busqueda avanzada
		onOpenAdvSearchProjects : function(oEvent) {
			var idElement = oEvent.getSource().data("ToElement");
			if(this.byId(idElement)) {
				this.cmbResultTo = this.byId(idElement);
			} else {
				this.cmbResultTo = sap.ui.getCore().byId(idElement);
			}
			// Abrimos el Dialog
			this._getDialogAdvSearchProjects().open();
		},
		
		// Recupera o crea el dialog de busqueda avanzada
		_getDialogAdvSearchProjects : function () {
			var oData = {
				"Conditions":[
					{
						"IdSelection" : "Project Code",
						"field" : "IdProject",
						"type" : "String",
						"enabled" : true
					},{
						"IdSelection" : "Project Name",
						"field" : "ProjectName",
						"type" : "String",
						"enabled" : true
					},{
						"IdSelection" : "Project Type",
						"field" : "ProjectType",
						"type" : "Combo",
						"service" : "PROJECTS1>/ZPS_H_PROJECT_TYPESet",
						"comboKey" : "{PROJECTS1>Prart}",
						"comboName" : "{PROJECTS1>Pratx}",
						"filter" : false,
						"enabled" : true
					},
					{
						"IdSelection" : "Business Unit",
						"field" : "BusinessUnit",
						"type" : "Combo",
						"service" : "OPPORTUNITY>/ZPS_H_BUSINESS_UNITSet",
						"comboKey" : "{OPPORTUNITY>BusinessUnit}",
						"comboName" : "{OPPORTUNITY>BusinessName}",
						"filter" : false,
						"enabled" : true
					},
					{
						"IdSelection" : "Office",
						"field" : "Office",
						"type" : "Combo",
						"service" : "OPPORTUNITY>/ZPS_H_OFFICESet",
						"comboKey" : "{OPPORTUNITY>Office}",
						"comboName" : "{OPPORTUNITY>OfficeName}",
						"filter" : false,
						"enabled" : true
					},
					{
						"IdSelection" : "Manager",
						"field" : "Manager",
						"type" : "Searchfield",
						"service" : "UTILS>/ZCA_F_MANAGERSet",
						"key" : "{UTILS>IdEmployee}",
						"Name" : "{UTILS>Name}",
						"enabled" : true
					},
					{
						"IdSelection" : "Project Country",
						"field" : "ProjectCountry",
						"type" : "Combo",
						"service" : "PROJECTS1>/ZPS_H_PROJECT_COUNTRYSet",
						"comboKey" : "{PROJECTS1>ProjectCountry}",
						"comboName" : "{PROJECTS1>Name}",
						"filter" : false,
						"enabled" : true
					}
				]
			};
			
			this.mFilterModel = new sap.ui.model.json.JSONModel(oData);
			this.getView().setModel(this.mFilterModel, "FilterModel");
			
			// Inicializamos los filtros
			this._aFilters = {};
			// CreaciÃ³n de filtros obligatorios
			this._aFilters.AppTyp = new Filter("AppTyp", FilterOperator.EQ, "TS");
				
			this._oDialogAdvSearchProjects = sap.ui.xmlfragment("Absentismos.view.fragments.AdvSearchProjects", this);
			this.getView().addDependent(this._oDialogAdvSearchProjects);
			
			return this._oDialogAdvSearchProjects;
		},
		
		// Evento que cierra la busqueda avanzada
		onCloseAdvSearchProjects : function() {
			// si estamos en el popover de un dia del calendario se quita la opcion 'modal' para que se pueda cerrar
			if(this._popoverDayCalendar && this._popoverDayCalendar.isOpen() && this.getOwnerComponent().getModel("device").getProperty("/isSurfaceDesktop")) {
				this._popoverDayCalendar.setModal(false);
			}
			this._oDialogAdvSearchProjects.close();
			this._oDialogAdvSearchProjects.destroy();
		},
		/*
		 * Ejecuta la busqueda avanzada.
		 */
		onAdvSearchProjects    : function() {
			var that = this;
			sap.ui.getCore().byId("vboxResults").setVisible(true);
			
			// AÃ±adir el Paginator en las tablas
			sap.ui.getCore().byId("hboxPag").destroyItems();
			sap.ui.getCore().byId("hboxPag").addItem(new Paginator({
				table : sap.ui.getCore().byId("ProjectsTable"),	
				model : that.getProjectsOdataModel(),	
				filter : that._aFilters,
				data : "/ZPS_F_SEARCHPROJECTSet",
				size : 5
			}));
		},
		
		/*** FIN Busqueda avanzada de proyectos***/
		
		/*** INI Eventos de SearchField ***/
		// Evento que se ejecuta al modificar un autocomplete
		// Muestra una lista de opciones segun lo que se haya introducido
		onSuggestProjects: function(oEvent) {
			// Inicializamos los filtros
			var oFilters = [];
			var sValue = oEvent.getSource().getValue();
			// CreaciÃ³n de filtros
			oFilters.push(new Filter("FreeText", sap.ui.model.FilterOperator.EQ, sValue));
			oFilters.push(new Filter("AppTyp", sap.ui.model.FilterOperator.EQ, "TS"));
			// Llamamso a la funciÃ³n de suggest
			this.onSearchSuggest(oEvent,oFilters);
		},
		// Se ejecuta al escribir en el SearchField.
		onSearchSuggest: function (oEvent,oFilters) {
			// recuperamos el valor del input
			var oSource  = oEvent.getSource();
			
			// Guardamos el origen en variable global para acceder a el tras seleccionar un valor.
			this.oSearchfieldElement = oSource;
			
			// Ponemos esta condicion solo en desktop, en el movil no se pone porque al hacer click se abre un dialog con el searchfield
			var condition = ( this.getDeviceModel().getProperty("/isNoPhone") ) ? ( oSource.getValue().length > 3 ) : true; 
			
			//Primero miramos que la longitud sea mayor que 2 caacteres antes de buscar
			if(condition) {
				// Recuperamos los items
				var oBinding = oSource.getBinding("suggestionItems");
				// Filtrtamos los items
				oBinding.filter(oFilters);
				
				// Ponemos indicador de cargando
				oSource.setBusy(true);
				
				// Esperamso a que se haya recibido los datos
			    oBinding.attachEventOnce("dataReceived", function() {
					// Eliminamos indicador de cargando
					oSource.setBusy(false);
					// Mostramos la sugerencia
					oSource.suggest();
				});
			}
		},
		
				onExportToPDF : function(oEvent) {
			this.getView().setBusy(true);
			// obtengo el objeto seleccionado
			var oData = oEvent.getSource().getBindingContext().getObject();
			var userWork = this.getModelGlobalVars().getProperty("/UserWork");
			var sApp = this.getModelGlobalVars().getProperty("/sApp");
			
			var params = "IdEmployee='" + userWork.IdEmployee + "',Period='" + oData.IdTimecard + "',Fortnight='',PdfExcel='X',IdApp='" + sApp + "'";
			//var params = "IdEmployee='" + userWork.IdEmployee + "',Period='" + oData.IdTimecard + "',Fortnight='',PdfExcel='X'";
			
			var that = this;
			this.getTimelaborOdataModel().read("/ZTS_F_PRINTREPORTSet(" + params + ")", {
				success: function (oResult) {
					Utils.downloadBase64(oResult.Document, "TL-" + userWork.IdEmployee + "-" + oData.IdTimecard, "pdf");
					that.getView().setBusy(false);
				},
				error: this._oDataError.bind(this)
			});	
		},
		onExportToExcel : function(oEvent) {
			this.getView().setBusy(true);
			
			// obtengo el objeto seleccionado
			var oObject = oEvent.getSource().getBindingContext().getObject();
			var userWork = this.getModelGlobalVars().getProperty("/UserWork");
			var sApp = this.getModelGlobalVars().getProperty("/sApp");
			
			// Generamos los filtros
			var aFilter = [
				new Filter("IdEmployee", FilterOperator.EQ, userWork.IdEmployee),
				new Filter("Period", FilterOperator.EQ, oObject.IdTimecard),
				new Filter("IdApp", FilterOperator.EQ, sApp)
			];
			var that = this;
			this.getTimelaborOdataModel().read("/ZTS_F_TIMESHEETDETAILSet", {
	   			filters : aFilter,
	   			success: function (oData) {
	    			that.generateExcel(oObject.IdTimecard,oData.results);
	   			},
				error: this._oDataError.bind(this)
			});
		},
		
		generateExcel : function(idTimecard,oData) {
			// Recupero los datos de usuario
			var userWork = this.getModelGlobalVars().getProperty("/UserWork");
			
			// pinto el titulo
			var excelCode ="<table {1}>";
			excelCode += "<tr/>";
			excelCode += "<tr><th/><th {2} colspan='9'>Employee Time Sheet Control Single</th></tr>";
			
			// pinto los label
			excelCode += "<tr><th/><th {3}>Employee Name:</th><td {4}>"+this._htmlDecode(userWork.NameComplete)+"</td></tr>";
			excelCode += "<tr><th/><th {3}>Personel Number:</th><td {4}>"+userWork.IdEmployee+"</td></tr>";
			excelCode += "<tr><th/><th {3}>Period:</th><td {4}>"+this._getPeriod(idTimecard)+"</td></tr>";
			excelCode += "<tr/><tr/>";
			
			// pinto la tabla con los gastos
			excelCode += "<tr>";
			excelCode += "<th/>";
			excelCode += "<th {5}>Date</th>";
			excelCode += "<th {5}>Employee Company Code</th>";
			excelCode += "<th {5}>Project Code</th>";
			excelCode += "<th {5}>Project Description</th>";
			excelCode += "<th {5}>Project Company Code</th>";
			excelCode += "<th {5}>Project Manager</th>";
			excelCode += "<th {5}>Number of Hours</th>";
			excelCode += "<th {5}>Type of Hours</th>";
			excelCode += "<th {5}>Status</th></tr>";
			
			for(var i = 0; i < oData.length; i++) {
				var line = oData[i];
				excelCode += "<tr>";
				excelCode += "<td/>";
				excelCode += "<td {6}>"+line.Date+"</td>";
				excelCode += "<td {6}>"+line.EmployeeCompanyCode+"</td>";
				excelCode += "<td {6}>"+line.ProjectCode+"</td>";
				excelCode += "<td {6}>"+line.ProjectDescription+"</td>";
				excelCode += "<td {6}>"+line.ProjectCompanyCode+"</td>";
				excelCode += "<td {6}>"+this._htmlDecode(line.ProjectManager)+"</td>";
				excelCode += "<td {6}>"+line.NumberHours+"</td>";
				excelCode += "<td {6}>"+line.TypeHours+"</td>";
				excelCode += "<td {6}>"+line.Status+"</td>";
				excelCode += "</tr>";
			}
			
			excelCode += "<tr/><tr/>";
			excelCode += "<tr><th/><th {3}>Report Execution Date:</th><td {4}>"+this.formatter.dateToString(new Date(),"dd/MM/yyyy")+"</td></tr>";
			
			// aÃ±ado los estilos a cada parte
			excelCode = excelCode.split("{1}").join("style='border-collapse: collapse;'");
			excelCode = excelCode.split("{2}").join("style='font-size: 20px;'");
			excelCode = excelCode.split("{3}").join("style='text-align: left;'");
			excelCode = excelCode.split("{4}").join("style='text-align: right;'");
			excelCode = excelCode.split("{5}").join("style='text-align: center; border: thin solid black; background-color: #8FD61C;'");
			excelCode = excelCode.split("{6}").join("style='text-align: center; border: thin solid black;'");
			
			// cierro la tabla
			excelCode += "</table>";
			
			// exporto a excel
			this._exportToExcel(excelCode, "TL-" + userWork.IdEmployee + "-" + idTimecard);
			
			this.getView().setBusy(false);
		},
		
		/**
		 * ById genÃ©rico que aplica primero el byId de controlador y despues el de core.
		 * Devuelve el componente con el id pasado como parametro.
		 */
		_byId : function(sName) {
			var cmp = this.byId(sName);
			if(!cmp) {
				cmp = sap.ui.getCore().byId(sName);
			}
			return cmp;
		},
		
		/*** FIN Eventos de SearchField ***/
		
		/**
		 * Convierte un objeto en un array de objetos. Mismo funcionalidad que Object.values() pero Ã©ste sÃ­ funciona en IE.
		 * @param data : objeto
		 */
		_objectValues : function(data) {
			var aData = [];
			for(var key in data) {
				aData.push(data[key]);
			}
			return aData;
		},
		
		/**
		 * Convierte un array de objetos en un mapa de objetos.
		 * @param aData : Array de objetos
		 * @param key : Nombre del campo que se convertirÃ¡ en el key del mapa
		 */
		_fromArrayToMap : function(aData, key) {
			var map = {};
			for(var i = 0; i < aData.length; i++) {
				var item = aData[i];
				map[item[key]] = item;
			}
			return map;
		},
		
		/**
		 * Indica si el navegador sobre el que esta corriendo la aplicaciÃ³n es Internet Explorer.
		 * @return version de IE, 0 si es otro navegador
		 */
		_isIE : function() {
		    var ua = navigator.userAgent;
		    if (ua.indexOf("Trident/7.0") > 0) {
		        return 11;
		    } else if (ua.indexOf("Trident/6.0") > 0) {
		        return 10;
		    } else if (ua.indexOf("Trident/5.0") > 0) {
		        return 9;
		    } else {
		        return 0;  // not IE9, 10 or 11
		    }
		},
		/**
		 * Realiza la conversiÃ³n y descarga de un documento pasado en string base64.
		 * @param byteArray :	Documento convertido a un array de bytes
		 * @param name :		Nombre del documento (sin extension)
		 * @param extension :	Extension del documento
		 */
		_downloadByteArray : function(byteArray, name, extension) {
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
		 * Convierte un string a un array de bytes.
		 */
		_stringToArrayBuffer : function(binaryString) {
		    var len = binaryString.length;
		    var bytes = new Uint8Array( len );
		    for (var i = 0; i < len; i++) {
		        bytes[i] = binaryString.charCodeAt(i);
		    }
		    return bytes.buffer;
		},
		/**
		 * FunciÃ³n genÃ©rica para exportar una tabla cualquiera a Excel.
		 * @param table : String con el Codigo html de la tabla
		 * @param name : Nombre de la hoja de excel
		 */
		_exportToExcel : function(table, name) {
			
			//var uri = 'data:application/vnd.ms-excel;base64,';
			var template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body><table>{table}</table></body></html>';
			//var base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))); };
			var format = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }); };
			
			var ctx = { 
				worksheet : name || "Worksheet", 
				table : table
			};
			//window.location.href = uri + base64(format(template, ctx));
			this._downloadByteArray(this._stringToArrayBuffer(format(template, ctx)), name, "xls");
		},
		// Modifica el IdTimecard para serr del formato "Mes(letra), AÃ±o"
		_getPeriod:function(sDate){
			var aMonths = this.getOwnerComponent().getModel("Maestros").getProperty("/Months"),
				month   = aMonths[parseInt(sDate.substring(4, 6),10)],
				year =sDate.substr(0,4),
				formattedDate = month + " " + year;
			return formattedDate;	
		},
		
		// FunciÃ³n que genera una cadena codificada para HTML
		_htmlDecode : function(txt) {
			var aParejas = this.getOwnerComponent().getModel("Maestros").getProperty("/charDecode");
			for (var i = 0; i < aParejas.length; i++) {
				txt = txt.replace(new RegExp(aParejas[i].char, "g"), aParejas[i].code);
			}
			return txt;
		},
		// FunciÃ³n para recargar las plantillas publicas
		_loadModelPublicTemplates: function() {
			var that = this;
			var oFilters = [];
			oFilters.push(new Filter("IdEmployee", FilterOperator.EQ, this.getModelGlobalVars().getProperty("/UserWork/IdEmployee")));
			oFilters.push(new Filter("IsPublicTemplate", FilterOperator.EQ, "X"));
			this.getProjectsOdataModel().read("/ZPS_F_ADMIN_PROJSet", {
				filters : oFilters,
				success: function (oData) {
					var oModel = new sap.ui.model.json.JSONModel(oData);
					that.getOwnerComponent().setModel(oModel,"PublicTemplates");
				},
				error:function(oError){
					that._oDataError(oError);
				}
			});
		},
		// FunciÃ³n para recargar las plantillas
		_loadModelTemplates: function() {
			var oFilters = [ new Filter("IdEmployee", FilterOperator.EQ, this.getModelGlobalVars().getProperty("/UserWork/IdEmployee"))];
			// Guardar las templates en un modelo
			var that = this;
			this.getTimelaborOdataModel().read("/ZTS_F_TEMPLATESSet", {
				filters : oFilters,
				success: function (oData) {
					var oModel = new sap.ui.model.json.JSONModel(oData);
					that.getOwnerComponent().setModel(oModel,"Templates");
				},
				error:that._oDataError.bind(that)
			});
		},
		_editItemsTable : function(oData,oContext) {
			
			var bTLOpen = oContext.getModelGlobalVars().getProperty("/TLOpen");
			var sPreviousMonth = oContext.formatter.dateToString(new Date(), "yyyyMM");
			var oPreviousMonth = oContext.formatter.stringToDate(sPreviousMonth, "yyyyMM");
			oPreviousMonth.setMonth(oPreviousMonth.getMonth() - 1);
			
			for (var i=0; i<oData.results.length; i++) {
				var oMonth = oContext.formatter.stringToDate(oData.results[i].IdTimecard, "yyyyMM");
				oData.results[i].Editable = (oMonth < oPreviousMonth || !bTLOpen ) ? "No" : "Yes";
			}
			
			return oData;
		},
		/***************************************/
		/** Funciones servicios oData         **/
		/***************************************/
		
		/** 
		 * FunciÃ³n genÃ©rica para capturar y mostrar los errores en las llamadas a oData.
		 * @params	oError: 	Objeto error que viene del servicio (obligatorio)
		 * @params	fFunction:	Funcion que se ejecutara tras cerrar el mensaje de error (opcional)
		 */
		_oDataError : function(oError, fFunction) {
			//var message, service, data;
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
			
			// quitamos el busy de espera
			if(typeof this.getView === "function") {
				this.getView().setBusy(false);
			}
			
			// Mostramos el mensaje de error por pantalla
			MessageBox.alert(message, {
				icon: MessageBox.Icon.ERROR,
				title: "Error",
				onClose: function() {
					// si existe se ejecuta la funcion pasada como parametro
					if(fFunction) { fFunction(); }
				}
			});
        }
	});
});