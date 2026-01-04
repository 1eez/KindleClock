// 主程序逻辑 - 调试版 v3
(function (window) {
    // --- 简易调试器 ---
    function debugLog(msg) {
        // 将日志写入屏幕，方便排查
        var el = document.getElementById('error-content');
        if (el) el.textContent += msg + '\n';
    }

    debugLog('Main script loading...');

    var safeStorage = {
        getItem: function (key) {
            try {
                if (typeof window.localStorage !== 'undefined' && window.localStorage) {
                    return window.localStorage.getItem(key);
                }
            } catch (e) {
                debugLog('Storage read error: ' + e.message);
            }
            return null;
        },
        setItem: function (key, val) {
            try {
                if (typeof window.localStorage !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem(key, val);
                }
            } catch (e) { }
        }
    };

    // 默认配置
    var config = {
        clockType: 'digital',
        rotation: 0
    };

    // 尝试读取配置
    try {
        var sType = safeStorage.getItem('clockType');
        if (sType) config.clockType = sType;

        var sRot = safeStorage.getItem('rotation');
        if (sRot) config.rotation = parseInt(sRot, 10);
    } catch (e) {
        debugLog('Config init error: ' + e.message);
    }

    var state = { settingsOpen: false, timer: null };
    var dom = {};

    function init() {
        debugLog('Init started.');
        try {
            // 1. DOM
            debugLog('1. Getting DOM elements...');
            dom.app = document.getElementById('app-container');
            dom.digitalClock = document.getElementById('digital-clock');
            dom.analogClock = document.getElementById('analog-clock');
            dom.refreshOverlay = document.getElementById('refresh-overlay');
            dom.settingsOverlay = document.getElementById('settings-overlay');
            dom.settingsTrigger = document.getElementById('settings-trigger');
            dom.btnCloseSettings = document.getElementById('btn-close-settings');
            dom.optClockType = document.getElementById('opt-clock-type');
            dom.optRotation = document.getElementById('opt-rotation');

            // 检查关键 DOM
            if (!dom.app) throw new Error('DOM app-container missing');
            if (!dom.digitalClock) throw new Error('DOM digital-clock missing');

            // 2. Renderer
            debugLog('2. Init Renderer...');
            if (window.ClockRenderer) {
                window.ClockRenderer.initAnalogTicks();
            } else {
                debugLog('Warning: window.ClockRenderer missing');
            }

            // 3. Events
            debugLog('3. Bunding Events...');
            setupEvents();

            // 4. Apply Settings
            debugLog('4. Applying settings...');
            applyRotation();
            applyClockType();

            // 5. Start
            debugLog('5. Starting Engine...');
            startClockEngine();

            debugLog('Init success!');
        } catch (e) {
            debugLog('!!! INIT FAIL: ' + e.message);
            // 显式显示错误面板
            var errLog = document.getElementById('error-log');
            if (errLog) errLog.style.display = 'block';
        }
    }

    function setupEvents() {
        if (dom.settingsTrigger) dom.settingsTrigger.onclick = openSettings;
        if (dom.btnCloseSettings) dom.btnCloseSettings.onclick = closeSettings;

        if (dom.settingsOverlay) {
            dom.settingsOverlay.onclick = function (e) {
                if (e.target === dom.settingsOverlay) closeSettings();
            };
        }

        if (dom.optClockType) {
            var btns = dom.optClockType.getElementsByTagName('button');
            for (var i = 0; i < btns.length; i++) {
                btns[i].onclick = function () {
                    var val = this.getAttribute('data-val');
                    updateRadioUI(dom.optClockType, val); // 立即更新 UI
                    config.clockType = val;
                    safeStorage.setItem('clockType', val);
                    applyClockType();
                };
            }
        }

        if (dom.optRotation) {
            var rBtns = dom.optRotation.getElementsByTagName('button');
            for (var j = 0; j < rBtns.length; j++) {
                rBtns[j].onclick = function () {
                    var val = this.getAttribute('data-val');
                    updateRadioUI(dom.optRotation, val);
                    config.rotation = parseInt(val, 10);
                    safeStorage.setItem('rotation', val);
                    applyRotation();
                };
            }
        }
    }

    function updateRadioUI(container, currentVal) {
        if (!container) return;
        var buttons = container.getElementsByTagName('button');
        for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].getAttribute('data-val') == currentVal) {
                buttons[i].className = 'active';
            } else {
                buttons[i].className = '';
            }
        }
    }

    function openSettings() {
        state.settingsOpen = true;
        updateRadioUI(dom.optClockType, config.clockType);
        updateRadioUI(dom.optRotation, config.rotation);
        if (dom.settingsOverlay) {
            dom.settingsOverlay.classList.remove('hidden');
            dom.settingsOverlay.classList.add('visible');
        }
    }

    function closeSettings() {
        state.settingsOpen = false;
        if (dom.settingsOverlay) {
            dom.settingsOverlay.classList.remove('visible');
            dom.settingsOverlay.classList.add('hidden');
        }
    }

    function applyRotation() {
        if (!dom.app) return;
        var r = config.rotation || 0;
        var isLandscape = (r % 180 !== 0);

        dom.app.style.transform = 'rotate(' + r + 'deg)';

        if (isLandscape) {
            dom.app.style.width = '100vh';
            dom.app.style.height = '100vw';
            dom.app.style.position = 'absolute';
            dom.app.style.top = '50%';
            dom.app.style.left = '50%';
            dom.app.style.marginTop = '-50vw';
            dom.app.style.marginLeft = '-50vh';
        } else {
            dom.app.style.width = '100%';
            dom.app.style.height = '100%';
            dom.app.style.position = 'relative';
            dom.app.style.top = '0';
            dom.app.style.left = '0';
            dom.app.style.marginTop = '0';
            dom.app.style.marginLeft = '0';
        }
    }

    function applyClockType() {
        if (!dom.digitalClock || !dom.analogClock) return;
        if (config.clockType === 'digital') {
            dom.digitalClock.classList.remove('hidden');
            dom.analogClock.classList.add('hidden');
        } else {
            dom.digitalClock.classList.add('hidden');
            dom.analogClock.classList.remove('hidden');
        }
        updateClockView(new Date());
    }

    function startClockEngine() {
        updateClockView(new Date());

        var now = new Date();
        // 保护性计算
        try {
            var sec = now.getSeconds();
            var ms = now.getMilliseconds();
            var delay = (60 - sec) * 1000 - ms;
            if (delay < 0) delay = 1000;

            setTimeout(function () {
                updateClockView(new Date());
                checkGhosting(new Date());

                state.timer = setInterval(function () {
                    var d = new Date();
                    updateClockView(d);
                    checkGhosting(d);
                }, 60000);
            }, delay);
        } catch (e) {
            debugLog('Timer error: ' + e.message);
        }
    }

    function updateClockView(date) {
        if (window.ClockRenderer) {
            if (config.clockType === 'digital') {
                window.ClockRenderer.renderDigital(date);
            } else {
                window.ClockRenderer.renderAnalog(date);
            }
        }
    }

    function checkGhosting(date) {
        if (date.getMinutes() === 0) {
            triggerFullRefresh();
        }
    }

    function triggerFullRefresh() {
        if (!dom.refreshOverlay) return;
        dom.refreshOverlay.classList.remove('hidden');
        setTimeout(function () {
            dom.refreshOverlay.classList.add('hidden');
        }, 1000);
    }

    window.addEventListener('load', init);

})(window);
