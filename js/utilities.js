_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};

_.reversecopy = function(a) {
	var temp = [];
  var len = a.length;
  for (var i = (len - 1); i >= 0; i--) {
      temp.push(a[i]);
  }
  return temp;
}

_.filterUntil = function(flag, list, iterator) {
	var results = [];
	for ( var i = 0; i < list.length; i++ ) {
		var res = iterator(list[i]);
		if (res==false) continue;
		if (res==flag) break;
		results.push(list[i]);
	}
	return results;
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}