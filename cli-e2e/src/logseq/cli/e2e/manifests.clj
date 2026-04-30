(ns logseq.cli.e2e.manifests
  (:require [clojure.edn :as edn]
            [logseq.cli.e2e.paths :as paths]))

(def suite->manifest-files
  {:non-sync {:inventory "non_sync_inventory.edn"
              :cases "non_sync_cases.edn"}
   :sync {:inventory "sync_inventory.edn"
          :cases "sync_cases.edn"}})

(def default-suite :non-sync)

(def ^:private append-merge-keys
  #{:setup :cmds :cleanup :tags})

(def ^:private deep-merge-keys
  #{:vars :covers :expect})

(defn read-edn-file
  [path]
  (edn/read-string (slurp path)))

(defn- normalize-suite
  [suite]
  (let [suite' (cond
                 (nil? suite) default-suite
                 (keyword? suite) suite
                 (string? suite) (keyword suite)
                 :else suite)]
    (when-not (contains? suite->manifest-files suite')
      (throw (ex-info "Unknown cli-e2e suite"
                      {:suite suite
                       :known-suites (sort (keys suite->manifest-files))})))
    suite'))

(defn- manifest-file
  [suite kind]
  (get-in suite->manifest-files [(normalize-suite suite) kind]))

(defn load-inventory
  ([]
   (load-inventory nil))
  ([suite]
   (read-edn-file (paths/spec-path (manifest-file suite :inventory)))))

(defn- normalize-extends
  [extends]
  (let [extends' (cond
                   (nil? extends) []
                   (keyword? extends) [extends]
                   (vector? extends) extends
                   :else
                   (throw (ex-info "Invalid :extends value in cli-e2e manifest"
                                   {:extends extends
                                    :expected "keyword | vector<keyword> | nil"})))
        invalid-entries (remove keyword? extends')]
    (when (seq invalid-entries)
      (throw (ex-info "Invalid :extends entries in cli-e2e manifest"
                      {:extends extends
                       :invalid-entries (vec invalid-entries)
                       :expected "keyword | vector<keyword> | nil"})))
    extends'))

(defn- parse-manifest
  [manifest-data]
  (if-not (map? manifest-data)
    (throw (ex-info "Invalid cli-e2e manifest format"
                    {:manifest-type (type manifest-data)
                     :expected "{:templates {...} :cases [...]}"}))
    (let [templates (or (:templates manifest-data) {})
          cases (:cases manifest-data)]
      (when-not (map? templates)
        (throw (ex-info "Invalid cli-e2e manifest :templates format"
                        {:templates templates
                         :expected "map"})))
      (when-not (vector? cases)
        (throw (ex-info "Invalid cli-e2e manifest :cases format"
                        {:cases cases
                         :expected "vector"})))
      (doseq [case cases]
        (when-not (map? case)
          (throw (ex-info "Invalid cli-e2e case format"
                          {:case case
                           :expected "map"}))))
      {:templates templates
       :cases cases})))

(defn- reachable-template-ids
  [templates roots]
  (loop [stack (vec roots)
         visited #{}]
    (if-let [template-id (peek stack)]
      (if (contains? visited template-id)
        (recur (pop stack) visited)
        (let [template (get templates template-id)
              parent-ids (if template
                           (normalize-extends (:extends template))
                           [])]
          (recur (into (pop stack) parent-ids)
                 (conj visited template-id))))
      visited)))

(defn- lint-manifest!
  [{:keys [templates cases]}]
  (let [template-ids (set (keys templates))
        template-refs (mapcat (fn [[template-id template]]
                                (map (fn [target]
                                       {:type :invalid-extends
                                        :source-type :template
                                        :source template-id
                                        :target target})
                                     (normalize-extends (:extends template))))
                              templates)
        case-refs (mapcat (fn [[index case]]
                            (map (fn [target]
                                   {:type :invalid-extends
                                    :source-type :case
                                    :source (or (:id case)
                                                (str "case#" (inc index)))
                                    :target target})
                                 (normalize-extends (:extends case))))
                          (map-indexed vector cases))
        invalid-extends-issues (->> (concat template-refs case-refs)
                                    (filter (fn [{:keys [target]}]
                                              (not (contains? template-ids target)))))
        duplicate-id-issues (->> cases
                                 (keep :id)
                                 frequencies
                                 (filter (fn [[_ count]] (> count 1)))
                                 (sort-by first)
                                 (map (fn [[case-id count]]
                                        {:type :duplicate-case-id
                                         :id case-id
                                         :count count})))
        roots (->> cases
                   (mapcat #(normalize-extends (:extends %)))
                   distinct)
        used-template-ids (reachable-template-ids templates roots)
        unused-template-issues (->> (keys templates)
                                    (remove used-template-ids)
                                    sort
                                    (map (fn [template-id]
                                           {:type :unused-template
                                            :template template-id})))
        issues (vec (concat invalid-extends-issues
                            duplicate-id-issues
                            unused-template-issues))]
    (when (seq issues)
      (throw (ex-info "cli-e2e manifest lint failed"
                      {:issues issues})))))

(defn- as-seq
  [value]
  (cond
    (nil? value) []
    (sequential? value) value
    :else [value]))

(defn- deep-merge-maps
  [left right]
  (merge-with (fn [left-val right-val]
                (if (and (map? left-val)
                         (map? right-val))
                  (deep-merge-maps left-val right-val)
                  right-val))
              (or left {})
              (or right {})))

(defn- merge-entry
  [parent child]
  (let [all-keys (set (concat (keys parent) (keys child)))]
    (reduce (fn [acc key]
              (let [parent-val (get parent key)
                    child-val (get child key)]
                (assoc acc
                       key
                       (cond
                         (contains? append-merge-keys key)
                         (if (contains? child key)
                           (vec (concat (as-seq parent-val)
                                        (as-seq child-val)))
                           (vec (as-seq parent-val)))

                         (contains? deep-merge-keys key)
                         (if (contains? child key)
                           (deep-merge-maps parent-val child-val)
                           parent-val)

                         (contains? child key)
                         child-val

                         :else
                         parent-val))))
            {}
            all-keys)))

(defn- resolve-template
  [templates template-id stack]
  (when (some #{template-id} stack)
    (throw (ex-info "Circular template inheritance detected in cli-e2e manifest"
                    {:template template-id
                     :cycle (conj (vec stack) template-id)})))
  (let [template (get templates template-id)]
    (when-not template
      (throw (ex-info "Unknown template in cli-e2e manifest"
                      {:template template-id
                       :known-templates (sort (keys templates))})))
    (let [parent-ids (normalize-extends (:extends template))
          parent-values (map #(resolve-template templates % (conj stack template-id))
                             parent-ids)]
      (reduce merge-entry
              {}
              (concat parent-values
                      [(dissoc template :extends)])))))

(defn- expand-manifest-cases
  [{:keys [templates cases]}]
  (mapv (fn [case]
          (let [parent-ids (normalize-extends (:extends case))
                parent-values (map #(resolve-template templates % [])
                                   parent-ids)]
            (reduce merge-entry
                    {}
                    (concat parent-values
                            [(dissoc case :extends)]))))
        cases))

(defn load-cases
  ([]
   (load-cases nil))
  ([suite]
   (let [manifest-data (-> (manifest-file suite :cases)
                           paths/spec-path
                           read-edn-file
                           parse-manifest)]
     (lint-manifest! manifest-data)
     (expand-manifest-cases manifest-data))))
