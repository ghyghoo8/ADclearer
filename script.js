// ==UserScript==
// @name           OpenGG.Clean.Player
// @namespace      http://OpenGG.me
// @description    OpenGG.Clean.Player
// @version        1.31
// @updateURL      https://userscripts.org/scripts/source/120679.meta.js
// @downloadURL    https://userscripts.org/scripts/source/120679.user.js
// @match          http://*/*
// @match          https://*/*
// @exclude        http://www.kuaipan.cn/*
// ==/UserScript==
(function () {
    //Goddamn sina weibo.
    //'use strict';
    var Global = this;
    var window = this.window||window;
    var unsafeWindow = unsafeWindow;
    var unsafeGlobal = unsafeWindow; // Let's assume that...
    var CONSTANTS = {
        PLAYER_DOM:    ['object','embed','iframe'],
        PLAYERS: [
            {
                find: /^http:\/\/static\.youku\.com\/.*?q?(player|loader)(_[^.]+)?\.swf/,
                replace: 'http://player.opengg.me/loader.swf'
            },
            {
                find: /^http:\/\/js\.tudouui\.com\/.*?\/TudouYoukuPlayer_Homer[^.]*?\.swf/,
                replace: 'http://player.opengg.me/TudouYoukuPlayer_Homer_9.swf'
            },
            {
                find: /^http:\/\/js\.tudouui\.com\/.*?\/PortalPlayer[^.]*?\.swf/,
                replace: 'http://player.opengg.me/PortalPlayer_7.swf'
            },
            {
                find: /^http:\/\/js\.tudouui\.com\/.*?\/TudouVideoPlayer_Homer_[^.]*?.swf/,
                replace: 'http://player.opengg.me/TudouVideoPlayer_Homer_238.swf'
            },
            {
                find: /^http:\/\/player\.youku\.com\/player\.php\//,
                replace: 'http://player.opengg.me/player.php/'
            },
            {
                find: /^http:\/\/dp\.tudou\.com\/nplayer[^.]*?\.swf|http:\/\/js\.tudouui\.com\/doupao\/nplayer[^.]*?\.swf/,
                replace: 'http://player.opengg.me/nplayer.swf'
            },
            {
                find: /^http:\/\/www.tudou.com\/(([a-z]|programs)\/.*)/,
                replace: 'http://player.opengg.me/td.php/$1'
            }
        ],
        SHARE_DOM: '#panel_share input,input#copyInput.txt',
        SHARES: [
            {
                find: /http:\/\/player\.youku\.com\/player\.php\//,
                replace: 'http://player.opengg.me/player.php/'
            },
            {
                find: /http:\/\/www.tudou.com\/(.*v\.swf)/,
                replace: 'http://player.opengg.me/td.php/$1'
            }
        ],
        TIPS_HOLDER: '#miniheader,#gTop',
        TIPS: '<div class="tips_container">OpenGG.Clean.Player \u5df2\u505c\u6b62&emsp;<a href="http://opengg.me/916/how-dreams-die/" style="color:red" title="\u7406\u60f3\u662f\u5982\u4f55\u5931\u53bb\u7684" target="_blank">\u8be6\u60c5</a><a class="tips_close" href="#" style="color:red">X</a></div>',
        STYLE: '.playBox_thx #player.player,.playBox_thx #player.player object{min-height:' + Math.max(Global.innerHeight * 0.6, 580) + 'px !important}.tips_container{position:absolute;top:3em;padding:1em 2em;right:50px;color:green;opacity:0.4;background:#ddd;z-index:999999}.tips_container:hover{opacity:0.8}.tips_container .tips_toggleWide{color:red;cursor:pointer;display:none}.tips_close{position:absolute;right:3px;top:3px}',
        NODEINSERTED_HACK: '@-moz-keyframes nodeInserted{from{opacity:0.99;}to{opacity:1;}}@-webkit-keyframes nodeInserted{from{opacity:0.99;}to{opacity:1;}}@-o-keyframes nodeInserted{from{opacity:0.99;}to{opacity:1;}}@keyframes nodeInserted{from{opacity:0.99;}to{opacity:1;}}embed,object{animation-duration:.001s;-ms-animation-duration:.001s;-moz-animation-duration:.001s;-webkit-animation-duration:.001s;-o-animation-duration:.001s;animation-name:nodeInserted;-ms-animation-name:nodeInserted;-moz-animation-name:nodeInserted;-webkit-animation-name:nodeInserted;-o-animation-name:nodeInserted;}',
        TOGGLE_BTN: '.tips_container .tips_toggleWide'
    };
    var DONE = [];
    var UTIL = {
        addCss: function (str) {
            var style = document.createElement('style');
            style.textContent = str;
            document.head.appendChild(style);
        },
        proxy: function(callback, imports) {
            if(typeof (unsafeWindow)!=='undefined' && Global.navigator && Global.navigator.userAgent.indexOf('Firefox')!==-1){
                callback.call(unsafeGlobal, unsafeGlobal, imports);
                return;
            }
            var script = document.createElement('script');
            script.textContent = '(' + callback.toString() + ')(this.window||window, '+JSON.stringify(imports)+');';
            document.body.appendChild(script);
        },
        procFlash: function (elem, fn) {
            if (DONE.indexOf(elem) !== -1) {
                return;
            }
            if (fn(elem)) {
                DONE.push(elem);
            }
        },
        forEach: function (arr, callback) {
            if (this.isArrayLike(arr)) {
                if (Array.prototype.forEach) {
                    Array.prototype.forEach.call(arr, callback);
                } else {
                    var i = 0;
                    for (i = 0; i < arr.length; ++i) {
                        callback.call(arr[i], arr[i]);
                    }
                }
            }
        },
        isArrayLike: function (obj) {
            if (typeof obj !== 'object') {
                return false;
            }
            var types = ['Array', 'NodeList', 'HTMLCollection'];
            var i = 0;
            for (i = 0; i < types.length; ++i) {
                if (Object.prototype.toString.call(obj).indexOf(types[i]) !== -1) {
                    return true;
                }
            }
            return false;
        }
    };
    function tips() {
        var holder = document.body.querySelector(CONSTANTS.TIPS_HOLDER);
        if (holder) {
            var div = document.createElement('div');
            // if (document.defaultView.getComputedStyle(holder, null).getPropertyValue('position') !== 'relative') {
            //     div.style.position = 'relative';
            // }
            div.innerHTML = CONSTANTS.TIPS;
            div.querySelector('.tips_close').addEventListener('click',function(e){
                if(e.preventDefault){
                    e.preventDefault();
                }
                div.parentNode.removeChild(div);
                return false;
            },false);
            holder.appendChild(div);
            UTIL.addCss(CONSTANTS.STYLE);
        }
    }
    function setTHX(opt){
        var player = document.querySelector('object#movie_player');
        var parent = document.body.querySelector('.playBox');
        var wide = document.body.querySelector('.playBox_thx');
        if(opt&&player){
            UTIL.proxy(function(Global, imports){
                var player = Global.document.querySelector('object#movie_player');
                player.setTHX(imports.opt);
            },{
                opt: opt
            });
            switch(opt){
                case 'on':
                    if (parent && !wide) {
                        parent.className += ' playBox_thx';
                    }
                    break;
                case 'off':
                    if (parent && wide) {
                        parent.className = 'playBox';
                    }
                    break;
            }
        }
    }
    var CONTROLLER = [
        {
            host: 'youku.com',
            fn: function () {
                tips();
            }
        },
        {
            host: 'tudou.com',
            fn: function () {
                tips();
            }
        }
    ];
    var host = location.host;
    function PROC(item) {
        if (host.indexOf(item.host) !== -1) {
            item.fn();
            return;
        }
    }
    UTIL.forEach(CONTROLLER, PROC);
})();