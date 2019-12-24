var taskUrl = 'https://www.pinke66.com/index.php?psd=task&t=pdd&k=1&k1=1&k2=0&k3=0&k4=1&k5=0&k6=&k7=0&page=1';

$(document).ready(function () {
    var username = $.trim($(".bar_body .login").text());
    if (window.location.href == "https://www.pinke66.com/ucenter-weak-mytask20.html") {
        if ($("div.container ul.task_list li.task").size() == 0) {
            sendStartReciveTaskMsg();
        }
        $("div.container ul.task_list li.task").each(function () {
            var tr = $(this).find("tr");
            var taskSn = $.trim($(tr[0]).find("span.ml_30").text()).replace("编号", "");
            var price = $(tr[0]).find("td.tc.b2 span.after b");
            var taskPrice = $(price[0]).text();
            var taskGold = $(price[1]).text();
            var taskSearchType = $.trim($(tr[4]).find("a.check.scan").text());
            var taskBuyerDesc = "";
            $(tr[4]).find("a.check.red").each(function(){
                taskBuyerDesc += $.trim($(this).text());
            });
            $(tr[4]).find("a.check.yellow").each(function(){
                taskBuyerDesc += $.trim($(this).text());
            });
            if (taskSearchType == '') taskSearchType = '搜关键词';
            var ewmUrl = $.trim($(tr[4]).find("a.check.scan").attr("rel"));
            ewmUrl = "https://www.pinke66.com" + ewmUrl;
            var productImg = $.trim($(tr[1]).find("img.task_img").attr("src"));
            var taskRecType = $.trim($(tr[1]).find("td.tc.b1 span.after b").text());
            var taskOrderType = $.trim($(tr[1]).find("td.tc.b1 span.s_1_2 b").text());
            var taskStatus = $.trim($(tr[0]).find("td.tc p.mt_10 b").text());
            var taskId = $("#" + taskSn).attr("tid");
            var tm = $("#" + taskSn).attr("end");
            var pjContent = $.trim($(tr[4]).find(".after.s_1_2s b").text());
            if (pjContent == '无需带字评价'||pjContent =='带字自由评价') pjContent = '';
            if (taskStatus == '待提交') {
                createPddOrder(username, taskId, taskSn, taskStatus, taskPrice, taskGold, taskSearchType, taskRecType, taskOrderType, ewmUrl, productImg, pjContent, taskBuyerDesc);
            }
        });
    }else if (window.location.href.indexOf("https://www.pinke66.com/index.php?psd=ucenter&t=seller&m=mytask&k1=1&k2=23")>-1||window.location.href.indexOf("https://www.pinke66.com/index.php?psd=ucenter&t=weak&m=mytask&k1=1&k2=23")>-1) {
        $("div.container ul.task_list li.task").each(function () {
            var tr = $(this).find("tr");
            var taskSn = $.trim($(tr[0]).find("span.ml_30").text()).replace("编号", "");
            var price = $(tr[0]).find("td.tc.b2 span.after b");
            var taskPrice = $(price[0]).text();
            var taskGold = $(price[1]).text();
            var taskSearchType = $.trim($(tr[4]).find("a.check.scan").text());
            var taskBuyerDesc = "";
            $(tr[4]).find("a.check.red").each(function(){
                taskBuyerDesc += $.trim($(this).text());
            });
            $(tr[4]).find("a.check.yellow").each(function(){
                taskBuyerDesc += $.trim($(this).text());
            });
            if (taskSearchType == '') taskSearchType = '搜关键词';
            var ewmUrl = $.trim($(tr[4]).find("a.check.scan").attr("rel"));
            ewmUrl = "https://www.pinke66.com" + ewmUrl;
            var productImg = $.trim($(tr[1]).find("img.task_img").attr("src"));
            var taskRecType = $.trim($(tr[1]).find("td.tc.b1 span.after b").text());
            var taskOrderType = $.trim($(tr[1]).find("td.tc.b1 span.s_1_2 b").text());
            var taskStatus = $.trim($(tr[0]).find("td.tc p.mt_10 b").text());
            var taskId = $("#" + taskSn).attr("tid");
            var tm = $("#" + taskSn).attr("end");
            var pjContent = $.trim($(tr[4]).find(".after.s_1_2s b").text());
            if (pjContent == '无需带字评价'||pjContent =='带字自由评价') pjContent = '';
            if (taskStatus.indexOf('待收货') != -1) {
                confirmPddOrder(username, taskSn, taskId, tm);
            }
        });
    }

    getTaskstatus();
});

//到后台查询是否要接取任务
function getTaskstatus() {
    chrome.runtime.sendMessage({
        taskStatus: "是否开始接取任务"
    }, function (response) {
        console.log('接取任务状态：' + (response.flag==1?"接单中":"已结束"));
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
    window.location.href = taskUrl;
}

//拼多多付款
function createPddOrder(username, taskId, taskSn, taskStatus, taskPrice, taskGold, taskSearchType, taskRecType, taskOrderType, ewmUrl, productImg, pjContent, taskBuyerDesc) {
    $.ajax({
        url: '/pd/upbox_new.php?m=task_dats&id=' + taskId,
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
                ewmUrl: ewmUrl,
                productImg: productImg,
                pjContent: pjContent,
                taskBuyerDesc:taskBuyerDesc,
                taskDetail: taskDetail
            }, function (response) {
                if (response == null) {
                    alert("系统异常，请联系管理员!");
                }
                if (response.status == 0) {
                    console.log(taskSn+'|商品名称还没出来!等待6分钟后自动刷新页面。');
                    if(response.msg=='商品名称还没出来!'){
                        setTimeout(function(){
                            location.reload();
                        },360000);
                    }else if(response.msg=='没有找到合适的商品!'){
                        console.log(taskSn+'|没有找到合适的商品!');
                        $.ajax({
                            type:"POST",
                            url:"/_ajax.php?a=taskStas",
                            data:{p:taskId,p1:11},
                            dataType:"json",
                            success:function(data){
                                console.log(taskSn+'|放弃任务成功!');
                                if(data.ret==6){//重新开始接任务
                                    sendStartReciveTaskMsg();
                                }
                            }
                        });
                    }else if(response.msg=='生成订单失败,没有找到相符的商品!'){
                        console.log(taskSn+'|生成订单失败,没有找到相符的商品!');
                        $.ajax({
                            type:"POST",
                            url:"/_ajax.php?a=taskStas",
                            data:{p:taskId,p1:11},
                            dataType:"json",
                            success:function(data){
                                console.log(taskSn+'|放弃任务成功!');
                                if(data.ret==6){//重新开始接任务
                                    sendStartReciveTaskMsg();
                                }
                            }
                        });
                    }else{
                        alert(response.msg);
                    }
                } else if (response.status == 1 && response.data.pddOrderStatus == "0") {//待支付
                    console.log(taskSn+'|订单待支付');
                    //var tempwindow = window.open('_blank');
                    //tempwindow.location = response.data.aliPayUrl;
                    chrome.runtime.sendMessage({
                        taskStatus: "ali",
                        aliPayUrl: response.data.aliPayUrl
                    }, function (d) {

                    });
                    setInterval(function () {//定时查询订单状态
                        chrome.runtime.sendMessage({
                            taskStatus: "订单状态",
                            username: username,
                            taskSn: taskSn
                        }, function (orderstatusres) {
                            console.log(taskSn+'|定时查询订单状态:|'+(orderstatusres.data.pddOrderStatus=="1"?"已付款":"未付款"));
                            if (orderstatusres.status == 1 && orderstatusres.data.pddOrderStatus == "1") {//已付款
                                $.ajax({
                                    url: '/pd/upbox.php?m=task_order&id=' + taskId,
                                    type: 'POST',
                                    contentType: "application/x-www-form-urlencoded",
                                    async: false,
                                    data: {
                                        order_number: response.data.pddOrderNo,
                                        save: "",
                                        order_name: response.data.name
                                    },
                                    success: function (data) {
                                        sendStartReciveTaskMsg();
                                    }
                                });
                            }
                        });
                    }, 10000);
                } else if (response.status == 1 && response.data.pddOrderStatus == "1") {//已付款
                    console.log(taskSn+'|订单已支付');
                    $.ajax({
                        url: '/pd/upbox.php?m=task_order&id=' + taskId,
                        type: 'POST',
                        contentType: "application/x-www-form-urlencoded",
                        async: false,
                        data: {
                            order_number: response.data.pddOrderNo,
                            save: "",
                            order_name: response.data.name
                        },
                        success: function (data) {
                            sendStartReciveTaskMsg();
                        }
                    });
                }
            });
        }
    });

}

//拼多多确认收货
function confirmPddOrder(username, taskSn, taskId , tm) {
    console.log(taskSn+'|往后台发送消息(商家已发货)，请求拼多多确认收货.');
    chrome.runtime.sendMessage({
        username: username,
        taskStatus: "商家已发货",
        taskSn: taskSn
    }, function (response) {
        console.log(taskSn+'|收到来自后台的回复|'+response.msg);
        if(response.status==1){
            $.ajax({
                type:"POST",
                url:"/_ajax.php?a=taskStas",
                data:{p:taskId,p1:24,p2:tm},
                dataType:"json",
                success:function(data){
                    console.log(taskSn,data);
                }
            });
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
    var uid = null;
    var taskSuc = false;
    var today = getToday();
    var taskIds = [];
    var taskId01 = [];
    var taskId02 = [];
    var task01 = 0;
    var task02 = 0;
    var noUsedtaskId = getNoUsedTaskId();
    $(".task_list").find(".task_item").each(function () {
        var price = $.trim($(this).find(".dianfu").find(".money").text());
        var gold = $(this).find(".fanli").find(".money").text().trim();
        var shao = $.trim($(this).find(".tag_box").find(".l").text());
        var buyType = $.trim($(this).find(".tag_box").find(".c").text());
        var taskTime = $.trim($(this).find("p.no").text());
        var taskSn = $.trim($(this).find("p.no .number").text());
        taskTime = taskTime.replace(taskSn, "");
        taskTime = $.trim(taskTime.substring(taskTime.indexOf("201")));
        var sc = $.trim($(this).find(".desc_box p.desc .label.green").text());
        var wx = $.trim($(this).find(".desc_box p.desc .label.blue").text());
        var liaotian = $.trim($(this).find(".desc_box p.desc .label.red").text());
        var qianshou = '';
        $(this).find(".desc_box p.desc .label.purple").each(function(i,v){
            qianshou +=$.trim($(this).text())
        });

        if (!taskTime.startsWith(today)) return true;
        if (buyType == '单买') return true;
        //if (shao == '扫描二维码') return true;
        //搜索关键词
        //if (sc == '收藏') return true;
        if (wx == '微信') return true;
        if (liaotian == '假聊') return true;
        if (qianshou.indexOf('真签')>-1) return true;
        if (qianshou.indexOf('信誉')>-1) return true;

        taskId = $(this).find(".qiangdan").attr("rel");
        uid = $(this).find(".qiangdan").attr("uid");
        if (noUsedtaskId != null && noUsedtaskId.indexOf(taskId) > -1) return true;
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
    console.log(taskIds);
    var end = false;
    $.each(taskIds, function (i, v) {
        var taskId = v.taskId;
        $.ajax({
            url: '_ajax.php?a=qiangDan',
            type: 'POST',
            async: false,
            data: {p: uid, p1: taskId},
            dataType: 'json',
            contentType: "application/x-www-form-urlencoded",
            success: function (result) {
                console.log(result);
                if (result.ret == 6) {
                    sendEndReciveTaskMsg();
                    setNoUsedTaskId(taskId);
                    setTimeout(function () {
                        window.location.href = 'ucenter-weak-mytask20.html';
                    }, 90000);
                    end = true;
                } else if (result.msg.indexOf('上限')>-1) {
                    sendEndReciveTaskMsg();
                    end = true;
                } else if (result.msg.indexOf('同商家的任务复购限制')>-1) {
                    setNoUsedTaskId(taskId);
                } else if (result.msg == '对不起，需要加入信誉才能接此任务！') {
                    setNoUsedTaskId(taskId);
                } else {
                    end = false;
                }
                sleep(result.num * 1000);
            }
        });
        return false;
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
    console.log("接收到消息", request);
    var taskSuc = false;
    if (request.startTask) {
        console.log("收到开始任务消息.", request);
        location.href = taskUrl;
        sendResponse({taskSuc: false});
    }
});