(ns logseq.cli.commands.append
  "Command to append to a page"
  (:require [clojure.string :as string]
            [logseq.cli.util :as cli-util]
            [promesa.core :as p]))

(defn append
  [{{:keys [api-server-token args]} :opts}]
  (let [text (string/join " " args)]
    (-> (p/let [resp (cli-util/api-fetch api-server-token "logseq.app.append_block_in_page" [text nil nil])]
          (if (= 200 (.-status resp))
            (println "Success!")
            (cli-util/api-handle-error-response resp)))
        (p/catch cli-util/command-catch-handler))))