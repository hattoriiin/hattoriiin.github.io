/* ==================================================
   rebuild-test/components.js
   担当医表・診療時間時計
================================================== */
function showElement(element) {
    if (element) element.hidden = false;
}
function hideElement(element) {
    if (element) element.hidden = true;
}
/* ==================================================
   担当医表
================================================== */
const scheduleContainer = document.getElementById('schedule-container');
const doctorsButton = document.getElementById('toggle-doctors-btn');
const doctorsStatus = document.getElementById('doctors-status');
const baseScheduleTable = scheduleContainer
    ? scheduleContainer.querySelector('table.table-schedule-base')
    : null;
let doctorsOverlayTable = null;
let doctorsDataReady = false;
/* 担当医データ：外部ファイルの読み込みに依存しない */
const doctors = {
    '月': { '午前': '院長', '訪問': '院長', '午後': '村田先生' },
    '火': { '午前': '院長', '訪問': '院長', '午後': '院長' },
    '水': { '午前': '',     '訪問': '院長', '午後': '院長' },
    '木': { '午前': '関先生', '訪問': '院長', '午後': '院長' },
    '金': { '午前': '院長', '訪問': '',     '午後': '糠谷先生' },
    '土': { '午前': '院長', '訪問': '',     '午後': '' }
};
function syncDoctorsOverlaySize() {
    if (!baseScheduleTable || !doctorsOverlayTable) return;
    const rect = baseScheduleTable.getBoundingClientRect();
    if (rect.width > 0) {
        doctorsOverlayTable.style.width = `${rect.width}px`;
    }
    if (rect.height > 0) {
        doctorsOverlayTable.style.height = `${rect.height}px`;
    }
}
function lockScheduleContainerHeight() {
    if (!scheduleContainer || !baseScheduleTable) return;
    const height = baseScheduleTable.getBoundingClientRect().height;
    if (height > 0) {
        scheduleContainer.style.height = `${height}px`;
    }
    syncDoctorsOverlaySize();
}
function setDoctorsStatus(message, isError = false) {
    if (!doctorsStatus) return;
    doctorsStatus.textContent = message || '';
    doctorsStatus.classList.toggle('schedule-error', isError);
}
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function createDoctorName(name) {
    if (!name || !String(name).trim()) {
        return '<span class="doctor-empty">―</span>';
    }
    const cleanName = String(name).replace(/先生$/, '').trim();
    if (!cleanName) {
        return '<span class="doctor-empty">―</span>';
    }
    let className = 'doctor-name';
    if (cleanName.length >= 6) {
        className += ' very-long';
    } else if (cleanName.length >= 4) {
        className += ' long';
    }
    const chars = [...cleanName]
        .map(char => `<span class="doctor-char">${escapeHtml(char)}</span>`)
        .join('');
    return `<span class="${className}">${chars}</span>`;
}
function createDoctorsTable() {
    const table = document.createElement('table');
    table.id = 'doctors-overlay-table';
    table.className = 'schedule table-overlay';
    const days = ['月', '火', '水', '木', '金', '土'];
    const header = document.createElement('tr');
    header.innerHTML = '<th></th>' +
        days.map(day => `<th>${day}</th>`).join('');
    table.appendChild(header);
    const rows = [
        {
            label: '🏥　午前診<br><span>9:00〜12:00</span>',
            key: '午前'
        },
        {
            label: '🏠　<a href="/houmon.html">訪問診療</a><br><span>13:30〜16:30</span>',
            key: '訪問'
        },
        {
            label: '🏥　午後診<br><span>17:30〜19:30</span>',
            key: '午後'
        }
    ];
    rows.forEach(rowData => {
        const row = document.createElement('tr');
        const heading = document.createElement('th');
        heading.innerHTML = rowData.label;
        row.appendChild(heading);
        days.forEach(day => {
            const cell = document.createElement('td');
            cell.innerHTML = createDoctorName(
                doctors[day][rowData.key]
            );
            row.appendChild(cell);
        });
        table.appendChild(row);
    });
    return table;
}
function loadDoctorsTable() {
    if (!scheduleContainer || !doctorsButton || !baseScheduleTable) {
        setDoctorsStatus('担当医表を準備できませんでした。', true);
        return;
    }
    const oldTable = scheduleContainer.querySelector(
        '#doctors-overlay-table'
    );
    if (oldTable) oldTable.remove();
    doctorsOverlayTable = createDoctorsTable();
    scheduleContainer.appendChild(doctorsOverlayTable);
    doctorsDataReady = true;
    lockScheduleContainerHeight();
    doctorsButton.disabled = false;
    setDoctorsStatus(
        'ボタンを長押ししている間、担当医表を表示します。'
    );
}
function setDoctorsOverlayVisible(isVisible) {
    if (
        !doctorsDataReady ||
        !doctorsOverlayTable ||
        !scheduleContainer ||
        !doctorsButton
    ) {
        return;
    }
    if (isVisible) {
        lockScheduleContainerHeight();
    }
    scheduleContainer.classList.toggle('is-active', isVisible);
    doctorsButton.classList.toggle('active', isVisible);
    doctorsButton.setAttribute('aria-pressed', String(isVisible));
}
/* ==================================================
   長押し判定
================================================== */
function setupLongPress(
    button,
    {
        onStart,
        onEnd,
        onCancel,
        endOnPointerLeave = true,
        delay = 500
    } = {}
) {
    if (!button) return;
    let pointerId = null;
    let timer = null;
    let active = false;
    let startX = 0;
    let startY = 0;
    function clearTimer() {
        if (timer !== null) {
            window.clearTimeout(timer);
            timer = null;
        }
    }
    function finish(event, kind = 'end') {
        clearTimer();
        if (pointerId === null) return;
        pointerId = null;
        if (!active) return;
        active = false;
        if (kind === 'cancel') {
            if (typeof onCancel === 'function') {
                onCancel(event);
            }
        } else if (typeof onEnd === 'function') {
            onEnd(event);
        }
    }
    function start(event) {
        if (pointerId !== null || event.button === 2) return;
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        clearTimer();
        timer = window.setTimeout(() => {
            timer = null;
            if (pointerId !== event.pointerId) return;
            active = true;
            if (typeof onStart === 'function') {
                onStart(event);
            }
        }, delay);
    }
    function move(event) {
        if (
            pointerId === null ||
            event.pointerId !== pointerId ||
            active
        ) {
            return;
        }
        if (event.pointerType === 'touch') {
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            if (Math.hypot(dx, dy) > 8) {
                finish(event, 'cancel');
            }
        }
    }
    function end(event) {
        finish(event, 'end');
    }
    function cancel(event) {
        finish(event, 'cancel');
    }
    button.addEventListener('pointerdown', start);
    button.addEventListener('pointermove', move);
    button.addEventListener('pointerup', end);
    button.addEventListener('pointercancel', cancel);
    button.addEventListener('lostpointercapture', cancel);
    if (endOnPointerLeave) {
        button.addEventListener('pointerleave', event => {
            if (event.pointerType === 'mouse') {
                finish(event, 'end');
            }
        });
    }
    window.addEventListener('blur', () => {
        finish(null, 'cancel');
    });
}
/* 担当医ボタン */
if (doctorsButton) {
    setupLongPress(doctorsButton, {
        onStart: () => setDoctorsOverlayVisible(true),
        onEnd: () => setDoctorsOverlayVisible(false),
        onCancel: () => setDoctorsOverlayVisible(false)
    });
}
loadDoctorsTable();
window.addEventListener('resize', lockScheduleContainerHeight);
/* ==================================================
   診療時間時計
================================================== */
const clockButton = document.getElementById('clockBtn');
const clockModal = document.getElementById('clockModal');
const clockFrame = clockModal
    ? clockModal.querySelector('iframe')
    : null;
const clockError = document.getElementById('clock-error');
let clockFrameLoaded = false;
let clockTouchActive = false;
let clockLastTouchY = null;
function showClockError() {
    showElement(clockError);
}
function hideClockError() {
    hideElement(clockError);
}
function adjustClock() {
    if (!clockFrame) return;
    try {
        const frameDocument = clockFrame.contentDocument;
        if (!frameDocument) {
            throw new Error('時計iframeのdocumentを取得できません');
        }
        const title = frameDocument.querySelector('.clock-title');
        if (title) {
            title.style.display = 'none';
        }
        const timeRing = frameDocument.querySelector('.time-ring');
        if (timeRing) {
            timeRing.style.opacity = '0.85';
        }
        if (frameDocument.documentElement) {
            frameDocument.documentElement.style.background = 'transparent';
            frameDocument.documentElement.style.userSelect = 'none';
            frameDocument.documentElement.style.webkitUserSelect = 'none';
            frameDocument.documentElement.style.webkitTouchCallout = 'none';
        }
        if (frameDocument.body) {
            frameDocument.body.style.background = 'transparent';
            frameDocument.body.style.margin = '0';
            frameDocument.body.style.userSelect = 'none';
            frameDocument.body.style.webkitUserSelect = 'none';
            frameDocument.body.style.webkitTouchCallout = 'none';
        }
        clockFrameLoaded = true;
        hideClockError();
    } catch (error) {
        console.warn('時計iframeの表示調整に失敗しました:', error);
        showClockError();
    }
}
function showClock(event) {
    if (!clockModal) return;
    clockModal.classList.add('is-active');
    clockModal.setAttribute('aria-hidden', 'false');
    if (clockButton) {
        clockButton.classList.add('active');
        clockButton.setAttribute('aria-expanded', 'true');
    }
    clockTouchActive = Boolean(
        event && event.pointerType === 'touch'
    );
    clockLastTouchY = null;
    if (clockFrameLoaded) {
        adjustClock();
    }
}
function hideClock() {
    if (!clockModal) return;
    clockModal.classList.remove('is-active');
    clockModal.setAttribute('aria-hidden', 'true');
    if (clockButton) {
        clockButton.classList.remove('active');
        clockButton.setAttribute('aria-expanded', 'false');
    }
    clockTouchActive = false;
    clockLastTouchY = null;
}
if (clockFrame) {
    clockFrame.addEventListener('load', () => {
        clockFrameLoaded = true;
        hideClockError();
        adjustClock();
    });
    clockFrame.addEventListener('error', () => {
        clockFrameLoaded = false;
        showClockError();
    });
}
if (clockButton && clockModal) {
    setupLongPress(clockButton, {
        endOnPointerLeave: false,
        onStart: event => {
            showClock(event);
        },
        onEnd: () => {
            hideClock();
        },
        /*
         * iPhoneの縦スクロールに伴うpointercancelでは閉じない。
         * 指を離した時はtouchendで閉じる。
         */
        onCancel: event => {
            if (!event || event.pointerType !== 'touch') {
                hideClock();
            }
        }
    });
    window.addEventListener('pointerup', event => {
        if (event.pointerType === 'touch') return;
        if (clockModal.classList.contains('is-active')) {
            hideClock();
        }
    });
    window.addEventListener('pointercancel', event => {
        if (event.pointerType === 'touch') return;
        if (clockModal.classList.contains('is-active')) {
            hideClock();
        }
    });
    /*
     * 時計表示中は指の縦移動をページスクロールに反映する。
     */
    window.addEventListener('touchstart', event => {
        if (!clockModal.classList.contains('is-active')) return;
        if (!event.touches || event.touches.length !== 1) {
            clockLastTouchY = null;
            return;
        }
        const currentY = event.touches[0].clientY;
        clockLastTouchY = Number.isFinite(currentY)
            ? currentY
            : null;
    }, {
        passive: true,
        capture: true
    });
    window.addEventListener('touchmove', event => {
        if (!clockModal.classList.contains('is-active')) return;
        if (!event.touches || event.touches.length !== 1) {
            clockLastTouchY = null;
            return;
        }
        const currentY = event.touches[0].clientY;
        if (
            !Number.isFinite(currentY) ||
            !Number.isFinite(clockLastTouchY)
        ) {
            clockLastTouchY = currentY;
            return;
        }
        const deltaY = clockLastTouchY - currentY;
        if (deltaY !== 0) {
            event.preventDefault();
            window.scrollBy(0, deltaY);
        }
        clockLastTouchY = currentY;
    }, {
        passive: false,
        capture: true
    });
    /*
     * 指を離した時に時計を閉じる。
     * タッチ移動中のpointercancelでは閉じない。
     */
    document.addEventListener('touchend', () => {
        if (clockModal.classList.contains('is-active')) {
            hideClock();
        }
        clockLastTouchY = null;
        clockTouchActive = false;
    }, {
        passive: true
    });
    document.addEventListener('touchcancel', () => {
        clockLastTouchY = null;
    }, {
        passive: true
    });
    document.addEventListener('keydown', event => {
        if (
            event.key === 'Escape' &&
            clockModal.classList.contains('is-active')
        ) {
            hideClock();
        }
    });
}