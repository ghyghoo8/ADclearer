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

//===================================================================================

(function () {
    //Goddamn sina weibo.
    //'use strict';
    var Global = this,
        window = this.window || window;
    var STORE, UTIL, CONTROLLER,
        DONE = [],
        host = location.host;


    if (typeof unsafeWindow == 'undefined') {
        unsafeWindow = window;
    }

    var unsafeWindow = unsafeWindow;
    var unsafeGlobal = unsafeWindow; // Let's assume that...

    //rules list====
    var CONSTANTS = {
        PLAYER_DOM:['object', 'embed', 'iframe'],
        PLAYERS:[
            {
                find:/^http:\/\/static\.youku\.com\/.*?q?(player|loader)(_[^.]+)?\.swf/,
                replace:'http://player.opengg.me/loader.swf'
            },
            {
                find:/^http:\/\/js\.tudouui\.com\/.*?\/TudouYoukuPlayer_Homer[^.]*?\.swf/,
                replace:'http://player.opengg.me/TudouYoukuPlayer_Homer_9.swf'
            },
            {
                find:/^http:\/\/js\.tudouui\.com\/.*?\/PortalPlayer[^.]*?\.swf/,
                replace:'http://player.opengg.me/PortalPlayer_7.swf'
            },
            {
                find:/^http:\/\/js\.tudouui\.com\/.*?\/TudouVideoPlayer_Homer_[^.]*?.swf/,
                replace:'http://player.opengg.me/TudouVideoPlayer_Homer_238.swf'
            },
            {
                find:/^http:\/\/player\.youku\.com\/player\.php\//,
                replace:'http://player.opengg.me/player.php/'
            },
            {
                find:/^http:\/\/dp\.tudou\.com\/nplayer[^.]*?\.swf|http:\/\/js\.tudouui\.com\/doupao\/nplayer[^.]*?\.swf/,
                replace:'http://player.opengg.me/nplayer.swf'
            },
            {
                find:/^http:\/\/www.tudou.com\/(([a-z]|programs)\/.*)/,
                replace:'http://player.opengg.me/td.php/$1'
            },
            {
                find:/http:\/\/player\.ku6cdn\.com\/default\/common\/player\/\d*\/player\.swf/,
                replace:'http://opengg.5ihaitao.com/ku6.swf'
            },
            {
//                find: /http:\/\/www\.iqiyi\.com\/player\/\d+\/Player\.swf/,
//                replace: 'https://haoutil.googlecode.com/svn/trunk/player/iqiyi.swf'
            }
        ],
        SHARE_DOM:'#panel_share input,input#copyInput.txt',
        SHARES:[
            {
                find:/http:\/\/player\.youku\.com\/player\.php\//,
                replace:'http://player.opengg.me/player.php/'
            },
            {
                find:/http:\/\/www.tudou.com\/(.*v\.swf)/,
                replace:'http://player.opengg.me/td.php/$1'
            }
        ],
        STYLE:'.playBox_thx #player.player,.playBox_thx #player.player object{min-height:' + Math.max(Global.innerHeight * 0.6, 580) + 'px !important}.tips_container{position:absolute;top:3em;padding:1em 2em;right:50px;color:green;opacity:0.4;background:#ddd;z-index:999999}.tips_container:hover{opacity:0.8}.tips_container .tips_toggleWide{color:red;cursor:pointer;display:none}.tips_close{position:absolute;right:3px;top:3px}',
        NODEINSERTED_HACK:'@-moz-keyframes nodeInserted{from{opacity:0.99;}to{opacity:1;}}@-webkit-keyframes nodeInserted{from{opacity:0.99;}to{opacity:1;}}@-o-keyframes nodeInserted{from{opacity:0.99;}to{opacity:1;}}@keyframes nodeInserted{from{opacity:0.99;}to{opacity:1;}}embed,object{animation-duration:.001s;-ms-animation-duration:.001s;-moz-animation-duration:.001s;-webkit-animation-duration:.001s;-o-animation-duration:.001s;animation-name:nodeInserted;-ms-animation-name:nodeInserted;-moz-animation-name:nodeInserted;-webkit-animation-name:nodeInserted;-o-animation-name:nodeInserted;}',
        TOGGLE_BTN:'.tips_container .tips_toggleWide'
    };

    UTIL = {
        sendMsg:function (msg, name, callback) {
            var msgName = name || "notification";
            //Message Passing
            var msgPost = chrome.extension.connect({name:msgName});
            msgPost.postMessage(msg);
            callback && msgPost.onMessage.addListener(callback);
        },
        addCss:function (str) {
            var style = document.createElement('style');
            style.textContent = str;
            document.head.appendChild(style);
        },
        proxy:function (callback, imports) {
            if (typeof (unsafeWindow) !== 'undefined' && Global.navigator && Global.navigator.userAgent.indexOf('Firefox') !== -1) {
                callback.call(unsafeGlobal, unsafeGlobal, imports);
                return;
            }
            var script = document.createElement('script');
            script.textContent = '(' + callback.toString() + ')(this.window||window, ' + JSON.stringify(imports) + ');';
            document.body.appendChild(script);
        },
        procFlash:function (elem, fn) {
            if (DONE.indexOf(elem) !== -1) {
                return;
            }
            if (fn(elem)) {
                DONE.push(elem);
            }
        },
        forEach:function (arr, callback) {
            Array.prototype.forEach.call(arr, callback);
        },
        isArrayLike:function (obj) {
            if (typeof obj !== 'object') {
                return false;
            }
            var types = ['Array', 'NodeList', 'HTMLCollection'];
            for (var i = 0; i < types.length; ++i) {
                if (Object.prototype.toString.call(obj).indexOf(types[i]) !== -1) {
                    return true;
                }
            }
            return false;
        },
        get:function (selector, parent) {
            var p = parent || document;
            return p.querySelector(selector);
        },
        query:function (selector, parent) {
            var p = parent || document;
            return p.querySelectorAll(selector);
        },
        on:function () {

        }
    };

    STORE = {
        getItem:function (key) {
            return localStorage.getItem(key);
        },
        setItem:function (key, value) {
            localStorage.setItem(key, value);
            return value;
        }
    };


    CONTROLLER = [
        {
            host:'.com', //only indexof host : .com
            fn:function () {
                var known = [];
                onLoad(CONSTANTS.PLAYER_DOM, function (elem) {
                    var attrs = ['data', 'src'];
                    var players = CONSTANTS.PLAYERS;
                    var reloaded = false;
                    if (known.indexOf(elem) !== -1) {
                        return;
                    }
                    UTIL.forEach(attrs, function (attr) {
                        UTIL.forEach(players, function (player) {
                            var find = player.find;
                            var replace = player.replace;
                            var value = elem[attr];
                            var movie = UTIL.get('param[name="movie"]', elem);

                            if (movie && movie.value) {
                                movie.value = movie.value.replace(find, replace);
                                reloaded = true;
                            }
                            if (value && find && find.test(value)) {
                                var nextSibling = elem.nextSibling;
                                var parentNode = elem.parentNode;
                                var clone = elem.cloneNode(true);
                                clone[attr] = value.replace(find, replace);
                                parentNode.removeChild(elem);
                                parentNode.insertBefore(clone, nextSibling);
                                //Baidu tieba shit.
                                if (clone && getComputedStyle(clone).display === 'none' && clone.style) {
                                    clone.style.display = 'block';
                                }
                                reloaded = true;
                            }
                        });
                    });
                    if (reloaded) {
                        known.push(elem);
                    }
                });
            }
        },
        {
            host:'ku6.com',
            fn:tips
        },
        {
            host:'youku.com',
            fn:function () {
                var matches = UTIL.query(CONSTANTS.SHARE_DOM);
                UTIL.forEach(matches, share);
                tips();
                //默认开启宽屏
                //setTHX(STORE.setItem('THX', 'on'));
            }
        },
        {
            host:'tudou.com',
            fn:function () {
                UTIL.proxy(function (Global, imports) {
                    function hack() {
                        var TUI_copyToClip = Global.TUI && Global.TUI.copyToClip;
                        if (TUI_copyToClip && TUI_copyToClip.toString().indexOf('arguments') === -1) {
                            Global.TUI.copyToClip = function () {
                                var matches = UTIL.query(imports.selector);
                                UTIL.forEach(matches, share);
                                TUI_copyToClip.apply(Global.TUI, arguments);
                            };
                            clearInterval(inter);
                        }
                    }

                    var inter = setInterval(hack, 100);
                    try {
                        Global.playerEx.event.fire('scale', [true]);
                    } catch (e) {
                    }
                }, {
                    selector:CONSTANTS.SHARE_DOM
                });

                var tudouPlayer = UTIL.get('#playerObject');
                var normalDom = UTIL.get('.normal');
                if (tudouPlayer && normalDom) {
                    normalDom.className = normalDom.className.replace('normal', 'widescreen');
                }
                tips();
            }
        }
    ];


    if (Global.parent == Global) {
        //init run===
        UTIL.forEach(CONTROLLER, PROC);
        console.log("add ADclearer plugns...");
    } else {
        console.log("this is an iframe page...");
    }


    //reg host and run fn
    function PROC(item) {
        if (host.indexOf(item.host) !== -1) {
            item.fn();
        }
    }

    //load player
    function onLoad(tagNameList, fn) {
        var lowerTagNameList = [];
        UTIL.forEach(tagNameList, function (a) {
            lowerTagNameList.push(a.toLowerCase());
        });

        /* animationstart not invoked in background tabs of chrome 21 */
        var all = UTIL.query(lowerTagNameList.join(','));
        for (var i = 0; i < all.length; ++i) {
            fn(all[i]);
        }
        UTIL.addCss(CONSTANTS.NODEINSERTED_HACK);

        /*Chrome*/
        document.body.addEventListener('webkitAnimationEnd', onAnimationStartHandler, false);
        /*/Chrome*/

        //Handle function
        function onAnimationStartHandler(e) {
            if (e.animationName === 'nodeInserted') {
                var target = e.target;
                if (target.nodeType === 1 && lowerTagNameList.indexOf(target.nodeName.toLowerCase()) !== -1) {
                    fn(target);
                }
            }
        }
    }

    //load tipers
    function tips() {
        var tipers = '<div class="tips_container">screening AD...<a class="tips_close">X</a></div>';
        var holder = UTIL.get('#miniheader,#gTop');
        if (holder) {
            var div = document.createElement('div');
            div.innerHTML = tipers;

            UTIL.get('.tips_close', div).addEventListener('click', function (e) {
                div.parentNode.removeChild(div);
                return false;
            }, false);
            holder.appendChild(div);
            UTIL.addCss(CONSTANTS.STYLE);
        }
        console.log("ADclearer.....................");
        var title = document.title, MAXLength = 18;
        UTIL.sendMsg({
            body:(title.length > MAXLength) ? (title.substring(0, MAXLength) + "...") : title
        });
    }

    //replace share key
    function share(elem) {
        var pairs = CONSTANTS.SHARES;
        UTIL.forEach(pairs, function (item) {
            elem.value = elem.value.replace(item.find, item.replace);
        });
    }
})();