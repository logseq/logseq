(ns logseq.cli.command.id
  "Shared id parsing helpers for CLI commands."
  (:require [clojure.string :as string]
            [logseq.common.util :as common-util]))

(defn valid-id?
  [value]
  (and (number? value) (integer? value)))

(defn parse-id-option
  [value]
  (let [invalid (fn [message]
                  {:ok? false :message message})]
    (cond
      (nil? value)
      {:ok? true :value nil :multi? false}

      (vector? value)
      (cond
        (empty? value) (invalid "id vector must contain at least one id")
        (every? valid-id? value) {:ok? true :value (vec value) :multi? true}
        :else (invalid "id vector must contain only integers"))

      (valid-id? value)
      {:ok? true :value [value] :multi? false}

      (string? value)
      (let [text (string/trim value)]
        (cond
          (string/blank? text)
          (invalid "id is required")

          (string/starts-with? text "[")
          (let [parsed (common-util/safe-read-string {:log-error? false} text)]
            (cond
              (nil? parsed) (invalid "invalid id edn")
              (not (vector? parsed)) (invalid "id must be a vector")
              (empty? parsed) (invalid "id vector must contain at least one id")
              (every? valid-id? parsed) {:ok? true :value (vec parsed) :multi? true}
              :else (invalid "id vector must contain only integers")))

          (re-matches #"-?\d+" text)
          {:ok? true :value [(js/parseInt text 10)] :multi? false}

          :else
          (invalid "id must be a number or vector of numbers")))

      :else
      (invalid "id must be a number or vector of numbers"))))
