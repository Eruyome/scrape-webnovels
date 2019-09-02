jQuery( document ).ready(function() {
	var p = jQuery( "#container" ).find( "p" );
	jQuery(p).each(function( index ) {
		var text = jQuery( this ).text().trim();
		if (text == "&nbsp;" || text.length <= 0) {
			jQuery(this).remove();
		}
		if (text.indexOf("Translator:") > -1 || text.indexOf("Editor:") > -1) {
			jQuery(this).remove();
		}

		var re = new RegExp(/Chapter \d+\s?(:|-)/);
		if (re.test(text)) {
			jQuery(this).remove();
		}

		var st = jQuery(this).find( "strong" );
		var thisP = jQuery(this);
		jQuery(st).each(function( index ) {
			var text = jQuery(this).text().trim();
			if (text.indexOf("Translator:") > -1 || text.indexOf("Editor:") > -1) {
				jQuery(thisP).remove();
			}
		});
	});

	var d = jQuery( "#container" ).find("div");
	jQuery(d).each(function( index ) {
		var text = jQuery( this )
		    .clone()    //clone the element
		    .children() //select all the children
		    .remove()   //remove all the children
		    .end()  //again go back to selected element
		    .text();
		var re = new RegExp(/< report chapter >/);
		if (re.test(text)) {
			console.log(this)
		    jQuery(this).remove();
		}
	});
});