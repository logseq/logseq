(ns logseq.e2e.fixtures
  (:require [wally.main :as w]))

;; TODO: save trace
;; TODO: parallel support
(defn open-page
  [f & {:keys [headless port]
        :or {headless true
             port 3002}}]
  (w/with-page-open
    (w/make-page {:headless headless
                  :persistent false
                  :slow-mo 100
                  ;; Set `slow-mo` lower to find more flaky tests
                  ;; :slow-mo 30
                  })
    (w/navigate (str "http://localhost:" port))
    (f)))

(def *page1 (atom nil))
(def *page2 (atom nil))

(defn open-2-pages
  "Use `*page1` and `*page2` in `f`"
  [f & {:keys [headless port]
        :or {headless true
             port 3002}}]
  (let [p1 (w/make-page {:headless headless
                         :persistent false
                         :slow-mo 100})
        p2 (w/make-page {:headless headless
                         :persistent false
                         :slow-mo 100})]
    (run!
     #(w/with-page %
        (w/navigate (str "http://localhost:" port)))
     [p1 p2])

    (reset! *page1 p1)
    (reset! *page2 p2)
    (binding [w/*page* (delay (throw (ex-info "Don't use *page*, use *page1* and *page2* instead" {})))]
      (f))
    (w/with-page-open p1)
    (w/with-page-open p2)))
