(ns frontend.format.org.block
  (:require [frontend.util :as util]))

(defn- heading-block?
  [block]
  (and
   (vector? block)
   (= "Heading" (first block))))

(defn- task-block?
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

(defn extract-headings
  [blocks]
  [blocks]
  (let [reversed-blocks (reverse blocks)]
    (loop [child-level 0
           current-heading-children []
           children-headings []
           result []
           rblocks reversed-blocks
           timestamps {}]
      (if (seq rblocks)
        (let [block (first rblocks)
              level (:level (second block))]
          (cond
            (and (>= level child-level) (heading-block? block))
            (let [heading (assoc (second block)
                                 :children (reverse current-heading-children)
                                 :timestamps timestamps)
                  children-headings (conj children-headings heading)]
              (recur level [] children-headings result (rest rblocks) {}))

            (paragraph-timestamp-block? block)
            (let [timestamp (extract-timestamp block)
                  timestamps' (conj timestamps timestamp)]
              (recur child-level current-heading-children children-headings result (rest rblocks) timestamps'))

            :else
            (let [children (conj current-heading-children block)]
              (if (and level (< level child-level))
                (let [parent-title (extract-title block)
                      children-headings (map (fn [heading]
                                               (assoc heading :parent-title parent-title))
                                          children-headings)
                      result (concat result children-headings)]
                  (recur 0 children [] result (rest rblocks) timestamps))
                (recur child-level children children-headings result (rest rblocks) timestamps)))))
        (reverse result)))))

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
              (if (= m1 m2)
                (> p1 p2)
                (> m1 m2))))
          headings)))

(defn group-by-parent
  [headings]
  (group-by :heading/parent-title headings))
