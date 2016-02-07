define( ["jquery", "qlik","text!./style.css"], function ( $, qlik , cssContent ) {
	'use strict';
	var initialized = false;
	var patchesMap = {};

	function addToPatchesMap(objId, qPath, expressionIdx) {
		var patchTemplate = [qPath, expressionIdx];
		if (!patchesMap.hasOwnProperty(objId)) {
			patchesMap[objId] = [];
		}
		patchesMap[objId].push(patchTemplate);
	}

///-- Function `initialize`
	function initialize(dynamatorLayout) {
		var app = qlik.currApp();
		var expressionLink = [];
		var expressionMap = {};
		var expressionIdxMap = {};

		for (var i = 0; i < dynamatorLayout.qHyperCube.qMeasureInfo.length; i++) {
			var m = dynamatorLayout.qHyperCube.qMeasureInfo[i];
			expressionMap[m.qFallbackTitle] = [];
			expressionIdxMap[m.qFallbackTitle] = i;
		}

		$( '.qv-object' ).each( function ( i, el ) {            
	    var s = angular.element( el ).scope();
	    if ( s.$$childHead && s.$$childHead.layout ) {
        var layout = s.$$childHead.layout;
        if (layout.visualization != "Dynamator" && layout.hasOwnProperty('qHyperCube')) {
        	var lookupArray = layout.qHyperCube.qMeasureInfo;
					for (var i = 0; i < lookupArray.length; i++) {
						var expression = lookupArray[i].qFallbackTitle;
						if (expressionMap.hasOwnProperty(expression)) {
							var objId = layout.qInfo.qId;
							var qPath = "/qHyperCubeDef/qMeasures/"+i+"/qDef/qLabel";
							addToPatchesMap(objId, qPath, expressionIdxMap[expression]);
						}
					}
					lookupArray = layout.qHyperCube.qDimensionInfo;
					for (var i = 0; i < lookupArray.length; i++) {
						var expression = lookupArray[i].qFallbackTitle;
						if (expressionMap.hasOwnProperty(expression)) {
							var objId = layout.qInfo.qId;
							var qPath = "/qHyperCubeDef/qDimensions/"+i+"/qDef/qFieldLabels/0";
							addToPatchesMap(objId, qPath, expressionIdxMap[expression]);
						}
					}
	      }
	    }  
	  });
		for (var i = 0; i < dynamatorLayout.qHyperCube.qMeasureInfo.length; i++) {
			var m = dynamatorLayout.qHyperCube.qMeasureInfo[i];
			var links = [];
			if (expressionMap.hasOwnProperty(m.qFallbackTitle)) {
				links = expressionMap[m.qFallbackTitle];
			}
			expressionLink[i] = links;
		}

		initialized = true;
	} 
///-- End of function `initialize`
	

	return {
		initialProperties : {
			qHyperCubeDef : {
				qDimensions : [],
				qMeasures : [],
				qInitialDataFetch : [{
					qWidth : 50,
					qHeight : 1
				}]
			}
		},
		definition : {
			type : "items",
			component : "accordion",
			items : {
				measures : {
					uses : "measures",
					min : 1
				},
			}
		},
		snapshot : {
			canTakeSnapshot : false
		},
		paint: function ( $element, thisLayout ) {
      var self = this;
      var app = qlik.currApp(this);
      var ownId = this.options.id;   
      var html = '';

			// $element.html( "<button id='dynamator-button'>Test</button>" );
			// var btn = $element.find("#dynamator-button");
			// btn.on('click', test);
			
			if (!initialized) {
				initialize(thisLayout);
			}
			var expressionRow = thisLayout.qHyperCube.qDataPages[0].qMatrix[0];
			for (var id in patchesMap) {
					(function(id){
						if (patchesMap.hasOwnProperty(id)) {
							app.getObject(id).then(function(object) {
								var resolvedPatches = patchesMap[id].map(function(obj){ 
								   var rObj = {};
								   rObj["qPath"] = obj[0];
								   rObj["qOp"] = "replace";
								   rObj["qValue"] = '"' + expressionRow[obj[1]].qText +'"';
								   return rObj;
								});
						    object.applyPatches(resolvedPatches, true);
				      });
						}
					})(id);
			}
		}
	};
});
