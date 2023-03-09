(ns frontend.handler.ai
  (:require [frontend.state :as state]
            [frontend.modules.ai.core :as ai]
            [frontend.date :as date]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.db :as db]))

(def default-service :openai)

(defn open-dialog!
  []
  (let [{:keys [active?]} (:ui/ai-dialog @state/state)]
    (when-not active?
      (state/set-state! [:ui/ai-dialog :active?] true))))

(defn close-dialog!
  []
  (let [{:keys [active?]} (:ui/ai-dialog @state/state)]
    (state/set-state! :ui/ai-dialog nil)))

(defn ask!
  [q {:keys [parent-block] :as opts}]
  (-> (p/let [result (ai/ask default-service q opts)]
        (js/console.log "Question: " q)
        (js/console.log "Answers: " result)
        (let [parent-id (if parent-block
                          (:db/id parent-block)
                          (let [page (str "Chat/" (date/date->file-name (t/now)))]
                            (page-handler/create! page {:redirect? false
                                                        :create-first-block? false})
                            (:db/id (db/entity [:block/name (string/lower-case page)]))))]
          (editor-handler/insert-block-tree-after-target
           parent-id
           false
           [{:content q
             :children (map (fn [content] {:content content}) result)}]
           (state/get-preferred-format)
           false)))
      (p/catch (fn [error]
                 ;; TODO: UI
                 (log/error :exception error)))))
