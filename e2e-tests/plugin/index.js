async function main () {
  logseq.UI.showMsg('Hi, e2e tests from a local plugin!')

  // await (new Promise(resolve => setTimeout(resolve, 3000)))

  let msg = 0

  const logPane = (input) => {
    logseq.provideUI({
      key: `log-${++msg}`,
      path: `#a-plugin-for-e2e-tests > ul`,
      template: `<li>${input}</li>`,
    })
  }

  // log pane
  logseq.provideUI({
    key: 'logseq-e2e-tests',
    template: `<div id="a-plugin-for-e2e-tests">
    <h2>Plugin e2e tests ...</h2>
    <ul></ul>
    </div>`,
    path: 'body',
    style: {
      width: '300px',
      position: 'fixed',
      top: '300px',
      left: '300px',
      zIndex: 99,
    },
  })

  logseq.provideStyle(`
   #a-plugin-for-e2e-tests {
     padding: 20px;
     background-color: red;
     color: white;
     width: 300px;
   }
  `)

  let dbChangedDid = false
  let blockChangedDid = false

  // hook db change
  logseq.DB.onChanged((e) => {
    if (dbChangedDid) return
    logPane(`[DB] hook: changed`)
    dbChangedDid = true
  })

  logseq.DB.onBlockChanged('65a0babb-4a8b-4cfc-8179-6ece0375a5b6',
    (e) => {
      if (blockChangedDid) return
      logPane(`[DB] hook: block changed`)
      blockChangedDid = true
    })
}

// bootstrap
logseq.ready(main).catch(null)