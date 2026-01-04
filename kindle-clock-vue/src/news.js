// 新闻模块 - 严格 ES5
(function (window) {
    var NewsModule = {
        api: 'https://60s.viki.moe/v2/60s',
        newsList: [],
        currentIndex: 0,
        timer: null,
        interval: 60000, // 60秒

        init: function () {
            this.dom = {
                container: document.getElementById('news-container'),
                text: document.getElementById('news-text')
            };

            if (!this.dom.container || !this.dom.text) {
                console.error('News DOM not found');
                return;
            }

            this.fetchNews();

            // 定时刷新整个列表 (每6小时)
            var self = this;
            setInterval(function () {
                self.fetchNews();
            }, 6 * 60 * 60 * 1000);
        },

        fetchNews: function () {
            var xhr = new XMLHttpRequest();
            var self = this;

            xhr.open('GET', this.api, true);
            xhr.timeout = 15000; // 15秒超时

            xhr.onload = function () {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        var res = JSON.parse(xhr.responseText);
                        if (res && res.data && res.data.news && res.data.news.length > 0) {
                            self.newsList = res.data.news;
                            self.startRotating();
                        } else {
                            self.handleError('数据格式错误');
                        }
                    } catch (e) {
                        self.handleError('JSON解析失败');
                    }
                } else {
                    self.handleError('HTTP ' + xhr.status);
                }
            };

            xhr.onerror = function () {
                self.handleError('网络错误');
            };

            xhr.ontimeout = function () {
                self.handleError('请求超时');
            };

            xhr.send();
        },

        handleError: function (msg) {
            // 出错时显示默认文案或保持当前内容，并尝试重试
            if (this.newsList.length === 0) {
                this.dom.text.textContent = '获取新闻失败...';
            }

            // 1分钟后重试
            var self = this;
            setTimeout(function () {
                self.fetchNews();
            }, 60000);
        },

        startRotating: function () {
            if (this.timer) clearInterval(this.timer);

            this.showNews();

            var self = this;
            this.timer = setInterval(function () {
                self.showNews();
            }, this.interval);
        },

        showNews: function () {
            if (this.newsList.length === 0) return;

            // 随机选取一条
            var randomIndex = Math.floor(Math.random() * this.newsList.length);
            var text = this.newsList[randomIndex];

            // 截断处理
            if (text.length > 40) {
                text = text.substring(0, 38) + '...';
            }

            this.dom.text.textContent = text;
        }
    };

    // 暴露给全局，方便调试
    window.NewsModule = NewsModule;

    // 页面加载完成后初始化
    if (document.readyState === 'complete') {
        NewsModule.init();
    } else {
        window.addEventListener('load', function () {
            NewsModule.init();
        });
    }

})(window);
