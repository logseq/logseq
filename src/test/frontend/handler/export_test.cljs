(ns frontend.handler.export-test
  (:require [cljs.test :refer [are async deftest is testing use-fixtures]]
            [clojure.string :as string]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.export :as export]
            [frontend.handler.export.text :as export-text]
            [frontend.handler.notification :as notification]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.util :as util]
            [promesa.core :as p]))

(def test-files
  (let [uuid-1 #uuid "61506710-484c-46d5-9983-3d1651ec02c8"
        uuid-2 #uuid "61506711-5638-4899-ad78-187bdc2eaffc"
        uuid-3 #uuid "61506712-3007-407e-b6d3-d008a8dfa88b"
        uuid-4 #uuid "61506712-b8a7-491d-ad84-b71651c3fdab"
        uuid-p2 #uuid "97a00e55-48c3-48d8-b9ca-417b16e3a616"
        uuid-5 #uuid "708f7836-c1e2-4212-bd26-b53c7e9f1449"
        uuid-6 #uuid "de7724d5-b045-453d-a643-31b81d310071"
        uuid-p3 #uuid "de13830f-9691-4074-a0d6-cc8ab9cf9074"
        uuid-7 #uuid "f81f4f64-578a-42ff-8741-19adac45f42a"
        uuid-p5 #uuid "9dfeae55-c426-4957-8de9-40ff71c622f0"
        uuid-8 #uuid "c370c72d-97b8-45f1-8a87-184e1a77792c"
        uuid-9 #uuid "253c84fb-bf6f-4936-8370-4662930c8e6d"
        uuid-10 #uuid "e6741341-2426-4c46-b09f-6aec73a4357b"]
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
          :block/uuid uuid-6}]}]}
     {:page {:block/title "page4"}
      :blocks
      [{:block/title "issue"
        :build/keep-uuid? true
        :block/uuid uuid-7
        :build/properties {:user.property/reproducible-steps "Switch to a password protected graph"}}]}
      {:page {:block/title "page5"
              :block/uuid uuid-p5}
       :blocks
       [{:block/title "Heading block"
         :build/keep-uuid? true
         :block/uuid uuid-8
         :build/properties {:logseq.property/heading 2}}
        {:block/title "quote line 1\nquote line 2"
         :build/keep-uuid? true
         :block/uuid uuid-9
         :build/tags [:logseq.class/Quote-block]
         :build/properties {:logseq.property.node/display-type :quote}}
        {:block/title "(println \"hi\")\n(+ 1 2)"
         :build/keep-uuid? true
         :block/uuid uuid-10
         :build/tags [:logseq.class/Code-block]
         :build/properties {:logseq.property.node/display-type :code
                            :logseq.property.code/lang "clojure"}}]}]))

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

(deftest export-sqlite-db-on-electron-uses-worker-file-export
  (async done
    (let [ipc-calls (atom [])
          notification-calls (atom [])
          persist-export-calls (atom [])
          original-electron? util/electron?
          original-ipc ipc/ipc
          original-notification-show! notification/show!
          original-export-db persist-db/<export-db]
      (set! util/electron? (constantly true))
      (set! ipc/ipc (fn [& args]
                      (swap! ipc-calls conj args)
                      (p/resolved {:path "/tmp/export.sqlite"})))
      (set! notification/show! (fn [& args]
                                 (swap! notification-calls conj args)))
      (set! persist-db/<export-db (fn [& args]
                                    (swap! persist-export-calls conj args)
                                    (p/rejected (ex-info "renderer export should not run" {}))))
      (-> (export/export-repo-as-sqlite-db! "logseq_db_big_graph")
          (p/then (fn [_]
                    (is (empty? @persist-export-calls))
                    (is (= 1 (count @ipc-calls)))
                    (let [[method repo filename] (first @ipc-calls)]
                      (is (= :db-export-as method))
                      (is (= "logseq_db_big_graph" repo))
                      (is (string/ends-with? filename ".sqlite")))
                    (is (= [["SQLite DB exported to /tmp/export.sqlite." :success false]]
                           @notification-calls))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! util/electron? original-electron?)
             (set! ipc/ipc original-ipc)
             (set! notification/show! original-notification-show!)
             (set! persist-db/<export-db original-export-db)
             (done)))))))

(deftest export-sqlite-db-on-web-uses-file-system-writable-when-available
  (async done
    (let [writes (atom [])
          picker-calls (atom [])
          original-electron? util/electron?
          original-export-db persist-db/<export-db
          original-picker (.-showSaveFilePicker js/window)
          payload (js/Uint8Array. #js [1 2 3])]
      (set! util/electron? (constantly false))
      (set! persist-db/<export-db (fn [repo opts]
                                    (is (= "logseq_db_big_graph" repo))
                                    (is (= {:return-data? true} opts))
                                    (p/resolved payload)))
      (set! (.-showSaveFilePicker js/window)
            (fn [opts]
              (swap! picker-calls conj opts)
              (p/resolved #js {:createWritable
                               (fn []
                                 (p/resolved #js {:write (fn [data]
                                                           (swap! writes conj [:write data])
                                                           (p/resolved nil))
                                                  :close (fn []
                                                           (swap! writes conj [:close])
                                                           (p/resolved nil))}))})))
      (-> (export/export-repo-as-sqlite-db! "logseq_db_big_graph")
          (p/then (fn [_]
                    (is (= 1 (count @picker-calls)))
                    (is (= [[:write payload] [:close]] @writes))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! util/electron? original-electron?)
             (set! persist-db/<export-db original-export-db)
             (set! (.-showSaveFilePicker js/window) original-picker)
             (done)))))))

(deftest export-zip-on-electron-writes-export-file-and-notifies-path
  (async done
    (let [mkdir-calls (atom [])
          writes (atom [])
          notification-calls (atom [])
          original-electron? util/electron?
          original-time-ms util/time-ms
          original-get-repo-dir config/get-repo-dir
          original-mkdir-if-not-exists fs/mkdir-if-not-exists
          original-apis (.-apis js/window)
          original-export-db persist-db/<export-db
          original-invoke-db-worker state/<invoke-db-worker
          original-get-all-assets assets-handler/<get-all-assets
          original-notification-show! notification/show!]
      (set! util/electron? (constantly true))
      (set! util/time-ms (constantly 123000))
      (set! config/get-repo-dir (fn [repo]
                                  (is (= "logseq_db_big_graph" repo))
                                  "/tmp/logseq/graphs/logseq_db_big_graph"))
      (set! fs/mkdir-if-not-exists (fn [path]
                                     (swap! mkdir-calls conj path)
                                     (p/resolved nil)))
      (set! (.-apis js/window)
            #js {:writeFileBytes (fn [path content]
                                   (swap! writes conj [path content])
                                   (p/resolved nil))})
      (set! persist-db/<export-db
            (fn [& _args]
              (p/rejected (ex-info "desktop zip export should read binary from db worker" {}))))
      (set! state/<invoke-db-worker
            (fn [qkw repo]
              (is (= :thread-api/export-db-binary qkw))
              (is (= "logseq_db_big_graph" repo))
              (p/resolved {:type "Buffer"
                           :data [1 2 3]})))
      (set! assets-handler/<get-all-assets
            (fn []
              (p/resolved [["assets/a.bin" {:type "Buffer"
                                            :data [4 5 6]}]])))
      (set! notification/show! (fn [& args]
                                 (swap! notification-calls conj args)))
      (-> (export/db-based-export-repo-as-zip! "logseq_db_big_graph")
          (p/then (fn [_]
                    (let [expected-path "/tmp/logseq/graphs/logseq_db_big_graph/export/big_graph_123.zip"]
                      (is (= ["/tmp/logseq/graphs/logseq_db_big_graph/export"]
                             @mkdir-calls))
                      (is (= expected-path (ffirst @writes)))
                      (is (instance? js/ArrayBuffer (second (first @writes))))
                      (is (= [[(str "ZIP exported to " expected-path ".") :success false]]
                             @notification-calls)))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally
           (fn []
             (set! util/electron? original-electron?)
             (set! util/time-ms original-time-ms)
             (set! config/get-repo-dir original-get-repo-dir)
             (set! fs/mkdir-if-not-exists original-mkdir-if-not-exists)
             (set! (.-apis js/window) original-apis)
             (set! persist-db/<export-db original-export-db)
             (set! state/<invoke-db-worker original-invoke-db-worker)
             (set! assets-handler/<get-all-assets original-get-all-assets)
             (set! notification/show! original-notification-show!)
             (done)))))))

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

(deftest export-blocks-as-markdown-with-properties
  (is (= (string/trim "
- issue
  reproducible-steps:: Switch to a password protected graph")
         (string/trim
          (export-text/export-blocks-as-markdown
           (state/get-current-repo)
           [(uuid "f81f4f64-578a-42ff-8741-19adac45f42a")]
           {:remove-options #{}}))))
  (is (= "- issue"
         (string/trim
          (export-text/export-blocks-as-markdown
           (state/get-current-repo)
           [(uuid "f81f4f64-578a-42ff-8741-19adac45f42a")]
           {:remove-options #{:property}})))))

(deftest export-page-as-markdown-preserves-semantic-block-formatting
  (is (= (string/trim "
- ## Heading block
- > quote line 1
  > quote line 2
- ```clojure
  (println \"hi\")
  (+ 1 2)
  ```")
         (string/trim
          (export-text/export-blocks-as-markdown
           (state/get-current-repo)
           [(uuid "9dfeae55-c426-4957-8de9-40ff71c622f0")]
           {:remove-options #{:property}})))))

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
