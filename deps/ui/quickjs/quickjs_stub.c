#include <caml/alloc.h>
#include <caml/custom.h>
#include <caml/fail.h>
#include <caml/memory.h>
#include <caml/mlvalues.h>
#include <limits.h>
#include <math.h>
#include <pthread.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "quickjs.h"

enum { INVALID, UNSUPPORTED, DENIED, STALE, CANCELLED, RESOURCE, RUNTIME };
static const char *error_names[] = {
    "Invalid_request", "Unsupported", "Permission_denied", "Stale_context",
    "Cancelled", "Resource_limit", "Runtime_failure"
};
#define MAX_CALLS 32

typedef struct {
    int state, id;
    JSValue resolve, reject;
} Pending;

typedef struct Bridge {
    JSRuntime *runtime;
    JSContext *context;
    JSValue handler, result, object_proto, array_proto;
    JSClassID object_class, array_class;
    pthread_t owner;
    int error, interrupted, active, epoch, next_request, calls;
    size_t source_limit, message_limit, string_limit;
    int node_limit, depth_limit;
    double deadline, wall_deadline, execution;
    Pending pending[MAX_CALLS];
    struct Bridge *retired_next;
} Bridge;

static pthread_mutex_t retirement_lock = PTHREAD_MUTEX_INITIALIZER;
static Bridge *retired;

static double monotonic(void) {
    struct timespec now;
    clock_gettime(CLOCK_MONOTONIC, &now);
    return (double)now.tv_sec + (double)now.tv_nsec / 1e9;
}

static void classify_error(Bridge *bridge, JSValueConst exception) {
    JSContext *context = bridge->context;
    if (bridge->error != RUNTIME) return;
    if (JS_IsString(exception)) {
        size_t length;
        const char *name = JS_ToCStringLen(context, &length, exception);
        if (name) {
            for (int i = 0; i <= RUNTIME; i++)
                if (length == strlen(error_names[i]) && !memcmp(name, error_names[i], length))
                    bridge->error = i;
            JS_FreeCString(context, name);
        }
    } else if (JS_IsError(context, exception)) {
        JSPropertyDescriptor descriptor = {0, JS_UNDEFINED, JS_UNDEFINED, JS_UNDEFINED};
        JSAtom key = JS_NewAtom(context, "message");
        int found = JS_GetOwnProperty(context, &descriptor, exception, key);
        JS_FreeAtom(context, key);
        if (found == 1) {
            if ((descriptor.flags & JS_PROP_TMASK) == JS_PROP_NORMAL && JS_IsString(descriptor.value)) {
                size_t length;
                const char *message = JS_ToCStringLen(context, &length, descriptor.value);
                if (message) {
                    if (length == 13 && !memcmp(message, "out of memory", 13)) bridge->error = RESOURCE;
                    JS_FreeCString(context, message);
                }
            }
            JS_FreeValue(context, descriptor.value);
            JS_FreeValue(context, descriptor.getter);
            JS_FreeValue(context, descriptor.setter);
        }
    }
}

static void clear_exception(Bridge *bridge) {
    JSValue exception = JS_GetException(bridge->context);
    classify_error(bridge, exception);
    JS_FreeValue(bridge->context, exception);
}

static int interrupt(JSRuntime *runtime, void *opaque) {
    Bridge *bridge = opaque;
    (void)runtime;
    if (monotonic() >= bridge->deadline) {
        bridge->interrupted = 1;
        return 1;
    }
    return 0;
}

static double enter(Bridge *bridge, double slice) {
    double now = monotonic();
    bridge->deadline = fmin(now + slice,
        fmin(bridge->wall_deadline, now + fmax(0, 0.1 - bridge->execution)));
    return now;
}

static void leave(Bridge *bridge, double before) {
    bridge->execution += monotonic() - before;
    if (bridge->interrupted || bridge->execution >= 0.1 ||
        monotonic() >= bridge->wall_deadline)
        bridge->error = RESOURCE;
}

static void stop(Bridge *bridge) {
    bridge->active = 0;
    JS_FreeValue(bridge->context, bridge->result);
    bridge->result = JS_UNDEFINED;
    for (int i = 0; i < MAX_CALLS; i++) {
        if (bridge->pending[i].state) {
            JS_FreeValue(bridge->context, bridge->pending[i].resolve);
            JS_FreeValue(bridge->context, bridge->pending[i].reject);
            bridge->pending[i].state = 0;
        }
    }
}

static void destroy(Bridge *bridge) {
    if (bridge->context) {
        stop(bridge);
        JS_FreeValue(bridge->context, bridge->handler);
        JS_FreeValue(bridge->context, bridge->object_proto);
        JS_FreeValue(bridge->context, bridge->array_proto);
        JS_FreeContext(bridge->context);
    }
    if (bridge->runtime) JS_FreeRuntime(bridge->runtime);
    free(bridge);
}

static void drain_retired(void) {
    Bridge *ready = NULL;
    pthread_mutex_lock(&retirement_lock);
    Bridge **entry = &retired;
    while (*entry) {
        Bridge *bridge = *entry;
        if (pthread_equal(bridge->owner, pthread_self())) {
            *entry = bridge->retired_next;
            bridge->retired_next = ready;
            ready = bridge;
        } else entry = &bridge->retired_next;
    }
    pthread_mutex_unlock(&retirement_lock);
    while (ready) {
        Bridge *next = ready->retired_next;
        destroy(ready);
        ready = next;
    }
}

static void finalize(value handle) {
    Bridge *bridge = *(Bridge **)Data_custom_val(handle);
    if (!bridge) return;
    *(Bridge **)Data_custom_val(handle) = NULL;
    if (pthread_equal(bridge->owner, pthread_self())) destroy(bridge);
    else {
        /* Explicit close is required; finalization may only retire on the owner. */
        pthread_mutex_lock(&retirement_lock);
        bridge->retired_next = retired;
        retired = bridge;
        pthread_mutex_unlock(&retirement_lock);
    }
}

static struct custom_operations operations = {
    .identifier = "logseq.quickjs.runtime.v1",
    .finalize = finalize,
    .compare = custom_compare_default,
    .hash = custom_hash_default,
    .serialize = custom_serialize_default,
    .deserialize = custom_deserialize_default,
    .compare_ext = custom_compare_ext_default,
    .fixed_length = custom_fixed_length_default
};

static Bridge *owned(value handle) {
    Bridge *bridge = *(Bridge **)Data_custom_val(handle);
    if (!bridge) caml_invalid_argument("Closed QuickJS runtime");
    if (!pthread_equal(bridge->owner, pthread_self()))
        caml_invalid_argument("QuickJS runtime accessed outside its owner thread");
    drain_retired();
    return bridge;
}

static int valid_utf8(const unsigned char *text, size_t length) {
    for (size_t i = 0; i < length;) {
        unsigned first = text[i++], count, lo = 0x80, hi = 0xbf;
        if (first < 0x80) continue;
        if (first >= 0xc2 && first <= 0xdf) count = 1;
        else if (first >= 0xe0 && first <= 0xef) {
            count = 2;
            if (first == 0xe0) lo = 0xa0;
            if (first == 0xed) hi = 0x9f;
        } else if (first >= 0xf0 && first <= 0xf4) {
            count = 3;
            if (first == 0xf0) lo = 0x90;
            if (first == 0xf4) hi = 0x8f;
        } else return 0;
        if (length - i < count || text[i] < lo || text[i] > hi) return 0;
        i++;
        while (--count) {
            if (text[i] < 0x80 || text[i] > 0xbf) return 0;
            i++;
        }
    }
    return 1;
}

typedef struct {
    size_t bytes;
    int nodes;
    void *ancestors[17];
} Budget;

static value copy_string(Bridge *bridge, JSValueConst string, Budget *budget) {
    CAMLparam0();
    CAMLlocal1(copy);
    size_t length;
    const char *text = JS_ToCStringLen(bridge->context, &length, string);
    if (!text) { bridge->error = RESOURCE; CAMLreturn(Val_unit); }
    budget->bytes += length;
    if (length > bridge->string_limit || budget->bytes > bridge->message_limit)
        bridge->error = RESOURCE;
    else if (!valid_utf8((const unsigned char *)text, length)) bridge->error = INVALID;
    if (bridge->error >= 0) {
        JS_FreeCString(bridge->context, text);
        CAMLreturn(Val_unit);
    }
    copy = caml_alloc_initialized_string(length, text);
    JS_FreeCString(bridge->context, text);
    CAMLreturn(copy);
}

static int own_data(Bridge *bridge, JSValueConst object, JSAtom key, JSValue *out) {
    JSPropertyDescriptor descriptor = {0, JS_UNDEFINED, JS_UNDEFINED, JS_UNDEFINED};
    int found = JS_GetOwnProperty(bridge->context, &descriptor, object, key);
    if (found != 1) {
        bridge->error = found < 0 ? RUNTIME : INVALID;
        return 0;
    }
    if ((descriptor.flags & JS_PROP_TMASK) != JS_PROP_NORMAL) {
        JS_FreeValue(bridge->context, descriptor.value);
        JS_FreeValue(bridge->context, descriptor.getter);
        JS_FreeValue(bridge->context, descriptor.setter);
        bridge->error = INVALID;
        return 0;
    }
    *out = descriptor.value;
    JS_FreeValue(bridge->context, descriptor.getter);
    JS_FreeValue(bridge->context, descriptor.setter);
    return 1;
}

/* Matches the portable Json.t constructor order, never engine object layouts. */
static value to_json(Bridge *bridge, JSValueConst input, int depth, Budget *budget) {
    CAMLparam0();
    CAMLlocal5(output, body, child, pair, key_copy);
    JSContext *context = bridge->context;
    if (++budget->nodes > bridge->node_limit || depth > bridge->depth_limit ||
        (budget->bytes += 16) > bridge->message_limit) {
        bridge->error = RESOURCE;
        CAMLreturn(Val_unit);
    }
    if (JS_IsNull(input)) CAMLreturn(Val_int(0));
    if (JS_IsBool(input)) {
        output = caml_alloc(1, 0);
        Store_field(output, 0, Val_bool(JS_ToBool(context, input)));
        CAMLreturn(output);
    }
    if (JS_IsNumber(input)) {
        double number;
        if (JS_ToFloat64(context, &number, input) < 0 || !isfinite(number)) {
            bridge->error = INVALID;
            CAMLreturn(Val_unit);
        }
        body = caml_copy_double(number);
        output = caml_alloc(1, 1);
        Store_field(output, 0, body);
        CAMLreturn(output);
    }
    if (JS_IsString(input)) {
        body = copy_string(bridge, input, budget);
        if (bridge->error >= 0) CAMLreturn(Val_unit);
        output = caml_alloc(1, 2);
        Store_field(output, 0, body);
        CAMLreturn(output);
    }
    JSClassID class_id = JS_GetClassID(input);
    int array = class_id == bridge->array_class;
    if (!array && class_id != bridge->object_class) {
        bridge->error = INVALID;
        CAMLreturn(Val_unit);
    }
    void *pointer = JS_VALUE_GET_PTR(input);
    for (int i = 0; i < depth; i++) if (budget->ancestors[i] == pointer) {
        bridge->error = INVALID;
        CAMLreturn(Val_unit);
    }
    budget->ancestors[depth] = pointer;
    JSValue prototype = JS_GetPrototype(context, input);
    JSValue expected = array ? bridge->array_proto : bridge->object_proto;
    int valid = (!array && JS_IsNull(prototype)) ||
        (JS_IsObject(prototype) && JS_VALUE_GET_PTR(prototype) == JS_VALUE_GET_PTR(expected));
    JS_FreeValue(context, prototype);
    if (!valid) { bridge->error = INVALID; CAMLreturn(Val_unit); }
    JSPropertyEnum *properties;
    uint32_t count;
    if (JS_GetOwnPropertyNames(context, &properties, &count, input,
                              JS_GPN_STRING_MASK | JS_GPN_SYMBOL_MASK) < 0) {
        bridge->error = RESOURCE;
        CAMLreturn(Val_unit);
    }
    if (count > (uint32_t)bridge->node_limit) bridge->error = RESOURCE;
    body = Val_emptylist;
    if (bridge->error < 0 && array) {
        JSAtom atom = JS_NewAtom(context, "length");
        JSValue length_value = JS_UNDEFINED;
        uint32_t length = 0;
        if (own_data(bridge, input, atom, &length_value)) {
            if (!JS_IsNumber(length_value) || JS_ToUint32(context, &length, length_value) < 0)
                bridge->error = INVALID;
            JS_FreeValue(context, length_value);
        }
        JS_FreeAtom(context, atom);
        if (length > (uint32_t)bridge->node_limit) bridge->error = RESOURCE;
        else if (count != length + 1) bridge->error = INVALID;
        if (bridge->error < 0) {
            body = caml_alloc(length, 0);
            for (uint32_t i = 0; i < length; i++) Store_field(body, i, Val_unit);
            for (uint32_t i = 0; i < length && bridge->error < 0; i++) {
                JSAtom index = JS_NewAtomUInt32(context, i);
                JSValue element;
                if (own_data(bridge, input, index, &element)) {
                    child = to_json(bridge, element, depth + 1, budget);
                    JS_FreeValue(context, element);
                    Store_field(body, i, child);
                }
                JS_FreeAtom(context, index);
            }
        }
    } else if (bridge->error < 0) {
        for (uint32_t i = count; i > 0 && bridge->error < 0; i--) {
            JSAtom atom = properties[i - 1].atom;
            JSValue key = JS_AtomToValue(context, atom), element;
            if (!JS_IsString(key)) bridge->error = INVALID;
            else key_copy = copy_string(bridge, key, budget);
            JS_FreeValue(context, key);
            if (bridge->error < 0 && own_data(bridge, input, atom, &element)) {
                child = to_json(bridge, element, depth + 1, budget);
                JS_FreeValue(context, element);
                pair = caml_alloc_tuple(2);
                Store_field(pair, 0, key_copy);
                Store_field(pair, 1, child);
                output = caml_alloc_tuple(2);
                Store_field(output, 0, pair);
                Store_field(output, 1, body);
                body = output;
            }
        }
    }
    JS_FreePropertyEnum(context, properties, count);
    if (bridge->error >= 0) CAMLreturn(Val_unit);
    output = caml_alloc(1, array ? 3 : 4);
    Store_field(output, 0, body);
    CAMLreturn(output);
}

static JSValue from_json(JSContext *context, value input) {
    if (Is_long(input)) return JS_NULL;
    value body = Field(input, 0);
    switch (Tag_val(input)) {
    case 0: return JS_NewBool(context, Bool_val(body));
    case 1: return JS_NewFloat64(context, Double_val(body));
    case 2: return JS_NewStringLen(context, String_val(body), caml_string_length(body));
    case 3: {
        JSValue array = JS_NewArray(context);
        if (JS_IsException(array)) return array;
        for (mlsize_t i = 0; i < Wosize_val(body); i++) {
            JSValue child = from_json(context, Field(body, i));
            if (JS_IsException(child) || JS_DefinePropertyValueUint32(context, array, i, child,
                    JS_PROP_ENUMERABLE) < 0) { JS_FreeValue(context, array); return JS_EXCEPTION; }
        }
        return array;
    }
    case 4: {
        JSValue object = JS_NewObjectProto(context, JS_NULL);
        if (JS_IsException(object)) return object;
        for (; Is_block(body); body = Field(body, 1)) {
            value pair = Field(body, 0), key = Field(pair, 0);
            JSAtom atom = JS_NewAtomLen(context, String_val(key), caml_string_length(key));
            JSValue child = from_json(context, Field(pair, 1));
            int ok = JS_IsException(child) ? -1 : JS_DefinePropertyValue(context, object,
                atom, child, JS_PROP_ENUMERABLE);
            JS_FreeAtom(context, atom);
            if (ok < 0) { JS_FreeValue(context, object); return JS_EXCEPTION; }
        }
        JS_PreventExtensions(context, object);
        return object;
    }
    default: return JS_ThrowInternalError(context, "Invalid host value");
    }
}

static JSModuleDef *deny_module(JSContext *context, const char *name, void *opaque) {
    (void)name;
    Bridge *bridge = opaque;
    bridge->error = UNSUPPORTED;
    JS_ThrowTypeError(context, "Plugin imports are unavailable");
    return NULL;
}

static JSValue read_context(JSContext *context, JSValueConst this_value, int argc,
                            JSValueConst *argv, int magic, JSValue *data) {
    (void)this_value; (void)argv; (void)magic;
    Bridge *bridge = JS_GetContextOpaque(context);
    if (argc != 0) return JS_ThrowTypeError(context, "getEditingContext takes no arguments");
    if (!bridge->active || JS_VALUE_GET_INT(data[0]) != bridge->epoch)
        return JS_Throw(context, JS_NewString(context, error_names[CANCELLED]));
    if (bridge->calls >= MAX_CALLS || bridge->next_request == INT_MAX) {
        bridge->error = RESOURCE;
        return JS_ThrowInternalError(context, "Plugin request budget exhausted");
    }
    int index = 0;
    while (index < MAX_CALLS && bridge->pending[index].state) index++;
    if (index == MAX_CALLS) { bridge->error = RESOURCE; return JS_ThrowOutOfMemory(context); }
    JSValue functions[2];
    JSValue promise = JS_NewPromiseCapability(context, functions);
    if (JS_IsException(promise)) { bridge->error = RESOURCE; return promise; }
    bridge->pending[index] = (Pending){1, ++bridge->next_request, functions[0], functions[1]};
    bridge->calls++;
    return promise;
}

CAMLprim value logseq_quickjs_create(value limits) {
    CAMLparam1(limits);
    CAMLlocal1(handle);
    if (Wosize_val(limits) != 8 || Int_val(Field(limits, 6)) > 16 ||
        Int_val(Field(limits, 7)) != MAX_CALLS) caml_invalid_argument("QuickJS limits");
    drain_retired();
    handle = caml_alloc_custom_mem(&operations, sizeof(Bridge *), 24 * 1024 * 1024);
    *(Bridge **)Data_custom_val(handle) = NULL;
    Bridge *bridge = calloc(1, sizeof(*bridge));
    if (!bridge) caml_raise_out_of_memory();
    bridge->owner = pthread_self();
    bridge->error = -1;
    bridge->handler = bridge->result = bridge->object_proto = bridge->array_proto = JS_UNDEFINED;
    *(Bridge **)Data_custom_val(handle) = bridge;
    bridge->source_limit = Long_val(Field(limits, 2));
    bridge->message_limit = Long_val(Field(limits, 3));
    bridge->string_limit = Long_val(Field(limits, 4));
    bridge->node_limit = Int_val(Field(limits, 5));
    bridge->depth_limit = Int_val(Field(limits, 6));
    bridge->runtime = JS_NewRuntime();
    if (!bridge->runtime) goto failed;
    JS_SetMemoryLimit(bridge->runtime, Long_val(Field(limits, 0)));
    JS_SetMaxStackSize(bridge->runtime, Long_val(Field(limits, 1)));
    JS_SetInterruptHandler(bridge->runtime, interrupt, bridge);
    JS_SetModuleLoaderFunc(bridge->runtime, NULL, deny_module, bridge);
    bridge->wall_deadline = monotonic() + 1;
    bridge->deadline = monotonic() + 0.1;
    bridge->context = JS_NewContext(bridge->runtime);
    if (!bridge->context) goto failed;
    JS_SetContextOpaque(bridge->context, bridge);
    JSValue global = JS_GetGlobalObject(bridge->context);
    /* Native blocking waits cannot be preempted by the bytecode interrupt hook. */
    int hidden = JS_DefinePropertyValueStr(bridge->context, global, "Atomics", JS_UNDEFINED, 0);
    hidden |= JS_DefinePropertyValueStr(bridge->context, global, "SharedArrayBuffer", JS_UNDEFINED, 0);
    JS_FreeValue(bridge->context, global);
    if (hidden < 0) goto failed;
    JSValue object = JS_NewObject(bridge->context), array = JS_NewArray(bridge->context);
    if (JS_IsException(object) || JS_IsException(array)) {
        JS_FreeValue(bridge->context, object); JS_FreeValue(bridge->context, array);
        goto failed;
    }
    bridge->object_class = JS_GetClassID(object);
    bridge->array_class = JS_GetClassID(array);
    bridge->object_proto = JS_GetPrototype(bridge->context, object);
    bridge->array_proto = JS_GetPrototype(bridge->context, array);
    JS_FreeValue(bridge->context, object); JS_FreeValue(bridge->context, array);
    CAMLreturn(handle);
failed:
    *(Bridge **)Data_custom_val(handle) = NULL;
    destroy(bridge);
    caml_failwith("QuickJS initialization failed");
}

CAMLprim value logseq_quickjs_load(value handle, value source) {
    CAMLparam2(handle, source);
    Bridge *bridge = owned(handle);
    if (!JS_IsUndefined(bridge->handler)) CAMLreturn(Val_int(INVALID + 1));
    size_t length = caml_string_length(source);
    if (length > bridge->source_limit) CAMLreturn(Val_int(RESOURCE + 1));
    if (!valid_utf8((const unsigned char *)String_val(source), length)) CAMLreturn(Val_int(INVALID + 1));
    bridge->wall_deadline = monotonic() + 1;
    double before = enter(bridge, 0.1);
    JSValue module = JS_Eval(bridge->context, String_val(source), length, "plugin.mjs",
                            JS_EVAL_TYPE_MODULE | JS_EVAL_FLAG_COMPILE_ONLY);
    if (!JS_IsException(module)) {
        JSModuleDef *definition = JS_VALUE_GET_PTR(module);
        JSValue result = JS_EvalFunction(bridge->context, module);
        if (JS_IsException(result)) bridge->error = RUNTIME;
        else if (JS_PromiseState(bridge->context, result) == JS_PROMISE_PENDING)
            bridge->error = UNSUPPORTED;
        else if (JS_PromiseState(bridge->context, result) == JS_PROMISE_REJECTED)
            bridge->error = RUNTIME;
        else {
            JSValue space = JS_GetModuleNamespace(bridge->context, definition);
            if (JS_IsException(space)) bridge->error = RESOURCE;
            else {
                bridge->handler = JS_GetPropertyStr(bridge->context, space, "run");
                if (!JS_IsFunction(bridge->context, bridge->handler)) bridge->error = INVALID;
            }
            JS_FreeValue(bridge->context, space);
        }
        JS_FreeValue(bridge->context, result);
    } else if (bridge->error < 0) bridge->error = RUNTIME;
    leave(bridge, before);
    if (bridge->error >= 0) clear_exception(bridge);
    CAMLreturn(Val_int(bridge->error + 1));
}

CAMLprim value logseq_quickjs_start(value handle) {
    CAMLparam1(handle);
    Bridge *bridge = owned(handle);
    if (bridge->active || JS_IsUndefined(bridge->handler)) CAMLreturn(Val_int(INVALID + 1));
    if (bridge->epoch == INT_MAX) CAMLreturn(Val_int(RESOURCE + 1));
    bridge->epoch++;
    bridge->active = 1;
    bridge->calls = 0;
    bridge->execution = 0;
    bridge->wall_deadline = monotonic() + 1;
    double before = enter(bridge, 0.005);
    JSValue token = JS_NewInt32(bridge->context, bridge->epoch);
    JSValue function = JS_NewCFunctionData(bridge->context, read_context, 0, 0, 1, &token);
    JSValue host = JS_NewObjectProto(bridge->context, JS_NULL);
    if (JS_IsException(function) || JS_IsException(host)) {
        JS_FreeValue(bridge->context, function); bridge->error = RESOURCE;
    } else if (JS_DefinePropertyValueStr(bridge->context, host, "getEditingContext", function,
                                       JS_PROP_ENUMERABLE) < 0)
        bridge->error = RESOURCE;
    else {
        JS_PreventExtensions(bridge->context, host);
        bridge->result = JS_Call(bridge->context, bridge->handler, JS_UNDEFINED, 1, &host);
        if (JS_IsException(bridge->result)) bridge->error = RUNTIME;
    }
    JS_FreeValue(bridge->context, host);
    leave(bridge, before);
    if (bridge->error >= 0) clear_exception(bridge);
    CAMLreturn(Val_int(bridge->error + 1));
}

static value failed_event(int error) {
    CAMLparam0(); CAMLlocal1(event);
    event = caml_alloc(1, 2); Store_field(event, 0, Val_int(error));
    CAMLreturn(event);
}

CAMLprim value logseq_quickjs_poll(value handle) {
    CAMLparam1(handle);
    CAMLlocal2(event, payload);
    Bridge *bridge = owned(handle);
    double before = enter(bridge, 0.005);
    JSContext *job_context;
    for (int count = 0; count < 32 && bridge->error < 0 &&
         monotonic() < bridge->deadline && JS_IsJobPending(bridge->runtime); count++) {
        if (JS_ExecutePendingJob(bridge->runtime, &job_context) < 0) {
            bridge->error = RUNTIME;
            clear_exception(bridge);
        }
    }
    leave(bridge, before);
    if (bridge->error >= 0) CAMLreturn(failed_event(bridge->error));
    for (int i = 0; i < MAX_CALLS; i++) if (bridge->pending[i].state == 1) {
        bridge->pending[i].state = 2;
        event = caml_alloc(1, 0);
        Store_field(event, 0, Val_int(bridge->pending[i].id));
        CAMLreturn(event);
    }
    int state = JS_PromiseState(bridge->context, bridge->result);
    if (state == JS_PROMISE_PENDING) CAMLreturn(Val_int(0));
    JSValue result = state < 0 ? JS_DupValue(bridge->context, bridge->result)
                              : JS_PromiseResult(bridge->context, bridge->result);
    if (state == JS_PROMISE_REJECTED) {
        bridge->error = RUNTIME;
        classify_error(bridge, result);
        JS_FreeValue(bridge->context, result);
        CAMLreturn(failed_event(bridge->error));
    }
    Budget budget = {0};
    payload = to_json(bridge, result, 0, &budget);
    JS_FreeValue(bridge->context, result);
    if (bridge->error >= 0) CAMLreturn(failed_event(bridge->error));
    event = caml_alloc(1, 1); Store_field(event, 0, payload);
    CAMLreturn(event);
}

CAMLprim value logseq_quickjs_complete(value handle, value request, value success, value payload) {
    CAMLparam4(handle, request, success, payload);
    Bridge *bridge = owned(handle);
    for (int i = 0; i < MAX_CALLS; i++) {
        Pending *pending = &bridge->pending[i];
        if (pending->state == 2 && pending->id == Int_val(request)) {
            double before = enter(bridge, 0.005);
            JSValue argument = from_json(bridge->context, payload);
            JSValue function = Bool_val(success) ? pending->resolve : pending->reject;
            JSValue result = JS_IsException(argument) ? JS_EXCEPTION :
                JS_Call(bridge->context, function, JS_UNDEFINED, 1, &argument);
            JS_FreeValue(bridge->context, argument);
            if (JS_IsException(result)) { bridge->error = RUNTIME; clear_exception(bridge); }
            JS_FreeValue(bridge->context, result);
            JS_FreeValue(bridge->context, pending->resolve);
            JS_FreeValue(bridge->context, pending->reject);
            pending->state = 0;
            leave(bridge, before);
            break;
        }
    }
    CAMLreturn(Val_unit);
}

CAMLprim value logseq_quickjs_stop(value handle) {
    CAMLparam1(handle);
    stop(owned(handle));
    CAMLreturn(Val_unit);
}

CAMLprim value logseq_quickjs_close(value handle) {
    CAMLparam1(handle);
    if (*(Bridge **)Data_custom_val(handle)) {
        Bridge *bridge = owned(handle);
        *(Bridge **)Data_custom_val(handle) = NULL;
        destroy(bridge);
    }
    CAMLreturn(Val_unit);
}
