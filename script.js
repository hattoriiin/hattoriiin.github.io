/*
 * ==================================================
 * 院内写真 横スクロール制御
 * ==================================================
 *
 * 院内写真を縦スクロール位置に応じて
 * 左右へ滑らかに移動させる。
 *
 * 外部入力は使用しないため、
 * HTMLへ未検証データを挿入する処理はない。
 */

const clinicView =
    document.querySelector('.clinic-view');

const clinicImage =
    document.querySelector('.clinic-image');

let currentX = -30;
let targetX = -30;


/**
 * 院内写真の横移動目標位置を計算する。
 *
 * @returns {void}
 * @example
 * updateTarget();
 */

function updateTarget(){

    if(!clinicView || !clinicImage){

        return;

    }

    const rect =
        clinicView.getBoundingClientRect();

    const viewportHeight =
        window.innerHeight;

    const start =
        viewportHeight * 1.15;

    const end =
        -viewportHeight * 0.25;

    let progress =
        (start - rect.top) /
        (start - end);

    progress =
        Math.max(
            0,
            Math.min(
                1,
                progress
            )
        );

    /*
     * smoothstepを使用することで、
     * 移動開始と終了を急激にせず、
     * 自然な動きにする。
     */

    const smooth =
        progress *
        progress *
        (3 - 2 * progress);

    targetX =
        -30 +
        smooth * 60;
}


/**
 * 院内写真を目標位置へ滑らかに移動する。
 *
 * @returns {void}
 */

function animateClinic(){

    if(!clinicImage){

        return;

    }

    currentX +=
        (targetX - currentX) *
        0.025;

    clinicImage.style.transform =
        `translate3d(
            calc(-50% + ${currentX}%),
            -50%,
            0
        ) scale(.85)`;

    requestAnimationFrame(
        animateClinic
    );
}


updateTarget();

animateClinic();


window.addEventListener(
    'scroll',
    updateTarget,
    {
        passive:true
    }
);


window.addEventListener(
    'resize',
    updateTarget
);


/*
 * ==================================================
 * 詳細クリック時の縦スクロール
 * ==================================================
 */


/**
 * 指定した要素まで滑らかにスクロールする。
 *
 * @param {HTMLElement} target - 移動先
 * @param {number} duration - 移動時間（ミリ秒）
 * @returns {void}
 * @example
 * smoothScrollTo(document.querySelector('#news'), 1800);
 */

function smoothScrollTo(
    target,
    duration = 1800
){

    if(!target){

        console.warn(
            'スクロール先の要素が見つかりません。'
        );

        return;

    }

    const startY =
        window.scrollY;

    const offset =
        window.innerWidth <= 600
            ? 24
            : 32;

    const targetRect =
        target.getBoundingClientRect();

    const targetY =
        targetRect.top +
        window.scrollY -
        offset;

    const distance =
        targetY - startY;

    if(Math.abs(distance) < 2){

        return;

    }

    let startTime = null;


    /**
     * easeInOutCubic。
     *
     * @param {number} t - 0〜1
     * @returns {number} 0〜1
     */

    function easeInOutCubic(t){

        if(t < 0.5){

            return 4 * t * t * t;

        }

        return 1 -
            Math.pow(
                -2 * t + 2,
                3
            ) / 2;
    }


    /**
     * スクロールアニメーションを1フレーム進める。
     *
     * @param {number} timestamp - ブラウザ時刻
     * @returns {void}
     */

    function step(timestamp){

        if(startTime === null){

            startTime = timestamp;

        }

        const elapsed =
            timestamp - startTime;

        const progress =
            Math.min(
                elapsed / duration,
                1
            );

        const eased =
            easeInOutCubic(
                progress
            );

        const currentY =
            startY +
            distance * eased;

        window.scrollTo(
            0,
            currentY
        );

        if(progress < 1){

            requestAnimationFrame(
                step
            );

        }
        else{

            window.scrollTo(
                0,
                targetY
            );

        }
    }

    requestAnimationFrame(
        step
    );
}


const newsDetailLink =
    document.querySelector(
        '.news-detail-note a[href="#news"]'
    );


if(newsDetailLink){

    newsDetailLink.addEventListener(
        'click',
        function(event){

            /*
             * 標準アンカー移動を止め、
             * 独自のスクロール処理だけを実行する。
             */

            event.preventDefault();

            const target =
                document.getElementById('news');

            if(!target){

                console.warn(
                    '#news が見つかりません。'
                );

                return;

            }

            smoothScrollTo(
                target,
                1800
            );

        }
    );
}


/*
 * ==================================================
 * お知らせ読み込み
 * ==================================================
 *
 * 本番index.htmlはルートにあるため、
 * news.jsonも同じルートにある前提で
 * 'news.json' を使用する。
 *
 * JSONの文字列はinnerHTMLへ入れず、
 * textContentでDOMへ追加することでXSSを防ぐ。
 */

fetch('news.json')

    .then(response => {

        if(!response.ok){

            throw new Error(
                `news.jsonの取得に失敗しました: ${response.status}`
            );

        }

        return response.json();

    })

    .then(news => {

        if(!Array.isArray(news)){

            throw new Error(
                'news.jsonの形式が正しくありません。'
            );

        }


        /*
         * URLとして使用できる相対リンクのみ許可する。
         * javascript: などの危険なスキームを拒否する。
         */

        function getSafeLink(value){

            if(typeof value !== 'string'){

                return '#';

            }

            const trimmed =
                value.trim();

            if(
                /^(https?:\/\/|\/|\.\/|\.\.\/|[a-zA-Z0-9_-])/i
                    .test(trimmed)
            ){

                return trimmed;

            }

            return '#';
        }


        /* ==========================================
           上のお知らせ 最新3件
        ========================================== */

        const previewList =
            document.querySelector(
                '.news-preview-list'
            );


        if(previewList){

            previewList.replaceChildren();

            news
                .slice(0,3)
                .forEach(item => {

                    const previewItem =
                        document.createElement('div');

                    previewItem.className =
                        'news-preview-item';


                    const date =
                        document.createElement('span');

                    date.className =
                        'news-preview-date';

                    date.textContent =
                        typeof item.date === 'string'
                            ? item.date
                            : '';


                    const link =
                        document.createElement('a');

                    link.href =
                        getSafeLink(item.link);

                    link.textContent =
                        typeof item.title === 'string'
                            ? item.title
                            : '';


                    previewItem.appendChild(date);

                    previewItem.appendChild(link);

                    previewList.appendChild(
                        previewItem
                    );

                });

        }


        /* ==========================================
           下のお知らせ 最新3件
        ========================================== */

        const newsList =
            document.querySelector(
                '.news-list'
            );


        if(newsList){

            newsList.replaceChildren();


            news
                .slice(0,3)
                .forEach(item => {

                    const newsItem =
                        document.createElement('div');

                    newsItem.className =
                        'news-item';


                    const date =
                        document.createElement('span');

                    date.className =
                        'news-date';

                    date.textContent =
                        typeof item.date === 'string'
                            ? item.date
                            : '';


                    const link =
                        document.createElement('a');

                    link.href =
                        getSafeLink(item.link);

                    link.textContent =
                        typeof item.title === 'string'
                            ? item.title
                            : '';


                    const body =
                        document.createElement('p');

                    body.className =
                        'news-body';

                    body.textContent =
                        typeof item.body === 'string' &&
                        item.body.length > 0
                            ? item.body
                            : '詳細は準備中です。';


                    newsItem.appendChild(date);

                    newsItem.appendChild(link);

                    newsItem.appendChild(body);

                    newsList.appendChild(newsItem);

                });


            /* ======================================
               過去のお知らせ
            ====================================== */

            const past =
                document.createElement('p');

            past.className =
                'news-detail-note';


            const pastLink =
                document.createElement('a');

            pastLink.href =
                'news.html';

            pastLink.textContent =
                '※ 過去のお知らせはクリック';


            past.appendChild(pastLink);

            newsList.appendChild(past);

        }

    })


    /*
     * JSONが存在しない、
     * JSONが壊れている、
     * 通信に失敗した場合でも、
     * ページ全体を壊さない。
     */

    .catch(error => {

        console.error(
            'お知らせの読み込みに失敗しました。',
            error
        );

    });