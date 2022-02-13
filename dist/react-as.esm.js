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
import React, { isValidElement, cloneElement, createElement, Fragment } from 'react';

const isString = (value) => typeof value === 'string';
const isFunction = (value) => typeof value === 'function';
const isObject = (value) => !!value && typeof value === 'object';
const isBoolean = (value) => typeof value === 'boolean';
const isSymbol = (value) => typeof value === 'symbol';
const renderComponentOrComponentType = (component) => isValidElement(component) ? cloneElement(component) : createElement(component);
const getOverwrittenProps = (overwritePropsFunction, componentProps, asProps) => {
    const result = isFunction(overwritePropsFunction) ? overwritePropsFunction(componentProps, asProps) : null;
    return Array.isArray(result) ? result : [componentProps, asProps];
};
// get the element according to the passed strategy
const getStrategyElement = (component, as, strategy) => {
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
const getTypeAndProps = (component, acceptObj) => {
    let type = component;
    let render;
    let props;
    // components passed like "<Component prop="A" />" are split into their constructor and props
    if (isObject(component)) {
        ({ type, props, render } = component);
    }
    // hoc components like React.memo and React.forwardRef return objects as type with same structure
    let finalType = type || render;
    if (isObject(finalType) && !acceptObj) {
        [finalType] = getTypeAndProps(finalType, acceptObj);
    }
    return [
        finalType,
        (props || finalType.defaultProps || {}),
    ];
};

const cache = new WeakMap();
const cacheKeys = new Map();
/**
 * Transform primitives into objects so they can be added as key to a WeakMap
 * @param component The component.
 * @param as The "as" component.
 * @returns A cache key tuple. First value for the component and second value for the "as" component.
 */
const getCacheKeys = (component, as) => {
    if (isSymbol(component) || isSymbol(as)) {
        return [];
    }
    const componentIsString = isString(component);
    const asIsString = isString(as);
    const componentKey = componentIsString ? `c-${component}` : component;
    const asKey = asIsString ? `a-${as}` : as;
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
const setCacheEntry = (component, as, options, value) => {
    const [cacheKey, asCacheKey] = getCacheKeys(component, as);
    if (cacheKey && asCacheKey && options) {
        const asMap = cache.get(cacheKey);
        if (asMap) {
            const asEntry = asMap.get(asCacheKey);
            if (asEntry) {
                // present component with present as
                asEntry[options] = value;
            }
            else {
                // present component with new as
                asMap.set(asCacheKey, { [options]: value });
            }
        }
        else {
            // new component with new as
            const newAsMap = new WeakMap();
            newAsMap.set(asCacheKey, { [options]: value });
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
const getCacheEntry = (component, as, options) => {
    var _a, _b;
    const [finalKey, finalAs] = getCacheKeys(component, as);
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
const createModifiedRenderFunc = (renderFunc, as, options) => {
    const { strategy, recursive } = options;
    // Note: this function must NOT be an arrow function because the "this" context matters
    // eslint-disable-next-line react/display-name
    return function (...args) {
        var _a;
        // @ts-ignore
        const rootElm = (_a = renderFunc === null || renderFunc === void 0 ? void 0 : renderFunc.apply) === null || _a === void 0 ? void 0 : _a.call(renderFunc, this, args);
        const validRootElm = isObject(rootElm);
        const defaultType = validRootElm ? as : () => React.createElement(Fragment, null, rootElm);
        const { props, type = defaultType } = validRootElm ? rootElm : { props: args[0] };
        return isFunction(type) && recursive ? (React.createElement(As, { component: createElement(type, props), as: as, options: options })) : (
        // @ts-ignore
        createElement(getStrategyElement(type, as, strategy), props));
    };
};
/**
 * Gets the modified component type.
 * @param componentType The component type.
 * @param asType The as component type.
 * @param options The options.
 * @returns The modified component type.
 */
const getModifiedComponentType = (componentType, asType, options) => {
    var _a;
    const isClassComponent = (_a = componentType.prototype) === null || _a === void 0 ? void 0 : _a.isReactComponent;
    const isFunctionComponent = isFunction(componentType);
    if (isClassComponent) {
        // generic name of the generated class
        const extendedClassName = `${componentType.constructor.name}#As`;
        // create new component class extended from the base type with a generic name
        const ModifiedClass = {
            // @ts-ignore
            [extendedClassName]: class extends componentType {
            },
        }[extendedClassName];
        // modify the render function of the new component
        const prototype = ModifiedClass.prototype;
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
const transform = (component, as, options) => {
    const { strategy = 'wrap', recursive = true, cache = true, overwriteProps } = options || {};
    if (!component && !as) {
        return null;
    }
    if (!component || isBoolean(component)) {
        return renderComponentOrComponentType(as);
    }
    if (!as || isBoolean(as)) {
        return renderComponentOrComponentType(component);
    }
    const cacheOptions = cache ? strategy + recursive : '';
    const [componentType, componentProps] = getTypeAndProps(component, false);
    const [asType, asProps] = getTypeAndProps(as, true);
    const [overwrittenComponentProps, overwrittenAsProps] = getOverwrittenProps(overwriteProps, componentProps, asProps);
    const cacheEntry = cache && getCacheEntry(componentType, asType, cacheOptions);
    const Elm = cacheEntry ||
        setCacheEntry(componentType, asType, cacheOptions, getModifiedComponentType(componentType, asType, {
            strategy,
            recursive,
            cache,
        }));
    // @ts-ignore
    return React.createElement(Elm, Object.assign({}, overwrittenComponentProps, overwrittenAsProps));
};
const As = ({ component, as, options }) => transform(component, as, options);

export { As, As as default, transform };
//# sourceMappingURL=react-as.esm.js.map
