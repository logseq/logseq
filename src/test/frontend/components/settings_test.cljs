(ns frontend.components.settings-test
  (:require ["fs" :as fs]
            [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [frontend.components.settings :as settings]))

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

(deftest language-select-no-drag-css-opts-out-of-app-region
  (testing "CSS selectors used by the language popup opt out of Electron app-region drag"
    (let [settings-css (.readFileSync fs "src/main/frontend/components/settings.css" "utf8")
          shui-css (.readFileSync fs "resources/css/shui.css" "utf8")]
      (is (css-declares-no-drag? settings-css "\\.ls-app-no-drag"))
      (is (css-declares-no-drag? shui-css "\\.ui__select-content"))
      (is (css-declares-no-drag? shui-css "\\.ui__select-item")))))
