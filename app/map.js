var app = app || Base.extend();

(function() {

	app.map = Base.extend((function() {

		// don't like the code that depends on the presence of
		// outside html elements: bad depedency: $('a[href=#map-tab]')

		// TODO: clear layer

		var mapRendered = false;
		var geoLayer = undefined;

		/*var wholeEarth = new L.LatLngBounds( 
			new L.LatLng(-90,-180), 
			new L.LatLng(90,180));*/
		var map = L.map('map', {
			keyboard: false,
			center: [25, 0],
			/*maxBounds: wholeEarth,*/
			minZoom: 1,
			zoom: 1
		});
		var googleLayer = new L.Google('ROADMAP');
    map.addLayer(googleLayer);
    
		/*
		L.tileLayer('http://{s}.tile.cloudmade.com/41d74d0a4bce4413bde0ea29c36e63cb/997/256/{z}/{x}/{y}.png', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
	    maxZoom: 16
		}).addTo(map);
		*/

		var geojsonMarkerOptions = {
	    radius: 4,
	    fillColor: "#ff7800",
	    color: "#000",
	    weight: 1,
	    opacity: 1,
	    fillOpacity: 0.8
		};

		function removeNullCoordinates(coordinates) {
			return _.filter(coordinates, function(coord) {
				return (coord[0] && coord[1]);
			});
		}

		function setConsistent(consistent) {
			if (!consistent) {
				$('a[href=#map-tab]').addClass('inconsistent-state');
				$('[for=map]').tooltip({
					title: 'Map is inconsistent: re-submit to update',
					placement: 'right'
				});
			} else {
				$('a[href=#map-tab]').removeClass('inconsistent-state');
				$('[for=map]').tooltip('destroy');
			}
		}

		function invalidateMap() {
			if (!mapRendered) return;
			setConsistent(false);
		}

		// map does not draw initially when hidden, force redraw on show

		$('a[href=#map-tab]').on('shown', function (e) {			 
		 	map.invalidateSize();
		});

		// when calibration parameters change, show that map is inconsistent
	
		app.addObserver(['threshold','calibrationPeriod','releaseLocation',
			'sunangle'], function() {
			invalidateMap();
		});

		app.addObserver('events', function(evts) {
			evts.addObserver('active', function(a) {
				invalidateMap();
			});
		});

		return {
			drawGeoJSON: function(geo) {
				mapRendered = true; // damn you, state, damn you!
				setConsistent(true);

				if (geoLayer) map.removeLayer(geoLayer);

				//geo.geometry.coordinates = removeNullCoordinates(geo.geometry.coordinates);
				geoLayer = L.geoJson(geo, {
					pointToLayer: function (feature, latlng) {
	       		return L.circleMarker(latlng, geojsonMarkerOptions);
	       	},
	       	onEachFeature: function(feature, layer) {
	       		layer.on('click',function(e) {
	       			//log(feature.properties);
	       			var start = d3.time.format.iso.parse(feature.properties.tFirst);
	       			var stop = d3.time.format.iso.parse(feature.properties.tSecond);
	       			if (start.getTime() == stop.getTime()) {
	       				stop = new Date(stop.getTime() + 24*OneHour);
	       			}
	       			app.chart.scrollTo(start,stop);
	       		})
	       	}
	      });
	      geoLayer.addTo(map);
			},

			redrawMap: function() {
				map.invalidateSize();
			},

			invalidateMap: function() {
				invalidateMap();
			}

		};
	})());

})();