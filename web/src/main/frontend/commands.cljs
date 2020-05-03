(ns frontend.commands
  (:require [frontend.util :as util]
            [frontend.state :as state]
            [clojure.string :as string]))

(defn ->page-reference
  [page]
  (util/format "[[%s]]" page))

;; Credits to roamresearch.com
(def commands-map
  (merge
   {"Today" (->page-reference (util/today))
    "Tomorrow" (->page-reference (util/tomorrow))
    "Yesterday" (->page-reference (util/tomorrow))
    "Current Time" (util/get-current-time)
    "Date Picker" [[:date/pick]]
    "Page Reference" [[:editor/input "[[]]"]
                      [:editor/cursor-back 2]
                      [:search :page]
                      [:insert]
                      [:cursor/move-to-end]]
    "Link" nil
    "Upload a file" nil}
   ;; Allow user to modify or extend, should specify how to extend.
   (:config @state/state)))

(defn get-handler
  [command-name]
  (get commands-map command-name))

(defn get-matched-commands
  [text]
  (filter
   (fn [[command _]]
     (string/starts-with? (string/lower-case command) (string/lower-case text)))
   commands-map))

(defn get-command-input
  [edit-content]
  (when-not (string/blank? edit-content)
    (let [result (last (util/split-last "/" edit-content))]
     (if (string/blank? result)
       nil
       result))))
