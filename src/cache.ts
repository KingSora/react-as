import { isString, isSymbol } from './utils';
import { ComponentType } from './types';

// eslint-disable-next-line @typescript-eslint/ban-types
type CacheKey = Exclude<ComponentType, string> | String;
type CacheValue = WeakMap<CacheKey, { [key: string]: ComponentType }>;

const cache = new WeakMap<CacheKey, CacheValue>();
const cacheKeys = new Map<ComponentType, CacheKey>();

/**
 * Transform primitives into objects so they can be added as key to a WeakMap
 * @param component The component.
 * @param as The "as" component.
 * @returns A cache key tuple. First value for the component and second value for the "as" component.
 */
const getCacheKeys = (component: ComponentType, as: ComponentType): [CacheKey | undefined, CacheKey | undefined] | [] => {
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
const setCacheEntry = (component: ComponentType, as: ComponentType, options: string, value: ComponentType): ComponentType => {
  const [cacheKey, asCacheKey] = getCacheKeys(component, as);

  if (cacheKey && asCacheKey && options) {
    const asMap = cache.get(cacheKey);

    if (asMap) {
      const asEntry = asMap.get(asCacheKey);
      if (asEntry) {
        // present component with present as
        asEntry[options] = value;
      } else {
        // present component with new as
        asMap.set(asCacheKey, { [options]: value });
      }
    } else {
      // new component with new as
      const newAsMap: CacheValue = new WeakMap();
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
const getCacheEntry = (component: ComponentType, as: ComponentType, options: string): ComponentType | undefined => {
  const [finalKey, finalAs] = getCacheKeys(component, as);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return cache.get(finalKey!)?.get(finalAs!)?.[options];
};

export { getCacheEntry, setCacheEntry };
