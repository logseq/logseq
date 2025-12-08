(ns logseq.e2e.locator
  (:refer-clojure :exclude [or and filter])
  (:require [wally.main :as w])
  (:import (com.microsoft.playwright Locator$FilterOptions)))

(defn or
  "Return locator"
  [q1 q2 & qs]
  (let [locators (map w/-query (concat [q1 q2] qs))]
    (reduce (fn [loc1 loc2] (.or loc1 loc2)) locators)))

(defn and
  "Return locator"
  [q1 q2 & qs]
  (let [locators (map w/-query (concat [q1 q2] qs))]
    (reduce (fn [loc1 loc2] (.and loc1 loc2)) locators)))

(defn- ->filter-options
  [& {:keys [has has-text has-not has-not-text]}]
  (cond-> (Locator$FilterOptions.)
    has (.setHas (w/-query has))
    has-not (.setHasNot (w/-query has-not))
    has-text (.setHasText has-text)
    has-not-text (.setHasNotText has-not-text)))

(defn filter
  "Return locator"
  {:arglists '([q & {:keys [has has-text has-not has-not-text]}])}
  [q & {:as opts}]
  (.filter (w/-query q) (->filter-options opts)))
