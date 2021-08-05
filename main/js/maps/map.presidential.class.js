var PresidentialMap = function(map_string) {

    InteractiveMap.call(this);

    /***** MAP VARIABLES *****/
    var m = this;

    this.map_string  = map_string;
    this.election_type = 'presidential';
    this.majority_needed = 270;
    this.current_year = '';

    this.default_dem_candidate_name = 'Democrats';
    this.default_rep_candidate_name = 'Republicans';
    this.default_ind_candidate_name = 'Other';

    // The order of FIPS codes for building map_strings (110021211 etc)
    this.state_order = ["02", "01", "05", "04", "06", "08", "09", "11", "10", "12", "13", "15", "19", "16", "17", "18", "20", "21", "22", "25", "24", "MX", "26", "27", "29", "28", "30", "37", "38", "NX", "33", "34", "35", "32", "36", "39", "40", "41", "42", "44", "45", "46", "47", "48", "49", "51", "50", "53", "55", "54", "56", "M3", "M4", "N3", "N4", "N5"];

    // Small States
    this.smallStates = ["01", "02", "04", "05", "06", "08", "09", "10", "11", "12", "13", "15", "16", "17", "18", "19", "20", "21", "22", "24", "25", "26", "27", "28", "29", "30", "32", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "44", "45", "46", "47", "48", "49", "50", "51", "53", "54", "55", "56" ];

    // Split States
    this.splitStates = ["23", "31"];

    // Special Elections in Nebraska and Maine
    this.specialStates = ["23", "MX", "M3", "M4", "31", "NX", "N3", "N4", "N5"];

    // Override Rating colors
    this.ratingColors["I"] = "#CCAD29";

    // Override State Positions
    this.statePositions["12x"] = "1";
    this.statePositions["13x"] = "-12";
    this.statePositions["33y"] = "-6";
    this.statePositions["45x"] = "-6";
    this.statePositions["47y"] = "-10";
    this.statePositions["42y"] = "-12";

    /***** MAP METHODS *****/

    /**
     * Initialize and draw the map
     */
    this.init = function () {
        if (this.debug == 1)
            console.log('m.init()');

        if (this.map_string_cookie_name && $('#map-wrapper').attr('map_type_mode') == 'default') {
            var map_string_cookie = getCookie(this.map_string_cookie_name);
            if (map_string_cookie) {
                this.map_string = map_string_cookie;
                this.setUserGenerated();
            }
        }

        if (!this.current_year) {
            this.current_year = this.election_year;
        }

        this.buildStates();
        // this.generateD3();
        this.loadString(this.map_string);
        this.addEventListeners();

        $("#loading").remove();
        $('.wait-loading').css('opacity', 1);
		this.resize();

    };

    /**
     * Add event listeners
     */
    this.addEventListeners = function () {

        this.bindMapEvents();

        $('#show_3rd_party').click(function(){
            m.toggle3rdParty();
        });
        $('#dem_container .dropdown-item').click(function(){
            if (m.currentView == 'I') {
                m.dem_candidate_name = $(this).text();
                m.dem_candidate_id = $(this).attr('candidate_id');
                m.updateElectoralVotesHeader();
                m.setUserGenerated();

                if ($("input#democrat_option").length) {
                    $("input#democrat_option").val(m.dem_candidate_id);
                }
            }
        });
        $('#rep_container .dropdown-item').click(function(){
            if (m.currentView == 'I') {
                m.rep_candidate_name = $(this).text();
                m.rep_candidate_id = $(this).attr('candidate_id');
                m.updateElectoralVotesHeader();
                m.setUserGenerated();

                if ($("input#republican_option").length) {
                    $("input#republican_option").val(m.rep_candidate_id);
                }
            }
        });

    };

    /**
     * Build the object that holds data for the states/geometry
     */
    this.buildStates = function() {
        this.states = {};
        for (let state_fips_code in this.seats) {
            let seats = this.seats[state_fips_code];
            for (let seat_number in seats) {
                let seat = seats[seat_number];
                this.states[state_fips_code] = {"state_abbr": seat.state_abbr, "map_code": '9', "e_votes": 1};
                if (seat.map_code) {
                    this.states[state_fips_code].map_code = seat.map_code;
                }
                if (seat.e_votes) {
                    this.states[state_fips_code].e_votes = seat.e_votes;
                }
                if (seat.hex_color) {
                    this.states[state_fips_code].hex_color = seat.hex_color;
                }
                if (seat.special_election) {
                    this.specialStates.push(state_fips_code);

                    $("#sp_" + state_fips_code).append('<span class="state_info e_votes">' + seat.e_votes + '</span>');

                }
            }
        }
    };

    
    // Load a map string
    // SN: influences functionality for the single-vote states
    this.loadString = function (map_string) {
        if (this.debug == 1)
            console.log('m.loadString(' + map_string + ')');

        if (map_string.length == this.state_order.length) {
            var index = 0;

            for (var i = 0; i <= this.state_order.length - 1; i += 1) {
                var state_rating_code = map_string.substr(i, 1);
                var fips = this.state_order[index];

                if (this.races.hasOwnProperty(fips)) {
                    this.races[fips].map_code = state_rating_code;
                }
                this.states[fips].map_code = state_rating_code;
                this.seats[fips][0].map_code = state_rating_code;

                index++;
            }

            this.setSplitVotes();

            this.map_string = map_string;

            this.updateElectoralVotes(this.seats);
            this.colorizeMap();

            this.updateElectoralVotesHeader();

            // if ($("#road-to-270").length) {
                // var road_to_270_url = '/partials/road_to_270.php?mapstr=' + this.map_string;
                // $.ajax({
                    // url: road_to_270_url, success: function (result) {
                        // $("#road-to-270").html(result);
                    // }
                // });
            // }

            if (map_string.indexOf("a") > -1 || map_string.indexOf("b") > -1) {
                this.colorMode = 4;
            } else if (map_string.indexOf("3") > -1 || map_string.indexOf("4") > -1) {
                this.colorMode = 3;
            } else if (map_string.indexOf("5") > -1 || map_string.indexOf("6") > -1) {
                this.colorMode = 2;
            } else {
                this.colorMode = 1;
            }

            if (map_string.indexOf("7") > -1) {
                $('#show_3rd_party').attr('checked', 'checked');
                m.toggle3rdParty();
            }

            this.resetPalette();
        }
    };

    
    // Display the interactive presidential map
    // SN: doesn't seem to influence map in any way
	// SN: potential problem here     
    this.interactiveMap = function () {
        if (this.debug == 1)
            console.log('m.interactiveMap()');
    };

	// Set the cookies
	// SN: code for reseting the map
    this.setCookies = function () {
        if (this.debug == 1)
            console.log("m.setCookies");
        if (this.map_string_cookie_name) setCookie(this.map_string_cookie_name, this.map_string, 365, this.cookie_path);
        if (this.color_mode_cookie_name) setCookie(this.color_mode_cookie_name, this.colorMode, 365, this.cookie_path);
    };

	// Remove the cookies
	// SN: code for reseting the map
    this.removeCookies = function () {
        if (this.debug == 1)
            console.log("m.removeCookie");
        if (this.map_string_cookie_name) deleteCookie(this.map_string_cookie_name, this.cookie_path);
        if (this.color_mode_cookie_name) deleteCookie(this.color_mode_cookie_name, this.cookie_path);
    };

    
    // Save the map
    // SN: doesn't seem to influence map in any way
	// SN: potential problem here
    this.saveMap = function () {
        if (this.debug == 1)
            console.log("m.saveMap");

        // $.post('/interactive-maps/presidential/save_map.php', {
            // map_string: this.map_string,
            // election_year: this.current_year,
            // republican_option: this.rep_candidate_id,
            // democrat_option: this.dem_candidate_id,
            // independent_option: this.ind_candidate_id,

        // }
		
		// , function (data) {
            // if (m.debug == 1)
                // console.log(data);

            // if (data["hashid"]) {
                // m.hashid = data["hashid"];
                // m.url_slug = data["hashid"];
                // m.date_created_formatted = data["date_created_formatted"];
                // m.mapSaved();
            // }

        // }, "JSON");
    };

	// Set Split Votes 
	// SN: also influences functionality for party selection for the single-vote states
    this.setSplitVotes = function () {
        var state_code_rating_me = String(this.seats["MX"][0].map_code) + String(this.seats["M3"][0].map_code) + String(this.seats["M4"][0].map_code);
        this.states["23"].map_code = state_code_rating_me;

        var state_code_rating_ne = String(this.seats["NX"][0].map_code) + String(this.seats["N3"][0].map_code) + String(this.seats["N4"][0].map_code) + String(this.seats["N5"][0].map_code);
        this.states["31"].map_code = state_code_rating_ne;
    };

	// Callback method after is clicked
	// SN: doesn't seem to influence map in any way
	// SN: potential problem here
    this.stateClickCallback = function (stateID) {
        if (this.specialStates.includes(stateID)) {
            for (let index in this.specialStates) {
                let fips = this.specialStates[index];
                this.states[fips].map_code = String(this.seats[fips][0].map_code);
            }
            this.setSplitVotes();
            this.colorizeMap();
        }

        // if ($("#road-to-270").length) {
            // var road_to_270_url = '/partials/road_to_270.php?mapstr=' + this.map_string;
            // $.ajax({
                // url: road_to_270_url, success: function (result) {
                    // $("#road-to-270").html(result);
                // }
            // });
        // }

        if ($("input#map_string").length) {
            $("input#map_string").val(this.map_string);
        }

        if (this.current_year != this.election_year) {
            $('#previous-election-msg').css('visibility', 'hidden');
            this.dem_candidate_name = this.default_dem_candidate_name;
            this.rep_candidate_name = this.default_rep_candidate_name;
            this.dem_candidate_id = '';
            this.rep_candidate_id = '';
            this.election_year = this.current_year;
            this.updateElectoralVotesHeader(stateID);
        }
    };

    // Toggle the 3rd party  
    this.toggle3rdParty = function () {
        $('#palette-chooser').toggleClass('show_3P');
        $('#palette_i').removeClass('selected');
    };

};
