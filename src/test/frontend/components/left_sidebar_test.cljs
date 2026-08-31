(ns frontend.components.left-sidebar-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.left-sidebar :as left-sidebar]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.db.hooks :as db-hooks]
            [frontend.rfx :as rfx]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [goog.object :as gobj]
            [logseq.shui.hooks :as hooks]
            [logseq.shui.ui :as shui]
            [reitit.frontend.easy :as rfe]))

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

(deftest mobile-sidebar-navigation-target-test
  (let [target (fn [matching-selector]
                 #js {:closest (fn [selector]
                                 (when (= matching-selector selector)
                                   #js {}))})]
    (testing "links that navigate away from the mobile sidebar"
      (doseq [selector [".sidebar-navigations a"
                        ".favorites .bd"
                        ".recent .bd"
                        ".nav-header"]]
        (is (true? (left-sidebar/mobile-navigation-target? (target selector)))
            selector)))
    (testing "popup triggers and unrelated sidebar controls"
      (is (false? (left-sidebar/mobile-navigation-target?
                   (target ".dropdown-wrapper"))))
      (is (false? (left-sidebar/mobile-navigation-target? (target nil)))))))

(deftest tag-navigations-use-persisted-class-uuids-test
  (let [task-uuid (random-uuid)
        asset-uuid (random-uuid)
        resource-keys (atom [])
        render! (fn []
                  (with-redefs [config/db-based-graph? (constantly true)
                                db-hooks/use-resource-snapshot
                                (fn [resource-key]
                                  (swap! resource-keys conj resource-key)
                                  {:status :ready
                                   :value (case (second resource-key)
                                            :logseq.class/Task task-uuid
                                            :logseq.class/Asset asset-uuid
                                            nil)})
                                hooks/use-effect! (fn [& _args])
                                hooks/use-state (fn [initial] [initial (fn [& _args])])
                                i18n/t name
                                left-sidebar/sidebar-content-group
                                (fn [_title _opts child] child)
                                rfe/href (fn [_route {:keys [name]}]
                                           (str "/page/" name))
                                rfx/use-sub (constantly nil)
                                shui/tabler-icon (fn [& _args])
                                state/get-current-repo (constantly "test-repo")
                                storage/get (constantly [:tag/tasks :tag/assets])]
                    (render-static
                     (left-sidebar/sidebar-navigations
                      {:default-home nil
                       :route-match nil
                       :route-name nil
                       :srs-open? false}))))]
    (testing "DB graphs render tag links from the actual class entities"
      (let [markup (render!)]
        (is (= [[:page-uuid-by-ident :logseq.class/Task]
                [:page-uuid-by-ident :logseq.class/Asset]]
               @resource-keys))
        (is (string/includes? markup (str "/page/" task-uuid)))
        (is (string/includes? markup (str "/page/" asset-uuid)))))))
