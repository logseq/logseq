(ns frontend.handler.editor
  (:require [frontend.state :as state]
            [frontend.handler.route :as route-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.notification :as notification]
            [frontend.expand :as expand]
            [frontend.format :as format]
            [frontend.format.block :as block]
            [cljs-time.local :as tl]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.db :as db]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [goog.dom.classes :as gdom-classes]
            [clojure.string :as string]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.config :as config]
            [dommy.core :as dom]
            [frontend.utf8 :as utf8]
            [frontend.fs :as fs]
            [promesa.core :as p]
            [frontend.diff :as diff]))

(defn- get-selection-and-format
  []
  (when-let [heading (state/get-edit-heading)]
    (when-let [id (:heading/uuid heading)]
      (when-let [edit-id (state/get-edit-input-id)]
        (when-let [input (gdom/getElement edit-id)]
          {:selection-start (gobj/get input "selectionStart")
           :selection-end (gobj/get input "selectionEnd")
           :format (:heading/format heading)
           :value (gobj/get input "value")
           :heading heading
           :edit-id edit-id
           :input input})))))

(defn- format-text!
  [pattern-fn]
  (when-let [m (get-selection-and-format)]
    (let [{:keys [selection-start selection-end format value heading edit-id input]} m
          empty-selection? (= selection-start selection-end)
          pattern (pattern-fn format)
          new-value (str
                     (subs value 0 selection-start)
                     pattern
                     (subs value selection-start selection-end)
                     pattern
                     (subs value selection-end))]
      (state/set-edit-content! edit-id new-value)
      (when empty-selection?
        (util/cursor-move-back input (count pattern))))))

(defn bold-format! []
  (format-text! config/get-bold))

(defn italics-format! []
  (format-text! config/get-italic))

(defn highlight-format! []
  (format-text! config/get-highlight))

(defn html-link-format! []
  (when-let [m (get-selection-and-format)]
    (let [{:keys [selection-start selection-end format value heading edit-id input]} m
          empty-selection? (= selection-start selection-end)
          selection (subs value selection-start selection-end)
          selection-link? (and selection (or (string/starts-with? selection "http://")
                                             (string/starts-with? selection "https://")))
          [content back-pos] (cond
                               empty-selection?
                               (config/get-empty-link-and-back-pos format)

                               selection-link?
                               (config/with-default-link format selection)

                               :else
                               (config/with-default-label format selection))
          new-value (str
                     (subs value 0 selection-start)
                     content
                     (subs value selection-end))]
      (state/set-edit-content! edit-id new-value)
      (util/cursor-move-back input back-pos))))

(defn cycle-collapse!
  [_state e]
  (when (and
         ;; not input, t
         (nil? (state/get-edit-input-id))
         (not (state/get-editor-show-input))
         (string/blank? (:search/q @state/state)))
    (util/stop e)
    (expand/cycle!)))

(defn copy-block-ref!
  [heading-id]
  (util/copy-to-clipboard! (str heading-id)))

(defn focus-on-block!
  [heading-id]
  (when heading-id
    (route-handler/redirect! {:to :page
                              :path-params {:name (str heading-id)}})))

(defn open-heading-in-sidebar!
  [heading-id]
  (when heading-id
    (when-let [heading (db/pull [:heading/uuid heading-id])]
      (state/sidebar-add-block!
       (state/get-current-repo)
       (:db/id heading)
       :heading
       heading)
      (ui-handler/show-right-sidebar))))

(defn remove-level-spaces
  [text format]
  (if-not (string/blank? text)
    (let [pattern (util/format
                   "^[%s]+\\s?"
                   (config/get-heading-pattern format))]
      (string/replace-first text (re-pattern pattern) ""))))

(defn reset-cursor-range!
  [node]
  (when node
    (state/set-cursor-range! (util/caret-range node))))

(defn restore-cursor-pos!
  ([id markup]
   (restore-cursor-pos! id markup false))
  ([id markup dummy?]
   (when-let [node (gdom/getElement (str id))]
     (when-let [cursor-range (state/get-cursor-range)]
       (when-let [range (string/trim cursor-range)]
         (let [pos (inc (diff/find-position markup range))]
           (util/set-caret-pos! node pos)))))))

(defn heading-content-join-newlines
  [prefix value postfix]
  (str
   (if (or (= "" prefix)
           (= "\n" (last prefix)))
     ""
     "\n")
   (string/trim value)
   (if (= "\n" (first postfix))
     ""
     "\n")))

(defn new-file-content
  [{:heading/keys [content meta dummy?] :as heading} file-content value]
  (let [utf8-content (utf8/encode file-content)
        prefix (utf8/substring utf8-content 0 (:pos meta))
        postfix (let [end-pos (if dummy?
                                (:pos meta)
                                (:end-pos meta))]
                  (utf8/substring utf8-content end-pos))
        value (heading-content-join-newlines prefix value postfix)]
    [(str prefix value postfix)
     value]))

(defn get-heading-new-value
  [{:heading/keys [content meta dummy?] :as heading} file-content value]
  (let [utf8-content (utf8/encode file-content)
        prefix (utf8/substring utf8-content 0 (:pos meta))
        postfix (let [end-pos (if dummy?
                                (:pos meta)
                                (:end-pos meta))]
                  (utf8/substring utf8-content end-pos))]
    (heading-content-join-newlines prefix value postfix)))

(defn new-file-content-indent-outdent
  [{:heading/keys [content meta dummy?] :as heading} file-content value heading-with-children-content last-child-end-pos indent-left?]
  (let [utf8-content (utf8/encode file-content)
        prefix (utf8/substring utf8-content 0 (:pos meta))
        last-child-end-pos (if (some? indent-left?) last-child-end-pos nil)
        end-pos (or
                 last-child-end-pos
                 (if dummy?
                   (:pos meta)
                   (:end-pos meta)))
        postfix (utf8/substring utf8-content end-pos)
        heading-children-value (heading-content-join-newlines prefix heading-with-children-content postfix)]
    (str prefix heading-children-value postfix)))

(defn- default-content-with-title
  [format title]
  (let [contents? (= (string/lower-case title) "contents")]
    (case format
      "org"
      (if contents?
        (util/format "#+TITLE: %s\n#+LIST: [[]]" title)
        (util/format "#+TITLE: %s\n#+TAGS:\n\n** " title))
      "markdown"
      (if contents?
        (util/format "---\ntitle: %s\nlist: [[]]\n---" title)
        (util/format "---\ntitle: %s\ntags:\n---\n\n## " title))
      "")))

(defn create-new-page!
  [title]
  (let [repo (state/get-current-repo)
        dir (util/get-repo-dir repo)]
    (when dir
      (p/let [_ (-> (fs/mkdir (str dir "/" config/default-pages-directory))
                    (p/catch (fn [_e])))]
        (let [format (name (state/get-preferred-format))
              page (string/lower-case title)
              path (str (string/replace page #"\s+" "_") "." (if (= format "markdown") "md" format))
              path (str config/default-pages-directory "/" path)
              file-path (str "/" path)]
          (p/let [exists? (fs/file-exists? dir file-path)]
            (if exists?
              (notification/show!
               [:p.content
                "File already exists!"]
               :error)
              ;; create the file
              (let [content (default-content-with-title format title)]
                (p/let [_ (fs/create-if-not-exists dir file-path content)]
                  (db/reset-file! repo path content)
                  (git-handler/git-add repo path)
                  (route-handler/redirect! {:to :page
                                            :path-params {:name page}}))))))))))

(defn- with-heading-meta
  [repo heading]
  (if (:heading/dummy? heading)
    (if-let [page-id (:db/id (:heading/page heading))]
      (let [page-name (:page/name (db/entity repo page-id))
            end-pos (db/get-heading-page-end-pos repo page-name)]
        (assoc heading :heading/meta {:pos end-pos
                                      :end-pos end-pos}))
      heading)
    (if-let [meta (:heading/meta (db/entity repo [:heading/uuid (:heading/uuid heading)]))]
      (assoc heading :heading/meta meta)
      heading)))

(defn highlight-heading!
  [heading-uuid]
  (let [headings (array-seq (js/document.getElementsByClassName (str heading-uuid)))]
    (doseq [heading headings]
      (dom/add-class! heading "block-highlight"))))

(defn unhighlight-heading!
  []
  (let [headings (some->> (array-seq (js/document.getElementsByClassName "block-highlight"))
                          (repeat 2)
                          (apply concat))]
    (doseq [heading headings]
      (gdom-classes/remove heading "block-highlight"))))

(defn rebuild-after-headings
  [repo file before-end-pos new-end-pos]
  (let [file-id (:db/id file)
        after-headings (db/get-file-after-headings-meta repo file-id before-end-pos)
        last-start-pos (atom new-end-pos)]
    (mapv
     (fn [{:heading/keys [uuid meta] :as heading}]
       (let [old-start-pos (:pos meta)
             old-end-pos (:end-pos meta)
             new-end-pos (if old-end-pos
                           (+ @last-start-pos (- old-end-pos old-start-pos)))
             new-meta {:pos @last-start-pos
                       :end-pos new-end-pos}]
         (reset! last-start-pos new-end-pos)
         {:heading/uuid uuid
          :heading/meta new-meta}))
     after-headings)))

(defn rebuild-after-headings-indent-outdent
  [repo file heading before-end-pos new-end-pos indent-left?]
  (let [file-id (:db/id file)
        after-headings (db/get-file-after-headings-meta repo file-id before-end-pos true)
        last-start-pos (atom new-end-pos)
        heading-level (:heading/level heading)
        next-leq-level? (atom false)
        format (:heading/format heading)
        heading-and-children-content (atom (:heading/content heading))
        last-child-end-pos (atom before-end-pos)
        after-headings (mapv
                        (fn [{:heading/keys [uuid meta level content] :as heading}]
                          (let [old-start-pos (:pos meta)
                                old-end-pos (:end-pos meta)
                                ]
                            (when (<= level heading-level)
                              (reset! next-leq-level? true))

                            (let [[new-content offset] (cond
                                                         (and (not @next-leq-level?) (true? indent-left?))
                                                         [(subs content 1) -1]
                                                         (and (not @next-leq-level?) (false? indent-left?))
                                                         [(str (config/get-heading-pattern format) content) 1]
                                                         :else
                                                         [nil 0])
                                  new-end-pos (if old-end-pos
                                                (+ @last-start-pos
                                                   (- old-end-pos old-start-pos)
                                                   offset))
                                  new-meta {:pos @last-start-pos
                                            :end-pos new-end-pos}]
                              (reset! last-start-pos new-end-pos)
                              (when-not @next-leq-level?
                                (do
                                  (reset! heading-and-children-content (str @heading-and-children-content new-content))
                                  (reset! last-child-end-pos old-end-pos)))

                              (cond->
                                {:heading/uuid uuid
                                 :heading/meta new-meta}
                                (and (some? indent-left?) (not @next-leq-level?))
                                (assoc :heading/level (if indent-left? (dec level) (inc level)))
                                (and new-content (not @next-leq-level?))
                                (assoc :heading/content new-content)))))
                        after-headings)]
    [after-headings @heading-and-children-content @last-child-end-pos]))

(defn compute-retract-refs
  [eid {:heading/keys [ref-pages ref-headings]} old-ref-pages old-ref-headings]
  (let [retracted? (or (and (empty? ref-pages) (seq old-ref-pages))
                       (and (empty? ref-headings) (seq old-ref-headings)))]
    (when (and eid retracted?)
      (->>
       (map
         (fn [[refs refs-k]]
           (when (and refs (empty? refs))
             [:db/retract eid refs-k]))
         [[ref-pages :heading/ref-pages]
          [ref-headings :heading/ref-headings]])
       (remove nil?)))))

(defn save-heading-if-changed!
  ([heading value]
   (save-heading-if-changed! heading value nil))
  ([{:heading/keys [uuid content meta file page dummy? format repo pre-heading? content ref-pages ref-headings] :as heading} value indent-left?]
   (let [repo (or repo (state/get-current-repo))
         e (db/entity repo [:heading/uuid uuid])
         heading (with-heading-meta repo heading)
         format (or format (state/get-preferred-format))
         page (db/entity repo (:db/id page))
         [old-directives new-directives] (when pre-heading?
                                           [(:page/directives (db/entity (:db/id page)))
                                            (db/parse-directives value format)])
         page-tags (when-let [tags (:tags new-directives)]
                     (util/->tags tags))
         page-alias (when-let [alias (:alias new-directives)]
                      (map
                        (fn [alias]
                          {:page/name (string/lower-case alias)})
                        (remove #{(:page/name page)} alias)))
         page-list (when-let [content (:list new-directives)]
                     (db/extract-page-list content))
         permalink-changed? (when (and pre-heading? (:permalink old-directives))
                              (not= (:permalink old-directives)
                                    (:permalink new-directives)))
         value (if permalink-changed?
                 (db/add-directives! format value {:old_permalink (:permalink old-directives)})
                 value)
         new-directives (if permalink-changed?
                          (assoc new-directives :old_permalink (:permalink old-directives))
                          new-directives)]
     (when (not= (string/trim content) (string/trim value)) ; heading content changed
       (let [file (db/entity repo (:db/id file))]
         (cond
           ;; Page was referenced but no related file
           (and page (not file))
           (let [format (name format)
                 path (str (-> (:page/name page)
                               (string/replace #"\s+" "_")
                               (util/encode-str)) "."
                           (if (= format "markdown") "md" format))
                 file-path (str "/" path)
                 dir (util/get-repo-dir repo)]
             (p/let [exists? (fs/file-exists? dir file-path)]
               (if exists?
                 (notification/show!
                  [:p.content
                   "File already exists!"]
                  :error)
                 ;; create the file
                 (let [content (default-content-with-title format (:page/original-name page))]
                   (p/let [_ (fs/create-if-not-exists dir file-path content)]
                     (db/reset-file! repo path (str content
                                                    (remove-level-spaces value (keyword format))))
                     (git-handler/git-add repo path)
                     (ui-handler/re-render-root!))))))

           (and file page)
           (let [file (db/entity repo (:db/id file))
                 file-path (:file/path file)
                 format (format/get-format file-path)
                 file-content (db/get-file repo file-path)
                 value (get-heading-new-value heading file-content value)
                 heading (assoc heading :heading/content value)
                 {:keys [headings pages start-pos end-pos]} (if pre-heading?
                                                              (let [new-end-pos (utf8/length (utf8/encode value))]
                                                                {:headings [(assoc-in heading [:heading/meta :end-pos] new-end-pos)]
                                                                 :pages []
                                                                 :start-pos 0
                                                                 :end-pos new-end-pos})
                                                              (block/parse-heading heading format))
                 [after-headings heading-children-content new-end-pos] (rebuild-after-headings-indent-outdent repo file heading (:end-pos (:heading/meta heading)) end-pos indent-left?)
                 new-content (new-file-content-indent-outdent heading file-content value heading-children-content new-end-pos indent-left?)
                 ;; _ (prn {:heading-children-content heading-children-content
                 ;;         :new-end-pos new-end-pos
                 ;;         :new-content new-content})
                 retract-refs (compute-retract-refs (:db/id e) (first headings) ref-pages ref-headings)
                 headings (db/recompute-heading-children repo heading headings)
                 page-id (:db/id page)
                 modified-time (let [modified-at (tc/to-long (t/now))]
                                 [[:db/add page-id :page/last-modified-at modified-at]
                                  [:db/add (:db/id file) :file/last-modified-at modified-at]])
                 page-directives (when pre-heading?
                                   (if (seq new-directives)
                                     [[:db/retract page-id :page/directives]
                                      {:db/id page-id
                                       :page/directives new-directives}]
                                     [[:db/retract page-id :page/directives]]))
                 page-list (when pre-heading?
                             (if (seq page-list)
                               [[:db/retract page-id :page/list]
                                {:db/id page-id
                                 :page/list page-list}]
                               [[:db/retract page-id :page/list]]))
                 page-tags (when (and pre-heading? (seq page-tags))
                             (if (seq page-tags)
                               [[:db/retract page-id :page/tags]
                                {:db/id page-id
                                 :page/tags page-tags}]
                               [[:db/retract page-id :page/tags]]))
                 page-alias (when (and pre-heading? (seq page-alias))
                              (if (seq page-alias)
                                [[:db/retract page-id :page/alias]
                                 {:db/id page-id
                                  :page/alias page-alias}]
                                [[:db/retract page-id :page/alias]]))]
             (profile
              "Save heading: "
              (repo-handler/transact-react-and-alter-file!
               repo
               (concat
                pages
                headings
                retract-refs
                page-directives
                page-list
                page-tags
                page-alias
                after-headings
                modified-time)
               {:key :heading/change
                :data (map (fn [heading] (assoc heading :heading/page page)) headings)}
               [[file-path new-content]]))
             (when (or (seq retract-refs) pre-heading?)
               (ui-handler/re-render-root!)))

           :else
           nil))))))

(defn insert-new-heading!
  [{:heading/keys [uuid content meta file dummy? level repo page format] :as heading} value create-new-heading? ok-handler with-level?]
  (let [input (gdom/getElement (state/get-edit-input-id))
        pos (:pos (util/get-caret-pos input))
        repo (or repo (state/get-current-repo))
        v1 (subs value 0 pos)
        v2 (string/triml (subs value pos))
        v1 (string/trim (if with-level? v1 (block/with-levels v1 format heading)))
        v2 (str (config/default-empty-heading format level) " " v2)
        heading (with-heading-meta repo heading)
        format (:heading/format heading)
        page (db/entity repo (:db/id page))
        file (db/entity repo (:db/id file))
        insert-heading (fn [heading file-path file-content]
                         (let [value (if create-new-heading?
                                       (str v1 "\n" v2)
                                       value)
                               [new-content value] (new-file-content heading file-content value)
                               {:keys [headings pages start-pos end-pos]} (block/parse-heading (assoc heading :heading/content value) format)
                               first-heading (first headings)
                               last-heading (last headings)
                               headings (db/recompute-heading-children repo heading headings)
                               after-headings (rebuild-after-headings repo file (:end-pos meta) end-pos)]
                           (repo-handler/transact-react-and-alter-file!
                            repo
                            (concat
                             pages
                             headings
                             after-headings)
                            {:key :heading/change
                             :data (map (fn [heading] (assoc heading :heading/page page)) headings)}
                            [[file-path new-content]])

                           (when ok-handler
                             (ok-handler [first-heading last-heading v2]))))]
    (cond
      (and (not file) page)
      (let [format (name format)
            path (str (-> (:page/name page)
                          (string/replace #"\s+" "_")
                          (util/encode-str))
                      "."
                      (if (= format "markdown") "md" format))
            file-path (str "/" path)
            dir (util/get-repo-dir repo)]
        (p/let [exists? (fs/file-exists? dir file-path)]
          (if exists?
            (notification/show!
             [:p.content
              "File already exists!"]
             :error)
            ;; create the file
            (let [content (default-content-with-title format (:page/original-name page))]
              (p/let [_ (fs/create-if-not-exists dir file-path content)]
                (db/reset-file! repo path
                                (str content
                                     (remove-level-spaces value (keyword format))
                                     "\n"
                                     v2))
                (git-handler/git-add repo path)
                (ui-handler/re-render-root!))))))

      file
      (let [file-path (:file/path file)
            file-content (db/get-file repo file-path)]
        (insert-heading heading file-path file-content))

      :else
      nil)))

;; TODO: utf8 encode performance
(defn check
  [{:heading/keys [uuid marker content meta file dummy?] :as heading}]
  (let [new-content (string/replace-first content marker "DONE")]
    (save-heading-if-changed! heading new-content)))

(defn uncheck
  [{:heading/keys [uuid marker content meta file dummy?] :as heading}]
  (let [new-content (string/replace-first content "DONE" "NOW")]
    (save-heading-if-changed! heading new-content)))

(defn set-marker
  [{:heading/keys [uuid marker content meta file dummy?] :as heading} new-marker]
  (let [new-content (string/replace-first content marker new-marker)]
    (save-heading-if-changed! heading new-content)))

(defn set-priority
  [{:heading/keys [uuid marker priority content meta file dummy?] :as heading} new-priority]
  (let [new-content (string/replace-first content
                                          (util/format "[#%s]" priority)
                                          (util/format "[#%s]" new-priority))]
    (save-heading-if-changed! heading new-content)))

(defn delete-heading!
  [{:heading/keys [uuid meta content file repo ref-pages ref-headings] :as heading} dummy?]
  (when-not dummy?
    (let [repo (or repo (state/get-current-repo))
          heading (db/pull repo '[*] [:heading/uuid uuid])]
      (when heading
        (let [file-path (:file/path (db/entity repo (:db/id file)))
              file-content (db/get-file repo file-path)
              after-headings (rebuild-after-headings repo file (:end-pos meta) (:pos meta))
              new-content (utf8/delete! file-content (:pos meta) (:end-pos meta))]
          (repo-handler/transact-react-and-alter-file!
           repo
           (concat
            [[:db.fn/retractEntity [:heading/uuid uuid]]]
            after-headings)
           {:key :heading/change
            :data [heading]}
           [[file-path new-content]])
          (when (or (seq ref-pages) (seq ref-headings))
            (ui-handler/re-render-root!)))))))

(defn delete-headings!
  [repo heading-uuids]
  (when (seq heading-uuids)
    (let [headings (db/pull-many repo '[*] (mapv (fn [id]
                                                   [:heading/uuid id])
                                                 heading-uuids))
          first-heading (first headings)
          last-heading (last headings)
          file (db/entity repo (:db/id (:heading/file first-heading)))
          file-path (:file/path file)
          file-content (db/get-file repo file-path)
          start-pos (:pos (:heading/meta first-heading))
          end-pos (:end-pos (:heading/meta last-heading))
          after-headings (rebuild-after-headings repo file end-pos start-pos)
          new-content (utf8/delete! file-content start-pos end-pos)
          tx-data (concat
                   (mapv
                    (fn [uuid]
                      [:db.fn/retractEntity [:heading/uuid uuid]])
                    heading-uuids)
                   after-headings
                   [{:file/path file-path}])]
      (repo-handler/transact-react-and-alter-file!
       repo
       tx-data
       {:key :heading/change
        :data headings}
       [[file-path new-content]])
      (ui-handler/re-render-root!))))

(defn set-heading-property!
  [heading-id key value]
  (let [heading-id (if (string? heading-id) (uuid heading-id) heading-id)
        key (string/upper-case (name key))
        value (name value)]
    (when-let [heading (db/pull [:heading/uuid heading-id])]
      (let [{:heading/keys [file page content properties properties-meta meta]} heading
            {:keys [start-pos end-pos]} properties-meta
            start-pos (- start-pos (:pos meta))]
        (cond
          (= (get properties key) value)
          nil

          (and start-pos end-pos (> end-pos start-pos))
          (let [encoded (utf8/encode content)
                properties (utf8/substring encoded start-pos end-pos)
                lines (string/split-lines properties)
                property-check? #(re-find (re-pattern
                                           (util/format ":%s:" key))
                                          %)
                has-property? (some property-check? lines)]
            (when-not (and has-property?
                           (some #(string/includes? % (str ":" key ": " value)) lines)) ; same key-value, skip it
              (let [properties (if has-property?
                                 (str
                                  (->> (map (fn [line]
                                              (if (property-check? line)
                                                (util/format "   :%s: %s" key value)
                                                line)) lines)
                                       (string/join "\n"))
                                  "\n")
                                 (str properties
                                      (util/format "\n   :%s: %s\n" key value)))
                    prefix (utf8/substring encoded 0 start-pos)
                    postfix (when (> (:end-pos meta) end-pos)
                              (utf8/substring encoded end-pos (:end-pos meta)))
                    new-content (str prefix properties postfix)]
                (save-heading-if-changed! heading new-content))))

          :else
          (let [properties (util/format
                            "\n   :PROPERTIES:\n   :%s: %s\n   :END:\n"
                            key value)
                [heading-line & others] (string/split-lines content)
                new-content (str heading-line properties
                                 (string/join "\n" others))]
            (save-heading-if-changed! heading new-content)))))))

(defn edit-heading!
  [heading-id prev-pos format id]
  (let [edit-input-id (str (subs id 0 (- (count id) 36)) heading-id)
        heading (or
                 (db/pull [:heading/uuid heading-id])
                 ;; dummy?
                 {:heading/uuid heading-id
                  :heading/content ""})
        {:heading/keys [content]} heading
        content (string/trim (remove-level-spaces content format))
        content-length (count content)
        text-range (if (or (= :max prev-pos) (<= content-length prev-pos))
                     content
                     (subs content 0 prev-pos))]
    (state/set-editing! edit-input-id content heading text-range)))

(defn clear-selection!
  [e]
  (when (state/in-selection-mode?)
    (doseq [heading (state/get-selection-headings)]
      (dom/remove-class! heading "selected")
      (dom/remove-class! heading "noselect"))
    (state/clear-selection!))
  ;; (when e
  ;;   (when-not (util/input? (gobj/get e "target"))
  ;;     (util/clear-selection!)))
  )

(defn select-all-headings!
  []
  (when-let [current-input-id (state/get-edit-input-id)]
    (let [input (gdom/getElement current-input-id)
          headings-container (util/rec-get-headings-container input)
          headings (dom/by-class headings-container "ls-heading")]
      (doseq [heading headings]
        (dom/add-class! heading "selected noselect"))
      (state/set-selection-headings! headings))))

(defn- get-selected-headings-with-children
  []
  (when-let [headings (seq (get @state/state :selection/headings))]
    (mapcat (fn [heading]
              (cons heading
                    (array-seq (dom/by-class heading "ls-heading"))))
            headings)))

(defn copy-selection-headings
  []
  (when-let [headings (seq (get-selected-headings-with-children))]
    (let [repo (dom/attr (first headings) "repo")
          ids (distinct (map #(uuid (dom/attr % "headingid")) headings))
          up? (state/selection-up?)
          content (some->> (db/get-headings-contents repo ids)
                           (map :heading/content))
          content (if (false? up?) (reverse content) content)
          content (string/join "" content)]
      (when-not (string/blank? content)
        (util/copy-to-clipboard! content)))))

(defn cut-selection-headings
  []
  (copy-selection-headings)
  (when-let [headings (seq (get-selected-headings-with-children))]
    (let [repo (dom/attr (first headings) "repo")
          ids (distinct (map #(uuid (dom/attr % "headingid")) headings))]
      (delete-headings! repo ids))))

(defn- get-nearest-page
  []
  (when-let [heading (state/get-edit-heading)]
    (when-let [id (:heading/uuid heading)]
      (when-let [edit-id (state/get-edit-input-id)]
        (when-let [input (gdom/getElement edit-id)]
          (when-let [pos (:pos (util/get-caret-pos input))]
            (let [value (gobj/get input "value")
                  page-pattern #"\[\[([^\]]+)]]"
                  block-pattern #"\(\(([^\)]+)\)\)"
                  page-matches (util/re-pos page-pattern value)
                  block-matches (util/re-pos block-pattern value)
                  matches (->> (concat page-matches block-matches)
                               (remove nil?))
                  [_ page] (first (sort-by
                                   (fn [[start-pos content]]
                                     (let [end-pos (+ start-pos (count content))]
                                       (cond
                                         (< pos start-pos)
                                         (- pos start-pos)

                                         (> pos end-pos)
                                         (- end-pos pos)

                                         :else
                                         0)))
                                   >
                                   matches))]
              (subs page 2 (- (count page) 2)))))))))

(defn follow-link-under-cursor!
  []
  (when-let [page (get-nearest-page)]
    (let [page-name (string/lower-case page)]
      (route-handler/redirect! {:to :page
                                :path-params {:name page-name}}))))

(defn open-link-in-sidebar!
  []
  (when-let [page (get-nearest-page)]
    (let [page-name (string/lower-case page)
          heading? (util/uuid-string? page-name)]
      (when-let [page (db/get-page page-name)]
        (if heading?
          (state/sidebar-add-block!
           (state/get-current-repo)
           (:db/id page)
           :heading
           page)
          (state/sidebar-add-block!
           (state/get-current-repo)
           (:db/id page)
           :page
           {:page page}))
        (ui-handler/show-right-sidebar)))))

(defn zoom-in! []
  (if-let [heading (state/get-edit-heading)]
    (when-let [id (:heading/uuid heading)]
      (route-handler/redirect! {:to :page
                                :path-params {:name (str id)}}))
    (js/window.history.forward)))

(defn cut-heading!
  [heading-id]
  (when-let [heading (db/pull [:heading/uuid heading-id])]
    (let [content (:heading/content heading)]
      (util/copy-to-clipboard! content)
      (delete-heading! heading false))))

(defonce select-start-heading-state (atom nil))

(defn clear-last-selected-heading!
  []
  (let [first-heading (state/pop-selection-heading!)]
    (dom/remove-class! first-heading "selected")
    (dom/remove-class! first-heading "noselect")))

(defn on-select-heading
  [state e up?]
  (when (and
         (gobj/get e "shiftKey")
         (or (state/in-selection-mode?)
             (when-let [input-id (state/get-edit-input-id)]
               (when-let [input (gdom/getElement input-id)]
                 (let [value (gobj/get input "value")
                       start (gobj/get input "selectionStart")
                       end (gobj/get input "selectionEnd")]
                   (or (and (= start 0) up?)
                       (and (= end (count value)) (not up?))))))))
    (state/clear-edit!)
    (let [{:keys [id heading-id heading heading-parent-id dummy? value pos format] :as heading-state} @select-start-heading-state
          element (gdom/getElement heading-parent-id)
          selected-headings (state/get-selection-headings)
          selected-headings-count (count selected-headings)
          first-heading (first selected-headings)
          selection-up? (state/selection-up?)]
      (when heading-id
        (util/stop e)
        (when-let [element (if-not (state/in-selection-mode?)
                             element
                             (let [f (if up? util/get-prev-heading util/get-next-heading)]
                               (f first-heading)))]
          (if (and (not (nil? selection-up?)) (not= up? selection-up?))
            (cond
              (>= selected-headings-count 2) ; back to the start heading
              (do
                (when (= 2 selected-headings-count) (state/set-selection-up? nil))
                (clear-last-selected-heading!))

              :else
              nil)
            (do
              (dom/add-class! element "selected noselect")
              (state/conj-selection-heading! element up?))))))))
