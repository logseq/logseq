(ns logseq.publish.worker
  (:require ["cloudflare:workers" :refer [DurableObject]]
            [logseq.publish.meta-store :as meta-store]
            [logseq.publish.routes :as publish-routes]
            [shadow.cljs.modern :refer (defclass)]))

(def worker
  #js {:fetch (fn [request env _ctx]
                (publish-routes/handle-fetch request env))})

(defclass PublishMetaDO
  (extends DurableObject)

  (constructor [this ^js state env]
               (super state env)
               (set! (.-state this) state)
               (set! (.-env this) env)
               (set! (.-sql this) (.-sql ^js (.-storage state))))

  Object
  (fetch [this request]
         (meta-store/do-fetch this request)))
