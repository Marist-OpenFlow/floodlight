define([
	"jquery",
	"underscore",
	"backbone",
	"marionette",
	"floodlight/topologyFl",
	"model/topology",
	"text!template/topology.html",
	"text!template/switchHeading.html",
], function($, _, Backbone, Marionette, TopologyCollection, Topology, topologyTpl, switchHeading){
	var TopologyView = Backbone.Marionette.ItemView.extend({
		el: $('#content'),
		
		template: _.template(topologyTpl),
		
		events: {
			"click #showLabels": "toggleLabels",
			"click #doneButton": "scaleOut",
			"change #nodeList": "nodeSelect",
		},
		
		// accepts an array of switch dpids and hosts
		// connected to the controller
		initialize: function(s, h) {
			this.toggleCount = 0;
			this.switches = s;
			this.hosts = h;
			
			_.forEach(h.models, function(item) {
				if (item.attributes.attachmentPoint.length != 0){
					item.set("id", item.get("ipv4"));
					this.switches.push(item);
				}
			}, this);
			
			console.log(this.switches.length);
		},
		
		//render the topology model using d3.js
		render: function() {
			var self = this;
			this.switchLinks;
			this.$el.append(this.template({coll: this.switches.toJSON()})).trigger('create');
			
			this.showLegend();
			var topology = new TopologyCollection({model: Topology});
			topology.fetch().complete(function () {
				this.switchLinks = topology;
				self.showTopo(topology);
        	}, this);
			//console.log(JSON.stringify(topology));
			
        	return this;
		},
		
		showTopo: function(switchLinks) {
			var self = this;
			var height = window.innerHeight;
			var width = window.innerWidth-45;
			//console.log(height);
			//console.log(width);
			
			var force = d3.layout.force()
    			.size([width, height])
    			.charge(-700)
    			.linkDistance(60)
    			.on("tick", tick);

			var drag = force.drag()
    			.on("dragstart", dragstart);
    			
			this.svg = d3.select(".inner").append("svg")
    			.attr("width", width)
    			.attr("height", height)
    			.attr("class", "mainSVG")
    			.attr("pointer-events", "all")
    			.append("g")
    			.call(d3.behavior.zoom().on("zoom", rescale))
    			.append("g");
    		
            function rescale() {}
    		
			$(window).bind('resize', function () { 
				height = window.innerHeight;
				width = window.innerWidth-45;
    			$(".mainSVG").attr("height", height);
    			$(".mainSVG").attr("width", width);
    			d3.select("#legendDiv").style("float", function() {
    														if (window.innerWidth > 350){
    															$(function() { $(".leftLegend").hide(); $(".rightLegend").show(); }); 
    															return "right"; 
    														}
    														else{
    															$(function() { $(".rightLegend").hide(); $(".leftLegend").show(); });
    															return "left";
    														}
    													});
    			force.size([width+45, height/1.5]).start();
    			console.log("blue");					
    			console.log(self.dynamicWindowSize);
    			console.log("blue");
    			//d3.select(".inner").style("width:"+window.innerWidth+"px; height:"+window.innerHeight+"px;");
    			
    			
    			if (self.dynamicWindowSize > window.innerWidth)
            		d3.select(".inner").style("width", self.dynamicWindowSize + "px");
            	else 
            		d3.select(".inner").style("width", window.innerWidth-45 + "px");
            		
            	if (self.dynamicWindowSize > window.innerHeight)
            		d3.select(".inner").style("height", self.dynamicWindowSize + "px");
            	else
            		d3.select(".inner").style("height", window.innerHeight + "px");
			});

			var link = this.svg.selectAll(".link"),
    		node = this.svg.selectAll(".node");
			
			var edges = [];
				
			// create source and target links based on dpid instead of index
			_.forEach(switchLinks.models, function(e) { 
    			
    			// Get the source and target nodes
    			var sourceNode = self.switches.filter(function(n) {
    												  	return n.attributes.dpid === e.attributes['src-switch']; 
    												  })[0],
        		targetNode = self.switches.filter(function(n) {
    											  		return n.attributes.dpid === e.attributes['dst-switch']; 
    											 })[0];
	
    			// Add the edge to the array
   		 		edges.push({source: sourceNode, target: targetNode});
			}, this);
			
			_.forEach(this.hosts.models, function(e) {
    			// Get the source and target nodes
    			if (e.attributes.attachmentPoint.length > 0) {
    			var sourceNode = self.switches.filter(function(n) {
    													return e.attributes.attachmentPoint[0].switchDPID ===  n.attributes.dpid; 
    												  })[0],
        		targetNode = self.switches.filter(function(n) { 
    											  		return n.attributes.dpid === e.attributes.attachmentPoint[0].switchDPID; 
    											  })[0];

    			// Add the edge to the array
    			if (targetNode != undefined)
    				targetNode = e;
   		 		edges.push({source: sourceNode, target: targetNode});
   		 		}
			}, this);
			
			var graphCenter = [];
			graphCenter.push(width-45);
			graphCenter.push(height / 1.5);
  			force
      			.nodes(this.switches.models)
      			.links(edges)
      			.size(graphCenter) 
      			.on("end", end)
      			.start();
			 
			//console.log(this.switches.models); 
			 
  			link = link.data(edges)
    				   .enter().append("line")
      				   .attr("class", "link");

   			node = node.data(this.switches.models)
   					   .enter().append("g")
   					   .attr("class", "node")
   					   .attr("id", function(d) { if (d.attributes.dpid === undefined) return d.attributes['ipv4'][0]; else return d.attributes.dpid; })
      				   .call(drag);
      			
      		node.append("circle")
      				   .attr("r", 12)
      				   .style("fill", function(d) { if (d.attributes.dpid === undefined) return "blue"; else return "green"; });

			var self = this;
			
			//console.log(force.links());
			
			function end() {
				self.shiftAmountx = 0;
				self.shiftAmounty = 0;
				var pxList = [];
				var pyList = [];
    			Array.min = function( array ){
        			return Math.min.apply( Math, array );
    			};
    			
    			Array.max = function( array ){
        			return Math.max.apply( Math, array );
    			};
    			
    			function sortNumber(a,b) {
    				return a - b;
				}

				console.log("force ended");
				var outOfBoundsx = [];
				var outOfBoundsy = [];
				
				_.forEach(self.switches.models, function(item) {
					pxList.push(Math.round(item.px));
					pyList.push(Math.round(item.py));
  					if (item.px < 0)
  						outOfBoundsx.push(item.px);
  					if (item.py < 0)
  						outOfBoundsy.push(item.py);
				}, this);
				
				if (outOfBoundsx.length > 0){
					self.shiftAmountx = (Array.min(outOfBoundsx) * -1) + 15;
            	}
            	
            	if (outOfBoundsy.length > 0){
					self.shiftAmounty = (Array.min(outOfBoundsy) * -1) + 15;
            	}
            	
            	self.svg.attr("transform",
            			"translate(" + self.shiftAmountx + "," + self.shiftAmounty + ")");
            	
            	// dynamically set inner window size base on network graph size
            	console.log(pxList.sort(sortNumber));
            	console.log(pyList.sort(sortNumber));
            	
            	var xHigh1 = pxList[pxList.length - 1];
            	var xHigh2 = pxList[pxList.length - 2];
            	var xLow1 = pxList[0];
            	var xLow2 = pxList[1];
            	
            	console.log(xHigh1 + "," + xHigh2 + "," + xLow1 + "," + xLow2);
            	
            	var yHigh1 = pyList[pxList.length - 1];
            	var yHigh2 = pyList[pxList.length - 2];
            	var yLow1 = pyList[0];
            	var yLow2 = pyList[1];
            	
            	console.log(yHigh1 + "," + yHigh2 + "," + yLow1 + "," + yLow2);
            	
            	var dynamicHeightx = Math.max( Math.abs(xHigh1 - xHigh2), Math.abs(xLow1 - xLow2) );
            	var dynamicWidth1x = Math.max( Math.abs(xLow2 - xHigh1), Math.abs(xLow2 - xHigh2) );
            	var dynamicWidth2x = Math.max( Math.abs(xLow1 - xHigh1), Math.abs(xLow1 - xHigh2) );
            	var dynamicWidthx = Math.max( dynamicWidth1x, dynamicWidth2x );
            	
            	var dynamicHeighty = Math.max( Math.abs(yHigh1 - yHigh2), Math.abs(yLow1 - yLow2) );
            	var dynamicWidth1y = Math.max( Math.abs(yLow2 - yHigh1), Math.abs(yLow2 - yHigh2) );
            	var dynamicWidth2y = Math.max( Math.abs(yLow1 - yHigh1), Math.abs(yLow1 - yHigh2) );
            	var dynamicWidthy = Math.max( dynamicWidth1y, dynamicWidth2y );
            	
            	console.log(dynamicWidthx + "," + dynamicHeightx);
            	console.log(dynamicWidthy + "," + dynamicHeighty);
            	
            	var dynamicWidth = Math.max( dynamicWidthx, dynamicWidthy );
            	var dynamicHeight = Math.max( dynamicHeightx, dynamicHeighty ); 
            	self.dynamicWindowSize = Math.max( dynamicWidth, dynamicHeight ) * 3;
            	
            	console.log(dynamicWidth + "," + dynamicHeight);
  				
  				if (self.dynamicWindowSize > window.innerWidth)
            		d3.select(".inner").style("width", self.dynamicWindowSize + "px");
            		
            	if (self.dynamicWindowSize > window.innerHeight)
            		d3.select(".inner").style("height", self.dynamicWindowSize + "px");
            	
				force.on("end", null);
			}

			function tick() {
				
  				link.attr("x1", function(d) { console.log(d.source.x); return d.source.x; })
      			.attr("y1", function(d) { return d.source.y; })
      			.attr("x2", function(d) { return d.target.x; })
      			.attr("y2", function(d) { return d.target.y; });

  				//node.attr("cx", function(d) { return d.x = Math.max(12, Math.min(width - 12, d.x)); })
      		    	//.attr("cy", function(d) { return d.y = Math.max(12, Math.min(height - 12, d.y)); });
      		    	node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
			}	

			function dragstart(d) {
  				d.fixed = true;
  				d3.select(this).classed("fixed", true);
			}									                    		      	                  		          	                  	  		
        		
		},
		
		toggleLabels: function (e) {
			//alert(window.innerWidth);
			var node = this.svg.selectAll(".node");
			if (this.toggleCount % 2 === 0) {
				node.append("text")
    				.attr("x", 12)
    				.attr("dy", ".35em")
    				.attr("id", "nodeLabels")
    				.text(function(d) { if (d.attributes.id === undefined) return d.attributes['ipv4'][0] ; else return d.attributes.id; });
				this.toggleCount++;	
			}
			else {
				var labels = this.svg.selectAll("#nodeLabels");
				labels.remove();	
				this.toggleCount++;
			}
		},
		
		showLegend: function() {
			legendSvg = d3.selectAll("#legendDiv").append("svg")
    			.attr("width", 115)
    			.attr("height", 65);
    		
    		d3.select("#legendDiv").style("float", function() {
    														if (window.innerWidth > 350){
    															$(function() { $(".rightLegend").show(); }); 
    															return "right"; 
    														}
    														else{
    															$(function() { $(".leftLegend").show(); });
    															return "left";
    														}
    													});
			
			var border = legendSvg.append("rect")
      						.attr("class", "border")
      						.attr("x", 3)
  							.attr("y", 0)
  							.attr("height", 61)
  							.attr("width", 100)
  							.style("fill", "white") ;

      		var legend = legendSvg.append("g")
  							 .attr("class", "legend")
  							 .attr("x", 45)
  							 .attr("y", 25)
  							 .attr("height", 100)
   							 .attr("width", 100);
  
  			legend.selectAll('circle')
      			  .data([0,1])
      			  .enter()
      			  .append("circle")
      			  .attr("cx", 20)
     	 		  .attr("cy", function(d, i){ return (i *  30) + 15;})
      			  .attr("r", 8)
      			  .style("fill", function(d) { 
         							if (d === 0) return "blue"; else return "green";
      							  });	
      
   			legend.selectAll('text')
   				  .data([0,1])
   				  .enter()
   				  .append("text")
  				  .attr("x", 39)
  				  .attr("y", function(d, i){ return (i *  30) + 19})
  				  .text(function(d) { if (d === 0) return "hosts"; else return "switches"; });
		},
		
		nodeSelect: function (e) {
			var height = window.innerHeight;
			var width = window.innerWidth-45;
			var nodeID = $(e.currentTarget).val();
			var nodeData = this.switches.get(nodeID);
			this.x = nodeData.px;
			this.y = nodeData.py;
			var self = this;
			//alert(width);
			
			var allNodes = this.svg.selectAll("g");
			allNodes.style("stroke", "#fff")
				    .style("stroke-width", 1.5);
				    
			this.node = this.svg.selectAll("g").filter(function(d, i) { return i===nodeData.index; });
			this.node.style("stroke", "black")
				.style("stroke-width", 2.5);

			var trans = [];
			trans.push(((width/2)-(self.x*1.5)));
			trans.push(((height/2)-(self.y*1.5)) - ((height/2) * .80));
			//trans.push( 0 );
			//trans.push( ((height/4)-(self.y*1.5)));
			
			this.svg.attr("transform",
            		"translate(" + trans + ")"
            			+ " scale(" + 1.5 + ")");
            			
           /* this.svg.attr("transform",
            		"translate(" + trans + ")"); */
            
			$(function() { $("#doneDiv").show(); });
		},
		
		scaleOut: function () {
            this.node.style("stroke", "#fff")
				.style("stroke-width", 1.5);
				
			var trans = [];
			trans.push(0);
			trans.push(0);
			
			this.svg.attr("transform",
            		"translate(" + this.shiftAmount + ",0)");
            		
            $(function() { $("#doneDiv").hide(); });
		},
				
	});
	return TopologyView;
}); 