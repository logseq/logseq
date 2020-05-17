(ns frontend.format.block
  (:require [frontend.util :as util]
            [clojure.walk :as walk]
            [clojure.string :as string]
            [frontend.format :as format]
            [frontend.utf8 :as utf8]
            [medley.core :as medley]
            [datascript.core :as d]
            [clojure.set :as set]))

(defn heading-block?
  [block]
  (and
   (vector? block)
   (= "Heading" (first block))))

(defn page-reference-block?
  [block]
  (and
   (vector? block)
   (= "Link" (first block))
   (= "Search" (first (:url (second block))))
   (not (contains? #{\# \*} (first (second (:url (second block))))))
   ))

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
  [[_ properties start-pos end-pos]]
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

(defn ->tags
  [tags]
  (mapv (fn [tag]
          {:db/id tag
           :tag/name tag})
        tags))

(defn with-refs
  [{:keys [title children] :as heading}]
  (let [ref-pages (atom [])]
    (walk/postwalk
     (fn [form]
       (when (page-reference-block? form)
         (let [page (second (:url (second form)))]
           (swap! ref-pages conj (string/capitalize page))))
       form)
     (concat title children))
    (assoc heading :ref-pages (vec @ref-pages))))

(defn safe-headings
  [headings]
  (mapv (fn [heading]
          (let [id (or (when-let [custom-id (get-in heading [:properties :properties "CUSTOM_ID"])]
                         (when (util/uuid-string? custom-id)
                           (uuid custom-id)))
                       ;; editing old headings
                       (:heading/uuid heading)
                       (d/squuid))
                heading (util/remove-nils heading)
                heading (assoc heading :heading/uuid id)]
            (medley/map-keys
             (fn [k] (keyword "heading" k))
             heading)))
        headings))

;; TODO create a dummy heading if no headings exists
(defn extract-headings
  [blocks last-pos]
  (loop [headings []
         heading-children []
         blocks (reverse blocks)
         timestamps {}
         properties {}
         last-pos last-pos]
    (if (seq blocks)
      (let [block (first blocks)
            level (:level (second block))]
        (cond
          (paragraph-timestamp-block? block)
          (let [timestamp (extract-timestamp block)
                timestamps' (conj timestamps timestamp)]
            (recur headings heading-children (rest blocks) timestamps' properties last-pos))

          (properties-block? block)
          (let [properties (extract-properties block)]
            (recur headings heading-children (rest blocks) timestamps properties last-pos))

          (heading-block? block)
          (let [heading (-> (assoc (second block)
                                   :children (reverse heading-children)
                                   :timestamps timestamps
                                   :properties properties)
                            (assoc-in [:meta :end-pos] last-pos)
                            (update :tags ->tags))
                heading (with-refs heading)
                last-pos' (get-in heading [:meta :pos])]
            (recur (conj headings heading) [] (rest blocks) {} properties last-pos'))

          :else
          (let [heading-children' (conj heading-children block)]
            (recur headings heading-children' (rest blocks) timestamps properties last-pos))))
      (reverse headings))))

;; marker: DOING | IN-PROGRESS > TODO > WAITING | WAIT > DONE > CANCELED | CANCELLED
;; priority: A > B > C
(defn sort-tasks
  [headings]
  (let [markers ["DOING" "IN-PROGRESS" "TODO" "WAITING" "WAIT" "DONE" "CANCELED" "CANCELLED"]
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
          headings)))

(defn parse-heading
  [{:heading/keys [uuid content meta file page] :as heading} format]
  (when-not (string/blank? content)
    (let [ast (format/to-edn content format nil)
          start-pos (:pos meta)
          encoded-content (utf8/encode content)
          content-length (utf8/length encoded-content)
          headings (extract-headings ast content-length)
          headings (safe-headings headings)
          ref-pages-atom (atom [])
          headings (doall
                    (map-indexed
                     (fn [idx {:heading/keys [ref-pages meta] :as heading}]
                       (let [heading (merge
                                      heading
                                      {:heading/meta meta
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
                                            (let [page-name (string/capitalize page)
                                                  page {:page/name page-name}]
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
