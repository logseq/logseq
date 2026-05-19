(ns frontend.handler.icon-color
  "Per-graph storage for recently-used custom icon colors.
   Mirrors the command-palette/history pattern: localStorage,
   small bounded list, dedup-and-promote, no DB involvement."
  (:require [frontend.state :as state]
            [frontend.storage :as storage]
            [lambdaisland.glogi :as log]))

;; 7 swatches fill one row of the 175px popover (18px tile + 4px gap).
;; Allowing up to 2 rows for breathing room without dominating the picker.
(def ^:private max-recents 14)

(def ^:private hex-pattern #"#[0-9a-fA-F]{6}")

(defn- storage-key
  "Per-graph key. Returns nil if no current repo."
  [repo]
  (when-let [r (or repo (state/get-current-repo))]
    (str "icon-color-recents-" r)))

(defn get-recents
  "Returns vector of hex strings (newest first) for the given graph,
   or current graph if not specified. Empty vector if none or on error."
  ([] (get-recents nil))
  ([repo]
   (if-let [k (storage-key repo)]
     (try
       (or (storage/get k) [])
       (catch :default e
         (log/error :icon-color/get-recents-failed e)
         []))
     [])))

(defn add-recent!
  "Push hex to head of recents, dedupe, cap at max-recents.
   No-op if hex is invalid. Storage errors (quota, Safari private
   mode, spec drift) are swallowed — recents are a nice-to-have."
  ([hex] (add-recent! hex nil))
  ([hex repo]
   (when (and (string? hex)
              (re-matches hex-pattern hex))
     (when-let [k (storage-key repo)]
       (try
         (let [current (get-recents repo)
               updated (->> current
                            (remove #(= % hex))
                            (cons hex)
                            (take max-recents)
                            vec)]
           (storage/set k updated))
         (catch :default e
           (log/error :icon-color/add-recent-failed e)))))))

(defn clear!
  "Clear recents for given graph (or current). Used in tests / dev."
  ([] (clear! nil))
  ([repo]
   (when-let [k (storage-key repo)]
     (try
       (storage/remove k)
       (catch :default e
         (log/error :icon-color/clear-failed e))))))
