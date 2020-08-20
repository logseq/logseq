(ns frontend.format.block
  (:require [frontend.util :as util :refer-macros [profile]]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [frontend.format :as format]
            [frontend.utf8 :as utf8]
            [medley.core :as medley]
            [frontend.config :as config]
            [datascript.core :as d]
            [clojure.set :as set]
            [frontend.date :as date]))

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
  (cond
    (and (vector? block) (= "Link" (first block)))
    (let [typ (first (:url (second block)))]
      (or
       (and
        (= typ "Search")
        (not (contains? #{\# \* \/ \( \[} (first (second (:url (second block))))))
        (let [page (second (:url (second block)))]
          (when (and (not (string/starts-with? page "http"))
                     (not (string/starts-with? page "file"))
                     (not (string/ends-with? page ".html")))
            page)))

       (and
        (= typ "Complex")
        (= (:protocol (second (:url (second block)))) "file")
        (:link (second (:url (second block)))))))

    (and (vector? block) (= "Nested_link" (first block)))
    (let [content (:content (last block))]
      (subs content 2 (- (count content) 2)))

    :else
    nil))

(defn get-block-reference
  [block]
  (when-let [block-id (and (vector? block)
                           (= "Block_reference" (first block))
                           (last block))]
    (when (util/uuid-string? block-id)
      block-id)))

(defn task-block?
  [block]
  (and
   (heading-block? block)
   (some? (:marker (second block)))))

;; FIXME:
(defn extract-title
  [block]
  (-> (:title (second block))
      first
      second))

(defn- paragraph-block?
  [block]
  (and
   (vector? block)
   (= "Paragraph" (first block))))

(defn- timestamp-block?
  [block]
  (and
   (vector? block)
   (= "Timestamp" (first block))))

(defn- properties-block?
  [block]
  (and
   (vector? block)
   (= "Property_Drawer" (first block))))

(defn extract-properties
  [[_ properties] start-pos end-pos]
  {:properties (into {} properties)
   :start-pos start-pos
   :end-pos end-pos})

(defn- paragraph-timestamp-block?
  [block]
  (and (paragraph-block? block)
       (timestamp-block? (first (second block)))))

(defn extract-timestamp
  [block]
  (-> block
      second
      first
      second))

(defn with-page-refs
  [{:keys [title body tags] :as block}]
  (let [tags (mapv :tag/name (util/->tags (map :tag/name tags)))
        ref-pages (atom tags)]
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

(defn safe-blocks
  [blocks]
  (map (fn [block]
         (let [block (util/remove-nils block)]
           (medley/map-keys
            (fn [k] (keyword "block" k))
            block)))
    blocks))

(defn collect-block-tags
  [{:keys [title body tags] :as block}]
  (cond-> block
    (seq tags)
    (assoc :tags (util/->tags tags))))

(defn extract-blocks
  [blocks last-pos encoded-content]
  (let [block-refs (atom [])
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
                  level (:level (second block))]
              (cond
                (paragraph-timestamp-block? block)
                (let [timestamp (extract-timestamp block)
                      timestamps' (conj timestamps timestamp)]
                  (recur headings block-body (rest blocks) timestamps' properties last-pos last-level children))

                (properties-block? block)
                (let [properties (extract-properties block start_pos end_pos)]
                  (recur headings block-body (rest blocks) timestamps properties last-pos last-level children))

                (heading-block? block)
                (let [id (or (when-let [custom-id (get-in properties [:properties "CUSTOM_ID"])]
                               (when (util/uuid-string? custom-id)
                                 (uuid custom-id)))
                             (d/squuid))
                      block (second block)
                      level (:level block)
                      [children current-block-children]
                      (cond
                        (>= level last-level)
                        [(conj children [id level])
                         #{}]

                        (< level last-level)
                        (let [current-block-children (set (->> (filter #(< level (second %)) children)
                                                               (map first)))
                              others (vec (remove #(< level (second %)) children))]
                          [(conj others [id level])
                           current-block-children]))
                      block (-> (assoc block
                                       :uuid id
                                       :body (vec (reverse block-body))
                                       :timestamps timestamps
                                       :properties (:properties properties)
                                       :properties-meta (dissoc properties :properties)
                                       :children (or current-block-children []))
                                (assoc-in [:meta :start-pos] start_pos)
                                (assoc-in [:meta :end-pos] last-pos))
                      block (collect-block-tags block)
                      block (with-page-refs block)
                      block (with-block-refs block)
                      _ (swap! block-refs
                               (fn [refs]
                                 (->> (concat refs (:ref-blocks block))
                                      (remove nil?)
                                      (distinct))))
                      last-pos' (get-in block [:meta :start-pos])]
                  (recur (conj headings block) [] (rest blocks) {} {} last-pos' (:level block) children))

                :else
                (let [block-body' (conj block-body block)]
                  (recur headings block-body' (rest blocks) timestamps properties last-pos last-level children))))
            (-> (reverse headings)
                safe-blocks)))]
    (let [first-block (first blocks)
          first-block-start-pos (get-in first-block [:block/meta :start-pos])
          blocks (if (and
                      (not (string/blank? encoded-content))
                      (or (empty? blocks)
                          (> first-block-start-pos 1)))
                   (cons
                    (merge
                     (let [content (utf8/substring encoded-content 0 first-block-start-pos)
                           uuid (d/squuid)]
                       {:block/uuid uuid
                        :block/content content
                        :block/anchor (str uuid)
                        :block/level 2
                        :block/meta {:start-pos 0
                                     :end-pos (or first-block-start-pos
                                                  (utf8/length encoded-content))}
                        :block/body (take-while (fn [block] (not (heading-block? block))) blocks)
                        :block/pre-block? true})
                     (select-keys first-block [:block/file :block/format :block/page]))
                    blocks)
                   blocks)
          block-refs (mapv
                      (fn [[_ block-uuid]]
                        {:block/uuid block-uuid})
                      @block-refs)]
      [block-refs blocks])))

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
  [{:block/keys [uuid content meta file page] :as block} format]
  (when-not (string/blank? content)
    (let [ast (format/to-edn content format nil)
          start-pos (:start-pos meta)
          encoded-content (utf8/encode content)
          content-length (utf8/length encoded-content)
          [block-refs blocks] (extract-blocks ast content-length encoded-content)
          ref-pages-atom (atom [])
          blocks (doall
                  (map-indexed
                   (fn [idx {:block/keys [ref-pages ref-blocks meta] :as block}]
                     (let [block (collect-block-tags block)
                           block (merge
                                  block
                                  {:block/meta meta
                                   :block/marker (get block :block/marker "nil")
                                   :block/properties (get block :block/properties [])
                                   :block/properties-meta (get block :block/properties-meta [])
                                   :block/file file
                                   :block/format format
                                   :block/page page
                                   :block/content (utf8/substring encoded-content
                                                                  (:start-pos meta)
                                                                  (:end-pos meta))}
                                  ;; Preserve the original block id
                                  (when (and (zero? idx)
                                             ;; not custom-id
                                             (not (get-in block [:block/properties "CUSTOM_ID"])))
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
      {:block-refs block-refs
       :blocks blocks
       :pages pages
       :start-pos start-pos
       :end-pos (+ start-pos content-length)})))

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

(comment
  (defn sort-tasks
    [blocks]
    (let [markers ["NOW" "LATER" "DOING" "IN-PROGRESS" "TODO" "WAITING" "WAIT" "DONE" "CANCELED" "CANCELLED"]
          markers (zipmap markers (reverse (range 1 (count markers))))
          priorities ["A" "B" "C" "D" "E" "F" "G"]
          priorities (zipmap priorities (reverse (range 1 (count priorities))))]
      (sort (fn [t1 t2]
              (let [m1 (get markers (:block/marker t1) 0)
                    m2 (get markers (:block/marker t2) 0)
                    p1 (get priorities (:block/priority t1) 0)
                    p2 (get priorities (:block/priority t2) 0)]
                (cond
                  (and (= m1 m2)
                       (= p1 p2))
                  (compare (str (:block/title t1))
                           (str (:block/title t2)))

                  (= m1 m2)
                  (> p1 p2)
                  :else
                  (> m1 m2))))
            blocks)))

  (def file-content "# Aug 1st, 2020\n# Aug 2nd, 2020\n# Aug 3rd, 2020\n# Aug 4th, 2020\n# Aug 5th, 2020\n# Aug 6th, 2020\n# Aug 7th, 2020\n# Aug 8th, 2020\n# Aug 9th, 2020\n# Aug 10th, 2020\n# Aug 11th, 2020\n# Aug 12th, 2020\n# Aug 13th, 2020\n# Aug 14th, 2020\n# Aug 15th, 2020\n# Aug 16th, 2020\n# Aug 17th, 2020\n# Aug 18th, 2020\n# Aug 19th, 2020\n# Aug 20th, 2020\n# Aug 21st, 2020\n# Aug 22nd, 2020\n# Aug 23rd, 2020\n# Aug 24th, 2020\n# Aug 25th, 2020\n# Aug 26th, 2020\n# Aug 27th, 2020\n# Aug 28th, 2020\n# Aug 29th, 2020\n# Aug 30th, 2020\n# Aug 31st, 2020\n")

  (def ast (frontend.format.mldoc/->edn file-content (frontend.format.mldoc/default-config :markdown)))

  (let [utf8-content (utf8/encode file-content)]
    (extract-blocks ast (utf8/length utf8-content) utf8-content))
  )
