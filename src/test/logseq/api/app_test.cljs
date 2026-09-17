(ns logseq.api.app-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.handler.command-palette :as palette-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.recent :as recent-handler]
            [frontend.state :as state]
            [frontend.version :as fv]
            [logseq.api :as api]
            [logseq.api.app :as api-app]
            [logseq.api.test-helper :as api-test]
            [promesa.core :as p]
            [reitit.frontend.easy :as rfe]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(deftest app-info-and-user-configs
  (let [info (api-test/js->clj-kw (api-app/get_app_info))
        configs (api-test/js->clj-kw (api-app/get_user_configs))]
    (is (= fv/version (:version info)))
    (is (true? (:supportDb info)))
    (is (= "logseq_db_test-db" (:currentGraph configs)))))

(deftest store-state-get-and-set
  (state/set-state! :ui/theme "light")
  (is (= "light" (api-app/get_state_from_store "ui/theme")))
  (api-app/set_state_from_store #js ["ui" "theme"] "dark")
  (is (= "dark" (api-app/get_state_from_store #js ["ui" "theme"])))
  (is (= "dark" (api-app/get_state_from_store #js ["@ui" "@theme"]))))

(deftest current-graph-and-db-check
  (let [graph (api-test/js->clj-kw (api-app/get_current_graph))]
    (is (= "logseq_db_test-db" (:url graph)))
    (is (true? (api/check_current_is_db_graph))))
  (with-redefs [state/get-current-repo (constantly config/demo-repo)]
    (is (nil? (api-app/get_current_graph)))))

(deftest sidebar-and-theme-controls
  (state/set-state! :ui/left-sidebar-open? false)
  (state/set-state! :ui/sidebar-open? false)
  (api-app/set_left_sidebar_visible true)
  (is (true? (:ui/left-sidebar-open? (state/get-state))))
  (api-app/set_left_sidebar_visible "toggle")
  (is (false? (:ui/left-sidebar-open? (state/get-state))))
  (api-app/set_right_sidebar_visible true)
  (is (true? (:ui/sidebar-open? (state/get-state))))
  (api-app/set_theme_mode "dark")
  (is (= "dark" (:ui/theme (state/get-state)))))

(deftest clear-right-sidebar-can-close
  (state/set-state! :ui/sidebar-open? true)
  (state/set-state! :sidebar/blocks [["repo" 1 :block]])
  (api-app/clear_right_sidebar_blocks #js {:close true})
  (is (empty? (:sidebar/blocks (state/get-state))))
  (is (false? (:ui/sidebar-open? (state/get-state)))))

(deftest current-route-and-graph-configs
  (state/set-state! :route-match {:data {:name :page}
                                  :path-params {:name "demo"}
                                  :query-params {}})
  (is (= "demo" (get-in (api-test/js->clj-kw (api-app/get_current_route))
                        [:pathParams :name])))
  (state/set-config! "logseq_db_test-db" {:preferred-format :markdown
                                          :feature {:enable-flashcards? true}})
  (is (true? (api-app/get_current_graph_configs "feature" "enable-flashcards?"))))

(deftest invoke-external-command-runs-palette-action
  (let [called (atom false)]
    (palette-handler/register
     {:id :plugin-api-test/ping
      :desc "Ping"
      :action (fn [] (reset! called true))})
    (with-redefs [plugin-handler/hook-lifecycle-fn!
                  (fn [_id action & _args]
                    (action))]
      (api-app/invoke_external_command "logseq.plugin-api-test/ping")
      (is (true? @called)))))

(deftest relaunch-quit-and-external-link
  (let [ipc-calls (atom [])
        opened (atom [])
        previous-apis (.-apis js/globalThis)]
    (set! (.-apis js/globalThis) #js {:openExternal (fn [url] (swap! opened conj url))})
    (try
      (with-redefs [ipc/ipc (fn [& args] (swap! ipc-calls conj args))]
        (api-app/relaunch)
        (api-app/quit)
        (api-app/open_external_link "https://logseq.com")
        (api-app/open_external_link "javascript:alert(1)")
        (is (= [["relaunchApp"] ["quitApp"]] @ipc-calls))
        (is (= ["https://logseq.com"] @opened)))
      (finally
        (set! (.-apis js/globalThis) previous-apis)))))

(deftest force-save-graph-and-focused-settings
  (is (true? (api/force_save_graph)))
  (api-test/install-test-plugin!)
  (let [events (atom [])]
    (with-redefs [state/pub-event! (fn [event] (swap! events conj event))]
      (api/set_focused_settings "test-plugin")
      (is (= :test-plugin (:plugin/focused-settings (state/get-state))))
      (is (= :go/plugins-settings (ffirst @events))))))

(deftest show-themes-and-navigation-state
  (let [events (atom [])
        pushed (atom [])
        replaced (atom [])]
    (with-redefs [state/pub-event! (fn [event] (swap! events conj event))
                  rfe/push-state (fn [k params query]
                                   (swap! pushed conj [k params query]))
                  rfe/replace-state (fn [k params query]
                                      (swap! replaced conj [k params query]))]
      (api-app/show_themes)
      (api-app/push_state "all-pages" #js {:foo "bar"} #js {:q "x"})
      (api-app/replace_state "all-journals" #js {:a 1} nil)
      (is (= :modal/show-themes-modal (ffirst @events)))
      (is (= :all-pages (ffirst @pushed)))
      (is (= :all-journals (ffirst @replaced))))))

(deftest favorites-and-recent-pages
  (async done
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [favorites (api-app/get_current_graph_favorites)
                    recent (p/with-redefs [recent-handler/get-recent-pages
                                           (fn [] (p/resolved [{:block/title "Recent Page"}]))]
                             (api-app/get_current_graph_recent))]
              (is (array? favorites))
              (is (= "Recent Page" (aget recent 0 "title"))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))
