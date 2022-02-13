import { JSXElementConstructor, FunctionComponent, VoidFunctionComponent, ExoticComponent, ComponentClass, ComponentProps, ReactElement } from 'react';
export declare type ComponentPropsDefault = Record<string, unknown>;
export declare type InputComponentProps<C extends InputComponent> = C extends JSXElementConstructor<any> | keyof JSX.IntrinsicElements ? ComponentProps<C> : ComponentPropsDefault;
/**
 * "wrap" the "component" always with the "as" component
 * "leave" the "component" alone and do nothing if the transformation wasn't sucessful
 */
export declare type Strategy = 'leave' | 'wrap';
export declare type OverwriteProps<CompProps = ComponentPropsDefault, AsProps = ComponentPropsDefault> = (compProps: CompProps, asProps: AsProps) => [CompProps, AsProps];
export interface Options<CompProps = ComponentPropsDefault, AsProps = ComponentPropsDefault> {
    strategy: Strategy;
    recursive: boolean;
    cache: boolean;
    overwriteProps: OverwriteProps<CompProps, AsProps>;
}
/**
 * Input component can be: MyCompoent | <MyCompoent /> | 'div'
 */
export declare type InputComponent = JSXElementConstructor<any> | JSX.Element | string;
/**
 * ComponentTypes which can be called like a function
 */
export declare type CallableComponentType = FunctionComponent | VoidFunctionComponent | ExoticComponent | ComponentClass;
/**
 * ComponentTypes with which createElement can be called without type error
 */
export declare type ValidComponentType = CallableComponentType | string;
/**
 * ComponentTypes can also be invalid types like "ReactElement" thus the ts-ignore in some places
 */
export declare type ComponentType = ReactElement | ValidComponentType;
