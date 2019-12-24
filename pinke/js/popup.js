
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
        console.log("bg jobStatus:",bg.jobStatus);
        bg.jobStatus.flag=0;
    });
})