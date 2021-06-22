sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"./Common",
	"sap/ui/test/matchers/AggregationFilled",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/ui/test/matchers/BindingPath",
	"sap/ui/test/matchers/Ancestor"
], function (Opa5, Press, Common, AggregationFilled, PropertyStrictEquals, BindingPath, Ancestor) {
	"use strict";

	var sViewName = "Detail";

	Opa5.createPageObjects({
		onTheDetailPage: {

			baseClass: Common,

			actions: {

				iPressTheHeaderActionButton: function (sId) {
					return this.waitFor({
						id: sId,
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Did not find the button with id" + sId + " on detail page"
					});
				}
			},

			assertions: {

				iShouldSeeTheRememberedObject: function () {
					return this.waitFor({
						success: function () {
							var sBindingPath = this.getContext().currentItem.bindingPath;
							return this.waitFor({
								id: "detailPage",
								viewName: sViewName,
								matchers: new BindingPath({
									path: sBindingPath
								}),
								success: function (oPage) {
									Opa5.assert.ok(true, "Should land on detail page for remembered item");
								},
								errorMessage: "Detail page is not for remembered item with binding path " + sBindingPath
							});
						}
					});
				},

				iShouldSeeTheObjectLineItemsList: function () {
					return this.waitFor({
						id: "lineItemsList",
						viewName: sViewName,
						success: function (oList) {
							Opa5.assert.ok(oList, "Found the line items list.");
						}
					});
				},
				theLineItemsListShouldHaveTheCorrectNumberOfItems: function () {
					return this.waitFor({
						id: "lineItemsList",
						viewName: sViewName,
						check: function (oList) {
							var aEntitySet = this.getEntitySet("ToSupplier");
							var sObjectID = oList.getBindingContext().getProperty("ProductID");
							var iLength = aEntitySet.filter(function (oLineItem) {
								return oLineItem.ProductID === sObjectID;
							}).length;

							return oList.getItems().length === iLength;
						},
						errorMessage: "The list does not have the correct number of items.\nHint: This test needs suitable mock data in localService directory which can be generated via SAP Web IDE"
					});
				},

				theDetailViewShouldContainOnlyFormattedUnitNumbers: function () {
					return this.theUnitNumbersShouldHaveTwoDecimals("sap.m.ObjectNumber",
						sViewName,
						"Object numbers are properly formatted",
						"Object view has no entries which can be checked for their formatting");
				},

				theLineItemsHeaderShouldDisplayTheAmountOfEntries: function () {
					return this.waitFor({
						id: "lineItemsList",
						viewName: sViewName,
						matchers: new AggregationFilled({
							name: "items"
						}),
						success: function (oList) {
							var iNumberOfItems = oList.getItems().length;
							return this.waitFor({
								id: "lineItemsTitle",
								viewName: sViewName,
								matchers: new PropertyStrictEquals({
									name: "text",
									value: "<ToSupplierPlural> (" + iNumberOfItems + ")"
								}),
								success: function () {
									Opa5.assert.ok(true, "The line item list displays " + iNumberOfItems + " items");
								},
								errorMessage: "The line item list does not display " + iNumberOfItems + " items."
							});
						},
						errorMessage: "The line item list 'lineItemsList' is not displayed"
					});
				},
				iShouldSeeHeaderActionButtons: function () {
					return this.waitFor({
						id: ["closeColumn", "enterFullScreen"],
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "The action buttons are visible");
						},
						errorMessage: "The action buttons were not found"
					});
				},

				iShouldSeeTheFullScreenToggleButton: function (sId) {
					return this.waitFor({
						id: sId,
						viewName: sViewName,
						errorMessage: "The toggle button" + sId + "was not found"
					});
				}

			}

		}

	});

});
