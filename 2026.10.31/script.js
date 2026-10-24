let historyStack = ['card-overview'];

function startNavigation() {
    const overviewCard = document.getElementById('card-overview');
    overviewCard.classList.add('dimmed');

    const card1 = document.getElementById('card-1');
    card1.classList.add('active', 'active-target');

    card1.scrollIntoView({ behavior: 'smooth', block: 'end' });
    historyStack.push('card-1');
}

function selectOption(currentId, nextId) {
    const currentCard = document.getElementById(currentId);
    if (currentCard) {
        currentCard.classList.add('dimmed');
        currentCard.classList.remove('active-target');
    }

    const isResult = nextId.startsWith('result-');
    
    if (isResult) {
        const modalOverlay = document.getElementById('modal-overlay');
        modalOverlay.classList.add('active');

        document.querySelectorAll('.fixed-modal-card').forEach(el => el.classList.remove('active'));
        const resultCard = document.getElementById(nextId);
        if (resultCard) {
            resultCard.classList.add('active');
        }
    } else {
        const nextTarget = document.getElementById(nextId);
        if (nextTarget) {
            nextTarget.classList.add('active', 'active-target');
            nextTarget.classList.remove('dimmed');
            nextTarget.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }
    
    historyStack.push(nextId);
}

function goBack() {
    if (historyStack.length <= 1) return;

    const currentId = historyStack.pop();
    const isResult = currentId.startsWith('result-');

    if (isResult) {
        const modalOverlay = document.getElementById('modal-overlay');
        modalOverlay.classList.remove('active');
        const resultCard = document.getElementById(currentId);
        if (resultCard) {
            resultCard.classList.remove('active');
        }
    } else {
        const currentCard = document.getElementById(currentId);
        if (currentCard) {
            currentCard.classList.remove('active', 'active-target');
        }
    }

    const previousId = historyStack[historyStack.length - 1];
    const previousCard = document.getElementById(previousId);
    if (previousCard) {
        previousCard.classList.remove('dimmed');
        previousCard.classList.add('active-target');
        previousCard.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
}

// リロード後に画面が上へ戻らないよう、ブラウザの自動スクロール復元を止める
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// 「判定スタート」ボタンが画面の一番下に来るように位置を合わせる
function anchorToStart() {
    const overviewCard = document.getElementById('card-overview');
    if (overviewCard) {
        overviewCard.scrollIntoView({ block: 'end' });
    }
}

function resetAll() {
    try { sessionStorage.setItem('anchorToStart', '1'); } catch (e) {}
    location.reload();
}

window.addEventListener('load', () => {
    let flag = null;
    try {
        flag = sessionStorage.getItem('anchorToStart');
        sessionStorage.removeItem('anchorToStart');
    } catch (e) {}
    if (flag) {
        anchorToStart();
        setTimeout(anchorToStart, 150); // 表示が落ち着いた後にもう一度合わせる
    }
});

// 最終判定カードの長押しプレビュー機能
document.addEventListener('DOMContentLoaded', () => {
    const previewOverlay = document.getElementById('chart-preview-overlay');
 

    // 長押しの内容は、画面の概要をそのままコピーして表示する（書き場所を1か所にするため）
    const ovSrc = document.querySelector('#card-overview .overview-box');
    const ovDst = document.querySelector('#chart-preview-overlay .chart-preview-content');
    if (ovSrc && ovDst) {
        ovDst.insertAdjacentHTML('beforeend', ovSrc.innerHTML);
    }

    document.querySelectorAll('.longpress-hint, .fixed-modal-card').forEach(item => {
        let pressTimer = null;

        function startPress(e) {
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
            pressTimer = setTimeout(() => {
                previewOverlay.classList.add('active');
            }, 400);
        }

        function endPress() {
            clearTimeout(pressTimer);
            previewOverlay.classList.remove('active');
        }

        item.addEventListener('mousedown', startPress);
        item.addEventListener('mouseup', endPress);
        item.addEventListener('mouseleave', endPress);

        item.addEventListener('touchstart', startPress, { passive: true });
        item.addEventListener('touchend', endPress);
        item.addEventListener('touchcancel', endPress);
    });
});
