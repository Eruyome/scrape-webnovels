jQuery( document ).ready(function() {	
	var p = jQuery( "#container" ).find( "p" );
	jQuery(p).each(function( index ) {
		var text = jQuery( this ).text().trim();
		if (text == "&nbsp;" || text.length <= 0) {
			jQuery(this).remove();
		}
		var re = new RegExp(/(Translator:|Editor:)/gi);
		if (re.test(text)) {
		    jQuery(this).remove();
		}

		var re = new RegExp(/Chapter \d+\s?(:|-)/);
		if (re.test(text)) {
			jQuery(this).remove();
		}

		var st = jQuery(this).find( "strong" );
		var thisP = jQuery(this);
		jQuery(st).each(function( index ) {
			var re = new RegExp(/(Translator:|Editor:|(thanks)? to the proofreading team)/gi);
			if (re.test(text)) {
			    jQuery(thisP).remove();
			}
		});
	});

	// combine chapter title with second header in case they are split up
	var h = jQuery( "#chr-content" ).children().first();
	console.log(h)
	try {
		if( h[0].nodeName.toLowerCase() === 'h3' || h[0].nodeName.toLowerCase() === 'h2' ) {
		    console.log("yeah")
		    var chrTitle = jQuery( ".chr-title > .chr-text" );
			var chrTitleText = jQuery(chrTitle).text();
			var headerText = jQuery(h).text();
		    jQuery(chrTitle).text(chrTitleText + ' - ' + headerText)
		    jQuery(h).css("display", "none");
		}	
	} catch (e) {}	

	/*
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
	*/
});