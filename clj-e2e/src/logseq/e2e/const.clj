(ns logseq.e2e.const)

(def *page1
  "this 'page' means playwright-page, not logseq-page. it points to the client1 when testing rtc"
  (atom nil))

(def *page2
  "this 'page' means playwright-page, not logseq-page. it points to the client2 when testing rtc"
  (atom nil))

(def ^:dynamic *graph-name* nil)
