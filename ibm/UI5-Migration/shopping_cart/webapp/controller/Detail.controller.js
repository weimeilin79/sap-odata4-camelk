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

	return BaseController.extend("socreation_test.SO_Create.controller.Detail", {

		formatter: formatter,
		currentSelectedObj: null,
		cartObjects: [],
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

			// this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
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
				var sObjectPath = this.getModel().createKey("ProductSet", {
					ProductID: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));

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
			// return
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
				sObjectId = oObject.ProductID,
				sObjectName = oObject.Name,
				oViewModel = this.getModel("detailView");

			console.log(oObject)
			this.currentSelectedObj = oObject
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			// oViewModel.setProperty("/shareSendEmailSubject",
			// 	oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			// oViewModel.setProperty("/shareSendEmailMessage",
			// 	oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
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
		onAddToCart: function (oEvent) {

			this.cartObjects.push(this.currentSelectedObj)
			console.log(this.cartObjects);

			this.getModel("utilModel").setProperty("/cartItems", this.cartObjects);

			MessageBox.show(
				"Item : " + this.currentSelectedObj.Name + " has been Added to Cart", {
					icon: MessageBox.Icon.INFORMATION,
					title: "Item Added to Cart",
					actions: [MessageBox.Action.OK],
					emphasizedAction: MessageBox.Action.OK,
					onClose: function (oAction) {

					}
				}
			);

		},

		onCheckoutOkClick: function (oEvent) {

			var that = this;
			console.log(this.cartObjects);
			// return;
			var oModel = this.getView().getModel();
			var oCData = {

				"CustomerName": "SAP",
				"CustomerID": "0100000000",
				"LifecycleStatus": "N",
				"NoteLanguage": "EN",
				"CurrencyCode": "EUR"

			};

			BusyIndicator.show();
			oModel.create("/SalesOrderSet", oCData, {
				success: function (oDataRsp) {

					console.log(oDataRsp);
					BusyIndicator.hide();
					that.oConfirmDialog.close();

					MessageBox.show(
						"Sale Order has been Created Successfully with SO ID : " + oDataRsp.SalesOrderID, {
							icon: MessageBox.Icon.INFORMATION,
							title: "SO created",
							actions: [MessageBox.Action.OK],
							emphasizedAction: MessageBox.Action.OK,
							onClose: function (oAction) {

							}
						}
					);

					that.addSoLineItem(oDataRsp);

				},
				error: function (oDataErr) {
					console.log(oDataErr);

					MessageBox.show(
						"Sale Order can Not to created, Please try again", {
							icon: MessageBox.Icon.INFORMATION,
							title: "SO creation Error",
							actions: [MessageBox.Action.OK],
							emphasizedAction: MessageBox.Action.OK,
							onClose: function (oAction) {

							}
						}
					);

					BusyIndicator.hide();
				}
			});

			// this.cartObjects.push(this.currentSelectedObj)
			console.log(this.cartObjects);

		},

		addSoLineItem: function (oSalesOreder) {
			var oModel = this.getView().getModel();
			oModel.setDeferredGroups(["CreateSoLineItem"]);
			this.cartObjects.forEach(function (obj, idx) {

				var soItem = {

					"SalesOrderID": oSalesOreder.SalesOrderID,
					"ItemPosition": "00000000" + (idx + 1) + "0",
					"ProductID": obj.ProductID,
					"Note": obj.Name,
					"CurrencyCode": obj.CurrencyCode,
					"GrossAmount": obj.Price,
					"NetAmount": obj.Price,
					"TaxAmount": obj.Price,
					"DeliveryDate": new Date(),
					"Quantity": "1",
					"QuantityUnit": obj.DimUnit

				}

				// console.log(soItem)
				oModel.create("/SalesOrderLineItemSet", soItem, {
					groupId: "CreateSoLineItem",
					success: $.proxy(function (observData) {

					}, this),
					error: $.proxy(function () {

					}, this)

				})

			});
			oModel.submitChanges({
				groupId: "CreateSoLineItem",
				success: $.proxy(function (oResp) {
					console.log("ProxySess Changes Submit");
					console.log(oResp);
					console.log(oResp.__batchResponses[0])

					this.getModel("utilModel").setProperty("/cartItems", "");
					this.cartObjects = [];

					this.sendPushMsg(oResp.__batchResponses[0].__changeResponses[0].data.SalesOrderID)	



				}, this),
				error: $.proxy(function () {
					console.log("Proxy Error Changes Submit")
				}, this)
			});

		},

		displayCart: function () {

			// this.cartObjects.push(this.currentSelectedObj);

			if (this.cartObjects.length === 0) {

				MessageBox.show(
					"Shoping Cart is Empty", {
						icon: MessageBox.Icon.INFORMATION,
						title: "Empty Cart",
						actions: [MessageBox.Action.OK],
						emphasizedAction: MessageBox.Action.OK,
						onClose: function (oAction) {

						}
					}
				);

				return;
			}

			if (!this.oConfirmDialog) {

				this.oConfirmDialog = sap.ui.xmlfragment("cartItemDialog", "socreation_test.SO_Create.view.fragments.displaycart", this);
				// }
				this.getView().addDependent(this.oConfirmDialog);
			}

			this.oConfirmDialog.open();
			// this.oConfirmDialog.setBusy(true);
		},
		onCheckoutCancelClick: function (oEvent) {
			this.oConfirmDialog.close();

			// $.ajax('http://credit-check-ibm.apps.cluster-ef85.dynamic.opentlc.com/creditcheck', 
			// {
				
			// 	success: function (data,status,xhr) {   // success callback function
			// 		console.log(data)
			// 	},
			// 	error: function ( errorMessage) { // error callback 
			// 		console.log(errorMessage)
			// 	}
			// });



		},
		onAvatarPress:function(){
			
				MessageBox.information("Name  :  SAP.\n CustomerID: 0100000000 ");
		},
		sendPushMsg:function(createdSOId){


			// var createdSoPushPayload={
			// 	"records": [
			// 	  {
			// 		"key": "50000231",
			// 		"value": { "SO": {"example":"test"}, "PO": {"example":"test"}}
			// 	  }
			// 	]
			//   }
			

			//Sending to For Approval to Approver App
			var payloadReq = {
				"records": [
				  {
					"key": createdSOId,
					"value": { "SO": {"REQ":"Created"}}
				  }
				]
			  };

			  var strpayloadReq = JSON.stringify(payloadReq);
			  console.log(strpayloadReq)
			$.ajax({
					type: "POST",
					processData:'false',
					data: strpayloadReq,
					url: 'http://kafka-bridge-ibm.apps.cluster-ef85.dynamic.opentlc.com/topics/so-request',
					contentType : "application/vnd.kafka.json.v2+json",
					success: function(resp){
						console.log("success..........");
						console.log(resp)
					},
					error:function(errr){
						console.log("Errr");
						console.log(errr)
					}
					
				});


		}

	});

});