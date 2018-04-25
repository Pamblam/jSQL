var expect = require('chai').expect;
var jSQL = require("../jSQL.js");

jSQL.onError(function(e){
	console.log(e.message);
});

jSQL.query("create table test1 (id int, name varchar)").execute([[1,"fart"],[2,"fartypoo"],[3,"pootytang"],[5,"shittypoop"]]);
jSQL.query("create table test2 (id int, hobby varchar)").execute([[1,"bball"],[2,"pooping"],[3,"shitting"],[4,"farting"]]);

describe('table and column alias tests', function () {

	it('table alias test', function(){
		var a = jSQL.select({table: 'poo', name:"*"}).from('test1', 'poo').execute().fetchAll("assoc");
		expect(a.length == 4).to.be.true;
	});

	it('column alias test', function(){
		var a = jSQL.select({table: 'poo', name:"id", alias:'eyedee'}).from('test1', 'poo').execute().fetch("assoc");
		expect(!!a.eyedee).to.be.true;
	});

});