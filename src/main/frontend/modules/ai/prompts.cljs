(ns frontend.modules.ai.prompts)

(def prompts
  (atom
   [{:name "Assistant"
     :description "assistant"
     :prompt "You are a helpful assistant. Answer as concisely as possible."}

    {:name "Summarize"
     :description "Summarize text"
     :prompt "Summarize text:"}

    {:name "Translate"
     :description "Translate"
     :prompt "Translate text to %s:"}

    {:name "Fix grammar and spelling"
     :description "Fix grammar and spelling in text:"
     :prompt "Fix grammar and spelling in text:"}]))

(defn get-prompt
  [name]
  (some #(when (= name (:name %))
           (:prompt %))
        @prompts))
