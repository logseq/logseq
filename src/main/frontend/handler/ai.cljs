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
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.modules.ai.prompts :as prompts]
            [frontend.util :as util]))

(defn- text->segments
  [text]
  (let [content (string/trim text)]
    (->> (string/split content #"(?:\r?\n){2,}")
         (remove string/blank?))))

(def default-service :openai)

;; TODO: openai summarize not working great for short text
(defn- get-page-name-from-q
  [q]
  (let [q' (string/replace q "/draw " "")
        result (if (<= (count q') 64) q' (subs q' 0 63))]
    (str "Chat/" (string/replace result "/" "_"))))

(defn new-conversation!
  [service q]
  (let [service (or service default-service)
        page (if q
               (get-page-name-from-q q)
               (str "Chat/" (date/date->file-name (t/now)) "/" (random-uuid)))]
    (page-handler/create! page {:redirect? false
                                :create-first-block? false
                                :additional-tx {:block/type "chat"
                                                :block/properties {:logseq.ai.service service}}})
    (let [id (:db/id (db/entity [:block/name (string/lower-case page)]))]
      (state/set-state! :chat/current-conversation id)
      id)))

(defn chat!
  [q {:keys [conversation-id service on-message on-finished] :as opts
      :or {service default-service}}]
  (let [conversation-id (if conversation-id
                          conversation-id
                          ;; Create conversation
                          ;; TODO: user-friendly page name, could be summarized by AI
                          (new-conversation! service q))
        conversation (->> (db-model/get-chat-conversation conversation-id)
                          (map (fn [id]
                                 (let [b (db/entity id)
                                       type (get-in b [:block/properties :logseq.ai.type])]
                                   {:role (if (or (= type "answer")
                                                  (string/includes? (:block/content b) "#assistant"))
                                            "assistant"
                                            "user")
                                    :content (:block/content b)}))))
        conversation' (concat [{:role "system" :content prompts/assistant}]
                              conversation
                              [{:role "user" :content q}])
        c-e (db/entity conversation-id)
        c-name (:block/name c-e)
        draw? (string/starts-with? (string/lower-case q) "/draw ")
        format (state/get-preferred-format)]
    (when (and c-name
               (empty? conversation)
               (util/uuid-string? (subs c-name (- (count c-name) 36)))) ; initial name
      (let [new-page-name (get-page-name-from-q q)]
        (page-handler/rename! (:block/original-name c-e) new-page-name false)))
    (if draw?
      (p/let [url (ai/generate-image service (string/replace-first q "/draw " "") {})]
        (do
          (editor-handler/insert-page-block-tree conversation-id
                                                [{:content q
                                                  :properties {:logseq.ai.type "question"}
                                                  :children [{:type "image"
                                                              :content ""
                                                              :properties {:logseq.ai.type "answer"
                                                                           :logseq.url url}}]}]
                                                format
                                                {:sibling? true
                                                 :keep-uuid? false
                                                 :edit? false})
          (on-finished)))
      (ai/chat service conversation'
              (assoc opts
                     :on-message on-message
                     :on-finished (fn [result]
                                    (let [answers (text->segments result)
                                          data [{:content q
                                                 :properties {:logseq.ai.type "question"}
                                                 :children (mapv (fn [answer] {:content answer
                                                                               :properties {:logseq.ai.type "answer"}}) answers)}]]
                                      (editor-handler/insert-page-block-tree conversation-id data format
                                                                             {:sibling? true
                                                                              :keep-uuid? false
                                                                              :edit? false})
                                      (on-finished))))))))

(defn open-chat
  []
  (state/sidebar-add-block! (state/get-current-repo) "chat" :chat))
