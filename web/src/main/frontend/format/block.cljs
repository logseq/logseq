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
  (when (and (vector? block) (= "Link" (first block)))
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
        (:link (second (:url (second block)))))))))

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
  [[_ properties start-pos end-pos :as all]]
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

(defn with-refs
  [{:keys [title body tags] :as heading}]
  (let [tags (mapv :tag/name (util/->tags (map :tag/name tags)))
        ref-pages (atom tags)]
    (walk/postwalk
     (fn [form]
       (when-let [page (get-page-reference form)]
         (swap! ref-pages conj (string/lower-case page)))
       (when-let [tag (get-tag form)]
         (when (util/tag-valid? tag)
           (swap! ref-pages conj (string/lower-case tag))))
       form)
     (concat title body))
    (let [ref-pages (remove string/blank? @ref-pages)]
      (assoc heading :ref-pages (vec ref-pages)))))

(defn safe-headings
  [headings]
  (map (fn [heading]
         (let [heading (util/remove-nils heading)]
           (medley/map-keys
            (fn [k] (keyword "heading" k))
            heading)))
    headings))

(defn collect-heading-tags
  [{:keys [title body tags] :as heading}]
  (cond-> heading
    (seq tags)
    (assoc :tags (util/->tags tags))))

(defn extract-headings
  [blocks last-pos encoded-content]
  (let [headings
        (loop [headings []
               heading-body []
               blocks (reverse blocks)
               timestamps {}
               properties {}
               last-pos last-pos
               last-level 1000
               children []]
          (if (seq blocks)
            (let [block (first blocks)
                  level (:level (second block))]
              (cond
                (paragraph-timestamp-block? block)
                (let [timestamp (extract-timestamp block)
                      timestamps' (conj timestamps timestamp)]
                  (recur headings heading-body (rest blocks) timestamps' properties last-pos last-level children))

                (properties-block? block)
                (let [properties (extract-properties block)]
                  (recur headings heading-body (rest blocks) timestamps properties last-pos last-level children))

                (heading-block? block)
                (let [id (or (when-let [custom-id (get-in properties [:properties "CUSTOM_ID"])]
                               (when (util/uuid-string? custom-id)
                                 (uuid custom-id)))
                             (d/squuid))
                      heading (second block)
                      level (:level heading)
                      [children current-heading-children]
                      (cond
                        (>= level last-level)
                        [(conj children [id level])
                         #{}]

                        (< level last-level)
                        (let [current-heading-children (set (->> (filter #(< level (second %)) children)
                                                                 (map first)))
                              others (vec (remove #(< level (second %)) children))]
                          [(conj others [id level])
                           current-heading-children]))
                      heading (-> (assoc heading
                                         :uuid id
                                         :body (vec (reverse heading-body))
                                         :timestamps timestamps
                                         :properties (:properties properties)
                                         :properties-meta (dissoc properties :properties)
                                         :children (or current-heading-children []))
                                  (assoc-in [:meta :end-pos] last-pos))
                      heading (collect-heading-tags heading)
                      heading (with-refs heading)
                      last-pos' (get-in heading [:meta :pos])]
                  (recur (conj headings heading) [] (rest blocks) {} {} last-pos' (:level heading) children))

                :else
                (let [heading-body' (conj heading-body block)]
                  (recur headings heading-body' (rest blocks) timestamps properties last-pos last-level children))))
            (-> (reverse headings)
                safe-headings)))]
    (let [first-heading (first headings)
          first-heading-start-pos (get-in first-heading [:heading/meta :pos])]
      (if (and
           (not (string/blank? encoded-content))
           (or (empty? headings)
               (> first-heading-start-pos 1)))
        (cons
         (merge
          (let [content (utf8/substring encoded-content 0 first-heading-start-pos)
                uuid (d/squuid)]
            {:heading/uuid uuid
             :heading/content content
             :heading/anchor (str uuid)
             :heading/level 2
             :heading/meta {:pos 0
                            :end-pos (or first-heading-start-pos
                                         (utf8/length encoded-content))}
             :heading/body (take-while (fn [block] (not (heading-block? block))) blocks)
             :heading/pre-heading? true})
          (select-keys first-heading [:heading/file :heading/format :heading/page]))
         headings)
        headings))))

(defn- page-with-journal
  [page-name]
  (when page-name
    (let [page-name (string/lower-case page-name)]
      (if-let [d (date/journal-title->int (string/capitalize page-name))]
       {:page/name page-name
        :page/journal? true
        :page/journal-day d}
       {:page/name page-name}))))

(defn parse-heading
  [{:heading/keys [uuid content meta file page] :as heading} format]
  (when-not (string/blank? content)
    (let [ast (format/to-edn content format nil)
          start-pos (:pos meta)
          encoded-content (utf8/encode content)
          content-length (utf8/length encoded-content)
          headings (extract-headings ast content-length encoded-content)
          ref-pages-atom (atom [])
          headings (doall
                    (map-indexed
                     (fn [idx {:heading/keys [ref-pages meta] :as heading}]
                       (let [heading (collect-heading-tags heading)
                             heading (merge
                                      heading
                                      {:heading/meta meta
                                       :heading/marker (get heading :heading/marker "nil")
                                       :heading/properties (get heading :heading/properties [])
                                       :heading/properties-meta (get heading :heading/properties-meta [])
                                       :heading/file file
                                       :heading/format format
                                       :heading/page page
                                       :heading/content (utf8/substring encoded-content
                                                                        (:pos meta)
                                                                        (:end-pos meta))}
                                      ;; Preserve the original heading id
                                      (when (and (zero? idx)
                                                 ;; not custom-id
                                                 (not (get-in heading [:heading/properties "CUSTOM_ID"])))
                                        {:heading/uuid uuid})
                                      (when (seq ref-pages)
                                        {:heading/ref-pages
                                         (mapv
                                          (fn [page]
                                            (let [page-name (string/lower-case page)
                                                  page (page-with-journal page-name)]
                                              (swap! ref-pages-atom conj page)
                                              page))
                                          ref-pages)}))]
                         (-> heading
                             (assoc-in [:heading/meta :pos] (+ (:pos meta) start-pos))
                             (assoc-in [:heading/meta :end-pos] (+ (:end-pos meta) start-pos)))))
                     headings))
          pages (vec (distinct @ref-pages-atom))]
      {:headings headings
       :pages pages
       :start-pos start-pos
       :end-pos (+ start-pos content-length)})))

(defn with-levels
  [text format {:heading/keys [level pre-heading?]}]
  (let [pattern (config/get-heading-pattern format)
        prefix (if pre-heading? "" (str (apply str (repeat level pattern)) " "))]
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
    [headings]
    (let [markers ["NOW" "LATER" "DOING" "IN-PROGRESS" "TODO" "WAITING" "WAIT" "DONE" "CANCELED" "CANCELLED"]
          markers (zipmap markers (reverse (range 1 (count markers))))
          priorities ["A" "B" "C" "D" "E" "F" "G"]
          priorities (zipmap priorities (reverse (range 1 (count priorities))))]
      (sort (fn [t1 t2]
              (let [m1 (get markers (:heading/marker t1) 0)
                    m2 (get markers (:heading/marker t2) 0)
                    p1 (get priorities (:heading/priority t1) 0)
                    p2 (get priorities (:heading/priority t2) 0)]
                (cond
                  (and (= m1 m2)
                       (= p1 p2))
                  (compare (str (:heading/title t1))
                           (str (:heading/title t2)))

                  (= m1 m2)
                  (> p1 p2)
                  :else
                  (> m1 m2))))
            headings))))
