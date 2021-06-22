sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	'sap/ui/core/BusyIndicator',
	"sap/m/MessageBox"
], function (BaseController, JSONModel, formatter, mobileLibrary, BusyIndicator, MessageBox) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("SO_Approval.SO_Approval.controller.Detail", {

		formatter: formatter,
		selectedSO: null,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onSendEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("SalesOrderSet", {
					SalesOrderID: sObjectId
				});
				this._bindView("/" + sObjectPath);
				console.log(sObjectPath);
			}.bind(this));


			var oUtilJsonModel = this.getModel("utilModel");
			oUtilJsonModel.setProperty("/approvEnabel", {
				"isEnable": false
			});



		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),

				sObjectId = oObject.SalesOrderID,
				sObjectName = oObject.SalesOrderID,
				oViewModel = this.getModel("detailView");
			console.log(oObject);
			this.selectedSO = oObject
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));

			var oDataModel = oView.getModel();
			var oUtilJsonModel = oView.getModel("utilModel");

			oDataModel.read("/BusinessPartnerSet('" + this.selectedSO.CustomerID + "')", {
				success: function (resp) {
					oUtilJsonModel.setProperty("/bpDetail", resp);
					console.log(resp);
				},
				error: function (resp) {
					console.log(resp);
				}
			});

		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		},
		checkCredit: function (oEvent) {
			// check Credit Method    https://reqres.in/api/users
			var that = this;
			BusyIndicator.show();



			// $.ajax('http://credit-check-ibm.apps.cluster-ef85.dynamic.opentlc.com/creditcheck', 
			// {
				
			// 	success: function (data,status,xhr) {   // success callback function
			// 		console.log(data)
			// 	},
			// 	error: function ( errorMessage) { // error callback 
			// 		console.log(errorMessage)
			// 	}
			// });



			$.ajax({
				url: "creditcheck",
				success: function (result) {
					console.log(result);

					var oUtilJsonModel = that.getModel("utilModel");
					oUtilJsonModel.setProperty("/approvEnabel", {
						"isEnable": true
					});

					BusyIndicator.hide();
					MessageBox.show(
						"Credit check is Approved.", {
							icon: MessageBox.Icon.INFORMATION,
							title: "Credit Check",
							actions: [MessageBox.Action.OK, MessageBox.Action.NO],
							emphasizedAction: MessageBox.Action.OK,
							onClose: function (oAction) {
								/ * do something * /
							}
						}
					);



					var payloadCred = {
						"records": [
						  {
							"key": that.selectedSO.SalesOrderID,
							"value": { "SO_Credit": {"Check":"Approved"}, "PO": {"example":"test"}}
						  }
						]
					  };

					  var strpayload = JSON.stringify(payloadCred);
					  console.log(strpayload)
					$.ajax({
							type: "POST",
							processData:'false',
							data: JSON.stringify(payloadCred),
							url: 'http://kafka-bridge-ibm.apps.cluster-ef85.dynamic.opentlc.com/topics/credit-check',
							contentType : "application/vnd.kafka.json.v2+json",
							success: function(resp){
								console.log("success");
								console.log(resp)
							},
							error:function(errr){
								console.log("success");
								console.log(errr)
							}
							
						});







					

				},
				error: function (err) {
					console.log(err);
					BusyIndicator.hide();
				}
			});
			
			
			// sap.ui.getCore().byId("list").getBinding("items").refresh();
			
			// alert("Check Credit Method To be Called");
		},
		onPressApprove: function () {
			var oModel = this.getView().getModel();
			var that = this;
			if (this.selectedSO.LifecycleStatus === "C") {
				MessageBox.show(
					"This Sale Order is already Closed.", {
						icon: MessageBox.Icon.INFORMATION,
						title: "Already Closed Sales Order",
						actions: [MessageBox.Action.OK, MessageBox.Action.NO],
						emphasizedAction: MessageBox.Action.OK,
						onClose: function (oAction) {
							/ * do something * /
						}
					}
				);
				return
			}
			// var oData = {
			// 		LifecycleStatus: "P",
			// 		LifecycleStatusDescription: "In Progress"
			// }
			// oModel.create("/SalesOrder_Confirm(SalesOrderID='" + this.selectedSO.SalesOrderID + "')", oData, {
			// 	success: function (oDataRsp) {
			// 		console.log(oDataRsp)
			// 	},
			// 	error: function (oDataErr) {
			// 		console.log(oDataErr)
			// 	}
			// });
			BusyIndicator.show();
			oModel.callFunction(
				"/SalesOrder_Confirm", {
					method: "POST",
					urlParameters: {
						SalesOrderID: this.selectedSO.SalesOrderID
					},
					success: function (oData, response) {
						console.log(oData);
						BusyIndicator.hide();

						MessageBox.show(
							"Sale Order "+ that.selectedSO.SalesOrderID+" has been Successfully approved", {
								icon: MessageBox.Icon.INFORMATION,
								title: "Udpated Successfull",
								actions: [MessageBox.Action.OK, MessageBox.Action.NO],
								emphasizedAction: MessageBox.Action.OK,
								onClose: function (oAction) {

								}
							}
						);



						// var masterListID = that.getOwnerComponent().oListSelector._oList.getId();
						// var itm = sap.ui.getCore().byId(masterListID).getItems();
						// // sap.ui.getCore().byId(masterListID).setSelectedItem(itm[0],true);


						// var oEventParam = {
						// 	"item":itm[0],
						// 	"selected": true 
						// }
						// sap.ui.getCore().byId(masterListID).fireSelectionChange(oEventParam);











//Sending to All Approved List App
						var payload = {
							"records": [
							  {
								"key": that.selectedSO.SalesOrderID,
								"value": { "SO": {"example":"test"}, "PO": {"example":"test"}}
							  }
							]
						  };

						  var strpayload = JSON.stringify(payload);
						  console.log(strpayload)
						$.ajax({
								type: "POST",
								processData:'false',
								data: JSON.stringify(payload),
								url: 'http://kafka-bridge-ibm.apps.cluster-ef85.dynamic.opentlc.com/topics/so-approval',
								contentType : "application/vnd.kafka.json.v2+json",
								success: function(resp){
									console.log("success");
									console.log(resp)
								},
								error:function(errr){
									console.log("success");
									console.log(errr)
								}
								
							});

							// http://kafka-bridge-ibm.apps.cluster-ef85.dynamic.opentlc.com/topics/so-request



//Sending to Requester App
							// var payloadReq = {
							// 	"records": [
							// 	  {
							// 		"key": that.selectedSO.SalesOrderID,
							// 		"value": { "SO": {"REQ":"Approve"}}
							// 	  }
							// 	]
							//   };
	
							//   var strpayloadReq = JSON.stringify(payloadReq);
							//   console.log(strpayloadReq)
							// $.ajax({
							// 		type: "POST",
							// 		processData:'false',
							// 		data: strpayloadReq,
							// 		url: 'http://kafka-bridge-ibm.apps.cluster-ef85.dynamic.opentlc.com/topics/so-request',
							// 		contentType : "application/vnd.kafka.json.v2+json",
							// 		success: function(resp){
							// 			console.log("success..........");
							// 			console.log(resp)
							// 		},
							// 		error:function(errr){
							// 			console.log("Errr");
							// 			console.log(errr)
							// 		}
									
							// 	});


					},
					error: function (oError) {
						BusyIndicator.hide();

					}
				});

		},
		onPressReject: function () {


			MessageBox.show(
				"Sale Order has been Rejected Successfully.", {
					icon: MessageBox.Icon.INFORMATION,
					title: "Reject",
					actions: [MessageBox.Action.OK, MessageBox.Action.NO],
					emphasizedAction: MessageBox.Action.OK,
					onClose: function (oAction) {

					}
				}
			);
			
			return;
			var oModel = this.getView().getModel();
			var oCData = {
				"Note": "Test Create",
				"NoteLanguage": "EN",
				"CustomerName": "Test Create2",
				"CustomerID": "0100000000",
				"CurrencyCode": "USD",
				"GrossAmount": "105.85",
				"NetAmount": "1000.15",
				"TaxAmount": "10.10",
				"LifecycleStatus": "N",
				"LifecycleStatusDescription": "New",
				"BillingStatus": "I",
				"BillingStatusDescription": "Initial",
				"DeliveryStatus": "I",
				"DeliveryStatusDescription": "Initial"

			};

			BusyIndicator.show();
			oModel.create("/SalesOrderSet", oCData, {
				success: function (oDataRsp) {
					BusyIndicator.hide();
					MessageBox.show(
						"Sale Order has been Rejected Successfully.", {
							icon: MessageBox.Icon.INFORMATION,
							title: "Reject",
							actions: [MessageBox.Action.OK, MessageBox.Action.NO],
							emphasizedAction: MessageBox.Action.OK,
							onClose: function (oAction) {

							}
						}
					);

				},
				error: function (oDataErr) {
					console.log(oDataErr)
					BusyIndicator.hide();
				}
			});

			alert("Call On onPressReject");
		}
	});

});