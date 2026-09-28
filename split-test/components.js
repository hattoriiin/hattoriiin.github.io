/* ==================================================
   院内写真スクロール
================================================== */

const camera =
    document.querySelector('.clinic-camera');

const image =
    document.querySelector('.clinic-image');


if (camera && image) {

    let scrollTicking = false;


    function updateClinicImage() {

        const rect =
            camera.getBoundingClientRect();

        const viewHeight =
            window.innerHeight;


        if (
            rect.top <= viewHeight &&
            rect.bottom >= 0
        ) {

            const progress =
                (viewHeight - rect.top) /
                (viewHeight + rect.height);


            const clamped =
                Math.max(
                    0,
                    Math.min(1, progress)
                );


            const translateX =
                -50 +
                (clamped - .5) * 30;


            const scale =
                .85 +
                clamped * .15;


            image.style.transform =
                `translate3d(
                    ${translateX}%,
                    -50%,
                    0
                ) scale(${scale})`;
        }


        scrollTicking = false;
    }


    window.addEventListener(
        'scroll',
        function () {

            if (scrollTicking) {
                return;
            }


            scrollTicking = true;


            window.requestAnimationFrame(
                updateClinicImage
            );

        },
        {
            passive: true
        }
    );

}


/* ==================================================
   担当医表
================================================== */

const scheduleContainer =
    document.getElementById(
        "schedule-container"
    );


const doctorsButton =
    document.getElementById(
        "toggle-doctors-btn"
    );


const doctorsStatus =
    document.getElementById(
        "doctors-status"
    );


const baseScheduleTable =
    scheduleContainer
        ? scheduleContainer.querySelector(
            "table.table-schedule-base"
        )
        : null;


let doctorsOverlayTable = null;

let doctorsDataReady = false;


/* ==================================================
   担当医表サイズ同期
================================================== */

function syncDoctorsOverlaySize() {

    if (
        !baseScheduleTable ||
        !doctorsOverlayTable
    ) {
        return;
    }


    const rect =
        baseScheduleTable.getBoundingClientRect();


    if (
        Number.isFinite(rect.width) &&
        rect.width > 0
    ) {

        doctorsOverlayTable.style.width =
            `${rect.width}px`;
    }


    if (
        Number.isFinite(rect.height) &&
        rect.height > 0
    ) {

        doctorsOverlayTable.style.height =
            `${rect.height}px`;
    }

}


/* ==================================================
   診療時間表の高さ固定
================================================== */

function lockScheduleContainerHeight() {

    if (
        !scheduleContainer ||
        !baseScheduleTable
    ) {
        return;
    }


    const height =
        baseScheduleTable.getBoundingClientRect()
            .height;


    if (
        Number.isFinite(height) &&
        height > 0
    ) {

        /*
         * 担当医表をabsolute配置しても、
         * 元の診療時間表の高さを維持するため。
         * これにより下の「担当医はこちら」等が
         * 上へ詰まることを防ぐ。
         */
        scheduleContainer.style.height =
            `${height}px`;
    }


    syncDoctorsOverlaySize();
}


lockScheduleContainerHeight();


window.addEventListener(
    "resize",
    function () {
        lockScheduleContainerHeight();
    }
);


/* ==================================================
   担当医ステータス
================================================== */

function setDoctorsStatus(
    message,
    isError = false
) {

    if (!doctorsStatus) {
        return;
    }


    doctorsStatus.textContent =
        message || "";


    doctorsStatus.classList.toggle(
        "schedule-error",
        isError
    );
}


/* ==================================================
   HTMLエスケープ
================================================== */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==================================================
   担当医名生成
================================================== */

function createDoctorName(name) {

    if (
        !name ||
        !String(name).trim()
    ) {

        return `
            <span class="doctor-empty">
                ―
            </span>
        `;
    }


    const cleanName =
        String(name)
            .replace(/先生$/, "")
            .trim();


    if (!cleanName) {

        return `
            <span class="doctor-empty">
                ―
            </span>
        `;
    }


    let className =
        "doctor-name";


    if (cleanName.length >= 6) {

        className +=
            " very-long";

    } else if (cleanName.length >= 4) {

        className +=
            " long";
    }


    const chars =
        [...cleanName]
            .map(
                function (char) {

                    return `
                        <span class="doctor-char">
                            ${escapeHtml(char)}
                        </span>
                    `;
                }
            )
            .join("");


    return `
        <span class="${className}">
            ${chars}
        </span>
    `;
}


/* ==================================================
   担当医表エラー
================================================== */

function createFetchErrorMessage(error) {

    if (
        error &&
        error.name === "AbortError"
    ) {

        return (
            "担当医表の読み込みが時間切れになりました。" +
            "通信状態を確認してください。"
        );
    }


    return (
        "担当医表を読み込めませんでした。" +
        "時間をおいて、もう一度お試しください。"
    );
}


/* ==================================================
   fetchタイムアウト
================================================== */

async function fetchWithTimeout(
    url,
    options = {},
    timeout = 10000
) {

    const controller =
        new AbortController();


    const timeoutId =
        window.setTimeout(
            function () {
                controller.abort();
            },
            timeout
        );


    try {

        const response =
            await fetch(
                url,
                {
                    ...options,
                    signal:
                        controller.signal
                }
            );


        if (!response.ok) {

            throw new Error(
                `${url} の読み込みに失敗しました（${response.status}）`
            );
        }


        return response;

    } finally {

        window.clearTimeout(
            timeoutId
        );
    }
}


/* ==================================================
   担当医表読み込み
================================================== */

async function loadDoctorsTable() {

    if (
        !scheduleContainer ||
        !doctorsButton
    ) {
        return;
    }


    doctorsButton.disabled = true;


    setDoctorsStatus(
        "担当医表を読み込んでいます。"
    );


    try {

        /*
         * HTMLとJSONを同時に取得することで、
         * 片方だけ先に待つ必要をなくす。
         */
        const [
            htmlResponse,
            jsonResponse
        ] = await Promise.all([

            fetchWithTimeout(
                "doctors.html"
            ),

            fetchWithTimeout(
                "doctors.json"
            )

        ]);


        const [
            htmlText,
            doctors
        ] = await Promise.all([

            htmlResponse.text(),

            jsonResponse.json()

        ]);


        const parser =
            new DOMParser();


        const doc =
            parser.parseFromString(
                htmlText,
                "text/html"
            );


        const sourceTable =
            doc.querySelector("table");


        if (!sourceTable) {

            throw new Error(
                "doctors.html 内にtableがありません"
            );
        }


        const overlayTable =
            sourceTable.cloneNode(true);


        overlayTable.id =
            "doctors-overlay-table";


        overlayTable.classList.add(
            "schedule",
            "table-overlay"
        );


        /*
         * data-timeを持つセルへ、
         * doctors.jsonの担当医名を安全に挿入する。
         */
        overlayTable
            .querySelectorAll(
                "td[data-time]"
            )
            .forEach(
                function (cell) {

                    const day =
                        cell.dataset.day;


                    const time =
                        cell.dataset.time;


                    const name =
                        doctors?.[day]?.[time] ||
                        "";


                    cell.innerHTML =
                        createDoctorName(
                            name
                        );
                }
            );


        /*
         * 訪問診療の担当医も同じ仕組みで表示する。
         */
        overlayTable
            .querySelectorAll(
                "td[data-visit]"
            )
            .forEach(
                function (cell) {

                    const day =
                        cell.dataset.day;


                    const name =
                        doctors?.[day]?.["訪問"] ||
                        "";


                    cell.innerHTML =
                        createDoctorName(
                            name
                        );
                }
            );


        const oldTable =
            scheduleContainer.querySelector(
                "#doctors-overlay-table"
            );


        if (oldTable) {
            oldTable.remove();
        }


        scheduleContainer.appendChild(
            overlayTable
        );


        doctorsOverlayTable =
            overlayTable;


        doctorsDataReady = true;


        syncDoctorsOverlaySize();


        doctorsButton.disabled = false;


        setDoctorsStatus(
            "ボタンを押している間、担当医表を表示します。"
        );


    } catch (error) {

        console.error(
            "担当医表データ読み込みエラー:",
            error
        );


        doctorsDataReady = false;


        doctorsButton.disabled = true;


        setDoctorsStatus(
            createFetchErrorMessage(
                error
            ),
            true
        );
    }
}


/* ==================================================
   担当医表表示切替
================================================== */

function setDoctorsOverlayVisible(
    isVisible
) {

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


    scheduleContainer.classList.toggle(
        "is-active",
        isVisible
    );


    doctorsButton.classList.toggle(
        "active",
        isVisible
    );


    doctorsButton.setAttribute(
        "aria-pressed",
        String(isVisible)
    );
}


/* ==================================================
   長押し処理
================================================== */

function setupLongPress(
    button,
    {
        onStart,
        onEnd,
        onCancel,
        endOnPointerLeave = true
    } = {}
) {

    if (!button) {
        return;
    }


    let activePointerId = null;

    let isActive = false;


    function start(event) {

        if (
            activePointerId !== null ||
            event.button === 2
        ) {
            return;
        }


        activePointerId =
            event.pointerId;


        isActive = true;


        if (
            typeof onStart ===
            "function"
        ) {

            onStart(event);
        }


        /*
         * マウス操作ではPointer Captureを使うことで、
         * ボタンから少し外れても長押し状態を維持する。
         */
        if (
            event.pointerType === "mouse" &&
            button.setPointerCapture
        ) {

            try {

                button.setPointerCapture(
                    event.pointerId
                );

            } catch (error) {

                console.debug(
                    "Pointer Captureを設定できませんでした:",
                    error
                );
            }
        }
    }


    function end(event) {

        if (
            activePointerId === null ||
            (
                event &&
                event.pointerId !==
                    activePointerId
            )
        ) {
            return;
        }


        activePointerId = null;


        if (isActive) {

            isActive = false;


            if (
                typeof onEnd ===
                "function"
            ) {

                onEnd(event);
            }
        }
    }


    function endTouch() {

        if (
            activePointerId === null ||
            !isActive
        ) {
            return;
        }


        activePointerId = null;

        isActive = false;


        if (
            typeof onEnd ===
            "function"
        ) {

            onEnd({
                pointerType: "touch"
            });
        }
    }


    function cancel(event) {

        /*
         * touchはtouchend側で終了させる。
         * ここでcancel扱いにするとiPhoneで
         * 指を動かした際に意図せず終了するため。
         */
        if (
            event &&
            event.pointerType === "touch"
        ) {
            return;
        }


        if (
            activePointerId === null ||
            (
                event &&
                event.pointerId !==
                    activePointerId
            )
        ) {
            return;
        }


        activePointerId = null;


        if (isActive) {

            isActive = false;


            if (
                typeof onCancel ===
                "function"
            ) {

                onCancel(event);
            }
        }
    }


    button.addEventListener(
        "pointerdown",
        start
    );


    button.addEventListener(
        "pointerup",
        end
    );


    button.addEventListener(
        "pointercancel",
        cancel
    );


    button.addEventListener(
        "lostpointercapture",
        cancel
    );


    button.addEventListener(
        "touchend",
        endTouch,
        {
            passive: true
        }
    );


    if (endOnPointerLeave) {

        button.addEventListener(
            "pointerleave",
            function (event) {

                if (
                    event.pointerType ===
                        "mouse" &&
                    activePointerId !== null
                ) {

                    end(event);
                }
            }
        );
    }


    window.addEventListener(
        "blur",
        function (event) {

            if (
                activePointerId !== null &&
                isActive &&
                event &&
                event.type === "blur"
            ) {
                return;
            }


            cancel(event);
        }
    );
}


/* ==================================================
   担当医ボタン開始
================================================== */

if (doctorsButton) {

    setupLongPress(
        doctorsButton,
        {
            onStart: function () {

                setDoctorsOverlayVisible(
                    true
                );
            },

            onEnd: function () {

                setDoctorsOverlayVisible(
                    false
                );
            },

            onCancel: function () {

                setDoctorsOverlayVisible(
                    false
                );
            }
        }
    );
}


loadDoctorsTable();


/* ==================================================
   時計モーダル
================================================== */

const clockButton =
    document.getElementById(
        "clockBtn"
    );


const clockModal =
    document.getElementById(
        "clockModal"
    );


const clockFrame =
    clockModal
        ? clockModal.querySelector(
            "iframe"
        )
        : null;


const clockError =
    document.getElementById(
        "clock-error"
    );


let clockFrameLoaded = false;

let clockFrameFailed = false;

let clockTouchActive = false;

let clockLastTouchY = null;


/* ==================================================
   時計エラー表示
================================================== */

function showClockError() {

    clockFrameFailed = true;

    showElement(clockError);
}


function hideClockError() {

    clockFrameFailed = false;

    hideElement(clockError);
}


/* ==================================================
   時計iframe調整
================================================== */

function adjustClock() {

    if (!clockFrame) {
        return;
    }


    try {

        const frameDocument =
            clockFrame.contentDocument;


        if (!frameDocument) {

            throw new Error(
                "時計iframeのdocumentを取得できません"
            );
        }


        const title =
            frameDocument.querySelector(
                ".clock-title"
            );


        if (title) {

            title.style.display =
                "none";
        }


        const timeRing =
            frameDocument.querySelector(
                ".time-ring"
            );


        if (timeRing) {

            timeRing.style.opacity =
                "0.85";
        }


        if (
            frameDocument.documentElement
        ) {

            frameDocument
                .documentElement
                .style
                .background =
                    "transparent";


            frameDocument
                .documentElement
                .style
                .userSelect =
                    "none";


            frameDocument
                .documentElement
                .style
                .webkitUserSelect =
                    "none";


            frameDocument
                .documentElement
                .style
                .webkitTouchCallout =
                    "none";
        }


        if (frameDocument.body) {

            frameDocument.body.style.background =
                "transparent";


            frameDocument.body.style.margin =
                "0";


            frameDocument.body.style.userSelect =
                "none";


            frameDocument.body.style.webkitUserSelect =
                "none";


            frameDocument.body.style.webkitTouchCallout =
                "none";
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


/* ==================================================
   時計表示
================================================== */

function showClock(event) {

    if (!clockModal) {
        return;
    }


    clockModal.classList.add(
        "is-active"
    );


    clockModal.setAttribute(
        "aria-hidden",
        "false"
    );


    if (clockButton) {

        clockButton.classList.add(
            "active"
        );


        clockButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }


    clockLastTouchY = null;


    clockTouchActive =
        Boolean(
            event &&
            event.pointerType ===
                "touch"
        );


    if (clockFrameLoaded) {

        adjustClock();
    }
}


/* ==================================================
   時計非表示
================================================== */

function hideClock(event) {

    if (!clockModal) {
        return;
    }


    clockModal.classList.remove(
        "is-active"
    );


    clockModal.setAttribute(
        "aria-hidden",
        "true"
    );


    if (clockButton) {

        clockButton.classList.remove(
            "active"
        );


        clockButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }


    clockTouchActive = false;

    clockLastTouchY = null;
}


/* ==================================================
   時計表示中のタッチ移動
================================================== */

/**
 * 時計表示中の指の移動を監視する。
 *
 * ここではpreventDefault()を実行しない。
 * 目的は、時計を表示したまま指を上下へ動かしたときに、
 * 背後のページ本来の縦スクロールを止めないことだから。
 *
 * @param {TouchEvent} event - タッチ移動イベント
 * @returns {void}
 *
 * @example
 * window.addEventListener("touchmove", handleClockTouchMove);
 */
function handleClockTouchMove(event) {

    if (
        !clockModal ||
        !clockModal.classList.contains(
            "is-active"
        )
    ) {
        return;
    }


    /*
     * 2本指以上の場合は、
     * 単純な縦スクロール判定を行わない。
     * これにより複数指操作へ干渉しない。
     */
    if (
        !event.touches ||
        event.touches.length !== 1
    ) {

        clockLastTouchY = null;

        return;
    }


    const currentY =
        event.touches[0].clientY;


    if (
        !Number.isFinite(currentY)
    ) {

        clockLastTouchY = null;

        return;
    }


    /*
     * 前回位置だけ記録する。
     * preventDefault()を使わないことが重要。
     * これによってブラウザの通常スクロール処理を残す。
     */
    if (
        clockLastTouchY === null
    ) {

        clockLastTouchY =
            currentY;

        return;
    }


    const deltaY =
        currentY -
        clockLastTouchY;


    clockLastTouchY =
        currentY;


    /*
     * 現在はスクロール量をJavaScriptで
     * 強制変更しない。
     *
     * ブラウザ本来のスクロールへ任せることで、
     * iPhoneの慣性スクロールを壊さない。
     */
    if (Math.abs(deltaY) < 0.01) {
        return;
    }
}


/* ==================================================
   時計ボタン
================================================== */

if (
    clockButton &&
    clockModal
) {

    clockButton.addEventListener(
        "touchstart",
        function (event) {

            if (
                !event.touches ||
                event.touches.length !== 1
            ) {
                return;
            }


            showClock({
                pointerType: "touch"
            });

        },
        {
            passive: true
        }
    );


    document.addEventListener(
        "touchend",
        function (event) {

            if (
                clockModal.classList.contains(
                    "is-active"
                )
            ) {

                hideClock(event);
            }

        },
        {
            passive: true
        }
    );


    document.addEventListener(
        "touchcancel",
        function () {
            /* touchend側で終了状態を管理する */
        },
        {
            passive: true
        }
    );


    let clockMouseActive = false;


    clockButton.addEventListener(
        "mousedown",
        function (event) {

            if (
                event.button !== 0
            ) {
                return;
            }


            clockMouseActive = true;


            showClock({
                pointerType: "mouse"
            });
        }
    );


    document.addEventListener(
        "mouseup",
        function (event) {

            if (!clockMouseActive) {
                return;
            }


            clockMouseActive = false;


            hideClock(event);
        }
    );
}


/* ==================================================
   時計iframe読み込み
================================================== */

if (clockFrame) {

    clockFrame.addEventListener(
        "load",
        function () {

            clockFrameLoaded = true;

            clockFrameFailed = false;

            hideClockError();

            adjustClock();
        }
    );


    clockFrame.addEventListener(
        "error",
        function (error) {

            console.error(
                "時計iframeの読み込みエラー:",
                error
            );


            clockFrameLoaded = false;

            showClockError();
        }
    );


    window.setTimeout(
        function () {

            if (
                !clockFrameLoaded &&
                clockModal &&
                clockModal.classList.contains(
                    "is-active"
                )
            ) {

                showClockError();
            }

        },
        12000
    );
}


/* ==================================================
   時計長押し
================================================== */

if (
    clockButton &&
    clockModal
) {

    setupLongPress(
        clockButton,
        {
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
        }
    );


    window.addEventListener(
        "pointerup",
        function (event) {

            /*
             * touchはtouchend側で処理する。
             * mouse等だけここで終了させる。
             */
            if (
                event.pointerType ===
                    "touch"
            ) {
                return;
            }


            if (
                clockModal.classList.contains(
                    "is-active"
                )
            ) {

                hideClock(event);
            }
        }
    );


    window.addEventListener(
        "pointercancel",
        function (event) {

            if (
                event.pointerType ===
                    "touch"
            ) {
                return;
            }


            if (
                clockModal.classList.contains(
                    "is-active"
                )
            ) {

                hideClock(event);
            }
        }
    );


    /*
     * 時計表示中のタッチ開始位置を記録する。
     * 1本指の縦スクロールだけを追跡する。
     */
    window.addEventListener(
        "touchstart",
        function (event) {

            if (
                !clockModal ||
                !clockModal.classList.contains(
                    "is-active"
                )
            ) {
                return;
            }


            if (
                !event.touches ||
                event.touches.length !== 1
            ) {

                clockLastTouchY = null;

                return;
            }


            const currentY =
                event.touches[0].clientY;


            if (
                !Number.isFinite(
                    currentY
                )
            ) {

                clockLastTouchY = null;

                return;
            }


            clockLastTouchY =
                currentY;

        },
        {
            passive: true,
            capture: true
        }
    );


    /*
     * passive:falseにはしているが、
     * handleClockTouchMove内ではpreventDefault()
     * を実行しない。
     *
     * そのためページの通常スクロールは維持される。
     */
    window.addEventListener(
        "touchmove",
        handleClockTouchMove,
        {
            passive: false,
            capture: true
        }
    );


    document.addEventListener(
        "touchend",
        function (event) {

            if (
                clockModal &&
                clockModal.classList.contains(
                    "is-active"
                )
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


    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                clockModal &&
                clockModal.classList.contains(
                    "is-active"
                )
            ) {

                hideClock(event);
            }
        }
    );
}