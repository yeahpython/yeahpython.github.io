$('video').click(function(event) {
  event.stopPropagation();
  if ($(this).get(0).paused) {
    $(this).get(0).play();
  }
  else {
    $(this).get(0).pause();
  }
});

$('video').mouseover(function(event) {
  event.stopPropagation();
  $(this).get(0).play();
});
/*
$('video').mouseout(function(event) {
  event.stopPropagation();
  $(this).get(0).pause();
});*/