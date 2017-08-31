var MagentoTransformer = function() {
    AbstractTransformer.apply(this, arguments);
};
MagentoTransformer.prototype = Object.create(AbstractTransformer.prototype);
MagentoTransformer.prototype.constructor = MagentoTransformer;

MagentoTransformer.prototype.formatProfile = function(data) {
    if (data === null) {
        return {
            identities: {},
            addresses: {}
        };
    }

    return data;
};