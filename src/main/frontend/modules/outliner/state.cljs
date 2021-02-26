(ns frontend.modules.outliner.state
  (:require [frontend.modules.outliner.tree :as tree]
            [frontend.db.conn :as conn]
            [frontend.db.outliner :as db-outliner]
            [frontend.modules.outliner.utils :as outliner-u]
            [frontend.react-impls :as r]))

(def position-state (atom {}))

(defn- fill-block-into-position
  ([block]
   {:pre [(tree/satisfied-inode? block)]}
   (let [parent-id (tree/-get-parent-id block)
         left-id (tree/-get-left-id block)]
     (fill-block-into-position parent-id left-id block)))
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

(defn- reset-position-as-empty
  ([block]
   {:pre [(tree/satisfied-inode? block)]}
   (let [parent-id (tree/-get-parent-id block)
         left-id (tree/-get-left-id block)]
     (reset-position-as-empty parent-id left-id)))
  ([parent-id left-id]
   (let [ref-key [parent-id left-id]]
     (when-let [ref-atom (get @position-state ref-key)]
       (reset! ref-atom {:block nil
                         :parent-id parent-id
                         :left-id left-id})))))

(defn- get-block-by-position
  ([block]
   {:pre [(tree/satisfied-inode? block)]}
   (let [parent-id (tree/-get-parent-id block)
         left-id (tree/-get-left-id block)]
     (get-block-by-position parent-id left-id)))
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

(defn save-&-revise-positions
  [block]
  (let [block-id (tree/-get-id block)
        block-in-datascript (outliner-u/get-block-by-id block-id)]
    (cond
      ;; no legacy cache need to process, save directly.
      (not block-in-datascript)
      (fill-block-into-position block)

      :else
      (if (position-changed? block-in-datascript block)
        (do
          (fill-block-into-position block)
          (let [block-from-position
                (some-> (get-block-by-position block-in-datascript) deref :block)]
            (when (and block-from-position
                    (not (position-taken? block block-from-position)))
              (reset-position-as-empty block-in-datascript))))
        (let [block-in-cache
              (some-> (get-block-by-position block-in-datascript) deref :block)]
          (if (and block-in-cache
                (position-taken? block block-in-cache))
            (throw (js/Error. "Other node should not take my seat."))
            (fill-block-into-position block)))))))

(defn reset-the-position
  [block]
  (let [block-id (tree/-get-id block)]
    (when-let [old-block (outliner-u/get-block-by-id block-id)]
      (when-let [data (some-> (get-block-by-position old-block)
                        (deref)
                        :block)]
        (let [position-still-mine? (= block-id (:block/id data))]
          (when position-still-mine?
            (reset-position-as-empty old-block)))))))

(defn get-block-and-ensure-position
  [parent-id left-id]
  (let [block-ref
        (if-let [block-ref (get-block-by-position parent-id left-id)]
          block-ref
          (let [c (conn/get-outliner-conn)
                r (db-outliner/get-by-parent-&-left
                    c
                    (outliner-u/->block-look-ref parent-id)
                    (outliner-u/->block-look-ref left-id))
                block (when r (outliner-u/->Block r))
                block-ref (fill-block-into-position parent-id left-id block)]
            block-ref))]
    (-> (@r/react block-ref)
      :block)))