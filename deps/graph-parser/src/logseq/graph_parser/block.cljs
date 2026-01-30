(ns logseq.graph-parser.block
  "Given mldoc ast, prepares block data in preparation for db transaction.
   Used by file and DB graphs"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.date :as common-date]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.utf8 :as utf8]))

(defn heading-block?
  [block]
  (and
   (vector? block)
   (= "Heading" (first block))))

(defn get-tag
  [block]
  (when-let [tag-value (and (vector? block)
                            (= "Tag" (first block))
                            (second block))]
    (->> tag-value
         (map (fn [[elem value]]
                (case elem
                  "Plain" value
                  "Link" (:full_text value)
                  "Nested_link" (:content value)
                  "")))
         (string/join))))

(defn get-page-reference
  [block format]
  (let [page (cond
               (and (vector? block) (= "Link" (first block)))
               (let [url-type (first (:url (second block)))
                     value (second (:url (second block)))]
                 ;; {:url ["File" "file:../pages/hello_world.org"], :label [["Plain" "hello world"]], :title nil}
                 (or
                  (and
                   (= url-type "Page_ref")
                   (and (string? value)
                        (not (common-config/local-relative-asset? value)))
                   value)

                  (and
                   (= url-type "Search")
                   (page-ref/page-ref? value)
                   (text/page-ref-un-brackets! value))

                  (and (= url-type "Search")
                       (= format :org)
                       (not (common-config/local-relative-asset? value))
                       value)

                  (and
                   (= url-type "File")
                   (second (first (:label (second block)))))))

               (and (vector? block) (= "Nested_link" (first block)))
               (let [content (:content (last block))]
                 (subs content 2 (- (count content) 2)))

               (and (vector? block)
                    (= "Macro" (first block)))
               (let [{:keys [name arguments]} (second block)
                     argument (string/join ", " arguments)]
                 (if (= name "embed")
                   (when (page-ref/page-ref? argument)
                     (text/page-ref-un-brackets! argument))
                   {:type "macro"
                    :name name
                    :arguments arguments}))

               (and (vector? block)
                    (= "Tag" (first block)))
               (let [text (get-tag block)]
                 (text/page-ref-un-brackets! text))

               :else
               nil)]
    (when page (or (when (string? page)
                     (block-ref/get-block-ref-id page))
                   page))))

(defn get-block-reference
  [block]
  (when-let [block-id (cond
                        (and (vector? block)
                             (= "Block_reference" (first block)))
                        (last block)

                        (and (vector? block)
                             (= "Link" (first block))
                             (map? (second block))
                             (= "Block_ref" (first (:url (second block)))))
                        (second (:url (second block)))

                        (and (vector? block)
                             (= "Macro" (first block)))
                        (let [{:keys [name arguments]} (second block)]
                          (when (and (= name "embed")
                                     (string? (first arguments))
                                     (block-ref/string-block-ref? (first arguments)))
                            (block-ref/get-string-block-ref-id (first arguments))))

                        (and (vector? block)
                             (= "Link" (first block))
                             (map? (second block)))
                        (if (= "id" (:protocol (second (:url (second block)))))
                          (:link (second (:url (second block))))
                          (let [id (second (:url (second block)))]
                            ;; these can be maps
                            (when (string? id)
                              (or (block-ref/get-block-ref-id id) id))))

                        :else
                        nil)]
    (when (some-> block-id parse-uuid)
      block-id)))

(defn paragraph-block?
  [block]
  (and
   (vector? block)
   (= "Paragraph" (first block))))

(defn timestamp-block?
  [block]
  (and
   (vector? block)
   (= "Timestamp" (first block))))

(defn- get-page-refs-from-property-names
  [properties {:property-pages/keys [enabled? excludelist]}]
  (if (contains? #{true nil} enabled?)
    (sequence
     (comp (map (comp name first))
           (remove string/blank?)
           (remove (set (map name excludelist)))
           ;; Remove built-in properties as we don't want pages
           ;; created for them by default
           (remove (into #{}
                         (map name)
                         (apply conj
                                (apply disj
                                       (gp-property/editable-built-in-properties)
                                       gp-property/editable-linkable-built-in-properties)
                                (gp-property/hidden-built-in-properties))))
           (distinct))
     properties)
    []))

(defn- extract-refs-from-property-value
  [value format]
  (cond
    (coll? value)
    (filter (fn [v] (and (string? v) (not (string/blank? v)))) value)
    (and (string? value) (= \" (first value) (last value)))
    nil
    (string? value)
    (let [ast (gp-mldoc/inline->edn value (gp-mldoc/default-config format))]
      (text/extract-refs-from-mldoc-ast ast))
    :else
    nil))

(defn- get-page-ref-names-from-properties
  [properties user-config]
  (let [page-refs (->>
                   properties
                   (remove (fn [[k _]]
                             (contains?
                              (set/union (apply disj
                                                (gp-property/editable-built-in-properties)
                                                gp-property/editable-linkable-built-in-properties)
                                         (gp-property/hidden-built-in-properties))
                              (keyword k))))
                   ;; get links ast
                   (map last)
                   (mapcat (fn [value]
                             (extract-refs-from-property-value value (get user-config :format :markdown))))
                   ;; comma separated collections
                   (concat (->> (map second properties)
                                (filter coll?)
                                (apply concat))))
        page-refs-from-property-names (get-page-refs-from-property-names properties user-config)]
    (->> (concat page-refs page-refs-from-property-names)
         (remove string/blank?)
         distinct)))

(defn- extract-block-refs
  [nodes]
  (let [ref-blocks (atom nil)]
    (walk/postwalk
     (fn [form]
       (when-let [block (get-block-reference form)]
         (swap! ref-blocks conj block))
       form)
     nodes)
    (keep (fn [block]
            (when-let [id (parse-uuid block)]
              [:block/uuid id]))
          @ref-blocks)))

(defn extract-properties
  [properties user-config]
  (when (seq properties)
    (let [properties (seq properties)
          *invalid-properties (atom #{})
          properties (->> properties
                          (map (fn [[k v mldoc-ast]]
                                 (let [k (if (or (keyword? k) (symbol? k))
                                           (subs (str k) 1)
                                           k)
                                       k (-> (string/lower-case k)
                                             (string/replace "/" "-")
                                             (string/replace " " "-")
                                             (string/replace "_" "-"))]
                                   (if (gp-property/valid-property-name? (str ":" k))
                                     (let [k' (keyword
                                               (if (contains? #{"custom_id" "custom-id"} k)
                                                 "id"
                                                 k))
                                           v' (text/parse-property k v mldoc-ast user-config)]
                                       [k' v' mldoc-ast v])
                                     (do (swap! *invalid-properties conj k)
                                         nil)))))
                          (remove #(nil? (second %))))
          page-refs (get-page-ref-names-from-properties properties user-config)
          block-refs (extract-block-refs properties)
          properties-text-values (->> (map (fn [[k _v _refs original-text]] [k original-text]) properties)
                                      (into {}))
          properties (map (fn [[k v _]] [k v]) properties)
          properties' (into {} properties)]
      {:properties properties'
       :properties-order (map first properties)
       :properties-text-values properties-text-values
       :invalid-properties @*invalid-properties
       :page-refs page-refs
       :block-refs block-refs})))

(defn- paragraph-timestamp-block?
  [block]
  (and (paragraph-block? block)
       (or (timestamp-block? (first (second block)))
           (timestamp-block? (second (second block))))))

(defn- extract-timestamps
  [block]
  (some->>
   (second block)
   (filter timestamp-block?)
   (map last)
   (into {})))

;; {"Deadline" {:date {:year 2020, :month 10, :day 20}, :wday "Tue", :time {:hour 8, :min 0}, :repetition [["DoublePlus"] ["Day"] 1], :active true}}
(defn timestamps->scheduled-and-deadline
  [timestamps]
  (let [timestamps (update-keys timestamps (comp keyword string/lower-case))
        m (some->> (select-keys timestamps [:scheduled :deadline])
                   (map (fn [[k v]]
                          (let [{:keys [date repetition]} v
                                {:keys [year month day]} date
                                day (js/parseInt (str year (common-util/zero-pad month) (common-util/zero-pad day)))]
                            (cond->
                             (case k
                               :scheduled
                               {:scheduled day}
                               :deadline
                               {:deadline day})
                              repetition
                              (assoc :repeated? true))))))]
    (apply merge m)))

(defn- convert-page-if-journal-impl
  "Convert journal file name to user' custom date format"
  [original-page-name date-formatter & {:keys [export-to-db-graph?]}]
  (when original-page-name
    (let [page-name (common-util/page-name-sanity-lc original-page-name)
          day (when date-formatter
                (date-time-util/journal-title->int
                 page-name
                 ;; When exporting, only use the configured date-formatter. Allowing for other date formatters allows
                 ;; for page names to change which breaks looking up journal refs for unconfigured journal pages
                 (if export-to-db-graph? [date-formatter] (date-time-util/safe-journal-title-formatters date-formatter))))]
      (if day
        (let [original-page-name' (date-time-util/int->journal-title day date-formatter)]
          [original-page-name' (common-util/page-name-sanity-lc original-page-name') day])
        [original-page-name page-name day]))))

(def convert-page-if-journal (memoize convert-page-if-journal-impl))

;; Hack to detect export as some fns are too deeply nested to be refactored to get explicit option
(def *export-to-db-graph? (atom false))

(defn- get-page
  "Similar to get-page but only for file graphs"
  [db page-name]
  (when (and db (string? page-name))
    (d/entity db
              (first (sort (map :e (entity-util/get-pages-by-name db page-name)))))))

(defn- page-name-string->map
  [original-page-name db date-formatter
   {:keys [with-timestamp? page-uuid from-page class? skip-existing-page-check?]}]
  (let [db-based? (entity-plus/db-based-graph? db)
        original-page-name (common-util/remove-boundary-slashes original-page-name)
        [original-page-name' page-name journal-day] (convert-page-if-journal original-page-name date-formatter {:export-to-db-graph? @*export-to-db-graph?})
        namespace? (and (or (not db-based?) @*export-to-db-graph?)
                        (not (boolean (text/get-nested-page-name original-page-name')))
                        (text/namespace-page? original-page-name'))
        page-entity (when (and db (not skip-existing-page-check?))
                      (if (and class? db-based?)
                        (some->> (ldb/page-exists? db original-page-name' #{:logseq.class/Tag})
                                 first
                                 (d/entity db))
                        (get-page db original-page-name')))
        original-page-name' (or from-page (:block/title page-entity) original-page-name')
        page (merge
              {:block/name page-name
               :block/title original-page-name'}
              (when (and original-page-name
                         (not= (string/lower-case original-page-name)
                               (string/lower-case original-page-name'))
                         (not @*export-to-db-graph?))
                {:block.temp/original-page-name original-page-name})
              (if (and class? page-entity (:db/ident page-entity))
                {:block/uuid (:block/uuid page-entity)
                 :db/ident (:db/ident page-entity)}
                (let [new-uuid* (if (uuid? page-uuid)
                                  page-uuid
                                  (if journal-day
                                    (common-uuid/gen-uuid :journal-page-uuid journal-day)
                                    (common-uuid/gen-uuid)))
                      new-uuid (if skip-existing-page-check?
                                 new-uuid*
                                 (or
                                  (cond page-entity       (:block/uuid page-entity)
                                        (uuid? page-uuid) page-uuid)
                                  new-uuid*))]
                  {:block/uuid new-uuid}))
              (when namespace?
                (let [namespace' (first (common-util/split-last "/" original-page-name))]
                  (when-not (string/blank? namespace')
                    {:block/namespace {:block/name (string/trim (common-util/page-name-sanity-lc namespace'))}})))
              (when (and with-timestamp? (or skip-existing-page-check? (not page-entity))) ;; Only assign timestamp on creating new entity
                (let [current-ms (common-util/time-ms)]
                  {:block/created-at current-ms
                   :block/updated-at current-ms}))
              (if journal-day
                (cond-> {:block/journal-day journal-day}
                  db-based?
                  (assoc :block/tags [:logseq.class/Journal])
                  (not db-based?)
                  (assoc :block/type "journal"))
                {}))]
    [page page-entity]))

(defn sanitize-hashtag-name
  "This must be kept in sync with its reverse operation in logseq.db.frontend.content"
  [s]
  (string/replace s "#" "HashTag-"))

(defn- page-entity?
  "Support DB or file graphs because of exporter"
  [entity]
  (or (entity-util/page? entity)
      (contains? #{"page" "journal"} (:block/type entity))))

;; TODO: refactor
(defn page-name->map
  "Create a page's map structure given a original page name (string).
   map as input is supported for legacy compatibility.
   `with-timestamp?`: assign timestampes to the map structure.
    Useful when creating new pages from references or namespaces,
    as there's no chance to introduce timestamps via editing in page
   `skip-existing-page-check?`: if true, allows pages to have the same name"
  [original-page-name db with-timestamp? date-formatter
   & {:keys [page-uuid class?] :as options}]
  (when-not (and db (common-util/uuid-string? original-page-name)
                 (not (page-entity? (d/entity db [:block/uuid (uuid original-page-name)]))))
    (let [db-based? (entity-plus/db-based-graph? db)
          original-page-name (cond-> (string/trim original-page-name)
                               db-based?
                               sanitize-hashtag-name)
          [page _page-entity] (cond
                                (and original-page-name (string? original-page-name))
                                (page-name-string->map original-page-name db date-formatter
                                                       (assoc options :with-timestamp? with-timestamp?))
                                :else
                                (let [page (cond (and (map? original-page-name) (:block/uuid original-page-name))
                                                 original-page-name

                                                 (map? original-page-name)
                                                 (assoc original-page-name :block/uuid (or page-uuid (d/squuid)))

                                                 :else
                                                 nil)]
                                  [page nil]))]
      (when page
        (if db-based?
          (let [tags (if class? [:logseq.class/Tag]
                         (or (:block/tags page)
                             [:logseq.class/Page]))]
            (assoc page :block/tags tags))
          (assoc page :block/type (or (:block/type page) "page")))))))

(defn- db-namespace-page?
  "Namespace page that're not journal pages"
  [db-based? page]
  (and db-based?
       (text/namespace-page? page)
       (not (common-date/valid-journal-title-with-slash? page))))

(defn- ref->map
  [db *col {:keys [date-formatter *name->id tag? db-based? structured-tags]}]
  (let [col (distinct (remove string/blank? @*col))
        children-pages (->> (mapcat (fn [p]
                                      (let [p (if (map? p)
                                                (:block/title p)
                                                p)]
                                        (when (string? p)
                                          (let [p (or (text/get-nested-page-name p) p)]
                                            (if (and (text/namespace-page? p) (not tag?))
                                              (common-util/split-namespace-pages p)
                                              [p])))))
                                    col)
                            (remove string/blank?)
                            (distinct))
        col (->> (distinct (concat col children-pages))
                 (remove nil?))
        export-to-db-graph? @*export-to-db-graph?]
    (map
     (fn [item]
       (let [macro? (and (map? item)
                         (= "macro" (:type item)))
             tag? (if export-to-db-graph?
                    tag?
                    (or (contains? structured-tags item) tag?))]
         (when-not macro?
           (let [m (page-name->map item db true date-formatter {:class? tag?})
                 result (cond->> m
                          (and db-based? tag? (not (:db/ident m)))
                          (db-class/build-new-class db))
                 page-name (if db-based? (:block/title result) (:block/name result))
                 id (get @*name->id page-name)]
             (when (nil? id)
               (swap! *name->id assoc page-name (:block/uuid result)))
             ;; Changing a :block/uuid should be done cautiously here as it can break
             ;; the identity of built-in concepts in db graphs
             (if (and id
                      (or (when-let [ident (:db/ident result)]
                            (nil? (d/entity db ident)))
                          export-to-db-graph?))
               (assoc result :block/uuid id)
               result))))) col)))

(defn- with-page-refs-and-tags
  [{:keys [title body tags refs marker priority] :as block} db date-formatter {:keys [structured-tags]
                                                                               :or {structured-tags #{}}}]
  (let [db-based? (and (entity-plus/db-based-graph? db) (not @*export-to-db-graph?))
        refs (->> (concat tags refs (when-not db-based? [marker priority]))
                  (remove string/blank?)
                  (distinct))
        *refs (atom refs)
        *structured-tags (atom (set structured-tags))]
    (walk/prewalk
     (fn [form]
       ;; skip custom queries
       (when-not (and (vector? form)
                      (= (first form) "Custom")
                      (= (second form) "query"))
         (when-let [page (get-page-reference form (get block :format :markdown))]
           (when-let [page' (when-not (db-namespace-page? db-based? page)
                              page)]
             (swap! *refs conj page')))
         (when-let [tag (get-tag form)]
           (let [tag (text/page-ref-un-brackets! tag)]
             (when-let [tag' (when-not (db-namespace-page? db-based? tag)
                               tag)]
               (when (common-util/tag-valid? tag')
                 (swap! *refs conj tag')
                 (swap! *structured-tags conj tag')))))
         form))
     (concat title body))
    (swap! *refs #(remove string/blank? %))
    (let [*name->id (atom {})
          ref->map-options {:db-based? db-based?
                            :date-formatter date-formatter
                            :*name->id *name->id
                            :structured-tags (set @*structured-tags)}
          refs (->> (ref->map db *refs ref->map-options)
                    (remove nil?)
                    (map (fn [ref]
                           (cond-> ref
                             (:block.temp/original-page-name ref)
                             (assoc :block.temp/original-page-name (:block.temp/original-page-name ref))))))
          tags (ref->map db *structured-tags (assoc ref->map-options :tag? true))]
      (assoc block
             :refs refs
             :tags tags))))

(defn- with-block-refs
  [{:keys [title body] :as block}]
  (let [ref-blocks (extract-block-refs (concat title body))
        refs (distinct (concat (:refs block) ref-blocks))]
    (assoc block :refs refs)))

(defn block-keywordize
  [block]
  (update-keys
   block
   (fn [k]
     (if (namespace k)
       k
       (keyword "block" k)))))

(defn- sanity-blocks-data
  "Clean up blocks data and add `block` ns to all keys"
  [blocks]
  (map (fn [block]
         (if (map? block)
           (block-keywordize (common-util/remove-nils-non-nested block))
           block))
       blocks))

(defn get-block-content
  [utf8-content block format meta' block-pattern]
  (let [content (if-let [end-pos (:end_pos meta')]
                  (utf8/substring utf8-content
                                  (:start_pos meta')
                                  end-pos)
                  (utf8/substring utf8-content
                                  (:start_pos meta')))
        content (when content
                  (let [content (text/remove-level-spaces content format block-pattern)]
                    (if (or (:pre-block? block)
                            (= (get block :format :markdown) :org))
                      content
                      (gp-mldoc/remove-indentation-spaces content (inc (:level block)) false))))]
    (if (= format :org)
      content
      (gp-property/->new-properties content))))

(defn get-custom-id-or-new-id
  [properties]
  (or (when-let [custom-id (or (get-in properties [:properties :custom-id])
                               (get-in properties [:properties :custom_id])
                               (get-in properties [:properties :id]))]
        ;; guard against non-string custom-ids
        (when-let [custom-id (and (string? custom-id) (string/trim custom-id))]
          (some-> custom-id parse-uuid)))
      (d/squuid)))

(defn get-page-refs-from-properties
  [properties db date-formatter user-config]
  (let [page-refs (get-page-ref-names-from-properties properties user-config)]
    (map (fn [page] (page-name->map page db true date-formatter)) page-refs)))

(defn- with-page-block-refs
  [block db date-formatter opts]
  (some-> block
          (with-page-refs-and-tags db date-formatter opts)
          with-block-refs
          (update :refs (fn [col] (remove nil? col)))))

(defn- macro->block
  "macro: {:name \"\" arguments [\"\"]}"
  [macro]
  {:block/uuid (common-uuid/gen-uuid)
   :block/type "macro"
   :block/properties {:logseq.macro-name (:name macro)
                      :logseq.macro-arguments (:arguments macro)}})

(defn extract-macros-from-ast
  [ast]
  (let [*result (atom #{})]
    (walk/postwalk
     (fn [f]
       (if (and (vector? f) (= (first f) "Macro"))
         (do
           (swap! *result conj (second f))
           nil)
         f))
     ast)
    (mapv macro->block @*result)))

(defn with-pre-block-if-exists
  [blocks body pre-block-properties encoded-content {:keys [db date-formatter user-config]}]
  (let [first-block (first blocks)
        first-block-start-pos (get-in first-block [:block/meta :start_pos])

        ;; Add pre-block
        blocks (if (or (> first-block-start-pos 0)
                       (empty? blocks))
                 (cons
                  (merge
                   (let [content (utf8/substring encoded-content 0 first-block-start-pos)
                         {:keys [properties properties-order properties-text-values invalid-properties]} pre-block-properties
                         id (get-custom-id-or-new-id {:properties properties})
                         property-refs (->> (get-page-refs-from-properties
                                             properties db date-formatter
                                             user-config)
                                            (map :block/title))
                         pre-block? (if (:heading properties) false true)
                         block {:block/uuid id
                                :block/title content
                                :block/level 1
                                :block/properties properties
                                :block/properties-order (vec properties-order)
                                :block/properties-text-values properties-text-values
                                :block/invalid-properties invalid-properties
                                :block/pre-block? pre-block?
                                :block/macros (extract-macros-from-ast body)
                                :block.temp/ast-body body}
                         {:keys [tags refs]}
                         (with-page-block-refs {:body body :refs property-refs} db date-formatter {})]
                     (cond-> block
                       tags
                       (assoc :block/tags tags)
                       true
                       (assoc :block/refs (concat refs (:block-refs pre-block-properties)))))
                   (select-keys first-block [:block/format :block/page]))
                  blocks)
                 blocks)]
    blocks))

(defn- with-heading-property
  [properties markdown-heading? size]
  (if markdown-heading?
    (assoc properties :heading size)
    properties))

(defn- construct-block
  [block properties* timestamps body encoded-content format pos-meta {:keys [block-pattern db date-formatter remove-properties? remove-logbook? remove-deadline-scheduled? db-graph-mode? export-to-db-graph?]}]
  (let [id (get-custom-id-or-new-id properties*)
        block-tags (and export-to-db-graph? (get-in properties* [:properties :tags]))
        ;; For export, remove tags from properties as they are being converted to classes
        properties (if (seq block-tags)
                     (-> properties*
                         (update :properties #(dissoc % :tags))
                         (update :properties-text-values #(dissoc % :tags))
                         (update :properties-order (fn [v] (remove #(= :tags %) v)))
                         (update :page-refs (fn [v] (remove #(= "tags" %) v))))
                     properties*)
        ref-pages-in-properties (->> (:page-refs properties)
                                     (remove string/blank?))
        block (second block)
        unordered? (:unordered block)
        markdown-heading? (and (:size block) (= :markdown format))
        block (if markdown-heading?
                (assoc block
                       :level (if unordered? (:level block) 1))
                block)
        block (cond->
               (-> (assoc block
                          :uuid id
                          :refs ref-pages-in-properties
                          :format format
                          :meta pos-meta)
                   (dissoc :size :unordered))
                (or (seq (:properties properties)) markdown-heading?)
                (assoc :properties (with-heading-property (:properties properties) markdown-heading? (:size block))
                       :properties-text-values (:properties-text-values properties)
                       :properties-order (vec (:properties-order properties)))

                (seq (:invalid-properties properties))
                (assoc :invalid-properties (:invalid-properties properties)))
        block (if (get-in block [:properties :collapsed])
                (-> (assoc block :collapsed? true)
                    (update :properties (fn [m] (dissoc m :collapsed)))
                    (update :properties-text-values dissoc :collapsed)
                    (update :properties-order (fn [keys'] (vec (remove #{:collapsed} keys')))))
                block)
        title (cond->> (get-block-content encoded-content block format pos-meta block-pattern)
                remove-properties?
                (gp-property/remove-properties (get block :format :markdown))
                remove-logbook?
                (gp-property/remove-logbook)
                remove-deadline-scheduled?
                (gp-property/remove-deadline-scheduled))
        block (assoc block :block/title title)
        block (if (seq timestamps)
                (merge block (timestamps->scheduled-and-deadline timestamps))
                block)
        db-based? (or db-graph-mode? export-to-db-graph?)
        block (-> block
                  (assoc :body body)
                  (with-page-block-refs db date-formatter
                    (cond-> {} (seq block-tags) (assoc :structured-tags block-tags))))
        block (if db-based? block
                  (-> block
                      (update :tags (fn [tags] (map #(assoc % :block/format format) tags)))
                      (update :refs (fn [refs] (map #(if (map? %) (assoc % :block/format format) %) refs)))))
        block (update block :refs concat (:block-refs properties))
        {:keys [created-at updated-at]} (:properties properties)
        block (cond-> block
                (and created-at (integer? created-at))
                (assoc :block/created-at created-at)

                (and updated-at (integer? updated-at))
                (assoc :block/updated-at updated-at))]
    (dissoc block :title :body :anchor)))

(defn fix-duplicate-id
  [block]
  (println "Logseq will assign a new id for block with content:" (pr-str (:block/title block)))
  (-> block
      (assoc :block/uuid (d/squuid))
      (update :block/properties dissoc :id)
      (update :block/properties-text-values dissoc :id)
      (update :block/properties-order #(vec (remove #{:id} %)))
      (update :block/title (fn [c]
                             (let [replace-str (re-pattern
                                                (str
                                                 "\n*\\s*"
                                                 (if (= :markdown (get block :block/format :markdown))
                                                   (str "id" gp-property/colons " " (:block/uuid block))
                                                   (str (gp-property/colons-org "id") " " (:block/uuid block)))))]
                               (string/replace-first c replace-str ""))))))

(defn fix-block-id-if-duplicated!
  "If the block exists in another page or the current page, we need to fix it"
  [db page-name *extracted-block-ids block]
  (let [block-page-name (:block/name (:block/page (d/entity db [:block/uuid (:block/uuid block)])))
        block (if (or (and block-page-name (not= block-page-name page-name))
                      (contains? @*extracted-block-ids (:block/uuid block)))
                (fix-duplicate-id block)
                block)]
    (swap! *extracted-block-ids conj (:block/uuid block))
    block))

(defn extract-blocks
  "Extract headings from mldoc ast. Args:
  * `ast`: mldoc ast.
  * `content`: markdown or org-mode text.
  * `format`: content's format, it could be either :markdown or :org-mode.
  * `options`: Options are :user-config, :block-pattern, :date-formatter, :db and
     * :db-graph-mode? : Set when a db graph in the frontend
     * :export-to-db-graph? : Set when exporting to a db graph"
  [ast content format {:keys [user-config db-graph-mode? export-to-db-graph?] :as options}]
  {:pre [(seq ast) (string? content) (contains? #{:markdown :org} format)]}
  (let [encoded-content (utf8/encode content)
        all-blocks (vec (reverse ast))
        [blocks body pre-block-properties]
        (loop [headings []
               ast-blocks (reverse ast)
               block-idx 0
               timestamps {}
               properties {}
               body []
               prev-block-num 0]
          (if (seq ast-blocks)
            (let [[ast-block pos-meta] (first ast-blocks)]
              (cond
                (paragraph-timestamp-block? ast-block)
                (let [ts (extract-timestamps ast-block)
                      timestamps' (merge timestamps ts)]
                  (recur headings (rest ast-blocks) (inc block-idx) timestamps' properties body (inc prev-block-num)))

                (gp-property/properties-ast? ast-block)
                (let [properties (extract-properties (second ast-block) (assoc user-config :format format))]
                  (recur headings (rest ast-blocks) (inc block-idx) timestamps properties body (inc prev-block-num)))

                (heading-block? ast-block)
                (let [cut-multiline? (and export-to-db-graph? (= prev-block-num 0))
                      prev-blocks (map first (subvec all-blocks (max 0 (- block-idx prev-block-num)) block-idx))
                      pos-meta' (if cut-multiline?
                                  pos-meta
                                  ;; fix start_pos
                                  (assoc pos-meta :end_pos
                                         (if (seq headings)
                                           (get-in (last headings) [:meta :start_pos])
                                           nil)))
                      ;; Remove properties, deadline/scheduled and logbook text from title in db graphs
                      options' (assoc options
                                      :remove-properties?
                                      (and export-to-db-graph? (some gp-property/properties-ast? prev-blocks))
                                      :remove-logbook?
                                      (and export-to-db-graph? (some #(= ["Drawer" "logbook"] (take 2 %)) prev-blocks))
                                      :remove-deadline-scheduled?
                                      (and export-to-db-graph? (some #(seq (set/intersection (set (flatten %)) #{"Deadline" "Scheduled"})) prev-blocks)))
                      block' (construct-block ast-block properties timestamps body encoded-content format pos-meta' options')
                      block'' (cond
                                db-graph-mode?
                                block'
                                export-to-db-graph?
                                (assoc block' :block.temp/ast-blocks (cons ast-block body))
                                :else
                                (assoc block' :macros (extract-macros-from-ast (cons ast-block body))))]
                  (recur (conj headings block'') (rest ast-blocks) (inc block-idx) {} {} [] 0))

                :else
                (recur headings (rest ast-blocks) (inc block-idx) timestamps properties (conj body ast-block) (inc prev-block-num))))
            [(-> (reverse headings)
                 sanity-blocks-data)
             body
             properties]))
        result (with-pre-block-if-exists blocks body pre-block-properties encoded-content options)]
    (map #(dissoc % :block/meta) result)))

(defn with-parent-and-order
  [page-id blocks]
  (let [[blocks other-blocks] (split-with
                               (fn [b]
                                 (not= "macro" (:block/type b)))
                               blocks)
        result (loop [blocks (map (fn [block] (assoc block :block/level-spaces (:block/level block))) blocks)
                      parents [{:page/id page-id     ; db id or a map {:block/name "xxx"}
                                :block/level 0
                                :block/level-spaces 0}]
                      result []]
                 (if (empty? blocks)
                   (map #(dissoc % :block/level-spaces) result)
                   (let [[block & others] blocks
                         level-spaces (:block/level-spaces block)
                         {uuid' :block/uuid :block/keys [level parent] :as last-parent} (last parents)
                         parent-spaces (:block/level-spaces last-parent)
                         [blocks parents result]
                         (cond
                           (= level-spaces parent-spaces)        ; sibling
                           (let [block (assoc block
                                              :block/parent parent
                                              :block/level level)
                                 parents' (conj (vec (butlast parents)) block)
                                 result' (conj result block)]
                             [others parents' result'])

                           (> level-spaces parent-spaces)         ; child
                           (let [parent (if uuid' [:block/uuid uuid'] (:page/id last-parent))
                                 block (cond->
                                        (assoc block
                                               :block/parent parent)
                                         ;; fix block levels with wrong order
                                         ;; For example:
                                         ;;   - a
                                         ;; - b
                                         ;; What if the input indentation is two spaces instead of 4 spaces
                                         (>= (- level-spaces parent-spaces) 1)
                                         (assoc :block/level (inc level)))
                                 parents' (conj parents block)
                                 result' (conj result block)]
                             [others parents' result'])

                           (< level-spaces parent-spaces)
                           (cond
                             (some #(= (:block/level-spaces %) (:block/level-spaces block)) parents) ; outdent
                             (let [parents' (vec (filter (fn [p] (<= (:block/level-spaces p) level-spaces)) parents))
                                   blocks (cons (assoc (first blocks)
                                                       :block/level (dec level))
                                                (rest blocks))]
                               [blocks parents' result])

                             :else
                             (let [[f r] (split-with (fn [p] (<= (:block/level-spaces p) level-spaces)) parents)
                                   left (first r)
                                   parent-id (if-let [block-id (:block/uuid (last f))]
                                               [:block/uuid block-id]
                                               page-id)
                                   block (assoc block
                                                :block/parent parent-id
                                                :block/level (:block/level left)
                                                :block/level-spaces (:block/level-spaces left))

                                   parents' (->> (concat f [block]) vec)
                                   result' (conj result block)]
                               [others parents' result'])))]
                     (recur blocks parents result))))
        result' (map (fn [block] (assoc block :block/order (db-order/gen-key))) result)]
    (concat result' other-blocks)))