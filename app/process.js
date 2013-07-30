var app = app || Base.extend();

(function() {
	app.process = Base.extend((function() {
		return {
			sunAngle: function() {
				if (!this.validateForSunAngle()) 
					return false;

				var $indicator = $('#sun-angle-indicator');
				var me = this;

				var url = "http://test.cybercommons.org/queue/run/geologger.getElevation@geologger";
				var postdata = this.sunAngleData();
				
				this.startProgressIndicator($indicator);
				
				$.post(url,{data: JSON.stringify(postdata), user_id: true}, null, "json").then(function(data) {
					return (new CyberCommons()).getStatusOfTask(data.task_id);
				}).then(function(data) {
					var angle = data.tombstone[0].result.sunelevation;
					me.stopProgressIndicator($indicator);
					app.set('angleComputed',true);
					app.set('sunangle',angle);
				},function(error) {
					me.stopProgressIndicator($indicator);
					log("post failed", error);
				});
			},

			sunAngleData: function() {
				console.log(app.get('events'));
				var twilights = this.formattedEventData(app.get('events'),app.get('calibrationPeriod'));
				var location = this.formattedReleaseLocation(app.get('releaseLocation'));
				return {
					release_location: location,
					threshold: app.get('threshold'),
					tagname: app.get('tagname'),
					twilights: twilights
				};
			},

			locations: function() {
				if (!this.validateForProcessing()) 
					return false;

				var $indicator = $('#submit-for-processing i');
				var $text = $('#submit-for-processing .text');
				var $btn = $('#submit-for-processing');
				var me = this;

				var url = 'http://test.cybercommons.org/queue/run/geologger.coord@geologger';
				var postdata = this.locationsData();

				this.startProgressIndicator($indicator);

				$.post(url,{data: JSON.stringify(postdata), user_id: true}, null, "json").then(function(data) {
					$text.text('Data are being processed');
					return (new CyberCommons()).getStatusOfTask(data.task_id);
				}).then(function(data) {
					$text.text('Success! Loading map data');
					$btn.removeClass('btn-primary');
					$btn.addClass('btn-info');

					$('#app-tabs a[href="#map-tab"]').tab('show');
					me.getGeoJSON();

					me.stopProgressIndicator($indicator);
					me.resetProcessLocationsButton();
				},function(error) {
					me.stopProgressIndicator($indicator);
					me.showProcessLocationsError();
					log("post failed", error);
				});
			},

			locationsData: function() {
				var twilights = this.formattedEventData(app.get('events'));
				var location = this.formattedReleaseLocation(app.get('releaseLocation'));
				return {
					threshold: +app.get('threshold'),
					tagname: app.get('tagname'),
					twilights: twilights,
					calibperiod: app.get('calibrationPeriod'),
					sunelevation: app.get('sunangle'),
					computed: app.get('angleComputed'),
					release_location: location
				};
			},

			showProcessLocationsError: function() {
				var $text = $('#submit-for-processing .text');
				var $btn = $('#submit-for-processing');
				$text.text('Error! Try again in a few seconds');
				$btn.removeClass('btn-primary');
				$btn.addClass('btn-danger');
				this.resetProcessLocationsButton();
			},

			resetProcessLocationsButton: function() {
				var $text = $('#submit-for-processing .text');
				var $btn = $('#submit-for-processing');
				setTimeout(function() {
					$text.text("Submit for processing");
					$btn.removeClass('btn-danger');
					$btn.removeClass('btn-info');
					$btn.addClass('btn-primary');
				},8000);
			},

			getGeoJSON: function() {
				// move this into the locations processing promise?
				var me = this;
				var url = 'http://test.cybercommons.org/mongo/db_find/geologger/coord/';
				url += JSON.stringify(this.geoJsonQuery());

				$.getJSON(url).then(function(data) {
	        me.updateCoordinates(data[0].features);
	        app.map.drawGeoJSON(data[0].features);
				}, function(error) {
					log("geojson get failed", error);
				});
			},

			geoJsonQuery: function() {
				return {
					spec: {
						"properties.tagname": app.get('tagname'),
						"properties.user_id": "guest"
					},
					sort: [["properties.timestamp",-1]],
					limit: 1
				}
			},

			updateCoordinates: function(features) {
				app.set('birdLocations', _.map(features, function(d) {
					return d.geometry.coordinates;
				}));
			},

			validateForSunAngle: function() {
				this.hideAllLabelTooltips();
				
				var twilights = this.formattedEventData(app.get('events'),app.get('calibrationPeriod'));
				var location = this.formattedReleaseLocation(app.get('releaseLocation'));

				if (!this.eventDataIsValid(twilights)) {
					this.showTooltipForLabel('cal-stop-date');
					return false;
				}
				if (!this.lightThresholdIsValid(app.get('threshold'))) {
					this.showTooltipForLabel('threshold'); 
					return false;
				}
				if (!this.releaseLocationIsValid(location)) {
					this.showTooltipForLabel('latitude'); 
					return false;
				}
				if (!this.calibrationPeriodIsValid(app.get('calibrationPeriod'))) {
					this.showTooltipForLabel('cal-start-date'); 
					return false;
				}
				return true;
			},

			validateForProcessing: function() {
				this.hideAllLabelTooltips();

				var twilights = this.formattedEventData(app.get('events'));
				var location = this.formattedReleaseLocation(app.get('releaseLocation'));
				
				if (!this.eventDataIsValid(twilights)) {
					this.showTooltipForLabel('cal-stop-date');
					return false;
				}
				if (!this.lightThresholdIsValid(app.get('threshold'))) {
					this.showTooltipForLabel('threshold');
					return false;
				}
				if (!this.releaseLocationIsValid(location)) {
					this.showTooltipForLabel('latitude');
					return false;
				}
				if (!this.sunAngleIsValid(app.get('sunangle'))) {
					this.showTooltipForLabel('sun-angle');
					return false;
				}
				return true;
			},

		 	lightThresholdIsValid: function(threshold) {
				if (!threshold) return false;
				return true;
			},

			releaseLocationIsValid: function(location) {
				var lat = location[0], lon = location[1];
				if (location.length!=2 || lat === undefined || lon === undefined) {
					return false;
				} else {
					return (lat >= -90 && lat <= 90 &&
									lon >= -180 && lon <= 180);
				}
			},

			calibrationPeriodIsValid: function(period) {
				if (period.length!=2 || !period[0] || !period[1] || 
						 period[0] >= period[1]) {
					return false;
				} else {
					return true;
				}
			},

			eventDataIsValid: function(data) {
				return data.length >= 2;
			},

			calibrationCoordinatesAreValid: function(lat, lon) {
				return (lat >= -90 && lat <= 90 &&
								lon >= -180 && lon <= 180);
			},

			sunAngleIsValid: function(angle) {
				if (!angle && angle!==0) return false;
				return true;
			},

			formattedEventData: function(data,range) {
				// convert datetime fields to tFirst and tSecond for R processing
				var fdata = _.map(data, function(d) { return d.toObject(); });
				if (range) fdata = _.filter(fdata, function(d) {
					return d.datetime >= range[0] && d.datetime <= range[1];
				});

				for (var i = 0; i < fdata.length-1; i++) {
					fdata[i].tFirst = fdata[i].datetime;
					fdata[i].tSecond = fdata[i+1].datetime;
					delete fdata[i].datetime;
					delete fdata[i].threshold;
					delete fdata[i].problem;
				}
				return fdata.slice(0,-1);
			},

			// copied to exporter.js: abstract to String or use some kind of
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

		  startProgressIndicator: function($indicator) {
				$indicator.show();
			},

			stopProgressIndicator: function($indicator) {
				$indicator.hide();
			},

			hideAllLabelTooltips: function() {
				$('label[data-error=tooltip]').tooltip('destroy');
			},

			showTooltipForLabel: function(name) {
				$('[for='+name+']').tooltip('show');
			}
		};
	})());
})();
