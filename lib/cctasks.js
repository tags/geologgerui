// Some helpers for running Cybercommons Tasks
// Should point to queue submission target
// Configuration object for calling cybercom queue tasks.
// Parameters can be specified in [params] list object, or a special list of 
// jQuery selectors can be provided to grab the current values of these form elements at run-time.
/*
taskdesc = { 
    "taskname":   'cybercomq.static.tasks.modiscountry',
    "taskq":      'static',
    "params":     ['MOD09A1_ndvi','MX','2010-10-10','2010-11-1'],   // Fixed params 
    "uiparams":   ['#product','#country','#start_date','#end_date'],// UI Selected
    "status":     '#status',
    "spinner":    '#spinner',
    "pollinterval": 2000
}

*/
// Called by call task to poll queue status of task based on task_id

function test_auth_tkt() {
    $("#auth_dialog").hide();
    if ($.cookie('auth_tkt') ) {
        $('#auth_message').html("you're logged in");
    }
    else {
        $("#auth_dialog").html("In order to keep track of jobs you've requested, please login to the cyberCommons.")
            .dialog( { height:200, modal: true} )
            .dialog("open");
        $('#auth_message').html('Please <a href="http://test.cybercommons.org/accounts/login/">login</a> to track your tasks via the cybercommons')
            .addClass('label warning');
    }

}

function poll_status(args) {
    $.getJSON(args.host + args.task_id + '?callback=?', function (data) {
        if (data.status == "PENDING") {
            options.onPending(args.task_id);
        } else if (data.status == "FAILURE") {
            options.onFailure(data);
        } else if (data.status == "SUCCESS") {
            options.onSuccess(data);
        }
    });
}

function calltask(taskdesc) {
    defaults = {
        "service_host": 'http://test.cybercommons.org/queue/run/',
        "poll_target": 'http://test.cybercommons.org/queue/task/',
        "status": '#status',
        "spinner": '#spinner',
        "pollinterval": 2000,
        "onPending": function (task_id) {
            $(options.status).show()
                .removeClass('label success warning important')
                .addClass('label warning')
                .text("Working...");
            $(options.spinner).show();
            setTimeout(function () {
                var poll = {};
                poll.host =  options.poll_target;
                poll.task_id = task_id;
                poll_status(poll);
            }, options.pollinterval);

        },
        "onFailure": function (data) {
            $(options.status).show()
                .removeClass('label success warning important')
                .addClass('label important')
                .text("Task failed!");
            $(options.spinner).hide();
        },
        "onSuccess": function (data) {
            $(options.status).show()
                .removeClass('label success warning important')
                .addClass('label success')
                .html('<a href="' + data.tombstone[0].result + '">Download</a>');
            $(options.spinner).hide();
        }
    };
    
    options = $.extend(true, {}, defaults, taskdesc);

    var taskparams = "";
    if (options.params) {
        for (item in options.params) {
            taskparams = taskparams.concat('/' + options.params[item]);
        }
    } else if (options.uiparams) {
        for (item in options.uiparams) {
            taskparams = taskparams.concat('/' + $(options.uiparams[item]).val());
        }
    }
    var taskcall = "";
    if (options.taskq) {
        taskcall = options.taskname + '@' + options.taskq;
    } else {
        taskcall = options.taskname;
    }

    var request = options.service_host + taskcall + taskparams;

    $.getJSON(request + '?callback=?', function (data) {
        $(options.status).text('Task submitted...');
        var task_id = data.task_id;
        setTimeout(function () {
            var poll = {};
            poll.host = options.poll_target; 
            poll.task_id = task_id;
            poll_status(poll);
        }, taskparams.pollinterval);
    });
}
