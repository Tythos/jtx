/**
  * @author <code@tythos.net>
  */

define(function(require, exports, module) {
	exports.String = {};
	exports.Array = {};
	exports.Object = {};
	exports.Date = {};
	exports.Number = {};

	function isEdge() {
		// Great job, Microsoft! Brand-new "standards-compliant" browser, and we already need to polyfill
		return 0 <= window.navigator.userAgent.search(/ Edge\//);
	}
	
	/* --- String Extensions --- */

	exports.String.capitalize = function(obj) {
		/* Returns a copy of the given string, in which each word
		   (space-delimited) has been capitalized.
		*/
		let parts = obj.split(' ');
		for (let i = 0; i < parts.length; i++) {
			if (parts[i].length > 0) {
				let part = parts[i];
				parts[i] = part[0].toUpperCase() + part.substr(1);
			}
		}
		return parts.join(' ');
	};

	/* --- Array Extensions --- */

	exports.Array.intersect = function(obj, rhs) {
		/* Returns a new array containing only elements included in both given
		   arrays.
		*/
		let result = [];
		obj.forEach(function(val) {
			if (rhs.indexOf(val) >= 0) {
				result.push(val);
			}
		});
		return result;
	};

	exports.Array.union = function(obj, rhs) {
		/* Returns a new array containing all elements (unique) from both
		   arrays. Unlike the concatenate operator, this is a "set union" and
		   therefore the result will have unique entries.
		*/
		let result = [];
		obj.forEach(function(val) {
			if (result.indexOf(val) < 0) {
				result.push(val);
			}
		});
		rhs.forEach(function(val) {
			if (result.indexOf(val) < 0) {
				result.push(val);
			}
		});
		return result;
	};

	jtx.Array.complement = function(obj, rhs) {
		/* Returns all elements from Array obj NOT present in Array rhs.
		   Technically, this is the "relative complement".
		*/
		let result = [];
		obj.forEach(function(val) {
			if (rhs.indexOf(val) < 0) {
				result.push(val);
			}
		});
		return result;
	};

	exports.Array.unique = function(obj) {
		/* Returns a deep copy of the given Array, in which all elements are
		   unique.
		*/
		return exports.Array.union(obj, obj);
	};

	jtx.Array.count = function(arr, val) {
		/* Returns the number of times that *val* occurs in *arr*.
		*/
		return arr.reduce(function(acc, cv) {
			return cv == val ? acc + 1 : acc;
		}, 0);
	};

	jtx.Array.where = function(arr, val) {
		/* Returns an Array (could be empty) of all indices where *val* occurs in *arr*.
		*/
		let ndcs = [];
		arr.forEach(function(cv, ndx) {
			if (cv == val) {
				ndcs.push(ndx);
			}
		});
		return ndcs;
	};
	
	jtx.Array.argSort = function(arr) {
		/* Returns indices of items in the given array after it has been
		   sorted, such that arr[ndcs] = sorted(arr).
		*/
		let n = arr.length;
		let ndcs = (new Array(n)).fill(0).map(function(_, i) { return i; });
		let isSorted = false;
		do {
			isSorted = true;
			for (let i = 0; i < ndcs.length; i++) {
				if (i < n - 1) {
					if (arr[ndcs[i+1]] < arr[ndcs[i]]) {
						let j = ndcs[i];
						ndcs[i] = ndcs[i+1];
						ndcs[i+1] = j;
						isSorted = false;
					}
				}
			}
		} while (!isSorted);
		return ndcs;
	};

	exports.Array.mask = function(obj, mask) {
		/* Returns a subset of the given array, in which each element is included iff the corresponding entry in the mask Array is true.
		*/
		let result = [];
		obj.forEach(function(element, ndx) {
			if (mask[ndx]) {
				result.push(element);
			}
		});
		return result;
	};
	
	/* --- Object Extensions --- */

	exports.Object.copy = function(obj) {
		/* Returns a deep copy of the given object using JSON serialization.
		*/
		return JSON.parse(JSON.stringify(obj));
	};

	exports.Object.has = function(obj, key) {
		/* Returns true if the given object has an entry with the given key.
		   Effectively a shortcut to Object.prototype.hasOwnProperty().
		*/
		let keys = Object.keys(obj);
		return -1 < keys.indexOf(key);
	};

	jtx.Object.select = function(obj, keys) {
		/* Creates a copy of the object with only the given keys copied.
		*/
		let copy = {};
		keys.forEach(function(key) {
			copy[key] = obj[key];
		});
		return copy;
	};

	jtx.Object.iterItems = function(obj, handler) {
		/* Invokes the given handler for each key-value pair in the object.
		   Parameters are (key, value, index).
		*/
		Object.keys(obj).forEach(function(key, ndx) {
			handler(key, obj[key], ndx);
		});
	};

	/* --- Date Extensions --- */

	// timestamp (in seconds from Unix epoch) of the J2000 epoch
	exports.Date.j2000_nx = Date.UTC(2000, 0, 1, 12, 0, 0) * 1e-3;

	// timestamp (in Julian days) of the J2000 epoch
	exports.Date.j2000_jd = 2451545.0;

	jtx.Date.offsetBy = function(obj, dt_s) {
		/* Returns a new Date equal to the given date incremented by the given
		   number of seconds.
		*/
		return new Date(obj.valueOf() + dt_s * 1e3);
	};

	exports.Date.toJulian = function(obj) {
		/* Converts a JavaScript Date object to a Julian date value
		*/
		let dt_s = obj.getTime() * 1e-3 - exports.Date.j2000_nx;
		return exports.Date.j2000_jd + dt_s / 86400;
	};
	
	exports.Date.fromJulian = function(jd) {
		/* Converts a Julian date value to a JavaScript Date object
		*/
		let obj = new Date();
		let dt_s = (jd - exports.Date.j2000_jd) * 86400;
		obj.setTime((exports.Date.j2000_nx + dt_s) * 1e3);
		return obj;
	};
	
	exports.Date.toGMST = function(obj) {
		/* Returns the Greenich Mean Sidereal Time (angle of the prime meridian
		   from first point of aries or vernal equinox about the polar axis).
		   Effectively, a model of earth rotation, valid for years 1900-2100.
		*/
		let y, m, d, H, M, S;
		[y,m,d,H,M,S] = exports.Date.ymdHMS(obj);
		let J0 = 367 * y - Math.floor(7 * (y + Math.floor((m + 9) / 12)) / 4) + Math.floor(275 * m / 9) + d + 1721013.5;
		let UT = H + M / 60 + S / 3600;
		let T0 = (J0 - 2451545) / 36525;
		let GST0 = 1.004606184e2 + 3.600077004e4 * T0 + 3.87933e-4 * T0**2 - 2.583e-8 * T0**3;
		let GMST_deg = (GST0 + 360.98564724 * UT / 24) % 360;
		return GMST_deg * Math.PI / 180;
	};

	exports.Date.ymdHMS = function(obj) {
		/* Returns year, month, day, hour, minute, and second in standard UTC
		*/
		let y = obj.getUTCFullYear();
		let m = obj.getUTCMonth() + 1;
		let d = obj.getUTCDate();
		let H = obj.getUTCHours();
		let M = obj.getUTCMinutes();
		let S = obj.getUTCSeconds();
		return [y,m,d,H,M,S];
	};

	exports.Date.isLeapYear = function(obj) {
		/* Returns *true* if the given year of the given date is a leap year.
		*/
		let fy = obj.getFullYear();
		return (fy % 4 == 0) && ((fy % 100 != 0) || (fy % 1000 == 0));
	};

	exports.Date.getDayOfYear = function(obj) {
		/* Returns number of days + day fraction since the beginning of the
		   year. The first day of the year results in a '1' value (plus the day
		   fraction).
		*/
		let boy = new Date(obj.getFullYear(), 0, 1, 0, 0, 0);
		return (obj - boy + 8.64e7) / 8.64e7;
	};

	exports.Date.getTimezoneName = function(obj) {
		/* Returns the english (australian) string of the international date
		   time format, split from the segment after the comma.
		*/
		let dtf = new Intl.DateTimeFormat('en-AU', { timeZoneName: 'long' });
		let str = dtf.format(obj);
		let tzn = str.split(', ')[1];
		return tzn;
	};

	exports.Date.getTimezoneAbbr = function(obj) {
		/* Returns the abbreviation (best guess) of the timezone name.
		*/
		let tzn = exports.Date.getTimezoneName(obj);
		let abbr = '';
		tzn.split(' ').forEach(function(part) {
			abbr += part[0];
		});
		return abbr;
	};

	exports.Date.getWeekOfYear = function(obj) {
		/* Returns the number of weeks (rounded up) since the first Sunday of
		   this year. Days occuring before the first Sunday of the year belong
		   to week 0.
		*/
		let boy = new Date(obj.getFullYear(), 0, 1, 0, 0, 0);
		let sun = new Date(boy.valueOf() + (7 - boy.getDay()) * 8.64e7);
		let daysFromSun = (obj.valueOf() - sun.valueOf()) / 8.64e7;
		return Math.abs(Math.ceil((daysFromSun + 1) / 7));
	};

	exports.Date.format = function(obj, fmt) {
		/* Date format method using percent-marked entries, as defined by:
		   https://docs.python.org/2/library/datetime.html#strftime-strptime-behavior
		*/
		let dow = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		let mth = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
		let us = 1e3 * obj.getMilliseconds();
		let tzh = Math.abs(obj.getTimezoneOffset() /  60);
		let tzs = exports.Number.zeroPad(Math.floor(tzh), 2) + exports.Number.zeroPad(Math.floor((tzh % 1.0) * 60), 2);
		let map = {
			'%a': dow[obj.getDay()].substring(0,3),
			'%A': dow[obj.getDay()],
			'%w': obj.getDay(),
			'%d': exports.Number.zeroPad(obj.getDate(), 2),
			'%b': mth[obj.getMonth()].substring(0,3),
			'%B': mth[obj.getMonth()],
			'%m': exports.Number.zeroPad(obj.getMonth() + 1, 2),
			'%y': exports.Number.zeroPad(obj.getFullYear() % 100, 2),
			'%Y': obj.getFullYear(),
			'%H': exports.Number.zeroPad(obj.getHours(), 2),
			'%I': exports.Number.zeroPad(obj.getHours() % 12, 2),
			'%p': obj.getHours() > 12 ? 'PM' : 'AM',
			'%M': exports.Number.zeroPad(obj.getMinutes(), 2),
			'%S': exports.Number.zeroPad(obj.getSeconds(), 2),
			'%f': exports.Number.zeroPad(us, 6),
			'%z': obj.getTimezoneOffset() >= 0 ? '-' + tzs : '+' + tzs,
			'%Z': exports.Date.getTimezoneAbbr(obj),
			'%j': exports.Number.zeroPad(Math.floor(exports.Date.getDayOfYear(obj)), 3),
			'%U': exports.Number.zeroPad(exports.Date.getWeekOfYear(obj), 2),
			'%W': exports.Date.getWeekOfYear(new Date(obj.valueOf() + 8.64e7))
		};
		map['%X'] = map['%H'] + ':' + map['%M'] + ':' + map['%S'];
		map['%c'] = map['%a'] + ' ' + map['%b'] + ' ' + map['%d'] + ' ' + map['%X'] + ' ' + map['%Y'];
		map['%x'] = map['%m'] + '/' + map['%d'] + '/' + map['%y'];
		let formatted = fmt.replace('%%', '%');
		Object.keys(map).forEach(function(key) {
			let re = RegExp(key, 'g');
			formatted = formatted.replace(re, map[key]);
		});
		return formatted;
	};

	/* --- Number Extensions --- */

	exports.Number.zeroPad = function(obj, length) {
		/* Returns a string of the given number with zeros padded to ensure
		   integer (pre-decimal) length.
		*/
		let result = String(obj);
		let n = obj > 0 ? length - Math.floor(Math.log10(obj)) - 1 : length - 1;
		result = (n > 0 ? '0'.repeat(n) : '') + result;
		return result;
	};

	exports.Number.ordinalSuffix = function(obj) {
		/* Returns the two-letter suffix appropriate for the given natural
		   number. Defaults to 'th' for any number not 1, 2, or 3.
		*/
		if (obj == 1) {
			return 'st';
		} else if (obj == 2) {
			return 'nd';
		} else if (obj == 3) {
			return 'rd';
		} else {
			return 'th';
		}
	};
	
	exports.Number.getMachEps = function(scale) {
		/* Returns the machine epsilon value (the value for which the language
		   precision is incapable of determining precision-constrained
		   differences). Optionally, can be computed for a specific reference
		   value (*scale*), which defaults to 1.
		*/
		if (typeof(scale) == 'undefined') { scale = 1.0; }
		let machEps = scale;
		while (scale + machEps > scale) {
			machEps *= 0.5;
		}
		return machEps;
	};

	jtx.Number.toCommas = function(n) {
		/* Returns a string formatting of the given number that includes commas in each thousands place.
		*/
		return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	jtx.Number.modpos = function(x, n) {
		/* Modulo operator with positive-bias--e.g., result will always be
		   between 0 and n
		*/
		let m = x % n;
		if (m < 0) { m += n; }
		return n;
	};

	Object.assign(exports, {
		"__url__": "https://github.com/Tythos/jtx.git",
		"__semver__": "v1.2.0",
		"__license__": "MIT",
    "__deps__": {},
    "__tests__": []
  });
});
