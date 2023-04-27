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

(defn- text->segments
  [text]
  (let [content (string/trim text)]
    (->> (string/split content #"(?:\r?\n){2,}")
         (remove string/blank?))))

(defn ask!
  [q {:keys [conversation-id service on-message on-finished] :as opts
      :or {service :openai}}]
  (let [conversation-id (if conversation-id
                          conversation-id
                          ;; Create conversation
                          ;; TODO: user-friendly page name, could be summarized by AI
                          (let [page (str "Chat/" (date/date->file-name (t/now)) "/" (random-uuid))]
                            (page-handler/create! page {:redirect? false
                                                        :create-first-block? false
                                                        :additional-tx {:block/type "chat"
                                                                        :block/properties {:logseq.ai.service service}}})
                            (:db/id (db/entity [:block/name (string/lower-case page)]))))]
    (ai/ask-stream service q
                   (assoc opts
                          :on-message on-message
                          :on-finished (fn [result]
                                         (let [answers (text->segments result)
                                               data [{:content q
                                                      :properties {:logseq.ai.type "question"}
                                                      :children (mapv (fn [answer] {:content answer
                                                                                    :properties {:logseq.ai.type "answer"}}) answers)}]
                                               format (state/get-preferred-format)]
                                           (editor-handler/insert-page-block-tree conversation-id true data format false)
                                           (on-finished)))))))

(defn open-chat
  []
  (state/sidebar-add-block! (state/get-current-repo) :chat :chat))
