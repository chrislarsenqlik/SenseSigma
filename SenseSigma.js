define(["jquery", "text!./SenseSigma.css","./d3.min"], function($, cssContent) {'use strict';
	$("<style>").html(cssContent).appendTo("head");
	return {
		initialProperties : {
			version: 1.0,
			qHyperCubeDef : {
				qDimensions : [],
				qMeasures : [],
				qInitialDataFetch : [{
					qWidth : 4,
					qHeight : 500
				}]
			}
		},
		definition : {
			type : "items",
			component : "accordion",
			items : {
				dimensions : {
					uses : "dimensions",
					min : 2,
					max:2
				},
				measures : {
					uses : "measures",
					min : 1,
					max: 2
				},
				sorting : {
					uses : "sorting"
				},
				settings : {
					uses : "settings"
				}
			}
		},
		snapshot : {
			canTakeSnapshot : true
		},
		paint : function($element,layout) {
			 var qData = layout.qHyperCube.qDataPages[0];
			 var qMatrix = qData.qMatrix;
			 var _this = this;
			 var svg
			 var source = qMatrix.map(function(d) {
			 	//console.log(d)
			 	if (d[3]) {var ndcnt=d[3].qNum} else {var ndcnt = 0}
			 	return {
			 		"nodeA":d[0].qText,  
			 		"nodeB":d[1].qText,	 
			 		"count":d[2].qNum,
			 		"nodecount":ndcnt,
			 		"nodeelem": d[0].qElemNumber 
			 	}
			 });

			 //console.log(layout);
			 //console.log(source);
			 var id = "container_"+ layout.qInfo.qId;

			 if (document.getElementById(id)) {
			 	$("#" + id).empty();
			 }
			 else {
			 	$element.append($("<div />").attr("id", id).width($element.width()).height($element.height()));
			 }
			 

			 var nodesum=0
			 var nodes=0
			 var nodecnt=0
			 var totalnodecnt=0
			 var nodeid=0
			 var qElemNumber=0

			 source.forEach(function(d) {
			    nodesum += d.count
			    d.nodecnt = d.nodecount
			    nodes += 1
			    totalnodecnt +=d.nodecount
			    d.nodeid += 1
			    d.qElemNumber = d.nodeelem
			    //console.log(d)
			})

			//console.log(source)

			var source_B=sumEdges(source);
			var node_list = source_B.map(function(d) {return d.nodeA;}); 
			// add node indexing to source data set
			source.forEach(function(d) {
				//console.log(d)
			    d.source = node_list.indexOf(d.nodeA);    
			    d.target = node_list.indexOf(d.nodeB);    
			})
			
			//console.log(source_B)

			var linkavgsum=nodesum / nodes
			var nodeavgcnt=totalnodecnt / nodes

			// distinct list of edges
			var source_E=distinctEdges(source);

			// Visualization //

			var width = $element.width();
			var height = $element.height();
			var margin = {"top":0,"right":0};

			var force = d3.layout.force()
			    .size([width-margin.right,height-margin.top])
			    .charge(-300)
			    .linkDistance(800)
			    .linkStrength(0.1)
			    .gravity(.5)
			    .nodes(source_B)
			    .links(source_E)
			    // .on("tick", tick) // handler below instead
			    .start();


			var node_drag = d3.behavior.drag()
			        .on("drag", dragmove);

			var dragmove = function() {
				console.log('drag?')
				div.style("opacity",0);
				force.tick();
			};

			var drag = force.drag()
						.on("dragstart",dragstart)
						.on("dragend",dragend);

			function dragend(d) {
  				// finished dragging
			}

			function dragstart(d) {
  				d3.event.sourceEvent.stopPropagation();
  				d3.select(this).classed("fixed", d.fixed = true);
  				//console.log(this)
			}


			var chart_div = d3.select("#" + id);

			

			var x = d3.scale.linear()
			    .domain([-(width-margin.right) / 2, (width-margin.right) / 2])
			    .range([0, width-margin.right]);

			var y = d3.scale.linear()
			    .domain([-height / 2, height / 2])
			    .range([height, 0]);

			var zoom = d3.behavior.zoom()
				.x(x)
				.y(y)
			    .scaleExtent([1, 10])
			    .on("zoom", zoomed);

			svg = chart_div.append("svg")
			    .attr("width",width-margin.right)
			    .attr("height",height)
			    .attr("pointer-events", "all")
			    .append('svg:g')
			    .call(zoom)
			    .append('svg:g');

			// Alt Arrow Def
			var defs = svg.append("defs");

			defs.append("marker")
				.attr({
					"id":"Arrow",
					"viewBox":"0 -5 10 10",
					"refX":0,
					"refY":0,
					"markerWidth":4,
					"markerHeight":4,
					"stroke":"green",
					"stroke-width":2,
					"fill":"blue",
					"orient":"auto"
				})
				.append("path")
					.attr("d", "M0,-5L10,0L0,5");

			var rect = svg
				.append('rect')
			    .attr('width', width-margin.right)
			    .attr('height', height)
			    .attr('fill', 'white');

			function zoomed() {
				svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
			}

			    
			var div = chart_div.append("div")
			    .attr("class","tooltip")
			    .attr("id","ext-tip")
			    .style("opacity",0);

   //  		console.log(diagonal.projection)
    			
   			// Chris's Line Links
			var link = svg.append("svg:g").selectAll("line.link")
			    .data(source_E)
			    .enter().append("svg:line")
			    .attr("class","link")
			    .style("stroke-width",function(d) {
			    	var thisvsavg = d.count / linkavgsum
			    	if (d.count <= linkavgsum-(linkavgsum*.6)) { return 1 } 
			    		else if (d.count <= linkavgsum-(linkavgsum*.4) && d.count > linkavgsum-(linkavgsum*.6)) { return 1 } 
			    			else if (d.count <= linkavgsum-(linkavgsum*.2) && d.count > linkavgsum-(linkavgsum*.4)) { return 1 } 
						    	else if (d.count <= linkavgsum && d.count > linkavgsum-(linkavgsum*.2)) { return 2 } 
						    		else if (d.count >= linkavgsum && d.count < (linkavgsum*.2)+linkavgsum) { return 2 } 
						    			else if (d.count >= (linkavgsum*.2)+linkavgsum && d.count < (linkavgsum*.4)+linkavgsum) { return 2 } 
						    				else if (d.count >= (linkavgsum*.4)+linkavgsum && d.count < (linkavgsum*.6)+linkavgsum) { return 4 }
												else if (d.count >= (linkavgsum*.6)+linkavgsum && d.count < (linkavgsum*.8)+linkavgsum) { return 4 }
						    						else {return 5}
		    	})
			    .style("stroke", function(d) {
			    var thisvsavg = d.count / linkavgsum
			    if (d.count <= linkavgsum-(linkavgsum*.6)) { return '#B2E0FF' } 
		    		else if (d.count <= linkavgsum-(linkavgsum*.4) && d.count > linkavgsum-(linkavgsum*.6)) { return '#B2E0FF' } 
		    			else if (d.count <= linkavgsum-(linkavgsum*.2) && d.count > linkavgsum-(linkavgsum*.4)) { return '#B2E0FF' } 
					    	else if (d.count <= linkavgsum && d.count > linkavgsum-(linkavgsum*.2)) { return '#B2E0FF' } 
					    		else if (d.count >= linkavgsum && d.count < (linkavgsum*.2)+linkavgsum) { return '#33ADFF' } 
					    			else if (d.count >= (linkavgsum*.2)+linkavgsum && d.count < (linkavgsum*.4)+linkavgsum) { return '#007ACC' } 
					    				else if (d.count >= (linkavgsum*.4)+linkavgsum && d.count < (linkavgsum*.6)+linkavgsum) { return '#FF0000' }
											else if (d.count >= (linkavgsum*.6)+linkavgsum && d.count < (linkavgsum*.8)+linkavgsum) { return '#660000' }
					    						else {return '#660000'}
			    })
				.style("stroke-opacity", "1")
				.attr("marker-end","url(#Arrow)");

			var node = svg.selectAll("circle.node")
			    .data(source_B)
			    .enter().append("g")
			    .attr("class","node")
			    .call(force.drag);

			  node
			  	.style("stroke-width", "2")
			    .attr("width","10")
			    .attr("height", "10")
			  	.append("svg:circle")
			    .attr("id",function(d){
			    	return 'node'+d.index
			    })
			    .attr("r",function(d) {
			    	if (d.nodecnt) {
			    	var thisvsavg = 10*d.nodecnt / nodeavgcnt
			    	//console.log('nodecnt '+d.nodecnt)
			     	return Math.round(2+2*thisvsavg)
			    	} else {
			    		return Math.round(5)
			    	}
			    })
			    
			    .attr("fill", function(d) {
			    	var thisvsavg = 10*d.nodecnt / nodeavgcnt			    	
			    	if (thisvsavg < 2) { return '#B2E0FF' } 
			    	else if (thisvsavg >=2 && thisvsavg <4 ) { return '#33ADFF' } 
			    		else if (thisvsavg >=4 && thisvsavg <6) { return '#007ACC' } 
			    			else if (thisvsavg >=6&& thisvsavg < 7) { return '#007ACC' } 
			    				else if (thisvsavg >=7 && thisvsavg < 8) { return '#FF0000' } 
				    				else if (thisvsavg >=8 && thisvsavg < 10) { return '#B20000' }
				    					else if (thisvsavg >=10 && thisvsavg <= 20) { return '#B20000' }
				    						else {return '#7f0000'}
			    })			

			    node.append("text")
				    .attr("x", "12")
				    .attr("dy", ".10em")
				    .text(function(d) { return d.nodeA; })	
				    .style('color','black')
				    .style('background','white')
				    .style('border-width','white')
				    .style('box-shadow','#F0F0F0')
				    .style("font-size", function(d) {
				    	var thisvsavg = 10*d.nodecnt / nodeavgcnt
				    	if (thisvsavg < 2) { return '90%' } 
				    	else if (thisvsavg >=2 && thisvsavg <4 ) { return '125%' } 
				    		else if (thisvsavg >=4 && thisvsavg <6) { return '150%' } 
				    			else if (thisvsavg >=6&& thisvsavg < 7) { return '175%' } 
				    				else if (thisvsavg >=7 && thisvsavg < 8) { return '175%' } 
					    				else if (thisvsavg >=8 && thisvsavg < 10) { return '200%' }
					    					else if (thisvsavg >=10 && thisvsavg <= 20) { return '200%' }
					    						else {return '250%'}
				    })
				    .style("font-weight", function(d) {
				    	var thisvsavg = 10*d.nodecnt / nodeavgcnt
				    	if (thisvsavg < 2) { return 'normal' } 
				    	else if (thisvsavg >=2 && thisvsavg <4 ) { return 'normal' } 
				    		else if (thisvsavg >=4 && thisvsavg <6) { return 'normal' } 
				    			else if (thisvsavg >=6&& thisvsavg < 7) { return 'normal' } 
				    				else if (thisvsavg >=7 && thisvsavg < 8) { return 'bold' } 
					    				else if (thisvsavg >=8 && thisvsavg < 10) { return 'bold' }
					    					else if (thisvsavg >=10 && thisvsavg <= 20) { return '900' }
					    						else {return '1000'}
				    });
				    
			node
				.on("mouseover", function(d,i){
					
					// Tooltip
					div
					    .style("opacity",1);
					div.html(d.nodecnt)
					    .style("left",(d3.event.pageX)+"px")
					    .style("top",(d3.event.pageY-28)+"px");
					
					// Current node
					d3.select(this)
			            .classed("active",true);
					    
					// Store indices of neighboring nodes
			        var nodeNeighbors = source.filter(function(p) {return d.nodeA == p.nodeA || d.nodeA == p.nodeB;})
			            .map(function(p){
			                    return p.nodeA === d.nodeA ? p.nodeB : p.nodeA;
			                });
			        
					 // Style neighboring nodes
					 node.filter(function(k) {return nodeNeighbors.indexOf(k.nodeA) > -1;})
			            .classed("neighbor",true);
			         
			         // Store indices of second-degree nodes
			         var nodeNeighborsNeighbors = source.filter(function(p) {return nodeNeighbors.indexOf(p.nodeA)>-1 || nodeNeighbors.indexOf(p.nodeB)>-1 ;})
			             .map(function(p){
			                if (nodeNeighbors.indexOf(p.nodeA)>-1 && d.nodeA != p.nodeB){
			                    return p.nodeB;
			                }
			                else if (nodeNeighbors.indexOf(p.nodeB)>-1 && d.nodeA != p.nodeA){
			                    return p.nodeA;
			                }
			             });
			         
			         // Select and style second-degree nodes
			         node.filter(function(k){return nodeNeighborsNeighbors.indexOf(k.nodeA) > -1 && nodeNeighbors.indexOf(k.nodeA)==-1;})
			            .classed("neighbor2",true);
			         
			         
			         // Select and style non-applicable nodes
			         node.filter(function(k){return nodeNeighborsNeighbors.indexOf(k.nodeA) == -1 && nodeNeighbors.indexOf(k.nodeA) == -1 && k.nodeA!=d.nodeA;})
			            .classed("inactive",true);
			         
			         // Select and style non-applicable links
			         link.filter(function(k){return nodeNeighbors.indexOf(k.nodeA) == -1 && nodeNeighbors.indexOf(k.nodeB) ==-1;})
			         .classed("inactive",true);

			         // Select and style direct links
			         link.filter(function(k){return (k.nodeA==d.nodeA || k.nodeB==d.nodeA);})
			            .classed("active",true);
			         
			         
			         // Select and style mutual friends links
			         link.filter(function(k){return k.nodeA!=d.nodeA && k.nodeB!=d.nodeA && (nodeNeighbors.indexOf(k.nodeA)>-1 || nodeNeighbors.indexOf(k.nodeB)>-1);})
			            .classed("neighbor",true);

			         
				});
			node
			    .on("mouseout", function(d){
			    	
			    	div
			    	    .style("opacity",0);

			    	d3.selectAll('.node')
			            .classed("active neighbor neighbor2 inactive",false);
			    	    
			    	d3.selectAll('.link')
			            .classed("active inactive neighbor",false);
			    });

			

			node.onclick = function (e) {
			    var isRightMB;
			    e = e || window.event;

			    if ("which" in e)  // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
			        isRightMB = e.which == 3; 
			    else if ("button" in e)  // IE, Opera 
			        isRightMB = e.button == 2; 

			    alert("Right mouse button " + (isRightMB ? "" : " was not") + "clicked!");
			} 


			// Code to enable if you want to click a node to select
			// node
			//     .on("mouseup", function(d){
			// 		console.log(d.elemNumber)
			// 		console.log('node a: '+d.nodeA)
			// 		console.log('node b: '+d.nodeB)
			// 		var Arr = [];
			// 		Arr.push(d.elemNumber.toString()); //not working!!
			// 		var dim = 0
			// 		_this.selectValues(0, [d.elemNumber], true);
			// 		// self.backendApi.selectValues(dim, [value], true);
			// 		//console.log(_this)
			// 		//console.log(Arr)
			//     	//console.log(d.nodeA)
			//     });

			link
				.on("mouseover", function(d,i){
					//console.log(d.count)
					// Tooltip
					div
					    .style("opacity",1)
					    .style("z-index",d.count);
					div.html(d.nodeA + "->" + d.nodeB+': '+d.count) 
					    .style("left",(d3.event.pageX)+"px")
					    .style("top",(d3.event.pageY-15)+"px");
					    //console.log(d)
					    //console.log('i: '+i)
				});

			force.on("tick", function() {
				// Code for lines
				link.attr("x1",function(d) { return d.source.x;})
				    .attr("y1",function(d) { return d.source.y;})
				    .attr("x2",function(d) { return d.target.x;})
				    .attr("y2",function(d) { return d.target.y;});

				// // Code for paths
				// link.attr("d", function(d) {
				// 	var dx = d.target.x - d.source.x,
				// 		dy = d.target.y - d.source.y,
				// 		dr = Math.sqrt(dx * dx + dy * dy);
				// 	return "M" + 
				// 		d.source.x + "," + 
				// 		d.source.y + "A" + 
				// 		dr + "," + dr + " 0 0,1 " + 
				// 		d.target.x + "," + 
				// 		d.target.y;
				// });

				    node
				    	// .attr("cx",function(d) {return d.x;})
				     //    .attr("cy", function(d) { return d.y; })
				        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
			});
			
			// FUNCTIONS //


			function distinctEdges(source_data) {
				// this will only work if each edge is defined in both directions; otherwise, it will miss edges
				//console.log(source_data)
				var source_edges = [];
				for (var i=0;i<source_data.length;i++){
					var source_index = source_data[i].source;
					var target_index = source_data[i].target;
					if(source_index>target_index){
						source_edges.push(source_data[i]);
					}
				}
				return source_edges;
			}

			
			function sumEdges(source_data) {
				//console.log(source_data)
				var source_sum=[];
			    var node_i = 0;
				for (var i=0;i<source_data.length;i++){
					
					var curr_node = source_data[i].nodeA;  
					var curr_nodeB = source_data[i].nodeB; 
					var node_exists = 0;
					var nodecnt = source_data[i].nodecnt
					var elemNum = source_data[i].qElemNumber
					//console.log(source_data[i])
					//console.log(elemNum)
					for (var j=0;j<source_sum.length;j++){
						var check_node = source_sum[j].nodeA;  
						if(curr_node==check_node){
							node_exists=1;
							source_sum[j].sum+=1
							
						}
					}
					if(node_exists==0) {  
						source_sum.push({"nodeA":curr_node, "nodeB":source_data[i].nodeB, "sum":1, "index":node_i, "nodeid": node_i, "nodecnt":nodecnt, "elemNumber": source_data[i].qElemNumber});
						
			            node_i++;
			            //console.log(node_i)
			            //console.log(source_sum)
					}
					
				}
				// console.log(source_sum)
				return source_sum;

			}


			function clone(src) {
				function mixin(dest, source, copyFunc) {
					var name, s, i, empty = {};
					for(name in source){
						// the (!(name in empty) || empty[name] !== s) condition avoids copying properties in "source"
						// inherited from Object.prototype.	 For example, if dest has a custom toString() method,
						// don't overwrite it with the toString() method that source inherited from Object.prototype
						s = source[name];
						if(!(name in dest) || (dest[name] !== s && (!(name in empty) || empty[name] !== s))){
							dest[name] = copyFunc ? copyFunc(s) : s;
						}
					}
					return dest;
				}

				if(!src || typeof src != "object" || Object.prototype.toString.call(src) === "[object Function]"){
					// null, undefined, any non-object, or function
					return src;	// anything
				}
				if(src.nodeType && "cloneNode" in src){
					// DOM Node
					return src.cloneNode(true); // Node
				}
				if(src instanceof Date){
					// Date
					return new Date(src.getTime());	// Date
				}
				if(src instanceof RegExp){
					// RegExp
					return new RegExp(src);   // RegExp
				}
				var r, i, l;
				if(src instanceof Array){
					// array
					r = [];
					for(i = 0, l = src.length; i < l; ++i){
						if(i in src){
							r.push(clone(src[i]));
						}
					}
					// we don't clone functions for performance reasons
					//		}else if(d.isFunction(src)){
					//			// function
					//			r = function(){ return src.apply(this, arguments); };
				}else{
					// generic objects
					r = src.constructor ? new src.constructor() : {};
				}
				return mixin(r, src, clone);

			}
			
		/* */
		}
		
	};
});
