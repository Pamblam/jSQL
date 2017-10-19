
		function createTable(name, columnsOrData, types, keys, auto_increment){

			// allow for all params to be passed in a single object
			// jSQL.createTable({myTable: [
			//		{ name: "ID", type: "INT", args: [] }, 
			//		{ name: "Name", type: "VARCHAR", args: [30] }
			// ]})
			// 
			// OR, for compund keys
			// 
			// jSQL.createTable({myTable: [
			//		{ name: "ID", type: "INT", args: [] }, 
			//		{ name: "Name", type: "VARCHAR", args: [30] }
			// ]}, [
			//		{ column: ["ID", "Name"], type: "primary" }	
			// ])
			// 
			// OR, for single-column keys
			//
			// jSQL.createTable({myTable: [
			//		{ name: "ID", type: "INT", args: [], key: "primary", auto_increment: true }, 
			//		{ name: "Name", type: "VARCHAR", args: [30] }
			// ]})
			var dataObjNoKeys = undefined === columnsOrData && undefined === types && "object" === typeof name && undefined === keys;
			var dataObjWithKeys = Array.isArray(columnsOrData) && undefined === types && "object" === typeof name && undefined === keys;
			if(dataObjNoKeys || dataObjWithKeys){
				if(dataObjWithKeys) keys = undefined === columnsOrData ? [] : columnsOrData; 
				if(undefined === keys) keys = [];
				columnsOrData = [];
				types = [];
				for(var tblname in name){
					if(!name.hasOwnProperty(tblname))continue;
					var columnDefs = name[tblname];
					name = tblname;
					for(var n=0; n<columnDefs.length; n++){ 
						var col = columnDefs[n].name;
						columnsOrData.push(col);
						types.push({
							type: columnDefs[n].type, 
							args: (undefined===columnDefs[n].args ? []:columnDefs[n].args)
						});
						// if a key is defined in the row column (only for single column keys)
						if(columnDefs[n].hasOwnProperty("key") && Array.isArray(keys)){
							keys.push({column: columnDefs[n].name, type: columnDefs[n].key});
						}
						// If auto_incerment is defined in the column definitions
						if(columnDefs[n].hasOwnProperty("auto_increment") && columnDefs[n].auto_increment === true){
							auto_increment = columnDefs[n].name;
						}
					}
					break;
				}
			}
			
			// if a single column was provided
			if(!Array.isArray(columnsOrData)) columnsOrData=[columnsOrData];
			if(undefined === keys) keys = [];
			if(!Array.isArray(keys)) keys=[keys];
			return new jSQLQuery("CREATE").init(name, columnsOrData, types, keys, auto_increment);
		}
		