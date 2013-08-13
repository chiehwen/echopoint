			$(function () {
				$('#wall-posts-chart').highcharts({
				chart: {
					type: 'column'
				},
				title: {
					text: '',
				},
				credits: {
					enabled: false
				},
				colors: [
					'#546f8e',
					'#546f8e',
					'#546f8e',
					'#546f8e',
					'#546f8e',
					'#546f8e',
					'#546f8e',
					'#546f8e',
					'#546f8e'
				],
				xAxis: {
					tickinterval: 1,
					labels: {
						enabled: false
					},
					lineColor: '#D3D3D3',
					lineWidth: 1,
					minPadding: 0
				},
				yAxis: {
					title: {
						text: null
					},
					stackLabels: {
						enabled: false
					},
					lineColor: '#D3D3D3',
					lineWidth: 1,
					minPadding: 0
					//plotLines: [{
					//	value: 0,
					//	width: 1,
					//	color: '#808080'
					//}]
				},
				plotOptions: {
					area: {
						fillColor: '#546f8e',
						marker: {
							enabled: false
						}
					},
					series: {
						groupPadding: 0,
						pointPadding: 0,
						shadow: false
					}
				},
				tooltip: {
					valueSuffix: '°C'
				},
				legend: {
					enabled: false
				},
				series: [{
						name: 'Tokyo',
						data: [1, 0, 0, 2, 1, 0, 3, 2, 2, 0, 1, 1, 2, 4, 3 ]
					}]
			});

			$('#page-likes-chart').highcharts({
				chart: {
					type: 'area'
				},
				title: {
					text: '',
				},
				credits: {
					enabled: false
				},
				colors: [
					'#555555',
					'#555555',
					'#555555',
					'#555555',
					'#555555',
					'#555555',
					'#555555',
					'#555555',
					'#555555'
				],
				xAxis: {
					tickinterval: 1,
					labels: {
						enabled: false
					},
					lineColor: '#D3D3D3',
					lineWidth: 1,
					minPadding: 0
				},
				yAxis: {
					title: {
						text: null
					},
					stackLabels: {
						enabled: false
					},
					lineColor: '#D3D3D3',
					lineWidth: 1,
					minPadding: 0
					//plotLines: [{
					//	value: 0,
					//	width: 1,
					//	color: '#808080'
					//}]
				},
				plotOptions: {
					area: {
						fillColor: '#546f8e',
						marker: {
							enabled: false
						}
					},
					series: {
						shadow: false
					}
				},
				tooltip: {
					valueSuffix: '°C'
				},
				legend: {
					enabled: false
				},
				series: [{
						name: 'Tokyo',
						data: [1, 7, 10, 17, 20, 23, 27, 32, 40, 42, 52, 54, 66] //[3001, 3007, 3010, 3017, 3020, 3023, 3027, 3032, 3040, 3042, 3052, 3054, 3066]
					}]
			});
		});