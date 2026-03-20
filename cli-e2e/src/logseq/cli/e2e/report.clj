(ns logseq.cli.e2e.report
  (:require [clojure.string :as string]))

(defn format-missing-coverage
  [{:keys [missing-commands missing-options]}]
  (str
   "Missing coverage\n"
   (when (seq missing-commands)
     (str "Commands:\n"
          (string/join "\n" (map #(str "- " %) missing-commands))
          "\n"))
   (string/join
    "\n"
    (keep (fn [[scope options]]
            (when (seq options)
              (str (name scope) " options:\n"
                   (string/join "\n" (map #(str "- " %) options)))))
          missing-options))))
