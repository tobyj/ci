/**
 * Magento Enterprise Edition
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Magento Enterprise Edition License
 * that is bundled with this package in the file LICENSE_EE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://www.magentocommerce.com/license/enterprise-edition
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@magentocommerce.com so we can send you a copy immediately.
 *
 * DISCLAIMER
 *
 * Do not edit or add to this file if you wish to upgrade Magento to newer
 * versions in the future. If you wish to customize Magento for your
 * needs please refer to http://www.magentocommerce.com for more information.
 *
 * @category    design
 * @package     enterprise_default
 * @copyright   Copyright (c) 2014 Magento Inc. (http://www.magentocommerce.com)
 * @license     http://www.magentocommerce.com/license/enterprise-edition
 */
 
if (!window.Enterprise) {
    window.Enterprise = {};
}

if (!Enterprise.CatalogEvent) {
    Enterprise.CatalogEvent = {};
}

Enterprise.CatalogEvent.Ticker = Class.create();

Object.extend(Enterprise.CatalogEvent.Ticker.prototype, {
    initialize: function (container, seconds) {
        this.container = $(container);
        this.seconds   = seconds;
        this.start     = new Date();
        this.interval = setInterval(this.applyTimer.bind(this), 1000);
        this.applyTimer();
    },
    getEstimate: function () {
        var now = new Date();
        
        var result = this.seconds - (now.getTime() - this.start.getTime())/1000;
        
        if (result < 0) {
            return 0;
        }
        
        return Math.round(result);
    },
    applyTimer: function () {
        var seconds = this.getEstimate();
        var daySec = Math.floor(seconds / (3600*24)) * (3600*24);
        var hourSec = Math.floor(seconds / 3600) * 3600;
        var minuteSec =  Math.floor(seconds / 60) * 60;
        var secondSec = seconds;
        
        // Convert times into final string representations
        var dayString = this.formatNumber(Math.floor(daySec/(3600*24)));
		var hourString = this.formatNumber(Math.floor((hourSec - daySec)/3600));
		var minsString = this.formatNumber(Math.floor((minuteSec - hourSec)/60));
		var secString = this.formatNumber(seconds - minuteSec);
		
		// Create some holders for our outbound content
		var daysOut = '';
		var hoursOut = '';
		var minsOut = '';
		var secsOut = '';

		// Split individual digits and encapsulate in two separate containers 
		for (var i = 0; i < 2; i += 1) {
			daysOut += '<span>' + dayString.charAt(i) + '</span>';
			hoursOut += '<span>' + hourString.charAt(i) + '</span>';
			minsOut += '<span>' + minsString.charAt(i) + '</span>';
			secsOut += '<span>' + secString.charAt(i) + '</span>';
		}
		
		// Send outbound content to existing containers
		this.container.down('.days').update(daysOut);
		this.container.down('.hour').update(hoursOut);
		this.container.down('.minute').update(minsOut);
		this.container.down('.second').update(secsOut);
    },
    formatNumber: function (number) {
        if (number < 10) {
            return '0' + number.toString();
        }

        return number.toString();
    }
});
