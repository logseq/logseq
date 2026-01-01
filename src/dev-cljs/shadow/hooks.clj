(ns shadow.hooks
  (:require [clojure.java.shell :refer [sh]]
            [clojure.string :as string]))

;; copied from https://gist.github.com/mhuebert/ba885b5e4f07923e21d1dc4642e2f182
(defn exec [& cmd]
  (let [cmd (string/split (string/join " " (flatten cmd)) #"\s+")
        _ (println (string/join " " cmd))
        {:keys [exit out err]} (apply sh cmd)]
    (if (zero? exit)
      (when-not (string/blank? out)
        (string/trim out))
      (println err))))

(defn git-revision-hook
  {:shadow.build/stage :configure}
  [build-state & args]
  (let [defines-in-config (get-in build-state [:shadow.build/config :closure-defines])
        defines-in-options (get-in build-state [:compiler-options :closure-defines])
        revision (exec "git" "describe" args)]
    (prn ::git-revision-hook revision)
    (-> build-state
        (assoc-in [:shadow.build/config :closure-defines]
                  (assoc defines-in-config 'frontend.config/REVISION revision))
        (assoc-in [:compiler-options :closure-defines]
                  (assoc defines-in-options 'frontend.config/REVISION revision)))))
