goog.provide('cljc.java_time.format.date_time_formatter');
goog.scope(function(){
  cljc.java_time.format.date_time_formatter.goog$module$goog$object = goog.module.get('goog.object');
});
cljc.java_time.format.date_time_formatter.iso_local_time = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_LOCAL_TIME");
cljc.java_time.format.date_time_formatter.iso_ordinal_date = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_ORDINAL_DATE");
cljc.java_time.format.date_time_formatter.iso_offset_date = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_OFFSET_DATE");
cljc.java_time.format.date_time_formatter.iso_time = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_TIME");
cljc.java_time.format.date_time_formatter.iso_local_date_time = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_LOCAL_DATE_TIME");
cljc.java_time.format.date_time_formatter.iso_instant = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_INSTANT");
cljc.java_time.format.date_time_formatter.rfc_1123_date_time = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"RFC_1123_DATE_TIME");
cljc.java_time.format.date_time_formatter.iso_date = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_DATE");
cljc.java_time.format.date_time_formatter.iso_week_date = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_WEEK_DATE");
cljc.java_time.format.date_time_formatter.iso_offset_time = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_OFFSET_TIME");
cljc.java_time.format.date_time_formatter.iso_local_date = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_LOCAL_DATE");
cljc.java_time.format.date_time_formatter.iso_zoned_date_time = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_ZONED_DATE_TIME");
cljc.java_time.format.date_time_formatter.iso_offset_date_time = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_OFFSET_DATE_TIME");
cljc.java_time.format.date_time_formatter.iso_date_time = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"ISO_DATE_TIME");
cljc.java_time.format.date_time_formatter.basic_iso_date = cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(java.time.format.DateTimeFormatter,"BASIC_ISO_DATE");
cljc.java_time.format.date_time_formatter.of_pattern = (function cljc$java_time$format$date_time_formatter$of_pattern(var_args){
var G__120989 = arguments.length;
switch (G__120989) {
case 1:
return cljc.java_time.format.date_time_formatter.of_pattern.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljc.java_time.format.date_time_formatter.of_pattern.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.format.date_time_formatter.of_pattern.cljs$core$IFn$_invoke$arity$1 = (function (java_lang_String15920){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.format.DateTimeFormatter,"ofPattern",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_String15920], 0));
}));

(cljc.java_time.format.date_time_formatter.of_pattern.cljs$core$IFn$_invoke$arity$2 = (function (java_lang_String15921,java_util_Locale15922){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.format.DateTimeFormatter,"ofPattern",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_lang_String15921,java_util_Locale15922], 0));
}));

(cljc.java_time.format.date_time_formatter.of_pattern.cljs$lang$maxFixedArity = 2);

cljc.java_time.format.date_time_formatter.parse_best = (function cljc$java_time$format$date_time_formatter$parse_best(this15923,java_lang_CharSequence15924,java_time_temporal_TemporalQuery_array15925){
return this15923.parseBest(java_lang_CharSequence15924,java_time_temporal_TemporalQuery_array15925);
});
cljc.java_time.format.date_time_formatter.format_to = (function cljc$java_time$format$date_time_formatter$format_to(this15926,java_time_temporal_TemporalAccessor15927,java_lang_Appendable15928){
return this15926.formatTo(java_time_temporal_TemporalAccessor15927,java_lang_Appendable15928);
});
cljc.java_time.format.date_time_formatter.get_decimal_style = (function cljc$java_time$format$date_time_formatter$get_decimal_style(this15929){
return this15929.decimalStyle();
});
cljc.java_time.format.date_time_formatter.with_chronology = (function cljc$java_time$format$date_time_formatter$with_chronology(this15930,java_time_chrono_Chronology15931){
return this15930.withChronology(java_time_chrono_Chronology15931);
});
cljc.java_time.format.date_time_formatter.get_resolver_style = (function cljc$java_time$format$date_time_formatter$get_resolver_style(this15932){
return this15932.resolverStyle();
});
cljc.java_time.format.date_time_formatter.with_decimal_style = (function cljc$java_time$format$date_time_formatter$with_decimal_style(this15933,java_time_format_DecimalStyle15934){
return this15933.withDecimalStyle(java_time_format_DecimalStyle15934);
});
cljc.java_time.format.date_time_formatter.get_locale = (function cljc$java_time$format$date_time_formatter$get_locale(this15935){
return this15935.locale();
});
cljc.java_time.format.date_time_formatter.to_string = (function cljc$java_time$format$date_time_formatter$to_string(this15936){
return this15936.toString();
});
cljc.java_time.format.date_time_formatter.parsed_leap_second = (function cljc$java_time$format$date_time_formatter$parsed_leap_second(){
return cljs.core.js_invoke(java.time.format.DateTimeFormatter,"parsedLeapSecond");
});
cljc.java_time.format.date_time_formatter.with_zone = (function cljc$java_time$format$date_time_formatter$with_zone(this15937,java_time_ZoneId15938){
return this15937.withZone(java_time_ZoneId15938);
});
cljc.java_time.format.date_time_formatter.parsed_excess_days = (function cljc$java_time$format$date_time_formatter$parsed_excess_days(){
return cljs.core.js_invoke(java.time.format.DateTimeFormatter,"parsedExcessDays");
});
cljc.java_time.format.date_time_formatter.get_zone = (function cljc$java_time$format$date_time_formatter$get_zone(this15939){
return this15939.zone();
});
cljc.java_time.format.date_time_formatter.of_localized_date_time = (function cljc$java_time$format$date_time_formatter$of_localized_date_time(var_args){
var G__120991 = arguments.length;
switch (G__120991) {
case 1:
return cljc.java_time.format.date_time_formatter.of_localized_date_time.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljc.java_time.format.date_time_formatter.of_localized_date_time.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.format.date_time_formatter.of_localized_date_time.cljs$core$IFn$_invoke$arity$1 = (function (java_time_format_FormatStyle15940){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.format.DateTimeFormatter,"ofLocalizedDateTime",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_format_FormatStyle15940], 0));
}));

(cljc.java_time.format.date_time_formatter.of_localized_date_time.cljs$core$IFn$_invoke$arity$2 = (function (java_time_format_FormatStyle15941,java_time_format_FormatStyle15942){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.format.DateTimeFormatter,"ofLocalizedDateTime",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_format_FormatStyle15941,java_time_format_FormatStyle15942], 0));
}));

(cljc.java_time.format.date_time_formatter.of_localized_date_time.cljs$lang$maxFixedArity = 2);

cljc.java_time.format.date_time_formatter.get_resolver_fields = (function cljc$java_time$format$date_time_formatter$get_resolver_fields(this15943){
return this15943.resolverFields();
});
cljc.java_time.format.date_time_formatter.get_chronology = (function cljc$java_time$format$date_time_formatter$get_chronology(this15944){
return this15944.chronology();
});
cljc.java_time.format.date_time_formatter.parse = (function cljc$java_time$format$date_time_formatter$parse(var_args){
var G__120993 = arguments.length;
switch (G__120993) {
case 3:
return cljc.java_time.format.date_time_formatter.parse.cljs$core$IFn$_invoke$arity$3((arguments[(0)]),(arguments[(1)]),(arguments[(2)]));

break;
case 2:
return cljc.java_time.format.date_time_formatter.parse.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.format.date_time_formatter.parse.cljs$core$IFn$_invoke$arity$3 = (function (this15945,G__15946,G__15947){
return this15945.parse(G__15946,G__15947);
}));

(cljc.java_time.format.date_time_formatter.parse.cljs$core$IFn$_invoke$arity$2 = (function (this15948,java_lang_CharSequence15949){
return this15948.parse(java_lang_CharSequence15949);
}));

(cljc.java_time.format.date_time_formatter.parse.cljs$lang$maxFixedArity = 3);

cljc.java_time.format.date_time_formatter.with_locale = (function cljc$java_time$format$date_time_formatter$with_locale(this15950,java_util_Locale15951){
return this15950.withLocale(java_util_Locale15951);
});
cljc.java_time.format.date_time_formatter.with_resolver_fields = (function cljc$java_time$format$date_time_formatter$with_resolver_fields(this15952,G__15953){
return this15952.withResolverFields(G__15953);
});
cljc.java_time.format.date_time_formatter.parse_unresolved = (function cljc$java_time$format$date_time_formatter$parse_unresolved(this15954,java_lang_CharSequence15955,java_text_ParsePosition15956){
return this15954.parseUnresolved(java_lang_CharSequence15955,java_text_ParsePosition15956);
});
cljc.java_time.format.date_time_formatter.of_localized_time = (function cljc$java_time$format$date_time_formatter$of_localized_time(java_time_format_FormatStyle15957){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.format.DateTimeFormatter,"ofLocalizedTime",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_format_FormatStyle15957], 0));
});
cljc.java_time.format.date_time_formatter.of_localized_date = (function cljc$java_time$format$date_time_formatter$of_localized_date(java_time_format_FormatStyle15958){
return cljs.core.js_invoke.cljs$core$IFn$_invoke$arity$variadic(java.time.format.DateTimeFormatter,"ofLocalizedDate",cljs.core.prim_seq.cljs$core$IFn$_invoke$arity$2([java_time_format_FormatStyle15958], 0));
});
cljc.java_time.format.date_time_formatter.format = (function cljc$java_time$format$date_time_formatter$format(this15959,java_time_temporal_TemporalAccessor15960){
try{return this15959.format(java_time_temporal_TemporalAccessor15960);
}catch (e120994){if((e120994 instanceof Error)){
var e__120768__auto__ = e120994;
throw (new Error(["Hi there! - It looks like you might be trying to do something with a java.time.Instant that would require it to be 'calendar-aware',\n   but in fact Instant has no facility with working with years, months, days etc. Think of it as just \n   a milli/nanosecond offset from the UNIX epoch.\n   \n   To get around this, consider converting the Instant to a \n   ZonedDateTime first or for formatting/parsing specifically, you might add a zone to your formatter.\n    see https://stackoverflow.com/a/27483371/1700930. \n    \n    You can disable these custom exceptions by setting -Dcljc.java-time.disable-helpful-exception-messages=true","\n original message ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(e__120768__auto__,"message")),"\n cause of exception: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(cljc.java_time.format.date_time_formatter.goog$module$goog$object.get(e__120768__auto__,"stack"))].join('')));
} else {
throw e120994;

}
}});
cljc.java_time.format.date_time_formatter.to_format = (function cljc$java_time$format$date_time_formatter$to_format(var_args){
var G__120996 = arguments.length;
switch (G__120996) {
case 1:
return cljc.java_time.format.date_time_formatter.to_format.cljs$core$IFn$_invoke$arity$1((arguments[(0)]));

break;
case 2:
return cljc.java_time.format.date_time_formatter.to_format.cljs$core$IFn$_invoke$arity$2((arguments[(0)]),(arguments[(1)]));

break;
default:
throw (new Error(["Invalid arity: ",cljs.core.str.cljs$core$IFn$_invoke$arity$1(arguments.length)].join('')));

}
});

(cljc.java_time.format.date_time_formatter.to_format.cljs$core$IFn$_invoke$arity$1 = (function (this15961){
return this15961.toFormat();
}));

(cljc.java_time.format.date_time_formatter.to_format.cljs$core$IFn$_invoke$arity$2 = (function (this15962,java_time_temporal_TemporalQuery15963){
return this15962.toFormat(java_time_temporal_TemporalQuery15963);
}));

(cljc.java_time.format.date_time_formatter.to_format.cljs$lang$maxFixedArity = 2);

cljc.java_time.format.date_time_formatter.with_resolver_style = (function cljc$java_time$format$date_time_formatter$with_resolver_style(this15964,java_time_format_ResolverStyle15965){
return this15964.withResolverStyle(java_time_format_ResolverStyle15965);
});

//# sourceMappingURL=cljc.java_time.format.date_time_formatter.js.map
