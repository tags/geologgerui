describe("Chart", function() {
	var lvs, firstObj, astObj;
	var start, stop;

	// factory data start: 2011-06-18T10:24:30
	// factory data stop: 2011-07-18T10:54:30

	beforeEach(function() {
		lvs = lightvalues();
		app.chart.loadData(lvs);
		firstObj = app.get('data')[0];
		lastObj = app.get('data')[app.get('data').length-1];
		// scroll tests
		start = new Date("July 1, 2011");
		stop = new Date("July 14, 2011");
	});

	it("should be defined", function() {
		expect(app.chart).toBeDefined();
	});
	describe("#loadData()", function() {
		it("should set the app data", function() {
			expect(app.get('data').length).toEqual(lvs.length);
		});
		it("should convert datetime strings to dates", function() {
			expect(firstObj.datetime instanceof Date).toBe(true);
		});
		it("should convert light value strings to numbers", function() {
			expect(typeof(firstObj.light)).toBe("number");
		});
		it("should set the domainMin to the first datetime", function() {
			expect(app.chart.domainMin()).toEqual(firstObj.datetime.getTime());
		});
		it("should set the domainMax to the last datetime", function() {
			expect(app.chart.domainMax()).toEqual(lastObj.datetime.getTime());
		});
		it("should scroll to the beginning of the data", function() {
			expect(app.chart.extentMin()).toEqual(firstObj.datetime.getTime());
		});
	});
	describe("#extentRange()", function() {
		it("should be the range length between extentMin and extentMax", function() {
			expect(app.chart.extentRange()).toEqual(app.chart.extentMax()-app.chart.extentMin());
		});
	});
	describe("#extentCenter()", function() {
		it("should be the middle of the visible extent", function() {
			expect(app.chart.extentCenter()).toEqual(app.chart.extentMin()+app.chart.extentRange()/2);
		});
	});
	describe("#scrollTo()", function() {
		it("should set the extentMin to the start time", function() {
			app.chart.scrollTo(start, stop);
			expect(app.chart.extentMin()).toEqual(start.getTime());
		});
		it("should set the extentMax to the end time", function() {
			app.chart.scrollTo(start,stop);
			expect(app.chart.extentMax()).toEqual(stop.getTime());
		});
		it("should not affect the domain range", function() {
			var dmin = app.chart.domainMin();
			var dmax = app.chart.domainMax();
			app.chart.scrollTo(start,stop);
			expect(app.chart.domainMin()).toEqual(dmin);
			expect(app.chart.domainMax()).toEqual(dmax);
		});
	});
	describe("#constrainToDomainMax()", function() {
		it("should return the domain max if the value is greater than the domain max", function() {
			var date = new Date("Jan 1, 2012").getTime();
			var constrained = app.chart.constrainToDomainMax(date);
			expect(constrained).toEqual(app.chart.domainMax());
		});
		it("should return the value if it less than the domain max", function() {
			var date = new Date("Jun 30, 2011").getTime();
			var constrained = app.chart.constrainToDomainMax(date);
			expect(constrained).toEqual(date);
		});
	});
	describe("#constrainToDomainMin()", function() {
		it("should return the domain min if the value is less than the domain main", function() {
			var date = new Date("Jun 30, 2010").getTime();
			var constrained = app.chart.constrainToDomainMin(date);
			expect(constrained).toEqual(app.chart.domainMin());
		});
		it("should return the value if it is greater than the domain min", function() {
			var date = new Date("Jun 30, 2011").getTime();
			var constrained = app.chart.constrainToDomainMin(date);
			expect(constrained).toEqual(date);
		});
	});
	describe("#gotoBeginning()", function() {
		it("should scroll to the beginning of the data", function() {
			app.chart.scrollTo(start,stop);
			app.chart.gotoBeginning();
			expect(app.chart.extentMin()).toEqual(firstObj.datetime.getTime());
		});
		it("should preserve the visble range", function() {
			app.chart.scrollTo(start,stop);
			app.chart.gotoBeginning();
			expect(app.chart.extentRange()).toEqual(stop.getTime()-start.getTime());
		});
	});
	describe("#gotoEnd()", function() {
		it("should scroll to the end of the data", function() {
			app.chart.scrollTo(start,stop);
			app.chart.gotoEnd();
			expect(app.chart.extentMax()).toEqual(lastObj.datetime.getTime());
		});
		it("should preserve the visible range", function() {
			app.chart.scrollTo(start,stop);
			app.chart.gotoEnd();
			expect(app.chart.extentRange()).toEqual(stop.getTime()-start.getTime());
		});
	});
});