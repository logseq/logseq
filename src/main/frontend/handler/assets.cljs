(ns frontend.handler.assets
  (:require [frontend.state :as state]
            [medley.core :as medley]))

(defn alias-enabled?
  []
  (:assets/alias-enabled? @state/state))

(defn get-alias-dirs
  []
  (:assets/alias-dirs @state/state))


(defn get-alias-by-dir
  [dir]
  (when-let [alias-dirs (and (alias-enabled?) (seq (get-alias-dirs)))]
    (medley/find-first #(= dir (:dir (second %1)))
                       (medley/indexed alias-dirs))))

(defn get-alias-by-name
  [name]
  (when-let [alias-dirs (and (alias-enabled?) (seq (get-alias-dirs)))]
    (medley/find-first #(= name (:name (second %1)))
                       (medley/indexed alias-dirs))))
