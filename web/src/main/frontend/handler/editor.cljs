(ns frontend.handler.editor
  (:require [frontend.state :as state]
            [frontend.handler.route :as route-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.draw :as draw]
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
            [medley.core :as medley]
            [frontend.text :as text]
            [frontend.date :as date]
            [clojure.core.async :as async]))

;; TODO: refactor the state, it is already too complex.
(defonce *last-edit-block (atom nil))

;; FIXME: should support multiple images concurrently uploading
(defonce *image-uploading? (atom false))
(defonce *image-uploading-process (atom 0))
(defonce *selected-text (atom nil))

(defn modified-time-tx
  [page file]
  (let [modified-at (tc/to-long (t/now))]
    [[:db/add (:db/id page) :page/last-modified-at modified-at]
     [:db/add (:db/id file) :file/last-modified-at modified-at]]))

(defn set-last-edit-block!
  [id value]
  (reset! *last-edit-block [id value]))

(defn- get-selection-and-format
  []
  (when-let [block (state/get-edit-block)]
    (when-let [id (:block/uuid block)]
      (when-let [edit-id (state/get-edit-input-id)]
        (when-let [input (gdom/getElement edit-id)]
          {:selection-start (gobj/get input "selectionStart")
           :selection-end (gobj/get input "selectionEnd")
           :format (:block/format block)
           :value (gobj/get input "value")
           :block block
           :edit-id edit-id
           :input input})))))

(defn- format-text!
  [pattern-fn]
  (when-let [m (get-selection-and-format)]
    (let [{:keys [selection-start selection-end format value block edit-id input]} m
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
    (let [{:keys [selection-start selection-end format value block edit-id input]} m
          empty-selection? (= selection-start selection-end)
          selection (subs value selection-start selection-end)
          selection-link? (and selection (or (util/starts-with? selection "http://")
                                             (util/starts-with? selection "https://")))
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

(defn copy-block-ref!
  [block-id]
  (util/copy-to-clipboard! (str block-id)))

(defn focus-on-block!
  [block-id]
  (when block-id
    (route-handler/redirect! {:to :page
                              :path-params {:name (str block-id)}})))

(defn open-block-in-sidebar!
  [block-id]
  (when block-id
    (when-let [block (db/pull [:block/uuid block-id])]
      (state/sidebar-add-block!
       (state/get-current-repo)
       (:db/id block)
       :block
       block))))

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

(defn block-content-join-newlines
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
  [{:block/keys [content meta dummy?] :as block} file-content value]
  (let [utf8-content (utf8/encode file-content)
        prefix (utf8/substring utf8-content 0 (:start-pos meta))
        postfix (let [end-pos (if dummy?
                                (:start-pos meta)
                                (:end-pos meta))]
                  (utf8/substring utf8-content end-pos))
        value (block-content-join-newlines prefix value postfix)]
    [(str prefix value postfix)
     value]))

(defn get-block-new-value
  [{:block/keys [content meta dummy?] :as block} file-content value]
  (let [utf8-content (utf8/encode file-content)
        prefix (utf8/substring utf8-content 0 (:start-pos meta))
        postfix (let [end-pos (if dummy?
                                (:start-pos meta)
                                (:end-pos meta))]
                  (utf8/substring utf8-content end-pos))]
    (block-content-join-newlines prefix value postfix)))

(defn new-file-content-indent-outdent
  [{:block/keys [content meta dummy?] :as block} file-content value block-with-children-content last-child-end-pos indent-left?]
  (let [utf8-content (utf8/encode file-content)
        prefix (utf8/substring utf8-content 0 (:start-pos meta))
        last-child-end-pos (if (some? indent-left?) last-child-end-pos nil)
        end-pos (or
                 last-child-end-pos
                 (if dummy?
                   (:start-pos meta)
                   (:end-pos meta)))
        postfix (utf8/substring utf8-content end-pos)
        block-children-value (block-content-join-newlines prefix block-with-children-content postfix)]
    (str prefix block-children-value postfix)))

(defn- with-block-meta
  [repo block]
  (if (:block/dummy? block)
    (if-let [page-id (:db/id (:block/page block))]
      (let [page-name (:page/name (db/entity repo page-id))
            end-pos (db/get-block-page-end-pos repo page-name)]
        (assoc block :block/meta {:start-pos end-pos
                                  :end-pos end-pos}))
      block)
    (if-let [meta (:block/meta (db/entity repo [:block/uuid (:block/uuid block)]))]
      (assoc block :block/meta meta)
      block)))

(defn highlight-block!
  [block-uuid]
  (let [blocks (array-seq (js/document.getElementsByClassName (str block-uuid)))]
    (doseq [block blocks]
      (dom/add-class! block "block-highlight"))))

(defn unhighlight-block!
  []
  (let [blocks (some->> (array-seq (js/document.getElementsByClassName "block-highlight"))
                        (repeat 2)
                        (apply concat))]
    (doseq [block blocks]
      (gdom-classes/remove block "block-highlight"))))

(defn rebuild-blocks-meta
  [start-pos blocks]
  (let [last-start-pos (atom start-pos)]
    (mapv
     (fn [{:block/keys [uuid meta] :as block}]
       (let [old-start-pos (:start-pos meta)
             old-end-pos (:end-pos meta)
             new-end-pos (if old-end-pos
                           (+ @last-start-pos (- old-end-pos old-start-pos)))
             new-meta {:start-pos @last-start-pos
                       :end-pos new-end-pos}]
         (reset! last-start-pos new-end-pos)
         {:block/uuid uuid
          :block/meta new-meta}))
     blocks)))

(defn rebuild-after-blocks
  [repo file before-end-pos new-end-pos]
  (let [file-id (:db/id file)
        after-blocks (db/get-file-after-blocks-meta repo file-id before-end-pos)]
    (rebuild-blocks-meta new-end-pos after-blocks)))

(defn rebuild-after-blocks-indent-outdent
  [repo file block before-end-pos new-end-pos indent-left?]
  (let [file-id (:db/id file)
        after-blocks (db/get-file-after-blocks-meta repo file-id before-end-pos true)
        last-start-pos (atom new-end-pos)
        block-level (:block/level block)
        next-leq-level? (atom false)
        format (:block/format block)
        block-and-children-content (atom (:block/content block))
        last-child-end-pos (atom before-end-pos)
        after-blocks (mapv
                      (fn [{:block/keys [uuid meta level content] :as block}]
                        (let [old-start-pos (:start-pos meta)
                              old-end-pos (:end-pos meta)
                              ]
                          (when (<= level block-level)
                            (reset! next-leq-level? true))

                          (let [[new-content offset] (cond
                                                       (and (not @next-leq-level?) (true? indent-left?))
                                                       [(subs content 1) -1]
                                                       (and (not @next-leq-level?) (false? indent-left?))
                                                       [(str (config/get-block-pattern format) content) 1]
                                                       :else
                                                       [nil 0])
                                new-end-pos (if old-end-pos
                                              (+ @last-start-pos
                                                 (- old-end-pos old-start-pos)
                                                 offset))
                                new-meta {:start-pos @last-start-pos
                                          :end-pos new-end-pos}]
                            (reset! last-start-pos new-end-pos)
                            (when-not @next-leq-level?
                              (do
                                (reset! block-and-children-content (str @block-and-children-content new-content))
                                (reset! last-child-end-pos old-end-pos)))

                            (cond->
                              {:block/uuid uuid
                               :block/meta new-meta}
                              (and (some? indent-left?) (not @next-leq-level?))
                              (assoc :block/level (if indent-left? (dec level) (inc level)))
                              (and new-content (not @next-leq-level?))
                              (assoc :block/content new-content)))))
                      after-blocks)]
    [after-blocks @block-and-children-content @last-child-end-pos]))

(defn compute-retract-refs
  "Computes old references to be retracted."
  [eid {:block/keys [ref-pages ref-blocks]} old-ref-pages old-ref-blocks]
  (let [ref-pages-id    (map #(:db/id (db/get-page (:page/name %))) ref-pages)
        retracted-pages (reduce (fn [done current]
                                  (if (some #(= (:db/id current) %) ref-pages-id)
                                    done
                                    (conj done (:db/id current))))
                                [] old-ref-pages)
        ref-blocks-id    (map #(:db/id (db/get-page (str (last %)))) ref-blocks)
        retracted-blocks (reduce (fn [done current]
                                   (if (some #(= (:db/id current) %) ref-blocks-id)
                                     done
                                     (conj done (:db/id current))))
                                 [] old-ref-blocks)]
    ;; removes retracted pages and blocks
    (into
     (mapv (fn [ref] [:db/retract eid :block/ref-pages ref]) retracted-pages)
     (mapv (fn [ref] [:db/retract eid :block/ref-blocks ref]) retracted-blocks))))

(defn save-block-if-changed!
  ([block value]
   (save-block-if-changed! block value nil))
  ([{:block/keys [uuid content meta file page dummy? format repo pre-block? content ref-pages ref-blocks] :as block} value indent-left?]
   (let [repo (or repo (state/get-current-repo))
         e (db/entity repo [:block/uuid uuid])
         block (with-block-meta repo block)
         format (or format (state/get-preferred-format))
         page (db/entity repo (:db/id page))
         [old-directives new-directives] (when pre-block?
                                           [(:page/directives (db/entity (:db/id page)))
                                            (db/parse-directives value format)])
         page-tags (when-let [tags (:tags new-directives)]
                     (util/->tags tags))
         page-alias (when-let [alias (:alias new-directives)]
                      (map
                        (fn [alias]
                          {:page/name (string/lower-case alias)})
                        (remove #{(:page/name page)} alias)))
         permalink-changed? (when (and pre-block? (:permalink old-directives))
                              (not= (:permalink old-directives)
                                    (:permalink new-directives)))
         value (if permalink-changed?
                 (db/add-directives! format value {:old_permalink (:permalink old-directives)})
                 value)
         new-directives (if permalink-changed?
                          (assoc new-directives :old_permalink (:permalink old-directives))
                          new-directives)]
     (when (not= (string/trim content) (string/trim value)) ; block content changed
       (let [file (db/entity repo (:db/id file))]
         (cond
           ;; Page was referenced but no related file
           ;; TODO: replace with handler.page/create!
           (and page (not file))
           (let [format (name format)
                 title (string/capitalize (:page/name page))
                 journal-page? (date/valid-journal-title? title)
                 path (str
                       (if journal-page?
                         config/default-journals-directory
                         config/default-pages-directory)
                       "/"
                       (if journal-page?
                         (date/journal-title->default title)
                         (-> (:page/name page)
                             (string/replace #"\s+" "_")
                             (string/replace "." "_"))) "."
                       (if (= format "markdown") "md" format))
                 file-path (str "/" path)
                 dir (util/get-repo-dir repo)]
             (p/let [exists? (fs/file-exists? dir file-path)]
               (if exists?
                 (notification/show!
                  [:p.content
                   (util/format "File %s already exists!" file-path)]
                  :error)
                 ;; create the file
                 (let [content (util/default-content-with-title format (:page/original-name page))]
                   (p/let [_ (fs/create-if-not-exists dir file-path content)]
                     (db/reset-file! repo path (str content
                                                    (text/remove-level-spaces value (keyword format))))
                     (git-handler/git-add repo path)
                     (ui-handler/re-render-root!))))))

           (and file page)
           (let [file (db/entity repo (:db/id file))
                 file-path (:file/path file)
                 format (format/get-format file-path)
                 file-content (db/get-file repo file-path)
                 value (get-block-new-value block file-content value)
                 block (assoc block :block/content value)
                 {:keys [blocks pages start-pos end-pos]} (if pre-block?
                                                            (let [new-end-pos (utf8/length (utf8/encode value))]
                                                              {:blocks [(assoc-in block [:block/meta :end-pos] new-end-pos)]
                                                               :pages []
                                                               :start-pos 0
                                                               :end-pos new-end-pos})
                                                            (block/parse-block block format))
                 [after-blocks block-children-content new-end-pos] (rebuild-after-blocks-indent-outdent repo file block (:end-pos (:block/meta block)) end-pos indent-left?)
                 new-content (new-file-content-indent-outdent block file-content value block-children-content new-end-pos indent-left?)
                 ;; _ (prn {:block-children-content block-children-content
                 ;;         :new-end-pos new-end-pos
                 ;;         :new-content new-content})
                 retract-refs (compute-retract-refs (:db/id e) (first blocks) ref-pages ref-blocks)
                 blocks (db/recompute-block-children repo block blocks)
                 page-id (:db/id page)
                 modified-time (let [modified-at (tc/to-long (t/now))]
                                 [[:db/add page-id :page/last-modified-at modified-at]
                                  [:db/add (:db/id file) :file/last-modified-at modified-at]])
                 page-directives (when pre-block?
                                   (if (seq new-directives)
                                     [[:db/retract page-id :page/directives]
                                      {:db/id page-id
                                       :page/directives new-directives}]
                                     [[:db/retract page-id :page/directives]]))
                 pages (if (seq page-tags)
                         (let [tag-pages (map
                                           (fn [page]
                                             {:page/original-name page
                                              :page/name page})
                                           (map :tag/name page-tags))]
                           (concat pages tag-pages))
                         pages)
                 page-tags (when (and pre-block? (seq page-tags))
                             (if (seq page-tags)
                               [[:db/retract page-id :page/tags]
                                {:db/id page-id
                                 :page/tags page-tags}]
                               [[:db/retract page-id :page/tags]]))
                 page-alias (when (and pre-block? (seq page-alias))
                              (if (seq page-alias)
                                [[:db/retract page-id :page/alias]
                                 {:db/id page-id
                                  :page/alias page-alias}]
                                [[:db/retract page-id :page/alias]]))]
             (profile
              "Save block: "
              (repo-handler/transact-react-and-alter-file!
               repo
               (concat
                pages
                blocks
                retract-refs
                page-directives
                page-tags
                page-alias
                after-blocks
                modified-time)
               {:key :block/change
                :data (map (fn [block] (assoc block :block/page page)) blocks)}
               [[file-path new-content]]))
             (when (or (seq retract-refs) pre-block?)
               (ui-handler/re-render-root!)))

           :else
           nil))))))

(defn insert-new-block-aux!
  ([block value create-new-block? ok-handler with-level?]
   (insert-new-block-aux! (state/get-current-page) block value create-new-block? ok-handler with-level? nil))
  ([block value create-new-block? ok-handler with-level? new-level]
   (insert-new-block-aux! (state/get-current-page) block value create-new-block? ok-handler with-level? new-level))
  ([current-page {:block/keys [ uuid content meta file dummy? level repo page format collapsed?] :as block} value create-new-block? ok-handler with-level? new-level]
   (let [block-page? (and current-page (util/uuid-string? current-page))
         block-self? (= uuid (and block-page? (medley/uuid current-page)))
         input (gdom/getElement (state/get-edit-input-id))
         pos (if new-level
               (dec (count value))
               (util/get-input-pos input))
         repo (or repo (state/get-current-repo))
         ;; block-has-children? (seq children) ; not working for now
         block-has-children? (db/block-has-children? repo block)
         v1 (subs value 0 pos)
         v2 (string/triml (subs value pos))
         v1 (string/trim (if with-level? v1 (block/with-levels v1 format block)))
         v2-level (cond
                    new-level
                    new-level
                    (or block-self? block-has-children?)
                    (inc level)
                    :else
                    level)
         v2 (str (config/default-empty-block format v2-level) " " v2)
         block (with-block-meta repo block)
         format (:block/format block)
         page (db/entity repo (:db/id page))
         file (db/entity repo (:db/id file))
         insert-block (fn [block file-path file-content]
                        (let [value (if create-new-block?
                                      (str v1 "\n" v2)
                                      value)
                              [new-content value] (new-file-content block file-content value)
                              {:keys [blocks pages start-pos end-pos]} (block/parse-block (assoc block :block/content value) format)
                              blocks (db/recompute-block-children repo block blocks)
                              after-blocks (rebuild-after-blocks repo file (:end-pos meta) end-pos)
                              blocks-atom (db/get-page-blocks-cache-atom repo (:db/id page))
                              [before-part after-part] (split-with #(not= (:block/uuid (first blocks)) (:block/uuid %)) @blocks-atom)
                              after-part (rest after-part)]
                          ;; Replace with batch transactions
                          (state/add-tx!
                           (fn []
                             (repo-handler/transact-react-and-alter-file!
                              repo
                              (concat
                               pages
                               blocks
                               after-blocks)
                              {:key :block/change
                               :data (map (fn [block] (assoc block :block/page page)) blocks)}
                              [[file-path new-content]])))

                          (let [blocks (remove (fn [block]
                                                 (nil? (:block/content block))) blocks)]
                            (reset! blocks-atom (->> (concat before-part blocks after-part)
                                                     (remove nil?)))
                            (when ok-handler
                              (let [first-block (first blocks)
                                    last-block (last blocks)]
                                (ok-handler [first-block last-block v2]))))))]
     (cond
       (and (not file) page)
       ;; TODO: replace with handler.page/create!
       (let [format (name format)
             title (string/capitalize (:page/name page))
             journal-page? (date/valid-journal-title? title)
             path (str
                   (if journal-page?
                     config/default-journals-directory
                     config/default-pages-directory)
                   "/"
                   (if journal-page?
                     (date/journal-title->default title)
                     (-> (:page/name page)
                         (string/replace #"\s+" "_")
                         (string/replace "." "_")))
                   "."
                   (if (= format "markdown") "md" format))
             file-path (str "/" path)
             dir (util/get-repo-dir repo)]
         (p/let [exists? (fs/file-exists? dir file-path)]
           (if exists?
             (notification/show!
              [:p.content
               (util/format "File %s already exists!"
                            file-path)]
              :error)
             ;; create the file
             (let [content (util/default-content-with-title format (:page/original-name page))]
               (p/let [_ (fs/create-if-not-exists dir file-path content)]
                 (db/reset-file! repo path
                                 (str content
                                      (text/remove-level-spaces value (keyword format))
                                      "\n"
                                      v2))
                 (git-handler/git-add repo path)
                 (ui-handler/re-render-root!))))))

       file
       (let [file-path (:file/path file)
             file-content (db/get-file repo file-path)]
         (insert-block block file-path file-content))

       :else
       nil))))

(defn clear-when-saved!
  []
  (state/set-editor-show-input nil)
  (state/set-editor-show-date-picker false)
  (state/set-editor-show-page-search false)
  (state/set-editor-show-block-search false)
  (commands/restore-state true))

(defn get-state
  [state]
  (let [[{:keys [on-hide block block-id block-parent-id dummy? format sidebar?]} id config] (:rum/args state)
        node (gdom/getElement id)
        value (gobj/get node "value")
        pos (gobj/get node "selectionStart")]
    {:config config
     :on-hide on-hide
     :dummy? dummy?
     :sidebar? sidebar?
     :format format
     :id id
     :block block
     :block-id block-id
     :block-parent-id block-parent-id
     :node node
     :value value
     :pos pos}))

(defn edit-block!
  [block prev-pos format id]
  (when-let [block-id (:block/uuid block)]
    (let [edit-input-id (str (subs id 0 (- (count id) 36)) block-id)
          block (or
                 block
                 (db/pull [:block/uuid block-id])
                 ;; dummy?
                 {:block/uuid block-id
                  :block/content ""})
          {:block/keys [content]} block
          content (string/trim (text/remove-level-spaces content format))
          content-length (count content)
          text-range (if (or (= :max prev-pos) (<= content-length prev-pos))
                       content
                       (subs content 0 prev-pos))]
      (state/set-editing! edit-input-id content block text-range))))

(defn- insert-new-block!
  [state]
  (let [{:keys [block value format id]} (get-state state)
        block-id (:block/uuid block)
        block (or (db/pull [:block/uuid block-id])
                  block)
        collapsed? (:block/collapsed? block)
        repo (or (:block/repo block) (state/get-current-repo))
        last-child (and collapsed?
                        (last (db/get-block-and-children repo (:block/uuid block))))
        last-child (when (not= (:block/uuid last-child)
                               (:block/uuid block))
                     last-child)]
    (set-last-edit-block! (:block/uuid block) value)
    ;; save the current block and insert a new block
    (insert-new-block-aux!
     (or last-child block)
     (if last-child (:block/content last-child) value)
     true
     (fn [[_first-block last-block _new-block-content]]
       (let [last-id (:block/uuid last-block)]
         (edit-block! last-block 0 format id)
         (clear-when-saved!)))
     (if last-child true false)
     (and last-child
          (:block/level block)))))

;; TODO: utf8 encode performance
(defn check
  [{:block/keys [uuid marker content meta file dummy?] :as block}]
  (let [new-content (string/replace-first content marker "DONE")]
    (save-block-if-changed! block new-content)))

(defn uncheck
  [{:block/keys [uuid marker content meta file dummy?] :as block}]
  (let [new-content (string/replace-first content "DONE"
                                          (if (= :now (state/get-preferred-workflow))
                                            "LATER"
                                            "TODO"))]
    (save-block-if-changed! block new-content)))

(defn cycle-todo!
  []
  (when-let [block (state/get-edit-block)]
    (let [edit-input-id (state/get-edit-input-id)
          content (state/get-edit-content)
          new-content (->
                       (cond
                         (util/starts-with? content "TODO")
                         (string/replace-first content "TODO" "DOING")
                         (util/starts-with? content "DOING")
                         (string/replace-first content "DOING" "DONE")
                         (util/starts-with? content "LATER")
                         (string/replace-first content "LATER" "NOW")
                         (util/starts-with? content "NOW")
                         (string/replace-first content "NOW" "DONE")
                         (util/starts-with? content "DONE")
                         (string/replace-first content "DONE" "")
                         :else
                         (str (if (= :now (state/get-preferred-workflow))
                                "LATER "
                                "TODO ") (string/triml content)))
                       (string/triml))]
      (state/set-edit-content! edit-input-id new-content))))

(defn set-marker
  [{:block/keys [uuid marker content meta file dummy?] :as block} new-marker]
  (let [new-content (string/replace-first content marker new-marker)]
    (save-block-if-changed! block new-content)))

(defn set-priority
  [{:block/keys [uuid marker priority content meta file dummy?] :as block} new-priority]
  (let [new-content (string/replace-first content
                                          (util/format "[#%s]" priority)
                                          (util/format "[#%s]" new-priority))]
    (save-block-if-changed! block new-content)))

(defn- get-prev-block-non-collapsed
  [block]
  (let [id (gobj/get block "id")
        prefix (re-find #"ls-block-[\d]+" id)]
    (when-let [blocks (d/by-class "ls-block")]
      (when-let [index (.indexOf blocks block)]
        (loop [idx (dec index)]
          (when (>= idx 0)
            (let [block (nth blocks idx)
                  collapsed? (= "none" (d/style block "display"))
                  prefix-match? (util/starts-with? (gobj/get block "id") prefix)]
              (if (or collapsed?
                      ;; might be embed blocks
                      (not prefix-match?))
                (recur (dec idx))
                block))))))))

(defn- get-next-block-non-collapsed
  [block]
  (let [id (gobj/get block "id")
        prefix (re-find #"ls-block-[\d]+" id)]
    (when-let [blocks (d/by-class "ls-block")]
      (when-let [index (.indexOf blocks block)]
        (loop [idx (inc index)]
          (when (>= (count blocks) idx)
            (when-let [block (util/nth-safe blocks idx)]
              (let [collapsed? (= "none" (d/style block "display"))
                    prefix-match? (util/starts-with? (gobj/get block "id") prefix)]
                (if (or collapsed?
                        ;; might be embed blocks
                        (not prefix-match?))
                  (recur (inc idx))
                  block)))))))))

(defn delete-block-aux!
  [{:block/keys [uuid meta content file repo ref-pages ref-blocks] :as block} dummy?]
  (when-not dummy?
    (let [repo (or repo (state/get-current-repo))
          block (db/pull repo '[*] [:block/uuid uuid])]
      (when block
        (let [file-path (:file/path (db/entity repo (:db/id file)))
              file-content (db/get-file repo file-path)
              after-blocks (rebuild-after-blocks repo file (:end-pos meta) (:start-pos meta))
              new-content (utf8/delete! file-content (:start-pos meta) (:end-pos meta))]
          (repo-handler/transact-react-and-alter-file!
           repo
           (concat
            [[:db.fn/retractEntity [:block/uuid uuid]]]
            after-blocks)
           {:key :block/change
            :data [block]}
           [[file-path new-content]])
          (when (or (seq ref-pages) (seq ref-blocks))
            (ui-handler/re-render-root!)))))))

(defn delete-block!
  [state repo e]
  (let [{:keys [id block-id block-parent-id dummy? value pos format]} (get-state state)]
    (when block-id
      (when-let [page-id (:db/id (:block/page (db/entity [:block/uuid block-id])))]
        (let [page-blocks-count (db/get-page-blocks-count repo page-id)]
          (when (> page-blocks-count 2)
            (util/stop e)
            ;; delete block, edit previous block
            (let [block (db/pull [:block/uuid block-id])
                  block-parent (gdom/getElement block-parent-id)
                  sibling-block (get-prev-block-non-collapsed block-parent)]
              (delete-block-aux! block dummy?)
              (when sibling-block
                (when-let [sibling-block-id (d/attr sibling-block "blockid")]
                  (when repo
                    (when-let [block (db/pull repo '[*] [:block/uuid (uuid sibling-block-id)])]
                      (let [original-content (util/trim-safe (:block/content block))
                            new-value (str original-content value)
                            pos (max
                                 (if original-content
                                   (utf8/length (utf8/encode (text/remove-level-spaces original-content format)))
                                   0)
                                 0)]
                        (save-block-if-changed! block new-value)
                        (let [block (db/pull (state/get-current-repo) '[*] [:block/uuid (uuid sibling-block-id)])]
                          (edit-block! block pos format id))))))))))))))

(defn delete-blocks!
  [repo block-uuids]
  (when (seq block-uuids)
    (let [blocks (db/pull-many repo '[*] (mapv (fn [id]
                                                 [:block/uuid id])
                                               block-uuids))
          first-block (first blocks)
          last-block (last blocks)
          file (db/entity repo (:db/id (:block/file first-block)))
          file-path (:file/path file)
          file-content (db/get-file repo file-path)
          start-pos (:start-pos (:block/meta first-block))
          end-pos (:end-pos (:block/meta last-block))
          after-blocks (rebuild-after-blocks repo file end-pos start-pos)
          new-content (utf8/delete! file-content start-pos end-pos)
          tx-data (concat
                   (mapv
                    (fn [uuid]
                      [:db.fn/retractEntity [:block/uuid uuid]])
                    block-uuids)
                   after-blocks
                   [{:file/path file-path}])]
      (repo-handler/transact-react-and-alter-file!
       repo
       tx-data
       {:key :block/change
        :data blocks}
       [[file-path new-content]])
      (ui-handler/re-render-root!))))

(defn set-block-property!
  [block-id key value]
  (let [block-id (if (string? block-id) (uuid block-id) block-id)
        key (string/upper-case (name key))
        value (name value)]
    (when-let [block (db/pull [:block/uuid block-id])]
      (let [{:block/keys [file page content properties properties-meta meta]} block
            {:keys [start-pos end-pos]} properties-meta
            start-pos (- start-pos (:start-pos meta))]
        (cond
          (and (get properties key)
               (= (string/trim (get properties key)) value))
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
                (save-block-if-changed! block new-content))))

          :else
          (let [properties (util/format
                            "\n   :PROPERTIES:\n   :%s: %s\n   :END:\n"
                            key value)
                [block-line & others] (string/split-lines content)
                new-content (str block-line properties
                                 (string/join "\n" others))]
            (save-block-if-changed! block new-content)))))))

(defn clear-selection!
  [_e]
  (when (state/in-selection-mode?)
    (doseq [block (state/get-selection-blocks)]
      (dom/remove-class! block "selected")
      (dom/remove-class! block "noselect"))
    (state/clear-selection!))
  ;; (when e
  ;;   (when-not (util/input? (gobj/get e "target"))
  ;;     (util/clear-selection!)))
  )

(defn clear-selection-blocks!
  []
  (when (state/in-selection-mode?)
    (doseq [block (state/get-selection-blocks)]
      (dom/remove-class! block "selected")
      (dom/remove-class! block "noselect"))
    (state/clear-selection-blocks!)))

(defn select-all-blocks!
  []
  (when-let [current-input-id (state/get-edit-input-id)]
    (let [input (gdom/getElement current-input-id)
          blocks-container (util/rec-get-blocks-container input)
          blocks (dom/by-class blocks-container "ls-block")]
      (doseq [block blocks]
        (dom/add-class! block "selected noselect"))
      (state/set-selection-blocks! blocks))))

(defn- get-selected-blocks-with-children
  []
  (when-let [blocks (seq (get @state/state :selection/blocks))]
    (mapcat (fn [block]
              (cons block
                    (array-seq (dom/by-class block "ls-block"))))
            blocks)))

(defn copy-selection-blocks
  []
  (when-let [blocks (seq (get-selected-blocks-with-children))]
    (let [repo (dom/attr (first blocks) "repo")
          ids (distinct (map #(uuid (dom/attr % "blockid")) blocks))
          up? (state/selection-up?)
          content (some->> (db/get-blocks-contents repo ids)
                           (map :block/content))
          content (if (false? up?) (reverse content) content)
          content (string/join "" content)]
      (when-not (string/blank? content)
        (util/copy-to-clipboard! content)))))

(defn cut-selection-blocks
  []
  (copy-selection-blocks)
  (when-let [blocks (seq (get-selected-blocks-with-children))]
    (let [repo (dom/attr (first blocks) "repo")
          ids (distinct (map #(uuid (dom/attr % "blockid")) blocks))]
      (delete-blocks! repo ids))))

(defn- get-nearest-page
  []
  (when-let [block (state/get-edit-block)]
    (when-let [id (:block/uuid block)]
      (when-let [edit-id (state/get-edit-input-id)]
        (when-let [input (gdom/getElement edit-id)]
          (when-let [pos (util/get-input-pos input)]
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
      (.blur js/document.activeElement)
      (route-handler/redirect! {:to :page
                                :path-params {:name page-name}}))))

(defn open-link-in-sidebar!
  []
  (when-let [page (get-nearest-page)]
    (let [page-name (string/lower-case page)
          block? (util/uuid-string? page-name)]
      (when-let [page (db/get-page page-name)]
        (if block?
          (state/sidebar-add-block!
           (state/get-current-repo)
           (:db/id page)
           :block
           page)
          (state/sidebar-add-block!
           (state/get-current-repo)
           (:db/id page)
           :page
           {:page page}))))))

(defn zoom-in! []
  (if-let [block (state/get-edit-block)]
    (when-let [id (:block/uuid block)]
      (route-handler/redirect! {:to :page
                                :path-params {:name (str id)}}))
    (js/window.history.forward)))

(defn zoom-out! []
  (let [parent? (atom false)]
    (when-let [page (state/get-current-page)]
      (let [block-id (and
                      (string? page)
                      (util/uuid-string? page)
                      (medley/uuid page))
            block-parent (db/get-block-parent (state/get-current-repo) block-id)]
        (when-let [id (:block/uuid block-parent)]
          (route-handler/redirect! {:to :page
                                    :path-params {:name (str id)}})
          (reset! parent? true))))
    (when-not @parent?
      (route-handler/redirect-to-home!))))

(defn cut-block!
  [block-id]
  (when-let [block (db/pull [:block/uuid block-id])]
    (let [content (:block/content block)]
      (util/copy-to-clipboard! content)
      (delete-block-aux! block false))))

(defonce select-start-block-state (atom nil))

(defn clear-last-selected-block!
  []
  (let [first-block (state/pop-selection-block!)]
    (dom/remove-class! first-block "selected")
    (dom/remove-class! first-block "noselect")))

(defn input-start-or-end?
  ([input]
   (input-start-or-end? input nil))
  ([input up?]
   (let [value (gobj/get input "value")
         start (gobj/get input "selectionStart")
         end (gobj/get input "selectionEnd")]
     (if (nil? up?)
       (or (= start 0) (= end (count value)))
       (or (and (= start 0) up?)
           (and (= end (count value)) (not up?)))))))

(defn highlight-selection-area!
  [end-block]
  (when-let [start-block (:selection/start-block @state/state)]
    (clear-selection-blocks!)
    (let [blocks (util/get-nodes-between-two-nodes start-block end-block "ls-block")]
      (doseq [block blocks]
        (dom/add-class! block "selected noselect"))
      (state/set-selection-blocks! blocks))))

(defn on-select-block
  [state e up?]
  (when (and
         (gobj/get e "shiftKey")
         (not (gobj/get e "altKey"))
         (or (state/in-selection-mode?)
             (when-let [input-id (state/get-edit-input-id)]
               (when-let [input (gdom/getElement input-id)]
                 (input-start-or-end? input up?)))))
    (state/clear-edit!)
    (let [{:keys [id block-id block block-parent-id dummy? value pos format] :as block-state} @select-start-block-state
          element (gdom/getElement block-parent-id)
          selected-blocks (state/get-selection-blocks)
          selected-blocks-count (count selected-blocks)
          first-block (first selected-blocks)
          selection-up? (state/selection-up?)]
      (when block-id
        (util/stop e)
        (when-let [element (if-not (state/in-selection-mode?)
                             element
                             (let [f (if up? util/get-prev-block util/get-next-block)]
                               (f first-block)))]
          (if (and (not (nil? selection-up?)) (not= up? selection-up?))
            (cond
              (>= selected-blocks-count 2) ; back to the start block
              (do
                (when (= 2 selected-blocks-count) (state/set-selection-up? nil))
                (clear-last-selected-block!))

              :else
              nil)
            (state/conj-selection-block! element up?)))))))

(defn save-block!
  [{:keys [format block id repo dummy?] :as state} value]
  (when (or (:db/id (db/entity repo [:block/uuid (:block/uuid block)]))
            dummy?)
    (let [new-value (block/with-levels value format block)]
      (let [cache [(:block/uuid block) value]]
        (when (not= @*last-edit-block cache)
          (save-block-if-changed! block new-value)
          (reset! *last-edit-block cache))))))

(defn on-up-down
  [state e up?]
  (let [{:keys [id block-id block block-parent-id dummy? value pos format] :as block-state} (get-state state)]
    (if (gobj/get e "shiftKey")
      (reset! select-start-block-state block-state)
      (let [element (gdom/getElement id)
            line-height (util/get-textarea-line-height element)]
        (when (and block-id
                   (or (and up? (util/textarea-cursor-first-row? element line-height))
                       (and (not up?) (util/textarea-cursor-end-row? element line-height))))
          (util/stop e)
          (let [f (if up? get-prev-block-non-collapsed get-next-block-non-collapsed)
                sibling-block (f (gdom/getElement block-parent-id))]
            (when sibling-block
              (when-let [sibling-block-id (d/attr sibling-block "blockid")]
                (let [state (get-state state)
                      content (:block/content block)
                      value (:value state)]
                  (when (not= (string/trim (text/remove-level-spaces content format))
                              (string/trim value))
                    (save-block! state (:value state))))
                (let [block (db/pull (state/get-current-repo) '[*] [:block/uuid (uuid sibling-block-id)])]
                  (edit-block! block pos format id))))))))))

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
          pos (util/get-input-pos input)
          start-pos (if (= :start before) 0 (- pos (count before)))
          end-pos (if (= :end after) (count value) (+ pos (count after)))]
      (when (>= (count value) end-pos)
        (= (cond
             (and (= :end after) (= :start before))
             ""

             (= :end after)
             before

             (= :start before)
             after

             :else
             (str before after))
           (subs value start-pos end-pos))))))

(defn get-matched-pages
  [q]
  (let [block (state/get-edit-block)
        editing-page (and block
                          (when-let [page-id (:db/id (:block/page block))]
                            (:page/name (db/entity page-id))))]
    (let [pages (db/get-pages (state/get-current-repo))
          pages (if editing-page
                  ;; To prevent self references
                  (remove (fn [p] (= (string/lower-case p) editing-page)) pages)
                  pages)]
      (filter
       (fn [page]
         (string/index-of
          (string/lower-case page)
          (string/lower-case q)))
       pages))))

(defn get-matched-blocks
  [q]
  ;; remove current block
  (let [current-block (state/get-edit-block)]
    (remove
     (fn [h]
       (= (:block/uuid current-block)
          (:block/uuid h)))
     (search/search q 21))))

(defn get-matched-commands
  [input]
  (try
    (let [edit-content (gobj/get input "value")
          pos (util/get-input-pos input)
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
          pos (util/get-input-pos input)
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
  (when-let [pos (util/get-input-pos input)]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) pos)
                 (>= pos 1))
        (util/nth-safe value (- pos 1))))))

(defn get-previous-input-chars
  [input length]
  (when-let [pos (util/get-input-pos input)]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) pos)
                 (>= pos 1))
        (subs value (- pos length) pos)))))

(defn get-current-input-char
  [input]
  (when-let [pos (util/get-input-pos input)]
    (let [value (gobj/get input "value")]
      (when (and (>= (count value) (inc pos))
                 (>= pos 1))
        (util/nth-safe value pos)))))

(defn- get-previous-block-level
  [current-id]
  (when-let [input (gdom/getElement current-id)]
    (when-let [prev-block (util/get-prev-block input)]
      (util/parse-int (d/attr prev-block "level")))))

(defn adjust-block-level!
  [state direction]
  (let [{:keys [block block-parent-id value]} (get-state state)
        format (:block/format block)
        block-pattern (config/get-block-pattern format)
        level (:block/level block)
        previous-level (or (get-previous-block-level block-parent-id) 1)
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
        new-value (block/with-levels value format (assoc block :block/level final-level))]
    (when (<= (- final-level previous-level) 1)
      (set-last-edit-block! (:block/uuid block) value)
      (save-block-if-changed! block new-value (= direction :left)))))

(defn adjust-blocks-level!
  [blocks direction])

(defn append-paste-doc!
  [format event]
  (let [[html text] (util/get-clipboard-as-html event)]
    (when-not (util/starts-with? (string/trim text) "http")
      (let [doc-text (html-parser/parse format html)]
        (when-not (string/blank? doc-text)
          (util/stop event)
          (state/append-current-edit-content! doc-text))))))

(defn- block-and-children-content
  [block-children]
  (-> (map :block/content block-children)
      string/join))

(defn move-up-down
  [state e up?]
  (let [{:keys [id block-id block block-parent-id dummy? value pos format] :as block-state} (get-state state)
        block (db/entity [:block/uuid block-id])
        meta (:block/meta block)
        page (:block/page block)
        block-dom-node (gdom/getElement block-parent-id)
        prev-block (get-prev-block-non-collapsed block-dom-node)
        next-block (get-next-block-non-collapsed block-dom-node)
        repo (state/get-current-repo)
        move-upwards-to-parent? (and up? prev-block (< (d/attr prev-block "level") (:block/level block)))
        move-down-to-higher-level? (and (not up?) next-block (< (d/attr next-block "level") (:block/level block)))]
    (when-let [sibling-block (cond
                               move-upwards-to-parent?
                               prev-block
                               move-down-to-higher-level?
                               next-block
                               :else
                               (let [f (if up? util/get-prev-block-with-same-level util/get-next-block-with-same-level)]
                                 (f block-dom-node)))]
      (when-let [sibling-block-id (d/attr sibling-block "blockid")]
        (when-let [sibling-block (db/pull-block (medley/uuid sibling-block-id))]
          (let [sibling-meta (:block/meta sibling-block)
                hc1 (db/get-block-and-children repo (:block/uuid block) false)
                hc2 (if (or move-upwards-to-parent? move-down-to-higher-level?)
                      [sibling-block]
                      (db/get-block-and-children repo (:block/uuid sibling-block) false))]
            ;; Same page and next to the other
            (when (and
                   (= (:db/id (:block/page block))
                      (:db/id (:block/page sibling-block)))
                   (or
                    (and up? (= (:end-pos (:block/meta (last hc2))) (:start-pos (:block/meta (first hc1)))))
                    (and (not up?) (= (:end-pos (:block/meta (last hc1))) (:start-pos (:block/meta (first hc2)))))))
              (let [hc1-content (block-and-children-content hc1)
                    hc2-content (block-and-children-content hc2)
                    file (db/get-block-file (:block/uuid block))
                    file-path (:file/path file)
                    old-file-content (db/get-file file-path)
                    [start-pos end-pos new-content blocks] (if up?
                                                             [(:start-pos sibling-meta)
                                                              (get-in (last hc1) [:block/meta :end-pos])
                                                              (str hc1-content hc2-content)
                                                              (concat hc1 hc2)]
                                                             [(:start-pos meta)
                                                              (get-in (last hc2) [:block/meta :end-pos])
                                                              (str hc2-content hc1-content)
                                                              (concat hc2 hc1)])]
                (when (and start-pos end-pos)
                  (let [new-file-content (utf8/insert! old-file-content start-pos end-pos new-content)
                        modified-time (modified-time-tx page file)
                        blocks-meta (rebuild-blocks-meta start-pos blocks)]
                    (profile
                     (str "Move block " (if up? "up: " "down: "))
                     (repo-handler/transact-react-and-alter-file!
                      repo
                      (concat
                       blocks-meta
                       modified-time)
                      {:key :block/change
                       :data (map (fn [block] (assoc block :block/page page)) blocks)}
                      [[file-path new-file-content]]))))))))))))

(defn expand!
  []
  (when-let [current-block (state/get-edit-block)]
    (expand/expand! current-block)
    (state/set-collapsed-state! (:block/uuid current-block)
                                false)))

(defn collapse!
  []
  (when-let [current-block (state/get-edit-block)]
    (expand/collapse! current-block)
    (state/set-collapsed-state! (:block/uuid current-block)
                                true)))


(defn cycle-collapse!
  [_state e]
  (when (and
         ;; not input, t
         (nil? (state/get-edit-input-id))
         (not (state/get-editor-show-input))
         (string/blank? (:search/q @state/state)))
    (util/stop e)
    (expand/cycle!)))

(defn on-tab
  [direction]
  (fn [state e]
    (when-let [repo (state/get-current-repo)]
      (let [blocks (seq (state/get-selection-blocks))]
        (if (seq blocks)
          (let [ids (map (fn [block] (when-let [id (dom/attr block "blockid")]
                                       (medley/uuid id))) blocks)
                ids (->> (mapcat #(let [children (vec (db/get-block-children-ids repo %))]
                                    (cons % children)) ids)
                         (distinct))
                blocks (db/pull-many '[*] (map (fn [id] [:block/uuid id]) ids))
                block (first blocks)
                format (:block/format block)
                start-pos (get-in block [:block/meta :start-pos])
                old-end-pos (get-in (last blocks) [:block/meta :end-pos])
                pattern (config/get-block-pattern format)
                last-start-pos (atom start-pos)
                blocks (doall
                        (map (fn [block]
                               (let [content (:block/content block)
                                     level (:block/level block)
                                     content' (if (= :left direction)
                                                (subs content 1)
                                                (str pattern content))
                                     end-pos (+ @last-start-pos (utf8/length (utf8/encode content')))
                                     block (assoc block
                                                  :block/content content'
                                                  :block/level (if (= direction :left)
                                                                 (dec level)
                                                                 (inc level))
                                                  :block/meta (merge
                                                               (:block/meta block)
                                                               {:start-pos @last-start-pos
                                                                :end-pos end-pos}))]
                                 (reset! last-start-pos end-pos)
                                 block))
                          blocks))
                file-id (:db/id (:block/file block))
                file (db/entity file-id)
                page (:block/page block)
                after-blocks (rebuild-after-blocks repo file old-end-pos @last-start-pos)
                ;; _ (prn {:blocks (map (fn [h] (select-keys h [:block/content :block/meta])) blocks)
                ;;         :after-blocks after-blocks
                ;;         :last-start-pos @last-start-pos})
                file-path (:file/path file)
                file-content (db/get-file file-path)
                new-content (utf8/insert! file-content start-pos old-end-pos (apply str (map :block/content blocks)))
                modified-time (modified-time-tx page file)]
            (profile
             "Indent/outdent: "
             (repo-handler/transact-react-and-alter-file!
              repo
              (concat
               blocks
               after-blocks
               modified-time)
              {:key :block/change
               :data (map (fn [block] (assoc block :block/page page)) blocks)}
              [[file-path new-content]])))
          (cycle-collapse! state e))))))

(defn bulk-make-todos
  [state e]
  (when-let [repo (state/get-current-repo)]
    (let [blocks (seq (state/get-selection-blocks))]
      (if (seq blocks)
        (let [ids (map (fn [block] (when-let [id (dom/attr block "blockid")]
                                     (medley/uuid id))) blocks)
              ids (->> (mapcat #(let [children (vec (db/get-block-children-ids repo %))]
                                  (cons % children)) ids)
                       (distinct))
              blocks (db/pull-many '[*] (map (fn [id] [:block/uuid id]) ids))
              block (first blocks)
              format (:block/format block)
              start-pos (get-in block [:block/meta :start-pos])
              old-end-pos (get-in (last blocks) [:block/meta :end-pos])
              pattern (config/get-block-pattern format)
              last-start-pos (atom start-pos)
              blocks (doall
                      (map (fn [block]
                             (let [content (:block/content block)
                                   [prefix content] (if-let [col (util/split-first " " content)]
                                                      col
                                                      [content ""])
                                   level (:block/level block)
                                   new-marker (state/get-preferred-todo)
                                   content' (string/replace-first content
                                                                  format/marker-pattern
                                                                  (str new-marker " "))
                                   content' (str prefix " " content')
                                   end-pos (+ @last-start-pos (utf8/length (utf8/encode content')))
                                   block (assoc block
                                                :block/marker new-marker
                                                :block/content content'
                                                :block/meta (merge
                                                             (:block/meta block)
                                                             {:start-pos @last-start-pos
                                                              :end-pos end-pos}))]
                               (reset! last-start-pos end-pos)
                               block))
                        blocks))
              file-id (:db/id (:block/file block))
              file (db/entity file-id)
              page (:block/page block)
              after-blocks (rebuild-after-blocks repo file old-end-pos @last-start-pos)
              file-path (:file/path file)
              file-content (db/get-file file-path)
              new-content (utf8/insert! file-content start-pos old-end-pos (apply str (map :block/content blocks)))
              modified-time (modified-time-tx page file)]
          (profile
           "Indent/outdent: "
           (repo-handler/transact-react-and-alter-file!
            repo
            (concat
             blocks
             after-blocks
             modified-time)
            {:key :block/change
             :data (map (fn [block] (assoc block :block/page page)) blocks)}
            [[file-path new-content]])))
        (cycle-collapse! state e)))))

(defn handle-command-input
  [command id format m pos]
  (case command
    :link
    (let [{:keys [link label]} m]
      (if (and (string/blank? link)
               (string/blank? label))
        nil
        (insert-command! id
                         (util/format "[[%s][%s]]"
                                      (or link "")
                                      (or label ""))
                         format
                         {:last-pattern (str commands/slash "link")})))
    :draw
    (when-not (string/blank? (:title m))
      (let [file (draw/title->file-name (:title m))
            value (util/format
                   "[[%s]]\n<iframe class=\"draw-iframe\" src=\"/draw?file=%s\" width=\"100%\" height=\"600\" frameborder=\"0\" allowfullscreen></iframe>"
                   file
                   file)]
        (insert-command! id
                         value
                         format
                         {:last-pattern (str commands/slash "draw ")})
        (draw/create-draw-with-default-content
         file
         (fn []
           (let [input (gdom/getElement "download")]
             (.click input))))))
    nil)

  (state/set-editor-show-input nil)

  (when-let [saved-cursor (get @state/state :editor/last-saved-cursor)]
    (when-let [input (gdom/getElement id)]
      (.focus input)
      (util/move-cursor-to input saved-cursor))))
