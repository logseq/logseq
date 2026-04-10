(ns logseq.cli.main
  "CLI entrypoint for invoking db-worker-node."
  (:refer-clojure :exclude [run!])
  (:require [lambdaisland.glogi :as log]
            [logseq.cli.command.core :as command-core]
            [logseq.cli.commands :as commands]
            [logseq.cli.config :as config]
            [logseq.cli.data-dir :as data-dir]
            [logseq.cli.format :as format]
            [logseq.cli.log :as cli-log]
            [logseq.cli.output-mode :as output-mode]
            [logseq.cli.profile :as profile]
            [logseq.cli.version :as version]
            [promesa.core :as p]))

(defn- result->exit-code
  [result]
  (or (:exit-code result)
      (if (= :error (:status result)) 1 0)))

;; NOTE:
;; `--profile` is intentionally detected from raw argv before command parsing.
;; This lets profiling include early stages (especially `cli.parse-args`) and
;; still emit profile output for parse/help/error paths that may short-circuit
;; before a fully parsed options map exists.
(defn- profile-enabled-argv?
  [args]
  (boolean (some #{"--profile"} args)))

(defn- profile-command
  [parsed]
  (cond
    (:help? parsed) "help"
    (keyword? (:command parsed)) (name (:command parsed))
    (string? (:command parsed)) (:command parsed)
    :else "unknown"))

(defn- attach-profile-lines
  [profile-session parsed result]
  (if profile-session
    (assoc result
           :profile-lines
           (profile/render-lines
            (profile/report profile-session
                            {:command (profile-command parsed)
                             :status (if (zero? (:exit-code result)) :ok :error)})))
    result))

(defn- parse-argv-output-format
  [args]
  (let [{:keys [opts]} (command-core/parse-leading-global-opts args)]
    (or (output-mode/parse (:output-format opts))
        (output-mode/parse (:output opts)))))

(defn- parsed-output-format
  [parsed]
  (or (output-mode/parse (get-in parsed [:options :output-format]))
      (output-mode/parse (get-in parsed [:options :output]))))

(defn- resolve-output-format
  [args parsed cfg result]
  (or (output-mode/parse (:output-format result))
      (output-mode/parse (:output-format cfg))
      (parsed-output-format parsed)
      (parse-argv-output-format args)))

(defn- format-opts
  [args parsed cfg result]
  (if-let [mode (resolve-output-format args parsed cfg result)]
    {:output-format mode}
    {}))

(defn- handle-unexpected-error
  "Provide clean, consistent error handling for unexpected errors in run!"
  [profile-session parsed cfg error]
  (let [data (ex-data error)
        message (or (.-message error) (:message error) (str error))]
    (if (= :data-dir-permission (:code data))
      (p/resolved
       (attach-profile-lines
        profile-session
        parsed
        {:exit-code 1
         :output (profile/time! profile-session "cli.format-result"
                                (fn []
                                  (format/format-result {:status :error
                                                         :error {:code :data-dir-permission
                                                                 :message message
                                                                 :path (:path data)}}
                                                        cfg)))}))
      (attach-profile-lines
       profile-session
       parsed
       {:exit-code 1
        :output (profile/time! profile-session "cli.format-result"
                               (fn []
                                 (format/format-result {:status :error
                                                        :error {:code (or (:code data) :exception)
                                                                :message (str message
                                                                              (when (get-in parsed [:options :verbose])
                                                                                (str "\nStacktrace:\n"
                                                                                     (.-stack error))))}}
                                                       cfg)))}))))

(defn run!
  ([args] (run! args {}))
  ([args _opts]
   (let [profile-session (profile/create-session (profile-enabled-argv? args))
         parsed (profile/time! profile-session "cli.parse-args"
                               (fn []
                                 (commands/parse-args args)))]
     (cond
       (:help? parsed)
       (p/resolved
        (let [mode (resolve-output-format args parsed nil nil)]
          (attach-profile-lines
           profile-session
           parsed
           {:exit-code 0
            :output (if (output-mode/structured? mode)
                      (profile/time! profile-session "cli.format-result"
                                     (fn []
                                       (format/format-result {:status :ok
                                                              :data {:message (:summary parsed)}}
                                                             {:output-format mode})))
                      (:summary parsed))})))

       (not (:ok? parsed))
       (p/resolved
        (attach-profile-lines
         profile-session
         parsed
         {:exit-code 1
          :output (profile/time! profile-session "cli.format-result"
                                 (fn []
                                   (format/format-result {:status :error
                                                          :error (:error parsed)
                                                          :command (:command parsed)}
                                                         (format-opts args parsed nil nil))))}))

       (= :version (:command parsed))
       (p/resolved
        (attach-profile-lines profile-session parsed
                              {:exit-code 0
                               :output (version/format-version)}))

       :else
       (let [cfg* (profile/time! profile-session "cli.resolve-config"
                                 (fn []
                                   (config/resolve-config (:options parsed))))
             cfg (cond-> cfg*
                   profile-session (assoc :profile-session profile-session))]
         (cli-log/set-verbose! (:verbose cfg))
         (log/debug :event :cli/parsed-options
                    :command (:command parsed)
                    :args (cli-log/truncate-preview (:args parsed))
                    :options (into {}
                                   (map (fn [[k v]]
                                          [k (cli-log/truncate-preview v)])
                                        (:options parsed)))
                    :config (into {}
                                  (map (fn [[k v]]
                                         [k (cli-log/truncate-preview v)])
                                       (dissoc cfg :auth-token))))
         (try
           (let [cfg (assoc cfg
                            :data-dir
                            (profile/time! profile-session "cli.ensure-data-dir"
                                           (fn []
                                             (data-dir/ensure-data-dir! (:data-dir cfg)))))
                 action-result (profile/time! profile-session "cli.build-action"
                                              (fn []
                                                (commands/build-action parsed cfg)))]
             (if-not (:ok? action-result)
               (p/resolved
                (attach-profile-lines
                 profile-session
                 parsed
                 {:exit-code 1
                  :output (profile/time! profile-session "cli.format-result"
                                         (fn []
                                           (format/format-result {:status :error
                                                                  :error (:error action-result)
                                                                  :command (:command parsed)
                                                                  :context (select-keys (:options parsed)
                                                                                        [:repo :graph :page :block])}
                                                                 cfg)))}))
               (-> (profile/time! profile-session "cli.execute-action"
                                  (fn []
                                    (commands/execute (:action action-result) cfg)))
                   (p/then (fn [result]
                             (let [opts (merge cfg (format-opts args parsed cfg result))]
                               (attach-profile-lines
                                profile-session
                                parsed
                                {:exit-code (result->exit-code result)
                                 :output (profile/time! profile-session "cli.format-result"
                                                        (fn []
                                                          (format/format-result result opts)))}))))
                   (p/catch (partial handle-unexpected-error profile-session parsed cfg)))))
           (catch :default error
             ;; Cleanly handle errors especially for commands/build-action which handles error-prone options
             (handle-unexpected-error profile-session parsed cfg error))))))))

(defn- print-profile-lines!
  [profile-lines]
  (doseq [line profile-lines]
    (.write (.-stderr js/process) (str line "\n"))))

(defn main
  [& args]
  (-> (run! args)
      (p/then (fn [{:keys [exit-code output profile-lines]}]
                (when (seq output)
                  (println output))
                (when (seq profile-lines)
                  (print-profile-lines! profile-lines))
                (when-not (zero? exit-code)
                  (.exit js/process exit-code))))))
