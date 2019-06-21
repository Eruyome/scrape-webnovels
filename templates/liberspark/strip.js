$( document ).ready(function() {
    var p = $( "body" ).find( "p" );
	$(p).each(function( index ) {
		var text = $( this ).text().trim();
		if (text == "&nbsp;" || text.length <= 0) {
			$(this).remove()
		}
	});

	var chapter = $( "body" ).find( "#reader-chapter" ).text();
	var title = $( "body" ).find( "#reader-title" ).text();
	$( "body" ).find( "#reader-title" ).text(chapter + ": " + title)
});