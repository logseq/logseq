(ns frontend.handler.plugin-config-test
  (:require [clojure.test :refer [is use-fixtures testing deftest]]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.test.node-helper :as test-node-helper]
            [frontend.test.fixtures :as fixtures]
            [frontend.handler.plugin-config :as plugin-config-handler]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.schema.handler.plugin-config :as plugin-config-schema]
            ["fs" :as fs-node]
            ["path" :as node-path]
            [clojure.edn :as edn]
            [malli.generator :as mg]
            [promesa.core :as p]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]))

(use-fixtures :once fixtures/redef-get-fs)

(defn- create-global-config-dir
  []
  (let [dir (test-node-helper/create-tmp-dir "config")
        root-dir (node-path/dirname dir)]
    (reset! global-config-handler/root-dir root-dir)
    dir))

(defn- delete-global-config-dir
  [config-dir]
  (doseq [relative-file (fs-node/readdirSync config-dir)]
    (fs-node/unlinkSync (node-path/join config-dir relative-file)))
  (reset! global-config-handler/root-dir nil)
  (fs-node/rmdirSync config-dir)
  (fs-node/rmdirSync (node-path/dirname config-dir)))

(deftest-async add-or-update-plugin
  (let [dir (create-global-config-dir)
        plugin-to-add {:id :foo :repo "some-user/foo" :version "v0.9.0"}
        body (pr-str (mg/generate plugin-config-schema/Plugins-edn {:size 10}))]
    (fs-node/writeFileSync (plugin-config-handler/plugin-config-path) body)

    (->
     (p/do!
      (plugin-config-handler/add-or-update-plugin plugin-to-add)
      (is (= (dissoc plugin-to-add :id)
             (:foo (edn/read-string (str (fs-node/readFileSync (plugin-config-handler/plugin-config-path))))))))

     (p/finally #(delete-global-config-dir dir)))))

(deftest-async remove-plugin
  (let [dir (create-global-config-dir)
        ;; use seed to consistently generate 5 plugins
        ;; if we want more randomness we could look into gen/such-that
        plugins (mg/generate plugin-config-schema/Plugins-edn {:size 5 :seed 1})
        some-plugin-id (first (keys plugins))]
    (fs-node/writeFileSync (plugin-config-handler/plugin-config-path) (pr-str plugins))

    (->
     (p/do!
      (plugin-config-handler/remove-plugin some-plugin-id)
      (is (= nil
             (get (edn/read-string (str (fs-node/readFileSync (plugin-config-handler/plugin-config-path))))
                  some-plugin-id))))

     (p/finally #(delete-global-config-dir dir)))))

(deftest-async open-replace-plugins-modal-malformed-edn
  (let [dir (create-global-config-dir)
        error-message (atom nil)]
    (fs-node/writeFileSync (plugin-config-handler/plugin-config-path) "{:id {}")

    (test-helper/with-reset reset
      [notification/show! (fn [msg _] (reset! error-message msg))]
      (->
       (p/do!
        (plugin-config-handler/open-replace-plugins-modal)
        (is (string/starts-with? @error-message "Malformed plugins.edn")
            "User sees correct notification"))
       (p/finally #(do
                     (reset)
                     (delete-global-config-dir dir)))))))

(deftest-async open-replace-plugins-modal-invalid-edn
  (let [dir (create-global-config-dir)
        error-message (atom nil)]
    ;; Missing a couple plugin keys
    (fs-node/writeFileSync (plugin-config-handler/plugin-config-path)
                           (pr-str {:id {:theme true :repo "user/repo"}}))

    (test-helper/with-reset reset
      [notification/show! (fn [msg _] (reset! error-message msg))]
      (->
       (p/do!
        (plugin-config-handler/open-replace-plugins-modal)
        (is (string/starts-with? @error-message "Invalid plugins.edn")
            "User sees correct notification"))
       (p/finally #(do
                     (reset)
                     (delete-global-config-dir dir)))))))

(defn- installed-plugins->edn-plugins
  "Converts installed plugins state to edn.plugins format"
  [m]
  (update-vals m #(dissoc % :id)))

;; These tests check the full return value as most of it is important for correct
;; install and uninstall
(deftest determine-plugins-to-change
  (testing "no changes to make"
    (let [plugins {:foo {:id :foo :repo "some-user/foo" :version "v0.9.0"}
                   :bar {:id :bar :repo "some-user/bar" :version "v0.1.0"}}]
      (is (= {} (#'plugin-config-handler/determine-plugins-to-change
                  plugins
                  (installed-plugins->edn-plugins plugins))))))

  (testing "differing versions are uninstalled and installed"
    (let [plugins {:bar {:id :bar :repo "some-user/bar" :version "v0.1.0"}}]
      (is (= {:uninstall [(:bar plugins)]
              :install [(assoc (:bar plugins) :version "v1.0.0" :plugin-action "install")]}
             (#'plugin-config-handler/determine-plugins-to-change
               plugins
               (installed-plugins->edn-plugins (assoc-in plugins [:bar :version] "v1.0.0")))))))

  (testing "replaced plugins are uninstalled and new plugins are installed"
    (let [plugins {:foo {:id :foo :repo "some-user/foo" :version "v0.9.0"}
                   :bar {:id :bar :repo "some-user/bar" :version "v0.1.0"}}
          new-plugin {:id :baz :repo "some-user/baz" :version "v0.5.0"}]
      (is (= {:uninstall [(:foo plugins)]
              :install [(assoc new-plugin :plugin-action "install")]}
             (#'plugin-config-handler/determine-plugins-to-change
               plugins
               (-> plugins (dissoc :foo) (assoc :baz new-plugin) installed-plugins->edn-plugins)))))))
