/**
 * This script should display a list of all the times it was run
 * @type Module jSQL|Module jSQL
 */

var jSQL = require("../jSQL.js");

jSQL.load(function(){
	jSQL.query("create table if not exists test (id int, time date)").execute();
	var values = jSQL.query("select * from test").execute().fetchAll();
	if(!Array.isArray(values)) values = [];
	var id = values.length;
	var date = new Date();
	jSQL.query("insert into test values (?, ?)").execute([id, date]);
	values.push({id:id, time:date});

	var output = [];
	for(var i=0; i<values.length; i++){
		output.push(values[i].id+" "+values[i].time.toString());
	}
	console.log(output.join("\n"));

	jSQL.commit();
});