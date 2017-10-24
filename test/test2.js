var expect = require('chai').expect;
var jSQL = require("../jSQL.js");

jSQL.onError(function(e){
	console.log(e.message);
});

jSQL.load(function () {
	jSQL.reset();
	describe('FuNkY TaBlE TeSts', function () {
		
		it('inserting inconsistent objects', function(){
			jSQL.createTable("oTable", [
				{a:1, b:2, c:3, d:4, e:5, f:6, g:7},
				{a:2, b:3, c:3, d:54, e:7, f:6},
				{a:2, b:3, c:3, d:54, e:7, f:6, g:7, h:"d"}
			]).execute();
			expect((jSQL.tables.oTable.data.length === 3 && jSQL.tables.oTable.columns.length === 8)).to.be.true;
		});
		
		it('dynamically adding columns', function(){
			jSQL.createTable("aTable", ["u0", "b", "c"]).execute([
				[12, 34, 56, 78],
				[23, 45, 67, 89, 78, 78],
				[7]
			]);
			expect((jSQL.tables.aTable.data.length === 3 && jSQL.tables.aTable.columns.length === 6)).to.be.true;
		});
		
		it('mixing arrays and objects', function(){
			jSQL.createTable("ceTable", ['u0', 'b', 'c', 'd', 'e', 'f', 'g']).execute([
				[12, 34, 56, 78],
				[23, 45, 67, 89, 78, 78],
				[7], {"a": 1, "b": 2, "g": 3}
			]);
			expect((jSQL.tables.ceTable.data.length === 4 && jSQL.tables.ceTable.columns.length === 7)).to.be.true;
		});
		
	});
});