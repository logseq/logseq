(ns frontend.modules.ai.plugin
  (:require [frontend.modules.ai.protocol :as ai-protocol]
            [frontend.search.protocol :as search-protocol]
            [frontend.util :as util]
            ["sse.js" :refer [SSE]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [promesa.core :as p]))

;; TODO: move this to logseq-ai-plugin

(def api "http://localhost:8000/")

(defn- fetch
  [uri opts]
  (util/fetch uri opts p/resolved p/rejected))

(defn -generate-text [q _opts token]
  (p/let [result (fetch (str api "openai/generate_text")
                        {:method "POST"
                         :headers {:Content-Type "application/json"
                                   ;; :authorization (str "Bearer " token)
                                   }
                         :body (js/JSON.stringify
                                (bean/->js {:message q}))})]
    (:result result)))

(defn- -chat
  [conversation {:keys [model on-message on-finished]
                 :or {model "gpt-3.5-turbo"}
                 :as opts} token]
  (let [messages (->> (butlast conversation)
                      (map (fn [m] (-> (assoc m :agent (:role m))
                                       (dissoc :role)))))
        message (:message (last conversation))
        *buffer (atom "")
        sse ^js (SSE. (str api "openai/chat")
                      (bean/->js
                       {:headers {:Content-Type "application/json"
                                  ;; :authorization (str "Bearer " token)
                                  }
                        :method "POST"
                        :payload (js/JSON.stringify
                                  (bean/->js {:messages messages
                                              :new_message message}))}))]
    (.addEventListener sse "message"
                       (fn [e]
                         (let [data (.-data e)]
                           (if (and (string? data)
                                    (= data "[DONE]"))
                             (do
                               (when on-finished (on-finished @*buffer))
                               (.close sse))
                             (try
                               (let [content (-> (bean/->clj (js/JSON.parse data))
                                                 :data)]
                                 (when content
                                   (swap! *buffer str content)
                                   (when on-message (on-message @*buffer))))
                               (catch :default e
                                 (prn "Chat request failed: " e)
                                 (.close sse)))))))

    (.stream sse)))

(defn -generate-image
  [description _opts token]
  (p/let [result (fetch (str api "openai/generate_image")
                        {:method "POST"
                         :headers {:Content-Type "application/json"
                                   ;; :authorization (str "Bearer " token)
                                   }
                         :body (js/JSON.stringify
                                (bean/->js {:text description}))})]
    (:url result)))

(defrecord AIProxySolution [repo token]
  ai-protocol/AI
  (generate-text [_this q opts]
    (-generate-text q opts token))
  (chat [_this conversation opts]
    (-chat conversation opts token))
  (generate-image [this description opts]
    (-generate-image description opts token))
  (speech-to-text [this audio opts])

  search-protocol/Engine
  (query [_this q opts])
  (rebuild-blocks-indice! [_this])
  (transact-blocks! [_this data])
  (truncate-blocks! [_this])
  (remove-db! [_this])
  (query-page [_this q opts])
  (transact-pages! [_this data]))


(comment
  (def langchain (->AIProxySolution (frontend.state/get-current-repo) ""))

  (p/let [result (ai-protocol/generate-text langchain "hello" {})]
    (prn {:result result}))

  (p/let [result (ai-protocol/generate-image langchain "A dog with a cat" {})]
    (prn {:result result}))

  (ai-protocol/chat langchain
                    [{:role "ai"
                      :message "I know everything about Basketball!"}
                     {:role "user"
                      :message "Write a javascript program to list all the players in Spurs"}]
                    {:on-message (fn [message]
                                   (prn "received: " message))
                     :on-finished (fn [] (prn "finished"))})

  )
