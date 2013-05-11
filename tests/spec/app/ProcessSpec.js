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

	describe("#eventDataIsValid()", function() {
		it("should return true if there are two or more data points", function() {
			expect(ps.eventDataIsValid([1,2])).toBe(true);
		});
		it("should return false if there are less than two data points", function() {
			expect(ps.eventDataIsValid([1])).toBe(false);
			expect(ps.eventDataIsValid([])).toBe(false);
		});
	});

	describe("#lightThresholdIsValid()", function() {
		it("should return true for a positive number", function() {
			expect(ps.lightThresholdIsValid(1)).toBe(true);
		});
		it("should return false if undefined", function() {
			expect(ps.lightThresholdIsValid(undefined)).toBe(false);
		});
	});

	describe("#releaseLocationIsValid()", function() {
		it("should return true for a two element array", function() {
			expect(ps.releaseLocationIsValid([1,2])).toBe(true);
		});
		it("should return false for an array of more or less than two elements", function() {
			expect(ps.releaseLocationIsValid([1,2,3])).toBe(false);
			expect(ps.releaseLocationIsValid([1])).toBe(false);
		});
		it("should return false if the first element is undefined", function() {
			expect(ps.releaseLocationIsValid([undefined,1])).toBe(false);
		});
		it("should return false if the second element is undefined", function() {
			expect(ps.releaseLocationIsValid([1,undefined])).toBe(false);
		});

		it("should return false if latitude is less than -90", function() {
			expect(ps.releaseLocationIsValid([-91,0])).toBe(false);
		});
		it("should return false if latitude is greater than 90", function() {
			expect(ps.releaseLocationIsValid([91,0])).toBe(false);
		});
		it("should return true if latitude is between -90 and 90", function() {
			expect(ps.releaseLocationIsValid([-90,0])).toBe(true);
			expect(ps.releaseLocationIsValid([0,0])).toBe(true);
			expect(ps.releaseLocationIsValid([90,0])).toBe(true);
		});
		it("should return false if longitude is less than -180", function() {
			expect(ps.releaseLocationIsValid([0,-181])).toBe(false);
		});
		it("should return false if longitude is greater than 180", function() {
			expect(ps.releaseLocationIsValid([0,181])).toBe(false);
		});
		it("should return true if longitude is between -180 and 180", function() {
			expect(ps.releaseLocationIsValid([0,-180])).toBe(true);
			expect(ps.releaseLocationIsValid([0,0])).toBe(true);
			expect(ps.releaseLocationIsValid([0,180])).toBe(true);
		});
	});

	describe("#calibrationPeriodIsValid()", function() {
		it("should return true for a two element array", function() {
			expect(ps.calibrationPeriodIsValid([1,2])).toBe(true);
		});
		it("should return false for an array of more or less than two elements", function() {
			expect(ps.calibrationPeriodIsValid([1,2,3])).toBe(false);
			expect(ps.calibrationPeriodIsValid([1])).toBe(false);
		});
		it("should return false if the first element is undefined", function() {
			expect(ps.calibrationPeriodIsValid([undefined,1])).toBe(false);
		});
		it("should return false if the second element is undefined", function() {
			expect(ps.calibrationPeriodIsValid([1,undefined])).toBe(false);
		});
		it("should return false if the second el is less than the first", function() {
			expect(ps.calibrationPeriodIsValid([100,50])).toBe(false);
		});
	});

	describe("#sunAngleIsValid()", function() {
		it("should return true for a positive number", function() {
			expect(ps.sunAngleIsValid(1)).toBe(true);
		});
		it("should return true for a negative number", function() {
			expect(ps.sunAngleIsValid(-1)).toBe(true);
		});
		it("should return true for zero", function() {
			expect(ps.sunAngleIsValid(0)).toBe(true);
		});
		it("should return false if undefined", function() {
			expect(ps.sunAngleIsValid(undefined)).toBe(false);
		});
	});

	describe("#formattedReleaseLocation()", function() {
		var dec, com;
		beforeEach(function() {
			dec = ["56.4", "-140.3"];
			com = ["56,4", "-140,3"];
		});

		it("should leave period notation for decimal point unchanged", function() {
			expect(ps.formattedReleaseLocation(dec)).toEqual(dec);
		});
		it("should replace comma notation for decimal point with a period", function() {
			expect(ps.formattedReleaseLocation(com)).toEqual(dec);
		});
	});

	describe("#formattedEventData()", function() {
		//...
	});
});