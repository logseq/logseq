(ns frontend.ai.text-encoder
  "Plugin service for text encoder (AI)"
  (:require [promesa.core :as p]
            [frontend.state :as state]
            [frontend.handler.plugin :as plugin-handler]
            [cljs-bean.core :as bean]
            [lambdaisland.glogi :as log]))

(defn- call-service!
  "Handling communication with text encoder plugin
  When reply? is true, it will listen to the `service:<event>:<name>:reply `event
  and return a promise of the result"
  ([service event payload] (call-service! service event payload false))
  ([service event payload reply?]
   (when-let [^js pl (plugin-handler/get-plugin-inst (:pid service))]
     (let [{:keys [name]} service
           payload-hash (hash (:text payload))
           payload (assoc payload :hash payload-hash)
           hookEvent (str "service:" event ":" name)]
       (.call (.-caller pl) hookEvent (bean/->js (merge {:graph (state/get-current-repo)} payload)))
       (when reply?
         (-> (p/create (fn [resolve _rej]
                         ;; Following the same pattern as logseq libs
                         ;; https://github.com/logseq/logseq/blob/bf2f5a147065ac4fd3e4d34f802a27b8ddb7e5eb/libs/src/modules/LSPlugin.TextEncoder.ts#L55
                         (.once (.-caller pl) (str hookEvent ":reply:" payload-hash)
                                (fn [^js e]
                                  (resolve (bean/->clj e))))))
             (p/timeout 20000)
             (p/catch #(log/error :ai-text-encoder/encode-text-timeout {:message "Timeout waiting reply from text encoder service" 
                                                                        :hookEvent hookEvent 
                                                                        :error %}))))))))

(defn- text-encode'
  [text service]
  (call-service! service "textEncoder:textEncode" {:text text} true))

;; TODO: support selecting text encoder
(defn text-encode
  "Return a promise of the encoded text
   Or return nil if no matching text encoder available"
  ([text]
   (text-encode' text (when state/lsp-enabled?
                        (->> (state/get-all-plugin-services-with-type :text-encoder)
                             (first)))))
  ([text encoder-name]
   (text-encode' text (when state/lsp-enabled?
                        (->> (state/get-all-plugin-services-with-type :text-encoder)
                             (filter #(= (:name %) encoder-name))
                             (first))))))
