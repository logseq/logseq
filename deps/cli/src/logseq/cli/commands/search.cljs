(ns logseq.cli.commands.search
  "Search command"
  (:require [clojure.pprint :as pprint]
            [clojure.string :as string]
            [logseq.cli.util :as cli-util]
            [logseq.cli.text-util :as cli-text-util]
            [promesa.core :as p]))

(def spec {:api-query-token {:alias :a
                             :require true
                             :desc "Api server token"}
           :raw {:alias :r
                 :desc "Print raw response"}
           :limit {:alias :l
                   :default 100
                   :desc "Limit max number of results"}})

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

(defn search
  [{{:keys [search-terms api-query-token raw limit]} :opts}]
  (-> (p/let [resp (cli-util/api-fetch api-query-token
                                       "logseq.app.search"
                                       [(string/join " " search-terms) {:limit limit}])]
        (if (= 200 (.-status resp))
          (p/let [body (.json resp)]
            (let [{:keys [blocks]} (js->clj body :keywordize-keys true)]
              (println "Search found" (count blocks) "results:")
              (if raw
                (pprint/pprint blocks)
                (println (string/join "\n"
                                      (->> blocks
                                           (map :block/title)
                                           (map #(string/replace % "\n" "\\\\n"))
                                           (map highlight-content-query)))))))
          (cli-util/api-handle-error-response resp)))
      (p/catch (fn [err]
                 (js/console.error "Error:" err)
                 (js/process.exit 1)))))
