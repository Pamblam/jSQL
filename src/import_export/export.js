
function jsql_export(create_tables, table_names){
	create_tables = undefined === create_tables ? true : !!create_tables;
	table_names = table_names || [];
	var dump_buffer = [];
	for(var table in jSQL.tables){
		if(!jSQL.tables.hasOwnProperty(table)) continue;
		if(!table_names.length || ~table_names.indexOf(table)){
			if(create_tables){
				var table_buffer = [];
				for(var i=0; i<jSQL.tables[table].columns.length; i++){
					var col_buffer = [];
					col_buffer.push("`"+jSQL.tables[table].columns[i]+"` ");
					var args = "";
					if(jSQL.tables[table].types[i].args.length) args = JSON.stringify(jSQL.tables[table].types[i].args).trim().slice(1, -1);
					col_buffer.push(jSQL.tables[table].types[i].type+"("+args+") ");
					col_buffer.push(jSQL.tables[table].types[i].null ? 'NULL ' : 'NOT NULL ');
					if(jSQL.tables[table].types[i].default) col_buffer.push('DEFAULT '+JSON.stringify(jSQL.tables[table].types[i].default)+' ');
					if(jSQL.tables[table].columns[i] === jSQL.tables[table].auto_inc_col) col_buffer.push('AUTO_INCREMENT');
					table_buffer.push("\n\t"+(col_buffer.join('').trim()))
				}
				if(jSQL.tables[table].keys.primary.column){
					col_buffer = []; 
					if(Array.isArray(jSQL.tables[table].keys.primary.column)){
						for(var i=0; i<jSQL.tables[table].keys.primary.column.length; i++){
							col_buffer.push('`'+jSQL.tables[table].keys.primary.column[i]+'`');
						}
					}else{
						col_buffer.push('`'+jSQL.tables[table].keys.primary.column+'`');
					}
					table_buffer.push("\n\tPRIMARY KEY ("+(col_buffer.join(','))+")");
				}
				if(jSQL.tables[table].keys.unique.length){
					for(var n=0; n<jSQL.tables[table].keys.unique.length; n++){
						col_buffer = []; 
						if(Array.isArray(jSQL.tables[table].keys.unique[n].column)){
							for(var i=0; i<jSQL.tables[table].keys.unique[n].column.length; i++){
								col_buffer.push('`'+jSQL.tables[table].keys.unique[n].column[i]+'`');
							}
						}else{
							col_buffer.push('`'+jSQL.tables[table].keys.unique[n].column+'`');
						}
						table_buffer.push("\n\tUNIQUE KEY ("+(col_buffer.join(','))+")");
					}
				}
				dump_buffer.push('CREATE TABLE `'+table+'` ('+(table_buffer.join(","))+"\n)");
			}
			for(var i=0; i<jSQL.tables[table].data.length; i++){
				var values = JSON.stringify(jSQL.tables[table].data[i]).trim().slice(1, -1).replace(/"jsqlNull"/g, 'null');
				dump_buffer.push("INSERT INTO `"+table+"` (`"+(jSQL.tables[table].columns.join('`,`'))+"`) VALUES ("+values+")");
			}
		}
	}
	var header = ["-- Exported by jSQL v"+jSQL.version+" "+(new Date().toUTCString())];
	var hwrapper = "-".repeat(header[0].length);
	header.unshift(hwrapper);
	header.push(hwrapper);
	return (header.join("\n"))+"\n"+(dump_buffer.join(";\n"));
}