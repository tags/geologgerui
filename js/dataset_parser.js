var DataSetParser = function() {};

DataSetParser.prototype.expressions = function() {
  return [
    {
      name: "TAGS",
      header: /(datetime,light)/,
      hasHeader: true,
      re: /(\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d),(\d+)/,
      parse: function(d) {
        // new Date(d) works as well, but let's be specific
        return new Date(d.replace(' ','T') + 'Z');
      },
      dateIndex: 1,
      lightIndex: 2
    },
    {
      name: "BAS",
      re: /\w*,(\d\d\/\d\d\/\d\d \d\d:\d\d:\d\d),\d+.*\d+,(\d+)/,
      parse: function(d) {
        // day/month/2year
        var day = d.slice(0,2);
            month = d.slice(3,5);
            year = "20" + d.slice(6,8);
            time = d.slice(9,17);
        return new Date(year+"-"+month+"-"+day+"T"+time+"Z");
      },
      dateIndex: 1,
      lightIndex: 2
    }
  ];
}

DataSetParser.prototype.formatOf = function(line) {
  var exp = this.expressions();
  for (var i = 0; i < exp.length; i++) {
    var format = exp[i];
    if (format.header && line.match(format.header)) {
      return format;
    } else if (line.match(format.re)) {
      return format;
    }
  }
  return null;
}