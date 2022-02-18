import React, { ReactElement, ReactNode, Component, createElement, Fragment } from 'react';
import {
  isFunction,
  renderComponentOrComponentType,
  getTypeAndProps,
  getStrategyElement,
  getOverwrittenProps,
  isObject,
} from './utils';
import {
  InputComponent,
  InputComponentProps,
  ComponentType,
  CallableComponentType,
  ValidComponentType,
  Options,
  ComponentPropsDefault,
} from './types';

export interface AsProps<C extends InputComponent = InputComponent, A extends InputComponent = InputComponent> {
  // The component which shall be transformed.
  component?: C | InputComponent | null;
  // The component into which the input component shall be transformed.
  as?: A | InputComponent | null;
  // Options for the component behavior.
  options?: Partial<Options<InputComponentProps<C>, InputComponentProps<A>>> | null;
}

type AsComponent = <C extends InputComponent = InputComponent, A extends InputComponent = InputComponent>(
  props: AsProps<C, A>
) => ReactElement | null;

type Transform = <C extends InputComponent, A extends InputComponent>(
  component?: AsProps<C, A>['component'],
  as?: AsProps<C, A>['as'],
  options?: AsProps<C, A>['options']
) => ReturnType<AsComponent>;

/**
 * Creates a modified version of the passed base render function.
 * @param renderFunc The base render function of the component.
 * @param componentTypeProps The component type and props tuple.
 * @param asTypeProps The "as" component type and props tuble.
 * @param options The options for the transformation.
 * @returns A modified version of the passed base render function.
 */
const createModifiedRenderFunc = (
  renderFunc: CallableComponentType | (() => ReactNode),
  componentTypeProps: [ValidComponentType, ComponentPropsDefault],
  asTypeProps: [ComponentType, ComponentPropsDefault],
  options: Omit<Options, 'overwriteProps'>
): CallableComponentType => {
  const [componentType, componentProps] = componentTypeProps;
  const [asType, asProps] = asTypeProps;
  const { strategy, recursive } = options;
  // Note: this function must NOT be an arrow function because the "this" context matters
  // eslint-disable-next-line react/display-name
  return function (...args: any) {
    // @ts-ignore
    const rootElm: ReactNode = renderFunc?.apply?.(this, args);
    const validRootElm = isObject(rootElm);
    const defaultType = validRootElm ? asType : () => <Fragment>{rootElm}</Fragment>;
    const { props, type = defaultType } = validRootElm ? (rootElm as ReactElement) : { props: args[0] };

    if (isFunction(type) && recursive) {
      return <As component={createElement(type, props)} as={asType} options={options} />;
    }

    const finalType = getStrategyElement(type, asType, strategy);
    const passedComponentProps = finalType === componentType ? componentProps : {};
    const passedAsProps = finalType === asType ? asProps : {};
    // @ts-ignore
    return createElement(finalType, { ...passedComponentProps, ...passedAsProps, ...props });
  };
};

/**
 * Gets the modified component type.
 * @param componentTypeProps The component type and props tuple.
 * @param asTypeProps The "as" component type and props tuble.
 * @param options The options for the transformation.
 * @returns The modified component type.
 */
const getModifiedComponentType = (
  componentTypeProps: [ValidComponentType, ComponentPropsDefault],
  asTypeProps: [ComponentType, ComponentPropsDefault],
  options: Omit<Options, 'overwriteProps'>
): ComponentType => {
  const [componentType] = componentTypeProps;
  const [asType] = asTypeProps;
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
    prototype.render = createModifiedRenderFunc(prototype.render, componentTypeProps, asTypeProps, options);
    return ModifiedClass;
  }

  return isFunctionComponent
    ? // create new component
      createModifiedRenderFunc(componentType as CallableComponentType, componentTypeProps, asTypeProps, options)
    : // choose from the input components depending on strategy
      getStrategyElement(componentType, asType, options.strategy);
};

/**
 * Creates a new component where the passed component is transformed into the "as" component.
 * @param component The component which shall be transformed.
 * @param as The component into which the input component shall be transformed.
 * @param options The options for the transformation.
 * @returns The resulting component.
 */
export const transform: Transform = (component?, as?, options?) => {
  const { strategy = 'wrap', recursive = true, overwriteProps } = options || {};
  if (!component && !as) {
    return null;
  }
  if (!component) {
    return renderComponentOrComponentType(as);
  }
  if (!as) {
    return renderComponentOrComponentType(component);
  }

  const [componentType, componentProps] = getTypeAndProps(component, false);
  const [asType, asProps] = getTypeAndProps(as, true);
  const [overwrittenComponentProps, overwrittenAsProps] = getOverwrittenProps(overwriteProps, componentProps, asProps);

  const Elm = getModifiedComponentType([componentType, overwrittenComponentProps], [asType, overwrittenAsProps], {
    strategy,
    recursive,
  });

  // @ts-ignore
  return <Elm {...overwrittenComponentProps} {...overwrittenAsProps} />;
};

/**
 * Transforms the passed component into the passed "as" component.
 * @param props The props.
 * @returns A new component which is the resulting transformed component.
 */
const As: AsComponent = ({ component, as, options }) => transform(component, as, options);

export default As;
