

// Requires dataset_parser.js

$(function() {
  "use strict";

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
     
      var lines = f.target.result.trim().split(/\r?\n|\r/g);
      var format = (new DataSetParser).formatOf(lines[0]);

      if (!format) {
        console.log("Unable to parse file");
        $('#drop-zone').addClass("file-error");
        $('#drop-zone .or-drop').text("Unable to parse this file. TAGS and BAS formats are currently supported.");
        return;
      } else {
        console.log("Parsed file format:", format.name);
      }

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

      //console.log(vals);

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
    if (!validateInput()) {
      $('#validation-error').show();
      return false;
    } else {
      $('#validation-error').hide();
    }
    
    var url = "http://test.cybercommons.org/queue/run/geologger.importTagData@geologger";
    var upload = dataForUpload();
    
    //console.log(JSON.stringify(upload));
    console.log("uploading");

    $('#upload-indicator').spin({
      color: '#333',
      radius: 4,
      width: 2
    });
    $('.uploading-notification').show();


    $.ajax({type:"POST", url: url, data: {data: JSON.stringify(upload), user_id: "true" }, dataType: "json", xhrFields: {withCredentials: true}, crossDomain: false }).then(function(data) {
      return (new CyberCommons()).getStatusOfTask(data.task_id);
    }).then(function(data) {
      console.log("post completed", data);
      showUploadSuccess(data);
    },function(error) {
      console.log("post failed", error);
      showUploadError(data);
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

  function showUploadSuccess(data) {
    // stop indicators
    $('.uploading-notification').hide();
    $('#upload-indicator').spin(false);

    // reload dataset list
    showDatasets(function() {

      // build success html
      $('#upload-success .title').text(get('name'));
      $('#upload-success .link').attr('href', "datasets/"+get('name'));

      // show success notifications
      $('#upload-success').show();
      $(window).scrollTop(0);

      // respond to a link click
      $('#upload-success .link').click(function() {
        $('#newbird').hide();
        $('#viewbird').show();
        loadDataset($('#upload-success .title').text());
        return false;
      });

    });;
  }

  function showUploadError(data) {
    $('.uploading-notification').hide();
    $('#upload-indicator').spin(false);

    $('#upload-error').show();
    $(window).scrollTop(0);
  }

});
