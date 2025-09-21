(ns logseq.shui.storybook)

(defmacro defmeta
  [title configs]
  `(def ~(with-meta
           'default
           {:export true})
     (let [ret# ~(assoc configs :title (-> (str title) (clojure.string/replace ":" "")))
           cp# (:component ret#)
           ret# (cond-> ret#
                  (fn? cp#)
                  (assoc :component
                    (fn [^js args#]
                      (let [{:keys [~'children] :as args#} (cljs-bean.core/->clj args#)]
                        (cp# (dissoc args# :children)
                          (if (fn? ~'children) (~'children) ~'children))))))]
       (cljs-bean.core/->js ret#))))

(defmacro defstory
  [title configs]
  `(def ~(with-meta (symbol (name title)) {:export true})
     (let [ret# ~configs
           render# (:render ret#)
           ret# (cond-> ret#
                  (fn? render#)
                  (assoc :render
                    (fn [^js args#]
                      (let [{:keys [~'children] :as args#} (cljs-bean.core/->clj args#)]
                        (let [~'res (render# (dissoc args# :children)
                                      (if (fn? ~'children) (~'children) ~'children))]
                          (daiquiri.interpreter/interpret ~'res))))))]
       (cljs-bean.core/->js ret#))))