(ns frontend.handler.editor.pending-save
  "Tab-local persistence for in-flight block saves.

  Escape / save builds outliner ops and posts them asynchronously. A reload
  before the worker commits the transaction can drop the edit. Session storage
  survives same-tab reload so the title can be replayed after restore."
  (:require [clojure.string :as string]
            [goog.object :as gobj]
            [lambdaisland.glogi :as log]))

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
  (try
    (when-let [storage (session-storage)]
      (if (seq saves)
        (.setItem storage storage-key (.stringify js/JSON (clj->js saves)))
        (.removeItem storage storage-key)))
    (catch :default error
      (log/warn :pending-block-save-storage-failed error))))

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
  "Remember an in-flight block title and return its unique save identifier."
  [repo block-uuid title]
  (let [save-id (str (random-uuid))]
    (when (and (string? repo)
               (not (string/blank? repo))
               (string? title))
      (when-let [key (uuid-key block-uuid)]
        (persist-saves!
         (assoc-in (loaded-saves) [repo key] {"save-id" save-id "title" title}))))
    save-id))

(defn current?
  [repo block-uuid save-id]
  (when-let [entry (get-in (loaded-saves) [repo (uuid-key block-uuid)])]
    (= save-id (get entry "save-id"))))

(defn clear-if-match!
  "Drop the persisted title only when it belongs to `save-id`."
  [repo block-uuid save-id]
  (when (current? repo block-uuid save-id)
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
          (keep (fn [[uuid-s entry]]
                  (let [title (if (string? entry) entry (get entry "title"))]
                    (when-let [block-uuid (and (string? uuid-s)
                                               (string? title)
                                               (parse-uuid uuid-s))]
                      {:block-uuid block-uuid
                       :save-id (get entry "save-id")
                       :title title}))))
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
