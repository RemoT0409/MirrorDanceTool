// Video Player API
let player;
let playerType = null; // 'youtube' or 'bilibili'
let currentSegmentIndex = -1;
let isLooping = false;
let segments = [];
let autoSegments = [];
let editingSegmentId = null;
let videoDuration = 0;
let timeUpdateInterval = null;
let segmentCheckInterval = null;
let isMirrored = false;

// 從 localStorage 載入資料
function loadData() {
    const saved = localStorage.getItem('danceSegments');
    if (saved) {
        const data = JSON.parse(saved);
        segments = data.segments || [];
        autoSegments = data.autoSegments || [];
        renderSegments();
    }

    // 載入鏡像狀態
    const mirrorState = localStorage.getItem('isMirrored');
    if (mirrorState === 'true') {
        isMirrored = true;
        applyMirrorEffect();
    }
}

// 儲存資料到 localStorage
function saveData() {
    localStorage.setItem('danceSegments', JSON.stringify({
        segments: segments,
        autoSegments: autoSegments
    }));
}

// 初始化 YouTube Player
function onYouTubeIframeAPIReady() {
    // Player 會在載入影片時初始化
}

// 檢測影片類型並載入
function loadVideo(url) {
    if (isYouTubeUrl(url)) {
        loadYouTubeVideo(url);
    } else if (isBilibiliUrl(url)) {
        loadBilibiliVideo(url);
    } else {
        alert('請輸入有效的 YouTube 或 Bilibili 連結！');
    }
}

// 檢測是否為 YouTube URL
function isYouTubeUrl(url) {
    return /(youtube\.com|youtu\.be)/.test(url);
}

// 檢測是否為 Bilibili URL
function isBilibiliUrl(url) {
    return /bilibili\.com/.test(url);
}

// 從 URL 提取 YouTube Video ID
function extractYouTubeVideoId(url) {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// 從 URL 提取 Bilibili BV 號或 av 號
function extractBilibiliBvid(url) {
    // 支援多種 bilibili URL 格式
    // https://www.bilibili.com/video/BV1xx411c7mD
    // https://www.bilibili.com/video/av12345678
    // https://b23.tv/xxxxx
    // https://www.bilibili.com/video/BV1xx411c7mD?p=1

    // 先嘗試提取 BV 號（BV 後面跟著 10-12 位字符，標準是 12 位）
    // 匹配格式：BV + 1個數字 + 9-11個字母數字
    const bvMatch = url.match(/[Bb][Vv]([a-zA-Z0-9]{10,12})/);
    if (bvMatch) {
        const bvid = `BV${bvMatch[1]}`;
        console.log('成功提取 BV 號:', bvid);
        return bvid;
    }

    // 如果上面的匹配失敗，嘗試更寬鬆的匹配
    const bvMatchLoose = url.match(/[Bb][Vv]([a-zA-Z0-9]+)/);
    if (bvMatchLoose) {
        const bvid = `BV${bvMatchLoose[1]}`;
        console.log('使用寬鬆匹配提取 BV 號:', bvid);
        return bvid;
    }

    // 嘗試提取 av 號
    const avMatch = url.match(/[Aa][Vv](\d+)/);
    if (avMatch) {
        return {
            type: 'av',
            id: avMatch[1]
        };
    }

    // 如果是短連結 b23.tv，提示用戶使用完整連結
    if (url.includes('b23.tv')) {
        return {
            type: 'short',
            url: url
        };
    }

    return null;
}

// 載入 YouTube 影片
function loadYouTubeVideo(url) {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
        alert('請輸入有效的 YouTube 連結！');
        return;
    }

    // 先清理舊的播放器
    const playerContainer = document.getElementById('video-player');
    if (player) {
        // 如果是 YouTube player，先銷毀
        if (playerType === 'youtube' && typeof player.destroy === 'function') {
            try {
                player.destroy();
            } catch (e) {
                console.error('Error destroying YouTube player:', e);
            }
        }
        // 清空容器
        playerContainer.innerHTML = '';
    } else {
        // 即使沒有 player 變數，也清空容器
        playerContainer.innerHTML = '';
    }

    playerType = 'youtube';
    player = null;

    // 顯示影片區
    document.getElementById('video-section').style.display = 'block';
    document.getElementById('auto-segment-section').style.display = 'block';
    document.getElementById('segment-section').style.display = 'block';
    document.getElementById('playlist-section').style.display = 'block';

    // 套用鏡像效果（如果已啟用）
    setTimeout(() => {
        applyMirrorEffect();
        updateMirrorButton();
    }, 100);

    // 創建新的 player
    player = new YT.Player('video-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'playsinline': 1,
            'enablejsapi': 1,
            'origin': window.location.origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 載入 Bilibili 影片
function loadBilibiliVideo(url) {
    const videoInfo = extractBilibiliBvid(url);
    if (!videoInfo) {
        alert('請輸入有效的 Bilibili 連結！\n支援格式：\n- https://www.bilibili.com/video/BV1xx411c7mD\n- https://www.bilibili.com/video/av12345678\n\n注意：短連結 (b23.tv) 需要先轉換為完整連結');
        return;
    }

    // 處理短連結
    if (videoInfo.type === 'short') {
        alert('偵測到短連結，請使用完整的 Bilibili 影片連結（包含 BV 號或 av 號）');
        return;
    }

    // 先清理舊的播放器
    const playerContainer = document.getElementById('video-player');
    if (player) {
        // 如果是 YouTube player，先銷毀
        if (playerType === 'youtube' && typeof player.destroy === 'function') {
            try {
                player.destroy();
            } catch (e) {
                console.error('Error destroying YouTube player:', e);
            }
        }
        // 清空容器
        playerContainer.innerHTML = '';
    } else {
        // 即使沒有 player 變數，也清空容器
        playerContainer.innerHTML = '';
    }

    playerType = 'bilibili';
    player = null;

    // 顯示影片區
    document.getElementById('video-section').style.display = 'block';
    document.getElementById('auto-segment-section').style.display = 'block';
    document.getElementById('segment-section').style.display = 'block';
    document.getElementById('playlist-section').style.display = 'block';

    // 套用鏡像效果（如果已啟用）
    setTimeout(() => {
        applyMirrorEffect();
        updateMirrorButton();
    }, 100);

    // 構建 Bilibili iframe URL（嘗試多種格式）
    let iframeSrc = '';
    let originalUrl = url;

    if (typeof videoInfo === 'string' && videoInfo.startsWith('BV')) {
        // BV 號格式 - 使用官方嵌入格式
        // 嘗試多種 URL 格式以增加兼容性
        const bvid = videoInfo;
        // 格式1：標準格式（推薦）
        iframeSrc = `//player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&autoplay=0&danmaku=0`;
        console.log('使用 BV 號格式:', bvid);
    } else if (videoInfo && videoInfo.type === 'av') {
        // av 號格式
        iframeSrc = `//player.bilibili.com/player.html?aid=${videoInfo.id}&page=1&high_quality=1&autoplay=0&danmaku=0`;
        console.log('使用 av 號格式:', videoInfo.id);
    } else {
        alert('無法解析 Bilibili 連結格式，請確認連結是否正確');
        console.error('無法解析的 videoInfo:', videoInfo);
        return;
    }

    // 顯示載入提示
    playerContainer.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #fff; background: rgba(0,0,0,0.5);">
            <p style="font-size: 16px; margin-bottom: 10px;">正在載入 Bilibili 影片...</p>
            <p style="font-size: 12px; opacity: 0.7; margin-bottom: 10px;">影片 ID: ${typeof videoInfo === 'string' ? videoInfo : (videoInfo.id ? `av${videoInfo.id}` : '未知')}</p>
            <p style="font-size: 12px; opacity: 0.7;">如果無法載入，可能是區域限制或影片不允許嵌入</p>
        </div>
    `;

    // 創建 Bilibili iframe
    const iframe = document.createElement('iframe');

    // 確保使用正確的協議（Bilibili 必須使用 https）
    const protocol = 'https:';
    const fullUrl = protocol + iframeSrc;
    iframe.src = fullUrl;

    console.log('Bilibili iframe 完整 URL:', fullUrl);

    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.style.display = 'block';
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('framespacing', '0');
    // 移除 sandbox 限制，因為 Bilibili 需要更多權限
    // iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms');

    // 添加載入事件處理
    let loadTimeout;
    let errorCheckTimeout;

    iframe.onload = function() {
        clearTimeout(loadTimeout);
        console.log('Bilibili iframe 載入成功:', iframe.src);

        // 等待 5 秒後檢查播放器是否正常運作
        // 如果播放器顯示錯誤訊息，會觸發錯誤處理
        errorCheckTimeout = setTimeout(() => {
            console.log('檢查 Bilibili 播放器狀態...');
            // 由於 CORS 限制，我們無法直接檢查 iframe 內容
            // 但可以通過監聽訊息或顯示提示來幫助用戶
            checkBilibiliPlayerStatus(playerContainer, originalUrl, videoInfo);
        }, 5000);
    };

    iframe.onerror = function() {
        clearTimeout(loadTimeout);
        clearTimeout(errorCheckTimeout);
        console.error('Bilibili iframe 載入失敗');
        showBilibiliError(playerContainer, originalUrl, videoInfo);
    };

    // 設置超時檢查（20秒後如果還沒載入，顯示錯誤）
    loadTimeout = setTimeout(() => {
        clearTimeout(errorCheckTimeout);
        console.warn('Bilibili 播放器載入超時');
        showBilibiliError(playerContainer, originalUrl, videoInfo);
    }, 20000);

    // 監聽來自 iframe 的訊息（如果 Bilibili 播放器有發送錯誤訊息）
    window.addEventListener('message', function(event) {
        // 檢查訊息來源
        if (event.origin.includes('bilibili.com')) {
            console.log('收到 Bilibili 訊息:', event.data);
            // 如果收到錯誤訊息，顯示錯誤提示
            if (event.data && (event.data.type === 'error' || event.data.error)) {
                showBilibiliError(playerContainer, originalUrl, videoInfo);
            }
        }
    });

    playerContainer.innerHTML = ''; // 清除載入提示

    // 創建一個包裝容器，用於顯示錯誤提示
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.appendChild(iframe);
    playerContainer.appendChild(wrapper);
    player = iframe;

    // 5 秒後顯示提示（給播放器一些時間嘗試載入）
    // 如果播放器無法正常運作，會顯示錯誤提示
    setTimeout(() => {
        checkBilibiliPlayerStatus(wrapper, originalUrl, videoInfo);
    }, 5000);

    // 顯示調試訊息
    console.log('正在載入 Bilibili 影片:');
    console.log('- 原始 URL:', originalUrl);
    console.log('- 提取的資訊:', videoInfo);
    console.log('- iframe URL:', iframe.src);
}

// 檢查 Bilibili 播放器狀態
function checkBilibiliPlayerStatus(container, originalUrl, videoInfo) {
    // 由於 CORS 限制，無法直接檢查 iframe 內容
    // 但我們可以顯示一個提示，讓用戶知道如果看不到播放器該怎麼辦
    const existingError = container.querySelector('.bilibili-error-hint');
    if (existingError) return; // 已經顯示過提示了

    // 在播放器下方添加一個提示框
    const hint = document.createElement('div');
    hint.className = 'bilibili-error-hint';
    hint.style.cssText = `
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 87, 34, 0.95);
        color: #fff;
        padding: 20px 25px;
        border-radius: 12px;
        font-size: 14px;
        max-width: 90%;
        z-index: 1000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        text-align: center;
    `;
    hint.innerHTML = `
        <p style="margin: 0 0 12px 0; font-weight: 600; font-size: 16px;">⚠️ Bilibili 播放器無法載入</p>
        <p style="margin: 0 0 15px 0; font-size: 13px; opacity: 0.9; line-height: 1.6;">
            從控制台錯誤訊息可以看到，Bilibili 的 API 請求被阻擋了。<br>
            這通常是因為：<strong>區域限制、API 限制或網路問題</strong>
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button onclick="window.open('${originalUrl}', '_blank')" style="
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 14px;
            ">🔗 在 Bilibili 網站觀看</button>
            <button onclick="this.parentElement.parentElement.remove()" style="
                background: rgba(255,255,255,0.2);
                color: white;
                border: 1px solid rgba(255,255,255,0.3);
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
            ">關閉提示</button>
        </div>
        <p style="margin: 15px 0 0 0; font-size: 11px; opacity: 0.7;">
            💡 建議：使用 YouTube 影片可獲得完整功能（自動分段、時間控制等）
        </p>
    `;

    const videoWrapper = container.closest('.video-wrapper');
    if (videoWrapper) {
        videoWrapper.style.position = 'relative';
        videoWrapper.appendChild(hint);

        // 15 秒後自動隱藏
        setTimeout(() => {
            if (hint.parentElement) {
                hint.style.opacity = '0';
                hint.style.transition = 'opacity 0.5s';
                setTimeout(() => hint.remove(), 500);
            }
        }, 15000);
    }
}

// 顯示 Bilibili 錯誤訊息和備用方案
function showBilibiliError(container, originalUrl, videoInfo) {
    const bvid = typeof videoInfo === 'string' ? videoInfo : (videoInfo.id ? `av${videoInfo.id}` : '');

    container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #fff; background: rgba(0,0,0,0.8); min-height: 300px; display: flex; flex-direction: column; justify-content: center;">
            <p style="font-size: 20px; margin-bottom: 15px; color: #ff6b6b;">⚠️ Bilibili 影片無法嵌入播放</p>
            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 20px; line-height: 1.8;">
                <p style="margin-bottom: 10px;"><strong>可能的原因：</strong></p>
                <p>1. 影片不允許嵌入播放（版權限制）</p>
                <p>2. 區域限制（需要 VPN）</p>
                <p>3. 瀏覽器安全策略限制</p>
                <p>4. 網路連線問題</p>
            </div>
            <div style="margin-top: 25px; padding-top: 25px; border-top: 1px solid rgba(255,255,255,0.2);">
                <p style="font-size: 14px; margin-bottom: 15px;"><strong>建議解決方案：</strong></p>
                <a href="${originalUrl}" target="_blank" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 5px;">
                    🔗 在 Bilibili 網站觀看
                </a>
                <p style="font-size: 12px; opacity: 0.7; margin-top: 15px;">
                    或嘗試使用 YouTube 影片連結
                </p>
            </div>
            ${bvid ? `<p style="font-size: 11px; opacity: 0.5; margin-top: 20px;">影片 ID: ${bvid}</p>` : ''}
        </div>
    `;

    // Bilibili 需要等待 iframe 載入
    setTimeout(() => {
        onBilibiliPlayerReady();
    }, 1500);
}

// Bilibili Player 準備就緒（簡化版，因為 Bilibili API 有限制）
function onBilibiliPlayerReady() {
    // Bilibili 的 API 訪問受限，我們使用簡化的時間更新
    updateTimeDisplay();
    if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    timeUpdateInterval = setInterval(updateTimeDisplay, 100);
}

// Player 準備就緒
function onPlayerReady(event) {
    if (playerType === 'youtube') {
        videoDuration = player.getDuration();
    }
    updateTimeDisplay();
    if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    timeUpdateInterval = setInterval(updateTimeDisplay, 100);
}

// Player 狀態改變
function onPlayerStateChange(event) {
    if (playerType === 'youtube' && event.data === YT.PlayerState.ENDED) {
        // 如果正在循環播放段落，自動重播
        if (isLooping && currentSegmentIndex >= 0) {
            playSegment(currentSegmentIndex);
        }
    }
}

// 更新時間顯示
function updateTimeDisplay() {
    if (!player || playerType === 'bilibili') {
        // Bilibili 無法直接獲取時間，顯示提示
        if (playerType === 'bilibili') {
            document.getElementById('current-time').textContent = '--:--';
            document.getElementById('total-time').textContent = '--:--';
        }
        return;
    }

    try {
        if (playerType === 'youtube') {
            const current = player.getCurrentTime();
            const duration = player.getDuration();

            if (!isNaN(duration)) {
                videoDuration = duration;
            }

            document.getElementById('current-time').textContent = formatTime(current);
            document.getElementById('total-time').textContent = formatTime(duration);
        }
    } catch (e) {
        // 忽略錯誤（影片可能還在載入）
    }
}

// 獲取當前播放時間
function getCurrentTime() {
    if (!player) return 0;

    if (playerType === 'youtube') {
        try {
            return player.getCurrentTime();
        } catch (e) {
            return 0;
        }
    } else if (playerType === 'bilibili') {
        // Bilibili 無法直接獲取，返回 0
        alert('Bilibili 影片無法自動獲取當前時間，請手動輸入時間');
        return 0;
    }
    return 0;
}

// 跳轉到指定時間
function seekTo(time) {
    if (!player) return;

    if (playerType === 'youtube') {
        try {
            player.seekTo(time, true);
        } catch (e) {
            console.error('無法跳轉時間', e);
        }
    } else if (playerType === 'bilibili') {
        // Bilibili 需要通過 iframe 通信，這裡簡化處理
        alert('Bilibili 影片時間跳轉功能有限，請在影片播放器中手動操作');
    }
}

// 播放影片
function playVideo() {
    if (!player) return;

    if (playerType === 'youtube') {
        try {
            player.playVideo();
        } catch (e) {
            console.error('無法播放', e);
        }
    } else if (playerType === 'bilibili') {
        // Bilibili 需要通過 iframe 通信
        alert('請在影片播放器中點擊播放按鈕');
    }
}

// 暫停影片
function pauseVideo() {
    if (!player) return;

    if (playerType === 'youtube') {
        try {
            player.pauseVideo();
        } catch (e) {
            console.error('無法暫停', e);
        }
    } else if (playerType === 'bilibili') {
        alert('請在影片播放器中點擊暫停按鈕');
    }
}

// 格式化時間 (秒 -> MM:SS.m)
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00.0';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const dec = Math.floor((seconds % 1) * 10);

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${dec}`;
}

// 解析時間字串 (MM:SS.m -> 秒)
function parseTime(timeStr) {
    if (!timeStr) return 0;

    const parts = timeStr.split(':');
    if (parts.length !== 2) return 0;

    const mins = parseInt(parts[0]) || 0;
    const secParts = parts[1].split('.');
    const secs = parseInt(secParts[0]) || 0;
    const dec = parseInt(secParts[1]) || 0;

    return mins * 60 + secs + dec / 10;
}

// 設定開始時間
function setStartTime() {
    const current = getCurrentTime();
    if (current === 0 && playerType === 'bilibili') {
        return; // 已經顯示了提示
    }
    document.getElementById('start-time').value = formatTime(current);
}

// 設定結束時間
function setEndTime() {
    const current = getCurrentTime();
    if (current === 0 && playerType === 'bilibili') {
        return; // 已經顯示了提示
    }
    document.getElementById('end-time').value = formatTime(current);
}

// 自動分段
function autoSegment() {
    if (!player || playerType === 'bilibili') {
        alert('自動分段功能目前僅支援 YouTube 影片');
        return;
    }

    const interval = parseFloat(document.getElementById('segment-interval').value);
    if (!interval || interval < 5) {
        alert('請輸入有效的時間間隔（至少 5 秒）');
        return;
    }

    try {
        const duration = player.getDuration();
        if (!duration || isNaN(duration)) {
            alert('無法獲取影片長度，請稍候再試');
            return;
        }

        videoDuration = duration;
        autoSegments = [];

        let start = 0;
        let segmentNum = 1;

        while (start < duration) {
            const end = Math.min(start + interval, duration);
            autoSegments.push({
                id: `auto-${Date.now()}-${segmentNum}`,
                name: `第 ${segmentNum} 段`,
                startTime: start,
                endTime: end,
                startTimeStr: formatTime(start),
                endTimeStr: formatTime(end),
                notes: '',
                isAuto: true
            });
            start = end;
            segmentNum++;
        }

        saveData();
        renderAutoSegments();
        renderSegments();
    } catch (e) {
        alert('自動分段失敗：' + e.message);
    }
}

// 清除自動分段
function clearAutoSegments() {
    if (confirm('確定要清除所有自動分段嗎？')) {
        autoSegments = [];
        saveData();
        renderAutoSegments();
        renderSegments();
    }
}

// 渲染自動分段預覽
function renderAutoSegments() {
    const preview = document.getElementById('auto-segments-preview');

    if (autoSegments.length === 0) {
        preview.innerHTML = '';
        return;
    }

    preview.innerHTML = autoSegments.map((segment, index) => `
        <div class="auto-segment-chip ${currentSegmentIndex === index && isAutoSegment(index) ? 'active' : ''}"
             onclick="jumpToAutoSegment(${index})">
            第 ${index + 1} 段 (${segment.startTimeStr} - ${segment.endTimeStr})
        </div>
    `).join('');
}

// 判斷是否為自動分段
function isAutoSegment(index) {
    // 檢查是否在 autoSegments 範圍內
    return index < autoSegments.length;
}

// 跳轉到自動分段
function jumpToAutoSegment(index) {
    if (index < 0 || index >= autoSegments.length) return;

    const segment = autoSegments[index];
    currentSegmentIndex = index;
    isLooping = false;

    seekTo(segment.startTime);
    playVideo();

    renderAutoSegments();
    renderSegments();
}

// 新增手動段落
function addSegment() {
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const name = document.getElementById('segment-name').value.trim();

    if (!startTime || !endTime) {
        alert('請設定開始和結束時間！');
        return;
    }

    const start = parseTime(startTime);
    const end = parseTime(endTime);

    if (start >= end) {
        alert('結束時間必須大於開始時間！');
        return;
    }

    const segment = {
        id: Date.now(),
        name: name || `手動段落 ${segments.length + 1}`,
        startTime: start,
        endTime: end,
        startTimeStr: startTime,
        endTimeStr: endTime,
        notes: '',
        isAuto: false
    };

    segments.push(segment);
    saveData();
    renderSegments();

    // 清空輸入
    document.getElementById('start-time').value = '';
    document.getElementById('end-time').value = '';
    document.getElementById('segment-name').value = '';
}

// 渲染段落列表
function renderSegments() {
    const list = document.getElementById('segments-list');

    // 合併自動分段和手動分段
    const allSegments = [...autoSegments, ...segments];

    if (allSegments.length === 0) {
        list.innerHTML = '<div class="empty-state">還沒有任何練習段落<br>使用上方工具新增段落吧！</div>';
        return;
    }

    list.innerHTML = allSegments.map((segment, index) => {
        const isAuto = segment.isAuto || false;
        const displayIndex = index;
        const isActive = currentSegmentIndex === displayIndex;

        return `
        <div class="segment-item ${isActive ? 'active' : ''} ${isAuto ? 'auto-segment' : 'manual-segment'}" data-index="${displayIndex}" data-is-auto="${isAuto}">
            <div class="segment-header">
                <div class="segment-title">
                    ${segment.name}
                    <span class="segment-badge ${isAuto ? 'auto' : 'manual'}">${isAuto ? '自動' : '手動'}</span>
                </div>
                <div class="segment-time">${segment.startTimeStr} → ${segment.endTimeStr}</div>
            </div>
            ${segment.notes ? `<div class="segment-notes">${segment.notes}</div>` : ''}
            <div class="segment-controls">
                <button class="btn btn-primary" onclick="playSegment(${displayIndex}, ${isAuto})">▶️ 播放</button>
                <button class="btn btn-success" onclick="loopSegment(${displayIndex}, ${isAuto})">
                    ${isActive && isLooping ? '<span class="loop-indicator"></span>循環中' : '🔁 循環播放'}
                </button>
                ${!isAuto ? `<button class="btn btn-secondary" onclick="editSegment(${displayIndex})">✏️ 編輯</button>` : ''}
            </div>
        </div>
    `;
    }).join('');

    // 點擊段落項目跳轉
    list.querySelectorAll('.segment-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                const index = parseInt(item.dataset.index);
                const isAuto = item.dataset.isAuto === 'true';
                playSegment(index, isAuto);
            }
        });
    });
}

// 播放段落
function playSegment(index, isAuto = false, shouldLoop = false) {
    if (!player) return;

    const allSegments = [...autoSegments, ...segments];
    if (index < 0 || index >= allSegments.length) return;

    const segment = allSegments[index];
    currentSegmentIndex = index;

    // 只有在明確不循環時才設置 isLooping = false
    if (!shouldLoop) {
        isLooping = false;
    }

    seekTo(segment.startTime);
    playVideo();

    // 監聽播放進度，到達結束時間時停止（僅 YouTube）
    if (playerType === 'youtube') {
        if (segmentCheckInterval) clearInterval(segmentCheckInterval);

        segmentCheckInterval = setInterval(() => {
            if (!player || playerType !== 'youtube') {
                clearInterval(segmentCheckInterval);
                return;
            }

            try {
                const current = player.getCurrentTime();
                if (current >= segment.endTime) {
                    pauseVideo();
                    clearInterval(segmentCheckInterval);

                    // 如果正在循環，重新播放
                    if (isLooping && currentSegmentIndex === index) {
                        setTimeout(() => {
                            playSegment(index, isAuto, true);
                        }, 300);
                    }
                }
            } catch (e) {
                clearInterval(segmentCheckInterval);
            }
        }, 100);
    } else if (playerType === 'bilibili') {
        // Bilibili 的循環處理（簡化版）
        if (isLooping && currentSegmentIndex === index) {
            setTimeout(() => {
                if (isLooping && currentSegmentIndex === index) {
                    playSegment(index, isAuto, true);
                }
            }, (segment.endTime - segment.startTime) * 1000 + 300);
        }
    }

    renderAutoSegments();
    renderSegments();
}

// 循環播放段落
function loopSegment(index, isAuto = false) {
    if (currentSegmentIndex === index && isLooping) {
        // 停止循環
        isLooping = false;
        currentSegmentIndex = -1;
        if (segmentCheckInterval) clearInterval(segmentCheckInterval);
        pauseVideo();
        renderAutoSegments();
        renderSegments();
    } else {
        // 開始循環
        isLooping = true;
        playSegment(index, isAuto, true);
    }
}

// 編輯段落（僅手動段落）
function editSegment(index) {
    const allSegments = [...autoSegments, ...segments];
    if (index < autoSegments.length) {
        alert('自動分段無法編輯，請使用手動新增功能');
        return;
    }

    const actualIndex = index - autoSegments.length;
    const segment = segments[actualIndex];
    editingSegmentId = segment.id;

    document.getElementById('modal-segment-name').value = segment.name;
    document.getElementById('modal-start-time').value = segment.startTimeStr;
    document.getElementById('modal-end-time').value = segment.endTimeStr;
    document.getElementById('modal-notes').value = segment.notes;

    document.getElementById('segment-modal').style.display = 'block';
}

// 儲存編輯
function saveSegment() {
    if (editingSegmentId === null) return;

    const index = segments.findIndex(s => s.id === editingSegmentId);
    if (index === -1) return;

    const name = document.getElementById('modal-segment-name').value.trim();
    const startTimeStr = document.getElementById('modal-start-time').value;
    const endTimeStr = document.getElementById('modal-end-time').value;
    const notes = document.getElementById('modal-notes').value.trim();

    if (!startTimeStr || !endTimeStr) {
        alert('請輸入開始和結束時間！');
        return;
    }

    const start = parseTime(startTimeStr);
    const end = parseTime(endTimeStr);

    if (start >= end) {
        alert('結束時間必須大於開始時間！');
        return;
    }

    segments[index] = {
        ...segments[index],
        name: name || `手動段落 ${index + 1}`,
        startTime: start,
        endTime: end,
        startTimeStr: startTimeStr,
        endTimeStr: endTimeStr,
        notes: notes
    };

    saveData();
    renderSegments();
    closeModal();
}

// 刪除段落
function deleteSegment() {
    if (editingSegmentId === null) return;

    if (!confirm('確定要刪除這個段落嗎？')) return;

    const index = segments.findIndex(s => s.id === editingSegmentId);
    if (index !== -1) {
        segments.splice(index, 1);
        saveData();
        renderSegments();

        // 重新計算 currentSegmentIndex
        const allSegments = [...autoSegments, ...segments];
        if (currentSegmentIndex >= allSegments.length) {
            currentSegmentIndex = -1;
            isLooping = false;
        }
    }

    closeModal();
}

// 關閉 Modal
function closeModal() {
    document.getElementById('segment-modal').style.display = 'none';
    editingSegmentId = null;
}

// 播放/暫停
function togglePlayPause() {
    if (!player) return;

    if (playerType === 'youtube') {
        try {
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                pauseVideo();
                document.getElementById('play-pause-btn').textContent = '▶️ 播放';
            } else {
                playVideo();
                document.getElementById('play-pause-btn').textContent = '⏸️ 暫停';
            }
        } catch (e) {
            alert('無法控制播放，請稍候再試');
        }
    } else {
        alert('請在影片播放器中控制播放');
    }
}

// 停止播放
function stopPlayback() {
    if (!player) return;

    pauseVideo();
    seekTo(0);
    document.getElementById('play-pause-btn').textContent = '▶️ 播放';
    isLooping = false;
    currentSegmentIndex = -1;
    if (segmentCheckInterval) clearInterval(segmentCheckInterval);
    renderAutoSegments();
    renderSegments();
}

// 切換鏡像模式
function toggleMirror() {
    isMirrored = !isMirrored;
    applyMirrorEffect();
    localStorage.setItem('isMirrored', isMirrored.toString());
    updateMirrorButton();
}

// 套用鏡像效果
function applyMirrorEffect() {
    const playerContainer = document.getElementById('video-player');
    if (!playerContainer) return;

    if (isMirrored) {
        playerContainer.style.transform = 'scaleX(-1)';
    } else {
        playerContainer.style.transform = 'scaleX(1)';
    }
}

// 更新鏡像按鈕文字
function updateMirrorButton() {
    const btn = document.getElementById('mirror-btn');
    if (btn) {
        btn.textContent = isMirrored ? '🪞 取消鏡像' : '🪞 鏡像';
        btn.classList.toggle('active', isMirrored);
    }
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    // 載入資料
    loadData();

    // 影片連結載入
    document.getElementById('load-video-btn').addEventListener('click', () => {
        const url = document.getElementById('video-url').value.trim();
        if (url) {
            loadVideo(url);
        } else {
            alert('請輸入影片連結！');
        }
    });

    // Enter 鍵載入
    document.getElementById('video-url').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('load-video-btn').click();
        }
    });

    // 設定時間按鈕
    document.getElementById('set-start-btn').addEventListener('click', setStartTime);
    document.getElementById('set-end-btn').addEventListener('click', setEndTime);

    // 自動分段
    document.getElementById('auto-segment-btn').addEventListener('click', autoSegment);
    document.getElementById('clear-auto-segments-btn').addEventListener('click', clearAutoSegments);

    // 新增段落
    document.getElementById('add-segment-btn').addEventListener('click', addSegment);

    // 播放控制
    document.getElementById('play-pause-btn').addEventListener('click', togglePlayPause);
    document.getElementById('stop-btn').addEventListener('click', stopPlayback);
    document.getElementById('mirror-btn').addEventListener('click', toggleMirror);

    // 初始化鏡像按鈕狀態
    updateMirrorButton();

    // Modal 控制
    document.getElementById('save-segment-btn').addEventListener('click', saveSegment);
    document.getElementById('delete-segment-btn').addEventListener('click', deleteSegment);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    document.querySelector('.close-modal').addEventListener('click', closeModal);

    // 點擊 Modal 外部關閉
    document.getElementById('segment-modal').addEventListener('click', (e) => {
        if (e.target.id === 'segment-modal') {
            closeModal();
        }
    });

    // 如果 YouTube API 已經載入，初始化
    if (typeof YT !== 'undefined' && YT.Player) {
        onYouTubeIframeAPIReady();
    } else {
        // 否則等待 API 載入
        window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }
});
