
/**
 * Testing custom datatypes
 * @type Module jSQL|Module jSQL
 */

var jSQL = require("../jSQL.js");

// our custom datatype will hold an instance of this class
function hat(type,color){
	this.type = type;
	this.color = color;
	this.getName = function(){
		return "a "+this.color+" "+this.type;
	};
}

jSQL.types.add({
	type: "HAT",
	serialize: function(value, args){
		return JSON.stringify(value);
	},
	unserialize: function(value, args){
		var o = JSON.parse(value);
		return new hat(o.type, o.color);
	}
});

jSQL.load(function(){

	// create the table and populate it, 
	// if it does not already exist
	var query = jSQL.query("Create table if not exists hatTable "+
		"(name varchar(50,5), age int, created date, greet function, favorite_hat hat)");

	// execute the query and insert the data 
	// (if the table doesn't already exist)
	query.execute([{ 
		name: "bob",
		age: 27,
		created: new Date(),
		greet: function(){alert("hi!");},
		favorite_hat: new hat("cowboy hat","blue")
	},{
		name: "ned",
		age: 29,
		created: new Date(),
		greet: function(){alert("hello!");},
		favorite_hat: new hat("baseball cap","green")
	},{
		name: "Fred",
		age: 34,
		created: new Date(),
		greet: function(){alert("sup dawg!");},
		favorite_hat: new hat("tophat","purple")
	}]);
	jSQL.commit();

	console.log("There are "+jSQL.tables.hatTable.data.length+" total rows in `hatTable`");
	var results = jSQL.query('SELECT * FROM `hatTable`').execute().fetchAll();
	echo(makeTable(results));
});