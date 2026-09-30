/* ==================================================
   news.json
================================================== */


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