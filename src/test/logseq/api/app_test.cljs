(ns logseq.api.app-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.handler.command-palette :as palette-handler]
            [frontend.handler.config :as config-handler]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.handler.recent :as recent-handler]
            [frontend.handler.route :as route-handler]
            [frontend.state :as state]
            [frontend.version :as fv]
            [logseq.api :as api]
            [logseq.api.app :as api-app]
            [logseq.api.test-helper :as api-test]
            [logseq.graph-parser.mldoc :as gp-mldoc]
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
  (is (nil? (api-app/get_state_from_store #js ["@ui" "@theme"]))))

(deftest content-capabilities-safe-db-snapshot
  (let [snapshot {:plugin/enabled true
                  :plugin/installed-plugins
                  {:drawing {:name "Drawing plugin" :version "1.2.3" :description "Draw diagrams"
                             :repository {:url "git+https://github.com/example/plugin?token=private-query#private-fragment"}
                             :settings {:disabled false :api-token "private-token"}
                             :url "private-path" :capabilities {:pretend "supported"}}
                   :disabled {:name "Disabled plugin" :settings {:disabled true}}
                   :broken {:name "Broken plugin" :err "private-error-path"}}
                  :plugin/installed-slash-commands {:drawing {"Draw" [[:private-callback]]}}
                  :plugin/simple-commands {:drawing [[:command {:key "open" :label "Open drawing"} :private-action :drawing]]}}
        writes (atom [])]
    (with-redefs [state/get-state (constantly snapshot)
                  state/pub-event! (fn [event] (swap! writes conj event))
                  config/lsp-enabled? true]
      (let [result (api-test/js->clj-kw (api/get_content_capabilities))
            plugins (get-in result [:plugins :entries])
            drawing (first (filter #(= "drawing" (:id %)) plugins))
            serialized (js/JSON.stringify (api/get_content_capabilities))]
        (is (= fv/version (get-in result [:app :version])))
        (is (= 3 (get-in result [:plugins :count])))
        (is (true? (:enabled drawing)))
        (is (= "unknown" (:canRender drawing)))
        (is (nil? (:syntax drawing)))
        (is (= "https://github.com/example/plugin" (:repositoryUrl drawing)))
        (is (= "enabled-unverified" (:status drawing)))
        (is (= ["Draw" "Open drawing"] (mapv :label (:commands drawing))))
        (is (false? (:enabled (first (filter #(= "disabled" (:id %)) plugins)))))
        (is (true? (:loadError (first (filter #(= "broken" (:id %)) plugins)))))
        (doseq [private-value ["private-token" "private-path" "private-error-path" "private-callback" "private-action" "pretend" "private-query" "private-fragment"]]
          (is (not (.includes serialized private-value))))
        (is (every? #(= "supported" (:canRender %)) (:formats result)))
        (is (every? #(false? (:renderVerified %)) (:formats result)))
        (is (empty? @writes)))))
  (with-redefs [config/db-based-graph? (constantly false)]
    (is (thrown-with-msg? js/Error #"requires an open Logseq DB graph" (api-app/get_content_capabilities)))))

(deftest content-capabilities-registered-renderers-are-not-invoked
  (let [invocations (atom 0)
        snapshot {:plugin/enabled true :plugin/installed-plugins {:diagram {:name "Diagram"}}
                  :plugin/installed-resources
                  {:diagram {:fenced-code-renderers {:mermaid {:title "Mermaid" :render (fn [& _] (swap! invocations inc))
                                                              :subs {:api-token "private-renderer-settings"}}}
                             :block-renderers (into {} (map (fn [index] [(keyword (str "block-" index)) {:render (fn [& _] (swap! invocations inc))}]) (range 21)))}}}]
    (with-redefs [state/get-state (constantly snapshot) config/lsp-enabled? true]
      (let [response (api-app/get_content_capabilities)
            result (api-test/js->clj-kw response)
            plugin (first (get-in result [:plugins :entries]))
            renderer (first (:renderers plugin))]
        (is (= 20 (count (:renderers plugin))))
        (is (true? (:renderersTruncated plugin)))
        (is (= "fenced-code" (:kind renderer)))
        (is (= "mermaid" (:key renderer)))
        (is (true? (:registered renderer)))
        (is (true? (:hasRenderer renderer)))
        (is (= "unknown" (:canRender renderer)))
        (is (nil? (:syntax renderer)))
        (is (zero? @invocations))
        (is (not (.includes (js/JSON.stringify response) "private-renderer-settings")))))))

(deftest content-capabilities-bounds-and-disabled-plugins
  (let [commands (mapv (fn [index] [:command {:key (str index) :label "Action" :desc (.repeat "x" 1100)} nil :large]) (range 21))
        plugins (into {} (map (fn [index] [(keyword (str "plugin-" index)) {:name (.repeat "x" 1100)}]) (range 51)))
        snapshot {:plugin/enabled true :plugin/installed-plugins plugins}]
    (with-redefs [state/get-state (constantly snapshot) config/lsp-enabled? false]
      (let [result (api-test/js->clj-kw (api-app/get_content_capabilities))]
        (is (= 51 (get-in result [:plugins :count])))
        (is (true? (get-in result [:plugins :truncated])))
        (is (<= (get-in result [:plugins :returned]) 50))
        (is (every? #(and (= 1000 (count (:name %))) (:textTruncated %) (not (:enabled %)))
                    (get-in result [:plugins :entries])))
        (is (<= (alength (.encode (js/TextEncoder.) (js/JSON.stringify (clj->js (get-in result [:plugins :entries]))))) 32768))))
    (with-redefs [state/get-state (constantly {:plugin/enabled true
                                              :plugin/installed-plugins {:large {:name "Large" :repository "https://private-user:secret@example.com/repo"}}
                                              :plugin/simple-commands {:large commands}})
                  config/lsp-enabled? true]
      (let [result (api-test/js->clj-kw (api-app/get_content_capabilities))
            plugin (first (get-in result [:plugins :entries]))]
        (is (= 20 (count (:commands plugin))))
        (is (true? (:commandsTruncated plugin)))
        (is (true? (:textTruncated plugin)))
        (is (nil? (:repositoryUrl plugin)))))
    (with-redefs [state/get-state (constantly {:plugin/installed-plugins {}})]
      (let [result (api-test/js->clj-kw (api-app/get_content_capabilities))
            formula (first (filter #(= "inline-latex" (:id %)) (:formats result)))
            parsed (js/JSON.parse (gp-mldoc/inline-parse-json (:example formula) (gp-mldoc/default-config :markdown)))]
        (is (= 0 (get-in result [:plugins :count])))
        (is (empty? (get-in result [:plugins :entries])))
        (is (= "Latex_Fragment" (aget parsed 0 0)))))))

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
  (state/swap-state! assoc :route-match {:data {:name :page}
                                         :path-params {:name "demo"}
                                         :query-params {}})
  (is (= "demo" (get-in (state/get-route-match) [:path-params :name])))
  (is (some? (api-app/get_current_route)))
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
      (is (= "test-plugin" (:plugin/focused-settings (state/get-state))))
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

(deftest set-current-graph-configs-writes-keys
  (async done
    (let [written (atom [])]
      (-> (p/with-redefs [config-handler/set-config!
                          (fn [k v]
                            (swap! written conj [k v])
                            (p/resolved true))]
            (p/do!
             (api-app/set_current_graph_configs #js {:preferred-workflow "now"})
             (is (= [[:preferred-workflow "now"]] @written))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally done)))))

(deftest push-and-replace-page-state-redirect
  (let [redirects (atom [])]
    (with-redefs [route-handler/redirect-to-page!
                  (fn [name opts]
                    (swap! redirects conj [name opts]))]
      (api-app/push_state "page" #js {:name "Demo"} #js {:anchor "a"})
      (api-app/replace_state "page" #js {:name "Other"} #js {:anchor "b"})
      (is (= [["Demo" {:anchor "a" :push true}]
              ["Other" {:anchor "b" :push false}]]
             @redirects)))))
