/* ==================================================
   共通処理
================================================== */

function setText(element, text) {
    if (!element) return;
    element.textContent = text;
}

function showElement(element) {
    if (!element) return;
    element.hidden = false;
}

function hideElement(element) {
    if (!element) return;
    element.hidden = true;
}


/* ==================================================
   長押し共通処理
================================================== */

function setupLongPress(
    button,
    {
        onStart,
        onEnd,
        onCancel,
        endOnPointerLeave = true
    } = {}
) {
    if (!button) return;

    let timer = null;
    let isActive = false;
    let activePointerId = null;

    const clearTimer = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    };

    const cancel = (event) => {
        clearTimer();

        if (!isActive) {
            activePointerId = null;
            return;
        }

        isActive = false;
        activePointerId = null;

        if (typeof onCancel === "function") {
            onCancel(event);
        }
    };

    const start = (event) => {
        if (event && event.type === "pointerdown") {
            activePointerId = event.pointerId;
        }

        clearTimer();

        timer = setTimeout(() => {
            timer = null;

            if (isActive) return;

            isActive = true;

            if (typeof onStart === "function") {
                onStart(event);
            }
        }, 500);
    };

    const end = (event) => {
        clearTimer();

        if (!isActive) {
            activePointerId = null;
            return;
        }

        isActive = false;
        activePointerId = null;

        if (typeof onEnd === "function") {
            onEnd(event);
        }
    };

    button.addEventListener("pointerdown", start);

    button.addEventListener("pointerup", end);

    button.addEventListener("pointercancel", cancel);

    if (endOnPointerLeave) {
        button.addEventListener("pointerleave", cancel);
    }

    button.addEventListener("blur", function(event) {
        if (
            activePointerId !== null &&
            isActive &&
            event &&
            event.type === "blur"
        ) {
            return;
        }

        cancel(event);
    });

    button.addEventListener("contextmenu", function(event) {
        event.preventDefault();
    });
}