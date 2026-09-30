/* ==================================================
   担当医表
================================================== */


/* ------------------------------------------
   要素取得
------------------------------------------ */

const scheduleContainer =
    document.getElementById(
        'schedule-container'
    );

const doctorsButton =
    document.getElementById(
        'toggle-doctors-btn'
    );

const doctorsStatus =
    document.getElementById(
        'doctors-status'
    );

const baseScheduleTable =
    scheduleContainer
        ? scheduleContainer.querySelector(
            'table.table-schedule-base'
        )
        : null;


/* ------------------------------------------
   状態
------------------------------------------ */

let doctorsOverlayTable = null;
let doctorsDataReady = false;


/* ------------------------------------------
   担当医表のサイズ調整
------------------------------------------ */

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


function lockScheduleContainerHeight() {

    if (
        !scheduleContainer ||
        !baseScheduleTable
    ) {
        return;
    }


    const height =
        baseScheduleTable
            .getBoundingClientRect()
            .height;


    if (
        Number.isFinite(height) &&
        height > 0
    ) {

        scheduleContainer.style.height =
            `${height}px`;

    }


    syncDoctorsOverlaySize();

}


lockScheduleContainerHeight();


window.addEventListener(
    'resize',
    function () {

        lockScheduleContainerHeight();

    }
);


/* ------------------------------------------
   状態メッセージ
------------------------------------------ */

function setDoctorsStatus(
    message,
    isError = false
) {

    if (!doctorsStatus) {
        return;
    }


    doctorsStatus.textContent =
        message || '';


    doctorsStatus.classList.toggle(
        'schedule-error',
        isError
    );

}


/* ------------------------------------------
   HTMLエスケープ
------------------------------------------ */

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}


/* ------------------------------------------
   医師名の表示
------------------------------------------ */

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
            .replace(
                /先生$/,
                ''
            )
            .trim();


    if (!cleanName) {

        return `
            <span class="doctor-empty">
                ―
            </span>
        `;

    }


    let className =
        'doctor-name';


    if (
        cleanName.length >= 6
    ) {

        className +=
            ' very-long';

    }
    else if (
        cleanName.length >= 4
    ) {

        className +=
            ' long';

    }


    const chars =
        [...cleanName]
            .map(
                char =>
                    `<span class="doctor-char">${escapeHtml(char)}</span>`
            )
            .join('');


    return `
        <span class="${className}">
            ${chars}
        </span>
    `;

}


/* ------------------------------------------
   読み込みエラーメッセージ
------------------------------------------ */

function createFetchErrorMessage(
    error
) {

    if (
        error &&
        error.name === 'AbortError'
    ) {

        return
            '担当医表の読み込みが時間切れになりました。通信状態を確認してください。';

    }


    return
        '担当医表を読み込めませんでした。時間をおいて、もう一度お試しください。';

}


/* ------------------------------------------
   fetch タイムアウト
------------------------------------------ */

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

    }
    finally {

        window.clearTimeout(
            timeoutId
        );

    }

}


/* ------------------------------------------
   担当医表を読み込む
------------------------------------------ */

async function loadDoctorsTable() {

    if (
        !scheduleContainer ||
        !doctorsButton
    ) {

        return;

    }


    doctorsButton.disabled =
        true;


    setDoctorsStatus(
        '担当医表を読み込んでいます。'
    );


    try {

        const [
            htmlResponse,
            jsonResponse
        ] =
            await Promise.all(
                [
                    fetchWithTimeout(
                        'doctors.html'
                    ),

                    fetchWithTimeout(
                        'doctors.json'
                    )
                ]
            );


        const [
            htmlText,
            doctors
        ] =
            await Promise.all(
                [
                    htmlResponse.text(),
                    jsonResponse.json()
                ]
            );


        const parser =
            new DOMParser();


        const doc =
            parser.parseFromString(
                htmlText,
                'text/html'
            );


        const sourceTable =
            doc.querySelector(
                'table'
            );


        if (!sourceTable) {

            throw new Error(
                'doctors.html 内にtableがありません'
            );

        }


        const overlayTable =
            sourceTable.cloneNode(
                true
            );


        overlayTable.id =
            'doctors-overlay-table';


        overlayTable.classList.add(
            'schedule',
            'table-overlay'
        );


        /* ------------------------------------------
           時間帯ごとの担当医
        ------------------------------------------ */

        overlayTable
            .querySelectorAll(
                'td[data-time]'
            )
            .forEach(
                function (cell) {

                    const day =
                        cell.dataset.day;


                    const time =
                        cell.dataset.time;


                    const name =
                        doctors?.[day]?.[time] ||
                        '';


                    cell.innerHTML =
                        createDoctorName(
                            name
                        );

                }
            );


        /* ------------------------------------------
           訪問診療の担当医
        ------------------------------------------ */

        overlayTable
            .querySelectorAll(
                'td[data-visit]'
            )
            .forEach(
                function (cell) {

                    const day =
                        cell.dataset.day;


                    const name =
                        doctors?.[day]?.['訪問'] ||
                        '';


                    cell.innerHTML =
                        createDoctorName(
                            name
                        );

                }
            );


        /* ------------------------------------------
           古い担当医表を削除
        ------------------------------------------ */

        const oldTable =
            scheduleContainer.querySelector(
                '#doctors-overlay-table'
            );


        if (oldTable) {

            oldTable.remove();

        }


        /* ------------------------------------------
           新しい担当医表を追加
        ------------------------------------------ */

        scheduleContainer.appendChild(
            overlayTable
        );


        doctorsOverlayTable =
            overlayTable;


        doctorsDataReady =
            true;


        syncDoctorsOverlaySize();


        doctorsButton.disabled =
            false;


        setDoctorsStatus(
            'ボタンを押している間、担当医表を表示します。'
        );

    }
    catch (error) {

        console.error(
            '担当医表データ読み込みエラー:',
            error
        );


        doctorsDataReady =
            false;


        doctorsButton.disabled =
            true;


        setDoctorsStatus(
            createFetchErrorMessage(
                error
            ),
            true
        );

    }

}


/* ------------------------------------------
   担当医表の表示・非表示
------------------------------------------ */

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
        'is-active',
        isVisible
    );


    doctorsButton.classList.toggle(
        'active',
        isVisible
    );


    doctorsButton.setAttribute(
        'aria-pressed',
        String(isVisible)
    );

}


/* ------------------------------------------
   担当医表の長押し
------------------------------------------ */

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


/* ------------------------------------------
   担当医表の読み込み開始
------------------------------------------ */

loadDoctorsTable();