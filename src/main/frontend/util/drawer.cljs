(ns frontend.util.drawer
  (:require [clojure.string :as string]
            [frontend.handler.block :as block-handler]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [frontend.format.mldoc :as mldoc]))

(defn drawer-start
  [typ]
  (util/format ":%s:" (string/upper-case typ)))

(defonce drawer-end ":end:")

(defn build-drawer-str
  ([typ]
   (build-drawer-str typ nil))
  ([typ value]
   (if value
     (string/join "\n" [(drawer-start typ) value drawer-end])
     (string/join "\n" [(drawer-start typ) drawer-end]))))

(defn drawer-block?
  [block]
  (and
   (vector? block)
   (= "Drawer" (first block))))

(defn drawer-typ?
  [block typ]
  (and
   (vector? block)
   (drawer-block? block)
   (= typ (second block))))


(defn insert-drawer
  [{:block/keys [format] :as block} content typ value]
  (when (string? content)
    (let [ast (mldoc/->edn content (mldoc/default-config format))
          has-typ-drawer? (mldoc/typ-drawer? (nth ast 2) typ)
          lines (string/split-lines content)
          title (first lines)
          body (string/join "\n" (rest lines))
          start-idx (.indexOf lines (drawer-start typ))
          end-idx (let [[before after] (split-at start-idx lines)]
                    (+ (count before) (.indexOf after drawer-end)))
          result  (cond
                    (not has-typ-drawer?)
                    (let [drawer (build-drawer-str typ value)]
                      (println drawer)
                      ;; (println "Body:\n" body)
                      (if (mldoc/properties? (second ast))
                        (let [prop-start-idx (.indexOf lines property/properties-start)
                              prop-end-idx (.indexOf lines property/properties-end)
                              properties (subvec lines prop-start-idx (inc prop-end-idx))
                              after (subvec lines (inc prop-end-idx))]
                          (string/join "\n" (concat [title] properties [drawer] after)))
                        (str title "\n" drawer body)))

                    (and has-typ-drawer?
                         (>= start-idx 0) (> end-idx 0) (> end-idx start-idx))
                    (let [before (subvec lines 0 start-idx)
                          middle (conj
                                  (subvec lines (inc start-idx) end-idx)
                                  value)
                          after (subvec lines (inc end-idx))
                          lines (concat before [(drawer-start typ)] middle [drawer-end] after)]
                      ;; (println "Concat before: " before)
                      ;; (println "Concat middle: " middle)
                      ;; (println "Concat lines: " lines)
                      (string/join "\n" lines))
                    :else
                    content)]
      ;; (println "Block ast:\n" ast)
      (println "Logbook drawer exist: " has-typ-drawer?)
      ;; (println "Logbook drawer starts at " start-idx)
      ;; (println "Logbook drawer ends at " end-idx)
      (println "Content before:\n" content)
      (println "Content after:\n" result)
      (println "-----------------------------------\n\n\n")
      (string/trimr result))))

(defn get-drawer
  [block typ]
  (remove
   (fn [x] (= x ""))
   (map (fn [x]
          (string/trim x))
        (first (block-handler/walk-block
                block
                (fn [x]
                  (and (drawer-block? x)
                       (= typ (second x))))
                #(next (next %)))))))
