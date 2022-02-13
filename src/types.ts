import {
  JSXElementConstructor,
  FunctionComponent,
  VoidFunctionComponent,
  ExoticComponent,
  ComponentClass,
  ComponentProps,
  ReactElement,
} from 'react';

export type ComponentPropsDefault = Record<string, unknown>;
export type InputComponentProps<C extends InputComponent> = C extends JSXElementConstructor<any> | keyof JSX.IntrinsicElements
  ? ComponentProps<C>
  : ComponentPropsDefault;

/**
 * "wrap" the "component" always with the "as" component
 * "leave" the "component" alone and do nothing if the transformation wasn't sucessful
 */
export type Strategy = 'leave' | 'wrap';

export type OverwriteProps<CompProps = ComponentPropsDefault, AsProps = ComponentPropsDefault> = (
  compProps: CompProps,
  asProps: AsProps
) => [CompProps, AsProps];

export interface Options<CompProps = ComponentPropsDefault, AsProps = ComponentPropsDefault> {
  // The strategy how to continue in case the process would fail.
  strategy: Strategy;
  // Try to transform the component recursively in case its not possible after the first iteration
  recursive: boolean;
  // Whether to use cache.
  cache: boolean;
  // A function which gets the props of both components as params and returns a tuple with the adapted props.
  overwriteProps: OverwriteProps<CompProps, AsProps>;
}

/**
 * Input component can be: MyCompoent | <MyCompoent /> | 'div'
 */
export type InputComponent = JSXElementConstructor<any> | JSX.Element | string;

/**
 * ComponentTypes which can be called like a function
 */
export type CallableComponentType = FunctionComponent | VoidFunctionComponent | ExoticComponent | ComponentClass;

/**
 * ComponentTypes with which createElement can be called without type error
 */
export type ValidComponentType = CallableComponentType | string;

/**
 * ComponentTypes can also be invalid types like "ReactElement" thus the ts-ignore in some places
 */
export type ComponentType = ReactElement | ValidComponentType;
