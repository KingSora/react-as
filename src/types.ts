import {
  JSXElementConstructor,
  FunctionComponent,
  VoidFunctionComponent,
  ExoticComponent,
  ComponentClass,
  ComponentProps,
  ReactElement,
} from 'react';

/**
 * The strategy for how to deal with the transformation of the component if a invalid root node was found.
 * wrap: wrap the "component" always with the "as" component
 * leave: leave the "component" alone and do nothing if the transformation wasn't successful
 */
export type Strategy = 'leave' | 'wrap';

/**
 * Overwrite props function used to combine or overwrite props.
 */
export type OverwriteProps<CompProps = ComponentPropsDefault, AsProps = ComponentPropsDefault> = (
  compProps: CompProps,
  asProps: AsProps
) => CompProps & AsProps;

/**
 * Options used to customize the component transformation process.
 */
export interface Options<CompProps = ComponentPropsDefault, AsProps = ComponentPropsDefault> {
  // The strategy how to continue in case the transformation process would fail.
  strategy: Strategy;
  // Try to transform the component recursively if the transformation isn't successful after the first iteration.
  recursive: boolean;
  // Whether to use cache instead of transforming already known results again.
  cache: boolean;
  // A function which gets the props of both components as arguments and returns a object with the combined adapted props.
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

/**
 * Helper type for unknown or not inferable component props.
 */
export type ComponentPropsDefault = Record<string, unknown>;

/**
 * Helper type to infer component props from the JSXElementConstructor or JSX.IntrinsicElements.
 */
export type InputComponentProps<C extends InputComponent> = C extends JSXElementConstructor<any> | keyof JSX.IntrinsicElements
  ? ComponentProps<C>
  : ComponentPropsDefault;
