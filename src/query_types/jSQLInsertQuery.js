
		function jSQLInsertQuery(){
			this.init = function(table){
				this.table = table;
				this.ignoreFlag = false;
				return this;
			};
			this.values = function(data){
				if(undefined === jSQL.tables[this.table])
					return _throw(new jSQL_Error("0021"));
				this.data = data;
				return this;
			};
			this.execute = function(preparedVals){
				if(preparedVals !== undefined && Array.isArray(preparedVals) && preparedVals.length>0){
					if(Array.isArray(this.data)){
						for(var i=this.data.length; i-- && preparedVals.length;)
							if(this.data[i]=="?") this.data[i]=preparedVals.shift();
					}else{
						for(var i in this.data)
							if(this.data.hasOwnProperty(i) && preparedVals.length && this.data[i] == "?")
								this.data[i] = preparedVals.shift();
					}
				}
				jSQL.tables[this.table].insertRow(this.data, this.ignoreFlag);
				return this;
			};
			this.ignore = function(){ this.ignoreFlag=true; return this; };
			this.fetch = function(){ return null; };
			this.fetchAll = function(){ return []; };
		}
		