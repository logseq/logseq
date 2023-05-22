(ns logseq.graph-parser.block
  "Given mldoc ast, prepares block data in preparation for db transaction"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.date-time-util :as date-time-util]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.utf8 :as utf8]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.util.block-ref :as block-ref]
            [logseq.graph-parser.util.page-ref :as page-ref]))

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

(defn- get-page-reference
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
                        (not (or (gp-config/local-asset? value)
                                 (gp-config/draw? value))))
                   value)

                  (and
                   (= url-type "Search")
                   (page-ref/page-ref? value)
                   (text/page-ref-un-brackets! value))

                  (and (= url-type "Search")
                       (= format :org)
                       (not (gp-config/local-asset? value))
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
                   (when (= name "embed")
                     (text/page-ref-un-brackets! argument)))

               (and (vector? block)
                    (= "Tag" (first block)))
               (let [text (get-tag block)]
                 (text/page-ref-un-brackets! text))

               :else
               nil)]
    (when page (or (block-ref/get-block-ref-id page) page))))

(defn- get-block-reference
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

(defn- paragraph-block?
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
                                (gp-property/editable-built-in-properties)
                                (gp-property/hidden-built-in-properties))))
           (distinct))
     properties)
    []))

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
                   (mapcat (or (:extract-refs-from-property-value-fn user-config)
                               text/extract-refs-from-mldoc-ast))
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
                                day (js/parseInt (str year (gp-util/zero-pad month) (gp-util/zero-pad day)))]
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
  [original-page-name date-formatter]
  (when original-page-name
    (let [page-name (gp-util/page-name-sanity-lc original-page-name)
          day (date-time-util/journal-title->int page-name (date-time-util/safe-journal-title-formatters date-formatter))]
     (if day
       (let [original-page-name (date-time-util/int->journal-title day date-formatter)]
         [original-page-name (gp-util/page-name-sanity-lc original-page-name) day])
       [original-page-name page-name day]))))

(def convert-page-if-journal (memoize convert-page-if-journal-impl))

;; TODO: refactor
(defn page-name->map
  "Create a page's map structure given a original page name (string).
   map as input is supported for legacy compatibility.
   with-id?: if true, assign uuid to the map structure.
    if the page entity already exists, no-op.
    else, if with-id? is a uuid, the uuid is used.
    otherwise, generate a uuid.
   with-timestamp?: assign timestampes to the map structure.
    Useful when creating new pages from references or namespaces,
    as there's no chance to introduce timestamps via editing in page"
  [original-page-name with-id? db with-timestamp? date-formatter
   & {:keys [from-page]}]
  (cond
    (and original-page-name (string? original-page-name))
    (let [original-page-name (gp-util/remove-boundary-slashes original-page-name)
          [original-page-name page-name journal-day] (convert-page-if-journal original-page-name date-formatter)
          namespace? (and (not (boolean (text/get-nested-page-name original-page-name)))
                          (text/namespace-page? original-page-name))
          page-entity (some-> db (d/entity [:block/name page-name]))
          original-page-name (or from-page (:block/original-name page-entity) original-page-name)]
      (merge
       {:block/name page-name
        :block/original-name original-page-name}
       (when with-id?
         (let [new-uuid (cond page-entity      (:block/uuid page-entity)
                              (uuid? with-id?) with-id?
                              :else            (d/squuid))]
           {:block/uuid new-uuid}))
       (when namespace?
         (let [namespace (first (gp-util/split-last "/" original-page-name))]
           (when-not (string/blank? namespace)
             {:block/namespace {:block/name (gp-util/page-name-sanity-lc namespace)}})))
       (when (and with-timestamp? (not page-entity)) ;; Only assign timestamp on creating new entity
         (let [current-ms (date-time-util/time-ms)]
           {:block/created-at current-ms
            :block/updated-at current-ms}))
       (if journal-day
         {:block/journal? true
          :block/journal-day journal-day}
         {:block/journal? false})))

    (and (map? original-page-name) (:block/uuid original-page-name))
    original-page-name

    (and (map? original-page-name) with-id?)
    (assoc original-page-name :block/uuid (d/squuid))

    :else
    nil))

(defn- with-page-refs
  [{:keys [title body tags refs marker priority] :as block} with-id? db date-formatter]
  (let [refs (->> (concat tags refs [marker priority])
                  (remove string/blank?)
                  (distinct))
        *refs (atom refs)]
    (walk/prewalk
     (fn [form]
       ;; skip custom queries
       (when-not (and (vector? form)
                      (= (first form) "Custom")
                      (= (second form) "query"))
         (when-let [page (get-page-reference form (:format block))]
           (swap! *refs conj page))
         (when-let [tag (get-tag form)]
           (let [tag (text/page-ref-un-brackets! tag)]
             (when (gp-util/tag-valid? tag)
               (swap! *refs conj tag))))
         form))
     (concat title body))
    (swap! *refs #(remove string/blank? %))
    (let [children-pages (->> @*refs
                              (mapcat (fn [p]
                                        (let [p (if (map? p)
                                                  (:block/original-name p)
                                                  p)]
                                          (when (string? p)
                                            (let [p (or (text/get-nested-page-name p) p)]
                                              (when (text/namespace-page? p)
                                                (gp-util/split-namespace-pages p)))))))
                              (remove string/blank?)
                              (distinct))
          refs' (->> (distinct (concat @*refs children-pages))
                     (remove nil?)
                     (map (fn [ref] (page-name->map ref with-id? db true date-formatter))))]
      (assoc block :refs refs'))))

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
           (block-keywordize (gp-util/remove-nils-non-nested block))
           block))
       blocks))

(defn- block-tags->pages
  [{:keys [tags] :as block}]
  (if (seq tags)
    (assoc block :tags (map (fn [tag]
                              (let [tag (text/page-ref-un-brackets! tag)]
                                [:block/name (gp-util/page-name-sanity-lc tag)])) tags))
    block))

(defn get-block-content
  [utf8-content block format meta block-pattern]
  (let [content (if-let [end-pos (:end_pos meta)]
                  (utf8/substring utf8-content
                                  (:start_pos meta)
                                  end-pos)
                  (utf8/substring utf8-content
                                  (:start_pos meta)))
        content (when content
                  (let [content (text/remove-level-spaces content format block-pattern)]
                    (if (or (:pre-block? block)
                            (= (:format block) :org))
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
    (map (fn [page] (page-name->map page true db true date-formatter)) page-refs)))

(defn- with-page-block-refs
  [block with-id? db date-formatter]
  (some-> block
          (with-page-refs with-id? db date-formatter)
          with-block-refs
          block-tags->pages
          (update :refs (fn [col] (remove nil? col)))))

(defn- with-path-refs
  [blocks]
  (loop [blocks blocks
         acc []
         parents []]
    (if (empty? blocks)
      acc
      (let [block (first blocks)
            cur-level (:block/level block)
            level-diff (- cur-level
                          (get (last parents) :block/level 0))
            [path-refs parents]
            (cond
              (zero? level-diff)            ; sibling
              (let [path-refs (mapcat :block/refs (drop-last parents))
                    parents (conj (vec (butlast parents)) block)]
                [path-refs parents])

              (> level-diff 0)              ; child
              (let [path-refs (mapcat :block/refs parents)]
                [path-refs (conj parents block)])

              (< level-diff 0)              ; new parent
              (let [parents (vec (take-while (fn [p] (< (:block/level p) cur-level)) parents))
                    path-refs (mapcat :block/refs parents)]
                [path-refs (conj parents block)]))
            path-ref-pages (->> path-refs
                                (concat (:block/refs block))
                                (map (fn [ref]
                                       (cond
                                         (map? ref)
                                         (:block/name ref)

                                         :else
                                         ref)))
                                (remove string/blank?)
                                (map (fn [ref]
                                       (if (string? ref)
                                         {:block/name (gp-util/page-name-sanity-lc ref)}
                                         ref)))
                                (remove vector?)
                                (remove nil?)
                                (distinct))]
        (recur (rest blocks)
               (conj acc (assoc block :block/path-refs path-ref-pages))
               parents)))))

(defn- macro->block
  "macro: {:name \"\" arguments [\"\"]}"
  [macro]
  {:db/ident (str (:name macro) " " (string/join " " (:arguments macro)))
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
                                             (assoc user-config
                                                    :extract-refs-from-property-value-fn
                                                    (fn [refs]
                                                      (when (coll? refs)
                                                        refs))))
                                            (map :block/original-name))
                         block {:block/uuid id
                                :block/content content
                                :block/level 1
                                :block/properties properties
                                :block/properties-order (vec properties-order)
                                :block/properties-text-values properties-text-values
                                :block/invalid-properties invalid-properties
                                :block/pre-block? true
                                :block/unordered true
                                :block/macros (extract-macros-from-ast body)
                                :block/body body}
                         {:keys [tags refs]}
                         (with-page-block-refs {:body body :refs property-refs} false db date-formatter)]
                     (cond-> block
                             tags
                             (assoc :block/tags tags)
                             true
                             (assoc :block/refs (concat refs (:block-refs pre-block-properties)))))
                   (select-keys first-block [:block/format :block/page]))
                  blocks)
                 blocks)]
    (with-path-refs blocks)))

(defn- with-heading-property
  [properties markdown-heading? size]
  (if markdown-heading?
    (assoc properties :heading size)
    properties))

(defn- construct-block
  [block properties timestamps body encoded-content format pos-meta with-id? {:keys [block-pattern db date-formatter]}]
  (let [id (get-custom-id-or-new-id properties)
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
                    (dissoc :size))
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
                    (update :properties-order (fn [keys] (vec (remove #{:collapsed} keys)))))
                block)
        block (assoc block
                     :content (get-block-content encoded-content block format pos-meta block-pattern))
        block (if (seq timestamps)
                (merge block (timestamps->scheduled-and-deadline timestamps))
                block)
        block (assoc block :body body)
        block (with-page-block-refs block with-id? db date-formatter)
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
  (println "Logseq will assign a new id for this block: " block)
  (-> block
      (assoc :block/uuid (d/squuid))
      (update :block/properties dissoc :id)
      (update :block/properties-text-values dissoc :id)
      (update :block/properties-order #(vec (remove #{:id} %)))
      (update :block/content (fn [c]
                         (let [replace-str (re-pattern
                                            (str
                                             "\n*\\s*"
                                             (if (= :markdown (:block/format block))
                                               (str "id" gp-property/colons " " (:block/uuid block))
                                               (str (gp-property/colons-org "id") " " (:block/uuid block)))))]
                           (string/replace-first c replace-str ""))))))

(defn block-exists-in-another-page? 
  "For sanity check only.
   For renaming file externally, the file is actually deleted and transacted before-hand."
  [db block-uuid current-page-name]
  (when (and db current-page-name)
    (when-let [block-page-name (:block/name (:block/page (d/entity db [:block/uuid block-uuid])))]
      (not= current-page-name block-page-name))))

(defn fix-block-id-if-duplicated!
  "If the block exists in another page, we need to fix it
   If the block exists in the current extraction process, we also need to fix it"
  [db page-name *block-exists-in-extraction block]
  (let [block (if (or (@*block-exists-in-extraction (:block/uuid block))
                      (block-exists-in-another-page? db (:block/uuid block) page-name))
                (fix-duplicate-id block)
                block)]
    (swap! *block-exists-in-extraction conj (:block/uuid block))
    block))

(defn extract-blocks
  "Extract headings from mldoc ast.
  Args:
    `blocks`: mldoc ast.
    `content`: markdown or org-mode text.
    `with-id?`: If `with-id?` equals to true, all the referenced pages will have new db ids.
    `format`: content's format, it could be either :markdown or :org-mode.
    `options`: Options supported are :user-config, :block-pattern,
               :extract-macros, :date-formatter, :page-name and :db"
  [blocks content with-id? format {:keys [user-config] :as options}]
  {:pre [(seq blocks) (string? content) (boolean? with-id?) (contains? #{:markdown :org} format)]}
  (let [encoded-content (utf8/encode content)
        [blocks body pre-block-properties]
        (loop [headings []
               blocks (reverse blocks)
               timestamps {}
               properties {}
               body []]
          (if (seq blocks)
            (let [[block pos-meta] (first blocks)
                  ;; fix start_pos
                  pos-meta (assoc pos-meta :end_pos
                                  (if (seq headings)
                                    (get-in (last headings) [:meta :start_pos])
                                    nil))]
              (cond
                (paragraph-timestamp-block? block)
                (let [timestamps (extract-timestamps block)
                      timestamps' (merge timestamps timestamps)]
                  (recur headings (rest blocks) timestamps' properties body))

                (gp-property/properties-ast? block)
                (let [properties (extract-properties (second block) (assoc user-config :format format))]
                  (recur headings (rest blocks) timestamps properties body))

                (heading-block? block)
                (let [block' (construct-block block properties timestamps body encoded-content format pos-meta with-id? options)
                      block'' (assoc block' :macros (extract-macros-from-ast (cons block body)))]
                  (recur (conj headings block'') (rest blocks) {} {} []))

                :else
                (recur headings (rest blocks) timestamps properties (conj body block))))
            [(-> (reverse headings)
                 sanity-blocks-data)
             body
             properties]))
        result (with-pre-block-if-exists blocks body pre-block-properties encoded-content options)]
    (map #(dissoc % :block/meta) result)))

(defn with-parent-and-left
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
                         {:block/keys [uuid level parent] :as last-parent} (last parents)
                         parent-spaces (:block/level-spaces last-parent)
                         [blocks parents result]
                         (cond
                           (= level-spaces parent-spaces)        ; sibling
                           (let [block (assoc block
                                              :block/parent parent
                                              :block/left [:block/uuid uuid]
                                              :block/level level)
                                 parents' (conj (vec (butlast parents)) block)
                                 result' (conj result block)]
                             [others parents' result'])

                           (> level-spaces parent-spaces)         ; child
                           (let [parent (if uuid [:block/uuid uuid] (:page/id last-parent))
                                 block (cond->
                                         (assoc block
                                                :block/parent parent
                                                :block/left parent)
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
                                   left (last parents')
                                   blocks (cons (assoc (first blocks)
                                                       :block/level (dec level)
                                                       :block/left [:block/uuid (:block/uuid left)])
                                                (rest blocks))]
                               [blocks parents' result])

                             :else
                             (let [[f r] (split-with (fn [p] (<= (:block/level-spaces p) level-spaces)) parents)
                                   left (first r)
                                   parent-id (if-let [block-id (:block/uuid (last f))]
                                               [:block/uuid block-id]
                                               page-id)
                                   block (cond->
                                           (assoc block
                                                  :block/parent parent-id
                                                  :block/left [:block/uuid (:block/uuid left)]
                                                  :block/level (:block/level left)
                                                  :block/level-spaces (:block/level-spaces left)))

                                   parents' (->> (concat f [block]) vec)
                                   result' (conj result block)]
                               [others parents' result'])))]
                     (recur blocks parents result))))]
    (concat result other-blocks)))
