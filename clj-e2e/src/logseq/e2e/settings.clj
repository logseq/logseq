(ns logseq.e2e.settings
  (:require [logseq.e2e.assert :as assert]
            [logseq.e2e.keyboard :as k]
            [wally.main :as w]))

(defn developer-mode
  []
  (w/click "button[title='More'] .ls-icon-dots")
  ;; The settings icon can be re-rendered while the menu is opening, causing
  ;; "element detached" flakiness. Retry a few times.
  (loop [i 0]
    (when (>= i 10)
      (throw (ex-info "failed to open settings menu" {:selector ".ls-icon-settings"})))
    (let [clicked?
          (try
            (when-not (w/visible? ".ls-icon-settings")
              (w/click "button[title='More'] .ls-icon-dots"))
            (w/click ".ls-icon-settings")
            true
            (catch com.microsoft.playwright.TimeoutError _e
              false))]
      (when-not clicked?
        (Thread/sleep 200)
        (recur (inc i)))))
  (w/click "[data-id='advanced']")
  (let [q (.last (w/-query ".ui__toggle [aria-checked='false']"))]
    (when (.isVisible q)
      (w/click q)))
  (k/esc)
  (assert/assert-in-normal-mode?))
