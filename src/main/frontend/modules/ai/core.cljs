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

(defn generate-text
  [service q opts]
  (protocol/generate-text (get-record service) q opts))

(defn chat
  [service conversation opts]
  (protocol/chat (get-record service) conversation opts))

(defn generate-image
  [service description opts]
  (protocol/generate-image (get-record service) description opts))
