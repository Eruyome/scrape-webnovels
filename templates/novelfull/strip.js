jQuery( document ).ready(function() {
	var p = jQuery( "body" ).find( "p" );
	jQuery(p).each(function( index ) {
		var text = jQuery( this ).text().trim();
		if (text == "&nbsp;" || text.length <= 0) {
			jQuery(this).remove()
		} 

		var st = jQuery(this).find( "strong" );
		var thisP = jQuery(this);
		jQuery(st).each(function( index ) {
			var text = jQuery(this).text().trim();
			if (text.indexOf("Translator:") > -1 || text.indexOf("Editor:") > -1) {
				jQuery(thisP).remove()
			}
		});
	});
});