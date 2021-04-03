(ns frontend.handler.editor
  (:require [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [frontend.handler.common :as common-handler]
            [frontend.handler.route :as route-handler]
            [frontend.handler.git :as git-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.file :as file-handler]
            [frontend.handler.notification :as notification]
            [frontend.handler.expand :as expand]
            [frontend.handler.block :as block-handler]
            [frontend.format.mldoc :as mldoc]
            [frontend.format :as format]
            [frontend.format.block :as block]
            [frontend.image :as image]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.db :as db]
            [goog.object :as gobj]
            [goog.dom :as gdom]
            [goog.dom.classes :as gdom-classes]
            [clojure.string :as string]
            [clojure.set :as set]
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
                     *slash-caret-pos
                     *angle-bracket-caret-pos
                     *show-block-commands]]
            [frontend.extensions.html-parser :as html-parser]
            [medley.core :as medley]
            [frontend.text :as text]
            [frontend.date :as date]
            [frontend.handler.repeated :as repeated]
            [frontend.template :as template]
            [clojure.core.async :as async]
            [lambdaisland.glogi :as log]
            [cljs.core.match :refer-macros [match]]))

;; FIXME: should support multiple images concurrently uploading


(defonce *asset-pending-file (atom nil))
(defonce *asset-uploading? (atom false))
(defonce *asset-uploading-process (atom 0))
(defonce *selected-text (atom nil))

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
          pattern-count (count pattern)
          prefix (subs value 0 selection-start)
          wrapped-value (str pattern
                             (subs value selection-start selection-end)
                             pattern)
          postfix (subs value selection-end)
          new-value (str prefix wrapped-value postfix)]
      (state/set-edit-content! edit-id new-value)
      (if empty-selection?
        (util/cursor-move-back input (count pattern))
        (let [new-pos (count (str prefix wrapped-value))]
          (util/move-cursor-to input new-pos))))))

(defn bold-format! []
  (format-text! config/get-bold))

(defn italics-format! []
  (format-text! config/get-italic))

(defn highlight-format! []
  (format-text! config/get-highlight))

(defn html-link-format! []
  (when-let [m (get-selection-and-format)]
    (let [{:keys [selection-start selection-end format value block edit-id input]} m
          cur-pos (:pos (util/get-caret-pos input))
          empty-selection? (= selection-start selection-end)
          selection (subs value selection-start selection-end)
          selection-link? (and selection (or (util/starts-with? selection "http://")
                                             (util/starts-with? selection "https://")))
          [content forward-pos] (cond
                                  empty-selection?
                                  (config/get-empty-link-and-forward-pos format)

                                  selection-link?
                                  (config/with-default-link format selection)

                                  :else
                                  (config/with-default-label format selection))
          new-value (str
                     (subs value 0 selection-start)
                     content
                     (subs value selection-end))
          cur-pos (or selection-start cur-pos)]
      (state/set-edit-content! edit-id new-value)
      (util/move-cursor-to input (+ cur-pos forward-pos)))))

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
         (let [pos (diff/find-position markup range)]
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

(defn get-current-input-node
  []
  (let [edit-input-id (state/get-edit-input-id)]
    (and edit-input-id (gdom/getElement edit-input-id))))

(defn get-current-input-value
  []
  (let [edit-input-id (state/get-edit-input-id)
        input (and edit-input-id (gdom/getElement edit-input-id))]
    (when input
      (gobj/get input "value"))))

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
                              old-end-pos (:end-pos meta)]
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

(defn- block-with-title
  [content format]
  (let [content-without-level-spaces (-> (text/remove-level-spaces content format))
        content-without-level-spaces (str (when (= \n (first content-without-level-spaces))
                                            "\n")
                                          (string/trim content-without-level-spaces))
        first-block (-> content-without-level-spaces
                        (format/to-edn format)
                        ffirst)]
    (or (block/heading-block? first-block)
        (block/paragraph-block? first-block)
        (block/hiccup-block? first-block)
        (block/definition-list-block? first-block))))

(defn- rebuild-block-content
  "We'll create an empty heading if the first parsed ast element is not a paragraph, definition list or some hiccup."
  [content format]
  (if (block-with-title content format)
    content
    (text/append-newline-after-level-spaces content format)))

(defn- get-edit-input-id-with-block-id
  [block-id]
  (when-let [first-block (util/get-first-block-by-id block-id)]
    (string/replace (gobj/get first-block "id")
                    "ls-block"
                    "edit-block")))

;; id: block dom id, "ls-block-counter-uuid"
(defn edit-block!
  ([block pos format id]
   (edit-block! block pos format id nil))
  ([block pos format id {:keys [custom-content custom-properties tail-len]
                         :or {tail-len 0}}]
   (when-not config/publishing?
     (when-let [block-id (:block/uuid block)]
       (let [edit-input-id (if (uuid? id)
                             (get-edit-input-id-with-block-id id)
                             (str (subs id 0 (- (count id) 36)) block-id))
             block (or
                    (db/pull [:block/uuid block-id])
                    block
                    ;; dummy?
                    {:block/uuid block-id
                     :block/content ""})
             {:block/keys [content properties]} block
             content (or custom-content content)
             content (string/trim (text/remove-level-spaces content format))
             properties (or custom-properties properties)
             content (if (and (seq properties) (text/properties-hidden? properties))
                       (text/remove-properties! content)
                       content)
             content (text/remove-level-spaces content format true)
             content-length (count content)
             text-range (cond
                          (and (> tail-len 0) (>= (count content) tail-len))
                          (subs content 0 (- (count content) tail-len))

                          (or (= :max pos) (<= content-length pos))
                          content

                          :else
                          (subs content 0 pos))]
         (state/set-editing! edit-input-id content block text-range))))))

(defn edit-last-block-for-new-page!
  [last-block pos]
  (when-let [first-block (util/get-first-block-by-id (:block/uuid last-block))]
    (edit-block!
     last-block
     pos
     (:block/format last-block)
     (string/replace (gobj/get first-block "id")
                     "ls-block"
                     "edit-block"))))

(defn- re-build-block-value
  ([block format value]
   (re-build-block-value block format value {}))
  ([block format value properties]
   (let [block-with-title? (boolean (block-with-title value format))]
     (text/re-construct-block-properties format value properties
                                         block-with-title?))))

(defn- compute-new-properties
  [block new-properties value {:keys [init-properties custom-properties remove-properties]}]
  (let [text-properties (text/extract-properties value)
        old-hidden-properties (select-keys (:block/properties block) text/hidden-properties)
        properties (merge old-hidden-properties
                          init-properties
                          text-properties
                          custom-properties)
        remove-properties (->
                           (set/difference (set (keys (:block/properties block)))
                                           (set (keys text-properties))
                                           text/hidden-properties)
                           (set/union (set remove-properties)))]
    (medley/remove-keys (fn [k] (contains? remove-properties k)) properties)))

(defn- another-block-with-same-id-exists?
  [current-id block-id]
  (and (string? block-id)
       (util/uuid-string? block-id)
       (not= current-id (cljs.core/uuid block-id))
       (db/entity [:block/uuid (cljs.core/uuid block-id)])))

(defn- create-file-if-not-exists!
  [repo format page value]
  (let [format (name format)
        title (string/capitalize (:page/name page))
        journal-page? (date/valid-journal-title? title)
        path (str
              (if journal-page?
                config/default-journals-directory
                (config/get-pages-directory))
              "/"
              (if journal-page?
                (date/journal-title->default title)
                (-> (:page/name page)
                    (util/page-name-sanity))) "."
              (if (= format "markdown") "md" format))
        file-path (str "/" path)
        dir (config/get-repo-dir repo)]
    (p/let [exists? (fs/file-exists? dir file-path)]
      (if exists?
        (do
          (notification/show!
           [:p.content
            (util/format "File %s already exists!" file-path)]
           :error)
          (state/set-editor-op! nil))
        ;; create the file
        (let [value (re-build-block-value nil format value)
              content (str (util/default-content-with-title format
                             (or (:page/original-name page)
                                 (:page/name page)))
                           value)]
          (p/let [_ (fs/create-if-not-exists repo dir file-path content)
                  _ (git-handler/git-add repo path)]
            (file-handler/reset-file! repo path content)
            (ui-handler/re-render-root!)

            ;; Continue to edit the last block
            (let [blocks (db/get-page-blocks repo (:page/name page))
                  last-block (last blocks)]
              (edit-last-block-for-new-page! last-block :max)
              (state/set-editor-op! nil))))))))

(defn- save-block-when-file-exists!
  [repo block e new-properties value {:keys [indent-left? rebuild-content? chan chan-callback]}]
  (let [{:block/keys [uuid file page  pre-block? ref-pages ref-blocks]} block
        file (db/entity repo (:db/id file))
        file-path (:file/path file)
        format (format/get-format file-path)
        file-content (db/get-file repo file-path)
        value (get-block-new-value block file-content value)
        value (if rebuild-content?
                (rebuild-block-content value format)
                value)
        block (assoc block :block/content value)
        {:keys [blocks pages start-pos end-pos]} (if pre-block?
                                                   (let [new-end-pos (utf8/length (utf8/encode value))]
                                                     {:blocks [(assoc-in block [:block/meta :end-pos] new-end-pos)]
                                                      :pages []
                                                      :start-pos 0
                                                      :end-pos new-end-pos})
                                                   (block/parse-block block format))
        block-retracted-attrs (when-not pre-block?
                                ;; TODO: should we retract the whole block instead?
                                (when-let [id (:db/id block)]
                                  [[:db/retract id :block/properties]
                                   [:db/retract id :block/priority]
                                   [:db/retract id :block/deadline]
                                   [:db/retract id :block/deadline-ast]
                                   [:db/retract id :block/scheduled]
                                   [:db/retract id :block/scheduled-ast]
                                   [:db/retract id :block/marker]
                                   [:db/retract id :block/repeated?]]))
        [after-blocks block-children-content new-end-pos] (rebuild-after-blocks-indent-outdent repo file block (:end-pos (:block/meta block)) end-pos indent-left?)
        retract-refs (compute-retract-refs (:db/id e) (first blocks) ref-pages ref-blocks)
        page-id (:db/id page)
        page-properties (when pre-block?
                          (if (seq new-properties)
                            [[:db/retract page-id :page/properties]
                             {:db/id page-id
                              :page/properties new-properties}]
                            [[:db/retract page-id :page/properties]]))
        page-tags (when-let [tags (:tags new-properties)]
                    (mapv (fn [tag] {:page/name (string/lower-case tag)
                                     :page/original-name tag}) tags))
        page-alias (when-let [alias (:alias new-properties)]
                     (map
                      (fn [alias]
                        {:page/original-name alias
                         :page/name (string/lower-case alias)})
                      (remove #{(:page/name page)} alias)))
        pages (if (seq page-tags)
                (concat pages page-tags)
                pages)
        pages (remove
               (fn [page]
                 (string/blank? (:page/name page)))
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
       block-retracted-attrs
       (mapv (fn [b] {:block/uuid (:block/uuid b)}) blocks)
       blocks
       retract-refs
       page-properties
       page-tags
       page-alias
       after-blocks)
      {:key :block/change
       :data (map (fn [block] (assoc block :block/page page)) blocks)}
      (let [new-content (new-file-content-indent-outdent block file-content value block-children-content new-end-pos indent-left?)]
        [[file-path new-content]])
      (when chan {:chan chan
                  :chan-callback chan-callback})))

    ;; fix editing template with multiple headings
    (when (> (count blocks) 1)
      (let [new-value (-> (text/remove-level-spaces (:block/content (first blocks)) (:block/format (first blocks)))
                          (string/trim-newline))
            edit-input-id (state/get-edit-input-id)]
        (when edit-input-id
          (state/set-edit-content! edit-input-id new-value))))

    (when (or (seq retract-refs) pre-block?)
      (ui-handler/re-render-root!))

    (repo-handler/push-if-auto-enabled! repo)))

(defn save-block-if-changed!
  ([block value]
   (save-block-if-changed! block value nil))
  ([block value
    {:keys [indent-left? init-properties custom-properties remove-properties rebuild-content? chan chan-callback]
     :or {rebuild-content? true
          custom-properties nil
          init-properties nil
          remove-properties nil}
     :as opts}]
   (let [{:block/keys [uuid content meta file page dummy? format repo pre-block? content ref-pages ref-blocks]} block
         repo (or repo (state/get-current-repo))
         e (db/entity repo [:block/uuid uuid])
         block (assoc (with-block-meta repo block)
                      :block/properties (into {} (:block/properties e)))
         format (or format (state/get-preferred-format))
         page (db/entity repo (:db/id page))
         [old-properties new-properties] (when pre-block?
                                           [(:page/properties (db/entity (:db/id page)))
                                            (mldoc/parse-properties value format)])
         properties (compute-new-properties block new-properties value
                                            {:init-properties init-properties
                                             :custom-properties custom-properties
                                             :remove-properties remove-properties})
         block-id (get properties "id")]
     (cond
       (another-block-with-same-id-exists? uuid block-id)
       (notification/show!
        [:p.content
         (util/format "Block with the id % already exists!" block-id)]
        :error)

       :else
       (let [value (re-build-block-value block format value properties)
             content-changed? (not= (string/trim content) (string/trim value))]
         (when content-changed?
           (let [file (db/entity repo (:db/id file))]
             (cond
               ;; Page was referenced but no related file
               (and page (not file))
               (create-file-if-not-exists! repo format page value)

               (and file page)
               (save-block-when-file-exists! repo block e new-properties value opts)

               :else
               nil))))))))

(defn- compute-fst-snd-block-text
  [block format value pos level new-level block-self? block-has-children? with-level?]
  (let [fst-block-text (subs value 0 pos)
        snd-block-text (string/triml (subs value pos))
        fst-block-text (string/trim (if with-level? fst-block-text (block/with-levels fst-block-text format block)))
        snd-block-text-level (cond
                               new-level
                               new-level
                               (or block-self?
                                   (and block-has-children?
                                        (not (zero? pos))))
                               (inc level)
                               :else
                               level)
        snd-block-text (if (and snd-block-text
                                (re-find (re-pattern (util/format "^[%s]+\\s+" (config/get-block-pattern format))) snd-block-text))
                         snd-block-text
                         (rebuild-block-content
                          (str (config/default-empty-block format snd-block-text-level) " " snd-block-text)
                          format))]
    [fst-block-text snd-block-text]))

(defn insert-block-to-existing-file!
  [repo block file page file-path file-content value fst-block-text snd-block-text pos format input {:keys [create-new-block? ok-handler with-level? new-level current-page blocks-container-id]}]
  (let [{:block/keys [meta pre-block?]} block
        original-id (:block/uuid block)
        block-has-children? (seq (:block/children block))
        edit-self? (and block-has-children? (zero? pos))
        ;; Compute the new value, remove id property from the second block if exists
        value (if create-new-block?
                (str fst-block-text "\n" snd-block-text)
                value)
        snd-block-text (text/remove-id-property snd-block-text)
        text-properties (if (zero? pos)
                          {}
                          (text/extract-properties fst-block-text))
        old-hidden-properties (select-keys (:block/properties block) text/hidden-properties)
        properties (merge old-hidden-properties
                          text-properties)
        value (if create-new-block?
                (str
                 (->
                  (re-build-block-value block format fst-block-text properties)
                  (string/trimr))
                 "\n"
                 (string/triml snd-block-text))
                (re-build-block-value block format value properties))
        value (rebuild-block-content value format)
        [new-content value] (new-file-content block file-content value)
        parse-result (block/parse-block (assoc block :block/content value) format)
        id-conflict? (some #(= original-id (:block/uuid %)) (next (:blocks parse-result)))
        {:keys [blocks pages start-pos end-pos]}
        (if id-conflict?
          (let [new-value (string/replace
                           value
                           (re-pattern (str "(?i):(custom_)?id: " original-id))
                           "")]
            (block/parse-block (assoc block :block/content new-value) format))
          parse-result)
        after-blocks (rebuild-after-blocks repo file (:end-pos meta) end-pos)
        files [[file-path new-content]]
        block-retracted-attrs (when-not pre-block?
                                ;; TODO: should we retract the whole block instead?
                                (when-let [id (:db/id block)]
                                  [[:db/retract id :block/properties]
                                   [:db/retract id :block/priority]
                                   [:db/retract id :block/deadline]
                                   [:db/retract id :block/deadline-ast]
                                   [:db/retract id :block/scheduled]
                                   [:db/retract id :block/scheduled-ast]
                                   [:db/retract id :block/marker]
                                   [:db/retract id :block/repeated?]]))
        transact-fn (fn []
                      (repo-handler/transact-react-and-alter-file!
                       repo
                       (concat
                        block-retracted-attrs
                        pages
                        (mapv (fn [b] {:block/uuid (:block/uuid b)}) blocks)
                        blocks
                        after-blocks)
                       {:key :block/insert
                        :data (map (fn [block] (assoc block :block/page page)) blocks)}
                       files)
                      (state/set-editor-op! nil))]

    ;; Replace with batch transactions
    (state/add-tx! transact-fn)

    (let [blocks (remove (fn [block]
                           (nil? (:block/content block))) blocks)
          page-blocks-atom (db/get-page-blocks-cache-atom repo (:db/id page))
          first-block-id (:block/uuid (first blocks))
          [before-part after-part] (and page-blocks-atom
                                        (split-with
                                         #(not= first-block-id (:block/uuid %))
                                         @page-blocks-atom))
          after-part (rest after-part)
          blocks-container-id (and blocks-container-id
                                   (util/uuid-string? blocks-container-id)
                                   (medley/uuid blocks-container-id))]

      ;; WORKAROUND: The block won't refresh itself even if the content is empty.
      (when edit-self?
        (gobj/set input "value" ""))

      (when ok-handler
        (ok-handler
         (if edit-self? (first blocks) (last blocks))))

      ;; update page blocks cache if exists
      (when page-blocks-atom
        (reset! page-blocks-atom (->> (concat before-part blocks after-part)
                                      (remove nil?))))

      ;; update block children cache if exists
      (when blocks-container-id
        (let [blocks-atom (db/get-block-blocks-cache-atom repo blocks-container-id)
              [before-part after-part] (and blocks-atom
                                            (split-with
                                             #(not= first-block-id (:block/uuid %))
                                             @blocks-atom))
              after-part (rest after-part)]
          (and blocks-atom
               (reset! blocks-atom (->> (concat before-part blocks after-part)
                                        (remove nil?)))))))))

(defn insert-new-block-aux!
  [{:block/keys [uuid content meta file dummy? level repo page format properties collapsed? pre-block?] :as block}
   value
   {:keys [create-new-block? ok-handler with-level? new-level current-page blocks-container-id]
    :as opts}]
  (let [value (or value "")
        block-page? (and current-page (util/uuid-string? current-page))
        block-self? (= uuid (and block-page? (medley/uuid current-page)))
        input (gdom/getElement (state/get-edit-input-id))
        pos (if new-level
              (dec (count value))
              (util/get-input-pos input))
        repo (or repo (state/get-current-repo))
        block (with-block-meta repo block)
        format (:block/format block)
        page (db/entity repo (:db/id page))
        file (db/entity repo (:db/id file))
        block-has-children? (seq (:block/children block))
        [fst-block-text snd-block-text] (compute-fst-snd-block-text block format value pos level new-level block-self? block-has-children? with-level?)]
    (cond
      (and (not file) page)
      (let [value (str value "\n" snd-block-text)]
        (create-file-if-not-exists! repo format page value))

      file
      (let [file-path (:file/path file)
            file-content (db/get-file repo file-path)]
        (insert-block-to-existing-file! repo block file page file-path file-content value fst-block-text snd-block-text pos format input opts))

      :else
      nil)))

(defn clear-when-saved!
  []
  (state/set-editor-show-input! nil)
  (state/set-editor-show-date-picker! false)
  (state/set-editor-show-page-search! false)
  (state/set-editor-show-block-search! false)
  (state/set-editor-show-template-search! false)
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

(defn- with-timetracking-properties
  [block value]
  (let [new-marker (first (re-find format/bare-marker-pattern (or value "")))
        new-marker (if new-marker (string/lower-case (string/trim new-marker)))
        time-properties (if (and
                             new-marker
                             (not= new-marker (string/lower-case (or (:block/marker block) "")))
                             (state/enable-timetracking?))
                          {new-marker (util/time-ms)}
                          {})]
    (merge (:block/properties block)
           time-properties)))

(defn insert-new-block!
  ([state]
   (insert-new-block! state nil))
  ([state block-value]
   (when (and (not config/publishing?)
              ;; skip this operation if it's inserting
              (not= :insert (state/get-editor-op)))
     (state/set-editor-op! :insert)
     (let [{:keys [block value format id config]} (get-state state)
           value (if (string? block-value) block-value value)
           block-id (:block/uuid block)
           block (or (db/pull [:block/uuid block-id])
                     block)
           collapsed? (:block/collapsed? block)
           repo (or (:block/repo block) (state/get-current-repo))
           last-child (and collapsed?
                           (last (db/get-block-and-children-no-cache repo (:block/uuid block))))
           last-child (when (not= (:block/uuid last-child)
                                  (:block/uuid block))
                        last-child)
           new-block (or last-child block)
           new-value (if last-child (:block/content last-child) value)
           properties (with-timetracking-properties new-block new-value)]
       ;; save the current block and insert a new block
       (insert-new-block-aux!
        (assoc new-block :block/properties properties)
        new-value
        {:create-new-block? true
         :ok-handler
         (fn [last-block]
           (let [last-id (:block/uuid last-block)]
             (edit-block! last-block 0 format id)
             (clear-when-saved!)))
         :with-level? (if last-child true false)
         :new-level (and last-child (:block/level block))
         :blocks-container-id (:id config)
         :current-page (state/get-current-page)})))))

(defn insert-new-block-without-save-previous!
  [config last-block]
  (let [format (:block/format last-block)
        id (:id config)
        new-level (if (util/uuid-string? id)
                    (inc (:block/level (db/entity [:block/uuid (medley/uuid id)])))
                    2)]
    (insert-new-block-aux!
     last-block
     (:block/content last-block)
     {:create-new-block? true
      :ok-handler
      (fn [last-block]
        (js/setTimeout #(edit-last-block-for-new-page! last-block :max) 50))
      :with-level? true
      :new-level new-level
      :blocks-container-id (:id config)
      :current-page (state/get-current-page)})))

(defn update-timestamps-content!
  [{:block/keys [repeated? scheduled-ast deadline-ast marker]} content]
  (if repeated?
    (let [content (some->> (filter repeated/repeated? [scheduled-ast deadline-ast])
                           (map (fn [ts]
                                  [(repeated/timestamp->text ts)
                                   (repeated/next-timestamp-text ts)]))
                           (reduce (fn [content [old new]]
                                     (string/replace content old new))
                                   content))]
      (when content
        (str (string/trimr content)
             "\n"
             (util/format "- %s -> DONE [%s]"
                          marker
                          (date/get-local-date-time-string)))))
    content))

(defn- with-marker-time
  [block marker]
  (if (state/enable-timetracking?)
    (let [marker (string/lower-case marker)]
      {marker (util/time-ms)})
    {}))

(defn check
  [{:block/keys [uuid marker content meta file dummy? repeated?] :as block}]
  (let [new-content (string/replace-first content marker "DONE")
        new-content (if repeated?
                      (update-timestamps-content! block content)
                      new-content)]
    (save-block-if-changed! block new-content
                            {:custom-properties (with-marker-time block "DONE")})))

(defn uncheck
  [{:block/keys [uuid marker content meta file dummy?] :as block}]
  (let [marker (if (= :now (state/get-preferred-workflow))
                 "LATER"
                 "TODO")
        new-content (string/replace-first content "DONE" marker)]
    (save-block-if-changed! block new-content
                            {:custom-properties (with-marker-time block marker)})))

(defn cycle-todo!
  []
  (when-let [block (state/get-edit-block)]
    (let [edit-input-id (state/get-edit-input-id)
          current-input (gdom/getElement edit-input-id)
          content (state/get-edit-content)
          [new-content marker] (cond
                                 (util/starts-with? content "TODO")
                                 [(string/replace-first content "TODO" "DOING") "DOING"]
                                 (util/starts-with? content "DOING")
                                 [(string/replace-first content "DOING" "DONE") "DONE"]
                                 (util/starts-with? content "LATER")
                                 [(string/replace-first content "LATER" "NOW") "NOW"]
                                 (util/starts-with? content "NOW")
                                 [(string/replace-first content "NOW" "DONE") "DONE"]
                                 (util/starts-with? content "DONE")
                                 [(string/replace-first content "DONE" "") nil]
                                 :else
                                 (let [marker (if (= :now (state/get-preferred-workflow))
                                                "LATER"
                                                "TODO")]
                                   [(str marker " " (string/triml content)) marker]))
          new-content (string/triml new-content)]
      (let [new-pos (commands/compute-pos-delta-when-change-marker
                     current-input content new-content marker (util/get-input-pos current-input))]
        (state/set-edit-content! edit-input-id new-content)
        (util/set-caret-pos! current-input new-pos)))))

(defn set-marker
  [{:block/keys [uuid marker content meta file dummy? properties] :as block} new-marker]
  (let [new-content (string/replace-first content marker new-marker)]
    (save-block-if-changed! block new-content
                            {:custom-properties (with-marker-time block new-marker)})))

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
    (when (and block-id
               (not= :block/delete (state/get-editor-op)))
      (state/set-editor-op! :block/delete)
      (let [page-id (:db/id (:block/page (db/entity [:block/uuid block-id])))
            page-blocks-count (and page-id (db/get-page-blocks-count repo page-id))
            page (and page-id (db/entity page-id))]
        (if (> page-blocks-count 1)
          (do
            (util/stop e)
            ;; delete block, edit previous block
            (let [block (db/pull [:block/uuid block-id])
                  block-parent (gdom/getElement block-parent-id)
                  sibling-block (get-prev-block-non-collapsed block-parent)]
              (delete-block-aux! block dummy?)
              (when (and repo sibling-block)
                (when-let [sibling-block-id (d/attr sibling-block "blockid")]
                  (when-let [block (db/pull repo '[*] [:block/uuid (uuid sibling-block-id)])]
                    (let [original-content (util/trim-safe (:block/content block))
                          new-value (str original-content " " (string/triml value))
                          tail-len (count (string/triml value))
                          pos (max
                               (if original-content
                                 (utf8/length (utf8/encode (text/remove-level-spaces original-content format)))
                                 0)
                               0)]
                      (edit-block! block pos format id
                                   {:custom-content new-value
                                    :tail-len tail-len})))))))))
      (state/set-editor-op! nil))))

(defn delete-blocks!
  [repo block-uuids]
  (when (seq block-uuids)
    (let [current-page (state/get-current-page)
          top-block-id (and current-page
                            (util/uuid-string? current-page)
                            (medley/uuid current-page))
          top-block? (and top-block-id
                          (= top-block-id (first block-uuids)))]
      (let [blocks (db/pull-many repo '[*] (mapv (fn [id]
                                                   [:block/uuid id])
                                                 block-uuids))
            page (db/entity repo (:db/id (:block/page (first blocks))))
            first-block (first blocks)
            last-block (last blocks)
            file (db/entity repo (:db/id (:block/file first-block)))
            file-path (:file/path file)
            file-content (db/get-file repo file-path)
            start-pos (:start-pos (:block/meta first-block))
            end-pos (:end-pos (:block/meta last-block))
            after-blocks (rebuild-after-blocks repo file end-pos start-pos)
            new-content (utf8/delete! file-content start-pos end-pos)
            retract-blocks-tx (mapv
                               (fn [uuid]
                                 [:db.fn/retractEntity [:block/uuid uuid]])
                               block-uuids)
            tx-data (concat
                     retract-blocks-tx
                     after-blocks
                     [{:file/path file-path}])]
        (repo-handler/transact-react-and-alter-file!
         repo
         tx-data
         {:key :block/change
          :data blocks}
         [[file-path new-content]])
        (when top-block?
          (route-handler/redirect! {:to :page
                                    :path-params {:name (:page/name page)}})
          (ui-handler/re-render-root!))
        (repo-handler/push-if-auto-enabled! repo)))))

(defn remove-block-property!
  [block-id key]
  (let [block-id (if (string? block-id) (uuid block-id) block-id)
        key (string/lower-case (str key))]
    (when-let [block (db/pull [:block/uuid block-id])]
      (let [{:block/keys [content properties]} block]
        (when (get properties key)
          (save-block-if-changed! block content
                                  {:remove-properties [key]}))))))

(defn set-block-property!
  [block-id key value]
  (let [block-id (if (string? block-id) (uuid block-id) block-id)
        key (string/lower-case (str key))
        value (str value)]
    (when-let [block (db/pull [:block/uuid block-id])]
      (when-not (:block/pre-block? block)
        (let [{:block/keys [content properties]} block]
          (cond
            (and (string? (get properties key))
                 (= (string/trim (get properties key)) value))
            nil

            :else
            (save-block-if-changed! block content
                                    {:custom-properties {key value}
                                     :rebuild-content? false})))))))

(defn set-block-timestamp!
  [block-id key value]
  (let [key (string/lower-case key)
        scheduled? (= key "scheduled")
        deadline? (= key "deadline")
        block-id (if (string? block-id) (uuid block-id) block-id)
        key (string/lower-case (str key))
        value (str value)]
    (when-let [block (db/pull [:block/uuid block-id])]
      (let [{:block/keys [content scheduled deadline format]} block
            content (or (when-let [edit-content (state/get-edit-content)]
                          (block/with-levels edit-content format block))
                        content)
            new-line (str (string/upper-case key) ": " value)
            new-content (let [lines (string/split-lines content)
                              new-lines (map (fn [line]
                                               (if (string/starts-with? (string/lower-case line) key)
                                                 new-line
                                                 line))
                                             lines)
                              new-lines (if (not= lines new-lines)
                                          new-lines
                                          (cons (first new-lines) ;; title
                                                (cons
                                                 new-line
                                                 (rest new-lines))))]
                          (string/join "\n" new-lines))]
        (when (not= content new-content)
          (if-let [input-id (state/get-edit-input-id)]
            (state/set-edit-content! input-id new-content)
            (save-block-if-changed! block new-content)))))))

(defn copy-block-ref!
  ([block-id] (copy-block-ref! block-id #(str %)))
  ([block-id tap-clipboard]
   (let [block (db/entity [:block/uuid block-id])]
     (when-not (:block/pre-block? block)
       (set-block-property! block-id "id" (str block-id))))
   (util/copy-to-clipboard! (tap-clipboard block-id))))

(defn clear-selection!
  [_e]
  (when (state/in-selection-mode?)
    (doseq [block (state/get-selection-blocks)]
      (dom/remove-class! block "selected")
      (dom/remove-class! block "noselect"))
    (state/clear-selection!)))

(defn clear-selection-blocks!
  []
  (when (state/in-selection-mode?)
    (doseq [block (state/get-selection-blocks)]
      (dom/remove-class! block "selected")
      (dom/remove-class! block "noselect"))
    (state/clear-selection-blocks!)))

(defn exit-editing-and-set-selected-blocks!
  [blocks]
  (util/clear-selection!)
  (state/clear-edit!)
  (state/set-selection-blocks! blocks))

(defn select-all-blocks!
  []
  (when-let [current-input-id (state/get-edit-input-id)]
    (let [input (gdom/getElement current-input-id)
          blocks-container (util/rec-get-blocks-container input)
          blocks (dom/by-class blocks-container "ls-block")]
      (doseq [block blocks]
        (dom/add-class! block "selected noselect"))
      (exit-editing-and-set-selected-blocks! blocks))))

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
          ids (->> (distinct (map #(when-let [id (dom/attr % "blockid")]
                                     (uuid id)) blocks))
                   (remove nil?))
          up? (state/selection-up?)
          content (some->> (db/get-blocks-contents repo ids)
                           (map :block/content))
          content (if (false? up?) (reverse content) content)
          content (string/join "" content)]
      (when-not (string/blank? content)
        (common-handler/copy-to-clipboard-without-id-property! content)))))

(defn cut-selection-blocks
  [copy?]
  (when copy? (copy-selection-blocks))
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
              (when page
                (subs page 2 (- (count page) 2))))))))))

(defn follow-link-under-cursor!
  []
  (when-let [page (get-nearest-page)]
    (let [page-name (string/lower-case page)]
      (state/clear-edit!)
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
  (let [page (state/get-current-page)
        block-id (and
                  (string? page)
                  (util/uuid-string? page)
                  (medley/uuid page))]
    (if block-id
      (let [repo (state/get-current-repo)
            block-parent (db/get-block-parent repo block-id)]
        (if-let [id (:block/uuid block-parent)]
          (route-handler/redirect! {:to :page
                                    :path-params {:name (str id)}})
          (let [page-id (-> (db/entity [:block/uuid block-id])
                            :block/page
                            :db/id)]
            (when-let [page-name (:page/name (db/entity repo page-id))]
              (route-handler/redirect! {:to :page
                                        :path-params {:name page-name}})))))
      (js/window.history.back))))

(defn cut-block!
  [block-id]
  (when-let [block (db/pull [:block/uuid block-id])]
    (let [content (:block/content block)]
      (common-handler/copy-to-clipboard-without-id-property! content)
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
      (exit-editing-and-set-selected-blocks! blocks))))

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
                (when (= 2 selected-blocks-count) (state/set-selection-up! nil))
                (clear-last-selected-block!))

              :else
              nil)
            (do
              (util/clear-selection!)
              (state/clear-edit!)
              (state/conj-selection-block! element up?))))))))

(defn save-block-aux!
  [block value format opts]
  (let [value (text/remove-level-spaces value format true)
        new-value (block/with-levels value format block)
        properties (with-timetracking-properties block value)]
    ;; FIXME: somehow frontend.components.editor's will-unmount event will loop forever
    ;; maybe we shouldn't save the block/file in "will-unmount" event?
    (save-block-if-changed! block new-value
                            (merge
                             {:init-properties properties}
                             opts))))

(defn save-block!
  ([repo block-or-uuid content]
   (let [block (if (or (uuid? block-or-uuid)
                       (string? block-or-uuid))
                 (db-model/query-block-by-uuid block-or-uuid) block-or-uuid)
         format (:block/format block)]
     (save-block! {:block block :repo repo :format format} content)))
  ([{:keys [format block repo dummy?] :as state} value]
   (when (or (:db/id (db/entity repo [:block/uuid (:block/uuid block)]))
             dummy?)
     (save-block-aux! block value format {}))))

(defn save-current-block-when-idle!
  ([]
   (save-current-block-when-idle! {}))
  ([{:keys [check-idle? chan chan-callback]
     :or {check-idle? true}}]
   (when (and (nil? (state/get-editor-op))
              ;; non English input method
              (not (state/editor-in-composition?)))
     (when-let [repo (state/get-current-repo)]
       (when (and (if check-idle? (state/input-idle? repo) true)
                  (not (state/get-editor-show-page-search?))
                  (not (state/get-editor-show-page-search-hashtag?))
                  (not (state/get-editor-show-block-search?))
                  (not (state/get-editor-show-date-picker?))
                  (not (state/get-editor-show-template-search?))
                  (not (state/get-editor-show-input)))
         (state/set-editor-op! :auto-save)
         (try
           (let [input-id (state/get-edit-input-id)
                 block (state/get-edit-block)
                 db-block (when-let [block-id (:block/uuid block)]
                            (db/pull [:block/uuid block-id]))
                 elem (and input-id (gdom/getElement input-id))
                 db-content (:block/content db-block)
                 db-content-without-heading (and db-content
                                                 (util/safe-subs db-content (:block/level db-block)))
                 value (and elem (gobj/get elem "value"))]
             (when (and block value db-content-without-heading
                        (or
                         (not= (string/trim db-content-without-heading)
                               (string/trim value))))
               (save-block-aux! db-block value (:block/format db-block) {:chan chan
                                                                         :chan-callback chan-callback})))
           (catch js/Error error
             (log/error :save-block-failed error)))
         (state/set-editor-op! nil))))))

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
                  (when (not= (-> content
                                  (text/remove-level-spaces format)
                                  text/remove-properties!
                                  string/trim)
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

    (fn? command-output)
    (let [s (command-output)]
      (commands/insert! id s option))

    :else
    nil)

  (when restore?
    (let [restore-slash-caret-pos? (if (and
                                        (seq? command-output)
                                        (= :editor/click-hidden-file-input
                                           (ffirst command-output)))
                                     false
                                     true)]
      (commands/restore-state restore-slash-caret-pos?))))

(defn- get-asset-file-link
  [format url file-name image?]
  (case (keyword format)
    :markdown (util/format (str (when image? "!") "[%s](%s)") file-name url)
    :org (if image?
           (util/format "[[%s]]" url)
           (util/format "[[%s][%s]]" url file-name))
    nil))

(defn- get-asset-link
  [url]
  (str "/" url))

(defn ensure-assets-dir!
  [repo]
  (let [repo-dir (config/get-repo-dir repo)
        assets-dir "assets"]
    (p/then
     (fs/mkdir-if-not-exists (str repo-dir "/" assets-dir))
     (fn [] [repo-dir assets-dir]))))

(defn save-assets!
  ([{block-id :block/uuid} repo files]
   (when-let [block-file (db-model/get-block-file block-id)]
     (p/let [[repo-dir assets-dir] (ensure-assets-dir! repo)]
       (let [prefix (:file/path block-file)
             prefix (and prefix (string/replace
                                 (if (util/electron?)
                                   (string/replace prefix (str repo-dir "/") "")
                                   prefix) "/" "_"))
             prefix (and prefix (subs prefix 0 (string/last-index-of prefix ".")))]
         (save-assets! repo repo-dir assets-dir files
                       (fn [index file-base]
                         (str (string/replace file-base " " "_") "_" (.now js/Date) "_" index)))))))
  ([repo dir path files gen-filename]
   (p/all
    (for [[index ^js file] (map-indexed vector files)]
      (do
        (js/console.dir file)
        (let [file-name (.-name file)
              [file-base ext] (if file-name
                                (let [last-dot-index (string/last-index-of file-name ".")]
                                  [(subs file-name 0 last-dot-index)
                                   (subs file-name last-dot-index)])
                                ["" ""])
              filename (str (gen-filename index file-base) ext)
              filename (str path "/" filename)]
                                        ;(js/console.debug "Write asset #" dir filename file)
         (if (util/electron?)
           (let [from (.-path file)]
             (p/then (js/window.apis.copyFileToAssets dir filename from)
                     #(p/resolved [filename (if (string? %) (js/File. #js[] %) file) (.join util/node-path dir filename)])))
           (p/then (fs/write-file! repo dir filename (.stream file) nil)
                   #(p/resolved [filename file])))))))))

(defonce *assets-url-cache (atom {}))

(defn make-asset-url
  [path] ;; path start with "/assets" or compatible for "../assets"
  (let [repo-dir (config/get-repo-dir (state/get-current-repo))
        path (string/replace path "../" "/")]
    (if (util/electron?)
      (str "assets://" repo-dir path)
      (let [handle-path (str "handle" repo-dir path)
            cached-url (get @*assets-url-cache (keyword handle-path))]
        (if cached-url
          (p/resolved cached-url)
          (p/let [handle (frontend.idb/get-item handle-path)
                  file (and handle (.getFile handle))]
            (when file
              (p/let [url (js/URL.createObjectURL file)]
                (swap! *assets-url-cache assoc (keyword handle-path) url)
                url))))))))

(defn delete-asset-of-block!
  [{:keys [repo href title full-text block-id local?] :as opts}]
  (let [block (db-model/query-block-by-uuid block-id)
        _ (or block (throw (str block-id " not exists")))
        format (:block/format block)
        text (:block/content block)
        content (string/replace text full-text "")]
    (save-block! repo block content)
    (when local?
      ;; FIXME: should be relative to current block page path
      (fs/unlink! (config/get-repo-path
                   repo (-> href
                            (string/replace #"^../" "/")
                            (string/replace #"^assets://" ""))) nil))))

;; assets/journals_2021_02_03_1612350230540_0.png
(defn resolve-relative-path
  [file-path]
  (if-let [current-file (some-> (state/get-edit-block)
                                :block/file
                                :db/id
                                (db/entity)
                                :file/path)]
    (util/get-relative-path current-file file-path)
    file-path))

(defn upload-asset
  [id ^js files format uploading? drop-or-paste?]
  (let [repo (state/get-current-repo)
        block (state/get-edit-block)]
    (if (config/local-db? repo)
      (-> (save-assets! block repo (js->clj files))
          (p/then
           (fn [res]
             (when-let [[asset-file-name file full-file-path] (and (seq res) (first res))]
               (let [image? (util/ext-of-image? asset-file-name)]
                 (insert-command!
                  id
                  (get-asset-file-link format (resolve-relative-path (or full-file-path asset-file-name))
                                       (if file (.-name file) (if image? "image" "asset"))
                                       image?)
                  format
                  {:last-pattern (if drop-or-paste? "" commands/slash)
                   :restore?     true})))))
          (p/finally
            (fn []
              (reset! uploading? false)
              (reset! *asset-uploading? false)
              (reset! *asset-uploading-process 0))))
      (image/upload
       files
       (fn [file file-name file-type]
         (image-handler/request-presigned-url
          file file-name file-type
          uploading?
          (fn [signed-url]
            (insert-command! id
                             (get-asset-file-link format signed-url file-name true)
                             format
                             {:last-pattern (if drop-or-paste? "" commands/slash)
                              :restore?     true})

            (reset! *asset-uploading? false)
            (reset! *asset-uploading-process 0))
          (fn [e]
            (let [process (* (/ (gobj/get e "loaded")
                                (gobj/get e "total"))
                             100)]
              (reset! *asset-uploading? false)
              (reset! *asset-uploading-process process)))))))))

(defn set-asset-pending-file [file]
  (reset! *asset-pending-file file))

;; Editor should track some useful information, like editor modes.
;; For example:
;; 1. Which file format is it, markdown or org mode?
;; 2. Is it in the properties area? Then we can enable the ":" autopair
(def autopair-map
  {"[" "]"
   "{" "}"
   "(" ")"
   "`" "`"
   "~" "~"
   "*" "*"
   ;; "_" "_"
   ;; ":" ":"                              ; TODO: only properties editing and org mode tag
   ;; "^" "^"
})

(def reversed-autopair-map
  (zipmap (vals autopair-map)
          (keys autopair-map)))

(def delete-map
  (assoc autopair-map
         "$" "$"
         ":" ":"))

(def reversed-delete-map
  (zipmap (vals delete-map)
          (keys delete-map)))

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
    (let [pages (search/page-search q 20)]
      (if editing-page
        ;; To prevent self references
        (remove (fn [p] (= (string/lower-case p) editing-page)) pages)
        pages))))

(defn get-matched-blocks
  [q block-id]
  ;; remove current block
  (let [current-block (state/get-edit-block)
        block-parents (set (->> (db/get-block-parents (state/get-current-repo)
                                                      block-id
                                                      99)
                                (map (comp str :block/uuid))))
        current-and-parents (set/union #{(str (:block/uuid current-block))} block-parents)]
    (p/let [result (search/block-search (state/get-current-repo) q {:limit 20})]
      (remove
       (fn [h]
         (contains? current-and-parents (:block/uuid h)))
       result))))

(defn get-matched-templates
  [q]
  (search/template-search q))

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
              @commands/*initial-commands)
         (and last-command
              (commands/get-matched-commands last-command)))))
    (catch js/Error e
      (js/console.error e)
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
      @*asset-uploading?
      (state/get-editor-show-input)
      (state/get-editor-show-page-search?)
      (state/get-editor-show-block-search?)
      (state/get-editor-show-template-search?)
      (state/get-editor-show-date-picker?)))

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

;; If it's an indent/outdent action followed by an "Enter", only adjust after inserting a block was finished. Maybe we should use a channel to serialize all the events.
(defn adjust-block-level!
  ([state direction]
   (adjust-block-level! state direction 100))
  ([state direction retry-limit]
   (if (= :insert (state/get-editor-op))
     (if (> retry-limit 0)
       (js/setTimeout #(adjust-block-level! state direction (dec retry-limit)) 20)
       (log/error :editor/indent-outdent-retry-max-limit {:direction direction}))
     (do
       (state/set-editor-op! :indent-outdent)
       (let [{:keys [block block-parent-id value config]} (get-state state)
             start-level (:start-level config)
             format (:block/format block)
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
         (when (and
                (not (and (= direction :left)
                          (get config :id)
                          (util/uuid-string? (get config :id))
                          (<= final-level start-level)))
                (<= (- final-level previous-level) 1))
           (save-block-if-changed! block new-value
                                   {:indent-left? (= direction :left)})))
       (state/set-editor-op! nil)))))

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
  [e up?]
  (when-let [block-id (:block/uuid (state/get-edit-block))]
    (let [block-parent-id (state/get-editing-block-dom-id)
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
                  hc1 (db/get-block-and-children-no-cache repo (:block/uuid block))
                  hc2 (if (or move-upwards-to-parent? move-down-to-higher-level?)
                        [sibling-block]
                        (db/get-block-and-children-no-cache repo (:block/uuid sibling-block)))]
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
                          blocks-meta (rebuild-blocks-meta start-pos blocks)]
                      (profile
                       (str "Move block " (if up? "up: " "down: "))
                       (repo-handler/transact-react-and-alter-file!
                        repo
                        blocks-meta
                        {:key :block/change
                         :data (map (fn [block] (assoc block :block/page page)) blocks)}
                        [[file-path new-file-content]])))))))))))))

(defn expand!
  []
  (when-let [current-block (state/get-edit-block)]
    (expand/expand! current-block)))

(defn collapse!
  []
  (when-let [current-block (state/get-edit-block)]
    (expand/collapse! current-block)))

(defn cycle-collapse!
  [e]
  (when (and
         ;; not input, t
         (nil? (state/get-edit-input-id))
         (not (state/get-editor-show-input))
         (string/blank? (:search/q @state/state)))
    (util/stop e)
    (expand/cycle!)))

(defn on-tab
  [direction]
  (fn [e]
    (when-let [repo (state/get-current-repo)]
      (let [blocks (seq (state/get-selection-blocks))]
        (cond
          (seq blocks)
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
                blocks (map (fn [b] (dissoc b :block/children)) blocks)]
            (repo-handler/transact-react-and-alter-file!
             repo
             (concat
              blocks
              after-blocks)
             {:key :block/change
              :data (map (fn [block] (assoc block :block/page page)) blocks)}
             [[file-path new-content]]))

          (gdom/getElement "date-time-picker")
          nil

          :else
          (cycle-collapse! e))))))

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
              new-content (utf8/insert! file-content start-pos old-end-pos (apply str (map :block/content blocks)))]
          (profile
           "Indent/outdent: "
           (repo-handler/transact-react-and-alter-file!
            repo
            (concat
             blocks
             after-blocks)
            {:key :block/change
             :data (map (fn [block] (assoc block :block/page page)) blocks)}
            [[file-path new-content]])))
        (cycle-collapse! e)))))

(defn- get-link
  [format link label]
  (let [link (or link "")
        label (or label "")]
    (case (keyword format)
      :markdown (util/format "[%s](%s)" label link)
      :org (util/format "[[%s][%s]]" link label)
      nil)))

(defn handle-command-input
  [command id format m pos]
  (case command
    :link
    (let [{:keys [link label]} m]
      (if (and (string/blank? link)
               (string/blank? label))
        nil
        (insert-command! id
                         (get-link format link label)
                         format
                         {:last-pattern (str commands/slash "link")})))
    nil)

  (state/set-editor-show-input! nil)

  (when-let [saved-cursor (get @state/state :editor/last-saved-cursor)]
    (when-let [input (gdom/getElement id)]
      (.focus input)
      (util/move-cursor-to input saved-cursor))))

(defn set-block-as-a-heading!
  [block-id value]
  (set-block-property! block-id "heading" value))

(defn open-block!
  [first?]
  (when-not (state/editing?)
    (let [edit-id (state/get-last-edit-input-id)
          block-id (when edit-id (subs edit-id (- (count edit-id) 36)))
          last-edit-block (first (array-seq (js/document.getElementsByClassName block-id)))
          nodes (array-seq (js/document.getElementsByClassName "ls-block"))
          first-node (first nodes)
          node (cond
                 last-edit-block
                 last-edit-block
                 first?
                 first-node
                 :else
                 (when-let [blocks-container (util/rec-get-blocks-container first-node)]
                   (let [nodes (dom/by-class blocks-container "ls-block")]
                     (last nodes))))]
      (when node
        (state/clear-selection!)
        (unhighlight-block!)
        (let [block-id (and node (d/attr node "blockid"))
              edit-block-id (string/replace (gobj/get node "id") "ls-block" "edit-block")
              block-id (medley/uuid block-id)]
          (when-let [block (or (db/entity [:block/uuid block-id])
                               {:block/uuid block-id})]
            (edit-block! block
                         :max
                         (:block/format block)
                         edit-block-id))))
      false)))

(defn get-search-q
  []
  (when-let [id (state/get-edit-input-id)]
    (when-let [input (gdom/getElement id)]
      (let [current-pos (:pos (util/get-caret-pos input))
            pos (:editor/last-saved-cursor @state/state)
            edit-content (state/sub [:editor/content id])]
        (or
         @*selected-text
         (util/safe-subs edit-content pos current-pos))))))

(defn close-autocomplete-if-outside
  [input]
  (when (or (state/get-editor-show-page-search?)
            (state/get-editor-show-page-search-hashtag?)
            (state/get-editor-show-block-search?))
    (when-let [q (get-search-q)]
      (let [value (gobj/get input "value")
            pos (:editor/last-saved-cursor @state/state)
            current-pos (:pos (util/get-caret-pos input))]
        (when (or (< current-pos pos)
                  (string/includes? q "]")
                  (string/includes? q ")"))
          (state/set-editor-show-block-search! false)
          (state/set-editor-show-page-search! false)
          (state/set-editor-show-page-search-hashtag! false))))))

(defn periodically-save!
  []
  (js/setInterval save-current-block-when-idle! 500))

(defn save!
  []
  (when-let [repo (state/get-current-repo)]
    (save-current-block-when-idle! {:check-idle? false})
    (when (string/starts-with? repo "https://") ; git repo
      (repo-handler/auto-push!))))

(defn resize-image!
  [block-id metadata full_text size]
  (let [new-meta (merge metadata size)
        image-part (first (string/split full_text #"\{"))
        new-full-text (str image-part (pr-str new-meta))
        block (db/pull [:block/uuid block-id])
        value (:block/content block)
        new-value (string/replace value full_text new-full-text)]
    (save-block-aux! block new-value (:block/format block) {})))

(defn edit-box-on-change!
  [e block id]
  (let [value (util/evalue e)
        current-pos (:pos (util/get-caret-pos (gdom/getElement id)))]
    (state/set-edit-content! id value false)
    (state/set-edit-pos! current-pos)
    (when-let [repo (or (:block/repo block)
                        (state/get-current-repo))]
      (state/set-editor-last-input-time! repo (util/time-ms))
      (db/clear-repo-persistent-job! repo))
    (let [input (gdom/getElement id)
          native-e (gobj/get e "nativeEvent")
          last-input-char (util/nth-safe value (dec current-pos))]
      (case last-input-char
        "/"
        ;; TODO: is it cross-browser compatible?
        (when (not= (gobj/get native-e "inputType") "insertFromPaste")
          (when-let [matched-commands (seq (get-matched-commands input))]
            (reset! commands/*slash-caret-pos (util/get-caret-pos input))
            (reset! commands/*show-commands true)))
        "<"
        (when-let [matched-commands (seq (get-matched-block-commands input))]
          (reset! commands/*angle-bracket-caret-pos (util/get-caret-pos input))
          (reset! commands/*show-block-commands true))
        nil))))

(defn block-on-chosen-handler
  [input id q format]
  (fn [chosen _click?]
    (state/set-editor-show-block-search! false)
    (let [uuid-string (str (:block/uuid chosen))]

      ;; block reference
      (insert-command! id
                       (util/format "((%s))" uuid-string)
                       format
                       {:last-pattern (str "((" (if @*selected-text "" q))
                        :postfix-fn   (fn [s] (util/replace-first "))" s ""))})

      ;; Save it so it'll be parsed correctly in the future
      (set-block-property! (:block/uuid chosen)
                           "ID"
                           uuid-string)

      (when-let [input (gdom/getElement id)]
        (.focus input)))))

(defn block-non-exist-handler
  [input]
  (fn []
    (state/set-editor-show-block-search! false)
    (util/cursor-move-forward input 2)))

(defn template-on-chosen-handler
  [input id q format edit-block edit-content]
  (fn [[template db-id] _click?]
    (if-let [block (db/entity db-id)]
      (let [new-level (:block/level edit-block)
            properties (:block/properties block)
            block-uuid (:block/uuid block)
            including-parent? (not= (get properties "including-parent") "false")
            template-parent-level (:block/level block)
            pattern (config/get-block-pattern format)
            content
            (block-handler/get-block-full-content
             (state/get-current-repo)
             (:block/uuid block)
             (fn [{:block/keys [uuid level content properties] :as block}]
               (let [parent? (= uuid block-uuid)
                     ignore-parent? (and parent? (not including-parent?))]
                 (if ignore-parent?
                   ""
                   (let [new-level (+ new-level
                                      (- level template-parent-level
                                         (if (not including-parent?) 1 0)))
                         properties' (dissoc (into {} properties) "id" "custom_id" "template" "including-parent")]
                     (-> content
                         (string/replace-first (apply str (repeat level pattern))
                                               (apply str (repeat new-level pattern)))
                         text/remove-properties!
                         (text/rejoin-properties properties')))))))
            content (if (string/includes? (string/trim edit-content) "\n")
                      content
                      (text/remove-level-spaces content format))
            content (template/resolve-dynamic-template! content)]
        (state/set-editor-show-template-search! false)
        (insert-command! id content format {})))
    (when-let [input (gdom/getElement id)]
      (.focus input))))

(defn keydown-enter-handler
  [state input]
  (fn [state e]
    (when (and (not (gobj/get e "ctrlKey"))
               (not (gobj/get e "metaKey"))
               (not (in-auto-complete? input)))
      (let [{:keys [block config]} (get-state state)]
        (when (and block
                   (not (:ref? config))
                   (not (:custom-query? config))) ; in reference section
          (let [content (state/get-edit-content)]
            (if (and
                 (> (:block/level block) 2)
                 (string/blank? content))
              (do
                (util/stop e)
                (adjust-block-level! state :left))
              (let [shortcut (state/get-new-block-shortcut)
                    insert? (cond
                              config/mobile?
                              true

                              (and (= shortcut "alt+enter") (not (gobj/get e "altKey")))
                              false

                              (gobj/get e "shiftKey")
                              false

                              :else
                              true)]
                (when (and
                       insert?
                       (not (in-auto-complete? input)))
                  (util/stop e)
                  (profile
                   "Insert block"
                   (insert-new-block! state)))))))))))

(defn keydown-up-down-handler
  [input up?]
  (fn [state e]
    (when (and
           (not (gobj/get e "ctrlKey"))
           (not (gobj/get e "metaKey"))
           (not (in-auto-complete? input)))
      (on-up-down state e up?))))

(defn- move-to-block-when-cross-boundrary
  [state e direction]
  (let [up? (= :left direction)
        pos (if up? :max 0)
        {:keys [id block-id block block-parent-id dummy? value format] :as block-state} (get-state state)
        element (gdom/getElement id)]
    (when block-id
      (let [f (if up? get-prev-block-non-collapsed get-next-block-non-collapsed)
            sibling-block (f (gdom/getElement block-parent-id))]
        (when sibling-block
          (when-let [sibling-block-id (d/attr sibling-block "blockid")]
            (let [state (get-state state)
                  content (:block/content block)
                  value (:value state)]
              (when (not= (-> content
                              (text/remove-level-spaces format)
                              text/remove-properties!
                              string/trim)
                          (string/trim value))
                (save-block! state (:value state))))
            (let [block (db/pull (state/get-current-repo) '[*] [:block/uuid (uuid sibling-block-id)])]
              (edit-block! block pos format id)
              (util/stop e))))))))

(defn- on-arrow-move-to-boundray
  [state input e direction]
  (when (and (not (util/input-selected? input))
             (or (and (= :left direction) (util/input-start? input))
             (and (= :right direction) (util/input-end? input))))
    (move-to-block-when-cross-boundrary state e direction)))

(defn keydown-arrow-handler
  [input direction]
  (fn [state e]
    (when (and
           input
           (not (gobj/get e "shiftKey"))
           (not (gobj/get e "ctrlKey"))
           (not (gobj/get e "metaKey"))
           (not (in-auto-complete? input)))
      (on-arrow-move-to-boundray state input e direction))))

(defn keydown-backspace-handler
  [repo input id]
  (fn [state e]
    (let [current-pos (:pos (util/get-caret-pos input))
          value (gobj/get input "value")
          deleted (and (> current-pos 0)
                       (util/nth-safe value (dec current-pos)))
          selected-start (gobj/get input "selectionStart")
          selected-end (gobj/get input "selectionEnd")
          block-id (:block-id (first (:rum/args state)))
          page (state/get-current-page)]
      (cond
        (not= selected-start selected-end)
        nil

        (and (zero? current-pos)
             ;; not the top block in a block page
             (not (and page
                       (util/uuid-string? page)
                       (= (medley/uuid page) block-id))))
        (delete-block! state repo e)

        (and (> current-pos 1)
             (= (util/nth-safe value (dec current-pos)) commands/slash))
        (do
          (reset! *slash-caret-pos nil)
          (reset! *show-commands false))

        (and (> current-pos 1)
             (= (util/nth-safe value (dec current-pos)) commands/angle-bracket))
        (do
          (reset! *angle-bracket-caret-pos nil)
          (reset! *show-block-commands false))

        ;; pair
        (and
         deleted
         (contains?
          (set (keys delete-map))
          deleted)
         (>= (count value) (inc current-pos))
         (= (util/nth-safe value current-pos)
            (get delete-map deleted)))

        (do
          (util/stop e)
          (commands/delete-pair! id)
          (cond
            (and (= deleted "[") (state/get-editor-show-page-search?))
            (state/set-editor-show-page-search! false)

            (and (= deleted "(") (state/get-editor-show-block-search?))
            (state/set-editor-show-block-search! false)

            :else
            nil))

        ;; deleting hashtag
        (and (= deleted "#") (state/get-editor-show-page-search-hashtag?))
        (state/set-editor-show-page-search-hashtag! false)

        :else
        nil))))

(defn keydown-tab-handler
  [input input-id]
  (fn [state e]
    (let [pos (and input (:pos (util/get-caret-pos input)))]
      (when (and (not (state/get-editor-show-input))
                 (not (state/get-editor-show-date-picker?))
                 (not (state/get-editor-show-template-search?)))
        (util/stop e)
        (let [direction (if (gobj/get e "shiftKey") ; shift+tab move to left
                          :left
                          :right)]
          (p/let [_ (adjust-block-level! state direction)]
            (and input pos
                 (js/setTimeout
                  #(when-let [input (gdom/getElement input-id)]
                     (util/move-cursor-to input pos))
                  0))))))))

(defn keydown-not-matched-handler
  [input input-id format]
  (fn [e key-code]
    (let [key (gobj/get e "key")
          value (gobj/get input "value")
          ctrlKey (gobj/get e "ctrlKey")
          metaKey (gobj/get e "metaKey")
          pos (util/get-input-pos input)]
      (cond
        (or ctrlKey metaKey)
        nil

        (or
         (and (= key "#")
              (and
               (> pos 0)
               (= "#" (util/nth-safe value (dec pos)))))
         (and (= key " ")
              (state/get-editor-show-page-search-hashtag?)))
        (state/set-editor-show-page-search-hashtag! false)

        (or
         (surround-by? input "#" " ")
         (surround-by? input "#" :end)
         (= key "#"))
        (do
          (commands/handle-step [:editor/search-page-hashtag])
          (state/set-last-pos! (:pos (util/get-caret-pos input)))
          (reset! commands/*slash-caret-pos (util/get-caret-pos input)))

        (and
         (= key " ")
         (state/get-editor-show-page-search-hashtag?))
        (state/set-editor-show-page-search-hashtag! false)

        (and
         (contains? (set/difference (set (keys reversed-autopair-map))
                                    #{"`"})
                    key)
         (= (get-current-input-char input) key))
        (do
          (util/stop e)
          (util/cursor-move-forward input 1))

        (contains? (set (keys autopair-map)) key)
        (do
          (util/stop e)
          (autopair input-id key format nil)
          (cond
            (surround-by? input "[[" "]]")
            (do
              (commands/handle-step [:editor/search-page])
              (reset! commands/*slash-caret-pos (util/get-caret-pos input)))
            (surround-by? input "((" "))")
            (do
              (commands/handle-step [:editor/search-block :reference])
              (reset! commands/*slash-caret-pos (util/get-caret-pos input)))
            :else
            nil))

        (let [sym "$"]
          (and (= key sym)
               (>= (count value) 1)
               (> pos 0)
               (= (nth value (dec pos)) sym)
               (if (> (count value) pos)
                 (not= (nth value pos) sym)
                 true)))
        (commands/simple-insert! input-id "$$" {:backward-pos 2})

        (let [sym "^"]
          (and (= key sym)
               (>= (count value) 1)
               (> pos 0)
               (= (nth value (dec pos)) sym)
               (if (> (count value) pos)
                 (not= (nth value pos) sym)
                 true)))
        (commands/simple-insert! input-id "^^" {:backward-pos 2})

        :else
        nil))))

;; key up
(defn keyup-handler
  [state input input-id search-timeout]
  (fn [e key-code]
    (let [k (gobj/get e "key")
          format (:format (get-state state))]
      (when-not (state/get-editor-show-input)
        (when (and @*show-commands (not= key-code 191)) ; not /
          (let [matched-commands (get-matched-commands input)]
            (if (seq matched-commands)
              (do
                (reset! *show-commands true)
                (reset! commands/*matched-commands matched-commands))
              (reset! *show-commands false))))
        (when (and @*show-block-commands (not= key-code 188)) ; not <
          (let [matched-block-commands (get-matched-block-commands input)]
            (if (seq matched-block-commands)
              (cond
                (= key-code 9)       ;tab
                (when @*show-block-commands
                  (util/stop e)
                  (insert-command! input-id
                                   (last (first matched-block-commands))
                                   format
                                   {:last-pattern commands/angle-bracket}))

                :else
                (reset! commands/*matched-block-commands matched-block-commands))
              (reset! *show-block-commands false))))
        (when (nil? @search-timeout)
          (close-autocomplete-if-outside input))))))

(defn editor-on-click!
  [id]
  (fn [_e]
    (let [input (gdom/getElement id)
          current-pos (:pos (util/get-caret-pos input))]
      (state/set-edit-pos! current-pos)
      (close-autocomplete-if-outside input))))

(defn editor-on-change!
  [block id search-timeout]
  (fn [e]
    (if (state/sub :editor/show-block-search?)
      (let [blocks-count (or (db/blocks-count) 0)
            timeout (if (> blocks-count 2000) 300 100)]
        (when @search-timeout
          (js/clearTimeout @search-timeout))
        (reset! search-timeout
                (js/setTimeout
                 #(edit-box-on-change! e block id)
                 timeout)))
      (edit-box-on-change! e block id))))

(defn editor-on-paste!
  [id]
  (fn [e]
    (when-let [handled
               (let [pick-one-allowed-item
                     (fn [items]
                       (if (util/electron?)
                         (let [existed-file-path (js/window.apis.getFilePathFromClipboard)
                               existed-file-path (if (and
                                                      (string? existed-file-path)
                                                      (not util/mac?)
                                                      (not util/win32?)) ; FIXME: linux
                                                   (when (re-find #"^(/[^/ ]*)+/?$" existed-file-path)
                                                     existed-file-path)
                                                   existed-file-path)
                               has-file-path? (not (string/blank? existed-file-path))
                               has-image? (js/window.apis.isClipboardHasImage)]
                           (if (or has-image? has-file-path?)
                             [:asset (js/File. #js[] (if has-file-path? existed-file-path "image.png"))]))

                         (when (and items (.-length items))
                           (let [files (. (js/Array.from items) (filter #(= (.-kind %) "file")))
                                 it (gobj/get files 0) ;;; TODO: support multiple files
                                 mime (and it (.-type it))]
                             (cond
                               (contains? #{"image/jpeg" "image/png" "image/jpg" "image/gif"} mime) [:asset (. it getAsFile)])))))
                     clipboard-data (gobj/get e "clipboardData")
                     items (or (.-items clipboard-data)
                               (.-files clipboard-data))
                     picked (pick-one-allowed-item items)]
                 (if (get picked 1)
                   (match picked
                     [:asset file] (set-asset-pending-file file))))]
      (util/stop e))))
