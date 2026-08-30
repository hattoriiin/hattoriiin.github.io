/*
 * 院内写真の横スクロール制御
 *
 * ここは今回変更していない。
 *
 * 写真の表示領域を変えず、
 * 縦スクロール位置に応じて写真を左右へ移動させる。
 *
 * セキュリティ上、外部入力は使用していない。
 */

const clinicView =
    document.querySelector('.clinic-view');

const clinicImage =
    document.querySelector('.clinic-image');


/*
 * 現在位置。
 */

let currentX = -30;

let targetX = -30;


/*
 * requestAnimationFrameの多重起動を防ぐためのフラグ。
 */

let animationStarted = false;


/**
 * 院内写真の横移動目標位置を計算する。
 *
 * @returns {void}
 *
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
     * smoothstep。
     *
     * 写真の横移動開始・終了を滑らかにする。
     */

    const smooth =
        progress *
        progress *
        (3 - 2 * progress);


    /*
     * -30% → +30%
     *
     * この値は既存動作を維持。
     */

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


    /*
     * ここも既存値を維持。
     *
     * 横スクロールを急激に追従させず、
     * ゆっくり追従させる。
     */

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


/*
 * 初期位置。
 */

updateTarget();


/*
 * アニメーションは一度だけ開始。
 */

if(!animationStarted){

    animationStarted = true;

    animateClinic();

}


/*
 * スクロールイベント。
 *
 * passive:true により、
 * ブラウザの通常スクロールを妨げない。
 */

window.addEventListener(
    'scroll',
    updateTarget,
    {
        passive:true
    }
);


/*
 * 画面サイズ変更時。
 */

window.addEventListener(
    'resize',
    updateTarget
);


/*
 * 「※ 詳細はクリック」を押したときの
 * 縦スクロール専用処理。
 *
 * ブラウザ標準のsmooth scrollではなく、
 * requestAnimationFrameで移動距離を管理する。
 *
 * 目的：
 *
 * ・急に「お知らせ」へ飛ばない
 * ・最初はゆっくり動き始める
 * ・中間で自然に進む
 * ・最後はゆっくり減速する
 * ・固定電話ボタンに見出しが隠れない
 *
 * 院内写真の横スクロール制御とは完全に独立している。
 *
 * セキュリティ上、hrefをそのままHTMLとして
 * 挿入することはせず、固定IDのみを扱う。
 */


/**
 * 指定した要素までゆっくりスクロールする。
 *
 * @param {HTMLElement} target - 移動先の要素
 * @param {number} duration - 移動時間（ミリ秒）
 * @returns {void}
 *
 * @example
 * smoothScrollTo(document.querySelector('#news'), 1800);
 */

function smoothScrollTo(
    target,
    duration = 1800
){

    /*
     * 要素が存在しない場合は処理しない。
     *
     * HTML変更などで #news がなくなっても
     * JavaScript全体を停止させないため。
     */

    if(!target){

        console.warn(
            'スクロール先の要素が見つかりません。'
        );

        return;

    }


    /*
     * 現在のスクロール位置。
     */

    const startY =
        window.scrollY;


    /*
     * 固定電話ボタンに隠れないよう、
     * お知らせ見出しより少し上で止める。
     *
     * 画面サイズに応じて余白を変える。
     */

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


    /*
     * すでに目的地付近なら無理に動かさない。
     */

    if(Math.abs(distance) < 2){

        return;

    }


    let startTime = null;


    /**
     * easeInOutCubic。
     *
     * 単純なlinearでは機械的に見えるため、
     * 最初と最後をゆっくり、中間を自然に進ませる。
     *
     * @param {number} t - 0〜1の進行度
     * @returns {number} 0〜1の補間値
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
     * アニメーション1フレーム。
     *
     * @param {number} timestamp - ブラウザが渡す時刻
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


        /*
         * durationに到達していなければ継続。
         */

        if(progress < 1){

            requestAnimationFrame(
                step
            );

        }
        else{

            /*
             * 最終位置を明示的に設定。
             *
             * 小数点誤差で見出しが数pxずれるのを防ぐ。
             */

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


/*
 * 詳細リンクを取得。
 */

const newsDetailLink =
    document.querySelector(
        '.news-detail-note a[href="#news"]'
    );


if(newsDetailLink){

    newsDetailLink.addEventListener(
        'click',
        function(event){

            /*
             * 通常のアンカー移動を停止。
             *
             * これがないと、ブラウザ自身のジャンプと
             * 独自アニメーションが競合する。
             */

            event.preventDefault();


            const target =
                document.getElementById('news');


            /*
             * お知らせが存在する場合のみ実行。
             */

            if(!target){

                console.warn(
                    '#news が見つかりません。'
                );

                return;

            }


            /*
             * 約1.8秒。
             *
             * 「急に飛ぶ」のではなく、
             * ページの視線が自然に下へ流れる速度。
             */

            smoothScrollTo(
                target,
                1800
            );

        }
    );

}


/*
 * news.jsonを取得してお知らせを表示する。
 *
 * 外部データをinnerHTMLへ直接投入せず、
 * textContentを使用することでXSSを防止する。
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


        /*
         * JSONが配列でない場合は処理を中断。
         */

        if(!Array.isArray(news)){

            throw new Error(
                'news.jsonの形式が正しくありません。'
            );

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

                    /*
                     * 外部JSONから取得したリンクについて、
                     * javascript: 等の危険なスキームを
                     * 許可しない。
                     */

                    const safeLink =
                        typeof item.link === 'string' &&
                        /^(https?:\/\/|\/|\.\/|\.\.\/|[a-zA-Z0-9_-])/i.test(item.link)
                            ? item.link
                            : '#';


                    link.href =
                        safeLink;

                    link.textContent =
                        typeof item.title === 'string'
                            ? item.title
                            : '';


                    previewItem.appendChild(
                        date
                    );

                    previewItem.appendChild(
                        link
                    );

                    previewList.appendChild(
                        previewItem
                    );

                });

        }


        /* ==========================================
           下のお知らせ 最新3件＋本文
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


                    const safeLink =
                        typeof item.link === 'string' &&
                        /^(https?:\/\/|\/|\.\/|\.\.\/|[a-zA-Z0-9_-])/i.test(item.link)
                            ? item.link
                            : '#';


                    link.href =
                        safeLink;

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


                    newsItem.appendChild(
                        date
                    );

                    newsItem.appendChild(
                        link
                    );

                    newsItem.appendChild(
                        body
                    );

                    newsList.appendChild(
                        newsItem
                    );

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


            past.appendChild(
                pastLink
            );

            newsList.appendChild(
                past
            );

        }

    })


    /*
     * news.jsonが存在しない、
     * JSONが壊れている、
     * 通信に失敗した場合など。
     *
     * ページ全体を壊さず、
     * console.errorだけに留める。
     */

    .catch(error => {

        console.error(
            'お知らせの読み込みに失敗しました。',
            error
        );

    });