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
            [frontend.util :as util]
            [logseq.common.path :as path]))

(defn- text->segments
  [text]
  (let [content (string/trim text)]
    (if (string/includes? content "```")
      [content]
      (->> (string/split content #"(?:\r?\n){2,}")
           (remove string/blank?)))))

(def default-service :openai)

(defn open-chat
  []
  (when (state/enable-ai?)
    (state/sidebar-add-block! (state/get-current-repo) "chat" :chat)))

(defn open-ask
  []
  (when (state/enable-ai?)
    (state/pub-event! [:ai/show])))

;; TODO: openai summarize not working great for short text
(defn- get-page-name-from-q
  [q]
  (let [q' (string/replace q "/draw " "")
        result (if (<= (count q') 64) q' (subs q' 0 63))]
    (str "Chat/" (string/replace result "/" "_"))))

(defn new-conversation!
  [q]
  (let [page (if q
               (get-page-name-from-q q)
               (str "Chat/" (date/date->file-name (t/now)) "/" (random-uuid)))]
    (page-handler/create! page {:redirect? false
                                :create-first-block? false
                                :additional-tx {:block/type "chat"
                                                :block/properties {:logseq.ai.service (ai/get-service)}}})
    (let [id (:db/id (db/entity [:block/name (string/lower-case page)]))]
      (state/set-state! :chat/current-conversation id)
      id)))

(defn chat!
  [q {:keys [conversation-id on-message on-finished] :as opts}]
  (let [conversation-id (if conversation-id
                          conversation-id
                          ;; Create conversation
                          ;; TODO: user-friendly page name, could be summarized by AI
                          (new-conversation! q))
        conversation (->> (db-model/get-chat-conversation conversation-id)
                          (map (fn [id]
                                 (let [b (db/entity id)
                                       type (get-in b [:block/properties :logseq.ai.type])]
                                   {:role (if (or (= type "answer")
                                                  (string/includes? (:block/content b) "#assistant"))
                                            "assistant"
                                            "user")
                                    :content (:block/content b)}))))
        conversation' (concat [{:role "system" :content (prompts/get-prompt "Assistant")}]
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
      (p/let [url (ai/generate-image (string/replace-first q "/draw " "") {})]
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
      (ai/chat conversation'
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

(defn generate-text
  [content opts]
  (ai/generate-text content opts))

(defn transcribe
  [block audio-path *transcribing?]
  (let [ext (util/get-file-ext audio-path)]
    (when (contains? #{"mp3" "mp4" "mpeg" "mpga" "m4a" "wav" "webm"} ext)
      (p/let [resp (js/fetch audio-path)
              blob (.blob resp)
              file (js/File. #js [blob]
                             (path/filename audio-path)
                             #js {:type (str "audio/" ext)})]
        (when file
          (reset! *transcribing? true)
          (->
           (p/let [result (ai/speech-to-text file {})]
             (reset! *transcribing? false)
             (let [text result]
               (editor-handler/api-insert-new-block! text
                                                     {:block-uuid (:block/uuid block)
                                                      :sibling? false})))
           (p/catch (fn [error]
                      (reset! *transcribing? false)
                      (prn "Transcribed failed:" error)))))))))
