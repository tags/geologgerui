describe("Process", function() {
	it("should be defined", function() {
		expect(app.process).toBeDefined();
	});
	describe("#sunAngle()", function() {
		it("should be defined", function() {
			expect(app.process.sunAngle).toBeDefined();
		});
	});
	describe("#locations()", function() {
		it("should be defined", function() {
			expect(app.process.locations).toBeDefined();
		});
	});
});