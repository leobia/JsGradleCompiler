class Graph {
	initialize(index, tagsForGraph, tagValues, mode, graphComponent, singleGraphComponent, eventsAlerts, svgElement, graphWrapper, tagGroups) {
		this.index = index;
		this.tagsForGraph = tagsForGraph;
		this.tagValues = tagValues;
		this.mode = mode;
		this.graphComponent = graphComponent;
		this.singleGraphComponent = singleGraphComponent;
		if(tagGroups) {
			this.singleGraphComponent.tagGroups = tagGroups;
		}
		this.eventsAlerts = eventsAlerts;
		this.svgElement = svgElement;
		this.svg = d3.select(this.svgElement);
        this.graphWrapper = graphWrapper;
		
		this.tickFontSize = "10px";
		var textWidth = this.getTextWidth('9999-99-99', this.tickFontSize, 'GEInspiraSans');
		this.refLegendWidth = textWidth * 1.3;
		
		this.lineColor = lineColor1;
		this.lineColor2 = lineColor2;
		this.lineColorMoved = "red";
		this.isMovingSecondLine = false;
		
		this.yAxisSpace = 46;
		this.yAxisLargeSpace = this.yAxisSpace * 1.5;
        this.mouseOverArea = false;
        
        this.ghostModeDarkPointColor = "#000";
		this.ghostModeLightPointColor = "#BBBBBB88";
		
		this.hightlightTimestampBackgroundColor = "#00FF0044";
		
		this.calculateInitialXRange();
		
		/*if (!this.singleGraphComponent.yAxisLock)  {
			this.calculateInitialYRange();
        }*/	
        this.calculateInitialYRange();
        
        if (this.singleGraphComponent.graphType == 'xy') {
            if ( this.singleGraphComponent.canDrawXYGraph()) {
                this.extractXYGraphInfo();       
            }            
        } 
	}
	
	setLegendElement (legendElement) {
		this.legendElement = legendElement;
	}
	
	setActionDiv (actionDiv) {
		this.actionDiv = actionDiv;
	}

	setZoomActionDiv (zoomActionDiv) {
		this.zoomActionDiv = zoomActionDiv;
	}

	setLineActionDiv (lineActionDiv) {
		this.lineActionDiv = lineActionDiv;
	}
	
	getXRange () {
		return this.xRange;
	}
	
	setXRange(xRange) {
		this.xRange = xRange;
		this.isZoomedX = true; 
		this.calculateXStep();
	}
	
	updateGraphInfo(tagsForGraph, tagValues, mode) {
		this.tagsForGraph = tagsForGraph;
        this.tagValues = tagValues;
		this.mode = mode;
		
		this.calculateInitialXRange();
		
		if (!this.singleGraphComponent.yAxisLock) {
			this.calculateInitialYRange();
        } else {
            this.extractTagGroups();    
        }
        
        if (this.singleGraphComponent.graphType == 'xy') {
            if ( this.singleGraphComponent.canDrawXYGraph()) {
                this.extractXYGraphInfo();       
            }            
        }
	}
	
	calculateInitialXRange() {
		var initXRanges = [this.tagValues.tagDataRecords[0].t, 
			this.tagValues.tagDataRecords[this.tagValues.tagDataRecords.length - 1].t];
		
		if (this.isGraphInScanMode() || this.isGraphInStabilizedScanMode()) {
			var total = 0;
			for (var j = 0; j < this.tagValues.tagDataRecords.length; j++) {
				if (this.isGraphInStabilizedScanMode() || this.graphComponent.tagValues.filter[j]) {
					total++;
				}
			}
			initXRanges = [0, total - 1];
		}
		
		this.xRange = initXRanges;
		this.initXRange = initXRanges;
		this.isZoomedX = false;
		
		this.calculateXStep();
	}
	
	calculateInitialYRange() {
		var initYRange = this.extractYRange();
		this.yRange = initYRange;
		this.initYRange = initYRange;
		this.isZoomedY = false;
	}
	
	extractYRange() {
        this.extractTagGroups();
		var tagGroups = this.tagGroups;
		
		var output = [];
		for (var z = 0; z < tagGroups.length; z++) {
			
			var yMin = null;
			var yMax = null;
			
			var offsets = [];
			for (var j = 0; j < tagGroups[z].length; j++) {
				var offset = 0;
				if (this.graphComponent.compareActivityMode) {
					var activityId = tagGroups[z][j].name.split(" ")[1];
					offset = parseFloat(this.graphComponent.eventOffsets[activityId]);
					if (isNaN(offset)) {
						offset = 0;
					}
				}
				offsets.push(offset);
			}
			
            var tmpIndex = 0;
			for (var i = 0; i < this.tagValues.tagDataRecords.length; i++) {
				var cond1 = this.isGraphInStabilizedScanMode() || ((this.isGraphInScanMode()) &&
					(this.graphComponent.tagValues.filter[i] && tmpIndex >= this.xRange[0] &&  tmpIndex <= this.xRange[1]));
				var cond2 = this.tagValues.tagDataRecords[i].t >= this.xRange[0] && this.tagValues.tagDataRecords[i].t <= this.xRange[1];
				
				if (this.isGraphInStabilizedScanMode() || (this.graphComponent.filterInfo.enabled && this.graphComponent.tagValues.filter[i])) {
					tmpIndex++;
				}
				
				if (cond1 || cond2) {
					for (var j = 0; j < tagGroups[z].length; j++) {
						if (tagGroups[z][j].active) {
							var tagIndex = this.tagValues.tagNamesList.indexOf(tagGroups[z][j].name);
							
							var value = null;
							var newTimestampIndex = i - parseFloat(offsets[j]);
							if (newTimestampIndex >= 0 && newTimestampIndex < this.tagValues.tagDataRecords.length) {
								
								if (!(this.graphComponent.filterInfo.enabled && this.graphComponent.filterInfo.mode === "hide" && 
										!this.graphComponent.tagValues.filter[newTimestampIndex])) {
									if (tagGroups[z][j].formula) {
										try {
											value = this.tagValues.tagDataRecords[newTimestampIndex].calculated[tagGroups[z][j].name];
										} catch (err) {
											value = null;
										}                                    
									} else {
										value = this.tagValues.tagDataRecords[newTimestampIndex].v[tagIndex];
									}
								}	

							}
							
							if ((value || value == 0)) {
								var unit = tagGroups[z][j].tagInfo.unitDif ? tagGroups[z][j].tagInfo[this.graphComponent.pidUnitCol] : tagGroups[z][j].tagInfo[this.graphComponent.tagUnitCol];
								var conversionInfo = this.graphComponent.extractUnitConversionInfo(unit);
								value = (value + conversionInfo.unitOffset) * conversionInfo.unitGain;
							}
							
							if (value || value == 0) {
								if (yMax === null || value > yMax) {
									yMax = value;
								}

								if (yMin === null || value < yMin) {
									yMin = value;
								}
							}					
						}
					}
				}					
            }
			if (yMin == yMax) {
				yMax += 1;
				yMin -= 1;
			}
			
			var enlargeStep = (yMax - yMin) / 35;
			yMax += enlargeStep;
			yMin -= enlargeStep;
					
			var originalMin = yMin;
			var originalMax = yMax;
			
		    try {
				
				var continueProcess = true;
				var cycles = 10;
				
				while (continueProcess && cycles < 20) {
					cycles++;
					var y = d3.scaleLinear().rangeRound([this.height, 0]);
					y.domain([yMin, yMax]);
					var axisY = d3.axisLeft(y).tickSizeOuter(0);
					
					var ticksArray = axisY.scale().ticks();			
					var axisStep = ticksArray[1] - ticksArray[0];
									
					if (parseFloat(ticksArray[0]) === yMin && parseFloat(ticksArray[ticksArray.length - 1]) == yMax) {
						continueProcess = false;
					} else {
						continueProcess = true;
						
						if (originalMin > ticksArray[0]) {
							yMin = parseFloat(ticksArray[0]);
						} else {
							yMin = parseFloat(ticksArray[0] - axisStep);
						}
						
						if (originalMax < ticksArray[ticksArray.length - 1]) {
							yMax = parseFloat(ticksArray[ticksArray.length - 1]);
						} else {
							yMax = parseFloat(ticksArray[ticksArray.length - 1] + axisStep);
						}
					}
				}
				
			} catch(error) {
				
			}

			output.push([yMin, yMax]);
		}
				
		return output;
	}
	
	zoomOnX (xMin, xMax) {
		this.xRange = [xMin, xMax];
		this.isZoomedX = true;
		
		if (!this.graphComponent.grabbing) {
			this.calculateXStep();
			
			if (!this.singleGraphComponent.yAxisLock) {
				var yRange = this.extractYRange();
				this.yRange = yRange;
			}			
		}
		
		var self = this;
		setTimeout(function(){ 
			try {
				self.redrawGraph();
			} catch (err) {
				console.log(err);
			}			
		}, 50);
	}
	
	zoomOnY (newRanges) {
        this.yRange = newRanges;
		this.isZoomedY = true;
		
		var self = this;
		setTimeout(function(){ 
			try {
				self.redrawGraph();
			} catch (err) {
				console.log(err);
			}			
		}, 200);
	}
	
	restoreInitialRanges () {
        this.calculateInitialXRange();
		
		if (!this.singleGraphComponent.yAxisLock) {
            //this.calculateInitialYRange();
            this.yRange = this.initYRange;
            this.isZoomedY = false;
		}		
	}
	
	updateTagList (tagsForGraph, tagValues, eventsAlerts) {
		this.tagsForGraph = tagsForGraph;
		this.tagValues = tagValues;
		this.eventsAlerts = eventsAlerts;
		
		if (!this.singleGraphComponent.yAxisLock) {
			this.calculateInitialYRange();
        } else {
            this.extractTagGroups();    
        }
        
        if (this.singleGraphComponent.graphType == 'xy') {
            if ( this.singleGraphComponent.canDrawXYGraph()) {
                this.extractXYGraphInfo();       
            }            
        }
	}
	
	cleanGraph() {
        d3.select(this.svgElement).select("*").remove();
        if (this.cursorSvg) {
            d3.select(this.singleGraphComponent.$refs.cursorSvg).select("*").remove();    
        }
    }

    redrawGraph() {
        if (this.singleGraphComponent.graphType == 'xy') {
            if ( this.singleGraphComponent.canDrawXYGraph()) {
                try {
                    this.calculateXYMaxMin();
                    this.checkGraphInfoToLoad();
                    this.redrawGraphXY();
                } catch (err) {
                    console.log(err);
                }                               
            }            
        } else if (this.singleGraphComponent.graphType == 'timeseries') {
            this.checkGraphInfoToLoad();
            this.redrawGraphClassic();
        } else if (this.singleGraphComponent.graphType == 'polar') {
			this.cleanGraph();
			if (this.singleGraphComponent.canDrawPolarGraph()) {
				try {
					this.checkGraphInfoToLoad();
					this.drawPolarGraph();	
				} catch (err) {
					console.log(err);
				}
			}
		}
    }

	
	redrawGraphClassic() {
        this.cleanGraph();
		var self = this;
		
		if (!this.graphComponent.graphVisibility[this.index]) {
			return;
		}
		
		var leftYAxis = this.graphComponent.getNumberOfLeftYAxis();
		var rightYAxis = this.graphComponent.getNumberOfRightYAxis();
		var space = (this.graphComponent.showLabels() === "true") ? this.yAxisLargeSpace : this.yAxisSpace;
				
		// DEFINE SVG PROPERTIES
		var margin = {
			top: graphTopMargin,
			right: space * rightYAxis,
			bottom: 8,
			left: space * leftYAxis
		};
		this.width = this.graphWrapper.offsetWidth - margin.left - margin.right;
		this.height = this.graphWrapper.offsetHeight - margin.top - margin.bottom;

		this.svg.attr("width", this.graphWrapper.offsetWidth);
		this.svg.attr("height", this.graphWrapper.offsetHeight);
		
		this.svg.attr("viewBox", "0 0 " + 
				this.graphWrapper.offsetWidth + " " + 
				this.graphWrapper.offsetHeight)
				.attr("preserveAspectRatio", "none");

		this.g = this.svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		// DEFINE X AXIS
		if (this.graphComponent.compareActivityMode || this.isGraphInScanMode() || this.isGraphInStabilizedScanMode()) {
			this.x = d3.scaleLinear().rangeRound([0, this.width]);
		} else {
			this.x = d3.scaleTime().rangeRound([0, this.width]);
		}
		this.x.domain(this.xRange);
				
		// DEFINE Y AXIS
		var tmpY = [];
		for (var i = 0; i < this.yRange.length; i++) {
			var tmp = d3.scaleLinear().rangeRound([this.height, 0]);
			tmp.domain(this.yRange[i]);
			tmpY.push(tmp);
		}
		this.y = tmpY;
        
		if (this.index === this.graphComponent.getFirstDrawGraph) {
			this.calculateXTicks();
		}
        
        try {
            this.drawYLabels();
        } catch (err) {
            console.log(err);
        }		
		
		// DRAW GRIDLINES
		this.g.append("g")
		.attr("class", "grid")
		.call(this.make_y_gridlines(this.y[0]).tickSize(-this.width).tickFormat(""));
		
		this.g.append("g")
		.attr("class", "grid xLegendTicks")
		.attr("transform", "translate(0," + this.height + ")")
		.call(this.make_x_gridlines(this.x).tickSize(-this.height).tickFormat("")
                .ticks(this.graphComponent.getTicks().numberOfThicks * 5));
                
        this.g.append("defs").append("svg:clipPath")
	        .attr("id", "clip" + this.index)
	        .append("svg:rect")
	        .attr("id", "clip-rect")
	        .attr("x", 0)
	        .attr("y", 0)
	        .attr("width", this.width)
	        .attr("height", this.height);
		
		// DRAW ZOOMED AREAS BACKGROUND
		if (!this.isGraphInScanMode() && 
				this.index == this.graphComponent.getLatestDrawGraph() && this.graphComponent.zoomedIntervals.length > 0) {
			
			for (var i = 0; i < this.graphComponent.zoomedIntervals.length; i++) {
				var x0 = this.x(this.graphComponent.zoomedIntervals[i].from);
				var x1 = this.x(this.graphComponent.zoomedIntervals[i].to);
				
				if (((x0 >= 0 && x0 <= this.width) || (x1 >= 0 && x1 <= this.width)) || 
						(x0 <= 0 && x1 >= this.width)) {
					
					if (x0 < 0) {
						x0 = 0;
					}
					if (x1 > this.width) {
						x1 = this.width;
					}
					
					var recthHeight = 3;
					var rectColor = "#0000FF55";
					this.g.append("rect")
						.attr("x", x0)
						.attr("y", this.height - recthHeight)
						.attr("width", x1 - x0)
						.attr("height", recthHeight)
						.attr("fill", rectColor);					
				}
			}
		}
		
		// DRAW SNAM SECONDS AVAILABLE INTERVALS
		var intervals = this.graphComponent.getSecondIntervalsForGraph(this.index);

		intervals.sort(function(x, y) {
		    var dif = 0;

		    if (x.intervalType != "PROCESSED" && y.intervalType == "PROCESSED") {
		        dif = -1;
		    } else if (x.intervalType == "PROCESSED" && y.intervalType != "PROCESSED") {
		        dif = 1;
		    }

		    return dif;
		});

		if (intervals.length > 0) {
			for (var i = 0; i < intervals.length; i++) {
				console.log("intervals[" + i + "]:");
				console.log(intervals[i]);
				var x0 = this.x(intervals[i].from);
				var x1 = this.x(intervals[i].to);
				
				if (((x0 >= 0 && x0 <= this.width) || (x1 >= 0 && x1 <= this.width)) || 
						(x0 <= 0 && x1 >= this.width)) {
					
					if (x0 < 0) {
						x0 = 0;
					}
					if (x1 > this.width) {
						x1 = this.width;
					}
					
					var recthHeight = 3;
					var rectColor = intervals[i].intervalType == "PROCESSED" ? "#289826" : "#FF0000";

					this.g.append("rect")
						.attr("x", x0)
						.attr("y", this.height - recthHeight)
						.attr("width", x1 - x0)
						.attr("height", recthHeight)
						.attr("fill", rectColor);

				}
			}
		}
		
        //var tmpTagValues = JSON.parse(JSON.stringify(this.graphComponent.tagValues.tagDataRecords));
        var tmpTagValues = this.graphComponent.tagValues.tagDataRecords;
        var newTagValue = null;
		
		// DRAW REMOVED POINTS BACKGROUND		
		if (this.graphComponent.filterInfo.enabled && this.graphComponent.filterInfo.mode === 'highlight') {
			var initIndex = 0;
			
			for (var j = 1; j < tmpTagValues.length; j++) {
				var cond1 = (this.graphComponent.tagValues.filter[j] !== this.graphComponent.tagValues.filter[j - 1]);
				var cond2 = (j === (tmpTagValues.length - 1)) && !this.graphComponent.tagValues.filter[j] && 
						!this.graphComponent.tagValues.filter[j - 1];
				
				if (cond1 || cond2) {
					var endIndex = (cond1) ? (j - 1) : j;
					
					if (this.graphComponent.tagValues.filter[j] || cond2) {
						if (initIndex > 0) {
							initIndex--;
						}
						if (endIndex < tmpTagValues.length - 1) {
							endIndex++;
						}
						
						var x0 = this.x(tmpTagValues[initIndex].t);
						var x1 = this.x(tmpTagValues[endIndex].t) + 1;
						
						if (((x0 >= 0 && x0 <= this.width) || (x1 >= 0 && x1 <= this.width)) || 
								(x0 <= 0 && x1 >= this.width)) {
							
							if (x0 < 0) {
								x0 = 0;
							}
							if (x1 > this.width) {
								x1 = this.width;
							}
							
							var rectColor = "#FFFF0055";
							var recthHeight = 3;
							this.g.append("rect")
								.attr("x", x0)
								.attr("y", 0)
								.attr("width", x1 - x0)
								.attr("height", this.height)
								.attr("fill", rectColor);
						}
					}
					
					initIndex = j;
				}
			}
		}

		// DRAW DOWNLOAD INTERVAL AREA
		if (this.graphComponent.showDownload) {

			var interval1 = this.graphComponent.firstInterval > this.graphComponent.maxDownloadIntervall ? this.graphComponent.maxDownloadIntervall : this.graphComponent.firstInterval;
			var interval2 = this.graphComponent.secondInterval > this.graphComponent.maxDownloadIntervall ? this.graphComponent.maxDownloadIntervall : this.graphComponent.secondInterval;

			var interval1 = interval1 * 1000 * 60;
			var interval2 = interval2 * 1000 * 60;

			var xStart1 = this.x(this.graphComponent.lastTimestampValue - interval1);
			var xEnd1 = this.x(this.graphComponent.lastTimestampValue + interval1);

			var xStart2 = this.x(this.graphComponent.lastTimestampValue2 - interval2);
			var xEnd2 = this.x(this.graphComponent.lastTimestampValue2 + interval2);
			
			var rectColor = "#DE000755";
			var recthHeight = 3;
			this.g.append("rect")
				.attr("x", xStart1)
				.attr("y", 0)
				.attr("width", xEnd1 - xStart1)
				.attr("height", this.height)
				.attr("fill", rectColor);

			this.g.append("rect")
				.attr("x", xStart2)
				.attr("y", 0)
				.attr("width", xEnd2 - xStart2)
				.attr("height", this.height)
				.attr("fill", rectColor);

		}

		// DRAW TIMESTAMP HIGHLIGHT BACKGROUND
		if (this.graphComponent.hightlightTimestampInfo.hasOwnProperty("timestamps")) {
			var initIndex = -1;
			var timestampList = this.graphComponent.hightlightTimestampInfo.timestamps;

			for (var j = 0; j < tmpTagValues.length; j++) {
				if (timestampList.includes(tmpTagValues[j].t) && j < (tmpTagValues.length - 1)) {
					if (initIndex == -1) {
						initIndex = j;
					}
				} else {
					if (initIndex != -1) {
						endIndex = j - 1;

						var x0 = this.x(tmpTagValues[initIndex].t);
						var x1 = this.x(tmpTagValues[endIndex].t) + 1;

						if (((x0 >= 0 && x0 <= this.width) || (x1 >= 0 && x1 <= this.width)) || 
								(x0 <= 0 && x1 >= this.width)) {

							if (x0 < 0) {
								x0 = 0;
							}
							if (x1 > this.width) {
								x1 = this.width;
							}

							var rectColor = this.hightlightTimestampBackgroundColor;
							var recthHeight = 3;
							this.g.append("rect")
								.attr("x", x0)
								.attr("y", 0)
								.attr("width", x1 - x0)
								.attr("height", this.height)
								.attr("fill", rectColor);
						}
						initIndex = -1;
					}
				}
			}
		}
        
        var step = self.step;
		if (this.isGraphInScanMode() || this.isGraphInStabilizedScanMode()) {
			newTagValue = [];
			
			var tmpIndex = 0;
			for (var j = 0; j < tmpTagValues.length; j++) {
				if (this.isGraphInStabilizedScanMode() || this.graphComponent.tagValues.filter[j]) {
					newTagValue.push(JSON.parse(JSON.stringify(tmpTagValues[j])));
					newTagValue[tmpIndex].valid = true;
					newTagValue[tmpIndex].index = tmpIndex;
					newTagValue[tmpIndex].t = tmpIndex;
                    tmpIndex++;
				}
			}
            step = 1;
        }

        // DRAW LINES
        var isGraphInHidePointsMode = (self.graphComponent.filterInfo.enabled && self.graphComponent.filterInfo.mode === 'hide');

		for (var i = 0; i < this.tagsForGraph.length; i++) {
            var tagName = this.tagsForGraph[i].name;
			var tagIndex = this.tagValues.tagNamesList.indexOf(tagName);
			var unit = this.tagsForGraph[i].tagInfo.unitDif ? this.tagsForGraph[i].tagInfo[this.graphComponent.pidUnitCol] : this.tagsForGraph[i].tagInfo[this.graphComponent.tagUnitCol];
			
			var unitOffset = 0, unitGain = 1;
			var conversionInfo = this.graphComponent.extractUnitConversionInfo(unit);
			unitOffset = conversionInfo.unitOffset;
			unitGain = conversionInfo.unitGain;
			
			var activityId, offset = 0;
			if (this.graphComponent.compareActivityMode) {
				activityId = this.tagsForGraph[i].name.split(" ")[1];
				offset = parseFloat(this.graphComponent.eventOffsets[activityId]);
				if (isNaN(offset)) {
					offset = 0;
				}
			}
			
			if (tagIndex != -1 || this.tagsForGraph[i].formula) {
                var tmpY = this.getRelativeYAxis(tagName);
                var innerTmpTagValues = null;
                var isCalculatedTag = false;
								
				if (this.mode === 'RAW') {
					innerTmpTagValues = [];
					for (var j = 0; j < this.tagValues.tagDataRecords.length; j++) {
						var value = this.tagValues.tagDataRecords[j].v[tagIndex];
						if (value !== null) {												
							innerTmpTagValues.push(this.tagValues.tagDataRecords[j]);
						}
					}
				} else if (this.tagsForGraph[i].formula) {
                    isCalculatedTag = true;
                }
                
                var line = d3.line()
				.defined(function(d) {
					var returnValue = ((parseFloat(d.t) + parseFloat(offset)) >= (self.xRange[0] - step) && 
							(parseFloat(d.t) + parseFloat(offset)) <= (self.xRange[1] + step));
					if (returnValue && self.mode !== 'RAW') {
                        if (!isCalculatedTag) {
                            returnValue = returnValue && (d.v[tagIndex] != null);
                        } else {
							try {
								returnValue = returnValue && (d.calculated[tagName] != null);
							} catch (err) {

							}                            
                        }
                        
                        if (isGraphInHidePointsMode) {
                            returnValue = returnValue && d.valid;
                        }
					}
					return returnValue; 
				})
				.x(function (d) {
					return self.x(parseFloat(d.t) + parseFloat(offset));
				})
				.y(function (d) {
                    var yVal;
                    if (!isCalculatedTag) {
                        yVal = (d.v[tagIndex] + unitOffset) * unitGain;
                    } else {
                        yVal = (d.calculated[tagName] + unitOffset) * unitGain;
                    }

					var output = tmpY(yVal);
					if (output < -10000) {
						output = -10000;
					}
					if (output > 10000) {
						output = 10000;
                    }
                    
					return output;									  
				});
				
				var lineColor = this.tagsForGraph[i].color;
				if (!this.tagsForGraph[i].active) {
					lineColor += "00";
				}

				var lineWidth = 1;
				if (this.tagsForGraph[i].hasOwnProperty("lineSize") || this.tagsForGraph[i].hasOwnProperty("sizeFromSelection")) {
					if (this.tagsForGraph[i].lineSize && this.tagsForGraph[i].sizeFromSelection) {
						lineWidth = this.tagsForGraph[i].lineSize + this.tagsForGraph[i].sizeFromSelection;
					} else {
						lineWidth = this.tagsForGraph[i].lineSize || this.tagsForGraph[i].sizeFromSelection;
					}
				}
				
				try {
                    var dataArrayToUse = (innerTmpTagValues !== null) ? innerTmpTagValues : 
                        ((newTagValue !== null) ? newTagValue : tmpTagValues);

					var line = this.g.append("path")
					.datum(dataArrayToUse)
					.attr("fill", "none")
					.attr("stroke", lineColor)
					.attr("stroke-linejoin", "round")
					.attr("stroke-linecap", "round")
					.attr("clip-path", "url(#clip" + this.index + ")")
					.attr("stroke-width", lineWidth)
					.attr("class", "linePath")
					.attr("d", line);
					
					if (this.tagsForGraph[i].hasOwnProperty("lineStyle") && this.tagsForGraph[i].lineStyle !== "solid") {
						if (this.tagsForGraph[i].lineStyle === "dashed") {
							line.style("stroke-dasharray", "10, " + (5 * Math.max(lineWidth, 2) * 0.5));
						} else if (this.tagsForGraph[i].lineStyle === "dotted") {
							var space = lineWidth * 2;
							line.style("stroke-dasharray", "1, " + space);
						}
					}
				} catch (err) {
					console.log(err);
				}
			}			
		}
		
		// DRAW X LABELS
		var xAxisCall = d3.axisBottom(this.x).tickSizeOuter(0).tickValues(this.graphComponent.getTicks().ticksArray);
		xAxisCall = xAxisCall.tickFormat(d3.timeFormat(''));			

		this.g.append("g")
		.attr("transform", "translate(0," + this.height + ")")
		.attr("class", "axis--x")
		.call(xAxisCall)
		.append("text")
		.attr("fill", "#000")
		.attr("y", 0)
		.select(".domain")
		.remove();
		
		this.configureListeners();
		this.drawEventsAlerts();
		
		if (this.index === (this.graphComponent.getLatestDrawGraph())) {
			this.drawLegend();
		}

		// DRAW SECONDS AVAILABLE INTERVALS
		var secondIntervals = this.graphComponent.getOldSecondIntervalsForGraph();
		var self = this;
		if (secondIntervals.length > 0) {
			
			var tooltipDiv = d3.select("#graphTooltip");
			
			for (var i = 0; i < secondIntervals.length; i++) {
				var currentInterval = secondIntervals[i];
				var x0 = this.x(currentInterval.from);
				var x1 = this.x(currentInterval.to);
				
				if (((x0 >= 0 && x0 <= this.width) || (x1 >= 0 && x1 <= this.width)) || 
						(x0 <= 0 && x1 >= this.width)) {
					
					if (x0 < 0) {
						x0 = 0;
					}
					if (x1 > this.width) {
						x1 = this.width;
					}
					
					var recthHeight = 5;
					var rectColor = "#45F54299";
					
					var timezone = this.graphComponent.getGraphTimezone(true);

					var from = Number(currentInterval.from);
					var to = Number(currentInterval.to);
					
					var fromString = moment(from).tz(timezone).format("DD-MM-YYYY HH:mm:ss");
					var toString = moment(to).tz(timezone).format("DD-MM-YYYY HH:mm:ss");
					
					this.g.append("svg:rect")
					.attr("x", x0)
					.attr("y", this.height - recthHeight)
					.attr("width", x1 - x0)
					.attr("height", recthHeight)
					.attr("fill", rectColor)
					.attr("class", "interval snam-second")
					//.attr("id", "snam-second_" + i)
					.attr("style", "cursor: pointer;");
					//.on("mouseover", this.pippo)
					//.on("mouseover", function() {
					//	d3.event.stopPropagation();
					//	tooltipDiv.style("left", (d3.event.pageX + 20) + "px")		
					//		.style("top", (d3.event.pageY - 30) + "px");
					//	tooltipDiv.transition().duration(200).style("opacity", 1);		
					//})
					//.on("mouseout", function() {		
					//	var tooltipDiv = d3.select("#graphTooltip");
					//	tooltipDiv.transition().duration(500).style("opacity", 0);
					//})	
					//.on("click", function(event){
					//	d3.event.stopPropagation();
					//	self.graphComponent.getSecondIntervalTag(self.index, from, to);
					//});
					
				}
			}
			
			var rects = d3.selectAll(".snam-second");

			rects
				.data(secondIntervals)
				.on("mouseover", function(d, i) {
					d3.event.stopPropagation();
					var currentInterval = d;

					var from = Number(currentInterval.from);
					var to = Number(currentInterval.to);
					
					var fromString = moment(from).tz(timezone).format("DD-MM-YYYY HH:mm:ss");
					var toString = moment(to).tz(timezone).format("DD-MM-YYYY HH:mm:ss");

					tooltipDiv.html("<ul><li>From: " 
					+ fromString
						+ "</li><li>To: "
						+ toString
						+ "</li></ul>");

					tooltipDiv
						.style("left", (d3.event.pageX + 20) + "px")		
						.style("top", (d3.event.pageY - 30) + "px");
					tooltipDiv.transition().duration(200).style("opacity", 1);	

				})
				.on("mouseout", function(d, i) {
					d3.event.stopPropagation();
					tooltipDiv.transition().duration(500).style("opacity", 0);
				})
				.on("click", function(d, i){
					d3.event.stopPropagation();

					var currentInterval = d;

					var from = Number(currentInterval.from);
					var to = Number(currentInterval.to);					

					self.graphComponent.getSecondIntervalTag(self.index, from, to);
				});
			
		}

	}
	
	make_x_gridlines (x) {
		return d3.axisBottom(x)/*.ticks(5)*/
	}


	make_y_gridlines (y) {
		return d3.axisLeft(y)/*.ticks(5)*/
	}

	configureListeners() {
		var self = this;
		
		this.mouseG = this.g.append("g").attr("class", "mouse-over-effects");
		
		this.mouseG
			.on("mouseover", function () {
				self.singleGraphComponent.setInsideGraph(true);
			}).on("mouseout", function () {
				if (d3.selectAll(".zoomRect").size() == 0) {
					self.singleGraphComponent.setInsideGraph(false);
				}				
			});
		
		this.svg.on("mousedown", function () {
			if (d3.selectAll(".zoomRect").size() > 0) {
				var action = self.graphComponent.graphAction;
				var zoomRect = d3.select(this.parentNode.parentNode).select(".zoomRect");
				
				d3.selectAll(".zoomRect").remove();
				
				if (action === 'zoomX') {
					var x0 = self.x.invert(zoomRect.attr("x"));
					if (!self.graphComponent.compareActivityMode && !self.isGraphInScanMode() && !self.isGraphInStabilizedScanMode()) {
						x0 = x0.getTime();
					}
					
					var x1 = self.x.invert(parseInt(zoomRect.attr("x")) + parseInt(zoomRect.attr("width")));
					if (!self.graphComponent.compareActivityMode && !self.isGraphInScanMode() && !self.isGraphInStabilizedScanMode()) {
						x1 = x1.getTime();
					}
					
					if (x1 > self.xRange[1]) {
						x1 = self.xRange[1];
					}
					self.graphComponent.zoomOnX(x0, x1);
				} else if (action === 'zoomY') {
					var newRanges = [];
					for (var i = 0; i < self.y.length; i++) {
						var y1 = self.y[i].invert(zoomRect.attr("y"));
						var y0 = self.y[i].invert(parseInt(zoomRect.attr("y")) + parseInt(zoomRect.attr("height")));
						newRanges.push([y0, y1]);
					}					
					self.zoomOnY(newRanges);
				}
			}
		}).on('mousemove', function () {
			var s = d3.select(this.parentNode.parentNode).select(".zoomRect");
			var action = self.graphComponent.graphAction;
			
			if (!s.empty()) {
				var start = s.attr("start");
				var mouse = d3.mouse(this);
				var position;
				if (mouse[0] > self.width / 2) {
					position = self.width + 1;
				} else {
					position = 0;
				}

				if (action == 'zoomX') {
					var newX, width;
					if (start < position) {
						newX = start;
						width = position - start;
					} else {
						newX = position;
						width = start - position;
					}

					d3.select(".zoomRect")
						.attr("x", newX)
						.attr("width", width);
				} 
			}
		});

		var actionDiv = d3.select(this.actionDiv);
		var showActionDivOnRightClick = true;
		
		this.mouseG.append('svg:rect')
		.attr('width', this.width)
		.attr('height', this.height)
		.attr('fill', 'none')
		.attr('pointer-events', 'all')
		.on("contextmenu", function () {
			d3.event.preventDefault();
			
			if (d3.selectAll(".zoomRect").size() > 0) {
				d3.selectAll(".zoomRect").remove();
			} else if (showActionDivOnRightClick) {	
				actionDiv.attr("hidden", null);
				var rect = actionDiv.node().getBoundingClientRect();
				
				actionDiv
					.style("left", (d3.event.pageX - rect.width * 0.65) + "px")		
		            .style("top", (d3.event.pageY - rect.height * 1) + "px")
				actionDiv.transition()		
		            .duration(200)		
		            .style("opacity", 1);	
			}
        })
		.on("mousedown", function () {
			d3.event.stopPropagation();
			
			if (d3.event.button) {
				return;
			}
			
			if (self.graphComponent.graphAction === 'zoomX' || 
					self.graphComponent.graphAction === 'zoomY') {
				var zoomRect = d3.select(this.parentNode.parentNode).select(".zoomRect");
				var action = self.graphComponent.graphAction;
				if (zoomRect.empty()) {
					
					var mouse = d3.mouse(this);
					var x, y, width, height, start;
					if (action === 'zoomX') {
						x = mouse[0];
						y = 0;
						width = 1;
						height = self.height;
						start = mouse[0];
					} else {
						x = 0;
						y = mouse[1];
						width = self.width;
						height = 1;
						start = mouse[1];
					}
					
					d3.select(this.parentNode.parentNode).select(".grid").append("rect")
					.attr("x", x)
					.attr("y", y)
					.attr("width", width)
					.attr("height", height)
					.attr("fill", "#0000FF44")
					.attr("class", "zoomRect")
					.attr("start", start);
				} else {
					d3.selectAll(".zoomRect").remove();
					
					if (action === 'zoomX') {
						var x0 = self.x.invert(zoomRect.attr("x"));
						if (!self.graphComponent.compareActivityMode && !self.isGraphInScanMode()  && !self.isGraphInStabilizedScanMode()) {
							x0 = x0.getTime();
						}
						
						var x1 = self.x.invert(parseInt(zoomRect.attr("x")) + parseInt(zoomRect.attr("width")));
						if (!self.graphComponent.compareActivityMode && !self.isGraphInScanMode()  && !self.isGraphInStabilizedScanMode()) {
							x1 = x1.getTime();
						}
						
						self.graphComponent.zoomOnX(x0, x1);
					} else if (action === 'zoomY') {
						var newRanges = [];
						for (var i = 0; i < self.y.length; i++) {
							var y1 = self.y[i].invert(zoomRect.attr("y"));
							var y0 = self.y[i].invert(parseInt(zoomRect.attr("y")) + parseInt(zoomRect.attr("height")));
							newRanges.push([y0, y1]);
						}					
						self.zoomOnY(newRanges);
					}					
				}
			} else if (self.graphComponent.graphAction === 'move') {
				self.graphComponent.grabbing = true;
				self.startingGrabMousePosition = d3.mouse(this);
			}
		})
		.on("mouseup",  function () {
			self.graphComponent.lineGraphBlocked = true;
			d3.selectAll(".line1").style("stroke", self.lineColor);
			d3.selectAll(".line2").style("stroke", self.lineColor2);
			
			if (self.graphComponent.graphAction === 'move' && self.graphComponent.grabbing) {
				self.graphComponent.grabbing = false;
				self.graphComponent.zoomOnX(self.xRange[0] - 1, self.xRange[1]);
			}
		})
		.on('mousemove', function () {
			if (!self.graphComponent.isDraggingGraphWidth) {
				d3.event.stopPropagation();
				var mouse = d3.mouse(this);

				if (!self.graphComponent.lineGraphBlocked) {
					self.getAndUpdateTimestamp(this, self.isMovingSecondLine);				
				} else if (self.graphComponent.graphAction === 'zoomX' || self.graphComponent.graphAction === 'zoomY') {
					
					var s = d3.select(this.parentNode.parentNode).select(".zoomRect");
					var action = self.graphComponent.graphAction;
					
					if (!s.empty()) {
						var start = s.attr("start");

						if (action == 'zoomX') {
							var newX, width;
							if (start < mouse[0]) {
								newX = start;
								width = mouse[0] - start;
							} else {
								newX = mouse[0];
								width = start - mouse[0];
							}

							d3.select(".zoomRect")
								.attr("x", newX)
								.attr("width", width);
						} else {
							var newY, height;
							if (start < mouse[1]) {
								newY = start;
								height = mouse[1] - start;
							} else {
								newY = mouse[1];
								height = start - mouse[1];
							}
							
							d3.select(".zoomRect")
							.attr("y", newY)
							.attr("height", height);
						}					
					}
				} else if (self.graphComponent.graphAction === 'move' && self.graphComponent.grabbing) {
					var currentPosition = d3.mouse(this);
					var xDiff = self.x.invert(currentPosition[0]) - self.x.invert(self.startingGrabMousePosition[0]);
					
					self.xRange[0] -= xDiff;
					self.xRange[1] -= xDiff;
					
					self.graphComponent.zoomOnX(self.xRange[0], self.xRange[1]);
					self.startingGrabMousePosition = currentPosition;
				}
			}			
		});
		
		if (!showActionDivOnRightClick) {
			var mouseOverFunction = function() {	
				self.graphComponent.hideOtherGraphActionDiv(self.index);
				var boundingRect = self.svg.node().getBoundingClientRect();
				actionDiv.attr("hidden", null);
				actionDiv.transition()		
		            .duration(200)		
		            .style("opacity", 1);		
				actionDiv.style("left", (boundingRect.left + boundingRect.width - self.actionDiv.offsetWidth * 1.35) + "px")		
		            .style("top", (boundingRect.top - self.actionDiv.offsetHeight * 0.65) + "px");
	        }
			
			var mouseOutFunction = function() {	
	        	var boundingRect = self.svg.node().getBoundingClientRect();
	        	var tollerance = 20;
	        	if (d3.event.pageX < boundingRect.left + tollerance || d3.event.pageX > (boundingRect.left + boundingRect.width - tollerance) || 
	        			d3.event.pageY < boundingRect.top + tollerance || d3.event.pageY > (boundingRect.top + boundingRect.height - tollerance)) {
	        		actionDiv.transition()		
	                .duration(500)		
	                .style("opacity", 0)
	                .on("end", function() { actionDiv.attr("hidden",true); });
	        	}
	        }
			
			this.svg
			.on("mouseover", mouseOverFunction)
			.on("mouseout", mouseOutFunction);
			
			actionDiv
				.on("mouseover", mouseOverFunction)
				.on("mouseout", mouseOutFunction);
		} else {
			actionDiv
			.on("mouseout", function() {
				var boundingRect = actionDiv.node().getBoundingClientRect();
				if (d3.event.pageX < boundingRect.left || d3.event.pageX > (boundingRect.left + boundingRect.width) || 
	        			d3.event.pageY < boundingRect.top || d3.event.pageY > (boundingRect.top + boundingRect.height)) {
					actionDiv.transition()		
		                .duration(500)		
		                .style("opacity", 0)
		                .on("end", function() { actionDiv.attr("hidden",true); });
				}
				
	        });
		}
		
		
		this.mouseLine = this.mouseG.append("path")
		.attr("class", "mouse-line line1")
		.style("stroke", self.lineColor)
		.style("stroke-width", "1px");

		var lineActionDiv = d3.select(this.lineActionDiv);
		
		this.cursorArea = this.mouseG.append('svg:rect')
		.attr("class", "cursor-area")
		.attr('width', 10)
		.attr('height', this.height)
		.attr('fill', '#00000000')
		.on('mousedown', function () {
			self.graphComponent.lineGraphBlocked = false;
			self.isMovingSecondLine = false;
			d3.selectAll(".line1").style("stroke", self.lineColorMoved);
			d3.selectAll(".zoomRect").remove();
		})
		.on("mouseup",  function () {
			self.graphComponent.lineGraphBlocked = true;
			d3.selectAll(".line1").style("stroke", self.lineColor);
			d3.selectAll(".line2").style("stroke", self.lineColor2);
		}).on('mousemove', function () {
			d3.event.stopPropagation();
			if (!self.graphComponent.lineGraphBlocked && !self.isMovingSecondLine) {
				self.getAndUpdateTimestamp(this, false);
			}
		}).on("contextmenu", function () {
			d3.event.preventDefault();

			if (!self.graphComponent.compareActivityMode) {
				lineActionDiv.attr("hidden", null);
					var rect = lineActionDiv.node().getBoundingClientRect();
					
					lineActionDiv
						.style("left", (d3.event.pageX - rect.width * 0.7) + "px")		
						.style("top", (d3.event.pageY - rect.height * 1.8) + "px")
					lineActionDiv.transition()		
						.duration(200)		
						.style("opacity", 1);
			}
		});
		
		lineActionDiv
			.on("mouseout", function() {
				var boundingRect = lineActionDiv.node().getBoundingClientRect();
				if (d3.event.pageX < boundingRect.left || d3.event.pageX > (boundingRect.left + boundingRect.width) || 
						d3.event.pageY < boundingRect.top || d3.event.pageY > (boundingRect.top + boundingRect.height - 5)) {
						
						if (!self.zoomActionClicked) {
							d3.selectAll(".zoomRect").remove();
						}
						
						lineActionDiv.transition()		
							.duration(500)		
							.style("opacity", 0)
							.on("end", function() { lineActionDiv.attr("hidden",true); });
				}
			});
	
		if (this.graphComponent.lastTimestampValue != -1) {
			try {
				self.moveCursorLine(self.graphComponent.lastTimestampValue);
			}
			catch(error) {
				
			}
		}
		
		if (this.graphComponent.doubleCursor) {
			this.mouseLine2 = this.mouseG.append("path")
				.attr("class", "mouse-line line2")
				.style("stroke", self.lineColor2)
				.style("stroke-width", function() { 
					return (!self.graphComponent.secondCursorLocked) ? "1px" : "2px"; 
				});
			
			this.cursorArea2 = this.mouseG.append('svg:rect')
				.attr("class", function() { 
					return (!self.graphComponent.secondCursorLocked) ? "cursor-area" : ""; 
				})
				.attr('width', 10)
				.attr('height', this.height)
				.attr('fill', '#00000000')
				.on('mousedown', function () {
					if (!self.graphComponent.secondCursorLocked) {
						self.graphComponent.lineGraphBlocked = false;
						self.isMovingSecondLine = true;
						d3.selectAll(".line2").style("stroke", self.lineColorMoved);
						d3.selectAll(".zoomRect").remove();
					}					
				})
				.on("mouseup",  function () {
					self.graphComponent.lineGraphBlocked = true;
					d3.selectAll(".line1").style("stroke", self.lineColor);
					d3.selectAll(".line2").style("stroke", self.lineColor2);
				}).on('mousemove', function () {
					d3.event.stopPropagation();
					if (!self.graphComponent.lineGraphBlocked && self.isMovingSecondLine) {
						self.getAndUpdateTimestamp(this, true);
					}
				});
			
			if (this.graphComponent.lastTimestampValue2 != -1) {
				try {
					self.moveCursorLine(self.graphComponent.lastTimestampValue2, true);
				}
				catch(error) {
					
				}
			}
		}
	}
	
	moveCursorLine (timestamp, isSecondCursor) {
		var self = this;

        if (this.singleGraphComponent.graphType == 'timeseries') {
            try {
                var xPos = self.x(timestamp);
                if (this.isGraphInScanMode() || this.isGraphInStabilizedScanMode()) {
                    var tmpIndex = 0;
                    for (var i = 0; i < this.tagValues.tagDataRecords.length; i++) {
                        if (this.tagValues.tagDataRecords[i].t === timestamp) {
                            xPos = self.x(tmpIndex);
                            break;
                        } else if (this.isGraphInStabilizedScanMode() || this.graphComponent.tagValues.filter[i]) {
                            tmpIndex++;
                        }
                    }
                }
                
                if (isSecondCursor) {
                    this.cursorArea2.attr("x", xPos - this.cursorArea.attr("width") / 2);
                    this.mouseLine2.attr("d", function () {
                        var d = "M" + (parseFloat(self.cursorArea2.attr("x")) + parseFloat(self.cursorArea2.attr("width")/2)) + "," + self.height;
                        d += " " + (parseFloat(self.cursorArea2.attr("x")) + parseFloat(self.cursorArea2.attr("width")/2)) + "," + 0;
                        return d;
                    })
                    .style("stroke", this.graphComponent.lineGraphBlocked ? this.lineColor2 : self.lineColorMoved);
                } else {
                    var self = this;
                    this.cursorArea.attr("x", xPos - this.cursorArea.attr("width") / 2);
                    this.mouseLine.attr("d", function () {
                        var d = "M" + (parseFloat(self.cursorArea.attr("x")) + parseFloat(self.cursorArea.attr("width")/2)) + "," + self.height;
                        d += " " + (parseFloat(self.cursorArea.attr("x")) + parseFloat(self.cursorArea.attr("width")/2)) + "," + 0;
                        return d;
                    })
                    .style("stroke", this.graphComponent.lineGraphBlocked ? this.lineColor : self.lineColorMoved);
                }		
            } catch (err) {
                
            }
        } else if (this.singleGraphComponent.graphType == 'xy' && this.singleGraphComponent.canDrawXYGraph()){
			
            try {
                var tmpTimestampIndex = this.graphComponent.getTimestampIndex(isSecondCursor);
                var record = this.graphComponent.tagValues.tagDataRecords[tmpTimestampIndex];

                var circles;
                if (isSecondCursor) {
                    circles = this.timestampCircles2;
                } else {
                    circles = this.timestampCircles;
                }

                var zColor = null;
                if (this.xyInfo.hasOwnProperty("zInfo")) {
                    zColor = this.xyInfo.zInfo.zArray[tmpTimestampIndex];
                    if (this.singleGraphComponent.xyGraphOptions.reverseZ) {
                        zColor = 1 - zColor;
                    }
                }

                for (var i = 0; i < circles.length; i++) {
                    var xValue;
                    if (!this.xyInfo.xInfo.formula) {
                        xValue = (record.v[this.xyInfo.xInfo.index] + this.xyInfo.xInfo.conversionInfo.unitOffset) 
                            * this.xyInfo.xInfo.conversionInfo.unitGain;
                    } else {
                        xValue = (this.tagValues.calculatedTags[this.xyInfo.xInfo.name][tmpTimestampIndex]["OUTPUT"] 
                            + this.xyInfo.xInfo.conversionInfo.unitOffset) * this.xyInfo.xInfo.conversionInfo.unitGain;
                    }

                    var yValue;
                    if (!this.xyInfo.yInfos[i].formula) {
                        yValue = (record.v[this.xyInfo.yInfos[i].index] + this.xyInfo.yInfos[i].conversionInfo.unitOffset) 
                            * this.xyInfo.yInfos[i].conversionInfo.unitGain;
                    } else {
                        yValue = (this.tagValues.calculatedTags[this.xyInfo.yInfos[i].name][tmpTimestampIndex]["OUTPUT"] 
                            + this.xyInfo.yInfos[i].conversionInfo.unitOffset) * this.xyInfo.yInfos[i].conversionInfo.unitGain;
                    }


                    var cx =  self.x(xValue);
					var cy =  self.y[this.xyInfo.yInfos[i].tagGroupIndex](yValue);
                    var isOutside = cx < 0 || cx > this.width || cy < 0 || cy > this.height;
                    if (!this.graphComponent.areNormalGraphsVisible || isOutside || 
                        !this.singleGraphComponent.xyGraphOptions.showCursors) {
                        cx = 10000;
                        cy = 10000;
                    }
                    
                    if (!isNaN(cx) && !isNaN(cy)) {
                        circles[i]
                            .attr("cx", cx)
                            .attr("cy", cy);

                        if (zColor !== null) {
                            circles[i].style("fill", getColorForPercentage(zColor));
                        }
                    }
                }
            } catch (err) {
                console.log(err);
            }
        }				
	}
	
	calculateXStep() {
		try {
			this.step = Math.abs(this.tagValues.tagDataRecords[0].t - this.tagValues.tagDataRecords[1].t);
		} catch(error) {
			this.step = 0;
		}
	}
	
	drawEventsAlerts() {
		var div = d3.select("#graphTooltip");
		
		if (this.graphComponent.compareActivityMode) {
			var eventList = this.eventsAlerts.events;
			var visibileEvents = 0;
			
			for (var i = 0; i < eventList.length; i++) {
				if (this.graphComponent.enabledEvents[eventList[i].id] === true) {
					visibileEvents++;
				}
			}
			
			var graphIndex = 0;
			for (var i = 0; i < eventList.length; i++) {
				if (this.graphComponent.enabledEvents[eventList[i].id] === true) {
					this.attachEvent(eventList[i], div, graphIndex, visibileEvents);
					graphIndex++;
				}				
			}
			
		} else {
			if (this.graphComponent.showEvents) {
				var eventList = this.eventsAlerts.eventList;

				if (eventList !== null && eventList.length > 0) {
					for (var i = 0; i < eventList.length; i++) {

						var type = eventList[i].typeDescription;
						if (this.graphComponent.enabledEvents.hasOwnProperty(type) &&
							this.graphComponent.enabledEvents[type]) {
							if (this.graphComponent.enabledMaintenanceActivities
								&& this.graphComponent.enabledMaintenanceActivities[type]) {
								var containsHiddenActivities = this.containsHiddenMaintenanceActivities(type, eventList[i]);
								if (!containsHiddenActivities) {
									this.attachEvent(eventList[i], div);
								}
							} else {
								this.attachEvent(eventList[i], div);
							}
						}
					}
				}
			}
			
			if (this.graphComponent.showAlert) {
				var alarmList = this.eventsAlerts.alarmList;
				
				if (alarmList !== null && alarmList.length > 0) {
					for (var i = 0; i < alarmList.length; i++) {
						var type = alarmList[i].typeDescription;
						if (this.graphComponent.enabledAlarms.hasOwnProperty(type) &&
								this.graphComponent.enabledAlarms[type]) {
							this.attachEvent(alarmList[i], div);						
						}
					}
				}
			}
		}
	}

	containsHiddenMaintenanceActivities (type, event) {
		var maintenanceActivities = this.graphComponent.enabledMaintenanceActivities[type];

		var hiddenActivities = maintenanceActivities.filter(m => !m.show);
		hiddenActivities = hiddenActivities.map(h => h.maintenanceId)

		var activitiesOfEvent = event.maintenanceActs.map(m => m.maintenanceId);

		const foundHidden = activitiesOfEvent.some(a => hiddenActivities.includes(a));
		return foundHidden;
	}

	attachEvent (event, tooltipDiv, graphIndex, visibileEvents) {
		var refDate;
		if (this.graphComponent.compareActivityMode) {
			refDate = this.graphComponent.compareInfo.minutesBefore * 60;
		} else {
			refDate = event.utcEventDate;
		}
		
		if (refDate < this.xRange[0] || refDate > this.xRange[1]) {
			return;
		} 
		
		//var iconWidth = 13;
		var iconHeight = 12;
		var fontSize = 12;
		
		var color = "#000000";
		if (event.eventType === 'ALARM') {
			color = "#FF0000";
		} else if (event.eventType === 'EVENT') {
			color = "#0000FF";
		}
		
		var icon = "\u25C6";
		
		var x;
		if (this.graphComponent.compareActivityMode) {
			x = this.x(this.graphComponent.compareInfo.minutesBefore * 60);
		} else {
			var eventDate = event.utcEventDate;
			x = this.x(eventDate);
		}
		
		var iconY = iconHeight;
		var lineY2 = iconHeight * 1.2;
		
		if (graphIndex != null && visibileEvents != null) {
			iconY = iconHeight * (graphIndex + 1) + graphIndex * iconHeight * 0.2;
			lineY2 = (iconHeight * (visibileEvents)) +  iconHeight * 0.6;
		}
		
		this.g.append("line")
		.attr("x1", x)
		.attr("y1", lineY2)
		.attr("x2", x)
		.attr("y2", this.height)
		.style("stroke-width", 2)
		.style("stroke", color + "44")
		.style("stroke-dasharray", ("5, 3"))
		.style("fill", "none");
		
		var self = this;
		this.g.append('text')
		.attr('class', 'handle')
	    .attr("x", x)
	    .attr("y", iconY)
	    .attr('font-family', 'FontAwesome')
	    .attr("style","font-family:FontAwesome;")
	    .attr("style", "cursor: pointer;")
	    .attr('font-size', fontSize + "px" )
	    .attr("text-anchor", "middle")
	    .style('fill', color)
	    .text(function() { return icon })
	    .on("mouseover", function() {		
	    	tooltipDiv.transition()		
                .duration(200)		
                .style("opacity", 1);		
	    	tooltipDiv.html(self.extractEventTooltip(event))	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");	
            })					
        .on("mouseout", function() {		
        	tooltipDiv.transition()		
                .duration(500)		
                .style("opacity", 0);	
        }).on("click", function() {
        	if (!event.hasOwnProperty("customEventFlag") && event.hasOwnProperty("id")) {
        		tooltipDiv.transition()		
	                .duration(500)		
	                .style("opacity", 0);
        		
        		app.showSpinner();
        		self.graphComponent.$router.push({
    				path : 'activityLogsDetail',
    				query : {
    					'logId' : event.id	
    				}
    			});
        	}
		});

	}
	
	extractEventTooltip (event) {		
		var id = event.id;
		if (event.hasOwnProperty("customEventFlag")) {
			id = "N/A";
		}
		
		var title = customEventTitle;
		if (event.eventType === 'ALARM') {
			title = alarmTitle;
		} else if (event.eventType === 'EVENT') {
			title = eventTitle;
		}		
		
		var htmlText = legendHtml.replace("@title@", title.toUpperCase())
						.replace("@eventDate@", event.eventDateFormatted)
						.replace("@type@", event.typeDescription)
						.replace("@lineup@", event.lineup)
						.replace("@timezone@", (event.hasOwnProperty("lineupElement")) ? event.lineupElement.timezone : event.timezoneId)
						.replace("@id@", id);

		var activitiesString = "";

		if (event.maintenanceActs && event.maintenanceActs.length > 0) {
			activitiesString = "Maintenance activities: ";

			for (var i = 0; i < event.maintenanceActs.length; i++) {
				const maintenanceDesc = event.maintenanceActs[i].maintenance.maintenanceDesc;
				activitiesString += " " + maintenanceDesc + " -";
			}
			activitiesString = activitiesString.substring(0, activitiesString.length - 1);
			activitiesString += "<br/>";
		}

		htmlText = htmlText.replace("@maintenanceActivities@", activitiesString)

		return htmlText;
	}
	
	getAndUpdateTimestamp(component, isSecondCursor) {
		var mouse = d3.mouse(component);
		var timestamp = this.x.invert(mouse[0]);
		
		if (this.isGraphInScanMode() || this.isGraphInStabilizedScanMode()) {
            timestamp = Math.round(timestamp);
			var tmpIndex = 0;
			for (var i = 0; i < this.tagValues.tagDataRecords.length; i++) {
                if ((this.isGraphInStabilizedScanMode() || this.graphComponent.tagValues.filter[i]) && tmpIndex === timestamp) {
					timestamp = this.tagValues.tagDataRecords[i].t;
					break;
				} else if (this.isGraphInStabilizedScanMode() || this.graphComponent.tagValues.filter[i]) {
					tmpIndex++;
				}
			}
		} else if (!this.graphComponent.compareActivityMode) {
			timestamp = timestamp.getTime();
		}
		
		if (!this.isGraphInScanMode() && !this.isGraphInStabilizedScanMode()) {
			if (timestamp < this.xRange[0]) {
				timestamp = this.xRange[0]; 
			} else if (timestamp > this.xRange[1]) {
				timestamp = this.xRange[1];
			}
		}		
		
		this.graphComponent.updateTimestamp(timestamp, isSecondCursor);
	}
	
	hideGraphActions() {
		var actionDiv = d3.select(this.actionDiv);
		actionDiv.transition()		
			.duration(500)		
			.style("opacity", 0)
			.on("end", function() { actionDiv.attr("hidden",true); });
		
		var zoomActionDiv = d3.select(this.zoomActionDiv);
		zoomActionDiv.transition()		
			.duration(500)		
			.style("opacity", 0)
			.on("end", function() { zoomActionDiv.attr("hidden",true); });

		var lineActionDiv = d3.select(this.lineActionDiv);
		lineActionDiv.transition()		
			.duration(500)		
			.style("opacity", 0)
			.on("end", function() { lineActionDiv.attr("hidden",true); });
	}
	
	drawLegend () {
		d3.select(this.legendElement).select("*").remove();
		
		var svg = d3.select(this.legendElement);
		var legendHeight = this.graphComponent.legendHeight;
		
		var leftYAxis = this.graphComponent.getNumberOfLeftYAxis();
		var rightYAxis = this.graphComponent.getNumberOfRightYAxis();
		var space = (this.graphComponent.showLabels() === "true") ? this.yAxisLargeSpace : this.yAxisSpace;
		
		var margin = {
			top: 0,
			right: space * rightYAxis,
			bottom: 0,
			left: space * leftYAxis
		};
		
		//var width = this.graphWrapper.offsetWidth - margin.left - margin.right;
		//var height = legendHeight;
		
		svg.attr("width", this.graphWrapper.offsetWidth);
		svg.attr("height", legendHeight);
		
		svg.attr("viewBox", "0 0 " + 
				this.graphWrapper.offsetWidth + " " + 
				legendHeight)
				.attr("preserveAspectRatio", "none");
		
		var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
		
		var self = this;
		var xAxisCall = d3.axisBottom(this.x).tickSizeOuter(0).tickSizeInner(4)
			.tickValues(this.graphComponent.getTicks().ticksArray);
		
		if (!this.isGraphInScanMode() && !this.isGraphInStabilizedScanMode()) {
			if (!this.graphComponent.compareActivityMode) {
				xAxisCall = xAxisCall.tickFormat(d3.timeFormat(''));
			} else {
				xAxisCall = xAxisCall.tickFormat(function(d) {
					var eventIndex = 60 * self.graphComponent.compareInfo.minutesBefore;
					var difference = d - eventIndex;
					var sign = (difference > 0) ? "" : "-";
					var minutes = Math.floor(Math.abs(difference) / 60);
					var seconds = Math.abs(difference) % 60;
				    return sign + minutes + "'" + ((seconds > 0) ? seconds : "");
				});
			}
		} else {
			xAxisCall = xAxisCall.tickFormat(d3.format("d"));
		}
		
		
		g.append("g")
		.attr("transform", "translate(0, -5)")
		.attr("class", "axis--x")
        .call(xAxisCall)
		.append("text")
		.attr("fill", "#000")
		.attr("y", 0)
		.select(".domain")
        .remove();
		
		if (!this.graphComponent.compareActivityMode && !this.isGraphInScanMode() && !this.isGraphInStabilizedScanMode()) {
			var timezone = this.graphComponent.getGraphTimezone(true);
            
            var clickFunction = function () {
                self.graphComponent.$refs.manualZoomComponent.open();
            }

			var xAxisWrapper = g.append('g')
              .attr("transform", "translate(0, -5)")
              .attr("class", "xAxisWrapper");
            
            xAxisWrapper.call(xAxisCall)
			  .selectAll('text')
			  .append('tspan')
			  .attr('dx', '0em')
			  .attr("dy", "0.6em")
			  .style("font-size", this.tickFontSize)
              .text(function (d) { return moment(d).tz(timezone).format("HH:mm:ss"); });
              
            xAxisWrapper.on("dblclick", clickFunction);	
			 
			xAxisWrapper = g.append('g')
              .attr("transform", "translate(0, -5)")
              .attr("class", "xAxisWrapper");
              
			xAxisWrapper.call(xAxisCall)
			  .selectAll('text')
			  .append('tspan')
			  .attr('dx', '0em')
			  .attr("dy", "1.6em")
			  .style("font-size", this.tickFontSize)
              .text(function (d) { return moment(d).tz(timezone).format("YYYY-MM-DD"); });

            xAxisWrapper.on("dblclick", clickFunction);
              
            g.selectAll(".xAxisWrapper .tick").attr("class", "tick xTicks");
		}
	}
	
	getTextWidth (text, fontSize, fontFace) {
	    var canvas = document.createElement('canvas');
	    var context = canvas.getContext('2d');
	    context.font = fontSize + ' ' + fontFace;
	    return context.measureText(text).width;
	}
	
	countDecimals (value) {
        try {
            return value.toString().split(".")[1].length;
        } catch (err) {
            return 0;
        }
	}
	
	getRelativeYAxis (tagName) {
		for (var i = 0; i < this.tagGroups.length; i++) {
			for (var j = 0; j < this.tagGroups[i].length; j++) {
				if (this.tagGroups[i][j].name === tagName) {
					return this.y[i];
				}
			}
		}
		return this.y[0];
	}
	
	getAxisUnit (index) {
		var output = "";
		
		if (this.tagGroups[index].length > 0) {
			var refUnit = this.tagGroups[index][0].tagInfo[this.graphComponent.tagUnitCol];
			var singleUnit = true;
			
			for (var i = 0; i < this.tagGroups[index].length; i++) {
				if (refUnit !== this.tagGroups[index][i].tagInfo[this.graphComponent.tagUnitCol]) {
					refUnit = multipleUnitsText;
					singleUnit = false;
					break;
				}
			}
			
			output = refUnit;
			if (singleUnit) {
				if (this.singleGraphComponent.selectedUnitMode !== "standard") {
					var field = (this.singleGraphComponent.selectedUnitMode === "international") ? "internationalName" : "imperialName";
					if (this.singleGraphComponent.tagUnitMap !== null && this.singleGraphComponent.tagUnitMap.hasOwnProperty(output)) {
						output = this.singleGraphComponent.tagUnitMap[output][field];
					}
				}
			}
		}
		
		return "[" + output + "]";
	}
	
	calculateXTicks () {
		this.numberOfThicks = Math.floor(this.width / this.refLegendWidth);
		var originalNumberOfThicks = this.numberOfThicks; 		
		while (this.numberOfThicks > 0) {
			this.g.append("g")
			.attr("class", "grid xLegendTicks")
			.attr("transform", "translate(0," + this.height + ")")
			.call(this.make_x_gridlines(this.x).tickSize(-this.height).tickFormat("").ticks(this.numberOfThicks));
			
			if (this.g.selectAll(".xLegendTicks > .tick").size() > originalNumberOfThicks) {
				this.g.selectAll(".xLegendTicks").remove();
				this.numberOfThicks--;
			} else {
				break;
			}
		}
		this.g.selectAll(".xLegendTicks").remove();
		
		var axisX = d3.axisBottom(this.x).tickSizeOuter(0);
		var ticksArray = axisX.scale().ticks(this.numberOfThicks);	
		
		if (!this.graphComponent.compareActivityMode && !this.isGraphInScanMode() && !this.isGraphInStabilizedScanMode()) {
			
			var step = (this.xRange[1] - this.xRange[0]) / ticksArray.length;
			var realStep;
			var mustChange = false;
			for (var i = 1; i < ticksArray.length; i++) {
				var tmpStep = ticksArray[i].getTime() - ticksArray[i - 1].getTime();
				var diff = Math.abs((step - tmpStep) / step);
				if (diff > 0.2) {
					mustChange = true;
				} else {
					realStep = tmpStep;
				}
			}
			
			if (mustChange) {
				if (realStep == null) {
					realStep = step;
				}
				var start = ticksArray[0].getTime();
				for (var i = 1; i < ticksArray.length; i++) {
					ticksArray[i] = new Date(start + realStep * i);
				}
			}
			
			for (var i = 0; i < ticksArray.length; i++) {
				var percent = (ticksArray[i].getTime() - this.xRange[0]) / (this.xRange[1] - this.xRange[0]);
				var space1 = this.width * percent;
				var space2 = this.width - (this.width * percent);
				
				if (space1 < this.refLegendWidth || space2 < this.refLegendWidth || ticksArray[i].getTime() < this.xRange[0] 
					|| ticksArray[i].getTime() > this.xRange[1]) {
					ticksArray.splice(i, 1);
					i--;
				}
			}
			
			ticksArray.splice(0, 0, new Date(this.xRange[0]));
			ticksArray.push(new Date(this.xRange[1]));
		} 
		
		this.ticksArray = ticksArray;
	}
	
	isGraphInScanMode () {
		return (this.graphComponent.filterInfo.enabled && this.graphComponent.filterInfo.mode === 'scan');
	}
	
	isGraphInStabilizedScanMode () {
		return (this.graphComponent.stabilizedTagsSelected && this.graphComponent.stabilizedScanMode);
    }

    extractXYGraphInfo () {

        this.extractTagGroups();

        var xInfo = {};
        var yInfos = [];
        var zInfo = null;

        for (var i = 0; i < this.tagsForGraph.length; i++) {
            var tagName = this.tagsForGraph[i].name;
            var tagIndex = this.tagValues.tagNamesList.indexOf(tagName);

            var tmp = {};
            tmp.name = tagName;
            tmp.index = tagIndex;
            if (this.tagsForGraph[i].formula) {
                tmp.formula = true;
			}
			var unit = this.tagsForGraph[i].tagInfo.unitDif ? this.tagsForGraph[i].tagInfo[this.graphComponent.pidUnitCol] : this.tagsForGraph[i].tagInfo[this.graphComponent.tagUnitCol];
            var conversionInfo = this.graphComponent.extractUnitConversionInfo(unit);
            tmp.conversionInfo = conversionInfo;
            tmp.color = this.tagsForGraph[i].color;
            tmp.width = 1;
            if (this.tagsForGraph[i].hasOwnProperty("lineSize") || this.tagsForGraph[i].hasOwnProperty("sizeFromSelection")) {
				if (this.tagsForGraph[i].lineSize && this.tagsForGraph[i].sizeFromSelection) {
					tmp.width = this.tagsForGraph[i].lineSize + this.tagsForGraph[i].sizeFromSelection;
				} else {
					tmp.width = this.tagsForGraph[i].lineSize || this.tagsForGraph[i].sizeFromSelection;
				}
            }

            try {
                if (this.singleGraphComponent.xyGraphOptions.axisMap[tagName].startsWith("X")) {
                    xInfo = tmp;
                } else if (this.singleGraphComponent.xyGraphOptions.axisMap[tagName].startsWith("Y")) {
                    if (this.tagsForGraph[i].active) {
                        var groupIndex = -1;
                        for (var k = 0; k < this.tagGroups.length; k++) {
                            for (var z = 0; z < this.tagGroups[k].length; z++) {
                                if (this.tagGroups[k][z].name === tmp.name) {
                                    groupIndex = k;
                                    break;
                                }
                            }
                        }
                        tmp.tagGroupIndex = groupIndex;
                        yInfos.push(tmp);
                    }
                } else if (this.singleGraphComponent.xyGraphOptions.axisMap[tagName].startsWith("Z")) {
                    zInfo = tmp;
                }
            } catch (err) {
                console.log(err);
            }            
        }

        if (this.singleGraphComponent.xyGraphOptions.axisMap.hasOwnProperty("timestamp") && 
            this.singleGraphComponent.xyGraphOptions.axisMap["timestamp"].startsWith("Z")) {

            var tmp = {};
            tmp.name = "timestamp";
            zInfo = tmp;
        }

        var pointsArray = [];
        for (var j = 0; j < yInfos.length; j++) {
            pointsArray.push([]);
        }

        var minZ = null;
        var maxZ = null;

        if (zInfo !== null) {

            if (this.singleGraphComponent.xyGraphOptions.manualZRange) {
                minZ = parseFloat(this.singleGraphComponent.xyGraphOptions.manualZRange[0]);
                maxZ = parseFloat(this.singleGraphComponent.xyGraphOptions.manualZRange[1]);
            } else {
                for (var i = 0; i < this.tagValues.tagDataRecords.length; i++) {
                    var zValue = null;

                    if (zInfo.name === "timestamp") {
                        zValue = this.tagValues.tagDataRecords[i].t;
                    } else {
                        if (!zInfo.formula) {
                            zValue = this.tagValues.tagDataRecords[i].v[zInfo.index];
                        } else {
                            zValue = this.tagValues.calculatedTags[zInfo.name][i]["OUTPUT"];
                        }
					}

                    if (zValue !== null) {

                        if (zInfo.name !== "timestamp") {
                            zValue = (zValue + zInfo.conversionInfo.unitOffset) 
                                * zInfo.conversionInfo.unitGain;
                        }                    
                                
                        if (minZ == null) {
                            minZ = zValue;
                            maxZ = zValue;
                        }

                        minZ = Math.min(minZ, zValue);
                        maxZ = Math.max(maxZ, zValue);
                    }
                }
            }
        }

        var zArray = [];
        for (var i = 0; i < this.tagValues.tagDataRecords.length; i++) {
            zArray.push(null);
        }

        for (var i = 0; i < this.tagValues.tagDataRecords.length; i++) {
            var xValue;
            if (!xInfo.formula) {
                xValue = this.tagValues.tagDataRecords[i].v[xInfo.index];
            } else {
                xValue = this.tagValues.calculatedTags[xInfo.name][i]["OUTPUT"];
            }

            if (xValue !== null) {
                xValue = (xValue + xInfo.conversionInfo.unitOffset) * xInfo.conversionInfo.unitGain;

                var zPresentButNull = false;
                zValue = null;
                if (zInfo !== null) {
                    if (zInfo.name === "timestamp") {
                    	if (this.tagValues.tagDataRecords[i].t != null) {
							zValue = this.tagValues.tagDataRecords[i].t;
						}
                    } else {
                        if (!zInfo.formula) {
                        	if (this.tagValues.tagDataRecords[i].v[zInfo.index] != null) {
								zValue = (this.tagValues.tagDataRecords[i].v[zInfo.index] + zInfo.conversionInfo.unitOffset)
									* zInfo.conversionInfo.unitGain;
							}
                        } else {
                        	if (this.tagValues.calculatedTags[zInfo.name][i]["OUTPUT"] != null) {
								zValue = (this.tagValues.calculatedTags[zInfo.name][i]["OUTPUT"] + zInfo.conversionInfo.unitOffset)
									* zInfo.conversionInfo.unitGain;
							}
                        }
                    }

                    if (zValue == null) {
                    	zPresentButNull = true;
					}
                }

                if (!zPresentButNull && (zValue === null || (zValue >= minZ && zValue <= maxZ))) {
                    for (var j = 0; j < yInfos.length; j++) {
                        var yValue;
                        if (!yInfos[j].formula) {
                            yValue = this.tagValues.tagDataRecords[i].v[yInfos[j].index];
                        } else {
                            yValue = this.tagValues.calculatedTags[yInfos[j].name][i]["OUTPUT"];
                        }

                        if (yValue !== null) {
                            yValue = (yValue + yInfos[j].conversionInfo.unitOffset) * yInfos[j].conversionInfo.unitGain;

                            var point = {};
                            point.x = xValue;
                            point.y = yValue;
                            point.t = this.tagValues.tagDataRecords[i].t;
                            point.index = j;
                            point.color = yInfos[j].color;
                            point.tagGroupIndex = yInfos[j].tagGroupIndex;
                            point.defined = true;
                            point.valid = (this.isGraphInScanMode() || this.graphComponent.filterInfo.enabled && this.graphComponent.filterInfo.mode === 'hide') 
                                ? this.tagValues.tagDataRecords[i].valid : true;
                            if (zValue !== null) {
                                point.z = ((zValue - minZ) / (maxZ - minZ));
								point.z = Math.max(Math.min(point.z, 1), 0);
                                zArray[i] = point.z;
                            }
                            pointsArray[j].push(point);
                        }     
                    }
                } 
            }
        }

        var xyInfo = {};
        xyInfo.pointsArray = pointsArray;
        xyInfo.yInfos = yInfos;
        xyInfo.xInfo = xInfo;

        if (zInfo !== null) {
            zInfo.minZ = minZ;
            zInfo.maxZ = maxZ;
            zInfo.zArray = zArray;
            xyInfo.zInfo = zInfo;
        }

        this.xyInfo = xyInfo;
    }

    calculateXYMaxMin () {
        var minX = null;
        var maxX = null;

        var minYArray = [];
        for (var i = 0; i < this.tagGroups.length; i++) {
            minYArray.push([null, null]);
        }

        var pointsArray = this.xyInfo.pointsArray;
        for (var i = 0; i < pointsArray.length; i++) {
            for (var j = 0; j < pointsArray[i].length; j++) {
                var point = pointsArray[i][j];

                if (point.t >= (this.xRange[0] - this.step) && point.t <= (this.xRange[1] + this.step)) {
                    if (point.valid) {
                        if (minX === null) {
                            minX = point.x;
                            maxX = point.x;
                        }
                        minX = Math.min(minX, point.x);
                        maxX = Math.max(maxX, point.x);

                        var index = point.tagGroupIndex;
                        if (minYArray[index][0] === null) {
                            minYArray[index][0] = point.y;
                            minYArray[index][1] = point.y;
                        }

						if(!isNaN(point.y)) {
							minYArray[index][0] = Math.min(minYArray[index][0], point.y);
							minYArray[index][1] = Math.max(minYArray[index][1], point.y);
						}
                    }
                }
            }
        }

		var paddingOffset = 13;

        if (minX === null && maxX === null) {
            minX = 0;
            maxX = 0;
        }

        if (minX === maxX) {
            minX -= 1;
            maxX += 1;
		}
		
		minX -= (maxX - minX) / paddingOffset;
		maxX += (maxX - minX) / paddingOffset;

        for (var i = 0; i < minYArray.length; i++) {
            if (minYArray[i][0] === null && minYArray[i][1] === null) {
                minYArray[i][0] = 0;
                minYArray[i][1] = 0;
            }

            if (minYArray[i][0] === minYArray[i][1]) {
                minYArray[i][0] -= 1;
                minYArray[i][1] += 1;
			}
			
			minYArray[i][0] -= (minYArray[i][1] - minYArray[i][0]) / paddingOffset;
			minYArray[i][1] += (minYArray[i][1] - minYArray[i][0]) / paddingOffset;
        }

        if (!this.xyGraphInfo) {
            this.xyGraphInfo = {};
        }

        if (!this.singleGraphComponent.xyGraphOptions.xLocked) {
            this.xyGraphInfo.minX = minX;
            this.xyGraphInfo.maxX = maxX;
        }

        if (!this.singleGraphComponent.yAxisLock) {
            this.xyGraphInfo.minYArray = minYArray;        
        }        
    }

    calculateTicks() {
        var tmpY = [];
        this.yTicks = [];
        for (var i = 0; i < this.xyGraphInfo.minYArray.length; i++) {
            var y = d3.scaleLinear().rangeRound([this.height, 0]);
            y.domain([this.xyGraphInfo.minYArray[i][0], this.xyGraphInfo.minYArray[i][1]]);
            var axisY = d3.axisLeft(y).tickSizeOuter(0);
            var ticksArray = axisY.scale().ticks();		
			var axisStep = ticksArray[1] - ticksArray[0];

            if (!this.singleGraphComponent.yAxisLock) {
                if (ticksArray[0] !== this.xyGraphInfo.minYArray[i][0]) {
                    var newTick = ticksArray[0] - axisStep;
                    ticksArray.splice(0, 0, newTick);
                    this.xyGraphInfo.minYArray[i][0] = newTick;
                }

                if (parseFloat(ticksArray[ticksArray.length - 1]) !== parseFloat(this.xyGraphInfo.minYArray[i][1])) {
                    var newTick = ticksArray[ticksArray.length - 1] + axisStep;
                    ticksArray.push(newTick);
                    this.xyGraphInfo.minYArray[i][1] = newTick;
                }
            }

            y = d3.scaleLinear().rangeRound([this.height, 0]);
            y.domain([this.xyGraphInfo.minYArray[i][0], this.xyGraphInfo.minYArray[i][1]]);
            tmpY.push(y);

            for (var j = 0; j < ticksArray.length; j++) {
                ticksArray[j] = Math.round(1000 * ticksArray[j])/1000;
            }
            this.yTicks.push(ticksArray);
        }
        this.y = tmpY;

        var x = d3.scaleLinear().rangeRound([0, this.width]);
		x.domain([this.xyGraphInfo.minX, this.xyGraphInfo.maxX]);
		var axisX = d3.axisBottom(x).tickSizeOuter(0);

		ticksArray = axisX.scale().ticks();
		var longestString = "";
		for (var i = 0; i < ticksArray.length; i++) {
			if (ticksArray[i].toString().length > longestString.length) {
				longestString = ticksArray[i].toString();
			}
		}
		
		var textWidth = this.getTextWidth(longestString, this.tickFontSize, 'GEInspiraSans');
		var elementWidth = textWidth * 2;
 
		var numberOfThicks = Math.floor(this.width / elementWidth);
		if (numberOfThicks <= 0) {
			numberOfThicks = 2;
		}
        ticksArray = axisX.scale().ticks(numberOfThicks);		
		axisStep = ticksArray[1] - ticksArray[0];
		
		if (!this.singleGraphComponent.xyGraphOptions.xLocked) {
			if (parseFloat(ticksArray[0]) !== parseFloat(this.xyGraphInfo.minX)) {
				var newTick = ticksArray[0] - axisStep;
				ticksArray.splice(0, 0, newTick);
				this.xyGraphInfo.minX = newTick;
			}
	
			if (parseFloat(ticksArray[ticksArray.length - 1]) !== parseFloat(this.xyGraphInfo.maxX)) {
				var newTick = ticksArray[ticksArray.length - 1] + axisStep;
				ticksArray.push(newTick);
				this.xyGraphInfo.maxX = newTick;
			}
		}

        for (var i = 0; i < ticksArray.length; i++) {
            ticksArray[i] = Math.round(1000 * ticksArray[i])/1000;
        }
        this.xTicks = ticksArray;
    }
    
    redrawGraphXY() {
        this.cleanGraph();

        var self = this;
        var leftYAxis = 1;
        var rightYAxis = 1;

        var leftYAxis = this.graphComponent.getNumberOfLeftYAxis();
		var rightYAxis = this.graphComponent.getNumberOfRightYAxis();
		var space = (this.graphComponent.showLabels() === "true") ? this.yAxisLargeSpace : this.yAxisSpace;
                
        // DEFINE SVG PROPERTIES
        var margin = {
            top: graphTopMargin * 3.5,
            right: space * rightYAxis,
            bottom: graphTopMargin * 2,
            left: space * leftYAxis
		};
		
		var wrapperWidth = this.graphWrapper.offsetWidth;
		var wrapperHeight = this.graphWrapper.offsetHeight;
		
		if (this.singleGraphComponent.xyGraphOptions.hasOwnProperty("backgroundImageOptions")) {
			if (this.singleGraphComponent.xyGraphOptions.backgroundImageOptions.preserveRatio) {
				var dimensions = this.singleGraphComponent.xyGraphOptions.backgroundImageOptions.imageDimensions;
				
				var originalRatio = wrapperHeight / wrapperWidth;
				var imageRatio = dimensions.h / dimensions.w ;

				if (imageRatio > originalRatio) {
					wrapperWidth = wrapperHeight / imageRatio;
				} else {
					wrapperHeight = imageRatio * wrapperWidth;
				}
			}
		}

        this.width = wrapperWidth - margin.left - margin.right;
        this.height = wrapperHeight - margin.top - margin.bottom;
        this.margin = margin;

        this.calculateTicks();

        this.svg.attr("width", this.graphWrapper.offsetWidth);
        this.svg.attr("height", this.graphWrapper.offsetHeight);
        
        this.svg.attr("viewBox", "0 0 " + 
                this.graphWrapper.offsetWidth + " " + 
                this.graphWrapper.offsetHeight)
                .attr("preserveAspectRatio", "none");

        this.g = this.svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // DEFINE CURSOR SVG
        this.cursorSvg = d3.select(this.singleGraphComponent.$refs.cursorSvg);
        this.cursorSvg.attr("width", this.graphWrapper.offsetWidth);
        this.cursorSvg.attr("height", this.graphWrapper.offsetHeight);
        
        this.cursorSvg.attr("viewBox", "0 0 " + 
                this.graphWrapper.offsetWidth + " " + 
                this.graphWrapper.offsetHeight)
                .attr("preserveAspectRatio", "none");

		this.cursorG = this.cursorSvg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        // DEFINE X AXIS
        this.x = d3.scaleLinear().rangeRound([0, this.width]);
        this.x.domain([this.xyGraphInfo.minX, this.xyGraphInfo.maxX]);

        // DRAW Y LABELS
		this.drawYLabels();

		this.g.append("defs").append("svg:clipPath")
	        .attr("id", "clip" + this.index)
	        .append("svg:rect")
	        .attr("id", "clip-rect")
	        .attr("x", 0)
	        .attr("y", 0)
	        .attr("width", this.width)
	        .attr("height", this.height);

		// DRAW BACKGROUND IMAGE
		if (this.singleGraphComponent.xyGraphOptions.hasOwnProperty("backgroundImageOptions")) {

			var x = 0, y = 0;
			var imageWidth = this.width, imageHeight = this.height;

			if (this.singleGraphComponent.xyGraphOptions.backgroundImageOptions.anchorToAxis) {
				x = this.x(this.singleGraphComponent.xyGraphOptions.backgroundImageOptions.xRange[0]);
				imageWidth = this.x(this.singleGraphComponent.xyGraphOptions.backgroundImageOptions.xRange[1]) - x;

				y = this.y[0](this.singleGraphComponent.xyGraphOptions.backgroundImageOptions.yRange[1]);
				imageHeight = this.y[0](this.singleGraphComponent.xyGraphOptions.backgroundImageOptions.yRange[0]) - y;
			}

			this.g.append("image")
				.attr("width", imageWidth) 
				.attr("height", imageHeight) 
				.attr("x", x)
        		.attr("y", y)
				.attr("preserveAspectRatio", "none")
				.attr("xlink:href", this.singleGraphComponent.xyGraphOptions.backgroundImageOptions.imageFile)
				.attr("clip-path", "url(#clip" + this.index + ")");
		}
		
		// DRAW TIMESTAMP HIGHLIGHT RECTS
		if (this.graphComponent.hightlightTimestampInfo.hasOwnProperty("xValues")) {
			var timestampInfo = this.graphComponent.hightlightTimestampInfo;
			for (var i = 0; i < this.xyInfo.pointsArray.length; i++) {
				if (this.xyInfo.pointsArray[i].length > 0 && this.xyInfo.pointsArray[i][0]) {
					var tagGroupIndex = this.xyInfo.pointsArray[i][0].tagGroupIndex;

					var x0 = this.x(timestampInfo.xValues[0]);
					var width = this.x(timestampInfo.xValues[1]) - x0;
					var y0 = this.y[tagGroupIndex](timestampInfo.yValues[tagGroupIndex][1]);
					var height = this.y[tagGroupIndex](timestampInfo.yValues[tagGroupIndex][0]) - y0;

					if (x0 < 0) {
						width = width + x0;
						x0 = 0;
					}
					if (x0 + width > this.width) {
						width = this.width - x0;
					}
					if (y0 < 0) {
						height = height + y0;
						y0 = 0
					}
					if (y0 + height > this.height) {
						height = this.height - y0;
					}

					if (width > 0 && height > 0) {
						this.g.append("rect")
							.attr("x", x0)
							.attr("y", y0)
							.attr("width", width)
							.attr("height", height)
							.attr("fill", this.hightlightTimestampBackgroundColor);
						break;
					}
				}
			}
		}

        // DRAW GRIDLINES
		this.g.append("g")
		.attr("class", "grid")
		.call(this.make_y_gridlines(this.y[0]).tickSize(-this.width).tickFormat(""));
		
		this.g.append("g")
		.attr("class", "grid xLegendTicks")
		.attr("transform", "translate(0," + this.height + ")")
        .call(this.make_x_gridlines(this.x).tickSize(-this.height).tickFormat(""));

        
        // DRAW X LABELS		
        var bigNumbers = false;
        var maxDecimalPlaces = 0;
        for (var j = 0; j < this.xTicks.length; j++) {
            if (Math.abs(this.xTicks[j]) >= 1000000) {
                bigNumbers = true;
                break;
            } else {
                maxDecimalPlaces = Math.max(maxDecimalPlaces, self.countDecimals(this.xTicks[j]));
            }
        }

        var xAxisCall;
        if (bigNumbers) {
            xAxisCall = d3.axisBottom(this.x).tickSizeOuter(0).tickValues(this.xTicks).tickFormat(d3.format(".1e"));
        } else {
            xAxisCall = d3.axisBottom(this.x).tickSizeOuter(0).tickValues(this.xTicks).tickFormat(d3.format("." + maxDecimalPlaces + "f"));
        }

		var xAxisWrapper = this.cursorG.append("g")
            .attr("transform", "translate(0," + this.height + ")")
            .attr("class", "axis--x");
        
        xAxisWrapper.on("dblclick", function () {
	        self.singleGraphComponent.openXRangeModal();
        });

        xAxisWrapper.call(xAxisCall)
            .append("text")
            .attr("fill", "#000")
            .attr("y", 0)
            .select(".domain")
            .remove();

        this.cursorG.selectAll(".axis--x .tick").attr("class", "tick xTicks");

        this.drawXYPoints();

        // DRAW TIMESTAMP CIRCLES
        this.timestampCircles = [];
        for (var i = 0; i < this.xyInfo.yInfos.length; i++) {
            var tmp = this.cursorG.append("circle")
                .attr("class", "timestamp-circle1 ")
                .datum({"tag": this.xyInfo.yInfos[i].name})
                .attr("cx", 10)
                .attr("cy", 10)
                .attr("r", 7)
                .style("fill", this.xyInfo.yInfos[i].color)
                .style("stroke", this.lineColor)
                .style("stroke-width", 2);
            
            this.timestampCircles.push(tmp);            
        }        

        if (this.graphComponent.lastTimestampValue != -1) {
			try {
				this.moveCursorLine(this.graphComponent.lastTimestampValue);
			}
			catch(error) {
				
			}
        }
        
        this.timestampCircles2 = [];
        if (this.graphComponent.doubleCursor) {
            for (var i = 0; i < this.xyInfo.yInfos.length; i++) {
                var tmp = this.cursorG.append("circle")
                    .attr("class", "timestamp-circle1 ")
                    .datum({"tag": this.xyInfo.yInfos[i].name})
                    .attr("cx", 10)
                    .attr("cy", 10)
                    .attr("r", 7)
                    .style("fill", this.xyInfo.yInfos[i].color)
                    .style("stroke", this.lineColor2)
                    .style("stroke-width", 2);
                
                this.timestampCircles2.push(tmp);            
            }

            if (this.graphComponent.lastTimestampValue2 != -1) {
                try {
                    this.moveCursorLine(this.graphComponent.lastTimestampValue2, true);
                }
                catch(error) {
                    
                }
            }
        }

        this.registerEventsXYGraph();
    }

    drawXYPoints () {
        var self = this;

        // DEFINE CANVAS
        this.canvas = d3.select(this.singleGraphComponent.$refs.plotCanvas);
        this.canvas.attr("width", this.width)
        .attr("height", this.height)
        .style("transform", "translate(" + (this.margin.left) +
			"px" + "," + (this.margin.top) + "px" + ")");

        var context = this.canvas.node().getContext('2d');
        this.canvasContext = context;
		context.clearRect(0, 0, this.width, this.height);

		// DRAW POINTS
        for (var i = 0; i < this.xyInfo.pointsArray.length; i++) {
            if (this.xyInfo.pointsArray[i].length > 0 && this.xyInfo.pointsArray[i][0]) {

                var color = this.xyInfo.pointsArray[i][0].color

                var pointSize = this.xyInfo.yInfos[i].width;
                context.strokeWidth = 0;

                var isGhostMode = self.singleGraphComponent.xyGraphOptions.ghostMode;
                var points = self.xyInfo.pointsArray[i];
                if (points) {
                    points.forEach(function(point) {
                        if(point.t >= (self.xRange[0] - self.step) && 
                            point.t <= (self.xRange[1] + self.step) &&
                            point.defined && point.valid) {
                            context.fillStyle = color;
                            context.strokeStyle = color;
                            
                            var shouldDraw = true;
                            if (point.hasOwnProperty('z')) {
                                var isInsideRange = point.z >= self.singleGraphComponent.getZRanges()[0] && point.z <= self.singleGraphComponent.getZRanges()[1];
                                
                                if ((isInsideRange && !isGhostMode) || (isGhostMode && !isInsideRange)) {
                                    var tmpValue = (self.singleGraphComponent.xyGraphOptions.reverseZ) ? (1 - point.z) : (point.z);
									var tmpColor;
									tmpColor = getColorForPercentage(tmpValue);
                                    if (isGhostMode) {
                                        tmpColor = self.ghostModeLightPointColor;
                                    } else {
                                        tmpColor = getColorForPercentage(tmpValue);
                                    }                                   
                                    context.fillStyle = tmpColor;
                                    context.strokeStyle = tmpColor;                                    
                                } else {
                                    shouldDraw = false;
                                }                                
                            }

                            if (shouldDraw) {
                                var cx = self.x(point.x);
                                var cy = self.y[point.tagGroupIndex](point.y);
                                context.beginPath();
                                context.arc(cx, cy, pointSize, 0, 2 * Math.PI);
                                context.closePath();
                                context.fill();
                                context.stroke();
                            }
                        }
                    });

                    if (isGhostMode) {
                        points.forEach(function(point) {
                            if(point.t >= (self.xRange[0] - self.step) && 
                                point.t <= (self.xRange[1] + self.step) &&
                                point.defined && point.valid) {
                                context.fillStyle = color;
                                context.strokeStyle = color;
                                
                                var shouldDraw = true;
                                if (point.hasOwnProperty('z')) {
									var isInsideRange = point.z >= self.singleGraphComponent.getZRanges()[0] && point.z <= self.singleGraphComponent.getZRanges()[1];
									var tmpValue = (self.singleGraphComponent.xyGraphOptions.reverseZ) ? (1 - point.z) : (point.z);
                                    
                                    if ((isGhostMode && isInsideRange)) {
                                        var tmpColor = getColorForPercentage(tmpValue);                                   
                                        context.fillStyle = tmpColor;
                                        context.strokeStyle = tmpColor;                                    
                                    } else {
                                        shouldDraw = false;
                                    }                                
                                }

                                if (shouldDraw) {
                                    var cx = self.x(point.x);
                                    var cy = self.y[point.tagGroupIndex](point.y);
                                    context.beginPath();
                                    context.arc(cx, cy, pointSize, 0, 2 * Math.PI);
                                    context.closePath();
                                    context.fill();
                                    context.stroke();
                                }
                            }
                        });
                    }
                }                
            }
        }
    }

    registerEventsXYGraph() {
		var self = this;
		
		if (this.width <= 0 || this.height <= 0) {
			return;
		}

		this.cursorG.append("g").attr("class", "zoomRectDrawArea");
        this.mouseG = this.cursorG.append("g").attr("class", "mouse-over-effects crosshair-cursor");
		var actionDiv = d3.select(this.actionDiv);
		var zoomActionDiv = d3.select(this.zoomActionDiv);
        
        this.mouseG.append('svg:rect')
		.attr('width', this.width)
		.attr('height', this.height)
		.attr('fill', 'none')
		.attr('pointer-events', 'all')
		.on("contextmenu", function () {
			d3.event.preventDefault();
			
			if (d3.selectAll(".zoomRect").size() > 0) {
				d3.selectAll(".zoomRect").remove();
			} else {
				actionDiv.attr("hidden", null);
				var rect = actionDiv.node().getBoundingClientRect();
				
				actionDiv
					.style("left", (d3.event.pageX - rect.width * 0.65) + "px")		
					.style("top", (d3.event.pageY - rect.height * 1) + "px")
				actionDiv.transition()		
					.duration(200)		
					.style("opacity", 1);
			}
		})
		.on("mousedown", function () {
			d3.event.stopPropagation();
			
			if (d3.event.button) {
				return;
			}
			
			var zoomRect = d3.select(this.parentNode.parentNode).select(".zoomRect");
			if (zoomRect.empty()) {
				
				var mouse = d3.mouse(this);
				var x, y, width, height, start;
				x = mouse[0];
				y = mouse[1];
				width = 1;
				height = 1;
				self.zoomActionClicked = false;
				
				d3.select(this.parentNode.parentNode).select(".zoomRectDrawArea").append("rect")
					.attr("x", x)
					.attr("y", y)
					.attr("width", width)
					.attr("height", height)
					.attr("fill", "#0000FF44")
					.attr("class", "zoomRect")
					.attr("startX", x)
					.attr("startY", y)
			} else {
				zoomActionDiv.attr("hidden", null);
				var rect = zoomActionDiv.node().getBoundingClientRect();
				
				zoomActionDiv
					.style("left", (d3.event.pageX - rect.width * 0.65) + "px")		
					.style("top", (d3.event.pageY - rect.height * 2) + "px")
				zoomActionDiv.transition()		
					.duration(200)		
					.style("opacity", 1);
			}
		})
		.on('mousemove', function () {
			if (!self.graphComponent.isDraggingGraphWidth) {
				d3.event.stopPropagation();
				var mouse = d3.mouse(this);

				var s = d3.select(this.parentNode.parentNode).select(".zoomRect");
				
				if (!s.empty()) {
					var startX = s.attr("startX");
					var startY = s.attr("startY");
					var endX = mouse[0];
					var endY = mouse[1];
					
					var x = startX;
					var y = startY;
					var width = Math.abs(endX - x - 1);
					var height = Math.abs(endY - y - 1);

					if (endX < startX) {
						x = endX;
					}

					if (endY < startY) {
						y = endY;
					}
					

					d3.select(".zoomRect")
						.attr("x", x)
						.attr("y", y)
						.attr("width", width)
						.attr("height", height);					
				}
			}			
		});

        zoomActionDiv
		.on("mouseout", function() {
			var boundingRect = zoomActionDiv.node().getBoundingClientRect();
			if (d3.event.pageX < boundingRect.left || d3.event.pageX > (boundingRect.left + boundingRect.width) || 
					d3.event.pageY < boundingRect.top || d3.event.pageY > (boundingRect.top + boundingRect.height)) {
					
					if (!self.zoomActionClicked) {
						d3.selectAll(".zoomRect").remove();
					}
					
					zoomActionDiv.transition()		
						.duration(500)		
						.style("opacity", 0)
						.on("end", function() { zoomActionDiv.attr("hidden",true); });
			}
		});

		actionDiv
		.on("mouseout", function() {
			var boundingRect = actionDiv.node().getBoundingClientRect();
			if (d3.event.pageX < boundingRect.left || d3.event.pageX > (boundingRect.left + boundingRect.width) || 
					d3.event.pageY < boundingRect.top || d3.event.pageY > (boundingRect.top + boundingRect.height)) {
				actionDiv.transition()		
					.duration(500)		
					.style("opacity", 0)
					.on("end", function() { actionDiv.attr("hidden",true); });
			}
			
		});
    }

    extractTagGroups() {
        var tagGroups = [];
		
		if (!this.singleGraphComponent.multipleYAxis) {
			var tmp = [];
			for (var i = 0; i < this.tagsForGraph.length; i++) {
				tmp.push(this.tagsForGraph[i]);
			}
			tagGroups.push(tmp);
		} else {
			var tmpTagGroups = this.singleGraphComponent.tagGroups;
			for (var i = 0; i < tmpTagGroups.length; i++) {
				var tmp = [];
				
				for (var j = 0; j < tmpTagGroups[i].length; j++) {
					for (var k = 0; k < this.tagsForGraph.length; k++) {
						var tagName = this.tagsForGraph[k].name;
						if (this.graphComponent.compareActivityMode) {
							tagName = tagName.split(" ")[0];
						}
						
						if (tagName === tmpTagGroups[i][j]['centralTagName']) {
							tmp.push(this.tagsForGraph[k]);
						}
					}
				}
				
				tagGroups.push(tmp);
			}
		}
		this.tagGroups = tagGroups;
    }

    drawYLabels () {
        var self = this;
        var drawSurfate = this.g;
        if (this.singleGraphComponent.graphType == 'xy') {
            drawSurfate = this.cursorG;
        }


        // DRAW Y LABELS
		for (var i = 0; i < this.y.length; i++) {
			
			if (this.tagGroups[i].length > 0) {
				var yAxis;
				if (i < numberOfYAxis/2) {
					yAxis = d3.axisLeft(this.y[i]);
				} else {
					yAxis = d3.axisRight(this.y[i]);
				}
				
                var ticks;
                if (this.singleGraphComponent.graphType === 'timeseries') {
                    ticks = yAxis.scale().ticks();                    
                } else {
                    ticks = this.yTicks[i];
                }

                var bigNumbers = false;
                for (var j = 0; j < ticks.length; j++) {
                    if (Math.abs(ticks[j]) >= 1000000) {
                        bigNumbers = true;
                        break;
                    }
                }
                
                if (bigNumbers) {
                    yAxis.tickSizeOuter(0)
                    .tickFormat(d3.format(".1e"));
                } else {
                    yAxis.tickSizeOuter(0)
                    .tickFormat(function(d) 
                    { 
                        // var ticks = yAxis.scale().ticks();
                        var maxDecimalPlaces = 0;
                        var maxLength = 0;
                        for (var j = 0; j < ticks.length; j++) {
                            maxDecimalPlaces = Math.max(maxDecimalPlaces, self.countDecimals(ticks[j]));
                            maxLength = Math.max(maxLength, ticks[j].toString().replace(".", "").length);
                        }
                        
                        return d3.format("." + maxDecimalPlaces + "f")(d); 
                    });
                }

                if (this.singleGraphComponent.graphType == 'xy') {
                    yAxis.tickSizeOuter(0).tickValues(this.yTicks[i]);
                }
				
				var yAxisWrapper = drawSurfate.append("g")
					.datum({"yAxisId": i})
					.style("font-size", "9px")
					.attr("class", "yAxisWrapper");
				
				var space = (this.graphComponent.showLabels() === "true") ? this.yAxisLargeSpace : this.yAxisSpace; 
				
				if (i < numberOfYAxis/2) {
					yAxisWrapper.attr("transform", "translate( " + (-space * i) + ", 0 )");
				} else {
					yAxisWrapper.attr("transform", "translate( " + (this.width + space * (i - numberOfYAxis/2)) + ", 0 )");
				}
					
				yAxisWrapper.on("dblclick", function () {
                    var yAxisId = this.__data__["yAxisId"];
                    self.singleGraphComponent.openYRangeModal(yAxisId);
                });			
				
				yAxisWrapper.call(yAxis)
					.append("text")
					.attr("fill", "#000")
					.attr("transform", "rotate(-90)")
					.attr("y", 6)
					.attr("dy", "1.91em")
					.attr("text-anchor", "end");
				
				drawSurfate.selectAll(".yAxisWrapper .tick").attr("class", "tick yTicks");
				
				if (this.singleGraphComponent.multipleYAxis && this.graphComponent.showLabels() === "true") {
					// DRAW AXIS LEGENDS
					var axisText = "";
					if (this.singleGraphComponent.labelOptions.description) {
						var toAdd = (this.singleGraphComponent.axisDescriptions[i] == null) ? "" : this.singleGraphComponent.axisDescriptions[i];
						axisText += " " + toAdd;
					}
					if (this.singleGraphComponent.labelOptions.unit) {
						axisText += " " + this.getAxisUnit(i);
					}
										
					var unitFontSize = "12px";
					var textWidth = this.getTextWidth(axisText, unitFontSize, "GEInspiraSans");
					
					var x;
					if (i < numberOfYAxis/2) {
						x = -space * i - (space / 2);
					} else {
						x = this.width + space * (i - numberOfYAxis/2);
					}	
					
					var rectWidth = this.yAxisSpace/3;
					var rectHeigth = this.yAxisSpace/8;
					var rectSpace = this.yAxisSpace/8;
					var totalHeight = textWidth;
					if (this.singleGraphComponent.labelOptions.colors) {
						totalHeight += (rectHeigth + rectSpace) * this.tagGroups[i].length;
					}
					
					var backgroundRectWidth = rectWidth * 1.5;
					var backgroundRectHeight = (totalHeight) * 1.2;
					
					var backgroundRectY = (this.height / 2) - backgroundRectHeight / 2 + rectSpace / 2;
					if (i >= numberOfYAxis/2) {
						backgroundRectY = (this.height / 2) - backgroundRectHeight / 2 - rectSpace / 2;
					}
					
					var x;
					if (i < numberOfYAxis/2) {
						x = -space * (i + 1) + backgroundRectWidth/2;
					} else {
						x = this.width + space * (i - numberOfYAxis/2) + space * 5 / 6 - rectWidth;
					}
					
					drawSurfate.append("rect")
					.attr("x", x - (backgroundRectWidth - rectWidth) / 2)
					.attr("y", backgroundRectY)
					.attr("width", backgroundRectWidth)
					.attr("height", backgroundRectHeight)
					.attr("fill", "white")
					.attr("stroke", "#4a4a4a")
					.attr("fill-opacity", "0.85")
					.attr("stroke-opacity", "1");
					
					if (this.singleGraphComponent.labelOptions.colors) {
						for (var j = 0; j < this.tagGroups[i].length; j++) {
							var tmpY =  (this.height / 2) + (totalHeight / 2) - j * (rectHeigth + rectSpace) - rectHeigth;
							if (i >= numberOfYAxis/2) {
								tmpY =  (this.height / 2) - (totalHeight / 2) + j * (rectHeigth + rectSpace);
							}
							
							drawSurfate.append("rect")
								.attr("x", x)
								.attr("y", tmpY)
								.attr("width", rectWidth)
								.attr("height", rectHeigth)
								.attr("fill", this.tagGroups[i][j].color);
						}
					}					
					
					var rotateValue = -90;
					var textY = x;
					var textX = - (this.height / 2) - totalHeight / 2;
					if (this.singleGraphComponent.labelOptions.colors) {
						textX += (rectHeigth + rectSpace) * this.tagGroups[i].length;
					}
					if (i >= numberOfYAxis/2) {
						rotateValue = 90;
						textY = - this.width - space * (i - numberOfYAxis/2) - space * 5 / 6;
						textX = this.height / 2 - (totalHeight / 2);
						if (this.singleGraphComponent.labelOptions.colors) {
							textX += (rectHeigth + rectSpace) * this.tagGroups[i].length;
						}
					}
					
					drawSurfate.append("text")
				      .attr("y", textY)
				      .attr("x", textX)
				      .attr("transform", "rotate(" + rotateValue + ")")
				      .attr("dy", "1em")
				      .style("text-anchor", "start")
				      .style("font-size", unitFontSize)
				      .style("font-weight", "bold")
				      //.attr("fill", "white")
				      .text(axisText);
				}
			}
        }
    }

    getGraphInfoToSave() {
        var output;

        if (this.singleGraphComponent.graphType == 'xy') {
            output = [this.xyGraphInfo.minX, this.xyGraphInfo.maxX, this.xyGraphInfo.minYArray];            
        } else if (this.singleGraphComponent.graphType == 'polar') {
			output = this.polarInfo;
		} else {
            output = this.yRange;
        }

        return output;
    }

    checkGraphInfoToLoad() {
        if (this.singleGraphComponent.temporaryGraphInfo !== null) {
			var tmp = this.singleGraphComponent.temporaryGraphInfo;
            if (this.singleGraphComponent.graphType == 'xy') {
                this.xyGraphInfo.minX = tmp[0];
                this.xyGraphInfo.maxX = tmp[1];
                this.xyGraphInfo.minYArray = tmp[2];
            } else if (this.singleGraphComponent.graphType == 'polar') {
				this.polarInfo = tmp;
			} else {
                this.yRange = tmp;
            }
            this.singleGraphComponent.temporaryGraphInfo = null;
        }
	}
	
	applyXyRectZoom() {
		this.zoomActionClicked = true;
		var rect = d3.select(".zoomRect");

		try {
			var x0 = parseInt(rect.attr("x"));
			var y0 = parseInt(rect.attr("y"));
			var x1 = x0 + parseInt(rect.attr("width"));
			var y1 = y0 + parseInt(rect.attr("height"));

			x0 = this.x.invert(x0);
			x1 = this.x.invert(x1);
			
			this.xyGraphInfo.minX = x0;
			this.xyGraphInfo.maxX = x1;

			var yArray = this.xyGraphInfo.minYArray;
			for (var i = 0; i < yArray.length; i++) {
				var tmpY0 = this.y[i].invert(y0);
				var tmpY1 = this.y[i].invert(y1);
				yArray[i] = [tmpY1, tmpY0];
			}
			this.xyGraphInfo.minYArray = yArray;

			this.redrawGraphXY();
		} catch (err) {

		}
		
		d3.selectAll(".zoomRect").remove();		
	}

	extractRectTimestamps() {
		this.zoomActionClicked = true;
		var rect = d3.select(".zoomRect");
		var output = {};

		try {
			var x0 = parseInt(rect.attr("x"));
			var y0 = parseInt(rect.attr("y"));
			var x1 = x0 + parseInt(rect.attr("width"));
			var y1 = y0 + parseInt(rect.attr("height"));

			x0 = this.x.invert(x0);
			x1 = this.x.invert(x1);
			output.xValues = [x0, x1];
			output.yValues = [];

			for (var i = 0; i < this.y.length; i++) {
				var tmpY0 = this.y[i].invert(y0);
				var tmpY1 = this.y[i].invert(y1);
				output.yValues.push([tmpY1, tmpY0]);
			}

			output.timestamps = [];

			for (var i = 0; i < this.xyInfo.pointsArray.length; i++) {
				var points = this.xyInfo.pointsArray[i];

				if (points) {
					points.forEach(function(point) {
						var tmpX = point.x;
						var tmpY = point.y;

						if (tmpX >= x0 && tmpX <= x1 && tmpY >= output.yValues[point.tagGroupIndex][0] && tmpY <= output.yValues[point.tagGroupIndex][1]) {
							output.timestamps.push(point.t);
						}
					});
				}
			}
			output.timestamps.sort();

		} catch (err) {
			console.log(err);
			output = null;
		}

		d3.selectAll(".zoomRect").remove();		
		return output;
	}

	drawPolarGraph() {
		this.cleanGraph();

		var self = this;
		var textSize = 10;

		var leftYAxis = this.graphComponent.getNumberOfLeftYAxis();
		var rightYAxis = this.graphComponent.getNumberOfRightYAxis();
		var space = (this.graphComponent.showLabels() === "true") ? this.yAxisLargeSpace : this.yAxisSpace;
				
		// DEFINE SVG PROPERTIES
		var margin = {
			top: graphTopMargin * 3.5,
			right: space * rightYAxis,
			bottom: graphTopMargin * 2,
			left: space * leftYAxis
		};
		this.width = this.graphWrapper.offsetWidth - margin.left - margin.right;
		this.height = this.graphWrapper.offsetHeight - margin.top - margin.bottom;
		this.margin = margin;

		this.svg.attr("width", this.graphWrapper.offsetWidth);
		this.svg.attr("height", this.graphWrapper.offsetHeight);

		this.svg.attr("viewBox", "0 0 " + 
				this.graphWrapper.offsetWidth + " " + 
				this.graphWrapper.offsetHeight)
				.attr("preserveAspectRatio", "none");

		this.g = this.svg.append("g").attr("transform", 
			"translate(" + this.graphWrapper.offsetWidth / 2 + "," + this.graphWrapper.offsetHeight / 2 + ")");

		var fullCircle = 2 * Math.PI;
		var outerRadius = (Math.min(this.width, this.height) * 8 / 10) / 2;
		var innerRadius = 10;

		var dataArray = [];
		var timestampArray = [this.graphComponent.lastTimestampIndex];
		var lineColorArray = [this.lineColor];
		var sizeArray = ["1px"];

		var tagDataRecords = this.graphComponent.tagValues.tagDataRecords;
		var minY = null, maxY = null;

		if (this.graphComponent.doubleCursor) {
			timestampArray.push(this.graphComponent.lastTimestampIndex2);
			lineColorArray.push(this.lineColor2);
			sizeArray.push((this.graphComponent.secondCursorLocked) ? '2px' : '1px')
		}

		var timestampInfoToPrint = JSON.parse(JSON.stringify(this.graphComponent.timestampTextForPolar));
		var timestampFontSize = 13;

		for (var i = 0; i < timestampInfoToPrint.length; i++) {
			var timestampWidth = self.getTextWidth(timestampInfoToPrint[i].date, timestampFontSize + "px", 'GEInspiraSans');
			this.g.append("text")
				.attr("x", self.width / 2 - timestampWidth - 20)
				.attr("y", -outerRadius + timestampFontSize * (i + 1) + timestampFontSize * 0.5 * i)
				.style("font-size", timestampFontSize)
				.style("font-weight", "bold")
				.style('fill', timestampInfoToPrint[i].color)
				.text(timestampInfoToPrint[i].date + " - " + timestampInfoToPrint[i].timezone);
		}

		for (var z = 0; z < timestampArray.length; z++) {
			var timestampIndex = timestampArray[z];
			var counter = 0;
			var data = [];

			for (var i = 0; i < this.tagsForGraph.length; i++) {
				var tagName = this.tagsForGraph[i].name;
				var tagIndex = this.tagValues.tagNamesList.indexOf(tagName);

				var record = {};
				record.index = counter;
				record.tagListIndex = i;

				var value = null;

				if (this.tagsForGraph[i].active) {
					if (this.tagsForGraph[i].formula) {
						value = this.tagValues.calculatedTags[this.tagsForGraph[i].name][timestampIndex]["OUTPUT"];
					} else {
						value = tagDataRecords[timestampIndex].v[tagIndex];
					}
	
					if (value !== null) {
						var unit = this.tagsForGraph[i].tagInfo.unitDif ? this.tagsForGraph[i].tagInfo[this.graphComponent.pidUnitCol] : this.tagsForGraph[i].tagInfo[this.graphComponent.tagUnitCol];
						var conversionInfo = this.graphComponent.extractUnitConversionInfo(unit);
						value = (value + conversionInfo.unitOffset) * conversionInfo.unitGain;
					}
				}				

				if (Number.isNaN(value)) {
					value = null;
				}
				
				if (value !== null) {
					if (minY === null) {
						minY = value;
					}
					minY = Math.min(value, minY);
	
					if (maxY === null) {
						maxY = value;
					}
					maxY = Math.max(value, maxY);
				}			

				record.value = value;

				data.push(record);
				counter++;			
			}
			data.push(JSON.parse(JSON.stringify(data[0])));
			data[data.length - 1].index = data.length - 1;

			dataArray.push(data);
		}

		if (minY === null && maxY === null) {
            minY = 0;
            maxY = 0;
        }

        if (minY === maxY) {
            minY -= 1;
            maxY += 1;
		}

		var paddingOffset = 10;
		minY -= (maxY - minY) / paddingOffset;
		maxY += (maxY - minY) / paddingOffset;

		var x = d3.scaleLinear().range([0, fullCircle]);
		var y = d3.scaleLinear().range([innerRadius, outerRadius]);

		var line = d3.lineRadial()
    		.angle(function(d) { 
				var output = x(d.index);
				if (self.singleGraphComponent.polarGraphOptions.direction === "counterclockwise") {
					output = Math.PI * 2 - output;
				}
				return output; 
			})
			.radius(function(d) { 
				var output = y(d.value);
				if (output < 0) {
					output = 0;
				}
				return output; 
			})
			.defined(function(d) {
				return d.value !== null;
			});

		var polarInfo = {"range": [minY, maxY]};
		if (this.polarInfo === null || !this.singleGraphComponent.yAxisLock) {
			this.polarInfo = polarInfo;
		}

		x.domain(d3.extent(dataArray[0], function(d) { return d.index; }));
		y.domain([this.polarInfo.range[0], this.polarInfo.range[1]]);
		var tmpOutput = this.calculatePolarTicks(this.polarInfo.range[0], this.polarInfo.range[1], y);
		this.polarInfo.range[0] = tmpOutput.minY;
		this.polarInfo.range[1] = tmpOutput.maxY;
		y.domain([this.polarInfo.range[0], this.polarInfo.range[1]]);		

		const defs = this.g.append('defs');
		defs.append('clipPath')
    		.attr('id', 'circle-clip')
    		.call(function (selection) {
				selection.append('circle')
					.attr('cx', 0)
					.attr('cy', 0)
					.attr('r', outerRadius);
			});

		if (this.singleGraphComponent.polarGraphOptions.lineStyle === "line" || 
			this.singleGraphComponent.polarGraphOptions.lineStyle === "lineAndPoint") {
			
			for (var i = 0; i < dataArray.length; i++) {
				this.g.append("path")
					.datum(dataArray[i])
					.attr("fill", "none")
					.attr("stroke", lineColorArray[i])
					.style("stroke-width", sizeArray[i])
					.attr("d", line)
					.attr('clip-path', 'url(#circle-clip)');
			}
		}

		if (this.singleGraphComponent.polarGraphOptions.lineStyle === "point" || 
			this.singleGraphComponent.polarGraphOptions.lineStyle === "lineAndPoint") {

			for (var i = 0; i < dataArray.length; i++) {
				this.g.selectAll("dot")
				.data(dataArray[i])
				.enter().append("circle")
				.filter(function(d) {
                    return d.value !== null;
                })
				.attr("r", 2.5)
				.attr("cx", function(d) { 
					var angle = x(d.index);
					if (self.singleGraphComponent.polarGraphOptions.direction === "counterclockwise") {
						angle = Math.PI * 2 - angle;
					}
					var distance = y(d.value);
					return Math.sin(angle) * distance; 
				})
				.attr("cy", function(d) { 
					var angle = x(d.index);
					if (self.singleGraphComponent.polarGraphOptions.direction === "counterclockwise") {
						angle = Math.PI * 2 - angle;
					}
					var distance = y(d.value);
					return -Math.cos(angle) * distance; 
				})
				.attr("stroke", lineColorArray[i])
				.style('fill', lineColorArray[i])
				.attr('clip-path', 'url(#circle-clip)');;
		
			}
		}						

		var yAxis = this.g.append("g")
			.attr("text-anchor", "middle")
			.attr("class", "yAxisWrapper");

			yAxis.on("dblclick", function () {
			self.singleGraphComponent.openYRangeModal(-1);
		});
  
		var yTick = yAxis
		  .selectAll("g")
		  .data(tmpOutput.ticksArray)
		  .enter().append("g");
		
		yTick.append("circle")
			.attr("fill", "none")
			.attr("stroke", "black")
			.attr("opacity", 0.2)
			.attr("r", y);
		
		yAxis.append("circle")
			.attr("fill", "none")
			.attr("stroke", "black")
			.attr("opacity", 0.2)
			.attr("r", function() { return y(y.domain()[0])});

		yTick.append("text")
			.attr("y", function(d) { return -y(d); })
			.attr("dy", "0.35em")
			.attr("opacity", 1)
			.attr("class", "tick")
			.style("font-size", textSize)
			.text(function(d) { return d; });

		this.g.selectAll(".yAxisWrapper .tick").attr("class", "tick yTicks");

		var xAxis = this.g.append("g");

		var xTick = xAxis
			.selectAll("g")
			.data(x.ticks(dataArray[0].length))
			.enter().append("g")
			.attr("text-anchor", "middle")
			.attr("transform", function(d) {
				var angle = x(d);
				if (self.singleGraphComponent.polarGraphOptions.direction === "counterclockwise") {
					angle = Math.PI * 2 - angle;
				}
				return "rotate(" + (angle * 180 / Math.PI - 90) + ")translate(" + outerRadius + ",0)";
			});

		xTick.append("line")
			.attr("x2", -outerRadius + innerRadius)
			.attr("opacity", 0.2)
			.style("stroke-dasharray", ("5, 5"))
			.attr("stroke", "#000");

		function getText (d) {
			if (d < dataArray[0].length -1) {
				if (self.tagsForGraph[dataArray[0][d].tagListIndex].formula) {
					return self.tagsForGraph[dataArray[0][d].tagListIndex].nameToShow;
				} else if (self.tagsForGraph[dataArray[0][d].tagListIndex].tagInfo.environment == 'STABILIZED') {
					return self.tagsForGraph[dataArray[0][d].tagListIndex].tagInfo.centralTagName;
				} else {
					return self.singleGraphComponent.legend[dataArray[0][d].tagListIndex].tagLabel;
				}		
			} else {
				return "";
			}
		}
	
		xTick.append("text")
			.attr("transform", function(d) { 
				if (d < dataArray[0].length -1) {
					var angle = x(d);
					if (self.singleGraphComponent.polarGraphOptions.direction === "counterclockwise") {
						angle = Math.PI * 2 - angle;
					}

					var translateX = 0;
					var translateY = 0;
					var text = getText(d);
					
					if (angle > 0 && angle < Math.PI) {
						translateX = self.getTextWidth(text, textSize + "px", 'GEInspiraSans') / 2 + textSize/2;
					} else if (angle > Math.PI && angle < 2 * Math.PI) {
						translateX = -self.getTextWidth(text, textSize + "px", 'GEInspiraSans') / 2 - textSize/2;
					}

					if (angle > Math.PI / 2 && angle < Math.PI * 3 / 2) {
						translateY = textSize;
					} else if ((angle > Math.PI * 3 / 2 || angle < Math.PI / 2) && angle !== 0 && angle !== Math.PI * 2) {
						translateY = 0;
					} else if (angle === 0 || angle === Math.PI * 2) {
						translateY = -textSize;
					} 

					return "rotate(" + (90 - (angle * 180 / Math.PI)) + ")translate(" + translateX + ", " + translateY + ")";
				} else {
					return "";
				}				 
			})
			.text(function(d) { 
				return getText(d);
			})
			.style("font-size", textSize)
			.attr("opacity", 0.6);

		var actionDiv = d3.select(this.actionDiv);
		
		this.svg.on("contextmenu", function () {
			d3.event.preventDefault();
			
			actionDiv.attr("hidden", null);
			var rect = actionDiv.node().getBoundingClientRect();
			
			actionDiv
				.style("left", (d3.event.pageX - rect.width * 0.65) + "px")		
				.style("top", (d3.event.pageY - rect.height * 1) + "px")
			actionDiv.transition()		
				.duration(200)		
				.style("opacity", 1);
		})
   
		actionDiv
			.on("mouseout", function() {
				var boundingRect = actionDiv.node().getBoundingClientRect();
				if (d3.event.pageX < boundingRect.left || d3.event.pageX > (boundingRect.left + boundingRect.width) || 
						d3.event.pageY < boundingRect.top || d3.event.pageY > (boundingRect.top + boundingRect.height)) {
					actionDiv.transition()		
						.duration(500)		
						.style("opacity", 0)
						.on("end", function() { actionDiv.attr("hidden",true); });
				}
				
			});
	}

	calculatePolarTicks (minY, maxY, y) {
		var ticksArray = y.ticks(this.singleGraphComponent.polarGraphOptions.numberOfTicks);
		var output = {"minY": minY, "maxY": maxY, "ticksArray": ticksArray};

		if (!this.singleGraphComponent.yAxisLock) {
			var axisStep = ticksArray[1] - ticksArray[0];

			if (ticksArray[0] !== minY) {
				if (ticksArray.length >= 2 && ticksArray[1] <= minY) {
					ticksArray.splice(0, 1);
				} else {
					var newTick = ticksArray[0] - axisStep;
					ticksArray.splice(0, 0, newTick);
					minY = newTick;
				}				
			}

			if (ticksArray[ticksArray.length - 1] !== maxY) {
				if (ticksArray.length >= 2 && ticksArray[ticksArray.length - 2] >= maxY) {
					ticksArray.splice(ticksArray.length - 1, 1);
				} else {
					var newTick = ticksArray[ticksArray.length - 1] + axisStep;
					ticksArray.push(newTick);
					maxY = newTick;
				}				
			}
		} else {
			if (ticksArray[0] !== minY) {
				ticksArray.splice(0, 1, minY);
			}

			if (ticksArray[ticksArray.length - 1] !== maxY) {
				ticksArray.splice(ticksArray.length - 1, 1, maxY);
			}
		}

		for (var j = 0; j < ticksArray.length; j++) {
			ticksArray[j] = Math.round(1000 * ticksArray[j])/1000;
		}

		output = {"minY": minY, "maxY": maxY, "ticksArray": ticksArray};
		
		return output;
	}
}