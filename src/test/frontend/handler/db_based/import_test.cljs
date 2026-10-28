(ns frontend.handler.db-based.import-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.handler.db-based.import :as import-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
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

(deftest import-from-sqlite-db-persists-import-marker-through-worker-test
  (async done
    (let [calls (atom [])
          graph (str config/db-version-prefix "imported")]
      (-> (p/with-redefs [persist-db/<import-db
                          (fn [repo buffer]
                            (swap! calls conj [:import-db repo buffer])
                            (p/resolved nil))
                          state/add-repo!
                          (fn [repo]
                            (swap! calls conj [:add-repo repo])
                            (p/resolved nil))
                          repo-handler/restore-and-setup-repo!
                          (fn [repo opts]
                            (swap! calls conj [:restore repo opts])
                            (p/resolved nil))
                          state/set-current-repo!
                          (fn [repo]
                            (swap! calls conj [:current-repo repo])
                            nil)
                          persist-db/<export-db
                          (fn [repo opts]
                            (swap! calls conj [:export-db repo opts])
                            (p/resolved nil))
                          state/<invoke-db-worker
                          (fn [& args]
                            (swap! calls conj (vec args))
                            (p/resolved nil))
                          db/transact!
                          (fn [& _]
                            (throw (js/Error. "renderer DB transact should not be used")))]
            (import-handler/import-from-sqlite-db! "buffer" "imported" #(swap! calls conj [:finished])))
          (p/then
           (fn []
             (let [[import-call add-repo-call restore-call current-repo-call export-call worker-call finished-call] @calls
                   [api worker-repo tx-data tx-meta context] worker-call]
               (is (= [:import-db graph "buffer"] import-call))
               (is (= [:add-repo {:url graph}] add-repo-call))
               (is (= [:restore graph {:import-type :sqlite-db}] restore-call))
               (is (= [:current-repo graph] current-repo-call))
               (is (= [:export-db graph {}] export-call))
               (is (= :thread-api/transact api))
               (is (= graph worker-repo))
               (is (= :sqlite-db (-> tx-data first :kv/value)))
               (is (= {:import-db? true} tx-meta))
               (is (nil? context))
               (is (= [:finished] finished-call)))))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally done)))))
