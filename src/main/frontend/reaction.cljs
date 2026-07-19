(ns frontend.reaction
  "Utilities for block reactions"
  (:require ["@emoji-mart/data" :as emoji-data]
            [clojure.string :as string]
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
  (let [reaction-by-current-user? (fn [reaction]
                                    (let [user (:logseq.property/created-by-ref reaction)]
                                      (if (map? user)
                                        (or (= current-user-id (:db/id user))
                                            (= current-user-id (:block/uuid user)))
                                        (= current-user-id user))))
        reaction-username (fn [reaction]
                            (let [user (:logseq.property/created-by-ref reaction)]
                              (when (map? user)
                                (:block/title user))))
        summary (reduce (fn [acc reaction]
                          (let [emoji-id (:logseq.property.reaction/emoji-id reaction)
                                username (reaction-username reaction)]
                            (if (string? emoji-id)
                              (-> acc
                                  (update-in [emoji-id :count] (fnil inc 0))
                                  (cond-> (string? username)
                                    (update-in [emoji-id :usernames] (fnil conj #{}) username))
                                  (update-in [emoji-id :reacted-by-me?]
                                             (fnil #(or % (reaction-by-current-user? reaction)) false)))
                              acc)))
                        {}
                        reactions)]
    (->> summary
         (map (fn [[emoji-id {:keys [count reacted-by-me? usernames]}]]
                {:emoji-id emoji-id
                 :count count
                 :reacted-by-me? (boolean reacted-by-me?)
                 :usernames (when (seq usernames)
                              (->> usernames sort vec))}))
         (sort-by (juxt (comp - :count) :emoji-id))
         vec)))
