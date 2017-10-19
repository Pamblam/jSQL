
		function jSQLParseQuery(query){

			// Predcit the correct casing for column and table names
			var convertToCol = function(c, skipErrors){
				for(var i=0; i<jSQL.tables[table].columns.length; i++)
					if(removeQuotes(c.toUpperCase()) == jSQL.tables[table].columns[i].toUpperCase())
						return jSQL.tables[table].columns[i];
				return _throw(new jSQL_Error("0013"), skipErrors);
			};

			// A helper function that extracts values from a string of
			// quoted, comma separated values, taking into account escaped chars
			var getNextQueryVals = function(str) {
				var numbers = "+,-,0,1,2,3,4,5,6,7,8,9,0,.".split(",");
				var vals = [];
				var inQuote = false;
				var currentVal = [];
				var quoteType;
				for (var i = 0; i < str.length; i++) {
					if (str[i] === "'" || str[i] === '"') {
						if (!inQuote) {
							quoteType = str[i];
							inQuote = true;
						} else if (str[i] !== quoteType) {
							currentVal.push(str[i]);
						} else {
							if (i > 0 && str[i - 1] === "\\") {
								if (i > 1 && str[i - 2] === "\\") {
									inQuote = false;
									vals.push(currentVal.join(''));
									var currentVal = [];
								} else {
									currentVal[currentVal.length - 1] = str[i];
								}
							} else {
								inQuote = false;
								vals.push(currentVal.join(''));
								var currentVal = [];
							}

						}
					} else if (inQuote) {
						if (str[i] === "\\" && i > 0 && str[i - 1] === "\\")
							continue;
						currentVal.push(str[i]);
					} else if(str[i] === "?"){
						vals.push('?');
					}else if(numbers.indexOf(str[i])>-1){
						var v = "";
						while(numbers.indexOf(str[i])>-1&&i < str.length){
							v += str[i];
							i++;
						}
						vals.push(parseFloat(v));
					}else if (str[i] !== " " && str[i] !== ",") {
						return vals;
					}
				}
				return vals;
			};

			// A helper function that gets column/value pairs from an update query
			var getColValPairs = function(str){

				// break parts up only on commas that do not occur inside quoted text
				// see Issue #3
				var parts = [];
				var currentPart = "";
				var quotes = ["'",'"',"`"];
				var inQuote = false;
				var quoteType = "";
				for(var i=0; i<str.length; i++){
					if(!inQuote && quotes.indexOf(str[i])>-1){
						inQuote = true;
						quoteType = str[i];
						currentPart += str[i];
						continue;
					}
					if(inQuote && str[i] === quoteType){
						inQuote = false;
						quoteType = "";
						currentPart += str[i];
						continue;
					}
					if(inQuote || str[i]!==","){
						currentPart += str[i];
						continue;
					}
					parts.push(currentPart);
					currentPart = "";
				}
				parts.push(currentPart);
				currentPart = "";

				var newVals = {};
				var whereClause = "";

				var state = 0;
				for(var i=0; i<parts.length; i++){
					var keyvals = parts[i].trim();
					var col = '', val = '', quoteType=null, isNum = false;
					var chars = keyvals.split('');
					if(state !== 4) state = 0; 
								// 0 = looking for col, 
								// 1 = looking for val in quote, 
								// 2 = looking for numeric val
								// 3 = checking for string after end of value
								// 4 = found string at end of value
					for(var n=0; n<chars.length; n++){
						var char = chars[n];
						switch(state){
							case 0:
									if(char !== '=' && char !== ' ') col += char;
									else if(char === '='){
										// check for a space
										if(chars[n+1] == ' '){ n++; char=chars[n];}
										// expect next char either a quote or a number
										if(!isNaN(chars[n+1])){
											state = 2;
											isNum = true;
										}else if(chars[n+1]=='"' || chars[n+1]=="'"){
											quoteType = chars[n+1];
											state = 1;
											n++; // skip the first quote
										}else if(chars[n+1]=='?'){
											n++; char=chars[n];
											newVals[removeQuotes(col)] = '?';
											state = 3;
										}else{
											return _throw(new jSQL_Error("0024"));
										}
									}
								break;
							case 1:
								if(char === quoteType){
									// is it escaped?
									if(chars[n-1]=="\\") val += char;
									else{
										newVals[removeQuotes(col)] = val;
										state = 3;
									}
								}else val += char;
								break;
							case 2:
								if(char == ' '){n++; char = chars[n];}
								if(!isNaN(char) || char == '.') val += "" + char;
								else{
									newVals[removeQuotes(col)] = parseFloat(val);
									whereClause += char; 
									state = 3;
								}
								break;
							case 3:
								if(char == ' '){ n++; char = chars[n]; }
								if(undefined === char) break;
								state = 4;
								whereClause += char; 
								break;
							case 4:
								whereClause += char;
						}
					}
					whereClause += ",";
					if(val !== '') newVals[removeQuotes(col)] = isNum ? parseFloat(val) : val;
				}

				//  trim off triling comma
				if(whereClause.substring(whereClause.length-1)===",") 
					whereClause = whereClause.substring(0,whereClause.length-1);

				return {
					newVals: newVals,
					whereClause: whereClause
				};
			};

			var parseWhereClause = function(query, words){
				while(words.length){
					var piece = words.shift();
					switch(piece.toUpperCase()){
						case "WHERE":
						case "AND":
							var ccc;
							try{
								ccc = convertToCol(words.shift(), true);
							}catch(ex){
								return new (function(error){
									this.execute = function(){ return _throw(error); };
									this.fetch = function(){ return _throw(error); };
									this.fetchAll = function(){ return _throw(error); };
								})(ex.message);
							}
							query = query.where(ccc);
							break;
						case "=":
							query = query.equals(removeQuotes(words.shift()));
							break;
						case ">":
							query = query.greaterThan(removeQuotes(words.shift()));
							break;
						case "<":
							query = query.lessThan(removeQuotes(words.shift()));
							break;
						case "!=":
						case "<>":
							query = query.doesNotEqual(removeQuotes(words.shift()));
							break;
						case "LIKE":
							var substr = removeQuotes(words.shift());
							// "%text%" - Contains text
							if(substr.substr(0,1)=="%" && substr.substr(substr.length-1,1)=="%"){
								query = query.contains(substr.substr(1,substr.length-2));
							// "%text" - Ends with text
							}else if(substr.substr(0,1)=="%"){
								query = query.endsWith(substr.substr(1,substr.length-1));
							// "text%" - Begins with text
							}else if(substr.substr(substr.length-1,1)=="%"){
								query = query.beginsWith(substr.substr(0,substr.length-1));
							}else if(substr === "?"){
								// Is a pepared statement, no value available at this time
								query = query.preparedLike();
							}else{
								// no "%" on either side. jSQL only supports % when 
								// the string begins or ends with it, so treat it like an equal
								query = query.equals(substr);
							}
							break;
						case "OR":
							var ccc = convertToCol(words.shift());
							query = query.or(ccc);
							break;
						case "LIMIT":
							var limit = words.shift(), offset, commaFound=false;
							// if the last char is comma, trim it off
							if(limit[limit.length-1]===","){
								limit = limit.substring(0,limit.length-1);
								commaFound = true;
							}
							if(!commaFound && limit.indexOf(",")>0){
								var p = limit.split(",");
								limit = p[0];
								words.unshift(p[1]);
								commaFound = true;
							}
							if(!commaFound && words.length){
								var nextWord = words.shift();
								if(nextWord[0]===","){
									commaFound = true;
									if(nextWord.length>1){
										nextWord = nextWord.substring(1,limit.length);
										words.unshift(nextWord)
									}
								}else words.unshift(nextWord);
							}
							if(commaFound){
								offset = limit;
								limit = words.shift();
							}
							if(words.length && !commaFound){
								var nextWord = words.shift();
								if(nextWord.toUpperCase()==="OFFSET"){
									offset = words.shift();
								}else words.unshift(nextWord);
							}
							query = query.limit(limit, offset);
							break;
						case "ORDER":
							if(words.shift().toUpperCase() != "BY") return _throw(new jSQL_Error("0025"));
							while(words.length > 0){
								var nextWord = words.shift();
								try{
									// Remove the comma if there is one
									while(nextWord.indexOf(",") == nextWord.length-1)
										nextWord = nextWord.substr(0, nextWord.length-1);

									nextWord = convertToCol(nextWord);
									orderColumns.push(nextWord);
								}catch(e){
									words.unshift(nextWord); 
									break;
								}
							}
							query = query.orderBy(orderColumns);
							break;
						case "ASC":
							if(!orderColumns.length) return _throw(new jSQL_Error("0026"));
							query = query.asc();
							break;
						case "DESC":
							if(!orderColumns.length) return _throw(new jSQL_Error("0027"));
							query = query.desc();
							break;
					}
				}
				return query;
			};

			// Remove excess whitespace, linebreaks, tabs, comments
			query = jSQL.minify(query);

			// Break words into uppercase array
			var words = query.split(" ");

			switch(words.shift().toUpperCase()){
				case "DELETE":
					var orderColumns = [];
					// Next Word should be "FROM"
					if(words.shift().toUpperCase() !== "FROM") return _throw(new jSQL_Error("0028"));

					// Next word should be the table name
					var table = removeQuotes(words.shift());
					if(undefined === jSQL.tables[table]) return _throw(new jSQL_Error("0021"));

					var query = jSQL.deleteFrom(table);
					query = parseWhereClause(query, words);

					return query;
					break;

				case "DROP":				

					// Next Word should be "TABLE"
					if(words.shift().toUpperCase() !== "TABLE") return _throw(new jSQL_Error("0029"));

					// Next word should be the table name
					var table = removeQuotes(words.shift());
					// If table is quoted, mean there may be spaces in table name,
					// look for next quote to get full table name
					if(table.indexOf("`") === 0){
						table = table.substring(1);
						var restOfQuery = " "+words.join(" ");
						for(var i=0; table.indexOf("`")<0&&i<restOfQuery.length;i++){
							var char = restOfQuery[i];
							if(char === " ") words.shift();
							table += char;
						}
						table = removeQuotes("`"+table);
					}

					if(undefined === jSQL.tables[table]) return _throw(new jSQL_Error("0021"));

					return jSQL.dropTable(table);
					break;

				case "INSERT": 
					var table, cols=[], values = [], ignore = false;

					var into = words.shift().toUpperCase();
					if(into === "IGNORE"){
						ignore = true;
						into = words.shift().toUpperCase();
					}

					// Next Word should be "INTO"
					if(into !== "INTO") return _throw(new jSQL_Error("0030"));

					// Next word should be the table name
					table = removeQuotes(words.shift());

					// If table is quoted, mean there may be spaces in table name,
					// look for next quote to get full table name
					if(table.indexOf("`") === 0){
						table = table.substring(1);
						var restOfQuery = " "+words.join(" ");
						for(var i=0; table.indexOf("`")<0&&i<restOfQuery.length;i++){
							var char = restOfQuery[i];
							if(char === " ") words.shift();
							table += char;
						}
						table = removeQuotes("`"+table);
					}
					if(undefined === jSQL.tables[table]) return _throw(new jSQL_Error("0021"));

					// Remove a few chars and re-split
					words = words.join(" ")
						.split("(").join(" ")
						.split(")").join(" ")
						.split(",").join(" ")
						.split("  ").join(" ").trim()
						.split(" ");

					var next = words.shift();
					while(words.length && next.toUpperCase() !== "VALUES"){
						cols.push(removeQuotes(next));
						next = words.shift();
					}

					if(next.toUpperCase() !== "VALUES") 
						return _throw(new jSQL_Error("0031"));

					var w = words.join(' ');
					values = getNextQueryVals(w);

					if(!cols.length){
						for(var i=0;  i<values.length; i++){
							if(undefined === jSQL.tables[table].columns[i]) return _throw(new jSQL_Error("0032"));
							cols.push(jSQL.tables[table].columns[i]);
						}
					}

					if(values.length !== cols.length) return _throw(new jSQL_Error("0033"));

					var data = {};
					for(var i=0; i<cols.length; i++){
						data[cols[i]] = values[i];
					}

					var q = jSQL.insertInto(table).values(data);
					return ignore ? q.ignore() : q;
					break;
					
				case "CREATE": 
					var params = {};
					var table, c, cols = [],ine=false;
					// Next Word should be "TABLE"
					if(words.shift().toUpperCase() !== "TABLE") return _throw(new jSQL_Error("0029"));

					// get the column definition part of the table
					var str = words.join(" ");
					var conlumnDef = "";
					var opencount = (str.match(/\(/g) || []).length;
					var closecount = (str.match(/\)/g) || []).length;
					if(opencount !== closecount) return _throw(new jSQL_Error("0034"));
					if(opencount > 0)
						conlumnDef = str.substring(str.indexOf("(")+1, str.lastIndexOf(")"));

					// Remove a few chars and re-split
					words = str
						.split("(").join(" ")
						.split(")").join(" ")
						.split(",").join(" ")
						.split("  ").join(" ").trim()
						.split(" ");

					// Check for "IF NOT EXISTS" clause
					table = removeQuotes(words.shift());

					if(table.toUpperCase() === "IF"){
						if(words.shift().toUpperCase() !== "NOT") return _throw(new jSQL_Error("0035"));
						if(words.shift().toUpperCase() !== "EXISTS") return _throw(new jSQL_Error("0036"));
						table = removeQuotes(words.shift());
						ine=true;
					} 

					// If table is quoted, mean there may be spaces in table name,
					// look for next quote to get full table name
					if(table.indexOf("`") === 0){
						table = table.substring(1);
						var restOfQuery = " "+words.join(" ");
						for(var i=0; table.indexOf("`")<0&&i<restOfQuery.length;i++){
							var char = restOfQuery[i];
							if(char === " ") words.shift();
							table += char;
						}
						table = removeQuotes("`"+table);
					}

					params[table] = [];

					// Get column definitions
					var parts = conlumnDef.split(",");
					for(var i=0;i<parts.length;i++){
						var str = parts[i];
						while((str.match(/\(/g) || []).length !== (str.match(/\)/g) || []).length && i<parts.length){
							str += ","+parts[i+1];
							parts[i+1] = "";
							parts[i] = str;
							i++;
						}
						if(str.trim()!=="") cols.push(str.trim());
					}

					// keys param as passed to the table constructor
					var keys = [];

					// loop and apply column definitions to params object
					for(var i=0; i<cols.length; i++){
						var colparts = cols[i].split(" ");
						var colname = removeQuotes(colparts.shift());
						var is_ai = false; // is this column an auto_increment column
						
						// If this line is actually a key definition rather tahn a column defintion
						if(colname.toUpperCase() == "PRIMARY" || colname.toUpperCase() == "UNIQUE"){
							var char, def_started = false, in_quote = false, key_cols = [], curr_col = "";
							for(var c=0; char=cols[i][c]; c++){
								if(char === "("){
									def_started = true;
									continue;
								}
								if(!def_started) continue;
								if(['"', '`', "'"].indexOf(char) !== -1){
									if(in_quote === false){
										in_quote = char;
									}else if(in_quote === char){
										in_quote = false;
										key_cols.push(curr_col);
										curr_col = "";
									}else{
										curr_col += char;
									}
									continue;
								}
								if(char === " " && !in_quote){
									if(curr_col !== "") key_cols.push(curr_col);
									curr_col = "";
									continue;
								}
								if(def_started === true && char === ")"){
									if(curr_col !== "") key_cols.push(curr_col);
									curr_col = "";
									break;
								}
								if(char == "," && !in_quote) continue;
								curr_col += char;
							}
							keys.push({column: key_cols, type: colname.toLowerCase()});

							// This isn't a column so continue the loop here...
							continue;
						}

						params[table][i] = {name: colname, type:"AMBI",args:[]};
						if(colparts.length){

							// If the column definition includes "primary [key]" or "unique [key]" or "auto_increment" remove those words now
							var colparts_new = [], colparts_primary_index = false, colparts_unique_index = false;
							for(var n = 0; n<colparts.length; n++){
								if(colparts[n].toUpperCase() === "PRIMARY") colparts_primary_index = n;
								else if(colparts[n].toUpperCase() === "UNIQUE") colparts_unique_index = n;
								else if(colparts[n].toUpperCase() === "KEY" && colparts_primary_index!==false && n === (1+colparts_primary_index)){ /* do nothing */ }
								else if(colparts[n].toUpperCase() === "KEY" && colparts_unique_index!==false && n === (1+colparts_unique_index)){ /* do nothing */ }
								else if(colparts[n].toUpperCase() === "AUTO_INCREMENT") is_ai = true;
								else colparts_new.push(colparts[n]);
							}
							colparts = colparts_new;
							if(false !== colparts_primary_index) keys.push({column: colname, type: "primary"});
							if(false !== colparts_unique_index) keys.push({column: colname, type: "unique"});
							if(!colparts.length) continue;

							// Parse column definition if one is included
							var typename = colparts.shift().toUpperCase();
							if((typename.match(/\(/g) || []).length){ // typename contains opening (
								while(!(typename.match(/\)/g) || []).length){ // make sure it has a closing one
									if(!colparts.length) return _throw(new jSQL_Error("0037"));
									typename += " "+colparts.shift();
								}
								// check if there is anything after the last ) and shift it back on to colparts array
								if(typename.substring(typename.lastIndexOf(")")+1)!==""){
									colparts.unshift(typename.substring(typename.lastIndexOf(")")+1));
									typename.substring(0,typename.lastIndexOf(")"))
								}
							}

							// if typename still does not include args,
							// check for them at the begining of the next colpart
							if(!(typename.match(/\(/g) || []).length && colparts.length && colparts[0].charAt(0)==="("){
								typename += colparts[0].substring(0, colparts[0].indexOf(")")+1);
								colparts[0] = colparts[0].substring(colparts[0].indexOf(")")+1);
							}

							// if a args were given for this column type 
							// they should now be concatted to the typename
							var argsDef = "";
							if(typename.indexOf("(") > -1){ 
								var opencount = (typename.match(/\(/g) || []).length;
								var closecount = (typename.match(/\)/g) || []).length;
								if(opencount !== closecount) return _throw(new jSQL_Error("0038"));
								if(opencount > 0)
									argsDef = typename.substring(typename.indexOf("(")+1, typename.lastIndexOf(")"));
							}
							if(argsDef.trim()!==""){  
								var a = argsDef.split(","); 
								for(var d=0;d<a.length; d++)
									if(a[d].trim()!=="")
									  params[table][i].args.push(a[d].trim());
							}
							params[table][i].type = typename.split("(")[0].trim().toUpperCase();
							if(is_ai) params[table][i].auto_increment = true;
						}
					}		
					
					var query = jSQL.createTable(params, keys);
					if(ine) query.ifNotExists();
					return query;
					break;
					
				case "UPDATE":
					// Do stuff to parse update query
					var table, colValPairs, query, orderColumns = [];
					table = removeQuotes(words.shift());

					// If table is quoted, mean there may be spaces in table name,
					// look for next quote to get full table name
					if(table.indexOf("`") === 0){
						table = table.substring(1);
						var restOfQuery = " "+words.join(" ");
						for(var i=0; table.indexOf("`")<0&&i<restOfQuery.length;i++){
							var char = restOfQuery[i];
							if(char === " ") words.shift();
							table += char;
						}
						table = removeQuotes("`"+table);
					}

					for(var name in jSQL.tables){
						if(!jSQL.tables.hasOwnProperty(name)) continue;
						if(name.toUpperCase() == removeQuotes(table.toUpperCase())){
							table = name;
							break;
						}
					}

					var set = words.shift().toUpperCase();
					if (set !== "SET")
						return _throw(new jSQL_Error("0039"));

					var parts = getColValPairs(words.join(' '));
					query = jSQL.update(table).set(parts.newVals);

					query = parseWhereClause(query, parts.whereClause.split(' '));
					return query;
					break;

				case "SELECT":
					var table, columns, query, orderColumns = [], isDistinct = false;;
					var upperWords = query.toUpperCase().split(" "); upperWords.shift();
					var fromIndex = upperWords.indexOf("FROM");

					if(fromIndex < 0) return _throw(new jSQL_Error("0040"));

					columns = words.splice(0, fromIndex);

					if(columns[0].toUpperCase()==="ALL") columns.shift();
					if(columns[0].toUpperCase()==="DISTINCT" || columns[0].toUpperCase()==="DISTINCTROW"){
						columns.shift();
						isDistinct = true;
					}

					for(var i=columns.length; i--;)
						while(columns[i].indexOf(",") == columns[i].length-1)
							columns[i] = columns[i].substr(0, columns[i].length-1);
					words.shift(); // pop the FROM off
					table = words.shift();

					// If table is quoted, mean there may be spaces in table name,
					// look for next quote to get full table name
					if(table.indexOf("`") === 0){
						table = table.substring(1);
						var restOfQuery = " "+words.join(" ");
						for(var i=0; table.indexOf("`")<0&&i<restOfQuery.length;i++){
							var char = restOfQuery[i];
							if(char === " ") words.shift();
							table += char;
						}
						table = removeQuotes("`"+table);
					}

					for(var name in jSQL.tables){
						if(!jSQL.tables.hasOwnProperty(name)) continue;
						if(name.toUpperCase() == removeQuotes(table.toUpperCase())){
							table = name;
							break;
						}
					}
					if(undefined === jSQL.tables[table]) return new (function(error){
						this.execute = function(){ return _throw(error); };
						this.fetch = function(){ return _throw(error); };
						this.fetchAll = function(){ return _throw(error); };
					})(new jSQL_Error("0021"));

					if(columns.length == 1 && columns[0] == "*") columns = '*';
					else for(var i=0;i<columns.length;i++){
						columns[i] = convertToCol(columns[i]);
					}

					// Generate the query object
					query = jSQL.select(columns).from(table);
					if(isDistinct) query = query.distinct();
					query = parseWhereClause(query, words);


					return query;
					break;

				default:
					return _throw(new jSQL_Error("0041"));
			}
		}
		