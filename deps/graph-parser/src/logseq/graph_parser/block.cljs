(ns logseq.graph-parser.block
  "Block related code needed for graph-parser"
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.utf8 :as utf8]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.util :as gp-util]
            [logseq.graph-parser.config :as gp-config]
            [logseq.graph-parser.mldoc :as gp-mldoc]
            [logseq.graph-parser.date-time-util :as date-time-util]))

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
  [block supported-formats]
  (let [page (cond
               (and (vector? block) (= "Link" (first block)))
               (let [typ (first (:url (second block)))
                     value (second (:url (second block)))]
                 ;; {:url ["File" "file:../pages/hello_world.org"], :label [["Plain" "hello world"]], :title nil}
                 (or
                  (and
                   (= typ "Page_ref")
                   (and (string? value)
                        (not (or (gp-config/local-asset? value)
                                 (gp-config/draw? value))))
                   value)

                  (and
                   (= typ "Search")
                   (text/page-ref? value)
                   (text/page-ref-un-brackets! value))

                  (and
                   (= typ "Search")
                   (not (contains? #{\# \* \/ \[} (first value)))
                   (let [ext (some-> (gp-util/get-file-ext value) keyword)]
                     (when (and (not (string/starts-with? value "http:"))
                                (not (string/starts-with? value "https:"))
                                (not (string/starts-with? value "file:"))
                                (not (gp-config/local-asset? value))
                                (or (= ext :excalidraw)
                                    (not (contains? supported-formats ext))))
                       value)))

                  (and
                   (= typ "Complex")
                   (= (:protocol value) "file")
                   (:link value))

                  (and
                   (= typ "File")
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
    (text/block-ref-un-brackets! page)))

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
                                     (string/starts-with? (first arguments) "((")
                                     (string/ends-with? (first arguments) "))"))
                            (subs (first arguments) 2 (- (count (first arguments)) 2))))

                        (and (vector? block)
                             (= "Link" (first block))
                             (map? (second block)))
                        (if (= "id" (:protocol (second (:url (second block)))))
                          (:link (second (:url (second block))))
                          (let [id (second (:url (second block)))]
                            (text/block-ref-un-brackets! id)))

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

;; TODO: we should move this to mldoc
(defn extract-properties
  [format properties user-config]
  (when (seq properties)
    (let [properties (seq properties)
          page-refs (->>
                     properties
                     (remove (fn [[k _]]
                               (contains? #{:background-color :background_color} (keyword k))))
                     (map last)
                     (map (fn [v]
                            (when (and (string? v)
                                       (not (gp-mldoc/link? format v)))
                              (let [v (string/trim v)
                                    result (text/split-page-refs-without-brackets v {:un-brackets? false})]
                                (if (coll? result)
                                  (map text/page-ref-un-brackets! result)
                                  [])))))
                     (apply concat)
                     (remove string/blank?))
          properties (->> properties
                          (map (fn [[k v]]
                                 (let [k (-> (string/lower-case (name k))
                                             (string/replace " " "-")
                                             (string/replace "_" "-"))
                                       k (if (contains? #{"custom_id" "custom-id"} k)
                                           "id"
                                           k)
                                       v (if (coll? v)
                                           (remove string/blank? v)
                                           (cond
                                             (string/blank? v)
                                             nil
                                             (and (= (keyword k) :file-path)
                                                  (string/starts-with? v "file:"))
                                             v
                                             :else
                                             (text/parse-property format k v user-config)))
                                       k (keyword k)
                                       v (if (and
                                              (string? v)
                                              (contains? #{:alias :aliases :tags} k))
                                           (set [v])
                                           v)
                                       v (if (coll? v) (set v) v)]
                                   [k v])))
                          (remove #(nil? (second %))))]
      {:properties (into {} properties)
       :properties-order (map first properties)
       :page-refs page-refs})))

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

(defn convert-page-if-journal
  "Convert journal file name to user' custom date format"
  [original-page-name date-formatter]
  (when original-page-name
    (let [page-name (gp-util/page-name-sanity-lc original-page-name)
          day (date-time-util/journal-title->int page-name (date-time-util/safe-journal-title-formatters date-formatter))]
     (if day
       (let [original-page-name (date-time-util/int->journal-title day date-formatter)]
         [original-page-name (gp-util/page-name-sanity-lc original-page-name) day])
       [original-page-name page-name day]))))

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
  [original-page-name with-id? db with-timestamp? date-formatter]
  (cond
    (and original-page-name (string? original-page-name))
    (let [original-page-name (gp-util/remove-boundary-slashes original-page-name)
          [original-page-name page-name journal-day] (convert-page-if-journal original-page-name date-formatter)
          namespace? (and (not (boolean (text/get-nested-page-name original-page-name)))
                          (text/namespace-page? original-page-name))
          page-entity (some-> db (d/entity [:block/name page-name]))
          original-page-name (or (:block/original-name page-entity) original-page-name)]
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
  [{:keys [title body tags refs marker priority] :as block} with-id? supported-formats db date-formatter]
  (let [refs (->> (concat tags refs [marker priority])
                  (remove string/blank?)
                  (distinct))
        refs (atom refs)]
    (walk/prewalk
     (fn [form]
       ;; skip custom queries
       (when-not (and (vector? form)
                      (= (first form) "Custom")
                      (= (second form) "query"))
         (when-let [page (get-page-reference form supported-formats)]
           (swap! refs conj page))
         (when-let [tag (get-tag form)]
           (let [tag (text/page-ref-un-brackets! tag)]
             (when (gp-util/tag-valid? tag)
               (swap! refs conj tag))))
         form))
     (concat title body))
    (let [refs (remove string/blank? @refs)
          children-pages (->> (mapcat (fn [p]
                                        (let [p (if (map? p)
                                                  (:block/original-name p)
                                                  p)]
                                          (when (string? p)
                                            (let [p (or (text/get-nested-page-name p) p)]
                                              (when (text/namespace-page? p)
                                                (gp-util/split-namespace-pages p))))))
                                      refs)
                              (remove string/blank?)
                              (distinct))
          refs (->> (distinct (concat refs children-pages))
                    (remove nil?))
          refs (map (fn [ref] (page-name->map ref with-id? db true date-formatter)) refs)]
      (assoc block :refs refs))))

(defn- with-block-refs
  [{:keys [title body] :as block}]
  (let [ref-blocks (atom nil)]
    (walk/postwalk
     (fn [form]
       (when-let [block (get-block-reference form)]
         (swap! ref-blocks conj block))
       form)
     (concat title body))
    (let [ref-blocks (keep (fn [block]
                             (when-let [id (parse-uuid block)]
                               [:block/uuid id]))
                           @ref-blocks)
          refs (distinct (concat (:refs block) ref-blocks))]
      (assoc block :refs refs))))

(defn- block-keywordize
  [block]
  (update-keys
   block
   (fn [k]
     (if (namespace k)
       k
       (keyword "block" k)))))

(defn- sanity-blocks-data
  [blocks]
  (map (fn [block]
         (if (map? block)
           (block-keywordize (gp-util/remove-nils block))
           block))
       blocks))

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

(defn- block-tags->pages
  [{:keys [tags] :as block}]
  (if (seq tags)
    (assoc block :tags (map (fn [tag]
                              (let [tag (text/page-ref-un-brackets! tag)]
                                [:block/name (gp-util/page-name-sanity-lc tag)])) tags))
    block))

(defn- get-block-content
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

(defn- get-custom-id-or-new-id
  [properties]
  (or (when-let [custom-id (or (get-in properties [:properties :custom-id])
                               (get-in properties [:properties :custom_id])
                               (get-in properties [:properties :id]))]
        ;; guard against non-string custom-ids
        (when-let [custom-id (and (string? custom-id) (string/trim custom-id))]
          (some-> custom-id parse-uuid)))
      (d/squuid)))

(defn get-page-refs-from-properties
  [properties db date-formatter]
  (let [page-refs (mapcat (fn [v] (cond
                                   (coll? v)
                                   v

                                   (text/page-ref? v)
                                   [(text/page-ref-un-brackets! v)]

                                   :else
                                   nil)) (vals properties))
        page-refs (remove string/blank? page-refs)]
    (map (fn [page] (page-name->map page true db true date-formatter)) page-refs)))

(defn- with-page-block-refs
  [block with-id? supported-formats db date-formatter]
  (some-> block
          (with-page-refs with-id? supported-formats db date-formatter)
          with-block-refs
          block-tags->pages
          (update :refs (fn [col] (remove nil? col)))))

(defn- with-pre-block-if-exists
  [blocks body pre-block-properties encoded-content {:keys [supported-formats db date-formatter]}]
  (let [first-block (first blocks)
        first-block-start-pos (get-in first-block [:block/meta :start_pos])

        ;; Add pre-block
        blocks (if (or (> first-block-start-pos 0)
                       (empty? blocks))
                 (cons
                  (merge
                   (let [content (utf8/substring encoded-content 0 first-block-start-pos)
                         {:keys [properties properties-order]} pre-block-properties
                         id (get-custom-id-or-new-id {:properties properties})
                         property-refs (->> (get-page-refs-from-properties properties db date-formatter)
                                            (map :block/original-name))
                         block {:uuid id
                                :content content
                                :level 1
                                :properties properties
                                :properties-order properties-order
                                :refs property-refs
                                :pre-block? true
                                :unordered true
                                :body body}
                         block (with-page-block-refs block false supported-formats db date-formatter)]
                     (block-keywordize block))
                   (select-keys first-block [:block/format :block/page]))
                  blocks)
                 blocks)]
    (with-path-refs blocks)))

(defn- construct-block
  [block properties timestamps body encoded-content format pos-meta with-id? {:keys [block-pattern supported-formats db date-formatter]}]
  (let [id (get-custom-id-or-new-id properties)
        ref-pages-in-properties (->> (:page-refs properties)
                                     (remove string/blank?))
        block (second block)
        unordered? (:unordered block)
        markdown-heading? (and (:size block) (= :markdown format))
        block (if markdown-heading?
                (assoc block
                       :type :heading
                       :level (if unordered? (:level block) 1)
                       :heading-level (or (:size block) 6))
                block)
        block (cond->
                (assoc block
                       :uuid id
                       :refs ref-pages-in-properties
                       :format format
                       :meta pos-meta)
                (seq (:properties properties))
                (assoc :properties (:properties properties))

                (seq (:properties-order properties))
                (assoc :properties-order (:properties-order properties)))
        block (if (get-in block [:properties :collapsed])
                (-> (assoc block :collapsed? true)
                    (update :properties (fn [m] (dissoc m :collapsed)))
                    (update :properties-order (fn [keys] (vec (remove #{:collapsed} keys)))))
                block)
        block (assoc block
                     :content (get-block-content encoded-content block format pos-meta block-pattern))
        block (if (seq timestamps)
                (merge block (timestamps->scheduled-and-deadline timestamps))
                block)
        block (assoc block :body body)
        block (with-page-block-refs block with-id? supported-formats db date-formatter)
        {:keys [created-at updated-at]} (:properties properties)
        block (cond-> block
                (and created-at (integer? created-at))
                (assoc :block/created-at created-at)

                (and updated-at (integer? updated-at))
                (assoc :block/updated-at updated-at))]
    (dissoc block :title :body :anchor)))

(defn extract-blocks
  "Extract headings from mldoc ast.
  Args:
    `blocks`: mldoc ast.
    `content`: markdown or org-mode text.
    `with-id?`: If `with-id?` equals to true, all the referenced pages will have new db ids.
    `format`: content's format, it could be either :markdown or :org-mode.
    `options`: Options supported are :user-config, :block-pattern :supported-formats,
     :date-formatter and :db"
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
                (let [properties (extract-properties format (second block) user-config)]
                  (recur headings (rest blocks) timestamps properties body))

                (heading-block? block)
                (let [block (construct-block block properties timestamps body encoded-content format pos-meta with-id? options)]
                  (recur (conj headings block) (rest blocks) {} {} []))

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
  (loop [blocks (map (fn [block] (assoc block :block/level-spaces (:block/level block))) blocks)
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
        (recur blocks parents result)))))
