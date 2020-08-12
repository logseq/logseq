(ns frontend.handler.editor
  (:require [frontend.state :as state]
            [frontend.handler.route :as route-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.expand :as expand]
            [frontend.format :as format]
            [frontend.format.block :as block]
            [frontend.image :as image]
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
            [dommy.core :as d]
            [frontend.diff :as diff]
            [frontend.search :as search]
            [frontend.handler.image :as image-handler]
            [frontend.commands :as commands
             :refer [*show-commands
                     *matched-commands
                     *slash-caret-pos
                     *angle-bracket-caret-pos
                     *matched-block-commands
                     *show-block-commands]]
            [frontend.extensions.html-parser :as html-parser]
            [medley.core :as medley]))

;; TODO: refactor the state, it is already too complex.
(defonce *last-edit-heading (atom nil))

;; FIXME: should support multiple images concurrently uploading
(defonce *image-uploading? (atom false))
(defonce *image-uploading-process (atom 0))
(defonce *selected-text (atom nil))

(defn modified-time-tx
  [page file]
  (let [modified-at (tc/to-long (t/now))]
    [[:db/add (:db/id page) :page/last-modified-at modified-at]
     [:db/add (:db/id file) :file/last-modified-at modified-at]]))

(defn set-last-edit-heading!
  [id value]
  (reset! *last-edit-heading [id value]))

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

(defn rebuild-headings-meta
  [start-pos headings]
  (let [last-start-pos (atom start-pos)]
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
     headings)))

(defn rebuild-after-headings
  [repo file before-end-pos new-end-pos]
  (let [file-id (:db/id file)
        after-headings (db/get-file-after-headings-meta repo file-id before-end-pos)]
    (rebuild-headings-meta new-end-pos after-headings)))

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
  "Computes old references to be retracted."
  [eid {:heading/keys [ref-pages ref-headings]} old-ref-pages old-ref-headings]
  (let [ref-pages-id    (map #(:db/id (db/get-page (:page/name %))) ref-pages)
        retracted-pages (reduce (fn [done current]
                                  (if (some #(= (:db/id current) %) ref-pages-id)
                                    done
                                    (conj done (:db/id current))))
                                [] old-ref-pages)
        ref-headings-id    (map #(:db/id (db/get-page (str (last %)))) ref-headings)
        retracted-headings (reduce (fn [done current]
                                     (if (some #(= (:db/id current) %) ref-headings-id)
                                       done
                                       (conj done (:db/id current))))
                                   [] old-ref-headings)]
    ;; removes retracted pages and headings
    (into
     (mapv (fn [ref] [:db/retract eid :heading/ref-pages ref]) retracted-pages)
     (mapv (fn [ref] [:db/retract eid :heading/ref-headings ref]) retracted-headings))))

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

(defn insert-new-heading-aux!
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

(defn clear-when-saved!
  []
  (state/set-editor-show-input nil)
  (state/set-editor-show-date-picker false)
  (state/set-editor-show-page-search false)
  (state/set-editor-show-block-search false)
  (commands/restore-state true))

(defn get-state
  [state]
  (let [[{:keys [on-hide heading heading-id heading-parent-id dummy? format sidebar?]} id config] (:rum/args state)
        node (gdom/getElement id)
        value (gobj/get node "value")
        pos (gobj/get node "selectionStart")]
    {:config config
     :on-hide on-hide
     :dummy? dummy?
     :sidebar? sidebar?
     :format format
     :id id
     :heading heading
     :heading-id heading-id
     :heading-parent-id heading-parent-id
     :node node
     :value value
     :pos pos}))

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

(defn- insert-new-heading!
  [state]
  (let [{:keys [heading value format id]} (get-state state)
        heading-id (:heading/uuid heading)
        heading (or (db/pull [:heading/uuid heading-id])
                    heading)]
    (set-last-edit-heading! (:heading/uuid heading) value)
    ;; save the current heading and insert a new heading
    (insert-new-heading-aux!
     heading
     value
     true
     (fn [[_first-heading last-heading _new-heading-content]]
       (let [last-id (:heading/uuid last-heading)]
         (edit-heading! last-id 0 format id)
         (clear-when-saved!)))
     false)))

;; TODO: utf8 encode performance
(defn check
  [{:heading/keys [uuid marker content meta file dummy?] :as heading}]
  (let [new-content (string/replace-first content marker "DONE")]
    (save-heading-if-changed! heading new-content)))

(defn uncheck
  [{:heading/keys [uuid marker content meta file dummy?] :as heading}]
  (let [new-content (string/replace-first content "DONE"
                                          (if (= :now (state/get-preferred-workflow))
                                            "LATER"
                                            "TODO"))]
    (save-heading-if-changed! heading new-content)))

(defn cycle-todo!
  []
  (when-let [heading (state/get-edit-heading)]
    (let [edit-input-id (state/get-edit-input-id)
          content (state/get-edit-content)
          new-content (->
                       (cond
                         (string/starts-with? content "TODO")
                         (string/replace-first content "TODO" "DOING")
                         (string/starts-with? content "DOING")
                         (string/replace-first content "DOING" "DONE")
                         (string/starts-with? content "LATER")
                         (string/replace-first content "LATER" "NOW")
                         (string/starts-with? content "NOW")
                         (string/replace-first content "NOW" "DONE")
                         (string/starts-with? content "DONE")
                         (string/replace-first content "DONE" "")
                         :else
                         (str (if (= :now (state/get-preferred-workflow))
                                "LATER "
                                "TODO ") (string/triml content)))
                       (string/triml))]
      (state/set-edit-content! edit-input-id new-content))))

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

(defn delete-heading-aux!
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

(defn delete-heading!
  [state repo e]
  (let [{:keys [id heading-id heading-parent-id dummy? value pos format]} (get-state state)]
    (when heading-id
      (do
        (util/stop e)
        ;; delete heading, edit previous heading
        (let [heading (db/pull [:heading/uuid heading-id])
              heading-parent (gdom/getElement heading-parent-id)
              sibling-heading (util/get-prev-heading heading-parent)]
          (delete-heading-aux! heading dummy?)
          (when sibling-heading
            (when-let [sibling-heading-id (d/attr sibling-heading "headingid")]
              (when repo
                (when-let [heading (db/pull repo '[*] [:heading/uuid (uuid sibling-heading-id)])]
                  (let [original-content (util/trim-safe (:heading/content heading))
                        new-value (str original-content value)
                        pos (max
                             (if original-content
                               (utf8/length (utf8/encode (remove-level-spaces original-content format)))
                               0)
                             0)]
                    (save-heading-if-changed! heading new-value)
                    (edit-heading! (uuid sibling-heading-id)
                                   pos format id)))))))))))

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

(defn zoom-out! []
  (let [parent? (atom false)]
    (when-let [page (state/get-current-page)]
      (let [heading-id (and
                        (string? page)
                        (util/uuid-string? page)
                        (medley/uuid page))
            heading-parent (db/get-heading-parent (state/get-current-repo) heading-id)]
        (when-let [id (:heading/uuid heading-parent)]
          (route-handler/redirect! {:to :page
                                    :path-params {:name (str id)}})
          (reset! parent? true))))
    (when-not @parent?
      (route-handler/redirect-to-home!))))

(defn cut-heading!
  [heading-id]
  (when-let [heading (db/pull [:heading/uuid heading-id])]
    (let [content (:heading/content heading)]
      (util/copy-to-clipboard! content)
      (delete-heading-aux! heading false))))

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
         (not (gobj/get e "altKey"))
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

(defn save-heading!
  [{:keys [format heading id repo dummy?] :as state} value]
  (when (or (:db/id (db/entity repo [:heading/uuid (:heading/uuid heading)]))
            dummy?)
    (let [new-value (block/with-levels value format heading)]
      (let [cache [(:heading/uuid heading) value]]
        (when (not= @*last-edit-heading cache)
          (save-heading-if-changed! heading new-value)
          (reset! *last-edit-heading cache))))))

(defn- get-prev-heading-non-collapsed
  [heading]
  (when-let [headings (d/by-class "ls-heading")]
    (when-let [index (.indexOf headings heading)]
      (loop [idx (dec index)]
        (when (>= idx 0)
          (let [heading (nth headings idx)
                collapsed? (= "none" (d/style heading "display"))]
            (if collapsed?
              (recur (dec idx))
              heading)))))))

(defn- get-next-heading-non-collapsed
  [heading]
  (when-let [headings (d/by-class "ls-heading")]
    (when-let [index (.indexOf headings heading)]
      (loop [idx (inc index)]
        (when (>= (count headings) idx)
          (let [heading (nth headings idx)
                collapsed? (= "none" (d/style heading "display"))]
            (if collapsed?
              (recur (inc idx))
              heading)))))))

(defn on-up-down
  [state e up?]
  (let [{:keys [id heading-id heading heading-parent-id dummy? value pos format] :as heading-state} (get-state state)]
    (if (gobj/get e "shiftKey")
      (reset! select-start-heading-state heading-state)
      (let [element (gdom/getElement id)
            line-height (util/get-textarea-line-height element)]
        (when (and heading-id
                   (or (and up? (util/textarea-cursor-first-row? element line-height))
                       (and (not up?) (util/textarea-cursor-end-row? element line-height))))
          (util/stop e)
          (let [f (if up? get-prev-heading-non-collapsed get-next-heading-non-collapsed)
                sibling-heading (f (gdom/getElement heading-parent-id))]
            (when sibling-heading
              (when-let [sibling-heading-id (d/attr sibling-heading "headingid")]
                (let [state (get-state state)
                      content (:heading/content heading)
                      value (:value state)]
                  (when (not= (string/trim (remove-level-spaces content format))
                              (string/trim value))
                    (save-heading! state (:value state))))
                (edit-heading! (uuid sibling-heading-id) pos format id)))))))))

(defn insert-command!
  [id command-output format {:keys [restore?]
                             :or {restore? true}
                             :as option}]
  (cond
    ;; replace string
    (string? command-output)
    (commands/insert! id command-output option)

    ;; steps
    (vector? command-output)
    (commands/handle-steps command-output format)

    :else
    nil)

  (when restore?
    (let [restore-slash-caret-pos? (if (= :editor/click-hidden-file-input
                                          (ffirst command-output))
                                     false
                                     true)]
      (commands/restore-state restore-slash-caret-pos?))))

(defn upload-image
  [id files format uploading? drop?]
  (image/upload
   files
   (fn [file file-name file-type]
     (image-handler/request-presigned-url
      file file-name file-type
      uploading?
      (fn [signed-url]
        (insert-command! id
                         (util/format "[[%s][%s]]"
                                      signed-url
                                      file-name)
                         format
                         {:last-pattern (if drop? "" commands/slash)
                          :restore? false})

        (reset! *image-uploading-process 0))
      (fn [e]
        (let [process (* (/ (gobj/get e "loaded")
                            (gobj/get e "total"))
                         100)]
          (reset! *image-uploading-process process)))))))

(def autopair-map
  {"[" "]"
   "{" "}"
   "(" ")"
   "$" "$"                              ; math
   "`" "`"
   "~" "~"
   "*" "*"
   "_" "_"
   "^" "^"})

(def reversed-autopair-map
  (zipmap (vals autopair-map)
          (keys autopair-map)))

(defn autopair
  [input-id prefix format {:keys [restore?]
                           :or {restore? true}
                           :as option}]
  (let [value (get autopair-map prefix)
        selected (util/get-selected-text)
        postfix (str selected value)
        value (str prefix postfix)
        input (gdom/getElement input-id)]
    (when value
      (when-not (string/blank? selected) (reset! *selected-text selected))
      (let [[prefix pos] (commands/simple-replace! input-id value selected
                                                   {:backward-pos (count postfix)
                                                    :check-fn (fn [new-value prefix-pos]
                                                                (when (>= prefix-pos 0)
                                                                  [(subs new-value prefix-pos (+ prefix-pos 2))
                                                                   (+ prefix-pos 2)]))})]
        (case prefix
          "[["
          (do
            (commands/handle-step [:editor/search-page])
            (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

          "(("
          (do
            (commands/handle-step [:editor/search-block :reference])
            (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

          nil)))))

(defn surround-by?
  [input before after]
  (when input
    (let [value (gobj/get input "value")
          pos (:pos (util/get-caret-pos input))
          start-pos (- pos (count before))
          end-pos (+ pos (count after))]
      (when (>= (count value) end-pos)
        (= (str before after)
           (subs value start-pos end-pos))))))

(defn get-matched-pages
  [q]
  (let [pages (->> (db/get-pages (state/get-current-repo))
                   (remove (fn [p]
                             (= (string/lower-case p)
                                (:page/name (db/get-current-page))))))]
    (filter
     (fn [page]
       (string/index-of
        (string/lower-case page)
        (string/lower-case q)))
     pages)))

(defn get-matched-blocks
  [q]
  ;; remove current block
  (let [current-heading (state/get-edit-heading)]
    (remove
     (fn [h]
       (= (:heading/uuid current-heading)
          (:heading/uuid h)))
     (search/search q 21))))

(defn get-matched-commands
  [input]
  (try
    (let [edit-content (gobj/get input "value")
          pos (:pos (util/get-caret-pos input))
          last-slash-caret-pos (:pos @*slash-caret-pos)
          last-command (and last-slash-caret-pos (subs edit-content last-slash-caret-pos pos))]
      (when (> pos 0)
        (or
         (and (= \/ (util/nth-safe edit-content (dec pos)))
              (commands/commands-map))
         (and last-command
              (commands/get-matched-commands last-command)))))
    (catch js/Error e
      nil)))

(defn get-matched-block-commands
  [input]
  (try
    (let [edit-content (gobj/get input "value")
          pos (:pos (util/get-caret-pos input))
          last-command (subs edit-content
                             (:pos @*angle-bracket-caret-pos)
                             pos)]
      (when (> pos 0)
        (or
         (and (= \< (util/nth-safe edit-content (dec pos)))
              (commands/block-commands-map))
         (and last-command
              (commands/get-matched-commands
               last-command
               (commands/block-commands-map))))))
    (catch js/Error e
      nil)))

(defn in-auto-complete?
  [input]
  (or @*show-commands
      @*show-block-commands
      (state/get-editor-show-input)
      (state/get-editor-show-page-search)
      (state/get-editor-show-block-search)
      (state/get-editor-show-date-picker)))

(defn get-previous-input-char
  [input]
  (when-let [pos (:pos (util/get-caret-pos input))]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) pos)
                 (>= pos 1))
        (util/nth-safe value (- pos 1))))))

(defn get-previous-input-chars
  [input length]
  (when-let [pos (:pos (util/get-caret-pos input))]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) pos)
                 (>= pos 1))
        (subs value (- pos length) pos)))))

(defn get-current-input-char
  [input]
  (when-let [pos (:pos (util/get-caret-pos input))]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) (inc pos))
                 (>= pos 1))
        (util/nth-safe value pos)))))

(defn- get-previous-heading-level
  [current-id]
  (when-let [input (gdom/getElement current-id)]
    (when-let [prev-heading (util/get-prev-heading input)]
      (util/parse-int (d/attr prev-heading "level")))))

(defn adjust-heading-level!
  [state direction]
  (let [{:keys [heading heading-parent-id value]} (get-state state)
        format (:heading/format heading)
        heading-pattern (config/get-heading-pattern format)
        level (:heading/level heading)
        previous-level (or (get-previous-heading-level heading-parent-id) 1)
        [add? remove?] (case direction
                         :left [false true]
                         :right [true false]
                         [(<= level previous-level)
                          (and (> level previous-level)
                               (> level 2))])
        final-level (cond
                      add? (inc level)
                      remove? (if (> level 2)
                                (dec level)
                                level)
                      :else level)
        new-value (block/with-levels value format (assoc heading :heading/level final-level))]
    (when (<= (- final-level previous-level) 1)
      (set-last-edit-heading! (:heading/uuid heading) value)
      (save-heading-if-changed! heading new-value (= direction :left)))))

(defn append-paste-doc!
  [format event]
  (let [[html text] (util/get-clipboard-as-html event)]
    (when-not (string/starts-with? (string/trim text) "http")
      (let [doc-text (html-parser/parse format html)]
        (when-not (string/blank? doc-text)
          (util/stop event)
          (state/append-current-edit-content! doc-text))))))

(defn- heading-and-children-content
  [heading-children]
  (-> (map :heading/content heading-children)
      string/join))

(defn move-up-down
  [state e up?]
  (let [{:keys [id heading-id heading heading-parent-id dummy? value pos format] :as heading-state} (get-state state)
        heading (db/entity [:heading/uuid heading-id])
        meta (:heading/meta heading)
        page (:heading/page heading)
        heading-dom-node (gdom/getElement heading-parent-id)
        prev-heading (get-prev-heading-non-collapsed heading-dom-node)
        next-heading (get-next-heading-non-collapsed heading-dom-node)
        repo (state/get-current-repo)
        move-upwards-to-parent? (and up? prev-heading (< (d/attr prev-heading "level") (:heading/level heading)))
        move-down-to-higher-level? (and (not up?) next-heading (< (d/attr next-heading "level") (:heading/level heading)))]
    (when-let [sibling-heading (cond
                                 move-upwards-to-parent?
                                 prev-heading
                                 move-down-to-higher-level?
                                 next-heading
                                 :else
                                 (let [f (if up? util/get-prev-heading-with-same-level util/get-next-heading-with-same-level)]
                                   (f heading-dom-node)))]
      (when-let [sibling-heading-id (d/attr sibling-heading "headingid")]
        (when-let [sibling-heading (db/pull-heading (medley/uuid sibling-heading-id))]
          (let [sibling-meta (:heading/meta sibling-heading)
                hc1 (db/get-heading-and-children repo (:heading/uuid heading) false)
                hc2 (if (or move-upwards-to-parent? move-down-to-higher-level?)
                      [sibling-heading]
                      (db/get-heading-and-children repo (:heading/uuid sibling-heading) false))]
            ;; Same page and next to the other
            (when (and
                   (= (:db/id (:heading/page heading))
                      (:db/id (:heading/page sibling-heading)))
                   (or
                    (and up? (= (:end-pos (:heading/meta (last hc2))) (:pos (:heading/meta (first hc1)))))
                    (and (not up?) (= (:end-pos (:heading/meta (last hc1))) (:pos (:heading/meta (first hc2)))))))
              (let [hc1-content (heading-and-children-content hc1)
                    hc2-content (heading-and-children-content hc2)
                    file (db/get-heading-file (:heading/uuid heading))
                    file-path (:file/path file)
                    old-file-content (db/get-file file-path)
                    [start-pos end-pos new-content headings] (if up?
                                                               [(:pos sibling-meta)
                                                                (get-in (last hc1) [:heading/meta :end-pos])
                                                                (str hc1-content hc2-content)
                                                                (concat hc1 hc2)]
                                                               [(:pos meta)
                                                                (get-in (last hc2) [:heading/meta :end-pos])
                                                                (str hc2-content hc1-content)
                                                                (concat hc2 hc1)])]
                (when (and start-pos end-pos)
                  (let [new-file-content (utf8/insert! old-file-content start-pos end-pos new-content)
                        modified-time (modified-time-tx page file)
                        headings-meta (rebuild-headings-meta start-pos headings)]
                    (profile
                     (str "Move heading " (if up? "up: " "down: "))
                     (repo-handler/transact-react-and-alter-file!
                      repo
                      (concat
                       headings-meta
                       modified-time)
                      {:key :heading/change
                       :data (map (fn [heading] (assoc heading :heading/page page)) headings)}
                      [[file-path new-file-content]]))))))))))))

(defn expand!
  []
  (when-let [current-heading (state/get-edit-heading)]
    (expand/expand! current-heading)
    (state/set-collapsed-state! (:heading/uuid current-heading)
                                false)))

(defn collapse!
  []
  (when-let [current-heading (state/get-edit-heading)]
    (expand/collapse! current-heading)
    (state/set-collapsed-state! (:heading/uuid current-heading)
                                true)))
