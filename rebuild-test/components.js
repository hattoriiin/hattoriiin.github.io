/*
 * 担当医表・診療時間時計の表示制御
 * 長押し操作は500ミリ秒で開始します。
 * 読み込み失敗時はエラーを表示し、未取得の表は表示しません。
 */

function showElement(element) {
    if (element) element.hidden = false;
}

function hideElement(element) {
    if (element) element.hidden = true;
}


/* ==================================================
   担当医表のオーバーレイ
================================================== */

const scheduleContainer =
    document.getElementById("schedule-container");

const doctorsButton =
    document.getElementById("toggle-doctors-btn");

const doctorsStatus =
    document.getElementById("doctors-status");

const baseScheduleTable =
    scheduleContainer
        ? scheduleContainer.querySelector("table.table-schedule-base")
        : null;

let doctorsOverlayTable = null;
let doctorsDataReady = false;


/**
 * オーバーレイ表の寸法を元の診療時間表に合わせます。
 * 元の表を通常の文書フローに残し、表示切替で下の要素が
 * 上下に動くことを防ぎます。
 */
function syncDoctorsOverlaySize() {
    if (!scheduleContainer || !baseScheduleTable || !doctorsOverlayTable) {
        return;
    }

    const baseRect = baseScheduleTable.getBoundingClientRect();

    doctorsOverlayTable.style.width = `${baseRect.width}px`;
    doctorsOverlayTable.style.height = `${baseRect.height}px`;
}


/**
 * 表示切替時も診療時間表の領域を確保します。
 */
function lockScheduleContainerHeight() {
    if (!scheduleContainer || !baseScheduleTable) {
        return;
    }

    const height = baseScheduleTable.getBoundingClientRect().height;

    if (Number.isFinite(height) && height > 0) {
        scheduleContainer.style.height = `${height}px`;
    }

    syncDoctorsOverlaySize();
}

lockScheduleContainerHeight();

window.addEventListener("resize", function () {
    lockScheduleContainerHeight();
});


/**
 * 担当医表の状態メッセージを設定します。
 *
 * @param {string} message - 表示するメッセージ
 * @param {boolean} isError - エラー表示にするか
 */
function setDoctorsStatus(message, isError = false) {
    if (!doctorsStatus) return;

    doctorsStatus.textContent = message || "";
    doctorsStatus.classList.toggle("schedule-error", isError);
}


/**
 * HTML文字列に含まれる特殊文字をエスケープします。
 * 外部データをHTMLに組み込む際のXSS対策です。
 *
 * @param {*} value - エスケープ対象
 * @returns {string} エスケープ済み文字列
 */
function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/**
 * 担当医名を縦書き風の文字列として生成します。
 *
 * @param {string} name - 担当医名
 * @returns {string} 表示用HTML
 */
function createDoctorName(name) {
    if (!name || !String(name).trim()) {
        return '<span class="doctor-empty">―</span>';
    }

    const cleanName = String(name).replace(/先生$/, "").trim();

    if (!cleanName) {
        return '<span class="doctor-empty">―</span>';
    }

    let className = "doctor-name";

    if (cleanName.length >= 6) {
        className += " very-long";
    } else if (cleanName.length >= 4) {
        className += " long";
    }

    const chars = [...cleanName]
        .map((char) => {
            return `<span class="doctor-char">${escapeHtml(char)}</span>`;
        })
        .join("");

    return `<span class="${className}">${chars}</span>`;
}


/**
 * 担当医データ取得時のエラーメッセージを生成します。
 *
 * @param {Error} error - 発生したエラー
 * @returns {string} 利用者向けメッセージ
 */
function createFetchErrorMessage(error) {
    if (error && error.name === "AbortError") {
        return "担当医表の読み込みが時間切れになりました。通信状態を確認してください。";
    }

    return "担当医表を読み込めませんでした。時間をおいて、もう一度お試しください。";
}


/**
 * タイムアウト付きでファイルを取得します。
 *
 * @param {string} url - 取得先URL
 * @param {RequestInit} options - fetchオプション
 * @param {number} timeout - タイムアウト時間（ミリ秒）
 * @returns {Promise<Response>} 取得したレスポンス
 */
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(function () {
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


/**
 * doctors.html と doctors.json を読み込み、
 * 元の診療時間表に重ねる担当医表を作成します。
 */
async function loadDoctorsTable() {
    if (!scheduleContainer || !doctorsButton) {
        return;
    }

    doctorsButton.disabled = true;
    setDoctorsStatus("担当医表を読み込んでいます。");

    try {
        const [htmlResponse, jsonResponse] = await Promise.all([
            fetchWithTimeout("/doctors.html"),
            fetchWithTimeout("/doctors.json")
        ]);

        const [htmlText, doctors] = await Promise.all([
            htmlResponse.text(),
            jsonResponse.json()
        ]);

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        const sourceTable = doc.querySelector("table");

        if (!sourceTable) {
            throw new Error("doctors.html 内にtableがありません");
        }

        const overlayTable = sourceTable.cloneNode(true);

        overlayTable.id = "doctors-overlay-table";
        overlayTable.classList.add("schedule", "table-overlay");

        overlayTable.querySelectorAll("td[data-time]").forEach((cell) => {
            const day = cell.dataset.day;
            const time = cell.dataset.time;
            const name = doctors?.[day]?.[time] || "";

            cell.innerHTML = createDoctorName(name);
        });

        overlayTable.querySelectorAll("td[data-visit]").forEach((cell) => {
            const day = cell.dataset.day;
            const name = doctors?.[day]?.["訪問"] || "";

            cell.innerHTML = createDoctorName(name);
        });

        const oldTable =
            scheduleContainer.querySelector("#doctors-overlay-table");

        if (oldTable) {
            oldTable.remove();
        }

        scheduleContainer.appendChild(overlayTable);

        doctorsOverlayTable = overlayTable;
        doctorsDataReady = true;

        syncDoctorsOverlaySize();

        doctorsButton.disabled = false;

        setDoctorsStatus(
            "ボタンを押している間、担当医表を表示します。"
        );
    } catch (error) {
        console.error("担当医表データ読み込みエラー:", error);

        doctorsDataReady = false;
        doctorsButton.disabled = true;

        setDoctorsStatus(createFetchErrorMessage(error), true);
    }
}


/**
 * 担当医表を表示・非表示にします。
 *
 * @param {boolean} isVisible - 表示する場合はtrue
 */
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

    scheduleContainer.classList.toggle("is-active", isVisible);
    doctorsButton.classList.toggle("active", isVisible);

    doctorsButton.setAttribute("aria-pressed", String(isVisible));
}


/* ==================================================
   共通の長押し処理
================================================== */

/**
 * Pointer Eventsを使って長押しを検出します。
 * タッチ操作で長押し前に指が動いた場合はキャンセルします。
 *
 * @param {HTMLElement} button - 操作対象
 * @param {Object} options - 開始・終了・キャンセル時の処理
 * @param {Function} options.onStart - 長押し成立時
 * @param {Function} options.onEnd - 指を離した時
 * @param {Function} options.onCancel - 操作キャンセル時
 * @param {boolean} options.endOnPointerLeave - マウスが離れた時に終了するか
 * @param {number} options.delay - 長押し判定時間（ミリ秒）
 */
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

    function finish(event, kind = "end") {
        clearTimer();

        if (pointerId === null) return;

        pointerId = null;

        if (active) {
            active = false;

            if (kind === "cancel") {
                if (typeof onCancel === "function") {
                    onCancel(event);
                }
            } else if (typeof onEnd === "function") {
                onEnd(event);
            }
        }
    }

    function start(event) {
        if (pointerId !== null || event.button === 2) {
            return;
        }

        pointerId = event.pointerId;

        startX = event.clientX;
        startY = event.clientY;

        clearTimer();

        timer = window.setTimeout(function () {
            timer = null;

            if (pointerId === event.pointerId) {
                active = true;

                if (typeof onStart === "function") {
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

        if (event.pointerType === "touch") {
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;

            if (Math.hypot(dx, dy) > 8) {
                finish(event, "cancel");
            }
        }
    }

    function end(event) {
        finish(event, "end");
    }

    function cancel(event) {
        finish(event, "cancel");
    }

    button.addEventListener("pointerdown", start);
    button.addEventListener("pointermove", move);
    button.addEventListener("pointerup", end);
    button.addEventListener("pointercancel", cancel);
    button.addEventListener("lostpointercapture", cancel);

    if (endOnPointerLeave) {
        button.addEventListener("pointerleave", function (event) {
            if (event.pointerType === "mouse") {
                finish(event, "end");
            }
        });
    }

    window.addEventListener("blur", function () {
        finish(null, "cancel");
    });
}


/* 担当医ボタン：押している間だけ担当医表を重ねます。 */
if (doctorsButton) {
    setupLongPress(doctorsButton, {
        onStart: function () {
            setDoctorsOverlayVisible(true);
        },
        onEnd: function () {
            setDoctorsOverlayVisible(false);
        },
        onCancel: function () {
            setDoctorsOverlayVisible(false);
        }
    });
}

loadDoctorsTable();


/* ==================================================
   診療時間時計
================================================== */

const clockButton = document.getElementById("clockBtn");
const clockModal = document.getElementById("clockModal");

const clockFrame = clockModal
    ? clockModal.querySelector("iframe")
    : null;

const clockError = document.getElementById("clock-error");

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


/**
 * 同一サイト内の時計iframeの表示を調整します。
 * iframe内にアクセスできない場合はエラーを記録します。
 */
function adjustClock() {
    if (!clockFrame) return;

    try {
        const frameDocument = clockFrame.contentDocument;

        if (!frameDocument) {
            throw new Error(
                "時計iframeのdocumentを取得できません"
            );
        }

        const title = frameDocument.querySelector(".clock-title");

        if (title) {
            title.style.display = "none";
        }

        const timeRing = frameDocument.querySelector(".time-ring");

        if (timeRing) {
            timeRing.style.opacity = "0.85";
        }

        if (frameDocument.documentElement) {
            frameDocument.documentElement.style.background = "transparent";
            frameDocument.documentElement.style.userSelect = "none";
            frameDocument.documentElement.style.webkitUserSelect = "none";
            frameDocument.documentElement.style.webkitTouchCallout = "none";
        }

        if (frameDocument.body) {
            frameDocument.body.style.background = "transparent";
            frameDocument.body.style.margin = "0";
            frameDocument.body.style.userSelect = "none";
            frameDocument.body.style.webkitUserSelect = "none";
            frameDocument.body.style.webkitTouchCallout = "none";
        }

        clockFrameLoaded = true;
        hideClockError();
    } catch (error) {
        console.warn(
            "時計iframeの表示調整に失敗しました:",
            error
        );

        showClockError();
    }
}


/**
 * 時計を表示します。
 *
 * @param {PointerEvent|Event} event - 操作イベント
 */
function showClock(event) {
    if (!clockModal) return;

    clockModal.classList.add("is-active");
    clockModal.setAttribute("aria-hidden", "false");

    if (clockButton) {
        clockButton.classList.add("active");
        clockButton.setAttribute("aria-expanded", "true");
    }

    clockLastTouchY = null;

    clockTouchActive = Boolean(
        event && event.pointerType === "touch"
    );

    if (clockFrameLoaded) {
        adjustClock();
    }
}


/**
 * 時計を閉じます。
 *
 * @param {Event|null} event - 操作イベント
 */
function hideClock(event) {
    if (!clockModal) return;

    clockModal.classList.remove("is-active");
    clockModal.setAttribute("aria-hidden", "true");

    if (clockButton) {
        clockButton.classList.remove("active");
        clockButton.setAttribute("aria-expanded", "false");
    }

    clockTouchActive = false;
    clockLastTouchY = null;
}


/* 時計iframeの読み込み状態を監視します。 */
if (clockFrame) {
    clockFrame.addEventListener("load", function () {
        clockFrameLoaded = true;
        clockFrameFailed = false;

        hideClockError();
        adjustClock();
    });

    clockFrame.addEventListener("error", function (error) {
        console.error("時計iframeの読み込みエラー:", error);

        clockFrameLoaded = false;
        showClockError();
    });

    window.setTimeout(function () {
        if (
            !clockFrameLoaded &&
            clockModal &&
            clockModal.classList.contains("is-active")
        ) {
            showClockError();
        }
    }, 12000);
}


/* ==================================================
   時計の長押しとページスクロール
================================================== */

if (clockButton && clockModal) {
    setupLongPress(clockButton, {
        endOnPointerLeave: false,

        onStart: function (event) {
            showClock(event);
        },

        onEnd: function (event) {
            hideClock(event);
        },

        onCancel: function (event) {
            hideClock(event);
        }
    });


    /* マウス操作では、ボタン外で離しても時計を閉じます。 */
    window.addEventListener("pointerup", function (event) {
        if (event.pointerType === "touch") return;

        if (clockModal.classList.contains("is-active")) {
            hideClock(event);
        }
    });

    window.addEventListener("pointercancel", function (event) {
        if (event.pointerType === "touch") return;

        if (clockModal.classList.contains("is-active")) {
            hideClock(event);
        }
    });


    /* 時計表示中に始まった指の位置を記録します。 */
    window.addEventListener(
        "touchstart",
        function (event) {
            if (
                !clockModal ||
                !clockModal.classList.contains("is-active")
            ) {
                return;
            }

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
        },
        {
            passive: true,
            capture: true
        }
    );


    /**
     * 時計表示中、指を上へ動かした距離だけページをスクロールします。
     * preventDefaultを使うため、passive:falseを指定します。
     */
    function handleClockTouchMove(event) {
        if (
            !clockModal ||
            !clockModal.classList.contains("is-active")
        ) {
            return;
        }

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

    window.addEventListener(
        "touchmove",
        handleClockTouchMove,
        {
            passive: false,
            capture: true
        }
    );


    /* 指を離した時は時計を閉じます。 */
    document.addEventListener(
        "touchend",
        function (event) {
            if (
                clockModal &&
                clockModal.classList.contains("is-active")
            ) {
                hideClock(event);
            }

            clockLastTouchY = null;
            clockTouchActive = false;
        },
        {
            passive: true
        }
    );

    document.addEventListener(
        "touchcancel",
        function () {
            clockLastTouchY = null;
        },
        {
            passive: true
        }
    );


    /* Escapeキーでも時計を閉じられるようにします。 */
    document.addEventListener("keydown", function (event) {
        if (
            event.key === "Escape" &&
            clockModal.classList.contains("is-active")
        ) {
            hideClock(event);
        }
    });
}