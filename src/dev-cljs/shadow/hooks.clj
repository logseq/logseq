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

(defn- env-or
  [key fallback]
  (or (System/getenv key) fallback))

(defn- iso-now
  []
  (.format java.time.format.DateTimeFormatter/ISO_INSTANT (java.time.Instant/now)))

(defn- hook-options
  [args]
  (if (map? (last args))
    (last args)
    {}))

(defn- hook-git-args
  [args]
  (if (map? (last args))
    (butlast args)
    args))

(defn build-metadata-hook
  {:shadow.build/stage :configure}
  [build-state & args]
  (let [{:keys [revision build-time]} (hook-options args)
        defines-in-config (get-in build-state [:shadow.build/config :closure-defines])
        defines-in-options (get-in build-state [:compiler-options :closure-defines])
        revision (or revision
                     (env-or "LOGSEQ_REVISION"
                             (or (exec "git" "describe" (hook-git-args args)) "dev")))
        build-time (or build-time
                       (env-or "LOGSEQ_BUILD_TIME" (iso-now)))]
    (prn ::build-metadata-hook {:revision revision :build-time build-time})
    (-> build-state
        (assoc-in [:shadow.build/config :closure-defines]
                  (assoc defines-in-config
                         'logseq.common.version/REVISION revision
                         'logseq.common.version/BUILD_TIME build-time))
        (assoc-in [:compiler-options :closure-defines]
                  (assoc defines-in-options
                         'logseq.common.version/REVISION revision
                         'logseq.common.version/BUILD_TIME build-time)))))
