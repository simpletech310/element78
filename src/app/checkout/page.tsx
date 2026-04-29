import { redirect } from "next/navigation";

/**
 * Checkout is now a Stripe-hosted flow kicked off from the cart page's
 * CHECKOUT button (see `checkoutCartAction`). This route exists only as a
 * compatibility redirect so old links/bookmarks land on the cart.
 */
export default function CheckoutRedirect() {
  redirect("/cart");
}
