/* ==================================================
   院内写真スクロール
================================================== */


/* ------------------------------------------
   要素取得
------------------------------------------ */

const camera =
    document.querySelector(
        '.clinic-camera'
    );

const image =
    document.querySelector(
        '.clinic-image'
    );


/* ------------------------------------------
   スクロール処理
------------------------------------------ */

if (camera && image) {

    let scrollTicking = false;


    function updateClinicImage() {

        const rect =
            camera.getBoundingClientRect();

        const viewHeight =
            window.innerHeight;


        if (
            rect.top <= viewHeight &&
            rect.bottom >= 0
        ) {

            const progress =
                (viewHeight - rect.top) /
                (viewHeight + rect.height);


            const clamped =
                Math.max(
                    0,
                    Math.min(
                        1,
                        progress
                    )
                );


            const translateX =
                -50 +
                (clamped - .5) * 30;


            const scale =
                .85 +
                clamped * .15;


            image.style.transform =
                `translate3d(${translateX}%, -50%, 0) scale(${scale})`;

        }


        scrollTicking = false;

    }


    window.addEventListener(
        'scroll',
        function () {

            if (scrollTicking) {
                return;
            }


            scrollTicking = true;


            window.requestAnimationFrame(
                updateClinicImage
            );

        },
        {
            passive: true
        }
    );

}