var digistify = require("./");
var test = require('tape');

test("get all gists", function(t){
	t.plan(1);
	digistify("schacon", function(err, gists){
		t.equal(+gists[gists.length-1].id, 1);
	});
});

test("get single gist", function(t){
	t.plan(1);
	digistify.getContent("1", function(err, content){
		t.equal(content, "This is gist. \nThere are many like it, but this one is mine. \nIt is my life. \nI must master it as I must master my life. \nWithout me gist is useless. \nWithout gist, I am useless.");
	});
});
