var app = app || Base.extend();

(function() {

	app.twilights = Base.extend((function() {

		var eventSort = new Tablesort($('#table-events').get(0));
		eventSort.current = $('#table-events .event-header').get(0);
		eventSort.sortTable($('#table-events .event-header').get(0));
		
		var isSunrise = function(d) { return d.get('type') == "sunrise"; }
		var isSunset = function(d) { return d.get('type') == "sunset"; }

		var eventsLayer = d3.select("#chart svg .focus")
			.append('g').attr('class','twiglight-events');

	  function drawEvents() {

	  	var focus = d3.select("#chart svg .focus");
	  	var events = app.get('events');
	  	var x = app.chart.get('x');
	  	var y = app.chart.get('y');

		  eventsLayer.selectAll('.calibration-indicator').remove();
			eventsLayer.selectAll('.calibration-indicator')
	  		.data(events)
	  		.enter()
	  		.append('circle')
	  			.attr("clip-path", "url(#clip)")
	  			.attr("class","calibration-indicator")
	  			.attr('data-index', function(d) { return events.indexOf(d); })
	  			.attr('id', function(d) { return 'data-index-'+events.indexOf(d); })
	  			.classed("sunset", isSunset)
	  			.classed("sunrise", isSunrise)
	  			.classed('inactive', function(d) { return !d.get('active'); })
	  			.attr("cx", function(d) { return x(d.get('datetime')); }) 
	  			.attr("cy", y(app.get('threshold'))) 
	  			.attr("r",4);

	  	eventsLayer.selectAll('.calibration-indicator')
	  		.on("click", function(d,i) {
	  			d.set('active',!d.get('active'));
	  			this.parentNode.insertBefore(this, this.parentNode.firstChild);
	  			d3.select(this).classed('inactive', !d.get('active'));
		  	})
		  	.on("mouseover", function(d,i) {
		  		d3.select(this).transition()
		  			.attr('r',5);
		  		d3.select('.info-hud')
		  			.append('text')
		  				.attr('class','datetime')
		  				.attr('text-anchor','end')
		  				.attr('x',230)
		  				.attr('y',28)
		  				.text(d.get('datetime'));
		  		d3.select('.info-hud')
		  			.append('text')
		  				.attr('class','event-type')
		  				.attr('text-anchor','end')
		  				.attr('x',230)
		  				.attr('y',42)
		  				.text(d.get('type').capitalize());
		  	})
		  	.on("mouseout", function(d,i) {
		  		d3.select(this).transition()
		  			.attr('r',4);
		  		d3.select('.info-hud .datetime')
		  			.remove();
		  		d3.select('.info-hud .event-type')
		  			.remove();
		  	});
	  }

	  function recomputeCalibrationEvents() {
		 
	  	// WARNING: this algorithm slows down significantly as the size of the dataset increases

	  	var t = +app.get('threshold').toFixed(1);
	  	var data = app.get('data');
	  	var events = [];

	  	for ( var i = 1; i < data.length-1; i++ ) {
	  		var p1 = data[i], p2 = data[i+1], pm1 = data[i-1];
	  		if (lightValueCrossesThreshold(p1,p2,t)) {
	  			var twilightEvent = twilightEventAt(p1,p2,pm1,t);
	  			if ( twilightEvent) events.push(twilightEvent);
	  		}
	  	};

	  	return events;
  	}

  	function twilightEventAt(p1,p2,pm1,t) {
  		var attrs = { threshold: t, active: true };

  		if ( lightValueIsAtThreshold(p1,t) ) {
  			attrs.type = twilightTypeAtThreshold(pm1, p2, t);
  			attrs.datetime = p1.datetime;
  		} else if ( lightValueCrossesThresholdFalling(p1,p2,t) ) {
  			attrs.datetime = new Date(x3at(p1,p2,t));
  			attrs.type = 'sunset';
  		} else if ( lightValueCrossesThresholdRising(p1,p2,t) ) {
  			attrs.datetime = new Date(x3at(p1,p2,t));
  			attrs.type = 'sunrise';
  		} else {
  			return null;
  		}

  		return Base.extend(null,attrs);
  	}

  	function lightValueIsAtThreshold(p,t) {
  		return (p.light == t);
  	}

  	function lightValueCrossesThresholdFalling(p1,p2,t) {
  		return (p1.light > t && p2.light < t);
  	}

  	function lightValueCrossesThresholdRising(p1,p2,t) {
  		return (p1.light < t && p2.light > t);
  	}

  	function lightValueCrossesThreshold(d1,d2,t) {
  		return ( lightValueIsAtThreshold(d1,t) ||
  						 lightValueCrossesThresholdFalling(d1,d2,t) ||
  						 lightValueCrossesThresholdRising(d1,d2,t) );
  	}

  	function twilightTypeAtThreshold(da,db,t) {
  		if ( da.light >= t && db.light <= t ) return 'sunset';
	  	else return 'sunrise';
  	}

  	function x3at(point1, point2, y3) {
  		var x1 = point1.datetime.getTime(),
  				y1 = point1.light,
  				x2 = point2.datetime.getTime(), 
  				y2 = point2.light;

  		var m = (y2-y1)/(x2-x1);
  		var x3 = ((y3-y1)+(x1*m))/m;
  		return x3;
  	}

  	function recomputeProblemEvents(events) {

  		// spec: a problem knows which events it encompasses,
  		// and events know which problem they lie within

  		var kspan = OneHour*3;
  		var problems = [];

  		for (var i = 0; i < events.length-1; i++) {
  			var start = events[i].get('datetime');
  		
  			var r = 1; // range
  			while ( i+r < events.length ) { // misses final problem
  				var stop = events[i+r].get('datetime');
  				if ( stop.getTime() - start.getTime() > kspan ) {
  					if ( r > 1 ) {
  						var actStop = events[i+r-1].get('datetime');
  						var problem = Base.extend(null,{
  							events: events.slice(i,i+r),
  							start: start,
  							stop: actStop,
  							active: true
  						});
  						events.slice(i,i+r).forEach(function(d) {
  							d.set('problem',problem);
  						});
  						problems.push(problem);
  						i = i+r-1; // skip
  					}
  					break;
  				}
  				r++;
  			}
  		}

  		return problems;
  	}

  	function activeProblems() {
  		return _.filter(app.get('problems'), function(d) {
	  		return d.get('active');
	  	});
  	}

  	function problemIsActive(problem) {
  		return ( _.reduce( problem.get('events'), function(memo,e) {
				return memo + ( e.get('active') ? 1 : 0 );
			}, 0) > 1 );
  	}

  	function drawProblems() {
			var background = d3.select("#chart svg .focus .background");
	  	var problems = activeProblems();
	  	var x = app.chart.get('x');

	  	background.selectAll('.problem').remove();
	  	background.selectAll('.problem')
  			.data(problems).enter()
  			.append('rect')
	  			.attr("clip-path", "url(#clip)")
  				.attr('class', 'problem')
  				.attr('x', function(d) { return x(d.get('start'))-7; })
  				.attr('y',0)
  				.attr('width',function(d) {
  					return x(d.get('stop'))-x(d.get('start'))+14;
  				})
  				.attr('height',280);

  		var description = "Problem areas: " + String(problems.length);
	  	d3.select('.info-hud .problem-description').remove();
	  	d3.select('.info-hud')
  			.append('text')
  				.attr('class','problem-description')
  				.attr('text-anchor','end')
  				.attr('x',230)
  				.attr('y',14)
  				.text(description);
	  }

	  function clearExcludedEventsTable() {
	  	$('#table-events tbody .event').remove();
	  	$('#table-events tbody .nodata').css('display','table-row');
	  }

	  function updateExcludedEventsTable(event) {
	  	var id = event.get('datetime').getTime();
			var tbody = $('#table-events tbody');
			var row = tbody.children('[data-datetime='+id+']');
			if (row.length > 0 && event.get('active')) {
				row.remove();
			} else if (row.length == 0 && !event.get('active')) {
				var template = $('script#event-row').html();
				var newrow = tbody.append( _.template(template,{
					datetime: event.get('datetime').toUTCString(),
					type: event.get('type'),
					id: id
				}));
				newrow.find('a').click(handleEventTableClick);
			}
			// update the visibility of the nodata row
			if ( tbody.children('.event').length > 0 ) {
				tbody.children('.nodata').css('display','none');
			} else {
  			tbody.children('.nodata').css('display','table-row');
  		}
  		// and sort
  		eventSort.refresh();
	  }

	  function updateVisibilityInExcludedEventsTable(range) {
	  	$('#table-events tbody tr').each(function(i) {
	  		var dt = $(this).attr('data-datetime');
	  		if ( dt >= range[0] && dt <= range[1] ) $(this).addClass('visible');
	  		else $(this).removeClass('visible');
	  	});
	  }

	  // selecting an event in the excluded table shows it on the chart

	  function handleEventTableClick() {
	  	var center = $(this).attr('data-datetime');
	  	var visible = app.chart.extentRange();
	  	var start = app.chart.constrainToDomainMin(center-visible/2);
			var stop = app.chart.constrainToDomainMax(start+visible);
			app.chart.scrollTo(start,stop);
			return false;
	  };
  	
	  app.addObserver('threshold', function(t) {
  		var events = recomputeCalibrationEvents();
  		if (events) app.set('events',events);
  		var problems = recomputeProblemEvents(events);
  		if (problems) app.set('problems',problems);
  		clearExcludedEventsTable();
  		drawEvents();
		});

		app.addObserver('extent', function(e) {
			drawEvents();
			drawProblems();
			updateVisibilityInExcludedEventsTable(e);
		});

		app.addObserver('problems',function(p) {
			drawProblems();
		});
	  
		app.addObserver('events', function(evts) {
			evts.addObserver('active', function(a) {
				var problem = this.get('problem');
				if (problem) {
					problem.set('active', problemIsActive(problem) );
					drawProblems();
				}
				updateExcludedEventsTable(this);
				updateVisibilityInExcludedEventsTable(app.get('extent'));
			});
		});

		return {

			// previousProblem, nextProblem:
		  // find the problem before/after the max current extent
  		// and center on it

  		previousProblem: function() {
  			return _.find(_.reversecopy(activeProblems()), function(x) {
  				return x.get('stop').getTime() < app.chart.extentCenter()-OneHour; 
  			});
  		},

  		nextProblem: function() {
  			return _.find(activeProblems(), function(x) {
  				return x.get('start').getTime() > app.chart.extentCenter()+OneHour;
  			});
  		},

		  gotoPreviousProblem: function() {
  			var visiblility = app.chart.extentRange();
				var previous = this.previousProblem();
  			if (previous) {
  				var start = app.chart.constrainToDomainMin(
  					previous.get('start').getTime()-visiblility/2
  				);
  				app.chart.scrollTo(start,start+visiblility);
	  		}
		  },

		  gotoNextProblem: function() {
		  	var visiblility = app.chart.extentRange();
  			var next = this.nextProblem();
  			if (next) {
	  			var stop = app.chart.constrainToDomainMax(
	  				next.get('start').getTime()+visiblility/2
	  			);
	  			app.chart.scrollTo(stop-visiblility,stop);
	  		}
		  }
		};

	})());

})();