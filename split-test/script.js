/* 共通処理 */

function setText(element, text) {
    if (!element) {
        return;
    }

    element.textContent = text;
}


function showElement(element) {
    if (!element) {
        return;
    }

    element.hidden = false;
}


function hideElement(element) {
    if (!element) {
        return;
    }

    element.hidden = true;
}


/* ==================================================
   長押し共通処理

   担当医表と診療時間時計の両方で使用します。
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

    if (!button) {
        return;
    }


    let activePointerId = null;
    let isActive = false;


    function start(event) {

        if (
            activePointerId !== null ||
            event.button === 2
        ) {
            return;
        }


        activePointerId =
            event.pointerId;

        isActive =
            true;


        if (
            typeof onStart ===
            'function'
        ) {

            onStart(event);

        }


        if (
            event.pointerType === 'mouse' &&
            button.setPointerCapture
        ) {

            try {

                button.setPointerCapture(
                    event.pointerId
                );

            }
            catch (error) {

                console.debug(
                    'Pointer Captureを設定できませんでした:',
                    error
                );

            }

        }

    }


    function end(event) {

        if (
            activePointerId === null ||
            (
                event &&
                event.pointerId !==
                activePointerId
            )
        ) {
            return;
        }


        activePointerId =
            null;


        if (isActive) {

            isActive =
                false;


            if (
                typeof onEnd ===
                'function'
            ) {

                onEnd(event);

            }

        }

    }


    function endTouch() {

        if (
            activePointerId === null ||
            !isActive
        ) {
            return;
        }


        activePointerId =
            null;

        isActive =
            false;


        if (
            typeof onEnd ===
            'function'
        ) {

            onEnd({
                pointerType: 'touch'
            });

        }

    }


    function cancel(event) {

        if (
            event &&
            event.pointerType === 'touch'
        ) {
            return;
        }


        if (
            activePointerId === null ||
            (
                event &&
                event.pointerId !==
                activePointerId
            )
        ) {
            return;
        }


        activePointerId =
            null;


        if (isActive) {

            isActive =
                false;


            if (
                typeof onCancel ===
                'function'
            ) {

                onCancel(event);

            }

        }

    }


    button.addEventListener(
        'pointerdown',
        start
    );

    button.addEventListener(
        'pointerup',
        end
    );

    button.addEventListener(
        'pointercancel',
        cancel
    );

    button.addEventListener(
        'lostpointercapture',
        cancel
    );

    button.addEventListener(
        'touchend',
        endTouch,
        {
            passive: true
        }
    );


    if (endOnPointerLeave) {

        button.addEventListener(
            'pointerleave',
            function (event) {

                if (
                    event.pointerType ===
                    'mouse' &&
                    activePointerId !== null
                ) {

                    end(event);

                }

            }
        );

    }


    window.addEventListener(
        'blur',
        function (event) {

            if (
                activePointerId !== null &&
                isActive &&
                event &&
                event.type === 'blur'
            ) {
                return;
            }

            cancel(event);

        }
    );

}