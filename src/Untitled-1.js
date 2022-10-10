/*global gs:true*/
sap.ui.define([
	"jquery.sap.global",
	"sap/m/MessageBox",
	"sap/ui/core/mvc/Controller",
	"gs/fin/runstatutoryreports/s1/controller/BaseController",
	"gs/fin/runstatutoryreports/s1/util/ServiceMetadata",
	"sap/ui/core/BusyIndicator",
	"sap/ui/model/json/JSONModel",
	"gs/fin/runstatutoryreports/s1/util/MessageHandler",
	"sap/ui/model/Filter",
	"sap/ui/core/Element",
	"sap/ui/model/Sorter",
	"gs/fin/runstatutoryreports/s1/util/formatter",
	"sap/ui/model/Context",
	"sap/ui/model/odata/type/Date",
	"sap/ui/model/odata/type/Decimal",
	"sap/ui/model/type/Currency",
	"sap/ui/model/type/Integer",
	"sap/ui/model/odata/type/Int64",
	"sap/ui/model/odata/type/String",
	"sap/ui/layout/form/Form",
	"sap/ui/layout/form/ResponsiveGridLayout",
	"sap/ui/layout/form/FormContainer",
	"sap/ui/layout/form/FormElement",
	"sap/ui/core/CustomData",
	"sap/ui/table/Table",
	"sap/ui/table/Column",
	"sap/m/OverflowToolbarButton",
	"sap/m/ObjectStatus",
	"sap/m/VBox",
	"sap/m/ToolbarSpacer",
	"sap/m/DatePicker",
	"sap/m/Toolbar",
	"sap/m/Panel",
	"sap/m/Button",
	"sap/m/Title",
	"sap/m/Text",
	"sap/m/Label",
	"sap/m/Input",
	"sap/m/Link",
	"sap/ui/export/Spreadsheet",
	"sap/ui/table/TablePersoController",
	"sap/m/HBox",
	"sap/m/Dialog",
	"sap/ui/thirdparty/bignumber",
	"gs/fin/runstatutoryreports/s1/util/Workflow",
	"sap/ui/core/Fragment",
	"sap/ui/core/Title",
	"gs/fin/runstatutoryreports/s1/util/Constants",
	"sap/m/Select",
	"gs/fin/runstatutoryreports/s1/custom/customDecimal",
	"gs/fin/runstatutoryreports/s1/custom/customString",
	"gs/fin/runstatutoryreports/s1/util/VariantManagement",
	"gs/fin/runstatutoryreports/s1/util/SearchHelp",
	"gs/fin/runstatutoryreports/s1/util/Common",
	"sap/ui/core/MessageType",
	"../util/PreviewErrorWarning"
], function (jQuery, MessageBox, Controller, BaseController, ServiceMetadata, BusyIndicator, JSONModel, MessageHandler, Filter,
	Element, Sorter, formatter, Context, DateType, DecimalType, CurrencyType, IntegerType, Integer64Type, StringType, Form,
	ResponsiveGridLayout, FormContainer,
	FormElement, CustomData,
	Table, Column, OverflowToolbarButton, ObjectStatus, VBox, ToolbarSpacer, DatePicker, Toolbar, Panel, Button, Title, Text, Label, Input,
	Link, Spreadsheet, TablePersoController, HBox, Dialog, Bignumber, Workflow, Fragment, CoreTitle, Constants, Select, customDecimalType,
	customStringType, VariantManagement, SearchHelp, Common, MessageType, PreviewErrorWarning) {
	"use strict";
	return BaseController.extend("gs.fin.runstatutoryreports.s1.controller.Visualization", {
		formatter: formatter,
		VariantManagement: VariantManagement,
		onInit: function () {
			var oView = this.getView();
			this.getRouter().getRoute("Visualization").attachPatternMatched(this._onRoutePatternMatched, this);
			this._setInitalJosnModel();
			oView.setModel(new JSONModel([]), "messageModel");
			//This model is used to display the effected elements on currency change
			oView.setModel(new JSONModel([]), "referencedElementModel");
			this.oFlexibleColumnLayout = this.byId("PreviewFCL");
			this.variantEventAttach();

			this._oDataPrevPage = this.byId("DataPrevPage");

			// var oPreviewModel = new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/SAP/ZADM_SRF_REPORTING_TASK_SRV_01/");
			// ZService of preview for large file view setting
			// this.getView().setModel(oPreviewModel, "PreviewModel");
		},

		variantEventAttach: function () {
			var oVariantManagement = this.getView().byId("BeginPages--BeginVariantManagement");
			oVariantManagement.attachManage(this.VariantManagement.onManageVariant.bind(VariantManagement));
			oVariantManagement.attachSelect(this.VariantManagement.onSelectVariant.bind(VariantManagement));
			oVariantManagement.attachSave(this.VariantManagement.onSaveAsVariant.bind(VariantManagement));
		},

		onBack: function () {
			var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
			if (oGlobalVariablesModel.getProperty("/aChangedElements").length > 0) {
				this._displayConfirmationMessage(this.getResourceBundle().getText("xmsg.dialog.unsavedChangesLost"), this._navBackAndClearScreen
					.bind(
						this),
					function () {});
			} else {
				if (this._oMessagePopover) {
					this._oMessagePopover.oldMessages = 0;
				}
				this._navBackAndClearScreen();
			}
		},

		_setInitalJosnModel: function () {
			var oStructuredData = {
				bHasEditAuth: false,
				editable: false,
				isMetadataProcessed: false,
				isInitialGenDataAvailable: false,
				roots: [],
				details: {
					controls: []
				}
			};
			this.getView().setModel(new JSONModel(oStructuredData), "structuredDataModel");
		},

		_onRoutePatternMatched: function (oEvent) {
			//code for placeholder
			if (!this._oPlaceholderContainer) {
				this._oPlaceholderContainer = oEvent.getParameter("targetControl");
			}
			//code for placeholder
			var oView = this.getView();
			var oCurrencyList = {
				aCommonData: []
			};
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerObject(oView, false);
			oMessageManager.removeAllMessages();
			this.getView().getModel("messageModel").setData([]);
			this._setInitalJosnModel();
			BusyIndicator.show(0);
			// oView.getModel("structuredDataModel").setProperty("/editable", false);
			oView.setModel(new JSONModel(oCurrencyList), "currencyModel");
			oView.setModel(new JSONModel({
				"HierarchyCountLoaded": false,
				"Messages": {}
			}), "GlobalErrorWarningLog");

			var oArguments = oEvent.getParameter("arguments"),
				documentPath = decodeURIComponent(oArguments.documentPath),
				oModel = this.getView().getModel();

			if (this.getView().getModel().oData.hasOwnProperty(documentPath.split("/")[1])) {
				this.loadDependentRefData(documentPath);
			} else {
				oModel.createBindingContext(documentPath, new sap.ui.model.Context(oModel, documentPath), null,
					jQuery.proxy(function (oResp, oErr) {
						if (oResp) {
							this.loadDependentRefData(documentPath);
						}
					}.bind(this)),
					true);
			}

		},

		getRelativetPath: function (oEvent) {
			var aRelativePathsElements = {};
			var iExpandToLevel = 1;
			var aElements = oEvent.getItems().map(function (oNode) {
				var oNodeData = oNode.getBindingContext("structuredDataModel").getObject();
				var sElementId = oNodeData.OrdinalNumber ? oNodeData.ElementId + "_" + oNodeData.OrdinalNumber : oNodeData.ElementId;
				aRelativePathsElements[sElementId] = oNode.getBindingContextPath();
				if (oNode.getBindingContextPath().split("/controls/").length > iExpandToLevel) {
					iExpandToLevel = oNode.getBindingContextPath().split("/controls/").length;
				}
			});
			VariantManagement.oVariantDetails.VMControl.getModel("VariantModel").setProperty("/ExpandToLevel", iExpandToLevel);
			this.getView().getModel("GlobalVariables").setProperty("/RelativePathElements", aRelativePathsElements);
		},

		loadDependentRefData: function (documentPath) {
			this.getReferenceObjects(documentPath, "VizChangeLog").then(function () {
				var oRefModel = this.getOwnerComponent().getModel("RefModel");
				var oArgs = {
					documentPath: documentPath,
					runPath: "/ReportRunSet(guid'" + oRefModel.getProperty("/ReportRunSet/Key") + "')",
					activityPhase: "/ReportingActivitySet(guid'" + oRefModel.getProperty("/ReportingActivitySet/Key") + "')",
					taskPath: "/ReportingTaskSet(guid'" + oRefModel.getProperty("/ReportingTaskSet/Key") + "')",
					parentKey: oRefModel.getProperty("/ReportRunDocumentSet/ParentKey"),
					reportingPath: documentPath,
					refDocName: oRefModel.getProperty("/ReportRunDocumentSet/ReferenceDocumentId") !== "" ? oRefModel.getProperty(
						"/ReportRunDocumentSet/Name") : ""
				};
				this.renderVisualizationScreen(oArgs);
				//code for placeholder
				if (this._oPlaceholderContainer) {
					this._oPlaceholderContainer.hidePlaceholder();
				}
				//code for placeholder
			}.bind(this));
		},

		renderVisualizationScreen: function (oArguments) {
			//Preparing ParamModel

			var oTask = this.getView().getModel().getObject(oArguments.taskPath);
			var oParamData = {
				"repCatId": oTask.RepCatId,
				"repEntity": oTask.ReportingEntity,
				"country": oTask.Country,
				"documentPath": decodeURIComponent(oArguments.documentPath),
				"reportId": this.getView().getModel().getObject(oArguments.runPath).ReportId,
				"reportingPeriod": gs.fin.runstatutoryreports.s1.util.formatter.formatHeaderPeriodText(oTask.ReportingPeriodText, oTask.BeginOfPeriod,
					oTask
					.EndOfPeriod),
				"reportingYear": oTask.ReportingYear,
				"reportingEntityName": oTask.ReportingEntityName ? oTask.ReportingEntityName : oTask.ReportingEntity,
				"key": this.getView().getModel().getObject(decodeURIComponent(oArguments.documentPath)).Key,
				"parentKey": decodeURIComponent(oArguments.parentKey),
				"activityStatus": this.getView().getModel().getObject(decodeURIComponent(oArguments.activityPhase)).ActivityStatus,
				"activityPhaseText": this.getView().getModel().getObject(decodeURIComponent(oArguments.activityPhase)).ActivityPhaseText,
				"documentId": this.getView().getModel().getObject(decodeURIComponent(oArguments.documentPath)).DocumentId,
				"refDocName": decodeURIComponent(oArguments.refDocName)
			};

			var oParamModel = new JSONModel(oParamData);
			this.getView().setModel(oParamModel, "paramModel");
			this._readInitialData();
			this._readValueHelpMeatadata();
			this._setGobalVariableModel(this.getView());
			var oList = this.getView().byId("BeginPages--DPNestedTree");
			var oVariantManagement = this.getView().byId("BeginPages--BeginVariantManagement");
			VariantManagement.initializeVariant({
				"List": oList,
				"Variant": oVariantManagement,
				"UUID": oParamData.reportId + "_" + oParamData.documentId,
				"Controller": this
			});
			sap.ui.Device.resize.attachHandler(function () {
				this.onCloseHierarchyPress();
			}, this);
		},

		_navBackAndClearScreen: function () {
			//Removing previous data
			// var oParentVBox = this.getView().getContent()[0].getContent()[0].getPages()[0].getSections()[0].getSubSections()[0].getBlocks()[
			// 	0];
			// oParentVBox.removeAllItems();
			// oParentVBox.unbindAggregation("items", true);
			window.history.go(-1);
		},

		_readInitialData: function (sFrom) {
			var oView = this.getView();
			var oParamData = oView.getModel("paramModel").getData();
			var oModel = oView.getModel();
			if (oParamData.repCatId === "DP_WITH_ADD_DELETE") {
				oModel = oView.getModel();
			}
			var sReportRunPath = "/ReportRunSet(guid'" + oParamData.parentKey + "')";
			var sDocumentPath = "/ReportRunDocumentSet(guid'" + oParamData.key + "')";
			var sChangeLogPath = sDocumentPath + "/GeneratedDocumentDataLog";
			var sGeneratedPath = sDocumentPath + "/GeneratedDocumentData?$orderby=SequenceNo";
			oModel.setDeferredGroups(["readDocument", "saveDocument"]);
			var bHasAllData = false;
			// var bHasTypeInfoFunImport = ServiceMetadata.getFunctionImportMetadata(oModel, "GetSchemaTypeInfo") !== null;

			var bHasTypeInfoFunImport = false;
			var aModelNames = [];
			oModel.read(sChangeLogPath, {
				groupId: "readDocument",
				urlParameters: {
					'$select': 'ChangedByName,ParentElementId,ChangeIndicator,IsSingleValuedLeafElement,Key,ReportingEntity,ParentKey,RepCatId,ReportRunId,RootKey,DocumentId,RepRunDataKey,DocumentName,ElementId,AttributeId,SequenceNo,ParentSeqNo,OldValue,NewValue,Comments,ChangedBy,ChangedOn'
				}
			});
			aModelNames.push("ChangeLogModel");
			oModel.read(sDocumentPath, {
				groupId: "readDocument"
			});
			aModelNames.push("DocumentData");
			oModel.read(sReportRunPath, {
				groupId: "readDocument"
			});
			aModelNames.push("ReportRunDataModel");
			if (sFrom !== 'save' && sFrom !== 'regenerate') {
				oModel.callFunction("/GetElementsAndAttributes", {
					method: "GET",
					urlParameters: {
						DocumentUUID: oParamData.key,
						ReportId: oParamData.reportId,
						DocumentId: oParamData.documentId
					},
					groupId: "readDocument"
				});
				aModelNames.push("SchemaMetaData");
				// oModel.read(sGeneratedPath, {
				// 	groupId: "readDocument"
				// });
				// aModelNames.push("DocumentData");
				var oParamData = oView.getModel("paramModel").getData();
				if (bHasTypeInfoFunImport && oParamData.repCatId !== "DP_WITH_ADD_DELETE") { //DP_WITH_ADD_DELETE === OPA entity
					oModel.callFunction("/GetSchemaTypeInfo", {
						method: "GET",
						urlParameters: {
							ReportId: oParamData.reportId,
							DocumentId: oParamData.documentId
						},
						groupId: "readDocument"
					});
					aModelNames.push("ElementTypeData");
				}
			}
			oModel.submitChanges({
				groupId: "readDocument",
				success: jQuery.proxy(function (oResult) {
					var aBatchResponses = oResult.__batchResponses;

					aBatchResponses.forEach(function (oResponse, idx) {
						var oResponseData = oResponse.data.results ? oResponse.data.results : oResponse.data;
						oView.setModel(new JSONModel(oResponseData), aModelNames[idx]);
					});

					if (aModelNames.indexOf("ElementTypeData") === -1) {
						oView.setModel(new JSONModel([]), "ElementTypeData");
					}

					// Setting View header data model
					var oDocumentData = aBatchResponses[1].data;
					var oReportRunData = aBatchResponses[2].data;
					this._setHeaderDataModel(oDocumentData, oReportRunData, oParamData, oView);

					// Rearrange data to hierarchy based in schema
					this._constructHierarchyData();

					// check Edit Authorizations
					this._checkAuthorization(oDocumentData, oParamData);
				}, this),
				error: function (oError) {
					MessageHandler.showErrorMessage(oError);
				}
			});

		},

		_readValueHelpMeatadata: function () {
			var oView = this.getView();
			var oParamData = oView.getModel("paramModel").getData();
			var oModel = oView.getModel();
			var bHasValueHelpMetadataFunImport = ServiceMetadata.getFunctionImportMetadata(oModel, "GetValuHelpMetadataForPreview") !== null;
			// oView.setModel(new JSONModel([]), "AdditionalMetadata");
			var oStructuredDataModel = oView.getModel("structuredDataModel");
			if (bHasValueHelpMetadataFunImport) {
				oModel.callFunction("/GetValuHelpMetadataForPreview", {
					method: "GET",
					urlParameters: {
						DocumentUUID: oParamData.key,
						ReportId: oParamData.reportId,
						DocumentId: oParamData.documentId
					},
					groupId: "readDocument"
				});
				oModel.submitChanges({
					groupId: "readDocument",
					success: jQuery.proxy(function (oResult) {
						var aBatchResponses = oResult.__batchResponses;
						var oResponseData = aBatchResponses[0].data.results;
						oView.setModel(new JSONModel(oResponseData), "AdditionalMetadata");
						if (oStructuredDataModel.getProperty("/isInitialGenDataAvailable")) {
							this._updateAdditionalMetadata();
							this._readGenDataSuccess(oStructuredDataModel.getProperty("/generatedDataParams"));
						}
					}, this),
					error: function (oError) {
						MessageHandler.showErrorMessage(oError);
					}
				});
			} else {
				oView.setModel(new JSONModel([]), "AdditionalMetadata");
				oStructuredDataModel.setProperty("/isMetadataProcessed", true);
			}
		},

		_updateAdditionalMetadata: function () {
			var oView = this.getView();
			var oAddMetadataById = {};
			var oMetadataModel = oView.getModel("MetadataById");
			var oNodes = oMetadataModel.getObject("/nodes");
			var oAttributes = oMetadataModel.getObject("/attributes");
			// var aAdditionalMetadata = oView.getModel("AdditionalMetadata").getData();
			var oAddMetadataModel = oView.getModel("AdditionalMetadata");
			var aAddMetadataInfo = oAddMetadataModel.getData();
			aAddMetadataInfo.forEach(function (oCurrentElement, idx) {
				oAddMetadataById[oCurrentElement.ElementId + oCurrentElement.AttributeId] = oCurrentElement;
			});
			oMetadataModel.setProperty("/additionalMetadataById", oAddMetadataById);
			var aNodeKeys = Object.keys(oNodes);
			var aAttributeKeys = Object.keys(oAttributes);
			for (var i = 0; i < aNodeKeys.length; i++) {
				var oElement = oNodes[aNodeKeys[i]];
				this._getAdditionalMetadataInfo(oElement, oAddMetadataById[oElement.ElementId + oElement.AttributeId]);
			}
			for (var j = 0; j < aAttributeKeys.length; j++) {
				var oElement = oAttributes[aAttributeKeys[j]];
				this._getAdditionalMetadataInfo(oElement, oAddMetadataById[oElement.ElementId + oElement.AttributeId]);
			}
			oView.getModel("structuredDataModel").setProperty("/isMetadataProcessed", true);
		},

		//Preparing model for global variables
		_setGobalVariableModel: function (oView) {
			var oData = {
				"aChangedElements": [],
				"aSavedChanges": [],
				"aAttributeMetadata": [],
				"aAttributeGeneratedData": [],
				"aReferenceNumbers": [],
				"aRootElements": [],
				"aPanels": [],
				"oTableTotals": {},
				"RelativePathElements": {}
			};
			oView.setModel(new JSONModel(oData), "GlobalVariables");
		},

		_setHeaderDataModel: function (oDocumentData, oReportRunData, oParamData, oView) {
			var oHeaderData = {
				documentName: oParamData.refDocName ? oParamData.refDocName : oDocumentData.Name,
				reportingEntityName: oParamData.reportingEntityName,
				reportName: oReportRunData.ReportDescription,
				createdByName: oReportRunData.CreatedByName,
				reportRunStatusText: oReportRunData.ReportRunStatusText,
				reportingPeriod: oParamData.reportingPeriod,
				reportingYear: oParamData.reportingYear,
				reportRunStatus: oReportRunData.ReportRunStatus,
				activityPhaseText: oParamData.activityPhaseText
			};
			oView.setModel(new JSONModel(oHeaderData), "headerDataModel");
		},

		_checkAuthorization: function (oDocumentData, oParamData) {
			var oView = this.getView();
			var oStructuredDataModel = oView.getModel("structuredDataModel");
			var sActivityStatus = oParamData.activityStatus;
			var sDocStatus = oDocumentData.Status;
			var sDocVisualization = oDocumentData.DocumentVisualization;
			oStructuredDataModel.setProperty('/sDocumentFormat', oDocumentData.DocumentFormat);
			if (sDocVisualization === "ADJ" && sDocStatus !== "SOK") {
				this._setAuthorization();
			} else {
				oStructuredDataModel.setProperty('/bHasEditAuth', false);
			}
		},

		_setModelPropertyChange: function () {
			var that = this;
			var oView = this.getView();
			var oStructuredDataModel = oView.getModel("structuredDataModel");
			oStructuredDataModel.attachPropertyChange(function (oEvent) {
				var oCtx = oEvent.getParameter("context");
				//If change is triggered because of hierarchy node selection or search or table filterKey
				if (oCtx.sPath.indexOf("NewRowContext") !== -1 || oEvent.getParameter("path").indexOf("MessageText") !== -1 || oEvent.getParameter(
						"path") === "selected" || oEvent.getParameter("path") === "searchString" || oEvent.getParameter("path") === "filterKey") {
					return;
				}
				var oGlobalVariablesModel = oView.getModel("GlobalVariables");
				var aChangedElementsModelEvents = oGlobalVariablesModel.getProperty("/aChangedElements");
				var oCtxObject = oCtx.getObject();
				var sPath = oEvent.getParameter("path");
				// In case of table getting, displayValue
				var oTableCellObject = oCtx.getObject(sPath.split("/")[0]);
				var bIsFormValue = false;
				var bIsTableOrCurrencyValue = false;
				/* If this change is on Currency Key field, update currency key field data object ChangeIndicator
                	if oTableCellObject is string - form element
                    if oTableCellObject is object - table cell
                */
				// Added null check as input control getValue is returning null instead of empty string
				if (typeof oTableCellObject !== "object" || oTableCellObject === null) { //Form value
					oTableCellObject = oEvent.getParameter("value");
					bIsFormValue = true;
				} else { // currency/Table value
					oTableCellObject.displayValue = oEvent.getParameter("value");
					bIsTableOrCurrencyValue = true;
				}

				if (oCtx.sPath.indexOf("NewRowContext") !== -1) {
					return;
				}
				//Todo - apply formatter on Modified & Generated values and compare
				// 1. When the element is saved as UM (We can figure this out from the GeneratedDocumentDataLog), then never remove the change indicator (always warning state)
				// 2. WHen the element is changed for the first time and it's not saved, then when the user goes back to the generated value
				//  then remove the changeIndicator and remove that element from the aChangedElements( to avoid saving)

				// ChangedByName -  we get this property from the change log
				var isElementToBeSavedFirstTime = oCtxObject.ChangedByName === undefined;

				if (bIsFormValue && (isElementToBeSavedFirstTime && oCtxObject.displayValue === oCtxObject.GeneratedValue)) {
					oCtxObject.ChangeIndicator = "";
					this.checkIfElementExistsInChangedElements(sPath, oCtx, true);
					//updateTotal will be there for table currecny change confirmation no press
				} else if (bIsTableOrCurrencyValue && (isElementToBeSavedFirstTime && oTableCellObject.displayValue === oTableCellObject.GeneratedValue)) {
					oTableCellObject.ChangeIndicator = "";
					this.checkIfElementExistsInChangedElements(sPath, oCtx, true);
				} else {
					//checking changed element already exists in aChangedElement.
					// if exist just update the new ModifiedValue
					var iChangedEvtIdx;
					var bChangedEventAlreadyExist = this.checkIfElementExistsInChangedElements(sPath, oCtx);
					var oNewChangedEvent = {};
					//if oCtx object contains displayValue = form else table
					/* table currency change will trigger property change event, as this will be triggered on reverting currency change,
					this should not be inserted as a change.
                    
					For table & form currencykey dataObj is oCtxObj */
					if (!bChangedEventAlreadyExist) {
						oNewChangedEvent = {
							context: oCtx,
							path: sPath,
							dataObj: oCtxObject.displayValue !== undefined && sPath.indexOf("currencyData") === -1 ? oCtxObject : oCtx.getObject(
								sPath
								.split(
									"/")[0])
						};
						aChangedElementsModelEvents.push(oNewChangedEvent);
						if (!oNewChangedEvent.newChange) {
							oNewChangedEvent.newChange = oNewChangedEvent.dataObj.ChangeIndicator === "UM" ? false : true;
						}
						// Updating Old values for tooltip
						oNewChangedEvent.dataObj.ChangedBy = sap.ushell.Container.getUser().getId();
						//onLoadLastModifiedValue used for reverting old value on cancel press
						oNewChangedEvent.dataObj.onLoadLastModifiedValue = oNewChangedEvent.dataObj.OldValue;
						if (oNewChangedEvent.dataObj.ChangeIndicator === "UM") {
							oNewChangedEvent.dataObj.OldValue = oNewChangedEvent.dataObj.ModifiedValue;
						} else {
							oNewChangedEvent.dataObj.OldValue = oNewChangedEvent.dataObj.GeneratedValue;
						}
						// Updating ChangeIndicator 
						oNewChangedEvent.dataObj.ChangeIndicator = "UM";
						//oNewChangedEvent.dataObj.MessageSeverity = "";
					}
					// For Date control, reverting model value to YYYYMMDD
					if (sPath.split('/').length > 1) { //=table
						if (oCtx.getObject(sPath.split('/')[0]).typeInfo.XsdBuiltInType === 'date') {
							oCtx.getModel().setProperty(oCtx.sPath + '/' + sPath, oCtxObject[sPath.split("/")[0]].displayValue.split("-").join(""));
						}
					} else { //=form
						if (oCtxObject.typeInfo.XsdBuiltInType === 'date') {
							oCtxObject.displayValue = oCtxObject.displayValue.split("-").join("");
						}
					}
					// /********* Updating/showing currency column totals *********/
					var aCtxpaths = oCtx.getPath().split("/");
					if (bIsTableOrCurrencyValue) {
						aCtxpaths.splice(aCtxpaths.length - 2, 2);
						var oTableContext = oCtx.getObject(aCtxpaths.join("/"));
						var oTotalRow = oTableContext.totalRow;
						if (oTotalRow && oTotalRow["E" + oTableCellObject.ElementId]) {
							this._updateTotalsAfterCalculation(oTotalRow, oTableCellObject, "add");
						}
					}
					// var sCurrencyColumnBindingPath = sPath.split("/")[0];
					// var sCurrencyKeyBindingPath = sCurrencyColumnBindingPath.indexOf("_Currency") > -1 ? sCurrencyColumnBindingPath :
					// 	sCurrencyColumnBindingPath + "_Currency";
					// if (oCtx.getObject(sCurrencyKeyBindingPath)) { //CurrencyKey Object is available
					// 	var aTableDataPathSplit = oCtx.sPath.split("/");
					// 	// Removing the data index from pathSplit
					// 	aTableDataPathSplit.splice(aTableDataPathSplit.length - 1, 1);
					// 	var sTableDataPath = aTableDataPathSplit.join("/");
					// 	var aTableData = oCtx.getModel().getObject(sTableDataPath);
					// 	aTableDataPathSplit.splice(aTableDataPathSplit.length - 1, 1);
					// 	var sTableControlDataPath = aTableDataPathSplit.join("/");
					// 	var oTableControlData = oCtx.getModel().getObject(sTableControlDataPath);

					// 	// Always last object will be the Totals object
					// 	var oTotalsRowData = oTableControlData.oTotalsObject;

					// 	// Finding CurrencyKeys from TotalsRowData object
					// 	var aCurrencyKeys = Object.keys(oTotalsRowData).filter(function (sCurrencyKey) {
					// 		return sCurrencyKey.indexOf("_Currency") > -1;
					// 	});
					// 	//Finding currencyData objects in the changed column, which matches currencyKey values of Changed cell currencyKey value
					// 	var aUniqueCurrencyKeyData = jQuery.grep(aTableData, function (oRowData, idx) {
					// 		if (oTableControlData.generatedData.length !== idx) {
					// 			return oRowData[sCurrencyKeyBindingPath].displayValue === aTableData[0][sCurrencyKeyBindingPath].displayValue;
					// 		}
					// 	});
					// 	/*If aUniqueCurrencyKeyData length matches with the TableData length (except totals object), this means there is no currencyKey difference. Then show the totals.
					// 	If they don't match, that means column has more than one currencyKeys. Then don't show the totals*/
					// 	var bShowTotals = aUniqueCurrencyKeyData.length === oTableControlData.generatedData.length;

					// 	// Recalculting totals 
					// 	var iTotal = new Bignumber(0);
					// 	/*If sCurrencyKeyBindingPath and sCurrencyColumnBindingPath are not same, that means this event triggered on change of Currency value not currencyKey.
					// 	Then, we need to recalculate the totals*/
					// 	if (sCurrencyKeyBindingPath !== sCurrencyColumnBindingPath) {
					// 		aTableData.map(function (oRowData, idx) {
					// 			// Ignoring Totals(last index) in recalculation
					// 			if (oTableControlData.generatedData.length !== idx) {
					// 				iTotal = iTotal.plus(oRowData[sCurrencyColumnBindingPath].displayValue.length !== 0 ? oRowData[sCurrencyColumnBindingPath]
					// 					.displayValue : 0);
					// 			} else {
					// 				// For totalsObj update displayValue with calculated totals
					// 				oTotalsRowData[sCurrencyColumnBindingPath].displayValue = iTotal.toString();
					// 			}
					// 		});
					// 	} else {
					// 		/*If change happened on CurrencyKey, Update the totals visibility & currencyKey values*/
					// 		oTotalsRowData[sCurrencyColumnBindingPath.split("_Currency")[0]].bShowTotals = bShowTotals;
					// 		oTotalsRowData[sCurrencyColumnBindingPath].displayValue = oEvent.getParameter("value");
					// 		// Updating other columns Totals object which has same currencyKey object
					// 		aCurrencyKeys.map(function (sCurrencyKey) {
					// 			/*Set visibility of other columns based on the same reference currencyKey and the changed CurrencyKey values in the column*/
					// 			var bHasSameReferenceElementId = oTotalsRowData[sCurrencyKey].ElementId === oTotalsRowData[sCurrencyColumnBindingPath]
					// 				.ElementId;
					// 			oTotalsRowData[sCurrencyKey].bShowTotals = bHasSameReferenceElementId && bShowTotals;
					// 			oTotalsRowData[sCurrencyKey.split("_Currency")[0]].bShowTotals = oTotalsRowData[sCurrencyKey].bShowTotals;
					// 			oTotalsRowData[sCurrencyKey].displayValue = oEvent.getParameter("value");
					// 		});
					// 	}
					// 	// Check if All the column has bShowTotals false
					// 	oTableControlData.bAddTotalsObject = Object.keys(oTotalsRowData).some(function (sKey) {
					// 		return sKey.startsWith("E") && oTotalsRowData[sKey].bShowTotals;
					// 	});
					// 	if (oTableControlData.bAddTotalsObject && oTableControlData.generatedData.length === aTableData.length) {
					// 		aTableData.push(oTableControlData.oTotalsObject);
					// 	} else if (!oTableControlData.bAddTotalsObject && oTableControlData.generatedData.length !== aTableData.length) {
					// 		aTableData.splice(aTableData.length - 1, 1);
					// 	}
					// 	// If change is happenebAddTotalsObjectd on CurrencyValue/Key, Push Table TotalRowObject also to aChanged array
					// 	var oChangedEventForTotals = {
					// 		context: {},
					// 		path: sTableDataPath,
					// 		dataObj: oTotalsRowData,
					// 		isTotalObject: true
					// 	};
					// 	iChangedEvtIdx = undefined;
					// 	/*If total change event is already pushed, remove it and push updated total change event*/
					// 	var bChangedEventForTotalAlreadyExist = aChangedElementsModelEvents.some(function (oModelChangedEvent, idx) {
					// 		iChangedEvtIdx = idx;
					// 		return (oModelChangedEvent.path === sTableDataPath && oModelChangedEvent.isTotalObject);
					// 	});
					// 	if (bChangedEventForTotalAlreadyExist) {
					// 		aChangedElementsModelEvents.splice(iChangedEvtIdx, 1);
					// 	}
					// 	aChangedElementsModelEvents.push(oChangedEventForTotals);
					// 	oView.getContent()[0].rerender();
					// }
				}
			}.bind(this));
			BusyIndicator.hide();
		},

		updateChangedElements: function (oCtx, sPath, oCtxObject) {
			var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
			var aChangedElementsModelEvents = oGlobalVariablesModel.getProperty("/aChangedElements");
			var oNewChangedEvent = {
				context: oCtx,
				path: sPath,
				dataObj: oCtxObject.displayValue !== undefined && sPath.indexOf("currencyData") === -1 ? oCtxObject : oCtx.getObject(
					sPath.split("/")[0])
			};
			aChangedElementsModelEvents.push(oNewChangedEvent);
			if (!oNewChangedEvent.newChange) {
				oNewChangedEvent.newChange = oNewChangedEvent.dataObj.ChangeIndicator === "UM" ? false : true;
			}
			// Updating Old values for tooltip
			oNewChangedEvent.dataObj.ChangedBy = sap.ushell.Container.getUser().getId();
			//onLoadLastModifiedValue used for reverting old value on cancel press
			oNewChangedEvent.dataObj.onLoadLastModifiedValue = oNewChangedEvent.dataObj.OldValue;
			if (oNewChangedEvent.dataObj.ChangeIndicator === "UM") {
				oNewChangedEvent.dataObj.OldValue = oNewChangedEvent.dataObj.ModifiedValue;
			} else {
				oNewChangedEvent.dataObj.OldValue = oNewChangedEvent.dataObj.GeneratedValue;
			}
			// Updating ChangeIndicator 
			oNewChangedEvent.dataObj.ChangeIndicator = "UM";
		},

		_updateTotalsAfterCalculation: function (oTotalRow, oTableCellObject, sOperation) {
			try {
				var iTotal = new Bignumber(parseFloat(oTotalRow["E" + oTableCellObject.ElementId].displayValue, 10));
				if (sOperation === "add") {
					iTotal = iTotal.plus(oTableCellObject.displayValue.length !== 0 ? oTableCellObject.displayValue : 0);
				} else {
					iTotal = iTotal.minus(oTableCellObject.displayValue.length !== 0 ? oTableCellObject.displayValue : 0);
				}
				iTotal = oTableCellObject.lastValue ? iTotal.minus(oTableCellObject.lastValue.length !== 0 ? oTableCellObject.lastValue : 0) :
					iTotal;
				oTotalRow["E" + oTableCellObject.ElementId].displayValue = iTotal;
			} catch (e) {
				oTotalRow["E" + oTableCellObject.ElementId].bShowTotals = false;
			};
		},

		checkIfElementExistsInChangedElements: function (sPath, oCtx, bRemove) {
			var iIndex = -1;
			var oCtxObject = oCtx.getObject();
			var aChangedElementsModelEvents = this.getView().getModel("GlobalVariables").getProperty("/aChangedElements");
			var bChangedEventAlreadyExist = aChangedElementsModelEvents.some(function (oModelChangedEvent, idx) {
				iIndex = idx;
				//Currency key can be there for multiple elements and in this case paths will be different, so we need to check the currency key element id also to find same element got changed or not
				return (oModelChangedEvent.context.sPath === oCtx.sPath && oModelChangedEvent.path === sPath) || (sPath.indexOf(
					"currencyData") !== -1 && oModelChangedEvent.dataObj.ElementId === oCtxObject.currencyData.ElementId);
			});

			if (bChangedEventAlreadyExist && bRemove) {
				aChangedElementsModelEvents.splice(iIndex, 1);
			}
			return bChangedEventAlreadyExist;
		},

		_getChildControl: function (sId, oCtx) {
			var oControlType = oCtx.getObject().controlType;
			if (oControlType === 'panel') {
				return this._getPanelControl(oCtx);
			} else if (oControlType === 'form') {
				return this._getFormControl(oCtx);
			} else if (oControlType === 'select'){
				return this._getSelectControl(oCtx);
			}else {
				return this._getTableControl(sId, oCtx);
			}
		},
		
		_getSelectControl: function (oCtx) {
			var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
			var oCtxObject = oCtx.getObject();
			var oChoice = this.getView().getModel("MetadataById").getData().nodes[oCtxObject.ElementId];
			var aChoiceChild = this.getView().getModel("MetadataById").getData().childById[oCtxObject.ElementId+"_s"];
			
			var items = [];
			
			for(var i in oChoice.children){
				items.push({
					"key": oChoice.children[i].ElementId,
					"text":oChoice.children[i].LabelInfo
				});
			}
			
			if(items.length === 0){
				for(var i in aChoiceChild){
					var oNode = this.getView().getModel("MetadataById").getData().nodes[aChoiceChild[i]];
					items.push({
						"key": oNode.ElementId,
						"text":oNode.LabelInfo
					});
				}
			}
			
			var oPanel = new Panel({
				visible: '{= (${structuredDataModel>visible} !== undefined ? ${structuredDataModel>visible} : true) && ${structuredDataModel>/editable} && ${structuredDataModel>isEditableChoice}}',
				headerText: '{structuredDataModel>LabelInfo}',
				content: [new Select({ // harish
				items: items,
				selectedKey: '{structuredDataModel>choice/displayValue}',
				valueState: '{= ${structuredDataModel>choice/ChangeIndicator} === "UM" ? "Information" : "None"}', 
				valueStateText: " ",
				// tooltip: oBindingPaths.TooltipPath,
				change: function (oEvent) {
					var choice = oEvent.getSource().getBindingContext("structuredDataModel").getObject().choice;
					this.handleChoiceChildrenVis(choice, oEvent.getParameters().selectedItem.getKey());
					this.getView().getModel("structuredDataModel").checkUpdate();
				}.bind(this)
			})]
			});
			return oPanel;
		},

		_getFormControl: function (oCtx) {
			var that = this;
			var sFieldArrangement = this.getView().getModel("DocumentData").getProperty("/FieldArrangement");
			var sFormContainer = new FormContainer({
				formElements: {
					path: 'structuredDataModel>data',
					sorter: new Sorter({
						path: 'OrdinalNumber',
						descending: false
					}),
					templateShareable: false,
					factory: function (sId, oCtx) {
						return that._getFormElements(sId, oCtx);
					}
				}
			});
			var sfFormContainer = {
				path: 'structuredDataModel>data',
				template: sFormContainer
			};

			var oForm = new Form({
				editable: true,
				layout: [new ResponsiveGridLayout({
					labelSpanXL: 4,
					labelSpanL: 4,
					labelSpanM: 4,
					labelSpanS: 12,
					adjustLabelSpan: false,
					emptySpanXL: 0,
					emptySpanL: 0,
					emptySpanM: 0,
					emptySpanS: 0,
					columnsXL: sFieldArrangement === "1" ? 1 : 2,
					columnsL: sFieldArrangement === "1" ? 1 : 2,
					columnsM: 1,
					singleContainerFullSize: false
				})],
				// title: [new CoreTitle({
				// 	text: "{structuredDataModel>LabelInfo}"
				// })],
				formContainers: sfFormContainer
			});

			// if (oCtx.getObject().bShowTitle) {
			// 	oForm.setTitle(new CoreTitle({
			// 		text: "{structuredDataModel>LabelInfo}"
			// 	}));
			// }
			var oCtxObj = oCtx.getObject();
			// var sPath = 
			// var sTitlePath = oCtxObj.ChangeIndicator === "CM" ? sPath + " ({i18n>xtit.new})" : (oCtxObj.ChangeIndicator === "DM" ? sPath + " ({i18n>xtit.deleted})" : "{structuredDataModel>LabelInfo}");
			// var sPath = (oCtxObj.ChangeIndicator !== "CM" || oCtxObj.ChangeIndicator !== "DM") ? "{structuredDataModel>LabelInfo}" : (oCtxObj.ChangeIndicator === "CM" ? sPath + " ({i18n>xtit.new})" : );
			// if(oCtxObj.ChangeIndicator === "CM"){
			// 	sPath = sPath + " ({i18n>xtit.new})";
			// }
			// if(oCtxObj.ChangeIndicator === "DM"){
			// 	sPath = sPath + " ({i18n>xtit.deleted})";
			// }
			var oHeaderToolbar = new sap.m.OverflowToolbar({
				content: [new sap.m.Title({
						text: "{structuredDataModel>LabelInfo} {=${structuredDataModel>ChangeIndicator} === 'CM' ? '(' + ${i18n>xtit.new} + ')' : (${structuredDataModel>ChangeIndicator} === 'DM' ? '(' + ${i18n>xtit.deleted} + ')' : '')}",
						// text: oCtxObj.ChangeIndicator === "CM" ? "{structuredDataModel>LabelInfo}" + " ({i18n>xtit.new})" : (oCtxObj.ChangeIndicator === "DM" ? "{structuredDataModel>LabelInfo}" + " ({i18n>xtit.deleted})" : "{structuredDataModel>LabelInfo}"),
						visible: oCtx.getObject().bShowTitle
					}),
					new sap.m.ToolbarSpacer(),
					new Button({
						text: "{i18n>xtit.visualization.btn.addRow}",
						visible: "{=${structuredDataModel>/editable} && ${structuredDataModel>isAddDeleteEnabled} && (${structuredDataModel>maxOccurs} === -1 || ${structuredDataModel>maxOccurs} > 1 ) && !${structuredDataModel>hasFurtherChildren}}",
						enabled: true,
						press: this._onAddNewRow.bind(this)
					}),
					new Button({
						text: "{i18n>xtit.visualization.btn.deleteRow}",
						visible: "{=${structuredDataModel>/editable} && ${structuredDataModel>isAddDeleteEnabled} && (${structuredDataModel>maxOccurs} === -1 || ${structuredDataModel>maxOccurs} > 1 ) && !${structuredDataModel>hasFurtherChildren}}",
						enabled: "{=${structuredDataModel>ChangeIndicator} !== 'DM'}",
						press: this._onDeleteRow.bind(this)
					}),
					new Button({
						text: "{i18n>xtit.visualization.btn.unDeleteRow}",
						visible: "{=${structuredDataModel>/editable} && ${structuredDataModel>isAddDeleteEnabled} && (${structuredDataModel>maxOccurs} === -1 || ${structuredDataModel>maxOccurs} > 1 ) && !${structuredDataModel>hasFurtherChildren}}",
						enabled: "{=${structuredDataModel>ChangeIndicator} === 'DM'}",
						press: this.unDoDelete.bind(this)
					}),
					new Button({
						text: "{i18n>copy}",
						visible: "{=${structuredDataModel>/editable} && ${structuredDataModel>isAddDeleteEnabled} && (${structuredDataModel>maxOccurs} === -1 || ${structuredDataModel>maxOccurs} > 1 ) && !${structuredDataModel>hasFurtherChildren}}",
						enabled: "{=${structuredDataModel>ChangeIndicator} !== 'DM'}",
						press: this.onCopy.bind(this)
					})
				]
			});
			var oCtxObject = oCtx.getObject();
			var oFormPanel = new Panel({
				content: oForm,
				visible: "{= (${structuredDataModel>visible} !== undefined ? ${structuredDataModel>visible} : true ) && (${structuredDataModel>selectedChoiceVis} !== undefined ? ${structuredDataModel>selectedChoiceVis} : true ) }"
					// visible: {

				// 	parts: [{
				// 		path: 'structuredDataModel>/editable'
				// 	}, {
				// 		path: 'structuredDataModel>originalRowCount'
				// 	}, {
				// 		path: 'structuredDataModel>visible'
				// 	}, {
				// 		path: 'structuredDataModel>'
				// 	}],
				// 	formatter: function(sEditable, iOriginalRowCount, bVisible, oModel){
				// 		if(iOriginalRowCount === 1){
				// 			if(!sEditable){
				// 				return bVisible;
				// 			}else{
				// 				return false;
				// 			}
				// 		}else{
				// 			return bVisible;
				// 		}
				// 	}

				// }
			});

			if (oCtx.getObject().bShowTitle) {
				oFormPanel.setHeaderToolbar(oHeaderToolbar);
			} else {
				oFormPanel.addStyleClass("sapUiNoMargin");
			}
			return oFormPanel;
		},

		_getAttributeForm: function (oCtx) {
			var that = this;
			var sFieldArrangement = this.getView().getModel("DocumentData").getProperty("/FieldArrangement");
			var sAttrFormContainer = new FormContainer({
				formElements: {
					path: 'structuredDataModel>attributes',
					sorter: new Sorter({
						path: 'OrdinalNumber',
						descending: false
					}),
					templateShareable: false,
					factory: function (sId, oCtx) {
						return that._getFormElements(sId, oCtx);
					}
				}
			});

			var oForm = new Form({
				editable: true,
				layout: [new ResponsiveGridLayout({
					labelSpanXL: sFieldArrangement === "1" ? 3 : 6,
					labelSpanL: sFieldArrangement === "1" ? 3 : 6,
					labelSpanM: sFieldArrangement === "1" ? 3 : 6,
					labelSpanS: sFieldArrangement === "1" ? 12 : 12,
					adjustLabelSpan: false,
					emptySpanXL: sFieldArrangement === "1" ? 4 : 0,
					emptySpanL: sFieldArrangement === "1" ? 4 : 0,
					emptySpanM: sFieldArrangement === "1" ? 4 : 0,
					emptySpanS: sFieldArrangement === "1" ? 4 : 0,
					columnsXL: sFieldArrangement === "1" ? 1 : 2,
					columnsL: sFieldArrangement === "1" ? 1 : 2,
					columnsM: 1,
					singleContainerFullSize: false
				})],
				formContainers: [sAttrFormContainer],
				visible: "{= (${structuredDataModel>visible} !== undefined ? ${structuredDataModel>visible} : true ) && (${structuredDataModel>selectedChoiceVis} !== undefined ? ${structuredDataModel>selectedChoiceVis} : true ) }"
			});
			return oForm;
		},

		_getDataTypeConstraints: function (oTypeInfo) {
			return {
				sXsdBuiltInType: oTypeInfo.XsdBuiltInType,
				iTotalDigits: oTypeInfo.TotalDigits !== 0 ? oTypeInfo.TotalDigits !== -2 ? oTypeInfo.TotalDigits : 0 : "",
				iFractionDigits: oTypeInfo.FractionDigits,
				iMaxLength: oTypeInfo.MaxLength !== 0 ? oTypeInfo.MaxLength !== -2 ? oTypeInfo.MaxLength : 0 : "",
				iMinLength: oTypeInfo.MinLength !== 0 ? oTypeInfo.MinLength !== -2 ? oTypeInfo.MinLength : 0 : "",
				iLength: oTypeInfo.Length !== 0 ? oTypeInfo.Length !== -2 ? oTypeInfo.Length : 0 : "",
				sMaximum: oTypeInfo.Maxinclusive,
				sMinimum: oTypeInfo.Mininclusive,
				bMaxExclusive: oTypeInfo.Maxinclusive !== "" ? false : true,
				bMinExclusive: oTypeInfo.Mininclusive !== "" ? false : true,
				sWhitespaceHandling: oTypeInfo.Whitespace ? oTypeInfo.Whitespace : ""
			};
		},

		_getFormEditPath: function () {
			return {
				parts: [{
					path: 'structuredDataModel>ChangeIndicator'
				}],
				formatter: formatter.formateEdit
			};
		},

		_getFormEditablePath: function () {
			return {
				parts: [{
					path: 'structuredDataModel>/editable'
				}, {
					path: 'structuredDataModel>ManualAdjOption'
				}, {
					path: 'structuredDataModel>GeneratedValue'
				}, {
					path: 'structuredDataModel>typeInfo/XsdBuiltInType'
				}, {
					path: 'structuredDataModel>bShowTotals'
				}, {
					path: 'structuredDataModel>ChangeIndicator'
				}],
				formatter: formatter.formateEditable
			};
		},

		_getFormDisplayPath: function () {
			return {
				parts: [{
					path: 'structuredDataModel>/editable'
				}, {
					path: 'structuredDataModel>ManualAdjOption'
				}, {
					path: 'structuredDataModel>GeneratedValue'
				}, {
					path: 'structuredDataModel>typeInfo/XsdBuiltInType'
				}, {
					path: 'structuredDataModel>bShowTotals'
				}],
				formatter: formatter.formateDisplay
			};
		},

		_getTooltipPath: function (sPath) {
			return {
				parts: [{
					path: ['structuredDataModel>', sPath, 'ChangeIndicator'].join("")
				}, {
					path: ['structuredDataModel>', sPath, 'ChangedBy'].join("")
				}, {
					path: ['structuredDataModel>', sPath, 'OldValue'].join("")
				}, {
					path: ['structuredDataModel>', sPath, 'GeneratedValue'].join("")
				}, {
					path: ['structuredDataModel>', sPath, 'typeInfo/XsdBuiltInType'].join("")
				}, {
					path: ['structuredDataModel>', sPath, 'MessageText'].join("")
				}],
				formatter: formatter.formateTooltip
			};
		},

		_getFormCurrencyValueStatePath: function () {
			return {
				parts: [{
					path: "structuredDataModel>ChangeIndicator"
				}, {
					path: "structuredDataModel>currencyData/ChangeIndicator"
				}, {
					path: "structuredDataModel>MessageSeverity"
				}, {
					path: "structuredDataModel>currencyData/MessageSeverity"
				}],
				formatter: formatter.formateValueState
			};
		},

		_getDisplayCurrencyFieldTextBindingPath: function () {
			return {
				parts: [{
					path: "structuredDataModel>displayValue"
				}, {
					path: "structuredDataModel>currencyData/displayValue"
				}]
			};
		},

		_getFormElements: function (sId, oCtx) {
			var oCtxObject = oCtx.getObject();
			var oTypeInfo = oCtxObject.typeInfo;
			var sBuiltInType = oTypeInfo.XsdBuiltInType;

			var bIsFormControl = true;
			var oFormField = new HBox();
			var oBindingPaths = this._getFormBindingPaths(oCtx);
			var oTextControlParams = {
				builtInType: sBuiltInType,
				ValuePath: oBindingPaths.ValuePath,
				DisplayPath: oBindingPaths.DisplayPath,
				ValueStatePath: oBindingPaths.ValueStatePath,
				Constraints: oBindingPaths.Constraints,
				TooltipPath: oBindingPaths.TooltipPath,
				formFieldElementId: "",
				currencyKey: false
			};
			var oDisplayTextControl;
			// If Currency form field has CurrencyKey data, insert another field for currency key display
			if (oCtxObject.currencyData) {

				// var sCurrencyKeyValuePath = 'structuredDataModel>currencyData/displayValue';
				// Updating ValueState for both currency value and key if any one has change indicator
				// var oCurrencyValueField = this._getEditableControl(sBuiltInType, sValuePath, sEditablePath, this._getFormCurrencyValueStatePath(),
				// 	oConstraints,
				// 	sTooltipPath, sFormFieldElementId, sFieldGroupId, sSearchHelpPath);
				var oCurrencyValueField = this._getEditableControl(oCtx, "form");
				// oCurrencyValueField.bindProperty("fieldGroupIds", '{structuredDataModel>ReferenceElementId}_{structuredDataModel>ParentElementId}');
				oFormField.addItem(oCurrencyValueField);
				oDisplayTextControl = this._getDisplayTextControl(oTextControlParams);
				oFormField.addItem(oDisplayTextControl);
				oBindingPaths.Constraints = this._getDataTypeConstraints(oCtxObject.currencyData.typeInfo); //updating currency key constraints
				oBindingPaths.ValuePath = 'structuredDataModel>currencyData/displayValue';
				oBindingPaths.ValueStateText = '{structuredDataModel>currencyData/MessageText}';
				oBindingPaths.FieldGroupId = '';
				var oCurrencyKeyField = this._getCurrKeyInputControl(oBindingPaths);
				oCurrencyKeyField.bindProperty("valueState", this._getFormCurrencyValueStatePath());
				oCurrencyKeyField.attachEvent("change", function (oEvent) {
					this._onCurrencyKeyChange(oEvent, this);
				}.bind(this));
				oFormField.addItem(oCurrencyKeyField);

				oFormField.addItem(new Label({
					width: "0.5rem",
					text: " ",
					visible: oBindingPaths.DisplayPath
				}));

				oTextControlParams.ValuePath = 'structuredDataModel>currencyData/displayValue';
				//oTextControlParams.ValueStateText = 'structuredDataModel>currencyData/MessageText';
				oTextControlParams.builtInType = "currencyKey";
				oTextControlParams.DisplayPath = this._getFormDisplayPath();
				oDisplayTextControl = this._getDisplayTextControl(oTextControlParams);
				oFormField.addItem(oDisplayTextControl);
			} else {
				var oEditableInputControl = this._getEditableControl(oCtx, "form");
				oFormField.addItem(oEditableInputControl);
				oDisplayTextControl = this._getDisplayTextControl(oTextControlParams);
				oFormField.addItem(oDisplayTextControl);
			}
			var sFieldArrangement = this.getView().getModel("DocumentData").getProperty("/FieldArrangement");
			var sAttrCtxPath = oCtx.sPath + "/attributes";
			var oVBox = new sap.m.VBox();
			var oAttributeForm = this._getAttributeForm(oCtx);
			var oAttributePanel = new Panel({
				expandable: true,
				headerText: '{i18n>xtit.visualization.attribute}',
				content: [oAttributeForm],
			}).addStyleClass('noPanelBorder');
			// var oVBox = new sap.m.VBox({
			// 		visible: "{=${structuredDataModel>FieldVisibilityInd} === 'X'}"
			// });
			// var bHasVisibleAttributes = false;
			// if(oCtx.getObject().attributes){
			// 	bHasVisibleAttributes = oCtx.getObject().attributes.some(function(oAttribute){
			// 		return oAttribute.FieldVisibilityInd === 'X';
			// 	});
			// }
			// if(bHasVisibleAttributes){
			// 	var oAttributeForm = this._getAttributeForm(oCtx);
			// 	var oAttributePanel = new Panel({
			// 		expandable: true,
			// 		headerText: '{i18n>xtit.visualization.attribute}',
			// 		content: [oAttributeForm],
			// 	}).addStyleClass('noPanelBorder');
			// 	oAttributePanel.iCurrentNavPage = this.iCurrentNavPage;
			// }
			var aFormFields = [oVBox.addItem(oFormField)];
			var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
			oAttributePanel.iCurrentNavPage = this.iCurrentNavPage;
			var aTotalPanels = oGlobalVariablesModel.getProperty("/aPanels").concat([oAttributePanel]);
			oGlobalVariablesModel.setProperty("/aPanels", aTotalPanels);
			//For attributes, not adding attributes link
			if (oCtx.getObject().hasAttributes) {
			// if (oCtx.getObject().hasAttributes && bHasVisibleAttributes) {
				oVBox.addItem(oAttributePanel);
			}
			return new FormElement({
				label: new Label({
					text: "{structuredDataModel>LabelInfo}",
					// visible: "{=${structuredDataModel>FieldVisibilityInd} === 'X'}",
					wrapping: true,
					wrappingType: "Hyphenated",
					tooltip: "{structuredDataModel>Description}",
					labelFor: aFormFields[0].getItems()[0].getItems()[0].getId(),
					required: "{=${structuredDataModel>MinOccurs} === 1}"
				}),
				fields: aFormFields
			});
		},

		/*_getEditableControl: function (sBuiltInType, sValuePath, sEditablePath, sValueStatePath, oConstraints, sTooltipPath, sElementId, sId, sSearchHelpPath) {
			var oEditableControl;
			var that = this;
			switch (sBuiltInType) {
			case 'date':
				oEditableControl = this._getDatePickerControl(sValuePath, sEditablePath, sValueStatePath, sTooltipPath);
				break;
			case 'integer':
			case 'int':
				oEditableControl = this._getIntegerInputControl(sValuePath, sEditablePath, sValueStatePath, oConstraints, sTooltipPath, sElementId,
					sId, sSearchHelpPath);
				break;
			case 'unsignedLong':
				oEditableControl = this._getUnsignedInputControl(sValuePath, sEditablePath, sValueStatePath, oConstraints, sTooltipPath,
					sElementId, undefined, sSearchHelpPath);
				break;
			case 'decimal':
			case 'double':
			case 'float':
				oEditableControl = this._getNumberInputControl(sValuePath, sEditablePath, sValueStatePath, oConstraints, sTooltipPath, sElementId,
					sId, sSearchHelpPath);
				break;
			case 'gYearMonth':
				// var sValueBindingPath = "{= ${" + sValuePath + "}.substring(0,4)}/{=${" + sValuePath + "}.substring(4)}";
				// var oYearMonthField = new Input({
				// 	width: "13rem",
				// 	value: sValueBindingPath,
				// 	visible: sEditablePath,
				// 	maxLength: 7,
				// 	valueState: sValueStatePath,
				// 	showValueStateMessage: false,
				// 	tooltip: sTooltipPath,
				// 	change: function (oEvent) {
				// 		var oSource = oEvent.getSource();
				// 		var oStructuredDataModel = oSource.getModel("structuredDataModel");
				// 		var oChangedCtx = oSource.getBindingContext("structuredDataModel");
				// 		var sValue = oSource.getValue().split("/").join("");
				// 		var oYyyyMRegEx = new RegExp(/\d{4}\/[1-9]/);
				// 		var oYyyyMmRegEx = new RegExp(/\d{4}\/(0[1-9]|1[0-2])/);
				// 		var bIsSingleMonth = oYyyyMRegEx.test(oEvent.getParameter("value"));
				// 		if (oYyyyMmRegEx.test(oEvent.getParameter("value")) || bIsSingleMonth) {
				// 			sValue = bIsSingleMonth ? oEvent.getParameter("value").replace("/", "0") : sValue;
				// 			oStructuredDataModel.setProperty(oChangedCtx.sPath + "/displayValue", sValue);
				// 			var oPropChangeParameters = {
				// 				reason: "propertyChange",
				// 				path: sValuePath,
				// 				context: oChangedCtx,
				// 				value: sValue
				// 			};
				// 			oStructuredDataModel.firePropertyChange(oPropChangeParameters);
				// 			oSource.fireValidationSuccess();
				// 		} else {
				// 			var sMessage1 = that.getResourceBundle().getText("xmsg.visualization.periodInFormatYYYYMM");
				// 			oSource.fireValidationError({
				// 				message: sMessage1
				// 			});
				// 		}
				// 		if (bIsSingleMonth) {
				// 			var oValueBindingInfo = oSource.getBindingInfo("value");
				// 			oSource.bindProperty("value", oValueBindingInfo);
				// 		}
				// 	},
				// 	validationError: this._handleValidationError.bind(this),
				// 	validationSuccess: this._handleValidationSuccess.bind(this)
				// });
				oEditableControl = this._getYearMonthControl(sValuePath, sEditablePath, sValueStatePath, sTooltipPath, sElementId, sId);
				break;
			case 'boolean':
				var sFormat = this.getView().getModel("DocumentData").getProperty("/DocumentFormat");
				if (sFormat === "JSON") {
					oEditableControl = this._getBooleanControl(sValuePath, sEditablePath, sValueStatePath, oConstraints, sTooltipPath, sFormat);
				} else {
					oEditableControl = this._getDefaultInputControl(sValuePath, sEditablePath, sValueStatePath, oConstraints, sTooltipPath,
						bIsCurrencyKey, sElementId, sId, sSearchHelpPath);
				}
				break;
			default:
				var bIsCurrencyKey = false;
				oEditableControl = this._getDefaultInputControl(sValuePath, sEditablePath, sValueStatePath, oConstraints, sTooltipPath,
					bIsCurrencyKey, sElementId, sId, sSearchHelpPath);
				break;
			}
			return oEditableControl;
		},*/

		_getEditableControl: function (oCtx, sControlType, oColumnData, oSubColumn) {
			var oEditableControl;
			// Check if the control type is table, find if sub column exists then
			// var sBuiltInType = sControlType === "table" ? (oSubColumn ? oSubColumn.typeInfo : oColumnData.typeInfo) : oCtx.getProperty("XsdBuiltInType");
			var sElementId = oCtx.getProperty("ElementId");

			var oBindingPaths = sControlType === "table" ? this._getTableBindingPaths(oCtx, oColumnData, oSubColumn) : this._getFormBindingPaths(
				oCtx);
			var sBuiltInType = oBindingPaths.builtInType;
			oBindingPaths.Shlpname = oCtx.getProperty("Shlpname");
			//for additional metadata domain values, displaying combobox
			var iCountValues = oCtx.getProperty("CountValues");
			if (iCountValues > 0 && iCountValues <= 200) {
				sBuiltInType = "combobox";
			} else if (iCountValues > 200) {
				sBuiltInType = "valuehelp";
			}

			oBindingPaths.BuiltInType = sBuiltInType;

			var that = this;
			switch (sBuiltInType) {
			case 'date':
				oEditableControl = this._getDatePickerControl(oBindingPaths);
				break;
			case 'integer':
			case 'int':
			case 'long':
			case 'abap:numc':
				oEditableControl = this._getIntegerInputControl(oBindingPaths, sElementId);
				break;
			case 'unsignedLong':
				oEditableControl = this._getUnsignedInputControl(oBindingPaths, sElementId);
				break;
			case 'decimal':
			case 'double':
			case 'float':
				oEditableControl = this._getNumberInputControl(oBindingPaths, sElementId);
				break;
			case 'gYearMonth':
				oEditableControl = this._getYearMonthControl(oBindingPaths, sElementId);
				break;
			case 'boolean':
				var sFormat = this.getView().getModel("DocumentData").getProperty("/DocumentFormat");
				if (sFormat === "JSON") {
					oEditableControl = this._getBooleanControl(oBindingPaths, sFormat);
				} else {
					oEditableControl = this._getDefaultInputControl(oBindingPaths);
				}
				break;
			case 'combobox':
				oEditableControl = this._getComboBoxControl(oBindingPaths, sElementId, oCtx);
				break;
			default:
				var bIsCurrencyKey = false;
				oEditableControl = this._getDefaultInputControl(oBindingPaths, bIsCurrencyKey);
				break;
			}
			return oEditableControl;
		},

		_getComboBoxControl: function (oBindingPaths, sElementId, oCtx) {
			var sElementIdPath = oBindingPaths.ElementId !== "" && oBindingPaths.ElementId !== undefined ? "E" + oBindingPaths.ElementId + "/" :
				"";
			var oColumnCtx = oCtx;
			var sTypeInfo = oCtx.getObject().typeInfo.XsdBuiltInType;
			var oComboboxType;
			var oConstraints = oBindingPaths.Constraints;
			if (sTypeInfo === 'decimal') {
				oComboboxType = new customDecimalType({
					minFractionDigits: oConstraints.iFractionDigits === 0 ? "" : oConstraints.iFractionDigits === -2 ? 0 : oConstraints.iFractionDigits
				}, {
					precision: oConstraints.iTotalDigits,
					scale: "variable",
					maximum: oConstraints.sMaximum,
					minimum: oConstraints.sMinimum,
					maximumExclusive: oConstraints.bMaxExclusive,
					minimumExclusive: oConstraints.bMinExclusive,
					nullable: false,
					maxLength: oConstraints.iMaxLength,
					minLength: oConstraints.iMinLength
				}, this.getResourceBundle());
			} else if (sTypeInfo === 'date') {
				oComboboxType = new sap.ui.model.odata.type.Date();
			}
			var oSelectFld = new sap.m.ComboBox({
				visible: oBindingPaths.EditablePath,
				enabled: oBindingPaths.Edit,
				valueState: oBindingPaths.ValueStatePath,
				showValueStateMessage: false,
				value: {
					path: oBindingPaths.ValuePath,
					type: oComboboxType
				},
				showSecondaryValues: true,
				items: {
					path: 'structuredDataModel>' + oColumnCtx.sPath + '/suggestions',
					template: new sap.ui.core.ListItem({
						key: '{structuredDataModel>KEY}',
						text: {
							path: 'structuredDataModel>KEY',
							type: oComboboxType
						},
						additionalText: '{structuredDataModel>VALUE}'
					})
				},
				validationSuccess: this._handleValidationSuccess.bind(this),
				validationError: this._handleValidationError.bind(this),
				customData: this._prepareCustomData(sElementIdPath, oBindingPaths, oBindingPaths.ValuePath),
				loadItems: function (oEvent) {
					var oSourceFld = oEvent.getSource();
					var oStructuredDataModel = this.getModel("structuredDataModel");
					var oCtx = oSourceFld.getBindingContext("structuredDataModel");
					var oCtxObj = Common._getFieldModelData(oSourceFld);
					var oParamData = this.getModel("paramModel").getData();
					var oFld = this;
					var oUrlParameters = {
						Skip: 0,
						Top: 200,
						AttributeId: "'" + oCtxObj.AttributeId + "'",
						ElementId: "'" + oCtxObj.ElementId + "'",
						DocumentId: "'" + oParamData.documentId + "'",
						ReportId: "'" + oParamData.reportId + "'",
						SearchKey: "''"
					};
					this.getModel().read("/GetValueHelpResultForPreview", {
						urlParameters: oUrlParameters,
						success: function (oData) {
							var aSuggestionValues = oData.GetValueHelpResultForPreview.Values;
							aSuggestionValues = aSuggestionValues !== "" ? JSON.parse(aSuggestionValues).VALUES : [];
							oStructuredDataModel.setProperty(oColumnCtx.sPath + "/suggestions", aSuggestionValues);
							oSourceFld.rerender();
						},
						error: function (oError) {
							MessageHandler.showErrorMessage(oError);
						}
					});
				},
				change: function (oEvent) {
					var oCombobox = oEvent.getSource();
					var oCtxObj = Common._getFieldModelData(oCombobox);
					var bHasEnumeration = oCtxObj.HasEnumeration;
					if (!bHasEnumeration && oCombobox.getValue() !== "" && oCombobox.getSelectedKey() === "") {
						oCombobox.fireValidationError({
							message: oCombobox.getModel("i18n").getProperty("xtit.visualization.invalidEntry")
						});
					} else if (sTypeInfo !== 'decimal' && sTypeInfo !== 'date') {
						oCombobox.fireValidationSuccess();
					}
				}
			});
			return oSelectFld;
		},

		_getDisplayTextControl: function (oParams) {
			var oObjectStatusParams = {
				textBindingPath: this._getBindingPath(oParams),
				visiblePath: (oParams.ElementId && oParams.ElementId === oParams.ParentElementId) ? true : oParams.DisplayPath,
				valueStatePath: oParams.ValueStatePath,
				tooltipPath: oParams.TooltipPath
			};
			return this._getObjectStatusControl(oObjectStatusParams);
		},

		_getBindingPath: function (oParams) {
			var sTextBindingPath;
			var bIsCurrencyKey = false;
			switch (oParams.builtInType) {
			case 'date':
				sTextBindingPath = {
					path: oParams.ValuePath,
					type: new DateType({
						source: {
							pattern: 'yyyyMMdd'
						}
					})
				};
				break;
			case 'integer':
			case 'int':
			case 'long':
				sTextBindingPath = this._getValueBindingPath("integer", oParams.ValuePath, oParams.Constraints);
				break;
			case 'unsignedLong':
				sTextBindingPath = this._getValueBindingPath("unsignedLong", oParams.ValuePath, oParams.Constraints);
				break;
			case 'decimal':
			case 'double':
			case 'float':
				sTextBindingPath = this._getValueBindingPath("number", oParams.ValuePath, oParams.Constraints);
				break;
			case 'gYearMonth':
				sTextBindingPath = "{= ${" + oParams.ValuePath + "}.substring(0,4)}/{=${" + oParams.ValuePath + "}.substring(4)}";
				break;
			case 'boolean':
				var sFormat = this.getView().getModel("DocumentData").getProperty("/DocumentFormat");
				if (sFormat === "JSON") {
					sTextBindingPath = {
						parts: [{
							path: oParams.ValuePath
						}]
					};
				} else {
					sTextBindingPath = this._getValueBindingPath("defaultInput", oParams.ValuePath, oParams.Constraints, oParams.currencyKey);
				}
				break;

				break;
			case 'currencyKey':
				sTextBindingPath = this._getValueBindingPath("currencyKey", oParams.ValuePath, oParams.Constraints, oParams.currencyKey);
				break;
			case 'amount':
				sTextBindingPath = "{path: 'structuredDataModel>E" + oParams.ElementId +
					"/displayValue', type: 'sap.ui.model.type.Integer'} {= ${structuredDataModel>E" + oParams.ElementId + "_Currency/displayValue}}";
				break;
			default:
				sTextBindingPath = {
					path: oParams.ValuePath,
					formatter: formatter.renderWhiteSpace
				};
				break;
			}
			return sTextBindingPath;
		},

		_getValueBindingPath: function (sType, sValuePath, oConstraints, bIsCurrencyKey) {
			var oValueBindingPath;
			switch (sType) {
			case 'unsignedLong':
				oValueBindingPath = {
					parts: [{
						path: sValuePath,
						type: new DecimalType({
							groupingEnabled: false
						}, {
							precision: oConstraints.iTotalDigits,
							scale: 0,
							maximum: oConstraints.sMaximum,
							minimum: oConstraints.sMinimum,
							maximumExclusive: oConstraints.bMaxExclusive,
							minimumExclusive: oConstraints.bMinExclusive
						})
					}],
				};
				break;
			case 'number':
				oValueBindingPath = {
					parts: [{
						path: sValuePath,
						type: new customDecimalType({
							minFractionDigits: oConstraints.iFractionDigits === 0 ? "" : oConstraints.iFractionDigits === -2 ? 0 : oConstraints.iFractionDigits
						}, {
							precision: oConstraints.iTotalDigits,
							scale: "variable",
							maximum: oConstraints.sMaximum,
							minimum: oConstraints.sMinimum,
							maximumExclusive: oConstraints.bMaxExclusive,
							minimumExclusive: oConstraints.bMinExclusive,
							nullable: false,
							maxLength: oConstraints.iMaxLength,
							minLength: oConstraints.iMinLength
						}, this.getResourceBundle())
					}],
					type: new CurrencyType()
				};
				break;
			case 'abap:numc':
			case 'integer':
				var oIntegerConstraints = {
					precision: oConstraints.iTotalDigits,
					scale: oConstraints.iFractionDigits,
					maximumExclusive: oConstraints.bMaxExclusive,
					minimumExclusive: oConstraints.bMinExclusive
				};
				if (oConstraints.sMaximum !== "") {
					oIntegerConstraints.maximum = oConstraints.sMaximum;
				}
				if (oConstraints.sMinimum !== "") {
					oIntegerConstraints.minimum = oConstraints.sMinimum;
				}
				// In case the maximum and minimum value is missing from schema information, build the max and min value using the maxlength property
				if (oConstraints.iMaxLength && oConstraints.iMaxLength !== "") {
					oIntegerConstraints.maximum = (Math.pow(10, oConstraints.iMaxLength) - 1);
					// ABAP numc can hold only non-negative integer values (no decimals)
					oIntegerConstraints.minimum = sType === 'abap:numc' ? 0 : ((Math.pow(10, (oConstraints.iMaxLength - 1)) - 1) * -1);
				}
				oValueBindingPath = {
					parts: [{
						path: sValuePath,
						type: new IntegerType(null, oIntegerConstraints)
					}],
					type: new CurrencyType()
				};
				break;
			case 'currencyKey':
				oValueBindingPath = {
					parts: [{
						path: sValuePath,
						mode: "OneWay"
					}]
				};
				break;
			default:
				oValueBindingPath = {
					parts: [{
						path: sValuePath,
						type: new customStringType(null, {
								maxLength: oConstraints.iMaxLength,
								minLength: oConstraints.iMinLength,
								totalLength: oConstraints.iLength,
								whitespaceHandling: oConstraints.sWhitespaceHandling
							}, this.getResourceBundle(),
							this.getView().getModel("DocumentData").getProperty("/DocumentFormat")),
						mode: bIsCurrencyKey ? "OneWay" : "TwoWay"
					}]
				};
				break;
			}

			return oValueBindingPath;
		},

		_onCurrencyKeyChange: function (oEvent, oController) {
			//If currency f4 service is not available, then proceed with currency change. If it is available, then checlk Value help dialog is opened or not
			//If value help dialog is opened, then do not open currency change confirmation dialog
			if (!oController._oCurrencyKeyVHDialog || (oController._oCurrencyKeyVHDialog && !oController._oCurrencyKeyVHDialog.isOpened)) {
				var oSource = oEvent.getSource();
				var oStructuredDataModel = oController.getView().getModel("structuredDataModel");
				var oChangedCtx = oSource.getBindingContext("structuredDataModel");
				var sChangedElementId = oChangedCtx.getObject().ElementId;
				var oCurrencyData = oChangedCtx.getObject().currencyData;
				var oVlaueBindingInfo = oSource.getBindingInfo("value");
				var aCtxpaths = oChangedCtx.getPath().split("/");
				aCtxpaths.splice(aCtxpaths.length - 2, 2);
				var oTableContext = sChangedElementId ? undefined : oChangedCtx.getObject(aCtxpaths.join("/"));
				sChangedElementId = sChangedElementId ? sChangedElementId : oVlaueBindingInfo.parts[0].path.split("_")[0].split("E")[1];
				var oChangedObject = oCurrencyData ? oCurrencyData : oChangedCtx.getObject(oVlaueBindingInfo.parts[0].path.split("/")[0]);
				var fnChangeCurrencySettings = function (oEvent) {
					// validate amount
					var oTypeInfo;
					var oCurrentConstraints;
					var oAmountField = oSource.getParent().getItems()[0];
					var sFieldGroupId = oAmountField.getFieldGroupIds()[0];
					// Getting all controls with same ref currency key, seq. No & parent seq no
					var aControlsByFieldGroupdIds = this.getView().getControlsByFieldGroupId(sFieldGroupId);
					// Fix for issue caused by 1.90 ui5 version.
					// aControlsByFieldGroupdIds.forEach(function (oControl, idx) {
					// 	if (oControl.getFieldGroupIds().length === 0) {
					// 		aControlsByFieldGroupdIds.splice(idx, 1);
					// 	}
					// });
					for (var idx = 0; idx < aControlsByFieldGroupdIds.length; idx++) {
						if (aControlsByFieldGroupdIds[idx].getFieldGroupIds().length === 0) {
							aControlsByFieldGroupdIds.splice(idx, 1);
							idx--;
						}
					}

					for (var i = 0; i < aControlsByFieldGroupdIds.length; i++) {
						var iFractionsDigitsByCurKey;
						var iControlFractionDigits = aControlsByFieldGroupdIds[i].getCustomData()[0].getValue();
						if (iControlFractionDigits === 0) { // unbound element
							// Getting fractions by currency key
							iFractionsDigitsByCurKey = sap.ui.core.format.NumberFormat.getCurrencyInstance().oLocaleData.getCurrencyDigits(oSource.getValue());
						} else if (iControlFractionDigits === -2) { //zero fractions
							iFractionsDigitsByCurKey = 0;
						}
						// Updating fractions to the control type information
						if (iFractionsDigitsByCurKey !== undefined) {
							oTypeInfo = aControlsByFieldGroupdIds[i].getBinding('value').getType();
							oCurrentConstraints = oTypeInfo.oConstraints;
							oTypeInfo.oFormat.oFormatOptions.minFractionDigits = iFractionsDigitsByCurKey;
							oCurrentConstraints.scale = iFractionsDigitsByCurKey;
							oTypeInfo.setConstraints(oCurrentConstraints);
							aControlsByFieldGroupdIds[i].updateModelProperty("value", aControlsByFieldGroupdIds[i].getValue(), aControlsByFieldGroupdIds[i]
								.getValue());
							iFractionsDigitsByCurKey = undefined;
						}
					}
					/*As currency field binding mode is one way, we need to trigger model change manually*/
					var oPropChangeParameters = {
						reason: "propertyChange",
						path: oVlaueBindingInfo.parts[0].path,
						context: oChangedCtx,
						value: oSource.getValue()
					};
					oStructuredDataModel.firePropertyChange(oPropChangeParameters);
					// set total row visibility
					if (oTableContext && (oTableContext.hasTotalRow || oTableContext.totalRow)) {
						var iCurrencyChangedIndex = oChangedCtx.getPath().split("/")[oChangedCtx.getPath().split("/").length - 1];
						this._setTotalRowVisibility(oTableContext, oChangedObject, iCurrencyChangedIndex);
					}
					this.getView().getModel("structuredDataModel").checkUpdate();
				}.bind(this);
				var fnRevertCurrencySettings = function (oEvent) {
					oChangedObject.ChangeIndicator = oChangedObject.displayValue === oChangedObject.GeneratedValue ? "" : "UM";
					oSource.bindProperty("value", oVlaueBindingInfo);
					oStructuredDataModel.checkUpdate();
				}.bind(this);
				//Getting effected elements except current change element
				if (oChangedObject.aReferencedElementIds.length > 1) {
					var aReferencedElementIds = [];
					oChangedObject.aReferencedElementIds.map(function (oRefNum, idx) {
						if (oRefNum.ElementId !== sChangedElementId) {
							aReferencedElementIds.push(oRefNum);
						}
					});
					var sMessage1 = oController.getResourceBundle().getText("xmsg.visualization.currencyKeyChangeConfirmation");
					var sMessage2 = oTableContext && oTableContext.hasTotalRow ? oController.getResourceBundle().getText(
						"xmsg.visualization.currencyKeyChangeConfirmationforTotals") : "";
					var sMessage3 = oController.getResourceBundle().getText("xmsg.visualization.areYouSure");
					oController._displayConfirmationMessageWithList(sMessage1, sMessage2, sMessage3, aReferencedElementIds, fnChangeCurrencySettings,
						fnRevertCurrencySettings);
				} else {
					fnChangeCurrencySettings();
				}
			}
		},

		_setTotalRowVisibility: function (oTableContext, oChangedCurrencyObject, iCurrencyChangedIndex) {
			var oTotalRow = oTableContext.totalRow;
			if (oTotalRow && Object.keys(oTotalRow).length > 0) { // Condition for OPA
				oTableContext.changedRows = oTableContext.changedRows ? oTableContext.changedRows : [];
				// var iCurrencyChangedIndex = oChangedCtx.getPath().split("/")[oChangedCtx.getPath().split("/").length - 1];
				oChangedCurrencyObject.aReferencedElementIds.forEach(function (oReferenceElementId) {
					var sElementIdKey = "E" + oReferenceElementId.ElementId;
					var sCurrencyKey = sElementIdKey + "_Currency";
					oTotalRow[sElementIdKey].bShowTotals = oTableContext.hasTotalRow ? false : oChangedCurrencyObject.displayValue ===
						oTableContext.totalRow[sCurrencyKey].displayValue;
					if (oTotalRow[sElementIdKey].bShowTotals) {
						if (oTableContext.changedRows.indexOf(iCurrencyChangedIndex) !== -1) {
							oTableContext.changedRows.splice(oTableContext.changedRows.indexOf(iCurrencyChangedIndex), 1);
						}
					} else {
						if (oTableContext.changedRows.indexOf(iCurrencyChangedIndex) === -1) {
							oTableContext.changedRows.push(iCurrencyChangedIndex);
						}
					}
					oTotalRow[sElementIdKey].bShowTotals = oTableContext.changedRows.length === 0;
				});
				oTableContext.hasTotalRow = oTableContext.changedRows.length === 0;
				oTableContext.bAddTotalsObject = oTableContext.hasTotalRow;
				if (oTableContext.changedRows.length > 0 && oTableContext.data[oTableContext.data.length - 1] === oTotalRow) {
					oTableContext.data.splice(oTableContext.data.length - 1, 1);
				}
				if (oTableContext.hasTotalRow && parseInt(oTableContext.rowCount, 10) === oTableContext.data.length) {
					oTableContext.data.push(oTotalRow);
				}
			}
		},

		// Getting Controls
		_getDatePickerControl: function (oBindingPaths) {
			var sWidth = oBindingPaths.ValuePath.indexOf("/") > -1 ? '100%' : '13rem';
			var oDateField = new DatePicker({
				value: {
					path: oBindingPaths.ValuePath,
					type: new DateType()
				},
				width: sWidth,
				visible: oBindingPaths.EditablePath,
				enabled: oBindingPaths.Edit,
				valueState: oBindingPaths.ValueStatePath,
				tooltip: oBindingPaths.TooltipPath,
				showValueStateMessage: "{= $" + oBindingPaths.ValueStateText+ " !== undefined &&  $" + oBindingPaths.ValueStateText+ " !== '' }",
				parseError: this._handleValidationError.bind(this),
				formatError: this._handleValidationError.bind(this),
				validationError: this._handleValidationError.bind(this),
				validationSuccess: this._handleValidationSuccess.bind(this)
			});
			return oDateField;
		},

		_getYearMonthControl: function (oBindingPaths) {
			// todo - No standard formatter available for this type. Cnvert back to yyyyMM formate while saving
			var sValueBindingPath = "{= ${" + oBindingPaths.ValuePath + "}.substring(0,4)}/{=${" + oBindingPaths.ValuePath + "}.substring(4)}";
			var oYearMonthField = new Input({
				width: "13rem",
				value: sValueBindingPath,
				visible: oBindingPaths.EditablePath,
				enabled: oBindingPaths.Edit,
				maxLength: 7,
				valueState: oBindingPaths.ValueStatePath,
				showValueStateMessage: false,
				tooltip: oBindingPaths.TooltipPath,
				change: function (oEvent) {
					var oSource = oEvent.getSource();
					var oStructuredDataModel = oSource.getModel("structuredDataModel");
					var oChangedCtx = oSource.getBindingContext("structuredDataModel");
					var sValue = oSource.getValue().split("/").join("");
					var oYyyyMRegEx = new RegExp(/\d{4}\/[1-9]/);
					var oYyyyMmRegEx = new RegExp(/\d{4}\/(0[1-9]|1[0-2])/);
					var bIsSingleMonth = oYyyyMRegEx.test(oEvent.getParameter("value"));
					if (oYyyyMmRegEx.test(oEvent.getParameter("value")) || bIsSingleMonth) {
						sValue = bIsSingleMonth ? oEvent.getParameter("value").replace("/", "0") : sValue;
						oStructuredDataModel.setProperty(oChangedCtx.sPath + "/displayValue", sValue);
						var oPropChangeParameters = {
							reason: "propertyChange",
							path: oBindingPaths.ValuePath,
							context: oChangedCtx,
							value: sValue
						};
						oStructuredDataModel.firePropertyChange(oPropChangeParameters);
						oSource.fireValidationSuccess();
					} else {
						var sMessage1 = this.getResourceBundle().getText("xmsg.visualization.periodInFormatYYYYMM");
						oSource.fireValidationError({
							message: sMessage1
						});
					}
					if (bIsSingleMonth) {
						var oValueBindingInfo = oSource.getBindingInfo("value");
						oSource.bindProperty("value", oValueBindingInfo);
					}
				}.bind(this),
				validationError: this._handleValidationError.bind(this),
				validationSuccess: this._handleValidationSuccess.bind(this)
			});
			return oYearMonthField;
		},

		_getUnsignedInputControl: function (oBindingPaths, sElementId) {
			var oValueBinding = this._getValueBindingPath("unsignedLong", oBindingPaths.ValuePath, oBindingPaths.Constraints);
			return this._getInputControl(oValueBinding, oBindingPaths);
		},

		_getNumberInputControl: function (oBindingPaths, sElementId) {
			// oConstraints.iFractionDigits === 0 ? "variable" : oConstraints.iFractionDigits,
			var oValueBinding = this._getValueBindingPath("number", oBindingPaths.ValuePath, oBindingPaths.Constraints);
			return this._getInputControl(oValueBinding, oBindingPaths);
		},

		_getIntegerInputControl: function (oBindingPaths, sElementId) {
			var oValueBinding = this._getValueBindingPath(oBindingPaths.BuiltInType === "abap:numc" ? "abap:numc" : "integer", oBindingPaths.ValuePath,
				oBindingPaths.Constraints);
			return this._getInputControl(oValueBinding, oBindingPaths);
		},

		_getUnsignedLongInputControl: function (oBindingPaths, sElementId) {
			var oConstraints = oBindingPaths.Constraints;
			var oValueBinding = {
				parts: [{
					path: oBindingPaths.ValuePath,
					type: new Integer64Type({
						groupingEnabled: false
					}, {
						precision: oConstraints.iTotalDigits,
						scale: "variable",
						maximum: oConstraints.sMaximum,
						minimum: oConstraints.sMinimum,
						maximumExclusive: oConstraints.bMaxExclusive,
						minimumExclusive: oConstraints.bMinExclusive

					})
				}]
			};
			return this._getInputControl(oValueBinding, oBindingPaths, sElementId);
		},

		_getDefaultInputControl: function (oBindingPaths, bIsCurrencyKey) {
			var oConstraints = oBindingPaths.Constraints;
			var sFieldType = "defaultInput";
			//for Decimal type with value help
			if (oConstraints.sXsdBuiltInType === 'decimal') {
				sFieldType = "number";
			}
			var oValueBinding = this._getValueBindingPath(sFieldType, oBindingPaths.ValuePath, oConstraints, bIsCurrencyKey);
			//for Date type with value help
			if (oConstraints.sXsdBuiltInType === 'date') {
				oValueBinding = {
					parts: [{
						path: oBindingPaths.ValuePath,
						type: new DateType({
							source: {
								pattern: 'yyyyMMdd'
							}
						})
					}]
				};
			}
			if (bIsCurrencyKey) {
				return this._getInputControl(oValueBinding, oBindingPaths, bIsCurrencyKey);
			} else if (oConstraints.sXsdBuiltInType === 'string' && (oConstraints.iMaxLength > 30 || oConstraints.iMaxLength === "") &&
				oBindingPaths.Shlpname && oBindingPaths.Shlpname.length === 0) {
				return this._getTextAreaControl(oValueBinding, oBindingPaths);
			} else {
				return this._getInputControl(oValueBinding, oBindingPaths, bIsCurrencyKey);
			}
		},

		_getTextAreaControl: function (vValueBinding, oBindingPaths) {
			var oTextArea = new sap.m.TextArea({
				value: vValueBinding,
				visible: oBindingPaths.EditablePath,
				enabled: oBindingPaths.Edit,
				valueState: oBindingPaths.ValueStatePath,
				tooltip: oBindingPaths.TooltipPath,
				showValueStateMessage: false,
				parseError: this._handleValidationError.bind(this),
				formatError: this._handleValidationError.bind(this),
				validationError: this._handleValidationError.bind(this),
				validationSuccess: this._handleValidationSuccess.bind(this),
				growing: true,
				rows: 1
			});
			return oTextArea;
		},

		_prepareCustomData: function (sElementIdPath, oBindingPaths, vValueBinding) {
			var aCustomData = [new CustomData({
				value: "{structuredDataModel>" + sElementIdPath + "typeInfo/FractionDigits}",
				key: "iFractionDigits"
			}), new CustomData({
				value: oBindingPaths.ElementId,
				key: "elementId"
			}), new CustomData({
				value: sElementIdPath === "" ? "form" : "table",
				key: "parent"
			}), new CustomData({
				value: "{=${structuredDataModel>" + sElementIdPath + "ReferenceElementId}.length > 0 ? true : false}",
				key: "hasReference"
			}), new CustomData({
				value: vValueBinding,
				key: "oldValue"
			})];

			return aCustomData;

		},

		_getInputControl: function (vValueBinding, oBindingPaths, bIsCurrencyKey) {
			var sWidth = vValueBinding.parts[0].path.indexOf("/") > -1 ? '100%' : '13rem';
			var sElementIdPath = oBindingPaths.ElementId !== "" && oBindingPaths.ElementId !== undefined ? "E" + oBindingPaths.ElementId + "/" :
				"";
			var oIntInputField = new Input({
				fieldGroupIds: oBindingPaths.FieldGroupId,
				value: vValueBinding,
				visible: oBindingPaths.EditablePath,
				enabled: oBindingPaths.Edit,
				width: sWidth,
				valueStateText: oBindingPaths.ValueStateText,
				valueState: oBindingPaths.ValueStatePath,
				tooltip: oBindingPaths.TooltipPath,
				showValueStateMessage: "{= $" + oBindingPaths.ValueStateText+ " !== undefined &&  $" + oBindingPaths.ValueStateText+ " !== '' }",
				parseError: this._handleValidationError.bind(this),
				formatError: this._handleValidationError.bind(this),
				validationError: this._handleValidationError.bind(this),
				validationSuccess: this._handleValidationSuccess.bind(this),
				customData: this._prepareCustomData(sElementIdPath, oBindingPaths, vValueBinding),
				liveChange: this._inputLiveChange.bind(this)
			});
			if (!bIsCurrencyKey) {
				if (oBindingPaths.BuiltInType !== 'valuehelp') {
					oIntInputField.bindProperty("showValueHelp", oBindingPaths.SearchHelpPath, function (bValue) {
						// "Shlpname" when null/undefined/"" - we should not attach on change for _getValueHelpValues
						if (!!bValue) {
							oIntInputField.detachValidationError(this._handleValidationError);
							oIntInputField.detachValidationSuccess(this._handleValidationSuccess);
							oIntInputField.detachLiveChange(this._inputLiveChange);
							oIntInputField.attachChange({}, this._getValueHelpValues.bind(this));
						}
						return !!bValue;
					}.bind(this));
					oIntInputField.bindProperty("showSuggestion", oBindingPaths.SearchHelpPath, function (bValue) {
						return !!bValue;
					});
				} else {
					oIntInputField.detachValidationError(this._handleValidationError);
					oIntInputField.detachValidationSuccess(this._handleValidationSuccess);
					oIntInputField.detachLiveChange(this._inputLiveChange);
					/*oIntInputField.setProperty("showValueHelp", true);
					oIntInputField.bindAggregation("suggestionItems", "structuredDataModel>suggestions", new sap.ui.core.Item({
						text: "{structuredDataModel>KEY}"
					}));
					oIntInputField.setProperty("showSuggestion", true);*/
					this._bindSuggestions(oIntInputField, oBindingPaths.Constraints);
					oIntInputField.attachChange({}, this._getValueHelpValues.bind(this));
				}
				oIntInputField.attachValueHelpRequest(this._getValueHelpValues.bind(this));
				oIntInputField.attachSuggest(this._getValueHelpValues.bind(this));
			}
			return oIntInputField;
		},

		_bindSuggestions: function (oIntInputField, oConstraints) {
			var sTypeInfo = oConstraints.sXsdBuiltInType;
			var oComboboxItem;
			if (sTypeInfo === 'decimal') {
				oComboboxItem = new customDecimalType({
					minFractionDigits: oConstraints.iFractionDigits === 0 ? "" : oConstraints.iFractionDigits === -2 ? 0 : oConstraints.iFractionDigits
				}, {
					precision: oConstraints.iTotalDigits,
					scale: "variable",
					maximum: oConstraints.sMaximum,
					minimum: oConstraints.sMinimum,
					maximumExclusive: oConstraints.bMaxExclusive,
					minimumExclusive: oConstraints.bMinExclusive,
					nullable: false,
					maxLength: oConstraints.iMaxLength,
					minLength: oConstraints.iMinLength
				}, this.getResourceBundle());
			} else if (sTypeInfo === 'date') {
				oComboboxItem = new sap.ui.model.odata.type.Date();
			}
			oComboboxItem = new sap.ui.core.Item({
				text: {
					path: 'structuredDataModel>KEY',
					type: oComboboxItem
				}
			});
			oIntInputField.setProperty("showValueHelp", true);
			oIntInputField.bindAggregation("suggestionItems", "structuredDataModel>suggestions", oComboboxItem);
			oIntInputField.setProperty("showSuggestion", true);
		},

		// _getFieldModelData: function(oSourceFld){
		// 	var oFieldModelData;
		// 	var sPath = oSourceFld.getBindingContext("structuredDataModel").sPath;
		// 	var aFieldCustomData = oSourceFld.getCustomData();
		// 	var oParentControl = aFieldCustomData[2].getValue();
		// 	var oElementId = aFieldCustomData[1].getValue();
		// 	var oStructuredDataModel = oSourceFld.getModel("structuredDataModel");
		// 	if(oParentControl === 'table'){
		// 		oFieldModelData = oStructuredDataModel.getObject(sPath + "/E" + oSourceFld.getCustomData()[1].getValue());
		// 	}else{
		// 		oFieldModelData = oSourceFld.getBindingContext("structuredDataModel").getObject();
		// 	}
		// 	return oFieldModelData;
		// },

		_inputLiveChange: function (oEvent) {
			// On live change - setting decimal fraction digits
			var oSourceInput = oEvent.getSource();
			var sXsdBuiltInType = oSourceInput.getBindingContext("structuredDataModel").getObject().XsdBuiltInType;
			if (sXsdBuiltInType === 'date') {
				return;
			}
			var aCustomData = oSourceInput.getCustomData();
			var oTypeInfo = oSourceInput.getBinding('value').getType();
			// Exit for currency key field and amount fields without decimal type
			if (oSourceInput.getBinding("value").sPath.indexOf("_Currency") > -1 || !oTypeInfo.oFormat) {
				var oStructuredDataModel = oSourceInput.getModel("structuredDataModel");
				if (this.bIsCurrencyF4EntitySetAvailable && !oStructuredDataModel.getProperty("/currencyKeys")) {
					this._readCurrencyKeyF4Values();
				}
				return;
			}
			var oCurrentConstraints = oTypeInfo.oConstraints;
			var iSchemaFractionDigitIndicator = oSourceInput.getCustomData()[0].getValue();
			var iFractionsDigits;
			if (iSchemaFractionDigitIndicator === 0) { // unbound element 
				// Getting fractions by currency key
				if (aCustomData[3].getValue()) { // has reference element
					if (aCustomData[2].getValue() !== "table") {
						iFractionsDigits = sap.ui.core.format.NumberFormat.getCurrencyInstance().oLocaleData.getCurrencyDigits(oSourceInput.getParent()
							.getItems()[0].getValue());
					} else {
						iFractionsDigits = sap.ui.core.format.NumberFormat.getCurrencyInstance().oLocaleData.getCurrencyDigits(oSourceInput.getParent()
							.getItems()[1].getValue());
					}
				} else { //has no ref elements
					iFractionsDigits = "variable";
				}
			} else if (iSchemaFractionDigitIndicator === -2) {
				iFractionsDigits = 0;
			} else {
				iFractionsDigits = iSchemaFractionDigitIndicator;
			}
			// updating fractions digits to field type info
			oCurrentConstraints.scale = iFractionsDigits;
			oTypeInfo.oFormat.oFormatOptions.minFractionDigits = oCurrentConstraints.scale;
			oTypeInfo.setConstraints(oCurrentConstraints);
			// Updating Object status fraction digits
			//valid only for table cells as for forms we don't have object status control
			if (aCustomData[2].getValue() === "table") {
				var oObjectStsTypeInfo;
				if (aCustomData[3].getValue()) { //has reference element
					oObjectStsTypeInfo = oSourceInput.getParent().getParent().getItems()[0].getItems()[0].getBinding("text").getType();
				} else { //has no ref element
					oObjectStsTypeInfo = oSourceInput.getParent().getItems()[0].getBinding("text").getType();
				}
				oObjectStsTypeInfo.oFormat.oFormatOptions.minFractionDigits = oCurrentConstraints.scale;
			}
			var oCtxObject = oSourceInput.getBindingContext("structuredDataModel").getObject();
			if (oCtxObject["E" + aCustomData[1].getValue()]) {
				oCtxObject["E" + aCustomData[1].getValue()].lastValue = aCustomData[4].getValue();
			}
		},
		_getValueHelpValues: function (oEvent) {
			var sEventId = oEvent.getId();
			var oSourceFld = oEvent.getSource();
			var oInputData = Common._getFieldModelData(oSourceFld);
			if (oInputData.XsdBuiltInType !== 'date' && oInputData.MaxLength !== "" && oSourceFld.getValue().length > oInputData.MaxLength) {
				return;
			}
			var oInputFldMetadata = {
				multiInput: false,
				inputFld: oSourceFld,
				title: oInputData.LabelInfo,
				supportMultiselect: false,
				ValueHelpName: oInputData.Shlpname,
				ValueHelpParameter: oInputData.Shlpfield,
				CountValues: oInputData.CountValues,
				MaxLength: oInputData.typeInfo.MaxLength,
				model: oSourceFld.getModel(),
				HasCDSColumn: oInputData.HasCDSColumn,
				Controller: this
			};

			if (sEventId === "change") {
				oSourceFld.cancelPendingSuggest();
			}
			// var oCtxObj = oSourceFld.getBindingContext("structuredDataModel").getObject();
			var oCtxObj = Common._getFieldModelData(oSourceFld);
			var sBuiltInType = oCtxObj.typeInfo.XsdBuiltInType;
			if (oInputData.CountValues === 0) { //for search helps
				var aFilterValues = [];
				var oFilter = {
					PARAM_ID: oInputData.Shlpfield,
					SIGN: "I",
					SELOPT_OPTION: "EQ",
					LOW: oSourceFld.getValue() + '*',
					HIGH: ""
				};
				aFilterValues.push(oFilter);
				if (sEventId === "suggest" || sEventId === "change") { // search help suggestions
					SearchHelp._getValueHelpResult(oInputFldMetadata.model, oInputFldMetadata, aFilterValues, 10, sEventId);
				} else {
					this._triggerValueHelp(oInputFldMetadata);
				}
			} else if (oInputData.CountValues > 0) {
				var bDateOrDecimalVH = (sBuiltInType === "date" || sBuiltInType === "decimal");
				var bNotADecimalAndDateVH = (sBuiltInType !== "date" && sBuiltInType !== "decimal");
				if (bDateOrDecimalVH && sEventId === "change") { //For value helps with date type
					if (sBuiltInType === "decimal") {
						var oNumberFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance();
						//Get the domain values, if entered amount is in correct format
						if (oNumberFormat.format(oCtxObj.displayValue) === oSourceFld.getValue()) {
							SearchHelp._getDomainValueHelpValues(oSourceFld, oInputFldMetadata, oCtxObj.displayValue, sEventId);
						}
					} else {
						var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
							pattern: 'yyyyMMdd'
						});
						//Get the domain values, if entered date is in correct format
						if (oDateFormat.parse(oSourceFld.getValue()) !== null) {
							SearchHelp._getDomainValueHelpValues(oSourceFld, oInputFldMetadata, oCtxObj.displayValue, sEventId);
						}
					}
				} else if ((bNotADecimalAndDateVH && sEventId === "suggest") || sEventId === "change") { //for Domain suggestions
					SearchHelp._getDomainValueHelpValues(oSourceFld, oInputFldMetadata, "*" + oSourceFld.getValue() + "*", sEventId);
				} else if (bNotADecimalAndDateVH || sEventId === "valueHelpRequest") {
					this._triggerValueHelp(oInputFldMetadata);
				}
			}
		},

		_triggerValueHelp: function (oInputFldMetadata) {
			var fnOnValueHelpConfirm = function (oInput, oControlEvent, oValueHelpDialog) {
				var oCtx = oInput.getBindingContext("structuredDataModel");
				var oCtxObj = Common._getFieldModelData(oInput);
				var sSelectedValue = oControlEvent.getParameter("tokens")[0].getKey();
				if (oCtxObj.typeInfo.XsdBuiltInType === 'decimal') {
					var oNumberFormat = sap.ui.core.format.NumberFormat.getCurrencyInstance();
					sSelectedValue = oNumberFormat.format(sSelectedValue);
				}
				oInput.setValue(sSelectedValue);
				oCtxObj.displayValue = oControlEvent.getParameter("tokens")[0].getKey();
				oValueHelpDialog.close();
			};
			SearchHelp._handleValueHelpRequest(oInputFldMetadata, fnOnValueHelpConfirm);
		},

		_getCurrKeyInputControl: function (oBindingPaths) {
			var oStructuredDataModel = this.getView().getModel("structuredDataModel");
			var oCurrInputControl = this._getDefaultInputControl(oBindingPaths, true);
			// Enabling Currency key suggestions
			//If currency key f4 service is not available, don't set suggestions & value hep request
			this.bIsCurrencyF4EntitySetAvailable = !this.bIsCurrencyF4EntitySetAvailable ? ServiceMetadata.EntitySetAvailablility(this.getView()
				.getModel(), "VL_CT_TCURC") : this.bIsCurrencyF4EntitySetAvailable;
			if (this.bIsCurrencyF4EntitySetAvailable) {
				oCurrInputControl.addSuggestionColumn(
					new sap.m.Column({
						header: new sap.m.Label({
							text: "{i18n>xtit.currencyKey}"
						})
					}));
				oCurrInputControl.addSuggestionColumn(new sap.m.Column({
					header: new sap.m.Label({
						text: "{i18n>xtit.longText}"
					})
				}));
				var oSuggestionRowTemplate = new sap.m.ColumnListItem({
					cells: [
						new sap.m.Text({
							text: "{structuredDataModel>WAERS}"
						}),
						new sap.m.Text({
							text: "{structuredDataModel>LTEXT}"
						}),
					]
				});
				oCurrInputControl.bindSuggestionRows({
					path: "structuredDataModel>/currencyKeys",
					templateShareable: true,
					template: oSuggestionRowTemplate
				});
				oCurrInputControl.setShowSuggestion(true);
				oCurrInputControl.setMaxSuggestionWidth("22.75rem");
				oCurrInputControl.setShowValueHelp(true);
				oCurrInputControl.attachValueHelpRequest(function (oEvent) {
					this._onCurrencyKeyVHPress(oEvent);
				}.bind(this));
			}
			return oCurrInputControl;
		},

		/*Reading currency key f4 values*/
		_readCurrencyKeyF4Values: function () {
			var oView = this.getView();
			var oModel = oView.getModel();
			var oStructuredDataModel = oView.getModel("structuredDataModel");
			var sCurrencyKeyF4Path = "/VL_CT_TCURC";
			oModel.read(sCurrencyKeyF4Path, {
				async: false,
				success: function (oData) {
					oStructuredDataModel.setProperty("/currencyKeys", oData.results);
				},
				error: function (oError) {
					MessageHandler.showErrorMessage(oError);
				}
			});
		},

		/*this will be triggered On currency key valuehelp press*/
		_onCurrencyKeyVHPress: function (oEvent) {
			var oInput = oEvent.getSource();
			var sInputValue = oInput.getValue();
			var oStructuredDataModel = oInput.getModel("structuredDataModel");
			if (this.bIsCurrencyF4EntitySetAvailable && !oStructuredDataModel.getProperty("/currencyKeys")) {
				this._readCurrencyKeyF4Values();
			}
			if (!this._oCurrencyKeyVHDialog) {
				Fragment.load({
					name: "gs.fin.runstatutoryreports.s1.fragment.CurrencyKeyValueHelp",
					controller: this
				}).then(function (oFragment) {
					this._oCurrencyKeyVHDialog = oFragment;
					this._oCurrencyKeyVHDialog.isOpened = true;
					this.getView().addDependent(this._oCurrencyKeyVHDialog);

					// Create a filter for the binding
					this._oCurrencyKeyVHDialog.getBinding("items")
						.filter([new Filter("WAERS", "Contains", sInputValue)]);
					// Open ValueHelpDialog filtered by the input's value
					this._oCurrencyKeyVHDialog.open(sInputValue);
					this._oCurrencyKeyVHDialog.sourceInputId = oInput.getId();
				}.bind(this));
			} else {
				// Create a filter for the binding
				this._oCurrencyKeyVHDialog.getBinding("items")
					.filter([new Filter("WAERS", "Contains", sInputValue)]);
				// Open ValueHelpDialog filtered by the input's value
				this._oCurrencyKeyVHDialog.open(sInputValue);
				this._oCurrencyKeyVHDialog.isOpened = true;
				this._oCurrencyKeyVHDialog.sourceInputId = oInput.getId();
			}
		},

		onCurrencyKeyVHSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("WAERS", "Contains", sValue);

			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		onCurrencyKeyVHClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			oEvent.getSource().getBinding("items").filter([]);
			if (!oSelectedItem) {
				return;
			}
			var oSelectedInput = sap.ui.getCore().byId(this._oCurrencyKeyVHDialog.sourceInputId);
			var sElementId = oSelectedInput.getCustomData()[1].getValue();
			var sInitialInputValue;
			var oAmountData = oSelectedInput.getBindingContext("structuredDataModel").getObject();
			if (sElementId !== "") {
				sInitialInputValue = oAmountData["E" + sElementId + "_Currency"].displayValue;
			} else {
				sInitialInputValue = oAmountData["currencyData"].displayValue;
			}
			var bHasCurrencyKeyDiff = sInitialInputValue !== oSelectedItem.getTitle();
			this._oCurrencyKeyVHDialog.isOpened = false;
			oSelectedInput.setValue(oSelectedItem.getTitle());

			if (bHasCurrencyKeyDiff) {
				oSelectedInput.fireChange();
			}
		},

		_handleValidationError: function (oEvent) {
			this._updateMessageMangerModelMessages(oEvent, "Error");
		},

		_handleValidationSuccess: function (oEvent) {
			this._updateMessageMangerModelMessages(oEvent, "Information");
		},

		_updateMessageMangerModelMessages: function (oEvent, sMessageType) {
			//controlId used for storing Messages in MessageManager for already saved change
			var oSource = oEvent.getSource();
			var oCurrentDataObject = oSource.getBindingContext("structuredDataModel").getObject();
			oCurrentDataObject.controlId = oEvent.getSource().getId();
			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.registerMessageProcessor(oMessageProcessor);
			var aMessages = oMessageManager.getMessageModel().getData();
			var sMessageTarget = oEvent.getSource().getId() + '/value';
			var aCustomMessageModel = this.getModel("messageModel").getData();

			/*If the changed value is currency key, create message against binding value not the against control, 
				as we have same currency key bound to different controls */
			// if(oEvent.getSource().getBindingInfo("value").parts[0].path.indexOf('currencyData') !== -1){
			// 	sMessageTarget = oEvent.getSource().getBindingInfo("value").parts[0].path;
			// }
			var iMessageIdx;
			var bMessageExists = aMessages.some(function (oMessage, idx) {
				iMessageIdx = idx;
				return sMessageTarget === oMessage.target;
			}.bind(this));
			if (bMessageExists) {
				oMessageManager.removeMessages([aMessages[iMessageIdx]]);
			}
			var sBindingProperty = oEvent._control === 'Select' ? 'selectedKey' : 'value';
			var sValueBindingPath = oEvent.getSource().getBindingInfo(sBindingProperty).parts[0].path.split("/")[0];
			/* For form input get the label text and for table cell get LabelInfo(column text) */
			var sAdditionalText, FormFld;
			if (sValueBindingPath === "displayValue") {
				/*If changed field has currency key get parent(hbox) label*/
				// changes for displaying attributes as a form
				FormFld = oEvent.getSource().getParent().getParent().getParent();
				sAdditionalText = FormFld.getLabel ? FormFld.getLabel().getText() : FormFld.getParent().getLabel().getText();
			} else {
				sAdditionalText = oCurrentDataObject[sValueBindingPath].LabelInfo;
			}

			var oNewMessage = new sap.ui.core.message.Message({
				message: "",
				type: sap.ui.core.MessageType.Information, //Interoperability
				target: sMessageTarget,
				processor: oMessageProcessor,
				persistent: true,
				additionalText: sAdditionalText
			});

			if (this._isBetaVersion("ErrorWarning")) {
				var aCustomMessageModel = this.getModel("messageModel").getData();
				var oCtxCurrentObject, oHierarchyObject, sParentElementId;
				var oHierarchyControl = this.byId("BeginPages--DPNestedTree");

				if (oCurrentDataObject.ElementId) { //FORM
					oCtxCurrentObject = oCurrentDataObject;
					oCurrentDataObject.MessageSeverity = sMessageType === "Error" ? "E" : "";
					oCurrentDataObject.MessageText = oEvent.getParameter("message") ? oEvent.getParameter("message") : "";
				} else {
					sParentElementId = oCurrentDataObject[sValueBindingPath].ParentElementId; //TABLE
					oCtxCurrentObject = oCurrentDataObject[sValueBindingPath];
					oCurrentDataObject[sValueBindingPath].MessageSeverity = sMessageType === "Error" ? "E" : "";
					oCurrentDataObject[sValueBindingPath].MessageText = oEvent.getParameter("message") ? oEvent.getParameter("message") : "";
				}

				//Get the number of messages that will get removed from the log
				oHierarchyObject = PreviewErrorWarning.getHierarchyContext(oHierarchyControl.getItems(), oSource.getBindingContext(
					"structuredDataModel").getPath(), this);
				var oCounterDetails = PreviewErrorWarning.deleteMessageFooterLog(aCustomMessageModel, oCtxCurrentObject, this);
				PreviewErrorWarning.hierarchyCountUpdateViaPath({
					oContext: oHierarchyObject,
					DeletionCount: oCounterDetails,
					oContextEvent: oEvent,
					oController: this,
					MessageType: sMessageType
				});
			}

			if (sMessageType === "Error") {
				var oEventParameters = oEvent.getParameters();
				// DONT' DELETE *************
				// Commenting because of error/warning feature. User overrides initial value to something. Adding back initial value will still show error from UI becuase of error/warning feature.
				// Upon saving it with error backend will skip due to intial value validation.

				if (oCurrentDataObject.MinOccurs === 0) { // optional element
					var value = oEventParameters.newValue;
					// When the optional element value is changed to it's initial value and also it's the value of this element on generation, no need to validate the element
					var oStatus = this.getInitialValueStatusForTypes(oSource.getBindingContext("structuredDataModel"), value);
					if (oStatus.isInitial) {
						// DisplayValue property in the object holds the value like this (eg: 12345.98) and not (12.345,98)
						// On attachPropertyChange when you change the value in the control, it'll look in a locally formatted way( depending on SU01 settings),
						// But even then the displayValue will be raw formatted, hence doing the same here, cause the new value which comes from the control is locally formatted
						oCurrentDataObject.displayValue = oStatus.formattedValue;
						this.getView().getModel("structuredDataModel").checkUpdate(true);
						return;
					}
				}

				oSource.setShowValueStateMessage(true);
				oNewMessage.type = sMessageType;
				oNewMessage.message = oEventParameters.message;
				oMessageManager.addMessages(oNewMessage);

				// identifying errors in add row popup
				if (oEvent.getSource().getBindingContext("structuredDataModel").sPath.indexOf("NewRowContext") > -1) {
					oNewMessage.errorInPopup = true;
				}

				//Error & Warning changes
				if (this._isBetaVersion("ErrorWarning")) {
					PreviewErrorWarning.addMessageFooterLog({
						"CustomMessageModel": aCustomMessageModel,
						"CurrentContext": oCtxCurrentObject,
						"Message": oEventParameters.message,
						"AdditionalText": sAdditionalText,
						"MessageTarget": sMessageTarget
					}, this);

					/*var oCtx = oSource.getBindingContext("structuredDataModel");
					var sPath = oEvent.getSource().getBindingInfo(sBindingProperty).parts[0].path;
					var bChangedEventAlreadyExist = this.checkIfElementExistsInChangedElements(sPath, oCtx);
					//oCtxCurrentObject.ErrorValueCapture = this.handleErrorValueCapture(oEvent, oCtxCurrentObject);
					if (!bChangedEventAlreadyExist) {
						this.updateChangedElements(oCtx, sPath, oCtxCurrentObject);
					}*/
					if (sValueBindingPath === "displayValue") {
						oCurrentDataObject.displayValue = oEvent.getSource().getValue();
					} else {
						oCurrentDataObject[sValueBindingPath].displayValue = oEvent.getSource().getValue();
					}
				}
			} else {
				/* Add New message if this is new change
					for Form sValueBindingPath will be 'displayValue'
					for Table cell sValueBindingPath will be ElementId 'E0000000001'
				*/
				if (this._isBetaVersion("ErrorWarning")) {
					delete oCtxCurrentObject.ErrorValueCapture;
					//this.getView().getModel("structuredDataModel").checkUpdate(true);
				}
				if ((sValueBindingPath === "displayValue" && oCurrentDataObject.ChangeIndicator === "UM") ||
					(sValueBindingPath !== "displayValue" && oCurrentDataObject[sValueBindingPath].ChangeIndicator === "UM")) {
					//  Dont set the value state message for Select Control.
					if (oEvent._control !== "Select") {
						oSource.setShowValueStateMessage(false);
					}
					oMessageManager.addMessages(oNewMessage);
				}
			}
			if (this._isBetaVersion("ErrorWarning")) {
				//Incase of generated value is 2022 & Manual adjustment is 20 ( Warning issued) SAVE
				//Readjusting the value to 20 -> 2022 (Value state shows none because it matches generated value)
				//This gets skipped in capturing into ChangedElements due to valueStateNone
				var oCtx = oSource.getBindingContext("structuredDataModel");
				var sPath = oEvent.getSource().getBindingInfo(sBindingProperty).parts[0].path;
				var bChangedEventAlreadyExist = this.checkIfElementExistsInChangedElements(sPath, oCtx);
				if (!bChangedEventAlreadyExist && oCtx.sPath.indexOf("NewRowContext") === -1) {
					this.updateChangedElements(oCtx, sPath, oCtxCurrentObject);
				}
				this.getView().getModel("structuredDataModel").checkUpdate(true); //Model > View
			}
			this.showMessagePopover();
		},

		/*handleErrorValueCapture: function (oEvent, oCtxCurrentObject) {
			var sInputString = oEvent.getSource().getValue(); //getSelectedKey() 
			var sXsdBuiltInType = oCtxCurrentObject.XsdBuiltInType;
			switch (sXsdBuiltInType) {
			case 'integer':
			case 'int':
			case 'decimal':
			case 'double':
			case 'float':
				var oNumberInstance = sap.ui.core.format.NumberFormat.getCurrencyInstance();
				sInputString = sInputString.replaceAll(oNumberInstance.oFormatOptions.groupingSeparator, "");
				sInputString = sInputString.replaceAll(oNumberInstance.oFormatOptions.decimalSeparator, ".");
				break;
			};
			return sInputString;
		},*/

		_getObjectStatusControl: function (oParams) {
			return new ObjectStatus({
				state: oParams.valueStatePath,
				// As sequence number will always be readonly so kepping the column cell as object status always
				visible: oParams.visiblePath,
				text: oParams.textBindingPath,
				tooltip: oParams.tooltipPath
			});
		},

		_getTableControl: function (sId, oCtx) {
			var oReferenceNodesbyId = this.getView().getModel("MetadataById").getData().referenceElementNodes;
			var oTable = new Table({
				id: oCtx.getObject().id,
				extension: [new sap.m.OverflowToolbar({
					content: [new Title({
							text: "{structuredDataModel>ParentLabelInfo}{structuredDataModel>LabelInfo} ({structuredDataModel>rowCount})",
							tooltip: "{structuredDataModel>ParentLabelInfo}{structuredDataModel>LabelInfo} ({structuredDataModel>rowCount})"
						}),
						new ToolbarSpacer(),
						new sap.m.SearchField({
							value: "{structuredDataModel>searchString}",
							width: "20%",
							search: function (oEvent) {
								var sQuery = oEvent.getSource().getValue();
								var oTableContextObject = oCtx.getObject();
								oTableContextObject.searchString = sQuery;
								oTableContextObject.data = [];
								oTableContextObject.HiddenColumns = [];
								oTableContextObject.sequenceNumbers = {};
								if (oTableContextObject.totalRow) { // in case of search and totals exits then remove the total row.
									delete oTableContextObject.totalRow;
									oTableContextObject.bAddTotalsObject = false;
								}
								var bMidColumnLayout = oCtx.getPath().includes("_Children");
								this.getView().byId("PreviewFCL").setLayout(bMidColumnLayout ? sap.f.LayoutType.TwoColumnsBeginExpanded : sap.f.LayoutType
									.OneColumn);
								// Check if there's any manual adjustment made. First save changes & then proceed with fetch.
								var fnCallback = function () {
									this.readGeneratedData(oTableContextObject, "", oTableContextObject.selectedHyperLink, false, true);
								}.bind(this);
								this.checkChangedElementsBeforeAction(fnCallback);
							}.bind(this)
						}),
						new Button({
							type: "Transparent",
							text: "{i18n>xtit.visualization.btn.addRow}",
							visible: "{=${structuredDataModel>/editable} && ${structuredDataModel>isAddDeleteEnabled} && !${structuredDataModel>hasFurtherChildren}}",
							enabled: "{=!${structuredDataModel>isParentDeleted}}",
							press: this._onAddNewRow.bind(this)
						}),
						new Button({
							type: "Transparent",
							text: "{i18n>xtit.visualization.btn.deleteRow}",
							visible: "{=${structuredDataModel>/editable} && ${structuredDataModel>isAddDeleteEnabled} && !${structuredDataModel>hasFurtherChildren}}",
							enabled: false,
							press: this._onDeleteRow.bind(this)
						}),
						new Button({
							type: "Transparent",
							text: "{i18n>xtit.visualization.btn.unDeleteRow}",
							visible: "{=${structuredDataModel>/editable} && ${structuredDataModel>isAddDeleteEnabled} && !${structuredDataModel>hasFurtherChildren}}",
							enabled: false,
							press: this.unDoDelete.bind(this)
						}),
						new Button({
							type: "Transparent",
							text: "{i18n>copy}",
							visible: "{=${structuredDataModel>/editable} && ${structuredDataModel>isAddDeleteEnabled} && !${structuredDataModel>hasFurtherChildren}}",
							enabled: false,
							press: this.onCopy.bind(this)
						}),
						new sap.m.MultiComboBox({
							placeholder: "{i18n>xtit.visualization.filterBy}",
							width: "15%",
							showSelectAll: true,
							visible: "{structuredDataModel>isAddDeleteEnabled}",
							selectedKeys: "{structuredDataModel>filterKey}",
							selectionFinish: function (oEvent) {
								var sFilterKey = oEvent.getSource().getSelectedKeys();
								var oTableContextObject = oCtx.getObject();
								oTableContextObject.filterKey = sFilterKey;
								oTableContextObject.data = [];
								oTableContextObject.sequenceNumbers = {};

								if (oTableContextObject.totalRow) { // in case of search and totals exits then remove the total row.
									delete oTableContextObject.totalRow;
									oTableContextObject.bAddTotalsObject = false;
								}

								var bMidColumnLayout = oCtx.getPath().includes("_Children");
								this.getView().byId("PreviewFCL").setLayout(bMidColumnLayout ? sap.f.LayoutType.TwoColumnsBeginExpanded : sap.f.LayoutType
									.OneColumn);

								// Check if there's any manual adjustment made. First save changes & then proceed with fetch.
								var fnCallback = function () {
									this.readGeneratedData(oTableContextObject, "", oTableContextObject.selectedHyperLink, false, true);
								}.bind(this);
								this.checkChangedElementsBeforeAction(fnCallback);
							}.bind(this),
							items: [
								// new sap.ui.core.Item({"key": "", "text":"{i18n>xtit.visualization.all}"}),
								new sap.ui.core.Item({
									"key": "N",
									"text": "{i18n>xtit.new}"
								}),
								new sap.ui.core.Item({
									"key": "D",
									"text": "{i18n>xtit.deleted}"
								}),
								new sap.ui.core.Item({
									"key": "M",
									"text": "{i18n>xtit.visualization.manuallyAdjusted}"
								}),
								new sap.ui.core.Item({
									"key": "E",
									"text": "{i18n>xtit.error}"
								}),
								new sap.ui.core.Item({
									"key": "W",
									"text": "{i18n>xtit.warning}"
								})
							]
						}),
						new Button({
							type: "Transparent",
							text: "{i18n>xtit.visualization.btn.showTotals}",
							visible: "{=${structuredDataModel>/sDocumentFormat} === 'ALV' && ${structuredDataModel>bOnLoadAddTotalsObject} && !${structuredDataModel>bAddTotalsObject}}",
							press: this._showOrHideALVTableTotals
						}).data('button', 'show'),
						new Button({
							type: "Transparent",
							text: "{i18n>xtit.visualization.btn.hideTotals}",
							visible: "{=${structuredDataModel>/sDocumentFormat} === 'ALV' && ${structuredDataModel>bOnLoadAddTotalsObject} && ${structuredDataModel>bAddTotalsObject}}",
							press: this._showOrHideALVTableTotals
						}).data('button', 'hide'),
						new OverflowToolbarButton({
							type: "Transparent",
							icon: "sap-icon://excel-attachment",
							tooltip: this.getResourceBundle().getText("xbut.exportToExcelTxt"),
							press: this.onExportButtonPress.bind(this)
						}),
						new OverflowToolbarButton({
							type: "Transparent",
							icon: "sap-icon://action-settings",
							tooltip: this.getResourceBundle().getText("xbut.settings"),
							press: this.onTablePersoPress.bind(this)
						})
					]
				})],
				rows: {
					path: 'structuredDataModel>data',
					sorter: new Sorter({
						path: 'SequenceNo',
						descending: false
					})
				},
				selectionMode: "{=${structuredDataModel>/editable} && ${structuredDataModel>isAddDeleteEnabled} && !${structuredDataModel>hasFurtherChildren} ? 'MultiToggle' : 'None'}",
				threshold: 10,
				fixedBottomRowCount: "{= ${structuredDataModel>bAddTotalsObject} ? 1 : 0}",
				visibleRowCount: '{=${structuredDataModel>rowCount} > 10 ? 10 : ${structuredDataModel>rowCount} + (${structuredDataModel>bAddTotalsObject} ? 1 : 0)}',
				columnResize: function (oEvent) {
					// Setting column width got by resizing
					oEvent.getParameter("column").setWidth(oEvent.getParameter("width"));
				},
				visibleRowCountMode: "Interactive",
				minAutoRowCount: 1,
				rowSelectionChange: function (oEvent) {
					if (!oCtx.getObject().isParentDeleted) {
						var oTable = oEvent.getSource();
						var aSelectedIndices = oTable.getSelectedIndices();
						var oDeleteBtn = oTable.getExtension()[0].getContent()[4];
						var oUndoDeleteBtn = oTable.getExtension()[0].getContent()[5];
						var oCopyBtn = oTable.getExtension()[0].getContent()[6];
						// oUndoDeleteBtn.setEnabled(false);  // Set undo to false for each selection change.
						var aTableControlData = oTable.getBindingContext("structuredDataModel").getObject();
						var sContainerElementId = aTableControlData.ElementId;
						var bEnableDelete = aSelectedIndices.length > 0;
						var bEnableUndo = aSelectedIndices.length > 0;
						var bEnableCopy = aSelectedIndices.length === 1;
						aSelectedIndices.forEach(function (iIndex) {
							var sChangeIndicator = aTableControlData.data[iIndex]["S" + sContainerElementId].ChangeIndicator;
							if (sChangeIndicator !== "DM") {
								bEnableUndo = false;
							}
							if (sChangeIndicator === "DM") {
								bEnableDelete = false;
								bEnableCopy = false;
							}
						});
						oDeleteBtn.setEnabled(bEnableDelete && !bEnableUndo);
						oUndoDeleteBtn.setEnabled(bEnableUndo && !bEnableDelete);
						oCopyBtn.setEnabled(bEnableCopy);
					}
				}.bind(this),
				rowSettingsTemplate: [new sap.ui.table.RowSettings({
					highlight: "{=(${structuredDataModel>S" + oCtx.getObject().ElementId +
						"/ChangeIndicator} === 'CM' || ${structuredDataModel>S" + oCtx.getObject().ElementId +
						"/ChangeIndicator} === 'DM') ? 'Information' : 'None'}"
				})],
				firstVisibleRowChanged: function (oEvent) {
					var oTableContextObject = oEvent.getSource().getBindingContext("structuredDataModel").getObject();
					var iTableDataLength = oTableContextObject.data.length;
					var bTotalRowAvailable = oTableContextObject.totalRow && oTableContextObject.bAddTotalsObject;
					if (oEvent.getSource().getFirstVisibleRow() + oEvent.getSource().getVisibleRowCount() === iTableDataLength) {
						var oParentNodeData = oTableContextObject.selectedHyperLink;
						var iTableLengthWithoutTotalRow = bTotalRowAvailable ? iTableDataLength - 1 : iTableDataLength;
						if (oParentNodeData && iTableLengthWithoutTotalRow < oParentNodeData.data("rowCount")) {
							if (bTotalRowAvailable) { // If total row exists delete the totals row and do the lazy loading calculations.
								oTableContextObject.data.splice(iTableDataLength - 1, 1);
							}
							this.readGeneratedData(oTableContextObject, "", oParentNodeData);
						}
						// Total row count - total table data length > 0 && last visible row count === table data length
						// Lazy load scenario for Parent table when the number of rows are equal to mutiples of 400
						else if (!oParentNodeData && iTableDataLength < oTableContextObject.rowCount) {
							if (bTotalRowAvailable) { // If total row exists delete the totals row and do the lazy loading calculations.
								oTableContextObject.data.splice(iTableDataLength - 1, 1);
							}
							this.readGeneratedData(oTableContextObject);
						}
					}
				}.bind(this)
			});

			oTable.bindColumns({
				path: "structuredDataModel>columns",
				sorter: new Sorter({
					path: 'OrdinalNumber',
					descending: false
				}),
				templateShareable: false,
				factory: function (sId, oCtx) {
					var oColumnData = oCtx.getObject();
					var sTypeInfo = oCtx.getObject().typeInfo ? oCtx.getObject().typeInfo.XsdBuiltInType : undefined;
					var oColumnAlighment = sTypeInfo === "decimal" || sTypeInfo === "double" || sTypeInfo === "float" || sTypeInfo === "int" ||
						sTypeInfo === "integer" ? "Right" : "Left";
					//getting colums length using context path & model
					var iColLength = oCtx.getObject(oCtx.sPath.substring(0, oCtx.sPath.length - 2)).length;
					//Preparing multilabels
					var aMultiLabels = [];
					var oControlTemplate;
					if (oColumnData.aMultiLabels.length > 1) {
						oColumnData.aMultiLabels.map(function (oMultiLabel, idx) {
							aMultiLabels.push(new Label({
								text: oMultiLabel.labelInfo,
								tooltip: oMultiLabel.Description,
								textAlign: "Center",
								width: "100%",
								wrapping: true
							})); //parent(Main) label
							if (idx !== 0) {
								aMultiLabels[idx].setTextAlign(oColumnAlighment);
								oControlTemplate = this._getTableCellControl(oColumnData, oMultiLabel, oCtx);
								if (oControlTemplate.getItems()[1]) {
									oControlTemplate.getItems()[1].addAssociation("ariaLabelledBy", aMultiLabels[1].getId());
								}
							}
						}.bind(this));
						// iAttributesLength - Row level attributes length
						var iHeaderSpan = oColumnData.bTableAttribute ? oColumnData.iAttributesLength : oColumnData.attributes.length + 1;
					} else {
						var oLabel = new Label({
							text: oColumnData.LabelInfo,
							textAlign: oColumnAlighment,
							tooltip: oColumnData.Description,
							width: "100%",
							wrapping: true
						});
						aMultiLabels.push(oLabel);
						oControlTemplate = this._getTableCellControl(oColumnData, oColumnData, oCtx);
						var iHeaderSpan = 1;
						if (oControlTemplate.getItems()[1]) {
							oControlTemplate.getItems()[1].addAssociation("ariaLabelledBy", oLabel.getId());
						}
					}
					return new Column({
						id: oColumnData.id, //id neede for Table PersoController to work
						multiLabels: aMultiLabels,
						template: oControlTemplate,
						hAlign: oColumnAlighment,
						resizable: true,
						headerSpan: [iHeaderSpan, 1],
						visible: oReferenceNodesbyId[oColumnData.ElementId] ? false : true
						// visible: oReferenceNodesbyId[oColumnData.ElementId] || oColumnData.FieldVisibilityInd === '' ? false : true
					}).data("ElementId", oColumnData.ElementId);
				}.bind(this)
			});

			// Added delegate to adust the columns width after removing/adding columns through TablePersoController.
			// This will be triggered on change of columns through TablePersoController
			oTable.addEventDelegate({
				// This should be called for first time and when there is change in columns visibility
				onAfterRendering: function (oEvent) {
					var oTable = oEvent.srcControl;
					// bRenderOnAfter will be true for first time rendering and after TabelPersocontroller opened
					if (oTable._bRenderOnAfter) {
						oTable._bRenderOnAfter = false;
						var iTableTotalColWidth = this._getTableTotalColumnWidth(oEvent);
						/* If table cols total max length is lessthan total table width and column auto width is less than the column individual width, set the column width to auto else set to column  */
						// Checking table columns total max length is less than Table total ui width
						//Removing the side paddings of table with iTableHierarchy.
						var iTableHierachyIdx = (oTable.getBindingContext("structuredDataModel").sPath.split("/controls").length - 1) * 30 + 30;
						var bSetAutowidth = iTableTotalColWidth * 16 < ($(window).width() - iTableHierachyIdx);
						/*Based on actual total colums width and screen width calculating the column width*/
						oTable.getColumns().map(function (oColumn, idx) {
							if (oColumn.getVisible()) {
								var currentColumn = oTable.getBindingContext("structuredDataModel").getObject().columns[idx];
								var sCurrentColumnWidth = this._getColumnWidth(currentColumn, bSetAutowidth);
								// getting column width in pixels, if it is auto
								var sAutoWidth = ($(window).width() - iTableHierachyIdx) / oTable.getColumns().length;
								// if auto width is less than columns max length width set width to columns max length width
								var bIsAutoWidthLessThanMaxLength = sAutoWidth < sCurrentColumnWidth * 16;
								//  For sequence numnber check the numnber of entried in the table. Take the string length of it. If it is not more set it dynamically. Else default is 5 rem. 
								var iTableRowsCount = oTable._getRowCounts().count.toString().length;
								if (currentColumn.ElementId === currentColumn.ParentElementId) {
									oColumn.setWidth(iTableRowsCount > 5 ? iTableRowsCount + "rem" : "5rem");
								} else {
									if (bSetAutowidth && !bIsAutoWidthLessThanMaxLength) {
										oColumn.setWidth("auto");
									} else {
										oColumn.setWidth(sCurrentColumnWidth + "rem");
									}
								}
							}
						}.bind(this));
					}
				}.bind(this)
			});
			oTable._bRenderOnAfter = true;
			var oTablePanel = new Panel({
				content: oTable,
				visible: "{structuredDataModel>visible}"
					// visible: "{=${structuredDataModel>originalRowCount} === 1 ? (${structuredDataModel>/editable} ? ${structuredDataModel>visible} : false): ${structuredDataModel>visible}}"
					// visible: {

				// 	parts: [{
				// 		path: 'structuredDataModel>/editable'
				// 	}, {
				// 		path: 'structuredDataModel>originalRowCount'
				// 	}, {
				// 		path: 'structuredDataModel>visible'
				// 	}],
				// 	formatter: function(sEditable, iOriginalRowCount, bVisible){
				// 		// debugger;
				// 		if(iOriginalRowCount === 1){
				// 			if(sEditable){
				// 				return bVisible;
				// 			}else{
				// 				return false;
				// 			}
				// 		}else{
				// 			return bVisible;
				// 		}
				// 	}

				// }
			});
			return oTablePanel;
		},

		/*Show or Hide ALV data preview tables totals*/
		_showOrHideALVTableTotals: function (oEvent) {
			var oTableControl = oEvent.getSource().getParent().getParent();
			var oStructuredDataModel = oEvent.getSource().getModel("structuredDataModel");
			var oTableContext = oEvent.getSource().getBindingContext("structuredDataModel");
			var oTableData = oTableContext.getObject().data;
			if (oEvent.getSource().data('button') === 'hide') {
				oStructuredDataModel.setProperty(oTableContext.sPath + "/bAddTotalsObject", false);
				oTableData.splice(oTableData.length - 1, 1);
			} else {
				oStructuredDataModel.setProperty(oTableContext.sPath + "/bAddTotalsObject", true);
				oTableData.push(oTableContext.getObject().totalRow);
			}
			oEvent.getSource().getParent().getParent().setVisibleRowCount(oTableData.length);
			oStructuredDataModel.setProperty(oTableContext.sPath + "/data", oTableData);
			oTableControl.setVisibleRowCount(oTableData.length > 10 ? 10 : oTableData.length);
			oStructuredDataModel.checkUpdate();
		},

		/*Calculatin the total columns width for setting each column width 1Char = 8px; and 1rem = 16px*/
		_getTableTotalColumnWidth: function (oEvent) {
			var aColumns = oEvent.srcControl.getColumns();
			var aColumnData = oEvent.srcControl.getBindingContext("structuredDataModel").getObject().columns;
			var iTotalWidth = 0;
			for (var iColIdx = 0; iColIdx < aColumnData.length; iColIdx++) {
				var oColumn = aColumnData[iColIdx];
				if (aColumns[iColIdx] && aColumns[iColIdx].getVisible()) {
					//1char = 8px = 0.5rem
					// As Sequence number is the first column always, set the width to 5 so that the column is rendered with proper width
					if (iColIdx === 0) {
						iTotalWidth = 5;
					} else {
						iTotalWidth += oColumn.maxDataLength && oColumn.maxDataLength * 0.5 > 8 ? oColumn.maxDataLength * 0.5 : 8;
					}
				}
			}
			return iTotalWidth;
		},

		onExportButtonPress: function (oEvent) {
			var oExportButton = oEvent.getSource();
			var oResBundle = this.getResourceBundle();
			var oSelectedTable = oExportButton.getBindingContext("structuredDataModel").getObject();
			var iTotalCellCount = oSelectedTable.columns.length * oSelectedTable.rowCount;
			var iLimitCount = sap.ui.Device.system.desktop ? 1000000 : 100000;
			if (iTotalCellCount > iLimitCount) {
				sap.m.MessageBox.error(oResBundle.getText("xmsg.visualization.exportToExcelMaxLimit", [oSelectedTable.rowCount, oSelectedTable.columns
					.length
				]), {
					icon: MessageBox.Icon.ERROR,
					title: oResBundle.getText("xtit.error")
				});
			} else {
				//Read all table data
				if (oSelectedTable.totalRow) { // If total row exists delete the totals row and do the lazy loading calculations.
					oSelectedTable.data.splice(oSelectedTable.data.length - 1, 1);
				}
				oSelectedTable.oExportButton = oExportButton;
				if (oSelectedTable.data.length < oSelectedTable.rowCount) {
					oSelectedTable.bDownload = true;
					this.readGeneratedData(oSelectedTable);
				} else {
					this._proceedExportToExcel(oSelectedTable);
				}

				// var oTableParentNodePathSplit = oExportButton.getBindingContext("structuredDataModel").sPath.split("/");
				// oTableParentNodePathSplit.splice(oTableParentNodePathSplit.length - 2, 2);
				// var oTableParentObject = oExportButton.getBindingContext("structuredDataModel").getObject(oTableParentNodePathSplit.join("/"));
			}
		},

		_proceedExportToExcel: function (oTablContextObject) {
			var oExportButton = oTablContextObject.oExportButton;
			var oTableColumns = oExportButton.getParent().getParent().getColumns();
			var aColumns = [];
			var bHasNestedTable = false;
			var bAreColumnVisible = false;

			oTableColumns.map(function (oColumn, idx) {
				/*Only visible columns and columns with no children will be exported*/
				if (oColumn.getVisible()) {
					bAreColumnVisible = oColumn.getVisible();
					var oColumnObject = oColumn.getBindingContext("structuredDataModel").getObject();
					if (!oColumnObject.hasChildren) {
						var sDataType = this._getExcelColumnType(oColumnObject.typeInfo.XsdBuiltInType);
						var aMultiLabels = oColumn.getMultiLabels();
						var sColumnLabelInfo = oColumnObject.LabelInfo;
						//If multiLabels are morethan 1, we need to prepare column label with parent header(Element) & sub header (attribute/Value)
						// var sLabel = aMultiLabels.length > 1 ? aMultiLabels[0].getText() + " - " + aMultiLabels[1].getText() : aMultiLabels[0].getText();
						var sLabel;
						if (aMultiLabels.length > 1 && sColumnLabelInfo === aMultiLabels[1].getText()) {
							sLabel = sColumnLabelInfo;
						} else if (aMultiLabels.length > 1 && sColumnLabelInfo !== aMultiLabels[1].getText()) {
							sLabel = sColumnLabelInfo + " - " + aMultiLabels[1].getText();
						} else {
							sLabel = aMultiLabels[0].getText();
						}

						//In case of columns with referenceElementID, there will be a HBox for values and currency unit. So differenciating for the "property" based on ReferenceElementId
						aColumns.push({
							label: sLabel,
							property: oColumnObject.ReferenceElementId !== "" ? oColumn.getTemplate().getItems()[0].getItems()[0].getBindingInfo(
									"text")
								.parts[0].path : oColumn.getTemplate().getItems()[0].getBindingInfo("text").parts[0].path,
							type: sDataType,
							delimiter: true,
							unitProperty: sDataType === "Currency" ? "E" + oColumnObject.ElementId + "_Currency/displayValue" : "",
							displayUnit: sDataType === "Currency" ? true : false
						});
					} else {
						bHasNestedTable = true;
					}
				}
			}.bind(this));
			var oResourceBundle = this.getResourceBundle();
			var sDeletedRowsExportInfo = "";
			if (this._isBetaVersion("Add/Delete")) {
				sDeletedRowsExportInfo = oResourceBundle.getText("xmsg.messageToast.deletedRowsExportInfo");
			}
			if (bHasNestedTable) {
				sDeletedRowsExportInfo = sDeletedRowsExportInfo + "\n" + oResourceBundle.getText(
					"xmsg.messageToast.exportExcelExcludedNestedTableVlaues");
			}
			if (sDeletedRowsExportInfo.length > 0) {
				sap.m.MessageBox.show(sDeletedRowsExportInfo, {
					icon: MessageBox.Icon.INFORMATION,
					title: oResourceBundle.getText("xmsg.header.information")
				});
			}
			if (!bAreColumnVisible) {
				sap.m.MessageBox.show(oResourceBundle.getText("xmsg.messageToast.exportExcelWithNoRows"), {
					icon: MessageBox.Icon.INFORMATION,
					title: oResourceBundle.getText("xmsg.header.information")
				});
			}
			var oSettings = {
				workbook: {
					columns: aColumns
				},
				dataSource: oTablContextObject.data,
				fileName: oTablContextObject.ParentLabelInfo.split("->")[0] + "-" + oTablContextObject.LabelInfo,
				showProgress: false
			};
			var oParamData = this.getView().getModel("paramModel").getData();
			if (oParamData.repCatId !== "DP_WITH_ADD_DELETE") { //incase of OPA, blocking exporting 
				new Spreadsheet(oSettings).build();
			}
			oTablContextObject.bDownload = false;
		},

		_getExcelColumnType: function (sType) {
			switch (sType) {
			case "int":
			case "integer":
			case "long":
				return "Number";
				break;
			case "decimal":
			case "double":
			case "float":
				return "Currency";
				break;
			default:
				return "String";
				break;
			}
		},

		// Table Personalization settings
		onTablePersoPress: function (oEvent) {
			var oTable = oEvent.getSource().getParent().getParent();
			//Removing currency column from the table personalization
			this.removeCurrencyAndHiddenColumn(oTable);
			if (!this.oTablePersoControl) {
				this.oTablePersoControl = new sap.ui.table.TablePersoController();
			}
			// If no table set or current PersoTable not matching with the parent of onTablePersoPress event
			if (this.oTablePersoControl.getTable() === null || this.oTablePersoControl.getTable() !== oTable.getId()) {
				this.oTablePersoControl.setTable(oTable);
			}
			this.oTablePersoControl.openDialog();
			oTable._bRenderOnAfter = true;
		},

		removeCurrencyAndHiddenColumn: function (oTable) {
			oTable.getColumns().forEach(function (oColumn) {
				// var oColumnData = oColumn.getBindingContext("structuredDataModel").getObject();
				// var aRefElementIds = oColumnData.aReferencedElementIds;
				// if (oColumnData.FieldVisibilityInd === '' || (aRefElementIds && aRefElementIds.length > 0)) {
				var aRefElementIds = oColumn.getBindingContext("structuredDataModel").getObject().aReferencedElementIds;
				if (aRefElementIds && aRefElementIds.length > 0) {
					oTable.removeColumn(oColumn);
				}
			});
		},

		_getColumnWidth: function (oColumnData, bSetMaxLengthWidth) {
			//setting min column width to 10rem and max column width to 25rem
			// if maxDataLength is more than 75 calculating half with 0.5 and half with 0.4 to reduce the extra space for large texts
			var iColMaxLength = oColumnData.maxDataLength > 75 ? (oColumnData.maxDataLength / 2 * 0.5 + oColumnData.maxDataLength / 2 * 0.4) :
				oColumnData.maxDataLength * 0.5;
			if (iColMaxLength && iColMaxLength !== 0) {
				// If auto width is less than max length, set Maxlength width
				var iMaxLength = iColMaxLength < 8 ? 8 : iColMaxLength;
				return iMaxLength;
			} else {
				return 8;
			}
		},

		/*This is to get Table Cell Control based on column data*/
		_getTableCellControl: function (oColumnData, oSubColumn, oCtx) {
			var oColumnType = new VBox();
			if (oColumnData.hasChildren) {
				// var sPath = oColumnData.MaxOccurs === 1 ? '{structuredDataModel>E' + oColumnData.ElementId + '/displayValue}' : '{structuredDataModel>E' + oColumnData.ElementId + '/displayValue} ({structuredDataModel>E' + oColumnData.ElementId + '/RowCount})';
				oColumnType.addItem(new Link({
						text: '{structuredDataModel>E' + oColumnData.ElementId + '/displayValue}',
						press: this.openColumnChildren.bind(this),
						wrapping: true
					}).data("ElementId", oColumnData.ElementId).data("ParentElementId", oColumnData.ParentElementId)
					.data("MinSequenceNo", '{structuredDataModel>E' + oColumnData.ElementId + '/MinSequenceNo}')
					.data("MaxSequenceNo", '{structuredDataModel>E' + oColumnData.ElementId + '/MaxSequenceNo}')
					.data("ParentSeqNo", '{structuredDataModel>E' + oColumnData.ElementId + '/ParentSeqNo}')
					.data("rowCount", '{structuredDataModel>E' + oColumnData.ElementId + '/RowCount}'));
			} else {
				var oBindingPaths = this._getTableBindingPaths(oCtx, oColumnData, oSubColumn);
				var sElementId = oColumnData.ElementId;
				if (sElementId !== oBindingPaths.ParentElementId) {
					var oTableCellControl = this._getEditableControl(oCtx, "table", oColumnData, oSubColumn);
					// oTableCellControl.bindProperty('visible', oBindingPaths.TableEditableControlVisibleBinding);
				}
				oBindingPaths.formFieldElementId = oCtx.getProperty("ElementId");
				// oBindingPaths.builtInType = oCtx.getProperty("XsdBuiltInType");
				// If current field has currency data, display another field for currency key
				// or If currencyKey has no generated data, don't display currencyKey field
				if (oColumnData.ReferenceElementId === "" || !oColumnData.currencyTypeInfo) {
					oColumnType.addItem(this._getDisplayTextControl(oBindingPaths));
					if (sElementId === oBindingPaths.ParentElementId) {
						oColumnType.addItem(new ObjectStatus({
							state: "Information",
							visible: oBindingPaths.NewRowIndicatorVisibleBinding,
							text: "{=${structuredDataModel>S" + oColumnData.ElementId +
								"/ChangeIndicator} === 'CM' ?  ${i18n>xtit.new} : ${i18n>xtit.deleted}}"
						}));
					}
					// if (oColumnData.ElementId !== Constants.ROWNUMBER) {
					oColumnType.addItem(oTableCellControl);
					oBindingPaths.currencyKey = false;
					// }
				} else {
					var oDisplayHBox = new HBox({
						renderType: "Bare",
						justifyContent: "End"
					});
					// oBindingPaths.builtInType = "amount";
					var oAmmountDisplayTextControl = this._getDisplayTextControl(oBindingPaths);
					// oColumnType.addItem(oDisplayCurrecnyTextControl);

					// oBindingPaths.builtInType = oCtx.getProperty("XsdBuiltInType");
					var oHBox = new HBox({
						renderType: "Bare"
					});
					// oTableCellControl.setWidth("100%");
					oHBox.addItem(oTableCellControl);
					/*CurrencyKey is always a type string*/
					oBindingPaths.Constraints = this._getDataTypeConstraints(oColumnData.currencyTypeInfo);
					oBindingPaths.ValuePath = 'structuredDataModel>E' + oBindingPaths.ElementId + '_Currency/displayValue';
					oBindingPaths.FieldGroupId = "";
					var oCurrencyControl = this._getCurrKeyInputControl(oBindingPaths);
					oBindingPaths.builtInType = "currencyKey";
					var oDisplayCurrecnyTextControl = this._getDisplayTextControl(oBindingPaths);
					// oCurrencyControl.setWidth("8rem");
					oCurrencyControl.attachEvent("change", function (oEvent) {
						this._onCurrencyKeyChange(oEvent, this);
					}.bind(this));
					oHBox.addItem(oCurrencyControl);
					oDisplayHBox.addItem(oAmmountDisplayTextControl);
					oDisplayHBox.addItem(new Label({
						width: "0.5rem",
						text: " ",
						visible: oBindingPaths.DisplayPath
					}));
					oDisplayHBox.addItem(oDisplayCurrecnyTextControl);
					// oDisplayCurrecnyTextControl.bindProperty("visible", oParams.DisplayPath);
					// oHBox.addItem(oDisplayCurrecnyTextControl);
					oColumnType.addItem(oDisplayHBox);
					oColumnType.addItem(oHBox);
				}
			}
			return oColumnType;
		},

		_getTableBindingPaths: function (oCtx, oColumnData, oSubColumn) {
			var sTextBinding, vFractions, oBindingPaths = {};
			var bHasMultiColumns = oColumnData.aMultiLabels.length > 0;
			var oTypeInfo = bHasMultiColumns ? oSubColumn.typeInfo : oColumnData.typeInfo;
			oBindingPaths.builtInType = oTypeInfo.XsdBuiltInType;
			oBindingPaths.Constraints = this._getDataTypeConstraints(oTypeInfo);
			oBindingPaths.ElementId = oColumnData.ElementId;
			oBindingPaths.ParentElementId = oColumnData.ParentElementId;
			var oDisplayColumnData = bHasMultiColumns ? oSubColumn : oColumnData;
			oBindingPaths.ValuePath = oColumnData.ElementId === oColumnData.ParentElementId ? 'structuredDataModel>S' + oDisplayColumnData.ElementId +
				'/displayValue' : 'structuredDataModel>E' + oDisplayColumnData.ElementId + '/displayValue';
			oBindingPaths.CurrencyKeyValuePath = 'structuredDataModel>E' + oDisplayColumnData.ElementId + '_Currency/displayValue';
			oBindingPaths.ValueStateText = '{structuredDataModel>E' + oDisplayColumnData.ElementId + '/MessageText}';
			oBindingPaths.EditablePath = {
				parts: [{
					path: 'structuredDataModel>/editable'
				}, {
					path: 'structuredDataModel>E' + oDisplayColumnData.ElementId + '/ManualAdjOption'
				}, {
					path: 'structuredDataModel>E' + oDisplayColumnData.ElementId + '/GeneratedValue'
				}, {
					path: 'structuredDataModel>E' + oDisplayColumnData.ElementId + '/typeInfo/XsdBuiltInType'
				}, {
					path: "structuredDataModel>E" + oDisplayColumnData.ElementId + "/bShowTotals"
				}, {
					path: "structuredDataModel>S" + oColumnData.ParentElementId + "/ChangeIndicator"
				}],
				formatter: formatter.formateEditable
			};
			oBindingPaths.Edit = {
				parts: [{
					path: "structuredDataModel>S" + oColumnData.ParentElementId + "/ChangeIndicator"
				}],
				formatter: formatter.formateEdit
			};
			oBindingPaths.ValueStatePath = {
				parts: [{
					path: "structuredDataModel>E" + oDisplayColumnData.ElementId + "/ChangeIndicator"

				}, {
					path: "structuredDataModel>E" + oDisplayColumnData.ElementId + "_Currency/ChangeIndicator"

				}, {
					path: "structuredDataModel>E" + oDisplayColumnData.ElementId + "/MessageSeverity"
				}, {
					path: "structuredDataModel>E" + oDisplayColumnData.ElementId + "_Currency/MessageSeverity"
				}],
				formatter: formatter.formateValueState
			};
			oBindingPaths.SearchHelpPath = 'structuredDataModel>E' + oDisplayColumnData.ElementId + '/Shlpname';
			oBindingPaths.TooltipPath = this._getTooltipPath('E' + oDisplayColumnData.ElementId + '/');
			oBindingPaths.FieldGroupId = '{structuredDataModel>E' + oDisplayColumnData.ElementId +
				'/ReferenceElementId}_{structuredDataModel>E' +
				oDisplayColumnData.ElementId + '/ParentSeqNo}_{structuredDataModel>E' + oDisplayColumnData.ElementId + '/SequenceNo}';
			oBindingPaths.ElementId = oDisplayColumnData.ElementId;
			oBindingPaths.DisplayPath = {
				parts: [{
					path: 'structuredDataModel>/editable'
				}, {
					path: 'structuredDataModel>E' + oDisplayColumnData.ElementId + '/bShowTotals'
				}, {
					path: 'structuredDataModel>E' + oDisplayColumnData.ElementId + '/ManualAdjOption'
				}, {
					path: 'structuredDataModel>E' + oDisplayColumnData.ElementId + '/ChangeIndicator'
				}],
				formatter: formatter.formateTableDisplayControlVisiblity
			};
			oBindingPaths.TableEditableControlVisibleBinding = {
				parts: [{
					path: 'structuredDataModel>/editable'
				}, {
					path: 'structuredDataModel>E' + oDisplayColumnData.ElementId + '/bShowTotals'
				}, {
					path: 'structuredDataModel>E' + oDisplayColumnData.ElementId + '/GeneratedValue'
				}],
				formatter: formatter.formatTableEditableControlVisiblity
			};
			oBindingPaths.NewRowIndicatorVisibleBinding = "{=${structuredDataModel>S" + oDisplayColumnData.ElementId +
				"/ChangeIndicator} === 'CM' || ${structuredDataModel>S" + oDisplayColumnData.ElementId + "/ChangeIndicator} === 'DM'}";
			return oBindingPaths;
		},

		_getFormBindingPaths: function (oCtx) {
			var oTypeInfo = oCtx.getProperty("typeInfo");
			var oBindingPaths = {};
			oBindingPaths.ValuePath = 'structuredDataModel>displayValue';
			oBindingPaths.SearchHelpPath = 'structuredDataModel>Shlpname';
			oBindingPaths.ValueStatePath = this._getFormCurrencyValueStatePath();
			oBindingPaths.EditablePath = this._getFormEditablePath();
			oBindingPaths.Edit = this._getFormEditPath();
			oBindingPaths.DisplayPath = this._getFormDisplayPath();
			oBindingPaths.TooltipPath = this._getTooltipPath("");
			oBindingPaths.Constraints = this._getDataTypeConstraints(oTypeInfo);
			oBindingPaths.FieldGroupId = '{structuredDataModel>ReferenceElementId}_{structuredDataModel>ParentElementId}';
			oBindingPaths.CurrencyKeyValuePath = 'structuredDataModel>currencyData/displayValue';
			oBindingPaths.ElementId = "";
			oBindingPaths.builtInType = oTypeInfo.XsdBuiltInType;
			oBindingPaths.ValueStateText = "{structuredDataModel>MessageText}";
			return oBindingPaths;
		},

		_findFirstPanelChildData: function (oPanelControl) {
			var iDataLength;
			var oPanelChild = oPanelControl.controls[0].controlType === "select" ? oPanelControl.controls[1] : oPanelControl.controls[0];
			if (oPanelChild.controlType === "panel") {
				return this._findFirstPanelChildData(oPanelChild);
			} else {
				if (oPanelChild.controlType === "form") {
					iDataLength = oPanelChild.data[0].data[0].displayValue ? 1 : 0;
				} else if (oPanelChild.controlType === "table") {
					iDataLength = oPanelChild.data.length;
				}
				return iDataLength;
			}

		},

		openColumnChildren: function (oEvent) {
			var oStructuredDataModel = oEvent.getSource().getModel("structuredDataModel");
			var oCtxBinding = oEvent.getSource().getBindingContext("structuredDataModel");
			var sSelectedElementId = oEvent.getSource().data("ElementId");
			var sParentElementId = oEvent.getSource().data("ParentElementId");
			var aChildControlsContextObjects = [];
			var oCurrentChildControls = oCtxBinding.getObject()["E" + sSelectedElementId + "_Children"][0];
			oCurrentChildControls.isParentDeleted = oCtxBinding.getObject()["S" + sParentElementId].ChangeIndicator === "DM";
			var oHyperLink = oEvent.getSource();
			oCurrentChildControls.selectedHyperLink = oHyperLink;
			var iDataLength = 0;
			switch (oCurrentChildControls.controlType) {
			case "table":
				iDataLength = oCurrentChildControls.data.length;
				break;
			case "panel":
				iDataLength = this._findFirstPanelChildData(oCurrentChildControls);
				break;
			case "form":
			case "formElements":
				iDataLength = oCurrentChildControls.data[0].data.length;
				break;
			};
			if (iDataLength === 0 || oCurrentChildControls.isParentDeleted) {
				if (oCurrentChildControls.controlType === "panel") {
					// function updatePanelContextObjs(oCurrentChildControls, bSubChild) {}
					this._updatePanelContextObjs(oCurrentChildControls, aChildControlsContextObjects);
					if (oCurrentChildControls.controls.length === 1 && oCurrentChildControls.controls[0].controlType === "form") {
						oCtxBinding.getObject()["E" + sSelectedElementId + "_Children"][0] = oCurrentChildControls.controls[0];
					}
					var bIsSubPanel = true;
					this.readIntermediateParentNodeSequenceNo(oCurrentChildControls, aChildControlsContextObjects, "", oHyperLink, bIsSubPanel);
					// this.readGeneratedData(aChildControlsContextObjects, "", oHyperLink, bIsSubPanel);
				} else {
					this.readGeneratedData(oCurrentChildControls, "", oHyperLink);
				}
			} else {
				this._bindColumnChildSection(oHyperLink);
			}
		},

		_updatePanelContextObjs: function (oCurrentChildControls, aChildControlsContextObjects, bSubChild) {
			var sFieldArrangement = this.getView().getModel("DocumentData").getProperty("/FieldArrangement");
				if (oCurrentChildControls.isChoice) {
					aChildControlsContextObjects.push(oCurrentChildControls);
				}
			for (var iChild = 0; iChild < oCurrentChildControls.controls.length; iChild++) {
				var oCurrentChild = oCurrentChildControls.controls[iChild];
				oCurrentChild.isParentDeleted = oCurrentChildControls.isParentDeleted;
				/*If column has only one form control, then no need to keep it in a panel. 
				So, removing panel control and adding form control to the column children*/
				if (oCurrentChild.controlType === "panel") {
					this._updatePanelContextObjs(oCurrentChild, aChildControlsContextObjects, true);
				} else {
					oCurrentChild.bShowTitle = !bSubChild && oCurrentChildControls.controls.length === 1; //bIsSingleNonSubChildControl
					if (oCurrentChild.singleRowForm === undefined) {
						aChildControlsContextObjects.push(oCurrentChild);
					}
					if (oCurrentChild.controlType === "form" && sFieldArrangement !== "1") {
						this._setEnhancedFormElements(oCurrentChild);
					}
				}
			}
		},

		_bindColumnChildSection: function (oHyperLink) {
			var oStructuredDataModel = oHyperLink.getModel("structuredDataModel");
			var oCtxBinding = oHyperLink.getBindingContext("structuredDataModel");
			var sSelectedElementId = oHyperLink.data("ElementId");
			var bMidColumnLayout = oCtxBinding.getPath().includes("_Children");
			this.getView().byId("PreviewFCL").setLayout(bMidColumnLayout ? sap.f.LayoutType.ThreeColumnsMidExpanded : sap.f.LayoutType.TwoColumnsBeginExpanded);
			var oVbox = this.getView().byId(bMidColumnLayout ? "EndPages--DetailsPage3" : "MidPages--DetailsPage2");
			this._setPageTitle(oCtxBinding, oHyperLink.data("ParentElementId"), bMidColumnLayout);
			oVbox.bindAggregation("items", {
				path: 'structuredDataModel>E' + sSelectedElementId + "_Children",
				templateShareable: false,
				factory: this._getChildControl.bind(this)
			});
			oVbox.setBindingContext(oCtxBinding, "structuredDataModel");
		},

		_setPageTitle: function (oCtxBinding, sParentElementId, bMidColumnLayout) {
			var oTitle = this.getView().byId(bMidColumnLayout ? "EndPages--EndScreenTitle" : "MidPages--MidScreenTitle");
			var oMetadata = this.getView().getModel("MetadataById").getData();
			var oParentElementId = oMetadata.nodes[sParentElementId];
			var iSelectedRow = oCtxBinding.getObject()["S" + oParentElementId.ElementId].displayValue;
			var sTitle = oParentElementId.LabelInfo + " / " + iSelectedRow;
			oTitle.setText(sTitle);
		},

		_getPanelControl: function (oCtx) {
			var that = this;
			var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
			// var oHeaderToolBarContent = [new Title({
			// 	text: '{structuredDataModel>LabelInfo}',
			// 	wrapping: true
			// })];
			var bExpanded = true;
			// Setting Expand/Collapse All buttons for Column child root panel
			// Finding current panel is child root panel or not
			var bIsChildRootPanel = function () {
				var iChildLevel = oCtx.sPath.split("_Children").length;
				return oCtx.sPath.split("_Children")[iChildLevel - 1].indexOf("controls") === -1;
			};
			// //For root panel add these buttons
			// if ((oCtx.sPath.split("/")[2] === "0" && oCtx.sPath.split("/").length === 3) || (oCtx.getObject().columnChildPanel &&
			// 		bIsChildRootPanel())) {
			// 	bExpanded = true; //For Root element it should be expanded.
			// 	oHeaderToolBarContent.push(new ToolbarSpacer());
			// 	oHeaderToolBarContent.push(new Button({
			// 		text: '{i18n>xtit.visualization.expand}',
			// 		press: function (oEvent) {
			// 			this._onExpandAll(oEvent);
			// 		}.bind(this)
			// 	}));
			// 	oHeaderToolBarContent.push(new Button({
			// 		text: "{i18n>xtit.visualization.collapse}",
			// 		press: function (oEvent) {
			// 			this._onCollapseAll(oEvent);
			// 		}.bind(this)
			// 	}));
			// }
			//For Column child panels, panle always should be expanded
			// if (oCtx.getObject().columnChildPanel) {
			// 	bExpanded = true;
			// }
			//Column child panel always be expanded
			// var bColumnChildPanel = oCtx.sPath.indexOf("Children") !== -1;
			var oPanel = new Panel({
				expandable: true,
				expanded: bExpanded,
				headerText: '{structuredDataModel>LabelInfo}',
				// visible: "{structuredDataModel>visible}",
				visible: "{= (${structuredDataModel>visible} !== undefined ? ${structuredDataModel>visible} : true ) && (${structuredDataModel>selectedChoiceVis} !== undefined ? ${structuredDataModel>selectedChoiceVis} : true ) }",
				content: [new VBox({
					items: {
						path: 'structuredDataModel>controls',
						templateShareable: false,
						factory: this._getChildControl.bind(this)
					}
				})]
			});
			// // Pushing to Panels array 
			// oPanel.iCurrentNavPage = this.iCurrentNavPage;
			// var aTotalPanels = oGlobalVariablesModel.getProperty("/aPanels").concat([oPanel]);
			// oGlobalVariablesModel.setProperty("/aPanels", aTotalPanels);

			return oPanel;
		},

		// _onExpandAll: function (oEvent) {
		// 	var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
		// 	oGlobalVariablesModel.getProperty("/aPanels").forEach(function (oPanel, idx) {
		// 		// Expand only current page panels
		// 		if (!this.iCurrentNavPage || oPanel.iCurrentNavPage === this.iCurrentNavPage) {
		// 			oPanel.setExpanded(true);
		// 		}
		// 	}.bind(this));
		// },

		// _onCollapseAll: function (oEvent) {
		// 	var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
		// 	oGlobalVariablesModel.getProperty("/aPanels").forEach(function (oPanel, idx) {
		// 		// Collapse only current page panels
		// 		if (!this.iCurrentNavPage || oPanel.iCurrentNavPage === this.iCurrentNavPage) {
		// 			oPanel.setExpanded(false);
		// 		}
		// 	}.bind(this));
		// },

		_setAuthorization: function () {
			var oAuthorizationModel = this.getOwnerComponent().getModel("AuthorizationModel");
			if (oAuthorizationModel !== undefined) {
				this._setEditAuthorization();
			} else {
				this._readAuthorization();
			}
		},

		/* This will set the Edit button visibility based on Authorization model data */
		_setEditAuthorization: function () {
			var oView = this.getView();
			var oAuthorizationData = this.getOwnerComponent().getModel("AuthorizationModel").getData();
			var sReportRunStatus = oView.getModel("headerDataModel").getProperty("/reportRunStatus");
			var oStructuredDataModel = oView.getModel("structuredDataModel");
			if (sReportRunStatus === "SOK" || sReportRunStatus === "SFV" || sReportRunStatus === "STG") {
				oStructuredDataModel.setProperty("/bHasEditAuth", false);
			} else if (oAuthorizationData.IsEditable === true) {
				oStructuredDataModel.setProperty("/bHasEditAuth", true);
			} else {
				oStructuredDataModel.setProperty("/bHasEditAuth", false);
			}
		},

		_readAuthorization: function () {
			var oView = this.getView();
			var oDataModel = oView.getModel();
			var oParamModelData = oView.getModel("paramModel").getData();
			var that = this;
			var shttpMethod = ServiceMetadata.FunctionImportSignature(oDataModel, "GetAuthorization");
			oDataModel.callFunction("/GetAuthorization", {
				method: shttpMethod,
				urlParameters: {
					Country: oParamModelData.country,
					RepCatId: oParamModelData.repCatId,
					ReportingEntity: oParamModelData.repEntity
				},
				success: function (oAuthorization) {
					that.getOwnerComponent().setModel(new JSONModel(oAuthorization), "AuthorizationModel");
					that._setEditAuthorization();
				},
				error: function (oError) {
					MessageHandler.showErrorMessage(oError);
				}
			});
		},

		/*********** Preparing JSON hierarchy***************/
		// _getHierarchyItem: function (sId, oCtx) {
		// 	var sPath = oCtx.sPath;
		// 	var oCurrentNode = oCtx.getObject();
		// 	var iFormControlCounter = 0;

		// 	return new sap.m.StandardTreeItem({
		// 		title: "{structuredDataModel>LabelInfo}"
		// 	});
		// },

		/*onVariantSelect: function () {
			setTimeout(function () {
				this.byId("BeginPages--DPNestedTree").removeSelections(true);
				this.byId("BeginPages--DPNestedTree").collapseAll();
				this.byId("BeginPages--DPNestedTree").expandToLevel(0);
			}.bind(this));
		},*/

		onTreeLoaded: function (oEvent) {
			var oTree = oEvent.getSource();
			//Collect Relative Paths upfront and check already expanded condition
			if (VariantManagement && VariantManagement.oVariantDetails) {
				var oVariantModel = VariantManagement.oVariantDetails.VMControl.getModel("VariantModel");
				if (oVariantModel && oVariantModel.getData().Variants.length > 0 && oTree.getItems().length > 0 && ["*standard*", ""].indexOf(
						VariantManagement.oVariantDetails.VMControl.getInitialSelectionKey()) === -1) {
					if (!oVariantModel.getProperty("/AlreadyExpanded")) {
						oVariantModel.setProperty("/AlreadyExpanded", true);
						this._onHierarchyExpandTo(oTree);
						this._setVariantSelection();
					}
					return;
				} else {
					var oHierarchyData = this.getView().getModel("structuredDataModel").getData().Root;
					if (oHierarchyData && oHierarchyData.length === 1 && oHierarchyData[0].controls.length === 0 && !oTree.getItems()[0].getSelected()) {
						oTree.fireSelectionChange({
							listItem: oTree.getItems()[0],
							selected: true
						});
						oTree.getItems()[0].setSelected(true);
						this.onCloseHierarchyPress();
						this._setVariantSelection();
					} else if (oHierarchyData && oEvent.getSource().getNumberOfExpandedLevel() === 0 && !oTree.getItems()[0].getSelected()) {
						this._onHierarchyExpandTo(oTree);
						var iSelectionIndex = this._getFirstSubNodeIdx(oHierarchyData[0], oTree, 0);
						var oSelectionItem = oTree.getItems()[iSelectionIndex];
						oTree.fireSelectionChange({
							listItem: oSelectionItem,
							selected: true
						});
						oSelectionItem.setSelected(true);
						this.onShowHierarchyPress();
						this._setVariantSelection();
					}
					//this._setVariantSelection();
				}
			}
			//in mobile screen, side content is displayed using toggle
			if (!oTree.getParent().isSideContentVisible()) {
				oTree.getParent().toggle();
			}
		},

		/**
		 * Hierarchy Expansion before selection of nodes
		 * @param {Object} oTree - Hierarchy tree
		 */
		_onHierarchyExpandTo: function (oTree) {
			if (oTree.getItems().length > 0) {
				oTree.expandToLevel(10);
				this.getRelativetPath(oTree);
				oTree.expandToLevel(VariantManagement.oVariantDetails.VMControl.getModel("VariantModel").getProperty("/ExpandToLevel"));
			}
		},

		/**
		 * 
		 */
		_setVariantSelection: function () {
			var oVariantManagementCtrl = VariantManagement.oVariantDetails.VMControl;
			var sInitialKey = oVariantManagementCtrl.getInitialSelectionKey();
			var sDefaultKey = sInitialKey ? sInitialKey : "*standard*";
			oVariantManagementCtrl.setInitialSelectionKey(sDefaultKey);
			oVariantManagementCtrl.setDefaultVariantKey(sDefaultKey);
			if (sDefaultKey !== "*standard*") {
				oVariantManagementCtrl.fireSelect({
					key: sDefaultKey
				});
			}
		},

		_getFirstSubNodeIdx: function (oHierarchyData, oTree, iSelectionIndex) {
			if (oHierarchyData.controls.length > 0 && !oHierarchyData.isChoice) {
				oTree.expandToLevel(++iSelectionIndex);
				iSelectionIndex = this._getFirstSubNodeIdx(oHierarchyData.controls[0], oTree, iSelectionIndex);
			}
			return iSelectionIndex;
		},

		_constructHierarchyData: function () {
			var aNodes = this.getView().getModel("SchemaMetaData").getData();
			var aParsed = [this._prepareElementHierarchy(aNodes)];

			var oStructuredDataModel = this.getView().getModel("structuredDataModel");
			oStructuredDataModel.setProperty("/Root", aParsed[0].children);
			this._setModelPropertyChange();
			if (this._isBetaVersion("ErrorWarning")) {
				PreviewErrorWarning.getErrorWarningCount(this);
			}
			BusyIndicator.hide();
		},

		_prepareElementHierarchy: function (aNodes) {
			var oChildrenById = {};
			var oAttributesById = {};
			var oNodesById = {};
			var oNodesByAttributeId = {};
			var oTypeInfoById = {};
			var oAddMetadataById = {};
			var oRefElementNodesById = {};
			var oAnonymousElementsById = {};
			var aRootNodes = [];
			var oCurrentNode;
			var iCurrNodeIdx; //for current index in children array
			var oParentNode;
			var sKey;
			var that = this;
			var sFieldArrangement = this.getView().getModel("DocumentData").getProperty("/FieldArrangement");
			oNodesById["00000000"] = {
				"ElementId": "00000000",
				"ElementName": "Root",
				"children": [],
				"controls": [],
				"columns": [],
				"attributes": [],
				"formElements": [],
				"tableElements": []
					/*
									"ErrorWarningCounter": {
										ErrorCount: 0,
										WarningCount: 0
									}*/
			};
			var aTypeInfo = this.getView().getModel("ElementTypeData").getData();
			aTypeInfo.forEach(function (oCurrentElement, idx) {
				oTypeInfoById[oCurrentElement.TypeId] = oCurrentElement;
			});

			// var aAddMetadataInfo = this.getView().getModel("AdditionalMetadata").getData();
			// aAddMetadataInfo.forEach(function (oCurrentElement, idx) {
			// 	oAddMetadataById[oCurrentElement.ElementId+oCurrentElement.AttributeId] = oCurrentElement;
			// });

			// Getting Attribute metadata and filtering aNodes
			// var aAttributeMetadata = [];
			aNodes = jQuery.grep(aNodes, function (oNode, index) {
				if (oNode.ElementId !== "" && oNode.AttributeId !== "") {
					oNodesByAttributeId[oNode.ElementId + "_" + oNode.AttributeId] = oNode;
					if (oAttributesById[oNode.ElementId] === undefined) {
						oAttributesById[oNode.ElementId] = [oNode.AttributeId];
					} else {
						oAttributesById[oNode.ElementId].push(oNode.AttributeId);
					}
					// that._getAdditionalMetadataInfo(oNode, oAddMetadataById[oNode.ElementId+oNode.AttributeId]);
				} else {
					return true;
				}
			});
			var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
			oGlobalVariablesModel.setProperty("/aElementMetadata", aNodes);
			// oGlobalVariablesModel.setProperty("/aAttributeMetadata", aAttributeMetadata);
			for (var idx = 0; idx < aNodes.length; idx++) {
				oCurrentNode = aNodes[idx];
				// sId = oCurrentNode.AttributeId.length > 0 ? oCurrentNode.ElementId + "_" + oCurrentNode.AttributeId : oCurrentNode.ElementId;
				sKey = oCurrentNode.ElementId;
				oCurrentNode.children = [];
				oCurrentNode.columns = [];
				oCurrentNode.data = [];
				oCurrentNode.attributes = [];
				oCurrentNode.formControls = [];
				oCurrentNode.tableElements = [];
				oCurrentNode.controls = [];
				oCurrentNode.selected = false;
				oNodesById[sKey] = oCurrentNode;
				oCurrentNode.ErrorWarningCounter = {
					ErrorCount: 0,
					WarningCount: 0
				};
				// this._getAdditionalMetadataInfo(oCurrentNode, oAddMetadataById[oCurrentNode.ElementId+oCurrentNode.AttributeId]);
				if (oCurrentNode.ParentElementId === "" && oCurrentNode.ElementId !== "" && oCurrentNode.AttributeId === "") {
					aRootNodes.push(oCurrentNode.ElementId);
				}

				if (oCurrentNode.ParentElementId === "" && oCurrentNode.AttributeId === "") {
					if (oChildrenById["00000000"] === undefined) {
						oChildrenById["00000000"] = [sKey];
					} else {
						oChildrenById["00000000"].push(sKey);
					}
				} else {
					if (oChildrenById[oCurrentNode.ParentElementId] === undefined) {
						oChildrenById[oCurrentNode.ParentElementId] = [sKey];
					} else {
						oChildrenById[oCurrentNode.ParentElementId].push(sKey);
					}
				}
			}
			var iChoice = 1; // used for creating artificial label info for choice elements with no label maintained

			function updateChildNodes(ElementId) { // second pass: build tree, using recursion!
				var oCurrentNode = oNodesById[ElementId];
				if (oChildrenById[ElementId] !== undefined) {
					oChildrenById[ElementId].sort(function (a, b) {
						return oNodesById[a].OrdinalNumber - oNodesById[b].OrdinalNumber;
					});
					for (var iChildIdx = 0; iChildIdx < oChildrenById[ElementId].length; iChildIdx++) {
						var oCurrentChildNode = updateChildNodes(oChildrenById[ElementId][iChildIdx]);
						oCurrentChildNode.LabelInfo = oCurrentChildNode.LabelInfo !== "" ? oCurrentChildNode.LabelInfo : oCurrentChildNode.ElementName;
						// oCurrentChildNode.typeInfo = oTypeInfoById[oCurrentChildNode.TypeId];
						oCurrentChildNode.typeInfo = oCurrentChildNode.TypeId !== "" ? that._getTypeInfo(oCurrentChildNode, oTypeInfoById[
							oCurrentChildNode.TypeId]) : "";
						// that._getAdditionalMetadataInfo(oCurrentChildNode, oAddMetadataById[oCurrentChildNode.ElementId+oCurrentChildNode.AttributeId]);
						if (oCurrentChildNode.ElementName !== "") { //anonymous element check
							oCurrentNode.children.push(oCurrentChildNode);

							//finding Ref element ids
							if (oCurrentChildNode.ReferenceElementId !== "" && oNodesById[oCurrentChildNode.ReferenceElementId]) {
								if (oRefElementNodesById[oCurrentChildNode.ReferenceElementId] === undefined) {
									oRefElementNodesById[oCurrentChildNode.ReferenceElementId] = oNodesById[oCurrentChildNode.ReferenceElementId];
									oRefElementNodesById[oCurrentChildNode.ReferenceElementId].aReferencedElementIds = [];
								}
								oRefElementNodesById[oCurrentChildNode.ReferenceElementId].aReferencedElementIds.push({
									ElementId: oCurrentChildNode.ElementId,
									ElementLabelInfo: oCurrentChildNode.LabelInfo !== "" ? oCurrentChildNode.LabelInfo : oCurrentChildNode.ElementName
								});
							}
							//Labeling no data nodes
							if (oCurrentChildNode.children.length === 0 && oCurrentChildNode.attributes.length === 0 && !oCurrentChildNode.typeInfo){
							// if (oCurrentChildNode.FieldVisibilityInd === '') {
								oCurrentChildNode.LabelInfo = oCurrentChildNode.LabelInfo + that.getResourceBundle().getText("xtit.visualization.NoData");
							}
						} else {
								if (that._isBetaVersion("ChoiceHandling")) { // gen version check
									that.generateChoiceElementName(oCurrentChildNode, oCurrentNode, oCurrentChildNode.CollectionType === "C" ? iChoice++ :
										iChildIdx);
									oCurrentNode.children.push(oCurrentChildNode);
								}else{
									// anonymous elements
									if (oAnonymousElementsById[ElementId]) {
										oAnonymousElementsById[ElementId].push(oCurrentChildNode.ElementId);
									} else {
										oAnonymousElementsById[ElementId] = [oCurrentChildNode.ElementId];
									}
		
									// Choice as a table
									if (oCurrentChildNode.MaxOccurs > 1 || oCurrentChildNode.MaxOccurs === -1) { //Temporary fix - Revisit and fix it for all other scenarios ( For repeating child node )
										// oCurrentChildNode.LabelInfo = oCurrentChildNode.LabelInfo ? oCurrentChildNode.LabelInfo : that.getResourceBundle().getText("choiceElementLabel", [++iChoice]);
										oCurrentNode.children.push(oCurrentChildNode);
									} else if (oCurrentNode.MaxOccurs > 1 || oCurrentNode.MaxOccurs === -1) { // choice as a column of a table
										oCurrentChildNode.LabelInfo = oCurrentChildNode.LabelInfo ? oCurrentChildNode.LabelInfo : that.generateChoiceElementName(oCurrentChildNode, oCurrentNode, oCurrentChildNode.CollectionType === "C" ? iChoice++ :
										iChildIdx);
										oCurrentNode.children.push(oCurrentChildNode);
									} else {
										var aAnonymousChildIds = that._getAnonymousChildIds(oCurrentChildNode);
										oCurrentNode.children = oCurrentNode.children.concat(that._arrangeAnonymousChild(oCurrentChildNode,
											oCurrentNode));
										// Current children length before adding further child id's
										var iCurrentChildrens = oChildrenById[ElementId].length;
										// Index in the parent element id after adding anonymous children
										var iToBeChildIdx = iChildIdx + aAnonymousChildIds.length;
										//oChildrenById[ElementId].splice(iChildIdx, 1, ...aAnonymousChildIds); //[2,3,4,5,27,30,31] => [2,3,4,5,28,30,31]
										for (var iChild = 0; iChild < aAnonymousChildIds.length; iChild++) {
											oChildrenById[ElementId].splice(iChildIdx + iChild, iChild === 0 ? 1 : 0, aAnonymousChildIds[iChild]);
										}
										// current Element id has 2 children and each children has further multiple children the increase the iChildIdx as below
										// currentElementId children [36, 40] and 36 has [37, 38, 39] after the above loop CurrentElemetId will be [37,38,39,40]. then the iChildIdx has to move forward to 2 as 37,38,39 are already processed children
										if (iCurrentChildrens < oChildrenById[ElementId].length) {
											iChildIdx = iToBeChildIdx - 1;
										}
									}
							}
						}
					}
				}
				if (oAttributesById[ElementId] !== undefined) {
					oCurrentNode.hasAttributes = true;
					for (var iAttrIdx = 0; iAttrIdx < oAttributesById[ElementId].length; iAttrIdx++) {
						var oCurrentAttrNode = oNodesByAttributeId[ElementId + "_" + oAttributesById[ElementId][iAttrIdx]];
						oCurrentAttrNode.LabelInfo = oCurrentAttrNode.LabelInfo !== "" ? oCurrentAttrNode.LabelInfo : oCurrentAttrNode.AttributeName;
						// oCurrentAttrNode.typeInfo = oTypeInfoById[oCurrentAttrNode.TypeId];
						oCurrentAttrNode.typeInfo = oCurrentAttrNode.TypeId !== "" ? that._getTypeInfo(oCurrentAttrNode, oTypeInfoById[
								oCurrentAttrNode.TypeId]) :
							"";
						oCurrentNode.attributes.push(oCurrentAttrNode);
					}
				}

				return oCurrentNode;
			}
			var iOrdinialNumberCounter = 2; //Root node already starts from 1 3
			function updateFormTableNodes(ElementId, that, bIsChoiceBranch) {
				if (oChildrenById[ElementId] !== undefined) {
					for (var iChildIdx = 0; iChildIdx < oChildrenById[ElementId].length; iChildIdx++) {
						oCurrentNode = oNodesById[oChildrenById[ElementId][iChildIdx]];
						oCurrentNode.controlType = that._getControltype(oCurrentNode);
						oCurrentNode.isChoiceBranch = !!bIsChoiceBranch;
						oCurrentNode.isChoice = that._isBetaVersion("ChoiceHandling") ? oCurrentNode.CollectionType === "C" : false;
						oParentNode = oNodesById[oCurrentNode.ParentElementId];
						if (ElementId !== "00000000" && oParentNode) {
							switch (oCurrentNode.controlType) {
							case "panel":
								// that._updateControlOrdinalNumber(oCurrentNode, oParentNode);
								oCurrentNode.OrdinalNumber = iOrdinialNumberCounter++;
								var oPanel = that._getNewPanelControl(oCurrentNode, oParentNode, bIsChoiceBranch);
								oParentNode.controls.push(oPanel);
								if(that._isBetaVersion("ChoiceHandling") && oCurrentNode.CollectionType === "C"){ // if it's an editable choice
								   oCurrentNode.controls.push(that._getNewChoiceSelectControl(oCurrentNode, oPanel));
								}
								break;
							case "table":
								// that._updateControlOrdinalNumber(oCurrentNode, oParentNode);
								that._updateColumns(oCurrentNode, oNodesById);
								oCurrentNode.children = [];
								oChildrenById[oCurrentNode.ElementId] = [];
								oCurrentNode.OrdinalNumber = iOrdinialNumberCounter++;
								oParentNode.controls.push(that._getNewTableControl(oCurrentNode, oParentNode, bIsChoiceBranch));
								break;
							case "formElement":
								//If last control is form control, push it to from controls. If not create new form control 
								var lastControlIdx = oParentNode.controls.length - 1;
								if (lastControlIdx !== -1 && oParentNode.controls[lastControlIdx].controlType === "form" && !oParentNode.isChoice) {
									oCurrentNode.OrdinalNumber = oCurrentNode.OrdinalNumber + iOrdinialNumberCounter;
									oParentNode.controls[lastControlIdx].data[0].data.push(oCurrentNode);
								} else {
									// that._updateControlOrdinalNumber(oCurrentNode, oParentNode);
									oCurrentNode.OrdinalNumber = iOrdinialNumberCounter++;
									oParentNode.controls.push(that._getNewFormControl(oCurrentNode, oParentNode, true, bIsChoiceBranch));
								}
								break;
							}
						} else {
							/*	oCurrentNode.ErrorWarningCounter = {
									ErrorCount: 0,
									WarningCount: 0
								};*/
						}
						updateFormTableNodes(oChildrenById[ElementId][iChildIdx], that, bIsChoiceBranch ? bIsChoiceBranch : oCurrentNode.CollectionType === "C");
					}
				}
				oCurrentNode = oNodesById[ElementId];
				//Rearranging multiple formcontrols under same parent node
				var iFormControlIdx;
				for (var iControl = 0; iControl < oCurrentNode.controls.length; iControl++) {
					var oCurrentControl = oCurrentNode.controls[iControl];
					if (oCurrentControl.controlType === "form" && !oCurrentNode.isChoice) {
						if (oCurrentNode.formControls.length === 0) {
							oCurrentControl.OrdinalNumber = oCurrentControl.data[0].data[0].OrdinalNumber;
							oCurrentNode.formControls.push(oCurrentControl);
							iFormControlIdx = iControl;
							oCurrentNode.controls.splice(iControl, 1);
							iControl--;
						} else {
							//updating first atrtificail form title to "Group 1"
							var sGroup1Title = that.getResourceBundle().getText("xtit.visualization.SubGroupTitle", ["1"]);
							var sGroupTitle = that.getResourceBundle().getText("xtit.visualization.SubGroupTitle", [(oCurrentNode.formControls.length + 1)]);

							oCurrentNode.formControls[0].LabelInfo = that._getArtificialFormLabelInfo(oCurrentNode.formControls[0], sGroup1Title);
							oCurrentControl.LabelInfo = that._getArtificialFormLabelInfo(oCurrentControl, sGroupTitle);

							//Update first artificial form node
							if (oCurrentNode.controls.indexOf(oCurrentNode.formControls[0]) === -1) {
								//Placing the artificial group node at the index of form control
								oCurrentNode.controls.splice(iFormControlIdx, 0, oCurrentNode.formControls[0]);
								iControl++;
								var oFirstArtificialFormControl = jQuery.extend(true, {}, oCurrentNode.formControls[0]);
								oFirstArtificialFormControl.LabelInfo = oCurrentNode.LabelInfo + "->" + oFirstArtificialFormControl.LabelInfo;
								oCurrentNode.controls[iFormControlIdx].formControls.push(oFirstArtificialFormControl);
							}
							oCurrentNode.controls[iControl].OrdinalNumber = oCurrentControl.data[0].data[0].OrdinalNumber;
							var oArtificialFormControl = jQuery.extend(true, {}, oCurrentNode.controls[iControl]);
							oArtificialFormControl.LabelInfo = oCurrentNode.LabelInfo + "->" + oArtificialFormControl.LabelInfo;
							oCurrentNode.controls[iControl].formControls.push(oArtificialFormControl);
							oCurrentNode.formControls.push(oArtificialFormControl); //to get the length of atrificial form nodes
							//checking for another form in the current node controls list
							var bHasAnotherForm = false;
							for (var iForm = iControl + 1; iForm < oCurrentNode.controls.length; iForm++) {
								if (oCurrentNode.controls[iForm].controlType === "form") {
									bHasAnotherForm = true;
									break;
								}
							}
							//If no other form found clear form controls
							if (!bHasAnotherForm) {
								oCurrentNode.formControls = [];
							}
							oCurrentControl = oCurrentNode.controls[iControl].formControls[0]; //updating oCurrentControl
						}
						//Setting enhanced data preview
						if (sFieldArrangement !== "1") {
							that._setEnhancedFormElements(oCurrentControl);
						}
					}
				}
				//Adding artificial node if selected node has child elements with leaf nodes/ attributes 
				if ((oCurrentNode.controls.length > 0 && !oCurrentNode.isChoice ) && (oCurrentNode.formControls.length > 0 || oCurrentNode.attributes.length > 0)) {
					if (oCurrentNode.formControls.length > 0) {
						oCurrentNode.formControls[0].formControls = jQuery.extend(true, [], oCurrentNode.formControls);
					}
					if (oCurrentNode.attributes.length > 0) {
						//if element has only attributes without leaf nodes(form controls), create a panel control to get artificial node in hiera
						if (oCurrentNode.formControls.length === 0) {
							oParentNode = oNodesById[oCurrentNode.ParentElementId];
							oCurrentNode.formControls.push(that._getNewPanelControl(oCurrentNode, oParentNode));
						}
						// oCurrentNode.formControls[0].attributes = jQuery.extend(true, [], oCurrentNode.attributes);
						oCurrentNode.formControls[0].attributes = oCurrentNode.attributes;
						oCurrentNode.formControls[0].controlType = "panel";
						oCurrentNode.formControls[0].controls = [];
						oCurrentNode.attributes = [];
					}
					oCurrentNode.formControls[0].LabelInfo = oCurrentNode.LabelInfo + "-" + that.getResourceBundle().getText(
						"xtit.visualization.DetailsNodeTitle");
					// oCurrentNode.formControls[0].OrdinalNumber = oCurrentNode.OrdinalNumber;
					oCurrentNode.formControls[0].ArtificialNode = true;
					oCurrentNode.controls.splice(0, 0, oCurrentNode.formControls[0]);
					oCurrentNode.formControls.splice(0, 1);
				}
				return oNodesById[ElementId];
			}
			updateChildNodes("00000000", this);
			var oMetadataNodes = this.getView().setModel(new JSONModel({
				"nodes": oNodesById,
				"attributes": oNodesByAttributeId,
				"childById": oChildrenById,
				"referenceElementNodes": oRefElementNodesById,
				"anonymousElementById": oAnonymousElementsById
			}), "MetadataById");
			return updateFormTableNodes("00000000", this);
		},

		_getArtificialFormLabelInfo: function (oFormControl, sGroupTitle) {
			var aFormControlData = oFormControl.data;
			var iNumberOfFormElements = aFormControlData.length > 1 ? aFormControlData.length : aFormControlData[0].data.length;

			return iNumberOfFormElements === 1 ? aFormControlData[0].data[0].LabelInfo : sGroupTitle;
		},

		// _updateControlOrdinalNumber: function(oCurrentNode, oParentNode) {
		// 	if(oParentNode.OrdinalNumber === 0){
		// 		oParentNode.OrdinalNumber = 100;
		// 	}
		// 	if(oParentNode.OrdinalNumber.toString().indexOf('.') > -1){
		// 		oCurrentNode.OrdinalNumber = Number(oParentNode.OrdinalNumber.toString() + parseInt(oCurrentNode.OrdinalNumber));
		// 	}else{
		// 		oCurrentNode.OrdinalNumber = Number(oParentNode.OrdinalNumber + "." + parseInt(oCurrentNode.OrdinalNumber));
		// 	}
		// },

		_getTypeInfo: function (oNode, oSchemaTypeInfo) {
			var oTypeInfo;
			if (oSchemaTypeInfo === undefined) {
				oTypeInfo = {
					"TypeId": oNode.TypeId,
					"XsdBuiltInType": oNode.XsdBuiltInType,
					"MinLength": oNode.MinLength,
					"MaxLength": oNode.MaxLength,
					"TotalDigits": oNode.TotalDigits,
					"FractionDigits": oNode.FractionDigits,
					"ParentTypeId": oNode.ParentTypeId,
					"StType": oNode.StType,
					"Minexclusive": oNode.Minexclusive,
					"Mininclusive": oNode.Mininclusive,
					"Maxexclusive": oNode.Maxexclusive,
					"Maxinclusive": oNode.Maxinclusive,
					"Length": oNode.Length,
					"Whitespace": oNode.Whitespace,
					"HasEnumeration": oNode.HasEnumeration
				};
			} else {
				oTypeInfo = oSchemaTypeInfo;
			}
			return oTypeInfo;
		},

		_getAdditionalMetadataInfo: function (oNode, oAddMetadataInfo) {
			var bHasAdditionalMetadata = oAddMetadataInfo !== undefined;
			oNode.CountValues = bHasAdditionalMetadata ? oAddMetadataInfo.CountValues : 0;
			oNode.Shlpname = bHasAdditionalMetadata ? oAddMetadataInfo.Shlpname : "";
			oNode.Shlpfield = bHasAdditionalMetadata ? oAddMetadataInfo.Shlpfield : "";
			if (bHasAdditionalMetadata) {
				oNode.HasDomainValues = oAddMetadataInfo.SourceType === "D";
				oNode.HasEnumeration = oAddMetadataInfo.SourceType === "E";
				oNode.HasSearchHelp = oAddMetadataInfo.SourceType === "S";
				oNode.HasCDSColumn = oAddMetadataInfo.SourceType === "V";
			}
		},

		_updateFormTableNodes: function (ElementId, oNodesById, oChildrenById, oParentNode) {
			var oCurrentNode = oNodesById[ElementId];
			oCurrentNode.controlType = this._getControltype(oCurrentNode);
			//oCurrentNode.ErrorWarningCounter = 
			switch (oCurrentNode.controlType) {
			case "panel":
				var oNode = oParentNode ? oParentNode : oCurrentNode;
				var oPanel = jQuery.extend(true, {}, this._getNewPanelControl(oCurrentNode));
				oNode.controls.push(oPanel);
				if(this._isBetaVersion("ChoiceHandling") && oNode && oNode.CollectionType === "C"){ // if it's an editable choice HARISH
					oPanel.controls.push(this._getNewChoiceSelectControl(oCurrentNode, oPanel));
				}
				oCurrentNode.children.forEach(function (oChild) { // In case of Form or mutlipe childern we have to loop aganist childern to find out control type.
					this._updateFormTableNodes(oChild.ElementId, oNodesById, oChildrenById, oNode.controls[oNode.controls.length - 1]);
				}.bind(this));
				break;
			case "table":
				if ((oCurrentNode.MaxOccurs > 1 || oCurrentNode.MaxOccurs === -1) && oChildrenById[ElementId] === undefined) {
					oCurrentNode.repeatingLeafNode = true;
				}
				this._updateColumns(oCurrentNode, oNodesById);
				oCurrentNode.controls.push(this._getNewTableControl(oCurrentNode));
				if (oParentNode) {
					oParentNode.controls.push(this._getNewTableControl(oCurrentNode));
				}
				break;
			case "formElement":
				//If last control is form control, push it to from controls. If not create new form control 
				var lastControlIdx = oParentNode.controls.length - 1;
				if (lastControlIdx !== -1 && oParentNode.controls[lastControlIdx].controlType === "form") {
					// oCurrentNode.controls[lastControlIdx].data[0].data.push(oCurrentNode);
					// if(oParentNode){
					oParentNode.controls[lastControlIdx].data[0].data.push(oCurrentNode);
					// }
				} else {
					// oCurrentNode.controls.push(this._getNewFormControl(oCurrentNode, oCurrentNode));
					if (oParentNode) {
						oParentNode.controls.push(this._getNewFormControl(oCurrentNode, oParentNode, false));
					} else {
						oCurrentNode.controls.push(this._getNewFormControl(oCurrentNode, oCurrentNode, false));
					}
				}
				break;
			}
			return oNodesById[ElementId];
		},

		_getAnonymousChildIds: function (oNode) {
			var aIds = [];
			oNode.children.forEach(function (oChild) {
				aIds.push(oChild.ElementId);
			});
			return aIds;
		},

		_updateColumns: function (oCurrentNode, oMetaDataNodes) {
			var oSeqObj = {
				"id": "ID" + Math.random(),
				"Description": "Seq. No.",
				"ElementId": oCurrentNode.ElementId,
				"ParentElementId": oCurrentNode.ElementId,
				"AttributeId": oCurrentNode.AttributeId,
				"LabelInfo": "Seq. No.",
				"MaxOccurs": 1,
				"MinOccurs": 1,
				"ReferenceElementId": "",
				"aMultiLabels": [],
				"attributes": [],
				"hasChildren": false,
				"maxDataLength": 5,
				"OrdinalNumber": -1,
				"ManualAdjOption": "",
				"XsdBuiltInType": "integer",
				"FieldVisibilityInd": "X",
				"typeInfo": {
					"XsdBuiltInType": "integer",
					"Maxinclusive": 1,
					"Mininclusive": 1
				}
			};
			oCurrentNode.columns.push(oSeqObj);
			oCurrentNode.AmountElementId = [];
			oCurrentNode.complexParents = [];
			var bTableHasChildren = false;
			var bTableHasTotal = false;
			// Add parent node as child  in  case of repeating leaf node is in a form.
			if (oCurrentNode.children.length === 0 && (oCurrentNode.MaxOccurs > 1 || oCurrentNode.MaxOccurs === -1)) {
				var oRepeatingLeafNode = jQuery.extend(true, {}, oCurrentNode);
				// As in the child table the repeating leaf node will a be cloumn and it should have maxoccurs as 1 otherwise it will be infinite loop of tables
				oRepeatingLeafNode.MaxOccurs = 1;
				oCurrentNode.attributes = [];
				oCurrentNode.children.push(oRepeatingLeafNode);
				oCurrentNode.repeatingLeafNode = true;
			}
			// Harish
			if (this._isBetaVersion("ChoiceHandling") && oCurrentNode.CollectionType === "C" && (oCurrentNode.MaxOccurs > 1 || oCurrentNode.MaxOccurs ===
					-1)) {
				var oRepeatingChoiceNode = jQuery.extend(true, {}, oCurrentNode);
				// As in the child table the repeating leaf node will a be cloumn and it should have maxoccurs as 1 otherwise it will be infinite loop of tables
				oRepeatingChoiceNode.MaxOccurs = 1;
				oRepeatingChoiceNode.hasChildren = oRepeatingChoiceNode.children.length > 0;
				oRepeatingChoiceNode.controlType = this._getControltype(oRepeatingChoiceNode);
				oCurrentNode.attributes = [];
				oCurrentNode.children = [];
				oCurrentNode.CollectionType = "";
				oCurrentNode.isChoice = false;
				oCurrentNode.wrapperChoiceNode = true;
				oCurrentNode.repeatingLeafNode = true;
				oCurrentNode.children.push(oRepeatingChoiceNode);
			}
			oCurrentNode.children.forEach(function (oChild) {
				oChild.id = "ID" + Math.random();
				oChild.typeInfo = oChild.TypeId !== "" ? oChild.typeInfo : "";
				if ((oChild.MaxOccurs > 1 || oChild.MaxOccurs === -1) && oChild.TypeId !== "") {
					var oRepeatingLeafNode = jQuery.extend(true, {}, oChild);
					// As in the child table the repeating leaf node will a be cloumn and it should have maxoccurs as 1 otherwise it will be infinite loop of tables
					// We identify complex elements with TypeId = "", since we are simulating a complex element by adding a wraper for the repeating column (which will come as a hyperlink) 
					// we should clear the TypeId, so the control preparation logic will identify it as a complex element
					oChild.TypeId = "";
					oRepeatingLeafNode.MaxOccurs = 1;
					oChild.children.push(oRepeatingLeafNode);
				}
				
				// Harish
				if (this._isBetaVersion("ChoiceHandling")  && oChild.CollectionType === "C" && (oChild.MaxOccurs > 1 || oChild.MaxOccurs ===
					-1)) {
					var oRepeatingChoiceNode = jQuery.extend(true, {}, oChild);
					// As in the child table the repeating leaf node will a be cloumn and it should have maxoccurs as 1 otherwise it will be infinite loop of tables
					oRepeatingChoiceNode.MaxOccurs = 1;
					oRepeatingChoiceNode.hasChildren = oRepeatingChoiceNode.children.length > 0;
					oRepeatingChoiceNode.controlType = this._getControltype(oRepeatingChoiceNode);
					oChild.attributes = [];
					oChild.children = [];
					oChild.CollectionType = "";
					oChild.isChoice = false;
					oChild.wrapperChoiceNode = true;
					oChild.repeatingLeafNode = true;
					oChild.children.push(oRepeatingChoiceNode);
				}
				
				oChild.hasChildren = oChild.children.length > 0;
				if (oChild.hasChildren) {
					oCurrentNode.complexParents.push(oChild);
				}
				if (!bTableHasChildren) { // If any column  has further children and set this property to true then no need to update for columns
					bTableHasChildren = oChild.children.length > 0;
				}
				// For columns with Reference Element  Id's, add currecny reference id as column property as this is used for currency validations. 
				if (oChild.ReferenceElementId !== "") {
					oChild.currencyData = oMetaDataNodes[oChild.ReferenceElementId];
					//If the reference element id is hidden in mapping . We clear the reference element id value to empty from the element
					if (oMetaDataNodes[oChild.ReferenceElementId]) {
						bTableHasTotal = true;
						oCurrentNode.AmountElementId.push(oChild.ElementId);
					} else {
						oChild.ReferenceElementId = "";
					}
				}
				//For columns with further children, no need to show atributes as columns, as they will be displayed in the child panel in the next screen
				if (oChild.hasAttributes && oChild.children.length === 0) {
					this._createMultiLabels(oChild, oCurrentNode.columns);
				} else {
					oChild.aMultiLabels = [];
					oCurrentNode.columns.push(oChild);
				}
			}.bind(this));
			oCurrentNode.attributes.sort(function (a, b) {
				return a.OrdinalNumber - b.OrdinalNumber;
			});
			oCurrentNode.attributes.forEach(function (oAttribute) {
				this._createAttributesMultiLabels(oAttribute, oCurrentNode.columns, oCurrentNode.LabelInfo, oCurrentNode.attributes.length);
			}.bind(this));
			oCurrentNode.hasFurtherChildren = bTableHasChildren;
			oCurrentNode.hasTotalRow = bTableHasTotal;
		},

		_createMultiLabels: function (oCurrentColumn, aTableColumns) {
			// Add the Column to Multilabel first as this is the first column in the table
			oCurrentColumn.aMultiLabels = [{
				labelInfo: oCurrentColumn.LabelInfo + " " + this.getResourceBundle().getText("xtit.dataPreview.ValueAndAttr"),
				Description: oCurrentColumn.LabelInfo + " " + this.getResourceBundle().getText("xtit.dataPreview.ValueAndAttr"),
				ElementId: oCurrentColumn.ElementId
			}];
			oCurrentColumn.aMultiLabels.push({
				labelInfo: oCurrentColumn.LabelInfo,
				Description: oCurrentColumn.Description,
				ElementId: oCurrentColumn.ElementId + "_value",
				typeInfo: oCurrentColumn.typeInfo
			});
			aTableColumns.push(oCurrentColumn);
			// Sort the Attributes based on the ordinal number as the Genereated data of attributes are sorted based on ordinal number.
			oCurrentColumn.attributes.sort(function (a, b) {
				return a.OrdinalNumber - b.OrdinalNumber;
			});
			// Loop over the current Column attributes and add multi labels to arrtibutes column and push to table column array.
			var aAttributes = oCurrentColumn.attributes;
			aAttributes.forEach(function (oCurrentAttribute) {
				var oAttributeColumnDetails = jQuery.extend(true, {}, oCurrentColumn);
				oAttributeColumnDetails.aMultiLabels = [{
					labelInfo: oCurrentColumn.LabelInfo,
					Description: oCurrentColumn.Description,
					ElementId: oCurrentColumn.ElementId
				}, {
					labelInfo: oCurrentAttribute.LabelInfo,
					Description: oCurrentAttribute.Description,
					ElementId: oCurrentColumn.ElementId + "_A" + oCurrentAttribute.AttributeId,
					typeInfo: oCurrentAttribute.typeInfo
				}];
				oAttributeColumnDetails.AttributeId = oCurrentAttribute.AttributeId;
				oAttributeColumnDetails.typeInfo = oCurrentAttribute.typeInfo;
				oAttributeColumnDetails.isAttributeColumn = true;
				oAttributeColumnDetails.id = "ID" + Math.random();
				aTableColumns.push(oAttributeColumnDetails);
			});
		},

		_createAttributesMultiLabels: function (oCurrentAttrColumn, aTableColumns, sTableLabelInfo, iAttributeLength) {
			var oAttrColumnDetails = {};
			oAttrColumnDetails.LabelInfo = oCurrentAttrColumn.LabelInfo !== "" ? oCurrentAttrColumn.LabelInfo : oCurrentAttrColumn.ElementName;
			oAttrColumnDetails.Description = oCurrentAttrColumn.Description;
			oAttrColumnDetails.ElementId = oCurrentAttrColumn.ElementId + "_A" + oCurrentAttrColumn.AttributeId;
			oAttrColumnDetails.hasChildren = false;
			oAttrColumnDetails.ParentElementId = oCurrentAttrColumn.ElementId;
			//setting OrdinalNumner with 1000 to get the attributes column at the end of all columns(children)
			oAttrColumnDetails.OrdinalNumber = parseFloat(1000 + "." + oCurrentAttrColumn.OrdinalNumber);
			oAttrColumnDetails.MaxOccurs = 1;
			oAttrColumnDetails.MinOccurs = oCurrentAttrColumn.MinOccurs;
			oAttrColumnDetails.ReferenceElementId = "";
			oAttrColumnDetails.attributes = [];
			oAttrColumnDetails.children = [];
			oAttrColumnDetails.typeInfo = oCurrentAttrColumn.typeInfo;
			oAttrColumnDetails.aMultiLabels = [{
				labelInfo: sTableLabelInfo + " - " + this.getResourceBundle().getText("xtit.visualization.attribute"),
				ElementId: ""
			}, {
				labelInfo: oAttrColumnDetails.LabelInfo,
				ElementId: oAttrColumnDetails.ElementId,
				typeInfo: oAttrColumnDetails.typeInfo
			}];
			oAttrColumnDetails.currencyTypeInfo = {};
			oAttrColumnDetails.bShowTotal = false;
			oAttrColumnDetails.iTotal = 0;
			oAttrColumnDetails.bTableAttribute = true;
			oAttrColumnDetails.isAttributeColumn = true;
			oAttrColumnDetails.iAttributesLength = iAttributeLength;

			//adding additional metadata info
			// var oNodes = this.getView().getModel("MetadataById").getProperty("/additionalMetadataById");
			// if(oNodes === undefined){oNodes = {}};
			// var oAddMetadataById = oNodes[oCurrentAttrColumn.ElementId+oCurrentAttrColumn.AttributeId];
			oAttrColumnDetails.CountValues = 0;
			oAttrColumnDetails.Shlpname = "";
			oAttrColumnDetails.Shlpfield = "";

			oAttrColumnDetails.id = "ID" + Math.random();
			aTableColumns.push(oAttrColumnDetails);
		},

		_getNewFormControl: function (oCurrentNode, oParentNode, bBeginPage, bIsChoiceBranch) {
			var aNodes = this.getView().getModel("MetadataById").getData().nodes;
			var oParentOfParentNode = bBeginPage ? aNodes[oParentNode.ParentElementId] : undefined;
			var oFormControl = {
				LabelInfo: oParentOfParentNode ? oParentOfParentNode.LabelInfo + "->" + oParentNode.LabelInfo : oParentNode.LabelInfo,
				controlType: "form",
				ParentElementId: oParentNode.ParentElementId,
				ElementId: oParentNode.ElementId,
				OrdinalNumber: oCurrentNode.OrdinalNumber,
				data: [{
					data: [oCurrentNode]
				}],
				controls: [],
				attributes: [],
				formControls: [],
				columns: [],
				parentSeqNos: [],
				bShowTitle: true,
				ErrorWarningCounter: oCurrentNode.ErrorWarningCounter,
				isAddDeleteEnabled: this._isBetaVersion("Add/Delete"),
				isChoiceBranch: bIsChoiceBranch,
				isChoice: this._isBetaVersion("ChoiceHandling") ? oCurrentNode.CollectionType === "C" : false,
			};
			return oFormControl;
		},	

		_getNewTableControl: function (oCurrentNode, oParentNode, bIsChoiceBranch) {
			var oTableControl = {
				id: "ID" + Math.random(),
				LabelInfo: oCurrentNode.LabelInfo,
				ParentLabelInfo: oParentNode ? oParentNode.LabelInfo + "->" : "",
				controlType: "table",
				ParentElementId: oCurrentNode.ParentElementId,
				ElementId: oCurrentNode.ElementId,
				data: [],
				controls: [],
				attributes: oCurrentNode.attributes,
				formControls: [],
				columns: oCurrentNode.columns,
				parentSeqNos: [],
				maxOccurs: oCurrentNode.MaxOccurs,
				minOccurs: oCurrentNode.MinOccurs,
				hasAttributes: oCurrentNode.attributes.length > 0,
				hasFurtherChildren: oCurrentNode.hasFurtherChildren,
				OrdinalNumber: oCurrentNode.OrdinalNumber,
				repeatingLeafNode: oCurrentNode.repeatingLeafNode,
				wrapperChoiceNode: oCurrentNode.wrapperChoiceNode,
				hasTotalRow: oCurrentNode.hasTotalRow,
				rowCount: 0,
				bDownload: false,
				AmountElementId: oCurrentNode.AmountElementId ? oCurrentNode.AmountElementId : [],
				sequenceNumbers: {},
				HiddenColumns: [],
				searchString: "",
				originalRowCount: 0,
				bOnLoadAddTotalsObject: false,
				complexParents: oCurrentNode.complexParents,
				filterKey: [],
				isAddDeleteEnabled: this._isBetaVersion("Add/Delete"),
				ErrorWarningCounter: oCurrentNode.ErrorWarningCounter,
				isChoiceBranch: bIsChoiceBranch,
				isChoice: this._isBetaVersion("ChoiceHandling") ? oCurrentNode.CollectionType === "C" : false,
			};
			return oTableControl;
		},

		_getNewPanelControl: function (oCurrentNode, oParentNode, bIsChoiceBranch) {
			var oPanelControl = {
				LabelInfo: oCurrentNode.LabelInfo,
				ParentLabelInfo: oParentNode ? oParentNode.LabelInfo + "->" : "",
				controlType: "panel",
				ParentElementId: oCurrentNode.ParentElementId,
				ElementId: oCurrentNode.ElementId,
				data: [],
				controls: oCurrentNode.controls,
				attributes: oCurrentNode.attributes,
				formControls: oCurrentNode.formControls,
				columns: [],
				parentSeqNos: [],
				OrdinalNumber: oCurrentNode.OrdinalNumber,
				ErrorWarningCounter: oCurrentNode.ErrorWarningCounter,
				isChoiceBranch: bIsChoiceBranch,
				isChoice: this._isBetaVersion("ChoiceHandling") ? oCurrentNode.CollectionType === "C" : false,
			};
			return oPanelControl;
		},
		
		_getNewChoiceSelectControl: function (oCurrentNode, oChoice) {
			var oChoiceControl = {
				LabelInfo: "Choose the child for " + oCurrentNode.LabelInfo,
				controlType: "select",
				ElementId: oCurrentNode.ElementId,
				ParentElementId: oCurrentNode.ParentElementId,
				choice: oChoice,
				isChoiceBranch: true,
				isEditableChoice: oCurrentNode.ManualAdjOption === "",
				data: [],
				isChoice: true,
				controls: [],
				attributes: [],
				formControls: [],
				columns: [],
				parentSeqNos: [],
				OrdinalNumber: oCurrentNode.OrdinalNumber,
			};
			return oChoiceControl;
		},

		_setControlVisibility: function (oSelectedContextObject, bSelected, aSelectedContextObject) {
			var oSelectedControl = oSelectedContextObject.controlType !== "table" ? oSelectedContextObject.formControls[0] :
				oSelectedContextObject;
			if (oSelectedControl && oSelectedControl.ArtificialNode) {
				oSelectedControl = oSelectedControl.formControls[0];
			}
			var oAttributeForm = oSelectedContextObject.attributeFormControl ? oSelectedContextObject.attributeFormControl : undefined;
			if (oSelectedContextObject.visible !== undefined) {
				oSelectedContextObject.visible = bSelected;
				if (oSelectedControl) {
					oSelectedControl.visible = bSelected;
				}
				if (oAttributeForm) {
					oAttributeForm.visible = bSelected;
				}
				if(oSelectedContextObject.isChoice){
					// for choice with immediate leaf node, each leaf Node is a form
					for(var i in oSelectedContextObject.formControls){
						oSelectedContextObject.formControls[i].visible = bSelected;
					}
				}
			} else {

				//blocking nodes with further children
				//We have to read the collected data for "Editable Choice", for defaulting the selected choice 
				// if ((oSelectedContextObject.controls.length === 0 || oSelectedContextObject.isChoice) && aSelectedContextObject.indexOf(oSelectedContextObject) === -1) { //harish
				if (oSelectedContextObject.controls.length === 0 && aSelectedContextObject.indexOf(oSelectedContextObject) === -1) {
					aSelectedContextObject.push(oSelectedContextObject);
				}
			}
		},

		ShowDetails: function (oEvent) {
			var oView = this.getView();
			var bNodeSelected = oEvent.getParameter("selected");
			var oNodeSource = oEvent.getSource();
			var oListItem = oEvent.getParameter("listItem");
			var oSelectedContextObject = oListItem.getBindingContext("structuredDataModel").getObject();
			var oStructuredDataModel = oView.getModel("structuredDataModel");
			var sPath = oListItem.getBindingContextPath();
			var oGlobalErrorWarningModel = this.getView().getModel("GlobalErrorWarningLog");
			var aSelectedContextObject = [],
				aCollectionChilds = [];
			this.getView().byId("PreviewFCL").setLayout(sap.f.LayoutType.OneColumn);
			this._manageAllSubNodesSelection(oSelectedContextObject, bNodeSelected, sPath, aSelectedContextObject, aCollectionChilds);

			//Error Warning - Interoperability
			if (this._isBetaVersion("ErrorWarning")) {
				setTimeout(function () {
					//var aAllSelectedObjects = aCollectionChilds.length ? aCollectionChilds : [oSelectedContextObject];
					oNodeSource.onItemExpanderPressed(oListItem, true);
					//PreviewErrorWarning.handleLogContextSelection(aAllSelectedObjects, bNodeSelected, this);
					PreviewErrorWarning.handleLogContextSelection(bNodeSelected, this);
				}.bind(this), oGlobalErrorWarningModel.getProperty("/HierarchyCountLoaded") ? 0 : 1000);
			}

			if (bNodeSelected) {
				this.readGeneratedData(aSelectedContextObject, sPath);
			}
		},

		_manageAllSubNodesSelection: function (oSelectedObject, bNodeSelected, sPath, aSelectedContextObject, aCollectionChilds) {
			var oStructuredDataModel = this.getView().getModel("structuredDataModel");

			//manage sub nodes selection
			for (var iNode = 0; iNode < oSelectedObject.controls.length; iNode++) {
				var oSelectedContextObject = oSelectedObject.controls[iNode];
				oSelectedContextObject.selected = bNodeSelected;
				if (aCollectionChilds && oSelectedContextObject.controls.length < 1) { //Collects all the children under it.
					aCollectionChilds.push(oSelectedObject.controls[iNode]);
				}
				this._manageAllSubNodesSelection(oSelectedContextObject, bNodeSelected, sPath, aSelectedContextObject, aCollectionChilds);
				this._setControlVisibility(oSelectedContextObject, bNodeSelected, aSelectedContextObject);
				// aSelectedContextObject.push(oSelectedContextObject);
			}

			//manage parent nodes selection
			var aHierarchyPaths = sPath.split("/controls/");
			var sParNodePath = "";
			if (bNodeSelected) {
				this._setControlVisibility(oSelectedObject, bNodeSelected, aSelectedContextObject);
				//selecting parent nodes by checking all other sub nodes
				for (var iParNode = aHierarchyPaths.length - 1; iParNode > 0; iParNode--) {
					aHierarchyPaths.pop();
					var oParentNode = oStructuredDataModel.getObject(aHierarchyPaths.join("/controls/"));
					if (this._getAllSubNodesSelected(oParentNode)) {
						oParentNode.selected = true;
					} else {
						break;
					}
				}
			} else {
				//De selecting parent nodes
				for (var iParNode = 0; iParNode < aHierarchyPaths.length; iParNode++) {
					sParNodePath = sParNodePath + (iParNode === 0 ? aHierarchyPaths[iParNode] : "/controls/" + aHierarchyPaths[iParNode]);
					var oCurrentParentNode = oStructuredDataModel.getObject(sParNodePath);
					oCurrentParentNode.selected = bNodeSelected;
					this._setControlVisibility(oCurrentParentNode, bNodeSelected, aSelectedContextObject);
				}
			}
		},

		_getAllSubNodesSelected: function (oNode) {
			return !oNode.controls.some(function (oSubNode) {
				return !oSubNode.selected;
			});
		},

		readGeneratedData: function (oSelectedContextObject, sPath, oHyperLink, bIsSubPanel, bSearch) {
			var aSelectedContextObject = Array.isArray(oSelectedContextObject) ? oSelectedContextObject : [oSelectedContextObject];
			var aLogicalSequenceElements = this._prepareLogicalSequenceData(aSelectedContextObject, oHyperLink, bIsSubPanel);
			var oView = this.getView();

			var oStructuredDataModel = oView.getModel("structuredDataModel");
			var oModel = oView.getModel();
			var oParamData = oView.getModel("paramModel").getData();
			if (this._isBetaVersion("Add/Delete")) {
				this._prepareGeneratedDataBatchNew(oModel, aLogicalSequenceElements, oHyperLink);
			} else {
				this._prepareGeneratedDataBatchOld(oModel, aLogicalSequenceElements, oHyperLink);
			}
			if (aLogicalSequenceElements.length === 0) {
				return;
			}
			BusyIndicator.show(0);
			oModel.submitChanges({
				groupId: "readDocument",
				success: jQuery.proxy(function (oResult) {
					var oGenDataSuccessParams = {
						result: oResult,
						logicalSeqElements: aLogicalSequenceElements,
						hyperlink: oHyperLink,
						path: sPath,
						selectedCtxObj: oSelectedContextObject,
						search: bSearch
					};
					if (oStructuredDataModel.getProperty("/isMetadataProcessed")) {
						this._readGenDataSuccess(oGenDataSuccessParams);
					} else {
						oStructuredDataModel.setProperty("/isInitialGenDataAvailable", true);
						oStructuredDataModel.setProperty("/generatedDataParams", oGenDataSuccessParams);

						//checking additional metadata
						var oAdditionalMetadataModel = this.getView().getModel("AdditionalMetadata");
						if (oAdditionalMetadataModel !== undefined) {
							oStructuredDataModel.setProperty("/isInitialGenDataAvailable", false);
							this._updateAdditionalMetadata();
							this._readGenDataSuccess(oGenDataSuccessParams);
						}
					}
				}, this),
				error: function (oError) {
					BusyIndicator.hide();
				}
			});
		},

		_readGenDataSuccess: function (oParams) {
			var aElements = this._setDataToContext(oParams.result, oParams.logicalSeqElements, oParams.hyperlink);
			var oStructuredDataModel = this.getView().getModel("structuredDataModel");
			var aDetailControls = oStructuredDataModel.getProperty("/details/controls");
			aDetailControls = this._prepareControlsArray(aElements, oParams.hyperlink, oParams.path, aDetailControls);
			var aSelectedContextObject = Array.isArray(oParams.selectedCtxObj) ? oParams.selectedCtxObj : [oParams.selectedCtxObj];
			if (oParams.path) {
				this._bindDetailsControls(aSelectedContextObject, aDetailControls);
			}
			if (oParams.hyperlink && !oParams.search) {
				this._bindColumnChildSection(oParams.hyperlink);
			}
			if (oParams.selectedCtxObj.bDownload) {
				this._proceedExportToExcel(oParams.selectedCtxObj);
			}
			oStructuredDataModel.checkUpdate();
			this._showSearchDataInHiddenColumnsPopover(aElements);
			BusyIndicator.hide();
		},

		_showSearchDataInHiddenColumnsPopover: function (aElements) {
			var bTableSearch = false;
			aElements.forEach(function (oElement) {
				if (oElement.controlType === "table" && oElement.selectedObject.searchString !== "") {
					bTableSearch = true;
				}
			});
			if (bTableSearch && aElements[0].selectedObject.HiddenColumns.length > 0) {
				sap.m.MessageBox.confirm(this.getResourceBundle().getText("xmsg.visualization.showSearchHiddenColumns"), {
					icon: sap.m.MessageBox.Icon.WARNING,
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					onClose: function (oAction) {
						if (oAction === "YES") {
							var oSelectedContextObject = aElements[0].selectedObject;
							var oTable = sap.ui.getCore().byId(oSelectedContextObject.id);
							var aColumns = oTable.getColumns();
							var aHiddenColumns = oSelectedContextObject.HiddenColumns;
							aColumns.forEach(function (oColumn) {
								aHiddenColumns.forEach(function (sHiddenColumnId) {
									if (oColumn.getId() === sHiddenColumnId) {
										oColumn.setVisible(true);
									}
								});
							});
						}
					}
				});
				// sap.m.MessageBox.information("Search results are available in " + aElements[0].selectedObject.HiddenColumns.join(", ") + " Columns");
			}
		},

		_setDataToContext: function (oResult, aLogicalSequenceElements, oHyperLink) {
			var sFieldArrangement = this.getView().getModel("DocumentData").getProperty("/FieldArrangement");
			var aDuplicateGroups = [];
			var aUniqueLogicalSeq = [];
			// To find the artifical nodes in the call sequence.
			var oUniqueKeys = aLogicalSequenceElements[0].UniqueCallsKey;
			if (this._isBetaVersion("Add/Delete")) {
				// Remove duplicate entires of GenData Vs AttrData
				for (var i = 0; i < aLogicalSequenceElements.length; i++) {
					if (!aLogicalSequenceElements[i].isDuplicate) {
						aUniqueLogicalSeq.push(aLogicalSequenceElements[i]);
					}
				}
			} else {
				aLogicalSequenceElements.forEach(function (oLogicalSequenceElement) {
					aUniqueLogicalSeq.push(oLogicalSequenceElement);
				});
			}
			oResult.__batchResponses.forEach(function (oResponse, idx) {
				var oLogicalSequenceElement = aUniqueLogicalSeq[idx];
				// if(oLogicalSequenceElement.dataType === "selectChoice"){
				// 	iCorr++;
				// 	oLogicalSequenceElement = aUniqueLogicalSeq[idx + iCorr];
				// }
				var oSelectedContextObject = oLogicalSequenceElement.selectedObject;
				var aResponse = oResponse.data.results;
				// if(aResponse.length === 0 && oLogicalSequenceElement.dataType === "TableRowCount"){
				// 	this._ConstructTableRowCountAndTotals(aResponse, oSelectedContextObject);
				// }
				if (aResponse.length === 0) {
					return;
				}
				var sGroupKey = [oSelectedContextObject.ParentElementId, oSelectedContextObject.ElementId].join("-");
				switch (oLogicalSequenceElement.dataType) {
				case "FormGeneratedData":
					var iUniqueKeyLength = oUniqueKeys[sGroupKey].length;
					oUniqueKeys[sGroupKey].forEach(function (iSequence, idx) {
						var oFormSelectedContextObject = iUniqueKeyLength > 1 ? aUniqueLogicalSeq[iSequence + iCorr].selectedObject :
							oSelectedContextObject;
						// var oFormSelectedContextObject = oSelectedContextObject; //todo - check with kalyan on aLogicalSequenceElements[iSequence].selectedObject;
						var aFormControl = oFormSelectedContextObject.formControls.length > 0 ? oFormSelectedContextObject.formControls :
							[oFormSelectedContextObject];
						for(var i in aFormControl){	
							var oFormControl = aFormControl[i]
							var oFormElements = oFormControl.data[0].data;
							if (sFieldArrangement !== "1" && oFormControl.data[1]) {
								oFormElements = oFormElements.concat(oFormControl.data[1].data);
							}
							aResponse.forEach(function (oResponse) {
								oResponse.ChangeIndicator = oFormSelectedContextObject.isParentDeleted ? "DM" : oResponse.ChangeIndicator;
							});
							this._ConstructFormData(aResponse, oFormElements);
							if (idx >= 1) {
								// aDuplicateGroups.push(aUniqueLogicalSeq[iSequence]);
								aUniqueLogicalSeq.splice(iSequence, 1);
							}
	
							if (this._isBetaVersion("Add/Delete") && oSelectedContextObject.attributes.length > 0) {
								this._constructAttrFormControl(aResponse, oSelectedContextObject, oHyperLink);
							}
						}
					}.bind(this));
					break;

				case "FormAttributeData":
					this._constructAttrFormControl(aResponse, oSelectedContextObject, oHyperLink);
					break;

				case "TableGeneratedData":
					var aRespCopy;
					// if(oSelectedContextObject.wrapperChoiceNode){
					// 	aRespCopy = $.extend(true, [], aResponse); 
					// }
					this._ConstructTableData(aResponse, oSelectedContextObject);
					if(oSelectedContextObject.wrapperChoiceNode){
						// this._ConstructTableHierarchyData(aRespCopy, oSelectedContextObject, oHyperLink);
					}
					break;

				case "TableAttributeData":
					this._ConstructTableAttributeData(aResponse, oSelectedContextObject, oHyperLink);
					break;

				case "TableHyperlinkData":
					this._ConstructTableHierarchyData(aResponse, oSelectedContextObject, oHyperLink);
					break;

				case "TableRowCount":
					this._ConstructTableRowCountAndTotals(aResponse, oSelectedContextObject);
					break;
				case "ChoiceGeneratedData":
					var oChoiceControl  = oSelectedContextObject.choice;
					oChoiceControl.SequenceNo = aResponse[0].SequenceNo;
					oChoiceControl.ParentSeqNo = aResponse[0].ParentSeqNo;
					oChoiceControl.GeneratedValue = aResponse[0].GeneratedValue;
					oChoiceControl.ModifiedValue = aResponse[0].ModifiedValue;
					oChoiceControl.ChangeIndicator = aResponse[0].ChangeIndicator;
					oChoiceControl.Key = aResponse[0].Key;
					oChoiceControl.displayValue = oChoiceControl.ChangeIndicator && oChoiceControl.ChangeIndicator !== "" ? oChoiceControl.ModifiedValue : oChoiceControl.GeneratedValue;
					break;
				// case "choiceTableGeneratedData":
				// 	this._ConstructTableHierarchyData(aResponse, oSelectedContextObject, oHyperLink);
				// 	break;
				}
			}.bind(this));
			return aLogicalSequenceElements.concat(aDuplicateGroups);
		},

		_prepareControlsArray: function (aLogicalSequenceElements, oHyperLink, sPath, aDetailControls) {
			aLogicalSequenceElements.forEach(function (oLogicalSequenceElement) {
				var oSelectedContextObject = oLogicalSequenceElement.selectedObject;

				//For anonymous element child data, no need to prepare seperate control
				if (oSelectedContextObject.AnonymousChildGenData) {
					return;
				}
				// oSelectedContextObject.data = [oSelectedContextObject.data[0]];
				// oSelectedContextObject.originalRowCount = 1;
				//Converting single table record to form
				var bTableHasSingleRec = oSelectedContextObject.hasTotalRow ? oSelectedContextObject.data.length === 2 :
					oSelectedContextObject.data
					.length === 1;
				bTableHasSingleRec = bTableHasSingleRec && oSelectedContextObject.searchString === "" && oSelectedContextObject.filterKey.length ===
					0;
				if (bTableHasSingleRec && oLogicalSequenceElement.dataType === "TableGeneratedData") {
					//Getting child controls data
					var oSelectedContextObjectCopy = jQuery.extend(true, {}, oSelectedContextObject);
					this._convertOneRecordTableToForm(oSelectedContextObjectCopy);
					Object.defineProperty(oSelectedContextObjectCopy, "visible", {
						get: function () {
							return oSelectedContextObject.visible;
						}
					});
				}
				var oTargetControl;
				switch (oLogicalSequenceElement.dataType) {
				case "TableGeneratedData":
					oTargetControl = oSelectedContextObjectCopy ? oSelectedContextObjectCopy : oSelectedContextObject;
					if (oSelectedContextObjectCopy && oTargetControl.hasAttributes) {
						oTargetControl = [oTargetControl, oTargetControl.attributeFormControl];
					}
					break;

				case "FormGeneratedData":
					oTargetControl = oSelectedContextObject.isChoice ? oSelectedContextObject.formControls : oSelectedContextObject.formControls[0];
					break;

				case "FormAttributeData":
					oTargetControl = oSelectedContextObject.attributeFormControl;
					break;
				
				case "ChoiceGeneratedData":
					this.handleChoiceChildrenVis(oSelectedContextObject.choice, oSelectedContextObject.choice.displayValue);
					oTargetControl = [oSelectedContextObject];
					break;
				}

				if (oTargetControl && sPath) {
					if (!oSelectedContextObjectCopy) {
						if(Array.isArray(oTargetControl)){
							for(var i in oTargetControl){ // For a choice panel with immediate leaf nodes, each leaf node will be a form, so the visibility has to be controlled accordingly
								oTargetControl[i].visible = true;	
							}
						}else{
							oTargetControl.visible = true;
						}
					}
					aDetailControls = aDetailControls.concat(oTargetControl);
				}
				if (bTableHasSingleRec && oHyperLink && oLogicalSequenceElement.dataType === "TableGeneratedData") {
					var sSelectedElementId = oHyperLink.data("ElementId");
					var oHyperLinkChild = oHyperLink.getBindingContext("structuredDataModel").getObject()["E" + sSelectedElementId + "_Children"]
						[0];
					if (oHyperLinkChild.controlType === "panel") {
						var aHyperlinkChildControls = oHyperLinkChild.controls;
						aHyperlinkChildControls.forEach(function (oHyperlinkChildControl, idx) {
							if (oHyperlinkChildControl.ElementId === oSelectedContextObjectCopy.ElementId) {
								aHyperlinkChildControls[idx] = oSelectedContextObjectCopy;
							}
						});
					} else {
						oHyperLink.getBindingContext("structuredDataModel").getObject()["E" + sSelectedElementId + "_Children"][0] =
							oSelectedContextObjectCopy;
					}
				}
			}.bind(this));
			return aDetailControls;
		},
		
		handleChoiceChildrenVis: function(choice, sSelectedChoice){ // harish: rename to oSelectedContexObject
			for(var i = 0; i < choice.controls.length; i++){
					var currCtr = choice.controls[i];
					if(currCtr.controlType === 'select')
				    	continue;
					this.handleChoiceVisibility(currCtr, currCtr.ElementId === sSelectedChoice, sSelectedChoice);
				}
			for(var i = 0; i < choice.formControls.length; i++){
					var currCtr = choice.formControls[i];
					this.handleChoiceVisibility(currCtr, currCtr.ElementId === sSelectedChoice, sSelectedChoice);
				}
		},
		
		handleChoiceVisibility: function(oCtxObject, bSelectedChoice, sSelectedChoiceId){
			oCtxObject.selectedChoiceVis = bSelectedChoice;
			switch (oCtxObject.controlType) {
				case 'table':
						break;
				case 'panel':
					if (oCtxObject.controls.length > 0) {
							for (var iCtrl in oCtxObject.controls) {
								this.handleChoiceVisibility(oCtxObject.controls[iCtrl], bSelectedChoice ? bSelectedChoice : sSelectedChoiceId === oCtxObject.controls[iCtrl].ElementId, sSelectedChoiceId);
								}
						}else{ 
							for (var iCtrl in oCtxObject.formControls) {
								this.handleChoiceVisibility(oCtxObject.formControls[iCtrl], bSelectedChoice ? bSelectedChoice : sSelectedChoiceId === oCtxObject.ElementId, sSelectedChoiceId);
							}
						}
						break;
				case 'form':
					    delete oCtxObject.selectedChoiceVis; // visibility of a choice form child should be re-calculated, if it has a selected choice
						for (var j in oCtxObject.data) {
							for (var k in oCtxObject.data[j].data) {
								 var oFormElem = oCtxObject.data[j].data[k];
									 oFormElem.selectedChoiceVis = bSelectedChoice ? bSelectedChoice : oFormElem.ElementId === sSelectedChoiceId;
									 // We create a separate form for each leaf node of a choice, hence if any of the leaf node is the selected choice
									 // Make that form visible
									 if(!oCtxObject.selectedChoiceVis)
										oCtxObject.selectedChoiceVis = oFormElem.selectedChoiceVis;
								}
							}
						break;
			}
		},

		_bindDetailsControls: function (aSelectedContextObject, aDetailControls) {
			aSelectedContextObject.forEach(function (oSelectedObj) {
				oSelectedObj.visible = true;
			});
			this.getView().byId("PreviewFCL").setLayout(sap.f.LayoutType.OneColumn);
			var oStructuredDataModel = this.getView().getModel("structuredDataModel");
			var oDetailsVbox = this.getView().byId("BeginPages--DetailsPage1");
			oDetailsVbox.bindAggregation("items", {
				path: "structuredDataModel>/details/controls",
				sorter: new Sorter({
					path: 'OrdinalNumber',
					descending: false
				}),
				templateShareable: false,
				factory: this._getChildControl.bind(this)
			});
			oStructuredDataModel.setProperty("/details/controls", aDetailControls);
		},

		_prepareGeneratedDataBatchNew: function (oModel, aLogicalSequenceElements, oHyperLink) {
			var oView = this.getView();
			var oStructuredDataModel = oView.getModel("structuredDataModel");
			var oParamData = oView.getModel("paramModel").getData();
			var sDocumentPath = "/ReportRunDocumentSet(guid'" + oParamData.key + "')";
			var sGeneratedPath = sDocumentPath + "/GeneratedDocumentData";
			oModel.setDeferredGroups(["readDocument"]);
			aLogicalSequenceElements.forEach(function (oLogicalSequenceElement, idx) {
				// if(oLogicalSequenceElement.dataType === "selectChoice"){
				// 	return;
				// }
				var oURLParameters = oLogicalSequenceElement.urlParameters;
				var sSearchQuery = oLogicalSequenceElement.selectedObject.searchString;
				var aFilterKey = oLogicalSequenceElement.selectedObject.filterKey;
				if (sSearchQuery) {
					oURLParameters.SearchText = ["*", oLogicalSequenceElement.selectedObject.searchString, "*"].join("");
					oURLParameters.SearchType = "BS";
					oURLParameters.SearchOption = "CP";
				}
				if (aFilterKey && aFilterKey.length > 0) {
					oURLParameters.TableFilter = aFilterKey.join(",");
				}
				if (oLogicalSequenceElement.hasFurtherChildren) {
					if (oHyperLink) {
						oURLParameters.ParentSeqNo = oHyperLink.data("ParentSeqNo");
					}
					oURLParameters.DocumentUUID = oParamData.key;
					oModel.callFunction("/GetSequenceNumIntervals", {
						method: "GET",
						urlParameters: oURLParameters,
						groupId: "readDocument"
					});
				} else if (oLogicalSequenceElement.dataType === "TableRowCount") {
					var oSelectedObject = oLogicalSequenceElement.selectedObject;
					var iSeqNo = oSelectedObject.bTableInPanel ? oSelectedObject.ParentSeqNo : 1;
					// For row count check for Hyper link and if not there check intermidate Parent seq no otherwise it's 1
					var sParentSeqNo = oHyperLink ? oHyperLink.data("ParentSeqNo") : (oSelectedObject.ParentSeqNo ? oSelectedObject.ParentSeqNo :
						1);
					oURLParameters.ParentSeqNo = sParentSeqNo;
					oURLParameters.AmountElementId = oSelectedObject.AmountElementId.join(";");
					oURLParameters.DocumentUUID = oParamData.key;
					oModel.callFunction("/GetTableRowCountAndTotal", {
						method: "GET",
						urlParameters: oURLParameters,
						groupId: "readDocument"
					});
				} else {
					if (sSearchQuery) {
						delete oURLParameters.SearchText;
						oURLParameters.search = ["*", oLogicalSequenceElement.selectedObject.searchString, "*"].join("");
					}
					var oReadParams = {
						groupId: "readDocument",
						sorters: oLogicalSequenceElement.sorters,
						urlParameters: oLogicalSequenceElement.urlParameters
					};
					oModel.read(sGeneratedPath, oReadParams);
				}
			});
		},

		_prepareGeneratedDataBatchOld: function (oModel, aLogicalSequenceElements, oHyperLink) {
			var oView = this.getView();
			var oStructuredDataModel = oView.getModel("structuredDataModel");
			var oParamData = oView.getModel("paramModel").getData();
			var sDocumentPath = "/ReportRunDocumentSet(guid'" + oParamData.key + "')";
			var sGeneratedPath = sDocumentPath + "/GeneratedDocumentData";
			oModel.setDeferredGroups(["readDocument"]);
			aLogicalSequenceElements.forEach(function (oLogicalSequenceElement, idx) {
				var sSearchQuery = oLogicalSequenceElement.selectedObject.searchString;
				var oCustomHeaders = null;
				var oSelectedContextObject = oLogicalSequenceElement.selectedObject;
				if (oSelectedContextObject.controlType === "table") {
					var iCurrentRowRecords = oSelectedContextObject.data.length === 0 ? 1 : oSelectedContextObject.data.length + 1;
					var iRowRecordsToFetch = oSelectedContextObject.data.length === 0 ? 400 : oSelectedContextObject.bDownload ?
						oSelectedContextObject.rowCount : oSelectedContextObject.data.length + 400;
					if (sSearchQuery) {
						var oSelectedContextObject = oLogicalSequenceElement.selectedObject;
						oCustomHeaders = {
							"limit": oSelectedContextObject.bDownload ? oSelectedContextObject.rowCount : "" + 400 + "",
							"offset": "" + iCurrentRowRecords - 1 + ""
						};
						// while search the sequence number range should be 1 to row count
						iRowRecordsToFetch = oSelectedContextObject.originalRowCount;
					}
				}
				oModel.setHeaders(oCustomHeaders);
				if (oLogicalSequenceElement.hasFurtherChildren) {
					if (oHyperLink || oSelectedContextObject.bNestedTable) { // Data for immediate Children
						var bTablehasNoData = oSelectedContextObject.data.length === 0;
						var iMinSequenceNo = (oSelectedContextObject.bTableInPanel || oSelectedContextObject.bNestedTable) ? oSelectedContextObject.MinSequenceNo :
							oHyperLink.data(
								"MinSequenceNo");
						var iMaxSequenceNo = (oSelectedContextObject.bTableInPanel || oSelectedContextObject.bNestedTable) ? oSelectedContextObject.MaxSequenceNo :
							oHyperLink.data(
								"MaxSequenceNo");
						var iTotalChildren = (iMaxSequenceNo - iMinSequenceNo) + 1;
						var iTableLength = oSelectedContextObject.data.length;
						var aChildTableLastSequenceNo = bTablehasNoData ? 0 : oSelectedContextObject.data[iTableLength - 1]["S" +
							oSelectedContextObject.ElementId
						].SequenceNo;
						iCurrentRowRecords = bTablehasNoData ? iMinSequenceNo : aChildTableLastSequenceNo + 1;
						var iCurrentSeqNo = aChildTableLastSequenceNo === 0 ? iMinSequenceNo : aChildTableLastSequenceNo;
						var iMaxRecords = (iTotalChildren - iTableLength) > 400 && !oSelectedContextObject.bDownload ? (iCurrentSeqNo + 400) :
							iMaxSequenceNo;
						iRowRecordsToFetch = iTotalChildren <= 400 ? iMaxSequenceNo : iMaxRecords;
						if (sSearchQuery) {
							iCurrentRowRecords = iMinSequenceNo;
							iRowRecordsToFetch = iMaxSequenceNo;
						}
					}
					var sParentSeqNumber = [iCurrentRowRecords, iRowRecordsToFetch].join("-");
					var oFunctionImpUrlParams = {
						ParentElementId: oLogicalSequenceElement.selectedObject.ElementId,
						DocumentUUID: oParamData.key,
						ParentSeqNoInterval: sParentSeqNumber
					};
					if (sSearchQuery) {
						oFunctionImpUrlParams.SearchText = sSearchQuery;
					}
					oModel.callFunction("/GetSequenceNumIntervals", {
						method: "GET",
						urlParameters: oFunctionImpUrlParams,
						groupId: "readDocument"
					});
				} else if (oLogicalSequenceElement.dataType === "TableRowCount") {
					var oSelectedObject = oLogicalSequenceElement.selectedObject;
					var iSeqNo = (oSelectedObject.bTableInPanel || oSelectedContextObject.bNestedTable) ? oSelectedObject.ParentSeqNo : 1;
					var sParentSeqNo = oHyperLink ? oHyperLink.data("ParentSeqNo") : iSeqNo;
					var oTableRowCountUrlParms = {
						ParentSeqNo: sParentSeqNo,
						ElementId: oSelectedObject.ElementId,
						DocumentUUID: oParamData.key,
						AmountElementId: oSelectedObject.AmountElementId.join(";")
					};
					if (sSearchQuery) {
						if (oSelectedObject.repeatingLeafNode) {
							oTableRowCountUrlParms.ElementId = oSelectedObject.ParentElementId;
						}
						oTableRowCountUrlParms.SearchText = sSearchQuery;
						var aSeqRange = [1, oSelectedObject.originalRowCount];
						if (oHyperLink) {
							aSeqRange = [oHyperLink.data("MinSequenceNo"), oHyperLink.data("MaxSequenceNo")];
						} else if (oSelectedContextObject.bNestedTable) {
							aSeqRange = [oSelectedContextObject.MinSequenceNo, oSelectedContextObject.MaxSequenceNo];
						}
						oTableRowCountUrlParms.SeqNoInterval = aSeqRange.join("-");
					}
					oModel.callFunction("/GetTableRowCountAndTotal", {
						method: "GET",
						urlParameters: oTableRowCountUrlParms,
						groupId: "readDocument"
					});
				} else {
					var oReadParams = {
						groupId: "readDocument",
						filters: oLogicalSequenceElement.filters,
						sorters: oLogicalSequenceElement.sorters
					};
					if (sSearchQuery) {
						oReadParams.urlParameters = {
							search: sSearchQuery
						};
					}
					oModel.read(sGeneratedPath, oReadParams);
				}
			});
		},

		_prepareLogicalSequenceData: function (aSelectedContextObject, oHyperLink, bIsSubPanel) {
			var aSequenceData = [];
			var oUniqueCallsKey = {};
			var iSequenceCorrection = 0;
			var oAnonymousElementById = this.getView().getModel("MetadataById").getProperty("/anonymousElementById");
			aSelectedContextObject.forEach(function (oSelectedContextObject) {
				// this._updateUniqueKeysObject(oSelectedContextObject, oUniqueCallsKey, aSequenceData, iSequenceCorrection);
				// if(oSelectedContextObject.controlType === 'select'){ // no need to make a call, just a control to control the visbility of the choice children
				// 	var oSelectedNodeData = {};
				// 	oSelectedNodeData.dataType = "selectChoice";
				// 	oSelectedNodeData.controlType = "select";
				// 	oSelectedNodeData.selectedObject = oSelectedContextObject;
				// 	aSequenceData.push(oSelectedNodeData);
				// 	return;
				// }
				
				var sGroupKey = [oSelectedContextObject.ParentElementId, oSelectedContextObject.ElementId].join("-");
				if (oUniqueCallsKey[sGroupKey]) {
					oUniqueCallsKey[sGroupKey].push(aSequenceData.length - iSequenceCorrection);
					iSequenceCorrection++;
				} else {
					oUniqueCallsKey[sGroupKey] = [aSequenceData.length - iSequenceCorrection];
				}
				
				// if (oSelectedContextObject.isChoice && oSelectedContextObject.controlType !== "table") {
				// 	aSequenceData.push(this._getChoiceNodeMetadata(oSelectedContextObject, oHyperLink));
				// }
				
				if (oSelectedContextObject.formControls.length > 0 || oSelectedContextObject.controlType === "form" || oSelectedContextObject.controlType ===
					"table" || oSelectedContextObject.isChoice) {
					aSequenceData.push(this._getSelectedNodeMetaData(oSelectedContextObject, true, oHyperLink, false, bIsSubPanel));
				}
				if (oSelectedContextObject.controlType === "table" && oSelectedContextObject.hasFurtherChildren) {
					aSequenceData.push(this._getSelectedNodeMetaData(oSelectedContextObject, true, oHyperLink, true, bIsSubPanel));
				}
				if (oSelectedContextObject.attributes.length > 0) { // TODO check for form with only attributes.
					var oAttrSeqData = this._getSelectedNodeMetaData(oSelectedContextObject, false, oHyperLink, false, bIsSubPanel);
					if (oSelectedContextObject.controlType === "table" || oSelectedContextObject.formControls.length > 0) {
						oAttrSeqData.isDuplicate = true;
						// // For old oData service add Attribute sequence data for both table & Form
						// if((oSelectedContextObject.controlType === "table" || oSelectedContextObject.formControls.length > 0) && !this._isBetaVersion("Add/Delete")){
						// 	aSequenceData.push(oAttrSeqData);
						// }
						// // For new oData service add Attribute sequence data for Form with only attributes
						// if(oSelectedContextObject.controlType === "form" && oSelectedContextObject.formControls.length === 0 && this._isBetaVersion("Add/Delete")){
						// 	aSequenceData.push(oAttrSeqData);
					}
					aSequenceData.push(oAttrSeqData);
				}
				if (oSelectedContextObject.controlType === "table" && oSelectedContextObject.data.length === 0) {
					var oNodeMetada = this._getSelectedNodeMetaData(oSelectedContextObject, true, oHyperLink, false, bIsSubPanel);
					oNodeMetada.dataType = "TableRowCount";
					aSequenceData.push(oNodeMetada);
				}
                if(!this._isBetaVersion("ChoiceHandling")){
					// For Anonymous child generated data
					var oAnonymousSeqDataObj;
					if ((oSelectedContextObject.formControls.length > 0 || oSelectedContextObject.controlType === "form") && oAnonymousElementById[
							oSelectedContextObject.ElementId]) {
						var aAnonymousElementIds = oAnonymousElementById[oSelectedContextObject.ElementId];
						oAnonymousSeqDataObj = this._gerAnonymousElementsSeqData(oAnonymousElementById, aAnonymousElementIds, oSelectedContextObject,
							oUniqueCallsKey, aSequenceData, iSequenceCorrection, oHyperLink);
						aSequenceData = oAnonymousSeqDataObj.aSequenceData;
						iSequenceCorrection = oAnonymousSeqDataObj.iSequenceCorrection;
					}
                }
			}.bind(this));
			// this.getView().setModel(new JSONModel(oUniqueCallsKey), "UniqueKeys");
			if (aSequenceData[0])
				aSequenceData[0].UniqueCallsKey = oUniqueCallsKey;
			return aSequenceData;
		},
		
		_getChoiceNodeMetadata: function(oSelectedContextObject, oHyperLink){
			var oSelectedNodeData = {};
				oSelectedNodeData.dataType = "ChoiceGeneratedData";
				oSelectedNodeData.controlType = oSelectedContextObject.controlType;
				oSelectedNodeData.urlParameters = this._getGenereatedUrlParameters(oSelectedContextObject, false, oHyperLink);
				oSelectedNodeData.selectedObject = oSelectedContextObject;
				return oSelectedNodeData;
		},

		_gerAnonymousElementsSeqData: function (oAnonymousElementById, aAnonymousElementIds, oSelectedContextObject, oUniqueCallsKey,
			aSequenceData, iSequenceCorrection, oHyperLink) {
			aAnonymousElementIds.forEach(function (sAnonymousChildId) {
				var oAnonymousContextObject = jQuery.extend(true, {}, oSelectedContextObject);
				oAnonymousContextObject.ElementId = sAnonymousChildId;
				oAnonymousContextObject.AnonymousChildGenData = true;
				oAnonymousContextObject.formControls = oSelectedContextObject.formControls;
				oAnonymousContextObject.data = oSelectedContextObject.data;
				// this._updateUniqueKeysObject(oAnonymousContextObject, oUniqueCallsKey, aSequenceData, iSequenceCorrection);
				var sGroupKey = [oAnonymousContextObject.ParentElementId, oAnonymousContextObject.ElementId].join("-");
				if (oUniqueCallsKey[sGroupKey]) {
					oUniqueCallsKey[sGroupKey].push(aSequenceData.length - iSequenceCorrection);
					iSequenceCorrection++;
				} else {
					oUniqueCallsKey[sGroupKey] = [aSequenceData.length - iSequenceCorrection];
				}
				var oAnonymousSequenceData = this._getSelectedNodeMetaData(oAnonymousContextObject, true, oHyperLink);
				aSequenceData.push(oAnonymousSequenceData);
				if (oAnonymousElementById[sAnonymousChildId]) {
					var oChildAnonymousSeqDataObj;
					oChildAnonymousSeqDataObj = this._gerAnonymousElementsSeqData(oAnonymousElementById, oAnonymousElementById[sAnonymousChildId],
						oSelectedContextObject, oUniqueCallsKey, aSequenceData, iSequenceCorrection, oHyperLink);
					aSequenceData = oChildAnonymousSeqDataObj.aSequenceData;
					iSequenceCorrection = oChildAnonymousSeqDataObj.iSequenceCorrection;
				}
			}.bind(this));
			return {
				"aSequenceData": aSequenceData,
				"iSequenceCorrection": iSequenceCorrection
			};
		},

		// _updateUniqueKeysObject: function(oSelectedContextObject, oUniqueCallsKey, aSequenceData, iSequenceCorrection){
		// },

		_getSelectedNodeMetaData: function (oSelectedContextObject, bParentNode, oHyperLink, bHasChildren, bIsSubPanel) {
			var oSelectedNodeData = {};
			var sSeqProperty = "";
			var bEnableAddDelete = this._isBetaVersion("Add/Delete");
			oSelectedNodeData.hasFurtherChildren = bHasChildren;
			oSelectedNodeData.dataType = this._getDataType(oSelectedContextObject, bParentNode, bHasChildren);
			oSelectedNodeData.controlType = oSelectedContextObject.controlType === "table" ? "table" : "form";
			if (bEnableAddDelete) {
				oSelectedNodeData.urlParameters = this._getGenereatedUrlParameters(oSelectedContextObject, !bParentNode, oHyperLink, bIsSubPanel);
				sSeqProperty = oSelectedContextObject.searchString ? "SequenceNo" : "OrdinalNo";
			} else {
				oSelectedNodeData.filters = !bHasChildren ? this._getGenereatedDataFilters(oSelectedContextObject, !bParentNode, oHyperLink,
					bIsSubPanel) : []; // incase of attributes we should pass true for filters
				sSeqProperty = bParentNode ? bTableWithNonRepeatingLeafNode ? "ParentSeqNo" : "SequenceNo" : "SequenceNo";
			}
			// For Repeating leaf node table sort order should be Sequence number.
			var bTableWithNonRepeatingLeafNode = oSelectedContextObject.controlType === "table" && oSelectedContextObject.repeatingLeafNode ===
				undefined;
			// var sProperty = oSelectedContextObject.searchString ? "SequenceNo" : "OrdinalNo"; // TODO check results for search
			// var sSeqProperty = bParentNode && !bEnableAddDelete ? bTableWithNonRepeatingLeafNode ? "ParentSeqNo" : "SequenceNo" : sProperty;
			// var bTableWithNonRepeatingLeafNode = oSelectedContextObject.controlType === "table" && oSelectedContextObject.repeatingLeafNode === undefined;
			oSelectedNodeData.sorters = [new Sorter(sSeqProperty, false), new Sorter("ElementId", false), new Sorter("AttributeId", false)];
			oSelectedNodeData.selectedObject = oSelectedContextObject;
			return oSelectedNodeData;
		},

		_getGenereatedUrlParameters: function (oSelectedContextObject, bElementHasAttributes, oHyperLink, bIsSubPanel) {
			var bAttributeOrRepeaitngLeafNode = bElementHasAttributes || oSelectedContextObject.repeatingLeafNode; // TODO check for repeating lead Node
			var oUrlParameters = {
				PageOffset: 0,
				PageLimit: 1,
				ElementId: oSelectedContextObject.ElementId
			};
			if (oSelectedContextObject.controlType === "table") {
				oSelectedContextObject.data = oSelectedContextObject.data ? oSelectedContextObject.data : [];
				var sSearchQuery = oSelectedContextObject.searchString;
				var bTablehasNoData = oSelectedContextObject.data.length === 0;
				var oLastRecord = bTablehasNoData ? {} : oSelectedContextObject.data[oSelectedContextObject.data.length - 1]["S" +
					oSelectedContextObject.ElementId
				];
				var iCurrentRowRecords = bTablehasNoData ? 0 : oLastRecord.PreviousSeqNo + ';' + oLastRecord.SubordinalNo;
				// if (sSearchQuery) { // while search the sequence number range should be 1 to row count
				// 	iCurrentRowRecords = iCurrentRowRecords;
				// 	// iRowRecordsToFetch = 400;
				// }
				// aFilters.push(new Filter("IsSingleValuedLeafElement", "EQ", bAttributeOrRepeaitngLeafNode ? "" : "X"));
				oUrlParameters.PageOffset = iCurrentRowRecords;
				oUrlParameters.PageLimit = oSelectedContextObject.bDownload ? oSelectedContextObject.rowCount : 400;
				if (oHyperLink || oSelectedContextObject.ParentSeqNo) {
					oUrlParameters.ParentSeqNo = oHyperLink ? oHyperLink.data("ParentSeqNo") : oSelectedContextObject.ParentSeqNo;
				}
			} else if (oHyperLink) { //for Panel/Form as hyperlink in table
				oUrlParameters.ParentSeqNo = oHyperLink.data("ParentSeqNo"); // TODO check for intermideate parent node usecase(India GST)
			}
			return oUrlParameters;

		},

		_getDataType: function (oSelectedContextObject, bParentNode, bHasChildren) {
			var sDataType = "";
			var sControlType = oSelectedContextObject.controlType;
			if(oSelectedContextObject.isChoice){
				return "ChoiceGeneratedData";
			}
			if ((sControlType === "form" || oSelectedContextObject.formControls.length > 0) && bParentNode) {
				sDataType = "FormGeneratedData";
			} else if (oSelectedContextObject.attributes.length > 0 && !bParentNode) {
				sDataType = sControlType === "table" ? "TableAttributeData" : "FormAttributeData";
			} else if (sControlType === "table" && bParentNode && !bHasChildren) {
				sDataType = "TableGeneratedData";
			} else if (sControlType === "table" && bParentNode && bHasChildren) {
				sDataType = "TableHyperlinkData";
			}

			return sDataType;
		},

		_getGenereatedDataFilters: function (oSelectedContextObject, bElementHasAttributes, oHyperLink, bIsSubPanel) {
			var bAttributeOrRepeaitngLeafNode = bElementHasAttributes || oSelectedContextObject.repeatingLeafNode;
			var aFilters = [new Filter(bAttributeOrRepeaitngLeafNode ? "ElementId" : "ParentElementId", "EQ", oSelectedContextObject.ElementId)];
			if (oSelectedContextObject.controlType === "table") {
				oSelectedContextObject.data = oSelectedContextObject.data ? oSelectedContextObject.data : [];
				var sSearchQuery = oSelectedContextObject.searchString;
				var bTablehasNoData = oSelectedContextObject.data.length === 0;
				var iCurrentRowRecords = oSelectedContextObject.data.length + 1;
				var iRowRecordsToFetch = bTablehasNoData ? 400 : oSelectedContextObject.data.length + 400;
				if (sSearchQuery) { // while search the sequence number range should be 1 to row count
					iCurrentRowRecords = 1;
					iRowRecordsToFetch = oSelectedContextObject.originalRowCount;
				}
				aFilters.push(new Filter("IsSingleValuedLeafElement", "EQ", bAttributeOrRepeaitngLeafNode ? "" : "X"));

				// Get Sequence number interval for table under a hyper link
				// bTableInPanel For Hyperlink in parent table if the child is Panel and it has table as further children we have to adjust the Min and Max sequence numbers as Panel sequence is dependend on Parent table
				if ((oHyperLink && !bIsSubPanel) || oSelectedContextObject.bTableInPanel || oSelectedContextObject.bNestedTable) {
					var iMaxSequenceNo = (oSelectedContextObject.bTableInPanel || oSelectedContextObject.bNestedTable) ? oSelectedContextObject.MaxSequenceNo :
						oHyperLink.data(
							"MaxSequenceNo");
					var iMinSequenceNo = (oSelectedContextObject.bTableInPanel || oSelectedContextObject.bNestedTable) ? oSelectedContextObject.MinSequenceNo :
						oHyperLink.data(
							"MinSequenceNo");
					var oSequenceData = this.getSequenceNumberIntervalforChildTable(iMaxSequenceNo, iMinSequenceNo, oSelectedContextObject,
						bTablehasNoData);
					iCurrentRowRecords = oSequenceData.iCurrentRowRecords;
					iRowRecordsToFetch = oSequenceData.iRowRecordsToFetch;
					if (sSearchQuery) { // while search the sequence number range should be min seq to max seq
						iCurrentRowRecords = iMinSequenceNo;
						iRowRecordsToFetch = iMaxSequenceNo;
					}
				}

				if (oSelectedContextObject.bDownload) {
					iRowRecordsToFetch = oSelectedContextObject.originalRowCount;
				}

				aFilters.push(new Filter("SequenceNo", "BT", iCurrentRowRecords, iRowRecordsToFetch));
				if (oHyperLink && bElementHasAttributes) { // Attributes for parentnode
					aFilters.push(new Filter("ParentSeqNo", "EQ", oHyperLink.data("ParentSeqNo")));
					aFilters.push(new Filter("AttributeId", "NE", ""));
				} else if (bElementHasAttributes) { // Attributes for Element Id
					aFilters.push(new Filter("AttributeId", "NE", ""));
				}
			} else if ((oHyperLink || oSelectedContextObject.bFormInPanel) && oSelectedContextObject.controlType === "form") {
				//For a form control which is having table cell hyperlink as parent, we need to get the selected hyperlink sequenced data
				var iSelectedHyperlinkSeqNo = oSelectedContextObject.bFormInPanel ? oSelectedContextObject.SequenceNo : (oHyperLink ? oHyperLink
					.getBindingContext(
						"structuredDataModel").getObject()["S" + oHyperLink.data("ParentElementId")].SequenceNo : 1);
				aFilters.push(new Filter("ParentSeqNo", "EQ", iSelectedHyperlinkSeqNo));
				if (oHyperLink && bElementHasAttributes) { // Attributes for parentnode
					aFilters.push(new Filter("ParentSeqNo", "EQ", oHyperLink.data("ParentSeqNo")));
					aFilters.push(new Filter("AttributeId", "NE", ""));
				} else if (bElementHasAttributes) { // Attributes for Element Id
					aFilters.push(new Filter("AttributeId", "NE", ""));
				}
			}
			return [new Filter(aFilters, true)];
		},

		getSequenceNumberIntervalforChildTable: function (iMaxSequenceNo, iMinSequenceNo, oSelectedContextObject, bTablehasNoData) {
			var iTotalChildren = (iMaxSequenceNo - iMinSequenceNo) + 1;
			var iTableLength = oSelectedContextObject.data.length;
			var aChildTableLastSequenceNo = bTablehasNoData ? 0 : oSelectedContextObject.data[iTableLength - 1]["S" + oSelectedContextObject.ElementId]
				.SequenceNo;
			var iCurrentSeqNo = aChildTableLastSequenceNo === 0 ? iMinSequenceNo : aChildTableLastSequenceNo;
			var iMaxRecords = (iTotalChildren - iTableLength) > 400 ? (iCurrentSeqNo + 400) : iMaxSequenceNo;

			return {
				"iCurrentRowRecords": bTablehasNoData ? iMinSequenceNo : aChildTableLastSequenceNo + 1,
				"iRowRecordsToFetch": iTotalChildren <= 400 ? iMaxSequenceNo : iMaxRecords
			};
		},

		readIntermediateParentNodeSequenceNo: function (oIntermediateParent, aChildControlsContextObjects, sPath, oHyperLink, bIsSubPanel) {
			var bTableChild = false;
			var aChildTableControl = [];
			var oView = this.getView();
			var aIntermediateParents = Array.isArray(oIntermediateParent) ? oIntermediateParent : [oIntermediateParent];
			var oMetadataById = this.getView().getModel("MetadataById").getData();

			aChildControlsContextObjects.forEach(function (oChildControlContext) {
				if (oChildControlContext.controlType === "table") {
					bTableChild = true;
					aChildTableControl.push(oChildControlContext);
				} else if (oChildControlContext.controlType === "form") {
					oChildControlContext.bFormInPanel = true;
					// oChildControlContext.MinSequenceNo - will be present in case of converting 1 Table record to form
					oChildControlContext.SequenceNo = oChildControlContext.MinSequenceNo ? oChildControlContext.MinSequenceNo : (oHyperLink ?
						oHyperLink.data("MinSequenceNo") : 1);
				}
			});
			// usually we'll have only one Intermediate parent, except for when converting one record to form and that table is inside a panel
			// in that case aChildControlsContextObjects = oIntermediateParen and contains the Data holding controls of that table, so it wouldn't have choice control
			var bIsChoicePanel = (aIntermediateParents.length === 1 && oMetadataById.nodes[aIntermediateParents[0].ElementId].CollectionType ===
				"C" && aIntermediateParents[0].controlType === "panel");
			if (bTableChild || bIsChoicePanel) {
				var oModel = oView.getModel();
				var oParamData = oView.getModel("paramModel").getData();
				aIntermediateParents.forEach(function (oParent) {
					var iMinSeqNo = oHyperLink ? oHyperLink.data("MinSequenceNo") : oParent.MinSequenceNo;
					var iMaxSeqNo = oHyperLink ? oHyperLink.data("MaxSequenceNo") : oParent.MaxSequenceNo;
					var sParentSeqNumber = [iMinSeqNo, iMaxSeqNo].join("-");
					var oUrlParameters = {
						ParentSeqNoInterval: sParentSeqNumber,
						ParentElementId: (oHyperLink || oParent.bIntermediatePanel) ? oParent.ElementId : oParent.ParentElementId,
						DocumentUUID: oParamData.key
					};
					if (this._isBetaVersion("Add/Delete")) {
						oUrlParameters = {
							PageOffset: 0,
							PageLimit: 400,
							DocumentUUID: oParamData.key,
							ElementId: oHyperLink ? oParent.ElementId : oParent.ParentElementId,
							ParentSeqNo: oHyperLink ? oHyperLink.data("ParentSeqNo") : oParent.SequenceNo ? oParent.SequenceNo : 1
						};
					}
					oModel.callFunction("/GetSequenceNumIntervals", {
						method: "GET",
						urlParameters: oUrlParameters,
						groupId: "readDocument"
					});
				}.bind(this));
				BusyIndicator.show(0);
				oModel.submitChanges({
					groupId: "readDocument",
					success: jQuery.proxy(function (oResult) {
						oResult.__batchResponses.forEach(function (oResults) {
							var aResults = oResults.data.results;
							if (aResults.length > 0 || bIsChoicePanel) {
								var aSelectedChoice = [];
								var bChoiceHasRelChildren = false;
								aResults.forEach(function (oResult, idx) {
									if (bIsChoicePanel) {
										for (var i in aChildControlsContextObjects) {
											var oChildControl = aChildControlsContextObjects[i];
											if(( oChildControl.controlType === "select" || oChildControl.isChoice )&& aSelectedChoice.indexOf(oChildControl) === -1){
												aSelectedChoice.push(oChildControl);
												continue;
											}
											if (oChildControl.ElementId === oResult.ElementId || this.isElementChildOfGivenParent(oChildControl.ElementId,
													oResult.ElementId)) {
												oChildControl.MinSequenceNo = oResult.MinSequenceNo;
												oChildControl.MaxSequenceNo = oResult.MaxSequenceNo;
												oChildControl.ParentSeqNo = oResult.ParentSeqNo;
												if (oChildControl.controlType === "form") {
													oChildControl.SequenceNo = oChildControl.MinSequenceNo;
												}
												// check if any of the further children of choice has data for the current intermediate choice panel
												bChoiceHasRelChildren = true;
												aSelectedChoice.push(oChildControl);
											}
										}
									} else {
										var oChildTableControl = aChildTableControl[idx];
										if (oChildTableControl) {
											oChildTableControl.MinSequenceNo = oResult.MinSequenceNo;
											oChildTableControl.MaxSequenceNo = oResult.MaxSequenceNo;
											oChildTableControl.ParentSeqNo = oResult.ParentSeqNo;
											oChildTableControl.bTableInPanel = true;
										}
									}
								}.bind(this));
								this.readGeneratedData(bChoiceHasRelChildren ? aSelectedChoice : aChildControlsContextObjects, sPath, oHyperLink,
									bIsSubPanel);
							} else {
								BusyIndicator.hide();
								if (oHyperLink)
									this._bindColumnChildSection(oHyperLink);
							}
						}.bind(this));
					}, this),
					error: function (oError) {
						BusyIndicator.hide();
					}
				});
			} else {
				this.readGeneratedData(aChildControlsContextObjects, sPath, oHyperLink, bIsSubPanel);
			}
		},

		_ConstructFormData: function (aGeneratedData, oFormElements) {
			aGeneratedData.some(function (oGenData) {
				oFormElements.some(function (oFormElement, idx) {
					if (oFormElement.ElementId === oGenData.ElementId) {
						if (oFormElement.AttributeId === oGenData.AttributeId) {
							this._mergeGeneratedDataToMetadata(oGenData, oFormElement);
							this._checkForReferenceElementIds(oFormElement, oFormElements, idx);
							return oFormElement.AttributeId === oGenData.AttributeId;
						} else if (oFormElement.attributes && oFormElement.attributes.length > 0) {
							oFormElement.attributes.some(function (oAttrFormElement) {
								if (oGenData.AttributeId === oAttrFormElement.AttributeId) {
									this._mergeGeneratedDataToMetadata(oGenData, oAttrFormElement);
									return oGenData.AttributeId === oAttrFormElement.AttributeId;
								}
							}.bind(this));
						}
					}
				}.bind(this));
			}.bind(this));
		},

		_checkForReferenceElementIds: function (oFormElement, oFormElements, idx, oPrevRowData) {
			var oReferenceElementNodes = this.getView().getModel("MetadataById").getProperty("/referenceElementNodes");
			if (oReferenceElementNodes[oFormElement.ReferenceElementId]) {
				oFormElement.currencyData = oReferenceElementNodes[oFormElement.ReferenceElementId];
				if (oPrevRowData) {
					oFormElement.currencyData.displayValue = oPrevRowData["E" + oFormElement.ElementId + "_Currency"].displayValue;
				} else {
					// delete oFormElement.currencyData.displayValue;
					oFormElement.currencyData.displayValue = "";
				}
			} else {
				oFormElement.ReferenceElementId = ""; //If the reference element id is hidden in mapping . We clear the reference element id value to empty from the element
				if (oReferenceElementNodes[oFormElement.ElementId]) {
					oFormElements.splice(idx, 1);
				}
			}
		},

		_mergeGeneratedDataToMetadata: function (oGeneratedData, oMetadata) {
			oMetadata.SequenceNo = oGeneratedData.SequenceNo;
			oMetadata.ParentSeqNo = oGeneratedData.ParentSeqNo;
			oMetadata.GeneratedValue = oMetadata.hasChildren ? oMetadata.LabelInfo : oGeneratedData.GeneratedValue;
			oMetadata.ModifiedValue = oGeneratedData.ModifiedValue;
			oMetadata.ChangeIndicator = oGeneratedData.ChangeIndicator;
			oMetadata.MessageSeverity = oGeneratedData.MessageSeverity; //Error & Warning
			oMetadata.MessageText = oGeneratedData.MessageText; //Error & Warning
			oMetadata.displayValue = oMetadata.ChangeIndicator && oMetadata.ChangeIndicator !== "" ? oMetadata.ModifiedValue : oMetadata.GeneratedValue;
			oMetadata.displayValue = (typeof oMetadata.displayValue === "string" && oMetadata.typeInfo.XsdBuiltInType !== "string") ?
				oMetadata
				.displayValue.trim() : oMetadata.displayValue;
			oMetadata.Key = oGeneratedData.Key;
			this._reverseTrailingNegativeSign(oMetadata);
			this._getChangeLogOfCurrentElement(oMetadata);

			//Getting Additional metadata details
			var oNodes = this.getView().getModel("MetadataById").getProperty("/additionalMetadataById");
			var oAddMetadataById = oNodes ? oNodes[oMetadata.ElementId + oMetadata.AttributeId] : undefined;
			this._getAdditionalMetadataInfo(oMetadata, oAddMetadataById);

			//Updating change log model
			if (oMetadata.ChangeIndicator === "UM") {
				var oGlobalVariableModel = this.getView().getModel("GlobalVariables");
				var aSavedChanges = oGlobalVariableModel.getProperty("/aSavedChanges");
				aSavedChanges.push(oMetadata);
				oGlobalVariableModel.setProperty("/aSavedChanges", aSavedChanges);
			}
			// aGeneratedData.splice(0,1);
		},

		_getTablePersnoControl: function (sTableId) {
			var oTable = sap.ui.getCore().byId(sTableId);
			//Removing currency column from the table personalization
			this.removeCurrencyAndHiddenColumn(oTable);
			var oTablePersoControl = new sap.ui.table.TablePersoController();
			oTablePersoControl.setTable(oTable);
			return oTablePersoControl;
		},

		_findHiddenColumns: function (oSelectedContextObject) {
			var aHiddenColumns = [];
			var oTable = this._getTablePersnoControl(oSelectedContextObject.id);
			var aTableColumns = oTable._getCurrentTablePersoData().aColumns;
			aTableColumns.forEach(function (oColumn) {
				if (!oColumn.visible) {
					aHiddenColumns.push(oColumn);
				}
			});
			return aHiddenColumns;
		},

		_searchDataForHiddenColumn: function (aHiddenColumns, oColumn, oGeneratedData, oSelectedContextObject) {
			var sDisplayValue = oGeneratedData.ChangeIndicator !== "" ? oGeneratedData.ModifiedValue : oGeneratedData.GeneratedValue;
			if (sDisplayValue.indexOf(oSelectedContextObject.searchString) !== -1 && oSelectedContextObject.HiddenColumns.indexOf(oColumn.id) ===
				-1) {
				aHiddenColumns.forEach(function (oHiddenColumn) {
					if (oHiddenColumn.id === [oSelectedContextObject.id, oColumn.id].join("-")) {
						oSelectedContextObject.HiddenColumns.push(oColumn.id);
					}
				});
			}
		},

		_ConstructTableData: function (aGeneratedData, oSelectedContextObject) {
			var aColumns = oSelectedContextObject.columns;
			aColumns.sort(function (a, b) {
				return a.ElementId - b.ElementId;
			});
			// Find if there are any hidden columns for search
			var bTableSearch = oSelectedContextObject.searchString !== "";
			var aHiddenColumns = bTableSearch ? this._findHiddenColumns(oSelectedContextObject) : [];
			var bSearchForHiddenColumns = aHiddenColumns.length > 0 && bTableSearch;
			//setting generatedData, in case table has one record, we can directly take generated data to constructFormData instead of taking data from table data
			oSelectedContextObject.generatedData = jQuery.extend(true, [], aGeneratedData);
			var oSequenceNumbers = oSelectedContextObject.sequenceNumbers;
			do {
				var bNewRow = false;
				var oRowData = {};
				var iGeneratedDataLength = aGeneratedData.length;
				aColumns.forEach(function (oColumn, idx) {
					if (aGeneratedData[0] && ((oColumn.ElementId === aGeneratedData[0].ElementId && oColumn.AttributeId === aGeneratedData[0].AttributeId) ||
							(aGeneratedData[0].ElementId + "_A" + aGeneratedData[0].AttributeId === oColumn.ElementId))) {
						var bTableAttribute = oColumn.ElementId.indexOf(oSelectedContextObject.ElementId) !== -1 && oColumn.AttributeId !== "";
						var sPropertyKey = "E" + oColumn.ElementId;
						if (oColumn.hasAttributes && oColumn.children.length === 0) {
							sPropertyKey = "E" + oColumn.ElementId + "_value";
						}
						if (oColumn.AttributeId !== "" && (!bTableAttribute || oSelectedContextObject.repeatingLeafNode)) {
							sPropertyKey = "E" + oColumn.ElementId + "_A" + oColumn.AttributeId;
						}
						if (idx === 0) {
							sPropertyKey = "S" + oColumn.ElementId;
						}
						// For Table place holder data we shouldn't check the ParentSeqNo as it is always fixed for all the rows and for columns the Parent Sequenc no is Table place holder sequence number.
						// var iRowNumber = oColumn.isAttributeColumn && oColumn.ElementId.indexOf(oSelectedContextObject.ElementId) === -1 ? oSequenceNumbers[aGeneratedData[0].ParentSeqNo] : undefined;
						var iRowNumber;
						if (oColumn.ElementId.indexOf(oSelectedContextObject.ElementId) === -1) {
							iRowNumber = oSequenceNumbers[aGeneratedData[0].ParentSeqNo];
						} else if (oColumn.isAttributeColumn) { //for table container attributes Sequence no is same as Container/Place Holder Object
							iRowNumber = oSequenceNumbers[aGeneratedData[0].SequenceNo];
						}
						oRowData = iRowNumber !== undefined ? oSelectedContextObject.data[iRowNumber] : oRowData;
						if (Object.keys(oRowData).length === 0) {
							bNewRow = true;
						}
						oRowData[sPropertyKey] = this._getCellDataObject({}, aGeneratedData[0], oColumn);

						// Reference Element Id
						if (oColumn.ReferenceElementId !== "") {
							oColumn.currencyTypeInfo = oColumn.currencyData.typeInfo;
						}

						if (oColumn.aReferencedElementIds && oColumn.aReferencedElementIds.length > 0) {
							var oRefCellObject = this._getCellDataObject({}, aGeneratedData[0], oColumn);
							oRefCellObject.aReferencedElementIds = oColumn.aReferencedElementIds;
							oColumn.aReferencedElementIds.forEach(function (oReferencedId) {
								oRowData["E" + oReferencedId.ElementId + "_Currency"] = oRefCellObject;
							});
						}
						//	oColumn.MessageSeverity = aGeneratedData[0].MessageSeverity;
						//	oColumn.MessageText = aGeneratedData[0].MessageText;

						if (bSearchForHiddenColumns && aHiddenColumns.length > oSelectedContextObject.HiddenColumns.length) {
							this._searchDataForHiddenColumn(aHiddenColumns, oColumn, aGeneratedData[0], oSelectedContextObject);
						}

						if (!oSelectedContextObject.repeatingLeafNode) {
							aGeneratedData.splice(0, 1);
						}
					}
				}.bind(this));
				if (iGeneratedDataLength === aGeneratedData.length) {
					aGeneratedData.splice(0, 1);
				}
				if (bNewRow) {
					this._addRowData(oRowData, oSelectedContextObject, oSequenceNumbers);
				}
			} while (aGeneratedData.length > 0);
			var bTotalRowAvailable = oSelectedContextObject.totalRow && oSelectedContextObject.bAddTotalsObject;
			if (bTotalRowAvailable) {
				oSelectedContextObject.data.push(oSelectedContextObject.totalRow);
			}
		},

		_addRowData: function (oRowData, oSelectedContextObject, oSequenceNumbers) {
			var aRowDataKeys = Object.keys(oRowData);
			if (this._isBetaVersion("Add/Delete")) {
				if (aRowDataKeys.length > 0 && oRowData["S" + oSelectedContextObject.ElementId]) {
					//Display value for seqno column(table container) will be the Ordinal number of container generated data obj
					oRowData["S" + oSelectedContextObject.ElementId].displayValue = oRowData["S" + oSelectedContextObject.ElementId].OrdinalNo;

					if (oSelectedContextObject.isParentDeleted) { // If the parent row is deleted then the subsequent all children should have DM as change indicator
						oRowData["S" + oSelectedContextObject.ElementId].ChangeIndicator = "DM";
					}

					// this._addHyperlinkData(oSelectedContextObject, oRowData);
				}

				var iDataTablePosition = oSelectedContextObject.data.length;
				if (oSelectedContextObject.NewRowContext && oSelectedContextObject.NewRowContext.length > 0) {
					iDataTablePosition = Number(oRowData["S" + oSelectedContextObject.ElementId].displayValue) - 1;
					//Only push data object into the table data if New postiton is less than current data length
					if (iDataTablePosition <= oSelectedContextObject.data.length) {
						oSelectedContextObject.data.splice(iDataTablePosition, 0, oRowData);
					}

				} else {
					oSelectedContextObject.data.push(oRowData);
				}
				if (oSequenceNumbers && oRowData["S" + oSelectedContextObject.ElementId] && !oSequenceNumbers[oRowData["S" +
						oSelectedContextObject.ElementId].SequenceNo]) {
					oSequenceNumbers[oRowData["S" + oSelectedContextObject.ElementId].SequenceNo] = iDataTablePosition;
				}
			} else {
				if (aRowDataKeys.length > 0) {
					oRowData["S" + oSelectedContextObject.ElementId] = {
						displayValue: oRowData[aRowDataKeys[0]].SequenceNo,
						SequenceNo: oRowData[aRowDataKeys[0]].SequenceNo,
						ParentSeqNo: oSelectedContextObject.repeatingLeafNode ? oRowData[aRowDataKeys[0]].SequenceNo : oRowData[aRowDataKeys[0]].ParentSeqNo
					};
				}
				if (oSequenceNumbers && !oSequenceNumbers[oRowData[aRowDataKeys[0]].ParentSeqNo]) {
					oSequenceNumbers[oRowData[aRowDataKeys[0]].ParentSeqNo] = oSelectedContextObject.data.length;
				}
				oSelectedContextObject.data.push(oRowData);
			}
		},
		// oCellObject.PageOffset = oGeneratedData.PreviousSeqNo + ';' + oGeneratedData.SubordinalNo;
		_addHyperlinkData: function (oSelectedContextObject, oRowData) {
			var aComplexParents = oSelectedContextObject.complexParents;
			if (aComplexParents.length > 0) {
				var oInitalHyperlinkData = {
					"MaxSequenceNo": 0,
					"MinSequenceNo": 0,
					"ParentSeqNo": oRowData["S" + oSelectedContextObject.ElementId].SequenceNo,
					"RowCount": 0
				};
				aComplexParents.forEach(function (oColumn) {
					oRowData["E" + oColumn.ElementId] = this._getHyperLinkCellDataObject({}, oInitalHyperlinkData, oColumn);
					// Update the child controls only once for initial load of data and resue the same everytime.
					if (oColumn.hasChildren && oColumn.controls.length === 0) {
						var oMetadata = this.getView().getModel("MetadataById").getData();
						if (oMetadata.nodes[oColumn.ElementId].controls.length === 0) {
							this._updateFormTableNodes(oColumn.ElementId, oMetadata.nodes, oMetadata.childById);
						}
						oColumn.controls = this._updateChildControls(oMetadata.nodes[oColumn.ElementId]); // updating controls into  
					}
					if (oColumn.hasChildren) {
						oRowData["E" + oColumn.ElementId + "_Children"] = jQuery.extend(true, [], oColumn.controls);
					}
					//For no data child parents
					if (oColumn.TypeId === "" && oColumn.controls.length === 0) {
						oRowData["E" + oColumn.ElementId + "_Children"] = [];
						oRowData["E" + oColumn.ElementId + "_Children"].push(jQuery.extend(true, {}, oColumn));
						oRowData["E" + oColumn.ElementId + "_Children"][0].controlType = "panel";
					}
				}.bind(this));
			}
		},

		_getCellDataObject: function (oCellObject, oGeneratedData, oColumn) {
			oCellObject.OrdinalNo = oGeneratedData.OrdinalNo;
			oCellObject.LabelInfo = oColumn.LabelInfo;
			oCellObject.GeneratedValue = oColumn.hasChildren ? oColumn.LabelInfo : oGeneratedData["GeneratedValue"];
			oCellObject.ModifiedValue = oGeneratedData["ModifiedValue"];
			oCellObject.ChangeIndicator = oGeneratedData.ChangeIndicator;
			oCellObject.displayValue = oCellObject.ChangeIndicator !== "" ? oCellObject.ModifiedValue : oCellObject.GeneratedValue;
			oCellObject.SequenceNo = oGeneratedData.SequenceNo;
			oCellObject.ParentSeqNo = oGeneratedData.ParentSeqNo;
			oCellObject.ReferenceElementId = oColumn.ReferenceElementId;
			oCellObject.typeInfo = oColumn.TypeId !== "" ? oColumn.typeInfo : "";
			oCellObject.displayValue = (oColumn.TypeId !== "" && typeof oCellObject.displayValue === "string" && oCellObject.typeInfo.XsdBuiltInType !==
				"string") ? oCellObject.displayValue.trim() : oCellObject.displayValue;
			oCellObject.DocumentName = oGeneratedData.DocumentName;
			oCellObject.ReportingEntity = oGeneratedData.ReportingEntity;
			oCellObject.RepCatId = oGeneratedData.RepCatId;
			oCellObject.Key = oGeneratedData.Key;
			oCellObject.ReportRunId = oGeneratedData.ReportRunId;
			oCellObject.ParentKey = oGeneratedData.ParentKey;
			oCellObject.DocumentId = oGeneratedData.DocumentId;
			oCellObject.RootKey = oGeneratedData.RootKey;
			oCellObject.ElementId = oColumn.ElementId.includes("_A") ? oColumn.ElementId.split("_A")[0] : oColumn.ElementId;
			oCellObject.AttributeId = oColumn.AttributeId;
			oCellObject.IsSingleValuedLeafElement = oGeneratedData.IsSingleValuedLeafElement;
			oCellObject.ParentElementId = oGeneratedData.ParentElementId;
			oCellObject.HasEnumeration = oColumn.HasEnumeration;
			// Adding MaxLength for table column width
			oColumn.maxDataLength = oColumn.maxDataLength ? oColumn.maxDataLength : 0;
			oColumn.maxDataLength = oCellObject.displayValue.length > oColumn.maxDataLength ? oCellObject.displayValue.length : oColumn.maxDataLength;
			oCellObject.ManualAdjOption = oColumn.ManualAdjOption;
			//Getting Additional metadata details
			var oAdditionalMetadata = this.getView().getModel("MetadataById").getProperty("/additionalMetadataById");
			var oAddMetadataById = oAdditionalMetadata ? oAdditionalMetadata[oColumn.ElementId + oColumn.AttributeId] : undefined;
			this._getAdditionalMetadataInfo(oColumn, oAddMetadataById);

			oCellObject.CountValues = oColumn.CountValues;
			oCellObject.Shlpname = oColumn.Shlpname;
			oCellObject.Shlpfield = oColumn.Shlpfield;
			oCellObject.HasDomainValues = oColumn.HasDomainValues;
			oCellObject.HasEnumeration = oColumn.HasEnumeration;
			oCellObject.HasSearchHelp = oColumn.HasSearchHelp;
			oCellObject.HasCDSColumn = oColumn.HasCDSColumn;
			oCellObject.PreviousSeqNo = oGeneratedData.PreviousSeqNo;
			oCellObject.SubordinalNo = oGeneratedData.SubordinalNo;
			oCellObject.MessageSeverity = oGeneratedData.MessageSeverity;
			oCellObject.MessageText = oGeneratedData.MessageText;

			this._reverseTrailingNegativeSign(oCellObject);
			this._getChangeLogOfCurrentElement(oCellObject);
			return oCellObject;
		},

		_getHyperLinkCellDataObject: function (oCellObject, oGeneratedData, oColumn) {
			oCellObject.displayValue = oColumn.LabelInfo;
			oCellObject.ParentSeqNo = oGeneratedData.ParentSeqNo;
			oCellObject.SequenceNo = oGeneratedData.ParentSeqNo;
			oCellObject.MinSequenceNo = oGeneratedData.MinSequenceNo;
			oCellObject.MaxSequenceNo = oGeneratedData.MaxSequenceNo;
			oCellObject.RowCount = oGeneratedData.RowCount;
			return oCellObject;
		},

		_ConstructTableHierarchyData: function (aGeneratedData, oSelectedContextObject, oHyperLink) {
			var aColumns = oSelectedContextObject.columns;
			var oSequenceNumbers = oSelectedContextObject.sequenceNumbers;
			var oMetadataModel = this.getView().getModel("MetadataById");
			var oAnonymousElementById = oMetadataModel.getProperty("/anonymousElementById");
			var oChildById = oMetadataModel.getProperty("/childById");
			// Element IDs of the immediate columns which are choice
			var aAnonymousElementIds = oAnonymousElementById[oSelectedContextObject.ElementId];
			do {
				var bNewRow = false;
				var oCurrentRow = {};
				var iGeneratedDataLength = aGeneratedData.length;
				// aColumns.forEach(function (oColumn, idx) {
				for (var iCol = 0; iCol < aColumns.length; iCol++) {
					var oColumn = aColumns[iCol];
					// if (aGeneratedData[0] && aAnonymousElementIds && aAnonymousElementIds.indexOf(aGeneratedData[0].ElementId) !== -1) {
					// 	// when table have immediate child as Choice, the choice child with relevant data will be added as the column, since choice is not an element (just a wrapper)
					// 	// since for choice children we'll write the first child with relevant data into the file,the same element will be shown in preview
					// 	var iChoiceElementIdx = aAnonymousElementIds.indexOf(aGeneratedData[0].ElementId);
					// 	// Currently the logic is built under the assumption only one child of the choice has data, and none of the other children are relevant for preview
					// 	//aGeneratedData[0].ElementId = oChildById[aAnonymousElementIds[iChoiceElementIdx]][0];
					// 	var sChildFirstElement = oChildById[aAnonymousElementIds[iChoiceElementIdx]][0];
					// 	if (oChildById[sChildFirstElement]) {
					// 		aGeneratedData[0].ElementId = sChildFirstElement;
					// 	}
					// }
					if (aGeneratedData[0] && oColumn.ElementId === aGeneratedData[0].ElementId) {
						// var iRowNumber = oHyperLink ? (aGeneratedData[0].ParentSeqNo - oHyperLink.data("MinSequenceNo")) : aGeneratedData[0].ParentSeqNo -
						// 	1;
						var iRowNumber = oSequenceNumbers[aGeneratedData[0].ParentSeqNo];
						oCurrentRow = iRowNumber !== undefined ? oSelectedContextObject.data[iRowNumber] : oCurrentRow;
						if (Object.keys(oCurrentRow).length === 0) {
							bNewRow = true;
						}
						oCurrentRow["E" + oColumn.ElementId] = this._getHyperLinkCellDataObject({}, aGeneratedData[0], oColumn, false);
						//  For Add/Delete Container object  will  be avaliable and based on delete Indicator handle row  count
						var oContainerObject = oCurrentRow["S" + oSelectedContextObject.ElementId];
						var iRowCount = oContainerObject ? (oContainerObject.ChangeIndicator === "DM" ? 0 : aGeneratedData[0].RowCount) : 0;
						// For old service there is no Container object so calculate row count by Max-Min sequence numbers
						var iCalculatedRowCount = aGeneratedData[0].MaxSequenceNo - aGeneratedData[0].MinSequenceNo;
						oCurrentRow["E" + oColumn.ElementId].RowCount = oContainerObject ? iRowCount : iCalculatedRowCount;
						// Update the child controls only once for initial load of data and resue the same everytime.
						if (oColumn.hasChildren && oColumn.controls.length === 0) {
							var oMetadata = this.getView().getModel("MetadataById").getData();
							if (oMetadata.nodes[oColumn.ElementId].controls.length === 0) {
								this._updateFormTableNodes(oColumn.ElementId, oMetadata.nodes, oMetadata.childById);
							}
							oColumn.controls = this._updateChildControls(oMetadata.nodes[oColumn.ElementId]); // updating controls into  
						}
						if (oColumn.hasChildren) {
							if(this._isBetaVersion("ChoiceHandling") && oColumn.controls[0].isChoice){// Harish
								delete oColumn.controls[0].controls[0].choice;
							}
							oCurrentRow["E" + oColumn.ElementId + "_Children"] = jQuery.extend(true, [], oColumn.controls);
							if(this._isBetaVersion("ChoiceHandling") && oColumn.controls[0].isChoice){
								 oCurrentRow["E" + oColumn.ElementId + "_Children"][0].controls[0].choice = oCurrentRow["E" + oColumn.ElementId + "_Children"][0];
							}
						}
						//For no data child parents
						if (oColumn.TypeId === "" && oColumn.controls.length === 0) {
							oCurrentRow["E" + oColumn.ElementId + "_Children"] = [];
							oCurrentRow["E" + oColumn.ElementId + "_Children"].push(jQuery.extend(true, {}, oColumn));
							oCurrentRow["E" + oColumn.ElementId + "_Children"][0].controlType = "panel";
						}
						aGeneratedData.splice(0, 1);
						break;
					}
				}
				if (iGeneratedDataLength === aGeneratedData.length) {
					aGeneratedData.splice(0, 1);
				}
				if (bNewRow) {
					this._addRowData(oCurrentRow, oSelectedContextObject, oSequenceNumbers);
				}
			} while (aGeneratedData.length > 0);
		},

		_ConstructTableAttributeData: function (aGeneratedData, oSelectedContextObject, oHyperLink) {
			var aColumns = oSelectedContextObject.columns;
			var oSequenceNumbers = oSelectedContextObject.sequenceNumbers;
			// Find if there are any hidden columns for search
			var bTableSearch = oSelectedContextObject.searchString !== "";
			var aHiddenColumns = bTableSearch ? this._findHiddenColumns(oSelectedContextObject) : [];
			var bSearchForHiddenColumns = aHiddenColumns.length > 0 && bTableSearch;
			do {
				var bNewRow = false;
				var oCurrentRow = {};
				var iGeneratedDataLength = aGeneratedData.length;
				aColumns.forEach(function (oColumn, idx) {
					if (aGeneratedData[0] && aGeneratedData[0].ElementId + "_A" + aGeneratedData[0].AttributeId === oColumn.ElementId) {
						// var iRowNumber = oHyperLink ? (aGeneratedData[0].SequenceNo - oHyperLink.data("MinSequenceNo")) : aGeneratedData[0].SequenceNo -
						// 	1;
						var iRowNumber = oSequenceNumbers[aGeneratedData[0].SequenceNo];
						oCurrentRow = oSelectedContextObject.data[iRowNumber] !== undefined ? oSelectedContextObject.data[iRowNumber] : oCurrentRow;
						if (Object.keys(oCurrentRow).length === 0) {
							bNewRow = true;
						}
						oCurrentRow["E" + oColumn.ElementId] = this._getCellDataObject({}, aGeneratedData[0], oColumn, false);
						this._getChangeLogOfCurrentElement(oColumn);
						if (bSearchForHiddenColumns && aHiddenColumns.length > oSelectedContextObject.HiddenColumns.length) {
							this._searchDataForHiddenColumn(aHiddenColumns, oColumn, aGeneratedData[0], oSelectedContextObject);
						}
						aGeneratedData.splice(0, 1);
					}
				}.bind(this));
				if (iGeneratedDataLength === aGeneratedData.length) {
					aGeneratedData.splice(0, 1);
				}
				if (bNewRow) {
					this._addRowData(oCurrentRow, oSelectedContextObject, oSequenceNumbers);
				}
			} while (aGeneratedData.length > 0);
		},

		_ConstructTableRowCountAndTotals: function (aResponse, oSelectedContextObject) {
			var oTotalRow = {};
			var aErrorMessages = this.getView().getModel("messageModel").getData();
			var oGlobalErrorWarningModel = this.getView().getModel("GlobalErrorWarningLog").getData().Messages;
			aResponse.forEach(function (oData) {
				if (oData.TableRowCount !== "") {
					oSelectedContextObject.rowCount = parseInt(oData.TableRowCount.trim(), 10);
					var bKeepOriginalRowCount = oSelectedContextObject.searchString || oSelectedContextObject.filterKey.length > 0;
					oSelectedContextObject.originalRowCount = bKeepOriginalRowCount ? oSelectedContextObject.originalRowCount :
						oSelectedContextObject.rowCount;
					oSelectedContextObject.columns[0].typeInfo.Maxinclusive = bKeepOriginalRowCount ? oSelectedContextObject.originalRowCount + 1 :
						oSelectedContextObject.rowCount + 1;
					oSelectedContextObject.columns[0].typeInfo.Mininclusive = 1;
				}
				if (oData.Total !== "") {
					oTotalRow["E" + oData.ElementId] = {};
					oTotalRow["E" + oData.ElementId].displayValue = oData.Total;
					oTotalRow["E" + oData.ElementId].bShowTotals = true;
					// Current element id currecny value from last record of the table data.
					var oCurrencyValue = oSelectedContextObject.data[oSelectedContextObject.data.length - 1]["E" + oData.ElementId + "_Currency"];
					oTotalRow["E" + oData.ElementId + "_Currency"] = jQuery.extend(true, {}, oCurrencyValue);
					oSelectedContextObject.columns.forEach(function (oColumn) {
						if (oColumn.ElementId === oData.ElementId) {
							var iColumnTotalLength = oData.Total.toString().length;
							oColumn.maxDataLength = (iColumnTotalLength === 1 ? 4 : iColumnTotalLength) + 13;
						}
					});
				}
				if (oData.ErrorText !== "") {
					var oMetadata = this.getView().getModel("MetadataById").getData();
					var oCurrentColumn = oMetadata.nodes[oData.ElementId];
					var sCurrentColumnLabelInfo = oCurrentColumn.LabelInfo !== "" ? oCurrentColumn.LabelInfo : oCurrentColumn.ElementName;
					if (oGlobalErrorWarningModel[oSelectedContextObject.ElementId]) {
						var oMessage = {
							"message": oData.ErrorText.replace(oData.ElementId, sCurrentColumnLabelInfo),
							"type": sap.ui.core.MessageType.Information
						};
						oGlobalErrorWarningModel[oSelectedContextObject.ElementId].push(oMessage);
						aErrorMessages.push(oMessage);
					}
				}
			}.bind(this));
			if (aErrorMessages.length > 0) {
				this._openMessagePopover(aErrorMessages);
			}
			if (Object.keys(oTotalRow).length > 0) {
				// if(oSelectedContextObject.hasTotalRow){
				oSelectedContextObject.totalRow = oTotalRow;
				oSelectedContextObject.bAddTotalsObject = true;
				oSelectedContextObject.bOnLoadAddTotalsObject = true;
				oSelectedContextObject.data.push(oSelectedContextObject.totalRow);

				// }
			} else {
				oSelectedContextObject.hasTotalRow = false;
				oSelectedContextObject.bAddTotalsObject = false;
				oSelectedContextObject.bOnLoadAddTotalsObject = false;
			}
		},

		_updateChildControls: function (oCurrentNode) {
			var oChildNode = oCurrentNode.controls;
			if (oCurrentNode.controls.length === 0 && oCurrentNode.controlType === "panel") {
				oChildNode = oCurrentNode.children[0].controls;
			}
			return oChildNode;
		},

		_constructAttrFormControl: function (aGeneratedData, oSelectedContextObject, oHyperLink) {
			var oAttrFormControl = this._getNewFormControl(oSelectedContextObject, oSelectedContextObject, !oHyperLink);
			oAttrFormControl.LabelInfo = oAttrFormControl.LabelInfo + "->" + this.getResourceBundle().getText("xtit.visualization.attribute");
			oAttrFormControl.data[0].data = oSelectedContextObject.attributes;

			// construct Attributes genereted data
			this._ConstructFormData(aGeneratedData, oAttrFormControl.data[0].data);
			var sFieldArrangement = this.getView().getModel("DocumentData").getProperty("/FieldArrangement");
			if (sFieldArrangement !== "1") {
				this._setEnhancedFormElements(oAttrFormControl);
			}
			oSelectedContextObject.attributeFormControl = oAttrFormControl;
		},

		//Setting enhanced data preview - Splitting form data to two sets if enhanced data preview set
		_setEnhancedFormElements: function (oFormControl) {
			var bNotEnhanced = oFormControl.data[1] === undefined;
			if (bNotEnhanced) { // for avoiding table column children to enhance multiple times
				var aFormData = oFormControl.data[0].data;
				var iFormLength = parseInt(aFormData.length / 2);
				var iRemainder = aFormData.length % 2;
				oFormControl.data = [{
					data: aFormData.splice(0, iFormLength + iRemainder)
				}, {
					data: aFormData
				}];
			}
		},

		// Converting single row table to form
		_convertOneRecordTableToForm: function (oTableControl) {
			var aColumnChildControls = [];
			var sColumnKey;
			var aChildPanelControl;
			oTableControl.controlType = "form";
			oTableControl.ChangeIndicator = oTableControl.data[0]["S" + oTableControl.ElementId].ChangeIndicator;
			oTableControl.data[0].data = [];
			if (oTableControl.hasAttributes) {
				oTableControl.attributeFormControl = jQuery.extend(true, {}, oTableControl);
			}
			var aTableData = [];
			var aTableAttributeData = [];
			var aColumns = oTableControl.columns;
			var aTableSingRecControls = [];
			if (oTableControl.generatedData) {
				oTableControl.generatedData.forEach(function (oGeneratedData) {
					oGeneratedData.ChangeIndicator = (oTableControl.isParentDeleted || oTableControl.ChangeIndicator === "DM") ? "DM" :
						oGeneratedData.ChangeIndicator;
				});
			}
			for (var iColumn = 0; iColumn < aColumns.length; iColumn++) {
				var oCurrentColumn = aColumns[iColumn];
				/*For column children, prepare separate controls array*/
				if (oCurrentColumn.OrdinalNumber === -1 || oCurrentColumn.isAttributeColumn) { // For sequence number column or attribute column
					continue;
				}
				// When the complex element has no data collected for it's children, those child elements won't be there in the 'GetElementsAndAttributes' response
				// Hence no field with key "*_Children" will be built and property 'hasChildren' will be false
				if (oCurrentColumn.TypeId === "" && oCurrentColumn.hasChildren) { //oCurrentColumn is child parent
					sColumnKey = "E" + oCurrentColumn.ElementId + "_Children";
					/*Fixed to data[0], because this will execute when there is one record(data[0]) in table control*/
					if (oTableControl.data[0][sColumnKey] && oTableControl.data[0][sColumnKey][0].controlType === 'panel' && oTableControl.data[0][
							sColumnKey
						][0].controls.length === 1 &&
						oTableControl.data[0][sColumnKey][0].controls[0] && oTableControl.data[0][sColumnKey][0].controls[0].controlType ===
						'panel') {
						aChildPanelControl = oTableControl.data[0][sColumnKey][0].controls[0];
					} else {
						aChildPanelControl = oTableControl.data[0][sColumnKey];
					}
					/*For XBRL, Columns has children with MaxOcuurs 1.
					In this case, we just get the column's panel level control data*/
					if (aChildPanelControl) {
						aColumnChildControls = aColumnChildControls.concat(aChildPanelControl);
						continue;
					}
					//if it has column data, get the column controls
					if (aChildPanelControl) {
						aColumnChildControls = Array.isArray(aChildPanelControl) ? aColumnChildControls.concat(aChildPanelControl[0].controls) :
							aColumnChildControls.concat(aChildPanelControl.controls);
					}
				} else {
					/*For Columns which has no children, prepare form elements*/
					var oFormElement = oCurrentColumn.attributes.length > 0 ? oTableControl.data[0]["E" + oCurrentColumn.ElementId + "_value"] :
						oTableControl.data[0]["E" + oCurrentColumn.ElementId];
					if (oFormElement && !oCurrentColumn.isAttributeColumn) {
						// For creating Form controls with sequential ordinal number
						oFormElement.controlType = 'formElement';
						oFormElement.OrdinalNumber = oCurrentColumn.OrdinalNumber;
						oFormElement.attributes = oCurrentColumn.attributes;
						oFormElement.hasAttributes = oCurrentColumn.attributes.length > 0;
						oFormElement.FieldVisibilityInd = oCurrentColumn.FieldVisibilityInd;
						aTableData = oTableControl.data[0].data;
						//Updating form field attributes Generated data info
						this._ConstructFormData(oTableControl.generatedData, oFormElement.attributes);
						//remove attributes, which doesnt have data
						oFormElement.attributes = jQuery.grep(oFormElement.attributes, function (oAttribute, idx) {
							return oAttribute.displayValue;
						}, false);
						// Setting first converted column ordinal number to the converted form control 
						// oTableControl.OrdinalNumber = aTableData.length === 0 ? oCurrentColumn.OrdinalNumber : oTableControl.OrdinalNumber;
						aTableData.push(oFormElement);
						// this._getCurrentChildChildrenCurrencyData(oCurrentColumn, oTableControl, oFormElement);
					}
				}
			}
			if (oTableControl.hasAttributes) {
				var oAttributeForm = {
					LabelInfo: oTableControl.ParentLabelInfo + oTableControl.LabelInfo + "->" + this.getResourceBundle().getText(
						"xtit.visualization.attribute"),
					controlType: "form",
					bShowTitle: true,
					OrdinalNumber: oTableControl.OrdinalNumber,
					ParentElementId: oTableControl.ParentElementId,
					ParentLabelInfo: oTableControl.ParentLabelInfo,
					data: [{
						data: []
					}],
					singleRowForm: true
				};
				oTableControl.attributes.forEach(function (oAttribute) {
					if (oTableControl.data[0]["E" + oAttribute.ElementId + "_A" + oAttribute.AttributeId]) {
						var oFormAttribute = oTableControl.data[0]["E" + oAttribute.ElementId + "_A" + oAttribute.AttributeId];
						oFormAttribute.controlType = 'formElement';
						oFormAttribute.OrdinalNumber = oAttribute.OrdinalNumber;
						oAttributeForm.data[0].data.push(oFormAttribute);
					}
				});
				// aTableSingRecControls.push(oAttributeForm);
				// var oAttributePanel = this._convertToPanelControl(aTableSingRecControls);
				oTableControl.attributeFormControl = oAttributeForm;
			}
			if (aColumnChildControls.length === 0) {
				// If there are no child controls to the columns(Table = Form), Form control should be placed inside panel control to display the Table title as Panel title,
				// If we don't insert form inside panel, form elements(columns) will be displayed as direct children to the table parent
				this._ConstructFormData(oTableControl.generatedData, oTableControl.data[0].data);
				var oTablePanel = this._convertToPanelControl([oTableControl]);
				// return oTablePanel;
			} else if (aColumnChildControls[0].controlType === 'panel' || aColumnChildControls[0].controlType === 'table') { //For XBRL
				/*If any table column has children with maxOccures one (=Panel) then the other columns w/o children will be form
				In this case, Node controls has to be updated with Form and panels*/
				// if (aTableData && aTableData.length > 0) {

				aTableData = aColumnChildControls.concat(aTableData);

				// sorting controls based on ordinal number
				aTableData.sort(function (a, b) {
					return a.OrdinalNumber - b.OrdinalNumber;
				});

				// When converting single table record to form controls arranging the forms based on the columns ordinal number
				// And creating the relevant controls as in _prepareControlData
				aTableData.forEach(function (oCurrentElement, iIndex) {
					var iLastControlIndex = aTableSingRecControls.length - 1;
					if (oCurrentElement.controlType === 'formElement') {
						if (iLastControlIndex !== -1 && aTableSingRecControls[iLastControlIndex].controlType === "form") {
							aTableSingRecControls[iLastControlIndex].data[0].data.push(oCurrentElement);
						} else {
							var oFormControl = {
								label: "",
								controlType: "form",
								ParentElementId: "",
								data: [{
									data: []
								}],
								singleRowForm: true,
								originalRowCount: oTableControl.originalRowCount
							};
							oFormControl.data[0].data.push(oCurrentElement);
							aTableSingRecControls.push(oFormControl);
							// aColumnChildControls.push(oFormControl);
						}
					} else {
						aTableSingRecControls.push(oCurrentElement);
					}
				});
				oTableControl.controlType = "panel";
				oTableControl.controls = aTableSingRecControls;
				// return oTableControl;
				// }
				//Convert Table to Panel
				// oTableControl.controlType = "panel";
				// oTableControl.controls = aColumnChildControls;
				// return oTableControl;
			} else { //for aColumnChildControls[0].controlType === table
				aTableSingRecControls.push(oTableControl);
				aTableSingRecControls = aTableSingRecControls.concat(aColumnChildControls);
				oTableControl = this._convertToPanelControl(aTableSingRecControls);
			}

			oTableControl.bShowTitle = true;
			oTableControl.LabelInfo = oTableControl.ParentLabelInfo + oTableControl.LabelInfo;

			// Removing Currency form elements from data
			oTableControl.data[0].data.some(function (oFormElement, idx) {
				this._checkForReferenceElementIds(oFormElement, oTableControl.data[0].data, idx);
				// Updating the currency data from the Table columns data
				if (oFormElement.ReferenceElementId.length > 0 && oTableControl.data[0]["E" + oFormElement.ElementId + "_Currency"]) {
					oFormElement.currencyData = oTableControl.data[0]["E" + oFormElement.ElementId + "_Currency"];
				}
			}, this);
			var aChildControlsContextObjects = [];
			var aPanelChildren = [];
			var aOtherChildCtxObjects = [];
			if (!oTableControl.bTableInPanel) {
				var sFieldArrangement = this.getView().getModel("DocumentData").getProperty("/FieldArrangement");
				for (var iControl in oTableControl.controls) {
					var oCurrentChild = oTableControl.controls[iControl];
					aChildControlsContextObjects = [];
					if (oCurrentChild.controlType === "panel") {
						this._updatePanelContextObjs(oCurrentChild, aChildControlsContextObjects);
						for (var i in aChildControlsContextObjects) {
							// updating the sequence no. information we got from the TableHyperlink Data for the current table with one record
							// to its children controls, so that in readIntermediateParents method, this information along with the controls "ParentElementId"
							// can be used to fetch the correct seq. no. interval for the child control
							var oCurrentControl = aChildControlsContextObjects[i];
							var oCurrentPanelCtx = oTableControl.data[0]["E" + oCurrentChild.ElementId];
							oCurrentControl.MaxSequenceNo = oCurrentPanelCtx.MaxSequenceNo;
							oCurrentControl.MinSequenceNo = oCurrentPanelCtx.MinSequenceNo;
							oCurrentControl.SequenceNo = oCurrentPanelCtx.MinSequenceNo;
							oCurrentChild.MaxSequenceNo = oCurrentPanelCtx.MinSequenceNo;
							oCurrentChild.MinSequenceNo = oCurrentPanelCtx.MinSequenceNo;
						}
						oCurrentChild.bIntermediatePanel = true;
						aPanelChildren.push({
							intermediatePanel: oCurrentChild,
							childControlsContextObjects: aChildControlsContextObjects
						});
					} else {
						if (oCurrentChild.controlType === "form") {
							// for the immediate form controls of the current table with one record, to read the correct data we'll use the table controls seq. number
							// why? since it has only one record, it's min = max sequence number, and that will be the parent sequence number for the child
							oCurrentChild.MinSequenceNo = oTableControl.MinSequenceNo ? oTableControl.MinSequenceNo : (oTableControl.selectedHyperLink ?
								oTableControl.selectedHyperLink.data("MinSequenceNo") : 1);
							oCurrentChild.MaxSequenceNo = oTableControl.MaxSequenceNo ? oTableControl.MaxSequenceNo : (oTableControl.selectedHyperLink ?
								oTableControl.selectedHyperLink.data("MaxSequenceNo") : 1);
							oCurrentChild.SequenceNo = oCurrentChild.MinSequenceNo;
							oCurrentChild.bFormInPanel = true;
							if (sFieldArrangement !== "1")
								this._setEnhancedFormElements(oCurrentChild);
						}
						if (oCurrentChild.controlType === "table") {
							var oTableCtx = oTableControl.data[0]["E" + oCurrentChild.ElementId];
							// oTableCtx.MaxSequenceNo this should always be present, since we read the TableHyperLink data
							// adding below condition just for a failsafe
							oCurrentChild.MaxSequenceNo = oTableCtx.MaxSequenceNo ? oTableCtx.MaxSequenceNo : 1;
							oCurrentChild.MinSequenceNo = oTableCtx.MinSequenceNo ? oTableCtx.MinSequenceNo : 1;
							oCurrentChild.ParentSeqNo = oTableCtx.ParentSeqNo ? oTableCtx.ParentSeqNo : 1;
							oCurrentChild.bNestedTable = true;
						}
						if (oCurrentChild.singleRowForm === undefined) {
							aOtherChildCtxObjects.push(oCurrentChild);
						}
					}
				}
			} else {
				this._updatePanelContextObjs(oTableControl, aChildControlsContextObjects);
			}

			// if(oTableControl.controls.length === 1 && oTableControl.controls[0].controlType === "form"){
			// 	oCtxBinding.getObject()["E" + sSelectedElementId + "_Children"][0] = oTableControl.controls[0];
			// }
			// oTableControl.controls.forEach(function(oControl, idx){
			// 	oCtxBinding.getObject()["E" + sSelectedElementId + "_Children"][0] = oControl[idx];
			// });
			if (aChildControlsContextObjects.length > 0 || aPanelChildren.length > 0 || aOtherChildCtxObjects.length > 0) {
				setTimeout(function () {
					if (oTableControl.bTableInPanel) {
						aChildControlsContextObjects.forEach(function (oChildControlsContextObject) {
							oChildControlsContextObject.MinSequenceNo = oTableControl.MinSequenceNo ? oTableControl.MinSequenceNo : 1;
							oChildControlsContextObject.MaxSequenceNo = oTableControl.MaxSequenceNo ? oTableControl.MaxSequenceNo : 1;
						});
						this.readIntermediateParentNodeSequenceNo(aChildControlsContextObjects, aChildControlsContextObjects, "", undefined, true);
					} else {
						for (var iPanel in aPanelChildren) {
							// oIntermediateParent, aChildControlsContextObjects, sPath, oHyperLink, bIsSubPanel
							this.readIntermediateParentNodeSequenceNo(aPanelChildren[iPanel].intermediatePanel, aPanelChildren[iPanel].childControlsContextObjects,
								"", undefined, true);
						}

						if (aOtherChildCtxObjects.length > 0)
							this.readGeneratedData(aOtherChildCtxObjects, "", undefined, true);
					}
				}.bind(this), 10);
			}
		},

		_convertToPanelControl: function (aTableControls) {
			return {
				LabelInfo: aTableControls[0].LabelInfo,
				controlType: "panel",
				controls: aTableControls,
				hasAttributes: aTableControls[0].hasAttributes,
				generatedData: aTableControls[0].generatedData,
				OrdinalNumber: aTableControls[0].OrdinalNumber,
				columnChildPanel: aTableControls[0].columnChildPanel
			};
		},

		_arrangeAnonymousChild: function (oNode, oToBeParentNode) {
			var aNodeChildren = [];
			if (oNode.children.length > 0) {
				oNode = this._setOrdinalNumberToAnnonymousChild(oNode, oToBeParentNode);
				aNodeChildren = oNode.children;
			}
			return aNodeChildren;
		},

		_setOrdinalNumberToAnnonymousChild: function (oNode, oToBeParentNode) {
			if (oNode.children.length > 0) {
				for (var iChild = 0; iChild < oNode.children.length; iChild++) {
					oNode.children[iChild].OrdinalNumber = parseFloat(oNode.OrdinalNumber + '' + oNode.children[iChild].OrdinalNumber);
					oNode.children[iChild].ParentElementId = oToBeParentNode.ElementId;
				}
			}
			return oNode;
		},

		_reverseTrailingNegativeSign: function (oElement) {
			var aTypes = ['decimal', 'int', 'integer', 'float', 'double', 'long'];
			if (typeof oElement.displayValue === "string" && oElement.displayValue.slice(-1) === '-' && aTypes.indexOf(oElement.typeInfo.XsdBuiltInType) !==
				-1) {
				oElement.displayValue = "-" + oElement.displayValue.substring(0, oElement.displayValue.length - 1);
			}
		},

		_getChangeLogOfCurrentElement: function (oElement) {
			var oChangeLogModel = this.getView().getModel("ChangeLogModel");
			var aChangeLogData = oChangeLogModel.getData();
			var aCurrentElementChangeLog = [];
			aChangeLogData = jQuery.grep(aChangeLogData, function (oChangeLogObj, idx) {
				var bSameElement = oChangeLogObj.ElementId === oElement.ElementId && oChangeLogObj.SequenceNo === oElement.SequenceNo &&
					oChangeLogObj.AttributeId === oElement.AttributeId;
				if (bSameElement) {
					aCurrentElementChangeLog.push(oChangeLogObj);
				}
				return bSameElement;
			}, true);
			// Update the change log model with remaining data
			oChangeLogModel.setData(aChangeLogData);
			// Sort the changelog of current element by ChangedOn and get the latest change details
			aCurrentElementChangeLog.sort(function (a, b) {
				return b.ChangedOn - a.ChangedOn;
			});
			// Updating latest change details to current element
			if (aCurrentElementChangeLog.length > 0) {
				oElement.NewValue = aCurrentElementChangeLog[0].NewValue;
				oElement.OldValue = aCurrentElementChangeLog[0].OldValue;
				oElement.ChangedBy = aCurrentElementChangeLog[0].ChangedBy;
				oElement.ChangedByName = aCurrentElementChangeLog[0].ChangedByName;
			}
		},

		_getControltype: function (oCurrentNode) {
			/*
						var aChildElements = oCurrentNode.children;
						//For XBRL: MaxOccurs is 0 and has children, and has abstract elements with TypeIds as parent nodes
						if ((oCurrentNode.TypeId === "" || oCurrentNode.IsAbstract === "X")) {
							return "panel";
						} else {
							return "formElement"; //If no control typr matched, returing formElement
						}
					*/

			var aChildElements = oCurrentNode.children;
			var sDocumentFormat = this.getView().getModel("DocumentData").getProperty("/DocumentFormat");
			//For XBRL: MaxOccurs is 0 and has children, and has abstract elements with TypeIds as parent nodes
			if (((oCurrentNode.MaxOccurs === 1 || oCurrentNode.MaxOccurs === 0) && (oCurrentNode.TypeId === "" || oCurrentNode.IsAbstract ===
					"X")) || oCurrentNode.MaxOccurs === -1 && aChildElements.length !== 0 && sDocumentFormat === "XBRL") {
				return "panel";
			} else if ((oCurrentNode.MaxOccurs === 1 && aChildElements.length === 0) || (sDocumentFormat === "XBRL" && oCurrentNode.MaxOccurs ===
					-1)) {
				return "formElement";
			} else if ((oCurrentNode.MaxOccurs > 1 || oCurrentNode.MaxOccurs === -1)) {
				return "table";
			} else {
				return "formElement"; //If no control typr matched, returing formElement
			}

		},

		_updateEditableState: function () {
			var oStructuredDataModel = this.getView().getModel("structuredDataModel");
			oStructuredDataModel.setProperty("/editable", !oStructuredDataModel.getProperty("/editable"));
		},

		/**
		 * Generic validation for EDIT & RESET --> Dependency on workflow
		 * @params {function} - fCallbackfunction can be Reset or Edit functionality
		 */
		onWorkflowApprovalCheck: function (fCallbackfunction, sState) {
			var that = this,
				bAllowed = true;
			var oReportRunDetail = this.getView().getModel("ReportRunDataModel").getData();
			if (oReportRunDetail.IsWorkflowAllowed === "X") { //Workflow Configured
				if (!Workflow.getDataPreviewEdit(oReportRunDetail)) {
					if (oReportRunDetail.WorkitemStatus === "STARTED" || oReportRunDetail.WorkitemStatus === "READY" || oReportRunDetail.WorkitemStatus ===
						"COMPLETED") { //Workflow Inprocess
						bAllowed = false;
						var sMsg = "";
						switch (sState) {
						case "information":
							sMsg = "xmsg.ApprovalEditMsg";
							break;
						case "confirm":
							sMsg = "xmsg.ApprovalRetriggerMsg";
							break;
						}
						sap.m.MessageBox[sState](this.getResourceBundle().getText(sMsg), {
							icon: sState === "information" ? sap.m.MessageBox.Icon.INFORMATION : sap.m.MessageBox.Icon.WARNING,
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function (oAction) {
								if (oAction === "YES") {
									// 1. When the state is information (on click of Edit), just need to inform the user of the possible implications
									// 2. When the WF status is 'Completed', no need to call 'CancelApprovalWorkflow', since you can't cancel an 'Approved' WF (Technical), so it will be done in the BE, during save and regenerate or on reset.
									// 3. When the WF status is 'Ready' or 'Started', call CancelApprovalWorkflow and then save and regenerate or on reset.
									if (sState === "information" || oReportRunDetail.WorkitemStatus === "COMPLETED") {
										fCallbackfunction.bind(that)();
									} else {
										that.onCancelApproval(oReportRunDetail, fCallbackfunction.bind(that));
									}
								}
							}
						});
					}
				}
			}
			if (bAllowed) {
				fCallbackfunction.apply(this);
			}
		},

		/*
		else if () { //Approval Completed
						sap.m.MessageBox.information(this.getResourceBundle().getText("xmsg.ApprovalCompleted"));
						bAllowed = false;
		}
		*/

		//onClick on Edit data preview
		onEditPress: function () {
			this.onWorkflowApprovalCheck(this._updateEditableState, "information");
		},

		//onClick on reset data preview
		onResetPress: function () {
			this.onWorkflowApprovalCheck(this.onResetDatapreview, "confirm");
		},

		/**
		 * Cancel Approval for both RESET + EDIT
		 * @params {Object} - oReportRunDetail, Report Run Details
		 * @params {function} - fCallbackfunction, Call back function (RESET + EDIT)
		 */
		onCancelApproval: function (oReportRunDetail, fCallbackfunction) {
			var that = this;
			var shttpMethod = ServiceMetadata.FunctionImportSignature(that.getView().getModel(), "CancelApprovalWorkflow");
			this.getView().getModel().callFunction("/CancelApprovalWorkflow", {
				method: shttpMethod,
				urlParameters: {
					ReportRunKey: oReportRunDetail.Key
				},
				success: function (oAuthorization, oresponse) {
					if (oresponse.headers["sap-message"]) {
						var oMessage = JSON.parse(oresponse.headers["sap-message"]);
						if (oMessage) {
							sap.m.MessageToast.show(oMessage.message);
							fCallbackfunction.apply(that);
						}
					}
				},
				error: MessageHandler.showErrorMessage
			});
		},

		onSavePress: function () {
			// this._saveChanges("save");
			return this._saveCurrentChanges("save");
		},

		showMessagePopover: function (oEvent) {
			var aErrorMessages = [];
			var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
			var aCustomMessageModel = this.getView().getModel("messageModel");
			//Since we are adding messages during validation success - Information messages need to be removed
			aMessages.map(function (oMessage) {
				if (oMessage.type === 'Error') {
					aErrorMessages.push(oMessage);
				}
			});
			if (this._isBetaVersion("Add/Delete")) {
				if (aErrorMessages.length > 0 || aCustomMessageModel.getData().length) {
					aErrorMessages = aCustomMessageModel.getData();
					this._openMessagePopover(aErrorMessages, oEvent);
				} else {
					aCustomMessageModel.setData([]);
				}
			} else {

				if (aErrorMessages.length > 0) {
					this._openMessagePopover(aErrorMessages, oEvent);
				} else {
					this.getView().getModel("messageModel").setData([]);
				}
			}
		},

		_openMessagePopover: function (aErrorMessages, oEvent) {
			this.getView().getModel("messageModel").setData(aErrorMessages);
			if (!this._oMessagePopover) {
				this._oMessagePopover = sap.ui.xmlfragment(this.getView().getId(), "gs.fin.runstatutoryreports.s1.fragment.MessagePopover",
					this);
				this.getView().addDependent(this._oMessagePopover);
				this._oMessagePopover.oldMessages = 0;
			}
			var bHasNewErrorMessage = this._oMessagePopover.oldMessages < aErrorMessages.length;
			this._oMessagePopover.oldMessages = aErrorMessages.length;
			if (oEvent || (aErrorMessages.length > 0 && bHasNewErrorMessage)) {
				this.getView().getModel("messageModel").checkUpdate();
				this.getView().byId("messageButton").rerender();
				this._oMessagePopover.openBy(this.getView().byId("messageButton"));
			}
		},

		activeTitlePress: function (oEvent) {
			var oItem = oEvent.getParameter("item"),
				oMessage = oItem.getBindingContext("messageModel").getObject(),
				oControl = Element.registry.get(oMessage.controlIds[0]);

			if (oControl) {
				setTimeout(function () {
					oControl.setShowValueStateMessage(true);
					oControl.setValueStateText(oMessage.message);
					oControl.focus();
				}, 300);
			}
		},
		_saveChanges: function (sFrom) {
			var oPromiseSave = new Promise(function (resolve, reject) {
				var aErrorMessages = this.getView().getModel("messageModel").getData();
				//Skip incase of error/warning feature.
				if (!this._isBetaVersion("ErrorWarning")) {
					if (aErrorMessages.length > 0) {
						this.showMessagePopover("onSave");
						return;
					}
				}
				var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
				var aChangedElements = oGlobalVariablesModel.getProperty("/aChangedElements");
				if (aChangedElements.length === 0 && sFrom === 'save') {
					sap.m.MessageBox.information(this.getResourceBundle().getText("xmsg.visualization.noChangesToSave"));
					return;
				}

				//Update ReportRunDocumentSet
				var fCallBack = function () {
					var oModel = this.getView().getModel();
					var oParamData = this.getView().getModel("paramModel").getData();
					if (oParamData.repCatId === "DP_WITH_ADD_DELETE") {
						oModel = this.getView().getModel();
					}
					oModel.setDeferredGroups(["readDocument", "saveDocument"]);
					var sUrl = oModel.sServiceUrl;
					var oDocModel = this.getView().getModel("DocumentData");
					var oDocModelData = oDocModel.getData();
					var sDocPath = "/ReportRunDocumentSet(guid'" + oDocModelData.Key + "')";
					oModel.update(sDocPath, oDocModelData, {
						groupId: "saveDocument",
						merge: false
					});

					//Update GeneratedDocumentDataSet
					for (var iElement = 0; iElement < aChangedElements.length; iElement++) {
						var oChangedElement = aChangedElements[iElement].dataObj;
						// Ignoring table total obj, if exists
						if (!oChangedElement.isTotalObj) {
							this._createBatchItemRequest(oModel, oChangedElement);
						}
						// Currency data changes are directly available in aChangedElements
						// if (oChangedElement.currencyData && oChangedElement.currencyData.ChangeIndicator === "UM") {
						// 	this._createBatchItemRequest(oModel, oChangedElement.currencyData);
						// }
					}
					oModel.submitChanges({
						groupId: "saveDocument",
						success: jQuery.proxy(function (oResponse, oData) {
							var oBatchResponse = oResponse.__batchResponses[0];
							var oChangeResponse = oBatchResponse.__changeResponses;
							if (oChangeResponse !== undefined) {
								// Updating etag value
								oDocModel.setProperty("/__metadata/etag", oChangeResponse[0].headers.etag);
								oDocModel.setProperty("/Status", Constants.EDITING_IN_PROCESS);
								if (sFrom === 'regenerate') {
									this._regenerate();
								} else {
									sap.m.MessageToast.show(this.getResourceBundle().getText("xmsg.visualization.saveDocumentSuccess"));
									// this._readInitialData(sFrom); //sFrom = save or regenerate
									// Update Changed elements for Tooltip
									this._updatedChangedELementsModifedValues(oGlobalVariablesModel);
								}
								if (this._isBetaVersion("ErrorWarning")) {
									if (aChangedElements.length > 0) {
										PreviewErrorWarning.handleAfterSaveElementUpdate(oResponse, aChangedElements, this);
									}
									PreviewErrorWarning.getErrorWarningCount(this);
									PreviewErrorWarning.getSelectedNodesFooterLog(this);
								}
							} else {
								this._displayErrorForUndefinedChangeResponse(oBatchResponse);
							}
							// Removing newChange flag once it is saved
							aChangedElements.map(function (oChangedElement, idx) {
								oChangedElement.dataObj.newChange = false;
								oChangedElement.dataObj.ChangedByName = sap.ushell.Container.getUser().getId();
							});
							oGlobalVariablesModel.setProperty("/aSavedChanges", aChangedElements);
							oGlobalVariablesModel.setProperty("/aChangedElements", []);
							this._updateEditableState();
							resolve();
						}, this),
						error: jQuery.proxy(function (oError) {
							MessageHandler.showErrorMessage(oError);
						}, this)
					});
				}.bind(this);

				if (sFrom === 'regenerate') { // check for possible workflow configuration - only in case of save & regenerate
					this.onWorkflowApprovalCheck(fCallBack, "confirm");
				} else {
					fCallBack();
				}
			}.bind(this));
			return oPromiseSave;
		},

		_updatedChangedELementsModifedValues: function (oGlobalVariablesModel) {
			var aChangedElements = oGlobalVariablesModel.getProperty("/aChangedElements");
			aChangedElements.map(function (oChangedElement, idx) {
				oChangedElement.dataObj.ModifiedValue = oChangedElement.dataObj.displayValue;
			});

		},

		_createBatchItemRequest: function (oModel, oChangedElement) {
			var sDataPath = "/GeneratedDocumentDataSet(guid'" + oChangedElement.Key + "')";
			var oUpdatePayload = {
				DocumentName: oChangedElement.DocumentName,
				ReportingEntity: oChangedElement.ReportingEntity,
				ChangeIndicator: oChangedElement.ChangeIndicator,
				RepCatId: oChangedElement.RepCatId,
				Key: oChangedElement.Key,
				ReportRunId: oChangedElement.ReportRunId,
				ParentKey: oChangedElement.ParentKey,
				DocumentId: oChangedElement.DocumentId,
				RootKey: oChangedElement.RootKey,
				ElementId: oChangedElement.ElementId,
				AttributeId: oChangedElement.AttributeId,
				SequenceNo: oChangedElement.SequenceNo,
				ParentSeqNo: oChangedElement.ParentSeqNo,
				GeneratedValue: oChangedElement.GeneratedValue,
				ModifiedValue: oChangedElement.ErrorValueCapture ? oChangedElement.ErrorValueCapture : (oChangedElement.displayValue !== null ?
					oChangedElement.displayValue.toString() : ""),
				IsSingleValuedLeafElement: oChangedElement.IsSingleValuedLeafElement,
				ParentElementId: oChangedElement.ParentElementId,
				ModifiedCurrencyValue: oChangedElement.ModifiedCurrencyValue,
				GeneratedCurrencyValue: oChangedElement.GeneratedCurrencyValue
			};
			oModel.update(sDataPath, oUpdatePayload, {
				groupId: "saveDocument",
				merge: false
			});
		},

		_displayErrorForUndefinedChangeResponse: function (oBatchResponse) {
			if (oBatchResponse.response.statusCode === "412") {
				sap.m.MessageBox.error(this.getResourceBundle().getText("xmsg.visualization.saveDocumentError"), {
					onClose: function () {
						this._navBackAndClearScreen();
					}.bind(this)
				});
			} else {
				// var sErrorText = oBatchResponse.response.body.split("</code>")[1].split("</message>")[0].split(">")[1];
				var sErrorText = JSON.parse(oBatchResponse.response.body).error.message.value;
				sap.m.MessageBox.error(sErrorText);
			}
		},

		onSaveRegeneratePress: function () {
			var oDocumentData = this.getView().getModel("DocumentData").getData();
			var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
			var aChangedElements = oGlobalVariablesModel.getProperty("/aChangedElements");
			// When the document status is In Process/ Edit In Process it indicates that there are some already "Saved" changes for the docuemnt
			// so regenration should happen irrespective of any "Newly" changed elements
			if (aChangedElements.length === 0 && (oDocumentData.Status === Constants.GENERATED_REPORT ||
					oDocumentData.Status === Constants.GENERATED_W_REPORT || oDocumentData.Status === Constants.GENERATED_E_REPORT)) {
				sap.m.MessageBox.information(this.getResourceBundle().getText("xmsg.visualization.noChangesToRegenerate"));
			} else {
				var sClearMsg = this.getResourceBundle().getText("xmsg.visualization.clearLog");
				var sLogHandle = this.getView().getModel().getProperty(this.getView().getModel("paramModel").getProperty("/documentPath")).LogHandle;
				var onRegenerate = function () {
					// this._saveChanges("regenerate");
					this._saveCurrentChanges("regenerate");
				}.bind(this);
				if (sLogHandle) {
					this._displayConfirmationMessage(sClearMsg, onRegenerate.bind(this), function () {});
				} else {
					onRegenerate();
				}
			}
		},

		_regenerate: function () {
			//Update ReportRunDocumentSet
			var that = this;
			var oModel = this.getView().getModel();
			var oParamData = this.getView().getModel("paramModel").getData();
			if (oParamData.repCatId === "DP_WITH_ADD_DELETE") {
				oModel = this.getView().getModel();
			}
			var sUrl = oModel.sServiceUrl;
			var oDocModelData = this.getView().getModel("DocumentData").getData();
			var sDocPath = "/ReportRunDocumentSet(guid'" + oDocModelData.Key + "')";
			var sReportRunPath = "/ReportRunSet(guid'" + oParamData.parentKey + "')";
			oModel.update(sDocPath, oDocModelData, {
				groupId: "saveDocument",
				merge: false
			});

			// regenerate 
			var sReGenPath = "/RegenerateDocumentSet(guid'" + oDocModelData.Key + "')";
			var oReGenData = {
				"Key": oDocModelData.Key
			};
			oModel.update(sReGenPath, oReGenData, {
				groupId: "saveDocument",
				merge: false
			});

			//Read Report Run status for bindingcontext update
			oModel.read(sReportRunPath, {
				groupId: "saveDocument"
			});

			oModel.submitChanges({
				groupId: "saveDocument",
				success: jQuery.proxy(function (oResponse, oData) {
					var oBatchResponses = oResponse.__batchResponses[0];
					var oChangeResponses = oBatchResponses.__changeResponses;
					if (oChangeResponses !== undefined) {
						sap.m.MessageBox.information(that.getResourceBundle().getText("xmsg.visualization.regenerationInProcess"), {
							onClose: function () {
								that._navBackAndClearScreen();
							}
						});
					} else {
						this._displayErrorForUndefinedChangeResponse(oBatchResponses);
					}
				}, this),
				error: function (oError) {
					MessageHandler.showErrorMessage(oError);
				}
			});
		},

		onCancelPress: function () {
			var that = this;
			var oView = this.getView();
			var oGlobalVariablesModel = oView.getModel("GlobalVariables");
			oGlobalVariablesModel.setProperty("/aPanels", []);
			var aLocalChanges = oGlobalVariablesModel.getProperty("/aChangedElements");
			if (aLocalChanges.length === 0) {
				sap.m.MessageBox.information(this.getResourceBundle().getText("xmsg.visualization.noChangesToCancel"));
				this._updateMessageModel();
				this._updateEditableState();
			} else {
				var sCancelMsg = this.getResourceBundle().getText("xmsg.visualization.cancelDocument");
				this._displayConfirmationMessage(sCancelMsg, this._onCancelYesPress.bind(this), function () {});
			}
			// this.getView().byId("VisualizationNewPage").rerender();
		},

		_updateMessageModel: function () {
			var oMessageModel = this.getView().getModel("messageModel");
			sap.ui.getCore().getMessageManager().removeAllMessages();
			this.getView().getModel("messageModel").setData([]);
			this.getView().getModel("structuredDataModel").checkUpdate(true);
		},

		_displayConfirmationMessage: function (sMessage, fnYesCallback, fnNoCallback) {
			sap.m.MessageBox.confirm(sMessage, {
				icon: sap.m.MessageBox.Icon.WARNING,
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === "YES") {
						fnYesCallback();
					} else if (oAction === "NO") {
						fnNoCallback();
					}
				}
			});
		},

		_displayConfirmationMessageWithList: function (sMessage1, sMessage2, sMessage3, aReferencedElementIds, fnYesCallback, fnNoCallback) {
			this.getView().getModel("referencedElementModel").setData(aReferencedElementIds);
			if (!this.pressDialog) {
				this.pressDialog = new Dialog({
					title: 'Confirmation',
					state: "Warning",
					icon: "sap-icon://alert",
					contentWidth: "30%",
					content: new VBox({
						items: [
							new Text({
								text: sMessage1
							}).addStyleClass("sapUiSmallMargin"),
							new Table({
								columnHeaderVisible: false,
								selectionMode: "None",
								visibleRowCount: '{=${referencedElementModel>/}.length>10 ? 10 : ${referencedElementModel>/}.length}',
								columns: [new Column({
									template: new Text({
										text: "{referencedElementModel>ElementLabelInfo}"
									})
								})],
								rows: {
									path: 'referencedElementModel>/'
								}
							}).addStyleClass("sapUiLargeMarginLeft"),
							new Text({
								text: sMessage2
							}).addStyleClass("sapUiSmallMargin"),
							new Text({
								text: sMessage3
							}).addStyleClass("sapUiSmallMargin")
						]
					}).addStyleClass("sapUiSmallMargin"),
					beginButton: new Button({
						text: this.getResourceBundle().getText("xbut.yes"),
						press: function () {
							this.pressDialog.close();
							this.pressDialog = undefined;
							fnYesCallback();
						}.bind(this)
					}),
					endButton: new Button({
						text: this.getResourceBundle().getText("xbut.no"),
						press: function () {
							this.pressDialog.close();
							this.pressDialog = undefined;
							fnNoCallback();
						}.bind(this)
					})
				});

				//to get access to the global model
				this.getView().addDependent(this.pressDialog);
			}

			this.pressDialog.open();
		},

		_onCancelYesPress: function () {
			var oView = this.getView();
			this._updateEditableState();
			var oGlobalVariablesModel = oView.getModel("GlobalVariables");
			var oStructuredDataModel = oView.getModel("structuredDataModel");
			var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().getData();
			var aSavedChangesMessages = [];
			var aLocalChanges = oGlobalVariablesModel.getProperty("/aChangedElements");
			aLocalChanges.map(function (oLocalChange) {
				var oLocalChangeData = oLocalChange.dataObj;
				var oCurrencyData = oLocalChangeData.currencyData;
				// If change has currencyData(=Form), revert the change if it has changeIndicator UM.
				if (oLocalChangeData.isTotalObj) {
					// If it is Currency Total, revert to inital calculated value
					for (var sColumnElementKey in oLocalChangeData) {
						if (sColumnElementKey !== "isTotalObj") {
							oLocalChangeData[sColumnElementKey].displayValue = oLocalChangeData[sColumnElementKey].GeneratedValue;
							oLocalChangeData[sColumnElementKey].bShowTotals = oLocalChangeData[sColumnElementKey].bShowTotalsInitial;
						}
					}
					// removing/adding totals object to table data
					var oStructuredDataModel = oView.getModel("structuredDataModel");
					var aTableDataPathSplit = oLocalChange.path.split("/");
					// Removing the data index from pathSplit
					aTableDataPathSplit.splice(aTableDataPathSplit.length - 1, 1);
					var sTableDataPath = aTableDataPathSplit.join("/");
					var aTableData = oStructuredDataModel.getObject(sTableDataPath + "/data");
					var oTableControlData = oStructuredDataModel.getObject(sTableDataPath);
					oTableControlData.bAddTotalsObject = oTableControlData.bOnLoadAddTotalsObject;
					if (oTableControlData.bAddTotalsObject) {
						aTableData.push(oTableControlData.oTotalsObject);
					} else {
						aTableData.splice(aTableData.length - 1, 1);
					}
				} else {
					oLocalChangeData.displayValue = oLocalChange.newChange ? oLocalChangeData.GeneratedValue : oLocalChangeData.ModifiedValue;
					oLocalChangeData.OldValue = oLocalChangeData.onLoadLastModifiedValue;
					if (oLocalChange.newChange) {
						oLocalChangeData.ChangeIndicator = "";
					} else {
						oLocalChangeData.ChangeIndicator = "UM";
						aSavedChangesMessages = aSavedChangesMessages.concat(jQuery.grep(aMessages, function (oMessage, idx) {
							return oMessage.target === oLocalChangeData.controlId + "/value" && oLocalChangeData.ModifiedValue !== "";
						}, false));
					}
					
					if(oLocalChangeData.isChoice){
						this.handleChoiceChildrenVis(oLocalChangeData, oLocalChangeData.displayValue);
					}
				}
			}.bind(this));
			oGlobalVariablesModel.setProperty("/aChangedElements", []);
			oGlobalVariablesModel.updateBindings(true);
			oStructuredDataModel.checkUpdate(true);
			this._updateMessageModel();
			var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.unregisterMessageProcessor(oMessageProcessor);
			aSavedChangesMessages.forEach(function (oSavedChangeMessage) {
				sap.ui.getCore().getMessageManager().addMessages(oSavedChangeMessage);
			});
		},

		onResetDatapreview: function () {
			var that = this;
			var oView = this.getView();
			var oModel = oView.getModel();
			var oResourceModel = this.getResourceBundle();
			var oDocModel = oView.getModel("DocumentData");
			var oDocModelData = oDocModel.getData();
			// var oGeneratedData = oView.getModel("GeneratedData").getData();
			var oStructuredDataModel = oView.getModel("structuredDataModel");
			oModel.setDeferredGroups(["readDocument", "saveDocument"]);
			var oGlobalVariablesModel = oView.getModel("GlobalVariables");
			var oCurrencyModel = oView.getModel("currencyModel");
			// var aLocalChanges = oGlobalVariablesModel.getProperty("/aChangedElements");
			// var aSavedChnages = oGlobalVariablesModel.getProperty("/aSavedChanges");
			// var oParentVbox = oView.getContent()[0].getContent()[0].getPages()[0].getSections()[0].getSubSections()[0].getBlocks()[0];

			// if (aLocalChanges.length > 0 || aSavedChnages.length > 0) {
			var sDiscardMessage = oView.getModel("DocumentData").getData().PrimaryLogHandle === "" ?
				oResourceModel.getText("xmsg.visualization.discardDocument") : oResourceModel.getText(
					"xmsg.visualization.logResetDiscardMessage");
			MessageBox.confirm(sDiscardMessage, {
				icon: MessageBox.Icon.WARNING,
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (oAction) {
					if (oAction === "YES") {
						var method = "PUT";
						var sDocPath = "/ReportRunDocumentSet(guid'" + oDocModelData.Key + "')";
						oModel.update(sDocPath, oDocModelData, {
							groupId: "saveDocument",
							merge: false
						});
						var sResetPath = "/DiscardManualChangesSet(guid'" + oDocModelData.Key + "')";
						var oResetDataKey = {
							"Key": oDocModelData.Key
						};
						oModel.update(sResetPath, oResetDataKey, {
							groupId: "saveDocument",
							merge: false
						});

						oModel.submitChanges({
							groupId: "saveDocument",
							success: jQuery.proxy(function (oResponse, oData) {
								var oBatchResponses = oResponse.__batchResponses[0];
								var oChangeResponses = oBatchResponses.__changeResponses;
								if (oChangeResponses !== undefined) {
									oDocModel.setProperty("/__metadata/etag", oChangeResponses[0].headers.etag);
									oGlobalVariablesModel.setProperty("/aRootElements", []);
									oCurrencyModel.setProperty("/aCommonData", []);
									oGlobalVariablesModel.setProperty("/aChangedElements", []);
									oGlobalVariablesModel.setProperty("/aSavedChanges", []);
									sap.m.MessageBox.information(this.getResourceBundle().getText("xmsg.visualization.resetInProcess"), {
										onClose: function () {
											this._navBackAndClearScreen();
										}.bind(this)
									});
								}
							}, this),
							error: function (oError) {
								MessageHandler.showErrorMessage(oError);
							}
						});
					}
				}.bind(this)
			});
			// } else {
			// 	sap.m.MessageBox.information(this.getResourceBundle().getText("xmsg.visualization.noChangesToReset"));
			// }
		},

		onPrintPress: function (oEvent) {
			var oDpNestedTree = this.byId("BeginPages--DPNestedTree");
			if (!this.byId("BeginPages--DynamicSideContent").getShowSideContent()) {
				oDpNestedTree.setVisible(false);
			}
			var sTargetId = oEvent.getSource().data("targetId");
			setTimeout(function () {
				var oTarget = this.getView();
				if (sTargetId) {
					oTarget = oTarget.byId(sTargetId);
				}
				if (oTarget) {
					var $domTarget = oTarget.$()[0],
						sTargetContent = $domTarget.getElementsByTagName('div'),
						sOriginalContent = document.body.getElementsByTagName('div');
					setTimeout(function () {
						document.body.text = sTargetContent;
						window.print();
						document.body.text = sOriginalContent;
						oDpNestedTree.setVisible(true);
					}, 100);
				}
			}.bind(this), 300);
		},

		_getBooleanControl: function (oBindingPaths, oCtx) {

			var oValueBinding = {
				parts: [{
					path: oBindingPaths.ValuePath
				}]
			};
			return new Select({
				items: [{
					"key": "false",
					"text": Constants.FALSE
				}, {
					"key": "true",
					"text": Constants.TRUE
				}],
				selectedKey: oValueBinding,
				visible: oBindingPaths.EditablePath,
				valueState: oBindingPaths.ValueStatePath,
				tooltip: oBindingPaths.TooltipPath,
				valueStateText: oBindingPaths.ValueStateText,
				enabled: oBindingPaths.Edit,
				change: function (oEvent) {
					oEvent._control = "Select";
					this._handleValidationSuccess(oEvent);
				}.bind(this)
			});

			// var fBoolItemKeyFormatter = function (sDisplayValue, sBoolState) {
			// 	var aKeys = [undefined, undefined];
			// 	// boolean Interop
			// 	// In older runs, boolean will have options like "0"/"1" and "true"/"false"
			// 	switch (sDisplayValue) {
			// 	case "0":
			// 	case "1":
			// 		aKeys = ["0", "1"];
			// 		break;
			// 	case "false":
			// 	case "true":
			// 		aKeys = [Constants.FALSE, Constants.TRUE];
			// 		break;
			// 	case "":
			// 	case "X":
			// 		aKeys = ["", "X"];
			// 	}

			// 	return sBoolState === Constants.TRUE ? aKeys[1] : aKeys[0];
			// };

			// var aPossibleBoolValues = ["true", "false"];

			// return new sap.m.ComboBox({
			// 	visible: oBindingPaths.EditablePath,
			// 	valueState: oBindingPaths.ValueStatePath,
			// 	tooltip: oBindingPaths.TooltipPath,
			// 	showValueStateMessage: false,
			// 	value: {
			// 		path: oBindingPaths.ValuePath,
			// 		formatter: formatter.convertBooleanValueToText
			// 	},
			// 	items: [
			// 		new sap.ui.core.Item({
			// 			"key": {
			// 				parts: [{
			// 					path: oBindingPaths.ValuePath // displayValue path
			// 				}, {
			// 					value: Constants.FALSE
			// 				}],
			// 				formatter: fBoolItemKeyFormatter
			// 			},
			// 			"text": Constants.FALSE
			// 		}),
			// 		new sap.ui.core.Item({
			// 			"key": {
			// 				parts: [{
			// 					path: oBindingPaths.ValuePath // displayValue path
			// 				}, {
			// 					value: Constants.TRUE
			// 				}],
			// 				formatter: fBoolItemKeyFormatter
			// 			},
			// 			"text": Constants.TRUE
			// 		})
			// 	],
			// 	validationSuccess: this._handleValidationSuccess.bind(this),
			// 	validationError: this._handleValidationError.bind(this),
			// 	change: function (oEvent) {
			// 		var oCombobox = oEvent.getSource();
			// 		if (aPossibleBoolValues.indexOf(oCombobox.getValue()) === -1) {
			// 			oCombobox.fireValidationError({
			// 				message: oCombobox.getModel("i18n").getProperty("xtit.visualization.invalidEntry")
			// 			});
			// 		} else {
			// 			var oStructuredDataModel = oCombobox.getModel("structuredDataModel");
			// 			var oChangedCtx = oCombobox.getBindingContext("structuredDataModel");
			// 			var sValue = oCombobox.getSelectedKey();
			// 			var sPropertyPath = oCombobox.getBindingInfo("value").parts[0].path;
			// 			oStructuredDataModel.setProperty(oChangedCtx.sPath + "/" + sPropertyPath, sValue);
			// 			var oPropChangeParameters = {
			// 				reason: "propertyChange",
			// 				path: sPropertyPath,
			// 				context: oChangedCtx,
			// 				value: sValue
			// 			};
			// 			oStructuredDataModel.firePropertyChange(oPropChangeParameters);
			// 			oCombobox.fireValidationSuccess();
			// 		}

			// 	}
			// });
		},

		handleMidFullScreen: function (oEvent) {
			this.byId("MidPages--enterFullScreenBtn").setVisible(false);
			this.byId("MidPages--exitFullScreenBtn").setVisible(true);
			this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.MidColumnFullScreen);
		},
		handleExitMidFullScreen: function (oEvent) {
			this.byId("MidPages--enterFullScreenBtn").setVisible(true);
			this.byId("MidPages--exitFullScreenBtn").setVisible(false);
			this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.TwoColumnsBeginExpanded);
		},

		handleEndFullScreen: function (oEvent) {
			this.byId("EndPages--enterFullScreenBtn").setVisible(false);
			this.byId("EndPages--exitFullScreenBtn").setVisible(true);
			this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.EndColumnFullScreen);
		},
		handleExitEndFullScreen: function (oEvent) {
			this.byId("EndPages--enterFullScreenBtn").setVisible(true);
			this.byId("EndPages--exitFullScreenBtn").setVisible(false);
			this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.ThreeColumnsMidExpanded);
		},

		handleMidScreenClose: function () {
			this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.OneColumn);
		},

		handleEndScreenClose: function () {
			this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.TwoColumnsBeginExpanded);
		},

		onCloseHierarchyPress: function () {
			this._manageHierarchyPaneVisbility(false);
		},

		onShowHierarchyPress: function () {
			this._manageHierarchyPaneVisbility(true);
		},

		getInitialValueStatusForTypes: function (oCtx, sValue) {
			var bIsInitial;
			var oDataObject = oCtx.getObject();
			var sPath = oCtx.getPath();

			switch (oDataObject.typeInfo.XsdBuiltInType) {
			case 'integer':
			case 'int':
			case 'decimal':
			case 'double':
			case 'float':
				// 1. When the value is changed to initial(0 for numbers) and the value for this optional element is initial when the preview loaded, it's status is initial
				// 2. When the element is manually edited to initial value and this optional element is generated with initial value(not written in file), it should be allowed (even if it's less than the minInclusive)
				if (parseFloat(sValue) === 0 && oDataObject.GeneratedValue == sValue && sValue < parseFloat(oDataObject.typeInfo.Mininclusive)) {
					bIsInitial = true;
				}
				break;
			default:
				// Same rules as above, but here initial is ""
				if (sValue === "" && oDataObject.GeneratedValue === sValue && oDataObject.typeInfo.MinLength > 0) {
					bIsInitial = true;
				}
				break;
			}

			// When the element is initial and if it's not in the aChangedElements, add them so that the same can be send for regeneration.
			if (bIsInitial) {
				var aChangedElementsModelEvents = this.getView().getModel("GlobalVariables").getProperty("/aChangedElements");
				var bChangedEventAlreadyExist = aChangedElementsModelEvents.some(function (oModelChangedEvent, idx) {
					return (oModelChangedEvent.context.sPath === sPath);
				});
				if (!bChangedEventAlreadyExist) {
					var oNewChangedEvent = {
						context: oCtx,
						path: "displayValue",
						dataObj: oDataObject
					};
					aChangedElementsModelEvents.push(oNewChangedEvent);
					if (!oNewChangedEvent.newChange) {
						oNewChangedEvent.newChange = oNewChangedEvent.dataObj.ChangeIndicator === "UM" ? false : true;
					}
					// Updating Old values for tooltip
					oNewChangedEvent.dataObj.ChangedBy = sap.ushell.Container.getUser().getId();
					//onLoadLastModifiedValue used for reverting old value on cancel press
					oNewChangedEvent.dataObj.onLoadLastModifiedValue = oNewChangedEvent.dataObj.OldValue;
					if (oNewChangedEvent.dataObj.ChangeIndicator === "UM") {
						oNewChangedEvent.dataObj.OldValue = oNewChangedEvent.dataObj.ModifiedValue;
					} else {
						oNewChangedEvent.dataObj.OldValue = oNewChangedEvent.dataObj.GeneratedValue;
					}
					// Updating ChangeIndicator 
					oNewChangedEvent.dataObj.ChangeIndicator = "UM";
				}
			}
			return {
				"isInitial": bIsInitial,
				"formattedValue": sValue
			};
		},

		_manageHierarchyPaneVisbility: function (bShowSideContent) {
			var oView = this.getView();
			var oHierarchyPane = oView.byId("BeginPages--DynamicSideContent");
			oHierarchyPane.setShowSideContent(bShowSideContent);
			oView.byId("BeginPages--idHideHierarchy").setVisible(!bShowSideContent);
			if (bShowSideContent) {
				oHierarchyPane.toggle();
				oView.byId("BeginPages--idCloseHierarchy").focus(); //to get the focus on 'Hide' button after clicking Show Hierarchy button.
			}
		},

		//******************* Add/Delete Row ******************
		_onAddNewRow: function (oEvent) {
			var oTableControl = oEvent.getSource().getParent().getParent();
			var oStructuredDataModel = oEvent.getSource().getModel("structuredDataModel");
			var oTableContext = oEvent.getSource().getBindingContext("structuredDataModel");
			var oTableCtxData = oTableContext.getObject();
			// if(oTableCtxData.maxOccurs === -1) { //todo - update condition with table actual row cout comparision
			// For maxoccurs -1 rowcount can be anything
			if (oTableCtxData.maxOccurs !== -1 && (oTableCtxData.maxOccurs <= oTableCtxData.rowCount)) {
				// todo - modularize message box
				sap.m.MessageBox.confirm(this.getResourceBundle().getText("xtit.newRowCardinality", [oTableCtxData.ParentLabelInfo,
					oTableCtxData.LabelInfo,
					oTableCtxData.maxOccurs
				]), {
					icon: sap.m.MessageBox.Icon.WARNING,
					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
					emphasizedAction: sap.m.MessageBox.Action.YES,
					onClose: function (oAction) {
						if (oAction === "YES") {
							this._addNewRow(oTableContext);
						}
					}.bind(this)
				});
			} else {
				this._addNewRow(oTableContext);
			}
		},

		onCopy: function (oEvent) {
			var oTableControl = oEvent.getSource().getParent().getParent();
			var oTableContext = oTableControl.getBindingContext("structuredDataModel");
			var oTableControlData = oTableContext.getObject();
			var aSelectedIndices = oTableControlData.controlType === "table" ? oTableControl.getSelectedIndices() : [0];
			var oSelectedRowData = oTableControlData.data[aSelectedIndices[0]]; // As copy can happen on one row selection only.
			this._addNewRow(oTableContext, oSelectedRowData);
		},

		_addNewRow: function (oTableContext, oPrevRowData) {
			// if(oTableContext.getObject().hasFurtherChildren){ //todo - change to negation for non nested add only
			if (!this._oAddRowDialog) {
				Fragment.load({
					name: "gs.fin.runstatutoryreports.s1.fragment.PreviewAddRowDialog",
					controller: this
				}).then(function (oFragment) {
					this._oAddRowDialog = oFragment;
					// this._oAddRowDialog.isOpened = true;
					this.getView().addDependent(this._oAddRowDialog);
					this._oAddRowDialog.open();

					//Render table columns as form elements
					this._renderNewRowFormElements(oTableContext, oPrevRowData);
				}.bind(this));
			} else {
				this._oAddRowDialog.open();
				this._oAddRowDialog.isOpened = true;
				this._renderNewRowFormElements(oTableContext, oPrevRowData);

			}
			// }
		},

		updateConstraints: function (iRowCount) {
			if (this._oAddRowDialog.isOpened) {
				this._oAddRowDialog.getContent()[0].getItems()[0].getContent()[0].getFormContainers()[0].getFormElements()[0].getFields()[0].getItems()[
					0].getItems()[0].getBindingInfo("value").parts[0].type.oConstraints.maximum = iRowCount;
			}
		},

		onCancelAddRow: function () {
			this._oAddRowDialog.close();

			//clear add row popup errors
			var oMessageManager = sap.ui.getCore().getMessageManager();
			var aErrorMessages = oMessageManager.getMessageModel().getData();
			var aMessagesInPopup = aErrorMessages.filter(function (oMessage) {
				return oMessage.errorInPopup;
			});
			oMessageManager.removeMessages(aMessagesInPopup);
			this.showMessagePopover();
		},

		_renderNewRowFormElements: function (oTableContext, oPrevRowData) {
			// add row model
			var oTableData = oTableContext.getObject();
			var aAllColumnsMetadata = jQuery.extend(true, [], oTableData.columns);
			var aColumnsMetadata = [];
			aAllColumnsMetadata.forEach(function (oCol) {
				if (!oCol.hasChildren) {
					aColumnsMetadata.push(oCol);
				}
			});
			aColumnsMetadata = this._removingAttributeAndReferenceColumns(aColumnsMetadata, oTableData);
			aColumnsMetadata[0].LabelInfo = this.getResourceBundle().getText("xtit.position");
			aColumnsMetadata[0].XsdBuiltInType = "integer";
			aColumnsMetadata.forEach(function (oCol, idx) {
				var sDefaultValue = idx === 0 ? oTableData.originalRowCount + 1 : "";
				oCol.FieldVisibilityInd = 'X';
				if (oPrevRowData) {
					var sKey = idx === 0 ? "S" + oCol.ElementId : (oCol.attributes.length > 0 ? "E" + oCol.ElementId + "_value" : "E" + oCol.ElementId);
					sDefaultValue = idx === 0 ? Number(oPrevRowData[sKey].displayValue) + 1 : (oPrevRowData[sKey] ? oPrevRowData[sKey].displayValue :
						""); //for cells w/o generated data
				}
				this._mergeGeneratedDataToMetadata({
					GeneratedValue: sDefaultValue
				}, oCol);
				oCol.ManualAdjOption = "";
				this._checkForReferenceElementIds(oCol, aColumnsMetadata, idx, oPrevRowData);
				oCol.attributes.forEach(function (oAttribute) {
					oAttribute.FieldVisibilityInd = 'X';
					var sAttributeValue = oPrevRowData && oPrevRowData["E" + oAttribute.ElementId + "_A" + oAttribute.AttributeId] ?
						oPrevRowData[
							"E" + oAttribute.ElementId + "_A" + oAttribute.AttributeId].displayValue : "";
					this._mergeGeneratedDataToMetadata({
						GeneratedValue: sAttributeValue
					}, oAttribute);
				}.bind(this));
			}.bind(this));

			oTableData.NewRowContext = [{
				LabelInfo: oTableData.LabelInfo,
				controlType: "form",
				ParentElementId: oTableData.ParentElementId,
				ElementId: oTableData.ElementId,
				OrdinalNumber: oTableData.OrdinalNumber,
				data: [{
					data: aColumnsMetadata
				}],
				controls: [],
				attributes: [],
				formControls: [],
				columns: [],
				parentSeqNos: [],
				bShowTitle: false
			}];
			oTableData.ReferenceId = "";

			// this.getView().setModel(new JSONModel(oNewRowData), "structuredDataModel");
			var oVbox = sap.ui.getCore().byId("addRowContainer");
			oVbox.bindAggregation("items", {
				path: 'structuredDataModel>' + oTableContext.getPath() + '/NewRowContext',
				templateShareable: false,
				factory: this._getChildControl.bind(this)
			});
			oVbox.setBindingContext(oTableContext, "structuredDataModel");

			var oDialog = sap.ui.getCore().byId("addRowDialog");
			oDialog.setTitle(this.getResourceBundle().getText("xtit.addRowDialogtitle", [oTableData.ParentLabelInfo, oTableData.LabelInfo]));
			this.updateConstraints(oTableData.originalRowCount + 1);
		},

		_removingAttributeAndReferenceColumns: function (aColumnsMetadata, oTableData) {
			var aColumns = [];
			aColumnsMetadata.forEach(function (oCol) {
				var bReferenceColumn = oCol.aReferencedElementIds !== undefined;
				var bTableAttribute = oCol.ElementId.split("_")[0] === oTableData.ElementId && !oTableData.repeatingLeafNode && oCol.isAttributeColumn;
				// TODO oCol.isAttributeColumn || for table attributes add condtiton 
				if ((oCol.AttributeId === "" || bTableAttribute) && !bReferenceColumn) {
					aColumns.push(oCol);
				}
			});
			return aColumns;
		},

		// onAddRowSaveNext: function (oEvent) {
		// 	this.onAddRowSave(oEvent, true);
		// },

		onAddRowSave: function (oEvent) {
			this._saveCurrentChanges("add", undefined, oEvent.getSource().data("saveNext") === "true");
			// var oVbox = sap.ui.getCore().byId("addRowContainer");
			// var oStructuredDataModel = this.getView().getModel("structuredDataModel");
			// var oTableCxtData = oVbox.getBindingContext("structuredDataModel").getObject();
			// var aNewRowData = oTableCxtData.NewRowContext[0].data[0].data;
			// var oPositionFld = oVbox.getItems()[0].getContent()[0].getFormContainers()[0].getFormElements()[0].getFields()[0].getItems()[0].getItems()[
			// 	0];
			// if (oPositionFld.getValueState() === "Error") {
			// 	oPositionFld.focus();
			// 	return;
			// }
			// var aBatchRequests = [];
			// BusyIndicator.show(0);
			// var oParamData = this.getView().getModel("paramModel").getData();
			// var oModel = this.getView().getModel();
			// oModel.setDeferredGroups(["saveDocument"]);
			// this._documentUpdateCall();

			// aNewRowData.forEach(function (oNewCell, idx) {
			// 	if (!oNewCell.hasChildren) {
			// 		this._prepareBatchRequestForNewRow(oParamData, oNewCell, oModel, idx, oTableCxtData);
			// 		oNewCell.attributes.forEach(function (oAttribute) {
			// 			this._prepareBatchRequestForNewRow(oParamData, oAttribute, oModel, 1, oTableCxtData);
			// 		}.bind(this));
			// 	}
			// }.bind(this));
			// oTableCxtData.AmountElementId.forEach(function (sAmountElementId) {
			// 	aNewRowData.forEach(function (oNewCell, idx) {
			// 		if (oNewCell.ElementId === sAmountElementId && oTableCxtData.ReferenceId.indexOf(oNewCell.ReferenceElementId) === -1) {
			// 			oTableCxtData.ReferenceId = oTableCxtData.ReferenceId + oNewCell.ReferenceElementId;
			// 			this._prepareBatchRequestForNewRow(oParamData, oNewCell.currencyData, oModel, idx, oTableCxtData);
			// 		}
			// 	}.bind(this));
			// }.bind(this));
			// var oDocModel = this.getView().getModel("DocumentData");
			// oModel.submitChanges({
			// 	groupId: "saveDocument",
			// 	success: jQuery.proxy(function (oResponse, oData) {
			// 		BusyIndicator.hide();
			// 		var oBatchResponse = oResponse.__batchResponses[0];
			// 		var aChangeResponse = oBatchResponse.__changeResponses;
			// 		if (aChangeResponse !== undefined) {
			// 			// Updating etag value
			// 			oDocModel.setProperty("/__metadata/etag", aChangeResponse[0].headers.etag);
			// 			oDocModel.setProperty("/Status", Constants.EDITING_IN_PROCESS);
			// 			var aNewRowResponseData = [];
			// 			aChangeResponse.forEach(function (oChangeResp, idx) {
			// 				if (idx !== 0) {
			// 					aNewRowResponseData.push(oChangeResp.data);
			// 				}
			// 			});
			// 			var iNewRowPosition = aNewRowResponseData[0].OrdinalNo;
			// 			var oSelectedContext = oVbox.getBindingContext("structuredDataModel").getObject();
			// 			aNewRowResponseData.sort(function (a, b) {
			// 				return Number(a.ElementId) - Number(b.ElementId);
			// 			});

			// 			//Updating totals row
			// 			if (oTableCxtData.hasTotalRow) {
			// 				oTableCxtData.AmountElementId.forEach(function (sAmountElementId) {
			// 					aNewRowData.forEach(function (oNewCell, idx) {
			// 						if (oNewCell.ElementId === sAmountElementId) {
			// 							if (oNewCell.currencyData.displayValue === oTableCxtData.totalRow["E" + sAmountElementId + "_Currency"].displayValue) {
			// 								this._updateTotalsAfterCalculation(oTableCxtData.totalRow, oNewCell, "add");
			// 							} else {
			// 								oTableCxtData.totalRow["E" + sAmountElementId].bShowTotals = false;
			// 							}
			// 						}
			// 						// this._setTotalRowVisibility(oTableCxtData, oNewCell.currencyData, iNewRowPosition);
			// 					}.bind(this));
			// 				}.bind(this));
			// 				oSelectedContext.data.splice(oSelectedContext.data.length - 1, 1);
			// 			}

			// 			this._ConstructTableData(aNewRowResponseData, oSelectedContext);
			// 			oSelectedContext.rowCount = oSelectedContext.rowCount + 1;

			// 			//update table seq nos
			// 			var iLoadedRowsInTable = oTableCxtData.hasTotalRow ? oSelectedContext.data.length - 1 : oSelectedContext.data.length;
			// 			for (var idx = iNewRowPosition; idx < iLoadedRowsInTable; idx++) {
			// 				var oContainerData = oSelectedContext.data[idx]['S' + oSelectedContext.ElementId];
			// 				oContainerData.displayValue = oContainerData.displayValue + 1;
			// 				oContainerData.OrdinalNo = oContainerData.displayValue;
			// 			}

			// 			if (!bKeepDialog) {
			// 				delete oSelectedContext.NewRowContext;
			// 				this._oAddRowDialog.close();
			// 			} else {
			// 				oTableCxtData.ReferenceId = "";
			// 				aNewRowData.forEach(function (oCellData, idx) {
			// 					oCellData.displayValue = "";
			// 					if (idx === 0) {
			// 						// oCellData.displayValue = oSelectedContext.rowCount + 1;
			// 						oCellData.displayValue = iNewRowPosition + 1;
			// 						this.updateConstraints(oSelectedContext.rowCount + 1);
			// 					}
			// 					oCellData.attributes.forEach(function (oAttributeData) {
			// 						oAttributeData.displayValue = "";
			// 					});
			// 					if (oCellData.currencyData) {
			// 						oCellData.currencyData.displayValue = "";
			// 					};
			// 				}.bind(this));
			// 			}
			// 			// this._updateHyperLinkCount(oVbox.getBindingContext("structuredDataModel")); //Todo - Phase 2
			// 			sap.m.MessageToast.show(this.getResourceBundle().getText("xtit.newRowSuccessMessage", [oSelectedContext.LabelInfo,
			// 				iNewRowPosition
			// 			]));
			// 			oSelectedContext.originalRowCount = oSelectedContext.originalRowCount + 1;
			// 			// oSelectedContext.columns[0].typeInfo.Maxinclusive = oSelectedContext.rowCount + 1;
			// 			oStructuredDataModel.checkUpdate();
			// 		} else {
			// 			this._displayErrorForUndefinedChangeResponse(oBatchResponse);
			// 		}
			// 	}, this),
			// 	error: jQuery.proxy(function (oError) {
			// 		BusyIndicator.hide();
			// 		MessageHandler.showErrorMessage(oError);
			// 	}, this)
			// });
		},

		_prepareBatchRequestForNewRow: function (oParamData, oNewCell, oModel, idx, oTableCxtData) {
			var iParentSeqNo = oTableCxtData.selectedHyperLink ? oTableCxtData.selectedHyperLink.getCustomData()[4].getValue() : 1;
			var oPayload = {
				"ParentKey": oParamData.key,
				"ElementId": oNewCell.isAttributeColumn ? oTableCxtData.ElementId : oNewCell.ElementId,
				"AttributeId": oNewCell.isAttributeColumn ? oNewCell.ElementId.split("A")[1] : oNewCell.AttributeId,
				"ParentSeqNo": -1,
				"ModifiedValue": oNewCell.displayValue !== null ? oNewCell.displayValue.toString() : "",
			};

			if (oNewCell.typeInfo.XsdBuiltInType === "date") {
				oPayload.ModifiedValue = oNewCell.displayValue.split("-").join("");
			}

			if (idx === 0 || oNewCell.isAttributeColumn) {
				oPayload.SequenceNo = -1;
				oPayload.ParentSeqNo = iParentSeqNo;
				oPayload.PreviousSeqNo = oNewCell.isAttributeColumn ? 0 : Number(oNewCell.displayValue);
			}

			var oNavParamData = this.getView().getModel("paramModel").getData();
			if (oNavParamData.repCatId === "DP_WITH_ADD_DELETE") {
				oPayload.OPASequenceNo = oTableCxtData.rowCount;
			}

			if (idx === 0) {
				delete oPayload.ModifiedValue;
			}
			if(oNewCell.MinOccurs >= 1 || (oNewCell.MinOccurs === 0 && oNewCell.displayValue !== null)){ 
				oModel.create("/GeneratedDocumentDataSet", oPayload, {
					groupId: "saveDocument",
					merge: false
				});
			}
		},

		//todo - Phase 2
		/*_updateHyperLinkCount: function(oTableContext){
			var sContextPath = oTableContext.getPath();
			if(oTableContext.getPath().indexOf("_Children") !== -1){
				var aContextPathSplit = sContextPath.split("/");
				// Reomve the last two path info to get to the parent context  
				// Currrent table path '/details/controls/1/data/2/E0000000010_Children/0' Parent Hyper link row path '/details/controls/1/data/2'
				aContextPathSplit.splice(aContextPathSplit.length - 2, 2);
				var oParentContext = new sap.ui.model.Context(oTableContext.getModel(), aContextPathSplit.join("/"));
				var oParentDataObject = oParentContext.getObject();
				var sHyperLinkElementId = "E" + oTableContext.getObject().ElementId;
				oParentDataObject[sHyperLinkElementId].RowCount = parseInt(oParentDataObject[sHyperLinkElementId].RowCount, 10) + 1;
			}
		},*/

		_onDeleteRow: function (oEvent) {
			var oTableControl = oEvent.getSource().getParent().getParent();
			var oTableControlData = oTableControl.getBindingContext("structuredDataModel").getObject();
			var sCardinalityText = this.getResourceBundle().getText("xtit.deleteRowCardinality", [oTableControlData.controlType === "table" ?
				oTableControlData.ParentLabelInfo : "", oTableControlData.LabelInfo, oTableControlData.minOccurs
			]);
			var sFurtherChidrenText = this.getResourceBundle().getText("xtit.furtherchildrenDelete", [oTableControlData.LabelInfo]);
			var sDeleteConfrim = this.getResourceBundle().getText("xtit.deleteRowConfirm");
			var sNewRowDeleteConfirm = this.getResourceBundle().getText("xtit.newRowDeleteConfirm");
			var aErrorMessages = [];
			if (oTableControlData.minOccurs >= oTableControlData.rowCount) {
				aErrorMessages.push(sCardinalityText);
			}
			var aSelectedIndices = oTableControlData.controlType === "table" ? oTableControl.getSelectedIndices() : [0];
			var oDetailInfo = this._selectedRowComplexElementsCheck(aSelectedIndices, oTableControl.getBindingContext("structuredDataModel"));
			if (oDetailInfo.bHasNewRows) {
				aErrorMessages.push(sNewRowDeleteConfirm);
			}
			if (oDetailInfo.bHasComplexElements) {
				aErrorMessages.push(sFurtherChidrenText);
			}
			aErrorMessages.push(sDeleteConfrim);
			var sConfirmationMessage = aErrorMessages.join(" \n \n");
			sap.m.MessageBox.confirm(sConfirmationMessage, {
				icon: sap.m.MessageBox.Icon.WARNING,
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				emphasizedAction: sap.m.MessageBox.Action.YES,
				onClose: function (oAction) {
					if (oAction === "YES") {
						this._deleteRows(oTableControl);
					}
				}.bind(this)
			});
			// }

		},

		_selectedRowComplexElementsCheck: function (aSelectedIndices, oTableControlContext) {
			var oTableData = oTableControlContext.getObject();
			var oDetails = {
				bHasComplexElements: false,
				bHasNewRows: false
			};
			aSelectedIndices.forEach(function (iSelectedIdx) {
				var aRowKeys = Object.keys(oTableData.data[iSelectedIdx]);
				if (oTableData.data[iSelectedIdx]['S' + oTableData.ElementId].ChangeIndicator === "CM") {
					oDetails.bHasNewRows = true;
				}
				if (aRowKeys.join("").indexOf("_Children") > -1) {
					oDetails.bHasComplexElements = true;
					aRowKeys.forEach(function (sRowKey) {
						if (sRowKey.indexOf("_Children") > -1) {
							var sKey = sRowKey.split("_")[0];
							oTableData.data[iSelectedIdx][sKey].RowCount = 0;
						}
					});
				}
			}.bind(this));
			if (oDetails.bHasComplexElements) {
				if (oTableControlContext.getPath().indexOf("_Children") === -1) {
					this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.OneColumn);
				} else {
					this.oFlexibleColumnLayout.setLayout(sap.f.LayoutType.TwoColumnsBeginExpanded);
				}
			}
			return oDetails;
		},

		_deleteRows: function (oTableControl) {
			this._saveCurrentChanges("delete", oTableControl);
			// var oModel = this.getView().getModel();
			// oModel.setDeferredGroups(["saveDocument"]);
			// this._documentUpdateCall();
			// //Getting selected rows keys
			// // var oTableControl = oEvent.getSource().getParent().getParent();
			// var oTableControlData = oTableControl.getBindingContext("structuredDataModel").getObject();
			// var aSelectedIndices = oTableControlData.controlType === "table" ? oTableControl.getSelectedIndices() : [0];
			// // var aSelectedKeys = [];

			// BusyIndicator.show(0);
			// aSelectedIndices.forEach(function (iIndex) {
			// 	var oContainerData = oTableControlData.data[iIndex]['S' + oTableControlData.ElementId];
			// 	// aSelectedKeys.push(oRowData.Key);
			// 	// If the chanage indicator is not DM/CD (Deleted Manually/Created and Delete) then do fire delete
			// 	if (["DM", "CD"].indexOf(oContainerData.ChangeIndicator) === -1) {
			// 		oModel.remove("/GeneratedDocumentDataSet(guid'" + oContainerData.Key + "')", {
			// 			groupId: "saveDocument",
			// 			merge: false
			// 		});
			// 	}
			// });
			// var oDocModel = this.getView().getModel("DocumentData");
			// oModel.submitChanges({
			// 	groupId: "saveDocument",
			// 	success: jQuery.proxy(function (oResponse, oData) {
			// 		BusyIndicator.hide();
			// 		var oBatchResponse = oResponse.__batchResponses[0];
			// 		var aChangeResponse = oBatchResponse.__changeResponses;
			// 		if (aChangeResponse !== undefined) {
			// 			// Updating etag value
			// 			oDocModel.setProperty("/__metadata/etag", aChangeResponse[0].headers.etag);
			// 			oDocModel.setProperty("/Status", Constants.EDITING_IN_PROCESS);
			// 			// this._prepareGeneratedDataAndAddNewRow(aChangeResponse, oVbox).bind(this);
			// 			sap.m.MessageToast.show(this.getResourceBundle().getText("xtit.rowDeleteSuccessMessage"));
			// 			//update table seq nos Change indicator  
			// 			var aToBeRemovedIndices = [];
			// 			for (var idx = 0; idx < aSelectedIndices.length; idx++) {
			// 				var oContainerData = oTableControlData.data[aSelectedIndices[idx]]['S' + oTableControlData.ElementId];
			// 				if (oContainerData.ChangeIndicator === "CM") { // TODO check this case for a newly added row and start displaying in form
			// 					aToBeRemovedIndices.push(aSelectedIndices[idx]);
			// 				} else {
			// 					oContainerData.ChangeIndicator = "DM";
			// 				}
			// 			}

			// 			//Updating totals row
			// 			if (oTableControlData.hasTotalRow) {
			// 				for (var idx = 0; idx < aSelectedIndices.length; idx++) {
			// 					var oRowData = oTableControlData.data[aSelectedIndices[idx]];
			// 					oTableControlData.AmountElementId.forEach(function (sAmountElementId) {
			// 						if (oRowData["E" + sAmountElementId + "_Currency"].displayValue === oTableControlData.totalRow["E" + sAmountElementId +
			// 								"_Currency"].displayValue) {
			// 							this._updateTotalsAfterCalculation(oTableControlData.totalRow, oRowData["E" + sAmountElementId], "minus");
			// 						}
			// 					}.bind(this));
			// 				}
			// 			}

			// 			// Reverse the array, so that the deleteing will not have index issues.
			// 			aToBeRemovedIndices = aToBeRemovedIndices.reverse();
			// 			// Removing the CM data from table
			// 			aToBeRemovedIndices.forEach(function (iIndex) {
			// 				oTableControlData.data.splice(iIndex, 1);
			// 			});

			// 			if (oTableControlData.controlType === "table") {
			// 				// Updating the display value of seq no after deleting CM records.
			// 				oTableControlData.data.forEach(function (oData, idx) {
			// 					if (oData['S' + oTableControlData.ElementId]) { // Totals row doesn't have seq. no 
			// 						oData['S' + oTableControlData.ElementId].displayValue = idx + 1;
			// 					}
			// 				});
			// 				oTableControlData.rowCount = (oTableControlData.rowCount - aToBeRemovedIndices.length);
			// 				oTableControl.setSelectedIndex(-1);
			// 			} else { // For Form control update the node change indicator.
			// 				this._updateChangeIndicator(oTableControlData.data[0].data, "DM");
			// 				oTableControlData.ChangeIndicator = "DM";
			// 			}
			// 			this.getView().getModel("structuredDataModel").checkUpdate();
			// 		} else {
			// 			this._displayErrorForUndefinedChangeResponse(oBatchResponse);
			// 		}
			// 	}, this),
			// 	error: jQuery.proxy(function (oError) {
			// 		if (oTableControlData.controlType === "table") {
			// 			oTableControl.setSelectedIndex(-1);
			// 		}
			// 		BusyIndicator.hide();
			// 		MessageHandler.showErrorMessage(oError);
			// 	}, this)
			// });
		},

		_updateChangeIndicator: function (aFormData, sIndicator) {
			aFormData.forEach(function (oFormData) {
				oFormData.ChangeIndicator = sIndicator;
				oFormData.attributes.forEach(function (oAttributeData) {
					oAttributeData.ChangeIndicator = sIndicator;
				});
			});
		},

		unDoDelete: function (oEvent) {
			this._saveCurrentChanges("undo", oEvent.getSource().getParent().getParent());
			// var oModel = this.getView().getModel();
			// oModel.setDeferredGroups(["saveDocument"]);
			// this._documentUpdateCall();
			// var oTableControl = oEvent.getSource().getParent().getParent();
			// var oTableControlData = oTableControl.getBindingContext("structuredDataModel").getObject();
			// var aSelectedIndices = oTableControlData.controlType === "table" ? oTableControl.getSelectedIndices() : [0];

			// BusyIndicator.show(0);
			// aSelectedIndices.forEach(function (iIndex) {
			// 	var oContainerData = oTableControlData.data[iIndex]['S' + oTableControlData.ElementId];
			// 	// update the change indicator to UD for undo delete
			// 	oContainerData.ChangeIndicator = "UD";
			// 	this._createBatchItemRequest(oModel, oContainerData);
			// }.bind(this));
			// var oDocModel = this.getView().getModel("DocumentData");
			// oModel.submitChanges({
			// 	groupId: "saveDocument",
			// 	success: jQuery.proxy(function (oResponse, oData) {
			// 		BusyIndicator.hide();
			// 		var oBatchResponse = oResponse.__batchResponses[0];
			// 		var aChangeResponse = oBatchResponse.__changeResponses;
			// 		if (aChangeResponse !== undefined) {
			// 			// Updating etag value
			// 			oDocModel.setProperty("/__metadata/etag", aChangeResponse[0].headers.etag);
			// 			oDocModel.setProperty("/Status", Constants.EDITING_IN_PROCESS);
			// 			// this._prepareGeneratedDataAndAddNewRow(aChangeResponse, oVbox).bind(this);
			// 			sap.m.MessageToast.show(this.getResourceBundle().getText("xtit.rowUndoDeleteSuccessMessage"));
			// 			// aSelectedIndices.forEach
			// 			for (var idx = 0; idx < aSelectedIndices.length; idx++) {
			// 				var oContainerData = oTableControlData.data[aSelectedIndices[idx]]['S' + oTableControlData.ElementId];
			// 				oContainerData.ChangeIndicator = "UD";

			// 				//Updating totals row
			// 				if (oTableControlData.hasTotalRow) {
			// 					var oRowData = oTableControlData.data[aSelectedIndices[idx]];
			// 					oTableControlData.AmountElementId.forEach(function (sAmountElementId) {
			// 						if (oRowData["E" + sAmountElementId + "_Currency"].displayValue === oTableControlData.totalRow["E" + sAmountElementId +
			// 								"_Currency"].displayValue) {
			// 							this._updateTotalsAfterCalculation(oTableControlData.totalRow, oRowData["E" + sAmountElementId], "add");
			// 						}
			// 					}.bind(this));
			// 				}
			// 			}
			// 			if (oTableControlData.controlType === "table") {
			// 				oTableControl.setSelectedIndex(-1);
			// 			} else { // For Form control update the node change indicator.
			// 				this._updateChangeIndicator(oTableControlData.data[0].data, "UD");
			// 				oTableControlData.ChangeIndicator = "UD";
			// 			}
			// 			this.getView().getModel("structuredDataModel").checkUpdate();
			// 		} else {
			// 			this._displayErrorForUndefinedChangeResponse(oBatchResponse);
			// 		}
			// 	}, this),
			// 	error: jQuery.proxy(function (oError) {
			// 		if (oTableControlData.controlType === "table") {
			// 			oTableControl.setSelectedIndex(-1);
			// 		}
			// 		BusyIndicator.hide();
			// 		MessageHandler.showErrorMessage(oError);
			// 	}, this)
			// });
		},

		_saveCurrentChanges: function (sSource, oSource, bKeepDialog) {
			var oPromise = new Promise(function (resolve, reject) {
				var aErrorMessages = this.getView().getModel("messageModel").getData();
				//Skip incase of error/warning feature.
				if (!this._isBetaVersion("ErrorWarning")) {
					if (aErrorMessages.length > 0) {
						this.showMessagePopover("onSave");
						return;
					}
				}
				var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
				var aChangedElements = oGlobalVariablesModel.getProperty("/aChangedElements");
				//Update ReportRunDocumentSet
				var oModel = this.getView().getModel();
				if (aChangedElements.length === 0 && sSource === 'save') {
					sap.m.MessageBox.information(this.getResourceBundle().getText("xmsg.visualization.noChangesToSave"));
					return;
				}
				oModel.setDeferredGroups(["readDocument", "saveDocument"]);
				this._documentUpdateCall();
				//Update GeneratedDocumentDataSet
				this._createSaveBatch(oModel, aChangedElements, sSource);

				switch (sSource) {
				case "add": //Create Add payload
					this._createAddBatch(oModel);
					break;
				case "delete": // Create delete and undo delete payload
				case "undo":
					this._createDeleteandUndoDeleteBatch(oModel, oSource, sSource);
					break;
				}
				var oDocModel = this.getView().getModel("DocumentData");
				oModel.submitChanges({
					groupId: "saveDocument",
					success: jQuery.proxy(function (oResponse, oData) {
						var oBatchResponse = oResponse.__batchResponses[0];
						var aChangeResponse = oBatchResponse.__changeResponses;
						if (aChangeResponse !== undefined) { // Check for valid responses and update the screen accordingly 
							// Updating etag value
							oDocModel.setProperty("/__metadata/etag", aChangeResponse[0].headers.etag);
							oDocModel.setProperty("/Status", Constants.EDITING_IN_PROCESS);
							switch (sSource) {
							case "save": // On Save action
								this._saveSuccess(oGlobalVariablesModel, oResponse);
								break;
							case "regenerate": //On Regenerate action
								this._regenerate();
								break;
							case "add": //Create Add payload
								this._addSuccess(aChangeResponse, bKeepDialog);
								break;
							case "delete": // Create delete and undo delete payload
							case "undo":
								this._deleteandUndoSuccess(oSource, sSource);
								break;
							}
						} else {
							this._displayErrorForUndefinedChangeResponse(oBatchResponse);
						}
						// Clear changed elements array as for both success and etag error previous changes are not relevant
						this._clearChangedElements(oGlobalVariablesModel, aChangedElements, sSource);
						resolve();
					}, this),
					error: jQuery.proxy(function (oError) {
						MessageHandler.showErrorMessage(oError);
					}, this)
				});
			}.bind(this));
			return oPromise;
		},

		_createSaveBatch: function (oModel, aChangedElements, sSource) {
			aChangedElements.forEach(function (oElement) {
				var oChangedElement = oElement.dataObj;
				// Ignoring table total obj, if exists
				if (!oChangedElement.isTotalObj) {
					this._createBatchItemRequest(oModel, oChangedElement);
				}
			}.bind(this));
		},

		_createAddBatch: function (oModel) {
			var oVbox = sap.ui.getCore().byId("addRowContainer");
			var oStructuredDataModel = this.getView().getModel("structuredDataModel");
			var oTableCxtData = oVbox.getBindingContext("structuredDataModel").getObject();
			var aNewRowData = oTableCxtData.NewRowContext[0].data[0].data;
			var oPositionFld = oVbox.getItems()[0].getContent()[0].getFormContainers()[0].getFormElements()[0].getFields()[0].getItems()[0].getItems()[
				0];
			if (oPositionFld.getValueState() === "Error") {
				oPositionFld.focus();
				return;
			}
			var oParamData = this.getView().getModel("paramModel").getData();

			aNewRowData.forEach(function (oNewCell, idx) {
				if (!oNewCell.hasChildren) {
					this._prepareBatchRequestForNewRow(oParamData, oNewCell, oModel, idx, oTableCxtData);
					oNewCell.attributes.forEach(function (oAttribute) {
						this._prepareBatchRequestForNewRow(oParamData, oAttribute, oModel, 1, oTableCxtData);
					}.bind(this));
					if (oTableCxtData.AmountElementId.indexOf(oNewCell.ElementId) !== -1 && oTableCxtData.ReferenceId.indexOf(oNewCell.ReferenceElementId) ===
						-1) {
						oTableCxtData.ReferenceId = oTableCxtData.ReferenceId + oNewCell.ReferenceElementId;
						this._prepareBatchRequestForNewRow(oParamData, oNewCell.currencyData, oModel, idx, oTableCxtData);
					}
				}
			}.bind(this));
			// oTableCxtData.AmountElementId.forEach(function (sAmountElementId) {
			// 	aNewRowData.forEach(function (oNewCell, idx) {
			// 		if (oNewCell.ElementId === sAmountElementId && oTableCxtData.ReferenceId.indexOf(oNewCell.ReferenceElementId) === -1) {
			// 			oTableCxtData.ReferenceId = oTableCxtData.ReferenceId + oNewCell.ReferenceElementId;
			// 			this._prepareBatchRequestForNewRow(oParamData, oNewCell.currencyData, oModel, idx, oTableCxtData);
			// 		}
			// 	}.bind(this));
			// }.bind(this));
		},

		_createDeleteandUndoDeleteBatch: function (oModel, oTableControl, sKey) {
			var oTableControlData = oTableControl.getBindingContext("structuredDataModel").getObject();
			//Getting selected rows keys
			var aSelectedIndices = oTableControlData.controlType === "table" ? oTableControl.getSelectedIndices() : [0];

			aSelectedIndices.forEach(function (iIndex) {
				var oContainerData = oTableControlData.data[iIndex]['S' + oTableControlData.ElementId];
				if (sKey === "delete") {
					// If the chanage indicator is not DM/CD (Deleted Manually/Created and Delete) then fire delete
					if (["DM", "CD"].indexOf(oContainerData.ChangeIndicator) === -1) {
						oModel.remove("/GeneratedDocumentDataSet(guid'" + oContainerData.Key + "')", {
							groupId: "saveDocument",
							merge: false
						});
					}
				} else {
					// update the change indicator to UD for undo delete
					oContainerData.ChangeIndicator = "UD";
					this._createBatchItemRequest(oModel, oContainerData);
				}
			}.bind(this));
		},

		_documentUpdateCall: function () {
			var oModel = this.getView().getModel();
			var oDocModel = this.getView().getModel("DocumentData");
			var oDocModelData = oDocModel.getData();
			var sDocPath = "/ReportRunDocumentSet(guid'" + oDocModelData.Key + "')";
			oModel.update(sDocPath, oDocModelData, {
				groupId: "saveDocument",
				merge: false
			});
		},

		_saveSuccess: function (oGlobalVariablesModel, oResponse) {
			var aChangedElements = oGlobalVariablesModel.getProperty("/aChangedElements");
			if (this._isBetaVersion("ErrorWarning")) {
				if (aChangedElements.length > 0) {
					PreviewErrorWarning.handleAfterSaveElementUpdate(oResponse, aChangedElements, this);
				}
				PreviewErrorWarning.getErrorWarningCount(this);
				PreviewErrorWarning.getSelectedNodesFooterLog(this);
			}
			sap.m.MessageToast.show(this.getResourceBundle().getText("xmsg.visualization.saveDocumentSuccess"));
			// Update Changed elements for Tooltip
			this._updatedChangedELementsModifedValues(oGlobalVariablesModel);
		},

		_clearChangedElements: function (oGlobalVariablesModel, aChangedElements, sSource) {
			// Removing newChange flag once it is saved
			aChangedElements.map(function (oChangedElement, idx) {
				oChangedElement.dataObj.newChange = false;
				oChangedElement.dataObj.ChangedByName = sap.ushell.Container.getUser().getId();
			});
			oGlobalVariablesModel.setProperty("/aSavedChanges", aChangedElements);
			oGlobalVariablesModel.setProperty("/aChangedElements", []);
			if (["save", "regenerate"].indexOf(sSource) !== -1) {
				this._updateEditableState();
			}
		},

		_addSuccess: function (aChangeResponse, bKeepDialog) {
			var oVbox = sap.ui.getCore().byId("addRowContainer");
			var oStructuredDataModel = this.getView().getModel("structuredDataModel");
			var oSelectedContext = oVbox.getBindingContext("structuredDataModel").getObject();
			var aNewRowData = oSelectedContext.NewRowContext[0].data[0].data;
			var aNewRowResponseData = [];
			var iNewRowPosition = aNewRowData[0].displayValue;
			oSelectedContext.columns.forEach(function(oColumn){
				aChangeResponse.forEach(function(oChangedElement, idx){
					if(idx > 0 && oChangedElement.data.ElementId === oColumn.ElementId){
						oColumn.FieldVisibilityInd = 'X';
					}
				});
			});
			if(oSelectedContext.filterKey.length > 0){
				oSelectedContext.data = [];
				oSelectedContext.sequenceNumbers = {};
				this.readGeneratedData(oSelectedContext, "", oSelectedContext.selectedHyperLink, false, true);
			} else {
				aChangeResponse.forEach(function (oChangeResp, idx) {
					if (idx !== 0) {
						aNewRowResponseData.push(oChangeResp.data);
					}
				});
				aNewRowResponseData.sort(function (a, b) {
					return Number(a.ElementId) - Number(b.ElementId);
				});

				//Updating totals row
				if (oSelectedContext.hasTotalRow) {
					aNewRowData.forEach(function (oNewCell, idx) {
						if (oSelectedContext.AmountElementId.indexOf(oNewCell.ElementId) !== -1) {
							var oTotals = oSelectedContext.totalRow["E" + oNewCell.ElementId + "_Currency"];
							if (oTotals && oNewCell.currencyData.displayValue === oTotals.displayValue) {
								this._updateTotalsAfterCalculation(oSelectedContext.totalRow, oNewCell, "add");
							} else {
								oSelectedContext.totalRow["E" + oNewCell.ElementId].bShowTotals = false;
							}
						}
					}.bind(this));
					oSelectedContext.data.splice(oSelectedContext.data.length - 1, 1);
				}

				this._ConstructTableData(aNewRowResponseData, oSelectedContext);
				oSelectedContext.rowCount = oSelectedContext.rowCount + 1;
				oSelectedContext.originalRowCount = oSelectedContext.originalRowCount + 1;

				//update table seq nos
				var iLoadedRowsInTable = oSelectedContext.hasTotalRow ? oSelectedContext.data.length - 1 : oSelectedContext.data.length;
				for (var idx = iNewRowPosition; idx < iLoadedRowsInTable; idx++) {
					var oContainerData = oSelectedContext.data[idx]['S' + oSelectedContext.ElementId];
					oContainerData.displayValue = oContainerData.displayValue + 1;
					oContainerData.OrdinalNo = oContainerData.displayValue;
				}
			}

			if (!bKeepDialog) {
				delete oSelectedContext.NewRowContext;
				this._oAddRowDialog.close();
			} else {
				oSelectedContext.ReferenceId = "";
				aNewRowData.forEach(function (oCellData, idx) {
					oCellData.displayValue = "";
					if (idx === 0) {
						oCellData.displayValue = iNewRowPosition + 1;
						this.updateConstraints(oSelectedContext.originalRowCount + 1);
					}
					oCellData.attributes.forEach(function (oAttributeData) {
						oAttributeData.displayValue = "";
					});
					if (oCellData.currencyData) {
						oCellData.currencyData.displayValue = "";
					};
				}.bind(this));
			}
			// this._updateHyperLinkCount(oVbox.getBindingContext("structuredDataModel")); //Todo - Phase 2
			sap.m.MessageToast.show(this.getResourceBundle().getText("xtit.newRowSuccessMessage", [oSelectedContext.LabelInfo, iNewRowPosition]));
			oStructuredDataModel.checkUpdate(true);
		},

		_deleteandUndoSuccess: function (oTableControl, sSource) {
			var oTableControlData = oTableControl.getBindingContext("structuredDataModel").getObject();
			var aSelectedIndices = oTableControlData.controlType === "table" ? oTableControl.getSelectedIndices() : [0];
			var sMessageToastText = sSource === "delete" ? "xtit.rowDeleteSuccessMessage" : "xtit.rowUndoDeleteSuccessMessage";
			sap.m.MessageToast.show(this.getResourceBundle().getText(sMessageToastText));
			if (oTableControlData.filterKey.length > 0) {
				oTableControlData.data = [];
				oTableControlData.sequenceNumbers = {};
				this.readGeneratedData(oTableControlData, "", oTableControlData.selectedHyperLink, false, true);
			} else {
				//update table seq nos Change indicator  
				var aToBeRemovedIndices = [];
				for (var idx = 0; idx < aSelectedIndices.length; idx++) {
					var oContainerData = oTableControlData.data[aSelectedIndices[idx]]['S' + oTableControlData.ElementId];
					if (oContainerData.ChangeIndicator === "CM") { // TODO check this case for a newly added row and start displaying in form
						aToBeRemovedIndices.push(aSelectedIndices[idx]);
					} else {
						oContainerData.ChangeIndicator = sSource === "delete" ? "DM" : "UD";
					}
					//Updating totals row
					if (oTableControlData.hasTotalRow) {
						var oRowData = oTableControlData.data[aSelectedIndices[idx]];
						oTableControlData.AmountElementId.forEach(function (sAmountElementId) {
							var oTotals = oTableControlData.totalRow["E" + sAmountElementId + "_Currency"];
							if (oTotals && oRowData["E" + sAmountElementId + "_Currency"].displayValue === oTotals.displayValue) {
								var sOperator = sSource === "delete" ? "minus" : "add";
								this._updateTotalsAfterCalculation(oTableControlData.totalRow, oRowData["E" + sAmountElementId], sOperator);
							}
						}.bind(this));
					}
				}

				// Reverse the array, so that the deleteing will not have index issues.
				aToBeRemovedIndices = aToBeRemovedIndices.reverse();
				// Removing the CM data from table
				aToBeRemovedIndices.forEach(function (iIndex) {
					oTableControlData.data.splice(iIndex, 1);
				});

				if (oTableControlData.controlType === "table") {
					// Updating the display value of seq no after deleting CM records.
					if (aToBeRemovedIndices.length > 0) { // only update  the Seq no if any newly created rows are deleted
						oTableControlData.data.forEach(function (oData, idx) {
							if (oData['S' + oTableControlData.ElementId]) { // Totals row doesn't have seq. no 
								oData['S' + oTableControlData.ElementId].displayValue = idx + 1;
							}
						});
					}
					oTableControlData.rowCount = (oTableControlData.rowCount - aToBeRemovedIndices.length);
					oTableControlData.originalRowCount = oTableControlData.rowCount;
					oTableControl.setSelectedIndex(-1);
				} else { // For Form control update the node change indicator.
					var sNewChangeIndicator = sSource === "delete" ? "DM" : "UD";
					this._updateChangeIndicator(oTableControlData.data[0].data, sNewChangeIndicator);
					oTableControlData.ChangeIndicator = sNewChangeIndicator;
				}
				this.getView().getModel("structuredDataModel").checkUpdate();
			}
		},

		_isBetaVersion: function (sVersion) {
			var bAvailable = false;
			switch (sVersion) {
			case "ChoiceHandling":
			case "Add/Delete":
			case "ErrorWarning":
				var oParamData = this.getView().getModel("paramModel").getData();
				bAvailable = oParamData.repCatId === "DP_WITH_ADD_DELETE" || window.location.href.indexOf("#DataPreview-test") !== -1;
				break;
			}
			// return bAvailable;
			return true;
		},

		// generateChoiceName: function (oChoiceElement) {
		// 	if (oChoiceElement.CollectionType !== "C")
		// 		return;
		// 	var aChoiceChild = [];
		// 	if (oChoiceElement.children.length > 0 && oChoiceElement.children.length < 3) {
		// 		for (var i in oChoiceElement.children) {
		// 			var sLabel = oChoiceElement.children[i].LabelInfo;
		// 			if (sLabel !== "") {
		// 				aChoiceChild.push(sLabel);
		// 			}
		// 		}
		// 	}
		// 	return aChoiceChild.length > 0 ? aChoiceChild.join("/") : this.getResourceBundle().getText("choiceElementLabel");
		// },
		generateChoiceElementName: function (oElement, oParentElement, iIndex) {
			if (oElement.LabelInfo) { // No need to cook up names, when an anonymous element has label maintained 
				return;
			}

			if (oElement.CollectionType === "C") { // Choice Element
				var aChoiceChild = [];
				if (oElement.children.length > 0 && oElement.children.length < 3) {
					for (var i in oElement.children) {
						var sLabel = oElement.children[i].LabelInfo;
						if (sLabel !== "") {
							aChoiceChild.push(sLabel);
						}
					}
				}
				oElement.LabelInfo = aChoiceChild.length > 0 ? aChoiceChild.join("/") : this.getResourceBundle().getText("choiceElementLabel", [iIndex]);
				return;
			}

			if (oParentElement.CollectionType === "C") { // Immediate childen of a Choice Element
				oElement.LabelInfo = this.getResourceBundle().getText("choices", [iIndex + 1]);
				return;
			}
		},
		// further children of choice should not be displayed in the hierarchy
		applyHierarchyFilter: function (oEvent) {
			var oTree = oEvent.getSource();
			var oItems = oTree.getBinding("items");
			if (oItems.getFilterInfo() === null) {
				oItems.filter([new sap.ui.model.Filter("isChoiceBranch", sap.ui.model.FilterOperator.EQ, false)]);
			}
		},

		formatErrorCount: function (iCount, sType) {
			if (!iCount || !sType) { //If the count is zero, don't show the message count in UI
				return "";
			}
			var enumErrorWarning = {
				"EM": "xtxt.errorMultiple",
				"WM": "xtxt.warningMultiple",
				"ES": "xtxt.errorSingle",
				"WS": "xtxt.warningSingle"
			};
			var sMessageKey = enumErrorWarning[sType + "" + (iCount === 1 ? "S" : "M")];
			return this.getModel("i18n").getResourceBundle().getText(sMessageKey, [iCount]);
		},

		isElementChildOfGivenParent: function (sElementId, sParentElementId) {
			var oChildById = this.getView().getModel("MetadataById").getProperty("/childById");
			var bIsChild = false;
			var aCurrentChildren = oChildById[sParentElementId];
			if (sElementId === sParentElementId) {
				return true;
			}
			for (var i in aCurrentChildren) {
				bIsChild = this.isElementChildOfGivenParent(sElementId, aCurrentChildren[i]);
				if (bIsChild)
					return bIsChild;
			}
			return bIsChild;
		},

		// Check if there's any manual adjustment made. First save changes & then proceed with fetch.
		checkChangedElementsBeforeAction: function (fnCallback) {
			var oGlobalVariablesModel = this.getView().getModel("GlobalVariables");
			var aChangedElements = oGlobalVariablesModel.getProperty("/aChangedElements"); // Check if there's any manual adjustment made. First save changes & then proceed with fetch.
			if (aChangedElements.length > 0) {
				var oPromiseSave = this.onSavePress();
				oPromiseSave.then(function () {
					fnCallback();
				}.bind(this));
			} else {
				fnCallback();
			}
		},

		/*_handleNewRowFieldChange: function(oCtx){
			var aNewRowFields = oCtx.getObject();
			var oGlobalVariableModel = this.getView().getModel("GlobalVariables");
		}*/
	});
});