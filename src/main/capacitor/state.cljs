(ns capacitor.state
  (:require [frontend.rum :as r]
            [frontend.util :as util]))

(defonce *nav-root (atom nil))
(defonce *state
  (atom {:version 0
         :last-modified-page-uuid nil
         :editing-block nil
         }))

(defn use-nav-root [] (r/use-atom *nav-root))
(defn use-app-state
  ([] (r/use-atom *state))
  ([ks] (r/use-atom-in *state ks)))

(defn set-state!
  [path value & {:keys [path-in-sub-atom]}]
  (let [path-coll? (coll? path)
        get-fn (if path-coll? get-in get)
        s (get-fn @*state path)
        s-atom? (util/atom? s)
        path-coll?-in-sub-atom (coll? path-in-sub-atom)]
    (cond
      (and s-atom? path-in-sub-atom path-coll?-in-sub-atom)
      (let [old-v (get-in @s path-in-sub-atom)]
        (when (not= old-v value)
          (swap! s assoc-in path-in-sub-atom value)))

      (and s-atom? path-in-sub-atom)
      (let [old-v (get @s path-in-sub-atom)]
        (when (not= old-v value)
          (swap! s assoc path-in-sub-atom value)))

      s-atom?
      (when (not= @s value)
        (reset! s value))

      path-coll?
      (when (not= s value)
        (swap! *state assoc-in path value))

      :else
      (when (not= s value)
        (swap! *state assoc path value))))
  nil)

