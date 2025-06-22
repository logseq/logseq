(ns logseq.e2e.graph
  (:require [clojure.edn :as edn]
            [clojure.string :as string]
            [logseq.e2e.assert :as assert]
            [logseq.e2e.locator :as loc]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(defn- refresh-all-remote-graphs
  []
  (w/click "span:text(\"Refresh\")"))

(defn goto-all-graphs
  []
  (util/search-and-click "Go to all graphs"))

(defn new-graph
  [graph-name enable-sync?]
  (util/search-and-click "Add a DB graph")
  (w/wait-for "h2:text(\"Create a new graph\")")
  (w/click "input[placeholder=\"your graph name\"]")
  (util/input graph-name)
  (when enable-sync?
    (w/click "button#rtc-sync"))
  (w/click "button:text(\"Submit\")")
  (when enable-sync?
    (w/wait-for "button.cloud.on.idle" {:timeout 20000}))
  ;; new graph can blocks the ui because the db need to be created and restored,
  ;; I have no idea why `search-and-click` failed to auto-wait sometimes.
  (util/wait-timeout 1000))

(defn wait-for-remote-graph
  [graph-name]
  (goto-all-graphs)
  (util/repeat-until-visible 5
                             (format "div[data-testid='logseq_db_%s']" graph-name)
                             refresh-all-remote-graphs))

(defn remove-remote-graph
  [graph-name]
  (wait-for-remote-graph graph-name)
  (let [action-btn
        (.first (w/-query (format "div[data-testid='logseq_db_%s'] .graph-action-btn" graph-name)))]
    (w/click action-btn)
    (w/click ".delete-remote-graph-menu-item")
    (w/click "div[role='alertdialog'] button:text('ok')")))

(defn switch-graph
  [to-graph-name wait-sync?]
  (goto-all-graphs)
  (w/click (.last (w/-query (format "div[data-testid='logseq_db_%1$s'] span:has-text('%1$s')" to-graph-name))))
  (when wait-sync?
    (w/wait-for "button.cloud.on.idle" {:timeout 20000}))
  (assert/assert-graph-loaded?))

(defn validate-graph
  []
  (util/search-and-click "(Dev) Validate current graph")
  (assert/assert-is-visible (loc/and ".notifications div" (w/get-by-text "Your graph is valid")))
  (let [content (.textContent (loc/and ".notifications div" (w/get-by-text "Your graph is valid")))
        summary (edn/read-string (subs content (string/index-of content "{")))]
    (w/click ".notifications .ls-icon-x")
    summary))
