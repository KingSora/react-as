import {
  isValidElement,
  cloneElement,
  createElement,
  ExoticComponent,
  ForwardRefRenderFunction,
  ReactElement,
} from 'react';
import {
  Strategy,
  ComponentType,
  ValidComponentType,
  InputComponent,
  InputComponentProps,
  OverwriteProps,
} from './types';

export const isString = (value: unknown): value is string => typeof value === 'string';
export const isFunction = (value: unknown): value is (...args: any) => any => typeof value === 'function';
export const isObject = (value: unknown): value is object => !!value && typeof value === 'object';

/**
 * Creates a ReactElement out of the passed component or componentType.
 * @param component The passed component or componentType.
 * @returns A ReactElement which was created from the input.
 */
export const renderComponentOrComponentType = (component?: InputComponent | null): ReactElement =>
  isValidElement(component)
    ? cloneElement(component)
    : createElement(component as Exclude<InputComponent, JSX.Element>);

/**
 * Overwrites the passed props with the passed overwrite function.
 * @param overwritePropsFunction The function which overwrites the passed props.
 * @param componentProps The component props.
 * @param asProps The "as" component props.
 * @returns The overwritten props.
 */
export const getOverwrittenProps = <CompProps, AsProps>(
  overwritePropsFunction: OverwriteProps<CompProps, AsProps> | undefined,
  componentProps: CompProps,
  asProps: AsProps
): [CompProps, AsProps] => {
  const result = isFunction(overwritePropsFunction) ? overwritePropsFunction(componentProps, asProps) : null;
  return Array.isArray(result) ? result : [componentProps, asProps];
};

/**
 * Gets the correct component type according to the passed strategy
 * @param componentType The component type.
 * @param asType The "as" component type.
 * @param strategy The strategy.
 * @returns Either the component or "as" component type depending on the strategy.
 */
export const getStrategyElement = (
  componentType: ComponentType,
  asType: ComponentType,
  strategy: Strategy
): ComponentType => {
  switch (strategy) {
    case 'leave': {
      return (isString(componentType) && asType) || componentType;
    }
    case 'wrap':
    default: {
      return asType;
    }
  }
};

/**
 * Gets the component type of the passed component or component type. (normalize input of components)
 * @param component The component or component type.
 * @param acceptObj Whether the resulting component type can be an object (fragments etc. are special component types which are objects)
 * @returns A tuple with the final component type and its props.
 */
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
    (props ||
      (finalType as Exclude<ComponentType, string | ExoticComponent | ReactElement>).defaultProps ||
      {}) as InputComponentProps<C>,
  ];
};
