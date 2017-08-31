/**
 * Default language / translation file for quickcheckout.
 * Copy this file to each site and uncomment any lines you wish to provide a translation for.
 */

window.quickCheckout = window.quickCheckout || {};

window.quickCheckout.lang = {
    translations : {
        //IN JS FILES:
        //default string                                            //your translation
        "Click & Collect is currently limited to selected stores"   : "Click &amp; Collect currently limited to select stores only. <span class=\"nobreak\">More stores coming soon.</span>"
        /*
        "Error fetching bag."                                       : "Error fetching bag.",
        "Error emptying bag."                                       : "Error emptying bag.",
        "Bag is empty."                                             : "Bag is empty. Bag is sad.",
        "Quantity updated."                                         : "Quantity updated.",
        "Error editing product quantity."                           : "Houston we have a problem...",
        "%product% is back in the bag."                             : "%product% is back in the bag! Sweet!",
        "Error re-adding your item."                                : "Something went wrong re-adding your item.",
        "Gift box could not be added."                              : "Gift box could not be added to order.",
        "Gift box could not be removed."                            : "Gift box could not be removed from order.",
        "Error applying your gift card."                            : "There was an error applying your gift card.",
        "Error validating gift card."                               : "Error validating Gift Card.",
        "Error applying promo code."                                : "Error applying promo code.",
        "Gift card for %recipient% added to bag."                   : "Gift card for %recipient% is in the bag!",
        "Error adding gift card."                                   : "Sorry, there was an error adding your gift card.",
        "Error fetching checkout."                                  : "Error fetching checkout.",
        "Spend %spendmore% more for <strong>%reducedOrFree%</strong> shipping %_toCountryName%!" : "Spend %spendmore% more for <strong>%reducedOrFree%</strong> shipping%_toCountryName% !",
        "You qualify for <strong>%reducedOrFree%</strong> international shipping%_toCountryName%!" : "You qualify for <strong>%reducedOrFree%</strong> international shipping%_toCountryName%!",
        "Sorry, that promo code is invalid."                        : "Sorry, that promo code is invalid.",
        "Sorry, that gift card is invalid."                         : "Sorry, that gift card is invalid.",
        "Promo code removed from order."                            : "Promo code removed from order.",
        "Gift card removed from order."                             : "Gift card removed from order.",
        "Shipping country updated failed."                          : "Shipping country updated failed.",
        "Error fetching locations."                                 : "Error fetching locations.",
        "Geolocation is not supported by your browser."             : "Geolocation is not supported by your browser.",
        "Error, sign in failed."                                    : "Sign in failed. Something went wrong",
        "We have sent a new password to your email address."        : "We have sent a new password to your email address.",
        "Password reset failed."                                    : "Password reset failed. Something went wrong.",
        "For this delivery option, you must first <a>create an Australia Post MyPost account</a>." : "For this delivery option, you must first <a>create an Australia Post MyPost account</a>.",
        "A Parcel Locker is perfect for when you won't be at home/work to receive a parcel." : "A Parcel Locker is perfect for when you won't be at home/work to receive a parcel.",
        "Find out more <a>here</a>."                                : "Find out more <a>here</a>.",
        "Please enter a valid email address."                       : "Please enter a valid email address.",
        "Please enter your first name."                             : "Please enter your first name.",
        "Please enter your last name."                              : "Please enter your last name.",
        "Please choose a \"SHIP TO\" address or add a new address." : "Please choose a \"SHIP TO\" address or add a new address.",
        "Please choose a \"BILL TO\" address or add a new address." : "Please choose a \"BILL TO\" address or add a new address.",
        "Please enter a delivery address."                          : "Please enter a delivery address.",
        "Please enter a delivery suburb."                           : "Please enter a delivery suburb.",
        "Please enter a delivery postcode."                         : "Please enter a delivery postcode.",
        "Please select a delivery state or territory."              : "Please select a delivery state or territory.",
        "Please select a delivery country."                         : "Please select a delivery country.",
        "Please enter a billing first name."                        : "Please enter a billing first name.",
        "Please enter a billing last name."                         : "Please enter a billing last name.",
        "Please enter a billing address."                           : "Please enter a billing address.",
        "Please enter a billing suburb."                            : "Please enter a billing suburb.",
        "Please enter a billing postcode."                          : "Please enter a billing postcode.",
        "Please select a billing state or territory."               : "Please select a billing state or territory.",
        "Please select a billing country."                          : "Please select a billing country.",
        "Please search for and select a location to collect from."  : "Please search for and select a location to collect from.",
        "Please select a location to collect from."                 : "Please select a location to collect from.",
        "Mobile phone is required for Parcel Locker collection."    : "Mobile phone is required for Parcel Locker collection.",
        "Phone number is required for Store collection."            : "Phone number is required for Store collection.",
        "Invalid credit card number."                               : "Invalid credit card number.",
        "Invalid credit card expiry."                               : "Invalid credit card expiry.",
        "Invalid credit card CVC."                                  : "Invalid credit card CVC.",
        "Click &amp; Collect is only available via SECURE CHECKOUT.": "Click &amp; Collect is only available via SECURE CHECKOUT.",
        "Proceeding to PayPal for payment. Please wait..."          : "Proceeding to PayPal for payment. Please wait...",
        "Order submitted! Please wait..."                           : "Order submitted! Please wait...",
        "AfterPay Gateway is not available."                        : "AfterPay Gateway is not available.",

        //CHECKOUT.HBS:
        "How do you want to checkout?"                              : "How do you want to checkout?",
        "How do you want to receive your order?"                    : "How do you want to receive your order?",
        "How do you want to pay?"                                   : "How do you want to pay?",
        "Enter your details."                                       : "Enter your details.",
        "Forgot password?"                                          : "Forgot password?",
        "Enter an email address to receive your order confirmation.": "Enter an email address to receive your order confirmation.",
        "Enter your delivery details."                              : "Enter your delivery details.",
        "Search for a location to collect your order"               : "Search for a location to collect your goodies",

        //CART_ITEMS.HBS:
        "Your products will arrive in a premium gift box, complete with a personal card from you." : "Your products will arrive in a premium gift box, complete with a personal card from you.",
        "Your message will be printed on a card and placed in the gift box." : "Your message will be printed on a card and placed in the gift box."
        */
    },

    // sauce: Array of strings. A random element of this array is prepended to some success messages.
    // set to null if sauce not required )-;
    sauce : null
};