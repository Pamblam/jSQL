
		function jSQLWhereClause(context){
			var self = this;
			self.context = context;
			self.pendingColumn = "";
			self.conditions = [];
			self.LIMIT = 0;
			self.OFFSET = 0;
			self.finalConditions = [];
			self.sortColumn = [];
			self.sortDirection = "ASC";
			self.isDistinct = false;

			self.where = function(column){
				if(self.pendingColumn !== "") return _throw(new jSQL_Error("0042"));
				if('string' != typeof column) return _throw(new jSQL_Error("0043"));
				self.pendingColumn = column;
				return self;
			};

			self.equals = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0044"));
				self.conditions.push({col: self.pendingColumn, type: '=', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.preparedLike = function(){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0045"));
				self.conditions.push({col: self.pendingColumn, type: 'pl', value: "?"});
				self.pendingColumn = "";
				return self;
			};

			self.doesNotEqual = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0046"));
				self.conditions.push({col: self.pendingColumn, type: '!=', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.lessThan = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0047"));
				self.conditions.push({col: self.pendingColumn, type: '<', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.greaterThan = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0048"));
				self.conditions.push({col: self.pendingColumn, type: '>', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.contains = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0049"));
				self.conditions.push({col: self.pendingColumn, type: '%%', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.endsWith = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0050"));
				self.conditions.push({col: self.pendingColumn, type: '%-', value: value});
				self.pendingColumn = "";
				return self;
			};

			self.beginsWith = function(value){
				if(self.pendingColumn == "") return _throw(new jSQL_Error("0051"));
				self.conditions.push({col: self.pendingColumn, type: '-%', value: value});
				self.pendingColumn = "";
				return self;
			},

			self.and = function(column){ return self.where(column); };

			self.or = function(column){
				self.finalConditions.push(self.conditions);
				self.conditions = [];
				return self.where(column);
			};

			self.limit = function(limit, offset){
				self.LIMIT = parseInt(limit);
				if(undefined !== offset) 
					self.OFFSET = parseInt(offset);
				return self;
			};

			self.orderBy = function(columns){
				if(!Array.isArray(columns)) columns = [columns];
				self.sortColumn = columns;
				return self;
			};

			self.asc = function(){
				if('' == self.sortColumn) return _throw(new jSQL_Error("0052"));
				self.sortDirection = "ASC";
				return self;
			};

			self.desc = function(){
				if('' == self.sortColumn) return _throw(new jSQL_Error("0053"));
				self.sortDirection = "DESC";
				return self;
			};

			self.execute = function(preparedVals){
				if(undefined === preparedVals) preparedVals = [];
				if(self.conditions.length > 0) self.finalConditions.push(self.conditions);

				if(preparedVals.length > 0){
					for(var i = self.finalConditions.length; i--;){
						for(var n = self.finalConditions[i].length; n--;){
							if(self.finalConditions[i][n].value === "?" && self.finalConditions[i][n].type === "pl"){
								var substr = preparedVals.pop();
								// "%text%" - Contains text
								if(substr.substr(0,1)=="%" && substr.substr(substr.length-1,1)=="%"){
									self.finalConditions[i][n].value = substr.substr(1,substr.length-2);
									self.finalConditions[i][n].type = "%%";
								// "%text" - Ends with text
								}else if(substr.substr(0,1)=="%"){
									self.finalConditions[i][n].value = substr.substr(1,substr.length-1);
									self.finalConditions[i][n].type = "%-";
								// "text%" - Begins with text
								}else if(substr.substr(substr.length-1,1)=="%"){
									self.finalConditions[i][n].value = substr.substr(0,substr.length-1);
									self.finalConditions[i][n].type = "-%";
								}else{
									// no "%" on either side. jSQL only supports % when 
									// the string begins or ends with it, so treat it like an equal
									self.finalConditions[i][n].value = substr;
									self.finalConditions[i][n].type = "=";
								}

							}else if(self.finalConditions[i][n].value === "?" && preparedVals.length > 0){
								self.finalConditions[i][n].value = preparedVals.pop();
							}
						}
					}
				}
				return self.context.execute(preparedVals);
			};

			self.fetch = function(Mode){
				return self.context.fetch(Mode);
			};

			self.fetchAll = function(Mode){
				return self.context.fetchAll(Mode);
			};

			self.getResultRowIndexes = function(){
				var resultRowIndexes = [];
				for(var i=0; i<self.context.table.data.length; i++){
					// LOOPING ROWS
					if(self.finalConditions.length < 1){
						// IF THERE ARE NO CONDITIONS, ADD ROW TO RESULT SET
						resultRowIndexes.push(i);
					}else{
						var addToResults = false;
						var x = self.finalConditions.length;
						while(x--){
							// LOOP THROUGH CONDITION SETS
							var conditions = self.finalConditions[x];
							var safeCondition = true;
							var ii = conditions.length;
							while(ii--){
								// LOOP THROUGH EACH CONDITION IN THE SET
								var condition = conditions[ii];
								switch(condition.type){
									case ">": 
										if(isNaN(parseFloat(self.context.table.data[i][self.context.table.colmap[condition.col]])) || self.context.table.data[i][self.context.table.colmap[condition.col]] < condition.value)
											safeCondition = false;
										break;
									case "<": 
										if(isNaN(parseFloat(self.context.table.data[i][self.context.table.colmap[condition.col]])) || self.context.table.data[i][self.context.table.colmap[condition.col]] > condition.value)
											safeCondition = false;
										break;
									case "=": 
										if(self.context.table.data[i][self.context.table.colmap[condition.col]] != condition.value)
											safeCondition = false;
										break;
									case "!=": break;
										if(self.context.table.data[i][self.context.table.colmap[condition.col]] == condition.value)
											safeCondition = false;
										break;
									case "%%": 
										if(self.context.table.data[i][self.context.table.colmap[condition.col]].indexOf(condition.value) < 0)
											safeCondition = false;
										break;
									case "%-": 
										if(self.context.table.data[i][self.context.table.colmap[condition.col]].indexOf(condition.value) != self.context.table.data[i][self.context.table.colmap[condition.col]].length - condition.value.length)
											safeCondition = false;
										break;
									case "-%": 
										if(self.context.table.data[i][self.context.table.colmap[condition.col]].indexOf(condition.value) != 0)
											safeCondition = false;
										break;
								}
								if(!safeCondition) break;
							}
							if(safeCondition){
								addToResults = true;
								break;
							}
						}
						if(addToResults){
							resultRowIndexes.push(i);
						}
					}
				}

				if(self.sortColumn.length > 0){
					resultRowIndexes.sort(function(a, b){
						a=self.context.table.data[a]; 
						b=self.context.table.data[b];					
						return (function srrrrt(i){					
							if(undefined === self.sortColumn[i]) return 0;
							var sortColumn = self.sortColumn[i];
							var sortColumnIndex = self.context.table.colmap[sortColumn];						
							if(a[sortColumnIndex] < b[sortColumnIndex]) return -1;
							if(a[sortColumnIndex] > b[sortColumnIndex]) return 1;
							return srrrrt(i+1);
						}(0));
					});	
					if(self.sortDirection == "DESC") resultRowIndexes.reverse();
				}

				if(self.isDistinct){
					var resultRows = [];
					for(var i=0; i<resultRowIndexes.length; i++)
						resultRows.push(self.context.table.data[resultRowIndexes[i]]);
					var distinctRows = [], newResultRows = []; 
					for(var i=0; i<resultRows.length; i++){
						var row = {};
						for(var n=0; n<self.context.columns.length; n++){
							row[self.context.columns[n]] = resultRows[i][self.context.table.colmap[self.context.columns[n]]]
						}

						// is this row unique?
						var testRow = JSON.stringify(row);
						if(distinctRows.indexOf(testRow)>-1) continue;
						newResultRows.push(resultRowIndexes[i]);
						distinctRows.push(testRow);
					}
					resultRowIndexes = newResultRows;
				}

				if(self.LIMIT > 0 && resultRowIndexes.length > self.LIMIT){
					if(self.OFFSET > resultRowIndexes.length){
						resultRowIndexes = [];
					}
					if(self.LIMIT > resultRowIndexes.length) self.LIMIT = resultRowIndexes.length;
					if(resultRowIndexes.length){
						resultRowIndexes = resultRowIndexes.slice(self.OFFSET, self.OFFSET+self.LIMIT);
					}
				}

				return resultRowIndexes;
			};
		}
		