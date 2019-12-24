var jobStatus = {flag: 0, username: "17755117870"};
var serviceUrl = "http://yhj6688.top:8799/dftt-service";
//serviceUrl = "http://localhost:8799/dftt-service";

var cookiestr = "";
chrome.cookies.getAll({url: "http://zk.gxrdwl.com"}, function (cookies) {
    $.each(cookies, function (i, cookie) {
        var c = cookie.name + "=" + cookie.value + ";";
        cookiestr += c;
    })
});

chrome.cookies.onChanged.addListener(function (obj) {
    if (obj.cookie.domain == "zk.gxrdwl.com") {
        var cc = "";
        chrome.cookies.getAll({url: "http://zk.gxrdwl.com"}, function (cookies) {
            $.each(cookies, function (i, cookie) {
                var c = cookie.name + "=" + cookie.value + ";";
                cc += c;
                if (cookie.name == "refcount" && cookie.value == 8) {
                    chrome.cookies.remove({url: "http://zk.gxrdwl.com", name: "refcount"});
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
            chrome.tabs.update(tabs[0].id, {url: "http://zk.gxrdwl.com/index.php/main/task_main/main/pmv/77828"});
        });
    }
}

function pay(aliPayUrl) {
    chrome.tabs.create({url: aliPayUrl, selected: false, index: 100, active: false});
}

function updateTask(request) {
    console.log("updateTask");
    request.cookiestr = cookiestr;
    var response = null;
    $.ajax({
        url: serviceUrl + '/zhuanke/updateTask',
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

function createPddOrder(request) {
    console.log("createPddOrder");
    request.cookiestr = cookiestr;
    var response = null;
    $.ajax({
        url: serviceUrl + '/zhuanke/createPddOrder',
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
    request.cookiestr = cookiestr;
    var response = null;
    $.ajax({
        url: serviceUrl + '/zhuanke/orderstatus',
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
    var response = null;
    //console.log("cookiestr:", cookiestr);
    $.ajax({
        url: serviceUrl + '/zhuanke/confirmTask',
        type: 'POST',
        //async: false,
        data: {
            taskSn: request.taskSn,
            pjcontent: request.pjcontent,
            cookiestr: cookiestr
        },
        dataType: 'json',
        success: function (data) {
            response = data;
            console.log(request.taskSn + "|请求拼多多确认收货结果:", response);
        }
    });
    return response;
}

function updateMall(request) {
    if (jobStatus.username != "") {
        $.ajax({
            url: serviceUrl + '/zhuanke/updateMall',
            type: 'POST',
            data: {
                username: jobStatus.username,
                cookiestr: cookiestr,
                taskId: request.taskId
            },
            dataType: 'json',
            success: function (data) {
                console.log("更新店铺结果:", data);
            }
        });
    }
}

function updatePayedOrderStatus() {
    if (jobStatus.username != "") {
        $.ajax({
            url: serviceUrl + '/zhuanke/updatePayedOrderStatus',
            type: 'POST',
            data: {
                username: jobStatus.username,
                cookiestr: cookiestr
            },
            dataType: 'json',
            success: function (data) {
                console.log("更新订单状态结果:", data);
            }
        });
    }
}


// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.taskStatus == '等待付款') {
        var response = updateTask(request);
        console.log("回复消息：", response)
        sendResponse(response);
    } else if (request.taskStatus == '生成订单') {
        var response = createPddOrder(request);
        console.log("回复消息：", response)
        sendResponse(response);
    } else if (request.taskStatus == '订单状态') {
        var response = orderstatus(request);
        console.log("回复消息：", response)
        sendResponse(response);
    } else if (request.taskStatus == '商家已发货') {
        var response = confirmPddOrder(request);
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
    } else if (request.taskStatus == 'cookie') {
        sendResponse(cookiestr);
    } else if (request.taskStatus == 'setUsername') {
        jobStatus.username = request.username;
        sendResponse("设置用户成功.");
    } else if (request.taskStatus == '重新查找下店铺') {
        var response = updateMall(request);
        console.log("回复消息：", response)
        sendResponse(response);
    } else if (request.taskStatus == '刷新任务') {
        updatePayedOrderStatus(request);
        sendResponse("刷新任务成功");
    } else if (request.taskStatus == 'ali') {
        pay(request.aliPayUrl);
        sendResponse("打开支付宝页面支付成功");
    }
});
