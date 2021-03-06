sap.ui.define([
	"com/everis/Absentismos/controller/BaseController",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"com/everis/Absentismos/control/Paginator",
	"sap/ui/model/Filter",
	"com/everis/Absentismos/model/formatter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/ValueState",
	"sap/ui/model/json/JSONModel",
	"sap/m/Button",
	"sap/m/Dialog",
	"sap/m/Label",
	"sap/m/Text",
	"sap/m/TextArea",
	"sap/ui/core/Fragment"
], function (BaseController, MessageToast, MessageBox, Paginator, Filter, formatter, FilterOperator, ValueState, JSONModel, Button,
	Dialog, Label, Text, TextArea, Fragment) {
	"use strict";

	return BaseController.extend("com.everis.Absentismos.controller.View1", {
		formatter: formatter,

		onInit: function () {
			// Register the view with the message manager
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);

			// componentes muy utilizados
			this._inpSearchProjects = this.byId("inpSearchProjects"); // MUY IMPORTANTE: Cambia su referencia en funcion de range selection o popover day
			this._cmbTypesHours = this.byId("cmbTypesHours");
			this._inpHours = this.byId("inpHours");
			this._btnSelectDays = this.byId("btnSelectDays");
			this._tableCalendar = this.byId("tableCalendar");

			this.getView().setBusyIndicatorDelay(0);
			this.byId("gridCalendarBlock").setBusyIndicatorDelay(0);

			// colocamos en el router las ejecuciones que deben realizarse al cambiar de vista
			sap.ui.core.UIComponent.getRouterFor(this).attachRouteMatched(function (oEvent) {
				if (oEvent.getParameter("name") === "TimeEntry") {
					// recojo el mes
					//this._sMonth = oEvent.getParameter("arguments").month;
					var jsonData = JSON.parse(localStorage.getItem("TL_Internos"));
					this._sMonth = jsonData.Month;

					// si no viene informado seteo el mes actual (caso Create Timecard)
					if (!this._sMonth) {
						this._sMonth = this.formatter.dateToString(new Date(), "yyyyMM");
					}
					// siempre que se entra aparecerÃ¡ el mes completo
					this._modeWeek = false;

					// Cambiamos el color del tile de usuario
					var sUserLogged = this.getModelGlobalVars().getProperty("/UserLogged/IdEmployee");
					var sUserWork = this.getModelGlobalVars().getProperty("/UserWork/IdEmployee");
					if (sUserLogged !== sUserWork) {
						this.byId("hboxUser").addStyleClass("tileUserColor");
					} else {
						this.byId("hboxUser").removeStyleClass("tileUserColor");
					}

					// Cargamos las plantillas publicas si no existieran
					this._loadModelPublicTemplates();

					// Cargamos las plantillas del usuario si no existieran
					this._loadModelTemplates();

					// ejecuto la funcion que carga los datos iniciales
					this._initOdataRequest1();

					// Se limpia la variable que establece la seleccion de fecha por rango:
					this._modeSelectRange = undefined;

					// Esperamos un poco para cargar los elementos que usan la funcion ZPS_F_SEARCHPROJECTS
					jQuery.sap.delayedCall(500, this, this._loadItemsSearchProjects);
				}
			}, this);

			this.byId("btnDeleteResumenSol").setVisible(false);
			var csr_ = this.byId("txtCategoria");
			csr_.setText("Sin Datos");
			var _reportPDF=this.byId("reportPDF");
			var _reportExcel=this.byId("reportExcel");
			_reportPDF.setVisible(false);
			_reportExcel.setVisible(false);
		},

		onListItemPress: function (oEvent) {
			var sToPageId = oEvent.getParameter("item").getBindingContext("menuOpciones").getObject().value;
			this.getSplitContObj().toDetail(this.createId(sToPageId));
		},

		getSplitContObj: function () {
			var result = this.byId("SplitContDemo");
			if (!result) {
				Log.error("SplitApp object can't be found");
			}
			return result;
		},

		handlePopoverPress1: function (oEvent) {
			var oButton = oEvent.getSource();

			// create popover
			if (!this._oPopover) {
				Fragment.load({
					name: "com.everis.Absentismos.view.fragments.PopoverDayCalendar",
					controller: this
				}).then(function (pPopover) {
					this._oPopover = pPopover;
					this.getView().addDependent(this._oPopover);
					//this._oPopover.bindElement("/ProductCollection/0");
					this._oPopover.openBy(oButton);
				}.bind(this));
			} else {
				this._oPopover.openBy(oButton);
			}
		},

		beforeCloseDayCalendar: function (oEvent) {
			if (this._oPopover) {
				this._oPopover.destroy;
			} else if (this._oPopover2) {
				this._oPopover2.destroy;
			}
		},

		handlePopoverPress2: function (oEvent) {
			var oButton = oEvent.getSource();

			// create popover
			if (!this._oPopover2) {
				Fragment.load({
					name: "com.everis.Absentismos.view.fragments.PopoverDayCalendar2",
					controller: this
				}).then(function (pPopover) {
					this._oPopover2 = pPopover;
					this.getView().addDependent(this._oPopover2);
					//this._oPopover.bindElement("/ProductCollection/0");
					this._oPopover2.openBy(oButton);
				}.bind(this));
			} else {
				this._oPopover2.openBy(oButton);
			}
		},

		onselectDay: function () {
			var cboClase = this.byId("cboClase").getSelectedKey();
			var lblResumenFecha = this.byId("lblResumenFecha");
			var txtResumenTipo = this.byId("txtResumenTipo");
			var txtResumenDias = this.byId("txtResumenDias");
			var btnDeleteResumenSol = this.byId("btnDeleteResumenSol");
			var msgInfo = this.byId("msgInfo");
			if (cboClase !== '') {
				if (cboClase === 'Vacaciones' || cboClase === 'Licencias' || cboClase === 'Descansos Médicos') {
					var btnDay = this.byId("btnDay30");
					if (btnDay.getText() === "-" || btnDay.getText() === "4") {
						btnDay.setText("9");
						lblResumenFecha.setText("Fecha: 30/09/19");
						txtResumenTipo.setText("Tipo: " + cboClase);
						txtResumenDias.setText("Total días: 1");
						btnDeleteResumenSol.setVisible(true);
						msgInfo.setVisible(false);
					} else {
						btnDay.setText("-");
						lblResumenFecha.setText("");
						txtResumenTipo.setText("");
						txtResumenDias.setText("");
						btnDeleteResumenSol.setVisible(false);
						msgInfo.setVisible(true);
					}
				} else if (cboClase === 'Cupones: Tarde' || cboClase === 'Cupones: Mañana') {
					var btnDay = this.byId("btnDay30");
					if (btnDay.getText() === "-" || btnDay.getText() === "9") {
						btnDay.setText("4");
						lblResumenFecha.setText("Fecha: 30/09/19")
						txtResumenTipo.setText("Tipo: " + cboClase);
						txtResumenDias.setText("Total horas: 4");
						btnDeleteResumenSol.setVisible(true);
						msgInfo.setVisible(false);
					} else {
						btnDay.setText("-");
						lblResumenFecha.setText("");
						txtResumenTipo.setText("");
						txtResumenDias.setText("");
						btnDeleteResumenSol.setVisible(false);
						msgInfo.setVisible(true);
					}
				}
			} else {
				MessageToast.show("Seleccione un tipo de Absentismo");
			}
		},

		/****************************************************/
		/*****    FUNCIONES TRATAMIENTO TIPO DE HORAS   *****/
		/****************************************************/

		/**
		 * Devuelve un listado con todos los tipos de hora sin repetidos.
		 */
		_getHoursType: function () {
			var aHourTypes = [];
			for (var key in this._mapHoursType) {
				if (key === "AllHourTypes") {
					continue;
				} // el tipo genÃ©rico 'AllHourTypes' lo descarto
				aHourTypes.push(this._mapHoursType[key]);
			}
			return aHourTypes;
		},

		/**
		 * Devuelve un array con los tipos de horas que se pueden mostrar para un dia determinado.
		 * Se utiliza para rellenar el combo de horas del Popover day.
		 */
		_getHoursTypeByDay: function (iDay) {
			var aHourTypes = [];
			var weekday = this._oCalendar[iDay].weekday;
			var isFestivo = this._oCalendar[iDay].festive;

			for (var key in this._mapHoursType) {
				if (key === "AllHourTypes") {
					continue;
				}

				var oHoursType = this._mapHoursType[key];
				// se aÃ±ade si es festivo y el tipo de hora incluye festivos o si no es festivo pero incluye horas para el dia de la semana
				if ((isFestivo && oHoursType.Festive.MaxHours > 0) || (!isFestivo && oHoursType[weekday].MaxHours > 0)) {
					aHourTypes.push(oHoursType);
				}
			}
			return aHourTypes;
		},

		// Carga el mapa de tipos de hora junto con el maximo de horas por dia y los dias de la semana a los que se le aplica
		_createMapHoursType: function (aData) {
			var map = {};
			var item, key, maxHoursDay, minHoursDay;
			for (var i = 0; i < aData.length; i++) {
				item = aData[i];
				key = item.Taskcomponent; // Type Hour (NOH, EHH, etc)

				// si no existe creo el tipo de hora y le aÃ±ado el texto
				if (!map[key]) {
					map[key] = {
						Taskcomponent: item.Taskcomponent,
						Text: item.Text,
						Total: 0
					};
				}

				// se crea variable con horas limite por dia
				maxHoursDay = parseInt(item.HoursLimit, 10);
				minHoursDay = (!item.MinHours) ? 0 : parseInt(item.MinHours, 10);

				// si es por mes (M) hay que aÃ±adir campo Total y setear el maximo de horas por dia a 24h
				if (item.Dailymonthly === "M") {
					map[key].Total = parseInt(item.HoursLimit, 10);
					maxHoursDay = 24;
				}
				// Seteamos las horas por dias segun los dias que me vengan marcados (una 'X')
				// Condicion 1: Monday = "X" --> MaxHours L,M,X,J,V
				// SubCondicion 1: Saturday ="" --> 0 S,D
				// Condicion 2: Saturday = "X" --> MaxHours S,D
				// SubCondicion 2: Monday ="" --> 0 L,M,X,J,V
				// Condicion 4: Festive = "X" --> MaxHours F
				if (item.Monday) {
					map[key].Monday = {
						"MaxHours": maxHoursDay,
						"MinHours": minHoursDay
					};
					map[key].Tuesday = {
						"MaxHours": maxHoursDay,
						"MinHours": minHoursDay
					};
					map[key].Wednesday = {
						"MaxHours": maxHoursDay,
						"MinHours": minHoursDay
					};
					map[key].Thursday = {
						"MaxHours": maxHoursDay,
						"MinHours": minHoursDay
					};
					map[key].Friday = {
						"MaxHours": maxHoursDay,
						"MinHours": minHoursDay
					};
					if (!item.Saturday) {
						map[key].Saturday = {
							"MaxHours": 0,
							"MinHours": 0
						};
						map[key].Sunday = {
							"MaxHours": 0,
							"MinHours": 0
						};
					}
				}
				if (item.Saturday) {
					map[key].Saturday = {
						"MaxHours": maxHoursDay,
						"MinHours": minHoursDay
					};
					map[key].Sunday = {
						"MaxHours": maxHoursDay,
						"MinHours": minHoursDay
					};
					if (!item.Monday) {
						map[key].Monday = {
							"MaxHours": 0,
							"MinHours": 0
						};
						map[key].Tuesday = {
							"MaxHours": 0,
							"MinHours": 0
						};
						map[key].Wednesday = {
							"MaxHours": 0,
							"MinHours": 0
						};
						map[key].Thursday = {
							"MaxHours": 0,
							"MinHours": 0
						};
						map[key].Friday = {
							"MaxHours": 0,
							"MinHours": 0
						};
					}
				}
				if (item.Festive) {
					map[key].Festive = {
						"MaxHours": maxHoursDay,
						"MinHours": minHoursDay
					};
				}
			}

			/* Creo un tipo de hora genÃ©rico llamado 'AllHourTypes' que no aparecera en los combos Hours Type y que se utiliza para
			 * pintar el calendario cuando NO hay un tipo de hora seleccionado en el rango. Es decir, en este caso deben estar
			 * habilitados todos los dias que puedan incurrirse en alguno de los tipos de horas recibidas.
			 */
			var oAllHourTypes = {
				Total: 0
			};
			var noKeys = ["Taskcomponent", "Text", "Total"]; // keys que descarto ya que no van al tipo de hora generico
			for (var typeHour in map) {
				oAllHourTypes.Total += map[typeHour].Total ? map[typeHour].Total : 0;
				for (key in map[typeHour]) {
					if (noKeys.indexOf(key) === -1 && !oAllHourTypes[key]) {
						oAllHourTypes[key] = map[typeHour][key];
					}
				}
			}
			map.AllHourTypes = oAllHourTypes;
			return map;
		},

		/**
		 * Hace los cambios necesarios para tratar la imputacion decimal (como se puede ver es chorraco de cÃ³digo XD).
		 */
		_adaptViewToDecimalImputation: function () {
			this._modeDecimal = true;
			this._inpHours.setMaxLength(5); // ejemplo numero maximo: 23.99
		},

		/*******************************************/
		/*****    FUNCIONES DE CARGA INICIAL   *****/
		/*******************************************/

		/**
		 * Carga todos los datos de la vista.
		 * Esta funciÃ³n solo se ejecuta cuando el usuario navega hacia esta vista mediante el Routing.
		 * Nunca se utiliza como funciÃ³n de recarga (para eso se utiliza #_initOdataRequest2).
		 */
		_initOdataRequest1: function () {
			this.getView().setBusy(true);

			// para usuarios de EEUU (Region = 10) debemos habilitar la imputacion de horas con decimales
			var userWork = this.getModelGlobalVars().getProperty("/UserWork");
			if (userWork.Region === "10") {
				this._adaptViewToDecimalImputation();
			}

			// creo el mapa vacio de nombres de proyectos
			this._projectNameMap = {};

			// limpio la seleccion por rango (por si tenia datos)
			this._cleanRangeSelection();

			// Cargamos los tipos de hora
			this._getTaskcompData();
		},

		/**
		 * Carga los datos del calendario y se establece el modo de visualizacion (edicion o detalle).
		 * Es la segunda ejecuciÃ³n porque necesito haber establecido con anterioridad el mapa con los tipos de hora (_mapHoursType).
		 */
		_initOdataRequest2: function () {
			var that = this;

			// variable global que indica si el usuario ha introducido algun cambio en el calendario
			this._bChanges = false;

			// si el mes consultado es 2 meses anterior al actual se deshabilita toda la funcionalidad (modo solo lectura/detalle)
			var sPreviousMonth = this.formatter.dateToString(new Date(), "yyyyMM");
			var oPreviousMonth = this.formatter.stringToDate(sPreviousMonth, "yyyyMM");
			oPreviousMonth.setMonth(oPreviousMonth.getMonth() - 1);

			var oMonth = this.formatter.stringToDate(this._sMonth, "yyyyMM");
			this._modeDetail = (oMonth < oPreviousMonth) ? true : false;

			// llamo a la funcion que te trae los datos para pintar el calendario (dias editables, festivos,... y tmb las horas)
			this.getUtilsOdataModel().read("/ZCA_F_CALENDARDetailsSet", {
				filters: [
					new Filter("IdEmployee", FilterOperator.EQ, this.getModelGlobalVars().getProperty("/UserWork/IdEmployee")),
					new Filter("Date", FilterOperator.EQ, this._sMonth + "01"),
					new Filter("Fortnight", FilterOperator.EQ, "0")
				],
				success: function (oData) {
					// ComprobaciÃ³n de que hay datos para los meses anterior y siguiente
					that._checkPrevNextMonths(true, true);

					if (oData.results.length !== 0) {
						// realiza el pintado inicial del calendario
						that._paintCalendarInit(oData.results);
						// carga la tercera carga
						that._initOdataRequest3();
					} else {
						that.getView().setBusy(false);
					}
				},
				error: this._oDataError.bind(this)
			});
		},

		/**
		 * Carga los datos del panel de Summary.
		 * Es la tercera ejecuciÃ³n porque necesito haber establecido con anterioridad el modo de visualizacion (_modeDetail)
		 */
		_initOdataRequest3: function () {
			var that = this;

			// deshabilito la posibilidad de seleccionar por rango si esta en modo detalle
			this._enabledRangeSelection(!this._modeDetail);

			// deshabilitamos el boton Approve y Reset
			this.byId("btnApprove").setEnabled(false);
			this.byId("btnReset").setEnabled(false);

			// esta funcion te trae los datos para pintar el panel de Summary
			this.getTimelaborOdataModel().read("/ZTS_F_SUMMARYSet", {
				filters: [
					new Filter("IdEmployee", FilterOperator.EQ, this.getModelGlobalVars().getProperty("/UserWork/IdEmployee")),
					new Filter("Month", FilterOperator.EQ, this._sMonth),
					new Filter("Fortnight", FilterOperator.EQ, "0")
				],
				success: function (oData) {
					// meto en la raiz de los datos las horas pendientes y totales
					oData.pendingHours = (oData.results.length > 0) ? oData.results[0].PendingHours : 0;
					oData.totalHours = (oData.results.length > 0) ? oData.results[0].TotalHours : 0;
					oData.isRemovable = that._modeDetail ? false : true;

					// si solo viene un elemento y no tiene IdProject significa que no hay nada incurrido este mes
					if (oData.results.length === 1 && !oData.results[0].IdProject) {
						oData.results = [];
					}

					// creo el model y lo paso a la vista
					that._mSummary = new sap.ui.model.json.JSONModel(oData);
					that.getView().setModel(that._mSummary, "Summary");

					//console.log("Datos Summary:");
					//console.log(that._mSummary.getData());

					// meto los proyectos en el mapa de nombres de proyectos (para poder actualizar de forma dinÃ¡mica el panel de Summary)
					that._setProjectNameMap(oData.results);

					// carga los datos proyecto/horas del calendario (se tiene que hacer aqui porque debe estar creado el '_projectNameMap')
					that._loadDataCalendar();

					// habilito la vista
					that.getView().setBusy(false);
					that.byId("gridCalendarBlock").setBusy(false);
				},
				error: this._oDataError.bind(this)
			});
		},
		/**
		 * ComprobaciÃ³n de los datos para los meses anterior y siguiente al que esta pintado en el calendario 
		 * ( para deshabilitar los "<" ">")
		 * @param bPrev : Checkea si hay que mirar el mes anterior
		 * @param bNext : Checkea si hay que mirar el mes siguiente
		 */
		_checkPrevNextMonths: function (bPrev, bNext) {
			var that = this;
			if (bPrev) {
				// Comprobamos que para el mes anterior haya datos
				var oPreviousMonth = this.formatter.stringToDate(this._sMonth, "yyyyMM");
				oPreviousMonth.setMonth(oPreviousMonth.getMonth() - 1);
				var sPreviousMonth = this.formatter.dateToString(oPreviousMonth, "yyyyMM");

				// llamo a la funcion que te trae los datos para pintar el calendario
				this.getUtilsOdataModel().read("/ZCA_F_CALENDARDetailsSet", {
					filters: [
						new Filter("IdEmployee", FilterOperator.EQ, this.getModelGlobalVars().getProperty("/UserWork/IdEmployee")),
						new Filter("Date", FilterOperator.EQ, sPreviousMonth + "01"),
						new Filter("Fortnight", FilterOperator.EQ, "0")
					],
					success: function (oData) {
						that._bDataOnPrevMonth = (oData.results.length !== 0) ? true : false;
						// Si no estamos en modo semana o estamos en la primera semana del mes, entra
						if (!that._modeWeek || (that.modeWeek && that._weekCurrent === 0)) {
							that.byId("btnPrevious").setEnabled(that._bDataOnPrevMonth);
						}
					},
					error: this._oDataError.bind(this)
				});
			}

			if (bNext) {
				// Comprobamos que para el mes siguiente haya datos
				var oNextMonth = this.formatter.stringToDate(this._sMonth, "yyyyMM");
				oNextMonth.setMonth(oNextMonth.getMonth() + 1);
				var sNextMonth = this.formatter.dateToString(oNextMonth, "yyyyMM");

				// llamo a la funcion que te trae los datos para pintar el calendario
				this.getUtilsOdataModel().read("/ZCA_F_CALENDARDetailsSet", {
					filters: [
						new Filter("IdEmployee", FilterOperator.EQ, this.getModelGlobalVars().getProperty("/UserWork/IdEmployee")),
						new Filter("Date", FilterOperator.EQ, sNextMonth + "01"),
						new Filter("Fortnight", FilterOperator.EQ, "0")
					],
					success: function (oData) {
						that._bDataOnNextMonth = (oData.results.length !== 0) ? true : false;
						var numWeeks = that._tableCalendar.getItems().length - 1;

						var bFecCondition = (new Date() >= that.formatter.stringToDate(that._sMonth, "yyyyMM"));

						/// Condicion de fecha actual menor que la fecha del mes escogido, ademas de si hay datos en el mes siguiente
						var bCondition = that._bDataOnNextMonth && bFecCondition;

						// Si no estamos en modo semana o estamos en la ultima semana del mes, entra
						if (!that._modeWeek || (that.modeWeek && that._weekCurrent === numWeeks)) {
							that.byId("btnNext").setEnabled(bCondition);
						}
					},
					error: this._oDataError.bind(this)
				});
			}
		},

		/**
		 * Realiza el pintado inicial del calendario.
		 * @param aData : Datos del servicio
		 */
		_paintCalendarInit: function (aData) {

			// se pone el calendario en Mes de forma inicial
			this.byId("lnkMonthly").setEnabled(false);

			var aBoxDays = []; // array que tendrÃ¡ los box de cada dia
			this._cmpCalendar = {}; // objeto que contentra las referencias al componente VBox de cada dia editable del calendario
			this._oCalendar = {}; // objeto con los datos para guardar en el servicio (proyecto/horas)
			var bEditableDays = false; // comprueba que exista al menos un dia del calendario que sea editable (si no es asi se pasa a modo detalle)

			// obtengo el tipo de hora 'global' creado a partir de todos los tipos de hora
			var oAllHourTypes = this._mapHoursType.AllHourTypes;

			// meto los dias vacios de la semana inicial (los del mes anterior)
			var pos = this.formatter.stringToDate(aData[0].Date).getDay(); // 0: Sunday, 1: Monday, 2: Tuesday, ..., 6: Saturday
			if (pos === 0) {
				pos = 7;
			}

			for (var i = 1; i < pos; i++) {
				aBoxDays.push(new sap.m.VBox());
			}
			// meto todos los dias del mes
			for (i = 0; i < aData.length; i++) {
				var vBox = new sap.m.VBox();
				var txt = new sap.m.Text();
				var btn = new sap.m.Button();

				var date = this.formatter.stringToDate(aData[i].Date);
				var iDay = date.getDate();
				var strDay = ("0" + iDay).slice(-2); // se pasa a formato de dos cifras ("05", "12", etc)

				// pongo el dia y aplico el estilo para el numero del dia
				txt.setText(strDay);
				txt.addStyleClass("cssTxtDayCalendar");

				// pongo las horas incurridas, meto el 'data' para tener el numero del dia en el boton y aÃ±ado el evento
				btn.setText((aData[i].Hours && parseFloat(aData[i].Hours) > 0) ? aData[i].Hours : "0");
				btn.data("day", iDay);
				btn.attachPress(this.onPressDay.bind(this));

				this._oCalendar[iDay] = {
					festive: (aData[i].Holiday === "X") ? true : false, // indica si el dia es festivo
					weekday: aData[i].Weekday, // contiene el nombre del dia de la semana
					editable: (aData[i].Edit === "1") ? true : false, // indica si el dia es editable
					edit: (aData[i].Edit === "1") ? true : false, // indica si el dia se muestra en modo edicion o en modo detalle
					freeday: (aData[i].Freeday === "X") ? true : false, // indica si  se debe contar el dia en el sumatorio
					items: [] // creo un array vacio para cada dia (se rellenan con el servicio ZTS_F_EMPLOYEECURRENLYDETAILSSet)
				};
				// guardo en memoria una referencia al box y al boton
				this._cmpCalendar[iDay] = {
					box: vBox,
					btn: btn
				};

				// si esta en modo detalle o si el dia no es editable entra por aqui
				if (this._modeDetail || !this._oCalendar[iDay].editable) {
					vBox.addStyleClass("cssBoxDayNoEdit");
					btn.setEnabled(false);
					this._oCalendar[iDay].editable = false;
					this._oCalendar[iDay].edit = false;

				} else {
					// si entra por este 'else' es que el dia es editable
					if (aData[i].Holiday === "X") {
						if (oAllHourTypes.Festive.MaxHours > 0) {
							vBox.addStyleClass("cssBoxDay cssBoxDayFestive");
							bEditableDays = true;

						} else {
							vBox.addStyleClass("cssBoxDayNoEdit");
							btn.setEnabled(false);
							this._oCalendar[iDay].edit = false; // aunque el dia sea editable se pone en modo detalle por el tipo de hora
						}
					} else {
						if (oAllHourTypes[aData[i].Weekday].MaxHours > 0) {
							vBox.addStyleClass("cssBoxDay");
							bEditableDays = true;
							// si es fin de semana se le pone el estilo de dias festivos
							if (aData[i].Weekday === "Saturday" || aData[i].Weekday === "Sunday") {
								vBox.addStyleClass("cssBoxWeekend");
							}

						} else {
							vBox.addStyleClass("cssBoxDayNoEdit");
							btn.setEnabled(false);
							this._oCalendar[iDay].edit = false; // aunque el dia sea editable se pone en modo detalle por el tipo de hora
						}
					}
				}

				vBox.addItem(txt);
				vBox.addItem(btn);
				aBoxDays.push(vBox);
			}
			// meto los dias vacios en el fin de la ultima semana (los del mes siguiente)
			for (i = aBoxDays.length;
				(i % 7) !== 0; i++) {
				aBoxDays.push(new sap.m.VBox());
			}

			// si ningun dia se puede editar por las circunstancias que sean se establece el modo detalle
			if (!bEditableDays) {
				this._modeDetail = true;
			}

			// una vez tengo todos los box en un array los coloco en la tabla
			var tableCalendar = this.byId("tableCalendar");
			tableCalendar.removeAllItems();

			var row;
			for (i = 0; i < aBoxDays.length; i++) {
				if (i % 7 === 0) {
					// si el modulo es 0 significa que es una nueva semana y creo la fila
					row = new sap.m.ColumnListItem();
					tableCalendar.addItem(row);
				}
				row.addCell(aBoxDays[i]);
			}

			// si esta activo el modo semana se muestra de inicio asi (esto se utiliza al recargar un mes nuevo en modo semana)
			if (this._modeWeek) {
				this._weekly();
			} else {
				this.onMonthly();
			}
		},

		/**
		 * Carga los datos de horas y proyectos incurridos.
		 */
		_loadDataCalendar: function () {
			var that = this;

			// llamo a la funcion que te trae los datos de horas y proyectos incurridos (las TLs en sÃ­)
			this.getTimelaborOdataModel().read("/ZTS_F_EMPLOYEECURRENLYDETAILSSet", {
				filters: [
					new Filter("IdEmployee", FilterOperator.EQ, this.getModelGlobalVars().getProperty("/UserWork/IdEmployee")),
					new Filter("Date", FilterOperator.EQ, this._sMonth),
					new Filter("IdApp", FilterOperator.EQ, this.getModelGlobalVars().getProperty("/sApp"))
				],
				success: function (oData) {
					var aData = oData.results;

					// adapta los datos al formato que vamos a manejar en la aplicacion (luego al guardar se volvera al formato original)
					for (var i = 0; i < aData.length; i++) {
						var day = parseInt(aData[i].Day, 10);
						that._oCalendar[day].items.push({
							IdProject: aData[i].IdProject,
							ProjectName: that._projectNameMap[aData[i].IdProject],
							RecordedHours: that._modeDecimal ? aData[i].RecordedHours : parseInt(aData[i].RecordedHours).toString(),
							TypeHour: aData[i].TypeHour,
							Status: aData[i].Status
						});
					}
					// duplico el objeto para tener guardados los datos originales del servicio
					that._oCalendarOriginal = jQuery.extend(true, {}, that._oCalendar);
				},
				error: this._oDataError.bind(this)
			});
		},

		_setProjectNameMap: function (results) {
			for (var i = 0; i < results.length; i++) {
				this._projectNameMap[results[i].IdProject] = results[i].ProjectDescription;
			}
		},

		/**
		 * Actualiza el panel de Summary con los nuevos datos introducidos por el usuario.
		 * Se ejecuta cada vez que el usuario realiza un cambio en el calendario.
		 */
		_reloadModelSummary: function () {
			var oSummary = {},
				totalHours = 0,
				festiveHours = 0,
				pendingHours = 0;
			this._bChanges = true;

			// recorre los arrays de cada dia del calendario
			for (var sDay in this._oCalendar) {
				var itemsDay = this._oCalendar[sDay].items;
				if (this._oCalendar[sDay].editable) {
					for (var i = 0; i < itemsDay.length; i++) {
						var idProject = itemsDay[i].IdProject;
						var typeHour = itemsDay[i].TypeHour;
						var key = idProject + ";" + typeHour;
						if (!oSummary[key]) {
							oSummary[key] = {
								IdProject: idProject,
								ProjectDescription: this._projectNameMap[idProject],
								ProjHours: 0,
								TypeHour: typeHour,
								HourText: this._mapHoursType[typeHour].Text,
								Edit: "X"
							};
						}
						var hours = parseFloat(itemsDay[i].RecordedHours);
						oSummary[key].ProjHours += hours;

						// Sumamos todas las horas menos las extra
						var aTypeHoursNoSum = ["NIH", "EHH", "ENH"];
						if (aTypeHoursNoSum.indexOf(typeHour) === -1) {
							totalHours += hours;
						}
						if (this._oCalendar[sDay].freeday) {
							festiveHours += hours;
						}
					}
					if (!this._oCalendar[sDay].freeday) {
						// Por cada dia editable se aÃ±aden 8 o 7 horas segun parametrizaciÃ³n
						pendingHours += parseFloat(parseFloat(this.getModelGlobalVars().getProperty("/UserWork/WorkHours")).toFixed(2));
					}
				}
			}

			// si estamos en formato decimal hay que convertir todas las horas a Float con 2 decimales
			if (this._modeDecimal) {
				for (key in oSummary) {
					oSummary[key].ProjHours = parseFloat(parseFloat(oSummary[key].ProjHours).toFixed(2));
				}
			}

			// las horas pendientes son las totales editables menos las totales incurridas
			// Si las horas totales se han pasado de las horas pendientes no restamos, para que las pending hours sean 0
			pendingHours = (totalHours > pendingHours) ? 0 : pendingHours - totalHours + festiveHours;

			// meto en el modelo de Summary los valores actualizados
			this._mSummary.setData({
				totalHours: this._modeDecimal ? parseFloat(totalHours.toFixed(2)) : totalHours, // se hace el parseFloat para quitar ceros sobrantes
				pendingHours: this._modeDecimal ? parseFloat(pendingHours.toFixed(2)) : pendingHours,
				isRemovable: true,
				results: this._objectValues(oSummary)
			});
			this._mSummary.refresh(true);
			this.byId("btnReset").setEnabled(true); // aprovechamos esta funcion para habilitar el boton reset

		},

		/**
		 * Valida si es posible realizar el Approve. Se ejecuta tras cada modificaciÃ³n del calendario.
		 * Comprueba que los dias del calendario no contengan errores (que hayan pasado validacion de 
		 * horas maximas por tipo y totales).
		 */
		_checkPosibleApprove: function () {
			for (var key in this._oCalendar) {
				if (this._oCalendar[key].error) {
					return false;
				}
			}
			return true;
		},

		/**
		 * Ejecuta la funcion que sale de la aplicacion y va a la Home de Fiori (solo funciona en Fiori).
		 */
		goToFioriAux: function () {
			this._questionDiscardChanges(this.goToFiori.bind(this));
		},

		/**
		 * Vuelve a la vista de Home.
		 */
		goToHomeAux: function () {
			this._questionDiscardChanges(this.goToHome.bind(this));
		},

		/**
		 * Esta funcion se encarga de comprobar si existen cambios en Time Entry antes de realizar una accion.
		 * @param fFunction : Funcion a ejecutar
		 */
		_questionDiscardChanges: function (fFunction) {
			if (this._bChanges) {
				// si hay cambios preguntamos si esta seguro de salir
				MessageBox.confirm("Not submitted hours will not be recorded", {
					title: "Are you sure you want to go back?",
					onClose: function (sResult) {
						if (sResult === MessageBox.Action.OK) {
							fFunction();
						}
					}
				});
			} else {
				fFunction();
			}
		},

		/*******************************************************/
		/*****    1. FUNCIONES PARA SELECCION POR RANGO    *****/
		/*******************************************************/

		/**
		 * Limpia los componentes de la seleccion por rango.
		 */
		_cleanRangeSelection: function () {
			// vacio los campos de la seleccion por rango
			this.byId("inpSearchProjects").setValue(null);
			this._projectSelected = undefined;
			this._inpHours.setValue(null);
			this._btnSelectDays.setEnabled(false);

			// deshabilitamos el boton de Approve
			this.byId("btnApprove").setEnabled(false);
		},

		/**
		 * Habilita/deshabilita todos los componentes de la selecciÃ³n por rango.
		 */
		_enabledRangeSelection: function (b) {
			this._inpSearchProjects.setEnabled(b);
			this.byId("btnShowPopoverTemplates").setEnabled(b);
			this._cmbTypesHours.setEnabled(b);
			this._inpHours.setEnabled(b);
			if (b) {
				this.onValidateRangeSelection(); // solo habilito el 'btnSelectDays' si cumple validaciones
			} else {
				this._btnSelectDays.setEnabled(false);
			}

			var hasProject = (this.byId("inpSearchProjects").getValue()) ? true : false;
			this.byId("lnkInfoProject").setEnabled(b && hasProject);
			this.byId("lnkSaveTemplate").setEnabled(b && hasProject);
		},

		/********************************************************/
		/*****    1.1 FUNCIONES PARA EL INPUT DE PROJECTS   *****/
		/********************************************************/

		/*
		 * Filtra las sugerencias del input de proyectos.
		 * Se ejecuta cada vez que se introduce un valor en el input search field.
		 * NOTA: Se utiliza para el input de la selecciÃ³n por rango y el del popover del dia.
		 */
		onSuggestProjects: function (oEvent) {
			var input = oEvent.getSource();

			// aqui se establece el input search field
			this._inpSearchProjects = input;
			var sValue = input.getValue().trim();

			// Ponemos esta condicion solo en desktop, en el movil no se pone porque al hacer click se abre un dialog con el searchfield
			//var condition = ( this.getDeviceModel().getProperty("/isSurfaceDesktop") ) ? ( sValue.length > 8 ) : true; 
			var condition = sValue.length > 8;

			//Primero miramos que la longitud sea mayor que 2 caacteres antes de buscar
			if (condition) {
				input.setBusy(true);

				// por si el usuario ha pegado codigo + nombre del proyecto se recorta hasta el codigo
				if (sValue.length >= 16 && (new RegExp("([A-Z]){3}\-([0-9]{6})\-([0-9]{5})")).test(sValue.substr(0, 16))) {
					sValue = sValue.substr(0, 16);
				}

				// creo los filtros
				var oFilters = [
					new Filter("AppTyp", FilterOperator.EQ, "TS"),
					new Filter("FreeText", FilterOperator.EQ, sValue)
				];
				// recuperamos los items y los filtramos
				var oBinding = input.getBinding("suggestionItems");
				oBinding.filter(oFilters);

				// esperamos a que se haya recibido los datos para cargar el resultado
				var that = this;
				oBinding.attachEventOnce("dataReceived", function () {
					if (that._popoverTemplates) {
						that._popoverTemplates.close(); // si el popover estuviera abierto lo cierro
					}
					// eliminamos indicador de cargando y mostramos las sugerencias
					input.setBusy(false);
					input.suggest();
				});
			}
		},

		/*
		 * Se ejecuta al seleccionar un proyecto de los mostrados como sugerencia. TambiÃ©n se ejecuta al pulsar Enter dentro del componente.
		 * NOTA: Se utiliza para el input de la selecciÃ³n por rango y en el popover day.
		 */
		onSelectProject: function (oEvent) {
			var bInputRangeSelection = (this._inpSearchProjects.getId().indexOf("Popover") === -1) ? true : false;
			var bProjectNoSelected = (bInputRangeSelection && !this._projectSelected) || (!bInputRangeSelection && !this._projectSelectedDay);

			// entrara aqui cuando se seleccione un elemento de las sugerencias
			if (oEvent.getParameter("suggestionItem")) {
				this._selectProject(oEvent.getParameter("suggestionItem").getBindingContext("PROJECTS1").getObject());
				return;
			}

			var oSource = oEvent.getSource(); // el componente search field
			var sValue = oSource.getValue().trim(); // filtro del codigo de proyecto

			if (sValue.length >= 3 && bProjectNoSelected) {
				// por si el usuario ha pegado codigo + nombre del proyecto se recorta hasta el codigo
				if (sValue.length >= 16 && (new RegExp("([A-Z]){3}\-([0-9]{6})\-([0-9]{5})")).test(sValue.substr(0, 16))) {
					sValue = sValue.substr(0, 16);
				}

				// entrara aqui cuando se pulse Enter tras poner el codigo de un proyecto (no se utilizan las sugerencias)
				if (oSource.getSuggestionItems().length === 1) {
					var oProject = oSource.getSuggestionItems()[0].getBindingContext("PROJECTS1").getObject();

					// con este if nos aseguramos que el codigo del proyecto sugerido corresponde al filtro aplicado
					if (oProject.IdProject.indexOf(sValue) !== -1) {
						this._selectProject(oProject);
						return;
					}
				}
				// solo llega aqui cuando se pulse Enter tras poner el codigo de un proyecto y no haya dado tiempo a cargar sugerencias
				var that = this;
				this.getProjectsOdataModel().read("/ZPS_F_SEARCHPROJECTSet", {
					filters: [
						new Filter("AppTyp", FilterOperator.EQ, "TS"),
						new Filter("FreeText", FilterOperator.EQ, sValue)
					],
					success: function (oData) {
						if (oData.results.length === 1) {
							that._selectProject(oData.results[0]);
						} else {
							oSource.addStyleClass("searchFieldError");
							if (bInputRangeSelection) {
								that._btnSelectDays.setEnabled(false);
							} else {
								that._btnAddRow.setEnabled(false);
								that._btnFinish.setEnabled(false);
							}
						}
					},
					error: this._oDataError.bind(this)
				});
			}
			//Al seleccionar ponemos a false las sugerencias
			this._inpSearchProjects.setEnableSuggestions(false);
		},

		/**
		 * Borra el proyecto seleccionado en el momento en que se modifica algo en el input.
		 * NOTA: Se utiliza solo para el input de la selecciÃ³n por rango.
		 */
		/*onLiveChangeProject: function (oEvent) {
			this._projectSelected = undefined;
			this._btnSelectDays.setEnabled(false);
			this.byId("lnkInfoProject").setEnabled(false);
			this.byId("lnkSaveTemplate").setEnabled(false);
			// IRC Modificaciones expatriados
			var userWork = this.getModelGlobalVars().getProperty("/UserWork");
			if (userWork.DefaultHours === "HWHR") {
				// Quitamos el filtro por tipo de hora
				this._cmbTypesHours.getBinding("items").filter([]);
			}
			//AÃ±adimos condiciÃ³n para habilitar el suggest
			var oSource = oEvent.getSource();
			if (oSource.getValue().length > 8) {
				this._inpSearchProjects.setEnableSuggestions(true);
			}
		},*/

		/********************************************************/
		/*****    1.2 FUNCIONES PARA POPOVER DE TEMPLATES   *****/
		/********************************************************/

		/**
		 * Muestra el popover de los templates.
		 * Se muestra cuando el usuario presiona el boton Help del input de proyectos.
		 * NOTA: Se utiliza solo para el input de la seleccion por rango y del popover por dia
		 */
		onShowPopoverTemplates: function (oEvent) {
			if (!this._popoverTemplates) {
				this._popoverTemplates = sap.ui.xmlfragment("com.everis.Absentismos.view.fragments.PopoverTemplates", this);
				this.getView().addDependent(this._popoverTemplates);
			}
			// obtengo el search field de la fila (puede ser el inpSearchProjects de la selecciÃ³n por rango o un inpSearchProjectsPopover del popover)
			this._inpSearchProjects = this._byId(oEvent.getSource().getAriaDescribedBy()[0]);
			// Recupero los paneles para dejarlos siemrpe cerrados
			this._byId("pnlUserTemplates").setExpanded(false);
			this._byId("pnlPublicTemplates").setExpanded(false);

			jQuery.sap.delayedCall(0, this, function () {
				this._popoverTemplates.openBy(this._inpSearchProjects);
			});
		},

		onShowPopoverProyectos: function (oEvent) {
			var oButton = oEvent.getSource();
			// create popover
			if (!this._oPopoverProyectos) {
				Fragment.load({
					name: "com.everis.Absentismos.view.fragments.PopoverProyectos",
					controller: this
				}).then(function (pPopover) {
					this._oPopoverProyectos = pPopover;
					this.getView().addDependent(this._oPopoverProyectos);
					//this._oPopover.bindElement("/ProductCollection/0");
					this._oPopoverProyectos.openBy(oButton);
				}.bind(this));
			} else {
				this._oPopoverProyectos.openBy(oButton);
			}
		},

		onShowPopoverColaboradores: function (oEvent) {
			var oButton = oEvent.getSource();
			// create popover
			if (!this._oPopoverColaboradores) {
				Fragment.load({
					name: "com.everis.Absentismos.view.fragments.PopoverColaboradores",
					controller: this
				}).then(function (pPopover) {
					this._oPopoverColaboradores = pPopover;
					this.getView().addDependent(this._oPopoverColaboradores);
					//this._oPopoverColaboradores.bindElement("{ path: 'absentismos>/colaborador' }");
					this._oPopoverColaboradores.openBy(oButton);
				}.bind(this));
			} else {
				this._oPopoverColaboradores.openBy(oButton);
			}
		},

		onSelectProyecto: function (oEvent) {
			var proyecto = oEvent.getParameter("item").getText();
			var inputP = this.byId("inpSearchProyectos");
			var inputC = this.byId("inpSearchColaboradores");
			if (inputC === "") {
				inputP.setValue(proyecto);
			} else {
				inputP.setValue(proyecto);
				inputC.setValue("");
			}
			this._oPopoverProyectos.close();
		},

		onSelectColaborador: function (oEvent) {
			var colaborador = oEvent.getParameter("item").getText();
			var inputP = this.byId("inpSearchProyectos");
			var inputC = this.byId("inpSearchColaboradores");
			if (inputP === "") {
				inputC.setValue(colaborador);
			} else {
				inputC.setValue(colaborador);
				inputP.setValue("");
			}
			this._oPopoverColaboradores.close();
		},

		onSearchPC: function () {
			var inputP = this.byId("inpSearchProyectos");
			var inputC = this.byId("inpSearchColaboradores");
			var cboPeriodoAnio = this.byId("cboPeriodoAnio");
			var cmbPeriodoMes = this.byId("cmbPeriodoMes");
			var codigo = this.byId("txtCodigo");
			var nombre = this.byId("txtNombre");
			var categoria = this.byId("txtCategoria");
			var csr = this.byId("txtCsr");
			var tipo = this.byId("txtTipo");
			var perfil = this.byId("txtPerfil");
			var fechaCalendar = this.byId("monthTitle2");
			var reportPDF = this.byId("reportPDF");
			var reportExcel = this.byId("reportExcel");
			if (inputC.getValue() !== "" || inputP.getValue() !== "") {
				if (cboPeriodoAnio.getValue() !== "" && cmbPeriodoMes.getValue() !== "") {
					//MessageToast.show("Se realiza la búsqueda");
					/*if (inputC !== "") {
						var oTable = this.byId("TableDetail1");
						var oFilters = [new Filter("nombre", "Contains", inputC)];
						var template = this.byId("items");

						oTable.bindItems(
							"absentismos>/colaborador",
							template,
							null,
							oFilters
						);
					}*/

					//week 1
					var d2 = this.byId("btnDay-2");
					var d3 = this.byId("btnDay-3");
					var d4 = this.byId("btnDay-4");
					var d5 = this.byId("btnDay-5");
					var d6 = this.byId("btnDay-6");
					//week 2
					var d9 = this.byId("btnDay-9");
					var d10 = this.byId("btnDay-10");
					var d11 = this.byId("btnDay-11");
					var d12 = this.byId("btnDay-12");
					var d13 = this.byId("btnDay-13");
					//week 3
					var d16 = this.byId("btnDay-16");
					var d17 = this.byId("btnDay-17");
					var d18 = this.byId("btnDay-18");
					var d19 = this.byId("btnDay-19");
					var d20 = this.byId("btnDay-20");
					//week 3
					var d23 = this.byId("btnDay-23");
					var d24 = this.byId("btnDay-24");
					var d25 = this.byId("btnDay-25");
					var d26 = this.byId("btnDay-26");
					var d27 = this.byId("btnDay-27");
					//week 3
					var d30 = this.byId("btnDay-30");

					if (inputC.getValue() !== "") {
						if (inputC.getValue() === "Diego Antonio Lazarte Peláez") {
							codigo.setText("178173");
							nombre.setText("Diego Antonio Lazarte Peláez");
							categoria.setText("Centers Developer");
							csr.setText("csr123");
							tipo.setText("tipoABC");
							perfil.setText("perfil123");
							fechaCalendar.setText(cmbPeriodoMes.getValue() + " " + cboPeriodoAnio.getValue());
							if (cboPeriodoAnio.getValue() === '2019' || cboPeriodoAnio.getValue() === '2018') {
								d2.setText("8");
								d3.setText("8");
								d4.setText("8");
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							} else if (cboPeriodoAnio.getValue() === '2018') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							}
							reportPDF.setVisible(true);
							reportExcel.setVisible(true);
						} else if (inputC.getValue() === "Juan Alexander Zegarra Arana") {
							codigo.setText("178175");
							nombre.setText("Juan Alexander Zegarra Arana");
							categoria.setText("Centers Junior");
							csr.setText("csr654");
							tipo.setText("tipoADB");
							perfil.setText("perfil112");
							fechaCalendar.setText(cmbPeriodoMes.getValue() + " " + cboPeriodoAnio.getValue());
							if (cboPeriodoAnio.getValue() === '2019' || cboPeriodoAnio.getValue() === '2018') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							} else if (cboPeriodoAnio.getValue() === '2017') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							}
							reportPDF.setVisible(true);
							reportExcel.setVisible(true);
						} else if (inputC.getValue() === "Ingelshin Nicholson Barraza Canchán") {
							codigo.setText("178176");
							nombre.setText("Ingelshin Nicholson Barraza Canchán");
							categoria.setText("Centers Junior");
							csr.setText("csr777");
							tipo.setText("tipoADB");
							perfil.setText("perfil122");
							fechaCalendar.setText(cmbPeriodoMes.getValue() + " " + cboPeriodoAnio.getValue());
							if (cboPeriodoAnio.getValue() === '2019' || cboPeriodoAnio.getValue() === '2018') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d13.setText("8");
							} else if (cboPeriodoAnio.getValue() === '2017') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d12.setText("8");
								d13.setText("8");
							}
							reportPDF.setVisible(true);
							reportExcel.setVisible(true);
						} else {
							csr.setText("Sin Datos");
						}
					} else if (inputP.getValue() !== "") {
						if (inputP.getValue() === "proj-0790 - Control Staffing") {
							codigo.setText("178173");
							nombre.setText("Diego Antonio Lazarte Peláez");
							categoria.setText("Centers Developer");
							csr.setText("csr123");
							tipo.setText("tipoABC");
							perfil.setText("perfil123");
							fechaCalendar.setText(cmbPeriodoMes.getValue() + " " + cboPeriodoAnio.getValue());
							if (cboPeriodoAnio.getValue() === '2019') {
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							} else if (cboPeriodoAnio.getValue() === '2017') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							}
							reportPDF.setVisible(true);
							reportExcel.setVisible(true);
						} else if (inputP.getValue() === "proj-0789 - LFS") {
							codigo.setText("178175");
							nombre.setText("Juan Alexander Zegarra Arana");
							categoria.setText("Centers Junior");
							csr.setText("csr654");
							tipo.setText("tipoADB");
							perfil.setText("perfil112");
							fechaCalendar.setText(cmbPeriodoMes.getValue() + " " + cboPeriodoAnio.getValue());
							if (cboPeriodoAnio.getValue() === '2019' || cboPeriodoAnio.getValue() === '2018') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d11.setText("8");
							} else if (cboPeriodoAnio.getValue() === '2017') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							}
							reportPDF.setVisible(true);
							reportExcel.setVisible(true);
						} else if (inputP.getValue() === "proj-0792 - Primax - Danaus") {
							codigo.setText("178176");
							nombre.setText("Ingelshin Nicholson Barraza Canchán");
							categoria.setText("Centers Junior");
							csr.setText("csr777");
							tipo.setText("tipoADB");
							perfil.setText("perfil122");
							fechaCalendar.setText(cmbPeriodoMes.getValue() + " " + cboPeriodoAnio.getValue());
							if (cboPeriodoAnio.getValue() === '2019' || cboPeriodoAnio.getValue() === '2018') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							} else if (cboPeriodoAnio.getValue() === '2017') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							}
							reportPDF.setVisible(true);
							reportExcel.setVisible(true);
						} else {
							codigo.setText("");
							nombre.setText("");
							csr.setText("Sin Datos");
							csr.setText("");
							tipo.setText("");
							perfil.setText("");
							fechaCalendar.setText(cmbPeriodoMes.getValue() + " " + cboPeriodoAnio.getValue());
							if (cboPeriodoAnio.getValue() === '2019' || cboPeriodoAnio.getValue() === '2018') {
								d5.setText("8");
								d6.setText("8");
								d9.setText("8");
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							} else if (cboPeriodoAnio.getValue() === '2016') {;
								d10.setText("8");
								d11.setText("8");
								d12.setText("8");
								d13.setText("8");
							}
							reportPDF.setVisible(true);
							reportExcel.setVisible(true);
						}
					}

				} else {
					MessageToast.show("Ingrese Año y Mes");
				}
			} else {
				MessageToast.show("Seleccione un Proyecto o Colaborador");
			}
		},

		/**
		 * Se ejecuta al seleccionar un 'Public template'.
		 * NOTA: Se utiliza para el input de la selecciÃ³n por rango y el del popover del dia.
		 */
		onSelectPublicTemplate: function (oEvent) {
			var oItem = oEvent.getParameter("listItem").getBindingContext("PublicTemplates").getObject();
			this._selectProject(oItem);
			this.byId("lnkSaveTemplate").setEnabled(false);
			this._popoverTemplates.close();
		},

		/**
		 * Se ejecuta al seleccionar un 'My template'.
		 * NOTA: Se utiliza para el input de la selecciÃ³n por rango y el del popover del dia.
		 */
		onSelectMyTemplate: function (oEvent) {
			var that = this;
			var oItem = oEvent.getParameter("listItem").getBindingContext("Templates").getObject();
			// Comprobamos antes si aun se puede imputar en el proyecto asociado
			this.getProjectsOdataModel().read("/ZPS_F_SEARCHPROJECTSet", {
				filters: [
					new Filter("IdProject", FilterOperator.EQ, oItem.IdProject),
					new Filter("AppTyp", FilterOperator.EQ, "TS")
				],
				success: function (oData) {
					if (oData.results.length !== 0) {
						that._selectProject(oItem);
					} else {
						var message = "You cannot record hours in project from this template";

						if (that._popoverDayCalendar && that._popoverDayCalendar.isOpen()) {
							sap.m.MessageToast.show(message);
						} else {
							// Mostramos el mensaje de error por pantalla
							MessageBox.alert(message, {
								icon: MessageBox.Icon.ERROR,
								title: "Project in template validation",
								onClose: function () {
									// si estamos en el popover de un dia del calendario se quita la opcion 'modal' para que se pueda cerrar
									if (that._popoverDayCalendar && that._popoverDayCalendar.isOpen() && that.getOwnerComponent().getModel("device").getProperty(
											"/isSurfaceDesktop")) {
										that._popoverDayCalendar.setModal(false);
									}
								}
							});
						}
					}
					that.byId("lnkSaveTemplate").setEnabled(false);
					that._popoverTemplates.close();
				},
				error: this._oDataError.bind(this)
			});

		},

		/**
		 * Se ejecuta al seleccionar un proyecto de las sugerencias, un template o un proyecto de la bÃºsqueda avanzada.
		 * NOTA: Se utiliza para el input de la selecciÃ³n por rango y el del popover del dia.
		 */
		_selectProject: function (oProject) {
			var nameProject = (oProject.ProjectName) ? oProject.ProjectName :
				(oProject.NameTemplate) ? oProject.NameTemplate :
				oProject.Description;

			// guardo el nombre del proyecto (o template) en el mapa de nombres de proyectos
			if (!this._projectNameMap[oProject.IdProject]) {
				this._projectNameMap[oProject.IdProject] = nameProject;
			}
			// guardo el nombre del proyecto en el mismo objeto del proyecto (por si venia de un Template)
			oProject.ProjectName = nameProject;

			var sDate = "";

			// si entra por aqui es que estamos en el search field 'inpSearchProjects' de la seleccion por rango
			if (this._inpSearchProjects.getId().indexOf("Popover") === -1) {
				// seteo el valor directamente en el input search field
				this._inpSearchProjects.setValue(oProject.IdProject + " - " + oProject.ProjectName);

				// quito error por si lo tenia
				this._inpSearchProjects.removeStyleClass("searchFieldError");

				this._projectSelected = oProject;
				this.onValidateRangeSelection(); // validacion para habilitar el boton si el resto de campos estan informados
				this.byId("lnkSaveTemplate").setEnabled(true);
				this._inpHours.focus();

				//console.log(this._projectSelected);

				// si entra por aqui es que estamos en uno de los search field 'inpSearchProjectsPopover' del popover
			} else {
				// seteo el valor directamente en el input search field
				this._inpSearchProjects.setValue(oProject.IdProject + " - " + oProject.ProjectName);

				// se obtiene el modelo de la fila y se setean los valores del proyecto
				var oRow = this._inpSearchProjects.getBindingContext("mDay").getObject();
				oRow.IdProject = oProject.IdProject;
				oRow.ProjectName = oProject.ProjectName;

				// Refrescamos el modelo
				this._mDay.refresh(true);

				// Sacamos la fecha del dia que se ha seleccionado en el calendario
				sDate = (this._sDay < 10) ? this._sMonth + "0" + this._sDay : this._sMonth + this._sDay;

				// guardo en una variable el proyecto seleccionado
				this._projectSelectedDay = oProject;

				// validacion de campos informados y de las horas totales introducidas
				this._enabledButtonsDay(this._checkPopoverTotalHours() && this._validateDayCompleted());
			}

			// habilito el link para ver la info del proyecto
			var lnkInfoProject = this._byId(this._inpSearchProjects.getAriaDescribedBy()[0]);
			lnkInfoProject.setEnabled(true);

			// Recargo los tipos de hora
			this._getTaskcompData(oProject.IdProject, sDate);
		},

		/*******************************************************/
		/*****    1.3 FUNCIONES PARA EL ADVANCED SEARCH    *****/
		/*******************************************************/

		/** NOTA: La mayoria de estas funciones se encuentran en BaseController.js ya que comparten funcionalidad con la vista Home **/

		/**
		 * Abre la vista modal de busqueda avanzada.
		 * NOTA: Se utiliza para el input de la selecciÃ³n por rango y el del popover del dia.
		 */
		onAdvancedSearch: function () {
			// si estamos en el popover de un dia del calendario se vuelve modal para que no se cierre
			if (this._popoverDayCalendar && this._popoverDayCalendar.isOpen()) {
				this._popoverDayCalendar.setModal(true);
			}
			this._getDialogAdvSearchProjects().open();
		},

		/**
		 * Evento que se ejecuta al seleccionar un proyecto de la tabla.
		 */
		onAdvSelectProject: function (oEvent) {
			// ejecuto el metodo para la seleccion de proyecto
			this._selectProject(oEvent.getParameter("listItem").getBindingContext().getObject());

			// si estamos en el popover de un dia del calendario se quita la opcion 'modal' para que se pueda cerrar
			if (this._popoverDayCalendar && this._popoverDayCalendar.isOpen() && this.getOwnerComponent().getModel("device").getProperty(
					"/isSurfaceDesktop")) {
				this._popoverDayCalendar.setModal(false);
			}
			// Cierro la busqueda avanzada
			this.onCloseAdvSearchProjects();
		},
		/**********************************************************/
		/*****    1.4 FUNCIONES PARA LA MODAL INFO PROJECT    *****/
		/**********************************************************/

		/**
		 * Se ejecuta al pulsar sobre 'Project info' de la selecciÃ³n por rango.
		 * Abre un dialog con la informaciÃ³n del proyecto seleccionado.
		 */
		onOpenProjectInfo: function () {
			this._openProjectInfo(this._projectSelected.IdProject);
		},

		/**
		 * Abre un dialog con la informaciÃ³n del proyecto seleccionado.
		 */
		_openProjectInfo: function (idProject) {
			// se crea el fragment si no existe ya
			if (!this._dialogInfoProject) {
				this._dialogInfoProject = sap.ui.xmlfragment("com.everis.Absentismos.view.fragments.InfoProject", this);
				this.getView().addDependent(this._dialogInfoProject);
			}

			// Recuperamos IdEmployee e IdApp
			var sIdEmployee = this.getModelGlobalVars().getProperty("/UserWork/IdEmployee");
			var sApp = this.getModelGlobalVars().getProperty("/sApp");
			var sParams = "IdEmployee='" + sIdEmployee + "',IdProject='" + idProject + "',IdApp='" + sApp + "'";

			// se obtiene el proyecto y se pasan sus datos al dialog
			var that = this;
			//this.getProjectsOdataModel().read("/ZPS_F_PROJECTSet('" + idProject + "')", {
			this.getProjectsOdataModel().read("/ZPS_F_PROJECTSet(" + sParams + ")", {
				success: function (oData) {
					that._dialogInfoProject.setModel(new sap.ui.model.json.JSONModel(oData));
					// si estamos en el popover de un dia del calendario se vuelve modal para que no se cierre
					if (that._popoverDayCalendar && that._popoverDayCalendar.isOpen()) {
						that._popoverDayCalendar.setModal(true);
					}
					that._dialogInfoProject.open();
				},
				error: this._oDataError.bind(this)
			});
		},

		/**
		 * Se cierra la vista modal de info del proyecto.
		 * NOTA: Se utiliza para el input de la selecciÃ³n por rango y el del popover del dia.
		 */
		onCloseProjectInfo: function () {
			if (this._popoverDayCalendar && this._popoverDayCalendar.isOpen() && this.getOwnerComponent().getModel("device").getProperty(
					"/isSurfaceDesktop")) {
				this._popoverDayCalendar.setModal(false);
			}
			this._dialogInfoProject.close();
		},

		/**
		 * Habilita o deshabilita el boton 'Select date range' en funcion de si estan todos los campos informados.
		 */
		/*	onValidateRangeSelection: function () {
				var bProject = this._inpSearchProjects.getValue() && this._projectSelected;
				var typeHours = this._cmbTypesHours.getSelectedItem();
				var iHours = this._inpHours.getValue();

				this._btnSelectDays.setEnabled((bProject && typeHours && iHours) ? true : false);
			},*/

		/**
		 * Se ejecuta al modificar el valor del input de horas de la seleccion por rango.
		 */
		onValidateInputHoursRange: function (oEvent) {
			var oInput = oEvent.getSource();
			var sValue = oInput.getValue();
			var iHoursMax = 24;
			var fHoursMin = this._modeDecimal ? 0.01 : 1;

			// comprobamos si esta vacio
			if (!sValue) {
				oInput.setValueState(ValueState.None);
				oInput.setShowValueStateMessage(false);
				this._btnSelectDays.setEnabled(false);
				return;
			}

			if (this._modeDecimal) {
				// validacion de caracteres introducidos (no permite otra cosa que no sea numeros y el punto)
				if (!(new RegExp("^[0-9\.]*$")).test(sValue)) {
					oInput.setValue(oInput.getValue().substr(0, oInput.getValue().length - 1));
					oInput.setValueStateText("Character not allowed");
					oInput.setValueState(ValueState.Warning);
					oInput.setShowValueStateMessage(true);
					this._btnSelectDays.setEnabled(false);
					return;
				}
				// validacion del numero decimal
				if (!(new RegExp("^[0-9]+(\.[0-9]{0,2})?$")).test(sValue)) {
					oInput.setValueStateText("Wrong number");
					oInput.setValueState(ValueState.Error);
					oInput.setShowValueStateMessage(true);
					this._btnSelectDays.setEnabled(false);
					return;
				}

			} else {
				// validacion de caracteres introducidos (no permite otra cosa que no sea numeros)
				if (!(new RegExp("^[0-9]*$")).test(sValue)) {
					oInput.setValue(oInput.getValue().substr(0, oInput.getValue().length - 1));
					oInput.setValueStateText("Character not allowed");
					oInput.setValueState(ValueState.Warning);
					oInput.setShowValueStateMessage(true);
					this._btnSelectDays.setEnabled(false);
					return;
				}
			}

			// compruebo las horas minimas
			var fHours = parseFloat(sValue);
			if (fHours < fHoursMin) {
				oInput.setValueStateText("The value must be greater than " + fHoursMin);
				oInput.setValueState(ValueState.Error);
				oInput.setShowValueStateMessage(true);
				this._btnSelectDays.setEnabled(false);
				return;
			}

			// compruebo las horas maximas
			if (fHours > iHoursMax) {
				oInput.setValueStateText("Maximum of " + iHoursMax + " hours");
				oInput.setValueState(ValueState.Error);
				oInput.setShowValueStateMessage(true);
				this._btnSelectDays.setEnabled(false);
				return;
			}
			// quito el error del input
			oInput.setValueState(ValueState.None);
			oInput.setShowValueStateMessage(false);

			// valido el resto de campos
			this.onValidateRangeSelection();
		},

		/**
		 * Pasa el calendario a modo de seleccion de rango.
		 */
		onModeSelectDateRange: function () {
			this._modeSelectRange = true; // paso a modo de seleccion por rango
			this._clearCalendarSelection(); // desmarco los dias del calendario
			this._enabledRangeSelection(false); // deshabilito todos los componentes de la seleccion por rango
			this._enabledChangeDate(false); // deshabilito el cambio de fecha
			this._enabledDeleteProjects(false); // deshabilito el borrado de proyectos del panel Summary
			this._createFooter(); // creo el footer
			this._repaintCalendar(this._cmbTypesHours.getSelectedKey());
			this._tableCalendar.focus();

			// deshabilitamos el boton Approve
			this.byId("btnApprove").setEnabled(false);
		},

		/**
		 * Repinta el calendario en funcion del tipo de hora seleccionado en el rango.
		 */
		_repaintCalendar: function (idHourType) {
			var oHourType = this._mapHoursType[idHourType];

			// meto todos los dias del mes
			for (var iDay in this._oCalendar) {
				var oCalendarDay = this._oCalendar[iDay];
				if (!oCalendarDay.editable) {
					continue; // si el dia no es editable se salta a la siguiente iteracion
				}
				var cmpCalendarDay = this._cmpCalendar[iDay];

				cmpCalendarDay.box.removeStyleClass("cssBoxDay");
				cmpCalendarDay.box.removeStyleClass("cssBoxDayNoEdit");

				if (oCalendarDay.festive) {
					if (oHourType.Festive.MaxHours > 0) {
						oCalendarDay.edit = true;
						cmpCalendarDay.btn.setEnabled(true);
						cmpCalendarDay.box.addStyleClass("cssBoxDay");
					} else {
						oCalendarDay.edit = false;
						cmpCalendarDay.btn.setEnabled(false);
						cmpCalendarDay.box.addStyleClass("cssBoxDayNoEdit");
					}
				} else {
					if (oHourType[oCalendarDay.weekday].MaxHours > 0) {
						oCalendarDay.edit = true;
						cmpCalendarDay.btn.setEnabled(true);
						cmpCalendarDay.box.addStyleClass("cssBoxDay");
					} else {
						oCalendarDay.edit = false;
						cmpCalendarDay.btn.setEnabled(false);
						cmpCalendarDay.box.addStyleClass("cssBoxDayNoEdit");
					}
				}
			}
		},

		/*************************************************************/
		/*****    1.5 FUNCIONES PARA CONTROL DE SAVE TEMPLATES   *****/
		/*************************************************************/

		/**
		 * Abre la vista para guardar el template.
		 */
		onCreateTemplate: function () {
			if (this._dialogCreateTemplate) {
				this._dialogCreateTemplate.destroy();
			}
			this._dialogCreateTemplate = sap.ui.xmlfragment("com.everis.Absentismos.view.fragments.CreateTemplate", this);
			this.getView().addDependent(this._dialogCreateTemplate);

			// se establece el titulo del dialog
			sap.ui.getCore().byId("titTemplate").setText("Create template");

			// se setea el codigo en el search field y se deshabilita
			var inpSearchField = sap.ui.getCore().byId("codeTemplate");
			inpSearchField.setEnabled(false);
			inpSearchField.setValue(this._projectSelected.IdProject);

			// se oculta el link para abrir la vista de busqueda avanzada
			sap.ui.getCore().byId("lnkAdvancedSearch").setVisible(false);

			this._dialogCreateTemplate.open();
		},

		onCloseDialogTemplate: function () {
			this._dialogCreateTemplate.destroy();
		},

		/**
		 * Guarda el template.
		 */
		onSaveTemplate: function () {
			// volvemos a validar por si hubiera errores
			if (!this.onSaveValidate(["nameTemplate"], true)) {
				return;
			}

			// ponemos indicador de cargando
			this.getView().setBusy(true);

			// genero el objeto que debemos pasar al servicio de creacion de templates
			var data = {
				IdEmployee: this.getModelGlobalVars().getProperty("/UserWork/IdEmployee"),
				NameTemplate: sap.ui.getCore().byId("nameTemplate").getValue(),
				IdProject: this._projectSelected.IdProject,
				IdTemplate: ""
			};
			// se crea el template
			var that = this;
			this.getTimelaborOdataModel().create("/ZTS_F_TEMPLATESSet", data, {
				success: function () {
					// cerramos el dialog
					that._dialogCreateTemplate.destroy();
					// Recargamos la lista de templates
					that._loadModelTemplates();
					that.getView().setBusy(false);
				},
				error: this._oDataError.bind(this)
			});
		},

		/*************************************************/
		/*****    2. CONTROLES PARA EL CALENDARIO    *****/
		/*************************************************/

		/**
		 * Habilita/deshabilita los botones para cambio de mes o semana.
		 */
		_enabledChangeDate: function (b) {
			this.byId("btnNext").setEnabled(b && !this._modeDetail && this._bDataOnNextMonth);
			this.byId("btnPrevious").setEnabled(b && !this._modeDetail && this._bDataOnPrevMonth);
		},

		/**
		 * Reinicia el calendario.
		 */
		onReset: function () {
			var that = this;
			MessageBox.confirm("Not submitted hours will not be recorded", {
				title: "Are you sure you want to reset?",
				onClose: function (sResult) {
					if (sResult === MessageBox.Action.OK) {
						that.byId("gridCalendarBlock").setBusy(true);
						that._initOdataRequest2();
					}
				}
			});
		},

		/**
		 * Se ejecuta al pulsar sobre un dia del calendario.
		 * Puede abrir el popover con los datos de ese dia o iniciar/terminar la eleccion de un rango, depende del modo actual.
		 */
		onPressDay: function (oEvent) {

			// si la seleccion por rango esta activada se selecciona el dia y se ejecuta el tratamiento del pintado
			if (this._modeSelectRange) {
				this._rangeSelection(oEvent);

				// si no lo esta se llama al metodo que abre el popover del dia
			} else {
				this._openDayCalendar(oEvent);
			}
		},

		/**
		 * Se ejecuta al pulsar al boton '<' del calendario.
		 * Navega hasta el mes o la semana anterior, segÃºn el modo activado.
		 */
		onPrevious: function () {
			if (this._modeWeek) {
				this.onPreviousWeek();
			} else {
				// antes de cambiar de mes hay que comprobar que no hay cambios
				this._questionDiscardChanges(this.onPreviousMonth.bind(this));
			}
		},

		onPreviousMonth: function () {
			// siempre que vayamos hacia atras habilitamos el boton de Next
			this.byId("btnNext").setEnabled(true);

			// le resto un mes a la fecha actual
			var date = this.formatter.stringToDate(this._sMonth, "yyyyMM");
			date.setMonth(date.getMonth() - 1);
			this._sMonth = this.formatter.dateToString(date, "yyyyMM");

			// pongo el busy en la parte del calendario
			this.byId("gridCalendarBlock").setBusy(true);

			// reinicia toda la vista
			this._initOdataRequest2();
		},

		onPreviousWeek: function () {
			// siempre que vayamos hacia atras habilitamos el boton de Next
			this.byId("btnNext").setEnabled(true);

			if (this._weekCurrent > 0) {
				this._weekCurrent--;
				this._changeWeek();
			} else {
				// antes de cambiar de mes hay que comprobar que no hay cambios
				this._questionDiscardChanges(this._previousWeekChangeMonth.bind(this));
			}
		},

		_previousWeekChangeMonth: function () {
			/* Tenemos que cargar el mes anterior, por esa razon se le pone -1 a la semana actual, para que al 
			 * recargar sepamos que tenemos que mostrar la ultima semana del mes anterior */
			this._weekCurrent = -1;
			this.onPreviousMonth();
		},

		/**
		 * Se ejecuta al pulsar al boton '>' del calendario.
		 * Navega hasta el mes o la semana siguiente, segÃºn el modo activado.
		 */
		onNext: function () {
			if (this._modeWeek) {
				this.onNextWeek();
			} else {
				// antes de cambiar de mes hay que comprobar que no hay cambios
				this._questionDiscardChanges(this.onNextMonth.bind(this));
			}
		},

		onNextMonth: function () {
			// si el mes mostrado es el actual se deshabilita el boton de Next, ya que solo se puede avanzar un mes
			var sMonthCurrent = this.formatter.dateToString(new Date(), "yyyyMM");
			this.byId("btnNext").setEnabled((sMonthCurrent !== this._sMonth || this._modeWeek) && this._bDataOnNextMonth);

			// le sumo un mes a la fecha actual
			var date = this.formatter.stringToDate(this._sMonth, "yyyyMM");
			date.setMonth(date.getMonth() + 1);
			this._sMonth = this.formatter.dateToString(date, "yyyyMM");

			// pongo el busy en la parte del calendario
			this.byId("gridCalendarBlock").setBusy(true);

			// reinicia toda la vista
			this._initOdataRequest2();
		},

		onNextWeek: function () {
			var numWeeks = this._tableCalendar.getItems().length - 1;

			// si esta en modo semana y no hemos llegado a la ultima del mes entra
			if (this._weekCurrent < numWeeks) {
				// se le suma una semana
				this._weekCurrent++;
				this._changeWeek();

				// si es la ultima semana tenemos que comprobar que no es el ultimo mes
				if (this._weekCurrent === numWeeks) {
					// si la ultima semana es la del mes siguiente al actual se deshabilita el boton Next
					var oMonth = this.formatter.stringToDate(this._sMonth, "yyyyMM");
					this.byId("btnNext").setEnabled(new Date() >= oMonth && this._bDataOnNextMonth);
				}
			} else {
				// antes de cambiar de mes hay que comprobar que no hay cambios
				this._questionDiscardChanges(this._nextWeekChangeMonth.bind(this));
			}
		},

		_nextWeekChangeMonth: function () {
			/* Tenemos que cargar el mes siguiente, por esa razon se le pone 0 a la semana actual, 
			 * para que al recargar sepamos que tenemos que mostrar la primera semana del proximo mes */
			this._weekCurrent = 0;
			this.onNextMonth();
		},

		onApprove: function () {
			this.getView().setBusy(true);

			// obtengo el primer y ultimo dia del mes ya que hace falta para el servicio
			var oDate = this.formatter.stringToDate(this._sMonth, "yyyyMM");
			var firstDay = new Date(oDate.getFullYear(), oDate.getMonth(), 1);
			var lastDay = new Date(oDate.getFullYear(), oDate.getMonth() + 1, 0);

			var idEmployee = this.getModelGlobalVars().getProperty("/UserWork/IdEmployee");

			// creo la cabecera de los datos a enviar al servicio de guardado
			var data = {
				"FinishDate": this.formatter.dateToString(lastDay, "yyyyMMdd"),
				"InitialDate": this.formatter.dateToString(firstDay, "yyyyMMdd"),
				"Date": this._sMonth,
				"IdEmployee": idEmployee,
				"nav1": []
			};

			// primero meto los datos a borrar, que seran todos los originales
			for (var key in this._oCalendarOriginal) {
				var itemsDay = this._oCalendarOriginal[key].items;
				for (var i = 0; i < itemsDay.length; i++) {
					var item = itemsDay[i];
					item.Day = ("0" + key).slice(-2); // devolverÃ¡ '01' si key=1; '12' si key=12
					item.Date = this._sMonth;
					item.IdEmployee = idEmployee;
					item.Message = "0";
					item.UpdateData = "D"; // 'D' de Delete
					delete item.ProjectName;

					data.nav1.push(item);
				}
			}
			// luego meto los datos a insertar, que sera el objeto que hemos asociado al calendario
			for (key in this._oCalendar) {
				itemsDay = this._oCalendar[key].items;
				for (i = 0; i < itemsDay.length; i++) {
					item = itemsDay[i];
					item.Day = ("0" + key).slice(-2);
					item.Date = this._sMonth;
					item.IdEmployee = idEmployee;
					item.Message = "0";
					item.UpdateData = "I"; // 'I' de Insert
					delete item.ProjectName;

					data.nav1.push(item);
				}
			}
			//console.log("Datos TimeEntry:");
			//console.log(data);
			// se ejecuta el servicio de guardado
			var that = this;
			this.getTimelaborOdataModel().create("/ZTS_F_EMPLOYEECURRENLYHEADSet", data, {
				success: function () {
					// se muestra mensaje de guardado correcto
					MessageBox.success("Timecard successfully submitted", {
						onClose: function () {
							// vuelvo a cargar la vista
							that._initOdataRequest2();
						}
					});
					that.getView().setBusy(false);
				},
				error: function (oError) {
					that._oDataError(oError, that._initOdataRequest2.bind(that));
				}
			});
		},

		/**********************************************************************/
		/*****    2.1 FUNCIONES PARA SELECCION POR RANGO DEL CALENDARIO   *****/
		/**********************************************************************/

		/**
		 * Realiza la seleccion inicial (dia inicial rango) y final (dia final rango) en la seleccion por rango del calendario.
		 * Existe otro metodo que realiza la seleccion del calendario #_selectProjectDays, pero en vez de hacerlo por rango
		 * lo hace por proyectos.
		 */
		_rangeSelection: function (oEvent) {
			var btnDay = oEvent.getSource();
			var sDay = btnDay.data("day");

			if (this._sDaySelect1) {
				// si entra aqui es que es el segundo dia que se pulsa del rango
				var iDaySelect1 = parseInt(this._sDaySelect1, 10);
				var iDaySelect2 = parseInt(sDay, 10);

				var dayFrom = iDaySelect1 < iDaySelect2 ? iDaySelect1 : iDaySelect2;
				var dayTo = iDaySelect1 > iDaySelect2 ? iDaySelect1 : iDaySelect2;

				this._dataRangeSelection = {}; // objeto temporal que contendra los datos del rango seleccionado
				for (var key in this._oCalendar) {
					if (this._oCalendar[key].edit) {
						var iDay = parseInt(key, 10);
						if (dayFrom <= iDay && iDay <= dayTo) {
							// aÃ±ado el dia al objeto que utilizaremos para el guardado
							this._dataRangeSelection[key] = {
								IdProject: this._projectSelected.IdProject,
								ProjectName: this._projectSelected.ProjectName,
								RecordedHours: this._inpHours.getValue(),
								TypeHour: this._cmbTypesHours.getSelectedKey(),
								Status: ""
							};
							// pinto el dia con los estilos cssBoxDaySelect/Error que destacan los dias
							this._cmpCalendar[key].box.removeStyleClass("cssBoxDayErrHover");
							this._cmpCalendar[key].box.removeStyleClass("cssBoxDayHover");
							this._cmpCalendar[key].box.addStyleClass(this._oCalendar[key].error ? "cssBoxDaySelectError" : "cssBoxDaySelect");
						}
					}
				}
				//console.log(this._dataRangeSelection);
				// habilito el boton de guardado, elimino el evento de pintado y limpio el primer dia seleccionado
				sap.ui.getCore().byId("btnFinishFooter").setEnabled(true);
				$(".cssBoxDay").unbind("mouseenter mouseleave");
				this._sDaySelect1 = undefined;

			} else {
				// si entra aqui es que es el primer dia que se pulsa del rango
				this._clearCalendarSelection();
				this._sDaySelect1 = sDay;
				this._cmpCalendar[sDay].box.addStyleClass(this._oCalendar[sDay].error ? "cssBoxDaySelectError" : "cssBoxDaySelect");

				// aÃ±ado el evento que se encarga de pintar dinamicamente el rango seleccionado
				$(".cssBoxDay").hover(this._paintRangeSelection.bind(this));
			}
		},

		/**
		 * Se encarga de pintar el rango de seleccion de dias del calendario.
		 * Se ejecuta cada vez que el puntero del raton pasa sobre un dia del calendario.
		 */
		_paintRangeSelection: function (object) {
			var idBoxCurrent = object.currentTarget.id; // box (dia) sobre el que se encuentra el puntero del raton
			var idBoxSelect = this._cmpCalendar[this._sDaySelect1].box.getId(); // box (dia) que marca el inicio del rango

			var paint = 0; // esta variable indica cuando pintar los dias (=1 se pinta, =0 o =2 no se pinta)
			var idBoxs = [idBoxCurrent, idBoxSelect];

			// se recorren todos los boxs (dias) del calendario
			for (var key in this._cmpCalendar) {
				// si es editable cojo el box
				if (this._oCalendar[key].edit) {
					var box = this._cmpCalendar[key].box;
					var css = this._oCalendar[key].error ? "cssBoxDayErrHover" : "cssBoxDayHover";

					if (idBoxs.indexOf(box.getId()) === -1) {
						if (paint === 1) {
							box.addStyleClass(css);
						} else {
							box.removeStyleClass(css);
						}
					} else {
						// si entra aqui es que el bucle ha pasado por el dia sobre el que se encuentra el puntero o sobre el dia de inicio de rango
						paint++;
						box.addStyleClass(css);
						if (idBoxCurrent === idBoxSelect) {
							// si es el mismo dia paso directamente al valor 2, dejando pintado solo el box actual
							paint++;
						}
					}
				}
			}
		},

		/**
		 * Limpia cualquier tipo de seleccion de todos los dias del calendario.
		 */
		_clearCalendarSelection: function () {
			for (var key in this._cmpCalendar) {
				this._cmpCalendar[key].box.removeStyleClass("cssBoxDaySelect");
				this._cmpCalendar[key].box.removeStyleClass("cssBoxDaySelectError");
				this._cmpCalendar[key].box.removeStyleClass("cssBoxDayHover");
				this._cmpCalendar[key].box.removeStyleClass("cssBoxDayErrHover");
			}
			this._projectSelectSummary = "";
		},

		/**
		 * Crea el footer de la pagina.
		 */
		_createFooter: function () {
			var btnCancel = new sap.m.Button({
				iconFirst: true,
				icon: "sap-icon://decline",
				text: "Cancel",
				press: this.onCancel.bind(this)
			}).addStyleClass("btnColorWhite sapUiSmallMarginBegin");

			var btnFinish = new sap.m.Button({
				id: "btnFinishFooter",
				text: "Finish",
				press: this.onFinish.bind(this),
				enabled: false
			}).addStyleClass("btnGreen fontSize18 sapUiLargeMarginEnd");

			var footer = new sap.m.Toolbar({
				id: "footerTimeEntry",
				content: [btnCancel, new sap.m.ToolbarSpacer(), btnFinish]
			}).addStyleClass("footerCalendar");

			this.byId("timeEntryPage").setFooter(footer);
		},

		/**
		 * Elimina el footer de la pagina.
		 */
		_destroyFooter: function () {
			var footer = sap.ui.getCore().byId("footerTimeEntry");
			if (footer) {
				footer.destroy();
			}
		},

		/**
		 * Cancela la seleccion por rango del calendario.
		 */
		onCancel: function () {
			this._destroyFooter(); // elimino el footer
			this._clearCalendarSelection(); // desmarco los dias del calendario
			this._enabledRangeSelection(true); // habilito los componentes de la selecciÃ³n por rango
			this._enabledChangeDate(true); // habilito el cambio de fecha
			this._enabledDeleteProjects(true); // habilito el borrado de proyectos del panel Summary
			this._repaintCalendar("AllHourTypes"); // vuelve al calendario original
			this._modeSelectRange = false; // pasamos a modo de seleccion simple

			// habilitamos el boton Approve si hay cambios, no estamos en el detalle y no hay errores
			this.byId("btnApprove").setEnabled(this._bChanges && !this._modeDetail && this._checkPosibleApprove());
		},

		/**
		 * Guarda en el modelo las horas introducidas en la selecciÃ³n por rango.
		 * Se ejecuta al pulsar el botÃ³n 'Finish' del footer.
		 */
		onFinish: function () {
			// Deshabilito el botÃ³n, ya que se han cambiado las horas y no sabemos si estÃ¡n bien
			this.byId("btnApprove").setEnabled(false);
			// seteo en data y pintado en el calendario
			for (var day in this._dataRangeSelection) {
				this._addItemToCalendar(this._dataRangeSelection[day], day);
				//console.log(this._oCalendar[day].items);

				// pinto las horas en el dia del calendario
				var hours = 0;
				var aDay = this._oCalendar[day].items;
				for (var i = 0; i < aDay.length; i++) {
					hours += parseFloat(aDay[i].RecordedHours);
				}
				this._cmpCalendar[day].btn.setText(parseFloat(hours.toFixed(2)));

				// aqui comprobaremos que las horas que se han introducido son corectas
				if (this._checkTotalHours(day)) {
					// si pasa la validacion se pone la clase de modificacion
					this._oCalendar[day].error = false;
					this._cmpCalendar[day].box.removeStyleClass("cssBoxDayErr");
					this._cmpCalendar[day].box.addStyleClass("cssBoxDayMod");
					this._cmpCalendar[day].box.addStyleClass("animBrightnessDay");
				} else {
					// si no pasa la validacion se pone la clase de error
					this._oCalendar[day].error = true;
					this._cmpCalendar[day].box.removeStyleClass("cssBoxDayMod");
					this._cmpCalendar[day].box.addStyleClass("cssBoxDayErr");
					this._cmpCalendar[day].box.addStyleClass("animBrightnessDayErr");
				}
			}

			// quito la clase del brillo tras un segundo (tiempo de duracion de la animacion)
			jQuery.sap.delayedCall(1200, this, function () {
				for (var key in this._cmpCalendar) {
					this._cmpCalendar[key].box.removeStyleClass("animBrightnessDay");
					this._cmpCalendar[key].box.removeStyleClass("animBrightnessDayErr");
				}
			});

			// actualiza el panel Summary
			this._reloadModelSummary();

			this.onCancel();
		},

		/**
		 * Comprueba que el total de horas imputadas en el dia no supera 24 ni el maximo por tipo de hora seleccionada.
		 * Se ejecuta desde la selecciÃ³n por rango y el borrado de proyecto del panel Summary.
		 * @param day : Dia del mes
		 */
		_checkTotalHours: function (day) {

			// obtenemos todos los items del dia
			var itemsDay = this._oCalendar[day].items;
			if (itemsDay.length === 0) {
				return true; // si no tenemos items lo damos por valido (cero horas incurridas es correcto)
			}

			// validamos el limite total de horas por dia
			var sumHours = 0;
			for (var i = 0; i < itemsDay.length; i++) {
				sumHours += parseFloat(itemsDay[i].RecordedHours);
			}
			// IRC Modificaciones expatriados
			var userWork = this.getModelGlobalVars().getProperty("/UserWork");
			// Para expatriados tienen un maximo de 8 horas al dia, no 24 como los demas
			var maxHours = (userWork.DefaultHours === "HWHR") ? 8 : 24;
			if (sumHours > maxHours) {
				return false; // si la suma de horas es mayor a 24 ( 8 para expatriados ) la validacion es negativa
			}

			// validamos que no se sobrepasa el mÃ¡ximo para cada tipo de hora
			var weekday = this._oCalendar[day].festive ? "Festive" : this._oCalendar[day].weekday;

			for (var key in this._mapHoursType) {
				if (key === "AllHourTypes") {
					continue;
				} // salto el tipo generico

				sumHours = 0;
				for (i = 0; i < itemsDay.length; i++) {
					var item = itemsDay[i];
					// suma de horas por tipo
					if (item.TypeHour === key) {
						sumHours += item.RecordedHours ? parseFloat(item.RecordedHours) : 0;
					}
				}
				var iHoursMax = this._mapHoursType[key][weekday].MaxHours;
				var iHoursMin = this._mapHoursType[key][weekday].MinHours;
				if (sumHours > iHoursMax) {
					return false; // si la suma de horas es mayor al maximo por tipo de hora la validacion es negativa
				} else {
					if (iHoursMin > 0 && sumHours > 0) {
						if (sumHours < iHoursMin) {
							return false; // si la suma de horas es menor que el minimo por tipo de hora la validacion es negativa ( esto solo para USA )
						}
					}
				}
			}

			// si llega aqui es que no ha encontrado ningun error en las horas y por tanto es valido
			return true;
		},

		/**
		 * Comprueba si ya existe para ese dia la relacion proyecto-tipo de hora que el usuario quiere aÃ±adir.
		 * Si es asi solo suma las horas a la relacion ya existente y si no es asi se aÃ±ade el nuevo item.
		 * @newItem : Nuevo item para ese dia
		 * @day : Dia
		 */
		_addItemToCalendar: function (newItem, day) {
			var items = this._oCalendar[day].items;
			// si entra por el if del for es que esta relacion proyecto-hora ya existia y solo hay que sumar las horas
			for (var i = 0; i < items.length; i++) {
				if (newItem.IdProject === items[i].IdProject && newItem.TypeHour === items[i].TypeHour) {
					items[i].RecordedHours = (parseFloat(items[i].RecordedHours) + parseFloat(newItem.RecordedHours)).toString();
					return;
				}
			}
			// si no entra por el if del for es que esta relacion proyecto-hora no existia y hay que aÃ±adirlo
			items.push(newItem);
		},

		/********************************************************************/
		/*****    2.2 FUNCIONES PARA SELECCION POR DIA DEL CALENDARIO   *****/
		/********************************************************************/

		/**
		 * Abre el popover del dia seleccionado.
		 * En esta vista se encuentran las filas de proyectos/horas aÃ±adidos al dia seleccionado.
		 */
		_openDayCalendar: function (oEvent) {
			var btnDay = oEvent.getSource();
			var isTouch = this.getOwnerComponent().getModel("device").getProperty("/isNotSurfaceDesktop");
			// IRC Modificaciones expatriados
			// Recuperamos el usuario del sistema
			var userWork = this.getModelGlobalVars().getProperty("/UserWork");

			this._stopAfterCloseDayCalendar = true; // variable para el control de concurrencia entre este metodo y #afterCloseDayCalendar

			// limpiamos la seleccion actual del calendario por si la hay
			this._clearCalendarSelection();

			// si no existe lo creo
			if (!this._popoverDayCalendar) {
				var _fragment = (isTouch) ? "PopoverDayCalendarMobile" : "PopoverDayCalendar";
				this._popoverDayCalendar = sap.ui.xmlfragment("com.everis.Absentismos.view.fragments." + _fragment, this);
				this.getView().addDependent(this._popoverDayCalendar);

				this._msgConfirmation = sap.ui.getCore().byId("msgConfirmation");
				this._tableDayCalendar = sap.ui.getCore().byId("tableDayCalendar");

				this._btnAddRow = sap.ui.getCore().byId("btnAddRow");
				this._btnFinish = sap.ui.getCore().byId("btnFinish");

				// si estamos en formato decimal de imputaciones adapto el Input de horas
				if (this._modeDecimal) {
					sap.ui.getCore().byId("inpHoursPopover").setMaxLength(5);
				}
			}
			this._sDay = btnDay.data("day");

			// pongo el estilo al box seleccionado
			var css = this._oCalendar[this._sDay].error ? "cssBoxDaySelectError" : "cssBoxDaySelect";
			this._cmpCalendar[this._sDay].box.addStyleClass(css);

			// seteo el modelo de tipos de horas segun el dia seleccionado
			this._popoverDayCalendar.setModel(new sap.ui.model.json.JSONModel(this._getHoursTypeByDay(this._sDay)), "HoursTypeByDay");

			// cojo del modelo los datos del dia seleccionado y lo clono
			var dataDay = jQuery.extend(true, {}, {
				items: this._oCalendar[this._sDay].items
			});

			if (dataDay.items.length === 0) {
				// si no existen datos para el dia me creo uno vacio
				dataDay.items.push({
					IdProject: "",
					RecordedHours: "",
					Status: "",
					TypeHour: ""
				});
				this._btnAddRow.setEnabled(false);

			} else {
				this._btnAddRow.setEnabled(true);
			}

			// creo el model con los datos del dia y limpio los componentes del popover
			this._mDay = new sap.ui.model.json.JSONModel(dataDay);
			this._popoverDayCalendar.setModel(this._mDay, "mDay");

			// IRC Modificaciones expatriados
			if (userWork.DefaultHours === "HWHR") {
				this._filterForTypeHour();
			}

			if (isTouch) {
				this._popoverDayCalendar.setModal(true);
			}

			this._clearComponentsDay();

			// realizo validacion del total de horas del dia (para mostrar mensaje de error si no la pasa)
			this._checkPopoverTotalHours();

			// desactivo el boton de guardado
			this._btnFinish.setEnabled(false);

			// lo abro a partir del boton
			jQuery.sap.delayedCall(0, this, function () {
				this._popoverDayCalendar.openBy(btnDay);
			});
		},

		/**
		 * Metodo que se ejecuta siempre que se abre el popover del dia del calendario.
		 * Pone la variable de concurrencia _stopAfterCloseDayCalendar a false.
		 */
		afterOpenDayCalendar: function () {
			this._stopAfterCloseDayCalendar = false;
		},

		/**
		 * Cierra el popover day. Se ejecuta al pulsar la X del popover.
		 * Solo se utiliza cuando estamos en vista movil ya que solo en ese dispositivo aparece el icono para cerrar.
		 */
		onClosePopoverDay: function () {
			this._popoverDayCalendar.close();
		},

		/**
		 * Realiza un reseteo del estado de los componentes del popover del dia.
		 * Elimina el estilo de error del SearchField y quita el estado 'Warnning' o 'Error' de los inputs de horas.
		 */
		_clearComponentsDay: function () {
			var isNoTouch = this.getOwnerComponent().getModel("device").getProperty("/isSurfaceDesktop");
			if (isNoTouch) {
				var items = this._tableDayCalendar.getItems();
				for (var i = 0; i < items.length; i++) {
					var inpSearchField = items[i].getCells()[0].getItems()[0].getItems()[0];
					inpSearchField.removeStyleClass("searchFieldError");

					var oInput = items[i].getCells()[2];
					oInput.setValueState(ValueState.None);
					oInput.setShowValueStateMessage(false);
				}
			}
		},

		/**
		 * Valida que esten informadas correctamente todas las filas del popover del dia seleccionado.
		 */
		_validateDayCompleted: function () {
			var isNoTouch = this.getOwnerComponent().getModel("device").getProperty("/isSurfaceDesktop");
			if (isNoTouch) {
				var items = this._tableDayCalendar.getItems();
				for (var i = 0; i < items.length; i++) {
					var cells = items[i].getCells();

					// sap.m.VBox
					var inpSearchField = cells[0].getItems()[0].getItems()[0];
					if (!inpSearchField.getValue()) {
						return false;
					}
					// sap.m.ComboBox
					var cmbTypesHours = cells[1];
					if (!cmbTypesHours.getSelectedItem()) {
						return false;
					}
					// sap.m.Input
					var inpHours = cells[2];
					if (!inpHours.getValue() || inpHours.getValueState() === ValueState.Error) {
						return false;
					}
				}
			}
			return true;
		},

		_enabledButtonsDay: function (bEnabled) {
			this._btnAddRow.setEnabled(true);
			this._btnFinish.setEnabled(bEnabled);
		},

		/**
		 * Se ejecuta al seleccionar un tipo de hora del combo.
		 */
		onValidateCmbTypeHours: function (oEvent) {
			var oCombo = oEvent.getSource();
			var oInput = this._byId(oCombo.getAriaLabelledBy()[0]);
			// valido el input de horas por si las introducidas fueran superiores al maximo que permite el tipo de hora seleccionado
			this._validateInputHours(oInput);
		},

		/**
		 * Se ejecuta al modificar el valor del input de horas del popover day.
		 */
		onValidateInputHours: function (oEvent) {
			var oInput = oEvent.getSource();
			var oRow = oInput.getBindingContext("mDay").getObject();
			// se pasa al modelo para que la validacion (que se hace con el modelo) tenga disponible el nuevo valor
			oRow.RecordedHours = oInput.getValue();

			// ejecuto la funcion de validacion del input de horas (se comparte con el input de horas de la seleccion por rango)
			this._validateInputHours(oInput);
		},

		/**
		 * Se ejecuta al modificar el valor del input de horas del popover day.
		 */
		_validateInputHours: function (oInput) {
			var sValue = oInput.getValue();
			var fHoursMin = this._modeDecimal ? 0.01 : 1;

			// comprobamos si esta vacio
			if (!sValue) {
				oInput.setValueState(ValueState.None);
				oInput.setShowValueStateMessage(false);
				this._enabledButtonsDay(false);
				return;
			}

			if (this._modeDecimal) {
				// validacion de caracteres introducidos (no permite otra cosa que no sea numeros y el punto)
				if (!(new RegExp("^[0-9\.]*$")).test(sValue)) {
					oInput.setValue(oInput.getValue().substr(0, oInput.getValue().length - 1));
					oInput.setValueStateText("Character not allowed");
					oInput.setValueState(ValueState.Warning);
					oInput.setShowValueStateMessage(true);
					this._enabledButtonsDay(false);
					return;
				}
				// validacion del numero decimal
				if (!(new RegExp("^[0-9]+(\.[0-9]{0,2})?$")).test(sValue)) {
					oInput.setValueStateText("Wrong number");
					oInput.setValueState(ValueState.Error);
					oInput.setShowValueStateMessage(true);
					this._enabledButtonsDay(false);
					return;
				}

			} else {
				// validacion de caracteres introducidos (no permite otra cosa que no sea numeros)
				if (!(new RegExp("^[0-9]*$")).test(sValue)) {
					oInput.setValue(oInput.getValue().substr(0, oInput.getValue().length - 1));
					oInput.setValueStateText("Character not allowed");
					oInput.setValueState(ValueState.Warning);
					oInput.setShowValueStateMessage(true);
					this._enabledButtonsDay(false);
					return;
				}
			}

			// compruebo las horas minimas
			var fValue = parseFloat(sValue);
			if (fValue < fHoursMin) {
				oInput.setValueStateText("The value must be greater than " + fHoursMin);
				oInput.setValueState(ValueState.Warning);
				oInput.setShowValueStateMessage(true);
				this._enabledButtonsDay(false);
				return;
			}

			// si llega hasta aqui es que ha pasado todas las validaciones del propio Input de horas
			oInput.setValueState(ValueState.None);
			oInput.setShowValueStateMessage(false);

			// valido el resto de filas y campos del dia esten completados
			this._enabledButtonsDay(this._checkPopoverTotalHours() && this._validateDayCompleted());
		},

		/**
		 * Comprueba que el total de horas imputadas en el popover no excede de 24 ni del mÃ¡ximo para el tipo de hora seleccionado.
		 * Si no pasa alguna de las validaciones se muestra un mensaje en la cabecera del Popover mostrando el error.
		 */
		_checkPopoverTotalHours: function () {
			var itemsDay = this._mDay.getProperty("/items");

			// validamos limite total de horas del dia
			var sumHours = 0;
			for (var i = 0; i < itemsDay.length; i++) {
				sumHours += parseFloat(itemsDay[i].RecordedHours); // suma de horas totales
			}
			// IRC Modificaciones expatriados
			var userWork = this.getModelGlobalVars().getProperty("/UserWork");
			// Para expatriados tienen un maximo de 8 horas al dia, no 24 como los demas
			var maxHours = (userWork.DefaultHours === "HWHR") ? 8 : 24;

			if (sumHours > maxHours) {
				this._msgConfirmation.setVisible(true);
				this._msgConfirmation.setText("Maximum of " + maxHours + " hours in day");
				this._enabledButtonsDay(false);
				return false;
			}

			// validamos que no se sobrepasa el mÃ¡ximo para cada tipo de hora
			var weekday = this._oCalendar[this._sDay].festive ? "Festive" : this._oCalendar[this._sDay].weekday;

			var message = "";
			for (var key in this._mapHoursType) {
				if (key === "AllHourTypes") {
					continue;
				} // salto el tipo generico

				var iHoursMax = this._mapHoursType[key][weekday].MaxHours;
				var iHoursMin = this._mapHoursType[key][weekday].MinHours;
				sumHours = 0;
				for (i = 0; i < itemsDay.length; i++) {
					var item = itemsDay[i];
					// suma de horas por tipo
					if (item.TypeHour === key) {
						sumHours += item.RecordedHours ? parseFloat(item.RecordedHours) : 0;
					}
				}
				if (sumHours > iHoursMax) {
					message = "Maximum of " + iHoursMax + " hours in " + this._mapHoursType[key].Text;
					break; // rompe el bucle al encontrar el primer error
				} else {
					if (iHoursMin > 0 && sumHours > 0) {
						if (sumHours < iHoursMin) {
							message = "Minimum of " + iHoursMin + " hours in " + this._mapHoursType[key].Text;
							break; // rompe el bucle al encontrar el primer error
						}
					}
				}
			}
			if (message) {
				this._msgConfirmation.setVisible(true);
				this._msgConfirmation.setText(message);
				this._enabledButtonsDay(false);
				return false;
			}

			// si pasa ambas validaciones se oculta el mensaje de la cabecera
			this._msgConfirmation.setVisible(false);
			this._msgConfirmation.setText("");

			// validamos que todos los campos del modelo esten informados
			for (i = 0; i < itemsDay.length; i++) {
				if (!itemsDay[i].IdProject || !itemsDay[i].TypeHour || !itemsDay[i].RecordedHours) {
					return false;
				}
			}

			return true;
		},

		/**
		 * Borra el proyecto seleccionado en el momento en que se modifica algo en el input.
		 * NOTA: Se utiliza solo para los input del popover.
		 */
		onLiveChangeProjectPopover: function (oEvent) {
			// deshabilito el link para ver la info del proyecto
			var lnkInfoProject = this._byId(oEvent.getSource().getAriaDescribedBy()[0]);
			lnkInfoProject.setEnabled(false);
			this._projectSelectedDay = undefined;
			this._btnAddRow.setEnabled(false);
			this._btnFinish.setEnabled(false);
			// IRC Modificaciones expatriados
			var userWork = this.getModelGlobalVars().getProperty("/UserWork");
			if (userWork.DefaultHours === "HWHR") {
				// Quitamos el filtro por tipo de hora
				this._byId(oEvent.getSource().getAriaLabelledBy()[0]).getBinding("items").filter([]);
			}
			//Habilitamos el suggest
			var projectValue = oEvent.getSource().mProperties.value;
			if (projectValue.length > 8) {
				oEvent.getSource().setEnableSuggestions(true);
			}
		},

		/**
		 * Abre un dialog con la informaciÃ³n del proyecto seleccionado.
		 * NOTA: Se utiliza solo para el input del popover.
		 */
		onOpenProjectInfoPopover: function (oEvent) {
			var oRow = oEvent.getSource().getBindingContext("mDay").getObject();
			this._openProjectInfo(oRow.IdProject);
		},

		/**
		 * AÃ±ade una fila para seleccionar proyecto/horas en el popover del dia seleccionado.
		 */
		onAddRow: function () {
			// antes de hacer nada tengo que poner el foco en el popover
			// si no hago esto se cerrarÃ¡ el popover al trasladar el foco fuera del popover
			this._popoverDayCalendar.focus();

			this._mDay.getProperty("/items").push({
				IdProject: "",
				ProjectName: "",
				RecordedHours: "",
				Status: "",
				TypeHour: "NOH"
			});
			this._mDay.refresh(true);
			this._btnFinish.setEnabled(false);
			this._btnAddRow.setEnabled(false);
		},

		onDeleteRow: function (oEvent) {
			this._popoverDayCalendar.focus();

			// obtengo el numero de fila a eliminar
			var sPath = oEvent.getSource().getBindingContext("mDay").getPath();
			var index = sPath.split("/")[2];

			var rows = this._mDay.getProperty("/items");

			// borro la fila y refresco el modelo
			rows.splice(index, 1);
			this._mDay.refresh(true);

			if (rows.length === 0) {
				// si nos hemos quedado sin filas habilito los botones
				this._enabledButtonsDay(true);
			} else {
				// habilito los botones en funcion de la validacion de las horas
				this._enabledButtonsDay(this._checkPopoverTotalHours());
			}
		},

		/**
		 * Guarda la informacion que el usuario ha introducido en el popover del dia.
		 */
		onSetDay: function () {
			// Deshabilito el botÃ³n, ya que se han cambiado las horas y no sabemos si estÃ¡n bien
			this.byId("btnApprove").setEnabled(false);

			var items = this._mDay.getProperty("/items"); // obtengo todos los items del dia del popover
			this._oCalendar[this._sDay].items = []; // borro todos los que habia en el calendario

			// los aÃ±ado de esta forma para fusionar los items duplicados (mismo proyecto y tipo de hora)
			for (var i = 0; i < items.length; i++) {
				this._addItemToCalendar(items[i], this._sDay);
			}

			// quito error del dia del calendario si lo tuviera (es imposible que se guarde un dia desde aqui con un error)
			this._oCalendar[this._sDay].error = false;

			// cambio el valor mostrado en el dia del calendario y aplicamos brillo
			var sumHours = 0;
			items = this._oCalendar[this._sDay].items;
			for (i = 0; i < items.length; i++) {
				sumHours += parseFloat(items[i].RecordedHours);
			}
			this._cmpCalendar[this._sDay].btn.setText(sumHours);
			this._cmpCalendar[this._sDay].box.removeStyleClass("cssBoxDayErr"); // se borra por si la tenia
			this._cmpCalendar[this._sDay].box.addStyleClass("cssBoxDayMod");
			this._cmpCalendar[this._sDay].box.addStyleClass("animBrightnessDay");

			// cierro el popover
			this._popoverDayCalendar.close();

			// quito la clase del brillo tras un segundo con 2 decimas (tiempo de duracion de la animacion)
			var sDay = this._sDay;
			jQuery.sap.delayedCall(1200, this, function () {
				this._cmpCalendar[sDay].box.removeStyleClass("animBrightnessDay");
			});

			// actualiza el panel Summary
			this._reloadModelSummary();
			// habilitamos o deshabilitamos el boton de Approve segun validacion
			this.byId("btnApprove").setEnabled(this._checkPosibleApprove());
		},

		/**
		 * Metodo que se ejecuta siempre que se cierra el popover del dia del calendario.
		 * Elimina la clase del dia seleccionado siempre y cuando no se haya pulsado otro dia del calendario.
		 */
		afterCloseDayCalendar: function () {
			if (!this._stopAfterCloseDayCalendar) {
				this._clearCalendarSelection(); // limpiamos la seleccion actual del calendario por si la hay
			}
		},

		/******************************************************************/
		/*****    2.3 FUNCIONES PARA MOSTRAR CALENDARIO POR SEMANAS   *****/
		/******************************************************************/

		/**
		 * Pone el calendario en modo mes.
		 * Se ejecuta al pulsar sobre la pestaÃ±a Monthly del calendario.
		 */
		onMonthly: function () {
			this._modeWeek = false;

			// si se ha pasado por el modo semana con anterioridad se vuelven a mostrar todas las semanas
			if (this._oWeeks) {
				for (var num in this._oWeeks) {
					this._oWeeks[num].row.setVisible(true);
				}
			}
			// si el mes es el siguiente al actual se deshabilita el boton
			var oMonth = this.formatter.stringToDate(this._sMonth, "yyyyMM");
			this.byId("btnNext").setEnabled(new Date() >= oMonth && this._bDataOnNextMonth);

			// establezco el titulo del calendario (mes y aÃ±o)
			this.byId("monthTitle").setText(this.formatter.dateToString(oMonth, "MMMM yyyy"));

			// habilito pestaÃ±a de semana y deshabilito la del mes
			this.byId("lnkMonthly").addStyleClass("calendarChange");
			this.byId("lnkMonthly").setEnabled(false);
			this.byId("lnkWeekly").removeStyleClass("calendarChange");
			this.byId("lnkWeekly").setEnabled(true);
		},

		/**
		 * Pone el calendario en modo semana y muestra la primera.
		 * Se ejecuta al pulsar sobre la pestaÃ±a Weekly del calendario.
		 */
		onWeekly: function () {
			this._weekCurrent = 0;
			this._weekly();
		},

		/**
		 * Pone el calendario en modo semana.
		 */
		_weekly: function () {
			this._oWeeks = {};
			this._modeWeek = true;

			var rows = this._tableCalendar.getItems();
			for (var i = 0; i < rows.length; i++) {
				var cells = rows[i].getCells();

				var oWeek = {
					row: rows[i]
				};

				if (i === 0) {
					// entra aqui para la primera semana (primera fila de la tabla)
					oWeek.firstDay = "01";
					oWeek.lastDay = cells[6].getItems()[0].getText();

				} else if (i === (rows.length - 1)) {
					// entra aqui para la ultima semana (ultima fila de la tabla)
					oWeek.firstDay = cells[0].getItems()[0].getText();

					for (var j = cells.length - 1; j > 0; j--) {
						if (cells[j].getItems().length > 0) {
							oWeek.lastDay = cells[j].getItems()[0].getText();
							break;
						}
					}
					if (!oWeek.lastDay) {
						oWeek.lastDay = oWeek.firstDay;
					}
				} else {
					// entra aqui para todas las semanas entre la primera y la Ãºltima
					oWeek.firstDay = cells[0].getItems()[0].getText();
					oWeek.lastDay = cells[6].getItems()[0].getText();
				}
				this._oWeeks[i] = oWeek;
			}
			// habilito pestaÃ±a de mes y deshabilito la de semana
			this.byId("lnkMonthly").removeStyleClass("calendarChange");
			this.byId("lnkMonthly").setEnabled(true);
			this.byId("lnkWeekly").addStyleClass("calendarChange");
			this.byId("lnkWeekly").setEnabled(false);

			// se habilita el boton de proxima semana
			this.byId("btnNext").setEnabled(true);

			this._changeWeek();
		},

		/*
		 * Muestra la semana indicada.
		 */
		_changeWeek: function () {
			// si la 'semana actual' vale -1 significa que tenemos que mostrar la ultima semana del mes actual
			if (this._weekCurrent === -1) {
				this._weekCurrent = this._tableCalendar.getItems().length - 1;
			}
			// oculto todas las semanas excepto la seleccionada
			for (var num in this._oWeeks) {
				this._oWeeks[num].row.setVisible(parseInt(num, 10) === this._weekCurrent);
			}
			// pongo como titulo del calendario el periodo de la semana
			var nameMonth = this.formatter.dateToString(this.formatter.stringToDate(this._sMonth, "yyyyMM"), "MMM");
			var firstDay = this._oWeeks[this._weekCurrent].firstDay;
			var lastDay = this._oWeeks[this._weekCurrent].lastDay;

			if (firstDay === lastDay) {
				this.byId("monthTitle").setText(nameMonth + " " + firstDay);
			} else {
				this.byId("monthTitle").setText(nameMonth + " " + firstDay + " - " + nameMonth + " " + lastDay);
			}
		},

		/**********************************************/
		/*****    CONTROLES PARA PANEL SUMMARY    *****/
		/**********************************************/

		/**
		 * Habilita/deshabilita la posibilidad de eliminar un proyecto en el panel Summary.
		 */
		_enabledDeleteProjects: function (b) {
			this._mSummary.setProperty("/isRemovable", b && !this._modeDetail);
			this._mSummary.refresh(true);
		},

		/**
		 * Se ejecuta al seleccionar un proyecto del panel de Summary.
		 * Tiene doble funcionalidad en funciÃ³n de si estamos en modo de seleccion por rango o no.
		 */
		onSelectProjectSummary: function (oEvent) {
			var item = oEvent.getParameter("listItem");
			var object = item.getBindingContext("Summary").getObject();

			if (this._modeSelectRange) {
				// si esta en modo seleccion por rango ejecuta la funcion que selecciona los dias del proyecto para el guardado
				this._selectProjectDays(object);
			} else {
				// si NO esta en modo de seleccion por rango simplemente marca los dias del proyecto
				this._showProjectDays(object);
			}
		},

		/**
		 * Selecciona los dias del proyecto en modo de seleccion por rango para realizar el guardado.
		 * Es decir, realiza la misma funcionalidad que el metodo #_rangeSelection pero en vez de elegir un 
		 * rango de fechas se seleccionan las fechas del proyecto seleccionado.
		 */
		_selectProjectDays: function (object) {
			this._clearCalendarSelection();

			this._dataRangeSelection = {}; // objeto temporal que contendra los datos del rango seleccionado
			for (var key in this._oCalendar) {
				if (!this._oCalendar[key].edit) {
					continue; // si el dia no esta en modo edicion nos lo saltamos
				}
				var aDay = this._oCalendar[key].items;
				// recorre todos los items del dia buscando si alguno de ellos contiene el proyecto
				for (var i = 0; i < aDay.length; i++) {
					if (aDay[i].IdProject === object.IdProject && aDay[i].TypeHour === object.TypeHour) {
						// aÃ±ado el dia al objeto que utilizaremos para el guardado
						this._dataRangeSelection[key] = {
							IdProject: this._projectSelected.IdProject,
							ProjectName: this._projectSelected.ProjectName,
							RecordedHours: this._inpHours.getValue(),
							TypeHour: this._cmbTypesHours.getSelectedKey(),
							Status: ""
						};
						this._cmpCalendar[key].box.addStyleClass(this._oCalendar[key].error ? "cssBoxDaySelectError" : "cssBoxDaySelect");
						break;
					}
				}
			}
			// habilito el boton de guardado y limpio el primer dia seleccionado (por si lo hubiera)
			sap.ui.getCore().byId("btnFinishFooter").setEnabled(true);
			this._sDaySelect1 = undefined;
		},

		/**
		 * Marca en el calendario los dias que contengan horas incurridas al proyecto seleccionado.
		 */
		_showProjectDays: function (object) {
			if (this._projectSelectSummary === object.IdProject + "|" + object.TypeHour) {
				// entra aqui si el proyecto ya estaba seleccionado y por tanto se limpia
				this._clearCalendarSelection();
			} else {
				// entra aqui si el proyecto no estaba seleccionado
				this._clearCalendarSelection();

				this._projectSelectSummary = object.IdProject + "|" + object.TypeHour;
				for (var key in this._oCalendar) {
					var aDay = this._oCalendar[key].items;
					// marcamos solo los dias que tengan el proyecto seleccionado
					for (var i = 0; i < aDay.length; i++) {
						if (aDay[i].IdProject === object.IdProject && aDay[i].TypeHour === object.TypeHour) {
							this._cmpCalendar[key].box.addStyleClass(this._oCalendar[key].error ? "cssBoxDaySelectError" : "cssBoxDaySelect");
							break;
						}
					}
				}
			}
		},

		/**
		 * Borra todos las horas incurridas del mes al proyecto.
		 */
		onDeleteSolicitudActual: function (oEvent) {
			var dialog = new Dialog({
				title: "Atención",
				type: "Message",
				state: "Warning",
				content: new Text({
					text: "¿Eliminar registro?"
				}),
				beginButton: new Button({
					text: "Confirmar",
					press: function () {
						dialog.close();
						MessageToast.show("Registro eliminado!");
					}
				}),
				endButton: new Button({
					text: "Atrás",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});
			dialog.open();
		},

		onDeleteSolicitudAprobada: function (oEvent) {
			//aquí se envía la solicitud de anulación de un absentismo ya aprobado y por tomar.
			var dialog = new Dialog({
				title: "¿Enviar Solicitud de Anulación?",
				type: "Message",
				content: [
					new Label({
						text: "Se enviará una solicitud de anulación al Administrador",
						labelFor: "rejectDialogTextarea"
					}),
					new TextArea("rejectDialogTextarea", {
						width: "100%",
						placeholder: "Ingrese Motivo"
					})
				],
				beginButton: new Button({
					text: "Enviar",
					press: function () {
						MessageBox.success("Solicitud enviada correctamente!");
						dialog.close();
					}
				}),
				endButton: new Button({
					text: "Atrás",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
		},

		onApprove_: function () {
			//aquí se envía la solicitud de anulación de un absentismo ya aprobado y por tomar.
			var cboClase = this.byId("cboClase").getSelectedKey();
			if (cboClase === "") {
				MessageToast.show("Complete los campos requeridos");
			} else {
				var dialog = new Dialog({
					title: "¿Enviar Solicitud?",
					type: "Message",
					content: [
						new Label({
							text: "Se enviará la solicitud de absentismo al Administrador",
							labelFor: "rejectDialogTextarea"
						})
					],
					beginButton: new Button({
						text: "Enviar",
						press: function () {
							MessageBox.success("Solicitud enviada correctamente!");
							dialog.close();
						}
					}),
					endButton: new Button({
						text: "Atrás",
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();
					}
				});

				dialog.open();
			}

		},

		onDeleteProject: function (oEvent) {
			var oObject = oEvent.getSource().getBindingContext("Summary").getObject();
			var idProject = oObject.IdProject;
			var typeHour = oObject.TypeHour;

			// ponemos mensaje de confirmaciÃ³n
			var that = this;
			MessageBox.confirm("You will delete all the " + this._mapHoursType[typeHour].Text + " for the project " + idProject + " this month", {
				title: "Are you sure you want to delete it?",
				onClose: function (sResult) {
					if (sResult === MessageBox.Action.OK) {
						that._deleteProject(idProject, typeHour);
					}
				}
			});

		},

		_deleteProject: function (idProject, typeHour) {
			// Deshabilito el botÃ³n, ya que se han cambiado las horas y no sabemos si estÃ¡n bien
			this.byId("btnApprove").setEnabled(false);
			// limpio la seleccion del calendario por si hubiera
			this._clearCalendarSelection();

			var time = 80; // 80 milisegundos
			var timeTotal = 0;

			for (var sDay in this._oCalendar) {

				var aDay = this._oCalendar[sDay].items;
				var aDayMod = [],
					mod = false,
					hours = 0;

				// crea un nuevo array por dia descartando el proyecto / tipo de hora eliminado
				for (var i = 0; i < aDay.length; i++) {
					if (aDay[i].IdProject === idProject && aDay[i].TypeHour === typeHour) {
						mod = true;
					} else {
						aDayMod.push(aDay[i]);
						hours += parseFloat(aDay[i].RecordedHours);

					}
				}
				// si se ha modificado este dia se aÃ±ade al modelo y hacen los cambios en la vista
				if (mod) {
					this._oCalendar[sDay].items = aDayMod;
					var checkDay = this._paintDayCalendar(timeTotal, sDay, hours);
					this._oCalendar[sDay].error = !checkDay;
					timeTotal += time;
				}
			}
			// actualiza el panel Summary
			this._reloadModelSummary();

			// habilitamos o deshabilitamos el boton de Approve segun validacion
			this.byId("btnApprove").setEnabled(this._checkPosibleApprove());
		},

		_paintDayCalendar: function (time, sDay, hours) {
			// Aqui comprobaremos que las horas que se han introducido son corectas
			var bCheckDay = this._checkTotalHours(sDay);

			// seteo las horas en el dia del calendario y aplico clases con la animacion
			jQuery.sap.delayedCall(time, this, function () {
				this._cmpCalendar[sDay].btn.setText(hours);
				// Ponemos la clase de modificado o de error al pasar por el dÃ­a.
				if (bCheckDay) {
					this._cmpCalendar[sDay].box.addStyleClass("cssBoxDayMod");
					this._cmpCalendar[sDay].box.addStyleClass("animBrightnessDay");
					this._cmpCalendar[sDay].box.removeStyleClass("cssBoxDayErr");
				} else {
					this._cmpCalendar[sDay].box.addStyleClass("cssBoxDayErr");
					this._cmpCalendar[sDay].box.addStyleClass("animBrightnessDayErr");
					this._cmpCalendar[sDay].box.removeStyleClass("cssBoxDayMod");
				}
			});
			// cuando termina la animacion (1,2 seg) quito la clase que la aplicaba
			jQuery.sap.delayedCall(1200 + time, this, function () {
				this._cmpCalendar[sDay].box.removeStyleClass("animBrightnessDay");
				this._cmpCalendar[sDay].box.removeStyleClass("animBrightnessDayErr");
			});

			return bCheckDay;
		},

		/**
		 * Recupera lo tipos de hora para la imputacion
		 *	@param IdProject : Id del proyecto ( se utiliza solo para expatriados en la funciÃ³n )
		 *	@param sDate : Fecha del dia  ( se utiliza solo para expatriados en la funciÃ³n ) 
		 */
		_getTaskcompData: function (IdProject, sDate) {
			var userWork = this.getModelGlobalVars().getProperty("/UserWork");

			// Recuperamos los filtos
			var aFilters = [];
			aFilters.push(new Filter("IdEmployee", FilterOperator.EQ, userWork.IdEmployee));

			// Tanto IdProject como sDate aunque se mande para todos realmente solo se usa dentro de 
			// la funcion para los usuarios expatriados
			if (IdProject) {
				aFilters.push(new Filter("IdProject", FilterOperator.EQ, IdProject));
			}

			if (sDate) {
				aFilters.push(new Filter("Date", FilterOperator.EQ, sDate));
			}

			var that = this;
			// se crea el modelo del tipo de horas (solo se ejecuta cuando se crea la vista)
			this.getTimelaborOdataModel().read("/ZTS_F_TASKCOMPSet", {
				filters: aFilters,
				success: function (oData) {
					// IRC Modificaciones expatriados
					// Para Expatriado solo lo creo al principio, una vez que se pase el proyecto no, porque se recupera solo un dato desde Backend.
					if ((userWork.DefaultHours === "HWHR" && !IdProject) || userWork.DefaultHours === "NOH") {
						// creo el mapa de tipos de horas (muy importante para saber limites de horas por tipos de horas)
						that._mapHoursType = that._createMapHoursType(oData.results);
					}

					// seteo el modelo de tipos de horas solo para mostrar en el combo de Type Hours
					that.getOwnerComponent().setModel(new sap.ui.model.json.JSONModel(that._getHoursType()), "HoursType");

					// Recuperamos las horas a poner en el combo de tipos de hora
					// IRC 04/06/2018 - Para expatriados ponemos el Taskcomponent que venga en la funcion, para todos los demas el por defecto, para evitar que seleccione Extra Hours.
					//var defaultHours = (IdProject) ? oData.results[0].Taskcomponent : userWork.DefaultHours ;
					var defaultHours = (IdProject && userWork.DefaultHours === "HWHR") ? oData.results[0].Taskcomponent : userWork.DefaultHours;
					// si entra por aqui es que estamos en el search field 'inpSearchProjects' de la seleccion por rango
					if (that._inpSearchProjects.getId().indexOf("Popover") === -1) {
						// IRC Modificaciones expatriados
						if (userWork.DefaultHours === "HWHR" && IdProject) {
							// Filtramos por el tipo de hora
							that._cmbTypesHours.getBinding("items").filter(new Filter("Taskcomponent", FilterOperator.EQ, defaultHours));
						}
						// establezco el valor por defecto
						that._cmbTypesHours.setSelectedKey(defaultHours);
					} else {
						var oDayModel = new sap.ui.model.json.JSONModel(that._getHoursTypeByDay(that._sDay));
						// Seteo el modelo de tipos de horas segun el dia seleccionado
						that._popoverDayCalendar.setModel(oDayModel, "HoursTypeByDay");
						if (userWork.DefaultHours === "HWHR" && IdProject) {
							// Filtro por tipo de hora
							that._filterForTypeHour(defaultHours, IdProject);
						}

						// establezco el valor por defecto
						that._byId(that._inpSearchProjects.getAriaLabelledBy()[0]).setSelectedKey(defaultHours);
					}

					if (!IdProject) {
						// realizo la segunda carga de datos
						that._initOdataRequest2();
					}
				},
				error: this._oDataError.bind(this)
			});
		},

		// Funcion para cargar el search field que usa la funcion ZPS_F_SEARCHPROJECTSet ( solo el de la cabecera )
		_loadItemsSearchProjects: function () {
			this._inpSearchProjects.bindAggregation("suggestionItems", {
				path: "PROJECTS1>/ZPS_F_SEARCHPROJECTSet",
				template: new sap.m.SuggestionItem({
					key: "{PROJECTS1>IdProject}",
					text: "{= ${PROJECTS1>IdProject} +' - '+${PROJECTS1>ProjectName}}"
				})
			});
		},

		/**
		 * Recupera cada uno de los combos de Tipo de Hora de la tabla del popup del dia y los filtra por el valor que tiene guardado
		 *	@param sTypeHour : Tipo de hora para filtrar
		 *  @param sIdProject : Projecto seleccionado en el combo asociado.
		 */
		_filterForTypeHour: function (sTypeHour, sIdProject) {
			// Recuperamos todos los elementos de la tabla
			var _DOMitems = this._tableDayCalendar.getItems();
			var _dayItems = this._mDay.getData().items;
			//Iteramos por los elementos para ir filtrando en cada combo por su elemento seleccionado
			for (var i = 0; i < _dayItems.length; i++) {
				// Recuperamos el combo de tipos de hora ( es la celda 2 del item i de la tabla)
				var _DOMitem = _DOMitems[i].mAggregations.cells[1];
				// Si tenemos un proyecto y coincide con alguno dela lista, ponemos el tipo de hora que venga como parametro
				var _typeHour = (sIdProject && _dayItems[i].IdProject === sIdProject) ? sTypeHour : _dayItems[i].TypeHour;
				if (_typeHour !== "") {
					// Filtramos por el tipo de hora especifica ( si existe alguna)
					_DOMitem.getBinding("items").filter(new Filter("Taskcomponent", FilterOperator.EQ, _typeHour));
				} else {
					// Si nos lega vacio dejamos el combo filtrado por el valor por defecto pero con todos los datos.
					var userDefaultHours = this.getModelGlobalVars().getProperty("/UserWork/DefaultHours");
					_DOMitem.setSelectedKey(userDefaultHours);
				}
			}
		}

	});

});