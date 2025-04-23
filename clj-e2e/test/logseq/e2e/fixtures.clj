(ns logseq.e2e.fixtures
  (:require [wally.main :as w]))

;; TODO: save trace
;; TODO: parallel support
(defn open-page
  [f & {:keys [headless]
        :or {headless true}}]
  (w/with-page-open
    (w/make-page {:headless headless
                  :persistent false
                  :slow-mo 100
                  ;; Set `slow-mo` lower to find more flaky tests
                  ;; :slow-mo 30
                  })
    (w/navigate "http://localhost:3002")
    (f)))
