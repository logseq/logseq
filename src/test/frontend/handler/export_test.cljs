(ns frontend.handler.export-test
  (:require [cljs.test :refer [async deftest is testing use-fixtures are]]
            [frontend.handler.export :as export]
            [frontend.db.config :refer [test-db] :as config]
            [frontend.handler.repo :as repo-handler]
            [frontend.fixtures :as fixtures]
            [frontend.state :as state]
            [clojure.string :as string]
            [promesa.core :as p]))

(def test-files
  [{:file/path "pages/page1.md"
    :file/content
    "- 1
  id:: 61506710-484c-46d5-9983-3d1651ec02c8
	- 2
	  id:: 61506711-5638-4899-ad78-187bdc2eaffc
		- 3
		  id:: 61506712-3007-407e-b6d3-d008a8dfa88b
		- ((61506712-3007-407e-b6d3-d008a8dfa88b))
- 4
  id:: 61506712-b8a7-491d-ad84-b71651c3fdab"
    }
   {:file/path "pages/page2.md"
    :file/content
    "- 3
  id:: 97a00e55-48c3-48d8-b9ca-417b16e3a616
	- {{embed [[page1]]}}"}])

(defn- import-test-data!
  []
  (repo-handler/parse-files-and-load-to-db! (state/get-current-repo) test-files {:re-render? false}))

(use-fixtures :once
  {:before (fn []
             (async done
                    (config/clear-current-repo)
                    (p/let [_ (import-test-data!)]
                      (done))))
   :after config/destroy-db!})

(deftest export-blocks-as-markdown
  (are [expect block-uuid-s]
      (= expect
         (export/export-blocks-as-markdown (state/get-current-repo) [(uuid block-uuid-s)] "dashes" []))
    "- 1\n\t- 2\n\t\t- 3\n\t\t- 3"
    "61506710-484c-46d5-9983-3d1651ec02c8"

    "- 3\n\t- 1\n\t\t- 2\n\t\t\t- 3\n\t\t\t- 3\n\t- 4"
    "97a00e55-48c3-48d8-b9ca-417b16e3a616"))

(deftest export-files-as-markdown
  (are [expect files]
      (= expect
         (export/export-files-as-markdown (state/get-current-repo) files true))
    [["pages/page1.md" "- 1\n\t- 2\n\t\t- 3\n\t\t- 3\n- 4"]]
    [{:path "pages/page1.md" :content (:file/content (nth test-files 0)) :names ["page1"] :format :markdown}]

    [["pages/page2.md" "- 3\n\t- 1\n\t\t- 2\n\t\t\t- 3\n\t\t\t- 3\n\t- 4"]]
    [{:path "pages/page2.md" :content (:file/content (nth test-files 1)) :names ["page2"] :format :markdown}]))
