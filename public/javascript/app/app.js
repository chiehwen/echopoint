define(['jquery', 'modules', 'sortable', 'page'], function($, Module, Sortable, Page) {
		
	var //entity = new Entity(12, 'chest'),
			//module = new Module(14, 'chest'),
			//sortable = new Sortable(16, 'facebookGraph');
			page = new Page();


	if(page.hasSortables()) {
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

}

});