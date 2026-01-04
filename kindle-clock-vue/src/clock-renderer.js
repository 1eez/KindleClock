// 纯 ES5 渲染器 - 防御性版本 v4 (SVG Attributes Fix)
(function (window) {
    var ClockRenderer = {};

    var DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    function log(msg) {
        if (window.debugLog) window.debugLog('[Renderer] ' + msg);
    }

    function pad(num) {
        return num < 10 ? '0' + num : num;
    }

    function safeSetHTML(id, html) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }

    function safeSetAttr(id, attr, val) {
        var el = document.getElementById(id);
        if (el) el.setAttribute(attr, val);
    }

    ClockRenderer.renderDigital = function (date) {
        if (!date) return;
        try {
            var hours = pad(date.getHours());
            var minutes = pad(date.getMinutes());
            var timeStr = hours + ':' + minutes;

            var y = date.getFullYear();
            var m = date.getMonth() + 1;
            var d = date.getDate();
            var day = DAYS[date.getDay()];
            var dateStr = y + '年' + m + '月' + d + '日 ' + day;

            safeSetHTML('dc-time', timeStr);
            safeSetHTML('dc-date', dateStr);
        } catch (e) {
            log('Digital render err: ' + e.message);
        }
    };

    ClockRenderer.initAnalogTicks = function () {
        try {
            log('initAnalogTicks start');
            var ticksGroup = document.getElementById('ac-ticks');
            if (!ticksGroup) {
                log('ac-ticks not found');
                return;
            }

            var hasChildren = false;
            if (ticksGroup.children && ticksGroup.children.length > 0) hasChildren = true;
            else if (ticksGroup.childNodes && ticksGroup.childNodes.length > 0) hasChildren = true;

            if (hasChildren) return;

            log('creating ticks...');
            for (var i = 1; i <= 12; i++) {
                var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute('x1', '50');
                line.setAttribute('y1', '5');
                line.setAttribute('x2', '50');
                line.setAttribute('y2', '10');
                // line.setAttribute('class', 'tick'); // CSS class might fail

                // 显式设置属性 (Hardcode attributes because CSS fails on Kindle SVG)
                line.setAttribute('fill', 'none');
                line.setAttribute('stroke', 'black');
                line.setAttribute('stroke-width', '2');

                line.setAttribute('transform', 'rotate(' + (i * 30) + ' 50 50)');
                ticksGroup.appendChild(line);
            }
            log('ticks created');
        } catch (e) {
            log('Init ticks error: ' + e.message);
            throw e;
        }
    };

    ClockRenderer.renderAnalog = function (date) {
        if (!date) return;
        try {
            var h = date.getHours() % 12;
            var m = date.getMinutes();

            var hourDeg = (h * 30) + (m * 0.5);
            var minuteDeg = m * 6;

            safeSetAttr('ac-hour', 'transform', 'rotate(' + hourDeg + ' 50 50)');
            safeSetAttr('ac-minute', 'transform', 'rotate(' + minuteDeg + ' 50 50)');

            var elDate = document.getElementById('ac-date');
            if (elDate) {
                elDate.innerHTML = (date.getMonth() + 1) + '月' + date.getDate() + '日';
            }
        } catch (e) {
            log('Analog render err: ' + e.message);
        }
    };

    window.ClockRenderer = ClockRenderer;
})(window);
