/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"soapproved/SO_APPROVED_LIST_Details/test/integration/PhoneJourneys"
	], function () {
		QUnit.start();
	});
});
