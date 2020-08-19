(ns frontend.text
  (:require [frontend.config :as config]
            [frontend.util :as util]
            [clojure.string :as string]))

(defn remove-level-spaces
  [text format]
  (if-not (string/blank? text)
    (let [pattern (util/format
                   "^[%s]+\\s?"
                   (config/get-block-pattern format))]
      (string/replace-first text (re-pattern pattern) ""))))
