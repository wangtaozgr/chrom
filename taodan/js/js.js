//var taskUrl = "http://www.053666.cn/user/newtasklist.aspx?OrderBy=&BuyType=2&price=0;50&RecType=&OrderType=&searchWord=";
var taskUrl = 'http://www.053666.cn/wap/user/newtasklist.aspx?page=5';
$(document).ready(function () {
    var username = $.trim($("#dengluh").text());
    if (username != "") {
        chrome.runtime.sendMessage({
            taskStatus: "setUsername",
            username: username
        }, function (response) {
            console.log(response);
        });
    }

    if (window.location.href == "http://www.053666.cn/user/MyRecTaskList.aspx?state=6") {
        if ($("table.nhtrd .yndhd").size() == 0) {
            sendStartReciveTaskMsg();
        }
        $("table.nhtrd .yndhd").each(function (i, v) {
            var taskSn = $.trim($(this).find(".mhmkdd p a").text());
            var productImg = $.trim($(this).find(".mhmkdd .pinmd img").attr("src"));

            var taskPrice = $.trim($(this).next().text());
            var taskSearchType = $.trim($(this).next().next().find(".bq2").text());
            var taskRecType = $.trim($(this).next().next().find(".bq3").text());
            var taskOrderType = $.trim($(this).next().next().find(".ytktd").text());
            var taskGold = $.trim($(this).next().next().next().text());
            var taskStatus = $.trim($(this).next().next().next().next().find(".cloq5").text());
            var pjcontent = $.trim($(this).next().next().next().next().find("a").attr("onclick"));
            pjcontent = pjcontent.substring(13, pjcontent.length - 20);
            var taskDiv = $(this).next().next().next().next().next().html();
            var start = taskDiv.indexOf("TaskDetails.aspx?id=") + 20;
            var end = taskDiv.indexOf("'});", start);
            var taskId = taskDiv.substring(start, end);
            if (taskStatus == '刷手已接单') {
                createPddOrder(username, taskId, taskSn, taskStatus, taskPrice, taskGold, taskSearchType, taskRecType, taskOrderType, productImg);
            }
        });
    }
    getTaskstatus();
})
;
var count = 0;

//到后台查询是否要接取任务
function getTaskstatus() {
    chrome.runtime.sendMessage({
        taskStatus: "是否开始接取任务"
    }, function (response) {
        console.log('接取任务状态：' + (response.flag == 1 ? "接单中" : "已结束"));
        if (response.flag == 1) {
            var isSuccess = startWapTask();
            console.log("isSuccess", isSuccess);
            if (!isSuccess) {
                setTimeout(function () {
                    window.location.href = taskUrl;
                }, 5000);
            }
        } else {

            setInterval(function () {
                chrome.runtime.sendMessage({
                    taskStatus: "是否开始接取任务"
                }, function (response) {
                    console.log('接取任务状态：' + (response.flag == 1 ? "接单中" : "已结束"));
                    if (response.flag == 1) {
                        window.location.href = taskUrl;
                    }
                })
            }, 15000);

        }
    });
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
    //getTaskstatus();
    window.location.href = taskUrl;
}

//发送后台，多少时间后重新开始接任务
function sendReStartReciveTaskMsg(time) {
    chrome.runtime.sendMessage({
        taskStatus: "重新开始接取任务",
        time: time
    }, function (response) {
    });
}

function sendMallTaskMsg(taskId) {
    chrome.runtime.sendMessage({
        taskStatus: "重新查找下店铺",
        taskId: taskId
    }, function (response) {
        console.log("重新查找下店铺返回:" + response);
        //setLog("重新查找下店铺返回:" + JSON.stringify(response));
    });
}

//拼多多付款
function createPddOrder(username, taskId, taskSn, taskStatus, taskPrice, taskGold, taskSearchType, taskRecType, taskOrderType, productImg) {
    $.ajax({
        url: 'TaskDetails.aspx?id=' + taskId,
        type: 'GET',
        dataType: 'html',
        async: false,
        error: function () {
            setTimeout(function () {
                location.reload()
            }, 10000);
        },
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
                if (response == null) {
                    setTimeout(function () {
                        window.location.href = '/user/MyRecTaskList.aspx?state=6';
                    }, 30000);
                    console.log("系统异常，请联系管理员.30秒后刷新!");
                    return;
                }
                //setLog(taskId + '|检测任务结果|', JSON.stringify(response));
                console.log(taskId + '|检测任务结果|', JSON.stringify(response));
                if (response.status == 0) {
                    $.ajax({
                        url: '/user/MyRecTaskList.aspx?cancel=cancel&id=' + taskId + '&state=6',
                        type: 'GET',
                        dataType: 'html',
                        async: false,
                        error: function () {
                            setTimeout(function () {
                                location.reload()
                            }, 10000);
                        },
                        success: function (data) {
                            console.log(taskSn + '|任务已取消|' + data);
                            if (response.msg == '没有找到店铺!') {
                                sendMallTaskMsg(taskId);
                            }
                            location.reload();
                        }
                    });
                } else if (response.status == 1) {
                    var sec = response.data == null ? 0 : response.data;
                    var lasttime = 180000 - sec < 0 ? 0 : 180000 - sec;
                    setTimeout(function () {
                        chrome.runtime.sendMessage({
                            taskStatus: "生成订单",
                            username: username,
                            taskId: taskId,
                            taskSn: taskSn
                        }, function (result) {
                            if (result == null) {
                                setTimeout(function () {
                                    window.location.href = '/user/MyRecTaskList.aspx?state=6';
                                }, 30000);
                                console.log("系统异常，请联系管理员.30秒后刷新!");
                                return;
                            }
                            console.log(taskSn + '|生成订单结果|' + result.msg);
                            if (result.status == 0) {
                                if (result.msg.indexOf('生成订单失败') > -1) {
									var logkey = getImageKey(productImg);
                                    setHmd(logkey);
                                }
                                $.ajax({
                                    url: '/user/MyRecTaskList.aspx?cancel=cancel&id=' + taskId + '&state=6',
                                    type: 'GET',
                                    dataType: 'html',
                                    async: false,
                                    error: function () {
                                        setTimeout(function () {
                                            location.reload()
                                        }, 10000);
                                    },
                                    success: function (data2) {
                                        console.log(taskSn + '|订单已取消|' + JSON.stringify(data2));
                                        location.reload();
                                    }
                                });
                            } else if (result.status == 2) {
                                if (result.msg == '生成订单失败,请输入验证码!') {
                                    setTimeout(function () {
                                        location.reload()
                                    }, 60000);
                                } else {
                                    alert(result.msg);
                                }
                            } else if (result.status == 1 && result.data.pddOrderStatus == "0") {//待支付
                                chrome.runtime.sendMessage({
                                    taskStatus: "ali",
                                    aliPayUrl: result.data.aliPayUrl
                                }, function (d) {

                                });
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
                                                dataType: 'json',
                                                async: false,
                                                data: {
                                                    SiteOrderNo: result.data.pddOrderNo,
                                                    taskid: taskId,
                                                    Address: result.data.name
                                                },
                                                error: function () {
                                                    setTimeout(function () {
                                                        location.reload()
                                                    }, 10000);
                                                },
                                                success: function (data) {
                                                    console.log(taskSn + '|订单已支付|' + JSON.stringify(data));
                                                    setTimeout(function () {
                                                        location.reload();
                                                    }, 3000);
                                                }
                                            });
                                        } else if (orderstatusres.status == 0) {
                                            $.ajax({
                                                url: '/user/MyRecTaskList.aspx?cancel=cancel&id=' + taskId + '&state=6',
                                                type: 'GET',
                                                dataType: 'html',
                                                async: false,
                                                error: function () {
                                                    setTimeout(function () {
                                                        location.reload()
                                                    }, 10000);
                                                },
                                                success: function (data2) {
                                                    console.log(taskSn + '|订单已取消|' + JSON.stringify(data2));
                                                    location.reload();
                                                }
                                            });
                                        }
                                    });
                                }, 12000);
                            } else if (result.status == 1 && result.data.pddOrderStatus == "1") {//已付款
                                $.ajax({
                                    url: 'SubMitOrderForm.aspx?id=' + taskId,
                                    type: 'POST',
                                    contentType: "application/x-www-form-urlencoded",
                                    dataType: 'json',
                                    async: false,
                                    data: {
                                        SiteOrderNo: result.data.pddOrderNo,
                                        taskid: taskId,
                                        Address: result.data.name
                                    },
                                    error: function () {
                                        setTimeout(function () {
                                            location.reload()
                                        }, 10000);
                                    },
                                    success: function (data) {
                                        console.log(taskSn + '|订单已支付|' + JSON.stringify(data));
                                        setTimeout(function () {
                                            location.reload();
                                        }, 3000);
                                    }
                                });
                            }
                        });
                    }, lasttime);
                } else if (response.status == 2) {
                    alert(response.msg);
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

function getHour() {
    var d = new Date();
    var year = d.getHours();
    return year;
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
        //if (shao == '搜') return true;

        var jdtext = $(this).find(".delmd").attr("onclick");
        taskId = jdtext.replace('show(', '').replace(')', '');
        var gold = $(this).find("span.clhndn").text().trim().replace(/￥/g, '').replace(/元/g, '');
        var logkey = getImageKey(productImg);

        if (noUsedtaskId != null && noUsedtaskId.indexOf(logkey) > -1) return true;
        var hmd = getHmd();
        if (hmd.indexOf(logkey) > -1) return true;


        if (parseFloat(price) < 100) {
            var obj = {taskId: taskId, logkey: logkey, price: parseFloat(price), gold: parseFloat(gold)};
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
    if (taskIds.length > 1) taskIds = taskIds.slice(0, 1);

    var end = false;
    $.each(taskIds, function (i, v) {
        var taskId = v.taskId;
        $.ajax({
            url: "/wap/user/newtasklist.aspx",
            type: "POST",
            async: false,
            data: {"taskid": taskId, "action": "jiedan"},
            dataType: "json",
            error: function (e) {
                sendEndReciveTaskMsg();
                sendReStartReciveTaskMsg(60000);
                console.log(JSON.stringify(e));
            },
            success: function (result) {
                console.log(JSON.stringify(result));
                //setLog("taskId=" + taskId + ";price=" + v.price + ";gold=" + v.gold + "|接取任务返回:" + JSON.stringify(result));
                if (result.IsSuccess) {
                    //setNoUsedTaskId(taskId);
                    setNoUsedTaskId(v.logkey);
                    sendEndReciveTaskMsg();
                    setTimeout(function () {
                        window.location.href = '/user/MyRecTaskList.aspx?state=6';
                    }, 5000);
                    end = true;
                } else if (result.Message == '待付款任务已超过1个，无法再次接取任务!') {
                    sendEndReciveTaskMsg();
                    window.location.href = '/user/MyRecTaskList.aspx?state=6';
                    end = true;
                } else if (result.Message.indexOf('任务上限') > -1) {
                    sendEndReciveTaskMsg();
                    sendReStartReciveTaskMsg(3600000);
                } else if (result.Message == '由于商家限制二次接单天数间隔，目前无法接单!') {
                    setNoUsedTaskId(v.logkey);
                } else if (result.Message.indexOf('黑名单') > -1) {
                    setNoUsedTaskId(v.logkey);
                    setHmd(v.logkey);
                } else if (result.Message.indexOf('提醒收货') > -1 || result.Message.indexOf('6天') > -1) {
                    sendEndReciveTaskMsg();
                    chrome.runtime.sendMessage({
                        taskStatus: "刷新任务"
                    }, function (response) {
                    });
                    sendReStartReciveTaskMsg(180000);
                } else if (result.Message.indexOf('被限制接单') > -1) {
                    sendEndReciveTaskMsg();
                    end = true;
                    alert(result.Message);
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

function setHmd(imgstr) {
    var hmd = getHmd();
    localStorage.setItem("hmd", hmd + "," + imgstr);
}

function getHmd() {
    var hmd = localStorage.getItem("hmd");
    if (hmd == null) hmd = "hmd:";
    return hmd;
}

function getImageKey(imgstr) {
    if (imgstr.indexOf('.jp') > -1) imgstr = imgstr.substring(0, imgstr.indexOf('.jp'));
    if (imgstr.indexOf('.pn') > -1) imgstr = imgstr.substring(0, imgstr.indexOf('.pn'));
    if (imgstr.indexOf('.JP') > -1) imgstr = imgstr.substring(0, imgstr.indexOf('.JP'));
    if (imgstr.indexOf('.PN') > -1) imgstr = imgstr.substring(0, imgstr.indexOf('.PN'));
    imgstr = imgstr.replace(/\\/g, "/");
    imgstr = imgstr.substring(imgstr.lastIndexOf("/") + 1, imgstr.length);
    return imgstr;
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