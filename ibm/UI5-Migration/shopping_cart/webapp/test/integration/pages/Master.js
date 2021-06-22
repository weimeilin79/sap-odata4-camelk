sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/actions/Press",
	"./Common",
	"sap/ui/test/actions/EnterText",
	"sap/ui/test/matchers/AggregationEmpty",
	"sap/ui/test/matchers/AggregationFilled",
	"sap/ui/test/matchers/PropertyStrictEquals",
	"sap/ui/test/matchers/Ancestor"
], function (Opa5, Press, Common, EnterText, AggregationEmpty, AggregationFilled, PropertyStrictEquals, Ancestor) {
	"use strict";

	var sViewName = "Master",
		sSomethingThatCannotBeFound = "*#-Q@@||";

	Opa5.createPageObjects({
		onTheMasterPage: {

			baseClass: Common,

			actions: {

				iSortTheListOnName: function () {
					return this.iChooseASorter("sortButton", "Sort By <Name>");
				},
				iSortTheListOnUnitNumber: function () {
					return this.iChooseASorter("sortButton", "Sort By <Price>");
				},

				iFilterTheListOnUnitNumber: function () {
					return this.iChooseASorter("filterButton", "<Price>", "<100 <CurrencyCode>");
				},

				iGroupTheList: function () {
					return this.iChooseASorter("groupButton", "<Price> Group");
				},

				iRemoveListGrouping: function () {
					return this.iChooseASorter("groupButton", "None");
				},
				iOpenViewSettingsDialog: function () {
					return this.waitFor({
						id: "filterButton",
						viewName: sViewName,
						actions: new Press(),
						errorMessage: "Did not find the 'filter' button."
					});
				},
				iPressOKInViewSelectionDialog: function () {
					return this.iPressOKButtonInDialog("Did not find the ViewSettingDialog's 'OK' button.");
				},

				iPressResetInViewSelectionDialog: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Button",
						matchers: new PropertyStrictEquals({
							name: "text",
							value: "Reset"
						}),
						actions: new Press(),
						errorMessage: "Did not find the ViewSettingDialog's 'Reset' button."
					});
				},

				iRememberTheSelectedItem: function () {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: function (oList) {
							return oList.getSelectedItem();
						},
						success: function (oListItem) {
							this.iRememberTheListItem(oListItem);
						},
						errorMessage: "The list does not have a selected item so nothing can be remembered"
					});
				},

				iChooseASorter: function (sSelect, sItem, sOption) {
					return this.waitFor({
						id: sSelect,
						viewName: sViewName,
						actions: new Press(),
						success: function () {
							this.waitFor({
								controlType: "sap.m.StandardListItem",
								matchers: new PropertyStrictEquals({
									name: "title",
									value: sItem
								}),
								searchOpenDialogs: true,
								actions: new Press(),
								success: function () {
									if (sOption) {
										return this.waitFor({
											controlType: "sap.m.StandardListItem",
											matchers: new PropertyStrictEquals({
												name: "title",
												value: sOption
											}),
											searchOpenDialogs: true,
											actions: new Press(),
											success: function () {
												return this.iPressOKButtonInDialog("The ok button in the dialog was not found and could not be pressed");
											},
											errorMessage: "Did not find the" +  sOption + "in" + sItem
										});
									} else {
										return this.iPressOKButtonInDialog("The ok button in the dialog was not found and could not be pressed");
									}
								},
								errorMessage: "Did not find the" + sItem + " element in select"
							});
						},
						errorMessage: "Did not find the " + sSelect + " select"
					});
				},
				iPressOKButtonInDialog: function (sErrorMessage) {
					return this.waitFor({
						controlType: "sap.m.Button",
						matchers: new PropertyStrictEquals({
							name: "text",
							value: "OK"
						}),
						searchOpenDialogs: true,
						actions: new Press(),
						errorMessage: sErrorMessage
					});
				},
				iRememberTheIdOfListItemAtPosition: function (iPosition) {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: function (oList) {
							return oList.getItems()[iPosition];
						},
						success: function (oListItem) {
							this.iRememberTheListItem(oListItem);
						},
						errorMessage: "The list does not have an item at the index " + iPosition
					});
				},
				iRememberAnIdOfAnObjectThatsNotInTheList: function () {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: new AggregationFilled({
							name: "items"
						}),
						success: function (oList) {
							var aEntityData = this.getEntitySet("ProductSet");
							var aObjectsNotInTheList = aEntityData.filter(function (oObject) {
								return !oList.getItems().some(function (oListItem) {
									return oListItem.getBindingContext().getProperty("ProductID") === oObject.ProductID;
								});
							});
							var sObjectNotInTheListId;

							if (aObjectsNotInTheList.length) {
								sObjectNotInTheListId = aObjectsNotInTheList[0].ProductID;
							} else {
								// Not enough items all of them are displayed so we take the last one
								sObjectNotInTheListId = aEntityData[aEntityData.length - 1].ProductID;
							}

							var oCurrentItem = this.getContext().currentItem;
							// Construct a binding path since the list item is not created yet and we only have the id.
							oCurrentItem.bindingPath = "/" + oList.getModel().createKey("ProductSet", {
								ProductID: sObjectNotInTheListId
							});
							oCurrentItem.id = sObjectNotInTheListId;
						},
						errorMessage: "The master list with id 'list' cannot be found"
					});
				},
				iPressOnTheObjectAtPosition: function (iPositon) {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: function (oList) {
							return oList.getItems()[iPositon];
						},
						actions: new Press(),
						errorMessage: "List 'list' in view '" + sViewName + "' does not contain an ObjectListItem at position '" + iPositon + "'"
					});
				},
				iSearchForTheFirstObject: function () {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: new AggregationFilled({
							name: "items"
						}),
						success: function (oList) {
							var sFirstObjectTitle = oList.getItems()[0].getTitle();
							return this.iSearchForValue(sFirstObjectTitle);
						},
						errorMessage: "Did not find list items while trying to search for the first item."
					});
				},
				iSearchForValue: function (sValue) {
					return this.waitFor({
						id: "searchField",
						viewName: sViewName,
						actions: [
							new EnterText({
								text: sValue
							}),
							new Press()
						],
						errorMessage: "Failed to find search field in Master view.'"
					});
				},

				iClearTheSearch : function () {
					return this.waitFor({
						id: "searchField",
						viewName: sViewName,
						actions: new Press({
							idSuffix: "reset"
						}),
						errorMessage: "Failed to find search field in Master view.'"
					});
				},

				iSearchForSomethingWithNoResults: function () {
					return this.iSearchForValue(sSomethingThatCannotBeFound);
				},

				iRememberTheListItem: function (oListItem) {
					var oBindingContext = oListItem.getBindingContext();
					this.getContext().currentItem = {
						bindingPath: oBindingContext.getPath(),
						id: oBindingContext.getProperty("ProductID"),
						title: oBindingContext.getProperty("Name")
					};
				}
			},

			assertions: {

				theListShouldContainAGroupHeader: function () {
					return this.waitFor({
						controlType: "sap.m.GroupHeaderListItem",
						viewName: sViewName,
						success: function () {
							Opa5.assert.ok(true, "Master list is grouped");
						},
						errorMessage: "Master list is not grouped"
					});
				},

				theListShouldContainOnlyFormattedUnitNumbers: function () {
					return this.theUnitNumbersShouldHaveTwoDecimals("sap.m.ObjectListItem",
						sViewName,
						"Numbers in ObjectListItems numbers are properly formatted",
						"List has no entries which can be checked for their formatting");
				},

				theListHeaderDisplaysZeroHits: function () {
					return this.waitFor({
						viewName: sViewName,
						id: "masterPageTitle",
						matchers: new PropertyStrictEquals({
							name: "text",
							value: "<ProductSet> (0)"
						}),
						success: function () {
							Opa5.assert.ok(true, "The list header displays zero hits");
						},
						errorMessage: "The list header still has items"
					});
				},

				theListHasEntries: function () {
					return this.waitFor({
						viewName: sViewName,
						id: "list",
						matchers: new AggregationFilled({
							name: "items"
						}),
						success: function () {
							Opa5.assert.ok(true, "The list has items");
						},
						errorMessage: "The list had no items"
					});
				},

				theListShouldNotContainGroupHeaders: function () {
					return this.waitFor({
						viewName: sViewName,
						id: "list",
						matchers: function (oList) {
							return !oList.getItems().some(function (oElement) {
								return oElement.getMetadata().getName() === "sap.m.GroupHeaderListItem";
							});
						},
						success: function () {
							Opa5.assert.ok(true, "Master list does not contain a group header although grouping has been removed.");
						},
						errorMessage: "Master list still contains a group header although grouping has been removed."
					});
				},

				theListShouldBeFilteredOnUnitNumber: function () {
					return this.theListShouldBeFilteredOnFieldUsingComparator("Price", 100);
				},


				theListShouldBeSortedAscendingOnUnitNumber: function () {
					return this.theListShouldBeSortedAscendingOnField("Price");
				},

				theListShouldBeSortedAscendingOnName: function () {
					return this.theListShouldBeSortedAscendingOnField("Name");
				},

				theListShouldBeFilteredOnFieldUsingComparator: function (sField, iComparator) {
					return this.waitFor({
						viewName: sViewName,
						id: "list",
						matchers: function (oList) {
							return oList.getItems().every(function (oElement) {
								if (!oElement.getBindingContext()) {
									return false;
								} else {
									var iValue = oElement.getBindingContext().getProperty(sField);
									return iValue <= iComparator;
								}
							});
						},
						success: function () {
							Opa5.assert.ok(true, "Master list has been filtered correctly for field '" + sField + "'.");
						},
						errorMessage: "Master list has not been filtered correctly for field '" + sField + "'."
					});
				},
				iShouldSeeTheList: function () {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						success: function (oList) {
							Opa5.assert.ok(oList, "Found the object List");
						},
						errorMessage: "Can't see the master list."
					});
				},

				theListShowsOnlyObjectsWithTheSearchStringInTheirTitle: function () {
					this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: new AggregationFilled({
							name: "items"
						}),
						check: function (oList) {
							var sTitle = oList.getItems()[0].getTitle();
							var bEveryItemContainsTheTitle = oList.getItems().every(function (oItem) {
								return oItem.getTitle().indexOf(sTitle) !== -1;
							});
							return bEveryItemContainsTheTitle;
						},
						success: function () {
							Opa5.assert.ok(true, "Every item did contain the title");
						},
						errorMessage: "The list did not have items"
					});
				},
				theListShouldHaveAllEntries: function () {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						success: function (oList) {
							var aAllEntities = this.getEntitySet("ProductSet");
							// If there are less items in the list than the growingThreshold, only check for this number.
							var iExpectedNumberOfItems = Math.min(oList.getGrowingThreshold(), aAllEntities.length);
							Opa5.assert.strictEqual(oList.getItems().length, iExpectedNumberOfItems, "The growing list displays all items");
						},
						errorMessage: "List does not display all entries."
					});
				},

				iShouldSeeTheNoDataTextForNoSearchResults: function () {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: new AggregationEmpty({
							name: "items"
						}),
						success: function (oList) {
							Opa5.assert.strictEqual(oList.getNoDataText(), oList.getModel("i18n").getProperty("masterListNoDataWithFilterOrSearchText"), "the list should show the no data text for search and filter");
						},
						errorMessage : "list does not show the no data text for search and filter"
					});
				},

				theHeaderShouldDisplayAllEntries: function () {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						success: function (oList) {
							var iExpectedLength = oList.getBinding("items").getLength();
							return this.waitFor({
								id: "masterPageTitle",
								viewName: sViewName,
								matchers: new PropertyStrictEquals({
									name: "text",
									value: "<ProductSet> (" + iExpectedLength + ")"
								}),
								success: function () {
									Opa5.assert.ok(true, "The master page header displays " + iExpectedLength + " items");
								},
								errorMessage: "The  master page header does not display " + iExpectedLength + " items."
							});
						},
						errorMessage: "Header does not display the number of items in the list"
					});
				},

				theListShouldHaveNoSelection: function () {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: function (oList) {
							return !oList.getSelectedItem();
						},
						success: function (oList) {
							Opa5.assert.strictEqual(oList.getSelectedItems().length, 0, "The list selection is removed");
						},
						errorMessage: "List selection was not removed"
					});
				},

				theRememberedListItemShouldBeSelected: function () {
					return this.waitFor({
						id: "list",
						viewName: sViewName,
						matchers: function (oList) {
							return oList.getSelectedItem();
						},
						success: function (oSelectedItem) {
							Opa5.assert.strictEqual(oSelectedItem.getTitle(), this.getContext().currentItem.title, "The list selection is incorrect.\nHint: If the master list shows integer numbers, use toString function to convert the second parameter to string");
						},
						errorMessage: "The list has no selection"
					});
				},
				theListShouldBeSortedAscendingOnField: function (sField) {
					return this.waitFor({
						viewName: sViewName,
						id: "list",
						matchers: function (oList) {
							var oLastValue = null;
							return oList.getItems().every(function (oElement) {
								if (!oElement.getBindingContext()) {
									return false;
								}
								var oCurrentValue = oElement.getBindingContext().getProperty(sField);
								if (!oCurrentValue) {
									return false;
								}
								if (!oLastValue || oCurrentValue >= oLastValue) {
									oLastValue = oCurrentValue;
									return true;
								} else {
									return false;
								}
							});
						},
						success: function () {
							Opa5.assert.ok(true, "Master list has been sorted correctly for field '" + sField + "'.");
						},
						errorMessage: "Master list has not been sorted correctly for field '" + sField + "'."
					});
				}
			}
		}
	});
});
