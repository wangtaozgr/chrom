$(document).ready(function () {
    getTaskstatus();
});

//到后台查询是否要接取任务
function getTaskstatus() {
    chrome.runtime.sendMessage({
        taskStatus: "是否开始接取任务"
    }, function (response) {
		if (response.flag == 1) {
            if(window.location.host=="mclient.alipay.com"){
                var href = $("a.J-h5pay.am-button.am-button-white").attr("href");
                if(href) location.href=href;
                $("div.am-content .J-h5pay.am-button.am-button-blue").click();
                var title = $(".title-main").text();
                if(title=='付款详情'){
                    $("div.am-content.J-cashierPreConfirm #cashierPreConfirm .am-button.am-button-blue").click();
                    setTimeout(function(){
						$("#spwd_unencrypt").focus();
						$("#spwd_unencrypt").val("710464").change();
						$("#cashier").submit();
                    },2000);
                }else if(title=='输入支付密码'){
                    $("#spwd_unencrypt").focus();
					$("#spwd_unencrypt").val("710464").change();
                    $("#cashier").submit();
                }else if(title=='安全保护') {
                    var answer = $("input[name='answer']").attr("placeholder");
                    if(answer=='银行卡卡号'){
                        $("input[name='answer']").val("6259063406167224").change();
                        $("#cashier .am-section .am-button.am-button-blue").click();
                    }else if(answer=='身份证后6位'){
                        $("input[name='answer']").val("260036").change();
                        $("#cashier .am-section .am-button.am-button-blue").click();
                    }
                }else if(title=='支付宝'||title=='付款结果'){
                    var info = $(".am-act.am-act-success h4").text();
                    if(info=='支付成功'||info=='付款成功') {
                        chrome.runtime.sendMessage({
                            taskStatus: "closeWin",
                            url:location.href
                        }, function (response) {
                        });
                    }
                }else if(title=='短信校验码'){

                }
                /*setTimeout(function(){
                    $("div.am-content.J-cashierPreConfirm #cashierPreConfirm .am-button.am-button-blue").click();
                    setTimeout(function(){
                        $("#pwd_unencrypt").focus();
                        $("#pwd_unencrypt").val("wang2710464").change();
                        $("#cashier .am-section .am-button.am-button-blue").click();
                    },3000);
                },2000);*/
            }
        }
        /*if (response.flag == 1) {
            if(window.location.host=="mclient.alipay.com"){
                var href = $("a.J-h5pay.am-button.am-button-white").attr("href");
                if(href) location.href=href;
                $("div.am-content .J-h5pay.am-button.am-button-blue").click();
                setTimeout(function(){
                    $("div.am-content.J-cashierPreConfirm #cashierPreConfirm .am-button.am-button-blue").click();
                    setTimeout(function(){
						$("#spwd_unencrypt").focus();
						$("#spwd_unencrypt").val("789789").change();
                        $("#cashier").submit();
                    },3000);
                },2000);
            }
        }*/
    });
    var info = $(".J-success.am-act.am-act-success h4.J-text").text();
    if(info=='支付成功') {
        chrome.runtime.sendMessage({
            taskStatus: "closeWin",
            url:location.href
        }, function (response) {
        });
    }
}

//通知后台结束接取任务
function sendEndReciveTaskMsg() {
    chrome.runtime.sendMessage({
        taskStatus: "结束接取任务"
    }, function (response) {
    });

}

function sendStartReciveTaskMsg() {
    chrome.runtime.sendMessage({
        taskStatus: "开始接取任务"
    }, function (response) {
    });
    getTaskstatus();
}

function sendMallTaskMsg(taskId) {
    chrome.runtime.sendMessage({
        taskStatus: "重新查找下店铺",
        taskId:taskId
    }, function (response) {
    });
}

//拼多多付款
function createPddOrder(username, taskId, taskSn, taskStatus, taskPrice, taskGold, taskSearchType, taskRecType, taskOrderType) {
    $.ajax({
        url: 'TaskDetails.aspx?id=' + taskId,
        type: 'GET',
        async: false,
        success: function (data) {
            var taskDetail = data;
            chrome.runtime.sendMessage({
                username: username,
                taskId: taskId,
                taskSn: taskSn,
                taskStatus: taskStatus,
                taskPrice: taskPrice,
                taskGold: taskGold,
                taskSearchType: taskSearchType,
                taskRecType: taskRecType,
                taskOrderType: taskOrderType,
                taskEvaluateType: "1",//自由评价
                taskDetail: taskDetail
            }, function (response) {
                setLog(taskId + "|拼多多付款结果:" + response.msg);
                if (response == null) {
                    alert("系统异常，请联系管理员!");
                }
                if (response.status == 0) {
                    if (response.msg == '生成订单失败,没有找到相符的商品!') {
                        $.ajax({
                            url: '/user/MyRecTaskList.aspx?cancel=cancel&id=' + taskId + '&state=6',
                            type: 'GET',
                            async: false,
                            success: function (data) {
                                console.log(taskSn + '|订单已取消|' + data);
                                sendStartReciveTaskMsg();
                                //可以开始接任务了
                            }
                        });
                    } else if (response.msg == '没有找到合适的商品!') {
                        $.ajax({
                            url: '/user/MyRecTaskList.aspx?cancel=cancel&id=' + taskId + '&state=6',
                            type: 'GET',
                            async: false,
                            success: function (data) {
                                console.log(taskSn + '|订单已取消|' + data);
                                sendMallTaskMsg(taskId);
                                sendStartReciveTaskMsg();
                                //可以开始接任务了
                            }
                        });
                    } else {
                        alert(response.msg);
                    }
                } else if (response.status == 1 && response.data.pddOrderStatus == "0") {//待支付
                    //console.log(response.data.aliPayUrl);
                    var tempwindow = window.open('_blank');
                    tempwindow.location = response.data.aliPayUrl;
                    setInterval(function () {//定时查询订单状态
                        chrome.runtime.sendMessage({
                            taskStatus: "订单状态",
                            username: username,
                            taskSn: taskSn
                        }, function (orderstatusres) {
                            console.log(taskSn + '|定时查询订单状态:|' + (orderstatusres.data.pddOrderStatus == "1" ? "已付款" : "未付款"));
                            if (orderstatusres.status == 1 && orderstatusres.data.pddOrderStatus == "1") {//已付款
                                $.ajax({
                                    url: 'SubMitOrderForm.aspx?id=' + taskId,
                                    type: 'POST',
                                    contentType: "application/x-www-form-urlencoded",
                                    async: false,
                                    data: {
                                        SiteOrderNo: response.data.pddOrderNo,
                                        taskid: taskId,
                                        Address: response.data.name
                                    },
                                    success: function (data) {
                                        console.log(taskSn + '|订单已支付|' + data);
                                        sendStartReciveTaskMsg();
                                    }
                                });
                            }
                        });
                    }, 10000);

                } else if (response.status == 1 && response.data.pddOrderStatus == "1") {//已付款
                    $.ajax({
                        url: 'SubMitOrderForm.aspx?id=' + taskId,
                        type: 'POST',
                        contentType: "application/x-www-form-urlencoded",
                        async: false,
                        data: {
                            SiteOrderNo: response.data.pddOrderNo,
                            taskid: taskId,
                            Address: response.data.name
                        },
                        success: function (data) {
                            console.log(taskSn + '|订单已支付|' + data);
                            sendStartReciveTaskMsg();
                        }
                    });
                }
            });
        }
    });
}

//拼多多确认收货
function confirmPddOrder(username, taskSn, pjcontent) {
    console.log(taskSn + '|往后台发送消息(商家已发货)，请求拼多多确认收货.');
    chrome.runtime.sendMessage({
        username: username,
        taskStatus: "商家已发货",
        pjcontent: pjcontent,
        taskSn: taskSn
    }, function (response) {
        //console.log(taskSn+'|收到来自后台的回复|'+response.msg);
    });
}

//今天的时间
function getToday() {
    var d = new Date();
    var year = d.getFullYear();
    var month = (new Date().getMonth() + 1) + "";
    if (month.length == 1) month = "0" + month;
    var date = d.getDate() + "";
    if (date.length == 1) date = "0" + date;
    return year + "-" + month + "-" + date;
}

//接取任务
function startWapTask() {
    var taskId = null;
    var taskSuc = false;
    var today = getToday();
    var taskIds = [];
    var taskId01 = [];
    var taskId02 = [];
    var task01 = 0;
    var task02 = 0;
    var noUsedtaskId = getNoUsedTaskId();
    $(".mybody_new").find("table.mlkmd").each(function () {
        var price = $(this).find(".ckdn1").text().trim().replace(/￥/g, '').replace(/元/g, '');
        var shao = $.trim($(this).find(".njmdh").find(".xpd2").text());
        var shui = $.trim($(this).find(".njmdh").find(".xpd3").text());
        var liao = $.trim($(this).find(".njmdh").find(".xpd4").text());
        var qian = $.trim($(this).find(".njmdh").find(".xpd5").text());
        var buyType = $.trim($(this).find(".yansed2").text());
        var taskTime = $.trim($(this).find(".cljd span").text());
        taskTime = $.trim(taskTime.substring(taskTime.indexOf("201")));
        var productImg = $.trim($(this).find("td.njdnd img").attr("src"));
        if (!taskTime.startsWith(today)) return true;
        if (buyType == '单买') return true;
        if (shui != '随') return true;
        if (liao == '聊') return true;
        if (qian == '签') return true;
        if (shao == '类') return true;
        //if (shao == '扫') return true;
        if (shao == '搜' && productImg.indexOf("yangkeduo") == -1) return true;

        var jdtext = $(this).find(".delmd").attr("onclick");
        taskId = jdtext.replace('show(', '').replace(')', '');
        if (noUsedtaskId != null && noUsedtaskId.indexOf(taskId) > -1) return true;
        var gold = $(this).find("span.clhndn").text().trim().replace(/￥/g, '').replace(/元/g, '');
        if (parseFloat(price) < 30) {
            var obj = {taskId: taskId, price: parseFloat(price), gold: parseFloat(gold)};
            taskIds.push(obj);
        }
    });
    taskIds.sort(function (obj01, obj02) {
        if (obj02.gold - obj01.gold > 0) {
            return 1;
        } else if (obj02.gold - obj01.gold == 0) {
            if (obj02.price - obj01.price < 0) {
                return 1;
            }
        }
        return -1;
    });
    console.log("可接取任务id:" + JSON.stringify(taskIds));
    var end = false;
    $.each(taskIds, function (i, v) {
        var taskId = v.taskId;
        $.ajax({
            url: "/wap/user/newtasklist.aspx",
            type: "POST",
            async: false,
            data: {"taskid": taskId, "action": "jiedan"},
            dataType: "json",
            success: function (result) {
                console.log(result);
                setLog("taskId=" + taskId + ";price=" + v.price + ";gold=" + v.gold + "|接取任务返回:" + JSON.stringify(result));
                if (result.IsSuccess) {
                    setNoUsedTaskId(taskId);
                    sendEndReciveTaskMsg();
                    setTimeout(function () {
                        window.location.href = '/user/MyRecTaskList.aspx?state=6';
                    }, 30000);
                    end = true;
                } else if (result.Message == '待付款任务已超过1个，无法再次接取任务!') {
                    sendEndReciveTaskMsg();
                    window.location.href = '/user/MyRecTaskList.aspx?state=6';
                    end = true;
                } else if (result.Message.indexOf('任务上限') > 0) {
                    sendEndReciveTaskMsg();
                    end = true;
                    alert(result.Message);
                } else if (result.Message == '由于商家限制二次接单天数间隔，目前无法接单!') {
                    setNoUsedTaskId(taskId);
                } else {
                    end = false;
                }
            }
        });
        return !end;
    });
    return end;
}

//存放所有今天不能接取的任务id
function setNoUsedTaskId(taskSn) {
    var today = getToday();
    var noUsedtaskId = getNoUsedTaskId();
    if (noUsedtaskId == null) noUsedtaskId = "";
    localStorage.setItem(today, noUsedtaskId + "," + taskSn);
}

//获取所有今天不能接取的任务id
function getNoUsedTaskId() {
    var today = getToday();
    return localStorage.getItem(today);

}

function setLog(msg) {
    var logmsg = localStorage.getItem("tasklog")
    localStorage.setItem("tasklog", logmsg + "\r\n" + msg);
}

//接收后台消息用的
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var taskSuc = false;
    if (request.refreshPddOrder) {
        refreshPddOrder();
        sendResponse({taskSuc: false});
    }
});