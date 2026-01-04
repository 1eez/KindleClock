// 天气模块 - Vanilla JS (ES5)
(function (window) {
    // 依赖: window.returnCitySN (sohu ip接口)

    var Weather = {};

    function log(msg) {
        if (window.debugLog) window.debugLog('[Weather] ' + msg);
    }

    function createXHR() {
        if (window.XMLHttpRequest) {
            return new XMLHttpRequest();
        } else if (window.ActiveXObject) {
            return new ActiveXObject("Microsoft.XMLHTTP");
        }
        return null;
    }

    function safeSetHTML(id, html) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    // 核心逻辑: 获取并渲染天气
    Weather.update = function () {
        log('Start update...');

        // 1. 获取 IP (依赖外部脚本，如果加载失败则可能报错，需防御)
        var ip = '';
        if (window.returnCitySN && window.returnCitySN.cip) {
            ip = window.returnCitySN.cip;
        } else {
            log('Warning: returnCitySN not found, trying without IP');
        }

        var xhr = createXHR();
        if (!xhr) {
            log('XHR not supported');
            return;
        }

        // 2. 请求 API
        // 使用用户提供的 Token
        var url = 'https://v2.alapi.cn/api/tianqi?token=pBsICqbRV2eVtGiI&ip=' + ip;

        xhr.open('GET', url, true);
        xhr.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    try {
                        var res = JSON.parse(this.responseText);
                        if (res.code === 200) {
                            render(res.data);
                            log('Update success');
                        } else {
                            log('API Error: ' + res.msg);
                            safeSetHTML('weather-text', '天气数据不足');
                        }
                    } catch (e) {
                        log('Parse Error: ' + e.message);
                    }
                } else {
                    log('Network Error: ' + this.status);
                    safeSetHTML('weather-text', '网络连接失败');
                }
            }
        };
        xhr.onerror = function () {
            log('XHR OnError triggered');
        };
        xhr.send(null);
    };

    // 图标映射 (移植自 old project)
    // 格式: [白天图标, 夜间图标]
    var weaImgs = {
        xue: ['&#xe645;', '&#xe645;'],
        lei: ['&#xe643;', '&#xe643;'],
        shachen: ['&#xe646;', '&#xe646;'],
        wu: ['&#xe647;', '&#xe647;'],
        bingbao: ['&#xe667;', '&#xe667;'],
        yun: ['&#xe648;', '&#xe648;'],
        duoyun: ['&#xe648;', '&#xe648;'],
        yu: ['&#xe64b;', '&#xe64b;'],
        yin: ['&#xe64a;', '&#xe652;'],
        qing: ['&#xe649;', '&#xe764;'],
        weizhi: ['&#xe6f2;', '&#xe6f2;']
    };

    function render(data) {
        // data 结构参考:
        // weather: "晴"
        // weather_code: "qing" (假设 API 返回这个，如果没有需要 map)
        // temp: "25"
        // max_temp: "30"
        // min_temp: "20"

        // 1. 图标逻辑
        var code = data.weather_code || 'weizhi';
        var imgs = weaImgs[code] || weaImgs['weizhi'];
        var img = imgs[0];

        // 判断日夜 (6:00 - 19:00 为白天)
        var nowHour = new Date().getHours();
        if (nowHour >= 19 || nowHour < 6) {
            img = imgs[1];
        }
        safeSetHTML('weather-icon', img);

        // 2. 天气状况文本 (加上城市信息)
        // 格式: 城市·区县 天气
        var cityInfo = data.city + ' ' + (data.district || '');
        safeSetHTML('weather-text', cityInfo + ' ' + data.weather);

        // 3. 当前温度
        safeSetHTML('weather-current', data.temp + '°');

        // 4. 高低温
        safeSetHTML('weather-range', '最高 ' + data.max_temp + '° / 最低 ' + data.min_temp + '°');
    }

    // 暴露接口
    window.Weather = Weather;

    // 自动启动
    // 在 main.js 中统一调用，或者在这里自启动
    // 为了稳健，我们等待 window load
    window.addEventListener('load', function () {
        // 延时一点启动，避免和时钟初始化抢资源
        setTimeout(function () {
            Weather.update();
            // 每 20 分钟刷新一次
            setInterval(Weather.update, 120 * 60 * 1000);
        }, 2000);
    });

})(window);
