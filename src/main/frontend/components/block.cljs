(ns frontend.components.block
  (:refer-clojure :exclude [range])
  (:require [frontend.config :as config]
            [cljs.core.match :refer-macros [match]]
            [promesa.core :as p]
            [frontend.fs :as fs]
            [clojure.string :as string]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.state :as state]
            [frontend.db :as db]
            [frontend.db.model :as model]
            [frontend.db.query-dsl :as query-dsl]
            [dommy.core :as d]
            [datascript.core :as dc]
            [goog.dom :as gdom]
            [frontend.handler.expand :as expand]
            [frontend.components.svg :as svg]
            [frontend.components.draw :as draw]
            [frontend.components.datetime :as datetime-comp]
            [frontend.ui :as ui]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.block :as block-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.dnd :as dnd]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.repeated :as repeated]
            [goog.object :as gobj]
            [medley.core :as medley]
            [cljs.reader :as reader]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.db-mixins :as db-mixins]
            [frontend.extensions.latex :as latex]
            [frontend.components.lazy-editor :as lazy-editor]
            [frontend.extensions.highlight :as highlight]
            [frontend.extensions.sci :as sci]
            ["/frontend/utils" :as utils]
            [frontend.format.block :as block]
            [clojure.walk :as walk]
            [cljs-bean.core :as bean]
            [frontend.handler.image :as image-handler]
            [frontend.format.mldoc :as mldoc]
            [frontend.text :as text]
            [frontend.utf8 :as utf8]
            [frontend.date :as date]
            [frontend.security :as security]
            [reitit.frontend.easy :as rfe]
            [frontend.commands :as commands]
            [lambdaisland.glogi :as log]
            [frontend.context.i18n :as i18n]
            [frontend.template :as template]))

;; TODO: remove rum/with-context because it'll make reactive queries not working

(defn safe-read-string
  ([s]
   (safe-read-string s true))
  ([s warn?]
   (try
     (reader/read-string s)
     (catch js/Error e
       (println "read-string error:")
       (js/console.error e)
       (when warn?
         [:div.warning {:title "read-string failed"}
          s])))))

;; local state
(defonce *block-children
  (atom {}))

(defonce *dragging?
  (atom false))
(defonce *dragging-block
  (atom nil))
(defonce *move-to-top?
  (atom false))

;; TODO: Improve blocks grouped by pages
(defonce max-blocks-per-page 500)
(defonce virtual-list-scroll-step 450)
(defonce virtual-list-previous 50)

(defonce container-ids (atom {}))
(defonce container-idx (atom 0))

;; TODO:
;; add `key`

(defn- remove-nils
  [col]
  (remove nil? col))

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
  (string/trim (apply str l)))

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
  [config path]
  (let [path (string/replace path "file:" "")
        block-id (:block/uuid config)
        current-file (and block-id
                          (:file/path (:page/file (:block/page (db/entity [:block/uuid block-id])))))]
    (when current-file
      (let [parts (string/split current-file #"/")
            parts-2 (string/split path #"/")
            current-dir (string/join "/" (drop-last 1 parts))]
        (cond
          (util/starts-with? path "/")
          path

          (and (not (util/starts-with? path ".."))
               (not (util/starts-with? path ".")))
          (str current-dir "/" path)

          :else
          (let [parts (loop [acc []
                             parts (reverse parts)
                             col (reverse parts-2)]
                        (if (empty? col)
                          acc
                          (let [[part parts] (case (first col)
                                               ".."
                                               [(first parts) (rest parts)]
                                               "."
                                               ["" parts]
                                               [(first col) (rest parts)])]
                            (recur (conj acc part)
                                   parts
                                   (rest col)))))
                parts (remove #(string/blank? %) parts)]
            (string/join "/" (reverse parts))))))))

(defonce *resizing-image? (atom false))
(rum/defcs resizable-image <
  (rum/local nil ::size)
  {:will-unmount (fn [state]
                   (reset! *resizing-image? false)
                   state)}
  [state config title src metadata full_text local?]
  (rum/with-context [[t] i18n/*tongue-context*]
    (let [size (get state ::size)]
      (ui/resize-provider
       (ui/resize-consumer
        (cond->
         {:className "resize"
          :onSizeChanged (fn [value]
                           (when (and (not @*resizing-image?)
                                      (some? @size)
                                      (not= value @size))
                             (reset! *resizing-image? true))
                           (reset! size value))
          :onMouseUp (fn []
                       (when (and @size @*resizing-image?)
                         (when-let [block-id (:block/uuid config)]
                           (let [size (bean/->clj @size)]
                             (editor-handler/resize-image! block-id metadata full_text size))))
                       (when @*resizing-image?
                         ;; TODO: need a better way to prevent the clicking to edit current block
                         (js/setTimeout #(reset! *resizing-image? false) 200)))
          :onClick (fn [e]
                     (when @*resizing-image? (util/stop e)))}
          (and (:width metadata) (not (util/mobile?)))
          (assoc :style {:width (:width metadata)}))
        [:div.asset-container
         [:img.rounded-sm.shadow-xl.relative
          (merge
           {:loading "lazy"
            :src     src
            :title   title}
           metadata)]
         [:span.ctl
          [:a.delete
           {:title "Delete this image"
            :on-click
            (fn [e]
              (when-let [block-id (:block/uuid config)]
                (let [confirm-fn (ui/make-confirm-modal
                                  {:title         (t :asset/confirm-delete (.toLocaleLowerCase (t :text/image)))
                                   :sub-title     (if local? :asset/physical-delete "")
                                   :sub-checkbox? local?
                                   :on-confirm    (fn [e {:keys [close-fn sub-selected]}]
                                                    (close-fn)
                                                    (editor-handler/delete-asset-of-block!
                                                     {:block-id    block-id
                                                      :local?      local?
                                                      :repo        (state/get-current-repo)
                                                      :href        src
                                                      :title       title
                                                      :full-text   full_text}))})]
                  (state/set-modal! confirm-fn)
                  (util/stop e))))}
           svg/trash-sm]]])))))

(rum/defcs asset-link < rum/reactive
  (rum/local nil ::src)
  [state config title href label metadata full_text]
  (let [src (::src state)
        granted? (state/sub [:nfs/user-granted? (state/get-current-repo)])
        href (config/get-local-asset-absolute-path href)]
    (when (or granted? (util/electron?))
      (p/then (editor-handler/make-asset-url href) #(reset! src %)))

    (when @src
      (resizable-image config title @src metadata full_text true))))

;; TODO: safe encoding asciis
;; TODO: image link to another link
(defn image-link [config url href label metadata full_text]
  (let [metadata (if (string/blank? metadata)
                   nil
                   (safe-read-string metadata false))
        title (second (first label))]
    (if (and (config/local-asset? href)
             (config/local-db? (state/get-current-repo)))
      (asset-link config title href label metadata full_text)
      (let [href (if (util/starts-with? href "http")
                   href
                   (get-file-absolute-path config href))]
        (resizable-image config title href metadata full_text false)))))

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
(declare markup-element-cp)
(declare markup-elements-cp)

(declare page-reference)

(defn page-cp
  [{:keys [html-export? label children contents-page?] :as config} page]
  (when-let [page-name (:page/name page)]
    (let [source-page (model/get-alias-source-page (state/get-current-repo)
                                                   (string/lower-case page-name))
          original-page-name (get page :page/original-name page-name)
          original-page-name (if (date/valid-journal-title? original-page-name)
                               (string/capitalize original-page-name)
                               original-page-name)
          page (string/lower-case page-name)
          redirect-page-name (cond
                               (:page/alias? config)
                               page

                               (db/page-empty? (state/get-current-repo) page-name)
                               (or (when source-page (:page/name source-page))
                                   page)

                               :else
                               page)
          href (if html-export?
                 (util/encode-str page)
                 (rfe/href :page {:name redirect-page-name}))]
      [:a.page-ref
       {:data-ref page-name
        :href href
        :on-click (fn [e]
                    (util/stop e)
                    (if (gobj/get e "shiftKey")
                      (when-let [page-entity (db/entity [:page/name redirect-page-name])]
                        (state/sidebar-add-block!
                         (state/get-current-repo)
                         (:db/id page-entity)
                         :page
                         {:page page-entity}))
                      (route-handler/redirect! {:to :page
                                                :path-params {:name redirect-page-name}}))
                    (when (and contents-page?
                               (state/get-left-sidebar-open?))
                      (ui-handler/close-left-sidebar!)))}

       (if (seq children)
         (for [child children]
           (if (= (first child) "Label")
             [:span (last child)]
             (let [{:keys [content children]} (last child)
                   page-name (subs content 2 (- (count content) 2))]
               (page-reference html-export? page-name (assoc config :children children) nil))))
         (if (and label
                  (string? label)
                  (not (string/blank? label))) ; alias
           label
           original-page-name))])))

(rum/defc asset-reference
  [title path]
  (let [repo-path (config/get-repo-dir (state/get-current-repo))
        full-path (.. util/node-path (join repo-path (config/get-local-asset-absolute-path path)))]
    [:a.asset-ref {:target "_blank" :href full-path} (or title path)]))

(rum/defc page-reference < rum/reactive
  [html-export? s config label]
  (let [show-brackets? (state/show-brackets?)
        nested-link? (:nested-link? config)
        contents-page? (= "contents" (string/lower-case (str (:id config))))]
    [:span.page-reference
     (when (and (or show-brackets? nested-link?)
                (not html-export?)
                (not contents-page?))
       [:span.text-gray-500.bracket "[["])
     (if (string/ends-with? s ".excalidraw")
       [:a.page-ref
        {:on-click (fn [e]
                     (util/stop e)
                     (set! (.-href js/window.location)
                           (rfe/href :draw nil {:file (string/replace s (str config/default-draw-directory "/") "")})))}
        [:span
         (svg/excalidraw-logo)
         (string/capitalize (draw/get-file-title s))]]
       (page-cp (assoc config
                       :label (mldoc/plain->text label)
                       :contents-page? contents-page?) {:page/name s}))
     (when (and (or show-brackets? nested-link?)
                (not html-export?)
                (not contents-page?))
       [:span.text-gray-500.bracket "]]"])]))

(defn- latex-environment-content
  [name option content]
  (if (= (string/lower-case name) "equation")
    content
    (util/format "\\begin%s\n%s\\end{%s}"
                 (str "{" name "}" option)
                 content
                 name)))

(declare blocks-container)

(rum/defc block-embed < rum/reactive db-mixins/query
  [config id]
  (let [blocks (db/get-block-and-children (state/get-current-repo) id)]
    [:div.color-level.embed-block.bg-base-2 {:style {:z-index 2}}
     [:div.px-3.pt-1.pb-2
      (blocks-container blocks (assoc config
                                      :embed? true
                                      :ref? false))]]))

(rum/defc page-embed < rum/reactive db-mixins/query
  [config page-name]
  (let [page-name (string/lower-case page-name)
        current-page (state/get-current-page)]
    [:div.color-level.embed.embed-page.bg-base-2
     {:class (if (:sidebar? config) "in-sidebar")}
     [:section.flex.items-center.p-1.embed-header
      [:div.mr-3 svg/page]
      (page-cp config {:page/name page-name})]
     (when (and
            (not= (string/lower-case (or current-page ""))
                  page-name)
            (not= (string/lower-case (get config :id ""))
                  page-name))
       (let [blocks (db/get-page-blocks (state/get-current-repo) page-name)]
         (blocks-container blocks (assoc config
                                         :embed? true
                                         :ref? false))))]))

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

(defn- macro->text
  [name arguments]
  (if (and (seq arguments)
           (not= arguments ["null"]))
    (util/format "{{{%s %s}}}" name (string/join ", " arguments))
    (util/format "{{{%s}}}" name)))

(declare block-content)
(rum/defc block-reference < rum/reactive
  [config id]
  (when-not (string/blank? id)
    (let [block (and (util/uuid-string? id)
                     (db/pull-block (uuid id)))]
      (if block
        [:span
         [:div.block-ref-wrap
          {:on-click (fn [e]
                       (util/stop e)
                       (if (gobj/get e "shiftKey")
                         (state/sidebar-add-block!
                          (state/get-current-repo)
                          (:db/id block)
                          :block-ref
                          {:block block})
                         (route-handler/redirect! {:to          :page
                                                   :path-params {:name id}})))}

          (let [title (:block/title block)]
            (if (empty? title)
              ;; display the content
              [:div.block-ref
               (block-content config block nil (:block/uuid block) (:slide? config))]
              (->elem
               :span.block-ref
               (map-inline config title))))]]
        [:span.warning.mr-1 {:title "Block ref invalid"}
         (util/format "((%s))" id)]))))

(defn inline-text
  [format v]
  (when (string? v)
    (let [inline-list (mldoc/inline->edn v (mldoc/default-config format))]
      [:div.inline.mr-1 (map-inline {} inline-list)])))

(defn selection-range-in-block? []
  (and (= "Range" (. (js/window.getSelection) -type))
       (-> (js/window.getSelection)
           (.-anchorNode)
           (.-parentNode)
           (.closest ".block-content"))))

(defn- render-macro
  [config name arguments macro-content format]
  (if macro-content
    (let [ast (->> (mldoc/->edn macro-content (mldoc/default-config format))
                   (map first))
          block? (contains? #{"Paragraph"
                              "Raw_Html"
                              "Hiccup"}
                            (ffirst ast))]
      (if block?
        [:div
         (markup-elements-cp (assoc config :block/format format) ast)]
        (inline-text format macro-content)))
    [:span.warning {:title (str "Unsupported macro name: " name)}
     (macro->text name arguments)]))

(rum/defc nested-link < rum/reactive
  [config html-export? link]
  (let [show-brackets? (state/show-brackets?)
        {:keys [content children]} link]
    [:span.page-reference.nested
     (when (and show-brackets?
                (not html-export?)
                (not (= (:id config) "contents")))
       [:span.text-gray-500 "[["])
     (let [page-name (subs content 2 (- (count content) 2))]
       (page-cp (assoc config
                       :children children
                       :nested-link? true) {:page/name page-name}))
     (when (and show-brackets?
                (not html-export?)
                (not (= (:id config) "contents")))
       [:span.text-gray-500 "]]"])]))

(declare custom-query)

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
      [:a.tag {:data-ref s
               :href (rfe/href :page {:name s})
               :on-click (fn [e]
                           (let [repo (state/get-current-repo)
                                 page (db/pull repo '[*] [:page/name (string/lower-case (util/url-decode s))])]
                             (when (gobj/get e "shiftKey")
                               (state/sidebar-add-block!
                                repo
                                (:db/id page)
                                :page
                                {:page page})
                               (.preventDefault e))))}
       (str "#" s)]
      [:span.warning.mr-1 {:title "Invalid tag, tags only accept alphanumeric characters, \"-\", \"_\", \"@\" and \"%\"."}
       (str "#" s)])
    ["Emphasis" [[kind] data]]
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
    (block-reference config id)

    ["Nested_link" link]
    (nested-link config html-export? link)

    ["Link" link]
    (let [{:keys [url label title metadata full_text]} link
          img-formats (set (map name (config/img-formats)))]
      (match url
        ["Search" s]
        (cond
          (string/blank? s)
          [:span.warning {:title "Invalid link"} full_text]

          ;; image
          (some (fn [fmt] (re-find (re-pattern (str "(?i)\\." fmt)) s)) img-formats)
          (image-link config url s label metadata full_text)

          (= \# (first s))
          (->elem :a {:on-click #(route-handler/jump-to-anchor! (mldoc/anchorLink (subs s 1)))} (subs s 1))

          ;; FIXME: same headline, see more https://orgmode.org/manual/Internal-Links.html
          (and (= \* (first s))
               (not= \* (last s)))
          (->elem :a {:on-click #(route-handler/jump-to-anchor! (mldoc/anchorLink (subs s 1)))} (subs s 1))

          (re-find #"(?i)^http[s]?://" s)
          (->elem :a {:href s
                      :data-href s
                      :target "_blank"}
                  (map-inline config label))

          (and (util/electron?) (config/local-asset? s))
          (asset-reference (second (first label)) s)

          :else
          (page-reference html-export? s config label))

        :else
        (let [href (string-of-url url)
              protocol (or
                        (and (= "Complex" (first url))
                             (:protocol (second url)))
                        (and (= "File" (first url))
                             "file"))]
          (cond
            (and (= "Complex" (first url))
                 (= protocol "id")
                 (string? (:link (second url)))
                 (util/uuid-string? (:link (second url)))) ; org mode id
            (block-reference config (:link (second url)))

            (= protocol "file")
            (if (some (fn [fmt] (re-find (re-pattern (str "(?i)\\." fmt)) href)) img-formats)
              (image-link config url href label metadata full_text)
              (let [label-text (get-label-text label)
                    page (if (string/blank? label-text)
                           {:page/name (db/get-file-page (string/replace href "file:" ""))}
                           (get-page label))]
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
                    {:href      (str "file://" href)
                     :data-href href
                     :target    "_blank"}
                     title
                     (assoc :title title))
                   (map-inline config label)))))

            ;; image
            (some (fn [fmt] (re-find (re-pattern (str "(?i)\\." fmt)) href)) img-formats)
            (image-link config url href label metadata full_text)

            :else
            (->elem
             :a.external-link
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
    (when (not html-export?)
      [:span {:dangerouslySetInnerHTML
              {:__html s}}])

    ;; String to hiccup
    ["Inline_Hiccup" s]
    (ui/catch-error
     [:div.warning {:title "Invalid hiccup"} s]
     (-> (safe-read-string s)
         (security/remove-javascript-links-in-href)))

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
            :on-click #(route-handler/jump-to-anchor! (str "fn." encode-name))}
        name]])

    ["Macro" options]
    (let [{:keys [name arguments]} options
          arguments (if (and
                         (>= (count arguments) 2)
                         (and (string/starts-with? (first arguments) "[[")
                              (string/ends-with? (last arguments) "]]"))) ; page reference
                      (let [title (string/join ", " arguments)]
                        [title])
                      arguments)]
      (cond
        (= name "query")
        [:div.dsl-query
         (let [query (string/join ", " arguments)]
           (custom-query (assoc config :dsl-query? true)
                         {:title [:code.p-1 (str "Query: " query)]
                          :query query}))]

        (= name "youtube")
        (let [url (first arguments)]
          (let [YouTube-regex #"^((?:https?:)?//)?((?:www|m).)?((?:youtube.com|youtu.be))(/(?:[\w-]+\?v=|embed/|v/)?)([\w-]+)(\S+)?$"]
            (when-let [youtube-id (cond
                                    (== 11 (count url)) url
                                    :else
                                    (nth (re-find YouTube-regex url) 5))]
              (when-not (string/blank? youtube-id)
                (let [width (min (- (util/get-width) 96)
                                 560)
                      height (int (* width (/ 315 560)))]
                  [:iframe
                   {:allow-full-screen "allowfullscreen"
                    :allow
                    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    :frame-border "0"
                    :src (str "https://www.youtube.com/embed/" youtube-id)
                    :height height
                    :width width}])))))

        ;; TODO: support fullscreen mode, maybe we need a fullscreen dialog?
        (= name "bilibili")
        (let [url (first arguments)
              id-regex #"https?://www\.bilibili\.com/video/([\w\W]+)"]
          (when-let [id (cond
                          (<= (count url) 15) url
                          :else
                          (last (re-find id-regex url)))]
            (when-not (string/blank? id)
              (let [width (min (- (util/get-width) 96)
                               560)
                    height (int (* width (/ 315 560)))]
                [:iframe
                 {:allowfullscreen true
                  :framespacing "0"
                  :frameborder "no"
                  :border "0"
                  :scrolling "no"
                  :src (str "https://player.bilibili.com/player.html?bvid=" id "&high_quality=1")
                  :width width
                  :height (max 500 height)}]))))

        (= name "embed")
        (let [a (first arguments)]
          (cond
            (nil? a) ; empty embed
            nil

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
        (if-let [block-uuid (:block/uuid config)]
          (let [format (get-in config [:block :block/format] :markdown)
                macro-content (or
                               (-> (db/entity [:block/uuid block-uuid])
                                   (:block/page)
                                   (:db/id)
                                   (db/entity)
                                   :page/properties
                                   :macros
                                   (get name))
                               (get (state/get-macros) name)
                               (get (state/get-macros) (keyword name)))
                macro-content (if (and (seq arguments) macro-content)
                                (block/macro-subs macro-content arguments)
                                macro-content)
                macro-content (when macro-content
                                (template/resolve-dynamic-template! macro-content))]
            (render-macro config name arguments macro-content format))

          (when-let [macro-txt (macro->text name arguments)]
            (let [macro-txt (when macro-txt
                              (template/resolve-dynamic-template! macro-txt))
                  format (get-in config [:block :block/format] :markdown)]
              (render-macro config name arguments macro-txt format))))))

    :else
    ""))

(declare blocks-cp)

(rum/defc block-child
  [block]
  block)

(defonce *control-show? (atom {}))

(rum/defcs block-control < rum/reactive
  {:will-mount (fn [state]
                 (let [block (nth (:rum/args state) 1)
                       collapsed? (:block/collapsed? block)]
                   (state/set-collapsed-state! (:block/uuid block)
                                               collapsed?))
                 state)}
  [state config block uuid block-id level start-level body children dummy?]
  (let [has-child? (and
                    (not (:pre-block? block))
                    (or (seq children)
                        (seq body)))
        collapsed? (state/sub [:ui/collapsed-blocks uuid])
        collapsed? (and has-child? collapsed?)
        control-show (util/react (rum/cursor *control-show? block-id))
        dark? (= "dark" (state/sub :ui/theme))
        heading? (= (get (:block/properties block) "heading") "true")]
    [:div.mr-2.flex.flex-row.items-center
     {:style {:height 24
              :margin-top (if (and heading? (<= level 6))
                            (case level
                              1
                              32
                              2
                              22
                              18)
                            0)
              :float "left"}}

     [:a.block-control.opacity-50.hover:opacity-100
      {:id (str "control-" uuid)
       :style {:width 14
               :height 16
               :margin-right 2}
       :on-click (fn [e]
                   (util/stop e)
                   (if collapsed?
                     (expand/expand! block)
                     (expand/collapse! block))

                   (state/set-collapsed-state! uuid (not collapsed?)))}
      (cond
        (and control-show collapsed?)
        (svg/caret-right)

        (and control-show has-child?)
        (svg/caret-down)

        :else
        [:span ""])]
     [:a (if (not dummy?)
           {:href (rfe/href :page {:name uuid})
            :on-click (fn [e]
                        (if (gobj/get e "shiftKey")
                          (do
                            (state/sidebar-add-block!
                             (state/get-current-repo)
                             (:db/id block)
                             :block
                             block)
                            (util/stop e))
                          (when (:embed? config)
                            (route-handler/redirect! {:to :page
                                                      :path-params {:name (str uuid)}}))))})
      [:span.bullet-container.cursor
       {:id (str "dot-" uuid)
        :draggable true
        :on-drag-start (fn [event]
                         (editor-handler/highlight-block! uuid)
                         (.setData (gobj/get event "dataTransfer")
                                   "block-uuid"
                                   uuid)
                         (.setData (gobj/get event "dataTransfer")
                                   "block-dom-id"
                                   block-id)
                         (state/clear-selection!)
                         (reset! *dragging? true)
                         (reset! *dragging-block block))
        :blockid (str uuid)
        :class (str (when collapsed? "bullet-closed")
                    " "
                    (when (and (:document/mode? config)
                               (not collapsed?))
                      "hide-inner-bullet"))}
       [:span.bullet {:blockid (str uuid)
                      :class (if heading? "bullet-heading" "")}]]]]))

(defn- build-id
  [config ref? sidebar? embed?]
  (let [k (pr-str config)
        n (or
           (get @container-ids k)
           (let [n' (swap! container-idx inc)]
             (swap! container-ids assoc k n')
             n'))]
    (str n "-")))

(rum/defc dnd-separator
  [block margin-left bottom top? nested?]
  (let [id (str (:block/uuid block)
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
               :width "100%"
               :z-index 3}
              (if top?
                {:top 0}
                {:bottom 0}))}]))

(declare block-container)
(defn block-checkbox
  [block class]
  (let [marker (:block/marker block)
        [class checked?] (cond
                           (nil? marker)
                           nil
                           (contains? #{"NOW" "LATER" "DOING" "IN-PROGRESS" "TODO" "WAIT" "WAITING"} marker)
                           [class false]
                           (= "DONE" marker)
                           [(str class " checked") true])]
    (when class
      (ui/checkbox {:class class
                    :style {:margin-top -2
                            :margin-right 5}
                    :checked checked?
                    :on-change (fn [_e]
                                 ;; FIXME: Log timestamp
                                 (if checked?
                                   (editor-handler/uncheck block)
                                   (editor-handler/check block)))}))))

(defn list-checkbox
  [checked?]
  (ui/checkbox {:style {:margin-right 6}
                :checked checked?}))

(defn marker-switch
  [{:block/keys [pre-block? marker] :as block}]
  (when (contains? #{"NOW" "LATER" "TODO" "DOING"} marker)
    (let [set-marker-fn (fn [marker]
                          (fn [e]
                            (util/stop e)
                            (editor-handler/set-marker block marker)))]
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
  [{:block/keys [pre-block? marker] :as block}]
  (when-not pre-block?
    (if (contains? #{"IN-PROGRESS" "WAIT" "WAITING"} marker)
      [:span {:class (str "task-status " (string/lower-case marker))
              :style {:margin-right 3.5}}
       (string/upper-case marker)])))

(defn priority-cp
  [{:block/keys [pre-block? priority] :as block}]

  (when (and (not pre-block?) priority)
    (ui/tooltip
     [:ul
      (for [p (remove #(= priority %) ["A" "B" "C"])]
        [:a.mr-2.text-base.tooltip-priority {:priority p
                                             :on-click (fn [] (editor-handler/set-priority block p))}])]
     [:a.opacity-50.hover:opacity-100
      {:class "priority"
       :href (rfe/href :page {:name priority})
       :style {:margin-right 3.5}}
      (util/format "[#%s]" (str priority))])))

(defn block-tags-cp
  [{:block/keys [pre-block? tags] :as block}]
  (when (and (not pre-block?)
             (seq tags))
    (->elem
     :span
     {:class "block-tags"}
     (mapv (fn [tag]
             (when-let [page (db/entity (:db/id tag))]
               (let [tag (:page/name page)]
                 [:a.tag.mx-1 {:data-ref tag
                               :key (str "tag-" (:db/id tag))
                               :href (rfe/href :page {:name tag})}
                  (str "#" tag)])))
           tags))))

(declare block-content)

(defn build-block-title
  [{:keys [slide?] :as config} {:block/keys [uuid title tags marker level priority anchor meta format content pre-block? dummy? block-refs-count page properties]
                                :as t}]
  (let [config (assoc config :block t)
        slide? (boolean (:slide? config))
        html-export? (:html-export? config)
        checkbox (when (and (not pre-block?)
                            (not html-export?))
                   (block-checkbox t (str "mr-1 cursor")))
        marker-switch (when (and (not pre-block?)
                                 (not html-export?))
                        (marker-switch t))
        marker-cp (marker-cp t)
        priority (priority-cp t)
        tags (block-tags-cp t)
        contents? (= (:id config) "contents")
        heading? (= (get properties "heading") "true")
        bg-color (get properties "background_color")]
    (when level
      (let [element (if (and (<= level 6) heading?)
                      (keyword (str "h" level))
                      :div)]
        (->elem
         element
         (merge
          {:id anchor}
          (when (and marker
                     (not (string/blank? marker))
                     (not= "nil" marker))
            {:class (str (string/lower-case marker))})
          (when bg-color
            {:style {:background-color bg-color
                     :padding-left 6
                     :padding-right 6
                     :color "#FFFFFF"}
             :class "with-bg-color"}))
         (remove-nils
          (concat
           [(when-not slide? checkbox)
            (when-not slide? marker-switch)
            marker-cp
            priority]
           (if title
             (map-inline config title)
             [[:span.opacity-50 "Click here to start writing"]])
           [tags])))))))

(defn dnd-same-block?
  [uuid]
  (= (:block/uuid @*dragging-block) uuid))

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

(defn- pre-block-cp
  [config content format]
  (rum/with-context [[t] i18n/*tongue-context*]
    (let [ast (mldoc/->edn content (mldoc/default-config format))
          ast (map first ast)
          slide? (:slide? config)
          only-title? (and (= 1 (count ast))
                           (= "Properties" (ffirst ast))
                           (let [m (second (first ast))]
                             (every? #(contains? #{:title :filters} %) (keys m))))
          block-cp [:div {:class (if only-title?
                                   (util/hiccup->class "pre-block.opacity-50")
                                   (util/hiccup->class "pre-block.bg-base-2.p-2.rounded"))}
                    (if only-title?
                      [:span (t :page/edit-properties-placeholder)]
                      (markup-elements-cp (assoc config :block/format format) ast))]]
      (if slide?
        [:div [:h1 (:page-name config)]]
        block-cp))))

(rum/defc properties-cp
  [config block]
  (let [properties (apply dissoc (:block/properties block) text/hidden-properties)]
    (when (seq properties)
      [:div.blocks-properties.text-sm.opacity-80.my-1.p-2
       (for [[k v] properties]
         ^{:key (str (:block/uuid block) "-" k)}
         [:div.my-1
          [:b k]
          [:span.mr-1 ":"]
          (if (coll? v)
            (let [v (->> (remove string/blank? v)
                         (filter string?))
                  vals (for [v-item v]
                         (page-cp config {:page/name v-item}))]
              (interpose [:span ", "] vals))
            (let [page-name (string/lower-case (str v))]
              (if (db/entity [:page/name page-name])
                (page-cp config {:page/name page-name})
                (inline-text (:block/format block) (str v)))))])])))

(rum/defcs timestamp-cp < rum/reactive
  (rum/local false ::show?)
  (rum/local {} ::pos)
  {:will-unmount (fn [state]
                   (when-let [show? (::show? state)]
                     (reset! show? false))
                   state)}
  [state block typ ast]
  (let [show? (get state ::show?)]
    [:div.flex.flex-col
     [:div.text-sm.mt-1.flex.flex-row
      [:div.opacity-50.font-medium {:style {:width 95}}
       (str typ ": ")]
      [:a.opacity-80.hover:opacity-100
       {:on-click (fn []
                    (if @show?
                      (do
                        (reset! show? false)
                        (reset! commands/*current-command nil)
                        (state/set-editor-show-date-picker! false)
                        (state/set-timestamp-block! nil))
                      (do
                        (reset! show? true)
                        (reset! commands/*current-command typ)
                        (state/set-editor-show-date-picker! true)
                        (state/set-timestamp-block! {:block block
                                                     :typ typ
                                                     :show? show?}))))}
       (repeated/timestamp->text ast)]]
     (when (true? @show?)
       (let [ts (repeated/timestamp->map ast)]
         [:div.my-4
          (datetime-comp/date-picker nil nil ts)]))]))

(rum/defc block-content < rum/reactive
  [config {:block/keys [uuid title level body meta content marker dummy? page format repo children pre-block? properties collapsed? idx container block-refs-count scheduled scheduled-ast deadline deadline-ast repeated?] :as block} edit-input-id block-id slide?]
  (let [dragging? (rum/react *dragging?)
        attrs {:blockid       (str uuid)
               ;; FIXME: Click to copy a selection instead of click first and then copy
               ;; It seems that `util/caret-range` can't get the correct range
               :on-click      (fn [e]
                                (when-not (selection-range-in-block?)
                                  (let [target (gobj/get e "target")]
                                    (when-not (or (util/link? target)
                                                  (util/input? target)
                                                  (util/details-or-summary? target)
                                                  (and (util/sup? target)
                                                       (d/has-class? target "fn")))
                                      (editor-handler/clear-selection! nil)
                                      (editor-handler/unhighlight-block!)
                                      (let [cursor-range (util/caret-range (gdom/getElement block-id))
                                            properties-hidden? (text/properties-hidden? properties)
                                            content (text/remove-level-spaces content format)
                                            content (if properties-hidden? (text/remove-properties! content) content)
                                            block (db/pull [:block/uuid (:block/uuid block)])]
                                        (state/set-editing!
                                         edit-input-id
                                         content
                                         block
                                         cursor-range))
                                      (util/stop e)))))
               :on-drag-over  (fn [event]
                                (util/stop event)
                                (when-not (dnd-same-block? uuid)
                                  (show-dnd-separator (str uuid "-nested"))))
               :on-drag-leave (fn [event]
                                (hide-dnd-separator (str uuid))
                                (hide-dnd-separator (str uuid "-nested"))
                                (hide-dnd-separator (str uuid "-top")))
               :on-drop       (fn [event]
                                (util/stop event)
                                (when-not (dnd-same-block? uuid)
                                  (let [from-dom-id (get-data-transfer-attr event "block-dom-id")]
                                    (dnd/move-block @*dragging-block
                                                    block
                                                    from-dom-id
                                                    false
                                                    true)))
                                (reset! *dragging? false)
                                (reset! *dragging-block nil)
                                (editor-handler/unhighlight-block!))}]
    [:div.flex.relative
     [:div.flex-1.flex-col.relative.block-content
      (cond-> {:id (str "block-content-" uuid)}
        (not slide?)
        (merge attrs))

      (if pre-block?
        (pre-block-cp config (string/trim content) format)
        (when (seq title)
          (build-block-title config block)))

      (when (and dragging? (not slide?))
        (dnd-separator block 0 -4 false true))

      (when (and deadline deadline-ast)
        (timestamp-cp block "DEADLINE" deadline-ast))

      (when (and scheduled scheduled-ast)
        (timestamp-cp block "SCHEDULED" scheduled-ast))

      (when (and (seq properties)
                 (let [hidden? (text/properties-hidden? properties)]
                   (not hidden?))
                 (not (:slide? config)))
        (properties-cp config block))

      (when (and (not pre-block?) (seq body))
        (do
          [:div.block-body {:style {:display (if (and collapsed? (seq title)) "none" "")}}
          ;; TODO: consistent id instead of the idx (since it could be changed later)
          (let [body (block/trim-break-lines! (:block/body block))]
            (for [[idx child] (medley/indexed body)]
              (when-let [block (markup-element-cp config child)]
                (rum/with-key (block-child block)
                  (str uuid "-" idx)))))]))]
     (when (and block-refs-count (> block-refs-count 0))
       [:div
        [:a.open-block-ref-link.bg-base-2
         {:title "Open block references"
          :style {:margin-top -1}
          :on-click (fn []
                      (state/sidebar-add-block!
                       (state/get-current-repo)
                       (:db/id block)
                       :block-ref
                       {:block block}))}
         block-refs-count]])

     (when (and (= marker "DONE")
                (state/enable-timetracking?))
       (let [start-time (or
                         (get properties "now")
                         (get properties "doing")
                         (get properties "in-progress")
                         (get properties "later")
                         (get properties "todo"))
             finish-time (get properties "done")]
         (when (and start-time finish-time (> finish-time start-time))
           [:div.text-sm.absolute.time-spent {:style {:top 0
                                                      :right 0
                                                      :padding-left 2}
                                              :title (str (date/int->local-time start-time) " ~ " (date/int->local-time finish-time))}
            [:span.opacity-70
             (utils/timeConversion (- finish-time start-time))]])))]))

(rum/defc block-content-or-editor < rum/reactive
  [config {:block/keys [uuid title level body meta content dummy? page format repo children pre-block? collapsed? idx] :as block} edit-input-id block-id slide?]
  (let [edit? (state/sub [:editor/editing? edit-input-id])
        editor-box (get config :editor-box)]
    (if (and edit? editor-box)
      [:div.editor-wrapper {:id (str "editor-" edit-input-id)}
       (editor-box {:block block
                    :block-id uuid
                    :block-parent-id block-id
                    :format format
                    :dummy? dummy?
                    :on-hide (fn [value event]
                               (when (= event :esc)
                                 (editor-handler/highlight-block! uuid)))}
                   edit-input-id
                   config)]
      (block-content config block edit-input-id block-id slide?))))

(rum/defc dnd-separator-wrapper < rum/reactive
  [block slide? top?]
  (let [dragging? (rum/react *dragging?)]
    (cond
      (and dragging? (not slide?))
      (dnd-separator block 20 0 top? false)

      :else
      nil)))

(defn non-dragging?
  [e]
  (and (= (gobj/get e "buttons") 1)
       (not (d/has-class? (gobj/get e "target") "bullet-container"))
       (not (d/has-class? (gobj/get e "target") "bullet"))
       (not @*dragging?)))

(defn block-parents
  ([config repo block-id format]
   (block-parents config repo block-id format true))
  ([config repo block-id format show-page?]
   (let [parents (db/get-block-parents repo block-id 3)
         page (db/get-block-page repo block-id)
         page-name (:page/name page)]
     (when (or (seq parents)
               show-page?
               page-name)
       (let [parents-atom (atom parents)
             component [:div.block-parents.flex-row.flex-1
                        (when show-page?
                          [:a {:href (rfe/href :page {:name page-name})}
                           (or (:page/original-name page)
                               (:page/name page))])

                        (when (and show-page? (seq parents))
                          [:span.mx-2.opacity-50 "➤"])

                        (when (seq parents)
                          (let [parents (doall
                                         (for [{:block/keys [uuid title]} parents]
                                           [:a {:href (rfe/href :page {:name uuid})}
                                            (map-inline config title)]))
                                parents (remove nil? parents)]
                            (reset! parents-atom parents)
                            (when (seq parents)
                              (interpose [:span.mx-2.opacity-50 "➤"]
                                         parents))))]
             component (filterv identity component)]
         (when (or (seq @parents-atom) show-page?)
           component))))))

(rum/defc block-container < rum/static
  {:did-mount (fn [state]
                (let [block (nth (:rum/args state) 1)
                      collapsed? (:block/collapsed? block)]
                  (when collapsed?
                    (expand/collapse! block))
                  state))
   :should-update (fn [old-state new-state]
                    (not= (:block/content (second (:rum/args old-state)))
                          (:block/content (second (:rum/args new-state)))))}
  [config {:block/keys [uuid title level body meta content dummy? page format repo children collapsed? pre-block? idx properties refs-with-children] :as block}]
  (let [ref? (boolean (:ref? config))
        breadcrumb-show? (:breadcrumb-show? config)
        sidebar? (boolean (:sidebar? config))
        slide? (boolean (:slide? config))
        doc-mode? (:document/mode? config)
        embed? (:embed? config)
        unique-dom-id (build-id (dissoc config :block/uuid) ref? sidebar? embed?)
        edit-input-id (str "edit-block-" unique-dom-id uuid)
        block-id (str "ls-block-" unique-dom-id uuid)
        has-child? (boolean
                    (and
                     (not pre-block?)
                     (or (seq children)
                         (seq body))))
        start-level (or (:start-level config) 1)
        attrs {:on-drag-over (fn [event]
                               (util/stop event)
                               (when-not (dnd-same-block? uuid)
                                 (if (zero? idx)
                                   (let [element-top (gobj/get (utils/getOffsetRect (gdom/getElement block-id)) "top")
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
                          (when-not (dnd-same-block? uuid)
                            (let [from-dom-id (get-data-transfer-attr event "block-dom-id")]
                              (dnd/move-block @*dragging-block
                                              block
                                              from-dom-id
                                              @*move-to-top?
                                              false)))
                          (reset! *dragging? false)
                          (reset! *dragging-block nil)
                          (editor-handler/unhighlight-block!))
               :on-mouse-move (fn [e]
                                (when (and (non-dragging? e)
                                           (not @*resizing-image?))
                                  (state/into-selection-mode!)))
               :on-mouse-down (fn [e]
                                (when (and
                                       (not (state/get-selection-start-block))
                                       (= (gobj/get e "buttons") 1))
                                  (when block-id (state/set-selection-start-block! block-id))))
               :on-mouse-over (fn [e]
                                (util/stop e)
                                (when has-child?
                                  (swap! *control-show? assoc block-id true))
                                (when-let [parent (gdom/getElement block-id)]
                                  (let [node (.querySelector parent ".bullet-container")
                                        closed? (d/has-class? node "bullet-closed")]
                                    (if closed?
                                      (state/collapse-block! uuid)
                                      (state/expand-block! uuid))
                                    (when doc-mode?
                                      (d/remove-class! node "hide-inner-bullet"))))
                                (when (and
                                       (state/in-selection-mode?)
                                       (non-dragging? e))
                                  (util/stop e)
                                  (editor-handler/highlight-selection-area! block-id)))
               :on-mouse-out (fn [e]
                               (util/stop e)
                               (when has-child?
                                 (swap! *control-show?
                                        assoc block-id false))
                               (when doc-mode?
                                 (when-let [parent (gdom/getElement block-id)]
                                   (when-let [node (.querySelector parent ".bullet-container")]
                                     (d/add-class! node "hide-inner-bullet")))))}
        data-refs (let [refs (model/get-page-names-by-ids
                              (->> (map :db/id refs-with-children)
                                   (remove nil?)))]
                    (text/build-data-value refs))
        data-refs-self (let [refs  (model/get-page-names-by-ids
                                    (->> (map :db/id (:block/ref-pages block))
                                         (remove nil?)))]
                         (text/build-data-value refs))]
    [:div.ls-block.flex.flex-col.rounded-sm
     (cond->
      {:id block-id
       :data-refs data-refs
       :data-refs-self data-refs-self
       :style {:position "relative"}
       :class (str uuid
                   (when dummy? " dummy")
                   (when (and collapsed? has-child?) " collapsed")
                   (when pre-block? " pre-block"))
       :blockid (str uuid)
       :repo repo
       :level level
       :haschild (str has-child?)}
       (not slide?)
       (merge attrs))

     (when (and ref? breadcrumb-show?)
       (when-let [comp (block-parents config repo uuid format false)]
         [:div.my-2.opacity-50.ml-4 comp]))

     (dnd-separator-wrapper block slide? (zero? idx))

     [:div.flex-1.flex-row
      (when (not slide?)
        (block-control config block uuid block-id level start-level body children dummy?))

      (block-content-or-editor config block edit-input-id block-id slide?)]

     (when (seq children)
       [:div.block-children {:style {:margin-left (if doc-mode? 12 21)
                                     :display (if collapsed? "none" "")}}
        (for [child children]
          (when (map? child)
            (let [child (dissoc child :block/meta)]
              (rum/with-key (block-container (assoc config :block/uuid (:block/uuid child)) child)
                (:block/uuid child)))))])

     (when ref?
       (let [children (-> (db/get-block-immediate-children repo uuid)
                          db/sort-by-pos)
             children (block-handler/filter-blocks repo children (:filters config) false)]
         (when (seq children)
           [:div.ref-children.ml-12
            (blocks-container children (assoc config
                                              :breadcrumb-show? false
                                              :ref? true))])))

     (dnd-separator-wrapper block slide? false)]))

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
                     (markup-elements-cp config rest))
                    :else
                    (markup-elements-cp config content)))
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
  (let [repo (state/get-current-repo)]
    (let [queries (state/sub [:config repo :default-queries :journals])]
      (when (seq queries)
        (boolean (some #(= % title) (map :title queries)))))))

(defn- trigger-custom-query!
  [state]
  (let [[config query] (:rum/args state)
        query-atom (if (:dsl-query? config)
                     (query-dsl/query (state/get-current-repo) (:query query))
                     (db/custom-query query))]
    (assoc state :query-atom query-atom)))

(rum/defcs custom-query < rum/reactive
  {:will-mount trigger-custom-query!
   :did-mount (fn [state]
                (when-let [query (last (:rum/args state))]
                  (state/add-custom-query-component! query (:rum/react-component state)))
                state)
   :did-remount (fn [_old_state state]
                  (trigger-custom-query! state))
   :will-unmount (fn [state]
                   (when-let [query (last (:rum/args state))]
                     (state/remove-custom-query-component! query)
                     (db/remove-custom-query! (state/get-current-repo) query))
                   state)}
  [state config {:keys [title query inputs view collapsed? children?] :as q}]
  (let [dsl-query? (:dsl-query? config)
        query-atom (:query-atom state)]
    (let [current-block-uuid (or (:block/uuid (:block config))
                                 (:block/uuid config))
          ;; exclude the current one, otherwise it'll loop forever
          remove-blocks (if current-block-uuid [current-block-uuid] nil)
          query-result (and query-atom (rum/react query-atom))

          result (if (and query-result dsl-query?)
                   query-result
                   (db/custom-query-result-transform query-result remove-blocks q))
          result (if query-result
                   (db/custom-query-result-transform query-result remove-blocks q))
          view-f (and view (sci/eval-string (pr-str view)))
          only-blocks? (:block/uuid (first result))
          blocks-grouped-by-page? (and (seq result)
                                       (coll? (first result))
                                       (:page/name (ffirst result))
                                       (:block/uuid (first (second (first result))))
                                       true)
          built-in? (built-in-custom-query? title)]
      [:div.custom-query.mt-2 (get config :attr {})
       (when-not (and built-in? (empty? result))
         (ui/foldable
          [:div.opacity-70
           title]
          (cond
            (and (seq result) view-f)
            (let [result (try
                           (sci/call-fn view-f result)
                           (catch js/Error error
                             (log/error :custom-view-failed {:error error
                                                             :result result})
                             [:div "Custom view failed: "
                              (str error)]))]
              (util/hiccup-keywordize result))

            (and (seq result)
                 (or only-blocks? blocks-grouped-by-page?))
            (->hiccup result (cond-> (assoc config
                                            :custom-query? true
                                            ;; :breadcrumb-show? true
                                            :group-by-page? blocks-grouped-by-page?
                                            ;; :ref? true
)
                               children?
                               (assoc :ref? true))
                      {:style {:margin-top "0.25rem"
                               :margin-left "0.25rem"}})

            ;; page list
            (and (seq result)
                 (:page/name (first result)))
            [:ul#query-pages.mt-1
             (for [{:page/keys [name original-name] :as page-entity} result]
               [:li.mt-1
                [:a {:href (rfe/href :page {:name name})
                     :on-click (fn [e]
                                 (util/stop e)
                                 (if (gobj/get e "shiftKey")
                                   (state/sidebar-add-block!
                                    (state/get-current-repo)
                                    (:db/id page-entity)
                                    :page
                                    {:page page-entity})
                                   (route-handler/redirect! {:to :page
                                                             :path-params {:name name}})))}
                 (or original-name name)]])]

            (seq result)                     ;TODO: table
            (let [result (->>
                          (for [record result]
                            (if (map? record)
                              (str (util/pp-str record) "\n")
                              record))
                          (remove nil?))]
              [:pre result])

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
      (markup-elements-cp config result)]]))

(defn markup-element-cp
  [{:keys [html-export?] :as config} item]
  (try
    (match item
      ["Properties" m]
      [:div.properties
       (let [format (:block/format config)]
         (for [[k v] (dissoc m :roam_alias :roam_tags)]
           (when (and (not (and (= k :macros) (empty? v))) ; empty macros
                      (not (= k :title))
                      (not (= k :filters)))
             [:div.property
              [:span.font-medium.mr-1 (str (name k) ": ")]
              (if (coll? v)
                (let [vals (for [item v]
                             (if (coll? v)
                               (let [config (if (= k :alias)
                                              (assoc config :page/alias? true))]
                                 (page-cp config {:page/name item}))
                               (inline-text format item)))]
                  (interpose [:span ", "] vals))
                (inline-text format v))])))]

      ["Paragraph" l]
      ;; TODO: speedup
      (if (re-find #"\"Export_Snippet\" \"embed\"" (str l))
        (->elem :div (map-inline config l))
        (->elem :div.is-paragraph (map-inline config l)))

      ["Horizontal_Rule"]
      (when-not (:slide? config)
        [:hr])
      ["Heading" h]
      (block-container config h)
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
      [:pre.pre-wrap-white-space
       (join-lines l)]
      ["Src" options]
      (let [{:keys [language options lines pos_meta]} options
            attr (if language
                   {:data-lang language})
            code (join-lines lines)]
        (cond
          html-export?
          (highlight/html-export attr code)

          :else
          (let [language (if (contains? #{"edn" "clj" "cljc" "cljs" "clojure"} language) "text/x-clojure" language)]
            (if (:slide? config)
              (highlight/highlight (str (medley/random-uuid)) {:data-lang language} code)
              [:div
               (lazy-editor/editor config (str (dc/squuid)) attr code pos_meta)
               (when (and (= language "text/x-clojure") (contains? (set options) ":results"))
                 (sci/eval-result code))]))))
      ["Quote" l]
      (->elem
       :blockquote
       (markup-elements-cp config l))
      ["Raw_Html" content]
      (when (not html-export?)
        [:div.raw_html {:dangerouslySetInnerHTML
                        {:__html content}}])
      ["Export" "html" options content]
      (when (not html-export?)
        [:div.export_html {:dangerouslySetInnerHTML
                           {:__html content}}])
      ["Hiccup" content]
      (ui/catch-error
       [:div.warning {:title "Invalid hiccup"}
        content]
       (-> (safe-read-string content)
           (security/remove-javascript-links-in-href)))

      ["Export" "latex" options content]
      (if html-export?
        (latex/html-export content true false)
        (latex/latex (str (dc/squuid)) content true false))

      ["Custom" "query" _options result content]
      (try
        (let [query (reader/read-string content)]
          (custom-query config query))
        (catch js/Error e
          (println "read-string error:")
          (js/console.error e)
          [:div.warning {:title "Invalid query"}
           content]))

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
       (markup-elements-cp config l))

      ["Latex_Fragment" l]
      [:p.latex-fragment
       (inline config ["Latex_Fragment" l])]

      ["Latex_Environment" name option content]
      (let [content (latex-environment-content name option content)]
        (if html-export?
          (latex/html-export content true true)
          (latex/latex (str (dc/squuid)) content true true)))

      ["Displayed_Math" content]
      (if html-export?
        (latex/html-export content true true)
        (latex/latex (str (dc/squuid)) content true true))

      ["Footnote_Definition" name definition]
      (let [id (util/url-encode name)]
        [:div.footdef
         [:div.footpara
          (conj
           (markup-element-cp config ["Paragraph" definition])
           [:a.ml-1 {:id (str "fn." id)
                     :style {:font-size 14}
                     :class "footnum"
                     :on-click #(route-handler/jump-to-anchor! (str "fnr." id))}
            [:sup.fn (str name "↩︎")]])]])

      :else
      "")
    (catch js/Error e
      (println "Convert to html failed, error: " e)
      "")))

(defn markup-elements-cp
  [config col]
  (map #(markup-element-cp config %) col))

(defn build-slide-sections
  ([blocks config]
   (build-slide-sections blocks config nil))
  ([blocks config build-block-fn]
   (when (seq blocks)
     (let [blocks (map #(dissoc % :block/children) blocks)
           first-block-level (:block/level (first blocks))
           sections (reduce
                     (fn [acc block]
                       (let [block (dissoc block :block/meta)
                             level (:block/level block)
                             block-cp (if build-block-fn
                                        (build-block-fn config block)
                                        (rum/with-key
                                          (block-container config block)
                                          (str "slide-" (:block/uuid block))))]
                         (if (= first-block-level level)
                           ;; new slide
                           (conj acc [[block block-cp]])
                           (update acc (dec (count acc))
                                   (fn [sections]
                                     (conj sections [block block-cp]))))))
                     []
                     blocks)]
       sections))))

(rum/defc add-button < rum/reactive
  [config ref? custom-query? blocks]
  (let [editing (state/sub [:editor/editing?])]
    (when-not (or ref? custom-query?
                  (:block/dummy? (last blocks))
                  (second (first editing)))
      (when-let [last-block (last blocks)]
        [:a.add-button-link {:on-click (fn []
                                         (editor-handler/insert-new-block-without-save-previous! config last-block))}
         svg/plus-circle]))))

(defn blocks-container
  [blocks config]
  (let [blocks (map #(dissoc % :block/children) blocks)
        sidebar? (:sidebar? config)
        ref? (:ref? config)
        custom-query? (:custom-query? config)
        blocks->vec-tree #(if (or custom-query? ref?) % (block-handler/blocks->vec-tree %))
        blocks (blocks->vec-tree blocks)]
    (when (seq blocks)
      [:div.blocks-container.flex-1
       {:style {:margin-left (cond
                               sidebar?
                               0
                               :else
                               -10)}}
       (let [first-block (first blocks)
             blocks (if (and (:block/pre-block? first-block)
                             (block-handler/pre-block-with-only-title? (:block/repo first-block) (:block/uuid first-block)))
                      (rest blocks)
                      blocks)
             first-id (:block/uuid (first blocks))]
         (for [[idx item] (medley/indexed blocks)]
           (let [item (-> (if (:block/dummy? item)
                            item
                            (dissoc item :block/meta)))
                 config (assoc config :block/uuid (:block/uuid item))]
             (rum/with-key
               (block-container config item)
               (:block/uuid item)))))
       ;; (add-button config ref? custom-query? blocks)
])))

;; headers to hiccup
(defn ->hiccup
  [blocks config option]
  [:div.content
   (cond-> option
     (:document/mode? config)
     (assoc :class "doc-mode"))
   (if (:group-by-page? config)
     [:div.flex.flex-col
      (let [blocks (sort-by (comp :page/journal-day first) > blocks)]
        (for [[page blocks] blocks]
          (let [alias? (:page/alias? page)
                page (db/entity (:db/id page))]
            [:div.my-2 (cond-> {:key (str "page-" (:db/id page))}
                         (:ref? config)
                         (assoc :class "color-level px-7 py-2 rounded"))
             (ui/foldable
              [:div
               (page-cp config page)
               (when alias? [:span.text-sm.font-medium.opacity-50 " Alias"])]
              (blocks-container blocks config))])))]
     (blocks-container blocks config))])

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
| Anna  |  4321 |  25 |"))
