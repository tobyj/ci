/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Latitude/longitude spherical geodesy formulae & scripts (c) Chris Veness 2002-2010            */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var p1 = new LatLon(51.5136, -0.0983);                                                      */
/*    var p2 = new LatLon(51.4778, -0.0015);                                                      */
/*    var dist = p1.distanceTo(p2);          // in km                                             */
/*    var brng = p1.bearingTo(p2);           // in degrees clockwise from north                   */
/*    ... etc                                                                                     */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Note that minimal error checking is performed in this example code!                           */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */


/**
 * Creates a point on the earth's surface at the supplied latitude / longitude
 *
 * @constructor
 * @param {Number} lat: latitude in numeric degrees
 * @param {Number} lon: longitude in numeric degrees
 * @param {Number} [rad=6371]: radius of earth if different value is required from standard 6,371km
 */

function LatLon(lat, lon, rad) {
  if (typeof(rad) == 'undefined') rad = 6371;  // earth's mean radius in km
  // only accept numbers or valid numeric strings
  this._lat = typeof(lat)=='number' ? lat : typeof(lat)=='string' && lat.trim()!='' ? +lat : NaN;
  this._lon = typeof(lat)=='number' ? lon : typeof(lon)=='string' && lon.trim()!='' ? +lon : NaN;
  this._radius = typeof(rad)=='number' ? rad : typeof(rad)=='string' && trim(lon)!='' ? +rad : NaN;
}


/**
 * Returns the distance from this point to the supplied point, in km 
 * (using Haversine formula)
 *
 * from: Haversine formula - R. W. Sinnott, "Virtues of the Haversine",
 *       Sky and Telescope, vol 68, no 2, 1984
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @param   {Number} [precision=4]: no of significant digits to use for returned value
 * @returns {Number} Distance in km between this point and destination point
 */
LatLon.prototype.distanceTo = function(point, precision) {
  // default 4 sig figs reflects typical 0.3% accuracy of spherical model
  if (typeof precision == 'undefined') precision = 4;  
  
  var R = this._radius;
  var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
  var lat2 = point._lat.toRad(), lon2 = point._lon.toRad();
  var dLat = lat2 - lat1;
  var dLon = lon2 - lon1;

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1) * Math.cos(lat2) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c;
  return d.toPrecisionFixed(precision);
}

/**
 * Returns the latitude of this point; signed numeric degrees if no format, otherwise format & dp 
 * as per Geo.toLat()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 *
 * @requires Geo
 */
LatLon.prototype.lat = function(format, dp) {
  if (typeof format == 'undefined') return this._lat;
  
  return Geo.toLat(this._lat, format, dp);
}

/**
 * Returns the longitude of this point; signed numeric degrees if no format, otherwise format & dp 
 * as per Geo.toLon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 *
 * @requires Geo
 */
LatLon.prototype.lon = function(format, dp) {
  if (typeof format == 'undefined') return this._lon;
  
  return Geo.toLon(this._lon, format, dp);
}

/**
 * Returns a string representation of this point; format and dp as per lat()/lon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {String} Comma-separated latitude/longitude
 *
 * @requires Geo
 */
LatLon.prototype.toString = function(format, dp) {
  if (typeof format == 'undefined') format = 'dms';
  
  if (isNaN(this._lat) || isNaN(this._lon)) return '-,-';
  
  return Geo.toLat(this._lat, format, dp) + ', ' + Geo.toLon(this._lon, format, dp);
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

// ---- extend Number object with methods for converting degrees/radians

/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

/** Converts radians to numeric (signed) degrees */
if (typeof(Number.prototype.toDeg) === "undefined") {
  Number.prototype.toDeg = function() {
    return this * 180 / Math.PI;
  }
}

/** 
 * Formats the significant digits of a number, using only fixed-point notation (no exponential)
 * 
 * @param   {Number} precision: Number of significant digits to appear in the returned string
 * @returns {String} A string representation of number which contains precision significant digits
 */
if (typeof(Number.prototype.toPrecisionFixed) === "undefined") {
  Number.prototype.toPrecisionFixed = function(precision) {
    if (isNaN(this)) return 'NaN';
    var numb = this < 0 ? -this : this;  // can't take log of -ve number...
    var sign = this < 0 ? '-' : '';
    
    if (numb == 0) { n = '0.'; while (precision--) n += '0'; return n };  // can't take log of zero
  
    var scale = Math.ceil(Math.log(numb)*Math.LOG10E);  // no of digits before decimal
    var n = String(Math.round(numb * Math.pow(10, precision-scale)));
    if (scale > 0) {  // add trailing zeros & insert decimal as required
      l = scale - n.length;
      while (l-- > 0) n = n + '0';
      if (scale < n.length) n = n.slice(0,scale) + '.' + n.slice(scale);
    } else {          // prefix decimal and leading zeros if required
      while (scale++ < 0) n = '0' + n;
      n = '0.' + n;
    }
    return sign + n;
  }
}

/** Trims whitespace from string (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if (typeof(String.prototype.trim) === "undefined") {
  String.prototype.trim = function() {
    return String(this).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
  }
}


/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Geodesy representation conversion functions (c) Chris Veness 2002-2010                        */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var lat = Geo.parseDMS('51° 28′ 40.12″ N');                                                 */
/*    var lon = Geo.parseDMS('000° 00′ 05.31″ W');                                                */
/*    var p1 = new LatLon(lat, lon);                                                              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Geo = {};  // Geo namespace, representing static class

/**
 * Parses string representing degrees/minutes/seconds into numeric degrees
 *
 * This is very flexible on formats, allowing signed decimal degrees, or deg-min-sec optionally
 * suffixed by compass direction (NSEW). A variety of separators are accepted (eg 3º 37' 09"W) 
 * or fixed-width format without separators (eg 0033709W). Seconds and minutes may be omitted. 
 * (Note minimal validation is done).
 *
 * @param   {String|Number} dmsStr: Degrees or deg/min/sec in variety of formats
 * @returns {Number} Degrees as decimal number
 * @throws  {TypeError} dmsStr is an object, perhaps DOM object without .value?
 */
Geo.parseDMS = function(dmsStr) {
  if (typeof deg == 'object') throw new TypeError('Geo.parseDMS - dmsStr is [DOM?] object');
  
  // check for signed decimal degrees without NSEW, if so return it directly
  if (typeof dmsStr === 'number' && isFinite(dmsStr)) return Number(dmsStr);
  
  // strip off any sign or compass dir'n & split out separate d/m/s
  var dms = String(dmsStr).trim().replace(/^-/,'').replace(/[NSEW]$/i,'').split(/[^0-9.,]+/);
  if (dms[dms.length-1]=='') dms.splice(dms.length-1);  // from trailing symbol
  
  if (dms == '') return NaN;
  
  // and convert to decimal degrees...
  switch (dms.length) {
    case 3:  // interpret 3-part result as d/m/s
      var deg = dms[0]/1 + dms[1]/60 + dms[2]/3600; 
      break;
    case 2:  // interpret 2-part result as d/m
      var deg = dms[0]/1 + dms[1]/60; 
      break;
    case 1:  // just d (possibly decimal) or non-separated dddmmss
      var deg = dms[0];
      // check for fixed-width unseparated format eg 0033709W
      if (/[NS]/i.test(dmsStr)) deg = '0' + deg;  // - normalise N/S to 3-digit degrees
      if (/[0-9]{7}/.test(deg)) deg = deg.slice(0,3)/1 + deg.slice(3,5)/60 + deg.slice(5)/3600; 
      break;
    default:
      return NaN;
  }
  if (/^-|[WS]$/i.test(dmsStr.trim())) deg = -deg; // take '-', west and south as -ve
  return Number(deg);
}

/**
 * Convert decimal degrees to deg/min/sec format
 *  - degree, prime, double-prime symbols are added, but sign is discarded, though no compass
 *    direction is added
 *
 * @private
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} deg formatted as deg/min/secs according to specified format
 * @throws  {TypeError} deg is an object, perhaps DOM object without .value?
 */
Geo.toDMS = function(deg, format, dp) {
  if (typeof deg == 'object') throw new TypeError('Geo.toDMS - deg is [DOM?] object');
  if (isNaN(deg)) return 'NaN';  // give up here if we can't make a number from deg
  
    // default values
  if (typeof format == 'undefined') format = 'dms';
  if (typeof dp == 'undefined') {
    switch (format) {
      case 'd': dp = 4; break;
      case 'dm': dp = 2; break;
      case 'dms': dp = 0; break;
      default: format = 'dms'; dp = 0;  // be forgiving on invalid format
    }
  }
  
  deg = Math.abs(deg);  // (unsigned result ready for appending compass dir'n)
  
  switch (format) {
    case 'd':
      d = deg.toFixed(dp);     // round degrees
      if (d<100) d = '0' + d;  // pad with leading zeros
      if (d<10) d = '0' + d;
      dms = d + '\u00B0';      // add º symbol
      break;
    case 'dm':
      var min = (deg*60).toFixed(dp);  // convert degrees to minutes & round
      var d = Math.floor(min / 60);    // get component deg/min
      var m = (min % 60).toFixed(dp);  // pad with trailing zeros
      if (d<100) d = '0' + d;          // pad with leading zeros
      if (d<10) d = '0' + d;
      if (m<10) m = '0' + m;
      dms = d + '\u00B0' + m + '\u2032';  // add º, ' symbols
      break;
    case 'dms':
      var sec = (deg*3600).toFixed(dp);  // convert degrees to seconds & round
      var d = Math.floor(sec / 3600);    // get component deg/min/sec
      var m = Math.floor(sec/60) % 60;
      var s = (sec % 60).toFixed(dp);    // pad with trailing zeros
      if (d<100) d = '0' + d;            // pad with leading zeros
      if (d<10) d = '0' + d;
      if (m<10) m = '0' + m;
      if (s<10) s = '0' + s;
      dms = d + '\u00B0' + m + '\u2032' + s + '\u2033';  // add º, ', " symbols
      break;
  }
  
  return dms;
}

/**
 * Convert numeric degrees to deg/min/sec latitude (suffixed with N/S)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toLat = function(deg, format, dp) {
  var lat = Geo.toDMS(deg, format, dp);
  return lat=='' ? '' : lat.slice(1) + (deg<0 ? 'S' : 'N');  // knock off initial '0' for lat!
}

/**
 * Convert numeric degrees to deg/min/sec longitude (suffixed with E/W)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toLon = function(deg, format, dp) {
  var lon = Geo.toDMS(deg, format, dp);
  return lon=='' ? '' : lon + (deg<0 ? 'W' : 'E');
}

/**
 * Convert numeric degrees to deg/min/sec as a bearing (0º..360º)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toBrng = function(deg, format, dp) {
  deg = (Number(deg)+360) % 360;  // normalise -ve values to 180º..360º
  var brng =  Geo.toDMS(deg, format, dp);
  return brng.replace('360', '0');  // just in case rounding took us up to 360º!
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */