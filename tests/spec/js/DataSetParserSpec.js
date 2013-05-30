describe("DataSetParser", function() {
	var parser;

	beforeEach(function() {
		parser = new DataSetParser;
	});

	it("should recognize the TAGS format from the header", function() {
		var eli = "datetime,light";
		expect(parser.formatOf(eli).name).toEqual("TAGS");
	});
	it("should recognize the TAGS format from the data", function() {
		var eli = "2011-06-18 10:24:30,2";
		expect(parser.formatOf(eli).name).toEqual("TAGS");
	});

	it("should recognize the BAS format from the data", function() {
		var bas = "ok,19/02/10 20:16:00,40228.844444,9";
		expect(parser.formatOf(bas).name).toEqual("BAS");
	});	

	/*
	var sumner = "1  1 2000-10-27 22:44:00     191   NA     0";
	var stefan1 = "datetime        light";
	var stefan2 = "01.07.2010 00:01        2";
	*/
});