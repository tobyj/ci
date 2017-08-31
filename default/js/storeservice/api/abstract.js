var AbstractAPI = function () {
    if (this.constructor === AbstractAPI) {
        throw new Error("Can't instantiate abstract class!");
    }
};

AbstractAPI.prototype.init = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.getCart = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.updateQuantity = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.removeItem = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.addCoupon = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.cartClear = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.getCheckoutConfig = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.setCountry = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.getCountries = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.setShippingMethod = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.getProfile = function () {
    throw new Error("Abstract method!");
};

AbstractAPI.prototype.checkout = function () {
    throw new Error("Abstract method!");
};

