var jobStatus = {flag: 0, username:""};
var serviceUrl = "http://yhj6688.top:8799/dftt-service";
//serviceUrl = "http://localhost:8799/dftt-service";

function sendMessageToContentScript(message, callback) {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
            if (callback) callback(response);
        });
    });
}

function startTask() {
    console.log('startTask', jobStatus.flag);
}

function closeWin(url){
    console.log(url);
    chrome.tabs.query({currentWindow: true, url:url}, function (tabs) {
        setTimeout(function(){
            chrome.tabs.remove(tabs[0].id)
        },10000);
        //chrome.tabs.update(tabs[0].id, {url: "http://www.053666.cn/wap/user/newtasklist.aspx?page=5"});
    });
}

// 监听来自content-script的消息
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
   if (request.taskStatus == 'closeWin') {
       closeWin(request.url);
    }else if(request.taskStatus == '是否开始接取任务'){
       sendResponse(jobStatus);
   }
});
