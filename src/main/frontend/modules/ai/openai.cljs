(ns frontend.modules.ai.openai
  (:require [frontend.modules.ai.protocol :as protocol]
            [frontend.util :as util]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.modules.ai.prompts :as prompts]
            ["sse.js" :refer [SSE]]))

(defn- -ask
  [q {:keys [model]
      :or {model "gpt-3.5-turbo"}
      :as opts} token]
  (util/fetch "https://api.openai.com/v1/completions"
              {:method "POST"
               :headers {:Content-Type "application/json"
                         :authorization (str "Bearer " token)}
               :body (js/JSON.stringify
                      (bean/->js (merge
                                  {:model model
                                   :prompt q}
                                  opts)))}
              (fn [result]
                (->> (:choices result)
                     first
                     :text
                     string/trim))
              (fn [failed-resp]
                failed-resp)))

(defn- -chat
  [conversation {:keys [model on-message on-finished]
                 :or {model "gpt-3.5-turbo"}
                 :as opts} token]
  (let [*buffer (atom "")
        sse ^js (SSE. "https://api.openai.com/v1/chat/completions"
                      (bean/->js
                       {:headers {:Content-Type "application/json"
                                  :authorization (str "Bearer " token)}
                        :method "POST"
                        :payload (js/JSON.stringify
                                  (bean/->js (merge
                                              {:model model
                                               :stream true
                                               :messages conversation}
                                              (dissoc opts
                                                      :on-message
                                                      :on-finished
                                                      :conversation-id))))}))]
    (.addEventListener sse "message"
                       (fn [e]
                         (let [data (.-data e)]
                           (if (and (string? data)
                                    (= data "[DONE]"))
                             (do
                               (when on-finished (on-finished @*buffer))
                               (.close sse))
                             (try
                               (let [result (-> (bean/->clj (js/JSON.parse data))
                                                :choices
                                                first)
                                     content (get-in result [:delta :content])]
                                 (when content
                                   (swap! *buffer str content)
                                   (when on-message (on-message @*buffer))))
                               (catch :default e
                                 (prn "OpenAI request failed: " e)
                                 (.close sse)))))))

    (.stream sse)))

(defn- -generate-image
  [prompt opts token]
  (util/fetch "https://api.openai.com/v1/images/generations"
              {:method "POST"
               :headers {:Content-Type "application/json"
                         :authorization (str "Bearer " token)}
               :body (js/JSON.stringify
                      (bean/->js (merge
                                  {:prompt prompt
                                   :n 1
                                   :size "1024x1024"}
                                  opts)))}
              (fn [result]
                (->> (:data result)
                     first
                     :url))
              (fn [failed-resp]
                failed-resp)))

(defrecord OpenAI [token]
  protocol/AI
  (ask [_this q opts]
    (-ask q opts token))
  (chat [_this conversation opts]
    (-chat conversation opts token))
  (summarize [this content opts]
    (let [content' (util/format (get opts :prompt prompts/summarize) content)]
      (protocol/ask this
                    content'
                    (merge
                     {:model "text-davinci-003"
                      :max_tokens 200
                      :temperature 1}
                     opts))))
  (translate [this content opts])
  (generate-image [this description opts]
    (-generate-image description opts token))
  (speech-to-text [this audio opts])
  (transcription [this audio opts]))

(comment
  (def open-ai (->OpenAI (:open-ai/token @frontend.state/state)))

  (protocol/ask open-ai "What's logseq?" {})

  (protocol/chat open-ai [{:role :user
                           :message "What's logseq?"}] {:on-message (fn [message]
                                                               (prn "received: " message))
                                                 :on-finished (fn [message]
                                                                (prn "finished: " message))})

  (protocol/summarize open-ai "- How to reply `what's up`?
        - You can respond with a casual greeting or update on your current state such as "not much, just hanging in there" or "just busy with work, and you?"
" {})
  )
