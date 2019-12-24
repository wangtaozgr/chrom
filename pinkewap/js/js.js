var taskUrl = 'https://wap.pinke66.com/task/index';
var username = "";

var Authorization = localStorage.getItem('Authorization');

$(document).ready(function () {
    if (window.location.href.indexOf("https://wap.pinke66.com/personal/alreadytask")>-1) {
        var tds = $("table.qinend td")
        if ($(tds[0]).attr("class") == "active") {
            setTimeout(function () {
                refreshTjOrder();
            }, 5000);
        }
    }
    //getUsername();
    if(window.location.href.indexOf("https://wap.pinke66.com/task/index")>-1){
        getTaskstatus();
    }
});

function getUsername() {
    if(username==""){
        $.ajax({
            type: 'POST',
            url: '/task/ajax_task',
            type: 'POST',
            headers: {
                'Authorization': Authorization
            },
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
            timeout:10000,
            success: function (response) {
                username = response.data.user.user;
                chrome.runtime.sendMessage({
                    taskStatus: "setUsername",
                    username: username,
                    Authorization:Authorization
                }, function (response) {
                    console.log(response);
                });

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
            setTimeout(function () {
                var isSuccess = startWapTask();
                console.log("isSuccess", isSuccess);
                if (!isSuccess) {
                    setTimeout(function () {
                        window.location.href = taskUrl;
                        //getTaskstatus();
                    }, 10000);
                }
            }, 10000);
        }else{
            setInterval(function(){
                chrome.runtime.sendMessage({
                    taskStatus: "是否开始接取任务"
                }, function (response) {
                    console.log('接取任务状态：' + (response.flag == 1 ? "接单中" : "已结束"));
                    if (response.flag == 1) {
                        window.location.href = taskUrl;
                    }
                })
            },10000);

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
    window.location.href = taskUrl;
}

//发送后台，多少时间后重新开始接任务
function sendReStartReciveTaskMsg(time) {
    chrome.runtime.sendMessage({
        taskStatus: "重新开始接取任务",
        time:time
    }, function (response) {
    });
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
        error:function(XMLHttpRequest, textStatus, errorThrown){
            setTimeout(function () {
                window.location.href = "https://wap.pinke66.com/personal/alreadytask";
            }, 10000);
        },
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
            }else{
                sendStartReciveTaskMsg();
                getTaskstatus();
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
            } else if (response.msg == '没有找到合适的商品!') {//生成订单失败,没有找到相符的商品!
                console.log(taskSn + '|没有找到合适的商品!');
                $.ajax({
                    url: '/popup/cancel',
                    headers: {
                        'Authorization': Authorization
                    },
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Referer', {
                            toString: function () {
                                return 'https://wap.pinke66.com/popup/taskdetails?task_id='+taskId+'&status=20';
                            }
                        });
                    },
                    type: 'POST',
                    async: false,
                    data: {taskid: taskId},
                    dataType: 'json',
                    contentType: "application/x-www-form-urlencoded",
                    timeout:10000,
                    success: function (data) {
                        console.log(data);
                        if (data.code == 200) {//重新开始接任务
                            console.log(taskSn + '|放弃任务成功!');
                            sendStartReciveTaskMsg();
                        }
                    }
                });
            } else if (response.msg == '生成订单失败,没有找到相符的商品!') {//
                console.log(taskSn + '|生成订单失败,没有找到相符的商品!!');
                $.ajax({
                    url: '/popup/cancel',
                    headers: {
                        'Authorization': Authorization
                    },
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Referer', {
                            toString: function () {
                                return 'https://wap.pinke66.com/popup/taskdetails?task_id='+taskId+'&status=20';
                            }
                        });
                    },
                    type: 'POST',
                    async: false,
                    data: {taskid: taskId},
                    dataType: 'json',
                    contentType: "application/x-www-form-urlencoded",
                    timeout:10000,
                    success: function (data) {
                        console.log(data);
                        if (data.code == 200) {//重新开始接任务
                            console.log(taskSn + '|放弃任务成功!');
                            sendStartReciveTaskMsg();
                        }
                    }
                });
            }else {
                alert(response.msg);
            }
        } else if (response.status == 1 && response.data.pddOrderStatus == "0") {//待支付
            console.log(taskSn + '|订单待支付');
           // var tempwindow = window.open('_blank');
            //tempwindow.location = response.data.aliPayUrl;
            chrome.runtime.sendMessage({
                taskStatus: "ali",
                aliPayUrl: response.data.aliPayUrl
            }, function (d) {
            });
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
                            timeout:10000,
                            error:function(XMLHttpRequest, textStatus, errorThrown){
                                setTimeout(function () {
                                    window.location.href = "https://wap.pinke66.com/personal/alreadytask";
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
                timeout:10000,
                error:function(XMLHttpRequest, textStatus, errorThrown){
                    setTimeout(function () {
                        window.location.href = "https://wap.pinke66.com/personal/alreadytask";
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

}

//刷新确认收货任务
function refreshPddOrder() {
    var page =0;
    var totalpage = 0;
    while(page<=totalpage){
        $.ajax({
            type: 'POST',
            url: '/personal/alreadytaskajax',
            type: 'POST',
            headers: {
                'Authorization': Authorization
            },
            async: false,
            timeout:10000,
            data: {
                srd: '',
                page: page,
                size: 5,
                types: 1,
                status: 23
            },
            dataType: 'json',
            contentType: "application/x-www-form-urlencoded",
            timeout:10000,
            error:function(){
                setTimeout(function(){
                    location.href = 'https://wap.pinke66.com/personal/alreadytask';
                },10000);
            },
            success: function (response) {
                totalpage = response.data.total/5;
                page++;
                var pageData = response.data.data;
                $.each(pageData, function (i, v) {
                    confirmPddOrder(v.tcode, v.id, v.stis)
                });
            }
        });
    }

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
                    timeout:10000,
                    data: {
                        task_id: taskId,
                        imgs_xt_1: ''
                    },
                    dataType: 'json',
                    contentType: "application/x-www-form-urlencoded",
                    success: function (response) {
                        console.log(taskSn + '|确认收货结果:',response);

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
        type: 'POST',
        url: '/task/taskajax',
        data: {
            page: 0,
            size: 10,
        },
        async: false,
        dataType: 'json',
        headers: {
            'Authorization': Authorization
        },
        timeout:10000,
        error:function(XMLHttpRequest, textStatus, errorThrown){

        },
        success: function (response) {
            var pageData = response.data.data;
            $.each(pageData, function (i, v) {
                var taskTime = v.uptm;
                if (!taskTime.startsWith(today)) return true;
                if (v.order_type_name == '单买') return true;
                //if(v.task_type_name=='扫') return true;
                //if (v.scis == 1) return true;//藏
                if (v.jlis == 1) return true;//聊
                if (v.shopis == 1) return true;//签
                //if (v.botis==1) return true;//浏
                if (v.wxis == 1) return true;//微
                if (v.stis == 1) return true;//秀
                if (v.isxinyu == 1) return true;//信

                var taskId = v.id;
                var price = v.advance_amount;
                var gold = v.rebate;
                if (noUsedtaskId != null && noUsedtaskId.indexOf(taskId) > -1) return true;
                /*if (parseFloat(price) < 10) {
                    var obj = {taskId: taskId, price: parseFloat(price), gold: parseFloat(gold)};
                    taskIds.push(obj);
                }else if (parseFloat(price) < 20 && parseFloat(gold)>1) {
                    var obj = {taskId: taskId, price: parseFloat(price), gold: parseFloat(gold)};
                    taskIds.push(obj);
                }else if (parseFloat(price) < 30 && parseFloat(gold)>1.5) {
                    var obj = {taskId: taskId, price: parseFloat(price), gold: parseFloat(gold)};
                    taskIds.push(obj);
                }*/
                if (parseFloat(price) < 30) {
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
    console.log("可接取任务id:" + JSON.stringify(taskIds));
    var end = false;
    $.each(taskIds, function (i, v) {
        var taskId = v.taskId;
        $.ajax({
            url: '/task/take',
            headers: {
                'Authorization': Authorization
            },
            type: 'POST',
            async: false,
            data: {taskid: taskId},
            dataType: 'json',
            contentType: "application/x-www-form-urlencoded",
            timeout:10000,
            success: function (result) {
                console.log(result);
                if (result.code == 200) {
                    setNoUsedTaskId(taskId);
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
                        success: function (response) {
                            if (response.data.total == 1) {
                                sendEndReciveTaskMsg();
                                setTimeout(function () {
                                    window.location.href = '/personal/alreadytask';
                                }, 120000);
                                end = true;
                            }else{
                                end = false;
                            }
                        }
                    });

                    //
                } else if (result.message == '对不起，你有未提交订单号任务，请先提交后再另外接单！') {
                    sendEndReciveTaskMsg();
                    window.location.href = '/personal/alreadytask';
                    end = true;
                } else if (result.message.indexOf('超过今日接单数') > -1) {
                    sendEndReciveTaskMsg();
                    end = true;
                    sendReStartReciveTaskMsg(3600000);
                    //alert(result.message);
                }else if (result.message.indexOf('同商家的任务复购限制') > 0) {
                    setNoUsedTaskId(taskId);
                } else if (result.message == '对不起，需要加入信誉才能接此任务！') {
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