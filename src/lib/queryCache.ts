import type { QueryClient } from "@tanstack/react-query";

/**
 * One product row lives under several React Query keys at once:
 *
 *   ["admin-products"]                    the dashboard list
 *   ["admin-product", id]                 the edit form's own copy
 *   ["products", category, search, …]     every storefront listing
 *   ["product", slug]                     the product page
 *   ["store-products"]                    the physical-shop till
 *
 * Invalidating only the list is the classic half-fix: the admin saves a new
 * price, the dashboard updates, and the storefront product page keeps serving
 * the old one. The client reports that as "it saved but the site didn't
 * change", which sounds like a caching mystery and is really this.
 *
 * `["product"]` is a PREFIX match — it covers `["product", slug]` for every
 * slug without us having to know which one changed. It does not touch
 * `["product-costs"]`, whose first element is a different string.
 *
 * Call this from every product write. It is cheap: invalidation only marks
 * queries stale, and inactive ones refetch when something mounts them again.
 */
export function invalidateProduct(queryClient: QueryClient, productId?: string | null): void {
  void queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  void queryClient.invalidateQueries({ queryKey: ["products"] });
  void queryClient.invalidateQueries({ queryKey: ["product"] });
  void queryClient.invalidateQueries({ queryKey: ["store-products"] });
  if (productId) void queryClient.invalidateQueries({ queryKey: ["admin-product", productId] });
}
