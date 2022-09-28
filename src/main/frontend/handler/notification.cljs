(ns frontend.handler.notification
  "Provides notification related functionality"
  (:require [frontend.state :as state]
            [frontend.util :as util]))

(defn clear!
  [uid]
  (let [contents (state/get-notification-contents)]
    (state/set-state! :notification/contents (dissoc contents uid))))

(defn clear-all!
  []
  (state/set-state! :notification/contents nil))

(defn show!
  ([content status]
   (show! content status true nil 1500))
  ([content status clear?]
   (show! content status clear? nil 1500))
  ([content status clear? uid]
   (show! content status clear? uid 1500))
  ([content status clear? uid timeout]
   (let [contents (state/get-notification-contents)
         uid (or uid (keyword (util/unique-id)))]
     (state/set-state! :notification/contents (assoc contents
                                                     uid {:content content
                                                          :status status}))

     (when (and clear? (not= status :error))
       (js/setTimeout #(clear! uid) (or timeout 1500)))

     uid)))
