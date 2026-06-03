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

(deftest developer-shortcuts-follow-developer-mode
  (testing "developer shortcuts are excluded while developer mode is off"
    (with-redefs [state/developer-mode? (constantly false)]
      (is (not (contains?
                (:shortcut.handler/global-non-editing-only (shortcut-config/build-config))
                :dev/show-block-data)))))

  (testing "developer shortcuts are included after developer mode is on"
    (with-redefs [state/developer-mode? (constantly true)]
      (is (= "(Dev) Show block data"
             (get-in (shortcut-config/build-config)
                     [:shortcut.handler/global-non-editing-only :dev/show-block-data :desc]))))))
