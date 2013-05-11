var app = app || Base.extend();

(function() {

	app.exporter = Base.extend((function() {
		// http://stackoverflow.com/questions/280713/elements-order-in-a-for-in-loop
		// All browsers respect definition order with the exception of Chrome and 
		// Opera which do for every non-numerical property name.
		// Really need to test this output

		return {	
			exportCsv: function(dataOut) {
				
				// one more pass converting date values to iso

				_.each(dataOut, function(d) {
					d.datetime = d.datetime.toISOString();
				});

				// add csv fields
				dataOut.unshift({
					datetime: 'datetime', 
					light: 'light',
					twilight: 'twilight',
					interp: 'interp',
					excluded: 'excluded'
				});

				var csv = this.arrayOfObjectsToCSV(dataOut);
				saveAs(
		      new Blob([csv], {
		      	type: "text/csv;charset=" + document.characterSet
		      }), app.get('tagname')+".csv"
		    );
				
				//var uriContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
				//var myWindow = window.open(uriContent, "Tilde CSV");
			},

			exportJson: function(dataOut) {

				// R serializes table data strangely but economically
				
				var tilde = {
					datetime: [],
					light: [],
					twilight: [],
					interp: [],
					excluded: []
				}

				_.each(dataOut, function(d) {
					tilde.datetime.push(d.datetime);
					tilde.light.push(d.light);
					tilde.twilight.push(d.twilight);
					tilde.interp.push(d.interp);
					tilde.excluded.push(d.excluded);
				});

				// and we have metadata
				var location = this.formattedReleaseLocation(app.get('releaseLocation'));
				var allOut = {
					tilde: tilde,
					latlngs: app.get('birdLocations'),
					metadata: {
						tagname: app.get('tagname'),
						tagid: app.get('tagname'),
						solar_elevation: app.get('sunangle'),
						calibration: [
							{
								location: location,
								start_time: app.get('calibrationPeriod')[0],
								stop_time: app.get('calibrationPeriod')[1]
							}
						],
						release_location: location,
						release_time: "NA",
						recapture_location: "NA",
						recapture_time: "NA",
						notes: app.get('notes'),
						species: "NA"
					}
				}

				var json = JSON.stringify(allOut, null, "  ");
				saveAs(
		      new Blob([json], {
		      	type: "application/json;charset=" + document.characterSet
		      }), app.get('tagname')+".json"
		    );
			},

			exportMapCsv: function(dataOut) {
				dataOut.unshift(['lat', 'lng']);
				var csv = this.arrayOfArraysToCSV(dataOut);
				saveAs(
		      new Blob([csv], {
		      	type: "text/csv;charset=" + document.characterSet
		      }), app.get('tagname')+"_latlng.csv"
		    );
			},

			tildeData: function() {
				var data = _.map(app.get('data'), function(d) {
					return _.clone(d); // js references are problematic
				});

				// add required csv fields to existing light data

				_.each(data, function(d) {
					d.twilight = 0;
					d.interp = "FALSE";
					d.excluded = "FALSE";
				});

				// format twilight events

				var events = _.map(app.get('events'), function(e) {
					var t = e.toObject();
					var type = 0;
					if (t.type == "sunrise") type = 1;
					else if (t.type == "sunset") type = 2;
					var r = {};

						r.datetime = t.datetime;
						r.light = t.threshold;
						r.twilight = type;
						r.interp = "TRUE";
						r.excluded = (t.active?"FALSE":"TRUE");

					return r;
				});
				
				// add twilight events to light data and sort

				data = data.concat(events);
				data = _.sortBy(data, function(d) {
					return d.datetime;
				});

				// filter out light data that has been duplicated by twilight events
				// and set interp to false for the twilight event

				var dataOut = [];
				for (var i = 0; i < data.length-1; i++) {
					if (data[i].datetime.getTime() != data[i+1].datetime.getTime()) {
						dataOut.push(data[i]);
					} else {
						// ensure the duplication is a light-twilight dup 
						// and not a light-light
						if (data[i+1].twilight != 0) {
							data[i+1].interp = "FALSE";
						}
					}
				}

				return dataOut;
			},

			// copied from process.js: abstract to String or use some kind of
			// localization to handle formatting
			formattedReleaseLocation: function(location) {
				return _.map(location, function(x) {
					if (typeof x === "string") {
						return x.replace(',','.');
					} else {
						return x;
					}
				});
			},

			arrayOfObjectsToCSV: function(array) {
				var keys = _.keys(array[0]);
				var csv = '';
				_.each(array, function(d) {
					csv += _.map(keys,function(k) {
						return d[k];
					}).join(',');
					csv += '\r\n';
				});
				return csv;
			},

			arrayOfArraysToCSV: function(array) {
				var csv = '';
				_.each(array, function(d) {
					csv += d.join(',');
					csv += '\r\n';
				});
				return csv;
			}
		};
	})());

})();