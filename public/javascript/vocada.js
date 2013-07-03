$(document).ready(function() {
	$('#open-popup-menu a').on('click', function() {
		$('#popup-navigation').removeClass('hide');
		$('#user-navigation, #open-popup-menu').addClass('hide');
	})

	$('.close-navigation-menu i').on('click', function() {
		$('#popup-navigation').addClass('hide');
		$('#user-navigation, #open-popup-menu').removeClass('hide');
	})

	$('.dropdown-toggle').on('click', function() {

		// see if we need to show the dropdown menu clicked or hide it with the others
		var showMenu = false;
		if($(this).siblings('.dropdown-menu').hasClass('hide'))
			var showMenu = true;
		
		// hide all dropdown menus
		$('.dropdown-menu').each(function() {
			$(this).addClass('hide');
		});
		
		if(showMenu)
			$(this).siblings('.dropdown-menu').removeClass('hide');
	});
});