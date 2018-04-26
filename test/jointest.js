
var jSQL = require("../jSQL.js");

jSQL.onError(function(e){
	console.log(e.message);
});

jSQL.query("create table test1 (od int, name varchar, something varchar)").execute([[1,"fart",'a'],[2,"fartypoo",'b'],[3,"pootytang",'c'],[5,"shittypoop",'c']]);
jSQL.query("create table test2 (id int, hobby varchar)").execute([[1,"bball"],[2,"pooping"],[3,"shitting"],[4,"farting"]]);

var query = jSQL.select([
	{table:'a', name: 'name', alias:'title'},
	{table:'a', name: 'something', alias:'wut'},
	{table:'b', name: 'hobby', alias:'does'}
]).from('test1', 'a').join('test2', 'b').on('a', 'od').equals('b', 'id')
//where();
var results = query.execute().fetchAll('assoc');

console.log(results);

console.log(jSQL.tables);