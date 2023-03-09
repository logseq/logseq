(ns frontend.handler.ai
  (:require [frontend.state :as state]
            [frontend.modules.ai.core :as ai]
            [lambdaisland.glogi :as log]
            [promesa.core :as p]))

(def default-service :openai)

(defn open-dialog!
  []
  (let [{:keys [active?]} (:ui/ai-dialog @state/state)]
    (when-not active?
      (state/set-state! [:ui/ai-dialog :active?] true))))

(defn close-dialog!
  []
  (let [{:keys [active?]} (:ui/ai-dialog @state/state)]
    (when-not active?
      (state/set-state! [:ui/ai-dialog :active?] false))))

(defn ask!
  [q opts]
  (-> (p/let [result (ai/ask default-service q opts)]
        (js/console.log "Question: " q)
        (js/console.log "Answers: " result))
      (p/catch (fn [error]
                 ;; TODO: UI
                 (log/error :exception error)))))
