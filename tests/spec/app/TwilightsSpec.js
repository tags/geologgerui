describe("Twilights", function() {
	beforeEach(function() {
		var data = normalizedData(lightvalues());
		app.set('data',data);
	});

	it("should be defined", function() {
		expect(app.twilights).toBeDefined();
	});
	it("should update twilight events when the threshold is set", function() {
		app.set('threshold',5);
		expect(app.get('events').length).toBeGreaterThan(0);
	});

	describe("twilight events", function() {
		it("should all have light values equal to an integer threshold", function() {
			app.set('threshold',5);
			_.each(app.get('events'), function(d) {
				expect(d.get('threshold')).toEqual(5);
			});
		});
		it("should all have light values equal to a real value", function() {
			app.set('threshold',5.5);
			_.each(app.get('events'), function(d) {
				expect(d.get('threshold')).toEqual(5.5);
			});
		});
		it("should be set to the correct dates for an integer value", function() {
			app.set('threshold',5);
			var expected = twilightEventsAt5();
			var twilights = app.get('events');
			expect(twilights.length).toEqual(expected.length);
			for (var i = 0; i < expected.length; i++) {
				expect(twilights[i].get('datetime').getTime()).toBeWithinOneSecondOf(expected[i].getTime());
			}
		});
		it("should be set to the correct dates for a real value", function() {
			app.set('threshold',5.5);
			var expected = twilightEventsAt5Point5();
			var twilights = app.get('events');
			expect(twilights.length).toEqual(expected.length);
			for (var i = 0; i < expected.length; i++) {
				expect(twilights[i].get('datetime').getTime()).toBeWithinOneSecondOf(expected[i].getTime());
			}
		});
		it("should be a sunrise when the light value is rising", function() {
			app.set('threshold',5);
			var twilights = app.get('events');
			for (var i = 0; i < twilights.length; i++) {
				if (i%2==0) {
					expect(twilights[i].get("type")).toEqual("sunrise");
				}
			}
		});
		it("should be a sunset when the light value is falling", function() {
			app.set('threshold',5);
			var twilights = app.get('events');
			for (var i = 0; i < twilights.length; i++) {
				if (i%2==1) {
					expect(twilights[i].get("type")).toEqual("sunset");
				}
			}
		});
		it("should be a ??? when the light values are the same", function() {
			//pending();
		});
	});
});