
		function jSQLQuery(type){
			var self = this;
			self.type = type.toUpperCase();
			self.tablename = null;
			self.columns = [];
			self.data = [];
			self.INEFlag= false;
			self.coltypes = [];
			self.table = null;
			self.newvals = {};
			self.whereClause = new jSQLWhereClause(self);
			self.resultSet = [];
			
			// Methods that every query class should implement
			var methods = ['init', 'ifNotExists', 'execute', 'fetch', 'ignore', 
				'fetchAll', 'values', 'set', 'where', 'from', 'orderBy', 'asc',
				'desc', 'limit', 'distinct'];
			var queryTypeConstructors = {
				CREATE: jSQLCreateQuery,
				UPDATE: jSQLUpdateQuery,
				SELECT: jSQLSelectQuery,
				INSERT: jSQLInsertQuery,
				DROP: jSQLDropQuery,
				DELETE: jSQLDeleteQuery
			};
			for(var i=0; i<methods.length; i++)(function(i){
				self[methods[i]] = function(){
					var q = new queryTypeConstructors[self.type];
					if(typeof q[methods[i]] == "function") return q[methods[i]].apply(self, arguments);
					else return _throw(new jSQL_Error("0022"));
				};
			})(i);
		}
		