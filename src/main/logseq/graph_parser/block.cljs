(ns logseq.graph-parser.block
  "Modified version of frontend.format.block"
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            ; [cljs.core.match :as match]
            ; [frontend.config :as config]
            ; [frontend.date :as date]
            ; [frontend.format :as format]
            ; [frontend.state :as state]
            [logseq.graph-parser.text :as text]
            [frontend.utf8 :as utf8]
            [logseq.graph-parser.util :as util]
            [logseq.graph-parser.property :as property]
            [logseq.graph-parser.mldoc :as mldoc]
            ; [lambdaisland.glogi :as log]
            [datascript.core :as d]))

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
    (-> tag-value
        ;; TODO: Pull in match
        #_(map (fn [e]
               (match/match e
                            ["Plain" s]
                            s
                            ["Link" t]
                            (let [{full_text :full_text} t]
                              full_text)
                            ["Nested_link" t]
                            (let [ {content :content} t]
                              content)
                            :else
                            ""
                            )) tag-value)
        (string/join))))

(defn get-page-reference
  [block]
  (let [page (cond
               (and (vector? block) (= "Link" (first block)))
               (let [typ (first (:url (second block)))
                     value (second (:url (second block)))]
                 ;; {:url ["File" "file:../pages/hello_world.org"], :label [["Plain" "hello world"]], :title nil}
                 (or
                  (and
                   (= typ "Page_ref")
                   (and (string? value)
                        ;; TODO: Support config
                        #_(not (or (config/local-asset? value)
                                   (config/draw? value))))
                   value)

                  (and
                   (= typ "Search")
                   (text/page-ref? value)
                   (text/page-ref-un-brackets! value))

                  (and
                   (= typ "Search")
                   (not (contains? #{\# \* \/ \[} (first value)))
                   (let [_ext (some-> (util/get-file-ext value) keyword)]
                     (when (and (not (string/starts-with? value "http:"))
                                (not (string/starts-with? value "https:"))
                                (not (string/starts-with? value "file:"))
                                #_(not (config/local-asset? value))
                                #_(or (= ext :excalidraw)
                                    (not (contains? (config/supported-formats) ext))))
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
    (when (and block-id
               (util/uuid-string? block-id))
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

;; TODO: we should move this to mldoc
(defn extract-properties
  [format properties]
  (when (seq properties)
    (let [properties (seq properties)
          page-refs (->>
                     properties
                     (remove (fn [[k _]]
                               (contains? #{:background-color :background_color} (keyword k))))
                     (map last)
                     (map (fn [v]
                            (when (and (string? v)
                                       ;; TODO: Enable mldoc-link?
                                       #_(not (mldoc/link? format v)))
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
                                           (if (string/blank? v)
                                             nil
                                             (text/parse-property format k v)))
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

(defn extract-timestamps
  [block]
  (some->>
   (second block)
   (filter timestamp-block?)
   (map last)
   (into {})))

;; {"Deadline" {:date {:year 2020, :month 10, :day 20}, :wday "Tue", :time {:hour 8, :min 0}, :repetition [["DoublePlus"] ["Day"] 1], :active true}}
(defn timestamps->scheduled-and-deadline
  [timestamps]
  (let [timestamps (util/map-keys (comp keyword string/lower-case) timestamps)
        m (some->> (select-keys timestamps [:scheduled :deadline])
                   (map (fn [[k v]]
                          (let [{:keys [date repetition]} v
                                {:keys [year month day]} date
                                day (js/parseInt (str year (util/zero-pad month) (util/zero-pad day)))]
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
  [original-page-name]
  (when original-page-name
    (let [page-name (util/page-name-sanity-lc original-page-name)
          ;; TODO: Enable date/* fns
          day false #_(date/journal-title->int page-name)]
     (if day
       (let [original-page-name "" #_(date/int->journal-title day)]
         [original-page-name (util/page-name-sanity-lc original-page-name) day])
       [original-page-name page-name day]))))

(defn page-name->map
  "Create a page's map structure given a original page name (string).
   map as input is supported for legacy compatibility.
   with-timestamp?: assign timestampes to the map structure.
    Useful when creating new pages from references or namespaces,
    as there's no chance to introduce timestamps via editing in page"
  ([original-page-name with-id?]
   (page-name->map original-page-name with-id? true))
  ([original-page-name with-id? with-timestamp?]
   (cond
     (and original-page-name (string? original-page-name))
     (let [original-page-name (util/remove-boundary-slashes original-page-name)
           [original-page-name page-name journal-day] (convert-page-if-journal original-page-name)
           namespace? (and (not (boolean (text/get-nested-page-name original-page-name)))
                           (text/namespace-page? original-page-name))
           ;; TODO: Pass db down to this fn
           page-entity (some-> nil (d/entity [:block/name page-name]))]
       (merge
        {:block/name page-name
         :block/original-name original-page-name}
        (when with-id?
          (if page-entity
            {}
            {:block/uuid (d/squuid)}))
        (when namespace?
          (let [namespace (first (util/split-last "/" original-page-name))]
            (when-not (string/blank? namespace)
              {:block/namespace {:block/name (util/page-name-sanity-lc namespace)}})))
        (when (and with-timestamp? (not page-entity)) ;; Only assign timestamp on creating new entity
          ;; TODO: add current time with cljs-core
          (let [current-ms 0 #_(util/time-ms)]
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
     nil)))

(defn with-page-refs
  [{:keys [title body tags refs marker priority] :as block} with-id?]
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
         (when-let [page (get-page-reference form)]
           (swap! refs conj page))
         (when-let [tag (get-tag form)]
           (let [tag (text/page-ref-un-brackets! tag)]
             (when (util/tag-valid? tag)
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
                                                (util/split-namespace-pages p))))))
                                      refs)
                              (remove string/blank?)
                              (distinct))
          refs (->> (distinct (concat refs children-pages))
                    (remove nil?))
          refs (map (fn [ref] (page-name->map ref with-id?)) refs)]
      (assoc block :refs refs))))

(defn with-block-refs
  [{:keys [title body] :as block}]
  (let [ref-blocks (atom nil)]
    (walk/postwalk
     (fn [form]
       (when-let [block (get-block-reference form)]
         (swap! ref-blocks conj block))
       form)
     (concat title body))
    (let [ref-blocks (->> @ref-blocks
                          (filter util/uuid-string?))
          ref-blocks (map
                       (fn [id]
                         [:block/uuid (uuid id)])
                       ref-blocks)
          refs (distinct (concat (:refs block) ref-blocks))]
      (assoc block :refs refs))))

(defn block-keywordize
  [block]
  (util/map-keys
   (fn [k]
     (if (namespace k)
       k
       (keyword "block" k)))
   block))

(defn safe-blocks
  [blocks]
  (map (fn [block]
         (if (map? block)
           (block-keywordize (util/remove-nils block))
           block))
       blocks))

(defn with-path-refs
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
                                         {:block/name (util/page-name-sanity-lc ref)}
                                         ref)))
                                (remove vector?)
                                (remove nil?)
                                (distinct))]
        (recur (rest blocks)
               (conj acc (assoc block :block/path-refs path-ref-pages))
               parents)))))

(defn block-tags->pages
  [{:keys [tags] :as block}]
  (if (seq tags)
    (assoc block :tags (map (fn [tag]
                              (let [tag (text/page-ref-un-brackets! tag)]
                                [:block/name (util/page-name-sanity-lc tag)])) tags))
    block))

(defn- get-block-content
  [utf8-content block format block-content]
  (let [meta (:meta block)
        content (or block-content
                    (if-let [end-pos (:end-pos meta)]
                      (utf8/substring utf8-content
                                      (:start-pos meta)
                                      end-pos)
                      (utf8/substring utf8-content
                                      (:start-pos meta))))
        content (when content
                  (let [content (text/remove-level-spaces content format)]
                    (if (or (:pre-block? block)
                            (= (:format block) :org))
                      content
                      (mldoc/remove-indentation-spaces content (inc (:level block)) false))))]
    (if (= format :org)
      content
      (property/->new-properties content))))

(defn get-custom-id-or-new-id
  [properties]
  (or (when-let [custom-id (or (get-in properties [:properties :custom-id])
                               (get-in properties [:properties :custom_id])
                               (get-in properties [:properties :id]))]
        (let [custom-id (and (string? custom-id) (string/trim custom-id))]
          (when (and custom-id (util/uuid-string? custom-id))
            (uuid custom-id))))
      (d/squuid)))

(defn get-page-refs-from-properties
  [properties]
  (let [page-refs (mapcat (fn [v] (cond
                                   (coll? v)
                                   v

                                   (text/page-ref? v)
                                   [(text/page-ref-un-brackets! v)]

                                   :else
                                   nil)) (vals properties))
        page-refs (remove string/blank? page-refs)]
    (map (fn [page] (page-name->map page true)) page-refs)))

(defn with-page-block-refs
  [block with-id?]
  (some-> block
          (with-page-refs with-id?)
          with-block-refs
          block-tags->pages
          (update :refs (fn [col] (remove nil? col)))))

(defn extract-blocks*
  [blocks body pre-block-properties encoded-content with-body?]
  (let [first-block (first blocks)
        first-block-start-pos (get-in first-block [:block/meta :start-pos])
        blocks (if (or (> first-block-start-pos 0)
                       (empty? blocks))
                 (cons
                  (merge
                   (let [content (utf8/substring encoded-content 0 first-block-start-pos)
                         {:keys [properties properties-order]} @pre-block-properties
                         id (get-custom-id-or-new-id {:properties properties})
                         property-refs (->> (get-page-refs-from-properties properties)
                                            (map :block/original-name))
                         block {:uuid id
                                :content content
                                :level 1
                                :meta {:start-pos 0
                                       :end-pos (or first-block-start-pos
                                                    (utf8/length encoded-content))}
                                :properties properties
                                :properties-order properties-order
                                :refs property-refs
                                :pre-block? true
                                :unordered true
                                :body body}
                         block (with-page-block-refs block false)]
                     (block-keywordize block))
                   (select-keys first-block [:block/format :block/page]))
                  blocks)
                 blocks)
        blocks (map (fn [block]
                      (if with-body?
                        block
                        (dissoc block :block/body))) blocks)]
    (with-path-refs blocks)))

(defn ^:large-vars/cleanup-todo extract-blocks
  ([blocks content with-id? format]
   (extract-blocks blocks content with-id? format false))
  ([blocks content with-id? format with-body?]
   (try
    (let [encoded-content (utf8/encode content)
          last-pos (utf8/length encoded-content)
          pre-block-properties (atom nil)
          [blocks body]
          (loop [headings []
                 blocks (reverse blocks)
                 timestamps {}
                 properties {}
                 last-pos last-pos
                 last-level 1000
                 children []
                 block-all-content []
                 body []]
            (if (seq blocks)
              (let [[block {:keys [start_pos _end_pos] :as block-content}] (first blocks)
                    block-content (when (string? block-content) block-content)
                    unordered? (:unordered (second block))
                    markdown-heading? (and (:size (second block)) (= :markdown format))]
                (cond
                  (paragraph-timestamp-block? block)
                  (let [timestamps (extract-timestamps block)
                        timestamps' (merge timestamps timestamps)]
                    (recur headings (rest blocks) timestamps' properties last-pos last-level children (conj block-all-content block-content) body))

                  (property/properties-ast? block)
                  (let [properties (extract-properties format (second block))]
                    (recur headings (rest blocks) timestamps properties last-pos last-level children (conj block-all-content block-content) body))

                  (heading-block? block)
                  (let [id (get-custom-id-or-new-id properties)
                        ref-pages-in-properties (->> (:page-refs properties)
                                                     (remove string/blank?))
                        block (second block)
                        block (if markdown-heading?
                                (assoc block
                                       :type :heading
                                       :level (if unordered? (:level block) 1)
                                       :heading-level (or (:size block) 6))
                                block)
                        level (:level block)
                        [children current-block-children]
                        (cond
                          (< level last-level)
                          (let [current-block-children (set (->> (filter #(< level (second %)) children)
                                                                 (map first)
                                                                 (map (fn [id]
                                                                        [:block/uuid id]))))
                                others (vec (remove #(< level (second %)) children))]
                            [(conj others [id level])
                             current-block-children])

                          (>= level last-level)
                          [(conj children [id level])
                           #{}])
                        block (cond->
                                (assoc block
                                       :uuid id
                                       :refs ref-pages-in-properties
                                       :children (or current-block-children [])
                                       :format format)
                                (seq (:properties properties))
                                (assoc :properties (:properties properties))

                                (seq (:properties-order properties))
                                (assoc :properties-order (:properties-order properties)))
                        block (if (get-in block [:properties :collapsed])
                                (assoc block :collapsed? true)
                                block)
                        block (-> block
                                  (assoc-in [:meta :start-pos] start_pos)
                                  (assoc-in [:meta :end-pos] last-pos)
                                  ((fn [block]
                                     (assoc block
                                            :content (get-block-content encoded-content block format (and block-content (string/join "\n" (reverse (conj block-all-content block-content)))))))))
                        block (if (seq timestamps)
                                (merge block (timestamps->scheduled-and-deadline timestamps))
                                block)
                        block (assoc block :body body)
                        block (with-page-block-refs block with-id?)
                        last-pos' (get-in block [:meta :start-pos])
                        {:keys [created-at updated-at]} (:properties properties)
                        block (cond-> block
                                (and created-at (integer? created-at))
                                (assoc :block/created-at created-at)

                                (and updated-at (integer? updated-at))
                                (assoc :block/updated-at updated-at))]
                    (recur (conj headings block) (rest blocks) {} {} last-pos' (:level block) children [] []))

                  :else
                  (recur headings (rest blocks) timestamps properties last-pos last-level children
                         (conj block-all-content block-content)
                         (conj body block))))
              (do
                (when (seq properties)
                  (reset! pre-block-properties properties))
                [(-> (reverse headings)
                     safe-blocks) body])))]
      (extract-blocks* blocks body pre-block-properties encoded-content with-body?))
    (catch js/Error _e
      (js/console.error "extract-blocks-failed")
      #_(log/error :exception e)))))

(defn with-parent-and-left
  [page-id blocks]
  (loop [blocks (map (fn [block] (assoc block :block/level-spaces (:block/level block))) blocks)
         parents [{:page/id page-id     ; db id or a map {:block/name "xxx"}
                   :block/level 0
                   :block/level-spaces 0}]
         _sibling nil
         result []]
    (if (empty? blocks)
      (map #(dissoc % :block/level-spaces) result)
      (let [[block & others] blocks
            level-spaces (:block/level-spaces block)
            {:block/keys [uuid level parent] :as last-parent} (last parents)
            parent-spaces (:block/level-spaces last-parent)
            [blocks parents sibling result]
            (cond
              (= level-spaces parent-spaces)        ; sibling
              (let [block (assoc block
                                 :block/parent parent
                                 :block/left [:block/uuid uuid]
                                 :block/level level)
                    parents' (conj (vec (butlast parents)) block)
                    result' (conj result block)]
                [others parents' block result'])

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
                [others parents' block result'])

              (< level-spaces parent-spaces)
              (cond
                (some #(= (:block/level-spaces %) (:block/level-spaces block)) parents) ; outdent
                (let [parents' (vec (filter (fn [p] (<= (:block/level-spaces p) level-spaces)) parents))
                      left (last parents')
                      blocks (cons (assoc (first blocks)
                                          :block/level (dec level)
                                          :block/left [:block/uuid (:block/uuid left)])
                                   (rest blocks))]
                  [blocks parents' left result])

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
                  [others parents' block result'])))]
        (recur blocks parents sibling result)))))
;
; (defn parse-block
;   ([block]
;    (parse-block block nil))
;   ([{:block/keys [uuid content page format] :as block} {:keys [with-id?]
;                                                         :or {with-id? true}}]
;    (when-not (string/blank? content)
;      (let [block (dissoc block :block/pre-block?)
;            ast (format/to-edn content format nil)
;            blocks (extract-blocks ast content with-id? format)
;            new-block (first blocks)
;            parent-refs (->> (db/get-block-parent (state/get-current-repo) uuid)
;                             :block/path-refs
;                             (map :db/id))
;            {:block/keys [refs]} new-block
;            ref-pages (filter :block/name refs)
;            path-ref-pages (->> (concat ref-pages parent-refs [(:db/id page)])
;                                (remove nil?))
;            block (cond->
;                    (merge
;                     block
;                     new-block
;                     {:block/path-refs path-ref-pages})
;                    (> (count blocks) 1)
;                    (assoc :block/warning :multiple-blocks))
;            block (dissoc block :block/title :block/body :block/level)]
;        (if uuid (assoc block :block/uuid uuid) block)))))
;
; (defn parse-title-and-body
;   ([block]
;    (when (map? block)
;      (merge block
;             (parse-title-and-body (:block/uuid block)
;                                   (:block/format block)
;                                   (:block/pre-block? block)
;                                   (:block/content block)))))
;   ([block-uuid format pre-block? content]
;    (when-not (string/blank? content)
;      (let [content (if pre-block? content
;                        (str (config/get-block-pattern format) " " (string/triml content)))]
;        (if-let [result (state/get-block-ast block-uuid content)]
;          result
;          (let [ast (->> (format/to-edn content format (mldoc/default-config format))
;                         (map first))
;                title (when (heading-block? (first ast))
;                        (:title (second (first ast))))
;                body (vec (if title (rest ast) ast))
;                body (drop-while property/properties-ast? body)
;                result (cond->
;                         (if (seq body) {:block/body body} {})
;                         title
;                         (assoc :block/title title))]
;            (state/add-block-ast-cache! block-uuid content result)
;            result))))))
;
; (defn macro-subs
;   [macro-content arguments]
;   (loop [s macro-content
;          args arguments
;          n 1]
;     (if (seq args)
;       (recur
;        (string/replace s (str "$" n) (first args))
;        (rest args)
;        (inc n))
;       s)))
;
; (defn break-line-paragraph?
;   [[typ break-lines]]
;   (and (= typ "Paragraph")
;        (every? #(= % ["Break_Line"]) break-lines)))
;
; (defn trim-paragraph-special-break-lines
;   [ast]
;   (let [[typ paras] ast]
;     (if (= typ "Paragraph")
;       (let [indexed-paras (map-indexed vector paras)]
;         [typ (->> (filter
;                             #(let [[index value] %]
;                                (not (and (> index 0)
;                                          (= value ["Break_Line"])
;                                          (contains? #{"Timestamp" "Macro"}
;                                                     (first (nth paras (dec index)))))))
;                             indexed-paras)
;                            (map #(last %)))])
;       ast)))
;
; (defn trim-break-lines!
;   [ast]
;   (drop-while break-line-paragraph?
;               (map trim-paragraph-special-break-lines ast)))
