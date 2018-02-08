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
				{a:2, b:3, c:3, d:54, e:7, f:6, g:7, h:"d"},
				{a:2, b:3, c:3, d:54, e:7, f:6, g:7, h:"d"}
			]).execute();
			expect((jSQL.tables.oTable.data.length === 4 && jSQL.tables.oTable.columns.length === 8)).to.be.true;
		});
		
		it('checking distinct', function(){
			var res = jSQL.query("select distinct * from oTable").execute().fetchAll("ASSOC");
			expect(res.length === 3).to.be.true;
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
			jSQL.createTable("cjjTable", ['u0', 'b', 'c', 'd', 'e', 'f', 'g']).execute([
				[12, 34, 56, 78],
				[23, 45, 67, 89, 78, 78],
				[7], {"a": 1, "b": 2, "g": 3}
			]);
			
			expect((jSQL.tables.cjjTable.data.length === 4 && jSQL.tables.cjjTable.columns.length === 7)).to.be.true;
		});
		
		it('rename columns', function(){
			jSQL.query("create table ceTable (u0, b, c, d, e, f, g, primary key(b), unique key(c))").execute();
			jSQL.insertInto("ceTable").values({u0:2, b:3, c:34}).execute();
			try{
				jSQL.tables.ceTable.renameColumn('u0', {});
			}catch(e){}
			try{
				jSQL.tables.ceTable.renameColumn('b', 'adfa');
			}catch(e){}
			try{
				jSQL.tables.ceTable.renameColumn('b', 'c');
			}catch(e){}
			try{
				jSQL.deleteFrom("asdf").execute();
			}catch(e){}
			try{
				jSQL.deleteFrom("ceTable").execute();
			}catch(e){}
			
			jSQL.tables.ceTable.renameColumn('u0', 'ufff');
			expect(jSQL.tables.ceTable.columns[0] == 'ufff').to.be.true;
			
			jSQL.query("create table abc (a, b, c, primary key (a, b))").execute();
			jSQL.query("create table bcd (a int auto_increment, b, c, primary key (a))").execute();
			jSQL.query("insert into bcd values (1, 'd', 'e')").execute();
			jSQL.query("insert into bcd values (2, 'd', 'j')").execute();
			jSQL.query("insert into bcd (b,c) values ('d', 'f')").execute();
			jSQL.query("update bcd set a = ? where c = ?").execute([5, 'f']);
			jSQL.query("update bcd set a = ? where c = ?").execute([null, 'f']);
			
			jSQL.query("create table cde (a, b, c, unique key (a, b))").execute();
			jSQL.query("insert into abc values ('a', 'c', 'c')").execute();
			jSQL.query("insert into abc values ('c', 'd', 'e')").execute();
			jSQL.query("insert into cde values ('a', 'c', 'c')").execute();
			jSQL.query("insert into cde values ('c', 'd', 'e')").execute();
			jSQL.query("update abc set a = ? where c = ?").execute(['a', 'e']);
			jSQL.query("update cde set a = ? where c = ?").execute(['a', 'e']);
			
			try{jSQL.query("update asdfasd set a = ? where c = ?").execute(['a', 'e']);}catch(e){}
			try{jSQL.update("asdfasd")}catch(e){}
		});
		
	});
});