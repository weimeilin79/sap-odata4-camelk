/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"SO_Approval/SO_Approval/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});