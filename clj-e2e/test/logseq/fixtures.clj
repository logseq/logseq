(ns logseq.fixtures
  (:require [wally.main :as w]))

;; TODO: change headless to true on CI
(defn open-page
  [f & {:keys [headless]
        :or {headless false}}]
  (w/with-page-open
    (w/make-page {:headless headless
                  :persistent false})
    (w/navigate "http://localhost:3002")
    (f)))
