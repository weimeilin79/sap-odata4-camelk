sap.ui.define([
	"sap/ui/test/Opa5"
], function (Opa5) {
	"use strict";

	Opa5.createPageObjects({
		onTheBrowserPage: {

			actions: {

				iChangeTheHashToTheRememberedItem: function () {
					return this.waitFor({
						success: function () {
							var sObjectId = this.getContext().currentItem.id;
							Opa5.getHashChanger().setHash("/ProductSet/" + sObjectId);
						}
					});
				},

				iChangeTheHashToSomethingInvalid: function () {
					return this.waitFor({
						success: function () {
							Opa5.getHashChanger().setHash("/somethingInvalid");
						}
					});
				}

			},

			assertions: {

				iShouldSeeTheHashForTheRememberedObject: function () {
					return this.waitFor({
						success: function () {
							var sObjectId = this.getContext().currentItem.id,
								oHashChanger = Opa5.getHashChanger(),
								sHash = oHashChanger.getHash();
							Opa5.assert.strictEqual(sHash, "ProductSet/" + sObjectId, "The Hash is not correct");
						}
					});
				},

				iShouldSeeAnEmptyHash: function () {
					return this.waitFor({
						success: function () {
							var oHashChanger = Opa5.getHashChanger(),
								sHash = oHashChanger.getHash();
							Opa5.assert.strictEqual(sHash, "", "The Hash should be empty");
						},
						errorMessage: "The Hash is not Correct!"
					});
				}

			}

		}

	});

});
