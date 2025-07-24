(ns logseq.cli.commands.search
  "Search command"
  (:require [clojure.pprint :as pprint]
            [clojure.string :as string]
            [logseq.cli.util :as cli-util]
            [promesa.core :as p]))

(def spec {:api-query-token {:alias :a
                             :require true
                             :desc "Api server token"}
           :raw {:alias :r
                 :desc "Print raw response"}})

(defn search
  [{{:keys [search-terms api-query-token raw]} :opts}]
  (-> (p/let [resp (cli-util/api-fetch api-query-token "logseq.app.search" [(string/join " " search-terms)])]
        (if (= 200 (.-status resp))
          (p/let [body (.json resp)]
            (let [{:keys [blocks]} (js->clj body :keywordize-keys true)]
              (println "Search found" (count blocks) "results:")
              (if raw
                (pprint/pprint blocks)
                (println (string/join "\n"
                                      (->> blocks
                                           (map :block/title)
                                           (map #(string/replace % "\n" "\\\\n"))))))))
          (cli-util/api-handle-error-response resp)))
      (p/catch (fn [err]
                 (js/console.error "Error:" err)
                 (js/process.exit 1)))))
