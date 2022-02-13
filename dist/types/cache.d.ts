import { ComponentType } from './types';
/**
 * Sets or adapts an cache entry.
 * @param component The component.
 * @param as The "as" component.
 * @param options The used options as a string.
 * @param value The calculated value (result) which is cached for the future.
 * @returns The passed value.
 */
declare const setCacheEntry: (component: ComponentType, as: ComponentType, options: string, value: ComponentType) => ComponentType;
/**
 * Gets the cache entry for the request component and "as" component.
 * @param component The component.
 * @param as The "as" component
 * @param options The used options as a string.
 * @returns The cached component type or undefined if no cached value found.
 */
declare const getCacheEntry: (component: ComponentType, as: ComponentType, options: string) => ComponentType | undefined;
export { getCacheEntry, setCacheEntry };
