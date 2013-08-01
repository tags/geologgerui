var app = app || Base.extend();

// readyState: 0=initial, 1=loading, 2=loaded

(function() {

	app.chart = Base.extend((function() {
		
		var	thIndicator,
				thLine;

		var margin = {top: 20, right: 20, bottom: 100, left: 50},
		    margin2 = {top: 330, right: 20, bottom: 20, left: 50},
		    width = 940 - margin.left - margin.right,
		    height = 400 - margin.top - margin.bottom,
		    height2 = 400 - margin2.top - margin2.bottom;

	  var x = d3.time.scale().range([0, width]),
		    x2 = d3.time.scale().range([0, width]),
		    y = d3.scale.linear().range([height, 0]),
		    y2 = d3.scale.linear().range([height2, 0]);

	  var xAxis = d3.svg.axis().scale(x).orient("bottom"),
		    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
		    yAxis = d3.svg.axis().scale(y).orient("left");

		var brush = d3.svg.brush()
		    .x(x2)
		    .on("brush", brushdrag);

	  // functions

	  var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;
	  var parseUTCDate = d3.time.format.iso.parse;

	  // draws the primary view

	  var line = d3.svg.line()
	    .x(function(d) { return x(d.datetime); })
	    .y(function(d) { return y(d.light); });

	  // draws the brush overview

	  var line2 = d3.svg.line()
	    .x(function(d) { return x2(d.datetime); })
	    .y(function(d) { return y2(d.light); });

	  // build the chart

		var svg = d3.select("#chart").append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom);

		svg.append("defs").append("clipPath")
		    .attr("id", "clip")
			  .append("rect")
			    .attr("width", width)
			    .attr("height", height);

		 // primary viewing area

		var focus = svg.append("g")
				.attr('class','focus')
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// with background

		focus.append('g').attr('class','background');

		// data grouping, comparator in background, points in foreground

		var datagroup = focus.append('g').attr('class','datagroup');
		var comparator = datagroup.append('g').attr('class','comparator');
		var datapointer = focus.append('g').attr('class','datapointer');

		// and info overlay

		focus.append('g').attr('class','info-hud')
				.attr('transform', "translate(" + (width-240) + "," + 0 + ")")
				.append('rect')
					.attr('x',0)
					.attr('y',0)
					.attr('width',240)
					.attr('height',48);

		// overview area

		var context = svg.append("g")
				.attr('class','context')
				.attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

		// with background

		context.append('g').attr('class', 'background');

		function brushdrag(evt) {
			// should not need to duplicate the plotting functionality
		  x.domain(brush.empty() ? x2.domain() : brush.extent());
		  app.set('extent',x.domain());
		  focus.select(".x.axis").call(xAxis);
		  redrawPaths();
		}

		function redrawThreshold(t) {
			thLine
				.attr("y1", y(t.toFixed(1)))
				.attr("y2", y(t.toFixed(1)));
			thIndicator
				.attr('y', y(t.toFixed(1))-8);
	  }

	  function scrollTo(start,stop) {
	  	svg.select('.brush').call(brush.extent([start,stop]));
		  brushdrag();
	  }

	  function shiftData(data, delta) {
	  	return _.map(data, function(d) {
	  		var event = _.extend({},d);
	  		event.datetime = new Date(d.datetime.valueOf()+delta);
	  		return event;
	  	});
	  }

	  function zonedDateString(datestring) {
	  	// firefox requires the Z, mongo remove it
	  	return datestring.charAt(datestring.length-1) == 'Z' ?
				     datestring : 
				     datestring+"Z"
	  }

	  function redrawPaths() {
	  	
	  	// DUPLICATED
	  	var start = x.domain()[0].getTime();
	  	var stop = x.domain()[1].getTime();

			var data = _.filterUntil(undefined,app.get('data'),function(d) {
				if ( d.datetime.getTime() > stop+OneDay ) {
					return undefined;
				}
				return ( d.datetime.getTime() >= start-OneDay && 
	  				 		 d.datetime.getTime() <= stop+OneDay );
			});

	  	d3.select('.line.dayof').remove();
	  	datagroup.append("path")
				      .datum(data)
				      .attr("clip-path", "url(#clip)")
				      .attr("class", "line dayof")
				      .attr("d", line);

			// DUPLICATED
			if ( app.get('showSurroundingDays') ) {

				var daybefore = shiftData(data,-OneDay);
				d3.select('.line.daybefore').remove();
		   	comparator.append("path")
			      .datum(daybefore)
			      .attr("clip-path", "url(#clip)")
			      .attr("class", "line daybefore")
			      .attr("d", line);

			  var dayafter = shiftData(data,OneDay);
			  d3.select('.line.dayafter').remove();
		   	comparator.append("path")
			      .datum(dayafter)
			      .attr("clip-path", "url(#clip)")
			      .attr("class", "line dayafter")
			      .attr("d", line);
			}
	  }

	  app.addObserver('threshold', redrawThreshold);

		return {

			load: function(filepath) {

				var me = this;
				var url = app.get('host') + '/geologger/lightlogs/tagname/' + filepath;
				url += "?callback=?"

				me.set('readyState',1);	

				$.ajax({
					type:"GET", 
					url: url, 
					data: {user_id: "true"}, 
					dataType: "json", 
					xhrFields: {withCredentials: true}, 
					crossDomain: false 
				}).then(function(json) {
		       // set metadata
				  app.set('releaseLocation',json[0].release_location);
				  app.set('tagname',json[0].tagname);
				  app.set('notes',json[0].notes);
				  
				  // set the data
				  me.loadData(json[0].data);
		    },function(error) {
		      console.log("get failed", error);
		    });

				/*
				me.set('readyState',1);	
				d3.json(url, function(error,json) {
				  // set metadata
				  app.set('releaseLocation',json[0].release_location);
				  app.set('tagname',json[0].tagname);
				  app.set('notes',json[0].notes);
				  
				  // set the data
				  me.loadData(json[0].data);
				});
				*/
			},

			loadData: function(data) {

			  data.forEach(function(d) {
			    d.datetime = parseUTCDate(zonedDateString(d.datetime));
			    d.light = +d.light;
			  });

			  app.set('data',data);

			  x.domain(d3.extent(data, function(d) { return d.datetime; }));
			  y.domain(d3.extent(data, function(d) { return d.light; }));
			  
			  x2.domain(x.domain());
				y2.domain(y.domain());

			  // data, day before, day after
			  // drawing deferred to redrawPaths for optimization

			  context.append("path")
		      	.datum(data)
		      	.attr("class", "line")
		      	.attr("d", line2);

		    // axes

			  focus.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height + ")")
		      .call(xAxis);
			  
		   	context.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height2 + ")")
		      .call(xAxis2);

			  focus.append("g")
		      .attr("class", "y axis")
		      .call(yAxis)
			    .append("text")
			      .attr("transform", "rotate(-90)")
			      .attr("y", 6)
			      .attr("dy", "-3.5em")
			      .attr("dx","-14em")
			      .style("text-anchor", "end")
			      .text("Light");

		    // brush 

		   	context.append("g")
		      .attr("class", "x brush")
		      .call(brush)
			    .selectAll("rect")
			      .attr("y", -6)
			      .attr("height", height2 + 7);

			  // threshold

			  var thresholdDrag = d3.behavior.drag()
					.on("drag", function(d) {
						var t = y.invert(d3.event.y);
						if ( t >= y.domain()[0] && t <= y.domain()[1] ) {
							app.set('threshold',t);
						}
					});

			 	thLine = focus.append("line")
			 		.style("stroke-dasharray", ("2, 2"))
		  		.attr("class","threshold")
		  		.attr("x1", 6)
		  		.attr("y1", y(app.get('threshold')))
		  		.attr("x2", 870)
		  		.attr("y2", y(app.get('threshold')))
		  		.call(thresholdDrag);

		  	thIndicator = focus.append('image')
		  		.attr('class','threshold-indicator')
		  		.attr('xlink:href','img/threshold-triangle.png')
		  		.attr('height','16px')
		  		.attr('width','16px')
		  		.attr('x', -40)
		  		.attr('y', y(app.get('threshold'))-8)
		  		.call(thresholdDrag);

		  	// make the scale publicly available ~ do not set from outside

		  	this.set('x',x);
		  	this.set('y',y);

		  	this.set('x2',x2);
		  	this.set('y2',y2);

		  	// update the threshold to force redraw and recalibration
		  	// set an initial brush extent and calibration range

		  	app.set('threshold',app.get('threshold'));

		  	var start = data[0].datetime,
		  			focusstop = new Date(data[0].datetime.getTime()+OneDay*7),
		  			calibstop = new Date(data[0].datetime.getTime()+OneDay*14);
				
				app.set('calibrationPeriod',[start,calibstop]);
		  	scrollTo(start,focusstop);
		  	this.set('readyState',2);
			},

			// composed utilities: make our methods pretty

			domainMin: function() {
				return x2.domain()[0].getTime();
			},

			domainMax: function() {
				return x2.domain()[1].getTime();
			},

			yMin: function() {
				return y.domain()[0];
			},

			yMax: function() {
				return y.domain()[1];
			},

			extentMin: function() {
				return x.domain()[0].getTime();
			},

			extentMax: function() {
				return x.domain()[1].getTime();
			},

			extentRange: function() {
				return this.extentMax() - this.extentMin();
			},

			extentCenter: function() {
				return this.extentMin() + this.extentRange() / 2;
			},

			scrollTo: function(start,stop) {
				scrollTo(start,stop);
			},

			constrainToDomainMax: function(time) {
				return ( time > this.domainMax() ?
					this.domainMax() :
					time );
			},

			constrainToDomainMin: function(time) {
				return ( time < this.domainMin() ?
					this.domainMin() :
					time );
			},

			constrainToLightRange: function(light) {
				if (light < this.yMin() ) light = this.yMin();
				if (light > this.yMax() ) light = this.yMax();
				return light;
			},

			// zoomIn, zoomOut:
			// adjust the brush extent, ensuring we do not extend
		  // beyong the edge or zoom in less than one quarter day

			zoomIn: function() {
		  	var start = this.constrainToDomainMin(this.extentMin()+OneQuarterDay);
		  	var stop = this.constrainToDomainMax(this.extentMax()-OneQuarterDay);
		  	if ( stop - start >= OneHalfDay ) { 
		  		this.scrollTo(start,stop);
		  	}
		  },

		  zoomOut: function() {
		  	var start = this.constrainToDomainMin(this.extentMin()-OneQuarterDay);
		  	var stop = this.constrainToDomainMax(this.extentMax()+OneQuarterDay);
		  	this.scrollTo(start,stop);
		  },

		  // gotoPreviousSection, gotoNextSection:
		  // adjust the brush extent, preserving width against the edge

		  gotoPreviousSection: function() {
	  		var start = this.constrainToDomainMin(
	  			this.extentMin()-this.extentRange()
	  		);
		  	this.scrollTo(start,start+this.extentRange());
		  },

		  gotoNextSection: function() {
	  		var stop = this.constrainToDomainMax(
	  			this.extentMax()+this.extentRange()
	  		);
		  	this.scrollTo(stop-this.extentRange(),stop);
		  },

		  gotoBeginning: function() {
		  	this.scrollTo(this.domainMin(),this.domainMin()+this.extentRange());
		  },

		  gotoEnd: function() {
		  	this.scrollTo(this.domainMax()-this.extentRange(),this.domainMax());
		  },

		  toggleSurroundingDays: function() {
		  	//$('.line.daybefore, .line.dayafter').toggle();
		  	app.set('showSurroundingDays', !app.get('showSurroundingDays'));
		  	if ( !app.get('showSurroundingDays') ) {
		  		d3.select('.line.daybefore').remove();
					d3.select('.line.dayafter').remove();
		  	} else {
		  		redrawPaths();
		  	}
		  },

		  redrawPoints: function() {
		  	var start = this.extentMin();
		  	var stop = this.extentMax();
		  	var data = _.filter(app.get('data'), function(d) {
		  		return d.datetime.getTime() >= start && 
		  					 d.datetime.getTime() <= stop;
		  	});

		  	datapointer.selectAll('.datapoint').remove();
		  	datapointer.selectAll('.datapoint')
		  		.data(data).enter()
					.append('circle')
					.attr("clip-path", "url(#clip)")
					.attr('class','datapoint')
					.attr('cx',function(d) { return x(d.datetime); })
					.attr('cy',function(d) { return y(d.light); })
					.attr('r',1);
		  },

		  togglePoints: function() {
		  	if ( this.pointsVisible() ) {
		  		datapointer.selectAll('.datapoint').remove();
				} else {
					this.redrawPoints();
				}
		  },

		  pointsVisible: function() {
		  	return !datapointer.select('.datapoint').empty();
		  }
		};
	})());

})();
