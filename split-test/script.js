/*
 * 共通処理
 *
 * 共通化することで、components.js側から
 * 「表示」「非表示」の処理を同じ方法で呼び出せるようにする。
 */


/**
 * 指定した要素へ文字列を設定する。
 *
 * @param {HTMLElement|null} element - 対象要素
 * @param {string} text - 設定する文字列
 * @returns {void}
 * @throws {TypeError} elementがnull以外でtextContentを設定できない場合
 *
 * @example
 * setText(document.getElementById("message"), "読み込み完了");
 */
function setText(element, text) {

    if (!element) {
        return;
    }

    element.textContent = text;
}


/**
 * 非表示になっている要素を表示する。
 *
 * @param {HTMLElement|null} element - 対象要素
 * @returns {void}
 *
 * @example
 * showElement(document.getElementById("clock-error"));
 */
function showElement(element) {

    if (!element) {
        return;
    }

    element.hidden = false;
}


/**
 * 要素をhidden属性で非表示にする。
 *
 * @param {HTMLElement|null} element - 対象要素
 * @returns {void}
 *
 * @example
 * hideElement(document.getElementById("clock-error"));
 */
function hideElement(element) {

    if (!element) {
        return;
    }

    element.hidden = true;
}