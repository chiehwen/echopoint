$(document).ready(function() {
	$('#open-popup-menu a').on('click', function() {
		$('#popup-navigation').removeClass('hide');
		$('#user-navigation, #open-popup-menu').addClass('hide');
	})

	$('.close-navigation-menu i').on('click', function() {
		$('#popup-navigation').addClass('hide');
		$('#user-navigation, #open-popup-menu').removeClass('hide');
	})

	// bootstrap functions
	$('.dropdown-toggle').dropdown()


	$('.business-select-menu li').on('click', function() {
		var business = {
			id: $(this).find('a').attr('id'),
			name: $(this).find('span').text()
		}
		utilities = new Utils;
		utilities.httpRequest('/business/select', {id: business.id, name: business.name});
	})

});

Utils = function() {};

Utils.prototype = {
		// http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
		httpRequest: function(path, params, method) {
	    method = method || "POST"; // Set method to post by default if not specified.

	    var form = document.createElement("form");
	    form.setAttribute("method", method);
	    form.setAttribute("action", path);

	    for(var key in params) {
	    	if(params.hasOwnProperty(key)) {
	    		var hiddenField = document.createElement("input");
	    		hiddenField.setAttribute("type", "hidden");
	    		hiddenField.setAttribute("name", key);
	    		hiddenField.setAttribute("value", params[key]);

	    		form.appendChild(hiddenField);
	    	}
	    }

	    document.body.appendChild(form);
	    form.submit();		
	  }
	}