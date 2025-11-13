(ns logseq.libs.sdk-generator
  (:require [babashka.fs :as fs]
            [cheshire.core :as json]
            [clojure.string :as string]))

(def default-schema "libs/dist/logseq-sdk-schema.json")
(def default-output-dir "libs/cljs-sdk/src")
(def default-ns-prefix "com.logseq")
(def core-namespace "core")

(defn parse-args
  [args]
  (loop [opts {}
         tokens args]
    (if (empty? tokens)
      opts
      (let [[flag value & more] tokens]
        (case flag
          "--schema" (recur (assoc opts :schema value) more)
          "--out-dir" (recur (assoc opts :out-dir value) more)
          "--out" (recur (assoc opts :out-dir value) more)
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

(defn interface->namespace [ns-prefix iface-name]
  (str ns-prefix "." (camel->kebab (interface->target iface-name))))

(defn getter->interface-name [return-type]
  (some->> (re-find #"\.(I[A-Za-z0-9]+)" return-type)
           second))

(defn iface-key->string [k]
  (cond
    (string? k) k
    (keyword? k) (name k)
    :else (str k)))

(defn format-docstring [doc]
  (when (and doc (not (string/blank? doc)))
    (str "  " (pr-str doc) "\n")))

(defn param->info
  [{:keys [name optional rest rest?]}]
  (let [sym (camel->kebab name)]
    {:name name
     :sym sym
     :optional (boolean optional)
     :rest (boolean (or rest rest?))}))

(defn emit-rest-binding [{:keys [sym]}]
  (let [rest-var (str "rest-" sym)
        line (str "        " rest-var " (vec " sym ")\n")]
    {:binding line
     :var rest-var}))

(defn format-param-vector [params]
  (str "[" (string/join " " params) "]"))

(defn emit-method-body
  [method-name params {:keys [call]}]
  (let [rest-param (some #(when (:rest %) %) params)
        fixed-params (->> (if rest-param (vec (remove :rest params)) params)
                          (map :sym))
        {:keys [binding var]} (when rest-param (emit-rest-binding rest-param))
        rest-lines (if binding [binding] [])
        args-expr (if rest-param
                    (str "(into [" (string/join " " fixed-params) "] " var ")")
                    (str "[" (string/join " " fixed-params) "]"))]
    (str (format "  (let [method (aget api-proxy \"%s\")\n"  method-name)
         (apply str rest-lines)
         "        args " args-expr "]\n"
         "    (" call " api-proxy method args)))\n")))

(defn emit-optional-def
  [fn-name doc-str params impl-name helpers method-name]
  (let [required (take-while (complement :optional) params)
        total (count params)
        param-syms (map :sym params)
        arities (range (count required) (inc total))
        header (str "\n(defn " fn-name "\n"
                    (or doc-str ""))]
    (str "\n(defn- " impl-name "\n"
         "  " (format-param-vector param-syms) "\n"
         (emit-method-body method-name params helpers)
         header
         (apply str
                (map-indexed
                 (fn [idx arity]
                   (let [provided (take arity param-syms)
                         missing (- total arity)
                         call-args (concat provided (repeat missing "nil"))
                         param-vector (format-param-vector provided)
                         call-arg-str (string/join " " call-args)
                         call-arg-str (if (string/blank? call-arg-str) "" (str " " call-arg-str))]
                     (str "  (" param-vector "\n"
                          "   (" impl-name call-arg-str "))"
                          (when (not= (inc idx) (count arities))
                            "\n"))))
                 arities))
         ")\n")))

(defn emit-method
  [{:keys [name documentation signatures]}
   helpers]
  (let [{:keys [parameters]} (apply max-key #(count (:parameters %)) signatures)
        params (map param->info parameters)
        fn-name (camel->kebab name)
        doc-str (format-docstring documentation)
        rest-param (some #(when (:rest %) %) params)
        optional-params (filter :optional params)
        impl-name (str fn-name "-impl")
        method-body (emit-method-body name params helpers)]
    (when-not (string/starts-with? name "_") ; system methods
      (cond
        rest-param
        (let [fixed-syms (map :sym (vec (remove :rest params)))
              param-vector (format-param-vector (concat fixed-syms ["&" (:sym rest-param)]))]
          (str "\n(defn " fn-name "\n"
               (or doc-str "")
               "  " param-vector "\n"
               method-body))

        (seq optional-params)
        (emit-optional-def fn-name doc-str params impl-name helpers name)

        :else
        (let [param-vector (format-param-vector (map :sym params))]
          (str "\n(defn " fn-name "\n"
               (or doc-str "")
               "  " param-vector "\n"
               method-body))))))

(defn emit-core-namespace
  [ns-prefix {:keys [methods]}]
  (let [ns (str ns-prefix "." core-namespace)
        header (str ";; Auto-generated via `bb libs:generate-cljs-sdk`\n"
                    "(ns " ns "\n"
                    "  (:require [\"@logseq/libs\"]
            [cljs-bean.core :as bean]
            [com.logseq.util :as util]))\n\n"
                    "(defn- normalize-result [result]\n"
                    "  (if (instance? js/Promise result)\n"
                    "    (.then result (fn [value] (normalize-result value)))\n"
                    "    (util/->clj-tagged result)))\n\n"
                    "(defn call-method [owner method args]
  (when-not method
    (throw (js/Error. \"Missing method on logseq namespace\")))
  (normalize-result (.apply method owner (bean/->js args))))\n")
        helpers {:call "call-method"}
        owner "\n(def api-proxy js/logseq)\n"
        methods-str (->> methods
                         (map #(emit-method % helpers))
                         (apply str))]
    [ns (str header owner methods-str)]))

(defn emit-proxy-namespace
  [ns-prefix iface-name iface]
  (let [ns (interface->namespace ns-prefix iface-name)
        target (interface->target iface-name)
        owner-expr (format "(aget js/logseq \"%s\")" target)
        header (str ";; Auto-generated via `bb libs:generate-cljs-sdk`\n"
                    "(ns " ns "\n"
                    "  (:require [com.logseq.core :as core]))\n")
        helpers {:call "core/call-method"}
        owner (format "\n(def api-proxy %s)\n" owner-expr)
        methods-str (->> (:methods iface)
                         (map #(emit-method % helpers))
                         (apply str))]
    [ns (str header owner methods-str)]))

(defn namespace->file
  [out-dir ns]
  (let [parts (string/split ns #"\.")
        dir-parts (butlast parts)
        file-name (str (last parts) ".cljs")]
    (apply fs/path out-dir (concat dir-parts [file-name]))))

(defn ensure-schema! [schema-path]
  (when-not (fs/exists? schema-path)
    (throw (ex-info (str "Schema not found, run `yarn --cwd libs generate:schema` first: " schema-path)
                    {:schema schema-path}))))

(defn write-namespaces!
  [out-dir namespaces]
  (doseq [[ns content] namespaces]
    (when ns
      (let [file (namespace->file out-dir ns)]
        (fs/create-dirs (fs/parent file))
        (spit (str file) content)
        (println "Generated" (str file))))))

(defn run!
  ([] (run! {}))
  ([opts]
   (let [schema-path (fs/absolutize (or (:schema opts) default-schema))
         out-dir (fs/absolutize (or (:out-dir opts) default-output-dir))
         ns-prefix (or (:ns-prefix opts) default-ns-prefix)]
     (ensure-schema! schema-path)
     (let [schema (json/parse-string (slurp (str schema-path)) true)
           interfaces (:interfaces schema)
           ls-user (get-in schema [:classes :LSPluginUser])
           _ (when-not ls-user
               (throw (ex-info "Missing LSPluginUser metadata in schema" {:schema schema-path})))
           getters (:getters ls-user)
           proxy-names (->> getters
                            (keep #(some-> (getter->interface-name (:returnType %)) keyword))
                            (remove #{:IUtilsProxy})
                            distinct)
           proxies (for [iface-key proxy-names
                         :let [iface (get interfaces iface-key)]
                         :when iface]
                     (emit-proxy-namespace ns-prefix (iface-key->string iface-key) iface))
           core (emit-core-namespace ns-prefix ls-user)
           namespaces (cons core proxies)]
       (fs/create-dirs out-dir)
       (write-namespaces! out-dir namespaces)
       out-dir))))

(defn -main [& args]
  (let [opts (parse-args args)]
    (run! opts)))
