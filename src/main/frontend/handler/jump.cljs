(ns frontend.handler.jump
  "Jump to property key/value"
  (:require [clojure.string :as string]
            [dommy.core :as d]
            [frontend.context.i18n :refer [t]]
            [frontend.db.async :as db-async]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(defonce *current-keys (atom nil))
(defonce *jump-data (atom {}))

(def prefix-keys ["j" "k" "l"])
(def other-keys
  ["a"
   "s"
   "d"
   "f"
   "g"
   "h"
   "q"
   "w"
   "e"
   "r"
   "t"
   "y"
   "u"
   "i"
   "o"
   "p"
   "z"
   "x"
   "c"
   "v"
   "b"
   "n"
   "m"])

(defonce full-start-keys (set (concat prefix-keys other-keys)))

(defn generate-keys
  "Notice: at most 92 keys for now"
  [n]
  (vec
   (take n
         (concat other-keys
                 (mapcat
                  (fn [k]
                    (map #(str k %) other-keys))
                  prefix-keys)))))

(defn clear-jump-hints!
  []
  (dorun (map d/remove! (d/sel ".jtrigger-id")))
  (reset! *current-keys nil))

(defn exit!
  []
  (when-let [event-handler (:key-down-handler @*jump-data)]
    (.removeEventListener js/window "keydown" event-handler))
  (reset! *current-keys nil)
  (reset! *jump-data {})
  (clear-jump-hints!))

(defn get-trigger
  [triggers key]
  (let [idx (.indexOf @*current-keys key)]
    (when (>= idx 0) (nth triggers idx))))

(defn- <get-block
  [id-or-name]
  (if id-or-name
    (db-async/<get-block (state/get-current-repo) id-or-name {:children? false})
    (p/resolved nil)))

(defn- trigger!
  [key e]
  (let [{:keys [triggers _mode]} @*jump-data
        trigger (get-trigger triggers (string/trim key))]
    (when (or trigger (>= (count (string/trim key)) 2))
      (util/stop e)
      (state/clear-selection!)
      (exit!)
      (if trigger
        (if (d/has-class? trigger "block-content")
          (let [block-id (some-> (d/attr trigger "blockid") uuid)
                container-id (some-> (d/attr trigger "containerid")
                                     util/safe-parse-int)]
            (p/let [block (<get-block block-id)]
              (when block
                (editor-handler/edit-block! block :max {:container-id container-id}))))
          (.click trigger))
        (notification/show! (t :nav/invalid-jump-error) :error true)))))

(defn jump-to
  []
  (when (empty? (d/sel js/document ".jtrigger-id"))
    (p/let [current-block-id (or (:block/uuid (state/get-edit-block))
                                 (first (state/get-selection-block-ids)))
            current-block (or (when current-block-id
                                (<get-block current-block-id))
                              (<get-block (state/get-current-page)))
            current-block-id (or current-block-id (:block/uuid current-block))
            collapsed? (or (state/get-block-collapsed current-block-id) (:block/collapsed? current-block))]
      (when (and collapsed? current-block-id)
        (editor-handler/expand-block! current-block-id))
      (let [f #(let [selected-block-or-editing-block (or (first (state/get-selection-blocks))
                                                         ;; current editing block
                                                         (state/get-editor-block-container))
                     triggers (->> (if selected-block-or-editing-block
                                     (d/sel selected-block-or-editing-block ".jtrigger")
                                     (d/sel ".jtrigger"))
                                   (remove (fn [^js n]
                                             (some (fn [class] (.closest n class)) #{".positioned-properties" ".view-actions" ".ls-table-cell"}))))]
                 (when (seq triggers)
                   (reset! *jump-data {:mode :property
                                       :triggers triggers})
                   (let [keys (generate-keys (count triggers))
                         key-down-handler (fn [e]
                                            (let [k (util/ekey e)]
                                              (if (= k "Escape")
                                                (exit!)
                                                (when (and (contains? full-start-keys k) (seq (:triggers @*jump-data)))
                                                  (swap! *jump-data update :chords (fn [s] (str s (util/ekey e))))
                                                  (let [chords (:chords @*jump-data)]
                                                    (trigger! chords e))))))]
                     (swap! *jump-data assoc :key-down-handler key-down-handler)
                     (reset! *current-keys keys)
                     (doall
                      (map-indexed
                       (fn [id dom]
                         (let [class (if (d/has-class? dom "ui__checkbox")
                                       "jtrigger-id text-sm border rounded ml-4 px-1 shadow-xs"
                                       "jtrigger-id text-sm border rounded ml-2 px-1 shadow-xs")
                               ^js view (or (.closest dom ".jtrigger-view") dom)]
                           (d/append! view (-> (d/create-element :div)
                                               (d/set-attr! :class class)
                                               (d/set-text! (nth keys id))))))
                       (take (count keys) triggers)))
                     (.addEventListener js/window "keydown" key-down-handler))))]
        (if collapsed?
          (js/setTimeout f 100)
          (f))))))
