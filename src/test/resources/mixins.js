var graphMixin = {
  data: function () {
    return {
			showLeftPanel: true,

			tagNameCol: 'centralTagName',
			tagUnitCol: 'refEu',
			pidUnitCol: 'tagEu',
			unitDifCol: 'unitDif',
			lineupCol: 'lineup',
			timezoneCol: 'timezone',

			dateFormat: "DD-MM-YYYY HH:mm:ss",	

			configurationId: null,

			yRangesInfo: {id: -1, max: 0, min: 0},
    }
  },
  
  methods: {
    showHideLeftPanel: function() {
		this.showLeftPanel = !this.showLeftPanel;
	
		var self = this;
		setTimeout(function(){ 
			self.handleWindowResize();
		}, 250);
	},

	checkShareLink: function() {
		if (this.configurationId === null) {
			this.showShareLink(false);
		} else {
			this.openModal(this.$refs.shareGraphCoiseModal);
		}
	},

	openModal: function(modalElement) {
		openModalByElement(modalElement);
	},

	closeModal: function(modalElement) {
		closeModalByElement(modalElement);
	},

	confirmShareGraphCoise: function (overrideOld) {
		this.closeModal(this.$refs.shareGraphCoiseModal);
		this.showShareLink(overrideOld);
	},

	changeYLockedValue: function() {
		this.$set(this.yRangesInfo, 'yLocked', !this.yRangesInfo.yLocked);
	},

	openTagWindow: function() {
		app.openTagWindow();
	}
  },
  
	computed: {
		leftPanelStyle: function() {
			var output = {};
			output.width = "200px";
			
			if (!this.showLeftPanel) {
				output.width = "30px";
			}
			
			return output;
		},
	},
}



var legendMixin = {
  data: function () {
    return {
		tagNameTdWidth: 0.6,
		tagNameTdWidthSmall: 0.4,
    }
  },
  
  methods: {
    getNewElementPosition: function (mouseY, tableElement) {
			var table = this.$refs.legendTableInside;
			if (tableElement) {
				table = tableElement;
			}
			var newElementIndex = table.rows.length - 1;
			for (var i = 0, row; row = table.rows[i]; i++) {
				if (i >= 0) {
					var rowY = row.getBoundingClientRect().top + row.offsetHeight/2 + window.scrollY;
					if (rowY >= mouseY) {
						newElementIndex = i - 1;
						break;
					}
				}									
			}
			return newElementIndex;
		},

		adjustTablePaddings: function(newIndex, tableElement, colIndex) {
			var table = this.$refs.legendTableInside;
			if (tableElement) {
				table = tableElement;
			}

			var refColIndex = 2;
			if (colIndex) {
				refColIndex = colIndex;
			}
			for (var i = 1, row; row = table.rows[i]; i++) {
				if ((i - 1) == newIndex) {
					table.rows[i].cells[refColIndex].classList.add('paddingTopClass');
				} else {
					table.rows[i].cells[refColIndex].classList.remove('paddingTopClass');
				}
			}
		},

		tagMoveDragStart: function(event, tagName) {
			var tagInfo = {"tagName": tagName, "previusGraphIndex": this.index};
			event.dataTransfer.setData("tagtomove", JSON.stringify(tagInfo));
			event.dataTransfer.effectAllowed = "copyMove";
		},
  },
  
	computed: {
		
	},
}



var dateMixin = {
  data: function () {
    return {
			dateFormat: "DD-MM-YYYY HH:mm:ss",
			datepickerDateFormat: "DD-MM-YYYY HH:mm",
			inputMaskFormat: "dd-mm-yyyy HH:MM",
			inputMaskSecondFormat: "dd-mm-yyyy HH:MM:ss",
			localTimezone: false,	

			cursorPositionValue: [
				{"key": 0, "value": "days"},
				{"key": 1, "value": "days"},
				{"key": 2, "value": "days"},
				{"key": 3, "value": "months"},
				{"key": 4, "value": "months"},
				{"key": 5, "value": "months"},
				{"key": 6, "value": "years"},
				{"key": 7, "value": "years"},
				{"key": 8, "value": "years"},
				{"key": 9, "value": "years"},
				{"key": 10, "value": "years"},
				{"key": 11, "value": "hours"},
				{"key": 12, "value": "hours"},
				{"key": 13, "value": "hours"},
				{"key": 14, "value": "minutes"},
				{"key": 15, "value": "minutes"},
				{"key": 16, "value": "minutes"},
			],
    }
  },
  
  methods: {
    
		increaseDate: function(event) {
			this.modifyDate(event, true);
		},

		decreaseDate: function(event) {
			this.modifyDate(event, false);
		},

		modifyDate: function(event, add) {
			event.preventDefault();
			const cursorPosition = event.target.selectionStart;
			let timeToAdd = this.cursorPositionValue.find(val => val.key === cursorPosition).value;
			const fieldName = event.target.name;

			let picker = $(this.$refs[fieldName]);
			let date = moment(picker.data('daterangepicker').startDate);

			let dateModified = null;
			if (add) {
				dateModified = moment(date).add(1, timeToAdd);
			} else {
				dateModified = moment(date).subtract(1, timeToAdd);
			}

			picker.data('daterangepicker').setStartDate(dateModified);
			picker.data('daterangepicker').setEndDate(dateModified);

			picker.data('daterangepicker').clickApply();

			event.target.setSelectionRange(cursorPosition, cursorPosition)
		},
  },
  
	computed: {
		
	},
}

var editViewMixin = {
	data: function () {
		return {
			lineups: [],
			machines: [],
			anomalyCategoryOptions: [],

			ebs: [],
			ebsSystems: [],
			ebsGroups: [],
			ebsComponents: [],

			ebsObject: null,
			ebsField: null,
			ebsSystemsObject: null,
			ebsSystemsField: null,
			ebsGroupsObject: null,
			ebsGroupsField: null,
			ebsComponentsObject: null,
			ebsComponentsField: null,
		}
	},
	
	methods: {

		extractField: function(fn) {
			var output = null;
			try {
				output = fn();
			} catch (err) {
				output = null;
			}			
			
			if (output == null) {
				output = null;
			}

			return output;
		},

		_loadLineups: function() {
			this.lineups = [];

			this.$http.get(lineupsUrl).then(response => {
				this.lineups = response.body;
			}, response => {
				console.log(response);
			});
		},

		_loadMachines: function(lineupId, objectToModify, fieldToCheck) {
			this.machines = [];

			if (lineupId != null) {
				var url = machinesUrl.replace("@lineupId@", lineupId);

				this.$http.get(url).then(response => {
					this.machines = response.body;
					
					var selectedValueFound = false;
					for (var i = 0; i < this.machines.length; i++) {
						if (this.machines[i].serialNo === objectToModify[fieldToCheck]) {
							selectedValueFound = true;
							break;
						}
					}

					if (!selectedValueFound) {
						objectToModify[fieldToCheck] = null;
					}
				}, response => {
					alert("Error ");
					console.log(response)
				});
			} else {
				objectToModify[fieldToCheck] = null;
			}	
		},

		_loadAnomalyCategoryOptions: function(){
			this.anomalyCategoryOptions = [];
			
			this.$http.get(activityLogsCategoriesUrl).then(response => {
				this.anomalyCategoryOptions = response.body;
			}, response => {
				alert("Error ");
				console.log(response)
			});
		},

		_setEbsFields: function(ebsObject, ebsField, ebsSystemsObject, ebsSystemsField, 
				ebsGroupsObject, ebsGroupsField, ebsComponentsObject, ebsComponentsField) {

			this.ebsObject = ebsObject;
			this.ebsField = ebsField;
			this.ebsSystemsObject = ebsSystemsObject;
			this.ebsSystemsField = ebsSystemsField;
			this.ebsGroupsObject = ebsGroupsObject;
			this.ebsGroupsField = ebsGroupsField;
			this.ebsComponentsObject = ebsComponentsObject;
			this.ebsComponentsField = ebsComponentsField;

		},

		_loadEbs: function(serialNo) {
			this.ebs = [];

			if (serialNo != null) {
				var url = ebsUrl.replace("@serialno@", serialNo);

				this.$http.get(url).then(response => {
					this.ebs = response.body;
					
					var selectedValueFound = false;
					for (var i = 0; i < this.ebs.length; i++) {
						if (this.ebs[i].ebsCode === this.ebsObject[this.ebsField]) {
							selectedValueFound = true;
							break;
						}
					}

					if (!selectedValueFound) {
						this.$set(this.ebsObject, this.ebsField, this.ebs[0].ebsCode);
						this.ebsSystemsObject[this.ebsSystemsField] = null;
						this.ebsGroupsObject[this.ebsGroupsField] = null;
						this.ebsComponentsObject[this.ebsComponentsField] = null;

						this.changeRandomRefId();
						this.changeRefVar();
						this._loadEbsSystems(this.ebs[0].ebsCode);
					}

				}, response => {
					alert("Error ");
					console.log(response)
				});
			} else {
				this.ebsObject[this.ebsField] = null;
				this.ebsSystemsObject[this.ebsSystemsField] = null;
				this.ebsGroupsObject[this.ebsGroupsField] = null;
				this.ebsComponentsObject[this.ebsComponentsField] = null;
			}
		},

		_loadEbsSystems: function(ebsCode) {
			this.ebsSystems = [];

			if (ebsCode !== null) {
				var url = ebsSystemsUrl.replace("@ebsCode@", ebsCode);

				this.$http.get(url).then(response => {
					this.ebsSystems = response.body;
					
					var selectedValueFound = false;
					for (var i = 0; i < this.ebsSystems.length; i++) {
						if (this.ebsSystems[i].systemCode === this.ebsSystemsObject[this.ebsSystemsField]) {
							selectedValueFound = true;
							break;
						}
					}

					if (!selectedValueFound) {
						this.ebsSystemsObject[this.ebsSystemsField] = null;
					}

				}, response => {
					this.ebsSystems = [];
				});
			} else {
				this.ebsSystemsObject[this.ebsSystemsField] = null;
			}
		},

		_loadEbsGroups: function(ebsCode, systemCode) {
			this.ebsGroups = [];

			if (!this.disableEbsHierarchy) {
				var url = ebsGroupsUrl;

				if (ebsCode != null) {
					url += "&ebsCode=" + ebsCode;
				}

				if (systemCode) {
					url += "&ebsSystemCode=" + systemCode;
				}

				this.$http.get(url).then(response => {
					this.ebsGroups = response.body;
					
					var selectedValueFound = false;
					for (var i = 0; i < this.ebsGroups.length; i++) {
						if (this.ebsGroups[i].groupCode === this.ebsGroupsObject[this.ebsGroupsField]) {
							selectedValueFound = true;
							break;
						}
					}

					if (!selectedValueFound) {
						this.ebsGroupsObject[this.ebsGroupsField] = null;
					}

				}, response => {
					alert("Error ");
					console.log(response)
				});
			} else {
                if (this.ebsGroupsObject != null && this.ebsGroupsField != null) {
                    this.ebsGroupsObject[this.ebsGroupsField] = null;
                }
			}
		},

		_loadEbsComponents: function(ebsCode, systemCode, groupCode) {
			this.ebsComponents = [];

			if (!this.disableEbsHierarchy) {
				var url = ebsComponentsUrl;

				if (ebsCode) {
					url += "&ebsCode=" + ebsCode;
				}

				if (systemCode) {
					url += "&ebsSystemCode=" + systemCode;
				}

				if (groupCode) {
					url += "&ebsGroupCode=" + groupCode;
				}

				this.$http.get(url).then(response => {
					this.ebsComponents = response.body;
					
					var selectedValueFound = false;
					for (var i = 0; i < this.ebsComponents.length; i++) {
						if (this.ebsComponents[i].componentCode === this.ebsComponentsObject[this.ebsComponentsField]) {
							selectedValueFound = true;
							break;
						}
					}

					if (!selectedValueFound) {
						this.ebsComponentsObject[this.ebsComponentsField] = null;
					}

				}, response => {
					alert("Error ");
					console.log(response)
				});
			} else {
			    if (this.ebsComponentsObject != null && this.ebsComponentsField != null) {
				    this.ebsComponentsObject[this.ebsComponentsField] = null;
			    }
			}
		},

		changeRandomRefId: function() {

		},

		changeRefVar: function() {

		},
	},
	
	computed: {
		disableEbsHierarchy: function() {
			return false;
		}
	},
  }

var notificationMixin = {
	data: function () {
		return {

		}
	},

	methods: {
		requestNotificationPermission: function() {
			if(Notification && Notification.permission === 'default') {
				Notification.requestPermission(function (permission) {
					if(!('permission' in Notification)) {
						Notification.permission = permission;
					}
				});
			}	
		},

		sendNotification: function(pageTitle, phoenixIcon, text, tag, url) {
			var notification = new Notification(pageTitle, {
				icon: phoenixIcon,
				body: text,
				tag: tag
			  });
			
			notification.onclick = function () {
				window.open(url, pageTitle).focus();
			};
		},

	},

	mounted: function() {
		this.requestNotificationPermission();
	}
}

var spinnerMixin = {
	data: function () {
	  return {
		showSpinnerVariable: false,
		hideSpinnerVariable: true,
		showLoadingBar: false,
		loadingBarProgress: 0,

		currentAjaxRequest: null,
		requestAborted: false,
	  }
	},
	
	methods: {
		getSpinnerStyle: function() {
			var output = {};
			if (this.showSpinnerVariable) {
				output = {opacity: 1, height: "100%"};
			} else {
				output = {opacity: 0};
				if (this.hideSpinnerVariable) {
					output['height'] = "0%";
				}
			}

			output.position = "fixed";

			return output;
		},

		showSpinner: function() {
			this.showSpinnerVariable = true;
			this.hideSpinnerVariable = false;
			this.showLoadingBar = false;
		},

		hideSpinner: function(abort) {
			this.showSpinnerVariable = false;
			this.hideSpinnerVariable = false;

			var self = this;
			setTimeout(function(){
				self.hideSpinnerVariable = true;
				
				if (abort) {
					self.abortLastRequest();
				} else {
					self.requestAborted = false;
				}
				self.currentAjaxRequest = null;
			}, 250);
		},

		abortLastRequest: function() {

		},
	},
	
	computed: {
		
	},
}