/**
 * This script creates a table with every datatype, inserts a row then fetches it
 * @type Module jSQL|Module jSQL
 */

var jSQL = require("../jSQL.js");

jSQL.load(function(){

	jSQL.query("create table typetest ("+
		"id numeric(3), "+
		"data json, "+
		"greet function, "+
		"active boolean, "+
		"number int(3), "+
		"code char(4), "+
		"name varchar(4), "+
		"created date, "+
		"anything ambi, "+
		"something enum('hello','goodbye')"+
		" )").execute();

	var sql = "insert into typetest values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
	params = [2.1, {"3":3}, function(){}, true, 4, 'y12', 'bob', new Date(), 'something', 'hello'];
	jSQL.query(sql).execute(params);

	var data = jSQL.query("select * from typetest").execute().fetch();
	console.log("done 6");
});