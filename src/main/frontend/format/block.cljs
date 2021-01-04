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
            [medley.core :as medley]))

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
                   (let [page (second (:url (second block)))]
                     (when (and (not (util/starts-with? page "http"))
                                (not (util/starts-with? page "file"))
                                (not (string/ends-with? page ".html")))
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
                 (when (and (= name "embed")
                            (string? (first arguments))
                            (string/starts-with? (first arguments) "[[")
                            (string/ends-with? (first arguments) "]]"))
                   (subs (first arguments) 2 (- (count (first arguments)) 2))))
               :else
               nil)]
    (when (and
           (string? page)
           (not (string/blank? page)))
      (string/trim page))))

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
                             (map? (second block))
                             (= "id" (:protocol (second (:url (second block))))))

                        (:link (second (:url (second block))))

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

(defn- timestamp-block?
  [block]
  (and
   (vector? block)
   (= "Timestamp" (first block))))

(defn properties-block?
  [block]
  (and
   (vector? block)
   (= "Property_Drawer" (first block))))

(defn definition-list-block?
  [block]
  (and
   (vector? block)
   (= "List" (first block))
   (:name (first (second block)))))

(defn- ->schema-properties
  [properties]
  (-> properties
      (update "created_at" util/safe-parse-int)
      (update "last_modified_at" util/safe-parse-int)))

(defn extract-properties
  [[_ properties] _start-pos _end-pos]
  (let [properties (into {} properties)
        page-refs (->>
                   (map (fn [v]
                          (when v
                            (->> (re-seq text/page-ref-re v)
                                 (map second)
                                 (map string/lower-case))))
                        (vals properties))
                   (apply concat)
                   (distinct))
        properties (->> properties
                        (medley/map-kv (fn [k v]
                                         (let [k' (and k (string/trim (string/lower-case k)))
                                               v' (and v (string/trim v))
                                               v' (if (and k' v'
                                                           (contains? config/markers k')
                                                           (util/safe-parse-int v'))
                                                    (util/safe-parse-int v')
                                                    (text/split-page-refs-without-brackets v'))]
                                           [k' v'])))
                        (->schema-properties))]
    {:properties properties
     :page-refs page-refs}))

(defn- paragraph-timestamp-block?
  [block]
  (and (paragraph-block? block)
       (timestamp-block? (first (second block)))))

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
                               {:scheduled day
                                :scheduled-ast v}
                               :deadline
                               {:deadline day
                                :deadline-ast v})
                              repetition
                              (assoc :repeated? true))))))]
    (apply merge m)))

(defn block-tags->pages
  [{:keys [tags] :as block}]
  (if (seq tags)
    (assoc block :tags (map (fn [tag]
                              [:page/name (string/lower-case tag)]) tags))
    block))

(defn with-page-refs
  [{:keys [title body tags ref-pages] :as block}]
  (let [ref-pages (->> (concat tags ref-pages)
                       (remove string/blank?)
                       (distinct))
        ref-pages (atom ref-pages)]
    (walk/postwalk
     (fn [form]
       (when-let [page (get-page-reference form)]
         (swap! ref-pages conj page))
       (when-let [tag (get-tag form)]
         (when (util/tag-valid? tag)
           (swap! ref-pages conj tag)))
       form)
     (concat title body))
    (let [ref-pages (remove string/blank? @ref-pages)]
      (assoc block :ref-pages (vec ref-pages)))))

(defn with-block-refs
  [{:keys [title body] :as block}]
  (let [ref-blocks (atom nil)]
    (walk/postwalk
     (fn [form]
       (when-let [block (get-block-reference form)]
         (swap! ref-blocks conj block))
       form)
     (concat title body))
    (let [ref-blocks (remove string/blank? @ref-blocks)]
      (assoc block :ref-blocks (map
                                (fn [id]
                                  [:block/uuid (medley/uuid id)])
                                ref-blocks)))))

(defn update-src-pos-meta!
  [{:keys [body] :as block}]
  (let [body (walk/postwalk
              (fn [form]
                (if (and (vector? form)
                         (= (first form) "Src")
                         (map? (:pos_meta (second form))))
                  (let [{:keys [start_pos end_pos]} (:pos_meta (second form))
                        new_start_pos (- start_pos (get-in block [:meta :start-pos]))]
                    ["Src" (assoc (second form)
                                  :pos_meta {:start_pos new_start_pos
                                             :end_pos (+ new_start_pos (- end_pos start_pos))})])
                  form))
              body)]
    (assoc block :body body)))

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
         (block-keywordize (util/remove-nils block)))
       blocks))

(defn extract-blocks
  [blocks last-pos encoded-content]
  (let [blocks
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
                  level (:level (second block))]
              (cond
                (paragraph-timestamp-block? block)
                (let [timestamps (extract-timestamps block)
                      timestamps' (merge timestamps timestamps)
                      other-body (->> (remove timestamp-block? (second block))
                                      (drop-while #(= ["Break_Line"] %)))]
                  (recur headings (conj block-body ["Paragraph" other-body]) (rest blocks) timestamps' properties last-pos last-level children))

                (properties-block? block)
                (let [properties (extract-properties block start_pos end_pos)]
                  (recur headings block-body (rest blocks) timestamps properties last-pos last-level children))

                (heading-block? block)
                (let [id (or (when-let [custom-id (or (get-in properties [:properties "custom_id"])
                                                      (get-in properties [:properties "id"]))]
                               (let [custom-id (string/trim custom-id)]
                                 (when (util/uuid-string? custom-id)
                                   (uuid custom-id))))
                             (d/squuid))
                      ref-pages-in-properties (:page-refs properties)
                      block (second block)
                      level (:level block)
                      [children current-block-children]
                      (cond
                        (>= level last-level)
                        [(conj children [id level])
                         #{}]

                        (< level last-level)
                        (let [current-block-children (set (->> (filter #(< level (second %)) children)
                                                               (map first)
                                                               (map (fn [id]
                                                                      [:block/uuid id]))))
                              others (vec (remove #(< level (second %)) children))]
                          [(conj others [id level])
                           current-block-children]))
                      block (-> (assoc block
                                       :uuid id
                                       :body (vec (reverse block-body))
                                       :properties (:properties properties)
                                       :ref-pages ref-pages-in-properties
                                       :children (or current-block-children []))
                                (assoc-in [:meta :start-pos] start_pos)
                                (assoc-in [:meta :end-pos] last-pos))
                      block (if (seq timestamps)
                              (merge block (timestamps->scheduled-and-deadline timestamps))
                              block)
                      block (-> block
                                with-page-refs
                                with-block-refs
                                block-tags->pages
                                update-src-pos-meta!)
                      last-pos' (get-in block [:meta :start-pos])]
                  (recur (conj headings block) [] (rest blocks) {} {} last-pos' (:level block) children))

                :else
                (let [block-body' (conj block-body block)]
                  (recur headings block-body' (rest blocks) timestamps properties last-pos last-level children))))
            (-> (reverse headings)
                safe-blocks)))]
    (let [first-block (first blocks)
          first-block-start-pos (get-in first-block [:block/meta :start-pos])]
      (if (and
           (not (string/blank? encoded-content))
           (or (empty? blocks)
               (> first-block-start-pos 1)))
        (cons
         (merge
          (let [content (utf8/substring encoded-content 0 first-block-start-pos)
                uuid (d/squuid)]
            (->
             {:uuid uuid
              :content content
              :anchor (str uuid)
              :level 2
              :meta {:start-pos 0
                     :end-pos (or first-block-start-pos
                                  (utf8/length encoded-content))}
              :body (take-while (fn [block] (not (heading-block? block))) blocks)
              :pre-block? true}
             (block-keywordize)))
          (select-keys first-block [:block/file :block/format :block/page]))
         blocks)
        blocks))))

(defn- page-with-journal
  [original-page-name]
  (when original-page-name
    (let [page-name (string/lower-case original-page-name)]
      (if-let [d (date/journal-title->int (string/capitalize page-name))]
        {:page/name page-name
         :page/original-name original-page-name
         :page/journal? true
         :page/journal-day d}
        {:page/name page-name
         :page/original-name original-page-name}))))

(defn parse-block
  ([block format]
   (parse-block block format nil))
  ([{:block/keys [uuid content meta file page pre-block?] :as block} format ast]
   (when-not (string/blank? content)
     (let [ast (or ast (format/to-edn content format nil))
           start-pos (:start-pos meta)
           encoded-content (utf8/encode content)
           content-length (utf8/length encoded-content)
           blocks (extract-blocks ast content-length encoded-content)
           ref-pages-atom (atom [])
           blocks (doall
                   (map-indexed
                    (fn [idx {:block/keys [ref-pages ref-blocks meta] :as block}]
                      (let [block (merge
                                   block
                                   {:block/meta meta
                                    :block/marker (get block :block/marker "nil")
                                    :block/properties (get block :block/properties {})
                                    :block/file file
                                    :block/format format
                                    :block/page page
                                    :block/content (utf8/substring encoded-content
                                                                   (:start-pos meta)
                                                                   (:end-pos meta))}
                                   ;; Preserve the original block id
                                   (when (and (zero? idx)
                                              ;; not custom-id
                                              (not (get-in block [:block/properties "custom_id"]))
                                              (not (get-in block [:block/properties "id"])))
                                     {:block/uuid uuid})
                                   (when (seq ref-pages)
                                     {:block/ref-pages
                                      (mapv
                                       (fn [page]
                                         (let [page (page-with-journal page)]
                                           (swap! ref-pages-atom conj page)
                                           page))
                                       ref-pages)}))]
                        (-> block
                            (assoc-in [:block/meta :start-pos] (+ (:start-pos meta) start-pos))
                            (assoc-in [:block/meta :end-pos] (+ (:end-pos meta) start-pos)))))
                    blocks))
           pages (vec (distinct @ref-pages-atom))]
       {:blocks blocks
        :pages pages
        :start-pos start-pos
        :end-pos (+ start-pos content-length)}))))

(defn with-levels
  [text format {:block/keys [level pre-block?]}]
  (let [pattern (config/get-block-pattern format)
        prefix (if pre-block? "" (str (apply str (repeat level pattern)) " "))]
    (str prefix (string/triml text))))

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
  (->> (drop-while break-line-paragraph? ast)
       (take-while (complement break-line-paragraph?))))
