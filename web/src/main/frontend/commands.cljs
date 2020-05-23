(ns frontend.commands
  (:require [frontend.util :as util]
            [frontend.state :as state]
            [clojure.string :as string]
            [goog.dom :as gdom]))

(defonce *show-commands (atom false))
(defonce *slash-caret-pos (atom nil))

(defn ->page-reference
  [page]
  (util/format "[[%s]]" page))

(def link-steps [[:editor/input "/link"]
                 [:editor/show-input [{:id :link
                                       :placeholder "Link"}
                                      {:id :label
                                       :placeholder "Label"}]]])

(defn ->marker
  [marker]
  [[:editor/clear-current-slash]
   [:editor/set-marker marker]
   [:editor/move-cursor-to-end]])

;; Credits to roamresearch.com
(defn commands-map
  []
  (->>
   (concat
    [["TODO" (->marker "TODO")]
     ["DOING" (->marker "DOING")]
     ["DONE" (->marker "DONE")]
     ["WAIT" (->marker "WAIT")]
     ["CANCELED" (->marker "CANCELED")]
     ["Tomorrow" (->page-reference (util/tomorrow))]
     ["Yesterday" (->page-reference (util/yesterday))]
     ["Today" (->page-reference (util/today))]
     ["Current Time" (util/get-current-time)]
     ["Date Picker" [[:editor/show-date-picker]]]
     ["Page Reference" [[:editor/input "[[]]" {:backward-pos 2}]
                        [:editor/search-page]]]
     ["Block Reference" [[:editor/input "(())" {:backward-pos 2}]
                         [:editor/search-block]]]
     ["Link" link-steps]
     ;; same as link
     ["Image Link" link-steps]
     (when (state/logged?)
       ["Upload an image" [[:editor/click-hidden-file-input :id]]])
     ;; TODO:
     ;; ["Upload a file" nil]
     ]
    ;; Allow user to modify or extend, should specify how to extend.
    (get-in @state/state [:config (state/get-current-repo) :commands]))
   (remove nil?)
   (util/distinct-by-last-wins first)))

(defonce *matched-commands (atom (commands-map)))

(defn restore-state
  [restore-slash-caret-pos?]
  (when restore-slash-caret-pos?
    (reset! *slash-caret-pos nil))
  (reset! *show-commands false)
  (reset! *matched-commands (commands-map)))

(defn insert!
  [id value
   {:keys [last-pattern postfix-fn backward-pos forward-pos]
    :or {last-pattern "/"}
    :as option}]
  (let [edit-content (state/get-edit-content id)
        input (gdom/getElement id)
        current-pos (:pos (util/get-caret-pos input))

        prefix (subs edit-content 0 current-pos)
        prefix (if (string/blank? last-pattern)
                 (util/concat-without-spaces prefix value)
                 (util/replace-last last-pattern prefix value))
        postfix (subs edit-content current-pos)
        postfix (if postfix-fn (postfix-fn postfix) postfix)
        new-value (util/concat-without-spaces prefix postfix)
        new-pos (- (+ (count prefix)
                      (or forward-pos 0))
                   (or backward-pos 0))]
    (state/set-heading-content-and-last-pos! id new-value new-pos)
    (util/move-cursor-to input
                         (if (or backward-pos forward-pos)
                           new-pos
                           (+ new-pos 1)))))

(defn get-matched-commands
  [text]
  (filter
   (fn [[command _]]
     (string/index-of (string/lower-case command) (string/lower-case text)))
   (commands-map)))

(defn get-command-input
  [edit-content]
  (when-not (string/blank? edit-content)
    (let [result (last (util/split-last "/" edit-content))]
      (if (string/blank? result)
        nil
        result))))

(defmulti handle-step first)

(defmethod handle-step :editor/input [[_ value option]]
  (when-let [input-id (state/get-edit-input-id)]
    (insert! input-id value option)))

(defmethod handle-step :editor/cursor-back [[_ n]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (util/cursor-move-back current-input n))))

(defmethod handle-step :editor/cursor-forward [[_ n]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (util/cursor-move-forward current-input n))))

(defmethod handle-step :editor/move-cursor-to-end [[_]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (util/move-cursor-to-end current-input))))

(defmethod handle-step :editor/clear-current-slash [[_]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [edit-content (state/get-edit-content input-id)
            current-pos (:pos (util/get-caret-pos current-input))
            prefix (subs edit-content 0 current-pos)
            prefix (util/replace-last "/" prefix "")
            new-value (str prefix
                           (subs edit-content current-pos))]
        (state/set-heading-content-and-last-pos! input-id
                                                 new-value
                                                 (count prefix))))))

(def marker-pattern
  #"(TODO|DOING|DONE|WAIT|CANCELED|STARTED|IN-PROGRESS)?\s?")

(defmethod handle-step :editor/set-marker [[_ marker] format]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [edit-content (state/get-edit-content input-id)
            slash-pos (:pos @*slash-caret-pos)
            [re-pattern new-line-re-pattern] (if (= :org format)
                                               [#"\*+\s" #"\n\*+\s"]
                                               [#"#+\s" #"\n#+\s"])
            pos (let [prefix (subs edit-content 0 (dec slash-pos))]
                  (if-let [matches (seq (util/re-pos new-line-re-pattern prefix))]
                    (let [[start-pos content] (last matches)]
                      (+ start-pos (count content)))
                    (count (re-find re-pattern prefix))))
            new-value (str (subs edit-content 0 pos)
                           (string/replace-first (subs edit-content pos)
                                                 marker-pattern
                                                 (str marker " ")))]
        (state/set-edit-content! input-id new-value true)))))

(defmethod handle-step :editor/search-page [[_]]
  (state/set-editor-show-page-search true))

(defmethod handle-step :editor/search-block [[_]]
  (state/set-editor-show-block-search true))

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
  [vector format]
  (doseq [step vector]
    (handle-step step format)))
