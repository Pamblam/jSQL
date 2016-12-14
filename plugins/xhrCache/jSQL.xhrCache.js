/**
 * jSQL.xhrCache.js v0.1
 * A jSQL plugin that caches non-unique AJAX requests
 * @author Robert Parham
 * @website https://github.com/Pamblam/jSQL#jsql
 */;

window.jSQL.xhrCache = (function(callback){ 
	jSQL.load(function(){
		
		// Make sure there's a table available
		jSQL.createTable({
			jSQLCache: {
				id: {type: "int"},
				method: {type: "varchar"},
				url: {type: "varchar"},
				post_data: {type:"varchar"},
				post_data_type: {type: "varchar"},
				username: {type:"varchar"},
				password: {type:"varchar"},
				cached_time: {type:"date"},
				use_count: {type: "int"},
				response: {type:"json"}
			}
		}).ifNotExists().execute();
		
		XHRCreep.methods.notify.open = function(){
			this._METHOD = arguments[0].toUpperCase();
			this._URL = arguments[1];
			this._USERNAME = undefined === arguments[3] ? "" :arguments[3];
			this._PASSWORD = undefined === arguments[4] ? "" :arguments[4];
		};
		
		XHRCreep.methods.override.send = function(){
			this._POST_DATA = "";
			this._POST_DATA_TYPE = "";
			try{
				this._POST_DATA = "JSON";
				this._POST_DATA_TYPE = JSON.parse(arguments[0]);
			}catch(e){
				this._POST_DATA = "";
				this._POST_DATA_TYPE = "";
			}
			
			// check for an existing equivelent call
			var query = jSQL.query("select * from jSQLCache where method = ? and"+
					" url = ? and post_data = ? and post_data_type = ? and username = ?"+
					" and password = ?");
			var params = [this._METHOD, this._URL, this._POST_DATA, this._POST_DATA_TYPE,
					this._USERNAME, this._PASSWORD];
			var results = query.execute(params).fetchAll("ASSOC");

			var proceed = true;
			if(results.length) proceed = false;
			
			if(proceed){
				var rsc = this.onreadystatechange;
				this._xhr.onreadystatechange = function(){
					if (this._xhr.readyState === 4 && this._xhr.status === 200){ 
						this.this.getMockProperties();
						// serialize the request as best we can
						var sreq = {};
						for(var p in this){
							if("function" !== typeof this[p])
								try{sreq[p] = this[p];}catch(e){}
						}
						var id = jSQL.query("select * from jSQLCache").execute().fetchAll("ARRAY").length;
						query = jSQL.query("insert into jSQLCache values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
						query.execute([id, this._METHOD, this._URL, this._POST_DATA, this._POST_DATA_TYPE,
							this._USERNAME, this._PASSWORD, new Date(), 0, sreq]);
						jSQL.persist();
						console.log("jSQL.xhrCache: Caching AJAX response");
					}

					rsc.apply(this, arguments);
				};
				this._xhr.send.apply(this._xhr, arguments);
			}else{
				console.log("serve cached tits");
			}
		};
	});
		
	return {max_age: false, logging:false}; // what to put here? settings?
})();