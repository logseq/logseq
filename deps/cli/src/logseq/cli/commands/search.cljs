(ns logseq.cli.commands.search
  "Search command"
  (:require ["fs" :as fs]
            [clojure.pprint :as pprint]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.cli.text-util :as cli-text-util]
            [logseq.cli.util :as cli-util]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [promesa.core :as p]))

(defn- highlight
  "Shows up as soft red on terminals that support ANSI 24-bit color like iTerm"
  [text]
  (str "\u001b[38;2;" 242 ";" 101 ";" 106 "m" text "\u001b[0m"))

(defn- highlight-content-query
  "Return string with highlighted content FTS result. CLI version of cmdk/highlight-content-query"
  [content]
  (when-not (string/blank? content)
    ;; why recur? because there might be multiple matches
    (loop [content content]
      (let [[b-cut hl-cut e-cut] (cli-text-util/cut-by content "$pfts_2lqh>$" "$<pfts_2lqh$")
            new-result (str b-cut (highlight hl-cut) e-cut)]
        (if-not (string/blank? e-cut)
          (recur new-result)
          new-result)))))

(defn- format-results
  "Results are a list of strings. Handles highlighting search term in results and printing options like :raw"
  [results search-term {:keys [raw api?]}]
  (println "Search found" (count results) "results:")
  (if raw
    (pprint/pprint results)
    (let [highlight-fn (if api?
                         highlight-content-query
                         #(string/replace % search-term (highlight search-term)))]
      (println (string/join "\n"
                           (->> results
                                (map #(string/replace % "\n" "\\\\n"))
                                (map highlight-fn)))))))

(defn- api-search
  [search-term {{:keys [api-server-token raw limit]} :opts}]
  (-> (p/let [resp (cli-util/api-fetch api-server-token "logseq.app.search" [search-term {:limit limit}])]
        (if (= 200 (.-status resp))
          (p/let [body (.json resp)]
            (let [{:keys [blocks]} (js->clj body :keywordize-keys true)]
              (format-results (map :title blocks) search-term {:raw raw :api? true})))
          (cli-util/api-handle-error-response resp)))
      (p/catch cli-util/command-catch-handler)))

(defn- local-search [search-term {{:keys [graph raw limit]} :opts}]
  (when-not graph
    (cli-util/error "Command missing required option 'graph'"))
  (if (fs/existsSync (cli-util/get-graph-path graph))
    (let [conn (apply sqlite-cli/open-db! (cli-util/->open-db-args graph))
          _ (cli-util/ensure-db-graph-for-command @conn)
          nodes (->> (d/datoms @conn :aevt :block/title)
                     (filter (fn [datom]
                               (string/includes? (:v datom) search-term)))
                     (take limit)
                     (map :v))]
      (format-results nodes search-term {:raw raw}))
    (cli-util/error "Graph" (pr-str graph) "does not exist")))

(defn search [{{:keys [search-terms] :as opts} :opts :as m}]
  (if (cli-util/api-command? opts)
    (api-search (string/join " " search-terms) m)
    (local-search (string/join " " search-terms) m)))