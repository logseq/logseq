(ns frontend.handler.notification
  "Provides notification related functionality"
  (:require [frontend.state :as state]
            [frontend.util :as util]))

(defn clear!
  [uid]
  (let [contents (state/get-notification-contents)
        close-cb (:close-cb (get contents uid))]
    (state/set-state! :notification/contents (dissoc contents uid))
    (when (fn? close-cb) (close-cb uid))))

(defn clear-all!
  []
  (state/set-state! :notification/contents nil))

(defn show!
  ([content]
   (show! content :info true nil 2000 nil))
  ([content status]
   (show! content status true nil 1500 nil))
  ([content status clear?]
   (show! content status clear? nil 1500 nil))
  ([content status clear? uid]
   (show! content status clear? uid 1500 nil))
  ([content status clear? uid timeout close-cb]
   (let [contents (state/get-notification-contents)
         uid (or uid (keyword (util/unique-id)))]
     (state/set-state! :notification/contents (assoc contents
                                                     uid {:content content
                                                          :status status
                                                          :close-cb close-cb}))

     (when (and clear? (not= status :error))
       (js/setTimeout #(clear! uid) (or timeout 1500)))

     uid)))
