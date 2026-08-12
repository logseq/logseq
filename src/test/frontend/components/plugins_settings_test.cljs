(ns frontend.components.plugins-settings-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is testing]]
            [frontend.components.plugins-settings :as plugins-settings]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.security :as security]
            [goog.object :as gobj]))

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

(deftest settings-container-renders-plugin-without-settings-state
  (let [schema [{:key "github-theme"
                 :type "string"
                 :title "Theme"
                 :default "dark-dimmed"
                 :description "Theme id"}]
        plugin #js {:id "logseq-github-theme"
                    :settingsSchema #js []}]
    (testing "A plugin with settingsSchema but no settings object must not crash settings"
      (with-redefs [plugin-handler/markdown-to-html identity
                    security/sanitize-html identity]
        (is (re-find #"logseq-github-theme"
                     (render-static
                      (plugins-settings/settings-container schema plugin))))))))
