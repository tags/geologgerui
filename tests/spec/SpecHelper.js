
// custom matchers

beforeEach(function() {
	this.addMatchers({
		toBeWithinOneSecondOf: function(expected) {
			return ( this.actual >= expected-1000 &&
						 	 this.actual <= expected+1000 );
		}
	});
});

// from chart.js

var parseUTCDate = d3.time.format.iso.parse;

function zonedDateString(datestring) {
	return datestring.charAt(datestring.length-1) == 'Z' ?
		     datestring : 
		     datestring+"Z"
}

// normalize data like the chart does

function normalizedData(data) {
	data.forEach(function(d) {
    d.datetime = parseUTCDate(zonedDateString(d.datetime));
    d.light = +d.light;
  });
  return data;
}
