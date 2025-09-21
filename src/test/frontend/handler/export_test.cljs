(ns frontend.handler.export-test
  (:require [cljs.test :refer [are async deftest use-fixtures]]
            [clojure.string :as string]
            [frontend.handler.export.text :as export-text]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [promesa.core :as p]))

(def test-files
  [{:file/path "pages/page1.md"
    :file/content
    (string/trim "
- 1
  id:: 61506710-484c-46d5-9983-3d1651ec02c8
	- 2
	  id:: 61506711-5638-4899-ad78-187bdc2eaffc
		- 3
		  id:: 61506712-3007-407e-b6d3-d008a8dfa88b
		- ((61506712-3007-407e-b6d3-d008a8dfa88b))
- 4
  id:: 61506712-b8a7-491d-ad84-b71651c3fdab")}
   {:file/path "pages/page2.md"
    :file/content
    (string/trim "
- 3
  id:: 97a00e55-48c3-48d8-b9ca-417b16e3a616
	- {{embed [[page1]]}}")}])

(use-fixtures :once
  {:before (fn []
             (async done
                    (test-helper/start-test-db!)
                    (p/let [_ (test-helper/load-test-files test-files)]
                      (done))))
   :after test-helper/destroy-test-db!})

(deftest export-blocks-as-markdown-without-properties
  (are [expect block-uuid-s]
       (= expect
          (string/trim (export-text/export-blocks-as-markdown (state/get-current-repo) [(uuid block-uuid-s)]
                                                              {:remove-options #{:property}})))
    (string/trim "
- 1
	- 2
		- 3
		- 3")
    "61506710-484c-46d5-9983-3d1651ec02c8"

    (string/trim "
- 3
	- 1
		- 2
			- 3
			- 3
	- 4")
    "97a00e55-48c3-48d8-b9ca-417b16e3a616"))


(deftest export-blocks-as-markdown-with-properties
  (are [expect block-uuid-s]
       (= expect (string/trim (export-text/export-blocks-as-markdown (state/get-current-repo) [(uuid block-uuid-s)] {})))
    (string/trim "
- 1
  id:: 61506710-484c-46d5-9983-3d1651ec02c8
	- 2
	  id:: 61506711-5638-4899-ad78-187bdc2eaffc
		- 3
		  id:: 61506712-3007-407e-b6d3-d008a8dfa88b
		- 3")
    "61506710-484c-46d5-9983-3d1651ec02c8"

    (string/trim "
- 3
  id:: 97a00e55-48c3-48d8-b9ca-417b16e3a616
	- 1
	  id:: 61506710-484c-46d5-9983-3d1651ec02c8
		- 2
		  id:: 61506711-5638-4899-ad78-187bdc2eaffc
			- 3
			  id:: 61506712-3007-407e-b6d3-d008a8dfa88b
			- 3
	- 4
	  id:: 61506712-b8a7-491d-ad84-b71651c3fdab")
    "97a00e55-48c3-48d8-b9ca-417b16e3a616"))

(deftest export-blocks-as-markdown-level<N
  (are [expect block-uuid-s]
       (= expect (string/trim (export-text/export-blocks-as-markdown (state/get-current-repo) [(uuid block-uuid-s)]
                                                                     {:remove-options #{:property}
                                                                      :other-options {:keep-only-level<=N 2}})))
    (string/trim "
- 1
	- 2")
    "61506710-484c-46d5-9983-3d1651ec02c8"

    (string/trim "
- 3
	- 1
	- 4")
    "97a00e55-48c3-48d8-b9ca-417b16e3a616"))

(deftest export-blocks-as-markdown-newline-after-block
  (are [expect block-uuid-s]
       (= expect (string/trim (export-text/export-blocks-as-markdown (state/get-current-repo) [(uuid block-uuid-s)]
                                                                     {:remove-options #{:property}
                                                                      :other-options {:newline-after-block true}})))
    (string/trim "
- 1

	- 2

		- 3

		- 3")
    "61506710-484c-46d5-9983-3d1651ec02c8"
    (string/trim "
- 3

	- 1

		- 2

			- 3

			- 3

	- 4")
    "97a00e55-48c3-48d8-b9ca-417b16e3a616"))


(deftest-async export-files-as-markdown
  (p/do!
   (are [expect files]
       (= expect
          (@#'export-text/export-files-as-markdown files {:remove-options #{:property}}))
       [["pages/page1.md" "- 1\n\t- 2\n\t\t- 3\n\t\t- 3\n- 4\n"]]
       [{:path "pages/page1.md" :content (:file/content (nth test-files 0)) :names ["page1"] :format :markdown}]

       [["pages/page2.md" "- 3\n\t- 1\n\t\t- 2\n\t\t\t- 3\n\t\t\t- 3\n\t- 4\n"]]
       [{:path "pages/page2.md" :content (:file/content (nth test-files 1)) :names ["page2"] :format :markdown}])))

;; Disabled because this requires db worker
#_(deftest-async export-repo-as-edn-str
    (p/let [result (@#'export/<export-repo-as-edn-str (state/get-current-repo))
                      edn-output (edn/read-string result)]
          (is (= #{:version :blocks} (set (keys edn-output)))
                      "Correct top-level keys")
          (is (= (sort (concat (map :block/title gp-db/built-in-pages)
                                                            ["page1" "page2"]))
                                (sort (map :block/page-name (:blocks edn-output))))
                          "Correct pages")))
