sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/matchers/I18NText",
	"sap/ui/test/actions/Press",
	"sap/ui/test/matchers/PropertyStrictEquals"
], function (Opa5, I18NText, Press, PropertyStrictEquals) {
	"use strict";

	var sNotFoundPageId = "page",
		sNotFoundView = "NotFound",
		sDetailNotFoundView = "DetailObjectNotFound";

	Opa5.createPageObjects({
		onTheNotFoundPage: {

			actions: {},

			assertions: {

				iShouldSeeTheNotFoundGeneralPage: function (sPageViewName) {
					return this.waitFor({
						controlType: "sap.m.MessagePage",
						viewName: sPageViewName,
						success: function () {
							Opa5.assert.ok(true, "Shows the message page");
						},
						errorMessage: "Did not reach the empty page"
					});
				},

				iShouldSeeTheNotFoundPage: function () {
					return this.iShouldSeeTheNotFoundGeneralPage(sNotFoundView);
				},

				iShouldSeeTheObjectNotFoundPage: function () {
					return this.iShouldSeeTheNotFoundGeneralPage(sDetailNotFoundView);
				},

				theNotFoundPageShouldSayResourceNotFound: function () {
					return this.waitFor({
						id: sNotFoundPageId,
						viewName: sNotFoundView,
						matchers: [
							new I18NText({
								key: "notFoundTitle",
								propertyName: "title"
							}),
							new I18NText({
								key: "notFoundText",
								propertyName: "text"
							})
						],
						errorMessage: "Did not display the resource not found text"
					});
				},

				theNotFoundPageShouldSayObjectNotFound: function () {
					return this.waitFor({
						id: sNotFoundPageId,
						viewName: sDetailNotFoundView,
						matchers: new I18NText({
							key: "noObjectFoundText",
							propertyName: "text"
						}),
						errorMessage: "Did not display the object not found text"
					});
				}
			}
		}
	});
});
