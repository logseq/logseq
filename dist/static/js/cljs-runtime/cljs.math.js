goog.provide('cljs.math');
/**
 * Constant for Euler's number e, the base for natural logarithms.
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/E
 */
cljs.math.E = Math.E;
/**
 * Constant for pi, the ratio of the circumference of a circle to its diameter.
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/PI
 */
cljs.math.PI = Math.PI;
/**
 * Constant used to convert an angular value in degrees to the equivalent in radians
 */
cljs.math.DEGREES_TO_RADIANS = 0.017453292519943295;
/**
 * Constant used to convert an angular value in radians to the equivalent in degrees
 */
cljs.math.RADIANS_TO_DEGREES = 57.29577951308232;
cljs.math.TWO_TO_THE_52 = (4503599627370496);
cljs.math.SIGNIFICAND_WIDTH32 = (21);
cljs.math.EXP_BIAS = (1023);
cljs.math.EXP_BITMASK32 = (2146435072);
cljs.math.EXP_MAX = (1023);
cljs.math.EXP_MIN = (-1022);
/**
 * Tests the platform for endianness. Returns true when little-endian, false otherwise.
 */
cljs.math.get_little_endian = (function cljs$math$get_little_endian(){
var a = (new ArrayBuffer((4)));
var i = (new Uint32Array(a));
var b = (new Uint8Array(a));
(i[(0)] = (857870592));

return ((b[(0)]) === (0));
});
if((typeof cljs !== 'undefined') && (typeof cljs.math !== 'undefined') && (typeof cljs.math.little_endian_QMARK_ !== 'undefined')){
} else {
cljs.math.little_endian_QMARK_ = cljs.math.get_little_endian();
}
/**
 * offset of hi integers in 64-bit values
 */
cljs.math.HI = ((cljs.math.little_endian_QMARK_)?(1):(0));
/**
 * offset of hi integers in 64-bit values
 */
cljs.math.LO = ((1) - cljs.math.HI);
cljs.math.INT32_MASK = (4294967295);
cljs.math.INT32_NON_SIGN_BIT = (2147483648);
cljs.math.INT32_NON_SIGN_BITS = (2147483647);
/**
 * unsigned less-than comparator for 32-bit values
 */
cljs.math.u_LT_ = (function cljs$math$u_LT_(a,b){
var ab = (a >>> (28));
var bb = (b >>> (28));
return (((ab < bb)) || ((((ab === bb)) && (((a & (268435455)) < (b & (268435455)))))));
});
/**
 * Returns the sine of an angle.
 *   If a is ##NaN, ##-Inf, ##Inf => ##NaN
 *   If a is zero => zero with the same sign as a
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sin
 */
cljs.math.sin = (function cljs$math$sin(a){
return Math.sin(a);
});
/**
 * Returns the cosine of an angle.
 *   If a is ##NaN, ##-Inf, ##Inf => ##NaN
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cos
 */
cljs.math.cos = (function cljs$math$cos(a){
return Math.cos(a);
});
/**
 * Returns the tangent of an angle.
 *   If a is ##NaN, ##-Inf, ##Inf => ##NaN
 *   If a is zero => zero with the same sign as a
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/tan
 */
cljs.math.tan = (function cljs$math$tan(a){
return Math.tan(a);
});
/**
 * Returns the arc sine of an angle, in the range -pi/2 to pi/2.
 *   If a is ##NaN or |a|>1 => ##NaN
 *   If a is zero => zero with the same sign as a
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/asin
 */
cljs.math.asin = (function cljs$math$asin(a){
return Math.asin(a);
});
/**
 * Returns the arc cosine of a, in the range 0.0 to pi.
 *   If a is ##NaN or |a|>1 => ##NaN
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acos
 */
cljs.math.acos = (function cljs$math$acos(a){
return Math.acos(a);
});
/**
 * Returns the arc tangent of a, in the range of -pi/2 to pi/2.
 *   If a is ##NaN => ##NaN
 *   If a is zero => zero with the same sign as a
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan
 */
cljs.math.atan = (function cljs$math$atan(a){
return Math.atan(a);
});
/**
 * Converts an angle in degrees to an approximate equivalent angle in radians.
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#toRadians-double-
 */
cljs.math.to_radians = (function cljs$math$to_radians(deg){
return (deg * 0.017453292519943295);
});
/**
 * Converts an angle in radians to an approximate equivalent angle in degrees.
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#toDegrees-double-
 */
cljs.math.to_degrees = (function cljs$math$to_degrees(r){
return (r * 57.29577951308232);
});
/**
 * Returns Euler's number e raised to the power of a.
 *   If a is ##NaN => ##NaN
 *   If a is ##Inf => ##Inf
 *   If a is ##-Inf => +0.0
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/exp
 */
cljs.math.exp = (function cljs$math$exp(a){
return Math.exp(a);
});
/**
 * Returns the natural logarithm (base e) of a.
 *   If a is ##NaN or negative => ##NaN
 *   If a is ##Inf => ##Inf
 *   If a is zero => ##-Inf
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log
 */
cljs.math.log = (function cljs$math$log(a){
return Math.log(a);
});
/**
 * Returns the logarithm (base 10) of a.
 *   If a is ##NaN or negative => ##NaN
 *   If a is ##Inf => ##Inf
 *   If a is zero => ##-Inf
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log10
 */
cljs.math.log10 = (function cljs$math$log10(a){
return Math.log10(a);
});
/**
 * Returns the positive square root of a.
 *   If a is ##NaN or negative => ##NaN
 *   If a is ##Inf => ##Inf
 *   If a is zero => a
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sqrt
 */
cljs.math.sqrt = (function cljs$math$sqrt(a){
return Math.sqrt(a);
});
/**
 * Returns the cube root of a.
 *   If a is ##NaN => ##NaN
 *   If a is ##Inf or ##-Inf => a
 *   If a is zero => zero with sign matching a
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cbrt
 */
cljs.math.cbrt = (function cljs$math$cbrt(a){
return Math.cbrt(a);
});
/**
 * Internal function to convert doubles to absolute values.
 *   This duplicates the C implementations in Java, in case there is are corner-case differences.
 */
cljs.math.fabs = (function cljs$math$fabs(x){
var a = (new ArrayBuffer((8)));
var d = (new Float64Array(a));
var i = (new Uint32Array(a));
var hi = ((cljs.math.little_endian_QMARK_)?(1):(0));
(d[(0)] = x);

(i[hi] = ((i[hi]) & (2147483647)));

return (d[(0)]);
});
cljs.math.Zero = (function (){var a = (new ArrayBuffer((16)));
var d = (new Float64Array(a));
var b = (new Uint8Array(a));
(d[(0)] = 0.0);

(d[(1)] = 0.0);

(b[((cljs.math.little_endian_QMARK_)?(15):(8))] = (-128));

return d;
})();
cljs.math.xpos = (0);
cljs.math.ypos = (1);
cljs.math.HI_x = (((2) * (0)) + cljs.math.HI);
cljs.math.LO_x = (((2) * (0)) + cljs.math.LO);
cljs.math.HI_y = (((2) * (1)) + cljs.math.HI);
cljs.math.LO_y = (((2) * (1)) + cljs.math.LO);
/**
 * internal function for ilogb(x)
 */
cljs.math.ilogb = (function cljs$math$ilogb(hx,lx){
if((hx < (1048576))){
var hx_zero_QMARK_ = (hx === (0));
var start_ix = ((hx_zero_QMARK_)?(-1043):(-1022));
var start_i = ((hx_zero_QMARK_)?lx:(hx << (11)));
var ix = start_ix;
var i = start_i;
while(true){
if((!((i > (0))))){
return ix;
} else {
var G__125285 = (ix - (1));
var G__125286 = (i << (1));
ix = G__125285;
i = G__125286;
continue;
}
break;
}
} else {
return ((hx >> (20)) - (1023));
}
});
/**
 * internal function to setup and align integer words
 */
cljs.math.setup_hl = (function cljs$math$setup_hl(i,h,l){
if((i >= (-1022))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((1048576) | ((1048575) & h)),l], null);
} else {
var n = ((-1022) - i);
if((n <= (31))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((h << n) | (l >>> ((32) - n))),(l << n)], null);
} else {
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(l << (n - (32))),(0)], null);
}
}
});
/**
 * Return x mod y in exact arithmetic. Method: shift and subtract.
 *   Reimplements __ieee754_fmod from the JDK.
 *   Ported from: https://github.com/openjdk/jdk/blob/master/src/java.base/share/native/libfdlibm/e_fmod.c
 *   bit-shift-left and bit-shift-right convert numbers to signed 32-bit
 *   Fortunately the values that are shifted are expected to be 32 bit signed.
 */
cljs.math.IEEE_fmod = (function cljs$math$IEEE_fmod(x,y){
if((((y === (0))) || (((isNaN(y)) || ((!(isFinite(x)))))))){
return NaN;
} else {
var a = (new ArrayBuffer((16)));
var d = (new Float64Array(a));
var i = (new Uint32Array(a));
var _ = (d[(0)] = x);
var ___$1 = (d[(1)] = y);
var hx = (i[cljs.math.HI_x]);
var lx = (i[cljs.math.LO_x]);
var hy = (i[cljs.math.HI_y]);
var ly = (i[cljs.math.LO_y]);
var sx = (hx & (2147483648));
var hx__$1 = (hx & (2147483647));
var hy__$1 = (hy & (2147483647));
var hx_LT__EQ_hy = (hx__$1 <= hy__$1);
if(((hx_LT__EQ_hy) && ((((hx__$1 < hy__$1)) || ((lx < ly)))))){
return x;
} else {
if(((hx_LT__EQ_hy) && ((lx === ly)))){
return (cljs.math.Zero[(sx >>> (31))]);
} else {
try{var ix = cljs.math.ilogb(hx__$1,lx);
var iy = cljs.math.ilogb(hy__$1,ly);
var vec__125238 = cljs.math.setup_hl(ix,hx__$1,lx);
var hx__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125238,(0),null);
var lx__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125238,(1),null);
var vec__125241 = cljs.math.setup_hl(iy,hy__$1,ly);
var hy__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125241,(0),null);
var ly__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125241,(1),null);
var vec__125244 = (function (){var n = (ix - iy);
var hx__$3 = hx__$2;
var lx__$2 = lx__$1;
while(true){
if((n === (0))){
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [hx__$3,lx__$2], null);
} else {
var hz = ((cljs.math.u_LT_(lx__$2,ly__$1))?((hx__$3 - hy__$2) - (1)):(hx__$3 - hy__$2));
var lz = (lx__$2 - ly__$1);
var vec__125256 = (((hz < (0)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((hx__$3 + hx__$3) + (lx__$2 >>> (31))),(lx__$2 + lx__$2)], null):((((hz | lz) === (0)))?(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Signed zero",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"zero","zero",-858964576),true], null))})():new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [((hz + hz) + (lz >>> (31))),(lz + lz)], null)));
var hx__$4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125256,(0),null);
var lx__$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125256,(1),null);
var G__125291 = (n - (1));
var G__125292 = ((4294967295) & hx__$4);
var G__125293 = ((4294967295) & lx__$3);
n = G__125291;
hx__$3 = G__125292;
lx__$2 = G__125293;
continue;
}
break;
}
})();
var hx__$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125244,(0),null);
var lx__$2 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125244,(1),null);
var hz = ((cljs.math.u_LT_(lx__$2,ly__$1))?((hx__$3 - hy__$2) - (1)):(hx__$3 - hy__$2));
var lz = (lx__$2 - ly__$1);
var vec__125247 = (((hz >= (0)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [hz,lz], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [hx__$3,lx__$2], null));
var hx__$4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125247,(0),null);
var lx__$3 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125247,(1),null);
var ___$2 = ((((hx__$4 | lx__$3) === (0)))?(function(){throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Signed zero",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"zero","zero",-858964576),true], null))})():null);
var vec__125250 = (function (){var hx__$5 = hx__$4;
var lx__$4 = lx__$3;
var iy__$1 = iy;
while(true){
if((!((hx__$5 < (1048576))))){
return new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [hx__$5,lx__$4,iy__$1], null);
} else {
var G__125297 = ((hx__$5 + hx__$5) + (lx__$4 >>> (31)));
var G__125298 = (lx__$4 + lx__$4);
var G__125299 = (iy__$1 - (1));
hx__$5 = G__125297;
lx__$4 = G__125298;
iy__$1 = G__125299;
continue;
}
break;
}
})();
var hx__$5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125250,(0),null);
var lx__$4 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125250,(1),null);
var iy__$1 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125250,(2),null);
if((iy__$1 >= (-1022))){
var hx__$6 = ((hx__$5 - (1048576)) | ((iy__$1 + (1023)) << (20)));
(i[cljs.math.HI_x] = (hx__$6 | sx));

(i[cljs.math.LO_x] = lx__$4);

return (d[(0)]);
} else {
var n = ((-1022) - iy__$1);
var vec__125259 = (((n <= (20)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [(hx__$5 >> n),((lx__$4 >>> n) | (hx__$5 << ((32) - n)))], null):(((n <= (31)))?new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sx,((hx__$5 << ((32) - n)) | (lx__$4 >>> n))], null):new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [sx,(hx__$5 >> (n - (32)))], null)
));
var hx__$6 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125259,(0),null);
var lx__$5 = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125259,(1),null);
(i[cljs.math.HI_x] = (hx__$6 | sx));

(i[cljs.math.LO_x] = lx__$5);

return ((d[(0)]) * 1.0);
}
}catch (e125237){var ___$2 = e125237;
return (cljs.math.Zero[(sx >>> (31))]);
}
}
}
}
});
/**
 * Returns the remainder per IEEE 754 such that
 *  remainder = dividend - divisor * n
 * where n is the integer closest to the exact value of dividend / divisor.
 * If two integers are equally close, then n is the even one.
 * If the remainder is zero, sign will match dividend.
 * If dividend or divisor is ##NaN, or dividend is ##Inf or ##-Inf, or divisor is zero => ##NaN
 * If dividend is finite and divisor is infinite => dividend
 * 
 * Method: based on fmod return x-[x/p]chopped*p exactlp.
 * Ported from: https://github.com/openjdk/jdk/blob/master/src/java.base/share/native/libfdlibm/e_remainder.c
 * See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#IEEEremainder-double-double-
 */
cljs.math.IEEE_remainder = (function cljs$math$IEEE_remainder(dividend,divisor){
if((divisor === (0))){
return NaN;
} else {
if(isNaN(divisor)){
return NaN;
} else {
if(isNaN(dividend)){
return NaN;
} else {
if((!(isFinite(dividend)))){
return NaN;
} else {
if((!(isFinite(divisor)))){
return dividend;
} else {
var a = (new ArrayBuffer((16)));
var d = (new Float64Array(a));
var i = (new Uint32Array(a));
(d[(0)] = dividend);

(d[(1)] = divisor);

var hx = (i[cljs.math.HI]);
var lx = (i[cljs.math.LO]);
var hp = (i[(cljs.math.HI + (2))]);
var lp = (i[(cljs.math.LO + (2))]);
var sx = (hx & (2147483648));
var hp__$1 = (hp & (2147483647));
var hx__$1 = (hx & (2147483647));
var dividend__$1 = (((hp__$1 <= (2145386495)))?cljs.math.IEEE_fmod(dividend,(divisor + divisor)):dividend);
if((((hx__$1 - hp__$1) | (lx - lp)) === (0))){
return (0.0 * dividend__$1);
} else {
var dividend__$2 = Math.abs(dividend__$1);
var divisor__$1 = Math.abs(divisor);
var dividend__$3 = (((hp__$1 < (2097152)))?((((dividend__$2 + dividend__$2) > divisor__$1))?(function (){var dividend__$3 = (dividend__$2 - divisor__$1);
if(((dividend__$3 + dividend__$3) >= divisor__$1)){
return (dividend__$3 - divisor__$1);
} else {
return dividend__$3;
}
})():dividend__$2):(function (){var divisor_half = (0.5 * divisor__$1);
if((dividend__$2 > divisor_half)){
var dividend__$3 = (dividend__$2 - divisor__$1);
if((dividend__$3 >= divisor_half)){
return (dividend__$3 - divisor__$1);
} else {
return dividend__$3;
}
} else {
return dividend__$2;
}
})());
(d[(0)] = dividend__$3);

var hx__$2 = ((i[cljs.math.HI]) ^ sx);
(i[cljs.math.HI] = hx__$2);

return (d[(0)]);
}

}
}
}
}
}
});
/**
 * Returns the smallest double greater than or equal to a, and equal to a
 *   mathematical integer.
 *   If a is ##NaN or ##Inf or ##-Inf or already equal to an integer => a
 *   Note that if a is `nil` then an exception will be thrown. This matches Clojure, rather than js/Math.ceil
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/ceil
 */
cljs.math.ceil = (function cljs$math$ceil(a){
if((!((a == null)))){
return Math.ceil(a);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Unexpected Null passed to ceil",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fn","fn",-1175266204),"ceil"], null));
}
});
/**
 * Returns the largest double less than or equal to a, and equal to a
 *   mathematical integer.
 *   If a is ##NaN or ##Inf or ##-Inf or already equal to an integer => a
 *   If a is less than zero but greater than -1.0 => -0.0
 *   Note that if a is `nil` then an exception will be thrown. This matches Clojure, rather than js/Math.floor
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
 */
cljs.math.floor = (function cljs$math$floor(a){
if((!((a == null)))){
return Math.floor(a);
} else {
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Unexpected Null passed to floor",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fn","fn",-1175266204),"floor"], null));
}
});
/**
 * Returns a double with the magnitude of the first argument and the sign of
 *   the second.
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#copySign-double-double-
 */
cljs.math.copy_sign = (function cljs$math$copy_sign(magnitude,sign){
var a = (new ArrayBuffer((16)));
var d = (new Float64Array(a));
var b = (new Uint8Array(a));
var sbyte = ((cljs.math.little_endian_QMARK_)?(7):(0));
(d[(0)] = magnitude);

(d[(1)] = sign);

var sign_sbyte = ((128) & (b[((8) + sbyte)]));
var mag_sbyte = ((127) & (b[sbyte]));
(b[sbyte] = (sign_sbyte | mag_sbyte));

return (d[(0)]);
});
/**
 * Returns the double closest to a and equal to a mathematical integer.
 *   If two values are equally close, return the even one.
 *   If a is ##NaN or ##Inf or ##-Inf or zero => a
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#rint-double-
 */
cljs.math.rint = (function cljs$math$rint(a){
var sign = cljs.math.copy_sign(1.0,a);
var a__$1 = Math.abs(a);
var a__$2 = (((a__$1 < (4503599627370496)))?(((4503599627370496) + a__$1) - (4503599627370496)):a__$1);
return (sign * a__$2);
});
/**
 * Returns the angle theta from the conversion of rectangular coordinates (x, y) to polar coordinates (r, theta).
 *   Computes the phase theta by computing an arc tangent of y/x in the range of -pi to pi.
 *   For more details on special cases, see:
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan
 */
cljs.math.atan2 = (function cljs$math$atan2(y,x){
return Math.atan2(y,x);
});
/**
 * Returns the value of a raised to the power of b.
 *   For more details on special cases, see:
 *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow
 */
cljs.math.pow = (function cljs$math$pow(a,b){
return Math.pow(a,b);
});
/**
 * Returns the closest long to a. If equally close to two values, return the one
 *   closer to ##Inf.
 *   If a is ##NaN => 0
 *   If a is ##-Inf => js/Number.MIN_SAFE_INTEGER
 *   If a is ##Inf => js/Number.MAX_SAFE_INTEGER
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
 */
cljs.math.round = (function cljs$math$round(a){
if(isNaN(a)){
return (0);
} else {
if(isFinite(a)){
return Math.round(a);
} else {
if((Infinity === a)){
return Number.MAX_SAFE_INTEGER;
} else {
return Number.MIN_SAFE_INTEGER;

}
}
}
});
/**
 * Returns a positive double between 0.0 and 1.0, chosen pseudorandomly with
 *   approximately random distribution. Not cryptographically secure. The seed is chosen internally
 *   and cannot be selected.
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
 */
cljs.math.random = (function cljs$math$random(){
return Math.random();
});
/**
 * Returns the sum of x and y, throws an exception on overflow. 
 */
cljs.math.add_exact = (function cljs$math$add_exact(x,y){
var r = (x + y);
if((((r > Number.MAX_SAFE_INTEGER)) || ((r < Number.MIN_SAFE_INTEGER)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Integer overflow",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fn","fn",-1175266204),"add-exact"], null));
} else {
return r;
}
});
/**
 * Returns the difference of x and y, throws ArithmeticException on overflow. 
 */
cljs.math.subtract_exact = (function cljs$math$subtract_exact(x,y){
var r = (x - y);
if((((r > Number.MAX_SAFE_INTEGER)) || ((r < Number.MIN_SAFE_INTEGER)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Integer overflow",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fn","fn",-1175266204),"subtract-exact"], null));
} else {
return r;
}
});
/**
 * Returns the product of x and y, throws ArithmeticException on overflow. 
 */
cljs.math.multiply_exact = (function cljs$math$multiply_exact(x,y){
var r = (x * y);
if((((r > Number.MAX_SAFE_INTEGER)) || ((r < Number.MIN_SAFE_INTEGER)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Integer overflow",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fn","fn",-1175266204),"multiply-exact"], null));
} else {
return r;
}
});
/**
 * Returns a incremented by 1, throws ArithmeticException on overflow.
 */
cljs.math.increment_exact = (function cljs$math$increment_exact(a){
if((((a >= Number.MAX_SAFE_INTEGER)) || ((a < Number.MIN_SAFE_INTEGER)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Integer overflow",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fn","fn",-1175266204),"increment-exact"], null));
} else {
return (a + (1));
}
});
/**
 * Returns a decremented by 1, throws ArithmeticException on overflow. 
 */
cljs.math.decrement_exact = (function cljs$math$decrement_exact(a){
if((((a <= Number.MIN_SAFE_INTEGER)) || ((a > Number.MAX_SAFE_INTEGER)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Integer overflow",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fn","fn",-1175266204),"decrement-exact"], null));
} else {
return (a - (1));
}
});
/**
 * Returns the negation of a, throws ArithmeticException on overflow. 
 */
cljs.math.negate_exact = (function cljs$math$negate_exact(a){
if((((a > Number.MAX_SAFE_INTEGER)) || ((a < Number.MIN_SAFE_INTEGER)))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("Integer overflow",new cljs.core.PersistentArrayMap(null, 1, [new cljs.core.Keyword(null,"fn","fn",-1175266204),"negate-exact"], null));
} else {
return (- a);
}
});
cljs.math.xor = (function cljs$math$xor(a,b){
return ((((a) && ((!(b))))) || ((((!(a))) && (b))));
});
/**
 * Integer division that rounds to negative infinity (as opposed to zero).
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#floorDiv-long-long-
 */
cljs.math.floor_div = (function cljs$math$floor_div(x,y){
if((!(((Number.isSafeInteger(x)) && (Number.isSafeInteger(y)))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("floor-div called with non-safe-integer arguments",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x-int?","x-int?",792269440),Number.isSafeInteger(x),new cljs.core.Keyword(null,"y-int?","y-int?",2045680479),Number.isSafeInteger(y)], null));
} else {
var r = cljs.core.long$((x / y));
if(((cljs.math.xor((x < (0)),(y < (0)))) && ((!(((r * y) === x)))))){
return (r - (1));
} else {
return r;
}
}
});
/**
 * Integer modulus x - (floorDiv(x, y) * y). Sign matches y and is in the
 *   range -|y| < r < |y|.
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#floorMod-long-long-
 */
cljs.math.floor_mod = (function cljs$math$floor_mod(x,y){
if((!(((Number.isSafeInteger(x)) && (Number.isSafeInteger(y)))))){
throw cljs.core.ex_info.cljs$core$IFn$_invoke$arity$2("floor-mod called with non-safe-integer arguments",new cljs.core.PersistentArrayMap(null, 2, [new cljs.core.Keyword(null,"x-int?","x-int?",792269440),Number.isSafeInteger(x),new cljs.core.Keyword(null,"y-int?","y-int?",2045680479),Number.isSafeInteger(y)], null));
} else {
var r = cljs.core.long$((x / y));
if(((cljs.math.xor((x < (0)),(y < (0)))) && ((!(((r * y) === x)))))){
return ((x - (y * r)) - (- y));
} else {
return (x - (y * r));
}
}
});
/**
 * Returns the exponent of d.
 *   If d is ##NaN, ##Inf, ##-Inf => max_Float64_exponent + 1
 *   If d is zero or subnormal => min_Float64_exponent - 1
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#getExponent-double-
 */
cljs.math.get_exponent = (function cljs$math$get_exponent(d){
if(((isNaN(d)) || ((!(isFinite(d)))))){
return (cljs.math.EXP_MAX + (1));
} else {
if((d === (0))){
return ((-1022) - (1));
} else {
var a = (new ArrayBuffer((8)));
var f = (new Float64Array(a));
var i = (new Uint32Array(a));
var hi = ((cljs.math.little_endian_QMARK_)?(1):(0));
(f[(0)] = d);

return ((((i[hi]) & (2146435072)) >> ((21) - (1))) - (1023));

}
}
});
/**
 * Converts a pair of 32 bit integers into an IEEE-754 64 bit floating point number.
 *   h is the high 32 bits, l is the low 32 bits.
 */
cljs.math.hi_lo__GT_double = (function cljs$math$hi_lo__GT_double(h,l){
var a = (new ArrayBuffer((8)));
var f = (new Float64Array(a));
var i = (new Uint32Array(a));
(i[cljs.math.LO] = l);

(i[cljs.math.HI] = h);

return (f[(0)]);
});
/**
 * returns a floating point power of two in the normal range
 */
cljs.math.power_of_two = (function cljs$math$power_of_two(n){
if((((n >= (-1022))) && ((n <= cljs.math.EXP_MAX)))){
} else {
throw (new Error("Assert failed: (and (>= n EXP-MIN) (<= n EXP-MAX))"));
}

return cljs.math.hi_lo__GT_double((((n + (1023)) << ((21) - (1))) & (2146435072)),(0));
});
/**
 * Returns the size of an ulp (unit in last place) for d.
 *   If d is ##NaN => ##NaN
 *   If d is ##Inf or ##-Inf => ##Inf
 *   If d is zero => Number/MIN_VALUE
 *   If d is +/- Number/MAX_VALUE => 2^971
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#ulp-double-
 */
cljs.math.ulp = (function cljs$math$ulp(d){
if(isNaN(d)){
return d;
} else {
if(isFinite(d)){
var e = cljs.math.get_exponent(d);
var G__125269 = e;
switch (G__125269) {
case (1024):
return Math.abs(d);

break;
case (-1023):
return Number.MIN_VALUE;

break;
default:
var e__$1 = (e - ((31) + (21)));
if((e__$1 >= (-1022))){
return cljs.math.power_of_two(e__$1);
} else {
var shift = (e__$1 - (((-1022) - (31)) - (21)));
if((shift < (32))){
return cljs.math.hi_lo__GT_double((0),((1) << shift));
} else {
return cljs.math.hi_lo__GT_double(((1) << (shift - (32))),(0));
}
}

}
} else {
return Infinity;

}
}
});
/**
 * Returns the signum function of d - zero for zero, 1.0 if >0, -1.0 if <0.
 *   If d is ##NaN => ##NaN
 *   If d is ##Inf or ##-Inf => sign of d
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#signum-double-
 */
cljs.math.signum = (function cljs$math$signum(d){
if((((d === (0))) || (isNaN(d)))){
return d;
} else {
return cljs.math.copy_sign(1.0,d);
}
});
/**
 * Returns the hyperbolic sine of x, (e^x - e^-x)/2.
 *   If x is ##NaN => ##NaN
 *   If x is ##Inf or ##-Inf or zero => x
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sinh
 */
cljs.math.sinh = (function cljs$math$sinh(x){
return Math.sinh(x);
});
/**
 * Returns the hyperbolic cosine of x, (e^x + e^-x)/2.
 *   If x is ##NaN => ##NaN
 *   If x is ##Inf or ##-Inf => ##Inf
 *   If x is zero => 1.0
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cosh
 */
cljs.math.cosh = (function cljs$math$cosh(x){
return Math.cosh(x);
});
/**
 * Returns the hyperbolic tangent of x, sinh(x)/cosh(x).
 *   If x is ##NaN => ##NaN
 *   If x is zero => zero, with same sign
 *   If x is ##Inf => +1.0
 *   If x is ##-Inf => -1.0
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/tanh
 */
cljs.math.tanh = (function cljs$math$tanh(x){
return Math.tanh(x);
});
/**
 * Returns sqrt(x^2 + y^2) without intermediate underflow or overflow.
 *   If x or y is ##Inf or ##-Inf => ##Inf
 *   If x or y is ##NaN and neither is ##Inf or ##-Inf => ##NaN
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot
 */
cljs.math.hypot = (function cljs$math$hypot(x,y){
return Math.hypot(x,y);
});
/**
 * Returns e^x - 1. Near 0, expm1(x)+1 is more accurate to e^x than exp(x).
 *   If x is ##NaN => ##NaN
 *   If x is ##Inf => #Inf
 *   If x is ##-Inf => -1.0
 *   If x is zero => x
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/expm1
 */
cljs.math.expm1 = (function cljs$math$expm1(x){
return Math.expm1(x);
});
/**
 * Returns ln(1+x). For small values of x, log1p(x) is more accurate than
 *   log(1.0+x).
 *   If x is ##NaN or ##-Inf or < -1 => ##NaN
 *   If x is -1 => ##-Inf
 *   If x is ##Inf => ##Inf
 *   See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p
 */
cljs.math.log1p = (function cljs$math$log1p(x){
return Math.log1p(x);
});
/**
 * Takes the high and low words for 2 different 64 bit integers, and adds them.
 *   This handles overflow from the low-order words into the high order words.
 */
cljs.math.add64 = (function cljs$math$add64(hx,lx,hy,ly){
var sx = ((lx & (2147483648)) >>> (31));
var sy = ((ly & (2147483648)) >>> (31));
var lr = (((2147483647) & lx) + ((2147483647) & ly));
var c31 = ((lr & (2147483648)) >>> (31));
var b31 = ((sx + sy) + c31);
var lr__$1 = ((lr & (2147483647)) | (b31 << (31)));
var c32 = (b31 >> (1));
var hr = ((4294967295) & ((hx + hy) + c32));
return new cljs.core.PersistentVector(null, 2, 5, cljs.core.PersistentVector.EMPTY_NODE, [hr,lr__$1], null);
});
/**
 * Returns the adjacent floating point number to start in the direction of
 *   the second argument. If the arguments are equal, the second is returned.
 *   If either arg is #NaN => #NaN
 *   If both arguments are signed zeros => direction
 *   If start is +-Number/MIN_VALUE and direction would cause a smaller magnitude
 *  => zero with sign matching start
 *   If start is ##Inf or ##-Inf and direction would cause a smaller magnitude
 *  => Number/MAX_VALUE with same sign as start
 *   If start is equal to +=Number/MAX_VALUE and direction would cause a larger magnitude
 *  => ##Inf or ##-Inf with sign matching start
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#nextAfter-double-double-
 */
cljs.math.next_after = (function cljs$math$next_after(start,direction){
var a = (new ArrayBuffer((8)));
var f = (new Float64Array(a));
var i = (new Uint32Array(a));
if((start > direction)){
if((!((start === (0))))){
var _ = (f[(0)] = start);
var ht = (i[cljs.math.HI]);
var lt = (i[cljs.math.LO]);
var vec__125270 = ((((ht & (2147483648)) === (0)))?cljs.math.add64(ht,lt,(4294967295),(4294967295)):cljs.math.add64(ht,lt,(0),(1)));
var hr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125270,(0),null);
var lr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125270,(1),null);
(i[cljs.math.HI] = hr);

(i[cljs.math.LO] = lr);

return (f[(0)]);
} else {
return (- Number.MIN_VALUE);
}
} else {
if((start < direction)){
var _ = (f[(0)] = (start + 0.0));
var ht = (i[cljs.math.HI]);
var lt = (i[cljs.math.LO]);
var vec__125273 = ((((ht & (2147483648)) === (0)))?cljs.math.add64(ht,lt,(0),(1)):cljs.math.add64(ht,lt,(4294967295),(4294967295)));
var hr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125273,(0),null);
var lr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125273,(1),null);
(i[cljs.math.HI] = hr);

(i[cljs.math.LO] = lr);

return (f[(0)]);
} else {
if((start === direction)){
return direction;
} else {
return (start + direction);

}
}
}
});
/**
 * Returns the adjacent double of d in the direction of ##Inf.
 *   If d is ##NaN => ##NaN
 *   If d is ##Inf => ##Inf
 *   If d is zero => Number/MIN_VALUE
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#nextUp-double-
 */
cljs.math.next_up = (function cljs$math$next_up(d){
if((d < Number.POSITIVE_INFINITY)){
var a = (new ArrayBuffer((8)));
var f = (new Float64Array(a));
var i = (new Uint32Array(a));
var _ = (f[(0)] = (d + 0.0));
var ht = (i[cljs.math.HI]);
var lt = (i[cljs.math.LO]);
var vec__125276 = ((((ht & (2147483648)) === (0)))?cljs.math.add64(ht,lt,(0),(1)):cljs.math.add64(ht,lt,(4294967295),(4294967295)));
var hr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125276,(0),null);
var lr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125276,(1),null);
(i[cljs.math.HI] = hr);

(i[cljs.math.LO] = lr);

return (f[(0)]);
} else {
return d;
}
});
/**
 * Returns the adjacent double of d in the direction of ##-Inf.
 *   If d is ##NaN => ##NaN
 *   If d is ##Inf => Number/MAX_VALUE
 *   If d is zero => -Number/MIN_VALUE
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#nextDown-double-
 */
cljs.math.next_down = (function cljs$math$next_down(d){
if(((isNaN(d)) || ((-Infinity === d)))){
return d;
} else {
if((d === (0))){
return (- Number.MIN_VALUE);
} else {
var a = (new ArrayBuffer((8)));
var f = (new Float64Array(a));
var i = (new Uint32Array(a));
var _ = (f[(0)] = d);
var ht = (i[cljs.math.HI]);
var lt = (i[cljs.math.LO]);
var vec__125279 = (((d > (0)))?cljs.math.add64(ht,lt,(4294967295),(4294967295)):cljs.math.add64(ht,lt,(0),(1)));
var hr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125279,(0),null);
var lr = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125279,(1),null);
(i[cljs.math.HI] = hr);

(i[cljs.math.LO] = lr);

return (f[(0)]);

}
}
});
cljs.math.MAX_SCALE = ((((cljs.math.EXP_MAX + (- (-1022))) + (21)) + (32)) + (1));
cljs.math.two_to_the_double_scale_up = cljs.math.power_of_two((512));
cljs.math.two_to_the_double_scale_down = cljs.math.power_of_two((-512));
/**
 * Returns d * 2^scaleFactor, scaling by a factor of 2. If the exponent
 *   is between min_Float64_exponent and max_Float64_exponent.
 *   scaleFactor is an integer
 *   If d is ##NaN => ##NaN
 *   If d is ##Inf or ##-Inf => ##Inf or ##-Inf respectively
 *   If d is zero => zero of same sign as d
 *   See: https://docs.oracle.com/javase/8/docs/api/java/lang/Math.html#nextDown-double-
 */
cljs.math.scalb = (function cljs$math$scalb(d,scaleFactor){
var vec__125282 = (((scaleFactor < (0)))?new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [Math.max(scaleFactor,(- cljs.math.MAX_SCALE)),(-512),cljs.math.two_to_the_double_scale_down], null):new cljs.core.PersistentVector(null, 3, 5, cljs.core.PersistentVector.EMPTY_NODE, [Math.min(scaleFactor,cljs.math.MAX_SCALE),(512),cljs.math.two_to_the_double_scale_up], null));
var scale_factor = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125282,(0),null);
var scale_increment = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125282,(1),null);
var exp_delta = cljs.core.nth.cljs$core$IFn$_invoke$arity$3(vec__125282,(2),null);
var t = ((scale_factor >> (8)) >>> (23));
var exp_adjust = (((scale_factor + t) & (511)) - t);
var d__$1 = (d * cljs.math.power_of_two(exp_adjust));
var scale_factor__$1 = (scale_factor - exp_adjust);
while(true){
if((scale_factor__$1 === (0))){
return d__$1;
} else {
var G__125323 = (d__$1 * exp_delta);
var G__125324 = (scale_factor__$1 - scale_increment);
d__$1 = G__125323;
scale_factor__$1 = G__125324;
continue;
}
break;
}
});

//# sourceMappingURL=cljs.math.js.map
