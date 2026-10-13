(ns frontend.handler.paste-properties-test
  "Text exported by the app pastes back with its properties."
  (:require [cljs.test :refer [async deftest is testing use-fixtures]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.db.async :as db-async]
            [frontend.db.conn :as conn]
            [frontend.handler.editor :as editor-handler]
            [frontend.handler.export.text :as export-text]
            [frontend.handler.paste :as paste-handler]
            [frontend.handler.paste-properties :as paste-properties]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [frontend.worker.export :as worker-export]
            [logseq.db.sqlite.build :as sqlite-build]
            [promesa.core :as p]))

(def ^:private props-uuid #uuid "00000000-0000-4000-8000-000000000101")
(def ^:private status-uuid #uuid "00000000-0000-4000-8000-000000000102")
(def ^:private priority-uuid #uuid "00000000-0000-4000-8000-000000000103")
(def ^:private choice-joy #uuid "00000000-0000-4000-8000-0000000000c1")
(def ^:private tagged-uuid #uuid "00000000-0000-4000-8000-000000000104")
(def ^:private collapsed-uuid #uuid "00000000-0000-4000-8000-000000000105")
(def ^:private code-uuid #uuid "00000000-0000-4000-8000-000000000106")
(def ^:private math-uuid #uuid "00000000-0000-4000-8000-000000000107")

(use-fixtures :once
  {:before (fn []
             (test-helper/start-test-db!)
             (let [{:keys [init-tx block-props-tx]}
                   (sqlite-build/build-blocks-tx
                    {:pages-and-blocks
                     [{:page {:block/title "Alpha"}}
                      {:page {:block/title "Beta Gamma"}}
                      {:page {:build/journal 20251231}}
                      {:page {:block/title "page1"}
                       :blocks
                       [{:block/title "with properties"
                         :block/uuid props-uuid :build/keep-uuid? true
                         :build/properties {:p-text "some text" :p-number 42 :p-check true :p-url "https://logseq.com"
                                            :p-date [:build/page {:build/journal 20251231}]
                                            :p-node #{[:build/page {:block/title "Alpha"}]
                                                      [:build/page {:block/title "Beta Gamma"}]}
                                            :p-choice [:block/uuid choice-joy]}}
                        {:block/title "a task"
                         :block/uuid status-uuid :build/keep-uuid? true
                         :build/properties {:logseq.property/status :logseq.property/status.doing}}
                        {:block/title "important"
                         :block/uuid priority-uuid :build/keep-uuid? true
                         :build/properties {:logseq.property/priority :logseq.property/priority.high}}
                        {:block/title "tagged"
                         :block/uuid tagged-uuid :build/keep-uuid? true
                         :build/tags [:research :idea]}
                        {:block/title "folded"
                         :block/uuid collapsed-uuid :build/keep-uuid? true
                         :block/collapsed? true
                         :build/children [{:block/title "inside"}]}
                        {:block/title "(+ 1 2)"
                         :block/uuid code-uuid :build/keep-uuid? true
                         :build/tags [:logseq.class/Code-block]
                         :build/properties {:logseq.property.node/display-type :code
                                            :logseq.property.code/lang "clojure"
                                            :p-check true}}
                        {:block/title "E = mc^2"
                         :block/uuid math-uuid :build/keep-uuid? true
                         :build/tags [:logseq.class/Math-block]
                         :build/properties {:logseq.property.node/display-type :math
                                            :p-check true}}]}]
                     :classes {:research {} :idea {}}
                     :properties {:p-text {:logseq.property/type :default}
                                  :p-number {:logseq.property/type :number}
                                  :p-check {:logseq.property/type :checkbox}
                                  :p-url {:logseq.property/type :url}
                                  :p-date {:logseq.property/type :date}
                                  :p-node {:logseq.property/type :node :db/cardinality :db.cardinality/many}
                                  :p-choice {:logseq.property/type :default
                                             :build/closed-values [{:value "joy" :uuid choice-joy}]}}})]
               (d/transact! (conn/get-db test-helper/test-db false)
                            (concat (map #(select-keys % [:block/uuid]) init-tx) init-tx block-props-tx))))
   :after test-helper/destroy-test-db!})

(defn- worker-stub [api repo & args]
  (let [db (conn/get-db repo)]
    (case api
      :thread-api/export-get-blocks-data
      (let [[ids opts cc] args] (p/resolved (worker-export/get-blocks-export-data db ids opts cc)))
      :thread-api/export-blocks-as-format
      (let [[ids fmt opts cc] args] (p/resolved (worker-export/export-blocks-as-format db ids fmt opts cc)))
      :thread-api/q
      (let [[[query & inputs]] args] (p/resolved (apply d/q query db inputs)))
      :thread-api/pull
      (let [[selector [a v :as lookup]] args]
        (p/resolved (if (= :block/name a)
                      (some->> (d/q '[:find ?e . :in $ ?n :where [?e :block/name ?n] [(missing? $ ?e :block/parent)]] db v)
                               (d/pull db selector))
                      (d/pull db selector lookup))))
      (p/resolved nil))))

(defn- <paste
  "Pastes text; returns {:blocks pasted-blocks :assignments {property-ident value}} of the first block."
  [text]
  (state/set-current-repo! test-helper/test-db)
  (let [pasted (atom nil)]
    (p/with-redefs [state/<invoke-db-worker worker-stub
                    state/get-edit-block (constantly {:db/id 10})
                    db-async/<get-block-page-info (fn [& _] (p/resolved {:db/id 1 :block/name "paste target"}))
                    editor-handler/paste-blocks (fn [blocks opts] (reset! pasted [blocks opts]) (p/resolved nil))]
      (p/let [_ (#'paste-handler/paste-text-parseable :markdown text)]
        (let [[blocks {:keys [property-assignments]}] @pasted]
          {:blocks blocks
           :assignments (into {} (for [[block-uuid property-id value] property-assignments
                                       :when (= block-uuid (:block/uuid (first blocks)))]
                                   [property-id value]))})))))

(defn- <export-and-paste
  [block-uuid]
  (p/let [text (p/with-redefs [state/<invoke-db-worker worker-stub]
                 (export-text/export-blocks-as-markdown test-helper/test-db [block-uuid] {:remove-options #{}}))]
    (p/let [result (<paste text)]
      (assoc result :text text))))

(defn- db [] (conn/get-db test-helper/test-db))
(defn- page-id [title] (:db/id (first (d/q '[:find [(pull ?e [:db/id]) ...] :in $ ?n :where [?e :block/name ?n]] (db) title))))
(defn- ident-id [ident] (:db/id (d/entity (db) ident)))

(deftest split-property-lines
  (is (= [["title"] ["a:: 1" "b:: 2"]] (paste-properties/split-property-lines "title\na:: 1\nb:: 2")))
  (is (= [["key:: on the first line"] []] (paste-properties/split-property-lines "key:: on the first line")))
  (is (= [["title" "a:: 1" "middle"] []] (paste-properties/split-property-lines "title\na:: 1\nmiddle"))))

(deftest exported-user-properties-paste-back
  (async done
         (-> (p/let [{:keys [text blocks assignments]} (<export-and-paste props-uuid)]
               (testing (str "exported: " (pr-str text))
                 (is (= "with properties" (:block/title (first blocks))))
                 (is (= {:user.property/p-text "some text"
                         :user.property/p-number 42
                         :user.property/p-check true
                         :user.property/p-url "https://logseq.com"
                         :user.property/p-date (d/q '[:find ?e . :where [?e :block/journal-day 20251231]] (db))
                         :user.property/p-node (sort [(page-id "alpha") (page-id "beta gamma")])
                         :user.property/p-choice (:db/id (d/entity (db) [:block/uuid choice-joy]))}
                        (update assignments :user.property/p-node sort)))))
             (p/catch (fn [e] (is false (str e))))
             (p/finally done))))

(deftest exported-status-and-priority-paste-back
  (async done
         (-> (p/let [status (<export-and-paste status-uuid)
                     priority (<export-and-paste priority-uuid)]
               (is (= "a task" (:block/title (first (:blocks status)))) (pr-str (:text status)))
               (is (= {:logseq.property/status (ident-id :logseq.property/status.doing)} (:assignments status)))
               (is (= "important" (:block/title (first (:blocks priority)))) (pr-str (:text priority)))
               (is (= {:logseq.property/priority (ident-id :logseq.property/priority.high)} (:assignments priority))))
             (p/catch (fn [e] (is false (str e))))
             (p/finally done))))

(deftest exported-tags-paste-back
  (async done
         (-> (p/let [{:keys [text blocks assignments]} (<export-and-paste tagged-uuid)]
               (is (= "- tagged\n  tags:: idea, research" (string/trim text)))
               (is (= "tagged" (:block/title (first blocks))))
               (is (= (set [(page-id "research") (page-id "idea")]) (set (:block/tags assignments)))))
             (p/catch (fn [e] (is false (str e))))
             (p/finally done))))

(deftest exported-collapsed-pastes-back
  (async done
         (-> (p/let [{:keys [text blocks]} (<export-and-paste collapsed-uuid)]
               (is (= "- folded\n  collapsed:: true\n\t- inside"
                      (string/trim (string/replace text #" +\n" "\n"))))
               (is (= ["folded" "inside"] (mapv :block/title blocks)))
               (is (true? (:block/collapsed? (first blocks)))))
             (p/catch (fn [e] (is false (str e))))
             (p/finally done))))

(deftest exported-code-and-math-blocks-with-properties-paste-back
  (async done
         (-> (p/let [code (<export-and-paste code-uuid)
                     math (<export-and-paste math-uuid)]
               (testing (str "code exported as " (pr-str (:text code)))
                 (is (= "(+ 1 2)" (:block/title (first (:blocks code)))))
                 (is (= :code (:logseq.property.node/display-type (first (:blocks code)))))
                 (is (= {:user.property/p-check true} (:assignments code))))
               (testing (str "math exported as " (pr-str (:text math)))
                 (is (= "E = mc^2" (:block/title (first (:blocks math)))))
                 (is (= :math (:logseq.property.node/display-type (first (:blocks math)))))
                 (is (= {:user.property/p-check true} (:assignments math)))))
             (p/catch (fn [e] (is false (str e))))
             (p/finally done))))

(deftest tags-line-with-unknown-tag-stays-text
  (async done
         (-> (p/let [{:keys [blocks assignments]} (<paste "- block\n  tags:: research, no-such-tag")]
               (is (= "block\ntags:: research, no-such-tag" (:block/title (first blocks))))
               (is (nil? (:block/tags assignments))))
             (p/catch (fn [e] (is false (str e))))
             (p/finally done))))

(deftest unknown-property-lines-stay-text
  (async done
         (-> (p/let [{:keys [blocks assignments]} (<paste "- block\n  no-such-property:: x\n  p-number:: not a number\n  p-text:: kept")]
               (is (= "block\nno-such-property:: x\np-number:: not a number" (:block/title (first blocks))))
               (is (= {:user.property/p-text "kept"} assignments)))
             (p/catch (fn [e] (is false (str e))))
             (p/finally done))))
