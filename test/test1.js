var expect = require('chai').expect;
var jSQL = require("../jSQL.js");

jSQL.onError(function(e){
	console.log(e.message);
});

jSQL.load(function () {
	jSQL.reset();
	describe('Lexer/Parser tests', function () {
		
		it('create wtf_test table', function(){
			jSQL.query("create table wtf_test (id, name, `somekey` varchar(), something enum('hello','goodbye'), primary key(`id`, name), unique key (somekey) )").execute();
			expect((jSQL.tables.wtf_test !== undefined)).to.be.true;
		});
		
		it('create typetest table', function(){
			jSQL.query("create table typetest (id numeric(3), data json, greet function, active boolean, `number` int(3), code char(4), name varchar(4), created date, anything ambi, something enum('hello','goodbye') )").execute();
			expect((jSQL.tables.typetest.colmap.number === 4 && jSQL.tables.typetest.types[9].args[0] === 'hello' && jSQL.tables.typetest.types[9].args[1] === 'goodbye')).to.be.true;
		});
		
		it('create keytest table', function(){
			jSQL.query("create table keytest (id int auto_increment primary key, data, greet, active, `number`, code, name varchar, created date, anything ambi, something enum('hello','goodbye') )").execute();
			expect((jSQL.tables.keytest.keys.primary.column === 'id' && jSQL.tables.keytest.auto_inc_col === 'id')).to.be.true;
		});
		
		it('create keytest2 table', function(){
			jSQL.query("create table keytest2 (id int auto_increment, data, greet, active, `number`, code, name varchar, created date, anything ambi, something enum('hello','goodbye'), primary key(`id`, name) )").execute();
			expect((jSQL.tables.keytest2.keys.primary.column[0] === 'id' && jSQL.tables.keytest2.keys.primary.column[1] === 'name' && jSQL.tables.keytest2.auto_inc_col === 'id')).to.be.true;
		});
		
		it('create keytest3 table', function(){
			jSQL.query("create table keytest3 (id int auto_increment, name, num1 int, num2 int, primary key(`id`, name), unique key(num1, num2) )").execute();
			expect(!!jSQL.tables.keytest3).to.be.true;
		});
		
		it('insert into keytest3 table', function(){
			jSQL.query("insert ignore into keytest3 (name, num1, num2) values (?, ?, ?)").execute(['bob', 3, 5]);
			expect(jSQL.tables.keytest3.data.length === 1).to.be.true;
		});
		
		it('insert into keytest3 table', function(){
			jSQL.query("insert ignore into keytest3 (name, num1, num2) values (?, ?, ?)").execute(['bill', 3, 5]);
			expect(jSQL.tables.keytest3.data.length === 1).to.be.true;
		});
		
		it('insert into keytest3 table', function(){
			jSQL.query("insert ignore into keytest3 (name, num1, num2) values (?, ?, ?)").execute(['bill', 3, 7]);
			expect(jSQL.tables.keytest3.data.length === 2).to.be.true;
		});
		
		it('create smalltest table', function(){
			jSQL.query("create table `smalltest` (id int, str varchar)").execute();
			expect((!!jSQL.tables.smalltest)).to.be.true;
		});
		
		it('insert into smalltest table', function(){
			jSQL.query("insert into smalltest (id, str) values (7, 'testing')").execute();
			expect((jSQL.tables.smalltest.data.length === 1)).to.be.true;
		});
		
		it('insert into smalltest table again', function(){
			jSQL.query("insert into `smalltest` values (11, 'testing again')").execute();
			expect((jSQL.tables.smalltest.data.length === 2)).to.be.true;
		});
		
		it('insert into typetest table', function(){
			jSQL.query("insert into `typetest` values (11, '{\"greeting\":\"hello\"}', 'function(){console.log(\"hello world\")}', true, 3, '72', 'rob', 'Mon, 25 Dec 1995 13:30:00 +0430', 'scooby doo', \"hello\")").execute();
			expect((jSQL.tables.typetest.data.length === 1)).to.be.true;
		});
		
		it('insert into keytest2 table', function(){
			jSQL.query("insert into `keytest2` (id, `greet`) values (11, 'holla')").execute();
			expect((jSQL.tables.keytest2.data[0][0] === 11)).to.be.true;
		});
		
		it('insert into keytest2 table again', function(){
			jSQL.query("insert into `keytest2` (`greet`) values ('poopums')").execute();
			expect((jSQL.tables.keytest2.data[1][0] === 12)).to.be.true;
		});
		
		it('select from typetest table', function(){
			var res = jSQL.query("select * from `typetest` limit 1 offset 0").execute().fetchAll("ARRAY");
			expect((res[0][7] instanceof Date && "function" === typeof res[0][2])).to.be.true;
		});
		
		it('select from keytest2 table', function(){
			var q = jSQL.query("SELECT id, greet FROM `keytest2` WHERE `id` > 11").execute();
			expect((q.fetch("ASSOC").greet === "poopums")).to.be.true;
		});
		
		it('select from keytest2 table again', function(){
			var q = jSQL.query("SELECT id, greet FROM `keytest2` WHERE `id` < 12").execute();
			expect((q.fetch("ASSOC").greet === "holla")).to.be.true;
		});
		
		it('select from keytest2 table again again', function(){
			var q = jSQL.query("SELECT * FROM `keytest2` WHERE `id` < 12 and greet = 'holla'").execute();
			expect((q.fetch("ASSOC").greet === "holla")).to.be.true;
		});
		
		it('select from keytest2 table once again', function(){
			var q = jSQL.query("SELECT * FROM `keytest2` WHERE `id` < 12 and greet = 'holla' and greet <> \"poo\" or id = 11").execute();
			expect((q.fetch("ASSOC").greet === "holla")).to.be.true;
		});
		
		it('select from keytest2 table again once again', function(){
			var q = jSQL.query("SELECT * FROM `keytest2` WHERE `greet` LIKE '%olla'").execute();
			expect((q.fetch("ASSOC").greet === "holla")).to.be.true;
		});
		
		it('select from keytest2 table again once again', function(){
			var q = jSQL.query("SELECT * FROM `keytest2` WHERE `greet` LIKE ?").execute(['%olla']);
			expect((q.fetch("ASSOC").greet === "holla")).to.be.true;
		});
		
		it('select from keytest2 table again once again', function(){
			var q = jSQL.query("SELECT * FROM `keytest2` order by id asc").execute();
			expect((q.fetchAll("ASSOC").length === 2)).to.be.true;
		});
		
		it('select from keytest2 table again once again', function(){
			var q = jSQL.query("SELECT * FROM `keytest2` order by id, greet desc").execute();
			expect((q.fetchAll("ASSOC").length === 2)).to.be.true;
		});
		
		it('select from keytest2 table again once again once', function(){
			var q = jSQL.query("SELECT * FROM `keytest2` WHERE `greet` LIKE '%o%'").execute();
			expect((q.fetchAll("ASSOC").length === 2)).to.be.true;
		});
		
		it('select from keytest2 table again once again once', function(){
			var q = jSQL.query("SELECT * FROM `keytest2` WHERE `greet` LIKE ?").execute(['%o%']);
			expect((q.fetchAll("ASSOC").length === 2)).to.be.true;
		});
		
		it('select from keytest2 table again once again once more', function(){
			var q = jSQL.query("SELECT * FROM `keytest2` WHERE `greet` LIKE 'p%'").execute();
			expect((q.fetchAll("ASSOC").length === 1)).to.be.true;
		});
		
		it('select from keytest2 table again once again once more', function(){
			var q = jSQL.query("SELECT * FROM `keytest2` WHERE `greet` LIKE ?").execute(['p%']);
			expect((q.fetchAll("ASSOC").length === 1)).to.be.true;
		});
		
		it('update keytest2 table', function(){
			var q = jSQL.query("update `keytest2` set `greet` = 'yyyyo' where id = 12").execute();
			expect((jSQL.tables.keytest2.data[1][2] === 'yyyyo')).to.be.true;
		});
		
		it('update keytest2 table again', function(){
			var q = jSQL.query("update`keytest2`set`greet`='waddapp',data=\"data\"where`id`=11").execute();
			expect((jSQL.tables.keytest2.data[0][2] === 'waddapp' && jSQL.tables.keytest2.data[0][1] === 'data')).to.be.true;
		});
		
		it('delete from keytest2 table', function(){
			var q = jSQL.query("delete from `keytest2` where `greet` = 'waddapp'").execute();
			expect((jSQL.tables.keytest2.data.length === 1)).to.be.true;
		});
		
		it('drop keytest2 table', function(){
			var q = jSQL.query("drop table `keytest2`").execute();
			expect((jSQL.tables.keytest2 === undefined)).to.be.true;
		});
		
		it("should create a table with a bunch of numbers", function(){
			var sql = jSQL.minify(`CREATE TABLE IF NOT EXISTS nmbrs (
				numba1 tinyint(3),
				numba2 smallint(3),
				numba3 mediumint(3),
				numba4 bigint(3)
			)`);
			
			jSQL.query(sql).execute();
			expect((jSQL.tables.nmbrs !== undefined)).to.be.true;
		});
		
		it("should insert into a table with a bunch of numbers", function(){
			jSQL.query(`insert into nmbrs values (?, ?, ?, ?)`).execute([3,3,3,3]);
			expect((jSQL.tables.nmbrs !== undefined)).to.be.true;
		});
		
		it("should select from a table with a bunch of numbers", function(){
			var r = jSQL.query(`select * from nmbrs`).execute().fetch("ARRAY");
			expect((r[0] === 3)).to.be.true;
		});
		
		
		it("should create a table with a function", function(){
			jSQL.query(`CREATE TABLE IF NOT EXISTS fff (fff)`).execute();
			expect((jSQL.tables.fff !== undefined)).to.be.true;
		});
		
		it("should insert into a table with a function", function(){
			jSQL.query(`insert into fff values (?)`).execute([function(){return "poop"}]);
			expect((jSQL.tables.fff !== undefined)).to.be.true;
		});
		
		it("should select from a table with a function", function(){
			var r = jSQL.query(`select * from fff`).execute().fetch("ARRAY");
			expect((r[0]() === "poop")).to.be.true;
		});
		
		it("should test the null and defult stuff", function(){
			var r = jSQL.query("create table popopopopo (ID int() not null auto_increment primary key, Name varchar(30) default 'bob' )").execute();
			expect(jSQL.tables.popopopopo.types[0].null === false && jSQL.tables.popopopopo.types[1].default === "bob").to.be.true;
		});
		
	});
});