define([
	"jquery",
	"underscore",
	"backbone",
	"marionette",
	"floodlight/topologyFl",
	"model/topology",
	"text!template/topology.html"
], function($, _, Backbone, Marionette, TopologyCollection, Topology, topologyTpl){
	var TopologyView = Backbone.Marionette.ItemView.extend({
		el: $('#content'),
		
		template: _.template(topologyTpl),
		
		// accepts an array of switch dpids and hosts
		// connected to the controller
		initialize: function(s, h) {
			this.switches = s;
			this.hosts = h;
			//console.log(s);
			//console.log(h);
		},
		
		//render the topology model using d3.js
		render: function() {
			
			var height = window.innerHeight-45;
			var width = window.innerWidth-45;

var force = d3.layout.force()
    .size([width, height])
    .charge(-400)
    .linkDistance(40)
    .on("tick", tick);

var drag = force.drag()
    .on("dragstart", dragstart);

var svg = d3.select(this.el).append("svg")
    .attr("width", width)
    .attr("height", height);
    
$(window).bind('resize', function () { 

    			$("svg").attr("height", window.innerHeight-45);
    			$("svg").attr("width", window.innerWidth-45);

			});

var link = svg.selectAll(".link"),
    node = svg.selectAll(".node");

d3.json("tpl/miserables.json", function(error, graph) {
  force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();

  link = link.data(graph.links)
    .enter().append("line")
      .attr("class", "link");

  node = node.data(graph.nodes)
    .enter().append("circle")
      .attr("class", "node")
      .attr("r", 12)
      .call(drag);
});

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("cx", function(d) { return d.x = Math.max(12, Math.min(width - 12, d.x)); })
      .attr("cy", function(d) { return d.y = Math.max(12, Math.min(height - 12, d.y)); });
}

function dragstart(d) {
  d.fixed = true;
  d3.select(this).classed("fixed", true);
}
			
			
			
			//dynamically set the height and width of the
			//iframe dynamically based on browser window size
			/*var height = window.innerHeight;
			var width = window.innerWidth;
			console.log("in main doc");
			console.log(width);
			
			var frame = d3.select(this.el).append("iframe")
										  .attr("id", "frameID")
										  .attr("src", "/avior/test/tpl/topology.html")
										  .attr("scrolling", "no")
										  .attr("height", height)
										  .attr("width", width - 45);
										  
			$(window).bind('resize', function () { 

    			$("iframe").attr("height", window.innerHeight);
    			$("iframe").attr("width", window.innerWidth - 45);
    			console.log($("iframe"));

			});							  
			$("iframe").contents().find("body").removeClass("hidden");
			$("#iFrame").contents().find("body").removeClass("hidden");
				
			var svgContainer = d3.selectAll("body").append("svg")
												  .attr("width", 1000)
												  .attr("height", 1000);
			
			var switchNodes = svgContainer.selectAll("circle")
	                          		   .data(this.switches)
    	                      		   .enter()
        	                  		   .append("circle")
        	                  		   .attr("cx", function (d,i) { return ((i+3)*30); })
				                       .attr("cy", function (d,i) { return ((i+3)*30); })
                				       .attr("r", 20 );
        	                  		   
        	var hostNodes = svgContainer.selectAll("rect")
	                          		   .data(this.hosts)
    	                      		   .enter()
        	                  		   .append("rect");	*/
				
				
										                    		      	                  		          	                  	  				
			var topology = new TopologyCollection({model: Topology});
			topology.fetch().complete(function () {
				//console.log(JSON.stringify(topology));
        	}, this);
        		
        	return this;
		},
		
		showTopo: function(frame) {
			var width = 960,
    		height = 500;

			var color = d3.scale.category20();

			var force = d3.layout.force()
    			.charge(-120)
   				.linkDistance(30)
    			.size([width, height]);

			var svg = d3.select(frame).append("svg")
				.attr("xmlns", "http://www.w3.org/2000/svg")
    			.attr("width", "100%")
    			.attr("height", "100%")
    			.attr("viewBox", "0 0 200 200");
    
			d3.json("miserables.json", function(error, graph) {
  				force
     		 		.nodes(graph.nodes)
      				.links(graph.links)
      				.start();
	
  				var link = svg.selectAll(".link")
  	    			.data(graph.links)
    				.enter().append("line")
      				.attr("class", "link")
      				.style("stroke-width", function(d) { return Math.sqrt(d.value); });

  				var node = svg.selectAll(".node")
      				.data(graph.nodes)
    				.enter().append("circle")
      				.attr("class", "node")
      				.attr("r", 5)
      				.style("fill", function(d) { return color(d.group); })
      				.call(force.drag);

  				node.append("title")
      				.text(function(d) { return d.name; });

  				force.on("tick", function() {
    				link.attr("x1", function(d) { return d.source.x; })
        				.attr("y1", function(d) { return d.source.y; })
        				.attr("x2", function(d) { return d.target.x; })
        				.attr("y2", function(d) { return d.target.y; });

    			node.attr("cx", function(d) { return d.x; })
        			.attr("cy", function(d) { return d.y; });
  				});
			});
		},
				
	});
	return TopologyView;
}); 