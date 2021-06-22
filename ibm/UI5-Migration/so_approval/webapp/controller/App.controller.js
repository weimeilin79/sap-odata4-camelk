sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("SO_Approval.SO_Approval.controller.App", {

		onInit: function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();
			// var url = "https://sapes5.sapdevcenter.com/sap/bc/gui/sap/its/webgui/Product$format=json";
			// // $.response.headers.set("Access-Control-Allow-Origin", "*");
			// // $.response.status = $.net.http.OK;
			// $.ajax({
			// 	headers:{"Access-Control-Allow-Origin" : "*","status" :  "OK"},
			// 	type: "GET",
			// 	url: url,
			// 	dataType: "json",
			// 	crossDomain: true,
			// 	contentType: "application/json",
			// 	username: "P1940167798",
			// 	password: "Vicky#231101@",

			// 	success: function (result) {
			// 		console.log(result);
			// 	},
			// 	error: function (response) {}
			// });

			// // var oModel = this.getOwnerComponent().getModel();
			// // oModel.read("/Product",function(resp){

			oViewModel = new JSONModel({
				busy: true,
				delay: 0,
				layout: "OneColumn",
				previousLayout: "",
				actionButtonsInfo: {
					midColumn: {
						fullScreen: false
					}
				}
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function () {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// since then() has no "reject"-path attach to the MetadataFailed-Event to disable the busy indicator in case of an error
			this.getOwnerComponent().getModel().metadataLoaded().then(fnSetAppNotBusy);
			this.getOwnerComponent().getModel().attachMetadataFailed(
				fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
		}

	});
});