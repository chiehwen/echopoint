/**
 * Api's Controller
 */

var crypto = require('crypto'),
		oauth = require('oauth'),
		url = require('url'),
		Auth = require('../server/auth').getInstance(),
		Helper = require('../server/helpers'),
		Model = Model || Object,
		googleapis = require('googleapis');

var ApiController = (function() {
	// Private attribute that holds the single instance
	var apiInstance;

	function constructor() {

		var initialAnalytics = {
			facebook: function(data, callback) {
				Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {
					var facebook = Auth.load('facebook').setAccessToken(data.network_auth_token);

					Analytics.facebook.updates = {
						timestamp: Helper.timestamp(),
						changes: data.business_information
					}

					facebook.get(data.network_id, {fields: 'insights'}, function(err, res) {

						var insights = res.insights.data,
								initialFilteredResults = {};
					
						for(var i=0, l=insights.length;i<l;i++) {
						
							if(insights[i].period != 'day' && i != l-1)
								continue;

							var resultValues = [];
							for(var y=0,len=insights[i].values.length;y<len;y++) {
								resultValues.push({
									count: insights[i].values[y].value,
									end_time: insights[i].values[y].end_time
								})
							}

							initialFilteredResults[insights[i].name] = {
								timestamp: Helper.timestamp(),
								data: resultValues
							}
						}

						Analytics.facebook.insights = initialFilteredResults;
						Analytics.save(function(err,response){
							console.log(initialFilteredResults);
							console.log(data.business_information);
							callback(null);
						});
						
					})

				});
			}
		}

		return {
			loadInitialData: function(data, callback) {
				return initialAnalytics[data.network](data, callback);
			}
		}
	} // end constructor

	return {
		getInstance: function() {
			if(!apiInstance)
				apiInstance = constructor();
			return apiInstance;
		}
	}
})();

module.exports = ApiController;