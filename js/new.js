

// Requires dataset_parser.js

$(function() {

  var data = undefined;

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
      //console.log(f.target.result);
      var lines = f.target.result.trim().split(/\r?\n|\r/g);
      //console.log(lines);
      var format = (new DataSetParser).formatOf(lines[0]);

      if (!format) {
        console.log("Unable to parse file");
        $('#drop-zone').addClass("file-error");
        $('#drop-zone .or-drop').text("Unable to parse this file. TAGS and BAS formats are currently supported.");
        return;
      }

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

      $('#drop-zone').removeClass("file-invalid");
      $('#drop-zone').removeClass("file-error");
      $('#drop-zone').addClass('file-success');
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