(ns logseq.cli.integration-test
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.reader :as reader]
            [cljs.test :refer [deftest is async]]
            [clojure.string :as string]
            [frontend.worker-common.util :as worker-util]
            [frontend.test.node-helper :as node-helper]
            [logseq.cli.command.core :as command-core]
            [logseq.cli.main :as cli-main]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.property :as db-property]
            [promesa.core :as p]))

(defn- run-cli
  [args data-dir cfg-path]
  (let [args-with-output (if (some #{"--output"} args)
                           args
                           (concat args ["--output" "json"]))
        global-opts ["--data-dir" data-dir "--config" cfg-path]
        final-args (vec (concat global-opts args-with-output))]
    (-> (cli-main/run! final-args {:exit? false})
        (p/then (fn [result]
                  (let [res (if (map? result)
                              result
                              (js->clj result :keywordize-keys true))]
                    res))))))

(defn- parse-json-output
  [result]
  (js->clj (js/JSON.parse (:output result)) :keywordize-keys true))

(defn- parse-json-output-safe
  [result label]
  (try
    (parse-json-output result)
    (catch :default e
      (throw (ex-info (str "json parse failed: " label)
                      {:label label
                       :output (:output result)}
                      e)))))

(defn- parse-edn-output
  [result]
  (reader/read-string (:output result)))

(defn- node-title
  [node]
  (or (:block/title node) (:block/content node) (:title node) (:content node)))

(defn- node-children
  [node]
  (or (:block/children node) (:children node)))

(defn- item-id
  [item]
  (or (:db/id item) (:id item)))

(defn- item-title
  [item]
  (or (:block/title item) (:block/name item) (:title item) (:name item)))

(defn- find-block-by-title
  [node title]
  (when node
    (if (= title (node-title node))
      node
      (some #(find-block-by-title % title) (node-children node)))))

(defn- setup-tags-graph
  [data-dir]
  (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
          _ (fs/writeFileSync cfg-path "{:output-format :json}")
          _ (run-cli ["graph" "create" "--repo" "tags-graph"] data-dir cfg-path)
          _ (run-cli ["--repo" "tags-graph" "add" "page" "--page" "Home"] data-dir cfg-path)]
    {:cfg-path cfg-path :repo "tags-graph"}))

(defn- stop-repo!
  [data-dir cfg-path repo]
  (p/let [result (run-cli ["server" "stop" "--repo" repo] data-dir cfg-path)]
    (parse-json-output result)))

(defn- run-query
  [data-dir cfg-path repo query inputs]
  (p/let [result (run-cli ["--repo" repo "query" "--query" query "--inputs" inputs]
                          data-dir cfg-path)]
    (parse-json-output result)))

(defn- query-tags
  [data-dir cfg-path repo title]
  (p/let [payload (run-query data-dir cfg-path repo
                             "[:find ?tag :in $ ?title :where [?b :block/title ?title] [?b :block/tags ?t] [?t :block/title ?tag]]"
                             (pr-str [title]))]
    (->> (get-in payload [:data :result])
         (map first)
         set)))

(defn- query-property
  [data-dir cfg-path repo title property]
  (p/let [payload (run-query data-dir cfg-path repo
                             (str "[:find ?value :in $ ?title :where [?e :block/title ?title] [?e "
                                  property
                                  " ?value]]")
                             (pr-str [title]))]
    (first (first (get-in payload [:data :result])))))

(defn- query-block-id
  [data-dir cfg-path repo title]
  (p/let [payload (run-query data-dir cfg-path repo
                             "[:find ?id . :in $ ?title :where [?b :block/title ?title] [?b :db/id ?id]]"
                             (pr-str [title]))]
    (get-in payload [:data :result])))

(defn- query-block-uuid-by-id
  [data-dir cfg-path repo id]
  (p/let [payload (run-query data-dir cfg-path repo
                             "[:find ?uuid . :in $ ?id :where [?b :db/id ?id] [?b :block/uuid ?uuid]]"
                             (pr-str [id]))]
    (get-in payload [:data :result])))

(defn- list-items
  [data-dir cfg-path repo list-type]
  (p/let [result (run-cli ["--repo" repo "list" list-type] data-dir cfg-path)]
    (parse-json-output result)))

(defn- find-item-id
  [items title]
  (->> items
       (some (fn [item]
               (when (= title (item-title item)) item)))
       item-id))

(deftest test-cli-graph-list
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       result (run-cli ["graph" "list"] data-dir cfg-path)
                       payload (parse-json-output result)]
                 (is (= 0 (:exit-code result)))
                 (is (= "ok" (:status payload)))
                 (is (contains? payload :data))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-data-dir-permission-error
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-readonly")]
           (fs/chmodSync data-dir 365)
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       result (run-cli ["graph" "list"] data-dir cfg-path)
                       payload (parse-json-output result)]
                 (is (= 1 (:exit-code result)))
                 (is (= "error" (:status payload)))
                 (is (= "data-dir-permission" (get-in payload [:error :code])))
                 (is (string/includes? (get-in payload [:error :message]) data-dir))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-graph-create-readonly-graph-dir
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-graph-readonly")
               repo "readonly-graph"
               repo-id (command-core/resolve-repo repo)
               repo-dir (node-path/join data-dir (worker-util/encode-graph-dir-name repo-id))]
           (fs/mkdirSync repo-dir #js {:recursive true})
           (fs/chmodSync repo-dir 365)
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       result (run-cli ["graph" "create" "--repo" repo] data-dir cfg-path)
                       payload (parse-json-output result)]
                 (is (= 1 (:exit-code result)))
                 (is (= "error" (:status payload)))
                 (is (= "data-dir-permission" (get-in payload [:error :code])))
                 (is (string/includes? (get-in payload [:error :message]) repo-dir))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-graph-create-and-info
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       create-result (run-cli ["graph" "create" "--repo" "demo-graph"] data-dir cfg-path)
                       create-payload (parse-json-output create-result)
                       info-result (run-cli ["graph" "info"] data-dir cfg-path)
                       info-payload (parse-json-output info-result)
                       stop-result (run-cli ["server" "stop" "--repo" "demo-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code create-result)))
                 (is (= "ok" (:status create-payload)))
                 (is (= 0 (:exit-code info-result)))
                 (is (= "ok" (:status info-payload)))
                 (is (= "demo-graph" (get-in info-payload [:data :graph])))
                 (is (= 0 (:exit-code stop-result)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-list-add-show-remove
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "content-graph"] data-dir cfg-path)
                       add-page-result (run-cli ["--repo" "content-graph" "add" "page" "--page" "TestPage"] data-dir cfg-path)
                       add-page-payload (parse-json-output add-page-result)
                       list-page-result (run-cli ["--repo" "content-graph" "list" "page"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       list-tag-result (run-cli ["--repo" "content-graph" "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       list-property-result (run-cli ["--repo" "content-graph" "list" "property"] data-dir cfg-path)
                       list-property-payload (parse-json-output list-property-result)
                       add-block-result (run-cli ["--repo" "content-graph" "add" "block" "--target-page-name" "TestPage" "--content" "Test block"] data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       _ (p/delay 100)
                       show-result (run-cli ["--repo" "content-graph" "show" "--page-name" "TestPage" "--format" "json"] data-dir cfg-path)
                       show-payload (parse-json-output show-result)
                       remove-page-result (run-cli ["--repo" "content-graph" "remove" "page" "--page" "TestPage"] data-dir cfg-path)
                       remove-page-payload (parse-json-output remove-page-result)
                       stop-result (run-cli ["server" "stop" "--repo" "content-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code add-page-result)))
                 (is (= "ok" (:status add-page-payload)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (= "ok" (:status list-page-payload)))
                 (is (vector? (get-in list-page-payload [:data :items])))
                 (is (= "ok" (:status list-tag-payload)))
                 (is (vector? (get-in list-tag-payload [:data :items])))
                 (is (= "ok" (:status list-property-payload)))
                 (is (vector? (get-in list-property-payload [:data :items])))
                 (is (= "ok" (:status show-payload)))
                 (is (contains? (get-in show-payload [:data :root]) :db/id))
                 (is (not (contains? (get-in show-payload [:data :root]) :block/uuid)))
                 (is (= "ok" (:status remove-page-payload)))
                 (is (= "ok" (:status stop-payload)))
                (done))
              (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-add-block-rewrites-page-ref
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-ref-rewrite")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "ref-rewrite-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "ref-rewrite-graph" "add" "page" "--page" "Home"] data-dir cfg-path)
                       add-block-result (run-cli ["--repo" "ref-rewrite-graph"
                                                  "add" "block"
                                                  "--target-page-name" "Home"
                                                  "--content" "See [[New Page]]"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output-safe add-block-result "add-block")
                       _ (p/delay 100)
                       list-page-result (run-cli ["--repo" "ref-rewrite-graph" "list" "page"] data-dir cfg-path)
                       list-page-payload (parse-json-output-safe list-page-result "list-page")
                       page-titles (->> (get-in list-page-payload [:data :items])
                                        (map #(or (:block/title %) (:title %)))
                                        set)
                       query-payload (run-query data-dir cfg-path "ref-rewrite-graph"
                                                "[:find ?title :in $ ?page-name :where [?p :block/name ?page-name] [?b :block/page ?p] [?b :block/title ?title]]"
                                                (pr-str [(common-util/page-name-sanity-lc "Home")]))
                       titles (map first (get-in query-payload [:data :result]))
                       ref-title (some #(when (and (string? %)
                                                   (string/includes? % "See [[")
                                                   (string/includes? % "]]"))
                                         %)
                                       titles)
                       ref-value (when ref-title
                                   (second (first (re-seq #"\[\[(.*?)\]\]" ref-title))))
                       stop-result (run-cli ["server" "stop" "--repo" "ref-rewrite-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output-safe stop-result "server-stop")]
                 (is (= 0 (:exit-code add-block-result)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (contains? page-titles "New Page"))
                 (is (string? ref-value))
                 (is (common-util/uuid-string? ref-value))
                 (is (string? ref-title))
                 (is (not (string/includes? ref-title "[[New Page]]")))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-add-block-keeps-uuid-ref
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-uuid-ref")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "uuid-ref-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "uuid-ref-graph" "add" "page" "--page" "Home"] data-dir cfg-path)
                       _ (run-cli ["--repo" "uuid-ref-graph"
                                   "add" "block"
                                   "--target-page-name" "Home"
                                   "--content" "Target block"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       target-query-payload (run-query data-dir cfg-path "uuid-ref-graph"
                                                       "[:find ?uuid :in $ ?title :where [?b :block/title ?title] [?b :block/uuid ?uuid]]"
                                                       (pr-str ["Target block"]))
                       target-uuid (first (first (get-in target-query-payload [:data :result])))
                       add-block-result (run-cli ["--repo" "uuid-ref-graph"
                                                  "add" "block"
                                                  "--target-page-name" "Home"
                                                  "--content" (str "See [[" target-uuid "]]")]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       _ (p/delay 100)
                       list-page-result (run-cli ["--repo" "uuid-ref-graph" "list" "page"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       page-titles (->> (get-in list-page-payload [:data :items])
                                        (map #(or (:block/title %) (:title %)))
                                        set)
                       ref-query-payload (run-query data-dir cfg-path "uuid-ref-graph"
                                                    "[:find ?title :in $ ?page-name :where [?p :block/name ?page-name] [?b :block/page ?p] [?b :block/title ?title]]"
                                                    (pr-str [(common-util/page-name-sanity-lc "Home")]))
                       titles (map first (get-in ref-query-payload [:data :result]))
                       ref-title (some #(when (and (string? %)
                                                   (string/includes? % (str "[[" target-uuid "]]")))
                                         %)
                                       titles)
                       stop-result (run-cli ["server" "stop" "--repo" "uuid-ref-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (string? target-uuid))
                 (is (= 0 (:exit-code add-block-result)))
                 (is (= "ok" (:status add-block-payload)))
                 (is (not (contains? page-titles target-uuid)))
                 (is (string? ref-title))
                 (is (string/includes? ref-title (str "[[" target-uuid "]]")))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-add-block-missing-uuid-ref-errors
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-missing-uuid-ref")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "missing-uuid-ref-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "missing-uuid-ref-graph" "add" "page" "--page" "Home"] data-dir cfg-path)
                       missing-uuid (str (random-uuid))
                       add-block-result (run-cli ["--repo" "missing-uuid-ref-graph"
                                                  "add" "block"
                                                  "--target-page-name" "Home"
                                                  "--content" (str "See [[" missing-uuid "]]")]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       stop-result (run-cli ["server" "stop" "--repo" "missing-uuid-ref-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 1 (:exit-code add-block-result)))
                 (is (= "error" (:status add-block-payload)))
                 (is (string/includes? (get-in add-block-payload [:error :message]) missing-uuid))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-add-tags-and-properties-by-name
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-tags")]
           (-> (p/let [{:keys [cfg-path repo]} (setup-tags-graph data-dir)
                       add-page-result (run-cli ["--repo" "tags-graph"
                                                 "add" "page"
                                                 "--page" "TaggedPage"
                                                 "--tags" "[\"Quote\"]"
                                                 "--properties" "{:logseq.property/publishing-public? true}"]
                                                data-dir cfg-path)
                       add-page-payload (parse-json-output add-page-result)
                       add-block-result (run-cli ["--repo" "tags-graph"
                                                  "add" "block"
                                                  "--target-page-name" "Home"
                                                  "--content" "Tagged block"
                                                  "--tags" "[\"Quote\"]"
                                                  "--properties" "{:logseq.property/deadline \"2026-01-25T12:00:00Z\"}"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       add-block-ident-result (run-cli ["--repo" "tags-graph"
                                                        "add" "block"
                                                        "--target-page-name" "Home"
                                                        "--content" "Tagged block ident"
                                                 "--tags" "[:logseq.class/Quote-block]"]
                                                       data-dir cfg-path)
                       add-block-ident-payload (parse-json-output add-block-ident-result)
                       deadline-prop-title (get-in db-property/built-in-properties [:logseq.property/deadline :title])
                       publishing-prop-title (get-in db-property/built-in-properties [:logseq.property/publishing-public? :title])
                       add-page-title-result (run-cli ["--repo" "tags-graph"
                                                       "add" "page"
                                                       "--page" "TaggedPageTitle"
                                                       "--properties" (str "{\"" publishing-prop-title "\" true}")]
                                                      data-dir cfg-path)
                       add-page-title-payload (parse-json-output add-page-title-result)
                       add-block-title-result (run-cli ["--repo" "tags-graph"
                                                        "add" "block"
                                                        "--target-page-name" "Home"
                                                        "--content" "Tagged block title"
                                                        "--properties" (str "{\"" deadline-prop-title "\" \"2026-01-25T12:00:00Z\"}")]
                                                       data-dir cfg-path)
                       add-block-title-payload (parse-json-output add-block-title-result)
                       _ (p/delay 100)
                       block-tag-names (query-tags data-dir cfg-path repo "Tagged block")
                       block-ident-tag-names (query-tags data-dir cfg-path repo "Tagged block ident")
                       page-tag-names (query-tags data-dir cfg-path repo "TaggedPage")
                       page-value (query-property data-dir cfg-path repo "TaggedPage" ":logseq.property/publishing-public?")
                       page-title-value (query-property data-dir cfg-path repo "TaggedPageTitle" ":logseq.property/publishing-public?")
                       block-deadline (query-property data-dir cfg-path repo "Tagged block" ":logseq.property/deadline")
                       block-deadline-title (query-property data-dir cfg-path repo "Tagged block title" ":logseq.property/deadline")
                       stop-payload (stop-repo! data-dir cfg-path repo)]
                (is (= 0 (:exit-code add-page-result)))
                (is (= "ok" (:status add-page-payload)))
                (is (= 0 (:exit-code add-block-result)))
                (is (= "ok" (:status add-block-payload)))
                (is (= 0 (:exit-code add-block-ident-result)))
                (is (= "ok" (:status add-block-ident-payload)))
                (is (string? deadline-prop-title))
                (is (string? publishing-prop-title))
                (is (= 0 (:exit-code add-page-title-result)))
                (is (= "ok" (:status add-page-title-payload)))
                (is (= 0 (:exit-code add-block-title-result)))
                (is (= "ok" (:status add-block-title-payload)))
                (is (contains? block-tag-names "Quote"))
                (is (contains? block-ident-tag-names "Quote"))
                (is (contains? page-tag-names "Quote"))
                (is (true? page-value))
                (is (true? page-title-value))
                (is (number? block-deadline))
                (is (number? block-deadline-title))
                (is (= "ok" (:status stop-payload)))
                (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-add-tags-and-properties-by-id
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-tags-id")]
           (-> (p/let [{:keys [cfg-path repo]} (setup-tags-graph data-dir)
                       list-tag-payload (list-items data-dir cfg-path repo "tag")
                       quote-tag-id (find-item-id (get-in list-tag-payload [:data :items]) "Quote")
                       list-property-payload (list-items data-dir cfg-path repo "property")
                       deadline-title (get-in db-property/built-in-properties [:logseq.property/deadline :title])
                       publishing-title (get-in db-property/built-in-properties [:logseq.property/publishing-public? :title])
                       deadline-id (find-item-id (get-in list-property-payload [:data :items]) deadline-title)
                       publishing-id (find-item-id (get-in list-property-payload [:data :items]) publishing-title)
                       add-page-id-result (run-cli ["--repo" repo
                                                    "add" "page"
                                                    "--page" "TaggedPageId"
                                                    "--tags" (pr-str [quote-tag-id])
                                                    "--properties" (pr-str {publishing-id true})]
                                                   data-dir cfg-path)
                       add-page-id-payload (parse-json-output add-page-id-result)
                       add-block-id-result (run-cli ["--repo" repo
                                                     "add" "block"
                                                     "--target-page-name" "Home"
                                                     "--content" "Tagged block id"
                                                     "--tags" (pr-str [quote-tag-id])
                                                     "--properties" (pr-str {deadline-id "2026-01-25T12:00:00Z"})]
                                                    data-dir cfg-path)
                       add-block-id-payload (parse-json-output add-block-id-result)
                       _ (p/delay 100)
                       page-id-value (query-property data-dir cfg-path repo "TaggedPageId" ":logseq.property/publishing-public?")
                       block-deadline-id (query-property data-dir cfg-path repo "Tagged block id" ":logseq.property/deadline")
                       stop-payload (stop-repo! data-dir cfg-path repo)]
                 (is (= "ok" (:status list-tag-payload)))
                 (is (number? quote-tag-id))
                 (is (= "ok" (:status list-property-payload)))
                 (is (number? deadline-id))
                 (is (number? publishing-id))
                 (is (= 0 (:exit-code add-page-id-result))
                     (pr-str (:error add-page-id-payload)))
                 (is (= "ok" (:status add-page-id-payload)))
                 (is (= 0 (:exit-code add-block-id-result))
                     (pr-str (:error add-block-id-payload)))
                 (is (= "ok" (:status add-block-id-payload)))
                 (is (true? page-id-value))
                 (is (number? block-deadline-id))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-add-tags-rejects-missing-tag
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-tags-missing")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "tags-missing-graph"] data-dir cfg-path)
                       add-block-result (run-cli ["--repo" "tags-missing-graph"
                                                  "add" "block"
                                                  "--target-page-name" "Home"
                                                  "--content" "Block with missing tag"
                                                  "--tags" "[\"MissingTag\"]"]
                                                 data-dir cfg-path)
                       add-block-payload (parse-json-output add-block-result)
                       list-tag-result (run-cli ["--repo" "tags-missing-graph" "list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       tag-names (->> (get-in list-tag-payload [:data :items])
                                      (map #(or (:block/title %) (:block/name %)))
                                      set)
                       stop-result (run-cli ["server" "stop" "--repo" "tags-missing-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 1 (:exit-code add-block-result)))
                 (is (= "error" (:status add-block-payload)))
                 (is (not (contains? tag-names "MissingTag")))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-query
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-query")
               query-text "[:find ?e :in $ ?title :where [?e :block/title ?title]]"]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                  create-result (run-cli ["graph" "create" "--repo" "query-graph"] data-dir cfg-path)
                  create-payload (parse-json-output create-result)
                  _ (run-cli ["--repo" "query-graph" "add" "page" "--page" "QueryPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "query-graph" "add" "block" "--target-page-name" "QueryPage" "--content" "Query block"] data-dir cfg-path)
                       _ (run-cli ["--repo" "query-graph" "add" "block" "--target-page-name" "QueryPage" "--content" "Query block"] data-dir cfg-path)
                       _ (p/delay 100)
                       query-result (run-cli ["--repo" "query-graph"
                                              "query"
                                              "--query" query-text
                                              "--inputs" "[\"Query block\"]"]
                                             data-dir cfg-path)
                       query-payload (parse-json-output query-result)
                       result (get-in query-payload [:data :result])
                       stop-result (run-cli ["server" "stop" "--repo" "query-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status create-payload)))
                 (is (= 0 (:exit-code query-result)))
                 (is (= "ok" (:status query-payload)))
                 (is (vector? result))
                 (is (= 2 (count result)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-query-task-search
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-task-query")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       create-result (run-cli ["graph" "create" "--repo" "task-query-graph"] data-dir cfg-path)
                       create-payload (parse-json-output create-result)
                       _ (run-cli ["--repo" "task-query-graph" "add" "page" "--page" "Tasks"] data-dir cfg-path)
                       _ (run-cli ["--repo" "task-query-graph"
                                   "add" "block"
                                   "--target-page-name" "Tasks"
                                   "--content" "Task one"
                                   "--status" "doing"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "task-query-graph"
                                   "add" "block"
                                   "--target-page-name" "Tasks"
                                   "--content" "Task two"
                                   "--status" "doing"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "task-query-graph"
                                   "add" "block"
                                   "--target-page-name" "Tasks"
                                   "--content" "Task three"
                                   "--status" "todo"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       list-result (run-cli ["query" "list"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       task-entry (some (fn [entry]
                                          (when (= "task-search" (:name entry)) entry))
                                        (get-in list-payload [:data :queries]))
                       query-result (run-cli ["--repo" "task-query-graph"
                                              "query"
                                              "--name" "task-search"
                                              "--inputs" "[\"doing\"]"]
                                             data-dir cfg-path)
                       query-payload (parse-json-output query-result)
                       query-nil-result (run-cli ["--repo" "task-query-graph"
                                                  "query"
                                                  "--name" "task-search"
                                                  "--inputs" "[\"doing\" nil 1]"]
                                                 data-dir cfg-path)
                       query-nil-payload (parse-json-output query-nil-result)
                       result (get-in query-payload [:data :result])
                       nil-result (get-in query-nil-payload [:data :result])
                       stop-result (run-cli ["server" "stop" "--repo" "task-query-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status create-payload)))
                 (is (= "ok" (:status list-payload)))
                 (is (= [{:name "search-status"}
                         {:name "?search-title" :default ""}
                         {:name "?recent-days" :default 0}]
                        (:inputs task-entry)))
                 (is (= 0 (:exit-code query-result)))
                 (is (= "ok" (:status query-payload)))
                 (is (vector? result))
                 (is (= 2 (count result)))
                 (is (= 0 (:exit-code query-nil-result)))
                 (is (= "ok" (:status query-nil-payload)))
                 (is (vector? nil-result))
                 (is (= 2 (count nil-result)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-query-recent-updated
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-recent-updated")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "recent-updated-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "recent-updated-graph" "add" "page" "--page" "RecentPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "recent-updated-graph" "add" "block"
                                   "--target-page-name" "RecentPage"
                                   "--content" "Recent block"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       list-page-result (run-cli ["--repo" "recent-updated-graph" "list" "page" "--expand"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       page-item (some (fn [item]
                                         (when (= "RecentPage" (or (:block/title item) (:title item)))
                                           item))
                                       (get-in list-page-payload [:data :items]))
                       page-id (or (:db/id page-item) (:id page-item))
                       show-result (run-cli ["--repo" "recent-updated-graph"
                                             "show"
                                             "--page-name" "RecentPage"
                                             "--format" "json"]
                                            data-dir cfg-path)
                       show-payload (parse-json-output show-result)
                       show-root (get-in show-payload [:data :root])
                       block-node (find-block-by-title show-root "Recent block")
                       block-id (or (:db/id block-node) (:id block-node))
                       list-result (run-cli ["query" "list"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       recent-entry (some (fn [entry]
                                            (when (= "recent-updated" (:name entry)) entry))
                                          (get-in list-payload [:data :queries]))
                       now-ms (js/Date.now)
                       query-result (run-cli ["--repo" "recent-updated-graph"
                                              "query"
                                              "--name" "recent-updated"
                                              "--inputs" (pr-str [1 now-ms])]
                                             data-dir cfg-path)
                       query-payload (parse-json-output query-result)
                       result (get-in query-payload [:data :result])
                       future-now-ms (+ now-ms (* 10 86400000))
                       future-query-result (run-cli ["--repo" "recent-updated-graph"
                                                     "query"
                                                     "--name" "recent-updated"
                                                     "--inputs" (pr-str [1 future-now-ms])]
                                                    data-dir cfg-path)
                       future-query-payload (parse-json-output future-query-result)
                       future-result (get-in future-query-payload [:data :result])
                       zero-result (run-cli ["--repo" "recent-updated-graph"
                                             "query"
                                             "--name" "recent-updated"
                                             "--inputs" "[0]"]
                                            data-dir cfg-path)
                       zero-payload (parse-json-output zero-result)
                       nil-result (run-cli ["--repo" "recent-updated-graph"
                                            "query"
                                            "--name" "recent-updated"
                                            "--inputs" "[nil]"]
                                           data-dir cfg-path)
                       nil-payload (parse-json-output nil-result)
                       neg-result (run-cli ["--repo" "recent-updated-graph"
                                            "query"
                                            "--name" "recent-updated"
                                            "--inputs" "[-1]"]
                                           data-dir cfg-path)
                       neg-payload (parse-json-output neg-result)
                       stop-result (run-cli ["server" "stop" "--repo" "recent-updated-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status list-page-payload)))
                 (is (some? page-id))
                 (is (some? block-id))
                 (is (= "ok" (:status list-payload)))
                 (is (= [{:name "recent-days"}] (:inputs recent-entry)))
                 (is (= 0 (:exit-code query-result)))
                 (is (= "ok" (:status query-payload)))
                 (is (vector? result))
                 (is (contains? (set result) page-id))
                 (is (contains? (set result) block-id))
                 (is (= 0 (:exit-code future-query-result)))
                 (is (= "ok" (:status future-query-payload)))
                 (is (vector? future-result))
                 (is (empty? future-result))
                 (is (= 1 (:exit-code zero-result)))
                 (is (= "error" (:status zero-payload)))
                 (is (= "invalid-options" (get-in zero-payload [:error :code])))
                 (is (= 1 (:exit-code nil-result)))
                 (is (= "error" (:status nil-payload)))
                 (is (= "invalid-options" (get-in nil-payload [:error :code])))
                 (is (= 1 (:exit-code neg-result)))
                 (is (= "error" (:status neg-payload)))
                 (is (= "invalid-options" (get-in neg-payload [:error :code])))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-show-resolve-nested-uuid-refs
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-nested-refs")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "nested-refs"] data-dir cfg-path)
                       _ (run-cli ["--repo" "nested-refs" "add" "page" "--page" "NestedPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "nested-refs" "add" "block" "--target-page-name" "NestedPage" "--content" "Inner"] data-dir cfg-path)
                       inner-id (query-block-id data-dir cfg-path "nested-refs" "Inner")
                       inner-uuid (query-block-uuid-by-id data-dir cfg-path "nested-refs" inner-id)
                       middle-content (str "See [[" inner-uuid "]]")
                       _ (run-cli ["--repo" "nested-refs" "add" "block" "--target-page-name" "NestedPage"
                                   "--content" middle-content] data-dir cfg-path)
                       middle-id (query-block-id data-dir cfg-path "nested-refs" middle-content)
                       middle-uuid (query-block-uuid-by-id data-dir cfg-path "nested-refs" middle-id)
                       _ (run-cli ["--repo" "nested-refs" "add" "block" "--target-page-name" "NestedPage"
                                   "--content" (str "Outer [[" middle-uuid "]]")] data-dir cfg-path)
                       show-outer (run-cli ["--repo" "nested-refs" "show" "--page-name" "NestedPage" "--format" "json"] data-dir cfg-path)
                       show-outer-payload (parse-json-output show-outer)
                       outer-node (find-block-by-title (get-in show-outer-payload [:data :root]) "Outer [[See [[Inner]]]]")
                       stop-result (run-cli ["server" "stop" "--repo" "nested-refs"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (some? inner-uuid))
                 (is (some? middle-uuid))
                 (is (some? outer-node))
                 (is (= "Outer [[See [[Inner]]]]" (node-title outer-node)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-show-linked-references-json
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-linked-refs")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "linked-refs-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "page" "--page" "TargetPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "page" "--page" "SourcePage"] data-dir cfg-path)
                       target-id (query-block-id data-dir cfg-path "linked-refs-graph" "TargetPage")
                       target-uuid (query-block-uuid-by-id data-dir cfg-path "linked-refs-graph" target-id)
                       target-title "TargetPage"
                       ref-content (str "See [[" target-uuid "]]")
                       ref-title (str "See [[" target-title "]]")
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "block" "--target-page-name" "SourcePage" "--content" ref-content] data-dir cfg-path)
                       source-show (run-cli ["--repo" "linked-refs-graph" "show" "--page-name" "SourcePage" "--format" "json"] data-dir cfg-path)
                       source-payload (parse-json-output source-show)
                       ref-node (find-block-by-title (get-in source-payload [:data :root]) ref-title)
                       ref-id (:db/id ref-node)
                       target-show (run-cli ["--repo" "linked-refs-graph" "show" "--page-name" "TargetPage" "--format" "json"] data-dir cfg-path)
                       target-payload (parse-json-output target-show)
                       linked-refs (get-in target-payload [:data :linked-references])
                       linked-blocks (:blocks linked-refs)
                       linked-ids (set (map :db/id linked-blocks))
                       linked-page-titles (set (keep (fn [block]
                                                       (or (get-in block [:block/page :block/title])
                                                           (get-in block [:block/page :block/name])
                                                           (get-in block [:page :title])
                                                           (get-in block [:page :name])))
                                                     linked-blocks))
                       stop-result (run-cli ["server" "stop" "--repo" "linked-refs-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (some? target-uuid))
                 (is (= "ok" (:status target-payload)))
                 (is (some? ref-id))
                 (is (contains? linked-ids ref-id))
                 (is (contains? linked-page-titles "SourcePage"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-move-block
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-move")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "move-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "move-graph" "add" "page" "--page" "SourcePage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "move-graph" "add" "page" "--page" "TargetPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "move-graph" "add" "block" "--target-page-name" "SourcePage" "--content" "Parent Block"] data-dir cfg-path)
                       parent-id (query-block-id data-dir cfg-path "move-graph" "Parent Block")
                       parent-uuid (query-block-uuid-by-id data-dir cfg-path "move-graph" parent-id)
                       _ (run-cli ["--repo" "move-graph" "add" "block" "--target-uuid" (str parent-uuid) "--content" "Child Block"] data-dir cfg-path)
                       move-result (run-cli ["--repo" "move-graph" "move" "--uuid" (str parent-uuid) "--target-page-name" "TargetPage"] data-dir cfg-path)
                       move-payload (parse-json-output move-result)
                       target-show (run-cli ["--repo" "move-graph" "show" "--page-name" "TargetPage" "--format" "json"] data-dir cfg-path)
                       target-payload (parse-json-output target-show)
                       moved-node (find-block-by-title (get-in target-payload [:data :root]) "Parent Block")
                       child-node (find-block-by-title moved-node "Child Block")
                       stop-result (run-cli ["server" "stop" "--repo" "move-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status move-payload)))
                 (is (some? parent-uuid))
                 (is (some? moved-node))
                 (is (some? child-node))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-add-block-pos-ordering
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-add-pos")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "add-pos-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "add-pos-graph" "add" "page" "--page" "PosPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "add-pos-graph" "add" "block" "--target-page-name" "PosPage" "--content" "Parent"] data-dir cfg-path)
                       parent-id (query-block-id data-dir cfg-path "add-pos-graph" "Parent")
                       parent-uuid (query-block-uuid-by-id data-dir cfg-path "add-pos-graph" parent-id)
                       _ (run-cli ["--repo" "add-pos-graph" "add" "block" "--target-uuid" (str parent-uuid) "--pos" "first-child" "--content" "First"] data-dir cfg-path)
                       _ (run-cli ["--repo" "add-pos-graph" "add" "block" "--target-uuid" (str parent-uuid) "--pos" "last-child" "--content" "Last"] data-dir cfg-path)
                       final-show (run-cli ["--repo" "add-pos-graph" "show" "--page-name" "PosPage" "--format" "json"] data-dir cfg-path)
                       final-payload (parse-json-output final-show)
                       final-parent (find-block-by-title (get-in final-payload [:data :root]) "Parent")
                       child-titles (map node-title (node-children final-parent))
                       stop-result (run-cli ["server" "stop" "--repo" "add-pos-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (some? parent-uuid))
                 (is (= ["First" "Last"] (vec child-titles)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-output-formats-graph-list
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       json-result (run-cli ["graph" "list" "--output" "json"] data-dir cfg-path)
                       json-payload (parse-json-output json-result)
                       edn-result (run-cli ["graph" "list" "--output" "edn"] data-dir cfg-path)
                       edn-payload (parse-edn-output edn-result)
                       human-result (run-cli ["graph" "list" "--output" "human"] data-dir cfg-path)]
                 (is (= 0 (:exit-code json-result)))
                 (is (= "ok" (:status json-payload)))
                 (is (= 0 (:exit-code edn-result)))
                 (is (= :ok (:status edn-payload)))
                 (is (not (string/starts-with? (:output human-result) "{:status")))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-list-outputs-include-id
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "list-id-graph"] data-dir cfg-path)
                       _ (run-cli ["add" "page" "--page" "TestPage"] data-dir cfg-path)
                       list-page-result (run-cli ["list" "page"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       list-tag-result (run-cli ["list" "tag"] data-dir cfg-path)
                       list-tag-payload (parse-json-output list-tag-result)
                       list-property-result (run-cli ["list" "property"] data-dir cfg-path)
                       list-property-payload (parse-json-output list-property-result)
                       stop-result (run-cli ["server" "stop" "--repo" "list-id-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status list-page-payload)))
                 (is (every? #(contains? % :id) (get-in list-page-payload [:data :items])))
                 (is (= "ok" (:status list-tag-payload)))
                 (is (every? #(contains? % :id) (get-in list-tag-payload [:data :items])))
                 (is (= "ok" (:status list-property-payload)))
                 (is (every? #(contains? % :id) (get-in list-property-payload [:data :items])))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-list-page-human-output
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "human-list-graph"] data-dir cfg-path)
                       _ (run-cli ["add" "page" "--page" "TestPage"] data-dir cfg-path)
                       list-page-result (run-cli ["list" "page" "--output" "human"] data-dir cfg-path)
                       output (:output list-page-result)]
                 (is (= 0 (:exit-code list-page-result)))
                 (is (string/includes? output "TITLE"))
                 (is (string/includes? output "TestPage"))
                 (is (string/includes? output "Count:"))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-show-page-block-by-id-and-uuid
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "show-page-block-graph"] data-dir cfg-path)
                       _ (run-cli ["add" "page" "--page" "TestPage"] data-dir cfg-path)
                       list-page-result (run-cli ["list" "page" "--expand"] data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       page-item (some (fn [item]
                                         (when (= "TestPage" (or (:block/title item) (:title item)))
                                           item))
                                       (get-in list-page-payload [:data :items]))
                       page-id (or (:db/id page-item) (:id page-item))
                       page-uuid (or (:block/uuid page-item) (:uuid page-item))
                       show-by-id-result (run-cli ["show" "--id" (str page-id) "--format" "json"] data-dir cfg-path)
                       show-by-id-payload (parse-json-output show-by-id-result)
                       show-by-uuid-result (run-cli ["show" "--uuid" (str page-uuid) "--format" "json"] data-dir cfg-path)
                       show-by-uuid-payload (parse-json-output show-by-uuid-result)
                       stop-result (run-cli ["server" "stop" "--repo" "show-page-block-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status list-page-payload)))
                 (is (some? page-item))
                 (is (some? page-id))
                 (is (some? page-uuid))
                 (is (= "ok" (:status show-by-id-payload)))
                 (is (= page-id (get-in show-by-id-payload [:data :root :db/id])))
                 (is (not (contains? (get-in show-by-id-payload [:data :root]) :block/uuid)))
                 (is (= "ok" (:status show-by-uuid-payload)))
                 (is (= page-id (get-in show-by-uuid-payload [:data :root :db/id])))
                 (is (not (contains? (get-in show-by-uuid-payload [:data :root]) :block/uuid)))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-show-multi-id
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-multi-id")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "show-multi-id-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "show-multi-id-graph" "add" "page" "--page" "MultiPage"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "show-multi-id-graph" "add" "block"
                                   "--target-page-name" "MultiPage"
                                   "--content" "Multi show one"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "show-multi-id-graph" "add" "block"
                                   "--target-page-name" "MultiPage"
                                   "--content" "Multi show two"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       query-text "[:find ?e . :in $ ?title :where [?e :block/title ?title]]"
                       query-one-result (run-cli ["--repo" "show-multi-id-graph" "query"
                                                  "--query" query-text
                                                  "--inputs" (pr-str ["Multi show one"])]
                                                 data-dir cfg-path)
                       query-one-payload (parse-json-output query-one-result)
                       block-one-id (get-in query-one-payload [:data :result])
                       query-two-result (run-cli ["--repo" "show-multi-id-graph" "query"
                                                  "--query" query-text
                                                  "--inputs" (pr-str ["Multi show two"])]
                                                 data-dir cfg-path)
                       query-two-payload (parse-json-output query-two-result)
                       block-two-id (get-in query-two-payload [:data :result])
                       ids-edn (str "[" block-one-id " " block-two-id "]")
                       show-text-result (run-cli ["--repo" "show-multi-id-graph" "show"
                                                  "--id" ids-edn
                                                  "--format" "text"
                                                  "--output" "human"]
                                                 data-dir cfg-path)
                       output (:output show-text-result)
                       idx-one (string/index-of output "Multi show one")
                       idx-two (string/index-of output "Multi show two")
                       idx-delim (string/index-of output "================================================================")
                       show-json-result (run-cli ["--repo" "show-multi-id-graph" "show"
                                                  "--id" ids-edn
                                                  "--format" "json"]
                                                 data-dir cfg-path)
                       show-json-payload (parse-json-output show-json-result)
                       show-data (:data show-json-payload)
                       root-titles (set (map (comp node-title :root) show-data))
                       stop-result (run-cli ["server" "stop" "--repo" "show-multi-id-graph"]
                                            data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code query-one-result)))
                 (is (= "ok" (:status query-one-payload)))
                 (is (= 0 (:exit-code query-two-result)))
                 (is (= "ok" (:status query-two-payload)))
                 (is (some? block-one-id))
                 (is (some? block-two-id))
                 (is (= 0 (:exit-code show-text-result)))
                 (is (string/includes? output "Multi show one"))
                 (is (string/includes? output "Multi show two"))
                 (is (some? idx-delim))
                 (is (< idx-one idx-delim idx-two))
                 (is (= 0 (:exit-code show-json-result)))
                 (is (= "ok" (:status show-json-payload)))
                 (is (vector? show-data))
                 (is (= 2 (count show-data)))
                 (is (contains? root-titles "Multi show one"))
                 (is (contains? root-titles "Multi show two"))
                  (is (= "ok" (:status stop-payload)))
                  (done))
                (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-show-multi-id-filters-contained
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-multi-id-contained")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "show-multi-id-contained-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "show-multi-id-contained-graph" "add" "page" "--page" "ParentPage"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "show-multi-id-contained-graph" "add" "block"
                                   "--target-page-name" "ParentPage"
                                   "--content" "Parent Block"]
                                  data-dir cfg-path)
                       parent-query (run-cli ["--repo" "show-multi-id-contained-graph" "query"
                                              "--query" "[:find ?e . :in $ ?title :where [?e :block/title ?title]]"
                                              "--inputs" (pr-str ["Parent Block"])]
                                             data-dir cfg-path)
                       parent-payload (parse-json-output parent-query)
                       parent-id (get-in parent-payload [:data :result])
                       parent-uuid (query-block-uuid-by-id data-dir cfg-path "show-multi-id-contained-graph" parent-id)
                       _ (run-cli ["--repo" "show-multi-id-contained-graph" "add" "block"
                                   "--target-uuid" (str parent-uuid)
                                   "--content" "Child Block"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       show-children (run-cli ["--repo" "show-multi-id-contained-graph"
                                               "show"
                                               "--page-name" "ParentPage"
                                               "--format" "json"]
                                              data-dir cfg-path)
                       show-children-payload (parse-json-output show-children)
                       child-node (find-block-by-title (get-in show-children-payload [:data :root]) "Child Block")
                       child-id (or (:db/id child-node) (:id child-node))
                       ids-edn (str "[" parent-id " " child-id "]")
                       show-json-result (run-cli ["--repo" "show-multi-id-contained-graph" "show"
                                                  "--id" ids-edn
                                                  "--format" "json"]
                                                 data-dir cfg-path)
                       show-json-payload (parse-json-output show-json-result)
                       show-data (:data show-json-payload)
                       root-titles (set (map (comp node-title :root) show-data))
                       stop-result (run-cli ["server" "stop" "--repo" "show-multi-id-contained-graph"]
                                            data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code parent-query)))
                 (is (some? parent-id))
                 (is (some? parent-uuid))
                 (is (some? child-id))
                 (is (= 0 (:exit-code show-json-result)))
                 (is (= "ok" (:status show-json-payload)))
                 (is (vector? show-data))
                 (is (= 1 (count show-data)))
                 (is (contains? root-titles "Parent Block"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-query-human-output-pipes-to-show
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-query-pipe")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "query-pipe-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "query-pipe-graph" "add" "page" "--page" "PipePage"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "query-pipe-graph" "add" "block"
                                   "--target-page-name" "PipePage"
                                   "--content" "Pipe One"]
                                  data-dir cfg-path)
                       _ (run-cli ["--repo" "query-pipe-graph" "add" "block"
                                   "--target-page-name" "PipePage"
                                   "--content" "Pipe Two"]
                                  data-dir cfg-path)
                       _ (p/delay 100)
                       query-text (str "[:find [?e ...]"
                                       " :in $ ?q"
                                       " :where"
                                       " [?e :block/title ?title]"
                                       " [(clojure.string/includes? ?title ?q)]]")
                       query-result (run-cli ["--repo" "query-pipe-graph"
                                              "--output" "human"
                                              "query"
                                              "--query" query-text
                                              "--inputs" (pr-str ["Pipe"])]
                                             data-dir cfg-path)
                       ids-edn (string/trim (:output query-result))
                       show-json-result (run-cli ["--repo" "query-pipe-graph" "show"
                                                  "--id" ids-edn
                                                  "--format" "json"]
                                                 data-dir cfg-path)
                       show-json-payload (parse-json-output show-json-result)
                       show-data (:data show-json-payload)
                       root-titles (set (map (comp node-title :root) show-data))
                       stop-result (run-cli ["server" "stop" "--repo" "query-pipe-graph"]
                                            data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= 0 (:exit-code query-result)))
                 (is (seq ids-edn))
                 (is (= 0 (:exit-code show-json-result)))
                 (is (= "ok" (:status show-json-payload)))
                 (is (vector? show-data))
                 (is (contains? root-titles "Pipe One"))
                 (is (contains? root-titles "Pipe Two"))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-show-linked-references
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-linked-refs")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       _ (run-cli ["graph" "create" "--repo" "linked-refs-graph"] data-dir cfg-path)
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "page" "--page" "TargetPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "page" "--page" "SourcePage"] data-dir cfg-path)
                       list-page-result (run-cli ["--repo" "linked-refs-graph" "list" "page" "--expand"]
                                                 data-dir cfg-path)
                       list-page-payload (parse-json-output list-page-result)
                       page-item (some (fn [item]
                                         (when (= "TargetPage" (or (:block/title item) (:title item)))
                                           item))
                                       (get-in list-page-payload [:data :items]))
                       page-id (or (:db/id page-item) (:id page-item))
                       blocks-edn (str "[{:block/title \"Ref to TargetPage\" :block/refs [{:db/id " page-id "}]}]")
                       _ (run-cli ["--repo" "linked-refs-graph" "add" "block" "--target-page-name" "SourcePage"
                                   "--blocks" blocks-edn] data-dir cfg-path)
                       show-result (run-cli ["--repo" "linked-refs-graph" "show" "--page-name" "TargetPage" "--format" "json"]
                                            data-dir cfg-path)
                       show-payload (parse-json-output show-result)
                       linked (get-in show-payload [:data :linked-references])
                       ref-block (first (:blocks linked))
                       stop-result (run-cli ["server" "stop" "--repo" "linked-refs-graph"] data-dir cfg-path)
                       stop-payload (parse-json-output stop-result)]
                 (is (= "ok" (:status show-payload)))
                 (is (some? page-id))
                 (is (map? linked))
                 (is (pos? (:count linked)))
                 (is (seq (:blocks linked)))
                 (is (some? ref-block))
                 (is (some? (:db/id ref-block)))
                 (is (some? (or (get-in ref-block [:page :title])
                                (get-in ref-block [:page :name]))))
                 (is (= "ok" (:status stop-payload)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-graph-export-import-edn
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-export-edn")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       export-graph "export-edn-graph"
                       import-graph "import-edn-graph"
                       export-path (node-path/join (node-helper/create-tmp-dir "exports") "graph.edn")
                       _ (run-cli ["graph" "create" "--repo" export-graph] data-dir cfg-path)
                       _ (run-cli ["--repo" export-graph "add" "page" "--page" "ExportPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" export-graph "add" "block" "--target-page-name" "ExportPage" "--content" "Export content"] data-dir cfg-path)
                       export-result (run-cli ["--repo" export-graph
                                               "graph" "export"
                                               "--type" "edn"
                                               "--output" export-path] data-dir cfg-path)
                       export-payload (parse-json-output export-result)
                       _ (run-cli ["--repo" import-graph
                                   "graph" "import"
                                   "--type" "edn"
                                   "--input" export-path] data-dir cfg-path)
                       list-result (run-cli ["--repo" import-graph "list" "page"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       stop-export (run-cli ["server" "stop" "--repo" export-graph] data-dir cfg-path)
                       stop-import (run-cli ["server" "stop" "--repo" import-graph] data-dir cfg-path)]
                 (is (= 0 (:exit-code export-result)))
                 (is (= "ok" (:status export-payload)))
                 (is (fs/existsSync export-path))
                 (is (pos? (.-size (fs/statSync export-path))))
                 (is (= "ok" (:status list-payload)))
                 (is (some (fn [item]
                             (= "ExportPage" (or (:title item) (:block/title item))))
                           (get-in list-payload [:data :items])))
                 (is (= 0 (:exit-code stop-export)))
                 (is (= 0 (:exit-code stop-import)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))

(deftest test-cli-graph-export-import-sqlite
  (async done
         (let [data-dir (node-helper/create-tmp-dir "db-worker-export-sqlite")]
           (-> (p/let [cfg-path (node-path/join (node-helper/create-tmp-dir "cli") "cli.edn")
                       _ (fs/writeFileSync cfg-path "{:output-format :json}")
                       export-graph "export-sqlite-graph"
                       import-graph "import-sqlite-graph"
                       export-path (node-path/join (node-helper/create-tmp-dir "exports") "graph.sqlite")
                       _ (run-cli ["graph" "create" "--repo" export-graph] data-dir cfg-path)
                       _ (run-cli ["--repo" export-graph "add" "page" "--page" "SQLiteExportPage"] data-dir cfg-path)
                       _ (run-cli ["--repo" export-graph "add" "block" "--target-page-name" "SQLiteExportPage" "--content" "SQLite export content"] data-dir cfg-path)
                       export-result (run-cli ["--repo" export-graph
                                               "graph" "export"
                                               "--type" "sqlite"
                                               "--output" export-path] data-dir cfg-path)
                       export-payload (parse-json-output export-result)
                       _ (run-cli ["--repo" import-graph
                                   "graph" "import"
                                   "--type" "sqlite"
                                   "--input" export-path] data-dir cfg-path)
                       list-result (run-cli ["--repo" import-graph "list" "page"] data-dir cfg-path)
                       list-payload (parse-json-output list-result)
                       stop-export (run-cli ["server" "stop" "--repo" export-graph] data-dir cfg-path)
                       stop-import (run-cli ["server" "stop" "--repo" import-graph] data-dir cfg-path)]
                 (is (= 0 (:exit-code export-result)))
                 (is (= "ok" (:status export-payload)))
                 (is (fs/existsSync export-path))
                 (is (pos? (.-size (fs/statSync export-path))))
                 (is (= "ok" (:status list-payload)))
                 (is (some (fn [item]
                             (= "SQLiteExportPage" (or (:title item) (:block/title item))))
                           (get-in list-payload [:data :items])))
                 (is (= 0 (:exit-code stop-export)))
                 (is (= 0 (:exit-code stop-import)))
                 (done))
               (p/catch (fn [e]
                          (is false (str "unexpected error: " e))
                          (done)))))))
