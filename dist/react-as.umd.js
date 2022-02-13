/*!
* react-as
* https://github.com/KingSora/react-as
*
* Version: 1.0.0
*
* Copyright KingSora | Rene Haas.
* https://github.com/KingSora
*
* Released under the MIT license.
* Date: 13.02.2022
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('react')) :
    typeof define === 'function' && define.amd ? define(['exports', 'react'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["react-as"] = {}, global.React));
})(this, (function (exports, React) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var React__default = /*#__PURE__*/_interopDefaultLegacy(React);

    /*! *****************************************************************************
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
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    var isString = function (value) { return typeof value === 'string'; };
    var isFunction = function (value) { return typeof value === 'function'; };
    var isObject = function (value) { return !!value && typeof value === 'object'; };
    var isBoolean = function (value) { return typeof value === 'boolean'; };
    var isSymbol = function (value) { return typeof value === 'symbol'; };
    var renderComponentOrComponentType = function (component) {
        return React.isValidElement(component) ? React.cloneElement(component) : React.createElement(component);
    };
    var getOverwrittenProps = function (overwritePropsFunction, componentProps, asProps) {
        var result = isFunction(overwritePropsFunction) ? overwritePropsFunction(componentProps, asProps) : null;
        return Array.isArray(result) ? result : [componentProps, asProps];
    };
    // get the element according to the passed strategy
    var getStrategyElement = function (component, as, strategy) {
        switch (strategy) {
            case 'leave': {
                return (isString(component) && as) || component;
            }
            case 'wrap':
            default: {
                return as;
            }
        }
    };
    // normalize input of components
    var getTypeAndProps = function (component, acceptObj) {
        var _a;
        var type = component;
        var render;
        var props;
        // components passed like "<Component prop="A" />" are split into their constructor and props
        if (isObject(component)) {
            (_a = component, type = _a.type, props = _a.props, render = _a.render);
        }
        // hoc components like React.memo and React.forwardRef return objects as type with same structure
        var finalType = type || render;
        if (isObject(finalType) && !acceptObj) {
            finalType = getTypeAndProps(finalType, acceptObj)[0];
        }
        return [
            finalType,
            (props || finalType.defaultProps || {}),
        ];
    };

    var cache = new WeakMap();
    var cacheKeys = new Map();
    /**
     * Transform primitives into objects so they can be added as key to a WeakMap
     * @param component The component.
     * @param as The "as" component.
     * @returns A cache key tuple. First value for the component and second value for the "as" component.
     */
    var getCacheKeys = function (component, as) {
        if (isSymbol(component) || isSymbol(as)) {
            return [];
        }
        var componentIsString = isString(component);
        var asIsString = isString(as);
        var componentKey = componentIsString ? "c-".concat(component) : component;
        var asKey = asIsString ? "a-".concat(as) : as;
        if (!cacheKeys.has(componentKey)) {
            cacheKeys.set(componentKey, componentIsString ? new String(component) : component);
        }
        if (!cacheKeys.has(asKey)) {
            cacheKeys.set(asKey, asIsString ? new String(as) : as);
        }
        return [cacheKeys.get(componentKey), cacheKeys.get(asKey)];
    };
    /**
     * Sets or adapts an cache entry.
     * @param component The component.
     * @param as The "as" component.
     * @param options The used options as a string.
     * @param value The calculated value (result) which is cached for the future.
     * @returns The passed value.
     */
    var setCacheEntry = function (component, as, options, value) {
        var _a, _b;
        var _c = getCacheKeys(component, as), cacheKey = _c[0], asCacheKey = _c[1];
        if (cacheKey && asCacheKey && options) {
            var asMap = cache.get(cacheKey);
            if (asMap) {
                var asEntry = asMap.get(asCacheKey);
                if (asEntry) {
                    // present component with present as
                    asEntry[options] = value;
                }
                else {
                    // present component with new as
                    asMap.set(asCacheKey, (_a = {}, _a[options] = value, _a));
                }
            }
            else {
                // new component with new as
                var newAsMap = new WeakMap();
                newAsMap.set(asCacheKey, (_b = {}, _b[options] = value, _b));
                cache.set(cacheKey, newAsMap);
            }
        }
        return value;
    };
    /**
     * Gets the cache entry for the request component and "as" component.
     * @param component The component.
     * @param as The "as" component
     * @param options The used options as a string.
     * @returns The cached component type or undefined if no cached value found.
     */
    var getCacheEntry = function (component, as, options) {
        var _a, _b;
        var _c = getCacheKeys(component, as), finalKey = _c[0], finalAs = _c[1];
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return (_b = (_a = cache.get(finalKey)) === null || _a === void 0 ? void 0 : _a.get(finalAs)) === null || _b === void 0 ? void 0 : _b[options];
    };

    /**
     * Creates a modified version of the passed base render function
     * @param renderFunc The base render function of the component.
     * @param as The "as" component type.
     * @param options The options.
     * @returns A modified version of the passed base render function.
     */
    var createModifiedRenderFunc = function (renderFunc, as, options) {
        var strategy = options.strategy, recursive = options.recursive;
        // Note: this function must NOT be an arrow function because the "this" context matters
        // eslint-disable-next-line react/display-name
        return function () {
            var _a;
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            // @ts-ignore
            var rootElm = (_a = renderFunc === null || renderFunc === void 0 ? void 0 : renderFunc.apply) === null || _a === void 0 ? void 0 : _a.call(renderFunc, this, args);
            var validRootElm = isObject(rootElm);
            var defaultType = validRootElm ? as : function () { return React__default["default"].createElement(React.Fragment, null, rootElm); };
            var _b = validRootElm ? rootElm : { props: args[0] }, props = _b.props, _c = _b.type, type = _c === void 0 ? defaultType : _c;
            return isFunction(type) && recursive ? (React__default["default"].createElement(As, { component: React.createElement(type, props), as: as, options: options })) : (
            // @ts-ignore
            React.createElement(getStrategyElement(type, as, strategy), props));
        };
    };
    /**
     * Gets the modified component type.
     * @param componentType The component type.
     * @param asType The as component type.
     * @param options The options.
     * @returns The modified component type.
     */
    var getModifiedComponentType = function (componentType, asType, options) {
        var _a;
        var _b;
        var isClassComponent = (_b = componentType.prototype) === null || _b === void 0 ? void 0 : _b.isReactComponent;
        var isFunctionComponent = isFunction(componentType);
        if (isClassComponent) {
            // generic name of the generated class
            var extendedClassName = "".concat(componentType.constructor.name, "#As");
            // create new component class extended from the base type with a generic name
            var ModifiedClass = (_a = {},
                // @ts-ignore
                _a[extendedClassName] = /** @class */ (function (_super) {
                    __extends(class_1, _super);
                    function class_1() {
                        return _super !== null && _super.apply(this, arguments) || this;
                    }
                    return class_1;
                }(componentType)),
                _a)[extendedClassName];
            // modify the render function of the new component
            var prototype = ModifiedClass.prototype;
            prototype.render = createModifiedRenderFunc(prototype.render, asType, options);
            return ModifiedClass;
        }
        return isFunctionComponent
            ? // create new component
                createModifiedRenderFunc(componentType, asType, options)
            : // choose from the input components depending on strategy
                getStrategyElement(componentType, asType, options.strategy);
    };
    /**
     * Creates a new component where the resulting component is transformed into the "as" component.
     * @param component The component which shall be transformed.
     * @param as The component into which the input component shall be transformed.
     * @param options The options for the transformation.
     * @returns The resulting component.
     */
    var transform = function (component, as, options) {
        var _a = options || {}, _b = _a.strategy, strategy = _b === void 0 ? 'wrap' : _b, _c = _a.recursive, recursive = _c === void 0 ? true : _c, _d = _a.cache, cache = _d === void 0 ? true : _d, overwriteProps = _a.overwriteProps;
        if (!component && !as) {
            return null;
        }
        if (!component || isBoolean(component)) {
            return renderComponentOrComponentType(as);
        }
        if (!as || isBoolean(as)) {
            return renderComponentOrComponentType(component);
        }
        var cacheOptions = cache ? strategy + recursive : '';
        var _e = getTypeAndProps(component, false), componentType = _e[0], componentProps = _e[1];
        var _f = getTypeAndProps(as, true), asType = _f[0], asProps = _f[1];
        var _g = getOverwrittenProps(overwriteProps, componentProps, asProps), overwrittenComponentProps = _g[0], overwrittenAsProps = _g[1];
        var cacheEntry = cache && getCacheEntry(componentType, asType, cacheOptions);
        var Elm = cacheEntry ||
            setCacheEntry(componentType, asType, cacheOptions, getModifiedComponentType(componentType, asType, {
                strategy: strategy,
                recursive: recursive,
                cache: cache,
            }));
        // @ts-ignore
        return React__default["default"].createElement(Elm, __assign({}, overwrittenComponentProps, overwrittenAsProps));
    };
    var As = function (_a) {
        var component = _a.component, as = _a.as, options = _a.options;
        return transform(component, as, options);
    };

    exports.As = As;
    exports["default"] = As;
    exports.transform = transform;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=react-as.umd.js.map
