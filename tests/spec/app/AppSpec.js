describe("App", function() {
	it("should be defined", function() {
		expect(app).toBeDefined();
	});
	it("should define global time constants", function() {
		expect(OneMinute).toBeDefined();
		expect(OneHour).toBeDefined();
		expect(OneDay).toBeDefined();
		expect(OneHalfDay).toBeDefined();
		expect(OneQuarterDay).toBeDefined();
	});
	it("should define sensible defaults", function() {
		expect(app.get('threshold')).toBeDefined();
		expect(app.get('data')).toBeDefined();
		expect(app.get('events')).toBeDefined();
		expect(app.get('extent')).toBeDefined();
		expect(app.get('problems')).toBeDefined();

		expect(app.get('calibrationPeriod')).toBeDefined();
		expect(app.get('releaseLocation')).toBeDefined();
		expect(app.get('angleComputed')).toBeDefined();
		expect(app.get('birdLocations')).toBeDefined();
		expect(app.get('showSurroundingDays')).toBeDefined();
	});
	it("should leave some default values undefined", function() {
		expect(app.get('sunangle')).toBeUndefined();
		expect(app.get('tagname')).toBeUndefined();
		expect(app.get('notes')).toBeUndefined();
	});
});