(ns frontend.modules.ai.core
  "AI service"
  (:require [frontend.modules.ai.protocol :as protocol]
            [frontend.modules.ai.openai :as openai]
            [frontend.state :as state]
            [frontend.modules.ai.plugin-example :as proxy]
            [frontend.db :as db]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [clojure.string :as string]
            [logseq.common.path :as path]
            [frontend.config :as config]))

(defn get-service
  []
  (state/sub :ai/current-service))

(defn get-all-services
  []
  (concat
   [{:name "Built-in OpenAI"}]
   (vals (state/get-all-plugin-ai-engines))))

(defn- get-record
  []
  (let [service (get-service)]
    (when-let [repo (state/get-current-repo)]
      (case service
        ;; TODO: debug purpose
        "AI Proxy"
        (proxy/->AIProxy repo "")

        (openai/->OpenAI repo (:open-ai/token @state/state))))))

(defn get-current-conversation
  []
  (when-let [id (state/sub :chat/current-conversation)]
    (when (db/entity id)
      id)))

(defn generate-text
  [q opts]
  (protocol/generate-text (get-record) q opts))

(defn chat
  [conversation opts]
  (protocol/chat (get-record) conversation opts))

(defn generate-image
  [description opts]
  (p/let [url (protocol/generate-image (get-record) description opts)]
    (when (string/starts-with? url "http")
      (p/let [image (str (js/Date.now) ".png")
              path (str "assets/ai-generated-" image)
              resp (js/fetch url)
              buffer (.arrayBuffer resp)
              repo (state/get-current-repo)
              _ (fs/write-file! repo
                                (config/get-repo-dir repo)
                                path
                                buffer
                                nil)]
        path))))

(defn speech-to-text
  [audio-file opts]
  (protocol/speech-to-text (get-record) audio-file opts))

(defn text-to-speech
  [text opts]
  (protocol/text-to-speech (get-record) text opts))
