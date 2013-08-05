var app = app || Base.extend();

// global time constants

var OneMinute = 1000*60;
var OneHour = 1000*60*60;
var OneDay = 1000*60*60*24;
var OneHalfDay = OneDay/2;
var OneQuarterDay = OneDay/4;

(function() {
	
	// app hostname
	app.set('host', 'http://test.cybercommons.org');

	// default values, some explicitly undefined

	app.set('threshold',5.5); // threshold
	app.set('data',[]); // lightvalues, the dataset
	app.set('events',[]); // threshold events
	app.set('extent',[]); // focused extent
	app.set('problems',[]); // noisy twilight areas
	app.set('calibrationPeriod',[undefined,undefined]); // calibration
	app.set('releaseLocation',[undefined,undefined]); // lat & lon
	app.set('angleComputed', false);
	app.set('birdLocations',[]);

	app.set('sunangle',undefined);
	app.set('tagname',undefined);
	app.set('notes',undefined);

	// settings
	app.set('showSurroundingDays', false);
})();