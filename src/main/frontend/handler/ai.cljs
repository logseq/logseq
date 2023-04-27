(ns frontend.handler.ai
  (:require [frontend.state :as state]
            [frontend.modules.ai.core :as ai]
            [frontend.date :as date]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.page :as page-handler]
            [frontend.modules.outliner.core :as outliner-core]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.db :as db]))

(defn- text->segments
  [text]
  (let [content (string/trim text)]
    (->> (string/split content #"(?:\r?\n){2,}")
         (remove string/blank?))))

(defn ask!
  [q {:keys [conversation-id service] :as opts
      :or {service :openai}}]
  (let [conversation-id (if conversation-id
                          conversation-id
                          ;; Create conversation
                          ;; TODO: user-friendly page name, could be summarized by AI
                          (let [page (str "Chat/" (date/date->file-name (t/now)) "/" (random-uuid))]
                            (page-handler/create! page {:redirect? false
                                                        :create-first-block? false
                                                        :additional-tx (outliner-core/block-with-timestamps
                                                                        {:block/type "chat"
                                                                         :block/properties {:logseq.ai.service service}})})
                            (:db/id (db/entity [:block/name (string/lower-case page)]))))]
    (-> (p/let [result (ai/ask service q opts)
                result (first result)]
          (js/console.log "Question: " q)
          (js/console.log "Answers: " result)
          (let [answers (text->segments result)
                data [{:content q
                       :properties {:logseq.ai.type "question"}
                       :children (mapv (fn [answer] {:content answer
                                                     :properties {:logseq.ai.type "answer"}}) answers)}]
                format (state/get-preferred-format)]
            (editor-handler/insert-page-block-tree conversation-id false data format false)))
        (p/catch (fn [error]
                   ;; TODO: UI
                   (log/error :exception error))))))

(defn open-chat
  []
  )
