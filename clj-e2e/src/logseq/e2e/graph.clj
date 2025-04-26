(ns logseq.e2e.graph
  (:require [logseq.e2e.util :as util]
            [wally.main :as w]))

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
  (util/search "go to all graphs")
  (w/click (w/get-by-label "Go to all graphs"))
  (util/repeat-until-visible 5
                             (format "a[title='logseq/graphs/%s']" graph-name)
                             #(w/click "span:text(\"Refresh\")")))
