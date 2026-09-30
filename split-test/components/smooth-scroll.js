/* ==================================================
   「※ 詳細はクリック」
   ゆっくりスクロール
================================================== */


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