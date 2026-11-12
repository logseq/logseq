(ns frontend.handler.db-based.import-edn-dialog-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.db-based.import :as import-handler]
            [logseq.api.test-helper :as api-test]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(def ^:private one-page-edn
  "{:pages-and-blocks [{:page {:build/tags #{:user.class/Firma}, :block/title \"Apfel\"}
                       :blocks [{:block/title \"\"} {:block/title \"\"}]}]
    :classes {:user.class/Firma {:block/title \"Firma\"}}
    :logseq.db.sqlite.export/export-type :page}")

(deftest import-edn-data-dialog-validates-only-touched-entities-test
  (async done
    (api-test/start-plugin-api-db!)
    (let [validate-calls (atom [])]
      (-> (api-test/with-plugin-api
            (fn []
              (p/with-redefs [db-validate/validate-local-db!
                              (fn [_db & {:as opts}]
                                (swap! validate-calls conj opts)
                                nil)
                              shui/dialog-close-all! (fn [])]
                (p/let [_ (#'import-handler/import-edn-data-from-form
                           (atom {:import-data one-page-edn})
                           nil)]
                  (is (seq @validate-calls)
                      "the import was validated")
                  (is (every? #(seq (:entity-ids %)) @validate-calls)
                      "a one-page import validates the entities it touched, not every entity of the graph")))))
          (p/catch (fn [error]
                     (is false (str error))))
          (p/finally (fn []
                       (api-test/destroy-plugin-api-db!)
                       (done)))))))
