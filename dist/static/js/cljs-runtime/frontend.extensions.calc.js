goog.provide('frontend.extensions.calc');
var module$node_modules$bignumber_DOT_js$bignumber=shadow.js.require("module$node_modules$bignumber_DOT_js$bignumber", {});
frontend.extensions.calc.parse = instaparse.core.parser("<start> = assignment | expr | comment | directive\nexpr = add-sub [comment]\ncomment = <#'\\s*(#.*$)?'>\n<add-sub> = pow-term | mul-div | add | sub | variable\nadd = add-sub <'+'> mul-div\nsub = add-sub <'-'> mul-div\n<mul-div> = pow-term | mul | div | mod\nmul = mul-div <'*'> pow-term\ndiv = mul-div <'/'> pow-term\nmod = mul-div <'mod'> pow-term\n<pow-term> = pow | factorial | term\npow = posterm <'^'> pow-term\nfactorial = posterm <'!'> <#'\\s*'>\n<function> = log | ln | exp | sqrt | abs | sin | cos | tan | acos | asin | atan\nlog = <#'\\s*'> <'log('> expr <')'> <#'\\s*'>\nln = <#'\\s*'> <'ln('> expr <')'> <#'\\s*'>\nexp = <#'\\s*'> <'exp('> expr <')'> <#'\\s*'>\nsqrt = <#'\\s*'> <'sqrt('> expr <')'> <#'\\s*'>\nabs = <#'\\s*'> <'abs('> expr <')'> <#'\\s*'>\nsin = <#'\\s*'> <'sin('> expr <')'> <#'\\s*'>\ncos = <#'\\s*'> <'cos('> expr <')'> <#'\\s*'>\ntan = <#'\\s*'> <'tan('> expr <')'> <#'\\s*'>\natan = <#'\\s*'> <'atan('> expr <')'> <#'\\s*'>\nacos = <#'\\s*'> <'acos('> expr <')'> <#'\\s*'>\nasin = <#'\\s*'> <'asin('> expr <')'> <#'\\s*'>\n<posterm> = function | percent | scientific | number | mixed-number | variable | <#'\\s*'> <'('> expr <')'> <#'\\s*'>\nnegterm = <#'\\s*'> <'-'> ( posterm | pow | factorial )\n<term> = negterm | posterm\nscientific = #'\\s*[0-9]*\\.?[0-9]+(e|E)[\\-\\+]?[0-9]+()\\s*'\nnumber = decimal-number | hexadecimal-number | octal-number | binary-number\n<decimal-number> = #'\\s*(\\d+(,\\d+)*(\\.\\d*)?|\\d*\\.\\d+)\\s*'\n<hexadecimal-number> = #'\\s*0x([0-9a-fA-F]+(,[0-9a-fA-F]+)*(\\.[0-9a-fA-F]*)?|[0-9a-fA-F]*\\.[0-9a-fA-F]+)\\s*'\n<octal-number> = #'\\s*0o([0-7]+(,[0-7]+)*(\\.[0-7]*)?|[0-7]*\\.[0-7]+)\\s*'\n<binary-number> = #'\\s*0b([01]+(,[01]+)*(\\.[01]*)?|[01]*\\.[01]+)\\s*'\nmixed-number = <#'\\s*'> digits <#'\\s+'> digits <'/'> digits <#'\\s*'>\npercent = number <'%'> <#'\\s*'>\nvariable = #'\\s*_*[a-zA-Z]+[_a-zA-Z0-9]*\\s*'\ntoassign = #'\\s*_*[a-zA-Z]+[_a-zA-Z0-9]*\\s*'\nassignment = toassign <#'\\s*'> <'='> <#'\\s*'> expr\n<directive> = <#'\\s*\\:'> (format | base) <#'\\s*'> [comment]\n<format> = <#'(format|fmt)\\s+'> ( format-fix | format-sci | format-norm | format-frac | format-impf )\nformat-fix = <#'(?i)fix(ed)?\\s*'> digits\nformat-sci = <#'(?i)sci(entific)?\\s*'> [digits]\nformat-norm = <#'(?i)norm(al)?\\s*'> [digits]\nformat-frac = <#'(?i)frac(tions?)?\\s*'> [digits]\nformat-impf = <#'(?i)imp(roper)?\\s*'> [digits]\nbase = base-hex | base-dec | base-oct | base-bin\n<base-hex> = #'(?i)hex' <#'(?i)(adecimal)?'>\n<base-dec> = #'(?i)dec' <#'(?i)(imal)?'>\n<base-oct> = #'(?i)oct' <#'(?i)(al)?'>\n<base-bin> = #'(?i)bin' <#'(?i)(ary)?'>\ndigits = #'\\d+'");
frontend.extensions.calc.constants = new cljs.core.PersistentArrayMap(null, 2, ["PI",module$node_modules$bignumber_DOT_js$bignumber.BigNumber("3.14159265358979323846"),"E",module$node_modules$bignumber_DOT_js$bignumber.BigNumber("2.71828182845904523536")], null);
frontend.extensions.calc.exception_QMARK_ = (function frontend$extensions$calc$exception_QMARK_(e){
return (e instanceof Error);
});
frontend.extensions.calc.failure_QMARK_ = (function frontend$extensions$calc$failure_QMARK_(v){
return ((instaparse.core.failure_QMARK_(v)) || (frontend.extensions.calc.exception_QMARK_(v)));
});
frontend.extensions.calc.new_env = (function frontend$extensions$calc$new_env(){
return cljs.core.atom.cljs$core$IFn$_invoke$arity$1(cljs.core.PersistentArrayMap.EMPTY);
});
frontend.extensions.calc.factorial = (function frontend$extensions$calc$factorial(n){
return cljs.core.reduce.cljs$core$IFn$_invoke$arity$3((function (a,b){
return a.multipliedBy(b);
}),module$node_modules$bignumber_DOT_js$bignumber.BigNumber((1)),cljs.core.range.cljs$core$IFn$_invoke$arity$2((2),(n + (1))));
});
frontend.extensions.calc.eval_STAR_ = (function frontend$extensions$calc$eval_STAR_(env,ast){
var G__131884 = cljs.core.PersistentHashMap.fromArrays([new cljs.core.Keyword(null,"atan","atan",1627885634),new cljs.core.Keyword(null,"format-frac","format-frac",-765976701),new cljs.core.Keyword(null,"cos","cos",1201758276),new cljs.core.Keyword(null,"variable","variable",-281346492),new cljs.core.Keyword(null,"tan","tan",1273609893),new cljs.core.Keyword(null,"number","number",1570378438),new cljs.core.Keyword(null,"sub","sub",-2093760025),new cljs.core.Keyword(null,"sqrt","sqrt",-1270051929),new cljs.core.Keyword(null,"factorial","factorial",-1512755480),new cljs.core.Keyword(null,"ln","ln",1974894440),new cljs.core.Keyword(null,"mod","mod",-130487320),new cljs.core.Keyword(null,"pow","pow",-1444004567),new cljs.core.Keyword(null,"exp","exp",-261706262),new cljs.core.Keyword(null,"digits","digits",-1134635061),new cljs.core.Keyword(null,"scientific","scientific",316285837),new cljs.core.Keyword(null,"asin","asin",1750305199),new cljs.core.Keyword(null,"div","div",1057191632),new cljs.core.Keyword(null,"format-sci","format-sci",-2145290447),new cljs.core.Keyword(null,"mul","mul",-354626062),new cljs.core.Keyword(null,"expr","expr",745722291),new cljs.core.Keyword(null,"abs","abs",-246026477),new cljs.core.Keyword(null,"comment","comment",532206069),new cljs.core.Keyword(null,"sin","sin",80907862),new cljs.core.Keyword(null,"assignment","assignment",1330426519),new cljs.core.Keyword(null,"mixed-number","mixed-number",1075063896),new cljs.core.Keyword(null,"percent","percent",2031453817),new cljs.core.Keyword(null,"format-impf","format-impf",2004346266),new cljs.core.Keyword(null,"toassign","toassign",508353274),new cljs.core.Keyword(null,"format-norm","format-norm",1732180794),new cljs.core.Keyword(null,"base","base",185279322),new cljs.core.Keyword(null,"add","add",235287739),new cljs.core.Keyword(null,"format-fix","format-fix",561277115),new cljs.core.Keyword(null,"negterm","negterm",46693211),new cljs.core.Keyword(null,"acos","acos",-1286789764),new cljs.core.Keyword(null,"log","log",-1595516004)],[(function frontend$extensions$calc$eval_STAR__$_atan(a){
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(Math.atan(a));
}),(function frontend$extensions$calc$eval_STAR__$_format(max_denominator){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(env,cljs.core.dissoc,new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"improper","improper",-499495828));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(env,cljs.core.assoc,new cljs.core.Keyword(null,"mode","mode",654403691),"frac",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"max-denominator","max-denominator",1539997685),max_denominator], 0));

return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),"last");
}),(function frontend$extensions$calc$eval_STAR__$_cos(a){
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(Math.cos(a));
}),(function frontend$extensions$calc$eval_STAR__$_resolve(var$){
var var$__$1 = clojure.string.trim(var$);
var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(frontend.extensions.calc.constants,var$__$1);
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var or__5002__auto____$1 = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),var$__$1);
if(cljs.core.truth_(or__5002__auto____$1)){
return or__5002__auto____$1;
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("Can't find variable %s",var$__$1) : frontend.util.format.call(null,"Can't find variable %s",var$__$1)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"var","var",-769682797),var$__$1], null));
}
}
}),(function frontend$extensions$calc$eval_STAR__$_tan(a){
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(Math.tan(a));
}),cljs.core.comp.cljs$core$IFn$_invoke$arity$2(module$node_modules$bignumber_DOT_js$bignumber.BigNumber,(function (p1__131883_SHARP_){
return clojure.string.replace(p1__131883_SHARP_,",","");
})),(function frontend$extensions$calc$eval_STAR__$_sub(a,b){
return a.minus(b);
}),(function frontend$extensions$calc$eval_STAR__$_sqrt(a){
return a.sqrt();
}),(function frontend$extensions$calc$eval_STAR__$_fact(a){
if(cljs.core.truth_((function (){var and__5000__auto__ = a.isInteger();
if(cljs.core.truth_(and__5000__auto__)){
var and__5000__auto____$1 = a.isPositive();
if(cljs.core.truth_(and__5000__auto____$1)){
return a.isLessThan((254));
} else {
return and__5000__auto____$1;
}
} else {
return and__5000__auto__;
}
})())){
return frontend.extensions.calc.factorial(a.toNumber());
} else {
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(new cljs.core.Symbol(null,"NaN'","NaN'",-1496513810,null));
}
}),(function frontend$extensions$calc$eval_STAR__$_ln(a){
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(Math.log(a));
}),(function frontend$extensions$calc$eval_STAR__$_mod(a,b){
return a.modulo(b);
}),(function frontend$extensions$calc$eval_STAR__$_pow(a,b){
if(cljs.core.truth_(b.isInteger())){
return a.exponentiatedBy(b);
} else {
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(Math.pow(a,b));
}
}),(function frontend$extensions$calc$eval_STAR__$_exp(a){
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(Math.exp(a));
}),cljs.core.int$,module$node_modules$bignumber_DOT_js$bignumber.BigNumber,(function frontend$extensions$calc$eval_STAR__$_asin(a){
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(Math.asin(a));
}),(function frontend$extensions$calc$eval_STAR__$_div(a,b){
return a.dividedBy(b);
}),(function frontend$extensions$calc$eval_STAR__$_format(places){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(env,cljs.core.assoc,new cljs.core.Keyword(null,"mode","mode",654403691),"sci",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"places","places",1043491706),places], 0));

return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),"last");
}),(function frontend$extensions$calc$eval_STAR__$_mul(a,b){
return a.multipliedBy(b);
}),cljs.core.identity,(function frontend$extensions$calc$eval_STAR__$_abs(a){
return a.abs();
}),cljs.core.constantly(null),(function frontend$extensions$calc$eval_STAR__$_sin(a){
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(Math.sin(a));
}),(function frontend$extensions$calc$eval_STAR__$_assign_BANG_(var$,val){
if(cljs.core.contains_QMARK_(frontend.extensions.calc.constants,var$)){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2((frontend.util.format.cljs$core$IFn$_invoke$arity$2 ? frontend.util.format.cljs$core$IFn$_invoke$arity$2("Can't redefine constant %s",var$) : frontend.util.format.call(null,"Can't redefine constant %s",var$)),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"var","var",-769682797),var$], null));
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(env,cljs.core.assoc,var$,val);
}

return val;
}),(function (whole,numerator,denominator){
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(numerator).dividedBy(denominator).plus(whole);
}),(function frontend$extensions$calc$eval_STAR__$_percent(a){
return a.dividedBy(100.0);
}),(function frontend$extensions$calc$eval_STAR__$_format(max_denominator){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(env,cljs.core.assoc,new cljs.core.Keyword(null,"mode","mode",654403691),"frac",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"max-denominator","max-denominator",1539997685),max_denominator,new cljs.core.Keyword(null,"improper","improper",-499495828),true], 0));

return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),"last");
}),clojure.string.trim,(function frontend$extensions$calc$eval_STAR__$_format(precision){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(env,cljs.core.dissoc,new cljs.core.Keyword(null,"mode","mode",654403691),new cljs.core.Keyword(null,"places","places",1043491706));

cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(env,cljs.core.assoc,new cljs.core.Keyword(null,"precision","precision",-1175707478),precision);

return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),"last");
}),(function frontend$extensions$calc$eval_STAR__$_base(b){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(env,cljs.core.assoc,new cljs.core.Keyword(null,"base","base",185279322),clojure.string.lower_case(b));

return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),"last");
}),(function frontend$extensions$calc$eval_STAR__$_add(a,b){
return a.plus(b);
}),(function frontend$extensions$calc$eval_STAR__$_format(places){
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$variadic(env,cljs.core.assoc,new cljs.core.Keyword(null,"mode","mode",654403691),"fix",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([new cljs.core.Keyword(null,"places","places",1043491706),places], 0));

return cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),"last");
}),(function frontend$extensions$calc$eval_STAR__$_neg(a){
return a.negated();
}),(function frontend$extensions$calc$eval_STAR__$_acos(a){
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(Math.acos(a));
}),(function frontend$extensions$calc$eval_STAR__$_log(a){
return module$node_modules$bignumber_DOT_js$bignumber.BigNumber(Math.log10(a));
})]);
var G__131885 = ast;
return (instaparse.core.transform.cljs$core$IFn$_invoke$arity$2 ? instaparse.core.transform.cljs$core$IFn$_invoke$arity$2(G__131884,G__131885) : instaparse.core.transform.call(null,G__131884,G__131885));
});
frontend.extensions.calc.eval = (function frontend$extensions$calc$eval(var_args){
var G__131887 = arguments.length;
switch (G__131887) {
case 1:
return frontend.extensions.calc.eval.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return frontend.extensions.calc.eval.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(frontend.extensions.calc.eval.cljs$core$IFn$_invoke$arity$1 = (function (ast){
return frontend.extensions.calc.eval.cljs$core$IFn$_invoke$arity$2(frontend.extensions.calc.new_env(),ast);
}));

(frontend.extensions.calc.eval.cljs$core$IFn$_invoke$arity$2 = (function (env,ast){
try{if(frontend.extensions.calc.failure_QMARK_(ast)){
return ast;
} else {
return cljs.core.first(frontend.extensions.calc.eval_STAR_(env,ast));
}
}catch (e131888){if((e131888 instanceof Error)){
var e = e131888;
return e;
} else {
throw e131888;

}
}}));

(frontend.extensions.calc.eval.cljs$lang$maxFixedArity = 2);

frontend.extensions.calc.assign_last_value = (function frontend$extensions$calc$assign_last_value(env,val){
if((val == null)){
} else {
cljs.core.swap_BANG_.cljs$core$IFn$_invoke$arity$4(env,cljs.core.assoc,"last",val);
}

return val;
});
/**
 * Check that number can render without loss of all significant digits,
 * and that the absolute value is less than 1e21.
 */
frontend.extensions.calc.can_fix_QMARK_ = (function frontend$extensions$calc$can_fix_QMARK_(num_SINGLEQUOTE_,places){
var or__5002__auto__ = num_SINGLEQUOTE_.isZero();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
var mag = num_SINGLEQUOTE_.abs();
var lower_bound = module$node_modules$bignumber_DOT_js$bignumber.BigNumber(0.5).shiftedBy((- places));
var upper_bound = module$node_modules$bignumber_DOT_js$bignumber.BigNumber(1.0E21);
var and__5000__auto__ = mag.isGreaterThanOrEqualTo(lower_bound);
if(cljs.core.truth_(and__5000__auto__)){
return mag.isLessThan(upper_bound);
} else {
return and__5000__auto__;
}
}
});
/**
 * Check that number can render normally within the given number of digits.
 * Tolerance allows for leading zeros in a decimal fraction.
 */
frontend.extensions.calc.can_fit_QMARK_ = (function frontend$extensions$calc$can_fit_QMARK_(num_SINGLEQUOTE_,digits,tolerance){
var and__5000__auto__ = (num_SINGLEQUOTE_.e < digits);
if(and__5000__auto__){
return num_SINGLEQUOTE_.shiftedBy((tolerance + digits)).isInteger();
} else {
return and__5000__auto__;
}
});
frontend.extensions.calc.format_base = (function frontend$extensions$calc$format_base(val,base){
var sign = val.s;
var display_val = ((cljs.core.neg_int_QMARK_(sign))?val.abs():val);
return [((cljs.core.neg_int_QMARK_(sign))?"-":null),cljs.core.str.cljs$core$IFn$_invoke$arity$1((function (){var G__131890 = base;
switch (G__131890) {
case (2):
return "0b";

break;
case (8):
return "0o";

break;
case (16):
return "0x";

break;
default:
throw (new Error(["No matching clause: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(G__131890)].join('')));

}
})()),cljs.core.str.cljs$core$IFn$_invoke$arity$1(display_val.toString(base))].join('');
});
frontend.extensions.calc.format_fraction = (function frontend$extensions$calc$format_fraction(numerator,denominator,improper){
var whole = numerator.dividedToIntegerBy(denominator);
if(cljs.core.truth_((function (){var or__5002__auto__ = improper;
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return whole.isZero();
}
})())){
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(numerator),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(denominator)].join('');
} else {
return [cljs.core.str.cljs$core$IFn$_invoke$arity$1(whole)," ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(numerator.modulo(denominator).abs()),"/",cljs.core.str.cljs$core$IFn$_invoke$arity$1(denominator)].join('');
}
});
frontend.extensions.calc.format_normal = (function frontend$extensions$calc$format_normal(env,val){
var precision = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),new cljs.core.Keyword(null,"precision","precision",-1175707478));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (21);
}
})();
var display_val = val.precision(precision);
if(cljs.core.truth_(frontend.extensions.calc.can_fit_QMARK_(display_val,precision,(1)))){
return display_val.toFixed();
} else {
return display_val.toExponential();
}
});
frontend.extensions.calc.format_val = (function frontend$extensions$calc$format_val(env,val){
if((val instanceof module$node_modules$bignumber_DOT_js$bignumber.BigNumber)){
var mode = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),new cljs.core.Keyword(null,"mode","mode",654403691));
var base = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),new cljs.core.Keyword(null,"base","base",185279322));
var places = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),new cljs.core.Keyword(null,"places","places",1043491706));
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(base,"hex")){
return frontend.extensions.calc.format_base(val,(16));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(base,"oct")){
return frontend.extensions.calc.format_base(val,(8));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(base,"bin")){
return frontend.extensions.calc.format_base(val,(2));
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,"fix")){
if(cljs.core.truth_(frontend.extensions.calc.can_fix_QMARK_(val,places))){
return val.toFixed(places);
} else {
return val.toExponential(places);
}
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,"sci")){
return val.toExponential(places);
} else {
if(cljs.core._EQ_.cljs$core$IFn$_invoke$arity$2(mode,"frac")){
var max_denominator = (function (){var or__5002__auto__ = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),new cljs.core.Keyword(null,"max-denominator","max-denominator",1539997685));
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (4095);
}
})();
var improper = cljs.core.get.cljs$core$IFn$_invoke$arity$2(cljs.core.deref(env),new cljs.core.Keyword(null,"improper","improper",-499495828));
var vec__131891 = val.toFraction(max_denominator);
var numerator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131891,(0),null);
var denominator = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131891,(1),null);
var delta = numerator.dividedBy(denominator).minus(val);
if(cljs.core.truth_((function (){var or__5002__auto__ = delta.isZero();
if(cljs.core.truth_(or__5002__auto__)){
return or__5002__auto__;
} else {
return (delta.e < (-16));
}
})())){
if((denominator > (1))){
return frontend.extensions.calc.format_fraction(numerator,denominator,improper);
} else {
return frontend.extensions.calc.format_normal(env,numerator);
}
} else {
return frontend.extensions.calc.format_normal(env,val);
}
} else {
return frontend.extensions.calc.format_normal(env,val);

}
}
}
}
}
}
} else {
return val;
}
});
frontend.extensions.calc.eval_lines = (function frontend$extensions$calc$eval_lines(s){
if(typeof s === 'string'){
} else {
throw (new Error("Assert failed: (string? s)"));
}

var env = frontend.extensions.calc.new_env();
return cljs.core.mapv.cljs$core$IFn$_invoke$arity$2((function (line){
if(clojure.string.blank_QMARK_(line)){
return null;
} else {
return frontend.extensions.calc.format_val(env,frontend.extensions.calc.assign_last_value(env,frontend.extensions.calc.eval.cljs$core$IFn$_invoke$arity$2(env,(frontend.extensions.calc.parse.cljs$core$IFn$_invoke$arity$1 ? frontend.extensions.calc.parse.cljs$core$IFn$_invoke$arity$1(line) : frontend.extensions.calc.parse.call(null,line)))));
}
}),clojure.string.split_lines(s));
});
frontend.extensions.calc.results = rum.core.lazy_build(rum.core.build_defc,(function (calc_atom){
return daiquiri.interpreter.interpret((function (){var temp__5804__auto__ = rum.core.react(calc_atom);
if(cljs.core.truth_(temp__5804__auto__)){
var output_lines = temp__5804__auto__;
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.extensions__code-calc.pr-2","div.extensions__code-calc.pr-2",680901470),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"on-pointer-down","on-pointer-down",573334138),(function (e){
return e.stopPropagation();
})], null),(function (){var iter__5480__auto__ = (function frontend$extensions$calc$iter__131904(s__131905){
return (new cljs.core.LazySeq(null,(function (){
var s__131905__$1 = s__131905;
while(true){
var temp__5804__auto____$1 = cljs.core.seq(s__131905__$1);
if(temp__5804__auto____$1){
var s__131905__$2 = temp__5804__auto____$1;
if(cljs.core.chunked_seq_QMARK_(s__131905__$2)){
var c__5478__auto__ = cljs.core.chunk_first(s__131905__$2);
var size__5479__auto__ = cljs.core.count(c__5478__auto__);
var b__131907 = cljs.core.chunk_buffer(size__5479__auto__);
if((function (){var i__131906 = (0);
while(true){
if((i__131906 < size__5479__auto__)){
var vec__131908 = cljs.core._nth(c__5478__auto__,i__131906);
var i = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131908,(0),null);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131908,(1),null);
cljs.core.chunk_append(b__131907,new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.extensions__code-calc-output-line.CodeMirror-line","div.extensions__code-calc-output-line.CodeMirror-line",-293396137),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),i], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(((line == null))?"":((frontend.extensions.calc.failure_QMARK_(line))?"?":cljs.core.str.cljs$core$IFn$_invoke$arity$1(line)
))], null)], null));

var G__131916 = (i__131906 + (1));
i__131906 = G__131916;
continue;
} else {
return true;
}
break;
}
})()){
return cljs.core.chunk_cons(cljs.core.chunk(b__131907),frontend$extensions$calc$iter__131904(cljs.core.chunk_rest(s__131905__$2)));
} else {
return cljs.core.chunk_cons(cljs.core.chunk(b__131907),null);
}
} else {
var vec__131911 = cljs.core.first(s__131905__$2);
var i = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131911,(0),null);
var line = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__131911,(1),null);
return cljs.core.cons(new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"div.extensions__code-calc-output-line.CodeMirror-line","div.extensions__code-calc-output-line.CodeMirror-line",-293396137),new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"key","key",-1516042587),i], null),new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [new cljs.core.Keyword(null,"span","span",1394872991),(((line == null))?"":((frontend.extensions.calc.failure_QMARK_(line))?"?":cljs.core.str.cljs$core$IFn$_invoke$arity$1(line)
))], null)], null),frontend$extensions$calc$iter__131904(cljs.core.rest(s__131905__$2)));
}
} else {
return null;
}
break;
}
}),null,null));
});
return iter__5480__auto__(cljs.core.map_indexed.cljs$core$IFn$_invoke$arity$2(cljs.core.vector,output_lines));
})()], null);
} else {
return null;
}
})());
}),new cljs.core.PersistentVector(null, 1, 5, cljs.core.PersistentVector.EMPTY_NODE, [rum.core.reactive], null),"frontend.extensions.calc/results");

//# sourceMappingURL=frontend.extensions.calc.js.map
