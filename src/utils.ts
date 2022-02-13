import { isValidElement, cloneElement, createElement, ExoticComponent, ForwardRefRenderFunction, ReactElement } from 'react';
import { Strategy, ComponentType, ValidComponentType, InputComponent, InputComponentProps, OverwriteProps } from './types';

export const isString = (value: unknown): value is string => typeof value === 'string';
export const isFunction = (value: unknown): value is (...args: any) => any => typeof value === 'function';
export const isObject = (value: unknown): value is object => !!value && typeof value === 'object';
export const isSymbol = (value: unknown): value is symbol => typeof value === 'symbol';

export const renderComponentOrComponentType = (component?: InputComponent) =>
  isValidElement(component) ? cloneElement(component) : createElement(component as Exclude<InputComponent, JSX.Element>);

export const getOverwrittenProps = <CompProps, AsProps>(
  overwritePropsFunction: OverwriteProps<CompProps, AsProps> | undefined,
  componentProps: CompProps,
  asProps: AsProps
): [CompProps, AsProps] => {
  const result = isFunction(overwritePropsFunction) ? overwritePropsFunction(componentProps, asProps) : null;

  return Array.isArray(result) ? result : [componentProps, asProps];
};

// get the element according to the passed strategy
export const getStrategyElement = (component: ValidComponentType, as: ComponentType, strategy: Strategy): ComponentType => {
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
export const getTypeAndProps = <C extends InputComponent, B extends boolean>(
  component: C,
  acceptObj: B
): [B extends false ? ValidComponentType : ComponentType, InputComponentProps<C>] => {
  let type: ComponentType | InputComponent = component;
  let render: ForwardRefRenderFunction<any> | undefined;
  let props: InputComponentProps<C> | undefined;

  // components passed like "<Component prop="A" />" are split into their constructor and props
  if (isObject(component)) {
    ({ type, props, render } = component as ReactElement & {
      render: ForwardRefRenderFunction<any>;
    });
  }

  // hoc components like React.memo and React.forwardRef return objects as type with same structure
  let finalType = type || render;
  if (isObject(finalType) && !acceptObj) {
    [finalType] = getTypeAndProps(finalType as InputComponent, acceptObj);
  }

  return [
    finalType as B extends false ? ValidComponentType : ComponentType,
    (props || (finalType as Exclude<ComponentType, string | ExoticComponent | ReactElement>).defaultProps || {}) as InputComponentProps<C>,
  ];
};
