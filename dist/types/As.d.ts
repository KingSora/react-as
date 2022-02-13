import { ReactElement } from 'react';
import { InputComponent, InputComponentProps, Options } from './types';
export interface AsProps<C extends InputComponent = InputComponent, A extends InputComponent = InputComponent> {
    component?: C | InputComponent;
    as?: A | InputComponent;
    options?: Partial<Options<InputComponentProps<C>, InputComponentProps<A>>>;
}
declare type AsComponent<C extends InputComponent = InputComponent, A extends InputComponent = InputComponent> = (props: AsProps<C, A>) => ReactElement | null;
declare type Transform<C extends InputComponent = InputComponent, A extends InputComponent = InputComponent> = (component?: AsProps<C, A>['component'], as?: AsProps<C, A>['component'], options?: AsProps<C, A>['options']) => ReturnType<AsComponent>;
/**
 * Creates a new component where the resulting component is transformed into the "as" component.
 * @param component The component which shall be transformed.
 * @param as The component into which the input component shall be transformed.
 * @param options The options for the transformation.
 * @returns The resulting component.
 */
export declare const transform: Transform;
declare const As: AsComponent;
export default As;
