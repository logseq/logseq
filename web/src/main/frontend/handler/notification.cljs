(ns frontend.handler.notification
  (:require [frontend.state :as state]
            [frontend.util :as util]))

(defn clear!
  [uid]
  (let [contents (state/get-notification-contents)]
    (state/set-state! :notification/contents (dissoc contents uid))))

(defn show!
  ([content status]
   (show! content status true nil))
  ([content status clear?]
   (show! content status clear? nil))
  ([content status clear? uid]
   (let [contents (state/get-notification-contents)
         uid (or uid (keyword (util/unique-id)))]
     (state/set-state! :notification/contents (assoc contents 
                                                     uid {:content content
                                                          :status status}))

     (when clear?
       (js/setTimeout #(clear! uid) 3000)))))
