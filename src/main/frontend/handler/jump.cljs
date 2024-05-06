(ns frontend.handler.jump
  "Jump to property key/value"
  (:require [frontend.state :as state]
            [dommy.core :as d]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.handler.notification :as notification]
            [frontend.handler.editor :as editor-handler]
            [frontend.db :as db]))

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
                                     util/safe-parse-int)
                block (when block-id (db/entity [:block/uuid block-id]))]
            (when block (editor-handler/edit-block! block :max {:container-id container-id})))
          (.click trigger))
        (notification/show! "Invalid jump" :error true)))))

(defn jump-to
  []
  (let [selected-block-or-page (or (first (state/get-selection-blocks))
                                   ;; current edited block
                                   (some-> (:block-parent-id (first (state/get-editor-args)))
                                           js/document.getElementById)
                                   ;; current page
                                   (d/sel1 js/document "#main-content-container .ls-page-properties"))]
    (cond
      selected-block-or-page
      (when (empty? (d/sel js/document ".jtrigger-id"))
        (let [triggers (d/sel selected-block-or-page ".jtrigger")]
          (when (seq triggers)
            (reset! *jump-data {:mode :property
                                :triggers (d/sel selected-block-or-page ".jtrigger")})
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
                                "jtrigger-id text-sm border rounded ml-2 px-1 shadow-xs")]
                    (d/append! dom (-> (d/create-element :div)
                                       (d/set-attr! :class class)
                                       (d/set-text! (nth keys id))))))
                (take (count keys) triggers)))
              (.addEventListener js/window "keydown" key-down-handler)))))

      :else                             ; add block jump support
      nil)))
