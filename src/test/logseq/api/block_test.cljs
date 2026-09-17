(ns logseq.api.block-test
  (:require [cljs.test :refer [async deftest is use-fixtures]]
            [frontend.test.helper :as test-helper]
            [logseq.api.block :as api-block]
            [logseq.api.test-helper :as api-test]
            [promesa.core :as p]))

(use-fixtures :each {:before api-test/start-plugin-api-db!
                     :after api-test/destroy-plugin-api-db!})

(deftest sanitize-user-property-name-test
  (is (= "Status" (api-block/sanitize-user-property-name " Status ")))
  (is (= "Status" (api-block/sanitize-user-property-name ":Status")))
  (is (= "fooBar" (api-block/sanitize-user-property-name "foo Bar")))
  (is (= "42" (api-block/sanitize-user-property-name 42))))

(deftest plugin-id-and-ident-helpers-test
  (is (= "_test_plugin" (api-block/get-sanitized-plugin-id nil)))
  (is (= "plugin.property._test_plugin"
         (api-block/resolve-property-prefix-for-db nil)))
  (is (= "plugin.class._test_plugin"
         (api-block/resolve-class-prefix-for-db nil)))
  (is (= :logseq.property/status
         (api-block/get-db-ident-from-property-name "logseq.property/status" nil)))
  (is (= :plugin.property._test_plugin/due-date
         (api-block/get-db-ident-from-property-name "due-date" nil)))
  (is (= :plugin.property._test_plugin/due-date
         (api-block/get-db-ident-from-property-name ":due-date" nil)))
  (is (true? (api-block/plugin-property-key? :plugin.property.demo/title)))
  (is (false? (api-block/plugin-property-key? :logseq.property/status)))
  (is (false? (api-block/plugin-property-key? :status))))

(deftest ensure-property-upsert-control-test
  (api-block/ensure-property-upsert-control
   nil :plugin.property._test_plugin/title "title")
  (is (thrown-with-msg?
       js/Error
       #"Plugins can only upsert its own properties"
       (api-block/ensure-property-upsert-control
        nil :plugin.property.other/title "title"))))

(deftest infer-property-type-test
  (is (= :checkbox (#'api-block/infer-property-type true)))
  (is (= :number (#'api-block/infer-property-type 3)))
  (is (= :number (#'api-block/infer-property-type [1 2])))
  (is (= :url (#'api-block/infer-property-type "https://logseq.com")))
  (is (= :json (#'api-block/infer-property-type {:a 1})))
  (is (= :default (#'api-block/infer-property-type "plain text"))))

(deftest convert-json-and-string-test
  (is (= "{\"a\":1}" (#'api-block/convert-json-and-string :json {:a 1})))
  (is (= "12" (#'api-block/convert-json-and-string :string 12)))
  (is (= "keep" (#'api-block/convert-json-and-string :default "keep"))))

(deftest get-block-returns-title-and-children
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "API Block Page"}
       :blocks [{:block/title "root"
                 :build/children [{:block/title "child"
                                   :build/children [{:block/title "grandchild"}]}]}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [root (test-helper/find-block-by-content "root")
                    without-children (api-block/get_block (:db/id root) #js {:includeChildren false})
                    with-children (api-block/get_block (str (:block/uuid root)) #js {:includeChildren true})
                    without-map (api-test/js->clj-kw without-children)
                    with-map (api-test/js->clj-kw with-children)]
              (is (= "root" (:title without-map)))
              (is (= "root" (:content without-map)))
              (is (= 1 (count (:children without-map))))
              (is (= "child" (get-in with-map [:children 0 :title])))
              (is (= "grandchild" (get-in with-map [:children 0 :children 0 :title]))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))

(deftest get-block-skips-pages-unless-include-page
  (async done
    (test-helper/load-test-files
     [{:page {:block/title "Hidden Page"}
       :blocks [{:block/title "page child"}]}])
    (-> (api-test/with-plugin-api
          (fn []
            (p/let [page (test-helper/find-block-by-content "Hidden Page")
                    without-page (api-block/get_block (:db/id page) #js {})
                    with-page (api-block/get_block (:db/id page) #js {:includePage true})]
              (is (nil? without-page))
              (is (= "Hidden Page" (:title (api-test/js->clj-kw with-page)))))))
        (p/catch (fn [error]
                   (is false (str error))))
        (p/finally done))))
