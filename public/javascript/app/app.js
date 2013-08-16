define(['jquery', 'modules', 'sortable'], function($, Module, Sortable) {
		
	var //entity = new Entity(12, 'chest'),
			module = new Module(14, 'chest'),
			sortable = new Sortable(16, 'facebookGraph');

	console.log(sortable);
	console.log(sortable.getTest('hi imma test'));

	//console.log(entity)
	//console.log(entity.getTest('a string to test'));
});