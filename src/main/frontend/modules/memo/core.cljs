;; src/main/frontend/modules/memo/core.cljs
(ns frontend.modules.memo.core
  (:require [frontend.modules.memo.storage :as storage]
            [frontend.modules.memo.parser :as parser]
            [frontend.modules.memo.index :as index]
            [frontend.state :as state]
            [logseq.memo.schema :as schema]))

(defn init!
  "Initialize SimpleMem for current repo"
  [repo]
  (storage/ensure-settings-dir! repo)
  (index/init-index! repo))

(defn register-commands!
  []
  (commands/register!
   {:id "logseq.memo/create-setting"
    :name "创建设定"
    :action (fn [] (println "Create setting"))}))

(defn register!
  []
  (init! (state/get-current-repo))
  (register-commands!))