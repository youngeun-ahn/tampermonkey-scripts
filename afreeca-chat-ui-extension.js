// ==UserScript==
// @name         Afreeca Chat UI Extension
// @namespace    http://tampermonkey.net/
// @version      2024-03-17
// @description  아프리카 채팅 UI 개선 확장(보유 별풍선 표시, 채팅 복붙 해금(이모티콘X), 채팅 높이 조정
// @author       힝잉잉잉잉잉
// @match        https://play.afreecatv.com/*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=afreecatv.com
// @grant        none
// ==/UserScript==

(() => {
    'use strict'

    // Data
    const [, broadName, broadNo] = location.href.split('/')
    const broadNickname = $('.nickname').eq(0).attr('title')
    let loginId = localStorage.getItem('loginId')

    // UI
    const boxActions = $('#actionbox')
    const icon = $('<img>')
    const inputChat = $('#write_area')
    const boxChat = $('#chat_write')
    const boxChatArea = $('#chat_area')
    const labelBalloon = $('<div>')
    const btnSend = $('#btn_send')
    const btnGift = $('.btn_gift').eq(0)
    const btnOpenStar = $('#btn_star > a').eq(0)

    const makeForm = body => ({
        method: 'POST',
        body,
        credentials: 'include',
        headers: { 'Cookie': document.cookie },
    })

    // 보유 별풍선 개수
    async function fetchBalloonCount () {
        const form = {
            nBroadNo: broadNo,
            broad_no: broadNo,
            szFileType: 'json',
            sys_type: 'html5',
            location: 'live',
        }

        const url = 'https://st.afreecatv.com/api/item/starballoon.php?szWork=recvItem'

        const _ = await fetch(url, makeForm(form))
        const res = await _.json()

        // 실패 시
        if (res.RESULT !== 1) {
            icon.attr('title', '로그인 해주세요.')
            labelBalloon.attr('title', '로그인 해주세요.')
            labelBalloon.text('보유 0개')
            return
        }

        const max = Number(res.MSG)
        const maxLabel = max.toLocaleString()
        icon.attr('title', `보유 별풍선 ${maxLabel}개`)
        labelBalloon.attr('title', `보유 별풍선 ${maxLabel}개`)
        labelBalloon.text(`보유 ${maxLabel}개`)

        return max
    }

    function onKeyDownChatInput (e) {
        const selection = window.getSelection()

        /* 복붙 방지 우회 구현(콘은 복사 불가) */
        if (e.ctrlKey && e.key === 'c') {
            const content = selection.toString()
            navigator.clipboard.writeText(content)
        }

        if (e.ctrlKey && e.key === 'v') {
            navigator.clipboard
                .readText()
                .then(_ => {
                const range = selection.getRangeAt(0)
                range.deleteContents()

                const node = document.createTextNode(_)
                range.insertNode(node)
                range.collapse()
            })
        }
    }

    function initUI () {
        icon.attr('src', "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 17 20' %3e%3cpath fill='%23707173' d='M9.83 16.5l.02.27c.04.4.13.78.24 1.13.15.43.35.78.6 1.02a.6.6 0 010 .87.64.64 0 01-.9 0c-.4-.4-.69-.9-.89-1.5a6.56 6.56 0 01-.33-1.68H8.5a8.4 8.4 0 01-8.5-8.3 8.4 8.4 0 018.5-8.32 8.4 8.4 0 018.5 8.31c0 4.14-3.1 7.58-7.16 8.2zM8.49 1.1a7.28 7.28 0 00-7.36 7.2c0 3.97 3.3 7.2 7.36 7.2a7.28 7.28 0 007.36-7.2c0-3.97-3.3-7.2-7.36-7.2zm2.69 8.35a.3.3 0 00-.09.27l.47 2.69c.05.25-.22.44-.45.32l-2.48-1.27a.32.32 0 00-.29 0l-2.47 1.27c-.23.12-.5-.07-.46-.32l.47-2.7a.3.3 0 00-.09-.27l-2-1.9A.3.3 0 013.97 7l2.76-.39c.1-.01.2-.08.24-.17L8.2 4a.32.32 0 01.56 0l1.24 2.45c.04.1.13.16.23.17l2.77.4a.3.3 0 01.17.52l-2 1.9z'/%3e%3c/svg%3e")
        icon.css({
            width: '1.6rem',
            height: '1.6rem',
            position: 'absolute',
            left: '1.2rem',
            top: '16px'
        }).addClass('star')

        labelBalloon.css({
            position: 'absolute',
            top: '0.9rem',
            left: '3.2rem',
            right: 'unset',
            width: '6.4rem',
            height: '5.4rem',
            paddingTop: '0.4rem',
            paddingBottom: '0.4rem',
            maxHeight: 'unset',
            borderRight: '1px solid lightgray',
            cursor: 'pointer',
            color: 'darkgray'
        }).on('click', () => btnOpenStar.trigger('click'))

        inputChat.css({
            left: '10.6rem',
            height: '80%',
            maxHeight: 'unset'
        }).before(icon).before(labelBalloon)

        inputChat.on('keydown', onKeyDownChatInput)
        inputChat.on('focus', fetchBalloonCount)

        boxChat.css('height', '8rem')
        boxActions.css('height', '13.2rem')
        boxChatArea.css('bottom', '13.2rem')
        setTimeout(() => btnSend.removeAttr('placeholder'), 1000)

        fetchBalloonCount()
    }

    function watchUserIdInterval () {
        loginId = getCookie('PdboxBbs')

        setInterval(() => {
            let nextLoginId = getCookie('PdboxBbs')
            if (loginId !== nextLoginId) {
                fetchBalloonCount()
                loginId = nextLoginId
            }
        }, 500)
    }

    initUI()
    watchUserIdInterval()
})()
