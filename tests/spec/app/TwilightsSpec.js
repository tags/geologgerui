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
			expect(app.get('events')[0].get('datetime').getTime()).toBeWithinOneSecondOf(twilightEventsAt5()[0].getTime());
		});
	});
});