(ns frontend.handler.export-test
  (:require ["/frontend/utils" :as browser-utils]
            [cljs.test :refer [are async deftest is testing use-fixtures]]
            [clojure.string :as string]
            [datascript.core :as d]
            [electron.ipc :as ipc]
            [frontend.common.idb :as idb]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.fs :as fs]
            [frontend.handler.assets :as assets-handler]
            [frontend.handler.export :as export]
            [frontend.handler.export.html :as export-html]
            [frontend.handler.export.opml :as export-opml]
            [frontend.handler.export.text :as export-text]
            [frontend.handler.notification :as notification]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper :include-macros true :refer [deftest-async]]
            [frontend.util :as util]
            [frontend.worker.export :as worker-export]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db.test.helper :as db-test]
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
                            :logseq.property.code/lang "clojure"}}]}
     {:page {:block/title "page6"}
      :blocks
      [{:block/title "((00000000-0000-4000-8000-0000000009ff))"
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000601"}
       {:block/title "see ((00000000-0000-4000-8000-0000000009ff)) here"
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000602"}]}
     {:page {:block/title "page7"}
      :blocks
      [{:block/title "has text property children"
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000701"
        :build/properties
        {:user.property/notes
         {:build/property-value :block
          :block/title "note value"
          :build/children [{:block/title "note child"
                            :build/children [{:block/title "note grandchild"}]}]}}}]}]))

(def ^:private block-embed-test-page
  "Block embeds: a block whose :block/link is the embedded block (links set in
  load-export-test-files!)."
  {:page {:block/title "page7"}
      :blocks
      [{:block/title "embedded"
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000701"
        :build/children [{:block/title "embedded child"}]}
       {:block/title ""
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000702"}
       {:block/title ""
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000703"}
       {:block/title ""
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000704"}
       {:block/title ""
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000705"}
       {:block/title ""
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000706"
        :build/children [{:block/title "own child of the embed"}]}
       {:block/title "collapsed"
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000707"
        :build/children [{:block/title "hidden child"}]}
       {:block/title "parent of an embed"
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000709"
        :build/children [{:block/title ""
                          :build/keep-uuid? true
                          :block/uuid #uuid "00000000-0000-4000-8000-000000000708"}]}
       {:block/title "has a property"
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000711"
        :build/properties {:embedsecret "hidden value"}}
       {:block/title "parent of a property embed"
        :build/keep-uuid? true
        :block/uuid #uuid "00000000-0000-4000-8000-000000000710"
        :build/children [{:block/title ""
                          :build/keep-uuid? true
                          :block/uuid #uuid "00000000-0000-4000-8000-000000000712"}]}]})

(defn- load-export-test-files!
  []
  (let [{:keys [init-tx block-props-tx]}
        (sqlite-build/build-blocks-tx {:properties {:user.property/notes {:logseq.property/type :default}}
                                       :pages-and-blocks (conj test-files block-embed-test-page)
                                       :auto-create-ontology? true})
        init-index (map #(select-keys % [:block/uuid]) init-tx)]
    (d/transact! (conn/get-db test-helper/test-db false)
                 (concat init-index init-tx block-props-tx))
    ;; a block embed: a block whose :block/link is the embedded block; 703 embeds itself
    (d/transact! (conn/get-db test-helper/test-db false)
                 [[:db/add [:block/uuid #uuid "00000000-0000-4000-8000-000000000702"]
                   :block/link [:block/uuid #uuid "00000000-0000-4000-8000-000000000701"]]
                  [:db/add [:block/uuid #uuid "00000000-0000-4000-8000-000000000703"]
                   :block/link [:block/uuid #uuid "00000000-0000-4000-8000-000000000703"]]
                  ;; 704 embeds 705, which embeds 704
                  [:db/add [:block/uuid #uuid "00000000-0000-4000-8000-000000000704"]
                   :block/link [:block/uuid #uuid "00000000-0000-4000-8000-000000000705"]]
                  [:db/add [:block/uuid #uuid "00000000-0000-4000-8000-000000000705"]
                   :block/link [:block/uuid #uuid "00000000-0000-4000-8000-000000000704"]]
                  [:db/add [:block/uuid #uuid "00000000-0000-4000-8000-000000000706"]
                   :block/link [:block/uuid #uuid "00000000-0000-4000-8000-000000000701"]]
                  [:db/add [:block/uuid #uuid "00000000-0000-4000-8000-000000000708"]
                   :block/link [:block/uuid #uuid "00000000-0000-4000-8000-000000000707"]]
                  [:db/add [:block/uuid #uuid "00000000-0000-4000-8000-000000000707"] :block/collapsed? true]
                  ;; 712, a child of 710, embeds 711, which has a property
                  [:db/add [:block/uuid #uuid "00000000-0000-4000-8000-000000000712"]
                   :block/link [:block/uuid #uuid "00000000-0000-4000-8000-000000000711"]]])))

(use-fixtures :once
  {:before (fn []
             (test-helper/start-test-db!)
             (load-export-test-files!))
   :after test-helper/destroy-test-db!})

(use-fixtures :each
  {:before (fn []
             (state/set-current-repo! test-helper/test-db))})

(defn- <export-blocks-as-markdown
  [root-block-uuids-or-page-uuid options]
  (p/with-redefs [state/<invoke-db-worker
                  (fn [api repo & args]
                    (case api
                      :thread-api/export-get-blocks-data
                      (let [[root-block-uuids-or-page-uuid opts content-config] args]
                        (p/resolved
                         (worker-export/get-blocks-export-data
                          (conn/get-db repo)
                          root-block-uuids-or-page-uuid
                          opts
                          content-config)))

                      :thread-api/export-blocks-as-format
                      (let [[root-block-uuids-or-page-uuid format-type options content-config] args]
                        (p/resolved
                         (worker-export/export-blocks-as-format
                          (conn/get-db repo)
                          root-block-uuids-or-page-uuid
                          format-type
                          options
                          content-config)))

                      (throw (ex-info "Unexpected worker API" {:api api}))))]
    (export-text/export-blocks-as-markdown
     (state/get-current-repo)
     root-block-uuids-or-page-uuid
     options)))

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
          original-apis (.-apis js/window)]
      (set! (.-apis js/window)
            #js {:writeFileBytes (fn [path content]
                                   (swap! writes conj [path content])
                                   (p/resolved nil))})
      (-> (p/with-redefs [util/electron? (constantly true)
                          util/time-ms (constantly 123000)
                          config/get-repo-dir (fn [repo]
                                                (is (= "logseq_db_big_graph" repo))
                                                "/tmp/logseq/graphs/logseq_db_big_graph")
                          fs/mkdir-if-not-exists (fn [path]
                                                   (swap! mkdir-calls conj path)
                                                   (p/resolved nil))
                          persist-db/<export-db
                          (fn [& _args]
                            (p/rejected (ex-info "desktop zip export should read binary from db worker" {})))
                          state/<invoke-db-worker
                          (fn [qkw repo]
                            (is (= :thread-api/export-db-binary qkw))
                            (is (= "logseq_db_big_graph" repo))
                            (p/resolved {:type "Buffer"
                                         :data [1 2 3]}))
                          assets-handler/<get-all-assets
                          (fn []
                            (p/resolved [["assets/a.bin" {:type "Buffer"
                                                          :data [4 5 6]}]]))
                          notification/show! (fn [& args]
                                               (swap! notification-calls conj args))]
            (export/db-based-export-repo-as-zip! "logseq_db_big_graph"))
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
             (set! (.-apis js/window) original-apis)
             (done)))))))

(deftest auto-db-backup-reads-backup-folder-through-worker-test
  (async done
    (let [repo "logseq_db_backup_worker"
          worker-calls (atom [])
          intervals (atom [])
          previous-interval @export/*backup-interval
          original-web-platform? util/web-platform?
          original-capacitor? util/capacitor?
          original-invoke-db-worker state/<invoke-db-worker
          original-set-interval js/setInterval
          original-clear-interval js/clearInterval]
      (reset! export/*backup-interval nil)
      (set! util/web-platform? true)
      (set! util/capacitor? (constantly false))
      (set! state/<invoke-db-worker
            (fn [api repo' key]
              (swap! worker-calls conj [api repo' key])
              (p/resolved "Backups")))
      (set! js/setInterval
            (fn [f ms]
              (swap! intervals conj [f ms])
              :interval-id))
      (set! js/clearInterval
            (fn [_] nil))
      (letfn [(cleanup! []
                (reset! export/*backup-interval previous-interval)
                (set! util/web-platform? original-web-platform?)
                (set! util/capacitor? original-capacitor?)
                (set! state/<invoke-db-worker original-invoke-db-worker)
                (set! js/setInterval original-set-interval)
                (set! js/clearInterval original-clear-interval)
                (done))]
        (try
          (let [result (export/auto-db-backup! repo)
                result (if (p/promise? result)
                         result
                         (p/resolved result))]
          (-> result
              (p/then
               (fn [_]
                 (is (= [[:thread-api/get-key-value repo :logseq.kv/graph-backup-folder]]
                        @worker-calls))
                 (is (= 1 (count @intervals)))
                 (is (= (* 1 60 60 1000)
                        (second (first @intervals))))
                 (is (= :interval-id @export/*backup-interval))))
              (p/catch
               (fn [error]
                 (is false (str error))))
              (p/finally cleanup!)))
          (catch :default error
            (is false (str error))
            (cleanup!)))))))

(deftest choose-backup-folder-persists-folder-through-worker-test
  (async done
    (let [repo "logseq_db_backup_worker"
          handle #js {:name "Backups"}
          idb-call (atom nil)
          worker-call (atom nil)
          original-open-directory browser-utils/openDirectory
          original-idb-set-item! idb/set-item!
          original-invoke-db-worker state/<invoke-db-worker
          original-db-transact! db/transact!]
      (set! browser-utils/openDirectory
            (fn [_opts]
              (p/resolved #js [handle])))
      (set! idb/set-item!
            (fn [key value]
              (reset! idb-call [key value])
              nil))
      (set! state/<invoke-db-worker
            (fn [& args]
              (reset! worker-call args)
              (p/resolved nil)))
      (set! db/transact!
            (fn [& _]
              (throw (js/Error. "renderer DB should not persist graph backup folder"))))
      (letfn [(cleanup! []
                (set! browser-utils/openDirectory original-open-directory)
                (set! idb/set-item! original-idb-set-item!)
                (set! state/<invoke-db-worker original-invoke-db-worker)
                (set! db/transact! original-db-transact!)
                (done))]
        (-> (export/choose-backup-folder repo)
            (p/then
             (fn [result]
               (is (= ["Backups" handle] result))
               (is (= [(str "handle/" (js/btoa repo) "/Backups") handle]
                      @idb-call))
               (is (= [:thread-api/transact
                       repo
                       [{:db/ident :logseq.kv/graph-backup-folder
                         :kv/value "Backups"}]
                       nil
                       nil]
                      @worker-call))))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally cleanup!))))))

(deftest auto-db-backup-skips-interval-when-worker-has-no-backup-folder-test
  (async done
    (let [repo "logseq_db_backup_worker"
          intervals (atom [])
          previous-interval @export/*backup-interval
          original-web-platform? util/web-platform?
          original-capacitor? util/capacitor?
          original-invoke-db-worker state/<invoke-db-worker
          original-set-interval js/setInterval
          original-clear-interval js/clearInterval]
      (reset! export/*backup-interval nil)
      (set! util/web-platform? true)
      (set! util/capacitor? (constantly false))
      (set! state/<invoke-db-worker
            (fn [api repo' key]
              (is (= [:thread-api/get-key-value repo :logseq.kv/graph-backup-folder]
                     [api repo' key]))
              (p/resolved nil)))
      (set! js/setInterval
            (fn [& args]
              (swap! intervals conj args)
              :interval-id))
      (set! js/clearInterval
            (fn [_] nil))
      (letfn [(cleanup! []
                (reset! export/*backup-interval previous-interval)
                (set! util/web-platform? original-web-platform?)
                (set! util/capacitor? original-capacitor?)
                (set! state/<invoke-db-worker original-invoke-db-worker)
                (set! js/setInterval original-set-interval)
                (set! js/clearInterval original-clear-interval)
                (done))]
        (try
          (let [result (export/auto-db-backup! repo)
                result (if (p/promise? result)
                         result
                         (p/resolved result))]
          (-> result
              (p/then
               (fn [_]
                 (is (empty? @intervals))
                 (is (nil? @export/*backup-interval))))
              (p/catch
               (fn [error]
                 (is false (str error))))
              (p/finally cleanup!)))
          (catch :default error
            (is false (str error))
            (cleanup!)))))))

(deftest export-blocks-as-markdown-without-properties
  (async done
    (p/let [first-content (<export-blocks-as-markdown
                           [(uuid "61506710-484c-46d5-9983-3d1651ec02c8")]
                           {:remove-options #{:property}})
            second-content (<export-blocks-as-markdown
                            [(uuid "97a00e55-48c3-48d8-b9ca-417b16e3a616")]
                            {:remove-options #{:property}})]
      (is (= (string/trim "
- 1
	- 2
		- 3
		- [[3]]")
             (string/trim first-content)))

      (is (= (string/trim "
- 3
	- 1
		- 2
			- 3
			- [[3]]
	- 4")
             (string/trim second-content)))
      (done))))

(deftest export-blocks-as-markdown-with-properties
  (async done
    (p/let [with-properties (<export-blocks-as-markdown
                             [(uuid "f81f4f64-578a-42ff-8741-19adac45f42a")]
                             {:remove-options #{}})
            without-properties (<export-blocks-as-markdown
                                [(uuid "f81f4f64-578a-42ff-8741-19adac45f42a")]
                                {:remove-options #{:property}})]
      (is (= (string/trim "
- issue
  reproducible-steps:: Switch to a password protected graph")
             (string/trim with-properties)))
      (is (= "- issue"
             (string/trim without-properties)))
      (done))))

(deftest export-blocks-as-markdown-keeps-text-property-value-children
  (async done
    (p/let [content (<export-blocks-as-markdown
                     [#uuid "00000000-0000-4000-8000-000000000701"]
                     {:remove-options #{}})]
      (is (string/includes? content "note value"))
      (is (string/includes? content "note child")
          "children of a Text property value are exported")
      (is (string/includes? content "note grandchild")
          "descendants of a Text property value are exported")
      (done))))

(deftest export-blocks-as-markdown-keeps-ref-to-missing-block
  (async done
    (p/let [only-ref (<export-blocks-as-markdown
                      [#uuid "00000000-0000-4000-8000-000000000601"]
                      {:remove-options #{}})
            in-text (<export-blocks-as-markdown
                     [#uuid "00000000-0000-4000-8000-000000000602"]
                     {:remove-options #{}})]
      (is (= "- ((00000000-0000-4000-8000-0000000009ff))" (string/trim only-ref))
          "a block that is only a ref to a missing block keeps the ref")
      (is (= "- see ((00000000-0000-4000-8000-0000000009ff)) here" (string/trim in-text)))
      (done))))

(deftest export-blocks-as-markdown-block-embed
  (async done
    (p/let [embed (<export-blocks-as-markdown
                   [#uuid "00000000-0000-4000-8000-000000000702"]
                   {:remove-options #{}})
            self-embed (<export-blocks-as-markdown
                        [#uuid "00000000-0000-4000-8000-000000000703"]
                        {:remove-options #{}})]
      (is (= "- embedded\n\t- embedded child" (string/trim embed))
          "a block embed exports the embedded block and its children")
      (is (= "-" (string/trim self-embed)) "an embed of itself is written as the block itself")
      (done))))

(deftest export-blocks-as-markdown-block-embed-cycle-and-options
  (async done
    (p/let [embed-cycle (<export-blocks-as-markdown
                   [#uuid "00000000-0000-4000-8000-000000000704"]
                   {:remove-options #{}})
            own-child (<export-blocks-as-markdown
                       [#uuid "00000000-0000-4000-8000-000000000706"]
                       {:remove-options #{}})
            open-only (<export-blocks-as-markdown
                       [#uuid "00000000-0000-4000-8000-000000000709"]
                       {:remove-options #{:property}
                        :other-options {:open-blocks-only true}})]
      (is (= "-" (string/trim embed-cycle))
          "A embeds B embeds A: the cycle stops at B, written as itself")
      (is (= "- embedded\n\t- embedded child" (string/trim own-child))
          "the embed shows the embedded block's children, not the embedding block's own")
      (is (= "- parent of an embed\n\t- collapsed" (string/trim open-only))
          "the export's open-blocks-only option applies inside the embed")
      (done))))

(deftest export-blocks-as-markdown-without-properties-in-a-nested-embed
  (async done
    (p/let [content (<export-blocks-as-markdown
                     [#uuid "00000000-0000-4000-8000-000000000710"]
                     {:remove-options #{:property}})]
      (is (string/includes? content "has a property") content)
      (is (not (string/includes? content "hidden value"))
          (str "an export without properties leaves them out of an embed in a child block too: " content))
      (done))))

(deftest export-page-as-markdown-preserves-semantic-block-formatting
  (async done
    (p/let [content (<export-blocks-as-markdown
                     [(uuid "9dfeae55-c426-4957-8de9-40ff71c622f0")]
                     {:remove-options #{:property}})]
      (is (= (string/trim "
- ## Heading block
- > quote line 1
  > quote line 2
- ```clojure
  (println \"hi\")
  (+ 1 2)
  ```")
             (string/trim content)))
      (done))))

(defn- global-get
  [k]
  (aget js/globalThis k))

(defn- global-set!
  [k v]
  (aset js/globalThis k v))

(defn- install-node-xml-prettify-stub!
  "Node has no DOMParser. prettifyXml falls back to the original markup when
   the stub serializer reports a parser error."
  []
  (global-set! "DOMParser"
               (js* "class { parseFromString(source) { return {source: source}; } }"))
  (global-set! "XSLTProcessor"
               (js* "class { importStylesheet() {} transformToDocument(doc) { return doc; } }"))
  (global-set! "XMLSerializer"
               (js* "class { serializeToString(doc) { return '<parsererror>' + ((doc && doc.source) || ''); } }")))

(defn- with-node-xml-prettify-stub
  [f]
  (let [parser (global-get "DOMParser")
        xslt (global-get "XSLTProcessor")
        serializer (global-get "XMLSerializer")]
    (install-node-xml-prettify-stub!)
    (try
      (f)
      (finally
        (global-set! "DOMParser" parser)
        (global-set! "XSLTProcessor" xslt)
        (global-set! "XMLSerializer" serializer)))))

(deftest export-image-asset-block-keeps-asset-reference
  (testing "a nested image block keeps an asset reference in markdown, html, and opml"
    (with-node-xml-prettify-stub
      (fn []
        (let [image-uuid #uuid "14630000-0000-4000-8000-000000000146"
              parent-uuid #uuid "14630000-0000-4000-8000-000000000001"
              db @(db-test/create-conn-with-blocks
                   {:pages-and-blocks
                    [{:page {:block/title "Image export"}
                      :blocks
                      [{:block/title "Notes"
                        :block/uuid parent-uuid
                        :build/keep-uuid? true
                        :build/children
                        [{:block/title "Nested text"}
                         {:block/title "Sunset caption"
                          :block/uuid image-uuid
                          :build/keep-uuid? true
                          :build/tags #{:logseq.class/Asset}
                          :build/properties {:logseq.property.asset/type "png"
                                             :logseq.property.asset/checksum "img-checksum"
                                             :logseq.property.asset/size 128}}
                         {:block/title "More text"}]}]}]})
              content-config {:export-bullet-indentation "\t"
                              :encode-highlight-as-mark? true}
              options {:remove-options #{:property}}
              asset-ref (str "../assets/" image-uuid ".png")
              image-md (str "![Sunset caption](" asset-ref ")")
              markdown (worker-export/export-blocks-as-format
                        db parent-uuid :markdown options content-config)
              image-only (worker-export/export-blocks-as-format
                          db image-uuid :markdown options content-config)
              {:keys [content format]} (worker-export/get-blocks-export-data
                                        db parent-uuid
                                        {:include-properties? false}
                                        content-config)
              html (export-html/export-helper content format options)
              opml (export-opml/export-helper content format options)]
          (is (= (string/trim (str "\n- Notes\n"
                                   "\t- Nested text\n"
                                   "\t- " image-md "\n"
                                   "\t- More text"))
                 (string/trim markdown))
              "markdown copy/export keeps the image markup")
          (is (= (str "- " image-md)
                 (string/trim image-only))
              "exporting the image block alone keeps the asset reference")
          (is (string/includes? html "<img") html)
          (is (string/includes? html asset-ref) html)
          (is (string/includes? html "alt=\"Sunset caption\"") html)
          (is (string/includes? opml image-md) opml))))))

(deftest export-blocks-as-markdown-level<N
  (async done
    (p/let [first-content (<export-blocks-as-markdown
                           [(uuid "61506710-484c-46d5-9983-3d1651ec02c8")]
                           {:remove-options #{:property}
                            :other-options {:keep-only-level<=N 2}})
            second-content (<export-blocks-as-markdown
                            [(uuid "97a00e55-48c3-48d8-b9ca-417b16e3a616")]
                            {:remove-options #{:property}
                             :other-options {:keep-only-level<=N 2}})]
      (is (= (string/trim "
- 1
	- 2")
             (string/trim first-content)))

      (is (= (string/trim "
- 3
	- 1
	- 4")
             (string/trim second-content)))
      (done))))

(deftest export-blocks-as-markdown-newline-after-block
  (async done
    (p/let [first-content (<export-blocks-as-markdown
                           [(uuid "61506710-484c-46d5-9983-3d1651ec02c8")]
                           {:remove-options #{:property}
                            :other-options {:newline-after-block true}})
            second-content (<export-blocks-as-markdown
                            [(uuid "97a00e55-48c3-48d8-b9ca-417b16e3a616")]
                            {:remove-options #{:property}
                             :other-options {:newline-after-block true}})]
      (is (= (string/trim "
- 1

	- 2

		- 3

		- [[3]]")
             (string/trim first-content)))
      (is (= (string/trim "
- 3

	- 1

		- 2

			- 3

			- [[3]]

	- 4")
             (string/trim second-content)))
      (done))))

(deftest export-tag-followed-by-a-macro
  (testing "the parser takes a macro right after a tag into the tag: the export keeps it, and does not fail"
    (let [block-uuid #uuid "6b000000-0000-4000-8000-0000000000d1"
          db @(db-test/create-conn-with-blocks
               {:pages-and-blocks
                [{:page {:block/title "Page A"}
                  :blocks [{:block/title "a #x^^h^^{{x}}" :block/uuid block-uuid :build/keep-uuid? true}]}]})]
      (is (= "- a #x^^h^^{{x}}\n"
             (worker-export/export-blocks-as-format db block-uuid :markdown {} {}))))))

(deftest export-blocks-as-markdown-open-blocks-only
  (async done
    (testing "collapsed descendants are excluded when :open-blocks-only is enabled"
      (p/let [open-content (<export-blocks-as-markdown
                            [(uuid "708f7836-c1e2-4212-bd26-b53c7e9f1449")]
                            {:remove-options #{:property}
                             :other-options {:open-blocks-only true}})
              all-content (<export-blocks-as-markdown
                           [(uuid "708f7836-c1e2-4212-bd26-b53c7e9f1449")]
                           {:remove-options #{:property}
                            :other-options {:open-blocks-only false}})]
        (is (= (string/trim "
- collapsed-parent")
               (string/trim open-content)))
        (is (= (string/trim "
- collapsed-parent
	- hidden-child")
               (string/trim all-content)))
        (done)))))

(deftest export-block-embed-open-blocks-only
  (testing "an embedded block's collapsed descendants are excluded when :open-blocks-only is enabled"
    (let [parent-id #uuid "6b000000-0000-4000-8000-000000000001"
          holder-id #uuid "6b000000-0000-4000-8000-000000000003"
          db @(db-test/create-conn-with-blocks
               {:pages-and-blocks
                [{:page {:block/title "Page A"}
                  :blocks
                  [{:block/title "Parent block" :block/uuid parent-id :build/keep-uuid? true
                    :build/children
                    [{:block/title "Collapsed child" :block/collapsed? true
                      :build/children [{:block/title "Hidden grandchild"}]}]}
                   {:block/title (str "{{embed ((" parent-id "))}}")
                    :block/uuid holder-id :build/keep-uuid? true}]}]})
          export! (fn [open-only?]
                    (worker-export/export-blocks-as-format
                     db holder-id :markdown
                     {:remove-options [:property] :other-options {:open-blocks-only open-only?}}
                     {}))]
      (is (string/includes? (export! true) "Collapsed child"))
      (is (not (string/includes? (export! true) "Hidden grandchild")))
      (is (string/includes? (export! false) "Hidden grandchild")))))

(deftest export-page-as-markdown-open-blocks-only
  (async done
    (testing "page export also excludes collapsed descendants when :open-blocks-only is enabled"
      (p/let [open-content (<export-blocks-as-markdown
                            [(uuid "de13830f-9691-4074-a0d6-cc8ab9cf9074")]
                            {:remove-options #{:property}
                             :other-options {:open-blocks-only true}})
              all-content (<export-blocks-as-markdown
                           [(uuid "de13830f-9691-4074-a0d6-cc8ab9cf9074")]
                           {:remove-options #{:property}
                            :other-options {:open-blocks-only false}})]
        (is (= (string/trim "
- collapsed-parent")
               (string/trim open-content)))
        (is (= (string/trim "
- collapsed-parent
	- hidden-child")
               (string/trim all-content)))
        (done)))))

(deftest-async export-files-as-markdown
  (p/do!
   (are [expect files]
        (= expect
           (@#'export-text/export-files-as-markdown files {:remove-options #{:property}}))
     [["pages/page1.md" "- 1\n\t- 2\n\t\t- 3\n\t\t- 3\n- 4\n"]]
     [{:path "pages/page1.md" :content "- 1\n\t- 2\n\t\t- 3\n\t\t- 3\n- 4\n" :names ["page1"] :format :markdown}]

     [["pages/page2.md" "- 3\n\t- 1\n\t\t- 2\n\t\t\t- 3\n\t\t\t- 3\n\t- 4\n"]]
     [{:path "pages/page2.md" :content "- 3\n\t- 1\n\t\t- 2\n\t\t\t- 3\n\t\t\t- 3\n\t- 4\n" :names ["page2"] :format :markdown}])))

(deftest export-html-quote
  (testing "a quote holding a paragraph"
    (is (= [:ul [:li "a" [:blockquote [:p "q" [:br]]]]]
           (export-html/export-hiccup "- a\n  > q" :markdown {}))))
  (testing "a quote holding a list does not fail the export"
    (are [content] (= [:ul [:li "a" [:blockquote [:ul [:li [:p "x"]] [:li [:p "y"]]]]]]
                      (export-html/export-hiccup content :markdown {}))
      "- a\n  > * x\n  > * y"
      "- a\n  #+BEGIN_QUOTE\n  * x\n  * y\n  #+END_QUOTE")))
