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
  const btnAddSkip = $('#da_btn_skip')
  const btnEmoticon = $('#btn_emo > a').eq(0)
  const boxEmoticon = $('<div>')

  const labelBalloonCount = $('<label for="btn_star">000</label>')
    .on('click', () => btnBalloon.children().eq(0).click())

  const makeForm = body => ({
    method: 'POST',
    body,
    credentials: 'include',
    headers: { 'Cookie': document.cookie },
  })

  // 보유 별풍선 개수 요청
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

  // 복사/잘라내기/붙여넣기 우회 구현(콘은 복사 불가)
  function onKeyDownChatInput (e) {
    const selection = window.getSelection()

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

    boxEmoticon.css({
      position: 'absolute',
      top: '0.8rem',
      right: '0.8rem',
      height: '2.4rem',
      display: 'flex',
      gap: '0.4rem',
    }).attr('title', '최근에 사용한 이모티콘')
    boxEmoticon.insertBefore(boxChat)

    // 불필요한 UI 제거
    $('#btn_sticker').hide()
    $('#btn_police').hide()

    fetchBalloonCount()
  }

  // 로그인/로그아웃 등으로 userId가 변경되었을 때
  // 로그인 ID 및 별풍선 갱신
  function watchUserIdInterval () {
    loginId = getCookie('PdboxBbs')

    setInterval(() => {
      let nextLoginId = getCookie('PdboxBbs')

      if (loginId !== nextLoginId) {
        fetchBalloonCount()
        loginId = nextLoginId
      }
    }, 1000)
  }

  // 첫 광고 시간 지나면 자동 스킵 기능
  function setAutoAddSkipInterval () {
    let count = 0
    const interval = setInterval(() => {
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

  // 최근 사용한 이모티콘 목록
  function initRecentEmoticons () {
    function updateRecentEmoticons () {
      // 최근에 사용한 이모티콘 5개까지 클론
      const emoticons = Array
        .from(document.querySelectorAll('.scroll_area.recent_emoticon.recent_emoticon_default > span > a'))
        .slice(0, 5)
        .map(_ => $(_).clone(true, true).on('click', () => _.click()))
  
      boxEmoticon.empty()
      boxEmoticon.append(emoticons)
    }
  
    // 처음에 광고 등으로 이모티콘 사용 불가능할 때 인터벌
    const interval = setInterval(() => {
      const disabled = btnEmoticon.parent().hasClass('off')
      if (disabled) return
  
      // 잠시 최근 이모티콘 목록 열어서 1회 렌더링 하도록 처리
      btnEmoticon.click()
      document.querySelector('.ic_clock').click() // 최근 탭
      btnEmoticon.click()

      setTimeout(() => {
        updateRecentEmoticons()
  
        // 이모티콘 팝업 열고 닫을 때마다 갱신
        btnEmoticon.on('click', () => updateRecentEmoticons())
      }, 500)
  
      clearInterval(interval)
    }, 1000)
  }

  initUI()
  watchUserIdInterval()
  initRecentEmoticons()
  setAutoAddSkipInterval()
})()
