/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
; (async () => {
  const data = [
    // ここにデータを突っ込む
  ]

  const domChecker = (selector) =>
    new Promise((resolve) => {
      const timer = setInterval(() => {
        const node = document.querySelector(selector)
        if (node) {
          clearInterval(timer)
          resolve()
        }
      }, 500)
    })

  const selectProject = async (projectIndex, targetProjectCode) => {
    if (!targetProjectCode) {
      return
    }
    console.log(projectIndex, targetProjectCode)

    const dataListSelector = `div[data-control-name=DataTable2] #rootContent_content .dyn-gridScrollRegion > table > tbody`

    // プロジェクト選択アイコンをクリック
    document
        .querySelector(`div[data-control-name=IconPjSearch${projectIndex}]`)
        .querySelector('div[data-bind]')
        .click()

    // テーブル生成待ち
    await domChecker(dataListSelector)

    console.log('データリスト生成確認')

    // 検索検索条件クリア
    const searchInput = document.querySelector(
      'input[appmagic-control=txtPjSearchBoxtextbox]',
    )
    searchInput.value = ''
    searchInput.dispatchEvent(
      new Event('input', { bubbles: true, cancelable: true }),
    )

    // クリア待ち
    await domChecker('div[data-control-name=DataTable2] #rootContent_content .dyn-gridScrollRegion > table > tbody > tr.dyn-row')

    console.log('検索条件クリア確認')

    // 指定のプロジェクトを選択
    document.querySelector(dataListSelector)
      .childNodes.forEach((record) => {
        const projectCode = record.childNodes[2].innerText.trim()
        if (targetProjectCode === projectCode) {
          console.log('found!')
          record.click()
        }
      })
    
    // 選択ボタンクリック
    document.querySelector('div[data-control-name=btnPjSelect] button').click()

    // 選択画面閉じられ待ち
    await domChecker('div[data-control-name="txtEmpName"]')

    console.log('閉じた')
  }

  const setProjectCode = async (record) => {
    let projectIndex = 1
    for (const [idx, projectCode] of Object.entries(record)) {
      if (Number(idx) > 3) {
        await selectProject(projectIndex++, projectCode)
      }
    }
  }

  const handleTextTypeField = (node, callback) => {
    if (node) {
      callback(node)
      node.dispatchEvent(
        new Event('input', { bubbles: true, cancelable: true }),
      )
    }
  }

  const handleListboxFiled = (node, callback) => {
    if (node) {
      node.click()
      const targetId = node.getAttribute('aria-owns')
      const list = document.getElementById(targetId)
      callback(list)
    }
  }

  const handleField = (type, controlName, value) => {
    switch (type) {
      case 'textarea':
      case 'textbox':
        handleTextTypeField(
          document
            .querySelector(`div[data-control-name=${controlName}]`)
            .querySelector(`[appmagic-control=${controlName}${type}]`),
          (node) => {
            node.value = value
          },
        )
        break
      case 'listbox':
        handleListboxFiled(
          document
            .querySelector(`div[data-control-name=${controlName}]`)
            .querySelector('div[aria-haspopup=listbox]'),
          (listbox) => {
            listbox.querySelectorAll('ul > li').forEach((list) => {
              const selected = list.getAttribute('aria-selected')
              const time = list.querySelector('span').innerHTML
              if (time === value && selected === 'false') {
                list.click()
              }
            })
            // TODO: リストボックスを閉じる
          },
        )
        break
      default:
        break
    }
  }

  const handleWorkHourField = (startOrEnd, day, value) =>
    handleField('listbox', `cmbWork${startOrEnd}Hour${day}`, value)
  const handlePlaceField = (day, value) =>
    handleField('textarea', `txtWorkPlace${day}`, value)
  const handleProjectField = (day, index, value) =>
    handleField('textbox', `txtInHour${day}_${index + 1}`, value)

  const setWorktime = (record) => {
    const [isoDate, startTime, endTime, place] = record
    const projectTimes = record.slice(-10)

    // 日付が入力されていない行は無視する
    if (!isoDate) {
      return
    }

    const date = new Date(isoDate).getDate()
    // 作業開始時間
    handleWorkHourField('Start', date, startTime)
    // 作業終了時間
    handleWorkHourField('End', date, endTime)
    // 作業場所
    handlePlaceField(date, place)
    // 作業時間
    projectTimes.forEach((time, i) => handleProjectField(date, i, time))
  }

  const createMask = (text) => {
    const mask = document.getElementById('spc-mask')
    if (mask) {
      return mask
    }
    const wrapper = document.createElement('div')
    const alert = document.createElement('div')
    wrapper.id = 'spc-mask'
    wrapper.style.position = 'absolute'
    wrapper.style.top = 0
    wrapper.style.bottom = 0
    wrapper.style.left = 0
    wrapper.style.right = 0
    wrapper.style.backgroundColor = 'rgba(0, 0, 0, 0.2)'
    wrapper.style.display = 'flex'
    wrapper.style.justifyContent = 'center'
    wrapper.style.alignItems = 'center'
    alert.style.padding = '2rem'
    alert.style.width = '300px'
    alert.style.textAlign = 'center'
    alert.style.backgroundColor = 'white'
    alert.style.borderRadius = '12px'
    alert.innerHTML = text
    wrapper.appendChild(alert)
    document.body.appendChild(wrapper)
    return wrapper
  }

  let mask

  try {
    mask = createMask('自動入力中...')

    for (const [row, record] of Object.entries(data)) {
      if (Number(row) === 0) {
        console.log('プロジェクトコードセット')
        // 1 行目はプロジェクトコードをセットする
        await setProjectCode(record)
      } else {
        // 2行目以降は作業時間などのセット
        console.log('作業時間セット', record[0])
        setWorktime(record)
      }
    }

  } catch (e) {
    alert('エラー起きたっぽい')
  } finally {
    mask.remove()
  }
})()
