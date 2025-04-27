(ns logseq.e2e.graph
  (:require [logseq.e2e.assert :as assert]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(defn- refresh-all-remote-graphs
  []
  (w/click "span:text(\"Refresh\")"))

(defn goto-all-graphs
  []
  (util/search "go to all graphs")
  (w/click (w/get-by-label "Go to all graphs")))

(defn new-graph
  [graph-name enable-sync?]
  (util/search "add a db graph")
  (w/click (w/get-by-label "Add a DB graph"))
  (w/wait-for "h2:text(\"Create a new graph\")")
  (w/click "input[placeholder=\"your graph name\"]")
  (util/input graph-name)
  (when enable-sync?
    (w/click "button#rtc-sync"))
  (w/click "button:text(\"Submit\")")
  (when enable-sync?
    (w/wait-for "button.cloud.on.idle" {:timeout 20000})))

(defn wait-for-remote-graph
  [graph-name]
  (goto-all-graphs)
  (util/repeat-until-visible 5
                             (format "div[aria-label='e2e logseq_db_%s']" graph-name)
                             refresh-all-remote-graphs))

(defn remove-remote-graph
  [graph-name]
  (wait-for-remote-graph graph-name)
  (w/click (format "div[aria-label='e2e logseq_db_%s'] a:has-text(\"Remove (server)\")" graph-name))
  (w/click "div[role='alertdialog'] button:text('ok')"))

(defn switch-graph
  [to-graph-name]
  (goto-all-graphs)
  (w/click (format "div[aria-label='e2e logseq_db_%1$s'] span:text('%1$s')" to-graph-name))
  (assert/assert-graph-loaded?))
