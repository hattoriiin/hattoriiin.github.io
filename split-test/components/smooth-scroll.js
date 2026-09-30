/* ==================================================
   院内ページ内スムーズスクロール
================================================== */

document.addEventListener(
    'DOMContentLoaded',
    function () {

        const scrollLinks =
            document.querySelectorAll(
                'a[href^="#"]'
            );


        scrollLinks.forEach(
            function (link) {

                link.addEventListener(
                    'click',
                    function (event) {

                        const targetId =
                            link.getAttribute(
                                'href'
                            );


                        if (
                            !targetId ||
                            targetId === '#'
                        ) {

                            return;

                        }


                        const target =
                            document.querySelector(
                                targetId
                            );


                        if (!target) {

                            return;

                        }


                        event.preventDefault();


                        target.scrollIntoView(
                            {
                                behavior:'smooth',
                                block:'start'
                            }
                        );

                    }
                );

            }
        );

    }
);