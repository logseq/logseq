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
  (cond
    (nil? extends) []
    (keyword? extends) [extends]
    (vector? extends) extends
    :else
    (throw (ex-info "Invalid :extends value in cli-e2e manifest"
                    {:extends extends
                     :expected "keyword | vector | nil"}))))

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
  [manifest-data]
  (cond
    (vector? manifest-data)
    (vec manifest-data)

    (map? manifest-data)
    (let [templates (:templates manifest-data {})
          cases (:cases manifest-data)]
      (when-not (vector? cases)
        (throw (ex-info "Invalid cli-e2e manifest format"
                        {:manifest-type :map
                         :expected "{:templates {...} :cases [...] }"})))
      (mapv (fn [case]
              (let [parent-ids (normalize-extends (:extends case))
                    parent-values (map #(resolve-template templates % [])
                                       parent-ids)]
                (reduce merge-entry
                        {}
                        (concat parent-values
                                [(dissoc case :extends)]))))
            cases))

    :else
    (throw (ex-info "Invalid cli-e2e manifest format"
                    {:manifest-type (type manifest-data)
                     :expected "vector | {:templates ... :cases ...}"}))))

(defn load-cases
  ([]
   (load-cases nil))
  ([suite]
   (-> (manifest-file suite :cases)
       paths/spec-path
       read-edn-file
       expand-manifest-cases)))
