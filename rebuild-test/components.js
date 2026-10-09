/* ==================================================
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


function syncDoctorsOverlaySize() {
    if (!baseScheduleTable || !doctorsOverlayTable) return;

    const rect = baseScheduleTable.getBoundingClientRect();

    if (Number.isFinite(rect.width) && rect.width > 0) {
        doctorsOverlayTable.style.width = `${rect.width}px`;
    }

    if (Number.isFinite(rect.height) && rect.height > 0) {
        doctorsOverlayTable.style.height = `${rect.height}px`;
    }
}


function lockScheduleContainerHeight() {
    if (!scheduleContainer || !baseScheduleTable) return;

    const height = baseScheduleTable.getBoundingClientRect().height;

    if (Number.isFinite(height) && height > 0) {
        scheduleContainer.style.height = `${height}px`;
    }

    syncDoctorsOverlaySize();
}


lockScheduleContainerHeight();

window.addEventListener('resize', function() {
    lockScheduleContainerHeight();
});


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


function createFetchErrorMessage(error) {
    if (error && error.name === 'AbortError') {
        return '担当医表の読み込みが時間切れになりました。通信状態を確認してください。';
    }

    return '担当医表を読み込めませんでした。時間をおいて、もう一度お試しください。';
}


async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(function() {
        controller.abort();
    }, timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(
                `${url} の読み込みに失敗しました（${response.status}）`
            );
        }

        return response;
    } finally {
        window.clearTimeout(timeoutId);
    }
}


async function loadDoctorsTable() {
    if (!scheduleContainer || !doctorsButton) return;

    doctorsButton.disabled = true;
    setDoctorsStatus('担当医表を読み込んでいます。');

    try {
        const [htmlResponse, jsonResponse] = await Promise.all([
            fetchWithTimeout('/doctors.html'),
            fetchWithTimeout('/doctors.json')
        ]);

        const [htmlText, doctors] = await Promise.all([
            htmlResponse.text(),
            jsonResponse.json()
        ]);

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const sourceTable = doc.querySelector('table');

        if (!sourceTable) {
            throw new Error('doctors.html 内にtableがありません');
        }

        const overlayTable = sourceTable.cloneNode(true);

        overlayTable.id = 'doctors-overlay-table';
        overlayTable.classList.add('schedule', 'table-overlay');

        overlayTable.querySelectorAll('td[data-time]').forEach(cell => {
            const day = cell.dataset.day;
            const time = cell.dataset.time;
            const name = doctors?.[day]?.[time] || '';

            cell.innerHTML = createDoctorName(name);
        });

        overlayTable.querySelectorAll('td[data-visit]').forEach(cell => {
            const day = cell.dataset.day;
            const name = doctors?.[day]?.['訪問'] || '';

            cell.innerHTML = createDoctorName(name);
        });

        const oldTable = scheduleContainer.querySelector(
            '#doctors-overlay-table'
        );

        if (oldTable) oldTable.remove();

        scheduleContainer.appendChild(overlayTable);

        doctorsOverlayTable = overlayTable;
        doctorsDataReady = true;

        syncDoctorsOverlaySize();

        doctorsButton.disabled = false;

        setDoctorsStatus(
            'ボタンを押している間、担当医表を表示します。'
        );
    } catch (error) {
        console.error('担当医表データ読み込みエラー:', error);

        doctorsDataReady = false;
        doctorsButton.disabled = true;

        setDoctorsStatus(createFetchErrorMessage(error), true);
    }
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

        if (active) {
            active = false;

            if (kind === 'cancel') {
                if (typeof onCancel === 'function') {
                    onCancel(event);
                }
            } else if (typeof onEnd === 'function') {
                onEnd(event);
            }
        }
    }

    function start(event) {
        if (pointerId !== null || event.button === 2) return;

        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;

        clearTimer();

        timer = window.setTimeout(function() {
            timer = null;

            if (pointerId === event.pointerId) {
                active = true;

                if (typeof onStart === 'function') {
                    onStart(event);
                }
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
        button.addEventListener('pointerleave', function(event) {
            if (event.pointerType === 'mouse') {
                finish(event, 'end');
            }
        });
    }

    window.addEventListener('blur', function() {
        finish(null, 'cancel');
    });
}


/* 担当医ボタン：押している間だけ表示 */
if (doctorsButton) {
    setupLongPress(doctorsButton, {
        onStart: function() {
            setDoctorsOverlayVisible(true);
        },
        onEnd: function() {
            setDoctorsOverlayVisible(false);
        },
        onCancel: function() {
            setDoctorsOverlayVisible(false);
        }
    });
}

loadDoctorsTable();


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
let clockFrameFailed = false;
let clockTouchActive = false;
let clockLastTouchY = null;


function showClockError() {
    clockFrameFailed = true;
    showElement(clockError);
}


function hideClockError() {
    clockFrameFailed = false;
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

    clockLastTouchY = null;
    clockTouchActive = Boolean(event && event.pointerType === 'touch');

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
    clockFrame.addEventListener('load', function() {
        clockFrameLoaded = true;
        clockFrameFailed = false;
        hideClockError();
        adjustClock();
    });

    clockFrame.addEventListener('error', function(error) {
        console.error('時計iframeの読み込みエラー:', error);
        clockFrameLoaded = false;
        showClockError();
    });

    window.setTimeout(function() {
        if (
            !clockFrameLoaded &&
            clockModal &&
            clockModal.classList.contains('is-active')
        ) {
            showClockError();
        }
    }, 12000);
}


if (clockButton && clockModal) {
    setupLongPress(clockButton, {
        endOnPointerLeave: false,

        onStart: function(event) {
            showClock(event);
        },

        onEnd: function(event) {
            hideClock(event);
        },

        onCancel: function(event) {
            hideClock(event);
        }
    });

    window.addEventListener('pointerup', function(event) {
        if (event.pointerType === 'touch') return;

        if (clockModal.classList.contains('is-active')) {
            hideClock(event);
        }
    });

    window.addEventListener('pointercancel', function(event) {
        if (event.pointerType === 'touch') return;

        if (clockModal.classList.contains('is-active')) {
            hideClock(event);
        }
    });

    /*
     * 時計表示中のタッチ位置を記録。
     * 指の移動量をページの縦スクロールへ反映する。
     */
    window.addEventListener('touchstart', function(event) {
        if (!clockModal.classList.contains('is-active')) return;

        if (!event.touches || event.touches.length !== 1) {
            clockLastTouchY = null;
            return;
        }

        const currentY = event.touches[0].clientY;

        if (!Number.isFinite(currentY)) {
            clockLastTouchY = null;
            return;
        }

        clockLastTouchY = currentY;
    }, {
        passive: true,
        capture: true
    });


    function handleClockTouchMove(event) {
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
    }


    window.addEventListener('touchmove', handleClockTouchMove, {
        passive: false,
        capture: true
    });

    document.addEventListener('touchend', function(event) {
        if (clockModal.classList.contains('is-active')) {
            hideClock(event);
        }

        clockLastTouchY = null;
        clockTouchActive = false;
    }, {
        passive: true
    });

    document.addEventListener('touchcancel', function() {
        clockLastTouchY = null;
    }, {
        passive: true
    });

    document.addEventListener('keydown', function(event) {
        if (
            event.key === 'Escape' &&
            clockModal.classList.contains('is-active')
        ) {
            hideClock(event);
        }
    });
}