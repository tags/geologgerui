var app = app || Base.extend();

(function() {
	app.process = Base.extend((function() {
		return {
			sunAngle: function() {
				if (!this.validateForSunAngle()) return false;

				var $indicator = $('#sun-angle-indicator');
				var me = this;

				var url = "http://test.cybercommons.org/queue/run/geologger.getElevation@geologger";
				var data = this.formattedEventData(app.get('events'),app.get('calibrationPeriod'));
				var postdata = {
					release_location: app.get('releaseLocation'),
					threshold: app.get('threshold'),
					tagname: app.get('tagname'),
					twilights: data
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