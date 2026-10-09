
"use strict";

/* ==================================================
   1. 院内写真の横スクロール
================================================== */

(function () {
    const clinicView = document.querySelector(".clinic-view");
    const clinicImage = document.querySelector(".clinic-image");

    if (!clinicView || !clinicImage) {
        console.error("院内写真：.clinic-view または .clinic-image が見つかりません。");
        return;
    }

    let currentX = -30;
    let targetX = -30;
    let framePending = false;

    function updateTarget() {
        const rect = clinicView.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const start = viewportHeight * 1.15;
        const end = -viewportHeight * 0.25;

        let progress = (start - rect.top) / (start - end);
        progress = Math.max(0, Math.min(1, progress));

        const smooth = progress * progress * (3 - 2 * progress);
        targetX = -30 + smooth * 60;

        if (!framePending) {
            framePending = true;
            requestAnimationFrame(animate);
        }
    }

    function animate() {
        currentX += (targetX - currentX) * 0.08;

        if (Math.abs(targetX - currentX) < 0.03) {
            currentX = targetX;
        }

        clinicImage.style.transform =
            `translate3d(calc(-50% + ${currentX}%), -50%, 0) scale(.85)`;

        framePending = false;

        if (Math.abs(targetX - currentX) >= 0.03) {
            framePending = true;
            requestAnimationFrame(animate);
        }
    }

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", updateTarget);
    updateTarget();
})();


/* ==================================================
   2. お知らせの読み込み
================================================== */

(async function () {
    const previewList = document.querySelector(".news-preview-list");
    const newsList = document.querySelector(".news-list");

    if (!previewList && !newsList) return;

    try {
        const response = await fetch("/news.json", { cache: "no-cache" });

        if (!response.ok) {
            throw new Error(`news.json の取得に失敗しました（${response.status}）`);
        }

        const news = await response.json();

        if (!Array.isArray(news)) {
            throw new Error("news.json の形式が配列ではありません。");
        }

        function createNewsLink(item) {
            const link = document.createElement("a");
            const href = typeof item.link === "string" ? item.link.trim() : "";

            /* javascript: などの危険なリンクを許可しない */
            if (/^(https?:\/\/|\/|\.\/|\.\.\/|[a-zA-Z0-9_-])/i.test(href)) {
                link.href = href;
            } else {
                link.href = "#";
            }

            link.textContent = typeof item.title === "string" ? item.title : "";
            return link;
        }

        function createDate(item) {
            const date = document.createElement("span");
            date.className = "news-preview-date";
            date.textContent = typeof item.date === "string" ? item.date : "";
            return date;
        }

        if (previewList) {
            previewList.replaceChildren();

            news.slice(0, 3).forEach(item => {
                const row = document.createElement("div");
                row.className = "news-preview-item";
                row.append(createDate(item), createNewsLink(item));
                previewList.appendChild(row);
            });
        }

        if (newsList) {
            newsList.replaceChildren();

            news.slice(0, 3).forEach(item => {
                const row = document.createElement("div");
                row.className = "news-item";

                const date = document.createElement("span");
                date.className = "news-date";
                date.textContent = typeof item.date === "string" ? item.date : "";

                const body = document.createElement("p");
                body.className = "news-body";
                body.textContent =
                    typeof item.body === "string" && item.body.length
                        ? item.body
                        : "詳細は準備中です。";

                row.append(date, createNewsLink(item), body);
                newsList.appendChild(row);
            });

            const note = document.createElement("p");
            note.className = "news-detail-note";

            const pastLink = document.createElement("a");
            pastLink.href = "news.html";
            pastLink.textContent = "※ 過去のお知らせはクリック";

            note.appendChild(pastLink);
            newsList.appendChild(note);
        }
    } catch (error) {
        console.error("お知らせの読み込みに失敗しました。", error);

        if (previewList) {
            previewList.textContent = "お知らせを読み込めませんでした。";
        }
    }
})();


/* ==================================================
   3. 「詳細はクリック」の緩やかなスクロール
================================================== */

(function () {
    let animationId = null;

    function smoothScrollTo(target, duration = 1800) {
        if (!target) return;

        if (animationId !== null) {
            cancelAnimationFrame(animationId);
        }

        const startY = window.scrollY;
        const targetY = startY + target.getBoundingClientRect().top - 20;
        const distance = targetY - startY;
        const startTime = performance.now();

        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = progress < 0.5
                ? 4 * progress * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;

            window.scrollTo(0, startY + distance * eased);

            if (progress < 1) {
                animationId = requestAnimationFrame(step);
            } else {
                window.scrollTo(0, targetY);
                animationId = null;
            }
        }

        animationId = requestAnimationFrame(step);
    }

    /* 後から生成されるリンクにも対応 */
    document.addEventListener("click", function (event) {
        const targetLink = event.target.closest(
            '.news-detail-note a[href="#news"]'
        );

        if (!targetLink) return;

        const newsSection = document.getElementById("news");
        if (!newsSection) return;

        event.preventDefault();
        smoothScrollTo(newsSection, 1800);
    });
})();
