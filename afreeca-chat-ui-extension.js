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
  const [, broadNo] = location.href.split('/')
  let loginId = getCookie('PdboxBbs')

  // UI
  const boxActions = $('#actionbox')
  const inputChat = $('#write_area')
  const boxChat = $('#chat_write')
  const boxChatArea = $('#chat_area')
  const btnBalloon = $('#btn_star')

  const labelBalloonCount = $('<label for="btn_star">000</label>')
    .on('click', () => btnBalloon.children().eq(0).click())

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
      labelBalloonCount.text('')
      return -1
    }

    // 성공 시
    const max = Number(res.MSG)
    const maxLabel = max.toLocaleString()
    labelBalloonCount.text(maxLabel)

    return max
  }

  function onKeyDownChatInput (e) {
    const selection = window.getSelection()

    /* 복붙 방지 우회 구현(콘은 복사 불가) */
    if (e.ctrlKey && e.key === 'c') {
      const content = selection.toString()
      navigator.clipboard.writeText(content)
    }

    if (e.ctrlKey && e.key === 'x') {
      const content = selection.toString()
      navigator.clipboard.writeText(content)

      const range = selection.getRangeAt(0)
      range.deleteContents()
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
    btnBalloon.css({ display: 'inline-flex', gap: '0.4rem' })
    btnBalloon.append(labelBalloonCount)

    boxChatArea.css('bottom', '13.2rem')
    boxActions.css('height', '13.2rem')
    boxChat.css('height', '8rem')

    inputChat.css({
      height: '80%',
      maxHeight: 'unset'
    })
    inputChat.on('keydown', onKeyDownChatInput)
    inputChat.on('focus', fetchBalloonCount)

    // 불필요한 UI 제거
    $('#btn_sticker').hide()
    $('#btn_police').hide()

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

  function setAutoAddSkipInterval () {
    const btnAddSkip = $('#da_btn_skip')

    let count = 0
    let interval = setInterval(() => {
      $('#chat_ad').hide()

      // 60초 후에는 그냥 clear
      count++
      if (count === 60) {
        clearInterval(interval)
      }

      // 처음 60초 동안 1초 간격으로 텍스트 확인 후 Skip 가능하면 스킵
      if (btnAddSkip.text() === '광고 SKIP') {
        btnAddSkip.click()
        clearInterval(interval)
      }
    }, 1000)
  }

  initUI()
  watchUserIdInterval()

  /*
   * 광고 시간 지나면 자동으로 스킵하는 기능.
   * 주석 해제 시, 아프리카 정책 위반으로 계정에 불이익을 받을 수도 있습니다.
   */
  // setAutoAddSkipInterval()
})()
