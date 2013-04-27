var app = app || Base.extend();

(function() {
	app.process = Base.extend((function() {
		return {
			sunAngle: function() {
				if (!this.validateForSunAngle()) return false;

				var me = this;
				var $indicator = $('#sun-angle-indicator');

				var url = "http://test.cybercommons.org/queue/run/geologger.getElevation@geologger";
				var twilights = this.formattedEventData(app.get('events'),app.get('calibrationPeriod'));
				var postdata = {
					release_location: app.get('releaseLocation'),
					threshold: app.get('threshold'),
					tagname: app.get('tagname'),
					twilights: twilights
				}
				
				log(postdata);
				
				this.startProgressIndicator($indicator);
				$.post(url,{data: JSON.stringify(postdata)}, null, "json")
					.fail(function(jqXHR, status) {
						log("post failed", status);
						me.stopProgressIndicator($indicator);
					})
					.done(function(data) {
						log("post completed",data, typeof data);
						if (!data.task_id) {
							log("no task id returned");
							me.stopProgressIndicator($indicator);
							return;
						}

						var cb = new CyberCommons();
						cb.getStatusOfTask(data.task_id)
							.always(function() {
								me.stopProgressIndicator($indicator);
							})
							.fail(function(jqXHR, status) {
								log("failed to retrieve task status",status);
							})
							.done(function(data) {
								var angle = data.tombstone[0].result.sunelevation;
								log("task status resolved", angle, data);
								app.set('angleComputed',true);
								app.set('sunangle',angle);
							});
					});
				},

			locations: function() {
				if (!this.validateForProcessing()) return false;

				var me = this;
				var $indicator = $('#submit-for-processing i');
				var $text = $('#submit-for-processing .text');
				var $btn = $('#submit-for-processing');
			
				var url = 'http://test.cybercommons.org/queue/run/geologger.coord@geologger';
				var twilights = this.formattedEventData(app.get('events'));
				var postdata = {
					threshold: +app.get('threshold'),
					tagname: app.get('tagname'),
					twilights: twilights,
					calibperiod: app.get('calibrationPeriod'),
					sunelevation: app.get('sunangle'),
					computed: app.get('angleComputed'),
					release_location: app.get('releaseLocation')
				};

				this.startProgressIndicator($indicator);
				$.post(url,{data: JSON.stringify(postdata)}, null, "json")
					.fail(function(jqXHR, status) {
						log("post failed", status);
						$text.text('Error! Try again in a few seconds');
						$btn.addClass('btn-danger');
						setTimeout(function() {
							$text.text("Submit for processing");
							$btn.removeClass('btn-danger');
							$btn.addClass('btn-primary');
						},8000);
					})
					.done(function(data) {
						log("post completed",data);
						$text.text('Data are being processed');
						
						var cb = new CyberCommons();
						cb.getStatusOfTask(data.task_id)
							.always(function() {
								me.stopProgressIndicator($indicator);
								$btn.removeClass('btn-primary');
							})
							.fail(function(jqXHR, status) {
								log("failed to retrieve task status",status);
								$text.text('Error! Try again in a few seconds');
								$btn.addClass('btn-danger');
								setTimeout(function() {
									$text.text("Submit for processing");
									$btn.removeClass('btn-danger');
									$btn.addClass('btn-primary');
								},8000);
							})
							.done(function(data) {
								log("status completed, grabbing geojson");
								$text.text('Success! Loading map data');
								$btn.addClass('btn-info');

								$('#app-tabs a[href="#map-tab"]').tab('show');
								me.getGeoJSON();

								setTimeout(function() {
									$text.text("Submit for processing");
									$btn.removeClass('btn-info');
									$btn.addClass('btn-primary');
								},8000);
							});
					});
			},

			getGeoJSON: function() {

				var me = this;
				var url = 'http://test.cybercommons.org/mongo/db_find/geologger/coord/';
				var props = {
					spec: {
						"properties.tagname": app.get('tagname'),
						"properties.user_id": "guest"
					},
					sort: [["properties.timestamp",-1]],
					limit: 1
				}

				url += JSON.stringify(props);

				$.getJSON(url)
					.fail(function(jqXHR, status) {
		        log("geojson get failed", status);
	        })
	        .done(function(data) {
	        	log("post completed",data);
	        	app.map.drawGeoJSON(data[0].features);
	        	me.updateCoordinates(data[0].features);
	        });
			},

			updateCoordinates: function(features) {
				app.set('birdLocations', _.map(features, function(d) {
					return d.geometry.coordinates;
				}));
			},

			validateForSunAngle: function() {
				this.hideAllLabelTooltips();
				if (!this.lightThresholdIsValid(app.get('threshold'))) {
					this.showTooltipForLabel('threshold'); 
					return false;
				}
				if (!this.releaseLocationIsValid(app.get('releaseLocation'))) {
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
				if (!this.lightThresholdIsValid(app.get('threshold'))) {
					this.showTooltipForLabel('threshold');
					return false;
				}
				if (!this.releaseLocationIsValid(app.get('releaseLocation'))) {
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
				if (!location.length==2 || !location[0] || !location[1]) {
					return false;
				} else {
					return true;
				}
			},

			calibrationPeriodIsValid: function(period) {
				if (!period.length==2 || !period[0] || !period[1] || 
						 period[0] >= period[1]) {
					return false;
				} else {
					return true;
				}
			},

			sunAngleIsValid: function(angle) {
				if (!angle) return false;
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