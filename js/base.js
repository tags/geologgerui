// the base object, with key-value obvserving and private properties

var Base = function() {
	
	var _properties = {};
	var _observers = {};
	var _me = this;

	function informObservers(n) {
		var obs = _observers[n];
		if ( typeof obs === 'undefined' ) {
			return;
		}
		obs.forEach(function(o) {
			o.call(_me,_properties[n]);
		});
	}

	function _addObserver(n,f) {
		if ( typeof _observers[n] === 'undefined' ) {
			_observers[n] = [];
		}
		_observers[n].push(f);
	}

	this.get = function(n) {
		return _properties[n];
	};
	this.set = function(n,v) {
		_properties[n] = v;
		informObservers(n);
	};
	this.addObserver = function(n,f) {
		if ( n instanceof Array ) {
			for (var i = 0; i < n.length; i++) {
				_addObserver(n[i],f);
			}
		} else {
			_addObserver(n,f);
		}
	};
	this.removeObserver = function(n,f) {
		if ( typeof _observers[n] === 'undefined' ) {
			return;
		}
		var i = _observers[n].indexOf(f);
		if ( i == -1 ) {
			return;
		}
		_observers[n].splice(i,1);
	};
	this.toObject = function() {
		var obj = {};
		for ( var at in _properties ) {
			if ( _properties.hasOwnProperty(at) ) {
				obj[at] = _properties[at];
			}
		}
		return obj;
	};
};

// extend the base object with a set of key-value properties and
// private properties (attrs)

Base.extend = function(child, attrs) {
	var obj = new Base();
	if ( child ) {
		for ( var prop in child ) {
			if ( child.hasOwnProperty(prop) ) {
				obj[prop] = child[prop];
			}
		}
	}
	if ( attrs ) {
		for ( var at in attrs ) {
			if ( attrs.hasOwnProperty(at) ) {
				obj.set(at, attrs[at]);
			}
		}
	}
	return obj;
};

// for arrays composed of Base objects

Array.prototype.addObserver = Array.prototype.addObserver 
	|| function(n,f) {
	this.forEach(function(el) {
		el.addObserver(n,f)
	});
};

Array.prototype.removeObserver = Array.prototype.removeObserver 
	|| function(n,f) {
	this.forEach(function(el) {
		el.removeObserver(n,f);
	});
};