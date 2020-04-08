sap.ui.define([
	"TimeLabor/controller/BaseController", 
	"TimeLabor/control/Paginator",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, Paginator, MessageBox, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("TimeLabor.controller.AccessAuthorizations", {
				
		myAction: "TS",
		
		onInit:function(){
			
			// Asignación de elementos a variables globales.
			this._btnAddUser          = this.byId("btnAddUser");
			this._btnSearchUser       = this.byId("btnSearchUser");
			this._inpSearchUser       = this.byId("inpSearchUser");
			this._cntAddUsers         = this.byId("cntAddUsers");
			this._cntSearchingElement = this.byId("cntSearchingElement");
			this._cntResults          = this.byId("cntResults");
			this._dlgUserSubmitted    = this.byId("dlgUserSubmitted");
			this._titMessage          = this.byId("titMessage");
			this._icnDialogSubmit     = this.byId("icnDialogSubmit");
			this._tabDelegatedUsers   = this.byId("tabDelegatedUsers");
			this._tabResults          = this.byId("tabResults");
			this._hboxPag             = this.byId("PaginationUsers");
			this._idEntryDelegations  = this.byId("idEntryDelegations");
			
			// Asignación de modelos a variables globales.
			this.oDataModelTL         = this.getOwnerComponent().getModel("TIMELABOR");
			this.IdEmployee           = this.getModelGlobalVars().getProperty("/UserLogged/IdEmployee");
			this.Actions              = "TS";
			
			// this.initSidePanel();

			// Colocamos en el router las ejecuciones que deben realizarse al cambiar de vista
			sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(function(oEvent) {
	    		if (oEvent.getParameter("name") === "AccessAuthorizations") {
	    			
	    			// Volvemos a dejar la vista como al inicio.
	    			this._resetView();
	    			
	    			// Cargamos los filtros en la tabla de delegados (izquierda)
	    			var aFilter = [];
	    			aFilter.push(new Filter("IdEmployee", FilterOperator.EQ, this.IdEmployee));
	    			aFilter.push(new Filter("Actions", FilterOperator.EQ, this.Actions));
	    		   
	    			this._tabDelegatedUsers.getBinding("items").filter(aFilter);
	    			
	    			// Cargamos los filtros en la tabla de permisos (derecha). No es modificable
	    			var aFilter2 = [];
	    			aFilter2.push(new Filter("IdEmployee", FilterOperator.EQ, this.IdEmployee));
	    			aFilter2.push(new Filter("Actions", FilterOperator.EQ, this.Actions));
	    		    aFilter2.push(new Filter("MyDelegate", FilterOperator.EQ, 'X'));
	    			this.byId("tablePermissionsUsers").getBinding("items").filter(aFilter2);
	    			
	    			this.oDataModelTL.refresh(true);
	    			
	    		}
    		}, this);
		},
			
		/***************************************/
		/****    Gestion de Search Field    ****/
		/***************************************/
		
		// Oculta el boton Add User y muestra el SearchField y el boton Search
		showSearchInput:function(){
			this._cntAddUsers.setVisible(false);
			this._cntSearchingElement.setVisible(true);
		},
		
		// Se ejecuta al escribir en el SearchField. Habilita o deshabilita el boton Search
		onSearchLiveChange: function(oEvent) {
			this._btnSearchUser.setVisible(true);
			this._btnAddUser.setVisible(false);
			// Habilitamos el botón de buscar si hay entrada
			this._btnSearchUser.setEnabled(oEvent.getSource().getValue() ? true : false);
		},
		
		// Se ejecuta al escribir en el SearchField. Filtra los usuarios mostrados como sugerencia.
		onSearchSuggest: function (oEvent) {
			// recuperamos el valor del input
			var oSource  = oEvent.getSource();
			var sValue   = oSource.getValue();
			
			// formamos filtro si esta informado
			var filters = [];
			if (sValue) {
				filters.push(new Filter("FreeText", FilterOperator.EQ, sValue));
			}
			// Recuperamos los items
			var oBinding = oSource.getBinding("suggestionItems");
			// Filtrtamos los items
			oBinding.filter(filters);
			
			// Mostramos la sugerencia una vez se hayan recibido los datos.
		    oBinding.attachEventOnce("dataReceived", function() {
				oSource.suggest();
			});
		},
		
		// Se selecciona un usuario de los mostrados como sugerencia
		onSelectFilter : function(oEvent) {
			// guardamos en variable global el usuario seleccionado
			this._oUser = oEvent.getParameter("suggestionItem").getBindingContext("TIMELABOR").getObject();
			// mostramos el boton Add
			this._btnSearchUser.setVisible(false);
			this._btnAddUser.setVisible(true);

			// pongo el foco en el boton Add
			jQuery.sap.delayedCall(200, this, function() {
			    this._btnAddUser.focus();
			 });
		},
		
		// Se pulsa el boton Add
		onAddDelegated : function(){
			this._addDelegated(this._oUser);
		},
		
		// Función interna que persiste en el servicio el usuario seleccionado
		_addDelegated : function(oUser) {
			var that = this;
			// Creamos el json con el usuario
			var oData = {
				"Actions": this.Actions,
				"IdEmployeeDel": oUser.IdEmployee,
				"IdEmployee": this.IdEmployee,
			
			};
			
			// Ponemos mensaje de confirmación
		    MessageBox.confirm("Do you want to add the selected user?", {
			    title: "Add delegated user",
			    onClose: function(sResult) {
				    if (sResult === MessageBox.Action.OK) {
						// Invocamos la función de creación de usuaio
						that.oDataModelTL.create("/DelegatesSet", oData,
							{
								success : function() {
									// Volvemos a dejar la vista como al inicio.
							    	that._resetView();
									// Modificamos el texto del mensaje
									that._titMessage.setText("User succesfully added");
									that.oDataModelTL.refresh(true);
									// Mostramos mensaje
									that._dlgUserSubmitted.open();
								},
								error : that._oDataError
							}
						);
				    } // fin if
			    }
        	});
			
		},
		
		/**********************************************/
		/****    Gestion de la tabla de usuarios   ****/
		/**********************************************/
		
		//Evento del botón "Search"
		onFindUsers: function(){
			var that = this;
			// Cargamos los filtros en la tabla de usuarios
			var aFilter = [];
			aFilter.push(new Filter("FreeText", FilterOperator.EQ, this._inpSearchUser.getValue()));
			this._hboxPag.destroyItems();
			this._hboxPag.addItem(new Paginator({
				table : that._tabResults,	// obligatorio
				model : that.oDataModelTL,	// obligatorio
				filter : aFilter,	// opcional
				data : "/EmployeeSet",
				size : 5// obligatorio
			}));
			this._idEntryDelegations.removeStyleClass("minHeight9de10");
			// Mostramos la tabla de resultados
			this._cntResults.setVisible(true);
		},
		
		// Evento de click en la linea de la tabla "Results"
		onSelectUser: function(oEvent) {
			// Recuperamos el contexto de la linea seleccionada
			var context = oEvent.getParameter("listItem").getBindingContext("undefined"); 
			// Recuperamos la URL de la línea con las claves.
			var rowPath = context.getPath();
			// le pasamos al metodo de creacion de un delegado el objeto del usuario seleccionado
			this._addDelegated(context.getModel().getProperty(rowPath));
		},
		
		// Evento de click en el icono "Basura" d ela lista de usuarios delegados
		// @params		oEvent: Evento ejecutado
		onDeleteUser: function(oEvent) {
			var that = this;
			// Recuperamos la línea
			var oUser = oEvent.getSource().getBindingContext("TIMELABOR").getObject();
			
		    // Ponemos mensaje de confirmación
		    MessageBox.confirm("Do you want to delete the selected user?", {
			    title: "Delete delegated user",
			    onClose: function(sResult) {
				    if (sResult === MessageBox.Action.OK) {
				    	// Monto los parametros de borrado necesarios
				    	var sParams = "IdEmployee='" +that.IdEmployee  + "',Actions='TS',IdEmployeeDel='" + oUser.IdEmployee + "'";
				    	//console.log(sParams);
						// Llamamos a la función de borrado
						that.oDataModelTL.remove("/DelegatesSet(" + sParams + ")",
							{
								success : function() {
									// Volvemos a dejar la vista como al inicio.
							    	that._resetView();
									// Modificamos el texto del mensaje
									that._titMessage.setText("User succesfully deleted");
									that.oDataModelTL.refresh(true);
									// Mostramos mensaje
									that._dlgUserSubmitted.open();
								},
								error : that._oDataError
							}
						);
				    }
			    }
        	});
		},
		// Evento de click en el icono "X" del dialog de mensaje
		onCloseSubmitUser: function() {
			this._dlgUserSubmitted.close();
		},
		
		/*****************************************************************/
		/** Funciones internas                                          **/
		/*****************************************************************/	
		
		// Función privada para resetear la vista
		_resetView: function() {
			// Ocultamos el contenedor de búsqueda y mostramos el del boton de añadir usuario
			this._cntAddUsers.setVisible(true);
			this._cntSearchingElement.setVisible(false);
			this._idEntryDelegations.addStyleClass("minHeight9de10");
			this._cntResults.setVisible(false);
			// Deselecionanmos los elementos de la tabla
			this._tabResults.removeSelections(true);
			// Vaciamos el input de busqueda
			this._inpSearchUser.setValue("");
			this._btnSearchUser.setEnabled(false);
		}
		

	});

});