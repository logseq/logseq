(ns frontend.handler.notification
  "Provides notification related functionality."
  (:require [frontend.util :as util]
            [logseq.shui.ui :as shui]))

(defn- toast-id
  [uid]
  (some-> uid str))

(defn- status-icon
  [status]
  (shui/tabler-icon
   (case status
     :success "circle-check"
     :warning "alert-circle"
     :error "circle-x"
     "info-circle")
   {:class (str "ui__toast-status-icon " (name status))
    :size 20}))

(defn clear!
  [uid]
  (shui/toast-dismiss! (toast-id uid)))

(defn clear-all!
  []
  (shui/toast-dismiss!))

(defn show!
  "status: :info/:warning/:error/:success"
  ([content]
   (show! content :info true nil 2000 nil))
  ([content status]
   (show! content status (not= status :error) nil 1500 nil))
  ([content status clear?]
   (show! content status clear? nil 2000 nil))
  ([content status clear? uid]
   (show! content status clear? uid 2000 nil))
  ([content status clear? uid timeout]
   (show! content status clear? uid timeout nil))
  ([content status clear? uid timeout close-cb]
   (assert (keyword? status) "status should be a keyword")
   (let [uid (or uid (keyword (util/unique-id)))
         auto-dismiss? (and (not= status :error)
                            (not (false? clear?)))]
     (shui/toast!
      {:id (toast-id uid)
       :description content
       :variant status
       :duration (if auto-dismiss? (or timeout 2000) 0)
       :icon (status-icon status)
       :on-dismiss (fn [_id]
                     (when (fn? close-cb)
                       (close-cb uid)))})
     uid)))
