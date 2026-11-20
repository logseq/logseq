(ns frontend.components.settings-test
  (:require ["fs" :as fs]
            [cljs.test :refer [async deftest is testing]]
            [clojure.string :as string]
            [frontend.components.settings :as settings]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [promesa.core :as p]))

(defn- css-declares-no-drag?
  [css selector]
  (boolean
   (re-find (re-pattern (str "(?s)" selector "[^{]*\\{[^}]*-webkit-app-region:\\s*no-drag"))
            css)))

(deftest language-select-content-opts-out-of-app-region-drag
  (testing "language select popup props punch a no-drag hole in the custom title bar"
    (let [props (settings/language-select-content-props)]
      (is (string/includes? (:class props) "ls-app-no-drag"))
      (is (= "no-drag" (get-in props [:style :app-region])))
      (is (= "no-drag" (get-in props [:style :-webkit-app-region])))
      (is (string/includes? (str (get-in props [:positioner-props :className]))
                            "ls-app-no-drag"))
      (is (= "no-drag" (get-in props [:positioner-props :style :app-region])))
      (is (= "no-drag" (get-in props [:positioner-props :style :-webkit-app-region]))))))

(deftest encryption-settings-hand-auth-to-db-worker-before-fetching-rsa-key-pair
  (async done
         (let [worker-calls (atom [])]
           (-> (p/with-redefs [user-handler/<ensure-id&access-token! (fn [] (p/resolved true))
                               state/get-state (fn []
                                                 {:git/current-repo "logseq_db_local-graph"
                                                  :auth/id-token "id-token"
                                                  :auth/refresh-token "refresh-token"})
                               state/<invoke-db-worker (fn [op & args]
                                                         (swap! worker-calls conj (into [op] args))
                                                         (p/resolved :ok))]
                 (#'settings/<fetch-user-rsa-key-pair "id-token" "user-1"))
               (p/then (fn [_]
                         (is (= [:thread-api/sync-app-state :thread-api/get-user-rsa-key-pair]
                                (mapv first @worker-calls)))
                         (is (= "refresh-token"
                                (:auth/refresh-token (second (first @worker-calls)))))
                         (js/setTimeout done 0)))
               (p/catch (fn [error]
                          (is false (str error))
                          (js/setTimeout done 0)))))))

(deftest language-select-no-drag-css-opts-out-of-app-region
  (testing "CSS selectors used by the language popup opt out of Electron app-region drag"
    (let [settings-css (.readFileSync fs "src/main/frontend/components/settings.css" "utf8")
          shui-css (.readFileSync fs "resources/css/shui.css" "utf8")]
      (is (css-declares-no-drag? settings-css "\\.ls-app-no-drag"))
      (is (css-declares-no-drag? shui-css "\\.ui__select-content"))
      (is (css-declares-no-drag? shui-css "\\.ui__select-item")))))
