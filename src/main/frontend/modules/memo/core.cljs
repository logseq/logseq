;; src/main/frontend/modules/memo/core.cljs
(ns frontend.modules.memo.core
  (:require [frontend.modules.memo.storage :as storage]
            [frontend.modules.memo.parser :as parser]
            [frontend.modules.memo.index :as index]
            [frontend.state :as state]
            [frontend.components.left-sidebar :as left-sidebar]
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
    :callback (fn [] (println "Open create setting modal"))})

  (commands/register!
   {:id "logseq.memo/open-graph"
    :name "打开设定图谱"
    :callback (fn [] (println "Open memo graph view"))})

  (commands/register!
   {:id "logseq.memo/open-inspiration"
    :name "打开灵感建议"
    :callback (fn [] (println "Open inspiration panel"))})

  (commands/register!
   {:id "logseq.memo/check-consistency"
    :name "检查一致性"
    :callback (fn [] (println "Run consistency check"))}))

(defn register-ribbon!
  []
  (left-sidebar/add-icon!
   {:icon "📖"
    :title "设定面板"
    :action (fn [] (state/toggle-panel! :memo-sidebar))})

  (left-sidebar/add-icon!
   {:icon "🕸️"
    :title "设定图谱"
    :action (fn [] (state/open-view! :memo-graph))}))

(defn register!
  []
  (init! (state/get-current-repo))
  (register-commands!)
  (register-ribbon!))