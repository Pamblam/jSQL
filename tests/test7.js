/**
 * This script tests the parser
 * @type Module jSQL|Module jSQL
 */

var jSQL = require("../jSQL.js");

jSQL.onError((e)=>{
	console.log("ERROR!!! ",e.message);
});

jSQL.load(function(){

	var tests = [
		
		// CREATE tests
		{	sql: "create table wtf_test (id, name, `somekey` varchar(), something enum('hello','goodbye'), primary key(`id`, name), unique key (somekey) )",
			tests: [() => { return true; }]},
		{	sql: "create table typetest (id numeric(3), data json, greet function, active boolean, `number` int(3), code char(4), name varchar(4), created date, anything ambi, something enum('hello','goodbye') )",
			tests: [
				() => { return jSQL.tables.typetest.types[9].args[0] === 'hello' && jSQL.tables.typetest.types[9].args[1] === 'goodbye' },
				() => { return jSQL.tables.typetest.colmap.number === 4 }
			]},
		{	sql: "create table keytest (id int auto_increment primary key, data, greet, active, `number`, code, name varchar, created date, anything ambi, something enum('hello','goodbye') )",
			tests: [
				() => { return jSQL.tables.keytest.keys.primary.column === 'id' && jSQL.tables.keytest.auto_inc_col === 'id' }
			]},
		{	sql: "create table keytest2 (id int auto_increment, data, greet, active, `number`, code, name varchar, created date, anything ambi, something enum('hello','goodbye'), primary key(`id`, name) )",
			tests: [
				() => { return jSQL.tables.keytest2.keys.primary.column[0] === 'id' && jSQL.tables.keytest2.keys.primary.column[1] === 'name' && jSQL.tables.keytest2.auto_inc_col === 'id' }
			]},
		{	sql: "create table `smalltest` (id int, str varchar)",
			tests: [() => { return !!jSQL.tables.smalltest; }]},
		// INSERT tests
		{	sql: "insert into smalltest (id, str) values (7, 'testing')",
			tests: [() => { return jSQL.tables.smalltest.data.length === 1 }]},
		{	sql: "insert into `smalltest` values (11, 'testing again')",
			tests: [() => { return jSQL.tables.smalltest.data.length === 2 }]},
		{	sql: "insert into `typetest` values (11, '{\"greeting\":\"hello\"}', 'function(){console.log(\"hello world\")}', true, 3, '72', 'rob', 'Mon, 25 Dec 1995 13:30:00 +0430', 'scooby doo', \"hello\")",
			tests: [() => { return jSQL.tables.typetest.data.length === 1 }]},
		{	sql: "insert into `keytest2` (id, `greet`) values (11, 'holla')",
			tests: [() => { return jSQL.tables.keytest2.data[0][0] === 11 }]},
		{	sql: "insert into `keytest2` (`greet`) values ('poopums')",
			tests: [() => { return jSQL.tables.keytest2.data[1][0] === 12 }]},
		// SELECT tests
		{	sql: "select * from `typetest`",
			tests: [
				(q) => { 
					let res = q.fetchAll("ARRAY");
					return res[0][7] instanceof Date && "function" === typeof res[0][2];
				}
			]},
		{	sql: "SELECT id, greet FROM `keytest2` WHERE `id` > 11",
			tests: [(q) => { return q.fetch("ASSOC").greet === "poopums"; }]},
		{	sql: "SELECT id, greet FROM `keytest2` WHERE `id` < 12",
			tests: [(q) => { return q.fetch("ASSOC").greet === "holla"; }] },
		{	sql: "SELECT * FROM `keytest2` WHERE `id` < 12 and greet = 'holla'",
			tests: [(q) => { return q.fetch("ASSOC").greet === "holla"; }] },
		{	sql: "SELECT * FROM `keytest2` WHERE `id` < 12 and greet = 'holla' and greet <> \"poo\" or id = 11",
			tests: [(q) => { return q.fetch("ASSOC").greet === "holla"; }] },
		{	sql: "SELECT * FROM `keytest2` WHERE `greet` LIKE '%olla'",
			tests: [(q) => { return q.fetch("ASSOC").greet === "holla"; }] },
		{	sql: "SELECT * FROM `keytest2` WHERE `greet` LIKE '%o%'",
			tests: [(q) => { return q.fetchAll("ASSOC").length === 2; }] },
		{	sql: "SELECT * FROM `keytest2` WHERE `greet` LIKE 'p%'",
			tests: [(q) => { return q.fetchAll("ASSOC").length === 1; }] },
		
		// UPDATE tests
		{	sql: "update `keytest2` set `greet` = 'yyyyo' where id = 12",
			tests: [() => { return jSQL.tables.keytest2.data[1][2] === 'yyyyo' }] },
		{	sql: "update`keytest2`set`greet`='waddapp',data=\"data\"where`id`=11",
			tests: [() => { return jSQL.tables.keytest2.data[0][2] === 'waddapp' && jSQL.tables.keytest2.data[0][1] === 'data' }] },
		
		// DELETE tests
		{	sql: "delete from `keytest2` where `greet` = 'waddapp'",
			tests: [() => { return jSQL.tables.keytest2.data.length === 1 }] },
		
		// DROP TABLE tests
		{	sql: "drop table `keytest2`",
			tests: [() => { return jSQL.tables.keytest2 === undefined }] },
	];
	
	for(let i=0; i<tests.length; i++){
		let test = tests[i];
		let r = jSQL.query(test.sql).execute();
		for(let n=0; n<tests[i].tests.length; n++){
			let res = tests[i].tests[n](r);
			if(!res) console.log("\nTest "+i+"."+n+" failed...");
			else console.log("\nTest "+i+"."+n+" PASSED");
		}
	}
	
	console.log("\n\nsuccess");
});