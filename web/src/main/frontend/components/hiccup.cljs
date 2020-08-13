(ns frontend.components.hiccup
  (:refer-clojure :exclude [range])
  (:require [frontend.config :as config]
            [cljs.core.match :refer-macros [match]]
            [clojure.string :as string]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.state :as state]
            [frontend.db :as db]
            [dommy.core :as d]
            [datascript.core :as dc]
            [goog.dom :as gdom]
            [frontend.handler.expand :as expand]
            [frontend.components.editor :as editor]
            [frontend.components.svg :as svg]
            [frontend.components.draw :as draw]
            [frontend.components.heading :as heading]
            [frontend.ui :as ui]
            [frontend.components.widgets :as widgets]
            [frontend.handler :as handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.image :as image-handler]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.dnd :as dnd]
            [goog.object :as gobj]
            [medley.core :as medley]
            [cljs.reader :as reader]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.mixins :as mixins]
            [frontend.db-mixins :as db-mixins]
            [frontend.extensions.latex :as latex]
            [frontend.extensions.code :as code]
            [frontend.extensions.sci :as sci]
            ["/frontend/utils" :as utils]
            [frontend.format.block :as block]
            [clojure.walk :as walk]
            [cljs-bean.core :as bean]
            [frontend.handler.image :as image-handler]
            [frontend.format.mldoc :as mldoc]))

;; local state
(defonce *heading-children
  (atom {}))

(defonce *dragging?
  (atom false))
(defonce *dragging-heading
  (atom nil))
(defonce *move-to-top?
  (atom false))

(defonce container-ids (atom {}))
(defonce container-idx (atom 0))

;; TODO:
;; add `key`

(defn- remove-nils
  [col]
  (remove nil? col))

(defn anchor-link
  [s]
  (.anchorLink js/window.Mldoc s))

(defn vec-cat
  [& args]
  (->> (apply concat args)
       remove-nils
       vec))

(defn ->elem
  ([elem items]
   (->elem elem nil items))
  ([elem attrs items]
   (let [elem (keyword elem)]
     (if attrs
       (vec
        (cons elem
              (cons attrs
                    (seq items))))
       (vec
        (cons elem
              (seq items)))))))

(defn- join-lines
  [l]
  (string/join "\n" l))

(defn- string-of-url
  [url]
  (match url
    (:or ["File" s] ["Search" s])
    s
    ["Complex" m]
    (let [{:keys [link protocol]} m]
      (if (= protocol "file")
        link
        (str protocol ":" link)))))

(defn- get-file-absolute-path
  [path]
  (let [path (string/replace path "file:" "")
        current-file (:file/path (:page/file (db/get-current-page)))]
    (when current-file
      (let [parts (reverse (string/split current-file #"/"))
            parts-2 (reverse (string/split path #"/"))
            parts (loop [acc []
                         col parts-2
                         idx 0]
                    (if (empty? col)
                      acc
                      (let [part (case (first col)
                                   ".."
                                   (nth parts idx)
                                   "."
                                   ""
                                   (first col))]
                        (recur (conj acc part)
                               (rest col)
                               (inc idx)))))
            parts (remove #(= % "") parts)]
        (string/join "/" (reverse parts))))))

;; TODO: safe encoding asciis
;; TODO: image link to another link
(defn image-link [url href label]
  (let [href (if (string/starts-with? href "http")
               href
               (get-file-absolute-path href))]
    [:img.rounded-sm.shadow-xl.mb-2.mt-2
     {:class "object-contain object-center"
      :loading "lazy"
      :style {:max-height "24rem"}
      ;; :on-error (fn [])
      :src href
      :title (second (first label))}]))

(defn repetition-to-string
  [[[kind] [duration] n]]
  (let [kind (case kind
               "Dotted" "."
               "Plus" "+"
               "DoublePlus" "++")]
    (str kind n (string/lower-case (str (first duration))))))

(defn timestamp-to-string
  [{:keys [active date time repetition wday active]}]
  (let [{:keys [year month day]} date
        {:keys [hour min]} time
        [open close] (if active ["<" ">"] ["[" "]"])
        repetition (if repetition
                     (str " " (repetition-to-string repetition))
                     "")
        hour (if hour (util/zero-pad hour))
        min  (if min (util/zero-pad min))
        time (cond
               (and hour min)
               (util/format " %s:%s" hour min)
               hour
               (util/format " %s" hour)
               :else
               "")]
    (util/format "%s%s-%s-%s %s%s%s%s"
                 open
                 (str year)
                 (util/zero-pad month)
                 (util/zero-pad day)
                 wday
                 time
                 repetition
                 close)))

(defn timestamp [{:keys [active date time repetition wday] :as t} kind]
  (let [prefix (case kind
                 "Scheduled"
                 [:i {:class "fa fa-calendar"
                      :style {:margin-right 3.5}}]
                 "Deadline"
                 [:i {:class "fa fa-calendar-times-o"
                      :style {:margin-right 3.5}}]
                 "Date"
                 nil
                 "Closed"
                 nil
                 "Started"
                 [:i {:class "fa fa-clock-o"
                      :style {:margin-right 3.5}}]
                 "Start"
                 "From: "
                 "Stop"
                 "To: "
                 nil)]
    (let [class (if (= kind "Closed")
                  "line-through")]
      [:span.timestamp (cond-> {:active (str active)}
                         class
                         (assoc :class class))
       prefix
       (timestamp-to-string t)])))

(defn range [{:keys [start stop]} stopped?]
  [:div {:class "timestamp-range"
         :stopped stopped?}
   (timestamp start "Start")
   (timestamp stop "Stop")])

(declare map-inline)
(declare block)

(defn page-cp
  [{:keys [html-export?] :as config} page]
  (let [page-name (:page/name page)
        original-page-name (get page :page/original-name page-name)
        page (string/lower-case page-name)
        href (if html-export?
               (util/encode-str page)
               (str "/page/" (util/encode-str page)))]
    [:a.page-ref
     {:href href
      :on-click (fn [e]
                  (util/stop e)
                  (when (gobj/get e "shiftKey")
                    (when-let [page (db/entity [:page/name page])]
                      (state/sidebar-add-block!
                       (state/get-current-repo)
                       (:db/id page)
                       :page
                       {:page page}))))}
     original-page-name]))

(defn- latex-environment-content
  [name option content]
  (if (= (string/lower-case name) "equation")
    content
    (util/format "\\begin%s\n%s\\end{%s}"
                 (str "{" name "}" option)
                 content
                 name)))

(declare headings-container)

(rum/defc block-embed < rum/reactive
  (db-mixins/clear-query-cache
   (fn [state]
     (let [repo (state/get-current-repo)
           heading-id (last (:rum/args state))]
       [repo :heading/block heading-id])))
  [config id]
  (let [headings (db/get-heading-and-children (state/get-current-repo) id)]
    [:div.embed-block.py-2.my-2.px-3.bg-base-2 {:style {:z-index 2}}
     [:p
      [:code "Embed block:"]]
     (headings-container headings (assoc config :embed? true))]))

(rum/defc page-embed < rum/reactive
  (db-mixins/clear-query-cache
   (fn [state]
     (let [repo (state/get-current-repo)
           page-name (last (:rum/args state))
           page-id (:db/id (db/entity [:page/name page-name]))]
       [repo :page/headings page-id])))
  [config page-name]
  (let [page-name (string/lower-case page-name)
        page-original-name (:page/original-name (db/entity [:page/name page-name]))
        headings (db/get-page-headings (state/get-current-repo) page-name)]
    [:div.embed-page.py-2.my-2.px-3.bg-base-2
     [:p
      [:code "Embed page:"]
      [:a.ml-2 {:href (str "/page/" (util/encode-str page-name))}
       page-original-name]]
     (headings-container headings (assoc config :embed? true))]))

(defn- get-label-text
  [label]
  (and (= 1 (count label))
       (let [label (first label)]
         (string? (last label))
         (last label))))

(defn- get-page
  [label]
  (when-let [label-text (get-label-text label)]
    (db/entity [:page/name (string/lower-case label-text)])))

(defn inline
  [{:keys [html-export?] :as config} item]
  (match item
    ["Plain" s]
    s
    ["Spaces" s]
    s
    ["Superscript" l]
    (->elem :sup (map-inline config l))
    ["Subscript" l]
    (->elem :sub (map-inline config l))
    ["Tag" s]
    (if (and s (util/tag-valid? s))
      [:a.tag.mr-1 {:href (str "/page/" s)}
       (str "#" s)]
      [:span.warning.mr-1 {:title "Invalid tag, tags only accept alphanumeric characters, \"-\", \"_\", \"@\" and \"%\"."}
       (str "#" s)])
    ["Emphasis" [[kind] data] ]
    (let [elem (case kind
                 "Bold" :b
                 "Italic" :i
                 "Underline" :ins
                 "Strike_through" :del
                 "Highlight" :mark)]
      (->elem elem (map-inline config data)))
    ["Entity" e]
    [:span {:dangerouslySetInnerHTML
            {:__html (:html e)}}]

    ["Latex_Fragment" ["Displayed" s]]
    (if html-export?
      (latex/html-export s false true)
      (latex/latex (str (dc/squuid)) s false true))

    ["Latex_Fragment" ["Inline" s]]
    (if html-export?
      (latex/html-export s false true)
      (latex/latex (str (dc/squuid)) s false false))

    ["Target" s]
    [:a {:id s} s]

    ["Radio_Target" s]
    [:a {:id s} s]

    ["Email" address]
    (let [{:keys [local_part domain]} address
          address (str local_part "@" domain)]
      [:a {:href (str "mainto:" address)}
       address])

    ["Block_reference" id]
    ;; FIXME: alert when self block reference
    (when-not (string/blank? id)
      (when (util/uuid-string? id)
        (when-let [heading (db/pull-heading (uuid id))]
          [:span
           [:span.text-gray-500 "(("]
           [:a {:href (str "/page/" id)
                :on-click (fn [e]
                            (util/stop e)
                            (when (gobj/get e "shiftKey")
                              (state/sidebar-add-block!
                               (state/get-current-repo)
                               (:db/id heading)
                               :heading-ref
                               {:heading heading})))}
            (->elem
             :span.block-ref
             (map-inline config (:heading/title heading)))]
           [:span.text-gray-500 "))"]])))

    ["Link" link]
    (let [{:keys [url label title]} link]
      (match url
        ["Search" s]
        (cond
          (= \# (first s))
          (->elem :a {:href (str "#" (anchor-link (subs s 1)))} (map-inline config label))
          ;; FIXME: same headline, see more https://orgmode.org/manual/Internal-Links.html
          (= \* (first s))
          (->elem :a {:href (str "#" (anchor-link (subs s 1)))} (map-inline config label))
          (re-find #"^https://" s)
          (->elem :a {:href s}
                  (map-inline config label))

          :else
          ;; page reference
          [:span.page-reference
           (when (and (not html-export?)
                      (not (= (:id config) "contents")))
             [:span.text-gray-500 "[["])
           (if (string/ends-with? s ".excalidraw")
             [:a.page-ref
              {:href (str "/draw?file=" (string/replace s (str config/default-draw-directory "/") ""))
               :on-click (fn [e] (util/stop e))}
              [:span
               (svg/excalidraw-logo)
               (string/capitalize (draw/get-file-title s))]]
             (page-cp config {:page/name s}))
           (when (and (not html-export?)
                      (not (= (:id config) "contents")))
             [:span.text-gray-500 "]]"])])

        :else
        (let [href (string-of-url url)
              protocol (or
                        (and (= "Complex" (first url))
                             (:protocol (second url)))
                        (and (= "File" (first url))
                             "file"))
              img-formats (set (map name (config/img-formats)))]
          (cond
            (= protocol "file")
            (if (some (fn [fmt] (re-find (re-pattern (str "\\." fmt)) href)) img-formats)
              (image-link url href label)
              (let [page (get-page label)]
                (if (and page
                         (when-let [ext (util/get-file-ext href)]
                           (config/mldoc-support? ext)))
                  [:span.page-reference
                   [:span.text-gray-500 "[["]
                   (page-cp config page)
                   [:span.text-gray-500 "]]"]]

                  (->elem
                   :a
                   (cond->
                       {:href href}
                     title
                     (assoc :title title))
                   (map-inline config label)))))

            ;; image
            (some (fn [fmt] (re-find (re-pattern (str "\\." fmt)) href)) img-formats)
            (image-link url href label)

            :else
            (->elem
             :a
             (cond->
                 {:href href
                  :target "_blank"}
               title
               (assoc :title title))
             (map-inline config label))))))

    ["Verbatim" s]
    [:code s]

    ["Code" s]
    [:code s]

    ["Inline_Source_Block" x]
    [:code (:code x)]

    ["Export_Snippet" "html" s]
    [:span {:dangerouslySetInnerHTML
            {:__html s}}]

    ;; String to hiccup
    ["Inline_Hiccup" s]
    (reader/read-string s)

    ["Break_Line"]
    [:br]
    ["Hard_Break_Line"]
    [:br]

    ["Timestamp" ["Scheduled" t]]
    (timestamp t "Scheduled")
    ["Timestamp" ["Deadline" t]]
    (timestamp t "Deadline")
    ["Timestamp" ["Date" t]]
    (timestamp t "Date")
    ["Timestamp" ["Closed" t]]
    (timestamp t "Closed")
    ["Timestamp" ["Range" t]]
    (range t false)
    ["Timestamp" ["Clock" ["Stopped" t]]]
    (range t true)
    ["Timestamp" ["Clock" ["Started" t]]]
    (timestamp t "Started")

    ["Cookie" ["Percent" n]]
    [:span {:class "cookie-percent"}
     (util/format "[d%%]" n)]

    ["Cookie" ["Absolute" current total]]
    [:span {:class "cookie-absolute"}
     (util/format "[%d/%d]" current total)]

    ["Footnote_Reference" options]
    (let [{:keys [id name]} options
          encode-name (util/url-encode name)]
      [:sup.fn
       [:a {:id (str "fnr." encode-name)
            :class "footref"
            :href (str "#fn." encode-name)}
        name]])

    ["Macro" options]
    (let [{:keys [name arguments]} options]
      (cond
        (= name "embed")
        (let [a (first arguments)]
          (cond
            (and (string/starts-with? a "[[")
                 (string/ends-with? a "]]"))
            (let [page-name (-> (string/replace a "[[" "")
                                (string/replace "]]" "")
                                string/trim)]
              (when-not (string/blank? page-name)
                (page-embed config page-name)))

            (and (string/starts-with? a "((")
                 (string/ends-with? a "))"))
            (when-let [s (-> (string/replace a "((" "")
                             (string/replace "))" "")
                             string/trim)]
              (when-let [id (and s
                                 (let [s (string/trim s)]
                                   (and (util/uuid-string? s)
                                        (uuid s))))]
                (block-embed config id)))

            :else                       ;TODO: maybe collections?
            nil))

        :else
        (when-let [heading-uuid (:heading/uuid config)]
          (let [macro-content (or
                               (-> (db/entity [:heading/uuid heading-uuid])
                                   (:heading/page)
                                   (:db/id)
                                   (db/entity)
                                   :page/directives
                                   :macros
                                   (get name))
                               (get-in (state/get-config) [:macros name])
                               (get-in (state/get-config) [:macros (keyword name)]))]
            [:span
             (if (and (seq arguments) macro-content)
               (block/macro-subs macro-content arguments)
               macro-content)]))))

    :else
    ""))

(declare block)
(declare blocks)

(rum/defc heading-child
  [block]
  block)

(defonce *control-show? (atom {}))

(rum/defcs heading-control < rum/reactive
  {:will-mount (fn [state]
                 (let [heading (nth (:rum/args state) 1)
                       collapsed? (:heading/collapsed? heading)]
                   (state/set-collapsed-state! (:heading/uuid heading)
                                               collapsed?))
                 state)}
  [state config heading uuid heading-id level start-level body children dummy?]
  (let [has-child? (and
                    (not (:pre-heading? heading))
                    (or (seq children)
                        (seq body)))
        collapsed? (state/sub [:ui/collapsed-headings uuid])
        collapsed? (and has-child? collapsed?)
        control-show (util/react (rum/cursor *control-show? heading-id))
        dark? (= "dark" (state/sub :ui/theme))]
    [:div.hd-control.mr-2.flex.flex-row.items-center
     {:style {:height 24
              ;; :padding-left 9
              :float "left"}}

     [:a.heading-control
      {:id (str "control-" uuid)
       :style {:width 14
               :height 16
               :margin-right 2}
       :on-click (fn [e]
                   (util/stop e)
                   (if collapsed?
                     (expand/expand! heading)
                     (expand/collapse! heading))

                   (state/set-collapsed-state! uuid (not collapsed?)))}
      (cond
        (and control-show collapsed?)
        (svg/caret-right)

        (and control-show has-child?)
        (svg/caret-down)

        :else
        [:span ""])]
     [:a (if (not dummy?)
           {:href (str "/page/" uuid)
            :on-click (fn [e]
                        (util/stop e)
                        (when (gobj/get e "shiftKey")
                          (state/sidebar-add-block!
                           (state/get-current-repo)
                           (:db/id heading)
                           :heading
                           heading)))})
      [:span.bullet-container.cursor
       {:id (str "dot-" uuid)
        :draggable true
        :on-drag-start (fn [event]
                         (editor-handler/highlight-heading! uuid)
                         (.setData (gobj/get event "dataTransfer")
                                   "heading-uuid"
                                   uuid)
                         (.setData (gobj/get event "dataTransfer")
                                   "heading-dom-id"
                                   heading-id)
                         (reset! *dragging? true)
                         (reset! *dragging-heading heading))
        :headingid (str uuid)
        :class (str (when collapsed? "bullet-closed")
                    " "
                    (when (and (:document/mode? config)
                               (not collapsed?))
                      "hide-inner-bullet"))}
       [:span.bullet {:headingid (str uuid)}]]]]))

(defn- build-id
  [config ref? sidebar? embed?]
  (let [k (pr-str config)
        n (or
           (get @container-ids k)
           (let [n' (swap! container-idx inc)]
             (swap! container-ids assoc k n')
             n'))]
    (str n "-"))
  ;; (cond->>
  ;;     ""
  ;;   (and (:id config) (or ref? sidebar? embed?))
  ;;   (str (util/url-encode (:id config)) "-")

  ;;   (:custom-query? config)
  ;;   (str "custom-query-")

  ;;   embed?
  ;;   (str "embed-")

  ;;   sidebar?
  ;;   (str "sidebar-"))
  )

(rum/defc dnd-separator
  [heading margin-left bottom top? nested?]
  (let [id (str (:heading/uuid heading)
                (cond nested?
                      "-nested"
                      top?
                      "-top"
                      :else
                      nil))]
    [:div.dnd-separator
     {:id id
      :style (merge
              {:position "absolute"
               :left margin-left
               :width (- 700 margin-left)}
              (if top?
                {:top 0}
                {:bottom bottom}))}]))

(declare heading-container)
(defn heading-checkbox
  [heading class]
  (let [marker (:heading/marker heading)
        [class checked?] (cond
                           (nil? marker)
                           nil
                           (contains? #{"NOW" "LATER" "DOING" "IN-PROGRESS" "TODO" "WAIT" "WAITING"} marker)
                           [class false]
                           (= "DONE" marker)
                           [(str class " checked") true])]
    (when class
      (ui/checkbox {:class class
                    :style {:margin-top -1
                            :margin-right 6}
                    :checked checked?
                    :on-change (fn [_e]
                                 ;; FIXME: Log timestamp
                                 (if checked?
                                   (editor-handler/uncheck heading)
                                   (editor-handler/check heading)))}))))

(defn list-checkbox
  [checked?]
  (ui/checkbox {:style {:margin-right 6
                        :margin-top -1}
                :checked checked?}))

(defn marker-switch
  [{:heading/keys [pre-heading? marker] :as heading}]
  (when (contains? #{"NOW" "LATER" "TODO" "DOING"} marker)
    (let [set-marker-fn (fn [marker]
                          (fn [e]
                            (util/stop e)
                            (editor-handler/set-marker heading marker)))]
      (case marker
        "NOW"
        [:a.marker-switch
         {:title "Change from NOW to LATER"
          :on-click (set-marker-fn "LATER")}
         [:span "N"]]
        "LATER"
        [:a.marker-switch
         {:title "Change from LATER to NOW"
          :on-click (set-marker-fn "NOW")}
         "L"]

        "TODO"
        [:a.marker-switch
         {:title "Change from TODO to DOING"
          :on-click (set-marker-fn "DOING")}
         "T"]
        "DOING"
        [:a.marker-switch
         {:title "Change from DOING to TODO"
          :on-click (set-marker-fn "TODO")}
         "D"]
        nil))))

(defn marker-cp
  [{:heading/keys [pre-heading? marker] :as heading}]
  (when-not pre-heading?
    (if (contains? #{"IN-PROGRESS" "WAIT" "WAITING"} marker)
      [:span {:class (str "task-status " (string/lower-case marker))
              :style {:margin-right 3.5}}
       (string/upper-case marker)])))

(defn priority-cp
  [{:heading/keys [pre-heading? priority] :as heading}]

  (when (and (not pre-heading?) priority)
    (ui/tooltip
     [:ul
      (for [p (remove #(= priority %) ["A" "B" "C"])]
        [:a.mr-2.text-base.tooltip-priority {:priority p
                                             :on-click (fn [] (editor-handler/set-priority heading p))}])]
     [:a.opacity-50.hover:opacity-100
      {:class "priority"
       :href (str "/page/" priority)
       :style {:margin-right 3.5}}
      (util/format "[#%s]" (str priority))])))

(defn heading-tags-cp
  [{:heading/keys [pre-heading? tags] :as heading}]
  (when (and (not pre-heading?)
             (seq tags))
    (->elem
     :span
     {:class "heading-tags"}
     (mapv (fn [{:keys [db/id tag/name]}]
             (if (util/tag-valid? name)
               [:a.tag.mx-1 {:key (str "tag-" id)
                             :href (str "/page/" name)}
                (str "#" name)]
               [:span.warning.mx-1 {:title "Invalid tag, tags only accept alphanumeric characters, \"-\", \"_\", \"@\" and \"%\"."}
                (str "#" name)]))
           tags))))

(defn build-heading-part
  [{:keys [slide?] :as config} {:heading/keys [uuid title tags marker level priority anchor meta format content pre-heading? dummy? block-refs-count]
                                :as t}]
  (let [config (assoc config :heading t)
        slide? (boolean (:slide? config))
        html-export? (:html-export? config)
        checkbox (when (and (not pre-heading?)
                            (not html-export?))
                   (heading-checkbox t (str "mr-1 cursor")))
        marker-switch (when (and (not pre-heading?)
                                 (not html-export?))
                        (marker-switch t))
        marker-cp (marker-cp t)
        priority (priority-cp t)
        tags (heading-tags-cp t)]
    (when level
      (let [element (if (<= level 6)
                      (keyword (str "h" level))
                      :div)]
        (->elem
         element
         (merge
          {:id anchor}
          (when marker
            {:class (string/lower-case marker)}))
         (remove-nils
          (concat
           [(when-not slide? checkbox)
            (when-not slide? marker-switch)
            marker-cp
            priority]
           (if dummy?
             [[:span.opacity-50 "Click here to start writing"]]
             (map-inline config title))
           [tags])))))))

(defn dnd-same-heading?
  [uuid]
  (= (:heading/uuid @*dragging-heading) uuid))

(defn show-dnd-separator
  [element-id]
  (when-let [element (gdom/getElement element-id)]
    (when (d/has-class? element "dnd-separator")
      (d/remove-class! element "dnd-separator")
      (d/add-class! element "dnd-separator-cur"))))

(defn hide-dnd-separator
  [element-id]
  (when-let [element (gdom/getElement element-id)]
    (when (d/has-class? element "dnd-separator-cur")
      (d/remove-class! element "dnd-separator-cur")
      (d/add-class! element "dnd-separator"))))

(defn- get-data-transfer-attr
  [event attr]
  (.getData (gobj/get event "dataTransfer") attr))

(defn- pre-heading-cp
  [config content format]
  (let [ast (mldoc/->edn content (mldoc/default-config format))]
    [:div.pre-heading
     (blocks config ast)]))

(rum/defc heading-content < rum/reactive
  {:did-mount (fn [state]
                (let [id (str "heading-content-" (:heading/uuid (second (:rum/args state))))
                      elem (gdom/getElement id)]
                  (image-handler/render-local-images! elem))
                state)}
  [config {:heading/keys [uuid title level body meta content dummy? page format repo children pre-heading? collapsed? idx block-refs-count] :as heading} edit-input-id heading-id slide?]
  (let [dragging? (rum/react *dragging?)
        drag-attrs {:headingid (str uuid)
                    :on-click (fn [e]
                                (let [target (gobj/get e "target")]
                                  (when-not (or (util/link? target)
                                                (util/input? target)
                                                (util/details-or-summary? target)
                                                (and (util/sup? target)
                                                     (d/has-class? target "fn")))
                                    (editor-handler/clear-selection! nil)
                                    (editor-handler/unhighlight-heading!)
                                    (let [cursor-range (util/caret-range (gdom/getElement heading-id))]
                                      (state/set-editing!
                                       edit-input-id
                                       (editor-handler/remove-level-spaces content format)
                                       heading
                                       cursor-range))
                                    (util/stop e))))
                    :on-drag-over (fn [event]
                                    (util/stop event)
                                    (when-not (dnd-same-heading? uuid)
                                      (show-dnd-separator (str uuid "-nested"))))
                    :on-drag-leave (fn [event]
                                     (hide-dnd-separator (str uuid))
                                     (hide-dnd-separator (str uuid "-nested"))
                                     (hide-dnd-separator (str uuid "-top")))
                    :on-drop (fn [event]
                               (util/stop event)
                               (when-not (dnd-same-heading? uuid)
                                 (let [from-dom-id (get-data-transfer-attr event "heading-dom-id")]
                                   (dnd/move-heading @*dragging-heading
                                                     heading
                                                     from-dom-id
                                                     false
                                                     true)))
                               (reset! *dragging? false)
                               (reset! *dragging-heading nil)
                               (editor-handler/unhighlight-heading!))}]
    [:div.flex.flex-col.relative.heading-content
     (cond-> {:id (str "heading-content-" uuid)
              :style {:cursor "text"
                      :min-height 24}}
       (not slide?)
       (merge drag-attrs))

     (if pre-heading?
       (pre-heading-cp config (string/trim content) format)
       (build-heading-part config heading))

     (when (and dragging? (not slide?))
       (dnd-separator heading 0 -4 false true))

     (when (and (not pre-heading?) (seq body))
       [:div.heading-body {:style {:display (if collapsed? "none" "")}}
        ;; TODO: consistent id instead of the idx (since it could be changed later)
        (for [[idx child] (medley/indexed (:heading/body heading))]
          (when-let [block (block config child)]
            (rum/with-key (heading-child block)
              (str uuid "-" idx))))])

     (when (and block-refs-count (> block-refs-count 0))
       [:a.block.absolute.origin-top-right.py-0.px-2.rounded.bg-base-2.opacity-50.hover:opacity-100
        {:title "Open block references"
         :style {:top -1
                 :right 0}
         :on-click (fn []
                     (state/sidebar-add-block!
                      (state/get-current-repo)
                      (:db/id heading)
                      :heading-ref
                      {:heading heading}))}
        block-refs-count])]))

(rum/defc heading-content-or-editor < rum/reactive
  [config {:heading/keys [uuid title level body meta content dummy? page format repo children pre-heading? collapsed? idx] :as heading} edit-input-id heading-id slide?]
  (let [edit? (state/sub [:editor/editing? edit-input-id])]
    (if edit?
      [:div.editor-wrapper {:id (str "editor-" edit-input-id)}
       (editor/box {:heading heading
                    :heading-id uuid
                    :heading-parent-id heading-id
                    :format format
                    :dummy? dummy?
                    :on-hide (fn [value event]
                               (when (= event :esc)
                                 (editor-handler/highlight-heading! uuid)))}
                   edit-input-id
                   config)]
      (heading-content config heading edit-input-id heading-id slide?))))

(rum/defc dnd-separator-wrapper < rum/reactive
  [heading slide? top?]
  (let [dragging? (rum/react *dragging?)]
    (cond
      (and dragging? (not slide?))
      (dnd-separator heading 30 0 top? false)

      :else
      nil)))

(rum/defc heading-container < rum/static
  {:did-mount (fn [state]
                (let [heading (nth (:rum/args state) 1)
                      collapsed? (:heading/collapsed? heading)]
                  (when collapsed?
                    (expand/collapse! heading))
                  state))}
  [config {:heading/keys [uuid title level body meta content dummy? page format repo children collapsed? pre-heading? idx] :as heading}]
  (let [ref? (boolean (:ref? config))
        ref-child? (:ref-child? config)
        sidebar? (boolean (:sidebar? config))
        slide? (boolean (:slide? config))
        doc-mode? (:document/mode? config)
        embed? (:embed? config)
        unique-dom-id (build-id (dissoc config :heading/uuid) ref? sidebar? embed?)
        edit-input-id (str "edit-heading-" unique-dom-id uuid)
        heading-id (str "ls-heading-" unique-dom-id uuid)
        has-child? (boolean
                    (and
                     (not pre-heading?)
                     (or (seq children)
                         (seq body))))
        start-level (or (:start-level config) 1)
        drag-attrs {:on-drag-over (fn [event]
                                    (util/stop event)
                                    (when-not (dnd-same-heading? uuid)
                                      (if (zero? idx)
                                        (let [element-top (gobj/get (utils/getOffsetRect (gdom/getElement heading-id)) "top")
                                              cursor-top (gobj/get event "clientY")]
                                          (if (<= (js/Math.abs (- cursor-top element-top)) 16)
                                            ;; top
                                            (do
                                              (hide-dnd-separator (str uuid))
                                              (show-dnd-separator (str uuid "-top"))
                                              (reset! *move-to-top? true))
                                            (do
                                              (hide-dnd-separator (str uuid "-top"))
                                              (show-dnd-separator (str uuid)))))
                                        (show-dnd-separator (str uuid)))))
                    :on-drag-leave (fn [event]
                                     (hide-dnd-separator (str uuid))
                                     (hide-dnd-separator (str uuid "-nested"))
                                     (hide-dnd-separator (str uuid "-top"))
                                     (reset! *move-to-top? false))
                    :on-drop (fn [event]
                               (when-not (dnd-same-heading? uuid)
                                 (let [from-dom-id (get-data-transfer-attr event "heading-dom-id")]
                                   (dnd/move-heading @*dragging-heading
                                                     heading
                                                     from-dom-id
                                                     @*move-to-top?
                                                     false)))
                               (reset! *dragging? false)
                               (reset! *dragging-heading nil)
                               (editor-handler/unhighlight-heading!))
                    :on-mouse-over (fn [e]
                                     (util/stop e)
                                     (when has-child?
                                       (swap! *control-show? assoc heading-id true))
                                     (when-let [parent (gdom/getElement heading-id)]
                                       (let [node (.querySelector parent ".bullet-container")
                                             closed? (d/has-class? node "bullet-closed")]
                                         (if closed?
                                           (state/collapse-heading! uuid)
                                           (state/expand-heading! uuid))
                                         (when doc-mode?
                                           (d/remove-class! node "hide-inner-bullet")))))
                    :on-mouse-out (fn [e]
                                    (util/stop e)
                                    (when has-child?
                                      (swap! *control-show?
                                             assoc heading-id false))
                                    (when doc-mode?
                                      (when-let [parent (gdom/getElement heading-id)]
                                        (when-let [node (.querySelector parent ".bullet-container")]
                                          (d/add-class! node "hide-inner-bullet")))))}]
    [:div.ls-heading.flex.flex-col.pt-1
     (cond->
         {:id heading-id
          :style {:position "relative"}
          :class (str uuid
                      (when dummy? " dummy")
                      (when (and collapsed? has-child?) " collapsed")
                      (when pre-heading? " pre-heading"))
          :headingid (str uuid)
          :repo repo
          :level level
          :haschild (str has-child?)}
       (not slide?)
       (merge drag-attrs))

     (if (and ref? (not ref-child?))
       (when-let [heading-parents (heading/heading-parents repo uuid format false)]
         [:div.my-2.opacity-50.ml-7 heading-parents]))

     (dnd-separator-wrapper heading slide? (zero? idx))

     [:div.flex-1.flex-row
      (when (not slide?)
        (heading-control config heading uuid heading-id level start-level body children dummy?))

      (heading-content-or-editor config heading edit-input-id heading-id slide?)]

     (when (seq children)
       [:div.heading-children {:style {:margin-left (if doc-mode? 12 22)
                                       :display (if collapsed? "none" "")}}
        (for [child children]
          (when (map? child)
            (let [child (dissoc child :heading/meta)]
              (rum/with-key (heading-container config child)
                (:heading/uuid child)))))])

     (when (and ref? (not ref-child?))
       (let [children (db/get-heading-children repo uuid)]
         (when (seq children)
           [:div.ref-children.ml-12
            (headings-container children (assoc config
                                                :ref-child? true
                                                :ref? true))])))

     (dnd-separator-wrapper heading slide? false)]))

(defn divide-lists
  [[f & l]]
  (loop [l l
         ordered? (:ordered f)
         result [[f]]]
    (if (seq l)
      (let [cur (first l)
            cur-ordered? (:ordered cur)]
        (if (= ordered? cur-ordered?)
          (recur
           (rest l)
           cur-ordered?
           (update result (dec (count result)) conj cur))
          (recur
           (rest l)
           cur-ordered?
           (conj result [cur]))))
      result)))

(defn list-element
  [l]
  (match l
    [l1 & tl]
    (let [{:keys [ordered name]} l1]
      (cond
        (seq name)
        :dl
        ordered
        :ol
        :else
        :ul))

    :else
    :ul))

(defn list-item
  [config {:keys [name content checkbox items number] :as l}]
  (let [content (when-not (empty? content)
                  (match content
                    [["Paragraph" i] & rest]
                    (vec-cat
                     (map-inline config i)
                     (blocks config rest))
                    :else
                    (blocks config content)))
        checked? (some? checkbox)
        items (if (seq items)
                (->elem
                 (list-element items)
                 (for [item items]
                   (list-item config item))))]
    (cond
      (seq name)
      [:dl {:checked checked?}
       [:dt (map-inline config name)]
       (->elem :dd
               (vec-cat content [items]))]

      :else
      (if (nil? checkbox)
        (->elem
         :li
         {:checked checked?}
         (vec-cat
          [(->elem
            :p
            content)]
          [items]))
        (->elem
         :li
         {:checked checked?}
         (vec-cat
          [(->elem
            :p
            (list-checkbox checkbox)
            content)]
          [items]))))))

(defn table
  [config {:keys [header groups col_groups]}]
  (let [tr (fn [elm cols]
             (->elem
              :tr
              (mapv (fn [col]
                      (->elem
                       elm
                       {:scope "col"
                        :class "org-left"}
                       (map-inline config col)))
                    cols)))
        tb-col-groups (try
                        (mapv (fn [number]
                                (let [col-elem [:col {:class "org-left"}]]
                                  (->elem
                                   :colgroup
                                   (repeat number col-elem))))
                              col_groups)
                        (catch js/Error e
                          []))
        head (if header
               [:thead (tr :th header)])
        groups (mapv (fn [group]
                       (->elem
                        :tbody
                        (mapv #(tr :td %) group)))
                     groups)]
    [:div.table-wrapper {:style {:max-width (min 700
                                                 (gobj/get js/window "innerWidth"))}}
     (->elem
      :table
      {:class "table-auto"
       :border 2
       :cell-spacing 0
       :cell-padding 6
       :rules "groups"
       :frame "hsides"}
      (vec-cat
       tb-col-groups
       (cons head groups)))]))

(defn map-inline
  [config col]
  (map #(inline config %) col))

(declare ->hiccup)

(defn built-in-custom-query?
  [title]
  (contains? #{"🔨 NOW" "📅 NEXT"}
             title))

(rum/defcs custom-query < rum/reactive
  {:will-mount (fn [state]
                 (let [[config query] (:rum/args state)]
                   (let [query-atom (db/custom-query query)]
                     (assoc state :query-atom query-atom))))
   :did-mount (fn [state]
                (when-let [query (last (:rum/args state))]
                  (state/add-custom-query-component! query (:rum/react-component state)))
                state)
   :will-unmount (fn [state]
                   (when-let [query (last (:rum/args state))]
                     (state/remove-custom-query-component! query)
                     (db/remove-custom-query! (state/get-current-repo) query))
                   state)}
  [state config {:keys [title query inputs view collapsed?] :as q}]
  (let [query-atom (:query-atom state)]
    (let [current-heading-uuid (:heading/uuid (:heading config))
          ;; exclude the current one, otherwise it'll loop forever
          remove-headings (if current-heading-uuid [current-heading-uuid] nil)
          query-result (and query-atom (rum/react query-atom))
          result (if query-result
                   (db/custom-query-result-transform query-result remove-headings q))
          view-f (sci/eval-string (pr-str view))
          only-headings? (:heading/uuid (first result))
          headings-grouped-by-page? (and (seq result)
                                         (:page/name (ffirst result))
                                         (:heading/uuid (first (second (first result))))
                                         true)
          built-in? (built-in-custom-query? title)]
      [:div.custom-query.mt-8
       (when-not (and built-in? (empty? result))
         (ui/foldable
          [:div.opacity-70
           title]
          (cond
            (and (seq result) view-f)
            (let [result (sci/call-fn view-f result)]
              (util/hiccup-keywordize result))

            (and (seq result)
                 (or only-headings? headings-grouped-by-page?))
            (->hiccup result (assoc config
                                    :custom-query? true
                                    :group-by-page? headings-grouped-by-page?)
                      {:style {:margin-top "0.25rem"
                               :margin-left "0.25rem"}})

            (seq result)                     ;TODO: table
            [:pre
             (for [record result]
               (if (map? record)
                 (str (util/pp-str record) "\n")
                 record))]

            :else
            [:div.text-sm.mt-2.ml-2.font-medium.opacity-50 "Empty"])
          collapsed?))])))

(defn admonition
  [config type options result]
  (when-let [icon (case (string/lower-case (name type))
                    "note" svg/note
                    "tip" svg/tip
                    "important" svg/important
                    "caution" svg/caution
                    "warning" svg/warning
                    nil)]
    [:div.flex.flex-row.admonitionblock.align-items {:class type}
     [:div.pr-4.admonition-icon.flex.flex-col.justify-center
      {:title (string/upper-case type)} (icon)]
     [:div.ml-4.text-lg
      (blocks config result)]]))

(defn block
  [{:keys [html-export?] :as config} item]
  (try
    (match item
      ["Directives" m]
      [:div.directives
       (for [[k v] m]
         (when-not (and (= k :macros) (empty? v))
           [:div.directive
            [:span.font-medium.mr-1 (string/upper-case (str (name k) ": "))]
            (if (coll? v)
              (for [item v]
                (if (= k :tags)
                  [:a.tag.mr-1 {:href (str "/page/" item)}
                   item]
                  [:span item]))
              [:span v])]))]

      ["Paragraph" l]
      ;; TODO: speedup
      (if (re-find #"\"Export_Snippet\" \"embed\"" (str l))
        (->elem :div (map-inline config l))
        (->elem :p (map-inline config l)))
      ["Horizontal_Rule"]
      (when-not (:slide? config)
        [:hr])
      ["Heading" h]
      (heading-container config h)
      ["List" l]
      (let [lists (divide-lists l)]
        (if (= 1 (count lists))
          (let [l (first lists)]
            (->elem
             (list-element l)
             (map #(list-item config %) l)))
          [:div.list-group
           (for [l lists]
             (->elem
              (list-element l)
              (map #(list-item config %) l)))]))
      ["Table" t]
      (table config t)
      ["Math" s]
      (if html-export?
        (latex/html-export s true true)
        (latex/latex (str (dc/squuid)) s true true))
      ["Example" l]
      [:pre
       (join-lines l)]
      ["Src" options]
      (let [{:keys [language options lines]} options
            attr (if language
                   {:data-lang language})
            code (join-lines lines)]
        (cond
          html-export?
          (code/html-export attr code)

          (and (= language "clojure") (contains? (set options) ":results"))
          [:div
           (code/highlight (str (dc/squuid)) attr code)
           (sci/eval-result code)]

          :else
          (code/highlight (str (dc/squuid)) attr code)))
      ["Quote" l]
      (->elem
       :blockquote
       (blocks config l))
      ["Raw_Html" content]
      [:div.raw_html {:dangerouslySetInnerHTML
                      {:__html content}}]
      ["Export" "html" options content]
      [:div.export_html {:dangerouslySetInnerHTML
                         {:__html content}}]
      ;; TODO: hiccup element check
      ["Hiccup" content]
      (reader/read-string content)

      ["Export" "latex" options content]
      (if html-export?
        (latex/html-export content true false)
        (latex/latex (str (dc/squuid)) content true false))

      ["Custom" "query" _options result content]
      (let [query (reader/read-string content)]
        (custom-query config query))

      ["Custom" "note" options result content]
      (admonition config "note" options result)

      ["Custom" "tip" options result content]
      (admonition config "tip" options result)

      ["Custom" "important" options result content]
      (admonition config "important" options result)

      ["Custom" "caution" options result content]
      (admonition config "caution" options result)

      ["Custom" "warning" options result content]
      (admonition config "warning" options result)

      ["Custom" name options l content]
      (->elem
       :div
       {:class name}
       (blocks config l))

      ["Latex_Fragment" l]
      [:p.latex-fragment
       (inline config ["Latex_Fragment" l])]

      ["Latex_Environment" name option content]
      (let [content (latex-environment-content name option content)]
        (if html-export?
          (latex/html-export content true true)
          (latex/latex (str (dc/squuid)) content true true)))
      ["Footnote_Definition" name definition]
      (let [id (util/url-encode name)]
        [:div.footdef
         [:div.footpara
          (conj
           (block config ["Paragraph" definition])
           [:a.ml-1 {:id (str "fn." id)
                     :style {:font-size 14}
                     :class "footnum"
                     :href (str "#fnr." id)}
            [:sup.fn (str name "↩︎")]])]])

      :else
      "")
    (catch js/Error e
      (prn "Convert to html failed, error: " e)
      "")))

(defn blocks
  [config col]
  (map #(block config %) col))

(defn build-headings
  [headings config]
  (let [headings (db/headings->vec-tree headings)]
    (when (seq headings)
      (let [first-id (:heading/uuid (first headings))]
        (for [item headings]
          (let [item (-> (if (:heading/dummy? item)
                           item
                           (dissoc item :heading/meta)))
                item (if (= first-id (:heading/uuid item))
                       (assoc item :heading/idx 0)
                       item)
                config (assoc config :heading/uuid (:heading/uuid item))]
            (rum/with-key
              (heading-container config item)
              (:heading/uuid item))))))))

(defn build-slide-sections
  ([headings config]
   (build-slide-sections headings config nil))
  ([headings config build-heading-fn]
   (when (seq headings)
     (let [headings (map #(dissoc % :heading/children) headings)
           first-heading-level (:heading/level (first headings))
           sections (reduce
                     (fn [acc heading]
                       (let [heading (dissoc heading :heading/meta)
                             level (:heading/level heading)
                             heading-cp (if build-heading-fn
                                          (build-heading-fn config heading)
                                          (rum/with-key
                                            (heading-container config heading)
                                            (str "slide-" (:heading/uuid heading))))]
                         (if (= first-heading-level level)
                           ;; new slide
                           (conj acc [[heading heading-cp]])
                           (update acc (dec (count acc))
                                   (fn [sections]
                                     (conj sections [heading heading-cp]))))))
                     []
                     headings)]
       sections))))

(rum/defc headings-container < rum/static
  [headings config]
  (let [headings (map #(dissoc % :heading/children) headings)
        sidebar? (:sidebar? config)
        ref? (:ref? config)]
    [:div.headings-container.flex-1
     {:style {:margin-left (cond
                             sidebar?
                             0
                             ref?
                             -18
                             :else
                             -24)}}
     (build-headings headings config)]))

;; headers to hiccup
(rum/defc ->hiccup < rum/reactive
  (mixins/event-mixin
   (fn [state]
     (mixins/on-key-down
      state
      {
       ;; up
       38 (fn [state e]
            (editor-handler/on-select-heading state e true))

       ;; down
       40 (fn [state e]
            (editor-handler/on-select-heading state e false))
       }
      (fn [e key-code]
        nil))))
  [headings config option]
  (let [document-mode? (state/sub [:document/mode?])
        config (assoc config
                      :document/mode? document-mode?)]
    [:div.content
     (cond-> option
       document-mode?
       (assoc :class "doc-mode"))
     (if (:group-by-page? config)
       [:div.flex.flex-col
        (for [[page headings] headings]
          (let [page (db/entity (:db/id page))]
            [:div.my-2 (cond-> {:key (str "page-" (:db/id page))}
                         (:ref? config)
                         (assoc :class "bg-base-2 px-7 py-2 rounded"))
             (ui/foldable
              (page-cp config page)
              (headings-container headings config))]))]
       (headings-container headings config))]))

(comment
  ;; timestamps
  ;; [2020-02-10 Mon 13:22]
  ;; repetition
  (def r1 "<2005-10-01 Sat +1m>")
  ;; TODO: mldoc add supports
  (def r2 "<2005-10-01 Sat +1m -3d>")

  (def l
    "1. First item
hello world
2. Second item
nice
3. Third item")

  (def t
    "| Name  | Phone | Age |
|-------+-------+-----|
| Peter |  1234 |  17 |
| Anna  |  4321 |  25 |")
  )
