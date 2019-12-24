var jobStatus = {flag: 0, username: "", Authorization: ""};
var serviceUrl = "http://yhj6688.top:8799/dftt-service";
//serviceUrl = "http://localhost:8799/dftt-service";

var cookiestr = "";
chrome.cookies.getAll({url: "https://wap.pinke66.com"}, function (cookies) {
    $.each(cookies, function (i, cookie) {
        var c = cookie.name + "=" + cookie.value + ";";
        cookiestr += c;
    })
});

chrome.cookies.onChanged.addListener(function (obj) {
    if (obj.cookie.domain == "www.pinke66.com") {
        var cc = "";
        chrome.cookies.getAll({url: "https://wap.pinke66.com"}, function (cookies) {
            $.each(cookies, function (i, cookie) {
                var c = cookie.name + "=" + cookie.value + ";";
                cc += c;
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
            chrome.tabs.update(tabs[0].id, {url: "https://wap.pinke66.com/task/index"});
        });
    }
}

function updateTask(request) {
    console.log("updateTask");
    var response = null;
    $.ajax({
        url: serviceUrl + '/pinkeduo/wap/updateTask',
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

function updatePayedOrderStatus() {
    if (jobStatus.username != "" && jobStatus.Authorization != "") {
        $.ajax({
            url: serviceUrl + '/pinkeduo/wap/updatePayedOrderStatus',
            type: 'POST',
            data: {
                username: jobStatus.username,
                Authorization: jobStatus.Authorization,
                cookiestr: cookiestr
            },
            dataType: 'json',
            success: function (data) {
                console.log("更新订单状态结果:", data);
            }
        });
    }
}

function orderstatus(request) {
    console.log("orderstatus");
    request.cookiestr = cookiestr;
    request.Authorization = jobStatus.Authorization;
    var response = null;
    $.ajax({
        url: serviceUrl + '/pinkeduo/orderstatus',
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
        url: serviceUrl + '/pinkeduo/confirmTask',
        type: 'POST',
        async: false,
        data: {
            taskSn: request.taskSn,
            cookiestr: cookiestr,
            Authorization: jobStatus.Authorization
        },
        dataType: 'json',
        success: function (data) {
            response = data;
            console.log("请求拼多多确认收货结果:", response);
        }
    });
    return response;
}

function pay(aliPayUrl) {
    chrome.tabs.create({url: aliPayUrl, selected: false, index: 1, active: false});
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
    } else if (request.taskStatus == '重新开始接取任务') {
        setTimeout(function () {
            jobStatus.flag = 1;
        }, request.time);
        sendResponse("重新开始接取任务");
    } else if (request.taskStatus == '结束接取任务') {
        jobStatus.flag = 0;
        sendResponse("已结束接取任务");
    } else if (request.taskStatus == 'getUsername') {
        sendResponse(jobStatus);
    } else if (request.taskStatus == 'setUsername') {
        jobStatus.username = request.username;
        jobStatus.Authorization = request.Authorization;
        sendResponse(jobStatus);
    } else if (request.taskStatus == 'ali') {
        pay(request.aliPayUrl);
    }
});