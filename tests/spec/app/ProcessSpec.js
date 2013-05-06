describe("Process", function() {
	var ps = app.process;

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

	describe("#lightThresholdIsValid()", function() {
		it("should return true for a positive number", function() {
			expect(ps.lightThresholdIsValid(1)).toBeTruthy();
		});
		it("should return false if undefined", function() {
			expect(ps.lightThresholdIsValid(undefined)).toBeFalsy();
		});
	});

	describe("#releaseLocationIsValid()", function() {
		it("should return true for a two element array", function() {
			expect(ps.releaseLocationIsValid([1,2])).toBeTruthy();
		});
		it("should return false for an array of more or less than two elements", function() {
			expect(ps.releaseLocationIsValid([1,2,3])).toBeFalsy();
			expect(ps.releaseLocationIsValid([1])).toBeFalsy();
		});
		it("should return false if the first element is undefined", function() {
			expect(ps.releaseLocationIsValid([undefined,1])).toBeFalsy();
		});
		it("should return false if the second element is undefined", function() {
			expect(ps.releaseLocationIsValid([1,undefined])).toBeFalsy();
		});
	});

	describe("#calibrationPeriodIsValid()", function() {
		it("should return true for a two element array", function() {
			expect(ps.calibrationPeriodIsValid([1,2])).toBeTruthy();
		});
		it("should return false for an array of more or less than two elements", function() {
			expect(ps.calibrationPeriodIsValid([1,2,3])).toBeFalsy();
			expect(ps.calibrationPeriodIsValid([1])).toBeFalsy();
		});
		it("should return false if the first element is undefined", function() {
			expect(ps.calibrationPeriodIsValid([undefined,1])).toBeFalsy();
		});
		it("should return false if the second element is undefined", function() {
			expect(ps.calibrationPeriodIsValid([1,undefined])).toBeFalsy();
		});
		it("should return false if the second el is less than the first", function() {
			expect(ps.calibrationPeriodIsValid([100,50])).toBeFalsy();
		});
	});

	describe("#sunAngleIsValid()", function() {
		it("should return true for a positive number", function() {
			expect(ps.sunAngleIsValid(1)).toBeTruthy();
		});
		it("should return true for a negative number", function() {
			expect(ps.sunAngleIsValid(-1)).toBeTruthy();
		});
		it("should return true for zero", function() {
			expect(ps.sunAngleIsValid(0)).toBeTruthy();
		});
		it("should return false if undefined", function() {
			expect(ps.sunAngleIsValid(undefined)).toBeFalsy();
		});
	});
});