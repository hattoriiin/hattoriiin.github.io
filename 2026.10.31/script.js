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

function resetAll() {
    location.reload();
}

// 最終判定カードの長押しプレビュー機能
document.addEventListener('DOMContentLoaded', () => {
    const previewOverlay = document.getElementById('chart-preview-overlay');
    
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
