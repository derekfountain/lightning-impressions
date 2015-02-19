(function() {
  
  // IE8  - not supported because jQuery 2.x needs IE9
  // IE9  - Unable to test
  // IE10 - Unable to test
  // IE11 - Tested on Win7 and Win8.1

  var REQUIRED_JQUERY_VERSION   = "2.1.3";
  var REQUIRED_JQUERYUI_VERSION = "1.11.3";
  var REQUIRED_KNOCKOUT_VERSION = "3.3.0";

  // Localise jQuery variable for this "namespace"
  //
  var jQuery = null;

  // Utility function to create a new <script> element. This
  // creates the element and sets the 'src' attribute to the
  // srcPath given. It arranges for the given handler function
  // to be run when the element is ready.
  //
  // Answers the newly created script element, or null if it
  // failed.
  //
  // Note that this doesn't put the element in the DOM, which
  // means the caller will need to do that if the handler is
  // ever to be called.
  //
  function scriptLoaderElement( srcPath, handlerFunc )
  {
    var scriptTag = document.createElement('script');
    if( !scriptTag )
      return null;

    scriptTag.setAttribute("type","text/javascript");
    scriptTag.setAttribute("src", srcPath);

    // Set up a handler which jumps off to the next part of the chain
    // when the new element is ready
    //
    if(scriptTag.readyState) {

      // This is for old versions of IE. The rest of the world uses
      // the onload handler these days
      //
      scriptTag.onreadystatechange = function () {
	if (this.readyState == 'complete' || this.readyState == 'loaded') {
	  handlerFunc();
	}
      };

    } else {

      // This is the path for modern browsers
      //
      scriptTag.onload = handlerFunc;
    }

    return scriptTag;
  }



  // STAGE 1 - Load jQuery
  //
  // If the page already has the correct version of jQuery loaded I can use that.
  // Otherwise I have to load my own.
  //
  if( window.jQuery === undefined || window.jQuery.fn.jquery !== REQUIRED_JQUERY_VERSION ) {

    // Create a new script element, which sources the correct jQuery library
    //
    var scriptTag = scriptLoaderElement("http://code.jquery.com/jquery-"+REQUIRED_JQUERY_VERSION+".min.js",
					scriptLoadHandlerUI);

    // Where to put the new element? Try to find the head, otherwise default
    // to the documentElement. The handler, set above, will fire when the
    // script element has loaded the remote script
    //
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(scriptTag);

  } else {

    // Just use the jQuery that's already on the page
    //
    jQuery = window.jQuery;
    scriptLoadHandlerUI();
  }



  // STAGE 2 - Load jQueryUI.
  //
  // This function is called as a callback handler when the jQuery library
  // has been correctly fetched and loaded into the DOM.
  //
  function scriptLoadHandlerUI() {

    if( window.jQuery.ui === undefined || window.jQuery.ui.version === undefined || window.jQuery.ui.version !== REQUIRED_JQUERYUI_VERSION ) {

      // Same approach as above: create a new script element, only this time
      // source the jQuery UI code. My local jQuery variable is still
      // referencing the just-loaded jQuery library, so this jQuery UI
      // uses the correct base.
      //
      var scriptTag = scriptLoaderElement("http://code.jquery.com/ui/"+REQUIRED_JQUERYUI_VERSION+"/jquery-ui.min.js",
					  scriptLoadHandlerKnockoutJS);

      (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(scriptTag);

    } else {

      // jQuery UI is also already in the page
      //
      scriptLoadHandlerKnockoutJS();
    }

  }



  // STAGE 3 - Load KnockoutJS
  //
  function scriptLoadHandlerKnockoutJS() {

    // Same approach as above, just turn the handle once more.
    //
    var scriptTag = scriptLoaderElement("http://knockoutjs.com/downloads/knockout-"+REQUIRED_KNOCKOUT_VERSION+".js",
					main);

    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(scriptTag);
  }



  // STAGE 4 - Implement the jQuery code my application needs.
  //
  // This function is called as a callback handler when the jQuery UI library
  // has all been correctly fetched and loaded into the DOM. jQuery and jQueryUI
  // are ready to use, but when this "namespace" function exits they will
  // be lost. So get all handlers and callbacks set up now.
  //
  function main() { 
    console.log("jQuery version "+window.jQuery.fn.jquery+" loaded");
    console.log("jQuery UI version "+window.jQuery.ui.version+" loaded");

    // Restore the original page's jQuery library, capturing my version
    // under the local jQuery variable. This code must always use that
    // jQuery entry point, otherwise the original jQuery will be used
    // (and I've no idea what that is, or even if there is one).
    // If the page already contained a usable jQuery the value is
    // already set and this isn't necessary.
    //
    if( !jQuery ) {
      jQuery = window.jQuery.noConflict(true);
    }
    
    // OK, wait for the document to finish loading, then load the LI
    // widget HTML snippets and wire up the calls and handlers.
    //
    jQuery(document).ready(function($) { 

      // There must be at least one element with a class of li-widget-loader.
      // A widget will be placed at each occurance.
      //
      var widgetLoaders = jQuery(".li-widget-loader");

      // No loader class elements? This means the page isn't set up properly.
      //
      if( widgetLoaders.length == 0 ) {
        console.log("No 'li-widget-loader' element found");
        return;
      }

      // Loop over the widget loaders. There might be several per page.
      //
      widgetLoaders.each( function(index) {
        var accountNumber   = jQuery(this).attr("li-account");
        var widgetReference = jQuery(this).attr("li-widgetref");

        // console.log("Acc "+accountNumber+" - "+widgetReference);

	// If the HTML doesn't have the valid attributes, skip this one.
	// Inside a jQuery.each() loop "return true" does a "continue".
	//
	if( !accountNumber || !widgetReference ) {
	  return true;
	}

	// Use jQuery to load the HTML which builds the widget. The rest of
	// the code in this loop runs when, and only when, that HTML is
	// loaded into the DOM.
	//
        jQuery(this).
          load("http://api.lightningimpressions.com:8080/service/byname/rest/account/byid/"+accountNumber+"/widget/byreference/"+widgetReference+"/content/bytype/html",
	        null,
	        function(responseText, textStatus, jqXHR) {

		  // console.log("Loaded widget HTML for "+widgetReference);

	          // I can't put a reference to my jQuery library in the embedded
		  // scripts in the HTML because the library isn't visible there.
		  // It's local to this code, which is the point of doing it - I
		  // don't pollute the global namespace with my version of jQuery.
		  // The solution is to look for a hook function. If it's there
		  // call it with this version of jQuery as an argument. It can
		  // then use it to do what it needs to.
		  //
		  if( liPreConfigureHook ) {
		    liPreConfigureHook( jQuery, accountNumber, widgetReference );
		  }

		  // Set up the widget's dialog to slide in and out
		  //
		  jQuery("#"+widgetReference+"-li-dialog").
		    dialog({ 
		      autoOpen : false, 
		      draggable : false, 
	              resizable: false, 
	              width: 400, 
	              closeOnEscape: true, 
	              show : { 
		        effect : "slide", 
		        duration : 250, 
		        direction: "up" 
	              }, 
	              hide : { 
		        effect : "slide", 
		        duration : 200, 
		        direction: "up" 
	              }, 
	              position : { 
		        my: "center top", at: "center bottom", of: jQuery("#"+widgetReference+"-li-opener") 
	              }, 
	            }); 
     
		  // Set up the click handler on the widget opener element.
		  // This just triggers the dialog to open or close.
		  //
		  jQuery("#"+widgetReference+"-li-opener").click(
                    function() { 
	              if ( ! jQuery("#"+widgetReference+"-li-dialog").dialog( "isOpen" ) ) { 
		        jQuery("#"+widgetReference+"-li-dialog").dialog("open"); 
	              } else { 
		        jQuery("#"+widgetReference+"-li-dialog").dialog("close"); 
	              } 
	            }); 
     
		  // Set up the handler for the dialog contents changing.
		  // This changes the message in the dialog to thanks,
		  // sets a timer so it closes, and reports what was
		  // clicked on back to the server.
		  //
		  jQuery(".li-input").change(
	            function() { 
	              if ( jQuery("#"+widgetReference+"-li-dialog").dialog( "isOpen" ) ) { 
			jQuery("#"+widgetReference+"-li-dialog-questions").hide(); 
			jQuery("#"+widgetReference+"-li-dialog-thanks").show(); 
			setTimeout( function() { jQuery("#"+widgetReference+"-li-dialog").dialog("close"); }, 500 ); 
			setTimeout( function() { jQuery("#"+widgetReference+"-li-dialog-thanks").hide(); jQuery("#"+widgetReference+"-li-dialog-questions").show(); }, 800 ); 
 
			jQuery.post( "http://api.lightningimpressions.com:8080/service/byname/rest/", 
				     "selected="+jQuery('input[name=li-choice]:checked', '#li-'+widgetReference+'-form').attr("id")
				     ); 
		      } 
		    }); 
	 

	        }); // End widget HTML loader response function definition

      }); // End loop over widget loaders

    }); // End document ready code definition

  } // End main()

})(); // End anonymous "namespace" wrapper function, which is called immediately
