﻿$(function () {
	var  IsVisibleMenu = false, elem, contextGrad, gradient, gradSelectPosTop = 1, colorSelecterClick, newColorSelected={r:255,g:0,b:0},lastColorSelected={r:255,g:0,b:0};
	var autoFilterObj;
	var g_sheetViewSettings = null;
	var colorDefault = new asc_CColor(0, 0, 0);
	
	var docTitle = window.location.toString().match(/&title=([^&]+)&/);
	if (docTitle) {
		$("#titleSP").append('<span>' + window.decodeURI(docTitle[1]) + '</span>');
	}

	//--Bottom panel--

	// init tab navigation
	$("#ws-navigation .nav-buttons .btn").click(onTabNavigationBtnClicked);
	// init scaling buttons
	$("#ws-navigation .ws-zoom-button").click(onZoomBtnClicked);

	function parseColor(color) {
		var reColor = /^\s*(?:#?([0-9a-f]{6})|#?([0-9a-f]{3})|rgba?\s*\(\s*((?:\d*\.?\d+)(?:\s*,\s*(?:\d*\.?\d+)){2,3})\s*\))\s*$/i;
		var x, type, r, g, b;

		var m = reColor.exec(color);
		if (!m) {return null;}

		if (m[1]) {
			x = [ m[1].slice(0, 2), m[1].slice(2, 4), m[1].slice(4) ];
			type = 1;
		} else if (m[2]) {
			x = [ m[2].slice(0, 1), m[2].slice(1, 2), m[2].slice(2) ];
			type = 0;
		} else {
			x = m[3].split(/\s*,\s*/i);
			type = x.length === 3 ? 2 : 3;
		}

		r = parseInt(type !== 0 ? x[0] : x[0] + x[0], type < 2 ? 16 : 10);
		g = parseInt(type !== 0 ? x[1] : x[1] + x[1], type < 2 ? 16 : 10);
		b = parseInt(type !== 0 ? x[2] : x[2] + x[2], type < 2 ? 16 : 10);
		return {r: r, g: g, b: b};
	}
	
	function renderTabs() {
		var r = $(),
				l = api.asc_getWorksheetsCount(),
				isFirst = true,
				hiddenSheets = api.asc_getHiddenWorksheets();
		var isHidden = function (index) {
			for (var i = 0; i < hiddenSheets.length; ++i) {
				if (index == hiddenSheets[i].index) {
					return true;
				}
				else if (index < hiddenSheets[i].index)
					break;
			}
			return false;
		};
		for (var i = 0; i < l; ++i) {
			if (isHidden (i))
				continue;
			var li = $(
					'<li' + (isFirst ? ' class="first"' : '') + '>' +
					'<div class="tab-prefix"/>' +
					'<div class="tab-name">' + api.asc_getWorksheetName(i) + '</div>' +
					'<div class="tab-suffix"/>' +
				'</li>')
				.data("ws-index", i)
				.on("click", function () {onTabClicked( $(this).data("ws-index") );});
			r = r.add(li);
			isFirst = false;
		}
		return r;
	}

	function onSheetsChanged() {
		$("#ws-navigation .tabs")
			.empty()
			.append(renderTabs());
		onTabClicked( api.asc_getActiveWorksheetIndex() );
	}

	function onActiveSheetChanged () {
		updateSheetViewSettings();
	}

	function showZoomValue() {
		$("#ws-navigation .ws-zoom-input")
				.val(Math.round(api.asc_getZoom() * 100) + "%");
	}

	//--Event handlers--

	function onError(id,level){
		consolelog("id "+ id + " level " + level);
		switch(arguments[0]){
			case c_oAscError.ID.FrmlWrongCountParentheses:
				// alert("неверное количество скобок");
				if(console&&console.error)
					console.error("!!! "+"неверное количество скобок");
				break;
			case c_oAscError.ID.FrmlWrongOperator:
				// alert("неверный оператор");
				if(console&&console.error)
					console.error("!!! "+"неверный оператор");
				break;
			case c_oAscError.ID.FrmlWrongMaxArgument:
				// alert("превышено максимальное число аргументов");
				if(console&&console.error)
					console.error("!!! "+"превышено максимальное число аргументов");
				break;
			case c_oAscError.ID.FrmlWrongCountArgument:
				// alert("неверное количество аргументов");
				if(console&&console.error)
					console.error("!!! "+"неверное количество аргументов");
				break;
			case c_oAscError.ID.FrmlWrongFunctionName:
				// alert("неверное название функции");
				if(console&&console.error)
					console.error("!!! "+"неверное название функции");
				break;
			case c_oAscError.ID.FrmlAnotherParsingError:
				// alert("прочие ошибки анализа");
				if(console&&console.error)
					console.error("!!! "+"прочие ошибки анализа");
				break;
			case c_oAscError.ID.FrmlWrongArgumentRange:
				// alert("неверный диапазон");
				if(console&&console.error)
					console.error("!!! "+"неверный диапазон");
				break;
		}
	}

	function onStartAction() {
		consolelog("onStartAction " + arguments[0] + " " + arguments[1]);
	}
	
	function onSetAFDialog(autoFilterObject) {
		var oAutoFilterElements = $("#AutoFilterElements");
		oAutoFilterElements.empty();
		autoFilterObj = autoFilterObject;
		var top = autoFilterObject.asc_getY();
		var left = autoFilterObject.asc_getX();
		var width = autoFilterObject.asc_getWidth();
		var height = autoFilterObject.asc_getHeight();
		var cellId = autoFilterObject.asc_getCellId();
		var elements = autoFilterObject.asc_getResult();
		
		var oSelected = " SelectedAutoFilterItem";
		var unSelected = " NoSelectedAutoFilterItem";

		var element = '1'; 		
		if (0 == elements.length)
			oAutoFilterElements.append("<div class='AutoFilterItem" + unSelected + "'>" + '(Empty)' + "</div>");	
		else
		{
			var isSelect = true;
			for(i = 0; i < elements.length; i++)
			{
				var element = elements[i].val;
				if(element == '')
					element = 'empty';
				var isSelected = oSelected;
				var styleNone = '';
				if(!elements[i].visible)
					isSelected = unSelected
				if(elements[i].visible == 'hidden')
					styleNone = ' hidden'
				/*else if(elements[i].rep)
					styleNone = ' hidden2'*/
				if(elements[i].visible == false || elements[i].visible == undefined)
					isSelect = false;
				oAutoFilterElements.append("<div class='AutoFilterItem" + isSelected + styleNone + "'>" + element + "</div>");
			}
			if(!isSelect)
				$('#selectAllElements').removeClass('SelectedAutoFilterItem');
			else
				$('#selectAllElements').addClass('SelectedAutoFilterItem');
		}
		if(elements.dF)
			$('#numericalFilter').addClass('SelectedAutoFilterItem');
		else
			$('#numericalFilter').removeClass('SelectedAutoFilterItem');
		
		$('#MenuAutoFilter').css('top',top + height+ parseFloat($('#wb-widget').css('top')));
		$('#MenuAutoFilter').css('left',left + parseFloat($('#wb-widget').css('left')));
		$('#MenuAutoFilter').attr('idcolumn',cellId)
		
		$('#MenuAutoFilter').show();
		$(".AutoFilterItem").bind("click", function(){if ($(this).hasClass('SelectedAutoFilterItem'))$(this).removeClass('SelectedAutoFilterItem').addClass('NoSelectedAutoFilterItem');else $(this).addClass('SelectedAutoFilterItem').removeClass('NoSelectedAutoFilterItem')});
		$(".AutoFilterItem").bind("mouseover", function(){$(this).addClass("HideAutoFilterItem");});
		$(".AutoFilterItem").bind("mouseout", function(){$(this).removeClass("HideAutoFilterItem");});
		$(".NumericalFilterItem").bind("mouseover", function(){$(this).addClass("HideAutoFilterItem");});
		$(".NumericalFilterItem").bind("mouseout", function(){$(this).removeClass("HideAutoFilterItem");});
	}

	function onEndAction(type, id) {
		if (type === c_oAscAsyncActionType.BlockInteraction) {
			switch (id) {
				case c_oAscAsyncAction.Open:
					onSheetsChanged();
					showZoomValue();
					break;
			}
		}
		consolelog("onEndAction " + arguments[0] + " " + arguments[1]);
	}

	function updateSheetViewSettings () {
		g_sheetViewSettings = api.asc_getSheetViewSettings();
		$("#showGridLines").attr("checked", g_sheetViewSettings.asc_getShowGridLines());
		$("#showHeaders").attr("checked", g_sheetViewSettings.asc_getShowRowColHeaders());
		$("#freezePane").attr("checked", g_sheetViewSettings.asc_getIsFreezePane());
	}

	function onTabNavigationBtnClicked(event) {
		var btn = $(event.currentTarget),
				tablist = $("#ws-navigation .tabs"),
				items, first, last, width;

		if (btn.hasClass("first")) {
			tablist.children().removeClass("first")
					.filter(":first").addClass("first")
					.end().show();
			return true;
		}

		if (btn.hasClass("last")) {
			items = tablist.children(":visible").removeClass("first");
			last = items.last();
			width = tablist.width();
			while (last.position().left + last.outerWidth() > width) {
				first = items.first().hide();
				items = items.not(first);
			}
			items.first().addClass("first");
			return true;
		}

		if (btn.hasClass("prev")) {
			first = tablist.children(":visible:first");
			last = first.prev();
			if (last.length > 0) {
				first.removeClass("first");
				last.addClass("first").show();
			}
			return true;
		}

		if (btn.hasClass("next")) {
			items = tablist.children();
			last = items.last();
			width = tablist.width();
			if (last.position().left + last.outerWidth() > width) {
				items.filter(":visible:first").removeClass("first").hide()
						.next().addClass("first");
			}
			return true;
		}

		return true;
	}

	function onTabClicked(index) {
		$("#ws-navigation .tabs").children()
				.removeClass("active")
				.eq(index).addClass("active");
		api.asc_showWorksheet(index);
		updateSheetViewSettings();
		return true;
	}

	function onZoomBtnClicked(event) {
		var btn = $(event.currentTarget),
				f   = api.asc_getZoom(),
				df  = btn.hasClass("plus") ? 0.05 : (btn.hasClass("minus") ? -0.05 : 0);

		if (f + df > 0) {
			api.asc_setZoom(f + df);
		}

		showZoomValue();

		return true;
	}

	function updateSelectionNameInfo(name) {
		$("#cc1").val(name);
	}

	function updateCellInfo(info) {
	/*
					info : {
						"name":      "A1",
						"text":      текст ячейки
						"halign":    "left / right / center",
						"valign":    "top / bottom / center",
						"flags": {
							"merge":       true / false,
							"shrinkToFit": true / false,
							"wrapText":    true / false
						},
						"font": {
							"name":        "Arial",
							"size":        10,
							"bold":        true / false,
							"italic":      true / false,
							"underline":   true / false,
							"strikeout":   false,//TODO:,
							"subscript":   false,//TODO:,
							"superscript": false,//TODO:,
							"color":       "#RRGGBB" / "#RGB"
						},
						"fill": {
							"color": "#RRGGBB" / "#RGB"
						},
						"border": {
							"left": {
								"width": 0-3 пиксела,
								"style": "none / thick / thin / medium / dashDot / dashDotDot / dashed / dotted / double / hair / mediumDashDot / mediumDashDotDot / mediumDashed / slantDashDot"
								"color": "#RRGGBB" / "#RGB"
							},
							"top": {
								"width":
								"style":
								"color":
							},
							"right": {
								"width":
								"style":
								"color":
							},
							"bottom": {
								"width":
								"style":
								"color":
							},
							"diagDown": { диагональная линия слева сверху вправо вниз
								"width":
								"style":
								"color":
							},
							"diagUp": { диагональная линия слева снизу вправо вверх
								"width":
								"style":
								"color":
							}
						},
						formula: "SUM(C1:C6)"
					}
*/
			//consolelog(
			//	"cell: " + info.asc_getName() + ", " +
            //
			//	"font: " + info.asc_getFont().asc_getName() + " " + info.asc_getFont().asc_getSize() +
			//	(info.asc_getFont().asc_getBold() ? " bold" : "") +
			//	(info.asc_getFont().asc_getItalic() ? " italic" : "") +
			//	(info.asc_getFont().asc_getUnderline() ? " underline" : "") + ", " +
            //
			//	"color: " + (info.asc_getFont().asc_getColor() == null ? "0" : info.asc_getFont().asc_getColor().get_hex()) + ", " +
            //
			//	"fill: " + (info.asc_getFill().asc_getColor() == null ? "0" : info.asc_getFill().asc_getColor().get_hex()) + ", " +
            //
			//	"halign: " + info.asc_getHorAlign() + ", " +
            //
			//	"valign: " + info.asc_getVertAlign() + ", " +
            //
			//	"wrap: " + info.asc_getFlags().asc_getWrapText() + ", " +
            //
			//	"merge: " + info.asc_getFlags().asc_getMerge() + ", " +
            //
			//	"text: " + info.asc_getText() +
            //
			//	", formula: " + info.asc_getFormula()
            //
			//);
			//if(info.asc_getFormula())
			//	$("#cv1").val("="+info.asc_getFormula())
			//else
			//	$("#cv1").val(info.asc_getText())
            //
			//info.asc_getFlags().asc_getWrapText() ? $("#td_text_wrap").addClass("iconPressed") : $("#td_text_wrap").removeClass("iconPressed");
            //
			//info.asc_getFlags().asc_getMerge() ? $("#td_mergeCells").addClass("iconPressed") : $("#td_mergeCells").removeClass("iconPressed");
            //
			//info.asc_getFont().asc_getBold() ? $("#td_bold").addClass("iconPressed") : $("#td_bold").removeClass("iconPressed");
            //
			//info.asc_getFont().asc_getItalic() ? $("#td_italic").addClass("iconPressed") : $("#td_italic").removeClass("iconPressed");
            //
			//info.asc_getFont().asc_getUnderline() ? $("#td_underline").addClass("iconPressed") : $("#td_underline").removeClass("iconPressed");
            //
			//$("#fontSelectVal").text(info.asc_getFont().asc_getName());
			//$("#fontSizeSelectVal").text(info.asc_getFont().asc_getSize()+"pt");
			//$("#cellStyleSelectVal").text(info.asc_getStyleName());
            //
			//switch(info.asc_getHorAlign()){
			//	case "right":
			//		$("li[id*='td_ta']").removeClass("iconPressed");
			//		$("#td_ta_right").addClass("iconPressed");
			//		break;
			//	case "left":
			//		$("li[id*='td_ta']").removeClass("iconPressed");
			//		$("#td_ta_left").addClass("iconPressed");
			//		break;
			//	case "center":
			//		$("li[id*='td_ta']").removeClass("iconPressed");
			//		$("#td_ta_center").addClass("iconPressed");
			//		break;
			//	case "justify":
			//		$("li[id*='td_ta']").removeClass("iconPressed");
			//		$("#td_ta_justify").addClass("iconPressed");
			//		break;
			//}

	}

	//------API---------

	var api = new Asc.spreadsheet_api("wb-widget", "cv1");
	// Выставляем русскую локализацию для SUM (СУММ)
	api.asc_setLocalization(JSON.parse('{"DATE":{"n":"DATE","a":"( year, month, day )"},"DATEDIF":{"n":"DATEDIF","a":"( start-date , end-date , unit )"},"DATEVALUE":{"n":"DATEVALUE","a":"( date-time-string )"},"DAY":{"n":"DAY","a":"( date-value )"},"DAYS360":{"n":"DAYS360","a":"(  start-date , end-date [ , method-flag ] )"},"EDATE":{"n":"EDATE","a":"( start-date , month-offset )"},"EOMONTH":{"n":"EOMONTH","a":"( start-date , month-offset )"},"HOUR":{"n":"HOUR","a":"( time-value )"},"MINUTE":{"n":"MINUTE","a":"( time-value )"},"MONTH":{"n":"MONTH","a":"( date-value )"},"NETWORKDAYS":{"n":"NETWORKDAYS","a":"( start-date , end-date [ , holidays ] )"},"NOW":{"n":"NOW","a":"()"},"SECOND":{"n":"SECOND","a":"( time-value )"},"TIME":{"n":"TIME","a":"( hour, minute, second )"},"TIMEVALUE":{"n":"TIMEVALUE","a":"( date-time-string )"},"TODAY":{"n":"TODAY","a":"()"},"WEEKDAY":{"n":"WEEKDAY","a":"( serial-value [ , weekday-start-flag ] )"},"WEEKNUM":{"n":"WEEKNUM","a":"( serial-value [ , weekday-start-flag ] )"},"WORKDAY":{"n":"WORKDAY","a":"( start-date , day-offset [ , holidays ] )"},"YEAR":{"n":"YEAR","a":"( date-value )"},"YEARFRAC":{"n":"YEARFRAC","a":"(  start-date , end-date [ , basis ] )"},"BIN2DEC":{"n":"BIN2DEC","a":"( number )"},"BIN2HEX":{"n":"BIN2HEX","a":"( number [ , num-hex-digits ] )"},"BIN2OCT":{"n":"BIN2OCT","a":"( number [ , num-hex-digits ] )"},"COMPLEX":{"n":"COMPLEX","a":"( real-number , imaginary-number [ , suffix ] )"},"DEC2BIN":{"n":"DEC2BIN","a":"( number [ , num-hex-digits ] )"},"DEC2HEX":{"n":"DEC2HEX","a":"( number [ , num-hex-digits ] )"},"DEC2OCT":{"n":"DEC2OCT","a":"( number [ , num-hex-digits ] )"},"DELTA":{"n":"DELTA","a":"( number-1 [ , number-2 ] )"},"ERF":{"n":"ERF","a":"( lower-bound [ , upper-bound ] )"},"ERFC":{"n":"ERFC","a":"( lower-bound )"},"GESTEP":{"n":"GESTEP","a":"( number [ , step ] )"},"HEX2BIN":{"n":"HEX2BIN","a":"( number [ , num-hex-digits ] )"},"HEX2DEC":{"n":"HEX2DEC","a":"( number )"},"HEX2OCT":{"n":"HEX2OCT","a":"( number [ , num-hex-digits ] )"},"IMABS":{"n":"IMABS","a":"( complex-number )"},"IMAGINARY":{"n":"IMAGINARY","a":"( complex-number )"},"IMARGUMENT":{"n":"IMARGUMENT","a":"( complex-number )"},"IMCONJUGATE":{"n":"IMCONJUGATE","a":"( complex-number )"},"IMCOS":{"n":"IMCOS","a":"( complex-number )"},"IMDIV":{"n":"IMDIV","a":"( complex-number-1 , complex-number-2 )"},"IMEXP":{"n":"IMEXP","a":"( complex-number )"},"IMLN":{"n":"IMLN","a":"( complex-number )"},"IMLOG10":{"n":"IMLOG10","a":"( complex-number )"},"IMLOG2":{"n":"IMLOG2","a":"( complex-number )"},"IMPOWER":{"n":"IMPOWER","a":"( complex-number, power )"},"IMPRODUCT":{"n":"IMPRODUCT","a":"( argument-list )"},"IMREAL":{"n":"IMREAL","a":"( complex-number )"},"IMSIN":{"n":"IMSIN","a":"( complex-number )"},"IMSQRT":{"n":"IMSQRT","a":"( complex-number )"},"IMSUB":{"n":"IMSUB","a":"( complex-number-1 , complex-number-2 )"},"IMSUM":{"n":"IMSUM","a":"( argument-list )"},"OCT2BIN":{"n":"OCT2BIN","a":"( number [ , num-hex-digits ] )"},"OCT2DEC":{"n":"OCT2DEC","a":"( number )"},"OCT2HEX":{"n":"OCT2HEX","a":"( number [ , num-hex-digits ] )"},"CHAR":{"n":"CHAR","a":"( number )"},"CLEAN":{"n":"CLEAN","a":"( string )"},"CODE":{"n":"CODE","a":"( string )"},"CONCATENATE":{"n":"CONCATENATE","a":"(text1, text2, ...)"},"DOLLAR":{"n":"DOLLAR","a":"( number [ , num-decimal ] )"},"EXACT":{"n":"EXACT","a":"(text1, text2)"},"FIND":{"n":"FIND","a":"( string-1 , string-2 [ , start-pos ] )"},"FINDB":{"n":"FINDB","a":"( string-1 , string-2 [ , start-pos ] )"},"FIXED":{"n":"FIXED","a":"( number [ , [ num-decimal ] [ , suppress-commas-flag ] ] )"},"LEFT":{"n":"LEFT","a":"( string [ , number-chars ] )"},"LEFTB":{"n":"LEFTB","a":"( string [ , number-chars ] )"},"LEN":{"n":"LEN","a":"( string )"},"LENB":{"n":"LENB","a":"( string )"},"LOWER":{"n":"LOWER","a":"(text)"},"MID":{"n":"MID","a":"( string , start-pos , number-chars )"},"MIDB":{"n":"MIDB","a":"( string , start-pos , number-chars )"},"PROPER":{"n":"PROPER","a":"( string )"},"REPLACE":{"n":"REPLACE","a":"( string-1, start-pos, number-chars, string-2 )"},"REPLACEB":{"n":"REPLACEB","a":"( string-1, start-pos, number-chars, string-2 )"},"REPT":{"n":"REPT","a":"(text, number_of_times)"},"RIGHT":{"n":"RIGHT","a":"( string [ , number-chars ] )"},"RIGHTB":{"n":"RIGHTB","a":"( string [ , number-chars ] )"},"SEARCH":{"n":"SEARCH","a":"( string-1 , string-2 [ , start-pos ] )"},"SEARCHB":{"n":"SEARCHB","a":"( string-1 , string-2 [ , start-pos ] )"},"SUBSTITUTE":{"n":"SUBSTITUTE","a":"( string , old-string , new-string [ , occurence ] )"},"T":{"n":"T","a":"( value )"},"TEXT":{"n":"TEXT","a":"( value , format )"},"TRIM":{"n":"TRIM","a":"( string )"},"UPPER":{"n":"UPPER","a":"(text)"},"VALUE":{"n":"VALUE","a":"( string )"},"AVEDEV":{"n":"AVEDEV","a":"( argument-list )"},"AVERAGE":{"n":"AVERAGE","a":"( argument-list )"},"AVERAGEA":{"n":"AVERAGEA","a":"( argument-list )"},"AVERAGEIF":{"n":"AVERAGEIF","a":"( cell-range, selection-criteria [ , average-range ] )"},"BINOMDIST":{"n":"BINOMDIST","a":"( number-successes , number-trials , success-probability , cumulative-flag )"},"CONFIDENCE":{"n":"CONFIDENCE","a":"( alpha , standard-dev , size )"},"CORREL":{"n":"CORREL","a":"( array-1 , array-2 )"},"COUNT":{"n":"COUNT","a":"( argument-list )"},"COUNTA":{"n":"COUNTA","a":"( argument-list )"},"COUNTBLANK":{"n":"COUNTBLANK","a":"( argument-list )"},"COUNTIF":{"n":"COUNTIF","a":"( cell-range, selection-criteria )"},"COVAR":{"n":"COVAR","a":"( array-1 , array-2 )"},"CRITBINOM":{"n":"CRITBINOM","a":"( number-trials , success-probability , alpha )"},"DEVSQ":{"n":"DEVSQ","a":"( argument-list )"},"EXPONDIST":{"n":"EXPONDIST","a":"( x , lambda , cumulative-flag )"},"FISHER":{"n":"FISHER","a":"( number )"},"FISHERINV":{"n":"FISHERINV","a":"( number )"},"FORECAST":{"n":"FORECAST","a":"( x , array-1 , array-2 )"},"FREQUENCY":{"n":"FREQUENCY","a":"(  data-array , bins-array )"},"GAMMALN":{"n":"GAMMALN","a":"(number)"},"GEOMEAN":{"n":"GEOMEAN","a":"( argument-list )"},"HARMEAN":{"n":"HARMEAN","a":"( argument-list )"},"HYPGEOMDIST":{"n":"HYPGEOMDIST","a":"( sample-successes , number-sample , population-successes , number-population )"},"INTERCEPT":{"n":"INTERCEPT","a":"( array-1 , array-2 )"},"KURT":{"n":"KURT","a":"( argument-list )"},"LARGE":{"n":"LARGE","a":"(  array , k )"},"LOGINV":{"n":"LOGINV","a":"( x , mean , standard-deviation )"},"LOGNORMDIST":{"n":"LOGNORMDIST","a":"( x , mean , standard-deviation )"},"MAX":{"n":"MAX","a":"(number1, number2, ...)"},"MAXA":{"n":"MAXA","a":"(number1, number2, ...)"},"MEDIAN":{"n":"MEDIAN","a":"( argument-list )"},"MIN":{"n":"MIN","a":"(number1, number2, ...)"},"MINA":{"n":"MINA","a":"(number1, number2, ...)"},"MODE":{"n":"MODE","a":"( argument-list )"},"NEGBINOMDIST":{"n":"NEGBINOMDIST","a":"( number-failures , number-successes , success-probability )"},"NORMDIST":{"n":"NORMDIST","a":"( x , mean , standard-deviation , cumulative-flag )"},"NORMINV":{"n":"NORMINV","a":"( x , mean , standard-deviation )"},"NORMSDIST":{"n":"NORMSDIST","a":"(number)"},"NORMSINV":{"n":"NORMSINV","a":"( probability )"},"PEARSON":{"n":"PEARSON","a":"( array-1 , array-2 )"},"PERCENTILE":{"n":"PERCENTILE","a":"(  array , k )"},"PERCEBTRANK":{"n":"PERCEBTRANK","a":"( array , x [ , significance ]  )"},"PERMUT":{"n":"PERMUT","a":"( number , number-chosen )"},"POISSON":{"n":"POISSON","a":"( x , mean , cumulative-flag )"},"PROB":{"n":"PROB","a":"( x-range , probability-range , lower-limit [ , upper-limit ] )"},"QUARTILE":{"n":"QUARTILE","a":"(  array , result-category )"},"RSQ":{"n":"RSQ","a":"( array-1 , array-2 )"},"SKEW":{"n":"SKEW","a":"( argument-list )"},"SLOPE":{"n":"SLOPE","a":"( array-1 , array-2 )"},"SMALL":{"n":"SMALL","a":"(  array , k )"},"STANDARDIZE":{"n":"STANDARDIZE","a":"( x , mean , standard-deviation )"},"STDEV":{"n":"STDEV","a":"( argument-list )"},"STDEVA":{"n":"STDEVA","a":"( argument-list )"},"STDEVP":{"n":"STDEVP","a":"( argument-list )"},"STDEVPA":{"n":"STDEVPA","a":"( argument-list )"},"STEYX":{"n":"STEYX","a":"( known-ys , known-xs )"},"VAR":{"n":"VAR","a":"( argument-list )"},"VARA":{"n":"VARA","a":"( argument-list )"},"VARP":{"n":"VARP","a":"( argument-list )"},"VARPA":{"n":"VARPA","a":"( argument-list )"},"ACCRINT":{"n":"ACCRINT","a":"( issue , first-interest , settlement , rate , [ par ] , frequency [ , [ basis ] ] )"},"ACCRINTM":{"n":"ACCRINTM","a":"( issue , settlement , rate , [ [ par ] [ , [ basis ] ] ] )"},"AMORDEGRC":{"n":"AMORDEGRC","a":"( cost , date-purchased , first-period , salvage , period , rate [ , [ basis ] ] )"},"AMORLINC":{"n":"AMORLINC","a":"( cost , date-purchased , first-period , salvage , period , rate [ , [ basis ] ] )"},"COUPDAYBS":{"n":"COUPDAYBS","a":"( settlement , maturity , frequency [ , [ basis ] ] )"},"COUPDAYS":{"n":"COUPDAYS","a":"( settlement , maturity , frequency [ , [ basis ] ] )"},"COUPDAYSNC":{"n":"COUPDAYSNC","a":"( settlement , maturity , frequency [ , [ basis ] ] )"},"COUPNCD":{"n":"COUPNCD","a":"( settlement , maturity , frequency [ , [ basis ] ] )"},"COUPNUM":{"n":"COUPNUM","a":"( settlement , maturity , frequency [ , [ basis ] ] )"},"COUPPCD":{"n":"COUPPCD","a":"( settlement , maturity , frequency [ , [ basis ] ] )"},"CUMIPMT":{"n":"CUMIPMT","a":"( rate , nper , pv , start-period , end-period , type )"},"CUMPRINC":{"n":"CUMPRINC","a":"( rate , nper , pv , start-period , end-period , type )"},"DB":{"n":"DB","a":"( cost , salvage , life , period [ , [ month ] ] )"},"DDB":{"n":"DDB","a":"( cost , salvage , life , period [ , factor ] )"},"DISC":{"n":"DISC","a":"( settlement , maturity , pr , redemption [ , [ basis ] ] )"},"DOLLARDE":{"n":"DOLLARDE","a":"( fractional-dollar , fraction )"},"DOLLARFR":{"n":"DOLLARFR","a":"( decimal-dollar , fraction )"},"DURATION":{"n":"DURATION","a":"( settlement , maturity , coupon , yld , frequency [ , [ basis ] ] )"},"EFFECT":{"n":"EFFECT","a":"( nominal-rate , npery )"},"FV":{"n":"FV","a":"( rate , nper , pmt [ , [ pv ] [ ,[ type ] ] ] )"},"FVSCHEDULE":{"n":"FVSCHEDULE","a":"( principal , schedule )"},"INTRATE":{"n":"INTRATE","a":"( settlement , maturity , pr , redemption [ , [ basis ] ] )"},"IPMT":{"n":"IPMT","a":"( rate , per , nper , pv [ , [ fv ] [ , [ type ] ] ] )"},"IRR":{"n":"IRR","a":"( values [ , [ guess ] ] )"},"ISPMT":{"n":"ISPMT","a":"( rate , per , nper , pv )"},"MDURATION":{"n":"MDURATION","a":"( settlement , maturity , coupon , yld , frequency [ , [ basis ] ] )"},"MIRR":{"n":"MIRR","a":"( values , finance-rate , reinvest-rate )"},"NOMINAL":{"n":"NOMINAL","a":"( effect-rate , npery )"},"NPER":{"n":"NPER","a":"( rate , pmt , pv [ , [ fv ] [ , [ type ] ] ] )"},"NPV":{"n":"NPV","a":"( rate , argument-list )"},"ODDFPRICE":{"n":"ODDFPRICE","a":"( settlement , maturity , issue , first-coupon , rate , yld , redemption , frequency [ , [ basis ] ] )"},"ODDFYIELD":{"n":"ODDFYIELD","a":"( settlement , maturity , issue , first-coupon , rate , pr , redemption , frequency [ , [ basis ] ] )"},"ODDLPRICE":{"n":"ODDLPRICE","a":"( settlement , maturity , last-interest , rate , yld , redemption , frequency [ , [ basis ] ] )"},"ODDLYIELD":{"n":"ODDLYIELD","a":"( settlement , maturity , last-interest , rate , pr , redemption , frequency [ , [ basis ] ] )"},"PMT":{"n":"PMT","a":"( rate , nper , pv [ , [ fv ] [ ,[ type ] ] ] )"},"PPMT":{"n":"PPMT","a":"( rate , per , nper , pv [ , [ fv ] [ , [ type ] ] ] )"},"PRICE":{"n":"PRICE","a":"( settlement , maturity , rate , yld , redemption , frequency [ , [ basis ] ] )"},"PRICEDISC":{"n":"PRICEDISC","a":"( settlement , maturity , discount , redemption [ , [ basis ] ] )"},"PRICEMAT":{"n":"PRICEMAT","a":"( settlement , maturity , issue , rate , yld [ , [ basis ] ] )"},"PV":{"n":"PV","a":"( rate , nper , pmt [ , [ fv ] [ ,[ type ] ] ] )"},"RATE":{"n":"RATE","a":"( nper , pmt , pv  [ , [ [ fv ] [ , [ [ type ] [ , [ guess ] ] ] ] ] ] )"},"RECEIVED":{"n":"RECEIVED","a":"( settlement , maturity , investment , discount [ , [ basis ] ] )"},"SLN":{"n":"SLN","a":"( cost , salvage , life )"},"SYD":{"n":"SYD","a":"( cost , salvage , life , per )"},"TBILLEQ":{"n":"TBILLEQ","a":"( settlement , maturity , discount )"},"TBILLPRICE":{"n":"TBILLPRICE","a":"( settlement , maturity , discount )"},"TBILLYIELD":{"n":"TBILLYIELD","a":"( settlement , maturity , pr )"},"VDB":{"n":"VDB","a":"( cost , salvage , life , start-period , end-period [ , [ [ factor ] [ , [ no-switch-flag ] ] ] ] ] )"},"XIRR":{"n":"XIRR","a":"( values , dates [ , [ guess ] ] )"},"XNPV":{"n":"XNPV","a":"( rate , values , dates  )"},"YIELD":{"n":"YIELD","a":"( settlement , maturity , rate , pr , redemption , frequency [ , [ basis ] ] )"},"YIELDDISC":{"n":"YIELDDISC","a":"( settlement , maturity , pr , redemption , [ , [ basis ] ] )"},"YIELDMAT":{"n":"YIELDMAT","a":"( settlement , maturity , issue , rate , pr [ , [ basis ] ] )"},"ABS":{"n":"ABS","a":"( x )"},"ACOS":{"n":"ACOS","a":"( x )"},"ACOSH":{"n":"ACOSH","a":"( x )"},"ASIN":{"n":"ASIN","a":"( x )"},"ASINH":{"n":"ASINH","a":"( x )"},"ATAN":{"n":"ATAN","a":"( x )"},"ATAN2":{"n":"ATAN2","a":"( x, y )"},"ATANH":{"n":"ATANH","a":"( x )"},"CEILING":{"n":"CEILING","a":"( x, significance )"},"COMBIN":{"n":"COMBIN","a":"( number , number-chosen )"},"COS":{"n":"COS","a":"( x )"},"COSH":{"n":"COSH","a":"( x )"},"DEGREES":{"n":"DEGREES","a":"( angle )"},"EVEN":{"n":"EVEN","a":"( x )"},"EXP":{"n":"EXP","a":"( x )"},"FACT":{"n":"FACT","a":"( x )"},"FACTDOUBLE":{"n":"FACTDOUBLE","a":"( x )"},"FLOOR":{"n":"FLOOR","a":"( x, significance )"},"GCD":{"n":"GCD","a":"( argument-list )"},"INT":{"n":"INT","a":"( x )"},"LCM":{"n":"LCM","a":"( argument-list )"},"LN":{"n":"LN","a":"( x )"},"LOG":{"n":"LOG","a":"( x [ , base ] )"},"LOG10":{"n":"LOG10","a":"( x )"},"MDETERM":{"n":"MDETERM","a":"( array )"},"MINVERSE":{"n":"MINVERSE","a":"( array )"},"MMULT":{"n":"MMULT","a":"( array1, array2 )"},"MOD":{"n":"MOD","a":"( x, y )"},"MROUND":{"n":"MROUND","a":"( x, multiple )"},"MULTINOMIAL":{"n":"MULTINOMIAL","a":"( argument-list )"},"ODD":{"n":"ODD","a":"( x )"},"PI":{"n":"PI","a":"()"},"POWER":{"n":"POWER","a":"( x, y )"},"PRODUCT":{"n":"PRODUCT","a":"( argument-list )"},"QUOTIENT":{"n":"QUOTIENT","a":"( dividend , divisor )"},"RADIANS":{"n":"RADIANS","a":"( angle )"},"RAND":{"n":"RAND","a":"()"},"RANDBETWEEN":{"n":"RANDBETWEEN","a":"( lower-bound , upper-bound )"},"ROMAN":{"n":"ROMAN","a":"( number, form )"},"ROUND":{"n":"ROUND","a":"( x , number-digits )"},"ROUNDDOWN":{"n":"ROUNDDOWN","a":"( x , number-digits )"},"ROUNDUP":{"n":"ROUNDUP","a":"( x , number-digits )"},"SERIESSUM":{"n":"SERIESSUM","a":"( input-value , initial-power , step , coefficients )"},"SIGN":{"n":"SIGN","a":"( x )"},"SIN":{"n":"SIN","a":"( x )"},"SINH":{"n":"SINH","a":"( x )"},"SQRT":{"n":"SQRT","a":"( x )"},"SQRTPI":{"n":"SQRTPI","a":"( x )"},"SUM":{"n":"СУММ","a":"( argument-list )"},"SUMIF":{"n":"SUMIF","a":"( cell-range, selection-criteria [ , sum-range ] )"},"SUMPRODUCT":{"n":"SUMPRODUCT","a":"( argument-list )"},"SUMSQ":{"n":"SUMSQ","a":"( argument-list )"},"SUMX2MY2":{"n":"SUMX2MY2","a":"( array-1 , array-2 )"},"SUMX2PY2":{"n":"SUMX2PY2","a":"( array-1 , array-2 )"},"SUMXMY2":{"n":"SUMXMY2","a":"( array-1 , array-2 )"},"TAN":{"n":"TAN","a":"( x )"},"TANH":{"n":"TANH","a":"( x )"},"TRUNC":{"n":"TRUNC","a":"( x [ , number-digits ] )"},"ADDRESS":{"n":"ADDRESS","a":"( row-number , col-number [ , [ ref-type ] [ , [ A1-ref-style-flag ] [ , sheet-name ] ] ] )"},"CHOOSE":{"n":"CHOOSE","a":"( index , argument-list )"},"COLUMN":{"n":"COLUMN","a":"( [ reference ] )"},"COLUMNS":{"n":"COLUMNS","a":"( array )"},"HLOOKUP":{"n":"HLOOKUP","a":"( lookup-value  ,  table-array  ,  row-index-num  [  ,  [  range-lookup-flag  ] ] )"},"INDEX":{"n":"INDEX","a":"( array , [ row-number ] [ , [ column-number ] ] ) INDEX( reference , [ row-number ] [ , [ column-number ] [ , [ area-number ] ] ] )"},"INDIRECT":{"n":"INDIRECT","a":"( ref-text [ , [ A1-ref-style-flag ] ] )"},"LOOKUP":{"n":"LOOKUP","a":"(  lookup-value  ,  lookup-vector  ,  result-vector  )"},"MATCH":{"n":"MATCH","a":"(  lookup-value  ,  lookup-array [ , [ match-type ]] )"},"OFFSET":{"n":"OFFSET","a":"( reference , rows , cols [ , [ height ] [ , [ width ] ] ] )"},"ROW":{"n":"ROW","a":"( [ reference ] )"},"ROWS":{"n":"ROWS","a":"( array )"},"TRANSPOSE":{"n":"TRANSPOSE","a":"( array )"},"VLOOKUP":{"n":"VLOOKUP","a":"( lookup-value  ,  table-array  ,  col-index-num  [  ,  [  range-lookup-flag  ] ] )"},"ERROR.TYPE":{"n":"ERROR.TYPE","a":"(value)"},"ISBLANK":{"n":"ISBLANK","a":"(value)"},"ISERR":{"n":"ISERR","a":"(value)"},"ISERROR":{"n":"ISERROR","a":"(value)"},"ISEVEN":{"n":"ISEVEN","a":"(number)"},"ISLOGICAL":{"n":"ISLOGICAL","a":"(value)"},"ISNA":{"n":"ISNA","a":"(value)"},"ISNONTEXT":{"n":"ISNONTEXT","a":"(value)"},"ISNUMBER":{"n":"ISNUMBER","a":"(value)"},"ISODD":{"n":"ISODD","a":"(number)"},"ISREF":{"n":"ISREF","a":"(value)"},"ISTEXT":{"n":"ISTEXT","a":"(value)"},"N":{"n":"N","a":"(value)"},"NA":{"n":"NA","a":"()"},"TYPE":{"n":"TYPE","a":"(value)"},"AND":{"n":"AND","a":"(logical1, logical2, ...)"},"FALSE":{"n":"FALSE","a":"()"},"IF":{"n":"IF","a":"(logical_test, value_if_true, value_if_false)"},"IFERROR":{"n":"IFERROR","a":"(value, value_if_error)"},"NOT":{"n":"NOT","a":"(logical)"},"OR":{"n":"OR","a":"(logical1, logical2, ...)"},"TRUE":{"n":"TRUE","a":"()"}}'))
	//api.asc_setViewerMode(true);
	var aDialogNames = [];
	var bIsUpdateChartProperties = false;
	var bIsReopenDialog = false;
	var bIsInitFormulasList = false;

	// Comment events	
	api.asc_registerCallback("asc_onMouseMove", eventMouseMoveComment);
	api.asc_registerCallback("asc_onAddComment", eventAddComment);
	api.asc_registerCallback("asc_onRemoveComment", eventRemoveComment);
	api.asc_registerCallback("asc_onChangeCommentData", eventChangeCommentData);
	api.asc_registerCallback("asc_onUpdateCommentPosition", eventUpdateCommentPosition);
	
	api.asc_registerCallback("asc_onShowComment", eventShowComment);
	api.asc_registerCallback("asc_onHideComment", eventHideComment);
	
	api.asc_registerCallback("asc_onShowChartDialog", showChartDialog);
	api.asc_registerCallback("asc_onStartAction", onStartAction);
	api.asc_registerCallback("asc_onEndAction", onEndAction);
	api.asc_registerCallback("asc_onError", onError);
	api.asc_registerCallback("asc_onSelectionChanged", updateCellInfo);
	api.asc_registerCallback("asc_onSelectionNameChanged", updateSelectionNameInfo);
	api.asc_registerCallback("asc_onSheetsChanged", onSheetsChanged);
	api.asc_registerCallback("asc_onZoomChanged", function(){
		console.log(arguments[0]);
		$("#ws-navigation .ws-zoom-input")
				.val(Math.round(arguments[0] * 100) + "%");
	});

	api.asc_registerCallback("asc_onHyperlinkClick", function(url){
		if (url)  {
			window.open(url);
		}
	});
	api.asc_registerCallback("asc_onAdvancedOptions", function(options){
		console.log(options);

		$("#pageCodeSelect").empty();
		$("#DelimiterList").empty();

		for(var i = 0; i < options.asc_getOptions().asc_getCodePages().length; i++){
			if ($("#pageCodeSelect option[value='" + options.asc_getOptions().asc_getCodePages()[i].asc_getCodePageName() + "']").length == 0) {
				$("#pageCodeSelect").append("<option value='" + options.asc_getOptions().asc_getCodePages()[i].asc_getCodePage() + "'>" + options.asc_getOptions().asc_getCodePages()[i].asc_getCodePageName() + "</option>");
			}
		}

		for(var id in c_oAscCsvDelimiter){
			if (0 == c_oAscCsvDelimiter[id])
				continue;
			if ($("#DelimiterList option[value='" + id + "']").length == 0) {
				$("#DelimiterList").append("<option value='" + c_oAscCsvDelimiter[id] + "'>" + id + "</option>");
			}
		}
		if ("save" != $("#dialogSaveCsv").attr("typeDialog"))
			$("#dialogSaveCsv").attr("typeDialog", "open");
		$("#dialogSaveCsv").dialog("open");

	});
	api.asc_registerCallback("asc_onSetAFDialog", onSetAFDialog);

	api.asc_registerCallback("asc_onActiveSheetChanged", onActiveSheetChanged);

	api.asc_registerCallback("asc_onConfirmAction", function(){
		var arg = arguments;
		$("#ConfirmMess")
			.dialog({ 
				buttons: [
					{
						text: "Ok",
						click: function() { arg[1](true); 
							$(this).dialog("close");}
					},
					{
						text: "Cancel",
						btCancel: "classButtonCancel",
						click: function() { 
							arg[1](false);
							$(this).dialog("close"); 
						}
					}
				]
			})
			.dialog("open");
	});

	api.asc_registerCallback("asc_onEditCell", function (state) {
//		console.log("Cell Edit State - " + state);
	});

	api.asc_registerCallback("asc_onSelectionRangeChanged", function (val) {
		$("#chartRange").val(val);
		$("#formatTableRange").val(val);
	});

	api.asc_registerCallback("asc_onInitEditorStyles", function (styles) {
		var cellStyleContent = "";
		var styleName;
		for (var i = 0; i < styles.defaultStyles.length; i++) {
			styleName = styles.defaultStyles[i].asc_getName();
			cellStyleContent += '<li id="'+styleName.replace(/\s/g,"")+'"index="'+i+'" class="SubItem cellStyleListElement" nameStyle="'+styleName+'">'+styleName+'</li>';
		}
		$("#cellStyleSelect ul").empty().append(cellStyleContent);
	});
	api.asc_registerCallback("asc_onSendThemeColorSchemes", function (colorSchemes) {
		var cellThemeContent = "";
		var themeName;
		for (var i = 0; i < colorSchemes.length; ++i) {
			themeName = colorSchemes[i].get_name();
			cellThemeContent += '<li id="'+themeName.replace(/\s/g,"")+'" class="SubItem cellStyleListElement" indexTheme="'+i+'">'+themeName+'</li>';
		}
		$("#themeSelect ul").empty().append(cellThemeContent);
	});
	
	api.asc_Init("../Fonts/");
	//api.asc_setViewerMode(true);

	function getURLParameter(name) {
		return (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1];
	}

	var sProtocol = window.location.protocol;
	var sHost = window.location.host;
	var key = !!getURLParameter("key");
	var bChartEditor = !!getURLParameter("charteditor");
	var sUserNameAndId = "user_" + Math.floor ((Math.random() * 100) + 1);

    var offLineApp = 0; //  1;  // NOTE: ONLY FOR TEST DESKTOP APPLICATION
    var c_DocInfo;
    if (!offLineApp) {
        c_DocInfo = {
            "Id"     : getURLParameter("key") ? decodeURIComponent(getURLParameter("key")) : "9876543210",
            "Url"    : getURLParameter("url") ? decodeURIComponent(getURLParameter("url")) : undefined,
            "Title"  : getURLParameter("title") ? decodeURIComponent(getURLParameter("title")).replace(new RegExp("\\+",'g')," ") : undefined,
            "Format" : getURLParameter("filetype") ? decodeURIComponent(getURLParameter("filetype")) : undefined,
            "VKey"   : getURLParameter("vkey") ? decodeURIComponent(getURLParameter("vkey")) : undefined,
            "Origin" : (sProtocol.search(/\w+/) >= 0 ? sProtocol + "//" : "") + sHost,
            "UserId" : sUserNameAndId,
            "UserName" : sUserNameAndId,
            "ChartEditor" : bChartEditor
        };
    } else {
        c_DocInfo = {
            "Id"     : getURLParameter("key") ? decodeURIComponent(getURLParameter("key")) : "9876543210",
            "Url"    : decodeURIComponent("file:///X:/AVS/Sources/TeamlabOffice/trunk/OfficeWeb/OfflineDocuments/Excel/test-native/"),
            "Title"  : getURLParameter("title") ? decodeURIComponent(getURLParameter("title")).replace(new RegExp("\\+",'g')," ") : undefined,
            "Format" : getURLParameter("filetype") ? decodeURIComponent(getURLParameter("filetype")) : undefined,
            "VKey"   : getURLParameter("vkey") ? decodeURIComponent(getURLParameter("vkey")) : undefined,
            "Origin" : (sProtocol.search(/\w+/) >= 0 ? sProtocol + "//" : "") + sHost,
            "UserId" : sUserNameAndId,
            "UserName" : sUserNameAndId,
            "ChartEditor" : bChartEditor,
            "OfflineApp" : true
        };
    }
    api.asc_setDocInfo(c_DocInfo);
    api.asc_getEditorPermissions();
    api.asc_LoadDocument();

	$("#enableKE").data("state", true).click(function(){
		var $this = $(this), s = $this.data("state");
		api.asc_enableKeyEvents(!s);
		$this.data("state", !s);
		$this.val("key events: " + (!s ? "enabled" : "disabled"));
	});
	$("#searchText").click(function(){
		if ( !api.asc_findCellText($("#pattern").val(), $("#searchRow").is(":checked"), $("#searchFwd").is(":checked")) ) {
			alert("no more such text");
		}
	})
	$("#mainmenu,#menuButton").clickMenu({onClick:function(){
		switch(this.id){
			case "mnuSaveXls":{
				api.asc_DownloadAs(c_oAscFileType.XLS);
				break;
			}
			case "mnuSaveXlsx":{
				api.asc_DownloadAs(c_oAscFileType.XLSX);
				break;
			}
			case "mnuSaveOds":{
				api.asc_DownloadAs(c_oAscFileType.ODS);
				break;
			}
			case "mnuSaveCsv":{
				$("#dialogSaveCsv").attr("typeDialog", "save");
				api.asc_getEncodings();
				break;
			}
			case "mnuSaveHtml":{
				api.asc_DownloadAs(c_oAscFileType.HTML);
				break;
			}
			case "mnuOpen":{
				break;
			}
			case "mnuSheetRename":{
				$("#dialogRenameWS").dialog("open");
				break;
			}
			case "mnuDelSheet":{
				if (false == api.asc_deleteWorksheet())
					console.error ("Нельзя удалить последний sheet");

				break;
			}
			case "mnuShowColumn":{
				api.asc_showColumns();
				break;
			}
			case "mnuShowRow":{
				api.asc_showRows();
				break;
			}
			case "mnuShowMasterDep":{
				api.asc_drawDepCells(c_oAscDrawDepOptions.Master);
				break;
			}
			case "mnuShowSlaveDep":{
				api.asc_drawDepCells(c_oAscDrawDepOptions.Slave);
				break;
			}
			case "mnuClearDep":{
				api.asc_drawDepCells(c_oAscDrawDepOptions.Clear);
				break;
			}
			
		}
	}})
	$("#textMenu").clickMenu({onClick:function(){
		var bIsNeed = true;
		switch(this.id){
			case "8": case "9": case "10": case "11": case "12": case "14": case "16": case "18": case "20": case "22": case "24": case "26": case "28": case "36": case "48": case "72":
				api.asc_setCellFontSize(parseInt(this.id));
				$('#textMenu').trigger('closemenu');
				$('#fontSizeSelectVal').text(this.innerHTML);
				$('#fontSizeSelectVal').val(this.id);
				$('#fontSizeSelectVal').change();
			break;
			default:{
				$('#textMenu').trigger('closemenu');
				if ($(this).hasClass("fontListElement")){
					$('#fontSelectVal').text(this.innerHTML);
					$('#fontSelectVal').val(this.getAttribute("value"));
					$('#fontSelectVal').change();
					api.asc_setCellFontName($(this).attr("namefont"));
				}
			}
		}
		return false;
	}});
	$("#textMenu2").clickMenu({onClick:function(){
		$('#textMenu2').trigger('closemenu');
		if ($(this).hasClass("cellStyleListElement")){
			var cellStyleSelectVal = $('#cellStyleSelectVal');
			cellStyleSelectVal.text(this.innerHTML);
			cellStyleSelectVal.val(this.getAttribute("value"));
			cellStyleSelectVal.change();
			api.asc_setCellStyle($(this).attr("nameStyle"));
		}

		return false;
	}});
	$("#textMenu3").clickMenu({onClick:function(){
		$('#textMenu3').trigger('closemenu');
		if ($(this).hasClass("cellStyleListElement")){
			var themeSelectVal = $('#themeSelectVal');
			themeSelectVal.text(this.innerHTML);
			themeSelectVal.val(this.getAttribute("value"));
			themeSelectVal.change();
			api.asc_ChangeColorScheme($(this).attr("indexTheme"));
		}

		return false;
	}});
	$("#dialogRenameWS").dialog({ autoOpen: false,
			resizable: false, modal: true, closeOnEscape: false, dialogClass: 'dialogClass',
			buttons: [
				{
					text: "OK",
					click: function() { if ( api.asc_renameWorksheet( $("#dialogRenameWS input").val() ) ) $(this).dialog("close"); }
				},
				{
					text: "Cancel",
					btCancel: "classButtonCancel",
					click: function() { $(this).dialog("close"); }
				}
			]
		});
	var fontList = ["Agency FB","Aharoni","Algerian","Andalus","Angsana New","AngsanaUPC","Arabic Transparent","Arial","Arial Black","Arial Narrow","Arial Rounded MT Bold","Arial Unicode MS","Aston-F1","Baskerville Old Face","Batang","BatangChe","Bauhaus 93","Bell MT","Berlin Sans FB","Berlin Sans FB Demi","Bernard MT Condensed","Bickham Script Pro Regular","Blackadder ITC","Bodoni MT","Bodoni MT Black","Bodoni MT Condensed","Bodoni MT Poster Compressed","Book Antiqua","Bookman Old Style","Bookshelf Symbol 7","Bradley Hand ITC","Britannic Bold","Broadway","Browallia New","BrowalliaUPC","Brush Script MT","Calibri","Californian FB","Calisto MT","Cambria","Cambria Math","Candara","Castellar","Centaur","Century","Century Gothic","Century Schoolbook","Chiller","Colonna MT","Comic Sans MS","Consolas","Constantia","Cooper Black","Copperplate Gothic Bold","Copperplate Gothic Light","Corbel","Cordia New","CordiaUPC","Courier New","Curlz MT","David","David Transparent","DejaVu Sans","DejaVu Sans Condensed","DejaVu Sans Light","DejaVu Sans Mono","DejaVu Serif","DejaVu Serif Condensed","DilleniaUPC","Dingbats","Dotum","DotumChe","Droid Sans Mono","Edwardian Script ITC","Elephant","Engravers MT","Eras Bold ITC","Eras Demi ITC","Eras Light ITC","Eras Medium ITC","Estrangelo Edessa","EucrosiaUPC","Felix Titling","Fixed Miriam Transparent","FlemishScript BT","Footlight MT Light","Forte","Franklin Gothic Book","Franklin Gothic Demi","Franklin Gothic Demi Cond","Franklin Gothic Heavy","Franklin Gothic Medium","Franklin Gothic Medium Cond","FrankRuehl","FreesiaUPC","Freestyle Script","French Script MT","Gabriola","Garamond","Gautami","Gentium Basic","Gentium Book Basic","Georgia","Gigi","Gill Sans MT","Gill Sans MT Condensed","Gill Sans MT Ext Condensed Bold","Gill Sans Ultra Bold","Gill Sans Ultra Bold Condensed","Gloucester MT Extra Condensed","GOST type A","GOST type B","Goudy Old Style","Goudy Stout","Gulim","GulimChe","Gungsuh","GungsuhChe","Haettenschweiler","Harlow Solid Italic","Harrington","High Tower Text","Impact","Imprint MT Shadow","Informal Roman","IrisUPC","JasmineUPC","Jokerman","Juice ITC","Kartika","KodchiangUPC","Kristen ITC","Kunstler Script","Latha","Levenim MT","LilyUPC","Lucida Bright","Lucida Calligraphy","Lucida Console","Lucida Fax","Lucida Handwriting","Lucida Sans","Lucida Sans Typewriter","Lucida Sans Unicode","Magneto","Maiandra GD","Mangal","Matura MT Script Capitals","Meiryo","Meiryo UI","Microsoft Sans Serif","MingLiU","Miriam","Miriam Fixed","Miriam Transparent","Mistral","Modern No. 20","Monotype Corsiva","MS Gothic","MS Mincho","MS Outlook","MS PGothic","MS PMincho","MS Reference Sans Serif","MS Reference Specialty","MS UI Gothic","MT Extra","MV Boli","Narkisim","Niagara Engraved","Niagara Solid","NSimSun","OCR A Extended","Old English Text MT","Onyx","OpenSymbol","Palace Script MT","Palatino Linotype","Papyrus","Parchment","Perpetua","Perpetua Titling MT","Playbill","PMingLiU","Poor Richard","Pristina","Raavi","Rage Italic","Ravie","Rockwell","Rockwell Condensed","Rockwell Extra Bold","Rod","Rod Transparent","Script MT Bold","Segoe UI","Showcard Gothic","Shruti","SimHei","Simplified Arabic","Simplified Arabic Fixed","SimSun","SimSun-PUA","Snap ITC","Stencil","Sylfaen","Symbol","Tahoma","Tempus Sans ITC","Times New Roman","Traditional Arabic","Trebuchet MS","Tunga","Tw Cen MT","Tw Cen MT Condensed","Tw Cen MT Condensed Extra Bold","Verdana","Viner Hand ITC","Vivaldi","Vladimir Script","Vrinda","Webdings","Wide Latin","Wingdings","Wingdings 2","Wingdings 3"];
	function createFontList(){
		fontContent = "";
		for (var i = 0; i < fontList.length; i++)
			fontContent += '<li id="'+fontList[i].replace(/\s/g,"")+'"index="'+i+'" class="SubItem fontListElement" style="font-family:Arial;" nameFont="'+fontList[i]+'">'+fontList[i]+'</li>';
		$("#fontSelect ul").empty().append(fontContent);
	}
	createFontList();
	function remClassIconPress(a){
		a.removeClass("iconPressed");
	}
	function addClassIconPress(a){
		a.addClass("iconPressed");
	}
	$("#td_sort_desc,#td_sort_asc,#td_text_wrap, #td_redo, #td_undo, #td_bold, #td_italic, #td_underline, \
		#td_print, #td_copy, #td_paste,#td_cut, #td_ta_center, #td_ta_right, #td_ta_left, #td_ta_justify, \
		#td_mergeCells, #td_recalc, #td_insert_chart, #td_insert_image_url, #td_insert_image_file, #td_drawing_object_layer, \
		#td_add_cell_comment, #td_add_document_comment, #td_add_hyperlink, #td_auto_filter, #td_auto_filter_local, \
		#td_set_fixed_area, #td_clean_fixed_area, #td_set_fixed_col, #td_set_fixed_row").click(function(){
		switch (this.id){
			case "td_bold":{
				if ($(this).hasClass("iconPressed")){
					$(this).removeClass("iconPressed");
					api.asc_setCellBold(false);
					}
				else{
					$(this).addClass("iconPressed");
					api.asc_setCellBold(true);
				}
				break;
			}
			case "td_italic":{
				if ($(this).hasClass("iconPressed")){
					$(this).removeClass("iconPressed");
					api.asc_setCellItalic(false);
				}
				else{
					$(this).addClass("iconPressed");
					api.asc_setCellItalic(true);
				}
				break;
			}
			case "td_underline":{
				if ($(this).hasClass("iconPressed")){
					$(this).removeClass("iconPressed");
					api.asc_setCellUnderline(false);
				}
				else{
					$(this).addClass("iconPressed");
					api.asc_setCellUnderline(true);
				}
				break;
			}
			case "td_print":{
				api.asc_Print();
				break;
			}
			case "td_copy":{
				api.asc_Copy();
				break;
			}
			case "td_paste":{
				api.asc_Paste();
				break;
			}
			case "td_cut":{
				api.asc_Cut();
				break;
			}
			case "td_ta_left":{
					$("td[id*='td_ta']").removeClass("iconPressed");
					$(this).addClass("iconPressed");
					api.asc_setCellAlign("left")
					break;
			}
			case "td_ta_center":{
				if ($(this).hasClass("iconPressed")){
					$(this).removeClass("iconPressed");
					$("#td_ta_left").addClass("iconPressed");
					api.asc_setCellAlign("left");
				}
				else{
					$("td[id*='td_ta']").removeClass("iconPressed");
					$(this).addClass("iconPressed");
					api.asc_setCellAlign("center");
				}
				break;
			}
			case "td_ta_right":{
				if ($(this).hasClass("iconPressed")){
					$(this).removeClass("iconPressed");
					$("#td_ta_left").addClass("iconPressed");
					api.asc_setCellAlign("left");
				}
				else{
					$("td[id*='td_ta']").removeClass("iconPressed");
					$(this).addClass("iconPressed");
					api.asc_setCellAlign("right");
				}
				break;
			}
			case "td_ta_justify":{
				if ($(this).hasClass("iconPressed")){
					$(this).removeClass("iconPressed");
					$("#td_ta_left").addClass("iconPressed");
					api.asc_setCellAlign("left");
				}
				else{
					$("td[id*='td_ta']").removeClass("iconPressed");
					$(this).addClass("iconPressed");
					api.asc_setCellAlign("justify");
				}
				break;
			}
			case "td_undo":{
				api.asc_Undo();
				break;
			}
			case "td_redo":{
				api.asc_Redo();
				break;
			}
			case "td_text_wrap":{
				if ($(this).hasClass("iconPressed")){
					$(this).removeClass("iconPressed");
					api.asc_setCellTextWrap(false);
				}
				else{
					$(this).addClass("iconPressed");
					api.asc_setCellTextWrap(true);
				}

				break;
			}
			case "td_mergeCells":{
				if ($(this).hasClass("iconPressed")){
					$(this).removeClass("iconPressed");
					api.asc_mergeCells(c_oAscMergeOptions.Unmerge);
				}
				else{
					$(this).addClass("iconPressed");
					api.asc_mergeCells(c_oAscMergeOptions.Merge);
				}

				break;
			}
			case "td_recalc":{
				api.asc_drawDepCells(c_oAscDrawDepOptions.Master);
				break;
			}
			case "td_sort_asc":{
				api.asc_sortCells(c_oAscSortOptions.Ascending);
				break;
			}case "td_sort_desc":{
				api.asc_sortCells(c_oAscSortOptions.Descending);
				break;
			}
			case "td_insert_chart":{
				showChartDialog();
				break;
			}
			case "td_insert_image_url":{
				showImageUrlDialog();
				break;
			}
			case "td_insert_image_file":{
				api.asc_showImageFileDialog();
				break;
			}
			case "td_drawing_object_layer":{
				showDrawingLayerDialog();
				break;
			}
			case "td_add_cell_comment":{
				showCommentDialog(false);
				break;
			}
			case "td_add_document_comment":{
				showCommentDialog(true);
				break;
			}
			case "td_add_hyperlink":
			{
				var oCellInfo = api.asc_getCellInfo();
				var oTmpHyperlinkObj = oCellInfo.asc_getHyperlink();

				var oHyperText = $("#addHyperlink_text");
				var oSelect = $("#addHyperlink_she");
				oSelect.empty();
				for (var i = 0; i < $("#ws-navigation .tabs .tab-name").length; i++)
					oSelect.append("<option>" + $("#ws-navigation .tabs .tab-name")[i].textContent + "</option>");
				if (null == oTmpHyperlinkObj) {
					oHyperText.val(oCellInfo.asc_getText());
					toggleHyperlinkDialog(true);
					$("#addHyperlink_url").val("");
					$("#addHyperlink_ran").val("A1");
				} else {
					oHyperText.val(oTmpHyperlinkObj.asc_getText());
					switch (oTmpHyperlinkObj.asc_getType()) {
						case c_oAscHyperlinkType.WebLink:
							toggleHyperlinkDialog(true);
							$("#addHyperlink_url").val(oTmpHyperlinkObj.asc_getHyperlinkUrl());
							break;
						case c_oAscHyperlinkType.RangeLink:
							toggleHyperlinkDialog(false);
							oSelect.val(oTmpHyperlinkObj.asc_getSheet());
							$("#addHyperlink_ran").val(oTmpHyperlinkObj.asc_getRange());
							break;
					}
				}
				api.asc_enableKeyEvents(false);
				$("#dialogAddHyperlink").dialog("open");
				break;
			}
			case "td_auto_filter":{
				api.asc_addAutoFilter();
				break;
			}
			case "td_auto_filter_local":{
				showAddFilterDialog();
				break;
			}
		}
	});
	$("#tdIncreaseFontSize").click(function () {
		api.asc_increaseFontSize();
	});
	$("#tdDecreaseFontSize").click(function () {
		api.asc_decreaseFontSize();
	});
	$(".selectable").bind("mouseover", function() {if ($(this).hasClass("noselectable")) return; $(this).addClass("iconHover"); });
	$(".selectable").bind("mouseout", function() { $(this).removeClass("iconHover"); });
	$(".clrPicker1").mousedown(function(){
		if ("none" != $("#colorBox1").css("display")){
			IsVisibleMenu = true;
			$("#td_BackgroundColor").removeClass("iconPressed");
			$("#colorBox1").css("display","none");
		}
	});
	$("#td_va_choose").mousedown(function(event) {
		if ("none" != $("#va_options").css("display")) {
			IsVisibleMenu = true;
			$("#td_verticalAlign").removeClass("iconPressed");
			$("#va_options").hide();
		}
	});
	$("#td_va_choose").click(function() {
		if (false == IsVisibleMenu) {
			var offset = $("#td_verticalAlign").offset();
			offset.top += $("#td_verticalAlign").outerHeight() - 1;
			$("#va_options").css(offset).show();
			if ($(window).width() < $("#va_options").width() + $("#va_options").offset().left)
				$("#va_options").offset({ left: $("#va_options").offset().left - $("#va_options").width() + $("#td_verticalAlign").width() });
			$("#td_verticalAlign").addClass("iconPressed");
		}
		IsVisibleMenu = false;
	});
	$("[id^=td_vo_]").click(function() {
		$("#va_options").hide();
		var val = $(this).attr("id").slice(6);
		$("#td_va").attr("al", val).click();
		$("#td_verticalAlign").removeClass("iconPressed");
	});
	$("#td_va").click(function() {
		switch( $("#td_va").attr("al") ){
			case "top":{
				api.asc_setCellVertAlign(c_oAscAlignType.TOP);
				break;
			}
			case "middle":{
				api.asc_setCellVertAlign(c_oAscAlignType.MIDDLE);
				break;
			}
			case "bottom":{
				api.asc_setCellVertAlign(c_oAscAlignType.BOTTOM);
				break;
			}
		}
	});
	$(".clrPicker1").click(function(){
		if (false == IsVisibleMenu){
			var ofset=$("#td_BackgroundColor").offset();
			ofset.top += $("#td_BackgroundColor").outerHeight() - 1;
			$("#colorBox1").css(ofset);
			$("#colorBox1").attr("init", "background-color").show();
			$("#td_BackgroundColor").addClass("iconPressed");
		}
		IsVisibleMenu = false;
	});
	$(".colorSelect1").click(function(){
		$(".clrSelector1").children().css('border-bottom-color', $(this).children().css('backgroundColor'));
		$("#colorBox1").hide();
		$(".clrSelector1").click();
	});
	$(".clrSelector1").click(function(){
		var color=$(this).children().css("border-bottom-color");
		var otd_color_fon = $("#td_color_fon");
		otd_color_fon.blur();
		$("#td_BackgroundColor").removeClass("iconPressed");
		var oColor = parseColor(color);
		if (null !== oColor)
			api.asc_setCellBackgroundColor(new asc_CColor(oColor.r, oColor.g, oColor.b));
		return false;
	});
	$(".clrPicker2, .clrPicker3").mousedown(function(event){
		if ("none" != $("#colorBox2").css("display") && $("#td_TextColor").hasClass("iconPressed")){
			IsVisibleMenu = true;
			$("#td_TextColor").removeClass("iconPressed");
			$("#colorBox2").css("display","none");
			return false;
		}
		if ("none" != $("#colorBox2").css("display") && $("#td_paragraph").hasClass("iconPressed")){
			IsVisibleMenu = true;
			$("#td_paragraph").removeClass("iconPressed");
			$("#colorBox2").css("display","none");
			return false;
		}
	});
	$(".clrPicker2").click(function(){
		if (false == IsVisibleMenu){
			var ofset=$("#td_TextColor").offset();
			ofset.top += $("#td_TextColor").outerHeight() - 1;
			$("#colorBox2").css(ofset);
			$("#colorBox2").attr("init", "colorFont").show();
			$("#td_TextColor").addClass("iconPressed");
		}
		IsVisibleMenu = false;
	});
	$(".colorSelect2").click(function(){
		if($("#colorBox2").attr("init") == "colorFont"){
			$(".clrSelector2").children().css('border-bottom-color', $(this).children().css('backgroundColor'));
			$("#colorBox2").hide();
			$(".clrSelector2").click();
		}
		if($("#colorBox2").attr("init") == "colorParagraph"){
			$(".clrSelector3").children().css('border-bottom-color', $(this).children().css('backgroundColor'));
			$("#colorBox2").hide();
			$(".clrSelector3").click();
		}
	});
	$(".clrSelector2").click(function(){
		var color=$(this).children().css("border-bottom-color");
		var otd_color = $("#td_color");
		otd_color.blur();
		$("#td_TextColor").removeClass("iconPressed");
		// changeFontColor(a2,"text");
		var oColor = parseColor(color);
		if (null !== oColor)
			api.asc_setCellTextColor(new asc_CColor(oColor.r, oColor.g, oColor.b));
		return false;
	});
	$("#td_func_choose").mousedown(function () {
		if ("none" != $("#formulaList2").css("display")) {
			IsVisibleMenu = true;
			$("#td_Formulas").removeClass("iconPressed");
			$("#formulaList2").hide();
		}
	}).click(function () {
		if (false == IsVisibleMenu) {
			var offset = $("#td_Formulas").offset();
			offset.top += $("#td_Formulas").outerHeight() - 1;
			$("#formulaList2").css(offset).show();
			if ($(window).width() < $("#formulaList2").width() + $("#formulaList2").offset().left)
				$("#formulaList2").offset({ left: $("#formulaList2").offset().left - $("#formulaList2").width() + $("#td_Formulas").width() });
			$("#td_Formulas").addClass("iconPressed");
		}
		IsVisibleMenu = false;
	});
	$("#td_border_choose").mousedown(function () {
		if ("none" != $("#brd_options").css("display")) {
			$("#td_Border").removeClass('iconPressed');
			IsVisibleMenu = true;
		}
	}).click(function () {
		if (false == IsVisibleMenu) {
			var offset = $("#td_Border").offset();
			offset.top += $("#td_Border").outerHeight() - 1;
			$("#brd_options").css(offset).show();
			if ($(window).width() < $("#brd_options").width() + $("#brd_options").offset().left)
				$("#brd_options").offset({ left: $("#brd_options").offset().left - $("#brd_options").width() + $("#td_Border").width() });
			$("#td_Border").addClass('iconPressed');
		}
		IsVisibleMenu = false;
	});
	$("#brd_options .icon, #mnubrd_options .icon").click(function() {
		$("#td_cellBorder").attr("vid", this.id.slice(6));
		$("#td_cellBorder>div").removeClass().addClass("brdImg").addClass(this.id);
		$("#brd_options").hide();
		$("#td_Border").removeClass('iconPressed');
		$("#td_cellBorder").click();
	});
	$("#td_cellBorder").click(function() {
		var sNewVid = $(this).attr("vid");
		var val;
		switch(sNewVid){
			case "0":{
				api.asc_setCellBorders([]);
				break;
			}
			case "1":{
				val = [];
				val[c_oAscBorderOptions.Left] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thin, colorDefault);
				api.asc_setCellBorders(val);
				break;
			}
			case "4":{
				val = [];
				val[c_oAscBorderOptions.Top] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thin, colorDefault);
				api.asc_setCellBorders(val);
				break;
			}
			case "16":{
				val = [];
				val[c_oAscBorderOptions.Right] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thin, colorDefault);
				api.asc_setCellBorders(val);
				break;
			}
			case "64":{
				val = [];
				val[c_oAscBorderOptions.Bottom] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thin, colorDefault);
				api.asc_setCellBorders(val);
				break;
			}
			case "85":{
				val = [];
				val[c_oAscBorderOptions.Left] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thin, colorDefault);
				val[c_oAscBorderOptions.Top] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thin, colorDefault);
				val[c_oAscBorderOptions.Right] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thin, colorDefault);
				val[c_oAscBorderOptions.Bottom] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thin, colorDefault);
				api.asc_setCellBorders(val);
				break;
			}
			case "170":{
				val = [];
				val[c_oAscBorderOptions.Left] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thick, colorDefault);
				val[c_oAscBorderOptions.Top] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thick, colorDefault);
				val[c_oAscBorderOptions.Right] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thick, colorDefault);
				val[c_oAscBorderOptions.Bottom] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thick, colorDefault);
				api.asc_setCellBorders(val);
				break;
			}
			case "324":{
				val = [];
				val[c_oAscBorderOptions.DiagD] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thin, colorDefault);
				api.asc_setCellBorders(val);
				break;
			}
			case "341":{
				val = [];
				val[c_oAscBorderOptions.DiagU] = new window.Asc.asc_CBorder(c_oAscBorderStyles.Thin, colorDefault);
				api.asc_setCellBorders(val);
				break;
			}
		}
	});
	$("[id^=td_fmt_]").click(function() {
		remClassIconPress($("#td_fmt_digit").parent());
		remClassIconPress($("#td_fmt_date").parent());
		remClassIconPress($("#td_fmt_money").parent());
		$("#DigitList").hide();
		$("#DateList").hide();
		$("#MoneyList").hide();
	});
	$("#td_fmt_digit").mousedown(function () {
	if ("none" != $("#DigitList").css("display")) {
			IsVisibleMenu = true;
			remClassIconPress($(this).parent());
		}
	}).click(function () {
		if (false == IsVisibleMenu) {
			var offset = $(this).offset();
			offset.top += 24;
			offset.left -= 3;
			$("#DigitList").css(offset).show();
			if ($(window).width() < $("#DigitList").width() + $("#DigitList").offset().left)
				$("#DigitList").offset({ left: $("#DigitList").offset().left - $("#DigitList").width() + $("#td_fmt_digit").width() + 4 });
			addClassIconPress($(this).parent());
		}
		IsVisibleMenu = false;
	});
	$("#td_fmt_date").mousedown(function () {
		if ("none" != $("#DateList").css("display")) {
			IsVisibleMenu = true;
			remClassIconPress($(this).parent());
			$("#DateList").css("display","none");
		}
	}).click(function () {
		if (false == IsVisibleMenu) {
			var offset = $(this).offset();
			offset.top += 24;
			offset.left -= 3;
			$("#DateList").css(offset).show();
			if ($(window).width() < $("#DateList").width() + $("#DateList").offset().left)
				$("#DateList").offset({ left: $("#DateList").offset().left - $("#DateList").width() + $("#td_fmt_date").width() + 4 });
			addClassIconPress($(this).parent());
		}
		IsVisibleMenu = false;
	});
	$("#td_fmt_money").mousedown(function () {
		if ("none" != $("#MoneyList").css("display")) {
			IsVisibleMenu = true;
			remClassIconPress($(this).parent());
		}
	}).click(function () {
		if (false == IsVisibleMenu) {
			var offset = $("#td_fmt_money").offset();
			offset.top += 24;
			offset.left -= 3;
			$("#MoneyList").css(offset).show();
			if ($(window).width() < $("#MoneyList").width() + $("#MoneyList").offset().left)
				$("#MoneyList").offset({ left: $("#MoneyList").offset().left - $("#MoneyList").width() + $("#td_fmt_money").width() + 4 });
			addClassIconPress($(this).parent());
		}
		IsVisibleMenu = false;
	});
	$("#td_fmt_up").click(function(event) {
		api.asc_increaseCellDigitNumbers();
	});
	$("#td_fmt_down").click(function(event) {
		api.asc_decreaseCellDigitNumbers();
	});
	$("[fmt]").click(function() {
		remClassIconPress($("#td_fmt_digit").parent());
		remClassIconPress($("#td_fmt_date").parent());
		remClassIconPress($("#td_fmt_money").parent());
		$("#DigitList").hide();
		$("#DateList").hide();
		$("#MoneyList").hide();
		api.asc_setCellFormat(this.getAttribute("fmt"))
	});

	$("#td_function").click(function(){
		updateFormulaList();
		$("#formulaMore").dialog("open");
	});

	function updateFormulaList() {
		if (bIsInitFormulasList)
			return;
		var flist = api.asc_getFormulasInfo(), a;
		for(var i = 0; i < flist.length; i++){
			a = flist[i].asc_getFormulasArray();
			for(var n=0;n<a.length;n++){
				$("#fListMore").append("<div class ='formulaItem selectable' group='" + flist[i].asc_getGroupName() + "' name='" + a[n].asc_getName() + "' args='" +a[n].asc_getName()+ a[n].asc_getArguments() + "'>" + a[n].asc_getName()+ a[n].asc_getArguments() + "</div>");
				if ($("#formulaSelect option[value='" + flist[i].asc_getGroupName() + "']").length == 0) {
					$("#formulaSelect").append("<option value='" + flist[i].asc_getGroupName() + "'>" + flist[i].asc_getGroupName() + "</option>");
				}
			}
		}
		$("#formulaSelect").change(function() {
			if ($(this).val() == "All") $("#fListMore .formulaItem").show();
			else {
				$("#fListMore .formulaItem").hide();
				$("#fListMore .formulaItem[group='" + $(this).val() + "']").show();
			}
		});
		bIsInitFormulasList = true;
	}

	function formulaItemClick( oHandler ){
		if($(oHandler).attr("id")=="moreFunc"){
			updateFormulaList();

			$("#td_Formulas").removeClass("iconPressed");
			$("#formulaList1").hide();
			$("#formulaList2").hide();
			$("#formulaMore").dialog("open");
			return;
		}
		$("#formulaMore").dialog("close");
		var fn=$(oHandler).attr("name");
		$("#formulaList2").hide();
		api.asc_insertFormula(fn, true);
	}

	elem = document.getElementById('myCanvas');
	contextGrad = elem.getContext('2d');

	// Get the canvas element.
	if (!elem || !elem.getContext) {return;}
	// Get the canvas 2d context.

	if (!contextGrad) {return;}
	contextGrad.fillStyle = "#EEF0F2";
	contextGrad.fillRect(0, 0, elem.width, elem.height);
	gradient = contextGrad.createLinearGradient(160, 0, 150, 128);
	gradient.addColorStop(0, "rgb(255,255,255)");
	gradient.addColorStop(1, "rgb(0,0,0)");
	contextGrad.fillStyle = gradient;
	contextGrad.fillRect(160, 0, 9, 128);
	colorSelecterClick = false;
	$("#colorSelectHolder").on("click",function(evnt,ui){
		if(colorSelecterClick){colorSelecterClick = false; return false;}

		if(evnt.clientX-$("#colorSelectHolder").offset().left > 0 && $("#colorSelectHolder").offset().left + $("#colorSelectHolder").width() - evnt.clientX>0 )
			if(evnt.clientY-$("#colorSelectHolder").offset().top > 0 && $("#colorSelectHolder").offset().top + $("#colorSelectHolder").height() - evnt.clientY>0 )
				getColor(evnt.clientX-$("#colorSelectHolder").offset().left,evnt.clientY-$("#colorSelectHolder").offset().top);
			else return;
		else
			return;
		$("#colorSelecter").offset({top:evnt.clientY-8,left:evnt.clientX-8});
		setCurrentColor(newColorSelected.r,newColorSelected.g,newColorSelected.b);
	});

	$("#dialogColorSelector").dialog({autoOpen: false, width :'350px', title: "Color Selector",
		create:function(){setCurrentColor(newColorSelected.r,newColorSelected.g,newColorSelected.b);
		var rgb;
				for(var i=0;  i<=128; i++){
					for(var j=0;  j<=128; j++){
						rgb = hslTorgb(340*j/128, 100, 50+50*i/128);
						contextGrad.fillStyle = "rgb("+rgb.r+","+rgb.g+","+rgb.b+")";
						contextGrad.fillRect(j, i, 1, 1);
					}
				}
		},
		resizable: false, modal: true, closeOnEscape:true,
		dragStop: function(event, ui) {
			$("#colorSelecter").draggable( "option", "containment", [$("#colorSelecter").offsetParent().offset().left,$("#colorSelecter").offsetParent().offset().top,
																$("#colorSelecter").offsetParent().offset().left+127,$("#colorSelecter").offsetParent().offset().top+127] );
			$("#gradSelecter").draggable( "option", "containment", [$("#gradSelecter").offsetParent().offset().left,$("#gradSelecter").offsetParent().offset().top+1,
																$("#gradSelecter").offsetParent().offset().left+127,$("#gradSelecter").offsetParent().offset().top+128] );},
		open: function() {
			$("#redChannel").spinner({ min: 0, max: 255 }).change(function(){
				setColorFromRGB($("#redChannel").val(),$("#greenChannel").val(),$("#blueChannel").val());
				setCurrentColor(newColorSelected.r,newColorSelected.g,newColorSelected.b);
			});
			$("#greenChannel").spinner({ min: 0, max: 255 }).change(function(){
				setColorFromRGB($("#redChannel").val(),$("#greenChannel").val(),$("#blueChannel").val());
				setCurrentColor(newColorSelected.r,newColorSelected.g,newColorSelected.b);
			});
			$("#blueChannel").spinner({ min: 0, max: 255 }).change(function(){
				setColorFromRGB($("#redChannel").val(),$("#greenChannel").val(),$("#blueChannel").val());
				setCurrentColor(newColorSelected.r,newColorSelected.g,newColorSelected.b);
			});
			setLastColor(lastColorSelected.r,lastColorSelected.g,lastColorSelected.b);
			$("#colorSelecter").draggable( "option", "containment", [$("#colorSelecter").offsetParent().offset().left,$("#colorSelecter").offsetParent().offset().top+1,
																$("#colorSelecter").offsetParent().offset().left+127,$("#colorSelecter").offsetParent().offset().top+127] );
			$("#gradSelecter").draggable( "option", "containment", [$("#gradSelecter").offsetParent().offset().left,$("#gradSelecter").offsetParent().offset().top+1,
																$("#gradSelecter").offsetParent().offset().left+127,$("#gradSelecter").offsetParent().offset().top+128] );
		},
		close: function() {
			$(".PopUpMenuStyle, .PopUpMenuStyle2, .options, .icon_options").hide();
			// remIconPress();
			$("#td_BackgroundColor, #td_TextColor").removeClass("iconPressed");
		},
		buttons: [
		{
			text:"#ButtonOK",
			click: function(){
				lastColorSelected.r = newColorSelected.r;
				lastColorSelected.g = newColorSelected.g;
				lastColorSelected.b = newColorSelected.b;
				countCustomColor = $("#customColorFont").children()
				for (var i = countCustomColor.length-1; i >0; i--)
					$("#customColorFont").children()[i].children[0].style.backgroundColor = $("#customColorFont").children()[i-1].children[0].style.backgroundColor;
				$("#customColorFont").children()[0].children[0].style.backgroundColor = "rgb("+lastColorSelected.r+","+lastColorSelected.g+","+lastColorSelected.b+")";

				$(this).dialog("close");
				$("#customColorFont").children()[0].click();
			}
		},
		{
			text:"#ButtonCancel",
			click: function(){

				$(this).dialog("close");
			}
		}
		]
	});

	$("#gradSelecter").draggable({ zIndex: 2700,containment: [$("#gradSelecter").offsetParent().offset().left,$("#gradSelecter").offsetParent().offset().top+1,
																$("#gradSelecter").offsetParent().offset().left+127,$("#gradSelecter").offsetParent().offset().top+128],axis: 'y',
		drag:	function(event, ui) {
			gradSelectPosTop = ui.position.top
			getGradColor(gradSelectPosTop);
			setCurrentColor(newColorSelected.r,newColorSelected.g,newColorSelected.b);
		}
	});

	$("#colorSelecter").draggable({ zIndex: 2700,
		containment: /*[$("#colorSelecter").offsetParent().offset().left,$("#colorSelecter").offsetParent().offset().top+1,
																$("#colorSelecter").offsetParent().offset().left+127,$("#colorSelecter").offsetParent().offset().top+127]*/"parent",
		stop: 	function(event, ui) {
			getColor(ui.position.left,ui.position.top);
			colorSelecterClick = false;
			setCurrentColor(newColorSelected.r,newColorSelected.g,newColorSelected.b);
		},
		drag:	function(event, ui) {
			getColor(ui.position.left,ui.position.top);
			setCurrentColor(newColorSelected.r,newColorSelected.g,newColorSelected.b);
		}
	});
	$("#dialogNewColorOpen").click(function(){$("#dialogColorSelector").dialog("open")})
	$("#dialogNewColorOpen, .none").mouseenter(function(){$(this).css({"background-color":"#4D81A5","color":"#fff"})}).mouseleave(function(){$(this).css({"background-color":"#fff","color":"#000"})})

	$("#formulaMore").dialog(
		{ autoOpen: false, height: 355, width: 335,
			resizable: false, modal: false, closeOnEscape: false, title: "Function",
			open: function() {  }, dialogClass: 'dialogClass',
			close: function() {  }
		}
	);

	$("#dialogSaveCsv").dialog(
		{ autoOpen: false, height: 355, width: 335,
			resizable: false, modal: false, closeOnEscape: false, title: "Function",
			open: function() {  }, dialogClass: 'dialogClass',
			close: function() {  },
			buttons: [
			{
				text: "Ok",
				click: function() {
					if ("open" == $("#dialogSaveCsv").attr("typeDialog"))
						api.asc_setAdvancedOptions( c_oAscAdvancedOptionsID.CSV,new Asc.asc_CCSVAdvancedOptions( $("#pageCodeSelect").val(), $("#DelimiterList").val() ) );
					else
						api.asc_DownloadAs(c_oAscFileType.CSV, new Asc.asc_CCSVAdvancedOptions( $("#pageCodeSelect").val(), $("#DelimiterList").val() ));
					$(this).dialog("close");
				}
			},
			{
				text: "Cancel",
				btCancel: "classButtonCancel",
				click: function() { $(this).dialog("close"); }
			}
		]
		}
	);

	$("#dialogAddHyperlink").dialog({ autoOpen: false, title: "Add Link",
		resizable: false, modal: true, width: '590px', closeOnEscape: true, dialogClass: "dialogClass",
		open: function() {  },
		close: function() { api.asc_enableKeyEvents(true); },
		buttons: [
			{
				text: "Ok",
				click: function() { onDialogAddHyperlink(); }
			},
			{
				text: "Cancel",
				btCancel: "classButtonCancel",
				click: function() { $(this).dialog("close"); }
			}
		]
	});

	$("#ConfirmMess").dialog({ autoOpen: false, title: "Confirm replace cells",
		resizable: false, modal: true, width: '590px', closeOnEscape: true, dialogClass: "dialogClass",
		open: function() { api.asc_enableKeyEvents(false); },
		close: function() { api.asc_enableKeyEvents(true); }
	});

	$("#dialogRenameWS input")
		.focus(function(){api.asc_enableKeyEvents(false);})
		.blur(function(){api.asc_enableKeyEvents(true);})
		.val("")
	$("#cc1")
		.focus(function(){api.asc_enableKeyEvents(false);})
		.blur(function(){api.asc_enableKeyEvents(true);})
		.change(function(){api.asc_findCell( $(this).val() );})
		.val("");

	function setLastColor(red,green,blue){
		$("#lastColor").css("background-color","rgb("+red+","+green+","+blue+")");
	}
	function setCurrentColor(red,green,blue){
		$("#currentColor").css("background-color","rgb("+red+","+green+","+blue+")");
	}
	function setColorFromRGB(red,green,blue){
		newColorSelected.r = red;
		newColorSelected.g = green;
		newColorSelected.b = blue;
	}
	function getColor(posLeft,posTop){
		var data = contextGrad.getImageData(posLeft, posTop, 1, 1).data;
		document.getElementById("redChannel").value = data[0];
		document.getElementById("greenChannel").value = data[1];
		document.getElementById("blueChannel").value = data[2];
		gradient.addColorStop(0, "rgb("+data[0]+","+data[1]+","+data[2]+")");
		gradient.addColorStop(1, "rgb(0,0,0)");
		contextGrad.fillStyle = gradient;
		contextGrad.fillRect(160, 0, 9, 128);
		getGradColor(gradSelectPosTop);
	}
	function getGradColor(posTop){
		var data = contextGrad.getImageData(165, posTop, 1, 1).data;
		document.getElementById("redChannel").value = data[0];
		document.getElementById("greenChannel").value = data[1];
		document.getElementById("blueChannel").value = data[2];
		setColorFromRGB(data[0],data[1],data[2])
	}
	function getMousePos(canvas, evt){
		obj = canvas;
		var top = canvas.offsetTop;
		var left = canvas.offsetLeft;
		mouseX = evt.clientX - left + window.pageXOffset;
		mouseY = evt.clientY - top + window.pageYOffset;
		return {
			x: mouseX,
			y: mouseY
		};
	}
	function hslTorgb(h,s,l) {
		/*h=[0..360] s=[0..100] l=[0..100]*/
		  h = h/360;
		  s = s/100;
		  l = l/100;

		  var R, G, B, Q;

		  if(s == 0.0) {
			R = G = B = l;
		  }
		  else {
			  if (l<=0.5) {
				Q = l*(s+1);
			  }
			  else {
				Q = l+s-l*s;
			  }
			  var P = l*2 - Q;
			  R = hue(P, Q, (h+1/3));
			  G = hue(P, Q, h);
			  B = hue(P, Q, (h-1/3));
		  }

		  R=Math.round(R*255);
		  G=Math.round(G*255);
		  B=Math.round(B*255);

		  return {r:R,g:G,b:B};
	}
	function hue(P, Q, h) {
		if (h<0) { h = h+1; }
		if (h>1) { h = h-1; }
		if (h*6<1) { return P+(Q-P)*h*6; }
		if (h*2<1) { return Q; }
		if (h*3<2) { return P+(Q-P)*(2/3-h)*6; }
		return P;
	}

	$(".formulaItem").bind("click", function() { formulaItemClick(this); });
	$("#mnuAddHyperlink").bind("click", function() {
		$("#td_add_hyperlink").click();
	});

	function onDialogAddHyperlink() {
		var sText = $("#addHyperlink_text").val();
		var sUrl = $("#addHyperlink_url").val();
		var sSheet = $("#addHyperlink_she").val();
		var sRange = $("#addHyperlink_ran").val();
		var oTmpHyperlinkObj = null;

		var bHyp = false;
		if(  document.getElementById('selectTypeLink').selectedIndex == 0)
			bHyp = true;
		if( 0 == sText.length ) {
			$("#addHyperlink_err").text( "Error: Empty text" );
			$("#addHyperlink_err").hide();
			$("#addHyperlink_err").show( "slow" );
		}
		else if( true == bHyp && "" == sUrl ) {
			$("#addHyperlink_err").text( "Error: Empty url" )
			;$("#addHyperlink_err").hide();
			$("#addHyperlink_err").show("slow");
		} else {
			$("#addHyperlink_err").hide();
			$("#dialogAddHyperlink").dialog("close");

			oTmpHyperlinkObj = new Asc.asc_CHyperlink();
			oTmpHyperlinkObj.asc_setText (sText);
			if (true == bHyp) {
				if (0 != sUrl.indexOf("http://"))
					sUrl = "http://" + sUrl;
				oTmpHyperlinkObj.asc_setHyperlinkUrl(sUrl);
			} else {
				oTmpHyperlinkObj.asc_setSheet(sSheet);
				oTmpHyperlinkObj.asc_setRange(sRange);
			}

			api.asc_insertHyperlink(oTmpHyperlinkObj);
			api.asc_enableKeyEvents(true);
		}
	}

	function toggleHyperlinkDialog( bHyp ){
		if( true == bHyp )
		{
			document.getElementById('selectTypeLink').selectedIndex = 0;
			$("#urlLink").css("display","block");
			$("#locationLink").css("display","none");
			$("#addHyperlink_url" ).removeAttr( "disabled" );
			$("#addHyperlink_she,#addHyperlink_ran" ).attr( "disabled", "disabled" );
		}
		else
		{
			document.getElementById('selectTypeLink').selectedIndex = 1;
			$("#urlLink").css("display","none");
			$("#locationLink").css("display","block");
			$("#addHyperlink_url" ).attr( "disabled", "disabled" );
			$("#addHyperlink_she,#addHyperlink_ran" ).removeAttr( "disabled" );
		}
	}

	$("#selectTypeLink").change(function() {
		switch (this.selectedIndex) {
			case 0: toggleHyperlinkDialog(true); break;
			case 1: toggleHyperlinkDialog(false); break;
		}
	});
	
	function BuildDrawingObjectLayerMenu() {
		var menu = $(
			"<div id='drawingObjectsLayerMenu'>\
					<input type='radio' name='layerRadio' id='BringToFront' checked style='margin-left: 10px;'>BringToFront<br>\
					<input type='radio' name='layerRadio' id='SendToBack' style='margin-left: 10px;'>SendToBack<br>\
					<input type='radio' name='layerRadio' id='BringForward' style='margin-left: 10px;'>BringForward<br>\
					<input type='radio' name='layerRadio' id='SendBackward' style='margin-left: 10px;'>SendBackward<br>\
			</div>");

		$("body").append(menu);
	}

	function showDrawingLayerDialog() {
		BuildDrawingObjectLayerMenu();

		$("#drawingObjectsLayerMenu").dialog({ autoOpen: false, closeOnEscape: true, height: 'auto', width: 400,
					resizable: false, modal: true, title: "Drawing layer", draggable: true,
					open: function() {
					},
					buttons: [
						{
							text: "Ok",
							click: function() {

								var layerForm = $("#drawingObjectsLayerMenu");

								if ( layerForm.find("#BringToFront").is(":checked") )
									api.asc_setSelectedDrawingObjectLayer(c_oAscDrawingLayerType.BringToFront);
								else if ( layerForm.find("#SendToBack").is(":checked") )
									api.asc_setSelectedDrawingObjectLayer(c_oAscDrawingLayerType.SendToBack);
								else if ( layerForm.find("#BringForward").is(":checked") )
									api.asc_setSelectedDrawingObjectLayer(c_oAscDrawingLayerType.BringForward);
								else if ( layerForm.find("#SendBackward").is(":checked") )
									api.asc_setSelectedDrawingObjectLayer(c_oAscDrawingLayerType.SendBackward);

								$(this).dialog("close");
							}
						},
						{
							text: "Cancel",
							click: function() {
								$(this).dialog("close");
							}
						}
					],
					close: function() {
						$("#drawingObjectsLayerMenu").remove();
					},
					create: function() {
					}
		});
		$("#drawingObjectsLayerMenu").dialog("open");
	}

	function onChangeView () {
		var showGridLines = document.getElementById("showGridLines");
		var showHeaders = document.getElementById("showHeaders");
		g_sheetViewSettings.asc_setShowGridLines(showGridLines.checked);
		g_sheetViewSettings.asc_setShowRowColHeaders(showHeaders.checked);
		api.asc_setSheetViewSettings(g_sheetViewSettings);
	}
	
	// Comments
	
	var g_commentsEditorId = "commentsEditor";
	var g_commentsTooltipId = "commentsTooltip";
	
	function getDate() {
		var objToday = new Date(),
        weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        dayOfWeek = weekday[objToday.getDay()],
        domEnder = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'],
        dayOfMonth = today + (objToday.getDate() < 10) ? '0' + objToday.getDate() + domEnder[objToday.getDate()] : objToday.getDate() + domEnder[parseFloat(("" + objToday.getDate()).substr(("" + objToday.getDate()).length - 1))],
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        curMonth = months[objToday.getMonth()],
        curYear = objToday.getFullYear(),
        curHour = objToday.getHours() > 12 ? objToday.getHours() - 12 : (objToday.getHours() < 10 ? "0" + objToday.getHours() : objToday.getHours()),
        curMinute = objToday.getMinutes() < 10 ? "0" + objToday.getMinutes() : objToday.getMinutes(),
        curSeconds = objToday.getSeconds() < 10 ? "0" + objToday.getSeconds() : objToday.getSeconds(),
        curMeridiem = objToday.getHours() > 12 ? "PM" : "AM";
		//var today = curHour + ":" + curMinute + "." + curSeconds + " " + curMeridiem + " " + dayOfWeek + " " + dayOfMonth + " " + curMonth + " " + curYear;
		
		var day = (objToday.getDate() < 10) ? '0' + objToday.getDate() : objToday.getDate();
		var month = (objToday.getMonth() < 10) ? '0' + objToday.getMonth() : objToday.getMonth();
		var today = day + "/" + month + "/" + curYear + " " + curHour + ":" + curMinute + " " + curMeridiem;
		return today;
	}
	
	function InsertComment(commentObject, containerId) {
		
		var container = $("#" + containerId);
		var commentBlock = document.createElement("div");
		container.append(commentBlock);

		commentBlock.id = commentObject.asc_getId();
		commentBlock.style["float"]  = "left";
		commentBlock.style["width"] = (container.width() - commentObject.asc_getLevel() * 10) + "px";
		commentBlock.style["height"] = "100%";
		commentBlock.style["padding"] = "0";
		commentBlock.style["margin"] = "0 0 4px " + commentObject.asc_getLevel() * 10 + "px";
		
		var title = document.createElement("span");
		title.textContent = commentObject.asc_getUserName() + " (" + commentObject.asc_getTime() + "):";
		commentBlock.appendChild(title);
		title.style["float"]  = "left";
		title.style["margin-top"]  = "4px";
		title.style["width"] = (container.width() - commentObject.asc_getLevel() * 10 - 10) + "px";
		title.style["fontSize"]  = "11px";
		title.style["fontStyle"]  = "Italic";		
		title.style["fontWeight"]  = "Bold";
		title.style["color"]  = "Red";
		
		var textArea = document.createElement("textarea");
		textArea.value = commentObject.asc_getText();
		commentBlock.appendChild(textArea);
		textArea.style["float"]  = "left";
		textArea.style["border"] = "1px solid Silver";
		textArea.style["width"] = (container.width() - commentObject.asc_getLevel() * 10 - 2) + "px";
		textArea.style["padding"] = "0px";
		textArea.style["height"] = "100%";
		textArea.style["margin"] = "2px 0 0 0";
		textArea.focus();
		textArea.onchange = function() {
			var t = this;
			
			var comment = api.asc_findComment(commentObject.asc_getId());
			comment = new window.Asc.asc_CCommentData(comment);
			comment.asc_putUserId(api.UserId);
			comment.asc_putUserName("You");
			comment.asc_putTime(getDate());
			comment.asc_putText(t.value);
			
			api.asc_changeComment(commentObject.asc_getId(), comment);
		};

		// Buttons
		var replyBtn = document.createElement("input"); 
		commentBlock.appendChild(replyBtn);
		replyBtn.type = "submit";
		replyBtn.value = "Reply";
		replyBtn.style["margin"] = "0 4px 0 0";
		replyBtn.onclick = function() {
			var parentComment = api.asc_findComment(commentObject.asc_getId());
			
			var reply = new window.Asc.asc_CCommentData();
			reply.asc_putUserId(api.UserId);
			reply.asc_putUserName("You");
			reply.asc_putTime(getDate());
			
			parentComment.asc_addReply(reply);
			InsertComment(reply, commentObject.asc_getId());
		};

		var deleteBtn = document.createElement("input");
		commentBlock.appendChild(deleteBtn);		
		deleteBtn.type = "submit";
		deleteBtn.value = "Delete";
		deleteBtn.style["margin"] = 0;
		deleteBtn.onclick = function() {		
			RecalcCommentEditor();		
			var result = api.asc_removeComment(commentObject.asc_getId());			
			$("#" + commentObject.asc_getId()).remove();
		};

		var count = commentObject.asc_getRepliesCount();
		for (var i = 0; i < count; i++) {
			InsertComment(commentObject.asc_getReply(i), commentObject.asc_getId());
		}
	}
	
	function showCommentDialog(bDocument) {
		
		menu = $("<div id='cellComment'>\
				<input id='showComments' type='checkbox' onchange='' checked='true'><span style='font-size: 11px;'>Show comments</span><br>\
				<input id='addComment' type='submit' onclick='' value='Add new comment'>\
				</div>");
		
		$("body").append(menu);		
		var cellComment = $("#cellComment");
		
		var workbookComments = api.asc_getWorkbookComments();

		$("#cellComment").dialog({ autoOpen: false, closeOnEscape: true, height: 'auto', width: 400, position: "right top",
					resizable: false, modal: true, title: bDocument ? "Document comments" : "Cell comments", draggable: true,
					open: function() {
										
						api.asc_enableKeyEvents(false);
						var commentList = bDocument ? api.asc_getDocumentComments() : api.asc_getComments();
						
						var addBtn = cellComment.find("#addComment");
						addBtn[0].onclick = function() {
						
							var comment = new window.Asc.asc_CCommentData();
							comment.asc_putText("");
							comment.asc_putUserId(api.UserId);
							comment.asc_putUserName("You");
							comment.asc_putTime(getDate());
							comment.asc_putDocumentFlag(bDocument);
							api.asc_addComment(comment);
							
							InsertComment(comment, "cellComment");
						};
						
						for (var i = 0; i < commentList.length; i++) {
							InsertComment(commentList[i], "cellComment");
						}
						
						var showBtn = cellComment.find("#showComments");
						showBtn[0].onchange = function() {
							if (this.checked)
								api.asc_showComments();
							else
								api.asc_hideComments();
						}
						
					},
					close: function() {
						cellComment.remove();
						api.asc_enableKeyEvents(true);
					},
					create: function() {
					}
		});
		cellComment.dialog("open");
	}
	
	// Comment events
	function eventMouseMoveComment(mouseMoveObjects) {

		var nIndex = 0;
		var mouseMoveObject = undefined;
		var commentBlock = $("#" + g_commentsEditorId);
		if ( commentBlock.length > 0 )
			return;
			
		ClearTooltip();

		for (; nIndex < mouseMoveObjects.length; ++nIndex) {
			mouseMoveObject = mouseMoveObjects[nIndex];
			if ( mouseMoveObject.type == c_oAscMouseMoveType.Comment ) {

				var indexes = mouseMoveObject.asc_getCommentIndexes();

				var commentList = [];
				var cellCommentator = api.wb.getWorksheet().cellCommentator;
				for (var i = 0; i < indexes.length; i++) {
					commentList.push(api.asc_findComment(indexes[i]));
				}
				var commentCoords = cellCommentator.getCommentsCoords(commentList);

				if ( indexes.length > 0 ) {

					if ( commentBlock.length > 0 )
						commentBlock.remove();

					var padding = 2;
					var canvasWidget = $("#" + api.HtmlElementName);

					commentBlock = document.createElement("div");
					commentBlock.id = g_commentsTooltipId;

					commentBlock.style["width"] = (commentCoords.asc_getWidthPX() + 2 * padding) + "px";
					commentBlock.style["height"] = (commentCoords.asc_getHeightPX() + 2 * padding) + "px";

					commentBlock.style["zIndex"] = "3000";
					commentBlock.style["padding"] = padding + "px";
					commentBlock.style["border"] = "1px solid Grey";
					commentBlock.style["backgroundColor"] = "#FFFF99";
					commentBlock.style["position"] = "absolute";
					commentBlock.style["top"] = (commentCoords.asc_getTopPX() + cellCommentator.mmToPx(commentCoords.asc_getTopOffset()) + canvasWidget.offset().top) + "px";
					commentBlock.style["left"] = (commentCoords.asc_getLeftPX() + cellCommentator.mmToPx(commentCoords.asc_getLeftOffset()) + canvasWidget.offset().left) + "px";
					$("body").append(commentBlock);

					function drawComment(comment) {

						var commentAuthor = comment.asc_getUserName() + (comment.asc_getTime() ? " (" + comment.asc_getTime() + ")" : "") + ":";

						// Font
						var title = document.createElement("div");
						title.innerHTML = "<span>" + commentAuthor + "</span><br>";
						title.style["fontFamily"]  = "Tahoma";
						title.style["fontSize"]  = "11px";
						title.style["fontWeight"]  = "Bold";
						title.style["padding"]  = "1px 0";
						commentBlock.appendChild(title);

						var commentSpl = comment.asc_getText().split('\n');
						for (var i = 0; i < commentSpl.length; i++) {

							var text = document.createElement("div");
							text.innerHTML = "<span>" + commentSpl[i] + "</span><br>";
							text.style["fontFamily"]  = "Tahoma";
							text.style["fontSize"]  = "11px";
							text.style["padding"]  = "1px 0";
							commentBlock.appendChild(text);
						}

						var count = comment.asc_getRepliesCount();
						for (var i = 0; i < count; i++) {
							drawComment(comment.asc_getReply(i));
						}
					}

					for (var i = 0; i < indexes.length; i++) {
						var comment = api.asc_findComment(indexes[i]);
						drawComment(comment);
					}

					// min
					if ( commentBlock.clientWidth < 160 )
						commentBlock.style["width"] = "160px"
					if ( commentBlock.clientHeight < 80 )
						commentBlock.style["height"] = "80px";
				}
			}
		}
	}
		
	function eventAddComment(id, oComment) {
		var nId = id;
	}
	
	function eventRemoveComment(id) {
		var nId = id;
	}
	
	function eventChangeCommentData(id, oComment) {
		
		var count = oComment.asc_getRepliesCount();
		
	}
	
	function eventUpdateCommentPosition(indexes, x, y, x2) {
		ClearCommentEditor();
		eventShowComment(indexes, x, y);
	}
	
	function eventShowComment(indexes, x, y) {
	
		ClearTooltip();
		if (ClearCommentEditor())
			return;
			
		if ((x < 0) || (y < 0))
			return;
				
		var canvasWidget = $("#" + api.HtmlElementName);
		
		var commentBlock = document.createElement("div");
		commentBlock.id = g_commentsEditorId;
		commentBlock.style["width"] = "300px";
		commentBlock.style["height"] = "auto";
		commentBlock.style["zIndex"] = "3000";
		commentBlock.style["padding"] = "2px";
		commentBlock.style["border"] = "1px solid Grey";
		commentBlock.style["backgroundColor"] = "#FFFF99";
		commentBlock.style["position"] = "absolute";
		commentBlock.style["top"] = (y + canvasWidget.offset().top) + "px";
		commentBlock.style["left"] = (x + canvasWidget.offset().left) + "px";
		$("body").append(commentBlock);
		
		// Editor
		var editorBlock = $("<div id='cellComment'>\
								<input id='showComments' type='checkbox' onchange='' checked='true'><span style='font-size: 11px;'>Show comments</span><br>\
								<input id='addComment' type='submit' onclick='' value='Add new comment'>\
							</div>");
		
		$("#" + g_commentsEditorId).append(editorBlock);
		
		api.asc_enableKeyEvents(false);
						
		var addBtn = editorBlock.find("#addComment");
		addBtn[0].onclick = function() {
		
			var comment = new window.Asc.asc_CCommentData();
			comment.asc_putText("");
			comment.asc_putUserId(api.UserId);
			comment.asc_putUserName("You");
			comment.asc_putTime(getDate());
			comment.asc_putDocumentFlag(false);
			api.asc_addComment(comment);
							
			InsertComment(comment, "cellComment");
			if (commentBlock.clientHeight > 400) {
				commentBlock.style["height"] = "500px";
				commentBlock.style["width"] = "320px";
				commentBlock.style["overflowY"] = "scroll";
				commentBlock.style["overflowX"] = "hidden";
			}
		}
		
		if (indexes.length)
			api.asc_selectComment(indexes[0]);
						
		for (var i = 0; i < indexes.length; i++) {
			var comment = api.asc_findComment(indexes[i]);
			InsertComment(comment, "cellComment");
			if (commentBlock.clientHeight > 400) {
				commentBlock.style["height"] = "500px";
				commentBlock.style["width"] = "320px";
				commentBlock.style["overflowY"] = "scroll";
				commentBlock.style["overflowX"] = "hidden";
			}
		}

		var showBtn = editorBlock.find("#showComments");
		showBtn[0].onchange = function() {
		if (this.checked)
			api.asc_showComments();
		else
			api.asc_hideComments();
		}
	}
	
	function eventHideComment() {
		ClearCommentEditor();
	}
	
	// Misc
	function ClearTooltip() {
		var bResult = false;
		var commentBlock = $("#" + g_commentsTooltipId);
		if ( commentBlock.length > 0 ) {
			commentBlock.remove();
			bResult = true;
		}
		return bResult;
	}
	
	function ClearCommentEditor() {
		var bResult = false;
		var commentBlock = $("#" + g_commentsEditorId);
		if ( commentBlock.length > 0 ) {
			commentBlock.remove();
			api.asc_enableKeyEvents(true);
			bResult = true;
		}
		return bResult;
	}
	
	function RecalcCommentEditor() {
		
		var commentEditor = $("#" + g_commentsEditorId);
		if (commentEditor.length > 0) {
			
			commentEditor[0].style["overflow"] = "hidden";
			commentEditor[0].style["height"] = "auto";
			commentEditor[0].style["width"] = "300px";
			
			if (commentEditor[0].clientHeight > 400) {
				commentEditor[0].style["height"] = "500px";
				commentEditor[0].style["width"] = "320px";
				commentEditor[0].style["overflowY"] = "scroll";
				commentEditor[0].style["overflowX"] = "hidden";
			}
		}
	}
	
	function showAddFilterDialog(){
		var defaultStyle = "TableStyleLight2";
		var addFilterDialog = $("#addFilterDialog");
		var addFilterOptions = api.asc_getAddFormatTableOptions();
		//открываем диалоговое окно
		var range = addFilterOptions.asc_getRange();
		var isTitle = addFilterOptions.asc_getIsTitle();
		var isTitleElem = addFilterDialog.find('#isTitle');
		if(isTitle)//в таком случае не ставим галочку
			isTitleElem.attr('checked',false);
		else
			isTitleElem.attr('checked',true);
		addFilterDialog.find('#formatTableRange').val(range);
		//addFilterDialog.dialog("open");
		
		addFilterDialog.dialog({ autoOpen: false, closeOnEscape: false, dialogClass: 'dialogClass',
			open: function() { 
				api.asc_setSelectionDialogMode(c_oAscSelectionDialogType.FormatTable, null);
				aDialogNames.push("addFilterDialog"); 
			},
			close: function() { aDialogNames.pop(); api.asc_setSelectionDialogMode(c_oAscSelectionDialogType.None, null);},
			resizable: false, modal: false, width: '350px',
			buttons: [
				{
					text: 'Ok',
					click: function() {
						var isTitle = true;
						var defaultStyle = "TableStyleLight1";
						if($('#isTitle')[0].checked)
							isTitle = false;
						addFilterOptions.asc_setRange(addFilterDialog.find('#formatTableRange').val());
                        addFilterOptions.asc_setIsTitle(isTitle);
						api.asc_addAutoFilter(defaultStyle, addFilterOptions);
						$(this).dialog("close");
					}
				},
				{
					text: 'Cancel',
					btCancel: "classButtonCancel",
					click: function() { $(this).dialog("close"); }
				}
			]
		});
		addFilterDialog.dialog("open");
	}
	
	// Charts
	function showChartDialog() {
        var chart;
        ExecuteNoHistory(function(){chart = api.asc_getChartObject();}, this, []);

		var objectsExist = api.asc_drawingObjectsExist();
		if (!chart)		// selected image
			return;
		bIsUpdateChartProperties = true;
		var chartForm = $("#chartSelector");
		chartForm.find("#changeRange").removeClass("ToolbarChangeRange2").addClass("ToolbarChangeRange");
		chartForm.find("#switchTypeField").show();
		chartForm.find("#gridField").show();
		chartForm.find("#axisField").show();
		chartForm.find("#titlesField").show();
		chartForm.find("#legendField").show();
		chartForm.find("#typeField").show();
	//
	//	function setTitleFont() { showChartFontDialog(chart.asc_getHeader().asc_getFont()) }
	//	function setAxisXFont() { showChartFontDialog(chart.asc_getXAxis().asc_getTitleFont()) }
	//	function setAxisYFont() { showChartFontDialog(chart.asc_getYAxis().asc_getTitleFont()) }
    //
		api.asc_setSelectionDialogMode(c_oAscSelectionDialogType.Chart, null);

		chartForm.css("visibility", "visible");
		chartForm.dialog({ autoOpen: false, closeOnEscape: true, height: 'auto', width: 400,
					resizable: false, modal: true, title: "Chart properties", draggable: true,
					open: function() {
						if (!bIsUpdateChartProperties)
							return;
							
						// chart font binding
						//chartForm.find("#chartTitleFont").bind("click", setTitleFont);
						//chartForm.find("#chartAxisXFont").bind("click", setAxisXFont);
						//chartForm.find("#chartAxisYFont").bind("click", setAxisYFont);
						
						bIsUpdateChartProperties = false;
						api.asc_enableKeyEvents(false);

						//var range = chart.asc_getRange();
						//var interval = range.asc_getInterval();
                        //
						//chartForm.find("#chartRange").val(interval);
                        //
						//chartForm.find("#chartRange").bind("keyup", function() {
						// ToDo asc_checkChartInterval -> asc_checkDataRange
						//	var result = api.asc_checkChartInterval(chartForm.find("#chartType").val(), chartForm.find("#chartSubType").val(), chartForm.find("#chartRange").val(), chartForm.find("#dataRows").is(":checked"));
						//	if (result)
						//		chartForm.find("#chartRange").css("color", "black");
						//	else
						//		chartForm.find("#chartRange").css("color", "red");
						//});

						// Check selected
					//	if (chart.type) {

						//	if (range.rows)
						//		chartForm.find("#dataRows").attr("checked", range.asc_getRowsFlag());
						//	else
						//		chartForm.find("#dataColumns").attr("checked", range.asc_getColumnsFlag());
                        //
						//	chartForm.find("#chartTitle").val(chart.asc_getHeader().asc_getTitle());
						//	chartForm.find("#valueShow").attr("checked", chart.asc_getShowValueFlag());
						//	chartForm.find("#borderShow").attr("checked", chart.asc_getShowBorderFlag());
                        //
						//	var xAxis = chart.asc_getXAxis();
						//	chartForm.find("#xAxisShow").attr("checked", xAxis.asc_getShowFlag());
						//	chartForm.find("#xGridShow").attr("checked", xAxis.asc_getGridFlag());
						//	chartForm.find("#xAxisTitle").val(xAxis.asc_getTitle() ? xAxis.asc_getTitle() : "");
                        //
						//	var yAxis = chart.asc_getYAxis();
						//	chartForm.find("#yAxisShow").attr("checked", yAxis.asc_getShowFlag());
						//	chartForm.find("#yGridShow").attr("checked", yAxis.asc_getGridFlag());
						//	chartForm.find("#yAxisTitle").val(yAxis.asc_getTitle() ? yAxis.asc_getTitle() : "");
						//}
						//else {
						//	chartForm.find("#dataRows").attr("checked", true);
						//}
					},
					buttons: [
						{
							text: "Ok",
							click: function() {
                                api.asc_addChartDrawingObject(chart);
								$(this).dialog("close");
							}
						},
						{
							text: "Cancel",
							click: function() {
								$(this).dialog("close");
							}
						}
					],
					close: function() {
						if (!bIsReopenDialog)
							api.asc_setSelectionDialogMode(c_oAscSelectionDialogType.None, null);
						api.asc_enableKeyEvents(true);
						
						// chart font unbinding
						//chartForm.find("#chartTitleFont").unbind("click", setTitleFont);
						//chartForm.find("#chartAxisXFont").unbind("click", setAxisXFont);
						//chartForm.find("#chartAxisYFont").unbind("click", setAxisYFont);
					},
					create: function() {
					}
		});
		chartForm.dialog("open");
	}
	
	function showChartFontDialog(fontObject) {
		
		var chartFontForm = $("#chartFontSelector");	

		chartFontForm.css("visibility", "visible");
		chartFontForm.dialog({ autoOpen: false, closeOnEscape: true, height: 'auto', width: 190,
					resizable: false, modal: true, title: "Chart font", draggable: true,
					open: function() {
						chartFontForm.find("#fontName").val(fontObject.asc_getName());
						chartFontForm.find("#fontSize").val(fontObject.asc_getSize());
						chartFontForm.find("#fontColor").val(fontObject.asc_getColor());
						
						chartFontForm.find("#fontBold").attr("checked", fontObject.asc_getBold() == 1);
						chartFontForm.find("#fontItalic").attr("checked", fontObject.asc_getItalic() == 1);
						chartFontForm.find("#fontUnderline").attr("checked", fontObject.asc_getUnderline() == 1);
					},
					buttons: [
						{
							text: "Ok",
							click: function() {
								
								fontObject.asc_setName( chartFontForm.find("#fontName").val() );
								fontObject.asc_setSize( parseInt(chartFontForm.find("#fontSize").val()) );
								fontObject.asc_setColor( chartFontForm.find("#fontColor").val() );
								
								fontObject.asc_setBold(chartFontForm.find("#fontBold").is(":checked") ? 1 : 0);
								fontObject.asc_setItalic(chartFontForm.find("#fontItalic").is(":checked") ? 1 : 0);
								fontObject.asc_setUnderline(chartFontForm.find("#fontUnderline").is(":checked") ? 1: 0);
								
								$(this).dialog("close");
							}
						},
						{
							text: "Cancel",
							click: function() {
								$(this).dialog("close");
							}
						}
					],
					close: function() {
						if (!bIsReopenDialog)
							api.asc_setSelectionDialogMode(c_oAscSelectionDialogType.None, null);
						api.asc_enableKeyEvents(true);
					},
					create: function() {
					}
		});
		chartFontForm.dialog("open");
	}
		
	// Images
	function showImageUrlDialog() {
		var imageForm = $("#imageSelector");
		imageForm.css("visibility", "visible");
		imageForm.dialog({ autoOpen: false, closeOnEscape: true, height: 160, width: 400,
					resizable: false, modal: true, title: "Add image", draggable: true,
					open: function() {
						$("#imageSelectorUrl").val("");
						api.asc_enableKeyEvents(false);
					},
					buttons: [
						{
							text: "Ok",
							click: function() {

								var imageUrl = $("#imageSelectorUrl").val();
								api.asc_addImageDrawingObject(imageUrl);

								$(this).dialog("close");
							}
						},
						{
							text: "Cancel",
							click: function() {
								$(this).dialog("close");
							}
						}
					],
					close: function() {
						api.asc_enableKeyEvents(true);
					},
					create: function() {
						$("#imageSelectorUrl").val("");
					}
		});
		imageForm.dialog("open");
	}

	$("#changeRange").click(function () {
		bIsReopenDialog = true;

		var selector = $(this);
		var chartForm = $("#chartSelector");
		if (selector.hasClass("ToolbarChangeRange")) {
			selector.removeClass("ToolbarChangeRange").addClass("ToolbarChangeRange2");
			chartForm.find("#switchTypeField").hide();
			chartForm.find("#gridField").hide();
			chartForm.find("#axisField").hide();
			chartForm.find("#titlesField").hide();
			chartForm.find("#legendField").hide();
			chartForm.find("#typeField").hide();

			chartForm.dialog("option", "modal", false);
			chartForm.dialog("close").dialog("open");
		} else {
			selector.removeClass("ToolbarChangeRange2").addClass("ToolbarChangeRange");
			chartForm.find("#switchTypeField").show();
			chartForm.find("#gridField").show();
			chartForm.find("#axisField").show();
			chartForm.find("#titlesField").show();
			chartForm.find("#legendField").show();
			chartForm.find("#typeField").show();

			chartForm.dialog("option", "modal", true);
			chartForm.dialog("close").dialog("open");
		}

		bIsReopenDialog = false;
	});
	/*$("#changeRangeFormatTable").click(function () {
		bIsReopenDialog = true;
		var selector = $(this);
		var chartForm = $("#addFilterDialog");
		if (selector.hasClass("ToolbarChangeRange")) {
			selector.removeClass("ToolbarChangeRange").addClass("ToolbarChangeRange2");
			chartForm.find("#titleArea").hide();
			chartForm.dialog("close").dialog("open");
		} else {
			selector.removeClass("ToolbarChangeRange2").addClass("ToolbarChangeRange");
			chartForm.find("#titleArea").show();
			chartForm.dialog("close").dialog("open");
		}
		bIsReopenDialog = false;
	});*/

	$("#autoFilterCancel").click(function() { $('#MenuAutoFilter').hide(); });
	$("#autoFilterOk").click(function() {
		var cellId = $('#MenuAutoFilter').attr('idcolumn') 
		$('#MenuAutoFilter').hide();
		var type = 'mainFilter'
		var result = [];
		//посылаем информацию о ячейках, которые нужно скрыть
		var k = 0
		for(i = 0; i < $(".AutoFilterItem").length; i++)
		{
			val = $($(".AutoFilterItem")[i]).text();
			if(val == 'empty')
				val = '';
			result[i] = {};
			if($($(".AutoFilterItem")[i]).hasClass('hidden'))
			{
				result[i].val = val;
				result[i].vis = 'hidden';
			}
			else if($($(".AutoFilterItem")[i]).hasClass('SelectedAutoFilterItem'))
			{
				result[i].val = val;
				result[i].vis = true;
			}
			else if(!$($(".AutoFilterItem")[i]).hasClass('SelectedAutoFilterItem'))
			{
				result[i].val = val;
				result[i].vis = false;
			}
		}
		
		var autoFilterObject = new Asc.AutoFiltersOptions();
		autoFilterObject.asc_setCellId(cellId);
		autoFilterObject.asc_setResult(result);
		
		api.asc_applyAutoFilter(type,autoFilterObject);
	});
	$("#dialogFilter").dialog({ autoOpen: false, closeOnEscape: false, dialogClass: 'dialogClass',
		open: function() { aDialogNames.push("dialogFilter"); },
		close: function() { aDialogNames.pop(); },
		resizable: false, modal: true, width: '350px',
		buttons: [
			{
				text: 'Ok',
				click: function() {
					var isChecked = 'or';
					var type = 'digitalFilter';
					if($('#andCheck')[0].checked)
						isChecked = true;
					var logValFilter1  = $('#valueFilterSelect1').val();
					var logValFilter2  = $('#valueFilterSelect2').val();
					var valFilter1 = $('#filterSelect1').val()
					var valFilter2 = $('#filterSelect2').val()
					var idColumn = $('#MenuAutoFilter').attr('idcolumn');

					
					var autoFilterObject = new Asc.AutoFiltersOptions();
					
					autoFilterObject.asc_setCellId(idColumn);
					autoFilterObject.asc_setFilter1(valFilter1);
					autoFilterObject.asc_setFilter2(valFilter2);
					autoFilterObject.asc_setValFilter1(logValFilter1);
					autoFilterObject.asc_setValFilter2(logValFilter2);
					autoFilterObject.asc_setIsChecked(isChecked);
					
					api.asc_applyAutoFilter(type,autoFilterObject); 
					
					$(this).dialog("close");
				}
			},
			{
				text: 'Cancel',
				btCancel: "classButtonCancel",
				click: function() { $(this).dialog("close"); }
			}
		]
	});
	
	$("#numericalFilter").click(function() {
		$('#MenuAutoFilter').hide();
		api.asc_enableKeyEvents(false);
		var isCheck = autoFilterObj.asc_getIsChecked();
		if(autoFilterObj)
		{
			var valFilter1 = autoFilterObj.asc_getValFilter1();
			var valFilter2 = autoFilterObj.asc_getValFilter2();
			var filter1 = autoFilterObj.asc_getFilter1();
			var filter2 = autoFilterObj.asc_getFilter2();
			
			if(valFilter1)
				$("#valueFilterSelect1").val(valFilter1);
			else
				$("#valueFilterSelect1").val('');
				
			if(valFilter2)
				$("#valueFilterSelect2").val(valFilter2);
			else
				$("#valueFilterSelect2").val('');
			
			if(filter1)
				$("#filterSelect1").val(filter1);
			if(filter2)
				$("#filterSelect2").val(filter2);
			
			if(isCheck)
			{
				$("#andCheck").attr("checked", 'checked');
			}
			else
			{
				$("#orCheck").attr("checked", 'checked');
			}
		}
		$("#dialogFilter").dialog("open");
		
	});
	$("#sortAscending").click(function() {
		$('#MenuAutoFilter').hide();
		api.asc_enableKeyEvents(false);
		var idColumn = $('#MenuAutoFilter').attr('idcolumn');
		var autoFilterObject = new Asc.AutoFiltersOptions();
		autoFilterObject.asc_setCellId(idColumn);
		api.asc_sortColFilter(true, autoFilterObject.cellId); 
	});
	$("#sortDescending").click(function() {
		$('#MenuAutoFilter').hide();
		api.asc_enableKeyEvents(false);
		var idColumn = $('#MenuAutoFilter').attr('idcolumn');
		var autoFilterObject = new Asc.AutoFiltersOptions();
		autoFilterObject.asc_setCellId(idColumn);
		api.asc_sortColFilter(false, autoFilterObject.cellId); 
	});
	$("#selectAllElements").click(function() {
		var elements = $(".AutoFilterItem ");
		for(l = 0; l < elements.length; l++) {
			var elem = $(elements[l]);
			if(!elem.hasClass('hidden') && !elem.hasClass('hidden2'))
			{
				if(!$("#selectAllElements").hasClass('SelectedAutoFilterItem'))
					elem.addClass('SelectedAutoFilterItem')
				else
					elem.removeClass('SelectedAutoFilterItem')
			}
		}
		if($("#selectAllElements").hasClass('SelectedAutoFilterItem'))
			$("#selectAllElements").removeClass('SelectedAutoFilterItem');
		else
			$("#selectAllElements").addClass('SelectedAutoFilterItem')
			
	});
	
	// Shapes
	$("#td_shape").mousedown(function () {
		if ( "none" != ($("#shapeBox").css("display")) ) {
			IsVisibleMenu = true;
		}
	}).click(function () {
		if (!IsVisibleMenu) {
			var offset = $("#td_shape").offset();
			offset.top += $("#td_shape").outerHeight() - 1;
			$("#shapeBox").css("top", offset.top);
			$("#shapeBox").css("left", offset.left);
			$("#shapeBox").attr("init", "shapePrst").show();
		} else {
			$("#shapeBox").attr("init", "shapePrst").hide();
		}
		IsVisibleMenu = false;
	});
	
	$(".cell").css({
		"width" : "20px",
		"height": "20px",
		"padding": "2px"
	}).mousedown(function () {
		$(this).css("border", "3px solid #000");
		$("#shapeBox").attr("init", "shapePrst").hide();
		api.asc_startAddShape($(this).attr("title"), true);
	}).mouseover(function () {
		$(this).css("border", "1px solid #000");
	}).mouseup(function () {
		$(this).css("border", "1px solid #000");
	}).mouseout(function () {
		$(this).css("border", "0px solid #000");
	});
	
	$("#td_group").click(function () {
		api.asc_groupGraphicsObjects();
	});
	
	$("#td_ungroup").click(function () {
		api.asc_unGroupGraphicsObjects();
	});

	$("#showGridLines").change(function () {
		onChangeView();
	});
	$("#showHeaders").change(function () {
		onChangeView();
	});
	$("#freezePane").change(function () {
		api.asc_freezePane();
	});

    var chart_subtype_image_map = {};
    chart_subtype_image_map["gist"] =
        ["menu/img/chartProps/image1.png",
            "menu/img/chartProps/image2.png",
            "menu/img/chartProps/image3.png"];
    chart_subtype_image_map["graphic"] =
        ["menu/img/chartProps/image4.png",
            "menu/img/chartProps/image5.png",
            "menu/img/chartProps/image6.png",
            "menu/img/chartProps/image7.png",
            "menu/img/chartProps/image8.png",
            "menu/img/chartProps/image9.png"];
    chart_subtype_image_map["pie"] =
        ["menu/img/chartProps/image10.png"];
    chart_subtype_image_map["hbar"] =
        ["menu/img/chartProps/image11.png",
            "menu/img/chartProps/image12.png",
            "menu/img/chartProps/image13.png"];
    chart_subtype_image_map["area"] =
        ["menu/img/chartProps/image14.png",
            "menu/img/chartProps/image15.png",
            "menu/img/chartProps/image16.png"];
    chart_subtype_image_map["scatter"] =
        ["menu/img/chartProps/image17.png",
            "menu/img/chartProps/image18.png",
            "menu/img/chartProps/image19.png"];
    chart_subtype_image_map["stock"] =
        ["menu/img/chartProps/image20.png"];
    function createDivChartSubtypes(type)
    {
        if(Array.isArray(chart_subtype_image_map[type]))
        {
            var div = document.createElement("div");
            div.style.display = "none";
            div.style.float = "left";
            div.style.width = "inherit";
            div.style.height = "inherit";

            div.id = type + "_subtype_menu";
            var image_arr = chart_subtype_image_map[type];
            for(var i = 0; i < image_arr.length; ++i)
            {
                var img_div = document.createElement("div");
                img_div.style.width = "54px";
                img_div.style.height = "54px";
                img_div.style.float = "left";
                img_div.className = "chart_subtype_label";
                var img = document.createElement("img");
                img.src = image_arr[i];
                img.style.position = "relative";
                img.style.left = "4px";
                img.style.top = "4px";
                img_div.appendChild(img);
                div.appendChild(img_div);
            }
            return div;
        }
        return null;
    }
    for(var key in chart_subtype_image_map )
    {
        if(chart_subtype_image_map.hasOwnProperty(key))
        {
            var div = createDivChartSubtypes(key);
            var chart_menu = document.getElementById("right_subtype");
            if(div)
            {
                chart_menu.appendChild(div);
            }
        }
    }
    $("#chartAddMenu").draggable();
    var mouseOverHandlerChart = function()
    {
        if(!$(this).hasClass("chart_type_label_selected") && !$(this).hasClass("chart_subtype_label_selected"))
            $(this).css("background", "#808080");
        else
            $(this).css("background", "#555555");
    };
    $(".chart_type_label").mouseover(mouseOverHandlerChart);
    $(".chart_subtype_label").mouseover(mouseOverHandlerChart);

    var mouseleaveHandlerChart =  function()
    {
        if(!$(this).hasClass("chart_type_label_selected"))
            $(this).css("background", "#ffffff");
        else
            $(this).css("background", "#595959");
    };
    $(".chart_type_label").mouseleave(mouseleaveHandlerChart);
    $(".chart_subtype_label").mouseleave(mouseleaveHandlerChart);

    $(".chart_type_label").mousedown(
        handleMouseDownChartTypeLabel
    );

    function handleMouseDownChartTypeLabel()
    {
        var arr = $(".chart_type_label");
        for(var i = 0; i <arr.length; ++i)
        {
            (function()
            {
                $(this).removeClass("chart_type_label_selected");
                $(this).css("background", "#ffffff");
                var id = $(this).attr('id');
                $("#"+id+"_subtype_menu").css("display", "none");
            }).call(arr[i]);
        }

        $(".chart_type_label").removeClass("chart_type_label_selected");
        $(".chart_type_label").css("background", "#ffffff");
        $(this).addClass("chart_type_label_selected");
        $(this).css("background", "#595959");
        var id = $(this).attr('id');
        $("#"+id+"_subtype_menu").css("display", "");
    }

    function showChartAddDialog()
    {
        $("#chartAddMenu").css("display", "");
        var left = ($("#ws-canvas-outer").width() - $("#chartAddMenu").width())/2;
        var top =  ($("#ws-canvas-outer").height() - $("#chartAddMenu").height())/2;
        $("#chartAddMenu").css("display", "");
        $("#chartAddMenu").css("left",left +"px");
        $("#chartAddMenu").css("top", top +"px");
        $("#right_subtype").css("width",  $("#chartAddMenu").width() -  $("#chartTypeMenu").width());
        handleMouseDownChartTypeLabel.call($("#gist"));
    }

    $("#chartPropsMenuDiv").draggable();

    api.asc_registerCallback("asc_onSelectChart", function (chartSpace) {
        $("#chartPropsMenuDiv").css("display", "");
        $("#styleIndexInput").attr( "value", chartSpace.style + "");
        var value = chartSpace.chart.title ? (chartSpace.chart.title.overlay ? "overlay" : "no_overlay") : "none";
        $("#chartTitleSelect").attr("value", value);
        var plot_area = chartSpace.chart.plotArea;
        value = plot_area.catAx ? ("overlay") : "none";
        $("#chartHorAxisSelect").attr("value", value);
        value = plot_area.valAx ? ("overlay") : "none";
        $("#chartVertAxisSelect").attr("value", value);
    });


    api.asc_registerCallback("asc_onChangeSelectDrawingObjects", function(drawingProps)
    {
        var chart_props = drawingProps.chartProps;
        if(!chart_props)
        {
            $("#chartPropsMenuDiv").css("display", "none");
        }
        else
        {
            $("#chartPropsMenuDiv").css("display", "");
            var val = $("#changeChartTypeSelect").attr("value");
            var map = {};
             map[c_oAscChartTypeSettings.barNormal           ] =  "barNormal"           ;
             map[c_oAscChartTypeSettings.barStacked          ] =  "barStacked"          ;
             map[c_oAscChartTypeSettings.barStackedPer       ] =  "barStackedPer"       ;
             map[c_oAscChartTypeSettings.lineNormal          ] =  "lineNormal"          ;
             map[c_oAscChartTypeSettings.lineStacked         ] =  "lineStacked"         ;
             map[c_oAscChartTypeSettings.lineStackedPer      ] =  "lineStackedPer"      ;
             map[c_oAscChartTypeSettings.lineNormalMarker    ] =  "lineNormalMarker"    ;
             map[c_oAscChartTypeSettings.lineStackedMarker   ] =  "lineStackedMarker"   ;
             map[c_oAscChartTypeSettings.lineStackedPerMarker] =  "lineStackedPerMarker";
             map[c_oAscChartTypeSettings.pie                 ] =  "pie"                 ;
             map[c_oAscChartTypeSettings.hBarNormal          ] =  "hBarNormal"          ;
             map[c_oAscChartTypeSettings.hBarStacked         ] =  "hBarStacked"         ;
             map[c_oAscChartTypeSettings.hBarStackedPer      ] =  "hBarStackedPer"      ;
             map[c_oAscChartTypeSettings.areaNormal          ] =  "areaNormal"          ;
             map[c_oAscChartTypeSettings.areaStacked         ] =  "areaStacked"         ;
             map[c_oAscChartTypeSettings.areaStackedPer      ] =  "areaStackedPer"      ;
             map[c_oAscChartTypeSettings.scatter             ] =  "scatter"             ;
             map[c_oAscChartTypeSettings.doughnut            ] =  "doughnut"            ;


            /*Тип диаграммы*/
            var chart_type = map[chart_props.getType()];
            if(typeof chart_type === "string")
            {
                $("#changeChartTypeSelect").attr("value", chart_type);
            }
            else
            {
                $("#changeChartTypeSelect").attr("value", "lineNormal");
            }

            /*стиль диаграммы*/
            $("#styleIndexInput").attr("value", chart_props.getStyle()+"");

            /*заголовок диаграммы*/
            map = {};
            map[c_oAscChartTitleShowSettings.none]      = "none";
            map[c_oAscChartTitleShowSettings.overlay]   = "overlay";
            map[c_oAscChartTitleShowSettings.noOverlay] = "no_overlay";

            $("#chartTitleSelect").attr("value", map[chart_props.getTitle()]);

            /*TODO: здесь должны быть настройки для вертикальной и горизонтальной оси*/

           /*Легенда*/
            map = {};
            map[c_oAscChartLegendShowSettings.none        ] = "none"         ;
            map[c_oAscChartLegendShowSettings.left        ] = "left"         ;
            map[c_oAscChartLegendShowSettings.top         ] = "top"          ;
            map[c_oAscChartLegendShowSettings.right       ] = "right"        ;
            map[c_oAscChartLegendShowSettings.bottom      ] = "bottom"       ;
            map[c_oAscChartLegendShowSettings.leftOverlay ] = "left_overlay";
            map[c_oAscChartLegendShowSettings.rightOverlay] = "right_overlay" ;
            map[c_oAscChartLegendShowSettings.layout      ] = "layout"       ;
            $("#chartLegendSelect").attr("value", map[chart_props.getLegendPos()]);

            /*Подписи данных*/
            map = {};
            map[c_oAscChartDataLabelsPos.none  ] =  "none"     ;
            map[c_oAscChartDataLabelsPos.ctr   ] =  "center"   ;
            map[c_oAscChartDataLabelsPos.inEnd ] =  "inner_top";
            map[c_oAscChartDataLabelsPos.inBase] =  "in_base"  ;
            map[c_oAscChartDataLabelsPos.outEnd] =  "out_end"  ;
            map[c_oAscChartDataLabelsPos.b]      =  "bottom"  ;
            map[c_oAscChartDataLabelsPos.bestFit] = "best_fit"  ;
            map[c_oAscChartDataLabelsPos.l]      = "left"  ;
            map[c_oAscChartDataLabelsPos.r]      = "right"  ;
            map[c_oAscChartDataLabelsPos.t]      = "top"  ;
            $("#chartDataLabels").attr("value", map[chart_props.getDataLabelsPos()]);

            /*Содержание подписей данных*/
            if(chart_props.getShowVal())
                $("#dataLabelsCheckBoxVal").attr("checked", "checked");
            else
                $("#dataLabelsCheckBoxVal").removeAttr("checked");
            if(chart_props.getShowSerName())
                $("#dataLabelsCheckBoxSerName").attr("checked", "checked");
            else
                $("#dataLabelsCheckBoxSerName").removeAttr("checked");
            if(chart_props.getShowCatName())
                $("#dataLabelsCheckBoxCatName").attr("checked", "checked");
            else
                $("#dataLabelsCheckBoxCatName").removeAttr("checked");
            /*раздеоитель подписей данных*/
            var separator_str = chart_props.getSeparator();
            if(!(typeof  separator_str === "string" && separator_str.length > 0))
                separator_str = ",";
            $("#dataLabelsSeparatorInput").attr("value", separator_str);


            //горизонтальные линии сетки
            var hor_grid_lines = chart_props.getHorGridLines();
            if(hor_grid_lines === c_oAscGridLinesSettings.none)
            {
                $("#chartHorGridLines").attr("value", "none");
            }
            else if(hor_grid_lines === c_oAscGridLinesSettings.minor)
            {
                $("#chartHorGridLines").attr("value", "minor");
            }
            else if(hor_grid_lines === c_oAscGridLinesSettings.major)
            {
                $("#chartHorGridLines").attr("value", "major");
            }
            else if(hor_grid_lines === c_oAscGridLinesSettings.majorMinor)
            {
                $("#chartHorGridLines").attr("value", "minor_major");
            }

            //вертикальные линии сетки
            var vert_grid_lines = chart_props.getHorGridLines();
            if(vert_grid_lines === c_oAscGridLinesSettings.none)
            {
                $("#chartVertGridLines").attr("value", "none");
            }
            else if(vert_grid_lines === c_oAscGridLinesSettings.minor)
            {
                $("#chartVertGridLines").attr("value", "minor");
            }
            else if(vert_grid_lines === c_oAscGridLinesSettings.major)
            {
                $("#chartVertGridLines").attr("value", "major");
            }
            else if(vert_grid_lines === c_oAscGridLinesSettings.majorMinor)
            {
                $("#chartVertGridLines").attr("value", "minor_major");
            }

            $(".right_panel_drawing_props").removeClass("horAxisPropsRightPanelActive");
            $(".right_panel_drawing_props").removeClass("vertAxisPropsRightPanelActive");
            //горизонтальная ось
            var hor_axis_props = chart_props.getHorAxisProps();
            if(hor_axis_props)
            {
                if(hor_axis_props.getAxisType() === c_oAscAxisType.cat || hor_axis_props.getAxisType() === c_oAscAxisType.date)
                {
                    $("#rightPanelCatAxProps").addClass("horAxisPropsRightPanelActive");
                    $("#intervalBetweenTickInput").attr("value", hor_axis_props.getIntervalBetweenTick()+"");
                    if(hor_axis_props.getIntervalBetweenLabelsRule() === c_oAscBetweenLabelsRule.auto)
                    {
                        $("#autoIntervalBetweenLabelsInputCat").attr("checked", "checked");
                        $("#intervalBetweenLabelsInputCatAxManual").attr("disabled", "disabled");
                        $("#intervalBetweenLabelsInputCatAxManual").attr("value", "");
                    }
                    else
                    {
                        $("#manualIntervalBetweenLabelsInputCat").attr("checked", "checked");
                        $("#intervalBetweenLabelsInputCatAxManual").removeAttr("disabled");
                        $("#intervalBetweenLabelsInputCatAxManual").attr("value", hor_axis_props.getIntervalBetweenLabels() + "");
                    }
                    if(hor_axis_props.getInvertCatOrder())
                    {
                        $("#invertCatOrderCheckBox").attr("checked", "checked");
                    }
                    else
                    {
                        $("#invertCatOrderCheckBox").removeAttr("checked");
                    }
                    $("#labelsAxisInputDistanceInput").attr("value", hor_axis_props.getLabelsAxisDistance());
                    //TODO: сделать возможность выбора типа оси
                    var major_tick_mark = hor_axis_props.getMajorTickMark();
                    if(major_tick_mark === c_oAscTickMark.TICK_MARK_CROSS)
                        $("#majorTickMarkSelectCatAx").attr("value", "TICK_MARK_CROSS");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_IN)
                        $("#majorTickMarkSelectCatAx").attr("value", "TICK_MARK_IN");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_NONE)
                        $("#majorTickMarkSelectCatAx").attr("value", "TICK_MARK_NONE");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_OUT)
                        $("#majorTickMarkSelectCatAx").attr("value", "TICK_MARK_OUT");

                    var minor_tick_mark = hor_axis_props.getMinorTickMark();
                    if(minor_tick_mark === c_oAscTickMark.TICK_MARK_CROSS)
                        $("#minorTickMarkSelectCatAx").attr("value", "TICK_MARK_CROSS");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_IN)
                        $("#minorTickMarkSelectCatAx").attr("value", "TICK_MARK_IN");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_NONE)
                        $("#minorTickMarkSelectCatAx").attr("value", "TICK_MARK_NONE");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_OUT)
                        $("#minorTickMarkSelectCatAx").attr("value", "TICK_MARK_OUT");

                    var tick_labels_pos = hor_axis_props.getTickLabelsPos();
                    if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_HIGH)
                        $("#tickLabelsSelectCatAx").attr("value", "TICK_LABEL_POSITION_HIGH");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_LOW)
                        $("#tickLabelsSelectCatAx").attr("value", "TICK_LABEL_POSITION_LOW");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_NEXT_TO)
                        $("#tickLabelsSelectCatAx").attr("value", "TICK_LABEL_POSITION_NEXT_TO");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_NONE)
                        $("#tickLabelsSelectCatAx").attr("value", "TICK_LABEL_POSITION_NONE");

                    var crosses_rule = hor_axis_props.getCrossesRule();
                    if(crosses_rule === c_oAscCrossesRule.auto)
                    {
                        $("#crossesAutoCatAxInput").attr("checked", "checked");
                        $("crossesCatInput").attr("value", "");
                        $("crossesCatInput").attr("disabled", "disabled");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.maxValue)
                    {
                        $("#crossesMaxAxCatInput").attr("checked", "checked");
                        $("crossesCatInput").attr("value", "");
                        $("crossesCatInput").attr("disabled", "disabled");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.value)
                    {
                        $("#crossesCatAxValInput").attr("checked", "checked");
                        $("crossesCatInput").attr("value", "");
                        $("crossesCatInput").attr("disabled", hor_axis_props.getCrosses() + "");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.minValue)
                    {
                        $("#crossesMinAxCatInput").attr("checked", "checked");
                        $("crossesCatInput").attr("value", "");
                        $("crossesCatInput").attr("disabled", "disabled");
                    }

                    if(hor_axis_props.getLabelsPosition() === c_oAscLabelsPosition.byDivisions)
                    {
                        $("#checkBoxByDivisionsInput").attr("checked", "checked");
                    }
                    else
                    {
                        $("#checkBoxBetweenDivisionsInput").attr("checked", "checked");
                    }
                }
                else if(hor_axis_props.getAxisType() === c_oAscAxisType.val)
                {
                    $("#rightPanelValAxisPropsX").addClass("horAxisPropsRightPanelActive");
                    //минимальное значение на оси
                    if(hor_axis_props.getMinValRule() === c_oAscValAxisRule.auto)
                    {
                        $("#autoMinValValAxisCheckBoxX").attr("checked", "checked");
                        $("#minValueAxisInputX").attr("disabled", "disabled");
                        $("#minValueAxisInputX").attr("value", "");
                    }
                    else
                    {
                        $("#minValueAxisInputX").attr("disabled", "");
                        $("#minValueAxisInputX").attr("value", hor_axis_props.getMinVal() + "");
                    }
                    //максимальное значение на оси
                    if(hor_axis_props.getMaxValRule() === c_oAscValAxisRule.auto)
                    {
                        $("#autoMaxValValAxisCheckBoxX").attr("checked", "checked");
                        $("#maxValueAxisInputX").attr("disabled", "disabled");
                        $("#maxValueAxisInputX").attr("value", "");
                    }
                    else
                    {
                        $("#maxValueAxisInputX").removeAttr("disabled");
                        $("#maxValueAxisInputX").attr("value", hor_axis_props.getMaxVal() + "");
                    }

                    //обратный порядок значений
                    if(hor_axis_props.getInvertValOrder())
                    {
                        $("#invertValOrderValAxisInputX").attr("checked", "checked");
                    }
                    else
                    {
                        $("#invertValOrderValAxisInputX").removeAttr("checked");
                    }

                    //использовать ли логарифмическую шкалу
                    if(hor_axis_props.getLogScale())
                    {
                        $("logScaleInputX").attr("checked", "checked");
                        $("logBaseInputX").attr("value", hor_axis_props.getLogBase() + "");
                        $("logBaseInputX").removeAttr("disabled");
                    }
                    else
                    {
                        $("logScaleInputX").removeAttr("checked");
                        $("logBaseInputX").attr("value", "");
                        $("logBaseInputX").attr("disabled", "disabled");
                    }

                    //множитель оси значений на оси
                    var disp_units_rule = hor_axis_props.getDispUnitsRule();
                    if(disp_units_rule === c_oAscValAxUnits.none)
                    {
                        $("#unitsSelectX").attr("value", "none");
                        $("#unitCustomInputX").attr("disabled", "disabled");
                        $("#unitCustomInputX").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.BILLIONS)
                    {
                        $("#unitsSelectX").attr("value", "BILLIONS");
                        $("#unitCustomInputX").attr("disabled", "disabled");
                        $("#unitCustomInputX").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.HUNDRED_MILLIONS)
                    {
                        $("#unitsSelectX").attr("value", "HUNDRED_MILLIONS");
                        $("#unitCustomInputX").attr("disabled", "disabled");
                        $("#unitCustomInputX").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.HUNDREDS)
                    {
                        $("#unitsSelectX").attr("value", "HUNDREDS");
                        $("#unitCustomInputX").attr("disabled", "disabled");
                        $("#unitCustomInputX").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.HUNDRED_THOUSANDS)
                    {
                        $("#unitsSelectX").attr("value", "HUNDRED_THOUSANDS");
                        $("#unitCustomInputX").attr("disabled", "disabled");
                        $("#unitCustomInputX").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.MILLIONS)
                    {
                        $("#unitsSelectX").attr("value", "MILLIONS");
                        $("#unitCustomInputX").attr("disabled", "disabled");
                        $("#unitCustomInputX").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.TEN_MILLIONS)
                    {
                        $("#unitsSelectX").attr("value", "TEN_MILLIONS");
                        $("#unitCustomInputX").attr("disabled", "disabled");
                        $("#unitCustomInputX").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.TEN_THOUSANDS)
                    {
                        $("#unitsSelectX").attr("value", "TEN_THOUSANDS");
                        $("#unitCustomInputX").attr("disabled", "disabled");
                        $("#unitCustomInputX").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.TRILLIONS)
                    {
                        $("#unitsSelectX").attr("value", "TRILLIONS");
                        $("#unitCustomInputX").attr("disabled", "disabled");
                        $("#unitCustomInputX").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.CUSTOM)
                    {
                        $("#unitsSelectX").attr("value", "CUSTOM");
                        $("#unitCustomInputX").removeAttr("disabled", "");
                        $("#unitCustomInputX").attr("value", hor_axis_props.getUnits() + "");
                    }
                    //TODO: флаг показа заголовка единиц оси
                    var major_tick_mark = hor_axis_props.getMajorTickMark();
                    if(major_tick_mark === c_oAscTickMark.TICK_MARK_CROSS)
                        $("#majorTickMarkSelectValAxX").attr("value", "TICK_MARK_CROSS");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_IN)
                        $("#majorTickMarkSelectValAxX").attr("value", "TICK_MARK_IN");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_NONE)
                        $("#majorTickMarkSelectValAxX").attr("value", "TICK_MARK_NONE");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_OUT)
                        $("#majorTickMarkSelectValAxX").attr("value", "TICK_MARK_OUT");


                    var minor_tick_mark = hor_axis_props.getMinorTickMark();
                    if(minor_tick_mark === c_oAscTickMark.TICK_MARK_CROSS)
                        $("#minorTickMarkSelectValAxX").attr("value", "TICK_MARK_CROSS");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_IN)
                        $("#minorTickMarkSelectValAxX").attr("value", "TICK_MARK_IN");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_NONE)
                        $("#minorTickMarkSelectValAxX").attr("value", "TICK_MARK_NONE");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_OUT)
                        $("#minorTickMarkSelectValAxX").attr("value", "TICK_MARK_OUT");

                    var tick_labels_pos = hor_axis_props.getTickLabelsPos();
                    if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_HIGH)
                        $("#tickLabelsSelectValAxX").attr("value", "TICK_LABEL_POSITION_HIGH");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_LOW)
                        $("#tickLabelsSelectValAxX").attr("value", "TICK_LABEL_POSITION_LOW");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_NEXT_TO)
                        $("#tickLabelsSelectValAxX").attr("value", "TICK_LABEL_POSITION_NEXT_TO");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_NONE)
                        $("#tickLabelsSelectValAxX").attr("value", "TICK_LABEL_POSITION_NONE");

                    var crosses_rule = hor_axis_props.getCrossesRule();
                    if(crosses_rule === c_oAscCrossesRule.auto)
                    {
                        $("#crossesAutoValAxInputX").attr("checked", "checked");
                        $("#crossesValInputX").attr("value", "");
                        $("#crossesValInputX").attr("disabled", "disabled");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.maxValue)
                    {
                        $("#crossesMaxAxValInputX").attr("checked", "checked");
                        $("#crossesValInputX").attr("value", "");
                        $("#crossesValInputX").attr("disabled", "disabled");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.minValue)
                    {
                        $("#crossesMinAxValInputX").attr("checked", "checked");
                        $("#crossesValInputX").attr("value", "");
                        $("#crossesValInputX").attr("disabled", "disabled");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.value)
                    {
                        $("#crossesValAxValInputX").attr("checked", "checked");
                        $("#crossesValInputX").attr("disabled", "");
                        $("#crossesValInputX").attr("value", hor_axis_props.getCrosses() + "");
                    }
                }
            }

            var vert_axis_props = chart_props.getVertAxisProps();
            if(vert_axis_props)
            {
                if(vert_axis_props.getAxisType() === c_oAscAxisType.cat || vert_axis_props.getAxisType() === c_oAscAxisType.date)
                {
                    $("#rightPanelCatAxProps").addClass("vertAxisPropsRightPanelActive");
                    $("#intervalBetweenTickInput").attr("value", vert_axis_props.getIntervalBetweenTick()+"");
                    if(vert_axis_props.getIntervalBetweenLabelsRule() === c_oAscBetweenLabelsRule.auto)
                    {
                        $("#autoIntervalBetweenLabelsInputCat").attr("checked", "checked");
                        $("#intervalBetweenLabelsInputCatAxManual").attr("disabled", "disabled");
                        $("#intervalBetweenLabelsInputCatAxManual").attr("value", "");
                    }
                    else
                    {
                        $("#manualIntervalBetweenLabelsInputCat").attr("checked", "checked");
                        $("#intervalBetweenLabelsInputCatAxManual").attr("disabled", "");
                        $("#intervalBetweenLabelsInputCatAxManual").attr("value", vert_axis_props.getIntervalBetweenLabels() + "");
                    }
                    if(vert_axis_props.getInvertCatOrder())
                    {
                        $("#invertCatOrderCheckBox").attr("checked", "checked");
                    }
                    else
                    {
                        $("#invertCatOrderCheckBox").removeAttr("checked");
                    }
                    $("#labelsAxisInputDistanceInput").attr("value", vert_axis_props.getLabelsAxisDistance());
                    //TODO: сделать возможность выбора типа оси
                    var major_tick_mark = vert_axis_props.getMajorTickMark();
                    if(major_tick_mark === c_oAscTickMark.TICK_MARK_CROSS)
                        $("#majorTickMarkSelectCatAx").attr("value", "TICK_MARK_CROSS");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_IN)
                        $("#majorTickMarkSelectCatAx").attr("value", "TICK_MARK_IN");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_NONE)
                        $("#majorTickMarkSelectCatAx").attr("value", "TICK_MARK_NONE");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_OUT)
                        $("#majorTickMarkSelectCatAx").attr("value", "TICK_MARK_OUT");

                    var minor_tick_mark = vert_axis_props.getMinorTickMark();
                    if(minor_tick_mark === c_oAscTickMark.TICK_MARK_CROSS)
                        $("#minorTickMarkSelectCatAx").attr("value", "TICK_MARK_CROSS");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_IN)
                        $("#minorTickMarkSelectCatAx").attr("value", "TICK_MARK_IN");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_NONE)
                        $("#minorTickMarkSelectCatAx").attr("value", "TICK_MARK_NONE");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_OUT)
                        $("#minorTickMarkSelectCatAx").attr("value", "TICK_MARK_OUT");

                    var tick_labels_pos = vert_axis_props.getTickLabelsPos();
                    if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_HIGH)
                        $("#tickLabelsSelectCatAx").attr("value", "TICK_LABEL_POSITION_HIGH");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_LOW)
                        $("#tickLabelsSelectCatAx").attr("value", "TICK_LABEL_POSITION_LOW");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_NEXT_TO)
                        $("#tickLabelsSelectCatAx").attr("value", "TICK_LABEL_POSITION_NEXT_TO");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_NONE)
                        $("#tickLabelsSelectCatAx").attr("value", "TICK_LABEL_POSITION_NONE");

                    var crosses_rule = vert_axis_props.getCrossesRule();
                    if(crosses_rule === c_oAscCrossesRule.auto)
                    {
                        $("#crossesAutoCatAxInput").attr("checked", "checked");
                        $("crossesCatInput").attr("value", "");
                        $("crossesCatInput").attr("disabled", "disabled");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.maxValue)
                    {
                        $("#crossesMaxAxCatInput").attr("checked", "checked");
                        $("crossesCatInput").attr("value", "");
                        $("crossesCatInput").attr("disabled", "disabled");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.value)
                    {
                        $("#crossesCatAxValInput").attr("checked", "checked");
                        $("crossesCatInput").attr("value", "");
                        $("crossesCatInput").attr("disabled", vert_axis_props.getCrosses() + "");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.minValue)
                    {
                        $("#crossesMinAxCatInput").attr("checked", "checked");
                        $("crossesCatInput").attr("value", "");
                        $("crossesCatInput").attr("disabled", "disabled");
                    }

                    if(vert_axis_props.getLabelsPosition() === c_oAscLabelsPosition.byDivisions)
                    {
                        $("#checkBoxByDivisionsInput").attr("checked", "checked");
                    }
                    else
                    {
                        $("#checkBoxBetweenDivisionsInput").attr("checked", "checked");
                    }
                }
                else if(vert_axis_props.getAxisType() === c_oAscAxisType.val)
                {
                    $("#rightPanelValAxisProps").addClass("vertAxisPropsRightPanelActive");
                    //минимальное значение на оси
                    if(vert_axis_props.getMinValRule() === c_oAscValAxisRule.auto)
                    {
                        $("#autoMinValValAxisCheckBox").attr("checked", "checked");
                        $("#minValueAxisInput").attr("disabled", "disabled");
                        $("#minValueAxisInput").attr("value", "");
                    }
                    else
                    {
                        $("#minValueAxisInput").attr("disabled", "");
                        $("#minValueAxisInput").attr("value", vert_axis_props.getMinVal() + "");
                    }
                    //максимальное значение на оси
                    if(vert_axis_props.getMaxValRule() === c_oAscValAxisRule.auto)
                    {
                        $("#autoMaxValValAxisCheckBox").attr("checked", "checked");
                        $("#maxValueAxisInput").attr("disabled", "disabled");
                        $("#maxValueAxisInput").attr("value", "");
                    }
                    else
                    {
                        $("#maxValueAxisInput").attr("disabled", "");
                        $("#maxValueAxisInput").attr("value", vert_axis_props.getMinVal() + "");
                    }

                    //обратный порядок значений
                    if(vert_axis_props.getInvertValOrder())
                    {
                        $("#invertValOrderValAxisInput").attr("checked", "checked");
                    }
                    else
                    {
                        $("#invertValOrderValAxisInput").removeAttr("checked");
                    }

                    //использовать ли логарифмическую шкалу
                    if(vert_axis_props.getLogScale())
                    {
                        $("logScaleInput").attr("checked", "checked");
                        $("logBaseInput").attr("value", vert_axis_props.getLogBase() + "");
                    }
                    else
                    {
                        $("logScaleInput").removeAttr("checked", "");
                        $("logBaseInput").attr("value", "");
                        $("logBaseInput").attr("disabled", "disabled");
                    }

                    //множитель оси значений на оси
                    var disp_units_rule = vert_axis_props.getDispUnitsRule();
                    if(disp_units_rule === c_oAscValAxUnits.none)
                    {
                        $("#unitsSelect").attr("value", "none");
                        $("#unitCustomInput").attr("disabled", "disabled");
                        $("#unitCustomInput").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.BILLIONS)
                    {
                        $("#unitsSelect").attr("value", "BILLIONS");
                        $("#unitCustomInput").attr("disabled", "disabled");
                        $("#unitCustomInput").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.HUNDRED_MILLIONS)
                    {
                        $("#unitsSelect").attr("value", "HUNDRED_MILLIONS");
                        $("#unitCustomInput").attr("disabled", "disabled");
                        $("#unitCustomInput").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.HUNDREDS)
                    {
                        $("#unitsSelect").attr("value", "HUNDREDS");
                        $("#unitCustomInput").attr("disabled", "disabled");
                        $("#unitCustomInput").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.HUNDRED_THOUSANDS)
                    {
                        $("#unitsSelect").attr("value", "HUNDRED_THOUSANDS");
                        $("#unitCustomInput").attr("disabled", "disabled");
                        $("#unitCustomInput").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.MILLIONS)
                    {
                        $("#unitsSelect").attr("value", "MILLIONS");
                        $("#unitCustomInput").attr("disabled", "disabled");
                        $("#unitCustomInput").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.TEN_MILLIONS)
                    {
                        $("#unitsSelect").attr("value", "TEN_MILLIONS");
                        $("#unitCustomInput").attr("disabled", "disabled");
                        $("#unitCustomInput").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.TEN_THOUSANDS)
                    {
                        $("#unitsSelect").attr("value", "TEN_THOUSANDS");
                        $("#unitCustomInput").attr("disabled", "disabled");
                        $("#unitCustomInput").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.TRILLIONS)
                    {
                        $("#unitsSelect").attr("value", "TRILLIONS");
                        $("#unitCustomInput").attr("disabled", "disabled");
                        $("#unitCustomInput").attr("value", "");
                    }
                    else if(disp_units_rule === c_oAscValAxUnits.CUSTOM)
                    {
                        $("#unitsSelect").attr("value", "CUSTOM");
                        $("#unitCustomInput").removeAttr("disabled");
                        $("#unitCustomInput").attr("value", vert_axis_props.getUnits() + "");
                    }
                    //TODO: флаг показа заголовка единиц оси
                    var major_tick_mark = vert_axis_props.getMajorTickMark();
                    if(major_tick_mark === c_oAscTickMark.TICK_MARK_CROSS)
                        $("#majorTickMarkSelectValAx").attr("value", "TICK_MARK_CROSS");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_IN)
                        $("#majorTickMarkSelectValAx").attr("value", "TICK_MARK_IN");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_NONE)
                        $("#majorTickMarkSelectValAx").attr("value", "TICK_MARK_NONE");
                    else if(major_tick_mark === c_oAscTickMark.TICK_MARK_OUT)
                        $("#majorTickMarkSelectValAx").attr("value", "TICK_MARK_OUT");


                    var minor_tick_mark = vert_axis_props.getMinorTickMark();
                    if(minor_tick_mark === c_oAscTickMark.TICK_MARK_CROSS)
                        $("#minorTickMarkSelectValAx").attr("value", "TICK_MARK_CROSS");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_IN)
                        $("#minorTickMarkSelectValAx").attr("value", "TICK_MARK_IN");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_NONE)
                        $("#minorTickMarkSelectValAx").attr("value", "TICK_MARK_NONE");
                    else if(minor_tick_mark === c_oAscTickMark.TICK_MARK_OUT)
                        $("#minorTickMarkSelectValAx").attr("value", "TICK_MARK_OUT");

                    var tick_labels_pos = vert_axis_props.getTickLabelsPos();
                    if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_HIGH)
                        $("#tickLabelsSelectValAx").attr("value", "TICK_LABEL_POSITION_HIGH");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_LOW)
                        $("#tickLabelsSelectValAx").attr("value", "TICK_LABEL_POSITION_LOW");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_NEXT_TO)
                        $("#tickLabelsSelectValAx").attr("value", "TICK_LABEL_POSITION_NEXT_TO");
                    else if(tick_labels_pos === c_oAscTickLabelsPos.TICK_LABEL_POSITION_NONE)
                        $("#tickLabelsSelectValAx").attr("value", "TICK_LABEL_POSITION_NONE");

                    var crosses_rule = vert_axis_props.getCrossesRule();
                    if(crosses_rule === c_oAscCrossesRule.auto)
                    {
                        $("#crossesAutoValAxInput").attr("checked", "checked");
                        $("#crossesValInput").attr("value", "");
                        $("#crossesValInput").attr("disabled", "disabled");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.maxValue)
                    {
                        $("#crossesMaxAxValInput").attr("checked", "checked");
                        $("#crossesValInput").attr("value", "");
                        $("#crossesValInput").attr("disabled", "disabled");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.minValue)
                    {
                        $("#crossesMinAxValInput").attr("checked", "checked");
                        $("#crossesValInput").attr("value", "");
                        $("#crossesValInput").attr("disabled", "disabled");
                    }
                    else if(crosses_rule === c_oAscCrossesRule.value)
                    {
                        $("#crossesValAxValInput").attr("checked", "checked");
                        $("#crossesValInput").removeAttr("disabled");
                        $("#crossesValInput").attr("value", vert_axis_props.getCrosses() + "");
                    }
                }
            }

            $(".leftPanelCharPropsItemDiv").removeClass("left_panel_chart_props_select");
            $(".leftPanelCharPropsItemDiv").addClass("left_panel_chart_props_no_select");
            $("#designChartLeft").addClass("left_panel_chart_props_select");
            $(".right_panel_drawing_props").css("display", "none");
            $("#rightPanelChartPropsDiv").css("display","");

            if(hor_axis_props)
                $("#catAxisProps").css("display", "");
            else
                $("#catAxisProps").css("display", "none");

            if(vert_axis_props)
                $("#valAxisProps").css("display", "");
            else
                $("#valAxisProps").css("display", "none");

        }
    });

    $("#applyStyleButton").on("click",
    function()
    {
        var style_index = parseInt($("#styleIndexInput").attr("value"), 10);
        if(!isNaN(style_index) && style_index > 0 && style_index < 49)
        {
            var settings = new asc_ChartSettings();
            settings.putStyle(style_index);
            api.asc_editChartDrawingObject(settings);
        }
    });

    $("#chartTitleSelect").change(function()
    {
        var val = $("#chartTitleSelect").attr("value");
        var map = {"none": c_oAscChartTitleShowSettings.none, "overlay": c_oAscChartTitleShowSettings.overlay, "no_overlay": c_oAscChartTitleShowSettings.noOverlay};
        var settings = new asc_ChartSettings();
        settings.putTitle(map[val]);
        api.asc_editChartDrawingObject(settings);
    });

    $("#chartHorAxisSelect").change(function()
    {
        var val = $("#chartHorAxisSelect").attr("value");
        var map = {"none": c_oAscChartHorAxisLabelShowSettings.none, "no_overlay": c_oAscChartHorAxisLabelShowSettings.noOverlay};
        var settings = new asc_ChartSettings();
        settings.putHorAxisLabel(map[val]);
        api.asc_editChartDrawingObject(settings);
    });


    $("#chartVertAxisSelect").change(function()
    {
        var val = $("#chartVertAxisSelect").attr("value");
        var map = {"none": c_oAscChartVertAxisLabelShowSettings.none, "rotated": c_oAscChartVertAxisLabelShowSettings.rotated, "horizontal": c_oAscChartVertAxisLabelShowSettings.horizontal, "vertical": c_oAscChartVertAxisLabelShowSettings.vertical};
        var settings = new asc_ChartSettings();
        settings.putVertAxisLabel(map[val]);
        api.asc_editChartDrawingObject(settings);
    });

    $("#chartLegendSelect").change(function()
    {
        var val = $("#chartLegendSelect").attr("value");
        var map = {
            "none":            c_oAscChartLegendShowSettings.none,
            "left":            c_oAscChartLegendShowSettings.left,
            "top":             c_oAscChartLegendShowSettings.top,
            "right":           c_oAscChartLegendShowSettings.right,
            "bottom":          c_oAscChartLegendShowSettings.bottom,
            "right_overlay":   c_oAscChartLegendShowSettings.rightOverlay,
            "left_overlay":    c_oAscChartLegendShowSettings.leftOverlay
        };
        var settings = new asc_ChartSettings();
        settings.putLegendPos(map[val]);
        api.asc_editChartDrawingObject(settings);
    });
    $("#chartHorAxis").change(
        function()
        {
            var val = $("#chartHorAxis").attr("value");
            var map = {
                "none":            c_oAscChartLegendShowSettings.none,
                "left":            c_oAscChartLegendShowSettings.left,
                "top":             c_oAscChartLegendShowSettings.top,
                "right":           c_oAscChartLegendShowSettings.right,
                "bottom":          c_oAscChartLegendShowSettings.bottom,
                "right_overlay":   c_oAscChartLegendShowSettings.rightOverlay,
                "left_overlay":    c_oAscChartLegendShowSettings.leftOverlay
            };
            var settings = new asc_ChartSettings();
            settings.putLegendPos(map[val]);
            api.asc_editChartDrawingObject(settings);
        }
    );


    $("#chartVertAxis").change(
        function()
        {
            var val = $("#chartVertAxis").attr("value");
            var map = {
                "none":            c_oAscChartLegendShowSettings.none,
                "left":            c_oAscChartLegendShowSettings.left,
                "top":             c_oAscChartLegendShowSettings.top,
                "right":           c_oAscChartLegendShowSettings.right,
                "bottom":          c_oAscChartLegendShowSettings.bottom,
                "right_overlay":   c_oAscChartLegendShowSettings.rightOverlay,
                "left_overlay":    c_oAscChartLegendShowSettings.leftOverlay
            };
            var settings = new asc_ChartSettings();
            settings.putLegendPos(map[val]);
            api.asc_editChartDrawingObject(settings);
        }
    );

    $("#chartDataLabels").change(
        function()
        {

        }
    );

    $("#chartHorGridLines").change(
        function()
        {
            var val = $("#chartHorGridLines").attr("value");
            var map = {
                "none"           : c_oAscGridLinesSettings.none,
                "major"         : c_oAscGridLinesSettings.major,
                "minor"      : c_oAscGridLinesSettings.minor,
                "minor_major" : c_oAscGridLinesSettings.majorMinor
            };
            var settings = new asc_ChartSettings();
            settings.putHorGridLines(map[val]);
            api.asc_editChartDrawingObject(settings);
        }
    );

    $("#chartVertGridLines").change(
        function()
        {
            var val = $("#chartVertGridLines").attr("value");
            var map = {
                "none"           : c_oAscGridLinesSettings.none,
                "major"         : c_oAscGridLinesSettings.major,
                "minor"      : c_oAscGridLinesSettings.minor,
                "minor_major" : c_oAscGridLinesSettings.majorMinor
            };
            var settings = new asc_ChartSettings();
            settings.putVertGridLines(map[val]);
            api.asc_editChartDrawingObject(settings);
        }
    );

    $("#changeChartTypeSelect").change(function()
    {
        var val = $("#changeChartTypeSelect").attr("value");
        var map =
        {
            "barNormal"           : c_oAscChartTypeSettings.barNormal           ,
            "barStacked"          : c_oAscChartTypeSettings.barStacked          ,
            "barStackedPer"       : c_oAscChartTypeSettings.barStackedPer       ,
            "lineNormal"          : c_oAscChartTypeSettings.lineNormal          ,
            "lineStacked"         : c_oAscChartTypeSettings.lineStacked         ,
            "lineStackedPer"      : c_oAscChartTypeSettings.lineStackedPer      ,
            "lineNormalMarker"    : c_oAscChartTypeSettings.lineNormalMarker    ,
            "lineStackedMarker"   : c_oAscChartTypeSettings.lineStackedMarker   ,
            "lineStackedPerMarker": c_oAscChartTypeSettings.lineStackedPerMarker,
            "pie"                 : c_oAscChartTypeSettings.pie                 ,
            "hBarNormal"          : c_oAscChartTypeSettings.hBarNormal          ,
            "hBarStacked"         : c_oAscChartTypeSettings.hBarStacked         ,
            "hBarStackedPer"      : c_oAscChartTypeSettings.hBarStackedPer      ,
            "areaNormal"          : c_oAscChartTypeSettings.areaNormal          ,
            "areaStacked"         : c_oAscChartTypeSettings.areaStacked         ,
            "areaStackedPer"      : c_oAscChartTypeSettings.areaStackedPer      ,
            "scatter"             : c_oAscChartTypeSettings.scatter,
            "doughnut"            : c_oAscChartTypeSettings.doughnut
        };

        var settings = new asc_ChartSettings();
        settings.putType(map[val]);
        api.asc_editChartDrawingObject(settings);
    });

    $(".dataLabelsCheckBox").change(function()
    {
       // var value = $(this).attr("value");
       // var settings = new asc_ChartSettings();
       // if(value === "catName")
       //     settings.putShowCatName(this.checked);
       // else if(value === "serName")
       //     settings.putShowSerName(this.checked);
       // else
       //     settings.putShowVal(this.checked);
       //
       // api.asc_editChartDrawingObject(settings);
    });
    $("#dataLblsPrApplyButton").click(
        function()
        {
            var val = $("#chartDataLabels").attr("value");
            var map = {
                "none"           : c_oAscChartDataLabelsPos.none,
                "center"         : c_oAscChartDataLabelsPos.ctr,
                "inner_top"      : c_oAscChartDataLabelsPos.inEnd,
                "in_base"        : c_oAscChartDataLabelsPos.inBase,
                "out_end"        : c_oAscChartDataLabelsPos.outEnd
            };
            var settings = new asc_ChartSettings();
            settings.putDataLabelsPos(map[val]);
            var check_boxes = $(".dataLabelsCheckBox");
            var i;
            for(i = 0; i < check_boxes.length; ++i)
            {
                var value = check_boxes[i].value;
                if(value === "catName")
                    settings.putShowCatName(check_boxes[i].checked);
                else if(value === "serName")
                    settings.putShowSerName(check_boxes[i].checked);
                else
                    settings.putShowVal(check_boxes[i].checked);
            }
            var separator = $("#dataLabelsSeparatorInput").attr("value");
            if(separator.length > 0)
                settings.putSeparator(separator);
            api.asc_editChartDrawingObject(settings);
        }
    );
    $("#fixedMinValValAxisCheckBox").change(function(){this.checked && $("#minValueAxisInput").removeAttr("disabled");});
    $("#autoMinValValAxisCheckBox").change(function(){this.checked && $("#minValueAxisInput").attr("disabled", "disabled");});
    $("#fixedMaxValValAxisCheckBox").change(function(){this.checked && $("#maxValueAxisInput").removeAttr("disabled");});
    $("#autoMaxValValAxisCheckBox").change(function(){this.checked && $("#maxValueAxisInput").attr("disabled", "disabled");});
    $("#logScaleInput").change(function(){this.checked ? $("#logBaseInput").removeAttr("disabled") : $("#logBaseInput").attr("disabled", "disabled")});
    $("#crossesValAxValInput").change(function(){this.checked && $("#crossesValInput").removeAttr("disabled");});
    $("#crossesAutoValAxInput").change(function(){this.checked && $("#crossesValInput").attr("disabled", "disabled");});
    $("#crossesMaxAxValInput").change(function(){this.checked && $("#crossesValInput").attr("disabled", "disabled");});



    $("#fixedMinValValAxisCheckBoxX").change(function(){this.checked && $("#minValueAxisInputX").removeAttr("disabled");});
    $("#autoMinValValAxisCheckBoxX").change(function(){this.checked && $("#minValueAxisInputX").attr("disabled", "disabled");});
    $("#fixedMaxValValAxisCheckBoxX").change(function(){this.checked && $("#maxValueAxisInputX").removeAttr("disabled");});
    $("#autoMaxValValAxisCheckBoxX").change(function(){this.checked && $("#maxValueAxisInputX").attr("disabled", "disabled");});
    $("#logScaleInputX").change(function(){this.checked ? $("#logBaseInputX").removeAttr("disabled") : $("#logBaseInputX").attr("disabled", "disabled")});
    $("#crossesValAxValInputX").change(function(){this.checked && $("#crossesValInputX").removeAttr("disabled");});
    $("#crossesAutoValAxInputX").change(function(){this.checked && $("#crossesValInputX").attr("disabled", "disabled");});
    $("#crossesMaxAxValInputX").change(function(){this.checked && $("#crossesValInputX").attr("disabled", "disabled");});


    $(".leftPanelCharPropsItemDiv").mousedown(function()
    {
        $(".leftPanelCharPropsItemDiv").removeClass("left_panel_chart_props_select");
        $(".leftPanelCharPropsItemDiv").addClass("left_panel_chart_props_no_select");
        $(this).removeClass("left_panel_chart_props_no_select");
        $(this).addClass("left_panel_chart_props_select");

        $(".right_panel_drawing_props").css("display", "none");

        var id = this.id;
        switch(id)
        {
            case "designChartLeft":
            {
                $("#rightPanelChartPropsDiv").css("display","");
                break;
            }

            case "valAxisProps":
            {
                var vert_axis_panel = $(".vertAxisPropsRightPanelActive")[0];
                if(vert_axis_panel)
                {
                    $(vert_axis_panel).css("display","");
                }
                break;
            }

            case "catAxisProps":
            {
                var hor_axis_panel = $(".horAxisPropsRightPanelActive")[0];
                if(hor_axis_panel)
                {
                    $(hor_axis_panel).css("display","");
                }
                break;
            }
        }
    });

    $("#valApplyValAxisProps").click(
        function()
        {
            var settings = new asc_ChartSettings();
            var axis_settings = new asc_ValAxisSettings();
            settings.putVertAxisProps(axis_settings);
            if($("#autoMinValValAxisCheckBox").attr("checked"))
            {
                axis_settings.putMinValRule(c_oAscValAxisRule.auto)
            }
            else
            {
                axis_settings.putMinValRule(c_oAscValAxisRule.fixed);
                axis_settings.putMinVal(parseInt($("#minValueAxisInput").attr("value")));
            }
            if($("#autoMaxValValAxisCheckBox").attr("checked"))
            {
                axis_settings.putMaxValRule(c_oAscValAxisRule.auto)
            }
            else
            {
                axis_settings.putMaxValRule(c_oAscValAxisRule.fixed);
                axis_settings.putMaxVal(parseInt($("#maxValueAxisInput").attr("value")));
            }
            $("#invertValOrderValAxisInput").attr("checked") ? axis_settings.putInvertValOrder(true) : axis_settings.putInvertValOrder(false);
            if($("#logScaleInput").attr("checked"))
            {
                axis_settings.putLogScale(true);
                axis_settings.putLogBase(parseFloat($("#logBaseInput").attr("value")));
            }
            else
            {
                axis_settings.putLogScale(false);
            }
            axis_settings.putDispUnitsRule(c_oAscValAxUnits[$("#unitsSelect").attr("value")]);
            if($("#showUnitsLabels").attr("checked"))
                axis_settings.putShowUnitsOnChart(true);
            else
                axis_settings.putShowUnitsOnChart(false);

            axis_settings.putMajorTickMark(c_oAscTickMark[$("#majorTickMarkSelectValAx").attr("value")]);
            axis_settings.putMinorTickMark(c_oAscTickMark[$("#minorTickMarkSelectValAx").attr("value")]);
            axis_settings.putTickLabelsPos(c_oAscTickLabelsPos[$("#tickLabelsSelectValAx").attr("value")]);

            if($("#crossesAutoValAxInput").attr("checked"))
            {
                axis_settings.putCrossesRule(c_oAscCrossesRule.auto);
            }
            else if($("#crossesMaxAxValInput").attr("checked"))
            {
                axis_settings.putCrossesRule(c_oAscCrossesRule.maxValue);
            }
            else
            {
                axis_settings.putCrossesRule(c_oAscCrossesRule.value);
                axis_settings.putCrosses(parseFloat($("#crossesValInput").attr("value")));
            }
            api.asc_editChartDrawingObject(settings);
        }
    );


    $("#valApplyValAxisPropsX").click(
        function()
        {
            var settings = new asc_ChartSettings();
            var axis_settings = new asc_ValAxisSettings();
            settings.putHorAxisProps(axis_settings);
            if($("#autoMinValValAxisCheckBoxX").attr("checked"))
            {
                axis_settings.putMinValRule(c_oAscValAxisRule.auto)
            }
            else
            {
                axis_settings.putMinValRule(c_oAscValAxisRule.fixed);
                axis_settings.putMinVal(parseInt($("#minValueAxisInputX").attr("value")));
            }
            if($("#autoMaxValValAxisCheckBoxX").attr("checked"))
            {
                axis_settings.putMaxValRule(c_oAscValAxisRule.auto)
            }
            else
            {
                axis_settings.putMaxValRule(c_oAscValAxisRule.fixed);
                axis_settings.putMaxVal(parseInt($("#maxValueAxisInputX").attr("value")));
            }
            $("#invertValOrderValAxisInputX").attr("checked") ? axis_settings.putInvertValOrder(true) : axis_settings.putInvertValOrder(false);
            if($("#logScaleInputX").attr("checked"))
            {
                axis_settings.putLogScale(true);
                axis_settings.putLogBase(parseFloat($("#logBaseInputX").attr("value")));
            }
            else
            {
                axis_settings.putLogScale(false);
            }
            axis_settings.putDispUnitsRule(c_oAscValAxUnits[$("#unitsSelectX").attr("value")]);
            if($("#showUnitsLabelsX").attr("checked"))
                axis_settings.putShowUnitsOnChart(true);
            else
                axis_settings.putShowUnitsOnChart(false);

            axis_settings.putMajorTickMark(c_oAscTickMark[$("#majorTickMarkSelectValAxX").attr("value")]);
            axis_settings.putMinorTickMark(c_oAscTickMark[$("#minorTickMarkSelectValAxX").attr("value")]);
            axis_settings.putTickLabelsPos(c_oAscTickLabelsPos[$("#tickLabelsSelectValAxX").attr("value")]);

            if($("#crossesAutoValAxInputX").attr("checked"))
            {
                axis_settings.putCrossesRule(c_oAscCrossesRule.auto);
            }
            else if($("#crossesMaxAxValInputX").attr("checked"))
            {
                axis_settings.putCrossesRule(c_oAscCrossesRule.maxValue);
            }
            else
            {
                axis_settings.putCrossesRule(c_oAscCrossesRule.value);
                axis_settings.putCrosses(parseFloat($("#crossesValInputX").attr("value")));
            }
            api.asc_editChartDrawingObject(settings);
        }
    );


    $(".intervalBetweenLabelsCatAxInput").change(
        function()
        {
            this.value === "auto" ? $("#intervalBetweenLabelsInputCatAxManual").attr("disabled", "disabled") : $("#intervalBetweenLabelsInputCatAxManual").removeAttr("disabled");
        }
    );

    $("#crossesAutoCatAxInput").change(
        function()
        {
          $("#crossesCatInput").attr("disabled", "disabled");
        }
    );

    $("#crossesMaxAxCatInput").change(
        function()
        {
            $("#crossesCatInput").attr("disabled", "disabled");
        }
    );

    $("#crossesCatAxValInput").change(
        function()
        {
            $("#crossesCatInput").removeAttr("disabled");
        }
    );

    $("#valApplyCatAxisProps").click(
        function()
        {
            var settings = new asc_ChartSettings();
            var axis_settings = new asc_CatAxisSettings();


            if(!$("#rightPanelValAxisPropsX").hasClass("horAxisPropsRightPanelActive"))
                settings.putHorAxisProps(axis_settings);
            else
                settings.putVertAxisProps(axis_settings);
            axis_settings.putIntervalBetweenLabels(parseInt($("intervalBetweenTickInput").attr("value")));
            if($("#autoIntervalBetweenLabelsInputCat").attr("checked"))
            {
                axis_settings.putIntervalBetweenLabelsRule(c_oAscBetweenLabelsRule.auto);
            }
            else
            {
                axis_settings.putIntervalBetweenLabelsRule(c_oAscBetweenLabelsRule.manual);
                axis_settings.putIntervalBetweenLabels(parseInt($("#intervalBetweenLabelsInputCatAxManual").attr("value")));
            }
            if($("#invertCatOrderCheckBox").attr("checked"))
                axis_settings.putInvertCatOrder(true);
            else
                axis_settings.putInvertCatOrder(false);
            axis_settings.putLabelsAxisDistance(parseInt($("#labelsAxisInputDistanceInput").attr("value")));
            if($("#catAxisTypeInputAuto").attr("checked"))
                axis_settings.putAxisType(c_oAscHorAxisType.auto);
            else if($("#catAxisTypeInputText").attr("checked"))
                axis_settings.putAxisType(c_oAscHorAxisType.text);
            else
                axis_settings.putAxisType(c_oAscHorAxisType.date);

            axis_settings.putMajorTickMark(c_oAscTickMark[$("#majorTickMarkSelectCatAx").attr("value")]);
            axis_settings.putMinorTickMark(c_oAscTickMark[$("#minorTickMarkSelectCatAx").attr("value")]);
            axis_settings.putTickLabelsPos(c_oAscTickLabelsPos[$("#tickLabelsSelectCatAx").attr("value")]);

            if($("#crossesAutoCatAxInput").attr("checked"))
            {
                axis_settings.putCrossesRule(c_oAscCrossesRule.auto);
            }
            else if($("#crossesCatAxValInput").attr("checked"))
            {
                axis_settings.putCrossesRule(c_oAscCrossesRule.value);
                axis_settings.putCrosses(parseFloat($("#crossesCatInput").attr("value")));
            }
            else
            {
                axis_settings.putCrossesRule(c_oAscCrossesRule.maxValue);
            }
            if($("#checkBoxByDivisionsInput").attr("checked"))
                axis_settings.putLabelsPosition(c_oAscLabelsPosition.byDivisions);
            else
                axis_settings.putLabelsPosition(c_oAscLabelsPosition.betweenDivisions);

            api.asc_editChartDrawingObject(settings);
        }
    );

});

