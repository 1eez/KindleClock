// 主程序逻辑 - 终极修复版
(function (window) {
    // === 工具函数 ===
    function debugLog(msg) {
        // 只有在错误发生时才显示错误面板，避免遮挡
        var el = document.getElementById('error-content');
        if (el) el.textContent += msg + '\n';
    }

    // 安全存储
    var SafeStorage = {
        get: function (key) {
            try {
                if (window.localStorage) return window.localStorage.getItem(key);
            } catch (e) { }
            return null;
        },
        set: function (key, val) {
            try {
                if (window.localStorage) window.localStorage.setItem(key, val);
            } catch (e) { }
        }
    };

    // === 状态 ===
    var config = {
        clockType: 'digital',
        rotation: 0,
        timeOffset: 8 // 默认为 +8 (北京时间)，专门配合 Kindle 的 UTC bug
    };

    // === 核心：时间获取 (强制修正时区) ===
    function getCurrentTime() {
        var now = new Date();

        // 如果设置了偏移量，我们基于 UTC 时间手动构建时间对象
        // Kindle 也就是 UTC 时间 (+0)，所以如果我们要 UTC+8，就直接 getUTCHours() + 8

        // 获取 UTC 时间戳
        var utc = now.getTime() + (now.getTimezoneOffset() * 60000);

        // 加上我们的偏移量 (小时)
        var targetTime = new Date(utc + (3600000 * config.timeOffset));

        return targetTime;
    }

    // === 初始化配置 ===
    try {
        var cType = SafeStorage.get('clockType');
        if (cType) config.clockType = cType;

        var cRot = SafeStorage.get('rotation');
        if (cRot) config.rotation = parseInt(cRot, 10);

        var cOff = SafeStorage.get('timeOffset');
        if (cOff !== null) config.timeOffset = parseInt(cOff, 10);
    } catch (e) { }

    // === DOM ===
    var dom = {};

    function init() {
        try {
            dom.app = document.getElementById('app-container');
            dom.content = document.getElementById('content');
            dom.digitalClock = document.getElementById('digital-clock');
            dom.analogClock = document.getElementById('analog-clock');

            dom.settingsOverlay = document.getElementById('settings-overlay');
            dom.settingsTrigger = document.getElementById('settings-trigger');
            dom.btnCloseSettings = document.getElementById('btn-close-settings');

            // UI 初始化
            initRenderer();
            applySettings();
            bindEvents();

            // 启动时钟
            tick();

        } catch (e) {
            debugLog('INIT FAIL: ' + e.message);
            document.getElementById('error-log').style.display = 'block';
        }
    }

    function initRenderer() {
        if (window.ClockRenderer) {
            window.ClockRenderer.initAnalogTicks();
        }
    }

    function bindEvents() {
        // 设置触发：同时绑定 touch 和 click，保证万无一失
        function onTrigger(e) {
            e.stopPropagation();
            e.preventDefault();
            openSettings();
            return false;
        }

        if (dom.settingsTrigger) {
            dom.settingsTrigger.ontouchstart = onTrigger;
            dom.settingsTrigger.onclick = onTrigger;
        }

        if (dom.btnCloseSettings) {
            dom.btnCloseSettings.onclick = closeSettings;
        }

        // 选项绑定代理
        bindRadioGroup('opt-clock-type', function (val) {
            config.clockType = val;
            SafeStorage.set('clockType', val);
            applySettings();
        });

        bindRadioGroup('opt-rotation', function (val) {
            config.rotation = parseInt(val, 10);
            SafeStorage.set('rotation', val);
            applySettings();
        });

        bindRadioGroup('opt-offset', function (val) {
            config.timeOffset = parseInt(val, 10);
            SafeStorage.set('timeOffset', val);
            tick(); // 立即刷新时间
        });
    }

    function bindRadioGroup(id, callback) {
        var container = document.getElementById(id);
        if (!container) return;
        var btns = container.getElementsByTagName('button');
        for (var i = 0; i < btns.length; i++) {
            btns[i].onclick = function () {
                var val = this.getAttribute('data-val');
                // Update UI
                for (var j = 0; j < btns.length; j++) btns[j].className = '';
                this.className = 'active';
                callback(val);
            };
        }
    }

    function updateRadioUI(id, val) {
        var container = document.getElementById(id);
        if (!container) return;
        var btns = container.getElementsByTagName('button');
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].getAttribute('data-val') == val) btns[i].className = 'active';
            else btns[i].className = '';
        }
    }

    function openSettings() {
        // 渲染当前状态
        updateRadioUI('opt-clock-type', config.clockType);
        updateRadioUI('opt-rotation', config.rotation);
        updateRadioUI('opt-offset', config.timeOffset);

        dom.settingsOverlay.className = 'settings-overlay visible';
    }

    function closeSettings() {
        dom.settingsOverlay.className = 'settings-overlay';
    }

    function applySettings() {
        // 1. 旋转 (应用在 content 也就是 table-cell 上，或者 container 上)
        // 对于 Table 布局，旋转最外层的 container 最安全
        var r = config.rotation;
        // 重置
        dom.app.style.transform = '';
        dom.app.style.width = '100%';
        dom.app.style.height = '100%';
        dom.app.style.position = 'static';
        dom.app.style.marginTop = 0;
        dom.app.style.marginLeft = 0;

        if (r !== 0) {
            // 复杂的旋转逻辑，Table 布局旋转后需要重新定位
            dom.app.style.transform = 'rotate(' + r + 'deg)';

            // 如果是横屏 (90/270)，交换宽高
            if (r % 180 !== 0) {
                var width = window.innerWidth;
                var height = window.innerHeight;

                dom.app.style.width = height + 'px';
                dom.app.style.height = width + 'px';

                // 强制绝对定位居中
                dom.app.style.position = 'absolute';
                dom.app.style.top = '50%';
                dom.app.style.left = '50%';
                dom.app.style.marginTop = -(width / 2) + 'px';
                dom.app.style.marginLeft = -(height / 2) + 'px';
            }
        }

        // 2. 显示类型
        if (config.clockType === 'digital') {
            dom.digitalClock.className = 'digital-clock'; // remove hidden
            dom.analogClock.className = 'analog-clock hidden';
        } else {
            dom.digitalClock.className = 'digital-clock hidden';
            dom.analogClock.className = 'analog-clock';
        }

        tick(); // 刷新一下
    }

    function tick() {
        var now = getCurrentTime();

        if (window.ClockRenderer) {
            if (config.clockType === 'digital') window.ClockRenderer.renderDigital(now);
            else window.ClockRenderer.renderAnalog(now);
        }

        // Ghosting check
        if (now.getMinutes() === 0 && now.getSeconds() === 0) {
            triggerGhostingFix();
        }
    }

    function triggerGhostingFix() {
        var el = document.getElementById('refresh-overlay');
        if (el) {
            el.className = 'refresh-overlay blink-active';
            setTimeout(function () { el.className = 'refresh-overlay'; }, 1000);
        }
    }

    // 启动主循环：每秒检查，但只在分钟变化时大更新？不，为了平滑，每秒更新秒针(即使没有秒针UI)
    // 我们的UI没有秒针，所以可以每秒跑一次，开销很小
    setInterval(tick, 1000);

    window.onload = init;

})(window);
