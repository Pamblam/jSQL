/**
 * Testing unique keys, auto_increment
 * @type Module jSQL|Module jSQL
 */

var jSQL = require("../jSQL.js");

var data = [
	[0, "rob", "hamburger"], // zeros don't fly in a auto increment column, this should be inserted as 5
	[1, "bob", "fish tacos"],
	[4, "ted", "applesauce"]
];

jSQL.onError(function(e){
	console.log("\n\nERROR: "+e.message+"\n\n");
});

jSQL.load(function(){

	// Create a compound key using low-level syntax
//	jSQL.createTable({test5table: [
//		{ name: "ID", type: "INT", args: [], key: "primary", auto_increment: true }, 
//		{ name: "Name", type: "VARCHAR", args: [30] },
//		{ name: "FOOD", type: "VARCHAR", args: [30] }
//	]}).execute(data);

	// Create a non-compound key using high-level syntax
	jSQL.query("create table if not exists test5table (ID int auto_increment primary key, Name varchar, FOOD varchar)").execute(data);
	jSQL.query("insert into test5table (ID, Name, FOOD) values (?, ?, ?)").execute([10, 'nick', 'cake']);
	jSQL.query("insert into test5table (ID, Name, FOOD) values (?, ?, ?)").execute([0, 'jimbo', 'fart sauce']); // ID field should be 11
	jSQL.query("insert into test5table (Name, FOOD) values (?, ?)").execute(['lilly', 'poop burger']); // ID filed should be 12
	jSQL.query("update test5table set ID = 70 where name = 'bob'").execute(); // this should make the next value in the auto increment sequence 71
	jSQL.commit();

	console.log("done 5");
});