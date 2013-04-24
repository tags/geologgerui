var app = app || Base.extend();

(function() {

	app.calibration = Base.extend((function() {

	var calibPattern = d3.select('#chart svg').append('pattern')
  		.attr('id', 'calibration-pattern')
  		.attr('patternUnits', 'userSpaceOnUse')
  		.attr('x', 0)
  		.attr('y', 0)
  		.attr('width', 4)
  		.attr('height', 4);
  calibPattern.append('rect')
			.attr('class','background')
			.attr('x', 0)
  		.attr('y', 0)
  		.attr('width', 4)
  		.attr('height', 4);
  calibPattern
  		.append('path')
  		.attr('d', 'M 0 4 4 0');

  d3.select('#chart svg defs').append("clipPath")
  		.attr('id', 'calibClip')
  		.append('rect')
  			.attr('width',870) // hardcoded from chart
  			.attr('height',12) // approx. hardcoding
  			.attr('y',-12);

	function redrawRangeIndicators(range) {
		if (!range.length == 2 || !range[0] || !range[1])
			return;

		var focus = d3.select("#chart svg .focus");
		var context = d3.select("#chart svg .context .background");
		var x2 = app.chart.get('x2');
		var x = app.chart.get('x');

		// draw in two places? at least on the brush

		context.select('.rangerect').remove();
		context.append('rect')
			.attr('class','rangerect')
			.attr('x', x2(range[0]))
			.attr('y', -6)
			.attr('width',x2(range[1])-x2(range[0]))
			.attr('height',5)
			.attr('fill','url(#calibration-pattern)');

		focus.select('.rangerect').remove();
		focus.append('rect')
			.attr('clip-path','url(#calibClip)')
			.attr('class','rangerect')
			.attr('x', x(range[0]))
			.attr('y', -12)
			.attr('width',x(range[1])-x(range[0]))
			.attr('height',10)
			.attr('fill','url(#calibration-pattern)');
	}

	app.addObserver('calibrationPeriod', function(range) {
		redrawRangeIndicators(range);
	});
	app.addObserver('extent', function(extent) {
		redrawRangeIndicators(app.get('calibrationPeriod'));
	});

	return {};

}()));
	
})();