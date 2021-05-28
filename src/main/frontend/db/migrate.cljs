(ns frontend.db.migrate
  (:require [clojure.walk :as walk]
            [datascript.core :as d]
            [frontend.db-schema :as db-schema]
            [frontend.state :as state]))

(defonce debug-db (atom nil))

(defn- migrate-attribute
  [f]
  (if (and (keyword? f) (= "page" (namespace f)))
    (let [k (keyword "block" (name f))]
      (case k
        :block/ref-pages
        :block/refs
        k))
    f))

(defn with-schema [db new-schema]
  (let [datoms (->> (d/datoms db :eavt)
                    (map (fn [d]
                           (let [a (migrate-attribute (:a d))]
                             (d/datom (:e d) a (:v d) (:tx d) (:added d))))))]
    (-> (d/empty-db new-schema)
       (with-meta (meta db))
       (d/db-with datoms))))

(defn migrate
  [repo db]
  (prn "Migrate DB")
  (reset! debug-db db)
  (state/pub-event! [:graph/added repo])
  (with-schema db db-schema/schema))
