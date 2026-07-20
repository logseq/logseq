(ns frontend.components.render-simplicity-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]))

(defn- source-for
  [relative-file]
  (.toString
   (fs/readFileSync (node-path/join (.cwd js/process) relative-file) "utf8")))

(defn- form-source
  [source marker]
  (let [start (string/index-of source marker)
        end (when start
              (or (some->> ["\n(hsx/defc "
                            "\n(defn"
                            "\n(def "
                            "\n(declare "]
                           (keep #(string/index-of source % (inc start)))
                           seq
                           (apply min))
                  (count source)))]
    (when (and start end)
      (subs source start end))))

(deftest all-pages-and-property-objects-subscribe-without-local-loaders-test
  (let [all-pages-source (source-for "src/main/frontend/components/all_pages.cljs")
        all-pages-form (form-source all-pages-source "(hsx/defc all-pages")
        objects-source (source-for "src/main/frontend/components/objects.cljs")
        property-objects-form (form-source objects-source
                                           "(hsx/defc property-related-objects\n")]
    (is (some? all-pages-form))
    (is (some? property-objects-form))
    (when all-pages-form
      (is (string/includes? all-pages-form
                            "db-hooks/use-resource [:page-identity common-config/views-page-name]"))
      (is (string/includes? all-pages-form ":view-parent-uuid view-parent-uuid"))
      (doseq [forbidden ["hooks/use-state"
                         "hooks/use-effect"
                         "db-async/<get-block"
                         "set-view-parent!"]]
        (is (not (string/includes? all-pages-form forbidden)))))
    (when property-objects-form
      (is (string/includes? property-objects-form "properties [property]"))
      (doseq [forbidden ["tags-property"
                         "hooks/use-state"
                         "hooks/use-effect"
                         ":thread-api/pull"]]
        (is (not (string/includes? property-objects-form forbidden)))))))

(deftest render-interactions-do-not-prefetch-ignored-blocks-test
  (let [source (source-for "src/main/frontend/components/views.cljs")
        forms (mapv #(form-source source %)
                    ["(hsx/defc header-checkbox"
                     "(hsx/defc row-checkbox"
                     "(hsx/defc gallery-card-checkbox"
                     "(hsx/defc table-row-inner"
                     "(hsx/defc ^:large-vars/cleanup-todo filter-value-select"
                     "(hsx/defc gallery-action-bar"])]
    (is (every? some? forms))
    (doseq [form forms]
      (is (not (string/includes? form "db-async/<get-blocks")))
      (is (not (string/includes? form "db-async/<get-block "))))
    (is (not (string/includes? (nth forms 3) ":on-pointer-down")))
    (is (not (string/includes? (nth forms 4) "hooks/use-effect")))
    (testing "reads whose results drive actions remain explicit"
      (is (string/includes? (form-source source "(defn- on-delete-rows")
                            "results (db-async/<get-blocks"))
      (is (string/includes? (form-source source "(defn- create-view!")
                            "page (db-async/<get-block")))))

(deftest property-actions-do-not-prefetch-ignored-blocks-test
  (let [config-source (source-for "src/main/frontend/components/property/config.cljs")
        popup-form (form-source config-source "(defn- maybe-show-add-choice-popup!")
        value-source (source-for "src/main/frontend/components/property/value.cljs")
        update-form (form-source value-source "(defn- add-or-remove-property-value")]
    (is (some? popup-form))
    (is (some? update-form))
    (when popup-form
      (is (not (string/includes? popup-form "db-async/<get-blocks"))))
    (when update-form
      (is (= 1 (count (re-seq #"db-async/<get-block\b" update-form)))
          "Only the current block read drives property selection behavior."))))
