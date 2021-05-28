(ns frontend.db.migrate
  (:require [clojure.walk :as walk]))

(defonce debug-db (atom nil))
(defn migrate
  [db]
  (prn "migrate")
  (reset! debug-db db)
  (walk/postwalk
   (fn [f]
     (if (and (keyword? f) (= :page (namespace f)))
       (let [k (keyword "block" (name f))]
         (case k
           :block/ref-pages
           :block/refs
           k))
       f))
   db))
