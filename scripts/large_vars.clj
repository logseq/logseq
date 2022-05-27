#!/usr/bin/env bb

(ns large-vars
  "This script detects vars that are too large and that make it difficult for
  the team to maintain and understand them."
  (:require [babashka.pods :as pods]
            [clojure.pprint :as pprint]
            [clojure.edn :as edn]
            [clojure.set :as set]))

(pods/load-pod 'clj-kondo/clj-kondo "2022.02.09")
(require '[pod.borkdude.clj-kondo :as clj-kondo])

(def default-config
  ;; TODO: Discuss with team and agree on lower number
  {:max-lines-count 100
   ;; Vars with these metadata flags are allowed. Name should indicate the reason
   ;; it is allowed
   :metadata-exceptions #{::data-var
                          ;; TODO: Address vars tagged with cleanup-todo. These
                          ;; are left mostly because they are not high priority
                          ;; or not well understood
                          ::cleanup-todo}})

(defn -main
  [args]
  (let [paths [(or (first args) "src")]
        config (or (some->> (second args) edn/read-string (merge default-config))
                   default-config)
        {{:keys [var-definitions]} :analysis}
        (clj-kondo/run!
         {:lint paths
          :config {:output {:analysis {:var-definitions {:meta true
                                                         :lang :cljs}}}}})
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
      (do
        (println (format "\nThe following vars exceed the line count max of %s:"
                         (:max-lines-count config)))
        (pprint/print-table vars)
        (System/exit 1))
      (println "All vars are below the max size!"))))

(when (= *file* (System/getProperty "babashka.file"))
  (-main *command-line-args*))
