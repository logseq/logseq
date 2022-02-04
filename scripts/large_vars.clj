#!/usr/bin/env bb

(ns large-vars
  "This script detects vars that are too large and that make it difficult for
  the team to maintain and understand them."
  (:require [babashka.pods :as pods]
            [clojure.set :as set]))

(pods/load-pod 'clj-kondo/clj-kondo "2021.12.19")
(require '[pod.borkdude.clj-kondo :as clj-kondo])

(def config
  ;; TODO: Discuss with team and agree on lower number
  {:max-lines-count 100
   ;; Vars with these metadata flags are allowed. Name should indicate the reason
   ;; it is allowed
   :metadata-exceptions #{::data-var}})

(defn -main
  [args]
  (let [paths (or args ["src"])
        {{:keys [var-definitions]} :analysis}
        (clj-kondo/run!
         {:lint paths
          :config {:output {:analysis {:var-definitions {:meta true}}}}})
        vars (->> var-definitions
                  (keep (fn [m]
                          (let [lines-count (inc (- (:end-row m) (:row m)))]
                            (when (and (> lines-count (:max-lines-count config))
                                       (empty? (set/intersection (set (keys (:meta m)))
                                                                 (:metadata-exceptions config))))
                              {:var (:name m)
                               :lines-count lines-count
                               :filename (:filename m)}))))
                  (sort-by :lines-count (fn [x y] (compare y x))))]
    (if (seq vars)
      (do (prn vars)
        (System/exit 1))
      (println "All vars are below the max size!"))))

(when (= *file* (System/getProperty "babashka.file"))
  (-main *command-line-args*))
