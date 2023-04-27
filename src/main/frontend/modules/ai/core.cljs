(ns frontend.modules.ai.core
  (:require [frontend.modules.ai.protocol :as protocol]
            [frontend.modules.ai.openai :as openai]
            [frontend.state :as state]))

(defn- get-record
  [kind]
  (prn "kind: " kind)
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
