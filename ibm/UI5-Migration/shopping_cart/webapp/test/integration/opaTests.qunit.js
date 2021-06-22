/* global QUnit */

QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"socreation_test/SO_Create/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
