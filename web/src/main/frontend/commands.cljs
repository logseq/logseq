(ns frontend.commands
  (:require [frontend.util :as util]
            [frontend.state :as state]
            [clojure.string :as string]
            [goog.dom :as gdom]))

(defn ->page-reference
  [page]
  (util/format "[[%s]]" page))

;; Credits to roamresearch.com
(def commands-map
  (->>
   (concat
    [["Tomorrow" (->page-reference (util/tomorrow))]
     ["Yesterday" (->page-reference (util/tomorrow))]
     ["Today" (->page-reference (util/today))]
     ["Current Time" (util/get-current-time)]
     ["Date Picker" [[:date/pick]]]
     ["Page Reference" [[:editor/input "[[]]"]
                        [:editor/cursor-back 2]
                        [:editor/search-page]]]
     ["Link" nil]
     ["Upload a file" nil]]
    ;; Allow user to modify or extend, should specify how to extend.
    (:config @state/state))
   (util/remove-nils)
   (util/distinct-by-last-wins first)))

(defn get-matched-commands
  [text]
  (filter
   (fn [[command _]]
     (string/index-of (string/lower-case command) (string/lower-case text)))
   commands-map))

(defn get-command-input
  [edit-content]
  (when-not (string/blank? edit-content)
    (let [result (last (util/split-last "/" edit-content))]
     (if (string/blank? result)
       nil
       result))))

(defmulti handle-step first)

(defmethod handle-step :editor/input [[_ append-value]]
  (when-let [edit-content (state/get-edit-content)]
    (let [new-value (util/replace-last "/" edit-content (str append-value))]
      (state/set-edit-content! new-value))))

(defmethod handle-step :editor/cursor-back [[_ n]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (util/cursor-move-back current-input n))))

(defmethod handle-step :editor/search-page [[_]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      ;; (util/cursor-move-back current-input n)
      )))

(defmethod handle-step :default [[type & _args]]
  (prn "No handler for step: " type))

(defn handle-steps
  [vector]
  (doseq [step vector]
    (handle-step step)))
