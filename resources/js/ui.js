(() => {
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}
function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
var $parcel$global =
typeof globalThis !== 'undefined'
  ? globalThis
  : typeof self !== 'undefined'
  ? self
  : typeof window !== 'undefined'
  ? window
  : typeof global !== 'undefined'
  ? global
  : {};
var $parcel$modules = {};
var $parcel$inits = {};

var parcelRequire = $parcel$global["parcelRequired5b2"];
if (parcelRequire == null) {
  parcelRequire = function(id) {
    if (id in $parcel$modules) {
      return $parcel$modules[id].exports;
    }
    if (id in $parcel$inits) {
      var init = $parcel$inits[id];
      delete $parcel$inits[id];
      var module = {id: id, exports: {}};
      $parcel$modules[id] = module;
      init.call(module.exports, module, module.exports);
      return module.exports;
    }
    var err = new Error("Cannot find module '" + id + "'");
    err.code = 'MODULE_NOT_FOUND';
    throw err;
  };

  parcelRequire.register = function register(id, init) {
    $parcel$inits[id] = init;
  };

  $parcel$global["parcelRequired5b2"] = parcelRequire;
}
parcelRequire.register("aYyoK", function(module, exports) {

$parcel$export(module.exports, "Fragment", () => $7fda30c02a4f122f$export$ffb0004e005737fa, (v) => $7fda30c02a4f122f$export$ffb0004e005737fa = v);
$parcel$export(module.exports, "jsx", () => $7fda30c02a4f122f$export$34b9dba7ce09269b, (v) => $7fda30c02a4f122f$export$34b9dba7ce09269b = v);
$parcel$export(module.exports, "jsxs", () => $7fda30c02a4f122f$export$25062201e9e25d76, (v) => $7fda30c02a4f122f$export$25062201e9e25d76 = v);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var $7fda30c02a4f122f$export$ffb0004e005737fa;
var $7fda30c02a4f122f$export$34b9dba7ce09269b;
var $7fda30c02a4f122f$export$25062201e9e25d76;
"use strict";

var $LI8jA = parcelRequire("LI8jA");
var $7fda30c02a4f122f$var$k = Symbol.for("react.element"), $7fda30c02a4f122f$var$l = Symbol.for("react.fragment"), $7fda30c02a4f122f$var$m = Object.prototype.hasOwnProperty, $7fda30c02a4f122f$var$n = $LI8jA.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, $7fda30c02a4f122f$var$p = {
    key: !0,
    ref: !0,
    __self: !0,
    __source: !0
};
function $7fda30c02a4f122f$var$q(c, a, g) {
    var b, d = {}, e = null, h = null;
    void 0 !== g && (e = "" + g);
    void 0 !== a.key && (e = "" + a.key);
    void 0 !== a.ref && (h = a.ref);
    for(b in a)$7fda30c02a4f122f$var$m.call(a, b) && !$7fda30c02a4f122f$var$p.hasOwnProperty(b) && (d[b] = a[b]);
    if (c && c.defaultProps) for(b in a = c.defaultProps, a)void 0 === d[b] && (d[b] = a[b]);
    return {
        $$typeof: $7fda30c02a4f122f$var$k,
        type: c,
        key: e,
        ref: h,
        props: d,
        _owner: $7fda30c02a4f122f$var$n.current
    };
}
$7fda30c02a4f122f$export$ffb0004e005737fa = $7fda30c02a4f122f$var$l;
$7fda30c02a4f122f$export$34b9dba7ce09269b = $7fda30c02a4f122f$var$q;
$7fda30c02a4f122f$export$25062201e9e25d76 = $7fda30c02a4f122f$var$q;

});
parcelRequire.register("LI8jA", function(module, exports) {
module.exports = React;

});



var $59024eba873adb50$exports = {};
"use strict";

$59024eba873adb50$exports = (parcelRequire("aYyoK"));



var $LI8jA = parcelRequire("LI8jA");
function $03526de71b5892e9$export$2e2bcd8739ae039() {
    $03526de71b5892e9$export$2e2bcd8739ae039 = Object.assign ? Object.assign.bind() : function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source)if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
        }
        return target;
    };
    return $03526de71b5892e9$export$2e2bcd8739ae039.apply(this, arguments);
}



var $LI8jA = parcelRequire("LI8jA");

var $LI8jA = parcelRequire("LI8jA");
/**
 * Set a given ref to a given value
 * This utility takes care of different types of refs: callback refs and RefObject(s)
 */ function $7ec60ad3718be6bb$var$$6ed0406888f73fc4$var$setRef(ref, value) {
    if (typeof ref === "function") ref(value);
    else if (ref !== null && ref !== undefined) ref.current = value;
}
/**
 * A utility to compose multiple refs together
 * Accepts callback refs and RefObject(s)
 */ function $7ec60ad3718be6bb$export$43e446d32b3d21af(...refs) {
    return (node)=>refs.forEach((ref)=>$7ec60ad3718be6bb$var$$6ed0406888f73fc4$var$setRef(ref, node));
}
/**
 * A custom hook that composes multiple refs
 * Accepts callback refs and RefObject(s)
 */ function $7ec60ad3718be6bb$export$c7b2cbe3552a0d05(...refs) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return (0, $LI8jA.useCallback)($7ec60ad3718be6bb$export$43e446d32b3d21af(...refs), refs);
}


/* -------------------------------------------------------------------------------------------------
 * Slot
 * -----------------------------------------------------------------------------------------------*/ const $db045af315cca07a$export$8c6ed5c666ac1360 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { children: children , ...slotProps } = props;
    const childrenArray = (0, $LI8jA.Children).toArray(children);
    const slottable = childrenArray.find($db045af315cca07a$var$$5e63c961fc1ce211$var$isSlottable);
    if (slottable) {
        // the new element to render is the one passed as a child of `Slottable`
        const newElement = slottable.props.children;
        const newChildren = childrenArray.map((child)=>{
            if (child === slottable) {
                // because the new element will be the one rendered, we are only interested
                // in grabbing its children (`newElement.props.children`)
                if ((0, $LI8jA.Children).count(newElement) > 1) return (0, $LI8jA.Children).only(null);
                return /*#__PURE__*/ (0, $LI8jA.isValidElement)(newElement) ? newElement.props.children : null;
            } else return child;
        });
        return /*#__PURE__*/ (0, $LI8jA.createElement)($db045af315cca07a$var$$5e63c961fc1ce211$var$SlotClone, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, slotProps, {
            ref: forwardedRef
        }), /*#__PURE__*/ (0, $LI8jA.isValidElement)(newElement) ? /*#__PURE__*/ (0, $LI8jA.cloneElement)(newElement, undefined, newChildren) : null);
    }
    return /*#__PURE__*/ (0, $LI8jA.createElement)($db045af315cca07a$var$$5e63c961fc1ce211$var$SlotClone, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, slotProps, {
        ref: forwardedRef
    }), children);
});
$db045af315cca07a$export$8c6ed5c666ac1360.displayName = "Slot";
/* -------------------------------------------------------------------------------------------------
 * SlotClone
 * -----------------------------------------------------------------------------------------------*/ const $db045af315cca07a$var$$5e63c961fc1ce211$var$SlotClone = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { children: children , ...slotProps } = props;
    if (/*#__PURE__*/ (0, $LI8jA.isValidElement)(children)) return /*#__PURE__*/ (0, $LI8jA.cloneElement)(children, {
        ...$db045af315cca07a$var$$5e63c961fc1ce211$var$mergeProps(slotProps, children.props),
        ref: forwardedRef ? (0, $7ec60ad3718be6bb$export$43e446d32b3d21af)(forwardedRef, children.ref) : children.ref
    });
    return (0, $LI8jA.Children).count(children) > 1 ? (0, $LI8jA.Children).only(null) : null;
});
$db045af315cca07a$var$$5e63c961fc1ce211$var$SlotClone.displayName = "SlotClone";
/* -------------------------------------------------------------------------------------------------
 * Slottable
 * -----------------------------------------------------------------------------------------------*/ const $db045af315cca07a$export$d9f1ccf0bdb05d45 = ({ children: children  })=>{
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $LI8jA.Fragment), null, children);
};
/* ---------------------------------------------------------------------------------------------- */ function $db045af315cca07a$var$$5e63c961fc1ce211$var$isSlottable(child) {
    return /*#__PURE__*/ (0, $LI8jA.isValidElement)(child) && child.type === $db045af315cca07a$export$d9f1ccf0bdb05d45;
}
function $db045af315cca07a$var$$5e63c961fc1ce211$var$mergeProps(slotProps, childProps) {
    // all child props should override
    const overrideProps = {
        ...childProps
    };
    for(const propName in childProps){
        const slotPropValue = slotProps[propName];
        const childPropValue = childProps[propName];
        const isHandler = /^on[A-Z]/.test(propName);
        if (isHandler) {
            // if the handler exists on both, we compose them
            if (slotPropValue && childPropValue) overrideProps[propName] = (...args)=>{
                childPropValue(...args);
                slotPropValue(...args);
            };
            else if (slotPropValue) overrideProps[propName] = slotPropValue;
        } else if (propName === "style") overrideProps[propName] = {
            ...slotPropValue,
            ...childPropValue
        };
        else if (propName === "className") overrideProps[propName] = [
            slotPropValue,
            childPropValue
        ].filter(Boolean).join(" ");
    }
    return {
        ...slotProps,
        ...overrideProps
    };
}
const $db045af315cca07a$export$be92b6f5f03c0fe9 = $db045af315cca07a$export$8c6ed5c666ac1360;


function $e082dca22ab0acc4$var$r(e) {
    var t, f, n = "";
    if ("string" == typeof e || "number" == typeof e) n += e;
    else if ("object" == typeof e) {
        if (Array.isArray(e)) for(t = 0; t < e.length; t++)e[t] && (f = $e082dca22ab0acc4$var$r(e[t])) && (n && (n += " "), n += f);
        else for(t in e)e[t] && (n && (n += " "), n += t);
    }
    return n;
}
function $e082dca22ab0acc4$export$4f5d2d50c9deca37() {
    for(var e, t, f = 0, n = ""; f < arguments.length;)(e = arguments[f++]) && (t = $e082dca22ab0acc4$var$r(e)) && (n && (n += " "), n += t);
    return n;
}
var $e082dca22ab0acc4$export$2e2bcd8739ae039 = $e082dca22ab0acc4$export$4f5d2d50c9deca37;


const $591c8f71196a9028$var$falsyToString = (value)=>typeof value === "boolean" ? "".concat(value) : value === 0 ? "0" : value;
const $591c8f71196a9028$export$a274e22fb40f762e = (0, $e082dca22ab0acc4$export$4f5d2d50c9deca37);
const $591c8f71196a9028$export$87dc52566e90b739 = (base, config)=>{
    return (props)=>{
        var ref;
        if ((config === null || config === void 0 ? void 0 : config.variants) == null) return $591c8f71196a9028$export$a274e22fb40f762e(base, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
        const { variants: variants , defaultVariants: defaultVariants  } = config;
        const getVariantClassNames = Object.keys(variants).map((variant)=>{
            const variantProp = props === null || props === void 0 ? void 0 : props[variant];
            const defaultVariantProp = defaultVariants === null || defaultVariants === void 0 ? void 0 : defaultVariants[variant];
            if (variantProp === null) return null;
            const variantKey = $591c8f71196a9028$var$falsyToString(variantProp) || $591c8f71196a9028$var$falsyToString(defaultVariantProp);
            return variants[variant][variantKey];
        });
        const propsWithoutUndefined = props && Object.entries(props).reduce((acc, param)=>{
            let [key, value] = param;
            if (value === undefined) return acc;
            acc[key] = value;
            return acc;
        }, {});
        const getCompoundVariantClassNames = config === null || config === void 0 ? void 0 : (ref = config.compoundVariants) === null || ref === void 0 ? void 0 : ref.reduce((acc, param1)=>{
            let { class: cvClass , className: cvClassName , ...compoundVariantOptions } = param1;
            return Object.entries(compoundVariantOptions).every((param)=>{
                let [key, value] = param;
                return Array.isArray(value) ? value.includes({
                    ...defaultVariants,
                    ...propsWithoutUndefined
                }[key]) : ({
                    ...defaultVariants,
                    ...propsWithoutUndefined
                })[key] === value;
            }) ? [
                ...acc,
                cvClass,
                cvClassName
            ] : acc;
        }, []);
        return $591c8f71196a9028$export$a274e22fb40f762e(base, getVariantClassNames, getCompoundVariantClassNames, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
    };
};



var $ebdd34506b80ff8e$exports = {};
"use strict";
Object.defineProperty($ebdd34506b80ff8e$exports, Symbol.toStringTag, {
    value: "Module"
});
const $ebdd34506b80ff8e$var$CLASS_PART_SEPARATOR = "-";
function $ebdd34506b80ff8e$var$createClassUtils(config) {
    const classMap = $ebdd34506b80ff8e$var$createClassMap(config);
    const { conflictingClassGroups: conflictingClassGroups , conflictingClassGroupModifiers: conflictingClassGroupModifiers  } = config;
    function getClassGroupId(className) {
        const classParts = className.split($ebdd34506b80ff8e$var$CLASS_PART_SEPARATOR);
        // Classes like `-inset-1` produce an empty string as first classPart. We assume that classes for negative values are used correctly and remove it from classParts.
        if (classParts[0] === "" && classParts.length !== 1) classParts.shift();
        return $ebdd34506b80ff8e$var$getGroupRecursive(classParts, classMap) || $ebdd34506b80ff8e$var$getGroupIdForArbitraryProperty(className);
    }
    function getConflictingClassGroupIds(classGroupId, hasPostfixModifier) {
        const conflicts = conflictingClassGroups[classGroupId] || [];
        if (hasPostfixModifier && conflictingClassGroupModifiers[classGroupId]) return [
            ...conflicts,
            ...conflictingClassGroupModifiers[classGroupId]
        ];
        return conflicts;
    }
    return {
        getClassGroupId: getClassGroupId,
        getConflictingClassGroupIds: getConflictingClassGroupIds
    };
}
function $ebdd34506b80ff8e$var$getGroupRecursive(classParts, classPartObject) {
    if (classParts.length === 0) return classPartObject.classGroupId;
    const currentClassPart = classParts[0];
    const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
    const classGroupFromNextClassPart = nextClassPartObject ? $ebdd34506b80ff8e$var$getGroupRecursive(classParts.slice(1), nextClassPartObject) : undefined;
    if (classGroupFromNextClassPart) return classGroupFromNextClassPart;
    if (classPartObject.validators.length === 0) return undefined;
    const classRest = classParts.join($ebdd34506b80ff8e$var$CLASS_PART_SEPARATOR);
    return classPartObject.validators.find(({ validator: validator  })=>validator(classRest))?.classGroupId;
}
const $ebdd34506b80ff8e$var$arbitraryPropertyRegex = /^\[(.+)\]$/;
function $ebdd34506b80ff8e$var$getGroupIdForArbitraryProperty(className) {
    if ($ebdd34506b80ff8e$var$arbitraryPropertyRegex.test(className)) {
        const arbitraryPropertyClassName = $ebdd34506b80ff8e$var$arbitraryPropertyRegex.exec(className)[1];
        const property = arbitraryPropertyClassName?.substring(0, arbitraryPropertyClassName.indexOf(":"));
        if (property) // I use two dots here because one dot is used as prefix for class groups in plugins
        return "arbitrary.." + property;
    }
}
/**
 * Exported for testing only
 */ function $ebdd34506b80ff8e$var$createClassMap(config) {
    const { theme: theme , prefix: prefix  } = config;
    const classMap = {
        nextPart: new Map(),
        validators: []
    };
    const prefixedClassGroupEntries = $ebdd34506b80ff8e$var$getPrefixedClassGroupEntries(Object.entries(config.classGroups), prefix);
    prefixedClassGroupEntries.forEach(([classGroupId, classGroup])=>{
        $ebdd34506b80ff8e$var$processClassesRecursively(classGroup, classMap, classGroupId, theme);
    });
    return classMap;
}
function $ebdd34506b80ff8e$var$processClassesRecursively(classGroup, classPartObject, classGroupId, theme) {
    classGroup.forEach((classDefinition)=>{
        if (typeof classDefinition === "string") {
            const classPartObjectToEdit = classDefinition === "" ? classPartObject : $ebdd34506b80ff8e$var$getPart(classPartObject, classDefinition);
            classPartObjectToEdit.classGroupId = classGroupId;
            return;
        }
        if (typeof classDefinition === "function") {
            if ($ebdd34506b80ff8e$var$isThemeGetter(classDefinition)) {
                $ebdd34506b80ff8e$var$processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
                return;
            }
            classPartObject.validators.push({
                validator: classDefinition,
                classGroupId: classGroupId
            });
            return;
        }
        Object.entries(classDefinition).forEach(([key, classGroup])=>{
            $ebdd34506b80ff8e$var$processClassesRecursively(classGroup, $ebdd34506b80ff8e$var$getPart(classPartObject, key), classGroupId, theme);
        });
    });
}
function $ebdd34506b80ff8e$var$getPart(classPartObject, path) {
    let currentClassPartObject = classPartObject;
    path.split($ebdd34506b80ff8e$var$CLASS_PART_SEPARATOR).forEach((pathPart)=>{
        if (!currentClassPartObject.nextPart.has(pathPart)) currentClassPartObject.nextPart.set(pathPart, {
            nextPart: new Map(),
            validators: []
        });
        currentClassPartObject = currentClassPartObject.nextPart.get(pathPart);
    });
    return currentClassPartObject;
}
function $ebdd34506b80ff8e$var$isThemeGetter(func) {
    return func.isThemeGetter;
}
function $ebdd34506b80ff8e$var$getPrefixedClassGroupEntries(classGroupEntries, prefix) {
    if (!prefix) return classGroupEntries;
    return classGroupEntries.map(([classGroupId, classGroup])=>{
        const prefixedClassGroup = classGroup.map((classDefinition)=>{
            if (typeof classDefinition === "string") return prefix + classDefinition;
            if (typeof classDefinition === "object") return Object.fromEntries(Object.entries(classDefinition).map(([key, value])=>[
                    prefix + key,
                    value
                ]));
            return classDefinition;
        });
        return [
            classGroupId,
            prefixedClassGroup
        ];
    });
}
// LRU cache inspired from hashlru (https://github.com/dominictarr/hashlru/blob/v1.0.4/index.js) but object replaced with Map to improve performance
function $ebdd34506b80ff8e$var$createLruCache(maxCacheSize) {
    if (maxCacheSize < 1) return {
        get: ()=>undefined,
        set: ()=>{}
    };
    let cacheSize = 0;
    let cache = new Map();
    let previousCache = new Map();
    function update(key, value) {
        cache.set(key, value);
        cacheSize++;
        if (cacheSize > maxCacheSize) {
            cacheSize = 0;
            previousCache = cache;
            cache = new Map();
        }
    }
    return {
        get (key) {
            let value = cache.get(key);
            if (value !== undefined) return value;
            if ((value = previousCache.get(key)) !== undefined) {
                update(key, value);
                return value;
            }
        },
        set (key, value) {
            if (cache.has(key)) cache.set(key, value);
            else update(key, value);
        }
    };
}
const $ebdd34506b80ff8e$var$IMPORTANT_MODIFIER = "!";
function $ebdd34506b80ff8e$var$createSplitModifiers(config) {
    const separator = config.separator;
    const isSeparatorSingleCharacter = separator.length === 1;
    const firstSeparatorCharacter = separator[0];
    const separatorLength = separator.length;
    // splitModifiers inspired by https://github.com/tailwindlabs/tailwindcss/blob/v3.2.2/src/util/splitAtTopLevelOnly.js
    return function splitModifiers(className) {
        const modifiers = [];
        let bracketDepth = 0;
        let modifierStart = 0;
        let postfixModifierPosition;
        for(let index = 0; index < className.length; index++){
            let currentCharacter = className[index];
            if (bracketDepth === 0) {
                if (currentCharacter === firstSeparatorCharacter && (isSeparatorSingleCharacter || className.slice(index, index + separatorLength) === separator)) {
                    modifiers.push(className.slice(modifierStart, index));
                    modifierStart = index + separatorLength;
                    continue;
                }
                if (currentCharacter === "/") {
                    postfixModifierPosition = index;
                    continue;
                }
            }
            if (currentCharacter === "[") bracketDepth++;
            else if (currentCharacter === "]") bracketDepth--;
        }
        const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.substring(modifierStart);
        const hasImportantModifier = baseClassNameWithImportantModifier.startsWith($ebdd34506b80ff8e$var$IMPORTANT_MODIFIER);
        const baseClassName = hasImportantModifier ? baseClassNameWithImportantModifier.substring(1) : baseClassNameWithImportantModifier;
        const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : undefined;
        return {
            modifiers: modifiers,
            hasImportantModifier: hasImportantModifier,
            baseClassName: baseClassName,
            maybePostfixModifierPosition: maybePostfixModifierPosition
        };
    };
}
/**
 * Sorts modifiers according to following schema:
 * - Predefined modifiers are sorted alphabetically
 * - When an arbitrary variant appears, it must be preserved which modifiers are before and after it
 */ function $ebdd34506b80ff8e$var$sortModifiers(modifiers) {
    if (modifiers.length <= 1) return modifiers;
    const sortedModifiers = [];
    let unsortedModifiers = [];
    modifiers.forEach((modifier)=>{
        const isArbitraryVariant = modifier[0] === "[";
        if (isArbitraryVariant) {
            sortedModifiers.push(...unsortedModifiers.sort(), modifier);
            unsortedModifiers = [];
        } else unsortedModifiers.push(modifier);
    });
    sortedModifiers.push(...unsortedModifiers.sort());
    return sortedModifiers;
}
function $ebdd34506b80ff8e$var$createConfigUtils(config) {
    return {
        cache: $ebdd34506b80ff8e$var$createLruCache(config.cacheSize),
        splitModifiers: $ebdd34506b80ff8e$var$createSplitModifiers(config),
        ...$ebdd34506b80ff8e$var$createClassUtils(config)
    };
}
const $ebdd34506b80ff8e$var$SPLIT_CLASSES_REGEX = /\s+/;
function $ebdd34506b80ff8e$var$mergeClassList(classList, configUtils) {
    const { splitModifiers: splitModifiers , getClassGroupId: getClassGroupId , getConflictingClassGroupIds: getConflictingClassGroupIds  } = configUtils;
    /**
   * Set of classGroupIds in following format:
   * `{importantModifier}{variantModifiers}{classGroupId}`
   * @example 'float'
   * @example 'hover:focus:bg-color'
   * @example 'md:!pr'
   */ const classGroupsInConflict = new Set();
    return classList.trim().split($ebdd34506b80ff8e$var$SPLIT_CLASSES_REGEX).map((originalClassName)=>{
        const { modifiers: modifiers , hasImportantModifier: hasImportantModifier , baseClassName: baseClassName , maybePostfixModifierPosition: maybePostfixModifierPosition  } = splitModifiers(originalClassName);
        let classGroupId = getClassGroupId(maybePostfixModifierPosition ? baseClassName.substring(0, maybePostfixModifierPosition) : baseClassName);
        let hasPostfixModifier = Boolean(maybePostfixModifierPosition);
        if (!classGroupId) {
            if (!maybePostfixModifierPosition) return {
                isTailwindClass: false,
                originalClassName: originalClassName
            };
            classGroupId = getClassGroupId(baseClassName);
            if (!classGroupId) return {
                isTailwindClass: false,
                originalClassName: originalClassName
            };
            hasPostfixModifier = false;
        }
        const variantModifier = $ebdd34506b80ff8e$var$sortModifiers(modifiers).join(":");
        const modifierId = hasImportantModifier ? variantModifier + $ebdd34506b80ff8e$var$IMPORTANT_MODIFIER : variantModifier;
        return {
            isTailwindClass: true,
            modifierId: modifierId,
            classGroupId: classGroupId,
            originalClassName: originalClassName,
            hasPostfixModifier: hasPostfixModifier
        };
    }).reverse()// Last class in conflict wins, so we need to filter conflicting classes in reverse order.
    .filter((parsed)=>{
        if (!parsed.isTailwindClass) return true;
        const { modifierId: modifierId , classGroupId: classGroupId , hasPostfixModifier: hasPostfixModifier  } = parsed;
        const classId = modifierId + classGroupId;
        if (classGroupsInConflict.has(classId)) return false;
        classGroupsInConflict.add(classId);
        getConflictingClassGroupIds(classGroupId, hasPostfixModifier).forEach((group)=>classGroupsInConflict.add(modifierId + group));
        return true;
    }).reverse().map((parsed)=>parsed.originalClassName).join(" ");
}
/**
 * The code in this file is copied from https://github.com/lukeed/clsx and modified to suit the needs of tailwind-merge better.
 *
 * Specifically:
 * - Runtime code from https://github.com/lukeed/clsx/blob/v1.2.1/src/index.js
 * - TypeScript types from https://github.com/lukeed/clsx/blob/v1.2.1/clsx.d.ts
 *
 * Original code has MIT license: Copyright (c) Luke Edwards <luke.edwards05@gmail.com> (lukeed.com)
 */ function $ebdd34506b80ff8e$var$twJoin() {
    let index = 0;
    let argument;
    let resolvedValue;
    let string = "";
    while(index < arguments.length){
        if (argument = arguments[index++]) {
            if (resolvedValue = $ebdd34506b80ff8e$var$toValue(argument)) {
                string && (string += " ");
                string += resolvedValue;
            }
        }
    }
    return string;
}
function $ebdd34506b80ff8e$var$toValue(mix) {
    if (typeof mix === "string") return mix;
    let resolvedValue;
    let string = "";
    for(let k = 0; k < mix.length; k++){
        if (mix[k]) {
            if (resolvedValue = $ebdd34506b80ff8e$var$toValue(mix[k])) {
                string && (string += " ");
                string += resolvedValue;
            }
        }
    }
    return string;
}
function $ebdd34506b80ff8e$var$createTailwindMerge(createConfigFirst, ...createConfigRest) {
    let configUtils;
    let cacheGet;
    let cacheSet;
    let functionToCall = initTailwindMerge;
    function initTailwindMerge(classList) {
        const config = createConfigRest.reduce((previousConfig, createConfigCurrent)=>createConfigCurrent(previousConfig), createConfigFirst());
        configUtils = $ebdd34506b80ff8e$var$createConfigUtils(config);
        cacheGet = configUtils.cache.get;
        cacheSet = configUtils.cache.set;
        functionToCall = tailwindMerge;
        return tailwindMerge(classList);
    }
    function tailwindMerge(classList) {
        const cachedResult = cacheGet(classList);
        if (cachedResult) return cachedResult;
        const result = $ebdd34506b80ff8e$var$mergeClassList(classList, configUtils);
        cacheSet(classList, result);
        return result;
    }
    return function callTailwindMerge() {
        return functionToCall($ebdd34506b80ff8e$var$twJoin.apply(null, arguments));
    };
}
function $ebdd34506b80ff8e$var$fromTheme(key) {
    const themeGetter = (theme)=>theme[key] || [];
    themeGetter.isThemeGetter = true;
    return themeGetter;
}
const $ebdd34506b80ff8e$var$arbitraryValueRegex = /^\[(?:([a-z-]+):)?(.+)\]$/i;
const $ebdd34506b80ff8e$var$fractionRegex = /^\d+\/\d+$/;
const $ebdd34506b80ff8e$var$stringLengths = /*#__PURE__*/ new Set([
    "px",
    "full",
    "screen"
]);
const $ebdd34506b80ff8e$var$tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
const $ebdd34506b80ff8e$var$lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
// Shadow always begins with x and y offset separated by underscore
const $ebdd34506b80ff8e$var$shadowRegex = /^-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
const $ebdd34506b80ff8e$var$imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
function $ebdd34506b80ff8e$var$isLength(value) {
    return $ebdd34506b80ff8e$var$isNumber(value) || $ebdd34506b80ff8e$var$stringLengths.has(value) || $ebdd34506b80ff8e$var$fractionRegex.test(value);
}
function $ebdd34506b80ff8e$var$isArbitraryLength(value) {
    return $ebdd34506b80ff8e$var$getIsArbitraryValue(value, "length", $ebdd34506b80ff8e$var$isLengthOnly);
}
function $ebdd34506b80ff8e$var$isNumber(value) {
    return Boolean(value) && !Number.isNaN(Number(value));
}
function $ebdd34506b80ff8e$var$isArbitraryNumber(value) {
    return $ebdd34506b80ff8e$var$getIsArbitraryValue(value, "number", $ebdd34506b80ff8e$var$isNumber);
}
function $ebdd34506b80ff8e$var$isInteger(value) {
    return Boolean(value) && Number.isInteger(Number(value));
}
function $ebdd34506b80ff8e$var$isPercent(value) {
    return value.endsWith("%") && $ebdd34506b80ff8e$var$isNumber(value.slice(0, -1));
}
function $ebdd34506b80ff8e$var$isArbitraryValue(value) {
    return $ebdd34506b80ff8e$var$arbitraryValueRegex.test(value);
}
function $ebdd34506b80ff8e$var$isTshirtSize(value) {
    return $ebdd34506b80ff8e$var$tshirtUnitRegex.test(value);
}
const $ebdd34506b80ff8e$var$sizeLabels = /*#__PURE__*/ new Set([
    "length",
    "size",
    "percentage"
]);
function $ebdd34506b80ff8e$var$isArbitrarySize(value) {
    return $ebdd34506b80ff8e$var$getIsArbitraryValue(value, $ebdd34506b80ff8e$var$sizeLabels, $ebdd34506b80ff8e$var$isNever);
}
function $ebdd34506b80ff8e$var$isArbitraryPosition(value) {
    return $ebdd34506b80ff8e$var$getIsArbitraryValue(value, "position", $ebdd34506b80ff8e$var$isNever);
}
const $ebdd34506b80ff8e$var$imageLabels = /*#__PURE__*/ new Set([
    "image",
    "url"
]);
function $ebdd34506b80ff8e$var$isArbitraryImage(value) {
    return $ebdd34506b80ff8e$var$getIsArbitraryValue(value, $ebdd34506b80ff8e$var$imageLabels, $ebdd34506b80ff8e$var$isImage);
}
function $ebdd34506b80ff8e$var$isArbitraryShadow(value) {
    return $ebdd34506b80ff8e$var$getIsArbitraryValue(value, "", $ebdd34506b80ff8e$var$isShadow);
}
function $ebdd34506b80ff8e$var$isAny() {
    return true;
}
function $ebdd34506b80ff8e$var$getIsArbitraryValue(value, label, testValue) {
    const result = $ebdd34506b80ff8e$var$arbitraryValueRegex.exec(value);
    if (result) {
        if (result[1]) return typeof label === "string" ? result[1] === label : label.has(result[1]);
        return testValue(result[2]);
    }
    return false;
}
function $ebdd34506b80ff8e$var$isLengthOnly(value) {
    return $ebdd34506b80ff8e$var$lengthUnitRegex.test(value);
}
function $ebdd34506b80ff8e$var$isNever() {
    return false;
}
function $ebdd34506b80ff8e$var$isShadow(value) {
    return $ebdd34506b80ff8e$var$shadowRegex.test(value);
}
function $ebdd34506b80ff8e$var$isImage(value) {
    return $ebdd34506b80ff8e$var$imageRegex.test(value);
}
const $ebdd34506b80ff8e$var$validators = /*#__PURE__*/ Object.defineProperty({
    __proto__: null,
    isAny: $ebdd34506b80ff8e$var$isAny,
    isArbitraryImage: $ebdd34506b80ff8e$var$isArbitraryImage,
    isArbitraryLength: $ebdd34506b80ff8e$var$isArbitraryLength,
    isArbitraryNumber: $ebdd34506b80ff8e$var$isArbitraryNumber,
    isArbitraryPosition: $ebdd34506b80ff8e$var$isArbitraryPosition,
    isArbitraryShadow: $ebdd34506b80ff8e$var$isArbitraryShadow,
    isArbitrarySize: $ebdd34506b80ff8e$var$isArbitrarySize,
    isArbitraryValue: $ebdd34506b80ff8e$var$isArbitraryValue,
    isInteger: $ebdd34506b80ff8e$var$isInteger,
    isLength: $ebdd34506b80ff8e$var$isLength,
    isNumber: $ebdd34506b80ff8e$var$isNumber,
    isPercent: $ebdd34506b80ff8e$var$isPercent,
    isTshirtSize: $ebdd34506b80ff8e$var$isTshirtSize
}, Symbol.toStringTag, {
    value: "Module"
});
function $ebdd34506b80ff8e$var$getDefaultConfig() {
    const colors = $ebdd34506b80ff8e$var$fromTheme("colors");
    const spacing = $ebdd34506b80ff8e$var$fromTheme("spacing");
    const blur = $ebdd34506b80ff8e$var$fromTheme("blur");
    const brightness = $ebdd34506b80ff8e$var$fromTheme("brightness");
    const borderColor = $ebdd34506b80ff8e$var$fromTheme("borderColor");
    const borderRadius = $ebdd34506b80ff8e$var$fromTheme("borderRadius");
    const borderSpacing = $ebdd34506b80ff8e$var$fromTheme("borderSpacing");
    const borderWidth = $ebdd34506b80ff8e$var$fromTheme("borderWidth");
    const contrast = $ebdd34506b80ff8e$var$fromTheme("contrast");
    const grayscale = $ebdd34506b80ff8e$var$fromTheme("grayscale");
    const hueRotate = $ebdd34506b80ff8e$var$fromTheme("hueRotate");
    const invert = $ebdd34506b80ff8e$var$fromTheme("invert");
    const gap = $ebdd34506b80ff8e$var$fromTheme("gap");
    const gradientColorStops = $ebdd34506b80ff8e$var$fromTheme("gradientColorStops");
    const gradientColorStopPositions = $ebdd34506b80ff8e$var$fromTheme("gradientColorStopPositions");
    const inset = $ebdd34506b80ff8e$var$fromTheme("inset");
    const margin = $ebdd34506b80ff8e$var$fromTheme("margin");
    const opacity = $ebdd34506b80ff8e$var$fromTheme("opacity");
    const padding = $ebdd34506b80ff8e$var$fromTheme("padding");
    const saturate = $ebdd34506b80ff8e$var$fromTheme("saturate");
    const scale = $ebdd34506b80ff8e$var$fromTheme("scale");
    const sepia = $ebdd34506b80ff8e$var$fromTheme("sepia");
    const skew = $ebdd34506b80ff8e$var$fromTheme("skew");
    const space = $ebdd34506b80ff8e$var$fromTheme("space");
    const translate = $ebdd34506b80ff8e$var$fromTheme("translate");
    const getOverscroll = ()=>[
            "auto",
            "contain",
            "none"
        ];
    const getOverflow = ()=>[
            "auto",
            "hidden",
            "clip",
            "visible",
            "scroll"
        ];
    const getSpacingWithAutoAndArbitrary = ()=>[
            "auto",
            $ebdd34506b80ff8e$var$isArbitraryValue,
            spacing
        ];
    const getSpacingWithArbitrary = ()=>[
            $ebdd34506b80ff8e$var$isArbitraryValue,
            spacing
        ];
    const getLengthWithEmptyAndArbitrary = ()=>[
            "",
            $ebdd34506b80ff8e$var$isLength,
            $ebdd34506b80ff8e$var$isArbitraryLength
        ];
    const getNumberWithAutoAndArbitrary = ()=>[
            "auto",
            $ebdd34506b80ff8e$var$isNumber,
            $ebdd34506b80ff8e$var$isArbitraryValue
        ];
    const getPositions = ()=>[
            "bottom",
            "center",
            "left",
            "left-bottom",
            "left-top",
            "right",
            "right-bottom",
            "right-top",
            "top"
        ];
    const getLineStyles = ()=>[
            "solid",
            "dashed",
            "dotted",
            "double",
            "none"
        ];
    const getBlendModes = ()=>[
            "normal",
            "multiply",
            "screen",
            "overlay",
            "darken",
            "lighten",
            "color-dodge",
            "color-burn",
            "hard-light",
            "soft-light",
            "difference",
            "exclusion",
            "hue",
            "saturation",
            "color",
            "luminosity",
            "plus-lighter"
        ];
    const getAlign = ()=>[
            "start",
            "end",
            "center",
            "between",
            "around",
            "evenly",
            "stretch"
        ];
    const getZeroAndEmpty = ()=>[
            "",
            "0",
            $ebdd34506b80ff8e$var$isArbitraryValue
        ];
    const getBreaks = ()=>[
            "auto",
            "avoid",
            "all",
            "avoid-page",
            "page",
            "left",
            "right",
            "column"
        ];
    const getNumber = ()=>[
            $ebdd34506b80ff8e$var$isNumber,
            $ebdd34506b80ff8e$var$isArbitraryNumber
        ];
    const getNumberAndArbitrary = ()=>[
            $ebdd34506b80ff8e$var$isNumber,
            $ebdd34506b80ff8e$var$isArbitraryValue
        ];
    return {
        cacheSize: 500,
        separator: ":",
        theme: {
            colors: [
                $ebdd34506b80ff8e$var$isAny
            ],
            spacing: [
                $ebdd34506b80ff8e$var$isLength,
                $ebdd34506b80ff8e$var$isArbitraryLength
            ],
            blur: [
                "none",
                "",
                $ebdd34506b80ff8e$var$isTshirtSize,
                $ebdd34506b80ff8e$var$isArbitraryValue
            ],
            brightness: getNumber(),
            borderColor: [
                colors
            ],
            borderRadius: [
                "none",
                "",
                "full",
                $ebdd34506b80ff8e$var$isTshirtSize,
                $ebdd34506b80ff8e$var$isArbitraryValue
            ],
            borderSpacing: getSpacingWithArbitrary(),
            borderWidth: getLengthWithEmptyAndArbitrary(),
            contrast: getNumber(),
            grayscale: getZeroAndEmpty(),
            hueRotate: getNumberAndArbitrary(),
            invert: getZeroAndEmpty(),
            gap: getSpacingWithArbitrary(),
            gradientColorStops: [
                colors
            ],
            gradientColorStopPositions: [
                $ebdd34506b80ff8e$var$isPercent,
                $ebdd34506b80ff8e$var$isArbitraryLength
            ],
            inset: getSpacingWithAutoAndArbitrary(),
            margin: getSpacingWithAutoAndArbitrary(),
            opacity: getNumber(),
            padding: getSpacingWithArbitrary(),
            saturate: getNumber(),
            scale: getNumber(),
            sepia: getZeroAndEmpty(),
            skew: getNumberAndArbitrary(),
            space: getSpacingWithArbitrary(),
            translate: getSpacingWithArbitrary()
        },
        classGroups: {
            // Layout
            /**
       * Aspect Ratio
       * @see https://tailwindcss.com/docs/aspect-ratio
       */ aspect: [
                {
                    aspect: [
                        "auto",
                        "square",
                        "video",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Container
       * @see https://tailwindcss.com/docs/container
       */ container: [
                "container"
            ],
            /**
       * Columns
       * @see https://tailwindcss.com/docs/columns
       */ columns: [
                {
                    columns: [
                        $ebdd34506b80ff8e$var$isTshirtSize
                    ]
                }
            ],
            /**
       * Break After
       * @see https://tailwindcss.com/docs/break-after
       */ "break-after": [
                {
                    "break-after": getBreaks()
                }
            ],
            /**
       * Break Before
       * @see https://tailwindcss.com/docs/break-before
       */ "break-before": [
                {
                    "break-before": getBreaks()
                }
            ],
            /**
       * Break Inside
       * @see https://tailwindcss.com/docs/break-inside
       */ "break-inside": [
                {
                    "break-inside": [
                        "auto",
                        "avoid",
                        "avoid-page",
                        "avoid-column"
                    ]
                }
            ],
            /**
       * Box Decoration Break
       * @see https://tailwindcss.com/docs/box-decoration-break
       */ "box-decoration": [
                {
                    "box-decoration": [
                        "slice",
                        "clone"
                    ]
                }
            ],
            /**
       * Box Sizing
       * @see https://tailwindcss.com/docs/box-sizing
       */ box: [
                {
                    box: [
                        "border",
                        "content"
                    ]
                }
            ],
            /**
       * Display
       * @see https://tailwindcss.com/docs/display
       */ display: [
                "block",
                "inline-block",
                "inline",
                "flex",
                "inline-flex",
                "table",
                "inline-table",
                "table-caption",
                "table-cell",
                "table-column",
                "table-column-group",
                "table-footer-group",
                "table-header-group",
                "table-row-group",
                "table-row",
                "flow-root",
                "grid",
                "inline-grid",
                "contents",
                "list-item",
                "hidden"
            ],
            /**
       * Floats
       * @see https://tailwindcss.com/docs/float
       */ float: [
                {
                    float: [
                        "right",
                        "left",
                        "none"
                    ]
                }
            ],
            /**
       * Clear
       * @see https://tailwindcss.com/docs/clear
       */ clear: [
                {
                    clear: [
                        "left",
                        "right",
                        "both",
                        "none"
                    ]
                }
            ],
            /**
       * Isolation
       * @see https://tailwindcss.com/docs/isolation
       */ isolation: [
                "isolate",
                "isolation-auto"
            ],
            /**
       * Object Fit
       * @see https://tailwindcss.com/docs/object-fit
       */ "object-fit": [
                {
                    object: [
                        "contain",
                        "cover",
                        "fill",
                        "none",
                        "scale-down"
                    ]
                }
            ],
            /**
       * Object Position
       * @see https://tailwindcss.com/docs/object-position
       */ "object-position": [
                {
                    object: [
                        ...getPositions(),
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Overflow
       * @see https://tailwindcss.com/docs/overflow
       */ overflow: [
                {
                    overflow: getOverflow()
                }
            ],
            /**
       * Overflow X
       * @see https://tailwindcss.com/docs/overflow
       */ "overflow-x": [
                {
                    "overflow-x": getOverflow()
                }
            ],
            /**
       * Overflow Y
       * @see https://tailwindcss.com/docs/overflow
       */ "overflow-y": [
                {
                    "overflow-y": getOverflow()
                }
            ],
            /**
       * Overscroll Behavior
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */ overscroll: [
                {
                    overscroll: getOverscroll()
                }
            ],
            /**
       * Overscroll Behavior X
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */ "overscroll-x": [
                {
                    "overscroll-x": getOverscroll()
                }
            ],
            /**
       * Overscroll Behavior Y
       * @see https://tailwindcss.com/docs/overscroll-behavior
       */ "overscroll-y": [
                {
                    "overscroll-y": getOverscroll()
                }
            ],
            /**
       * Position
       * @see https://tailwindcss.com/docs/position
       */ position: [
                "static",
                "fixed",
                "absolute",
                "relative",
                "sticky"
            ],
            /**
       * Top / Right / Bottom / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */ inset: [
                {
                    inset: [
                        inset
                    ]
                }
            ],
            /**
       * Right / Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */ "inset-x": [
                {
                    "inset-x": [
                        inset
                    ]
                }
            ],
            /**
       * Top / Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */ "inset-y": [
                {
                    "inset-y": [
                        inset
                    ]
                }
            ],
            /**
       * Start
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */ start: [
                {
                    start: [
                        inset
                    ]
                }
            ],
            /**
       * End
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */ end: [
                {
                    end: [
                        inset
                    ]
                }
            ],
            /**
       * Top
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */ top: [
                {
                    top: [
                        inset
                    ]
                }
            ],
            /**
       * Right
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */ right: [
                {
                    right: [
                        inset
                    ]
                }
            ],
            /**
       * Bottom
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */ bottom: [
                {
                    bottom: [
                        inset
                    ]
                }
            ],
            /**
       * Left
       * @see https://tailwindcss.com/docs/top-right-bottom-left
       */ left: [
                {
                    left: [
                        inset
                    ]
                }
            ],
            /**
       * Visibility
       * @see https://tailwindcss.com/docs/visibility
       */ visibility: [
                "visible",
                "invisible",
                "collapse"
            ],
            /**
       * Z-Index
       * @see https://tailwindcss.com/docs/z-index
       */ z: [
                {
                    z: [
                        "auto",
                        $ebdd34506b80ff8e$var$isInteger,
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            // Flexbox and Grid
            /**
       * Flex Basis
       * @see https://tailwindcss.com/docs/flex-basis
       */ basis: [
                {
                    basis: getSpacingWithAutoAndArbitrary()
                }
            ],
            /**
       * Flex Direction
       * @see https://tailwindcss.com/docs/flex-direction
       */ "flex-direction": [
                {
                    flex: [
                        "row",
                        "row-reverse",
                        "col",
                        "col-reverse"
                    ]
                }
            ],
            /**
       * Flex Wrap
       * @see https://tailwindcss.com/docs/flex-wrap
       */ "flex-wrap": [
                {
                    flex: [
                        "wrap",
                        "wrap-reverse",
                        "nowrap"
                    ]
                }
            ],
            /**
       * Flex
       * @see https://tailwindcss.com/docs/flex
       */ flex: [
                {
                    flex: [
                        "1",
                        "auto",
                        "initial",
                        "none",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Flex Grow
       * @see https://tailwindcss.com/docs/flex-grow
       */ grow: [
                {
                    grow: getZeroAndEmpty()
                }
            ],
            /**
       * Flex Shrink
       * @see https://tailwindcss.com/docs/flex-shrink
       */ shrink: [
                {
                    shrink: getZeroAndEmpty()
                }
            ],
            /**
       * Order
       * @see https://tailwindcss.com/docs/order
       */ order: [
                {
                    order: [
                        "first",
                        "last",
                        "none",
                        $ebdd34506b80ff8e$var$isInteger,
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Grid Template Columns
       * @see https://tailwindcss.com/docs/grid-template-columns
       */ "grid-cols": [
                {
                    "grid-cols": [
                        $ebdd34506b80ff8e$var$isAny
                    ]
                }
            ],
            /**
       * Grid Column Start / End
       * @see https://tailwindcss.com/docs/grid-column
       */ "col-start-end": [
                {
                    col: [
                        "auto",
                        {
                            span: [
                                "full",
                                $ebdd34506b80ff8e$var$isInteger,
                                $ebdd34506b80ff8e$var$isArbitraryValue
                            ]
                        },
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Grid Column Start
       * @see https://tailwindcss.com/docs/grid-column
       */ "col-start": [
                {
                    "col-start": getNumberWithAutoAndArbitrary()
                }
            ],
            /**
       * Grid Column End
       * @see https://tailwindcss.com/docs/grid-column
       */ "col-end": [
                {
                    "col-end": getNumberWithAutoAndArbitrary()
                }
            ],
            /**
       * Grid Template Rows
       * @see https://tailwindcss.com/docs/grid-template-rows
       */ "grid-rows": [
                {
                    "grid-rows": [
                        $ebdd34506b80ff8e$var$isAny
                    ]
                }
            ],
            /**
       * Grid Row Start / End
       * @see https://tailwindcss.com/docs/grid-row
       */ "row-start-end": [
                {
                    row: [
                        "auto",
                        {
                            span: [
                                $ebdd34506b80ff8e$var$isInteger,
                                $ebdd34506b80ff8e$var$isArbitraryValue
                            ]
                        },
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Grid Row Start
       * @see https://tailwindcss.com/docs/grid-row
       */ "row-start": [
                {
                    "row-start": getNumberWithAutoAndArbitrary()
                }
            ],
            /**
       * Grid Row End
       * @see https://tailwindcss.com/docs/grid-row
       */ "row-end": [
                {
                    "row-end": getNumberWithAutoAndArbitrary()
                }
            ],
            /**
       * Grid Auto Flow
       * @see https://tailwindcss.com/docs/grid-auto-flow
       */ "grid-flow": [
                {
                    "grid-flow": [
                        "row",
                        "col",
                        "dense",
                        "row-dense",
                        "col-dense"
                    ]
                }
            ],
            /**
       * Grid Auto Columns
       * @see https://tailwindcss.com/docs/grid-auto-columns
       */ "auto-cols": [
                {
                    "auto-cols": [
                        "auto",
                        "min",
                        "max",
                        "fr",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Grid Auto Rows
       * @see https://tailwindcss.com/docs/grid-auto-rows
       */ "auto-rows": [
                {
                    "auto-rows": [
                        "auto",
                        "min",
                        "max",
                        "fr",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Gap
       * @see https://tailwindcss.com/docs/gap
       */ gap: [
                {
                    gap: [
                        gap
                    ]
                }
            ],
            /**
       * Gap X
       * @see https://tailwindcss.com/docs/gap
       */ "gap-x": [
                {
                    "gap-x": [
                        gap
                    ]
                }
            ],
            /**
       * Gap Y
       * @see https://tailwindcss.com/docs/gap
       */ "gap-y": [
                {
                    "gap-y": [
                        gap
                    ]
                }
            ],
            /**
       * Justify Content
       * @see https://tailwindcss.com/docs/justify-content
       */ "justify-content": [
                {
                    justify: [
                        "normal",
                        ...getAlign()
                    ]
                }
            ],
            /**
       * Justify Items
       * @see https://tailwindcss.com/docs/justify-items
       */ "justify-items": [
                {
                    "justify-items": [
                        "start",
                        "end",
                        "center",
                        "stretch"
                    ]
                }
            ],
            /**
       * Justify Self
       * @see https://tailwindcss.com/docs/justify-self
       */ "justify-self": [
                {
                    "justify-self": [
                        "auto",
                        "start",
                        "end",
                        "center",
                        "stretch"
                    ]
                }
            ],
            /**
       * Align Content
       * @see https://tailwindcss.com/docs/align-content
       */ "align-content": [
                {
                    content: [
                        "normal",
                        ...getAlign(),
                        "baseline"
                    ]
                }
            ],
            /**
       * Align Items
       * @see https://tailwindcss.com/docs/align-items
       */ "align-items": [
                {
                    items: [
                        "start",
                        "end",
                        "center",
                        "baseline",
                        "stretch"
                    ]
                }
            ],
            /**
       * Align Self
       * @see https://tailwindcss.com/docs/align-self
       */ "align-self": [
                {
                    self: [
                        "auto",
                        "start",
                        "end",
                        "center",
                        "stretch",
                        "baseline"
                    ]
                }
            ],
            /**
       * Place Content
       * @see https://tailwindcss.com/docs/place-content
       */ "place-content": [
                {
                    "place-content": [
                        ...getAlign(),
                        "baseline"
                    ]
                }
            ],
            /**
       * Place Items
       * @see https://tailwindcss.com/docs/place-items
       */ "place-items": [
                {
                    "place-items": [
                        "start",
                        "end",
                        "center",
                        "baseline",
                        "stretch"
                    ]
                }
            ],
            /**
       * Place Self
       * @see https://tailwindcss.com/docs/place-self
       */ "place-self": [
                {
                    "place-self": [
                        "auto",
                        "start",
                        "end",
                        "center",
                        "stretch"
                    ]
                }
            ],
            // Spacing
            /**
       * Padding
       * @see https://tailwindcss.com/docs/padding
       */ p: [
                {
                    p: [
                        padding
                    ]
                }
            ],
            /**
       * Padding X
       * @see https://tailwindcss.com/docs/padding
       */ px: [
                {
                    px: [
                        padding
                    ]
                }
            ],
            /**
       * Padding Y
       * @see https://tailwindcss.com/docs/padding
       */ py: [
                {
                    py: [
                        padding
                    ]
                }
            ],
            /**
       * Padding Start
       * @see https://tailwindcss.com/docs/padding
       */ ps: [
                {
                    ps: [
                        padding
                    ]
                }
            ],
            /**
       * Padding End
       * @see https://tailwindcss.com/docs/padding
       */ pe: [
                {
                    pe: [
                        padding
                    ]
                }
            ],
            /**
       * Padding Top
       * @see https://tailwindcss.com/docs/padding
       */ pt: [
                {
                    pt: [
                        padding
                    ]
                }
            ],
            /**
       * Padding Right
       * @see https://tailwindcss.com/docs/padding
       */ pr: [
                {
                    pr: [
                        padding
                    ]
                }
            ],
            /**
       * Padding Bottom
       * @see https://tailwindcss.com/docs/padding
       */ pb: [
                {
                    pb: [
                        padding
                    ]
                }
            ],
            /**
       * Padding Left
       * @see https://tailwindcss.com/docs/padding
       */ pl: [
                {
                    pl: [
                        padding
                    ]
                }
            ],
            /**
       * Margin
       * @see https://tailwindcss.com/docs/margin
       */ m: [
                {
                    m: [
                        margin
                    ]
                }
            ],
            /**
       * Margin X
       * @see https://tailwindcss.com/docs/margin
       */ mx: [
                {
                    mx: [
                        margin
                    ]
                }
            ],
            /**
       * Margin Y
       * @see https://tailwindcss.com/docs/margin
       */ my: [
                {
                    my: [
                        margin
                    ]
                }
            ],
            /**
       * Margin Start
       * @see https://tailwindcss.com/docs/margin
       */ ms: [
                {
                    ms: [
                        margin
                    ]
                }
            ],
            /**
       * Margin End
       * @see https://tailwindcss.com/docs/margin
       */ me: [
                {
                    me: [
                        margin
                    ]
                }
            ],
            /**
       * Margin Top
       * @see https://tailwindcss.com/docs/margin
       */ mt: [
                {
                    mt: [
                        margin
                    ]
                }
            ],
            /**
       * Margin Right
       * @see https://tailwindcss.com/docs/margin
       */ mr: [
                {
                    mr: [
                        margin
                    ]
                }
            ],
            /**
       * Margin Bottom
       * @see https://tailwindcss.com/docs/margin
       */ mb: [
                {
                    mb: [
                        margin
                    ]
                }
            ],
            /**
       * Margin Left
       * @see https://tailwindcss.com/docs/margin
       */ ml: [
                {
                    ml: [
                        margin
                    ]
                }
            ],
            /**
       * Space Between X
       * @see https://tailwindcss.com/docs/space
       */ "space-x": [
                {
                    "space-x": [
                        space
                    ]
                }
            ],
            /**
       * Space Between X Reverse
       * @see https://tailwindcss.com/docs/space
       */ "space-x-reverse": [
                "space-x-reverse"
            ],
            /**
       * Space Between Y
       * @see https://tailwindcss.com/docs/space
       */ "space-y": [
                {
                    "space-y": [
                        space
                    ]
                }
            ],
            /**
       * Space Between Y Reverse
       * @see https://tailwindcss.com/docs/space
       */ "space-y-reverse": [
                "space-y-reverse"
            ],
            // Sizing
            /**
       * Width
       * @see https://tailwindcss.com/docs/width
       */ w: [
                {
                    w: [
                        "auto",
                        "min",
                        "max",
                        "fit",
                        $ebdd34506b80ff8e$var$isArbitraryValue,
                        spacing
                    ]
                }
            ],
            /**
       * Min-Width
       * @see https://tailwindcss.com/docs/min-width
       */ "min-w": [
                {
                    "min-w": [
                        "min",
                        "max",
                        "fit",
                        $ebdd34506b80ff8e$var$isArbitraryValue,
                        $ebdd34506b80ff8e$var$isLength
                    ]
                }
            ],
            /**
       * Max-Width
       * @see https://tailwindcss.com/docs/max-width
       */ "max-w": [
                {
                    "max-w": [
                        "0",
                        "none",
                        "full",
                        "min",
                        "max",
                        "fit",
                        "prose",
                        {
                            screen: [
                                $ebdd34506b80ff8e$var$isTshirtSize
                            ]
                        },
                        $ebdd34506b80ff8e$var$isTshirtSize,
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Height
       * @see https://tailwindcss.com/docs/height
       */ h: [
                {
                    h: [
                        $ebdd34506b80ff8e$var$isArbitraryValue,
                        spacing,
                        "auto",
                        "min",
                        "max",
                        "fit"
                    ]
                }
            ],
            /**
       * Min-Height
       * @see https://tailwindcss.com/docs/min-height
       */ "min-h": [
                {
                    "min-h": [
                        "min",
                        "max",
                        "fit",
                        $ebdd34506b80ff8e$var$isLength,
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Max-Height
       * @see https://tailwindcss.com/docs/max-height
       */ "max-h": [
                {
                    "max-h": [
                        $ebdd34506b80ff8e$var$isArbitraryValue,
                        spacing,
                        "min",
                        "max",
                        "fit"
                    ]
                }
            ],
            // Typography
            /**
       * Font Size
       * @see https://tailwindcss.com/docs/font-size
       */ "font-size": [
                {
                    text: [
                        "base",
                        $ebdd34506b80ff8e$var$isTshirtSize,
                        $ebdd34506b80ff8e$var$isArbitraryLength
                    ]
                }
            ],
            /**
       * Font Smoothing
       * @see https://tailwindcss.com/docs/font-smoothing
       */ "font-smoothing": [
                "antialiased",
                "subpixel-antialiased"
            ],
            /**
       * Font Style
       * @see https://tailwindcss.com/docs/font-style
       */ "font-style": [
                "italic",
                "not-italic"
            ],
            /**
       * Font Weight
       * @see https://tailwindcss.com/docs/font-weight
       */ "font-weight": [
                {
                    font: [
                        "thin",
                        "extralight",
                        "light",
                        "normal",
                        "medium",
                        "semibold",
                        "bold",
                        "extrabold",
                        "black",
                        $ebdd34506b80ff8e$var$isArbitraryNumber
                    ]
                }
            ],
            /**
       * Font Family
       * @see https://tailwindcss.com/docs/font-family
       */ "font-family": [
                {
                    font: [
                        $ebdd34506b80ff8e$var$isAny
                    ]
                }
            ],
            /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */ "fvn-normal": [
                "normal-nums"
            ],
            /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */ "fvn-ordinal": [
                "ordinal"
            ],
            /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */ "fvn-slashed-zero": [
                "slashed-zero"
            ],
            /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */ "fvn-figure": [
                "lining-nums",
                "oldstyle-nums"
            ],
            /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */ "fvn-spacing": [
                "proportional-nums",
                "tabular-nums"
            ],
            /**
       * Font Variant Numeric
       * @see https://tailwindcss.com/docs/font-variant-numeric
       */ "fvn-fraction": [
                "diagonal-fractions",
                "stacked-fractons"
            ],
            /**
       * Letter Spacing
       * @see https://tailwindcss.com/docs/letter-spacing
       */ tracking: [
                {
                    tracking: [
                        "tighter",
                        "tight",
                        "normal",
                        "wide",
                        "wider",
                        "widest",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Line Clamp
       * @see https://tailwindcss.com/docs/line-clamp
       */ "line-clamp": [
                {
                    "line-clamp": [
                        "none",
                        $ebdd34506b80ff8e$var$isNumber,
                        $ebdd34506b80ff8e$var$isArbitraryNumber
                    ]
                }
            ],
            /**
       * Line Height
       * @see https://tailwindcss.com/docs/line-height
       */ leading: [
                {
                    leading: [
                        "none",
                        "tight",
                        "snug",
                        "normal",
                        "relaxed",
                        "loose",
                        $ebdd34506b80ff8e$var$isLength,
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * List Style Image
       * @see https://tailwindcss.com/docs/list-style-image
       */ "list-image": [
                {
                    "list-image": [
                        "none",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * List Style Type
       * @see https://tailwindcss.com/docs/list-style-type
       */ "list-style-type": [
                {
                    list: [
                        "none",
                        "disc",
                        "decimal",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * List Style Position
       * @see https://tailwindcss.com/docs/list-style-position
       */ "list-style-position": [
                {
                    list: [
                        "inside",
                        "outside"
                    ]
                }
            ],
            /**
       * Placeholder Color
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/placeholder-color
       */ "placeholder-color": [
                {
                    placeholder: [
                        colors
                    ]
                }
            ],
            /**
       * Placeholder Opacity
       * @see https://tailwindcss.com/docs/placeholder-opacity
       */ "placeholder-opacity": [
                {
                    "placeholder-opacity": [
                        opacity
                    ]
                }
            ],
            /**
       * Text Alignment
       * @see https://tailwindcss.com/docs/text-align
       */ "text-alignment": [
                {
                    text: [
                        "left",
                        "center",
                        "right",
                        "justify",
                        "start",
                        "end"
                    ]
                }
            ],
            /**
       * Text Color
       * @see https://tailwindcss.com/docs/text-color
       */ "text-color": [
                {
                    text: [
                        colors
                    ]
                }
            ],
            /**
       * Text Opacity
       * @see https://tailwindcss.com/docs/text-opacity
       */ "text-opacity": [
                {
                    "text-opacity": [
                        opacity
                    ]
                }
            ],
            /**
       * Text Decoration
       * @see https://tailwindcss.com/docs/text-decoration
       */ "text-decoration": [
                "underline",
                "overline",
                "line-through",
                "no-underline"
            ],
            /**
       * Text Decoration Style
       * @see https://tailwindcss.com/docs/text-decoration-style
       */ "text-decoration-style": [
                {
                    decoration: [
                        ...getLineStyles(),
                        "wavy"
                    ]
                }
            ],
            /**
       * Text Decoration Thickness
       * @see https://tailwindcss.com/docs/text-decoration-thickness
       */ "text-decoration-thickness": [
                {
                    decoration: [
                        "auto",
                        "from-font",
                        $ebdd34506b80ff8e$var$isLength,
                        $ebdd34506b80ff8e$var$isArbitraryLength
                    ]
                }
            ],
            /**
       * Text Underline Offset
       * @see https://tailwindcss.com/docs/text-underline-offset
       */ "underline-offset": [
                {
                    "underline-offset": [
                        "auto",
                        $ebdd34506b80ff8e$var$isLength,
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Text Decoration Color
       * @see https://tailwindcss.com/docs/text-decoration-color
       */ "text-decoration-color": [
                {
                    decoration: [
                        colors
                    ]
                }
            ],
            /**
       * Text Transform
       * @see https://tailwindcss.com/docs/text-transform
       */ "text-transform": [
                "uppercase",
                "lowercase",
                "capitalize",
                "normal-case"
            ],
            /**
       * Text Overflow
       * @see https://tailwindcss.com/docs/text-overflow
       */ "text-overflow": [
                "truncate",
                "text-ellipsis",
                "text-clip"
            ],
            /**
       * Text Indent
       * @see https://tailwindcss.com/docs/text-indent
       */ indent: [
                {
                    indent: getSpacingWithArbitrary()
                }
            ],
            /**
       * Vertical Alignment
       * @see https://tailwindcss.com/docs/vertical-align
       */ "vertical-align": [
                {
                    align: [
                        "baseline",
                        "top",
                        "middle",
                        "bottom",
                        "text-top",
                        "text-bottom",
                        "sub",
                        "super",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Whitespace
       * @see https://tailwindcss.com/docs/whitespace
       */ whitespace: [
                {
                    whitespace: [
                        "normal",
                        "nowrap",
                        "pre",
                        "pre-line",
                        "pre-wrap",
                        "break-spaces"
                    ]
                }
            ],
            /**
       * Word Break
       * @see https://tailwindcss.com/docs/word-break
       */ break: [
                {
                    break: [
                        "normal",
                        "words",
                        "all",
                        "keep"
                    ]
                }
            ],
            /**
       * Hyphens
       * @see https://tailwindcss.com/docs/hyphens
       */ hyphens: [
                {
                    hyphens: [
                        "none",
                        "manual",
                        "auto"
                    ]
                }
            ],
            /**
       * Content
       * @see https://tailwindcss.com/docs/content
       */ content: [
                {
                    content: [
                        "none",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            // Backgrounds
            /**
       * Background Attachment
       * @see https://tailwindcss.com/docs/background-attachment
       */ "bg-attachment": [
                {
                    bg: [
                        "fixed",
                        "local",
                        "scroll"
                    ]
                }
            ],
            /**
       * Background Clip
       * @see https://tailwindcss.com/docs/background-clip
       */ "bg-clip": [
                {
                    "bg-clip": [
                        "border",
                        "padding",
                        "content",
                        "text"
                    ]
                }
            ],
            /**
       * Background Opacity
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/background-opacity
       */ "bg-opacity": [
                {
                    "bg-opacity": [
                        opacity
                    ]
                }
            ],
            /**
       * Background Origin
       * @see https://tailwindcss.com/docs/background-origin
       */ "bg-origin": [
                {
                    "bg-origin": [
                        "border",
                        "padding",
                        "content"
                    ]
                }
            ],
            /**
       * Background Position
       * @see https://tailwindcss.com/docs/background-position
       */ "bg-position": [
                {
                    bg: [
                        ...getPositions(),
                        $ebdd34506b80ff8e$var$isArbitraryPosition
                    ]
                }
            ],
            /**
       * Background Repeat
       * @see https://tailwindcss.com/docs/background-repeat
       */ "bg-repeat": [
                {
                    bg: [
                        "no-repeat",
                        {
                            repeat: [
                                "",
                                "x",
                                "y",
                                "round",
                                "space"
                            ]
                        }
                    ]
                }
            ],
            /**
       * Background Size
       * @see https://tailwindcss.com/docs/background-size
       */ "bg-size": [
                {
                    bg: [
                        "auto",
                        "cover",
                        "contain",
                        $ebdd34506b80ff8e$var$isArbitrarySize
                    ]
                }
            ],
            /**
       * Background Image
       * @see https://tailwindcss.com/docs/background-image
       */ "bg-image": [
                {
                    bg: [
                        "none",
                        {
                            "gradient-to": [
                                "t",
                                "tr",
                                "r",
                                "br",
                                "b",
                                "bl",
                                "l",
                                "tl"
                            ]
                        },
                        $ebdd34506b80ff8e$var$isArbitraryImage
                    ]
                }
            ],
            /**
       * Background Color
       * @see https://tailwindcss.com/docs/background-color
       */ "bg-color": [
                {
                    bg: [
                        colors
                    ]
                }
            ],
            /**
       * Gradient Color Stops From Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */ "gradient-from-pos": [
                {
                    from: [
                        gradientColorStopPositions
                    ]
                }
            ],
            /**
       * Gradient Color Stops Via Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */ "gradient-via-pos": [
                {
                    via: [
                        gradientColorStopPositions
                    ]
                }
            ],
            /**
       * Gradient Color Stops To Position
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */ "gradient-to-pos": [
                {
                    to: [
                        gradientColorStopPositions
                    ]
                }
            ],
            /**
       * Gradient Color Stops From
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */ "gradient-from": [
                {
                    from: [
                        gradientColorStops
                    ]
                }
            ],
            /**
       * Gradient Color Stops Via
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */ "gradient-via": [
                {
                    via: [
                        gradientColorStops
                    ]
                }
            ],
            /**
       * Gradient Color Stops To
       * @see https://tailwindcss.com/docs/gradient-color-stops
       */ "gradient-to": [
                {
                    to: [
                        gradientColorStops
                    ]
                }
            ],
            // Borders
            /**
       * Border Radius
       * @see https://tailwindcss.com/docs/border-radius
       */ rounded: [
                {
                    rounded: [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Start
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-s": [
                {
                    "rounded-s": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius End
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-e": [
                {
                    "rounded-e": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Top
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-t": [
                {
                    "rounded-t": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Right
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-r": [
                {
                    "rounded-r": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Bottom
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-b": [
                {
                    "rounded-b": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Left
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-l": [
                {
                    "rounded-l": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Start Start
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-ss": [
                {
                    "rounded-ss": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Start End
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-se": [
                {
                    "rounded-se": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius End End
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-ee": [
                {
                    "rounded-ee": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius End Start
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-es": [
                {
                    "rounded-es": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Top Left
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-tl": [
                {
                    "rounded-tl": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Top Right
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-tr": [
                {
                    "rounded-tr": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Bottom Right
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-br": [
                {
                    "rounded-br": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Radius Bottom Left
       * @see https://tailwindcss.com/docs/border-radius
       */ "rounded-bl": [
                {
                    "rounded-bl": [
                        borderRadius
                    ]
                }
            ],
            /**
       * Border Width
       * @see https://tailwindcss.com/docs/border-width
       */ "border-w": [
                {
                    border: [
                        borderWidth
                    ]
                }
            ],
            /**
       * Border Width X
       * @see https://tailwindcss.com/docs/border-width
       */ "border-w-x": [
                {
                    "border-x": [
                        borderWidth
                    ]
                }
            ],
            /**
       * Border Width Y
       * @see https://tailwindcss.com/docs/border-width
       */ "border-w-y": [
                {
                    "border-y": [
                        borderWidth
                    ]
                }
            ],
            /**
       * Border Width Start
       * @see https://tailwindcss.com/docs/border-width
       */ "border-w-s": [
                {
                    "border-s": [
                        borderWidth
                    ]
                }
            ],
            /**
       * Border Width End
       * @see https://tailwindcss.com/docs/border-width
       */ "border-w-e": [
                {
                    "border-e": [
                        borderWidth
                    ]
                }
            ],
            /**
       * Border Width Top
       * @see https://tailwindcss.com/docs/border-width
       */ "border-w-t": [
                {
                    "border-t": [
                        borderWidth
                    ]
                }
            ],
            /**
       * Border Width Right
       * @see https://tailwindcss.com/docs/border-width
       */ "border-w-r": [
                {
                    "border-r": [
                        borderWidth
                    ]
                }
            ],
            /**
       * Border Width Bottom
       * @see https://tailwindcss.com/docs/border-width
       */ "border-w-b": [
                {
                    "border-b": [
                        borderWidth
                    ]
                }
            ],
            /**
       * Border Width Left
       * @see https://tailwindcss.com/docs/border-width
       */ "border-w-l": [
                {
                    "border-l": [
                        borderWidth
                    ]
                }
            ],
            /**
       * Border Opacity
       * @see https://tailwindcss.com/docs/border-opacity
       */ "border-opacity": [
                {
                    "border-opacity": [
                        opacity
                    ]
                }
            ],
            /**
       * Border Style
       * @see https://tailwindcss.com/docs/border-style
       */ "border-style": [
                {
                    border: [
                        ...getLineStyles(),
                        "hidden"
                    ]
                }
            ],
            /**
       * Divide Width X
       * @see https://tailwindcss.com/docs/divide-width
       */ "divide-x": [
                {
                    "divide-x": [
                        borderWidth
                    ]
                }
            ],
            /**
       * Divide Width X Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */ "divide-x-reverse": [
                "divide-x-reverse"
            ],
            /**
       * Divide Width Y
       * @see https://tailwindcss.com/docs/divide-width
       */ "divide-y": [
                {
                    "divide-y": [
                        borderWidth
                    ]
                }
            ],
            /**
       * Divide Width Y Reverse
       * @see https://tailwindcss.com/docs/divide-width
       */ "divide-y-reverse": [
                "divide-y-reverse"
            ],
            /**
       * Divide Opacity
       * @see https://tailwindcss.com/docs/divide-opacity
       */ "divide-opacity": [
                {
                    "divide-opacity": [
                        opacity
                    ]
                }
            ],
            /**
       * Divide Style
       * @see https://tailwindcss.com/docs/divide-style
       */ "divide-style": [
                {
                    divide: getLineStyles()
                }
            ],
            /**
       * Border Color
       * @see https://tailwindcss.com/docs/border-color
       */ "border-color": [
                {
                    border: [
                        borderColor
                    ]
                }
            ],
            /**
       * Border Color X
       * @see https://tailwindcss.com/docs/border-color
       */ "border-color-x": [
                {
                    "border-x": [
                        borderColor
                    ]
                }
            ],
            /**
       * Border Color Y
       * @see https://tailwindcss.com/docs/border-color
       */ "border-color-y": [
                {
                    "border-y": [
                        borderColor
                    ]
                }
            ],
            /**
       * Border Color Top
       * @see https://tailwindcss.com/docs/border-color
       */ "border-color-t": [
                {
                    "border-t": [
                        borderColor
                    ]
                }
            ],
            /**
       * Border Color Right
       * @see https://tailwindcss.com/docs/border-color
       */ "border-color-r": [
                {
                    "border-r": [
                        borderColor
                    ]
                }
            ],
            /**
       * Border Color Bottom
       * @see https://tailwindcss.com/docs/border-color
       */ "border-color-b": [
                {
                    "border-b": [
                        borderColor
                    ]
                }
            ],
            /**
       * Border Color Left
       * @see https://tailwindcss.com/docs/border-color
       */ "border-color-l": [
                {
                    "border-l": [
                        borderColor
                    ]
                }
            ],
            /**
       * Divide Color
       * @see https://tailwindcss.com/docs/divide-color
       */ "divide-color": [
                {
                    divide: [
                        borderColor
                    ]
                }
            ],
            /**
       * Outline Style
       * @see https://tailwindcss.com/docs/outline-style
       */ "outline-style": [
                {
                    outline: [
                        "",
                        ...getLineStyles()
                    ]
                }
            ],
            /**
       * Outline Offset
       * @see https://tailwindcss.com/docs/outline-offset
       */ "outline-offset": [
                {
                    "outline-offset": [
                        $ebdd34506b80ff8e$var$isLength,
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Outline Width
       * @see https://tailwindcss.com/docs/outline-width
       */ "outline-w": [
                {
                    outline: [
                        $ebdd34506b80ff8e$var$isLength,
                        $ebdd34506b80ff8e$var$isArbitraryLength
                    ]
                }
            ],
            /**
       * Outline Color
       * @see https://tailwindcss.com/docs/outline-color
       */ "outline-color": [
                {
                    outline: [
                        colors
                    ]
                }
            ],
            /**
       * Ring Width
       * @see https://tailwindcss.com/docs/ring-width
       */ "ring-w": [
                {
                    ring: getLengthWithEmptyAndArbitrary()
                }
            ],
            /**
       * Ring Width Inset
       * @see https://tailwindcss.com/docs/ring-width
       */ "ring-w-inset": [
                "ring-inset"
            ],
            /**
       * Ring Color
       * @see https://tailwindcss.com/docs/ring-color
       */ "ring-color": [
                {
                    ring: [
                        colors
                    ]
                }
            ],
            /**
       * Ring Opacity
       * @see https://tailwindcss.com/docs/ring-opacity
       */ "ring-opacity": [
                {
                    "ring-opacity": [
                        opacity
                    ]
                }
            ],
            /**
       * Ring Offset Width
       * @see https://tailwindcss.com/docs/ring-offset-width
       */ "ring-offset-w": [
                {
                    "ring-offset": [
                        $ebdd34506b80ff8e$var$isLength,
                        $ebdd34506b80ff8e$var$isArbitraryLength
                    ]
                }
            ],
            /**
       * Ring Offset Color
       * @see https://tailwindcss.com/docs/ring-offset-color
       */ "ring-offset-color": [
                {
                    "ring-offset": [
                        colors
                    ]
                }
            ],
            // Effects
            /**
       * Box Shadow
       * @see https://tailwindcss.com/docs/box-shadow
       */ shadow: [
                {
                    shadow: [
                        "",
                        "inner",
                        "none",
                        $ebdd34506b80ff8e$var$isTshirtSize,
                        $ebdd34506b80ff8e$var$isArbitraryShadow
                    ]
                }
            ],
            /**
       * Box Shadow Color
       * @see https://tailwindcss.com/docs/box-shadow-color
       */ "shadow-color": [
                {
                    shadow: [
                        $ebdd34506b80ff8e$var$isAny
                    ]
                }
            ],
            /**
       * Opacity
       * @see https://tailwindcss.com/docs/opacity
       */ opacity: [
                {
                    opacity: [
                        opacity
                    ]
                }
            ],
            /**
       * Mix Blend Mode
       * @see https://tailwindcss.com/docs/mix-blend-mode
       */ "mix-blend": [
                {
                    "mix-blend": getBlendModes()
                }
            ],
            /**
       * Background Blend Mode
       * @see https://tailwindcss.com/docs/background-blend-mode
       */ "bg-blend": [
                {
                    "bg-blend": getBlendModes()
                }
            ],
            // Filters
            /**
       * Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/filter
       */ filter: [
                {
                    filter: [
                        "",
                        "none"
                    ]
                }
            ],
            /**
       * Blur
       * @see https://tailwindcss.com/docs/blur
       */ blur: [
                {
                    blur: [
                        blur
                    ]
                }
            ],
            /**
       * Brightness
       * @see https://tailwindcss.com/docs/brightness
       */ brightness: [
                {
                    brightness: [
                        brightness
                    ]
                }
            ],
            /**
       * Contrast
       * @see https://tailwindcss.com/docs/contrast
       */ contrast: [
                {
                    contrast: [
                        contrast
                    ]
                }
            ],
            /**
       * Drop Shadow
       * @see https://tailwindcss.com/docs/drop-shadow
       */ "drop-shadow": [
                {
                    "drop-shadow": [
                        "",
                        "none",
                        $ebdd34506b80ff8e$var$isTshirtSize,
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Grayscale
       * @see https://tailwindcss.com/docs/grayscale
       */ grayscale: [
                {
                    grayscale: [
                        grayscale
                    ]
                }
            ],
            /**
       * Hue Rotate
       * @see https://tailwindcss.com/docs/hue-rotate
       */ "hue-rotate": [
                {
                    "hue-rotate": [
                        hueRotate
                    ]
                }
            ],
            /**
       * Invert
       * @see https://tailwindcss.com/docs/invert
       */ invert: [
                {
                    invert: [
                        invert
                    ]
                }
            ],
            /**
       * Saturate
       * @see https://tailwindcss.com/docs/saturate
       */ saturate: [
                {
                    saturate: [
                        saturate
                    ]
                }
            ],
            /**
       * Sepia
       * @see https://tailwindcss.com/docs/sepia
       */ sepia: [
                {
                    sepia: [
                        sepia
                    ]
                }
            ],
            /**
       * Backdrop Filter
       * @deprecated since Tailwind CSS v3.0.0
       * @see https://tailwindcss.com/docs/backdrop-filter
       */ "backdrop-filter": [
                {
                    "backdrop-filter": [
                        "",
                        "none"
                    ]
                }
            ],
            /**
       * Backdrop Blur
       * @see https://tailwindcss.com/docs/backdrop-blur
       */ "backdrop-blur": [
                {
                    "backdrop-blur": [
                        blur
                    ]
                }
            ],
            /**
       * Backdrop Brightness
       * @see https://tailwindcss.com/docs/backdrop-brightness
       */ "backdrop-brightness": [
                {
                    "backdrop-brightness": [
                        brightness
                    ]
                }
            ],
            /**
       * Backdrop Contrast
       * @see https://tailwindcss.com/docs/backdrop-contrast
       */ "backdrop-contrast": [
                {
                    "backdrop-contrast": [
                        contrast
                    ]
                }
            ],
            /**
       * Backdrop Grayscale
       * @see https://tailwindcss.com/docs/backdrop-grayscale
       */ "backdrop-grayscale": [
                {
                    "backdrop-grayscale": [
                        grayscale
                    ]
                }
            ],
            /**
       * Backdrop Hue Rotate
       * @see https://tailwindcss.com/docs/backdrop-hue-rotate
       */ "backdrop-hue-rotate": [
                {
                    "backdrop-hue-rotate": [
                        hueRotate
                    ]
                }
            ],
            /**
       * Backdrop Invert
       * @see https://tailwindcss.com/docs/backdrop-invert
       */ "backdrop-invert": [
                {
                    "backdrop-invert": [
                        invert
                    ]
                }
            ],
            /**
       * Backdrop Opacity
       * @see https://tailwindcss.com/docs/backdrop-opacity
       */ "backdrop-opacity": [
                {
                    "backdrop-opacity": [
                        opacity
                    ]
                }
            ],
            /**
       * Backdrop Saturate
       * @see https://tailwindcss.com/docs/backdrop-saturate
       */ "backdrop-saturate": [
                {
                    "backdrop-saturate": [
                        saturate
                    ]
                }
            ],
            /**
       * Backdrop Sepia
       * @see https://tailwindcss.com/docs/backdrop-sepia
       */ "backdrop-sepia": [
                {
                    "backdrop-sepia": [
                        sepia
                    ]
                }
            ],
            // Tables
            /**
       * Border Collapse
       * @see https://tailwindcss.com/docs/border-collapse
       */ "border-collapse": [
                {
                    border: [
                        "collapse",
                        "separate"
                    ]
                }
            ],
            /**
       * Border Spacing
       * @see https://tailwindcss.com/docs/border-spacing
       */ "border-spacing": [
                {
                    "border-spacing": [
                        borderSpacing
                    ]
                }
            ],
            /**
       * Border Spacing X
       * @see https://tailwindcss.com/docs/border-spacing
       */ "border-spacing-x": [
                {
                    "border-spacing-x": [
                        borderSpacing
                    ]
                }
            ],
            /**
       * Border Spacing Y
       * @see https://tailwindcss.com/docs/border-spacing
       */ "border-spacing-y": [
                {
                    "border-spacing-y": [
                        borderSpacing
                    ]
                }
            ],
            /**
       * Table Layout
       * @see https://tailwindcss.com/docs/table-layout
       */ "table-layout": [
                {
                    table: [
                        "auto",
                        "fixed"
                    ]
                }
            ],
            /**
       * Caption Side
       * @see https://tailwindcss.com/docs/caption-side
       */ caption: [
                {
                    caption: [
                        "top",
                        "bottom"
                    ]
                }
            ],
            // Transitions and Animation
            /**
       * Tranisition Property
       * @see https://tailwindcss.com/docs/transition-property
       */ transition: [
                {
                    transition: [
                        "none",
                        "all",
                        "",
                        "colors",
                        "opacity",
                        "shadow",
                        "transform",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Transition Duration
       * @see https://tailwindcss.com/docs/transition-duration
       */ duration: [
                {
                    duration: getNumberAndArbitrary()
                }
            ],
            /**
       * Transition Timing Function
       * @see https://tailwindcss.com/docs/transition-timing-function
       */ ease: [
                {
                    ease: [
                        "linear",
                        "in",
                        "out",
                        "in-out",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Transition Delay
       * @see https://tailwindcss.com/docs/transition-delay
       */ delay: [
                {
                    delay: getNumberAndArbitrary()
                }
            ],
            /**
       * Animation
       * @see https://tailwindcss.com/docs/animation
       */ animate: [
                {
                    animate: [
                        "none",
                        "spin",
                        "ping",
                        "pulse",
                        "bounce",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            // Transforms
            /**
       * Transform
       * @see https://tailwindcss.com/docs/transform
       */ transform: [
                {
                    transform: [
                        "",
                        "gpu",
                        "none"
                    ]
                }
            ],
            /**
       * Scale
       * @see https://tailwindcss.com/docs/scale
       */ scale: [
                {
                    scale: [
                        scale
                    ]
                }
            ],
            /**
       * Scale X
       * @see https://tailwindcss.com/docs/scale
       */ "scale-x": [
                {
                    "scale-x": [
                        scale
                    ]
                }
            ],
            /**
       * Scale Y
       * @see https://tailwindcss.com/docs/scale
       */ "scale-y": [
                {
                    "scale-y": [
                        scale
                    ]
                }
            ],
            /**
       * Rotate
       * @see https://tailwindcss.com/docs/rotate
       */ rotate: [
                {
                    rotate: [
                        $ebdd34506b80ff8e$var$isInteger,
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Translate X
       * @see https://tailwindcss.com/docs/translate
       */ "translate-x": [
                {
                    "translate-x": [
                        translate
                    ]
                }
            ],
            /**
       * Translate Y
       * @see https://tailwindcss.com/docs/translate
       */ "translate-y": [
                {
                    "translate-y": [
                        translate
                    ]
                }
            ],
            /**
       * Skew X
       * @see https://tailwindcss.com/docs/skew
       */ "skew-x": [
                {
                    "skew-x": [
                        skew
                    ]
                }
            ],
            /**
       * Skew Y
       * @see https://tailwindcss.com/docs/skew
       */ "skew-y": [
                {
                    "skew-y": [
                        skew
                    ]
                }
            ],
            /**
       * Transform Origin
       * @see https://tailwindcss.com/docs/transform-origin
       */ "transform-origin": [
                {
                    origin: [
                        "center",
                        "top",
                        "top-right",
                        "right",
                        "bottom-right",
                        "bottom",
                        "bottom-left",
                        "left",
                        "top-left",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            // Interactivity
            /**
       * Accent Color
       * @see https://tailwindcss.com/docs/accent-color
       */ accent: [
                {
                    accent: [
                        "auto",
                        colors
                    ]
                }
            ],
            /**
       * Appearance
       * @see https://tailwindcss.com/docs/appearance
       */ appearance: [
                "appearance-none"
            ],
            /**
       * Cursor
       * @see https://tailwindcss.com/docs/cursor
       */ cursor: [
                {
                    cursor: [
                        "auto",
                        "default",
                        "pointer",
                        "wait",
                        "text",
                        "move",
                        "help",
                        "not-allowed",
                        "none",
                        "context-menu",
                        "progress",
                        "cell",
                        "crosshair",
                        "vertical-text",
                        "alias",
                        "copy",
                        "no-drop",
                        "grab",
                        "grabbing",
                        "all-scroll",
                        "col-resize",
                        "row-resize",
                        "n-resize",
                        "e-resize",
                        "s-resize",
                        "w-resize",
                        "ne-resize",
                        "nw-resize",
                        "se-resize",
                        "sw-resize",
                        "ew-resize",
                        "ns-resize",
                        "nesw-resize",
                        "nwse-resize",
                        "zoom-in",
                        "zoom-out",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            /**
       * Caret Color
       * @see https://tailwindcss.com/docs/just-in-time-mode#caret-color-utilities
       */ "caret-color": [
                {
                    caret: [
                        colors
                    ]
                }
            ],
            /**
       * Pointer Events
       * @see https://tailwindcss.com/docs/pointer-events
       */ "pointer-events": [
                {
                    "pointer-events": [
                        "none",
                        "auto"
                    ]
                }
            ],
            /**
       * Resize
       * @see https://tailwindcss.com/docs/resize
       */ resize: [
                {
                    resize: [
                        "none",
                        "y",
                        "x",
                        ""
                    ]
                }
            ],
            /**
       * Scroll Behavior
       * @see https://tailwindcss.com/docs/scroll-behavior
       */ "scroll-behavior": [
                {
                    scroll: [
                        "auto",
                        "smooth"
                    ]
                }
            ],
            /**
       * Scroll Margin
       * @see https://tailwindcss.com/docs/scroll-margin
       */ "scroll-m": [
                {
                    "scroll-m": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Margin X
       * @see https://tailwindcss.com/docs/scroll-margin
       */ "scroll-mx": [
                {
                    "scroll-mx": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Margin Y
       * @see https://tailwindcss.com/docs/scroll-margin
       */ "scroll-my": [
                {
                    "scroll-my": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Margin Start
       * @see https://tailwindcss.com/docs/scroll-margin
       */ "scroll-ms": [
                {
                    "scroll-ms": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Margin End
       * @see https://tailwindcss.com/docs/scroll-margin
       */ "scroll-me": [
                {
                    "scroll-me": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Margin Top
       * @see https://tailwindcss.com/docs/scroll-margin
       */ "scroll-mt": [
                {
                    "scroll-mt": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Margin Right
       * @see https://tailwindcss.com/docs/scroll-margin
       */ "scroll-mr": [
                {
                    "scroll-mr": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Margin Bottom
       * @see https://tailwindcss.com/docs/scroll-margin
       */ "scroll-mb": [
                {
                    "scroll-mb": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Margin Left
       * @see https://tailwindcss.com/docs/scroll-margin
       */ "scroll-ml": [
                {
                    "scroll-ml": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Padding
       * @see https://tailwindcss.com/docs/scroll-padding
       */ "scroll-p": [
                {
                    "scroll-p": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Padding X
       * @see https://tailwindcss.com/docs/scroll-padding
       */ "scroll-px": [
                {
                    "scroll-px": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Padding Y
       * @see https://tailwindcss.com/docs/scroll-padding
       */ "scroll-py": [
                {
                    "scroll-py": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Padding Start
       * @see https://tailwindcss.com/docs/scroll-padding
       */ "scroll-ps": [
                {
                    "scroll-ps": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Padding End
       * @see https://tailwindcss.com/docs/scroll-padding
       */ "scroll-pe": [
                {
                    "scroll-pe": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Padding Top
       * @see https://tailwindcss.com/docs/scroll-padding
       */ "scroll-pt": [
                {
                    "scroll-pt": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Padding Right
       * @see https://tailwindcss.com/docs/scroll-padding
       */ "scroll-pr": [
                {
                    "scroll-pr": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Padding Bottom
       * @see https://tailwindcss.com/docs/scroll-padding
       */ "scroll-pb": [
                {
                    "scroll-pb": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Padding Left
       * @see https://tailwindcss.com/docs/scroll-padding
       */ "scroll-pl": [
                {
                    "scroll-pl": getSpacingWithArbitrary()
                }
            ],
            /**
       * Scroll Snap Align
       * @see https://tailwindcss.com/docs/scroll-snap-align
       */ "snap-align": [
                {
                    snap: [
                        "start",
                        "end",
                        "center",
                        "align-none"
                    ]
                }
            ],
            /**
       * Scroll Snap Stop
       * @see https://tailwindcss.com/docs/scroll-snap-stop
       */ "snap-stop": [
                {
                    snap: [
                        "normal",
                        "always"
                    ]
                }
            ],
            /**
       * Scroll Snap Type
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */ "snap-type": [
                {
                    snap: [
                        "none",
                        "x",
                        "y",
                        "both"
                    ]
                }
            ],
            /**
       * Scroll Snap Type Strictness
       * @see https://tailwindcss.com/docs/scroll-snap-type
       */ "snap-strictness": [
                {
                    snap: [
                        "mandatory",
                        "proximity"
                    ]
                }
            ],
            /**
       * Touch Action
       * @see https://tailwindcss.com/docs/touch-action
       */ touch: [
                {
                    touch: [
                        "auto",
                        "none",
                        "manipulation"
                    ]
                }
            ],
            /**
       * Touch Action X
       * @see https://tailwindcss.com/docs/touch-action
       */ "touch-x": [
                {
                    "touch-pan": [
                        "x",
                        "left",
                        "right"
                    ]
                }
            ],
            /**
       * Touch Action Y
       * @see https://tailwindcss.com/docs/touch-action
       */ "touch-y": [
                {
                    "touch-pan": [
                        "y",
                        "up",
                        "down"
                    ]
                }
            ],
            /**
       * Touch Action Pinch Zoom
       * @see https://tailwindcss.com/docs/touch-action
       */ "touch-pz": [
                "touch-pinch-zoom"
            ],
            /**
       * User Select
       * @see https://tailwindcss.com/docs/user-select
       */ select: [
                {
                    select: [
                        "none",
                        "text",
                        "all",
                        "auto"
                    ]
                }
            ],
            /**
       * Will Change
       * @see https://tailwindcss.com/docs/will-change
       */ "will-change": [
                {
                    "will-change": [
                        "auto",
                        "scroll",
                        "contents",
                        "transform",
                        $ebdd34506b80ff8e$var$isArbitraryValue
                    ]
                }
            ],
            // SVG
            /**
       * Fill
       * @see https://tailwindcss.com/docs/fill
       */ fill: [
                {
                    fill: [
                        colors,
                        "none"
                    ]
                }
            ],
            /**
       * Stroke Width
       * @see https://tailwindcss.com/docs/stroke-width
       */ "stroke-w": [
                {
                    stroke: [
                        $ebdd34506b80ff8e$var$isLength,
                        $ebdd34506b80ff8e$var$isArbitraryLength,
                        $ebdd34506b80ff8e$var$isArbitraryNumber
                    ]
                }
            ],
            /**
       * Stroke
       * @see https://tailwindcss.com/docs/stroke
       */ stroke: [
                {
                    stroke: [
                        colors,
                        "none"
                    ]
                }
            ],
            // Accessibility
            /**
       * Screen Readers
       * @see https://tailwindcss.com/docs/screen-readers
       */ sr: [
                "sr-only",
                "not-sr-only"
            ]
        },
        conflictingClassGroups: {
            overflow: [
                "overflow-x",
                "overflow-y"
            ],
            overscroll: [
                "overscroll-x",
                "overscroll-y"
            ],
            inset: [
                "inset-x",
                "inset-y",
                "start",
                "end",
                "top",
                "right",
                "bottom",
                "left"
            ],
            "inset-x": [
                "right",
                "left"
            ],
            "inset-y": [
                "top",
                "bottom"
            ],
            flex: [
                "basis",
                "grow",
                "shrink"
            ],
            gap: [
                "gap-x",
                "gap-y"
            ],
            p: [
                "px",
                "py",
                "ps",
                "pe",
                "pt",
                "pr",
                "pb",
                "pl"
            ],
            px: [
                "pr",
                "pl"
            ],
            py: [
                "pt",
                "pb"
            ],
            m: [
                "mx",
                "my",
                "ms",
                "me",
                "mt",
                "mr",
                "mb",
                "ml"
            ],
            mx: [
                "mr",
                "ml"
            ],
            my: [
                "mt",
                "mb"
            ],
            "font-size": [
                "leading"
            ],
            "fvn-normal": [
                "fvn-ordinal",
                "fvn-slashed-zero",
                "fvn-figure",
                "fvn-spacing",
                "fvn-fraction"
            ],
            "fvn-ordinal": [
                "fvn-normal"
            ],
            "fvn-slashed-zero": [
                "fvn-normal"
            ],
            "fvn-figure": [
                "fvn-normal"
            ],
            "fvn-spacing": [
                "fvn-normal"
            ],
            "fvn-fraction": [
                "fvn-normal"
            ],
            rounded: [
                "rounded-s",
                "rounded-e",
                "rounded-t",
                "rounded-r",
                "rounded-b",
                "rounded-l",
                "rounded-ss",
                "rounded-se",
                "rounded-ee",
                "rounded-es",
                "rounded-tl",
                "rounded-tr",
                "rounded-br",
                "rounded-bl"
            ],
            "rounded-s": [
                "rounded-ss",
                "rounded-es"
            ],
            "rounded-e": [
                "rounded-se",
                "rounded-ee"
            ],
            "rounded-t": [
                "rounded-tl",
                "rounded-tr"
            ],
            "rounded-r": [
                "rounded-tr",
                "rounded-br"
            ],
            "rounded-b": [
                "rounded-br",
                "rounded-bl"
            ],
            "rounded-l": [
                "rounded-tl",
                "rounded-bl"
            ],
            "border-spacing": [
                "border-spacing-x",
                "border-spacing-y"
            ],
            "border-w": [
                "border-w-s",
                "border-w-e",
                "border-w-t",
                "border-w-r",
                "border-w-b",
                "border-w-l"
            ],
            "border-w-x": [
                "border-w-r",
                "border-w-l"
            ],
            "border-w-y": [
                "border-w-t",
                "border-w-b"
            ],
            "border-color": [
                "border-color-t",
                "border-color-r",
                "border-color-b",
                "border-color-l"
            ],
            "border-color-x": [
                "border-color-r",
                "border-color-l"
            ],
            "border-color-y": [
                "border-color-t",
                "border-color-b"
            ],
            "scroll-m": [
                "scroll-mx",
                "scroll-my",
                "scroll-ms",
                "scroll-me",
                "scroll-mt",
                "scroll-mr",
                "scroll-mb",
                "scroll-ml"
            ],
            "scroll-mx": [
                "scroll-mr",
                "scroll-ml"
            ],
            "scroll-my": [
                "scroll-mt",
                "scroll-mb"
            ],
            "scroll-p": [
                "scroll-px",
                "scroll-py",
                "scroll-ps",
                "scroll-pe",
                "scroll-pt",
                "scroll-pr",
                "scroll-pb",
                "scroll-pl"
            ],
            "scroll-px": [
                "scroll-pr",
                "scroll-pl"
            ],
            "scroll-py": [
                "scroll-pt",
                "scroll-pb"
            ],
            touch: [
                "touch-x",
                "touch-y",
                "touch-pz"
            ],
            "touch-x": [
                "touch"
            ],
            "touch-y": [
                "touch"
            ],
            "touch-pz": [
                "touch"
            ]
        },
        conflictingClassGroupModifiers: {
            "font-size": [
                "leading"
            ]
        }
    };
}
/**
 * @param baseConfig Config where other config will be merged into. This object will be mutated.
 * @param configExtension Partial config to merge into the `baseConfig`.
 */ function $ebdd34506b80ff8e$var$mergeConfigs(baseConfig, { cacheSize: cacheSize , prefix: prefix , separator: separator , extend: extend = {} , override: override = {}  }) {
    $ebdd34506b80ff8e$var$overrideProperty(baseConfig, "cacheSize", cacheSize);
    $ebdd34506b80ff8e$var$overrideProperty(baseConfig, "prefix", prefix);
    $ebdd34506b80ff8e$var$overrideProperty(baseConfig, "separator", separator);
    for(const configKey in override)$ebdd34506b80ff8e$var$overrideConfigProperties(baseConfig[configKey], override[configKey]);
    for(const key in extend)$ebdd34506b80ff8e$var$mergeConfigProperties(baseConfig[key], extend[key]);
    return baseConfig;
}
function $ebdd34506b80ff8e$var$overrideProperty(baseObject, overrideKey, overrideValue) {
    if (overrideValue !== undefined) baseObject[overrideKey] = overrideValue;
}
function $ebdd34506b80ff8e$var$overrideConfigProperties(baseObject, overrideObject) {
    if (overrideObject) for(const key in overrideObject)$ebdd34506b80ff8e$var$overrideProperty(baseObject, key, overrideObject[key]);
}
function $ebdd34506b80ff8e$var$mergeConfigProperties(baseObject, mergeObject) {
    if (mergeObject) for(const key in mergeObject){
        const mergeValue = mergeObject[key];
        if (mergeValue !== undefined) baseObject[key] = (baseObject[key] || []).concat(mergeValue);
    }
}
function $ebdd34506b80ff8e$var$extendTailwindMerge(configExtension, ...createConfig) {
    return typeof configExtension === "function" ? $ebdd34506b80ff8e$var$createTailwindMerge($ebdd34506b80ff8e$var$getDefaultConfig, configExtension, ...createConfig) : $ebdd34506b80ff8e$var$createTailwindMerge(()=>$ebdd34506b80ff8e$var$mergeConfigs($ebdd34506b80ff8e$var$getDefaultConfig(), configExtension), ...createConfig);
}
const $ebdd34506b80ff8e$var$twMerge = /*#__PURE__*/ $ebdd34506b80ff8e$var$createTailwindMerge($ebdd34506b80ff8e$var$getDefaultConfig);
$ebdd34506b80ff8e$exports.createTailwindMerge = $ebdd34506b80ff8e$var$createTailwindMerge;
$ebdd34506b80ff8e$exports.extendTailwindMerge = $ebdd34506b80ff8e$var$extendTailwindMerge;
$ebdd34506b80ff8e$exports.fromTheme = $ebdd34506b80ff8e$var$fromTheme;
$ebdd34506b80ff8e$exports.getDefaultConfig = $ebdd34506b80ff8e$var$getDefaultConfig;
$ebdd34506b80ff8e$exports.mergeConfigs = $ebdd34506b80ff8e$var$mergeConfigs;
$ebdd34506b80ff8e$exports.twJoin = $ebdd34506b80ff8e$var$twJoin;
$ebdd34506b80ff8e$exports.twMerge = $ebdd34506b80ff8e$var$twMerge;
$ebdd34506b80ff8e$exports.validators = $ebdd34506b80ff8e$var$validators;



var $LI8jA = parcelRequire("LI8jA");
function $66adb88ac93a30d5$export$1343a74baacb0543(...inputs) {
    return (0, $ebdd34506b80ff8e$exports.twMerge)((0, $e082dca22ab0acc4$export$4f5d2d50c9deca37)(inputs));
}
const $66adb88ac93a30d5$var$idRef = {
    default: 0
};
const $66adb88ac93a30d5$var$Id = (0, $LI8jA.createContext)(()=>{
    return ++$66adb88ac93a30d5$var$idRef.default;
});
const $66adb88ac93a30d5$export$f680877a34711e37 = (prefix = "id")=>{
    const getter = (0, $LI8jA.useContext)($66adb88ac93a30d5$var$Id);
    const ref = (0, $LI8jA.useRef)();
    if (!ref.current) ref.current = `${prefix}:${getter()}`;
    return ref.current;
};


const $0e5897524c762a41$export$dca1ee5a936bb312 = (0, $591c8f71196a9028$export$87dc52566e90b739)("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm gap-1 font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/100 as-classic",
            solid: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/100 as-solid",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/100 as-destructive",
            outline: "border bg-background hover:bg-accent hover:text-accent-foreground active:opacity-85 as-outline",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:opacity-85 as-secondary",
            ghost: "hover:bg-accent hover:text-accent-foreground active:opacity-80 as-ghost",
            link: "text-primary underline-offset-4 hover:underline active:opacity-80 as-link"
        },
        size: {
            default: "h-10 px-4 py-2",
            md: "h-9 px-4 rounded-md py-2",
            lg: "h-11 text-base rounded-md px-8",
            sm: "h-7 rounded px-3 py-1",
            xs: "h-6 text-xs rounded px-3",
            icon: "h-10 w-10"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const $0e5897524c762a41$export$353f5b6fc5456de1 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , variant: variant , size: size , asChild: asChild = false , ...props }, ref)=>{
    const Comp = asChild ? (0, $db045af315cca07a$export$8c6ed5c666ac1360) : "button";
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)(Comp, {
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__button", $0e5897524c762a41$export$dca1ee5a936bb312({
            variant: variant,
            size: size,
            className: className
        })),
        ref: ref,
        ...props
    });
});
$0e5897524c762a41$export$353f5b6fc5456de1.displayName = "Button";




var $LI8jA = parcelRequire("LI8jA");


var $LI8jA = parcelRequire("LI8jA");
function $6997abd862cdf210$export$7d15b64cf5a3a4c4(value, [min, max]) {
    return Math.min(max, Math.max(min, value));
}


function $890940bb4b8db948$export$b9ecd428b558ff10(originalEventHandler, ourEventHandler, { checkForDefaultPrevented: checkForDefaultPrevented = true  } = {}) {
    return function handleEvent(event) {
        originalEventHandler === null || originalEventHandler === void 0 || originalEventHandler(event);
        if (checkForDefaultPrevented === false || !event.defaultPrevented) return ourEventHandler === null || ourEventHandler === void 0 ? void 0 : ourEventHandler(event);
    };
}




var $LI8jA = parcelRequire("LI8jA");
function $ec3315292aa721d0$export$fd42f52fd3ae1109(rootComponentName, defaultContext) {
    const Context = /*#__PURE__*/ (0, $LI8jA.createContext)(defaultContext);
    function Provider(props) {
        const { children: children , ...context } = props; // Only re-memoize when prop values change
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const value = (0, $LI8jA.useMemo)(()=>context, Object.values(context));
        return /*#__PURE__*/ (0, $LI8jA.createElement)(Context.Provider, {
            value: value
        }, children);
    }
    function useContext(consumerName) {
        const context = (0, $LI8jA.useContext)(Context);
        if (context) return context;
        if (defaultContext !== undefined) return defaultContext; // if a defaultContext wasn't specified, it's a required context.
        throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
    }
    Provider.displayName = rootComponentName + "Provider";
    return [
        Provider,
        useContext
    ];
}
/* -------------------------------------------------------------------------------------------------
 * createContextScope
 * -----------------------------------------------------------------------------------------------*/ function $ec3315292aa721d0$export$50c7b4e9d9f19c1(scopeName, createContextScopeDeps = []) {
    let defaultContexts = [];
    /* -----------------------------------------------------------------------------------------------
   * createContext
   * ---------------------------------------------------------------------------------------------*/ function $c512c27ab02ef895$export$fd42f52fd3ae1109(rootComponentName, defaultContext) {
        const BaseContext = /*#__PURE__*/ (0, $LI8jA.createContext)(defaultContext);
        const index = defaultContexts.length;
        defaultContexts = [
            ...defaultContexts,
            defaultContext
        ];
        function Provider(props) {
            const { scope: scope , children: children , ...context } = props;
            const Context = (scope === null || scope === void 0 ? void 0 : scope[scopeName][index]) || BaseContext; // Only re-memoize when prop values change
            // eslint-disable-next-line react-hooks/exhaustive-deps
            const value = (0, $LI8jA.useMemo)(()=>context, Object.values(context));
            return /*#__PURE__*/ (0, $LI8jA.createElement)(Context.Provider, {
                value: value
            }, children);
        }
        function useContext(consumerName, scope) {
            const Context = (scope === null || scope === void 0 ? void 0 : scope[scopeName][index]) || BaseContext;
            const context = (0, $LI8jA.useContext)(Context);
            if (context) return context;
            if (defaultContext !== undefined) return defaultContext; // if a defaultContext wasn't specified, it's a required context.
            throw new Error(`\`${consumerName}\` must be used within \`${rootComponentName}\``);
        }
        Provider.displayName = rootComponentName + "Provider";
        return [
            Provider,
            useContext
        ];
    }
    /* -----------------------------------------------------------------------------------------------
   * createScope
   * ---------------------------------------------------------------------------------------------*/ const createScope = ()=>{
        const scopeContexts = defaultContexts.map((defaultContext)=>{
            return /*#__PURE__*/ (0, $LI8jA.createContext)(defaultContext);
        });
        return function useScope(scope) {
            const contexts = (scope === null || scope === void 0 ? void 0 : scope[scopeName]) || scopeContexts;
            return (0, $LI8jA.useMemo)(()=>({
                    [`__scope${scopeName}`]: {
                        ...scope,
                        [scopeName]: contexts
                    }
                }), [
                scope,
                contexts
            ]);
        };
    };
    createScope.scopeName = scopeName;
    return [
        $c512c27ab02ef895$export$fd42f52fd3ae1109,
        $ec3315292aa721d0$var$$c512c27ab02ef895$var$composeContextScopes(createScope, ...createContextScopeDeps)
    ];
}
/* -------------------------------------------------------------------------------------------------
 * composeContextScopes
 * -----------------------------------------------------------------------------------------------*/ function $ec3315292aa721d0$var$$c512c27ab02ef895$var$composeContextScopes(...scopes) {
    const baseScope = scopes[0];
    if (scopes.length === 1) return baseScope;
    const createScope1 = ()=>{
        const scopeHooks = scopes.map((createScope)=>({
                useScope: createScope(),
                scopeName: createScope.scopeName
            }));
        return function useComposedScopes(overrideScopes) {
            const nextScopes1 = scopeHooks.reduce((nextScopes, { useScope: useScope , scopeName: scopeName  })=>{
                // We are calling a hook inside a callback which React warns against to avoid inconsistent
                // renders, however, scoping doesn't have render side effects so we ignore the rule.
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const scopeProps = useScope(overrideScopes);
                const currentScope = scopeProps[`__scope${scopeName}`];
                return {
                    ...nextScopes,
                    ...currentScope
                };
            }, {});
            return (0, $LI8jA.useMemo)(()=>({
                    [`__scope${baseScope.scopeName}`]: nextScopes1
                }), [
                nextScopes1
            ]);
        };
    };
    createScope1.scopeName = baseScope.scopeName;
    return createScope1;
}



var $LI8jA = parcelRequire("LI8jA");

var $LI8jA = parcelRequire("LI8jA");
/**
 * A custom hook that converts a callback to a ref to avoid triggering re-renders when passed as a
 * prop or avoid re-executing effects when passed as a dependency
 */ function $8d5f4755e7320408$export$25bec8c6f54ee79a(callback) {
    const callbackRef = (0, $LI8jA.useRef)(callback);
    (0, $LI8jA.useEffect)(()=>{
        callbackRef.current = callback;
    }); // https://github.com/facebook/react/issues/19240
    return (0, $LI8jA.useMemo)(()=>(...args)=>{
            var _callbackRef$current;
            return (_callbackRef$current = callbackRef.current) === null || _callbackRef$current === void 0 ? void 0 : _callbackRef$current.call(callbackRef, ...args);
        }, []);
}


function $f4c632903130edee$export$6f32135080cb4c3({ prop: prop , defaultProp: defaultProp , onChange: onChange = ()=>{}  }) {
    const [uncontrolledProp, setUncontrolledProp] = $f4c632903130edee$var$$71cd76cc60e0454e$var$useUncontrolledState({
        defaultProp: defaultProp,
        onChange: onChange
    });
    const isControlled = prop !== undefined;
    const value1 = isControlled ? prop : uncontrolledProp;
    const handleChange = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onChange);
    const setValue = (0, $LI8jA.useCallback)((nextValue)=>{
        if (isControlled) {
            const setter = nextValue;
            const value = typeof nextValue === "function" ? setter(prop) : nextValue;
            if (value !== prop) handleChange(value);
        } else setUncontrolledProp(nextValue);
    }, [
        isControlled,
        prop,
        setUncontrolledProp,
        handleChange
    ]);
    return [
        value1,
        setValue
    ];
}
function $f4c632903130edee$var$$71cd76cc60e0454e$var$useUncontrolledState({ defaultProp: defaultProp , onChange: onChange  }) {
    const uncontrolledState = (0, $LI8jA.useState)(defaultProp);
    const [value] = uncontrolledState;
    const prevValueRef = (0, $LI8jA.useRef)(value);
    const handleChange = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onChange);
    (0, $LI8jA.useEffect)(()=>{
        if (prevValueRef.current !== value) {
            handleChange(value);
            prevValueRef.current = value;
        }
    }, [
        value,
        prevValueRef,
        handleChange
    ]);
    return uncontrolledState;
}



var $LI8jA = parcelRequire("LI8jA");
const $842d1ddb67983cae$var$$f631663db3294ace$var$DirectionContext = /*#__PURE__*/ (0, $LI8jA.createContext)(undefined);
/* -------------------------------------------------------------------------------------------------
 * Direction
 * -----------------------------------------------------------------------------------------------*/ const $842d1ddb67983cae$export$c760c09fdd558351 = (props)=>{
    const { dir: dir , children: children  } = props;
    return /*#__PURE__*/ (0, $LI8jA.createElement)($842d1ddb67983cae$var$$f631663db3294ace$var$DirectionContext.Provider, {
        value: dir
    }, children);
};
/* -----------------------------------------------------------------------------------------------*/ function $842d1ddb67983cae$export$b39126d51d94e6f3(localDir) {
    const globalDir = (0, $LI8jA.useContext)($842d1ddb67983cae$var$$f631663db3294ace$var$DirectionContext);
    return localDir || globalDir || "ltr";
}
const $842d1ddb67983cae$export$2881499e37b75b9a = $842d1ddb67983cae$export$c760c09fdd558351;



var $LI8jA = parcelRequire("LI8jA");
function $760b241fb7cd5f92$export$5cae361ad82dce8b(value) {
    const ref = (0, $LI8jA.useRef)({
        value: value,
        previous: value
    }); // We compare values before making an update to ensure that
    // a change has been made. This ensures the previous value is
    // persisted correctly between renders.
    return (0, $LI8jA.useMemo)(()=>{
        if (ref.current.value !== value) {
            ref.current.previous = ref.current.value;
            ref.current.value = value;
        }
        return ref.current.previous;
    }, [
        value
    ]);
}



var $LI8jA = parcelRequire("LI8jA");

var $LI8jA = parcelRequire("LI8jA");
/**
 * On the server, React emits a warning when calling `useLayoutEffect`.
 * This is because neither `useLayoutEffect` nor `useEffect` run on the server.
 * We use this safe version which suppresses the warning by replacing it with a noop on the server.
 *
 * See: https://reactjs.org/docs/hooks-reference.html#uselayouteffect
 */ const $620f4b520baef9c2$export$e5c5a5f917a5871c = Boolean(globalThis === null || globalThis === void 0 ? void 0 : globalThis.document) ? (0, $LI8jA.useLayoutEffect) : ()=>{};


function $e5427f5e3f2cde3c$export$1ab7ae714698c4b8(element) {
    const [size, setSize] = (0, $LI8jA.useState)(undefined);
    (0, $620f4b520baef9c2$export$e5c5a5f917a5871c)(()=>{
        if (element) {
            // provide size as early as possible
            setSize({
                width: element.offsetWidth,
                height: element.offsetHeight
            });
            const resizeObserver = new ResizeObserver((entries)=>{
                if (!Array.isArray(entries)) return;
                // Since we only observe the one element, we don't need to loop over the
                // array
                if (!entries.length) return;
                const entry = entries[0];
                let width;
                let height;
                if ("borderBoxSize" in entry) {
                    const borderSizeEntry = entry["borderBoxSize"]; // iron out differences between browsers
                    const borderSize = Array.isArray(borderSizeEntry) ? borderSizeEntry[0] : borderSizeEntry;
                    width = borderSize["inlineSize"];
                    height = borderSize["blockSize"];
                } else {
                    // for browsers that don't support `borderBoxSize`
                    // we calculate it ourselves to get the correct border box.
                    width = element.offsetWidth;
                    height = element.offsetHeight;
                }
                setSize({
                    width: width,
                    height: height
                });
            });
            resizeObserver.observe(element, {
                box: "border-box"
            });
            return ()=>resizeObserver.unobserve(element);
        } else // not if it changes to another element.
        setSize(undefined);
    }, [
        element
    ]);
    return size;
}




var $LI8jA = parcelRequire("LI8jA");
var $117771ce739ab0ef$exports = {};
$117771ce739ab0ef$exports = ReactDOM;



const $a68e7d99b5d35ecf$var$$8927f6f2acc4f386$var$NODES = [
    "a",
    "button",
    "div",
    "form",
    "h2",
    "h3",
    "img",
    "input",
    "label",
    "li",
    "nav",
    "ol",
    "p",
    "span",
    "svg",
    "ul"
]; // Temporary while we await merge of this fix:
// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/55396
// prettier-ignore
/* -------------------------------------------------------------------------------------------------
 * Primitive
 * -----------------------------------------------------------------------------------------------*/ const $a68e7d99b5d35ecf$export$250ffa63cdc0d034 = $a68e7d99b5d35ecf$var$$8927f6f2acc4f386$var$NODES.reduce((primitive, node)=>{
    const Node = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
        const { asChild: asChild , ...primitiveProps } = props;
        const Comp = asChild ? (0, $db045af315cca07a$export$8c6ed5c666ac1360) : node;
        (0, $LI8jA.useEffect)(()=>{
            window[Symbol.for("radix-ui")] = true;
        }, []);
        return /*#__PURE__*/ (0, $LI8jA.createElement)(Comp, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, primitiveProps, {
            ref: forwardedRef
        }));
    });
    Node.displayName = `Primitive.${node}`;
    return {
        ...primitive,
        [node]: Node
    };
}, {});
/* -------------------------------------------------------------------------------------------------
 * Utils
 * -----------------------------------------------------------------------------------------------*/ /**
 * Flush custom event dispatch
 * https://github.com/radix-ui/primitives/pull/1378
 *
 * React batches *all* event handlers since version 18, this introduces certain considerations when using custom event types.
 *
 * Internally, React prioritises events in the following order:
 *  - discrete
 *  - continuous
 *  - default
 *
 * https://github.com/facebook/react/blob/a8a4742f1c54493df00da648a3f9d26e3db9c8b5/packages/react-dom/src/events/ReactDOMEventListener.js#L294-L350
 *
 * `discrete` is an  important distinction as updates within these events are applied immediately.
 * React however, is not able to infer the priority of custom event types due to how they are detected internally.
 * Because of this, it's possible for updates from custom events to be unexpectedly batched when
 * dispatched by another `discrete` event.
 *
 * In order to ensure that updates from custom events are applied predictably, we need to manually flush the batch.
 * This utility should be used when dispatching a custom event from within another `discrete` event, this utility
 * is not nessesary when dispatching known event types, or if dispatching a custom type inside a non-discrete event.
 * For example:
 *
 * dispatching a known click 👎
 * target.dispatchEvent(new Event(‘click’))
 *
 * dispatching a custom type within a non-discrete event 👎
 * onScroll={(event) => event.target.dispatchEvent(new CustomEvent(‘customType’))}
 *
 * dispatching a custom type within a `discrete` event 👍
 * onPointerDown={(event) => dispatchDiscreteCustomEvent(event.target, new CustomEvent(‘customType’))}
 *
 * Note: though React classifies `focus`, `focusin` and `focusout` events as `discrete`, it's  not recommended to use
 * this utility with them. This is because it's possible for those handlers to be called implicitly during render
 * e.g. when focus is within a component as it is unmounted, or when managing focus on mount.
 */ function $a68e7d99b5d35ecf$export$6d1a0317bde7de7f(target, event) {
    if (target) (0, $117771ce739ab0ef$exports.flushSync)(()=>target.dispatchEvent(event));
}
/* -----------------------------------------------------------------------------------------------*/ const $a68e7d99b5d35ecf$export$be92b6f5f03c0fe9 = $a68e7d99b5d35ecf$export$250ffa63cdc0d034;



var $LI8jA = parcelRequire("LI8jA");



// We have resorted to returning slots directly rather than exposing primitives that can then
// be slotted like `<CollectionItem as={Slot}>…</CollectionItem>`.
// This is because we encountered issues with generic types that cannot be statically analysed
// due to creating them dynamically via createCollection.
function $38e2772b5a4e93fc$export$c74125a8e3af6bb2(name) {
    /* -----------------------------------------------------------------------------------------------
   * CollectionProvider
   * ---------------------------------------------------------------------------------------------*/ const PROVIDER_NAME = name + "CollectionProvider";
    const [createCollectionContext, createCollectionScope] = (0, $ec3315292aa721d0$export$50c7b4e9d9f19c1)(PROVIDER_NAME);
    const [CollectionProviderImpl, useCollectionContext] = createCollectionContext(PROVIDER_NAME, {
        collectionRef: {
            current: null
        },
        itemMap: new Map()
    });
    const CollectionProvider = (props)=>{
        const { scope: scope , children: children  } = props;
        const ref = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(null);
        const itemMap = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(new Map()).current;
        return /*#__PURE__*/ (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).createElement(CollectionProviderImpl, {
            scope: scope,
            itemMap: itemMap,
            collectionRef: ref
        }, children);
    };
    /*#__PURE__*/ Object.assign(CollectionProvider, {
        displayName: PROVIDER_NAME
    });
    /* -----------------------------------------------------------------------------------------------
   * CollectionSlot
   * ---------------------------------------------------------------------------------------------*/ const COLLECTION_SLOT_NAME = name + "CollectionSlot";
    const CollectionSlot = /*#__PURE__*/ (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).forwardRef((props, forwardedRef)=>{
        const { scope: scope , children: children  } = props;
        const context = useCollectionContext(COLLECTION_SLOT_NAME, scope);
        const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, context.collectionRef);
        return /*#__PURE__*/ (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).createElement((0, $db045af315cca07a$export$8c6ed5c666ac1360), {
            ref: composedRefs
        }, children);
    });
    /*#__PURE__*/ Object.assign(CollectionSlot, {
        displayName: COLLECTION_SLOT_NAME
    });
    /* -----------------------------------------------------------------------------------------------
   * CollectionItem
   * ---------------------------------------------------------------------------------------------*/ const ITEM_SLOT_NAME = name + "CollectionItemSlot";
    const ITEM_DATA_ATTR = "data-radix-collection-item";
    const CollectionItemSlot = /*#__PURE__*/ (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).forwardRef((props, forwardedRef)=>{
        const { scope: scope , children: children , ...itemData } = props;
        const ref = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(null);
        const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, ref);
        const context = useCollectionContext(ITEM_SLOT_NAME, scope);
        (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
            context.itemMap.set(ref, {
                ref: ref,
                ...itemData
            });
            return ()=>void context.itemMap.delete(ref);
        });
        return /*#__PURE__*/ (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).createElement((0, $db045af315cca07a$export$8c6ed5c666ac1360), {
            [ITEM_DATA_ATTR]: "",
            ref: composedRefs
        }, children);
    });
    /*#__PURE__*/ Object.assign(CollectionItemSlot, {
        displayName: ITEM_SLOT_NAME
    });
    /* -----------------------------------------------------------------------------------------------
   * useCollection
   * ---------------------------------------------------------------------------------------------*/ function useCollection(scope) {
        const context = useCollectionContext(name + "CollectionConsumer", scope);
        const getItems = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback(()=>{
            const collectionNode = context.collectionRef.current;
            if (!collectionNode) return [];
            const orderedNodes = Array.from(collectionNode.querySelectorAll(`[${ITEM_DATA_ATTR}]`));
            const items = Array.from(context.itemMap.values());
            const orderedItems = items.sort((a, b)=>orderedNodes.indexOf(a.ref.current) - orderedNodes.indexOf(b.ref.current));
            return orderedItems;
        }, [
            context.collectionRef,
            context.itemMap
        ]);
        return getItems;
    }
    return [
        {
            Provider: CollectionProvider,
            Slot: CollectionSlot,
            ItemSlot: CollectionItemSlot
        },
        useCollection,
        createCollectionScope
    ];
}


const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$PAGE_KEYS = [
    "PageUp",
    "PageDown"
];
const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$ARROW_KEYS = [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight"
];
const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$BACK_KEYS = {
    "from-left": [
        "Home",
        "PageDown",
        "ArrowDown",
        "ArrowLeft"
    ],
    "from-right": [
        "Home",
        "PageDown",
        "ArrowDown",
        "ArrowRight"
    ],
    "from-bottom": [
        "Home",
        "PageDown",
        "ArrowDown",
        "ArrowLeft"
    ],
    "from-top": [
        "Home",
        "PageDown",
        "ArrowUp",
        "ArrowLeft"
    ]
};
/* -------------------------------------------------------------------------------------------------
 * Slider
 * -----------------------------------------------------------------------------------------------*/ const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$SLIDER_NAME = "Slider";
const [$f6c81c3212943ddd$var$$faa2e61a3361514f$var$Collection, $f6c81c3212943ddd$var$$faa2e61a3361514f$var$useCollection, $f6c81c3212943ddd$var$$faa2e61a3361514f$var$createCollectionScope] = (0, $38e2772b5a4e93fc$export$c74125a8e3af6bb2)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SLIDER_NAME);
const [$f6c81c3212943ddd$var$$faa2e61a3361514f$var$createSliderContext, $f6c81c3212943ddd$export$ef72632d7b901f97] = (0, $ec3315292aa721d0$export$50c7b4e9d9f19c1)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SLIDER_NAME, [
    $f6c81c3212943ddd$var$$faa2e61a3361514f$var$createCollectionScope
]);
const [$f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderProvider, $f6c81c3212943ddd$var$$faa2e61a3361514f$var$useSliderContext] = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$createSliderContext($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SLIDER_NAME);
const $f6c81c3212943ddd$export$472062a354075cee = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { name: name , min: min = 0 , max: max = 100 , step: step = 1 , orientation: orientation = "horizontal" , disabled: disabled = false , minStepsBetweenThumbs: minStepsBetweenThumbs = 0 , defaultValue: defaultValue = [
        min
    ] , value: value1 , onValueChange: onValueChange = ()=>{} , onValueCommit: onValueCommit = ()=>{} , inverted: inverted = false , ...sliderProps } = props;
    const [slider, setSlider] = (0, $LI8jA.useState)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, (node)=>setSlider(node));
    const thumbRefs = (0, $LI8jA.useRef)(new Set());
    const valueIndexToChangeRef = (0, $LI8jA.useRef)(0);
    const isHorizontal = orientation === "horizontal"; // We set this to true by default so that events bubble to forms without JS (SSR)
    const isFormControl = slider ? Boolean(slider.closest("form")) : true;
    const SliderOrientation = isHorizontal ? $f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderHorizontal : $f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderVertical;
    const [values = [], setValues] = (0, $f4c632903130edee$export$6f32135080cb4c3)({
        prop: value1,
        defaultProp: defaultValue,
        onChange: (value)=>{
            var _thumbs$valueIndexToC;
            const thumbs = [
                ...thumbRefs.current
            ];
            (_thumbs$valueIndexToC = thumbs[valueIndexToChangeRef.current]) === null || _thumbs$valueIndexToC === void 0 || _thumbs$valueIndexToC.focus();
            onValueChange(value);
        }
    });
    const valuesBeforeSlideStartRef = (0, $LI8jA.useRef)(values);
    function handleSlideStart(value) {
        const closestIndex = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getClosestValueIndex(values, value);
        updateValues(value, closestIndex);
    }
    function handleSlideMove(value) {
        updateValues(value, valueIndexToChangeRef.current);
    }
    function handleSlideEnd() {
        const prevValue = valuesBeforeSlideStartRef.current[valueIndexToChangeRef.current];
        const nextValue = values[valueIndexToChangeRef.current];
        const hasChanged = nextValue !== prevValue;
        if (hasChanged) onValueCommit(values);
    }
    function updateValues(value, atIndex, { commit: commit  } = {
        commit: false
    }) {
        const decimalCount = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getDecimalCount(step);
        const snapToStep = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$roundValue(Math.round((value - min) / step) * step + min, decimalCount);
        const nextValue = (0, $6997abd862cdf210$export$7d15b64cf5a3a4c4)(snapToStep, [
            min,
            max
        ]);
        setValues((prevValues = [])=>{
            const nextValues = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getNextSortedValues(prevValues, nextValue, atIndex);
            if ($f6c81c3212943ddd$var$$faa2e61a3361514f$var$hasMinStepsBetweenValues(nextValues, minStepsBetweenThumbs * step)) {
                valueIndexToChangeRef.current = nextValues.indexOf(nextValue);
                const hasChanged = String(nextValues) !== String(prevValues);
                if (hasChanged && commit) onValueCommit(nextValues);
                return hasChanged ? nextValues : prevValues;
            } else return prevValues;
        });
    }
    return /*#__PURE__*/ (0, $LI8jA.createElement)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderProvider, {
        scope: props.__scopeSlider,
        disabled: disabled,
        min: min,
        max: max,
        valueIndexToChangeRef: valueIndexToChangeRef,
        thumbs: thumbRefs.current,
        values: values,
        orientation: orientation
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$Collection.Provider, {
        scope: props.__scopeSlider
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$Collection.Slot, {
        scope: props.__scopeSlider
    }, /*#__PURE__*/ (0, $LI8jA.createElement)(SliderOrientation, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        "aria-disabled": disabled,
        "data-disabled": disabled ? "" : undefined
    }, sliderProps, {
        ref: composedRefs,
        onPointerDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(sliderProps.onPointerDown, ()=>{
            if (!disabled) valuesBeforeSlideStartRef.current = values;
        }),
        min: min,
        max: max,
        inverted: inverted,
        onSlideStart: disabled ? undefined : handleSlideStart,
        onSlideMove: disabled ? undefined : handleSlideMove,
        onSlideEnd: disabled ? undefined : handleSlideEnd,
        onHomeKeyDown: ()=>!disabled && updateValues(min, 0, {
                commit: true
            }),
        onEndKeyDown: ()=>!disabled && updateValues(max, values.length - 1, {
                commit: true
            }),
        onStepKeyDown: ({ event: event , direction: stepDirection  })=>{
            if (!disabled) {
                const isPageKey = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$PAGE_KEYS.includes(event.key);
                const isSkipKey = isPageKey || event.shiftKey && $f6c81c3212943ddd$var$$faa2e61a3361514f$var$ARROW_KEYS.includes(event.key);
                const multiplier = isSkipKey ? 10 : 1;
                const atIndex = valueIndexToChangeRef.current;
                const value = values[atIndex];
                const stepInDirection = step * multiplier * stepDirection;
                updateValues(value + stepInDirection, atIndex, {
                    commit: true
                });
            }
        }
    })))), isFormControl && values.map((value, index)=>/*#__PURE__*/ (0, $LI8jA.createElement)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$BubbleInput, {
            key: index,
            name: name ? name + (values.length > 1 ? "[]" : "") : undefined,
            value: value
        })));
});
/*#__PURE__*/ Object.assign($f6c81c3212943ddd$export$472062a354075cee, {
    displayName: $f6c81c3212943ddd$var$$faa2e61a3361514f$var$SLIDER_NAME
});
/* -------------------------------------------------------------------------------------------------
 * SliderHorizontal
 * -----------------------------------------------------------------------------------------------*/ const [$f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderOrientationProvider, $f6c81c3212943ddd$var$$faa2e61a3361514f$var$useSliderOrientationContext] = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$createSliderContext($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SLIDER_NAME, {
    startEdge: "left",
    endEdge: "right",
    size: "width",
    direction: 1
});
const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderHorizontal = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { min: min , max: max , dir: dir , inverted: inverted , onSlideStart: onSlideStart , onSlideMove: onSlideMove , onSlideEnd: onSlideEnd , onStepKeyDown: onStepKeyDown , ...sliderProps } = props;
    const [slider, setSlider] = (0, $LI8jA.useState)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, (node)=>setSlider(node));
    const rectRef = (0, $LI8jA.useRef)();
    const direction = (0, $842d1ddb67983cae$export$b39126d51d94e6f3)(dir);
    const isDirectionLTR = direction === "ltr";
    const isSlidingFromLeft = isDirectionLTR && !inverted || !isDirectionLTR && inverted;
    function getValueFromPointer(pointerPosition) {
        const rect = rectRef.current || slider.getBoundingClientRect();
        const input = [
            0,
            rect.width
        ];
        const output = isSlidingFromLeft ? [
            min,
            max
        ] : [
            max,
            min
        ];
        const value = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$linearScale(input, output);
        rectRef.current = rect;
        return value(pointerPosition - rect.left);
    }
    return /*#__PURE__*/ (0, $LI8jA.createElement)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderOrientationProvider, {
        scope: props.__scopeSlider,
        startEdge: isSlidingFromLeft ? "left" : "right",
        endEdge: isSlidingFromLeft ? "right" : "left",
        direction: isSlidingFromLeft ? 1 : -1,
        size: "width"
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderImpl, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        dir: direction,
        "data-orientation": "horizontal"
    }, sliderProps, {
        ref: composedRefs,
        style: {
            ...sliderProps.style,
            ["--radix-slider-thumb-transform"]: "translateX(-50%)"
        },
        onSlideStart: (event)=>{
            const value = getValueFromPointer(event.clientX);
            onSlideStart === null || onSlideStart === void 0 || onSlideStart(value);
        },
        onSlideMove: (event)=>{
            const value = getValueFromPointer(event.clientX);
            onSlideMove === null || onSlideMove === void 0 || onSlideMove(value);
        },
        onSlideEnd: ()=>{
            rectRef.current = undefined;
            onSlideEnd === null || onSlideEnd === void 0 || onSlideEnd();
        },
        onStepKeyDown: (event)=>{
            const slideDirection = isSlidingFromLeft ? "from-left" : "from-right";
            const isBackKey = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$BACK_KEYS[slideDirection].includes(event.key);
            onStepKeyDown === null || onStepKeyDown === void 0 || onStepKeyDown({
                event: event,
                direction: isBackKey ? -1 : 1
            });
        }
    })));
});
/* -------------------------------------------------------------------------------------------------
 * SliderVertical
 * -----------------------------------------------------------------------------------------------*/ const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderVertical = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { min: min , max: max , inverted: inverted , onSlideStart: onSlideStart , onSlideMove: onSlideMove , onSlideEnd: onSlideEnd , onStepKeyDown: onStepKeyDown , ...sliderProps } = props;
    const sliderRef = (0, $LI8jA.useRef)(null);
    const ref = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, sliderRef);
    const rectRef = (0, $LI8jA.useRef)();
    const isSlidingFromBottom = !inverted;
    function getValueFromPointer(pointerPosition) {
        const rect = rectRef.current || sliderRef.current.getBoundingClientRect();
        const input = [
            0,
            rect.height
        ];
        const output = isSlidingFromBottom ? [
            max,
            min
        ] : [
            min,
            max
        ];
        const value = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$linearScale(input, output);
        rectRef.current = rect;
        return value(pointerPosition - rect.top);
    }
    return /*#__PURE__*/ (0, $LI8jA.createElement)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderOrientationProvider, {
        scope: props.__scopeSlider,
        startEdge: isSlidingFromBottom ? "bottom" : "top",
        endEdge: isSlidingFromBottom ? "top" : "bottom",
        size: "height",
        direction: isSlidingFromBottom ? 1 : -1
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderImpl, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        "data-orientation": "vertical"
    }, sliderProps, {
        ref: ref,
        style: {
            ...sliderProps.style,
            ["--radix-slider-thumb-transform"]: "translateY(50%)"
        },
        onSlideStart: (event)=>{
            const value = getValueFromPointer(event.clientY);
            onSlideStart === null || onSlideStart === void 0 || onSlideStart(value);
        },
        onSlideMove: (event)=>{
            const value = getValueFromPointer(event.clientY);
            onSlideMove === null || onSlideMove === void 0 || onSlideMove(value);
        },
        onSlideEnd: ()=>{
            rectRef.current = undefined;
            onSlideEnd === null || onSlideEnd === void 0 || onSlideEnd();
        },
        onStepKeyDown: (event)=>{
            const slideDirection = isSlidingFromBottom ? "from-bottom" : "from-top";
            const isBackKey = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$BACK_KEYS[slideDirection].includes(event.key);
            onStepKeyDown === null || onStepKeyDown === void 0 || onStepKeyDown({
                event: event,
                direction: isBackKey ? -1 : 1
            });
        }
    })));
});
/* -------------------------------------------------------------------------------------------------
 * SliderImpl
 * -----------------------------------------------------------------------------------------------*/ const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderImpl = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeSlider: __scopeSlider , onSlideStart: onSlideStart , onSlideMove: onSlideMove , onSlideEnd: onSlideEnd , onHomeKeyDown: onHomeKeyDown , onEndKeyDown: onEndKeyDown , onStepKeyDown: onStepKeyDown , ...sliderProps } = props;
    const context = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$useSliderContext($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SLIDER_NAME, __scopeSlider);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).span, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, sliderProps, {
        ref: forwardedRef,
        onKeyDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onKeyDown, (event)=>{
            if (event.key === "Home") {
                onHomeKeyDown(event); // Prevent scrolling to page start
                event.preventDefault();
            } else if (event.key === "End") {
                onEndKeyDown(event); // Prevent scrolling to page end
                event.preventDefault();
            } else if ($f6c81c3212943ddd$var$$faa2e61a3361514f$var$PAGE_KEYS.concat($f6c81c3212943ddd$var$$faa2e61a3361514f$var$ARROW_KEYS).includes(event.key)) {
                onStepKeyDown(event); // Prevent scrolling for directional key presses
                event.preventDefault();
            }
        }),
        onPointerDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerDown, (event)=>{
            const target = event.target;
            target.setPointerCapture(event.pointerId); // Prevent browser focus behaviour because we focus a thumb manually when values change.
            event.preventDefault(); // Touch devices have a delay before focusing so won't focus if touch immediately moves
            // away from target (sliding). We want thumb to focus regardless.
            if (context.thumbs.has(target)) target.focus();
            else onSlideStart(event);
        }),
        onPointerMove: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerMove, (event)=>{
            const target = event.target;
            if (target.hasPointerCapture(event.pointerId)) onSlideMove(event);
        }),
        onPointerUp: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerUp, (event)=>{
            const target = event.target;
            if (target.hasPointerCapture(event.pointerId)) {
                target.releasePointerCapture(event.pointerId);
                onSlideEnd(event);
            }
        })
    }));
});
/* -------------------------------------------------------------------------------------------------
 * SliderTrack
 * -----------------------------------------------------------------------------------------------*/ const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$TRACK_NAME = "SliderTrack";
const $f6c81c3212943ddd$export$105594979f116971 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeSlider: __scopeSlider , ...trackProps } = props;
    const context = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$useSliderContext($f6c81c3212943ddd$var$$faa2e61a3361514f$var$TRACK_NAME, __scopeSlider);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).span, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        "data-disabled": context.disabled ? "" : undefined,
        "data-orientation": context.orientation
    }, trackProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($f6c81c3212943ddd$export$105594979f116971, {
    displayName: $f6c81c3212943ddd$var$$faa2e61a3361514f$var$TRACK_NAME
});
/* -------------------------------------------------------------------------------------------------
 * SliderRange
 * -----------------------------------------------------------------------------------------------*/ const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$RANGE_NAME = "SliderRange";
const $f6c81c3212943ddd$export$a5cf38a7a000fe77 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeSlider: __scopeSlider , ...rangeProps } = props;
    const context = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$useSliderContext($f6c81c3212943ddd$var$$faa2e61a3361514f$var$RANGE_NAME, __scopeSlider);
    const orientation = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$useSliderOrientationContext($f6c81c3212943ddd$var$$faa2e61a3361514f$var$RANGE_NAME, __scopeSlider);
    const ref = (0, $LI8jA.useRef)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, ref);
    const valuesCount = context.values.length;
    const percentages = context.values.map((value)=>$f6c81c3212943ddd$var$$faa2e61a3361514f$var$convertValueToPercentage(value, context.min, context.max));
    const offsetStart = valuesCount > 1 ? Math.min(...percentages) : 0;
    const offsetEnd = 100 - Math.max(...percentages);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).span, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        "data-orientation": context.orientation,
        "data-disabled": context.disabled ? "" : undefined
    }, rangeProps, {
        ref: composedRefs,
        style: {
            ...props.style,
            [orientation.startEdge]: offsetStart + "%",
            [orientation.endEdge]: offsetEnd + "%"
        }
    }));
});
/*#__PURE__*/ Object.assign($f6c81c3212943ddd$export$a5cf38a7a000fe77, {
    displayName: $f6c81c3212943ddd$var$$faa2e61a3361514f$var$RANGE_NAME
});
/* -------------------------------------------------------------------------------------------------
 * SliderThumb
 * -----------------------------------------------------------------------------------------------*/ const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$THUMB_NAME = "SliderThumb";
const $f6c81c3212943ddd$export$2c1b491743890dec = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const getItems = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$useCollection(props.__scopeSlider);
    const [thumb, setThumb] = (0, $LI8jA.useState)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, (node)=>setThumb(node));
    const index = (0, $LI8jA.useMemo)(()=>thumb ? getItems().findIndex((item)=>item.ref.current === thumb) : -1, [
        getItems,
        thumb
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderThumbImpl, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, props, {
        ref: composedRefs,
        index: index
    }));
});
const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$SliderThumbImpl = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeSlider: __scopeSlider , index: index , ...thumbProps } = props;
    const context = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$useSliderContext($f6c81c3212943ddd$var$$faa2e61a3361514f$var$THUMB_NAME, __scopeSlider);
    const orientation = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$useSliderOrientationContext($f6c81c3212943ddd$var$$faa2e61a3361514f$var$THUMB_NAME, __scopeSlider);
    const [thumb, setThumb] = (0, $LI8jA.useState)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, (node)=>setThumb(node));
    const size = (0, $e5427f5e3f2cde3c$export$1ab7ae714698c4b8)(thumb); // We cast because index could be `-1` which would return undefined
    const value = context.values[index];
    const percent = value === undefined ? 0 : $f6c81c3212943ddd$var$$faa2e61a3361514f$var$convertValueToPercentage(value, context.min, context.max);
    const label = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getLabel(index, context.values.length);
    const orientationSize = size === null || size === void 0 ? void 0 : size[orientation.size];
    const thumbInBoundsOffset = orientationSize ? $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getThumbInBoundsOffset(orientationSize, percent, orientation.direction) : 0;
    (0, $LI8jA.useEffect)(()=>{
        if (thumb) {
            context.thumbs.add(thumb);
            return ()=>{
                context.thumbs.delete(thumb);
            };
        }
    }, [
        thumb,
        context.thumbs
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)("span", {
        style: {
            transform: "var(--radix-slider-thumb-transform)",
            position: "absolute",
            [orientation.startEdge]: `calc(${percent}% + ${thumbInBoundsOffset}px)`
        }
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($f6c81c3212943ddd$var$$faa2e61a3361514f$var$Collection.ItemSlot, {
        scope: props.__scopeSlider
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).span, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        role: "slider",
        "aria-label": props["aria-label"] || label,
        "aria-valuemin": context.min,
        "aria-valuenow": value,
        "aria-valuemax": context.max,
        "aria-orientation": context.orientation,
        "data-orientation": context.orientation,
        "data-disabled": context.disabled ? "" : undefined,
        tabIndex: context.disabled ? undefined : 0
    }, thumbProps, {
        ref: composedRefs,
        style: value === undefined ? {
            display: "none"
        } : props.style,
        onFocus: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onFocus, ()=>{
            context.valueIndexToChangeRef.current = index;
        })
    }))));
});
/*#__PURE__*/ Object.assign($f6c81c3212943ddd$export$2c1b491743890dec, {
    displayName: $f6c81c3212943ddd$var$$faa2e61a3361514f$var$THUMB_NAME
});
/* -----------------------------------------------------------------------------------------------*/ const $f6c81c3212943ddd$var$$faa2e61a3361514f$var$BubbleInput = (props)=>{
    const { value: value , ...inputProps } = props;
    const ref = (0, $LI8jA.useRef)(null);
    const prevValue = (0, $760b241fb7cd5f92$export$5cae361ad82dce8b)(value); // Bubble value change to parents (e.g form change event)
    (0, $LI8jA.useEffect)(()=>{
        const input = ref.current;
        const inputProto = window.HTMLInputElement.prototype;
        const descriptor = Object.getOwnPropertyDescriptor(inputProto, "value");
        const setValue = descriptor.set;
        if (prevValue !== value && setValue) {
            const event = new Event("input", {
                bubbles: true
            });
            setValue.call(input, value);
            input.dispatchEvent(event);
        }
    }, [
        prevValue,
        value
    ]);
    /**
   * We purposefully do not use `type="hidden"` here otherwise forms that
   * wrap it will not be able to access its value via the FormData API.
   *
   * We purposefully do not add the `value` attribute here to allow the value
   * to be set programatically and bubble to any parent form `onChange` event.
   * Adding the `value` will cause React to consider the programatic
   * dispatch a duplicate and it will get swallowed.
   */ return /*#__PURE__*/ (0, $LI8jA.createElement)("input", (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        style: {
            display: "none"
        }
    }, inputProps, {
        ref: ref,
        defaultValue: value
    }));
};
function $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getNextSortedValues(prevValues = [], nextValue, atIndex) {
    const nextValues = [
        ...prevValues
    ];
    nextValues[atIndex] = nextValue;
    return nextValues.sort((a, b)=>a - b);
}
function $f6c81c3212943ddd$var$$faa2e61a3361514f$var$convertValueToPercentage(value, min, max) {
    const maxSteps = max - min;
    const percentPerStep = 100 / maxSteps;
    const percentage = percentPerStep * (value - min);
    return (0, $6997abd862cdf210$export$7d15b64cf5a3a4c4)(percentage, [
        0,
        100
    ]);
}
/**
 * Returns a label for each thumb when there are two or more thumbs
 */ function $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getLabel(index, totalValues) {
    if (totalValues > 2) return `Value ${index + 1} of ${totalValues}`;
    else if (totalValues === 2) return [
        "Minimum",
        "Maximum"
    ][index];
    else return undefined;
}
/**
 * Given a `values` array and a `nextValue`, determine which value in
 * the array is closest to `nextValue` and return its index.
 *
 * @example
 * // returns 1
 * getClosestValueIndex([10, 30], 25);
 */ function $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getClosestValueIndex(values, nextValue) {
    if (values.length === 1) return 0;
    const distances = values.map((value)=>Math.abs(value - nextValue));
    const closestDistance = Math.min(...distances);
    return distances.indexOf(closestDistance);
}
/**
 * Offsets the thumb centre point while sliding to ensure it remains
 * within the bounds of the slider when reaching the edges
 */ function $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getThumbInBoundsOffset(width, left, direction) {
    const halfWidth = width / 2;
    const halfPercent = 50;
    const offset = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$linearScale([
        0,
        halfPercent
    ], [
        0,
        halfWidth
    ]);
    return (halfWidth - offset(left) * direction) * direction;
}
/**
 * Gets an array of steps between each value.
 *
 * @example
 * // returns [1, 9]
 * getStepsBetweenValues([10, 11, 20]);
 */ function $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getStepsBetweenValues(values) {
    return values.slice(0, -1).map((value, index)=>values[index + 1] - value);
}
/**
 * Verifies the minimum steps between all values is greater than or equal
 * to the expected minimum steps.
 *
 * @example
 * // returns false
 * hasMinStepsBetweenValues([1,2,3], 2);
 *
 * @example
 * // returns true
 * hasMinStepsBetweenValues([1,2,3], 1);
 */ function $f6c81c3212943ddd$var$$faa2e61a3361514f$var$hasMinStepsBetweenValues(values, minStepsBetweenValues) {
    if (minStepsBetweenValues > 0) {
        const stepsBetweenValues = $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getStepsBetweenValues(values);
        const actualMinStepsBetweenValues = Math.min(...stepsBetweenValues);
        return actualMinStepsBetweenValues >= minStepsBetweenValues;
    }
    return true;
} // https://github.com/tmcw-up-for-adoption/simple-linear-scale/blob/master/index.js
function $f6c81c3212943ddd$var$$faa2e61a3361514f$var$linearScale(input, output) {
    return (value)=>{
        if (input[0] === input[1] || output[0] === output[1]) return output[0];
        const ratio = (output[1] - output[0]) / (input[1] - input[0]);
        return output[0] + ratio * (value - input[0]);
    };
}
function $f6c81c3212943ddd$var$$faa2e61a3361514f$var$getDecimalCount(value) {
    return (String(value).split(".")[1] || "").length;
}
function $f6c81c3212943ddd$var$$faa2e61a3361514f$var$roundValue(value, decimalCount) {
    const rounder = Math.pow(10, decimalCount);
    return Math.round(value * rounder) / rounder;
}
const $f6c81c3212943ddd$export$be92b6f5f03c0fe9 = $f6c81c3212943ddd$export$472062a354075cee;
const $f6c81c3212943ddd$export$13921ac0cc260818 = $f6c81c3212943ddd$export$105594979f116971;
const $f6c81c3212943ddd$export$9a58ef0d7ad3278c = $f6c81c3212943ddd$export$a5cf38a7a000fe77;
const $f6c81c3212943ddd$export$6521433ed15a34db = $f6c81c3212943ddd$export$2c1b491743890dec;



const $c38718c2690bae4e$export$472062a354075cee = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsxs)($f6c81c3212943ddd$export$be92b6f5f03c0fe9, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__slider", "relative flex w-full touch-none select-none items-center", className),
        ...props,
        children: [
            /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($f6c81c3212943ddd$export$13921ac0cc260818, {
                className: "relative h-2 w-full grow overflow-hidden rounded-full bg-secondary",
                children: /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($f6c81c3212943ddd$export$9a58ef0d7ad3278c, {
                    className: "absolute h-full bg-primary"
                })
            }),
            /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($f6c81c3212943ddd$export$6521433ed15a34db, {
                className: "block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            })
        ]
    }));
$c38718c2690bae4e$export$472062a354075cee.displayName = $f6c81c3212943ddd$export$be92b6f5f03c0fe9.displayName;




var $LI8jA = parcelRequire("LI8jA");


var $LI8jA = parcelRequire("LI8jA");







var $LI8jA = parcelRequire("LI8jA");







var $LI8jA = parcelRequire("LI8jA");





var $LI8jA = parcelRequire("LI8jA");

/**
 * Listens for when the escape key is down
 */ function $2b63fd4f761d8854$export$3a72a57244d6e765(onEscapeKeyDownProp, ownerDocument = globalThis === null || globalThis === void 0 ? void 0 : globalThis.document) {
    const onEscapeKeyDown = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onEscapeKeyDownProp);
    (0, $LI8jA.useEffect)(()=>{
        const handleKeyDown = (event)=>{
            if (event.key === "Escape") onEscapeKeyDown(event);
        };
        ownerDocument.addEventListener("keydown", handleKeyDown);
        return ()=>ownerDocument.removeEventListener("keydown", handleKeyDown);
    }, [
        onEscapeKeyDown,
        ownerDocument
    ]);
}


/* -------------------------------------------------------------------------------------------------
 * DismissableLayer
 * -----------------------------------------------------------------------------------------------*/ const $a102e9b8e3188262$var$$5cb92bef7577960e$var$DISMISSABLE_LAYER_NAME = "DismissableLayer";
const $a102e9b8e3188262$var$$5cb92bef7577960e$var$CONTEXT_UPDATE = "dismissableLayer.update";
const $a102e9b8e3188262$var$$5cb92bef7577960e$var$POINTER_DOWN_OUTSIDE = "dismissableLayer.pointerDownOutside";
const $a102e9b8e3188262$var$$5cb92bef7577960e$var$FOCUS_OUTSIDE = "dismissableLayer.focusOutside";
let $a102e9b8e3188262$var$$5cb92bef7577960e$var$originalBodyPointerEvents;
const $a102e9b8e3188262$var$$5cb92bef7577960e$var$DismissableLayerContext = /*#__PURE__*/ (0, $LI8jA.createContext)({
    layers: new Set(),
    layersWithOutsidePointerEventsDisabled: new Set(),
    branches: new Set()
});
const $a102e9b8e3188262$export$177fb62ff3ec1f22 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    var _node$ownerDocument;
    const { disableOutsidePointerEvents: disableOutsidePointerEvents = false , onEscapeKeyDown: onEscapeKeyDown , onPointerDownOutside: onPointerDownOutside , onFocusOutside: onFocusOutside , onInteractOutside: onInteractOutside , onDismiss: onDismiss , ...layerProps } = props;
    const context = (0, $LI8jA.useContext)($a102e9b8e3188262$var$$5cb92bef7577960e$var$DismissableLayerContext);
    const [node1, setNode] = (0, $LI8jA.useState)(null);
    const ownerDocument = (_node$ownerDocument = node1 === null || node1 === void 0 ? void 0 : node1.ownerDocument) !== null && _node$ownerDocument !== void 0 ? _node$ownerDocument : globalThis === null || globalThis === void 0 ? void 0 : globalThis.document;
    const [, force] = (0, $LI8jA.useState)({});
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, (node)=>setNode(node));
    const layers = Array.from(context.layers);
    const [highestLayerWithOutsidePointerEventsDisabled] = [
        ...context.layersWithOutsidePointerEventsDisabled
    ].slice(-1); // prettier-ignore
    const highestLayerWithOutsidePointerEventsDisabledIndex = layers.indexOf(highestLayerWithOutsidePointerEventsDisabled); // prettier-ignore
    const index = node1 ? layers.indexOf(node1) : -1;
    const isBodyPointerEventsDisabled = context.layersWithOutsidePointerEventsDisabled.size > 0;
    const isPointerEventsEnabled = index >= highestLayerWithOutsidePointerEventsDisabledIndex;
    const pointerDownOutside = $a102e9b8e3188262$var$$5cb92bef7577960e$var$usePointerDownOutside((event)=>{
        const target = event.target;
        const isPointerDownOnBranch = [
            ...context.branches
        ].some((branch)=>branch.contains(target));
        if (!isPointerEventsEnabled || isPointerDownOnBranch) return;
        onPointerDownOutside === null || onPointerDownOutside === void 0 || onPointerDownOutside(event);
        onInteractOutside === null || onInteractOutside === void 0 || onInteractOutside(event);
        if (!event.defaultPrevented) onDismiss === null || onDismiss === void 0 || onDismiss();
    }, ownerDocument);
    const focusOutside = $a102e9b8e3188262$var$$5cb92bef7577960e$var$useFocusOutside((event)=>{
        const target = event.target;
        const isFocusInBranch = [
            ...context.branches
        ].some((branch)=>branch.contains(target));
        if (isFocusInBranch) return;
        onFocusOutside === null || onFocusOutside === void 0 || onFocusOutside(event);
        onInteractOutside === null || onInteractOutside === void 0 || onInteractOutside(event);
        if (!event.defaultPrevented) onDismiss === null || onDismiss === void 0 || onDismiss();
    }, ownerDocument);
    (0, $2b63fd4f761d8854$export$3a72a57244d6e765)((event)=>{
        const isHighestLayer = index === context.layers.size - 1;
        if (!isHighestLayer) return;
        onEscapeKeyDown === null || onEscapeKeyDown === void 0 || onEscapeKeyDown(event);
        if (!event.defaultPrevented && onDismiss) {
            event.preventDefault();
            onDismiss();
        }
    }, ownerDocument);
    (0, $LI8jA.useEffect)(()=>{
        if (!node1) return;
        if (disableOutsidePointerEvents) {
            if (context.layersWithOutsidePointerEventsDisabled.size === 0) {
                $a102e9b8e3188262$var$$5cb92bef7577960e$var$originalBodyPointerEvents = ownerDocument.body.style.pointerEvents;
                ownerDocument.body.style.pointerEvents = "none";
            }
            context.layersWithOutsidePointerEventsDisabled.add(node1);
        }
        context.layers.add(node1);
        $a102e9b8e3188262$var$$5cb92bef7577960e$var$dispatchUpdate();
        return ()=>{
            if (disableOutsidePointerEvents && context.layersWithOutsidePointerEventsDisabled.size === 1) ownerDocument.body.style.pointerEvents = $a102e9b8e3188262$var$$5cb92bef7577960e$var$originalBodyPointerEvents;
        };
    }, [
        node1,
        ownerDocument,
        disableOutsidePointerEvents,
        context
    ]);
    /**
   * We purposefully prevent combining this effect with the `disableOutsidePointerEvents` effect
   * because a change to `disableOutsidePointerEvents` would remove this layer from the stack
   * and add it to the end again so the layering order wouldn't be _creation order_.
   * We only want them to be removed from context stacks when unmounted.
   */ (0, $LI8jA.useEffect)(()=>{
        return ()=>{
            if (!node1) return;
            context.layers.delete(node1);
            context.layersWithOutsidePointerEventsDisabled.delete(node1);
            $a102e9b8e3188262$var$$5cb92bef7577960e$var$dispatchUpdate();
        };
    }, [
        node1,
        context
    ]);
    (0, $LI8jA.useEffect)(()=>{
        const handleUpdate = ()=>force({});
        document.addEventListener($a102e9b8e3188262$var$$5cb92bef7577960e$var$CONTEXT_UPDATE, handleUpdate);
        return ()=>document.removeEventListener($a102e9b8e3188262$var$$5cb92bef7577960e$var$CONTEXT_UPDATE, handleUpdate);
    }, []);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, layerProps, {
        ref: composedRefs,
        style: {
            pointerEvents: isBodyPointerEventsDisabled ? isPointerEventsEnabled ? "auto" : "none" : undefined,
            ...props.style
        },
        onFocusCapture: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onFocusCapture, focusOutside.onFocusCapture),
        onBlurCapture: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onBlurCapture, focusOutside.onBlurCapture),
        onPointerDownCapture: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerDownCapture, pointerDownOutside.onPointerDownCapture)
    }));
});
/*#__PURE__*/ Object.assign($a102e9b8e3188262$export$177fb62ff3ec1f22, {
    displayName: $a102e9b8e3188262$var$$5cb92bef7577960e$var$DISMISSABLE_LAYER_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DismissableLayerBranch
 * -----------------------------------------------------------------------------------------------*/ const $a102e9b8e3188262$var$$5cb92bef7577960e$var$BRANCH_NAME = "DismissableLayerBranch";
const $a102e9b8e3188262$export$4d5eb2109db14228 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const context = (0, $LI8jA.useContext)($a102e9b8e3188262$var$$5cb92bef7577960e$var$DismissableLayerContext);
    const ref = (0, $LI8jA.useRef)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, ref);
    (0, $LI8jA.useEffect)(()=>{
        const node = ref.current;
        if (node) {
            context.branches.add(node);
            return ()=>{
                context.branches.delete(node);
            };
        }
    }, [
        context.branches
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, props, {
        ref: composedRefs
    }));
});
/*#__PURE__*/ Object.assign($a102e9b8e3188262$export$4d5eb2109db14228, {
    displayName: $a102e9b8e3188262$var$$5cb92bef7577960e$var$BRANCH_NAME
});
/* -----------------------------------------------------------------------------------------------*/ /**
 * Listens for `pointerdown` outside a react subtree. We use `pointerdown` rather than `pointerup`
 * to mimic layer dismissing behaviour present in OS.
 * Returns props to pass to the node we want to check for outside events.
 */ function $a102e9b8e3188262$var$$5cb92bef7577960e$var$usePointerDownOutside(onPointerDownOutside, ownerDocument = globalThis === null || globalThis === void 0 ? void 0 : globalThis.document) {
    const handlePointerDownOutside = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onPointerDownOutside);
    const isPointerInsideReactTreeRef = (0, $LI8jA.useRef)(false);
    const handleClickRef = (0, $LI8jA.useRef)(()=>{});
    (0, $LI8jA.useEffect)(()=>{
        const handlePointerDown = (event)=>{
            if (event.target && !isPointerInsideReactTreeRef.current) {
                const eventDetail = {
                    originalEvent: event
                };
                function handleAndDispatchPointerDownOutsideEvent() {
                    $a102e9b8e3188262$var$$5cb92bef7577960e$var$handleAndDispatchCustomEvent($a102e9b8e3188262$var$$5cb92bef7577960e$var$POINTER_DOWN_OUTSIDE, handlePointerDownOutside, eventDetail, {
                        discrete: true
                    });
                }
                /**
         * On touch devices, we need to wait for a click event because browsers implement
         * a ~350ms delay between the time the user stops touching the display and when the
         * browser executres events. We need to ensure we don't reactivate pointer-events within
         * this timeframe otherwise the browser may execute events that should have been prevented.
         *
         * Additionally, this also lets us deal automatically with cancellations when a click event
         * isn't raised because the page was considered scrolled/drag-scrolled, long-pressed, etc.
         *
         * This is why we also continuously remove the previous listener, because we cannot be
         * certain that it was raised, and therefore cleaned-up.
         */ if (event.pointerType === "touch") {
                    ownerDocument.removeEventListener("click", handleClickRef.current);
                    handleClickRef.current = handleAndDispatchPointerDownOutsideEvent;
                    ownerDocument.addEventListener("click", handleClickRef.current, {
                        once: true
                    });
                } else handleAndDispatchPointerDownOutsideEvent();
            } else // See: https://github.com/radix-ui/primitives/issues/2171
            ownerDocument.removeEventListener("click", handleClickRef.current);
            isPointerInsideReactTreeRef.current = false;
        };
        /**
     * if this hook executes in a component that mounts via a `pointerdown` event, the event
     * would bubble up to the document and trigger a `pointerDownOutside` event. We avoid
     * this by delaying the event listener registration on the document.
     * This is not React specific, but rather how the DOM works, ie:
     * ```
     * button.addEventListener('pointerdown', () => {
     *   console.log('I will log');
     *   document.addEventListener('pointerdown', () => {
     *     console.log('I will also log');
     *   })
     * });
     */ const timerId = window.setTimeout(()=>{
            ownerDocument.addEventListener("pointerdown", handlePointerDown);
        }, 0);
        return ()=>{
            window.clearTimeout(timerId);
            ownerDocument.removeEventListener("pointerdown", handlePointerDown);
            ownerDocument.removeEventListener("click", handleClickRef.current);
        };
    }, [
        ownerDocument,
        handlePointerDownOutside
    ]);
    return {
        // ensures we check React component tree (not just DOM tree)
        onPointerDownCapture: ()=>isPointerInsideReactTreeRef.current = true
    };
}
/**
 * Listens for when focus happens outside a react subtree.
 * Returns props to pass to the root (node) of the subtree we want to check.
 */ function $a102e9b8e3188262$var$$5cb92bef7577960e$var$useFocusOutside(onFocusOutside, ownerDocument = globalThis === null || globalThis === void 0 ? void 0 : globalThis.document) {
    const handleFocusOutside = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onFocusOutside);
    const isFocusInsideReactTreeRef = (0, $LI8jA.useRef)(false);
    (0, $LI8jA.useEffect)(()=>{
        const handleFocus = (event)=>{
            if (event.target && !isFocusInsideReactTreeRef.current) {
                const eventDetail = {
                    originalEvent: event
                };
                $a102e9b8e3188262$var$$5cb92bef7577960e$var$handleAndDispatchCustomEvent($a102e9b8e3188262$var$$5cb92bef7577960e$var$FOCUS_OUTSIDE, handleFocusOutside, eventDetail, {
                    discrete: false
                });
            }
        };
        ownerDocument.addEventListener("focusin", handleFocus);
        return ()=>ownerDocument.removeEventListener("focusin", handleFocus);
    }, [
        ownerDocument,
        handleFocusOutside
    ]);
    return {
        onFocusCapture: ()=>isFocusInsideReactTreeRef.current = true,
        onBlurCapture: ()=>isFocusInsideReactTreeRef.current = false
    };
}
function $a102e9b8e3188262$var$$5cb92bef7577960e$var$dispatchUpdate() {
    const event = new CustomEvent($a102e9b8e3188262$var$$5cb92bef7577960e$var$CONTEXT_UPDATE);
    document.dispatchEvent(event);
}
function $a102e9b8e3188262$var$$5cb92bef7577960e$var$handleAndDispatchCustomEvent(name, handler, detail, { discrete: discrete  }) {
    const target = detail.originalEvent.target;
    const event = new CustomEvent(name, {
        bubbles: false,
        cancelable: true,
        detail: detail
    });
    if (handler) target.addEventListener(name, handler, {
        once: true
    });
    if (discrete) (0, $a68e7d99b5d35ecf$export$6d1a0317bde7de7f)(target, event);
    else target.dispatchEvent(event);
}
const $a102e9b8e3188262$export$be92b6f5f03c0fe9 = $a102e9b8e3188262$export$177fb62ff3ec1f22;
const $a102e9b8e3188262$export$aecb2ddcb55c95be = $a102e9b8e3188262$export$4d5eb2109db14228;



var $LI8jA = parcelRequire("LI8jA");
/** Number of components which have requested interest to have focus guards */ let $a8797df59e287e29$var$$3db38b7d1fb3fe6a$var$count = 0;
function $a8797df59e287e29$export$ac5b58043b79449b(props) {
    $a8797df59e287e29$export$b7ece24a22aeda8c();
    return props.children;
}
/**
 * Injects a pair of focus guards at the edges of the whole DOM tree
 * to ensure `focusin` & `focusout` events can be caught consistently.
 */ function $a8797df59e287e29$export$b7ece24a22aeda8c() {
    (0, $LI8jA.useEffect)(()=>{
        var _edgeGuards$, _edgeGuards$2;
        const edgeGuards = document.querySelectorAll("[data-radix-focus-guard]");
        document.body.insertAdjacentElement("afterbegin", (_edgeGuards$ = edgeGuards[0]) !== null && _edgeGuards$ !== void 0 ? _edgeGuards$ : $a8797df59e287e29$var$$3db38b7d1fb3fe6a$var$createFocusGuard());
        document.body.insertAdjacentElement("beforeend", (_edgeGuards$2 = edgeGuards[1]) !== null && _edgeGuards$2 !== void 0 ? _edgeGuards$2 : $a8797df59e287e29$var$$3db38b7d1fb3fe6a$var$createFocusGuard());
        $a8797df59e287e29$var$$3db38b7d1fb3fe6a$var$count++;
        return ()=>{
            if ($a8797df59e287e29$var$$3db38b7d1fb3fe6a$var$count === 1) document.querySelectorAll("[data-radix-focus-guard]").forEach((node)=>node.remove());
            $a8797df59e287e29$var$$3db38b7d1fb3fe6a$var$count--;
        };
    }, []);
}
function $a8797df59e287e29$var$$3db38b7d1fb3fe6a$var$createFocusGuard() {
    const element = document.createElement("span");
    element.setAttribute("data-radix-focus-guard", "");
    element.tabIndex = 0;
    element.style.cssText = "outline: none; opacity: 0; position: fixed; pointer-events: none";
    return element;
}
const $a8797df59e287e29$export$be92b6f5f03c0fe9 = $a8797df59e287e29$export$ac5b58043b79449b;




var $LI8jA = parcelRequire("LI8jA");



const $a69c668904a4ce70$var$$d3863c46a17e8a28$var$AUTOFOCUS_ON_MOUNT = "focusScope.autoFocusOnMount";
const $a69c668904a4ce70$var$$d3863c46a17e8a28$var$AUTOFOCUS_ON_UNMOUNT = "focusScope.autoFocusOnUnmount";
const $a69c668904a4ce70$var$$d3863c46a17e8a28$var$EVENT_OPTIONS = {
    bubbles: false,
    cancelable: true
};
/* -------------------------------------------------------------------------------------------------
 * FocusScope
 * -----------------------------------------------------------------------------------------------*/ const $a69c668904a4ce70$var$$d3863c46a17e8a28$var$FOCUS_SCOPE_NAME = "FocusScope";
const $a69c668904a4ce70$export$20e40289641fbbb6 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { loop: loop = false , trapped: trapped = false , onMountAutoFocus: onMountAutoFocusProp , onUnmountAutoFocus: onUnmountAutoFocusProp , ...scopeProps } = props;
    const [container1, setContainer] = (0, $LI8jA.useState)(null);
    const onMountAutoFocus = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onMountAutoFocusProp);
    const onUnmountAutoFocus = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onUnmountAutoFocusProp);
    const lastFocusedElementRef = (0, $LI8jA.useRef)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, (node)=>setContainer(node));
    const focusScope = (0, $LI8jA.useRef)({
        paused: false,
        pause () {
            this.paused = true;
        },
        resume () {
            this.paused = false;
        }
    }).current; // Takes care of trapping focus if focus is moved outside programmatically for example
    (0, $LI8jA.useEffect)(()=>{
        if (trapped) {
            function handleFocusIn(event) {
                if (focusScope.paused || !container1) return;
                const target = event.target;
                if (container1.contains(target)) lastFocusedElementRef.current = target;
                else $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focus(lastFocusedElementRef.current, {
                    select: true
                });
            }
            function handleFocusOut(event) {
                if (focusScope.paused || !container1) return;
                const relatedTarget = event.relatedTarget; // A `focusout` event with a `null` `relatedTarget` will happen in at least two cases:
                //
                // 1. When the user switches app/tabs/windows/the browser itself loses focus.
                // 2. In Google Chrome, when the focused element is removed from the DOM.
                //
                // We let the browser do its thing here because:
                //
                // 1. The browser already keeps a memory of what's focused for when the page gets refocused.
                // 2. In Google Chrome, if we try to focus the deleted focused element (as per below), it
                //    throws the CPU to 100%, so we avoid doing anything for this reason here too.
                if (relatedTarget === null) return; // If the focus has moved to an actual legitimate element (`relatedTarget !== null`)
                // that is outside the container, we move focus to the last valid focused element inside.
                if (!container1.contains(relatedTarget)) $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focus(lastFocusedElementRef.current, {
                    select: true
                });
            } // When the focused element gets removed from the DOM, browsers move focus
            // back to the document.body. In this case, we move focus to the container
            // to keep focus trapped correctly.
            function handleMutations(mutations) {
                const focusedElement = document.activeElement;
                if (focusedElement !== document.body) return;
                for (const mutation of mutations)if (mutation.removedNodes.length > 0) $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focus(container1);
            }
            document.addEventListener("focusin", handleFocusIn);
            document.addEventListener("focusout", handleFocusOut);
            const mutationObserver = new MutationObserver(handleMutations);
            if (container1) mutationObserver.observe(container1, {
                childList: true,
                subtree: true
            });
            return ()=>{
                document.removeEventListener("focusin", handleFocusIn);
                document.removeEventListener("focusout", handleFocusOut);
                mutationObserver.disconnect();
            };
        }
    }, [
        trapped,
        container1,
        focusScope.paused
    ]);
    (0, $LI8jA.useEffect)(()=>{
        if (container1) {
            $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focusScopesStack.add(focusScope);
            const previouslyFocusedElement = document.activeElement;
            const hasFocusedCandidate = container1.contains(previouslyFocusedElement);
            if (!hasFocusedCandidate) {
                const mountEvent = new CustomEvent($a69c668904a4ce70$var$$d3863c46a17e8a28$var$AUTOFOCUS_ON_MOUNT, $a69c668904a4ce70$var$$d3863c46a17e8a28$var$EVENT_OPTIONS);
                container1.addEventListener($a69c668904a4ce70$var$$d3863c46a17e8a28$var$AUTOFOCUS_ON_MOUNT, onMountAutoFocus);
                container1.dispatchEvent(mountEvent);
                if (!mountEvent.defaultPrevented) {
                    $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focusFirst($a69c668904a4ce70$var$$d3863c46a17e8a28$var$removeLinks($a69c668904a4ce70$var$$d3863c46a17e8a28$var$getTabbableCandidates(container1)), {
                        select: true
                    });
                    if (document.activeElement === previouslyFocusedElement) $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focus(container1);
                }
            }
            return ()=>{
                container1.removeEventListener($a69c668904a4ce70$var$$d3863c46a17e8a28$var$AUTOFOCUS_ON_MOUNT, onMountAutoFocus); // We hit a react bug (fixed in v17) with focusing in unmount.
                // We need to delay the focus a little to get around it for now.
                // See: https://github.com/facebook/react/issues/17894
                setTimeout(()=>{
                    const unmountEvent = new CustomEvent($a69c668904a4ce70$var$$d3863c46a17e8a28$var$AUTOFOCUS_ON_UNMOUNT, $a69c668904a4ce70$var$$d3863c46a17e8a28$var$EVENT_OPTIONS);
                    container1.addEventListener($a69c668904a4ce70$var$$d3863c46a17e8a28$var$AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
                    container1.dispatchEvent(unmountEvent);
                    if (!unmountEvent.defaultPrevented) $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focus(previouslyFocusedElement !== null && previouslyFocusedElement !== void 0 ? previouslyFocusedElement : document.body, {
                        select: true
                    });
                    // we need to remove the listener after we `dispatchEvent`
                    container1.removeEventListener($a69c668904a4ce70$var$$d3863c46a17e8a28$var$AUTOFOCUS_ON_UNMOUNT, onUnmountAutoFocus);
                    $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focusScopesStack.remove(focusScope);
                }, 0);
            };
        }
    }, [
        container1,
        onMountAutoFocus,
        onUnmountAutoFocus,
        focusScope
    ]); // Takes care of looping focus (when tabbing whilst at the edges)
    const handleKeyDown = (0, $LI8jA.useCallback)((event)=>{
        if (!loop && !trapped) return;
        if (focusScope.paused) return;
        const isTabKey = event.key === "Tab" && !event.altKey && !event.ctrlKey && !event.metaKey;
        const focusedElement = document.activeElement;
        if (isTabKey && focusedElement) {
            const container = event.currentTarget;
            const [first, last] = $a69c668904a4ce70$var$$d3863c46a17e8a28$var$getTabbableEdges(container);
            const hasTabbableElementsInside = first && last; // we can only wrap focus if we have tabbable edges
            if (!hasTabbableElementsInside) {
                if (focusedElement === container) event.preventDefault();
            } else {
                if (!event.shiftKey && focusedElement === last) {
                    event.preventDefault();
                    if (loop) $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focus(first, {
                        select: true
                    });
                } else if (event.shiftKey && focusedElement === first) {
                    event.preventDefault();
                    if (loop) $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focus(last, {
                        select: true
                    });
                }
            }
        }
    }, [
        loop,
        trapped,
        focusScope.paused
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        tabIndex: -1
    }, scopeProps, {
        ref: composedRefs,
        onKeyDown: handleKeyDown
    }));
});
/*#__PURE__*/ Object.assign($a69c668904a4ce70$export$20e40289641fbbb6, {
    displayName: $a69c668904a4ce70$var$$d3863c46a17e8a28$var$FOCUS_SCOPE_NAME
});
/* -------------------------------------------------------------------------------------------------
 * Utils
 * -----------------------------------------------------------------------------------------------*/ /**
 * Attempts focusing the first element in a list of candidates.
 * Stops when focus has actually moved.
 */ function $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focusFirst(candidates, { select: select = false  } = {}) {
    const previouslyFocusedElement = document.activeElement;
    for (const candidate of candidates){
        $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focus(candidate, {
            select: select
        });
        if (document.activeElement !== previouslyFocusedElement) return;
    }
}
/**
 * Returns the first and last tabbable elements inside a container.
 */ function $a69c668904a4ce70$var$$d3863c46a17e8a28$var$getTabbableEdges(container) {
    const candidates = $a69c668904a4ce70$var$$d3863c46a17e8a28$var$getTabbableCandidates(container);
    const first = $a69c668904a4ce70$var$$d3863c46a17e8a28$var$findVisible(candidates, container);
    const last = $a69c668904a4ce70$var$$d3863c46a17e8a28$var$findVisible(candidates.reverse(), container);
    return [
        first,
        last
    ];
}
/**
 * Returns a list of potential tabbable candidates.
 *
 * NOTE: This is only a close approximation. For example it doesn't take into account cases like when
 * elements are not visible. This cannot be worked out easily by just reading a property, but rather
 * necessitate runtime knowledge (computed styles, etc). We deal with these cases separately.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker
 * Credit: https://github.com/discord/focus-layers/blob/master/src/util/wrapFocus.tsx#L1
 */ function $a69c668904a4ce70$var$$d3863c46a17e8a28$var$getTabbableCandidates(container) {
    const nodes = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node)=>{
            const isHiddenInput = node.tagName === "INPUT" && node.type === "hidden";
            if (node.disabled || node.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP; // `.tabIndex` is not the same as the `tabindex` attribute. It works on the
            // runtime's understanding of tabbability, so this automatically accounts
            // for any kind of element that could be tabbed to.
            return node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
    });
    while(walker.nextNode())nodes.push(walker.currentNode); // we do not take into account the order of nodes with positive `tabIndex` as it
    // hinders accessibility to have tab order different from visual order.
    return nodes;
}
/**
 * Returns the first visible element in a list.
 * NOTE: Only checks visibility up to the `container`.
 */ function $a69c668904a4ce70$var$$d3863c46a17e8a28$var$findVisible(elements, container) {
    for (const element of elements){
        // we stop checking if it's hidden at the `container` level (excluding)
        if (!$a69c668904a4ce70$var$$d3863c46a17e8a28$var$isHidden(element, {
            upTo: container
        })) return element;
    }
}
function $a69c668904a4ce70$var$$d3863c46a17e8a28$var$isHidden(node, { upTo: upTo  }) {
    if (getComputedStyle(node).visibility === "hidden") return true;
    while(node){
        // we stop at `upTo` (excluding it)
        if (upTo !== undefined && node === upTo) return false;
        if (getComputedStyle(node).display === "none") return true;
        node = node.parentElement;
    }
    return false;
}
function $a69c668904a4ce70$var$$d3863c46a17e8a28$var$isSelectableInput(element) {
    return element instanceof HTMLInputElement && "select" in element;
}
function $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focus(element, { select: select = false  } = {}) {
    // only focus if that element is focusable
    if (element && element.focus) {
        const previouslyFocusedElement = document.activeElement; // NOTE: we prevent scrolling on focus, to minimize jarring transitions for users
        element.focus({
            preventScroll: true
        }); // only select if its not the same element, it supports selection and we need to select
        if (element !== previouslyFocusedElement && $a69c668904a4ce70$var$$d3863c46a17e8a28$var$isSelectableInput(element) && select) element.select();
    }
}
/* -------------------------------------------------------------------------------------------------
 * FocusScope stack
 * -----------------------------------------------------------------------------------------------*/ const $a69c668904a4ce70$var$$d3863c46a17e8a28$var$focusScopesStack = $a69c668904a4ce70$var$$d3863c46a17e8a28$var$createFocusScopesStack();
function $a69c668904a4ce70$var$$d3863c46a17e8a28$var$createFocusScopesStack() {
    /** A stack of focus scopes, with the active one at the top */ let stack = [];
    return {
        add (focusScope) {
            // pause the currently active focus scope (at the top of the stack)
            const activeFocusScope = stack[0];
            if (focusScope !== activeFocusScope) activeFocusScope === null || activeFocusScope === void 0 || activeFocusScope.pause();
            // remove in case it already exists (because we'll re-add it at the top of the stack)
            stack = $a69c668904a4ce70$var$$d3863c46a17e8a28$var$arrayRemove(stack, focusScope);
            stack.unshift(focusScope);
        },
        remove (focusScope) {
            var _stack$;
            stack = $a69c668904a4ce70$var$$d3863c46a17e8a28$var$arrayRemove(stack, focusScope);
            (_stack$ = stack[0]) === null || _stack$ === void 0 || _stack$.resume();
        }
    };
}
function $a69c668904a4ce70$var$$d3863c46a17e8a28$var$arrayRemove(array, item) {
    const updatedArray = [
        ...array
    ];
    const index = updatedArray.indexOf(item);
    if (index !== -1) updatedArray.splice(index, 1);
    return updatedArray;
}
function $a69c668904a4ce70$var$$d3863c46a17e8a28$var$removeLinks(items) {
    return items.filter((item)=>item.tagName !== "A");
}
const $a69c668904a4ce70$export$be92b6f5f03c0fe9 = $a69c668904a4ce70$export$20e40289641fbbb6;



var $LI8jA = parcelRequire("LI8jA");

const $d4070564f9335f17$var$$1746a345f3d73bb7$var$useReactId = $LI8jA["useId".toString()] || (()=>undefined);
let $d4070564f9335f17$var$$1746a345f3d73bb7$var$count = 0;
function $d4070564f9335f17$export$f680877a34711e37(deterministicId) {
    const [id, setId] = $LI8jA.useState($d4070564f9335f17$var$$1746a345f3d73bb7$var$useReactId()); // React versions older than 18 will have client-side ids only.
    (0, $620f4b520baef9c2$export$e5c5a5f917a5871c)(()=>{
        if (!deterministicId) setId((reactId)=>reactId !== null && reactId !== void 0 ? reactId : String($d4070564f9335f17$var$$1746a345f3d73bb7$var$count++));
    }, [
        deterministicId
    ]);
    return deterministicId || (id ? `radix-${id}` : "");
}




var $LI8jA = parcelRequire("LI8jA");
const $9c57d7f6c77aef10$export$832b6fa47fa053d2 = [
    "top",
    "right",
    "bottom",
    "left"
];
const $9c57d7f6c77aef10$export$27b07d8a310ed8b5 = [
    "start",
    "end"
];
const $9c57d7f6c77aef10$export$803cd8101b6c182b = /*#__PURE__*/ $9c57d7f6c77aef10$export$832b6fa47fa053d2.reduce((acc, side)=>acc.concat(side, side + "-" + $9c57d7f6c77aef10$export$27b07d8a310ed8b5[0], side + "-" + $9c57d7f6c77aef10$export$27b07d8a310ed8b5[1]), []);
const $9c57d7f6c77aef10$export$96ec731ed4dcb222 = Math.min;
const $9c57d7f6c77aef10$export$8960430cfd85939f = Math.max;
const $9c57d7f6c77aef10$export$2077e0241d6afd3c = Math.round;
const $9c57d7f6c77aef10$export$a3fe094919f356fd = Math.floor;
const $9c57d7f6c77aef10$export$a397704b5e280835 = (v)=>({
        x: v,
        y: v
    });
const $9c57d7f6c77aef10$var$oppositeSideMap = {
    left: "right",
    right: "left",
    bottom: "top",
    top: "bottom"
};
const $9c57d7f6c77aef10$var$oppositeAlignmentMap = {
    start: "end",
    end: "start"
};
function $9c57d7f6c77aef10$export$7d15b64cf5a3a4c4(start, value, end) {
    return $9c57d7f6c77aef10$export$8960430cfd85939f(start, $9c57d7f6c77aef10$export$96ec731ed4dcb222(value, end));
}
function $9c57d7f6c77aef10$export$fef61f332f2c0afc(value, param) {
    return typeof value === "function" ? value(param) : value;
}
function $9c57d7f6c77aef10$export$3c915306cb7fc97a(placement) {
    return placement.split("-")[0];
}
function $9c57d7f6c77aef10$export$f0989780f32bfcda(placement) {
    return placement.split("-")[1];
}
function $9c57d7f6c77aef10$export$8a000a963141ac32(axis) {
    return axis === "x" ? "y" : "x";
}
function $9c57d7f6c77aef10$export$320bd9d53520c68a(axis) {
    return axis === "y" ? "height" : "width";
}
function $9c57d7f6c77aef10$export$f28e8f882010718a(placement) {
    return [
        "top",
        "bottom"
    ].includes($9c57d7f6c77aef10$export$3c915306cb7fc97a(placement)) ? "y" : "x";
}
function $9c57d7f6c77aef10$export$2b57e0052a6d6d4c(placement) {
    return $9c57d7f6c77aef10$export$8a000a963141ac32($9c57d7f6c77aef10$export$f28e8f882010718a(placement));
}
function $9c57d7f6c77aef10$export$be42861551f17911(placement, rects, rtl) {
    if (rtl === void 0) rtl = false;
    const alignment = $9c57d7f6c77aef10$export$f0989780f32bfcda(placement);
    const alignmentAxis = $9c57d7f6c77aef10$export$2b57e0052a6d6d4c(placement);
    const length = $9c57d7f6c77aef10$export$320bd9d53520c68a(alignmentAxis);
    let mainAlignmentSide = alignmentAxis === "x" ? alignment === (rtl ? "end" : "start") ? "right" : "left" : alignment === "start" ? "bottom" : "top";
    if (rects.reference[length] > rects.floating[length]) mainAlignmentSide = $9c57d7f6c77aef10$export$9c5e28bad23365fa(mainAlignmentSide);
    return [
        mainAlignmentSide,
        $9c57d7f6c77aef10$export$9c5e28bad23365fa(mainAlignmentSide)
    ];
}
function $9c57d7f6c77aef10$export$496432a3699e50b1(placement) {
    const oppositePlacement = $9c57d7f6c77aef10$export$9c5e28bad23365fa(placement);
    return [
        $9c57d7f6c77aef10$export$2b182c584985588b(placement),
        oppositePlacement,
        $9c57d7f6c77aef10$export$2b182c584985588b(oppositePlacement)
    ];
}
function $9c57d7f6c77aef10$export$2b182c584985588b(placement) {
    return placement.replace(/start|end/g, (alignment)=>$9c57d7f6c77aef10$var$oppositeAlignmentMap[alignment]);
}
function $9c57d7f6c77aef10$var$getSideList(side, isStart, rtl) {
    const lr = [
        "left",
        "right"
    ];
    const rl = [
        "right",
        "left"
    ];
    const tb = [
        "top",
        "bottom"
    ];
    const bt = [
        "bottom",
        "top"
    ];
    switch(side){
        case "top":
        case "bottom":
            if (rtl) return isStart ? rl : lr;
            return isStart ? lr : rl;
        case "left":
        case "right":
            return isStart ? tb : bt;
        default:
            return [];
    }
}
function $9c57d7f6c77aef10$export$a9b6fb18fd92c3ec(placement, flipAlignment, direction, rtl) {
    const alignment = $9c57d7f6c77aef10$export$f0989780f32bfcda(placement);
    let list = $9c57d7f6c77aef10$var$getSideList($9c57d7f6c77aef10$export$3c915306cb7fc97a(placement), direction === "start", rtl);
    if (alignment) {
        list = list.map((side)=>side + "-" + alignment);
        if (flipAlignment) list = list.concat(list.map($9c57d7f6c77aef10$export$2b182c584985588b));
    }
    return list;
}
function $9c57d7f6c77aef10$export$9c5e28bad23365fa(placement) {
    return placement.replace(/left|right|bottom|top/g, (side)=>$9c57d7f6c77aef10$var$oppositeSideMap[side]);
}
function $9c57d7f6c77aef10$export$1c66dbf1a9e34223(padding) {
    return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        ...padding
    };
}
function $9c57d7f6c77aef10$export$598c291c29bc2e71(padding) {
    return typeof padding !== "number" ? $9c57d7f6c77aef10$export$1c66dbf1a9e34223(padding) : {
        top: padding,
        right: padding,
        bottom: padding,
        left: padding
    };
}
function $9c57d7f6c77aef10$export$ee05aea0aeecbad4(rect) {
    return {
        ...rect,
        top: rect.y,
        left: rect.x,
        right: rect.x + rect.width,
        bottom: rect.y + rect.height
    };
}



function $eccd427a125a3cdc$var$computeCoordsFromPlacement(_ref, placement, rtl) {
    let { reference: reference , floating: floating  } = _ref;
    const sideAxis = (0, $9c57d7f6c77aef10$export$f28e8f882010718a)(placement);
    const alignmentAxis = (0, $9c57d7f6c77aef10$export$2b57e0052a6d6d4c)(placement);
    const alignLength = (0, $9c57d7f6c77aef10$export$320bd9d53520c68a)(alignmentAxis);
    const side = (0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(placement);
    const isVertical = sideAxis === "y";
    const commonX = reference.x + reference.width / 2 - floating.width / 2;
    const commonY = reference.y + reference.height / 2 - floating.height / 2;
    const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
    let coords;
    switch(side){
        case "top":
            coords = {
                x: commonX,
                y: reference.y - floating.height
            };
            break;
        case "bottom":
            coords = {
                x: commonX,
                y: reference.y + reference.height
            };
            break;
        case "right":
            coords = {
                x: reference.x + reference.width,
                y: commonY
            };
            break;
        case "left":
            coords = {
                x: reference.x - floating.width,
                y: commonY
            };
            break;
        default:
            coords = {
                x: reference.x,
                y: reference.y
            };
    }
    switch((0, $9c57d7f6c77aef10$export$f0989780f32bfcda)(placement)){
        case "start":
            coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
            break;
        case "end":
            coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
            break;
    }
    return coords;
}
/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a reference element when it is given a certain positioning strategy.
 *
 * This export does not have any `platform` interface logic. You will need to
 * write one for the platform you are using Floating UI with.
 */ const $eccd427a125a3cdc$export$48a53dcb22e581d0 = async (reference, floating, config)=>{
    const { placement: placement = "bottom" , strategy: strategy = "absolute" , middleware: middleware = [] , platform: platform  } = config;
    const validMiddleware = middleware.filter(Boolean);
    const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
    let rects = await platform.getElementRects({
        reference: reference,
        floating: floating,
        strategy: strategy
    });
    let { x: x , y: y  } = $eccd427a125a3cdc$var$computeCoordsFromPlacement(rects, placement, rtl);
    let statefulPlacement = placement;
    let middlewareData = {};
    let resetCount = 0;
    for(let i = 0; i < validMiddleware.length; i++){
        const { name: name , fn: fn  } = validMiddleware[i];
        const { x: nextX , y: nextY , data: data , reset: reset  } = await fn({
            x: x,
            y: y,
            initialPlacement: placement,
            placement: statefulPlacement,
            strategy: strategy,
            middlewareData: middlewareData,
            rects: rects,
            platform: platform,
            elements: {
                reference: reference,
                floating: floating
            }
        });
        x = nextX != null ? nextX : x;
        y = nextY != null ? nextY : y;
        middlewareData = {
            ...middlewareData,
            [name]: {
                ...middlewareData[name],
                ...data
            }
        };
        if (reset && resetCount <= 50) {
            resetCount++;
            if (typeof reset === "object") {
                if (reset.placement) statefulPlacement = reset.placement;
                if (reset.rects) rects = reset.rects === true ? await platform.getElementRects({
                    reference: reference,
                    floating: floating,
                    strategy: strategy
                }) : reset.rects;
                ({ x: x , y: y  } = $eccd427a125a3cdc$var$computeCoordsFromPlacement(rects, statefulPlacement, rtl));
            }
            i = -1;
            continue;
        }
    }
    return {
        x: x,
        y: y,
        placement: statefulPlacement,
        strategy: strategy,
        middlewareData: middlewareData
    };
};
/**
 * Resolves with an object of overflow side offsets that determine how much the
 * element is overflowing a given clipping boundary on each side.
 * - positive = overflowing the boundary by that number of pixels
 * - negative = how many pixels left before it will overflow
 * - 0 = lies flush with the boundary
 * @see https://floating-ui.com/docs/detectOverflow
 */ async function $eccd427a125a3cdc$export$37b6bde19b108ecc(state, options) {
    var _await$platform$isEle;
    if (options === void 0) options = {};
    const { x: x , y: y , platform: platform , rects: rects , elements: elements , strategy: strategy  } = state;
    const { boundary: boundary = "clippingAncestors" , rootBoundary: rootBoundary = "viewport" , elementContext: elementContext = "floating" , altBoundary: altBoundary = false , padding: padding = 0  } = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(options, state);
    const paddingObject = (0, $9c57d7f6c77aef10$export$598c291c29bc2e71)(padding);
    const altContext = elementContext === "floating" ? "reference" : "floating";
    const element = elements[altBoundary ? altContext : elementContext];
    const clippingClientRect = (0, $9c57d7f6c77aef10$export$ee05aea0aeecbad4)(await platform.getClippingRect({
        element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating)),
        boundary: boundary,
        rootBoundary: rootBoundary,
        strategy: strategy
    }));
    const rect = elementContext === "floating" ? {
        ...rects.floating,
        x: x,
        y: y
    } : rects.reference;
    const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
    const offsetScale = await (platform.isElement == null ? void 0 : platform.isElement(offsetParent)) ? await (platform.getScale == null ? void 0 : platform.getScale(offsetParent)) || {
        x: 1,
        y: 1
    } : {
        x: 1,
        y: 1
    };
    const elementClientRect = (0, $9c57d7f6c77aef10$export$ee05aea0aeecbad4)(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
        rect: rect,
        offsetParent: offsetParent,
        strategy: strategy
    }) : rect);
    return {
        top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
        bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
        left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
        right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
    };
}
/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */ const $eccd427a125a3cdc$export$f2120bbfa5450bd2 = (options)=>({
        name: "arrow",
        options: options,
        async fn (state) {
            const { x: x , y: y , placement: placement , rects: rects , platform: platform , elements: elements , middlewareData: middlewareData  } = state;
            // Since `element` is required, we don't Partial<> the type.
            const { element: element , padding: padding = 0  } = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(options, state) || {};
            if (element == null) return {};
            const paddingObject = (0, $9c57d7f6c77aef10$export$598c291c29bc2e71)(padding);
            const coords = {
                x: x,
                y: y
            };
            const axis = (0, $9c57d7f6c77aef10$export$2b57e0052a6d6d4c)(placement);
            const length = (0, $9c57d7f6c77aef10$export$320bd9d53520c68a)(axis);
            const arrowDimensions = await platform.getDimensions(element);
            const isYAxis = axis === "y";
            const minProp = isYAxis ? "top" : "left";
            const maxProp = isYAxis ? "bottom" : "right";
            const clientProp = isYAxis ? "clientHeight" : "clientWidth";
            const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
            const startDiff = coords[axis] - rects.reference[axis];
            const arrowOffsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(element));
            let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;
            // DOM platform can return `window` as the `offsetParent`.
            if (!clientSize || !await (platform.isElement == null ? void 0 : platform.isElement(arrowOffsetParent))) clientSize = elements.floating[clientProp] || rects.floating[length];
            const centerToReference = endDiff / 2 - startDiff / 2;
            // If the padding is large enough that it causes the arrow to no longer be
            // centered, modify the padding so that it is centered.
            const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
            const minPadding = (0, $9c57d7f6c77aef10$export$96ec731ed4dcb222)(paddingObject[minProp], largestPossiblePadding);
            const maxPadding = (0, $9c57d7f6c77aef10$export$96ec731ed4dcb222)(paddingObject[maxProp], largestPossiblePadding);
            // Make sure the arrow doesn't overflow the floating element if the center
            // point is outside the floating element's bounds.
            const min$1 = minPadding;
            const max = clientSize - arrowDimensions[length] - maxPadding;
            const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
            const offset = (0, $9c57d7f6c77aef10$export$7d15b64cf5a3a4c4)(min$1, center, max);
            // If the reference is small enough that the arrow's padding causes it to
            // to point to nothing for an aligned placement, adjust the offset of the
            // floating element itself. To ensure `shift()` continues to take action,
            // a single reset is performed when this is true.
            const shouldAddOffset = !middlewareData.arrow && (0, $9c57d7f6c77aef10$export$f0989780f32bfcda)(placement) != null && center != offset && rects.reference[length] / 2 - (center < min$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
            const alignmentOffset = shouldAddOffset ? center < min$1 ? center - min$1 : center - max : 0;
            return {
                [axis]: coords[axis] + alignmentOffset,
                data: {
                    [axis]: offset,
                    centerOffset: center - offset - alignmentOffset,
                    ...shouldAddOffset && {
                        alignmentOffset: alignmentOffset
                    }
                },
                reset: shouldAddOffset
            };
        }
    });
function $eccd427a125a3cdc$var$getPlacementList(alignment, autoAlignment, allowedPlacements) {
    const allowedPlacementsSortedByAlignment = alignment ? [
        ...allowedPlacements.filter((placement)=>(0, $9c57d7f6c77aef10$export$f0989780f32bfcda)(placement) === alignment),
        ...allowedPlacements.filter((placement)=>(0, $9c57d7f6c77aef10$export$f0989780f32bfcda)(placement) !== alignment)
    ] : allowedPlacements.filter((placement)=>(0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(placement) === placement);
    return allowedPlacementsSortedByAlignment.filter((placement)=>{
        if (alignment) return (0, $9c57d7f6c77aef10$export$f0989780f32bfcda)(placement) === alignment || (autoAlignment ? (0, $9c57d7f6c77aef10$export$2b182c584985588b)(placement) !== placement : false);
        return true;
    });
}
/**
 * Optimizes the visibility of the floating element by choosing the placement
 * that has the most space available automatically, without needing to specify a
 * preferred placement. Alternative to `flip`.
 * @see https://floating-ui.com/docs/autoPlacement
 */ const $eccd427a125a3cdc$export$91fb6ecbd551914 = function(options) {
    if (options === void 0) options = {};
    return {
        name: "autoPlacement",
        options: options,
        async fn (state) {
            var _middlewareData$autoP, _middlewareData$autoP2, _placementsThatFitOnE;
            const { rects: rects , middlewareData: middlewareData , placement: placement , platform: platform , elements: elements  } = state;
            const { crossAxis: crossAxis = false , alignment: alignment , allowedPlacements: allowedPlacements = (0, $9c57d7f6c77aef10$export$803cd8101b6c182b) , autoAlignment: autoAlignment = true , ...detectOverflowOptions } = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(options, state);
            const placements$1 = alignment !== undefined || allowedPlacements === (0, $9c57d7f6c77aef10$export$803cd8101b6c182b) ? $eccd427a125a3cdc$var$getPlacementList(alignment || null, autoAlignment, allowedPlacements) : allowedPlacements;
            const overflow = await $eccd427a125a3cdc$export$37b6bde19b108ecc(state, detectOverflowOptions);
            const currentIndex = ((_middlewareData$autoP = middlewareData.autoPlacement) == null ? void 0 : _middlewareData$autoP.index) || 0;
            const currentPlacement = placements$1[currentIndex];
            if (currentPlacement == null) return {};
            const alignmentSides = (0, $9c57d7f6c77aef10$export$be42861551f17911)(currentPlacement, rects, await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating)));
            // Make `computeCoords` start from the right place.
            if (placement !== currentPlacement) return {
                reset: {
                    placement: placements$1[0]
                }
            };
            const currentOverflows = [
                overflow[(0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(currentPlacement)],
                overflow[alignmentSides[0]],
                overflow[alignmentSides[1]]
            ];
            const allOverflows = [
                ...((_middlewareData$autoP2 = middlewareData.autoPlacement) == null ? void 0 : _middlewareData$autoP2.overflows) || [],
                {
                    placement: currentPlacement,
                    overflows: currentOverflows
                }
            ];
            const nextPlacement = placements$1[currentIndex + 1];
            // There are more placements to check.
            if (nextPlacement) return {
                data: {
                    index: currentIndex + 1,
                    overflows: allOverflows
                },
                reset: {
                    placement: nextPlacement
                }
            };
            const placementsSortedByMostSpace = allOverflows.map((d)=>{
                const alignment = (0, $9c57d7f6c77aef10$export$f0989780f32bfcda)(d.placement);
                return [
                    d.placement,
                    alignment && crossAxis ? // Check along the mainAxis and main crossAxis side.
                    d.overflows.slice(0, 2).reduce((acc, v)=>acc + v, 0) : // Check only the mainAxis.
                    d.overflows[0],
                    d.overflows
                ];
            }).sort((a, b)=>a[1] - b[1]);
            const placementsThatFitOnEachSide = placementsSortedByMostSpace.filter((d)=>d[2].slice(0, // Aligned placements should not check their opposite crossAxis
                // side.
                (0, $9c57d7f6c77aef10$export$f0989780f32bfcda)(d[0]) ? 2 : 3).every((v)=>v <= 0));
            const resetPlacement = ((_placementsThatFitOnE = placementsThatFitOnEachSide[0]) == null ? void 0 : _placementsThatFitOnE[0]) || placementsSortedByMostSpace[0][0];
            if (resetPlacement !== placement) return {
                data: {
                    index: currentIndex + 1,
                    overflows: allOverflows
                },
                reset: {
                    placement: resetPlacement
                }
            };
            return {};
        }
    };
};
/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */ const $eccd427a125a3cdc$export$8a83211c878a3f1f = function(options) {
    if (options === void 0) options = {};
    return {
        name: "flip",
        options: options,
        async fn (state) {
            var _middlewareData$arrow, _middlewareData$flip;
            const { placement: placement , middlewareData: middlewareData , rects: rects , initialPlacement: initialPlacement , platform: platform , elements: elements  } = state;
            const { mainAxis: checkMainAxis = true , crossAxis: checkCrossAxis = true , fallbackPlacements: specifiedFallbackPlacements , fallbackStrategy: fallbackStrategy = "bestFit" , fallbackAxisSideDirection: fallbackAxisSideDirection = "none" , flipAlignment: flipAlignment = true , ...detectOverflowOptions } = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(options, state);
            // If a reset by the arrow was caused due to an alignment offset being
            // added, we should skip any logic now since `flip()` has already done its
            // work.
            // https://github.com/floating-ui/floating-ui/issues/2549#issuecomment-1719601643
            if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) return {};
            const side = (0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(placement);
            const isBasePlacement = (0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(initialPlacement) === initialPlacement;
            const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
            const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [
                (0, $9c57d7f6c77aef10$export$9c5e28bad23365fa)(initialPlacement)
            ] : (0, $9c57d7f6c77aef10$export$496432a3699e50b1)(initialPlacement));
            if (!specifiedFallbackPlacements && fallbackAxisSideDirection !== "none") fallbackPlacements.push(...(0, $9c57d7f6c77aef10$export$a9b6fb18fd92c3ec)(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
            const placements = [
                initialPlacement,
                ...fallbackPlacements
            ];
            const overflow = await $eccd427a125a3cdc$export$37b6bde19b108ecc(state, detectOverflowOptions);
            const overflows = [];
            let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
            if (checkMainAxis) overflows.push(overflow[side]);
            if (checkCrossAxis) {
                const sides = (0, $9c57d7f6c77aef10$export$be42861551f17911)(placement, rects, rtl);
                overflows.push(overflow[sides[0]], overflow[sides[1]]);
            }
            overflowsData = [
                ...overflowsData,
                {
                    placement: placement,
                    overflows: overflows
                }
            ];
            // One or more sides is overflowing.
            if (!overflows.every((side)=>side <= 0)) {
                var _middlewareData$flip2, _overflowsData$filter;
                const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
                const nextPlacement = placements[nextIndex];
                if (nextPlacement) // Try next placement and re-run the lifecycle.
                return {
                    data: {
                        index: nextIndex,
                        overflows: overflowsData
                    },
                    reset: {
                        placement: nextPlacement
                    }
                };
                // First, find the candidates that fit on the mainAxis side of overflow,
                // then find the placement that fits the best on the main crossAxis side.
                let resetPlacement = (_overflowsData$filter = overflowsData.filter((d)=>d.overflows[0] <= 0).sort((a, b)=>a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;
                // Otherwise fallback.
                if (!resetPlacement) switch(fallbackStrategy){
                    case "bestFit":
                        {
                            var _overflowsData$map$so;
                            const placement = (_overflowsData$map$so = overflowsData.map((d)=>[
                                    d.placement,
                                    d.overflows.filter((overflow)=>overflow > 0).reduce((acc, overflow)=>acc + overflow, 0)
                                ]).sort((a, b)=>a[1] - b[1])[0]) == null ? void 0 : _overflowsData$map$so[0];
                            if (placement) resetPlacement = placement;
                            break;
                        }
                    case "initialPlacement":
                        resetPlacement = initialPlacement;
                        break;
                }
                if (placement !== resetPlacement) return {
                    reset: {
                        placement: resetPlacement
                    }
                };
            }
            return {};
        }
    };
};
function $eccd427a125a3cdc$var$getSideOffsets(overflow, rect) {
    return {
        top: overflow.top - rect.height,
        right: overflow.right - rect.width,
        bottom: overflow.bottom - rect.height,
        left: overflow.left - rect.width
    };
}
function $eccd427a125a3cdc$var$isAnySideFullyClipped(overflow) {
    return (0, $9c57d7f6c77aef10$export$832b6fa47fa053d2).some((side)=>overflow[side] >= 0);
}
/**
 * Provides data to hide the floating element in applicable situations, such as
 * when it is not in the same clipping context as the reference element.
 * @see https://floating-ui.com/docs/hide
 */ const $eccd427a125a3cdc$export$fe8985bb6374093c = function(options) {
    if (options === void 0) options = {};
    return {
        name: "hide",
        options: options,
        async fn (state) {
            const { rects: rects  } = state;
            const { strategy: strategy = "referenceHidden" , ...detectOverflowOptions } = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(options, state);
            switch(strategy){
                case "referenceHidden":
                    {
                        const overflow = await $eccd427a125a3cdc$export$37b6bde19b108ecc(state, {
                            ...detectOverflowOptions,
                            elementContext: "reference"
                        });
                        const offsets = $eccd427a125a3cdc$var$getSideOffsets(overflow, rects.reference);
                        return {
                            data: {
                                referenceHiddenOffsets: offsets,
                                referenceHidden: $eccd427a125a3cdc$var$isAnySideFullyClipped(offsets)
                            }
                        };
                    }
                case "escaped":
                    {
                        const overflow = await $eccd427a125a3cdc$export$37b6bde19b108ecc(state, {
                            ...detectOverflowOptions,
                            altBoundary: true
                        });
                        const offsets = $eccd427a125a3cdc$var$getSideOffsets(overflow, rects.floating);
                        return {
                            data: {
                                escapedOffsets: offsets,
                                escaped: $eccd427a125a3cdc$var$isAnySideFullyClipped(offsets)
                            }
                        };
                    }
                default:
                    return {};
            }
        }
    };
};
function $eccd427a125a3cdc$var$getBoundingRect(rects) {
    const minX = (0, $9c57d7f6c77aef10$export$96ec731ed4dcb222)(...rects.map((rect)=>rect.left));
    const minY = (0, $9c57d7f6c77aef10$export$96ec731ed4dcb222)(...rects.map((rect)=>rect.top));
    const maxX = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(...rects.map((rect)=>rect.right));
    const maxY = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(...rects.map((rect)=>rect.bottom));
    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
}
function $eccd427a125a3cdc$var$getRectsByLine(rects) {
    const sortedRects = rects.slice().sort((a, b)=>a.y - b.y);
    const groups = [];
    let prevRect = null;
    for(let i = 0; i < sortedRects.length; i++){
        const rect = sortedRects[i];
        if (!prevRect || rect.y - prevRect.y > prevRect.height / 2) groups.push([
            rect
        ]);
        else groups[groups.length - 1].push(rect);
        prevRect = rect;
    }
    return groups.map((rect)=>(0, $9c57d7f6c77aef10$export$ee05aea0aeecbad4)($eccd427a125a3cdc$var$getBoundingRect(rect)));
}
/**
 * Provides improved positioning for inline reference elements that can span
 * over multiple lines, such as hyperlinks or range selections.
 * @see https://floating-ui.com/docs/inline
 */ const $eccd427a125a3cdc$export$18c8ad048e32c7d5 = function(options) {
    if (options === void 0) options = {};
    return {
        name: "inline",
        options: options,
        async fn (state) {
            const { placement: placement , elements: elements , rects: rects , platform: platform , strategy: strategy  } = state;
            // A MouseEvent's client{X,Y} coords can be up to 2 pixels off a
            // ClientRect's bounds, despite the event listener being triggered. A
            // padding of 2 seems to handle this issue.
            const { padding: padding = 2 , x: x , y: y  } = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(options, state);
            const nativeClientRects = Array.from(await (platform.getClientRects == null ? void 0 : platform.getClientRects(elements.reference)) || []);
            const clientRects = $eccd427a125a3cdc$var$getRectsByLine(nativeClientRects);
            const fallback = (0, $9c57d7f6c77aef10$export$ee05aea0aeecbad4)($eccd427a125a3cdc$var$getBoundingRect(nativeClientRects));
            const paddingObject = (0, $9c57d7f6c77aef10$export$598c291c29bc2e71)(padding);
            function getBoundingClientRect() {
                // There are two rects and they are disjoined.
                if (clientRects.length === 2 && clientRects[0].left > clientRects[1].right && x != null && y != null) // Find the first rect in which the point is fully inside.
                return clientRects.find((rect)=>x > rect.left - paddingObject.left && x < rect.right + paddingObject.right && y > rect.top - paddingObject.top && y < rect.bottom + paddingObject.bottom) || fallback;
                // There are 2 or more connected rects.
                if (clientRects.length >= 2) {
                    if ((0, $9c57d7f6c77aef10$export$f28e8f882010718a)(placement) === "y") {
                        const firstRect = clientRects[0];
                        const lastRect = clientRects[clientRects.length - 1];
                        const isTop = (0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(placement) === "top";
                        const top = firstRect.top;
                        const bottom = lastRect.bottom;
                        const left = isTop ? firstRect.left : lastRect.left;
                        const right = isTop ? firstRect.right : lastRect.right;
                        const width = right - left;
                        const height = bottom - top;
                        return {
                            top: top,
                            bottom: bottom,
                            left: left,
                            right: right,
                            width: width,
                            height: height,
                            x: left,
                            y: top
                        };
                    }
                    const isLeftSide = (0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(placement) === "left";
                    const maxRight = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(...clientRects.map((rect)=>rect.right));
                    const minLeft = (0, $9c57d7f6c77aef10$export$96ec731ed4dcb222)(...clientRects.map((rect)=>rect.left));
                    const measureRects = clientRects.filter((rect)=>isLeftSide ? rect.left === minLeft : rect.right === maxRight);
                    const top = measureRects[0].top;
                    const bottom = measureRects[measureRects.length - 1].bottom;
                    const left = minLeft;
                    const right = maxRight;
                    const width = right - left;
                    const height = bottom - top;
                    return {
                        top: top,
                        bottom: bottom,
                        left: left,
                        right: right,
                        width: width,
                        height: height,
                        x: left,
                        y: top
                    };
                }
                return fallback;
            }
            const resetRects = await platform.getElementRects({
                reference: {
                    getBoundingClientRect: getBoundingClientRect
                },
                floating: elements.floating,
                strategy: strategy
            });
            if (rects.reference.x !== resetRects.reference.x || rects.reference.y !== resetRects.reference.y || rects.reference.width !== resetRects.reference.width || rects.reference.height !== resetRects.reference.height) return {
                reset: {
                    rects: resetRects
                }
            };
            return {};
        }
    };
};
// For type backwards-compatibility, the `OffsetOptions` type was also
// Derivable.
async function $eccd427a125a3cdc$var$convertValueToCoords(state, options) {
    const { placement: placement , platform: platform , elements: elements  } = state;
    const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
    const side = (0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(placement);
    const alignment = (0, $9c57d7f6c77aef10$export$f0989780f32bfcda)(placement);
    const isVertical = (0, $9c57d7f6c77aef10$export$f28e8f882010718a)(placement) === "y";
    const mainAxisMulti = [
        "left",
        "top"
    ].includes(side) ? -1 : 1;
    const crossAxisMulti = rtl && isVertical ? -1 : 1;
    const rawValue = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(options, state);
    // eslint-disable-next-line prefer-const
    let { mainAxis: mainAxis , crossAxis: crossAxis , alignmentAxis: alignmentAxis  } = typeof rawValue === "number" ? {
        mainAxis: rawValue,
        crossAxis: 0,
        alignmentAxis: null
    } : {
        mainAxis: 0,
        crossAxis: 0,
        alignmentAxis: null,
        ...rawValue
    };
    if (alignment && typeof alignmentAxis === "number") crossAxis = alignment === "end" ? alignmentAxis * -1 : alignmentAxis;
    return isVertical ? {
        x: crossAxis * crossAxisMulti,
        y: mainAxis * mainAxisMulti
    } : {
        x: mainAxis * mainAxisMulti,
        y: crossAxis * crossAxisMulti
    };
}
/**
 * Modifies the placement by translating the floating element along the
 * specified axes.
 * A number (shorthand for `mainAxis` or distance), or an axes configuration
 * object may be passed.
 * @see https://floating-ui.com/docs/offset
 */ const $eccd427a125a3cdc$export$cc800923e997bb8 = function(options) {
    if (options === void 0) options = 0;
    return {
        name: "offset",
        options: options,
        async fn (state) {
            const { x: x , y: y  } = state;
            const diffCoords = await $eccd427a125a3cdc$var$convertValueToCoords(state, options);
            return {
                x: x + diffCoords.x,
                y: y + diffCoords.y,
                data: diffCoords
            };
        }
    };
};
/**
 * Optimizes the visibility of the floating element by shifting it in order to
 * keep it in view when it will overflow the clipping boundary.
 * @see https://floating-ui.com/docs/shift
 */ const $eccd427a125a3cdc$export$fba63a578e423eb = function(options) {
    if (options === void 0) options = {};
    return {
        name: "shift",
        options: options,
        async fn (state) {
            const { x: x , y: y , placement: placement  } = state;
            const { mainAxis: checkMainAxis = true , crossAxis: checkCrossAxis = false , limiter: limiter = {
                fn: (_ref)=>{
                    let { x: x , y: y  } = _ref;
                    return {
                        x: x,
                        y: y
                    };
                }
            } , ...detectOverflowOptions } = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(options, state);
            const coords = {
                x: x,
                y: y
            };
            const overflow = await $eccd427a125a3cdc$export$37b6bde19b108ecc(state, detectOverflowOptions);
            const crossAxis = (0, $9c57d7f6c77aef10$export$f28e8f882010718a)((0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(placement));
            const mainAxis = (0, $9c57d7f6c77aef10$export$8a000a963141ac32)(crossAxis);
            let mainAxisCoord = coords[mainAxis];
            let crossAxisCoord = coords[crossAxis];
            if (checkMainAxis) {
                const minSide = mainAxis === "y" ? "top" : "left";
                const maxSide = mainAxis === "y" ? "bottom" : "right";
                const min = mainAxisCoord + overflow[minSide];
                const max = mainAxisCoord - overflow[maxSide];
                mainAxisCoord = (0, $9c57d7f6c77aef10$export$7d15b64cf5a3a4c4)(min, mainAxisCoord, max);
            }
            if (checkCrossAxis) {
                const minSide = crossAxis === "y" ? "top" : "left";
                const maxSide = crossAxis === "y" ? "bottom" : "right";
                const min = crossAxisCoord + overflow[minSide];
                const max = crossAxisCoord - overflow[maxSide];
                crossAxisCoord = (0, $9c57d7f6c77aef10$export$7d15b64cf5a3a4c4)(min, crossAxisCoord, max);
            }
            const limitedCoords = limiter.fn({
                ...state,
                [mainAxis]: mainAxisCoord,
                [crossAxis]: crossAxisCoord
            });
            return {
                ...limitedCoords,
                data: {
                    x: limitedCoords.x - x,
                    y: limitedCoords.y - y
                }
            };
        }
    };
};
/**
 * Built-in `limiter` that will stop `shift()` at a certain point.
 */ const $eccd427a125a3cdc$export$7bf07e38f3dc4b69 = function(options) {
    if (options === void 0) options = {};
    return {
        options: options,
        fn (state) {
            const { x: x , y: y , placement: placement , rects: rects , middlewareData: middlewareData  } = state;
            const { offset: offset = 0 , mainAxis: checkMainAxis = true , crossAxis: checkCrossAxis = true  } = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(options, state);
            const coords = {
                x: x,
                y: y
            };
            const crossAxis = (0, $9c57d7f6c77aef10$export$f28e8f882010718a)(placement);
            const mainAxis = (0, $9c57d7f6c77aef10$export$8a000a963141ac32)(crossAxis);
            let mainAxisCoord = coords[mainAxis];
            let crossAxisCoord = coords[crossAxis];
            const rawOffset = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(offset, state);
            const computedOffset = typeof rawOffset === "number" ? {
                mainAxis: rawOffset,
                crossAxis: 0
            } : {
                mainAxis: 0,
                crossAxis: 0,
                ...rawOffset
            };
            if (checkMainAxis) {
                const len = mainAxis === "y" ? "height" : "width";
                const limitMin = rects.reference[mainAxis] - rects.floating[len] + computedOffset.mainAxis;
                const limitMax = rects.reference[mainAxis] + rects.reference[len] - computedOffset.mainAxis;
                if (mainAxisCoord < limitMin) mainAxisCoord = limitMin;
                else if (mainAxisCoord > limitMax) mainAxisCoord = limitMax;
            }
            if (checkCrossAxis) {
                var _middlewareData$offse, _middlewareData$offse2;
                const len = mainAxis === "y" ? "width" : "height";
                const isOriginSide = [
                    "top",
                    "left"
                ].includes((0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(placement));
                const limitMin = rects.reference[crossAxis] - rects.floating[len] + (isOriginSide ? ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse[crossAxis]) || 0 : 0) + (isOriginSide ? 0 : computedOffset.crossAxis);
                const limitMax = rects.reference[crossAxis] + rects.reference[len] + (isOriginSide ? 0 : ((_middlewareData$offse2 = middlewareData.offset) == null ? void 0 : _middlewareData$offse2[crossAxis]) || 0) - (isOriginSide ? computedOffset.crossAxis : 0);
                if (crossAxisCoord < limitMin) crossAxisCoord = limitMin;
                else if (crossAxisCoord > limitMax) crossAxisCoord = limitMax;
            }
            return {
                [mainAxis]: mainAxisCoord,
                [crossAxis]: crossAxisCoord
            };
        }
    };
};
/**
 * Provides data that allows you to change the size of the floating element —
 * for instance, prevent it from overflowing the clipping boundary or match the
 * width of the reference element.
 * @see https://floating-ui.com/docs/size
 */ const $eccd427a125a3cdc$export$346677f925de839c = function(options) {
    if (options === void 0) options = {};
    return {
        name: "size",
        options: options,
        async fn (state) {
            const { placement: placement , rects: rects , platform: platform , elements: elements  } = state;
            const { apply: apply = ()=>{} , ...detectOverflowOptions } = (0, $9c57d7f6c77aef10$export$fef61f332f2c0afc)(options, state);
            const overflow = await $eccd427a125a3cdc$export$37b6bde19b108ecc(state, detectOverflowOptions);
            const side = (0, $9c57d7f6c77aef10$export$3c915306cb7fc97a)(placement);
            const alignment = (0, $9c57d7f6c77aef10$export$f0989780f32bfcda)(placement);
            const isYAxis = (0, $9c57d7f6c77aef10$export$f28e8f882010718a)(placement) === "y";
            const { width: width , height: height  } = rects.floating;
            let heightSide;
            let widthSide;
            if (side === "top" || side === "bottom") {
                heightSide = side;
                widthSide = alignment === (await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating)) ? "start" : "end") ? "left" : "right";
            } else {
                widthSide = side;
                heightSide = alignment === "end" ? "top" : "bottom";
            }
            const overflowAvailableHeight = height - overflow[heightSide];
            const overflowAvailableWidth = width - overflow[widthSide];
            const noShift = !state.middlewareData.shift;
            let availableHeight = overflowAvailableHeight;
            let availableWidth = overflowAvailableWidth;
            if (isYAxis) {
                const maximumClippingWidth = width - overflow.left - overflow.right;
                availableWidth = alignment || noShift ? (0, $9c57d7f6c77aef10$export$96ec731ed4dcb222)(overflowAvailableWidth, maximumClippingWidth) : maximumClippingWidth;
            } else {
                const maximumClippingHeight = height - overflow.top - overflow.bottom;
                availableHeight = alignment || noShift ? (0, $9c57d7f6c77aef10$export$96ec731ed4dcb222)(overflowAvailableHeight, maximumClippingHeight) : maximumClippingHeight;
            }
            if (noShift && !alignment) {
                const xMin = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(overflow.left, 0);
                const xMax = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(overflow.right, 0);
                const yMin = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(overflow.top, 0);
                const yMax = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(overflow.bottom, 0);
                if (isYAxis) availableWidth = width - 2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(overflow.left, overflow.right));
                else availableHeight = height - 2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(overflow.top, overflow.bottom));
            }
            await apply({
                ...state,
                availableWidth: availableWidth,
                availableHeight: availableHeight
            });
            const nextDimensions = await platform.getDimensions(elements.floating);
            if (width !== nextDimensions.width || height !== nextDimensions.height) return {
                reset: {
                    rects: true
                }
            };
            return {};
        }
    };
};




function $219fc67320786679$export$651544f548703224(node) {
    if ($219fc67320786679$export$8ee0fc9ee280b4ee(node)) return (node.nodeName || "").toLowerCase();
    // Mocked nodes in testing environments may not be instances of Node. By
    // returning `#document` an infinite loop won't occur.
    // https://github.com/floating-ui/floating-ui/issues/2317
    return "#document";
}
function $219fc67320786679$export$38b2d434cce3ea22(node) {
    var _node$ownerDocument;
    return (node == null ? void 0 : (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function $219fc67320786679$export$e495491855dc5418(node) {
    var _ref;
    return (_ref = ($219fc67320786679$export$8ee0fc9ee280b4ee(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function $219fc67320786679$export$8ee0fc9ee280b4ee(value) {
    return value instanceof Node || value instanceof $219fc67320786679$export$38b2d434cce3ea22(value).Node;
}
function $219fc67320786679$export$45a5e7f76e0caa8d(value) {
    return value instanceof Element || value instanceof $219fc67320786679$export$38b2d434cce3ea22(value).Element;
}
function $219fc67320786679$export$1b3bfaa9684536aa(value) {
    return value instanceof HTMLElement || value instanceof $219fc67320786679$export$38b2d434cce3ea22(value).HTMLElement;
}
function $219fc67320786679$export$af51f0f06c0f328a(value) {
    // Browsers without `ShadowRoot` support.
    if (typeof ShadowRoot === "undefined") return false;
    return value instanceof ShadowRoot || value instanceof $219fc67320786679$export$38b2d434cce3ea22(value).ShadowRoot;
}
function $219fc67320786679$export$989e911fa9af580a(element) {
    const { overflow: overflow , overflowX: overflowX , overflowY: overflowY , display: display  } = $219fc67320786679$export$3735103072e4a80(element);
    return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && ![
        "inline",
        "contents"
    ].includes(display);
}
function $219fc67320786679$export$71535ffaa902797f(element) {
    return [
        "table",
        "td",
        "th"
    ].includes($219fc67320786679$export$651544f548703224(element));
}
function $219fc67320786679$export$d6c4e8150c35fed1(element) {
    const webkit = $219fc67320786679$export$78551043582a6a98();
    const css = $219fc67320786679$export$3735103072e4a80(element);
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
    return css.transform !== "none" || css.perspective !== "none" || (css.containerType ? css.containerType !== "normal" : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== "none" : false) || !webkit && (css.filter ? css.filter !== "none" : false) || [
        "transform",
        "perspective",
        "filter"
    ].some((value)=>(css.willChange || "").includes(value)) || [
        "paint",
        "layout",
        "strict",
        "content"
    ].some((value)=>(css.contain || "").includes(value));
}
function $219fc67320786679$export$940d8225183e1404(element) {
    let currentNode = $219fc67320786679$export$4e12058fc4d51d56(element);
    while($219fc67320786679$export$1b3bfaa9684536aa(currentNode) && !$219fc67320786679$export$d1162fb0b6d4cd51(currentNode)){
        if ($219fc67320786679$export$d6c4e8150c35fed1(currentNode)) return currentNode;
        else currentNode = $219fc67320786679$export$4e12058fc4d51d56(currentNode);
    }
    return null;
}
function $219fc67320786679$export$78551043582a6a98() {
    if (typeof CSS === "undefined" || !CSS.supports) return false;
    return CSS.supports("-webkit-backdrop-filter", "none");
}
function $219fc67320786679$export$d1162fb0b6d4cd51(node) {
    return [
        "html",
        "body",
        "#document"
    ].includes($219fc67320786679$export$651544f548703224(node));
}
function $219fc67320786679$export$3735103072e4a80(element) {
    return $219fc67320786679$export$38b2d434cce3ea22(element).getComputedStyle(element);
}
function $219fc67320786679$export$dc8fc79fa2800137(element) {
    if ($219fc67320786679$export$45a5e7f76e0caa8d(element)) return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
    };
    return {
        scrollLeft: element.pageXOffset,
        scrollTop: element.pageYOffset
    };
}
function $219fc67320786679$export$4e12058fc4d51d56(node) {
    if ($219fc67320786679$export$651544f548703224(node) === "html") return node;
    const result = // Step into the shadow DOM of the parent of a slotted node.
    node.assignedSlot || // DOM Element detected.
    node.parentNode || // ShadowRoot detected.
    $219fc67320786679$export$af51f0f06c0f328a(node) && node.host || // Fallback.
    $219fc67320786679$export$e495491855dc5418(node);
    return $219fc67320786679$export$af51f0f06c0f328a(result) ? result.host : result;
}
function $219fc67320786679$export$7cd01a57c8ca906c(node) {
    const parentNode = $219fc67320786679$export$4e12058fc4d51d56(node);
    if ($219fc67320786679$export$d1162fb0b6d4cd51(parentNode)) return node.ownerDocument ? node.ownerDocument.body : node.body;
    if ($219fc67320786679$export$1b3bfaa9684536aa(parentNode) && $219fc67320786679$export$989e911fa9af580a(parentNode)) return parentNode;
    return $219fc67320786679$export$7cd01a57c8ca906c(parentNode);
}
function $219fc67320786679$export$3b57c1601291186b(node, list, traverseIframes) {
    var _node$ownerDocument2;
    if (list === void 0) list = [];
    if (traverseIframes === void 0) traverseIframes = true;
    const scrollableAncestor = $219fc67320786679$export$7cd01a57c8ca906c(node);
    const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
    const win = $219fc67320786679$export$38b2d434cce3ea22(scrollableAncestor);
    if (isBody) return list.concat(win, win.visualViewport || [], $219fc67320786679$export$989e911fa9af580a(scrollableAncestor) ? scrollableAncestor : [], win.frameElement && traverseIframes ? $219fc67320786679$export$3b57c1601291186b(win.frameElement) : []);
    return list.concat(scrollableAncestor, $219fc67320786679$export$3b57c1601291186b(scrollableAncestor, [], traverseIframes));
}



function $8b53f47ea7cd8bbd$var$getCssDimensions(element) {
    const css = (0, $219fc67320786679$export$3735103072e4a80)(element);
    // In testing environments, the `width` and `height` properties are empty
    // strings for SVG elements, returning NaN. Fallback to `0` in this case.
    let width = parseFloat(css.width) || 0;
    let height = parseFloat(css.height) || 0;
    const hasOffset = (0, $219fc67320786679$export$1b3bfaa9684536aa)(element);
    const offsetWidth = hasOffset ? element.offsetWidth : width;
    const offsetHeight = hasOffset ? element.offsetHeight : height;
    const shouldFallback = (0, $9c57d7f6c77aef10$export$2077e0241d6afd3c)(width) !== offsetWidth || (0, $9c57d7f6c77aef10$export$2077e0241d6afd3c)(height) !== offsetHeight;
    if (shouldFallback) {
        width = offsetWidth;
        height = offsetHeight;
    }
    return {
        width: width,
        height: height,
        $: shouldFallback
    };
}
function $8b53f47ea7cd8bbd$var$unwrapElement(element) {
    return !(0, $219fc67320786679$export$45a5e7f76e0caa8d)(element) ? element.contextElement : element;
}
function $8b53f47ea7cd8bbd$var$getScale(element) {
    const domElement = $8b53f47ea7cd8bbd$var$unwrapElement(element);
    if (!(0, $219fc67320786679$export$1b3bfaa9684536aa)(domElement)) return (0, $9c57d7f6c77aef10$export$a397704b5e280835)(1);
    const rect = domElement.getBoundingClientRect();
    const { width: width , height: height , $: $  } = $8b53f47ea7cd8bbd$var$getCssDimensions(domElement);
    let x = ($ ? (0, $9c57d7f6c77aef10$export$2077e0241d6afd3c)(rect.width) : rect.width) / width;
    let y = ($ ? (0, $9c57d7f6c77aef10$export$2077e0241d6afd3c)(rect.height) : rect.height) / height;
    // 0, NaN, or Infinity should always fallback to 1.
    if (!x || !Number.isFinite(x)) x = 1;
    if (!y || !Number.isFinite(y)) y = 1;
    return {
        x: x,
        y: y
    };
}
const $8b53f47ea7cd8bbd$var$noOffsets = /*#__PURE__*/ (0, $9c57d7f6c77aef10$export$a397704b5e280835)(0);
function $8b53f47ea7cd8bbd$var$getVisualOffsets(element) {
    const win = (0, $219fc67320786679$export$38b2d434cce3ea22)(element);
    if (!(0, $219fc67320786679$export$78551043582a6a98)() || !win.visualViewport) return $8b53f47ea7cd8bbd$var$noOffsets;
    return {
        x: win.visualViewport.offsetLeft,
        y: win.visualViewport.offsetTop
    };
}
function $8b53f47ea7cd8bbd$var$shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
    if (isFixed === void 0) isFixed = false;
    if (!floatingOffsetParent || isFixed && floatingOffsetParent !== (0, $219fc67320786679$export$38b2d434cce3ea22)(element)) return false;
    return isFixed;
}
function $8b53f47ea7cd8bbd$var$getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
    if (includeScale === void 0) includeScale = false;
    if (isFixedStrategy === void 0) isFixedStrategy = false;
    const clientRect = element.getBoundingClientRect();
    const domElement = $8b53f47ea7cd8bbd$var$unwrapElement(element);
    let scale = (0, $9c57d7f6c77aef10$export$a397704b5e280835)(1);
    if (includeScale) {
        if (offsetParent) {
            if ((0, $219fc67320786679$export$45a5e7f76e0caa8d)(offsetParent)) scale = $8b53f47ea7cd8bbd$var$getScale(offsetParent);
        } else scale = $8b53f47ea7cd8bbd$var$getScale(element);
    }
    const visualOffsets = $8b53f47ea7cd8bbd$var$shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? $8b53f47ea7cd8bbd$var$getVisualOffsets(domElement) : (0, $9c57d7f6c77aef10$export$a397704b5e280835)(0);
    let x = (clientRect.left + visualOffsets.x) / scale.x;
    let y = (clientRect.top + visualOffsets.y) / scale.y;
    let width = clientRect.width / scale.x;
    let height = clientRect.height / scale.y;
    if (domElement) {
        const win = (0, $219fc67320786679$export$38b2d434cce3ea22)(domElement);
        const offsetWin = offsetParent && (0, $219fc67320786679$export$45a5e7f76e0caa8d)(offsetParent) ? (0, $219fc67320786679$export$38b2d434cce3ea22)(offsetParent) : offsetParent;
        let currentIFrame = win.frameElement;
        while(currentIFrame && offsetParent && offsetWin !== win){
            const iframeScale = $8b53f47ea7cd8bbd$var$getScale(currentIFrame);
            const iframeRect = currentIFrame.getBoundingClientRect();
            const css = (0, $219fc67320786679$export$3735103072e4a80)(currentIFrame);
            const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
            const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
            x *= iframeScale.x;
            y *= iframeScale.y;
            width *= iframeScale.x;
            height *= iframeScale.y;
            x += left;
            y += top;
            currentIFrame = (0, $219fc67320786679$export$38b2d434cce3ea22)(currentIFrame).frameElement;
        }
    }
    return (0, $9c57d7f6c77aef10$export$ee05aea0aeecbad4)({
        width: width,
        height: height,
        x: x,
        y: y
    });
}
function $8b53f47ea7cd8bbd$var$convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
    let { rect: rect , offsetParent: offsetParent , strategy: strategy  } = _ref;
    const isOffsetParentAnElement = (0, $219fc67320786679$export$1b3bfaa9684536aa)(offsetParent);
    const documentElement = (0, $219fc67320786679$export$e495491855dc5418)(offsetParent);
    if (offsetParent === documentElement) return rect;
    let scroll = {
        scrollLeft: 0,
        scrollTop: 0
    };
    let scale = (0, $9c57d7f6c77aef10$export$a397704b5e280835)(1);
    const offsets = (0, $9c57d7f6c77aef10$export$a397704b5e280835)(0);
    if (isOffsetParentAnElement || !isOffsetParentAnElement && strategy !== "fixed") {
        if ((0, $219fc67320786679$export$651544f548703224)(offsetParent) !== "body" || (0, $219fc67320786679$export$989e911fa9af580a)(documentElement)) scroll = (0, $219fc67320786679$export$dc8fc79fa2800137)(offsetParent);
        if ((0, $219fc67320786679$export$1b3bfaa9684536aa)(offsetParent)) {
            const offsetRect = $8b53f47ea7cd8bbd$var$getBoundingClientRect(offsetParent);
            scale = $8b53f47ea7cd8bbd$var$getScale(offsetParent);
            offsets.x = offsetRect.x + offsetParent.clientLeft;
            offsets.y = offsetRect.y + offsetParent.clientTop;
        }
    }
    return {
        width: rect.width * scale.x,
        height: rect.height * scale.y,
        x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x,
        y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y
    };
}
function $8b53f47ea7cd8bbd$var$getClientRects(element) {
    return Array.from(element.getClientRects());
}
function $8b53f47ea7cd8bbd$var$getWindowScrollBarX(element) {
    // If <html> has a CSS width greater than the viewport, then this will be
    // incorrect for RTL.
    return $8b53f47ea7cd8bbd$var$getBoundingClientRect((0, $219fc67320786679$export$e495491855dc5418)(element)).left + (0, $219fc67320786679$export$dc8fc79fa2800137)(element).scrollLeft;
}
// Gets the entire size of the scrollable document area, even extending outside
// of the `<html>` and `<body>` rect bounds if horizontally scrollable.
function $8b53f47ea7cd8bbd$var$getDocumentRect(element) {
    const html = (0, $219fc67320786679$export$e495491855dc5418)(element);
    const scroll = (0, $219fc67320786679$export$dc8fc79fa2800137)(element);
    const body = element.ownerDocument.body;
    const width = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
    const height = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
    let x = -scroll.scrollLeft + $8b53f47ea7cd8bbd$var$getWindowScrollBarX(element);
    const y = -scroll.scrollTop;
    if ((0, $219fc67320786679$export$3735103072e4a80)(body).direction === "rtl") x += (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(html.clientWidth, body.clientWidth) - width;
    return {
        width: width,
        height: height,
        x: x,
        y: y
    };
}
function $8b53f47ea7cd8bbd$var$getViewportRect(element, strategy) {
    const win = (0, $219fc67320786679$export$38b2d434cce3ea22)(element);
    const html = (0, $219fc67320786679$export$e495491855dc5418)(element);
    const visualViewport = win.visualViewport;
    let width = html.clientWidth;
    let height = html.clientHeight;
    let x = 0;
    let y = 0;
    if (visualViewport) {
        width = visualViewport.width;
        height = visualViewport.height;
        const visualViewportBased = (0, $219fc67320786679$export$78551043582a6a98)();
        if (!visualViewportBased || visualViewportBased && strategy === "fixed") {
            x = visualViewport.offsetLeft;
            y = visualViewport.offsetTop;
        }
    }
    return {
        width: width,
        height: height,
        x: x,
        y: y
    };
}
// Returns the inner client rect, subtracting scrollbars if present.
function $8b53f47ea7cd8bbd$var$getInnerBoundingClientRect(element, strategy) {
    const clientRect = $8b53f47ea7cd8bbd$var$getBoundingClientRect(element, true, strategy === "fixed");
    const top = clientRect.top + element.clientTop;
    const left = clientRect.left + element.clientLeft;
    const scale = (0, $219fc67320786679$export$1b3bfaa9684536aa)(element) ? $8b53f47ea7cd8bbd$var$getScale(element) : (0, $9c57d7f6c77aef10$export$a397704b5e280835)(1);
    const width = element.clientWidth * scale.x;
    const height = element.clientHeight * scale.y;
    const x = left * scale.x;
    const y = top * scale.y;
    return {
        width: width,
        height: height,
        x: x,
        y: y
    };
}
function $8b53f47ea7cd8bbd$var$getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
    let rect;
    if (clippingAncestor === "viewport") rect = $8b53f47ea7cd8bbd$var$getViewportRect(element, strategy);
    else if (clippingAncestor === "document") rect = $8b53f47ea7cd8bbd$var$getDocumentRect((0, $219fc67320786679$export$e495491855dc5418)(element));
    else if ((0, $219fc67320786679$export$45a5e7f76e0caa8d)(clippingAncestor)) rect = $8b53f47ea7cd8bbd$var$getInnerBoundingClientRect(clippingAncestor, strategy);
    else {
        const visualOffsets = $8b53f47ea7cd8bbd$var$getVisualOffsets(element);
        rect = {
            ...clippingAncestor,
            x: clippingAncestor.x - visualOffsets.x,
            y: clippingAncestor.y - visualOffsets.y
        };
    }
    return (0, $9c57d7f6c77aef10$export$ee05aea0aeecbad4)(rect);
}
function $8b53f47ea7cd8bbd$var$hasFixedPositionAncestor(element, stopNode) {
    const parentNode = (0, $219fc67320786679$export$4e12058fc4d51d56)(element);
    if (parentNode === stopNode || !(0, $219fc67320786679$export$45a5e7f76e0caa8d)(parentNode) || (0, $219fc67320786679$export$d1162fb0b6d4cd51)(parentNode)) return false;
    return (0, $219fc67320786679$export$3735103072e4a80)(parentNode).position === "fixed" || $8b53f47ea7cd8bbd$var$hasFixedPositionAncestor(parentNode, stopNode);
}
// A "clipping ancestor" is an `overflow` element with the characteristic of
// clipping (or hiding) child elements. This returns all clipping ancestors
// of the given element up the tree.
function $8b53f47ea7cd8bbd$var$getClippingElementAncestors(element, cache) {
    const cachedResult = cache.get(element);
    if (cachedResult) return cachedResult;
    let result = (0, $219fc67320786679$export$3b57c1601291186b)(element, [], false).filter((el)=>(0, $219fc67320786679$export$45a5e7f76e0caa8d)(el) && (0, $219fc67320786679$export$651544f548703224)(el) !== "body");
    let currentContainingBlockComputedStyle = null;
    const elementIsFixed = (0, $219fc67320786679$export$3735103072e4a80)(element).position === "fixed";
    let currentNode = elementIsFixed ? (0, $219fc67320786679$export$4e12058fc4d51d56)(element) : element;
    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
    while((0, $219fc67320786679$export$45a5e7f76e0caa8d)(currentNode) && !(0, $219fc67320786679$export$d1162fb0b6d4cd51)(currentNode)){
        const computedStyle = (0, $219fc67320786679$export$3735103072e4a80)(currentNode);
        const currentNodeIsContaining = (0, $219fc67320786679$export$d6c4e8150c35fed1)(currentNode);
        if (!currentNodeIsContaining && computedStyle.position === "fixed") currentContainingBlockComputedStyle = null;
        const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === "static" && !!currentContainingBlockComputedStyle && [
            "absolute",
            "fixed"
        ].includes(currentContainingBlockComputedStyle.position) || (0, $219fc67320786679$export$989e911fa9af580a)(currentNode) && !currentNodeIsContaining && $8b53f47ea7cd8bbd$var$hasFixedPositionAncestor(element, currentNode);
        if (shouldDropCurrentNode) // Drop non-containing blocks.
        result = result.filter((ancestor)=>ancestor !== currentNode);
        else // Record last containing block for next iteration.
        currentContainingBlockComputedStyle = computedStyle;
        currentNode = (0, $219fc67320786679$export$4e12058fc4d51d56)(currentNode);
    }
    cache.set(element, result);
    return result;
}
// Gets the maximum area that the element is visible in due to any number of
// clipping ancestors.
function $8b53f47ea7cd8bbd$var$getClippingRect(_ref) {
    let { element: element , boundary: boundary , rootBoundary: rootBoundary , strategy: strategy  } = _ref;
    const elementClippingAncestors = boundary === "clippingAncestors" ? $8b53f47ea7cd8bbd$var$getClippingElementAncestors(element, this._c) : [].concat(boundary);
    const clippingAncestors = [
        ...elementClippingAncestors,
        rootBoundary
    ];
    const firstClippingAncestor = clippingAncestors[0];
    const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor)=>{
        const rect = $8b53f47ea7cd8bbd$var$getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
        accRect.top = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(rect.top, accRect.top);
        accRect.right = (0, $9c57d7f6c77aef10$export$96ec731ed4dcb222)(rect.right, accRect.right);
        accRect.bottom = (0, $9c57d7f6c77aef10$export$96ec731ed4dcb222)(rect.bottom, accRect.bottom);
        accRect.left = (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(rect.left, accRect.left);
        return accRect;
    }, $8b53f47ea7cd8bbd$var$getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
    return {
        width: clippingRect.right - clippingRect.left,
        height: clippingRect.bottom - clippingRect.top,
        x: clippingRect.left,
        y: clippingRect.top
    };
}
function $8b53f47ea7cd8bbd$var$getDimensions(element) {
    return $8b53f47ea7cd8bbd$var$getCssDimensions(element);
}
function $8b53f47ea7cd8bbd$var$getRectRelativeToOffsetParent(element, offsetParent, strategy) {
    const isOffsetParentAnElement = (0, $219fc67320786679$export$1b3bfaa9684536aa)(offsetParent);
    const documentElement = (0, $219fc67320786679$export$e495491855dc5418)(offsetParent);
    const isFixed = strategy === "fixed";
    const rect = $8b53f47ea7cd8bbd$var$getBoundingClientRect(element, true, isFixed, offsetParent);
    let scroll = {
        scrollLeft: 0,
        scrollTop: 0
    };
    const offsets = (0, $9c57d7f6c77aef10$export$a397704b5e280835)(0);
    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
        if ((0, $219fc67320786679$export$651544f548703224)(offsetParent) !== "body" || (0, $219fc67320786679$export$989e911fa9af580a)(documentElement)) scroll = (0, $219fc67320786679$export$dc8fc79fa2800137)(offsetParent);
        if (isOffsetParentAnElement) {
            const offsetRect = $8b53f47ea7cd8bbd$var$getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
            offsets.x = offsetRect.x + offsetParent.clientLeft;
            offsets.y = offsetRect.y + offsetParent.clientTop;
        } else if (documentElement) offsets.x = $8b53f47ea7cd8bbd$var$getWindowScrollBarX(documentElement);
    }
    return {
        x: rect.left + scroll.scrollLeft - offsets.x,
        y: rect.top + scroll.scrollTop - offsets.y,
        width: rect.width,
        height: rect.height
    };
}
function $8b53f47ea7cd8bbd$var$getTrueOffsetParent(element, polyfill) {
    if (!(0, $219fc67320786679$export$1b3bfaa9684536aa)(element) || (0, $219fc67320786679$export$3735103072e4a80)(element).position === "fixed") return null;
    if (polyfill) return polyfill(element);
    return element.offsetParent;
}
// Gets the closest ancestor positioned element. Handles some edge cases,
// such as table ancestors and cross browser bugs.
function $8b53f47ea7cd8bbd$var$getOffsetParent(element, polyfill) {
    const window = (0, $219fc67320786679$export$38b2d434cce3ea22)(element);
    if (!(0, $219fc67320786679$export$1b3bfaa9684536aa)(element)) return window;
    let offsetParent = $8b53f47ea7cd8bbd$var$getTrueOffsetParent(element, polyfill);
    while(offsetParent && (0, $219fc67320786679$export$71535ffaa902797f)(offsetParent) && (0, $219fc67320786679$export$3735103072e4a80)(offsetParent).position === "static")offsetParent = $8b53f47ea7cd8bbd$var$getTrueOffsetParent(offsetParent, polyfill);
    if (offsetParent && ((0, $219fc67320786679$export$651544f548703224)(offsetParent) === "html" || (0, $219fc67320786679$export$651544f548703224)(offsetParent) === "body" && (0, $219fc67320786679$export$3735103072e4a80)(offsetParent).position === "static" && !(0, $219fc67320786679$export$d6c4e8150c35fed1)(offsetParent))) return window;
    return offsetParent || (0, $219fc67320786679$export$940d8225183e1404)(element) || window;
}
const $8b53f47ea7cd8bbd$var$getElementRects = async function(_ref) {
    let { reference: reference , floating: floating , strategy: strategy  } = _ref;
    const getOffsetParentFn = this.getOffsetParent || $8b53f47ea7cd8bbd$var$getOffsetParent;
    const getDimensionsFn = this.getDimensions;
    return {
        reference: $8b53f47ea7cd8bbd$var$getRectRelativeToOffsetParent(reference, await getOffsetParentFn(floating), strategy),
        floating: {
            x: 0,
            y: 0,
            ...await getDimensionsFn(floating)
        }
    };
};
function $8b53f47ea7cd8bbd$var$isRTL(element) {
    return (0, $219fc67320786679$export$3735103072e4a80)(element).direction === "rtl";
}
const $8b53f47ea7cd8bbd$export$722a64dea1b767dc = {
    convertOffsetParentRelativeRectToViewportRelativeRect: $8b53f47ea7cd8bbd$var$convertOffsetParentRelativeRectToViewportRelativeRect,
    getDocumentElement: $219fc67320786679$export$e495491855dc5418,
    getClippingRect: $8b53f47ea7cd8bbd$var$getClippingRect,
    getOffsetParent: $8b53f47ea7cd8bbd$var$getOffsetParent,
    getElementRects: $8b53f47ea7cd8bbd$var$getElementRects,
    getClientRects: $8b53f47ea7cd8bbd$var$getClientRects,
    getDimensions: $8b53f47ea7cd8bbd$var$getDimensions,
    getScale: $8b53f47ea7cd8bbd$var$getScale,
    isElement: $219fc67320786679$export$45a5e7f76e0caa8d,
    isRTL: $8b53f47ea7cd8bbd$var$isRTL
};
// https://samthor.au/2021/observing-dom/
function $8b53f47ea7cd8bbd$var$observeMove(element, onMove) {
    let io = null;
    let timeoutId;
    const root = (0, $219fc67320786679$export$e495491855dc5418)(element);
    function cleanup() {
        clearTimeout(timeoutId);
        io && io.disconnect();
        io = null;
    }
    function refresh(skip, threshold) {
        if (skip === void 0) skip = false;
        if (threshold === void 0) threshold = 1;
        cleanup();
        const { left: left , top: top , width: width , height: height  } = element.getBoundingClientRect();
        if (!skip) onMove();
        if (!width || !height) return;
        const insetTop = (0, $9c57d7f6c77aef10$export$a3fe094919f356fd)(top);
        const insetRight = (0, $9c57d7f6c77aef10$export$a3fe094919f356fd)(root.clientWidth - (left + width));
        const insetBottom = (0, $9c57d7f6c77aef10$export$a3fe094919f356fd)(root.clientHeight - (top + height));
        const insetLeft = (0, $9c57d7f6c77aef10$export$a3fe094919f356fd)(left);
        const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
        const options = {
            rootMargin: rootMargin,
            threshold: (0, $9c57d7f6c77aef10$export$8960430cfd85939f)(0, (0, $9c57d7f6c77aef10$export$96ec731ed4dcb222)(1, threshold)) || 1
        };
        let isFirstUpdate = true;
        function handleObserve(entries) {
            const ratio = entries[0].intersectionRatio;
            if (ratio !== threshold) {
                if (!isFirstUpdate) return refresh();
                if (!ratio) timeoutId = setTimeout(()=>{
                    refresh(false, 1e-7);
                }, 100);
                else refresh(false, ratio);
            }
            isFirstUpdate = false;
        }
        // Older browsers don't support a `document` as the root and will throw an
        // error.
        try {
            io = new IntersectionObserver(handleObserve, {
                ...options,
                // Handle <iframe>s
                root: root.ownerDocument
            });
        } catch (e) {
            io = new IntersectionObserver(handleObserve, options);
        }
        io.observe(element);
    }
    refresh(true);
    return cleanup;
}
/**
 * Automatically updates the position of the floating element when necessary.
 * Should only be called when the floating element is mounted on the DOM or
 * visible on the screen.
 * @returns cleanup function that should be invoked when the floating element is
 * removed from the DOM or hidden from the screen.
 * @see https://floating-ui.com/docs/autoUpdate
 */ function $8b53f47ea7cd8bbd$export$deee3a793edee05f(reference, floating, update, options) {
    if (options === void 0) options = {};
    const { ancestorScroll: ancestorScroll = true , ancestorResize: ancestorResize = true , elementResize: elementResize = typeof ResizeObserver === "function" , layoutShift: layoutShift = typeof IntersectionObserver === "function" , animationFrame: animationFrame = false  } = options;
    const referenceEl = $8b53f47ea7cd8bbd$var$unwrapElement(reference);
    const ancestors = ancestorScroll || ancestorResize ? [
        ...referenceEl ? (0, $219fc67320786679$export$3b57c1601291186b)(referenceEl) : [],
        ...(0, $219fc67320786679$export$3b57c1601291186b)(floating)
    ] : [];
    ancestors.forEach((ancestor)=>{
        ancestorScroll && ancestor.addEventListener("scroll", update, {
            passive: true
        });
        ancestorResize && ancestor.addEventListener("resize", update);
    });
    const cleanupIo = referenceEl && layoutShift ? $8b53f47ea7cd8bbd$var$observeMove(referenceEl, update) : null;
    let reobserveFrame = -1;
    let resizeObserver = null;
    if (elementResize) {
        resizeObserver = new ResizeObserver((_ref)=>{
            let [firstEntry] = _ref;
            if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
                // Prevent update loops when using the `size` middleware.
                // https://github.com/floating-ui/floating-ui/issues/1740
                resizeObserver.unobserve(floating);
                cancelAnimationFrame(reobserveFrame);
                reobserveFrame = requestAnimationFrame(()=>{
                    resizeObserver && resizeObserver.observe(floating);
                });
            }
            update();
        });
        if (referenceEl && !animationFrame) resizeObserver.observe(referenceEl);
        resizeObserver.observe(floating);
    }
    let frameId;
    let prevRefRect = animationFrame ? $8b53f47ea7cd8bbd$var$getBoundingClientRect(reference) : null;
    if (animationFrame) frameLoop();
    function frameLoop() {
        const nextRefRect = $8b53f47ea7cd8bbd$var$getBoundingClientRect(reference);
        if (prevRefRect && (nextRefRect.x !== prevRefRect.x || nextRefRect.y !== prevRefRect.y || nextRefRect.width !== prevRefRect.width || nextRefRect.height !== prevRefRect.height)) update();
        prevRefRect = nextRefRect;
        frameId = requestAnimationFrame(frameLoop);
    }
    update();
    return ()=>{
        ancestors.forEach((ancestor)=>{
            ancestorScroll && ancestor.removeEventListener("scroll", update);
            ancestorResize && ancestor.removeEventListener("resize", update);
        });
        cleanupIo && cleanupIo();
        resizeObserver && resizeObserver.disconnect();
        resizeObserver = null;
        if (animationFrame) cancelAnimationFrame(frameId);
    };
}
/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a reference element when it is given a certain CSS positioning
 * strategy.
 */ const $8b53f47ea7cd8bbd$export$48a53dcb22e581d0 = (reference, floating, options)=>{
    // This caches the expensive `getClippingElementAncestors` function so that
    // multiple lifecycle resets re-use the same result. It only lives for a
    // single call. If other functions become expensive, we can add them as well.
    const cache = new Map();
    const mergedOptions = {
        platform: $8b53f47ea7cd8bbd$export$722a64dea1b767dc,
        ...options
    };
    const platformWithCache = {
        ...mergedOptions.platform,
        _c: cache
    };
    return (0, $eccd427a125a3cdc$export$48a53dcb22e581d0)(reference, floating, {
        ...mergedOptions,
        platform: platformWithCache
    });
};




var $LI8jA = parcelRequire("LI8jA");

var $LI8jA = parcelRequire("LI8jA");

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * This wraps the core `arrow` middleware to allow React refs as the element.
 * @see https://floating-ui.com/docs/arrow
 */ const $525b6e013f482cbc$export$f2120bbfa5450bd2 = (options)=>{
    function isRef(value) {
        return ({}).hasOwnProperty.call(value, "current");
    }
    return {
        name: "arrow",
        options: options,
        fn (state) {
            const { element: element , padding: padding  } = typeof options === "function" ? options(state) : options;
            if (element && isRef(element)) {
                if (element.current != null) return (0, $eccd427a125a3cdc$export$f2120bbfa5450bd2)({
                    element: element.current,
                    padding: padding
                }).fn(state);
                return {};
            } else if (element) return (0, $eccd427a125a3cdc$export$f2120bbfa5450bd2)({
                element: element,
                padding: padding
            }).fn(state);
            return {};
        }
    };
};
var $525b6e013f482cbc$var$index = typeof document !== "undefined" ? (0, $LI8jA.useLayoutEffect) : (0, $LI8jA.useEffect);
// Fork of `fast-deep-equal` that only does the comparisons we need and compares
// functions
function $525b6e013f482cbc$var$deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a === "function" && a.toString() === b.toString()) return true;
    let length, i, keys;
    if (a && b && typeof a == "object") {
        if (Array.isArray(a)) {
            length = a.length;
            if (length != b.length) return false;
            for(i = length; i-- !== 0;){
                if (!$525b6e013f482cbc$var$deepEqual(a[i], b[i])) return false;
            }
            return true;
        }
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for(i = length; i-- !== 0;){
            if (!({}).hasOwnProperty.call(b, keys[i])) return false;
        }
        for(i = length; i-- !== 0;){
            const key = keys[i];
            if (key === "_owner" && a.$$typeof) continue;
            if (!$525b6e013f482cbc$var$deepEqual(a[key], b[key])) return false;
        }
        return true;
    }
    return a !== a && b !== b;
}
function $525b6e013f482cbc$var$getDPR(element) {
    if (typeof window === "undefined") return 1;
    const win = element.ownerDocument.defaultView || window;
    return win.devicePixelRatio || 1;
}
function $525b6e013f482cbc$var$roundByDPR(element, value) {
    const dpr = $525b6e013f482cbc$var$getDPR(element);
    return Math.round(value * dpr) / dpr;
}
function $525b6e013f482cbc$var$useLatestRef(value) {
    const ref = $LI8jA.useRef(value);
    $525b6e013f482cbc$var$index(()=>{
        ref.current = value;
    });
    return ref;
}
/**
 * Provides data to position a floating element.
 * @see https://floating-ui.com/docs/useFloating
 */ function $525b6e013f482cbc$export$4e02a5c1d08bac65(options) {
    if (options === void 0) options = {};
    const { placement: placement = "bottom" , strategy: strategy = "absolute" , middleware: middleware = [] , platform: platform , elements: { reference: externalReference , floating: externalFloating  } = {} , transform: transform = true , whileElementsMounted: whileElementsMounted , open: open  } = options;
    const [data, setData] = $LI8jA.useState({
        x: 0,
        y: 0,
        strategy: strategy,
        placement: placement,
        middlewareData: {},
        isPositioned: false
    });
    const [latestMiddleware, setLatestMiddleware] = $LI8jA.useState(middleware);
    if (!$525b6e013f482cbc$var$deepEqual(latestMiddleware, middleware)) setLatestMiddleware(middleware);
    const [_reference, _setReference] = $LI8jA.useState(null);
    const [_floating, _setFloating] = $LI8jA.useState(null);
    const setReference = $LI8jA.useCallback((node)=>{
        if (node != referenceRef.current) {
            referenceRef.current = node;
            _setReference(node);
        }
    }, [
        _setReference
    ]);
    const setFloating = $LI8jA.useCallback((node)=>{
        if (node !== floatingRef.current) {
            floatingRef.current = node;
            _setFloating(node);
        }
    }, [
        _setFloating
    ]);
    const referenceEl = externalReference || _reference;
    const floatingEl = externalFloating || _floating;
    const referenceRef = $LI8jA.useRef(null);
    const floatingRef = $LI8jA.useRef(null);
    const dataRef = $LI8jA.useRef(data);
    const whileElementsMountedRef = $525b6e013f482cbc$var$useLatestRef(whileElementsMounted);
    const platformRef = $525b6e013f482cbc$var$useLatestRef(platform);
    const update = $LI8jA.useCallback(()=>{
        if (!referenceRef.current || !floatingRef.current) return;
        const config = {
            placement: placement,
            strategy: strategy,
            middleware: latestMiddleware
        };
        if (platformRef.current) config.platform = platformRef.current;
        (0, $8b53f47ea7cd8bbd$export$48a53dcb22e581d0)(referenceRef.current, floatingRef.current, config).then((data)=>{
            const fullData = {
                ...data,
                isPositioned: true
            };
            if (isMountedRef.current && !$525b6e013f482cbc$var$deepEqual(dataRef.current, fullData)) {
                dataRef.current = fullData;
                $117771ce739ab0ef$exports.flushSync(()=>{
                    setData(fullData);
                });
            }
        });
    }, [
        latestMiddleware,
        placement,
        strategy,
        platformRef
    ]);
    $525b6e013f482cbc$var$index(()=>{
        if (open === false && dataRef.current.isPositioned) {
            dataRef.current.isPositioned = false;
            setData((data)=>({
                    ...data,
                    isPositioned: false
                }));
        }
    }, [
        open
    ]);
    const isMountedRef = $LI8jA.useRef(false);
    $525b6e013f482cbc$var$index(()=>{
        isMountedRef.current = true;
        return ()=>{
            isMountedRef.current = false;
        };
    }, []);
    $525b6e013f482cbc$var$index(()=>{
        if (referenceEl) referenceRef.current = referenceEl;
        if (floatingEl) floatingRef.current = floatingEl;
        if (referenceEl && floatingEl) {
            if (whileElementsMountedRef.current) return whileElementsMountedRef.current(referenceEl, floatingEl, update);
            else update();
        }
    }, [
        referenceEl,
        floatingEl,
        update,
        whileElementsMountedRef
    ]);
    const refs = $LI8jA.useMemo(()=>({
            reference: referenceRef,
            floating: floatingRef,
            setReference: setReference,
            setFloating: setFloating
        }), [
        setReference,
        setFloating
    ]);
    const elements = $LI8jA.useMemo(()=>({
            reference: referenceEl,
            floating: floatingEl
        }), [
        referenceEl,
        floatingEl
    ]);
    const floatingStyles = $LI8jA.useMemo(()=>{
        const initialStyles = {
            position: strategy,
            left: 0,
            top: 0
        };
        if (!elements.floating) return initialStyles;
        const x = $525b6e013f482cbc$var$roundByDPR(elements.floating, data.x);
        const y = $525b6e013f482cbc$var$roundByDPR(elements.floating, data.y);
        if (transform) return {
            ...initialStyles,
            transform: "translate(" + x + "px, " + y + "px)",
            ...$525b6e013f482cbc$var$getDPR(elements.floating) >= 1.5 && {
                willChange: "transform"
            }
        };
        return {
            position: strategy,
            left: x,
            top: y
        };
    }, [
        strategy,
        transform,
        elements.floating,
        data.x,
        data.y
    ]);
    return $LI8jA.useMemo(()=>({
            ...data,
            update: update,
            refs: refs,
            elements: elements,
            floatingStyles: floatingStyles
        }), [
        data,
        update,
        refs,
        elements,
        floatingStyles
    ]);
}




var $LI8jA = parcelRequire("LI8jA");

/* -------------------------------------------------------------------------------------------------
 * Arrow
 * -----------------------------------------------------------------------------------------------*/ const $f03cd5ad75706e80$var$$7e8f5cd07187803e$var$NAME = "Arrow";
const $f03cd5ad75706e80$export$21b07c8f274aebd5 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { children: children , width: width = 10 , height: height = 5 , ...arrowProps } = props;
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).svg, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, arrowProps, {
        ref: forwardedRef,
        width: width,
        height: height,
        viewBox: "0 0 30 10",
        preserveAspectRatio: "none"
    }), props.asChild ? children : /*#__PURE__*/ (0, $LI8jA.createElement)("polygon", {
        points: "0,0 30,0 15,10"
    }));
});
/*#__PURE__*/ Object.assign($f03cd5ad75706e80$export$21b07c8f274aebd5, {
    displayName: $f03cd5ad75706e80$var$$7e8f5cd07187803e$var$NAME
});
/* -----------------------------------------------------------------------------------------------*/ const $f03cd5ad75706e80$export$be92b6f5f03c0fe9 = $f03cd5ad75706e80$export$21b07c8f274aebd5;








const $576aaf0a88f44294$export$36f0086da09c4b9f = [
    "top",
    "right",
    "bottom",
    "left"
];
const $576aaf0a88f44294$export$3671ffab7b302fc9 = [
    "start",
    "center",
    "end"
];
/* -------------------------------------------------------------------------------------------------
 * Popper
 * -----------------------------------------------------------------------------------------------*/ const $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$POPPER_NAME = "Popper";
const [$576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$createPopperContext, $576aaf0a88f44294$export$722aac194ae923] = (0, $ec3315292aa721d0$export$50c7b4e9d9f19c1)($576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$POPPER_NAME);
const [$576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$PopperProvider, $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$usePopperContext] = $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$createPopperContext($576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$POPPER_NAME);
const $576aaf0a88f44294$export$badac9ada3a0bdf9 = (props)=>{
    const { __scopePopper: __scopePopper , children: children  } = props;
    const [anchor, setAnchor] = (0, $LI8jA.useState)(null);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$PopperProvider, {
        scope: __scopePopper,
        anchor: anchor,
        onAnchorChange: setAnchor
    }, children);
};
/*#__PURE__*/ Object.assign($576aaf0a88f44294$export$badac9ada3a0bdf9, {
    displayName: $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$POPPER_NAME
});
/* -------------------------------------------------------------------------------------------------
 * PopperAnchor
 * -----------------------------------------------------------------------------------------------*/ const $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$ANCHOR_NAME = "PopperAnchor";
const $576aaf0a88f44294$export$ecd4e1ccab6ed6d = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopePopper: __scopePopper , virtualRef: virtualRef , ...anchorProps } = props;
    const context = $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$usePopperContext($576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$ANCHOR_NAME, __scopePopper);
    const ref = (0, $LI8jA.useRef)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, ref);
    (0, $LI8jA.useEffect)(()=>{
        // Consumer can anchor the popper to something that isn't
        // a DOM node e.g. pointer position, so we override the
        // `anchorRef` with their virtual ref in this case.
        context.onAnchorChange((virtualRef === null || virtualRef === void 0 ? void 0 : virtualRef.current) || ref.current);
    });
    return virtualRef ? null : /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, anchorProps, {
        ref: composedRefs
    }));
});
/*#__PURE__*/ Object.assign($576aaf0a88f44294$export$ecd4e1ccab6ed6d, {
    displayName: $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$ANCHOR_NAME
});
/* -------------------------------------------------------------------------------------------------
 * PopperContent
 * -----------------------------------------------------------------------------------------------*/ const $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$CONTENT_NAME = "PopperContent";
const [$576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$PopperContentProvider, $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$useContentContext] = $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$createPopperContext($576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$CONTENT_NAME);
const $576aaf0a88f44294$export$bc4ae5855d3c4fc = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    var _arrowSize$width, _arrowSize$height, _middlewareData$arrow, _middlewareData$arrow2, _middlewareData$arrow3, _middlewareData$trans, _middlewareData$trans2, _middlewareData$hide;
    const { __scopePopper: __scopePopper , side: side = "bottom" , sideOffset: sideOffset = 0 , align: align = "center" , alignOffset: alignOffset = 0 , arrowPadding: arrowPadding = 0 , avoidCollisions: avoidCollisions = true , collisionBoundary: collisionBoundary = [] , collisionPadding: collisionPaddingProp = 0 , sticky: sticky = "partial" , hideWhenDetached: hideWhenDetached = false , updatePositionStrategy: updatePositionStrategy = "optimized" , onPlaced: onPlaced , ...contentProps } = props;
    const context = $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$usePopperContext($576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$CONTENT_NAME, __scopePopper);
    const [content, setContent] = (0, $LI8jA.useState)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, (node)=>setContent(node));
    const [arrow, setArrow] = (0, $LI8jA.useState)(null);
    const arrowSize = (0, $e5427f5e3f2cde3c$export$1ab7ae714698c4b8)(arrow);
    const arrowWidth = (_arrowSize$width = arrowSize === null || arrowSize === void 0 ? void 0 : arrowSize.width) !== null && _arrowSize$width !== void 0 ? _arrowSize$width : 0;
    const arrowHeight = (_arrowSize$height = arrowSize === null || arrowSize === void 0 ? void 0 : arrowSize.height) !== null && _arrowSize$height !== void 0 ? _arrowSize$height : 0;
    const desiredPlacement = side + (align !== "center" ? "-" + align : "");
    const collisionPadding = typeof collisionPaddingProp === "number" ? collisionPaddingProp : {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        ...collisionPaddingProp
    };
    const boundary = Array.isArray(collisionBoundary) ? collisionBoundary : [
        collisionBoundary
    ];
    const hasExplicitBoundaries = boundary.length > 0;
    const detectOverflowOptions = {
        padding: collisionPadding,
        boundary: boundary.filter($576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$isNotNull),
        // with `strategy: 'fixed'`, this is the only way to get it to respect boundaries
        altBoundary: hasExplicitBoundaries
    };
    const { refs: refs , floatingStyles: floatingStyles , placement: placement , isPositioned: isPositioned , middlewareData: middlewareData  } = (0, $525b6e013f482cbc$export$4e02a5c1d08bac65)({
        // default to `fixed` strategy so users don't have to pick and we also avoid focus scroll issues
        strategy: "fixed",
        placement: desiredPlacement,
        whileElementsMounted: (...args)=>{
            const cleanup = (0, $8b53f47ea7cd8bbd$export$deee3a793edee05f)(...args, {
                animationFrame: updatePositionStrategy === "always"
            });
            return cleanup;
        },
        elements: {
            reference: context.anchor
        },
        middleware: [
            (0, $eccd427a125a3cdc$export$cc800923e997bb8)({
                mainAxis: sideOffset + arrowHeight,
                alignmentAxis: alignOffset
            }),
            avoidCollisions && (0, $eccd427a125a3cdc$export$fba63a578e423eb)({
                mainAxis: true,
                crossAxis: false,
                limiter: sticky === "partial" ? (0, $eccd427a125a3cdc$export$7bf07e38f3dc4b69)() : undefined,
                ...detectOverflowOptions
            }),
            avoidCollisions && (0, $eccd427a125a3cdc$export$8a83211c878a3f1f)({
                ...detectOverflowOptions
            }),
            (0, $eccd427a125a3cdc$export$346677f925de839c)({
                ...detectOverflowOptions,
                apply: ({ elements: elements , rects: rects , availableWidth: availableWidth , availableHeight: availableHeight  })=>{
                    const { width: anchorWidth , height: anchorHeight  } = rects.reference;
                    const contentStyle = elements.floating.style;
                    contentStyle.setProperty("--radix-popper-available-width", `${availableWidth}px`);
                    contentStyle.setProperty("--radix-popper-available-height", `${availableHeight}px`);
                    contentStyle.setProperty("--radix-popper-anchor-width", `${anchorWidth}px`);
                    contentStyle.setProperty("--radix-popper-anchor-height", `${anchorHeight}px`);
                }
            }),
            arrow && (0, $525b6e013f482cbc$export$f2120bbfa5450bd2)({
                element: arrow,
                padding: arrowPadding
            }),
            $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$transformOrigin({
                arrowWidth: arrowWidth,
                arrowHeight: arrowHeight
            }),
            hideWhenDetached && (0, $eccd427a125a3cdc$export$fe8985bb6374093c)({
                strategy: "referenceHidden",
                ...detectOverflowOptions
            })
        ]
    });
    const [placedSide, placedAlign] = $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$getSideAndAlignFromPlacement(placement);
    const handlePlaced = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onPlaced);
    (0, $620f4b520baef9c2$export$e5c5a5f917a5871c)(()=>{
        if (isPositioned) handlePlaced === null || handlePlaced === void 0 || handlePlaced();
    }, [
        isPositioned,
        handlePlaced
    ]);
    const arrowX = (_middlewareData$arrow = middlewareData.arrow) === null || _middlewareData$arrow === void 0 ? void 0 : _middlewareData$arrow.x;
    const arrowY = (_middlewareData$arrow2 = middlewareData.arrow) === null || _middlewareData$arrow2 === void 0 ? void 0 : _middlewareData$arrow2.y;
    const cannotCenterArrow = ((_middlewareData$arrow3 = middlewareData.arrow) === null || _middlewareData$arrow3 === void 0 ? void 0 : _middlewareData$arrow3.centerOffset) !== 0;
    const [contentZIndex, setContentZIndex] = (0, $LI8jA.useState)();
    (0, $620f4b520baef9c2$export$e5c5a5f917a5871c)(()=>{
        if (content) setContentZIndex(window.getComputedStyle(content).zIndex);
    }, [
        content
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)("div", {
        ref: refs.setFloating,
        "data-radix-popper-content-wrapper": "",
        style: {
            ...floatingStyles,
            transform: isPositioned ? floatingStyles.transform : "translate(0, -200%)",
            // keep off the page when measuring
            minWidth: "max-content",
            zIndex: contentZIndex,
            ["--radix-popper-transform-origin"]: [
                (_middlewareData$trans = middlewareData.transformOrigin) === null || _middlewareData$trans === void 0 ? void 0 : _middlewareData$trans.x,
                (_middlewareData$trans2 = middlewareData.transformOrigin) === null || _middlewareData$trans2 === void 0 ? void 0 : _middlewareData$trans2.y
            ].join(" ")
        } // Floating UI interally calculates logical alignment based the `dir` attribute on
        ,
        dir: props.dir
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$PopperContentProvider, {
        scope: __scopePopper,
        placedSide: placedSide,
        onArrowChange: setArrow,
        arrowX: arrowX,
        arrowY: arrowY,
        shouldHideArrow: cannotCenterArrow
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        "data-side": placedSide,
        "data-align": placedAlign
    }, contentProps, {
        ref: composedRefs,
        style: {
            ...contentProps.style,
            // if the PopperContent hasn't been placed yet (not all measurements done)
            // we prevent animations so that users's animation don't kick in too early referring wrong sides
            animation: !isPositioned ? "none" : undefined,
            // hide the content if using the hide middleware and should be hidden
            opacity: (_middlewareData$hide = middlewareData.hide) !== null && _middlewareData$hide !== void 0 && _middlewareData$hide.referenceHidden ? 0 : undefined
        }
    }))));
});
/*#__PURE__*/ Object.assign($576aaf0a88f44294$export$bc4ae5855d3c4fc, {
    displayName: $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$CONTENT_NAME
});
/* -------------------------------------------------------------------------------------------------
 * PopperArrow
 * -----------------------------------------------------------------------------------------------*/ const $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$ARROW_NAME = "PopperArrow";
const $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$OPPOSITE_SIDE = {
    top: "bottom",
    right: "left",
    bottom: "top",
    left: "right"
};
const $576aaf0a88f44294$export$79d62cd4e10a3fd0 = /*#__PURE__*/ (0, $LI8jA.forwardRef)(function $cf1ac5d9fe0e8206$export$79d62cd4e10a3fd0(props, forwardedRef) {
    const { __scopePopper: __scopePopper , ...arrowProps } = props;
    const contentContext = $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$useContentContext($576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$ARROW_NAME, __scopePopper);
    const baseSide = $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$OPPOSITE_SIDE[contentContext.placedSide];
    return(/*#__PURE__*/ // doesn't report size as we'd expect on SVG elements.
    // it reports their bounding box which is effectively the largest path inside the SVG.
    (0, $LI8jA.createElement)("span", {
        ref: contentContext.onArrowChange,
        style: {
            position: "absolute",
            left: contentContext.arrowX,
            top: contentContext.arrowY,
            [baseSide]: 0,
            transformOrigin: {
                top: "",
                right: "0 0",
                bottom: "center 0",
                left: "100% 0"
            }[contentContext.placedSide],
            transform: {
                top: "translateY(100%)",
                right: "translateY(50%) rotate(90deg) translateX(-50%)",
                bottom: `rotate(180deg)`,
                left: "translateY(50%) rotate(-90deg) translateX(50%)"
            }[contentContext.placedSide],
            visibility: contentContext.shouldHideArrow ? "hidden" : undefined
        }
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $f03cd5ad75706e80$export$be92b6f5f03c0fe9), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, arrowProps, {
        ref: forwardedRef,
        style: {
            ...arrowProps.style,
            // ensures the element can be measured correctly (mostly for if SVG)
            display: "block"
        }
    }))));
});
/*#__PURE__*/ Object.assign($576aaf0a88f44294$export$79d62cd4e10a3fd0, {
    displayName: $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$ARROW_NAME
});
/* -----------------------------------------------------------------------------------------------*/ function $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$isNotNull(value) {
    return value !== null;
}
const $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$transformOrigin = (options)=>({
        name: "transformOrigin",
        options: options,
        fn (data) {
            var _middlewareData$arrow4, _middlewareData$arrow5, _middlewareData$arrow6, _middlewareData$arrow7, _middlewareData$arrow8;
            const { placement: placement , rects: rects , middlewareData: middlewareData  } = data;
            const cannotCenterArrow = ((_middlewareData$arrow4 = middlewareData.arrow) === null || _middlewareData$arrow4 === void 0 ? void 0 : _middlewareData$arrow4.centerOffset) !== 0;
            const isArrowHidden = cannotCenterArrow;
            const arrowWidth = isArrowHidden ? 0 : options.arrowWidth;
            const arrowHeight = isArrowHidden ? 0 : options.arrowHeight;
            const [placedSide, placedAlign] = $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$getSideAndAlignFromPlacement(placement);
            const noArrowAlign = {
                start: "0%",
                center: "50%",
                end: "100%"
            }[placedAlign];
            const arrowXCenter = ((_middlewareData$arrow5 = (_middlewareData$arrow6 = middlewareData.arrow) === null || _middlewareData$arrow6 === void 0 ? void 0 : _middlewareData$arrow6.x) !== null && _middlewareData$arrow5 !== void 0 ? _middlewareData$arrow5 : 0) + arrowWidth / 2;
            const arrowYCenter = ((_middlewareData$arrow7 = (_middlewareData$arrow8 = middlewareData.arrow) === null || _middlewareData$arrow8 === void 0 ? void 0 : _middlewareData$arrow8.y) !== null && _middlewareData$arrow7 !== void 0 ? _middlewareData$arrow7 : 0) + arrowHeight / 2;
            let x = "";
            let y = "";
            if (placedSide === "bottom") {
                x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
                y = `${-arrowHeight}px`;
            } else if (placedSide === "top") {
                x = isArrowHidden ? noArrowAlign : `${arrowXCenter}px`;
                y = `${rects.floating.height + arrowHeight}px`;
            } else if (placedSide === "right") {
                x = `${-arrowHeight}px`;
                y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
            } else if (placedSide === "left") {
                x = `${rects.floating.width + arrowHeight}px`;
                y = isArrowHidden ? noArrowAlign : `${arrowYCenter}px`;
            }
            return {
                data: {
                    x: x,
                    y: y
                }
            };
        }
    });
function $576aaf0a88f44294$var$$cf1ac5d9fe0e8206$var$getSideAndAlignFromPlacement(placement) {
    const [side, align = "center"] = placement.split("-");
    return [
        side,
        align
    ];
}
const $576aaf0a88f44294$export$be92b6f5f03c0fe9 = $576aaf0a88f44294$export$badac9ada3a0bdf9;
const $576aaf0a88f44294$export$b688253958b8dfe7 = $576aaf0a88f44294$export$ecd4e1ccab6ed6d;
const $576aaf0a88f44294$export$7c6e2c02157bb7d2 = $576aaf0a88f44294$export$bc4ae5855d3c4fc;
const $576aaf0a88f44294$export$21b07c8f274aebd5 = $576aaf0a88f44294$export$79d62cd4e10a3fd0;




var $LI8jA = parcelRequire("LI8jA");


/* -------------------------------------------------------------------------------------------------
 * Portal
 * -----------------------------------------------------------------------------------------------*/ const $726ec765805a08e3$var$$f1701beae083dbae$var$PORTAL_NAME = "Portal";
const $726ec765805a08e3$export$602eac185826482c = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    var _globalThis$document;
    const { container: container = globalThis === null || globalThis === void 0 ? void 0 : (_globalThis$document = globalThis.document) === null || _globalThis$document === void 0 ? void 0 : _globalThis$document.body , ...portalProps } = props;
    return container ? /*#__PURE__*/ (0, (/*@__PURE__*/$parcel$interopDefault($117771ce739ab0ef$exports))).createPortal(/*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, portalProps, {
        ref: forwardedRef
    })), container) : null;
});
/*#__PURE__*/ Object.assign($726ec765805a08e3$export$602eac185826482c, {
    displayName: $726ec765805a08e3$var$$f1701beae083dbae$var$PORTAL_NAME
});
/* -----------------------------------------------------------------------------------------------*/ const $726ec765805a08e3$export$be92b6f5f03c0fe9 = $726ec765805a08e3$export$602eac185826482c;



var $LI8jA = parcelRequire("LI8jA");



function $0ac33c7c3f86b9ab$var$$fe963b355347cc68$export$3e6543de14f8614f(initialState, machine) {
    return (0, $LI8jA.useReducer)((state, event)=>{
        const nextState = machine[state][event];
        return nextState !== null && nextState !== void 0 ? nextState : state;
    }, initialState);
}
const $0ac33c7c3f86b9ab$export$99c2b779aa4e8b8b = (props)=>{
    const { present: present , children: children  } = props;
    const presence = $0ac33c7c3f86b9ab$var$$921a889cee6df7e8$var$usePresence(present);
    const child = typeof children === "function" ? children({
        present: presence.isPresent
    }) : (0, $LI8jA.Children).only(children);
    const ref = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(presence.ref, child.ref);
    const forceMount = typeof children === "function";
    return forceMount || presence.isPresent ? /*#__PURE__*/ (0, $LI8jA.cloneElement)(child, {
        ref: ref
    }) : null;
};
$0ac33c7c3f86b9ab$export$99c2b779aa4e8b8b.displayName = "Presence";
/* -------------------------------------------------------------------------------------------------
 * usePresence
 * -----------------------------------------------------------------------------------------------*/ function $0ac33c7c3f86b9ab$var$$921a889cee6df7e8$var$usePresence(present) {
    const [node1, setNode] = (0, $LI8jA.useState)();
    const stylesRef = (0, $LI8jA.useRef)({});
    const prevPresentRef = (0, $LI8jA.useRef)(present);
    const prevAnimationNameRef = (0, $LI8jA.useRef)("none");
    const initialState = present ? "mounted" : "unmounted";
    const [state, send] = $0ac33c7c3f86b9ab$var$$fe963b355347cc68$export$3e6543de14f8614f(initialState, {
        mounted: {
            UNMOUNT: "unmounted",
            ANIMATION_OUT: "unmountSuspended"
        },
        unmountSuspended: {
            MOUNT: "mounted",
            ANIMATION_END: "unmounted"
        },
        unmounted: {
            MOUNT: "mounted"
        }
    });
    (0, $LI8jA.useEffect)(()=>{
        const currentAnimationName = $0ac33c7c3f86b9ab$var$$921a889cee6df7e8$var$getAnimationName(stylesRef.current);
        prevAnimationNameRef.current = state === "mounted" ? currentAnimationName : "none";
    }, [
        state
    ]);
    (0, $620f4b520baef9c2$export$e5c5a5f917a5871c)(()=>{
        const styles = stylesRef.current;
        const wasPresent = prevPresentRef.current;
        const hasPresentChanged = wasPresent !== present;
        if (hasPresentChanged) {
            const prevAnimationName = prevAnimationNameRef.current;
            const currentAnimationName = $0ac33c7c3f86b9ab$var$$921a889cee6df7e8$var$getAnimationName(styles);
            if (present) send("MOUNT");
            else if (currentAnimationName === "none" || (styles === null || styles === void 0 ? void 0 : styles.display) === "none") // so we unmount instantly
            send("UNMOUNT");
            else {
                /**
         * When `present` changes to `false`, we check changes to animation-name to
         * determine whether an animation has started. We chose this approach (reading
         * computed styles) because there is no `animationrun` event and `animationstart`
         * fires after `animation-delay` has expired which would be too late.
         */ const isAnimating = prevAnimationName !== currentAnimationName;
                if (wasPresent && isAnimating) send("ANIMATION_OUT");
                else send("UNMOUNT");
            }
            prevPresentRef.current = present;
        }
    }, [
        present,
        send
    ]);
    (0, $620f4b520baef9c2$export$e5c5a5f917a5871c)(()=>{
        if (node1) {
            /**
       * Triggering an ANIMATION_OUT during an ANIMATION_IN will fire an `animationcancel`
       * event for ANIMATION_IN after we have entered `unmountSuspended` state. So, we
       * make sure we only trigger ANIMATION_END for the currently active animation.
       */ const handleAnimationEnd = (event)=>{
                const currentAnimationName = $0ac33c7c3f86b9ab$var$$921a889cee6df7e8$var$getAnimationName(stylesRef.current);
                const isCurrentAnimation = currentAnimationName.includes(event.animationName);
                if (event.target === node1 && isCurrentAnimation) // a frame after the animation ends, creating a flash of visible content.
                // By manually flushing we ensure they sync within a frame, removing the flash.
                (0, $117771ce739ab0ef$exports.flushSync)(()=>send("ANIMATION_END"));
            };
            const handleAnimationStart = (event)=>{
                if (event.target === node1) prevAnimationNameRef.current = $0ac33c7c3f86b9ab$var$$921a889cee6df7e8$var$getAnimationName(stylesRef.current);
            };
            node1.addEventListener("animationstart", handleAnimationStart);
            node1.addEventListener("animationcancel", handleAnimationEnd);
            node1.addEventListener("animationend", handleAnimationEnd);
            return ()=>{
                node1.removeEventListener("animationstart", handleAnimationStart);
                node1.removeEventListener("animationcancel", handleAnimationEnd);
                node1.removeEventListener("animationend", handleAnimationEnd);
            };
        } else // We avoid doing so during cleanup as the node may change but still exist.
        send("ANIMATION_END");
    }, [
        node1,
        send
    ]);
    return {
        isPresent: [
            "mounted",
            "unmountSuspended"
        ].includes(state),
        ref: (0, $LI8jA.useCallback)((node)=>{
            if (node) stylesRef.current = getComputedStyle(node);
            setNode(node);
        }, [])
    };
}
/* -----------------------------------------------------------------------------------------------*/ function $0ac33c7c3f86b9ab$var$$921a889cee6df7e8$var$getAnimationName(styles) {
    return (styles === null || styles === void 0 ? void 0 : styles.animationName) || "none";
}





var $LI8jA = parcelRequire("LI8jA");









const $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$ENTRY_FOCUS = "rovingFocusGroup.onEntryFocus";
const $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$EVENT_OPTIONS = {
    bubbles: false,
    cancelable: true
};
/* -------------------------------------------------------------------------------------------------
 * RovingFocusGroup
 * -----------------------------------------------------------------------------------------------*/ const $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$GROUP_NAME = "RovingFocusGroup";
const [$fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$Collection, $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$useCollection, $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$createCollectionScope] = (0, $38e2772b5a4e93fc$export$c74125a8e3af6bb2)($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$GROUP_NAME);
const [$fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$createRovingFocusGroupContext, $fafe9e85b41f374b$export$c7109489551a4f4] = (0, $ec3315292aa721d0$export$50c7b4e9d9f19c1)($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$GROUP_NAME, [
    $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$createCollectionScope
]);
const [$fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$RovingFocusProvider, $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$useRovingFocusContext] = $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$createRovingFocusGroupContext($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$GROUP_NAME);
const $fafe9e85b41f374b$export$8699f7c8af148338 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    return /*#__PURE__*/ (0, $LI8jA.createElement)($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$Collection.Provider, {
        scope: props.__scopeRovingFocusGroup
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$Collection.Slot, {
        scope: props.__scopeRovingFocusGroup
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$RovingFocusGroupImpl, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, props, {
        ref: forwardedRef
    }))));
});
/*#__PURE__*/ Object.assign($fafe9e85b41f374b$export$8699f7c8af148338, {
    displayName: $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$GROUP_NAME
});
/* -----------------------------------------------------------------------------------------------*/ const $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$RovingFocusGroupImpl = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeRovingFocusGroup: __scopeRovingFocusGroup , orientation: orientation , loop: loop = false , dir: dir , currentTabStopId: currentTabStopIdProp , defaultCurrentTabStopId: defaultCurrentTabStopId , onCurrentTabStopIdChange: onCurrentTabStopIdChange , onEntryFocus: onEntryFocus , ...groupProps } = props;
    const ref = (0, $LI8jA.useRef)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, ref);
    const direction = (0, $842d1ddb67983cae$export$b39126d51d94e6f3)(dir);
    const [currentTabStopId = null, setCurrentTabStopId] = (0, $f4c632903130edee$export$6f32135080cb4c3)({
        prop: currentTabStopIdProp,
        defaultProp: defaultCurrentTabStopId,
        onChange: onCurrentTabStopIdChange
    });
    const [isTabbingBackOut, setIsTabbingBackOut] = (0, $LI8jA.useState)(false);
    const handleEntryFocus = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onEntryFocus);
    const getItems = $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$useCollection(__scopeRovingFocusGroup);
    const isClickFocusRef = (0, $LI8jA.useRef)(false);
    const [focusableItemsCount, setFocusableItemsCount] = (0, $LI8jA.useState)(0);
    (0, $LI8jA.useEffect)(()=>{
        const node = ref.current;
        if (node) {
            node.addEventListener($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$ENTRY_FOCUS, handleEntryFocus);
            return ()=>node.removeEventListener($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$ENTRY_FOCUS, handleEntryFocus);
        }
    }, [
        handleEntryFocus
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$RovingFocusProvider, {
        scope: __scopeRovingFocusGroup,
        orientation: orientation,
        dir: direction,
        loop: loop,
        currentTabStopId: currentTabStopId,
        onItemFocus: (0, $LI8jA.useCallback)((tabStopId)=>setCurrentTabStopId(tabStopId), [
            setCurrentTabStopId
        ]),
        onItemShiftTab: (0, $LI8jA.useCallback)(()=>setIsTabbingBackOut(true), []),
        onFocusableItemAdd: (0, $LI8jA.useCallback)(()=>setFocusableItemsCount((prevCount)=>prevCount + 1), []),
        onFocusableItemRemove: (0, $LI8jA.useCallback)(()=>setFocusableItemsCount((prevCount)=>prevCount - 1), [])
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        tabIndex: isTabbingBackOut || focusableItemsCount === 0 ? -1 : 0,
        "data-orientation": orientation
    }, groupProps, {
        ref: composedRefs,
        style: {
            outline: "none",
            ...props.style
        },
        onMouseDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onMouseDown, ()=>{
            isClickFocusRef.current = true;
        }),
        onFocus: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onFocus, (event)=>{
            // We normally wouldn't need this check, because we already check
            // that the focus is on the current target and not bubbling to it.
            // We do this because Safari doesn't focus buttons when clicked, and
            // instead, the wrapper will get focused and not through a bubbling event.
            const isKeyboardFocus = !isClickFocusRef.current;
            if (event.target === event.currentTarget && isKeyboardFocus && !isTabbingBackOut) {
                const entryFocusEvent = new CustomEvent($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$ENTRY_FOCUS, $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$EVENT_OPTIONS);
                event.currentTarget.dispatchEvent(entryFocusEvent);
                if (!entryFocusEvent.defaultPrevented) {
                    const items = getItems().filter((item)=>item.focusable);
                    const activeItem = items.find((item)=>item.active);
                    const currentItem = items.find((item)=>item.id === currentTabStopId);
                    const candidateItems = [
                        activeItem,
                        currentItem,
                        ...items
                    ].filter(Boolean);
                    const candidateNodes = candidateItems.map((item)=>item.ref.current);
                    $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$focusFirst(candidateNodes);
                }
            }
            isClickFocusRef.current = false;
        }),
        onBlur: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onBlur, ()=>setIsTabbingBackOut(false))
    })));
});
/* -------------------------------------------------------------------------------------------------
 * RovingFocusGroupItem
 * -----------------------------------------------------------------------------------------------*/ const $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$ITEM_NAME = "RovingFocusGroupItem";
const $fafe9e85b41f374b$export$ab9df7c53fe8454 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeRovingFocusGroup: __scopeRovingFocusGroup , focusable: focusable = true , active: active = false , tabStopId: tabStopId , ...itemProps } = props;
    const autoId = (0, $d4070564f9335f17$export$f680877a34711e37)();
    const id = tabStopId || autoId;
    const context = $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$useRovingFocusContext($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$ITEM_NAME, __scopeRovingFocusGroup);
    const isCurrentTabStop = context.currentTabStopId === id;
    const getItems = $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$useCollection(__scopeRovingFocusGroup);
    const { onFocusableItemAdd: onFocusableItemAdd , onFocusableItemRemove: onFocusableItemRemove  } = context;
    (0, $LI8jA.useEffect)(()=>{
        if (focusable) {
            onFocusableItemAdd();
            return ()=>onFocusableItemRemove();
        }
    }, [
        focusable,
        onFocusableItemAdd,
        onFocusableItemRemove
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$Collection.ItemSlot, {
        scope: __scopeRovingFocusGroup,
        id: id,
        focusable: focusable,
        active: active
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).span, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        tabIndex: isCurrentTabStop ? 0 : -1,
        "data-orientation": context.orientation
    }, itemProps, {
        ref: forwardedRef,
        onMouseDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onMouseDown, (event)=>{
            // We prevent focusing non-focusable items on `mousedown`.
            // Even though the item has tabIndex={-1}, that only means take it out of the tab order.
            if (!focusable) event.preventDefault(); // Safari doesn't focus a button when clicked so we run our logic on mousedown also
            else context.onItemFocus(id);
        }),
        onFocus: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onFocus, ()=>context.onItemFocus(id)),
        onKeyDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onKeyDown, (event)=>{
            if (event.key === "Tab" && event.shiftKey) {
                context.onItemShiftTab();
                return;
            }
            if (event.target !== event.currentTarget) return;
            const focusIntent = $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$getFocusIntent(event, context.orientation, context.dir);
            if (focusIntent !== undefined) {
                event.preventDefault();
                const items = getItems().filter((item)=>item.focusable);
                let candidateNodes = items.map((item)=>item.ref.current);
                if (focusIntent === "last") candidateNodes.reverse();
                else if (focusIntent === "prev" || focusIntent === "next") {
                    if (focusIntent === "prev") candidateNodes.reverse();
                    const currentIndex = candidateNodes.indexOf(event.currentTarget);
                    candidateNodes = context.loop ? $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$wrapArray(candidateNodes, currentIndex + 1) : candidateNodes.slice(currentIndex + 1);
                }
                /**
         * Imperative focus during keydown is risky so we prevent React's batching updates
         * to avoid potential bugs. See: https://github.com/facebook/react/issues/20332
         */ setTimeout(()=>$fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$focusFirst(candidateNodes));
            }
        })
    })));
});
/*#__PURE__*/ Object.assign($fafe9e85b41f374b$export$ab9df7c53fe8454, {
    displayName: $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$ITEM_NAME
});
/* -----------------------------------------------------------------------------------------------*/ // prettier-ignore
const $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$MAP_KEY_TO_FOCUS_INTENT = {
    ArrowLeft: "prev",
    ArrowUp: "prev",
    ArrowRight: "next",
    ArrowDown: "next",
    PageUp: "first",
    Home: "first",
    PageDown: "last",
    End: "last"
};
function $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$getDirectionAwareKey(key, dir) {
    if (dir !== "rtl") return key;
    return key === "ArrowLeft" ? "ArrowRight" : key === "ArrowRight" ? "ArrowLeft" : key;
}
function $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$getFocusIntent(event, orientation, dir) {
    const key = $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$getDirectionAwareKey(event.key, dir);
    if (orientation === "vertical" && [
        "ArrowLeft",
        "ArrowRight"
    ].includes(key)) return undefined;
    if (orientation === "horizontal" && [
        "ArrowUp",
        "ArrowDown"
    ].includes(key)) return undefined;
    return $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$MAP_KEY_TO_FOCUS_INTENT[key];
}
function $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$focusFirst(candidates) {
    const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
    for (const candidate of candidates){
        // if focus is already where we want to go, we don't want to keep going through the candidates
        if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
        candidate.focus();
        if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
    }
}
/**
 * Wraps an array around itself at a given start index
 * Example: `wrapArray(['a', 'b', 'c', 'd'], 2) === ['c', 'd', 'a', 'b']`
 */ function $fafe9e85b41f374b$var$$d7bdfb9eb0fdf311$var$wrapArray(array, startIndex) {
    return array.map((_, index)=>array[(startIndex + index) % array.length]);
}
const $fafe9e85b41f374b$export$be92b6f5f03c0fe9 = $fafe9e85b41f374b$export$8699f7c8af148338;
const $fafe9e85b41f374b$export$6d08773d2e66f8f2 = $fafe9e85b41f374b$export$ab9df7c53fe8454;




var $f51523d7bb101394$var$getDefaultParent = function(originalTarget) {
    if (typeof document === "undefined") return null;
    var sampleTarget = Array.isArray(originalTarget) ? originalTarget[0] : originalTarget;
    return sampleTarget.ownerDocument.body;
};
var $f51523d7bb101394$var$counterMap = new WeakMap();
var $f51523d7bb101394$var$uncontrolledNodes = new WeakMap();
var $f51523d7bb101394$var$markerMap = {};
var $f51523d7bb101394$var$lockCount = 0;
var $f51523d7bb101394$var$unwrapHost = function(node) {
    return node && (node.host || $f51523d7bb101394$var$unwrapHost(node.parentNode));
};
var $f51523d7bb101394$var$correctTargets = function(parent, targets) {
    return targets.map(function(target) {
        if (parent.contains(target)) return target;
        var correctedTarget = $f51523d7bb101394$var$unwrapHost(target);
        if (correctedTarget && parent.contains(correctedTarget)) return correctedTarget;
        console.error("aria-hidden", target, "in not contained inside", parent, ". Doing nothing");
        return null;
    }).filter(function(x) {
        return Boolean(x);
    });
};
/**
 * Marks everything except given node(or nodes) as aria-hidden
 * @param {Element | Element[]} originalTarget - elements to keep on the page
 * @param [parentNode] - top element, defaults to document.body
 * @param {String} [markerName] - a special attribute to mark every node
 * @param {String} [controlAttribute] - html Attribute to control
 * @return {Undo} undo command
 */ var $f51523d7bb101394$var$applyAttributeToOthers = function(originalTarget, parentNode, markerName, controlAttribute) {
    var targets = $f51523d7bb101394$var$correctTargets(parentNode, Array.isArray(originalTarget) ? originalTarget : [
        originalTarget
    ]);
    if (!$f51523d7bb101394$var$markerMap[markerName]) $f51523d7bb101394$var$markerMap[markerName] = new WeakMap();
    var markerCounter = $f51523d7bb101394$var$markerMap[markerName];
    var hiddenNodes = [];
    var elementsToKeep = new Set();
    var elementsToStop = new Set(targets);
    var keep = function(el) {
        if (!el || elementsToKeep.has(el)) return;
        elementsToKeep.add(el);
        keep(el.parentNode);
    };
    targets.forEach(keep);
    var deep = function(parent) {
        if (!parent || elementsToStop.has(parent)) return;
        Array.prototype.forEach.call(parent.children, function(node) {
            if (elementsToKeep.has(node)) deep(node);
            else {
                var attr = node.getAttribute(controlAttribute);
                var alreadyHidden = attr !== null && attr !== "false";
                var counterValue = ($f51523d7bb101394$var$counterMap.get(node) || 0) + 1;
                var markerValue = (markerCounter.get(node) || 0) + 1;
                $f51523d7bb101394$var$counterMap.set(node, counterValue);
                markerCounter.set(node, markerValue);
                hiddenNodes.push(node);
                if (counterValue === 1 && alreadyHidden) $f51523d7bb101394$var$uncontrolledNodes.set(node, true);
                if (markerValue === 1) node.setAttribute(markerName, "true");
                if (!alreadyHidden) node.setAttribute(controlAttribute, "true");
            }
        });
    };
    deep(parentNode);
    elementsToKeep.clear();
    $f51523d7bb101394$var$lockCount++;
    return function() {
        hiddenNodes.forEach(function(node) {
            var counterValue = $f51523d7bb101394$var$counterMap.get(node) - 1;
            var markerValue = markerCounter.get(node) - 1;
            $f51523d7bb101394$var$counterMap.set(node, counterValue);
            markerCounter.set(node, markerValue);
            if (!counterValue) {
                if (!$f51523d7bb101394$var$uncontrolledNodes.has(node)) node.removeAttribute(controlAttribute);
                $f51523d7bb101394$var$uncontrolledNodes.delete(node);
            }
            if (!markerValue) node.removeAttribute(markerName);
        });
        $f51523d7bb101394$var$lockCount--;
        if (!$f51523d7bb101394$var$lockCount) {
            // clear
            $f51523d7bb101394$var$counterMap = new WeakMap();
            $f51523d7bb101394$var$counterMap = new WeakMap();
            $f51523d7bb101394$var$uncontrolledNodes = new WeakMap();
            $f51523d7bb101394$var$markerMap = {};
        }
    };
};
var $f51523d7bb101394$export$6e33d16126ed003c = function(originalTarget, parentNode, markerName) {
    if (markerName === void 0) markerName = "data-aria-hidden";
    var targets = Array.from(Array.isArray(originalTarget) ? originalTarget : [
        originalTarget
    ]);
    var activeParentNode = parentNode || $f51523d7bb101394$var$getDefaultParent(originalTarget);
    if (!activeParentNode) return function() {
        return null;
    };
    // we should not hide ariaLive elements - https://github.com/theKashey/aria-hidden/issues/10
    targets.push.apply(targets, Array.from(activeParentNode.querySelectorAll("[aria-live]")));
    return $f51523d7bb101394$var$applyAttributeToOthers(targets, activeParentNode, markerName, "aria-hidden");
};
var $f51523d7bb101394$export$59151cc8db999a24 = function(originalTarget, parentNode, markerName) {
    if (markerName === void 0) markerName = "data-inert-ed";
    var activeParentNode = parentNode || $f51523d7bb101394$var$getDefaultParent(originalTarget);
    if (!activeParentNode) return function() {
        return null;
    };
    return $f51523d7bb101394$var$applyAttributeToOthers(originalTarget, activeParentNode, markerName, "inert");
};
var $f51523d7bb101394$export$cc95fea82d705fca = function() {
    return typeof HTMLElement !== "undefined" && HTMLElement.prototype.hasOwnProperty("inert");
};
var $f51523d7bb101394$export$9845d4b6bdad192b = function(originalTarget, parentNode, markerName) {
    if (markerName === void 0) markerName = "data-suppressed";
    return ($f51523d7bb101394$export$cc95fea82d705fca() ? $f51523d7bb101394$export$59151cc8db999a24 : $f51523d7bb101394$export$6e33d16126ed003c)(originalTarget, parentNode, markerName);
};


/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */ /* global Reflect, Promise, SuppressedError, Symbol */ var $aaf53e1f8378802e$var$extendStatics = function(d, b) {
    $aaf53e1f8378802e$var$extendStatics = Object.setPrototypeOf || ({
        __proto__: []
    }) instanceof Array && function(d, b) {
        d.__proto__ = b;
    } || function(d, b) {
        for(var p in b)if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    };
    return $aaf53e1f8378802e$var$extendStatics(d, b);
};
function $aaf53e1f8378802e$export$a8ba968b8961cb8a(d, b) {
    if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    $aaf53e1f8378802e$var$extendStatics(d, b);
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var $aaf53e1f8378802e$export$18ce0697a983be9b = function() {
    $aaf53e1f8378802e$export$18ce0697a983be9b = Object.assign || function __assign(t) {
        for(var s, i = 1, n = arguments.length; i < n; i++){
            s = arguments[i];
            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return $aaf53e1f8378802e$export$18ce0697a983be9b.apply(this, arguments);
};
function $aaf53e1f8378802e$export$3c9a16f847548506(s, e) {
    var t = {};
    for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") {
        for(var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++)if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
    }
    return t;
}
function $aaf53e1f8378802e$export$29e00dfd3077644b(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function $aaf53e1f8378802e$export$d5ad3fd78186038f(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
function $aaf53e1f8378802e$export$3a84e1ae4e97e9b0(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) {
        if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
        return f;
    }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for(var i = decorators.length - 1; i >= 0; i--){
        var context = {};
        for(var p in contextIn)context[p] = p === "access" ? {} : contextIn[p];
        for(var p in contextIn.access)context.access[p] = contextIn.access[p];
        context.addInitializer = function(f) {
            if (done) throw new TypeError("Cannot add initializers after decoration has completed");
            extraInitializers.push(accept(f || null));
        };
        var result = (0, decorators[i])(kind === "accessor" ? {
            get: descriptor.get,
            set: descriptor.set
        } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        } else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
}
function $aaf53e1f8378802e$export$d831c04e792af3d(thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for(var i = 0; i < initializers.length; i++)value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    return useValue ? value : void 0;
}
function $aaf53e1f8378802e$export$6a2a36740a146cb8(x) {
    return typeof x === "symbol" ? x : "".concat(x);
}
function $aaf53e1f8378802e$export$d1a06452d3489bc7(f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", {
        configurable: true,
        value: prefix ? "".concat(prefix, " ", name) : name
    });
}
function $aaf53e1f8378802e$export$f1db080c865becb9(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}
function $aaf53e1f8378802e$export$1050f835b63b671e(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
        });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}
function $aaf53e1f8378802e$export$67ebef60e6f28a6(thisArg, body) {
    var _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, f, y, t, g;
    return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
    }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var $aaf53e1f8378802e$export$45d3717a4c69092e = Object.create ? function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
        enumerable: true,
        get: function() {
            return m[k];
        }
    };
    Object.defineProperty(o, k2, desc);
} : function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
};
function $aaf53e1f8378802e$export$f33643c0debef087(m, o) {
    for(var p in m)if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) $aaf53e1f8378802e$export$45d3717a4c69092e(o, m, p);
}
function $aaf53e1f8378802e$export$19a8beecd37a4c45(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function() {
            if (o && i >= o.length) o = void 0;
            return {
                value: o && o[i++],
                done: !o
            };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function $aaf53e1f8378802e$export$8d051b38c9118094(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while((n === void 0 || n-- > 0) && !(r = i.next()).done)ar.push(r.value);
    } catch (error) {
        e = {
            error: error
        };
    } finally{
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        } finally{
            if (e) throw e.error;
        }
    }
    return ar;
}
function $aaf53e1f8378802e$export$afc72e2116322959() {
    for(var ar = [], i = 0; i < arguments.length; i++)ar = ar.concat($aaf53e1f8378802e$export$8d051b38c9118094(arguments[i]));
    return ar;
}
function $aaf53e1f8378802e$export$6388937ca91ccae8() {
    for(var s = 0, i = 0, il = arguments.length; i < il; i++)s += arguments[i].length;
    for(var r = Array(s), k = 0, i = 0; i < il; i++)for(var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)r[k] = a[j];
    return r;
}
function $aaf53e1f8378802e$export$1216008129fb82ed(to, from, pack) {
    if (pack || arguments.length === 2) {
        for(var i = 0, l = from.length, ar; i < l; i++)if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}
function $aaf53e1f8378802e$export$10c90e4f7922046c(v) {
    return this instanceof $aaf53e1f8378802e$export$10c90e4f7922046c ? (this.v = v, this) : new $aaf53e1f8378802e$export$10c90e4f7922046c(v);
}
function $aaf53e1f8378802e$export$e427f37a30a4de9b(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i;
    function verb(n) {
        if (g[n]) i[n] = function(v) {
            return new Promise(function(a, b) {
                q.push([
                    n,
                    v,
                    a,
                    b
                ]) > 1 || resume(n, v);
            });
        };
    }
    function resume(n, v) {
        try {
            step(g[n](v));
        } catch (e) {
            settle(q[0][3], e);
        }
    }
    function step(r) {
        r.value instanceof $aaf53e1f8378802e$export$10c90e4f7922046c ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
        resume("next", value);
    }
    function reject(value) {
        resume("throw", value);
    }
    function settle(f, v) {
        if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
    }
}
function $aaf53e1f8378802e$export$bbd80228419bb833(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function(e) {
        throw e;
    }), verb("return"), i[Symbol.iterator] = function() {
        return this;
    }, i;
    function verb(n, f) {
        i[n] = o[n] ? function(v) {
            return (p = !p) ? {
                value: $aaf53e1f8378802e$export$10c90e4f7922046c(o[n](v)),
                done: false
            } : f ? f(v) : v;
        } : f;
    }
}
function $aaf53e1f8378802e$export$e3b29a3d6162315f(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof $aaf53e1f8378802e$export$19a8beecd37a4c45 === "function" ? $aaf53e1f8378802e$export$19a8beecd37a4c45(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
        return this;
    }, i);
    function verb(n) {
        i[n] = o[n] && function(v) {
            return new Promise(function(resolve, reject) {
                v = o[n](v), settle(resolve, reject, v.done, v.value);
            });
        };
    }
    function settle(resolve, reject, d, v) {
        Promise.resolve(v).then(function(v) {
            resolve({
                value: v,
                done: d
            });
        }, reject);
    }
}
function $aaf53e1f8378802e$export$4fb47efe1390b86f(cooked, raw) {
    if (Object.defineProperty) Object.defineProperty(cooked, "raw", {
        value: raw
    });
    else cooked.raw = raw;
    return cooked;
}
var $aaf53e1f8378802e$var$__setModuleDefault = Object.create ? function(o, v) {
    Object.defineProperty(o, "default", {
        enumerable: true,
        value: v
    });
} : function(o, v) {
    o["default"] = v;
};
function $aaf53e1f8378802e$export$c21735bcef00d192(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) {
        for(var k in mod)if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) $aaf53e1f8378802e$export$45d3717a4c69092e(result, mod, k);
    }
    $aaf53e1f8378802e$var$__setModuleDefault(result, mod);
    return result;
}
function $aaf53e1f8378802e$export$da59b14a69baef04(mod) {
    return mod && mod.__esModule ? mod : {
        default: mod
    };
}
function $aaf53e1f8378802e$export$d5dcaf168c640c35(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function $aaf53e1f8378802e$export$d40a35129aaff81f(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function $aaf53e1f8378802e$export$81fdc39f203e4e04(state, receiver) {
    if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
    return typeof state === "function" ? receiver === state : state.has(receiver);
}
function $aaf53e1f8378802e$export$88ac25d8e944e405(env, value, async) {
    if (value !== null && value !== void 0) {
        if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
        var dispose;
        if (async) {
            if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
            dispose = value[Symbol.asyncDispose];
        }
        if (dispose === void 0) {
            if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
            dispose = value[Symbol.dispose];
        }
        if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
        env.stack.push({
            value: value,
            dispose: dispose,
            async: async
        });
    } else if (async) env.stack.push({
        async: true
    });
    return value;
}
var $aaf53e1f8378802e$var$_SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};
function $aaf53e1f8378802e$export$8f076105dc360e92(env) {
    function fail(e) {
        env.error = env.hasError ? new $aaf53e1f8378802e$var$_SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
        env.hasError = true;
    }
    function next() {
        while(env.stack.length){
            var rec = env.stack.pop();
            try {
                var result = rec.dispose && rec.dispose.call(rec.value);
                if (rec.async) return Promise.resolve(result).then(next, function(e) {
                    fail(e);
                    return next();
                });
            } catch (e) {
                fail(e);
            }
        }
        if (env.hasError) throw env.error;
    }
    return next();
}
var $aaf53e1f8378802e$export$2e2bcd8739ae039 = {
    __extends: $aaf53e1f8378802e$export$a8ba968b8961cb8a,
    __assign: $aaf53e1f8378802e$export$18ce0697a983be9b,
    __rest: $aaf53e1f8378802e$export$3c9a16f847548506,
    __decorate: $aaf53e1f8378802e$export$29e00dfd3077644b,
    __param: $aaf53e1f8378802e$export$d5ad3fd78186038f,
    __metadata: $aaf53e1f8378802e$export$f1db080c865becb9,
    __awaiter: $aaf53e1f8378802e$export$1050f835b63b671e,
    __generator: $aaf53e1f8378802e$export$67ebef60e6f28a6,
    __createBinding: $aaf53e1f8378802e$export$45d3717a4c69092e,
    __exportStar: $aaf53e1f8378802e$export$f33643c0debef087,
    __values: $aaf53e1f8378802e$export$19a8beecd37a4c45,
    __read: $aaf53e1f8378802e$export$8d051b38c9118094,
    __spread: $aaf53e1f8378802e$export$afc72e2116322959,
    __spreadArrays: $aaf53e1f8378802e$export$6388937ca91ccae8,
    __spreadArray: $aaf53e1f8378802e$export$1216008129fb82ed,
    __await: $aaf53e1f8378802e$export$10c90e4f7922046c,
    __asyncGenerator: $aaf53e1f8378802e$export$e427f37a30a4de9b,
    __asyncDelegator: $aaf53e1f8378802e$export$bbd80228419bb833,
    __asyncValues: $aaf53e1f8378802e$export$e3b29a3d6162315f,
    __makeTemplateObject: $aaf53e1f8378802e$export$4fb47efe1390b86f,
    __importStar: $aaf53e1f8378802e$export$c21735bcef00d192,
    __importDefault: $aaf53e1f8378802e$export$da59b14a69baef04,
    __classPrivateFieldGet: $aaf53e1f8378802e$export$d5dcaf168c640c35,
    __classPrivateFieldSet: $aaf53e1f8378802e$export$d40a35129aaff81f,
    __classPrivateFieldIn: $aaf53e1f8378802e$export$81fdc39f203e4e04,
    __addDisposableResource: $aaf53e1f8378802e$export$88ac25d8e944e405,
    __disposeResources: $aaf53e1f8378802e$export$8f076105dc360e92
};



var $LI8jA = parcelRequire("LI8jA");


var $LI8jA = parcelRequire("LI8jA");
var $18c6276c7d147019$export$1da7500147d4bc3 = "right-scroll-bar-position";
var $18c6276c7d147019$export$898e37bbd2a0ae4e = "width-before-scroll-bar";
var $18c6276c7d147019$export$bb813dfbbc432abc = "with-scroll-bars-hidden";
var $18c6276c7d147019$export$63d0edf80fea83b1 = "--removed-body-scroll-bar-size";


/**
 * Assigns a value for a given ref, no matter of the ref format
 * @param {RefObject} ref - a callback function or ref object
 * @param value - a new value
 *
 * @see https://github.com/theKashey/use-callback-ref#assignref
 * @example
 * const refObject = useRef();
 * const refFn = (ref) => {....}
 *
 * assignRef(refObject, "refValue");
 * assignRef(refFn, "refValue");
 */ function $48b484d26158240a$export$d734136a7b018efe(ref, value) {
    if (typeof ref === "function") ref(value);
    else if (ref) ref.current = value;
    return ref;
}



var $LI8jA = parcelRequire("LI8jA");
function $88c0ba052c2f3a56$export$25bec8c6f54ee79a(initialValue, callback) {
    var ref = (0, $LI8jA.useState)(function() {
        return {
            // value
            value: initialValue,
            // last callback
            callback: callback,
            // "memoized" public interface
            facade: {
                get current () {
                    return ref.value;
                },
                set current (value){
                    var last = ref.value;
                    if (last !== value) {
                        ref.value = value;
                        ref.callback(value, last);
                    }
                }
            }
        };
    })[0];
    // update callback
    ref.callback = callback;
    return ref.facade;
}


function $07af983467ab7113$export$74665b213cb5c4cf(refs, defaultValue) {
    return (0, $88c0ba052c2f3a56$export$25bec8c6f54ee79a)(defaultValue || null, function(newValue) {
        return refs.forEach(function(ref) {
            return (0, $48b484d26158240a$export$d734136a7b018efe)(ref, newValue);
        });
    });
}



function $86a5b16e09af3d02$var$ItoI(a) {
    return a;
}
function $86a5b16e09af3d02$var$innerCreateMedium(defaults, middleware) {
    if (middleware === void 0) middleware = $86a5b16e09af3d02$var$ItoI;
    var buffer = [];
    var assigned = false;
    var medium = {
        read: function() {
            if (assigned) throw new Error("Sidecar: could not `read` from an `assigned` medium. `read` could be used only with `useMedium`.");
            if (buffer.length) return buffer[buffer.length - 1];
            return defaults;
        },
        useMedium: function(data) {
            var item = middleware(data, assigned);
            buffer.push(item);
            return function() {
                buffer = buffer.filter(function(x) {
                    return x !== item;
                });
            };
        },
        assignSyncMedium: function(cb) {
            assigned = true;
            while(buffer.length){
                var cbs = buffer;
                buffer = [];
                cbs.forEach(cb);
            }
            buffer = {
                push: function(x) {
                    return cb(x);
                },
                filter: function() {
                    return buffer;
                }
            };
        },
        assignMedium: function(cb) {
            assigned = true;
            var pendingQueue = [];
            if (buffer.length) {
                var cbs = buffer;
                buffer = [];
                cbs.forEach(cb);
                pendingQueue = buffer;
            }
            var executeQueue = function() {
                var cbs = pendingQueue;
                pendingQueue = [];
                cbs.forEach(cb);
            };
            var cycle = function() {
                return Promise.resolve().then(executeQueue);
            };
            cycle();
            buffer = {
                push: function(x) {
                    pendingQueue.push(x);
                    cycle();
                },
                filter: function(filter) {
                    pendingQueue = pendingQueue.filter(filter);
                    return buffer;
                }
            };
        }
    };
    return medium;
}
function $86a5b16e09af3d02$export$9ffbfcaf067b02c6(defaults, middleware) {
    if (middleware === void 0) middleware = $86a5b16e09af3d02$var$ItoI;
    return $86a5b16e09af3d02$var$innerCreateMedium(defaults, middleware);
}
function $86a5b16e09af3d02$export$e13ec7dd7a14088d(options) {
    if (options === void 0) options = {};
    var medium = $86a5b16e09af3d02$var$innerCreateMedium(null);
    medium.options = (0, $aaf53e1f8378802e$export$18ce0697a983be9b)({
        async: true,
        ssr: false
    }, options);
    return medium;
}


var $0dfb55f2b130e638$export$e27363444bedfeac = (0, $86a5b16e09af3d02$export$e13ec7dd7a14088d)();


var $44a082588692de62$var$nothing = function() {
    return;
};
/**
 * Removes scrollbar from the page and contain the scroll within the Lock
 */ var $44a082588692de62$export$22940b497e769dee = $LI8jA.forwardRef(function(props, parentRef) {
    var ref = $LI8jA.useRef(null);
    var _a = $LI8jA.useState({
        onScrollCapture: $44a082588692de62$var$nothing,
        onWheelCapture: $44a082588692de62$var$nothing,
        onTouchMoveCapture: $44a082588692de62$var$nothing
    }), callbacks = _a[0], setCallbacks = _a[1];
    var forwardProps = props.forwardProps, children = props.children, className = props.className, removeScrollBar = props.removeScrollBar, enabled = props.enabled, shards = props.shards, sideCar = props.sideCar, noIsolation = props.noIsolation, inert = props.inert, allowPinchZoom = props.allowPinchZoom, _b = props.as, Container = _b === void 0 ? "div" : _b, rest = (0, $aaf53e1f8378802e$export$3c9a16f847548506)(props, [
        "forwardProps",
        "children",
        "className",
        "removeScrollBar",
        "enabled",
        "shards",
        "sideCar",
        "noIsolation",
        "inert",
        "allowPinchZoom",
        "as"
    ]);
    var SideCar = sideCar;
    var containerRef = (0, $07af983467ab7113$export$74665b213cb5c4cf)([
        ref,
        parentRef
    ]);
    var containerProps = (0, $aaf53e1f8378802e$export$18ce0697a983be9b)((0, $aaf53e1f8378802e$export$18ce0697a983be9b)({}, rest), callbacks);
    return $LI8jA.createElement($LI8jA.Fragment, null, enabled && $LI8jA.createElement(SideCar, {
        sideCar: (0, $0dfb55f2b130e638$export$e27363444bedfeac),
        removeScrollBar: removeScrollBar,
        shards: shards,
        noIsolation: noIsolation,
        inert: inert,
        setCallbacks: setCallbacks,
        allowPinchZoom: !!allowPinchZoom,
        lockRef: ref
    }), forwardProps ? $LI8jA.cloneElement($LI8jA.Children.only(children), (0, $aaf53e1f8378802e$export$18ce0697a983be9b)((0, $aaf53e1f8378802e$export$18ce0697a983be9b)({}, containerProps), {
        ref: containerRef
    })) : $LI8jA.createElement(Container, (0, $aaf53e1f8378802e$export$18ce0697a983be9b)({}, containerProps, {
        className: className,
        ref: containerRef
    }), children));
});
$44a082588692de62$export$22940b497e769dee.defaultProps = {
    enabled: true,
    removeScrollBar: true,
    inert: false
};
$44a082588692de62$export$22940b497e769dee.classNames = {
    fullWidth: (0, $18c6276c7d147019$export$898e37bbd2a0ae4e),
    zeroRight: (0, $18c6276c7d147019$export$1da7500147d4bc3)
};




var $LI8jA = parcelRequire("LI8jA");
var $8e1a9767feec45a3$var$SideCar = function(_a) {
    var sideCar = _a.sideCar, rest = (0, $aaf53e1f8378802e$export$3c9a16f847548506)(_a, [
        "sideCar"
    ]);
    if (!sideCar) throw new Error("Sidecar: please provide `sideCar` property to import the right car");
    var Target = sideCar.read();
    if (!Target) throw new Error("Sidecar medium not found");
    return $LI8jA.createElement(Target, (0, $aaf53e1f8378802e$export$18ce0697a983be9b)({}, rest));
};
$8e1a9767feec45a3$var$SideCar.isSideCarExport = true;
function $8e1a9767feec45a3$export$6cacc8fb0a9b94ce(medium, exported) {
    medium.useMedium(exported);
    return $8e1a9767feec45a3$var$SideCar;
}




var $LI8jA = parcelRequire("LI8jA");

var $LI8jA = parcelRequire("LI8jA");

var $LI8jA = parcelRequire("LI8jA");
var $954fb0bdfc950f76$var$currentNonce;
var $954fb0bdfc950f76$export$c5f670b24c0ae95a = function(nonce) {
    $954fb0bdfc950f76$var$currentNonce = nonce;
};
var $954fb0bdfc950f76$export$2b85b721e524d74b = function() {
    if ($954fb0bdfc950f76$var$currentNonce) return $954fb0bdfc950f76$var$currentNonce;
    if (typeof __webpack_nonce__ !== "undefined") return __webpack_nonce__;
    return undefined;
};


function $757f5277789f4206$var$makeStyleTag() {
    if (!document) return null;
    var tag = document.createElement("style");
    tag.type = "text/css";
    var nonce = (0, $954fb0bdfc950f76$export$2b85b721e524d74b)();
    if (nonce) tag.setAttribute("nonce", nonce);
    return tag;
}
function $757f5277789f4206$var$injectStyles(tag, css) {
    // @ts-ignore
    if (tag.styleSheet) // @ts-ignore
    tag.styleSheet.cssText = css;
    else tag.appendChild(document.createTextNode(css));
}
function $757f5277789f4206$var$insertStyleTag(tag) {
    var head = document.head || document.getElementsByTagName("head")[0];
    head.appendChild(tag);
}
var $757f5277789f4206$export$7c74eec858d5d226 = function() {
    var counter = 0;
    var stylesheet = null;
    return {
        add: function(style) {
            if (counter == 0) {
                if (stylesheet = $757f5277789f4206$var$makeStyleTag()) {
                    $757f5277789f4206$var$injectStyles(stylesheet, style);
                    $757f5277789f4206$var$insertStyleTag(stylesheet);
                }
            }
            counter++;
        },
        remove: function() {
            counter--;
            if (!counter && stylesheet) {
                stylesheet.parentNode && stylesheet.parentNode.removeChild(stylesheet);
                stylesheet = null;
            }
        }
    };
};


var $b8d5f152ff2eb09a$export$7d7b35c2d250e94c = function() {
    var sheet = (0, $757f5277789f4206$export$7c74eec858d5d226)();
    return function(styles, isDynamic) {
        $LI8jA.useEffect(function() {
            sheet.add(styles);
            return function() {
                sheet.remove();
            };
        }, [
            styles && isDynamic
        ]);
    };
};


var $0bc8934d1a27cb50$export$c1248ee86ba532c8 = function() {
    var useStyle = (0, $b8d5f152ff2eb09a$export$7d7b35c2d250e94c)();
    var Sheet = function(_a) {
        var styles = _a.styles, dynamic = _a.dynamic;
        useStyle(styles, dynamic);
        return null;
    };
    return Sheet;
};







var $ec3284a7c8ad02cf$export$efed13b5d0ca3386 = {
    left: 0,
    top: 0,
    right: 0,
    gap: 0
};
var $ec3284a7c8ad02cf$var$parse = function(x) {
    return parseInt(x || "", 10) || 0;
};
var $ec3284a7c8ad02cf$var$getOffset = function(gapMode) {
    var cs = window.getComputedStyle(document.body);
    var left = cs[gapMode === "padding" ? "paddingLeft" : "marginLeft"];
    var top = cs[gapMode === "padding" ? "paddingTop" : "marginTop"];
    var right = cs[gapMode === "padding" ? "paddingRight" : "marginRight"];
    return [
        $ec3284a7c8ad02cf$var$parse(left),
        $ec3284a7c8ad02cf$var$parse(top),
        $ec3284a7c8ad02cf$var$parse(right)
    ];
};
var $ec3284a7c8ad02cf$export$75f2ca8f029c77f4 = function(gapMode) {
    if (gapMode === void 0) gapMode = "margin";
    if (typeof window === "undefined") return $ec3284a7c8ad02cf$export$efed13b5d0ca3386;
    var offsets = $ec3284a7c8ad02cf$var$getOffset(gapMode);
    var documentWidth = document.documentElement.clientWidth;
    var windowWidth = window.innerWidth;
    return {
        left: offsets[0],
        top: offsets[1],
        right: offsets[2],
        gap: Math.max(0, windowWidth - documentWidth + offsets[2] - offsets[0])
    };
};


var $c848b47d45f50449$var$Style = (0, $0bc8934d1a27cb50$export$c1248ee86ba532c8)();
// important tip - once we measure scrollBar width and remove them
// we could not repeat this operation
// thus we are using style-singleton - only the first "yet correct" style will be applied.
var $c848b47d45f50449$var$getStyles = function(_a, allowRelative, gapMode, important) {
    var left = _a.left, top = _a.top, right = _a.right, gap = _a.gap;
    if (gapMode === void 0) gapMode = "margin";
    return "\n  .".concat((0, $18c6276c7d147019$export$bb813dfbbc432abc), " {\n   overflow: hidden ").concat(important, ";\n   padding-right: ").concat(gap, "px ").concat(important, ";\n  }\n  body {\n    overflow: hidden ").concat(important, ";\n    overscroll-behavior: contain;\n    ").concat([
        allowRelative && "position: relative ".concat(important, ";"),
        gapMode === "margin" && "\n    padding-left: ".concat(left, "px;\n    padding-top: ").concat(top, "px;\n    padding-right: ").concat(right, "px;\n    margin-left:0;\n    margin-top:0;\n    margin-right: ").concat(gap, "px ").concat(important, ";\n    "),
        gapMode === "padding" && "padding-right: ".concat(gap, "px ").concat(important, ";")
    ].filter(Boolean).join(""), "\n  }\n  \n  .").concat((0, $18c6276c7d147019$export$1da7500147d4bc3), " {\n    right: ").concat(gap, "px ").concat(important, ";\n  }\n  \n  .").concat((0, $18c6276c7d147019$export$898e37bbd2a0ae4e), " {\n    margin-right: ").concat(gap, "px ").concat(important, ";\n  }\n  \n  .").concat((0, $18c6276c7d147019$export$1da7500147d4bc3), " .").concat((0, $18c6276c7d147019$export$1da7500147d4bc3), " {\n    right: 0 ").concat(important, ";\n  }\n  \n  .").concat((0, $18c6276c7d147019$export$898e37bbd2a0ae4e), " .").concat((0, $18c6276c7d147019$export$898e37bbd2a0ae4e), " {\n    margin-right: 0 ").concat(important, ";\n  }\n  \n  body {\n    ").concat((0, $18c6276c7d147019$export$63d0edf80fea83b1), ": ").concat(gap, "px;\n  }\n");
};
var $c848b47d45f50449$export$9aa43b459c5ae9b9 = function(props) {
    var noRelative = props.noRelative, noImportant = props.noImportant, _a = props.gapMode, gapMode = _a === void 0 ? "margin" : _a;
    /*
     gap will be measured on every component mount
     however it will be used only by the "first" invocation
     due to singleton nature of <Style
     */ var gap = $LI8jA.useMemo(function() {
        return (0, $ec3284a7c8ad02cf$export$75f2ca8f029c77f4)(gapMode);
    }, [
        gapMode
    ]);
    return $LI8jA.createElement($c848b47d45f50449$var$Style, {
        styles: $c848b47d45f50449$var$getStyles(gap, !noRelative, gapMode, !noImportant ? "!important" : "")
    });
};







var $ea39917b93ab753f$var$passiveSupported = false;
if (typeof window !== "undefined") try {
    var $ea39917b93ab753f$var$options = Object.defineProperty({}, "passive", {
        get: function() {
            $ea39917b93ab753f$var$passiveSupported = true;
            return true;
        }
    });
    // @ts-ignore
    window.addEventListener("test", $ea39917b93ab753f$var$options, $ea39917b93ab753f$var$options);
    // @ts-ignore
    window.removeEventListener("test", $ea39917b93ab753f$var$options, $ea39917b93ab753f$var$options);
} catch (err) {
    $ea39917b93ab753f$var$passiveSupported = false;
}
var $ea39917b93ab753f$export$10a6e88623fa9454 = $ea39917b93ab753f$var$passiveSupported ? {
    passive: false
} : false;


var $4cf6b447bf11a6cb$var$alwaysContainsScroll = function(node) {
    // textarea will always _contain_ scroll inside self. It only can be hidden
    return node.tagName === "TEXTAREA";
};
var $4cf6b447bf11a6cb$var$elementCanBeScrolled = function(node, overflow) {
    var styles = window.getComputedStyle(node);
    return(// not-not-scrollable
    styles[overflow] !== "hidden" && // contains scroll inside self
    !(styles.overflowY === styles.overflowX && !$4cf6b447bf11a6cb$var$alwaysContainsScroll(node) && styles[overflow] === "visible"));
};
var $4cf6b447bf11a6cb$var$elementCouldBeVScrolled = function(node) {
    return $4cf6b447bf11a6cb$var$elementCanBeScrolled(node, "overflowY");
};
var $4cf6b447bf11a6cb$var$elementCouldBeHScrolled = function(node) {
    return $4cf6b447bf11a6cb$var$elementCanBeScrolled(node, "overflowX");
};
var $4cf6b447bf11a6cb$export$9ec64480cae49817 = function(axis, node) {
    var current = node;
    do {
        // Skip over shadow root
        if (typeof ShadowRoot !== "undefined" && current instanceof ShadowRoot) current = current.host;
        var isScrollable = $4cf6b447bf11a6cb$var$elementCouldBeScrolled(axis, current);
        if (isScrollable) {
            var _a = $4cf6b447bf11a6cb$var$getScrollVariables(axis, current), s = _a[1], d = _a[2];
            if (s > d) return true;
        }
        current = current.parentNode;
    }while (current && current !== document.body);
    return false;
};
var $4cf6b447bf11a6cb$var$getVScrollVariables = function(_a) {
    var scrollTop = _a.scrollTop, scrollHeight = _a.scrollHeight, clientHeight = _a.clientHeight;
    return [
        scrollTop,
        scrollHeight,
        clientHeight
    ];
};
var $4cf6b447bf11a6cb$var$getHScrollVariables = function(_a) {
    var scrollLeft = _a.scrollLeft, scrollWidth = _a.scrollWidth, clientWidth = _a.clientWidth;
    return [
        scrollLeft,
        scrollWidth,
        clientWidth
    ];
};
var $4cf6b447bf11a6cb$var$elementCouldBeScrolled = function(axis, node) {
    return axis === "v" ? $4cf6b447bf11a6cb$var$elementCouldBeVScrolled(node) : $4cf6b447bf11a6cb$var$elementCouldBeHScrolled(node);
};
var $4cf6b447bf11a6cb$var$getScrollVariables = function(axis, node) {
    return axis === "v" ? $4cf6b447bf11a6cb$var$getVScrollVariables(node) : $4cf6b447bf11a6cb$var$getHScrollVariables(node);
};
var $4cf6b447bf11a6cb$var$getDirectionFactor = function(axis, direction) {
    /**
     * If the element's direction is rtl (right-to-left), then scrollLeft is 0 when the scrollbar is at its rightmost position,
     * and then increasingly negative as you scroll towards the end of the content.
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollLeft
     */ return axis === "h" && direction === "rtl" ? -1 : 1;
};
var $4cf6b447bf11a6cb$export$dde0441bd4a6ded8 = function(axis, endTarget, event, sourceDelta, noOverscroll) {
    var directionFactor = $4cf6b447bf11a6cb$var$getDirectionFactor(axis, window.getComputedStyle(endTarget).direction);
    var delta = directionFactor * sourceDelta;
    // find scrollable target
    var target = event.target;
    var targetInLock = endTarget.contains(target);
    var shouldCancelScroll = false;
    var isDeltaPositive = delta > 0;
    var availableScroll = 0;
    var availableScrollTop = 0;
    do {
        var _a = $4cf6b447bf11a6cb$var$getScrollVariables(axis, target), position = _a[0], scroll_1 = _a[1], capacity = _a[2];
        var elementScroll = scroll_1 - capacity - directionFactor * position;
        if (position || elementScroll) {
            if ($4cf6b447bf11a6cb$var$elementCouldBeScrolled(axis, target)) {
                availableScroll += elementScroll;
                availableScrollTop += position;
            }
        }
        target = target.parentNode;
    }while (// portaled content
    !targetInLock && target !== document.body || // self content
    targetInLock && (endTarget.contains(target) || endTarget === target));
    if (isDeltaPositive && (noOverscroll && availableScroll === 0 || !noOverscroll && delta > availableScroll)) shouldCancelScroll = true;
    else if (!isDeltaPositive && (noOverscroll && availableScrollTop === 0 || !noOverscroll && -delta > availableScrollTop)) shouldCancelScroll = true;
    return shouldCancelScroll;
};


var $80f7d197b1699532$export$6e085704a79f4f56 = function(event) {
    return "changedTouches" in event ? [
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
    ] : [
        0,
        0
    ];
};
var $80f7d197b1699532$export$39efaa2ca254a28d = function(event) {
    return [
        event.deltaX,
        event.deltaY
    ];
};
var $80f7d197b1699532$var$extractRef = function(ref) {
    return ref && "current" in ref ? ref.current : ref;
};
var $80f7d197b1699532$var$deltaCompare = function(x, y) {
    return x[0] === y[0] && x[1] === y[1];
};
var $80f7d197b1699532$var$generateStyle = function(id) {
    return "\n  .block-interactivity-".concat(id, " {pointer-events: none;}\n  .allow-interactivity-").concat(id, " {pointer-events: all;}\n");
};
var $80f7d197b1699532$var$idCounter = 0;
var $80f7d197b1699532$var$lockStack = [];
function $80f7d197b1699532$export$a09dbff87b5da2d(props) {
    var shouldPreventQueue = $LI8jA.useRef([]);
    var touchStartRef = $LI8jA.useRef([
        0,
        0
    ]);
    var activeAxis = $LI8jA.useRef();
    var id = $LI8jA.useState($80f7d197b1699532$var$idCounter++)[0];
    var Style = $LI8jA.useState(function() {
        return (0, $0bc8934d1a27cb50$export$c1248ee86ba532c8)();
    })[0];
    var lastProps = $LI8jA.useRef(props);
    $LI8jA.useEffect(function() {
        lastProps.current = props;
    }, [
        props
    ]);
    $LI8jA.useEffect(function() {
        if (props.inert) {
            document.body.classList.add("block-interactivity-".concat(id));
            var allow_1 = (0, $aaf53e1f8378802e$export$1216008129fb82ed)([
                props.lockRef.current
            ], (props.shards || []).map($80f7d197b1699532$var$extractRef), true).filter(Boolean);
            allow_1.forEach(function(el) {
                return el.classList.add("allow-interactivity-".concat(id));
            });
            return function() {
                document.body.classList.remove("block-interactivity-".concat(id));
                allow_1.forEach(function(el) {
                    return el.classList.remove("allow-interactivity-".concat(id));
                });
            };
        }
        return;
    }, [
        props.inert,
        props.lockRef.current,
        props.shards
    ]);
    var shouldCancelEvent = $LI8jA.useCallback(function(event, parent) {
        if ("touches" in event && event.touches.length === 2) return !lastProps.current.allowPinchZoom;
        var touch = $80f7d197b1699532$export$6e085704a79f4f56(event);
        var touchStart = touchStartRef.current;
        var deltaX = "deltaX" in event ? event.deltaX : touchStart[0] - touch[0];
        var deltaY = "deltaY" in event ? event.deltaY : touchStart[1] - touch[1];
        var currentAxis;
        var target = event.target;
        var moveDirection = Math.abs(deltaX) > Math.abs(deltaY) ? "h" : "v";
        // allow horizontal touch move on Range inputs. They will not cause any scroll
        if ("touches" in event && moveDirection === "h" && target.type === "range") return false;
        var canBeScrolledInMainDirection = (0, $4cf6b447bf11a6cb$export$9ec64480cae49817)(moveDirection, target);
        if (!canBeScrolledInMainDirection) return true;
        if (canBeScrolledInMainDirection) currentAxis = moveDirection;
        else {
            currentAxis = moveDirection === "v" ? "h" : "v";
            canBeScrolledInMainDirection = (0, $4cf6b447bf11a6cb$export$9ec64480cae49817)(moveDirection, target);
        // other axis might be not scrollable
        }
        if (!canBeScrolledInMainDirection) return false;
        if (!activeAxis.current && "changedTouches" in event && (deltaX || deltaY)) activeAxis.current = currentAxis;
        if (!currentAxis) return true;
        var cancelingAxis = activeAxis.current || currentAxis;
        return (0, $4cf6b447bf11a6cb$export$dde0441bd4a6ded8)(cancelingAxis, parent, event, cancelingAxis === "h" ? deltaX : deltaY, true);
    }, []);
    var shouldPrevent = $LI8jA.useCallback(function(_event) {
        var event = _event;
        if (!$80f7d197b1699532$var$lockStack.length || $80f7d197b1699532$var$lockStack[$80f7d197b1699532$var$lockStack.length - 1] !== Style) // not the last active
        return;
        var delta = "deltaY" in event ? $80f7d197b1699532$export$39efaa2ca254a28d(event) : $80f7d197b1699532$export$6e085704a79f4f56(event);
        var sourceEvent = shouldPreventQueue.current.filter(function(e) {
            return e.name === event.type && e.target === event.target && $80f7d197b1699532$var$deltaCompare(e.delta, delta);
        })[0];
        // self event, and should be canceled
        if (sourceEvent && sourceEvent.should) {
            if (event.cancelable) event.preventDefault();
            return;
        }
        // outside or shard event
        if (!sourceEvent) {
            var shardNodes = (lastProps.current.shards || []).map($80f7d197b1699532$var$extractRef).filter(Boolean).filter(function(node) {
                return node.contains(event.target);
            });
            var shouldStop = shardNodes.length > 0 ? shouldCancelEvent(event, shardNodes[0]) : !lastProps.current.noIsolation;
            if (shouldStop) {
                if (event.cancelable) event.preventDefault();
            }
        }
    }, []);
    var shouldCancel = $LI8jA.useCallback(function(name, delta, target, should) {
        var event = {
            name: name,
            delta: delta,
            target: target,
            should: should
        };
        shouldPreventQueue.current.push(event);
        setTimeout(function() {
            shouldPreventQueue.current = shouldPreventQueue.current.filter(function(e) {
                return e !== event;
            });
        }, 1);
    }, []);
    var scrollTouchStart = $LI8jA.useCallback(function(event) {
        touchStartRef.current = $80f7d197b1699532$export$6e085704a79f4f56(event);
        activeAxis.current = undefined;
    }, []);
    var scrollWheel = $LI8jA.useCallback(function(event) {
        shouldCancel(event.type, $80f7d197b1699532$export$39efaa2ca254a28d(event), event.target, shouldCancelEvent(event, props.lockRef.current));
    }, []);
    var scrollTouchMove = $LI8jA.useCallback(function(event) {
        shouldCancel(event.type, $80f7d197b1699532$export$6e085704a79f4f56(event), event.target, shouldCancelEvent(event, props.lockRef.current));
    }, []);
    $LI8jA.useEffect(function() {
        $80f7d197b1699532$var$lockStack.push(Style);
        props.setCallbacks({
            onScrollCapture: scrollWheel,
            onWheelCapture: scrollWheel,
            onTouchMoveCapture: scrollTouchMove
        });
        document.addEventListener("wheel", shouldPrevent, (0, $ea39917b93ab753f$export$10a6e88623fa9454));
        document.addEventListener("touchmove", shouldPrevent, (0, $ea39917b93ab753f$export$10a6e88623fa9454));
        document.addEventListener("touchstart", scrollTouchStart, (0, $ea39917b93ab753f$export$10a6e88623fa9454));
        return function() {
            $80f7d197b1699532$var$lockStack = $80f7d197b1699532$var$lockStack.filter(function(inst) {
                return inst !== Style;
            });
            document.removeEventListener("wheel", shouldPrevent, (0, $ea39917b93ab753f$export$10a6e88623fa9454));
            document.removeEventListener("touchmove", shouldPrevent, (0, $ea39917b93ab753f$export$10a6e88623fa9454));
            document.removeEventListener("touchstart", scrollTouchStart, (0, $ea39917b93ab753f$export$10a6e88623fa9454));
        };
    }, []);
    var removeScrollBar = props.removeScrollBar, inert = props.inert;
    return $LI8jA.createElement($LI8jA.Fragment, null, inert ? $LI8jA.createElement(Style, {
        styles: $80f7d197b1699532$var$generateStyle(id)
    }) : null, removeScrollBar ? $LI8jA.createElement((0, $c848b47d45f50449$export$9aa43b459c5ae9b9), {
        gapMode: "margin"
    }) : null);
}



var $b58f0ee501b6635e$export$2e2bcd8739ae039 = (0, $8e1a9767feec45a3$export$6cacc8fb0a9b94ce)((0, $0dfb55f2b130e638$export$e27363444bedfeac), (0, $80f7d197b1699532$export$a09dbff87b5da2d));


var $82d0ba9afddcc0a1$var$ReactRemoveScroll = $LI8jA.forwardRef(function(props, ref) {
    return $LI8jA.createElement((0, $44a082588692de62$export$22940b497e769dee), (0, $aaf53e1f8378802e$export$18ce0697a983be9b)({}, props, {
        ref: ref,
        sideCar: (0, $b58f0ee501b6635e$export$2e2bcd8739ae039)
    }));
});
$82d0ba9afddcc0a1$var$ReactRemoveScroll.classNames = (0, $44a082588692de62$export$22940b497e769dee).classNames;
var $82d0ba9afddcc0a1$export$2e2bcd8739ae039 = $82d0ba9afddcc0a1$var$ReactRemoveScroll;


const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SELECTION_KEYS = [
    "Enter",
    " "
];
const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$FIRST_KEYS = [
    "ArrowDown",
    "PageUp",
    "Home"
];
const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$LAST_KEYS = [
    "ArrowUp",
    "PageDown",
    "End"
];
const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$FIRST_LAST_KEYS = [
    ...$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$FIRST_KEYS,
    ...$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$LAST_KEYS
];
const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_OPEN_KEYS = {
    ltr: [
        ...$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SELECTION_KEYS,
        "ArrowRight"
    ],
    rtl: [
        ...$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SELECTION_KEYS,
        "ArrowLeft"
    ]
};
const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_CLOSE_KEYS = {
    ltr: [
        "ArrowLeft"
    ],
    rtl: [
        "ArrowRight"
    ]
};
/* -------------------------------------------------------------------------------------------------
 * Menu
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MENU_NAME = "Menu";
const [$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$Collection, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useCollection, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$createCollectionScope] = (0, $38e2772b5a4e93fc$export$c74125a8e3af6bb2)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MENU_NAME);
const [$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$createMenuContext, $e731b17b2f6739b5$export$4027731b685e72eb] = (0, $ec3315292aa721d0$export$50c7b4e9d9f19c1)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MENU_NAME, [
    $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$createCollectionScope,
    (0, $576aaf0a88f44294$export$722aac194ae923),
    (0, $fafe9e85b41f374b$export$c7109489551a4f4)
]);
const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$usePopperScope = (0, $576aaf0a88f44294$export$722aac194ae923)();
const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useRovingFocusGroupScope = (0, $fafe9e85b41f374b$export$c7109489551a4f4)();
const [$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuProvider, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContext] = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$createMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MENU_NAME);
const [$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuRootProvider, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuRootContext] = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$createMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MENU_NAME);
const $e731b17b2f6739b5$export$d9b273488cd8ce6f = (props)=>{
    const { __scopeMenu: __scopeMenu , open: open = false , children: children , dir: dir , onOpenChange: onOpenChange , modal: modal = true  } = props;
    const popperScope = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$usePopperScope(__scopeMenu);
    const [content, setContent] = (0, $LI8jA.useState)(null);
    const isUsingKeyboardRef = (0, $LI8jA.useRef)(false);
    const handleOpenChange = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onOpenChange);
    const direction = (0, $842d1ddb67983cae$export$b39126d51d94e6f3)(dir);
    (0, $LI8jA.useEffect)(()=>{
        // Capture phase ensures we set the boolean before any side effects execute
        // in response to the key or pointer event as they might depend on this value.
        const handleKeyDown = ()=>{
            isUsingKeyboardRef.current = true;
            document.addEventListener("pointerdown", handlePointer, {
                capture: true,
                once: true
            });
            document.addEventListener("pointermove", handlePointer, {
                capture: true,
                once: true
            });
        };
        const handlePointer = ()=>isUsingKeyboardRef.current = false;
        document.addEventListener("keydown", handleKeyDown, {
            capture: true
        });
        return ()=>{
            document.removeEventListener("keydown", handleKeyDown, {
                capture: true
            });
            document.removeEventListener("pointerdown", handlePointer, {
                capture: true
            });
            document.removeEventListener("pointermove", handlePointer, {
                capture: true
            });
        };
    }, []);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $576aaf0a88f44294$export$be92b6f5f03c0fe9), popperScope, /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuProvider, {
        scope: __scopeMenu,
        open: open,
        onOpenChange: handleOpenChange,
        content: content,
        onContentChange: setContent
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuRootProvider, {
        scope: __scopeMenu,
        onClose: (0, $LI8jA.useCallback)(()=>handleOpenChange(false), [
            handleOpenChange
        ]),
        isUsingKeyboardRef: isUsingKeyboardRef,
        dir: direction,
        modal: modal
    }, children)));
};
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$d9b273488cd8ce6f, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MENU_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuAnchor
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ANCHOR_NAME = "MenuAnchor";
const $e731b17b2f6739b5$export$9fa5ebd18bee4d43 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeMenu: __scopeMenu , ...anchorProps } = props;
    const popperScope = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$usePopperScope(__scopeMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $576aaf0a88f44294$export$b688253958b8dfe7), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, popperScope, anchorProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$9fa5ebd18bee4d43, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ANCHOR_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuPortal
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$PORTAL_NAME = "MenuPortal";
const [$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$PortalProvider, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$usePortalContext] = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$createMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$PORTAL_NAME, {
    forceMount: undefined
});
const $e731b17b2f6739b5$export$793392f970497feb = (props)=>{
    const { __scopeMenu: __scopeMenu , forceMount: forceMount , children: children , container: container  } = props;
    const context = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$PORTAL_NAME, __scopeMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$PortalProvider, {
        scope: __scopeMenu,
        forceMount: forceMount
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $0ac33c7c3f86b9ab$export$99c2b779aa4e8b8b), {
        present: forceMount || context.open
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $726ec765805a08e3$export$602eac185826482c), {
        asChild: true,
        container: container
    }, children)));
};
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$793392f970497feb, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$PORTAL_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuContent
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME = "MenuContent";
const [$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuContentProvider, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContentContext] = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$createMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME);
const $e731b17b2f6739b5$export$479f0f2f71193efe = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const portalContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$usePortalContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME, props.__scopeMenu);
    const { forceMount: forceMount = portalContext.forceMount , ...contentProps } = props;
    const context = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME, props.__scopeMenu);
    const rootContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuRootContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME, props.__scopeMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$Collection.Provider, {
        scope: props.__scopeMenu
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $0ac33c7c3f86b9ab$export$99c2b779aa4e8b8b), {
        present: forceMount || context.open
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$Collection.Slot, {
        scope: props.__scopeMenu
    }, rootContext.modal ? /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuRootContentModal, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, contentProps, {
        ref: forwardedRef
    })) : /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuRootContentNonModal, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, contentProps, {
        ref: forwardedRef
    })))));
});
/* ---------------------------------------------------------------------------------------------- */ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuRootContentModal = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const context = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME, props.__scopeMenu);
    const ref = (0, $LI8jA.useRef)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, ref); // Hide everything from ARIA except the `MenuContent`
    (0, $LI8jA.useEffect)(()=>{
        const content = ref.current;
        if (content) return (0, $f51523d7bb101394$export$6e33d16126ed003c)(content);
    }, []);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuContentImpl, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, props, {
        ref: composedRefs // we make sure we're not trapping once it's been closed
        ,
        trapFocus: context.open // make sure to only disable pointer events when open
        ,
        disableOutsidePointerEvents: context.open,
        disableOutsideScroll: true // When focus is trapped, a `focusout` event may still happen.
        ,
        onFocusOutside: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onFocusOutside, (event)=>event.preventDefault(), {
            checkForDefaultPrevented: false
        }),
        onDismiss: ()=>context.onOpenChange(false)
    }));
});
const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuRootContentNonModal = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const context = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME, props.__scopeMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuContentImpl, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, props, {
        ref: forwardedRef,
        trapFocus: false,
        disableOutsidePointerEvents: false,
        disableOutsideScroll: false,
        onDismiss: ()=>context.onOpenChange(false)
    }));
});
/* ---------------------------------------------------------------------------------------------- */ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuContentImpl = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeMenu: __scopeMenu , loop: loop = false , trapFocus: trapFocus , onOpenAutoFocus: onOpenAutoFocus , onCloseAutoFocus: onCloseAutoFocus , disableOutsidePointerEvents: disableOutsidePointerEvents , onEntryFocus: onEntryFocus , onEscapeKeyDown: onEscapeKeyDown , onPointerDownOutside: onPointerDownOutside , onFocusOutside: onFocusOutside , onInteractOutside: onInteractOutside , onDismiss: onDismiss , disableOutsideScroll: disableOutsideScroll , ...contentProps } = props;
    const context = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME, __scopeMenu);
    const rootContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuRootContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME, __scopeMenu);
    const popperScope = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$usePopperScope(__scopeMenu);
    const rovingFocusGroupScope = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useRovingFocusGroupScope(__scopeMenu);
    const getItems = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useCollection(__scopeMenu);
    const [currentItemId, setCurrentItemId] = (0, $LI8jA.useState)(null);
    const contentRef = (0, $LI8jA.useRef)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, contentRef, context.onContentChange);
    const timerRef = (0, $LI8jA.useRef)(0);
    const searchRef = (0, $LI8jA.useRef)("");
    const pointerGraceTimerRef = (0, $LI8jA.useRef)(0);
    const pointerGraceIntentRef = (0, $LI8jA.useRef)(null);
    const pointerDirRef = (0, $LI8jA.useRef)("right");
    const lastPointerXRef = (0, $LI8jA.useRef)(0);
    const ScrollLockWrapper = disableOutsideScroll ? (0, $82d0ba9afddcc0a1$export$2e2bcd8739ae039) : (0, $LI8jA.Fragment);
    const scrollLockWrapperProps = disableOutsideScroll ? {
        as: (0, $db045af315cca07a$export$8c6ed5c666ac1360),
        allowPinchZoom: true
    } : undefined;
    const handleTypeaheadSearch = (key)=>{
        var _items$find, _items$find2;
        const search = searchRef.current + key;
        const items = getItems().filter((item)=>!item.disabled);
        const currentItem = document.activeElement;
        const currentMatch = (_items$find = items.find((item)=>item.ref.current === currentItem)) === null || _items$find === void 0 ? void 0 : _items$find.textValue;
        const values = items.map((item)=>item.textValue);
        const nextMatch = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$getNextMatch(values, search, currentMatch);
        const newItem = (_items$find2 = items.find((item)=>item.textValue === nextMatch)) === null || _items$find2 === void 0 ? void 0 : _items$find2.ref.current; // Reset `searchRef` 1 second after it was last updated
        (function updateSearch(value) {
            searchRef.current = value;
            window.clearTimeout(timerRef.current);
            if (value !== "") timerRef.current = window.setTimeout(()=>updateSearch(""), 1000);
        })(search);
        if (newItem) /**
       * Imperative focus during keydown is risky so we prevent React's batching updates
       * to avoid potential bugs. See: https://github.com/facebook/react/issues/20332
       */ setTimeout(()=>newItem.focus());
    };
    (0, $LI8jA.useEffect)(()=>{
        return ()=>window.clearTimeout(timerRef.current);
    }, []); // Make sure the whole tree has focus guards as our `MenuContent` may be
    // the last element in the DOM (beacuse of the `Portal`)
    (0, $a8797df59e287e29$export$b7ece24a22aeda8c)();
    const isPointerMovingToSubmenu = (0, $LI8jA.useCallback)((event)=>{
        var _pointerGraceIntentRe, _pointerGraceIntentRe2;
        const isMovingTowards = pointerDirRef.current === ((_pointerGraceIntentRe = pointerGraceIntentRef.current) === null || _pointerGraceIntentRe === void 0 ? void 0 : _pointerGraceIntentRe.side);
        return isMovingTowards && $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$isPointerInGraceArea(event, (_pointerGraceIntentRe2 = pointerGraceIntentRef.current) === null || _pointerGraceIntentRe2 === void 0 ? void 0 : _pointerGraceIntentRe2.area);
    }, []);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuContentProvider, {
        scope: __scopeMenu,
        searchRef: searchRef,
        onItemEnter: (0, $LI8jA.useCallback)((event)=>{
            if (isPointerMovingToSubmenu(event)) event.preventDefault();
        }, [
            isPointerMovingToSubmenu
        ]),
        onItemLeave: (0, $LI8jA.useCallback)((event)=>{
            var _contentRef$current;
            if (isPointerMovingToSubmenu(event)) return;
            (_contentRef$current = contentRef.current) === null || _contentRef$current === void 0 || _contentRef$current.focus();
            setCurrentItemId(null);
        }, [
            isPointerMovingToSubmenu
        ]),
        onTriggerLeave: (0, $LI8jA.useCallback)((event)=>{
            if (isPointerMovingToSubmenu(event)) event.preventDefault();
        }, [
            isPointerMovingToSubmenu
        ]),
        pointerGraceTimerRef: pointerGraceTimerRef,
        onPointerGraceIntentChange: (0, $LI8jA.useCallback)((intent)=>{
            pointerGraceIntentRef.current = intent;
        }, [])
    }, /*#__PURE__*/ (0, $LI8jA.createElement)(ScrollLockWrapper, scrollLockWrapperProps, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a69c668904a4ce70$export$20e40289641fbbb6), {
        asChild: true,
        trapped: trapFocus,
        onMountAutoFocus: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(onOpenAutoFocus, (event)=>{
            var _contentRef$current2;
            // when opening, explicitly focus the content area only and leave
            // `onEntryFocus` in  control of focusing first item
            event.preventDefault();
            (_contentRef$current2 = contentRef.current) === null || _contentRef$current2 === void 0 || _contentRef$current2.focus();
        }),
        onUnmountAutoFocus: onCloseAutoFocus
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a102e9b8e3188262$export$177fb62ff3ec1f22), {
        asChild: true,
        disableOutsidePointerEvents: disableOutsidePointerEvents,
        onEscapeKeyDown: onEscapeKeyDown,
        onPointerDownOutside: onPointerDownOutside,
        onFocusOutside: onFocusOutside,
        onInteractOutside: onInteractOutside,
        onDismiss: onDismiss
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $fafe9e85b41f374b$export$be92b6f5f03c0fe9), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        asChild: true
    }, rovingFocusGroupScope, {
        dir: rootContext.dir,
        orientation: "vertical",
        loop: loop,
        currentTabStopId: currentItemId,
        onCurrentTabStopIdChange: setCurrentItemId,
        onEntryFocus: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(onEntryFocus, (event)=>{
            // only focus first item when using keyboard
            if (!rootContext.isUsingKeyboardRef.current) event.preventDefault();
        })
    }), /*#__PURE__*/ (0, $LI8jA.createElement)((0, $576aaf0a88f44294$export$7c6e2c02157bb7d2), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        role: "menu",
        "aria-orientation": "vertical",
        "data-state": $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$getOpenState(context.open),
        "data-radix-menu-content": "",
        dir: rootContext.dir
    }, popperScope, contentProps, {
        ref: composedRefs,
        style: {
            outline: "none",
            ...contentProps.style
        },
        onKeyDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(contentProps.onKeyDown, (event)=>{
            // submenu key events bubble through portals. We only care about keys in this menu.
            const target = event.target;
            const isKeyDownInside = target.closest("[data-radix-menu-content]") === event.currentTarget;
            const isModifierKey = event.ctrlKey || event.altKey || event.metaKey;
            const isCharacterKey = event.key.length === 1;
            if (isKeyDownInside) {
                // menus should not be navigated using tab key so we prevent it
                if (event.key === "Tab") event.preventDefault();
                if (!isModifierKey && isCharacterKey) handleTypeaheadSearch(event.key);
            } // focus first/last item based on key pressed
            const content = contentRef.current;
            if (event.target !== content) return;
            if (!$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$FIRST_LAST_KEYS.includes(event.key)) return;
            event.preventDefault();
            const items = getItems().filter((item)=>!item.disabled);
            const candidateNodes = items.map((item)=>item.ref.current);
            if ($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$LAST_KEYS.includes(event.key)) candidateNodes.reverse();
            $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$focusFirst(candidateNodes);
        }),
        onBlur: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onBlur, (event)=>{
            // clear search buffer when leaving the menu
            if (!event.currentTarget.contains(event.target)) {
                window.clearTimeout(timerRef.current);
                searchRef.current = "";
            }
        }),
        onPointerMove: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerMove, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$whenMouse((event)=>{
            const target = event.target;
            const pointerXHasChanged = lastPointerXRef.current !== event.clientX; // We don't use `event.movementX` for this check because Safari will
            // always return `0` on a pointer event.
            if (event.currentTarget.contains(target) && pointerXHasChanged) {
                const newDir = event.clientX > lastPointerXRef.current ? "right" : "left";
                pointerDirRef.current = newDir;
                lastPointerXRef.current = event.clientX;
            }
        }))
    })))))));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$479f0f2f71193efe, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuGroup
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$GROUP_NAME = "MenuGroup";
const $e731b17b2f6739b5$export$22a631d1f72787bb = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeMenu: __scopeMenu , ...groupProps } = props;
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        role: "group"
    }, groupProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$22a631d1f72787bb, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$GROUP_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuLabel
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$LABEL_NAME = "MenuLabel";
const $e731b17b2f6739b5$export$dd37bec0e8a99143 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeMenu: __scopeMenu , ...labelProps } = props;
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, labelProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$dd37bec0e8a99143, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$LABEL_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuItem
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_NAME = "MenuItem";
const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_SELECT = "menu.itemSelect";
const $e731b17b2f6739b5$export$2ce376c2cc3355c8 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { disabled: disabled = false , onSelect: onSelect , ...itemProps } = props;
    const ref = (0, $LI8jA.useRef)(null);
    const rootContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuRootContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_NAME, props.__scopeMenu);
    const contentContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContentContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_NAME, props.__scopeMenu);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, ref);
    const isPointerDownRef = (0, $LI8jA.useRef)(false);
    const handleSelect = ()=>{
        const menuItem = ref.current;
        if (!disabled && menuItem) {
            const itemSelectEvent = new CustomEvent($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_SELECT, {
                bubbles: true,
                cancelable: true
            });
            menuItem.addEventListener($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_SELECT, (event)=>onSelect === null || onSelect === void 0 ? void 0 : onSelect(event), {
                once: true
            });
            (0, $a68e7d99b5d35ecf$export$6d1a0317bde7de7f)(menuItem, itemSelectEvent);
            if (itemSelectEvent.defaultPrevented) isPointerDownRef.current = false;
            else rootContext.onClose();
        }
    };
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuItemImpl, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, itemProps, {
        ref: composedRefs,
        disabled: disabled,
        onClick: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onClick, handleSelect),
        onPointerDown: (event)=>{
            var _props$onPointerDown;
            (_props$onPointerDown = props.onPointerDown) === null || _props$onPointerDown === void 0 || _props$onPointerDown.call(props, event);
            isPointerDownRef.current = true;
        },
        onPointerUp: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerUp, (event)=>{
            var _event$currentTarget;
            // Pointer down can move to a different menu item which should activate it on pointer up.
            // We dispatch a click for selection to allow composition with click based triggers and to
            // prevent Firefox from getting stuck in text selection mode when the menu closes.
            if (!isPointerDownRef.current) (_event$currentTarget = event.currentTarget) === null || _event$currentTarget === void 0 || _event$currentTarget.click();
        }),
        onKeyDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onKeyDown, (event)=>{
            const isTypingAhead = contentContext.searchRef.current !== "";
            if (disabled || isTypingAhead && event.key === " ") return;
            if ($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SELECTION_KEYS.includes(event.key)) {
                event.currentTarget.click();
                /**
         * We prevent default browser behaviour for selection keys as they should trigger
         * a selection only:
         * - prevents space from scrolling the page.
         * - if keydown causes focus to move, prevents keydown from firing on the new target.
         */ event.preventDefault();
            }
        })
    }));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$2ce376c2cc3355c8, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_NAME
});
/* ---------------------------------------------------------------------------------------------- */ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuItemImpl = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeMenu: __scopeMenu , disabled: disabled = false , textValue: textValue , ...itemProps } = props;
    const contentContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContentContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_NAME, __scopeMenu);
    const rovingFocusGroupScope = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useRovingFocusGroupScope(__scopeMenu);
    const ref = (0, $LI8jA.useRef)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, ref);
    const [isFocused, setIsFocused] = (0, $LI8jA.useState)(false); // get the item's `.textContent` as default strategy for typeahead `textValue`
    const [textContent, setTextContent] = (0, $LI8jA.useState)("");
    (0, $LI8jA.useEffect)(()=>{
        const menuItem = ref.current;
        if (menuItem) {
            var _menuItem$textContent;
            setTextContent(((_menuItem$textContent = menuItem.textContent) !== null && _menuItem$textContent !== void 0 ? _menuItem$textContent : "").trim());
        }
    }, [
        itemProps.children
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$Collection.ItemSlot, {
        scope: __scopeMenu,
        disabled: disabled,
        textValue: textValue !== null && textValue !== void 0 ? textValue : textContent
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $fafe9e85b41f374b$export$6d08773d2e66f8f2), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        asChild: true
    }, rovingFocusGroupScope, {
        focusable: !disabled
    }), /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        role: "menuitem",
        "data-highlighted": isFocused ? "" : undefined,
        "aria-disabled": disabled || undefined,
        "data-disabled": disabled ? "" : undefined
    }, itemProps, {
        ref: composedRefs,
        onPointerMove: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerMove, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$whenMouse((event)=>{
            if (disabled) contentContext.onItemLeave(event);
            else {
                contentContext.onItemEnter(event);
                if (!event.defaultPrevented) {
                    const item = event.currentTarget;
                    item.focus();
                }
            }
        })),
        onPointerLeave: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerLeave, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$whenMouse((event)=>contentContext.onItemLeave(event))),
        onFocus: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onFocus, ()=>setIsFocused(true)),
        onBlur: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onBlur, ()=>setIsFocused(false))
    }))));
});
/* -------------------------------------------------------------------------------------------------
 * MenuCheckboxItem
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CHECKBOX_ITEM_NAME = "MenuCheckboxItem";
const $e731b17b2f6739b5$export$f6f243521332502d = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { checked: checked = false , onCheckedChange: onCheckedChange , ...checkboxItemProps } = props;
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ItemIndicatorProvider, {
        scope: props.__scopeMenu,
        checked: checked
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$export$2ce376c2cc3355c8, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        role: "menuitemcheckbox",
        "aria-checked": $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$isIndeterminate(checked) ? "mixed" : checked
    }, checkboxItemProps, {
        ref: forwardedRef,
        "data-state": $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$getCheckedState(checked),
        onSelect: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(checkboxItemProps.onSelect, ()=>onCheckedChange === null || onCheckedChange === void 0 ? void 0 : onCheckedChange($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$isIndeterminate(checked) ? true : !checked), {
            checkForDefaultPrevented: false
        })
    })));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$f6f243521332502d, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CHECKBOX_ITEM_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuRadioGroup
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$RADIO_GROUP_NAME = "MenuRadioGroup";
const [$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$RadioGroupProvider, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useRadioGroupContext] = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$createMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$RADIO_GROUP_NAME, {
    value: undefined,
    onValueChange: ()=>{}
});
const $e731b17b2f6739b5$export$ea2200c9eee416b3 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { value: value , onValueChange: onValueChange , ...groupProps } = props;
    const handleValueChange = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onValueChange);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$RadioGroupProvider, {
        scope: props.__scopeMenu,
        value: value,
        onValueChange: handleValueChange
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$export$22a631d1f72787bb, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, groupProps, {
        ref: forwardedRef
    })));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$ea2200c9eee416b3, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$RADIO_GROUP_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuRadioItem
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$RADIO_ITEM_NAME = "MenuRadioItem";
const $e731b17b2f6739b5$export$69bd225e9817f6d0 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { value: value , ...radioItemProps } = props;
    const context = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useRadioGroupContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$RADIO_ITEM_NAME, props.__scopeMenu);
    const checked = value === context.value;
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ItemIndicatorProvider, {
        scope: props.__scopeMenu,
        checked: checked
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$export$2ce376c2cc3355c8, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        role: "menuitemradio",
        "aria-checked": checked
    }, radioItemProps, {
        ref: forwardedRef,
        "data-state": $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$getCheckedState(checked),
        onSelect: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(radioItemProps.onSelect, ()=>{
            var _context$onValueChang;
            return (_context$onValueChang = context.onValueChange) === null || _context$onValueChang === void 0 ? void 0 : _context$onValueChang.call(context, value);
        }, {
            checkForDefaultPrevented: false
        })
    })));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$69bd225e9817f6d0, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$RADIO_ITEM_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuItemIndicator
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_INDICATOR_NAME = "MenuItemIndicator";
const [$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ItemIndicatorProvider, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useItemIndicatorContext] = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$createMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_INDICATOR_NAME, {
    checked: false
});
const $e731b17b2f6739b5$export$a2593e23056970a3 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeMenu: __scopeMenu , forceMount: forceMount , ...itemIndicatorProps } = props;
    const indicatorContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useItemIndicatorContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_INDICATOR_NAME, __scopeMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $0ac33c7c3f86b9ab$export$99c2b779aa4e8b8b), {
        present: forceMount || $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$isIndeterminate(indicatorContext.checked) || indicatorContext.checked === true
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).span, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, itemIndicatorProps, {
        ref: forwardedRef,
        "data-state": $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$getCheckedState(indicatorContext.checked)
    })));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$a2593e23056970a3, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ITEM_INDICATOR_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuSeparator
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SEPARATOR_NAME = "MenuSeparator";
const $e731b17b2f6739b5$export$1cec7dcdd713e220 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeMenu: __scopeMenu , ...separatorProps } = props;
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        role: "separator",
        "aria-orientation": "horizontal"
    }, separatorProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$1cec7dcdd713e220, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SEPARATOR_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuArrow
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ARROW_NAME = "MenuArrow";
const $e731b17b2f6739b5$export$bcdda4773debf5fa = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeMenu: __scopeMenu , ...arrowProps } = props;
    const popperScope = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$usePopperScope(__scopeMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $576aaf0a88f44294$export$21b07c8f274aebd5), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, popperScope, arrowProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$bcdda4773debf5fa, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$ARROW_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuSub
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_NAME = "MenuSub";
const [$e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuSubProvider, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuSubContext] = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$createMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_NAME);
const $e731b17b2f6739b5$export$71bdb9d1e2909932 = (props)=>{
    const { __scopeMenu: __scopeMenu , children: children , open: open = false , onOpenChange: onOpenChange  } = props;
    const parentMenuContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_NAME, __scopeMenu);
    const popperScope = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$usePopperScope(__scopeMenu);
    const [trigger, setTrigger] = (0, $LI8jA.useState)(null);
    const [content, setContent] = (0, $LI8jA.useState)(null);
    const handleOpenChange = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(onOpenChange); // Prevent the parent menu from reopening with open submenus.
    (0, $LI8jA.useEffect)(()=>{
        if (parentMenuContext.open === false) handleOpenChange(false);
        return ()=>handleOpenChange(false);
    }, [
        parentMenuContext.open,
        handleOpenChange
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $576aaf0a88f44294$export$be92b6f5f03c0fe9), popperScope, /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuProvider, {
        scope: __scopeMenu,
        open: open,
        onOpenChange: handleOpenChange,
        content: content,
        onContentChange: setContent
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuSubProvider, {
        scope: __scopeMenu,
        contentId: (0, $d4070564f9335f17$export$f680877a34711e37)(),
        triggerId: (0, $d4070564f9335f17$export$f680877a34711e37)(),
        trigger: trigger,
        onTriggerChange: setTrigger
    }, children)));
};
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$71bdb9d1e2909932, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuSubTrigger
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_TRIGGER_NAME = "MenuSubTrigger";
const $e731b17b2f6739b5$export$5fbbb3ba7297405f = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const context = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_TRIGGER_NAME, props.__scopeMenu);
    const rootContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuRootContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_TRIGGER_NAME, props.__scopeMenu);
    const subContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuSubContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_TRIGGER_NAME, props.__scopeMenu);
    const contentContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContentContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_TRIGGER_NAME, props.__scopeMenu);
    const openTimerRef = (0, $LI8jA.useRef)(null);
    const { pointerGraceTimerRef: pointerGraceTimerRef , onPointerGraceIntentChange: onPointerGraceIntentChange  } = contentContext;
    const scope = {
        __scopeMenu: props.__scopeMenu
    };
    const clearOpenTimer = (0, $LI8jA.useCallback)(()=>{
        if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
    }, []);
    (0, $LI8jA.useEffect)(()=>clearOpenTimer, [
        clearOpenTimer
    ]);
    (0, $LI8jA.useEffect)(()=>{
        const pointerGraceTimer = pointerGraceTimerRef.current;
        return ()=>{
            window.clearTimeout(pointerGraceTimer);
            onPointerGraceIntentChange(null);
        };
    }, [
        pointerGraceTimerRef,
        onPointerGraceIntentChange
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$export$9fa5ebd18bee4d43, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        asChild: true
    }, scope), /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuItemImpl, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        id: subContext.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": context.open,
        "aria-controls": subContext.contentId,
        "data-state": $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$getOpenState(context.open)
    }, props, {
        ref: (0, $7ec60ad3718be6bb$export$43e446d32b3d21af)(forwardedRef, subContext.onTriggerChange) // This is redundant for mouse users but we cannot determine pointer type from
        ,
        onClick: (event)=>{
            var _props$onClick;
            (_props$onClick = props.onClick) === null || _props$onClick === void 0 || _props$onClick.call(props, event);
            if (props.disabled || event.defaultPrevented) return;
            /**
       * We manually focus because iOS Safari doesn't always focus on click (e.g. buttons)
       * and we rely heavily on `onFocusOutside` for submenus to close when switching
       * between separate submenus.
       */ event.currentTarget.focus();
            if (!context.open) context.onOpenChange(true);
        },
        onPointerMove: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerMove, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$whenMouse((event)=>{
            contentContext.onItemEnter(event);
            if (event.defaultPrevented) return;
            if (!props.disabled && !context.open && !openTimerRef.current) {
                contentContext.onPointerGraceIntentChange(null);
                openTimerRef.current = window.setTimeout(()=>{
                    context.onOpenChange(true);
                    clearOpenTimer();
                }, 100);
            }
        })),
        onPointerLeave: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerLeave, $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$whenMouse((event)=>{
            var _context$content;
            clearOpenTimer();
            const contentRect = (_context$content = context.content) === null || _context$content === void 0 ? void 0 : _context$content.getBoundingClientRect();
            if (contentRect) {
                var _context$content2;
                // TODO: make sure to update this when we change positioning logic
                const side = (_context$content2 = context.content) === null || _context$content2 === void 0 ? void 0 : _context$content2.dataset.side;
                const rightSide = side === "right";
                const bleed = rightSide ? -5 : 5;
                const contentNearEdge = contentRect[rightSide ? "left" : "right"];
                const contentFarEdge = contentRect[rightSide ? "right" : "left"];
                contentContext.onPointerGraceIntentChange({
                    area: [
                        // consistently within polygon bounds
                        {
                            x: event.clientX + bleed,
                            y: event.clientY
                        },
                        {
                            x: contentNearEdge,
                            y: contentRect.top
                        },
                        {
                            x: contentFarEdge,
                            y: contentRect.top
                        },
                        {
                            x: contentFarEdge,
                            y: contentRect.bottom
                        },
                        {
                            x: contentNearEdge,
                            y: contentRect.bottom
                        }
                    ],
                    side: side
                });
                window.clearTimeout(pointerGraceTimerRef.current);
                pointerGraceTimerRef.current = window.setTimeout(()=>contentContext.onPointerGraceIntentChange(null), 300);
            } else {
                contentContext.onTriggerLeave(event);
                if (event.defaultPrevented) return; // There's 100ms where the user may leave an item before the submenu was opened.
                contentContext.onPointerGraceIntentChange(null);
            }
        })),
        onKeyDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onKeyDown, (event)=>{
            const isTypingAhead = contentContext.searchRef.current !== "";
            if (props.disabled || isTypingAhead && event.key === " ") return;
            if ($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_OPEN_KEYS[rootContext.dir].includes(event.key)) {
                var _context$content3;
                context.onOpenChange(true); // The trigger may hold focus if opened via pointer interaction
                // so we ensure content is given focus again when switching to keyboard.
                (_context$content3 = context.content) === null || _context$content3 === void 0 || _context$content3.focus(); // prevent window from scrolling
                event.preventDefault();
            }
        })
    })));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$5fbbb3ba7297405f, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_TRIGGER_NAME
});
/* -------------------------------------------------------------------------------------------------
 * MenuSubContent
 * -----------------------------------------------------------------------------------------------*/ const $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_CONTENT_NAME = "MenuSubContent";
const $e731b17b2f6739b5$export$e7142ab31822bde6 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const portalContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$usePortalContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME, props.__scopeMenu);
    const { forceMount: forceMount = portalContext.forceMount , ...subContentProps } = props;
    const context = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME, props.__scopeMenu);
    const rootContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuRootContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$CONTENT_NAME, props.__scopeMenu);
    const subContext = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$useMenuSubContext($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_CONTENT_NAME, props.__scopeMenu);
    const ref = (0, $LI8jA.useRef)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, ref);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$Collection.Provider, {
        scope: props.__scopeMenu
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $0ac33c7c3f86b9ab$export$99c2b779aa4e8b8b), {
        present: forceMount || context.open
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$Collection.Slot, {
        scope: props.__scopeMenu
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($e731b17b2f6739b5$var$$6cc32821e9371a1c$var$MenuContentImpl, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        id: subContext.contentId,
        "aria-labelledby": subContext.triggerId
    }, subContentProps, {
        ref: composedRefs,
        align: "start",
        side: rootContext.dir === "rtl" ? "left" : "right",
        disableOutsidePointerEvents: false,
        disableOutsideScroll: false,
        trapFocus: false,
        onOpenAutoFocus: (event)=>{
            var _ref$current;
            // when opening a submenu, focus content for keyboard users only
            if (rootContext.isUsingKeyboardRef.current) (_ref$current = ref.current) === null || _ref$current === void 0 || _ref$current.focus();
            event.preventDefault();
        } // The menu might close because of focusing another menu item in the parent menu. We
        ,
        onCloseAutoFocus: (event)=>event.preventDefault(),
        onFocusOutside: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onFocusOutside, (event)=>{
            // We prevent closing when the trigger is focused to avoid triggering a re-open animation
            // on pointer interaction.
            if (event.target !== subContext.trigger) context.onOpenChange(false);
        }),
        onEscapeKeyDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onEscapeKeyDown, (event)=>{
            rootContext.onClose(); // ensure pressing escape in submenu doesn't escape full screen mode
            event.preventDefault();
        }),
        onKeyDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onKeyDown, (event)=>{
            // Submenu key events bubble through portals. We only care about keys in this menu.
            const isKeyDownInside = event.currentTarget.contains(event.target);
            const isCloseKey = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_CLOSE_KEYS[rootContext.dir].includes(event.key);
            if (isKeyDownInside && isCloseKey) {
                var _subContext$trigger;
                context.onOpenChange(false); // We focus manually because we prevented it in `onCloseAutoFocus`
                (_subContext$trigger = subContext.trigger) === null || _subContext$trigger === void 0 || _subContext$trigger.focus(); // prevent window from scrolling
                event.preventDefault();
            }
        })
    })))));
});
/*#__PURE__*/ Object.assign($e731b17b2f6739b5$export$e7142ab31822bde6, {
    displayName: $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$SUB_CONTENT_NAME
});
/* -----------------------------------------------------------------------------------------------*/ function $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$getOpenState(open) {
    return open ? "open" : "closed";
}
function $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$isIndeterminate(checked) {
    return checked === "indeterminate";
}
function $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$getCheckedState(checked) {
    return $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$isIndeterminate(checked) ? "indeterminate" : checked ? "checked" : "unchecked";
}
function $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$focusFirst(candidates) {
    const PREVIOUSLY_FOCUSED_ELEMENT = document.activeElement;
    for (const candidate of candidates){
        // if focus is already where we want to go, we don't want to keep going through the candidates
        if (candidate === PREVIOUSLY_FOCUSED_ELEMENT) return;
        candidate.focus();
        if (document.activeElement !== PREVIOUSLY_FOCUSED_ELEMENT) return;
    }
}
/**
 * Wraps an array around itself at a given start index
 * Example: `wrapArray(['a', 'b', 'c', 'd'], 2) === ['c', 'd', 'a', 'b']`
 */ function $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$wrapArray(array, startIndex) {
    return array.map((_, index)=>array[(startIndex + index) % array.length]);
}
/**
 * This is the "meat" of the typeahead matching logic. It takes in all the values,
 * the search and the current match, and returns the next match (or `undefined`).
 *
 * We normalize the search because if a user has repeatedly pressed a character,
 * we want the exact same behavior as if we only had that one character
 * (ie. cycle through options starting with that character)
 *
 * We also reorder the values by wrapping the array around the current match.
 * This is so we always look forward from the current match, and picking the first
 * match will always be the correct one.
 *
 * Finally, if the normalized search is exactly one character, we exclude the
 * current match from the values because otherwise it would be the first to match always
 * and focus would never move. This is as opposed to the regular case, where we
 * don't want focus to move if the current match still matches.
 */ function $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$getNextMatch(values, search, currentMatch) {
    const isRepeated = search.length > 1 && Array.from(search).every((char)=>char === search[0]);
    const normalizedSearch = isRepeated ? search[0] : search;
    const currentMatchIndex = currentMatch ? values.indexOf(currentMatch) : -1;
    let wrappedValues = $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$wrapArray(values, Math.max(currentMatchIndex, 0));
    const excludeCurrentMatch = normalizedSearch.length === 1;
    if (excludeCurrentMatch) wrappedValues = wrappedValues.filter((v)=>v !== currentMatch);
    const nextMatch = wrappedValues.find((value)=>value.toLowerCase().startsWith(normalizedSearch.toLowerCase()));
    return nextMatch !== currentMatch ? nextMatch : undefined;
}
// Determine if a point is inside of a polygon.
// Based on https://github.com/substack/point-in-polygon
function $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$isPointInPolygon(point, polygon) {
    const { x: x , y: y  } = point;
    let inside = false;
    for(let i = 0, j = polygon.length - 1; i < polygon.length; j = i++){
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y; // prettier-ignore
        const intersect = yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}
function $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$isPointerInGraceArea(event, area) {
    if (!area) return false;
    const cursorPos = {
        x: event.clientX,
        y: event.clientY
    };
    return $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$isPointInPolygon(cursorPos, area);
}
function $e731b17b2f6739b5$var$$6cc32821e9371a1c$var$whenMouse(handler) {
    return (event)=>event.pointerType === "mouse" ? handler(event) : undefined;
}
const $e731b17b2f6739b5$export$be92b6f5f03c0fe9 = $e731b17b2f6739b5$export$d9b273488cd8ce6f;
const $e731b17b2f6739b5$export$b688253958b8dfe7 = $e731b17b2f6739b5$export$9fa5ebd18bee4d43;
const $e731b17b2f6739b5$export$602eac185826482c = $e731b17b2f6739b5$export$793392f970497feb;
const $e731b17b2f6739b5$export$7c6e2c02157bb7d2 = $e731b17b2f6739b5$export$479f0f2f71193efe;
const $e731b17b2f6739b5$export$eb2fcfdbd7ba97d4 = $e731b17b2f6739b5$export$22a631d1f72787bb;
const $e731b17b2f6739b5$export$b04be29aa201d4f5 = $e731b17b2f6739b5$export$dd37bec0e8a99143;
const $e731b17b2f6739b5$export$6d08773d2e66f8f2 = $e731b17b2f6739b5$export$2ce376c2cc3355c8;
const $e731b17b2f6739b5$export$16ce288f89fa631c = $e731b17b2f6739b5$export$f6f243521332502d;
const $e731b17b2f6739b5$export$a98f0dcb43a68a25 = $e731b17b2f6739b5$export$ea2200c9eee416b3;
const $e731b17b2f6739b5$export$371ab307eab489c0 = $e731b17b2f6739b5$export$69bd225e9817f6d0;
const $e731b17b2f6739b5$export$c3468e2714d175fa = $e731b17b2f6739b5$export$a2593e23056970a3;
const $e731b17b2f6739b5$export$1ff3c3f08ae963c0 = $e731b17b2f6739b5$export$1cec7dcdd713e220;
const $e731b17b2f6739b5$export$21b07c8f274aebd5 = $e731b17b2f6739b5$export$bcdda4773debf5fa;
const $e731b17b2f6739b5$export$d7a01e11500dfb6f = $e731b17b2f6739b5$export$71bdb9d1e2909932;
const $e731b17b2f6739b5$export$2ea8a7a591ac5eac = $e731b17b2f6739b5$export$5fbbb3ba7297405f;
const $e731b17b2f6739b5$export$6d4de93b380beddf = $e731b17b2f6739b5$export$e7142ab31822bde6;



/* -------------------------------------------------------------------------------------------------
 * DropdownMenu
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$DROPDOWN_MENU_NAME = "DropdownMenu";
const [$8ee26aadc71e1073$var$$d08ef79370b62062$var$createDropdownMenuContext, $8ee26aadc71e1073$export$c0623cd925aeb687] = (0, $ec3315292aa721d0$export$50c7b4e9d9f19c1)($8ee26aadc71e1073$var$$d08ef79370b62062$var$DROPDOWN_MENU_NAME, [
    (0, $e731b17b2f6739b5$export$4027731b685e72eb)
]);
const $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope = (0, $e731b17b2f6739b5$export$4027731b685e72eb)();
const [$8ee26aadc71e1073$var$$d08ef79370b62062$var$DropdownMenuProvider, $8ee26aadc71e1073$var$$d08ef79370b62062$var$useDropdownMenuContext] = $8ee26aadc71e1073$var$$d08ef79370b62062$var$createDropdownMenuContext($8ee26aadc71e1073$var$$d08ef79370b62062$var$DROPDOWN_MENU_NAME);
const $8ee26aadc71e1073$export$e44a253a59704894 = (props)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , children: children , dir: dir , open: openProp , defaultOpen: defaultOpen , onOpenChange: onOpenChange , modal: modal = true  } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    const triggerRef = (0, $LI8jA.useRef)(null);
    const [open = false, setOpen] = (0, $f4c632903130edee$export$6f32135080cb4c3)({
        prop: openProp,
        defaultProp: defaultOpen,
        onChange: onOpenChange
    });
    return /*#__PURE__*/ (0, $LI8jA.createElement)($8ee26aadc71e1073$var$$d08ef79370b62062$var$DropdownMenuProvider, {
        scope: __scopeDropdownMenu,
        triggerId: (0, $d4070564f9335f17$export$f680877a34711e37)(),
        triggerRef: triggerRef,
        contentId: (0, $d4070564f9335f17$export$f680877a34711e37)(),
        open: open,
        onOpenChange: setOpen,
        onOpenToggle: (0, $LI8jA.useCallback)(()=>setOpen((prevOpen)=>!prevOpen), [
            setOpen
        ]),
        modal: modal
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$be92b6f5f03c0fe9), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, {
        open: open,
        onOpenChange: setOpen,
        dir: dir,
        modal: modal
    }), children));
};
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$e44a253a59704894, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$DROPDOWN_MENU_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuTrigger
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$TRIGGER_NAME = "DropdownMenuTrigger";
const $8ee26aadc71e1073$export$d2469213b3befba9 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , disabled: disabled = false , ...triggerProps } = props;
    const context = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useDropdownMenuContext($8ee26aadc71e1073$var$$d08ef79370b62062$var$TRIGGER_NAME, __scopeDropdownMenu);
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$b688253958b8dfe7), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        asChild: true
    }, menuScope), /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).button, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        type: "button",
        id: context.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": context.open,
        "aria-controls": context.open ? context.contentId : undefined,
        "data-state": context.open ? "open" : "closed",
        "data-disabled": disabled ? "" : undefined,
        disabled: disabled
    }, triggerProps, {
        ref: (0, $7ec60ad3718be6bb$export$43e446d32b3d21af)(forwardedRef, context.triggerRef),
        onPointerDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerDown, (event)=>{
            // only call handler if it's the left button (mousedown gets triggered by all mouse buttons)
            // but not when the control key is pressed (avoiding MacOS right click)
            if (!disabled && event.button === 0 && event.ctrlKey === false) {
                context.onOpenToggle(); // prevent trigger focusing when opening
                // this allows the content to be given focus without competition
                if (!context.open) event.preventDefault();
            }
        }),
        onKeyDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onKeyDown, (event)=>{
            if (disabled) return;
            if ([
                "Enter",
                " "
            ].includes(event.key)) context.onOpenToggle();
            if (event.key === "ArrowDown") context.onOpenChange(true); // prevent keydown from scrolling window / first focused item to execute
            // that keydown (inadvertently closing the menu)
            if ([
                "Enter",
                " ",
                "ArrowDown"
            ].includes(event.key)) event.preventDefault();
        })
    })));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$d2469213b3befba9, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$TRIGGER_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuPortal
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$PORTAL_NAME = "DropdownMenuPortal";
const $8ee26aadc71e1073$export$cd369b4d4d54efc9 = (props)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...portalProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$602eac185826482c), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, portalProps));
};
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$cd369b4d4d54efc9, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$PORTAL_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuContent
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$CONTENT_NAME = "DropdownMenuContent";
const $8ee26aadc71e1073$export$6e76d93a37c01248 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...contentProps } = props;
    const context = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useDropdownMenuContext($8ee26aadc71e1073$var$$d08ef79370b62062$var$CONTENT_NAME, __scopeDropdownMenu);
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    const hasInteractedOutsideRef = (0, $LI8jA.useRef)(false);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$7c6e2c02157bb7d2), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        id: context.contentId,
        "aria-labelledby": context.triggerId
    }, menuScope, contentProps, {
        ref: forwardedRef,
        onCloseAutoFocus: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onCloseAutoFocus, (event)=>{
            var _context$triggerRef$c;
            if (!hasInteractedOutsideRef.current) (_context$triggerRef$c = context.triggerRef.current) === null || _context$triggerRef$c === void 0 || _context$triggerRef$c.focus();
            hasInteractedOutsideRef.current = false; // Always prevent auto focus because we either focus manually or want user agent focus
            event.preventDefault();
        }),
        onInteractOutside: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onInteractOutside, (event)=>{
            const originalEvent = event.detail.originalEvent;
            const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
            const isRightClick = originalEvent.button === 2 || ctrlLeftClick;
            if (!context.modal || isRightClick) hasInteractedOutsideRef.current = true;
        }),
        style: {
            ...props.style,
            "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
            "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
            "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
            "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
            "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
        }
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$6e76d93a37c01248, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$CONTENT_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuGroup
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$GROUP_NAME = "DropdownMenuGroup";
const $8ee26aadc71e1073$export$246bebaba3a2f70e = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...groupProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$eb2fcfdbd7ba97d4), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, groupProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$246bebaba3a2f70e, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$GROUP_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuLabel
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$LABEL_NAME = "DropdownMenuLabel";
const $8ee26aadc71e1073$export$76e48c5b57f24495 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...labelProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$b04be29aa201d4f5), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, labelProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$76e48c5b57f24495, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$LABEL_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuItem
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$ITEM_NAME = "DropdownMenuItem";
const $8ee26aadc71e1073$export$ed97964d1871885d = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...itemProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$6d08773d2e66f8f2), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, itemProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$ed97964d1871885d, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$ITEM_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuCheckboxItem
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$CHECKBOX_ITEM_NAME = "DropdownMenuCheckboxItem";
const $8ee26aadc71e1073$export$53a69729da201fa9 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...checkboxItemProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$16ce288f89fa631c), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, checkboxItemProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$53a69729da201fa9, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$CHECKBOX_ITEM_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuRadioGroup
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$RADIO_GROUP_NAME = "DropdownMenuRadioGroup";
const $8ee26aadc71e1073$export$3323ad73d55f587e = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...radioGroupProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$a98f0dcb43a68a25), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, radioGroupProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$3323ad73d55f587e, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$RADIO_GROUP_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuRadioItem
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$RADIO_ITEM_NAME = "DropdownMenuRadioItem";
const $8ee26aadc71e1073$export$e4f69b41b1637536 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...radioItemProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$371ab307eab489c0), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, radioItemProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$e4f69b41b1637536, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$RADIO_ITEM_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuItemIndicator
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$INDICATOR_NAME = "DropdownMenuItemIndicator";
const $8ee26aadc71e1073$export$42355ae145153fb6 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...itemIndicatorProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$c3468e2714d175fa), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, itemIndicatorProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$42355ae145153fb6, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$INDICATOR_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSeparator
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$SEPARATOR_NAME = "DropdownMenuSeparator";
const $8ee26aadc71e1073$export$da160178fd3bc7e9 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...separatorProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$1ff3c3f08ae963c0), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, separatorProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$da160178fd3bc7e9, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$SEPARATOR_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuArrow
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$ARROW_NAME = "DropdownMenuArrow";
const $8ee26aadc71e1073$export$34b8980744021ec5 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...arrowProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$21b07c8f274aebd5), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, arrowProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$34b8980744021ec5, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$ARROW_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSub
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$export$2f307d81a64f5442 = (props)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , children: children , open: openProp , onOpenChange: onOpenChange , defaultOpen: defaultOpen  } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    const [open = false, setOpen] = (0, $f4c632903130edee$export$6f32135080cb4c3)({
        prop: openProp,
        defaultProp: defaultOpen,
        onChange: onOpenChange
    });
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$d7a01e11500dfb6f), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, {
        open: open,
        onOpenChange: setOpen
    }), children);
};
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubTrigger
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$SUB_TRIGGER_NAME = "DropdownMenuSubTrigger";
const $8ee26aadc71e1073$export$21dcb7ec56f874cf = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...subTriggerProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$2ea8a7a591ac5eac), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, subTriggerProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$21dcb7ec56f874cf, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$SUB_TRIGGER_NAME
});
/* -------------------------------------------------------------------------------------------------
 * DropdownMenuSubContent
 * -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$var$$d08ef79370b62062$var$SUB_CONTENT_NAME = "DropdownMenuSubContent";
const $8ee26aadc71e1073$export$f34ec8bc2482cc5f = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeDropdownMenu: __scopeDropdownMenu , ...subContentProps } = props;
    const menuScope = $8ee26aadc71e1073$var$$d08ef79370b62062$var$useMenuScope(__scopeDropdownMenu);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $e731b17b2f6739b5$export$6d4de93b380beddf), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, menuScope, subContentProps, {
        ref: forwardedRef,
        style: {
            ...props.style,
            "--radix-dropdown-menu-content-transform-origin": "var(--radix-popper-transform-origin)",
            "--radix-dropdown-menu-content-available-width": "var(--radix-popper-available-width)",
            "--radix-dropdown-menu-content-available-height": "var(--radix-popper-available-height)",
            "--radix-dropdown-menu-trigger-width": "var(--radix-popper-anchor-width)",
            "--radix-dropdown-menu-trigger-height": "var(--radix-popper-anchor-height)"
        }
    }));
});
/*#__PURE__*/ Object.assign($8ee26aadc71e1073$export$f34ec8bc2482cc5f, {
    displayName: $8ee26aadc71e1073$var$$d08ef79370b62062$var$SUB_CONTENT_NAME
});
/* -----------------------------------------------------------------------------------------------*/ const $8ee26aadc71e1073$export$be92b6f5f03c0fe9 = $8ee26aadc71e1073$export$e44a253a59704894;
const $8ee26aadc71e1073$export$41fb9f06171c75f4 = $8ee26aadc71e1073$export$d2469213b3befba9;
const $8ee26aadc71e1073$export$602eac185826482c = $8ee26aadc71e1073$export$cd369b4d4d54efc9;
const $8ee26aadc71e1073$export$7c6e2c02157bb7d2 = $8ee26aadc71e1073$export$6e76d93a37c01248;
const $8ee26aadc71e1073$export$eb2fcfdbd7ba97d4 = $8ee26aadc71e1073$export$246bebaba3a2f70e;
const $8ee26aadc71e1073$export$b04be29aa201d4f5 = $8ee26aadc71e1073$export$76e48c5b57f24495;
const $8ee26aadc71e1073$export$6d08773d2e66f8f2 = $8ee26aadc71e1073$export$ed97964d1871885d;
const $8ee26aadc71e1073$export$16ce288f89fa631c = $8ee26aadc71e1073$export$53a69729da201fa9;
const $8ee26aadc71e1073$export$a98f0dcb43a68a25 = $8ee26aadc71e1073$export$3323ad73d55f587e;
const $8ee26aadc71e1073$export$371ab307eab489c0 = $8ee26aadc71e1073$export$e4f69b41b1637536;
const $8ee26aadc71e1073$export$c3468e2714d175fa = $8ee26aadc71e1073$export$42355ae145153fb6;
const $8ee26aadc71e1073$export$1ff3c3f08ae963c0 = $8ee26aadc71e1073$export$da160178fd3bc7e9;
const $8ee26aadc71e1073$export$21b07c8f274aebd5 = $8ee26aadc71e1073$export$34b8980744021ec5;
const $8ee26aadc71e1073$export$d7a01e11500dfb6f = $8ee26aadc71e1073$export$2f307d81a64f5442;
const $8ee26aadc71e1073$export$2ea8a7a591ac5eac = $8ee26aadc71e1073$export$21dcb7ec56f874cf;
const $8ee26aadc71e1073$export$6d4de93b380beddf = $8ee26aadc71e1073$export$f34ec8bc2482cc5f;


/**
 * lucide-react v0.292.0 - ISC
 */ /**
 * lucide-react v0.292.0 - ISC
 */ 
var $LI8jA = parcelRequire("LI8jA");
/**
 * lucide-react v0.292.0 - ISC
 */ var $af15378475ba7368$export$2e2bcd8739ae039 = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round"
};


const $149557adc85d935d$export$73bda83cddbc7187 = (string)=>string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const $149557adc85d935d$export$2e2bcd8739ae039 = (iconName, iconNode)=>{
    const Component = (0, $LI8jA.forwardRef)(({ color: color = "currentColor" , size: size = 24 , strokeWidth: strokeWidth = 2 , absoluteStrokeWidth: absoluteStrokeWidth , children: children , ...rest }, ref)=>(0, $LI8jA.createElement)("svg", {
            ref: ref,
            ...(0, $af15378475ba7368$export$2e2bcd8739ae039),
            width: size,
            height: size,
            stroke: color,
            strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
            className: `lucide lucide-${$149557adc85d935d$export$73bda83cddbc7187(iconName)}`,
            ...rest
        }, [
            ...iconNode.map(([tag, attrs])=>(0, $LI8jA.createElement)(tag, attrs)),
            ...(Array.isArray(children) ? children : [
                children
            ]) || []
        ]));
    Component.displayName = `${iconName}`;
    return Component;
};


const $40c0f661ec418351$export$2e2bcd8739ae039 = (0, $149557adc85d935d$export$2e2bcd8739ae039)("Check", [
    [
        "path",
        {
            d: "M20 6 9 17l-5-5",
            key: "1gmf2c"
        }
    ]
]);

/**
 * lucide-react v0.292.0 - ISC
 */ 
const $128d882bc0fdb62f$export$2e2bcd8739ae039 = (0, $149557adc85d935d$export$2e2bcd8739ae039)("ChevronRight", [
    [
        "path",
        {
            d: "m9 18 6-6-6-6",
            key: "mthhwq"
        }
    ]
]);

/**
 * lucide-react v0.292.0 - ISC
 */ 
const $f4de4372d9dbc0ac$export$2e2bcd8739ae039 = (0, $149557adc85d935d$export$2e2bcd8739ae039)("Circle", [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ]
]);



const $4007f737badecf3c$export$e44a253a59704894 = $8ee26aadc71e1073$export$be92b6f5f03c0fe9;
const $4007f737badecf3c$export$d2469213b3befba9 = $8ee26aadc71e1073$export$41fb9f06171c75f4;
const $4007f737badecf3c$export$246bebaba3a2f70e = $8ee26aadc71e1073$export$eb2fcfdbd7ba97d4;
const $4007f737badecf3c$export$cd369b4d4d54efc9 = $8ee26aadc71e1073$export$602eac185826482c;
const $4007f737badecf3c$export$2f307d81a64f5442 = $8ee26aadc71e1073$export$d7a01e11500dfb6f;
const $4007f737badecf3c$export$3323ad73d55f587e = $8ee26aadc71e1073$export$a98f0dcb43a68a25;
const $4007f737badecf3c$export$21dcb7ec56f874cf = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , inset: inset , children: children , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsxs)($8ee26aadc71e1073$export$2ea8a7a591ac5eac, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__dropdown-menu-sub-trigger", "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent", inset && "pl-8", className),
        ...props,
        children: [
            children,
            /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $128d882bc0fdb62f$export$2e2bcd8739ae039), {
                className: "ml-auto h-4 w-4"
            })
        ]
    }));
$4007f737badecf3c$export$21dcb7ec56f874cf.displayName = $8ee26aadc71e1073$export$2ea8a7a591ac5eac.displayName;
const $4007f737badecf3c$export$f34ec8bc2482cc5f = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($8ee26aadc71e1073$export$6d4de93b380beddf, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__dropdown-menu-sub-content", "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
        ...props
    }));
$4007f737badecf3c$export$f34ec8bc2482cc5f.displayName = $8ee26aadc71e1073$export$6d4de93b380beddf.displayName;
const $4007f737badecf3c$export$6e76d93a37c01248 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , sideOffset: sideOffset = 4 , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($8ee26aadc71e1073$export$602eac185826482c, {
        children: /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($8ee26aadc71e1073$export$7c6e2c02157bb7d2, {
            ref: ref,
            sideOffset: sideOffset,
            className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__dropdown-menu-content", "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className),
            ...props
        })
    }));
$4007f737badecf3c$export$6e76d93a37c01248.displayName = $8ee26aadc71e1073$export$7c6e2c02157bb7d2.displayName;
const $4007f737badecf3c$export$ed97964d1871885d = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , inset: inset , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($8ee26aadc71e1073$export$6d08773d2e66f8f2, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__dropdown-menu-item", "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", inset && "pl-8", className),
        ...props
    }));
$4007f737badecf3c$export$ed97964d1871885d.displayName = $8ee26aadc71e1073$export$6d08773d2e66f8f2.displayName;
const $4007f737badecf3c$export$53a69729da201fa9 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , children: children , checked: checked , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsxs)($8ee26aadc71e1073$export$16ce288f89fa631c, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__dropdown-menu-checkbox-item", "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
        checked: checked,
        ...props,
        children: [
            /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($8ee26aadc71e1073$export$c3468e2714d175fa, {
                    children: /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $40c0f661ec418351$export$2e2bcd8739ae039), {
                        className: "h-4 w-4"
                    })
                })
            }),
            children
        ]
    }));
$4007f737badecf3c$export$53a69729da201fa9.displayName = $8ee26aadc71e1073$export$16ce288f89fa631c.displayName;
const $4007f737badecf3c$export$e4f69b41b1637536 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , children: children , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsxs)($8ee26aadc71e1073$export$371ab307eab489c0, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__dropdown-menu-radio-item", "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
        ...props,
        children: [
            /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($8ee26aadc71e1073$export$c3468e2714d175fa, {
                    children: /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $f4de4372d9dbc0ac$export$2e2bcd8739ae039), {
                        className: "h-2 w-2 fill-current"
                    })
                })
            }),
            children
        ]
    }));
$4007f737badecf3c$export$e4f69b41b1637536.displayName = $8ee26aadc71e1073$export$371ab307eab489c0.displayName;
const $4007f737badecf3c$export$76e48c5b57f24495 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , inset: inset , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($8ee26aadc71e1073$export$b04be29aa201d4f5, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
        ...props
    }));
$4007f737badecf3c$export$76e48c5b57f24495.displayName = $8ee26aadc71e1073$export$b04be29aa201d4f5.displayName;
const $4007f737badecf3c$export$da160178fd3bc7e9 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($8ee26aadc71e1073$export$1ff3c3f08ae963c0, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("-mx-1 my-1 h-px bg-muted", className),
        ...props
    }));
$4007f737badecf3c$export$da160178fd3bc7e9.displayName = $8ee26aadc71e1073$export$1ff3c3f08ae963c0.displayName;
const $4007f737badecf3c$export$b1e098e2962e8df5 = ({ className: className , ...props })=>{
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("span", {
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ml-auto text-xs tracking-widest opacity-60", className),
        ...props
    });
};
$4007f737badecf3c$export$b1e098e2962e8df5.displayName = "DropdownMenuShortcut";





var $LI8jA = parcelRequire("LI8jA");


var $LI8jA = parcelRequire("LI8jA");














var $LI8jA = parcelRequire("LI8jA");

/* -------------------------------------------------------------------------------------------------
 * VisuallyHidden
 * -----------------------------------------------------------------------------------------------*/ const $eecd8ed8717db193$var$$ea1ef594cf570d83$var$NAME = "VisuallyHidden";
const $eecd8ed8717db193$export$439d29a4e110a164 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).span, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, props, {
        ref: forwardedRef,
        style: {
            // See: https://github.com/twbs/bootstrap/blob/master/scss/mixins/_screen-reader.scss
            position: "absolute",
            border: 0,
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            wordWrap: "normal",
            ...props.style
        }
    }));
});
/*#__PURE__*/ Object.assign($eecd8ed8717db193$export$439d29a4e110a164, {
    displayName: $eecd8ed8717db193$var$$ea1ef594cf570d83$var$NAME
});
/* -----------------------------------------------------------------------------------------------*/ const $eecd8ed8717db193$export$be92b6f5f03c0fe9 = $eecd8ed8717db193$export$439d29a4e110a164;


/* -------------------------------------------------------------------------------------------------
 * ToastProvider
 * -----------------------------------------------------------------------------------------------*/ const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$PROVIDER_NAME = "ToastProvider";
const [$4e3f2d473be4357e$var$$054eb8030ebde76e$var$Collection, $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useCollection, $4e3f2d473be4357e$var$$054eb8030ebde76e$var$createCollectionScope] = (0, $38e2772b5a4e93fc$export$c74125a8e3af6bb2)("Toast");
const [$4e3f2d473be4357e$var$$054eb8030ebde76e$var$createToastContext, $4e3f2d473be4357e$export$8a359da18fbc9073] = (0, $ec3315292aa721d0$export$50c7b4e9d9f19c1)("Toast", [
    $4e3f2d473be4357e$var$$054eb8030ebde76e$var$createCollectionScope
]);
const [$4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastProviderProvider, $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useToastProviderContext] = $4e3f2d473be4357e$var$$054eb8030ebde76e$var$createToastContext($4e3f2d473be4357e$var$$054eb8030ebde76e$var$PROVIDER_NAME);
const $4e3f2d473be4357e$export$f5d03d415824e0e = (props)=>{
    const { __scopeToast: __scopeToast , label: label = "Notification" , duration: duration = 5000 , swipeDirection: swipeDirection = "right" , swipeThreshold: swipeThreshold = 50 , children: children  } = props;
    const [viewport, setViewport] = (0, $LI8jA.useState)(null);
    const [toastCount, setToastCount] = (0, $LI8jA.useState)(0);
    const isFocusedToastEscapeKeyDownRef = (0, $LI8jA.useRef)(false);
    const isClosePausedRef = (0, $LI8jA.useRef)(false);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$Collection.Provider, {
        scope: __scopeToast
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastProviderProvider, {
        scope: __scopeToast,
        label: label,
        duration: duration,
        swipeDirection: swipeDirection,
        swipeThreshold: swipeThreshold,
        toastCount: toastCount,
        viewport: viewport,
        onViewportChange: setViewport,
        onToastAdd: (0, $LI8jA.useCallback)(()=>setToastCount((prevCount)=>prevCount + 1), []),
        onToastRemove: (0, $LI8jA.useCallback)(()=>setToastCount((prevCount)=>prevCount - 1), []),
        isFocusedToastEscapeKeyDownRef: isFocusedToastEscapeKeyDownRef,
        isClosePausedRef: isClosePausedRef
    }, children));
};
$4e3f2d473be4357e$export$f5d03d415824e0e.propTypes = {
    label (props) {
        if (props.label && typeof props.label === "string" && !props.label.trim()) {
            const error = `Invalid prop \`label\` supplied to \`${$4e3f2d473be4357e$var$$054eb8030ebde76e$var$PROVIDER_NAME}\`. Expected non-empty \`string\`.`;
            return new Error(error);
        }
        return null;
    }
};
/*#__PURE__*/ Object.assign($4e3f2d473be4357e$export$f5d03d415824e0e, {
    displayName: $4e3f2d473be4357e$var$$054eb8030ebde76e$var$PROVIDER_NAME
});
/* -------------------------------------------------------------------------------------------------
 * ToastViewport
 * -----------------------------------------------------------------------------------------------*/ const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_NAME = "ToastViewport";
const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_DEFAULT_HOTKEY = [
    "F8"
];
const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_PAUSE = "toast.viewportPause";
const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_RESUME = "toast.viewportResume";
const $4e3f2d473be4357e$export$6192c2425ecfd989 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeToast: __scopeToast , hotkey: hotkey = $4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_DEFAULT_HOTKEY , label: label = "Notifications ({hotkey})" , ...viewportProps } = props;
    const context = $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useToastProviderContext($4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_NAME, __scopeToast);
    const getItems = $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useCollection(__scopeToast);
    const wrapperRef = (0, $LI8jA.useRef)(null);
    const headFocusProxyRef = (0, $LI8jA.useRef)(null);
    const tailFocusProxyRef = (0, $LI8jA.useRef)(null);
    const ref = (0, $LI8jA.useRef)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, ref, context.onViewportChange);
    const hotkeyLabel = hotkey.join("+").replace(/Key/g, "").replace(/Digit/g, "");
    const hasToasts = context.toastCount > 0;
    (0, $LI8jA.useEffect)(()=>{
        const handleKeyDown = (event)=>{
            var _ref$current;
            // we use `event.code` as it is consistent regardless of meta keys that were pressed.
            // for example, `event.key` for `Control+Alt+t` is `†` and `t !== †`
            const isHotkeyPressed = hotkey.every((key)=>event[key] || event.code === key);
            if (isHotkeyPressed) (_ref$current = ref.current) === null || _ref$current === void 0 || _ref$current.focus();
        };
        document.addEventListener("keydown", handleKeyDown);
        return ()=>document.removeEventListener("keydown", handleKeyDown);
    }, [
        hotkey
    ]);
    (0, $LI8jA.useEffect)(()=>{
        const wrapper = wrapperRef.current;
        const viewport = ref.current;
        if (hasToasts && wrapper && viewport) {
            const handlePause = ()=>{
                if (!context.isClosePausedRef.current) {
                    const pauseEvent = new CustomEvent($4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_PAUSE);
                    viewport.dispatchEvent(pauseEvent);
                    context.isClosePausedRef.current = true;
                }
            };
            const handleResume = ()=>{
                if (context.isClosePausedRef.current) {
                    const resumeEvent = new CustomEvent($4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_RESUME);
                    viewport.dispatchEvent(resumeEvent);
                    context.isClosePausedRef.current = false;
                }
            };
            const handleFocusOutResume = (event)=>{
                const isFocusMovingOutside = !wrapper.contains(event.relatedTarget);
                if (isFocusMovingOutside) handleResume();
            };
            const handlePointerLeaveResume = ()=>{
                const isFocusInside = wrapper.contains(document.activeElement);
                if (!isFocusInside) handleResume();
            }; // Toasts are not in the viewport React tree so we need to bind DOM events
            wrapper.addEventListener("focusin", handlePause);
            wrapper.addEventListener("focusout", handleFocusOutResume);
            wrapper.addEventListener("pointermove", handlePause);
            wrapper.addEventListener("pointerleave", handlePointerLeaveResume);
            window.addEventListener("blur", handlePause);
            window.addEventListener("focus", handleResume);
            return ()=>{
                wrapper.removeEventListener("focusin", handlePause);
                wrapper.removeEventListener("focusout", handleFocusOutResume);
                wrapper.removeEventListener("pointermove", handlePause);
                wrapper.removeEventListener("pointerleave", handlePointerLeaveResume);
                window.removeEventListener("blur", handlePause);
                window.removeEventListener("focus", handleResume);
            };
        }
    }, [
        hasToasts,
        context.isClosePausedRef
    ]);
    const getSortedTabbableCandidates = (0, $LI8jA.useCallback)(({ tabbingDirection: tabbingDirection  })=>{
        const toastItems = getItems();
        const tabbableCandidates = toastItems.map((toastItem)=>{
            const toastNode = toastItem.ref.current;
            const toastTabbableCandidates = [
                toastNode,
                ...$4e3f2d473be4357e$var$$054eb8030ebde76e$var$getTabbableCandidates(toastNode)
            ];
            return tabbingDirection === "forwards" ? toastTabbableCandidates : toastTabbableCandidates.reverse();
        });
        return (tabbingDirection === "forwards" ? tabbableCandidates.reverse() : tabbableCandidates).flat();
    }, [
        getItems
    ]);
    (0, $LI8jA.useEffect)(()=>{
        const viewport = ref.current; // We programmatically manage tabbing as we are unable to influence
        // the source order with portals, this allows us to reverse the
        // tab order so that it runs from most recent toast to least
        if (viewport) {
            const handleKeyDown = (event)=>{
                const isMetaKey = event.altKey || event.ctrlKey || event.metaKey;
                const isTabKey = event.key === "Tab" && !isMetaKey;
                if (isTabKey) {
                    const focusedElement = document.activeElement;
                    const isTabbingBackwards = event.shiftKey;
                    const targetIsViewport = event.target === viewport; // If we're back tabbing after jumping to the viewport then we simply
                    // proxy focus out to the preceding document
                    if (targetIsViewport && isTabbingBackwards) {
                        var _headFocusProxyRef$cu;
                        (_headFocusProxyRef$cu = headFocusProxyRef.current) === null || _headFocusProxyRef$cu === void 0 || _headFocusProxyRef$cu.focus();
                        return;
                    }
                    const tabbingDirection = isTabbingBackwards ? "backwards" : "forwards";
                    const sortedCandidates = getSortedTabbableCandidates({
                        tabbingDirection: tabbingDirection
                    });
                    const index = sortedCandidates.findIndex((candidate)=>candidate === focusedElement);
                    if ($4e3f2d473be4357e$var$$054eb8030ebde76e$var$focusFirst(sortedCandidates.slice(index + 1))) event.preventDefault();
                    else {
                        var _headFocusProxyRef$cu2, _tailFocusProxyRef$cu;
                        // If we can't focus that means we're at the edges so we
                        // proxy to the corresponding exit point and let the browser handle
                        // tab/shift+tab keypress and implicitly pass focus to the next valid element in the document
                        isTabbingBackwards ? (_headFocusProxyRef$cu2 = headFocusProxyRef.current) === null || _headFocusProxyRef$cu2 === void 0 || _headFocusProxyRef$cu2.focus() : (_tailFocusProxyRef$cu = tailFocusProxyRef.current) === null || _tailFocusProxyRef$cu === void 0 || _tailFocusProxyRef$cu.focus();
                    }
                }
            }; // Toasts are not in the viewport React tree so we need to bind DOM events
            viewport.addEventListener("keydown", handleKeyDown);
            return ()=>viewport.removeEventListener("keydown", handleKeyDown);
        }
    }, [
        getItems,
        getSortedTabbableCandidates
    ]);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a102e9b8e3188262$export$aecb2ddcb55c95be), {
        ref: wrapperRef,
        role: "region",
        "aria-label": label.replace("{hotkey}", hotkeyLabel) // Ensure virtual cursor from landmarks menus triggers focus/blur for pause/resume
        ,
        tabIndex: -1 // incase list has size when empty (e.g. padding), we remove pointer events so
        ,
        style: {
            pointerEvents: hasToasts ? undefined : "none"
        }
    }, hasToasts && /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$FocusProxy, {
        ref: headFocusProxyRef,
        onFocusFromOutsideViewport: ()=>{
            const tabbableCandidates = getSortedTabbableCandidates({
                tabbingDirection: "forwards"
            });
            $4e3f2d473be4357e$var$$054eb8030ebde76e$var$focusFirst(tabbableCandidates);
        }
    }), /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$Collection.Slot, {
        scope: __scopeToast
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).ol, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        tabIndex: -1
    }, viewportProps, {
        ref: composedRefs
    }))), hasToasts && /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$FocusProxy, {
        ref: tailFocusProxyRef,
        onFocusFromOutsideViewport: ()=>{
            const tabbableCandidates = getSortedTabbableCandidates({
                tabbingDirection: "backwards"
            });
            $4e3f2d473be4357e$var$$054eb8030ebde76e$var$focusFirst(tabbableCandidates);
        }
    }));
});
/*#__PURE__*/ Object.assign($4e3f2d473be4357e$export$6192c2425ecfd989, {
    displayName: $4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_NAME
});
/* -----------------------------------------------------------------------------------------------*/ const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$FOCUS_PROXY_NAME = "ToastFocusProxy";
const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$FocusProxy = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeToast: __scopeToast , onFocusFromOutsideViewport: onFocusFromOutsideViewport , ...proxyProps } = props;
    const context = $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useToastProviderContext($4e3f2d473be4357e$var$$054eb8030ebde76e$var$FOCUS_PROXY_NAME, __scopeToast);
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $eecd8ed8717db193$export$439d29a4e110a164), (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        "aria-hidden": true,
        tabIndex: 0
    }, proxyProps, {
        ref: forwardedRef // Avoid page scrolling when focus is on the focus proxy
        ,
        style: {
            position: "fixed"
        },
        onFocus: (event)=>{
            var _context$viewport;
            const prevFocusedElement = event.relatedTarget;
            const isFocusFromOutsideViewport = !((_context$viewport = context.viewport) !== null && _context$viewport !== void 0 && _context$viewport.contains(prevFocusedElement));
            if (isFocusFromOutsideViewport) onFocusFromOutsideViewport();
        }
    }));
});
/*#__PURE__*/ Object.assign($4e3f2d473be4357e$var$$054eb8030ebde76e$var$FocusProxy, {
    displayName: $4e3f2d473be4357e$var$$054eb8030ebde76e$var$FOCUS_PROXY_NAME
});
/* -------------------------------------------------------------------------------------------------
 * Toast
 * -----------------------------------------------------------------------------------------------*/ const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_NAME = "Toast";
const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_SWIPE_START = "toast.swipeStart";
const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_SWIPE_MOVE = "toast.swipeMove";
const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_SWIPE_CANCEL = "toast.swipeCancel";
const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_SWIPE_END = "toast.swipeEnd";
const $4e3f2d473be4357e$export$8d8dc7d5f743331b = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { forceMount: forceMount , open: openProp , defaultOpen: defaultOpen , onOpenChange: onOpenChange , ...toastProps } = props;
    const [open = true, setOpen] = (0, $f4c632903130edee$export$6f32135080cb4c3)({
        prop: openProp,
        defaultProp: defaultOpen,
        onChange: onOpenChange
    });
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $0ac33c7c3f86b9ab$export$99c2b779aa4e8b8b), {
        present: forceMount || open
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastImpl, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        open: open
    }, toastProps, {
        ref: forwardedRef,
        onClose: ()=>setOpen(false),
        onPause: (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(props.onPause),
        onResume: (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(props.onResume),
        onSwipeStart: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onSwipeStart, (event)=>{
            event.currentTarget.setAttribute("data-swipe", "start");
        }),
        onSwipeMove: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onSwipeMove, (event)=>{
            const { x: x , y: y  } = event.detail.delta;
            event.currentTarget.setAttribute("data-swipe", "move");
            event.currentTarget.style.setProperty("--radix-toast-swipe-move-x", `${x}px`);
            event.currentTarget.style.setProperty("--radix-toast-swipe-move-y", `${y}px`);
        }),
        onSwipeCancel: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onSwipeCancel, (event)=>{
            event.currentTarget.setAttribute("data-swipe", "cancel");
            event.currentTarget.style.removeProperty("--radix-toast-swipe-move-x");
            event.currentTarget.style.removeProperty("--radix-toast-swipe-move-y");
            event.currentTarget.style.removeProperty("--radix-toast-swipe-end-x");
            event.currentTarget.style.removeProperty("--radix-toast-swipe-end-y");
        }),
        onSwipeEnd: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onSwipeEnd, (event)=>{
            const { x: x , y: y  } = event.detail.delta;
            event.currentTarget.setAttribute("data-swipe", "end");
            event.currentTarget.style.removeProperty("--radix-toast-swipe-move-x");
            event.currentTarget.style.removeProperty("--radix-toast-swipe-move-y");
            event.currentTarget.style.setProperty("--radix-toast-swipe-end-x", `${x}px`);
            event.currentTarget.style.setProperty("--radix-toast-swipe-end-y", `${y}px`);
            setOpen(false);
        })
    })));
});
/*#__PURE__*/ Object.assign($4e3f2d473be4357e$export$8d8dc7d5f743331b, {
    displayName: $4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_NAME
});
/* -----------------------------------------------------------------------------------------------*/ const [$4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastInteractiveProvider, $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useToastInteractiveContext] = $4e3f2d473be4357e$var$$054eb8030ebde76e$var$createToastContext($4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_NAME, {
    onClose () {}
});
const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastImpl = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeToast: __scopeToast , type: type = "foreground" , duration: durationProp , open: open , onClose: onClose , onEscapeKeyDown: onEscapeKeyDown , onPause: onPause , onResume: onResume , onSwipeStart: onSwipeStart , onSwipeMove: onSwipeMove , onSwipeCancel: onSwipeCancel , onSwipeEnd: onSwipeEnd , ...toastProps } = props;
    const context = $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useToastProviderContext($4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_NAME, __scopeToast);
    const [node1, setNode] = (0, $LI8jA.useState)(null);
    const composedRefs = (0, $7ec60ad3718be6bb$export$c7b2cbe3552a0d05)(forwardedRef, (node)=>setNode(node));
    const pointerStartRef = (0, $LI8jA.useRef)(null);
    const swipeDeltaRef = (0, $LI8jA.useRef)(null);
    const duration1 = durationProp || context.duration;
    const closeTimerStartTimeRef = (0, $LI8jA.useRef)(0);
    const closeTimerRemainingTimeRef = (0, $LI8jA.useRef)(duration1);
    const closeTimerRef = (0, $LI8jA.useRef)(0);
    const { onToastAdd: onToastAdd , onToastRemove: onToastRemove  } = context;
    const handleClose = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(()=>{
        var _context$viewport2;
        // focus viewport if focus is within toast to read the remaining toast
        // count to SR users and ensure focus isn't lost
        const isFocusInToast = node1 === null || node1 === void 0 ? void 0 : node1.contains(document.activeElement);
        if (isFocusInToast) (_context$viewport2 = context.viewport) === null || _context$viewport2 === void 0 || _context$viewport2.focus();
        onClose();
    });
    const startTimer = (0, $LI8jA.useCallback)((duration)=>{
        if (!duration || duration === Infinity) return;
        window.clearTimeout(closeTimerRef.current);
        closeTimerStartTimeRef.current = new Date().getTime();
        closeTimerRef.current = window.setTimeout(handleClose, duration);
    }, [
        handleClose
    ]);
    (0, $LI8jA.useEffect)(()=>{
        const viewport = context.viewport;
        if (viewport) {
            const handleResume = ()=>{
                startTimer(closeTimerRemainingTimeRef.current);
                onResume === null || onResume === void 0 || onResume();
            };
            const handlePause = ()=>{
                const elapsedTime = new Date().getTime() - closeTimerStartTimeRef.current;
                closeTimerRemainingTimeRef.current = closeTimerRemainingTimeRef.current - elapsedTime;
                window.clearTimeout(closeTimerRef.current);
                onPause === null || onPause === void 0 || onPause();
            };
            viewport.addEventListener($4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_PAUSE, handlePause);
            viewport.addEventListener($4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_RESUME, handleResume);
            return ()=>{
                viewport.removeEventListener($4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_PAUSE, handlePause);
                viewport.removeEventListener($4e3f2d473be4357e$var$$054eb8030ebde76e$var$VIEWPORT_RESUME, handleResume);
            };
        }
    }, [
        context.viewport,
        duration1,
        onPause,
        onResume,
        startTimer
    ]); // start timer when toast opens or duration changes.
    // we include `open` in deps because closed !== unmounted when animating
    // so it could reopen before being completely unmounted
    (0, $LI8jA.useEffect)(()=>{
        if (open && !context.isClosePausedRef.current) startTimer(duration1);
    }, [
        open,
        duration1,
        context.isClosePausedRef,
        startTimer
    ]);
    (0, $LI8jA.useEffect)(()=>{
        onToastAdd();
        return ()=>onToastRemove();
    }, [
        onToastAdd,
        onToastRemove
    ]);
    const announceTextContent = (0, $LI8jA.useMemo)(()=>{
        return node1 ? $4e3f2d473be4357e$var$$054eb8030ebde76e$var$getAnnounceTextContent(node1) : null;
    }, [
        node1
    ]);
    if (!context.viewport) return null;
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $LI8jA.Fragment), null, announceTextContent && /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastAnnounce, {
        __scopeToast: __scopeToast // Toasts are always role=status to avoid stuttering issues with role=alert in SRs.
        ,
        role: "status",
        "aria-live": type === "foreground" ? "assertive" : "polite",
        "aria-atomic": true
    }, announceTextContent), /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastInteractiveProvider, {
        scope: __scopeToast,
        onClose: handleClose
    }, /*#__PURE__*/ (0, $117771ce739ab0ef$exports.createPortal)(/*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$Collection.ItemSlot, {
        scope: __scopeToast
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a102e9b8e3188262$export$be92b6f5f03c0fe9), {
        asChild: true,
        onEscapeKeyDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(onEscapeKeyDown, ()=>{
            if (!context.isFocusedToastEscapeKeyDownRef.current) handleClose();
            context.isFocusedToastEscapeKeyDownRef.current = false;
        })
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).li, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        // Ensure toasts are announced as status list or status when focused
        role: "status",
        "aria-live": "off",
        "aria-atomic": true,
        tabIndex: 0,
        "data-state": open ? "open" : "closed",
        "data-swipe-direction": context.swipeDirection
    }, toastProps, {
        ref: composedRefs,
        style: {
            userSelect: "none",
            touchAction: "none",
            ...props.style
        },
        onKeyDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onKeyDown, (event)=>{
            if (event.key !== "Escape") return;
            onEscapeKeyDown === null || onEscapeKeyDown === void 0 || onEscapeKeyDown(event.nativeEvent);
            if (!event.nativeEvent.defaultPrevented) {
                context.isFocusedToastEscapeKeyDownRef.current = true;
                handleClose();
            }
        }),
        onPointerDown: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerDown, (event)=>{
            if (event.button !== 0) return;
            pointerStartRef.current = {
                x: event.clientX,
                y: event.clientY
            };
        }),
        onPointerMove: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerMove, (event)=>{
            if (!pointerStartRef.current) return;
            const x = event.clientX - pointerStartRef.current.x;
            const y = event.clientY - pointerStartRef.current.y;
            const hasSwipeMoveStarted = Boolean(swipeDeltaRef.current);
            const isHorizontalSwipe = [
                "left",
                "right"
            ].includes(context.swipeDirection);
            const clamp = [
                "left",
                "up"
            ].includes(context.swipeDirection) ? Math.min : Math.max;
            const clampedX = isHorizontalSwipe ? clamp(0, x) : 0;
            const clampedY = !isHorizontalSwipe ? clamp(0, y) : 0;
            const moveStartBuffer = event.pointerType === "touch" ? 10 : 2;
            const delta = {
                x: clampedX,
                y: clampedY
            };
            const eventDetail = {
                originalEvent: event,
                delta: delta
            };
            if (hasSwipeMoveStarted) {
                swipeDeltaRef.current = delta;
                $4e3f2d473be4357e$var$$054eb8030ebde76e$var$handleAndDispatchCustomEvent($4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_SWIPE_MOVE, onSwipeMove, eventDetail, {
                    discrete: false
                });
            } else if ($4e3f2d473be4357e$var$$054eb8030ebde76e$var$isDeltaInDirection(delta, context.swipeDirection, moveStartBuffer)) {
                swipeDeltaRef.current = delta;
                $4e3f2d473be4357e$var$$054eb8030ebde76e$var$handleAndDispatchCustomEvent($4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_SWIPE_START, onSwipeStart, eventDetail, {
                    discrete: false
                });
                event.target.setPointerCapture(event.pointerId);
            } else if (Math.abs(x) > moveStartBuffer || Math.abs(y) > moveStartBuffer) // for the current pointer down interaction
            pointerStartRef.current = null;
        }),
        onPointerUp: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onPointerUp, (event1)=>{
            const delta = swipeDeltaRef.current;
            const target = event1.target;
            if (target.hasPointerCapture(event1.pointerId)) target.releasePointerCapture(event1.pointerId);
            swipeDeltaRef.current = null;
            pointerStartRef.current = null;
            if (delta) {
                const toast = event1.currentTarget;
                const eventDetail = {
                    originalEvent: event1,
                    delta: delta
                };
                if ($4e3f2d473be4357e$var$$054eb8030ebde76e$var$isDeltaInDirection(delta, context.swipeDirection, context.swipeThreshold)) $4e3f2d473be4357e$var$$054eb8030ebde76e$var$handleAndDispatchCustomEvent($4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_SWIPE_END, onSwipeEnd, eventDetail, {
                    discrete: true
                });
                else $4e3f2d473be4357e$var$$054eb8030ebde76e$var$handleAndDispatchCustomEvent($4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_SWIPE_CANCEL, onSwipeCancel, eventDetail, {
                    discrete: true
                });
                // Prevent click event from triggering on items within the toast when
                // pointer up is part of a swipe gesture
                toast.addEventListener("click", (event)=>event.preventDefault(), {
                    once: true
                });
            }
        })
    })))), context.viewport)));
});
$4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastImpl.propTypes = {
    type (props) {
        if (props.type && ![
            "foreground",
            "background"
        ].includes(props.type)) {
            const error = `Invalid prop \`type\` supplied to \`${$4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_NAME}\`. Expected \`foreground | background\`.`;
            return new Error(error);
        }
        return null;
    }
};
/* -----------------------------------------------------------------------------------------------*/ const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastAnnounce = (props)=>{
    const { __scopeToast: __scopeToast , children: children , ...announceProps } = props;
    const context = $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useToastProviderContext($4e3f2d473be4357e$var$$054eb8030ebde76e$var$TOAST_NAME, __scopeToast);
    const [renderAnnounceText, setRenderAnnounceText] = (0, $LI8jA.useState)(false);
    const [isAnnounced, setIsAnnounced] = (0, $LI8jA.useState)(false); // render text content in the next frame to ensure toast is announced in NVDA
    $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useNextFrame(()=>setRenderAnnounceText(true)); // cleanup after announcing
    (0, $LI8jA.useEffect)(()=>{
        const timer = window.setTimeout(()=>setIsAnnounced(true), 1000);
        return ()=>window.clearTimeout(timer);
    }, []);
    return isAnnounced ? null : /*#__PURE__*/ (0, $LI8jA.createElement)((0, $726ec765805a08e3$export$602eac185826482c), {
        asChild: true
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $eecd8ed8717db193$export$439d29a4e110a164), announceProps, renderAnnounceText && /*#__PURE__*/ (0, $LI8jA.createElement)((0, $LI8jA.Fragment), null, context.label, " ", children)));
};
/* -------------------------------------------------------------------------------------------------
 * ToastTitle
 * -----------------------------------------------------------------------------------------------*/ const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$TITLE_NAME = "ToastTitle";
const $4e3f2d473be4357e$export$16d42d7c29b95a4 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeToast: __scopeToast , ...titleProps } = props;
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, titleProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($4e3f2d473be4357e$export$16d42d7c29b95a4, {
    displayName: $4e3f2d473be4357e$var$$054eb8030ebde76e$var$TITLE_NAME
});
/* -------------------------------------------------------------------------------------------------
 * ToastDescription
 * -----------------------------------------------------------------------------------------------*/ const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$DESCRIPTION_NAME = "ToastDescription";
const $4e3f2d473be4357e$export$ecddd96c53621d9a = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeToast: __scopeToast , ...descriptionProps } = props;
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, descriptionProps, {
        ref: forwardedRef
    }));
});
/*#__PURE__*/ Object.assign($4e3f2d473be4357e$export$ecddd96c53621d9a, {
    displayName: $4e3f2d473be4357e$var$$054eb8030ebde76e$var$DESCRIPTION_NAME
});
/* -------------------------------------------------------------------------------------------------
 * ToastAction
 * -----------------------------------------------------------------------------------------------*/ const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$ACTION_NAME = "ToastAction";
const $4e3f2d473be4357e$export$3019feecfda683d2 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { altText: altText , ...actionProps } = props;
    if (!altText) return null;
    return /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastAnnounceExclude, {
        altText: altText,
        asChild: true
    }, /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$export$811e70f61c205839, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, actionProps, {
        ref: forwardedRef
    })));
});
$4e3f2d473be4357e$export$3019feecfda683d2.propTypes = {
    altText (props) {
        if (!props.altText) return new Error(`Missing prop \`altText\` expected on \`${$4e3f2d473be4357e$var$$054eb8030ebde76e$var$ACTION_NAME}\``);
        return null;
    }
};
/*#__PURE__*/ Object.assign($4e3f2d473be4357e$export$3019feecfda683d2, {
    displayName: $4e3f2d473be4357e$var$$054eb8030ebde76e$var$ACTION_NAME
});
/* -------------------------------------------------------------------------------------------------
 * ToastClose
 * -----------------------------------------------------------------------------------------------*/ const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$CLOSE_NAME = "ToastClose";
const $4e3f2d473be4357e$export$811e70f61c205839 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeToast: __scopeToast , ...closeProps } = props;
    const interactiveContext = $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useToastInteractiveContext($4e3f2d473be4357e$var$$054eb8030ebde76e$var$CLOSE_NAME, __scopeToast);
    return /*#__PURE__*/ (0, $LI8jA.createElement)($4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastAnnounceExclude, {
        asChild: true
    }, /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).button, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        type: "button"
    }, closeProps, {
        ref: forwardedRef,
        onClick: (0, $890940bb4b8db948$export$b9ecd428b558ff10)(props.onClick, interactiveContext.onClose)
    })));
});
/*#__PURE__*/ Object.assign($4e3f2d473be4357e$export$811e70f61c205839, {
    displayName: $4e3f2d473be4357e$var$$054eb8030ebde76e$var$CLOSE_NAME
});
/* ---------------------------------------------------------------------------------------------- */ const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$ToastAnnounceExclude = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    const { __scopeToast: __scopeToast , altText: altText , ...announceExcludeProps } = props;
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).div, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({
        "data-radix-toast-announce-exclude": "",
        "data-radix-toast-announce-alt": altText || undefined
    }, announceExcludeProps, {
        ref: forwardedRef
    }));
});
function $4e3f2d473be4357e$var$$054eb8030ebde76e$var$getAnnounceTextContent(container) {
    const textContent = [];
    const childNodes = Array.from(container.childNodes);
    childNodes.forEach((node)=>{
        if (node.nodeType === node.TEXT_NODE && node.textContent) textContent.push(node.textContent);
        if ($4e3f2d473be4357e$var$$054eb8030ebde76e$var$isHTMLElement(node)) {
            const isHidden = node.ariaHidden || node.hidden || node.style.display === "none";
            const isExcluded = node.dataset.radixToastAnnounceExclude === "";
            if (!isHidden) {
                if (isExcluded) {
                    const altText = node.dataset.radixToastAnnounceAlt;
                    if (altText) textContent.push(altText);
                } else textContent.push(...$4e3f2d473be4357e$var$$054eb8030ebde76e$var$getAnnounceTextContent(node));
            }
        }
    }); // We return a collection of text rather than a single concatenated string.
    // This allows SR VO to naturally pause break between nodes while announcing.
    return textContent;
}
/* ---------------------------------------------------------------------------------------------- */ function $4e3f2d473be4357e$var$$054eb8030ebde76e$var$handleAndDispatchCustomEvent(name, handler, detail, { discrete: discrete  }) {
    const currentTarget = detail.originalEvent.currentTarget;
    const event = new CustomEvent(name, {
        bubbles: true,
        cancelable: true,
        detail: detail
    });
    if (handler) currentTarget.addEventListener(name, handler, {
        once: true
    });
    if (discrete) (0, $a68e7d99b5d35ecf$export$6d1a0317bde7de7f)(currentTarget, event);
    else currentTarget.dispatchEvent(event);
}
const $4e3f2d473be4357e$var$$054eb8030ebde76e$var$isDeltaInDirection = (delta, direction, threshold = 0)=>{
    const deltaX = Math.abs(delta.x);
    const deltaY = Math.abs(delta.y);
    const isDeltaX = deltaX > deltaY;
    if (direction === "left" || direction === "right") return isDeltaX && deltaX > threshold;
    else return !isDeltaX && deltaY > threshold;
};
function $4e3f2d473be4357e$var$$054eb8030ebde76e$var$useNextFrame(callback = ()=>{}) {
    const fn = (0, $8d5f4755e7320408$export$25bec8c6f54ee79a)(callback);
    (0, $620f4b520baef9c2$export$e5c5a5f917a5871c)(()=>{
        let raf1 = 0;
        let raf2 = 0;
        raf1 = window.requestAnimationFrame(()=>raf2 = window.requestAnimationFrame(fn));
        return ()=>{
            window.cancelAnimationFrame(raf1);
            window.cancelAnimationFrame(raf2);
        };
    }, [
        fn
    ]);
}
function $4e3f2d473be4357e$var$$054eb8030ebde76e$var$isHTMLElement(node) {
    return node.nodeType === node.ELEMENT_NODE;
}
/**
 * Returns a list of potential tabbable candidates.
 *
 * NOTE: This is only a close approximation. For example it doesn't take into account cases like when
 * elements are not visible. This cannot be worked out easily by just reading a property, but rather
 * necessitate runtime knowledge (computed styles, etc). We deal with these cases separately.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker
 * Credit: https://github.com/discord/focus-layers/blob/master/src/util/wrapFocus.tsx#L1
 */ function $4e3f2d473be4357e$var$$054eb8030ebde76e$var$getTabbableCandidates(container) {
    const nodes = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node)=>{
            const isHiddenInput = node.tagName === "INPUT" && node.type === "hidden";
            if (node.disabled || node.hidden || isHiddenInput) return NodeFilter.FILTER_SKIP; // `.tabIndex` is not the same as the `tabindex` attribute. It works on the
            // runtime's understanding of tabbability, so this automatically accounts
            // for any kind of element that could be tabbed to.
            return node.tabIndex >= 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
        }
    });
    while(walker.nextNode())nodes.push(walker.currentNode); // we do not take into account the order of nodes with positive `tabIndex` as it
    // hinders accessibility to have tab order different from visual order.
    return nodes;
}
function $4e3f2d473be4357e$var$$054eb8030ebde76e$var$focusFirst(candidates) {
    const previouslyFocusedElement = document.activeElement;
    return candidates.some((candidate)=>{
        // if focus is already where we want to go, we don't want to keep going through the candidates
        if (candidate === previouslyFocusedElement) return true;
        candidate.focus();
        return document.activeElement !== previouslyFocusedElement;
    });
}
const $4e3f2d473be4357e$export$2881499e37b75b9a = $4e3f2d473be4357e$export$f5d03d415824e0e;
const $4e3f2d473be4357e$export$d5c6c08dc2d3ca7 = $4e3f2d473be4357e$export$6192c2425ecfd989;
const $4e3f2d473be4357e$export$be92b6f5f03c0fe9 = $4e3f2d473be4357e$export$8d8dc7d5f743331b;
const $4e3f2d473be4357e$export$f99233281efd08a0 = $4e3f2d473be4357e$export$16d42d7c29b95a4;
const $4e3f2d473be4357e$export$393edc798c47379d = $4e3f2d473be4357e$export$ecddd96c53621d9a;
const $4e3f2d473be4357e$export$e19cd5f9376f8cee = $4e3f2d473be4357e$export$3019feecfda683d2;
const $4e3f2d473be4357e$export$f39c2d165cd861fe = $4e3f2d473be4357e$export$811e70f61c205839;



/**
 * lucide-react v0.292.0 - ISC
 */ 
const $316428a5e3faa045$export$2e2bcd8739ae039 = (0, $149557adc85d935d$export$2e2bcd8739ae039)("X", [
    [
        "path",
        {
            d: "M18 6 6 18",
            key: "1bl5f8"
        }
    ],
    [
        "path",
        {
            d: "m6 6 12 12",
            key: "d8bk6v"
        }
    ]
]);



const $dd6c85c98a83b5b0$export$f5d03d415824e0e = $4e3f2d473be4357e$export$2881499e37b75b9a;
const $dd6c85c98a83b5b0$export$6192c2425ecfd989 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($4e3f2d473be4357e$export$d5c6c08dc2d3ca7, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("fixed top-0 z-[9999] flex max-h-screen w-full flex-col-reverse p-4", "sm:bottom-0 sm:!top-auto sm:right-0 sm:flex-col md:max-w-[420px]", className),
        ...props
    }));
$dd6c85c98a83b5b0$export$6192c2425ecfd989.displayName = $4e3f2d473be4357e$export$d5c6c08dc2d3ca7.displayName;
const $dd6c85c98a83b5b0$var$toastVariants = (0, $591c8f71196a9028$export$87dc52566e90b739)("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full", {
    variants: {
        variant: {
            default: "border bg-background text-foreground",
            destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
            info: "border bg-background text-foreground",
            success: "border bg-background text-foreground",
            warning: "border bg-background text-foreground",
            error: "border bg-background text-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
const $dd6c85c98a83b5b0$export$8d8dc7d5f743331b = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , variant: variant , ...props }, ref)=>{
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($4e3f2d473be4357e$export$be92b6f5f03c0fe9, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)($dd6c85c98a83b5b0$var$toastVariants({
            variant: variant
        }), className),
        ...props
    });
});
$dd6c85c98a83b5b0$export$8d8dc7d5f743331b.displayName = $4e3f2d473be4357e$export$be92b6f5f03c0fe9.displayName;
const $dd6c85c98a83b5b0$export$3019feecfda683d2 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($4e3f2d473be4357e$export$e19cd5f9376f8cee, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className),
        ...props
    }));
$dd6c85c98a83b5b0$export$3019feecfda683d2.displayName = $4e3f2d473be4357e$export$e19cd5f9376f8cee.displayName;
const $dd6c85c98a83b5b0$export$811e70f61c205839 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($4e3f2d473be4357e$export$f39c2d165cd861fe, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className),
        "toast-close": "",
        ...props,
        children: /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $316428a5e3faa045$export$2e2bcd8739ae039), {
            className: "h-4 w-4"
        })
    }));
$dd6c85c98a83b5b0$export$811e70f61c205839.displayName = $4e3f2d473be4357e$export$f39c2d165cd861fe.displayName;
const $dd6c85c98a83b5b0$export$16d42d7c29b95a4 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($4e3f2d473be4357e$export$f99233281efd08a0, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("text-sm font-semibold", className),
        ...props
    }));
$dd6c85c98a83b5b0$export$16d42d7c29b95a4.displayName = $4e3f2d473be4357e$export$f99233281efd08a0.displayName;
const $dd6c85c98a83b5b0$export$ecddd96c53621d9a = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($4e3f2d473be4357e$export$393edc798c47379d, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("text-sm opacity-90", className),
        ...props
    }));
$dd6c85c98a83b5b0$export$ecddd96c53621d9a.displayName = $4e3f2d473be4357e$export$393edc798c47379d.displayName;


// Inspired by react-hot-toast library

var $LI8jA = parcelRequire("LI8jA");
const $43bc9081ab9a723d$var$TOAST_LIMIT = 16;
const $43bc9081ab9a723d$var$TOAST_REMOVE_DELAY = 2000;
const $43bc9081ab9a723d$var$actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST"
};
let $43bc9081ab9a723d$var$count = 0;
function $43bc9081ab9a723d$export$87d45d9755ebb726() {
    $43bc9081ab9a723d$var$count = ($43bc9081ab9a723d$var$count + 1) % Number.MAX_VALUE;
    return $43bc9081ab9a723d$var$count.toString();
}
const $43bc9081ab9a723d$var$toastTimeouts = new Map();
const $43bc9081ab9a723d$var$addToRemoveQueue = (toastId)=>{
    if ($43bc9081ab9a723d$var$toastTimeouts.has(toastId)) return;
    const timeout = setTimeout(()=>{
        $43bc9081ab9a723d$var$toastTimeouts.delete(toastId);
        $43bc9081ab9a723d$var$dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId
        });
    }, $43bc9081ab9a723d$var$TOAST_REMOVE_DELAY);
    $43bc9081ab9a723d$var$toastTimeouts.set(toastId, timeout);
};
const $43bc9081ab9a723d$export$1650419e431d3ba3 = (state, action)=>{
    switch(action.type){
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [
                    action.toast,
                    ...state.toasts
                ].slice(0, $43bc9081ab9a723d$var$TOAST_LIMIT)
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t)=>t.id === action.toast.id ? {
                        ...t,
                        ...action.toast
                    } : t)
            };
        case "DISMISS_TOAST":
            {
                const { toastId: toastId  } = action;
                // ! Side effects ! - This could be extracted into a dismissToast() action,
                // but I'll keep it here for simplicity
                if (toastId) {
                    const toast = state.toasts.find((it)=>it.id == toastId);
                    $43bc9081ab9a723d$var$addToRemoveQueue(toastId);
                    toast?.onDismiss?.(toastId);
                } else state.toasts.forEach((toast)=>{
                    $43bc9081ab9a723d$var$addToRemoveQueue(toast.id);
                    toast?.onDismiss?.(toast.id);
                });
                const toasts = state.toasts.map((t)=>{
                    if (t.id == toastId || toastId == undefined) return {
                        ...t,
                        open: false
                    };
                    return t;
                });
                return {
                    ...state,
                    toasts: toasts
                };
            }
        case "REMOVE_TOAST":
            if (action.toastId == undefined) return {
                ...state,
                toasts: []
            };
            return {
                ...state,
                toasts: state.toasts.filter((t)=>t.id !== action.toastId)
            };
    }
};
const $43bc9081ab9a723d$var$listeners = [];
let $43bc9081ab9a723d$var$memoryState = {
    toasts: []
};
function $43bc9081ab9a723d$var$dispatch(action) {
    $43bc9081ab9a723d$var$memoryState = $43bc9081ab9a723d$export$1650419e431d3ba3($43bc9081ab9a723d$var$memoryState, action);
    $43bc9081ab9a723d$var$listeners.forEach((listener)=>{
        listener($43bc9081ab9a723d$var$memoryState);
    });
}
function $43bc9081ab9a723d$export$b410431fab84fa58({ id: id , ...props }) {
    id = id || $43bc9081ab9a723d$export$87d45d9755ebb726();
    const update = (props)=>$43bc9081ab9a723d$var$dispatch({
            type: "UPDATE_TOAST",
            toast: {
                ...props,
                id: id
            }
        });
    const dismiss = ()=>{
        $43bc9081ab9a723d$var$dispatch({
            type: "DISMISS_TOAST",
            toastId: id
        });
    };
    const toastIdExist = $43bc9081ab9a723d$var$memoryState.toasts?.some((it)=>it.id == id);
    $43bc9081ab9a723d$var$dispatch({
        type: toastIdExist ? "UPDATE_TOAST" : "ADD_TOAST",
        toast: {
            ...props,
            id: id,
            open: true,
            onOpenChange: (open)=>{
                if (!open) dismiss();
            }
        }
    });
    return {
        id: id,
        dismiss: dismiss,
        update: update
    };
}
function $43bc9081ab9a723d$export$a407b657d3044108() {
    const [state, setState] = $LI8jA.useState($43bc9081ab9a723d$var$memoryState);
    $LI8jA.useEffect(()=>{
        $43bc9081ab9a723d$var$listeners.push(setState);
        return ()=>{
            const index = $43bc9081ab9a723d$var$listeners.indexOf(setState);
            if (index > -1) $43bc9081ab9a723d$var$listeners.splice(index, 1);
        };
    }, [
        state
    ]);
    return {
        ...state,
        toast: $43bc9081ab9a723d$export$b410431fab84fa58,
        dismiss: (toastId)=>$43bc9081ab9a723d$var$dispatch({
                type: "DISMISS_TOAST",
                toastId: toastId
            }),
        update: (toastId, props)=>$43bc9081ab9a723d$var$dispatch({
                type: "UPDATE_TOAST",
                toast: {
                    ...props,
                    id: toastId
                }
            })
    };
}


/**
 * lucide-react v0.292.0 - ISC
 */ 
const $990c6c5a1af3c7cd$export$2e2bcd8739ae039 = (0, $149557adc85d935d$export$2e2bcd8739ae039)("AlertCircle", [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ],
    [
        "line",
        {
            x1: "12",
            x2: "12",
            y1: "8",
            y2: "12",
            key: "1pkeuh"
        }
    ],
    [
        "line",
        {
            x1: "12",
            x2: "12.01",
            y1: "16",
            y2: "16",
            key: "4dfq90"
        }
    ]
]);

/**
 * lucide-react v0.292.0 - ISC
 */ 
const $75d764636bf7020f$export$2e2bcd8739ae039 = (0, $149557adc85d935d$export$2e2bcd8739ae039)("CheckCircle2", [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ],
    [
        "path",
        {
            d: "m9 12 2 2 4-4",
            key: "dzmm74"
        }
    ]
]);

/**
 * lucide-react v0.292.0 - ISC
 */ 
const $e5e99bf5f969d67a$export$2e2bcd8739ae039 = (0, $149557adc85d935d$export$2e2bcd8739ae039)("Info", [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ],
    [
        "path",
        {
            d: "M12 16v-4",
            key: "1dtifu"
        }
    ],
    [
        "path",
        {
            d: "M12 8h.01",
            key: "e9boi3"
        }
    ]
]);

/**
 * lucide-react v0.292.0 - ISC
 */ 
const $7fc7a48ba4f47b4b$export$2e2bcd8739ae039 = (0, $149557adc85d935d$export$2e2bcd8739ae039)("XCircle", [
    [
        "circle",
        {
            cx: "12",
            cy: "12",
            r: "10",
            key: "1mglay"
        }
    ],
    [
        "path",
        {
            d: "m15 9-6 6",
            key: "1uzhvr"
        }
    ],
    [
        "path",
        {
            d: "m9 9 6 6",
            key: "z0biqf"
        }
    ]
]);



function $56e330253c5a7e46$export$fb98e3a2a4cd92d7() {
    const { toasts: toasts  } = (0, $43bc9081ab9a723d$export$a407b657d3044108)();
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsxs)((0, $dd6c85c98a83b5b0$export$f5d03d415824e0e), {
        children: [
            toasts?.map(function({ id: id , title: title , description: description , action: action , icon: icon , ...props }) {
                const duration = props?.duration;
                // @ts-ignore
                if (Number.isInteger(duration) && duration <= 0) props.duration = 120000;
                let variantIcon = icon;
                switch(props.variant){
                    case "info":
                        variantIcon = /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $e5e99bf5f969d67a$export$2e2bcd8739ae039), {
                            size: 22
                        });
                        break;
                    case "success":
                        variantIcon = /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $75d764636bf7020f$export$2e2bcd8739ae039), {
                            size: 22
                        });
                        break;
                    case "warning":
                        variantIcon = /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $990c6c5a1af3c7cd$export$2e2bcd8739ae039), {
                            size: 22
                        });
                        break;
                    case "error":
                        variantIcon = /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $7fc7a48ba4f47b4b$export$2e2bcd8739ae039), {
                            size: 22
                        });
                        break;
                }
                props.className = (0, $66adb88ac93a30d5$export$1343a74baacb0543)(variantIcon && [
                    "has-variant-icon",
                    props.variant
                ], props.className);
                return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsxs)((0, $dd6c85c98a83b5b0$export$8d8dc7d5f743331b), {
                    ...props,
                    children: [
                        /*#__PURE__*/ (0, $59024eba873adb50$exports.jsxs)("div", {
                            className: "grid gap-1",
                            children: [
                                variantIcon && /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("span", {
                                    className: "variant-icon",
                                    children: variantIcon
                                }),
                                title && /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $dd6c85c98a83b5b0$export$16d42d7c29b95a4), {
                                    children: title
                                }),
                                description && /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $dd6c85c98a83b5b0$export$ecddd96c53621d9a), {
                                    children: description
                                })
                            ]
                        }),
                        action,
                        /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $dd6c85c98a83b5b0$export$811e70f61c205839), {})
                    ]
                }, id);
            }),
            /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $dd6c85c98a83b5b0$export$6192c2425ecfd989), {
                className: "ui__toaster-viewport"
            })
        ]
    });
}





var $LI8jA = parcelRequire("LI8jA");


const $9ea37f7f736d8afe$var$alertVariants = (0, $591c8f71196a9028$export$87dc52566e90b739)("ui__alert relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground", {
    variants: {
        variant: {
            default: "bg-background text-foreground",
            destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
const $9ea37f7f736d8afe$export$caec2af78bcc877f = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , variant: variant , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("div", {
        ref: ref,
        role: "alert",
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)($9ea37f7f736d8afe$var$alertVariants({
            variant: variant
        }), className),
        ...props
    }));
$9ea37f7f736d8afe$export$caec2af78bcc877f.displayName = "Alert";
const $9ea37f7f736d8afe$export$4a7253439a300753 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("h5", {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__alert-title mb-1 font-medium leading-none tracking-tight", className),
        ...props
    }));
$9ea37f7f736d8afe$export$4a7253439a300753.displayName = "AlertTitle";
const $9ea37f7f736d8afe$export$d4feae172fccda11 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("div", {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__alert-description text-sm [&_p]:leading-relaxed", className),
        ...props
    }));
$9ea37f7f736d8afe$export$d4feae172fccda11.displayName = "AlertDescription";



parcelRequire("LI8jA");


const $3e95e41b04524189$export$48443d129636634d = (0, $591c8f71196a9028$export$87dc52566e90b739)("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
    variants: {
        variant: {
            default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
            secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
            destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
            outline: "text-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
function $3e95e41b04524189$export$37acb3580601e69a({ className: className , variant: variant , ...props }) {
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("div", {
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__badge", $3e95e41b04524189$export$48443d129636634d({
            variant: variant
        }), className),
        ...props
    });
}




var $LI8jA = parcelRequire("LI8jA");


var $LI8jA = parcelRequire("LI8jA");
var $9d503234465cbf96$var$isCheckBoxInput = (element)=>element.type === "checkbox";
var $9d503234465cbf96$var$isDateObject = (value1)=>value1 instanceof Date;
var $9d503234465cbf96$var$isNullOrUndefined = (value1)=>value1 == null;
const $9d503234465cbf96$var$isObjectType = (value1)=>typeof value1 === "object";
var $9d503234465cbf96$var$isObject = (value1)=>!$9d503234465cbf96$var$isNullOrUndefined(value1) && !Array.isArray(value1) && $9d503234465cbf96$var$isObjectType(value1) && !$9d503234465cbf96$var$isDateObject(value1);
var $9d503234465cbf96$var$getEventValue = (event)=>$9d503234465cbf96$var$isObject(event) && event.target ? $9d503234465cbf96$var$isCheckBoxInput(event.target) ? event.target.checked : event.target.value : event;
var $9d503234465cbf96$var$getNodeParentName = (name)=>name.substring(0, name.search(/\.\d+(\.|$)/)) || name;
var $9d503234465cbf96$var$isNameInFieldArray = (names, name)=>names.has($9d503234465cbf96$var$getNodeParentName(name));
var $9d503234465cbf96$var$isPlainObject = (tempObject)=>{
    const prototypeCopy = tempObject.constructor && tempObject.constructor.prototype;
    return $9d503234465cbf96$var$isObject(prototypeCopy) && prototypeCopy.hasOwnProperty("isPrototypeOf");
};
var $9d503234465cbf96$var$isWeb = typeof window !== "undefined" && typeof window.HTMLElement !== "undefined" && typeof document !== "undefined";
function $9d503234465cbf96$var$cloneObject(data) {
    let copy;
    const isArray = Array.isArray(data);
    if (data instanceof Date) copy = new Date(data);
    else if (data instanceof Set) copy = new Set(data);
    else if (!($9d503234465cbf96$var$isWeb && (data instanceof Blob || data instanceof FileList)) && (isArray || $9d503234465cbf96$var$isObject(data))) {
        copy = isArray ? [] : {};
        if (!isArray && !$9d503234465cbf96$var$isPlainObject(data)) copy = data;
        else {
            for(const key in data)if (data.hasOwnProperty(key)) copy[key] = $9d503234465cbf96$var$cloneObject(data[key]);
        }
    } else return data;
    return copy;
}
var $9d503234465cbf96$var$compact = (value1)=>Array.isArray(value1) ? value1.filter(Boolean) : [];
var $9d503234465cbf96$var$isUndefined = (val)=>val === undefined;
var $9d503234465cbf96$export$3988ae62b71be9a3 = (obj, path, defaultValue)=>{
    if (!path || !$9d503234465cbf96$var$isObject(obj)) return defaultValue;
    const result = $9d503234465cbf96$var$compact(path.split(/[,[\].]+?/)).reduce((result, key)=>$9d503234465cbf96$var$isNullOrUndefined(result) ? result : result[key], obj);
    return $9d503234465cbf96$var$isUndefined(result) || result === obj ? $9d503234465cbf96$var$isUndefined(obj[path]) ? defaultValue : obj[path] : result;
};
var $9d503234465cbf96$var$isBoolean = (value1)=>typeof value1 === "boolean";
const $9d503234465cbf96$var$EVENTS = {
    BLUR: "blur",
    FOCUS_OUT: "focusout",
    CHANGE: "change"
};
const $9d503234465cbf96$var$VALIDATION_MODE = {
    onBlur: "onBlur",
    onChange: "onChange",
    onSubmit: "onSubmit",
    onTouched: "onTouched",
    all: "all"
};
const $9d503234465cbf96$var$INPUT_VALIDATION_RULES = {
    max: "max",
    min: "min",
    maxLength: "maxLength",
    minLength: "minLength",
    pattern: "pattern",
    required: "required",
    validate: "validate"
};
const $9d503234465cbf96$var$HookFormContext = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).createContext(null);
/**
 * This custom hook allows you to access the form context. useFormContext is intended to be used in deeply nested structures, where it would become inconvenient to pass the context as a prop. To be used with {@link FormProvider}.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/useformcontext) • [Demo](https://codesandbox.io/s/react-hook-form-v7-form-context-ytudi)
 *
 * @returns return all useForm methods
 *
 * @example
 * ```tsx
 * function App() {
 *   const methods = useForm();
 *   const onSubmit = data => console.log(data);
 *
 *   return (
 *     <FormProvider {...methods} >
 *       <form onSubmit={methods.handleSubmit(onSubmit)}>
 *         <NestedInput />
 *         <input type="submit" />
 *       </form>
 *     </FormProvider>
 *   );
 * }
 *
 *  function NestedInput() {
 *   const { register } = useFormContext(); // retrieve all hook methods
 *   return <input {...register("test")} />;
 * }
 * ```
 */ const $9d503234465cbf96$export$4d957a5e1be13b03 = ()=>(0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useContext($9d503234465cbf96$var$HookFormContext);
/**
 * A provider component that propagates the `useForm` methods to all children components via [React Context](https://reactjs.org/docs/context.html) API. To be used with {@link useFormContext}.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/useformcontext) • [Demo](https://codesandbox.io/s/react-hook-form-v7-form-context-ytudi)
 *
 * @param props - all useForm methods
 *
 * @example
 * ```tsx
 * function App() {
 *   const methods = useForm();
 *   const onSubmit = data => console.log(data);
 *
 *   return (
 *     <FormProvider {...methods} >
 *       <form onSubmit={methods.handleSubmit(onSubmit)}>
 *         <NestedInput />
 *         <input type="submit" />
 *       </form>
 *     </FormProvider>
 *   );
 * }
 *
 *  function NestedInput() {
 *   const { register } = useFormContext(); // retrieve all hook methods
 *   return <input {...register("test")} />;
 * }
 * ```
 */ const $9d503234465cbf96$export$8ce1ff4f94d08846 = (props)=>{
    const { children: children , ...data } = props;
    return (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).createElement($9d503234465cbf96$var$HookFormContext.Provider, {
        value: data
    }, children);
};
var $9d503234465cbf96$var$getProxyFormState = (formState, control, localProxyFormState, isRoot = true)=>{
    const result = {
        defaultValues: control._defaultValues
    };
    for(const key in formState)Object.defineProperty(result, key, {
        get: ()=>{
            const _key = key;
            if (control._proxyFormState[_key] !== $9d503234465cbf96$var$VALIDATION_MODE.all) control._proxyFormState[_key] = !isRoot || $9d503234465cbf96$var$VALIDATION_MODE.all;
            localProxyFormState && (localProxyFormState[_key] = true);
            return formState[_key];
        }
    });
    return result;
};
var $9d503234465cbf96$var$isEmptyObject = (value1)=>$9d503234465cbf96$var$isObject(value1) && !Object.keys(value1).length;
var $9d503234465cbf96$var$shouldRenderFormState = (formStateData, _proxyFormState, updateFormState, isRoot)=>{
    updateFormState(formStateData);
    const { name: name , ...formState } = formStateData;
    return $9d503234465cbf96$var$isEmptyObject(formState) || Object.keys(formState).length >= Object.keys(_proxyFormState).length || Object.keys(formState).find((key)=>_proxyFormState[key] === (!isRoot || $9d503234465cbf96$var$VALIDATION_MODE.all));
};
var $9d503234465cbf96$var$convertToArrayPayload = (value1)=>Array.isArray(value1) ? value1 : [
        value1
    ];
var $9d503234465cbf96$var$shouldSubscribeByName = (name, signalName, exact)=>!name || !signalName || name === signalName || $9d503234465cbf96$var$convertToArrayPayload(name).some((currentName)=>currentName && (exact ? currentName === signalName : currentName.startsWith(signalName) || signalName.startsWith(currentName)));
function $9d503234465cbf96$var$useSubscribe(props) {
    const _props = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(props);
    _props.current = props;
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
        const subscription = !props.disabled && _props.current.subject && _props.current.subject.subscribe({
            next: _props.current.next
        });
        return ()=>{
            subscription && subscription.unsubscribe();
        };
    }, [
        props.disabled
    ]);
}
/**
 * This custom hook allows you to subscribe to each form state, and isolate the re-render at the custom hook level. It has its scope in terms of form state subscription, so it would not affect other useFormState and useForm. Using this hook can reduce the re-render impact on large and complex form application.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/useformstate) • [Demo](https://codesandbox.io/s/useformstate-75xly)
 *
 * @param props - include options on specify fields to subscribe. {@link UseFormStateReturn}
 *
 * @example
 * ```tsx
 * function App() {
 *   const { register, handleSubmit, control } = useForm({
 *     defaultValues: {
 *     firstName: "firstName"
 *   }});
 *   const { dirtyFields } = useFormState({
 *     control
 *   });
 *   const onSubmit = (data) => console.log(data);
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input {...register("firstName")} placeholder="First Name" />
 *       {dirtyFields.firstName && <p>Field is dirty.</p>}
 *       <input type="submit" />
 *     </form>
 *   );
 * }
 * ```
 */ function $9d503234465cbf96$export$606f11b2eb45ecc6(props) {
    const methods = $9d503234465cbf96$export$4d957a5e1be13b03();
    const { control: control = methods.control , disabled: disabled , name: name , exact: exact  } = props || {};
    const [formState, updateFormState] = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useState(control._formState);
    const _mounted = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(true);
    const _localProxyFormState = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef({
        isDirty: false,
        isLoading: false,
        dirtyFields: false,
        touchedFields: false,
        isValidating: false,
        isValid: false,
        errors: false
    });
    const _name = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(name);
    _name.current = name;
    $9d503234465cbf96$var$useSubscribe({
        disabled: disabled,
        next: (value1)=>_mounted.current && $9d503234465cbf96$var$shouldSubscribeByName(_name.current, value1.name, exact) && $9d503234465cbf96$var$shouldRenderFormState(value1, _localProxyFormState.current, control._updateFormState) && updateFormState({
                ...control._formState,
                ...value1
            }),
        subject: control._subjects.state
    });
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
        _mounted.current = true;
        _localProxyFormState.current.isValid && control._updateValid(true);
        return ()=>{
            _mounted.current = false;
        };
    }, [
        control
    ]);
    return $9d503234465cbf96$var$getProxyFormState(formState, control, _localProxyFormState.current, false);
}
var $9d503234465cbf96$var$isString = (value1)=>typeof value1 === "string";
var $9d503234465cbf96$var$generateWatchOutput = (names, _names, formValues, isGlobal, defaultValue)=>{
    if ($9d503234465cbf96$var$isString(names)) {
        isGlobal && _names.watch.add(names);
        return $9d503234465cbf96$export$3988ae62b71be9a3(formValues, names, defaultValue);
    }
    if (Array.isArray(names)) return names.map((fieldName)=>(isGlobal && _names.watch.add(fieldName), $9d503234465cbf96$export$3988ae62b71be9a3(formValues, fieldName)));
    isGlobal && (_names.watchAll = true);
    return formValues;
};
/**
 * Custom hook to subscribe to field change and isolate re-rendering at the component level.
 *
 * @remarks
 *
 * [API](https://react-hook-form.com/docs/usewatch) • [Demo](https://codesandbox.io/s/react-hook-form-v7-ts-usewatch-h9i5e)
 *
 * @example
 * ```tsx
 * const { control } = useForm();
 * const values = useWatch({
 *   name: "fieldName"
 *   control,
 * })
 * ```
 */ function $9d503234465cbf96$export$3c773aa2b84f29e0(props) {
    const methods = $9d503234465cbf96$export$4d957a5e1be13b03();
    const { control: control = methods.control , name: name , defaultValue: defaultValue , disabled: disabled , exact: exact  } = props || {};
    const _name = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(name);
    _name.current = name;
    $9d503234465cbf96$var$useSubscribe({
        disabled: disabled,
        subject: control._subjects.values,
        next: (formState)=>{
            if ($9d503234465cbf96$var$shouldSubscribeByName(_name.current, formState.name, exact)) updateValue($9d503234465cbf96$var$cloneObject($9d503234465cbf96$var$generateWatchOutput(_name.current, control._names, formState.values || control._formValues, false, defaultValue)));
        }
    });
    const [value1, updateValue] = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useState(control._getWatch(name, defaultValue));
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>control._removeUnmounted());
    return value1;
}
var $9d503234465cbf96$var$isKey = (value1)=>/^\w*$/.test(value1);
var $9d503234465cbf96$var$stringToPath = (input)=>$9d503234465cbf96$var$compact(input.replace(/["|']|\]/g, "").split(/\.|\[/));
function $9d503234465cbf96$export$adaa4cf7ef1b65be(object, path, value1) {
    let index = -1;
    const tempPath = $9d503234465cbf96$var$isKey(path) ? [
        path
    ] : $9d503234465cbf96$var$stringToPath(path);
    const length = tempPath.length;
    const lastIndex = length - 1;
    while(++index < length){
        const key = tempPath[index];
        let newValue = value1;
        if (index !== lastIndex) {
            const objValue = object[key];
            newValue = $9d503234465cbf96$var$isObject(objValue) || Array.isArray(objValue) ? objValue : !isNaN(+tempPath[index + 1]) ? [] : {};
        }
        object[key] = newValue;
        object = object[key];
    }
    return object;
}
/**
 * Custom hook to work with controlled component, this function provide you with both form and field level state. Re-render is isolated at the hook level.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usecontroller) • [Demo](https://codesandbox.io/s/usecontroller-0o8px)
 *
 * @param props - the path name to the form field value, and validation rules.
 *
 * @returns field properties, field and form state. {@link UseControllerReturn}
 *
 * @example
 * ```tsx
 * function Input(props) {
 *   const { field, fieldState, formState } = useController(props);
 *   return (
 *     <div>
 *       <input {...field} placeholder={props.name} />
 *       <p>{fieldState.isTouched && "Touched"}</p>
 *       <p>{formState.isSubmitted ? "submitted" : ""}</p>
 *     </div>
 *   );
 * }
 * ```
 */ function $9d503234465cbf96$export$e8c786024a2b0a79(props) {
    const methods = $9d503234465cbf96$export$4d957a5e1be13b03();
    const { name: name , disabled: disabled , control: control = methods.control , shouldUnregister: shouldUnregister  } = props;
    const isArrayField = $9d503234465cbf96$var$isNameInFieldArray(control._names.array, name);
    const value1 = $9d503234465cbf96$export$3c773aa2b84f29e0({
        control: control,
        name: name,
        defaultValue: $9d503234465cbf96$export$3988ae62b71be9a3(control._formValues, name, $9d503234465cbf96$export$3988ae62b71be9a3(control._defaultValues, name, props.defaultValue)),
        exact: true
    });
    const formState = $9d503234465cbf96$export$606f11b2eb45ecc6({
        control: control,
        name: name
    });
    const _registerProps = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(control.register(name, {
        ...props.rules,
        value: value1
    }));
    _registerProps.current = control.register(name, props.rules);
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
        const _shouldUnregisterField = control._options.shouldUnregister || shouldUnregister;
        const updateMounted = (name, value1)=>{
            const field = $9d503234465cbf96$export$3988ae62b71be9a3(control._fields, name);
            if (field) field._f.mount = value1;
        };
        updateMounted(name, true);
        if (_shouldUnregisterField) {
            const value1 = $9d503234465cbf96$var$cloneObject($9d503234465cbf96$export$3988ae62b71be9a3(control._options.defaultValues, name));
            $9d503234465cbf96$export$adaa4cf7ef1b65be(control._defaultValues, name, value1);
            if ($9d503234465cbf96$var$isUndefined($9d503234465cbf96$export$3988ae62b71be9a3(control._formValues, name))) $9d503234465cbf96$export$adaa4cf7ef1b65be(control._formValues, name, value1);
        }
        return ()=>{
            (isArrayField ? _shouldUnregisterField && !control._state.action : _shouldUnregisterField) ? control.unregister(name) : updateMounted(name, false);
        };
    }, [
        name,
        control,
        isArrayField,
        shouldUnregister
    ]);
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
        if ($9d503234465cbf96$export$3988ae62b71be9a3(control._fields, name)) control._updateDisabledField({
            disabled: disabled,
            fields: control._fields,
            name: name,
            value: $9d503234465cbf96$export$3988ae62b71be9a3(control._fields, name)._f.value
        });
    }, [
        disabled,
        name,
        control
    ]);
    return {
        field: {
            name: name,
            value: value1,
            ...$9d503234465cbf96$var$isBoolean(disabled) || $9d503234465cbf96$var$isBoolean(formState.disabled) ? {
                disabled: formState.disabled || disabled
            } : {},
            onChange: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback((event)=>_registerProps.current.onChange({
                    target: {
                        value: $9d503234465cbf96$var$getEventValue(event),
                        name: name
                    },
                    type: $9d503234465cbf96$var$EVENTS.CHANGE
                }), [
                name
            ]),
            onBlur: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback(()=>_registerProps.current.onBlur({
                    target: {
                        value: $9d503234465cbf96$export$3988ae62b71be9a3(control._formValues, name),
                        name: name
                    },
                    type: $9d503234465cbf96$var$EVENTS.BLUR
                }), [
                name,
                control
            ]),
            ref: (elm)=>{
                const field = $9d503234465cbf96$export$3988ae62b71be9a3(control._fields, name);
                if (field && elm) field._f.ref = {
                    focus: ()=>elm.focus(),
                    select: ()=>elm.select(),
                    setCustomValidity: (message)=>elm.setCustomValidity(message),
                    reportValidity: ()=>elm.reportValidity()
                };
            }
        },
        formState: formState,
        fieldState: Object.defineProperties({}, {
            invalid: {
                enumerable: true,
                get: ()=>!!$9d503234465cbf96$export$3988ae62b71be9a3(formState.errors, name)
            },
            isDirty: {
                enumerable: true,
                get: ()=>!!$9d503234465cbf96$export$3988ae62b71be9a3(formState.dirtyFields, name)
            },
            isTouched: {
                enumerable: true,
                get: ()=>!!$9d503234465cbf96$export$3988ae62b71be9a3(formState.touchedFields, name)
            },
            error: {
                enumerable: true,
                get: ()=>$9d503234465cbf96$export$3988ae62b71be9a3(formState.errors, name)
            }
        })
    };
}
/**
 * Component based on `useController` hook to work with controlled component.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usecontroller/controller) • [Demo](https://codesandbox.io/s/react-hook-form-v6-controller-ts-jwyzw) • [Video](https://www.youtube.com/watch?v=N2UNk_UCVyA)
 *
 * @param props - the path name to the form field value, and validation rules.
 *
 * @returns provide field handler functions, field and form state.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { control } = useForm<FormValues>({
 *     defaultValues: {
 *       test: ""
 *     }
 *   });
 *
 *   return (
 *     <form>
 *       <Controller
 *         control={control}
 *         name="test"
 *         render={({ field: { onChange, onBlur, value, ref }, formState, fieldState }) => (
 *           <>
 *             <input
 *               onChange={onChange} // send value to hook form
 *               onBlur={onBlur} // notify when input is touched
 *               value={value} // return updated value
 *               ref={ref} // set ref for focus management
 *             />
 *             <p>{formState.isSubmitted ? "submitted" : ""}</p>
 *             <p>{fieldState.isTouched ? "touched" : ""}</p>
 *           </>
 *         )}
 *       />
 *     </form>
 *   );
 * }
 * ```
 */ const $9d503234465cbf96$export$bd0bf19f25da8474 = (props)=>props.render($9d503234465cbf96$export$e8c786024a2b0a79(props));
const $9d503234465cbf96$var$POST_REQUEST = "post";
/**
 * Form component to manage submission.
 *
 * @param props - to setup submission detail. {@link FormProps}
 *
 * @returns form component or headless render prop.
 *
 * @example
 * ```tsx
 * function App() {
 *   const { control, formState: { errors } } = useForm();
 *
 *   return (
 *     <Form action="/api" control={control}>
 *       <input {...register("name")} />
 *       <p>{errors?.root?.server && 'Server error'}</p>
 *       <button>Submit</button>
 *     </Form>
 *   );
 * }
 * ```
 */ function $9d503234465cbf96$export$a7fed597f4b8afd8(props) {
    const methods = $9d503234465cbf96$export$4d957a5e1be13b03();
    const [mounted, setMounted] = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useState(false);
    const { control: control = methods.control , onSubmit: onSubmit , children: children , action: action , method: method = $9d503234465cbf96$var$POST_REQUEST , headers: headers , encType: encType , onError: onError , render: render , onSuccess: onSuccess , validateStatus: validateStatus , ...rest } = props;
    const submit = async (event)=>{
        let hasError = false;
        let type = "";
        await control.handleSubmit(async (data)=>{
            const formData = new FormData();
            let formDataJson = "";
            try {
                formDataJson = JSON.stringify(data);
            } catch (_a) {}
            for (const name of control._names.mount)formData.append(name, $9d503234465cbf96$export$3988ae62b71be9a3(data, name));
            if (onSubmit) await onSubmit({
                data: data,
                event: event,
                method: method,
                formData: formData,
                formDataJson: formDataJson
            });
            if (action) try {
                const shouldStringifySubmissionData = [
                    headers && headers["Content-Type"],
                    encType
                ].some((value1)=>value1 && value1.includes("json"));
                const response = await fetch(action, {
                    method: method,
                    headers: {
                        ...headers,
                        ...encType ? {
                            "Content-Type": encType
                        } : {}
                    },
                    body: shouldStringifySubmissionData ? formDataJson : formData
                });
                if (response && (validateStatus ? !validateStatus(response.status) : response.status < 200 || response.status >= 300)) {
                    hasError = true;
                    onError && onError({
                        response: response
                    });
                    type = String(response.status);
                } else onSuccess && onSuccess({
                    response: response
                });
            } catch (error) {
                hasError = true;
                onError && onError({
                    error: error
                });
            }
        })(event);
        if (hasError && props.control) {
            props.control._subjects.state.next({
                isSubmitSuccessful: false
            });
            props.control.setError("root.server", {
                type: type
            });
        }
    };
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
        setMounted(true);
    }, []);
    return render ? (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).createElement((0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).Fragment, null, render({
        submit: submit
    })) : (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).createElement("form", {
        noValidate: mounted,
        action: action,
        method: method,
        encType: encType,
        onSubmit: submit,
        ...rest
    }, children);
}
var $9d503234465cbf96$export$b196c2a4f765bd30 = (name, validateAllFieldCriteria, errors, type, message)=>validateAllFieldCriteria ? {
        ...errors[name],
        types: {
            ...errors[name] && errors[name].types ? errors[name].types : {},
            [type]: message || true
        }
    } : {};
var $9d503234465cbf96$var$generateId = ()=>{
    const d = typeof performance === "undefined" ? Date.now() : performance.now() * 1000;
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c)=>{
        const r = (Math.random() * 16 + d) % 16 | 0;
        return (c == "x" ? r : r & 0x3 | 0x8).toString(16);
    });
};
var $9d503234465cbf96$var$getFocusFieldName = (name, index, options = {})=>options.shouldFocus || $9d503234465cbf96$var$isUndefined(options.shouldFocus) ? options.focusName || `${name}.${$9d503234465cbf96$var$isUndefined(options.focusIndex) ? index : options.focusIndex}.` : "";
var $9d503234465cbf96$var$getValidationModes = (mode)=>({
        isOnSubmit: !mode || mode === $9d503234465cbf96$var$VALIDATION_MODE.onSubmit,
        isOnBlur: mode === $9d503234465cbf96$var$VALIDATION_MODE.onBlur,
        isOnChange: mode === $9d503234465cbf96$var$VALIDATION_MODE.onChange,
        isOnAll: mode === $9d503234465cbf96$var$VALIDATION_MODE.all,
        isOnTouch: mode === $9d503234465cbf96$var$VALIDATION_MODE.onTouched
    });
var $9d503234465cbf96$var$isWatched = (name, _names, isBlurEvent)=>!isBlurEvent && (_names.watchAll || _names.watch.has(name) || [
        ..._names.watch
    ].some((watchName)=>name.startsWith(watchName) && /^\.\w+/.test(name.slice(watchName.length))));
const $9d503234465cbf96$var$iterateFieldsByAction = (fields, action, fieldsNames, abortEarly)=>{
    for (const key of fieldsNames || Object.keys(fields)){
        const field = $9d503234465cbf96$export$3988ae62b71be9a3(fields, key);
        if (field) {
            const { _f: _f , ...currentField } = field;
            if (_f) {
                if (_f.refs && _f.refs[0] && action(_f.refs[0], key) && !abortEarly) break;
                else if (_f.ref && action(_f.ref, _f.name) && !abortEarly) break;
            } else if ($9d503234465cbf96$var$isObject(currentField)) $9d503234465cbf96$var$iterateFieldsByAction(currentField, action);
        }
    }
};
var $9d503234465cbf96$var$updateFieldArrayRootError = (errors, error, name)=>{
    const fieldArrayErrors = $9d503234465cbf96$var$compact($9d503234465cbf96$export$3988ae62b71be9a3(errors, name));
    $9d503234465cbf96$export$adaa4cf7ef1b65be(fieldArrayErrors, "root", error[name]);
    $9d503234465cbf96$export$adaa4cf7ef1b65be(errors, name, fieldArrayErrors);
    return errors;
};
var $9d503234465cbf96$var$isFileInput = (element)=>element.type === "file";
var $9d503234465cbf96$var$isFunction = (value1)=>typeof value1 === "function";
var $9d503234465cbf96$var$isHTMLElement = (value1)=>{
    if (!$9d503234465cbf96$var$isWeb) return false;
    const owner = value1 ? value1.ownerDocument : 0;
    return value1 instanceof (owner && owner.defaultView ? owner.defaultView.HTMLElement : HTMLElement);
};
var $9d503234465cbf96$var$isMessage = (value1)=>$9d503234465cbf96$var$isString(value1);
var $9d503234465cbf96$var$isRadioInput = (element)=>element.type === "radio";
var $9d503234465cbf96$var$isRegex = (value1)=>value1 instanceof RegExp;
const $9d503234465cbf96$var$defaultResult = {
    value: false,
    isValid: false
};
const $9d503234465cbf96$var$validResult = {
    value: true,
    isValid: true
};
var $9d503234465cbf96$var$getCheckboxValue = (options)=>{
    if (Array.isArray(options)) {
        if (options.length > 1) {
            const values = options.filter((option)=>option && option.checked && !option.disabled).map((option)=>option.value);
            return {
                value: values,
                isValid: !!values.length
            };
        }
        return options[0].checked && !options[0].disabled ? options[0].attributes && !$9d503234465cbf96$var$isUndefined(options[0].attributes.value) ? $9d503234465cbf96$var$isUndefined(options[0].value) || options[0].value === "" ? $9d503234465cbf96$var$validResult : {
            value: options[0].value,
            isValid: true
        } : $9d503234465cbf96$var$validResult : $9d503234465cbf96$var$defaultResult;
    }
    return $9d503234465cbf96$var$defaultResult;
};
const $9d503234465cbf96$var$defaultReturn = {
    isValid: false,
    value: null
};
var $9d503234465cbf96$var$getRadioValue = (options)=>Array.isArray(options) ? options.reduce((previous, option)=>option && option.checked && !option.disabled ? {
            isValid: true,
            value: option.value
        } : previous, $9d503234465cbf96$var$defaultReturn) : $9d503234465cbf96$var$defaultReturn;
function $9d503234465cbf96$var$getValidateError(result, ref, type = "validate") {
    if ($9d503234465cbf96$var$isMessage(result) || Array.isArray(result) && result.every($9d503234465cbf96$var$isMessage) || $9d503234465cbf96$var$isBoolean(result) && !result) return {
        type: type,
        message: $9d503234465cbf96$var$isMessage(result) ? result : "",
        ref: ref
    };
}
var $9d503234465cbf96$var$getValueAndMessage = (validationData)=>$9d503234465cbf96$var$isObject(validationData) && !$9d503234465cbf96$var$isRegex(validationData) ? validationData : {
        value: validationData,
        message: ""
    };
var $9d503234465cbf96$var$validateField = async (field, formValues, validateAllFieldCriteria, shouldUseNativeValidation, isFieldArray)=>{
    const { ref: ref , refs: refs , required: required , maxLength: maxLength , minLength: minLength , min: min , max: max , pattern: pattern , validate: validate , name: name , valueAsNumber: valueAsNumber , mount: mount , disabled: disabled  } = field._f;
    const inputValue = $9d503234465cbf96$export$3988ae62b71be9a3(formValues, name);
    if (!mount || disabled) return {};
    const inputRef = refs ? refs[0] : ref;
    const setCustomValidity = (message)=>{
        if (shouldUseNativeValidation && inputRef.reportValidity) {
            inputRef.setCustomValidity($9d503234465cbf96$var$isBoolean(message) ? "" : message || "");
            inputRef.reportValidity();
        }
    };
    const error = {};
    const isRadio = $9d503234465cbf96$var$isRadioInput(ref);
    const isCheckBox = $9d503234465cbf96$var$isCheckBoxInput(ref);
    const isRadioOrCheckbox = isRadio || isCheckBox;
    const isEmpty = (valueAsNumber || $9d503234465cbf96$var$isFileInput(ref)) && $9d503234465cbf96$var$isUndefined(ref.value) && $9d503234465cbf96$var$isUndefined(inputValue) || $9d503234465cbf96$var$isHTMLElement(ref) && ref.value === "" || inputValue === "" || Array.isArray(inputValue) && !inputValue.length;
    const appendErrorsCurry = $9d503234465cbf96$export$b196c2a4f765bd30.bind(null, name, validateAllFieldCriteria, error);
    const getMinMaxMessage = (exceedMax, maxLengthMessage, minLengthMessage, maxType = $9d503234465cbf96$var$INPUT_VALIDATION_RULES.maxLength, minType = $9d503234465cbf96$var$INPUT_VALIDATION_RULES.minLength)=>{
        const message = exceedMax ? maxLengthMessage : minLengthMessage;
        error[name] = {
            type: exceedMax ? maxType : minType,
            message: message,
            ref: ref,
            ...appendErrorsCurry(exceedMax ? maxType : minType, message)
        };
    };
    if (isFieldArray ? !Array.isArray(inputValue) || !inputValue.length : required && (!isRadioOrCheckbox && (isEmpty || $9d503234465cbf96$var$isNullOrUndefined(inputValue)) || $9d503234465cbf96$var$isBoolean(inputValue) && !inputValue || isCheckBox && !$9d503234465cbf96$var$getCheckboxValue(refs).isValid || isRadio && !$9d503234465cbf96$var$getRadioValue(refs).isValid)) {
        const { value: value1 , message: message  } = $9d503234465cbf96$var$isMessage(required) ? {
            value: !!required,
            message: required
        } : $9d503234465cbf96$var$getValueAndMessage(required);
        if (value1) {
            error[name] = {
                type: $9d503234465cbf96$var$INPUT_VALIDATION_RULES.required,
                message: message,
                ref: inputRef,
                ...appendErrorsCurry($9d503234465cbf96$var$INPUT_VALIDATION_RULES.required, message)
            };
            if (!validateAllFieldCriteria) {
                setCustomValidity(message);
                return error;
            }
        }
    }
    if (!isEmpty && (!$9d503234465cbf96$var$isNullOrUndefined(min) || !$9d503234465cbf96$var$isNullOrUndefined(max))) {
        let exceedMax;
        let exceedMin;
        const maxOutput = $9d503234465cbf96$var$getValueAndMessage(max);
        const minOutput = $9d503234465cbf96$var$getValueAndMessage(min);
        if (!$9d503234465cbf96$var$isNullOrUndefined(inputValue) && !isNaN(inputValue)) {
            const valueNumber = ref.valueAsNumber || (inputValue ? +inputValue : inputValue);
            if (!$9d503234465cbf96$var$isNullOrUndefined(maxOutput.value)) exceedMax = valueNumber > maxOutput.value;
            if (!$9d503234465cbf96$var$isNullOrUndefined(minOutput.value)) exceedMin = valueNumber < minOutput.value;
        } else {
            const valueDate = ref.valueAsDate || new Date(inputValue);
            const convertTimeToDate = (time)=>new Date(new Date().toDateString() + " " + time);
            const isTime = ref.type == "time";
            const isWeek = ref.type == "week";
            if ($9d503234465cbf96$var$isString(maxOutput.value) && inputValue) exceedMax = isTime ? convertTimeToDate(inputValue) > convertTimeToDate(maxOutput.value) : isWeek ? inputValue > maxOutput.value : valueDate > new Date(maxOutput.value);
            if ($9d503234465cbf96$var$isString(minOutput.value) && inputValue) exceedMin = isTime ? convertTimeToDate(inputValue) < convertTimeToDate(minOutput.value) : isWeek ? inputValue < minOutput.value : valueDate < new Date(minOutput.value);
        }
        if (exceedMax || exceedMin) {
            getMinMaxMessage(!!exceedMax, maxOutput.message, minOutput.message, $9d503234465cbf96$var$INPUT_VALIDATION_RULES.max, $9d503234465cbf96$var$INPUT_VALIDATION_RULES.min);
            if (!validateAllFieldCriteria) {
                setCustomValidity(error[name].message);
                return error;
            }
        }
    }
    if ((maxLength || minLength) && !isEmpty && ($9d503234465cbf96$var$isString(inputValue) || isFieldArray && Array.isArray(inputValue))) {
        const maxLengthOutput = $9d503234465cbf96$var$getValueAndMessage(maxLength);
        const minLengthOutput = $9d503234465cbf96$var$getValueAndMessage(minLength);
        const exceedMax = !$9d503234465cbf96$var$isNullOrUndefined(maxLengthOutput.value) && inputValue.length > +maxLengthOutput.value;
        const exceedMin = !$9d503234465cbf96$var$isNullOrUndefined(minLengthOutput.value) && inputValue.length < +minLengthOutput.value;
        if (exceedMax || exceedMin) {
            getMinMaxMessage(exceedMax, maxLengthOutput.message, minLengthOutput.message);
            if (!validateAllFieldCriteria) {
                setCustomValidity(error[name].message);
                return error;
            }
        }
    }
    if (pattern && !isEmpty && $9d503234465cbf96$var$isString(inputValue)) {
        const { value: patternValue , message: message  } = $9d503234465cbf96$var$getValueAndMessage(pattern);
        if ($9d503234465cbf96$var$isRegex(patternValue) && !inputValue.match(patternValue)) {
            error[name] = {
                type: $9d503234465cbf96$var$INPUT_VALIDATION_RULES.pattern,
                message: message,
                ref: ref,
                ...appendErrorsCurry($9d503234465cbf96$var$INPUT_VALIDATION_RULES.pattern, message)
            };
            if (!validateAllFieldCriteria) {
                setCustomValidity(message);
                return error;
            }
        }
    }
    if (validate) {
        if ($9d503234465cbf96$var$isFunction(validate)) {
            const result = await validate(inputValue, formValues);
            const validateError = $9d503234465cbf96$var$getValidateError(result, inputRef);
            if (validateError) {
                error[name] = {
                    ...validateError,
                    ...appendErrorsCurry($9d503234465cbf96$var$INPUT_VALIDATION_RULES.validate, validateError.message)
                };
                if (!validateAllFieldCriteria) {
                    setCustomValidity(validateError.message);
                    return error;
                }
            }
        } else if ($9d503234465cbf96$var$isObject(validate)) {
            let validationResult = {};
            for(const key in validate){
                if (!$9d503234465cbf96$var$isEmptyObject(validationResult) && !validateAllFieldCriteria) break;
                const validateError = $9d503234465cbf96$var$getValidateError(await validate[key](inputValue, formValues), inputRef, key);
                if (validateError) {
                    validationResult = {
                        ...validateError,
                        ...appendErrorsCurry(key, validateError.message)
                    };
                    setCustomValidity(validateError.message);
                    if (validateAllFieldCriteria) error[name] = validationResult;
                }
            }
            if (!$9d503234465cbf96$var$isEmptyObject(validationResult)) {
                error[name] = {
                    ref: inputRef,
                    ...validationResult
                };
                if (!validateAllFieldCriteria) return error;
            }
        }
    }
    setCustomValidity(true);
    return error;
};
function $9d503234465cbf96$var$append(data, value1) {
    return [
        ...data,
        ...$9d503234465cbf96$var$convertToArrayPayload(value1)
    ];
}
var $9d503234465cbf96$var$fillEmptyArray = (value1)=>Array.isArray(value1) ? value1.map(()=>undefined) : undefined;
function $9d503234465cbf96$var$insert(data, index, value1) {
    return [
        ...data.slice(0, index),
        ...$9d503234465cbf96$var$convertToArrayPayload(value1),
        ...data.slice(index)
    ];
}
var $9d503234465cbf96$var$moveArrayAt = (data, from, to)=>{
    if (!Array.isArray(data)) return [];
    if ($9d503234465cbf96$var$isUndefined(data[to])) data[to] = undefined;
    data.splice(to, 0, data.splice(from, 1)[0]);
    return data;
};
function $9d503234465cbf96$var$prepend(data, value1) {
    return [
        ...$9d503234465cbf96$var$convertToArrayPayload(value1),
        ...$9d503234465cbf96$var$convertToArrayPayload(data)
    ];
}
function $9d503234465cbf96$var$removeAtIndexes(data, indexes) {
    let i = 0;
    const temp = [
        ...data
    ];
    for (const index of indexes){
        temp.splice(index - i, 1);
        i++;
    }
    return $9d503234465cbf96$var$compact(temp).length ? temp : [];
}
var $9d503234465cbf96$var$removeArrayAt = (data, index)=>$9d503234465cbf96$var$isUndefined(index) ? [] : $9d503234465cbf96$var$removeAtIndexes(data, $9d503234465cbf96$var$convertToArrayPayload(index).sort((a, b)=>a - b));
var $9d503234465cbf96$var$swapArrayAt = (data, indexA, indexB)=>{
    data[indexA] = [
        data[indexB],
        data[indexB] = data[indexA]
    ][0];
};
function $9d503234465cbf96$var$baseGet(object, updatePath) {
    const length = updatePath.slice(0, -1).length;
    let index = 0;
    while(index < length)object = $9d503234465cbf96$var$isUndefined(object) ? index++ : object[updatePath[index++]];
    return object;
}
function $9d503234465cbf96$var$isEmptyArray(obj) {
    for(const key in obj){
        if (obj.hasOwnProperty(key) && !$9d503234465cbf96$var$isUndefined(obj[key])) return false;
    }
    return true;
}
function $9d503234465cbf96$var$unset(object, path) {
    const paths = Array.isArray(path) ? path : $9d503234465cbf96$var$isKey(path) ? [
        path
    ] : $9d503234465cbf96$var$stringToPath(path);
    const childObject = paths.length === 1 ? object : $9d503234465cbf96$var$baseGet(object, paths);
    const index = paths.length - 1;
    const key = paths[index];
    if (childObject) delete childObject[key];
    if (index !== 0 && ($9d503234465cbf96$var$isObject(childObject) && $9d503234465cbf96$var$isEmptyObject(childObject) || Array.isArray(childObject) && $9d503234465cbf96$var$isEmptyArray(childObject))) $9d503234465cbf96$var$unset(object, paths.slice(0, -1));
    return object;
}
var $9d503234465cbf96$var$updateAt = (fieldValues, index, value1)=>{
    fieldValues[index] = value1;
    return fieldValues;
};
/**
 * A custom hook that exposes convenient methods to perform operations with a list of dynamic inputs that need to be appended, updated, removed etc. • [Demo](https://codesandbox.io/s/react-hook-form-usefieldarray-ssugn) • [Video](https://youtu.be/4MrbfGSFY2A)
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/usefieldarray) • [Demo](https://codesandbox.io/s/react-hook-form-usefieldarray-ssugn)
 *
 * @param props - useFieldArray props
 *
 * @returns methods - functions to manipulate with the Field Arrays (dynamic inputs) {@link UseFieldArrayReturn}
 *
 * @example
 * ```tsx
 * function App() {
 *   const { register, control, handleSubmit, reset, trigger, setError } = useForm({
 *     defaultValues: {
 *       test: []
 *     }
 *   });
 *   const { fields, append } = useFieldArray({
 *     control,
 *     name: "test"
 *   });
 *
 *   return (
 *     <form onSubmit={handleSubmit(data => console.log(data))}>
 *       {fields.map((item, index) => (
 *          <input key={item.id} {...register(`test.${index}.firstName`)}  />
 *       ))}
 *       <button type="button" onClick={() => append({ firstName: "bill" })}>
 *         append
 *       </button>
 *       <input type="submit" />
 *     </form>
 *   );
 * }
 * ```
 */ function $9d503234465cbf96$export$310131896651d559(props) {
    const methods = $9d503234465cbf96$export$4d957a5e1be13b03();
    const { control: control = methods.control , name: name , keyName: keyName = "id" , shouldUnregister: shouldUnregister  } = props;
    const [fields, setFields] = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useState(control._getFieldArray(name));
    const ids = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(control._getFieldArray(name).map($9d503234465cbf96$var$generateId));
    const _fieldIds = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(fields);
    const _name = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(name);
    const _actioned = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef(false);
    _name.current = name;
    _fieldIds.current = fields;
    control._names.array.add(name);
    props.rules && control.register(name, props.rules);
    $9d503234465cbf96$var$useSubscribe({
        next: ({ values: values , name: fieldArrayName  })=>{
            if (fieldArrayName === _name.current || !fieldArrayName) {
                const fieldValues = $9d503234465cbf96$export$3988ae62b71be9a3(values, _name.current);
                if (Array.isArray(fieldValues)) {
                    setFields(fieldValues);
                    ids.current = fieldValues.map($9d503234465cbf96$var$generateId);
                }
            }
        },
        subject: control._subjects.array
    });
    const updateValues = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback((updatedFieldArrayValues)=>{
        _actioned.current = true;
        control._updateFieldArray(name, updatedFieldArrayValues);
    }, [
        control,
        name
    ]);
    const append$1 = (value1, options)=>{
        const appendValue = $9d503234465cbf96$var$convertToArrayPayload($9d503234465cbf96$var$cloneObject(value1));
        const updatedFieldArrayValues = $9d503234465cbf96$var$append(control._getFieldArray(name), appendValue);
        control._names.focus = $9d503234465cbf96$var$getFocusFieldName(name, updatedFieldArrayValues.length - 1, options);
        ids.current = $9d503234465cbf96$var$append(ids.current, appendValue.map($9d503234465cbf96$var$generateId));
        updateValues(updatedFieldArrayValues);
        setFields(updatedFieldArrayValues);
        control._updateFieldArray(name, updatedFieldArrayValues, $9d503234465cbf96$var$append, {
            argA: $9d503234465cbf96$var$fillEmptyArray(value1)
        });
    };
    const prepend$1 = (value1, options)=>{
        const prependValue = $9d503234465cbf96$var$convertToArrayPayload($9d503234465cbf96$var$cloneObject(value1));
        const updatedFieldArrayValues = $9d503234465cbf96$var$prepend(control._getFieldArray(name), prependValue);
        control._names.focus = $9d503234465cbf96$var$getFocusFieldName(name, 0, options);
        ids.current = $9d503234465cbf96$var$prepend(ids.current, prependValue.map($9d503234465cbf96$var$generateId));
        updateValues(updatedFieldArrayValues);
        setFields(updatedFieldArrayValues);
        control._updateFieldArray(name, updatedFieldArrayValues, $9d503234465cbf96$var$prepend, {
            argA: $9d503234465cbf96$var$fillEmptyArray(value1)
        });
    };
    const remove = (index)=>{
        const updatedFieldArrayValues = $9d503234465cbf96$var$removeArrayAt(control._getFieldArray(name), index);
        ids.current = $9d503234465cbf96$var$removeArrayAt(ids.current, index);
        updateValues(updatedFieldArrayValues);
        setFields(updatedFieldArrayValues);
        control._updateFieldArray(name, updatedFieldArrayValues, $9d503234465cbf96$var$removeArrayAt, {
            argA: index
        });
    };
    const insert$1 = (index, value1, options)=>{
        const insertValue = $9d503234465cbf96$var$convertToArrayPayload($9d503234465cbf96$var$cloneObject(value1));
        const updatedFieldArrayValues = $9d503234465cbf96$var$insert(control._getFieldArray(name), index, insertValue);
        control._names.focus = $9d503234465cbf96$var$getFocusFieldName(name, index, options);
        ids.current = $9d503234465cbf96$var$insert(ids.current, index, insertValue.map($9d503234465cbf96$var$generateId));
        updateValues(updatedFieldArrayValues);
        setFields(updatedFieldArrayValues);
        control._updateFieldArray(name, updatedFieldArrayValues, $9d503234465cbf96$var$insert, {
            argA: index,
            argB: $9d503234465cbf96$var$fillEmptyArray(value1)
        });
    };
    const swap = (indexA, indexB)=>{
        const updatedFieldArrayValues = control._getFieldArray(name);
        $9d503234465cbf96$var$swapArrayAt(updatedFieldArrayValues, indexA, indexB);
        $9d503234465cbf96$var$swapArrayAt(ids.current, indexA, indexB);
        updateValues(updatedFieldArrayValues);
        setFields(updatedFieldArrayValues);
        control._updateFieldArray(name, updatedFieldArrayValues, $9d503234465cbf96$var$swapArrayAt, {
            argA: indexA,
            argB: indexB
        }, false);
    };
    const move = (from, to)=>{
        const updatedFieldArrayValues = control._getFieldArray(name);
        $9d503234465cbf96$var$moveArrayAt(updatedFieldArrayValues, from, to);
        $9d503234465cbf96$var$moveArrayAt(ids.current, from, to);
        updateValues(updatedFieldArrayValues);
        setFields(updatedFieldArrayValues);
        control._updateFieldArray(name, updatedFieldArrayValues, $9d503234465cbf96$var$moveArrayAt, {
            argA: from,
            argB: to
        }, false);
    };
    const update = (index, value1)=>{
        const updateValue = $9d503234465cbf96$var$cloneObject(value1);
        const updatedFieldArrayValues = $9d503234465cbf96$var$updateAt(control._getFieldArray(name), index, updateValue);
        ids.current = [
            ...updatedFieldArrayValues
        ].map((item, i)=>!item || i === index ? $9d503234465cbf96$var$generateId() : ids.current[i]);
        updateValues(updatedFieldArrayValues);
        setFields([
            ...updatedFieldArrayValues
        ]);
        control._updateFieldArray(name, updatedFieldArrayValues, $9d503234465cbf96$var$updateAt, {
            argA: index,
            argB: updateValue
        }, true, false);
    };
    const replace = (value1)=>{
        const updatedFieldArrayValues = $9d503234465cbf96$var$convertToArrayPayload($9d503234465cbf96$var$cloneObject(value1));
        ids.current = updatedFieldArrayValues.map($9d503234465cbf96$var$generateId);
        updateValues([
            ...updatedFieldArrayValues
        ]);
        setFields([
            ...updatedFieldArrayValues
        ]);
        control._updateFieldArray(name, [
            ...updatedFieldArrayValues
        ], (data)=>data, {}, true, false);
    };
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
        control._state.action = false;
        $9d503234465cbf96$var$isWatched(name, control._names) && control._subjects.state.next({
            ...control._formState
        });
        if (_actioned.current && (!$9d503234465cbf96$var$getValidationModes(control._options.mode).isOnSubmit || control._formState.isSubmitted)) {
            if (control._options.resolver) control._executeSchema([
                name
            ]).then((result)=>{
                const error = $9d503234465cbf96$export$3988ae62b71be9a3(result.errors, name);
                const existingError = $9d503234465cbf96$export$3988ae62b71be9a3(control._formState.errors, name);
                if (existingError ? !error && existingError.type || error && (existingError.type !== error.type || existingError.message !== error.message) : error && error.type) {
                    error ? $9d503234465cbf96$export$adaa4cf7ef1b65be(control._formState.errors, name, error) : $9d503234465cbf96$var$unset(control._formState.errors, name);
                    control._subjects.state.next({
                        errors: control._formState.errors
                    });
                }
            });
            else {
                const field = $9d503234465cbf96$export$3988ae62b71be9a3(control._fields, name);
                if (field && field._f) $9d503234465cbf96$var$validateField(field, control._formValues, control._options.criteriaMode === $9d503234465cbf96$var$VALIDATION_MODE.all, control._options.shouldUseNativeValidation, true).then((error)=>!$9d503234465cbf96$var$isEmptyObject(error) && control._subjects.state.next({
                        errors: $9d503234465cbf96$var$updateFieldArrayRootError(control._formState.errors, error, name)
                    }));
            }
        }
        control._subjects.values.next({
            name: name,
            values: {
                ...control._formValues
            }
        });
        control._names.focus && $9d503234465cbf96$var$iterateFieldsByAction(control._fields, (ref, key)=>{
            if (control._names.focus && key.startsWith(control._names.focus) && ref.focus) {
                ref.focus();
                return 1;
            }
            return;
        });
        control._names.focus = "";
        control._updateValid();
        _actioned.current = false;
    }, [
        fields,
        name,
        control
    ]);
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
        !$9d503234465cbf96$export$3988ae62b71be9a3(control._formValues, name) && control._updateFieldArray(name);
        return ()=>{
            (control._options.shouldUnregister || shouldUnregister) && control.unregister(name);
        };
    }, [
        name,
        control,
        keyName,
        shouldUnregister
    ]);
    return {
        swap: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback(swap, [
            updateValues,
            name,
            control
        ]),
        move: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback(move, [
            updateValues,
            name,
            control
        ]),
        prepend: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback(prepend$1, [
            updateValues,
            name,
            control
        ]),
        append: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback(append$1, [
            updateValues,
            name,
            control
        ]),
        remove: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback(remove, [
            updateValues,
            name,
            control
        ]),
        insert: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback(insert$1, [
            updateValues,
            name,
            control
        ]),
        update: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback(update, [
            updateValues,
            name,
            control
        ]),
        replace: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useCallback(replace, [
            updateValues,
            name,
            control
        ]),
        fields: (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useMemo(()=>fields.map((field, index)=>({
                    ...field,
                    [keyName]: ids.current[index] || $9d503234465cbf96$var$generateId()
                })), [
            fields,
            keyName
        ])
    };
}
function $9d503234465cbf96$var$createSubject() {
    let _observers = [];
    const next = (value1)=>{
        for (const observer of _observers)observer.next && observer.next(value1);
    };
    const subscribe = (observer)=>{
        _observers.push(observer);
        return {
            unsubscribe: ()=>{
                _observers = _observers.filter((o)=>o !== observer);
            }
        };
    };
    const unsubscribe = ()=>{
        _observers = [];
    };
    return {
        get observers () {
            return _observers;
        },
        next: next,
        subscribe: subscribe,
        unsubscribe: unsubscribe
    };
}
var $9d503234465cbf96$var$isPrimitive = (value1)=>$9d503234465cbf96$var$isNullOrUndefined(value1) || !$9d503234465cbf96$var$isObjectType(value1);
function $9d503234465cbf96$var$deepEqual(object1, object2) {
    if ($9d503234465cbf96$var$isPrimitive(object1) || $9d503234465cbf96$var$isPrimitive(object2)) return object1 === object2;
    if ($9d503234465cbf96$var$isDateObject(object1) && $9d503234465cbf96$var$isDateObject(object2)) return object1.getTime() === object2.getTime();
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) return false;
    for (const key of keys1){
        const val1 = object1[key];
        if (!keys2.includes(key)) return false;
        if (key !== "ref") {
            const val2 = object2[key];
            if ($9d503234465cbf96$var$isDateObject(val1) && $9d503234465cbf96$var$isDateObject(val2) || $9d503234465cbf96$var$isObject(val1) && $9d503234465cbf96$var$isObject(val2) || Array.isArray(val1) && Array.isArray(val2) ? !$9d503234465cbf96$var$deepEqual(val1, val2) : val1 !== val2) return false;
        }
    }
    return true;
}
var $9d503234465cbf96$var$isMultipleSelect = (element)=>element.type === `select-multiple`;
var $9d503234465cbf96$var$isRadioOrCheckbox = (ref)=>$9d503234465cbf96$var$isRadioInput(ref) || $9d503234465cbf96$var$isCheckBoxInput(ref);
var $9d503234465cbf96$var$live = (ref)=>$9d503234465cbf96$var$isHTMLElement(ref) && ref.isConnected;
var $9d503234465cbf96$var$objectHasFunction = (data)=>{
    for(const key in data){
        if ($9d503234465cbf96$var$isFunction(data[key])) return true;
    }
    return false;
};
function $9d503234465cbf96$var$markFieldsDirty(data, fields = {}) {
    const isParentNodeArray = Array.isArray(data);
    if ($9d503234465cbf96$var$isObject(data) || isParentNodeArray) for(const key in data){
        if (Array.isArray(data[key]) || $9d503234465cbf96$var$isObject(data[key]) && !$9d503234465cbf96$var$objectHasFunction(data[key])) {
            fields[key] = Array.isArray(data[key]) ? [] : {};
            $9d503234465cbf96$var$markFieldsDirty(data[key], fields[key]);
        } else if (!$9d503234465cbf96$var$isNullOrUndefined(data[key])) fields[key] = true;
    }
    return fields;
}
function $9d503234465cbf96$var$getDirtyFieldsFromDefaultValues(data, formValues, dirtyFieldsFromValues) {
    const isParentNodeArray = Array.isArray(data);
    if ($9d503234465cbf96$var$isObject(data) || isParentNodeArray) {
        for(const key in data)if (Array.isArray(data[key]) || $9d503234465cbf96$var$isObject(data[key]) && !$9d503234465cbf96$var$objectHasFunction(data[key])) {
            if ($9d503234465cbf96$var$isUndefined(formValues) || $9d503234465cbf96$var$isPrimitive(dirtyFieldsFromValues[key])) dirtyFieldsFromValues[key] = Array.isArray(data[key]) ? $9d503234465cbf96$var$markFieldsDirty(data[key], []) : {
                ...$9d503234465cbf96$var$markFieldsDirty(data[key])
            };
            else $9d503234465cbf96$var$getDirtyFieldsFromDefaultValues(data[key], $9d503234465cbf96$var$isNullOrUndefined(formValues) ? {} : formValues[key], dirtyFieldsFromValues[key]);
        } else dirtyFieldsFromValues[key] = !$9d503234465cbf96$var$deepEqual(data[key], formValues[key]);
    }
    return dirtyFieldsFromValues;
}
var $9d503234465cbf96$var$getDirtyFields = (defaultValues, formValues)=>$9d503234465cbf96$var$getDirtyFieldsFromDefaultValues(defaultValues, formValues, $9d503234465cbf96$var$markFieldsDirty(formValues));
var $9d503234465cbf96$var$getFieldValueAs = (value1, { valueAsNumber: valueAsNumber , valueAsDate: valueAsDate , setValueAs: setValueAs  })=>$9d503234465cbf96$var$isUndefined(value1) ? value1 : valueAsNumber ? value1 === "" ? NaN : value1 ? +value1 : value1 : valueAsDate && $9d503234465cbf96$var$isString(value1) ? new Date(value1) : setValueAs ? setValueAs(value1) : value1;
function $9d503234465cbf96$var$getFieldValue(_f) {
    const ref = _f.ref;
    if (_f.refs ? _f.refs.every((ref)=>ref.disabled) : ref.disabled) return;
    if ($9d503234465cbf96$var$isFileInput(ref)) return ref.files;
    if ($9d503234465cbf96$var$isRadioInput(ref)) return $9d503234465cbf96$var$getRadioValue(_f.refs).value;
    if ($9d503234465cbf96$var$isMultipleSelect(ref)) return [
        ...ref.selectedOptions
    ].map(({ value: value1  })=>value1);
    if ($9d503234465cbf96$var$isCheckBoxInput(ref)) return $9d503234465cbf96$var$getCheckboxValue(_f.refs).value;
    return $9d503234465cbf96$var$getFieldValueAs($9d503234465cbf96$var$isUndefined(ref.value) ? _f.ref.value : ref.value, _f);
}
var $9d503234465cbf96$var$getResolverOptions = (fieldsNames, _fields, criteriaMode, shouldUseNativeValidation)=>{
    const fields = {};
    for (const name of fieldsNames){
        const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name);
        field && $9d503234465cbf96$export$adaa4cf7ef1b65be(fields, name, field._f);
    }
    return {
        criteriaMode: criteriaMode,
        names: [
            ...fieldsNames
        ],
        fields: fields,
        shouldUseNativeValidation: shouldUseNativeValidation
    };
};
var $9d503234465cbf96$var$getRuleValue = (rule)=>$9d503234465cbf96$var$isUndefined(rule) ? rule : $9d503234465cbf96$var$isRegex(rule) ? rule.source : $9d503234465cbf96$var$isObject(rule) ? $9d503234465cbf96$var$isRegex(rule.value) ? rule.value.source : rule.value : rule;
var $9d503234465cbf96$var$hasValidation = (options)=>options.mount && (options.required || options.min || options.max || options.maxLength || options.minLength || options.pattern || options.validate);
function $9d503234465cbf96$var$schemaErrorLookup(errors, _fields, name) {
    const error = $9d503234465cbf96$export$3988ae62b71be9a3(errors, name);
    if (error || $9d503234465cbf96$var$isKey(name)) return {
        error: error,
        name: name
    };
    const names = name.split(".");
    while(names.length){
        const fieldName = names.join(".");
        const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, fieldName);
        const foundError = $9d503234465cbf96$export$3988ae62b71be9a3(errors, fieldName);
        if (field && !Array.isArray(field) && name !== fieldName) return {
            name: name
        };
        if (foundError && foundError.type) return {
            name: fieldName,
            error: foundError
        };
        names.pop();
    }
    return {
        name: name
    };
}
var $9d503234465cbf96$var$skipValidation = (isBlurEvent, isTouched, isSubmitted, reValidateMode, mode)=>{
    if (mode.isOnAll) return false;
    else if (!isSubmitted && mode.isOnTouch) return !(isTouched || isBlurEvent);
    else if (isSubmitted ? reValidateMode.isOnBlur : mode.isOnBlur) return !isBlurEvent;
    else if (isSubmitted ? reValidateMode.isOnChange : mode.isOnChange) return isBlurEvent;
    return true;
};
var $9d503234465cbf96$var$unsetEmptyArray = (ref, name)=>!$9d503234465cbf96$var$compact($9d503234465cbf96$export$3988ae62b71be9a3(ref, name)).length && $9d503234465cbf96$var$unset(ref, name);
const $9d503234465cbf96$var$defaultOptions = {
    mode: $9d503234465cbf96$var$VALIDATION_MODE.onSubmit,
    reValidateMode: $9d503234465cbf96$var$VALIDATION_MODE.onChange,
    shouldFocusError: true
};
function $9d503234465cbf96$var$createFormControl(props = {}, flushRootRender) {
    let _options = {
        ...$9d503234465cbf96$var$defaultOptions,
        ...props
    };
    let _formState = {
        submitCount: 0,
        isDirty: false,
        isLoading: $9d503234465cbf96$var$isFunction(_options.defaultValues),
        isValidating: false,
        isSubmitted: false,
        isSubmitting: false,
        isSubmitSuccessful: false,
        isValid: false,
        touchedFields: {},
        dirtyFields: {},
        errors: {},
        disabled: false
    };
    let _fields = {};
    let _defaultValues = $9d503234465cbf96$var$isObject(_options.defaultValues) || $9d503234465cbf96$var$isObject(_options.values) ? $9d503234465cbf96$var$cloneObject(_options.defaultValues || _options.values) || {} : {};
    let _formValues = _options.shouldUnregister ? {} : $9d503234465cbf96$var$cloneObject(_defaultValues);
    let _state = {
        action: false,
        mount: false,
        watch: false
    };
    let _names = {
        mount: new Set(),
        unMount: new Set(),
        array: new Set(),
        watch: new Set()
    };
    let delayErrorCallback;
    let timer = 0;
    const _proxyFormState = {
        isDirty: false,
        dirtyFields: false,
        touchedFields: false,
        isValidating: false,
        isValid: false,
        errors: false
    };
    const _subjects = {
        values: $9d503234465cbf96$var$createSubject(),
        array: $9d503234465cbf96$var$createSubject(),
        state: $9d503234465cbf96$var$createSubject()
    };
    const shouldCaptureDirtyFields = props.resetOptions && props.resetOptions.keepDirtyValues;
    const validationModeBeforeSubmit = $9d503234465cbf96$var$getValidationModes(_options.mode);
    const validationModeAfterSubmit = $9d503234465cbf96$var$getValidationModes(_options.reValidateMode);
    const shouldDisplayAllAssociatedErrors = _options.criteriaMode === $9d503234465cbf96$var$VALIDATION_MODE.all;
    const debounce = (callback)=>(wait)=>{
            clearTimeout(timer);
            timer = setTimeout(callback, wait);
        };
    const _updateValid = async (shouldUpdateValid)=>{
        if (_proxyFormState.isValid || shouldUpdateValid) {
            const isValid = _options.resolver ? $9d503234465cbf96$var$isEmptyObject((await _executeSchema()).errors) : await executeBuiltInValidation(_fields, true);
            if (isValid !== _formState.isValid) _subjects.state.next({
                isValid: isValid
            });
        }
    };
    const _updateIsValidating = (value1)=>_proxyFormState.isValidating && _subjects.state.next({
            isValidating: value1
        });
    const _updateFieldArray = (name, values = [], method, args, shouldSetValues = true, shouldUpdateFieldsAndState = true)=>{
        if (args && method) {
            _state.action = true;
            if (shouldUpdateFieldsAndState && Array.isArray($9d503234465cbf96$export$3988ae62b71be9a3(_fields, name))) {
                const fieldValues = method($9d503234465cbf96$export$3988ae62b71be9a3(_fields, name), args.argA, args.argB);
                shouldSetValues && $9d503234465cbf96$export$adaa4cf7ef1b65be(_fields, name, fieldValues);
            }
            if (shouldUpdateFieldsAndState && Array.isArray($9d503234465cbf96$export$3988ae62b71be9a3(_formState.errors, name))) {
                const errors = method($9d503234465cbf96$export$3988ae62b71be9a3(_formState.errors, name), args.argA, args.argB);
                shouldSetValues && $9d503234465cbf96$export$adaa4cf7ef1b65be(_formState.errors, name, errors);
                $9d503234465cbf96$var$unsetEmptyArray(_formState.errors, name);
            }
            if (_proxyFormState.touchedFields && shouldUpdateFieldsAndState && Array.isArray($9d503234465cbf96$export$3988ae62b71be9a3(_formState.touchedFields, name))) {
                const touchedFields = method($9d503234465cbf96$export$3988ae62b71be9a3(_formState.touchedFields, name), args.argA, args.argB);
                shouldSetValues && $9d503234465cbf96$export$adaa4cf7ef1b65be(_formState.touchedFields, name, touchedFields);
            }
            if (_proxyFormState.dirtyFields) _formState.dirtyFields = $9d503234465cbf96$var$getDirtyFields(_defaultValues, _formValues);
            _subjects.state.next({
                name: name,
                isDirty: _getDirty(name, values),
                dirtyFields: _formState.dirtyFields,
                errors: _formState.errors,
                isValid: _formState.isValid
            });
        } else $9d503234465cbf96$export$adaa4cf7ef1b65be(_formValues, name, values);
    };
    const updateErrors = (name, error)=>{
        $9d503234465cbf96$export$adaa4cf7ef1b65be(_formState.errors, name, error);
        _subjects.state.next({
            errors: _formState.errors
        });
    };
    const updateValidAndValue = (name, shouldSkipSetValueAs, value1, ref)=>{
        const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name);
        if (field) {
            const defaultValue = $9d503234465cbf96$export$3988ae62b71be9a3(_formValues, name, $9d503234465cbf96$var$isUndefined(value1) ? $9d503234465cbf96$export$3988ae62b71be9a3(_defaultValues, name) : value1);
            $9d503234465cbf96$var$isUndefined(defaultValue) || ref && ref.defaultChecked || shouldSkipSetValueAs ? $9d503234465cbf96$export$adaa4cf7ef1b65be(_formValues, name, shouldSkipSetValueAs ? defaultValue : $9d503234465cbf96$var$getFieldValue(field._f)) : setFieldValue(name, defaultValue);
            _state.mount && _updateValid();
        }
    };
    const updateTouchAndDirty = (name, fieldValue, isBlurEvent, shouldDirty, shouldRender)=>{
        let shouldUpdateField = false;
        let isPreviousDirty = false;
        const output = {
            name: name
        };
        if (!isBlurEvent || shouldDirty) {
            if (_proxyFormState.isDirty) {
                isPreviousDirty = _formState.isDirty;
                _formState.isDirty = output.isDirty = _getDirty();
                shouldUpdateField = isPreviousDirty !== output.isDirty;
            }
            const isCurrentFieldPristine = $9d503234465cbf96$var$deepEqual($9d503234465cbf96$export$3988ae62b71be9a3(_defaultValues, name), fieldValue);
            isPreviousDirty = $9d503234465cbf96$export$3988ae62b71be9a3(_formState.dirtyFields, name);
            isCurrentFieldPristine ? $9d503234465cbf96$var$unset(_formState.dirtyFields, name) : $9d503234465cbf96$export$adaa4cf7ef1b65be(_formState.dirtyFields, name, true);
            output.dirtyFields = _formState.dirtyFields;
            shouldUpdateField = shouldUpdateField || _proxyFormState.dirtyFields && isPreviousDirty !== !isCurrentFieldPristine;
        }
        if (isBlurEvent) {
            const isPreviousFieldTouched = $9d503234465cbf96$export$3988ae62b71be9a3(_formState.touchedFields, name);
            if (!isPreviousFieldTouched) {
                $9d503234465cbf96$export$adaa4cf7ef1b65be(_formState.touchedFields, name, isBlurEvent);
                output.touchedFields = _formState.touchedFields;
                shouldUpdateField = shouldUpdateField || _proxyFormState.touchedFields && isPreviousFieldTouched !== isBlurEvent;
            }
        }
        shouldUpdateField && shouldRender && _subjects.state.next(output);
        return shouldUpdateField ? output : {};
    };
    const shouldRenderByError = (name, isValid, error, fieldState)=>{
        const previousFieldError = $9d503234465cbf96$export$3988ae62b71be9a3(_formState.errors, name);
        const shouldUpdateValid = _proxyFormState.isValid && $9d503234465cbf96$var$isBoolean(isValid) && _formState.isValid !== isValid;
        if (props.delayError && error) {
            delayErrorCallback = debounce(()=>updateErrors(name, error));
            delayErrorCallback(props.delayError);
        } else {
            clearTimeout(timer);
            delayErrorCallback = null;
            error ? $9d503234465cbf96$export$adaa4cf7ef1b65be(_formState.errors, name, error) : $9d503234465cbf96$var$unset(_formState.errors, name);
        }
        if ((error ? !$9d503234465cbf96$var$deepEqual(previousFieldError, error) : previousFieldError) || !$9d503234465cbf96$var$isEmptyObject(fieldState) || shouldUpdateValid) {
            const updatedFormState = {
                ...fieldState,
                ...shouldUpdateValid && $9d503234465cbf96$var$isBoolean(isValid) ? {
                    isValid: isValid
                } : {},
                errors: _formState.errors,
                name: name
            };
            _formState = {
                ..._formState,
                ...updatedFormState
            };
            _subjects.state.next(updatedFormState);
        }
        _updateIsValidating(false);
    };
    const _executeSchema = async (name)=>_options.resolver(_formValues, _options.context, $9d503234465cbf96$var$getResolverOptions(name || _names.mount, _fields, _options.criteriaMode, _options.shouldUseNativeValidation));
    const executeSchemaAndUpdateState = async (names)=>{
        const { errors: errors  } = await _executeSchema(names);
        if (names) for (const name of names){
            const error = $9d503234465cbf96$export$3988ae62b71be9a3(errors, name);
            error ? $9d503234465cbf96$export$adaa4cf7ef1b65be(_formState.errors, name, error) : $9d503234465cbf96$var$unset(_formState.errors, name);
        }
        else _formState.errors = errors;
        return errors;
    };
    const executeBuiltInValidation = async (fields, shouldOnlyCheckValid, context = {
        valid: true
    })=>{
        for(const name in fields){
            const field = fields[name];
            if (field) {
                const { _f: _f , ...fieldValue } = field;
                if (_f) {
                    const isFieldArrayRoot = _names.array.has(_f.name);
                    const fieldError = await $9d503234465cbf96$var$validateField(field, _formValues, shouldDisplayAllAssociatedErrors, _options.shouldUseNativeValidation && !shouldOnlyCheckValid, isFieldArrayRoot);
                    if (fieldError[_f.name]) {
                        context.valid = false;
                        if (shouldOnlyCheckValid) break;
                    }
                    !shouldOnlyCheckValid && ($9d503234465cbf96$export$3988ae62b71be9a3(fieldError, _f.name) ? isFieldArrayRoot ? $9d503234465cbf96$var$updateFieldArrayRootError(_formState.errors, fieldError, _f.name) : $9d503234465cbf96$export$adaa4cf7ef1b65be(_formState.errors, _f.name, fieldError[_f.name]) : $9d503234465cbf96$var$unset(_formState.errors, _f.name));
                }
                fieldValue && await executeBuiltInValidation(fieldValue, shouldOnlyCheckValid, context);
            }
        }
        return context.valid;
    };
    const _removeUnmounted = ()=>{
        for (const name of _names.unMount){
            const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name);
            field && (field._f.refs ? field._f.refs.every((ref)=>!$9d503234465cbf96$var$live(ref)) : !$9d503234465cbf96$var$live(field._f.ref)) && unregister(name);
        }
        _names.unMount = new Set();
    };
    const _getDirty = (name, data)=>(name && data && $9d503234465cbf96$export$adaa4cf7ef1b65be(_formValues, name, data), !$9d503234465cbf96$var$deepEqual(getValues(), _defaultValues));
    const _getWatch = (names, defaultValue, isGlobal)=>$9d503234465cbf96$var$generateWatchOutput(names, _names, {
            ..._state.mount ? _formValues : $9d503234465cbf96$var$isUndefined(defaultValue) ? _defaultValues : $9d503234465cbf96$var$isString(names) ? {
                [names]: defaultValue
            } : defaultValue
        }, isGlobal, defaultValue);
    const _getFieldArray = (name)=>$9d503234465cbf96$var$compact($9d503234465cbf96$export$3988ae62b71be9a3(_state.mount ? _formValues : _defaultValues, name, props.shouldUnregister ? $9d503234465cbf96$export$3988ae62b71be9a3(_defaultValues, name, []) : []));
    const setFieldValue = (name, value1, options = {})=>{
        const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name);
        let fieldValue = value1;
        if (field) {
            const fieldReference = field._f;
            if (fieldReference) {
                !fieldReference.disabled && $9d503234465cbf96$export$adaa4cf7ef1b65be(_formValues, name, $9d503234465cbf96$var$getFieldValueAs(value1, fieldReference));
                fieldValue = $9d503234465cbf96$var$isHTMLElement(fieldReference.ref) && $9d503234465cbf96$var$isNullOrUndefined(value1) ? "" : value1;
                if ($9d503234465cbf96$var$isMultipleSelect(fieldReference.ref)) [
                    ...fieldReference.ref.options
                ].forEach((optionRef)=>optionRef.selected = fieldValue.includes(optionRef.value));
                else if (fieldReference.refs) {
                    if ($9d503234465cbf96$var$isCheckBoxInput(fieldReference.ref)) fieldReference.refs.length > 1 ? fieldReference.refs.forEach((checkboxRef)=>(!checkboxRef.defaultChecked || !checkboxRef.disabled) && (checkboxRef.checked = Array.isArray(fieldValue) ? !!fieldValue.find((data)=>data === checkboxRef.value) : fieldValue === checkboxRef.value)) : fieldReference.refs[0] && (fieldReference.refs[0].checked = !!fieldValue);
                    else fieldReference.refs.forEach((radioRef)=>radioRef.checked = radioRef.value === fieldValue);
                } else if ($9d503234465cbf96$var$isFileInput(fieldReference.ref)) fieldReference.ref.value = "";
                else {
                    fieldReference.ref.value = fieldValue;
                    if (!fieldReference.ref.type) _subjects.values.next({
                        name: name,
                        values: {
                            ..._formValues
                        }
                    });
                }
            }
        }
        (options.shouldDirty || options.shouldTouch) && updateTouchAndDirty(name, fieldValue, options.shouldTouch, options.shouldDirty, true);
        options.shouldValidate && trigger(name);
    };
    const setValues = (name, value1, options)=>{
        for(const fieldKey in value1){
            const fieldValue = value1[fieldKey];
            const fieldName = `${name}.${fieldKey}`;
            const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, fieldName);
            (_names.array.has(name) || !$9d503234465cbf96$var$isPrimitive(fieldValue) || field && !field._f) && !$9d503234465cbf96$var$isDateObject(fieldValue) ? setValues(fieldName, fieldValue, options) : setFieldValue(fieldName, fieldValue, options);
        }
    };
    const setValue = (name, value1, options = {})=>{
        const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name);
        const isFieldArray = _names.array.has(name);
        const cloneValue = $9d503234465cbf96$var$cloneObject(value1);
        $9d503234465cbf96$export$adaa4cf7ef1b65be(_formValues, name, cloneValue);
        if (isFieldArray) {
            _subjects.array.next({
                name: name,
                values: {
                    ..._formValues
                }
            });
            if ((_proxyFormState.isDirty || _proxyFormState.dirtyFields) && options.shouldDirty) _subjects.state.next({
                name: name,
                dirtyFields: $9d503234465cbf96$var$getDirtyFields(_defaultValues, _formValues),
                isDirty: _getDirty(name, cloneValue)
            });
        } else field && !field._f && !$9d503234465cbf96$var$isNullOrUndefined(cloneValue) ? setValues(name, cloneValue, options) : setFieldValue(name, cloneValue, options);
        $9d503234465cbf96$var$isWatched(name, _names) && _subjects.state.next({
            ..._formState
        });
        _subjects.values.next({
            name: name,
            values: {
                ..._formValues
            }
        });
        !_state.mount && flushRootRender();
    };
    const onChange = async (event)=>{
        const target = event.target;
        let name = target.name;
        let isFieldValueUpdated = true;
        const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name);
        const getCurrentFieldValue = ()=>target.type ? $9d503234465cbf96$var$getFieldValue(field._f) : $9d503234465cbf96$var$getEventValue(event);
        const _updateIsFieldValueUpdated = (fieldValue)=>{
            isFieldValueUpdated = Number.isNaN(fieldValue) || fieldValue === $9d503234465cbf96$export$3988ae62b71be9a3(_formValues, name, fieldValue);
        };
        if (field) {
            let error;
            let isValid;
            const fieldValue = getCurrentFieldValue();
            const isBlurEvent = event.type === $9d503234465cbf96$var$EVENTS.BLUR || event.type === $9d503234465cbf96$var$EVENTS.FOCUS_OUT;
            const shouldSkipValidation = !$9d503234465cbf96$var$hasValidation(field._f) && !_options.resolver && !$9d503234465cbf96$export$3988ae62b71be9a3(_formState.errors, name) && !field._f.deps || $9d503234465cbf96$var$skipValidation(isBlurEvent, $9d503234465cbf96$export$3988ae62b71be9a3(_formState.touchedFields, name), _formState.isSubmitted, validationModeAfterSubmit, validationModeBeforeSubmit);
            const watched = $9d503234465cbf96$var$isWatched(name, _names, isBlurEvent);
            $9d503234465cbf96$export$adaa4cf7ef1b65be(_formValues, name, fieldValue);
            if (isBlurEvent) {
                field._f.onBlur && field._f.onBlur(event);
                delayErrorCallback && delayErrorCallback(0);
            } else if (field._f.onChange) field._f.onChange(event);
            const fieldState = updateTouchAndDirty(name, fieldValue, isBlurEvent, false);
            const shouldRender = !$9d503234465cbf96$var$isEmptyObject(fieldState) || watched;
            !isBlurEvent && _subjects.values.next({
                name: name,
                type: event.type,
                values: {
                    ..._formValues
                }
            });
            if (shouldSkipValidation) {
                _proxyFormState.isValid && _updateValid();
                return shouldRender && _subjects.state.next({
                    name: name,
                    ...watched ? {} : fieldState
                });
            }
            !isBlurEvent && watched && _subjects.state.next({
                ..._formState
            });
            _updateIsValidating(true);
            if (_options.resolver) {
                const { errors: errors  } = await _executeSchema([
                    name
                ]);
                _updateIsFieldValueUpdated(fieldValue);
                if (isFieldValueUpdated) {
                    const previousErrorLookupResult = $9d503234465cbf96$var$schemaErrorLookup(_formState.errors, _fields, name);
                    const errorLookupResult = $9d503234465cbf96$var$schemaErrorLookup(errors, _fields, previousErrorLookupResult.name || name);
                    error = errorLookupResult.error;
                    name = errorLookupResult.name;
                    isValid = $9d503234465cbf96$var$isEmptyObject(errors);
                }
            } else {
                error = (await $9d503234465cbf96$var$validateField(field, _formValues, shouldDisplayAllAssociatedErrors, _options.shouldUseNativeValidation))[name];
                _updateIsFieldValueUpdated(fieldValue);
                if (isFieldValueUpdated) {
                    if (error) isValid = false;
                    else if (_proxyFormState.isValid) isValid = await executeBuiltInValidation(_fields, true);
                }
            }
            if (isFieldValueUpdated) {
                field._f.deps && trigger(field._f.deps);
                shouldRenderByError(name, isValid, error, fieldState);
            }
        }
    };
    const _focusInput = (ref, key)=>{
        if ($9d503234465cbf96$export$3988ae62b71be9a3(_formState.errors, key) && ref.focus) {
            ref.focus();
            return 1;
        }
        return;
    };
    const trigger = async (name, options = {})=>{
        let isValid;
        let validationResult;
        const fieldNames = $9d503234465cbf96$var$convertToArrayPayload(name);
        _updateIsValidating(true);
        if (_options.resolver) {
            const errors = await executeSchemaAndUpdateState($9d503234465cbf96$var$isUndefined(name) ? name : fieldNames);
            isValid = $9d503234465cbf96$var$isEmptyObject(errors);
            validationResult = name ? !fieldNames.some((name)=>$9d503234465cbf96$export$3988ae62b71be9a3(errors, name)) : isValid;
        } else if (name) {
            validationResult = (await Promise.all(fieldNames.map(async (fieldName)=>{
                const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, fieldName);
                return await executeBuiltInValidation(field && field._f ? {
                    [fieldName]: field
                } : field);
            }))).every(Boolean);
            !(!validationResult && !_formState.isValid) && _updateValid();
        } else validationResult = isValid = await executeBuiltInValidation(_fields);
        _subjects.state.next({
            ...!$9d503234465cbf96$var$isString(name) || _proxyFormState.isValid && isValid !== _formState.isValid ? {} : {
                name: name
            },
            ..._options.resolver || !name ? {
                isValid: isValid
            } : {},
            errors: _formState.errors,
            isValidating: false
        });
        options.shouldFocus && !validationResult && $9d503234465cbf96$var$iterateFieldsByAction(_fields, _focusInput, name ? fieldNames : _names.mount);
        return validationResult;
    };
    const getValues = (fieldNames)=>{
        const values = {
            ..._defaultValues,
            ..._state.mount ? _formValues : {}
        };
        return $9d503234465cbf96$var$isUndefined(fieldNames) ? values : $9d503234465cbf96$var$isString(fieldNames) ? $9d503234465cbf96$export$3988ae62b71be9a3(values, fieldNames) : fieldNames.map((name)=>$9d503234465cbf96$export$3988ae62b71be9a3(values, name));
    };
    const getFieldState = (name, formState)=>({
            invalid: !!$9d503234465cbf96$export$3988ae62b71be9a3((formState || _formState).errors, name),
            isDirty: !!$9d503234465cbf96$export$3988ae62b71be9a3((formState || _formState).dirtyFields, name),
            isTouched: !!$9d503234465cbf96$export$3988ae62b71be9a3((formState || _formState).touchedFields, name),
            error: $9d503234465cbf96$export$3988ae62b71be9a3((formState || _formState).errors, name)
        });
    const clearErrors = (name)=>{
        name && $9d503234465cbf96$var$convertToArrayPayload(name).forEach((inputName)=>$9d503234465cbf96$var$unset(_formState.errors, inputName));
        _subjects.state.next({
            errors: name ? _formState.errors : {}
        });
    };
    const setError = (name, error, options)=>{
        const ref = ($9d503234465cbf96$export$3988ae62b71be9a3(_fields, name, {
            _f: {}
        })._f || {}).ref;
        $9d503234465cbf96$export$adaa4cf7ef1b65be(_formState.errors, name, {
            ...error,
            ref: ref
        });
        _subjects.state.next({
            name: name,
            errors: _formState.errors,
            isValid: false
        });
        options && options.shouldFocus && ref && ref.focus && ref.focus();
    };
    const watch = (name, defaultValue)=>$9d503234465cbf96$var$isFunction(name) ? _subjects.values.subscribe({
            next: (payload)=>name(_getWatch(undefined, defaultValue), payload)
        }) : _getWatch(name, defaultValue, true);
    const unregister = (name, options = {})=>{
        for (const fieldName of name ? $9d503234465cbf96$var$convertToArrayPayload(name) : _names.mount){
            _names.mount.delete(fieldName);
            _names.array.delete(fieldName);
            if (!options.keepValue) {
                $9d503234465cbf96$var$unset(_fields, fieldName);
                $9d503234465cbf96$var$unset(_formValues, fieldName);
            }
            !options.keepError && $9d503234465cbf96$var$unset(_formState.errors, fieldName);
            !options.keepDirty && $9d503234465cbf96$var$unset(_formState.dirtyFields, fieldName);
            !options.keepTouched && $9d503234465cbf96$var$unset(_formState.touchedFields, fieldName);
            !_options.shouldUnregister && !options.keepDefaultValue && $9d503234465cbf96$var$unset(_defaultValues, fieldName);
        }
        _subjects.values.next({
            values: {
                ..._formValues
            }
        });
        _subjects.state.next({
            ..._formState,
            ...!options.keepDirty ? {} : {
                isDirty: _getDirty()
            }
        });
        !options.keepIsValid && _updateValid();
    };
    const _updateDisabledField = ({ disabled: disabled , name: name , field: field , fields: fields , value: value1  })=>{
        if ($9d503234465cbf96$var$isBoolean(disabled)) {
            const inputValue = disabled ? undefined : $9d503234465cbf96$var$isUndefined(value1) ? $9d503234465cbf96$var$getFieldValue(field ? field._f : $9d503234465cbf96$export$3988ae62b71be9a3(fields, name)._f) : value1;
            $9d503234465cbf96$export$adaa4cf7ef1b65be(_formValues, name, inputValue);
            updateTouchAndDirty(name, inputValue, false, false, true);
        }
    };
    const register = (name, options = {})=>{
        let field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name);
        const disabledIsDefined = $9d503234465cbf96$var$isBoolean(options.disabled);
        $9d503234465cbf96$export$adaa4cf7ef1b65be(_fields, name, {
            ...field || {},
            _f: {
                ...field && field._f ? field._f : {
                    ref: {
                        name: name
                    }
                },
                name: name,
                mount: true,
                ...options
            }
        });
        _names.mount.add(name);
        if (field) _updateDisabledField({
            field: field,
            disabled: options.disabled,
            name: name
        });
        else updateValidAndValue(name, true, options.value);
        return {
            ...disabledIsDefined ? {
                disabled: options.disabled
            } : {},
            ..._options.progressive ? {
                required: !!options.required,
                min: $9d503234465cbf96$var$getRuleValue(options.min),
                max: $9d503234465cbf96$var$getRuleValue(options.max),
                minLength: $9d503234465cbf96$var$getRuleValue(options.minLength),
                maxLength: $9d503234465cbf96$var$getRuleValue(options.maxLength),
                pattern: $9d503234465cbf96$var$getRuleValue(options.pattern)
            } : {},
            name: name,
            onChange: onChange,
            onBlur: onChange,
            ref: (ref)=>{
                if (ref) {
                    register(name, options);
                    field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name);
                    const fieldRef = $9d503234465cbf96$var$isUndefined(ref.value) ? ref.querySelectorAll ? ref.querySelectorAll("input,select,textarea")[0] || ref : ref : ref;
                    const radioOrCheckbox = $9d503234465cbf96$var$isRadioOrCheckbox(fieldRef);
                    const refs = field._f.refs || [];
                    if (radioOrCheckbox ? refs.find((option)=>option === fieldRef) : fieldRef === field._f.ref) return;
                    $9d503234465cbf96$export$adaa4cf7ef1b65be(_fields, name, {
                        _f: {
                            ...field._f,
                            ...radioOrCheckbox ? {
                                refs: [
                                    ...refs.filter($9d503234465cbf96$var$live),
                                    fieldRef,
                                    ...Array.isArray($9d503234465cbf96$export$3988ae62b71be9a3(_defaultValues, name)) ? [
                                        {}
                                    ] : []
                                ],
                                ref: {
                                    type: fieldRef.type,
                                    name: name
                                }
                            } : {
                                ref: fieldRef
                            }
                        }
                    });
                    updateValidAndValue(name, false, undefined, fieldRef);
                } else {
                    field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name, {});
                    if (field._f) field._f.mount = false;
                    (_options.shouldUnregister || options.shouldUnregister) && !($9d503234465cbf96$var$isNameInFieldArray(_names.array, name) && _state.action) && _names.unMount.add(name);
                }
            }
        };
    };
    const _focusError = ()=>_options.shouldFocusError && $9d503234465cbf96$var$iterateFieldsByAction(_fields, _focusInput, _names.mount);
    const _disableForm = (disabled)=>{
        if ($9d503234465cbf96$var$isBoolean(disabled)) {
            _subjects.state.next({
                disabled: disabled
            });
            $9d503234465cbf96$var$iterateFieldsByAction(_fields, (ref)=>{
                ref.disabled = disabled;
            }, 0, false);
        }
    };
    const handleSubmit = (onValid, onInvalid)=>async (e)=>{
            if (e) {
                e.preventDefault && e.preventDefault();
                e.persist && e.persist();
            }
            let fieldValues = $9d503234465cbf96$var$cloneObject(_formValues);
            _subjects.state.next({
                isSubmitting: true
            });
            if (_options.resolver) {
                const { errors: errors , values: values  } = await _executeSchema();
                _formState.errors = errors;
                fieldValues = values;
            } else await executeBuiltInValidation(_fields);
            $9d503234465cbf96$var$unset(_formState.errors, "root");
            if ($9d503234465cbf96$var$isEmptyObject(_formState.errors)) {
                _subjects.state.next({
                    errors: {}
                });
                await onValid(fieldValues, e);
            } else {
                if (onInvalid) await onInvalid({
                    ..._formState.errors
                }, e);
                _focusError();
                setTimeout(_focusError);
            }
            _subjects.state.next({
                isSubmitted: true,
                isSubmitting: false,
                isSubmitSuccessful: $9d503234465cbf96$var$isEmptyObject(_formState.errors),
                submitCount: _formState.submitCount + 1,
                errors: _formState.errors
            });
        };
    const resetField = (name, options = {})=>{
        if ($9d503234465cbf96$export$3988ae62b71be9a3(_fields, name)) {
            if ($9d503234465cbf96$var$isUndefined(options.defaultValue)) setValue(name, $9d503234465cbf96$export$3988ae62b71be9a3(_defaultValues, name));
            else {
                setValue(name, options.defaultValue);
                $9d503234465cbf96$export$adaa4cf7ef1b65be(_defaultValues, name, options.defaultValue);
            }
            if (!options.keepTouched) $9d503234465cbf96$var$unset(_formState.touchedFields, name);
            if (!options.keepDirty) {
                $9d503234465cbf96$var$unset(_formState.dirtyFields, name);
                _formState.isDirty = options.defaultValue ? _getDirty(name, $9d503234465cbf96$export$3988ae62b71be9a3(_defaultValues, name)) : _getDirty();
            }
            if (!options.keepError) {
                $9d503234465cbf96$var$unset(_formState.errors, name);
                _proxyFormState.isValid && _updateValid();
            }
            _subjects.state.next({
                ..._formState
            });
        }
    };
    const _reset = (formValues, keepStateOptions = {})=>{
        const updatedValues = formValues ? $9d503234465cbf96$var$cloneObject(formValues) : _defaultValues;
        const cloneUpdatedValues = $9d503234465cbf96$var$cloneObject(updatedValues);
        const values = formValues && !$9d503234465cbf96$var$isEmptyObject(formValues) ? cloneUpdatedValues : _defaultValues;
        if (!keepStateOptions.keepDefaultValues) _defaultValues = updatedValues;
        if (!keepStateOptions.keepValues) {
            if (keepStateOptions.keepDirtyValues || shouldCaptureDirtyFields) for (const fieldName of _names.mount)$9d503234465cbf96$export$3988ae62b71be9a3(_formState.dirtyFields, fieldName) ? $9d503234465cbf96$export$adaa4cf7ef1b65be(values, fieldName, $9d503234465cbf96$export$3988ae62b71be9a3(_formValues, fieldName)) : setValue(fieldName, $9d503234465cbf96$export$3988ae62b71be9a3(values, fieldName));
            else {
                if ($9d503234465cbf96$var$isWeb && $9d503234465cbf96$var$isUndefined(formValues)) for (const name of _names.mount){
                    const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name);
                    if (field && field._f) {
                        const fieldReference = Array.isArray(field._f.refs) ? field._f.refs[0] : field._f.ref;
                        if ($9d503234465cbf96$var$isHTMLElement(fieldReference)) {
                            const form = fieldReference.closest("form");
                            if (form) {
                                form.reset();
                                break;
                            }
                        }
                    }
                }
                _fields = {};
            }
            _formValues = props.shouldUnregister ? keepStateOptions.keepDefaultValues ? $9d503234465cbf96$var$cloneObject(_defaultValues) : {} : $9d503234465cbf96$var$cloneObject(values);
            _subjects.array.next({
                values: {
                    ...values
                }
            });
            _subjects.values.next({
                values: {
                    ...values
                }
            });
        }
        _names = {
            mount: new Set(),
            unMount: new Set(),
            array: new Set(),
            watch: new Set(),
            watchAll: false,
            focus: ""
        };
        !_state.mount && flushRootRender();
        _state.mount = !_proxyFormState.isValid || !!keepStateOptions.keepIsValid;
        _state.watch = !!props.shouldUnregister;
        _subjects.state.next({
            submitCount: keepStateOptions.keepSubmitCount ? _formState.submitCount : 0,
            isDirty: keepStateOptions.keepDirty ? _formState.isDirty : !!(keepStateOptions.keepDefaultValues && !$9d503234465cbf96$var$deepEqual(formValues, _defaultValues)),
            isSubmitted: keepStateOptions.keepIsSubmitted ? _formState.isSubmitted : false,
            dirtyFields: keepStateOptions.keepDirtyValues ? _formState.dirtyFields : keepStateOptions.keepDefaultValues && formValues ? $9d503234465cbf96$var$getDirtyFields(_defaultValues, formValues) : {},
            touchedFields: keepStateOptions.keepTouched ? _formState.touchedFields : {},
            errors: keepStateOptions.keepErrors ? _formState.errors : {},
            isSubmitSuccessful: keepStateOptions.keepIsSubmitSuccessful ? _formState.isSubmitSuccessful : false,
            isSubmitting: false
        });
    };
    const reset = (formValues, keepStateOptions)=>_reset($9d503234465cbf96$var$isFunction(formValues) ? formValues(_formValues) : formValues, keepStateOptions);
    const setFocus = (name, options = {})=>{
        const field = $9d503234465cbf96$export$3988ae62b71be9a3(_fields, name);
        const fieldReference = field && field._f;
        if (fieldReference) {
            const fieldRef = fieldReference.refs ? fieldReference.refs[0] : fieldReference.ref;
            if (fieldRef.focus) {
                fieldRef.focus();
                options.shouldSelect && fieldRef.select();
            }
        }
    };
    const _updateFormState = (updatedFormState)=>{
        _formState = {
            ..._formState,
            ...updatedFormState
        };
    };
    const _resetDefaultValues = ()=>$9d503234465cbf96$var$isFunction(_options.defaultValues) && _options.defaultValues().then((values)=>{
            reset(values, _options.resetOptions);
            _subjects.state.next({
                isLoading: false
            });
        });
    return {
        control: {
            register: register,
            unregister: unregister,
            getFieldState: getFieldState,
            handleSubmit: handleSubmit,
            setError: setError,
            _executeSchema: _executeSchema,
            _getWatch: _getWatch,
            _getDirty: _getDirty,
            _updateValid: _updateValid,
            _removeUnmounted: _removeUnmounted,
            _updateFieldArray: _updateFieldArray,
            _updateDisabledField: _updateDisabledField,
            _getFieldArray: _getFieldArray,
            _reset: _reset,
            _resetDefaultValues: _resetDefaultValues,
            _updateFormState: _updateFormState,
            _disableForm: _disableForm,
            _subjects: _subjects,
            _proxyFormState: _proxyFormState,
            get _fields () {
                return _fields;
            },
            get _formValues () {
                return _formValues;
            },
            get _state () {
                return _state;
            },
            set _state (value){
                _state = value;
            },
            get _defaultValues () {
                return _defaultValues;
            },
            get _names () {
                return _names;
            },
            set _names (value){
                _names = value;
            },
            get _formState () {
                return _formState;
            },
            set _formState (value){
                _formState = value;
            },
            get _options () {
                return _options;
            },
            set _options (value){
                _options = {
                    ..._options,
                    ...value
                };
            }
        },
        trigger: trigger,
        register: register,
        handleSubmit: handleSubmit,
        watch: watch,
        setValue: setValue,
        getValues: getValues,
        reset: reset,
        resetField: resetField,
        clearErrors: clearErrors,
        unregister: unregister,
        setError: setError,
        setFocus: setFocus,
        getFieldState: getFieldState
    };
}
/**
 * Custom hook to manage the entire form.
 *
 * @remarks
 * [API](https://react-hook-form.com/docs/useform) • [Demo](https://codesandbox.io/s/react-hook-form-get-started-ts-5ksmm) • [Video](https://www.youtube.com/watch?v=RkXv4AXXC_4)
 *
 * @param props - form configuration and validation parameters.
 *
 * @returns methods - individual functions to manage the form state. {@link UseFormReturn}
 *
 * @example
 * ```tsx
 * function App() {
 *   const { register, handleSubmit, watch, formState: { errors } } = useForm();
 *   const onSubmit = data => console.log(data);
 *
 *   console.log(watch("example"));
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input defaultValue="test" {...register("example")} />
 *       <input {...register("exampleRequired", { required: true })} />
 *       {errors.exampleRequired && <span>This field is required</span>}
 *       <button>Submit</button>
 *     </form>
 *   );
 * }
 * ```
 */ function $9d503234465cbf96$export$87c0cf8eb5a167e0(props = {}) {
    const _formControl = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef();
    const _values = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useRef();
    const [formState, updateFormState] = (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useState({
        isDirty: false,
        isValidating: false,
        isLoading: $9d503234465cbf96$var$isFunction(props.defaultValues),
        isSubmitted: false,
        isSubmitting: false,
        isSubmitSuccessful: false,
        isValid: false,
        submitCount: 0,
        dirtyFields: {},
        touchedFields: {},
        errors: {},
        disabled: false,
        defaultValues: $9d503234465cbf96$var$isFunction(props.defaultValues) ? undefined : props.defaultValues
    });
    if (!_formControl.current) _formControl.current = {
        ...$9d503234465cbf96$var$createFormControl(props, ()=>updateFormState((formState)=>({
                    ...formState
                }))),
        formState: formState
    };
    const control = _formControl.current.control;
    control._options = props;
    $9d503234465cbf96$var$useSubscribe({
        subject: control._subjects.state,
        next: (value1)=>{
            if ($9d503234465cbf96$var$shouldRenderFormState(value1, control._proxyFormState, control._updateFormState, true)) updateFormState({
                ...control._formState
            });
        }
    });
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>control._disableForm(props.disabled), [
        control,
        props.disabled
    ]);
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
        if (control._proxyFormState.isDirty) {
            const isDirty = control._getDirty();
            if (isDirty !== formState.isDirty) control._subjects.state.next({
                isDirty: isDirty
            });
        }
    }, [
        control,
        formState.isDirty
    ]);
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
        if (props.values && !$9d503234465cbf96$var$deepEqual(props.values, _values.current)) {
            control._reset(props.values, control._options.resetOptions);
            _values.current = props.values;
        } else control._resetDefaultValues();
    }, [
        props.values,
        control
    ]);
    (0, (/*@__PURE__*/$parcel$interopDefault($LI8jA))).useEffect(()=>{
        if (!control._state.mount) {
            control._updateValid();
            control._state.mount = true;
        }
        if (control._state.watch) {
            control._state.watch = false;
            control._subjects.state.next({
                ...control._formState
            });
        }
        control._removeUnmounted();
    });
    _formControl.current.formState = $9d503234465cbf96$var$getProxyFormState(formState, control);
    return _formControl.current;
}





var $LI8jA = parcelRequire("LI8jA");


var $LI8jA = parcelRequire("LI8jA");

/* -------------------------------------------------------------------------------------------------
 * Label
 * -----------------------------------------------------------------------------------------------*/ const $fa50084b05e77da5$var$$b73a6c6685e72184$var$NAME = "Label";
const $fa50084b05e77da5$export$b04be29aa201d4f5 = /*#__PURE__*/ (0, $LI8jA.forwardRef)((props, forwardedRef)=>{
    return /*#__PURE__*/ (0, $LI8jA.createElement)((0, $a68e7d99b5d35ecf$export$250ffa63cdc0d034).label, (0, $03526de71b5892e9$export$2e2bcd8739ae039)({}, props, {
        ref: forwardedRef,
        onMouseDown: (event)=>{
            var _props$onMouseDown;
            (_props$onMouseDown = props.onMouseDown) === null || _props$onMouseDown === void 0 || _props$onMouseDown.call(props, event); // prevent text selection when double clicking label
            if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
        }
    }));
});
/*#__PURE__*/ Object.assign($fa50084b05e77da5$export$b04be29aa201d4f5, {
    displayName: $fa50084b05e77da5$var$$b73a6c6685e72184$var$NAME
});
/* -----------------------------------------------------------------------------------------------*/ const $fa50084b05e77da5$export$be92b6f5f03c0fe9 = $fa50084b05e77da5$export$b04be29aa201d4f5;




const $a273c4b7249c38d5$var$labelVariants = (0, $591c8f71196a9028$export$87dc52566e90b739)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
const $a273c4b7249c38d5$export$b04be29aa201d4f5 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>/*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($fa50084b05e77da5$export$be92b6f5f03c0fe9, {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__label", $a273c4b7249c38d5$var$labelVariants(), className),
        ...props
    }));
$a273c4b7249c38d5$export$b04be29aa201d4f5.displayName = $fa50084b05e77da5$export$be92b6f5f03c0fe9.displayName;


const $8c4bab3834363c0d$export$a7fed597f4b8afd8 = (0, $9d503234465cbf96$export$8ce1ff4f94d08846);
const $8c4bab3834363c0d$var$FormFieldContext = /*#__PURE__*/ $LI8jA.createContext({});
const $8c4bab3834363c0d$export$56e87bf42978147a = ({ ...props })=>{
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($8c4bab3834363c0d$var$FormFieldContext.Provider, {
        value: {
            name: props.name
        },
        children: /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $9d503234465cbf96$export$bd0bf19f25da8474), {
            ...props
        })
    });
};
const $8c4bab3834363c0d$export$b0aeb07a3112de27 = ()=>{
    const fieldContext = $LI8jA.useContext($8c4bab3834363c0d$var$FormFieldContext);
    const itemContext = $LI8jA.useContext($8c4bab3834363c0d$var$FormItemContext);
    const { getFieldState: getFieldState , formState: formState  } = (0, $9d503234465cbf96$export$4d957a5e1be13b03)();
    const fieldState = getFieldState(fieldContext.name, formState);
    if (!fieldContext) throw new Error("useFormField should be used within <FormField>");
    const { id: id  } = itemContext;
    return {
        id: id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState
    };
};
const $8c4bab3834363c0d$var$FormItemContext = /*#__PURE__*/ $LI8jA.createContext({});
const $8c4bab3834363c0d$export$6713ee24224a3285 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>{
    const id = (0, $66adb88ac93a30d5$export$f680877a34711e37)();
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)($8c4bab3834363c0d$var$FormItemContext.Provider, {
        value: {
            id: id
        },
        children: /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("div", {
            ref: ref,
            className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__form-item space-y-2", className),
            ...props
        })
    });
});
$8c4bab3834363c0d$export$6713ee24224a3285.displayName = "FormItem";
const $8c4bab3834363c0d$export$842aba50ed0ce9d7 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>{
    const { error: error , formItemId: formItemId  } = $8c4bab3834363c0d$export$b0aeb07a3112de27();
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $a273c4b7249c38d5$export$b04be29aa201d4f5), {
        ref: ref,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__form-label", error && "text-destructive", className),
        htmlFor: formItemId,
        ...props
    });
});
$8c4bab3834363c0d$export$842aba50ed0ce9d7.displayName = "FormLabel";
const $8c4bab3834363c0d$export$fe5d99d8691b3f62 = /*#__PURE__*/ $LI8jA.forwardRef(({ ...props }, ref)=>{
    const { error: error , formItemId: formItemId , formDescriptionId: formDescriptionId , formMessageId: formMessageId  } = $8c4bab3834363c0d$export$b0aeb07a3112de27();
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)((0, $db045af315cca07a$export$8c6ed5c666ac1360), {
        ref: ref,
        id: formItemId,
        "aria-describedby": !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`,
        "aria-invalid": !!error,
        ...props
    });
});
$8c4bab3834363c0d$export$fe5d99d8691b3f62.displayName = "FormControl";
const $8c4bab3834363c0d$export$3d84b9e998b8ea49 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , ...props }, ref)=>{
    const { formDescriptionId: formDescriptionId  } = $8c4bab3834363c0d$export$b0aeb07a3112de27();
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("p", {
        ref: ref,
        id: formDescriptionId,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__form-description text-sm text-muted-foreground", className),
        ...props
    });
});
$8c4bab3834363c0d$export$3d84b9e998b8ea49.displayName = "FormDescription";
const $8c4bab3834363c0d$export$2e8ae7a1a126169a = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , children: children , ...props }, ref)=>{
    const { error: error , formMessageId: formMessageId  } = $8c4bab3834363c0d$export$b0aeb07a3112de27();
    const body = error ? String(error?.message) : children;
    if (!body) return null;
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("p", {
        ref: ref,
        id: formMessageId,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__form-message text-sm font-medium text-destructive", className),
        ...props,
        children: body
    });
});
$8c4bab3834363c0d$export$2e8ae7a1a126169a.displayName = "FormMessage";





var $LI8jA = parcelRequire("LI8jA");

const $b7a5acf71ba8cfaa$export$f5b8910cec6cf069 = /*#__PURE__*/ $LI8jA.forwardRef(({ className: className , type: type , ...props }, ref)=>{
    return /*#__PURE__*/ (0, $59024eba873adb50$exports.jsx)("input", {
        type: type,
        className: (0, $66adb88ac93a30d5$export$1343a74baacb0543)("ui__input", "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className),
        ref: ref,
        ...props
    });
});
$b7a5acf71ba8cfaa$export$f5b8910cec6cf069.displayName = "Input";



const $f4eb51170e743c4a$var$shadui = {
    Button: $0e5897524c762a41$export$353f5b6fc5456de1,
    Slider: $c38718c2690bae4e$export$472062a354075cee,
    DropdownMenu: $4007f737badecf3c$export$e44a253a59704894,
    DropdownMenuContent: $4007f737badecf3c$export$6e76d93a37c01248,
    DropdownMenuItem: $4007f737badecf3c$export$ed97964d1871885d,
    DropdownMenuCheckboxItem: $4007f737badecf3c$export$53a69729da201fa9,
    DropdownMenuRadioGroup: $4007f737badecf3c$export$3323ad73d55f587e,
    DropdownMenuRadioItem: $4007f737badecf3c$export$e4f69b41b1637536,
    DropdownMenuLabel: $4007f737badecf3c$export$76e48c5b57f24495,
    DropdownMenuSeparator: $4007f737badecf3c$export$da160178fd3bc7e9,
    DropdownMenuTrigger: $4007f737badecf3c$export$d2469213b3befba9,
    DropdownMenuShortcut: $4007f737badecf3c$export$b1e098e2962e8df5,
    DropdownMenuGroup: $4007f737badecf3c$export$246bebaba3a2f70e,
    DropdownMenuPortal: $4007f737badecf3c$export$cd369b4d4d54efc9,
    DropdownMenuSub: $4007f737badecf3c$export$2f307d81a64f5442,
    DropdownMenuSubContent: $4007f737badecf3c$export$f34ec8bc2482cc5f,
    DropdownMenuSubTrigger: $4007f737badecf3c$export$21dcb7ec56f874cf,
    Toaster: $56e330253c5a7e46$export$fb98e3a2a4cd92d7,
    useToast: $43bc9081ab9a723d$export$a407b657d3044108,
    Badge: $3e95e41b04524189$export$37acb3580601e69a,
    genToastId: (0, $43bc9081ab9a723d$export$87d45d9755ebb726),
    Alert: $9ea37f7f736d8afe$export$caec2af78bcc877f,
    AlertTitle: $9ea37f7f736d8afe$export$4a7253439a300753,
    Input: $b7a5acf71ba8cfaa$export$f5b8910cec6cf069,
    AlertDescription: $9ea37f7f736d8afe$export$d4feae172fccda11,
    Label: $a273c4b7249c38d5$export$b04be29aa201d4f5,
    Form: $8c4bab3834363c0d$export$a7fed597f4b8afd8,
    FormItem: $8c4bab3834363c0d$export$6713ee24224a3285,
    FormLabel: $8c4bab3834363c0d$export$842aba50ed0ce9d7,
    FormField: $8c4bab3834363c0d$export$56e87bf42978147a,
    FormControl: $8c4bab3834363c0d$export$fe5d99d8691b3f62,
    FormDescription: $8c4bab3834363c0d$export$3d84b9e998b8ea49,
    FormMessage: $8c4bab3834363c0d$export$2e8ae7a1a126169a,
    useFormField: $8c4bab3834363c0d$export$b0aeb07a3112de27,
    useForm: $9d503234465cbf96$export$87c0cf8eb5a167e0,
    useFormContext: $9d503234465cbf96$export$4d957a5e1be13b03
};
function $f4eb51170e743c4a$export$40e78c93e005ce8f() {
    console.debug("[ui] setup logseq ui globals");
    window.LSUI = $f4eb51170e743c4a$var$shadui;
    window.LSUtils = {
        isDev: false
    };
}
// setup
$f4eb51170e743c4a$export$40e78c93e005ce8f();

})();
