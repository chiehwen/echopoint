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
	$('.dropdown-toggle').dropdown();

	// Remove daily tip
	$('.daily-tip i.icon-remove-sign').on('click', function() {
		$(this).parents('.daily-tip').addClass('hide');
	});

	// lets setup our draggable data boxes
	var container = document.querySelector('.data-wrapper');
  var pckry = new Packery( container, {
    columnWidth: 480,
    rowHeight: 100
  });
  var itemElems = pckry.getItemElements();
  // for each item element
  for ( var i=0, l = itemElems.length; i < l; i++) {
    var elem = itemElems[i];
    // make element draggable with Draggabilly
    var drag = new Draggabilly( elem, {handle: '.header'});
    // bind Draggabilly events to Packery
    pckry.bindDraggabillyEvents( drag );
  }

	/*$('.business-select-menu li').on('click', function() {
		var business = {
			id: $(this).find('a').attr('id'),
			name: $(this).find('span').text()
		}
		utilities = new Utils;
		utilities.httpRequest('/business/select', {id: business.id, name: business.name});
	})*/

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