(ns logseq.e2e.import-basic-test
  (:require
   [clojure.test :refer [deftest is testing use-fixtures]]
   [logseq.e2e.api :refer [ls-api-call!]]
   [logseq.e2e.assert :as assert]
   [logseq.e2e.fixtures :as fixtures]
   [logseq.e2e.graph :as graph]
   [logseq.e2e.locator :as loc]
   [logseq.e2e.util :as util]
   [wally.main :as w])
  (:import
   (java.nio.file Paths)))

(use-fixtures :once fixtures/open-page)
(use-fixtures :each fixtures/new-logseq-page fixtures/validate-graph)

(defn- open-import!
  []
  (util/double-esc)
  (w/click ".toolbar-dots-btn")
  (w/click (loc/filter "[role='menuitem']" :has-text "Import"))
  (w/wait-for ".importer"))

(deftest import-options-and-invalid-edn-preserve-current-graph-test
  (testing "browser import exposes supported sources and rejects invalid EDN atomically"
    (let [current-graph (ls-api-call! :app.getCurrentGraph)
          invalid-file (Paths/get "resources/invalid-db-export.edn"
                                  (into-array String []))
          graph-name (str "invalid-import-" (random-uuid))]
      (open-import!)
      (doseq [selector ["#import-sqlite-db"
                        "#import-sqlite-zip"
                        "#import-file-graph"
                        "#import-debug-transit"
                        "#import-db-edn"]]
        (assert/assert-have-count selector 1))
      (.setInputFiles (w/-query "#import-db-edn") invalid-file)
      (w/wait-for "#modal-headline")
      (w/click (loc/filter "button" :has-text "Submit"))
      (assert/assert-is-visible ".ui__toast")
      (assert/assert-is-visible "#modal-headline")
      (w/fill ".form-input" graph-name)
      (w/click (loc/filter "button" :has-text "Submit"))
      (w/wait-for ".ui__toast")
      (assert/assert-is-hidden ".ui__loading, .loading-graph")
      (is (= current-graph (ls-api-call! :app.getCurrentGraph)))
      (graph/goto-all-graphs)
      (assert/assert-is-hidden
       (loc/filter "#main-content-container" :has-text graph-name)))))
