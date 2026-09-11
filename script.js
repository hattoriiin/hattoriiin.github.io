/*
 * ==================================================
 * 院内写真 横スクロール制御
 * ==================================================
 */

const clinicView =
    document.querySelector('.clinic-view');

const clinicImage =
    document.querySelector('.clinic-image');

let currentX = -30;
let targetX = -30;


/**
 * 院内写真の横移動目標位置を計算する。
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

    .catch(error => {
        console.error(
            'お知らせの読み込みに失敗しました。',
            error
        );
    });


/*
 * ==================================================
 * 担当医表（doctors.html / doctors.json）の長押し表示・非表示制御
 * ==================================================
 */

Promise.all([
  fetch("doctors.html").then(res => res.text()),
  fetch("doctors.json").then(res => res.json())
])
.then(([htmlText, doctors]) => {
  const container = document.getElementById("schedule-container");
  if (!container) return;

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");
  const overlayTable = doc.querySelector("table") || doc.querySelector("#doctors-overlay-table");

  if (!overlayTable) {
    console.error("doctors.html 内に <table> が見つかりません。");
    return;
  }

  overlayTable.id = "doctors-overlay-table";
  overlayTable.classList.add("schedule", "table-overlay");

  const existingTable = document.getElementById("doctors-overlay-table");
  if (existingTable) {
    existingTable.remove();
  }

  container.appendChild(overlayTable);

  function createDoctorName(name) {
    if (!name || !String(name).trim()) return `<span class="doctor-empty">―</span>`;
    let cleanName = String(name).replace(/先生$/, "").trim();
    let className = "doctor-name";
    if (cleanName.length >= 6) className += " very-long";
    else if (cleanName.length >= 4) className += " long";

    const chars = [...cleanName].map(char => `<span class="doctor-char">${char}</span>`).join("");
    return `<span class="${className}">${chars}</span>`;
  }

  overlayTable.querySelectorAll("td[data-time]").forEach(cell => {
    const day = cell.dataset.day;
    const time = cell.dataset.time;
    cell.innerHTML = createDoctorName(doctors?.[day]?.[time] || "");
  });

  overlayTable.querySelectorAll("td[data-visit]").forEach(cell => {
    const day = cell.dataset.day;
    cell.innerHTML = createDoctorName(doctors?.[day]?.["訪問"] || "");
  });

  setupToggleEvents();
})
.catch(err => console.error("担当医表データ読み込みエラー:", err));

function setupToggleEvents() {
  const btn = document.getElementById("toggle-doctors-btn");
  const overlayTable = document.getElementById("doctors-overlay-table");

  if (!btn || !overlayTable) return;

  function showOverlay(e) {
    if (e) e.preventDefault();
    overlayTable.classList.add("is-active");
    btn.classList.add("active");
  }

  function hideOverlay(e) {
    overlayTable.classList.remove("is-active");
    btn.classList.remove("active");
  }

  btn.addEventListener("mousedown", showOverlay);
  btn.addEventListener("mouseup", hideOverlay);
  btn.addEventListener("mouseleave", hideOverlay);

  btn.addEventListener("touchstart", showOverlay, { passive: false });
  btn.addEventListener("touchend", hideOverlay);
  btn.addEventListener("touchcancel", hideOverlay);
}

/*
 * ==================================================
 * 診療時間時計（clock.claude.html）の長押し表示・非表示制御
 * ==================================================
 */
(function() {
    const btn = document.getElementById('clockBtn');
    const modal = document.getElementById('clockModal');

    if (!btn || !modal) return;

    function showClock(e) {
        if (e) e.preventDefault();
        modal.classList.add('is-active');
        btn.classList.add('active');
    }

    function hideClock() {
        modal.classList.remove('is-active');
        btn.classList.remove('active');
    }

    // パソコン用（マウス操作）
    btn.addEventListener("mousedown", showClock);
    window.addEventListener("mouseup", hideClock);
    btn.addEventListener("mouseleave", hideClock);

    // スマホ・タブレット用（タッチ操作）
    btn.addEventListener("touchstart", showClock, { passive: false });
    window.addEventListener("touchend", hideClock);
    window.addEventListener("touchcancel", hideClock);
})();


