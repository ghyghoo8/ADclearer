chrome.extension.onConnect.addListener(function (port) {
    var msgName = port.name;
    console.log("msgName:" + msgName);
    port.onMessage.addListener(function (msg) {
        switch (msgName) {
            case 'notification':
                notification(msg);
                break;
            default:
                break;
        }
    });
});

function notification(msg) {
    if (!msg.body||msg.body=="nothing here")return false;
    var note = webkitNotifications.createNotification(
        msg.icon || 'http://botaoenergy-wordpress.stor.sinaapp.com/uploads/icon48.png', // icon url - can be relative
        msg.title || 'ADclearer running...', // notification title
        msg.body // notification body text
    );
    note.show();
    setTimeout(function(){
        note.cancel();
    },2000);
}