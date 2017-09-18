/**
 * Test the durability of the create statement by passing it add data structures
 * @type Module jSQL|Module jSQL
 */

var jSQL = require("../jSQL.js");

// Using objects
jSQL.createTable("oTable", [
	{a:1, b:2, c:3, d:4, e:5, f:6, g:7},
	{a:2, b:3, c:3, d:54, e:7, f:6},
	{a:2, b:3, c:3, d:54, e:7, f:6, g:7, h:"d"}
]).execute();

// Using arrays
jSQL.createTable("aTable", ["a", "b", "c"]).execute([
	[12,34,56,78],
	[23,45,67,89,78,78],
	[7]
]);

// Using a combination, explicit column names
jSQL.createTable("ceTable", ['a', 'b', 'c', 'd', 'e', 'f', 'g']).execute([
	[12,34,56,78],
	[23,45,67,89,78,78],
	[7], {"a":1, "b":2, "g":3}
]);

var results;

console.log("There are "+jSQL.tables.oTable.data.length+" total rows in `oTable`");
results = jSQL.query('SELECT * FROM `oTable`').execute().fetchAll();
//console.log(JSON.stringify(results));

console.log("There are "+jSQL.tables.aTable.data.length+" total rows in `aTable`");
results = jSQL.query('SELECT * FROM `aTable`').execute().fetchAll();
//console.log(JSON.stringify(results));

console.log("There are "+jSQL.tables.ceTable.data.length+" total rows in `ceTable`");
results = jSQL.query('SELECT * FROM `ceTable`').execute().fetchAll();
//console.log(JSON.stringify(results));

console.log("done 2");