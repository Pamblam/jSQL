
$(".footer").css({marginTop:0});
var vh = $(window).height();
var nbht = $(".navbar-fixed-top").outerHeight();
var nbht = $(".footer").outerHeight();

$(".container").height(vh-(nbht+nbht));

jSQL.devel.open({wrapper: ".container", header_img: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Transparent.gif"});