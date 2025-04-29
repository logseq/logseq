(ns logseq.e2e.fixtures
  (:require [logseq.e2e.config :as config]
            [logseq.e2e.playwright-page :as pw-page]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

;; TODO: save trace
;; TODO: parallel support
(defn open-page
  [f & {:keys [headless port]}]
  (w/with-page-open
    (w/make-page {:headless (or headless @config/*headless)
                  :persistent false
                  :slow-mo @config/*slow-mo})
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
                   :slow-mo @config/*slow-mo}
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
  (let [page-opts {:headless @config/*headless
                   :persistent false
                   :slow-mo @config/*slow-mo}
        p @(w/make-page page-opts)
        ctx (.newContext (.browser (.context p)))]
    ;; context for p is no longer needed
    (.close (.context p))
    (w/with-page-open p)              ; use with-page-open to close playwright instance
    (binding [*pw-ctx* ctx]
      (f)
      (.close (.browser *pw-ctx*)))))

(defonce *page-number (atom 0))

(defn new-logseq-page
  [f]
  (util/new-page (str "page " (swap! *page-number inc)))
  (f))
