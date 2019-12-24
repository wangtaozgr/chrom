var taskUrl = 'http://zk.gxrdwl.com/index.php/Main/Taskdt/main/type/103';
var getTaskUrl = taskUrl.substring(20);
$(document).ready(function () {
    var username = "17755117870";
    if (username != "") {
        chrome.runtime.sendMessage({
            taskStatus: "setUsername",
            username: username
        }, function (response) {
        });
    }

    if (window.location.href == "http://zk.gxrdwl.com/index.php/Main/TaskMem/wlist") {
        if ($("table.list table").size() == 0) {
            sendStartReciveTaskMsg();
        }
        $("table.list table").each(function (i, v) {
            var trs = $(this).find("tr");
            var tds = $(trs[0]).find("td");
            var taskSn = $.trim($(tds[0]).find("p").text());
            var taskPrice = $(tds[1]).text().replace(/￥/g, '').replace(/元/g, '').trim();
            var taskSearchType = $.trim($(tds[2]).find(".bq2").text());
            var taskRecType = $.trim($(tds[2]).find(".bq3").text());
            var taskOrderType = $.trim($(tds[2]).find(".orange").text());
            var taskGold = $(tds[3]).text().replace(/￥/g, '').replace(/元/g, '').trim();
            var taskStatus = $.trim($(tds[4]).find(".cloq5").text());
            var taskA = $(tds[5]).find("input");
            var jdtext = $(taskA[0]).attr("onclick");
            var taskId = jdtext.replace('viewTask(', '').replace(')', '');
            var productImg = $.trim($(tds[0]).find(".pic dl dt img").attr("src"));
            /*console.log("taskSn",taskSn);
             console.log("taskPrice",taskPrice);
             console.log("taskSearchType",taskSearchType);
             console.log("taskRecType",taskRecType);
             console.log("taskOrderType",taskOrderType);
             console.log("taskGold",taskGold);
             console.log("taskStatus",taskStatus);
             console.log("taskId",taskId);*/
            if (taskStatus == '等待付款') {
                createPddOrder(username, taskId, taskSn, taskStatus, taskPrice, taskGold, taskSearchType, taskRecType, taskOrderType, productImg);
            }
        });
    }
    getTaskstatus();
})
;

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
            }, 10000);

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
    });
}

//有提醒任务未完成时，自动刷新任务
function sendRefreshTaskMsg() {
    chrome.runtime.sendMessage({
        taskStatus: "刷新任务"
    }, function (response) {
    });
    //getTaskstatus();
    window.location.href = taskUrl;
}


//拼多多付款
function createPddOrder(username, taskId, taskSn, taskStatus, taskPrice, taskGold, taskSearchType, taskRecType, taskOrderType, productImg) {
    $.ajax({
        url: '/index.php/Main/TaskMem/wview/id/' + taskId,
        type: 'GET',
        async: false,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('X-Requested-With', {
                toString: function () {
                    return '';
                }
            });
        },
        time: 10000,
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
                        window.location.href = '/index.php/Main/TaskMem/wlist';
                    }, 30000);
                    console.log("系统异常，请联系管理员.30秒后刷新!");
                    return;
                }
                console.log(taskSn + '|检测任务结果|', JSON.stringify(response));
                if (response.status == 0) {
                    //setLog(taskId + "|检测任务结果:" + response.msg);
					
                    $.ajax({
                        type: "POST",
                        url: "/index.php/Main/TaskMem/cancelTask",
                        data: {"id": taskId},
                        time: 10000,
                        error: function () {
                            setTimeout(function () {
                                location.reload()
                            }, 10000);
                        },
                        success: function (data2) {
                            if (data2 == 'success') {
                                console.log(taskSn + '|订单已取消|' + data2);
                                sendStartReciveTaskMsg();
                            } else {
                                setTimeout(function () {
                                    location.reload()
                                }, 10000);
                            }
                        }
                    });
                } else if (response.status == 1) {
                    var sec = response.msg == null ? 0 : response.msg;
                    var lasttime = 180000 - sec < 0 ? 0 : 180000 - sec;

                    var productSearchUrl = response.data;
                    setTimeout(function () {
                        chrome.runtime.sendMessage({
                            taskStatus: "生成订单",
                            username: username,
                            taskId: taskId,
                            taskSn: taskSn
                        }, function (result) {
                            if (result == null) {
                                setTimeout(function () {
                                    window.location.href = '/index.php/Main/TaskMem/wlist';
                                }, 30000);
                                console.log("系统异常，请联系管理员.30秒后刷新!");
                                return;
                            }
                            console.log(taskSn + '|生成订单结果|' + result.msg);
                            if (result.status == 0) {
                                //setLog("taskId=" + taskId + "生成订单结果:" + result.msg);
								if (result.msg.indexOf('生成订单失败') > -1) {
									var logkey = getImageKey(productImg);
									setHmd(logkey);
								}
                                $.ajax({
                                    type: "POST",
                                    url: "/index.php/Main/TaskMem/cancelTask",
                                    data: {"id": taskId},
                                    time: 10000,
                                    error: function () {
                                        setTimeout(function () {
                                            location.reload()
                                        }, 10000);
                                    },
                                    success: function (data2) {
                                        if (data2 == 'success') {
                                            console.log(taskSn + '|订单已取消|' + data2);
                                            sendStartReciveTaskMsg();
                                        } else {
                                            setTimeout(function () {
                                                location.reload()
                                            }, 10000);
                                        }
                                    }
                                });
                            } else if (result.status == 2) {
                                if(result.msg=='生成订单失败,请输入验证码!'){
                                    setTimeout(function () {
                                        location.reload()
                                    }, 60000);
                                }else{
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
                                                url: '/index.php/Main/TaskMem/wview/id/' + taskId,
                                                type: 'POST',
                                                contentType: "application/x-www-form-urlencoded",
                                                dataType: 'json',
                                                time: 10000,
                                                async: false,
                                                data: {
                                                    id: taskId,
                                                    tpSS: productSearchUrl,
                                                    pddname: result.data.name,
                                                    pddno: result.data.pddOrderNo,
                                                    pddurl: result.data.pddurl
                                                },
                                                error: function (data) {
                                                    setTimeout(function () {
                                                        location.reload();
                                                    }, 10000);
                                                },
                                                success: function (data) {
                                                    console.log(taskSn + '|订单已支付|' + data);
                                                    setTimeout(function () {
                                                        location.reload();
                                                    }, 3000);
                                                }
                                            });
                                        }else if(orderstatusres.status == 0){
                                            $.ajax({
                                                type: "POST",
                                                url: "/index.php/Main/TaskMem/cancelTask",
                                                data: {"id": taskId},
                                                time: 10000,
                                                error: function () {
                                                    setTimeout(function () {
                                                        location.reload()
                                                    }, 10000);
                                                },
                                                success: function (data2) {
                                                    if (data2 == 'success') {
                                                        console.log(taskSn + '|订单已取消|' + data2);
                                                        sendStartReciveTaskMsg();
                                                    } else {
                                                        setTimeout(function () {
                                                            location.reload();
                                                        }, 10000);
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }, 20000);

                            } else if (result.status == 1 && result.data.pddOrderStatus == "1") {//已付款
                                $.ajax({
                                    url: '/index.php/Main/TaskMem/wview/id/' + taskId,
                                    type: 'POST',
                                    contentType: "application/x-www-form-urlencoded",
                                    dataType: 'json',
                                    async: false,
                                    time: 10000,
                                    data: {
                                        id: taskId,
                                        tpSS: productSearchUrl,
                                        pddname: result.data.name,
                                        pddno: result.data.pddOrderNo,
                                        pddurl: result.data.pddurl
                                    },
                                    error: function () {
                                        setTimeout(function () {
                                            location.reload()
                                        }, 10000);
                                    },
                                    success: function (data) {
                                        console.log(taskSn + '|订单已支付|' + data);
                                        setTimeout(function () {
                                            location.reload();
                                        }, 3000);
                                    }
                                });
                            }
                        });
                    }, lasttime)
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

    $("table.task-list").find("tr").each(function () {
        var tds = $(this).find("td");
        var price = $(tds[1]).text().trim().replace(/￥/g, '').replace(/元/g, '');
        if (price == '') return true;
        var shao = '';
        $(tds[2]).find(".bq2").each(function (i, v) {
            shao += $.trim($(this).text())
        });
        //console.log('shao',shao);
        var liao = '';
        $(tds[2]).find(".bq4").each(function (i, v) {
            liao += $.trim($(this).text())
        });
        var sc = '';
        $(tds[2]).find(".bq5").each(function (i, v) {
            sc += $.trim($(this).text())
        });
        var shui = $.trim($(tds[2]).find(".bq3").text());
        var buyType = $.trim($(tds[2]).find(".light-blue").text());
        var taskTime = $.trim($(tds[0]).find(".pic dl dd").text());
        taskTime = $.trim(taskTime.substring(taskTime.indexOf("201")));
        var productImg = $.trim($(tds[0]).find(".pic dl dt img").attr("src"));

        if (!taskTime.startsWith(today)) return true;
        if (buyType == '单买') return true;
        if (shui != '随') return true;
        if (liao.indexOf('聊') > -1 || liao.indexOf('比') > -1) return true;
        if (sc.indexOf('藏') > -1 || sc.indexOf('签') > -1) return true;
        if (shao.indexOf('类') > -1 || shao.indexOf('场') > -1 || shao.indexOf('览') > -1) return true;

        var jdtext = $(tds[4]).find("input").attr("onclick");
        taskId = jdtext.replace('getTask(', '').replace(')', '');

        var logkey = getImageKey(productImg);
        if (noUsedtaskId != null && noUsedtaskId.indexOf(logkey) > -1) return true;
		var hmd = getHmd();
        if (hmd.indexOf(logkey) > -1) return true;


        var gold = $(tds[3]).text().trim().replace(/￥/g, '').replace(/元/g, '');
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
    if (taskIds.length > 2) taskIds = taskIds.slice(0, 2);
    var end = false;
    $.each(taskIds, function (i, v) {
        var taskId = v.taskId;
        $.ajax({
            type: "GET",
            url: getTaskUrl,
            data: {"id": taskId},
            async: false,
            error: function () {
                end = false;
            },
            success: function (data) {
                console.log(data);
                //setLog("taskId=" + taskId + ";price=" + v.price + ";gold=" + v.gold + "|接取任务返回:" + data);
                if (data == 'success') {
                    setNoUsedTaskId(v.logkey);
                    sendEndReciveTaskMsg();
                    window.location.href = '/index.php/Main/TaskMem/wlist';
                    end = true;
                } else if (data == '当前有任务未提交，请先完成任务再接单') {
                    sendEndReciveTaskMsg();
                    window.location.href = '/index.php/Main/TaskMem/wlist';
                    end = true;
                } else if (data.indexOf('提醒') > -1) {
                    sendEndReciveTaskMsg();
                    sendRefreshTaskMsg();
                    sendReStartReciveTaskMsg(180000);
                } else if (data.indexOf('已超过当日最大接单量') > -1) {
                    sendEndReciveTaskMsg();
                    sendReStartReciveTaskMsg(3600000);
                } else if (data == '由于商家限制二次接单天数间隔，目前无法接该单' || data.indexOf('黑名单') > -1) {
                    setNoUsedTaskId(v.logkey);
                } else if (data.indexOf('已被其它试客抢走了') > -1) {
                    end = false;
                } else {
                    end = true;
                    alert(data);
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

function setHmd(imgstr) {
    var key = getImageKey(imgstr);
    var hmd = getHmd();
    localStorage.setItem("hmd", hmd + "," + key);
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
//接收后台消息用的
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var taskSuc = false;
    if (request.refreshPddOrder) {
        refreshPddOrder();
        sendResponse({taskSuc: false});
    }
});