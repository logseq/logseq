(ns frontend.format.block
  (:require [frontend.util :as util :refer-macros [profile]]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [frontend.format :as format]
            [frontend.utf8 :as utf8]
            [medley.core :as medley]
            [frontend.config :as config]
            [datascript.core :as d]
            [frontend.date :as date]
            [frontend.text :as text]
            [frontend.util.property :as property]
            [medley.core :as medley]
            [frontend.state :as state]
            [frontend.db :as db]))

(defn heading-block?
  [block]
  (and
   (vector? block)
   (= "Heading" (first block))))

(defn get-tag
  [block]
  (and (vector? block)
       (= "Tag" (first block))
       (second block)))

(defn get-page-reference
  [block]
  (let [page (cond
               (and (vector? block) (= "Link" (first block)))
               (let [typ (first (:url (second block)))]
                 ;; {:url ["File" "file:../pages/hello_world.org"], :label [["Plain" "hello world"]], :title nil}
                 (or
                  (and
                   (= typ "Search")
                   ;; FIXME: alert error
                   (not (contains? #{\# \* \/ \[} (first (second (:url (second block))))))
                   (let [page (second (:url (second block)))
                         ext (some-> (util/get-file-ext page) keyword)]
                     (when (and (not (util/starts-with? page "http:"))
                                (not (util/starts-with? page "https:"))
                                (not (util/starts-with? page "file:"))
                                (or (= ext :excalidraw)
                                    (not (contains? (config/supported-formats) ext))))
                       page)))

                  (and
                   (= typ "Complex")
                   (= (:protocol (second (:url (second block)))) "file")
                   (:link (second (:url (second block)))))

                  (and
                   (= typ "File")
                   (second (first (:label (second block)))))))

               (and (vector? block) (= "Nested_link" (first block)))
               (let [content (:content (last block))]
                 (subs content 2 (- (count content) 2)))

               (and (vector? block)
                    (= "Macro" (first block)))
               (let [{:keys [name arguments]} (second block)]
                 (let [argument (string/join ", " arguments)]
                   (when (and (= name "embed")
                              (string? argument)
                              (text/page-ref? argument))
                     (text/page-ref-un-brackets! argument))))

               (and (vector? block)
                    (= "Tag" (first block)))
               (let [text (second block)]
                 (when (and
                        (string? text)
                        (text/page-ref? text))
                   (text/page-ref-un-brackets! text)))

               :else
               nil)]
    (cond
      (and
       (string? page)
       (text/block-ref? page))
      (text/block-ref-un-brackets! page)

      (and
       (string? page)
       (not (string/blank? page)))
      (string/trim page)

      :else
      nil)))

(defn get-block-reference
  [block]
  (when-let [block-id (cond
                        (and (vector? block)
                             (= "Block_reference" (first block)))
                        (last block)

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
                            (when (text/block-ref? id)
                             (text/block-ref-un-brackets! id))))

                        :else
                        nil)]
    (when (and block-id
               (util/uuid-string? block-id))
      block-id)))

;; FIXME:
(defn extract-title
  [block]
  (-> (:title (second block))
      first
      second))

(defn paragraph-block?
  [block]
  (and
   (vector? block)
   (= "Paragraph" (first block))))

(defn hiccup-block?
  [block]
  (and
   (vector? block)
   (= "Hiccup" (first block))))

(defn timestamp-block?
  [block]
  (and
   (vector? block)
   (= "Timestamp" (first block))))

(defn definition-list-block?
  [block]
  (and
   (vector? block)
   (= "List" (first block))
   (:name (first (second block)))))

(defonce non-parsing-properties
  (atom #{"background-color" "background_color"}))

;; TODO: we should move this to mldoc
(defn extract-properties
  [properties]
  (let [properties (into {} properties)
        page-refs (->>
                   (map (fn [v]
                          (when (string? v)
                            (let [result (text/split-page-refs-without-brackets v {:un-brackets? false})]
                              (if (coll? result)
                                (map text/page-ref-un-brackets! result)
                                []))))
                     (vals properties))
                   (apply concat)
                   (remove string/blank?))
        properties (->> properties
                        (medley/map-kv (fn [k v]
                                         (let [k (-> (string/lower-case (name k))
                                                     (string/replace " " "-")
                                                     (string/replace "_" "-"))
                                               k (if (contains? #{"custom_id" "custom-id"} k)
                                                   "id"
                                                   k)
                                               v (if (coll? v)
                                                   v
                                                   (property/parse-property k v))
                                               k (keyword k)
                                               v (if (and
                                                      (string? v)
                                                      (contains? #{:alias :aliases :tags} k))
                                                   (set [v])
                                                   v)]
                                           [k v]))))]
    {:properties properties
     :page-refs page-refs}))

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
  (let [timestamps (medley/map-keys (comp keyword string/lower-case) timestamps)
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
  (let [page-name (string/lower-case original-page-name)
        day (date/journal-title->int page-name)]
    (if day
      (let [original-page-name (date/int->journal-title day)]
        [original-page-name (string/lower-case original-page-name) day])
      [original-page-name page-name day])))

(defn page-name->map
  [original-page-name with-id?]
  (when original-page-name
    (let [[original-page-name page-name journal-day] (convert-page-if-journal original-page-name)
          m (merge
             {:block/name page-name
              :block/original-name original-page-name}
             (when with-id?
               (if-let [block (db/entity [:block/name page-name])]
                 {}
                 {:block/uuid (db/new-block-id)})))]
      (if journal-day
        (merge m
               {:block/journal? true
                :block/journal-day journal-day})
        (assoc m :block/journal? false)))))

(defn with-page-refs
  [{:keys [title body tags refs marker priority] :as block} with-id?]
  (let [refs (->> (concat tags refs [marker priority])
                  (remove string/blank?)
                  (distinct))
        refs (atom refs)]
    (walk/postwalk
     (fn [form]
       (when-let [page (get-page-reference form)]
         (swap! refs conj page))
       (when-let [tag (get-tag form)]
         (when (util/tag-valid? tag)
           (swap! refs conj tag)))
       form)
     (concat title body))
    (let [refs (remove string/blank? @refs)
          children-pages (->> (mapcat (fn [p]
                                        (when (and (string/includes? p "/")
                                                   (not (string/starts-with? p "../"))
                                                   (not (string/starts-with? p "./"))
                                                   (not (string/starts-with? p "http")))
                                          ;; Don't create the last page for now
                                          (butlast (string/split p #"/"))))
                                      refs)
                              (remove string/blank?))
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
                         [:block/uuid (medley/uuid id)])
                       ref-blocks)
          refs (distinct (concat (:refs block) ref-blocks))]
      (assoc block :refs refs))))

(defn block-keywordize
  [block]
  (medley/map-keys
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
                                         {:block/name (string/lower-case ref)}
                                         ref)))
                                (remove vector?)
                                (distinct))]
        (recur (rest blocks)
               (conj acc (assoc block :block/path-refs path-ref-pages))
               parents)))))

(defn block-tags->pages
  [{:keys [tags] :as block}]
  (if (seq tags)
    (assoc block :tags (map (fn [tag]
                              [:block/name (string/lower-case tag)]) tags))
    block))

(defn- remove-indentation-spaces
  [s level]
  (let [level (inc level)
        lines (string/split-lines s)
        [f & r] lines
        body (map (fn [line]
                    (if (string/blank? (util/safe-subs line 0 level))
                      (util/safe-subs line level)
                      line))
                  r)
        content (cons f body)]
    (string/join "\n" content)))

(defn src-block?
  [block]
  (some (fn [x] (and (vector? x) (= "Src" (first x)))) (:body block)))

(defn- get-block-content
  [utf8-content block format]
  (let [meta (:meta block)
        content (if-let [end-pos (:end-pos meta)]
                  (utf8/substring utf8-content
                                  (:start-pos meta)
                                  end-pos)
                  (utf8/substring utf8-content
                                  (:start-pos meta)))
        content-orig content]
    (let [content (when content
                    (let [content (text/remove-level-spaces content format)]
                      (if (or (:pre-block? block)
                              (= (:format block) :org)
                              (src-block? block))
                        content
                        (remove-indentation-spaces content (:level block)))))]
      (if (= format :org)
        content
        (property/->new-properties content)))))

(defn extract-blocks
  [blocks content with-id? format]
  (let [encoded-content (utf8/encode content)
        last-pos (utf8/length encoded-content)
        pre-block-body (atom nil)
        pre-block-properties (atom nil)
        blocks
        (loop [headings []
               block-body []
               blocks (reverse blocks)
               timestamps {}
               properties {}
               last-pos last-pos
               last-level 1000
               children []]
          (if (seq blocks)
            (let [[block {:keys [start_pos end_pos]}] (first blocks)
                  unordered? (:unordered (second block))
                  markdown-heading? (and (false? unordered?) (= :markdown format))]
              (cond
                (paragraph-timestamp-block? block)
                (let [timestamps (extract-timestamps block)
                      timestamps' (merge timestamps timestamps)
                      other-body (->> (second block)
                                      (drop-while #(= ["Break_Line"] %)))]
                  (recur headings (conj block-body ["Paragraph" other-body]) (rest blocks) timestamps' properties last-pos last-level children))

                (property/properties-ast? block)
                (let [properties (extract-properties (second block))]
                  (recur headings block-body (rest blocks) timestamps properties last-pos last-level children))

                (heading-block? block)
                (let [id (or (when-let [custom-id (or (get-in properties [:properties :custom-id])
                                                      (get-in properties [:properties :custom_id])
                                                      (get-in properties [:properties :id]))]
                               (let [custom-id (string/trim custom-id)]
                                 (when (util/uuid-string? custom-id)
                                   (uuid custom-id))))
                             (db/new-block-id))
                      ref-pages-in-properties (->> (:page-refs properties)
                                                   (remove string/blank?))
                      block (second block)
                      block (if markdown-heading?
                              (assoc block
                                     :type :heading
                                     :level 1
                                     :heading-level (:level block))
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

                      block (-> (assoc block
                                       :uuid id
                                       :body (vec (reverse block-body))
                                       :properties (:properties properties)
                                       :refs ref-pages-in-properties
                                       :children (or current-block-children [])
                                       :format format)
                                (assoc-in [:meta :start-pos] start_pos)
                                (assoc-in [:meta :end-pos] last-pos)
                                ((fn [block]
                                   (assoc block
                                          :content (get-block-content encoded-content block format)))))
                      block (if (seq timestamps)
                              (merge block (timestamps->scheduled-and-deadline timestamps))
                              block)
                      block (-> block
                                (with-page-refs with-id?)
                                with-block-refs
                                block-tags->pages)
                      last-pos' (get-in block [:meta :start-pos])]
                  (recur (conj headings block) [] (rest blocks) {} {} last-pos' (:level block) children))

                :else
                (let [block-body' (conj block-body block)]
                  (recur headings block-body' (rest blocks) timestamps properties last-pos last-level children))))
            (do
              (when (seq block-body)
                (reset! pre-block-body (reverse block-body)))
              (when (seq properties)
                (let [properties (:properties properties)]
                  (reset! pre-block-properties properties)))
              (-> (reverse headings)
                  safe-blocks))))]
    (let [first-block (first blocks)
          first-block-start-pos (get-in first-block [:block/meta :start-pos])
          blocks (if (or (seq @pre-block-body)
                         (seq @pre-block-properties))
                   (cons
                    (merge
                     (let [content (utf8/substring encoded-content 0 first-block-start-pos)]
                       (->
                        {:uuid (db/new-block-id)
                         :content content
                         :level 1
                         :meta {:start-pos 0
                                :end-pos (or first-block-start-pos
                                             (utf8/length encoded-content))}
                         :body @pre-block-body
                         :properties @pre-block-properties
                         :pre-block? true
                         :unordered true}
                        (block-keywordize)))
                     (select-keys first-block [:block/file :block/format :block/page]))
                    blocks)
                   blocks)]
      (with-path-refs blocks))))

(defn with-parent-and-left
  [page-id blocks]
  (loop [blocks (map (fn [block] (assoc block :block/level-spaces (:block/level block))) blocks)
         parents [{:page/id page-id     ; db id or lookup ref [:block/name "xxx"]
                   :block/level 0
                   :block/level-spaces 0}]
         sibling nil
         result []]
    (if (empty? blocks)
      (map #(dissoc % :block/level-spaces) result)
      (let [[block & others] blocks
            level-spaces (:block/level-spaces block)
            {:block/keys [uuid level parent unordered] :as last-parent} (last parents)
            parent-spaces (:block/level-spaces last-parent)
            [blocks parents sibling result]
            (cond
              (= level-spaces parent-spaces)        ; sibling
              (let [block (assoc block
                                 :block/parent parent
                                 :block/left [:block/uuid uuid]
                                 :block/level level
                                 )
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

              ;; - a
              ;;    - b
              ;;  - c
              (and (>= (count parents) 2)
                   (< level-spaces parent-spaces)
                   (> level-spaces (:block/level-spaces (nth parents (- (count parents) 2)))))
              (let [block (assoc block
                                 :block/parent parent
                                 :block/left [:block/uuid uuid]
                                 :block/level level
                                 :block/level-spaces parent-spaces)
                    parents' (conj (vec (butlast parents)) block)
                    result' (conj result block)]
                [others parents' block result'])

              (< level-spaces parent-spaces)         ; outdent
              (let [parents' (vec (filter (fn [p] (<= (:block/level-spaces p) level-spaces)) parents))
                    blocks (cons (assoc (first blocks) :block/level (dec level))
                                 (rest blocks))]
                [blocks parents' (last parents') result]))]
        (recur blocks parents sibling result)))))

(defn parse-block
  ([block]
   (parse-block block nil))
  ([{:block/keys [uuid content meta file page parent left format] :as block} {:keys [with-id?]
                                                                              :or {with-id? true}}]
   (when-not (string/blank? content)
     (let [block (dissoc block :block/pre-block?)
           ast (format/to-edn content format nil)
           new-block (first (extract-blocks ast content with-id? format))
           parent-refs (->> (db/get-block-parent (state/get-current-repo) uuid)
                            :block/path-refs
                            (map :db/id))
           {:block/keys [refs]} new-block
           ref-pages (filter :block/name refs)
           path-ref-pages (concat ref-pages parent-refs)
           block (merge
                  block
                  new-block
                  {:block/path-refs path-ref-pages})]
       (if uuid (assoc block :block/uuid uuid) block)))))

(defn macro-subs
  [macro-content arguments]
  (loop [s macro-content
         args arguments
         n 1]
    (if (seq args)
      (recur
       (string/replace s (str "$" n) (first args))
       (rest args)
       (inc n))
      s)))

(defn break-line-paragraph?
  [[typ break-lines]]
  (and (= typ "Paragraph")
       (every? #(= % ["Break_Line"]) break-lines)))

(defn trim-break-lines!
  [ast]
  (drop-while break-line-paragraph? ast))
