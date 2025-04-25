(ns logseq.e2e.fixtures
  (:require [wally.main :as w]
            [logseq.e2e.config :as config]
            [logseq.e2e.playwright-page :as pw-page]))

;; TODO: save trace
;; TODO: parallel support
(defn open-page
  [f & {:keys [headless port]}]
  (w/with-page-open
    (w/make-page {:headless (or headless @config/*headless)
                  :persistent false
                  :slow-mo 100
                  ;; Set `slow-mo` lower to find more flaky tests
                  ;; :slow-mo 30
                  })
    (w/navigate (str "http://localhost:" (or port @config/*port)))
    (f)))

(def *page1 (atom nil))
(def *page2 (atom nil))

(defn open-2-pages
  "Use `*page1` and `*page2` in `f`"
  [f & {:keys [headless port]}]
  (let [headless (or headless @config/*headless)
        page-opts {:headless headless
                   :persistent false
                   :slow-mo 100}
        p1 (w/make-page page-opts)
        p2 (w/make-page page-opts)
        port' (or port @config/*port)]
    (run!
     #(w/with-page %
        (w/navigate (str "http://localhost:" port')))
     [p1 p2])

    (reset! *page1 p1)
    (reset! *page2 p2)
    (binding [w/*page* (delay (throw (ex-info "Don't use *page*, use *page1* and *page2* instead" {})))]
      (f))
    (w/with-page-open p1)
    (w/with-page-open p2)))

(def ^:dynamic *pw-ctx* nil)
(defn open-new-context
  "create a new playwright-context in `*pw-ctx*`"
  [f]
  (let [page-opts {:headless false
                   :persistent false
                   :slow-mo 100}
        p @(w/make-page page-opts)
        ctx (.newContext (.browser (.context p)))]
    ;; context for p is no longer needed
    (.close (.context p))
    (binding [*pw-ctx* ctx]
      (f)
      (pw-page/close-pw-ctx *pw-ctx*))))
