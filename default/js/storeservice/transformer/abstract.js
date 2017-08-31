var AbstractTransformer = function() {
    if (this.constructor === AbstractTransformer) {
        throw new Error("Can't instantiate abstract class!");
    }
};

AbstractTransformer.prototype.formatCheckoutConfig = function(data) {
    return data;
};

AbstractTransformer.prototype.formatCart = function(data) {
    return data;
};

AbstractTransformer.prototype.formatCountries = function(data) {
    return data;
};

AbstractTransformer.prototype.formatProfile = function(data) {
    return data;
};

AbstractTransformer.prototype.formatCheckoutPayload = function(data) {
    return data;
};

AbstractTransformer.prototype.formatCheckoutResponse = function(data) {
    return data;
};

AbstractTransformer.prototype.valueOrNull = function (value) {
    if (typeof value === 'undefined') return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return value;
};

AbstractTransformer.prototype.getRegionCode = function(region) {
    var map = {
        'Australian Capital Territory': 'ACT',
        'New South Wales': 'NSW',
        'Northern Territories': 'NT',
        'Queensland': 'QLD',
        'South Australia': 'SA',
        'Tasmania': 'TAS',
        'Victoria': 'VIC',
        'Western Australia': 'WA'
    };
    if(typeof map[region] !== 'undefined') return map[region];
    return region;
};

AbstractTransformer.prototype.getRegionName = function(region) {
    var map = {
        'ACT': 'Australian Capital Territory',
        'NSW': 'New South Wales',
        'NT': 'Northern Territories',
        'QLD': 'Queensland',
        'SA': 'South Australia',
        'TAS': 'Tasmania',
        'VIC': 'Victoria',
        'WA': 'Western Australia'
    };
    if(typeof map[region] !== 'undefined') return map[region];
    return region;
};

AbstractTransformer.prototype.getCountryCode = function(country) {
    var map = {
        'Australia': 'AU',
        'New Zealand': 'NZ'
    };
    if(typeof map[country] !== 'undefined') return map[country];
    return country;
};

AbstractTransformer.prototype.getCountryName = function(country) {
    var map = {
        'AU': 'Australia',
        'NZ': 'New Zealand'
    };
    if(typeof map[country] !== 'undefined') return map[country];
    return country;
};
