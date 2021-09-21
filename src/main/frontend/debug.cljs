(ns frontend.debug
  (:require [cljs.pprint :as pprint]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.state :as state]
            [frontend.handler.notification :as notification]))

(defn pprint
  [& xs]
  (when (state/developer-mode?)
    (doseq [x xs]
      (pprint/pprint x))))

(defonce ack-wait-timeouts (atom {}))

(defonce default-write-ack-timeout 10000)

;; For debugging file changes are not saved on disk.
(defn wait-for-write-ack!
  [page-title file-path]
  (when file-path
    (let [requested-at (util/time-ms)]
      (state/set-state! [:debug/write-acks file-path :last-requested-at] requested-at)
      (when-let [timeout (get @ack-wait-timeouts file-path)]
        (js/clearTimeout timeout))
      (let [timeout (js/setTimeout (fn []
                                     (let [last-ack-at (get-in @state/state [:debug/write-acks file-path :last-ack-at])]
                                       (when-not (and last-ack-at
                                                      (< requested-at last-ack-at (+ requested-at default-write-ack-timeout)))
                                         (let [step (get-in @state/state [:debug/write-acks file-path :step])]
                                           (state/pub-event! [:instrument {:type :debug/write-failed
                                                                           :payload {:step step}}])
                                           ;; (notification/show!
                                           ;;  (str "Logseq failed to save the page "
                                           ;;       page-title
                                           ;;       " to the file: "
                                           ;;       file-path
                                           ;;       ". Stop editing this page anymore, and copy all the blocks of this page to another editor to avoid any data-loss.\n"
                                           ;;       "Last step: "
                                           ;;       step)
                                           ;;  :error)
                                           ))))
                                   default-write-ack-timeout)]
        (swap! ack-wait-timeouts assoc file-path timeout)))))

(defn ack-file-write!
  [file-path]
  (let [ack-at (util/time-ms)]
    (state/set-state! [:debug/write-acks file-path :last-ack-at] ack-at)))

(defn set-ack-step!
  [file-path step]
  (state/set-state! [:debug/write-acks file-path :step] step))
