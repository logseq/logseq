(ns frontend.modules.shortcut.config-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [frontend.modules.shortcut.config :as shortcut-config]
            [frontend.state :as state]))

(deftest graph-db-save-shortcut-does-not-trigger-legacy-save-event
  (testing "mod+s in db graph sends new save-info event"
    (let [events* (atom [])]
      (with-redefs [state/pub-event! (fn [event]
                                       (swap! events* conj event))]
        ((get-in shortcut-config/all-built-in-keyboard-shortcuts
                 [:graph/db-save :fn]))
        (is (= [[:graph/db-save-shortcut]]
               @events*))))))

(deftest graph-db-save-shortcut-electron-uses-backup-flow
  (let [events-source-path (node-path/join (.cwd js/process)
                                           "src"
                                           "main"
                                           "frontend"
                                           "handler"
                                           "events.cljs")
        source (.toString (fs/readFileSync events-source-path) "utf8")]
    (is (not (.includes source "Manual save is no longer required.")))
    (is (.includes source "(persist-db/export-current-graph!"))
    (is (.includes source ":succ-notification? true"))))
