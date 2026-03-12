(ns frontend.handler.export-test
  (:require [cljs.test :refer [are async deftest is testing use-fixtures]]
            [clojure.string :as string]
            [frontend.handler.export.text :as export-text]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [promesa.core :as p]))

(def test-files
  (let [uuid-1 #uuid "61506710-484c-46d5-9983-3d1651ec02c8"
        uuid-2 #uuid "61506711-5638-4899-ad78-187bdc2eaffc"
        uuid-3 #uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        uuid-4 #uuid "61506712-b8a7-491d-ad84-b71651c3fdab"
        uuid-p2 #uuid "97a00e55-48c3-48d8-b9ca-417b16e3a616"
        uuid-5 #uuid "708f7836-c1e2-4212-bd26-b53c7e9f1449"
        uuid-6 #uuid "de7724d5-b045-453d-a643-31b81d310071"
        uuid-p3 #uuid "de13830f-9691-4074-a0d6-cc8ab9cf9074"]
    [{:page {:block/title "page1"}
      :blocks
      [{:block/title "1"
        :build/keep-uuid? true
        :block/uuid uuid-1
        :build/children
        [{:block/title "2"
          :build/keep-uuid? true
          :block/uuid uuid-2
          :build/children
          [{:block/title "3"
            :build/keep-uuid? true
            :block/uuid uuid-3}
           {:block/title (str "[[" uuid-3 "]]")}]}]}

       {:block/title "4"
        :build/keep-uuid? true
        :block/uuid uuid-4}]}
     {:page {:block/title "page2"}
      :blocks
      [{:block/title "3"
        :build/keep-uuid? true
        :block/uuid uuid-p2
        :build/children
        [{:block/title "{{embed [[page1]]}}"}]}]}
     {:page {:block/title "page3"
             :block/uuid uuid-p3}
      :blocks
      [{:block/title "collapsed-parent"
        :build/keep-uuid? true
        :block/uuid uuid-5
        :block/collapsed? true
        :build/children
        [{:block/title "hidden-child"
          :build/keep-uuid? true
          :block/uuid uuid-6}]}]}]))

(use-fixtures :once
  {:before (fn []
             (async done
                    (test-helper/start-test-db!)
                    (p/let [_ (test-helper/load-test-files test-files)]
                      (done))))
   :after test-helper/destroy-test-db!})

(use-fixtures :each
  {:before (fn []
             (state/set-current-repo! test-helper/test-db))})

(deftest export-blocks-as-markdown-without-properties
  (are [expect block-uuid-s]
       (= expect
          (string/trim (export-text/export-blocks-as-markdown (state/get-current-repo) [(uuid block-uuid-s)]
                                                              {:remove-options #{:property}})))
    (string/trim "
- 1
	- 2
		- 3
		- [[3]]")
    "61506710-484c-46d5-9983-3d1651ec02c8"

    (string/trim "
- 3
	- 1
		- 2
			- 3
			- [[3]]
	- 4")
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

		- [[3]]")
    "61506710-484c-46d5-9983-3d1651ec02c8"
    (string/trim "
- 3

	- 1

		- 2

			- 3

			- [[3]]

	- 4")
    "97a00e55-48c3-48d8-b9ca-417b16e3a616"))

(deftest export-blocks-as-markdown-open-blocks-only
  (testing "collapsed descendants are excluded when :open-blocks-only is enabled"
    (is (= (string/trim "
- collapsed-parent")
           (string/trim
            (export-text/export-blocks-as-markdown
             (state/get-current-repo)
             [(uuid "708f7836-c1e2-4212-bd26-b53c7e9f1449")]
             {:remove-options #{:property}
              :other-options {:open-blocks-only true}}))))
    (is (= (string/trim "
- collapsed-parent
	- hidden-child")
           (string/trim
            (export-text/export-blocks-as-markdown
             (state/get-current-repo)
             [(uuid "708f7836-c1e2-4212-bd26-b53c7e9f1449")]
             {:remove-options #{:property}
              :other-options {:open-blocks-only false}}))))))

(deftest export-page-as-markdown-open-blocks-only
  (testing "page export also excludes collapsed descendants when :open-blocks-only is enabled"
    (is (= (string/trim "
- collapsed-parent")
           (string/trim
            (export-text/export-blocks-as-markdown
             (state/get-current-repo)
             [(uuid "de13830f-9691-4074-a0d6-cc8ab9cf9074")]
             {:remove-options #{:property}
              :other-options {:open-blocks-only true}}))))
    (is (= (string/trim "
- collapsed-parent
	- hidden-child")
           (string/trim
            (export-text/export-blocks-as-markdown
             (state/get-current-repo)
             [(uuid "de13830f-9691-4074-a0d6-cc8ab9cf9074")]
             {:remove-options #{:property}
              :other-options {:open-blocks-only false}}))))))

(deftest-async export-files-as-markdown
  (p/do!
   (are [expect files]
        (= expect
           (@#'export-text/export-files-as-markdown files {:remove-options #{:property}}))
     [["pages/page1.md" "- 1\n\t- 2\n\t\t- 3\n\t\t- 3\n- 4\n"]]
     [{:path "pages/page1.md" :content "- 1\n\t- 2\n\t\t- 3\n\t\t- 3\n- 4\n" :names ["page1"] :format :markdown}]

     [["pages/page2.md" "- 3\n\t- 1\n\t\t- 2\n\t\t\t- 3\n\t\t\t- 3\n\t- 4\n"]]
     [{:path "pages/page2.md" :content "- 3\n\t- 1\n\t\t- 2\n\t\t\t- 3\n\t\t\t- 3\n\t- 4\n" :names ["page2"] :format :markdown}])))
