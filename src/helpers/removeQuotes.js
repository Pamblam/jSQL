
		function removeQuotes(str){
			var quotes = ['"', "'", "`"];
			for (var i = quotes.length; i--; )
				if (str.substr(0, 1) == quotes[i] && str.substr(str.length - 1, 1) == quotes[i])
					return str.substr(1, str.length - 2);
			return str;
		}