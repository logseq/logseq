;; src/main/frontend/modules/memo/core.cljs
(ns frontend.modules.memo.core
  (:require [frontend.modules.memo.storage :as storage]
            [frontend.modules.memo.parser :as parser]
            [frontend.modules.memo.index :as index]
            [frontend.state :as state]
            [frontend.handler.command-palette :as command-palette]
            [logseq.memo.schema :as schema]))

(defn init!
  "Initialize SimpleMem for current repo"
  [repo]
  (storage/ensure-settings-dir! repo)
  (index/init-index! repo))

(defn register-commands!
  []
  (command-palette/register
   {:id :logseq.memo/create-setting
    :desc "SimpleMem: 创建设定"
    :action (fn [] (println "Open create setting modal"))})

  (command-palette/register
   {:id :logseq.memo/open-graph
    :desc "SimpleMem: 打开设定图谱"
    :action (fn [] (state/set-state! :ui/memo-graph-open? true))})

  (command-palette/register
   {:id :logseq.memo/open-inspiration
    :desc "SimpleMem: 打开灵感建议"
    :action (fn [] (println "Open inspiration panel"))})

  (command-palette/register
   {:id :logseq.memo/check-consistency
    :desc "SimpleMem: 检查一致性"
    :action (fn [] (println "Run consistency check"))}))

(defn register!
  []
  (init! (state/get-current-repo))
  (register-commands!))