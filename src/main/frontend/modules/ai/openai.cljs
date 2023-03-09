(ns frontend.modules.ai.openai
  (:require [frontend.modules.ai.protocol :as protocol]
            [frontend.util :as util]
            [cljs-bean.core :as bean]))

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
  (summarize [this content opts])
  (translate [this content opts])
  (generate-text [this description opts])
  (generate-image [this description opts])
  (speech-to-text [this audio opts])
  (transcription [this audio opts]))

(comment
  (def open-ai (->OpenAI (:open-ai/token @frontend.state/state)))

  (protocol/ask open-ai "What's logseq?" {})

  ;; {:result {:status 200, :success true, :body {:id "chatcmpl-6s5E1oW3DFvzuds9zWDIIMW49hxSo", :object "chat.completion", :created 1678347817, :model "gpt-3.5-turbo-0301", :usage {:prompt_tokens 12, :completion_tokens 119, :total_tokens 131}, :choices [{:message {:role "assistant", :content "\n\nLogseq is a personal knowledge management and note-taking tool that is used for creating and organizing ideas and notes in a hierarchical and linked form. This tool is designed to help people to capture and organize their thoughts, to-do lists, project plans, and other ideas in a way that is easy to manage and access. It offers a range of features such as graph visualization, markdown formatting, task management, smart blocks, and integrations with other tools like Roam Research, Obsidian, and Notion. The software can be run locally on your computer or accessed through a web browser."}, :finish_reason "stop", :index 0}]}, :headers {"openai-organization" "user-wszz12mmidc9hm2pniid1miq", "content-type" "application/json", "access-control-allow-origin" "*", "content-length" "882", "openai-version" "2020-10-01", "strict-transport-security" "max-age=15724800; includeSubDomains", "openai-processing-ms" "4902", "date" "Thu, 09 Mar 2023 07:43:42 GMT", "x-request-id" "fe837c73411e1f277b3672a8c255607f", "openai-model" "gpt-3.5-turbo-0301", "cache-control" "no-cache, must-revalidate"}, :trace-redirects ["https://api.openai.com/v1/chat/completions" "https://api.openai.com/v1/chat/completions"], :error-code :no-error, :error-text ""}}
  )
