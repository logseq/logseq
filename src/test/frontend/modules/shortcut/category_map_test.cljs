(ns frontend.modules.shortcut.category-map-test
  "build-category-map selects the same shortcuts as the per-shortcut filter it
  replaced, for every kind of category spec."
  (:require [cljs.test :refer [deftest is]]
            [frontend.modules.shortcut.config :as config]))

(defn- reference-keys
  "The shortcut ids the previous filter selected (sets rebuilt per shortcut)."
  [{:keys [ns includes excludes]}]
  (->> (keys config/all-built-in-keyboard-shortcuts)
       (filter (fn [k]
                 (and (or (and ns (keyword? k)
                               (contains? (->> (if (seqable? ns) (seq ns) [ns]) (map #(name %)) (set))
                                          (namespace k)))
                          (and includes (contains? (set includes) k)))
                      (if (not (seq excludes)) true (not (contains? (set excludes) k))))))
       (select-keys config/all-built-in-keyboard-shortcuts)
       (remove (comp :inactive val))
       (map key)
       set))

(deftest every-kind-of-spec-selects-the-same-shortcuts
  (let [some-ids (take 3 (keys config/all-built-in-keyboard-shortcuts))]
    (doseq [spec [{:ns :editor}
                  {:ns :date-picker}
                  {:ns #{:editor :ui :go}}
                  {:ns [:editor] :excludes [:editor/new-block]}
                  {:ns []}
                  {:includes (vec some-ids)}
                  {:includes []}
                  {:ns :go :includes (vec some-ids) :excludes [(first some-ids)]}
                  {:excludes []}]]
      (is (= (reference-keys spec) (set (keys (config/build-category-map spec)))) (pr-str spec)))))
