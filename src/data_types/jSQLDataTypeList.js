
function jSQLDataTypeList(){
	this.list = [{
		type: "NUMERIC",
		aliases: ["NUMBER", "DECIMAL", "FLOAT"],
		serialize: function(value, args){
			if(value === null) value = 0;
			return !isNaN(parseFloat(value)) && isFinite(value) ?
				parseFloat(value) : 
				_throw(new jSQL_Error("0069")) ;
		},
		unserialize: function(value, args){
			if(!value) value = 0;
			return !isNaN(parseFloat(value)) && isFinite(value) ?
				parseFloat(value) : 
				_throw(new jSQL_Error("0069")) ;
		}
	},{
		type: "ENUM",
		serialize: function(value, args){ 
			if(value === null) return "-null-";
			for(var i=args.length; i--;)
				if(value === removeQuotes(args[i])) return value;
			return _throw(new jSQL_Error("0068"));
		},
		unserialize: function(value, args){ 
			if(value === "-null-") return null;
			for(var i=args.length; i--;)
				if(value === removeQuotes(args[i])) return value;
			return _throw(new jSQL_Error("0068"));
		}
	},{
		type: "TINYINT",
		serialize: function(value, args){ 
			if(value === null) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) &&
				value >= -128 && value <= 127 ?
				parseInt(value) : 0; 
		},
		unserialize: function(value, args){ 
			if(!value) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) ?
				parseInt(value) : 0; 
		}
	},{
		type: "SMALLINT",
		serialize: function(value, args){ 
			if(value === null) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) &&
				value >= -32768 && value <= 32767 ?
				parseInt(value) : 
				_throw(new jSQL_Error("0069")) ; 
		},
		unserialize: function(value, args){ 
			if(!value) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) ?
				parseInt(value) : 
				_throw(new jSQL_Error("0069")) ; 
		}
	},{
		type: "MEDIUMINT",
		serialize: function(value, args){ 
			if(value === null) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) &&
				value >= -8388608 && value <= 8388607 ?
				parseInt(value) : 
				_throw(new jSQL_Error("0069")) ; 
		},
		unserialize: function(value, args){ 
			if(!value) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) ?
				parseInt(value) : 
				_throw(new jSQL_Error("0069")) ; 
		}
	},{
		type: "INT",
		serialize: function(value, args){ 
			if(value === null) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) &&
				value >= -2147483648 && value <= 2147483647 ?
				parseInt(value) : _throw(new jSQL_Error("0069")); 
		},
		unserialize: function(value, args){ 
			if(!value) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) ?
				parseInt(value) : _throw(new jSQL_Error("0069")); 
		}
	},{
		type: "BIGINT",
		serialize: function(value, args){ 
			if(value === null) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) &&
				value >= -9007199254740991 && value <= 9007199254740991 ?
				parseInt(value) : _throw(new jSQL_Error("0069")); 
		},
		unserialize: function(value, args){ 
			if(!value) value = 0;
			return !isNaN(parseInt(value)) && isFinite(value) ?
				parseInt(value) : _throw(new jSQL_Error("0069")); 
		}
	},{
		type: "JSON",
		aliases: ["ARRAY", "OBJECT"],
		serialize: function(value){
			if(value === null) return "null";
			if(typeof value === "string") return value;
			return JSON.stringify(value);
		},
		unserialize: function(value){
			if(value === "null") return null;
			return JSON.parse(value);
		}
	},{
		type: "FUNCTION",
		serialize: function(value){
			if(value === null) return "null";
			if(typeof value !== "function"){
				var f = null;
				try{
					eval("f = "+value);
				}catch(e){};
				if("function" === typeof f) value = f;
				else _throw(new jSQL_Error("0001"));
			}
			return "jSQLFunct-"+value.toString();
		},
		unserialize: function(value){
			if(value === "null") return null;
			var p = value.split("-");
			if(p.shift() !== "jSQLFunct") return _throw(new jSQL_Error("0001"));
			p = value.split("-");
			p.shift();
			var f = null;
			try{
				eval("f = "+p.join("-"));
			}catch(e){};
			if("function" === typeof f) return f;
			return _throw(new jSQL_Error("0001"));
		}
	},{
		type: "BOOLEAN",
		aliases: ['BOOL'],
		serialize: function(value){
			if(value === null) return "null";
			return value === true || value.toUpperCase() == "TRUE" || value == 1 ? 
				"1" : "0" ;
		},
		unserialize: function(value){
			if(value === "null") return null;
			return value === true || value.toUpperCase() == "TRUE" || value == 1 ; 
		}
	},{
		type: "CHAR",
		serialize: function(value, args){ 
			if(value === null) return "-null-";
			return ""+value; 
		},
		unserialize: function(value, args){ 
			if(value === "-null-") return null;
			var targetLength = args[0]>>0, padString = ' ';
			if (value.length > targetLength) return value.substr(0, args[0]);
			else {
				targetLength = targetLength-value.length;
				if (targetLength > padString.length)
					padString += padString.repeat(targetLength/padString.length); 
				return String(value) + padString.slice(0,targetLength);
			}
			return ""+value; 
		}
	},{
		type: "VARCHAR",
		aliases: ["LONGTEXT", "MEDIUMTEXT"],
		serialize: function(value, args){ 
			if(value === null) return "-null-";
			return ""+value; 
		},
		unserialize: function(value, args){ 
			if(value === "-null-") return null;
			return ""+value; 
		}
	},{
		type: "DATE",
		serialize: function(value){ 
			if(value === null) return "-null-";
			if(!(value instanceof Date)) return new Date(value).getTime();
			return value.getTime(); 
		},
		unserialize: function(value){ 
			if(value === "-null-") return null;
			return new Date(value);
		}
	},{
		type: "AMBI",
		serialize: function(value){
			if(value === null) return "-null-";
			if(value instanceof Date) return value.getTime();
			if(typeof value === "function") return "jSQLFunct-"+value.toString();
			if(!isNaN(parseFloat(value)) && isFinite(value)) return value;
			return ""+value;
		},
		unserialize: function(value){ 
			if(value === "-null-") return null;
			if(typeof value === "string"){ 
				if(value.split("-")[0] === "jSQLFunct"){
					var p = value.split("-");
					p.shift();
					var f = null;
					try{
						eval("f = "+p.join("-"));
					}catch(e){};
					if("function" === typeof f) return f;
				}
			}
			return value;
		}
	}];
	this.add = function(type){
		if(typeof type !== "object") return _throw(new jSQL_Error("0003"));
		if(undefined === type.type) return _throw(new jSQL_Error("0004"));
		if("function" !== typeof type.serialize) return _throw(new jSQL_Error("0005"));
		if("function" !== typeof type.unserialize) return _throw(new jSQL_Error("0006"));
		this.list.push({
			type: type.type.toUpperCase(),
			aliases: Array.isArray(type.aliases) ? type.aliases : [],
			serialize: type.serialize,
			unserialize: type.unserialize
		});
	};
	this.exists = function(type){
		type = type.toUpperCase();
		for(var i=this.list.length;i--;)
			if(this.list[i].type===type || 
				(this.list[i].aliases !== undefined && this.list[i].aliases.indexOf(type) > -1)) 
				return true;
		return false;
	};
	this.getByType = function(type){
		type = type.toUpperCase();
		for(var i=this.list.length;i--;)
			if(this.list[i].type===type || 
				(this.list[i].aliases !== undefined && this.list[i].aliases.indexOf(type) > -1)) 
				return this.list[i];
		return _throw(new jSQL_Error("0007"));
	};
}
		