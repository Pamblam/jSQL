
function secondsToString(seconds){
	var nummons = Math.floor(seconds / 2592000);
	if(nummons > 1) return "about "+ nummons + " months";
	var numdays = Math.floor(seconds / 86400);
	if(numdays > 1) return "about "+ numdays + " days";
	var numhours = Math.floor((seconds % 86400) / 3600);
	if(numhours > 1) return "about "+numhours + " hours";
	var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);
	if(numminutes > 1) return "about "+numminutes + " minutes";
	return "a few seconds";
}

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: true,
  smartypants: false
});

var gh = new GithubAPI("Pamblam");
gh.getCommits("jSQL", function(commits){
	var now = new Date();
	var then = new Date(commits[0].commit.committer.date)
	var lastUpdate = secondsToString((now.getTime()-then.getTime())/1000);
	$("#lastud").text(lastUpdate);
	var shown = [];
	for(var i=0; i<commits.length; i++){
		if(shown.indexOf(commits[i].commit.message) > -1) continue;
		shown.push(commits[i].commit.message);
		then = new Date(commits[i].commit.committer.date)
		lastUpdate = secondsToString((now.getTime()-then.getTime())/1000);
		$("#updates").append("<li><b>"+lastUpdate+" ago</b> - "+commits[i].commit.message+"</li>");
	}
});