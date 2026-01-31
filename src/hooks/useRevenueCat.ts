/**
 * RevenueCat Hook
 * 
 * Convenience hook for accessing RevenueCat context.
 * Re-exports the context hook for easier imports.
 */

import { useRevenueCat as useRevenueCatContext } from '../context/RevenueCatContext';

export { useRevenueCatContext as useRevenueCat };
export default useRevenueCatContext;

