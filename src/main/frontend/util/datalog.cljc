(ns frontend.util.datalog
  "Utility fns related to datalog queries and rules")

(defn find-rules-in-where
  "Given where clauses and a set of valid rules, returns rules found in where
  clause as keywords. A more advanced version of this would use a datalog parser
and not require valid-rules"
  [where valid-rules]
  (->> where
       flatten
       distinct
       (filter #(and (symbol? %) (contains? valid-rules (keyword %))))
       (map keyword)))

(defn query-vec->map
  "Converts query vec to query map. Modified version of
  datascript.parser/query->map which preserves insertion order in case map is
  converted back to vec"
  [query-vec]
  (loop [parsed (array-map) key nil qs query-vec]
    (if-let [q (first qs)]
      (if (keyword? q)
        (recur parsed q (next qs))
        (recur (update-in parsed [key] (fnil conj []) q) key (next qs)))
      parsed)))

(defn add-to-end-of-query-section
  "Adds vec of elements to end of a query section e.g. :find or :in"
  [query-vec query-kw elems]
  (let [query-map (query-vec->map query-vec)]
    (vec
     (reduce (fn [acc [k v]]
               (concat acc [k] v (when (= k query-kw) elems)))
             '()
             query-map))))
