/**
 * Api's Controller
 */

var crypto = require('crypto'),
		oauth = require('oauth'),
		url = require('url'),
		Auth = require('./auth').getInstance(),
		Helper = require('./helpers'),
		Model = Model || Object,
		googleapis = require('googleapis'),

		Facebook = require('./harvesters/facebook');

var ApiController = (function() {
	// Private attribute that holds the single instance
	var apiInstance;

	function constructor() {

		var data = {
			facebook: {
				initial: function(data, callback) {
					Model.Analytics.findOne({id: data.analytics_id}, function(err, Analytics) {
						var facebook = Auth.load('facebook').setAccessToken(data.network_auth_token);

						Analytics.facebook.business = {
							timestamp: Helper.timestamp(),
							changes: data.business_information
						}

						facebook.get(data.network_id, {fields: 'insights', date_format: 'U'}, function(err, res) {

							var insights = res.insights.data,
									initialFilteredResults = {};
				
							for(var i=0,l=insights.length;i<l;i++) {
							
								if(insights[i].period != 'day')
									continue;

								var resultValues = [];

								for(var y=0,len=insights[i].values.length;y<len;y++) {
									resultValues.push({
										// facebook puts "." in key values of JSON which Mongo will not except
										value: JSON.parse(JSON.stringify(insights[i].values[y].value, function(key, value) {return key.toString().replace('.', '_', 'g')})),
										end_time: insights[i].values[y].end_time
									})
								}

								initialFilteredResults[insights[i].name] = {
									timestamp: Helper.timestamp(),
									data: resultValues
								}
							}

							Analytics.facebook.tracking.page.insights = initialFilteredResults;
							Analytics.save(function(err,response){
								console.log(err);
								console.log(response);
								console.log(initialFilteredResults);
								//console.log(data.business_information);
								callback(null);
							});
							
						})
					});
				}
			}
		}

		return {
			getData: function(data, callback) {
				return data[data.network][data.method](data, callback);
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