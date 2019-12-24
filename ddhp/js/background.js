var jobStatus = {flag: 0, username: ""};
var serviceUrl = "http://yhj6688.top:8799/dftt-service";
//serviceUrl = "http://localhost:8799/dftt-service";

var cookiestr = "";
chrome.cookies.getAll({url: "http://wap.pinke66.com"}, function (cookies) {
    $.each(cookies, function (i, cookie) {
        var c = cookie.name + "=" + cookie.value + ";";
        cookiestr += c;
    })
});

chrome.cookies.onChanged.addListener(function (obj) {
    if (obj.cookie.domain == "app.ddhaoping.com") {
        var cc = "";
        chrome.cookies.getAll({url: "http://app.ddhaoping.com"}, function (cookies) {
            $.each(cookies, function (i, cookie) {
                var c = cookie.name + "=" + cookie.value + ";";
                cc += c;
                if (cookie.name == "refcount" && cookie.value == 8) {
                    chrome.cookies.remove({url: "http://app.ddhaoping.com", name: "refcount"});
                }
            })
            cookiestr = cc;
        });
    }
});

function sendMessageToContentScript(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
            if (callback) callback(response);
        });
    });
}

function startTask() {
    console.log('startTask', jobStatus.flag);
    if (jobStatus.flag == 1) {
        console.log('发送开始接任务消息-跳转到任务页面.');
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            chrome.tabs.update(tabs[0].id, {url: "https://app.ddhaoping.com/task/index"});
        });
    }
}

function updateTask(request) {
    console.log("updateTask");
    var response = null;
    $.ajax({
        url: serviceUrl + '/ddhp/wap/updateTask',
        type: 'POST',
        async: false,
        data: request,
        dataType: 'json',
        success: function (data) {
            response = data;
        }
    });
    return response;

}

function orderstatus(request) {
    console.log("orderstatus");
    var response = null;
    $.ajax({
        url: serviceUrl + '/ddhp/orderstatus',
        type: 'POST',
        async: false,
        data: request,
        dataType: 'json',
        success: function (data) {
            response = data;
        }
    });
    return response;
}

function confirmPddOrder(request) {
    var response = {msg: "系统异常"};
    console.log("cookiestr:", cookiestr);
    $.ajax({
        url: serviceUrl + '/ddhp/confirmTask',
        type: 'POST',
        async: false,
        data: {
            taskSn: request.taskSn,
            cookiestr: cookiestr
        },
        dataType: 'json',
        success: function (data) {
            response = data;
            console.log("请求拼多多确认收货结果:", response);
        }
    });
    return response;
}


// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log("收到消息：", request.taskStatus);
    if (request.taskStatus == '待提交') {
        var response = updateTask(request);
        console.log("待提交 回复消息：", response)
        sendResponse(response);
    } else if (request.taskStatus == '订单状态') {
        var response = orderstatus(request);
        console.log("回复消息：", response)
        sendResponse(response);
    } else if (request.taskStatus == '商家已发货') {
        var response = confirmPddOrder(request);
        console.log("回复消息：", response)
        sendResponse(response);
    } else if (request.taskStatus == '是否开始接取任务') {
        sendResponse(jobStatus);
    } else if (request.taskStatus == '开始接取任务') {
        jobStatus.flag = 1;
        sendResponse("正在接取任务");
    } else if (request.taskStatus == '结束接取任务') {
        jobStatus.flag = 0;
        sendResponse("已结束接取任务");
    } else if (request.taskStatus == 'getUsername') {
        sendResponse(jobStatus);
    } else if (request.taskStatus == 'setUsername') {
        jobStatus.username = request.username;
        sendResponse(jobStatus);
    }
});