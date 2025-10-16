(ns logseq.libs.sdk-generator
  (:require [babashka.fs :as fs]
            [cheshire.core :as json]
            [clojure.string :as string]))

(def default-schema "libs/dist/logseq-sdk-schema.json")
(def default-output-dir "target/generated-cljs")
(def default-ns-prefix "logseq")

(defn parse-args
  [args]
  (loop [opts {}
         tokens args]
    (if (empty? tokens)
      opts
      (let [[flag value & more] tokens]
        (case flag
          "--schema" (recur (assoc opts :schema value) more)
          "--out" (recur (assoc opts :out-dir value) more)
          "--out-dir" (recur (assoc opts :out-dir value) more)
          "--ns-prefix" (recur (assoc opts :ns-prefix value) more)
          (throw (ex-info (str "Unknown flag: " flag) {:flag flag})))))))

(defn camel->kebab [s]
  (-> s
      (string/replace #"([a-z0-9])([A-Z])" "$1-$2")
      (string/replace #"([A-Z]+)([A-Z][a-z])" "$1-$2")
      (string/lower-case)
      (string/replace #"[^a-z0-9]+" "-")
      (string/replace #"(^-|-$)" "")))

(defn interface->target [iface-name]
  (-> iface-name
      (string/replace #"^I" "")
      (string/replace #"Proxy$" "")))

(defn interface->suffix [iface-name]
  (-> iface-name
      interface->target
      camel->kebab))

(defn interface->namespace [iface-name ns-prefix]
  (prn :debug :iface-name iface-name
       :ns-prefix ns-prefix
       :suffix (interface->suffix iface-name))
  (str ns-prefix "." (interface->suffix iface-name)))

(defn format-docstring [doc]
  (when (and doc (not (string/blank? doc)))
    (str "  " (pr-str doc) "\n")))

(defn bean-specs [params]
  (when (seq params)
    (vec
     (map (fn [{:keys [beanToJs rest]}]
            (let [spec (cond-> {}
                         beanToJs (assoc :bean-to-js true)
                         rest (assoc :rest true))]
              spec))
          params))))

(defn rest-index [params]
  (some (fn [[idx {:keys [rest]}]]
          (when rest idx))
        (map-indexed vector params)))

(defn select-primary-signature [signatures]
  (when (seq signatures)
    (apply max-key #(count (:parameters %)) signatures)))

(defn emit-method
  [{:keys [name documentation signatures]}
   iface-name]
  (let [{:keys [parameters]} (select-primary-signature signatures)
        specs (bean-specs parameters)
        rest-idx (rest-index parameters)
        fn-name (camel->kebab name)
        owner-prop (interface->target iface-name)
        js-prop (str ".-" name)]
    (str "\n"
         "(defn " fn-name "\n"
         (or (format-docstring documentation) "")
         "  [& args]\n"
         "  (let [owner  (.-" owner-prop " js/logseq)\n"
         "        method (" js-prop " owner)\n"
         "        specs  " (pr-str specs) "\n"
         "        rest-idx " (if (number? rest-idx) rest-idx "nil") "]\n"
         "    (call-proxy owner method specs rest-idx args)))\n")))

(defn emit-namespace
  [iface-name iface ns-prefix]
  (let [ns (interface->namespace iface-name ns-prefix)
        header (str ";; Auto-generated via `bb libs:generate-cljs-sdk`\n"
                    "(ns " ns "\n"
                    "  (:require [cljs-bean.core :as bean]))\n\n"
                    "(defn- convert-args [specs rest-idx args]\n"
                    "  (if (seq specs)\n"
                    "    (map-indexed\n"
                    "      (fn [idx arg]\n"
                    "        (let [spec (if (and rest-idx (>= idx rest-idx))\n"
                    "                       (nth specs rest-idx nil)\n"
                    "                       (nth specs idx nil))]\n"
                    "          (if (and spec (:bean-to-js spec))\n"
                    "            (bean/->js arg)\n"
                    "            arg)))\n"
                    "      args)\n"
                    "    args))\n\n"
                    "(defn- call-proxy [owner method specs rest-idx args]\n"
                    "  (when-not method\n"
                    "    (throw (js/Error. \"Missing method on logseq namespace\")))\n"
                    "  (let [converted (convert-args specs rest-idx args)]\n"
                    "    (.apply method owner (to-array (vec converted)))))\n")
        methods-str (->> (:methods iface)
                         (map #(emit-method % iface-name))
                         (apply str))]
    [ns (str header methods-str)]))

(defn namespace->file
  [out-dir ns]
  (let [parts (string/split ns #"\.")
        dir-parts (butlast parts)
        file-name (str (last parts) ".cljs")]
    (apply fs/path out-dir (concat dir-parts [file-name]))))

(defn ensure-schema!
  [schema-path]
  (when-not (fs/exists? schema-path)
    (throw (ex-info (str "Schema not found, run `yarn --cwd libs generate:schema` first: " schema-path)
                    {:schema schema-path}))))

(defn write-namespaces!
  [out-dir namespaces]
  (doseq [[ns content] namespaces]
    (let [file (namespace->file out-dir ns)]
      (fs/create-dirs (fs/parent file))
      (spit (str file) content)
      (println "Generated" (str file)))))

(defn generate!
  ([] (generate! {}))
  ([opts]
   (let [schema-path (fs/absolutize (or (:schema opts) default-schema))
         out-dir     (fs/absolutize (or (:out-dir opts) default-output-dir))
         ns-prefix   (or (:ns-prefix opts) default-ns-prefix)]
     (ensure-schema! schema-path)
     (let [schema (json/parse-string (slurp (str schema-path)) true)
           namespaces (map (fn [[iface-name iface]]
                             (emit-namespace (name iface-name) iface ns-prefix))
                           (:interfaces schema))]
       (fs/create-dirs out-dir)
       (write-namespaces! out-dir namespaces)
       out-dir))))

(defn -main
  [& args]
  (let [opts (parse-args args)]
    (generate! opts)))
