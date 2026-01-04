// 主程序逻辑 - 修复 v5
(function (window) {
    // === 工具函数 ===
    function debugLog(msg) {
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
        rotation: 0
    };

    // === 核心：时间获取 (及 UTC+8 补丁) ===
    function getCurrentTime() {
        var now = new Date();
        // 强制 +8 小时 (北京时间)
        // 获取 UTC 时间戳
        var utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        // +8 小时
        var targetTime = new Date(utc + (3600000 * 8));
        return targetTime;
    }

    // === 初始化配置 ===
    try {
        var cType = SafeStorage.get('clockType');
        if (cType) config.clockType = cType;

        var cRot = SafeStorage.get('rotation');
        if (cRot) config.rotation = parseInt(cRot, 10);
    } catch (e) { }

    // === DOM ===
    var dom = {};

    function init() {
        try {
            dom.app = document.getElementById('app-container');
            dom.digitalClock = document.getElementById('digital-clock');
            dom.analogClock = document.getElementById('analog-clock');

            dom.settingsOverlay = document.getElementById('settings-overlay');
            dom.settingsTrigger = document.getElementById('settings-trigger');
            dom.btnCloseSettings = document.getElementById('btn-close-settings');

            // UI 初始化
            initRenderer();

            bindEvents();

            // 启动前先应用一次布局，确保 SVG 有大小
            handleResize();
            applySettings();

            // 启动时钟
            tick();
            setInterval(tick, 1000);

            // 监听窗口变化，重新计算 SVG 大小
            window.addEventListener('resize', handleResize);

            debugLog('Init success v5');
        } catch (e) {
            debugLog('INIT FAIL: ' + e.message);
            var el = document.getElementById('error-log');
            if (el) el.style.display = 'block';
        }
    }

    function initRenderer() {
        if (window.ClockRenderer) {
            window.ClockRenderer.initAnalogTicks();
        }
    }

    // 手动计算 SVG 尺寸 (替代 vmin)
    function handleResize() {
        var w = window.innerWidth;
        var h = window.innerHeight;
        var min = Math.min(w, h); // 取短边
        var size = Math.floor(min * 0.85); // 85% 占比

        // 找到 SVG 并设置像素宽高
        var svgs = document.getElementsByTagName('svg');
        for (var i = 0; i < svgs.length; i++) {
            svgs[i].style.width = size + 'px';
            svgs[i].style.height = size + 'px';
        }
    }

    function bindEvents() {
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

        // 强制刷新
        var btnRefresh = document.getElementById('btn-force-refresh');
        if (btnRefresh) {
            btnRefresh.onclick = function () {
                // 强制刷新逻辑: 添加随机时间戳 query
                var url = window.location.href.split('?')[0];
                var t = new Date().getTime();
                window.location.href = url + '?t=' + t;
            };
        }

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
    }

    function bindRadioGroup(id, callback) {
        var container = document.getElementById(id);
        if (!container) return;
        var btns = container.getElementsByTagName('button');
        for (var i = 0; i < btns.length; i++) {
            btns[i].onclick = function () {
                var val = this.getAttribute('data-val');
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
        updateRadioUI('opt-clock-type', config.clockType);
        updateRadioUI('opt-rotation', config.rotation);
        dom.settingsOverlay.className = 'settings-overlay visible';
    }

    function closeSettings() {
        dom.settingsOverlay.className = 'settings-overlay';
    }

    function applySettings() {
        // 旋转逻辑：应用到最外层
        var r = config.rotation;

        // 清除样式
        dom.app.style.transform = '';
        dom.app.style.webkitTransform = ''; // 兼容旧 WebKit
        dom.app.style.width = '100%';
        dom.app.style.height = '100%';
        dom.app.style.position = 'static';
        dom.app.style.marginTop = 0;
        dom.app.style.marginLeft = 0;

        if (r !== 0) {
            var transVal = 'rotate(' + r + 'deg)';
            dom.app.style.transform = transVal;
            dom.app.style.webkitTransform = transVal; // 关键：Kindle 需要前缀

            // 横屏处理
            if (r % 180 !== 0) {
                var width = window.innerWidth;
                var height = window.innerHeight;

                dom.app.style.width = height + 'px';
                dom.app.style.height = width + 'px';

                dom.app.style.position = 'absolute';
                dom.app.style.top = '50%';
                dom.app.style.left = '50%';
                dom.app.style.marginTop = -(width / 2) + 'px'; // 垂直居中修正
                dom.app.style.marginLeft = -(height / 2) + 'px'; // 水平居中修正
            }
        }

        // 显示模式
        if (config.clockType === 'digital') {
            dom.digitalClock.className = 'digital-clock';
            dom.analogClock.className = 'analog-clock hidden';
        } else {
            dom.digitalClock.className = 'digital-clock hidden';
            dom.analogClock.className = 'analog-clock';
            // 切换到 analog 时手动重新算一下大小
            handleResize();
            // 并初始化刻度
            if (window.ClockRenderer) window.ClockRenderer.initAnalogTicks();
        }

        tick();
    }

    function tick() {
        var now = getCurrentTime();

        if (window.ClockRenderer) {
            if (config.clockType === 'digital') window.ClockRenderer.renderDigital(now);
            else window.ClockRenderer.renderAnalog(now); // 指针始终更新
        }

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

    window.onload = init;

})(window);
