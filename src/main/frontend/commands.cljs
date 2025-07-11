(ns frontend.commands
  "Provides functionality for commands and advanced commands"
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db :as db]
            [frontend.extensions.video.youtube :as youtube]
            [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.db-based.property.util :as db-pu]
            [frontend.handler.draw :as draw]
            [frontend.handler.file-based.property :as file-property-handler]
            [frontend.handler.file-based.status :as file-based-status]
            [frontend.handler.notification :as notification]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.property.file :as property-file]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.cursor :as cursor]
            [frontend.util.file-based.priority :as priority]
            [frontend.util.ref :as ref]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.macro :as macro-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.graph-parser.property :as gp-property]
            [promesa.core :as p]))

;; TODO: move to frontend.handler.editor.commands

(defonce hashtag "#")
(defonce colon ":")
(defonce command-trigger "/")
(defonce command-ask "\\")
(defonce *current-command (atom nil))

(def query-doc
  [:div {:on-pointer-down (fn [e] (.stopPropagation e))}
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
    [:a {:href "https://docs.logseq.com/#/page/queries"
         :target "_blank"}
     "Queries documentation"]
    "."]])

(defn link-steps []
  [[:editor/input (str command-trigger "link")]
   [:editor/show-input [{:command :link
                         :id :link
                         :placeholder "Link"
                         :autoFocus true}
                        {:command :link
                         :id :label
                         :placeholder "Label"}]]])

(defn image-link-steps []
  [[:editor/input (str command-trigger "link")]
   [:editor/show-input [{:command :image-link
                         :id :link
                         :placeholder "Link"
                         :autoFocus true}
                        {:command :image-link
                         :id :label
                         :placeholder "Label"}]]])

(defn zotero-steps []
  [[:editor/input (str command-trigger "zotero")]
   [:editor/show-zotero]])

(def *extend-slash-commands (atom []))

(defn register-slash-command [cmd]
  (swap! *extend-slash-commands conj cmd))

(defn ->marker
  [marker]
  [[:editor/clear-current-slash]
   [:editor/set-status marker]
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
    [[:editor/input template {:last-pattern command-trigger
                              :backward-pos 2}]]))

(defn file-based-embed-page
  []
  [[:editor/input "{{embed [[]]}}" {:last-pattern command-trigger
                                    :backward-pos 4}]
   [:editor/search-page :embed]])

(defn file-based-embed-block
  []
  [[:editor/input "{{embed (())}}" {:last-pattern command-trigger
                                    :backward-pos 4}]
   [:editor/search-block :embed]])

(defn file-based-statuses
  []
  (let [workflow (state/get-preferred-workflow)]
    (if (= :now workflow)
      ["LATER" "NOW" "TODO" "DOING" "DONE" "WAITING" "CANCELED"]
      ["TODO" "DOING" "LATER" "NOW" "DONE" "WAITING" "CANCELED"])))

(defn db-based-statuses
  []
  (map (fn [e] (:block/title e))
       (db-pu/get-closed-property-values :logseq.property/status)))

(defn db-based-embed-page
  []
  [[:editor/input "[[]]" {:last-pattern command-trigger
                          :backward-pos 2}]
   [:editor/search-page :embed]])

(defn db-based-embed-block
  []
  [[:editor/input "" {:last-pattern command-trigger}]
   [:editor/search-block :embed]])

(defn db-based-query
  []
  [[:editor/input "" {:last-pattern command-trigger}]
   [:editor/run-query-command]])

(defn file-based-query
  []
  [[:editor/input (str macro-util/query-macro " }}") {:backward-pos 2}]
   [:editor/exit]])

(defn query-steps
  []
  (if (config/db-based-graph? (state/get-current-repo))
    (db-based-query)
    (file-based-query)))

(defn- calc-steps
  []
  (if (config/db-based-graph? (state/get-current-repo))
    [[:editor/input "" {:last-pattern command-trigger}]
     [:editor/upsert-type-block :code "calc"]
     [:codemirror/focus]]
    [[:editor/input "```calc\n\n```" {:type "block"
                                      :backward-pos 4}]
     [:codemirror/focus]]))

(defn ->block
  ([type]
   (->block type nil))
  ([type optional]
   (let [format (get (state/get-edit-block) :block/format)
         markdown-src? (and (= format :markdown)
                            (= (string/lower-case type) "src"))
         [left right] (cond
                        markdown-src?
                        ["```" "\n```"]

                        :else
                        (->> ["#+BEGIN_%s" "\n#+END_%s"]
                             (map #(util/format %
                                                (string/upper-case type)))))
         template (str
                   left
                   (if optional (str " " optional) "")
                   "\n"
                   right)
         backward-pos (if (= type "src")
                        (+ 1 (count right))
                        (count right))]
     [[:editor/input template {:type "block"
                               :last-pattern command-trigger
                               :backward-pos backward-pos}]])))

(defn- advanced-query-steps
  []
  (if (config/db-based-graph? (state/get-current-repo))
    [[:editor/input "" {:last-pattern command-trigger}]
     [:editor/set-property :block/tags :logseq.class/Query]
     [:editor/set-property :logseq.property/query ""]
     [:editor/set-property-on-block-property :logseq.property/query :logseq.property.node/display-type :code]
     [:editor/set-property-on-block-property :logseq.property/query :logseq.property.code/lang "clojure"]
     [:editor/exit]]
    (->block "query")))

(defn db-based-code-block
  []
  [[:editor/input "" {:last-pattern command-trigger}]
   [:editor/upsert-type-block :code]
   [:editor/exit]])

(defn file-based-code-block
  []
  [[:editor/input "```\n```\n" {:type "block"
                                :backward-pos 5
                                :only-breakline? true}]
   [:editor/select-code-block-mode]])

(defn code-block-steps
  []
  (if (config/db-based-graph? (state/get-current-repo))
    (db-based-code-block)
    (file-based-code-block)))

(defn quote-block-steps
  []
  (if (config/db-based-graph? (state/get-current-repo))
    [[:editor/input "" {:last-pattern command-trigger}]
     [:editor/set-property :logseq.property.node/display-type :quote]]
    (->block "quote")))

(defn math-block-steps
  []
  (if (config/db-based-graph? (state/get-current-repo))
    [[:editor/input "" {:last-pattern command-trigger}]
     [:editor/set-property :logseq.property.node/display-type :math]]
    (->block "export" "latex")))

(defn get-statuses
  []
  (let [db-based? (config/db-based-graph? (state/get-current-repo))
        result (->>
                (if db-based?
                  (db-based-statuses)
                  (file-based-statuses))
                (mapv (fn [command]
                        (let [icon (if db-based?
                                     (case command
                                       "Canceled" "Cancelled"
                                       "Doing" "InProgress50"
                                       command)
                                     "square-asterisk")]
                          [command (->marker command) (str "Set status to " command) icon]))))]
    (when (seq result)
      (map (fn [v] (conj v "TASK STATUS")) result))))

(defn file-based-priorities
  []
  ["A" "B" "C"])

(defn db-based-priorities
  []
  (map (fn [e] (:block/title e))
       (db-pu/get-closed-property-values :logseq.property/priority)))

(defn get-priorities
  []
  (let [db-based? (config/db-based-graph? (state/get-current-repo))
        with-no-priority #(if db-based? (cons ["No priority" (->priority nil) "" :icon/priorityLvlNone] %) %)
        result (->>
                (if db-based?
                  (db-based-priorities)
                  (file-based-priorities))
                (mapv (fn [item]
                        (let [command item]
                          [command
                           (->priority item)
                           (str "Set priority to " item)
                           (if db-based?
                             (str "priorityLvl" item)
                             (str "circle-letter-" (util/safe-lower-case item)))])))
                (with-no-priority)
                (vec))]
    (when (seq result)
      (map (fn [v] (into v ["PRIORITY"])) result))))

;; Credits to roamresearch.com

(defn- ->heading
  [heading]
  [[:editor/clear-current-slash]
   [:editor/set-heading heading]
   [:editor/move-cursor-to-end]])

(defn- headings
  []
  (mapv (fn [level]
          (let [heading (str "Heading " level)]
            [heading (->heading level) heading (str "h-" level) "Heading"])) (range 1 7)))

(defonce *latest-matched-command (atom ""))
(defonce *matched-commands (atom nil))
(defonce *initial-commands (atom nil))

(defn ->properties
  []
  [[:editor/clear-current-slash]
   [:editor/insert-properties]
   [:editor/move-cursor-to-properties]])

(defn ^:large-vars/cleanup-todo commands-map
  [get-page-ref-text]
  (let [db? (config/db-based-graph? (state/get-current-repo))
        embed-page (if db? db-based-embed-page file-based-embed-page)
        embed-block (if db? db-based-embed-block file-based-embed-block)]
    (->>
     (concat
        ;; basic
      [[(if db? "Node reference" "Page reference")
        [[:editor/input page-ref/left-and-right-brackets {:backward-pos 2}]
         [:editor/search-page]]
        (if db? "Create a backlink to a node (a page or a block)"
            "Create a backlink to a BLOCK")
        :icon/pageRef
        "BASIC"]
       (when-not db? ["Page embed" (embed-page) "Embed a page here" :icon/pageEmbed])
       (when-not db?
         ["Block reference" [[:editor/input block-ref/left-and-right-parens {:backward-pos 2}]
                             [:editor/search-block :reference]]
          "Create a backlink to a block" :icon/blockRef])
       [(if db? "Node embed" "Block embed")
        (embed-block)
        (if db? "Embed a node here" "Embed a block here")
        :icon/blockEmbed]]

        ;; format
      [["Link" (link-steps) "Create a HTTP link" :icon/link "FORMAT"]
       ["Image link" (image-link-steps) "Create a HTTP link to a image" :icon/photoLink]
       (when (state/markdown?)
         ["Underline" [[:editor/input "<ins></ins>"
                        {:last-pattern command-trigger
                         :backward-pos 6}]] "Create a underline text decoration"
          :icon/underline])
       ["Code block"
        (code-block-steps)
        "Insert code block"
        :icon/code]
       ["Quote"
        (quote-block-steps)
        "Create a quote block"
        :icon/quote]
       ["Math block"
        (math-block-steps)
        "Create a latex block"
        :icon/math]]

      (headings)

      ;; task management
      (get-statuses)

      ;; task date
      [["Deadline"
        [[:editor/clear-current-slash]
         [:editor/set-deadline]]
        ""
        :icon/calendar-stats
        "TASK DATE"]
       ["Scheduled"
        [[:editor/clear-current-slash]
         [:editor/set-scheduled]]
        ""
        :icon/calendar-month
        "TASK DATE"]]

      ;; priority
      (get-priorities)

      ;; time & date
      [["Tomorrow"
        #(get-page-ref-text (date/tomorrow))
        "Insert the date of tomorrow"
        :icon/tomorrow
        "TIME & DATE"]
       ["Yesterday" #(get-page-ref-text (date/yesterday)) "Insert the date of yesterday" :icon/yesterday]
       ["Today" #(get-page-ref-text (date/today)) "Insert the date of today" :icon/calendar]
       ["Current time" #(date/get-current-time) "Insert current time" :icon/clock]
       ["Date picker" [[:editor/show-date-picker]] "Pick a date and insert here" :icon/calendar-dots]]

      ;; order list
      [["Number list"
        [[:editor/clear-current-slash]
         [:editor/toggle-own-number-list]]
        "Number list"
        :icon/numberedParents
        "LIST TYPE"]
       ["Number children" [[:editor/clear-current-slash]
                           [:editor/toggle-children-number-list]]
        "Number children"
        :icon/numberedChildren]]

      ;; https://orgmode.org/manual/Structure-Templates.html
      (when-not db?
        (cond->
         [;; Should this be replaced by "Code block"?
          ["Src" (->block "src") "Create a code block"]
          ["Math block" (->block "export" "latex") "Create a latex block"]
          ["Note" (->block "note") "Create a note block"]
          ["Tip" (->block "tip") "Create a tip block"]
          ["Important" (->block "important") "Create an important block"]
          ["Caution" (->block "caution") "Create a caution block"]
          ["Pinned" (->block "pinned") "Create a pinned block"]
          ["Warning" (->block "warning") "Create a warning block"]
          ["Example" (->block "example") "Create an example block"]
          ["Export" (->block "export") "Create an export block"]
          ["Verse" (->block "verse") "Create a verse block"]
          ["Ascii" (->block "export" "ascii") "Create an ascii block"]
          ["Center" (->block "center") "Create a center block"]]

        ;; FIXME: current page's format
          (= :org (state/get-preferred-format))
          (conj ["Properties" (->properties)])))

      ;; advanced
      [["Query" (query-steps) query-doc :icon/query "ADVANCED"]
       ["Advanced Query" (advanced-query-steps) "Create an advanced query block" :icon/query]
       (when-not db?
         ["Zotero" (zotero-steps) "Import Zotero journal article" :icon/circle-letter-z])
       ["Query function" [[:editor/input "{{function }}" {:backward-pos 2}]] "Create a query function" :icon/queryCode]
       ["Calculator"
        (calc-steps)
        "Insert a calculator" :icon/calculator]
       (when-not db?
         ["Draw" (fn []
                   (let [file (draw/file-name)
                         path (str common-config/default-draw-directory "/" file)
                         text (ref/->page-ref path)]
                     (p/let [_ (draw/create-draw-with-default-content path)]
                       (println "draw file created, " path))
                     text)) "Draw a graph with Excalidraw"])

       ["Upload an asset"
        [[:editor/click-hidden-file-input :id]]
        "Upload file types like image, pdf, docx, etc.)"
        :icon/upload]

       ["Template" [[:editor/input command-trigger nil]
                    [:editor/search-template]] "Insert a created template here"
        :icon/template]

       ["Embed HTML " (->inline "html") "" :icon/htmlEmbed]

       ["Embed Video URL" [[:editor/input "{{video }}" {:last-pattern command-trigger
                                                        :backward-pos 2}]] ""
        :icon/videoEmbed]

       ["Embed Youtube timestamp" [[:youtube/insert-timestamp]] "" :icon/videoEmbed]

       ["Embed Twitter tweet" [[:editor/input "{{tweet }}" {:last-pattern command-trigger
                                                            :backward-pos 2}]] ""
        :icon/xEmbed]

       (when db?
         ["Add new property" [[:editor/clear-current-slash]
                              [:editor/new-property]] ""
          :icon/cube-plus])]

      (let [commands (cond->> @*extend-slash-commands
                       db?
                       (remove (fn [command] (when (map? (last command))
                                               (false? (:db-graph? (last command)))))))]
        commands)

;; Allow user to modify or extend, should specify how to extend.

      (state/get-commands)
      (when-let [plugin-commands (seq (some->> (state/get-plugins-slash-commands)
                                               (mapv #(vec (concat % [nil :icon/puzzle])))))]
        (-> plugin-commands (vec) (update 0 (fn [v] (conj v "PLUGINS"))))))
     (remove nil?)
     (util/distinct-by-last-wins first))))

(defn init-commands!
  [get-page-ref-text]
  (let [commands (commands-map get-page-ref-text)]
    (reset! *latest-matched-command "")
    (reset! *initial-commands commands)
    (reset! *matched-commands commands)))

(defn set-matched-commands!
  [command matched-commands]
  (reset! *latest-matched-command command)
  (reset! *matched-commands matched-commands))

(defn reinit-matched-commands!
  []
  (set-matched-commands! "" @*initial-commands))

(defn restore-state
  []
  (state/clear-editor-action!)
  (reinit-matched-commands!))

(defn insert!
  [id value
   {:keys [last-pattern postfix-fn backward-pos end-pattern backward-truncate-number
           command only-breakline?]
    :as _option}]
  (when-let [input (gdom/getElement id)]
    (let [last-pattern (when-not (= last-pattern :skip-check)
                         (when-not backward-truncate-number
                           (or last-pattern command-trigger)))
          edit-content (gobj/get input "value")
          current-pos (cursor/pos input)
          current-pos (or
                       (when (and end-pattern (string? end-pattern))
                         (when-let [i (string/index-of (common-util/safe-subs edit-content current-pos) end-pattern)]
                           (+ current-pos i)))
                       current-pos)
          orig-prefix (subs edit-content 0 current-pos)
          postfix (subs edit-content current-pos)
          postfix (if postfix-fn (postfix-fn postfix) postfix)
          space? (let [space? (when (and last-pattern orig-prefix)
                                (let [s (when-let [last-index (string/last-index-of orig-prefix last-pattern)]
                                          (common-util/safe-subs orig-prefix 0 last-index))]
                                  (not
                                   (or
                                    (and (= :page-ref command)
                                         (util/cjk-string? value)
                                         (or (util/cjk-string? (str (last orig-prefix)))
                                             (util/cjk-string? (str (first postfix)))))
                                    (and s
                                         (string/ends-with? s "(")
                                         (or (string/starts-with? last-pattern block-ref/left-parens)
                                             (string/starts-with? last-pattern page-ref/left-brackets)))
                                    (and s (string/starts-with? s "{{embed"))
                                    (and s (= (last s) \#) (string/starts-with? last-pattern "[["))
                                    (and last-pattern
                                         (or (string/ends-with? last-pattern gp-property/colons)
                                             (string/starts-with? last-pattern gp-property/colons)))))))]
                   (if (and space? (or (string/starts-with? last-pattern "#[[")
                                       (string/starts-with? last-pattern "```")))
                     false
                     space?))
          prefix (cond
                   (and backward-truncate-number (integer? backward-truncate-number))
                   (str (common-util/safe-subs orig-prefix 0 (- (count orig-prefix) backward-truncate-number))
                        (when-not (zero? backward-truncate-number)
                          value))

                   (string/blank? last-pattern)
                   (if space?
                     (util/concat-without-spaces orig-prefix value)
                     (str orig-prefix value))

                   :else
                   (util/replace-last last-pattern orig-prefix value space?))
          postfix (cond-> postfix
                    (and only-breakline? postfix
                         (= (get postfix 0) "\n"))
                    (string/replace-first "\n" ""))
          new-value (cond
                      (string/blank? postfix)
                      prefix

                      space?
                      (util/concat-without-spaces prefix postfix)

                      :else
                      (str prefix postfix))
          new-pos (- (count prefix)
                     (or backward-pos 0))]
      (when-not (and (not (string/blank? value))
                     (string/blank? new-value))
        (state/set-block-content-and-last-pos! id new-value new-pos)
        (cursor/move-cursor-to input new-pos)))))

(defn simple-insert!
  [id value
   {:keys [backward-pos forward-pos check-fn]
    :as _option}]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
        current-pos (cursor/pos input)
        prefix (subs edit-content 0 current-pos)
        surfix (subs edit-content current-pos)
        new-value (str prefix
                       value
                       surfix)
        new-pos (- (+ (count prefix)
                      (count value)
                      (or forward-pos 0))
                   (or backward-pos 0))]
    (state/set-block-content-and-last-pos! id new-value new-pos)
    (cursor/move-cursor-to input new-pos)
    (when check-fn
      (check-fn new-value (dec (count prefix)) new-pos))))

(defn simple-replace!
  [id value selected
   {:keys [backward-pos forward-pos check-fn]
    :as _option}]
  (let [selected? (not (string/blank? selected))
        input (gdom/getElement id)
        edit-content (gobj/get input "value")]
    (when edit-content
      (let [current-pos (cursor/pos input)
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
          (check-fn new-value (dec (count prefix))))))))

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

(defn delete-selection!
  [id]
  (let [input (gdom/getElement id)
        edit-content (gobj/get input "value")
        start (util/get-selection-start input)
        end (util/get-selection-end input)]
    (when-not (= start end)
      (let [prefix (subs edit-content 0 start)
            new-value (str prefix
                           (subs edit-content end))
            new-pos (count prefix)]
        (state/set-block-content-and-last-pos! id new-value new-pos)
        (cursor/move-cursor-to input new-pos)))))

(defn get-matched-commands
  ([text]
   (get-matched-commands text @*initial-commands))
  ([text commands]
   (search/fuzzy-search commands text
                        :extract-fn first
                        :limit 50)))

(defmulti handle-step first)

(defmethod handle-step :editor/hook [[_ event {:keys [pid uuid] :as payload}] format]
  (plugin-handler/hook-plugin-editor event (merge payload {:format format :uuid (or uuid (:block/uuid (state/get-edit-block)))}) pid))

(defmethod handle-step :editor/input [[_ value option]]
  (when-let [input-id (state/get-edit-input-id)]
    (let [type (:type option)
          input (gdom/getElement input-id)
          beginning-of-line? (or (cursor/beginning-of-line? input)
                                 (= 1 (:pos (:pos (state/get-editor-action-data)))))
          value (if (and (contains? #{"block" "properties"} type)
                         (not beginning-of-line?))
                  (str "\n" value)
                  value)]
      (insert! input-id value option)
      (state/clear-editor-action!))))

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
      (cursor/move-cursor-to current-input (state/get-editor-last-pos)))))

(defmethod handle-step :editor/clear-current-slash [[_ space?]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [edit-content (gobj/get current-input "value")
            current-pos (cursor/pos current-input)
            prefix (subs edit-content 0 current-pos)
            prefix (util/replace-last command-trigger prefix "" (boolean space?))
            new-value (str prefix
                           (subs edit-content current-pos))]
        (state/set-block-content-and-last-pos! input-id
                                               new-value
                                               (count prefix))))))

(defn compute-pos-delta-when-change-marker
  [edit-content marker pos]
  (let [old-marker (some->> (first (util/safe-re-find file-based-status/bare-marker-pattern edit-content))
                            (string/trim))
        pos-delta (- (count marker)
                     (count old-marker))
        pos-delta (cond (string/blank? old-marker)
                        (inc pos-delta)
                        (string/blank? marker)
                        (dec pos-delta)

                        :else
                        pos-delta)]
    (max (+ pos pos-delta) 0)))

(defn- file-based-set-status
  [marker format]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [edit-content (gobj/get current-input "value")
            slash-pos (:pos (:pos (state/get-editor-action-data)))
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
                                                 (file-based-status/marker-pattern format)
                                                 (str marker " ")))]
        (state/set-edit-content! input-id new-value)
        (let [new-pos (compute-pos-delta-when-change-marker
                       edit-content marker (dec slash-pos))]
          ;; TODO: any performance issue?
          (js/setTimeout #(cursor/move-cursor-to current-input new-pos) 10))))))

(defn- db-based-set-status
  [status]
  (when-let [block (state/get-edit-block)]
    (db-property-handler/batch-set-property-closed-value! [(:block/uuid block)] :logseq.property/status status)))

(defmethod handle-step :editor/set-status [[_ status] format]
  (if (config/db-based-graph? (state/get-current-repo))
    (db-based-set-status status)
    (file-based-set-status status format)))

(defmethod handle-step :editor/set-property [[_ property-id value]]
  (when (config/db-based-graph? (state/get-current-repo))
    (when-let [block (state/get-edit-block)]
      (db-property-handler/set-block-property! (:db/id block) property-id value))))

(defmethod handle-step :editor/set-property-on-block-property [[_ block-property-id property-id value]]
  (when (config/db-based-graph? (state/get-current-repo))
    (let [updated-block (when-let [block-uuid (:block/uuid (state/get-edit-block))]
                          (db/entity [:block/uuid block-uuid]))
          block-property-value (get updated-block block-property-id)]
      (when block-property-value
        (db-property-handler/set-block-property! (:db/id block-property-value) property-id value)))))

(defmethod handle-step :editor/upsert-type-block [[_ type lang]]
  (when (config/db-based-graph? (state/get-current-repo))
    (when-let [block (state/get-edit-block)]
      (state/pub-event! [:editor/upsert-type-block {:block block :type type :lang lang}]))))

(defn- file-based-set-priority
  [priority]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [format (or (db/get-page-format (state/get-current-page)) (state/get-preferred-format))
            edit-content (gobj/get current-input "value")
            new-priority (util/format "[#%s]" priority)
            new-value (string/trim (priority/add-or-update-priority edit-content format new-priority))]
        (state/set-edit-content! input-id new-value)))))

(defn- db-based-set-priority
  [priority]
  (when-let [block (state/get-edit-block)]
    (if (nil? priority)
      (db-property-handler/remove-block-property! (:block/uuid block) :logseq.property/priority)
      (db-property-handler/batch-set-property-closed-value! [(:block/uuid block)] :logseq.property/priority priority))))

(defmethod handle-step :editor/set-priority [[_ priority] _format]
  (if (config/db-based-graph? (state/get-current-repo))
    (db-based-set-priority priority)
    (file-based-set-priority priority)))

(defmethod handle-step :editor/set-scheduled [[_]]
  (if (config/db-based-graph? (state/get-current-repo))
    (state/pub-event! [:editor/new-property {:property-key "Scheduled"}])
    (handle-step [:editor/show-date-picker :scheduled])))

(defmethod handle-step :editor/set-deadline [[_]]
  (if (config/db-based-graph? (state/get-current-repo))
    (state/pub-event! [:editor/new-property {:property-key "Deadline"}])
    (handle-step [:editor/show-date-picker :deadline])))

(defmethod handle-step :editor/run-query-command [[_]]
  (state/pub-event! [:editor/run-query-command]))

(defmethod handle-step :editor/insert-properties [[_ _] _format]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [format (or (db/get-page-format (state/get-current-page)) (state/get-preferred-format))
            edit-content (gobj/get current-input "value")
            new-value (file-property-handler/insert-property format edit-content "" "")]
        (state/set-edit-content! input-id new-value)))))

(defmethod handle-step :editor/move-cursor-to-properties [[_]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [format (or (db/get-page-format (state/get-current-page)) (state/get-preferred-format))]
        (property-file/goto-properties-end-when-file-based format current-input)
        (cursor/move-cursor-backward current-input 3)))))

(defn file-based-set-markdown-heading
  [content heading]
  (let [heading-str (apply str (repeat heading "#"))]
    (if (util/safe-re-find common-util/markdown-heading-pattern content)
      (common-util/clear-markdown-heading content)
      (str heading-str " " (string/triml content)))))

(def clear-markdown-heading common-util/clear-markdown-heading)

(defmethod handle-step :editor/set-heading [[_ heading]]
  (when-let [input-id (state/get-edit-input-id)]
    (when-let [current-input (gdom/getElement input-id)]
      (let [current-block (state/get-edit-block)
            format (get current-block :block/format :markdown)]
        (if (config/db-based-graph?)
          (state/pub-event! [:editor/set-heading current-block heading])
          (if (= format :markdown)
            (let [edit-content (gobj/get current-input "value")
                  new-content (file-based-set-markdown-heading edit-content heading)]
              (state/set-edit-content! input-id new-content))
            (state/pub-event! [:editor/set-heading current-block heading])))))))

(defmethod handle-step :editor/search-page [_]
  (state/set-editor-action! :page-search))

(defmethod handle-step :editor/search-page-hashtag [[_]]
  (state/set-editor-action! :page-search-hashtag))

(defmethod handle-step :editor/search-block [[_ type]]
  (when (and (= type :embed) (config/db-based-graph? (state/get-current-repo)))
    (reset! *current-command "Block embed")
    (state/set-editor-action-data! {:pos (cursor/get-caret-pos (state/get-input))}))
  (state/set-editor-action! :block-search))

(defmethod handle-step :editor/search-template [[_]]
  (state/set-editor-action! :template-search))

(defmethod handle-step :editor/show-input [[_ option]]
  (state/set-editor-show-input! option))

(defmethod handle-step :editor/show-zotero [[_]]
  (state/set-editor-action! :zotero))

(defn insert-youtube-timestamp
  []
  (let [input-id (state/get-edit-input-id)
        macro (youtube/gen-youtube-ts-macro)]
    (when-let [input (gdom/getElement input-id)]
      (when macro
        (util/insert-at-current-position! input (str macro " "))))))

(defmethod handle-step :youtube/insert-timestamp [[_]]
  (let [input-id (state/get-edit-input-id)
        macro (youtube/gen-youtube-ts-macro)]
    (insert! input-id macro {})))

(defmethod handle-step :editor/toggle-children-number-list [[_]]
  (when-let [block (state/get-edit-block)]
    (state/pub-event! [:editor/toggle-children-number-list block])))

(defmethod handle-step :editor/toggle-own-number-list [[_]]
  (when-let [block (state/get-edit-block)]
    (state/pub-event! [:editor/toggle-own-number-list block])))

(defmethod handle-step :editor/remove-own-number-list [[_]]
  (when-let [block (state/get-edit-block)]
    (state/pub-event! [:editor/remove-own-number-list block])))

(defmethod handle-step :editor/show-date-picker [[_ type]]
  (if (and
       (contains? #{:scheduled :deadline} type)
       (string/blank? (gobj/get (state/get-input) "value")))
    (do
      (notification/show! [:div "Please add some content first."] :warning)
      (restore-state))
    (do
      (state/set-timestamp-block! nil)
      (state/set-editor-action! :datepicker))))

(defmethod handle-step :editor/select-code-block-mode [[_]]
  (-> (p/delay 50)
      (p/then
       (fn []
         (when-let [input (state/get-input)]
            ;; update action cursor position
           (state/set-editor-action-data! {:pos (cursor/get-caret-pos input)})
           (state/set-editor-action! :select-code-block-mode))))))

(defmethod handle-step :editor/click-hidden-file-input [[_ _input-id]]
  (when-let [input-file (gdom/getElement "upload-file")]
    (.click input-file)))

(defmethod handle-step :editor/exit [[_]]
  (p/do!
   (state/pub-event! [:editor/save-current-block])
   (state/clear-edit!)))

(defmethod handle-step :editor/new-property [[_]]
  (state/pub-event! [:editor/new-property]))

(defmethod handle-step :default [[type & _args]]
  (prn "No handler for step: " type))

(defn handle-steps
  [vector' format]
  (if (config/db-based-graph? (state/get-current-repo))
    (p/doseq [step vector']
      (handle-step step format))
    (doseq [step vector']
      (handle-step step format))))

(defn exec-plugin-simple-command!
  [pid {:keys [block-id] :as cmd} action]
  (let [format (and block-id (get (db/entity [:block/uuid block-id]) :block/format :markdown))
        inputs (vector (conj action (assoc cmd :pid pid)))]
    (handle-steps inputs format)))
