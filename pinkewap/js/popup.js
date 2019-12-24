
$(document).ready(function () {
    $("#startTaskBtn").click(function () {
        var bg = chrome.extension.getBackgroundPage();
        if(bg.jobStatus.flag==0){
            bg.jobStatus.flag=1;
            bg.startTask();
            console.log("startTask:",bg.jobStatus.flag);
        }
    });

    $("#endTaskBtn").click(function () {
        var bg = chrome.extension.getBackgroundPage();
        bg.jobStatus.flag=0;
    });

    $("#refreshPddOrderBtn").click(function () {
        var bg = chrome.extension.getBackgroundPage();
        //bg.updatePayedOrderStatus();
        sendMessageToContentScript({refreshPddOrder:true});
    });

    function sendMessageToContentScript(message, callback) {
        chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
            //bg.jobStatus.flag=1;
            //chrome.tabs.update(tabs[0].id, {url: "https://wap.pinke66.com/personal/alreadytask?status=23&types=1"});
            chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
                if (callback) callback(response);
            });
        });
    }
})