(ns frontend.modules.ai.plugin
  "Plugin service implementation of ai protocol"
  (:require [frontend.state :as state]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.ai.protocol :as protocol]
            [cljs-bean.core :as bean]))

(defn call-service!
  ([service event payload] (call-service! service event payload false))
  ([service event payload reply?]
   (when-let [^js pl (plugin-handler/get-plugin-inst (:pid service))]
     (let [{:keys [pid name]} service
           hookEvent (str "service:" event ":" name)]
       (.call (.-caller pl) hookEvent (bean/->js (merge {:graph (state/get-current-repo)} payload)))
       (when reply?
         (.once (.-caller pl) (str hookEvent ":reply")
                (fn [^js e]
                  (state/update-plugin-ai-engine pid name #(assoc % :result (bean/->clj e))))))))))

(deftype Plugin [service repo]
  protocol/AI

  (generate-text [_this q opts]
    (call-service! service "ai:generate-text" (merge {:q q} opts) true))

  (chat [_this conversation opts]
    (call-service! service "ai:chat" (merge {:conversation conversation} opts) true))

  (generate-image [_this description opts]
    (call-service! service "ai:generate-image" (merge {:description description} opts) true))

  (generate-image [_this audio opts]
    (call-service! service "ai:speech-to-text" (merge {:audio audio} opts) true)))
