(ns frontend.commands
  (:require [frontend.util :as util]
            [frontend.date :as date]
            [frontend.state :as state]
            [clojure.string :as string]
            [goog.dom :as gdom]
            [goog.object :as gobj]))

(defonce *show-commands (atom false))
(defonce *slash-caret-pos (atom nil))
(defonce slash "/")
(defonce *show-block-commands (atom false))
(defonce angle-bracket "<")
(defonce *angle-bracket-caret-pos (atom nil))
(defonce *current-command (atom nil))

(defn ->page-reference
  [page]
  (util/format "[[%s]]" page))

(def link-steps [[:editor/input (str slash "link")]
                 [:editor/show-input [{:id :link
                                       :placeholder "Link"}
                                      {:id :label
                                       :placeholder "Label"}]]])

(defn ->marker
  [marker]
  [[:editor/clear-current-slash]
   [:editor/set-marker marker]
   [:editor/move-cursor-to-end]])

(defn ->inline
  [type]
  (let [template (util/format "@@%s: @@"
                              type)]
    [[:editor/input template {:last-pattern slash
                              :backward-pos 2}]]))

(defn embed-block
  []
  (conj
   (->inline "embed")
   [:editor/search-block]))

;; Credits to roamresearch.com
(defn commands-map
  []
  (->>
   (concat
    [["NOW" (->marker "NOW")]
     ["LATER" (->marker "LATER")]
     ["DONE" (->marker "DONE")]
     ["TODO" (->marker "TODO")]
     ["DOING" (->marker "DOING")]
     ["WAIT" (->marker "WAIT")]
     ["WAITING" (->marker "WAITING")]
     ["IN-PROGRESS" (->marker "IN-PROGRESS")]
     ["CANCELED" (->marker "CANCELED")]
     ["Tomorrow" (->page-reference (date/tomorrow))]
     ["Yesterday" (->page-reference (date/yesterday))]
     ["Today" (->page-reference (date/today))]
     ["Current Time" (date/get-current-time)]
     ["Date Picker" [[:editor/show-date-picker]]]
     ["Page Reference" [[:editor/input "[[]]" {:backward-pos 2}]
                        [:editor/search-page]]]
     ["Block Reference" [[:editor/input "(())" {:backward-pos 2}]
                         [:editor/search-block]]]
     ["Block Embed" (embed-block)]
     ["Link" link-steps]
     ;; same as link
     ["Image Link" link-steps]
     (when (state/logged?)
       ["Upload an image" [[:editor/click-hidden-file-input :id]]])
     ["Html Inline " (->inline "html")]
     ["Hiccup Inline" (->inline "hiccup")]

     ;; TODO:
     ;; ["Upload a file" nil]
     ]
    ;; Allow user to modify or extend, should specify how to extend.
    (get-in @state/state [:config (state/get-current-repo) :commands]))
   (remove nil?)
   (util/distinct-by-last-wins first)))

(defonce *matched-commands (atom (commands-map)))

(defn ->block
  ([type]
   (->block type nil))
  ([type optional]
   (let [left (util/format "#+BEGIN_%s"
                           (string/upper-case type))
         right (util/format "\n#+END_%s" (string/upper-case type))
         template (str
                   left
                   (if optional (str " " optional) "")
                   "\n"
                   right)
         backward-pos (if (= type "src")
                        (+ 1 (count right))
                        (count right))]
     [[:editor/input template {:last-pattern angle-bracket
                               :backward-pos backward-pos}]])))

(defn ->properties
  []
  (let [template (util/format
                  ":PROPERTIES:\n:: \n:END:\n")
        backward-pos 9]
    [[:editor/input template {:last-pattern angle-bracket
                              :backward-pos backward-pos}]]))

;; https://orgmode.org/manual/Structure-Templates.html
(defn block-commands-map
  []
  (->>
   (concat
    [["Quote" (->block "quote")]
     ["Src" (->block "src" "")]
     ["Query" (->block "query")]
     ["Hiccup" (->block "export" "hiccup")]
     ["Html export" (->block "export" "html")]
     ["Latex export" (->block "export" "latex")]
     ["Properties" (->properties)]
     ["Example" (->block "example")]
     ["Export" (->block "export")]
     ["Verse" (->block "verse")]
     ["Ascii" (->block "export" "ascii")]
     ["Center" (->block "export")]
     ["Comment" (->block "comment")]]

    ;; Allow user to modify or extend, should specify how to extend.
    (get-in @state/state [:config (state/get-current-repo) :block-commands]))
   (remove nil?)
   (util/distinct-by-last-wins first)))

(defonce *matched-block-commands (atom (block-commands-map)))

(defn restore-state
  [restore-slash-caret-pos?]
  (when restore-slash-caret-pos?
    (reset! *slash-caret-pos nil))
  (reset! *show-commands false)
  (reset! *matched-commands (commands-map))
  (reset! *angle-bracket-caret-pos nil)
  (reset! *show-block-commands false)
  (reset! *matched-block-commands (block-commands-map))
  )

(defn insert!
  [id value
   {:keys [last-pattern postfix-fn backward-pos forward-pos]
    :or {last-pattern slash}
    :as option}]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
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

(defn simple-insert!
  [id value
   {:keys [backward-pos forward-pos check-fn]
    :as option}]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
        current-pos (:pos (util/get-caret-pos input))
        prefix (subs edit-content 0 current-pos)
        new-value (str prefix
                       value
                       (subs edit-content current-pos))
        new-pos (- (+ (count prefix)
                      (count value)
                      (or forward-pos 0))
                   (or backward-pos 0))]
    (state/set-heading-content-and-last-pos! id new-value new-pos)
    (util/move-cursor-to input new-pos)
    (when check-fn
      (check-fn new-value (dec (count prefix))))))

(defn delete-pair!
  [id]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
        current-pos (:pos (util/get-caret-pos input))
        prefix (subs edit-content 0 (dec current-pos))
        new-value (str prefix
                       (subs edit-content (inc current-pos)))
        new-pos (count prefix)]
    (state/set-heading-content-and-last-pos! id new-value new-pos)
    (util/move-cursor-to input new-pos)))

(defn get-matched-commands
  ([text]
   (get-matched-commands text (commands-map)))
  ([text commands]
   (filter
    (fn [[command _]]
      (string/index-of (string/lower-case command) (string/lower-case text)))
    commands)))

(defn get-command-input
  [edit-content]
  (when-not (string/blank? edit-content)
    (let [result (last (util/split-last slash edit-content))]
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
      (let [edit-content (gobj/get current-input "value")
            current-pos (:pos (util/get-caret-pos current-input))
            prefix (subs edit-content 0 current-pos)
            prefix (util/replace-last slash prefix "")
            new-value (str prefix
                           (subs edit-content current-pos))]
        (state/set-heading-content-and-last-pos! input-id
                                                 new-value
                                                 (count prefix))))))

(def marker-pattern
  #"(NOW|LATER|TODO|DOING|DONE|WAIT|WAITING|CANCELED|STARTED|IN-PROGRESS)?\s?")

(defmethod handle-step :editor/set-marker [[_ marker] format]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [edit-content (gobj/get current-input "value")
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
