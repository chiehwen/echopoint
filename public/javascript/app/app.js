define(['jquery', 'modules', 'sortable', 'page'], function($, Module, Sortable, Page) {
		
	var //entity = new Entity(12, 'chest'),
			//module = new Module(14, 'chest'),
			//sortable = new Sortable(16, 'facebookGraph');
			page = new Page();


	function loadSortables() {
		if(page.hasElement('sortable')) {
			var elements = page.getSortables(),
					sortables = Array;

			for(var i=0, l = elements.length; i < l; i++) {
				//var draggable = new Draggabilly( elements[i], {handle: page.getOptions('sortable', 'handle')} );
				
				sortables[i] = new Sortable(i, elements[i]);
				page.setSortable(new Draggabilly( elements[i], {handle: page.getOptions('sortable', 'handle')} ));
				
				console.log(sortables[i]);
				
			}

$(sortables[0].element).find('.dropdown-menu').addClass('test');
//console.log(entity)
//console.log(entity.getTest('a string to test'));
console.log(document.querySelector('.sortables'));
		}
	}

	function loadModules() {
		if(page.hasElement('module')) {
			var elements = page.getElements('module'),
					modules = Array;
			
			for(var i=0, l = elements.length; i < l; i++) {
				

				modules[i] = new Module(i, elements[i]);
						
			}

console.log(modules[3].actions);
			if(page.hasElement('sortable'))
				loadSortables();
		}
	}

	//loadSortables();
	loadModules();

});