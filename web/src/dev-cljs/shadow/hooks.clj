(ns shadow.hooks
  (:require [clojure.java.shell :refer [sh]]
            [clojure.string :as str]))

;; copied from https://gist.github.com/mhuebert/ba885b5e4f07923e21d1dc4642e2f182
(defn exec [& cmd]
  (let [cmd (str/split (str/join " " (flatten cmd)) #"\s+")
        _ (println (str/join " " cmd))
        {:keys [exit out err]} (apply sh cmd)]
    (if (zero? exit)
      (when-not (str/blank? out)
        (println out))
      (println err))))

(defn purge-css
  {:shadow.build/stage :flush}
  [state {:keys [css-source
                 js-globs
                 public-dir]}]
  (case (:shadow.build/mode state)
    :release
    (exec "purgecss --css " css-source
          (for [content (if (string? js-globs) [js-globs] js-globs)]
            (str "--content " content))
          "-o" public-dir)

    :dev
    (do
      (exec "mkdir -p" public-dir)
      (exec "cp" css-source (str public-dir "/" (last (str/split css-source #"/"))))))
  state)
