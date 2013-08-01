
var CyberCommons = function() {
	function pollStatus(args) {
    $.getJSON(args.host + args.task_id + '?callback=?')
      .fail(function(jqXHR, status) {
      	args.onFailure(jqXHR, status);
      })
      .done(function(data) {
        if (data.status == "PENDING") {
          args.onPending(args.task_id);
        } else if (data.status == "FAILURE") {
          args.onFailure(data);
        } else if (data.status == "SUCCESS") {
          args.onSuccess(data);
        }
      });
	}

	this.getStatusOfTask = function(taskID) {
		var promise = new $.Deferred();
		var timer;
		var args = {
			host: app.get('host') + "/queue/task/",
			task_id: taskID,
			onFailure: function(data) {
				clearInterval(timer);
				promise.reject(undefined,data);
			},
			onSuccess: function(data) {
				clearInterval(timer);
				promise.resolve(data);
			},
			onPending: function() {
				; // nothing
			}
		}
		timer = setInterval(function () {
			pollStatus(args);
		}, 2000);
		return promise;
	}
}