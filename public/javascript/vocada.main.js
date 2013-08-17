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
	$('.daily-tip .header a').on('click', function() {
		$(this).parents('.daily-tip').addClass('hide');
	});

	// lets setup our draggable data boxes
	/*if($('.sortables').length !== 0) {
	 	setTimeout(function() {
		 	var packery = new Packery( document.querySelector('.sortables'), {
		    columnWidth: 480,
		    rowHeight: 495
		  });
		  var elements = packery.getItemElements();
		  // for each item element
		  for ( var i=0, l = elements.length; i < l; i++) {
		    // make element draggable with Draggabilly
		    //var drag = new Draggabilly( elements[i], {handle: '.header'});
		    // bind Draggabilly events to Packery
		    packery.bindDraggabillyEvents( new Draggabilly( elements[i], {handle: '.header'}) );
		  }
		}, 1200);
	}*/


	$('.module .toggle-display').on('click', function(e) {
		e.preventDefault();
		var dataElement = $(this).parents('.module').find('.data-content');
		if(!$(dataElement).hasClass('hide')) {
			$(dataElement).addClass('hide');
			$(this).children('span').text('show notifications')
		} else {
			$(dataElement).removeClass('hide');
			$(this).children('span').text('hide notifications')
		}
	})

	/*$('.business-select-menu li').on('click', function() {
		var business = {
			id: $(this).find('a').attr('id'),
			name: $(this).find('span').text()
		}
		utilities = new Utils;
		utilities.httpRequest('/business/select', {id: business.id, name: business.name});
	})*/

});

// App, Entity extend base Class function
Entity = function() {};

// Page, Menu, Module and Modal, Message, and Form extend Enitity 
// Sortable extends Module
// Connection  will hold Socket and Http classes

//Page = function() {};

Module = function() {};
// Analytics, Graph extend Module

Message = function() {};

// Notification, Alerts (screen popup notifications) Suggestion, Help [within modules] (maybe guides?) extend Messages

Form = function() {}
// Options (in modules) extend form




Util = function() {};

Util.prototype = {
		// http://stackoverflow.com/questions/133925/javascript-post-request-like-a-form-submit
		httpFormRequest: function(path, params, method) {
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