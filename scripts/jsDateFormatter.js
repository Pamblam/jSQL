/**
 * Format a date using PHP date shorthand
 * @param {Date} date - A Javascript Date object
 * @param {String} format - The format of the outputted date
 * @returns {String} - The formatted date
 */
function formatDate(date, format) {
	if (isNaN(date.getTime())) return "Invalid Date";
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

	var buffer = []; 
	for(var i=0; i<format.length; i++){
		switch(format[i]){
			// If the current char is a "\" then skip it and add then next literal char
			case "\\": buffer.push(format[++i]); break;

			// Symbols that represent numbers
			case "Y": buffer.push("" + date.getFullYear()); break;
			case "y": buffer.push(("" + date.getFullYear()).substring(2)); break;
			case "m": buffer.push(("0" + (date.getMonth() + 1)).substr(-2, 2)); break;
			case "n": buffer.push("" + (date.getMonth() + 1)); break;
			case "t": buffer.push("" + new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()); break; 
			case "d": buffer.push(("0" + date.getDate()).substr(-2, 2)); break;
			case "j": buffer.push(date.getDate() + ""); break;
			case "w": buffer.push(date.getDay()); break;
			case "g": buffer.push("" + (date.getHours() > 12 ? date.getHours() - 12 : date.getHours())); break;
			case "G": buffer.push("" + (date.getHours())); break;
			case "h": buffer.push(("0" + (date.getHours() > 12 ? date.getHours() - 12 : date.getHours())).substr(-2, 2)); break;
			case "H": buffer.push(("0" + (date.getHours()+"")).substr(-2, 2)); break;
			case "i": buffer.push(("0" + date.getMinutes()).substr(-2, 2)); break;
			case "s": buffer.push(("0" + date.getSeconds()).substr(-2, 2)); break;
			case "N": buffer.push(date.getDay()==0?7:date.getDay()); break;
			case "L": buffer.push((date.getFullYear() % 4 == 0 && date.getFullYear() % 100 != 0) || date.getFullYear() % 400 == 0 ? "1" : "0"); break;
			case "o": buffer.push(date.getMonth()==0&&date.getDate()<6&&date.getDay()<4?date.getFullYear()-1:date.getFullYear()); break;
			case "B": buffer.push(Math.floor((((date.getUTCHours() + 1) % 24) + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) * 1000 / 24)); break;
			case "v": buffer.push((date.getTime()+"").substr(-3)); break;
			case "Z": buffer.push(date.getTimezoneOffset()*60); break;
			case "U": buffer.push(Math.floor(date.getTime()/1000)); break;

			// Symbols that represent text
			case "a": buffer.push(date.getHours() > 11 ? "pm" : "am"); break;
			case "A": buffer.push(date.getHours() > 11 ? "PM" : "AM"); break;
			case "l": buffer.push(days[date.getDay()]); break;
			case "D": buffer.push(days[date.getDay()].substr(0, 3)); break;
			case "F": buffer.push(months[date.getMonth()]); break;
			case "M": buffer.push(months[date.getMonth()].substring(0, 3)); break;
			case "c": buffer.push(date.toISOString()); break;
			
			// Ordinal suffix
			case "S":
				var suffix = false;
				var ones = buffer[buffer.length-1];
				var tens = buffer[buffer.length-2];
				if(ones == "1") suffix = "st";
				if(ones == "2") suffix = "nd";
				if(ones == "3") suffix = "rd";
				if(tens == "1" || !suffix) suffix = "th";
				buffer.push(suffix);
				break;
			
			// ISO-8601 Week number
			case "W":
				var startDate = new Date(date.getFullYear(), 0);
				var endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
				while(endDate.getDay() < 6) endDate.setDate(endDate.getDate()+1);
				endDate = endDate.getTime();
				var weekNo = 0;
				while(startDate.getTime() < endDate){
					if(startDate.getDay() == 4) weekNo++;
					startDate.setDate(startDate.getDate()+1);
				}
				buffer.push(weekNo);
				break;
			
			// Day of the year
			case "z":
				var startDate = new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
				var dayNo = 0;
				while(startDate.getTime() < date.getTime()){
					dayNo++;
					startDate.setDate(startDate.getDate()+1);
				}
				buffer.push(dayNo);
				break;
				
			default: buffer.push(format[i]); break;
		}
	}
	return buffer.join('');
}