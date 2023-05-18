(ns frontend.modules.ai.prompts
  (:require [frontend.db.model :as db-model]
            [frontend.util.property :as property]
            [frontend.util :as util]))

;; TODO: plugins can register prompts too
(def prompts
  (atom
   [{:name "Assistant"
     :prompt "You are a helpful assistant. Answer as concisely as possible."}

    {:name "Summarize"
     :prompt "Summarize text:"}

    {:name "Translate"
     :prompt "Translate text to %s. Only the translated text can be returned."}

    {:name "Fix grammar and spelling"
     :prompt "Fix grammar and spelling in text:"}]))

(defn get-all-prompts
  []
  (let [custom-prompts (->> (db-model/get-template-instances "ai-prompt")
                            (map (fn [b]
                                   {:prompt (property/remove-properties (:block/format b) (:block/content b))
                                    :name (get-in b [:block/properties :name])})))]
    (->>
     (concat @prompts custom-prompts)
     (util/distinct-by :name))))

(defn get-prompt
  [name]
  (let [prompts (get-all-prompts)]
    (some #(when (= name (:name %))
             (:prompt %))
          prompts)))
