(ns frontend.theme-boot-test
  "resources/index.html applies the stored theme before the app mounts."
  (:require ["fs" :as fs]
            ["vm" :as vm]
            [cljs.test :refer [deftest is testing]]))

(defn- theme-boot-script
  []
  (let [html (fs/readFileSync "resources/index.html" "utf8")]
    (second (re-find #"(?s)<script id=\"theme-boot\">(.*?)</script>" html))))

(defn- run-theme-boot
  "Runs the theme-boot script with fake browser globals and returns the
  attributes and classes it put on the root element."
  [{:keys [stored user-agent os-dark?]}]
  (let [attributes (atom {})
        classes (atom #{})
        window #js {:matchMedia (fn [_query] #js {:matches (boolean os-dark?)})}
        context #js {:window window
                     :navigator #js {:userAgent user-agent}
                     :localStorage #js {:getItem (fn [k] (get stored k))}
                     :document #js {:documentElement
                                    #js {:setAttribute (fn [k v] (swap! attributes assoc k v))
                                         :classList #js {:add (fn [c] (swap! classes conj c))}}}}]
    (.runInNewContext vm (theme-boot-script) context)
    {:attributes @attributes
     :classes @classes}))

(def ^:private linux-user-agent "Mozilla/5.0 (X11; Linux x86_64) Chrome/130 Electron/33")

(deftest stored-theme-is-applied-before-the-app-mounts-test
  (testing "the index.html has the boot script"
    (is (some? (theme-boot-script))))
  (testing "a stored dark theme is applied"
    (let [{:keys [attributes classes]} (run-theme-boot {:stored {"theme" "\"dark\""
                                                                 "system-theme?" "false"}
                                                        :user-agent linux-user-agent
                                                        :os-dark? false})]
      (is (= "dark" (get attributes "data-theme")))
      (is (contains? classes "dark"))))
  (testing "a stored light theme wins over a dark operating system when the system theme is off"
    (let [{:keys [attributes classes]} (run-theme-boot {:stored {"theme" "\"light\""
                                                                 "system-theme?" "false"}
                                                        :user-agent linux-user-agent
                                                        :os-dark? true})]
      (is (= "light" (get attributes "data-theme")))
      (is (not (contains? classes "dark")))))
  (testing "the system theme follows the operating system"
    (is (= "dark"
           (get-in (run-theme-boot {:stored {"theme" "\"light\""
                                             "system-theme?" "true"}
                                    :user-agent linux-user-agent
                                    :os-dark? true})
                   [:attributes "data-theme"])))
    (is (= "light"
           (get-in (run-theme-boot {:stored {"theme" "\"dark\""
                                             "system-theme?" "true"}
                                    :user-agent linux-user-agent
                                    :os-dark? false})
                   [:attributes "data-theme"]))))
  (testing "a first start follows the operating system on macOS and Windows, and is light on Linux"
    (is (= "dark"
           (get-in (run-theme-boot {:stored {}
                                    :user-agent "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
                                    :os-dark? true})
                   [:attributes "data-theme"])))
    (is (= "light"
           (get-in (run-theme-boot {:stored {}
                                    :user-agent linux-user-agent
                                    :os-dark? true})
                   [:attributes "data-theme"])))))
