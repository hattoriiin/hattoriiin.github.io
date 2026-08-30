/*
 * 服部医院
 * メインページ用JavaScript
 *
 * このファイルには、index.htmlから分離した
 * JavaScript処理だけをまとめる。
 *
 * 外部入力をHTMLとして直接挿入せず、
 * textContentを使用することでXSSを防止する。
 */


/* ==================================================
   院内写真 横スクロール制御
================================================== */

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
     * 既存の動作を維持する。
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


/* ==================================================
   詳細クリック時の上品な縦スクロール
================================================== */

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
             */

            smoothScrollTo(
                target,
                1800
            );

        }
    );

}


/* ==================================================
   お知らせ読み込み
================================================== */

/*
 * work/ から見て news.json は一つ上にあるため、
 * ../news.json を指定する。
 *
 * 外部データをinnerHTMLへ直接投入せず、
 * textContentを使用することでXSSを防止する。
 */

fetch('../news.json')

    .then(response => {

        /*
         * HTTPエラーを明示的に検出する。
         */

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
                     * javascript: 等の危険なスキームを
                     * 許可しない。
                     */

                    const safeLink =
                        typeof item.link === 'string' &&
                        /^(https?:\/\/|\/|\.\/|\.\.\/|[a-zA-Z0-9_-])/i.test(item.link)
                            ? item.link
                            : '#';


                    /*
                     * work/ から親ディレクトリのファイルを
                     * 指定する必要がある場合に対応する。
                     */

                    link.href =
                        normalizeWorkPath(
                            safeLink
                        );

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
                        normalizeWorkPath(
                            safeLink
                        );

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
                '../news.html';

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


/**
 * work/ から親階層のファイルへリンクするため、
 * 相対パスを調整する。
 *
 * @param {string} path - news.jsonから取得したリンク
 * @returns {string} work/ から利用可能なリンク
 *
 * @example
 * normalizeWorkPath('news-detail.html');
 * // '../news-detail.html'
 */

function normalizeWorkPath(path){

    /*
     * 空文字や不正な値は安全なリンクにする。
     */

    if(typeof path !== 'string' || path.length === 0){

        return '#';

    }


    /*
     * 外部URL、アンカー、すでに親階層を指定しているURLは
     * そのまま使用する。
     */

    if(
        /^(https?:\/\/|#|\.\.\/)/i.test(path)
    ){

        return path;

    }


    /*
     * / から始まるサイトルート相対パスもそのまま使用する。
     */

    if(path.startsWith('/')){

        return path;

    }


    /*
     * work/ から本番ルートへ戻るため ../ を付ける。
     */

    return `../${path}`;

}