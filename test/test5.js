var expect = require('chai').expect;
var jSQL = require("../jSQL.js");

jSQL.load(()=>{
	jSQL.query("-- Generated with jSQL Devel on Tuesday, February 6th 2018, 3:31pm \n\
	CREATE TABLE IF NOT EXISTS `testeroo` (\n\
		`id` INT(5) NOT NULL,\n\
		`name` VARCHAR(5) NULL,\n\
		`another_id` NUMERIC(6) NOT NULL,\n\
		`uni1` INT(3) NOT NULL UNIQUE KEY,\n\
		`uni2` INT(3) NOT NULL UNIQUE KEY,\n\
		PRIMARY KEY (`id`, `another_id`)\n\
	)").execute();

	var sql = "insert into testeroo values(?, ?, ?, ?, ?)";
	jSQL.query(sql).execute([0,'farts',1,5,9]);
	jSQL.query(sql).execute([1,'tird',2,6,8]);
	jSQL.query(sql).execute([1,'berb',3,7,7]);
	jSQL.query(sql).execute([5,'farts',4,1,6]);

	var exp = jSQL.export(true, ['testeroo']);

	jSQL.reset();
	
	setTimeout(()=>{
		jSQL.import(exp);

		describe('Export Test', function () {

			it('Testing Export up in this biaaatch', function(){
				var q = jSQL.query("select * from testeroo where id = 1").execute().fetchAll("ASSOC").length;
				expect(q.length === 2).to.be.true;
			});

		});
	}, 1000);
	
		
});

	

