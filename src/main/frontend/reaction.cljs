(ns frontend.reaction
  "Utilities for block reactions"
  (:require ["@emoji-mart/data" :as emoji-data]
            [clojure.string :as string]
            [frontend.db :as db]
            [goog.object :as gobj]))

(defonce emoji-id-set
  (let [emojis (gobj/get emoji-data "emojis")]
    (set (js/Object.keys emojis))))

(defn emoji-id-valid?
  [emoji-id]
  (and (string? emoji-id)
       (not (string/blank? emoji-id))
       (contains? emoji-id-set emoji-id)))

(defn summarize
  "Summarize reactions for display."
  [reactions current-user-id]
  (let [reaction-user-id (fn [reaction]
                           (let [user (:logseq.property/created-by-ref reaction)]
                             (cond
                               (number? user) user
                               (map? user) (:db/id user)
                               :else nil)))
        reaction-username (fn [reaction]
                            (let [user (:logseq.property/created-by-ref reaction)]
                              (cond
                                (map? user)
                                (if (:db/id user)
                                  (:logseq.property.user/name user)
                                  (or (:logseq.property.user/name user)
                                      (:block/title user)))
                                (number? user)
                                (:logseq.property.user/name (db/entity user))
                                :else nil)))
        summary (reduce (fn [acc reaction]
                          (let [emoji-id (:logseq.property.reaction/emoji-id reaction)
                                user-id (reaction-user-id reaction)
                                username (reaction-username reaction)]
                            (if (string? emoji-id)
                              (-> acc
                                  (update-in [emoji-id :count] (fnil inc 0))
                                  (cond-> (string? username)
                                    (update-in [emoji-id :usernames] (fnil conj #{}) username))
                                  (update-in [emoji-id :reacted-by-me?]
                                             (fnil #(or % (= current-user-id user-id)) false)))
                              acc)))
                        {}
                        reactions)]
    (->> summary
         (map (fn [[emoji-id {:keys [count reacted-by-me? usernames]}]]
                (cond-> {:emoji-id emoji-id
                         :count count
                         :reacted-by-me? (boolean reacted-by-me?)}
                  (seq usernames)
                  (assoc :usernames (->> usernames sort vec)))))
         (sort-by (juxt (comp - :count) :emoji-id))
         vec)))
