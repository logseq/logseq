(ns frontend.handler.plugin-config-test
  (:require [clojure.test :refer [is use-fixtures testing deftest]]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.test.fixtures :as fixtures]
            [frontend.handler.plugin-config :as plugin-config]
            [frontend.handler.global-config :as global-config-handler]
            [frontend.schema.handler.plugin-config :as plugin-config-schema]
            ["fs" :as fs-node]
            ["path" :as path]
            [clojure.edn :as edn]
            [malli.generator :as mg]
            [promesa.core :as p]
            [clojure.string :as string]
            [frontend.handler.notification :as notification]))

(use-fixtures :once fixtures/redef-get-fs)

(deftest-async add-or-update-plugin
  (let [dir (test-helper/create-tmp-dir)
        plugins-file (path/join dir "plugins.edn")
        plugin-to-add {:id :foo :name "Foo" :repo "some-user/foo" :version "v0.9.0"}
        body (pr-str (mg/generate plugin-config-schema/Plugins-edn {:size 10}))]
    (fs-node/writeFileSync plugins-file body)
    (reset! global-config-handler/root-dir dir)

    (->
     (p/do!
      (plugin-config/add-or-update-plugin plugin-to-add)
      (is (= (dissoc plugin-to-add :id)
             (:foo (edn/read-string (str (fs-node/readFileSync plugins-file)))))))

     (.finally
      (fn []
        (reset! global-config-handler/root-dir nil)
        (fs-node/unlinkSync plugins-file)
        (fs-node/rmdirSync dir))))))

(deftest-async remove-plugin
  (let [dir (test-helper/create-tmp-dir)
        plugins-file (path/join dir "plugins.edn")
        ;; use seed to consistently generate 5 plugins
        ;; if we want more randomness we could look into gen/such-that
        plugins (mg/generate plugin-config-schema/Plugins-edn {:size 5 :seed 1})
        some-plugin-id (first (keys plugins))]
    (fs-node/writeFileSync plugins-file (pr-str plugins))
    (reset! global-config-handler/root-dir dir)

    (->
     (p/do!
      (plugin-config/remove-plugin some-plugin-id)
      (is (= nil
             (get (edn/read-string (str (fs-node/readFileSync plugins-file)))
                  some-plugin-id))))

     (.finally
      (fn []
        (reset! global-config-handler/root-dir nil)
        (fs-node/unlinkSync plugins-file)
        (fs-node/rmdirSync dir))))))

(deftest-async open-sync-modal-malformed-edn
  (let [dir (test-helper/create-tmp-dir)
        plugins-file (path/join dir "plugins.edn")
        error-message (atom nil)]
    (fs-node/writeFileSync plugins-file "{:id {}")
    (reset! global-config-handler/root-dir dir)

    (test-helper/with-reset reset
      [notification/show! (fn [msg _] (reset! error-message msg))]
      (->
       (p/do!
        (plugin-config/open-sync-modal)
        (is (string/starts-with? @error-message "Malformed plugins.edn")
            "User sees correct notification"))
       (p/finally (fn []
                    (reset)
                    (reset! global-config-handler/root-dir nil)
                    (fs-node/unlinkSync plugins-file)
                    (fs-node/rmdirSync dir)))))))

(deftest-async open-sync-modal-invalid-edn
  (let [dir (test-helper/create-tmp-dir)
        plugins-file (path/join dir "plugins.edn")
        error-message (atom nil)]
    ;; Missing a couple plugin keys
    (fs-node/writeFileSync plugins-file (pr-str {:id {:theme true :repo "user/repo"}}))
    (reset! global-config-handler/root-dir dir)

    (test-helper/with-reset reset
      [notification/show! (fn [msg _] (reset! error-message msg))]
      (->
       (p/do!
        (plugin-config/open-sync-modal)
        (is (string/starts-with? @error-message "Invalid plugins.edn")
            "User sees correct notification"))
       (p/finally (fn []
                    (reset)
                    (fs-node/unlinkSync plugins-file)
                    (fs-node/rmdirSync dir)))))))

(defn- installed-plugins->edn-plugins
  "Converts installed plugins state to edn.plugins format"
  [m]
  (update-vals m #(dissoc % :id)))

;; These tests check the full return value as most of it is important for correct
;; install and uninstall
(deftest determine-plugins-to-change
  (testing "no changes to make"
    (let [plugins {:foo {:id :foo :name "Foo" :repo "some-user/foo" :version "v0.9.0"}
                   :bar {:id :bar :name "Bar" :repo "some-user/bar" :version "v0.1.0"}}]
      (is (= {} (#'plugin-config/determine-plugins-to-change
                  plugins
                  (installed-plugins->edn-plugins plugins))))))

  (testing "differing versions are uninstalled and installed"
    (let [plugins {:bar {:id :bar :name "Bar" :repo "some-user/bar" :version "v0.1.0"}}]
      (is (= {:uninstall [(:bar plugins)]
              :install [(assoc (:bar plugins) :version "v1.0.0" :plugin-action "install")]}
             (#'plugin-config/determine-plugins-to-change
               plugins
               (installed-plugins->edn-plugins (assoc-in plugins [:bar :version] "v1.0.0")))))))

  (testing "replaced plugins are uninstalled and new plugins are installed"
    (let [plugins {:foo {:id :foo :name "Foo" :repo "some-user/foo" :version "v0.9.0"}
                   :bar {:id :bar :name "Bar" :repo "some-user/bar" :version "v0.1.0"}}
          new-plugin {:id :baz :name "Baz" :repo "some-user/baz" :version "v0.5.0"}]
      (is (= {:uninstall [(:foo plugins)]
              :install [(assoc new-plugin :plugin-action "install")]}
             (#'plugin-config/determine-plugins-to-change
               plugins
               (-> plugins (dissoc :foo) (assoc :baz new-plugin) installed-plugins->edn-plugins)))))))
