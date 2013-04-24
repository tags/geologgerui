describe("Base", function() {
	var base;

	beforeEach(function() {
		base = new Base;
	});

	describe("getters and setters", function() {
		it("should work with simple values", function() {
			base.set('foo','bar');
			expect(base.get('foo')).toEqual('bar');
		});
		it("should work with objects", function() {
			var bar = {a:12, b:'hi'};
			base.set('foo',bar);
			expect(base.get('foo')).toEqual(bar);
		});
		it("should use the most recent value", function() {
			base.set('foo','bar');
			base.set('foo','baz');
			expect(base.get('foo')).toEqual('baz');
		});
	});

	describe("observers", function() {
		var observer;

		beforeEach(function() {
			observer = new Object;
			observer.callback = function(){};
			observer.callhairyback = function(){};
			spyOn(observer,'callback');
			spyOn(observer,'callhairyback');
		});

		it("should inform a single observer", function() {
			base.addObserver('foo',observer.callback);
			base.set('foo');
			expect(observer.callback).toHaveBeenCalled();
		});
		it("should inform multiple observers", function() {
			base.addObserver('foo',observer.callback);
			base.addObserver('foo',observer.callhairyback);
			base.set('foo');
			expect(observer.callback).toHaveBeenCalled();
		});
		it("should call an observer once", function() {
			base.addObserver('foo',observer.callback);
			base.set('foo');
			expect(observer.callback.calls.length).toEqual(1);
		});
		it("should call an observer once even if it has been added more than once", function() {
			base.addObserver('foo',observer.callback);
			base.addObserver('foo',observer.callback);
			base.set('foo');
			expect(observer.callback.calls.length).toEqual(1);
		});
		it("should not call a removed observer", function() {
			base.addObserver('foo',observer.callback);
			base.removeObserver('foo',observer.callback);
			base.set('foo');
			expect(observer.callback.calls.length).toEqual(0);
		});
		it("should still call observers that haven't been removed", function() {
			base.addObserver('foo',observer.callback);
			base.addObserver('foo',observer.callhairyback);
			base.removeObserver('foo',observer.callback);
			base.set('foo');
			expect(observer.callhairyback).toHaveBeenCalled();
		});
	});

	describe("#toObject()", function() {
		it("should work with a single value", function() {
			base.set('foo','bar');
			var expectedResult = {foo: 'bar'};
			var result = base.toObject();
			expect(result).toEqual(expectedResult);
		});
		it("should work with multiple values", function() {
			base.set('foo',42);
			base.set('bar',101);
			var expectedResult = { foo: 42, bar: 101 };
			var result = base.toObject();
			expect(result).toEqual(expectedResult);
		});
	});

	describe("::extend()", function() {
		it("should create a new Base object", function() {
			var base = Base.extend();
			expect(base instanceof Base).toBe(true);
		});
		it("should extend base with the values in an object", function() {
			var obj = {foo: 42, bar: 'dont worry'};
			var base = Base.extend(obj);
			expect(base.foo).toEqual(42);
			expect(base.bar).toEqual('dont worry');
		});
		it("should extend base with the function values in an object", function() {
			function fooFunction(){};
			function barFunction(){};
			var obj = {foo: fooFunction, bar: barFunction};
			var base = Base.extend(obj);
			expect(base.foo).toEqual(fooFunction);
			expect(base.bar).toEqual(barFunction);
		});
		it("should add key-value pairs for observed values", function() {
			var vals = {foo: 42, bar: 'happy'};
			var base = Base.extend(null,vals);
			expect(base.get('foo')).toEqual(42);
			expect(base.get('bar')).toEqual('happy');
		});
	});
});

describe("Array: Base extensions", function() {
	describe("observers", function() {
		var observer;

		beforeEach(function() {
			observer = new Object;
			observer.callback = function(){};
			spyOn(observer,'callback');
		});

		it("should add observers to a single item", function() {
			var array = [new Base];
			array.addObserver('foo',observer.callback);
			array[0].set('foo','bar');
			expect(observer.callback).toHaveBeenCalled();
		});
		it("should add observers to many items", function() {
			var array = [new Base, new Base];
			array.addObserver('foo',observer.callback);
			array[0].set('foo','bar');
			array[1].set('foo','bar');
			expect(observer.callback).toHaveBeenCalled();
			expect(observer.callback.calls.length).toEqual(2);
		});
	});
});