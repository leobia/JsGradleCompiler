class PolarGraph {
    updateInfo (index, svgElement, graphWrapper, graphActionDiv, polarGraphComponent) {
        this.index = index;
        this.svgElement = svgElement;
        this.svg = d3.select(this.svgElement);
        this.graphWrapper = graphWrapper;
        this.graphActionDiv = graphActionDiv;
        this.polarGraphComponent = polarGraphComponent;

        this.lineColor = lineColor1;
		this.lineColor2 = lineColor2;
    }

    cleanGraph() {
        d3.select(this.svgElement).select("*").remove();
    }

    drawPolarGraph() {
        this.cleanGraph();

        var self = this;

        var margin = {
			top: graphTopMargin,
			right: graphTopMargin,
			bottom: graphTopMargin,
			left: graphTopMargin
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

        var polarData = this.polarGraphComponent.$options.polarData;

        var pointArrayToDraw = JSON.parse(JSON.stringify(this.polarGraphComponent.getPointArraysToDraw));
        if (this.polarGraphComponent.numberOfGraphs > 1) {
            for (var i = 0; i < pointArrayToDraw.length; i++) {
                if (pointArrayToDraw[i].timestampIndex !== this.index) {
                    pointArrayToDraw.splice(i, 1);
                    i--;
                }
            }
        }

        var minY = null, maxY = null;

        if (polarData === null || polarData.tagDataRecords.length <= this.index || this.polarGraphComponent.selectedTags.length <= 2 || pointArrayToDraw.length === 0) {
            return;
        }

        for (var i = 0; i < pointArrayToDraw.length; i++) {
            for (var j = 0; j < pointArrayToDraw[i].valueArray.length; j++) {
                var value = pointArrayToDraw[i].valueArray[j].value;

                if (minY === null) {
                    minY = value;
                }
                minY = Math.min(value, minY);
    
                if (maxY === null) {
                    maxY = value;
                }
                maxY = Math.max(value, maxY);
            }
        }

        if (minY === null && maxY === null) {
            minY = 0;
            maxY = 0;
        }

        if (minY === maxY) {
            minY -= (maxY - minY) / 10;
            maxY += (maxY - minY) / 10;
		}

		var paddingOffset = 10;
		minY -= (maxY - minY) / paddingOffset;
        maxY += (maxY - minY) / paddingOffset;
        
        var x = d3.scaleLinear().range([0, fullCircle]);
        var y = d3.scaleLinear().range([innerRadius, outerRadius]);
        
        var line = d3.lineRadial()
    		.angle(function(d) { 
				var output = x(d.index);
				if (self.polarGraphComponent.polarGraphOptions.direction === "counterclockwise") {
					output = Math.PI * 2 - output;
				}
				return output; 
			})
			.radius(function(d) { 
                var output = y(parseFloat(d.value));
                if (output < 0) {
                    output = 0;
                }
                return output; 
            })
			.defined(function(d) {
				return d.value !== null;
            });
            
        var polarInfo = {"range": [minY, maxY]};
        if (this.polarInfo === null || !this.polarGraphComponent.lockedArray[this.index]) {
			this.polarInfo = polarInfo;
		}

        x.domain(d3.extent(pointArrayToDraw[0].valueArray, function(d) { return d.index; }));
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
            
        if (this.polarGraphComponent.polarGraphOptions.lineStyle === "line" || 
			this.polarGraphComponent.polarGraphOptions.lineStyle === "lineAndPoint") {

            for (var i = 0; i < pointArrayToDraw.length; i++) {
                this.g.append("path")
                    .datum(pointArrayToDraw[i].valueArray)
                    .attr("fill", "none")
                    .attr("stroke", pointArrayToDraw[i].color)
                    .style("stroke-width", "1px")
                    .attr("d", line)
                    .attr('clip-path', 'url(#circle-clip)');
            }
        } 

        if (this.polarGraphComponent.polarGraphOptions.lineStyle === "point" || 
			this.polarGraphComponent.polarGraphOptions.lineStyle === "lineAndPoint") {

            for (var i = 0; i < pointArrayToDraw.length; i++) {
                this.g.selectAll("dot")
                    .data(pointArrayToDraw[i].valueArray)
                    .enter()
                    .append("circle")
                    .filter(function(d) {
                        return d.value !== null;
                    })
                    .attr("r", 2.5)
                    .attr("cx", function(d) { 
                        var angle = x(d.index);
                        if (self.polarGraphComponent.polarGraphOptions.direction === "counterclockwise") {
                            angle = Math.PI * 2 - angle;
                        }
                        var distance = y(d.value);
                        return Math.sin(angle) * distance; 
                    })
                    .attr("cy", function(d) { 
                        var angle = x(d.index);
                        if (self.polarGraphComponent.polarGraphOptions.direction === "counterclockwise") {
                            angle = Math.PI * 2 - angle;
                        }
                        var distance = y(d.value);
                        return -Math.cos(angle) * distance; 
                    })
                    .attr("stroke", pointArrayToDraw[i].color)
                    .style('fill', pointArrayToDraw[i].color)
                    .attr('clip-path', 'url(#circle-clip)');
            }
            
            
        }
        

        var yAxis = this.g.append("g")
            .attr("text-anchor", "middle")
            .attr("class", "yAxisWrapper");

        yAxis.on("dblclick", function () {
            self.polarGraphComponent.$options.graphIndexMenu = self.index;
            self.polarGraphComponent.openYRangeModal();
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

		var textSize = 10;
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
            .data(x.ticks(pointArrayToDraw[0].valueArray.length))
            .enter().append("g")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
                var angle = x(d);
                if (self.polarGraphComponent.polarGraphOptions.direction === "counterclockwise") {
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
            if (d < pointArrayToDraw[0].valueArray.length -1) {
                return self.polarGraphComponent.enrichedSelectedTags[pointArrayToDraw[0].valueArray[d].index].nameToShow;
            } else {
                return "";
            }
        }
    
        xTick.append("text")
            .attr("transform", function(d) { 
                if (d < pointArrayToDraw[0].valueArray.length -1) {
                    var angle = x(d);
                    if (self.polarGraphComponent.polarGraphOptions.direction === "counterclockwise") {
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

        var actionDiv = d3.select(this.graphActionDiv);
    
        this.svg.on("contextmenu", function () {
            d3.event.preventDefault();
            
            actionDiv.attr("hidden", null);
            var rect = actionDiv.node().getBoundingClientRect();
            self.polarGraphComponent.$options.graphIndexMenu = self.index;
            
            actionDiv
                .style("left", (d3.event.pageX - rect.width * 0.5) + "px")		
                .style("top", (d3.event.pageY - rect.height * 0.5) + "px")
            actionDiv.transition()		
                .duration(200)		
                .style("opacity", 1);
        });

        actionDiv
			.on("mouseout", function() {
				var boundingRect = actionDiv.node().getBoundingClientRect();
				if (d3.event.pageX < boundingRect.left || d3.event.pageX > (boundingRect.left + boundingRect.width) || 
						d3.event.pageY < boundingRect.top || d3.event.pageY > (boundingRect.top + boundingRect.height * 3 / 4)) {
					actionDiv.transition()		
						.duration(500)		
						.style("opacity", 0)
						.on("end", function() { actionDiv.attr("hidden",true); });
				}
				
			});
    }

    calculatePolarTicks (minY, maxY, y) {
		var ticksArray = y.ticks(this.polarGraphComponent.polarGraphOptions.numberOfTicks);
		var output = {"minY": minY, "maxY": maxY, "ticksArray": ticksArray};

		if (!this.polarGraphComponent.lockedArray[this.index]) {
			var axisStep = ticksArray[1] - ticksArray[0];

			if (ticksArray[0] !== minY) {
				var newTick = ticksArray[0] - axisStep;
				ticksArray.splice(0, 0, newTick);
				minY = newTick;
			}

			if (ticksArray[ticksArray.length - 1] !== maxY) {
				var newTick = ticksArray[ticksArray.length - 1] + axisStep;
				ticksArray.push(newTick);
				maxY = newTick;
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
    
    getTextWidth (text, fontSize, fontFace) {
	    var canvas = document.createElement('canvas');
	    var context = canvas.getContext('2d');
	    context.font = fontSize + ' ' + fontFace;
	    return context.measureText(text).width;
	}
}