
var jSQL = require("../jSQL.js");

jSQL.onError(function(e){
	console.log(e.message);
});

jSQL.query("create table test1 (id int, name varchar)").execute([[1,"fart"],[2,"fartypoo"],[3,"pootytang"],[5,"shittypoop"]]);
jSQL.query("create table test2 (id int, hobby varchar)").execute([[1,"bball"],[2,"pooping"],[3,"shitting"],[4,"farting"]]);

var query = jSQL.select("*").from('test1').join('test2').on('test2', 'id').equals('test1', 'id');
var results = query.execute().fetchAll('assoc');

console.log(results);