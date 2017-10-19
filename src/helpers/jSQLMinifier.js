		
		
		function jSQLMinifier(sql){
			var cleanSQL = "";
			var lines = sql.split("\n");
			var inQuote = false;
			var quoteType = "";
			var quotes = ["'", "`", '"'];
			var inMultiLineComment = false;
			for (var i = 0; i < lines.length; i++) {
				for (var n = 0; n < lines[i].length; n++) {
					var char = lines[i][n];
					if (!inQuote && quotes.indexOf(char) > -1) {
						inQuote = true;
						quoteType = char;
						cleanSQL += char;
						continue;
					} else if (inQuote && quoteType === char) {
						inQuote = false;
						quoteType = "";
						cleanSQL += char;
						continue;
					} else if (inQuote) {
						cleanSQL += char;
						continue;
					}
					// not in a quote
					var isCommentStart =
							char === "/" &&
							lines[i].length > n &&
							lines[i][n + 1] == "*"
					var isCommentEnd =
							char === "*" &&
							lines[i].length > n &&
							lines[i][n + 1] == "/"
					if (!inMultiLineComment && isCommentStart) {
						inMultiLineComment = true;
						continue;
					} else if (isCommentEnd && inMultiLineComment) {
						n++;
						inMultiLineComment = false;
						continue;
					}
					if (inMultiLineComment)
						continue;
					// not in multiline comment
					var isSLCommentStart =
							char === "#" ||
							(char === "-" &&
									lines[i].length > n &&
									lines[i][n + 1] == "-");
					if (isSLCommentStart)
						break;
					else
						cleanSQL += char;
				}
				cleanSQL += "\n";
			}
			return cleanSQL
				.replace(/\t/g,' ')
				.replace(/(\r\n|\n|\r)/gm," ")
				.replace(/ +(?= )/g,'')
				.trim();
		}