document.getElementsByTagName("BODY")[0].style.padding = 0;

jQuery( document ).ready(function() {
    jQuery( "body" ).css("padding-top", 0);

    var cb = jQuery( "body" ).find( ".code-block" );
	jQuery(cb).each(function( index ) {		
		jQuery(this).remove()
	});

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

	var fn = jQuery( "body" ).find( "sup.footnote" );
	jQuery(fn).each(function( index ) {
		var fna = jQuery(this).find("a");
		var t = jQuery(fna).text();
		jQuery(this).text(t);
	});

	jQuery("div#textbox").remove();	
});