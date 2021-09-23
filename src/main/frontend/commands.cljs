(ns frontend.commands
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.db.utils :as db-util]
            [frontend.handler.draw :as draw]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.extensions.video.youtube :as youtube]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.text :as text]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.marker :as marker]
            [frontend.util.priority :as priority]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [promesa.core :as p]))

;; TODO: move to frontend.handler.editor.commands

(defonce *show-commands (atom false))
(defonce *slash-caret-pos (atom nil))
(defonce slash "/")
(defonce *show-block-commands (atom false))
(defonce angle-bracket "<")
(defonce *angle-bracket-caret-pos (atom nil))
(defonce *current-command (atom nil))

(def query-doc
  [:div {:on-mouse-down (fn [e] (.stopPropagation e))}
   [:div.font-medium.text-lg.mb-2 "Query examples:"]
   [:ul.mb-1
    [:li.mb-1 [:code "{{query #tag}}"]]
    [:li.mb-1 [:code "{{query [[page]]}}"]]
    [:li.mb-1 [:code "{{query \"full-text search\"}}"]]
    [:li.mb-1 [:code "{{query (and [[project]] (task NOW LATER))}}"]]
    [:li.mb-1 [:code "{{query (or [[page 1]] [[page 2]])}}"]]
    [:li.mb-1 [:code "{{query (and (between -7d +7d) (task DONE))}}"]]
    [:li.mb-1 [:code "{{query (property key value)}}"]]
    [:li.mb-1 [:code "{{query (page-tags #tag)}}"]]]

   [:p "Check more examples at "
    [:a {:href "https://logseq.github.io/#/page/queries"
         :target "_blank"}
     "Queries documentation"]
    "."]])

(def link-steps [[:editor/input (str slash "link")]
                 [:editor/show-input [{:command :link
                                       :id :link
                                       :placeholder "Link"
                                       :autoFocus true}
                                      {:command :link
                                       :id :label
                                       :placeholder "Label"}]]])

(def image-link-steps [[:editor/input (str slash "link")]
                       [:editor/show-input [{:command :image-link
                                             :id :link
                                             :placeholder "Link"
                                             :autoFocus true}
                                            {:command :image-link
                                             :id :label
                                             :placeholder "Label"}]]])

(def zotero-steps [[:editor/input (str slash "zotero")]
                   [:editor/show-zotero]])

(def *extend-slash-commands (atom []))

(defn register-slash-command [cmd]
  (swap! *extend-slash-commands conj cmd))

(defn ->marker
  [marker]
  [[:editor/clear-current-slash]
   [:editor/set-marker marker]
   [:editor/move-cursor-to-end]])

(defn ->priority
  [priority]
  [[:editor/clear-current-slash]
   [:editor/set-priority priority]
   [:editor/move-cursor-to-end]])

(defn ->inline
  [type]
  (let [template (util/format "@@%s: @@"
                              type)]
    [[:editor/input template {:last-pattern slash
                              :backward-pos 2}]]))

(defn embed-page
  []
  (conj
   [[:editor/input "{{embed [[]]}}" {:last-pattern slash
                                     :backward-pos 4}]]
   [:editor/search-page :embed]))

(defn embed-block
  []
  [[:editor/input "{{embed (())}}" {:last-pattern slash
                                    :backward-pos 4}]
   [:editor/search-block :embed]])

;; Stop now!!
;; (def commands-plugins
;;   {"Encrypt text" {:steps [[:editor/input (str slash "encrypt")]
;;                            [:editor/show-input [{:id :hint
;;                                                  :placeholder "Hint"}
;;                                                 {:id :password
;;                                                  :type "password"}]]]
;;                    :insert-fn (fn [hint password]
;;                                 (util/format "{{{encrypt %s}}}"
;;                                              (pr-str {:hint hint
;;                                                       :content content})))}})

(defn get-preferred-workflow
  []
  (let [workflow (state/get-preferred-workflow)]
    (if (= :now workflow)
      [["LATER" (->marker "LATER")]
       ["NOW" (->marker "NOW")]
       ["TODO" (->marker "TODO")]
       ["DOING" (->marker "DOING")]]
      [["TODO" (->marker "TODO")]
       ["DOING" (->marker "DOING")]
       ["LATER" (->marker "LATER")]
       ["NOW" (->marker "NOW")]])))

;; Credits to roamresearch.com

(defn- ->heading
  [heading]
  [[:editor/clear-current-slash]
   [:editor/set-heading heading]
   [:editor/move-cursor-to-end]])

(defn- markdown-headings
  []
  (let [format (state/get-preferred-format)]
    (when (= (name format) "markdown")
      (mapv (fn [level]
              (let [heading (str "h" level)]
                [heading (->heading (apply str (repeat level "#")))])) (range 1 7)))))

(defonce *matched-commands (atom nil))
(defonce *initial-commands (atom nil))

(defonce *first-command-group
  {"Page reference" "BASIC"
   "Tomorrow" "TIME & DATE"
   "LATER" "TASK"
   "A" "PRIORITY"
   "Query" "ADVANCED"
   "Quote" "ORG-MODE"})

(defn ->block
  ([type]
   (->block type nil))
  ([type optional]
   (let [format (get (state/get-edit-block) :block/format)
         org-src? (and (= format :org)
                       (= (string/lower-case type) "src"))
         [left right] (cond
                        org-src?
                        (->> ["#+BEGIN_%s" "\n#+END_%s"]
                             (map #(util/format %
                                                (string/upper-case type))))
                        :else
                        ["```" "\n```"])
         template (str
                   left
                   (if optional (str " " optional) "")
                   "\n"
                   right)
         backward-pos (if (= type "src")
                        (+ 1 (count right))
                        (count right))]
     [[:editor/input template {:type "block"
                               :last-pattern angle-bracket
                               :backward-pos backward-pos}]])))

(defn ->properties
  []
  (let [template (util/format
                  ":PROPERTIES:\n:: \n:END:\n")
        backward-pos 9]
    [[:editor/input template {:type "properties"
                              :last-pattern angle-bracket
                              :backward-pos backward-pos}]]))

;; https://orgmode.org/manual/Structure-Templates.html
(defn block-commands-map
  []
  (->>
   (concat
    [["Quote" (->block "quote")]
     ["Src" (->block "src" "")]
     ["Query" (->block "query")]
     ["Latex export" (->block "export" "latex")]
     ;; FIXME: current page's format
     (when (= :org (state/get-preferred-format))
       ["Properties" (->properties)])
     ["Note" (->block "note")]
     ["Tip" (->block "tip")]
     ["Important" (->block "important")]
     ["Caution" (->block "caution")]
     ["Pinned" (->block "pinned")]
     ["Warning" (->block "warning")]
     ["Example" (->block "example")]
     ["Export" (->block "export")]
     ["Verse" (->block "verse")]
     ["Ascii" (->block "export" "ascii")]
     ["Center" (->block "center")]
     ["Comment" (->block "comment")]]

    ;; Allow user to modify or extend, should specify how to extend.
    (state/get-commands))
   (remove nil?)
   (util/distinct-by-last-wins first)))

(defn commands-map
  [get-page-ref-text]
  (->>
   (concat
    ;; basic
    [["Page reference" [[:editor/input "[[]]" {:backward-pos 2}]
                        [:editor/search-page]] "Create a backlink to a page"]
     ["Page embed" (embed-page) "Embed a page here"]
     ["Block reference" [[:editor/input "(())" {:backward-pos 2}]
                         [:editor/search-block :reference]] "Create a backlink to a block"]
     ["Block embed" (embed-block) "Embed a block here" "Embed a block here"]
     ["Link" link-steps "Create a HTTP link"]
     ["Image link" image-link-steps "Create a HTTP link to a image"]
     (when (state/markdown?)
       ["Underline" [[:editor/input "<ins></ins>"
                      {:last-pattern slash
                       :backward-pos 6}]] "Create a underline text decoration"])
     ["Template" [[:editor/input "/" nil]
                  [:editor/search-template]] "Insert a created template here"]
     (cond
       (and (util/electron?) (config/local-db? (state/get-current-repo)))

       ["Upload an asset" [[:editor/click-hidden-file-input :id]] "Upload file types like image, pdf, docx, etc.)"]

       (state/logged?)
       ["Upload an image" [[:editor/click-hidden-file-input :id]]])]

    (markdown-headings)

    ;; time & date

    [["Tomorrow" #(get-page-ref-text (date/tomorrow)) "Insert the date of tomorrow"]
     ["Yesterday" #(get-page-ref-text (date/yesterday)) "Insert the date of yesterday"]
     ["Today" #(get-page-ref-text (date/today)) "Insert the date of today"]
     ["Current time" #(date/get-current-time) "Insert current time"]
     ["Date picker" [[:editor/show-date-picker]] "Pick a date and insert here"]]

    ;; task management
    (get-preferred-workflow)

    [["DONE" (->marker "DONE")]
     ["WAITING" (->marker "WAITING")]
     ["CANCELED" (->marker "CANCELED")]
     ["Deadline" [[:editor/clear-current-slash]
                  [:editor/show-date-picker :deadline]]]
     ["Scheduled" [[:editor/clear-current-slash]
                   [:editor/show-date-picker :scheduled]]]]

    ;; priority
    [["A" (->priority "A")]
     ["B" (->priority "B")]
     ["C" (->priority "C")]]

    ;; advanced

    [["Query" [[:editor/input "{{query }}" {:backward-pos 2}]] query-doc]
     ["Zotero" zotero-steps "Import Zotero journal article"]
     ["Query table function" [[:editor/input "{{function }}" {:backward-pos 2}]] "Create a query table function"]
     ["Calculator" [[:editor/input "```calc\n\n```" {:backward-pos 4}]
                    [:codemirror/focus]] "Insert a calculator"]
     ["Draw" (fn []
               (let [file (draw/file-name)
                     path (str config/default-draw-directory "/" file)
                     text (util/format "[[%s]]" path)]
                 (p/let [_ (draw/create-draw-with-default-content path)]
                   (println "draw file created, " path))
                 text)) "Draw a graph with Excalidraw"]

     (when (util/zh-CN-supported?)
       ["Embed Bilibili video" [[:editor/input "{{bilibili }}" {:last-pattern slash
                                                                :backward-pos 2}]]])
     ["Embed HTML " (->inline "html")]

     ["Embed Youtube video" [[:editor/input "{{youtube }}" {:last-pattern slash
                                                            :backward-pos 2}]]]

     ["Embed Youtube timestamp" [[:youtube/insert-timestamp]]]

     ["Embed Vimeo video" [[:editor/input "{{vimeo }}" {:last-pattern slash
                                                        :backward-pos 2}]]]

     ["Embed Twitter tweet" [[:editor/input "{{tweet }}" {:last-pattern slash
                                                          :backward-pos 2}]]]]

    @*extend-slash-commands
    ;; Allow user to modify or extend, should specify how to extend.

    (state/get-commands)
    (state/get-plugins-commands))
   (remove nil?)
   (util/distinct-by-last-wins first)))

(defn init-commands!
  [get-page-ref-text]
  (let [commands (commands-map get-page-ref-text)]
    (reset! *initial-commands commands)
    (reset! *matched-commands commands)))

(defonce *matched-block-commands (atom (block-commands-map)))

(defn restore-state
  [restore-slash-caret-pos?]
  (when restore-slash-caret-pos?
    (reset! *slash-caret-pos nil))
  (reset! *show-commands false)
  (reset! *angle-bracket-caret-pos nil)
  (reset! *show-block-commands false)
  (reset! *matched-commands @*initial-commands)
  (reset! *matched-block-commands (block-commands-map)))

(defn insert!
  [id value
   {:keys [last-pattern postfix-fn backward-pos forward-pos
           end-pattern]
    :or {last-pattern slash}
    :as option}]
  (when-let [input (gdom/getElement id)]
    (let [edit-content (gobj/get input "value")
          current-pos (cursor/pos input)
          current-pos (or
                       (when (and end-pattern (string? end-pattern))
                         (when-let [i (string/index-of (util/safe-subs edit-content current-pos) end-pattern)]
                           (+ current-pos i)))
                       current-pos)
          prefix (subs edit-content 0 current-pos)
          space? (when (and last-pattern prefix)
                   (let [s (when-let [last-index (string/last-index-of prefix last-pattern)]
                             (util/safe-subs prefix 0 last-index))]
                     (not
                      (or
                       (and s
                            (string/ends-with? s "(")
                            (or (string/starts-with? last-pattern "((")
                                (string/starts-with? last-pattern "[[")))
                       (string/starts-with? s "{{embed")))))
          space? (if (and space? (string/starts-with? last-pattern "#[["))
                   false
                   space?)
          prefix (if (string/blank? last-pattern)
                   (if space?
                     (util/concat-without-spaces prefix value)
                     (str prefix value))
                   (util/replace-last last-pattern prefix value space?))
          postfix (subs edit-content current-pos)
          postfix (if postfix-fn (postfix-fn postfix) postfix)
          new-value (cond
                      space?
                      (util/concat-without-spaces prefix postfix)

                      :else
                      (str prefix postfix))
          new-pos (- (+ (count prefix)
                        (or forward-pos 0))
                     (or backward-pos 0))]
      (state/set-block-content-and-last-pos! id new-value new-pos)
      (cursor/move-cursor-to input
                             (if (or backward-pos forward-pos)
                               new-pos
                               (+ new-pos 1))))))

(defn simple-insert!
  [id value
   {:keys [backward-pos forward-pos check-fn]
    :as option}]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
        current-pos (cursor/pos input)
        prefix (subs edit-content 0 current-pos)
        new-value (str prefix
                       value
                       (subs edit-content current-pos))
        new-pos (- (+ (count prefix)
                      (count value)
                      (or forward-pos 0))
                   (or backward-pos 0))]
    (state/set-block-content-and-last-pos! id new-value new-pos)
    (cursor/move-cursor-to input new-pos)
    (when check-fn
      (check-fn new-value (dec (count prefix)) new-pos))))

(defn insert-before!
  [id value
   {:keys [backward-pos forward-pos check-fn]
    :as option}]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
        current-pos (cursor/pos input)
        suffix (subs edit-content 0 current-pos)
        new-value (str value
                       suffix
                       (subs edit-content current-pos))
        new-pos (- (+ (count suffix)
                      (count value)
                      (or forward-pos 0))
                   (or backward-pos 0))]
    (state/set-block-content-and-last-pos! id new-value new-pos)
    (cursor/move-cursor-to input new-pos)
    (when check-fn
      (check-fn new-value (dec (count suffix)) new-pos))))

(defn simple-replace!
  [id value selected
   {:keys [backward-pos forward-pos check-fn]
    :as option}]
  (let [selected? (not (string/blank? selected))
        input (gdom/getElement id)
        edit-content (gobj/get input "value")
        current-pos (cursor/pos input)
        prefix (subs edit-content 0 current-pos)
        postfix (if selected?
                  (string/replace-first (subs edit-content current-pos)
                                        selected
                                        "")
                  (subs edit-content current-pos))
        new-value (str prefix value postfix)
        new-pos (- (+ (count prefix)
                      (count value)
                      (or forward-pos 0))
                   (or backward-pos 0))]
    (state/set-block-content-and-last-pos! id new-value new-pos)
    (cursor/move-cursor-to input new-pos)
    (when selected?
      (.setSelectionRange input new-pos (+ new-pos (count selected))))
    (when check-fn
      (check-fn new-value (dec (count prefix))))))

(defn delete-pair!
  [id]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
        current-pos (cursor/pos input)
        prefix (subs edit-content 0 (dec current-pos))
        new-value (str prefix
                       (subs edit-content (inc current-pos)))
        new-pos (count prefix)]
    (state/set-block-content-and-last-pos! id new-value new-pos)
    (cursor/move-cursor-to input new-pos)))

(defn get-matched-commands
  ([text]
   (get-matched-commands text @*initial-commands))
  ([text commands]
   (search/fuzzy-search commands text
                        :extract-fn first
                        :limit 50)))

(defn get-command-input
  [edit-content]
  (when-not (string/blank? edit-content)
    (let [result (last (util/split-last slash edit-content))]
      (if (string/blank? result)
        nil
        result))))

(defmulti handle-step first)

(defmethod handle-step :editor/hook [[_ event {:keys [pid uuid] :as payload}] format]
  (plugin-handler/hook-plugin-editor event (merge payload {:format format :uuid (or uuid (:block/uuid (state/get-edit-block)))}) pid))

(defmethod handle-step :editor/input [[_ value option]]
  (when-let [input-id (state/get-edit-input-id)]
    (let [last-pattern (:last-pattern option)
          type (:type option)
          input (gdom/getElement input-id)
          content (gobj/get input "value")
          pos (cursor/pos input)
          pos (if last-pattern
                (string/last-index-of content last-pattern pos)
                pos)
          beginning-of-line? (text/beginning-of-line content pos)
          value (if (and (contains? #{"block" "properties"} type)
                         (not beginning-of-line?))
                  (str "\n" value)
                  value)]
      (insert! input-id value option))))

(defmethod handle-step :editor/cursor-back [[_ n]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (cursor/move-cursor-backward current-input n))))

(defmethod handle-step :editor/cursor-forward [[_ n]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (cursor/move-cursor-forward current-input n))))

(defmethod handle-step :editor/move-cursor-to-end [[_]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (cursor/move-cursor-to-end current-input))))

(defmethod handle-step :editor/restore-saved-cursor [[_]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (cursor/move-cursor-to current-input (:editor/last-saved-cursor @state/state)))))

(defmethod handle-step :editor/clear-current-slash [[_ space?]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [edit-content (gobj/get current-input "value")
            current-pos (cursor/pos current-input)
            prefix (subs edit-content 0 current-pos)
            prefix (util/replace-last slash prefix "" (boolean space?))
            new-value (str prefix
                           (subs edit-content current-pos))]
        (state/set-block-content-and-last-pos! input-id
                                               new-value
                                               (count prefix))))))

(defn compute-pos-delta-when-change-marker
  [current-input edit-content new-value marker pos]
  (let [old-marker (some->> (first (util/safe-re-find marker/bare-marker-pattern edit-content))
                            (string/trim))
        old-marker (if old-marker old-marker "")
        pos-delta (- (count marker)
                     (count old-marker))
        pos-delta (if (string/blank? old-marker)
                    (inc pos-delta)
                    pos-delta)]
    (+ pos pos-delta)))

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
                    (count (util/safe-re-find re-pattern prefix))))
            new-value (str (subs edit-content 0 pos)
                           (string/replace-first (subs edit-content pos)
                                                 marker/marker-pattern
                                                 (str marker " ")))]
        (state/set-edit-content! input-id new-value)
        (let [new-pos (compute-pos-delta-when-change-marker
                       current-input edit-content new-value marker (dec slash-pos))]
          ;; TODO: any performance issue?
          (js/setTimeout #(cursor/move-cursor-to current-input new-pos) 10))))))

(defmethod handle-step :editor/set-priority [[_ priority] format]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [format (or (db/get-page-format (state/get-current-page)) (state/get-preferred-format))
            edit-content (gobj/get current-input "value")
            new-priority (util/format "[#%s]" priority)
            new-value (string/trim (priority/add-or-update-priority edit-content format new-priority))]
        (state/set-edit-content! input-id new-value)))))

(defmethod handle-step :editor/set-heading [[_ heading]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [edit-content (gobj/get current-input "value")
            heading-pattern #"^#+\s+"
            new-value (cond
                        (util/safe-re-find heading-pattern edit-content)
                        (string/replace-first edit-content
                                              heading-pattern
                                              (str heading " "))
                        :else
                        (str heading " " (string/triml edit-content)))]
        (state/set-edit-content! input-id new-value)))))

(defmethod handle-step :editor/search-page [[_]]
  (state/set-editor-show-page-search! true))

(defmethod handle-step :editor/search-page-hashtag [[_]]
  (state/set-editor-show-page-search-hashtag! true))

(defmethod handle-step :editor/search-block [[_ type]]
  (state/set-editor-show-block-search! true))

(defmethod handle-step :editor/search-template [[_]]
  (state/set-editor-show-template-search! true))

(defmethod handle-step :editor/show-input [[_ option]]
  (state/set-editor-show-input! option))

(defmethod handle-step :editor/show-zotero [[_]]
  (state/set-editor-show-zotero! true))

(defmethod handle-step :youtube/insert-timestamp [[_]]
  (let [input-id (state/get-edit-input-id)
        macro (youtube/gen-youtube-ts-macro)]
    (insert! input-id macro {})))

(defmethod handle-step :editor/show-date-picker [[_ type]]
  (if (and
       (contains? #{:scheduled :deadline} type)
       (when-let [value (gobj/get (state/get-input) "value")]
         (string/blank? value)))
    (do
      (notification/show! [:div "Please add some content first."] :warning)
      (restore-state false))
    (state/set-editor-show-date-picker! true)))

(defmethod handle-step :editor/click-hidden-file-input [[_ input-id]]
  (when-let [input-file (gdom/getElement "upload-file")]
    (.click input-file)))

(defmethod handle-step :default [[type & _args]]
  (prn "No handler for step: " type))

(defn handle-steps
  [vector format]
  (doseq [step vector]
    (handle-step step format)))

(defn exec-plugin-simple-command!
  [pid {:keys [key label block-id] :as cmd} action]
  (let [format (and block-id (:block/format (db-util/pull [:block/uuid block-id])))
        inputs (vector (conj action (assoc cmd :pid pid)))]
    (handle-steps inputs format)))
