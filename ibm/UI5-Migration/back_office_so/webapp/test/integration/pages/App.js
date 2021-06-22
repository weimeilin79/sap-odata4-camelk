sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/PropertyStrictEquals"
], function (Opa5, PropertyStrictEquals) {
	"use strict";

	Opa5.createPageObjects({
		onTheAppPage: {

			actions: {

				iCloseTheMessageBox: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						id: "serviceErrorMessageBox",
						success: function (oMessageBox) {
							oMessageBox.destroy();
							Opa5.assert.ok(true, "The MessageBox was closed");
						}
					});
				}
			},

			assertions: {

				iShouldSeeTheMessageBox: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						id: "serviceErrorMessageBox",
						success: function () {
							Opa5.assert.ok(true, "The correct MessageBox was shown");
						}
					});
				},

				theAppShowsFCLDesign: function (sLayout) {
					return this.waitFor({
						id: "layout",
						viewName: "App",
						matchers: new PropertyStrictEquals({
							name: "layout",
							value: sLayout
						}),
						success: function () {
							Opa5.assert.ok(true, "the app shows " + sLayout + " layout");
						},
						errorMessage: "The app does not show " + sLayout + " layout"
					});
				}

			}

		}

	});

});
