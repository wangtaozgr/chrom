var taskUrl = 'http://app.ddhaoping.com/#/task';
var username = "";

var Authorization = localStorage.getItem('Authorization');

$(document).ready(function () {
    var tds = $("table.qinend td")
    if ($(tds[0]).attr("class") == "active") {
        refreshTjOrder();
    }
    getTaskstatus();
});

function getUsername() {
    if(username==""){
        $.ajax({
            type: 'GET',
            url: '/api/v1/userInfo',
            async: false,
            dataType: 'json',
            timeout:1000,
            success: function (response) {
                username = response.data.userName;
            }
        });
    }
    return username;
}
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
                }, 10000);
            }
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
    getTaskstatus();
}
//刷新待提交的订单
function refreshTjOrder() {
    $.ajax({
        type: 'POST',
        url: '/personal/alreadytaskajax',
        type: 'POST',
        async: false,
        data: {
            srd: '',
            page: 0,
            size: 5,
            types: 1,
            status: 20
        },
        dataType: 'json',
        contentType: "application/x-www-form-urlencoded",
        timeout:1000,
        success: function (response) {
            if (response.data.total == 1) {
                var pageData = response.data.data;
                $.each(pageData, function (i, v) {
                    var pjContent = v.pingyu;
                    var pjImg = "";
                    if (v.imgs_1 != "") {
                        pjImg += ";" + v.imgs_1;
                    }
                    if (v.imgs_2 != "") {
                        pjImg += ";" + v.imgs_2;
                    }
                    if (v.imgs_3 != "") {
                        pjImg += ";" + v.imgs_3;
                    }
                    if (pjImg != "") pjImg = pjImg.substring(1);
                    var taskBuyerDesc = "";
                    if (v.scis == 1) taskBuyerDesc="收藏";//藏
                    createPddOrder(v.id, v.tcode, "待提交", v.advance_amount, v.rebate, v.task_type_name, v.good_id, v.order_type_name, v.good_tmbimgs, taskBuyerDesc,pjContent, pjImg);
                });
            }
        }
    });
}
//拼多多付款
function createPddOrder(taskId, taskSn, taskStatus, taskPrice, taskGold, taskSearchType, goodsId, taskOrderType, productImg, taskBuyerDesc,pjContent, pjImg) {
    chrome.runtime.sendMessage({
        username: getUsername(),
        taskId: taskId,
        taskSn: taskSn,
        taskStatus: taskStatus,
        taskPrice: taskPrice,
        taskGold: taskGold,
        taskSearchType: taskSearchType,
        taskOrderType: taskOrderType,
        goodsId: goodsId,
        productImg: productImg,
        taskBuyerDesc:taskBuyerDesc,
        pjContent: pjContent,
        pjImg: pjImg
    }, function (response) {
        if (response == null) {
            alert("系统异常，请联系管理员!");
        }
        if (response.status == 0) {
            console.log(taskSn + '|商品名称还没出来!等待6分钟后自动刷新页面。');
            if (response.msg == '商品名称还没出来!') {
                setTimeout(function () {
                    location.reload();
                }, 360000);
            } else if (response.msg == '没有找到合适的商品!') {
                console.log(taskSn + '|没有找到合适的商品!');
                $.ajax({
                    url: '/popup/cancel',
                    headers: {
                        'Authorization': Authorization
                    },
                    type: 'POST',
                    async: false,
                    data: {taskid: taskId},
                    dataType: 'json',
                    contentType: "application/x-www-form-urlencoded",
                    timeout:1000,
                    success: function (data) {
                        console.log(data);
                        if (data.code == 200) {//重新开始接任务
                            console.log(taskSn + '|放弃任务成功!');
                            sendStartReciveTaskMsg();
                        }
                    }
                });
            } else {
                alert(response.msg);
            }
        } else if (response.status == 1 && response.data.pddOrderStatus == "0") {//待支付
            console.log(taskSn + '|订单待支付');
            var tempwindow = window.open('_blank');
            tempwindow.location = response.data.aliPayUrl;
            setInterval(function () {//定时查询订单状态
                chrome.runtime.sendMessage({
                    taskStatus: "订单状态",
                    username: getUsername(),
                    taskSn: taskSn
                }, function (orderstatusres) {
                    console.log(taskSn + '|定时查询订单状态:|' + (orderstatusres.data.pddOrderStatus == "1" ? "已付款" : "未付款"));
                    if (orderstatusres.status == 1 && orderstatusres.data.pddOrderStatus == "1") {//已付款
                        $.ajax({
                            type: 'POST',
                            url: '/popup/ordersubmit',
                            data: {
                                task_id: taskId,
                                order_number: response.data.pddOrderNo,
                                order_name:response.data.name
                            },
                            async: false,
                            dataType: 'json',
                            headers: {
                                'Authorization': Authorization
                            },
                            timeout:1000,
                            success: function (response) {
                                sendStartReciveTaskMsg();
                            }
                        });
                    }
                });
            }, 10000);
        } else if (response.status == 1 && response.data.pddOrderStatus == "1") {//已付款
            console.log(taskSn + '|订单已支付');
            $.ajax({
                type: 'POST',
                url: '/popup/ordersubmit',
                data: {
                    task_id: taskId,
                    order_number: response.data.pddOrderNo,
                    order_name:response.data.name
                },
                async: false,
                dataType: 'json',
                headers: {
                    'Authorization': Authorization
                },
                timeout:1000,
                success: function (response) {
                    sendStartReciveTaskMsg();
                }
            });
        }
    });

}

//刷新确认收货任务
function refreshPddOrder() {
    $.ajax({
        type: 'POST',
        url: '/personal/alreadytaskajax',
        type: 'POST',
        headers: {
            'Authorization': Authorization
        },
        async: false,
        timeout:1000,
        data: {
            srd: '',
            page: 0,
            size: 5,
            types: 1,
            status: 23
        },
        dataType: 'json',
        contentType: "application/x-www-form-urlencoded",
        timeout:1000,
        success: function (response) {
            var pageData = response.data.data;
            $.each(pageData, function (i, v) {
                confirmPddOrder(v.tcode, v.id, v.stis)
            });
        }
    });
}
//拼多多确认收货
function confirmPddOrder(taskSn, taskId, stis) {
    console.log(taskSn + '|往后台发送消息(商家已发货)，请求拼多多确认收货.');
    chrome.runtime.sendMessage({
        username: getUsername(),
        taskStatus: "商家已发货",
        taskSn: taskSn
    }, function (response) {
        console.log(taskSn + '|收到来自后台的回复|' + response.msg);
        if (response.status == 1) {
            if (stis == 0) {//不用上传图片
                $.ajax({
                    type: 'POST',
                    url: '/popup/confirmreceipt',
                    type: 'POST',
                    headers: {
                        'Authorization': Authorization
                    },
                    async: false,
                    timeout:1000,
                    data: {
                        task_id: taskId,
                        task_id: ''
                    },
                    dataType: 'json',
                    contentType: "application/x-www-form-urlencoded",
                    timeout:1000,
                    success: function (response) {
                        console.log(taskSn + '|确认收货结果|' + response);

                    }
                });
            }
        }
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
    var noUsedtaskId = getNoUsedTaskId();

    $.ajax({
        type: 'GET',
        url: '/api/v1/taskList?limit=8&page=1',
        async: false,
        dataType: 'json',
        timeout:1000,
        success: function (response) {
            var pageData = response.data;
            $.each(pageData, function (i, v) {
                if (v.pddTaskOrderType == 4) return true;//单买

                //if(v.pddTaskType==1) return true;//扫
                //if (v.scis == 1) return true;//藏
                if (v.pddTaskIsVipBuyer == 1) return true;//信

                var taskId = v.pddTaskId;
                var price = v.pddGoodsPrice;
                var gold = v.pddTaskReward;
                if (noUsedtaskId != null && noUsedtaskId.indexOf(taskId) > -1) return true;
                if (parseFloat(price) < 10) {
                    var obj = {taskId: taskId, price: parseFloat(price), gold: parseFloat(gold)};
                    taskIds.push(obj);
                }else if (parseFloat(price) < 20 && parseFloat(gold)>1) {
                    var obj = {taskId: taskId, price: parseFloat(price), gold: parseFloat(gold)};
                    taskIds.push(obj);
                }else if (parseFloat(price) < 30 && parseFloat(gold)>1.5) {
                    var obj = {taskId: taskId, price: parseFloat(price), gold: parseFloat(gold)};
                    taskIds.push(obj);
                }
            });
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
    console.log(taskIds);
    var end = false;
    $.each(taskIds, function (i, v) {
        var taskId = v.taskId;
        $.ajax({
            url: '/api/v1/takeTask',
            type: 'POST',
            async: false,
            data: {pddTaskId: taskId},
            dataType: 'json',
            contentType: "application/json",
            timeout:1000,
            success: function (result) {
                console.log(result);
                if (result.code == 200) {
                    sendEndReciveTaskMsg();
                    setNoUsedTaskId(taskId);
                    setTimeout(function () {
                        window.location.href = '/#/order';
                    }, 60000);
                    end = true;
                } else if (result.msg == '对不起，你有未提交订单号任务，请先提交后再另外接单！') {
                    sendEndReciveTaskMsg();
                    window.location.href = '/#/order';
                    end = true;
                } else if (result.msg.indexOf('同商家的任务复购限制') > 0) {
                    setNoUsedTaskId(taskId);
                } else if (result.msg == '您还未开启实名认证！不能接单！') {
                    setNoUsedTaskId(taskId);
                } else {
                    end = false;
                }
                //sleep(result.num * 1000);
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

function sleep(delay) {
    var start = (new Date()).getTime();
    while ((new Date()).getTime() - start < delay) {
        continue;
    }
}

//接收后台消息用的
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var taskSuc = false;
    if (request.refreshPddOrder) {
        refreshPddOrder();
        sendResponse({taskSuc: false});
    }
});