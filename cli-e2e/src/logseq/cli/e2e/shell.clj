(ns logseq.cli.e2e.shell
  (:require [babashka.process :as process]))

(defn run!
  [{:keys [cmd dir env stdin executor throw?]
    :or {throw? true
         executor (fn [cmd opts]
                    @(process/process (merge {:continue true
                                              :out :string
                                              :err :string}
                                             opts)
                                      "/bin/bash"
                                      "-lc"
                                      cmd))}}]
  (let [result (executor cmd {:dir dir
                              :extra-env env
                              :in stdin})
        exit (:exit result 0)
        payload {:cmd cmd
                 :dir dir
                 :exit exit
                 :out (:out result "")
                 :err (:err result "")}]
    (when (and throw?
               (not (zero? exit)))
      (throw (ex-info "Shell command failed"
                      payload)))
    payload))
