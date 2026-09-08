(ns frontend.components.block.breadcrumb-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.components.block :as block]
            [frontend.components.block.breadcrumb-model :as model]
            [frontend.db.hooks :as db-hooks]
            [goog.object :as gobj]
            [logseq.shui.ui :as shui]))

(defn- render-static
  [element]
  (let [previous-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (.renderToStaticMarkup react-dom-server element)
      (finally
        (if (some? previous-react)
          (gobj/set js/globalThis "React" previous-react)
          (js-delete js/globalThis "React"))))))

(defn- breadcrumb-fixture
  []
  (let [breadcrumb-ancestors (mapv (fn [index]
                          {:block/uuid (random-uuid)
                           :block/title (str "Ancestor " index)})
                        (range 7))]
    {:target (random-uuid)
     :breadcrumb-ancestors breadcrumb-ancestors
     :entities (into {} (map (juxt :block/uuid identity)) breadcrumb-ancestors)}))

(deftest breadcrumb-loads-resource-and-only-visible-ancestors-test
  (let [{:keys [target breadcrumb-ancestors entities]} (breadcrumb-fixture)
        resources (atom [])
        loaded (atom [])]
    (with-redefs [db-hooks/use-resource
                  (fn [resource-key]
                    (swap! resources conj resource-key)
                    {:ancestor-uuids (mapv :block/uuid breadcrumb-ancestors) :ref-titles {}})
                  db-hooks/use-block
                  (fn [block-uuid]
                    (swap! loaded conj block-uuid)
                    (get entities block-uuid))
                  block/breadcrumb-overflow-dropdown (fn [& _] [:span "overflow"])]
      (let [markup (render-static (block/breadcrumb {} nil target {:disabled? true}))]
        (is (= [[:block-breadcrumb target 16]] @resources))
        (is (= (mapv :block/uuid [(first breadcrumb-ancestors) (nth breadcrumb-ancestors 5) (last breadcrumb-ancestors)])
               @loaded))
        (is (string/includes? markup "Ancestor 0"))
        (is (string/includes? markup "Ancestor 5"))
        (is (string/includes? markup "Ancestor 6"))
        (is (string/includes? markup "overflow"))
        (is (not (string/includes? markup "Ancestor 3")))))))

(deftest breadcrumb-resource-hydrates-title-references-test
  (let [target (random-uuid)
        ancestor (random-uuid)
        referenced (random-uuid)
        title (str "See [[" referenced "]]")]
    (with-redefs [db-hooks/use-resource
                  (constantly {:ancestor-uuids [ancestor]
                               :ref-titles {referenced "Referenced title"}})
                  db-hooks/use-block
                  (fn [block-uuid]
                    (when (= block-uuid ancestor)
                      {:block/uuid ancestor
                       :block/title title
                       :block/raw-title title
                       :block/refs [{:block/uuid referenced}]}))]
      (let [markup (render-static (block/breadcrumb {} nil target {:disabled? true}))]
        (is (string/includes? markup "See [[Referenced title]]"))
        (is (not (string/includes? markup (str referenced))))))))

(deftest breadcrumb-does-not-load-ancestors-before-resource-is-ready-test
  (doseq [resource [nil {:ancestor-uuids [] :ref-titles {}}]]
    (with-redefs [db-hooks/use-resource (constantly resource)
                  db-hooks/use-block (fn [_] (is false "No block should be loaded"))]
      (is (= "" (render-static (block/breadcrumb {} nil (random-uuid) {})))))))

(deftest search-breadcrumb-keeps-inline-payload-test
  (with-redefs [db-hooks/use-resource (fn [_] (is false "Search already supplied breadcrumb-ancestors"))
                db-hooks/use-block (constantly nil)]
    (let [ancestor {:block/uuid (random-uuid) :block/title "Search ancestor"}
          markup (render-static
                  (block/breadcrumb {:search? true} nil (random-uuid)
                                    {:block {:block.temp/breadcrumb [ancestor]}}))]
      (is (string/includes? markup "Search ancestor")))))

(deftest breadcrumb-overflow-loads-hidden-resource-ancestors-test
  (let [{:keys [target breadcrumb-ancestors entities]} (breadcrumb-fixture)
        resources (atom [])
        loaded (atom [])]
    (with-redefs [db-hooks/use-resource
                  (fn [resource-key]
                    (swap! resources conj resource-key)
                    {:ancestor-uuids (mapv :block/uuid breadcrumb-ancestors) :ref-titles {}})
                  db-hooks/use-block
                  (fn [block-uuid]
                    (swap! loaded conj block-uuid)
                    (get entities block-uuid))
                  shui/dropdown-menu-content (fn [_opts & children] (into [:div] children))
                  shui/dropdown-menu-item (fn [_opts & children] (into [:div] children))]
      (let [markup (render-static
                    (block/breadcrumb-overflow-content
                     {} target {:disabled? true} (model/variant-options :block-page) true))]
        (is (= [[:block-breadcrumb target 1000]] @resources))
        (is (= (mapv :block/uuid (subvec breadcrumb-ancestors 1 5)) @loaded))
        (is (string/includes? markup "Ancestor 3"))))))
