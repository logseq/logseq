(ns frontend.components.settings-test
  (:require ["react" :as react]
            ["react-dom/server" :as react-dom-server]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [frontend.components.settings :as settings]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [goog.object :as gobj]
            [logseq.shui.ui :as shui]))

(deftest rtc-members-does-not-render-duplicate-members-heading-test
  (let [prev-react (gobj/get js/globalThis "React")]
    (gobj/set js/globalThis "React" react)
    (try
      (with-redefs [state/get-current-repo (constantly "repo-1")
                    user-handler/manager? (constantly false)
                    shui/button (fn [_props & children]
                                  (.createElement react "button" nil (to-array children)))
                    shui/input (fn [_props]
                                 (.createElement react "input" nil))
                    shui/skeleton (fn [_props]
                                    (.createElement react "div" nil))]
        (let [html (.renderToStaticMarkup react-dom-server (settings/settings-rtc-members))]
          (is (not (string/includes? html "<h2")))))
      (finally
        (if (some? prev-react)
          (gobj/set js/globalThis "React" prev-react)
          (js-delete js/globalThis "React"))))))
