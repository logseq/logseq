;; src/main/frontend/modules/memo/ai/provider.cljs
(ns frontend.modules.memo.ai.provider
  (:require [cljs-http.client :as http]
            [clojure.core.async :as async]))

(def providers
  {:ollama {:base-url "http://localhost:11434"
            :model "llama3"
            :embedding-model "nomic-embed-text"}
   :openai {:api-key ""
            :model "gpt-4"}
   :anthropic {:api-key ""
               :model "claude-3-5-sonnet"}})

(defn get-config [provider-name]
  (get providers provider-name))

(defn generate-embedding [text provider]
  (let [config (get-config provider)]
    (when (= provider :ollama)
      (http/post (str (:base-url config) "/api/embeddings")
                 {:json-params {:model (:embedding-model config)
                               :prompt text}}))))

(defn complete [prompt provider]
  (let [config (get-config provider)]
    (when (= provider :ollama)
      (http/post (str (:base-url config) "/api/generate")
                 {:json-params {:model (:model config)
                               :prompt prompt}})))))