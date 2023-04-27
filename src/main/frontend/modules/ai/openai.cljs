(ns frontend.modules.ai.openai
  (:require [frontend.modules.ai.protocol :as protocol]
            [frontend.util :as util]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            ["sse.js" :refer [SSE]]))

(defrecord OpenAI [token]
  protocol/AI
  (ask [_this q {:keys [model]
                 :or {model "gpt-3.5-turbo"}}]
    (util/fetch "https://api.openai.com/v1/chat/completions"
                {:method "POST"
                 :headers {:Content-Type "application/json"
                           :authorization (str "Bearer " token)}
                 :body (js/JSON.stringify
                        (bean/->js {:model model
                                    :messages [{:role "user"
                                                :content q}]}))}
                (fn [result]
                  (->> (:choices result)
                       (map #(get-in % [:message :content]))))
                (fn [failed-resp]
                  failed-resp)))
  (chat [_this conversation {:keys [model on-message on-finished]
                             :or {model "gpt-3.5-turbo"}}]
    (let [*buffer (atom "")
          sse ^js (SSE. "https://api.openai.com/v1/chat/completions"
                        (bean/->js
                         {:headers {:Content-Type "application/json"
                                    :authorization (str "Bearer " token)}
                          :method "POST"
                          :payload (js/JSON.stringify
                                    (bean/->js {:model model
                                                :stream true
                                                :messages conversation}))}))]
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
  (summarize [this content opts])
  (translate [this content opts])
  (generate-text [this description opts])
  (generate-image [this description opts])
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
  )
