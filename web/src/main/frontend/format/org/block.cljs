(ns frontend.format.org.block
  (:require [frontend.util :as util]))

(defn heading-block?
  [block]
  (and
   (vector? block)
   (= "Heading" (first block))))

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
  (loop [headings []
         heading-children []
         blocks (reverse blocks)
         timestamps {}
         last-pos nil]
    (if (seq blocks)
      (let [block (first blocks)
            level (:level (second block))]
        (cond
          (paragraph-timestamp-block? block)
          (let [timestamp (extract-timestamp block)
                timestamps' (conj timestamps timestamp)]
            (recur headings heading-children (rest blocks) timestamps' last-pos))

          (heading-block? block)
          (let [heading (-> (assoc (second block)
                                   :children (reverse heading-children)
                                   :timestamps timestamps)
                            (assoc-in [:meta :end-pos] last-pos))
                last-pos' (get-in heading [:meta :pos])]
            (recur (conj headings heading) [] (rest blocks) {} last-pos'))

          :else
          (let [heading-children' (conj heading-children block)]
            (recur headings heading-children' (rest blocks) timestamps last-pos))))
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
