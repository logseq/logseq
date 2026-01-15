(ns logseq.cli.main
  "CLI entrypoint for invoking db-worker-node."
  (:refer-clojure :exclude [run!])
  (:require [clojure.string :as string]
            [logseq.cli.commands :as commands]
            [logseq.cli.config :as config]
            [logseq.cli.format :as format]
            [promesa.core :as p]))

(defn- usage
  [summary]
  (string/join "\n"
               ["logseq-cli <command> [options]"
                ""
                "Commands: graph list, graph create, graph switch, graph remove, graph validate, graph info, block add, block remove, block search, block tree"
                ""
                "Options:"
                summary]))

(defn run!
  ([args] (run! args {}))
  ([args _opts]
   (let [parsed (commands/parse-args args)]
     (cond
       (:help? parsed)
       (p/resolved {:exit-code 0
                    :output (usage (:summary parsed))})

       (not (:ok? parsed))
       (p/resolved {:exit-code 1
                    :output (format/format-result {:status :error
                                                   :error (:error parsed)}
                                                  {:json? false})})

       :else
       (let [cfg (config/resolve-config (:options parsed))
             action-result (commands/build-action parsed cfg)]
         (if-not (:ok? action-result)
           (p/resolved {:exit-code 1
                        :output (format/format-result {:status :error
                                                       :error (:error action-result)}
                                                      cfg)})
           (-> (commands/execute (:action action-result) cfg)
               (p/then (fn [result]
                         (let [opts (cond-> cfg
                                       (:output-format result)
                                       (assoc :output-format (:output-format result)))]
                           {:exit-code 0
                            :output (format/format-result result opts)})))
               (p/catch (fn [error]
                          (let [message (or (some-> (ex-data error) :message)
                                            (.-message error)
                                            (str error))]
                            {:exit-code 1
                             :output (format/format-result {:status :error
                                                            :error {:code :exception
                                                                    :message message}}
                                                           cfg)}))))))))))

(defn main
  [& args]
  (-> (run! args)
      (p/then (fn [{:keys [exit-code output]}]
                (when (seq output)
                  (println output))
                (.exit js/process exit-code)))))
