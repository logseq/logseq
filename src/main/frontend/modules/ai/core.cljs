(ns frontend.modules.ai.core
  (:require [frontend.modules.ai.protocol :as protocol]
            [frontend.modules.ai.openai :as openai]
            [frontend.state :as state]))

(defn- get-record
  [kind]
  (case kind
    :openai
    (openai/->OpenAI (:open-ai/token @state/state))

    nil))

(defn ask
  [service q opts]
  (protocol/ask (get-record service) q opts))

(defn chat
  [service conversation opts]
  (protocol/chat (get-record service) conversation opts))

(defn summarize
  [service q opts]
  (protocol/summarize (get-record service) q opts))

(defn generate-image
  [service description opts]
  (protocol/generate-image (get-record service) description opts))
