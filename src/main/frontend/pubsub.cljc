(ns frontend.pubsub
  "All mults and pubs are collected to this ns.
  vars with suffix '-mult' is a/Mult, use a/tap and a/untap on them. used by event subscribers
  vars with suffix '-pub' is a/Pub, use a/sub and a/unsub on them. used by event subscribers
  vars with suffix '-ch' is chan used by event publishers."
  {:clj-kondo/config {:linters {:unresolved-symbol {:level :off}}}}
  #?(:cljs (:require-macros [frontend.pubsub :refer [def-mult-or-pub chan-of]]))
  (:require [clojure.core.async :as a :refer [chan mult pub]]
            [clojure.core.async.impl.protocols :as ap]
            [malli.core :as m]
            [malli.dev.pretty :as mdp]
            [clojure.pprint :as pp]))

;;; helper macro
(defmacro chan-of [malli-schema malli-schema-validator & chan-args]
  `(let [ch# (chan ~@chan-args)]
     (reify
       ap/ReadPort
       (~'take! [~'_ fn1-handler#]
        (ap/take! ch# fn1-handler#))
       ap/WritePort
       (~'put! [~'_ val# fn1-handler#]
        (if (~malli-schema-validator val#)
          (ap/put! ch# val# fn1-handler#)
          (do (mdp/explain ~malli-schema val#)
              (throw (ex-info "validate chan value failed" {:val val#}))))))))

(defmacro def-mult-or-pub
  "define following vars:
  - `symbol-name`-ch for event publisher.
  - `symbol-name`-mult or `symbol-name`-pub for event subscribers.
  - `symbol-name`-validator is malli schema validator
  def -pub var when `:topic-fn` exists otherwise -mult var"
  [symbol-name doc-string malli-schema & {:keys [ch-buffer topic-fn]
                                          :or   {ch-buffer 1}}]
  (let [schema-validator-name (symbol (str symbol-name "-validator"))
        schema-name           (symbol (str symbol-name "-schema"))
        ch-name               (symbol (str symbol-name "-ch"))
        mult-or-pub-name      (if topic-fn
                                (symbol (str symbol-name "-pub"))
                                (symbol (str symbol-name "-mult")))
        doc-string*           (str doc-string "\nMalli-schema:\n" (with-out-str (pp/pprint malli-schema)))]
    `(do
       (def ~schema-name ~malli-schema)
       (def ~schema-validator-name (m/validator ~malli-schema))
       (def ~ch-name ~doc-string* (chan-of ~malli-schema ~schema-validator-name ~ch-buffer))
       ~(if topic-fn
          `(def ~mult-or-pub-name ~doc-string* (pub ~ch-name ~topic-fn))
          `(def ~mult-or-pub-name ~doc-string* (mult ~ch-name))))))

;;; all chan, mult, pub defined here...

(def-mult-or-pub app-wake-up-from-sleep
  "app wake up from sleep event"
  [:map
   [:last-activated-at :int]
   [:now :int]])

(def-mult-or-pub sync-events
  "file-sync events"
  [:map
   [:event [:enum
            :created-local-version-file
            :finished-local->remote
            :finished-remote->local
            :start
            :pause
            :resume
            :exception-decrypt-failed
            :remote->local-full-sync-failed
            :local->remote-full-sync-failed
            :get-remote-graph-failed
            :get-deletion-logs-failed
            :get-remote-all-files-failed]]
   [:data :map]]
  :topic-fn :event
  :ch-buffer (a/sliding-buffer 10))
