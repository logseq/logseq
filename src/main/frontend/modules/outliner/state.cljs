(ns frontend.modules.outliner.state
  (:require [frontend.modules.outliner.tree :as tree]
            [frontend.db.conn :as conn]
            [frontend.db.outliner :as db-outliner]
            [frontend.modules.outliner.utils :as outliner-u]
            [frontend.tools.react-impl :as r]))

(def position-state (atom {}))

(defn- save-block-ref
  ([block]
   {:pre [(tree/satisfied-inode? block)]}
   (let [parent-id (tree/-get-parent-id block)
         left-id (tree/-get-left-id block)]
     (save-block-ref parent-id left-id block)))
  ([parent-id left-id block-value]
   (let [ref-key [parent-id left-id]]
     (if-let [ref-atom (get @position-state ref-key)]
       (do (reset! ref-atom {:block block-value
                             :parent-id parent-id
                             :left-id left-id})
           ref-atom)
       (let [block-ref (atom {:block block-value
                              :parent-id parent-id
                              :left-id left-id})]
         (swap! position-state assoc ref-key block-ref)
         block-ref)))))

(defn- del-block-ref
  ([block]
   {:pre [(tree/satisfied-inode? block)]}
   (let [parent-id (tree/-get-parent-id block)
         left-id (tree/-get-left-id block)]
     (del-block-ref parent-id left-id)))
  ([parent-id left-id]
   (let [ref-key [parent-id left-id]]
     (when-let [ref-atom (get @position-state ref-key)]
       (reset! ref-atom {:block nil
                         :parent-id parent-id
                         :left-id left-id})))))

(defn- get-block-from-ref
  ([block]
   {:pre [(tree/satisfied-inode? block)]}
   (let [parent-id (tree/-get-parent-id block)
         left-id (tree/-get-left-id block)]
     (get-block-from-ref parent-id left-id)))
  ([parent-id left-id]
   (let [ref-key [parent-id left-id]]
     (when-let [ref (get @position-state ref-key)]
       (assert
         (instance? cljs.core/Atom (atom nil))
         "block-react-ref should be atom.")
       ref))))

(defn- position-changed?
  [old-block new-block]
  (let [old-parent-id (tree/-get-parent-id old-block)
        old-left-id (tree/-get-left-id old-block)
        new-parent-id (tree/-get-parent-id new-block)
        new-left-id (tree/-get-left-id new-block)
        the-same-position
        (and
          (= old-parent-id new-parent-id)
          (= old-left-id new-left-id))]
    (not the-same-position)))

(defn- position-taken?
  [block block-in-cache]
  (not= (tree/-get-id block)
    (tree/-get-id block-in-cache)))

(defn save-block-ref-logic
  "Main logic to handler cache."
  [block]
  (let [block-id (tree/-get-id block)
        block-in-datascript (outliner-u/get-block-by-id block-id)]
    (cond
      ;; no legacy cache need to process, save directly.
      (not block-in-datascript)
      (save-block-ref block)

      :else
      (if (position-changed? block-in-datascript block)
        (do
          (save-block-ref block)
          (let [block-in-cache
                (some-> (get-block-from-ref block-in-datascript) deref :block)]
            (when (and block-in-cache
                    (not (position-taken? block block-in-cache)))
              (del-block-ref block-in-datascript))))
        (let [block-in-cache
              (some-> (get-block-from-ref block-in-datascript) deref :block)]
          (if (and block-in-cache
                (position-taken? block block-in-cache))
            (throw (js/Error. "Other node should not take my seat."))
            (save-block-ref block)))))))

(defn get-block-by-parent-&-left
  [parent-id left-id]
  (let [block-ref
        (if-let [block-ref (get-block-from-ref parent-id left-id)]
          block-ref
          (let [c (conn/get-outliner-conn)
                r (db-outliner/get-by-parent-&-left
                    c [:block/id parent-id] [:block/id left-id])
                block (when r (outliner-u/->Block r))
                block-ref (save-block-ref parent-id left-id block)]
            block-ref))]
    (-> (r/react block-ref)
      :block)))