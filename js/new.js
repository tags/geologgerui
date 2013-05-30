var eli1 = "datetime,light";
var eli2 = "2011-06-18 10:24:30,2";
var bas = "ok,19/02/10 20:16:00,40228.844444,9";
var sumner = "1  1 2000-10-27 22:44:00     191   NA     0";
var stefan1 = "datetime        light";
var stefan2 = "01.07.2010 00:01        2";

var exp = {
  eli: {
    name: "TAGS",
    header: /(datetime,light)/,
    re: /(\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d),(\d+)/,
    parse: function(d) {
      // new Date(d) works as well, but let's be specific
      return new Date(d.replace(' ','T') + 'Z');
    },
    dateIndex: 1,
    lightIndex: 2
  },
  bas: {
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
};

console.log(exp.bas.header);

var eliReg1 = /(datetime,light)/;
var eli1Match = eli1.match(eliReg1);
console.log(eli1Match);

var eli2Reg = /(\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d),(\d+)/;
var eli2Match = eli2.match(eli2Reg);
console.log(eli2Match);
console.log(exp.eli.parse(eli2Match[1]));

var basReg = /\w*,(\d\d\/\d\d\/\d\d \d\d:\d\d:\d\d),\d+.*\d+,(\d+)/;
var basMatch = bas.match(basReg);
console.log(basMatch);
console.log(new Date(exp.bas.parse(basMatch[1])));

console.log(dataFormat(eli1).name);
console.log(dataFormat(eli2).name);
console.log(dataFormat(bas).name);


function dataFormat(line) {
  var exp = expressions();
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

function expressions() {
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


$(function() {

  var data = undefined;

  // todo: limit to one

  function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object
    var file = files[0];
    importFile(file);
  }

  function handleFileDrop(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    var files = evt.dataTransfer.files; // FileList object.
    var file = files[0];
    importFile(file);
  }

  function importFile(file) {
    var reader = new FileReader();

    reader.onload = function(f) {
      console.log(f.target.result);
      var lines = f.target.result.trim().split(/\r?\n|\r/g);
      console.log(lines);
      var format = dataFormat(lines[0]);
      console.log(format.name);

      if (format.hasHeader) lines.shift();
      var vals = _.map(lines, function(x) {
        var match = x.match(format.re);
        //console.log(match);
        if (!match) { 
          // this is an error, which we should keep track of
          return undefined; 
        } else { 
          return {
            datetime: format.parse(match[format.dateIndex]),
            light: match[format.lightIndex]
          }
        }
      });

      console.log(vals);

      var template = _.template($('script.dataset-info-template').html());
      $('#drop-zone .or-drop').html(template({
        filename: escape(file.name),
        filesize: file.size,
        format: format.name,
        datacount: vals.length
      }));

      $('#drop-zone').addClass('file-success');
      $('#drop-zone').removeClass("file-invalid");
      $('#file-input').removeClass('error');
      data = vals;
    }
    reader.readAsText(file);
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
  }

  document.getElementById('file-input').addEventListener('change', handleFileSelect, false);

  var dropZone = document.getElementById('drop-zone');
  dropZone.addEventListener('dragover', handleDragOver, false);
  dropZone.addEventListener('drop', handleFileDrop, false);


  var DateFormat = "yy-mm-dd";
  $('input[name=release-date], input[name=capture-date]').datepicker({
      showOtherMonths: true,
      selectOtherMonths: true,
      defaultDate: new Date(),
      dateFormat: DateFormat
    });


  $('#create-new-dataset').submit(function() {
    if (!validateInput()) return false;
    
    var url = "http://test.cybercommons.org/queue/run/geologger.importTagData@geologger";
    var upload = dataForUpload();
    console.log(JSON.stringify(upload));

    $.post(url, {data: JSON.stringify(upload)}, null, "json").then(function(data) {
      return (new CyberCommons()).getStatusOfTask(data.task_id);
    }).then(function(data) {
      log("post completed", data);
    },function(error) {
      log("post failed", error);
    });

    return false;
  });

  function dataForUpload() {
    return {
      data: data,
      tagname: get('name'),
      species: get('species'),
      notes: getNotes(),
      release_location: getLocation('release'),
      release_time: get('release-date'),
      recapture_location: getLocation('capture'),
      recapture_time: get('capture-date')
    };
  }

  function validateInput() {
    var valid = true;
    valid = validateData() && valid;
    valid = validateName() && valid;
    return valid;
  }

  function validateData() {
    if (!data) {
      $('#drop-zone').addClass("file-invalid");
      $('#file-input').addClass('error');
      return false;
    } else {
      $('#drop-zone').removeClass("file-invalid");
      $('#file-input').removeClass('error');
      return true;
    }
  }

  function validateName() {
    if (get('name').length == 0) {
      $('#name').addClass('error');
      return false;
    } else {
      $('#name').removeClass('error');
      return true;
    }
  }

  function get(id) {
    return $('input[name='+id+']').val().trim();
  }

  function getLocation(id) {
    var lat = parseFloat(get(id+'-latitude'));
    var lon = parseFloat(get(id+'-longitude'));
    if (isNaN(lat) || isNaN(lon)) return [];
    else return [lat, lon];
  }

  function getNotes() {
    return $('textarea[name=notes]').val().trim();
  }

});