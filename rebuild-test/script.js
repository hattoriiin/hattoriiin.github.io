"use strict";

/**
 * お知らせの読み込みとページ内スクロールを管理します。
 * 外部ファイルが読み込めない場合も、ページ全体の表示を止めません。
 */

document.addEventListener("DOMContentLoaded", () => {
    setupNews();
    setupSmoothScroll();
});


/**
 * お知らせを読み込みます。
 * /news.html が取得できない場合は、エラーをコンソールに記録します。
 */
function setupNews() {
    const preview = document.querySelector(".news-preview-list");
    const list = document.querySelector(".news-list");

    fetch("/news.html")
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `お知らせの取得に失敗しました: HTTP ${response.status}`
                );
            }

            return response.text();
        })
        .then((html) => {
            const parser = new DOMParser();
            const parsedDocument = parser.parseFromString(
                html,
                "text/html"
            );

            const source =
                parsedDocument.querySelector(".news-list") ||
                parsedDocument.querySelector("main") ||
                parsedDocument.body;

            if (preview) {
                preview.replaceChildren(source.cloneNode(true));
            }

            if (list) {
                list.replaceChildren(source.cloneNode(true));
            }
        })
        .catch((error) => {
            console.error(
                "[ERROR] お知らせを読み込めませんでした。",
                error
            );
        });
}


/**
 * ページ内リンクの移動を滑らかにします。
 * 対象要素が存在しない場合は通常のリンク動作を妨げません。
 */
function setupSmoothScroll() {
    document.addEventListener("click", (event) => {
        const targetElement = event.target;

        if (!(targetElement instanceof Element)) {
            return;
        }

        const link = targetElement.closest('a[href^="#"]');

        if (!link) {
            return;
        }

        const href = link.getAttribute("href");

        if (!href || href === "#") {
            return;
        }

        let target;

        try {
            target = document.querySelector(href);
        } catch (error) {
            console.warn(
                "[WARN] ページ内リンクの指定が不正です。",
                error
            );

            return;
        }

        if (!target) {
            return;
        }

        event.preventDefault();

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}