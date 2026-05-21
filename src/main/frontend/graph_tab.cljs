(ns frontend.graph-tab
  "Tab-local graph context helpers."
  (:require [clojure.string :as string]
            [goog.object :as gobj]))

(def graph-id-key
  "ls-tab-graph-id")

(def repo-key
  "ls-tab-repo")

(defn- session-storage
  []
  (gobj/get js/globalThis "sessionStorage"))

(defn get-tab-graph-id
  []
  (when-let [storage (session-storage)]
    (let [graph-id (.getItem storage graph-id-key)]
      (when-not (string/blank? graph-id)
        graph-id))))

(defn get-tab-repo
  []
  (when-let [storage (session-storage)]
    (let [repo (.getItem storage repo-key)]
      (when-not (string/blank? repo)
        repo))))

(defn get-tab-graph
  []
  (let [repo (get-tab-repo)
        graph-id (get-tab-graph-id)]
    (when (or repo graph-id)
      {:repo repo
       :graph-id graph-id})))

(defn set-tab-graph!
  [repo graph-id]
  (when-let [storage (session-storage)]
    (when-not (string/blank? repo)
      (.setItem storage repo-key repo))
    (when-not (string/blank? graph-id)
      (.setItem storage graph-id-key graph-id))))
