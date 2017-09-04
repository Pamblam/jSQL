/**
 * Testing primary keys, error handling, and "ignore"
 * @type Module jSQL|Module jSQL
 */

var jSQL = require("../jSQL.js");

var data = [
	[0, "rob", "hamburger"],
	[1, "bob", "fish tacos"],
	[2, "ted", "applesauce"]
];

jSQL.onError(function(e){
	//console.log(e.message);
});

jSQL.load(function(){

	//// Create a compound key using low-level syntax
	// jSQL.createTable({test4table: [
	//		{ name: "ID", type: "INT", args: [] }, 
	//		{ name: "Name", type: "VARCHAR", args: [30] },
	//		{ name: "FOOD", type: "VARCHAR", args: [30] }
	// ]}, [
	//		{ column: ["ID", "Name"], type: "unique" }	
	// ]).execute(data);

	//// Create a compund key using high level syntax
	// jSQL.query("create table if not exists test4table (ID int, Name varchar, FOOD varchar, PRIMARY KEY (ID, Name))").execute(data);

	// Create a non-compound key using high-level syntax
	jSQL.query("create table if not exists test4table (ID int unique key, Name varchar, FOOD varchar)").execute(data);

	// Insert ignore low level syntax
	// jSQL.insertInto('test4table').values({ID:0, Name:'Nerd', FOOD: "Bagels"}).ignore().execute();

	// This will the primary key, adding "ignore" prevents it from throwing an error
	//jSQL.query("insert ignore into test4table VALUES (0, 'nerd', 'bagel')").execute();

	jSQL.update('test4table').ignore().set({ID:0}).where("Name").equals("bob").execute();

	//jSQL.commit();

	console.log("done");
});