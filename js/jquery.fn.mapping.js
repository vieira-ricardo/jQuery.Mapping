/**
*
* JQuery fn.mapping plugin v1.0 
* created by: ricardo vieira
* blog - https://rvieiraweb.wordpress.com/
* linked in - http://www.linkedin.com/profile/view?id=231336538
* github - https://github.com/vieira-ricardo
*
* Last Modified: 01-April-2013
*/

(function () {

    "use strict";
        
    $.fn.mapping = function (options) {

        var $divObj = $(this);
        var mainDiv = $divObj.selector;

        //current date
        var currentDate = new Date();
        var day = currentDate.getDate();
        var month = currentDate.getUTCMonth() + 1;
        var year = currentDate.getUTCFullYear();

        var totalRows = 0;
        var lastTr = 0;
        var context_month;
        var names_arr;
        var desc_array;
        var newElement;
        var post_back = false;
                     
        /// default configuration
        var settings = {
            source: null,
            holidays: null,
            year: year,
            group1Text: "",
            group2Text: "",           
            headerTitle: "",
            headerYear: "Year",
            filter: ["filter", "graph", "facebook"],
            multiSelect: false,
            sumText: ["Day", "Days"],
            groupingView: {
                groupCollapse: false,
                sort: [{
                    groups: [],
                    param: ""
                }]
            },
            scale: "month",            
            errorText: "Source not available",
            waitText: "Loading, Please Wait.."
        };

        var fields = {
            id: "id",
            descid: "desc_id",
            name : "name",
            desc: "desc",
            date: "date",
            customLabel: "customLabel",
            customClass: "customClass",
            customTitle: "customTitle",
            dateid: "dateid"
        };        
                    
        /// check for undefined object options     
        if (typeof options === "undefined")
            options = settings;
            
        var styles = {
            loading_image: "../Scripts/Images/loading_icon.gif"        
        };        
        
        /// get the numbers of days in a month
        function daysInMonth(m, y) { 
            switch (m) {
                case 1:
                    return (y % 4 == 0 && y % 100) || y % 400 == 0 ? 29 : 28;
                case 8: case 3: case 5: case 10:
                    return 30;
                default:
                    return 31;
            }
        }

        function isValid(d, m, y) {
            return m >= 0 && m < 12 && d > 0 && d <= daysInMonth(m, y);
        }
        
        /// set date format dd-mm-yyyy
        function formatDate(date)
        {
            var finalDate = "";

            if (date.search(/^\d{1,2}[\/|\-|\.|_]\d{1,2}[\/|\-|\.|_]\d{4}/g) != 0)
                return finalDate;
                        
            if (date.contains("-") != -1)
            {
                var a = date.split("-");
                if (a[0].length > 2) {
                    return a[2] + "-" + a[1] + "-" + a[0];
                } else
                    return date;
            }

            if (date.contains("/") != -1) {
                date = date.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g,'-');                
                var a = date.split("-");                
                if (a[0].length > 2) {
                    return a[2] + "-" + a[1] + "-" + a[0];
                } else
                    return date;
            }     
            return finalDate;
        }

        function checkMultiSelect(index, multi, type) {
            if (type == 0) {
                if (multi)
                    return '<input type="checkbox" class="checkboxes" name="check" id="check_' + index + '" value="' + index + '">';
                else
                    return "";
            }

            if (type == 1)
            {
                if (multi)               
                    return '<input type="checkbox" class="checkboxes" name="check" id="check_' + index + '" value="">';
                else
                    return "";
            }
        }

        function orderSelected(div) {
            $(div).append($(div).find('option').sort(function (a, b) {
                return (
                    a = $(a).text(),
                    b = $(b).text(),
                    a == 'NA' ? 1 : b == 'NA' ? -1 : 0 | a > b
                );
            }));
        }

        function renderLastBorder(div, n)
        {            
            var tt = totalRows - 1;            
            for (var p = 1; p <= n; p++)
                $("#" + div + tt + "_" + p).css("border-bottom", "1px solid #DDDDDD");
        }
               
        /// sort array source
        function sortElementSource(array, sortarray) {                   
            var grouping = sortarray[0];
            var g = grouping["groups"];
            
            if (g.length == 1) {            
                array.sort(function (a, b) {
                    if (a[g[0]] == b[g[0]])
                        return 0;
                    if (a[g[0]] < b[g[0]])
                        return -1;
                    if (a[g[0]] > b[g[0]])
                        return 1;
                });
            } else {               
                if (grouping["order"] == "desc")
                    sortObjects(array, [g[0], [g[1], 'desc']], { });
                else
                    sortObjects(array, [g[0], [g[1], 'asc']], {});

            }
            return array;
        }
       
        function parseString(dateStringInRange) {
            var isoExp = /^\s*(\d{4})-(\d\d)-(\d\d)\s*$/,
                date = new Date(NaN), month,
                parts = isoExp.exec(dateStringInRange);

            if (parts) {
                month = +parts[2];
                date.setFullYear(parts[1], month - 1, parts[3]);
                if (month != date.getMonth() + 1) {
                    date.setTime(NaN);
                }
            }
            return date;
        }

        function getWeekName(element, date, type)
        {            
            if (date.contains("/") != -1) 
                date = date.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '-');
            
            var strsplit = date.split("-");
            if (strsplit[0].length == 2)
                date = strsplit[2] + "-" + strsplit[1] + "-" + strsplit[0];
            
            var myDate = new Date(parseString(date));
            if (type == "name") {
                return element.weeks[myDate.getDay()];
            }
            else {
                return myDate.getDay();
            }
        }

        function selectCheckBoxes() {
            if ($("#check_0").length) {
                $("#check_0").click(function () {
                    $(this).closest('table').find('input[type=checkbox]').prop('checked', this.checked);
                });
            }
        }        

        String.prototype.contains = function (it) {
            return this.search(it);
        };

        jQuery.fn.filterByText = function (textbox) {
            return this.each(function () {
                var select = this;
                var options = [];
                $(select).find('option').each(function () {
                    options.push({ value: $(this).val(), text: $(this).text() });
                });
                $(select).data('options', options);

                $(textbox).bind('change keyup', function () {
                    var options = $(select).empty().data('options');
                    var search = $.trim($(this).val());
                    var regex = new RegExp(search, "gi");

                    $.each(options, function (i) {
                        var option = options[i];
                        if (option.text.match(regex) !== null) {
                            $(select).append(
                                $('<option>').text(option.text).val(option.value)
                            );
                        }
                    });
                });
            });
        };

        Array.prototype.removeValue = function (name, value) {
            var array = jQuery.map(this, function (v, i) {
                return v[name] === value ? null : v;
            });

            this.length = 0; 
            this.push.apply(this, array); 
        }

        /// sort array multidimensional
        function sortObjects(objArray, properties) {
            var primers = arguments[2] || {}; 
                     
            properties = jQuery.map(properties, function(prop) { 
                if (!(prop instanceof Array)) {
                    prop = [prop, 'asc']
                }
                if (prop[1].toLowerCase() == 'desc') {
                    prop[1] = -1;
                } else {
                    prop[1] = 1;
                }
                return prop;
            });

            function valueCmp(x, y) {
                return x > y ? 1 : x < y ? -1 : 0;
            }

            function arrayCmp(a, b) {
                var arr1 = [], arr2 = [];                
                $.each(properties, function(prop) {
                    var aValue = a[prop[0]],
                        bValue = b[prop[0]];
                    if (typeof primers[prop[0]] != 'undefined') {
                        aValue = primers[prop[0]](aValue);
                        bValue = primers[prop[0]](bValue);
                    }
                    arr1.push(prop[1] * valueCmp(aValue, bValue));
                    arr2.push(prop[1] * valueCmp(bValue, aValue));
                });
                return arr1 < arr2 ? -1 : 1;
            }

            objArray.sort(function (a, b) {
                return arrayCmp(a, b);
            });
            
        }
              
        /// core functions for mapping
        var core = {
            /// init elements
            init: function (element) {
                                               
                totalRows = 0;
                core.contextMonthClear();
                $(mainDiv).empty();
                core.renderDialog(element);

                if ((element.source == null) || !$.isArray(element.source)) {
                    element = $.extend(settings, element);
                    core.create(element, false);
                    return;
                }

                element = $.extend(settings, element);
                core.create(element, true);
            },

            /// create elements
            create: function (element, check) {
                if (!check) {
                    core.noSource(element);
                    return;
                }
                if (element.groupingView["sort"].length)
                    if (!post_back)
                        element.source = sortElementSource(element.source, element.groupingView["sort"]);                         
              
                post_back = true;
                core.render(element);
            },

            /// render UI
            render: function (element) {

                if (element.scale == "year") {
                    core.renderFullYear(element);
                    return;
                }

                var mainhtml = "";
                mainhtml = core.topPanel(element, mainhtml);
                mainhtml += core.middlePanel(element, mainhtml);
                $(mainDiv).append(mainhtml);
                core.filters(element, "month");
                core.renderSpanMonth(element, 0, 0);
                core.renderBlock(element);
                core.removeLastBorder();

                /// select all checkboxes if multiselected
                selectCheckBoxes();

                /// render last border
                renderLastBorder("row_", 14);

                /// selected color 
                $(".mapDivButtonM").css("background-color", "#cccccc");
                $('.mapDivButtonY').mouseover(function () {
                    $(this).toggleClass('mapHouverbt')
                })
                .mouseout(function () {
                    $(this).removeClass('mapHouverbt')
                })
                .click(function () {
                    element.scale = "year";
                    core.renderFullYear(element);
                });

                if (element.headerTitle == "")
                    $('.mapHeaderMonth').css("border-left", "none");

                $('#special_div').css("border-right", "none");                                
            },

            renderSpanMonth: function (element, type, dayMonth)
            {
                if (type == 0) {
                    for (var p = 1; p <= 12; p++) {
                        $('#month_' + p).click(function () {
                            core.zoomInMonth(element, this.id);
                        });
                    }
                }

                if (type == 1) {
                    var spanbar = $('<span class="spanMonthOut">&nbsp;</span>');
                    $('#monthZoomOut').append(spanbar);
                    spanbar.click(function () {
                        core.init(element);
                    });    
                }
            },

            /// render date in specific block  
            renderBlock: function (element) {
                var dateStart = "";
                       
                /// paint dates
                $.each(element.source, function (i, entry) {
                    $.each(entry["values"], function (y, values) {

                        /// get date formated                                                
                        dateStart = formatDate(values[fields.date]);
                        if (dateStart != "") {     
                            var daySplit = dateStart.split('-');                         
                            
                            /// current month
                            core.renderDayColor(element,i, month, "dayMonth", "");
                            
                            /// render value      
                            var dayD = parseFloat(daySplit[1]);                            
                            core.renderDayColor(element,i, dayD, "dayDiv", values);
                        }
                        else                        
                            console.log("Invalid Date Format: " + values[fields.date]);
                        
                    });

                    /// render name, desc
                    core.renderDayColor(element,i, entry, "dayNameDesc");
                    totalRows++;
                });

                /// set click 
                for (var p = 1; p <= 12; p++) {
                    $('#month_' + p).mouseover(function () {                        
                        $(this).toggleClass('mapHouver');
                    })
                    .mouseout(function () {
                        $(this).removeClass('mapHouver')
                    });
                }

                $('.mapGroupG1').mouseover(function () {
                    $(this).toggleClass('mapHouverbt')
                })
                .mouseout(function () {
                    $(this).removeClass('mapHouverbt')
                });

                $('.mapGroupG2').mouseover(function () {
                    $(this).toggleClass('mapHouverbt')
                })
                .mouseout(function () {
                    $(this).removeClass('mapHouverbt')
                });
            },
            
            /// render colors in days
            renderDayColor: function (element,index, dayM, type, values)
            {
                switch(type)
                {       
                    case "dayMonth":
                        $('#month_' + dayM).css("background-color", "#9F9F9F");
                        break;

                    case "dayDiv":                       
                        var divValue = 1;
                        var bar;                        
                        //get value in div
                        if ($("#date_" + dayM+ "_"+index).length > 0) {                            
                            var divValue = parseFloat($("#date_" + dayM + "_" + index).text());                            
                            divValue++;
                        }
                     
                        if (divValue == 1) {
                            bar = $('<div class="bar" id="date_' + dayM + '_' + index + '"><div style="margin-top:0;">' + divValue + '</div></div>')
                                                                                          .addClass(values[fields.customClass])
                                                                                          .attr('title', values[fields.customTitle])
                                                                                          .click(function () {
                                                                                              core.onItemClick(element, dayM, index, element.source[index][fields.id], element.source[index][fields.descid]);
                                                                                          });

                            var dayDiv = dayM + 2;
                                                        
                            $('#row_' + index + '_' + dayDiv).append(bar);
                        } else {
                            $("#date_" + dayM + "_" + index).text(divValue);
                        } 
                                             
                        break;

                    case "dayNameDesc":
                        $('#row_' + index + '_1').append(dayM[fields.name]).click(function () { core.renderGroup1(element,dayM[fields.id]); });
                        $('#row_' + index + '_2').append(dayM[fields.desc]).click(function () { core.renderGroup2(element,dayM[fields.descid]); });               
                        break;
                }           

            },       

            /// on clicked number in month scale
            onItemClick: function (element, total, index, id, idgroup2) {          
                var newMain = '';
                var dateStart = '';
                var index = -1;
                var dateMonth = 0;
                var idName = "";
                var nameDiv = -1;
                core.contextMonthClear();

                $.each(element.source, function (i, entry) {
                    if (element.source[i][fields.id] == id) {
                        $.each(entry["values"], function (j, values) {
                            if (element.source[i][fields.descid] == idgroup2) {
                                dateStart = formatDate(values[fields.date]);
                                if (dateStart != "") {
                                    var daySplit = dateStart.split('-');
                                    dateMonth = parseFloat(daySplit[1]);
                                    nameDiv = dateMonth;
                                }
                            }
                        });
                    }
                });
                
                $(mainDiv).empty();
                newMain = core.renderTopPanels(element, nameDiv, "specify");
                $(mainDiv).append(newMain);
                $.each(element.source, function (i, entry) {

                    if (element.source[i][fields.id] == id) {
                        $.each(entry["values"], function (j, values) {                            
                            if (element.source[i][fields.descid] == idgroup2) {
                                if (element.source[i][fields.name] != "")
                                    idName = element.source[i][fields.name];
                                else
                                    idName = core.findInArray(element, entry[fields.id]);

                                dateStart = formatDate(values[fields.date]);
                                if (dateStart != "") {
                                    var daySplit = dateStart.split('-');
                                    dateMonth = parseFloat(daySplit[1]);
                                    core.setContextMonth(dateMonth);
                                    if (index != i)
                                        $("#rowyear_" + dateMonth).closest("tr").after(core.renderInMonthMiddle(entry["values"].length, entry[fields.desc], i, dateMonth, entry[fields.id], entry[fields.descid]));

                                    var bar = $('<div class="bar"><div style="margin-top:0;">' + values[fields.customLabel] + '</div></div>')
                                                                                                  .addClass(values[fields.customClass])
                                                                                                  .attr('title', values[fields.customTitle]);

                                    $("#rowZoomDay_" + i + "_" + parseFloat(daySplit[0])).append(bar);


                                }
                                index = i;
                            }
                        });
                    }
                });

                $("#specialdivName").text(idName)
                                    .css("color", "#6E829A");

                $('.mapGroupG1').each(function (i, obj) {
                    if ($(this).text() == "1") {
                        $(this).append(" " + element.sumText[0]);
                    } else {
                        $(this).append(" " + element.sumText[1]);
                    }
                });

                $('.mapGroupG1').addClass('mapSum');

                //hide month without data
                core.setVisibleMonths();

                /// select all checkboxes if multiselected
                selectCheckBoxes();

                //validate if its collapse or not
                if (element.groupingView["groupCollapse"]) {
                    var counter = 1;
                    $.each(context_month, function (i, value) {
                        if (value == 1) {
                            $(".dateM_" + counter).hide();
                            $("#group_" + counter).toggleClass('mapYearUnGroup');
                        }
                        counter++;
                    });
                }

                $('.mapDivButtonB').mouseover(function () {
                    $(this).toggleClass('mapHouverbt')
                });

                $('.mapDivButtonB').mouseout(function () {
                    $(this).removeClass('mapHouverbt')
                });
                             
                $(".mapDivButtonB").click(function () {                    
                    core.init(element);
                });

                //append last row
                core.filters(element, "year");

                //render last border                    
                $(".dateM_" + parseFloat(lastTr) + ":last").find('td').each(function () {
                    $(this).css("border-bottom", "1px solid #DDDDDD");
                });

                //render current day
                if (nameDiv == month) {
                    $("#zoomDay_" + day).css("background-color", "#9F9F9F");
                    $("#zoomDay_" + day).css("color", "#ffffff");
                    $("#zoomDay_" + day).css("font-weight", "bold");
                }
                
                //render saturdays and sundays
                core.renderWeekend(element, index, "year", 0);

                $('#special_div').css("border-right", "none");            

                //remove month days not supported
                core.renderDayMonthNull(element);

                //toggle days in month
                for (var p = 1; p <= 31; p++) {
                    $("#zoomDay_" + p).click(function (event) {
                        var ss = (event.target.id).split("_");
                        for (var j = 0; j <= index; j++)
                            $("#rowZoomDay_" + j + "_" + ss[1]).toggleClass("mapToggleDays");
                    })
                    .mouseover(function () {
                        $(this).toggleClass('mapHouverbt')
                    })
                    .mouseout(function () {
                        $(this).removeClass('mapHouverbt')
                    });
                }

                if ($.trim($("#mapDivHeaderText").text()) != "")
                    $('#monthZoomOut').css("border-left", "1px solid #DDDDDD");               
              
            },

            /// top panel UI
            topPanel: function (element, html) {
                var mapTopLeftPanel = '<table id="mainTable" class="mapTopTable" cellspacing="0" cellpadding="0">' +
                                        '<tr>' +
                                        '<td colspan="3" class="mapYear">' + element.headerYear + ' ' + element.year +'</td>' +
                                        '<td colspan="12" class="mapHeaderMonth">' +                                        
                                        '<div class="mapDivButtonY">' + element.buttons[0] + '</div>' +
                                        '<div class="mapDivButtonM">' + element.buttons[1] + '</div>' +
                                        '<div class="mapDivHeaderText">' + element.headerTitle + '</div>' +                                         
                                        '</td></tr><tr>';
                

                if ((element.group1Text != "") || (element.group2Text)) {
                    if (!element.multiSelect) {
                        mapTopLeftPanel += '<td class="mapGroup"><span class="mapColHeader">' + element.group1Text + '</span></td>' +
                        '<td id="special_div" class="mapGroup"><span class="mapColHeader">' + element.group2Text + '</span></td>';
                    }
                    else
                    {
                        mapTopLeftPanel += '<td class="mapGroupHeader">'+
                                           '<input type="checkbox" value="" id="check_0" name="check" class="checkboxes"></td><td class="mapGroup"><span class="mapColHeader">' + element.group1Text + '</span></td>' +
                       '<td id="special_div" class="mapGroup"><span class="mapColHeader">' + element.group2Text + '</span></td>';
                    }
                } else {
                    mapTopLeftPanel += '<td class="mapGroup"></td>' +
                                         '<td class="mapGroup"></td>';
                }

                for (var p = 0; p < options.monthsDow.length; p++)
                    mapTopLeftPanel += '<td class="mapGroupMonths" id="month_' + (p + 1) + '" title="' + options.months[p] + '">' + options.monthsDow[p] + '</td>';

                mapTopLeftPanel += '</tr>';
                return mapTopLeftPanel;
            },
              
            /// middle panel UI
            middlePanel: function (element, html) {
                var mapMiddleLeftPanel = '';
                $.each(element.source, function (i, entry) {       
                    mapMiddleLeftPanel += core.fillTable(element.multiSelect, entry, i);
                });

                mapMiddleLeftPanel += '</table>';
                return mapMiddleLeftPanel;
            },
                
            /// no data source
            noSource: function (element) {
                $(mainDiv).append("<div class='mapError'><img src='" + styles.loading_image + "'/>"+
                                  "<br><span class='mapErrorMsg'>" + element.errorText + "</span></div>");
            },

            /// filters ?
            filters: function (element, scaletype) {
                var fill = '';              

                if ((element.filter != null) || $.isArray(element.filter)) {                    
                    for (var p = 0; p < element.filter.length; p++) {
                        if (element.filter[p] == "filter")
                            fill += '<div class="searchBarIcon"></div>';

                        if (element.filter[p] == "facebook")
                            fill += '<div class="facebookBarIcon"></div>';

                        if (element.filter[p] == "graph")
                            fill += '<div class="chartBarIcon"></div>';
                    }
                }
               
                var mapFilter = "";
                if (scaletype == "month") {
                    if (element.multiSelect)
                        mapFilter = '<tr><td colspan="15" class="mapFiltersSpan12">' + fill + '</td></tr>';
                    else
                        mapFilter = '<tr><td colspan="14" class="mapFiltersSpan12">' + fill + '</td></tr>';
                }
                
                if (scaletype == "year") {
                    if (element.multiSelect)
                        mapFilter = '<tr><td colspan="34" class="mapFiltersSpan12">' + fill + '</td></tr>';
                    else
                        mapFilter = '<tr><td colspan="33" class="mapFiltersSpan12">' + fill + '</td></tr>';
                }

                $('#mainTable tr:last').after(mapFilter);

                //click search
                $('.searchBarIcon').click(function () {
                    core.renderFilterClicked(element);                                       
                });

                $("#map_filtergo").click(function () {                  
                    core.filterAllData();
                });

                $("#filterClose").click(function () {
                    jQuery('#dialog').dialog('close');
                });
            },

            /// Days UI top panel
            fillDays: function ()
            {
                var mapDays = '';
                for (var p = 1; p <= 31; p++)
                    if (p == day)
                        mapDays += '<td  class="mapDays" id="currentDay"><b>' + p + '</b></td>';
                    else
                        mapDays += '<td  class="mapDays">' + p + '</td>';

                return mapDays;
            },

            /// Block to paint 
            fillTable: function (multi, entry, index)
            {                
                var mapDays = '<tr>';

                if (options.multiSelect) {
                    for (var p = 1; p <= 15; p++) {
                        if (p == 1)
                            mapDays += '<td class="mapGroupHeader"><input type="checkbox" class="checkboxes" name="check" id="check_' + index + '" value="' + p + '"></td>';
                        
                        if (p == 2)
                            mapDays += '<td  class="mapGroupG1" id="row_' + index + '_' + (p-1) + '"> </td>';
                        
                        if (p == 3)
                            mapDays += '<td  class="mapGroupG2" id="row_' + index + '_' + (p - 1) + '"></td>';
                        
                        if (p > 3)
                            mapDays += '<td  class="mapGroupMonthsDays" id="row_' + index + '_' + (p - 1) + '"></td>';
                        
                    }
                } else {
                    for (var p = 1; p <= 14; p++) {
                        if (p <= 2) {
                            if (p == 1)
                                mapDays += '<td  class="mapGroupG1" id="row_' + index + '_' + p + '"> </td>';
                            else
                                mapDays += '<td  class="mapGroupG2" id="row_' + index + '_' + p + '"></td>';
                        } else {
                            mapDays += '<td  class="mapGroupMonthsDays" id="row_' + index + '_' + p + '"></td>';
                        }
                    }
                }

                mapDays += '</tr>';
                return mapDays;
            },

            /// middle data table          
            removeLastBorder: function ()
            {
                $(".mapMiddleTable tr:last").find('td').each(function () {
                    $(this).css("border-bottom", "none");
                });
            },

            //zoom in month
            zoomInMonth: function (element, spanid)
            {                
                //validate if has data to show
                var strSplit = spanid.split('_');              
                var counter = 0;
                var divInside;
                                
                for (var k = 0; k < totalRows; k++) {    
                    var calc = parseFloat(strSplit[1]) + 2;
                    divInside = $("#row_" + k + "_" + calc);
                    if ($.trim($(divInside).text()) != "")                         
                        counter++;                    
                }
                
                if (counter > 0) {                    
                    var newMain = '';
                    var dateStart = '';
                    var counter = 0;
                    var index = 0;
                    $(mainDiv).empty();

                    newMain = core.renderTopPanels(element, strSplit[1], "month");
                    $(mainDiv).append(newMain);
                    core.renderSpanMonth(element, 1, parseFloat(strSplit[1]));
                    
                    $.each(element.source, function (i, entry) {
                        var valid = 0;
                        $.each(entry["values"], function (j, values) {

                            dateStart = formatDate(values[fields.date]);
                            if (dateStart != "") {
                                var daySplit = dateStart.split('-');

                                /// get the month
                                if (parseFloat(daySplit[1]) == parseFloat(strSplit[1])) {

                                    if (valid == 0) {
                                        $('#mainTable tr:last').after(core.renderInMonthMiddle(entry[fields.name], entry[fields.desc], i, (index + 1), entry[fields.id], entry[fields.descid]));
                                        valid++;

                                        //append                                                                        

                                        var bar = $('<div class="bar"><div style="margin-top:0;">' + values[fields.customLabel] + '</div></div>')
                                                                                            .addClass(values[fields.customClass])
                                                                                            .attr('title', values[fields.customTitle]);

                                        $("#rowZoomDay_" + i + "_" + parseFloat(daySplit[0])).append(bar);  
                                        index++;                                        
                                    }
                                    else {
                                        //append
                                        var bar = $('<div class="bar"><div style="margin-top:0;">' + values[fields.customLabel] + '</div></div>')
                                                                                         .addClass(values[fields.customClass])
                                                                                         .attr('title', values[fields.customTitle]);

                                        $("#rowZoomDay_" + i + "_" + parseFloat(daySplit[0])).append(bar);
                                    }                                       
                                  
                                    counter++;
                                }
                            }
                            else {
                                console.log("Invalid Date Format: " + values[fields.date]);
                            }

                        });                        
                    });
                          
                    if (parseFloat(strSplit[1]) == month) {
                        $("#zoomDay_" + day).css("background-color", "#9F9F9F");
                        $("#zoomDay_" + day).css("color", "#ffffff");
                        $("#zoomDay_" + day).css("font-weight", "bold");
                    }

                    //render last border                    
                    $(".dateM_" + index).find('td').each(function () {
                        $(this).css("border-bottom", "1px solid #DDDDDD");
                    });

                    /// select all checkboxes if multiselected
                    selectCheckBoxes();

                    core.filters(element, "year");
                                        
                    $('.mapDivButtonB').mouseover(function () {
                        $(this).toggleClass('mapHouverbt')
                    })
                    .mouseout(function () {
                        $(this).removeClass('mapHouverbt')
                    });

                    $(".mapDivButtonB").click(function () {                        
                        core.init(element);
                    });

                    $('#special_div').css("border-right", "none");
                    
                    //remove month days not supported
                    var dm = daysInMonth(parseFloat(strSplit[1] - 1), element.year);
               
                    for (var p = 0; p <= element.source.length; p++)
                        for (var j = dm + 1; j <= 31; j++)
                            $("#rowZoomDay_" + p + "_" + j).text("X").addClass("mapNoMonthDays");

                    core.renderWeekend(element, index, "month", parseFloat(strSplit[1]));

                    //toggle days in month
                    for (var p = 1; p <= 31; p++) {
                        $("#zoomDay_" + p).click(function (event) {
                            var ss = (event.target.id).split("_");
                            for (var j = 0; j <= index; j++)
                                $("#rowZoomDay_" + j + "_" + ss[1]).toggleClass("mapToggleDays");
                        })
                        .mouseover(function () {
                            $(this).toggleClass('mapHouverbt')
                        })
                        .mouseout(function () {
                            $(this).removeClass('mapHouverbt')
                        });
                    }
                    
                    //render holidays                    
                    core.renderHolidays(element, "month", parseFloat(strSplit[1]), index);
                }
            },
          
            /// render holidays
            renderHolidays: function (element, type, currentm, pos) {
                var dateStart = "";

                if (element.holidays != null)
                {
                    if (type == "year") {
                        for (var p = 0; p < element.holidays.length; p++) {
                            dateStart = formatDate(element.holidays[p]["date"]);
                            if (dateStart != "") {
                                var daySplit = dateStart.split('-');
                                var cmonth = parseFloat(daySplit[1]);
                                if ($(".dateM_" + cmonth).is(":visible")) {
                                    $("tr.dateM_" + cmonth).each(function () {
                                        $(this).find("td").each(function (j, value) {
                                            if (j - 1 == parseFloat(daySplit[0]))
                                                $(this).text(element.holidays[p]["dow"])
                                                    .addClass("mapHolidays")
                                                    .prop("title", element.holidays[p]["title"])
                                                    .css("cursor", "pointer");
                                        });
                                    });
                                }
                            }
                        }
                    }
                    else {
                        for (var p = 0; p < element.holidays.length; p++) {
                            dateStart = formatDate(element.holidays[p]["date"]);
                            if (dateStart != "") {
                                var daySplit = dateStart.split('-');
                                var cmonth = parseFloat(daySplit[1]);
                                if (cmonth == currentm)
                                {
                                    for (var k = 1; k <= pos; k++) {
                                        $("tr.dateM_" + k).each(function () {
                                            $(this).find("td").each(function (j, value) {
                                                if (j - 1 == parseFloat(daySplit[0]))
                                                    $(this).text(element.holidays[p]["dow"])
                                                        .addClass("mapHolidays")
                                                        .prop("title", element.holidays[p]["title"])
                                                        .css("cursor", "pointer");
                                            });
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            },

            /// render full year calendar
            renderFullYear: function (element)
            {
                var newMain = '';
                var dateStart = '';
                var index = -1;
                var dateMonth = 0;
                var idName = "";
                core.contextMonthClear();
                             
                $(mainDiv).empty();
                newMain = core.renderTopPanels(element, "", "year");
                $(mainDiv).append(newMain);
                
                $.each(element.source, function (i, entry) {                    
                    $.each(entry["values"], function (j, values) {

                        if (entry[fields.name] == "")
                            idName = core.findInArray(element, entry[fields.id]);
                        else
                            idName = entry[fields.name];

                        dateStart = formatDate(values[fields.date]);
                        if (dateStart != "") {
                            var daySplit = dateStart.split('-');
                            dateMonth = parseFloat(daySplit[1]);
                            core.setContextMonth(dateMonth);                                                       
                            if (index != i)
                                $("#rowyear_" + dateMonth).closest("tr").after(core.renderInMonthMiddle(idName, entry[fields.desc], i, dateMonth, entry[fields.id], entry[fields.descid]));
                            
                            var bar = $('<div class="bar"><div style="margin-top:0;">' + values[fields.customLabel] + '</div></div>')
                                                                                          .addClass(values[fields.customClass])
                                                                                          .attr('title', values[fields.customTitle]);

                            $("#rowZoomDay_" + i + "_" + parseFloat(daySplit[0])).append(bar);
                            
                        }
                        index = i;
                    });                   
                });

                core.setVisibleMonths();

                //validate if its collapse or not
                if (element.groupingView["groupCollapse"]) {
                    var counter = 1;
                    $.each(context_month, function (i, value) {
                        if (value == 1) {
                            $(".dateM_" + counter).hide();
                            $("#group_" + counter).toggleClass('mapYearUnGroup');
                        }
                        counter++;
                    });
                }
                
                /// select all checkboxes if multiselected
                selectCheckBoxes();

                //selected color 
                $(".mapDivButtonY").css("background-color", "#cccccc");

                $('.mapDivButtonM').mouseover(function () {
                    $(this).toggleClass('mapHouverbt')
                });

                $('.mapDivButtonM').mouseout(function () {
                    $(this).removeClass('mapHouverbt')
                });
                     
                $(".mapDivButtonM").click(function () {
                    element.scale = "month";
                    core.init(element);
                });

                //append last row
                core.filters(element, "year");
                
                //render last border                    
                $(".dateM_" + parseFloat(lastTr) + ":last").find('td').each(function () {
                    $(this).css("border-bottom", "1px solid #DDDDDD");
                });

                //render current day
                $("#zoomDay_" + day).css("background-color", "#9F9F9F");
                $("#zoomDay_" + day).css("color", "#ffffff");
                $("#zoomDay_" + day).css("font-weight", "bold");

                //render 
                if (element.headerTitle == "") {                    
                    $('.mapHeaderMonth').css("border-left", "none");
                }

                //render saturdays and sundays
                core.renderWeekend(element, index, "year", 0);
                
                $('#special_div').css("border-right", "none");
                
                //remove month days not supported
                core.renderDayMonthNull(element);

                $('.mapGroupG1').mouseover(function () {
                    $(this).toggleClass('mapHouverbt')
                });

                $('.mapGroupG1').mouseout(function () {
                    $(this).removeClass('mapHouverbt')
                });

                $('.mapGroupG1').click(function (event) {
                    var ss = (event.target.id).split("_");
                    core.renderGroup1(element, parseFloat(ss[1]));
                });

                $('.mapGroupG2').mouseover(function () {
                    $(this).toggleClass('mapHouverbt')
                });

                $('.mapGroupG2').mouseout(function () {
                    $(this).removeClass('mapHouverbt')
                });

                $('.mapGroupG2').click(function (event) {
                    var ss = (event.target.id).split("_");
                    core.renderGroup2(element, parseFloat(ss[1]));
                });
                                
                //toggle days in month
                for (var p = 1; p <= 31; p++)
                {
                    $("#zoomDay_" + p).click(function (event) {
                        var ss = (event.target.id).split("_");
                        for (var j = 0; j <= index; j++)                        
                            $("#rowZoomDay_" + j + "_" + ss[1]).toggleClass("mapToggleDays");
                    })
                    .mouseover(function () {
                        $(this).toggleClass('mapHouverbt')
                    })
                    .mouseout(function () {
                        $(this).removeClass('mapHouverbt')
                    });
                }

                //render holidays
                core.renderHolidays(element, "year", 0, 0);                
            },

            /// drill first column
            renderGroup1: function (element, id)
            {
                var newMain = '';
                var dateStart = '';
                var index = -1;
                var dateMonth = 0;
                var idName = "";
                core.contextMonthClear();
                
                $(mainDiv).empty();
                newMain = core.renderTopPanels(element, "", "specify");
                $(mainDiv).append(newMain);                
                $.each(element.source, function (i, entry) {
                    
                    if (element.source[i][fields.id] == id) {
                        $.each(entry["values"], function (j, values) {
                            if (element.source[i][fields.name] != "")
                                idName = element.source[i][fields.name];

                            dateStart = formatDate(values[fields.date]);
                            if (dateStart != "") {
                                var daySplit = dateStart.split('-');
                                dateMonth = parseFloat(daySplit[1]);                                
                                core.setContextMonth(dateMonth);
                                if (index != i)
                                    $("#rowyear_" + dateMonth).closest("tr").after(core.renderInMonthMiddle(entry["values"].length, entry[fields.desc], i, dateMonth, entry[fields.id], entry[fields.descid]));

                                var bar = $('<div class="bar"><div style="margin-top:0;">' + values[fields.customLabel] + '</div></div>')
                                                                                              .addClass(values[fields.customClass])
                                                                                              .attr('title', values[fields.customTitle]);

                                $("#rowZoomDay_" + i + "_" + parseFloat(daySplit[0])).append(bar);
                                                               

                            }
                            index = i;
                        });
                    }
                });

                $("#specialdivName").text(idName)
                                    .css("color", "#6E829A");

                $('.mapGroupG1').each(function (i, obj) {                    
                    if ($(this).text() == "1") {
                        $(this).append(" " + element.sumText[0]);
                    } else {
                        $(this).append(" " + element.sumText[1]);
                    }
                });

                $('.mapGroupG1').addClass('mapSum');

                //hide month without data
                core.setVisibleMonths();

                /// select all checkboxes if multiselected
                selectCheckBoxes();
                
                //validate if its collapse or not
                if (element.groupingView["groupCollapse"]) {
                    var counter = 1;
                    $.each(context_month, function (i, value) {
                        if (value == 1) {
                            $(".dateM_" + counter).hide();
                            $("#group_" + counter).toggleClass('mapYearUnGroup');
                        }
                        counter++;
                    });
                }
                             
                $('.mapDivButtonB').mouseover(function () {
                    $(this).toggleClass('mapHouverbt')
                });

                $('.mapDivButtonB').mouseout(function () {
                    $(this).removeClass('mapHouverbt')
                });

                $(".mapDivButtonB").click(function () {
                    core.init(element);
                });


                //append last row
                core.filters(element, "year");

                //render last border                    
                $(".dateM_" + parseFloat(lastTr) + ":last").find('td').each(function () {
                    $(this).css("border-bottom", "1px solid #DDDDDD");
                });

                //render current day
                $("#zoomDay_" + day).css("background-color", "#9F9F9F");
                $("#zoomDay_" + day).css("color", "#ffffff");
                $("#zoomDay_" + day).css("font-weight", "bold");

                //render 
                if (element.headerTitle == "") {
                    $('.mapHeaderMonth').css("border-left", "none");
                }

                //render saturdays and sundays
                core.renderWeekend(element, index, "year", 0);
                $('#special_div').css("border-right", "none");               

                //remove month days not supported
                core.renderDayMonthNull(element);

                //toggle days in month
                for (var p = 1; p <= 31; p++) {
                    $("#zoomDay_" + p).click(function (event) {
                        var ss = (event.target.id).split("_");
                        for (var j = 0; j <= index; j++)
                            $("#rowZoomDay_" + j + "_" + ss[1]).toggleClass("mapToggleDays");
                    })
                    .mouseover(function () {
                        $(this).toggleClass('mapHouverbt')
                    })
                    .mouseout(function () {
                        $(this).removeClass('mapHouverbt')
                    });
                }

                //render holidays
                core.renderHolidays(element, "year", 0, 0);
                
            },

            /// drill second column
            renderGroup2: function (element, id)
            {
                var newMain = '';
                var dateStart = '';
                var index = -1;
                var dateMonth = 0;
                var idName = "";
                core.contextMonthClear();

                $(mainDiv).empty();
                newMain = core.renderTopPanels(element, "", "specify");
                $(mainDiv).append(newMain);
                $.each(element.source, function (i, entry) {
                    if (element.source[i][fields.descid] == id) {
                        $.each(entry["values"], function (j, values) {
                            if (entry[fields.name] == "")
                                idName = core.findInArray(element, entry[fields.id]);
                            else
                                idName = entry[fields.name];

                            dateStart = formatDate(values[fields.date]);
                            if (dateStart != "") {
                                var daySplit = dateStart.split('-');
                                dateMonth = parseFloat(daySplit[1]);
                                core.setContextMonth(dateMonth);
                                if (index != i)
                                    $("#rowyear_" + dateMonth).closest("tr").after(core.renderInMonthMiddle(idName, entry[fields.desc], i, dateMonth, entry[fields.id], entry[fields.descid]));

                                var bar = $('<div class="bar"><div style="margin-top:0;">' + values[fields.customLabel] + '</div></div>')
                                                                                              .addClass(values[fields.customClass])
                                                                                              .attr('title', values[fields.customTitle]);

                                $("#rowZoomDay_" + i + "_" + parseFloat(daySplit[0])).append(bar);
                            }
                            index = i;
                        });
                    }
                });
                                            
                //hide month without data
                core.setVisibleMonths();

                /// select all checkboxes if multiselected
                selectCheckBoxes();

                //validate if its collapse or not
                if (element.groupingView["groupCollapse"]) {
                    var counter = 1;
                    $.each(context_month, function (i, value) {
                        if (value == 1) {
                            $(".dateM_" + counter).hide();
                            $("#group_" + counter).toggleClass('mapYearUnGroup');
                        }
                        counter++;
                    });
                }

                $('.mapDivButtonB').mouseover(function () {
                    $(this).toggleClass('mapHouverbt')
                });

                $('.mapDivButtonB').mouseout(function () {
                    $(this).removeClass('mapHouverbt')
                });

                $(".mapDivButtonB").click(function () {
                    core.init(element);
                });

                //append last row
                core.filters(element, "year");

                //render last border                                    
                $(".dateM_" + parseFloat(lastTr) + ":last").find('td').each(function () {
                    $(this).css("border-bottom", "1px solid #DDDDDD");
                });

                //render current day
                $("#zoomDay_" + day).css("background-color", "#9F9F9F");
                $("#zoomDay_" + day).css("color", "#ffffff");
                $("#zoomDay_" + day).css("font-weight", "bold");

                //render 
                if (element.headerTitle == "") 
                    $('.mapHeaderMonth').css("border-left", "none");                

                //render saturdays and sundays
                core.renderWeekend(element, index, "year", 0);
                $('#special_div').css("border-right", "none");
              
                //remove month days not supported
                core.renderDayMonthNull(element);

                //toggle days in month
                for (var p = 1; p <= 31; p++) {
                    $("#zoomDay_" + p).click(function (event) {
                        var ss = (event.target.id).split("_");
                        for (var j = 0; j <= index; j++)
                            $("#rowZoomDay_" + j + "_" + ss[1]).toggleClass("mapToggleDays");
                    })
                    .mouseover(function () {
                        $(this).toggleClass('mapHouverbt')
                    })
                    .mouseout(function () {
                        $(this).removeClass('mapHouverbt')
                    });
                }

                //render holidays
                core.renderHolidays(element, "year", 0, 0);
            },
            
            /// calculate the total number of days in month
            setVisibleMonths: function()
            {
                var counter = 1;
                $.each(context_month, function (i, value) {
                    if (value == 0) {
                        $("#rowyear_" + counter).hide();
                    } else {
                        $("#group_" + counter).click(function () {                            
                            core.renderClicked(this.id);                        
                        });
                        lastTr = counter;;
                    }
                    counter++;
                });                
            },

            renderClicked: function (id){                
                var strsplit = id.split('_');
                $("#group_" + parseFloat(strsplit[1])).toggleClass('mapYearUnGroup');
              
                if (!$('#group_' + parseFloat(strsplit[1])).hasClass('mapYearUnGroup'))
                    $(".dateM_" + parseFloat(strsplit[1])).show();
                else
                    $(".dateM_" + parseFloat(strsplit[1])).hide();                
            },

            renderFilterClicked: function(element)
            {               
                $("#dialog").dialog({                    
                    position: 'center',
                    width: 670
                });
            },

            /// render UI top 
            renderTopPanels: function (element, currentMonth, type)
            {
                if (type == "specify") {
                    var inMonthTop = '<table id="mainTable" class="mapTopTable" cellspacing="0" cellpadding="0">' +
                                     '<tr>' +
                                     '<td colspan="3" class="mapYear">' + element.headerYear + ' ' + element.year + '</td>';

                    if (!element.multiSelect)
                        inMonthTop += '<td colspan="30" id="monthZoomOut" class="mapHeaderMonth">';
                    else
                        inMonthTop += '<td colspan="31" id="monthZoomOut" class="mapHeaderMonth">';

                    inMonthTop += '<div class="mapDivButtonB">' + element.buttons[2] + '</div>';
                                        
                    if (currentMonth != "")
                        inMonthTop += '<div class="mapDivHeaderText">' + element.months[parseFloat(currentMonth) - 1] + '</div>';

                    inMonthTop += '</td></tr><tr>';

                    if (element.multiSelect)
                        inMonthTop += '<td class="mapGroupHeader">'+
                                      '<input type="checkbox" class="checkboxes" name="check" id="check_0" value="">'+
                                      '</td>';

                    if (element.group1Text != "")
                        inMonthTop += '<td id="specialdivName" class="mapGroup"><span class="mapColHeader">' + element.group1Text + '</span></td>';
                    else
                        inMonthTop += '<td class="mapGroupNone"></td>';

                    if (element.group2Text != "")
                        inMonthTop += '<td id="special_div" class="mapGroup"><span class="mapColHeader">' + element.group2Text + '</span></td>';
                    else
                        inMonthTop += '<td class="mapGroupNone"></td>';

                    for (var p = 1; p <= 31; p++)
                        inMonthTop += '<td class="zoomMonthDay" id="zoomDay_' + p + '">' + p + '</td>';

                    inMonthTop += '</tr>';

                    if (element.multiSelect) {
                        for (var p = 0; p < 12; p++)
                            inMonthTop += '<tr id="rowyear_' + (p + 1) + '"><td colspan="34" class="mapYHeaderMonth"><span class="mapYearGroup" id="group_' + (p + 1) + '"></span><span class="mapYearGroupHeader"> ' + (element.months[p]).toUpperCase() + '</span></td></tr>';

                    } else {
                        for (var p = 0; p < 12; p++)
                            inMonthTop += '<tr id="rowyear_' + (p + 1) + '"><td colspan="33" class="mapYHeaderMonth"><span class="mapYearGroup" id="group_' + (p + 1) + '"></span><span class="mapYearGroupHeader"> ' + (element.months[p]).toUpperCase() + '</span></td></tr>';
                    }

                    inMonthTop += '<table>';
                    return inMonthTop;
                }

                if (type == "month") {

                    var inMonthTop = '<table id="mainTable" class="mapTopTable" cellspacing="0" cellpadding="0">' +
                                       '<tr>' +
                                       '<td colspan="3" class="mapYear">' + element.headerYear + ' ' + element.year + '</td>';

                    if (element.multiSelect)
                        inMonthTop += '<td colspan="31" id="monthZoomOut" class="mapHeaderMonth">';
                    else
                        inMonthTop += '<td colspan="30" id="monthZoomOut" class="mapHeaderMonth">';

                    inMonthTop += '<div class="mapDivButtonB">' + element.buttons[2] + '</div>' +
                                  '<div class="mapDivHeaderText">' + element.months[parseFloat(currentMonth) - 1] + '</div>' +
                                  '</td></tr><tr>';
                    
                    if (element.multiSelect)
                        inMonthTop += '<td class="mapGroupHeader">' +
                                      '<input type="checkbox" class="checkboxes" name="check" id="check_0" value="">' +
                                      '</td>';

                    if (element.group1Text != "")                   
                        inMonthTop += '<td id="specialdivName" class="mapGroup">' + element.group1Text + '</td>';
                    else
                        inMonthTop += '<td class="mapGroupNone"></td>';

                    if (element.group2Text != "")                   
                        inMonthTop += '<td id="special_div" class="mapGroup">' + element.group2Text + '</td>';
                    else
                        inMonthTop += '<td class="mapGroupNone"></td>';
                   
                    for (var p = 1; p <= 31; p++)
                        inMonthTop += '<td class="zoomMonthDay" id="zoomDay_' + p + '">' + p + '</td>';

                    inMonthTop += '</tr><table>';
                    return inMonthTop;
                }

                if (type = "year") {
                    var inMonthTop = '<table id="mainTable" class="mapTopTable" cellspacing="0" cellpadding="0">' +
                                        '<tr>' +
                                        '<td colspan="3" class="mapYear">' + element.headerYear + ' ' + element.year + '</td>';
                    if (element.multiSelect)
                        inMonthTop += '<td colspan="31" class="mapHeaderMonth">';
                    else
                        inMonthTop += '<td colspan="30" class="mapHeaderMonth">';

                    inMonthTop += '<div class="mapDivButtonY">' + element.buttons[0] + '</div>' +
                                        '<div class="mapDivButtonM">' + element.buttons[1] + '</div>' +
                                        '<div class="mapDivHeaderText">' + element.headerTitle + '</div>' +
                                        '</td></tr><tr>';
                    
                    
                    if (element.multiSelect)
                        inMonthTop += '<td class="mapGroupHeader">' + checkMultiSelect(0, element.multiSelect, 1) + '</td>';

                    if (element.group1Text != "")
                        inMonthTop += '<td id="specialdivName" class="mapGroup"><span class="mapColHeader">' + element.group1Text + '</span></td>';
                    else
                        inMonthTop += '<td class="mapGroupNone"></td>';

                    if (element.group2Text != "")
                        inMonthTop += '<td id="special_div" class="mapGroup"><span class="mapColHeader">' + element.group2Text + '</span></td>';
                    else
                        inMonthTop += '<td class="mapGroupNone"></td>';

                    for (var p = 1; p <= 31; p++)
                        inMonthTop += '<td class="zoomMonthDay" id="zoomDay_' + p + '">' + p + '</td>';

                    inMonthTop += '</tr>';

                    if (element.multiSelect)
                    {
                        for (var p = 0; p < 12; p++)
                            inMonthTop += '<tr id="rowyear_' + (p + 1) + '"><td colspan="34" class="mapYHeaderMonth"><span class="mapYearGroup" id="group_' + (p + 1) + '"></span><span class="mapYearGroupHeader"> ' + (element.months[p]).toUpperCase() + '</span></td></tr>';

                    } else {
                        for (var p = 0; p < 12; p++)
                            inMonthTop += '<tr id="rowyear_' + (p + 1) + '"><td colspan="33" class="mapYHeaderMonth"><span class="mapYearGroup" id="group_' + (p + 1) + '"></span><span class="mapYearGroupHeader"> ' + (element.months[p]).toUpperCase() + '</span></td></tr>';
                    }
                    
                    inMonthTop += '<table>';
                    return inMonthTop;
                }              
            },

            renderInMonthMiddle: function (elementName, elementDesc, index, datemonth, id, descid)
            {                                
                var middleMain = '<tr class="dateM_' + datemonth + '">';

                if (options.multiSelect)
                    middleMain += '<td class="mapGroupHeader"><input type="checkbox" class="checkboxes" name="check" id="check_' + index + '" value="' + id + '"></td>';
                                
                middleMain += '<td class="mapGroupG1" id="mapGid_' + id + '">' + elementName + '</td> <td id="mapGid_' + descid + '" class="mapGroupG2">' + elementDesc + '</td>';

                for (var p = 1; p <= 31; p++)
                    middleMain += '<td class="zoomMiddleMonthDay" id="rowZoomDay_' + index + '_' + p +'"></td>';
                  
                middleMain += '</tr>';
                return middleMain;
            },

            setContextMonth: function (cmonth)
            {
                switch (cmonth)
                {                    
                    case 1: context_month[0] = 1; break; //january
                    case 2: context_month[1] = 1; break;
                    case 3: context_month[2] = 1; break;
                    case 4: context_month[3] = 1; break;
                    case 5: context_month[4] = 1; break;
                    case 6: context_month[5] = 1; break;
                    case 7: context_month[6] = 1; break;
                    case 8: context_month[7] = 1; break;
                    case 9: context_month[8] = 1; break;
                    case 10: context_month[9] = 1; break;
                    case 11: context_month[10] = 1; break;
                    case 12: context_month[11] = 1; break;
                }
            },

            renderDialog: function (element) {
                var nn = [];
                var dd = [];

                if ($('#dialog').length == 0) {
                    $('<div id="dialog" class="dialogMap" style="display:none;"><div>').insertAfter(mainDiv);

                    var tb = '<div style="text-align:right;margin-bottom:7px;"><button id="map_filtergo" class="mapBt" type="button">' + element.filterBtGo + '</button>'+
                              '<button id="filterClose" class="mapBt" type="button" style="margin-left:5px;">' + element.filterBtClose + '</button></div>' +
                      '<table width="100%" border="0" >'+
                      '<tr> '+
                       '<td width="45%">'+
                           '<table width="100%" border="0" class="map-filter-table">' +
                                '<tr>'+
                                    '<td style="width:40%; font-size:7pt; height:25px; font-weight:bold; padding-left:5px;">' + element.group1Text + '</td>' +
                                    '<td style="font-size:7pt; text-align:right; color: #ACACAC;padding-right:5px;">' + element.filterList + '</td>' +
                                '</tr>'+
                                '<tr>'+
                                    '<td colspan="2"><select id="select_group1" class="mapFilterSelect" multiple="multiple"></select></td>' +
                                '</tr>'+
                                '<tr style="height: 30px;">' +
                                    '<td><button id="allTo2" type="button" class="mapBt"> ' + element.filterBtMove + ' </button></td>' +
                                    '<td style="text-align:right;font-size:7pt;">' + element.filterTitle + ' <input id="box1Filter" class="mapTxt" type="text">' +
                                '</tr>'+
                            '</table>' +
                       '</td>'+
                        '<td width="7%" style="text-align:center">' +
                            '<button id="to2" type="button" class="mapBt" style="margin-bottom: 5px;"> > </button><br>' +
                            '<button id="to1" type="button" class="mapBt"> < </button>'+                            
                        '</td></td>'+
                        '<td width="45%">'+
                            '<table width="100%"  border="0" class="map-filter-table">' +
                               '<tr>'+
                                   '<td style="width:40%; font-size:7pt; height:25px; font-weight:bold; padding-left:5px;">' + element.group1Text + '</td>' +
                                   '<td style="font-size:7pt; text-align:right; color: #ACACAC;padding-right:5px;">' + element.filterList + '</td>' +
                               '</tr>'+
                               '<tr>'+
                                   '<td colspan="2"><select id="select_group1s" class="mapFilterSelect" multiple="multiple"></select></td>' +
                               '</tr>'+
                               '<tr style="height: 30px;">' +
                                   '<td><button id="allTo1" type="button" class="mapBt"> ' + element.filterBtMove + ' </button></td>' +
                                   '<td style="text-align:right;font-size:7pt;">' +
                                        '' + element.filterTitle + ' <input id="box1sFilter" type="text" class="mapTxt">' +
                                   '</td>' +
                               '</tr>'+
                           '</table>' +
                        '</td>'+
                      '</tr>'+
                      '<tr>'+
                      '  <td colspan="3"></td>'+
                      '</tr>'+
                      '<tr>'+
                      '<td>'+
                        '<table width="100%"  border="0" class="map-filter-table">' +
                             '<tr>'+
                                 '<td style="width:40%; font-size:7pt; height:25px; font-weight:bold; padding-left:5px;">' + element.group2Text + '</td>' +
                                 '<td style="font-size:7pt; text-align:right; color: #ACACAC; padding-right:5px;">' + element.filterList + '</td>' +
                             '</tr>'+
                             '<tr>'+
                                 '<td colspan="2"><select id="select_group2" class="mapFilterSelect" multiple="multiple"></select></td>' +
                             '</tr>'+
                             '<tr style="height: 30px;">'+
                                 '<td><button id="allTo2s" type="button" class="mapBt"> ' + element.filterBtMove + ' </button></td>' +
                                 '<td style="text-align:right;font-size:7pt;">' + element.filterTitle + ' <input id="box2Filter" class="mapTxt" type="text">' +
                             '</tr>'+
                         '</table>' +
                      '</td>'+
                      '<td style="text-align:center">' +
                        '<button id="to2s" type="button" class="mapBt" style="margin-bottom: 5px;"> > </button><br>' +
                        '<button id="to1s" type="button" class="mapBt"> < </button></td>' +
                       '<td>'+
                            '<table width="100%"  border="0" class="map-filter-table">' +
                                 '<tr>' +
                                     '<td style="width:40%; height:25px; font-size:7pt; font-weight:bold; padding-left:5px;">' + element.group2Text + '</td>' +
                                     '<td style="font-size:7pt; text-align:right; color: #ACACAC;padding-right:5px;">' + element.filterList + '</td>' +
                                 '</tr>' +
                                 '<tr>' +
                                     '<td colspan="2"><select id="select_group2s" class="mapFilterSelect" multiple="multiple"></select></td>' +
                                 '</tr>' +
                                 '<tr style="height: 30px;">' +
                                     '<td><button id="allTo1s" type="button" class="mapBt"> ' + element.filterBtMove + ' </button></td>' +
                                     '<td style="text-align:right;font-size:7pt;">' + element.filterTitle + ' <input id="box2sFilter" class="mapTxt" type="text">' +
                                 '</tr>' +
                             '</table>' +
                       '</td>'+
                      '</tr>'+
                    '</table>';

                    $('#dialog').append(tb);
                                        
                    //append data to select boxes
                    $.each(element.source, function(i, values){
                        //check for repetaded
                        if (jQuery.inArray(values[fields.id], nn) == -1)
                        {
                            nn.push(values[fields.id]);                            
                            $('#select_group1s')
                               .append($("<option></option>")
                               .attr("value", values[fields.id])
                               .text(values[fields.name]))
                               .prop("title", "ID: " + values[fields.id]);
                        }

                        if (jQuery.inArray(values[fields.descid], dd) == -1) {
                            dd.push(values[fields.descid]);                            
                            $('#select_group2s')
                               .append($("<option></option>")
                               .attr("value", values[fields.descid])
                               .text(values[fields.desc]));
                        }
                    });

                    orderSelected('#select_group1s');
                    orderSelected('#select_group2s');

                    //events
                    $("#to2").click(function () {                        
                        if ($('#select_group1 :selected').length != 0)                        
                            $('#select_group1 option:selected').remove().appendTo('#select_group1s');
                    });
                    $("#to2s").click(function () {
                        if ($('#select_group2 :selected').length != 0)
                            $('#select_group2 option:selected').remove().appendTo('#select_group2s');
                    });
                    $("#to1").click(function () {
                        if ($('#select_group1s :selected').length != 0)
                            $('#select_group1s option:selected').remove().appendTo('#select_group1');
                    });
                    $("#to1s").click(function () {
                        if ($('#select_group2s :selected').length != 0)
                            $('#select_group2s option:selected').remove().appendTo('#select_group2');
                    });
                    $("#allTo2").click(function () {  $('#select_group1 option').remove().appendTo('#select_group1s'); });
                    $("#allTo1").click(function () {  $('#select_group1s option').remove().appendTo('#select_group1'); });
                    $("#allTo2s").click(function () { $('#select_group2 option').remove().appendTo('#select_group2s'); });
                    $("#allTo1s").click(function () { $('#select_group2s option').remove().appendTo('#select_group2'); });
                                     
                    $('#select_group1s').filterByText($('#box1sFilter'), true);
                    $('#select_group1').filterByText($('#box1Filter'), true);
                    $('#select_group2s').filterByText($('#box2sFilter'), true);
                    $('#select_group2s').filterByText($('#box2Filter'), true);

                    $("#box1Clear").click(function () { $("#box1Filter").val(""); });
                    $("#box1sClear").click(function () { $("#box1sFilter").val(""); });
                    $("#box2Clear").click(function () { $("#box2Filter").val(""); });
                    $("#box2sClear").click(function () { $("#box2sFilter").val(""); });
                }              
            },
            
            filterAllData: function ()
            {
                newElement = null;
                newElement = $.extend(true, {}, options);
                
                names_arr = Array.prototype.slice.call($("#select_group1s > option").map(function () { return $(this).val(); }));
                desc_array = Array.prototype.slice.call($("#select_group2s > option").map(function () { return $(this).val(); }));                
                newElement.source = jQuery.grep(newElement.source, function (newElement, index) {
                    return $.inArray(newElement.id.toString(), names_arr) > -1 && $.inArray(newElement.desc_id.toString(), desc_array) > -1;
                });                
                
                names_arr = undefined;
                desc_array = undefined;

                core.init(newElement);

                jQuery('#dialog').dialog('close');
            },

            renderWeekend: function (element, index, type, cmonth)
            {
                var counter = 1;
                if (element.multiSelect)
                    counter = 2;

                var num;
                if (type == "year") {
                    //render saturdays and sundays
                    for (var p = 1; p <= 12; p++) {
                        //check if visible 
                        if ($("#rowyear_" + p).is(":visible")) {
                            var daysMonth = daysInMonth(p - 1, element.year);
                            $("tr.dateM_" + p).each(function () {
                                $(this).find("td").each(function (j, value) {
                                    if ((j - 1) < (daysMonth + 1)) {
                                        if ((p.toString().length > 1) && (j - counter).toString().length > 1) {
                                            num = getWeekName(element, element.year + "-" + p + "-" + (j - counter), "number");
                                        } else {
                                            if ((p.toString().length > 1) && (j - counter).toString().length == 1) {
                                                num = getWeekName(element, element.year + "-" + p + "-0" + (j - counter), "number");
                                            } else {
                                                if ((p.toString().length == 1) && (j - counter).toString().length > 1) {
                                                    num = getWeekName(element, element.year + "-0" + p + "-" + (j - counter), "number");
                                                } else {
                                                    if ((p.toString().length == 1) && (j - counter).toString().length == 1)
                                                        num = getWeekName(element, element.year + "-0" + p + "-0" + (j - counter), "number");
                                                }
                                            }
                                        }
                                        
                                        if (num == 0) {                                            
                                            $(this).text(element.weeksDow[0]);
                                            $(this).addClass("mapWeekends");                                            

                                        } else {
                                            if (num == 6) {
                                                $(this).text(element.weeksDow[1]);
                                                $(this).addClass("mapWeekends");
                                            }
                                        }
                                    }
                                });
                            });
                        }
                    }
                }
                
                if (type == "month") {
                    for (var p = 1; p <= index; p++) {
                        var daysMonth = daysInMonth(cmonth, element.year);
                        $("tr.dateM_" + p).each(function () {
                            $(this).find("td").each(function (j, value) {
                                if ((j - 1) < (daysMonth + 1)) {                                    
                                    if ((cmonth.toString().length > 1) && (j - counter).toString().length > 1) {
                                        num = getWeekName(element, element.year + "-" + cmonth + "-" + (j - counter), "number");
                                    } else {
                                        if ((cmonth.toString().length > 1) && (j - counter).toString().length == 1) {
                                            num = getWeekName(element, element.year + "-" + cmonth + "-0" + (j - counter), "number");
                                        } else {
                                            if ((cmonth.toString().length == 1) && (j - counter).toString().length > 1) {
                                                num = getWeekName(element, element.year + "-0" + cmonth + "-" + (j - counter), "number");
                                            } else {
                                                if ((cmonth.toString().length == 1) && (j - counter).toString().length == 1)
                                                    num = getWeekName(element, element.year + "-0" + cmonth + "-0" + (j - counter), "number");
                                            }
                                        }
                                    }                                    
                                    if (num == 0) {
                                        $(this).text(element.weeksDow[0]);
                                        $(this).addClass("mapWeekends");

                                    } else {
                                        if (num == 6) {
                                            $(this).text(element.weeksDow[1]);
                                            $(this).addClass("mapWeekends");
                                        }
                                    }
                                }
                            });
                        });
                    }
                }
            },

            renderDayMonthNull: function (element)
            {                
                var counter = 2;
                if (element.multiSelect)
                    counter = 3

                for (var p = 1; p <= 12; p++) {
                    //check if visible 
                    if ($("#rowyear_" + p).is(":visible")) {
                        var daysMonth = daysInMonth(p - 1, element.year);

                        $("tr.dateM_" + p).each(function () {
                            $(this).find("td").each(function (j, value) {
                                if ((j - counter) >= daysMonth)
                                    $(this).text("X").addClass("mapNoMonthDays");

                            });
                        });
                    }
                }
            },

            contextMonthClear: function () {
                context_month = new Array(12);
                for (var p = 0; p < context_month.length; p++)
                    context_month[p] = 0;
            },

            findInArray: function (element, id)
            {
                var result = "";
                $.each(element.source, function (i, value) {                  
                    if (value[fields.id] == id)  
                        if (value[fields.name] != "")                             
                            result = value[fields.name];                        
                    
                });
                return result;
            }
        }
              
        options = $.extend({}, $.fn.mapping.dates, options);
        core.init(options);        
    };   

})(jQuery);

