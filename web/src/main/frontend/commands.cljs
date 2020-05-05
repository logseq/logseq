(ns frontend.commands
  (:require [frontend.util :as util]
            [frontend.state :as state]
            [clojure.string :as string]
            [goog.dom :as gdom]))

(defn insert!
  [id value *slash-caret-pos & {:keys [last-pattern postfix-fn]
                                :or {last-pattern "/"
                                     }}]
  (when-let [edit-content (state/get-edit-content)]
    (let [input (gdom/getElement id)
          current-pos (:pos (util/get-caret-pos input))
          prefix (subs edit-content 0 current-pos)
          prefix (util/replace-last last-pattern prefix value)
          postfix (subs edit-content current-pos)
          postfix (if postfix-fn (postfix-fn postfix) postfix)
          new-value (str prefix postfix)]
      (state/set-edit-content! new-value)
      (when-let [input-id (state/get-edit-input-id)]
        (when-let [current-input (gdom/getElement input-id)]
          (util/move-cursor-to input (count prefix))))
      ))
  (when *slash-caret-pos
    (reset! *slash-caret-pos nil)))

(defn ->page-reference
  [page]
  (util/format "[[%s]]" page))

(def link-steps [[:editor/input "[[][]]"]
                 [:editor/cursor-back 4]
                 [:editor/show-input [{:id :link
                                       :placeholder "Link"}
                                      {:id :label
                                       :placeholder "Label"}]]])
;; Credits to roamresearch.com
(def commands-map
  (->>
   (concat
    [["TODO" "TODO"]
     ["DOING" "DOING"]
     ["Tomorrow" (->page-reference (util/tomorrow))]
     ["Yesterday" (->page-reference (util/tomorrow))]
     ["Today" (->page-reference (util/today))]
     ["Current Time" (util/get-current-time)]
     ["Date Picker" [[:editor/show-date-picker]]]
     ["Page Reference" [[:editor/input "[[]]"]
                        [:editor/cursor-back 2]
                        [:editor/search-page]]]
     ["Link" link-steps]
     ;; same as link
     ["Image Link" link-steps]
     ["Upload an image" [[:editor/click-hidden-file-input :id]]]
     ;; TODO:
     ;; ["Upload a file" nil]
     ]
    ;; Allow user to modify or extend, should specify how to extend.
    (get-in @state/state [:config :commands]))
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

(defmethod handle-step :editor/input [[_ value]]
  (when-let [input-id (state/get-edit-input-id)]
    (insert! input-id value nil)))

(defmethod handle-step :editor/cursor-back [[_ n]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (util/cursor-move-back current-input n))))

(defmethod handle-step :editor/cursor-forward [[_ n]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (util/cursor-move-forward current-input n))))

(defmethod handle-step :editor/search-page [[_]]
  (state/set-editor-show-page-search true))

(defmethod handle-step :editor/show-input [[_ option]]
  (state/set-editor-show-input option))

(defmethod handle-step :editor/show-date-picker [[_]]
  (state/set-editor-show-date-picker true))

(defmethod handle-step :editor/click-hidden-file-input [[_ input-id]]
  (when-let [input-file (gdom/getElement "upload-file")]
    (.click input-file)))

(defmethod handle-step :default [[type & _args]]
  (prn "No handler for step: " type))

(defn handle-steps
  [vector]
  (doseq [step vector]
    (handle-step step)))
