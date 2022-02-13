import React, { ReactElement, ReactNode, Component, createElement, Fragment } from 'react';
import { getCacheEntry, setCacheEntry } from './cache';
import { isBoolean, isFunction, renderComponentOrComponentType, getTypeAndProps, getStrategyElement, getOverwrittenProps, isObject } from './utils';
import { InputComponent, InputComponentProps, ComponentType, CallableComponentType, ValidComponentType, Options } from './types';

export interface AsProps<C extends InputComponent = InputComponent, A extends InputComponent = InputComponent> {
  // The component to be transformed.
  component?: C | InputComponent;
  // The "as" component.
  as?: A | InputComponent;
  // Options for the component behavior.
  options?: Partial<Options<InputComponentProps<C>, InputComponentProps<A>>>;
}

type AsComponent<C extends InputComponent = InputComponent, A extends InputComponent = InputComponent> = (
  props: AsProps<C, A>
) => ReactElement | null;

type Transform<C extends InputComponent = InputComponent, A extends InputComponent = InputComponent> = (
  component?: AsProps<C, A>['component'],
  as?: AsProps<C, A>['component'],
  options?: AsProps<C, A>['options']
) => ReturnType<AsComponent>;

/**
 * Creates a modified version of the passed base render function
 * @param renderFunc The base render function of the component.
 * @param as The "as" component type.
 * @param options The options.
 * @returns A modified version of the passed base render function.
 */
const createModifiedRenderFunc = (
  renderFunc: CallableComponentType | (() => ReactNode),
  as: ComponentType,
  options: Omit<Options, 'overwriteProps'>
): CallableComponentType => {
  const { strategy, recursive } = options;
  // Note: this function must NOT be an arrow function because the "this" context matters
  // eslint-disable-next-line react/display-name
  return function (...args: any) {
    // @ts-ignore
    const rootElm: ReactNode = renderFunc?.apply?.(this, args);
    const validRootElm = isObject(rootElm);
    const defaultType = validRootElm ? as : () => <Fragment>{rootElm}</Fragment>;
    const { props, type = defaultType } = validRootElm ? (rootElm as ReactElement) : { props: args[0] };

    return isFunction(type) && recursive ? (
      <As component={createElement(type, props)} as={as} options={options} />
    ) : (
      // @ts-ignore
      createElement(getStrategyElement(type, as, strategy), props)
    );
  };
};

/**
 * Gets the modified component type.
 * @param componentType The component type.
 * @param asType The as component type.
 * @param options The options.
 * @returns The modified component type.
 */
const getModifiedComponentType = (
  componentType: ValidComponentType,
  asType: ComponentType,
  options: Omit<Options, 'overwriteProps'>
): ComponentType => {
  const isClassComponent = (componentType as any).prototype?.isReactComponent;
  const isFunctionComponent = isFunction(componentType);

  if (isClassComponent) {
    // generic name of the generated class
    const extendedClassName = `${componentType.constructor.name}#As`;

    // create new component class extended from the base type with a generic name
    const ModifiedClass = {
      // @ts-ignore
      [extendedClassName]: class extends componentType {} as {
        new (): Component;
      },
    }[extendedClassName];

    // modify the render function of the new component
    const prototype = ModifiedClass.prototype;
    prototype.render = createModifiedRenderFunc(prototype.render, asType, options);
    return ModifiedClass;
  }

  return isFunctionComponent
    ? // create new component
      createModifiedRenderFunc(componentType as CallableComponentType, asType, options)
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
export const transform: Transform = (component?, as?, options?) => {
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

  const Elm =
    cacheEntry ||
    setCacheEntry(
      componentType,
      asType,
      cacheOptions,
      getModifiedComponentType(componentType, asType, {
        strategy,
        recursive,
        cache,
      })
    );

  // @ts-ignore
  return <Elm {...overwrittenComponentProps} {...overwrittenAsProps} />;
};

const As: AsComponent = ({ component, as, options }) => transform(component, as, options);

export default As;
