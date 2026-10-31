(ns frontend.handler.editor.pending-save
  "Tab-local persistence for in-flight block saves.

  Escape / save builds outliner ops and posts them asynchronously. A reload
  before the worker acknowledges the tx drops the edit. Session storage
  survives same-tab reload so the title can be replayed after restore."
  (:require [clojure.string :as string]
            [goog.object :as gobj]))

(def storage-key
  "ls-pending-block-saves")

;; nil until the first read hydrates from sessionStorage
(defonce ^:private *saves (atom nil))

(defn- session-storage
  []
  (gobj/get js/globalThis "sessionStorage"))

(defn- read-storage
  []
  (try
    (if-let [storage (session-storage)]
      (if-let [raw (.getItem storage storage-key)]
        (let [parsed (js->clj (.parse js/JSON raw))]
          (if (map? parsed) parsed {}))
        {})
      {})
    (catch :default _
      {})))

(defn- write-storage!
  [saves]
  (when-let [storage (session-storage)]
    (if (seq saves)
      (.setItem storage storage-key (.stringify js/JSON (clj->js saves)))
      (.removeItem storage storage-key))))

(defn- loaded-saves
  []
  (if (nil? @*saves)
    (reset! *saves (read-storage))
    @*saves))

(defn- persist-saves!
  [saves]
  (reset! *saves saves)
  (write-storage! saves)
  saves)

(defn- uuid-key
  [block-uuid]
  (cond
    (uuid? block-uuid)
    (str block-uuid)

    (string? block-uuid)
    (when (parse-uuid block-uuid)
      block-uuid)))

(defn persist!
  "Remember an in-flight block title so a reload can replay it."
  [repo block-uuid title]
  (when (and (string? repo)
             (not (string/blank? repo))
             (string? title))
    (when-let [key (uuid-key block-uuid)]
      (persist-saves!
       (assoc-in (loaded-saves) [repo key] title)))))

(defn clear-if-match!
  "Drop a persisted title only when it still matches `title`."
  [repo block-uuid title]
  (when (and (string? repo) (some? block-uuid))
    (let [saves (loaded-saves)
          path [repo (uuid-key block-uuid)]]
      (when (= title (get-in saves path))
        (let [next-saves (update saves repo dissoc (uuid-key block-uuid))
              next-saves (if (seq (get next-saves repo))
                           next-saves
                           (dissoc next-saves repo))]
          (persist-saves! next-saves))))))

(defn clear!
  [repo block-uuid]
  (when (and (string? repo) (some? block-uuid))
    (let [next-saves (update (loaded-saves) repo dissoc (uuid-key block-uuid))
          next-saves (if (seq (get next-saves repo))
                       next-saves
                       (dissoc next-saves repo))]
      (persist-saves! next-saves))))

(defn entries
  "Pending titles for `repo`, ready to replay through save-block!."
  [repo]
  (when (string? repo)
    (into []
          (keep (fn [[uuid-s title]]
                  (when-let [block-uuid (and (string? uuid-s)
                                             (string? title)
                                             (parse-uuid uuid-s))]
                    {:block-uuid block-uuid
                     :title title})))
          (get (loaded-saves) repo))))

(defn snapshot
  "Current persisted saves. Used by tests."
  []
  (loaded-saves))

(defn clear-all!
  "Clear in-memory and session copies. Used by tests."
  []
  (persist-saves! {}))

(defn reload-memory!
  "Drop the in-memory copy so the next read hydrates from sessionStorage.
  Models a same-tab page reload."
  []
  (reset! *saves nil))
