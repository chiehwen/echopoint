Vocada
  .filter('timeframe', function() {
    return function(time, currentTimeframe) {


//if(time != currentTimeframe)
//  return time;
//return ['20 days', 'no days']
if(typeof time !== 'undefined') {
  var filteredTimeframes = [];
  for (var i = 0, l=time.length; i < l; i++) {
    if(time[i] != currentTimeframe)
      filteredTimeframes.push(time[i])
  }
  return filteredTimeframes;
}
     /* var out = "";
      for (var i = 0; i < input.length; i++) {
        out = input.charAt(i) + out;
      }
      // conditional based on optional argument
      if (uppercase) {
        out = out.toUpperCase();
      }
      return out;*/
    }
  });